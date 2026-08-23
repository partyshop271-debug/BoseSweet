/**
 * review-followups-page.js - قائمة تذكير المراجعات اليومية
 * =====================================================================
 * 👑 [فكرة صاحبة المتجر]: تذكير العميل يقيّم منتجه بعد يوم واحد من التسليم -
 * أقوى توقيت نفسي للمراجعة (العميل لسه فرحان بتجربته وقريب منها). الإرسال
 * التلقائي الكامل عبر واتساب مش متاح فعلياً من غير حساب WhatsApp Business
 * Platform معتمد من Meta (يحتاج API key منفصل لازم صاحبة المتجر توفره بنفسها) -
 * فالحل العملي المتاح دلوقتي هو "طابور يومي" بضغطتين: رابط واتساب جاهز
 * برسالة معبّأة مسبقاً، وزرار "تم الإرسال" يوثّق إنه اتبعت (review_reminder_sent_at)
 * عشان الطلب يختفي من القائمة بعدها. لو لاحقاً حبيتي تفعيل الإرسال التلقائي
 * الكامل، محتاجين وقتها ربط WhatsApp Business API فعلي.
 */
(function () {
    "use strict";

    let currentFollowups = [];

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

    function daysSince(iso) {
        if (!iso) return "—";
        const diffMs = Date.now() - new Date(iso).getTime();
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        return days <= 1 ? "يوم واحد" : `${days} أيام`;
    }

    function itemsSummary(items) {
        if (!items || !items.length) return "—";
        return items.map((it) => it.title).join("، ");
    }

    /** أول منتج فعلي في الطلب (لو موجود product_id) - عشان نربط الرسالة برابط تقييمه مباشرة */
    function firstReviewableSlug(items) {
        const found = (items || []).find((it) => it.product_id);
        return found ? found.product_id : null;
    }

    /** رابط تقييم جوجل الرسمي لصفحة "حلويات بوسي" على الخرائط - ثابت لكل الطلبات */
    const GOOGLE_REVIEW_LINK = "https://g.page/r/Ca7yD4O1cGT3EBI/review";

    function buildReminderMessage(order) {
        const storeUrl = window.location.origin;
        const slug = firstReviewableSlug(order.order_items);
        const link = slug ? `${storeUrl}/product.html?slug=${slug}` : storeUrl;
        const firstName = (order.customer_name || "").trim().split(" ")[0] || "";
        return `أهلاً ${firstName} 🌸 نورتينا بطلبك من حلويات بوسي!\n\nلو عندك دقيقة، هيسعدنا رأيك على جوجل (بيساعد عملاء تانيين يلاقونا):\n${GOOGLE_REVIEW_LINK}\n\nوكمان تقدري تقيّمي الصنف نفسه هنا:\n${link}\n\nرأيك بيفرق فعلاً معانا 💕`;
    }

    function buildWhatsappUrl(order) {
        const intl = toInternational(order.phone1);
        if (window.BoseAdminUI && typeof window.BoseAdminUI.buildWhatsappUrl === "function") {
            return window.BoseAdminUI.buildWhatsappUrl(intl, buildReminderMessage(order));
        }
        return `https://wa.me/${intl}?text=${encodeURIComponent(buildReminderMessage(order))}`;
    }

    function renderTable() {
        const tbody = document.getElementById("followups-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!currentFollowups.length) {
            tbody.innerHTML = `<tr><td colspan="5">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-comment-dots",
                title: "مفيش تذكيرات مستحقة دلوقتي",
                text: "أي طلب يتسلم وتفضل يوم كامل من غير تذكير، هيظهر هنا تلقائياً.",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = currentFollowups.map((o) => `
            <tr>
                <td>${e(o.order_number || "—")}</td>
                <td>${e(o.customer_name || "—")}<br><span class="adm-order-item-meta">${e(o.phone1 || "")}</span></td>
                <td style="max-width: 260px; white-space: normal;">${e(itemsSummary(o.order_items))}</td>
                <td>${daysSince(o.delivered_at)}</td>
                <td class="adm-table-actions">
                    <a class="adm-btn adm-btn-primary" href="${buildWhatsappUrl(o)}" target="_blank" rel="noopener" style="text-decoration:none; white-space:nowrap;">
                        <i class="fa-brands fa-whatsapp"></i> ابعتي على واتساب
                    </a>
                    <button class="adm-btn adm-btn-ghost" data-action="mark-sent" data-id="${e(o.id)}">تم الإرسال</button>
                </td>
            </tr>`).join("");

        tbody.querySelectorAll('[data-action="mark-sent"]').forEach((btn) => {
            btn.addEventListener("click", () => handleMarkSent(btn.getAttribute("data-id")));
        });
    }

    async function handleMarkSent(orderId) {
        try {
            await window.BoseAdmin.markReviewReminderSent(orderId);
            window.BoseAdminUI.showToast("تم تسجيل إرسال التذكير", "success");
            await loadFollowups();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر تسجيل الإرسال", "error");
        }
    }

    async function loadFollowups() {
        const tbody = document.getElementById("followups-tbody");
        tbody.innerHTML = `<tr><td colspan="5"><div class="adm-loading-spinner"></div></td></tr>`;
        currentFollowups = await window.BoseAdmin.getReviewFollowups();
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("followups-refresh-btn").addEventListener("click", loadFollowups);
        await loadFollowups();
    });
})();
