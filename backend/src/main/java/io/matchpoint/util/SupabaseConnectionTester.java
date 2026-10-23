package io.matchpoint.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
@Slf4j
@RequiredArgsConstructor
public class SupabaseConnectionTester implements CommandLineRunner {

    private final DataSource dataSource;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("============================================================");
        log.info("⚡ SUPABASE CONNECTION TEST: STARTING...");
        log.info("============================================================");

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT 1")) {

            if (resultSet.next() && resultSet.getInt(1) == 1) {
                log.info("✅ SUPABASE CONNECTION TEST: SUCCESS!");
                log.info("   Database metadata: {}", connection.getMetaData().getDatabaseProductVersion());
                log.info("   Connection URL: {}", connection.getMetaData().getURL());

                // Force-update all profile password hashes to match 'demo'
                String newHash = passwordEncoder.encode("demo");
                try (java.sql.PreparedStatement updateStmt = connection.prepareStatement(
                        "UPDATE profiles SET password_hash = ?")) {
                    updateStmt.setString(1, newHash);
                    int updatedRows = updateStmt.executeUpdate();
                    log.info("🔐 Database Seed Security: Force updated {} profile password hashes to match 'demo'!", updatedRows);
                }

                // Seed placeholder 'TBD' player profile to satisfy foreign key constraints for fixtures
                try (java.sql.PreparedStatement tbdStmt = connection.prepareStatement(
                        "INSERT INTO profiles (id, email, name, roles, password_hash, age, gender) " +
                        "VALUES ('TBD', 'tbd@matchpoint.io', 'TBD', '{player}'::TEXT[], ?, 99, 'Male') " +
                        "ON CONFLICT (id) DO NOTHING")) {
                    tbdStmt.setString(1, newHash);
                    tbdStmt.executeUpdate();
                    log.info("🎯 Database Seed Security: Seeded placeholder 'TBD' player profile successfully!");
                }

                // Seed Siddharth Sen (system_admin)
                try (java.sql.PreparedStatement sys1Stmt = connection.prepareStatement(
                        "INSERT INTO profiles (id, email, name, roles, password_hash, age, gender) " +
                        "VALUES ('sysadmin1', 'sysadmin@matchpoint.io', 'Siddharth Sen', '{system_admin}'::TEXT[], ?, 35, 'Male') " +
                        "ON CONFLICT (id) DO NOTHING")) {
                    sys1Stmt.setString(1, newHash);
                    sys1Stmt.executeUpdate();
                    log.info("⚙️ Database Seed: Seeded system admin 'Siddharth Sen' successfully!");
                }

                // Seed Preeti Nair (system_admin)
                try (java.sql.PreparedStatement sys2Stmt = connection.prepareStatement(
                        "INSERT INTO profiles (id, email, name, roles, password_hash, age, gender) " +
                        "VALUES ('sysadmin2', 'sysadmin2@matchpoint.io', 'Preeti Nair', '{system_admin}'::TEXT[], ?, 32, 'Female') " +
                        "ON CONFLICT (id) DO NOTHING")) {
                    sys2Stmt.setString(1, newHash);
                    sys2Stmt.executeUpdate();
                    log.info("⚙️ Database Seed: Seeded system admin 'Preeti Nair' successfully!");
                }

                // Seed global standard master events templates if events_master is empty
                try (Statement stmt = connection.createStatement();
                     java.sql.ResultSet countRs = stmt.executeQuery("SELECT COUNT(*) FROM events_master")) {
                    if (countRs.next() && countRs.getInt(1) == 0) {
                        log.info("⚙️ Database Seed: Seeding global standard event templates into 'events_master'...");
                        stmt.executeUpdate(
                            "INSERT INTO events_master (id, name, event_type, category, gender, min_age, max_age) " +
                            "VALUES " +
                            "('ms_open', 'Men''s Singles', 'singles', 'open', 'Male', 0, 100), " +
                            "('ws_open', 'Women''s Singles', 'singles', 'open', 'Female', 0, 100), " +
                            "('md_open', 'Men''s Doubles', 'doubles', 'open', 'Male', 0, 100), " +
                            "('wd_open', 'Women''s Doubles', 'doubles', 'open', 'Female', 0, 100), " +
                            "('xd_open', 'Mixed Doubles', 'doubles', 'open', 'Mixed', 0, 100), " +
                            "('bs_u19', 'Boys Singles Under-19', 'singles', 'junior', 'Male', 0, 19), " +
                            "('gs_u19', 'Girls Singles Under-19', 'singles', 'junior', 'Female', 0, 19), " +
                            "('team_open', 'Franchise Team Championship', 'team', 'open', 'Open', 0, 100) " +
                            "ON CONFLICT (id) DO NOTHING"
                        );
                        log.info("⚙️ Database Seed: Seeding global standard event templates completed!");
                    }
                } catch (Exception e) {
                    log.error("⚠️ Failed to seed standard events_master templates:", e);
                }

                // Run automatic DDL migrations for new player profiles and event restrictions columns
                log.info("⚡ Running automatic DDL migrations for player profiles and event restrictions columns...");
                try (Statement ddlStmt = connection.createStatement()) {
                    ddlStmt.execute("SET lock_timeout = 3000;"); // Set 3s lock timeout to prevent blocking startup

                    // profiles
                    if (!columnExists(connection, "profiles", "age")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE profiles ADD COLUMN age INTEGER;");
                        ddlStmt.execute("ALTER TABLE profiles ADD COLUMN age INTEGER;");
                    }
                    if (!columnExists(connection, "profiles", "gender")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE profiles ADD COLUMN gender VARCHAR(10);");
                        ddlStmt.execute("ALTER TABLE profiles ADD COLUMN gender VARCHAR(10);");
                    }
                    if (columnExists(connection, "profiles", "avatar") && !columnHasType(connection, "profiles", "avatar", "text")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE profiles ALTER COLUMN avatar TYPE TEXT;");
                        ddlStmt.execute("ALTER TABLE profiles ALTER COLUMN avatar TYPE TEXT;");
                    }

                    // tournament_events
                    if (!columnExists(connection, "tournament_events", "gender_restriction")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournament_events ADD COLUMN gender_restriction VARCHAR(20) DEFAULT 'open';");
                        ddlStmt.execute("ALTER TABLE tournament_events ADD COLUMN gender_restriction VARCHAR(20) DEFAULT 'open';");
                    }
                    if (!columnExists(connection, "tournament_events", "age_limit")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournament_events ADD COLUMN age_limit INTEGER;");
                        ddlStmt.execute("ALTER TABLE tournament_events ADD COLUMN age_limit INTEGER;");
                    }
                    if (!columnExists(connection, "tournament_events", "age_restriction_type")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournament_events ADD COLUMN age_restriction_type VARCHAR(10) DEFAULT 'max';");
                        ddlStmt.execute("ALTER TABLE tournament_events ADD COLUMN age_restriction_type VARCHAR(10) DEFAULT 'max';");
                    }
                    if (!columnExists(connection, "tournament_events", "event_type")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournament_events ADD COLUMN event_type VARCHAR(20);");
                        ddlStmt.execute("ALTER TABLE tournament_events ADD COLUMN event_type VARCHAR(20);");
                    }
                    if (!columnExists(connection, "tournament_events", "gender")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournament_events ADD COLUMN gender VARCHAR(20);");
                        ddlStmt.execute("ALTER TABLE tournament_events ADD COLUMN gender VARCHAR(20);");
                    }
                    if (!columnExists(connection, "tournament_events", "age_category")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournament_events ADD COLUMN age_category VARCHAR(20);");
                        ddlStmt.execute("ALTER TABLE tournament_events ADD COLUMN age_category VARCHAR(20);");
                    }
                    if (!columnExists(connection, "tournament_events", "min_age")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournament_events ADD COLUMN min_age INTEGER;");
                        ddlStmt.execute("ALTER TABLE tournament_events ADD COLUMN min_age INTEGER;");
                    }
                    if (!columnExists(connection, "tournament_events", "max_age")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournament_events ADD COLUMN max_age INTEGER;");
                        ddlStmt.execute("ALTER TABLE tournament_events ADD COLUMN max_age INTEGER;");
                    }
                    if (!columnExists(connection, "tournament_events", "entry_fee")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournament_events ADD COLUMN entry_fee NUMERIC(10, 2);");
                        ddlStmt.execute("ALTER TABLE tournament_events ADD COLUMN entry_fee NUMERIC(10, 2);");
                    }
                    if (!columnExists(connection, "tournament_events", "sport")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournament_events ADD COLUMN sport VARCHAR(50) DEFAULT 'badminton';");
                        ddlStmt.execute("ALTER TABLE tournament_events ADD COLUMN sport VARCHAR(50) DEFAULT 'badminton';");
                    }

                    // registrations
                    if (!columnExists(connection, "registrations", "partner_name")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE registrations ADD COLUMN partner_name VARCHAR(100);");
                        ddlStmt.execute("ALTER TABLE registrations ADD COLUMN partner_name VARCHAR(100);");
                    }
                    if (!columnExists(connection, "registrations", "partner_email")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE registrations ADD COLUMN partner_email VARCHAR(100);");
                        ddlStmt.execute("ALTER TABLE registrations ADD COLUMN partner_email VARCHAR(100);");
                    }
                    if (!columnExists(connection, "registrations", "partner_gender")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE registrations ADD COLUMN partner_gender VARCHAR(10);");
                        ddlStmt.execute("ALTER TABLE registrations ADD COLUMN partner_gender VARCHAR(10);");
                    }
                    if (!columnExists(connection, "registrations", "partner_age")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE registrations ADD COLUMN partner_age INTEGER;");
                        ddlStmt.execute("ALTER TABLE registrations ADD COLUMN partner_age INTEGER;");
                    }
                    if (!columnExists(connection, "registrations", "payment_status")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE registrations ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid';");
                        ddlStmt.execute("ALTER TABLE registrations ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid';");
                    }
                    if (!columnExists(connection, "registrations", "payment_method")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE registrations ADD COLUMN payment_method VARCHAR(20) DEFAULT 'stripe';");
                        ddlStmt.execute("ALTER TABLE registrations ADD COLUMN payment_method VARCHAR(20) DEFAULT 'stripe';");
                    }

                    // matches
                    if (constraintExists(connection, "matches", "matches_player1_id_fkey")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches DROP CONSTRAINT matches_player1_id_fkey;");
                        ddlStmt.execute("ALTER TABLE matches DROP CONSTRAINT matches_player1_id_fkey;");
                    }
                    if (constraintExists(connection, "matches", "matches_player2_id_fkey")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches DROP CONSTRAINT matches_player2_id_fkey;");
                        ddlStmt.execute("ALTER TABLE matches DROP CONSTRAINT matches_player2_id_fkey;");
                    }
                    if (!columnExists(connection, "matches", "is_adhoc")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches ADD COLUMN is_adhoc BOOLEAN DEFAULT FALSE;");
                        ddlStmt.execute("ALTER TABLE matches ADD COLUMN is_adhoc BOOLEAN DEFAULT FALSE;");
                    }
                    if (!columnExists(connection, "matches", "adhoc_type")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches ADD COLUMN adhoc_type VARCHAR(50);");
                        ddlStmt.execute("ALTER TABLE matches ADD COLUMN adhoc_type VARCHAR(50);");
                    }
                    if (columnExists(connection, "matches", "tournament_id") && !isColumnNullable(connection, "matches", "tournament_id")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches ALTER COLUMN tournament_id DROP NOT NULL;");
                        ddlStmt.execute("ALTER TABLE matches ALTER COLUMN tournament_id DROP NOT NULL;");
                    }
                    if (columnExists(connection, "matches", "event_id") && !isColumnNullable(connection, "matches", "event_id")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches ALTER COLUMN event_id DROP NOT NULL;");
                        ddlStmt.execute("ALTER TABLE matches ALTER COLUMN event_id DROP NOT NULL;");
                    }
                    if (columnExists(connection, "matches", "fixture_round") && !isColumnNullable(connection, "matches", "fixture_round")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches ALTER COLUMN fixture_round DROP NOT NULL;");
                        ddlStmt.execute("ALTER TABLE matches ALTER COLUMN fixture_round DROP NOT NULL;");
                    }
                    if (columnExists(connection, "matches", "fixture_position") && !isColumnNullable(connection, "matches", "fixture_position")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches ALTER COLUMN fixture_position DROP NOT NULL;");
                        ddlStmt.execute("ALTER TABLE matches ALTER COLUMN fixture_position DROP NOT NULL;");
                    }
                    if (!columnExists(connection, "matches", "max_viewers")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches ADD COLUMN max_viewers INTEGER DEFAULT 0;");
                        ddlStmt.execute("ALTER TABLE matches ADD COLUMN max_viewers INTEGER DEFAULT 0;");
                    }
                    if (!columnExists(connection, "matches", "sport")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches ADD COLUMN sport VARCHAR(50) DEFAULT 'badminton';");
                        ddlStmt.execute("ALTER TABLE matches ADD COLUMN sport VARCHAR(50) DEFAULT 'badminton';");
                    }
                    if (!columnExists(connection, "matches", "sport_metadata")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE matches ADD COLUMN sport_metadata JSONB DEFAULT '{}'::JSONB;");
                        ddlStmt.execute("ALTER TABLE matches ADD COLUMN sport_metadata JSONB DEFAULT '{}'::JSONB;");
                    }

                    // teams
                    if (!columnExists(connection, "teams", "logo_url")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE teams ADD COLUMN logo_url TEXT;");
                        ddlStmt.execute("ALTER TABLE teams ADD COLUMN logo_url TEXT;");
                    }

                    // tournaments
                    if (!columnExists(connection, "tournaments", "admins")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournaments ADD COLUMN admins TEXT[] DEFAULT '{}'::TEXT[];");
                        ddlStmt.execute("ALTER TABLE tournaments ADD COLUMN admins TEXT[] DEFAULT '{}'::TEXT[];");
                    }
                    if (!columnExists(connection, "tournaments", "collects_fees")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournaments ADD COLUMN collects_fees BOOLEAN DEFAULT FALSE;");
                        ddlStmt.execute("ALTER TABLE tournaments ADD COLUMN collects_fees BOOLEAN DEFAULT FALSE;");
                    }
                    if (!columnExists(connection, "tournaments", "entry_fee")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournaments ADD COLUMN entry_fee NUMERIC(10, 2) DEFAULT 0.00;");
                        ddlStmt.execute("ALTER TABLE tournaments ADD COLUMN entry_fee NUMERIC(10, 2) DEFAULT 0.00;");
                    }
                    if (!columnExists(connection, "tournaments", "currency")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournaments ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';");
                        ddlStmt.execute("ALTER TABLE tournaments ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';");
                    }
                    if (!columnExists(connection, "tournaments", "stripe_account_id")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournaments ADD COLUMN stripe_account_id VARCHAR(100);");
                        ddlStmt.execute("ALTER TABLE tournaments ADD COLUMN stripe_account_id VARCHAR(100);");
                    }
                    if (!columnExists(connection, "tournaments", "platform_fee_percentage")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournaments ADD COLUMN platform_fee_percentage NUMERIC(5, 2) DEFAULT 2.00;");
                        ddlStmt.execute("ALTER TABLE tournaments ADD COLUMN platform_fee_percentage NUMERIC(5, 2) DEFAULT 2.00;");
                    }
                    if (!columnExists(connection, "tournaments", "payment_options")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournaments ADD COLUMN payment_options JSONB DEFAULT '[]'::JSONB;");
                        ddlStmt.execute("ALTER TABLE tournaments ADD COLUMN payment_options JSONB DEFAULT '[]'::JSONB;");
                    }
                    if (!columnExists(connection, "tournaments", "withdraw_date")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournaments ADD COLUMN withdraw_date DATE;");
                        ddlStmt.execute("ALTER TABLE tournaments ADD COLUMN withdraw_date DATE;");
                    }
                    if (!columnExists(connection, "tournaments", "sport")) {
                        log.info("   ↳ Executing DDL: ALTER TABLE tournaments ADD COLUMN sport VARCHAR(50) DEFAULT 'badminton';");
                        ddlStmt.execute("ALTER TABLE tournaments ADD COLUMN sport VARCHAR(50) DEFAULT 'badminton';");
                    }

                    // tournament_media
                    if (!tableExists(connection, "tournament_media")) {
                        log.info("   ↳ Executing DDL: CREATE TABLE tournament_media;");
                        ddlStmt.execute("CREATE TABLE tournament_media (" +
                                "id VARCHAR(255) PRIMARY KEY, " +
                                "tournament_id VARCHAR(255), " +
                                "uploaded_by VARCHAR(255), " +
                                "file_url TEXT NOT NULL, " +
                                "caption VARCHAR(255), " +
                                "media_type VARCHAR(50) DEFAULT 'image', " +
                                "match_id VARCHAR(255), " +
                                "created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                                ");");
                    } else {
                        if (!columnExists(connection, "tournament_media", "match_id")) {
                            log.info("   ↳ Executing DDL: ALTER TABLE tournament_media ADD COLUMN match_id VARCHAR(255);");
                            ddlStmt.execute("ALTER TABLE tournament_media ADD COLUMN match_id VARCHAR(255);");
                        }
                        if (columnExists(connection, "tournament_media", "tournament_id") && !isColumnNullable(connection, "tournament_media", "tournament_id")) {
                            log.info("   ↳ Executing DDL: ALTER TABLE tournament_media ALTER COLUMN tournament_id DROP NOT NULL;");
                            ddlStmt.execute("ALTER TABLE tournament_media ALTER COLUMN tournament_id DROP NOT NULL;");
                        }
                    }

                    // match_comments
                    if (!tableExists(connection, "match_comments")) {
                        log.info("   ↳ Executing DDL: CREATE TABLE match_comments;");
                        ddlStmt.execute("CREATE TABLE match_comments (" +
                                "id VARCHAR(255) PRIMARY KEY, " +
                                "match_id VARCHAR(255) NOT NULL, " +
                                "user_id VARCHAR(255), " +
                                "user_name VARCHAR(255) NOT NULL, " +
                                "message TEXT NOT NULL, " +
                                "created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                                ");");
                    }

                    // tournament_certificates
                    if (!tableExists(connection, "tournament_certificates")) {
                        log.info("   ↳ Executing DDL: CREATE TABLE tournament_certificates;");
                        ddlStmt.execute("CREATE TABLE tournament_certificates (" +
                                "id VARCHAR(255) PRIMARY KEY, " +
                                "tournament_id VARCHAR(255) UNIQUE, " +
                                "title VARCHAR(255) NOT NULL, " +
                                "template_type VARCHAR(50) DEFAULT 'classic', " +
                                "signature_data TEXT, " +
                                "border_color VARCHAR(50), " +
                                "created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                                ");");
                    }

                    // support_requests
                    if (!tableExists(connection, "support_requests")) {
                        log.info("   ↳ Executing DDL: CREATE TABLE support_requests;");
                        ddlStmt.execute("CREATE TABLE support_requests (" +
                                "id UUID PRIMARY KEY DEFAULT gen_random_uuid(), " +
                                "name VARCHAR(255) NOT NULL, " +
                                "email VARCHAR(255) NOT NULL, " +
                                "organization VARCHAR(255), " +
                                "message TEXT NOT NULL, " +
                                "status VARCHAR(50) DEFAULT 'open', " +
                                "created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                                ");");
                    }

                    // tournament_feedback
                    if (!tableExists(connection, "tournament_feedback")) {
                        log.info("   ↳ Executing DDL: CREATE TABLE tournament_feedback;");
                        ddlStmt.execute("CREATE TABLE tournament_feedback (" +
                                "id UUID PRIMARY KEY DEFAULT gen_random_uuid(), " +
                                "tournament_id VARCHAR(255) NOT NULL, " +
                                "user_id VARCHAR(255), " +
                                "user_name VARCHAR(255) DEFAULT 'Anonymous', " +
                                "feedback_type VARCHAR(50) NOT NULL, " +
                                "message TEXT NOT NULL, " +
                                "created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                                ");");
                    }

                    // match_polls
                    if (!tableExists(connection, "match_polls")) {
                        log.info("   ↳ Executing DDL: CREATE TABLE match_polls;");
                        ddlStmt.execute("CREATE TABLE match_polls (" +
                                "id UUID PRIMARY KEY DEFAULT gen_random_uuid(), " +
                                "match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE, " +
                                "question TEXT NOT NULL, " +
                                "options JSONB NOT NULL DEFAULT '[]'::JSONB, " +
                                "votes JSONB NOT NULL DEFAULT '[]'::JSONB, " +
                                "created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                                ");");
                    }

                    // password_resets
                    if (!tableExists(connection, "password_resets")) {
                        log.info("   ↳ Executing DDL: CREATE TABLE password_resets;");
                        ddlStmt.execute("CREATE TABLE password_resets (" +
                                "id UUID PRIMARY KEY DEFAULT gen_random_uuid(), " +
                                "email VARCHAR(255) NOT NULL, " +
                                "otp_hash VARCHAR(64) NOT NULL, " +
                                "expires_at TIMESTAMP NOT NULL, " +
                                "attempts INT DEFAULT 0, " +
                                "is_verified BOOLEAN DEFAULT FALSE, " +
                                "reset_token VARCHAR(255), " +
                                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                                ");");
                    }
                    if (!indexExists(connection, "idx_password_resets_email")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_password_resets_email ON password_resets(email);");
                        ddlStmt.execute("CREATE INDEX idx_password_resets_email ON password_resets(email);");
                    }

                    // Stripe/Razorpay Payments
                    if (!tableExists(connection, "transactions")) {
                        log.info("   ↳ Executing DDL: CREATE TABLE transactions;");
                        ddlStmt.execute("CREATE TABLE transactions (" +
                                "id UUID PRIMARY KEY DEFAULT gen_random_uuid(), " +
                                "registration_id VARCHAR(255), " +
                                "tournament_id VARCHAR(255), " +
                                "amount NUMERIC(10, 2) NOT NULL, " +
                                "platform_fee NUMERIC(10, 2) NOT NULL, " +
                                "currency VARCHAR(3) NOT NULL, " +
                                "status VARCHAR(20) NOT NULL, " +
                                "stripe_session_id VARCHAR(255) UNIQUE, " +
                                "stripe_charge_id VARCHAR(255), " +
                                "created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                                ");");
                    }
                    if (!indexExists(connection, "idx_transactions_session")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_transactions_session ON transactions(stripe_session_id);");
                        ddlStmt.execute("CREATE INDEX idx_transactions_session ON transactions(stripe_session_id);");
                    }

                    if (!tableExists(connection, "payment_orders")) {
                        log.info("   ↳ Executing DDL: CREATE TABLE payment_orders;");
                        ddlStmt.execute("CREATE TABLE payment_orders (" +
                                "id UUID PRIMARY KEY DEFAULT gen_random_uuid(), " +
                                "user_id TEXT, " +
                                "registration_id TEXT, " +
                                "amount DECIMAL(10, 2) NOT NULL, " +
                                "currency VARCHAR(10) NOT NULL DEFAULT 'INR', " +
                                "razorpay_order_id VARCHAR(100) UNIQUE NOT NULL, " +
                                "status VARCHAR(50) NOT NULL DEFAULT 'created', " +
                                "created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                                ");");
                    }
                    if (!tableExists(connection, "payment_transactions")) {
                        log.info("   ↳ Executing DDL: CREATE TABLE payment_transactions;");
                        ddlStmt.execute("CREATE TABLE payment_transactions (" +
                                "id UUID PRIMARY KEY DEFAULT gen_random_uuid(), " +
                                "order_id UUID REFERENCES payment_orders(id) ON DELETE CASCADE, " +
                                "razorpay_payment_id VARCHAR(100) UNIQUE NOT NULL, " +
                                "payment_method VARCHAR(50), " +
                                "status VARCHAR(50) NOT NULL, " +
                                "paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                                ");");
                    }
                    if (!indexExists(connection, "idx_payment_orders_user_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_payment_orders_user_id;");
                        ddlStmt.execute("CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);");
                    }
                    if (!indexExists(connection, "idx_payment_orders_registration_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_payment_orders_registration_id;");
                        ddlStmt.execute("CREATE INDEX idx_payment_orders_registration_id ON payment_orders(registration_id);");
                    }
                    if (!indexExists(connection, "idx_payment_orders_razorpay_order_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_payment_orders_razorpay_order_id;");
                        ddlStmt.execute("CREATE INDEX idx_payment_orders_razorpay_order_id ON payment_orders(razorpay_order_id);");
                    }
                    if (!indexExists(connection, "idx_payment_transactions_order_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_payment_transactions_order_id;");
                        ddlStmt.execute("CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);");
                    }

                    // Performance Tuning Indexes
                    if (!indexExists(connection, "idx_tournaments_created_by")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_tournaments_created_by;");
                        ddlStmt.execute("CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);");
                    }
                    if (!indexExists(connection, "idx_tournament_events_master_event")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_tournament_events_master_event;");
                        ddlStmt.execute("CREATE INDEX idx_tournament_events_master_event ON tournament_events(master_event_id);");
                    }
                    if (!indexExists(connection, "idx_teams_captain_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_teams_captain_id;");
                        ddlStmt.execute("CREATE INDEX idx_teams_captain_id ON teams(captain_id);");
                    }
                    if (!indexExists(connection, "idx_matches_umpire_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_matches_umpire_id;");
                        ddlStmt.execute("CREATE INDEX idx_matches_umpire_id ON matches(umpire_id);");
                    }
                    if (!indexExists(connection, "idx_tournament_feedback_tournament")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_tournament_feedback_tournament;");
                        ddlStmt.execute("CREATE INDEX idx_tournament_feedback_tournament ON tournament_feedback(tournament_id);");
                    }
                    if (!indexExists(connection, "idx_match_history_event")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_match_history_event;");
                        ddlStmt.execute("CREATE INDEX idx_match_history_event ON match_history(event_id);");
                    }
                    // Matches - critical query indexes
                    if (!indexExists(connection, "idx_matches_event_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_matches_event_id;");
                        ddlStmt.execute("CREATE INDEX idx_matches_event_id ON matches(event_id);");
                    }
                    if (!indexExists(connection, "idx_matches_tournament_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_matches_tournament_id;");
                        ddlStmt.execute("CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);");
                    }
                    if (!indexExists(connection, "idx_matches_status")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_matches_status;");
                        ddlStmt.execute("CREATE INDEX idx_matches_status ON matches(status);");
                    }
                    if (!indexExists(connection, "idx_matches_player1_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_matches_player1_id;");
                        ddlStmt.execute("CREATE INDEX idx_matches_player1_id ON matches(player1_id);");
                    }
                    if (!indexExists(connection, "idx_matches_player2_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_matches_player2_id;");
                        ddlStmt.execute("CREATE INDEX idx_matches_player2_id ON matches(player2_id);");
                    }
                    if (!indexExists(connection, "idx_matches_winner_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_matches_winner_id;");
                        ddlStmt.execute("CREATE INDEX idx_matches_winner_id ON matches(winner_id);");
                    }
                    if (!indexExists(connection, "idx_matches_sport")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_matches_sport;");
                        ddlStmt.execute("CREATE INDEX idx_matches_sport ON matches(sport);");
                    }
                    // Profiles
                    if (!indexExists(connection, "idx_profiles_email")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_profiles_email;");
                        ddlStmt.execute("CREATE INDEX idx_profiles_email ON profiles(email);");
                    }
                    // Tournaments
                    if (!indexExists(connection, "idx_tournaments_status")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_tournaments_status;");
                        ddlStmt.execute("CREATE INDEX idx_tournaments_status ON tournaments(status);");
                    }
                    if (!indexExists(connection, "idx_tournaments_sport")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_tournaments_sport;");
                        ddlStmt.execute("CREATE INDEX idx_tournaments_sport ON tournaments(sport);");
                    }
                    // Registrations
                    if (!indexExists(connection, "idx_registrations_tournament_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_registrations_tournament_id;");
                        ddlStmt.execute("CREATE INDEX idx_registrations_tournament_id ON registrations(tournament_id);");
                    }
                    if (!indexExists(connection, "idx_registrations_event_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_registrations_event_id;");
                        ddlStmt.execute("CREATE INDEX idx_registrations_event_id ON registrations(event_id);");
                    }
                    if (!indexExists(connection, "idx_registrations_player_id")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_registrations_player_id;");
                        ddlStmt.execute("CREATE INDEX idx_registrations_player_id ON registrations(player_id);");
                    }
                    if (!indexExists(connection, "idx_audit_logs_created_at")) {
                        log.info("   ↳ Executing DDL: CREATE INDEX idx_audit_logs_created_at;");
                        ddlStmt.execute("CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);");
                    }

                    log.info("✅ DDL migrations completed successfully!");
                }
            } else {
                log.warn("⚠️ SUPABASE CONNECTION TEST: Unexpected query results!");
            }

        } catch (Exception e) {
            log.error("❌ SUPABASE CONNECTION TEST: FAILED!");
            log.error("   Error details: ", e);
        }



        log.info("============================================================");
    }

    private boolean columnExists(Connection conn, String tableName, String columnName) {
        try {
            var meta = conn.getMetaData();
            try (var rs = meta.getColumns(null, null, tableName.toLowerCase(), columnName.toLowerCase())) {
                return rs.next();
            }
        } catch (Exception e) {
            log.warn("Failed to check if column {}.{} exists: {}", tableName, columnName, e.getMessage());
            return false;
        }
    }

    private boolean tableExists(Connection conn, String tableName) {
        try {
            var meta = conn.getMetaData();
            try (var rs = meta.getTables(null, null, tableName.toLowerCase(), null)) {
                return rs.next();
            }
        } catch (Exception e) {
            log.warn("Failed to check if table {} exists: {}", tableName, e.getMessage());
            return false;
        }
    }

    private boolean columnHasType(Connection conn, String tableName, String columnName, String typeName) {
        try {
            var meta = conn.getMetaData();
            try (var rs = meta.getColumns(null, null, tableName.toLowerCase(), columnName.toLowerCase())) {
                if (rs.next()) {
                    String actualType = rs.getString("TYPE_NAME");
                    return typeName.equalsIgnoreCase(actualType);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to check column type for {}.{}: {}", tableName, columnName, e.getMessage());
        }
        return false;
    }

    private boolean isColumnNullable(Connection conn, String tableName, String columnName) {
        try {
            var meta = conn.getMetaData();
            try (var rs = meta.getColumns(null, null, tableName.toLowerCase(), columnName.toLowerCase())) {
                if (rs.next()) {
                    return "YES".equalsIgnoreCase(rs.getString("IS_NULLABLE"));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to check column nullability for {}.{}: {}", tableName, columnName, e.getMessage());
        }
        return false;
    }

    private boolean constraintExists(Connection conn, String tableName, String constraintName) {
        try (java.sql.PreparedStatement stmt = conn.prepareStatement(
                "SELECT 1 FROM information_schema.table_constraints WHERE table_name = ? AND constraint_name = ?")) {
            stmt.setString(1, tableName.toLowerCase());
            stmt.setString(2, constraintName.toLowerCase());
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        } catch (Exception e) {
            log.warn("Failed to check if constraint {} on table {} exists: {}", constraintName, tableName, e.getMessage());
            return false;
        }
    }

    private boolean indexExists(Connection conn, String indexName) {
        try (java.sql.PreparedStatement stmt = conn.prepareStatement(
                "SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = ? AND c.relkind = 'i'")) {
            stmt.setString(1, indexName.toLowerCase());
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        } catch (Exception e) {
            log.warn("Failed to check if index {} exists: {}", indexName, e.getMessage());
            return false;
        }
    }

}
