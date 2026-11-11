/* =====================================================
   CINE BOSS - handler live (proxy de streams ao vivo com whitelist)
   ===================================================== */
const { Readable } = require('stream');

const ALLOWED_HOSTS = new Set([
    '45.162.64.114',
    '45.177.114.115',
    '45.177.114.114',
    '170.83.16.50',
    '170.83.49.66',
    '38.134.250.110',
    '181.78.197.59',
    '185.228.163.146',
    '187.102.210.46',
    '195.23.211.179',
    '200.194.238.229',
    '45.134.141.161',
    '45.166.93.156',
    'wz4.dnip.com.br',
    'play.canalsete.com.br',
    'mgeb.site',
    'mgeb.top',
    'mgeb.lat',
    'www-fontedecanais-live.77zzhf54vdll71.com',
    'data-limit-c.solo-latino.com'
]);

const RESOLVE_HOSTS = new Set(['mgeb.site', 'mgeb.top', 'mgeb.lat']);

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function proxify(uri, base) {
    try {
        const abs = new URL(uri, base).toString();
        return '/api/live?url=' + encodeURIComponent(abs);
    } catch (e) {
        return uri;
    }
}

function setLiveCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
}

async function liveHandler(req, res) {
    setLiveCors(res);
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const raw = req.query.url;
    if (!raw) {
        res.status(400).json({ error: 'Missing url parameter' });
        return;
    }

    let target;
    try {
        target = new URL(raw);
    } catch (e) {
        res.status(400).json({ error: 'Invalid url' });
        return;
    }

    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
        res.status(400).json({ error: 'Invalid protocol' });
        return;
    }
    if (!ALLOWED_HOSTS.has(target.hostname)) {
        res.status(403).json({ error: 'Host not allowed' });
        return;
    }

    const isResolve = req.query.resolve === '1';
    if (isResolve && !RESOLVE_HOSTS.has(target.hostname)) {
        res.status(403).json({ error: 'Resolve not allowed for this host' });
        return;
    }

    const originHeaders = {
        'User-Agent': BROWSER_UA,
        'Accept': '*/*',
        'Referer': target.origin + '/'
    };
    if (req.headers.range) originHeaders['Range'] = req.headers.range;

    const controller = new AbortController();
    const timer = setTimeout(function() { controller.abort(); }, 9000);

    try {
        const response = await fetch(target.toString(), {
            headers: originHeaders,
            signal: controller.signal,
            redirect: 'follow'
        });

        if (isResolve) {
            clearTimeout(timer);
            try {
                const html = await response.text();
                const srcMatches = html.match(/\{"file":"([^"]+)","type":"([^"]+)"/g) || [];
                const altMatches = html.match(/"file"\s*:\s*"([^"]+)"[^}]*?"type"\s*:\s*"([^"]+)"/g) || [];
                const allMatches = srcMatches.length ? srcMatches : altMatches;
                const sources = [];
                const seen = {};
                for (const rawLine of allMatches) {
                    try {
                        const clean = rawLine.replace(/([{,])\s*([A-Za-z_]+)\s*:/g, '$1"$2":');
                        const obj = JSON.parse(clean);
                        const furl = obj.file || obj.url || obj.src;
                        if (furl && !seen[furl]) {
                            seen[furl] = true;
                            sources.push({ url: furl, type: obj.type || 'mp4' });
                        }
                    } catch (e) {}
                }
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.status(200).json({
                    ok: sources.length > 0,
                    sources: sources,
                    debug: {
                        htmlLen: html.length,
                        head: html.replace(/\s+/g, ' ').substring(0, 260),
                        hasSourcesVar: html.indexOf('sources') !== -1,
                        hasFileKey: html.indexOf('"file"') !== -1
                    }
                });
            } catch (e) {
                res.status(200).json({ ok: false, sources: [], debug: { error: String(e && e.message) } });
            }
            return;
        }

        const contentType = response.headers.get('content-type') || '';
        const looksPlaylist = target.pathname.toLowerCase().endsWith('.m3u8') || contentType.indexOf('mpegurl') !== -1;

        if (looksPlaylist) {
            const body = await response.text();
            const rewritten = body.split('\n').map(function(line) {
                const t = line.trim();
                if (!t) return line;
                if (t.charAt(0) === '#') {
                    return line.replace(/URI="([^"]+)"/g, function(m, uri) {
                        return 'URI="' + proxify(uri, target) + '"';
                    });
                }
                return proxify(t, target);
            }).join('\n');
            clearTimeout(timer);
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.status(response.status).send(rewritten);
        } else {
            const len = response.headers.get('content-length');
            const cr = response.headers.get('content-range');
            const ar = response.headers.get('accept-ranges');
            if (len) res.setHeader('Content-Length', len);
            if (cr) res.setHeader('Content-Range', cr);
            if (ar) res.setHeader('Accept-Ranges', ar);
            res.setHeader('Content-Type', contentType || 'video/mp2t');
            res.setHeader('Cache-Control', 'public, max-age=30');
            res.status(response.status);
            if (response.body && Readable.fromWeb) {
                Readable.fromWeb(response.body).pipe(res);
            } else {
                const buf = Buffer.from(await response.arrayBuffer());
                res.send(buf);
            }
        }
    } catch (err) {
        clearTimeout(timer);
        const aborted = err && (err.name === 'AbortError' || String(err.message).indexOf('abort') !== -1);
        res.status(aborted ? 504 : 502).json({ error: aborted ? 'Upstream timeout' : 'Upstream error' });
    }
}

module.exports = { liveHandler };
