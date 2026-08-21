/**
 * loyalty-vouchers-page.js - منطق صفحة القسائم الصادرة فقط
 * =====================================================================
 * قائمة عرض فقط (القسائم بتتصدر تلقائياً من القاعدة عبر trigger عند
 * التسليم - مفيش إنشاء يدوي هنا). البحث والفلترة بيتصفوا محلياً بعد
 * التحميل عشان فلتر "الحالة" (نشطة/اتصرفت/منتهية) محسوب مش عمود مباشر.
 */
(function () {
    "use strict";

    let allVouchers = [];

    function formatDate(iso) {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function money(n) {
        return `${Math.round(n || 0).toLocaleString("ar-EG")} ج.م`;
    }

    function voucherStatus(v) {
        if (parseFloat(v.remaining_amount) <= 0) return "used";
        if (new Date(v.expires_at) <= new Date()) return "expired";
        return "active";
    }

    function statusBadgeHTML(status) {
        if (status === "used") return '<span class="adm-badge neutral">اتصرفت بالكامل</span>';
        if (status === "expired") return '<span class="adm-badge danger">منتهية الصلاحية</span>';
        return '<span class="adm-badge success">نشطة</span>';
    }

    /* ============================= بطاقات الملخص ============================= */

    function renderStats() {
        const grid = document.getElementById("lv-stats-grid");
        const active = allVouchers.filter((v) => voucherStatus(v) === "active");
        const used = allVouchers.filter((v) => voucherStatus(v) === "used");
        const expired = allVouchers.filter((v) => voucherStatus(v) === "expired");
        const spentTotal = allVouchers.reduce((sum, v) => sum + (parseFloat(v.amount || 0) - parseFloat(v.remaining_amount || 0)), 0);

        const cards = [
            { icon: "fa-gift", cls: "pink", label: "إجمالي القسائم الصادرة", value: allVouchers.length },
            { icon: "fa-circle-check", cls: "success", label: "نشطة حالياً", value: active.length },
            { icon: "fa-hourglass-end", cls: "warning", label: "منتهية الصلاحية", value: expired.length },
            { icon: "fa-sack-dollar", cls: "gold", label: "إجمالي المصروف من القسائم", value: money(spentTotal) },
        ];
        grid.innerHTML = cards.map((c) => `
            <div class="adm-stat-card">
                <div class="adm-stat-card-text">
                    <span>${c.label}</span>
                    <strong>${window.BoseAdminUI.escapeHtml(String(c.value))}</strong>
                </div>
                <div class="adm-stat-icon ${c.cls}"><i class="fa-solid ${c.icon}"></i></div>
            </div>
        `).join("");
    }

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("lv-tbody");
        const search = document.getElementById("lv-search-input").value.trim().toLowerCase();
        const statusFilter = document.getElementById("lv-status-filter").value;

        let rows = allVouchers;
        if (search) {
            rows = rows.filter((v) => (v.code || "").toLowerCase().includes(search) || (v.phone || "").includes(search));
        }
        if (statusFilter) {
            rows = rows.filter((v) => voucherStatus(v) === statusFilter);
        }

        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="9">${window.BoseAdminUI.emptyStateHTML({ icon: "fa-gift", title: "مفيش قسائم مطابقة", text: "جربي تغيير البحث أو الفلتر" })}</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map((v) => `
            <tr>
                <td class="lv-code">${window.BoseAdminUI.escapeHtml(v.code)}</td>
                <td style="direction:ltr; text-align:right;">${window.BoseAdminUI.escapeHtml(v.phone)}</td>
                <td>${money(v.amount)}</td>
                <td>${money(v.remaining_amount)}</td>
                <td>${v.earned_order ? window.BoseAdminUI.escapeHtml(v.earned_order.order_number) : "—"}</td>
                <td>${v.last_used_order ? window.BoseAdminUI.escapeHtml(v.last_used_order.order_number) : "—"}</td>
                <td>${formatDate(v.issued_at)}</td>
                <td>${formatDate(v.expires_at)}</td>
                <td>${statusBadgeHTML(voucherStatus(v))}</td>
            </tr>
        `).join("");
    }

    /* ============================= التحميل ============================= */

    async function loadVouchers() {
        allVouchers = await window.BoseAdmin.getAllLoyaltyVouchers();
        renderStats();
        renderTable();
    }

    function init() {
        document.getElementById("lv-search-input").addEventListener("input", renderTable);
        document.getElementById("lv-status-filter").addEventListener("change", renderTable);
        loadVouchers();
    }

    document.addEventListener("BoseAdminReady", init);
})();
