/**
 * dashboard-page.js - منطق صفحة الداشبورد فقط
 */
(function () {
    "use strict";

    // ملحوظة: تسميات وألوان حالة الطلب مصدرها الوحيد admin-ui-utils.js
    // (orderStatusBadgeHTML) عشان تتشارك مع orders-page.js من غير تكرار.

    function formatDate(iso) {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function money(n) {
        return `${Math.round(n || 0).toLocaleString("ar-EG")} ج.م`;
    }

    function renderStats(summary) {
        const grid = document.getElementById("dashboard-stats-grid");
        const cards = [
            { icon: "fa-receipt", cls: "pink", label: "طلبات اليوم", value: summary.ordersToday ?? 0 },
            { icon: "fa-sack-dollar", cls: "success", label: "إيراد اليوم", value: money(summary.revenueToday) },
            { icon: "fa-chart-line", cls: "gold", label: "إيراد آخر 30 يوم", value: money(summary.revenueMonth) },
            { icon: "fa-scale-balanced", cls: "info", label: "متوسط قيمة الطلب (30 يوم)", value: money(summary.avgOrderValueMonth) },
            { icon: "fa-hourglass-half", cls: "warning", label: "طلبات قيد المراجعة", value: summary.pendingOrders ?? 0 },
            { icon: "fa-star", cls: "warning", label: "تقييمات بانتظار الاعتماد", value: summary.pendingReviews ?? 0 },
            { icon: "fa-cake-candles", cls: "gold", label: "إجمالي المنتجات", value: summary.totalProducts ?? 0 },
            { icon: "fa-tags", cls: "success", label: "عروض نشطة حالياً", value: summary.activeOffers ?? 0 },
        ];
        grid.innerHTML = cards.map((c) => `
            <div class="adm-stat-card">
                <div class="adm-stat-card-text">
                    <span>${c.label}</span>
                    <strong>${c.value}</strong>
                </div>
                <div class="adm-stat-icon ${c.cls}"><i class="fa-solid ${c.icon}"></i></div>
            </div>
        `).join("");
    }

    /**
     * 🛡️ [إضافة جديدة - تنبيهات فعلية]: كل الأرقام هنا كانت موجودة ومحسوبة
     * فعلياً (إما من الداشبورد RPC أو من فلتر "بدون صورة حقيقية" الموجود أصلاً
     * في صفحة المنتجات) لكن محدش كان بيلفت نظر صاحبة المتجر ليها غير لو
     * فتحت الصفحة المعنية بنفسها وشافت. دلوقتي بتظهر كتنبيه فوري في أول
     * صفحة بتفتحها كل يوم.
     */
    function renderAlerts({ missingPhotoCount, unavailableProducts, pendingOrders }) {
        const card = document.getElementById("dashboard-alerts-card");
        const list = document.getElementById("dashboard-alerts-list");
        const alerts = [];

        if (missingPhotoCount > 0) {
            alerts.push({
                icon: "fa-image", cls: "warning",
                text: `${missingPhotoCount} منتج لسه شايل صورة اللوجو الافتراضية بدل صورة حقيقية`,
                href: "products.html",
            });
        }
        if (pendingOrders > 0) {
            alerts.push({
                icon: "fa-hourglass-half", cls: "warning",
                text: `${pendingOrders} طلب لسه قيد المراجعة محتاج تأكيد`,
                href: "orders.html",
            });
        }
        if (unavailableProducts > 0) {
            alerts.push({
                icon: "fa-ban", cls: "danger",
                text: `${unavailableProducts} منتج معلّم "غير متاح" حالياً - راجعيهم لو التوفر رجع`,
                href: "products.html",
            });
        }

        if (!alerts.length) { card.style.display = "none"; return; }
        card.style.display = "";
        list.innerHTML = alerts.map((a) => `
            <a href="${a.href}" class="adm-alert-row">
                <div class="adm-stat-icon ${a.cls}" style="width:36px; height:36px; font-size:0.9rem;"><i class="fa-solid ${a.icon}"></i></div>
                <span>${a.text}</span>
                <i class="fa-solid fa-chevron-left"></i>
            </a>
        `).join("");
    }

    function renderRecentOrders(orders) {
        const tbody = document.getElementById("recent-orders-tbody");
        if (!orders.length) {
            tbody.innerHTML = `<tr><td colspan="5">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-receipt",
                title: "مفيش طلبات لسه",
                text: "أول طلب يوصل هيظهر هنا فوراً.",
            })}</td></tr>`;
            return;
        }
        // ⚠️ order_number و customer_name جايين من فورم الشيك أوت العام (أي زبون بيملاها)
        // لازم يتعقّموا بـ escapeHtml قبل innerHTML عشان محدش يقدر يحقن HTML/JS
        // عن طريق اسمه في الطلب (stored XSS في لوحة الإدارة).
        const esc = window.BoseAdminUI.escapeHtml;
        tbody.innerHTML = orders.map((o) => `
            <tr>
                <td>#${esc(o.order_number || o.id)}</td>
                <td>${esc(o.customer_name || "—")}</td>
                <td>${o.grand_total ? Math.round(o.grand_total) + " ج.م" : "—"}</td>
                <td>${window.BoseAdminUI.orderStatusBadgeHTML(o.status)}</td>
                <td>${formatDate(o.created_at)}</td>
            </tr>
        `).join("");
    }

    /**
     * 🆕 [تحسين إنتاجية - قائمة قابلة للتنفيذ]: كل الطلبات "قيد المراجعة"
     * بتتعرض هنا بأزرار تأكيد/إلغاء مباشرة، من غير ما تسيبي الداشبورد وتفتحي
     * صفحة الطلبات. حد أقصى 8 عشان الكارت يفضل قابل للقراءة بسرعة - لو أكتر،
     * فيه رابط "عرض الكل" في نهاية القائمة بيوديها لصفحة الطلبات بفلتر جاهز.
     */
    async function loadPendingOrdersActionable() {
        const card = document.getElementById("dashboard-pending-card");
        const list = document.getElementById("dashboard-pending-list");
        if (!card || !list) return;

        let pendingOrders = [];
        try {
            pendingOrders = await window.BoseAdmin.getOrdersLean({ status: "pending" });
        } catch (e) {
            return; // مفيش داعي نكسر باقي الداشبورد لو الطلب ده فشل
        }

        if (!pendingOrders.length) { card.style.display = "none"; return; }
        card.style.display = "";

        const e = window.BoseAdminUI.escapeHtml;
        const visible = pendingOrders.slice(0, 8);

        function renderRow(o) {
            return `
                <div class="adm-pending-order-row" data-id="${e(o.id)}">
                    <div class="adm-pending-order-info">
                        <strong>#${e(o.order_number || o.id)} - ${e(o.customer_name || "—")}</strong>
                        <small>${o.grand_total ? Math.round(o.grand_total) + " ج.م" : "—"} - ${formatDate(o.created_at)}</small>
                    </div>
                    <div class="adm-pending-order-actions">
                        <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" data-action="confirm" data-id="${e(o.id)}">
                            <i class="fa-solid fa-check"></i> تأكيد
                        </button>
                        <button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-action="cancel" data-id="${e(o.id)}">
                            <i class="fa-solid fa-xmark"></i> إلغاء
                        </button>
                        <a href="orders.html?open=${e(o.id)}" class="adm-btn adm-btn-sm adm-btn-outline">
                            <i class="fa-solid fa-eye"></i>
                        </a>
                    </div>
                </div>`;
        }

        list.innerHTML = visible.map(renderRow).join("") +
            (pendingOrders.length > visible.length
                ? `<div class="adm-mt-16"><a href="orders.html" class="adm-btn adm-btn-outline adm-btn-sm">عرض باقي الطلبات قيد المراجعة (${pendingOrders.length - visible.length})</a></div>`
                : "");

        list.querySelectorAll("button[data-action]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                const newStatus = btn.getAttribute("data-action") === "confirm" ? "confirmed" : "cancelled";
                btn.disabled = true;
                try {
                    await window.BoseAdmin.updateOrderStatus(id, newStatus);
                    window.BoseAdminUI.showToast(
                        newStatus === "confirmed" ? "تم تأكيد الطلب" : "تم إلغاء الطلب", "success"
                    );
                    const row = list.querySelector(`.adm-pending-order-row[data-id="${CSS.escape(id)}"]`);
                    if (row) row.remove();
                    if (!list.querySelector(".adm-pending-order-row")) card.style.display = "none";
                } catch (err) {
                    window.BoseAdminUI.showToast("تعذر تحديث حالة الطلب", "error");
                    btn.disabled = false;
                }
            });
        });
    }

    async function init() {
        let summary = {};
        try {
            // 🆕 [تحسين أداء] بيستخدم نفس الـ promise اللي admin-shell.js بدأه
            // لشارات القائمة الجانبية بدل ما يكرر نفس الاستعلام على القاعدة.
            summary = await window.BoseAdminShared.getDashboardSummary();
            renderStats(summary);
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر تحميل إحصائيات الداشبورد", "error");
        }

        loadPendingOrdersActionable();

        try {
            const missingPhotoCount = await window.BoseAdmin.getMissingPhotoProductsCount();
            renderAlerts({
                missingPhotoCount,
                unavailableProducts: summary.unavailableProducts ?? 0,
                pendingOrders: summary.pendingOrders ?? 0,
            });
        } catch (e) {
            console.warn("تعذر بناء تنبيهات الداشبورد:", e.message);
        }

        try {
            const orders = await window.BoseAdmin.getRecentOrders(5);
            renderRecentOrders(orders);
        } catch (e) {
            document.getElementById("recent-orders-tbody").innerHTML =
                `<tr><td colspan="5">${window.BoseAdminUI.emptyStateHTML({
                    icon: "fa-triangle-exclamation",
                    title: "تعذر تحميل الطلبات",
                    text: "تأكد من اسم جدول orders في قاعدة البيانات.",
                })}</td></tr>`;
        }
    }

    document.addEventListener("BoseAdminReady", init);
})();