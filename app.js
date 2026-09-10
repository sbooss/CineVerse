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

function initDetailPage(){document.getElementById('detailBack').addEventListener('click',closeDetailPage)}

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
    return`<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas ${icon}"></i></span>${title}</h2></div><div class="movies-row" id="${id}"><div class="loading"><div class="loading-spinner"></div></div></div></section>`;
}

async function loadSection(sectionId,category,mediaType,isLive){
    const c=document.getElementById(sectionId);if(!c)return;
    try{
        let items;
        if(isLive||mediaType==='live'){
            items=loadLiveChannels(category);
            c.innerHTML=items.map(i=>createLiveCard(i)).join('');
            items.forEach((ch,i)=>{const card=c.querySelector(`.movie-card:nth-child(${i+1})`);if(card)card.addEventListener('click',()=>player.openLiveTV(ch))});
            return;
        }
        if(mediaType==='anime')items=await tmdb.getAnimeByCategory(category);
        else if(mediaType==='movie')items=await tmdb.getMoviesByCategory(category);
        else if(mediaType==='tv')items=await tmdb.getTVByCategory(category);
        else items=await tmdb.getMoviesByCategory(category);
        if(!items||!items.length){c.innerHTML='<div class="empty-state"><i class="fas fa-film"></i><p>Nenhum conteudo encontrado</p></div>';return}
        c.innerHTML=items.map(i=>createCard(i)).join('');
        c.querySelectorAll('.movie-card').forEach((card,idx)=>{
            card.addEventListener('click',()=>handleCardClick(items[idx]));
            setTimeout(()=>card.classList.add('visible'),idx*40);
        });
    }catch(e){c.innerHTML='<div class="error-message">Erro ao carregar</div>'}
}

async function loadHomePage(){
    const main=document.getElementById('mainContent');
    main.innerHTML=`
        <section class="hero" id="hero">
            <div class="hero-bg" id="heroBg"></div>
            <div class="hero-content">
                <div class="hero-badge"><i class="fas fa-bolt"></i><span>EM ALTA</span></div>
                <h1 class="hero-title" id="heroTitle"></h1>
                <div class="hero-meta" id="heroMeta"></div>
                <p class="hero-desc" id="heroDesc"></p>
                <div class="hero-buttons">
                    <button class="btn-primary" id="heroPlay"><i class="fas fa-play"></i><span>ASSISTIR AGORA</span></button>
                    <button class="btn-secondary" id="heroInfo"><i class="fas fa-info-circle"></i><span>MAIS INFORMACOES</span></button>
                </div>
            </div>
            <div class="hero-gradient"></div>
        </section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-fire"></i></span>Em Alta</h2></div><div class="movies-row" id="popular"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-film"></i></span>Filmes Populares</h2></div><div class="movies-row" id="filmesRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-ticket-alt"></i></span>Em Cartaz</h2></div><div class="movies-row" id="nowPlaying"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-calendar"></i></span>Lancamentos</h2></div><div class="movies-row" id="upcoming"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-trophy"></i></span>Melhores Avaliados</h2></div><div class="movies-row" id="topRated"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-tv"></i></span>Series Populares</h2></div><div class="movies-row" id="seriesRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-play-circle"></i></span>Em Exibicao</h2></div><div class="movies-row" id="onTheAir"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-dragon"></i></span>Anime</h2></div><div class="movies-row" id="animeRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-fist-raised"></i></span>Acao</h2></div><div class="movies-row" id="actionRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-rocket"></i></span>Ficcao Cientifica</h2></div><div class="movies-row" id="scifiRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-ghost"></i></span>Terror</h2></div><div class="movies-row" id="horrorRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-laugh"></i></span>Comedia</h2></div><div class="movies-row" id="comedyRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-masks-theater"></i></span>Drama</h2></div><div class="movies-row" id="dramaRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-mask"></i></span>Suspense</h2></div><div class="movies-row" id="thrillerRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-heart"></i></span>Romance</h2></div><div class="movies-row" id="romanceRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-hat-wizard"></i></span>Animacao</h2></div><div class="movies-row" id="animationRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-wand-sparkles"></i></span>Fantasia</h2></div><div class="movies-row" id="fantasyRow"></div></section>
        <section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-broadcast-tower"></i></span>TV Ao Vivo</h2></div><div class="movies-row" id="tvRow"></div></section>`;

    const hero=await tmdb.getHeroContent();
    if(hero){
        if(hero.backdrop)document.getElementById('heroBg').style.backgroundImage=`url(${hero.backdrop})`;
        document.getElementById('heroTitle').textContent=hero.title;
        document.getElementById('heroDesc').textContent=hero.overview?.substring(0,250)+(hero.overview?.length>250?'...':'')||'';
        document.getElementById('heroMeta').innerHTML=`<span class="meta-item"><i class="fas fa-star"></i> ${hero.rating?.toFixed(1)||'N/A'}</span><span class="meta-item"><i class="fas fa-calendar"></i> ${hero.releaseDate?.split('-')[0]||'N/A'}</span><span class="meta-item"><i class="fas fa-clock"></i> ${hero.runtime||'N/A'} min</span>`;
        document.getElementById('heroPlay').onclick=()=>player.open(hero);
        document.getElementById('heroInfo').onclick=()=>handleCardClick(hero);
    }

    const loadRow=async(id,fn)=>{
        try{
            const items=await fn();
            if(items){const el=document.getElementById(id);if(el){
                el.innerHTML=items.slice(0,25).map(i=>createCard(i)).join('');
                el.querySelectorAll('.movie-card').forEach((card,idx)=>{
                    card.addEventListener('click',()=>handleCardClick(items[idx]));
                    setTimeout(()=>card.classList.add('visible'),idx*35);
                });
            }}
        }catch(e){}
    };

    await Promise.all([
        loadRow('popular',()=>tmdb.getTrending('all','week')),
        loadRow('filmesRow',()=>tmdb.getMoviesByCategory('popular')),
        loadRow('nowPlaying',()=>tmdb.getMoviesByCategory('now_playing')),
        loadRow('upcoming',()=>tmdb.getMoviesByCategory('upcoming')),
        loadRow('topRated',()=>tmdb.getMoviesByCategory('top_rated')),
        loadRow('seriesRow',()=>tmdb.getTVByCategory('popular')),
        loadRow('onTheAir',()=>tmdb.getTVByCategory('on_the_air')),
        loadRow('animeRow',()=>tmdb.getAnimeByCategory('popular')),
        loadRow('actionRow',()=>tmdb.getMoviesByCategory('action')),
        loadRow('scifiRow',()=>tmdb.getMoviesByCategory('scifi')),
        loadRow('horrorRow',()=>tmdb.getMoviesByCategory('horror')),
        loadRow('comedyRow',()=>tmdb.getMoviesByCategory('comedy')),
        loadRow('dramaRow',()=>tmdb.getMoviesByCategory('drama')),
        loadRow('thrillerRow',()=>tmdb.getMoviesByCategory('thriller')),
        loadRow('romanceRow',()=>tmdb.getMoviesByCategory('romance')),
        loadRow('animationRow',()=>tmdb.getMoviesByCategory('animation')),
        loadRow('fantasyRow',()=>tmdb.getMoviesByCategory('fantasy')),
    ]);

    try{
        const tv=loadLiveChannels('br').slice(0,12);
        const tvRow=document.getElementById('tvRow');
        if(tvRow){tvRow.innerHTML=tv.map(i=>createLiveCard(i)).join('');
        tv.forEach((ch,i)=>{const card=tvRow.querySelector(`.movie-card:nth-child(${i+1})`);if(card)card.addEventListener('click',()=>player.openLiveTV(ch))})}
    }catch(e){}
}

function createCard(item){
    const isFav=favorites.some(f=>f.id===item.id);
    const poster=item.poster||'';
    return`<div class="movie-card" data-id="${item.id}"><div class="card-poster">${poster?`<img src="${poster}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'">`:''}<div class="card-placeholder" style="${poster?'display:none':''}"><i class="fas fa-film"></i></div><div class="card-overlay"><div class="card-play"><i class="fas fa-play"></i></div></div><div class="card-rating"><i class="fas fa-star"></i> ${item.rating?.toFixed(1)||'N/A'}</div><div class="card-fav ${isFav?'active':''}" onclick="event.stopPropagation();toggleFavorite(this.closest('.movie-card').dataset.id)"><i class="fas fa-heart"></i></div></div><div class="card-info"><h3 class="card-title">${item.title||'Sem titulo'}</h3><p class="card-year">${item.releaseDate?.split('-')[0]||'N/A'}</p></div></div>`;
}

function createLiveCard(item){
    return`<div class="movie-card live-card"><div class="card-poster"><div class="card-placeholder" style="background:linear-gradient(135deg,#0a0a1a,#1a0a2e)"><i class="fas fa-broadcast-tower"></i><span style="font-size:10px;text-align:center;padding:0 6px;color:var(--text-muted)">${item.title}</span></div><div class="card-overlay"><div class="card-play"><i class="fas fa-play"></i></div></div><div class="live-badge"><i class="fas fa-circle"></i> AO VIVO</div></div><div class="card-info"><h3 class="card-title">${item.title}</h3></div></div>`;
}

function loadLiveChannels(category){
    let ch;
    if(category==='br')ch=CONFIG.IPTV.BRAZIL;
    else if(category==='int')ch=CONFIG.IPTV.INTERNATIONAL;
    else ch=[...CONFIG.IPTV.BRAZIL,...CONFIG.IPTV.INTERNATIONAL];
    return ch.map(c=>({id:c.name.replace(/\s+/g,'-').toLowerCase(),title:c.name,streamUrl:c.stream,mediaType:'live'}));
}

function handleCardClick(item){
    const isTV=item.mediaType==='tv'||item.mediaType==='anime';
    if(isTV)openDetailPage(item);
    else openMovieModal(item);
}

/* ===================== DETAIL PAGE (TV/ANIME) ===================== */
async function openDetailPage(item){
    detailPageItem=item;detailPageSeasonsData=[];currentSeason=1;currentEpisode=1;
    const page=document.getElementById('detailPage');
    const main=document.getElementById('mainContent');
    const footer=document.getElementById('mainFooter');
    const heroEl=document.querySelector('.hero');
    main.style.display='none';footer.style.display='none';
    if(heroEl)heroEl.style.display='none';
    page.style.display='block';window.scrollTo(0,0);

    if(item.backdrop)document.getElementById('detailHeroBg').style.backgroundImage=`url(${item.backdrop})`;
    document.getElementById('detailPoster').innerHTML=item.poster?`<img src="${item.poster}" alt="${item.title}">`:'<div class="poster-placeholder"><i class="fas fa-film"></i></div>';

    const badges=[];
    if(item.rating)badges.push(`<span class="detail-badge badge-rating"><i class="fas fa-star"></i> ${item.rating.toFixed(1)}</span>`);
    if(item.releaseDate)badges.push(`<span class="detail-badge"><i class="fas fa-calendar"></i> ${item.releaseDate.split('-')[0]}</span>`);
    if(item.seasons)badges.push(`<span class="detail-badge"><i class="fas fa-layer-group"></i> ${item.seasons} Temp.</span>`);
    if(item.episodes)badges.push(`<span class="detail-badge"><i class="fas fa-list-ol"></i> ${item.episodes} Eps</span>`);
    document.getElementById('detailBadges').innerHTML=badges.join('');
    document.getElementById('detailTitle').textContent=item.title||'';

    const meta=[];
    if(item.genreIds?.length)item.genreIds.slice(0,3).forEach(gid=>{const n=getGenreName(gid);if(n)meta.push(`<span class="detail-meta-item">${n}</span>`)});
    document.getElementById('detailMeta').innerHTML=meta.map((m,i)=>`<span class="detail-meta-item">${m}</span>${i<meta.length-1?'<span class="detail-meta-dot"></span>':''}`).join('');
    document.getElementById('detailOverview').textContent=item.overview||'Sinopse nao disponivel.';

    const isFav=favorites.some(f=>f.id===item.id);
    document.getElementById('detailBtnFav').innerHTML=`<i class="fas fa-heart"></i> ${isFav?'Favoritado':'Favoritar'}`;
    document.getElementById('detailBtnFav').onclick=()=>{toggleFavorite(item);const nf=favorites.some(f=>f.id===item.id);document.getElementById('detailBtnFav').innerHTML=`<i class="fas fa-heart"></i> ${nf?'Favoritado':'Favoritar'}`};
    document.getElementById('detailBtnPlay').onclick=()=>player.open(item,currentSeason,currentEpisode);

    document.getElementById('detailSeasonsSection').style.display='none';
    document.getElementById('detailEpisodesContainer').innerHTML='<div class="loading"><div class="loading-spinner"></div></div>';
    document.getElementById('detailSimilar').innerHTML='';

    await loadDetailSeasons(item);

    try{
        const similar=await tmdb.getSimilar(item.id,'tv');
        if(similar&&similar.length>0){
            const c=document.getElementById('detailSimilar');
            c.innerHTML=similar.slice(0,15).map(i=>createCard(i)).join('');
            c.querySelectorAll('.movie-card').forEach((card,idx)=>{
                card.addEventListener('click',()=>handleCardClick(similar[idx]));
                setTimeout(()=>card.classList.add('visible'),idx*40);
            });
        }
    }catch(e){}
}

async function loadDetailSeasons(item){
    const selectorEl=document.getElementById('seasonSelector');
    const seasonsSection=document.getElementById('detailSeasonsSection');
    let seasonCount=item.seasons||0;

    if(!seasonCount||seasonCount===0){
        try{
            const details=await tmdb.getDetails('tv',item.id);
            if(details){
                seasonCount=details.number_of_seasons||0;
                detailPageItem.seasons=seasonCount;
                detailPageItem.episodes=details.number_of_episodes||0;
                if(seasonCount)document.getElementById('detailBadges').innerHTML=`
                    <span class="detail-badge badge-rating"><i class="fas fa-star"></i> ${item.rating?.toFixed(1)||'N/A'}</span>
                    <span class="detail-badge"><i class="fas fa-calendar"></i> ${(item.releaseDate||'').split('-')[0]||'N/A'}</span>
                    <span class="detail-badge"><i class="fas fa-layer-group"></i> ${seasonCount} Temp.</span>
                    <span class="detail-badge"><i class="fas fa-list-ol"></i> ${details.number_of_episodes||0} Eps</span>`;
            }
        }catch(e){}
    }

    if(!seasonCount||seasonCount===0){
        document.getElementById('detailEpisodesContainer').innerHTML='<div class="empty-eps"><i class="fas fa-film"></i><p>Nenhuma temporada encontrada</p></div>';
        seasonsSection.style.display='none';return;
    }

    seasonCount=Math.min(seasonCount,30);
    let allSeasonsData=[];
    for(let s=1;s<=seasonCount;s++){
        try{const sd=await tmdb.getSeasonDetails(item.id,s);allSeasonsData.push({season:s,data:sd})}
        catch(e){allSeasonsData.push({season:s,data:null})}
    }
    detailPageSeasonsData=allSeasonsData;

    let tabsHtml='<div class="season-tabs">';
    allSeasonsData.forEach((sd,i)=>{
        const ep=sd.data?.episodes?.length||0;
        tabsHtml+=`<button class="season-tab ${i===0?'active':''}" onclick="switchDetailSeason(${i})"><span class="season-num">T${String(sd.season).padStart(2,'0')}</span><span class="season-eps">${ep} ep${ep!==1?'s':''}</span></button>`;
    });
    tabsHtml+='</div>';
    selectorEl.innerHTML=tabsHtml;
    seasonsSection.style.display='block';
    renderDetailEpisodes(allSeasonsData[0]?.data,allSeasonsData[0]?.season||1);
}

function renderDetailEpisodes(seasonData,seasonNum){
    const c=document.getElementById('detailEpisodesContainer');
    if(!seasonData?.episodes||!seasonData.episodes.length){
        c.innerHTML='<div class="empty-eps"><i class="fas fa-film"></i><p>Nenhum episodio encontrado</p></div>';return;
    }
    let html='<div class="detail-episodes-grid">';
    seasonData.episodes.forEach(ep=>{
        const epN=String(ep.episode_number).padStart(2,'0');
        const sN=String(seasonNum).padStart(2,'0');
        const still=ep.still_path?`https://image.tmdb.org/t/p/w500${ep.still_path}`:'';
        const air=ep.air_date?formatDate(ep.air_date):'';
        html+=`<div class="detail-episode-card" onclick="playDetailEpisode(${seasonNum},${ep.episode_number})"><div class="detail-ep-thumb">${still?`<img src="${still}" alt="S${sN}E${epN}" loading="lazy" onerror="this.style.display='none'">`:'<div class="detail-ep-noimg"><i class="fas fa-film"></i></div>'}<div class="detail-ep-play"><i class="fas fa-play"></i></div><div class="detail-ep-number">S${sN}E${epN}</div></div><div class="detail-ep-info"><div class="detail-ep-top"><span class="detail-ep-name">${ep.name||'Episodio '+ep.episode_number}</span>${ep.runtime?`<span class="detail-ep-runtime">${ep.runtime}min</span>`:''}</div>${air?`<span class="detail-ep-date">${air}</span>`:''}<p class="detail-ep-desc">${(ep.overview||'Sinopse nao disponivel.').substring(0,120)}${(ep.overview||'').length>120?'...':''}</p></div></div>`;
    });
    html+='</div>';c.innerHTML=html;
}

function switchDetailSeason(idx){
    document.querySelectorAll('.detail-page .season-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.detail-page .season-tab')[idx].classList.add('active');
    const sd=detailPageSeasonsData[idx];currentSeason=sd.season;currentEpisode=1;
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

/* ===================== MOVIE MODAL ===================== */
function openMovieModal(item){
    const modal=document.getElementById('movieModal');
    document.getElementById('modalTitle').textContent=item.title||'';
    document.getElementById('modalDesc').textContent=item.overview||'';
    document.getElementById('modalRating').textContent=item.rating?.toFixed(1)||'N/A';
    document.getElementById('modalYear').textContent=item.releaseDate?.split('-')[0]||'N/A';
    document.getElementById('modalDuration').textContent=item.runtime?`${item.runtime} min`:'N/A';
    document.getElementById('modalGenre').textContent=getGenreName(item.genreIds?.[0]);
    if(item.backdrop)document.getElementById('modalHero').style.backgroundImage=`url(${item.backdrop})`;
    const p=document.getElementById('modalPoster');
    p.innerHTML=item.poster?`<img src="${item.poster}" alt="${item.title}" onerror="this.style.display='none'">`:'<div class="card-placeholder" style="height:280px"><i class="fas fa-film"></i></div>';
    const isFav=favorites.some(f=>f.id===item.id);
    document.getElementById('modalFav').innerHTML=`<i class="fas fa-heart"></i> ${isFav?'DESFAVORITAR':'FAVORITAR'}`;
    document.getElementById('modalFav').onclick=()=>{toggleFavorite(item);const nf=favorites.some(f=>f.id===item.id);document.getElementById('modalFav').innerHTML=`<i class="fas fa-heart"></i> ${nf?'DESFAVORITAR':'FAVORITAR'}`};
    document.getElementById('modalPlay').onclick=()=>{player.open(item);modal.classList.remove('active')};
    modal.classList.add('active');
}

function toggleFavorite(idOrItem){
    let item;
    if(typeof idOrItem==='string'||typeof idOrItem==='number'){
        const n=Number(idOrItem);item=favorites.find(f=>f.id===n)||null;
        if(!item)item={id:n,title:'',poster:null,backdrop:null,overview:'',rating:0,releaseDate:'',mediaType:'movie',genreIds:[]};
    }else item=idOrItem;
    const idx=favorites.findIndex(f=>f.id===item.id);
    if(idx>-1)favorites.splice(idx,1);
    else favorites.push({id:item.id,title:item.title,poster:item.poster,backdrop:item.backdrop,overview:item.overview,rating:item.rating,releaseDate:item.releaseDate,mediaType:item.mediaType,genreIds:item.genreIds,seasons:item.seasons,episodes:item.episodes});
    localStorage.setItem('cineboss_favorites',JSON.stringify(favorites));
    document.querySelectorAll(`.movie-card[data-id="${item.id}"]`).forEach(card=>{const f=card.querySelector('.card-fav');if(f)f.classList.toggle('active')});
}

function loadFavorites(){
    const main=document.getElementById('mainContent');
    main.innerHTML=`<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-heart"></i></span>Meus Favoritos</h2></div><div class="movies-row" id="favoritesRow"></div></section>`;
    const c=document.getElementById('favoritesRow');
    if(!favorites.length)c.innerHTML='<div class="empty-state"><i class="fas fa-heart-broken"></i><p>Nenhum favorito ainda</p></div>';
    else{c.innerHTML=favorites.map(i=>createCard(i)).join('');c.querySelectorAll('.movie-card').forEach((card,idx)=>{card.addEventListener('click',()=>handleCardClick(favorites[idx]));setTimeout(()=>card.classList.add('visible'),idx*40)})}
}

async function performSearch(query){
    const main=document.getElementById('mainContent');
    main.innerHTML=`<section class="content-section"><div class="section-header"><h2 class="section-title"><span class="title-icon"><i class="fas fa-search"></i></span>Resultados para "${query}"</h2></div><div class="movies-row" id="searchResults"><div class="loading"><div class="loading-spinner"></div></div></div></section>`;
    try{
        let results=await tmdb.searchMulti(query);
        if(currentFilter!=='all')results=results.filter(i=>{
            if(currentFilter==='anime')return i.genreIds?.includes(16);
            if(currentFilter==='tv')return i.mediaType==='tv';
            return i.mediaType===currentFilter;
        });
        const c=document.getElementById('searchResults');
        if(!results.length)c.innerHTML='<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum resultado encontrado</p></div>';
        else{c.innerHTML=results.map(i=>createCard(i)).join('');c.querySelectorAll('.movie-card').forEach((card,idx)=>{card.addEventListener('click',()=>handleCardClick(results[idx]));setTimeout(()=>card.classList.add('visible'),idx*40)})}
    }catch(e){document.getElementById('searchResults').innerHTML='<div class="error-message">Erro na busca</div>'}
}

function goHome(){closeDetailPage();currentCategory='home';document.querySelectorAll('.nav-links a').forEach(l=>l.classList.remove('active'));document.querySelector('.nav-links a[data-category="home"]').classList.add('active');loadHomePage()}

function getGenreName(id){const g={28:'Acao',12:'Aventura',16:'Animacao',35:'Comedia',80:'Crime',99:'Documentario',18:'Drama',10751:'Familia',14:'Fantasia',36:'Historia',27:'Terror',10402:'Musica',9648:'Misterio',10749:'Romance',878:'Ficcao Cientifica',53:'Suspense',10752:'Guerra',37:'Faroeste',10759:'Acao & Aventura',10762:'Infantil',10765:'Sci-Fi & Fantasia'};return g[id]||'Genero'}

function formatDate(d){if(!d)return'';const p=d.split('-');if(p.length!==3)return d;const m=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];return`${parseInt(p[2])} ${m[parseInt(p[1])-1]} ${p[0]}`}

document.getElementById('modalClose')?.addEventListener('click',()=>document.getElementById('movieModal').classList.remove('active'));
document.querySelector('.modal-backdrop')?.addEventListener('click',()=>document.getElementById('movieModal').classList.remove('active'));
document.querySelector('.player-bg')?.addEventListener('click',()=>player.close());
