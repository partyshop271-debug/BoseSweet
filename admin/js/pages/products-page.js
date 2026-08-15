/**
 * products-page.js - منطق صفحة المنتجات فقط
 * =====================================================================
 * بيغطي الحقول الأساسية (اسم، فئة، وصف، نكهة، سعر، سعر قديم، ترتيب، صور،
 * تمييز) + قسم "إعدادات متقدمة" قابل للطي: التوفر (is_available)، نوع
 * المنتج/محاكي التخصيص (builder_type + custom_builder_url)، كلمات بحث
 * إضافية (search_terms)، والأحجام المتعددة بأسعارها (prices/default_size).
 *
 * تحسينات سرعة الوصول: عمود "النكهة" ظاهر في الجدول (مش مخفي جوه المودال
 * بس) عشان تبان المنتجات المتشابهة الاسم بسهولة، البحث بيغطي النكهة
 * وكلمات البحث الإضافية مش الاسم بس، رؤوس الجدول (الاسم/النكهة/الفئة/
 * السعر) قابلة للترتيب بالضغط عليها، وزرار "نسخ" بجنب كل منتج بيفتح
 * منتج جديد فاضي البيانات معبّاة من منتج موجود (مفيد جداً لإضافة نكهة أو
 * حجم جديد لنفس التصميم من غير ما تدخلي كل الحقول من الأول).
 */
(function () {
    "use strict";

    let allProducts = [];
    let allCategories = [];
    // ترتيب الجدول الحالي (بالضغط على رأس أي عمود قابل للترتيب) - null يعني الترتيب الافتراضي (sort_order)
    let currentSort = { key: null, dir: "asc" };

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

        let result = allProducts.filter((p) => {
            // 🔎 [تحسين البحث]: كان بيبحث بالاسم بس، فمنتجين اسمهم زي اسم الفئة (زي
            // "التورت" في فئة "التورت") ما كانش فيه طريقة تميّزهم عن بعض غير بفتح كل
            // واحد لوحده. دلوقتي البحث بيغطي النكهة وكلمات البحث الإضافية كمان.
            const haystack = [p.title, p.flavor_name, ...(p.search_terms || [])].filter(Boolean).join(" ").toLowerCase();
            const matchesSearch = !search || haystack.includes(search);
            const matchesCategory = !categoryId || p.category_id === categoryId;
            const matchesPhoto = !onlyMissingPhotos || hasPlaceholderImage(p);
            return matchesSearch && matchesCategory && matchesPhoto;
        });

        if (currentSort.key) {
            const dir = currentSort.dir === "asc" ? 1 : -1;
            result = [...result].sort((a, b) => {
                let va, vb;
                if (currentSort.key === "category") {
                    va = categoryTitle(a); vb = categoryTitle(b);
                } else if (currentSort.key === "price") {
                    va = a.price || 0; vb = b.price || 0;
                    return (va - vb) * dir;
                } else {
                    va = a[currentSort.key] || ""; vb = b[currentSort.key] || "";
                }
                return String(va).localeCompare(String(vb), "ar") * dir;
            });
        }

        return result;
    }

    function renderTable() {
        const tbody = document.getElementById("products-tbody");
        const e = window.BoseAdminUI.escapeHtml;
        const products = getFilteredProducts();

        const countEl = document.getElementById("products-results-count");
        if (countEl) {
            countEl.textContent = `عدد النتائج: ${products.length} من إجمالي ${allProducts.length} منتج`;
        }

        if (!products.length) {
            tbody.innerHTML = `<tr><td colspan="8">${window.BoseAdminUI.emptyStateHTML({
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
                <td>${p.flavor_name ? e(p.flavor_name) : `<span class="adm-badge" title="مفيش نكهة متسجلة للمنتج ده - يفضّل تضيفيها عشان تقدري تميّزيه بسهولة">بدون نكهة</span>`}</td>
                <td>${e(categoryTitle(p))}</td>
                <td>${Math.round(p.price)} ج.م</td>
                <td>${p.old_price ? Math.round(p.old_price) + " ج.م" : "—"}</td>
                <td>${p.is_featured ? `<span class="adm-badge success">مميز</span>` : "—"}</td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-id="${e(p.id)}" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="duplicate" data-id="${e(p.id)}" title="نسخ كمنتج جديد (مفيد لإضافة نكهة/حجم جديد بسرعة)">
                        <i class="fa-solid fa-copy"></i>
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
        tbody.querySelectorAll('[data-action="duplicate"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                const product = allProducts.find((p) => p.id === btn.getAttribute("data-id"));
                if (product) openProductModal(null, product);
            });
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(btn.getAttribute("data-id")));
        });
    }

    /** بتحدّث سهم الترتيب في رؤوس الجدول عشان يبان العمود المرتّب بيه دلوقتي واتجاهه */
    function updateSortHeadersUI() {
        document.querySelectorAll(".adm-sortable-th").forEach((th) => {
            const icon = th.querySelector("i");
            const key = th.getAttribute("data-sort");
            if (key === currentSort.key) {
                icon.className = currentSort.dir === "asc" ? "fa-solid fa-sort-up" : "fa-solid fa-sort-down";
                th.classList.add("adm-sortable-th-active");
            } else {
                icon.className = "fa-solid fa-sort";
                th.classList.remove("adm-sortable-th-active");
            }
        });
    }

    function wireSortHeaders() {
        document.querySelectorAll(".adm-sortable-th").forEach((th) => {
            th.addEventListener("click", () => {
                const key = th.getAttribute("data-sort");
                if (currentSort.key === key) {
                    currentSort.dir = currentSort.dir === "asc" ? "desc" : "asc";
                } else {
                    currentSort = { key, dir: "asc" };
                }
                updateSortHeadersUI();
                renderTable();
            });
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

    /** أسئلة جاهزة شائعة عادةً في متاجر الحلويات - مجرد اقتراح سريع، النص والإجابة بتتحرر بالكامل بعد الإضافة */
    const FAQ_QUICK_TEMPLATES = [
        "المنتج ده بيتحضر إمتى بالظبط؟",
        "إزاي أحافظ على طازجيته بعد الاستلام؟",
        "ينفع أطلبه بحجم أو تخصيص مختلف؟",
        "فيه توصيل لمنطقتي؟",
        "هل يصلح لمناسبة/حفلة كبيرة؟",
    ];

    const SIZE_KEYS = ["triangle", "medium", "large"];
    const SIZE_LABELS = { triangle: "مثلث", medium: "طاجن", large: "حجم عائلي" };

    /** بطاقة معاينة صغيرة لصورة حجم واحد + زرار حذف، أو فاضية لو مفيش صورة مرفوعة له */
    function sizeImageThumbHTML(key, url) {
        if (!url) return "";
        return `<div class="adm-image-thumb-wrap"><img src="${url}" alt=""><button type="button" class="adm-image-remove-btn" data-remove-size-image="${key}"><i class="fa-solid fa-xmark"></i></button></div>`;
    }
    const BUILDER_TYPES = [
        { value: "standard", label: "منتج عادي" },
        { value: "cake-customizer", label: "محاكي التورت" },
        { value: "flower-customizer", label: "محاكي الورد" },
    ];

    function openProductModal(product, duplicateSource) {
        const isEdit = !!product;
        // prefill = مصدر البيانات اللي هنعبّي بيها الفورم مبدئياً: المنتج نفسه لو
        // بنعدّل، أو منتج تاني بالكامل لو بننسخه كأساس لمنتج جديد (نفس الفئة/الوصف/
        // الصور... الخ فيما عدا المعرّف والاسم)، أو مفيش حاجة لو منتج جديد فاضي.
        const prefill = product || duplicateSource || null;
        const isDuplicate = !isEdit && !!duplicateSource;
        const e = window.BoseAdminUI.escapeHtml;
        let images = prefill ? [...(prefill.images || [])] : [];
        const prices = prefill ? { ...(prefill.prices || {}) } : {};
        const sizeDescriptions = prefill ? { ...(prefill.size_descriptions || {}) } : {};
        // 🎂 [توضيح كمية مختلف لكل حجم]: زي sizeDescriptions بالظبط، بس لبادچ الكمية
        // اللي بيظهر جنب السعر (مثال: الديسباسيتو - "ده سعر المثلث."/"ده سعر الطاجن."/
        // "ده سعر الحجم العائلي."). لو حجم معين مالوش نص هنا، الواجهة بترجع تلقائياً
        // لتوضيح الكمية العام (pf-quantity-note) تحت.
        const sizeQuantityNotes = prefill ? { ...(prefill.size_quantity_notes || {}) } : {};
        // 🖼️ [صور الأحجام المتعددة]: نسخة قابلة للتعديل من خريطة { sizeKey: imageUrl }
        let sizeImages = prefill ? { ...(prefill.size_images || {}) } : {};
        let faqs = prefill ? (prefill.faqs || []).map((f) => ({ q: f.q || "", a: f.a || "" })) : [];

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 640px;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل منتج" : (isDuplicate ? "نسخ منتج (هيتحفظ كمنتج جديد)" : "منتج جديد")}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                ${isDuplicate ? `<p class="adm-hint" style="margin: -8px 20px 14px 20px;">بيانات المنتج "${e(duplicateSource.title)}" اتنسخت هنا كنقطة بداية - غيّري المعرّف والاسم والنكهة/السعر حسب الحاجة واحفظي.</p>` : ""}

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
                                ${categoryOptionsHTML(prefill?.category_id)}
                            </select>
                        </div>
                    </div>

                    <div class="adm-field">
                        <label for="pf-title">اسم المنتج</label>
                        <input type="text" class="adm-input" id="pf-title" value="${isDuplicate ? e(prefill.title + " - نسخة") : (prefill ? e(prefill.title) : "")}" required>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="pf-flavor-name">اسم النكهة (اختياري)</label>
                            <input type="text" class="adm-input" id="pf-flavor-name" value="${prefill ? e(prefill.flavor_name || "") : ""}">
                        </div>
                        <div class="adm-field">
                            <label for="pf-flavor-desc">وصف النكهة (اختياري)</label>
                            <input type="text" class="adm-input" id="pf-flavor-desc" value="${prefill ? e(prefill.flavor_desc || "") : ""}">
                        </div>
                    </div>

                    <div class="adm-field">
                        <label for="pf-description">الوصف</label>
                        <textarea class="adm-textarea" id="pf-description">${prefill ? e(prefill.description || "") : ""}</textarea>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="pf-price">السعر</label>
                            <input type="number" step="0.01" min="0" class="adm-input" id="pf-price" value="${prefill ? prefill.price : ""}" required>
                        </div>
                        <div class="adm-field">
                            <label for="pf-old-price">السعر القديم (اختياري - لعرض خصم)</label>
                            <input type="number" step="0.01" min="0" class="adm-input" id="pf-old-price" value="${prefill && prefill.old_price ? prefill.old_price : ""}">
                        </div>
                    </div>

                    <!-- 🎂 [حل مشكلة "العميل مش فاهم الكمية"]: نص قصير بيتعرض دايماً وبشكل واضح
                         جنب السعر في كارت المنتج وصفحة المنتج (مش مخفي جوه أي شرح اختياري) -
                         مهم بالذات لمنتجات "العروض/البوكسات" (promo-*) اللي بتتغير محتوياتها من
                         وقت للتاني: كل ما تتعدّل عناصر عرض من هنا، لازم التوضيح يتحدّث معاها. -->
                    <div class="adm-field">
                        <label for="pf-quantity-note">توضيح الكمية (بيظهر دايماً جنب السعر)</label>
                        <input type="text" class="adm-input" id="pf-quantity-note" value="${prefill ? e(prefill.quantity_note || "") : ""}"
                               placeholder="مثال: السعر ده لدستة كاملة (12 قطعة)، أو: البوكس ده فيه 6 طواجن (3 ديسباسيتو + 3 قشطوطة)">
                        <span class="adm-hint">اسيبه فاضي لو مفيش لبس ممكن يحصل. مهم جداً لأي منتج "عرض/بوكس" مكوّن من عناصر مختلفة - حدّثه كل ما تغيّري محتويات العرض.</span>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="pf-sort-order">ترتيب العرض</label>
                            <input type="number" class="adm-input" id="pf-sort-order" value="${prefill ? (prefill.sort_order ?? 0) : 0}">
                        </div>
                        <div class="adm-field">
                            <label class="adm-checkbox-label">
                                <input type="checkbox" id="pf-featured" ${prefill && prefill.is_featured ? "checked" : ""}>
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
                                <input type="checkbox" id="pf-available" ${!prefill || prefill.is_available !== false ? "checked" : ""}>
                                المنتج متاح للطلب حالياً
                            </label>

                            <div class="adm-field">
                                <label for="pf-builder-type">نوع المنتج</label>
                                <select class="adm-select" id="pf-builder-type">
                                    ${BUILDER_TYPES.map((bt) => `<option value="${bt.value}" ${prefill && prefill.builder_type === bt.value ? "selected" : ""}>${bt.label}</option>`).join("")}
                                </select>
                                <span class="adm-hint">لو مش "منتج عادي"، المنتج ده بيفتح محاكي التخصيص بدل صفحة منتج عادية - لازم تحدد رابط المحاكي تحت وإلا هيتعامل كمنتج عادي عادي.</span>
                            </div>

                            <div class="adm-field" id="pf-builder-url-field" style="${!prefill || prefill.builder_type === "standard" || !prefill.builder_type ? "display:none;" : ""}">
                                <label for="pf-builder-url">رابط صفحة المحاكي</label>
                                <input type="text" class="adm-input" id="pf-builder-url"
                                       value="${prefill ? e(prefill.custom_builder_url || "") : ""}"
                                       placeholder="مثال: cake-builder.html">
                                <span class="adm-hint">لازم يتحدد وإلا المنتج مش هيفتح المحاكي أبداً حتى لو نوعه اتغيّر فوق.</span>
                            </div>

                            <div class="adm-field">
                                <label for="pf-search-terms">كلمات بحث إضافية (اختياري - افصل بفاصلة)</label>
                                <input type="text" class="adm-input" id="pf-search-terms"
                                       value="${prefill ? e((prefill.search_terms || []).join('، ')) : ""}"
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

                            <div class="adm-field">
                                <label>توضيح الكمية لكل حجم (اختياري - لو المنتج بيتباع بأحجام مختلفة زي الديسباسيتو)</label>
                                <div class="adm-form-grid" style="grid-template-columns: repeat(3, 1fr);">
                                    ${SIZE_KEYS.map((key) => `
                                        <div class="adm-field">
                                            <label for="pf-size-qty-note-${key}">${SIZE_LABELS[key]}</label>
                                            <input type="text" class="adm-input" id="pf-size-qty-note-${key}"
                                                   value="${e(sizeQuantityNotes[key] || "")}" placeholder="مثال: ده سعر ${SIZE_LABELS[key]}.">
                                        </div>
                                    `).join("")}
                                </div>
                                <span class="adm-hint">لو اسبتها فاضية لحجم معين، توضيح الكمية العام فوق هو اللي هيتعرض بدلها لما العميل يختار الحجم ده.</span>
                            </div>

                            <div class="adm-field">
                                <label>صور الأحجام (اختياري - لو مفيش صورة مخصصة للحجم، هيتعرض له صورة المنتج الأساسية فوق)</label>
                                <div class="adm-form-grid" style="grid-template-columns: repeat(3, 1fr);" id="pf-size-images-grid">
                                    ${SIZE_KEYS.map((key) => `
                                        <div class="adm-field" data-size-image-field="${key}">
                                            <label>${SIZE_LABELS[key]}</label>
                                            <div class="adm-images-grid" id="pf-size-image-preview-${key}">${sizeImageThumbHTML(key, sizeImages[key])}</div>
                                            <label class="adm-image-upload-btn" for="pf-size-image-input-${key}" style="font-size: 12px; padding: 6px 10px;">
                                                <i class="fa-solid fa-cloud-arrow-up"></i>
                                                <span>${sizeImages[key] ? "استبدال" : "إضافة صورة"}</span>
                                            </label>
                                            <input type="file" id="pf-size-image-input-${key}" accept="image/*" hidden>
                                        </div>
                                    `).join("")}
                                </div>
                                <span class="adm-hint">مفيدة للمنتج اللي شكله بيختلف فعلياً حسب الحجم (زي التورت أو البوكسات).</span>
                            </div>
                        </div>
                    </details>

                    <details class="adm-field" open style="margin-top: 6px;">
                        <summary style="cursor:pointer; color: var(--adm-text-secondary); font-weight: 600; padding: 6px 0;">
                            🔍 الأسئلة الشائعة الخاصة بهذا المنتج (بتظهر في صفحة المنتج وبتساعد في الظهور بمحركات البحث والذكاء الاصطناعي)
                        </summary>
                        <div style="padding-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                            <span class="adm-hint">اكتبي سؤال حقيقي بيتسأل كتير عن الصنف ده تحديداً (المكونات، الحفظ، المناسبات، التخصيص...) وجاوبيه بصدق. الأسئلة دي مختلفة عن أي منتج تاني.</span>
                            <div id="pf-faq-quick-add" style="display:flex; flex-wrap:wrap; gap: 8px;">
                                ${FAQ_QUICK_TEMPLATES.map((q, idx) => `<button type="button" class="adm-btn adm-btn-ghost" data-faq-template="${idx}" style="font-size:0.78rem; padding:6px 12px;">+ ${e(q)}</button>`).join("")}
                            </div>
                            <div id="pf-faq-rows"></div>
                            <button type="button" class="adm-btn adm-btn-ghost" id="pf-faq-add-blank"><i class="fa-solid fa-plus"></i> سؤال جديد فاضي</button>
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

        // 🖼️ [صور الأحجام المتعددة]: زرار رفع وحذف مستقل لكل حجم من الثلاثة.
        function refreshSizeImagePreview(key) {
            document.getElementById(`pf-size-image-preview-${key}`).innerHTML = sizeImageThumbHTML(key, sizeImages[key]);
            const uploadLabelSpan = document.querySelector(`label[for="pf-size-image-input-${key}"] span`);
            if (uploadLabelSpan) uploadLabelSpan.textContent = sizeImages[key] ? "استبدال" : "إضافة صورة";
            const removeBtn = document.querySelector(`[data-remove-size-image="${key}"]`);
            if (removeBtn) {
                removeBtn.addEventListener("click", () => {
                    delete sizeImages[key];
                    refreshSizeImagePreview(key);
                });
            }
        }
        SIZE_KEYS.forEach((key) => {
            refreshSizeImagePreview(key);
            document.getElementById(`pf-size-image-input-${key}`).addEventListener("change", async (evt) => {
                const file = (evt.target.files || [])[0];
                if (!file) return;
                const uploadLabelSpan = document.querySelector(`label[for="pf-size-image-input-${key}"] span`);
                const originalLabel = uploadLabelSpan ? uploadLabelSpan.textContent : "";
                if (uploadLabelSpan) uploadLabelSpan.textContent = "جاري الرفع...";
                try {
                    const url = await window.BoseAdminUI.uploadImageToCloudinary(file);
                    if (url) {
                        sizeImages[key] = url;
                        refreshSizeImagePreview(key);
                    } else {
                        window.BoseAdminUI.showToast("تعذر رفع صورة الحجم", "error");
                        if (uploadLabelSpan) uploadLabelSpan.textContent = originalLabel;
                    }
                } catch (err) {
                    window.BoseAdminUI.showToast("تعذر رفع صورة الحجم", "error");
                    if (uploadLabelSpan) uploadLabelSpan.textContent = originalLabel;
                } finally {
                    evt.target.value = "";
                }
            });
        });

        function refreshFaqRows() {
            const wrap = document.getElementById("pf-faq-rows");
            wrap.innerHTML = faqs.map((f, idx) => `
                <div class="adm-faq-row" data-idx="${idx}" style="border:1px solid rgba(17,17,17,0.1); border-radius:12px; padding:10px; display:flex; flex-direction:column; gap:6px;">
                    <div style="display:flex; gap:8px; align-items:flex-start;">
                        <input type="text" class="adm-input pf-faq-q" data-idx="${idx}" placeholder="السؤال" value="${e(f.q)}" style="flex:1;">
                        <button type="button" class="adm-btn adm-btn-ghost pf-faq-remove" data-idx="${idx}" title="حذف"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <textarea class="adm-textarea pf-faq-a" data-idx="${idx}" placeholder="الإجابة">${e(f.a)}</textarea>
                </div>
            `).join("") || `<span class="adm-hint">مفيش أسئلة متضافة لسه - استخدمي الاقتراحات فوق أو زودي سؤال فاضي.</span>`;

            wrap.querySelectorAll(".pf-faq-q").forEach((inp) => {
                inp.addEventListener("input", () => { faqs[Number(inp.dataset.idx)].q = inp.value; });
            });
            wrap.querySelectorAll(".pf-faq-a").forEach((ta) => {
                ta.addEventListener("input", () => { faqs[Number(ta.dataset.idx)].a = ta.value; });
            });
            wrap.querySelectorAll(".pf-faq-remove").forEach((btn) => {
                btn.addEventListener("click", () => {
                    faqs.splice(Number(btn.dataset.idx), 1);
                    refreshFaqRows();
                });
            });
        }
        refreshFaqRows();

        document.getElementById("pf-faq-add-blank").addEventListener("click", () => {
            faqs.push({ q: "", a: "" });
            refreshFaqRows();
        });
        document.querySelectorAll("[data-faq-template]").forEach((btn) => {
            btn.addEventListener("click", () => {
                faqs.push({ q: FAQ_QUICK_TEMPLATES[Number(btn.getAttribute("data-faq-template"))], a: "" });
                refreshFaqRows();
            });
        });

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
                quantity_note: document.getElementById("pf-quantity-note").value.trim() || null,
                sort_order: parseInt(document.getElementById("pf-sort-order").value, 10) || 0,
                is_featured: document.getElementById("pf-featured").checked,
                is_available: document.getElementById("pf-available").checked,
                builder_type: document.getElementById("pf-builder-type").value,
                custom_builder_url: document.getElementById("pf-builder-type").value !== "standard"
                    ? (document.getElementById("pf-builder-url").value.trim() || null)
                    : null,
                search_terms: searchTerms,
                faqs: faqs.filter((f) => f.q.trim() && f.a.trim()).map((f) => ({ q: f.q.trim(), a: f.a.trim() })),
                prices: filledSizeKeys.length ? newPrices : {},
                default_size: filledSizeKeys.length ? (filledSizeKeys.includes(prefill?.default_size) ? prefill.default_size : filledSizeKeys[0]) : null,
                size_descriptions: filledSizeKeys.length
                    ? Object.fromEntries(Object.entries(sizeDescriptions).filter(([k]) => filledSizeKeys.includes(k)))
                    : {},
                // 🎂 [توضيح كمية مختلف لكل حجم]: بنقرأ القيمة الحالية من كل حقل نص وقت
                // الحفظ (مش من الكائن sizeQuantityNotes القديم) عشان أي تعديل كتبته
                // الأدمن في الحقول يتحفظ فعلياً، وبنحفظ بس مفاتيح الأحجام اللي لسه ليها سعر.
                size_quantity_notes: filledSizeKeys.length
                    ? Object.fromEntries(
                        filledSizeKeys
                            .map((k) => [k, (document.getElementById(`pf-size-qty-note-${k}`)?.value || "").trim()])
                            .filter(([, v]) => v)
                      )
                    : {},
                // 🖼️ [صور الأحجام المتعددة]: بنحفظ بس صور الأحجام اللي لسه ليها سعر متعبّى
                // (لو الأدمن مسح سعر حجم، صورته المخصصة بتتشال معاه تلقائياً بدل ما تفضل يتيمة).
                size_images: filledSizeKeys.length
                    ? Object.fromEntries(Object.entries(sizeImages).filter(([k]) => filledSizeKeys.includes(k)))
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
        wireSortHeaders();
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