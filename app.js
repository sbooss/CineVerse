/* =====================================================
   CINE BOSS - Premium Streaming App v6
   ===================================================== */

const TMDB_KEY = 'eb9690431d1dd3d86de35def2b1b0a2c';
const IMG_BASE = 'https://image.tmdb.org/t/p/';
const FAV_KEY = 'cineboss_favorites';

let currentFilter = 'all';
let heroData = null;
let isLoading = false;

/* ===================== TMDB API ===================== */
const tmdb = {
    async fetch(endpoint, params = {}) {
        const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
        url.searchParams.set('api_key', TMDB_KEY);
        url.searchParams.set('language', 'pt-BR');
        url.searchParams.set('include_adult', 'false');
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        try {
            const r = await fetch(url);
            if (!r.ok) throw new Error(r.status);
            return await r.json();
        } catch (e) {
            console.warn('TMDB fetch error:', endpoint, e);
            return null;
        }
    },
    trending() { return this.fetch('/trending/all/week'); },
    popular() { return this.fetch('/movie/popular'); },
    nowPlaying() { return this.fetch('/movie/now_playing'); },
    upcoming() { return this.fetch('/movie/upcoming'); },
    topRated() { return this.fetch('/movie/top_rated'); },
    tvPopular() { return this.fetch('/tv/popular'); },
    tvAiring() { return this.fetch('/tv/airing_today'); },
    tvTopRated() { return this.fetch('/tv/top_rated'); },
    anime() { return this.fetch('/discover/tv', { with_keywords: '210024', sort_by: 'popularity.desc' }); },
    byGenre(genreId, type = 'movie') { return this.fetch(`/discover/${type}`, { with_genres: genreId, sort_by: 'popularity.desc' }); },
    search(query, type = 'multi') { return this.fetch(`/search/${type}`, { query }); },
    details(type, id) { return this.fetch(`/${type}/${id}`); },
    seasons(type, id, season) { return this.fetch(`/${type}/${id}/season/${season}`); },
    similar(type, id) { return this.fetch(`/${type}/${id}/similar`); },
    credits(type, id) { return this.fetch(`/${type}/${id}/credits`); }
};

/* ===================== UTILITIES ===================== */
function posterURL(path, size = 'w342') {
    if (!path) return null;
    return `${IMG_BASE}${size}${path}`;
}

function backdropURL(path, size = 'w1280') {
    if (!path) return null;
    return `${IMG_BASE}${size}${path}`;
}

function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
}

function saveFavorites(favs) {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

function isFavorite(id) {
    return getFavorites().some(f => f.id === id);
}

function toggleFavorite(item) {
    let favs = getFavorites();
    const idx = favs.findIndex(f => f.id === item.id);
    if (idx >= 0) {
        favs.splice(idx, 1);
    } else {
        favs.push(item);
    }
    saveFavorites(favs);
    return idx < 0;
}

function formatYear(dateStr) {
    if (!dateStr) return '';
    return dateStr.substring(0, 4);
}

function formatRuntime(min) {
    if (!min) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function makeItem(data, mediaType) {
    return {
        id: data.id,
        title: data.title || data.name || 'Sem titulo',
        overview: data.overview || '',
        poster: data.poster_path,
        backdrop: data.backdrop_path,
        rating: data.vote_average ? data.vote_average.toFixed(1) : '0',
        year: formatYear(data.release_date || data.first_air_date),
        mediaType: mediaType || data.media_type || 'movie',
        genres: data.genres || [],
        runtime: data.runtime || data.episode_run_time?.[0] || 0,
        seasons: data.number_of_seasons || 0,
        episodes: data.number_of_episodes || 0
    };
}

/* ===================== CREATE CARD ===================== */
function createCard(item) {
    const poster = posterURL(item.poster);
    const fav = isFavorite(item.id);
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
        <div class="card-poster">
            ${poster
                ? `<img src="${poster}" alt="${item.title}" loading="lazy">`
                : `<div class="poster-placeholder"><i class="fas fa-film"></i></div>`
            }
            <div class="card-rating"><i class="fas fa-star"></i> ${item.rating}</div>
            <button class="card-fav ${fav ? 'active' : ''}" data-id="${item.id}"><i class="fas fa-heart"></i></button>
            <div class="card-play"><div class="card-play-icon"><i class="fas fa-play"></i></div></div>
        </div>
        <div class="card-info">
            <div class="card-title">${item.title}</div>
            <div class="card-year">${item.year}</div>
        </div>`;
    
    card.addEventListener('click', (e) => {
        if (e.target.closest('.card-fav')) {
            e.stopPropagation();
            const added = toggleFavorite(item);
            const btn = card.querySelector('.card-fav');
            btn.classList.toggle('active', added);
            return;
        }
        openDetailPage(item);
    });
    return card;
}

function createRow(items, container) {
    const row = document.createElement('div');
    row.className = 'movies-row';
    items.forEach(item => row.appendChild(createCard(item)));
    container.appendChild(row);
}

function createSection(title, items, container) {
    if (!items || items.length === 0) return;
    const section = document.createElement('div');
    section.className = 'content-section';
    section.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">${title}</h2>
        </div>`;
    createRow(items, section);
    container.appendChild(section);
}

/* ===================== HERO ===================== */
function setupHero(item) {
    heroData = item;
    const hero = document.getElementById('mainContent');
    const backdrop = backdropURL(item.backdrop, 'original');
    
    const heroEl = document.createElement('div');
    heroEl.className = 'hero';
    heroEl.innerHTML = `
        <div class="hero-bg" style="background-image:url('${backdrop || ''}')"></div>
        <div class="hero-content">
            <div class="hero-badge"><i class="fas fa-fire"></i> Destaque da Semana</div>
            <h1 class="hero-title">${item.title}</h1>
            <div class="hero-meta">
                <div class="meta-item"><i class="fas fa-star"></i> ${item.rating}</div>
                <div class="meta-dot"></div>
                <div class="meta-item"><i class="fas fa-calendar"></i> ${item.year}</div>
                ${item.runtime ? `<div class="meta-dot"></div><div class="meta-item"><i class="fas fa-clock"></i> ${formatRuntime(item.runtime)}</div>` : ''}
                ${item.genres?.length ? `<div class="meta-dot"></div><div class="meta-item"><i class="fas fa-tag"></i> ${item.genres.slice(0, 3).map(g => g.name).join(', ')}</div>` : ''}
            </div>
            <p class="hero-desc">${item.overview}</p>
            <div class="hero-buttons">
                <button class="btn-primary" onclick="openDetailPage(heroData)"><i class="fas fa-play"></i> Assistir Agora</button>
                <button class="btn-secondary" onclick="toggleFavoriteFromHero()"><i class="fas fa-heart"></i> ${isFavorite(item.id) ? 'Favoritado' : 'Favoritar'}</button>
            </div>
        </div>`;
    hero.appendChild(heroEl);
}

function toggleFavoriteFromHero() {
    if (heroData) {
        toggleFavorite(heroData);
    }
}

/* ===================== DETAIL PAGE ===================== */
async function openDetailPage(item) {
    const page = document.getElementById('detailPage');
    const bg = document.getElementById('detailHeroBg');
    const poster = document.getElementById('detailPoster');
    const badges = document.getElementById('detailBadges');
    const title = document.getElementById('detailTitle');
    const meta = document.getElementById('detailMeta');
    const overview = document.getElementById('detailOverview');
    const seasonsSection = document.getElementById('detailSeasonsSection');
    const episodesContainer = document.getElementById('detailEpisodesContainer');
    const similarContainer = document.getElementById('detailSimilar');

    // Reset
    seasonsSection.style.display = 'none';
    episodesContainer.innerHTML = '';
    similarContainer.innerHTML = '';

    // Set background
    const backdrop = backdropURL(item.backdrop, 'original');
    bg.style.backgroundImage = backdrop ? `url('${backdrop}')` : 'none';

    // Set poster
    const posterUrl = posterURL(item.poster, 'w342');
    poster.innerHTML = posterUrl
        ? `<img src="${posterUrl}" alt="${item.title}">`
        : `<div class="poster-placeholder"><i class="fas fa-film"></i></div>`;

    // Set badges
    badges.innerHTML = `
        <span class="detail-badge rating"><i class="fas fa-star"></i> ${item.rating}</span>
        <span class="detail-badge year">${item.year}</span>
        ${item.runtime ? `<span class="detail-badge duration"><i class="fas fa-clock"></i> ${formatRuntime(item.runtime)}</span>` : ''}`;

    // Set title
    title.textContent = item.title;

    // Set meta
    const type = (item.mediaType === 'tv' || item.mediaType === 'anime') ? 'tv' : 'movie';
    meta.innerHTML = item.genres?.length
        ? item.genres.map(g => `<div class="meta-item"><i class="fas fa-tag"></i> ${g.name}</div>`).join('<div class="meta-dot"></div>')
        : '';

    // Set overview
    overview.textContent = item.overview || 'Sinopse nao disponivel.';

    // Setup buttons
    document.getElementById('detailBtnPlay').onclick = () => {
        const playItem = { id: item.id, title: item.title, mediaType: type };
        player.open(playItem, 1, 1);
    };
    document.getElementById('detailBtnFav').onclick = () => {
        const added = toggleFavorite(item);
        const btn = document.getElementById('detailBtnFav');
        btn.innerHTML = added
            ? '<i class="fas fa-heart"></i> Favoritado'
            : '<i class="fas fa-heart"></i> Favoritar';
    };
    document.getElementById('detailBtnFav').innerHTML = isFavorite(item.id)
        ? '<i class="fas fa-heart"></i> Favoritado'
        : '<i class="fas fa-heart"></i> Favoritar';

    // Show page
    page.classList.add('active');
    page.scrollTop = 0;
    document.body.style.overflow = 'hidden';

    // Load seasons for TV
    if (type === 'tv') {
        const details = await tmdb.details('tv', item.id);
        if (details && details.seasons && details.seasons.length > 0) {
            seasonsSection.style.display = 'block';
            loadSeasons(item, details.seasons);
        }
    }

    // Load similar
    loadSimilar(type, item.id);
}

function loadSeasons(item, seasons) {
    const selector = document.getElementById('seasonSelector');
    const container = document.getElementById('detailEpisodesContainer');
    
    selector.innerHTML = `<div class="season-tabs">${
        seasons.filter(s => s.season_number > 0).map((s, i) => `
            <div class="season-tab ${i === 0 ? 'active' : ''}" data-season="${s.season_number}">
                <span class="season-num">T${s.season_number}</span>
                <span class="season-eps">${s.episode_count} eps</span>
            </div>`).join('')
    }</div>`;

    // Load first season
    loadEpisodes(item, seasons[0].season_number);

    // Tab clicks
    selector.querySelectorAll('.season-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selector.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadEpisodes(item, parseInt(tab.dataset.season));
        });
    });
}

async function loadEpisodes(item, seasonNum) {
    const container = document.getElementById('detailEpisodesContainer');
    container.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

    const data = await tmdb.seasons('tv', item.id, seasonNum);
    if (!data || !data.episodes) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-film"></i><p>Nenhum episodio encontrado</p></div>';
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'detail-episodes-grid';

    data.episodes.forEach(ep => {
        const thumb = ep.still_path ? posterURL(ep.still_path, 'w185') : null;
        const card = document.createElement('div');
        card.className = 'detail-episode-card';
        card.innerHTML = `
            <div class="detail-ep-thumb">
                ${thumb ? `<img src="${thumb}" alt="E${ep.episode_number}" loading="lazy">` : '<div class="detail-ep-noimg"><i class="fas fa-play"></i></div>'}
                <div class="detail-ep-play"><i class="fas fa-play"></i></div>
                <div class="detail-ep-number">E${ep.episode_number}</div>
            </div>
            <div class="detail-ep-info">
                <div class="detail-ep-top">
                    <div class="detail-ep-name">${ep.name || `Episodio ${ep.episode_number}`}</div>
                    ${ep.runtime ? `<div class="detail-ep-runtime">${ep.runtime}min</div>` : ''}
                </div>
                ${ep.air_date ? `<div class="detail-ep-date">${ep.air_date}</div>` : ''}
                <div class="detail-ep-desc">${ep.overview || 'Sem descricao.'}</div>
            </div>`;
        
        card.addEventListener('click', () => {
            player.open({ id: item.id, title: item.title, mediaType: 'tv' }, seasonNum, ep.episode_number);
        });
        grid.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(grid);
}

async function loadSimilar(type, id) {
    const container = document.getElementById('detailSimilar');
    const data = await tmdb.similar(type, id);
    if (!data || !data.results || data.results.length === 0) return;

    const items = data.results.slice(0, 12).map(d => makeItem(d, type));
    items.forEach(item => container.appendChild(createCard(item)));
}

function closeDetailPage() {
    const page = document.getElementById('detailPage');
    page.classList.remove('active');
    document.body.style.overflow = '';
}

/* ===================== CATEGORIES ===================== */
async function loadHome() {
    const main = document.getElementById('mainContent');
    main.innerHTML = '';
    isLoading = true;

    try {
        // Hero from trending
        const trending = await tmdb.trending();
        if (trending && trending.results) {
            const items = trending.results.filter(i => i.backdrop_path && i.vote_average >= 6);
            if (items.length > 0) {
                const heroItem = makeItem(items[Math.floor(Math.random() * Math.min(5, items.length))]);
                setupHero(heroItem);
            }
        }

        // Content sections - all in parallel
        const [pop, np, up, tr, tvp, tva, tvt, action, scifi, horror, comedy, drama, thriller, animation, crime] = await Promise.all([
            tmdb.popular(),
            tmdb.nowPlaying(),
            tmdb.upcoming(),
            tmdb.topRated(),
            tmdb.tvPopular(),
            tmdb.tvAiring(),
            tmdb.tvTopRated(),
            tmdb.byGenre(28),
            tmdb.byGenre(878),
            tmdb.byGenre(27),
            tmdb.byGenre(35),
            tmdb.byGenre(18),
            tmdb.byGenre(53),
            tmdb.byGenre(16),
            tmdb.byGenre(80)
        ]);

        const sections = [
            ['Filmes Populares', pop],
            ['Lancamentos', np],
            ['Em Breve', up],
            ['Melhores Avaliados', tr],
            ['Series Populares', tvp],
            ['Estreias de Hoje', tva],
            ['Series Bem Avaliadas', tvt],
            ['Acao e Aventura', action],
            ['Ficcao Cientifica', scifi],
            ['Terror', horror],
            ['Comedia', comedy],
            ['Drama', drama],
            ['Suspense', thriller],
            ['Animacao', animation],
            ['Crime', crime]
        ];

        sections.forEach(([title, data]) => {
            if (data && data.results) {
                const items = data.results
                    .filter(i => i.poster_path)
                    .slice(0, 20)
                    .map(i => makeItem(i));
                if (items.length > 0) createSection(title, shuffleArray(items), main);
            }
        });
    } catch (e) {
        console.error('loadHome error:', e);
        main.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar conteudo</p></div>';
    }
    isLoading = false;
}

async function loadCategory(category) {
    const main = document.getElementById('mainContent');
    main.innerHTML = '';
    isLoading = true;

    try {
        if (category === 'favorites') {
            const favs = getFavorites();
            if (favs.length === 0) {
                main.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>Nenhum favorito ainda</p><p style="font-size:12px;margin-top:8px;color:var(--text-muted)">Clique no icone de coração para favoritar</p></div>';
            } else {
                const section = document.createElement('div');
                section.className = 'content-section';
                section.innerHTML = '<div class="section-header"><h2 class="section-title">Meus Favoritos</h2></div>';
                createRow(favs, section);
                main.appendChild(section);
            }
            isLoading = false;
            return;
        }

        if (category === 'live') {
            loadLiveTV(main);
            isLoading = false;
            return;
        }

        let data;
        switch (category) {
            case 'movie': data = await tmdb.popular(); break;
            case 'tv': data = await tmdb.tvPopular(); break;
            case 'anime': data = await tmdb.anime(); break;
            default: data = await tmdb.trending();
        }

        if (data && data.results) {
            const items = data.results
                .filter(i => i.poster_path)
                .map(i => makeItem(i, category === 'anime' ? 'tv' : undefined));
            
            const titles = { movie: 'Filmes Populares', tv: 'Series Populares', anime: 'Animes Populares' };
            createSection(titles[category] || 'Conteudo', items, main);
        }
    } catch (e) {
        console.error('loadCategory error:', e);
        main.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar</p></div>';
    }
    isLoading = false;
}

function loadLiveTV(container) {
    const section = document.createElement('div');
    section.className = 'content-section';
    section.innerHTML = '<div class="section-header"><h2 class="section-title"><i class="fas fa-broadcast-tower"></i> TV Ao Vivo</h2></div>';

    const channels = CONFIG.IPTV.BRAZIL;
    const grid = document.createElement('div');
    grid.className = 'live-channels';

    channels.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <div class="channel-icon"><i class="fas fa-tv"></i></div>
            <div>
                <div class="channel-name">${ch.name}</div>
                <div class="channel-live">AO VIVO</div>
            </div>`;
        card.addEventListener('click', () => {
            player.openLiveTV({ title: ch.name, streamUrl: ch.stream });
        });
        grid.appendChild(card);
    });

    section.appendChild(grid);

    // International
    const intlSection = document.createElement('div');
    intlSection.className = 'content-section';
    intlSection.innerHTML = '<div class="section-header"><h2 class="section-title"><i class="fas fa-globe"></i> Internacional</h2></div>';
    
    const intlGrid = document.createElement('div');
    intlGrid.className = 'live-channels';
    CONFIG.IPTV.INTERNATIONAL.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <div class="channel-icon" style="background:linear-gradient(135deg,#7b2fff,#ff2d78)"><i class="fas fa-globe"></i></div>
            <div>
                <div class="channel-name">${ch.name}</div>
                <div class="channel-live">AO VIVO</div>
            </div>`;
        card.addEventListener('click', () => {
            player.openLiveTV({ title: ch.name, streamUrl: ch.stream });
        });
        intlGrid.appendChild(card);
    });
    intlSection.appendChild(intlGrid);

    container.appendChild(section);
    container.appendChild(intlSection);
}

/* ===================== SEARCH ===================== */
let searchTimeout = null;
function setupSearch() {
    const input = document.getElementById('searchInput');
    const mobileInput = document.getElementById('mobileSearchInput');
    
    function doSearch(query) {
        const main = document.getElementById('mainContent');
        if (!query || query.length < 2) {
            loadHome();
            return;
        }
        main.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
        
        let searchType = 'multi';
        if (currentFilter === 'movie') searchType = 'movie';
        else if (currentFilter === 'tv') searchType = 'tv';

        tmdb.search(query, searchType).then(data => {
            if (!data || !data.results) {
                main.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum resultado encontrado</p></div>';
                return;
            }
            const items = data.results
                .filter(i => i.poster_path)
                .map(i => makeItem(i));
            
            main.innerHTML = '';
            if (items.length > 0) {
                createSection(`Resultados para "${query}"`, items, main);
            } else {
                main.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum resultado encontrado</p></div>';
            }
        });
    }

    [input, mobileInput].forEach(inp => {
        if (!inp) return;
        inp.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => doSearch(e.target.value), 400);
        });
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                doSearch(e.target.value);
            }
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            if (input.value) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const searchType = currentFilter === 'all' ? 'multi' : currentFilter;
                    tmdb.search(input.value, searchType).then(data => {
                        const main = document.getElementById('mainContent');
                        if (!data || !data.results) return;
                        const items = data.results.filter(i => i.poster_path).map(i => makeItem(i));
                        main.innerHTML = '';
                        if (items.length > 0) createSection(`Resultados para "${input.value}"`, items, main);
                    });
                }, 300);
            }
        });
    });
}

/* ===================== NAVIGATION ===================== */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function navigate(category) {
        navLinks.forEach(l => l.classList.remove('active'));
        mobileLinks.forEach(l => l.classList.remove('active'));
        
        const target = `[data-category="${category}"]`;
        document.querySelectorAll(target).forEach(l => l.classList.add('active'));
        
        closeDetailPage();
        closeMobileMenu();

        if (category === 'home') loadHome();
        else loadCategory(category);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(link.dataset.category);
        });
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(link.dataset.category);
        });
    });

    // Logo click
    document.getElementById('logoLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate('home');
    });

    // Detail back
    document.getElementById('detailBack')?.addEventListener('click', closeDetailPage);

    // Player back
    document.getElementById('playerBack')?.addEventListener('click', () => player.close());
    document.getElementById('playerBg')?.addEventListener('click', () => player.close());
}

/* ===================== MOBILE MENU ===================== */
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    const closeBtn = document.getElementById('mobileMenuClose');

    menuBtn?.addEventListener('click', () => menu.classList.add('open'));
    closeBtn?.addEventListener('click', closeMobileMenu);
    menu?.addEventListener('click', (e) => {
        if (e.target === menu) closeMobileMenu();
    });
}

function closeMobileMenu() {
    document.getElementById('mobileMenu')?.classList.remove('open');
}

/* ===================== KEYBOARD ===================== */
function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (player.isOpen()) {
                player.close();
            } else if (document.getElementById('detailPage').classList.contains('active')) {
                closeDetailPage();
            } else if (document.getElementById('mobileMenu').classList.contains('open')) {
                closeMobileMenu();
            }
        }
    });
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupSearch();
    setupMobileMenu();
    setupKeyboard();
    loadHome();
});
