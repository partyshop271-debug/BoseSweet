/**
 * 👑 BoseSweets Sovereign Service Worker (V22.0)
 * محرك التخزين الفائق والعمل دون اتصال لعلامة حلويات بوسي
 * * الترقيات الحالية:
 * - استراتيجية عزل ذكية لمنع تخزين استدعاءات الـ API و Firebase.
 * - نظام Stale-While-Revalidate لتحديث الملفات الصامت في الخلفية.
 * - تنظيف تلقائي وبناء هيكل متكامل لا يمكن كسره.
 */

const CACHE_NAME = 'bosesweets-sovereign-cache-v22';
const DYNAMIC_CACHE = 'bosesweets-dynamic-v22';
const OFFLINE_URL = '/offline.html';

// قائمة الملفات المقدسة التي يتم تخزينها مبدئياً
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/style.css',
    '/app.js',
    '/ui.js',
    '/state.js',
    '/config.js',
    '/utils.js',
    '/storage.js',
    '/search.js',
    '/cart.js',
    '/firebase-config.js',
    '/manifest.json'
];

// 1. مرحلة التثبيت: حفظ أساسيات الموقع
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("BoseSweets SW: جاري تخزين الهيكل الأساسي...");
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // إجبار التفعيل الفوري لتخطي الانتظار
    self.skipWaiting();
});

// 2. مرحلة التفعيل: مسح النسخ القديمة لضمان عدم وجود تضارب
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                        console.log(`BoseSweets SW: تنظيف الذاكرة القديمة [${cacheName}]`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. مرحلة الاعتراض الشبكي (Fetch Interceptor)
self.addEventListener('fetch', (event) => {
    // تجاهل الطلبات التي ليست GET (مثل POST الخاصة بإضافة الطلبات)
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // 🛡️ درع الحماية: منع التدخل تماماً في قواعد البيانات والخوادم الخارجية
    // هذا الجزء حاسم لضمان عدم تجميد قراءات الـ Firestore
    const excludedDomains = [
        'firestore.googleapis.com',
        'firebasestorage.googleapis.com',
        'identitytoolkit.googleapis.com',
        'securetoken.googleapis.com',
        'cloudfunctions.net'
    ];

    const isExcluded = excludedDomains.some(domain => requestUrl.hostname.includes(domain));
    if (isExcluded) {
        return; // السماح للمتصفح بالتعامل معها مباشرة عبر الشبكة
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // استراتيجية (Stale-While-Revalidate) للبيانات غير المرتبطة بقواعد البيانات
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // التأكد من صحة الاستجابة قبل إضافتها للذاكرة المؤقتة
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // في حالة انقطاع الإنترنت بالكامل، يتم توجيه العميل للصفحة المخصصة
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match(OFFLINE_URL);
                }
            });

            // إرجاع النسخة المخزنة فوراً إن وجدت لتسريع الموقع، وتحديثها في الخلفية
            return cachedResponse || fetchPromise;
        })
    );
});