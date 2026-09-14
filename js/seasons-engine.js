/**
 * seasons-engine.js - محرك بانر المناسبة الشغالة على الصفحة الرئيسية
 * =====================================================================
 * بيقرا المناسبة الشغالة دلوقتي (لو في واحدة) عبر window.getActiveBoseSeason()
 * (معرّفة في core-engine.js، مشتركة مع شارة المنتجات ورسالة الشريط العلوي
 * ورسالة السلة). لو مفيش مناسبة شغالة، أو المناسبة الشغالة مفيهاش بيانات
 * بانر حقيقية (عنوان أو صورة/إيموجي)، القسم بيفضل مخفي زي ما هو افتراضيًا
 * في index.html.
 *
 * 🎉 [تصميم بصري بالإيموجي بدل الصورة]: لحد ما تتحط صور حقيقية للمنتجات لكل
 * مناسبة، البانر بيعرض لوحة احتفالية زخرفية مبنية من إيموجي المناسبة
 * (banner.emoji) بدل مساحة فاضية - إيموجي كبيرة في النص + نفس الإيموجي متكرر
 * كخلفية خفيفة (تأثير قصاصات ورق احتفالية) بدل أي صورة فوتوغرافية.
 */
(function () {
    "use strict";

    function buildEmojiVisualHTML(emoji, safeName) {
        // نفس الإيموجي بيتكرر كخلفية زخرفية خفيفة (تأثير قصاصات احتفالية) خلف
        // الإيموجي الرئيسي الكبير في النص - كله CSS/نص بس، من غير أي صورة.
        // 🛡️ [مستخدمة بس للمواسم من غير themePreset - توافق قديم]: المواسم
        // اللي عندها Theme كامل (زي رأس السنة الفاخر) بتستخدم
        // buildRefinedVisualHTML تحت بدالها - التصميم ده اتنقد إنه "مبعثر ووحش"
        // فاتسحب من أي مناسبة عندها Theme حقيقي.
        const confettiCount = 10;
        let confettiHtml = "";
        for (let i = 0; i < confettiCount; i++) {
            confettiHtml += `<span class="bose-season-confetti-piece" style="--i:${i};">${emoji}</span>`;
        }
        return `
            <div class="bose-season-banner-visual" aria-hidden="true">
                <div class="bose-season-confetti-field">${confettiHtml}</div>
                <span class="bose-season-hero-emoji">${emoji}</span>
            </div>
        `;
    }

    /**
     * 🎨👑 [تصميم مكرّر للمواسم اللي عندها Theme Preset كامل]: دايرة واحدة
     * أنيقة بحد ذهبي رفيع وإيموجي واحد بس في النص - من غير أي قصاصات مبعثرة.
     * الزخرفة الخفيفة (نقط الضوء) بتيجي من CSS نفسه (season-themes.css) على
     * الكارت كله مش هنا، فمفيش تكرار أو ازدحام بصري.
     * @param {string} emoji
     * @returns {string}
     */
    function buildRefinedVisualHTML(emoji) {
        return `
            <div class="bose-season-banner-visual bose-season-banner-visual-refined" aria-hidden="true">
                <span class="bose-season-hero-emoji">${emoji}</span>
            </div>
        `;
    }

    function buildCountdownHTML(season) {
        if (!season.recurrence || !window.BoseSeasonDates) return "";
        const today = new Date();
        const w = window.BoseSeasonDates.computeActiveWindow(season.recurrence, today);
        if (!w) return "";
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        if (todayStr > w.coreEndDate) return ""; // المناسبة عدّت فعليًا - مفيش عدّاد بعد كده

        if (todayStr >= w.coreStartDate) {
            // المناسبة نفسها جارية دلوقتي (يوم واحد أو فترة زي رمضان)
            return `<div class="bose-season-countdown"><i class="fa-solid fa-sparkles"></i> ${window.escapeBoseHTML(season.name)} جارية الآن!</div>`;
        }

        const msPerDay = 24 * 60 * 60 * 1000;
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const coreStart = new Date(w.coreStartDate + "T00:00:00");
        const daysLeft = Math.round((coreStart - startOfToday) / msPerDay);
        if (daysLeft <= 0) return "";
        const dayWord = daysLeft === 1 ? "يوم واحد" : daysLeft === 2 ? "يومين" : daysLeft <= 10 ? `${daysLeft} أيام` : `${daysLeft} يوم`;
        return `<div class="bose-season-countdown"><i class="fa-solid fa-hourglass-half"></i> باقي ${dayWord} على ${window.escapeBoseHTML(season.name)}</div>`;
    }

    function renderSeasonBanner() {
        const mount = document.getElementById("bose-season-banner-mount");
        if (!mount) return;

        // 🧪 [Theme Debug Mode]: لو فيه preview شغال (?seasonPreview=...)، البانر
        // بيدوّر على أي مناسبة حقيقية في البيانات بنفس الـ themePreset ده
        // ويستخدم محتواها - عشان تجربة المعاينة تبقى كاملة (لون + محتوى فعلي)
        // مش بس الألوان، حتى لو المناسبة الحقيقية مش شغالة بتاريخ اليوم.
        const previewId = window.BoseSeasonThemeEngine ? window.BoseSeasonThemeEngine.getPreviewThemeId() : null;
        let season = window.getActiveBoseSeason ? window.getActiveBoseSeason() : null;
        if (previewId && window.BoseStoreData && Array.isArray(window.BoseStoreData.seasons)) {
            const previewSeason = window.BoseStoreData.seasons.find((s) => s.themePreset === previewId);
            if (previewSeason) season = previewSeason;
        }

        const banner = season && season.banner;
        const hasContent = banner && (banner.title || banner.image || banner.emoji);
        if (!hasContent) {
            mount.hidden = true;
            mount.innerHTML = "";
            return;
        }

        const e = window.escapeBoseHTML;

        // 🎉 [سنة ديناميكية - قاعدة 17]: أي {year} في نص البانر/الشارة بيتستبدل
        // بالسنة الفعلية للمناسبة (من تاريخها الحقيقي المحسوب، مش سنة مكتوبة
        // يدوي في القاعدة) - يفضل صح كل سنة من غير أي تعديل.
        function substituteYear(str) {
            if (!str || str.indexOf("{year}") === -1) return str;
            let year = new Date().getFullYear();
            if (season.recurrence && window.BoseSeasonDates) {
                const core = window.BoseSeasonDates.getOccasionCoreDates(season.recurrence, year);
                const w = window.BoseSeasonDates.computeActiveWindow(season.recurrence, new Date());
                if (w && w.coreStartDate) year = parseInt(w.coreStartDate.slice(0, 4), 10);
                else if (core && core.start) year = core.start.getFullYear();
            }
            return str.replace(/\{year\}/g, String(year));
        }

        const ctaHtml = (banner.cta && banner.target)
            ? `<a href="${e(banner.target)}" class="bose-season-banner-cta">${e(substituteYear(banner.cta))}</a>`
            : "";

        // صورة حقيقية لو موجودة (أولوية)، وإلا تصميم مكرّر لو عندها Theme كامل،
        // وإلا تصميم الإيموجي القديم (المواسم من غير themePreset)، وإلا مفيش وسائط خالص
        const visualHtml = banner.image
            ? `<div class="bose-season-banner-media"><img src="${window.optimizeBoseImageUrl ? window.optimizeBoseImageUrl(banner.image, 900) : e(banner.image)}" alt="${e(banner.title || season.name)}" loading="lazy"></div>`
            : banner.emoji
                ? (season.themePreset ? buildRefinedVisualHTML(banner.emoji) : buildEmojiVisualHTML(banner.emoji, e(banner.title || season.name)))
                : "";

        mount.innerHTML = `
            <div class="bose-season-banner">
                ${visualHtml}
                <div class="bose-season-banner-content">
                    ${buildCountdownHTML(season)}
                    ${banner.title ? `<h2>${e(substituteYear(banner.title))}</h2>` : ""}
                    ${banner.description ? `<p>${e(substituteYear(banner.description))}</p>` : ""}
                    ${ctaHtml}
                </div>
            </div>
        `;
        mount.hidden = false;

        // 🎨 [طبقة زخرفية حقيقية على البانر - SVG مش إيموجي]: بس للمواسم اللي
        // عندها Theme Preset كامل - لازم تتحط بعد بناء محتوى البانر (مش قبله)
        // عشان innerHTML فوق ميمسحهاش.
        if (season.themePreset && window.BoseSeasonThemeEngine && window.BoseSeasonDecorations) {
            const theme = window.BoseSeasonThemeEngine.resolveTheme(season);
            const bannerEl = mount.querySelector(".bose-season-banner");
            if (theme && theme.decorative && bannerEl) {
                window.BoseSeasonDecorations.renderInto(bannerEl, theme.decorative);
            }
        }
    }

    document.addEventListener("BoseDatabaseLoaded", renderSeasonBanner);
})();

