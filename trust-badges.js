/**
 * trust-badges.js
 * =====================================================================
 * 🛡️ شريط "شارات الثقة" - مكوّن مستقل بيحقن نفسه تلقائياً في أي صفحة فيها
 * <div id="bose-trust-badges-injector"></div>، بنفس فلسفة حقن الهيدر/الفوتر
 * في core-engine.js (BoseSupabase / injector divs) بس من غير أي اعتماد على
 * core-engine نفسه - يعني ممكن يتحط في أي صفحة لوحده بس بعد ما الـ injector
 * div يكون موجود في الـ HTML.
 *
 * الاستخدام:
 *   <div id="bose-trust-badges-injector"></div>
 *   <script src="js/trust-badges.js?v=1" defer></script>
 *
 * ممكن كمان تستدعيها يدوياً من أي مكان بعد التحميل:
 *   window.BoseTrustBadges.renderInto(document.getElementById("my-div"));
 */
(function () {
    "use strict";

    const DEFAULT_BADGES = [
        { icon: "fa-lock", label: "دفع آمن", sub: "عربون أو كامل المبلغ بأمان" },
        { icon: "fa-award", label: "جودة مضمونة", sub: "خامات طازة يومياً" },
        { icon: "fa-truck-fast", label: "توصيل سريع", sub: "لكل مناطق الوادي الجديد" },
        { icon: "fa-headset", label: "تواصل مباشر", sub: "رد سريع على واتساب" },
    ];

    const STYLE_ID = "bose-trust-badges-style";

    function injectStyleOnce() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            .btb-wrap {
                display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
                padding: 16px 4px; margin: 18px 0; font-family: 'Cairo', sans-serif;
            }
            .btb-item { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; }
            .btb-icon {
                width: 44px; height: 44px; border-radius: 50%; background: rgba(255,145,164,0.1); color: #FF91A4;
                display: flex; align-items: center; justify-content: center; font-size: 1.05rem;
            }
            .btb-label { font-size: 0.74rem; font-weight: 800; color: #111; line-height: 1.3; }
            .btb-sub { font-size: 0.64rem; color: #111; opacity: 0.6; line-height: 1.3; display: none; }
            @media (min-width: 640px) {
                .btb-sub { display: block; }
                .btb-icon { width: 52px; height: 52px; font-size: 1.2rem; }
                .btb-label { font-size: 0.82rem; }
            }
            @media (max-width: 380px) {
                .btb-wrap { grid-template-columns: repeat(2, 1fr); row-gap: 16px; }
            }
        `;
        document.head.appendChild(style);
    }

    function buildHTML(badges) {
        return `
            <div class="btb-wrap">
                ${badges.map((b) => `
                    <div class="btb-item">
                        <div class="btb-icon"><i class="fa-solid ${b.icon}"></i></div>
                        <span class="btb-label">${b.label}</span>
                        <span class="btb-sub">${b.sub}</span>
                    </div>
                `).join("")}
            </div>`;
    }

    function renderInto(target, badges) {
        if (!target) return;
        injectStyleOnce();
        target.innerHTML = buildHTML(badges || DEFAULT_BADGES);
    }

    function autoInject() {
        const targets = document.querySelectorAll("#bose-trust-badges-injector, [data-bose-trust-badges]");
        targets.forEach((target) => renderInto(target));
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", autoInject);
    } else {
        autoInject();
    }

    window.BoseTrustBadges = { renderInto, DEFAULT_BADGES };
})();
