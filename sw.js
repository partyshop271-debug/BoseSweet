/**
 * sw.js - Service Worker بسيط وآمن لتطبيق حلويات بوسي (PWA)
 * 👑 [مرحلة جديدة - تحميل التطبيق]: الهدف الوحيد من الملف ده هو استيفاء شرط
 * "قابلية التثبيت" (installability) اللي متصفحات Chrome/Android بتطلبه عشان
 * تسمح بظهور نافذة تثبيت التطبيق (beforeinstallprompt) - بدون Service Worker
 * مسجّل، زرار "ثبّتي التطبيق" مش هيشتغل خالص.
 *
 * ⚠️ [مهم]: الاستراتيجية هنا مقصودة تكون "شبه معطّلة" (network-first بدون أي
 * تخزين مؤقت حقيقي) لأن بيانات المتجر (المنتجات/الأسعار/العروض) بتيجي حية من
 * Supabase وأي كاش قديم للـ HTML/JS ممكن يعرض للعميل أسعار أو بيانات قديمة.
 * زودنا كاش بسيط جداً بس للصور الثابتة (اللوجو) عشان تفتح بسرعة حتى لو
 * الإنترنت بطيء، وسيبنا كل حاجة تانية تروح للسيرفر مباشرة زي ما هي.
 */

const BOSE_SW_VERSION = "bose-sw-v2";

// 🔔 [نظام الإشعارات]: أيقونة افتراضية لو الإشعار الجاي من السيرفر متضمنش
// أيقونة (نفس شعار المتجر الافتراضي المستخدم في api/manifest.js).
const BOSE_PUSH_DEFAULT_ICON =
  "https://res.cloudinary.com/dyx4w0dr1/image/upload/f_auto,q_auto,w_192,h_192,c_fill,g_auto,b_white/v1780054759/logo_igggsb.png";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // لا نتدخل في أي طلب لغير GET (زي طلبات Supabase POST/PATCH) خالص
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

/**
 * 🔔 [نظام الإشعارات - جزء 1]: استقبال رسالة Push جاية من فنكشن
 * send-push-notification (أدمن ضغط "إرسال" من لوحة التحكم) وعرضها كإشعار
 * حقيقي على شاشة العميل، حتى لو الموقع مقفول تماماً - ده بالظبط اللي بيفرّق
 * بين "أيقونة عادية" و"تطبيق فعلي" بيتواصل مع العميل.
 * الرسالة بتوصل كـ JSON: { title, body, url, icon } (شايفها من الفنكشن).
 */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "حلويات بوسي", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "حلويات بوسي";
  const options = {
    body: data.body || "",
    icon: data.icon || BOSE_PUSH_DEFAULT_ICON,
    badge: data.icon || BOSE_PUSH_DEFAULT_ICON,
    dir: "rtl",
    lang: "ar",
    data: { url: data.url || "/" },
    // 🛎️ [تنبيهات الطلبات للأدمن]: الإشعارات المهمة بتفضل ظاهرة لحد ما تتفتح (requireInteraction)،
    // وبتهتز، وبتستبدل بعضها بنفس الـtag بدل ما تتكدّس. الحقول دي اختيارية - إشعارات
    // العميلات العادية مبتبعتهاش فمفيش أي تغيير في سلوكها.
    tag: data.tag || undefined,
    renotify: !!(data.renotify && data.tag),
    requireInteraction: !!data.requireInteraction,
    vibrate: Array.isArray(data.vibrate) ? data.vibrate : undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * 🔔 [نظام الإشعارات - جزء 2]: العميل بيدوس على الإشعار -> نفتحله الرابط
 * المرتبط بيه (أو نركّز على تبويب مفتوح أصلاً لو موجود بدل ما نفتح تبويب جديد).
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      const target = new URL(targetUrl, self.location.origin);
      const goTo = (client) =>
        client.focus().then((focused) => {
          const c = focused || client;
          // نفس الصفحة بس بـ query مختلف (مثلاً ?open=رقم-الطلب) → نودّيه للرابط الجديد
          if (new URL(c.url).search !== target.search && "navigate" in c) return c.navigate(target.href);
          return c;
        });

      // 1) نفس الصفحة مفتوحة → نركّز عليها
      for (const client of clientsList) {
        const u = new URL(client.url);
        if (u.origin === target.origin && u.pathname === target.pathname && "focus" in client) return goTo(client);
      }
      // 2) إشعار أدمن وفيه تبويب أدمن مفتوح → نستخدمه بدل ما نفتح تبويب جديد
      if (target.pathname.startsWith("/admin/")) {
        for (const client of clientsList) {
          const u = new URL(client.url);
          if (u.origin === target.origin && u.pathname.startsWith("/admin/") && "focus" in client) {
            return client.focus().then((focused) => ((focused || client).navigate ? (focused || client).navigate(target.href) : focused));
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target.href);
      }
    })
  );
});
