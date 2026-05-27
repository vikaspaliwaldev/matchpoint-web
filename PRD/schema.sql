-- ============================================================
-- MatchPoint — Supabase PostgreSQL Database Schema & Seed Data
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================

-- Clean up existing tables if they exist
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS tournament_events CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Profiles Table (Extends Supabase users or custom players)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY, -- text allows matching both Next.js mock IDs (u1, u2) and Supabase UUIDs
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  roles TEXT[] NOT NULL DEFAULT '{player}'::TEXT[],
  avatar TEXT,
  password_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tournaments Table
CREATE TABLE tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT,
  banner TEXT,
  start_date DATE,
  end_date DATE,
  type TEXT NOT NULL CHECK (type IN ('individual', 'team')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'live', 'completed', 'cancelled')),
  created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  team_size_limit INTEGER DEFAULT 4,
  team_tie_events TEXT[] DEFAULT '{MS, MD, XD}'::TEXT[],
  team_tie_configs JSONB DEFAULT '[]'::JSONB,
  bonus_point_margin INTEGER DEFAULT 5,
  bonus_point_value INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tournament Events Table
CREATE TABLE tournament_events (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  category TEXT NOT NULL,
  entry_limit INTEGER NOT NULL DEFAULT 32,
  format TEXT NOT NULL CHECK (format IN ('knockout', 'round_robin', 'swiss', 'league', 'hybrid')),
  scoring_format TEXT NOT NULL DEFAULT '21-point' CHECK (scoring_format IN ('11-point', '15-point', '21-point')),
  registrations_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Registrations Table
CREATE TABLE registrations (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES tournament_events(id) ON DELETE CASCADE,
  player_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  player_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted', 'disqualified')),
  disqualification_reason TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  seed INTEGER,
  UNIQUE(event_id, player_id)
);

-- 5. Teams Table
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  logo_color TEXT NOT NULL,
  captain_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  players TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
);

-- 6. Matches Table
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES tournament_events(id) ON DELETE CASCADE,
  fixture_round INTEGER NOT NULL DEFAULT 1,
  fixture_position INTEGER NOT NULL DEFAULT 0,
  court TEXT,
  player1_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  player1_name TEXT NOT NULL,
  player2_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  player2_name TEXT NOT NULL,
  umpire_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  umpire_name TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'running', 'paused', 'completed')),
  winner_id TEXT,
  sets JSONB NOT NULL DEFAULT '[]'::JSONB,
  sub_matches JSONB DEFAULT '[]'::JSONB
);

-- 7. Audit Logs Table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. User Logins Table (180-day history retention)
CREATE TABLE user_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL -- 'success', 'failed_bad_credentials'
);

CREATE INDEX IF NOT EXISTS idx_user_logins_time ON user_logins(login_time);

-- 9. Activity Telemetry Logs Table (15-day rolling activity tracking)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Nullable for public anonymous visitors
  user_name TEXT DEFAULT 'Anonymous',
  activity_type VARCHAR(50) NOT NULL, -- 'PAGE_VIEW', 'CREATE_TOURNAMENT', etc.
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);


-- ============================================================
-- Seeding Initial Demo Data
-- ============================================================

-- Seed 1. Profiles
INSERT INTO profiles (id, email, name, phone, roles, password_hash, created_at) VALUES
('u1', 'admin@matchpoint.io', 'Rajesh Kumar', '+91 98765 43210', '{admin,player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '130 days'),
('u2', 'priya@matchpoint.io', 'Priya Sharma', '+91 91234 56789', '{player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '115 days'),
('u3', 'vikas@matchpoint.io', 'Vikas Patel', NULL, '{player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '111 days'),
('u4', 'anita@matchpoint.io', 'Anita Desai', NULL, '{player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '106 days'),
('u5', 'umpire@matchpoint.io', 'Suresh Nair', NULL, '{umpire,player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '125 days'),
('u6', 'rahul@matchpoint.io', 'Rahul Singh', NULL, '{player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '86 days'),
('u7', 'neha@matchpoint.io', 'Neha Gupta', NULL, '{player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '82 days'),
('u8', 'amit@matchpoint.io', 'Amit Verma', NULL, '{player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '77 days'),
('u9', 'deepa@matchpoint.io', 'Deepa Menon', NULL, '{player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '75 days'),
('u10', 'karthik@matchpoint.io', 'Karthik Rajan', NULL, '{player}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '72 days'),
('u11', 'allroles@matchpoint.io', 'Arjun Mehta', NULL, '{admin,player,umpire}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '135 days'),
('u12', 'umpire2@matchpoint.io', 'Kavita Rao', NULL, '{umpire}'::TEXT[], '$2a$10$x8t6/YJ91Z/t9rJ6yQ3Xz.H1F.3v5qE0rFw6wL5xW82bE0w1n8d6C', CURRENT_TIMESTAMP - INTERVAL '95 days');

-- Seed 2. Tournaments
INSERT INTO tournaments (id, name, slug, description, location, start_date, end_date, type, status, created_by, created_at) VALUES
('t1', 'Mumbai Badminton Open 2025', 'mumbai-open-2025', 'The premier badminton tournament in Mumbai. Open to all skill levels. Prizes worth ₹5,00,000!', 'Shree Shiv Chhatrapati Sports Complex, Mumbai', '2025-06-15', '2025-06-22', 'individual', 'live', 'u1', CURRENT_TIMESTAMP - INTERVAL '120 days'),
('t2', 'Delhi Shuttle Championship', 'delhi-shuttle-championship', 'Annual championship featuring top players from across North India.', 'Siri Fort Sports Complex, New Delhi', '2025-07-10', '2025-07-14', 'individual', 'open', 'u1', CURRENT_TIMESTAMP - INTERVAL '100 days'),
('t3', 'Bangalore Corporate League', 'bangalore-corporate-league', 'Team-based corporate badminton league. Companies compete head-to-head!', 'Koramangala Indoor Stadium, Bangalore', '2025-08-01', '2025-08-15', 'team', 'draft', 'u1', CURRENT_TIMESTAMP - INTERVAL '80 days'),
('t4', 'Pune Masters Invitational', 'pune-masters-2025', 'Invitational tournament for ranked players. Seeded draw with knockout format.', 'Balewadi Stadium, Pune', '2025-05-01', '2025-05-05', 'individual', 'completed', 'u1', CURRENT_TIMESTAMP - INTERVAL '135 days');

-- Seed 3. Tournament Events
INSERT INTO tournament_events (id, tournament_id, event_name, category, entry_limit, format, scoring_format, registrations_count) VALUES
('e1', 't1', 'Men''s Singles', 'MS', 32, 'knockout', '21-point', 24),
('e2', 't1', 'Women''s Singles', 'WS', 16, 'knockout', '21-point', 12),
('e3', 't1', 'Men''s Doubles', 'MD', 16, 'knockout', '21-point', 14),
('e4', 't1', 'Mixed Doubles', 'XD', 16, 'knockout', '21-point', 10),
('e5', 't2', 'Men''s Singles', 'MS', 64, 'knockout', '21-point', 38),
('e6', 't2', 'Women''s Singles', 'WS', 32, 'knockout', '21-point', 20),
('e7', 't4', 'Men''s Singles', 'MS', 16, 'knockout', '21-point', 16),
('e8', 't3', 'Team Event', 'TEAM', 8, 'league', '21-point', 6);

-- Seed 4. Registrations
INSERT INTO registrations (id, tournament_id, event_id, player_id, player_name, player_email, status, registered_at, seed) VALUES
('r1', 't1', 'e1', 'u2', 'Priya Sharma', 'priya@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '56 days', 1),
('r2', 't1', 'e1', 'u3', 'Vikas Patel', 'vikas@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '55 days', 2),
('r3', 't1', 'e1', 'u4', 'Anita Desai', 'anita@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '54 days', 3),
('r4', 't1', 'e1', 'u6', 'Rahul Singh', 'rahul@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '53 days', 4),
('r5', 't1', 'e1', 'u7', 'Neha Gupta', 'neha@matchpoint.io', 'pending', CURRENT_TIMESTAMP - INTERVAL '52 days', NULL),
('r6', 't1', 'e1', 'u8', 'Amit Verma', 'amit@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '51 days', 5),
('r7', 't1', 'e1', 'u9', 'Deepa Menon', 'deepa@matchpoint.io', 'rejected', CURRENT_TIMESTAMP - INTERVAL '50 days', NULL),
('r8', 't1', 'e1', 'u10', 'Karthik Rajan', 'karthik@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '49 days', 6),
('r11', 't1', 'e2', 'u2', 'Priya Sharma', 'priya@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '56 days', 1),
('r12', 't1', 'e2', 'u4', 'Anita Desai', 'anita@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '55 days', 2),
('r13', 't1', 'e2', 'u7', 'Neha Gupta', 'neha@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '54 days', 3),
('r14', 't1', 'e2', 'u9', 'Deepa Menon', 'deepa@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '53 days', 4),
('r9', 't2', 'e5', 'u2', 'Priya Sharma', 'priya@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '26 days', 1),
('r10', 't2', 'e5', 'u6', 'Rahul Singh', 'rahul@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '25 days', 2),
('r15', 't2', 'e5', 'u3', 'Vikas Patel', 'vikas@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '24 days', 3),
('r16', 't2', 'e5', 'u8', 'Amit Verma', 'amit@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '23 days', 4),
('r17', 't2', 'e6', 'u4', 'Anita Desai', 'anita@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '26 days', 1),
('r18', 't2', 'e6', 'u7', 'Neha Gupta', 'neha@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '25 days', 2),
('r19', 't2', 'e6', 'u9', 'Deepa Menon', 'deepa@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '24 days', 3),
('r20', 't2', 'e6', 'u2', 'Priya Sharma', 'priya@matchpoint.io', 'approved', CURRENT_TIMESTAMP - INTERVAL '23 days', 4);

-- Seed 5. Teams
INSERT INTO teams (id, name, tournament_id, logo_color, captain_id, players) VALUES
('team1', 'Infosys Smashers', 't3', '#6366f1', 'u3', '{"u3","u6"}'::TEXT[]),
('team2', 'TCS Titans', 't3', '#ef4444', 'u8', '{"u8","u10"}'::TEXT[]),
('team3', 'Wipro Warriors', 't3', '#22c55e', NULL, '{}'::TEXT[]);

-- Seed 6. Matches
INSERT INTO matches (id, tournament_id, event_id, fixture_round, fixture_position, court, player1_id, player1_name, player2_id, player2_name, umpire_id, umpire_name, scheduled_time, actual_start_time, actual_end_time, duration_seconds, status, winner_id, sets) VALUES
('m1', 't1', 'e1', 2, 0, 'Court 1', 'u2', 'Priya Sharma', 'u3', 'Vikas Patel', 'u5', 'Suresh Nair', '2025-06-20T10:00:00Z', NULL, NULL, NULL, 'running', NULL, 
 '[{"set_number": 1, "player1_score": 21, "player2_score": 18, "is_complete": true, "winner_id": "u2"},
   {"set_number": 2, "player1_score": 14, "player2_score": 17, "is_complete": false}]'::JSONB),
('m2', 't1', 'e1', 2, 1, 'Court 2', 'u4', 'Anita Desai', 'u6', 'Rahul Singh', NULL, NULL, '2025-06-20T14:00:00Z', NULL, NULL, NULL, 'scheduled', NULL, '[]'::JSONB),
('m3', 't1', 'e1', 1, 0, 'Court 1', 'u2', 'Priya Sharma', 'u8', 'Amit Verma', NULL, NULL, '2025-06-18T10:00:00Z', NULL, NULL, NULL, 'completed', 'u2', 
 '[{"set_number": 1, "player1_score": 21, "player2_score": 15, "is_complete": true, "winner_id": "u2"},
   {"set_number": 2, "player1_score": 21, "player2_score": 12, "is_complete": true, "winner_id": "u2"}]'::JSONB),
('m4', 't1', 'e1', 1, 1, 'Court 2', 'u3', 'Vikas Patel', 'u10', 'Karthik Rajan', NULL, NULL, '2025-06-18T14:00:00Z', NULL, NULL, NULL, 'completed', 'u3', 
 '[{"set_number": 1, "player1_score": 18, "player2_score": 21, "is_complete": true, "winner_id": "u10"},
   {"set_number": 2, "player1_score": 21, "player2_score": 16, "is_complete": true, "winner_id": "u3"},
   {"set_number": 3, "player1_score": 21, "player2_score": 19, "is_complete": true, "winner_id": "u3"}]'::JSONB),
('m5', 't1', 'e1', 1, 2, 'Court 1', 'u4', 'Anita Desai', 'u7', 'Neha Gupta', NULL, NULL, '2025-06-19T10:00:00Z', NULL, NULL, NULL, 'completed', 'u4', 
 '[{"set_number": 1, "player1_score": 21, "player2_score": 11, "is_complete": true, "winner_id": "u4"},
   {"set_number": 2, "player1_score": 21, "player2_score": 17, "is_complete": true, "winner_id": "u4"}]'::JSONB),
('m6', 't1', 'e1', 1, 3, 'Court 2', 'u6', 'Rahul Singh', 'u9', 'Deepa Menon', NULL, NULL, '2025-06-19T14:00:00Z', NULL, NULL, NULL, 'completed', 'u6', 
 '[{"set_number": 1, "player1_score": 21, "player2_score": 19, "is_complete": true, "winner_id": "u6"},
   {"set_number": 2, "player1_score": 19, "player2_score": 21, "is_complete": true, "winner_id": "u9"},
   {"set_number": 3, "player1_score": 21, "player2_score": 15, "is_complete": true, "winner_id": "u6"}]'::JSONB);
