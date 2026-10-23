-- Create password resets table
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the 6-digit OTP
    expires_at TIMESTAMP NOT NULL,
    attempts INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);

-- Update tournaments to store registration fees & Connect account ID
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS collects_fees BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS entry_fee NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS platform_fee_percentage NUMERIC(5, 2) DEFAULT 2.00;

-- Update registrations to include status for payment and options
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'stripe';

-- Create transactions table for payment tracking
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id TEXT REFERENCES registrations(id) ON DELETE SET NULL,
    tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'refunded'
    stripe_session_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transactions_session ON transactions(stripe_session_id);
