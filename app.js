let currentCategory = 'home';
let currentFilter = 'all';
let favorites = JSON.parse(localStorage.getItem('cineverse_favorites') || '[]');
let currentSeason = 1;
let currentEpisode = 1;

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavigation();
    initSearch();
    initFilters();
    loadHomePage();
});

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.opacity = Math.random() * 0.4 + 0.1;
        container.appendChild(particle);
    }
}

function initNavigation() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentCategory = link.dataset.category;
            loadContent(currentCategory);
        });
    });
}

function initSearch() {
    const input = document.getElementById('searchInput');
    let timeout;
    input.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (e.target.value.length > 2) {
                performSearch(e.target.value);
            } else if (currentCategory === 'home') {
                loadHomePage();
            } else {
                loadContent(currentCategory);
            }
        }, 500);
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.value.length > 2) {
            performSearch(e.target.value);
        }
    });
}

function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            const searchVal = document.getElementById('searchInput').value;
            if (searchVal.length > 2) {
                performSearch(searchVal);
            }
        });
    });
}

async function loadContent(category) {
    if (category === 'home') {
        await loadHomePage();
    } else if (category === 'favorites') {
        loadFavorites();
    } else {
        const main = document.getElementById('mainContent');
        main.innerHTML = '';
        const sections = getCategorySections(category);
        for (const section of sections) {
            main.innerHTML += createSectionHTML(section.id, section.title, section.icon);
        }
        for (const section of sections) {
            await loadSection(section.id, section.category, section.mediaType, section.isLive);
        }
    }
}

function getCategorySections(category) {
    const map = {
        'movie': [
            { id: 'fil-popular', title: 'Filmes Populares', icon: 'fa-fire', category: 'popular', mediaType: 'movie' },
            { id: 'fil-now', title: 'Em Cartaz', icon: 'fa-ticket-alt', category: 'now_playing', mediaType: 'movie' },
            { id: 'fil-upcoming', title: 'Lancamentos', icon: 'fa-calendar', category: 'upcoming', mediaType: 'movie' },
            { id: 'fil-top', title: 'Melhores Avaliados', icon: 'fa-trophy', category: 'top_rated', mediaType: 'movie' },
            { id: 'fil-action', title: 'Acao', icon: 'fa-fist-raised', category: 'action', mediaType: 'movie' },
            { id: 'fil-comedy', title: 'Comedia', icon: 'fa-laugh', category: 'comedy', mediaType: 'movie' },
            { id: 'fil-horror', title: 'Terror', icon: 'fa-ghost', category: 'horror', mediaType: 'movie' },
            { id: 'fil-scifi', title: 'Ficcao Cientifica', icon: 'fa-rocket', category: 'scifi', mediaType: 'movie' },
            { id: 'fil-drama', title: 'Drama', icon: 'fa-masks-theater', category: 'drama', mediaType: 'movie' },
            { id: 'fil-thriller', title: 'Suspense', icon: 'fa-mask', category: 'thriller', mediaType: 'movie' },
            { id: 'fil-romance', title: 'Romance', icon: 'fa-heart', category: 'romance', mediaType: 'movie' },
            { id: 'fil-animation', title: 'Animacao', icon: 'fa-hat-wizard', category: 'animation', mediaType: 'movie' },
            { id: 'fil-crime', title: 'Crime', icon: 'fa-bomb', category: 'crime', mediaType: 'movie' },
            { id: 'fil-family', title: 'Familia', icon: 'fa-people-roof', category: 'family', mediaType: 'movie' },
            { id: 'fil-fantasy', title: 'Fantasia', icon: 'fa-wand-sparkles', category: 'fantasy', mediaType: 'movie' }
        ],
        'tv': [
            { id: 'tv-popular', title: 'Series Populares', icon: 'fa-fire', category: 'popular', mediaType: 'tv' },
            { id: 'tv-airing', title: 'No Ar Hoje', icon: 'fa-broadcast-tower', category: 'airing_today', mediaType: 'tv' },
            { id: 'tv-top', title: 'Melhores Series', icon: 'fa-trophy', category: 'top_rated', mediaType: 'tv' },
            { id: 'tv-onair', title: 'Em Exibicao', icon: 'fa-play-circle', category: 'on_the_air', mediaType: 'tv' },
            { id: 'tv-drama', title: 'Drama', icon: 'fa-masks-theater', category: 'drama', mediaType: 'tv' },
            { id: 'tv-comedy', title: 'Comedia', icon: 'fa-laugh', category: 'comedy', mediaType: 'tv' },
            { id: 'tv-scifi', title: 'Sci-Fi & Fantasia', icon: 'fa-rocket', category: 'scifi', mediaType: 'tv' },
            { id: 'tv-crime', title: 'Crime', icon: 'fa-bomb', category: 'crime', mediaType: 'tv' }
        ],
        'anime': [
            { id: 'an-popular', title: 'Animes Populares', icon: 'fa-fire', category: 'popular', mediaType: 'anime' },
            { id: 'an-top', title: 'Melhores Animes', icon: 'fa-trophy', category: 'top_rated', mediaType: 'anime' },
            { id: 'an-new', title: 'Novos Episodios', icon: 'fa-clock', category: 'on_the_air', mediaType: 'anime' }
        ],
        'live': [
            { id: 'tv-live-br', title: 'Canais Brasileiros', icon: 'fa-flag', category: 'br', mediaType: 'live', isLive: true },
            { id: 'tv-live-int', title: 'Canais Internacionais', icon: 'fa-globe', category: 'int', mediaType: 'live', isLive: true }
        ]
    };
    return map[category] || map['home'];
}

function createSectionHTML(id, title, icon) {
    return `
        <section class="content-section">
            <div class="section-header">
                <h2 class="section-title"><span class="title-icon"><i class="fas ${icon}"></i></span>${title}</h2>
            </div>
            <div class="movies-row" id="${id}">
                <div class="loading"><div class="loading-spinner"></div></div>
            </div>
        </section>`;
}

async function loadSection(sectionId, category, mediaType, isLive) {
    const container = document.getElementById(sectionId);
    if (!container) return;

    try {
        let items;
        if (isLive || mediaType === 'live') {
            items = loadLiveChannels(category);
            container.innerHTML = items.map(item => createLiveCard(item)).join('');
            items.forEach((channel, i) => {
                const card = container.querySelector(`.movie-card:nth-child(${i + 1})`);
                if (card) card.addEventListener('click', () => player.openLiveTV(channel));
            });
            return;
        } else if (mediaType === 'anime') {
            items = await tmdb.getAnimeByCategory(category);
        } else if (mediaType === 'movie') {
            items = await tmdb.getMoviesByCategory(category);
        } else if (mediaType === 'tv') {
            items = await tmdb.getTVByCategory(category);
        } else {
            items = await tmdb.getMoviesByCategory(category);
        }

        if (!items || items.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-film"></i><p>Nenhum conteudo encontrado</p></div>';
            return;
        }

        container.innerHTML = items.map(item => createCard(item)).join('');
        container.querySelectorAll('.movie-card').forEach((card, index) => {
            card.addEventListener('click', () => openModal(items[index]));
            setTimeout(() => card.classList.add('visible'), index * 50);
        });
    } catch (error) {
        console.error('Error loading section:', error);
        container.innerHTML = '<div class="error-message">Erro ao carregar conteudo</div>';
    }
}

async function loadHomePage() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
        <section class="hero" id="hero">
            <div class="hero-bg" id="heroBg"></div>
            <div class="hero-particles" id="particles"></div>
            <div class="hero-content">
                <div class="hero-badge"><i class="fas fa-bolt"></i><span>EM ALTA</span></div>
                <h1 class="hero-title" id="heroTitle"></h1>
                <div class="hero-meta" id="heroMeta"></div>
                <p class="hero-desc" id="heroDesc"></p>
                <div class="hero-buttons">
                    <button class="btn-primary glow" id="heroPlay"><i class="fas fa-play"></i><span>ASSISTIR AGORA</span></button>
                    <button class="btn-secondary" id="heroInfo"><i class="fas fa-info-circle"></i><span>MAIS INFORMACOES</span></button>
                </div>
            </div>
            <div class="hero-gradient"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-fire"></i></span>Em Alta</h2></div>
            <div class="movies-row" id="popular"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-film"></i></span>Filmes Populares</h2></div>
            <div class="movies-row" id="filmesRow"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-ticket-alt"></i></span>Em Cartaz</h2></div>
            <div class="movies-row" id="nowPlaying"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-calendar"></i></span>Lancamentos</h2></div>
            <div class="movies-row" id="upcoming"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-trophy"></i></span>Melhores Avaliados</h2></div>
            <div class="movies-row" id="topRated"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-tv"></i></span>Series Populares</h2></div>
            <div class="movies-row" id="seriesRow"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-play-circle"></i></span>Em Exibicao</h2></div>
            <div class="movies-row" id="onTheAir"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-dragon"></i></span>Anime</h2></div>
            <div class="movies-row" id="animeRow"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-fist-raised"></i></span>Acao</h2></div>
            <div class="movies-row" id="actionRow"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-rocket"></i></span>Ficcao Cientifica</h2></div>
            <div class="movies-row" id="scifiRow"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-ghost"></i></span>Terror</h2></div>
            <div class="movies-row" id="horrorRow"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-laugh"></i></span>Comedia</h2></div>
            <div class="movies-row" id="comedyRow"></div>
        </section>
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-broadcast-tower"></i></span>TV Ao Vivo</h2></div>
            <div class="movies-row" id="tvRow"></div>
        </section>`;

    initParticles();

    const loadRow = async (id, fn) => {
        try {
            const items = await fn();
            if (items) {
                const el = document.getElementById(id);
                if (el) {
                    el.innerHTML = items.slice(0, 20).map(item => createCard(item)).join('');
                    setupCardClicks(id, items.slice(0, 20));
                }
            }
        } catch (e) { console.warn(id + ' failed:', e); }
    };

    const hero = await tmdb.getHeroContent();
    if (hero) {
        if (hero.backdrop) document.getElementById('heroBg').style.backgroundImage = `url(${hero.backdrop})`;
        document.getElementById('heroTitle').textContent = hero.title;
        document.getElementById('heroDesc').textContent = hero.overview?.substring(0, 250) + (hero.overview?.length > 250 ? '...' : '') || '';
        document.getElementById('heroMeta').innerHTML = `
            <span class="meta-item"><i class="fas fa-star"></i> ${hero.rating?.toFixed(1) || 'N/A'}</span>
            <span class="meta-item"><i class="fas fa-calendar"></i> ${hero.releaseDate?.split('-')[0] || 'N/A'}</span>
            <span class="meta-item"><i class="fas fa-clock"></i> ${hero.runtime || 'N/A'} min</span>`;
        document.getElementById('heroPlay').onclick = () => player.open(hero);
        document.getElementById('heroInfo').onclick = () => openModal(hero);
    }

    await Promise.all([
        loadRow('popular', () => tmdb.getTrending('all', 'week')),
        loadRow('filmesRow', () => tmdb.getMoviesByCategory('popular')),
        loadRow('nowPlaying', () => tmdb.getMoviesByCategory('now_playing')),
        loadRow('upcoming', () => tmdb.getMoviesByCategory('upcoming')),
        loadRow('topRated', () => tmdb.getMoviesByCategory('top_rated')),
        loadRow('seriesRow', () => tmdb.getTVByCategory('popular')),
        loadRow('onTheAir', () => tmdb.getTVByCategory('on_the_air')),
        loadRow('animeRow', () => tmdb.getAnimeByCategory('popular')),
        loadRow('actionRow', () => tmdb.getMoviesByCategory('action')),
        loadRow('scifiRow', () => tmdb.getMoviesByCategory('scifi')),
        loadRow('horrorRow', () => tmdb.getMoviesByCategory('horror')),
        loadRow('comedyRow', () => tmdb.getMoviesByCategory('comedy')),
    ]);

    try {
        const tvChannels = loadLiveChannels('br').slice(0, 12);
        const tvRow = document.getElementById('tvRow');
        if (tvRow) {
            tvRow.innerHTML = tvChannels.map(item => createLiveCard(item)).join('');
            tvChannels.forEach((channel, i) => {
                const card = tvRow.querySelector(`.movie-card:nth-child(${i + 1})`);
                if (card) card.addEventListener('click', () => player.openLiveTV(channel));
            });
        }
    } catch (e) {}
}

function setupCardClicks(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.movie-card').forEach((card, index) => {
        card.addEventListener('click', () => openModal(items[index]));
        setTimeout(() => card.classList.add('visible'), index * 50);
    });
}

function createCard(item) {
    const isFav = favorites.some(f => f.id === item.id);
    const posterUrl = item.poster || '';
    return `
        <div class="movie-card" data-id="${item.id}">
            <div class="card-poster">
                ${posterUrl ? `<img src="${posterUrl}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'">` : ''}
                <div class="card-placeholder" style="${posterUrl ? 'display:none' : ''}"><i class="fas fa-film"></i></div>
                <div class="card-overlay"><div class="card-play"><i class="fas fa-play"></i></div></div>
                <div class="card-rating"><i class="fas fa-star"></i> ${item.rating?.toFixed(1) || 'N/A'}</div>
                <div class="card-fav ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(this.closest('.movie-card').dataset.id)"><i class="fas fa-heart"></i></div>
            </div>
            <div class="card-info">
                <h3 class="card-title">${item.title || 'Sem titulo'}</h3>
                <p class="card-year">${item.releaseDate?.split('-')[0] || 'N/A'}</p>
            </div>
        </div>`;
}

function createLiveCard(item) {
    return `
        <div class="movie-card live-card">
            <div class="card-poster">
                <div class="card-placeholder live-placeholder">
                    <i class="fas fa-broadcast-tower"></i>
                    <span>${item.title}</span>
                </div>
                <div class="card-overlay"><div class="card-play"><i class="fas fa-play"></i></div></div>
                <div class="live-badge"><i class="fas fa-circle"></i> AO VIVO</div>
            </div>
            <div class="card-info"><h3 class="card-title">${item.title}</h3></div>
        </div>`;
}

function loadLiveChannels(category) {
    let channels;
    if (category === 'br') channels = CONFIG.IPTV.BRAZIL;
    else if (category === 'int') channels = CONFIG.IPTV.INTERNATIONAL;
    else channels = [...CONFIG.IPTV.BRAZIL, ...CONFIG.IPTV.INTERNATIONAL];
    return channels.map(ch => ({
        id: ch.name.replace(/\s+/g, '-').toLowerCase(),
        title: ch.name,
        streamUrl: ch.stream,
        mediaType: 'live'
    }));
}

async function openModal(item) {
    const modal = document.getElementById('movieModal');
    document.getElementById('modalTitle').textContent = item.title || '';
    document.getElementById('modalDesc').textContent = item.overview || '';
    document.getElementById('modalRating').textContent = item.rating?.toFixed(1) || 'N/A';
    document.getElementById('modalYear').textContent = item.releaseDate?.split('-')[0] || 'N/A';
    document.getElementById('modalDuration').textContent = item.runtime ? `${item.runtime} min` : (item.seasons > 0 ? `${item.seasons} Temp.` : 'N/A');
    document.getElementById('modalGenre').textContent = getGenreName(item.genreIds?.[0]);
    if (item.backdrop) document.getElementById('modalHero').style.backgroundImage = `url(${item.backdrop})`;

    const posterEl = document.getElementById('modalPoster');
    if (item.poster) {
        posterEl.innerHTML = `<img src="${item.poster}" alt="${item.title}" onerror="this.style.display='none'">`;
    } else {
        posterEl.innerHTML = '<div class="card-placeholder" style="height:300px"><i class="fas fa-film"></i></div>';
    }

    const isFav = favorites.some(f => f.id === item.id);
    document.getElementById('modalFav').innerHTML = `<i class="fas fa-heart"></i> ${isFav ? 'DESFAVORITAR' : 'FAVORITAR'}`;
    document.getElementById('modalFav').onclick = () => toggleFavorite(item);

    currentSeason = 1;
    currentEpisode = 1;

    if ((item.mediaType === 'tv' || item.mediaType === 'anime') && item.seasons > 0) {
        document.getElementById('modalSeasons').style.display = 'block';
        await loadSeasons(item);
    } else {
        document.getElementById('modalSeasons').style.display = 'none';
    }

    document.getElementById('modalPlay').onclick = () => {
        player.open(item, currentSeason, currentEpisode);
        modal.classList.remove('active');
    };

    modal.classList.add('active');
}

async function loadSeasons(item) {
    const container = document.getElementById('seasonsList');
    container.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

    try {
        const seasonCount = Math.min(item.seasons || 1, 30);
        let allSeasonsData = [];

        for (let s = 1; s <= seasonCount; s++) {
            try {
                const seasonData = await tmdb.getSeasonDetails(item.id, s);
                allSeasonsData.push({ season: s, data: seasonData });
            } catch (e) {
                allSeasonsData.push({ season: s, data: null });
            }
        }

        let html = '<div class="season-selector">';
        html += '<div class="season-tabs">';
        allSeasonsData.forEach((sd, i) => {
            const epCount = sd.data?.episodes?.length || 0;
            html += `<button class="season-tab ${i === 0 ? 'active' : ''}" onclick="switchSeason(${i}, ${item.id})" data-season="${sd.season}">
                <span class="season-num">T${String(sd.season).padStart(2, '0')}</span>
                <span class="season-eps">${epCount} eps</span>
            </button>`;
        });
        html += '</div>';
        html += '<div class="episodes-container" id="episodesContainer">';
        html += renderEpisodes(allSeasonsData[0]?.data, 1);
        html += '</div></div>';

        container.innerHTML = html;
        window._seasonsData = allSeasonsData;
        window._currentItem = item;
    } catch (error) {
        container.innerHTML = '<p style="color:var(--text-muted)">Erro ao carregar temporadas</p>';
    }
}

function renderEpisodes(seasonData, seasonNum) {
    if (!seasonData?.episodes || seasonData.episodes.length === 0) {
        return '<div class="empty-eps"><i class="fas fa-film"></i><p>Nenhum episodio encontrado</p></div>';
    }

    let html = '<div class="episodes-grid">';
    seasonData.episodes.forEach(ep => {
        const epNum = String(ep.episode_number).padStart(2, '0');
        const seasonNumStr = String(seasonNum).padStart(2, '0');
        const stillUrl = ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : '';
        html += `
            <div class="episode-card" onclick="playEpisode(${seasonNum}, ${ep.episode_number})">
                <div class="episode-thumb">
                    ${stillUrl ? `<img src="${stillUrl}" alt="E${epNum}" loading="lazy" onerror="this.style.display='none'">` : ''}
                    <div class="episode-play"><i class="fas fa-play"></i></div>
                    <div class="episode-number">S${seasonNumStr}E${epNum}</div>
                </div>
                <div class="episode-info">
                    <div class="episode-title-row">
                        <span class="episode-name">${ep.name || 'Episodio ' + ep.episode_number}</span>
                    </div>
                    <p class="episode-desc">${(ep.overview || '').substring(0, 100)}${(ep.overview || '').length > 100 ? '...' : ''}</p>
                </div>
            </div>`;
    });
    html += '</div>';
    return html;
}

function switchSeason(index, itemId) {
    document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.season-tab')[index].classList.add('active');
    const sd = window._seasonsData[index];
    document.getElementById('episodesContainer').innerHTML = renderEpisodes(sd.data, sd.season);
    currentSeason = sd.season;
    currentEpisode = 1;
}

function playEpisode(season, episode) {
    currentSeason = season;
    currentEpisode = episode;
    if (window._currentItem) {
        document.getElementById('movieModal').classList.remove('active');
        player.open(window._currentItem, season, episode);
    }
}

function toggleFavorite(itemIdOrItem) {
    let item;
    if (typeof itemIdOrItem === 'string' || typeof itemIdOrItem === 'number') {
        const numId = Number(itemIdOrItem);
        item = favorites.find(f => f.id === numId) || null;
        if (!item) {
            item = { id: numId, title: '', poster: null, backdrop: null, overview: '', rating: 0, releaseDate: '', mediaType: 'movie', genreIds: [] };
        }
    } else {
        item = itemIdOrItem;
    }
    const index = favorites.findIndex(f => f.id === item.id);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push({
            id: item.id, title: item.title, poster: item.poster, backdrop: item.backdrop,
            overview: item.overview, rating: item.rating, releaseDate: item.releaseDate,
            mediaType: item.mediaType, genreIds: item.genreIds, seasons: item.seasons, episodes: item.episodes
        });
    }
    localStorage.setItem('cineverse_favorites', JSON.stringify(favorites));
    document.querySelectorAll(`.movie-card[data-id="${item.id}"]`).forEach(card => {
        const fav = card.querySelector('.card-fav');
        if (fav) fav.classList.toggle('active');
    });
    const modalFav = document.getElementById('modalFav');
    if (modalFav) {
        const isFav = favorites.some(f => f.id === item.id);
        modalFav.innerHTML = `<i class="fas fa-heart"></i> ${isFav ? 'DESFAVORITAR' : 'FAVORITAR'}`;
    }
}

function loadFavorites() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-heart"></i></span>Meus Favoritos</h2></div>
            <div class="movies-row" id="favoritesRow"></div>
        </section>`;
    const container = document.getElementById('favoritesRow');
    if (favorites.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-heart-broken"></i><p>Nenhum favorito ainda</p></div>';
    } else {
        container.innerHTML = favorites.map(item => createCard(item)).join('');
        setupCardClicks('favoritesRow', favorites);
    }
}

async function performSearch(query) {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
        <section class="content-section">
            <div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-search"></i></span>Resultados para "${query}"</h2></div>
            <div class="movies-row" id="searchResults"><div class="loading"><div class="loading-spinner"></div></div></div>
        </section>`;
    try {
        let results = await tmdb.searchMulti(query);
        if (currentFilter !== 'all') {
            results = results.filter(item => {
                if (currentFilter === 'anime') return item.genreIds?.includes(16);
                if (currentFilter === 'tv') return item.mediaType === 'tv';
                return item.mediaType === currentFilter;
            });
        }
        const container = document.getElementById('searchResults');
        if (results.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum resultado encontrado</p></div>';
        } else {
            container.innerHTML = results.map(item => createCard(item)).join('');
            setupCardClicks('searchResults', results);
        }
    } catch (error) {
        document.getElementById('searchResults').innerHTML = '<div class="error-message">Erro na busca</div>';
    }
}

function goHome() {
    currentCategory = 'home';
    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    document.querySelector('.nav-links a[data-category="home"]').classList.add('active');
    loadHomePage();
}

function getGenreName(id) {
    const genres = {
        28:'Acao',12:'Aventura',16:'Animacao',35:'Comedia',80:'Crime',
        99:'Documentario',18:'Drama',10751:'Familia',14:'Fantasia',
        36:'Historia',27:'Terror',10402:'Musica',9648:'Misterio',
        10749:'Romance',878:'Ficcao Cientifica',53:'Suspense',
        10752:'Guerra',37:'Faroeste',10759:'Acao & Aventura',
        10762:'Infantil',10765:'Sci-Fi & Fantasia'
    };
    return genres[id] || 'Genero';
}

document.getElementById('modalClose')?.addEventListener('click', () => {
    document.getElementById('movieModal').classList.remove('active');
});
document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
    document.getElementById('movieModal').classList.remove('active');
});
document.querySelector('.player-bg')?.addEventListener('click', () => {
    player.close();
});
