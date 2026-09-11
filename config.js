const CONFIG = {
    EMBED: {
        PROVIDERS: [
            {
                name: 'CineSrc',
                movie: function(id) { return 'https://cinesrc.st/embed/movie/' + id + '?autoplay=true&controls=true&color=%2300d4ff&quality=1080'; },
                tv: function(id, s, e) { return 'https://cinesrc.st/embed/tv/' + id + '?s=' + s + '&e=' + e + '&autoplay=true&controls=true&color=%2300d4ff&autonext=true&autoskip=true'; }
            },
            {
                name: '2Embed',
                movie: function(id) { return 'https://www.2embed.cc/embed/' + id; },
                tv: function(id, s, e) { return 'https://www.2embed.cc/embedtv/' + id + '&s=' + s + '&e=' + e; }
            },
            {
                name: 'VidSrc',
                movie: function(id) { return 'https://vidsrc.in/embed/movie/' + id; },
                tv: function(id, s, e) { return 'https://vidsrc.in/embed/tv/' + id + '/' + s + '/' + e; }
            },
            {
                name: 'VidFast',
                movie: function(id) { return 'https://vidfast.vc/movie/' + id; },
                tv: function(id, s, e) { return 'https://vidfast.vc/tv/' + id + '/' + s + '/' + e; }
            },
            {
                name: 'VidLink',
                movie: function(id) { return 'https://vidlink.pro/movie/' + id + '?lang=pt'; },
                tv: function(id, s, e) { return 'https://vidlink.pro/tv/' + id + '/' + s + '/' + e + '?lang=pt'; }
            },
            {
                name: 'EmbedMaster',
                movie: function(id) { return 'https://embedmaster.com/embed/' + id; },
                tv: function(id, s, e) { return 'https://embedmaster.com/embed/' + id + '&s=' + s + '&e=' + e; }
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
            { name: 'ESPN', stream: 'http://181.78.197.59:8000/play/a07z/index.m3u8' },
            { name: 'Nickelodeon', stream: 'https://stmv2.srvif.com/gafeab/gafeab/playlist.m3u8' },
            { name: 'Amazon Sat', stream: 'https://amazonsat.brasilstream.com.br/hls/amazonsat/index.m3u8' },
            { name: 'Boas Novas', stream: 'https://cdn.jmvstream.com/w/LVW-9375/LVW9375_6i0wPBCHYc/playlist.m3u8' },
            { name: 'BR8 TV', stream: 'https://cdn.live.br1.jmvstream.com/w/LVW-11668/ngrp:LVW11668_wiJpjbMrks_all/playlist.m3u8' },
            { name: 'Canal do Boi', stream: 'http://45.162.64.114/CANAL_DO_BOI/index.m3u8' },
            { name: 'AgroCanal', stream: 'http://45.162.64.114/AGRO_CANAL/index.m3u8' }
        ],
        INTERNATIONAL: [
            { name: 'Al Jazeera', stream: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8' },
            { name: 'NHK World', stream: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index.m3u8' },
            { name: 'France 24', stream: 'https://live.france24.com/hls/live/2023458/france24_en-hls/index.m3u8' },
            { name: 'DW News', stream: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8' },
            { name: 'CNN Brasil', stream: 'https://cnnbrasil-s.akamaized.net/live/cnnbrasil/live/master.m3u8' },
            { name: 'BBC World', stream: 'https://bbclive.akamaized.net/hls/live/2015825/bbcworld/bbcworld.isml/bbcworld-audio%3d96000.norewind.m3u8' },
            { name: 'Bloomberg TV', stream: 'https://bloomberg-cmdl-live.akamaized.net/live/us/1607/master.m3u8' },
            { name: 'DW Brasil', stream: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream104/index.m3u8' },
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
            'casalemedia.com', 'criteo.com', 'criteo.net',
            'popads.net', 'popcash.net', 'propellerads.com',
            'clickadu.com', 'monetag.com', 'adsterra.com',
            'hilltopads.com', 'exoclick.com', 'taboola.com', 'outbrain.com'
        ]
    }
};
