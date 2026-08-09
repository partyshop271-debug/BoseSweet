/**
 * admin-shell.js
 * =====================================================================
 * 🏗️ بيبني الهيكل الثابت لأي صفحة إدارية: قائمة جانبية + شريط علوي.
 * بيشتغل بعد ما admin-auth-guard.js يأكد الجلسة (BoseAdminReady).
 *
 * كل صفحة لازم يكون فيها في الـ HTML:
 *   <body data-page="orders">   ← اسم الصفحة الحالية (يحدد العنصر active)
 *     <div id="adm-shell-target"></div>
 *     <div class="adm-main">
 *       <div id="adm-topbar-target"></div>
 *       <div class="adm-content" id="adm-page-content">...</div>
 *     </div>
 */

(function () {
    "use strict";

    const NAV_STRUCTURE = [
        {
            group: "نظرة عامة",
            items: [{ key: "index", label: "الداشبورد", icon: "fa-gauge-high", href: "index.html" }],
        },
        {
            group: "التشغيل اليومي",
            items: [
                { key: "orders", label: "الطلبات", icon: "fa-receipt", href: "orders.html", badgeKey: "ordersToday" },
                { key: "products", label: "المنتجات", icon: "fa-cake-candles", href: "products.html" },
            ],
        },
        {
            group: "المحتوى",
            items: [
                { key: "homepage", label: "الواجهة الرئيسية", icon: "fa-house", href: "homepage.html" },
                { key: "categories", label: "الفئات", icon: "fa-layer-group", href: "categories.html" },
                { key: "promotions", label: "العروض", icon: "fa-tags", href: "promotions.html" },
            ],
        },
        {
            group: "الإعدادات",
            items: [
                { key: "coupons", label: "الكوبونات", icon: "fa-ticket", href: "coupons.html" },
                { key: "reviews", label: "التقييمات", icon: "fa-star", href: "reviews.html", badgeKey: "pendingReviews" },
                { key: "shipping-zones", label: "مناطق التوصيل", icon: "fa-truck-fast", href: "shipping-zones.html" },
                { key: "builders-settings", label: "إعدادات المحاكيات", icon: "fa-palette", href: "builders-settings.html" },
                { key: "store-settings", label: "بيانات المتجر", icon: "fa-store", href: "store-settings.html" },
            ],
        },
    ];

    const PAGE_TITLES = {
        index: ["الداشبورد", "نظرة سريعة على أداء المتجر اليوم"],
        orders: ["الطلبات", "متابعة وتحديث حالة كل طلبات العملاء"],
        products: ["المنتجات", "إضافة وتعديل منتجات المتجر"],
        homepage: ["الواجهة الرئيسية", "التحكم في محتوى الصفحة الرئيسية للموقع"],
        categories: ["الفئات", "إدارة فئات المنتجات"],
        promotions: ["العروض", "إدارة العروض والخصومات الظاهرة للعملاء"],
        coupons: ["الكوبونات", "إنشاء وإدارة أكواد الخصم"],
        reviews: ["التقييمات", "اعتماد أو رفض تقييمات العملاء"],
        "shipping-zones": ["مناطق التوصيل", "إدارة المناطق ورسوم الشحن"],
        "builders-settings": ["إعدادات المحاكيات", "ضبط محاكي التورت والورد"],
        "store-settings": ["بيانات المتجر", "الإعدادات العامة، SEO، والسوشيال ميديا"],
    };

    function buildSidebar(currentPage) {
        const groupsHTML = NAV_STRUCTURE.map((group) => `
            <div class="adm-nav-group-label">${group.group}</div>
            ${group.items.map((item) => `
                <a class="adm-nav-item ${item.key === currentPage ? "active" : ""}" href="${item.href}" data-nav-key="${item.key}">
                    <i class="fa-solid ${item.icon}"></i>
                    <span>${item.label}</span>
                    ${item.badgeKey ? `<span class="adm-nav-badge" data-badge-key="${item.badgeKey}" style="display:none;"></span>` : ""}
                </a>
            `).join("")}
        `).join("");

        return `
            <aside class="adm-sidebar" id="adm-sidebar">
                <div class="adm-sidebar-brand">
                    <div class="adm-sidebar-brand-badge"><i class="fa-solid fa-cake-candles"></i></div>
                    <div class="adm-sidebar-brand-text">
                        <strong>لوحة تحكم بوسي</strong>
                        <span>إدارة المتجر</span>
                    </div>
                </div>
                <nav class="adm-nav">${groupsHTML}</nav>
                <div class="adm-sidebar-footer">
                    <button class="adm-logout-btn" id="adm-logout-btn">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i> تسجيل الخروج
                    </button>
                </div>
            </aside>`;
    }

    function buildTopbar(currentPage, adminInfo) {
        const [title, subtitle] = PAGE_TITLES[currentPage] || ["", ""];
        const initial = (adminInfo?.displayName || "أ").trim().charAt(0);
        return `
            <header class="adm-topbar">
                <div class="adm-gap-8">
                    <button class="adm-mobile-topbar-toggle" id="adm-mobile-toggle"><i class="fa-solid fa-bars"></i></button>
                    <div class="adm-topbar-title">
                        <h1>${title}</h1>
                        <p>${subtitle}</p>
                    </div>
                </div>
                <div class="adm-topbar-right">
                    <div class="adm-user-chip">
                        <div class="adm-user-avatar">${initial}</div>
                        <span>${adminInfo?.displayName || ""}</span>
                    </div>
                </div>
            </header>`;
    }

    async function updateNavBadges() {
        if (!window.BoseAdmin) return;
        try {
            const summary = await window.BoseAdmin.getDashboardSummary();
            document.querySelectorAll("[data-badge-key]").forEach((el) => {
                const val = summary[el.getAttribute("data-badge-key")] || 0;
                if (val > 0) {
                    el.textContent = val > 99 ? "99+" : String(val);
                    el.style.display = "inline-flex";
                } else {
                    el.style.display = "none";
                }
            });
        } catch (e) {
            console.warn("تعذر تحديث شارات القائمة الجانبية:", e.message);
        }
    }

    function wireInteractions() {
        const logoutBtn = document.getElementById("adm-logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                await window.BoseAdmin.signOut();
                window.location.href = "login.html";
            });
        }

        const mobileToggle = document.getElementById("adm-mobile-toggle");
        const sidebar = document.getElementById("adm-sidebar");
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
            document.addEventListener("click", (e) => {
                if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && e.target !== mobileToggle && !mobileToggle.contains(e.target)) {
                    sidebar.classList.remove("open");
                }
            });
        }
    }

    function renderShell(adminInfo) {
        const currentPage = document.body.getAttribute("data-page") || "index";
        const shellTarget = document.getElementById("adm-shell-target");
        const topbarTarget = document.getElementById("adm-topbar-target");

        if (shellTarget) shellTarget.outerHTML = buildSidebar(currentPage);
        if (topbarTarget) topbarTarget.outerHTML = buildTopbar(currentPage, adminInfo);

        wireInteractions();
        updateNavBadges();
    }

    // الشِل بيتبنى بس بعد ما الحارس يتأكد من الجلسة (BoseAdminReady)
    document.addEventListener("BoseAdminReady", (e) => renderShell(e.detail));
})();
