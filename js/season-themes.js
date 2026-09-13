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
                primary: "#7A2331",       // Deep Burgundy - الأزرار والعناصر البارزة
                secondary: "#C6A15B",     // Soft Gold - حدود وتفاصيل ثانوية (على خلفية فاتحة بس)
                accent: "#7A2331",        // 🛡️ [قرار إتاحة]: نفس البرغندي مش الدهبي - الدهبي (#C6A15B) نسبة
                                          // تباينه مع النص الأبيض 2.43:1 بس (فشل WCAG AA اللي بيحتاج 4.5:1)،
                                          // والمتغيّر ده هو اللي بيتغذى منه --bose-pink فيغذي بيه كل زرار/شريط
                                          // نص أبيض في الموقع - البرغندي 9.94:1 آمن تمامًا. الدهبي لسه موجود
                                          // ومستخدم في الحدود والتدرجات وخلفيات فاتحة بس.
                dark: "#221F1A",          // charcoal دافئ - للعناوين الزخرفية بس (مش نص الموقع العادي)
                light: "#FDFBF6",         // Ivory
                background: "#FDFBF6",    // خلفية القسم الموسمي (بانر/هيرو) - Ivory دافئ مش أبيض فاقع
                surface: "#FFFFFF",
                text: null,               // null = يفضل لون بوسي الأساسي (--bose-black) - قاعدة "النص متتلونش"
                mutedText: "rgba(34, 31, 26, 0.62)",
                border: "#C6A15B",
                shadow: "rgba(122, 35, 49, 0.16)",
            },
            gradient: "linear-gradient(135deg, #7A2331, #C6A15B)",
            softGradient: "linear-gradient(135deg, rgba(198, 161, 91, 0.14), #FDFBF6)",
            decorative: {
                pattern: "stars-sparkle",
                opacity: 0.07,
                intensity: "subtle",
            },
            badgeText: "New Year Collection",
            emoji: "✨",
        },
    };
});
