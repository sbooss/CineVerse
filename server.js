const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const zlib = require('zlib');

const PORT = 3000;
const DIR = __dirname;
const TMDB_KEYS = ['eb9690431d1dd3d86de35def2b1b0a2c'];
const MIME = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};

function getRandomKey() { return TMDB_KEYS[Math.floor(Math.random() * TMDB_KEYS.length)]; }

function proxyTMDB(endpoint, res) {
    const key = getRandomKey();
    const sep = endpoint.includes('?') ? '&' : '?';
    const url = `https://api.themoviedb.org/3/${endpoint}${sep}api_key=${key}&language=pt-BR`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (upstream) => {
        let body = '';
        upstream.on('data', c => body += c);
        upstream.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
            res.end(body);
        });
    }).on('error', (e) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    });
}

function serveFile(filePath, res) {
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': mime + '; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const parsed = new URL(req.url, `http://localhost:${PORT}`);
    let pathname = decodeURIComponent(parsed.pathname);

    if (pathname.startsWith('/api/tmdb/')) {
        proxyTMDB(pathname.slice(10) + parsed.search, res);
    } else if (pathname === '/' || pathname === '') {
        serveFile(path.join(DIR, 'index.html'), res);
    } else {
        serveFile(path.join(DIR, pathname), res);
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('CineVerse rodando em http://localhost:' + PORT);
});

process.on('uncaughtException', () => {});
