/**
 * voucher-notifications-page.js - قائمة "قسائم/بطاقات لسه محدش اتقالها"
 * =====================================================================
 * قايمة مهام يومية موحّدة (زي تذكير المراجعات بالظبط)، مش سجل - بتجمع
 * النوعين مع بعض في قايمة واحدة مرتبة بتاريخ الصدور:
 *   - قسائم الولاء (loyalty_vouchers) - مكافأة مجانية من دورة الولاء
 *   - بطاقات الهدايا (gift_cards) - اشتُريت بفلوس حقيقية
 * كل نوع بيتصفّى من نفس بياناته على النشط اللي notified_at لسه null.
 * لما تتأكد إنك بعتّي للعميل، بتضغطي "تم الإخبار" فتختفي من هنا، لكن تفضل
 * موجودة للأبد في صفحتها الأصلية (القسائم الصادرة / بطاقات الهدايا) كسجل.
 */
(function () {
    "use strict";

    let currentItems = [];

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

    function buildNotifyMessage(item) {
        const label = item._kind === "giftcard" ? "بطاقة هدية" : "قسيمة هدية";
        return `مبروك! 🎁 عندك ${label} من حلويات بوسي بقيمة ${Math.round(item.remaining_amount)} جنيه:\n${item.code}\nاستخدميها في طلبك الجاي، صالحة لغاية ${formatDate(item.expires_at)}.`;
    }

    function buildWhatsappUrl(item) {
        const intl = toInternational(item.phone);
        const message = buildNotifyMessage(item);
        if (window.BoseAdminUI && typeof window.BoseAdminUI.buildWhatsappUrl === "function") {
            return window.BoseAdminUI.buildWhatsappUrl(intl, message);
        }
        return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
    }

    function buildGiftCardUrl(item) {
        const params = new URLSearchParams({
            code: item.code,
            amount: String(Math.round(item.remaining_amount)),
            expires: item.expires_at || "",
            name: item.sourceOrder && item.sourceOrder.customer_name ? item.sourceOrder.customer_name.trim().split(" ")[0] : "",
        });
        return `voucher-gift-card.html?${params.toString()}`;
    }

    function typeBadgeHTML(item) {
        return item._kind === "giftcard"
            ? '<span class="adm-badge gold"><i class="fa-solid fa-wallet"></i> بطاقة هدية</span>'
            : '<span class="adm-badge pink"><i class="fa-solid fa-gift"></i> قسيمة ولاء</span>';
    }

    function renderTable() {
        const tbody = document.getElementById("vn-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!currentItems.length) {
            tbody.innerHTML = `<tr><td colspan="8">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-bell",
                title: "مفيش قسائم أو بطاقات مستنية تنبيه دلوقتي",
                text: "أي قسيمة ولاء أو بطاقة هدية جديدة (تلقائية أو يدوية) هتظهر هنا لحد ما تتأكدي إنك بعتيها للعميل.",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = currentItems.map((item) => {
            const source = item.sourceOrder
                ? `<span class="adm-order-item-meta">طلب ${e(item.sourceOrder.order_number)}</span>`
                : `<span class="adm-badge neutral">إصدار يدوي</span>`;
            return `
            <tr>
                <td>${typeBadgeHTML(item)}</td>
                <td class="lv-code" style="direction:ltr; text-align:right;">${e(item.code)}</td>
                <td style="direction:ltr; text-align:right;">${e(item.phone)}</td>
                <td>${money(item.remaining_amount)}</td>
                <td>${source}</td>
                <td>${e(item.sourceOrder && item.sourceOrder.customer_name ? item.sourceOrder.customer_name : "—")}</td>
                <td>${formatDate(item.expires_at)}</td>
                <td class="adm-table-actions">
                    <a class="adm-btn adm-btn-ghost" href="${buildGiftCardUrl(item)}" target="_blank" rel="noopener" style="text-decoration:none; white-space:nowrap;">
                        <i class="fa-solid fa-gift"></i> عرض الكارت
                    </a>
                    <a class="adm-btn adm-btn-primary" href="${buildWhatsappUrl(item)}" target="_blank" rel="noopener" style="text-decoration:none; white-space:nowrap;">
                        <i class="fa-brands fa-whatsapp"></i> ابعتي رسالة
                    </a>
                    <button class="adm-btn adm-btn-ghost" data-action="mark-notified" data-kind="${item._kind}" data-id="${e(item.id)}">تم الإخبار</button>
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll('[data-action="mark-notified"]').forEach((btn) => {
            btn.addEventListener("click", () => handleMarkNotified(btn.getAttribute("data-kind"), btn.getAttribute("data-id")));
        });
    }

    async function handleMarkNotified(kind, itemId) {
        try {
            if (kind === "giftcard") {
                await window.BoseAdmin.markGiftCardNotified(itemId);
            } else {
                await window.BoseAdmin.markVoucherNotified(itemId);
            }
            window.BoseAdminUI.showToast("تم تسجيل إخبار العميل", "success");
            await loadItems();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر تسجيل الإخبار", "error");
        }
    }

    /**
     * 🔗 [توحيد النوعين]: بنجيب النوعين مع بعض بالتوازي، وبنطبّعهم في شكل
     * موحّد (phone/code/remaining_amount/expires_at/issued_at/sourceOrder)
     * قبل ما نرتّبهم كلهم مع بعض بتاريخ الصدور - عشان العرض يبقى قايمة
     * واحدة متسقة بغض النظر عن مصدر كل عنصر.
     */
    async function loadItems() {
        const tbody = document.getElementById("vn-tbody");
        tbody.innerHTML = `<tr><td colspan="8"><div class="adm-loading-spinner"></div></td></tr>`;

        const [loyaltyVouchers, giftCards] = await Promise.all([
            window.BoseAdmin.getUnnotifiedVouchers(),
            window.BoseAdmin.getUnnotifiedGiftCards(),
        ]);

        const normalizedVouchers = loyaltyVouchers.map((v) => ({
            _kind: "loyalty",
            id: v.id,
            code: v.code,
            phone: v.phone,
            remaining_amount: v.remaining_amount,
            expires_at: v.expires_at,
            issued_at: v.issued_at,
            sourceOrder: v.earned_order || null,
        }));
        const normalizedGiftCards = giftCards.map((c) => ({
            _kind: "giftcard",
            id: c.id,
            code: c.code,
            phone: c.purchaser_phone,
            remaining_amount: c.remaining_amount,
            expires_at: c.expires_at,
            issued_at: c.issued_at,
            sourceOrder: c.purchase_order || null,
        }));

        currentItems = [...normalizedVouchers, ...normalizedGiftCards].sort(
            (a, b) => new Date(a.issued_at) - new Date(b.issued_at)
        );
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("vn-refresh-btn").addEventListener("click", loadItems);
        await loadItems();
    });
})();
