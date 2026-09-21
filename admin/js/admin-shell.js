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

    /**
     * 🆕 [تحسين أداء - تقليل استهلاك البيانات]: getDashboardSummary() كانت
     * بتتنادى مرتين في نفس تحميل الصفحة - مرة هنا لتحديث شارات القائمة
     * الجانبية، ومرة تانية جوه dashboard-page.js/daily-page.js لعرض
     * الإحصائيات - نفس الاستعلام بالظبط، مرتين لكل تحميل صفحة. دلوقتي أي
     * صفحة تحتاج نفس البيانات بتستخدم window.BoseAdminShared.getDashboardSummary()
     * بدل ما تنادي admin-data.js مباشرة - أول نداء بيبدأ الجلب الفعلي،
     * وأي نداء تاني (حتى لو حصل في نفس اللحظة تقريباً) بياخد نفس الـ promise
     * الجاري من غير ما يعمل استعلام إضافي على القاعدة.
     */
    let sharedSummaryPromise = null;
    function getSharedDashboardSummary() {
        if (!sharedSummaryPromise) {
            sharedSummaryPromise = window.BoseAdmin.getDashboardSummary().catch((e) => {
                sharedSummaryPromise = null; // فشل النداء؟ سيبي المحاولة الجاية تبدأ من جديد
                throw e;
            });
        }
        return sharedSummaryPromise;
    }
    window.BoseAdminShared = { getDashboardSummary: getSharedDashboardSummary };

    const NAV_STRUCTURE = [
        {
            group: "نظرة عامة",
            items: [
                { key: "daily", label: "يومي", icon: "fa-list-check", href: "daily.html", badgeKey: "pendingOrders" },
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
                { key: "order-alerts", label: "تنبيهات الطلبات", icon: "fa-bell-concierge", href: "order-alerts.html" },
                { key: "push-notifications", label: "إشعارات العميلات", icon: "fa-bell", href: "push-notifications.html" },
            ],
        },
        {
            group: "المحتوى",
            items: [
                { key: "homepage", label: "الواجهة الرئيسية", icon: "fa-house", href: "homepage.html" },
                { key: "seasons", label: "المواسم والمناسبات", icon: "fa-champagne-glasses", href: "seasons.html" },
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
            group: "الإعدادات",
            items: [
                { key: "reviews", label: "التقييمات", icon: "fa-star", href: "reviews.html", badgeKey: "pendingReviews" },
                { key: "shipping-zones", label: "مناطق التوصيل", icon: "fa-truck-fast", href: "shipping-zones.html" },
                { key: "builders-settings", label: "إعدادات المحاكيات", icon: "fa-palette", href: "builders-settings.html" },
                { key: "store-settings", label: "بيانات المتجر", icon: "fa-store", href: "store-settings.html" },
            ],
        },
        {
            group: "المراقبة الفنية",
            items: [
                { key: "client-error-log", label: "أعطال العميلات", icon: "fa-triangle-exclamation", href: "client-error-log.html" },
            ],
        },
    ];

    const PAGE_TITLES = {
        index: ["الداشبورد", "نظرة سريعة على أداء المتجر اليوم"],
        reports: ["التقارير", "اتجاه المبيعات وأكتر المنتجات مبيعاً"],
        orders: ["الطلبات", "متابعة وتحديث حالة كل طلبات العملاء"],
        products: ["المنتجات", "إضافة وتعديل منتجات المتجر"],
        "review-followups": ["تذكير المراجعات", "عملاء اتسلملهم طلبهم من يوم أو أكتر - ابعتيلهم تذكير مراجعة بضغطة واحدة"],
        "order-alerts": ["تنبيهات الطلبات", "تأكدي إن أي طلب جديد بيوصلك فورًا على موبايلك - وحالة كل قناة تنبيه"],
        "push-notifications": ["إشعارات العميلات", "ابعتي إشعار Push حقيقي فورًا لكل العميلات المفعّلة عندهم إشعارات الموقع"],
        homepage: ["الواجهة الرئيسية", "التحكم في محتوى الصفحة الرئيسية للموقع"],
        seasons: ["المواسم والمناسبات", "جدولة بانرات وشارات وحملات موسمية تتفعل وتتلغي تلقائياً بالتاريخ"],
        "about-page": ["صفحة \"من نحن\"", "القصة، الإحصائيات الحقيقية، قيم العلامة التجارية، ومعرض الصور"],
        categories: ["الفئات", "إدارة فئات المنتجات"],
        offers: ["عروض المنتجات", "تمييز منتجات موجودة كعليها عرض/خصم في الموقع"],
        promotions: ["بانرات العروض", "إدارة بانرات وكروت العروض التسويقية الظاهرة للعملاء"],
        "content-studio": ["استوديو المحتوى", "توليد وتعديل أوصاف المنتجات والنكهات والفئات وصفحات السياسات بالذكاء الاصطناعي"],
        tour: ["الجولة التفاعلية", "تعديل خطوات جولة الموقع من غير كود، ومتابعة عند أي خطوة العميلات بيسيبوا الجولة فعليًا"],
        reviews: ["التقييمات", "اعتماد أو رفض تقييمات العملاء"],
        "shipping-zones": ["مناطق التوصيل", "إدارة المناطق ورسوم الشحن"],
        "builders-settings": ["إعدادات المحاكيات", "ضبط محاكي التورت والورد"],
        "store-settings": ["بيانات المتجر", "الإعدادات العامة، SEO، والسوشيال ميديا"],
        "client-error-log": ["أعطال العميلات", "أي رقم موبايل اترفض في الشيك أوت وليه - القيمة كما كتبتها العميلة بالظبط"],
        "loyalty-settings": ["إعدادات الولاء", "نسب خصم الولاء التلقائي وعدد الطلبات في الدورة"],
        "customer-lookup": ["متابعة العملاء", "دوّري برقم تليفون العميل: كام طلب عنده، وفين وصل في دورة الولاء"],
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
                    <!-- 🛎️ تفعيل تنبيه الطلبات الجديدة على الجهاز ده (Push) - راجع initOrderAlerts -->
                    <button type="button" class="adm-order-alert-btn" id="adm-order-alert-btn" data-state="off" style="display:none;"></button>
                    <!-- 🆕 [تحسين إنتاجية - بحث موحّد من أي صفحة]: صندوق واحد بيدوّر
                         في الطلبات + المنتجات + العملاء مع بعض، من غير ما تسيبي
                         الصفحة اللي انتي فيها. اضغطي على نتيجة يوديكي للصفحة الصح
                         مباشرة (طلب مفتوح، منتج جاهز للتعديل، أو ملف العميلة). -->
                    <div class="adm-global-search" id="adm-global-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="adm-global-search-input" autocomplete="off"
                               placeholder="بحث سريع: رقم طلب / اسم منتج / موبايل عميلة...">
                        <kbd class="adm-global-search-kbd">/</kbd>
                        <div class="adm-global-search-results" id="adm-global-search-results"></div>
                    </div>
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
            const summary = await getSharedDashboardSummary();
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

        wireGlobalSearch();
    }

    /**
     * 🆕 [تحسين إنتاجية - بحث موحّد من أي صفحة]: بيدوّر في window.BoseAdmin.globalAdminSearch
     * (تعريفها في admin-data.js) بعد 300ms من آخر حرف اتكتب، ويعرض النتايج
     * مجمّعة (طلبات/منتجات/عميلات) في قائمة منسدلة. كل نتيجة بتوديك للصفحة
     * الصح مباشرة بنفس نمط "?edit=ID" الموجود بالفعل في products.html.
     */
    function wireGlobalSearch() {
        const input = document.getElementById("adm-global-search-input");
        const resultsBox = document.getElementById("adm-global-search-results");
        if (!input || !resultsBox) return;

        const e = (s) => (window.BoseAdminUI ? window.BoseAdminUI.escapeHtml(s) : String(s ?? ""));
        let debounceTimer = null;
        let requestSeq = 0;

        function closeResults() {
            resultsBox.style.display = "none";
            resultsBox.innerHTML = "";
        }

        function renderResults({ orders, products, customers }) {
            if (!orders.length && !products.length && !customers.length) {
                resultsBox.innerHTML = `<div class="adm-global-search-empty">مفيش نتائج مطابقة</div>`;
                resultsBox.style.display = "block";
                return;
            }

            let html = "";
            if (orders.length) {
                html += `<div class="adm-global-search-group-label">طلبات</div>`;
                html += orders.map((o) => `
                    <a class="adm-global-search-item" href="orders.html?open=${e(o.id)}">
                        <i class="fa-solid fa-receipt"></i>
                        <span>#${e(o.order_number || o.id)} - ${e(o.customer_name || "—")}</span>
                        <small>${o.grand_total ? Math.round(o.grand_total) + " ج.م" : ""}</small>
                    </a>`).join("");
            }
            if (products.length) {
                html += `<div class="adm-global-search-group-label">منتجات</div>`;
                html += products.map((p) => `
                    <a class="adm-global-search-item" href="products.html?edit=${e(p.id)}">
                        <i class="fa-solid fa-cake-candles"></i>
                        <span>${e(p.title)}${p.flavor_name ? " - " + e(p.flavor_name) : ""}</span>
                    </a>`).join("");
            }
            if (customers.length) {
                html += `<div class="adm-global-search-group-label">عميلات</div>`;
                html += customers.map((c) => `
                    <a class="adm-global-search-item" href="customer-lookup.html?phone=${e(c.phone)}">
                        <i class="fa-solid fa-user"></i>
                        <span>${e(c.customer_name || c.phone)}</span>
                        <small>${e(c.phone)}${c.total_orders ? " - " + c.total_orders + " طلب" : ""}</small>
                    </a>`).join("");
            }
            resultsBox.innerHTML = html;
            resultsBox.style.display = "block";
        }

        input.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            const q = input.value.trim();
            if (q.length < 2) { closeResults(); return; }
            debounceTimer = setTimeout(async () => {
                const mySeq = ++requestSeq;
                resultsBox.innerHTML = `<div class="adm-global-search-empty">جاري البحث...</div>`;
                resultsBox.style.display = "block";
                try {
                    const results = await window.BoseAdmin.globalAdminSearch(q);
                    if (mySeq !== requestSeq) return; // نتيجة بحث قديمة وصلت متأخرة، اتجاهلها
                    renderResults(results);
                } catch (err) {
                    if (mySeq !== requestSeq) return;
                    resultsBox.innerHTML = `<div class="adm-global-search-empty">تعذر البحث حالياً</div>`;
                }
            }, 300);
        });

        document.addEventListener("click", (e2) => {
            if (!document.getElementById("adm-global-search").contains(e2.target)) closeResults();
        });
        input.addEventListener("keydown", (e2) => {
            if (e2.key === "Escape") { closeResults(); input.blur(); }
        });

        /**
         * 🆕 [تحسين إنتاجية - اختصار كيبورد]: دوسي "/" من أي مكان في اللوحة
         * (من غير ما تكوني كاتبة في حقل تاني) عشان تنطي مباشرة لصندوق البحث
         * الموحّد، من غير ما تلمسي الماوس خالص.
         */
        document.addEventListener("keydown", (e2) => {
            if (e2.key !== "/") return;
            const active = document.activeElement;
            const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable);
            if (isTyping) return;
            e2.preventDefault();
            input.focus();
        });
    }


    /* =====================================================================
     * 🛎️ [تنبيهات الطلبات الجديدة]: أول ما عميلة تسجّل طلب، الموقع بيكلّم صاحبة
     * المتجر بنفسه بـ 3 طرق:
     *   1) إشعار Push على الموبايل (حتى لو اللوحة مقفولة) - بيتفعّل مرة من الزرار في الشريط العلوي
     *   2) تذكير تلقائي لو الطلب فضل من غير مراجعة (بيتبعت من السيرفر - notify-new-order)
     *   3) تنبيه جوه اللوحة نفسها (بانر + صوت + وميض العنوان) لو مفتوحة، بيتشيك كل 30 ثانية
     * مفاتيح الإشعار الخاصة بالأدمن منفصلة تمامًا عن إشعارات العميلات.
     * ===================================================================== */
    const ADMIN_VAPID_PUBLIC_KEY = "BAvmV5fbSyy3lbsV1F6zOxP0rxrcM2HOaKBqcn2sP9L7ogS05ZUxtD5hqk_-D9CZJs8HIwADUjUv8DUR6zF0Uio";
    const LS_ALERT_ENDPOINT = "bose_admin_push_endpoint";
    const LS_SEEN_PENDING = "bose_admin_seen_pending_ids";
    const PENDING_POLL_MS = 30000;

    function alertUrlBase64ToUint8Array(base64String) {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const raw = atob(base64);
        const out = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
        return out;
    }

    function alertPushSupported() {
        return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    }

    function subscriptionUsesAdminKey(sub) {
        try {
            const current = sub && sub.options && sub.options.applicationServerKey;
            if (!current) return false;
            const a = new Uint8Array(current);
            const b = alertUrlBase64ToUint8Array(ADMIN_VAPID_PUBLIC_KEY);
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
            return true;
        } catch (e) {
            return false;
        }
    }

    // "unsupported" | "denied" | "off" | "on"
    async function computeAlertState() {
        if (!alertPushSupported()) return "unsupported";
        if (Notification.permission === "denied") return "denied";
        if (Notification.permission !== "granted") return "off";
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            const sub = reg ? await reg.pushManager.getSubscription() : null;
            if (!sub) return "off";
            const savedEndpoint = localStorage.getItem(LS_ALERT_ENDPOINT);
            return savedEndpoint === sub.endpoint && subscriptionUsesAdminKey(sub) ? "on" : "off";
        } catch (e) {
            return "off";
        }
    }

    function injectOrderAlertStyles() {
        if (document.getElementById("adm-order-alert-styles")) return;
        const style = document.createElement("style");
        style.id = "adm-order-alert-styles";
        style.textContent = `
            .adm-order-alert-btn { display:inline-flex; align-items:center; gap:6px; border:none; cursor:pointer; font-family:inherit;
                font-size:0.82rem; font-weight:800; padding:8px 14px; border-radius:999px; white-space:nowrap; }
            .adm-order-alert-btn[data-state="off"] { background:#FF91A4; color:#fff; animation: admAlertPulse 1.6s ease-in-out infinite; }
            .adm-order-alert-btn[data-state="on"] { background:#E6F6EA; color:#1B7F3B; }
            .adm-order-alert-btn[data-state="denied"], .adm-order-alert-btn[data-state="unsupported"] { background:#FDECEC; color:#B3261E; }
            @keyframes admAlertPulse { 0%,100% { box-shadow:0 0 0 0 rgba(255,145,164,0.6); } 50% { box-shadow:0 0 0 9px rgba(255,145,164,0); } }
            #adm-new-order-banner { position:fixed; top:12px; left:50%; transform:translateX(-50%); z-index:100000; width:min(560px, calc(100% - 24px));
                background:#111; color:#fff; border-radius:16px; padding:14px 16px; display:flex; align-items:center; gap:12px; direction:rtl;
                box-shadow:0 14px 40px rgba(0,0,0,0.35); border:2px solid #FF91A4; font-family:inherit; }
            #adm-new-order-banner .adm-nob-text { flex:1; min-width:0; font-weight:800; font-size:0.95rem; line-height:1.6; }
            #adm-new-order-banner a { background:#FF91A4; color:#fff; text-decoration:none; font-weight:800; border-radius:12px; padding:9px 14px; white-space:nowrap; }
            #adm-new-order-banner button { background:transparent; border:none; color:#bbb; font-size:1.2rem; cursor:pointer; padding:4px 8px; }
        `;
        document.head.appendChild(style);
    }

    function paintAlertButton(state) {
        const btn = document.getElementById("adm-order-alert-btn");
        if (!btn) return;
        const labels = {
            off: '<i class="fa-solid fa-bell"></i> فعّلي تنبيه الطلبات',
            on: '<i class="fa-solid fa-bell"></i> التنبيهات شغالة ✓',
            denied: '<i class="fa-solid fa-bell-slash"></i> الإشعارات محظورة',
            unsupported: '<i class="fa-solid fa-bell-slash"></i> تنبيه الموبايل',
        };
        btn.setAttribute("data-state", state);
        btn.innerHTML = labels[state] || labels.off;
        btn.style.display = "inline-flex";
    }

    function openAlertHelpModal(title, bodyHtml) {
        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width:440px;">
                <div class="adm-modal-header">
                    <h3>${title}</h3>
                    <button class="adm-modal-close" data-role="cancel"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="line-height:1.9; font-size:0.95rem;">${bodyHtml}</div>
                <div class="adm-modal-actions"><button class="adm-btn adm-btn-primary" data-role="cancel">تمام</button></div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay || e.target.closest("[data-role='cancel']")) overlay.remove();
        });
    }

    async function enableOrderAlerts() {
        const ui = window.BoseAdminUI;
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                paintAlertButton(permission === "denied" ? "denied" : "off");
                ui.showToast("لازم توافقي على الإشعارات عشان التنبيه يشتغل", "error");
                return;
            }
            try { await navigator.serviceWorker.register("/sw.js"); } catch (e) { /* متسجّل قبل كده */ }
            const registration = await navigator.serviceWorker.ready;

            let subscription = await registration.pushManager.getSubscription();
            // اشتراك قديم بمفتاح مختلف (مثلاً من إشعارات العميلات على نفس الجهاز) لازم يتبدّل
            if (subscription && !subscriptionUsesAdminKey(subscription)) {
                await subscription.unsubscribe();
                subscription = null;
            }
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: alertUrlBase64ToUint8Array(ADMIN_VAPID_PUBLIC_KEY),
                });
            }

            await window.BoseAdmin.saveAdminPushSubscription(subscription);
            localStorage.setItem(LS_ALERT_ENDPOINT, subscription.endpoint);
            paintAlertButton("on");
            ui.showToast("اتفعّلت تنبيهات الطلبات على الجهاز ده ✓ - هنبعتلك إشعار تجريبي دلوقتي", "success");
            await sendOrderAlertTest();
            document.dispatchEvent(new CustomEvent("bose-alert-channel-changed"));
        } catch (err) {
            console.error("تعذر تفعيل تنبيهات الطلبات:", err);
            ui.showToast("تعذر تفعيل التنبيهات: " + (err.message || "خطأ غير معروف"), "error");
            paintAlertButton(await computeAlertState());
        }
    }

    async function sendOrderAlertTest() {
        const ui = window.BoseAdminUI;
        try {
            const res = await window.BoseAdmin.sendTestOrderAlert();
            if (res && res.sent > 0) {
                ui.showToast("اتبعت إشعار تجريبي - لو وصلك على الموبايل يبقى كله تمام 🎉", "success");
            } else if (res && res.failed > 0) {
                ui.showToast("الإشعار ما وصلش: " + ((res.errors && res.errors[0]) || "جهاز غير صالح") + " - جرّبي تفعّلي التنبيه تاني", "error");
            } else {
                ui.showToast((res && res.message) || "مفيش جهاز مفعّل لسه", "error");
            }
        } catch (err) {
            ui.showToast("تعذر إرسال الإشعار التجريبي: " + (err.message || ""), "error");
        }
    }

    // نفس تصرّف زرار الشريط العلوي - مكشوف عشان صفحة "تنبيهات الطلبات" تستخدمه هي كمان
    async function runAlertButtonAction() {
        const btn = document.getElementById("adm-order-alert-btn");
        const state = btn ? btn.getAttribute("data-state") : await computeAlertState();
        if (state === "on") return sendOrderAlertTest();
        if (state === "denied") {
            return openAlertHelpModal("الإشعارات محظورة لهذا الموقع",
                "المتصفح قافل الإشعارات للموقع ده. افتحي إعدادات الموقع (أيقونة القفل جنب العنوان) ← <strong>الإشعارات</strong> ← <strong>سماح</strong>، وبعدين حدّثي الصفحة وداسي على الزرار تاني.");
        }
        if (state === "unsupported") {
            return openAlertHelpModal("تنبيه الطلبات على الموبايل",
                "المتصفح ده مش بيدعم إشعارات الموقع.<br><strong>آيفون:</strong> افتحي لوحة التحكم من Safari ← زرار المشاركة ← <strong>إضافة إلى الشاشة الرئيسية</strong>، وبعدين افتحيها من الأيقونة الجديدة وفعّلي التنبيه.<br><strong>أندرويد أو كمبيوتر:</strong> استخدمي متصفح Chrome.");
        }
        return enableOrderAlerts();
    }

    function wireOrderAlertButton() {
        const btn = document.getElementById("adm-order-alert-btn");
        if (!btn) return;
        btn.addEventListener("click", runAlertButtonAction);
    }

    /* ---- تنبيه جوه اللوحة: صوت + بانر + وميض العنوان ---- */
    let alertAudioCtx = null;
    function unlockAlertAudio() {
        try {
            if (!alertAudioCtx) alertAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (alertAudioCtx.state === "suspended") alertAudioCtx.resume();
        } catch (e) { /* الصوت اختياري */ }
    }
    document.addEventListener("pointerdown", unlockAlertAudio, { passive: true });

    function playNewOrderSound() {
        try {
            unlockAlertAudio();
            if (!alertAudioCtx) return;
            const t0 = alertAudioCtx.currentTime;
            [880, 1174, 880, 1174].forEach((freq, i) => {
                const osc = alertAudioCtx.createOscillator();
                const gain = alertAudioCtx.createGain();
                const start = t0 + i * 0.2;
                osc.type = "sine";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
                osc.connect(gain);
                gain.connect(alertAudioCtx.destination);
                osc.start(start);
                osc.stop(start + 0.2);
            });
        } catch (e) { /* الصوت اختياري */ }
    }

    let originalPageTitle = null;
    function flashTitleForNewOrders(count) {
        if (originalPageTitle === null) originalPageTitle = document.title;
        document.title = "🛎️ (" + count + ") طلب جديد - " + originalPageTitle;
        const restore = () => {
            if (originalPageTitle !== null) document.title = originalPageTitle;
            originalPageTitle = null;
            window.removeEventListener("focus", restore);
            document.removeEventListener("visibilitychange", onVis);
        };
        const onVis = () => { if (document.visibilityState === "visible") restore(); };
        window.addEventListener("focus", restore);
        document.addEventListener("visibilitychange", onVis);
    }

    function showNewOrderBanner(orders) {
        const e = (s) => (window.BoseAdminUI ? window.BoseAdminUI.escapeHtml(s) : String(s ?? ""));
        let banner = document.getElementById("adm-new-order-banner");
        if (banner) banner.remove();
        banner = document.createElement("div");
        banner.id = "adm-new-order-banner";
        banner.setAttribute("role", "alert");
        const first = orders[0];
        const text = orders.length === 1
            ? `🛎️ طلب جديد #${e(first.order_number)} - ${e(first.customer_name || "عميلة")}${first.grand_total ? " - " + Math.round(first.grand_total) + " ج.م" : ""}`
            : `🛎️ ${orders.length} طلبات جديدة اتسجّلت`;
        const href = orders.length === 1 ? `orders.html?open=${e(first.id)}` : "orders.html";
        banner.innerHTML = `<div class="adm-nob-text">${text}</div><a href="${href}">افتحي الطلب</a><button type="button" aria-label="إغلاق">✕</button>`;
        banner.querySelector("button").addEventListener("click", () => banner.remove());
        document.body.appendChild(banner);
    }

    function loadSeenPendingIds() {
        try {
            const raw = localStorage.getItem(LS_SEEN_PENDING);
            return raw === null ? null : JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    async function pollPendingOrders() {
        if (!window.BoseAdmin || !window.BoseAdmin.getPendingOrdersSnapshot) return;
        const snap = await window.BoseAdmin.getPendingOrdersSnapshot();
        if (!snap) return;
        const currentIds = snap.latest.map((o) => o.id);
        const seen = loadSeenPendingIds();
        if (seen === null) {
            // أول تشغيل على الجهاز ده: اللي موجود دلوقتي يتحسب "شفته" من غير تنبيه
            localStorage.setItem(LS_SEEN_PENDING, JSON.stringify(currentIds));
            return;
        }
        const fresh = snap.latest.filter((o) => !seen.includes(o.id));
        if (!fresh.length) return;
        localStorage.setItem(LS_SEEN_PENDING, JSON.stringify([...new Set([...seen, ...currentIds])].slice(-100)));

        showNewOrderBanner(fresh);
        playNewOrderSound();
        if (document.visibilityState !== "visible" || !document.hasFocus()) flashTitleForNewOrders(fresh.length);
        sharedSummaryPromise = null; // شارات القائمة الجانبية (عدد الطلبات المنتظرة) تتحدّث
        updateNavBadges();
        document.dispatchEvent(new CustomEvent("bose-new-orders", { detail: { orders: fresh } }));
    }

    /* ---- 🩺 مراقبة صحة التنبيهات: أخطر حالة إن النظام "شغال" بس مفيش ولا قناة مفعّلة، فأي طلب يعدّي
       من غير ما حد يعرف. الشريط ده بيظهر في كل صفحات اللوحة لحد ما تتفعّل قناة واحدة على الأقل. ---- */
    const HEALTH_POLL_MS = 120000;

    function injectHealthBannerStyles() {
        if (document.getElementById("adm-alert-health-styles")) return;
        const style = document.createElement("style");
        style.id = "adm-alert-health-styles";
        style.textContent = `
            #adm-alert-health-banner { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:12px 18px; font-weight:800;
                font-size:0.92rem; line-height:1.7; direction:rtl; font-family:inherit; }
            #adm-alert-health-banner[data-level="red"] { background:#7A1F1F; color:#fff; border-bottom:3px solid #F87171; }
            #adm-alert-health-banner[data-level="amber"] { background:#5C4410; color:#fff; border-bottom:3px solid #FBBF24; }
            #adm-alert-health-banner .adm-ahb-text { flex:1; min-width:220px; }
            #adm-alert-health-banner a { background:#fff; color:#111; text-decoration:none; border-radius:10px; padding:7px 14px; white-space:nowrap; }
        `;
        document.head.appendChild(style);
    }

    function renderAlertHealthBanner(status) {
        const old = document.getElementById("adm-alert-health-banner");
        const page = document.body.getAttribute("data-page");
        // صفحة "تنبيهات الطلبات" بتعرض الحالة بنفسها بتفصيل أكتر
        if (!status || page === "order-alerts") { if (old) old.remove(); return; }

        const push = Number(status.push_devices) || 0;
        const tg = !!status.telegram_configured;
        const unnotified = Number(status.unnotified_orders) || 0;

        let level = null;
        let text = "";
        if (!push && !tg) {
            level = "red";
            text = "⚠️ تنبيهات الطلبات مش شغالة - أي طلب جديد مش هيوصلك، ولازم تفتحي اللوحة بنفسك عشان تشوفيه."
                + (unnotified ? ` فيه ${unnotified} طلب اتسجّل ولسه محدش نبّهك بيه.` : "");
        } else if (unnotified > 0) {
            level = "amber";
            text = `فيه ${unnotified} طلب اتسجّل ولسه ماوصلكيش عنه تنبيه - النظام بيحاول تاني تلقائيًا كل 5 دقايق.`;
        }

        if (!level) { if (old) old.remove(); return; }

        injectHealthBannerStyles();
        const banner = old || document.createElement("div");
        banner.id = "adm-alert-health-banner";
        banner.setAttribute("role", "alert");
        banner.setAttribute("data-level", level);
        banner.innerHTML = `<div class="adm-ahb-text">${text}</div><a href="order-alerts.html">${level === "red" ? "فعّليها دلوقتي" : "التفاصيل"}</a>`;
        if (!old) {
            const main = document.querySelector(".adm-main");
            if (main) main.insertBefore(banner, main.firstChild);
        }
    }

    async function refreshAlertHealth() {
        if (!window.BoseAdmin || !window.BoseAdmin.getAdminAlertStatus) return null;
        try {
            const status = await window.BoseAdmin.getAdminAlertStatus();
            renderAlertHealthBanner(status);
            return status;
        } catch (e) {
            console.warn("تعذر فحص صحة التنبيهات:", e.message || e);
            return null;
        }
    }

    // مكشوف لصفحة "تنبيهات الطلبات" (order-alert-page.js)
    window.BoseOrderAlerts = {
        getDeviceState: computeAlertState,
        runDeviceAction: runAlertButtonAction,
        refreshHealth: refreshAlertHealth,
    };

    async function initOrderAlerts() {
        injectOrderAlertStyles();
        wireOrderAlertButton();
        paintAlertButton(await computeAlertState());
        pollPendingOrders();
        setInterval(pollPendingOrders, PENDING_POLL_MS);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") { pollPendingOrders(); refreshAlertHealth(); }
        });
        document.addEventListener("bose-alert-channel-changed", refreshAlertHealth);
        refreshAlertHealth();
        setInterval(refreshAlertHealth, HEALTH_POLL_MS);
    }

    function renderShell(adminInfo) {
        const currentPage = document.body.getAttribute("data-page") || "index";
        const shellTarget = document.getElementById("adm-shell-target");
        const topbarTarget = document.getElementById("adm-topbar-target");

        if (shellTarget) shellTarget.outerHTML = buildSidebar(currentPage);
        if (topbarTarget) topbarTarget.outerHTML = buildTopbar(currentPage, adminInfo);

        wireInteractions();
        updateNavBadges();
        initOrderAlerts();
    }

    // الشِل بيتبنى بس بعد ما الحارس يتأكد من الجلسة (BoseAdminReady)
    document.addEventListener("BoseAdminReady", (e) => renderShell(e.detail));
})();