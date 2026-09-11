const { Client } = require('pg');

const DB_PASSWORD = '4Y2157MJECvEj3kG';
const PROJECT_REF = 'dofzztjpqedsaazbvzfg';

const HOSTS = [
    `aws-0-us-east-2.pooler.supabase.com`,
    `aws-0-us-east-1.pooler.supabase.com`,
    `aws-0-sa-east-1.pooler.supabase.com`,
    `aws-0-eu-west-1.pooler.supabase.com`,
];

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

CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on subscriptions" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all on payments" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true);
`;

async function tryConnection(host, port) {
    const client = new Client({
        host,
        port,
        database: 'postgres',
        user: `postgres.${PROJECT_REF}`,
        password: DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log(`CONECTADO: ${host}:${port}`);
        
        await client.query(SQL);
        console.log('Tabelas criadas com sucesso!');
        
        const tables = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        console.log('\nTabelas existentes:');
        tables.rows.forEach(r => console.log(`  - ${r.table_name}`));
        
        await client.end();
        return true;
    } catch (error) {
        console.log(`Falha: ${host}:${port} - ${error.message.substring(0, 100)}`);
        try { await client.end(); } catch(e) {}
        return false;
    }
}

async function main() {
    console.log('=== Conexao PostgreSQL Direta ===\n');
    
    for (const host of HOSTS) {
        for (const port of [5432, 6543]) {
            const ok = await tryConnection(host, port);
            if (ok) return;
        }
    }
    
    console.log('\nNenhuma conexao funcionou. Verifique a senha.');
}

main().catch(console.error);
