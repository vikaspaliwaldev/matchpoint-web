-- ============================================================
-- MatchPoint Migration v4 — Feature Flags Support
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    config JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial sport toggles
INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('sport_badminton', 'Badminton', 'Enable Badminton sport selection and live view panels', true)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('sport_table_tennis', 'Table Tennis', 'Enable Table Tennis sport selection and live view panels', false)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('sport_squash', 'Squash', 'Enable Squash sport selection and live view panels', false)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('sport_tennis', 'Tennis', 'Enable Tennis sport selection and live view panels', false)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('sport_volleyball', 'Volleyball', 'Enable Volleyball sport selection and live view panels', false)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('sport_cricket', 'Cricket', 'Enable Cricket sport selection and live view panels', false)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('sport_basketball', 'Basketball', 'Enable Basketball sport selection and live view panels', false)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Seed initial feature toggles
INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('feature_polls', 'Live Match Polls', 'Enable audience poll panels', true)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('feature_watch', 'Watch Live Streams', 'Enable direct live stream redirect buttons', true)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('feature_comments', 'Live Comments/Chat', 'Enable user commentary sidebar sections', true)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO feature_flags (flag_key, name, description, is_enabled) VALUES
('feature_media', 'Live Media Uploads', 'Enable viewing photos and videos uploaded by users', true)
ON CONFLICT (flag_key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
