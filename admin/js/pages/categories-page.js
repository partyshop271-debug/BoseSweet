/**
 * categories-page.js - منطق صفحة الفئات فقط
 * =====================================================================
 * ملحوظة مهمة: عمود image هنا هو نفسه اللي بيتعرض في "سلايدر الفئات"
 * على الصفحة الرئيسية (homepage-page.js بيعيد بناء القائمة من هنا تلقائياً
 * عند كل حفظ)، فتغيير صورة الفئة هنا بينعكس على السلايدر من غير ما تحتاج
 * تعدّلها مرتين في مكانين مختلفين.
 */
(function () {
    "use strict";

    const BUILDER_TYPE_LABELS = {
        standard: "عادي",
        "cake-customizer": "محاكي التورت",
        "flower-customizer": "محاكي الورد",
    };

    let allCategories = [];

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("categories-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!allCategories.length) {
            tbody.innerHTML = `<tr><td colspan="5">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-layer-group",
                title: "مفيش فئات لسه",
                text: "ابدأ بإضافة أول فئة من زرار \"فئة جديدة\".",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = allCategories.map((c) => `
            <tr>
                <td>${c.image ? `<img src="${e(c.image)}" class="adm-table-thumb" alt="">` : `<div class="adm-table-thumb"></div>`}</td>
                <td>${e(c.title)}<br><span class="adm-order-item-meta">${e(c.id)}</span></td>
                <td>${e(BUILDER_TYPE_LABELS[c.builder_type] || c.builder_type || "—")}</td>
                <td>${c.sort_order ?? 0}</td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-id="${e(c.id)}" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-id="${e(c.id)}" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                const category = allCategories.find((c) => c.id === btn.getAttribute("data-id"));
                if (category) openCategoryModal(category);
            });
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(btn.getAttribute("data-id")));
        });
    }

    async function handleDelete(id) {
        const category = allCategories.find((c) => c.id === id);
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الحذف",
            message: `هل أنت متأكد من حذف فئة "${category?.title || id}"؟ هيفشل الحذف لو فيه منتجات مرتبطة بيها لسه.`,
            confirmLabel: "حذف نهائي",
            danger: true,
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.deleteCategory(id);
            window.BoseAdminUI.showToast("تم حذف الفئة", "success");
            await loadCategories();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر حذف الفئة، على الأغلب لسه فيه منتجات مرتبطة بيها", "error");
        }
    }

    /* ============================= مودال إضافة/تعديل ============================= */

    function openCategoryModal(category) {
        const isEdit = !!category;
        const e = window.BoseAdminUI.escapeHtml;
        let image = isEdit ? (category.image || "") : "";

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 480px;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل فئة" : "فئة جديدة"}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form id="category-form">
                    <div class="adm-field">
                        <label for="cf-id">معرّف الفئة (ID)</label>
                        <input type="text" class="adm-input" id="cf-id" value="${isEdit ? e(category.id) : ""}"
                               placeholder="مثال: taswaq-cupcake" ${isEdit ? "disabled" : ""} required>
                        ${!isEdit ? `<span class="adm-hint">نص إنجليزي فريد، بحروف صغيرة وشرطات (-) بس. مينفعش يتغير بعد الحفظ.</span>` : ""}
                    </div>

                    <div class="adm-field">
                        <label for="cf-title">اسم الفئة</label>
                        <input type="text" class="adm-input" id="cf-title" value="${isEdit ? e(category.title) : ""}" required>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="cf-builder-type">نوع الفئة</label>
                            <select class="adm-select" id="cf-builder-type">
                                <option value="standard" ${category?.builder_type === "standard" || !category ? "selected" : ""}>عادي</option>
                                <option value="cake-customizer" ${category?.builder_type === "cake-customizer" ? "selected" : ""}>محاكي التورت</option>
                                <option value="flower-customizer" ${category?.builder_type === "flower-customizer" ? "selected" : ""}>محاكي الورد</option>
                            </select>
                        </div>
                        <div class="adm-field">
                            <label for="cf-sort-order">ترتيب العرض</label>
                            <input type="number" class="adm-input" id="cf-sort-order" value="${isEdit ? (category.sort_order ?? 0) : allCategories.length}">
                        </div>
                    </div>

                    <div class="adm-field">
                        <label>صورة الفئة</label>
                        <div class="adm-images-grid" id="cf-image-grid">
                            ${image ? `<div class="adm-image-thumb-wrap"><img src="${e(image)}" alt=""><button type="button" class="adm-image-remove-btn" id="cf-image-remove"><i class="fa-solid fa-xmark"></i></button></div>` : ""}
                        </div>
                        <label class="adm-image-upload-btn" for="cf-image-input">
                            <i class="fa-solid fa-cloud-arrow-up"></i>
                            <span id="cf-upload-label">${image ? "استبدال الصورة" : "إضافة صورة"}</span>
                        </label>
                        <input type="file" id="cf-image-input" accept="image/*" hidden>
                    </div>

                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="cf-save-btn">حفظ الفئة</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }

        function refreshImageGrid() {
            const grid = document.getElementById("cf-image-grid");
            grid.innerHTML = image
                ? `<div class="adm-image-thumb-wrap"><img src="${e(image)}" alt=""><button type="button" class="adm-image-remove-btn" id="cf-image-remove"><i class="fa-solid fa-xmark"></i></button></div>`
                : "";
            document.getElementById("cf-upload-label").textContent = image ? "استبدال الصورة" : "إضافة صورة";
            const removeBtn = document.getElementById("cf-image-remove");
            if (removeBtn) removeBtn.addEventListener("click", () => { image = ""; refreshImageGrid(); });
        }
        refreshImageGrid();

        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("cf-image-input").addEventListener("change", async (evt) => {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;
            const label = document.getElementById("cf-upload-label");
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

        document.getElementById("category-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("cf-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const payload = {
                title: document.getElementById("cf-title").value.trim(),
                builder_type: document.getElementById("cf-builder-type").value,
                sort_order: parseInt(document.getElementById("cf-sort-order").value, 10) || 0,
                image: image || null,
            };

            try {
                if (isEdit) {
                    await window.BoseAdmin.updateCategory(category.id, payload);
                    window.BoseAdminUI.showToast("تم تعديل الفئة", "success");
                } else {
                    const id = document.getElementById("cf-id").value.trim();
                    if (!/^[a-z0-9-]+$/.test(id)) {
                        window.BoseAdminUI.showToast("المعرّف لازم يكون حروف إنجليزية صغيرة وأرقام وشرطات بس", "error");
                        saveBtn.disabled = false;
                        saveBtn.textContent = "حفظ الفئة";
                        return;
                    }
                    await window.BoseAdmin.createCategory({ id, ...payload });
                    window.BoseAdminUI.showToast("تم إضافة الفئة", "success");
                }
                close();
                await loadCategories();
            } catch (err) {
                window.BoseAdminUI.showToast(
                    isEdit ? "تعذر تعديل الفئة" : "تعذر إضافة الفئة (تأكد إن الـ ID مش مستخدم قبل كده)",
                    "error"
                );
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ الفئة";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadCategories() {
        const tbody = document.getElementById("categories-tbody");
        tbody.innerHTML = `<tr><td colspan="5"><div class="adm-loading-spinner"></div></td></tr>`;
        allCategories = await window.BoseAdmin.getAllCategories();
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("add-category-btn").addEventListener("click", () => openCategoryModal(null));
        await loadCategories();
    });
})();