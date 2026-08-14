/**
 * promotions-page.js - منطق صفحة العروض فقط
 * =====================================================================
 * العروض هنا مش صفوف في جدول منفصل - هي مصفوفة واحدة (promotions) جوه
 * صف store_settings الوحيد. يعني أي حفظ (إضافة/تعديل/حذف/تفعيل) بيبعت
 * المصفوفة بالكامل تاني، فالصفحة بتحتفظ بنسخة محلية محدّثة (currentPromotions)
 * وتبعتها كل مرة بدل ما تتعامل مع "صف" منفرد زي المنتجات والفئات.
 *
 * نسبة الخصم (discountPercent) بتتحسب تلقائياً من السعرين القديم والجديد
 * وقت الحفظ - مش حقل يتكتب يدوي، عشان تفضل مطابقة للأرقام الحقيقية دايماً.
 */
(function () {
    "use strict";

    let currentPromotions = [];
    let allCategories = [];

    function categoryTitle(categoryId) {
        return allCategories.find((c) => c.id === categoryId)?.title || categoryId || "—";
    }

    function calcDiscountPercent(oldPrice, newPrice) {
        if (!oldPrice || oldPrice <= newPrice) return 0;
        return Math.round(((oldPrice - newPrice) / oldPrice) * 1000) / 10; // خانة عشرية واحدة
    }

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("promotions-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!currentPromotions.length) {
            tbody.innerHTML = `<tr><td colspan="7">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-tags",
                title: "مفيش عروض مضافة لسه",
                text: "ابدأ بإضافة أول عرض من زرار \"عرض جديد\".",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = currentPromotions.map((p, idx) => `
            <tr>
                <td>${p.image ? `<img src="${e(p.image)}" class="adm-table-thumb" alt="">` : `<div class="adm-table-thumb"></div>`}</td>
                <td>${e(p.title)}</td>
                <td>${e(categoryTitle(p.category))}</td>
                <td>${Math.round(p.oldPrice)} ج.م</td>
                <td>${Math.round(p.newPrice)} ج.م</td>
                <td><span class="adm-badge success">خصم ${p.discountPercent || calcDiscountPercent(p.oldPrice, p.newPrice)}%</span></td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="toggle" data-idx="${idx}"
                            title="${p.active ? "إيقاف العرض" : "تفعيل العرض"}">
                        <i class="fa-solid ${p.active ? "fa-toggle-on" : "fa-toggle-off"}"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-idx="${idx}" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-idx="${idx}" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => openPromotionModal(currentPromotions[Number(btn.getAttribute("data-idx"))]));
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(Number(btn.getAttribute("data-idx"))));
        });
        tbody.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
            btn.addEventListener("click", () => handleToggleActive(Number(btn.getAttribute("data-idx"))));
        });
    }

    async function persist(successMessage) {
        await window.BoseAdmin.savePromotions(currentPromotions);
        window.BoseAdminUI.showToast(successMessage, "success");
        renderTable();
    }

    async function handleToggleActive(idx) {
        const promo = currentPromotions[idx];
        promo.active = !promo.active;
        try {
            await persist(promo.active ? "تم تفعيل العرض" : "تم إيقاف العرض");
        } catch (e) {
            promo.active = !promo.active; // تراجع لو فشل الحفظ
            window.BoseAdminUI.showToast("تعذر تحديث حالة العرض", "error");
            renderTable();
        }
    }

    async function handleDelete(idx) {
        const promo = currentPromotions[idx];
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الحذف",
            message: `هل أنت متأكد من حذف عرض "${promo.title}"؟ الإجراء ده نهائي.`,
            confirmLabel: "حذف نهائي",
            danger: true,
        });
        if (!confirmed) return;

        const backup = [...currentPromotions];
        currentPromotions.splice(idx, 1);
        try {
            await persist("تم حذف العرض");
        } catch (e) {
            currentPromotions = backup;
            window.BoseAdminUI.showToast("تعذر حذف العرض", "error");
            renderTable();
        }
    }

    /* ============================= مودال إضافة/تعديل ============================= */

    function categoryOptionsHTML(selectedId) {
        const e = window.BoseAdminUI.escapeHtml;
        return `<option value="">بدون فئة</option>` + allCategories.map((c) => `
            <option value="${e(c.id)}" ${c.id === selectedId ? "selected" : ""}>${e(c.title)}</option>
        `).join("");
    }

    function openPromotionModal(promotion) {
        const isEdit = !!promotion;
        const e = window.BoseAdminUI.escapeHtml;
        let image = isEdit ? (promotion.image || "") : "";

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 560px;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل عرض" : "عرض جديد"}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form id="promotion-form">
                    <div class="adm-field">
                        <label for="pf-id">معرّف العرض (ID)</label>
                        <input type="text" class="adm-input" id="pf-id" value="${isEdit ? e(promotion.id) : ""}"
                               placeholder="مثال: promo-cinabon-5plus1" ${isEdit ? "disabled" : ""} required>
                        ${!isEdit ? `<span class="adm-hint">نص إنجليزي فريد، بحروف صغيرة وشرطات (-) بس. مينفعش يتغير بعد الحفظ.</span>` : ""}
                    </div>

                    <div class="adm-field">
                        <label for="pf-title">عنوان العرض</label>
                        <input type="text" class="adm-input" id="pf-title" value="${isEdit ? e(promotion.title) : ""}" required>
                    </div>

                    <div class="adm-field">
                        <label for="pf-description">الوصف</label>
                        <textarea class="adm-textarea" id="pf-description">${isEdit ? e(promotion.description || "") : ""}</textarea>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="pf-category">الفئة (للعرض في صفحتها)</label>
                            <select class="adm-select" id="pf-category">${categoryOptionsHTML(promotion?.category)}</select>
                        </div>
                        <div class="adm-field">
                            <label class="adm-checkbox-label">
                                <input type="checkbox" id="pf-active" ${!isEdit || promotion.active ? "checked" : ""}>
                                العرض مفعّل وظاهر للعملاء
                            </label>
                        </div>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="pf-old-price">السعر قبل الخصم</label>
                            <input type="number" step="0.01" min="0" class="adm-input" id="pf-old-price" value="${isEdit ? promotion.oldPrice : ""}" required>
                        </div>
                        <div class="adm-field">
                            <label for="pf-new-price">سعر العرض</label>
                            <input type="number" step="0.01" min="0" class="adm-input" id="pf-new-price" value="${isEdit ? promotion.newPrice : ""}" required>
                        </div>
                    </div>
                    <span class="adm-hint" id="pf-discount-preview">نسبة الخصم بتتحسب تلقائياً من السعرين</span>

                    <div class="adm-field adm-mt-16">
                        <label>صورة العرض</label>
                        <div class="adm-images-grid" id="pf-image-grid">
                            ${image ? `<div class="adm-image-thumb-wrap"><img src="${e(image)}" alt=""><button type="button" class="adm-image-remove-btn" id="pf-image-remove"><i class="fa-solid fa-xmark"></i></button></div>` : ""}
                        </div>
                        <label class="adm-image-upload-btn" for="pf-image-input">
                            <i class="fa-solid fa-cloud-arrow-up"></i>
                            <span id="pf-upload-label">${image ? "استبدال الصورة" : "إضافة صورة"}</span>
                        </label>
                        <input type="file" id="pf-image-input" accept="image/*" hidden>
                    </div>

                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="pf-save-btn">حفظ العرض</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }

        function refreshImageGrid() {
            const grid = document.getElementById("pf-image-grid");
            grid.innerHTML = image
                ? `<div class="adm-image-thumb-wrap"><img src="${e(image)}" alt=""><button type="button" class="adm-image-remove-btn" id="pf-image-remove"><i class="fa-solid fa-xmark"></i></button></div>`
                : "";
            document.getElementById("pf-upload-label").textContent = image ? "استبدال الصورة" : "إضافة صورة";
            const removeBtn = document.getElementById("pf-image-remove");
            if (removeBtn) removeBtn.addEventListener("click", () => { image = ""; refreshImageGrid(); });
        }
        refreshImageGrid();

        function updateDiscountPreview() {
            const oldP = parseFloat(document.getElementById("pf-old-price").value) || 0;
            const newP = parseFloat(document.getElementById("pf-new-price").value) || 0;
            const pct = calcDiscountPercent(oldP, newP);
            document.getElementById("pf-discount-preview").textContent =
                pct > 0 ? `نسبة الخصم المحسوبة: ${pct}%` : "لازم السعر الجديد يكون أقل من السعر القديم عشان تظهر نسبة خصم";
        }
        document.getElementById("pf-old-price").addEventListener("input", updateDiscountPreview);
        document.getElementById("pf-new-price").addEventListener("input", updateDiscountPreview);
        updateDiscountPreview();

        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("pf-image-input").addEventListener("change", async (evt) => {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;
            const label = document.getElementById("pf-upload-label");
            const originalLabel = label.textContent;
            label.textContent = "جاري الرفع...";
            try {
                image = await window.BoseAdminUI.uploadImageToCloudinary(file);
                refreshImageGrid();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر رفع الصورة", "error");
            } finally {
                evt.target.value = "";
            }
        });

        document.getElementById("promotion-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("pf-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const oldPrice = parseFloat(document.getElementById("pf-old-price").value) || 0;
            const newPrice = parseFloat(document.getElementById("pf-new-price").value) || 0;

            if (newPrice >= oldPrice) {
                window.BoseAdminUI.showToast("سعر العرض لازم يكون أقل من السعر قبل الخصم", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ العرض";
                return;
            }

            const id = isEdit ? promotion.id : document.getElementById("pf-id").value.trim();
            if (!isEdit && !/^[a-z0-9-]+$/.test(id)) {
                window.BoseAdminUI.showToast("المعرّف لازم يكون حروف إنجليزية صغيرة وأرقام وشرطات بس", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ العرض";
                return;
            }
            if (!isEdit && currentPromotions.some((p) => p.id === id)) {
                window.BoseAdminUI.showToast("المعرّف ده مستخدم في عرض تاني بالفعل", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ العرض";
                return;
            }

            // 🛡️ [إصلاح - إزالة مرجع منتج وهمي]: كان هنا "productId: id" - بيوهم إن
            // العرض مرتبط بمنتج حقيقي في جدول products، بينما id هنا هو سلاج العرض
            // نفسه بس (زي promo-cinabon-5plus1)، مش id منتج فعلي. الموقع العام أصلاً
            // مش بيعرض promotions في أي مكان دلوقتي (اتأكدنا)، فمفيش كسر حالي، لكن
            // سيبان الحقل ده كان هيسبب بالظبط نفس مشكلة "تكرار المنتج" القديمة لو حد
            // استخدمه بعدين كأنه FK حقيقي. لو حبيتي لاحقاً تربطي عرض بمنتج حقيقي
            // موجود فعلاً، استخدمي صفحة "عروض المنتجات" (offers.html) اللي مصممة
            // لده بالظبط عبر جدول offers الحقيقي.
            const payload = {
                id,
                title: document.getElementById("pf-title").value.trim(),
                description: document.getElementById("pf-description").value.trim(),
                category: document.getElementById("pf-category").value || null,
                active: document.getElementById("pf-active").checked,
                oldPrice,
                newPrice,
                discountPercent: calcDiscountPercent(oldPrice, newPrice),
                image: image || "",
            };

            try {
                if (isEdit) {
                    const idx = currentPromotions.findIndex((p) => p.id === promotion.id);
                    currentPromotions[idx] = payload;
                } else {
                    currentPromotions.push(payload);
                }
                await persist(isEdit ? "تم تعديل العرض" : "تم إضافة العرض");
                close();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر حفظ العرض", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ العرض";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadPromotions() {
        const tbody = document.getElementById("promotions-tbody");
        tbody.innerHTML = `<tr><td colspan="7"><div class="adm-loading-spinner"></div></td></tr>`;
        [currentPromotions, allCategories] = await Promise.all([
            window.BoseAdmin.getPromotions(),
            window.BoseAdmin.getAllCategories(),
        ]);
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("add-promotion-btn").addEventListener("click", () => openPromotionModal(null));
        await loadPromotions();
    });
})();