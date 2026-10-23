-- ============================================================
-- MatchPoint — Supabase PostgreSQL Consolidated Database Schema
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================

-- Clean up existing tables if they exist
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS payment_orders CASCADE;
DROP TABLE IF EXISTS match_history CASCADE;
DROP TABLE IF EXISTS match_comments CASCADE;
DROP TABLE IF EXISTS tournament_media CASCADE;
DROP TABLE IF EXISTS tournament_feedback CASCADE;
DROP TABLE IF EXISTS tournament_certificates CASCADE;
DROP TABLE IF EXISTS support_requests CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS user_logins CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS tournament_events CASCADE;
DROP TABLE IF EXISTS events_master CASCADE;
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
  age INTEGER,
  gender VARCHAR(10),
  date_of_birth DATE,
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
  age_cutoff_date DATE,
  withdraw_date DATE,
  admins TEXT[] DEFAULT '{}'::TEXT[],
  payment_options JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.5 Event Master Table (Predefined standardized event formats and brackets)
CREATE TABLE events_master (
  id TEXT PRIMARY KEY, -- e.g., 'bs_u13', 'ms_open', 'xd_v40'
  name TEXT NOT NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('singles', 'doubles', 'team')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('junior', 'open', 'veteran')),
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Mixed', 'Open')),
  min_age INTEGER,
  max_age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tournament Events Table (Links tournaments to standardized master events)
CREATE TABLE tournament_events (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  master_event_id TEXT REFERENCES events_master(id) ON DELETE RESTRICT,
  entry_limit INTEGER NOT NULL DEFAULT 32,
  format TEXT NOT NULL CHECK (format IN ('knockout', 'round_robin', 'swiss', 'league', 'hybrid')),
  scoring_format TEXT NOT NULL DEFAULT '21-point',
  registrations_count INTEGER DEFAULT 0,
  entry_fee DECIMAL(10, 2),
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
  partner_name VARCHAR(100),
  partner_email VARCHAR(100),
  partner_gender VARCHAR(10),
  partner_age INTEGER,
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
  round_name VARCHAR(255),
  fixture_position INTEGER NOT NULL DEFAULT 0,
  court TEXT,
  player1_id TEXT,
  player1_name TEXT NOT NULL,
  player2_id TEXT,
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
  status VARCHAR(50) NOT NULL -- 'success', 'failed_bad_credentials'
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

-- 10. Match History Table (detailed point-by-point match data)
CREATE TABLE match_history (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES tournament_events(id) ON DELETE CASCADE,
  umpire_id TEXT,
  umpire_name TEXT,
  player1_name TEXT,
  player2_name TEXT,
  scoring_format TEXT,
  best_of_games INTEGER DEFAULT 3,
  court TEXT,
  points_history JSONB DEFAULT '[]'::JSONB,
  sets_snapshot JSONB DEFAULT '[]'::JSONB,
  total_duration_seconds INTEGER,
  play_time_seconds INTEGER,
  paused_time_seconds INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  winner_id TEXT,
  winner_name TEXT,
  final_status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_match_history_match ON match_history(match_id);
CREATE INDEX IF NOT EXISTS idx_match_history_tournament ON match_history(tournament_id);

-- 11. Tournament Media Table (compressed Base64 files or remote image URLs)
CREATE TABLE tournament_media (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  uploaded_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  caption TEXT,
  media_type VARCHAR(20) NOT NULL DEFAULT 'image',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tournament_media_tour ON tournament_media(tournament_id);

-- 12. Match Comments Table (spectator real-time match comments)
CREATE TABLE match_comments (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_match_comments_match ON match_comments(match_id);

-- 13. Tournament Certificates Table
CREATE TABLE tournament_certificates (
  id TEXT PRIMARY KEY,
  tournament_id TEXT UNIQUE REFERENCES tournaments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  template_type TEXT DEFAULT 'classic',
  signature_data TEXT, -- Base64 encoded signature
  border_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Support Requests Table
CREATE TABLE support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Tournament Feedback Table
CREATE TABLE tournament_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id TEXT,
  user_name TEXT DEFAULT 'Anonymous',
  feedback_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consolidated performance & concurrency-optimized database indexes
CREATE INDEX IF NOT EXISTS idx_matches_tour_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_event_id ON matches(event_id);
CREATE INDEX IF NOT EXISTS idx_matches_p1_id ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_p2_id ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_registrations_tour_id ON registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_player_id ON registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_teams_tour_id ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_events_tour_id ON tournament_events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_user_logins_user_id ON user_logins(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_media_uploaded_by ON tournament_media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_match_comments_user_id ON match_comments(user_id);

-- 16. Payment Orders Table
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  registration_id TEXT REFERENCES registrations(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Payment Transactions Table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES payment_orders(id) ON DELETE CASCADE,
  razorpay_payment_id VARCHAR(100) UNIQUE NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_registration_id ON payment_orders(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay_order_id ON payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);

-- Additional missing foreign key & performance indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX IF NOT EXISTS idx_tournament_events_master_event ON tournament_events(master_event_id);
CREATE INDEX IF NOT EXISTS idx_teams_captain_id ON teams(captain_id);
CREATE INDEX IF NOT EXISTS idx_matches_umpire_id ON matches(umpire_id);
CREATE INDEX IF NOT EXISTS idx_tournament_feedback_tournament ON tournament_feedback(tournament_id);
CREATE INDEX IF NOT EXISTS idx_match_history_event ON match_history(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

