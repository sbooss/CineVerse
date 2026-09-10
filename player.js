class VideoPlayer {
    constructor() {
        this.overlay = document.getElementById('playerOverlay');
        this.wrapper = document.getElementById('playerWrapper');
        this.titleEl = document.getElementById('playerTitle');
        this.backBtn = document.getElementById('playerBack');
        this.history = [];
        this.backBtn.addEventListener('click', () => this.close());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });
        this._setupPopupBlocker();
    }

    _setupPopupBlocker() {
        const origOpen = window.open;
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

    async open(item, season = 1, episode = 1) {
        this.history.push({ item, season, episode });
        this.titleEl.textContent = item.title;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this._loadEmbed(item, season, episode);
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.wrapper.innerHTML = '';
        if (this.history.length > 0) this.history.pop();
    }

    _loadEmbed(item, season, episode) {
        const type = (item.mediaType === 'tv' || item.mediaType === 'anime') ? 'tv' : 'movie';
        const tmdbId = item.id;

        const providers = this._getProviders(tmdbId, type, season, episode);
        let currentIndex = 0;

        const tryProvider = (index) => {
            if (index >= providers.length) {
                this.wrapper.innerHTML = `
                    <div class="player-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Nenhum server disponivel</p>
                        <button class="btn-secondary" onclick="player.close()" style="margin-top:15px">
                            <i class="fas fa-arrow-left"></i> Voltar
                        </button>
                    </div>`;
                return;
            }

            const p = providers[index];
            this.wrapper.innerHTML = `
                <div class="provider-selector">
                    <span class="current-provider">${p.name}</span>
                    <button class="change-provider-btn" onclick="player.showServers()">
                        <i class="fas fa-exchange-alt"></i> Trocar Server
                    </button>
                </div>
                <iframe 
                    src="${p.url}" 
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
        };

        this._nextProvider = () => {
            tryProvider(currentIndex + 1);
            currentIndex++;
        };

        this._nextProvider = this._nextProvider.bind(this);
        tryProvider(0);
    }

    _getProviders(tmdbId, type, season, episode) {
        const tvPath = type === 'tv' ? `/tv/${tmdbId}/${season}/${episode}` : `/movie/${tmdbId}`;
        return [
            { name: 'Server 1 - VidLink', url: `https://vidlink.pro${tvPath}` },
            { name: 'Server 2 - VidFast', url: `https://vidfast.vc${tvPath}` },
            { name: 'Server 3 - Embed.su', url: `https://www.embed.su/embed${tvPath}` },
            { name: 'Server 4 - VidSrc', url: `https://vidsrc.to/embed${tvPath}` },
            { name: 'Server 5 - 2Embed', url: `https://www.2embed.cc/embed${tvPath}` },
            { name: 'Server 6 - SuperEmbed', url: type === 'tv'
                ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`
                : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1` },
            { name: 'Server 7 - VidCore', url: `https://vidcore.org/embed${tvPath}` },
            { name: 'Server 8 - WFS', url: `https://embed.wfs.lol${tvPath}` },
            { name: 'Server 9 - TouStream', url: `https://toustream.xyz/embed${tvPath}` },
            { name: 'Server 10 - VidSrc.me', url: `https://vidsrcme.ru/embed${tvPath}` }
        ];
    }

    showServers() {
        if (!this._currentProviders) return;
        let html = '<div class="provider-list"><h3>Escolha o Server</h3><div class="provider-grid">';
        this._currentProviders.forEach((p, i) => {
            html += `<button class="provider-btn ${i === this._currentIndex ? 'active' : ''}" onclick="player._switchServer(${i})">${p.name.replace(/Server \d+ - /, '')}</button>`;
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
        this._currentIndex = index;
        const iframe = this.wrapper.querySelector('iframe');
        if (iframe) {
            iframe.src = p.url;
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
                <video id="liveVideo" class="video-iframe" controls autoplay></video>`;
            const video = document.getElementById('liveVideo');
            if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(channel.streamUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
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
