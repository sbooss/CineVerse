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

        this._popupObserver = new MutationObserver((mutations) => {
            if (!this.isOpen()) return;
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.tagName === 'IFRAME' && node !== this.wrapper.querySelector('iframe')) {
                        node.remove();
                    }
                    if (node.tagName === 'DIV' && node.style && node.style.position === 'fixed' && node.style.zIndex > 9999) {
                        node.remove();
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('iframe').forEach(f => {
                            if (f !== this.wrapper.querySelector('iframe')) f.remove();
                        });
                    }
                }
            }
        });
        this._popupObserver.observe(document.body, { childList: true, subtree: true });
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
        this._showAdWarning();
        this._loadEmbed(item, season, episode);
    }

    _showAdWarning() {
        const existing = document.getElementById('playerAdWarning');
        if (existing) existing.remove();

        const warning = document.createElement('div');
        warning.id = 'playerAdWarning';
        warning.style.cssText = 'position:absolute;top:56px;left:50%;transform:translateX(-50%);z-index:10;background:rgba(255,200,0,0.12);border:1px solid rgba(255,200,0,0.25);border-radius:8px;padding:8px 16px;display:flex;align-items:center;gap:8px;max-width:90%;animation:adWarnFade 0.3s ease';
        warning.innerHTML = '<i class="fas fa-info-circle" style="color:#ffc800;font-size:12px;flex-shrink:0"></i><span style="font-size:11px;color:#e8e8f0;line-height:1.4">Se uma aba indesejada abrir, feche e volte ao filme. Use os servidores abaixo para trocar.</span>';
        this.overlay.querySelector('.player-container').insertBefore(warning, this.overlay.querySelector('.server-bar'));
        setTimeout(() => { if (warning.parentNode) warning.style.opacity = '0.6'; }, 5000);
        setTimeout(() => { if (warning.parentNode) warning.remove(); }, 10000);
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        const iframes = this.wrapper.querySelectorAll('iframe');
        iframes.forEach(f => { try { f.src = 'about:blank'; f.remove(); } catch(ex) {} });
        this.wrapper.innerHTML = '';
        const serverBar = document.getElementById('serverBar');
        if (serverBar) serverBar.innerHTML = '';
        if (this._popupObserver) {
            this._popupObserver.disconnect();
        }
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
        let loadTimeout = null;

        const buildServerBar = (activeIndex) => {
            let html = '<span class="server-label">Servidor:</span>';
            providers.forEach((p, i) => {
                const cls = i === activeIndex ? 'server-chip active' : 'server-chip';
                html += '<button class="' + cls + '" data-server="' + i + '">' + p.name + '</button>';
            });
            return html;
        };

        const showError = (msg) => {
            this.wrapper.innerHTML = `
                <div class="player-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${msg || 'Nenhum servidor disponivel'}</p>
                    <button class="btn-secondary" id="playerErrorBack" style="margin-top:15px">
                        <i class="fas fa-arrow-left"></i> Voltar
                    </button>
                </div>`;
            document.getElementById('playerErrorBack').addEventListener('click', () => this.close());
        };

        const tryProvider = (index) => {
            if (loadTimeout) clearTimeout(loadTimeout);
            if (index >= providers.length) {
                serverBar.innerHTML = '';
                showError('Todos os servidores estao fora no momento. Tente novamente mais tarde.');
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
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads');
            iframe.style.opacity = '0';
            iframe.style.transition = 'opacity 0.3s';
            let loaded = false;
            iframe.onload = function() {
                loaded = true;
                this.style.opacity = '1';
            };

            this.wrapper.innerHTML = '';
            this.wrapper.appendChild(iframe);

            loadTimeout = setTimeout(() => {
                if (!loaded && index < providers.length - 1) {
                    this._nextProvider();
                }
            }, 10000);

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
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-presentation');
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
