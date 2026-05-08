const CACHE_NAME = 'bose-sweets-cache-v2';
const DYNAMIC_CACHE = 'bose-sweets-dynamic-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/ui.js',
  '/state.js',
  '/config.js',
  '/utils.js',
  '/storage.js',
  '/search.js',
  '/offline.html' 
];

// تنصيب المحرك في المتصفح
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تفعيل المحرك وتنظيف البيانات القديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية ذكية: الكاش للملفات الثابتة، والشبكة للبيانات
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isStaticAsset = ASSETS_TO_CACHE.includes(new URL(event.request.url).pathname);

  if (isStaticAsset) {
    // أولوية الذاكرة المخبأة للملفات الأساسية لسرعة الفتح
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  } else {
    // أولوية الشبكة للمنتجات والبيانات المتغيرة مع توفير صفحة الأوفلاين
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request.url, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // إذا انقطع الاتصال ولم تكن الصفحة مسجلة، نعرض صفحة انقطاع الاتصال
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
        })
    );
  }
});
