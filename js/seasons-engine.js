/**
 * seasons-engine.js - محرك بانر المناسبة الشغالة على الصفحة الرئيسية
 * =====================================================================
 * بيقرا المناسبة الشغالة دلوقتي (لو في واحدة) عبر window.getActiveBoseSeason()
 * (معرّفة في core-engine.js، مشتركة مع شارة المنتجات ورسالة الشريط العلوي
 * ورسالة السلة). لو مفيش مناسبة شغالة، أو المناسبة الشغالة مفيهاش بيانات
 * بانر حقيقية (عنوان أو صورة)، القسم بيفضل مخفي زي ما هو افتراضيًا في index.html.
 */
(function () {
    "use strict";

    function renderSeasonBanner() {
        const mount = document.getElementById("bose-season-banner-mount");
        if (!mount) return;

        const season = window.getActiveBoseSeason ? window.getActiveBoseSeason() : null;
        const banner = season && season.banner;
        const hasContent = banner && (banner.title || banner.image);
        if (!hasContent) {
            mount.hidden = true;
            mount.innerHTML = "";
            return;
        }

        const e = window.escapeBoseHTML;
        const accentStyle = season.accentColor ? ` style="--bose-season-accent:${e(season.accentColor)};"` : "";
        const ctaHtml = (banner.cta && banner.target)
            ? `<a href="${e(banner.target)}" class="bose-season-banner-cta">${e(banner.cta)}</a>`
            : "";

        mount.innerHTML = `
            <div class="bose-season-banner"${accentStyle}>
                ${banner.image ? `<div class="bose-season-banner-media"><img src="${window.optimizeBoseImageUrl ? window.optimizeBoseImageUrl(banner.image, 900) : e(banner.image)}" alt="${e(banner.title || season.name)}" loading="lazy"></div>` : ""}
                <div class="bose-season-banner-content">
                    ${banner.title ? `<h2>${e(banner.title)}</h2>` : ""}
                    ${banner.description ? `<p>${e(banner.description)}</p>` : ""}
                    ${ctaHtml}
                </div>
            </div>
        `;
        mount.hidden = false;
    }

    document.addEventListener("BoseDatabaseLoaded", renderSeasonBanner);
})();
