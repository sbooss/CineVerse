class VideoPlayer {
    constructor() {
        this.overlay = document.getElementById('playerOverlay');
        this.wrapper = document.getElementById('playerWrapper');
        this.titleEl = document.getElementById('playerTitle');
        this.backBtn = document.getElementById('playerBack');
        this.backBtn.addEventListener('click', () => this.close());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });
        this._setupPlayerAntiAds();
        this._setupIframeMessageBlocker();
    }

    _setupPlayerAntiAds() {
        this.overlay.addEventListener('click', (e) => {
            if (!this.isOpen()) return;
            const target = e.target;
            const isOurUI = target.closest('#playerBack') ||
                           target.closest('.change-provider-btn') ||
                           target.closest('.provider-btn') ||
                           target.closest('#playerErrorBack') ||
                           target.closest('#changeProviderBtn') ||
                           target.closest('.provider-list');
            if (!isOurUI && target.tagName === 'IFRAME') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);

        this.overlay.addEventListener('touchstart', (e) => {
            if (!this.isOpen()) return;
            const target = e.target;
            const isOurUI = target.closest('#playerBack') ||
                           target.closest('.change-provider-btn') ||
                           target.closest('.provider-btn') ||
                           target.closest('#playerErrorBack');
            if (!isOurUI && target.tagName === 'IFRAME') {
                e.preventDefault();
                return false;
            }
        }, { passive: false, capture: true });
    }

    _setupIframeMessageBlocker() {
        window.addEventListener('message', (e) => {
            if (!this.isOpen()) return;
            const data = e.data;
            if (typeof data === 'string') {
                const lower = data.toLowerCase();
                if (lower.includes('open') || lower.includes('popup') || lower.includes('redirect')) {
                    e.stopImmediatePropagation();
                    return false;
                }
            }
        }, true);
    }

    isOpen() {
        return this.overlay.classList.contains('active');
    }

    async open(item, season = 1, episode = 1) {
        if (typeof auth !== 'undefined') {
            const canPlay = auth.requireSubscription();
            if (!canPlay) {
                window.playAfterAuth = () => this.open(item, season, episode);
                return;
            }
        }
        this.titleEl.textContent = item.title;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this._loadEmbed(item, season, episode);
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        const iframes = this.wrapper.querySelectorAll('iframe');
        iframes.forEach(f => { try { f.src = 'about:blank'; f.remove(); } catch(ex) {} });
        this.wrapper.innerHTML = '';
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
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
                        <button class="btn-secondary" id="playerErrorBack" style="margin-top:15px">
                            <i class="fas fa-arrow-left"></i> Voltar
                        </button>
                    </div>`;
                document.getElementById('playerErrorBack').addEventListener('click', () => this.close());
                return;
            }

            const p = providers[index];
            const url = type === 'tv' ? p.tv(tmdbId, season, episode) : p.movie(tmdbId);

            this.wrapper.innerHTML = `
                <div class="provider-selector">
                    <span class="current-provider"><i class="fas fa-play-circle"></i> ${p.name}</span>
                    <button class="change-provider-btn" id="changeProviderBtn">
                        <i class="fas fa-exchange-alt"></i> Trocar Server
                    </button>
                </div>`;

            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', url);
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('allow', 'autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen');
            iframe.setAttribute('class', 'video-iframe');
            iframe.setAttribute('referrerpolicy', 'no-referrer');
            iframe.setAttribute('loading', 'eager');
            iframe.style.opacity = '0';
            iframe.style.transition = 'opacity 0.3s';
            iframe.onload = function() { this.style.opacity = '1'; };

            this.wrapper.appendChild(iframe);

            document.getElementById('changeProviderBtn').addEventListener('click', () => this.showServers());

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
        let html = '<div class="provider-list"><h3>Escolha o Servidor</h3><div class="provider-grid">';
        this._currentProviders.forEach((p, i) => {
            const isActive = i === this._currentIndex;
            const icon = i === 0 ? 'fa-bolt' : 'fa-rocket';
            html += `<button class="provider-btn ${isActive ? 'active' : ''}" data-server="${i}">
                <i class="fas ${icon}"></i> ${p.name}
                ${isActive ? '<span class="provider-active-label">Atual</span>' : ''}
            </button>`;
        });
        html += '</div></div>';
        const existing = this.wrapper.querySelector('.provider-list');
        if (existing) existing.remove();
        this.wrapper.insertAdjacentHTML('beforeend', html);

        this.wrapper.querySelectorAll('.provider-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-server'));
                this._switchServer(index);
            });
        });
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
                                <p>Stream indisponivel</p>
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
                </div>`;
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', channel.streamUrl);
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('allow', 'autoplay; encrypted-media');
            iframe.setAttribute('class', 'video-iframe');
            this.wrapper.appendChild(iframe);
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
