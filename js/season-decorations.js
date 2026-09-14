/**
 * season-decorations.js - الطبقة الزخرفية الحقيقية (SVG، مش إيموجي)
 * =====================================================================
 * 🎨👑 [قرار مهم بعد مراجعتها]: النسخة الأولى من الـ Theme Engine اعتمدت على
 * CSS بس (نقط ضوء خفيفة) - رفضتها لإنها "مجرد تغيير لون" ومحتاجة عناصر بصرية
 * حقيقية (ثلج، نجوم، بابا نويل، رجل الثلج، هدايا) مبنية بـ SVG/illustration
 * حقيقي، مش إيموجي. الملف ده مسؤول عن الطبقة دي بالكامل.
 *
 * كل عنصر زخرفي هنا SVG مرسوم بخطوط بسيطة/هندسية (minimal line-art) - أسلوب
 * فاخر/تحريري (editorial) مقصود بدل تفاصيل كرتونية كتير.
 *
 * كل عنصر بيتحط بـ:
 * - pointer-events: none (مفيش أي تفاعل - زخرفة بس)
 * - aria-hidden="true" (مش محتوى حقيقي)
 * - position مدروسة (زوايا محددة، مش عشوائي - "composition مش عناصر منفصلة")
 * - عدد محدود حسب intensity (low/medium/high) - أداء خفيف مضمون
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.BoseSeasonDecorations = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    const SNOWFLAKE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
        <line x1="12" y1="1" x2="12" y2="23"/><line x1="4" y1="6.5" x2="20" y2="17.5"/><line x1="20" y1="6.5" x2="4" y2="17.5"/>
        <line x1="12" y1="1" x2="8.5" y2="4.5"/><line x1="12" y1="1" x2="15.5" y2="4.5"/>
        <line x1="12" y1="23" x2="8.5" y2="19.5"/><line x1="12" y1="23" x2="15.5" y2="19.5"/>
    </svg>`;

    const STAR_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0 C12.6 6.5 13.3 9.5 17 12 C13.3 14.5 12.6 17.5 12 24 C11.4 17.5 10.7 14.5 7 12 C10.7 9.5 11.4 6.5 12 0 Z"/>
    </svg>`;

    const SPARKLE_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 L13.2 9.5 L21 12 L13.2 14.5 L12 22 L10.8 14.5 L3 12 L10.8 9.5 Z"/>
        <circle cx="19" cy="4" r="1.4"/><circle cx="4" cy="19" r="1"/>
    </svg>`;

    const GIFT_SVG = `<svg viewBox="0 0 40 40" fill="none">
        <rect x="6" y="17" width="28" height="19" rx="1.5" fill="#FFF8ED" stroke="currentColor" stroke-width="1.6"/>
        <rect x="6" y="17" width="28" height="7" fill="currentColor" fill-opacity="0.9"/>
        <line x1="20" y1="17" x2="20" y2="36" stroke="#FFF8ED" stroke-width="2.5"/>
        <path d="M20 17 C15 17 12.5 12 15 9.5 C17.5 7.5 20 11.5 20 17 Z" fill="currentColor"/>
        <path d="M20 17 C25 17 27.5 12 25 9.5 C22.5 7.5 20 11.5 20 17 Z" fill="currentColor"/>
    </svg>`;

    const ORNAMENT_SVG = `<svg viewBox="0 0 24 30" fill="none" stroke="currentColor" stroke-width="1.4">
        <line x1="12" y1="1" x2="12" y2="7"/>
        <rect x="9" y="0.5" width="6" height="3" rx="1"/>
        <circle cx="12" cy="18" r="9" fill="currentColor" fill-opacity="0.14"/>
        <circle cx="12" cy="18" r="9"/>
        <path d="M4.5 14 Q12 17 19.5 14" stroke-width="1"/>
    </svg>`;

    /**
     * 🎅 [بابا نويل - أسلوب هندسي بسيط مقصود]: شكل أيقوني بالطاقية والفرو
     * واللحية بخطوط بسيطة - أسلوب هوليداي فاخر مش رسوم متحركة للأطفال.
     */
    const SANTA_SVG = `<svg viewBox="0 0 70 90" fill="none">
        <path d="M20 88 L20 60 Q20 44 35 44 Q50 44 50 60 L50 88 Z" fill="#6E1F2F"/>
        <rect x="16" y="82" width="38" height="7" rx="2" fill="#171316"/>
        <rect x="30" y="80" width="10" height="9" rx="1.5" fill="#B9924A"/>
        <circle cx="35" cy="34" r="15" fill="#EBC7A2"/>
        <path d="M20 34 Q20 52 35 54 Q50 52 50 34 Q50 44 35 46 Q20 44 20 34 Z" fill="#FFFFFF"/>
        <path d="M22 26 Q35 16 48 26 Q50 12 35 8 Q20 12 22 26 Z" fill="#6E1F2F"/>
        <path d="M20 24 Q35 15 50 24" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
        <circle cx="50" cy="10" r="4.5" fill="#FFFFFF"/>
        <circle cx="30" cy="32" r="1.4" fill="#171316"/><circle cx="40" cy="32" r="1.4" fill="#171316"/>
        <circle cx="35" cy="37" r="2.6" fill="#D98A6B"/>
    </svg>`;

    /** ⛄ [رجل الثلج - 3 دوائر كلاسيكي بخطوط أنيقة رفيعة] */
    const SNOWMAN_SVG = `<svg viewBox="0 0 60 95" fill="none">
        <circle cx="30" cy="70" r="21" fill="#FFFFFF" stroke="#B9924A" stroke-width="1.4"/>
        <circle cx="30" cy="41" r="15.5" fill="#FFFFFF" stroke="#B9924A" stroke-width="1.4"/>
        <circle cx="30" cy="18" r="10.5" fill="#FFFFFF" stroke="#B9924A" stroke-width="1.4"/>
        <rect x="20" y="2" width="20" height="5.5" rx="1" fill="#171316"/>
        <rect x="23" y="-4" width="14" height="9" fill="#171316"/>
        <path d="M17 27 Q30 33 43 27 L43 32 Q30 38 17 32 Z" fill="#6E1F2F"/>
        <path d="M40 30 L46 40 L41 39 Z" fill="#6E1F2F"/>
        <circle cx="25.5" cy="16" r="1.3" fill="#171316"/><circle cx="34.5" cy="16" r="1.3" fill="#171316"/>
        <path d="M30 18.5 L38 20.5 L30 22 Z" fill="#B9924A"/>
        <circle cx="30" cy="39" r="1.1" fill="#171316"/><circle cx="30" cy="44" r="1.1" fill="#171316"/><circle cx="30" cy="49" r="1.1" fill="#171316"/>
    </svg>`;

    const LAYER_ASSETS = {
        "winter-snow": { svg: SNOWFLAKE_SVG, className: "bsn-snowflake", color: "#FFFFFF", counts: { low: 4, medium: 8, high: 14 } },
        "winter-stars": { svg: STAR_SVG, className: "bsn-star", color: "var(--bose-season-secondary, #B9924A)", counts: { low: 2, medium: 4, high: 6 } },
        "winter-sparkles": { svg: SPARKLE_SVG, className: "bsn-sparkle", color: "var(--bose-season-secondary, #B9924A)", counts: { low: 2, medium: 3, high: 5 } },
        "winter-ornaments": { svg: ORNAMENT_SVG, className: "bsn-ornament", color: "var(--bose-season-primary, #6E1F2F)", counts: { low: 1, medium: 2, high: 3 } },
    };

    // مواقع ثابتة مدروسة (مش عشوائية) - بابا نويل ركن، رجل الثلج الركن
    // المقابل، الهدايا تجمّع سفلي - composition حقيقي
    const SINGLE_ELEMENT_POSITIONS = {
        "winter-santa": { className: "bsn-santa", svg: SANTA_SVG, style: "left: 2%; bottom: 4%; width: 68px;" },
        "winter-snowman": { className: "bsn-snowman", svg: SNOWMAN_SVG, style: "right: 3%; bottom: 3%; width: 58px;" },
    };

    function getScatterPositions(count) {
        const presets = [
            "top:6%; left:8%;", "top:10%; left:88%;", "top:22%; left:48%;", "top:4%; left:65%;",
            "top:35%; left:4%;", "top:15%; left:30%;", "top:40%; left:92%;", "top:8%; left:20%;",
            "top:28%; left:75%;", "top:48%; left:15%;", "top:5%; left:42%;", "top:32%; left:60%;",
            "top:45%; left:35%;", "top:18%; left:5%;",
        ];
        return presets.slice(0, count);
    }

    function buildScatterLayer(layerKey, intensity) {
        const asset = LAYER_ASSETS[layerKey];
        if (!asset) return "";
        const count = (asset.counts[intensity] || asset.counts.medium) || 0;
        const positions = getScatterPositions(count);
        return positions.map((pos, i) => `
            <span class="bsn-el ${asset.className}" style="${pos} color:${asset.color}; animation-delay:${(i * 0.7).toFixed(1)}s;" aria-hidden="true">${asset.svg}</span>
        `).join("");
    }

    function buildSingleLayer(layerKey) {
        const cfg = SINGLE_ELEMENT_POSITIONS[layerKey];
        if (!cfg) return "";
        return `<span class="bsn-el ${cfg.className}" style="${cfg.style}" aria-hidden="true">${cfg.svg}</span>`;
    }

    function buildGiftCluster() {
        return `<span class="bsn-el bsn-gift-cluster" aria-hidden="true">
            <span class="bsn-gift bsn-gift-1" style="color:#6E1F2F;">${GIFT_SVG}</span>
            <span class="bsn-gift bsn-gift-2" style="color:#B9924A;">${GIFT_SVG}</span>
        </span>`;
    }

    /**
     * بتبني وتحط الطبقة الزخرفية بالكامل جوه container معين (الهيرو أو البانر).
     * بتمسح أي طبقة قديمة موجودة الأول (idempotent).
     * @param {HTMLElement} container
     * @param {Object} decorative - theme.decorative { layers, intensity }
     */
    function renderInto(container, decorative) {
        if (!container || !decorative || !Array.isArray(decorative.layers)) return;
        clearFrom(container);

        const intensity = decorative.intensity || "medium";
        const mount = document.createElement("div");
        mount.className = "bsn-decoration-layer";
        mount.setAttribute("aria-hidden", "true");

        let html = "";
        decorative.layers.forEach((layerKey) => {
            if (layerKey === "winter-gifts") html += buildGiftCluster();
            else if (LAYER_ASSETS[layerKey]) html += buildScatterLayer(layerKey, intensity);
            else if (SINGLE_ELEMENT_POSITIONS[layerKey]) html += buildSingleLayer(layerKey);
        });
        mount.innerHTML = html;
        container.style.position = container.style.position || "relative";
        container.appendChild(mount);
    }

    /** بتشيل أي طبقة زخرفية سابقة من الحاوية دي. */
    function clearFrom(container) {
        if (!container) return;
        const existing = container.querySelectorAll(":scope > .bsn-decoration-layer");
        existing.forEach((el) => el.remove());
    }

    return { renderInto, clearFrom };
});
