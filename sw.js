/**
 * 👑 BoseSweets Sovereign Service Worker (V26.0 - Sovereign Iron-Clad Edition)
 * الإدارة المرجعية: حلويات بوسي
 * محرك التخزين الفائق والعمل دون اتصال
 * * الترقيات الحالية للنسخة 26.0 (النسخة المدمجة والمحصنة):
 * - دمج الهياكل البرمجية لمعالجة التضارب البرمجي وضمان التسجيل الناجح للمحرك.
 * - تفعيل التنظيف الذاتي اللحظي وقبول الأوامر لتخطي الانتظار وتحديث المتصفح فوراً.
 * - استراتيجية عزل ذكية وحاسمة لمنع تخزين استدعاءات الـ API و Firebase لضمان استقرار المعاملات الحية.
 * - نظام Stale-While-Revalidate لتحديث الملفات الصامت في الخلفية مع تحصين ضد أخطاء الشبكة.
 */

const CACHE_NAME = 'bosesweets-sovereign-cache-v26';
const DYNAMIC_CACHE = 'bosesweets-dynamic-v26';
const OFFLINE_URL = '/offline.html';

// قائمة الملفات المقدسة التي يتم تخزينها مبدئياً لضمان الإقلاع الفوري
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

// 1. مرحلة التثبيت: حفظ أساسيات منصة حلويات بوسي
self.addEventListener('install', (event) => {
    console.log("BoseSweets SW 👑: بدء عملية التثبيت وتخزين الهيكل الأساسي (V26.0)...");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch(error => {
            console.error("BoseSweets SW Error: تعذر استكمال التخزين الأساسي، جاري المتابعة بحذر.", error);
        })
    );
    // إجبار التفعيل الفوري لتخطي الانتظار وفرض السيطرة السريعة على النسخ القديمة
    self.skipWaiting();
});

// 2. مرحلة التفعيل: مسح النسخ القديمة لضمان عدم وجود تضارب وتثبيت التحديثات السيادية
self.addEventListener('activate', (event) => {
    console.log("BoseSweets SW 👑: بدء التفعيل وتنظيف الذاكرة القديمة...");
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                        console.log(`BoseSweets SW: إزالة الذاكرة المتقادمة [${cacheName}] للحفاظ على أداء العلامة.`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. مرحلة استقبال الأوامر الإدارية: التحكم السيادي في محرك التخزين
self.addEventListener('message', (event) => {
    if (event.data) {
        if (event.data.type === 'SKIP_WAITING') {
            console.log("BoseSweets SW 👑: تلقي أمر سيادي بتخطي الانتظار وتحديث المحرك.");
            self.skipWaiting();
        }
        if (event.data.type === 'PURGE_CACHE') {
            console.log("BoseSweets SW 👑: تلقي أمر سيادي بالتنظيف الشامل للذاكرة المؤقتة.");
            caches.keys().then((cacheNames) => {
                Promise.all(cacheNames.map(name => caches.delete(name))).then(() => {
                    console.log("BoseSweets SW: تمت عملية التنظيف الشامل بنجاح.");
                });
            });
        }
    }
});

// 4. مرحلة الاعتراض الشبكي (Fetch Interceptor): التوجيه الذكي للطلبات
self.addEventListener('fetch', (event) => {
    // تجاهل الطلبات التي ليست GET (مثل POST الخاصة بإضافة الطلبات أو التعديلات السحابية)
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // 🛡️ درع الحماية السيادي: منع التدخل تماماً في قواعد البيانات والخوادم الخارجية
    // هذا الجزء حاسم لضمان عدم تجميد قراءات الـ Firestore وبقاء المعاملات حية
    const excludedDomains = [
        'firestore.googleapis.com',
        'firebasestorage.googleapis.com',
        'identitytoolkit.googleapis.com',
        'securetoken.googleapis.com',
        'cloudfunctions.net'
    ];

    const isExcluded = excludedDomains.some(domain => requestUrl.hostname.includes(domain));
    if (isExcluded) {
        return; // السماح للمتصفح بالتعامل معها مباشرة عبر الشبكة لضمان الحيوية
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // استراتيجية (Stale-While-Revalidate) للبيانات غير المرتبطة بقواعد البيانات
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // التأكد من صحة الاستجابة قبل إضافتها للذاكرة المؤقتة الديناميكية
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // في حالة انقطاع الإنترنت بالكامل، يتم توجيه العميل للصفحة المخصصة (Offline)
                if (event.request.headers.get('accept').includes('text/html')) {
                    console.warn("BoseSweets SW Note: انقطاع تام في الشبكة، توجيه العميل للوضع الآمن.");
                    return caches.match(OFFLINE_URL);
                }
            });

            // إرجاع النسخة المخزنة فوراً إن وجدت لتسريع منصة حلويات بوسي، وتحديثها بصمت في الخلفية
            return cachedResponse || fetchPromise;
        })
    );
});