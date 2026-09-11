const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZnp6dGpwcWVkc2FhemJ2emZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTEzODI0NSwiZXhwIjoyMTA0NzE0MjQ1fQ.u5WmQEoAKREL1YfhpAGwJgu8wF-GfyLYtBv0wuKKrFo';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TABLES = [
    {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
    },
    {
        name: 'subscriptions',
        sql: `CREATE TABLE IF NOT EXISTS subscriptions (
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
        )`
    },
    {
        name: 'payments',
        sql: `CREATE TABLE IF NOT EXISTS payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            amount DECIMAL(10,2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            method TEXT,
            external_id TEXT,
            paid_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
    },
    {
        name: 'sessions',
        sql: `CREATE TABLE IF NOT EXISTS sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            token TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
    }
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

async function main() {
    console.log('=== Testando conexao com Supabase JS Client ===\n');

    // Test basic connection
    console.log('1. Testando conexao basica...');
    const { data: testData, error: testError } = await supabase
        .from('_test_nonexistent_')
        .select('*')
        .limit(1);

    if (testError) {
        if (testError.message.includes('does not exist')) {
            console.log('   Conexao OK! Tabelas ainda nao existem.\n');
        } else {
            console.log(`   Erro: ${testError.message}\n`);
        }
    } else {
        console.log('   OK!\n');
    }

    // Try to check if exec_sql function exists
    console.log('2. Verificando se exec_sql existe...');
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('exec_sql', { query: 'SELECT 1' });

    if (rpcError) {
        console.log(`   exec_sql NAO existe: ${rpcError.message}\n`);
    } else {
        console.log('   exec_sql existe!\n');
    }

    // Try to create tables using raw SQL via the database
    console.log('3. Tentando criar tabelas via PostgREST...\n');

    for (const table of TABLES) {
        console.log(`   Criando tabela "${table.name}"...`);

        // Try using rpc with a generic function
        const { data, error } = await supabase.rpc('exec_sql', { sql: table.sql });

        if (error) {
            console.log(`   Erro: ${error.message}`);
        } else {
            console.log(`   OK!`);
        }
    }

    console.log('\n4. Verificando tabelas...\n');

    for (const table of TABLES) {
        const { data, error } = await supabase
            .from(table.name)
            .select('*')
            .limit(1);

        if (error) {
            console.log(`   ${table.name}: ${error.message}`);
        } else {
            console.log(`   ${table.name}: EXISTE!`);
        }
    }
}

main().catch(console.error);
