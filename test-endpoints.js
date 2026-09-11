const fetch = require('node-fetch');

const SUPABASE_URL = 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZnp6dGpwcWVkc2FhemJ2emZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTEzODI0NSwiZXhwIjoyMTA0NzE0MjQ1fQ.u5WmQEoAKREL1YfhpAGwJgu8wF-GfyLYtBv0wuKKrFo';
const ANON_KEY = 'sb_publishable_kMdmYXAFE_gxGiCZHHwrzQ_E3JlEV1l';

const TABLES = [
    `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS subscriptions (
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
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        method TEXT,
        external_id TEXT,
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
];

const POLICIES = [
    `ALTER TABLE users ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE payments ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE sessions ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "Allow all" ON users FOR ALL USING (true)`,
    `CREATE POLICY "Allow all" ON subscriptions FOR ALL USING (true)`,
    `CREATE POLICY "Allow all" ON payments FOR ALL USING (true)`,
    `CREATE POLICY "Allow all" ON sessions FOR ALL USING (true)`
];

async function tryEndpoint(path, method, body) {
    try {
        const response = await fetch(`${SUPABASE_URL}${path}`, {
            method,
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        const text = await response.text();
        return { status: response.status, ok: response.ok, body: text.substring(0, 500) };
    } catch (e) {
        return { status: 0, ok: false, body: e.message };
    }
}

async function main() {
    console.log('=== Testando endpoints possiveis ===\n');

    // Try different SQL endpoints
    const endpoints = [
        { path: '/pg/sql', body: { query: 'SELECT 1' } },
        { path: '/sql', body: { query: 'SELECT 1' } },
        { path: '/rest/v1/rpc', body: {} },
    ];

    for (const ep of endpoints) {
        console.log(`POST ${ep.path}:`);
        const r = await tryEndpoint(ep.path, 'POST', ep.body);
        console.log(`  Status: ${r.status}, OK: ${r.ok}`);
        console.log(`  Body: ${r.body.substring(0, 200)}\n`);
    }

    // Try GET endpoints
    const getEndpoints = ['/pg', '/sql', '/rest/v1/'];
    for (const path of getEndpoints) {
        console.log(`GET ${path}:`);
        const r = await tryEndpoint(path, 'GET');
        console.log(`  Status: ${r.status}, OK: ${r.ok}\n`);
    }

    // Try inserting directly via REST to see what tables exist
    console.log('=== Testando tabelas via REST ===\n');
    const tables = ['users', 'subscriptions', 'payments', 'sessions'];
    for (const table of tables) {
        const r = await tryEndpoint(`/rest/v1/${table}?select=*&limit=1`, 'GET', null);
        console.log(`${table}: Status ${r.status}`);
        if (r.status === 200) console.log(`  Dados: ${r.body.substring(0, 100)}`);
        else console.log(`  Erro: ${r.body.substring(0, 200)}`);
    }
}

main().catch(console.error);
