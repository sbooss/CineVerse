class VideoPlayer {
    constructor() {
        this.overlay = document.getElementById('playerOverlay');
        this.wrapper = document.getElementById('playerWrapper');
        this.titleEl = document.getElementById('playerTitle');
        this.backBtn = document.getElementById('playerBack');
        this._setupPopupBlocker();
        this.backBtn.addEventListener('click', () => this.close());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });
    }

    _setupPopupBlocker() {
        window.open = function() { return null; };
        document.addEventListener('click', (e) => {
            if (!this.isOpen()) return;
            const link = e.target.closest('a');
            if (link) {
                const href = link.getAttribute('href') || '';
                const target = link.getAttribute('target') || '';
                if (target === '_blank' || target === '_top' || href.startsWith('javascript:')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
        }, true);
    }

    isOpen() {
        return this.overlay.classList.contains('active');
    }

    open(item, season = 1, episode = 1) {
        this.titleEl.textContent = item.title;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this._loadEmbed(item, season, episode);
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.wrapper.innerHTML = '';
    }

    _loadEmbed(item, season, episode) {
        const type = (item.mediaType === 'tv' || item.mediaType === 'anime') ? 'tv' : 'movie';
        const tmdbId = item.id;
        const providers = CONFIG.EMBED.PROVIDERS;
        let currentIndex = 0;

        const tryProvider = (index) => {
            if (index >= providers.length) {
                this.wrapper.innerHTML = `
                    <div class="player-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Nenhum servidor disponivel</p>
                        <button class="btn-secondary" onclick="player.close()" style="margin-top:15px">
                            <i class="fas fa-arrow-left"></i> Voltar
                        </button>
                    </div>`;
                return;
            }

            const p = providers[index];
            const url = type === 'tv' ? p.tv(tmdbId, season, episode) : p.movie(tmdbId);

            this.wrapper.innerHTML = `
                <div class="provider-selector">
                    <span class="current-provider">${p.name}</span>
                    <button class="change-provider-btn" onclick="player.showServers()">
                        <i class="fas fa-exchange-alt"></i> Trocar Server
                    </button>
                </div>
                <iframe 
                    src="${url}" 
                    frameborder="0" 
                    allowfullscreen 
                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    class="video-iframe"
                    onload="this.style.opacity=1"
                    onerror="player._nextProvider()">
                </iframe>`;

            currentIndex = index;
            this._currentProviders = providers;
            this._currentIndex = index;
            this._currentType = type;
            this._currentTmdbId = tmdbId;
            this._currentSeason = season;
            this._currentEpisode = episode;
        };

        this._nextProvider = () => {
            if (currentIndex < providers.length - 1) {
                currentIndex++;
                tryProvider(currentIndex);
            }
        };

        this._nextProvider = this._nextProvider.bind(this);
        tryProvider(0);
    }

    showServers() {
        if (!this._currentProviders) return;
        let html = '<div class="provider-list"><h3>Escolha o Server</h3><div class="provider-grid">';
        this._currentProviders.forEach((p, i) => {
            html += `<button class="provider-btn ${i === this._currentIndex ? 'active' : ''}" onclick="player._switchServer(${i})">${p.name}</button>`;
        });
        html += '</div></div>';
        const existing = this.wrapper.querySelector('.provider-list');
        if (existing) existing.remove();
        this.wrapper.insertAdjacentHTML('beforeend', html);
    }

    _switchServer(index) {
        const list = this.wrapper.querySelector('.provider-list');
        if (list) list.remove();
        if (!this._currentProviders || index < 0 || index >= this._currentProviders.length) return;

        const p = this._currentProviders[index];
        const url = this._currentType === 'tv'
            ? p.tv(this._currentTmdbId, this._currentSeason, this._currentEpisode)
            : p.movie(this._currentTmdbId);

        this._currentIndex = index;
        const iframe = this.wrapper.querySelector('iframe');
        if (iframe) {
            iframe.src = url;
            const prov = this.wrapper.querySelector('.current-provider');
            if (prov) prov.textContent = p.name;
        }
    }

    openLiveTV(channel) {
        this.titleEl.textContent = channel.title;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (channel.streamUrl && channel.streamUrl.includes('.m3u8')) {
            this.wrapper.innerHTML = `
                <div class="provider-selector">
                    <span class="current-provider">TV Ao Vivo - ${channel.title}</span>
                </div>
                <video id="liveVideo" class="video-iframe" controls autoplay muted></video>`;
            const video = document.getElementById('liveVideo');
            if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(channel.streamUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
                hls.on(Hls.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        this.wrapper.innerHTML = `
                            <div class="player-error">
                                <i class="fas fa-tv"></i>
                                <p>Stream indisponivel - tentando proximo...</p>
                            </div>`;
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = channel.streamUrl;
                video.play().catch(() => {});
            } else {
                this.wrapper.innerHTML = `
                    <div class="player-error">
                        <i class="fas fa-tv"></i>
                        <p>Seu navegador nao suporta HLS</p>
                    </div>`;
            }
        } else if (channel.streamUrl) {
            this.wrapper.innerHTML = `
                <div class="provider-selector">
                    <span class="current-provider">TV Ao Vivo - ${channel.title}</span>
                </div>
                <iframe src="${channel.streamUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" class="video-iframe"></iframe>`;
        } else {
            this.wrapper.innerHTML = `
                <div class="player-error">
                    <i class="fas fa-tv"></i>
                    <p>Stream nao disponivel</p>
                </div>`;
        }
    }
}

const player = new VideoPlayer();
