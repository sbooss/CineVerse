/* =====================================================
   CINE BOSS - Renderizacao server-side das paginas de assistir
   injeta dados reais do TMDB no HTML servido ao crawler
   fallback seguro: devolve o template estatico intacto
   ===================================================== */
const { ASSISTIR_TEMPLATE } = require('../assistirTemplate');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/';

// cache em memoria por instancia de lambda
const memo = new Map();
const MEMO_TTL = 6 * 60 * 60 * 1000; // 6h

// genero id -> pagina interna de catalogo existente
const GENRE_MOVIE = {
    28: { label: 'Acao', page: 'filmes-de-acao.html' },
    35: { label: 'Comedia', page: 'filmes-de-comedia.html' },
    27: { label: 'Terror', page: 'filmes-de-terror.html' },
    10749: { label: 'Romance', page: 'filmes-de-romance.html' },
    878: { label: 'Ficcao Cientifica', page: 'filmes-de-ficcao-cientifica.html' },
    18: { label: 'Drama', page: 'filmes-de-drama.html' },
    53: { label: 'Suspense', page: 'filmes-de-suspense.html' },
    16: { label: 'Animacao', page: 'filmes-de-animacao.html' },
    80: { label: 'Crime', page: 'filmes-de-crime.html' },
    9648: { label: 'Misterio', page: 'filmes-de-misterio.html' },
    10752: { label: 'Guerra', page: 'filmes-de-guerra.html' },
    99: { label: 'Documentario', page: 'documentarios.html' }
};
const GENRE_TV = {
    10759: { label: 'Acao', page: 'series-de-acao.html' },
    35: { label: 'Comedia', page: 'series-de-comedia.html' },
    18: { label: 'Drama', page: 'series-de-drama.html' },
    9648: { label: 'Misterio', page: 'series-de-misterio.html' },
    16: { label: 'Animacao', page: 'series-de-animacao.html' },
    14: { label: 'Fantasia', page: 'series-de-fantasia.html' },
    10765: { label: 'Ficcao Cientifica', page: 'series-de-animacao.html' }
};

function esc(s) {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* aceita /assistir/movie/123-slug (com ou sem prefixo /api do rewrite) */
function parseSegments(typeParam, idParam) {
    if (!typeParam || !idParam) return null;
    if (typeParam !== 'movie' && typeParam !== 'tv') return null;
    const m = String(idParam).match(/^(\d+)(?:-.*)?$/);
    if (!m) return null;
    return { type: typeParam, id: m[1] };
}

async function fetchTmdb(type, id) {
    const key = process.env.TMDB_API_KEY;
    if (!key) return { miss: true, status: 0 };
    const url = TMDB_BASE + '/' + (type === 'movie' ? 'movie' : 'tv') + '/' + id +
        '?api_key=' + encodeURIComponent(key) +
        '&language=pt-BR' +
        '&append_to_response=credits,videos';
    try {
        const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!r.ok) return { miss: true, status: r.status };
        const d = await r.json();
        return { miss: false, data: d };
    } catch (e) {
        return { miss: true, status: 0 };
    }
}

function replaceFirst(html, needle, replacement) {
    if (needle === undefined || needle === null) return html;
    const i = html.indexOf(needle);
    if (i === -1) return html;
    return html.slice(0, i) + replacement + html.slice(i + needle.length);
}

function buildSeoBlock(d, type, genres) {
    const isMovie = type === 'movie';
    const casting = (d.credits && d.credits.cast) ? d.credits.cast.slice(0, 8).map(c => c.name).filter(Boolean) : [];
    const genreMap = isMovie ? GENRE_MOVIE : GENRE_TV;
    const genreLinks = genres.map(function (g) {
        const info = genreMap[g.id];
        if (!info) return null;
        return { label: info.label, page: info.page };
    }).filter(Boolean).slice(0, 4);

    var trailerUrl = null;
    if (d.videos && Array.isArray(d.videos.results)) {
        var yt = d.videos.results.filter(function (v) { return v.site === 'YouTube' && v.key; });
        var pref = yt.find(function (v) { return v.type === 'Trailer'; }) || yt[0];
        if (pref) trailerUrl = 'https://www.youtube-nocookie.com/embed/' + esc(pref.key);
    }

    var parts = [];
    parts.push('<section class="detail-seo" style="background:#0c0c16;border-top:1px solid rgba(255,255,255,0.05);padding:38px 24px 60px;">');
    parts.push('<div style="max-width:1080px;margin:0 auto;">');
    parts.push('<h2 style="font-family:Sora,sans-serif;font-size:19px;font-weight:700;margin-bottom:14px;color:#e8e8f0;">Sobre ' + esc(d.title || d.name) + '</h2>');
    parts.push('<p style="color:#8a8aa0;font-size:14px;line-height:1.9;max-width:760px;margin-bottom:12px;">' + esc(d.overview || '') + '</p>');
    if (casting.length) {
        parts.push('<p style="color:#8a8aa0;font-size:14px;line-height:1.9;max-width:760px;margin-bottom:12px;"><strong style="color:#e8e8f0;">Elenco:</strong> ' + esc(casting.join(', ')) + '.</p>');
    }
    if (genreLinks.length) {
        var links = genreLinks.map(function (gl) {
            return '<a href="/' + gl.page + '" style="color:#00a8e0;font-weight:600;">' + esc(gl.label) + '</a>';
        }).join(', ');
        parts.push('<p style="color:#8a8aa0;font-size:14px;line-height:1.9;max-width:760px;margin-bottom:12px;"><strong style="color:#e8e8f0;">Mais nesta categoria:</strong> ' + links + '.</p>');
    }
    if (trailerUrl) {
        parts.push('<p style="color:#8a8aa0;font-size:14px;line-height:1.9;max-width:760px;margin-bottom:12px;"><a href="' + trailerUrl + '" rel="nofollow noopener" target="_blank" style="color:#00a8e0;font-weight:600;">Ver trailer oficial</a>.</p>');
    }
    parts.push('<p style="color:#4a4a60;font-size:13px;line-height:1.9;max-width:760px;">Assista ' + esc(d.title || d.name) + ' online em portugues' + (isMovie ? ', dublado ou legendado' : ', todas as temporadas dubladas e legendadas') + ' em HD no CINE BOSS, sem anuncios, no celular, computador ou Smart TV.</p>');
    parts.push('</div>');
    parts.push('</section>');
    return parts.join('');
}

async function assistirHandler(req, res) {
    // extrai type e id do proprio req.url (funciona com rewrite /api/assistir/:type/:idslug
    // e com a rota original /assistir/:type/:idslug)
    let raw = String(req.url || '');
    let m = raw.match(/\/(?:api\/)?assistir\/(movie|tv)\/(\d+)(?:-[^\/]*)?\/?(\?|$)/);
    let parsed = m ? { type: m[1], id: m[2] } : null;
    const template = ASSISTIR_TEMPLATE || null;

    if (!parsed || !template) {
        if (template) {
            res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
            res.status(200).send(template);
        } else {
            res.status(404).send('Not found');
        }
        return;
    }

    const { type, id } = parsed;
    const cacheKey = type + ':' + id;
    const now = Date.now();
    var cached = memo.get(cacheKey);
    if (cached && cached.expires > now) cached = cached.data;
    else cached = null;

    var result = cached || await fetchTmdb(type, id);
    if (cached) result = cached;

    // erro de rede ou chave ausente: template estatico (comportamento JS atual)
    if (!result || result.miss && (result.status === 0 || result.status === 429 || result.status >= 500)) {
        if (!cached) memo.set(cacheKey, { expires: now + 60 * 1000, data: { miss: true, status: result ? result.status : 0 } });
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.status(200).send(template);
        return;
    }

    // 404 real do TMDB: URL invalida deve sinalizar 404 ao Google
    if (result.miss && (result.status === 404 || result.status === 400)) {
        if (!cached) memo.set(cacheKey, { expires: now + 24 * 60 * 60 * 1000, data: result });
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400');
        var notFound = template;
        notFound = notFound.replace('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">', '<meta name="robots" content="noindex, follow">');
        notFound = replaceFirst(notFound, '<div class="loader" id="loader">CARREGANDO...</div>', '<div class="loader" id="loader" style="display:none">CARREGANDO...</div>');
        res.status(404).send(notFound);
        return;
    }

    const d = result.data;
    if (!d || !d.id) {
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
        res.status(200).send(template);
        return;
    }
    if (!cached) memo.set(cacheKey, { expires: now + MEMO_TTL, data: { miss: false, data: d } });

    // resume o comportamento padrao: mapear campos com fallback
    if (!d.overview && !d.adult) {
        // tentar overview em ingles se vier vazio
        try {
            const key = process.env.TMDB_API_KEY;
            if (key) {
                const en = await fetch(TMDB_BASE + '/' + (type === 'movie' ? 'movie' : 'tv') + '/' + id + '?api_key=' + encodeURIComponent(key) + '&language=en-US');
                if (en.ok) {
                    const de = await en.json();
                    if (de && de.overview) { d.overview = de.overview; d.credits = d.credits || de.credits; }
                }
            }
        } catch (e) {}
    }

    const title = d.title || d.name || '';
    if (!title) {
        res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=1800');
        res.status(200).send(template);
        return;
    }
    const date = d.release_date || d.first_air_date || '';
    const year = date ? String(date).substring(0, 4) : '';
    const overview = d.overview || '';
    const poster = d.poster_path ? (IMG + 'w500' + d.poster_path) : null;
    const backdrop = d.backdrop_path ? (IMG + 'w1280' + d.backdrop_path) : null;
    const rating = d.vote_average ? Number(d.vote_average).toFixed(1) : null;
    const runtime = d.runtime ? d.runtime + ' min' : '';

    const fullTitle = (type === 'movie')
        ? 'Assistir ' + title + ' Online Dublado'
        : 'Assistir ' + title + ' - Todas as Temporadas Online';
    var desc = 'Assistir ' + title + ' online em portugues' + (year ? ' (' + year + ')' : '') + ', dublado ou legendado em HD no CINE BOSS. ' + (overview ? overview : '');
    if (desc.length > 158) desc = desc.slice(0, 155).trim() + '...';

    var html = template;
    const selfUrl = 'https://cineboss.online/assistir/' + type + '/' + id;

    html = replaceFirst(html, '<title>Assistir Online Dublado e Legendado em HD | CINE BOSS</title>', '<title>' + esc(fullTitle) + ' | CINE BOSS</title>');
    html = replaceFirst(html, '<meta name="description" content="Assistir online em portugues, dublado ou legendado em HD no CINE BOSS.">', '<meta name="description" content="' + esc(desc) + '">');
    html = replaceFirst(html, '<link rel="canonical" href="https://cineboss.online/">', '<link rel="canonical" href="' + esc(selfUrl) + '">');
    html = replaceFirst(html, '<meta property="og:title" content="Assistir Online | CINE BOSS">', '<meta property="og:title" content="' + esc(fullTitle) + ' | CINE BOSS">');
    html = replaceFirst(html, '<meta property="og:description" content="Assistir online em portugues, em HD, no CINE BOSS.">', '<meta property="og:description" content="' + esc(desc) + '">');
    html = replaceFirst(html, '<meta property="og:url" content="https://cineboss.online/">', '<meta property="og:url" content="' + esc(selfUrl) + '">');
    html = replaceFirst(html, '<meta property="og:type" content="video.movie">', '<meta property="og:type" content="' + (type === 'movie' ? 'video.movie' : 'video.tv_show') + '">');
    if (poster) {
        html = replaceFirst(html, '<meta property="og:image" content="https://cineboss.online/og-image.png">', '<meta property="og:image" content="' + esc(poster) + '">');
        html = replaceFirst(html, '<meta name="twitter:image" content="https://cineboss.online/og-image.png">', '<meta name="twitter:image" content="' + esc(poster) + '">');
    }
    html = replaceFirst(html, '<meta name="twitter:title" content="Assistir Online | CINE BOSS">', '<meta name="twitter:title" content="' + esc(fullTitle) + ' | CINE BOSS">');
    html = replaceFirst(html, '<meta name="twitter:description" content="Assistir online em portugues, em HD, no CINE BOSS.">', '<meta name="twitter:description" content="' + esc(desc) + '">');

    // corpo visivel server-side
    html = replaceFirst(html, '<h1 id="title"></h1>', '<h1 id="title">' + esc(title) + (year ? ' (' + esc(year) + ')' : '') + '</h1>');
    html = replaceFirst(html, '<p class="overview" id="overview"></p>', '<p class="overview" id="overview">' + esc(overview || 'Sinopse em breve. Assista agora mesmo no CINE BOSS.') + '</p>');
    html = replaceFirst(html, '<span class="star" id="rating"></span>', '<span class="star" id="rating">' + (rating ? '<i class="fas fa-star"></i> ' + esc(rating) : '') + '</span>');
    html = replaceFirst(html, '<span id="year"></span>', '<span id="year">' + esc(type === 'tv' && d.number_of_seasons ? (d.number_of_seasons + ' temporada' + (d.number_of_seasons > 1 ? 's' : '')) : (year || '')) + '</span>');
    html = replaceFirst(html, '<span id="extra"></span>', '<span id="extra">' + esc(runtime) + '</span>');
    html = type === 'movie'
        ? html
        : replaceFirst(html, '<span class="type-badge" id="typeBadge">FILME</span>', '<span class="type-badge" id="typeBadge">SERIE</span>');
    if (poster) {
        html = replaceFirst(html, '<img class="poster" id="poster" src="icon-512.png" alt="">', '<img class="poster" id="poster" src="' + esc(poster) + '" alt="' + esc(title) + ' - poster">');
    }
    if (backdrop) {
        html = replaceFirst(html, '<div class="hero-bg" id="heroBg"></div>', '<div class="hero-bg" id="heroBg" style="background-image:url(' + esc(backdrop) + ')"></div>');
    }
    html = replaceFirst(html, '<div class="loader" id="loader">CARREGANDO...</div>', '<div class="loader" id="loader" style="display:none">CARREGANDO...</div>');
    html = replaceFirst(html, 'id="heroContent" style="display:none"', 'id="heroContent" style="display:flex"');
    const playHref = (type === 'tv') ? '/series.html?open=tv:' + id : '/filmes.html?open=movie:' + id;
    html = replaceFirst(html, '<a class="btn-play" id="playBtn" href="/">', '<a class="btn-play" id="playBtn" href="' + esc(playHref) + '">');

    // bloco SEO server-side com sinopse/elenco/generos/trailer
    const genres = (d.genres || []).map(function (g) { return { id: g.id, name: g.name }; });
    html = replaceFirst(html, '</main>', buildSeoBlock(d, type, genres) + '</main>');

    // JSON-LD Movie/TVSeries + BreadcrumbList
    const ld = {
        '@context': 'https://schema.org',
        '@type': type === 'movie' ? 'Movie' : 'TVSeries',
        name: title,
        description: overview || undefined,
        image: poster ? [poster] : undefined,
        inLanguage: 'pt-BR',
        url: selfUrl,
        genre: genres.map(function (g) { return g.name; }),
        datePublished: date || undefined,
        aggregateRating: (d.vote_average && d.vote_count) ? {
            '@type': 'AggregateRating',
            ratingValue: String(rating),
            ratingCount: String(d.vote_count),
            bestRating: '10',
            worstRating: '1'
        } : undefined
    };
    const ldCrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://cineboss.online/' },
            { '@type': 'ListItem', position: 2, name: type === 'movie' ? 'Filmes' : 'Series', item: 'https://cineboss.online/' + (type === 'movie' ? 'filmes.html' : 'series.html') },
            { '@type': 'ListItem', position: 3, name: title, item: selfUrl }
        ]
    };
    html = replaceFirst(html, '</head>',
        '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>' +
        '<script type="application/ld+json">' + JSON.stringify(ldCrumb) + '</script>' +
        '</head>');

    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=604800, stale-while-revalidate=2592000');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
}

module.exports = { assistirHandler };
