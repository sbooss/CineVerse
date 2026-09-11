const CACHE_NAME = 'cineboss-v2';
const STATIC_ASSETS = [
    '/CineVerse/',
    '/CineVerse/index.html',
    '/CineVerse/style.css',
    '/CineVerse/config.js',
    '/CineVerse/tmdb.js',
    '/CineVerse/player.js',
    '/CineVerse/app.js',
    '/CineVerse/manifest.json',
    '/CineVerse/icon-72.png',
    '/CineVerse/icon-96.png',
    '/CineVerse/icon-128.png',
    '/CineVerse/icon-144.png',
    '/CineVerse/icon-152.png',
    '/CineVerse/icon-192.png',
    '/CineVerse/icon-384.png',
    '/CineVerse/icon-512.png'
];

const TMDB_CACHE = 'cineboss-tmdb-v2';
const IMAGE_CACHE = 'cineboss-images-v2';

// Install - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME && key !== TMDB_CACHE && key !== IMAGE_CACHE)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - network first for API, cache first for assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // TMDB API - network first, cache fallback
    if (url.hostname === 'api.themoviedb.org') {
        event.respondWith(
            fetch(event.request).then((response) => {
                const clone = response.clone();
                caches.open(TMDB_CACHE).then((cache) => cache.put(event.request, clone));
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // Images - cache first, network fallback
    if (url.hostname === 'image.tmdb.org' || url.pathname.includes('.jpg') || url.pathname.includes('.png') || url.pathname.includes('.webp')) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(IMAGE_CACHE).then((cache) => cache.put(event.request, clone));
                    return response;
                }).catch(() => new Response('', { status: 404 }));
            })
        );
        return;
    }

    // Fonts - cache first
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'cdnjs.cloudflare.com') {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Static assets - cache first
    if (STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset.replace('/CineVerse/', '')))) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Everything else - network first
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

// Handle push notifications (future)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/CineVerse/icon-192.png',
            badge: '/CineVerse/icon-72.png',
            vibrate: [200, 100, 200]
        });
    }
});
