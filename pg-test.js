const { Client } = require('pg');

const DB_PASSWORD = '4Y2157MJECvEj3kG';
const PROJECT_REF = 'dofzztjpqedsaazbvzfg';

async function main() {
    const hosts = [
        { host: `db.${PROJECT_REF}.supabase.co`, port: 5432 },
        { host: `aws-0-us-east-2.pooler.supabase.com`, port: 5432 },
        { host: `aws-0-us-east-2.pooler.supabase.com`, port: 6543 },
    ];

    for (const { host, port } of hosts) {
        console.log(`Tentando ${host}:${port}...`);
        
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
            console.log('CONECTADO!');
            
            const res = await client.query('SELECT current_database(), current_user');
            console.log('Database:', res.rows[0].current_database);
            console.log('User:', res.rows[0].current_user);
            
            await client.end();
            return;
        } catch (error) {
            console.log(`Falha: ${error.message.substring(0, 80)}`);
        }
    }
    
    console.log('\nNenhuma conexao funcionou.');
}

main();
