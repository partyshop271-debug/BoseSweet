/**
 * season-themes.js - مكتبة الـ Theme Presets
 * =====================================================================
 * 🎨👑 [Theme Engine - المستوى الأول]: الملف ده بيانات بس، مفيهوش أي منطق
 * تطبيق (ده شغل js/season-theme-engine.js). كل مفتاح هنا preset كامل قابل
 * للاستخدام مباشرة أو الدمج مع تخصيص من لوحة التحكم مستقبلًا (عبر
 * season.themePreset في بيانات المناسبة).
 *
 * إضافة preset جديد = إضافة مفتاح جديد هنا بس - من غير أي تعديل في
 * season-theme-engine.js ولا core-engine.js ولا أي حتة تانية.
 *
 * شكل كل preset:
 *   id          - نفس المفتاح، للرجوع إليه من data-bose-theme في الـ CSS
 *   name        - اسم عرض بالعربي (لوحة التحكم/تصحيح الأخطاء)
 *   palette     - الألوان الأساسية (كل الحقول اختيارية إلا accent)
 *   gradient    - تدرج للعناصر البارزة (بانر، أزرار مميزة)
 *   softGradient- تدرج ناعم جدًا للخلفيات (بانر المناسبة، قسم الهيرو)
 *   decorative  - إعدادات الطبقة الزخرفية (pattern/opacity/intensity)
 *   badgeText   - نص شارة المنتج الافتراضي (بالإنجليزي زي طلبها، تقدر تتغير لاحقًا)
 *   emoji       - إيموجي احتياطي بس (مش أساس التصميم - أولوية للألوان والتدرجات)
 *
 * ⚠️ [قاعدة "Luxury first, Season second" - قاعدة 3 و28 في المواصفة]: أي
 * preset جديد لازم يلتزم بـ:
 * - primary/secondary درجات غامقة/فاخرة (مش ألوان صارخة/كرتونية)
 * - decorative.opacity منخفض جدًا (0.04-0.09) - زخرفة خلفية مش تصميم أساسي
 * - decorative.intensity: "subtle" هي الافتراضي المفضّل؛ "medium" بس في
 *   المناسبات الكبرى (رمضان/العيدين/رأس السنة) ولو موافق عليها بصريًا الأول
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.BoseSeasonThemes = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    return {
        "new-year-luxury": {
            id: "new-year-luxury",
            name: "رأس السنة الفاخر",
            palette: {
                primary: "#6E1F2F",       // Primary Burgundy - الأزرار والريبون والعناصر البارزة
                secondary: "#B9924A",     // Warm Gold - حدود وتفاصيل ثانوية على خلفية فاتحة
                accent: "#6E1F2F",        // 🛡️ [قرار إتاحة محسوب]: نفس البرجيندي - تباينه مع الأبيض 11:1 (آمن
                                          // جدًا). الشامبين جولد (#D6B36A) تباينه مع الأبيض 2:1 بس - فاشل تمامًا
                                          // كخلفية لنص أبيض، فمينفعش يتحط هنا رغم إنه أجمل بصريًا - مكانه الصح
                                          // نص/تفاصيل على خلفية غامقة (زي الشريط العلوي) مش accent عام.
                deepPrimary: "#4A101D",   // Deep Burgundy - تدرجات وhover غامق
                wine: "#7B2638",          // Wine - لمسة تدرج ثانية
                champagneGold: "#D6B36A", // Champagne Gold - نص/حدود على خلفية غامقة بس
                dark: "#171316",          // charcoal غامق جدًا - عناوين زخرفية بس
                light: "#FFF8ED",         // Ivory دافئة
                background: "#FFF8ED",
                surface: "#FFFFFF",
                text: null,               // null = يفضل لون بوسي الأساسي - قاعدة "النص متتلونش"
                mutedText: "rgba(23, 19, 22, 0.62)",
                border: "#B9924A",
                shadow: "rgba(110, 31, 47, 0.18)",
            },
            gradient: "linear-gradient(135deg, #6E1F2F, #4A101D)",
            softGradient: "linear-gradient(135deg, rgba(185, 146, 74, 0.14), #FFF8ED)",
            decorative: {
                pattern: "winter-stars-snow",
                opacity: 0.08,
                intensity: "high", // رأس السنة مناسبة كبرى - وضوح أعلى من الافتراضي المتحفظ لمناسبات تانية
                layers: ["winter-snow", "winter-stars", "winter-sparkles", "winter-santa", "winter-snowman", "winter-gifts", "winter-ornaments"],
            },
            badgeText: "New Year Collection",
            emoji: "✨",
        },
    };
});
