/**
 * orders-page.js - منطق صفحة الطلبات فقط
 * =====================================================================
 * الفلترة (بالحالة ونص البحث) بتتبعت لـ admin-data.js وتتنفذ على مستوى
 * القاعدة مباشرة (getAllOrders) بدل ما تتعمل في المتصفح، عشان تفضل
 * سريعة حتى لو عدد الطلبات كبر مع الوقت.
 */
(function () {
    "use strict";

    const DELIVERY_LABELS = { pickup: "استلام من المتجر", delivery: "توصيل" };

    let currentOrders = [];
    let searchDebounceTimer = null;

    /* ============================= الجدول ============================= */

    function formatDate(iso) {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" }) +
            " - " + d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    }

    function money(n) {
        return n || n === 0 ? Math.round(n) + " ج.م" : "—";
    }

    function renderTable() {
        const tbody = document.getElementById("orders-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!currentOrders.length) {
            tbody.innerHTML = `<tr><td colspan="6">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-receipt",
                title: "مفيش طلبات مطابقة",
                text: "جرّب تغيّر الفلتر أو امسح نص البحث.",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = currentOrders.map((o) => `
            <tr class="adm-clickable-row" data-id="${e(o.id)}">
                <td>#${e(o.order_number || o.id)}</td>
                <td>${e(o.customer_name || "—")}</td>
                <td>${e(o.phone1 || "—")}</td>
                <td>${money(o.grand_total)}</td>
                <td>${window.BoseAdminUI.orderStatusBadgeHTML(o.status)}</td>
                <td>${formatDate(o.created_at)}</td>
            </tr>
        `).join("");

        tbody.querySelectorAll("tr[data-id]").forEach((row) => {
            row.addEventListener("click", () => {
                const order = currentOrders.find((o) => o.id === row.getAttribute("data-id"));
                if (order) openOrderModal(order);
            });
        });
    }

    /* ============================= مودال تفاصيل الطلب ============================= */

    // 🚨🚨 [إصلاح جذري حرج - أهم تفاصيل الطلب المخصص كانت غير مرئية تماماً في لوحة
    // التحكم]: getAllOrders بيجيب custom_details كاملة من قاعدة البيانات فعلياً
    // (select("*, order_items(*)"))، لكن الواجهة هنا كانت بتتجاهلها تماماً وبتعرض
    // بس نص عام "طلب مخصص (محاكي)" من غير أي تفاصيل - يعني نص الكتابة على التورتة،
    // ملاحظة الحساسية، نوع الكيك/الشكل/عدد الأفراد، تفاصيل بوكيه الورد، روابط صور
    // الطباعة/التصميم المرجعي... كل ده كان موجود فعلياً في قاعدة البيانات لكن
    // لوحة التحكم (مصدر الحقيقة الدائم للفرع) ما كانتش بتوريه أبداً - الاعتماد
    // كان بالكامل على رسالة الواتساب اللحظية بس، فلو ضاعت الرسالة أو حد احتاج
    // يرجع لتفاصيل طلب قديم من لوحة التحكم نفسها، مفيش أي طريقة يشوف بيها التفاصيل
    // دي خالص. الدالة دي بترسم كل حقول custom_details الفعلية (بنفس منطق فاتورة
    // الواتساب في cart-engine.js) مع تعقيم كامل (e()) لأي نص كتبه العميل بنفسه.
    function customDetailsHTML(cd) {
        const e = window.BoseAdminUI.escapeHtml;
        if (!cd || !Object.keys(cd).length) return "";
        const lines = [];

        if (cd.isGift) lines.push("🎁 هدية لحد تاني");
        if (cd.occasionLabel && cd.occasionLabel.trim()) lines.push(`المناسبة: ${e(cd.occasionLabel.trim())}`);
        if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") lines.push(`طعم الكيك: ${e(cd.cakeType)}`);
        if (cd.shape && cd.shape !== "none" && cd.shape !== "circle") lines.push(`الشكل: ${e(cd.shape)}`);
        if (cd.persons && cd.persons > 0) lines.push(`عدد الأفراد: ${e(String(cd.persons))}`);
        if (cd.printingType && cd.printingType !== "none") lines.push(`طباعة صورة: ${cd.printingType === "edible" ? "قابلة للأكل" : "غير قابلة للأكل"}`);
        if (cd.customMessage && cd.customMessage.trim()) lines.push(`النص المطلوب كتابته: "${e(cd.customMessage.trim())}"`);
        if (cd.allergyNote && cd.allergyNote.trim()) lines.push(`⚠️ ملاحظات وحساسية: ${e(cd.allergyNote.trim())}`);
        if (cd.hasGiftCard && cd.giftCardText && cd.giftCardText.trim()) lines.push(`كارت إهداء: "${e(cd.giftCardText.trim())}"`);
        if (cd.flowerType && cd.flowerType !== "none") lines.push(`نوع الورد: ${e(cd.flowerType)}`);
        if (cd.flowerCount && cd.flowerCount > 0) lines.push(`عدد الورد: ${e(String(cd.flowerCount))} وردة`);
        if (cd.hasSatinRibbon && cd.satinRibbonText && cd.satinRibbonText.trim()) lines.push(`شريط ستان مطبوع: "${e(cd.satinRibbonText.trim())}"`);
        if (cd.photoCount && cd.photoCount > 0) lines.push(`صور شخصية مطبوعة: ${e(String(cd.photoCount))} صورة`);
        if (cd.cashAmount && cd.cashAmount > 0) lines.push(`كاش مدمج جوه البوكيه: +${e(String(cd.cashAmount))} EGP`);
        if (cd.hasChocolate && cd.chocolateBudget && cd.chocolateBudget > 0) lines.push(`ميزانية شوكولاتة: +${e(String(cd.chocolateBudget))} EGP`);
        if (cd.sizeLabel) lines.push(`الحجم: ${e(cd.sizeLabel)}`);

        const imageLinks = [];
        if (cd.printImageUrl) imageLinks.push(`<a href="${e(cd.printImageUrl)}" target="_blank" rel="noopener">🖨️ صورة الطباعة على التورتة</a>`);
        if (cd.replicaImageUrl) imageLinks.push(`<a href="${e(cd.replicaImageUrl)}" target="_blank" rel="noopener">🎨 صورة التصميم المرجعي</a>`);

        if (!lines.length && !imageLinks.length) return "";
        return `
            <div class="adm-order-item-custom-details">
                ${lines.map((l) => `<div>${l}</div>`).join("")}
                ${imageLinks.length ? `<div>${imageLinks.join(" · ")}</div>` : ""}
            </div>`;
    }

    function orderItemRowHTML(item) {
        const e = window.BoseAdminUI.escapeHtml;
        const isCustom = item.custom_details && Object.keys(item.custom_details).length > 0;
        return `
            <div class="adm-order-item-row">
                <div style="flex:1;">
                    <strong>${e(item.title)}</strong>
                    <span class="adm-order-item-meta">
                        ${item.flavor_name ? e(item.flavor_name) + " · " : ""}الكمية: ${item.quantity}
                        ${item.reference_images && item.reference_images.length ? ` · ${item.reference_images.length} صورة مرجعية` : ""}
                    </span>
                    ${isCustom ? customDetailsHTML(item.custom_details) : ""}
                </div>
                <div>${money(item.line_total)}</div>
            </div>`;
    }

    function openOrderModal(order) {
        const e = window.BoseAdminUI.escapeHtml;
        const items = order.order_items || [];

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 560px;">
                <div class="adm-modal-header">
                    <h3>طلب #${e(order.order_number || order.id)}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="adm-order-detail-grid">
                    <div><span>اسم العميل</span><strong>${e(order.customer_name || "—")}</strong></div>
                    <div><span>الهاتف</span><strong>${e(order.phone1 || "—")}${order.phone2 ? " / " + e(order.phone2) : ""}</strong></div>
                    <div><span>طريقة الاستلام</span><strong>${e(DELIVERY_LABELS[order.delivery_method] || order.delivery_method || "—")}</strong></div>
                    <div><span>الموعد</span><strong>${order.scheduled_date ? e(order.scheduled_date) : "—"}${order.scheduled_time ? " - " + e(order.scheduled_time) : ""}</strong></div>
                    ${order.delivery_method === "delivery" ? `
                    <div class="adm-order-detail-full"><span>العنوان</span><strong>${e(order.address || "—")}</strong></div>
                    ` : ""}
                    ${order.notes ? `
                    <div class="adm-order-detail-full"><span>ملاحظات العميل</span><strong>${e(order.notes)}</strong></div>
                    ` : ""}
                    ${order.coupon_code ? `
                    <div><span>كود الخصم</span><strong>${e(order.coupon_code)}</strong></div>
                    ` : ""}
                </div>

                <div class="adm-order-items-list">
                    ${items.length ? items.map(orderItemRowHTML).join("") : `<p style="text-align:center; padding: 10px 0;">مفيش عناصر مسجلة لهذا الطلب</p>`}
                </div>

                <div class="adm-order-totals">
                    <div><span>الإجمالي الفرعي</span><span>${money(order.subtotal)}</span></div>
                    <div><span>الشحن</span><span>${money(order.shipping_fee)}</span></div>
                    ${order.discount_amount ? `<div><span>الخصم</span><span>-${money(order.discount_amount)}</span></div>` : ""}
                    <div class="adm-order-grand-total"><span>الإجمالي الكلي</span><span>${money(order.grand_total)}</span></div>
                </div>

                <!-- 💵 [عربون/دفع مقدم] -->
                <div class="adm-order-totals" style="margin-top: 10px; border-top: 1px dashed #eee; padding-top: 10px;">
                    <div>
                        <span>${order.delivery_method === "delivery" ? "المبلغ الكامل المطلوب (توصيل)" : "عربون تأكيد الحجز (50%)"}</span>
                        <span>${money(order.deposit_amount)}</span>
                    </div>
                    <div>
                        <span>حالة الدفع</span>
                        <span>${order.deposit_status === "confirmed"
                            ? `<span class="adm-badge success">تم تأكيد استلام المبلغ${order.deposit_confirmed_at ? " - " + new Date(order.deposit_confirmed_at).toLocaleString("ar-EG") : ""}</span>`
                            : `<span class="adm-badge warning">بانتظار تأكيد الاستلام</span>`}</span>
                    </div>
                </div>
                ${order.deposit_status !== "confirmed" ? `
                <div class="adm-mt-16">
                    <button type="button" class="adm-btn adm-btn-primary" id="order-confirm-deposit-btn" style="width:100%;">
                        ✅ تأكيد استلام ${order.delivery_method === "delivery" ? "المبلغ" : "العربون"} (${money(order.deposit_amount)})
                    </button>
                </div>
                ` : ""}

                <div class="adm-field adm-mt-16">
                    <label for="order-status-select">حالة الطلب</label>
                    <select class="adm-select" id="order-status-select">
                        ${window.BoseAdminUI.ORDER_STATUSES.map((s) => `
                            <option value="${s.key}" ${s.key === order.status ? "selected" : ""}>${s.label}</option>
                        `).join("")}
                    </select>
                </div>

                <div class="adm-modal-actions">
                    <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إغلاق</button>
                    <button type="button" class="adm-btn adm-btn-primary" id="order-status-save-btn">تحديث الحالة</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }

        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        const confirmDepositBtn = document.getElementById("order-confirm-deposit-btn");
        if (confirmDepositBtn) {
            confirmDepositBtn.addEventListener("click", async () => {
                confirmDepositBtn.disabled = true;
                confirmDepositBtn.textContent = "جاري التأكيد...";
                try {
                    await window.BoseAdmin.confirmOrderDeposit(order.id);
                    window.BoseAdminUI.showToast("تم تأكيد استلام المبلغ وانتقل الطلب لحالة مؤكد", "success");
                    close();
                    await loadOrders();
                } catch (err) {
                    window.BoseAdminUI.showToast("تعذر تأكيد استلام المبلغ", "error");
                    confirmDepositBtn.disabled = false;
                    confirmDepositBtn.textContent = "✅ تأكيد استلام المبلغ";
                }
            });
        }

        document.getElementById("order-status-save-btn").addEventListener("click", async () => {
            const newStatus = document.getElementById("order-status-select").value;
            const btn = document.getElementById("order-status-save-btn");
            if (newStatus === order.status) { close(); return; }

            btn.disabled = true;
            btn.textContent = "جاري الحفظ...";
            try {
                await window.BoseAdmin.updateOrderStatus(order.id, newStatus);
                window.BoseAdminUI.showToast("تم تحديث حالة الطلب", "success");
                close();
                await loadOrders();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر تحديث حالة الطلب", "error");
                btn.disabled = false;
                btn.textContent = "تحديث الحالة";
            }
        });
    }

    /* ============================= التحميل والفلترة ============================= */

    async function loadOrders() {
        const tbody = document.getElementById("orders-tbody");
        tbody.innerHTML = `<tr><td colspan="6"><div class="adm-loading-spinner"></div></td></tr>`;

        const status = document.getElementById("orders-status-filter").value;
        const search = document.getElementById("orders-search-input").value.trim();

        currentOrders = await window.BoseAdmin.getAllOrders({ status, search });
        renderTable();
    }

    function buildStatusFilterOptions() {
        const select = document.getElementById("orders-status-filter");
        const e = window.BoseAdminUI.escapeHtml;
        select.innerHTML = `<option value="">كل الحالات</option>` +
            window.BoseAdminUI.ORDER_STATUSES.map((s) => `<option value="${s.key}">${e(s.label)}</option>`).join("");
    }

    function wireControls() {
        document.getElementById("orders-search-input").addEventListener("input", () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(loadOrders, 350);
        });
        document.getElementById("orders-status-filter").addEventListener("change", loadOrders);
    }

    document.addEventListener("BoseAdminReady", async () => {
        buildStatusFilterOptions();
        wireControls();
        await loadOrders();
    });
})();