const CONFIG = {
    EMBED: {
        PROVIDERS: [
            {
                name: 'CineSrc',
                movie: (id) => `https://cinesrc.st/embed/movie/${id}?autoplay=true&controls=true&color=%2300d4ff&quality=1080`,
                tv: (id, s, e) => `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}&autoplay=true&controls=true&color=%2300d4ff&autonext=true&autoskip=true`
            },
            {
                name: 'VidSrc',
                movie: (id) => `https://vidsrc.in/embed/movie/${id}`,
                tv: (id, s, e) => `https://vidsrc.in/embed/tv/${id}/${s}/${e}`
            },
            {
                name: 'VidSync',
                movie: (id) => `https://vidsync.xyz/embed/movie/${id}?autoPlay=true&theme=00d4ff`,
                tv: (id, s, e) => `https://vidsync.xyz/embed/tv/${id}/${s}/${e}?autoPlay=true&autoNext=true&nextButton=true&theme=00d4ff`
            },
            {
                name: 'VidFast',
                movie: (id) => `https://vidfast.vc/movie/${id}`,
                tv: (id, s, e) => `https://vidfast.vc/tv/${id}/${s}/${e}`
            },
            {
                name: 'VidLink',
                movie: (id) => `https://vidlink.pro/movie/${id}?lang=pt`,
                tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?lang=pt`
            }
        ]
    },
    IPTV: {
        BRAZIL: [
            { name: 'TV Cultura', stream: 'https://tvbr-jp.akamaized.net/tvcultura/tvcultura/playlist.m3u8' },
            { name: 'TV Brasil', stream: 'https://streaming.tve.gov.br/tvbr/live/playlist.m3u8' },
            { name: 'TV Aparecida', stream: 'https://streamcdn5-a.akamaihd.net/tvaparecida1/playlist.m3u8' },
            { name: 'Band News', stream: 'http://5.79.68.138:8081/look/bandnews/playlist.m3u8' },
            { name: 'Band SP', stream: 'http://5.79.68.138:8081/look/band/playlist.m3u8' },
            { name: 'Rede Gospel', stream: 'https://streaming-gospel.akamaized.net/redegospel/live/playlist.m3u8' },
            { name: 'Rede Vida', stream: 'https://streaming-redevida.akamaized.net/redevida/live/playlist.m3u8' },
            { name: 'Canal Futura', stream: 'https://streaming.futura.org.br/futura/live/playlist.m3u8' },
            { name: 'Arte 1', stream: 'http://45.162.64.114/ARTE1/index.m3u8' },
            { name: 'ESPN', stream: 'http://181.78.197.59:8000/play/a07z/index.m3u8' },
            { name: 'SporTV 3', stream: 'http://170.83.49.66:8083/SPORTV3HD/index.m3u8' },
            { name: 'AMC', stream: 'http://170.83.49.66:8083/AMCHD/index.m3u8' },
            { name: 'Nickelodeon', stream: 'https://stmv2.srvif.com/gafeab/gafeab/playlist.m3u8' },
            { name: 'Amazon Sat', stream: 'https://amazonsat.brasilstream.com.br/hls/amazonsat/index.m3u8' },
            { name: 'Angel TV PT', stream: 'https://janya-digimix.akamaized.net/vglive-sk-382409/portuese/ngrp:angelportuguese_all/playlist.m3u8' },
            { name: 'Boas Novas', stream: 'https://cdn.jmvstream.com/w/LVW-9375/LVW9375_6i0wPBCHYc/playlist.m3u8' },
            { name: 'BR8 TV', stream: 'https://cdn.live.br1.jmvstream.com/w/LVW-11668/ngrp:LVW11668_wiJpjbMrks_all/playlist.m3u8' },
            { name: 'Canal 38', stream: 'https://cdn.jmvstream.com/w/LVW-8503/LVW8503_d0V5oduFlK/playlist.m3u8' },
            { name: 'Adesso TV', stream: 'https://cdn.jmvstream.com/w/LVW-9715/LVW9715_12B26T62tm/playlist.m3u8' },
            { name: 'Aratu On', stream: 'https://cdn.live.br1.jmvstream.com/w/LVW-9359/LVW9359_XSyReL0QVf/playlist.m3u8' },
            { name: 'Canal Educacao', stream: 'http://45.162.64.114/CANAL_EDUCACAO/index.m3u8' },
            { name: 'Blitstv', stream: 'https://stmv1.transmissaodigital.com/blitstv/blitstv/playlist.m3u8' },
            { name: 'Canal do Boi', stream: 'http://45.162.64.114/CANAL_DO_BOI/index.m3u8' },
            { name: 'AgroCanal', stream: 'http://45.162.64.114/AGRO_CANAL/index.m3u8' },
            { name: 'AgroMais', stream: 'http://45.162.64.114/AGROMAIS/index.m3u8' }
        ],
        INTERNATIONAL: [
            { name: 'Al Jazeera', stream: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8' },
            { name: 'NHK World', stream: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index.m3u8' },
            { name: 'France 24 EN', stream: 'https://live.france24.com/hls/live/2023458/france24_en-hls/index.m3u8' },
            { name: 'DW News', stream: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8' },
            { name: 'Sky News', stream: 'https://skynews-hls.akamaized.net/hls/live/2042891/SkyNewsMainStream/master.m3u8' },
            { name: 'CNN Brasil', stream: 'https://cnnbrasil-s.akamaized.net/live/cnnbrasil/live/master.m3u8' },
            { name: 'BBC World', stream: 'https://bbclive.akamaized.net/hls/live/2015825/bbcworld/bbcworld.isml/bbcworld-audio%3d96000.norewind.m3u8' },
            { name: 'Bloomberg TV', stream: 'https://bloomberg-cmdl-live.akamaized.net/live/us/1607/master.m3u8' },
            { name: 'DW Brasil', stream: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream104/index.m3u8' },
            { name: 'RTP Internacional', stream: 'https://streaming-ondemand.rtp.pt/rtp1HLS/rtpi/playlist.m3u8' },
            { name: 'NDTV 24x7', stream: 'https://ndtv24x7-lh.akamaized.net/hls/live/2043871/ndtv24x7/ndtv24x7/master.m3u8' },
            { name: 'TV5Monde', stream: 'https://tv5monde.akamaized.net/live/live3/chaine+tvm.m3u8' },
            { name: 'Arirang', stream: 'https://amdlive-ch01-ctnd-com.akamaized.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8' },
            { name: 'CNA Brasil', stream: 'https://streaming.cna.com.br/cna/live/playlist.m3u8' },
            { name: 'DW Espanol', stream: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream103/index.m3u8' },
            { name: 'Euronews', stream: 'https://euronews-euronews-english-2-us.plex.wurl.tv/playlist.m3u8' },
            { name: 'CGTN', stream: 'https://english.cctv.com/live/cctv_English/index.m3u8' },
            { name: 'TRT World', stream: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8' }
        ]
    },
    AD_BLOCK: {
        BLOCKED_DOMAINS: [
            'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
            'adservice.google.com', 'pagead2.googlesyndication.com',
            'adnxs.com', 'adsrvr.org', 'adroll.com', 'amazon-adsystem.com',
            'casalemedia.com', 'contextweb.com', 'dotomi.com', 'doubleclick.com',
            'feedburner.com', 'juicyads.com', 'media.net', 'moatads.com',
            'outbrain.com', 'taboola.com', 'criteo.com', 'criteo.net',
            'popads.net', 'popcash.net', 'propellerads.com', 'ExoClick.com',
            'hilltopads.com', 'clickadu.com', 'monetag.com', 'adsterra.com',
            'trafficjunky.com', 'exo.com', 'bangbrosvideos.com', 'adultadworld.com',
            'ad.score', 'serving-sys.com', 'smaato.net', 'inmobi.com',
            'unity3d.com/ads', 'applovin.com', 'ironsrc.com', 'fyber.com',
            'startapp.com', 'leadbolt.com', 'airpush.com', 'mopub.com'
        ],
        BLOCKED_SCRIPTS: [
            'popunder', 'popup', 'clickunder', 'interstitial',
            'survey-popp', 'anti-adblock', 'adbtc', 'coin-hive'
        ]
    }
};
