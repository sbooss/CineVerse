const fetch = require('node-fetch');

const SUPABASE_URL = 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kMdmYXAFE_gxGiCZHHwrzQ_E3JlEV1l';

const SQL = `
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_id TEXT,
    payment_method TEXT,
    amount DECIMAL(10,2) NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    method TEXT,
    external_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all" ON sessions FOR ALL USING (true);
`;

async function createViaSQL() {
    console.log('Tentando criar tabelas via SQL endpoint...\n');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: SQL })
        });

        console.log('Status:', response.status);
        const data = await response.text();
        console.log('Resposta:', data.substring(0, 500));
    } catch (error) {
        console.log('Erro:', error.message);
    }
}

async function createViaPostgREST() {
    console.log('\nTentando via PostgREST...\n');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                query: SQL
            })
        });

        console.log('Status:', response.status);
        const data = await response.text();
        console.log('Resposta:', data.substring(0, 500));
    } catch (error) {
        console.log('Erro:', error.message);
    }
}

async function main() {
    await createViaSQL();
    await createViaPostgREST();
}

main().catch(console.error);
