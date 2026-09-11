const fetch = require('node-fetch');

const SUPABASE_URL = 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZnp6dGpwcWVkc2FhemJ2emZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTEzODI0NSwiZXhwIjoyMTA0NzE0MjQ1fQ.u5WmQEoAKREL1YfhpAGwJgu8wF-GfyLYtBv0wuKKrFo';

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

async function execSQL(sql) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });
    return { status: response.status, ok: response.ok, body: await response.text() };
}

async function testTable(table) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=1`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        }
    });
    return response.ok;
}

async function main() {
    console.log('Testando conexao com service_role...\n');

    const usersExist = await testTable('users');
    console.log('Tabela users existe:', usersExist);

    if (!usersExist) {
        console.log('\nTentando criar tabelas via exec_sql...');
        const result = await execSQL(SQL);
        console.log('Status:', result.status);
        console.log('OK:', result.ok);
        console.log('Body:', result.body.substring(0, 300));
    }

    // Test again
    console.log('\nVerificando tabelas...');
    for (const table of ['users', 'subscriptions', 'payments', 'sessions']) {
        const exists = await testTable(table);
        console.log(`${table}: ${exists ? 'OK' : 'NAO EXISTE'}`);
    }
}

main().catch(console.error);
