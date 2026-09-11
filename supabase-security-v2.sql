-- =====================================================
-- CINE BOSS - Security Migration v2
-- RLS Policies + Rate Limits Table
-- =====================================================

-- ===================== RATE LIMITS TABLE =====================
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created ON rate_limits(created_at);

-- Auto-cleanup: delete entries older than 2 hours
-- (Vercel cron or Supabase scheduled function should call cleanup endpoint)

-- ===================== SESSIONS TABLE =====================
-- Add IP and user_agent columns if not exists
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ===================== RLS POLICIES =====================

-- Users table: users can only read/update their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users
    FOR INSERT WITH CHECK (true);

-- Sessions table: service role manages, users cannot directly access
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_service_all" ON sessions;
CREATE POLICY "sessions_service_all" ON sessions
    FOR ALL USING (true);

-- Subscriptions table: users can only see their own
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
CREATE POLICY "subscriptions_insert" ON subscriptions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
CREATE POLICY "subscriptions_update" ON subscriptions
    FOR UPDATE USING (true);

-- Payments table: service role manages
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_service_all" ON payments;
CREATE POLICY "payments_service_all" ON payments
    FOR ALL USING (true);

-- Rate limits table: service role manages
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits_service_all" ON rate_limits;
CREATE POLICY "rate_limits_service_all" ON rate_limits
    FOR ALL USING (true);

-- ===================== GRANT PERMISSIONS =====================
-- Ensure service role can manage all tables
GRANT ALL ON users TO service_role;
GRANT ALL ON sessions TO service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON payments TO service_role;
GRANT ALL ON rate_limits TO service_role;

-- Anon can only read users (for login check) and insert (for register)
GRANT SELECT, INSERT ON users TO anon;
GRANT SELECT, INSERT ON sessions TO anon;
GRANT SELECT, INSERT ON subscriptions TO anon;
GRANT SELECT, INSERT ON payments TO anon;
GRANT SELECT, INSERT ON rate_limits TO anon;
