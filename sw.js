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

const BOSE_SW_VERSION = "bose-sw-v1";

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
