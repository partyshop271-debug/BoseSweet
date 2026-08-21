/**
 * loyalty-config.js — نقطة واحدة لقراءة إعدادات "نادي مكافآت بوسي"
 * (store_settings.loyalty) وتطبيعها بنفس القيم الافتراضية اللي بتستخدمها
 * لوحة التحكم بالظبط.
 *
 * 🛡️ [إصلاح جذري]: قبل كده كل صفحة (تيزر الرئيسية، rewards.html) كانت بتكتب
 * نسخة يدوية Hardcoded من نسب الخصم/مبلغ القسيمة/طول الدورة في الـ HTML/JS
 * بتاعتها، فمكنش فيه أي رابط حقيقي بينها وبين لوحة التحكم - أي تعديل من
 * الأدمن في loyalty-settings.html كان يتخزن في القاعدة لكن محدش في الواجهة
 * كان بيقرأه. دلوقتي كل صفحة تستدعي getBoseLoyaltyConfig() فتاخد نفس الأرقام
 * الحية اللي حفظتها لوحة التحكم، من مكان واحد بس - فأي صفحة جديدة تتبني
 * بعد كده تاخد نفس الرقم الصح تلقائيًا من غير ما تعيد كتابته.
 *
 * لازم يتحمّل بعد core-engine.js (عشان window.BoseStoreData يكون معرّف)
 * وقبل أي كود صفحة بيستخدم getBoseLoyaltyConfig/getSortedLoyaltyTiers.
 */
(function () {
    "use strict";

    // نفس الافتراضي بالظبط الموجود في admin/js/pages/loyalty-settings-page.js
    // وفي admin-data.js (getCustomerLoyaltyProfile) - لو الأدمن لسه محفظش
    // إعدادات مخصصة، الواجهة والقاعدة يفضلوا متفقين على نفس الأرقام.
    const DEFAULT_TIERS = { "3": 5, "5": 10, "7": 15 };

    function getBoseLoyaltyConfig() {
        const loyalty = (window.BoseStoreData && window.BoseStoreData.loyalty) || {};
        const hasCustomTiers = loyalty.tiers && typeof loyalty.tiers === "object" && Object.keys(loyalty.tiers).length > 0;

        return {
            enabled: loyalty.enabled !== false,
            cycleLength: Math.max(1, parseInt(loyalty.cycle_length, 10) || 7),
            tiers: hasCustomTiers ? loyalty.tiers : DEFAULT_TIERS,
            milestoneEvery: Math.max(1, parseInt(loyalty.milestone_every, 10) || 10),
            voucherAmount: (loyalty.voucher_amount === 0 || loyalty.voucher_amount) ? loyalty.voucher_amount : 300,
            voucherValidityMonths: parseInt(loyalty.voucher_validity_months, 10) || 2,
        };
    }

    /** بيرجّع الشرائح كمصفوفة مرتبة [{position, percent}] بدل الكائن الخام { "3": 5, ... } */
    function getSortedLoyaltyTiers(config) {
        const src = (config && config.tiers) || DEFAULT_TIERS;
        return Object.keys(src)
            .map((key) => ({ position: parseInt(key, 10), percent: src[key] }))
            .filter((tier) => !isNaN(tier.position))
            .sort((a, b) => a.position - b.position);
    }

    /** "شهر" / "شهرين" / "N شهور" - نفس صيغة الجمع العربي المصري المستخدمة في نصوص الموقع */
    function formatArabicMonths(count) {
        const n = parseInt(count, 10) || 0;
        if (n === 1) return "شهر";
        if (n === 2) return "شهرين";
        return `${n} شهور`;
    }

    /** "طلب" / "طلبات" - نفس منطق الجمع المستخدم في باقي كود الموقع */
    function formatArabicOrders(count) {
        return parseInt(count, 10) === 1 ? "طلب" : "طلبات";
    }

    window.getBoseLoyaltyConfig = getBoseLoyaltyConfig;
    window.getSortedLoyaltyTiers = getSortedLoyaltyTiers;
    window.formatArabicMonths = formatArabicMonths;
    window.formatArabicOrders = formatArabicOrders;
})();
