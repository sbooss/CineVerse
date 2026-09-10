let currentCategory='home',currentFilter='all',favorites=JSON.parse(localStorage.getItem('cineboss_favorites')||'[]');
let currentSeason=1,currentEpisode=1,detailPageItem=null,detailPageSeasonsData=[];

document.addEventListener('DOMContentLoaded',()=>{
    initNavigation();initSearch();initFilters();initDetailPage();loadHomePage();
});

function initNavigation(){
    document.querySelectorAll('.nav-links a').forEach(link=>{
        link.addEventListener('click',e=>{
            e.preventDefault();
            document.querySelectorAll('.nav-links a').forEach(l=>l.classList.remove('active'));
            link.classList.add('active');
            currentCategory=link.dataset.category;
            loadContent(currentCategory);
        });
    });
}

function initSearch(){
    const input=document.getElementById('searchInput');let timeout;
    input.addEventListener('input',e=>{
        clearTimeout(timeout);
        timeout=setTimeout(()=>{
            if(e.target.value.length>2)performSearch(e.target.value);
            else if(currentCategory==='home')loadHomePage();
            else loadContent(currentCategory);
        },400);
    });
    input.addEventListener('keydown',e=>{
        if(e.key==='Enter'&&e.target.value.length>2)performSearch(e.target.value);
    });
}

function initFilters(){
    document.querySelectorAll('.filter-btn').forEach(btn=>{
        btn.addEventListener('click',()=>{
            document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter=btn.dataset.filter;
            const v=document.getElementById('searchInput').value;
            if(v.length>2)performSearch(v);
        });
    });
}

function initDetailPage(){
    document.getElementById('detailBack').addEventListener('click',closeDetailPage);
}

async function loadContent(category){
    if(category==='home'){await loadHomePage();return}
    if(category==='favorites'){loadFavorites();return}
    const main=document.getElementById('mainContent');main.innerHTML='';
    const sections=getCategorySections(category);
    for(const s of sections)main.innerHTML+=createSectionHTML(s.id,s.title,s.icon);
    for(const s of sections)await loadSection(s.id,s.category,s.mediaType,s.isLive);
}

function getCategorySections(cat){
    const map={
        'movie':[
            {id:'fil-popular',title:'Filmes Populares',icon:'fa-fire',category:'popular',mediaType:'movie'},
            {id:'fil-now',title:'Em Cartaz',icon:'fa-ticket-alt',category:'now_playing',mediaType:'movie'},
            {id:'fil-upcoming',title:'Lancamentos',icon:'fa-calendar',category:'upcoming',mediaType:'movie'},
            {id:'fil-top',title:'Melhores Avaliados',icon:'fa-trophy',category:'top_rated',mediaType:'movie'},
            {id:'fil-action',title:'Acao',icon:'fa-fist-raised',category:'action',mediaType:'movie'},
            {id:'fil-comedy',title:'Comedia',icon:'fa-laugh',category:'comedy',mediaType:'movie'},
            {id:'fil-horror',title:'Terror',icon:'fa-ghost',category:'horror',mediaType:'movie'},
            {id:'fil-scifi',title:'Ficcao Cientifica',icon:'fa-rocket',category:'scifi',mediaType:'movie'},
            {id:'fil-drama',title:'Drama',icon:'fa-masks-theater',category:'drama',mediaType:'movie'},
            {id:'fil-thriller',title:'Suspense',icon:'fa-mask',category:'thriller',mediaType:'movie'},
            {id:'fil-romance',title:'Romance',icon:'fa-heart',category:'romance',mediaType:'movie'},
            {id:'fil-animation',title:'Animacao',icon:'fa-hat-wizard',category:'animation',mediaType:'movie'},
            {id:'fil-crime',title:'Crime',icon:'fa-bomb',category:'crime',mediaType:'movie'},
            {id:'fil-family',title:'Familia',icon:'fa-people-roof',category:'family',mediaType:'movie'},
            {id:'fil-fantasy',title:'Fantasia',icon:'fa-wand-sparkles',category:'fantasy',mediaType:'movie'}
        ],
        'tv':[
            {id:'tv-popular',title:'Series Populares',icon:'fa-fire',category:'popular',mediaType:'tv'},
            {id:'tv-airing',title:'No Ar Hoje',icon:'fa-broadcast-tower',category:'airing_today',mediaType:'tv'},
            {id:'tv-top',title:'Melhores Series',icon:'fa-trophy',category:'top_rated',mediaType:'tv'},
            {id:'tv-onair',title:'Em Exibicao',icon:'fa-play-circle',category:'on_the_air',mediaType:'tv'},
            {id:'tv-drama',title:'Drama',icon:'fa-masks-theater',category:'drama',mediaType:'tv'},
            {id:'tv-comedy',title:'Comedia',icon:'fa-laugh',category:'comedy',mediaType:'tv'},
            {id:'tv-scifi',title:'Sci-Fi & Fantasia',icon:'fa-rocket',category:'scifi',mediaType:'tv'},
            {id:'tv-crime',title:'Crime',icon:'fa-bomb',category:'crime',mediaType:'tv'}
        ],
        'anime':[
            {id:'an-popular',title:'Animes Populares',icon:'fa-fire',category:'popular',mediaType:'anime'},
            {id:'an-top',title:'Melhores Animes',icon:'fa-trophy',category:'top_rated',mediaType:'anime'},
            {id:'an-new',title:'Novos Episodios',icon:'fa-clock',category:'on_the_air',mediaType:'anime'}
        ],
        'live':[
            {id:'tv-live-br',title:'Canais Brasileiros',icon:'fa-flag',category:'br',mediaType:'live',isLive:true},
            {id:'tv-live-int',title:'Canais Internacionais',icon:'fa-globe',category:'int',mediaType:'live',isLive:true}
        ]
    };
    return map[cat]||map['home'];
}

function createSectionHTML(id,title,icon){
    return '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas '+icon+'"></i></span>'+title+'</h2></div><div class="movies-row" id="'+id+'"><div class="loading"><div class="loading-spinner"></div></div></div></section>';
}

async function loadSection(sectionId,category,mediaType,isLive){
    const c=document.getElementById(sectionId);if(!c)return;
    try{
        let items;
        if(isLive||mediaType==='live'){
            items=loadLiveChannels(category);
            c.innerHTML=items.map(function(i){return createLiveCard(i)}).join('');
            items.forEach(function(ch,i){var card=c.querySelector('.movie-card:nth-child('+(i+1)+')');if(card)card.addEventListener('click',function(){player.openLiveTV(ch)})});
            return;
        }
        if(mediaType==='anime')items=await tmdb.getAnimeByCategory(category);
        else if(mediaType==='movie')items=await tmdb.getMoviesByCategory(category);
        else if(mediaType==='tv')items=await tmdb.getTVByCategory(category);
        else items=await tmdb.getMoviesByCategory(category);
        if(!items||!items.length){c.innerHTML='<div class="empty-state"><i class="fas fa-film"></i><p>Nenhum conteudo encontrado</p></div>';return}
        c.innerHTML=items.map(function(i){return createCard(i)}).join('');
        var cards=c.querySelectorAll('.movie-card');
        cards.forEach(function(card,idx){
            card.addEventListener('click',function(){handleCardClick(items[idx])});
            setTimeout(function(){card.classList.add('visible')},idx*40);
        });
    }catch(e){console.error('loadSection error:',e);c.innerHTML='<div class="error-message">Erro ao carregar</div>'}
}

async function loadHomePage(){
    const main=document.getElementById('mainContent');
    main.innerHTML='\n'+
        '<section class="hero" id="hero"><div class="hero-bg" id="heroBg"></div>\n'+
        '<div class="hero-content">\n'+
        '<div class="hero-badge"><i class="fas fa-bolt"></i><span>EM ALTA</span></div>\n'+
        '<h1 class="hero-title" id="heroTitle"></h1>\n'+
        '<div class="hero-meta" id="heroMeta"></div>\n'+
        '<p class="hero-desc" id="heroDesc"></p>\n'+
        '<div class="hero-buttons">\n'+
        '<button class="btn-primary" id="heroPlay"><i class="fas fa-play"></i><span>ASSISTIR AGORA</span></button>\n'+
        '<button class="btn-secondary" id="heroInfo"><i class="fas fa-info-circle"></i><span>MAIS INFORMACOES</span></button>\n'+
        '</div></div><div class="hero-gradient"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-fire"></i></span>Em Alta</h2></div><div class="movies-row" id="popular"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-film"></i></span>Filmes Populares</h2></div><div class="movies-row" id="filmesRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-ticket-alt"></i></span>Em Cartaz</h2></div><div class="movies-row" id="nowPlaying"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-calendar"></i></span>Lancamentos</h2></div><div class="movies-row" id="upcoming"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-trophy"></i></span>Melhores Avaliados</h2></div><div class="movies-row" id="topRated"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-tv"></i></span>Series Populares</h2></div><div class="movies-row" id="seriesRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-play-circle"></i></span>Em Exibicao</h2></div><div class="movies-row" id="onTheAir"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-dragon"></i></span>Anime</h2></div><div class="movies-row" id="animeRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-fist-raised"></i></span>Acao</h2></div><div class="movies-row" id="actionRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-rocket"></i></span>Ficcao Cientifica</h2></div><div class="movies-row" id="scifiRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-ghost"></i></span>Terror</h2></div><div class="movies-row" id="horrorRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-laugh"></i></span>Comedia</h2></div><div class="movies-row" id="comedyRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-masks-theater"></i></span>Drama</h2></div><div class="movies-row" id="dramaRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-mask"></i></span>Suspense</h2></div><div class="movies-row" id="thrillerRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-heart"></i></span>Romance</h2></div><div class="movies-row" id="romanceRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-hat-wizard"></i></span>Animacao</h2></div><div class="movies-row" id="animationRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-wand-sparkles"></i></span>Fantasia</h2></div><div class="movies-row" id="fantasyRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-bomb"></i></span>Crime</h2></div><div class="movies-row" id="crimeRow"></div></section>\n'+
        '<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-broadcast-tower"></i></span>TV Ao Vivo</h2></div><div class="movies-row" id="tvRow"></div></section>';

    var hero=await tmdb.getHeroContent();
    if(hero){
        if(hero.backdrop)document.getElementById('heroBg').style.backgroundImage='url('+hero.backdrop+')';
        document.getElementById('heroTitle').textContent=hero.title;
        var desc=hero.overview||'';
        document.getElementById('heroDesc').textContent=desc.substring(0,250)+(desc.length>250?'...':'');
        document.getElementById('heroMeta').innerHTML='<span class="meta-item"><i class="fas fa-star"></i> '+(hero.rating?hero.rating.toFixed(1):'N/A')+'</span><span class="meta-item"><i class="fas fa-calendar"></i> '+(hero.releaseDate?hero.releaseDate.split('-')[0]:'N/A')+'</span><span class="meta-item"><i class="fas fa-clock"></i> '+(hero.runtime||'N/A')+' min</span>';
        document.getElementById('heroPlay').onclick=function(){player.open(hero)};
        document.getElementById('heroInfo').onclick=function(){handleCardClick(hero)};
    }

    var loadRow=async function(id,fn){
        try{
            var items=await fn();
            if(items){var el=document.getElementById(id);if(el){
                el.innerHTML=items.slice(0,25).map(function(i){return createCard(i)}).join('');
                el.querySelectorAll('.movie-card').forEach(function(card,idx){
                    card.addEventListener('click',function(){handleCardClick(items[idx])});
                    setTimeout(function(){card.classList.add('visible')},idx*35);
                });
            }}
        }catch(e){console.warn(id+' failed:',e)}
    };

    await Promise.all([
        loadRow('popular',function(){return tmdb.getTrending('all','week')}),
        loadRow('filmesRow',function(){return tmdb.getMoviesByCategory('popular')}),
        loadRow('nowPlaying',function(){return tmdb.getMoviesByCategory('now_playing')}),
        loadRow('upcoming',function(){return tmdb.getMoviesByCategory('upcoming')}),
        loadRow('topRated',function(){return tmdb.getMoviesByCategory('top_rated')}),
        loadRow('seriesRow',function(){return tmdb.getTVByCategory('popular')}),
        loadRow('onTheAir',function(){return tmdb.getTVByCategory('on_the_air')}),
        loadRow('animeRow',function(){return tmdb.getAnimeByCategory('popular')}),
        loadRow('actionRow',function(){return tmdb.getMoviesByCategory('action')}),
        loadRow('scifiRow',function(){return tmdb.getMoviesByCategory('scifi')}),
        loadRow('horrorRow',function(){return tmdb.getMoviesByCategory('horror')}),
        loadRow('comedyRow',function(){return tmdb.getMoviesByCategory('comedy')}),
        loadRow('dramaRow',function(){return tmdb.getMoviesByCategory('drama')}),
        loadRow('thrillerRow',function(){return tmdb.getMoviesByCategory('thriller')}),
        loadRow('romanceRow',function(){return tmdb.getMoviesByCategory('romance')}),
        loadRow('animationRow',function(){return tmdb.getMoviesByCategory('animation')}),
        loadRow('fantasyRow',function(){return tmdb.getMoviesByCategory('fantasy')}),
        loadRow('crimeRow',function(){return tmdb.getMoviesByCategory('crime')}),
    ]);

    try{
        var tv=loadLiveChannels('br').slice(0,12);
        var tvRow=document.getElementById('tvRow');
        if(tvRow){tvRow.innerHTML=tv.map(function(i){return createLiveCard(i)}).join('');
        tv.forEach(function(ch,i){var card=tvRow.querySelector('.movie-card:nth-child('+(i+1)+')');if(card)card.addEventListener('click',function(){player.openLiveTV(ch)})})}
    }catch(e){}
}

function createCard(item){
    var isFav=favorites.some(function(f){return f.id===item.id});
    var poster=item.poster||'';
    var posterHtml=poster?'<img src="'+poster+'" alt="'+(item.title||'')+'" loading="lazy" onerror="this.style.display=\'none\'">':'';
    var placeholderStyle=poster?'display:none':'';
    return '<div class="movie-card" data-id="'+item.id+'">'+
        '<div class="card-poster">'+
        posterHtml+
        '<div class="card-placeholder" style="'+placeholderStyle+'"><i class="fas fa-film"></i></div>'+
        '<div class="card-overlay"><div class="card-play"><i class="fas fa-play"></i></div></div>'+
        '<div class="card-rating"><i class="fas fa-star"></i> '+(item.rating?item.rating.toFixed(1):'N/A')+'</div>'+
        '<div class="card-fav '+(isFav?'active':'')+'" onclick="event.stopPropagation();toggleFavorite(this.closest(\'.movie-card\').dataset.id)"><i class="fas fa-heart"></i></div>'+
        '</div>'+
        '<div class="card-info"><h3 class="card-title">'+(item.title||'Sem titulo')+'</h3><p class="card-year">'+(item.releaseDate?item.releaseDate.split('-')[0]:'N/A')+'</p></div>'+
        '</div>';
}

function createLiveCard(item){
    return '<div class="movie-card live-card"><div class="card-poster"><div class="card-placeholder" style="background:linear-gradient(135deg,#0a0a1a,#1a0a2e)"><i class="fas fa-broadcast-tower"></i><span style="font-size:10px;text-align:center;padding:0 6px;color:var(--text-muted)">'+item.title+'</span></div><div class="card-overlay"><div class="card-play"><i class="fas fa-play"></i></div></div><div class="live-badge"><i class="fas fa-circle"></i> AO VIVO</div></div><div class="card-info"><h3 class="card-title">'+item.title+'</h3></div></div>';
}

function loadLiveChannels(category){
    var ch;
    if(category==='br')ch=CONFIG.IPTV.BRAZIL;
    else if(category==='int')ch=CONFIG.IPTV.INTERNATIONAL;
    else ch=CONFIG.IPTV.BRAZIL.concat(CONFIG.IPTV.INTERNATIONAL);
    return ch.map(function(c){return{id:c.name.replace(/\s+/g,'-').toLowerCase(),title:c.name,streamUrl:c.stream,mediaType:'live'}});
}

function handleCardClick(item){
    openDetailPage(item);
}

/* ===================== DETAIL PAGE (ALL CONTENT) ===================== */
async function openDetailPage(item){
    detailPageItem=item;
    detailPageSeasonsData=[];
    currentSeason=1;
    currentEpisode=1;

    var page=document.getElementById('detailPage');
    var main=document.getElementById('mainContent');
    var footer=document.getElementById('mainFooter');
    var heroEl=document.querySelector('.hero');

    main.style.display='none';
    footer.style.display='none';
    if(heroEl)heroEl.style.display='none';
    page.style.display='block';
    window.scrollTo(0,0);

    if(item.backdrop)document.getElementById('detailHeroBg').style.backgroundImage='url('+item.backdrop+')';
    document.getElementById('detailPoster').innerHTML=item.poster?'<img src="'+item.poster+'" alt="'+(item.title||'')+'">':'<div class="poster-placeholder"><i class="fas fa-film"></i></div>';

    var badges=[];
    if(item.rating)badges.push('<span class="detail-badge badge-rating"><i class="fas fa-star"></i> '+item.rating.toFixed(1)+'</span>');
    if(item.releaseDate)badges.push('<span class="detail-badge"><i class="fas fa-calendar"></i> '+item.releaseDate.split('-')[0]+'</span>');
    if(item.seasons)badges.push('<span class="detail-badge"><i class="fas fa-layer-group"></i> '+item.seasons+' Temp.</span>');
    if(item.episodes)badges.push('<span class="detail-badge"><i class="fas fa-list-ol"></i> '+item.episodes+' Eps</span>');
    if(item.runtime)badges.push('<span class="detail-badge"><i class="fas fa-clock"></i> '+item.runtime+' min</span>');
    document.getElementById('detailBadges').innerHTML=badges.join('');
    document.getElementById('detailTitle').textContent=item.title||'';

    var meta=[];
    if(item.genreIds&&item.genreIds.length)item.genreIds.slice(0,4).forEach(function(gid){var n=getGenreName(gid);if(n)meta.push('<span class="detail-meta-item">'+n+'</span>')});
    document.getElementById('detailMeta').innerHTML=meta.map(function(m,i){return '<span class="detail-meta-item">'+m+'</span>'+(i<meta.length-1?'<span class="detail-meta-dot"></span>':'')}).join('');
    document.getElementById('detailOverview').textContent=item.overview||'Sinopse nao disponivel.';

    var isFav=favorites.some(function(f){return f.id===item.id});
    document.getElementById('detailBtnFav').innerHTML='<i class="fas fa-heart"></i> '+(isFav?'Favoritado':'Favoritar');
    document.getElementById('detailBtnFav').onclick=function(){
        toggleFavorite(item);
        var nf=favorites.some(function(f){return f.id===item.id});
        document.getElementById('detailBtnFav').innerHTML='<i class="fas fa-heart"></i> '+(nf?'Favoritado':'Favoritar');
    };
    document.getElementById('detailBtnPlay').onclick=function(){player.open(item,currentSeason,currentEpisode)};

    document.getElementById('detailSeasonsSection').style.display='none';
    document.getElementById('detailEpisodesContainer').innerHTML='<div class="loading"><div class="loading-spinner"></div></div>';
    document.getElementById('detailSimilar').innerHTML='';

    var isTV=item.mediaType==='tv'||item.mediaType==='anime';
    if(isTV){
        await loadDetailSeasons(item);
    }else{
        document.getElementById('detailSeasonsSection').style.display='none';
        document.getElementById('detailEpisodesContainer').innerHTML='';
        var runtimeHtml='';
        if(item.runtime)runtimeHtml='<span class="detail-badge"><i class="fas fa-clock"></i> '+item.runtime+' min</span>';
        document.getElementById('detailEpisodesContainer').innerHTML=
            '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">'+
            '<button class="detail-btn-play" onclick="player.open(detailPageItem)" style="margin-top:10px"><i class="fas fa-play"></i> Assistir Agora</button>'+
            '</div>';
    }

    try{
        var similarType=isTV?'tv':'movie';
        var similar=await tmdb.getSimilar(item.id,similarType);
        if(similar&&similar.length>0){
            var sc=document.getElementById('detailSimilar');
            sc.innerHTML=similar.slice(0,15).map(function(i){return createCard(i)}).join('');
            sc.querySelectorAll('.movie-card').forEach(function(card,idx){
                card.addEventListener('click',function(){handleCardClick(similar[idx])});
                setTimeout(function(){card.classList.add('visible')},idx*40);
            });
        }
    }catch(e){console.warn('Similar failed:',e)}
}

async function loadDetailSeasons(item){
    var selectorEl=document.getElementById('seasonSelector');
    var seasonsSection=document.getElementById('detailSeasonsSection');
    var seasonCount=item.seasons||0;

    if(!seasonCount){
        try{
            var details=await tmdb.getDetails('tv',item.id);
            if(details){
                seasonCount=details.number_of_seasons||0;
                detailPageItem.seasons=seasonCount;
                detailPageItem.episodes=details.number_of_episodes||0;
                if(seasonCount){
                    var badges=[];
                    if(item.rating)badges.push('<span class="detail-badge badge-rating"><i class="fas fa-star"></i> '+(item.rating?item.rating.toFixed(1):'N/A')+'</span>');
                    if(item.releaseDate)badges.push('<span class="detail-badge"><i class="fas fa-calendar"></i> '+(item.releaseDate?item.releaseDate.split('-')[0]:'N/A')+'</span>');
                    badges.push('<span class="detail-badge"><i class="fas fa-layer-group"></i> '+seasonCount+' Temp.</span>');
                    badges.push('<span class="detail-badge"><i class="fas fa-list-ol"></i> '+(details.number_of_episodes||0)+' Eps</span>');
                    document.getElementById('detailBadges').innerHTML=badges.join('');
                }
            }
        }catch(e){console.warn('Details fetch failed:',e)}
    }

    if(!seasonCount){
        document.getElementById('detailEpisodesContainer').innerHTML='<div class="empty-eps"><i class="fas fa-film"></i><p>Nenhuma temporada encontrada</p></div>';
        seasonsSection.style.display='none';return;
    }

    seasonCount=Math.min(seasonCount,30);
    var allSeasonsData=[];
    for(var s=1;s<=seasonCount;s++){
        try{var sd=await tmdb.getSeasonDetails(item.id,s);allSeasonsData.push({season:s,data:sd})}
        catch(e){allSeasonsData.push({season:s,data:null})}
    }
    detailPageSeasonsData=allSeasonsData;

    var tabsHtml='<div class="season-tabs">';
    allSeasonsData.forEach(function(sd,i){
        var ep=sd.data&&sd.data.episodes?sd.data.episodes.length:0;
        tabsHtml+='<button class="season-tab '+(i===0?'active':'')+'" onclick="switchDetailSeason('+i+')"><span class="season-num">T'+String(sd.season).padStart(2,'0')+'</span><span class="season-eps">'+ep+' ep'+(ep!==1?'s':'')+'</span></button>';
    });
    tabsHtml+='</div>';
    selectorEl.innerHTML=tabsHtml;
    seasonsSection.style.display='block';
    var first=allSeasonsData[0];
    renderDetailEpisodes(first?first.data:null,first?first.season:1);
}

function renderDetailEpisodes(seasonData,seasonNum){
    var c=document.getElementById('detailEpisodesContainer');
    if(!seasonData||!seasonData.episodes||!seasonData.episodes.length){
        c.innerHTML='<div class="empty-eps"><i class="fas fa-film"></i><p>Nenhum episodio encontrado</p></div>';return;
    }
    var html='<div class="detail-episodes-grid">';
    seasonData.episodes.forEach(function(ep){
        var epN=String(ep.episode_number).padStart(2,'0');
        var sN=String(seasonNum).padStart(2,'0');
        var still=ep.still_path?'https://image.tmdb.org/t/p/w500'+ep.still_path:'';
        var air=ep.air_date?formatDate(ep.air_date):'';
        var stillHtml=still?'<img src="'+still+'" alt="S'+sN+'E'+epN+'" loading="lazy" onerror="this.style.display=\'none\'">':'<div class="detail-ep-noimg"><i class="fas fa-film"></i></div>';
        html+='<div class="detail-episode-card" onclick="playDetailEpisode('+seasonNum+','+ep.episode_number+')">'+
            '<div class="detail-ep-thumb">'+stillHtml+
            '<div class="detail-ep-play"><i class="fas fa-play"></i></div>'+
            '<div class="detail-ep-number">S'+sN+'E'+epN+'</div></div>'+
            '<div class="detail-ep-info"><div class="detail-ep-top"><span class="detail-ep-name">'+(ep.name||'Episodio '+ep.episode_number)+'</span>'+
            (ep.runtime?'<span class="detail-ep-runtime">'+ep.runtime+'min</span>':'')+'</div>'+
            (air?'<span class="detail-ep-date">'+air+'</span>':'')+
            '<p class="detail-ep-desc">'+((ep.overview||'Sinopse nao disponivel.').substring(0,120))+((ep.overview||'').length>120?'...':'')+'</p></div></div>';
    });
    html+='</div>';c.innerHTML=html;
}

function switchDetailSeason(idx){
    document.querySelectorAll('.detail-page .season-tab').forEach(function(t){t.classList.remove('active')});
    document.querySelectorAll('.detail-page .season-tab')[idx].classList.add('active');
    var sd=detailPageSeasonsData[idx];currentSeason=sd.season;currentEpisode=1;
    renderDetailEpisodes(sd.data,sd.season);
}

function playDetailEpisode(s,e){currentSeason=s;currentEpisode=e;if(detailPageItem)player.open(detailPageItem,s,e)}

function closeDetailPage(){
    document.getElementById('detailPage').style.display='none';
    document.getElementById('mainContent').style.display='';
    document.getElementById('mainFooter').style.display='';
    detailPageItem=null;detailPageSeasonsData=[];
    window.scrollTo(0,0);
}

/* ===================== MOVIE MODAL (kept as fallback) ===================== */
function openMovieModal(item){
    var modal=document.getElementById('movieModal');
    document.getElementById('modalTitle').textContent=item.title||'';
    document.getElementById('modalDesc').textContent=item.overview||'';
    document.getElementById('modalRating').textContent=item.rating?item.rating.toFixed(1):'N/A';
    document.getElementById('modalYear').textContent=item.releaseDate?item.releaseDate.split('-')[0]:'N/A';
    document.getElementById('modalDuration').textContent=item.runtime?item.runtime+' min':'N/A';
    document.getElementById('modalGenre').textContent=getGenreName(item.genreIds?item.genreIds[0]:null);
    if(item.backdrop)document.getElementById('modalHero').style.backgroundImage='url('+item.backdrop+')';
    var p=document.getElementById('modalPoster');
    p.innerHTML=item.poster?'<img src="'+item.poster+'" alt="'+(item.title||'')+'" onerror="this.style.display=\'none\'">':'<div class="card-placeholder" style="height:280px"><i class="fas fa-film"></i></div>';
    var isFav=favorites.some(function(f){return f.id===item.id});
    document.getElementById('modalFav').innerHTML='<i class="fas fa-heart"></i> '+(isFav?'DESFAVORITAR':'FAVORITAR');
    document.getElementById('modalFav').onclick=function(){toggleFavorite(item);var nf=favorites.some(function(f){return f.id===item.id});document.getElementById('modalFav').innerHTML='<i class="fas fa-heart"></i> '+(nf?'DESFAVORITAR':'FAVORITAR')};
    document.getElementById('modalPlay').onclick=function(){player.open(item);modal.classList.remove('active')};
    modal.classList.add('active');
}

function toggleFavorite(idOrItem){
    var item;
    if(typeof idOrItem==='string'||typeof idOrItem==='number'){
        var n=Number(idOrItem);
        item=favorites.find(function(f){return f.id===n})||null;
        if(!item){
            item={id:n,title:'',poster:null,backdrop:null,overview:'',rating:0,releaseDate:'',mediaType:'movie',genreIds:[]};
        }
    }else{
        item=idOrItem;
    }
    var idx=favorites.findIndex(function(f){return f.id===item.id});
    if(idx>-1){
        favorites.splice(idx,1);
    }else{
        favorites.push({
            id:item.id,title:item.title,poster:item.poster,backdrop:item.backdrop,
            overview:item.overview,rating:item.rating,releaseDate:item.releaseDate,
            mediaType:item.mediaType,genreIds:item.genreIds,seasons:item.seasons,episodes:item.episodes,runtime:item.runtime
        });
    }
    localStorage.setItem('cineboss_favorites',JSON.stringify(favorites));
    document.querySelectorAll('.movie-card[data-id="'+item.id+'"]').forEach(function(card){var f=card.querySelector('.card-fav');if(f)f.classList.toggle('active')});
}

function loadFavorites(){
    var main=document.getElementById('mainContent');
    main.innerHTML='<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-heart"></i></span>Meus Favoritos</h2></div><div class="movies-row" id="favoritesRow"></div></section>';
    var c=document.getElementById('favoritesRow');
    if(!favorites.length)c.innerHTML='<div class="empty-state"><i class="fas fa-heart-broken"></i><p>Nenhum favorito ainda</p></div>';
    else{c.innerHTML=favorites.map(function(i){return createCard(i)}).join('');c.querySelectorAll('.movie-card').forEach(function(card,idx){card.addEventListener('click',function(){handleCardClick(favorites[idx])});setTimeout(function(){card.classList.add('visible')},idx*40)})}
}

async function performSearch(query){
    var main=document.getElementById('mainContent');
    main.innerHTML='<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-search"></i></span>Resultados para "'+query+'"</h2></div><div class="movies-row" id="searchResults"><div class="loading"><div class="loading-spinner"></div></div></div></section>';
    try{
        var results=await tmdb.searchMulti(query);
        if(currentFilter!=='all')results=results.filter(function(i){
            if(currentFilter==='anime')return i.genreIds&&i.genreIds.includes(16);
            if(currentFilter==='tv')return i.mediaType==='tv';
            return i.mediaType===currentFilter;
        });
        var c=document.getElementById('searchResults');
        if(!results.length)c.innerHTML='<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum resultado encontrado</p></div>';
        else{c.innerHTML=results.map(function(i){return createCard(i)}).join('');c.querySelectorAll('.movie-card').forEach(function(card,idx){card.addEventListener('click',function(){handleCardClick(results[idx])});setTimeout(function(){card.classList.add('visible')},idx*40)})}
    }catch(e){document.getElementById('searchResults').innerHTML='<div class="error-message">Erro na busca</div>'}
}

function goHome(){
    closeDetailPage();
    currentCategory='home';
    document.querySelectorAll('.nav-links a').forEach(function(l){l.classList.remove('active')});
    var homeLink=document.querySelector('.nav-links a[data-category="home"]');
    if(homeLink)homeLink.classList.add('active');
    loadHomePage();
}

function getGenreName(id){
    var g={28:'Acao',12:'Aventura',16:'Animacao',35:'Comedia',80:'Crime',99:'Documentario',18:'Drama',10751:'Familia',14:'Fantasia',36:'Historia',27:'Terror',10402:'Musica',9648:'Misterio',10749:'Romance',878:'Ficcao Cientifica',53:'Suspense',10752:'Guerra',37:'Faroeste',10759:'Acao & Aventura',10762:'Infantil',10765:'Sci-Fi & Fantasia'};
    return g[id]||'Genero';
}

function formatDate(d){
    if(!d)return'';var p=d.split('-');if(p.length!==3)return d;
    var m=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return parseInt(p[2])+' '+m[parseInt(p[1])-1]+' '+p[0];
}

document.getElementById('modalClose').addEventListener('click',function(){document.getElementById('movieModal').classList.remove('active')});
document.querySelector('.modal-backdrop').addEventListener('click',function(){document.getElementById('movieModal').classList.remove('active')});
document.querySelector('.player-bg').addEventListener('click',function(){player.close()});
