export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url parameter' });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const PROXY_SERVICES = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?url='
    ];

    for (const proxyBase of PROXY_SERVICES) {
        try {
            const response = await fetch(proxyBase + encodeURIComponent(url), {
                headers: { 'Accept': 'text/html' },
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) continue;
            const html = await response.text();
            if (html.includes('Just a moment') || html.includes('cf-browser-verification')) continue;

            const sourcesMatch = html.match(/var\s+sources\s*=\s*(\[[\s\S]*?\])\s*;/);
            if (!sourcesMatch) continue;

            let sources;
            try { sources = JSON.parse(sourcesMatch[1]); } catch(e) { continue; }

            const titleMatch = html.match(/var\s+title\s*=\s*["']([^"']*)["']/);
            const posterMatch = html.match(/var\s+poster\s*=\s*["']([^"']*)["']/);
            const backdropMatch = html.match(/var\s+backdrop\s*=\s*["']([^"']*)["']/);
            const overviewMatch = html.match(/var\s+overview\s*=\s*["']([\s\S]*?)["'];/);

            return res.status(200).json({
                ok: true,
                sources: sources,
                title: titleMatch ? titleMatch[1] : '',
                poster: posterMatch ? posterMatch[1] : '',
                backdrop: backdropMatch ? backdropMatch[1] : '',
                overview: overviewMatch ? overviewMatch[1] : ''
            });
        } catch(e) { continue; }
    }

    return res.status(200).json({ ok: false, fallback: true });
}
