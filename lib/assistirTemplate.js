/* template servido como string; gerado do assistir.html formulario desktop CineVerse */
export const ASSISTIR_TEMPLATE = <!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assistir Online Dublado e Legendado em HD | CINE BOSS</title>
    <meta name="description" content="Assistir online em portugues, dublado ou legendado em HD no CINE BOSS.">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <link rel="canonical" href="https://cineboss.online/">
    <meta property="og:type" content="video.movie">
    <meta property="og:site_name" content="CINE BOSS">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:title" content="Assistir Online | CINE BOSS">
    <meta property="og:description" content="Assistir online em portugues, em HD, no CINE BOSS.">
    <meta property="og:image" content="https://cineboss.online/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Assistir Online | CINE BOSS">
    <meta name="twitter:description" content="Assistir online em portugues, em HD, no CINE BOSS.">
    <meta name="twitter:image" content="https://cineboss.online/og-image.png">
    <meta name="theme-color" content="#050508">
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="preload" as="style" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" media="print" onload="this.media='all'">
    <link rel="preconnect" href="https://image.tmdb.org">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg-deep: #050508; --bg-card: #0c0c16; --bg-elevated: #16162a;
            --accent-blue: #00a8e0; --accent-gold: #c9a54e;
            --text-primary: #e8e8f0; --text-secondary: #8a8aa0; --text-muted: #4a4a60;
        }
        body { font-family: 'Inter', sans-serif; background: var(--bg-deep); color: var(--text-primary); min-height: 100vh; }
        .nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .nav a.brand { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; color: var(--text-primary); text-decoration: none; letter-spacing: 1px; }
        .nav a.brand span { color: var(--accent-blue); }
        .nav .links a { color: var(--text-secondary); text-decoration: none; font-size: 13px; font-weight: 600; margin-left: 18px; }
        .nav .links a:hover { color: var(--accent-blue); }
        .hero { position: relative; min-height: 520px; display: flex; align-items: center; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.35; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(5,5,8,0.55) 0%, rgba(5,5,8,0.88) 60%, var(--bg-deep) 100%); }
        .hero-content { position: relative; z-index: 2; display: flex; gap: 36px; padding: 48px 24px 64px; max-width: 1080px; margin: 0 auto; width: 100%; align-items: flex-end; flex-wrap: wrap; }
        .poster { width: 260px; border-radius: 14px; box-shadow: 0 24px 70px rgba(0,0,0,0.75); border: 1px solid rgba(255,255,255,0.08); }
        .info { flex: 1; min-width: 280px; }
        .type-badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: var(--accent-gold); border: 1px solid rgba(201,165,78,0.4); border-radius: 30px; padding: 6px 14px; margin-bottom: 14px; text-transform: uppercase; }
        h1 { font-family: 'Sora', sans-serif; font-size: clamp(28px, 4.5vw, 46px); font-weight: 800; line-height: 1.12; margin-bottom: 14px; }
        .meta { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; color: var(--text-secondary); font-size: 14px; margin-bottom: 18px; }
        .meta .star { color: var(--accent-gold); font-weight: 700; }
        .overview { font-size: 15px; line-height: 1.8; color: var(--text-secondary); max-width: 680px; margin-bottom: 28px; }
        .actions { display: flex; gap: 14px; flex-wrap: wrap; }
        .btn-play { display: inline-flex; align-items: center; gap: 10px; background: linear-gradient(135deg, #00a8e0, #0077b0); color: #fff; padding: 15px 34px; border-radius: 10px; font-family: 'Sora', sans-serif; font-weight: 700; font-size: 15px; text-decoration: none; letter-spacing: 0.5px; box-shadow: 0 8px 28px rgba(0,168,224,0.35); }
        .btn-play:hover { transform: translateY(-2px); }
        .btn-ghost { display: inline-flex; align-items: center; gap: 8px; color: var(--text-primary); text-decoration: none; padding: 15px 26px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.14); font-weight: 600; font-size: 14px; }
        .btn-ghost:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
        .extras { background: var(--bg-card); border-top: 1px solid rgba(255,255,255,0.04); padding: 40px 24px 70px; }
        .extras-inner { max-width: 1080px; margin: 0 auto; }
        .extras h2 { font-family: 'Sora', sans-serif; font-size: 19px; font-weight: 700; margin-bottom: 14px; }
        .extras p { color: var(--text-secondary); font-size: 14px; line-height: 1.8; max-width: 760px; margin-bottom: 10px; }
        .extras a { color: var(--accent-blue); font-weight: 600; }
        .loader { display: flex; align-items: center; justify-content: center; min-height: 300px; color: var(--text-muted); font-size: 14px; letter-spacing: 2px; }
        @media (max-width: 640px) {
            .hero-content { padding: 30px 16px 50px; gap: 20px; }
            .poster { width: 160px; }
            .hero { min-height: auto; }
        }
    </style>
</head>
<body>
<nav class="nav">
        <a class="brand" href="/">CINE <span>BOSS</span></a>
        <div class="links">
            <a href="/filmes.html">Filmes</a>
            <a href="/series.html">Series</a>
            <a href="/doramas.html">Doramas</a>
            <a href="/animes.html">Animes</a>
            <a href="/tv-ao-vivo.html">TV ao Vivo</a>
        </div>
    </nav>

    <main>
        <div class="hero">
            <div class="hero-bg" id="heroBg"></div>
            <div class="hero-overlay"></div>
            <div class="hero-content" id="heroContent" style="display:none">
                <img class="poster" id="poster" src="icon-512.png" alt="">
                <div class="info">
                    <span class="type-badge" id="typeBadge">FILME</span>
                    <h1 id="title"></h1>
                    <div class="meta">
                        <span class="star" id="rating"></span>
                        <span id="year"></span>
                        <span id="extra"></span>
                    </div>
                    <p class="overview" id="overview"></p>
                    <div class="actions">
                        <a class="btn-play" id="playBtn" href="/"><i class="fas fa-play"></i> ASSISTIR AGORA</a>
                        <a class="btn-ghost" href="/"><i class="fas fa-grid-2"></i> Ver catalogo completo</a>
                    </div>
                </div>
            </div>
            <div class="loader" id="loader">CARREGANDO...</div>
        </div>

        <section class="extras">
            <div class="extras-inner">
                <h2>Sobre o CINE BOSS</h2>
                <p>O CINE BOSS e a plataforma de streaming que reune em um so lugar filmes do mundo inteiro, series completas, novelas, animes, doramas e TV ao vivo, dublados ou legendados em portugues e em qualidade HD.</p>
                <p>Assista onde quiser: celular, computador, tablet ou Smart TV. O CINE BOSS lembra em que episodio voce parou e voce continua do mesmo ponto em qualquer tela.</p>
                <p>Explore os catalogos completos: <a href="/filmes.html">filmes online</a>, <a href="/series.html">series online</a>, <a href="/doramas.html">doramas</a>, <a href="/animes.html">animes</a>, <a href="/novelas.html">novelas</a> e <a href="/tv-ao-vivo.html">TV ao vivo</a>.</p>
            </div>
        </section>
    </main>

    <script src="/config.js?v=62"></script>
    <script src="/tmdb.js?v=45"></script>
    <script>
    (function () {
        function esc(s) {
            var A = String.fromCharCode(38);
            return String(s || '').replace(/&/g, A + 'amp;').replace(/</g, A + 'lt;').replace(/>/g, A + 'gt;').replace(/"/g, A + 'quot;');
        }
        function setMeta(sel, val) {
            var m = document.querySelector(sel);
            if (m) m.setAttribute('content', val);
        }
        var m = location.pathname.match(/\/assistir\/(movie|tv)\/(\d+)-[^\/]*$/);
        if (!m) { location.replace('/'); return; }
        var type = m[1], id = m[2];
        if (typeof tmdb === 'undefined') { location.replace('/'); return; }

        tmdb.getDetails(type, id).then(function (d) {
            if (!d || !d.id) { location.replace('/'); return; }
            var title = d.title || d.name || '';
            var year = (d.release_date || d.first_air_date || '').substring(0, 4);
            var overview = (d.overview || '').replace(/\s+/g, ' ');
            var poster = d.poster_path ? (tmdb.imgURL + 'w500' + d.poster_path) : null;
            var backdrop = d.backdrop_path ? (tmdb.imgURL + 'w1280' + d.backdrop_path) : null;
            var rating = d.vote_average ? Number(d.vote_average).toFixed(1) : null;

            var fullTitle = 'Assistir ' + title + ' Online Dublado';
            if (type === 'tv') fullTitle = 'Assistir ' + title + ' - Todas as Temporadas Online';
            document.title = fullTitle + ' | CINE BOSS';
            var desc = 'Assistir ' + title + ' online em portugues' + (year ? ' (' + year + ')' : '') + ', dublado ou legendado em HD no CINE BOSS. ' + overview;
            desc = desc.substring(0, 158);

            setMeta('meta[name="description"]', desc);
            var canEl = document.querySelector('link[rel="canonical"]');
            if (canEl) canEl.setAttribute('href', location.origin + location.pathname);
            setMeta('meta[property="og:title"]', fullTitle + ' | CINE BOSS');
            setMeta('meta[property="og:description"]', desc);
            setMeta('meta[property="og:url"]', location.origin + location.pathname);
            setMeta('meta[property="og:type"]', type === 'tv' ? 'video.tv_show' : 'video.movie');
            if (poster) setMeta('meta[property="og:image"]', poster);
            setMeta('meta[name="twitter:title"]', fullTitle + ' | CINE BOSS');
            setMeta('meta[name="twitter:description"]', desc);
            if (poster) setMeta('meta[name="twitter:image"]', poster);

            var ld = document.createElement('script');
            ld.type = 'application/ld+json';
            ld.textContent = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': type === 'tv' ? 'TVSeries' : 'Movie',
                name: title,
                description: overview,
                image: poster ? [poster] : undefined,
                inLanguage: 'pt-BR',
                url: location.origin + location.pathname,
                genre: (d.genres || []).map(function (g) { return g.name; }),
                dateCreated: (d.release_date || d.first_air_date || '').substring(0, 4) || undefined,
                aggregateRating: (d.vote_average && d.vote_count) ? {
                    '@type': 'AggregateRating',
                    ratingValue: String(d.vote_average),
                    ratingCount: String(d.vote_count),
                    bestRating: '10',
                    worstRating: '1'
                } : undefined
            });
            document.head.appendChild(ld);

            var ldCrumb = document.createElement('script');
            ldCrumb.type = 'application/ld+json';
            ldCrumb.textContent = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Inicio', item: location.origin + '/' },
                    { '@type': 'ListItem', position: 2, name: type === 'tv' ? 'Series' : 'Filmes', item: location.origin + (type === 'tv' ? '/series.html' : '/filmes.html') },
                    { '@type': 'ListItem', position: 3, name: title, item: location.origin + location.pathname }
                ]
            });
            document.head.appendChild(ldCrumb);

            document.getElementById('typeBadge').textContent = type === 'tv' ? 'SERIE' : 'FILME';
            document.getElementById('title').textContent = title + (year ? ' (' + year + ')' : '');
            document.getElementById('rating').innerHTML = rating ? '<i class="fas fa-star"></i> ' + rating : '';
            document.getElementById('year').textContent = type === 'tv' && d.number_of_seasons ? d.number_of_seasons + ' temporada' + (d.number_of_seasons > 1 ? 's' : '') : '';
            document.getElementById('overview').textContent = overview || 'Sinopse em breve. Assista agora mesmo no CINE BOSS.';
            var posterEl = document.getElementById('poster');
            if (poster) { posterEl.src = poster; posterEl.alt = title + ' - poster'; }
            var bg = document.getElementById('heroBg');
            if (backdrop) bg.style.backgroundImage = 'url(' + backdrop + ')';

            var playBtn = document.getElementById('playBtn');
            playBtn.href = (type === 'tv' ? '/series.html?open=tv:' : '/filmes.html?open=movie:') + id;

            document.getElementById('loader').style.display = 'none';
            document.getElementById('heroContent').style.display = 'flex';
        }).catch(function () {
            location.replace('/');
        });
    })();
    </script>
    <script src="https://www.googletagmanager.com/gtag/js?id=G-3RT0TLN4F4"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-3RT0TLN4F4');
    </script>
</body>
</html>
;
