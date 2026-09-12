const CACHE_NAME = 'cineboss-v7';
const IMAGE_CACHE = 'cineboss-images-v7';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // TMDB API - network first, cache fallback
    if (url.hostname === 'api.themoviedb.org') {
        event.respondWith(
            fetch(event.request).then((response) => {
                const clone = response.clone();
                caches.open('cineboss-tmdb-v5').then((cache) => cache.put(event.request, clone));
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

    // Everything else (HTML, JS, CSS) - NETWORK FIRST
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
        }).catch(() => caches.match(event.request))
    );
});

self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon-192.png',
            badge: '/icon-72.png',
            vibrate: [200, 100, 200]
        });
    }
});
