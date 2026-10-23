package io.matchpoint.config;

import io.matchpoint.entity.AuditLog;
import io.matchpoint.repository.AuditLogRepository;
import io.matchpoint.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuditLoggingFilter extends OncePerRequestFilter {

    private final AuditLogRepository auditLogRepository;
    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Proceed with the request execution first so we have the authenticated context and final response status
        filterChain.doFilter(request, response);

        String method = request.getMethod();
        String uri = request.getRequestURI();

        // Audit log state-changing requests (POST, PUT, DELETE, PATCH)
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || 
            "DELETE".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
            
            // Skip logging telemetry log calls and public activity logging requests to prevent infinite recursion
            if (uri.contains("/api/v1/audit-logs") || uri.contains("/api/v1/activity-logs") || uri.contains("/api/v1/public/activity-logs")) {
                return;
            }

            try {
                String userName = "GUEST";
                String userId = null;
                
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                    userName = auth.getName();
                    // Extract userId from JWT if present in the header
                    String authHeader = request.getHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            userId = jwtUtil.extractUserId(token);
                        } catch (Exception e) {
                            // Suppress
                        }
                    }
                }

                String category = getCategoryFromUri(uri);
                String details = String.format("Request: %s %s, Response Status: %d", method, uri, response.getStatus());

                AuditLog auditLog = AuditLog.builder()
                        .id("audit-" + UUID.randomUUID().toString())
                        .action(method + " " + uri)
                        .category(category)
                        .userId(userId)
                        .userName(userName)
                        .details(details)
                        .build();

                auditLogRepository.save(auditLog);
            } catch (Exception e) {
                // Keep logging failures silent so they don't break actual requests
                logger.error("Failed to automatically record audit log: " + e.getMessage());
            }
        }
    }

    private String getCategoryFromUri(String uri) {
        if (uri.contains("/tournaments")) return "tournament";
        if (uri.contains("/events")) return "event";
        if (uri.contains("/registrations")) return "registration";
        if (uri.contains("/matches")) return "match";
        if (uri.contains("/teams")) return "team";
        if (uri.contains("/auth")) return "auth";
        return "system";
    }
}
