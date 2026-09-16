const CONFIG = {
    EMBED: {
        PROVIDERS: [
            {
                name: 'Servidor 1',
                movie: function(id) { return 'https://mgeb.top/embed/movie/' + id; },
                tv: function(id, s, e) { return 'https://mgeb.top/embed/tv/' + id + '/' + s + '/' + e; }
            },
            {
                name: 'Servidor 2',
                movie: function(id) { return 'https://nhdapi.com/movie/' + id; },
                tv: function(id, s, e) { return 'https://nhdapi.com/tv/' + id + '/' + s + '/' + e; }
            }
        ]
    },
    IPTV: {
        BRAZIL: [
            { name: 'Amazon Sat', stream: 'https://amazonsat.brasilstream.com.br/hls/amazonsat/index.m3u8', quality: '1080p' },
            { name: 'Angel TV', stream: 'https://canaleducacao-stream.ebc.com.br/index.m3u8', quality: '720p' },
            { name: 'Canal Gov', stream: 'https://canalgov-stream.ebc.com.br/index.m3u8', quality: '720p' },
            { name: 'COM Brasil', stream: 'https://stream01.msolutionbrasil.com.br/hls/conectv/live.m3u8', quality: '1080p' },
            { name: 'TV Cancao Nova', stream: 'https://stmv2.srvif.com/gafeab/gafeab/playlist.m3u8', quality: '720p' },
            { name: 'Chroma TV', stream: 'https://5c483b9d1019c.streamlock.net/8054/8054/playlist.m3u8', quality: '480p' },
            { name: 'Classique TV', stream: 'https://stmv1.srvif.com/classique/classique/playlist.m3u8', quality: '360p' },
            { name: 'Conexao TV', stream: 'https://5c483b9d1019c.streamlock.net/falalitoraltv/falalitoraltv/playlist.m3u8', quality: '720p' }
        ],
        INTERNATIONAL: [
            { name: 'Al Jazeera', stream: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8', quality: '1080p' },
            { name: 'NHK World', stream: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index.m3u8', quality: '1080p' },
            { name: 'France 24', stream: 'https://live.france24.com/hls/live/2023458/france24_en-hls/index.m3u8', quality: '1080p' },
            { name: 'DW News', stream: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', quality: '1080p' },
            { name: 'CNN Brasil', stream: 'https://cnnbrasil-s.akamaized.net/live/cnnbrasil/live/master.m3u8', quality: '1080p' },
            { name: 'BBC World', stream: 'https://bbclive.akamaized.net/hls/live/2015825/bbcworld/bbcworld.isml/bbcworld-audio%3d96000.norewind.m3u8', quality: '1080p' },
            { name: 'Bloomberg TV', stream: 'https://bloomberg-cmdl-live.akamaized.net/live/us/1607/master.m3u8', quality: '1080p' },
            { name: 'Euronews', stream: 'https://euronews-euronews-english-2-us.plex.wurl.tv/playlist.m3u8', quality: '1080p' },
            { name: 'TRT World', stream: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8', quality: '1080p' }
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
            'hilltopads.com', 'exoclick.com', 'taboola.com', 'outbrain.com',
            'rubiconproject.com', 'openx.net', 'pubmatic.com', 'adform.com',
            'serving-sys.com', 'advertising.com', 'mathtag.com', 'turn.com',
            'bidswitch.net', 'spotxchange.com', 'iphelix.com',
            'ads.google.com', 'pagead2.googlesyndication.com',
            'moatads.com', 'quantserve.com', 'scorecardresearch.com',
            'bluekai.com', 'demdex.net', 'everesttech.net',
            'krxd.net', 'nexac.com', 'adjug.com',
            'tribalfusion.com', 'mediaplex.com', 'simplifydigital.com',
            'realmedia.com', '247realmedia.com',
            'akanoo.com', 'trkvsg.com', 'adty.com', 'nsgzip.com',
            'cdnfacebook.net', 'sdkstream.com', 'ad-maven.com',
            'evadav.com', 'pushprofit.net', 'pushwoosh.com',
            'richpush.com', 'notifpush.com', 'carpush.net',
            'pushame.com', 'pushworld.com', 'webpushme.com',
            'popcashjs.com', 'poptm.com'
        ]
    }
};
