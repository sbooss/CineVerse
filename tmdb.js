class TMDBAPI {
    constructor() {
        this.proxyBase = '/api/tmdb';
        this.imgURL = 'https://image.tmdb.org/t/p/';
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000;
        this.fallbackData = this.generateFallback();
    }

    generateFallback() {
        return {
            movies: [
                {id:550,title:'Clube da Luta',overview:'Um homem deprimido que sofre de insônia conhece um estranho vendedor de sabonetes chamado Tyler Durden. Eles formam um c',poster_path:'/mCICnh7QBH0gzYaTQChBDDVIKdm.jpg',backdrop_path:'/c6OLXfKAk5BKeR6broC8pYiCquX.jpg',vote_average:8.437,release_date:'1999-10-15',genre_ids:[18,53],original_language:'en'},
                {id:680,title:'Pulp Fiction: Tempo de Violência',overview:'Vincent Vega e Jules Winnfield são dois assassinos profissionais que trabalham fazendo cobranças para Marsellus Wallace,',poster_path:'/tptjnB2LDbuUWya9Cx5sQtv5hqb.jpg',backdrop_path:'/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',vote_average:8.5,release_date:'1994-09-10',genre_ids:[53,80,35],original_language:'en'},
                {id:238,title:'O Poderoso Chefão',overview:'Em 1945, Don Corleone é o chefe de uma mafiosa família italiana de Nova York. Ele costuma apadrinhar várias pessoas, rea',poster_path:'/wOMxE93W6KcZTuCeNUByNTSaLLt.jpg',backdrop_path:'/tSPT36ZKlP2WVHJLM4cQPLSzv3b.jpg',vote_average:8.687,release_date:'1972-03-14',genre_ids:[18,80],original_language:'en'},
                {id:27205,title:'A Origem',overview:'Cobb é um ladrão habilidoso que comete espionagem corporativa infiltrando-se no subconsciente de seus alvos durante o es',poster_path:'/9e3Dz7aCANy5aRUQF745IlNloJ1.jpg',backdrop_path:'/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',vote_average:8.373,release_date:'2010-07-15',genre_ids:[28,878,12],original_language:'en'},
                {id:155,title:'Batman: O Cavaleiro das Trevas',overview:'Após dois anos desde o surgimento do Batman, os criminosos de Gotham City têm muito o que temer. Com a ajuda do tenente ,',poster_path:'/4lj1ikfsSmMZNyfdi8R8Tv5tsgb.jpg',backdrop_path:'/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg',vote_average:8.535,release_date:'2008-07-16',genre_ids:[28,53,80],original_language:'en'},
                {id:597,title:'Titanic',overview:'Um artista pobre e uma jovem rica se conhecem e se apaixonam na fatídica jornada do Titanic, em 1912. Embora esteja noiv',poster_path:'/As0zX43h3w6kD2NS4uVHu9HKdEh.jpg',backdrop_path:'/xXCuto8YVp5RFqBJ7yKmVmLOWpF.jpg',vote_average:7.9,release_date:'1997-12-18',genre_ids:[18,10749],original_language:'en'},
                {id:299536,title:'Vingadores: Guerra Infinita',overview:'Homem de Ferro, Thor, Hulk e os Vingadores se unem para combater seu inimigo mais poderoso, o maligno Thanos. Em uma mis',poster_path:'/A4kvp7vY1BDLrrQIagRCffLKj1t.jpg',backdrop_path:'/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg',vote_average:8.243,release_date:'2018-04-25',genre_ids:[12,28,878],original_language:'en'},
                {id:24428,title:'Os Vingadores: The Avengers',overview:'Loki, o irmão de Thor, ganha acesso ao poder ilimitado do cubo cósmico ao roubá-lo de dentro das instalações da S.H.I.E.',poster_path:'/PtSapjHdDjlVcsqdEo0u7rDE6i.jpg',backdrop_path:'/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg',vote_average:8.077,release_date:'2012-04-25',genre_ids:[878,28,12],original_language:'en'},
                {id:120,title:'O Senhor dos Anéis: A Sociedade do Anel',overview:'Após herdar um anel de seu tio, o hobbit Frodo participa da missão de salvar a Terra-Média do perverso Sauron. Ele preci',poster_path:'/tlvsNCwWEIgwAM23aNzTmMIcPEZ.jpg',backdrop_path:'/oiwc338EoBgS4sEI2ixAny4KQKg.jpg',vote_average:8.445,release_date:'2001-12-18',genre_ids:[12,14,28],original_language:'en'},
                {id:13,title:'Forrest Gump: O Contador de Histórias',overview:'Quarenta anos da história dos Estados Unidos, vistos pelos olhos de Forrest Gump, um rapaz com QI abaixo da média e com ',poster_path:'/d74WpIsH8379TIL4wUxDneRCYv2.jpg',backdrop_path:'/66Kn4XWhkuPkJxOJyPEx4U2CUfN.jpg',vote_average:8.461,release_date:'1994-06-23',genre_ids:[35,18,10749],original_language:'en'},
                {id:603,title:'Matrix',overview:'O jovem programador Thomas Anderson é atormentado por estranhos pesadelos em que está sempre conectado por cabos a um im',poster_path:'/lDqMDI3xpbB9UQRyeXfei0MXhqb.jpg',backdrop_path:'/lrtSb1skJayPydZk0OSMAKjBOVe.jpg',vote_average:8.258,release_date:'1999-03-31',genre_ids:[28,878],original_language:'en'},
                {id:122,title:'O Senhor dos Anéis: O Retorno do Rei',overview:'O confronto final entre as forças do bem e do mal que lutam pelo controle do futuro da Terra-Média se aproxima. Sauron p',poster_path:'/rU4oIKv5I4C59DpcXKmT7kNwGI0.jpg',backdrop_path:'/ctiw6FZK4N36LmkjSklWEbuvlq9.jpg',vote_average:8.506,release_date:'2003-12-17',genre_ids:[12,14,28],original_language:'en'},
                {id:11,title:'Guerra nas Estrelas',overview:'A princesa Leia é mantida refém pelas forças imperiais comandadas por Darth Vader. Luke Skywalker e Han Solo precisam li',poster_path:'/dw7X9YPjjAfIxKHW04V64Bb9TB0.jpg',backdrop_path:'/zqkmTXzjkAgXmEWLRsY4UpTWCeo.jpg',vote_average:8.2,release_date:'1977-05-25',genre_ids:[12,28,878],original_language:'en'},
                {id:78,title:'Blade Runner: O Caçador de Andróides',overview:'No início do século 21, uma grande corporação desenvolve um robô que é mais forte e ágil que o ser humano e se equiparan',poster_path:'/y5ibL0vFnzsRiIHosw0WOfHtIj1.jpg',backdrop_path:'/2spEHYDcyE9r9mS7AFEscfKVDzO.jpg',vote_average:7.936,release_date:'1982-06-25',genre_ids:[878,18,53],original_language:'en'},
                {id:389,title:'12 Homens e uma Sentença',overview:'Um jovem porto-riquenho é acusado do brutal crime de ter matado o próprio pai. Quando ele vai a julgamento, doze jurados',poster_path:'/aiHIhV8c45FzIlbqYlswrrNyQD6.jpg',backdrop_path:'/qqHQsStV6exghCM7zbObuYBiYxw.jpg',vote_average:8.571,release_date:'1957-04-10',genre_ids:[18],original_language:'en'}
            ],
            tv: [
                {id:1396,title:'Breaking Bad',overview:'Ao saber que tem câncer, um professor passa a fabricar metanfetamina pelo futuro da família, mudando o destino de todos.',poster_path:'/hGwm9Cj3CdbJIqQWNExQqiYmCd4.jpg',backdrop_path:'/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',vote_average:8.951,first_air_date:'2008-01-20',genre_ids:[18,80],number_of_seasons:5,number_of_episodes:62,original_language:'en'},
                {id:1399,title:'Game of Thrones',overview:'Em uma terra onde os verões podem durar vários anos e o inverno toda uma vida, sete nobres famílias lutam pelo controle ',poster_path:'/aqomTRKjNZkmNEeOZnEmWrFTmKU.jpg',backdrop_path:'/zZqpAXxVSBtxV9qPBcscfXBcL2w.jpg',vote_average:8.5,first_air_date:'2011-04-17',genre_ids:[10765,18,10759],number_of_seasons:8,number_of_episodes:73,original_language:'en'},
                {id:66732,title:'Stranger Things',overview:'Quando um garoto desaparece, a cidade toda participa nas buscas. Mas o que encontram são segredos, forças sobrenaturais ',poster_path:'/twfKp60THrcOIep9sjHODOOfO8d.jpg',backdrop_path:'/9P4IIMYY3HifqeruZq0ZZ9g7YUi.jpg',vote_average:8.55,first_air_date:'2016-07-15',genre_ids:[10759,9648,10765],number_of_seasons:5,number_of_episodes:42,original_language:'en'},
                {id:93405,title:'Round 6',overview:'Centenas de jogadores falidos aceitam um estranho convite para um jogo de sobrevivência. Um prêmio milionário aguarda, m',poster_path:'/6gcHdboppvplmBWxvROc96NJnmm.jpg',backdrop_path:'/2meX1nMdScFOoV4370rqHWKmXhY.jpg',vote_average:7.854,first_air_date:'2021-09-17',genre_ids:[10759,9648,18],number_of_seasons:3,number_of_episodes:22,original_language:'ko'},
                {id:76479,title:'The Boys',overview:'Na trama, conhecemos um mundo em que super-heróis são as maiores celebridades do planeta, e rotineiramente abusam dos se',poster_path:'/in1R2dDc421JxsoRWaIIAqVI2KE.jpg',backdrop_path:'/bq28ajZaoMyzEIm6REelqyqtEDZ.jpg',vote_average:8.431,first_air_date:'2019-07-25',genre_ids:[10765,10759],number_of_seasons:5,number_of_episodes:40,original_language:'en'},
                {id:95557,title:'INVENCÍVEL',overview:'Uma animação de super-heróis para adultos e conta a história de Mark Grayson, de 17 anos, um cara como qualquer outro de',poster_path:'/qhb7RWU9ad9a5m3HbeRRXzjaMXf.jpg',backdrop_path:'/9qrroces8C6R9aKr08hACNPVXdZ.jpg',vote_average:8.628,first_air_date:'2021-03-25',genre_ids:[16,18,10765,10759],number_of_seasons:5,number_of_episodes:32,original_language:'en'},
                {id:82856,title:'The Mandalorian',overview:'A saga de um guerreiro solitário, que também é um mercenário e pistoleiro, viajando pelos territórios esquecidos e margi',poster_path:'/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg',backdrop_path:'/9zcbqSxdsRMZWHYtyCd1nXPr2xq.jpg',vote_average:8.402,first_air_date:'2019-11-12',genre_ids:[10765,10759],number_of_seasons:3,number_of_episodes:24,original_language:'en'},
                {id:124364,title:'Origem',overview:'Desvende o mistério de uma cidade no centro dos EUA. Enquanto os moradores lutam para manter um senso de normalidade, el',poster_path:'/eK9ZDIq7gPFRJ0GGaWvgrXLZgXX.jpg',backdrop_path:'/m7eiSGHFzr584zFmetGqkqaU6BN.jpg',vote_average:8.488,first_air_date:'2022-02-20',genre_ids:[9648,18,10765],number_of_seasons:4,number_of_episodes:40,original_language:'en'},
                {id:37854,title:'One Piece',overview:'Houve um homem que conquistou tudo aquilo que o mundo tinha a oferecer, o lendário Rei dos Piratas, Gold Roger. Capturad',poster_path:'/9ltisibeD4gzqjM1AzmQwCdyirQ.jpg',backdrop_path:'/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg',vote_average:8.749,first_air_date:'1999-10-20',genre_ids:[10759,35,16],number_of_seasons:23,number_of_episodes:1181,original_language:'ja'},
                {id:71790,title:'S.W.A.T.: Força de Intervenção',overview:'Dividido entre a corporação e as ruas, o tenente Daniel Harrelson encara a missão de liderar uma unidade do Esquadrão de',poster_path:'/byFarhK0Wxmf9mSOOR9ZQ31sShJ.jpg',backdrop_path:'/7j4ug9B6JXVeh5HhQjjPScrdj4Z.jpg',vote_average:8.029,first_air_date:'2017-11-02',genre_ids:[80,10759,18],number_of_seasons:8,number_of_episodes:163,original_language:'en'}
            ]
        };
    }

    async fetchAPI(endpoint, params = {}) {
        const cacheKey = endpoint + JSON.stringify(params);
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.time < this.cacheTimeout) return cached.data;
        if (this.cache.size > 150) {
            var oldest = this.cache.keys().next().value;
            this.cache.delete(oldest);
        }

        var path = endpoint.replace(/^\//, '');
        var url = new URL(this.proxyBase, window.location.origin);
        url.searchParams.set('path', path);
        url.searchParams.set('language', 'pt-BR');
        url.searchParams.set('include_adult', 'false');
        Object.entries(params).forEach(function(pair) { url.searchParams.set(pair[0], pair[1]); });

        try {
            var controller = new AbortController();
            var timeout = setTimeout(function() { controller.abort(); }, 15000);
            var response = await fetch(url.toString(), { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) throw new Error('TMDB ' + response.status);
            var data = await response.json();
            this.cache.set(cacheKey, { data: data, time: Date.now() });
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

    async getTrending(type = 'all', timeWindow = 'week') {
        const r = await this.fetchAPI('/trending/' + type + '/' + timeWindow);
        return (r && r.results) ? r.results.filter(i => !i.adult).map(i => this.formatItem(i, i.media_type)) : null;
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
        const r = await this.fetchAPI('/search/multi', { query: query, page: page, include_adult: false });
        if (!r || !r.results) return [];
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
