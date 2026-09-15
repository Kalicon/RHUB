/**
 * ═══════════════════════════════════════════════════════════════════════
 * RHUB — Service Worker (PWA Offline Cache)
 * ═══════════════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'rhub-pwa-v3.1';

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
    './assets/js/modules/folha_lote.js',
    './assets/js/data/esocial_rubricas.js',
    './assets/js/data/cct_config.js',
    './assets/js/utils/pdf_generator.js',
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

// Interceptação de requisições: Network-First para scripts e documentos locais, Cache-First para CDNs e assets estáticos
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = event.request.url;
    const isLocalDynamic = url.includes('/assets/js/') || url.endsWith('.js') || url.includes('index.html') || url.endsWith('/');

    if (isLocalDynamic) {
        event.respondWith(
            fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return response;
            }).catch(() => {
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('./index.html');
                    }
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Armazenar em cache também fontes externas e scripts CDN
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
            });
        })
    );
});
