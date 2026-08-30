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
            items: [
                { key: "index", label: "الداشبورد", icon: "fa-gauge-high", href: "index.html" },
                { key: "reports", label: "التقارير", icon: "fa-chart-line", href: "reports.html" },
            ],
        },
        {
            group: "التشغيل اليومي",
            items: [
                { key: "orders", label: "الطلبات", icon: "fa-receipt", href: "orders.html", badgeKey: "ordersToday" },
                { key: "products", label: "المنتجات", icon: "fa-cake-candles", href: "products.html" },
                { key: "review-followups", label: "تذكير المراجعات", icon: "fa-comment-dots", href: "review-followups.html", badgeKey: "reviewFollowupsDue" },
            ],
        },
        {
            group: "المحتوى",
            items: [
                { key: "homepage", label: "الواجهة الرئيسية", icon: "fa-house", href: "homepage.html" },
                { key: "about-page", label: "صفحة من نحن", icon: "fa-heart", href: "about-page.html" },
                { key: "categories", label: "الفئات", icon: "fa-layer-group", href: "categories.html" },
                { key: "offers", label: "عروض المنتجات", icon: "fa-percent", href: "offers.html" },
                { key: "promotions", label: "بانرات العروض", icon: "fa-tags", href: "promotions.html" },
                { key: "content-studio", label: "استوديو المحتوى", icon: "fa-feather-pointed", href: "content-studio.html" },
                { key: "tour", label: "الجولة التفاعلية", icon: "fa-route", href: "tour.html" },
            ],
        },
        {
            group: "برنامج الولاء",
            items: [
                { key: "loyalty-settings", label: "إعدادات الولاء", icon: "fa-crown", href: "loyalty-settings.html" },
                { key: "customer-lookup", label: "متابعة العملاء", icon: "fa-magnifying-glass", href: "customer-lookup.html" },
            ],
        },
        {
            group: "القسائم والهدايا",
            items: [
                { key: "loyalty-vouchers", label: "قسائم الولاء الصادرة", icon: "fa-gift", href: "loyalty-vouchers.html" },
                { key: "gift-cards", label: "بطاقات الهدايا", icon: "fa-wallet", href: "gift-cards.html" },
                { key: "voucher-notifications", label: "تنبيه القسائم والبطاقات", icon: "fa-bell", href: "voucher-notifications.html", badgeKey: "vouchersUnnotified" },
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
        reports: ["التقارير", "اتجاه المبيعات وأكتر المنتجات مبيعاً"],
        orders: ["الطلبات", "متابعة وتحديث حالة كل طلبات العملاء"],
        products: ["المنتجات", "إضافة وتعديل منتجات المتجر"],
        "review-followups": ["تذكير المراجعات", "عملاء اتسلملهم طلبهم من يوم أو أكتر - ابعتيلهم تذكير مراجعة بضغطة واحدة"],
        homepage: ["الواجهة الرئيسية", "التحكم في محتوى الصفحة الرئيسية للموقع"],
        "about-page": ["صفحة \"من نحن\"", "القصة، الإحصائيات الحقيقية، قيم العلامة التجارية، ومعرض الصور"],
        categories: ["الفئات", "إدارة فئات المنتجات"],
        offers: ["عروض المنتجات", "تمييز منتجات موجودة كعليها عرض/خصم في الموقع"],
        promotions: ["بانرات العروض", "إدارة بانرات وكروت العروض التسويقية الظاهرة للعملاء"],
        "content-studio": ["استوديو المحتوى", "توليد وتعديل أوصاف المنتجات والنكهات والفئات وصفحات السياسات بالذكاء الاصطناعي"],
        tour: ["الجولة التفاعلية", "تعديل خطوات جولة الموقع من غير كود، ومتابعة عند أي خطوة العميلات بيسيبوا الجولة فعليًا"],
        coupons: ["الكوبونات", "إنشاء وإدارة أكواد الخصم"],
        reviews: ["التقييمات", "اعتماد أو رفض تقييمات العملاء"],
        "shipping-zones": ["مناطق التوصيل", "إدارة المناطق ورسوم الشحن"],
        "builders-settings": ["إعدادات المحاكيات", "ضبط محاكي التورت والورد"],
        "store-settings": ["بيانات المتجر", "الإعدادات العامة، SEO، والسوشيال ميديا"],
        "loyalty-settings": ["إعدادات الولاء", "نسب الخصم، قيمة قسيمة الهدية، مدة صلاحيتها، وعدد الطلبات في الدورة"],
        "customer-lookup": ["متابعة العملاء", "دوّري برقم تليفون العميل: كام طلب عنده، فين وصل في دائرة الولاء، وقسايمه"],
        "loyalty-vouchers": ["قسائم الولاء الصادرة", "كل قسايم الهدية اللي اتكسبت من دورة الولاء، مين استخدمها، وقد إيه فلوس اتصرفت من خلالها"],
        "gift-cards": ["بطاقات الهدايا", "بطاقات الهدايا اللي اتباعت بفلوس حقيقية عبر منتج بطاقة هدية - مين اشتراها وقد إيه اتصرف منها"],
        "voucher-notifications": ["تنبيه القسائم والبطاقات", "قسائم ولاء وبطاقات هدايا نشطة لسه محدش قال للعميل بيها - ابعتيله كارت الهدية بضغطة واحدة"],
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
                        <strong>لوحة تحكم حلويات بوسي</strong>
                        <span>إدارة المتجر</span>
                    </div>
                </div>
                <nav class="adm-nav">${groupsHTML}</nav>
                <div class="adm-sidebar-footer">
                    <button class="adm-logout-btn adm-change-password-btn" id="adm-change-password-btn" style="margin-bottom:8px;">
                        <i class="fa-solid fa-key"></i> تغيير كلمة المرور
                    </button>
                    <button class="adm-logout-btn" id="adm-logout-btn">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i> تسجيل الخروج
                    </button>
                </div>
            </aside>
            <div class="adm-sidebar-backdrop" id="adm-sidebar-backdrop"></div>`;
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

    /**
     * 🆕 [5.5 - تغيير كلمة المرور]: مودال بسيط (كلمة مرور جديدة + تأكيدها)
     * بيستخدم updatePassword في admin-data.js. بيتفتح من زرار الشريط الجانبي
     * الموجود في كل صفحات اللوحة (نفس مكان "تسجيل الخروج").
     */
    function openChangePasswordModal() {
        const ui = window.BoseAdminUI;
        if (!ui) return;
        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 400px;">
                <div class="adm-modal-header">
                    <h3>تغيير كلمة المرور</h3>
                    <button class="adm-modal-close" data-role="cancel"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="adm-field">
                    <label>كلمة المرور الجديدة</label>
                    <input type="password" id="adm-new-password" class="adm-input" autocomplete="new-password" placeholder="6 حروف/أرقام على الأقل" />
                </div>
                <div class="adm-field">
                    <label>تأكيد كلمة المرور الجديدة</label>
                    <input type="password" id="adm-new-password-confirm" class="adm-input" autocomplete="new-password" />
                </div>
                <div class="adm-modal-actions">
                    <button class="adm-btn adm-btn-ghost" data-role="cancel">إلغاء</button>
                    <button class="adm-btn adm-btn-primary" id="adm-save-new-password">حفظ</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) close();
            if (e.target.closest("[data-role='cancel']")) close();
        });

        overlay.querySelector("#adm-save-new-password").addEventListener("click", async () => {
            const pass1 = overlay.querySelector("#adm-new-password").value;
            const pass2 = overlay.querySelector("#adm-new-password-confirm").value;
            if (!pass1 || pass1.length < 6) {
                ui.showToast("كلمة المرور لازم تكون 6 حروف/أرقام على الأقل", "error");
                return;
            }
            if (pass1 !== pass2) {
                ui.showToast("كلمتا المرور مش متطابقتين", "error");
                return;
            }
            try {
                await window.BoseAdmin.updatePassword(pass1);
                ui.showToast("اتغيّرت كلمة المرور بنجاح", "success");
                close();
            } catch (err) {
                ui.showToast(err.message || "حصل خطأ أثناء تغيير كلمة المرور", "error");
            }
        });
    }

    function wireInteractions() {
        const logoutBtn = document.getElementById("adm-logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                await window.BoseAdmin.signOut();
                window.location.href = "login.html";
            });
        }

        const changePasswordBtn = document.getElementById("adm-change-password-btn");
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener("click", openChangePasswordModal);
        }

        const mobileToggle = document.getElementById("adm-mobile-toggle");
        const sidebar = document.getElementById("adm-sidebar");
        const backdrop = document.getElementById("adm-sidebar-backdrop");

        // 🐛 [إصلاح - القائمة الجانبية على الموبايل كانت بتظهر فوق المحتوى مباشرة
        // من غير أي طبقة تعتيم (Backdrop) بينها وبين محتوى الصفحة، فكان الاتنين
        // (القائمة والمحتوى) بيظهروا مختلطين مع بعض بصرياً بدل ما تبقى القائمة
        // نافذة منبثقة واضحة فوق خلفية معتّمة - ده اللي كان بيدي إحساس إن الصفحة
        // "مش متظبطة للموبايل". دلوقتي بنضيف طبقة تعتيم بتتفعّل مع فتح القائمة،
        // وبنقفل سكرول الصفحة اللي وراها لحد ما تتقفل تاني (نفس سلوك أي قائمة
        // جانبية قياسية)، وبنخليها تتقفل بضغطة عليها زي الضغط بره القائمة بالظبط.
        function closeSidebar() {
            sidebar.classList.remove("open");
            if (backdrop) backdrop.classList.remove("open");
            document.body.classList.remove("adm-sidebar-lock");
        }
        function openSidebar() {
            sidebar.classList.add("open");
            if (backdrop) backdrop.classList.add("open");
            document.body.classList.add("adm-sidebar-lock");
        }

        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener("click", () => {
                sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
            });
            document.addEventListener("click", (e) => {
                if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && e.target !== mobileToggle && !mobileToggle.contains(e.target)) {
                    closeSidebar();
                }
            });
            if (backdrop) backdrop.addEventListener("click", closeSidebar);
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