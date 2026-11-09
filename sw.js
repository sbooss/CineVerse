var CACHE_NAME = 'cineboss-v2';
var RUNTIME_CACHE = 'cineboss-runtime-v2';
var OFFLINE_URL = '/404.html';
var PRECACHE = [
    OFFLINE_URL,
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];
var CDN_HOSTS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'image.tmdb.org'
];
var STATIC_EXT = /\.(css|js|png|jpg|jpeg|webp|svg|ico|woff|woff2|mp4)$/;

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return Promise.all(
                PRECACHE.map(function(u) {
                    return cache.add(u).catch(function() {});
                })
            );
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(
                names.map(function(n) {
                    if (n !== CACHE_NAME && n !== RUNTIME_CACHE) return caches.delete(n);
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    var req = event.request;
    if (req.method !== 'GET') return;

    var url;
    try { url = new URL(req.url); } catch (e) { return; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    var path = url.pathname;
    if (path.indexOf('/api/') === 0) return;
    if (path.indexOf('.m3u8') !== -1 || path.indexOf('.ts') !== -1) return;

    var isCDN = CDN_HOSTS.indexOf(url.hostname) !== -1;
    var isSameOrigin = url.origin === self.location.origin;
    if (!isCDN && !isSameOrigin) return;

    if (req.mode === 'navigate' || path === '/' || path.slice(-5) === '.html') {
        event.respondWith(
            fetch(req).then(function(res) {
                var copy = res.clone();
                caches.open(RUNTIME_CACHE).then(function(c) { c.put(req, copy).catch(function() {}); });
                return res;
            }).catch(function() {
                return caches.match(req).then(function(cached) {
                    return cached || caches.match(OFFLINE_URL);
                });
            })
        );
        return;
    }

    if (isCDN || STATIC_EXT.test(path)) {
        // JS/CSS do proprio site: network-first (sempre tentar a versao nova do deploy)
        if (isSameOrigin && /css|js/.test(path.slice(path.lastIndexOf('.') + 1))) {
            event.respondWith(
                fetch(req).then(function(res) {
                    if (res && res.ok) {
                        var copy = res.clone();
                        caches.open(RUNTIME_CACHE).then(function(c) { c.put(req, copy).catch(function() {}); });
                    }
                    return res;
                }).catch(function() {
                    return caches.match(req).then(function(cached) { return cached || Response.error(); });
                })
            );
            return;
        }
        event.respondWith(
            caches.match(req).then(function(cached) {
                if (cached) {
                    fetch(req).then(function(res) {
                        if (res && res.ok) {
                            var copy = res.clone();
                            caches.open(RUNTIME_CACHE).then(function(c) { c.put(req, copy).catch(function() {}); });
                        }
                    }).catch(function() {});
                    return cached;
                }
                return fetch(req).then(function(res) {
                    if (res && (res.ok || res.type === 'opaque')) {
                        var copy2 = res.clone();
                        caches.open(RUNTIME_CACHE).then(function(c) { c.put(req, copy2).catch(function() {}); });
                    }
                    return res;
                });
            })
        );
    }
});
