/**
 * loyalty-config.js - إعدادات خصم الولاء التلقائي (بتتقرا من store_settings.loyalty في القاعدة).
 *
 * 🎁 [نظام الولاء بعد التبسيط]: مفيش قسائم ولا أكواد ولا كوبونات ولا بطاقات هدايا. الولاء بقى
 * خصم نسبة مئوية تلقائي بيتطبق من السيرفر على طلب العميلة حسب ترتيب طلباتها المسلّمة جوه "دورة":
 *   - cycle_length : طول الدورة (عدد الطلبات قبل ما العدّاد يبدأ من الأول)
 *   - tiers        : { ترتيب_الطلب_في_الدورة : نسبة_الخصم }  مثال { "4": 5, "8": 10, "12": 15 }
 *   - enabled      : تشغيل/إيقاف النظام كله
 *
 * ⚠️ [مهم - ترتيب التحميل]: الملف ده بيعرّف دوال بس، ولازم يتحمّل *قبل* core-engine.js في
 * الصفحات اللي بتعرض الولاء (index.html / rewards.html)، لأن core-engine.js ممكن يطلق حدث
 * BoseDatabaseLoaded بشكل متزامن أول ما البيانات تجهز.
 */
(function () {
    "use strict";

    const DEFAULT_TIERS = { "4": 5, "8": 10, "12": 15 };

    function getBoseLoyaltyConfig() {
        const loyalty = (window.BoseStoreData && window.BoseStoreData.loyalty) || {};
        const hasCustomTiers = loyalty.tiers && typeof loyalty.tiers === "object" && Object.keys(loyalty.tiers).length > 0;

        return {
            enabled: loyalty.enabled !== false,
            cycleLength: Math.max(1, parseInt(loyalty.cycle_length, 10) || 12),
            tiers: hasCustomTiers ? loyalty.tiers : DEFAULT_TIERS,
        };
    }

    // الشرايح مرتّبة تصاعدياً: [{ position: 4, percent: 5 }, ...]
    function getSortedLoyaltyTiers(config) {
        const src = (config && config.tiers) || DEFAULT_TIERS;
        return Object.keys(src)
            .map((key) => ({ position: parseInt(key, 10), percent: src[key] }))
            .filter((tier) => !isNaN(tier.position))
            .sort((a, b) => a.position - b.position);
    }

    function formatArabicOrders(count) {
        return parseInt(count, 10) === 1 ? "طلب" : "طلبات";
    }

    window.getBoseLoyaltyConfig = getBoseLoyaltyConfig;
    window.getSortedLoyaltyTiers = getSortedLoyaltyTiers;
    window.formatArabicOrders = formatArabicOrders;
})();
