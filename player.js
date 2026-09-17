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
                           target.closest('.server-chip') ||
                           target.closest('.server-bar') ||
                           target.closest('#playerErrorBack');
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
                           target.closest('.server-chip') ||
                           target.closest('.server-bar') ||
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
                if (lower.includes('popunder') || lower.includes('acscdn') || lower.includes('aclib') || lower.includes('onclickperformance')) {
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
            const canPlay = await auth.requireSubscription();
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
        const serverBar = document.getElementById('serverBar');
        if (serverBar) serverBar.innerHTML = '';
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
    }

    _loadEmbed(item, season, episode) {
        const type = (item.mediaType === 'tv' || item.mediaType === 'anime') ? 'tv' : 'movie';
        const tmdbId = item.id;
        const providers = CONFIG.EMBED.PROVIDERS;
        const serverBar = document.getElementById('serverBar');
        let currentIndex = 0;

        const buildServerBar = (activeIndex) => {
            let html = '<span class="server-label">Servidor:</span>';
            providers.forEach((p, i) => {
                const cls = i === activeIndex ? 'server-chip active' : 'server-chip';
                html += '<button class="' + cls + '" data-server="' + i + '">' + p.name + '</button>';
            });
            return html;
        };

        const tryProvider = (index) => {
            if (index >= providers.length) {
                serverBar.innerHTML = '';
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

            serverBar.innerHTML = buildServerBar(index);

            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', url);
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('allow', 'autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen');
            iframe.setAttribute('class', 'video-iframe');
            iframe.setAttribute('loading', 'eager');
            iframe.style.opacity = '0';
            iframe.style.transition = 'opacity 0.3s';
            iframe.onload = function() { this.style.opacity = '1'; };

            this.wrapper.innerHTML = '';
            this.wrapper.appendChild(iframe);

            serverBar.querySelectorAll('.server-chip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const idx = parseInt(btn.getAttribute('data-server'));
                    this._switchServer(idx);
                });
            });

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
        const serverBar = document.getElementById('serverBar');
        let html = '<span class="server-label">Servidor:</span>';
        this._currentProviders.forEach((p, i) => {
            const cls = i === this._currentIndex ? 'server-chip active' : 'server-chip';
            html += '<button class="' + cls + '" data-server="' + i + '">' + p.name + '</button>';
        });
        serverBar.innerHTML = html;

        serverBar.querySelectorAll('.server-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-server'));
                this._switchServer(index);
            });
        });
    }

    _switchServer(index) {
        if (!this._currentProviders || index < 0 || index >= this._currentProviders.length) return;

        const p = this._currentProviders[index];
        const url = this._currentType === 'tv'
            ? p.tv(this._currentTmdbId, this._currentSeason, this._currentEpisode)
            : p.movie(this._currentTmdbId);

        this._currentIndex = index;
        const iframe = this.wrapper.querySelector('iframe');
        if (iframe) {
            iframe.src = url;
        }
        const serverBar = document.getElementById('serverBar');
        serverBar.querySelectorAll('.server-chip').forEach((chip, i) => {
            chip.classList.toggle('active', i === index);
        });
    }

    openLiveTV(channel) {
        this.titleEl.textContent = channel.title;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        const serverBar = document.getElementById('serverBar');
        serverBar.innerHTML = '<span class="server-label">TV Ao Vivo</span>';

        if (channel.streamUrl && channel.streamUrl.includes('.m3u8')) {
            this.wrapper.innerHTML = `<video id="liveVideo" class="video-iframe" controls autoplay muted></video>`;
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
            this.wrapper.innerHTML = '';
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
