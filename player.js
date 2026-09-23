class VideoPlayer {
    constructor() {
        this.overlay = document.getElementById('playerOverlay');
        this.wrapper = document.getElementById('playerWrapper');
        this.titleEl = document.getElementById('playerTitle');
        this.backBtn = document.getElementById('playerBack');
        this.backBtn.addEventListener('click', () => this.close());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                e.stopImmediatePropagation();
                this.close();
            }
        });
        this._popupObserver = null;
        this._messageHandler = null;
        this._auxclickHandler = null;
        this._touchHandler = null;
    }

    _startAntiAds() {
        var self = this;
        if (this._observerActive) return;
        this._observerActive = true;

        this._auxclickHandler = function(e) { e.preventDefault(); return false; };
        this.overlay.addEventListener('auxclick', this._auxclickHandler, true);

        this._touchHandler = function(e) {
            var t = e.target;
            var isUI = t.closest('#playerBack') ||
                       t.closest('#playerBg') ||
                       t.closest('.player-notice') ||
                       t.closest('.server-chip') ||
                       t.closest('.server-bar') ||
                       t.closest('#playerErrorBack') ||
                       t.closest('.player-header') ||
                       t.closest('.player-wrapper');
            if (!isUI) { e.preventDefault(); return false; }
        };
        this.overlay.addEventListener('touchstart', this._touchHandler, { passive: false, capture: true });

        this._beforeUnloadHandler = function(e) {
            if (self.isOpen()) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', this._beforeUnloadHandler);

        this._clickBlockHandler = function(e) {
            var t = e.target;
            if (t && (t.tagName === 'A' || t.closest('a'))) {
                var a = t.tagName === 'A' ? t : t.closest('a');
                var href = a.href || '';
                var adDomains = ['onclickperformance','acscdn','aclib','popads','clickadu','propellerads','adsterra','exoclick','hilltopads','monetag','evadav','richpush','popcash','poptm','al5sm','llvpn'];
                for (var i = 0; i < adDomains.length; i++) {
                    if (href.includes(adDomains[i])) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                }
            }
        };
        this.overlay.addEventListener('click', this._clickBlockHandler, true);

        this._popupObserver = new MutationObserver(function(mutations) {
            for (var m = 0; m < mutations.length; m++) {
                var added = mutations[m].addedNodes;
                for (var i = 0; i < added.length; i++) {
                    var node = added[i];
                    if (node.nodeType !== 1) continue;
                    if (node.tagName === 'IFRAME' && !node.classList.contains('video-iframe')) {
                        node.remove(); continue;
                    }
                    if (node.style && (node.style.position === 'fixed' || node.style.position === 'absolute') &&
                        parseInt(node.style.zIndex || 0) > 9999) {
                        node.remove(); continue;
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('iframe:not(.video-iframe)').forEach(function(f) { f.remove(); });
                        node.querySelectorAll('div[style*="position: fixed"], div[style*="position: absolute"]').forEach(function(f) {
                            if (parseInt(f.style.zIndex || 0) > 9999) f.remove();
                        });
                    }
                }
            }
        });
        this._popupObserver.observe(document.body, { childList: true, subtree: true });

        this._messageHandler = function(e) {
            var d = e.data;
            if (typeof d === 'string') {
                var l = d.toLowerCase();
                if (l.includes('popunder') || l.includes('acscdn') || l.includes('aclib') || l.includes('onclickperformance') || l.includes('popads')) {
                    e.stopImmediatePropagation();
                    return false;
                }
            }
        };
        window.addEventListener('message', this._messageHandler, true);
    }

    _stopAntiAds() {
        this._observerActive = false;
        if (this._popupObserver) { this._popupObserver.disconnect(); this._popupObserver = null; }
        if (this._auxclickHandler) { this.overlay.removeEventListener('auxclick', this._auxclickHandler, true); this._auxclickHandler = null; }
        if (this._touchHandler) { this.overlay.removeEventListener('touchstart', this._touchHandler, true); this._touchHandler = null; }
        if (this._beforeUnloadHandler) { window.removeEventListener('beforeunload', this._beforeUnloadHandler); this._beforeUnloadHandler = null; }
        if (this._clickBlockHandler) { this.overlay.removeEventListener('click', this._clickBlockHandler, true); this._clickBlockHandler = null; }
        if (this._messageHandler) { window.removeEventListener('message', this._messageHandler, true); this._messageHandler = null; }
    }

    isOpen() {
        return this.overlay.classList.contains('active');
    }

    async open(item, season, episode) {
        season = season || 1;
        episode = episode || 1;
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
        this._startAntiAds();
        this._loadEmbed(item, season, episode);
    }

    close() {
        this.overlay.classList.remove('active');
        var detailOpen = document.getElementById('detailPage') && document.getElementById('detailPage').classList.contains('active');
        if (!detailOpen) document.body.style.overflow = '';
        this._stopAntiAds();
        var iframes = this.wrapper.querySelectorAll('iframe');
        iframes.forEach(function(f) { try { f.src = 'about:blank'; f.remove(); } catch(ex) {} });
        this.wrapper.innerHTML = '';
        var serverBar = document.getElementById('serverBar');
        if (serverBar) serverBar.innerHTML = '';
        if (document.fullscreenElement) document.exitFullscreen().catch(function() {});
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
        this._startAntiAds();
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