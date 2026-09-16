export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url parameter' });

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        let html = await response.text();

        html = html.replace(/<script[^>]*>[\s\S]*?aclib[\s\S]*?<\/script>/gi, '<!-- ad removed -->');
        html = html.replace(/<script[^>]*>[\s\S]*?acscdn[\s\S]*?<\/script>/gi, '<!-- ad removed -->');
        html = html.replace(/<script[^>]*>[\s\S]*?onclickperformance[\s\S]*?<\/script>/gi, '<!-- ad removed -->');
        html = html.replace(/<script[^>]*>[\s\S]*?zoneId[\s\S]*?<\/script>/gi, '<!-- ad removed -->');
        html = html.replace(/<script[^>]*>[\s\S]*?runPop[\s\S]*?<\/script>/gi, '<!-- ad removed -->');
        html = html.replace(/<script[^>]*src=["'][^"']*aclib[^"']*["'][^>]*><\/script>/gi, '<!-- ad script removed -->');
        html = html.replace(/<script[^>]*src=["'][^"']*acscdn[^"']*["'][^>]*><\/script>/gi, '<!-- ad script removed -->');
        html = html.replace(/<script[^>]*src=["'][^"']*onclickperformance[^"']*["'][^>]*><\/script>/gi, '<!-- ad script removed -->');
        html = html.replace(/<script[^>]*src=["'][^"']*disable-devtool[^"']*["'][^>]*><\/script>/gi, '<!-- devtool blocker removed -->');
        html = html.replace(/DisableDevtool\([\s\S]*?\);/g, '');
        html = html.replace(/<script>[\s\S]*?ondevtoolopen[\s\S]*?<\/script>/gi, '<!-- devtool handler removed -->');
        html = html.replace(/<iframe[^>]*height=["']?1["']?[^>]*style=["'][^"']*visibility:\s*hidden[^"']*["'][^>]*><\/iframe>/gi, '<!-- hidden ad iframe removed -->');
        html = html.replace(/var _Hasync[\s\S]*?<\/script>/gi, '<!-- histats removed -->');
        html = html.replace(/<noscript>[\s\S]*?Histats[\s\S]*?<\/noscript>/gi, '');
        html = html.replace(/<script[^>]*src=["'][^"']*cloudflareinsights[^"']*["'][^>]*><\/script>/gi, '<!-- cf removed -->');
        html = html.replace(/<script>[\s\S]*?__CF\$cv\$params[\s\S]*?<\/script>/gi, '');
        html = html.replace(/webstats[\s\S]*?<\/script>/gi, '<!-- webstats removed -->');

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).send(html);
    } catch (err) {
        res.status(500).json({ error: 'Proxy fetch failed', details: err.message });
    }
}
