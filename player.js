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
        this._setupNuclearAntiAds();
    }

    _setupNuclearAntiAds() {
        // Override window.open to block popups globally
        var originalOpen = window.open;
        this._originalOpen = originalOpen;
        window.open = function() {
            return null;
        };

        // Intercept clicks to prevent new tab behavior
        this.overlay.addEventListener('click', (e) => {
            if (!this.isOpen()) return;
            var t = e.target;
            var isUI = t.closest('#playerBack') ||
                       t.closest('.server-chip') ||
                       t.closest('.server-bar') ||
                       t.closest('#playerErrorBack') ||
                       t.closest('.player-header');
            if (!isUI) {
                // Prevent default behavior that might open new tabs
                e.preventDefault();
                e.stopPropagation();
                
                // Block clicks on links that would open new tabs
                if (t.tagName === 'A' && (t.target === '_blank' || t.getAttribute('rel') === 'noopener')) {
                    t.target = '_self';
                    t.removeAttribute('rel');
                }
                
                // Block clicks that might trigger popup behavior
                if (t.tagName === 'IFRAME' || t.style?.position === 'fixed' || 
                    t.style?.position === 'absolute' || t.style?.zIndex > 9999) {
                    return false;
                }
            }
        }, true);

        // Block middle-click (auxclick) which often opens new tabs
        this.overlay.addEventListener('auxclick', (e) => {
            if (this.isOpen()) { e.preventDefault(); return false; }
        }, true);

        // Block touchstart on non-UI elements to prevent ad interactions
        this.overlay.addEventListener('touchstart', (e) => {
            if (!this.isOpen()) return;
            var t = e.target;
            var isUI = t.closest('#playerBack') ||
                       t.closest('.server-chip') ||
                       t.closest('.server-bar') ||
                       t.closest('#playerErrorBack');
            if (!isUI) {
                e.preventDefault();
                return false;
            }
        }, { passive: false, capture: true });

        // Observer to remove ad elements injected by Fembed
        this._popupObserver = new MutationObserver((mutations) => {
            if (!this.isOpen()) return;
            for (var m of mutations) {
                for (var node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    
                    // Remove iframes that aren't our video iframe
                    if (node.tagName === 'IFRAME' && !node.classList.contains('video-iframe')) {
                        node.remove(); continue;
                    }
                    
                    // Remove fixed/absolute positioned ad overlays
                    if (node.style && (node.style.position === 'fixed' || node.style.position === 'absolute') && 
                        parseInt(node.style.zIndex || 0) > 9999) {
                        node.remove(); continue;
                    }
                    
                    // Remove elements with ad-related attributes
                    if (node.querySelectorAll) {
                        node.querySelectorAll('iframe:not(.video-iframe)').forEach(f => f.remove());
                        node.querySelectorAll('div[style*="position: fixed"], div[style*="position: absolute"]').forEach(f => {
                            if (parseInt(f.style.zIndex || 0) > 9999) f.remove();
                        });
                        node.querySelectorAll('[onclick], [data-href], [data-url], [target="_blank"]').forEach(f => {
                            f.removeAttribute('onclick');
                            f.removeAttribute('data-href');
                            f.removeAttribute('data-url');
                            f.target = '_self';
                        });
                    }
                }
            }
        });
        this._popupObserver.observe(document.body, { childList: true, subtree: true });

        // Block messages that might trigger popups or navigation
        window.addEventListener('message', (e) => {
            if (!this.isOpen()) return;
            var d = e.data;
            if (typeof d === 'string') {
                var l = d.toLowerCase();
                if (l.includes('open') || l.includes('popup') || l.includes('redirect') ||
                    l.includes('navigate') || l.includes('popunder') || l.includes('acscdn') ||
                    l.includes('aclib') || l.includes('onclick') || l.includes('location')) {
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
            var canPlay = await auth.requireSubscription();
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
        var iframes = this.wrapper.querySelectorAll('iframe');
        iframes.forEach(f => { try { f.src = 'about:blank'; f.remove(); } catch(ex) {} });
        this.wrapper.innerHTML = '';
        var serverBar = document.getElementById('serverBar');
        if (serverBar) serverBar.innerHTML = '';
        if (this._popupObserver) this._popupObserver.disconnect();
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }

    _loadEmbed(item, season, episode) {
        var type = (item.mediaType === 'tv' || item.mediaType === 'anime') ? 'tv' : 'movie';
        var tmdbId = item.id;
        var providers = CONFIG.EMBED.PROVIDERS;
        var serverBar = document.getElementById('serverBar');
        var self = this;
        var currentIndex = 0;

        var buildServerBar = function(activeIndex) {
            var html = '<span class="server-label">Servidor:</span>';
            providers.forEach(function(p, i) {
                var cls = i === activeIndex ? 'server-chip active' : 'server-chip';
                html += '<button class="' + cls + '" data-server="' + i + '">' + p.name + '</button>';
            });
            return html;
        };

        var showError = function(msg) {
            self.wrapper.innerHTML =
                '<div class="player-error">' +
                '<i class="fas fa-exclamation-triangle"></i>' +
                '<p>' + (msg || 'Servidor indisponivel. Tente outro servidor.') + '</p>' +
                '<button class="btn-secondary" id="playerErrorBack" style="margin-top:15px">' +
                '<i class="fas fa-arrow-left"></i> Voltar</button></div>';
            document.getElementById('playerErrorBack').addEventListener('click', function() { self.close(); });
        };

        var tryProvider = function(index) {
            if (index >= providers.length) {
                serverBar.innerHTML = '';
                showError('Todos os servidores estao fora. Tente novamente mais tarde.');
                return;
            }

            var p = providers[index];
            var url = type === 'tv' ? p.tv(tmdbId, season, episode) : p.movie(tmdbId);

            serverBar.innerHTML = buildServerBar(index);

            var iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.frameBorder = '0';
            iframe.allowFullscreen = true;
            iframe.allow = 'autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
            iframe.className = 'video-iframe';
            iframe.loading = 'eager';
            iframe.style.opacity = '0';
            iframe.style.transition = 'opacity 0.3s';
            iframe.onload = function() {
                this.style.opacity = '1';
            };

            self.wrapper.innerHTML = '';
            self.wrapper.appendChild(iframe);

            serverBar.querySelectorAll('.server-chip').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var idx = parseInt(btn.getAttribute('data-server'));
                    self._switchServer(idx);
                });
            });

            currentIndex = index;
            self._currentProviders = providers;
            self._currentIndex = index;
            self._currentType = type;
            self._currentTmdbId = tmdbId;
            self._currentSeason = season;
            self._currentEpisode = episode;
        };

        tryProvider(0);
    }

    _switchServer(index) {
        if (!this._currentProviders || index < 0 || index >= this._currentProviders.length) return;

        var p = this._currentProviders[index];
        var url = this._currentType === 'tv'
            ? p.tv(this._currentTmdbId, this._currentSeason, this._currentEpisode)
            : p.movie(this._currentTmdbId);

        this._currentIndex = index;
        var iframe = this.wrapper.querySelector('iframe');
        if (iframe) iframe.src = url;

        var serverBar = document.getElementById('serverBar');
        serverBar.querySelectorAll('.server-chip').forEach(function(chip, i) {
            chip.classList.toggle('active', i === index);
        });
    }

    openLiveTV(channel) {
        this.titleEl.textContent = channel.title;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        var serverBar = document.getElementById('serverBar');
        serverBar.innerHTML = '<span class="server-label">TV Ao Vivo</span>';
        var self = this;

        if (channel.streamUrl && channel.streamUrl.includes('.m3u8')) {
            this.wrapper.innerHTML = '<video id="liveVideo" class="video-iframe" controls autoplay muted></video>';
            var video = document.getElementById('liveVideo');
            if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                var hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(channel.streamUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, function() { video.play().catch(function(){}); });
                hls.on(Hls.Events.ERROR, function(_, data) {
                    if (data.fatal) {
                        self.wrapper.innerHTML =
                            '<div class="player-error"><i class="fas fa-tv"></i><p>Stream indisponivel</p></div>';
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = channel.streamUrl;
                video.play().catch(function(){});
            } else {
                this.wrapper.innerHTML =
                    '<div class="player-error"><i class="fas fa-tv"></i><p>Seu navegador nao suporta HLS</p></div>';
            }
        } else if (channel.streamUrl) {
            this.wrapper.innerHTML = '';
            var iframe = document.createElement('iframe');
            iframe.src = channel.streamUrl;
            iframe.frameBorder = '0';
            iframe.allowFullscreen = true;
            iframe.allow = 'autoplay; encrypted-media';
            iframe.className = 'video-iframe';
            this.wrapper.appendChild(iframe);
        } else {
            this.wrapper.innerHTML =
                '<div class="player-error"><i class="fas fa-tv"></i><p>Stream nao disponivel</p></div>';
        }
    }
}

var player = new VideoPlayer();
