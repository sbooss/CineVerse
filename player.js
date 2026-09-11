class VideoPlayer {
    constructor() {
        this.overlay = document.getElementById('playerOverlay');
        this.wrapper = document.getElementById('playerWrapper');
        this.titleEl = document.getElementById('playerTitle');
        this.backBtn = document.getElementById('playerBack');
        this._setupGlobalAntiAds();
        this._setupAntiAds();
        this._setupFullscreenLock();
        this._setupIframeMessageBlocker();
        this.backBtn.addEventListener('click', () => this.close());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });
    }

    _setupGlobalAntiAds() {
        if (window._globalAntiAdsSetup) return;
        window._globalAntiAdsSetup = true;

        // Kill window.open globally and permanently - ABSOLUTE BLOCK
        const deadFn = function() { return null; };
        window.open = deadFn;
        window.open.toString = function() { return 'function open() { [native code] }'; };
        Object.defineProperty(window, 'open', { value: deadFn, writable: false, configurable: false });

        // Also block on all frames
        try {
            if (window.frames && window.frames.length > 0) {
                for (let i = 0; i < window.frames.length; i++) {
                    try { window.frames[i].window.open = deadFn; } catch(ex) {}
                }
            }
        } catch(ex) {}

        // Block ALL navigation - ABSOLUTE
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        });

        // Block location changes
        try {
            const origAssign = window.location.assign.bind(window.location);
            const origReplace = window.location.replace.bind(window.location);
            window.location.assign = function() { return false; };
            window.location.replace = function() { return false; };
        } catch(ex) {}

        // Block ALL clicks on ANY links - ABSOLUTE
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Block ANY link
            const link = target.closest('a');
            if (link) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }

            // Block onclick handlers
            const onclickEl = target.closest('[onclick]');
            if (onclickEl) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }

            // Block ANY element with data-href or data-url
            if (target.dataset && (target.dataset.href || target.dataset.url)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }

            // Block ad overlays
            const style = window.getComputedStyle(target);
            if ((style.position === 'fixed' || style.position === 'absolute') && parseInt(style.zIndex) > 9000) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                try { target.remove(); } catch(ex) {}
                return false;
            }
        }, true);

        // MutationObserver - NUCLEAR OPTION - remove ALL non-player elements
        const adObserver = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                m.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    // Remove ALL iframes except our video
                    if (node.tagName === 'IFRAME') {
                        if (!node.classList.contains('video-iframe')) {
                            try { node.remove(); } catch(ex) {}
                        }
                        return;
                    }
                    // Remove ALL elements with ad-related classes/ids
                    if (node.classList) {
                        const classes = Array.from(node.classList).join(' ').toLowerCase();
                        const id = (node.id || '').toLowerCase();
                        if (classes.includes('ad') || classes.includes('popup') || classes.includes('modal') ||
                            classes.includes('overlay') || classes.includes('backdrop') || classes.includes('interstitial') ||
                            id.includes('ad') || id.includes('popup') || id.includes('modal')) {
                            try { node.remove(); } catch(ex) {}
                            return;
                        }
                    }
                    // Remove fixed/absolute elements with high z-index
                    if (node.style) {
                        try {
                            const pos = window.getComputedStyle(node).position;
                            const z = parseInt(window.getComputedStyle(node).zIndex);
                            if ((pos === 'fixed' || pos === 'absolute') && z > 9000) {
                                if (!node.classList.contains('player-header') && !node.id.includes('playerBack') && !node.classList.contains('provider-selector') && !node.classList.contains('provider-list')) {
                                    setTimeout(() => { try { node.remove(); } catch(ex) {} }, 50);
                                }
                            }
                        } catch(ex) {}
                    }
                    // Fix ALL links in added nodes
                    if (node.tagName === 'A') {
                        node.removeAttribute('target');
                        node.href = 'javascript:void(0)';
                        node.onclick = function() { return false; };
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('a').forEach(a => {
                            a.removeAttribute('target');
                            a.href = 'javascript:void(0)';
                            a.onclick = function() { return false; };
                        });
                    }
                });
            });
        });
        adObserver.observe(document.body, { childList: true, subtree: true });
        adObserver.observe(document.documentElement, { childList: true, subtree: true });

        // Block ALL keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Block Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+S, Ctrl+P
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                return false;
            }
            // Block F1-F12
            if (e.key >= 'F1' && e.key <= 'F12') {
                e.preventDefault();
                return false;
            }
        }, true);

        // Block middle-click globally
        document.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                e.preventDefault();
                return false;
            }
        }, true);

        // Block drag (prevent dragging to new tab)
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        }, true);

        // Block context menu globally
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        }, true);
    }

    _setupIframeMessageBlocker() {
        // Block postMessage from iframe trying to open windows
        window.addEventListener('message', (e) => {
            if (!this.isOpen()) return;
            const data = e.data;
            if (typeof data === 'string') {
                const lower = data.toLowerCase();
                if (lower.includes('open') || lower.includes('popup') || lower.includes('redirect') ||
                    lower.includes('navigate') || lower.includes('location')) {
                    e.stopImmediatePropagation();
                    return false;
                }
            }
            if (typeof data === 'object' && data) {
                if (data.type && (data.type.includes('open') || data.type.includes('popup') || data.type.includes('navigate'))) {
                    e.stopImmediatePropagation();
                    return false;
                }
            }
        }, true);
    }

    _setupAntiAds() {
        // Block ALL clicks inside player overlay - ONLY allow our UI buttons
        this.overlay.addEventListener('click', (e) => {
            const target = e.target;

            // Allow clicks on our specific UI elements
            const isOurUI = target.closest('#playerBack') ||
                           target.closest('.change-provider-btn') ||
                           target.closest('.provider-btn') ||
                           target.closest('#playerErrorBack') ||
                           target.closest('#changeProviderBtn');

            if (!isOurUI) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                // Remove any ad overlay that was clicked
                const style = window.getComputedStyle(target);
                if ((style.position === 'fixed' || style.position === 'absolute') && parseInt(style.zIndex) > 9000) {
                    try { target.remove(); } catch(ex) {}
                }
                return false;
            }
        }, true);

        // Block ALL touch events on non-UI elements
        this.overlay.addEventListener('touchstart', (e) => {
            const target = e.target;
            const isOurUI = target.closest('#playerBack') ||
                           target.closest('.change-provider-btn') ||
                           target.closest('.provider-btn') ||
                           target.closest('#playerErrorBack');

            if (!isOurUI) {
                e.preventDefault();
                return false;
            }
        }, { passive: false, capture: true });

        // Block ALL keyboard except Escape
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen()) return;
            if (e.key === 'Escape') {
                this.close();
                return;
            }
            // Block EVERYTHING else
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }, true);
    }

    _setupFullscreenLock() {
        const lockFullscreen = () => {
            if (!document.fullscreenElement && this.overlay.classList.contains('active')) {
                try {
                    this.overlay.requestFullscreen().catch(() => {});
                } catch(e) {}
            }
        };

        document.addEventListener('fullscreenchange', () => {
            if (this.isOpen() && !document.fullscreenElement) {
                setTimeout(lockFullscreen, 500);
            }
        });

        const origExit = document.exitFullscreen.bind(document);
        document.exitFullscreen = () => {
            if (this.isOpen()) return Promise.reject();
            return origExit();
        };
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
        document.body.classList.add('player-open');
        this._loadEmbed(item, season, episode);
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        document.body.classList.remove('player-open');
        // Remove ALL iframes
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

            // NO SANDBOX - providers block sandboxed iframes
            // Anti-ads handled by our global protections instead
            // window.open is permanently blocked, MutationObserver removes ads

            iframe.setAttribute('referrerpolicy', 'no-referrer');
            iframe.setAttribute('loading', 'eager');
            iframe.style.opacity = '0';
            iframe.style.transition = 'opacity 0.3s';
            iframe.onload = function() { this.style.opacity = '1'; };
            iframe.onerror = function() { player._nextProvider(); };

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
        document.body.classList.add('player-open');

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
            // No sandbox for Live TV - providers need full access
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
