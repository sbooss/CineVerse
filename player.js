class VideoPlayer {
    constructor() {
        this.overlay = document.getElementById('playerOverlay');
        this.wrapper = document.getElementById('playerWrapper');
        this.titleEl = document.getElementById('playerTitle');
        this.backBtn = document.getElementById('playerBack');
        this._setupGlobalAntiAds();
        this._setupAntiAds();
        this._setupFullscreenLock();
        this.backBtn.addEventListener('click', () => this.close());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });
    }

    _setupGlobalAntiAds() {
        if (window._globalAntiAdsSetup) return;
        window._globalAntiAdsSetup = true;

        // Kill window.open globally and permanently
        window.open = function() { return null; };
        window.open.toString = function() { return 'function open() { [native code] }'; };
        Object.defineProperty(window, 'open', {
            value: function() { return null; },
            writable: false,
            configurable: false
        });

        // Block all navigation attempts
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        });

        // Block location changes
        const origAssign = window.location.assign;
        const origReplace = window.location.replace;
        Object.defineProperty(window, 'location', {
            get: function() { return window._safeLocation || window.location; },
            set: function() { return false; }
        });

        // Block all link clicks globally
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Block ANY link navigation
            const link = target.closest('a');
            if (link) {
                const href = link.getAttribute('href') || '';
                const targetAttr = link.getAttribute('target') || '';
                if (targetAttr === '_blank' || targetAttr === '_top' || href.startsWith('javascript:') || href === '#' || href === '' || !href.startsWith(window.location.origin)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }
            }

            // Block onclick handlers with window.open
            const onclickEl = target.closest('[onclick]');
            if (onclickEl) {
                const onclick = onclickEl.getAttribute('onclick') || '';
                if (onclick.includes('window.open') || onclick.includes('_blank') || onclick.includes('void(0)') || onclick.includes('popup')) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }
            }

            // Block elements that look like ad overlays
            const style = window.getComputedStyle(target);
            if ((style.position === 'fixed' || style.position === 'absolute') && parseInt(style.zIndex) > 9000) {
                if (!target.closest('.player-header') && !target.closest('#playerBack') && !target.closest('.provider-selector') && !target.closest('.provider-list')) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    try { target.remove(); } catch(ex) {}
                    return false;
                }
            }
        }, true);

        // MutationObserver - kill any popup elements
        const adObserver = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                m.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    // Remove ad overlays
                    if (node.classList && (
                        node.classList.contains('ad') ||
                        node.classList.contains('ads') ||
                        node.classList.contains('popup') ||
                        node.classList.contains('overlay-ad') ||
                        node.classList.contains('modal-ad') ||
                        node.classList.contains('backdrop') ||
                        node.id.includes('ad') ||
                        node.id.includes('popup') ||
                        node.id.includes('interstitial') ||
                        node.id.includes('modal')
                    )) {
                        try { node.remove(); } catch(ex) {}
                        return;
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
                });
            });
        });
        adObserver.observe(document.body, { childList: true, subtree: true });

        // Block timed popups
        const origSetTimeout = window.setTimeout;
        const origSetInterval = window.setInterval;
        window.setTimeout = function(fn, delay) {
            if (typeof fn === 'string' && (fn.includes('window.open') || fn.includes('popup') || fn.includes('ad') || fn.includes('redirect'))) {
                return 0;
            }
            return origSetTimeout.call(window, fn, delay);
        };
        window.setInterval = function(fn, delay) {
            if (typeof fn === 'string' && (fn.includes('window.open') || fn.includes('popup') || fn.includes('ad') || fn.includes('redirect'))) {
                return 0;
            }
            return origSetInterval.call(window, fn, delay);
        };

        // Block ad domain requests via fetch/XHR
        const origFetch = window.fetch;
        window.fetch = function(url, opts) {
            if (typeof url === 'string') {
                const blocked = CONFIG.AD_BLOCK.BLOCKED_DOMAINS;
                for (let i = 0; i < blocked.length; i++) {
                    if (url.includes(blocked[i])) {
                        return Promise.reject(new Error('Blocked'));
                    }
                }
            }
            return origFetch.call(window, url, opts);
        };

        const origXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (typeof url === 'string') {
                const blocked = CONFIG.AD_BLOCK.BLOCKED_DOMAINS;
                for (let i = 0; i < blocked.length; i++) {
                    if (url.includes(blocked[i])) {
                        return;
                    }
                }
            }
            return origXHROpen.apply(this, arguments);
        };

        // Block creating new iframes that aren't video
        const origCreateElement = document.createElement.bind(document);
        document.createElement = function(tag) {
            const el = origCreateElement(tag);
            if (tag.toLowerCase() === 'iframe') {
                const origSetAttr = el.setAttribute.bind(el);
                el.setAttribute = function(name, value) {
                    if (name === 'src' && typeof value === 'string') {
                        const blocked = CONFIG.AD_BLOCK.BLOCKED_DOMAINS;
                        for (let i = 0; i < blocked.length; i++) {
                            if (value.includes(blocked[i])) {
                                value = 'about:blank';
                            }
                        }
                    }
                    return origSetAttr(name, value);
                };
            }
            return el;
        };

        // Block middle-click globally
        document.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                e.preventDefault();
                return false;
            }
        }, true);

        // Block Ctrl+click globally
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                return false;
            }
        }, true);
    }

    _setupAntiAds() {
        // Additional player-specific protections
        this.overlay.addEventListener('click', (e) => {
            const target = e.target;
            // Block clicks on anything that isn't our UI
            if (!target.closest('.player-header') && !target.closest('#playerBack') && !target.closest('.provider-selector') && !target.closest('.provider-list') && !target.closest('.change-provider-btn') && !target.closest('.provider-btn') && !target.closest('.player-error') && !target.closest('button')) {
                // If clicking on the overlay background, do nothing
                if (target === this.overlay || target.classList.contains('player-bg')) {
                    return;
                }
                // Otherwise, prevent and stop propagation
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }, true);

        // Block all keyboard events except Escape
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen()) return;
            if (e.key === 'Escape') {
                this.close();
                return;
            }
            // Block all other keys when player is open
            if (!e.target.closest('.provider-list')) {
                e.preventDefault();
                e.stopPropagation();
            }
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

    open(item, season = 1, episode = 1) {
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

            // Create sandboxed iframe - CRITICAL for preventing popups
            this.wrapper.innerHTML = `
                <div class="provider-selector">
                    <span class="current-provider">${p.name}</span>
                    <button class="change-provider-btn" id="changeProviderBtn">
                        <i class="fas fa-exchange-alt"></i> Trocar Server
                    </button>
                </div>`;

            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', url);
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('allow', 'autoplay; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('class', 'video-iframe');
            // SANDBOX - blocks popups, new windows, forms, etc.
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups-to-escape-sandbox');
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
        let html = '<div class="provider-list"><h3>Escolha o Server</h3><div class="provider-grid">';
        this._currentProviders.forEach((p, i) => {
            html += `<button class="provider-btn ${i === this._currentIndex ? 'active' : ''}" data-server="${i}">${p.name}</button>`;
        });
        html += '</div></div>';
        const existing = this.wrapper.querySelector('.provider-list');
        if (existing) existing.remove();
        this.wrapper.insertAdjacentHTML('beforeend', html);

        // Add event listeners to server buttons
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
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
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
