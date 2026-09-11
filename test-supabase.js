const fetch = require('node-fetch');

const SUPABASE_URL = 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kMdmYXAFE_gxGiCZHHwrzQ_E3JlEV1l';
const SUPABASE_REST = `${SUPABASE_URL}/rest/v1/`;

async function testConnection() {
    console.log('Testando conexao com Supabase...');
    console.log('URL:', SUPABASE_URL);
    console.log('Key:', SUPABASE_KEY.substring(0, 20) + '...');

    try {
        const response = await fetch(`${SUPABASE_REST}users?select=count&limit=1`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        if (response.status === 404) {
            console.log('\nTabela "users" nao existe. Precisa criar as tabelas.');
            return false;
        }

        if (response.status === 200) {
            const data = await response.json();
            console.log('Tabela "users" existe. Registros:', data.length);
            return true;
        }

        const error = await response.json();
        console.log('Erro:', error);
        return false;
    } catch (error) {
        console.error('Erro de conexao:', error.message);
        return false;
    }
}

async function createTables() {
    console.log('\nCriando tabelas no Supabase...');
    
    const queries = [
        {
            name: 'users',
            sql: `
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'subscriptions',
            sql: `
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    plan TEXT NOT NULL CHECK (plan IN ('monthly', 'quarterly')),
                    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
                    payment_id TEXT,
                    payment_method TEXT,
                    amount DECIMAL(10,2) NOT NULL,
                    activated_at TIMESTAMP WITH TIME ZONE,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'payments',
            sql: `
                CREATE TABLE IF NOT EXISTS payments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    amount DECIMAL(10,2) NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
                    method TEXT,
                    external_id TEXT,
                    paid_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'sessions',
            sql: `
                CREATE TABLE IF NOT EXISTS sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    token TEXT NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        }
    ];

    for (const query of queries) {
        console.log(`\nCriando tabela "${query.name}"...`);
        
        try {
            const response = await fetch(`${SUPABASE_REST}rpc/exec`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: query.sql })
            });

            if (response.ok) {
                console.log(`Tabela "${query.name}" criada com sucesso!`);
            } else {
                const error = await response.json();
                console.log(`Erro ao criar tabela "${query.name}":`, error.message);
            }
        } catch (error) {
            console.error(`Erro ao criar tabela "${query.name}":`, error.message);
        }
    }
}

async function main() {
    const connected = await testConnection();
    
    if (!connected) {
        console.log('\nTentando criar tabelas...');
        await createTables();
    }
    
    console.log('\nTeste de conexao finalizado.');
}

main().catch(console.error);
