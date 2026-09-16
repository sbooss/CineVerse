class TMDBAPI {
    constructor() {
        this.apiKey = 'eb9690431d1dd3d86de35def2b1b0a2c';
        this.baseURL = 'https://api.themoviedb.org/3';
        this.imgURL = 'https://image.tmdb.org/t/p/';
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000;
        this.fallbackData = this.generateFallback();
    }

    generateFallback() {
        return {
            movies: [
                {id:550,title:'Fight Club',overview:'Um homem insatisfeito com sua vida civil forma um clube de luta ilegal.',poster_path:'/pB8BM7pdSp6B6Ih7QI4S2t0POoT.jpg',backdrop_path:'/hZkgoQYus5dXo3H8T7Uef6DNknx.jpg',vote_average:8.4,release_date:'1999-10-15',genre_ids:[18],original_language:'en'},
                {id:680,title:'Pulp Fiction',overview:'Historias entrelacadas de crime em Los Angeles.',poster_path:'/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',backdrop_path:'/suaEOwWZPRob87nPBO0L1KPJtpd.jpg',vote_average:8.5,release_date:'1994-09-10',genre_ids:[53,80],original_language:'en'},
                {id:238,title:'O Poderoso Chefao',overview:'A saga da familia mafiosa Corleone.',poster_path:'/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',backdrop_path:'/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',vote_average:8.7,release_date:'1972-03-14',genre_ids:[18,80],original_language:'en'},
                {id:27205,title:'Inception',overview:'Um ladrao que rouba segredos via sonhos recebe uma tarefa impossivel.',poster_path:'/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',backdrop_path:'/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',vote_average:8.4,release_date:'2010-07-15',genre_ids:[28,878],original_language:'en'},
                {id:155,title:'O Dark Knight',overview:'Batman enfrenta o Coringa, um criminoso caotico.',poster_path:'/qJ2tW6WMUDux911BTUgMe1nDAt.jpg',backdrop_path:'/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg',vote_average:9.0,release_date:'2008-07-16',genre_ids:[28,80],original_language:'en'},
                {id:597,title:'Titanic',overview:'Uma historia de amor a bordo do navio fatidico.',poster_path:'/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',backdrop_path:'/kHXEpyfl6zqn8a6YuLZzyYW7tBr.jpg',vote_average:7.9,release_date:'1997-11-18',genre_ids:[10749,18],original_language:'en'},
                {id:299536,title:'Vingadores: Guerra Infinita',overview:'Os Vingadores enfrentam Thanos.',poster_path:'/7WsyChQLEftFiDhRDUMSjMcQRNB.jpg',backdrop_path:'/bOGkgRGdhrBYJSLpXaxhXVsttdV.jpg',vote_average:8.3,release_date:'2018-04-25',genre_ids:[28,12],original_language:'en'},
                {id:24428,title:'Os Vingadores',overview:'Heroinis se unem para salvar a Terra.',poster_path:'/cezWGsk5R9t3I42LZLKcxaEAusP.jpg',backdrop_path:'/hQ4pYsIbP22TWXqX7sF0hJUvfoq.jpg',vote_average:8.0,release_date:'2012-04-25',genre_ids:[28,878],original_language:'en'},
                {id:120,title:'O Senhor dos Aneis: O Retorno do Rei',overview:'A batalha final pela Terra Media.',poster_path:'/rCzpDGLbOoPwLjy6yGJdRBBBMwf.jpg',backdrop_path:'/pm0RiwNpS386bU3ReQ4a7XfEp1b.jpg',vote_average:8.5,release_date:'2003-12-01',genre_ids:[12,14],original_language:'en'},
                {id:13,title:'Forrest Gump',overview:'A vida extraordinaria de um homem simples.',poster_path:'/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',backdrop_path:'/3h1JZGDhZ8nzxdgvkxha0qBgiyz.jpg',vote_average:8.6,release_date:'1994-06-23',genre_ids:[35,18],original_language:'en'},
                {id:603,title:'Matrix',overview:'Um hacker descobre a realidade e uma guerra digital.',poster_path:'/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',backdrop_path:'/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',vote_average:8.7,release_date:'1999-03-30',genre_ids:[28,878],original_language:'en'},
                {id:122,title:'O Senhor dos Aneis: As Duas Torres',overview:'A guerra continua na Terra Media.',poster_path:'/5VTN0pCa8LySDIq6Z62cI22ln1t.jpg',backdrop_path:'/5CGomQ5x8gLFiKzMPplau2MklhR.jpg',vote_average:8.5,release_date:'2002-12-18',genre_ids:[12,14],original_language:'en'},
                {id:11,title:'Star Wars: Episodio IV',overview:'Um granjero se torna um heroi galactico.',poster_path:'/btbRB7BrD78Wq8U9kM1MbrXALIl.jpg',backdrop_path:'/4LrmnG8y1hFJz6E7GEl1LyZ6L2R.jpg',vote_average:8.2,release_date:'1977-05-25',genre_ids:[12,28],original_language:'en'},
                {id:78,title:'Blade Runner',overview:'Um caçador de androides questiona sua humanidade.',poster_path:'/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',backdrop_path:'/zb6fStNCVVV0WvfWiGmwSvLkSqx.jpg',vote_average:8.1,release_date:'1982-06-25',genre_ids:[28,878],original_language:'en'},
                {id:389,title:'O Padrinho II',overview:'A continuacao da saga Corleone.',poster_path:'/HEk9Q0r3Q9zR4JbqUHd8eEY0Yg.jpg',backdrop_path:'/sH2VFsfPJv283IU9YzMFf2gCxvL.jpg',vote_average:8.6,release_date:'1974-12-20',genre_ids:[18,80],original_language:'en'}
            ],
            tv: [
                {id:1396,name:'Breaking Bad',overview:'Um professor de quimica se torna fabricante de metanfetamina.',poster_path:'/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',backdrop_path:'/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',vote_average:8.9,first_air_date:'2008-01-20',genre_ids:[18],number_of_seasons:5,number_of_episodes:62,original_language:'en'},
                {id:1399,name:'Game of Thrones',overview:'Nove familias nobres lutam pelo controle de Westeros.',poster_path:'/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',backdrop_path:'/suopoADq0k8YZr4dQXcU6pToj6s.jpg',vote_average:8.4,first_air_date:'2011-04-17',genre_ids:[10765,18],number_of_seasons:8,number_of_episodes:73,original_language:'en'},
                {id:66732,name:'Stranger Things',overview:'Crianças enfrentam monstros sobrenaturais nos anos 80.',poster_path:'/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',backdrop_path:'/56v2KjBlYj5GwIlSf8bnJP1GEUw.jpg',vote_average:8.6,first_air_date:'2016-07-15',genre_ids:[18,10765],number_of_seasons:4,number_of_episodes:34,original_language:'en'},
                {id:114461,name:'The Last of Us',overview:'Pos-apocalipse onde humanos foram devastados por um fungo.',poster_path:'/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',backdrop_path:'/lGiRj7gSJRkGOFOKHs3I3rO1Wq7.jpg',vote_average:8.8,first_air_date:'2023-01-15',genre_ids:[18,10765],number_of_seasons:2,number_of_episodes:18,original_language:'en'},
                {id:93405,name:'Squid Game',overview:'Concorrentes arriscam a vida em jogos mortais.',poster_path:'/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',backdrop_path:'/oaGvjB0DvdhXhOAuADfHb261ZHa.jpg',vote_average:7.8,first_air_date:'2021-09-17',genre_ids:[10765,9648],number_of_seasons:2,number_of_episodes:16,original_language:'ko'},
                {id:71790,name:'Rick and Morty',overview:'Aventuras interdimensionais de um cientista e seu neto.',poster_path:'/cvhMj9MZqPPFGbVU78f1hLFBONz.jpg',backdrop_path:'/iAx7FXXxY8m9HEsCR0FhLfV0zL.jpg',vote_average:8.7,first_air_date:'2013-12-02',genre_ids:[16,35],number_of_seasons:7,number_of_episodes:71,original_language:'en'},
                {id:82856,name:'The Mandalorian',overview:'Um caçador de recompensas viaja pela galaxia.',poster_path:'/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg',backdrop_path:'/o094Yj9aQY2zPKN0bE6BIPuVmCE.jpg',vote_average:8.5,first_air_date:'2019-11-12',genre_ids:[10765,10759],number_of_seasons:3,number_of_episodes:24,original_language:'en'},
                {id:76479,name:'The Witcher',overview:'Geralt de Rivia caça monstros em um mundo perigoso.',poster_path:'/7vjaCdMw15FEbXyLQTVa04URsPm.jpg',backdrop_path:'/jBJWaqoSCiARWtfV0GlqHrcdiJq.jpg',vote_average:8.2,first_air_date:'2019-12-20',genre_ids:[10765,10759],number_of_seasons:3,number_of_episodes:24,original_language:'en'},
                {id:95557,name:'Invincible',overview:'Um jovem descobre que seu pai e o super-heroi mais poderoso.',poster_path:'/yGchBUrrsKrpUVPK4FhJbNsJfwh.jpg',backdrop_path:'/iSfXkF2O5rE7R7j2WN944UqoIfO.jpg',vote_average:8.7,first_air_date:'2021-03-25',genre_ids:[16,10759],number_of_seasons:3,number_of_episodes:24,original_language:'en'},
                {id:124364,name:'One Piece',overview:'Luffy e sua tripulacao buscam o One Piece.',poster_path:'/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg',backdrop_path:'/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg',vote_average:8.7,first_air_date:'1999-10-20',genre_ids:[10759,35],number_of_seasons:21,number_of_episodes:1100,original_language:'ja'}
            ]
        };
    }

    async fetchAPI(endpoint, params = {}) {
        const cacheKey = endpoint + JSON.stringify(params);
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.time < this.cacheTimeout) return cached.data;

        const url = new URL(this.baseURL + endpoint);
        url.searchParams.set('api_key', this.apiKey);
        url.searchParams.set('language', 'pt-BR');
        url.searchParams.set('include_adult', 'false');
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(url.toString(), { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) throw new Error(`TMDB ${response.status}`);
            const data = await response.json();
            this.cache.set(cacheKey, { data, time: Date.now() });
            return data;
        } catch (error) {
            console.warn('TMDB fetch failed:', endpoint, error.message);
            return null;
        }
    }

    getPoster(path) {
        return path ? `${this.imgURL}w500${path}` : null;
    }

    getBackdrop(path) {
        return path ? `${this.imgURL}w1280${path}` : null;
    }

    formatItem(item, mediaType) {
        return {
            id: item.id,
            title: item.title || item.name,
            overview: item.overview || 'Sinopse nao disponivel.',
            poster: this.getPoster(item.poster_path),
            backdrop: this.getBackdrop(item.backdrop_path),
            releaseDate: item.release_date || item.first_air_date,
            rating: item.vote_average || 0,
            genreIds: item.genre_ids || (item.genres ? item.genres.map(function(g){return g.id}) : []),
            mediaType: mediaType || item.media_type || 'movie',
            seasons: item.number_of_seasons || 0,
            episodes: item.number_of_episodes || 0,
            runtime: item.runtime || 0,
            imdbId: (item.external_ids && item.external_ids.imdb_id) || null,
            originalLanguage: item.original_language || 'en'
        };
    }

    async getTrending(type = 'all', window = 'week') {
        const r = await this.fetchAPI(`/trending/${type}/${window}`);
        return (r && r.results) ? r.results.filter(function(i){return !i.adult}).map(function(i){return _this.formatItem(i, i.media_type)}) : null;
    }

    async getPopular(type = 'movie', page = 1) {
        const r = await this.fetchAPI(`/${type}/popular`, { page });
        return r && r.results ? r.results.filter(i => !i.adult).map(i => this.formatItem(i, type)) : null;
    }

    async getTopRated(type = 'movie', page = 1) {
        const r = await this.fetchAPI(`/${type}/top_rated`, { page });
        return r && r.results ? r.results.filter(i => !i.adult).map(i => this.formatItem(i, type)) : null;
    }

    async getNowPlaying(page = 1) {
        const r = await this.fetchAPI('/movie/now_playing', { page });
        return r && r.results ? r.results.filter(i => !i.adult).map(i => this.formatItem(i, 'movie')) : null;
    }

    async getUpcoming(page = 1) {
        const r = await this.fetchAPI('/movie/upcoming', { page });
        return r && r.results ? r.results.filter(i => !i.adult).map(i => this.formatItem(i, 'movie')) : null;
    }

    async getAiringToday(page = 1) {
        const r = await this.fetchAPI('/tv/airing_today', { page });
        return r && r.results ? r.results.map(i => this.formatItem(i, 'tv')) : null;
    }

    async getOnTheAir(page = 1) {
        const r = await this.fetchAPI('/tv/on_the_air', { page });
        return r && r.results ? r.results.map(i => this.formatItem(i, 'tv')) : null;
    }

    async getByGenre(type, genreId, page = 1) {
        const r = await this.fetchAPI(`/discover/${type}`, { with_genres: genreId, page, sort_by: 'popularity.desc' });
        return r && r.results ? r.results.filter(i => !i.adult).map(i => this.formatItem(i, type)) : null;
    }

    async getAnime(page = 1) {
        const r = await this.fetchAPI('/discover/tv', { with_genres: 16, sort_by: 'popularity.desc', page, 'vote_count.gte': 20 });
        return r && r.results ? r.results.map(i => this.formatItem(i, 'anime')) : null;
    }

    async getDetails(type, id) {
        return this.fetchAPI(`/${type}/${id}`, { append_to_response: 'videos,credits,similar,external_ids' });
    }

    async getSeasonDetails(tvId, season) {
        return this.fetchAPI(`/tv/${tvId}/season/${season}`);
    }

    async search(query, page = 1) {
        const r = await this.fetchAPI('/search/multi', { query, page, include_adult: false });
        if (!r && r.results) return [];
        return r.results.filter(i => (i.media_type === 'movie' || i.media_type === 'tv') && !i.adult).map(i => this.formatItem(i, i.media_type));
    }

    async getHeroContent() {
        const trending = await this.getTrending('movie', 'week');
        if (!trending || trending.length === 0) {
            const fb = this.fallbackData.movies[0];
            return { ...this.formatItem(fb, 'movie'), cast: [], runtime: 0, imdbId: null };
        }
        const heroItem = trending[Math.floor(Math.random() * Math.min(5, trending.length))];
        try {
            const d = await this.getDetails(heroItem.mediaType, heroItem.id);
            if (d) {
                                var trailer = d && d.videos && d.videos.results ? d.videos.results.filter(function(v){return v.type === 'Trailer' && v.site === 'YouTube'})[0] : null;
                return {
                    ...this.formatItem(d, heroItem.mediaType),
                    trailer: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
                    cast: (d.credits && d.credits.cast) ? d.credits.cast.slice(0, 5).map(function(c){return c.name}) : [],
                    runtime: d.runtime || 0,
                    imdbId: (d.external_ids && d.external_ids.imdb_id) || null,
                    seasons: d.number_of_seasons || 0,
                    episodes: d.number_of_episodes || 0
                };
            }
        } catch (e) {}
        return heroItem;
    }

    fallbackList(type) {
        const key = type === 'movie' ? 'movies' : 'tv';
        const items = [...this.fallbackData[key]];
        items.sort(() => Math.random() - 0.5);
        return items.map(i => this.formatItem(i, type));
    }

    async getMoviesByCategory(cat, page = 1) {
        let items;
        switch (cat) {
            case 'popular': items = await this.getPopular('movie', page); break;
            case 'top_rated': items = await this.getTopRated('movie', page); break;
            case 'now_playing': items = await this.getNowPlaying(page); break;
            case 'upcoming': items = await this.getUpcoming(page); break;
            case 'action': items = await this.getByGenre('movie', 28, page); break;
            case 'comedy': items = await this.getByGenre('movie', 35, page); break;
            case 'horror': items = await this.getByGenre('movie', 27, page); break;
            case 'scifi': items = await this.getByGenre('movie', 878, page); break;
            case 'drama': items = await this.getByGenre('movie', 18, page); break;
            case 'thriller': items = await this.getByGenre('movie', 53, page); break;
            case 'romance': items = await this.getByGenre('movie', 10749, page); break;
            case 'adventure': items = await this.getByGenre('movie', 12, page); break;
            case 'animation': items = await this.getByGenre('movie', 16, page); break;
            case 'crime': items = await this.getByGenre('movie', 80, page); break;
            case 'family': items = await this.getByGenre('movie', 10751, page); break;
            case 'fantasy': items = await this.getByGenre('movie', 14, page); break;
            case 'history': items = await this.getByGenre('movie', 36, page); break;
            case 'music': items = await this.getByGenre('movie', 10402, page); break;
            case 'war': items = await this.getByGenre('movie', 10752, page); break;
            case 'western': items = await this.getByGenre('movie', 37, page); break;
            default: items = await this.getPopular('movie', page);
        }
        return items || this.fallbackList('movie');
    }

    async getTVByCategory(cat, page = 1) {
        let items;
        switch (cat) {
            case 'popular': items = await this.getPopular('tv', page); break;
            case 'top_rated': items = await this.getTopRated('tv', page); break;
            case 'airing_today': items = await this.getAiringToday(page); break;
            case 'on_the_air': items = await this.getOnTheAir(page); break;
            case 'drama': items = await this.getByGenre('tv', 18, page); break;
            case 'comedy': items = await this.getByGenre('tv', 35, page); break;
            case 'animation': items = await this.getByGenre('tv', 16, page); break;
            case 'scifi': items = await this.getByGenre('tv', 10765, page); break;
            case 'documentary': items = await this.getByGenre('tv', 99, page); break;
            case 'crime': items = await this.getByGenre('tv', 80, page); break;
            case 'reality': items = await this.getByGenre('tv', 10764, page); break;
            default: items = await this.getPopular('tv', page);
        }
        return items || this.fallbackList('tv');
    }

    async getAnimeByCategory(cat, page = 1) {
        const items = await this.getAnime(page);
        return items || this.fallbackList('tv');
    }

    async searchMulti(query) {
        return this.search(query);
    }

    async getSimilar(id, type = 'tv') {
        const r = await this.fetchAPI(`/${type}/${id}/similar`);
        return r && r.results ? r.results.filter(i => !i.adult).map(i => this.formatItem(i, type)) : [];
    }
}

const tmdb = new TMDBAPI();
