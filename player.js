class VideoPlayer {
    constructor() {
        this.overlay = document.getElementById('playerOverlay');
        this.wrapper = document.getElementById('playerWrapper');
        this.titleEl = document.getElementById('playerTitle');
        this.backBtn = document.getElementById('playerBack');
        this._setupAntiAds();
        this._setupFullscreenLock();
        this.backBtn.addEventListener('click', () => this.close());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });
    }

    _setupAntiAds() {
        // Kill window.open entirely
        const origOpen = window.open;
        window.open = function() { return null; };
        window.open.toString = function() { return 'function open() { [native code] }'; };

        // Block navigation
        window.addEventListener('beforeunload', (e) => {
            if (this.isOpen()) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });

        // Intercept ALL clicks globally - block ads, popups, redirects
        document.addEventListener('click', (e) => {
            if (!this.isOpen()) return;
            const target = e.target;

            // Block any link navigation
            const link = target.closest('a');
            if (link) {
                const href = link.getAttribute('href') || '';
                const target = link.getAttribute('target') || '';
                if (target === '_blank' || target === '_top' || href.startsWith('javascript:') || href === '#' || href === '') {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }

            // Block onclick handlers with window.open or _blank
            const onclickEl = target.closest('[onclick]');
            if (onclickEl) {
                const onclick = onclickEl.getAttribute('onclick') || '';
                if (onclick.includes('window.open') || onclick.includes('_blank') || onclick.includes('void(0)')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }

            // Block elements that look like ad overlays (fixed/absolute positioned, high z-index)
            const style = window.getComputedStyle(target);
            if ((style.position === 'fixed' || style.position === 'absolute') && parseInt(style.zIndex) > 9000) {
                if (!target.closest('.player-header') && !target.closest('#playerBack') && !target.closest('.provider-selector') && !target.closest('.provider-list')) {
                    e.preventDefault();
                    e.stopPropagation();
                    target.remove();
                    return false;
                }
            }
        }, true);

        // MutationObserver - kill any popup elements added to DOM
        const adObserver = new MutationObserver((mutations) => {
            if (!this.isOpen()) return;
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
                        node.id.includes('ad') ||
                        node.id.includes('popup') ||
                        node.id.includes('interstitial')
                    )) {
                        node.remove();
                        return;
                    }
                    // Fix links in added nodes
                    if (node.tagName === 'A') {
                        const t = node.getAttribute('target') || '';
                        if (t === '_blank' || t === '_top') {
                            node.removeAttribute('target');
                            node.href = 'javascript:void(0)';
                        }
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('a[target="_blank"], a[target="_top"]').forEach(a => {
                            a.removeAttribute('target');
                            a.href = 'javascript:void(0)';
                        });
                    }
                    // Remove fixed/absolute elements with high z-index that aren't part of our player
                    if (node.style) {
                        const pos = window.getComputedStyle(node).position;
                        const z = parseInt(window.getComputedStyle(node).zIndex);
                        if ((pos === 'fixed' || pos === 'absolute') && z > 9000) {
                            if (!node.classList.contains('player-header') && !node.id.includes('playerBack') && !node.classList.contains('provider-selector') && !node.classList.contains('provider-list')) {
                                setTimeout(() => node.remove(), 100);
                            }
                        }
                    }
                });
            });
        });
        adObserver.observe(document.body, { childList: true, subtree: true });

        // Block timed popups (setTimeout/setInterval that open windows)
        const origSetTimeout = window.setTimeout;
        const origSetInterval = window.setInterval;
        window.setTimeout = function(fn, delay) {
            if (typeof fn === 'string' && (fn.includes('window.open') || fn.includes('popup') || fn.includes('ad'))) {
                return 0;
            }
            return origSetTimeout.call(window, fn, delay);
        };
        window.setInterval = function(fn, delay) {
            if (typeof fn === 'string' && (fn.includes('window.open') || fn.includes('popup') || fn.includes('ad'))) {
                return 0;
            }
            return origSetInterval.call(window, fn, delay);
        };

        // Block ad domain requests via fetch/XHR override
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
    }

    _setupPopupBlocker() {
        // Additional popup blocking via event delegation
        document.addEventListener('mousedown', (e) => {
            if (!this.isOpen()) return;
            const target = e.target;
            // Block middle-click (often opens in new tab)
            if (e.button === 1) {
                e.preventDefault();
                return false;
            }
            // Block right-click context menu on player (prevent "open in new tab")
            if (target.closest('.video-iframe') || target.closest('#playerWrapper')) {
                e.preventDefault();
                return false;
            }
        }, true);

        // Prevent new windows via keyboard shortcuts (Ctrl+click, middle-click)
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen()) return;
            // Block Ctrl+click (open in new tab)
            if (e.ctrlKey || e.metaKey) {
                if (e.target.closest('.video-iframe') || e.target.closest('#playerWrapper')) {
                    e.preventDefault();
                    return false;
                }
            }
        }, true);
    }

    _setupFullscreenLock() {
        // Prevent ads from exiting fullscreen
        const lockFullscreen = () => {
            if (!document.fullscreenElement && this.overlay.classList.contains('active')) {
                try {
                    this.overlay.requestFullscreen().catch(() => {});
                } catch(e) {}
            }
        };

        document.addEventListener('fullscreenchange', () => {
            if (this.isOpen() && !document.fullscreenElement) {
                // Someone exited fullscreen - re-enter it
                setTimeout(lockFullscreen, 500);
            }
        });

        // Override exitFullscreen when player is open
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
        this._loadEmbed(item, season, episode);
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
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
