const CONFIG = {
    EMBED: {
        PROVIDERS: [
            {
                name: 'EmbedMovies',
                movie: (id) => `https://myembed.biz/filme/${id}`,
                tv: (id, s, e) => `https://myembed.biz/serie/${id}/${s}/${e}`
            },
            {
                name: 'VidLink',
                movie: (id) => `https://vidlink.pro/movie/${id}`,
                tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`
            },
            {
                name: 'VidFast',
                movie: (id) => `https://vidfast.vc/movie/${id}`,
                tv: (id, s, e) => `https://vidfast.vc/tv/${id}/${s}/${e}`
            },
            {
                name: 'SuperEmbed',
                movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
                tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
            }
        ]
    },
    IPTV: {
        BRAZIL: [
            { name: 'TV Cultura', logo: '', stream: 'https://tvbr-jp.akamaized.net/tvcultura/tvcultura/playlist.m3u8' },
            { name: 'TV Brasil', logo: '', stream: 'https://streaming.tve.gov.br/tvbr/live/playlist.m3u8' },
            { name: 'TV Aparecida', logo: '', stream: 'https://streamcdn5-a.akamaihd.net/tvaparecida1/playlist.m3u8' },
            { name: 'TV Justica', logo: '', stream: 'https://stream.tvcamara.jus.br/live/tvjustica/playlist.m3u8' },
            { name: 'Band News', logo: '', stream: 'http://5.79.68.138:8081/look/bandnews/playlist.m3u8' },
            { name: 'Rede Gospel', logo: '', stream: 'https://streaming-gospel.akamaized.net/redegospel/live/playlist.m3u8' },
            { name: 'Rede Vida', logo: '', stream: 'https://streaming-redevida.akamaized.net/redevida/live/playlist.m3u8' },
            { name: 'Canal Futura', logo: '', stream: 'https://streaming.futura.org.br/futura/live/playlist.m3u8' },
            { name: 'Band SP', logo: '', stream: 'http://5.79.68.138:8081/look/band/playlist.m3u8' },
            { name: 'Arte 1', logo: '', stream: 'http://45.162.64.114/ARTE1/index.m3u8' },
            { name: 'Canal do Boi', logo: '', stream: 'http://45.162.64.114/CANAL_DO_BOI/index.m3u8' },
            { name: 'AgroCanal', logo: '', stream: 'http://45.162.64.114/AGRO_CANAL/index.m3u8' },
            { name: 'ESPN', logo: '', stream: 'http://181.78.197.59:8000/play/a07z/index.m3u8' },
            { name: 'SporTV 3', logo: '', stream: 'http://170.83.49.66:8083/SPORTV3HD/index.m3u8' },
            { name: 'AMC', logo: '', stream: 'http://170.83.49.66:8083/AMCHD/index.m3u8' },
            { name: 'Nickelodeon', logo: '', stream: 'https://stmv2.srvif.com/gafeab/gafeab/playlist.m3u8' },
            { name: 'Amazon Sat', logo: '', stream: 'https://amazonsat.brasilstream.com.br/hls/amazonsat/index.m3u8' },
            { name: 'Angel TV PT', logo: '', stream: 'https://janya-digimix.akamaized.net/vglive-sk-382409/portuese/ngrp:angelportuguese_all/playlist.m3u8' },
            { name: 'Boas Novas', logo: '', stream: 'https://cdn.jmvstream.com/w/LVW-9375/LVW9375_6i0wPBCHYc/playlist.m3u8' },
            { name: 'BR8 TV', logo: '', stream: 'https://cdn.live.br1.jmvstream.com/w/LVW-11668/ngrp:LVW11668_wiJpjbMrks_all/playlist.m3u8' },
            { name: 'Canal 38', logo: '', stream: 'https://cdn.jmvstream.com/w/LVW-8503/LVW8503_d0V5oduFlK/playlist.m3u8' },
            { name: 'Adesso TV', logo: '', stream: 'https://cdn.jmvstream.com/w/LVW-9715/LVW9715_12B26T62tm/playlist.m3u8' },
            { name: 'Aratu On', logo: '', stream: 'https://cdn.live.br1.jmvstream.com/w/LVW-9359/LVW9359_XSyReL0QVf/playlist.m3u8' },
            { name: 'Canal Educacao', logo: '', stream: 'http://45.162.64.114/CANAL_EDUCACAO/index.m3u8' },
            { name: 'Blitstv', logo: '', stream: 'https://stmv1.transmissaodigital.com/blitstv/blitstv/playlist.m3u8' }
        ],
        INTERNATIONAL: [
            { name: 'Al Jazeera', logo: '', stream: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8' },
            { name: 'NHK World', logo: '', stream: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index.m3u8' },
            { name: 'France 24 EN', logo: '', stream: 'https://live.france24.com/hls/live/2023458/france24_en-hls/index.m3u8' },
            { name: 'France 24 FR', logo: '', stream: 'https://live.france24.com/hls/live/2023459/france24_fr-hls/index.m3u8' },
            { name: 'DW News', logo: '', stream: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8' },
            { name: 'Sky News', logo: '', stream: 'https://skynews-hls.akamaized.net/hls/live/2042891/SkyNewsMainStream/master.m3u8' },
            { name: 'Euronews EN', logo: '', stream: 'https://euronews-euronews-english-2-us.plex.wurl.tv/playlist.m3u8' },
            { name: 'CGTN', logo: '', stream: 'https://english.cctv.com/live/cctv_English/index.m3u8' },
            { name: 'TRT World', logo: '', stream: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8' },
            { name: 'CNN Brasil', logo: '', stream: 'https://cnnbrasil-s.akamaized.net/live/cnnbrasil/live/master.m3u8' },
            { name: 'BBC World', logo: '', stream: 'https://bbclive.akamaized.net/hls/live/2015825/bbcworld/bbcworld.isml/bbcworld-audio%3d96000.norewind.m3u8' },
            { name: 'Bloomberg TV', logo: '', stream: 'https://bloomberg-cmdl-live.akamaized.net/live/us/1607/master.m3u8' },
            { name: 'DW Brasil', logo: '', stream: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream104/index.m3u8' },
            { name: 'RTP Internacional', logo: '', stream: 'https://streaming-ondemand.rtp.pt/rtp1HLS/rtpi/playlist.m3u8' },
            { name: 'NDTV 24x7', logo: '', stream: 'https://ndtv24x7-lh.akamaized.net/hls/live/2043871/ndtv24x7/ndtv24x7/master.m3u8' },
            { name: 'TV5Monde', logo: '', stream: 'https://tv5monde.akamaized.net/live/live3/chaine+tvm.m3u8' },
            { name: 'Arirang', logo: '', stream: 'https://amdlive-ch01-ctnd-com.akamaized.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8' },
            { name: 'CNA Brasil', logo: '', stream: 'https://streaming.cna.com.br/cna/live/playlist.m3u8' },
            { name: 'NHK JP', logo: '', stream: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp/index.m3u8' },
            { name: 'DW Espanol', logo: '', stream: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream103/index.m3u8' }
        ]
    }
};
