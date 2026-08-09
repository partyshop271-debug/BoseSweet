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

    function renderStats(summary) {
        const grid = document.getElementById("dashboard-stats-grid");
        const cards = [
            { icon: "fa-receipt", cls: "pink", label: "طلبات اليوم", value: summary.ordersToday },
            { icon: "fa-star", cls: "warning", label: "تقييمات بانتظار الاعتماد", value: summary.pendingReviews },
            { icon: "fa-cake-candles", cls: "gold", label: "إجمالي المنتجات", value: summary.totalProducts },
            { icon: "fa-tags", cls: "success", label: "عروض نشطة حالياً", value: summary.activeOffers },
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

    async function init() {
        try {
            const summary = await window.BoseAdmin.getDashboardSummary();
            renderStats(summary);
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر تحميل إحصائيات الداشبورد", "error");
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