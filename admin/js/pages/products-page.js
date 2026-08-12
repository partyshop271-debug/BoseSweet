/**
 * products-page.js - منطق صفحة المنتجات فقط
 * =====================================================================
 * بيغطي الحقول الأساسية (اسم، فئة، وصف، نكهة، سعر، سعر قديم، ترتيب، صور،
 * تمييز) + قسم "إعدادات متقدمة" قابل للطي: التوفر (is_available)، نوع
 * المنتج/محاكي التخصيص (builder_type + custom_builder_url)، كلمات بحث
 * إضافية (search_terms)، والأحجام المتعددة بأسعارها (prices/default_size).
 */
(function () {
    "use strict";

    let allProducts = [];
    let allCategories = [];

    /* ============================= الجدول ============================= */

    function categoryTitle(product) {
        return product.categories?.title || allCategories.find((c) => c.id === product.category_id)?.title || "—";
    }

    /**
     * 🖼️ [تحسين - تتبع الصور الحقيقية]: كتير من المنتجات (64 من 76 وقت
     * الفحص) لسه شايلة صورة اللوجو الافتراضية بدل صورة المنتج الحقيقية،
     * ومفيش أي طريقة سهلة في الجدول كانت بتوريلك ده - فكانت المنتجات دي
     * عملياً "ضايعة" وسط باقي الصفوف. الدالة دي بتكتشف صورة اللوجو
     * الافتراضية بنفس الرابط المستخدم في كل الموقع.
     */
    function hasPlaceholderImage(product) {
        const img = (product.images && product.images[0]) || "";
        return !img || img.includes(window.BoseAdminUI.PLACEHOLDER_IMAGE_MARKER);
    }

    function getFilteredProducts() {
        const search = document.getElementById("products-search-input").value.trim().toLowerCase();
        const categoryId = document.getElementById("products-category-filter").value;
        const onlyMissingPhotos = document.getElementById("products-missing-photo-filter")?.checked;

        return allProducts.filter((p) => {
            const matchesSearch = !search || (p.title || "").toLowerCase().includes(search);
            const matchesCategory = !categoryId || p.category_id === categoryId;
            const matchesPhoto = !onlyMissingPhotos || hasPlaceholderImage(p);
            return matchesSearch && matchesCategory && matchesPhoto;
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
            const needsPhoto = hasPlaceholderImage(p);
            return `
            <tr>
                <td>${thumb ? `<img src="${e(thumb)}" class="adm-table-thumb" alt="">` : `<div class="adm-table-thumb"></div>`}</td>
                <td>${e(p.title)} ${needsPhoto ? `<span class="adm-badge warning" title="لسه شايل صورة اللوجو الافتراضية، محتاج صورة حقيقية">بدون صورة حقيقية</span>` : ""}</td>
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
                ${idx === 0
                    ? `<span class="adm-image-primary-badge" title="دي الصورة اللي بتظهر في كروت المنتج بالموقع">الرئيسية</span>`
                    : `<button type="button" class="adm-image-set-primary-btn" data-idx="${idx}" title="اجعلها الصورة الرئيسية"><i class="fa-solid fa-star"></i></button>`}
                <button type="button" class="adm-image-remove-btn" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `).join("");
    }

    const SIZE_KEYS = ["triangle", "medium", "large"];
    const SIZE_LABELS = { triangle: "مثلث فردي", medium: "وسط تشارك ممتع", large: "كبير جمعات فاخرة" };
    const BUILDER_TYPES = [
        { value: "standard", label: "منتج عادي" },
        { value: "cake-customizer", label: "محاكي التورت" },
        { value: "flower-customizer", label: "محاكي الورد" },
    ];

    function openProductModal(product) {
        const isEdit = !!product;
        const e = window.BoseAdminUI.escapeHtml;
        let images = isEdit ? [...(product.images || [])] : [];
        const prices = isEdit ? { ...(product.prices || {}) } : {};
        const sizeDescriptions = isEdit ? { ...(product.size_descriptions || {}) } : {};

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

                    <details class="adm-field" style="margin-top: 6px;">
                        <summary style="cursor:pointer; color: var(--adm-text-secondary); font-weight: 600; padding: 6px 0;">
                            إعدادات متقدمة (الأحجام، التوفر، المحاكي، كلمات البحث)
                        </summary>

                        <div style="padding-top: 10px; display: flex; flex-direction: column; gap: 14px;">
                            <label class="adm-checkbox-label">
                                <input type="checkbox" id="pf-available" ${!isEdit || product.is_available !== false ? "checked" : ""}>
                                المنتج متاح للطلب حالياً
                            </label>

                            <div class="adm-field">
                                <label for="pf-builder-type">نوع المنتج</label>
                                <select class="adm-select" id="pf-builder-type">
                                    ${BUILDER_TYPES.map((bt) => `<option value="${bt.value}" ${isEdit && product.builder_type === bt.value ? "selected" : ""}>${bt.label}</option>`).join("")}
                                </select>
                                <span class="adm-hint">لو مش "منتج عادي"، المنتج ده بيفتح محاكي التخصيص بدل صفحة منتج عادية - لازم تحدد رابط المحاكي تحت وإلا هيتعامل كمنتج عادي عادي.</span>
                            </div>

                            <div class="adm-field" id="pf-builder-url-field" style="${!isEdit || product.builder_type === "standard" || !product.builder_type ? "display:none;" : ""}">
                                <label for="pf-builder-url">رابط صفحة المحاكي</label>
                                <input type="text" class="adm-input" id="pf-builder-url"
                                       value="${isEdit ? e(product.custom_builder_url || "") : ""}"
                                       placeholder="مثال: cake-builder.html">
                                <span class="adm-hint">لازم يتحدد وإلا المنتج مش هيفتح المحاكي أبداً حتى لو نوعه اتغيّر فوق.</span>
                            </div>

                            <div class="adm-field">
                                <label for="pf-search-terms">كلمات بحث إضافية (اختياري - افصل بفاصلة)</label>
                                <input type="text" class="adm-input" id="pf-search-terms"
                                       value="${isEdit ? e((product.search_terms || []).join('، ')) : ""}"
                                       placeholder="مثال: تورتة عيد ميلاد، كيك شوكولاتة">
                            </div>

                            <div class="adm-field">
                                <label>الأحجام والأسعار (اختياري - اسيبها فاضية لو المنتج بسعر واحد بس)</label>
                                <div class="adm-form-grid" style="grid-template-columns: repeat(3, 1fr);">
                                    ${SIZE_KEYS.map((key) => `
                                        <div class="adm-field">
                                            <label for="pf-size-${key}">${SIZE_LABELS[key]}</label>
                                            <input type="number" step="0.01" min="0" class="adm-input" id="pf-size-${key}"
                                                   value="${prices[key] ?? ""}" placeholder="سعر">
                                        </div>
                                    `).join("")}
                                </div>
                                <span class="adm-hint">لو عبّيت أكتر من حجم، العميل هيقدر يختار بينهم في صفحة المنتج. أول حجم متعبّى بيبقى الافتراضي.</span>
                            </div>
                        </div>
                    </details>

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
            document.getElementById("pf-images-grid").querySelectorAll(".adm-image-set-primary-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const idx = Number(btn.getAttribute("data-idx"));
                    const [chosen] = images.splice(idx, 1);
                    images.unshift(chosen);
                    refreshImagesGrid();
                });
            });
        }
        refreshImagesGrid();

        const builderTypeSelect = document.getElementById("pf-builder-type");
        const builderUrlField = document.getElementById("pf-builder-url-field");
        builderTypeSelect.addEventListener("change", () => {
            builderUrlField.style.display = builderTypeSelect.value === "standard" ? "none" : "";
        });

        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("pf-image-input").addEventListener("change", async (evt) => {
            const files = Array.from(evt.target.files || []);
            if (!files.length) return;
            const label = document.getElementById("pf-upload-label");
            const originalLabel = label.textContent;
            label.textContent = `جاري الرفع... (0/${files.length})`;
            try {
                // ⚡ رفع كل الصور مع بعض بالتوازي (مش واحدة ورا التانية) + تقدّم حي
                const urls = await window.BoseAdminUI.uploadImagesToCloudinary(files, (done, total) => {
                    label.textContent = `جاري الرفع... (${done}/${total})`;
                });
                const failedCount = urls.filter((u) => !u).length;
                const uploadedUrls = urls.filter(Boolean);
                // 🛡️ [إصلاح جذري - سبب اختفاء الصور المرفوعة]: لو الصورة الوحيدة الموجودة
                // لسه هي صورة اللوجو الافتراضية (المنتج "بدون صورة حقيقية")، أول صورة حقيقية
                // بترفع دلوقتي بتحل محلها مباشرة بدل ما تتكوم وراها في images[1] - لأن كل
                // كروت المنتج بالموقع بتعرض images[0] بس، فكانت الصورة الجديدة بترفع فعلاً
                // وتتحفظ فعلاً، لكن تفضل "مخبية" وراء اللوجو القديم وميظهرش أي تغيير للعميل.
                if (images.length && hasPlaceholderImage({ images }) && uploadedUrls.length) {
                    images = uploadedUrls.concat(images.slice(1));
                } else {
                    uploadedUrls.forEach((url) => images.push(url));
                }
                refreshImagesGrid();
                if (failedCount > 0) {
                    window.BoseAdminUI.showToast(`تعذر رفع ${failedCount} من ${files.length} صور`, "error");
                }
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

            // الأحجام: بس المفاتيح اللي الأدمن دخّل ليها سعر فعلي (مش فاضية)
            const newPrices = {};
            SIZE_KEYS.forEach((key) => {
                const val = document.getElementById(`pf-size-${key}`).value;
                if (val !== "") newPrices[key] = parseFloat(val) || 0;
            });
            const filledSizeKeys = Object.keys(newPrices);
            const searchTerms = document.getElementById("pf-search-terms").value
                .split(/[,،]/).map((t) => t.trim()).filter(Boolean);

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
                is_available: document.getElementById("pf-available").checked,
                builder_type: document.getElementById("pf-builder-type").value,
                custom_builder_url: document.getElementById("pf-builder-type").value !== "standard"
                    ? (document.getElementById("pf-builder-url").value.trim() || null)
                    : null,
                search_terms: searchTerms,
                prices: filledSizeKeys.length ? newPrices : {},
                default_size: filledSizeKeys.length ? (filledSizeKeys.includes(product?.default_size) ? product.default_size : filledSizeKeys[0]) : null,
                size_descriptions: filledSizeKeys.length
                    ? Object.fromEntries(Object.entries(sizeDescriptions).filter(([k]) => filledSizeKeys.includes(k)))
                    : {},
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
        document.getElementById("products-missing-photo-filter").addEventListener("change", renderTable);
        document.getElementById("add-product-btn").addEventListener("click", () => openProductModal(null));
    }

    /**
     * 🔗 [تحسين - وصول سريع من صفحات تانية]: صفحة العروض (offers.html) كانت
     * بتعرض صورة المنتج بس من غير أي طريقة تفتح منها تعديل الصورة مباشرة -
     * لازم تروح لصفحة المنتجات وتدور عليه يدوي. دلوقتي أي صفحة تقدر تحوّل
     * هنا برابط زي products.html?edit=PRODUCT_ID وهيفتح مودال التعديل
     * تلقائي على طول على المنتج ده.
     */
    function openEditFromQueryParam() {
        const targetId = new URLSearchParams(window.location.search).get("edit");
        if (!targetId) return;
        const product = allProducts.find((p) => p.id === targetId);
        if (product) openProductModal(product);
    }

    document.addEventListener("BoseAdminReady", async () => {
        wireControls();
        await loadCategories();
        await loadProducts();
        openEditFromQueryParam();
    });
})();