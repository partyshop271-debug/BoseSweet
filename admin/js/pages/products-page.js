/**
 * products-page.js - منطق صفحة المنتجات فقط
 * =====================================================================
 * ملحوظة نطاق: النسخة دي بتغطي الحقول الأساسية للمنتج العادي (اسم، فئة،
 * وصف، نكهة، سعر، سعر قديم، ترتيب، صور، تمييز). حقول متقدمة زي الأحجام
 * المتعددة (prices)، ومحاكي التورت/الورد المخصص (builder_type/custom_builder_url)،
 * ومصطلحات البحث (search_terms) مش متضمنة هنا - لو محتاجينها نضيفها بعدين.
 */
(function () {
    "use strict";

    const CLOUDINARY_CLOUD_NAME = "dyx4w0dr1";
    const CLOUDINARY_UPLOAD_PRESET = "gct8i28h";
    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    let allProducts = [];
    let allCategories = [];

    /* ============================= رفع الصور على Cloudinary ============================= */

    async function uploadImageToCloudinary(file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: formData });
        if (!res.ok) throw new Error("فشل رفع الصورة");
        const data = await res.json();
        return data.secure_url;
    }

    /* ============================= الجدول ============================= */

    function categoryTitle(product) {
        return product.categories?.title || allCategories.find((c) => c.id === product.category_id)?.title || "—";
    }

    function getFilteredProducts() {
        const search = document.getElementById("products-search-input").value.trim().toLowerCase();
        const categoryId = document.getElementById("products-category-filter").value;

        return allProducts.filter((p) => {
            const matchesSearch = !search || (p.title || "").toLowerCase().includes(search);
            const matchesCategory = !categoryId || p.category_id === categoryId;
            return matchesSearch && matchesCategory;
        });
    }

    function renderTable() {
        const tbody = document.getElementById("products-tbody");
        const e = window.BoseAdminUI.escapeHtml;
        const products = getFilteredProducts();

        if (!products.length) {
            tbody.innerHTML = `<tr><td colspan="7">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-cake-candles",
                title: "مفيش منتجات مطابقة",
                text: "جرّب تغيّر الفلتر أو أضف منتج جديد.",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map((p) => {
            const thumb = (p.images && p.images[0]) || "";
            return `
            <tr>
                <td>${thumb ? `<img src="${e(thumb)}" class="adm-table-thumb" alt="">` : `<div class="adm-table-thumb"></div>`}</td>
                <td>${e(p.title)}</td>
                <td>${e(categoryTitle(p))}</td>
                <td>${Math.round(p.price)} ج.م</td>
                <td>${p.old_price ? Math.round(p.old_price) + " ج.م" : "—"}</td>
                <td>${p.is_featured ? `<span class="adm-badge success">مميز</span>` : "—"}</td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-id="${e(p.id)}" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-id="${e(p.id)}" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                const product = allProducts.find((p) => p.id === btn.getAttribute("data-id"));
                if (product) openProductModal(product);
            });
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(btn.getAttribute("data-id")));
        });
    }

    async function handleDelete(id) {
        const product = allProducts.find((p) => p.id === id);
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الحذف",
            message: `هل أنت متأكد من حذف "${product?.title || id}"؟ الإجراء ده نهائي ومش هينفع يتراجع.`,
            confirmLabel: "حذف نهائي",
            danger: true,
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.deleteProduct(id);
            window.BoseAdminUI.showToast("تم حذف المنتج", "success");
            await loadProducts();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر حذف المنتج، ممكن يكون مرتبط بطلبات سابقة", "error");
        }
    }

    /* ============================= مودال إضافة/تعديل ============================= */

    function categoryOptionsHTML(selectedId) {
        const e = window.BoseAdminUI.escapeHtml;
        return allCategories.map((c) => `
            <option value="${e(c.id)}" ${c.id === selectedId ? "selected" : ""}>${e(c.title)}</option>
        `).join("");
    }

    function imagesPreviewHTML(images) {
        const e = window.BoseAdminUI.escapeHtml;
        return images.map((url, idx) => `
            <div class="adm-image-thumb-wrap" data-idx="${idx}">
                <img src="${e(url)}" alt="">
                <button type="button" class="adm-image-remove-btn" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `).join("");
    }

    function openProductModal(product) {
        const isEdit = !!product;
        const e = window.BoseAdminUI.escapeHtml;
        let images = isEdit ? [...(product.images || [])] : [];

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 640px;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل منتج" : "منتج جديد"}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form id="product-form">
                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="pf-id">معرّف المنتج (ID)</label>
                            <input type="text" class="adm-input" id="pf-id" value="${isEdit ? e(product.id) : ""}"
                                   placeholder="مثال: gateaux-royal" ${isEdit ? "disabled" : ""} required>
                            ${!isEdit ? `<span class="adm-hint">نص إنجليزي فريد، بحروف صغيرة وشرطات (-) بس. مينفعش يتغير بعد الحفظ.</span>` : ""}
                        </div>
                        <div class="adm-field">
                            <label for="pf-category">الفئة</label>
                            <select class="adm-select" id="pf-category" required>
                                <option value="">اختر فئة</option>
                                ${categoryOptionsHTML(product?.category_id)}
                            </select>
                        </div>
                    </div>

                    <div class="adm-field">
                        <label for="pf-title">اسم المنتج</label>
                        <input type="text" class="adm-input" id="pf-title" value="${isEdit ? e(product.title) : ""}" required>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="pf-flavor-name">اسم النكهة (اختياري)</label>
                            <input type="text" class="adm-input" id="pf-flavor-name" value="${isEdit ? e(product.flavor_name || "") : ""}">
                        </div>
                        <div class="adm-field">
                            <label for="pf-flavor-desc">وصف النكهة (اختياري)</label>
                            <input type="text" class="adm-input" id="pf-flavor-desc" value="${isEdit ? e(product.flavor_desc || "") : ""}">
                        </div>
                    </div>

                    <div class="adm-field">
                        <label for="pf-description">الوصف</label>
                        <textarea class="adm-textarea" id="pf-description">${isEdit ? e(product.description || "") : ""}</textarea>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="pf-price">السعر</label>
                            <input type="number" step="0.01" min="0" class="adm-input" id="pf-price" value="${isEdit ? product.price : ""}" required>
                        </div>
                        <div class="adm-field">
                            <label for="pf-old-price">السعر القديم (اختياري - لعرض خصم)</label>
                            <input type="number" step="0.01" min="0" class="adm-input" id="pf-old-price" value="${isEdit && product.old_price ? product.old_price : ""}">
                        </div>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="pf-sort-order">ترتيب العرض</label>
                            <input type="number" class="adm-input" id="pf-sort-order" value="${isEdit ? (product.sort_order ?? 0) : 0}">
                        </div>
                        <div class="adm-field">
                            <label class="adm-checkbox-label">
                                <input type="checkbox" id="pf-featured" ${isEdit && product.is_featured ? "checked" : ""}>
                                منتج مميز (يظهر في "الأكثر مبيعاً")
                            </label>
                        </div>
                    </div>

                    <div class="adm-field">
                        <label>الصور</label>
                        <div class="adm-images-grid" id="pf-images-grid">${imagesPreviewHTML(images)}</div>
                        <label class="adm-image-upload-btn" for="pf-image-input">
                            <i class="fa-solid fa-cloud-arrow-up"></i>
                            <span id="pf-upload-label">إضافة صورة</span>
                        </label>
                        <input type="file" id="pf-image-input" accept="image/*" multiple hidden>
                    </div>

                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="pf-save-btn">حفظ المنتج</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }

        function refreshImagesGrid() {
            document.getElementById("pf-images-grid").innerHTML = imagesPreviewHTML(images);
            document.getElementById("pf-images-grid").querySelectorAll(".adm-image-remove-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                    images.splice(Number(btn.getAttribute("data-idx")), 1);
                    refreshImagesGrid();
                });
            });
        }
        refreshImagesGrid();

        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("pf-image-input").addEventListener("change", async (evt) => {
            const files = Array.from(evt.target.files || []);
            if (!files.length) return;
            const label = document.getElementById("pf-upload-label");
            const originalLabel = label.textContent;
            label.textContent = "جاري الرفع...";
            try {
                for (const file of files) {
                    const url = await uploadImageToCloudinary(file);
                    images.push(url);
                }
                refreshImagesGrid();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر رفع صورة واحدة أو أكتر", "error");
            } finally {
                label.textContent = originalLabel;
                evt.target.value = "";
            }
        });

        document.getElementById("product-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("pf-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const payload = {
                category_id: document.getElementById("pf-category").value,
                title: document.getElementById("pf-title").value.trim(),
                flavor_name: document.getElementById("pf-flavor-name").value.trim() || null,
                flavor_desc: document.getElementById("pf-flavor-desc").value.trim() || null,
                description: document.getElementById("pf-description").value.trim() || null,
                price: parseFloat(document.getElementById("pf-price").value) || 0,
                old_price: document.getElementById("pf-old-price").value ? parseFloat(document.getElementById("pf-old-price").value) : null,
                sort_order: parseInt(document.getElementById("pf-sort-order").value, 10) || 0,
                is_featured: document.getElementById("pf-featured").checked,
                images,
            };

            try {
                if (isEdit) {
                    await window.BoseAdmin.updateProduct(product.id, payload);
                    window.BoseAdminUI.showToast("تم تعديل المنتج", "success");
                } else {
                    const id = document.getElementById("pf-id").value.trim();
                    if (!/^[a-z0-9-]+$/.test(id)) {
                        window.BoseAdminUI.showToast("المعرّف لازم يكون حروف إنجليزية صغيرة وأرقام وشرطات بس", "error");
                        saveBtn.disabled = false;
                        saveBtn.textContent = "حفظ المنتج";
                        return;
                    }
                    await window.BoseAdmin.createProduct({ id, ...payload });
                    window.BoseAdminUI.showToast("تم إضافة المنتج", "success");
                }
                close();
                await loadProducts();
            } catch (err) {
                window.BoseAdminUI.showToast(
                    isEdit ? "تعذر تعديل المنتج" : "تعذر إضافة المنتج (تأكد إن الـ ID مش مستخدم قبل كده)",
                    "error"
                );
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ المنتج";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadProducts() {
        const tbody = document.getElementById("products-tbody");
        tbody.innerHTML = `<tr><td colspan="7"><div class="adm-loading-spinner"></div></td></tr>`;
        allProducts = await window.BoseAdmin.getAllProducts();
        renderTable();
    }

    async function loadCategories() {
        allCategories = await window.BoseAdmin.getAllCategories();
        const filterSelect = document.getElementById("products-category-filter");
        const e = window.BoseAdminUI.escapeHtml;
        filterSelect.innerHTML = `<option value="">كل الفئات</option>` +
            allCategories.map((c) => `<option value="${e(c.id)}">${e(c.title)}</option>`).join("");
    }

    function wireControls() {
        document.getElementById("products-search-input").addEventListener("input", renderTable);
        document.getElementById("products-category-filter").addEventListener("change", renderTable);
        document.getElementById("add-product-btn").addEventListener("click", () => openProductModal(null));
    }

    document.addEventListener("BoseAdminReady", async () => {
        wireControls();
        await loadCategories();
        await loadProducts();
    });
})();