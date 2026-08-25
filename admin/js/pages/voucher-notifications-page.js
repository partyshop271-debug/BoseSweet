/**
 * voucher-notifications-page.js - قائمة "قسائم لسه محدش اتقالها"
 * =====================================================================
 * قايمة مهام يومية (زي تذكير المراجعات بالظبط)، مش سجل - بتفلتر من نفس
 * بيانات "القسائم الصادرة" على القسائم النشطة اللي notified_at لسه null.
 * لما تتأكد إنك بعتّي للعميل، بتضغطي "تم الإخبار" فتختفي من هنا، لكن تفضل
 * موجودة للأبد في صفحة القسائم الصادرة كسجل.
 */
(function () {
    "use strict";

    let currentVouchers = [];

    function sanitizePhone(phone) {
        if (!phone) return "";
        let cleaned = phone.trim().replace(/[\s\-()+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        else if (cleaned.startsWith("00201")) cleaned = "0" + cleaned.substring(4);
        else if (cleaned.startsWith("1") && cleaned.length === 10) cleaned = "0" + cleaned;
        return cleaned;
    }
    function toInternational(phone) {
        let cleaned = sanitizePhone(phone);
        if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
        return "20" + cleaned;
    }

    function money(n) {
        return `${Math.round(n || 0).toLocaleString("ar-EG")} ج.م`;
    }

    function formatDate(iso) {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function buildNotifyMessage(v) {
        return `مبروك! 🎁 عندك قسيمة هدية من حلويات بوسي بقيمة ${Math.round(v.remaining_amount)} جنيه:\n${v.code}\nاستخدميها في طلبك الجاي، صالحة لغاية ${formatDate(v.expires_at)}.`;
    }

    function buildWhatsappUrl(v) {
        const intl = toInternational(v.phone);
        const message = buildNotifyMessage(v);
        if (window.BoseAdminUI && typeof window.BoseAdminUI.buildWhatsappUrl === "function") {
            return window.BoseAdminUI.buildWhatsappUrl(intl, message);
        }
        return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
    }

    function buildGiftCardUrl(v) {
        const params = new URLSearchParams({
            code: v.code,
            amount: String(Math.round(v.remaining_amount)),
            expires: v.expires_at || "",
            name: v.earned_order && v.earned_order.customer_name ? v.earned_order.customer_name.trim().split(" ")[0] : "",
        });
        return `voucher-gift-card.html?${params.toString()}`;
    }

    function renderTable() {
        const tbody = document.getElementById("vn-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!currentVouchers.length) {
            tbody.innerHTML = `<tr><td colspan="7">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-bell",
                title: "مفيش قسائم مستنية تنبيه دلوقتي",
                text: "أي قسيمة جديدة (تلقائية أو يدوية) هتظهر هنا لحد ما تتأكدي إنك بعتيها للعميل.",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = currentVouchers.map((v) => {
            const source = v.earned_order
                ? `<span class="adm-order-item-meta">طلب ${e(v.earned_order.order_number)}</span>`
                : `<span class="adm-badge neutral">إصدار يدوي</span>`;
            return `
            <tr>
                <td class="lv-code" style="direction:ltr; text-align:right;">${e(v.code)}</td>
                <td style="direction:ltr; text-align:right;">${e(v.phone)}</td>
                <td>${money(v.remaining_amount)}</td>
                <td>${source}</td>
                <td>${e(v.earned_order && v.earned_order.customer_name ? v.earned_order.customer_name : "—")}</td>
                <td>${formatDate(v.expires_at)}</td>
                <td class="adm-table-actions">
                    <a class="adm-btn adm-btn-ghost" href="${buildGiftCardUrl(v)}" target="_blank" rel="noopener" style="text-decoration:none; white-space:nowrap;">
                        <i class="fa-solid fa-gift"></i> عرض كارت الهدية
                    </a>
                    <a class="adm-btn adm-btn-primary" href="${buildWhatsappUrl(v)}" target="_blank" rel="noopener" style="text-decoration:none; white-space:nowrap;">
                        <i class="fa-brands fa-whatsapp"></i> ابعتي رسالة
                    </a>
                    <button class="adm-btn adm-btn-ghost" data-action="mark-notified" data-id="${e(v.id)}">تم الإخبار</button>
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll('[data-action="mark-notified"]').forEach((btn) => {
            btn.addEventListener("click", () => handleMarkNotified(btn.getAttribute("data-id")));
        });
    }

    async function handleMarkNotified(voucherId) {
        try {
            await window.BoseAdmin.markVoucherNotified(voucherId);
            window.BoseAdminUI.showToast("تم تسجيل إخبار العميل", "success");
            await loadVouchers();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر تسجيل الإخبار", "error");
        }
    }

    async function loadVouchers() {
        const tbody = document.getElementById("vn-tbody");
        tbody.innerHTML = `<tr><td colspan="7"><div class="adm-loading-spinner"></div></td></tr>`;
        currentVouchers = await window.BoseAdmin.getUnnotifiedVouchers();
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("vn-refresh-btn").addEventListener("click", loadVouchers);
        await loadVouchers();
    });
})();
