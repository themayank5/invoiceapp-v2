/* InvoiceGen service worker.
   Keeps a copy of the app's own files so it starts without internet.
   Strategy: network first (you always get the latest version when online), saved copy when offline.
   Your data is NOT handled here: customers, items and invoices are read and written in your CSV folder by the app itself. */
const CACHE = 'invoicegen-app-v21';
const APP_FILES = [
  './', 'index.html', 'landing.css', 'landing.js', 'lib/landing.tailwind.css', 'app.html', 'style.css', 'app.js', 'i18n.js', 'sample-data.js', 'folder-data.js', 'manifest.webmanifest', 'sample-data/InvoiceGen-sample-data.zip',
  'lib/bootstrap.min.css', 'lib/bootstrap.bundle.min.js', 'lib/qrcode.min.js', 'lib/html2pdf.bundle.min.js', 'lib/jszip.min.js',
  'fonts/fonts.css',
  'fonts/inter-latin-400.woff2', 'fonts/inter-latin-500.woff2', 'fonts/inter-latin-600.woff2', 'fonts/inter-latin-700.woff2',
  'fonts/inter-latin-ext-400.woff2', 'fonts/inter-latin-ext-500.woff2', 'fonts/inter-latin-ext-600.woff2', 'fonts/inter-latin-ext-700.woff2',
  'fonts/noto-sans-devanagari-devanagari-400.woff2', 'fonts/noto-sans-devanagari-devanagari-500.woff2',
  'fonts/noto-sans-devanagari-devanagari-600.woff2', 'fonts/noto-sans-devanagari-devanagari-700.woff2',
  'fonts/noto-sans-devanagari-latin-400.woff2', 'fonts/noto-sans-devanagari-latin-500.woff2',
  'fonts/noto-sans-devanagari-latin-600.woff2', 'fonts/noto-sans-devanagari-latin-700.woff2',
  'img/close-icon.svg', 'img/company%20logo.png', 'img/signature.png',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // only the app's own files
  event.respondWith(
    fetch(request, { cache: 'no-cache' })   // always check with the server, so a new version shows up right after you publish it
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })
        .then(saved => saved || (request.mode === 'navigate' ? caches.match('app.html') : Response.error())))
  );
});
