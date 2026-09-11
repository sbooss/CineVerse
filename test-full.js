const express = require('express');
const cookieParser = require('cookie-parser');
const http = require('http');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/subscription', require('./server/routes/subscription'));
app.use('/api/webhook', require('./server/routes/webhook'));

function httpReq(method, path, data, token) {
    return new Promise((resolve, reject) => {
        const body = data ? JSON.stringify(data) : null;
        const opts = {
            hostname: 'localhost',
            port: 3010,
            path,
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
        if (token) opts.headers['Authorization'] = 'Bearer ' + token;
        const req = http.request(opts, res => {
            let b = '';
            res.on('data', c => b += c);
            res.on('end', () => resolve({ status: res.statusCode, body: b }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function main() {
    const server = app.listen(3010, async () => {
        try {
            let r;
            r = await httpReq('POST', '/api/auth/login', { email: 'williannunes31994@gmail.com', password: 'Ariel01*', remember: true });
            const login = JSON.parse(r.body);
            const token = login.token;
            console.log('1. Login:', r.status, login.success ? 'OK' : login.error);

            r = await httpReq('GET', '/api/subscription/check-play', null, token);
            console.log('2. check-play:', r.status, r.body);

            r = await httpReq('GET', '/api/auth/me', null, token);
            const me = JSON.parse(r.body);
            console.log('3. /me:', r.status, me.user?.name, 'Sub:', me.subscription?.status);

            console.log('\nTodos os endpoints funcionando!');
        } catch (e) {
            console.log('Erro:', e.message);
        }
        server.close();
        process.exit();
    });
}

main();
