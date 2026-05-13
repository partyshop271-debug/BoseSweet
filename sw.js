/**
 * 👑 BoseSweets Sovereign Service Worker (V28.5 - Sovereign Monitor Edition)
 * الإدارة المرجعية: حلويات بوسي
 * محرك التخزين الفائق والعمل دون اتصال - نسخة المستشعر السيادي
 * * التحديثات الحالية:
 * - زراعة مستشعر BoseMonitor لمراقبة نزاهة التخزين والاعتراض الشبكي.
 * - تحسين استراتيجية (Stale-While-Revalidate) مع معالجة استباقية للأخطاء.
 * - بروتوكول الجسر المعلوماتي لإبلاغ الإدارة بأعطال الـ Cache لحظياً.
 */

const CACHE_NAME = 'bosesweets-sovereign-cache-v28-5';
const DYNAMIC_CACHE = 'bosesweets-dynamic-v28-5';
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

/**
 * 🛡️ دالة التبليغ السيادية (Sovereign SW Reporter)
 * تعمل كجسر لإرسال تقارير الأخطاء من الـ Service Worker إلى المستشعر الرئيسي
 */
async function reportSWError(error, funcName, context = null) {
    try {
        console.error(`👑 BoseSweets SW Error [${funcName}]:`, error);
        // محاولة إرسال الرسالة إلى كافة النوافذ المفتوحة ليقوم مستشعر BoseMonitor بالتعامل معها
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'BOSE_MONITOR_SW_REPORT',
                error: error.message || error,
                source: 'sw.js',
                function: funcName,
                context: context,
                timestamp: Date.now()
            });
        });
    } catch (e) {
        // في حال تعذر التبليغ، يتم الاكتفاء بالتسجيل الصامت لعدم إعاقة المحرك
    }
}

// 1. مرحلة التثبيت: حفظ أساسيات منصة حلويات بوسي
self.addEventListener('install', (event) => {
    try {
        console.log("BoseSweets SW 👑: بدء عملية التثبيت وتخزين الهيكل الأساسي (V28.5)...");
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            }).catch(error => {
                reportSWError(error, 'install_event_cache_all');
                console.error("BoseSweets SW Error: تعذر استكمال التخزين الأساسي، جاري المتابعة بحذر.");
            })
        );
        // إجبار التفعيل الفوري لتخطي الانتظار وفرض السيطرة السريعة
        self.skipWaiting();
    } catch (error) {
        reportSWError(error, 'install_event_master');
    }
});

// 2. مرحلة التفعيل: مسح النسخ القديمة وتطهير الذاكرة
self.addEventListener('activate', (event) => {
    try {
        console.log("BoseSweets SW 👑: بدء التفعيل وتنظيف الذاكرة القديمة...");
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // مسح أي ذاكرة لا تتطابق مع الإصدار الجديد V28.5
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log(`BoseSweets SW: إزالة الذاكرة المتقادمة [${cacheName}] للحفاظ على أداء العلامة.`);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }).then(() => {
                console.log("BoseSweets SW 👑: تمت عملية التطهير. إعلان السيطرة على المتصفح.");
                return self.clients.claim();
            }).catch(error => {
                reportSWError(error, 'activate_event_cleanup');
            })
        );
    } catch (error) {
        reportSWError(error, 'activate_event_master');
    }
});

// 3. مرحلة استقبال الأوامر الإدارية: التحكم السيادي في محرك التخزين
self.addEventListener('message', (event) => {
    try {
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
                    }).catch(err => reportSWError(err, 'message_purge_cache'));
                });
            }
        }
    } catch (error) {
        reportSWError(error, 'message_event_handler');
    }
});

// 4. مرحلة الاعتراض الشبكي (Fetch Interceptor): التوجيه الذكي للطلبات
self.addEventListener('fetch', (event) => {
    try {
        // تجاهل الطلبات التي ليست GET (مثل POST الخاصة بإضافة الطلبات)
        if (event.request.method !== 'GET') return;

        const requestUrl = new URL(event.request.url);

        // 🛡️ درع الحماية السيادي: منع التدخل تماماً في قواعد البيانات والخوادم الخارجية
        const excludedDomains = [
            'firestore.googleapis.com',
            'firebasestorage.googleapis.com',
            'identitytoolkit.googleapis.com',
            'securetoken.googleapis.com',
            'cloudfunctions.net',
            'generativelanguage.googleapis.com' // إضافة نطاقات الذكاء الصناعي لضمان الحيوية
        ];

        const isExcluded = excludedDomains.some(domain => requestUrl.hostname.includes(domain));
        if (isExcluded) return;

        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // استراتيجية (Stale-While-Revalidate)
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // التأكد من صحة الاستجابة قبل إضافتها للذاكرة المؤقتة الديناميكية
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(event.request, responseToCache);
                        }).catch(cacheErr => {
                            // عدم التبليغ عن أخطاء الكاش الصغيرة لتجنب إغراق المستشعر
                        });
                    }
                    return networkResponse;
                }).catch((fetchError) => {
                    // في حالة انقطاع الإنترنت بالكامل، يتم توجيه العميل للصفحة المخصصة (Offline)
                    if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
                        console.warn("BoseSweets SW Note: انقطاع تام في الشبكة، توجيه العميل للوضع الآمن.");
                        return caches.match(OFFLINE_URL);
                    }
                    // إذا كان الخطأ ليس بسبب الشبكة (عطل برمجي)، نقوم بالتبليغ
                    if (!navigator.onLine) {
                         // لا بلاغ في حالة الأوفلاين الطبيعي
                    } else {
                        reportSWError(fetchError, 'fetch_interceptor_network_failure', event.request.url);
                    }
                });

                // إرجاع النسخة المخزنة فوراً لسرعة البرق، وتحديثها بصمت في الخلفية
                return cachedResponse || fetchPromise;
            }).catch(matchErr => {
                reportSWError(matchErr, 'fetch_interceptor_match_failure');
                return fetch(event.request);
            })
        );
    } catch (error) {
        reportSWError(error, 'fetch_event_master');
    }
});