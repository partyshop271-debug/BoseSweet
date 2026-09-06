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
                { key: "push-notifications", label: "الإشعارات", icon: "fa-bell", href: "push-notifications.html" },
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
                { key: "gift-card-faqs", label: "أسئلة بطاقات الهدايا", icon: "fa-circle-question", href: "gift-card-faqs.html" },
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
        "push-notifications": ["الإشعارات", "ابعتي إشعار Push حقيقي فورًا لكل العميلات المفعّلة عندهم إشعارات الموقع"],
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
        "gift-card-faqs": ["الأسئلة الشائعة عن بطاقات الهدايا", "إدارة الأسئلة والإجابات الظاهرة للعميلة في صفحة الأسئلة الشائعة عن بطاقات الهدايا"],
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