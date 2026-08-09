/**
 * content-studio-page.js - منطق صفحة "استوديو المحتوى" فقط
 * =====================================================================
 * الأداة دي بتولّد نصوص (وصف منتج / وصف نكهة / وصف حجم معيّن / وصف فئة /
 * محتوى صفحة سياسة) بالذكاء الاصطناعي عن طريق Edge Function اسمها
 * generate-content (راجع window.BoseAdmin.generateContent في admin-data.js)،
 * وبتدي الأدمن تحكّم كامل في نطاق التطبيق قبل الحفظ الفعلي:
 *
 *   - منتج واحد (نكهة واحدة بالظبط) في وصفه العام (يغطي كل الأحجام)
 *   - منتج واحد في وصف حجم معيّن بس (override فوق الوصف العام)
 *   - كل نكهات نفس المنتج مرة واحدة (نفس العنوان + نفس الفئة)
 *   - وصف نكهة (flavor_desc) منفصل عن الوصف العام
 *   - وصف فئة كاملة
 *   - محتوى صفحة سياسة/معلومات كاملة
 *
 * التوليد لا يحفظ أي حاجة تلقائياً - النص بيرجع في مربع قابل للتعديل،
 * وممكن تولّد نسخة تانية لحد ما تعتمد النص اللي عاجبك بزرار "اعتماد وحفظ".
 */
(function () {
    "use strict";

    let allCategories = [];
    let allProducts = [];
    let allPages = [];

    let currentScope = "product_description";
    let generatedText = "";
    let attemptCount = 0;

    const SCOPE_LABELS = {
        product_description: "وصف منتج (نكهة واحدة - يغطي كل الأحجام)",
        product_flavor_desc: "وصف نكهة (سطر قصير مميز للنكهة)",
        product_size_description: "وصف حجم معيّن بس (override فوق الوصف العام)",
        category_description: "وصف فئة كاملة",
        content_page: "محتوى صفحة سياسة/معلومات",
    };

    /* ============================= أدوات مساعدة ============================= */

    function e(v) { return window.BoseAdminUI.escapeHtml(v); }

    function familyOf(product) {
        // "العائلة" = كل صفوف نفس المنتج بأسماء نكهات مختلفة: نفس العنوان + نفس الفئة
        return allProducts.filter((p) => p.title === product.title && p.category_id === product.category_id);
    }

    function sizesOf(product) {
        const prices = product?.prices || {};
        return Object.keys(prices);
    }

    /* ============================= بناء منطقة اختيار الهدف ============================= */

    function renderTargetArea() {
        const box = document.getElementById("cs-target-area");
        if (currentScope === "content_page") {
            box.innerHTML = `
                <div class="adm-field">
                    <label for="cs-page-select">الصفحة</label>
                    <select class="adm-select" id="cs-page-select">
                        ${allPages.map((p) => `<option value="${e(p.id)}">${e(p.title)}</option>`).join("")}
                    </select>
                </div>`;
            wirePageChange();
            return;
        }

        if (currentScope === "category_description") {
            box.innerHTML = `
                <div class="adm-field">
                    <label for="cs-category-select">الفئة</label>
                    <select class="adm-select" id="cs-category-select">
                        <option value="">اختر فئة...</option>
                        ${allCategories.map((c) => `<option value="${e(c.id)}">${e(c.title)}</option>`).join("")}
                    </select>
                </div>`;
            document.getElementById("cs-category-select").addEventListener("change", onTargetChanged);
            return;
        }

        // المنتج / النكهة / الحجم - كلهم بيبدأوا باختيار فئة ثم منتج (صف = نكهة)
        box.innerHTML = `
            <div class="adm-form-grid">
                <div class="adm-field">
                    <label for="cs-category-filter">الفئة</label>
                    <select class="adm-select" id="cs-category-filter">
                        <option value="">كل الفئات</option>
                        ${allCategories.map((c) => `<option value="${e(c.id)}">${e(c.title)}</option>`).join("")}
                    </select>
                </div>
                <div class="adm-field">
                    <label for="cs-product-select">المنتج (النكهة)</label>
                    <select class="adm-select" id="cs-product-select">
                        <option value="">اختر منتج...</option>
                    </select>
                </div>
            </div>
            <div class="adm-field" id="cs-size-field" style="display:none;">
                <label for="cs-size-select">الحجم</label>
                <select class="adm-select" id="cs-size-select"></select>
            </div>
            ${currentScope !== "product_flavor_desc" ? `
            <div class="adm-field">
                <label class="adm-checkbox-label">
                    <input type="checkbox" id="cs-family-toggle">
                    طبّق على كل نكهات نفس المنتج مرة واحدة (بدل النكهة دي بس)
                </label>
                <span class="adm-hint" id="cs-family-hint"></span>
            </div>` : ""}
        `;

        function refreshProductOptions() {
            const catId = document.getElementById("cs-category-filter").value;
            const list = catId ? allProducts.filter((p) => p.category_id === catId) : allProducts;
            const select = document.getElementById("cs-product-select");
            select.innerHTML = `<option value="">اختر منتج...</option>` +
                list.map((p) => `<option value="${e(p.id)}">${e(p.title)}${p.flavor_name ? " - " + e(p.flavor_name) : ""}</option>`).join("");
        }
        refreshProductOptions();

        document.getElementById("cs-category-filter").addEventListener("change", () => { refreshProductOptions(); onTargetChanged(); });
        document.getElementById("cs-product-select").addEventListener("change", onProductPicked);
        const familyToggle = document.getElementById("cs-family-toggle");
        if (familyToggle) familyToggle.addEventListener("change", onTargetChanged);
    }

    function onProductPicked() {
        const productId = document.getElementById("cs-product-select").value;
        const sizeField = document.getElementById("cs-size-field");

        if (currentScope === "product_size_description" && productId) {
            const product = allProducts.find((p) => p.id === productId);
            const sizes = sizesOf(product);
            if (sizes.length) {
                sizeField.style.display = "";
                document.getElementById("cs-size-select").innerHTML =
                    sizes.map((s) => `<option value="${e(s)}">${e(s)}</option>`).join("");
                document.getElementById("cs-size-select").onchange = onTargetChanged;
            } else {
                sizeField.style.display = "none";
            }
        } else {
            sizeField.style.display = "none";
        }

        onTargetChanged();
    }

    function wirePageChange() {
        document.getElementById("cs-page-select").addEventListener("change", onTargetChanged);
        onTargetChanged();
    }

    /* ============================= جمع سياق الهدف الحالي ============================= */

    function getCurrentTargets() {
        // بترجع { single: {context}, bulk: [{id,...}] أو null, currentText }
        if (currentScope === "content_page") {
            const id = document.getElementById("cs-page-select")?.value;
            const page = allPages.find((p) => p.id === id);
            if (!page) return null;
            return {
                ids: [page.id],
                currentText: page.content || "",
                context: { targetTable: "content_pages", targetId: page.id, pageTitle: page.title, currentText: page.content || "" },
            };
        }

        if (currentScope === "category_description") {
            const id = document.getElementById("cs-category-select")?.value;
            const cat = allCategories.find((c) => c.id === id);
            if (!cat) return null;
            return {
                ids: [cat.id],
                currentText: cat.description || "",
                context: {
                    targetTable: "categories", targetId: cat.id, currentText: cat.description || "",
                    categoryTitle: cat.title, builderType: cat.builder_type,
                },
            };
        }

        const productId = document.getElementById("cs-product-select")?.value;
        const product = allProducts.find((p) => p.id === productId);
        if (!product) return null;

        const familyToggle = document.getElementById("cs-family-toggle");
        const useFamily = familyToggle ? familyToggle.checked : false;
        const family = useFamily ? familyOf(product) : [product];

        if (currentScope === "product_flavor_desc") {
            return {
                ids: [product.id],
                currentText: product.flavor_desc || "",
                context: {
                    targetTable: "products", targetId: product.id, currentText: product.flavor_desc || "",
                    productTitle: product.title, flavorName: product.flavor_name, categoryTitle: categoryTitleOf(product),
                },
            };
        }

        if (currentScope === "product_size_description") {
            const sizeKey = document.getElementById("cs-size-select")?.value;
            if (!sizeKey) return null;
            return {
                ids: family.map((p) => p.id),
                familyMode: useFamily,
                sizeKey,
                currentText: product.size_descriptions?.[sizeKey] || "",
                context: {
                    targetTable: "products", targetId: product.id, sizeKey, currentText: product.size_descriptions?.[sizeKey] || "",
                    productTitle: product.title, flavorName: product.flavor_name, categoryTitle: categoryTitleOf(product),
                    sizePrice: product.prices?.[sizeKey], baseDescription: product.description,
                },
            };
        }

        // product_description (الافتراضي - يغطي كل الأحجام)
        return {
            ids: family.map((p) => p.id),
            familyMode: useFamily,
            currentText: product.description || "",
            context: {
                targetTable: "products", targetId: product.id, currentText: product.description || "",
                productTitle: product.title, flavorName: product.flavor_name, flavorDesc: product.flavor_desc,
                categoryTitle: categoryTitleOf(product), price: product.price, sizesAvailable: sizesOf(product),
            },
        };
    }

    function categoryTitleOf(product) {
        return allCategories.find((c) => c.id === product.category_id)?.title || "";
    }

    function onTargetChanged() {
        const targets = getCurrentTargets();
        const familyToggle = document.getElementById("cs-family-toggle");
        const familyHint = document.getElementById("cs-family-hint");

        if (familyToggle && familyHint && targets) {
            const productId = document.getElementById("cs-product-select")?.value;
            const product = allProducts.find((p) => p.id === productId);
            const family = product ? familyOf(product) : [];
            familyHint.textContent = family.length > 1
                ? `هيتطبق على ${family.length} نكهة: ${family.map((p) => p.flavor_name || p.title).join("، ")}`
                : "المنتج ده مالوش نكهات تانية بنفس الاسم والفئة.";
        }

        document.getElementById("cs-current-text").value = targets ? targets.currentText : "";
        resetGeneratedPane();
        updateGenerateButtonState();
    }

    function updateGenerateButtonState() {
        const targets = getCurrentTargets();
        document.getElementById("cs-generate-btn").disabled = !targets;
    }

    function resetGeneratedPane() {
        generatedText = "";
        attemptCount = 0;
        document.getElementById("cs-generated-text").value = "";
        document.getElementById("cs-feedback-row").style.display = "none";
        document.getElementById("cs-regenerate-btn").style.display = "none";
        document.getElementById("cs-save-btn").disabled = true;
        document.getElementById("cs-attempt-label").textContent = "";
    }

    /* ============================= التوليد ============================= */

    async function handleGenerate(isRegenerate) {
        const targets = getCurrentTargets();
        if (!targets) return;

        const btn = isRegenerate ? document.getElementById("cs-regenerate-btn") : document.getElementById("cs-generate-btn");
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التوليد...';

        try {
            const feedback = document.getElementById("cs-feedback-input").value.trim();
            const text = await window.BoseAdmin.generateContent({
                scope: currentScope,
                context: targets.context,
                regenerate: isRegenerate,
                previousAttempt: isRegenerate ? generatedText : undefined,
                feedback: isRegenerate ? (feedback || undefined) : undefined,
            });

            generatedText = text;
            attemptCount += 1;
            document.getElementById("cs-generated-text").value = text;
            document.getElementById("cs-feedback-row").style.display = "";
            document.getElementById("cs-feedback-input").value = "";
            document.getElementById("cs-regenerate-btn").style.display = "";
            document.getElementById("cs-save-btn").disabled = false;
            document.getElementById("cs-attempt-label").textContent = `محاولة رقم ${attemptCount}`;
        } catch (err) {
            window.BoseAdminUI.showToast(err.message || "تعذر توليد المحتوى", "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }

    /* ============================= الحفظ (الاعتماد) ============================= */

    async function handleSave() {
        const targets = getCurrentTargets();
        if (!targets) return;

        const finalText = document.getElementById("cs-generated-text").value.trim();
        if (!finalText) {
            window.BoseAdminUI.showToast("مفيش نص لحفظه", "error");
            return;
        }

        const saveBtn = document.getElementById("cs-save-btn");
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

        try {
            if (currentScope === "content_page") {
                await window.BoseAdmin.updateContentPage(targets.ids[0], finalText);
            } else if (currentScope === "category_description") {
                await window.BoseAdmin.updateCategory(targets.ids[0], { description: finalText });
            } else if (currentScope === "product_flavor_desc") {
                await window.BoseAdmin.updateProduct(targets.ids[0], { flavor_desc: finalText });
            } else if (currentScope === "product_size_description") {
                // كل صف ليه size_descriptions مختلف عن التاني، فلازم ميرچ لكل صف لوحده
                const rows = allProducts.filter((p) => targets.ids.includes(p.id));
                await Promise.all(rows.map((p) => {
                    const merged = { ...(p.size_descriptions || {}), [targets.sizeKey]: finalText };
                    return window.BoseAdmin.updateProduct(p.id, { size_descriptions: merged });
                }));
            } else {
                // product_description - نفس النص لكل الصفوف المستهدفة (منتج واحد أو عائلة كاملة)
                if (targets.ids.length > 1) {
                    await window.BoseAdmin.bulkUpdateProducts(targets.ids, { description: finalText });
                } else {
                    await window.BoseAdmin.updateProduct(targets.ids[0], { description: finalText });
                }
            }

            window.BoseAdminUI.showToast(
                targets.ids.length > 1 ? `تم الحفظ على ${targets.ids.length} صف بنجاح` : "تم الحفظ بنجاح",
                "success"
            );

            await reloadDataQuietly();
            document.getElementById("cs-current-text").value = finalText;
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر حفظ النص", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> اعتماد وحفظ';
        }
    }

    async function reloadDataQuietly() {
        [allCategories, allProducts, allPages] = await Promise.all([
            window.BoseAdmin.getAllCategories(),
            window.BoseAdmin.getAllProducts(),
            window.BoseAdmin.getAllContentPages(),
        ]);
    }

    /* ============================= التبديل بين النطاقات (Scope) ============================= */

    function renderScopeTabs() {
        const box = document.getElementById("cs-scope-tabs");
        box.innerHTML = Object.entries(SCOPE_LABELS).map(([key, label]) => `
            <button type="button" class="adm-btn ${key === currentScope ? "adm-btn-primary" : "adm-btn-outline"} adm-btn-sm cs-scope-btn" data-scope="${key}">
                ${e(label)}
            </button>
        `).join("");

        box.querySelectorAll(".cs-scope-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                currentScope = btn.getAttribute("data-scope");
                renderScopeTabs();
                renderTargetArea();
                resetGeneratedPane();
                document.getElementById("cs-current-text").value = "";
                updateGenerateButtonState();
            });
        });
    }

    /* ============================= التحميل ============================= */

    async function init() {
        await reloadDataQuietly();

        renderScopeTabs();
        renderTargetArea();
        resetGeneratedPane();
        updateGenerateButtonState();

        document.getElementById("cs-generate-btn").addEventListener("click", () => handleGenerate(false));
        document.getElementById("cs-regenerate-btn").addEventListener("click", () => handleGenerate(true));
        document.getElementById("cs-save-btn").addEventListener("click", handleSave);
        document.getElementById("cs-generated-text").addEventListener("input", () => {
            generatedText = document.getElementById("cs-generated-text").value;
        });

        document.getElementById("content-studio-content").style.display = "";
        document.getElementById("content-studio-loading").style.display = "none";
    }

    document.addEventListener("BoseAdminReady", init);
})();