-- ============================================================
-- MatchPoint — Database Clean-up (Delete All Data)
-- ============================================================
-- Run this in your Supabase SQL Editor to wipe all database tables cleanly
-- ============================================================

-- Method 1: Sequential Deletion in correct Dependency Order
-- (Avoids foreign key violations)

DELETE FROM match_history;
DELETE FROM match_comments;
DELETE FROM tournament_media;
DELETE FROM tournament_feedback;
DELETE FROM tournament_certificates;
DELETE FROM support_requests;
DELETE FROM activity_logs;
DELETE FROM user_logins;
DELETE FROM audit_logs;
DELETE FROM matches;
DELETE FROM teams;
DELETE FROM registrations;
DELETE FROM tournament_events;
DELETE FROM events_master;
DELETE FROM tournaments;
DELETE FROM profiles;

-- Method 2: Single Cascade Truncate Command (Alternative for Superusers)
-- TRUNCATE TABLE 
--   match_history, 
--   match_comments, 
--   tournament_media, 
--   tournament_feedback, 
--   tournament_certificates, 
--   support_requests, 
--   activity_logs, 
--   user_logins, 
--   audit_logs, 
--   matches, 
--   teams, 
--   registrations, 
--   tournament_events, 
--   events_master, 
--   tournaments, 
--   profiles 
-- CASCADE;

-- Re-seed 'TBD' placeholder profile which is required by bracket algorithms for empty slots
INSERT INTO profiles (id, email, name, roles, password_hash, age, gender)
VALUES ('TBD', 'tbd@matchpoint.io', 'TBD', '{player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', 99, 'Male')
ON CONFLICT (id) DO NOTHING;
