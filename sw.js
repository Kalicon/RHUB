/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Service Worker (PWA Offline Cache)
 * ═══════════════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'rhub-pwa-v2.1';

const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/css/custom.css',
    './assets/img/logo.svg',
    './assets/img/icon-192.svg',
    './assets/img/icon-512.svg',
    './assets/js/app.js',
    './assets/js/modules/noturno.js',
    './assets/js/modules/rescisao.js',
    './assets/js/modules/faltas.js',
    './assets/js/modules/ferias.js',
    './assets/js/modules/liquido.js',
    './assets/js/modules/clt_pj.js',
    './assets/js/modules/tabelas.js',
    './assets/js/modules/banco_horas.js',
    './assets/js/modules/plr.js',
    './assets/js/modules/teletrabalho.js',
    './assets/js/modules/equiparacao.js',
    './assets/js/utils/formatters.js',
    './assets/js/utils/validators.js',
    './assets/js/utils/exporter.js',
    './assets/js/utils/storage.js'
];

// Instalação: Cache dos arquivos essenciais
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CORE_ASSETS).catch(err => {
                console.warn('Erro ao pre-cachear alguns assets:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptação de requisições: Cache-First com fallback de rede e runtime caching
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Armazenar em cache também fontes externas e scripts CDN (Tailwind, GSAP, SheetJS)
                const url = event.request.url;
                if (
                    url.startsWith('http') &&
                    (url.includes('cdn.tailwindcss.com') ||
                     url.includes('cdnjs.cloudflare.com') ||
                     url.includes('cdn.jsdelivr.net') ||
                     url.includes('fonts.googleapis.com') ||
                     url.includes('fonts.gstatic.com'))
                ) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }

                return response;
            }).catch(() => {
                // Se offline e requisição de página HTML, retornar index.html do cache
                if (event.request.headers.get('accept')?.includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
