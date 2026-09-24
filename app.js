/* =====================================================
   CINE BOSS - Premium Streaming App v7
   Uses TMDBAPI class from tmdb.js
   ===================================================== */

var FAV_KEY = 'cineboss_favorites';
var CW_KEY = 'cineboss_continue';
var currentFilter = 'all';
var heroData = null;

/* ===================== FAVORITES ===================== */
function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch(e) { return []; }
}
function saveFavorites(favs) { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); }
function isFavorite(id) { return getFavorites().some(function(f) { return f.id === id; }); }
function toggleFavorite(item) {
    var favs = getFavorites();
    var idx = favs.findIndex(function(f) { return f.id === item.id; });
    if (idx >= 0) favs.splice(idx, 1); else favs.push(item);
    saveFavorites(favs);
    return idx < 0;
}

/* ===================== CONTINUE WATCHING ===================== */
function getContinueWatching() {
    try { return JSON.parse(localStorage.getItem(CW_KEY)) || []; } catch(e) { return []; }
}
function saveContinue(item) {
    if (!item || !item.id) return;
    var list = getContinueWatching();
    var idx = list.findIndex(function(f) { return f.id === item.id; });
    if (idx >= 0) list.splice(idx, 1);
    item.timestamp = Date.now();
    list.unshift(item);
    if (list.length > 20) list = list.slice(0, 20);
    localStorage.setItem(CW_KEY, JSON.stringify(list));
}
function removeContinue(id) {
    var list = getContinueWatching().filter(function(f) { return f.id !== id; });
    localStorage.setItem(CW_KEY, JSON.stringify(list));
}
function clearContinueWatching() {
    localStorage.setItem(CW_KEY, '[]');
}

/* ===================== HELPERS ===================== */
function escapeHtml(s) {
    var r = ('' + s);
    r = r.split('&').join('&' + 'amp;');
    r = r.split('<').join('&' + 'lt;');
    r = r.split('>').join('&' + 'gt;');
    r = r.split('"').join('&' + 'quot;');
    return r;
}
function formatRuntime(min) {
    if (!min) return '';
    var h = Math.floor(min / 60), m = min % 60;
    return h > 0 ? h + 'h ' + m + 'min' : m + 'min';
}
function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
}

/* ===================== CREATE CARD ===================== */
function createCard(item) {
    var fav = isFavorite(item.id);
    var card = document.createElement('div');
    card.className = 'movie-card';
    var posterHTML = item.poster
        ? '<img src="' + item.poster + '" alt="' + escapeHtml(item.title) + '" loading="lazy" onerror="this.outerHTML=\'<div class=poster-placeholder><i class=fas fa-film></i></div>\'">'
        : '<div class="poster-placeholder"><i class="fas fa-film"></i></div>';
    var year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
    var rating = item.rating ? (typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating) : '0';
    var lang = item.originalLanguage || 'en';
    var langBadge = '';
    if (lang === 'pt') {
        langBadge = '<div class="card-dub card-lang-pt"><i class="fas fa-language"></i> PT</div>';
    } else {
        langBadge = '<div class="card-dub card-lang-dub"><i class="fas fa-language"></i> DUB</div>';
    }
    card.innerHTML =
        '<div class="card-poster">' + posterHTML +
            '<div class="card-rating"><i class="fas fa-star"></i> ' + rating + '</div>' +
            langBadge +
            '<button class="card-fav ' + (fav ? 'active' : '') + '"><i class="fas fa-heart"></i></button>' +
            '<div class="card-play"><div class="card-play-icon"><i class="fas fa-play"></i></div></div>' +
        '</div>' +
        '<div class="card-info">' +
            '<div class="card-title">' + escapeHtml(item.title) + '</div>' +
            '<div class="card-year">' + year + '</div>' +
        '</div>';
    card.addEventListener('click', function(e) {
        if (e.target.closest('.card-fav')) {
            e.stopPropagation();
            var added = toggleFavorite(item);
            card.querySelector('.card-fav').classList.toggle('active', added);
            return;
        }
        openDetailPage(item);
    });
    return card;
}

/* ===================== CONTINUE WATCHING CARD ===================== */
function createCardCW(item) {
    var fav = isFavorite(item.id);
    var card = document.createElement('div');
    card.className = 'movie-card cw-card';
    var posterHTML = item.poster
        ? '<img src="' + item.poster + '" alt="' + escapeHtml(item.title) + '" loading="lazy" onerror="this.outerHTML=\'<div class=poster-placeholder><i class=fas fa-film></i></div>\'">'
        : '<div class="poster-placeholder"><i class="fas fa-film"></i></div>';
    var progressBadge = '';
    if (item.mediaType === 'tv' || item.mediaType === 'anime') {
        progressBadge = '<div class="cw-badge"><i class="fas fa-tv"></i> T' + (item.season || 1) + ' E' + (item.episode || 1) + '</div>';
    } else {
        progressBadge = '<div class="cw-badge"><i class="fas fa-play"></i> Assistindo</div>';
    }
    card.innerHTML =
        '<div class="card-poster">' + posterHTML +
            progressBadge +
            '<button class="card-fav ' + (fav ? 'active' : '') + '"><i class="fas fa-heart"></i></button>' +
            '<button class="cw-remove" title="Remover"><i class="fas fa-times"></i></button>' +
            '<div class="card-play"><div class="card-play-icon"><i class="fas fa-play"></i></div></div>' +
        '</div>' +
        '<div class="card-info">' +
            '<div class="card-title">' + escapeHtml(item.title) + '</div>' +
            '<div class="card-year">Continuar de onde parou</div>' +
        '</div>';
    card.addEventListener('click', function(e) {
        if (e.target.closest('.card-fav')) {
            e.stopPropagation();
            var added = toggleFavorite(item);
            card.querySelector('.card-fav').classList.toggle('active', added);
            return;
        }
        if (e.target.closest('.cw-remove')) {
            e.stopPropagation();
            removeContinue(item.id);
            card.remove();
            var remaining = getContinueWatching();
            if (remaining.length === 0) {
                var sec = document.querySelector('.continue-section');
                if (sec) sec.remove();
            }
            return;
        }
        openDetailPage(item);
    });
    return card;
}

function createRow(items, container) {
    var wrap = document.createElement('div');
    wrap.className = 'row-wrap';
    var row = document.createElement('div');
    row.className = 'movies-row';
    items.forEach(function(item) { row.appendChild(createCard(item)); });
    var raf = window.requestAnimationFrame || function(cb) { return setTimeout(function() { cb(Date.now()); }, 16); };
    var _animToken = 0;
    function smoothScrollRow(amt) {
        var token = ++_animToken;
        var start = row.scrollLeft, target = start + amt, t0 = null;
        function step(ts) {
            if (token !== _animToken) return;
            if (!t0) t0 = ts;
            var p = Math.min(1, (ts - t0) / 420);
            row.scrollLeft = start + (target - start) * (1 - Math.pow(1 - p, 3));
            if (p < 1) raf(step);
        }
        raf(step);
    }
    var prev = document.createElement('button');
    prev.className = 'row-arrow row-arrow-prev';
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prev.setAttribute('aria-label', 'Anterior');
    prev.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        smoothScrollRow(-Math.max(300, Math.floor(row.clientWidth * 0.85)));
    });
    var next = document.createElement('button');
    next.className = 'row-arrow row-arrow-next';
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';
    next.setAttribute('aria-label', 'Proximo');
    next.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        smoothScrollRow(Math.max(300, Math.floor(row.clientWidth * 0.85)));
    });
    wrap.appendChild(prev);
    wrap.appendChild(row);
    wrap.appendChild(next);
    container.appendChild(wrap);
}

function createSection(title, items, container) {
    if (!items || items.length === 0) return;
    var section = document.createElement('div');
    section.className = 'content-section';
    section.innerHTML = '<div class="section-header"><h2 class="section-title">' + title + '</h2></div>';
    createRow(items, section);
    container.appendChild(section);
}

/* ===================== HERO ===================== */
function setupHero(item) {
    heroData = item;
    var main = document.getElementById('mainContent');
    var heroEl = document.createElement('div');
    heroEl.className = 'hero';
    var backdrop = item.backdrop || '';
    var year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
    var rating = item.rating ? (typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating) : '0';
    heroEl.innerHTML =
        '<div class="hero-bg" style="background-image:url(\'' + backdrop + '\')"></div>' +
        '<div class="hero-content">' +
            '<div class="hero-badge"><i class="fas fa-fire"></i> Destaque da Semana</div>' +
            '<h1 class="hero-title">' + escapeHtml(item.title) + '</h1>' +
            '<div class="hero-meta">' +
                '<div class="meta-item"><i class="fas fa-star"></i> ' + rating + '</div>' +
                '<div class="meta-dot"></div>' +
                '<div class="meta-item"><i class="fas fa-calendar"></i> ' + year + '</div>' +
                (item.runtime ? '<div class="meta-dot"></div><div class="meta-item"><i class="fas fa-clock"></i> ' + formatRuntime(item.runtime) + '</div>' : '') +
            '</div>' +
            '<p class="hero-desc">' + escapeHtml(item.overview || '') + '</p>' +
            '<div class="hero-buttons">' +
                '<button class="btn-primary" id="heroPlayBtn"><i class="fas fa-play"></i> Assistir Agora</button>' +
                '<button class="btn-secondary" id="heroFavBtn"><i class="fas fa-heart"></i> ' + (isFavorite(item.id) ? 'Favoritado' : 'Favoritar') + '</button>' +
            '</div>' +
        '</div>';
    main.appendChild(heroEl);
    document.getElementById('heroPlayBtn').addEventListener('click', function() { openDetailPage(heroData); });
    document.getElementById('heroFavBtn').addEventListener('click', function() {
        var added = toggleFavorite(heroData);
        this.innerHTML = '<i class="fas fa-heart"></i> ' + (added ? 'Favoritado' : 'Favoritar');
    });
}

/* ===================== DETAIL PAGE ===================== */
function openDetailPage(item) {
    var page = document.getElementById('detailPage');
    var bg = document.getElementById('detailHeroBg');
    var poster = document.getElementById('detailPoster');
    var badges = document.getElementById('detailBadges');
    var titleEl = document.getElementById('detailTitle');
    var meta = document.getElementById('detailMeta');
    var overview = document.getElementById('detailOverview');
    var seasonsSection = document.getElementById('detailSeasonsSection');
    var episodesContainer = document.getElementById('detailEpisodesContainer');
    var similarContainer = document.getElementById('detailSimilar');

    seasonsSection.style.display = 'none';
    episodesContainer.innerHTML = '';
    similarContainer.innerHTML = '';

    bg.style.backgroundImage = item.backdrop ? 'url(' + item.backdrop + ')' : 'none';
    poster.innerHTML = item.poster
        ? '<img src="' + item.poster + '" alt="' + item.title + '" onerror="this.outerHTML=\'<div class=poster-placeholder><i class=fas fa-film></i></div>\'">'
        : '<div class="poster-placeholder"><i class="fas fa-film"></i></div>';
    var rating = item.rating ? (typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating) : '0';
    var year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
    var lang = item.originalLanguage || 'en';
    var langBadgeHTML = '';
    if (lang === 'pt') {
        langBadgeHTML = '<span class="detail-badge dub dub-pt"><i class="fas fa-language"></i> ORIGINAL PT</span>';
    } else {
        langBadgeHTML = '<span class="detail-badge dub dub-dub"><i class="fas fa-language"></i> DUBLADO PT-BR</span>';
    }
    badges.innerHTML =
        '<span class="detail-badge rating"><i class="fas fa-star"></i> ' + rating + '</span>' +
        '<span class="detail-badge year">' + year + '</span>' +
        langBadgeHTML +
        (item.runtime ? '<span class="detail-badge duration"><i class="fas fa-clock"></i> ' + formatRuntime(item.runtime) + '</span>' : '');
    titleEl.textContent = item.title;
    meta.innerHTML = '';
    overview.textContent = item.overview || 'Sinopse nao disponivel.';

    var type = item.mediaType || 'movie';
    document.getElementById('detailBtnPlay').onclick = function() {
        saveContinue({
            id: item.id, title: item.title, poster: item.poster, backdrop: item.backdrop,
            mediaType: type, season: 1, episode: 1
        });
        player.open({ id: item.id, title: item.title, mediaType: type }, 1, 1);
    };
    document.getElementById('detailBtnFav').onclick = function() {
        var added = toggleFavorite(item);
        this.innerHTML = added ? '<i class="fas fa-heart"></i> Favoritado' : '<i class="fas fa-heart"></i> Favoritar';
    };
    document.getElementById('detailBtnFav').innerHTML = isFavorite(item.id)
        ? '<i class="fas fa-heart"></i> Favoritado'
        : '<i class="fas fa-heart"></i> Favoritar';

    page.classList.add('active');
    page.scrollTop = 0;
    document.body.style.overflow = 'hidden';

    // Load extra data
    if (type === 'tv' || type === 'anime') {
        tmdb.getDetails('tv', item.id).then(function(d) {
            if (d && d.seasons && d.seasons.length > 0) {
                seasonsSection.style.display = 'block';
                loadSeasons(item, d.seasons);
            }
        });
    }
    tmdb.getSimilar(item.id, type).then(function(items) {
        if (items && items.length > 0) {
            createSection('Titulos Semelhantes', items.slice(0, 12), similarContainer);
        }
    });
}

function closeDetailPage() {
    document.getElementById('detailPage').classList.remove('active');
    document.body.style.overflow = '';
}

function loadSeasons(item, seasons) {
    var selector = document.getElementById('seasonSelector');
    var tabs = seasons.filter(function(s) { return s.season_number > 0; }).map(function(s, i) {
        return '<div class="season-tab ' + (i === 0 ? 'active' : '') + '" data-season="' + s.season_number + '">' +
            '<span class="season-num">T' + s.season_number + '</span>' +
            '<span class="season-eps">' + s.episode_count + ' eps</span></div>';
    }).join('');
    selector.innerHTML = '<div class="season-tabs">' + tabs + '</div>';
    loadEpisodes(item, seasons[0].season_number);
    selector.querySelectorAll('.season-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            selector.querySelectorAll('.season-tab').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            loadEpisodes(item, parseInt(tab.dataset.season));
        });
    });
}

function loadEpisodes(item, seasonNum) {
    var container = document.getElementById('detailEpisodesContainer');
    container.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    tmdb.getSeasonDetails(item.id, seasonNum).then(function(data) {
        if (!data || !data.episodes) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-film"></i><p>Nenhum episodio</p></div>';
            return;
        }
        var grid = document.createElement('div');
        grid.className = 'detail-episodes-grid';
        data.episodes.forEach(function(ep) {
            var thumb = ep.still_path ? 'https://image.tmdb.org/t/p/w185' + ep.still_path : null;
            var card = document.createElement('div');
            card.className = 'detail-episode-card';
            card.innerHTML =
                '<div class="detail-ep-thumb">' +
                    (thumb ? '<img src="' + thumb + '" alt="E' + ep.episode_number + '" loading="lazy">' : '<div class="detail-ep-noimg"><i class="fas fa-play"></i></div>') +
                    '<div class="detail-ep-play"><i class="fas fa-play"></i></div>' +
                    '<div class="detail-ep-number">E' + ep.episode_number + '</div>' +
                '</div>' +
                '<div class="detail-ep-info">' +
                    '<div class="detail-ep-top">' +
                        '<div class="detail-ep-name">' + escapeHtml(ep.name || 'Episodio ' + ep.episode_number) + '</div>' +
                        (ep.runtime ? '<div class="detail-ep-runtime">' + ep.runtime + 'min</div>' : '') +
                    '</div>' +
                    (ep.air_date ? '<div class="detail-ep-date">' + ep.air_date + '</div>' : '') +
                    '<div class="detail-ep-desc">' + escapeHtml(ep.overview || 'Sem descricao.') + '</div>' +
                '</div>';
            card.addEventListener('click', function() {
                saveContinue({
                    id: item.id, title: item.title, poster: item.poster, backdrop: item.backdrop,
                    mediaType: 'tv', season: seasonNum, episode: ep.episode_number
                });
                player.open({ id: item.id, title: item.title, mediaType: 'tv' }, seasonNum, ep.episode_number);
            });
            grid.appendChild(card);
        });
        container.innerHTML = '';
        container.appendChild(grid);
    });
}

/* ===================== LOAD HOME ===================== */
function loadHome() {
    var main = document.getElementById('mainContent');
    main.innerHTML = '';

    var cw = getContinueWatching();
    if (cw.length > 0) {
        var cwSection = document.createElement('div');
        cwSection.className = 'content-section continue-section';
        cwSection.innerHTML = '<div class="section-header cw-header"><h2 class="section-title">Continuar Assistindo</h2><button class="cw-clear" id="cwClearBtn"><i class="fas fa-trash-alt"></i> Limpar</button></div>';
        var wrap = document.createElement('div');
        wrap.className = 'row-wrap';
        var row = document.createElement('div');
        row.className = 'movies-row';
        cw.forEach(function(item) { row.appendChild(createCardCW(item)); });
        wrap.appendChild(row);
        cwSection.appendChild(wrap);
        main.appendChild(cwSection);
        cwSection.querySelector('#cwClearBtn').addEventListener('click', function() {
            clearContinueWatching();
            var sec = document.querySelector('.continue-section');
            if (sec) sec.remove();
        });
    }

    tmdb.getHeroContent().then(function(hero) {
        if (hero) setupHero(hero);
    });

    var sections = [
        ['Filmes Populares', tmdb.getPopular('movie')],
        ['Lancamentos', tmdb.getNowPlaying()],
        ['Em Breve', tmdb.getUpcoming()],
        ['Melhores Avaliados', tmdb.getTopRated('movie')],
        ['Series Populares', tmdb.getPopular('tv')],
        ['Estreias de Hoje', tmdb.getAiringToday()],
        ['Series Bem Avaliadas', tmdb.getTopRated('tv')],
        ['Acao', tmdb.getByGenre('movie', 28)],
        ['Ficcao Cientifica', tmdb.getByGenre('movie', 878)],
        ['Terror', tmdb.getByGenre('movie', 27)],
        ['Comedia', tmdb.getByGenre('movie', 35)],
        ['Drama', tmdb.getByGenre('movie', 18)],
        ['Suspense', tmdb.getByGenre('movie', 53)],
        ['Animacao', tmdb.getByGenre('movie', 16)],
        ['Crime', tmdb.getByGenre('movie', 80)]
    ];

    sections.forEach(function(pair) {
        var title = pair[0], promise = pair[1];
        var tl = title.toLowerCase();
        var fbType = (tl.indexOf('serie') !== -1 || tl.indexOf('hoje') !== -1) ? 'tv' : 'movie';
        promise.then(function(items) {
            if (items && items.length > 0) createSection(title, shuffleArray(items), main);
            else {
                var fb = tmdb.fallbackList(fbType);
                if (fb && fb.length) createSection(title, fb, main);
            }
        }).catch(function() {
            var fb = tmdb.fallbackList(fbType);
            if (fb && fb.length) createSection(title, fb, main);
        });
    });

    checkNewEpisodes();
}

/* ===================== NOTIFICACOES DE NOVOS EPISODIOS ===================== */
function checkNewEpisodes() {
    var tvIds = {};
    getFavorites().forEach(function(f) { if ((f.mediaType === 'tv' || f.mediaType === 'anime') && f.id) tvIds[f.id] = f.title; });
    getContinueWatching().forEach(function(f) { if ((f.mediaType === 'tv' || f.mediaType === 'anime') && f.id) tvIds[f.id] = f.title; });
    var ids = Object.keys(tvIds).slice(0, 10);
    if (ids.length === 0) return;
    var news = [];
    var pending = ids.length;
    ids.forEach(function(id) {
        tmdb.getDetails('tv', id).then(function(d) {
            try {
                if (d && d.last_episode_to_air && d.last_episode_to_air.air_date) {
                    var key = 'cineboss_lastair_' + id;
                    var stored = localStorage.getItem(key) || null;
                    var current = d.last_episode_to_air.air_date;
                    if (stored && current > stored) {
                        news.push({
                            id: id, title: tvIds[id], date: current,
                            season: d.last_episode_to_air.season_number || 1,
                            episode: d.last_episode_to_air.episode_number || 1
                        });
                    }
                    localStorage.setItem(key, current);
                }
            } catch (e) {}
            pending--;
            if (pending === 0) showNewEpisodes(news);
        }).catch(function() {
            pending--;
            if (pending === 0) showNewEpisodes(news);
        });
    });
}

function showNewEpisodes(news) {
    if (!news || news.length === 0) return;
    var bell = document.getElementById('navBell');
    var dot = document.getElementById('bellDot');
    if (bell) bell.style.display = 'flex';
    if (dot) dot.style.display = 'block';
    try { localStorage.setItem('cineboss_news', JSON.stringify(news)); } catch(e) {}
    if (typeof showToast === 'function') {
        showToast('Novo episodio de ' + news[0].title + ' (T' + news[0].season + ' E' + news[0].episode + ')!');
    }
}

/* ===================== LOAD CATEGORY ===================== */
function loadCategory(category) {
    var main = document.getElementById('mainContent');
    main.innerHTML = '';

    if (category === 'favorites') {
        var favs = getFavorites();
        if (favs.length === 0) {
            main.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>Nenhum favorito ainda</p></div>';
        } else {
            var s = document.createElement('div');
            s.className = 'content-section';
            s.innerHTML = '<div class="section-header"><h2 class="section-title">Meus Favoritos</h2></div>';
            createRow(favs, s);
            main.appendChild(s);
        }
        return;
    }

    if (category === 'live') {
        loadLiveTV(main);
        return;
    }

    var promise;
    switch (category) {
        case 'movie': promise = tmdb.getPopular('movie'); break;
        case 'tv': promise = tmdb.getPopular('tv'); break;
        case 'anime': promise = tmdb.getAnime(); break;
        default: promise = tmdb.getTrending();
    }
    promise.then(function(items) {
        var titles = { movie: 'Filmes Populares', tv: 'Series Populares', anime: 'Animes Populares' };
        if (items && items.length > 0) createSection(titles[category] || 'Conteudo', items, main);
    }).catch(function() {
        main.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar</p></div>';
    });
}

function loadLiveTV(container) {
    var section = document.createElement('div');
    section.className = 'content-section';
    section.innerHTML = '<div class="section-header"><h2 class="section-title"><i class="fas fa-broadcast-tower"></i> TV Ao Vivo</h2></div>';
    var grid = document.createElement('div');
    grid.className = 'live-channels';
    CONFIG.IPTV.BRAZIL.forEach(function(ch) {
        var card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = '<div class="channel-icon"><i class="fas fa-tv"></i></div><div><div class="channel-name">' + escapeHtml(ch.name) + '</div><div class="channel-live">AO VIVO</div></div>';
        card.addEventListener('click', function() { player.openLiveTV({ title: ch.name, streamUrl: ch.stream }); });
        grid.appendChild(card);
    });
    section.appendChild(grid);

    var intlSection = document.createElement('div');
    intlSection.className = 'content-section';
    intlSection.innerHTML = '<div class="section-header"><h2 class="section-title"><i class="fas fa-globe"></i> Internacional</h2></div>';
    var intlGrid = document.createElement('div');
    intlGrid.className = 'live-channels';
    CONFIG.IPTV.INTERNATIONAL.forEach(function(ch) {
        var card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = '<div class="channel-icon" style="background:linear-gradient(135deg,#7b2fff,#ff2d78)"><i class="fas fa-globe"></i></div><div><div class="channel-name">' + escapeHtml(ch.name) + '</div><div class="channel-live">AO VIVO</div></div>';
        card.addEventListener('click', function() { player.openLiveTV({ title: ch.name, streamUrl: ch.stream }); });
        intlGrid.appendChild(card);
    });
    intlSection.appendChild(intlGrid);
    container.appendChild(section);
    container.appendChild(intlSection);
}

/* ===================== SEARCH ===================== */
var searchTimeout = null;
function setupSearch() {
    var input = document.getElementById('searchInput');
    var mobileInput = document.getElementById('mobileSearchInput');
    function doSearch(query) {
        var main = document.getElementById('mainContent');
        if (!query || query.length < 2) { loadHome(); return; }
        main.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
        tmdb.search(query).then(function(items) {
            main.innerHTML = '';
            if (items && items.length > 0) {
                createSection('Resultados para "' + query + '"', items, main);
            } else {
                main.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum resultado</p></div>';
            }
        });
    }
    [input, mobileInput].forEach(function(inp) {
        if (!inp) return;
        inp.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() { doSearch(e.target.value); }, 400);
        });
        inp.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { clearTimeout(searchTimeout); doSearch(e.target.value); }
        });
    });
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
        });
    });
}

/* ===================== NAVIGATION ===================== */
function setupNavigation() {
    function navigate(category) {
        document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
        document.querySelectorAll('.mobile-link').forEach(function(l) { l.classList.remove('active'); });
        document.querySelectorAll('[data-category="' + category + '"]').forEach(function(l) { l.classList.add('active'); });
        closeDetailPage();
        document.getElementById('mobileMenu').classList.remove('open');
        if (category === 'home') loadHome(); else loadCategory(category);
    }
    document.querySelectorAll('.nav-link').forEach(function(link) {
        link.addEventListener('click', function(e) { e.preventDefault(); navigate(link.dataset.category); });
    });
    document.querySelectorAll('.mobile-link').forEach(function(link) {
        link.addEventListener('click', function(e) { e.preventDefault(); navigate(link.dataset.category); });
    });
    document.getElementById('logoLink').addEventListener('click', function(e) { e.preventDefault(); navigate('home'); });
    document.getElementById('detailBack').addEventListener('click', closeDetailPage);
    document.getElementById('playerBack').addEventListener('click', function() { player.close(); });
    document.getElementById('playerBg').addEventListener('click', function() { player.close(); });
}

/* ===================== MOBILE MENU ===================== */
function setupMobileMenu() {
    document.getElementById('mobileMenuBtn').addEventListener('click', function() {
        document.getElementById('mobileMenu').classList.add('open');
    });
    document.getElementById('mobileMenuClose').addEventListener('click', function() {
        document.getElementById('mobileMenu').classList.remove('open');
    });
    document.getElementById('mobileMenu').addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('open');
    });
    var bell = document.getElementById('navBell');
    if (bell) {
        bell.addEventListener('click', function(e) {
            e.preventDefault();
            var dot = document.getElementById('bellDot');
            if (dot) dot.style.display = 'none';
            var news = [];
            try { news = JSON.parse(localStorage.getItem('cineboss_news')) || []; } catch (ex) {}
            if (news.length > 0) {
                showToast(news.map(function(n) { return n.title + ' (T' + n.season + ' E' + n.episode + ')'; }).join('  |  '));
            } else {
                showToast('Nenhuma novidade');
            }
        });
    }
}

/* ===================== KEYBOARD ===================== */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (player.isOpen()) player.close();
        else if (document.getElementById('detailPage').classList.contains('active')) closeDetailPage();
        else if (document.getElementById('mobileMenu').classList.contains('open')) document.getElementById('mobileMenu').classList.remove('open');
    }
});

/* ===================== SMART TV REMOTE CONTROL ===================== */
var tvFocusIndex = -1;
var tvFocusableElements = [];

function setupTVRemote() {
    // Detect if device is TV (Smart TV, Android TV, Fire TV, etc.)
    var isTV = document.documentElement.classList.contains('tv-device') ||
               /SmartTV|Smart-TV|WebTV|Tizen|webOS|HbbTV|NetCast|BRAVIA|FireTV|Android TV|GoogleTV|CrKey/i.test(navigator.userAgent) ||
               window.location.search.indexOf('tv=1') !== -1;

    if (!isTV) return;

    document.body.classList.add('tv-mode');

    // Get all focusable elements
    function updateFocusableElements() {
        tvFocusableElements = Array.from(document.querySelectorAll(
            '.nav-link, .mobile-link, .movie-card, .channel-card, .filter-btn, ' +
            '.btn-primary, .btn-secondary, .detail-btn-play, .detail-btn-secondary, ' +
            '.server-chip, #heroPlayBtn, #heroFavBtn, ' +
            '.season-tab, .detail-episode-card, .card-fav'
        )).filter(function(el) {
            return el.offsetParent !== null && el.offsetWidth > 0;
        });
    }

    // Move focus to element
    function focusElement(el) {
        if (!el) return;
        el.focus();
        el.classList.add('tv-focused');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Remove focus from all
    function clearFocus() {
        tvFocusableElements.forEach(function(el) {
            el.classList.remove('tv-focused');
        });
    }

    // Find closest element in direction
    function findClosest(current, direction) {
        if (!current) return tvFocusableElements[0];
        var rect = current.getBoundingClientRect();
        var best = null;
        var bestDist = Infinity;

        tvFocusableElements.forEach(function(el) {
            if (el === current) return;
            var elRect = el.getBoundingClientRect();
            var dx = elRect.left - rect.left;
            var dy = elRect.top - rect.top;
            var dist = Math.sqrt(dx * dx + dy * dy);

            var isValid = false;
            switch(direction) {
                case 'up': isValid = dy < -10 && Math.abs(dx) < Math.abs(dy) * 2; break;
                case 'down': isValid = dy > 10 && Math.abs(dx) < Math.abs(dy) * 2; break;
                case 'left': isValid = dx < -10 && Math.abs(dy) < Math.abs(dx) * 2; break;
                case 'right': isValid = dx > 10 && Math.abs(dy) < Math.abs(dx) * 2; break;
            }

            if (isValid && dist < bestDist) {
                bestDist = dist;
                best = el;
            }
        });

        return best;
    }

    // Handle TV remote keys
    document.addEventListener('keydown', function(e) {
        updateFocusableElements();
        if (tvFocusableElements.length === 0) return;

        var current = document.activeElement;
        var currentIdx = tvFocusableElements.indexOf(current);
        var target = null;

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                target = findClosest(current, 'up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                target = findClosest(current, 'down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (current && current.classList.contains('movie-card')) {
                    // Navigate within row
                    target = current.previousElementSibling;
                    if (!target || !target.classList.contains('movie-card')) {
                        target = findClosest(current, 'left');
                    }
                } else {
                    target = findClosest(current, 'left');
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (current && current.classList.contains('movie-card')) {
                    target = current.nextElementSibling;
                    if (!target || !target.classList.contains('movie-card')) {
                        target = findClosest(current, 'right');
                    }
                } else {
                    target = findClosest(current, 'right');
                }
                break;
            case 'Enter':
            case 'OK':
            case ' ':
                e.preventDefault();
                if (current) current.click();
                return;
            case 'Backspace':
            case 'Back':
                e.preventDefault();
                if (player.isOpen()) player.close();
                else if (document.getElementById('detailPage').classList.contains('active')) closeDetailPage();
                else if (document.getElementById('mobileMenu').classList.contains('open')) {
                    document.getElementById('mobileMenu').classList.remove('open');
                }
                return;
            case 'MediaPlayPause':
            case 'Play':
            case 'Pause':
                e.preventDefault();
                if (player.isOpen()) {
                    var video = document.querySelector('.video-iframe');
                    if (video && video.tagName === 'VIDEO') {
                        if (video.paused) video.play();
                        else video.pause();
                    }
                }
                return;
            case 'MediaStop':
                e.preventDefault();
                if (player.isOpen()) player.close();
                return;
            case 'ColorRed':
            case 'ColorGreen':
            case 'ColorYellow':
            case 'ColorBlue':
                e.preventDefault();
                return;
            default:
                return;
        }

        if (target) {
            clearFocus();
            focusElement(target);
        }
    });

    // Remove focus class on blur
    document.addEventListener('blur', function(e) {
        if (e.target.classList) {
            e.target.classList.remove('tv-focused');
        }
    }, true);

    // Initial focus on first card after load
    setTimeout(function() {
        updateFocusableElements();
        if (tvFocusableElements.length > 0) {
            focusElement(tvFocusableElements[0]);
        }
    }, 5000);
}

/* ===================== SCROLL FX (PARALLAX / NAVBAR / PROGRESS) ===================== */
var _scrollTick = false;
function initScrollFX() {
    var nav = document.getElementById('mainNav');
    var bar = document.getElementById('scrollProgressBar');
    var isTv = document.documentElement.classList.contains('tv-device');
    function onScroll() {
        if (_scrollTick) return;
        _scrollTick = true;
        var raf = window.requestAnimationFrame || function(cb) { return setTimeout(cb, 16); };
        raf(function() {
            var y = window.pageYOffset || document.documentElement.scrollTop || 0;
            var h = (document.documentElement.scrollHeight || 0) - window.innerHeight;
            if (bar) bar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
            if (nav) {
                if (y > 40) nav.classList.add('scrolled');
                else nav.classList.remove('scrolled');
            }
            if (!isTv) {
                var heroBg = document.querySelector('.hero-bg');
                if (heroBg && y < window.innerHeight * 1.4) {
                    if (y > 0) {
                        heroBg.style.transform = 'translateY(' + (y * 0.3) + 'px) scale(' + (1 + y * 0.00008) + ')';
                    } else {
                        heroBg.style.transform = '';
                    }
                }
            }
            _scrollTick = false;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ===================== SCROLL REVEAL (INTERSECTION OBSERVER) ===================== */
function initReveal() {
    var revealEl = function(el) { el.classList.add('revealed'); };
    var targets = document.querySelectorAll('.content-section, .hero');
    var main = document.getElementById('mainContent');
    var detail = document.getElementById('detailBody');
    var watchContainers = [main, detail].filter(Boolean);

    if (!('IntersectionObserver' in window)) {
        for (var i = 0; i < targets.length; i++) revealEl(targets[i]);
        var fbMo = new MutationObserver(function() {
            var pending = document.querySelectorAll('.content-section:not(.revealed), .hero:not(.revealed)');
            for (var k = 0; k < pending.length; k++) revealEl(pending[k]);
        });
        watchContainers.forEach(function(c) { fbMo.observe(c, { childList: true, subtree: true }); });
        return;
    }
    var io = new IntersectionObserver(function(entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                revealEl(entries[i].target);
                io.unobserve(entries[i].target);
            }
        }
    }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
    for (var j = 0; j < targets.length; j++) io.observe(targets[j]);
    var mo = new MutationObserver(function() {
        var pending = document.querySelectorAll('.content-section:not(.revealed), .hero:not(.revealed)');
        for (var k = 0; k < pending.length; k++) io.observe(pending[k]);
    });
    watchContainers.forEach(function(c) { mo.observe(c, { childList: true, subtree: true }); });
}

/* ===================== AVATAR ===================== */
function getInitials(name) {
    if (!name) return 'CB';
    var parts = name.trim().split(/\s+/);
    var first = parts[0].charAt(0) || '';
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return ((first + last).toUpperCase()) || 'CB';
}
function getAvatarGradient(name) {
    var hash = 0;
    var s = name || 'cb';
    for (var i = 0; i < s.length; i++) { hash = (hash * 31 + s.charCodeAt(i)) % 360; }
    return 'linear-gradient(135deg, hsl(' + hash + ',70%,45%), hsl(' + ((hash + 40) % 360) + ',70%,35%))';
}
function applyUserAvatar(name) {
    var avatarEl = document.getElementById('userAvatar');
    if (!avatarEl) return;
    var savedColor = null;
    try { savedColor = localStorage.getItem('cineboss_avatar_color'); } catch (e) {}
    avatarEl.innerHTML = '<span class="avatar-initials">' + getInitials(name) + '</span>';
    avatarEl.style.background = savedColor || getAvatarGradient(name);
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', function() {
    document.documentElement.classList.add('js-reveal');
    setupNavigation();
    setupSearch();
    setupMobileMenu();
    setupTVRemote();
    loadHome();
    initScrollFX();
    initReveal();

    if (typeof auth !== 'undefined') {
        auth.onAuthChange(function(user, subscription, loggedIn) {
            var authBtns = document.getElementById('authButtons');
            var userMenu = document.getElementById('userMenu');
            var adminBtn = document.getElementById('adminPanelBtn');
            if (loggedIn && user) {
                if (authBtns) authBtns.classList.add('hidden');
                if (userMenu) {
                    userMenu.classList.remove('hidden');
                    applyUserAvatar(user.name);
                    var nameEl = document.getElementById('userName');
                    var subEl = document.getElementById('userSubStatus');
                    if (nameEl) nameEl.textContent = user.name;
                    if (subEl) {
                        if (subscription && subscription.status === 'active') {
                            subEl.textContent = 'Assinatura ativa';
                            subEl.style.color = '#00d4ff';
                        } else {
                            subEl.textContent = 'Sem assinatura';
                            subEl.style.color = '#ff4444';
                        }
                    }
                    if (adminBtn) {
                        if (auth.isAdmin) {
                            adminBtn.style.display = 'block';
                            adminBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); location.href = '/admin.html'; };
                        } else {
                            adminBtn.style.display = 'none';
                        }
                    }
                }
            } else {
                if (authBtns) authBtns.classList.remove('hidden');
                if (userMenu) userMenu.classList.add('hidden');
            }
        });
    }
});
