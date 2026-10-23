package io.matchpoint.service;

import io.matchpoint.entity.RestoreRequest;
import io.matchpoint.repository.RestoreRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseBackupRestoreService {

    private final JdbcTemplate jdbcTemplate;
    private final RestoreRequestRepository restoreRequestRepository;

    /**
     * Startup verification: Automatically verify and initialize the restore requests table.
     */
    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS database_restore_requests (" +
                    "id UUID PRIMARY KEY," +
                    "backup_data TEXT NOT NULL," +
                    "requested_by VARCHAR(255) NOT NULL," +
                    "approved_by VARCHAR(255)," +
                    "status VARCHAR(50) NOT NULL," +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                    "expires_at TIMESTAMP NOT NULL" +
                    ")");
            log.info("Successfully validated/initialized 'database_restore_requests' table");
        } catch (Exception e) {
            log.error("Failed to dynamically check/create 'database_restore_requests' table: " + e.getMessage(), e);
        }
    }

    public Map<String, List<Map<String, Object>>> backupDatabase() {
        Map<String, List<Map<String, Object>>> backup = new LinkedHashMap<>();
        try (Connection conn = Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            
            // Query user tables in the public schema
            try (ResultSet rs = metaData.getTables(null, "public", "%", new String[]{"TABLE"})) {
                List<String> tableNames = new ArrayList<>();
                while (rs.next()) {
                    tableNames.add(rs.getString("TABLE_NAME"));
                }
                
                // Sort table names alphabetically
                Collections.sort(tableNames);
                
                for (String tableName : tableNames) {
                    // Skip database schema migrations or system catalog tables
                    if (tableName.startsWith("databasechangelog") || tableName.startsWith("pg_") || tableName.equals("database_restore_requests")) {
                        continue;
                    }
                    
                    List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM " + tableName);
                    List<Map<String, Object>> cleanRows = new ArrayList<>();
                    
                    for (Map<String, Object> row : rows) {
                        Map<String, Object> cleanRow = new LinkedHashMap<>();
                        for (Map.Entry<String, Object> entry : row.entrySet()) {
                            Object val = entry.getValue();
                            if (val instanceof java.sql.Array) {
                                try {
                                    // Extract raw Java array to prevent Jackson serialization loops
                                    cleanRow.put(entry.getKey(), ((java.sql.Array) val).getArray());
                                } catch (Exception e) {
                                    cleanRow.put(entry.getKey(), val);
                                }
                            } else {
                                cleanRow.put(entry.getKey(), val);
                            }
                        }
                        cleanRows.add(cleanRow);
                    }
                    
                    backup.put(tableName, cleanRows);
                    log.info("Backup: table '{}' read, rows count: {}", tableName, cleanRows.size());
                }
            }
        } catch (Exception e) {
            log.error("Failed to compile database backup: " + e.getMessage(), e);
            throw new RuntimeException("Database backup failed: " + e.getMessage(), e);
        }
        return backup;
    }

    /**
     * Enqueue a new database restore request with 24 hours expiration.
     */
    public RestoreRequest createRestoreRequest(String backupDataJSON, String requestedByAdmin) {
        RestoreRequest request = RestoreRequest.builder()
                .backupData(backupDataJSON)
                .requestedBy(requestedByAdmin)
                .status("PENDING")
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        return restoreRequestRepository.save(request);
    }

    /**
     * Fetch active pending restore requests. Expired requests are automatically marked as REJECTED.
     */
    public List<RestoreRequest> getPendingRestores() {
        List<RestoreRequest> requests = restoreRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        List<RestoreRequest> active = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (RestoreRequest r : requests) {
            if (r.getExpiresAt().isAfter(now)) {
                active.add(r);
            } else {
                r.setStatus("REJECTED");
                restoreRequestRepository.save(r);
            }
        }
        return active;
    }

    /**
     * Enforce Dual-Admin consent and execute the restore operation in a transaction.
     */
    @Transactional
    public void approveAndExecuteRestore(UUID requestId, String approvingAdmin) {
        RestoreRequest request = restoreRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Restore request not found"));
        
        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalStateException("Restore request is not pending");
        }
        if (request.getExpiresAt().isBefore(LocalDateTime.now())) {
            request.setStatus("REJECTED");
            restoreRequestRepository.save(request);
            throw new IllegalStateException("Restore request has expired");
        }
        if (request.getRequestedBy().equalsIgnoreCase(approvingAdmin)) {
            throw new IllegalArgumentException("Approval must be from a different Admin user");
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, List<Map<String, Object>>> data = mapper.readValue(
                    request.getBackupData(), 
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, List<Map<String, Object>>>>() {}
            );
            
            // Execute the actual database restore
            restoreDatabase(data);
            
            // Mark request as executed
            request.setStatus("EXECUTED");
            request.setApprovedBy(approvingAdmin);
            restoreRequestRepository.save(request);
            
            log.info("Database restore request '{}' successfully approved by '{}' and executed", requestId, approvingAdmin);
        } catch (Exception e) {
            log.error("Failed to parse and execute approved restore request: " + e.getMessage(), e);
            throw new RuntimeException("Restore execution failed: " + e.getMessage(), e);
        }
    }

    /**
     * Cancel/reject a restore request.
     */
    public void rejectRestore(UUID requestId) {
        RestoreRequest request = restoreRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Restore request not found"));
        request.setStatus("REJECTED");
        restoreRequestRepository.save(request);
        log.info("Restore request '{}' rejected by admin", requestId);
    }

    @Transactional
    public void restoreDatabase(Map<String, List<Map<String, Object>>> backupData) {
        try {
            // 1. Disable triggers and foreign keys temporarily in PostgreSQL session
            jdbcTemplate.execute("SET session_replication_role = 'replica'");

            // 2. Clear all tables present in the backup (excluding the restore requests table itself)
            for (String tableName : backupData.keySet()) {
                if (tableName.equals("database_restore_requests")) {
                    continue;
                }
                jdbcTemplate.execute("DELETE FROM " + tableName);
                log.info("Restore: cleared table '{}'", tableName);
            }

            // 3. Re-insert backup rows using connection callback to handle SQL arrays correctly
            jdbcTemplate.execute((Connection conn) -> {
                for (Map.Entry<String, List<Map<String, Object>>> entry : backupData.entrySet()) {
                    String tableName = entry.getKey();
                    if (tableName.equals("database_restore_requests")) {
                        continue;
                    }
                    List<Map<String, Object>> rows = entry.getValue();
                    if (rows.isEmpty()) {
                        continue;
                    }

                    log.info("Restore: importing {} rows into '{}'", rows.size(), tableName);
                    
                    Map<String, Object> firstRow = rows.get(0);
                    List<String> columns = new ArrayList<>(firstRow.keySet());
                    
                    StringBuilder queryBuilder = new StringBuilder("INSERT INTO ")
                            .append(tableName)
                            .append(" (");
                    for (int i = 0; i < columns.size(); i++) {
                        queryBuilder.append(columns.get(i));
                        if (i < columns.size() - 1) {
                            queryBuilder.append(", ");
                        }
                    }
                    queryBuilder.append(") VALUES (");
                    for (int i = 0; i < columns.size(); i++) {
                        queryBuilder.append("?");
                        if (i < columns.size() - 1) {
                            queryBuilder.append(", ");
                        }
                    }
                    queryBuilder.append(")");
                    String insertQuery = queryBuilder.toString();

                    for (Map<String, Object> row : rows) {
                        try (PreparedStatement pstmt = conn.prepareStatement(insertQuery)) {
                            for (int i = 0; i < columns.size(); i++) {
                                Object val = row.get(columns.get(i));
                                if (val instanceof String) {
                                    String s = (String) val;
                                    // Check and parse UUID
                                    if (s.length() == 36 && s.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")) {
                                        pstmt.setObject(i + 1, UUID.fromString(s));
                                    } else if (s.matches("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.*$")) {
                                        // Check and parse ISO Timestamps
                                        try {
                                            pstmt.setTimestamp(i + 1, java.sql.Timestamp.valueOf(s.replace("T", " ").substring(0, 19)));
                                        } catch (Exception e) {
                                            pstmt.setObject(i + 1, s);
                                        }
                                    } else {
                                        pstmt.setObject(i + 1, s);
                                    }
                                } else if (val instanceof List) {
                                    List<?> list = (List<?>) val;
                                    pstmt.setArray(i + 1, conn.createArrayOf("varchar", list.toArray()));
                                } else if (val instanceof Object[]) {
                                    pstmt.setArray(i + 1, conn.createArrayOf("varchar", (Object[]) val));
                                } else {
                                    pstmt.setObject(i + 1, val);
                                }
                            }
                            pstmt.executeUpdate();
                        }
                    }
                }
                return null;
            });

        } catch (Exception e) {
            log.error("Failed to complete database restore: " + e.getMessage(), e);
            throw new RuntimeException("Database restore failed: " + e.getMessage(), e);
        } finally {
            // Restore default origin replication constraints checks
            try {
                jdbcTemplate.execute("SET session_replication_role = 'origin'");
            } catch (Exception e) {
                log.error("Failed to restore session_replication_role: " + e.getMessage(), e);
            }
        }
    }
}
