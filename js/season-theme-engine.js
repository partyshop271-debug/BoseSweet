/**
 * season-theme-engine.js - محرك تطبيق الـ Theme على الصفحة
 * =====================================================================
 * 🎨👑 [Theme Engine - فصل المسؤوليات]:
 *   js/season-dates.js       => يحسب التاريخ (متى؟)
 *   core-engine.js (pickActiveSeasonFrom) => يحدد المناسبة الشغالة (أنهي واحدة؟)
 *   js/season-theme-engine.js (الملف ده) => يطبّق الـ Theme (يبان إزاي؟)
 *
 * الملف ده هو الوحيد اللي بيكتب في متغيرات --bose-season-* و--bose-pink
 * و meta[theme-color] وattribute data-bose-theme على <html>. أي حتة تانية
 * في الموقع (CSS أو JS) المفروض "تقرأ" منهم بس.
 *
 * 🛡️ [توافق كامل مع البيانات القديمة]: مناسبة من غير season.themePreset
 * (زي الست مناسبات التانية المتظبطة قبل كده: عيد الحب، عيد الأم، رمضان،
 * الأضحى، رأس السنة الهجرية، المولد) بتتعامل بنفس الأسلوب القديم بالظبط -
 * لون واحد (season.accentColor) بيتحط في --bose-pink، من غير أي طبقة زخرفية
 * أو متغيرات إضافية. الشكل الجديد الكامل (palette/gradient/decorative) بس
 * للمناسبات اللي عندها themePreset معرّف صراحة.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.BoseSeasonThemeEngine = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    // كل أسماء المتغيرات اللي بيتحكم فيها المحرك ده - قائمة واحدة مركزية
    // عشان نقدر نمسحهم كلهم بسهولة لما مفيش مناسبة شغالة (رجوع كامل للافتراضي).
    const SEASON_VARS = [
        "--bose-season-primary", "--bose-season-secondary", "--bose-season-accent",
        "--bose-season-dark", "--bose-season-light", "--bose-season-bg",
        "--bose-season-surface", "--bose-season-text", "--bose-season-muted-text",
        "--bose-season-border-color", "--bose-season-shadow-color", "--bose-season-deep",
        "--bose-season-gradient", "--bose-season-soft-gradient", "--bose-season-pattern-opacity",
    ];

    let previewThemeId = null; // 🧪 [Debug Mode]: لو متظبط، بيتجاهل المناسبة الحقيقية ويفرض preset معين بصريًا بس

    /** @param {string} hex @returns {string|null} */
    function hexToRgbTriplet(hex) {
        if (!hex || typeof hex !== "string") return null;
        const m = hex.trim().replace(/^#/, "");
        const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
        if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
        return `${parseInt(full.slice(0, 2), 16)}, ${parseInt(full.slice(2, 4), 16)}, ${parseInt(full.slice(4, 6), 16)}`;
    }

    /**
     * بتحوّل مناسبة (season object) لـ theme object جاهز للتطبيق. لو عندها
     * themePreset معروف، بترجع الـ preset (ومعاه أي تخصيص من الأدمن مباشرة
     * على المناسبة - accentColor بياخد أولوية لو موجود، عشان لو الأدمن غيّر
     * اللون يدوي بعد ما اختارت preset، اختيارها اليدوي يفوز). لو من غير
     * themePreset، بترجع شكل "قديم" بسيط (لون واحد بس) - نفس السلوك اللي
     * كان شغال قبل الـ Theme Engine خالص.
     * @param {Object|null} season
     * @returns {Object|null}
     */
    function resolveTheme(season) {
        if (!season) return null;
        const themes = (typeof window !== "undefined" && window.BoseSeasonThemes) || {};

        if (season.themePreset && themes[season.themePreset]) {
            const preset = themes[season.themePreset];
            if (!season.accentColor || season.accentColor === preset.palette.accent) return preset;
            // الأدمن غيّرت اللون يدوي فوق الـ preset - نحترم اختيارها بس نسيب باقي الـ preset زي ما هو
            return Object.assign({}, preset, {
                palette: Object.assign({}, preset.palette, { accent: season.accentColor }),
            });
        }

        if (season.accentColor) {
            return {
                id: "legacy-accent-only",
                name: season.name || "مناسبة",
                palette: { primary: season.accentColor, accent: season.accentColor },
                gradient: `linear-gradient(135deg, ${season.accentColor}, ${season.accentColor})`,
                softGradient: `linear-gradient(135deg, ${season.accentColor}22, #FFFFFF)`,
                decorative: { opacity: 0, intensity: "none" },
            };
        }

        return null;
    }

    /**
     * بتطبّق theme object (أو بترجع الموقع لشكله الافتراضي لو null) - الدالة
     * الوحيدة اللي بتلمس فعليًا الـ DOM في الملف ده.
     * @param {Object|null} theme
     */
    function applyTheme(theme) {
        const el = document.documentElement;
        const themeMeta = document.querySelector('meta[name="theme-color"]');
        const heroSection = document.getElementById("hero-section");

        if (!theme) {
            SEASON_VARS.forEach((v) => el.style.removeProperty(v));
            el.style.removeProperty("--bose-pink");
            el.style.removeProperty("--bose-pink-rgb");
            el.removeAttribute("data-bose-theme");
            if (themeMeta) themeMeta.content = "#FF91A4";
            if (heroSection && window.BoseSeasonDecorations) window.BoseSeasonDecorations.clearFrom(heroSection);
            return;
        }

        const p = theme.palette || {};
        const setVar = (name, val) => { if (val) el.style.setProperty(name, val); else el.style.removeProperty(name); };

        setVar("--bose-season-primary", p.primary);
        setVar("--bose-season-secondary", p.secondary);
        setVar("--bose-season-accent", p.accent);
        setVar("--bose-season-dark", p.dark);
        setVar("--bose-season-light", p.light);
        setVar("--bose-season-bg", p.background);
        setVar("--bose-season-surface", p.surface);
        setVar("--bose-season-text", p.text); // null = بيتشال فيرجع للافتراضي (بوسي الأساسي) تلقائيًا
        setVar("--bose-season-muted-text", p.mutedText);
        setVar("--bose-season-border-color", p.border);
        setVar("--bose-season-shadow-color", p.shadow);
        setVar("--bose-season-deep", p.deepPrimary);
        setVar("--bose-season-gradient", theme.gradient);
        setVar("--bose-season-soft-gradient", theme.softGradient);
        setVar("--bose-season-pattern-opacity", theme.decorative ? theme.decorative.opacity : 0);

        // 🛡️ [توافق --bose-pink]: العنصر الأساسي (accent/primary) هو اللي
        // بيتحط في --bose-pink القديم - أي كود قديم (كل الـ 45 ملف اللي بيعتمد
        // عليه) بيستمر يشتغل بالظبط زي ما هو من غير أي تعديل.
        const accentColor = p.accent || p.primary;
        if (accentColor) {
            el.style.setProperty("--bose-pink", accentColor);
            const rgb = hexToRgbTriplet(accentColor);
            if (rgb) el.style.setProperty("--bose-pink-rgb", rgb);
        }

        el.setAttribute("data-bose-theme", theme.id || "");
        if (themeMeta) themeMeta.content = accentColor || "#FF91A4";

        // 🎨 [طبقة زخرفية حقيقية على قسم الهيرو - SVG مش إيموجي]: الهيرو عنصر
        // DOM ثابت موجود دايمًا بعد تحميل الصفحة، فالمحرك ده يقدر يحقن الزخرفة
        // فيه مباشرة - بعكس بانر المناسبة اللي محتواه بيتبني ديناميكيًا من
        // js/seasons-engine.js (هي المسؤولة عن حقن الزخرفة في البانر بنفسها
        // بعد ما تبني محتواه، عشان تترتيب صح - راجع renderSeasonBanner هناك).
        function decorateHero() {
            if (heroSection && theme.decorative && window.BoseSeasonDecorations) {
                window.BoseSeasonDecorations.renderInto(heroSection, theme.decorative);
            }
        }
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", decorateHero, { once: true });
        } else {
            decorateHero();
        }
    }

    /**
     * نقطة الدخول العادية - core-engine.js بينادي الدالة دي بالمناسبة الشغالة
     * (النتيجة من pickActiveSeasonFrom) في كل مرة البيانات بتتحمل أو تتغيّر.
     * @param {Object|null} season
     */
    function applyForSeason(season) {
        if (previewThemeId) {
            const themes = (typeof window !== "undefined" && window.BoseSeasonThemes) || {};
            applyTheme(themes[previewThemeId] || null);
            return;
        }
        applyTheme(resolveTheme(season));
    }

    /**
     * 🧪 [Theme Debug Mode]: تفعيل preset معين يدوي بغض النظر عن المناسبة
     * الحقيقية - للمطور/الأدمن بس وقت الاختبار. مش بيتخزن في أي مكان (مش
     * localStorage ولا قاعدة بيانات) فمش بيأثر على أي زائر حقيقي تاني -
     * بيرجع لطبيعته بمجرد ما الصفحة تتقفل أو تتعمل refresh من غير باراميتر
     * ?seasonPreview في اللينك.
     * @param {string} themeId
     */
    function previewTheme(themeId) {
        previewThemeId = themeId;
        const themes = (typeof window !== "undefined" && window.BoseSeasonThemes) || {};
        applyTheme(themes[themeId] || null);
    }

    function clearPreview() {
        previewThemeId = null;
    }

    // 🧪 [تفعيل تلقائي عبر رابط]: ?seasonPreview=new-year-luxury في أي صفحة
    // بيفرض الـ theme ده بصريًا - غير مخزّن، مؤقت لمدة تحميل الصفحة دي بس.
    if (typeof window !== "undefined") {
        try {
            const fromUrl = new URLSearchParams(window.location.search).get("seasonPreview");
            if (fromUrl) previewThemeId = fromUrl;
        } catch (e) { /* تجاهل - مفيش تأثير على أي زائر حقيقي */ }
    }

    function getPreviewThemeId() {
        return previewThemeId;
    }

    return { applyForSeason, resolveTheme, previewTheme, clearPreview, getPreviewThemeId };
});

// 🧪 [اختصار سهل للتجربة من الـ console]: window.BoseSeasonPreview("ramadan-luxury")
// بدل ما تكتبي window.BoseSeasonThemeEngine.previewTheme("...") كل مرة.
if (typeof window !== "undefined") {
    window.BoseSeasonPreview = function (themeId) {
        if (window.BoseSeasonThemeEngine) window.BoseSeasonThemeEngine.previewTheme(themeId);
    };
}

