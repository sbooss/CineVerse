export default async function handler(req, res) {
    const { path, ...params } = req.query;
    if (!path) return res.status(400).json({ error: 'Missing path parameter' });

    const API_KEY = process.env.TMDB_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: 'TMDB API key not configured' });

    const BASE_URL = 'https://api.themoviedb.org/3';

    try {
        const url = new URL(BASE_URL + '/' + path);
        url.searchParams.set('api_key', API_KEY);
        url.searchParams.set('language', 'pt-BR');
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
        });

        const response = await fetch(url.toString(), {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'TMDB API error', status: response.status });
        }

        const data = await response.json();
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}
