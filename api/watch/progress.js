const {
    supabase, setCors, handleOptions,
    getToken, verifyToken, validateSession,
    sanitizeString, jsonError
} = require('../_lib/security');

const MAX_ITEMS = 20;

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);

    try {
        const token = getToken(req);
        if (!token) return jsonError(res, 401, 'Login obrigatorio');

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            return jsonError(res, 401, 'Token invalido');
        }

        const session = await validateSession(token);
        if (!session) return jsonError(res, 401, 'Sessao invalida ou expirada');

        const userId = decoded.userId;

        /* GET = lista do usuario (mais recente primeiro) */
        if (req.method === 'GET') {
            const { data } = await supabase.from('watch_progress')
                .select('tmdb_id, media_type, title, poster_path, backdrop_path, season, episode, updated_at')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(MAX_ITEMS);
            const items = (data || []).map(r => ({
                id: r.tmdb_id,
                title: r.title || 'Titulo',
                poster: r.poster_path || null,
                backdrop: r.backdrop_path || null,
                mediaType: r.media_type || 'movie',
                season: r.season || 1,
                episode: r.episode || 1
            }));
            return res.status(200).json({ items });
        }

        /* POST = salva/atualiza um item (upsert por user_id + tmdb_id) */
        if (req.method === 'POST') {
            const b = req.body || {};
            const tmdbId = parseInt(b.tmdbId || b.id, 10);
            if (!tmdbId) return jsonError(res, 400, 'tmdbId obrigatorio');
            const mediaType = ['movie', 'tv', 'anime'].includes(b.mediaType) ? b.mediaType : 'movie';
            const row = {
                user_id: userId,
                tmdb_id: tmdbId,
                media_type: mediaType,
                title: sanitizeString(b.title || '', 200) || 'Titulo',
                poster_path: sanitizeString(b.poster || '', 300) || null,
                backdrop_path: sanitizeString(b.backdrop || '', 300) || null,
                season: Math.max(1, parseInt(b.season, 10) || 1),
                episode: Math.max(1, parseInt(b.episode, 10) || 1),
                updated_at: new Date().toISOString()
            };
            const { error } = await supabase.from('watch_progress')
                .upsert(row, { onConflict: 'user_id,tmdb_id' });
            if (error) return jsonError(res, 500, 'Erro ao salvar progresso');
            return res.status(200).json({ success: true });
        }

        /* DELETE = remove um item (?id=) ou limpa tudo (?all=1) */
        if (req.method === 'DELETE') {
            const url = new URL(req.url, 'http://localhost');
            if (url.searchParams.get('all') === '1') {
                await supabase.from('watch_progress').delete().eq('user_id', userId);
                return res.status(200).json({ success: true });
            }
            const id = parseInt(url.searchParams.get('id'), 10);
            if (!id) return jsonError(res, 400, 'id obrigatorio');
            await supabase.from('watch_progress').delete().eq('user_id', userId).eq('tmdb_id', id);
            return res.status(200).json({ success: true });
        }

        return jsonError(res, 405, 'Method not allowed');
    } catch (error) {
        return jsonError(res, 500, 'Erro interno');
    }
};
