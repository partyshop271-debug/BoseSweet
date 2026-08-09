/**
 * offers-page.js - منطق صفحة عروض المنتجات فقط
 * =====================================================================
 * جدول offers هنا هو المصدر الحقيقي: كل صف = ربط FK لمنتج موجود في
 * products (offers.product_id -> products.id)، مش كائن مستقل بياناته
 * مكررة. لازم يكون للمنتج المختار old_price أكبر من price في صفحة
 * "المنتجات" علشان شارة الخصم تظهر فعلياً على الموقع العام - الصفحة دي
 * بتحدد *مين* يظهر في قسم العروض المميزة، مش بتحدد السعر نفسه.
 *
 * ده منفصل تماماً عن "بانرات العروض" (promotions.html) اللي بتدير كروت
 * تسويقية حرة (JSON مستقل في store_settings.promotions) مش مربوطة
 * بمنتج حقيقي.
 */
(function () {
    "use strict";

    let allOffers = [];
    let allProducts = [];

    function money(n) {
        return n || n === 0 ? Math.round(n) + " ج.م" : "—";
    }

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("offers-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!allOffers.length) {
            tbody.innerHTML = `<tr><td colspan="6">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-percent",
                title: "مفيش عروض مضافة لسه",
                text: "اضغط \"إضافة عرض\" واختار منتج موجود عليه سعر قديم.",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = allOffers.map((o) => {
            const p = o.products; // جاي من الـ join في getAllOffers
            const thumb = p && p.images && p.images[0] ? p.images[0] : "";
            const missing = !p; // المنتج المرتبط اتحذف من products بعد ما العرض اتضاف
            return `
            <tr>
                <td>${thumb ? `<img src="${e(thumb)}" class="adm-table-thumb" alt="">` : `<div class="adm-table-thumb"></div>`}</td>
                <td>${missing ? `<span class="adm-badge danger">منتج محذوف</span>` : e(p.title)}</td>
                <td>${missing ? "—" : (p.old_price ? money(p.old_price) : `<span class="adm-order-item-meta">مفيش سعر قديم</span>`)}</td>
                <td>${missing ? "—" : money(p.price)}</td>
                <td>${o.sort_order ?? 0}</td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-id="${e(o.id)}" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-id="${e(o.id)}" title="إزالة">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                const offer = allOffers.find((o) => o.id === btn.getAttribute("data-id"));
                if (offer) openOfferModal(offer);
            });
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(btn.getAttribute("data-id")));
        });
    }

    async function handleDelete(id) {
        const offer = allOffers.find((o) => o.id === id);
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الإزالة",
            message: `هل أنت متأكد من إزالة "${offer?.products?.title || "هذا العرض"}" من قسم العروض؟ المنتج نفسه هيفضل موجود في المتجر عادي.`,
            confirmLabel: "إزالة",
            danger: true,
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.deleteOffer(id);
            window.BoseAdminUI.showToast("تم إزالة العرض", "success");
            await loadOffers();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر إزالة العرض", "error");
        }
    }

    /* ============================= مودال إضافة/تعديل ============================= */

    function openOfferModal(offer) {
        const isEdit = !!offer;
        const e = window.BoseAdminUI.escapeHtml;

        // في الإضافة: امنع اختيار منتج موجود بالفعل جوه offers عشان مفيش تكرار
        const usedProductIds = new Set(allOffers.filter((o) => !isEdit || o.id !== offer.id).map((o) => o.product_id));
        const availableProducts = allProducts.filter((p) => !usedProductIds.has(p.id) || (isEdit && p.id === offer.product_id));

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 460px;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل عرض" : "إضافة عرض"}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form id="offer-form">
                    <div class="adm-field">
                        <label for="of-product">المنتج</label>
                        <select class="adm-select" id="of-product" required>
                            <option value="">اختر منتج...</option>
                            ${availableProducts.map((p) => `
                                <option value="${e(p.id)}" ${isEdit && p.id === offer.product_id ? "selected" : ""}>
                                    ${e(p.title)}${p.old_price ? "" : " (بدون سعر قديم حالياً)"}
                                </option>
                            `).join("")}
                        </select>
                        <span class="adm-hint">لو المنتج مالوش سعر قديم (old_price) في صفحة "المنتجات"، شارة الخصم مش هتظهر ليه في الموقع حتى لو اتضاف هنا.</span>
                    </div>

                    <div class="adm-field">
                        <label for="of-sort-order">ترتيب العرض</label>
                        <input type="number" class="adm-input" id="of-sort-order" value="${isEdit ? (offer.sort_order ?? 0) : allOffers.length}">
                    </div>

                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="of-save-btn">حفظ</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }
        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("offer-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("of-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const payload = {
                product_id: document.getElementById("of-product").value,
                sort_order: parseInt(document.getElementById("of-sort-order").value, 10) || 0,
            };

            try {
                if (isEdit) {
                    await window.BoseAdmin.updateOffer(offer.id, payload);
                    window.BoseAdminUI.showToast("تم تعديل العرض", "success");
                } else {
                    await window.BoseAdmin.createOffer(payload);
                    window.BoseAdminUI.showToast("تم إضافة العرض", "success");
                }
                close();
                await loadOffers();
            } catch (err) {
                window.BoseAdminUI.showToast(isEdit ? "تعذر تعديل العرض" : "تعذر إضافة العرض", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadOffers() {
        const tbody = document.getElementById("offers-tbody");
        tbody.innerHTML = `<tr><td colspan="6"><div class="adm-loading-spinner"></div></td></tr>`;
        allOffers = await window.BoseAdmin.getAllOffers();
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("add-offer-btn").addEventListener("click", () => openOfferModal(null));
        [allOffers, allProducts] = await Promise.all([
            window.BoseAdmin.getAllOffers(),
            window.BoseAdmin.getAllProducts(),
        ]);
        renderTable();
    });
})();