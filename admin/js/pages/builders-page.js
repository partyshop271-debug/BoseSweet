/**
 * builders-page.js - منطق صفحة إعدادات المحاكيات فقط
 * =====================================================================
 * كل قوائم الاختيارات هنا (أنواع التورت، خيارات الطباعة، الأشكال، أنواع
 * الورد، التغليف، الشوكولاتة) شكلها واحد بالظبط (اسم + سعر اختياري + حقل
 * إضافي اختياري)، فبدل ما تتكرر ست مرات، فيه دالة واحدة renderNamedList
 * بتبني وتدير أي قائمة منهم. فئة "التصنيفات المالية" (moneyCategories)
 * بس شكلها مختلف (رسوم/مبلغ من غير اسم) فليها دالة منفصلة بسيطة.
 *
 * كل عنصر جديد بياخد id داخلي مولّد تلقائياً (مش بيتكتب يدوي زي كود
 * الكوبون أو معرّف الفئة) لأنه استخدامه داخلي بس لربط الاختيار بسعره،
 * مش نص بيشوفه العميل ولا لازم يتكتب بالإنجليزي.
 */
(function () {
    "use strict";

    let cakeBuilder = {};
    let flowerBuilder = {};

    function genId() {
        return "opt-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }


    /* ============================= صورة واحدة (بانر رئيسي) ============================= */

    function renderSingleImageSlot(containerId, currentUrl, onChange) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="adm-curated-item" style="align-items:center;">
                <label class="adm-image-upload-btn" style="width:90px; height:90px; padding:0; overflow:hidden; flex-shrink:0;" title="صورة البانر">
                    <input type="file" accept="image/*" data-action="upload-hero" hidden>
                    ${currentUrl
                        ? `<img src="${currentUrl}" alt="" style="width:100%; height:100%; object-fit:cover;">`
                        : `<i class="fa-solid fa-camera"></i>`}
                </label>
                <span class="adm-order-item-meta">${currentUrl ? "اضغط على الصورة لتغييرها" : "اضغط لرفع صورة البانر"}</span>
            </div>`;

        const input = container.querySelector('[data-action="upload-hero"]');
        input.addEventListener("change", async () => {
            const file = input.files && input.files[0];
            if (!file) return;
            const label = container.querySelector("label");
            const original = label.innerHTML;
            label.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            try {
                const url = await window.BoseAdminUI.uploadImageToCloudinary(file);
                onChange(url);
                renderSingleImageSlot(containerId, url, onChange);
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر رفع الصورة", "error");
                label.innerHTML = original;
            }
        });
    }

    /* ============================= قائمة مسمّاة عامة (اسم + سعر/حقل إضافي اختياري) ============================= */

    function renderNamedList(containerId, items, opts = {}) {
        const e = window.BoseAdminUI.escapeHtml;
        const container = document.getElementById(containerId);

        container.innerHTML = items.map((item, idx) => `
            <div class="adm-curated-item" data-idx="${idx}">
                ${opts.imageField ? `
                <label class="adm-image-upload-btn" style="width:40px; height:40px; padding:0; overflow:hidden; flex-shrink:0;" title="صورة الخيار">
                    <input type="file" accept="image/*" data-action="upload-image" hidden>
                    ${item.image
                        ? `<img src="${e(item.image)}" alt="" style="width:100%; height:100%; object-fit:cover;">`
                        : `<i class="fa-solid fa-camera"></i>`}
                </label>` : ""}
                <input type="text" class="adm-input" style="flex:1;" data-field="name" value="${e(item.name || "")}" placeholder="الاسم">
                ${opts.priceField ? `<input type="number" class="adm-input" style="width:100px;" data-field="price" value="${item.price ?? 0}" placeholder="السعر">` : ""}
                ${opts.extraField ? `<input type="number" class="adm-input" style="width:130px;" data-field="${opts.extraField}" value="${item[opts.extraField] ?? 0}" placeholder="${opts.extraLabel}">` : ""}
                <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="remove" title="حذف">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>`).join("") || `<p class="adm-order-item-meta" style="padding: 4px 2px;">مفيش خيارات مضافة لسه.</p>`;

        container.querySelectorAll("[data-field]").forEach((input) => {
            input.addEventListener("input", () => {
                const idx = Number(input.closest("[data-idx]").getAttribute("data-idx"));
                const field = input.getAttribute("data-field");
                items[idx][field] = field === "name" ? input.value : (parseFloat(input.value) || 0);
            });
        });
        container.querySelectorAll('[data-action="remove"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = Number(btn.closest("[data-idx]").getAttribute("data-idx"));
                items.splice(idx, 1);
                renderNamedList(containerId, items, opts);
            });
        });
        if (opts.imageField) {
            container.querySelectorAll('[data-action="upload-image"]').forEach((input) => {
                input.addEventListener("change", async () => {
                    const file = input.files && input.files[0];
                    if (!file) return;
                    const idx = Number(input.closest("[data-idx]").getAttribute("data-idx"));
                    const label = input.closest("label");
                    const original = label.innerHTML;
                    label.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    try {
                        const url = await window.BoseAdminUI.uploadImageToCloudinary(file);
                        items[idx].image = url;
                        renderNamedList(containerId, items, opts);
                    } catch (err) {
                        window.BoseAdminUI.showToast("تعذر رفع الصورة", "error");
                        label.innerHTML = original;
                    }
                });
            });
        }
    }

    function wireAddButton(buttonId, containerId, items, opts) {
        document.getElementById(buttonId).addEventListener("click", () => {
            const newItem = { id: genId(), name: "" };
            if (opts.priceField) newItem.price = 0;
            if (opts.extraField) newItem[opts.extraField] = 0;
            items.push(newItem);
            renderNamedList(containerId, items, opts);
        });
    }

    /* ============================= فئات المبالغ (محاكي الورد - money gift card) ============================= */

    function renderMoneyCategories(items) {
        const container = document.getElementById("list-money-categories");
        container.innerHTML = items.map((item, idx) => `
            <div class="adm-curated-item" data-idx="${idx}">
                <input type="number" class="adm-input" style="flex:1;" data-field="amount" value="${item.amount ?? 0}" placeholder="المبلغ (ج.م)">
                <input type="number" class="adm-input" style="flex:1;" data-field="fee" value="${item.fee ?? 0}" placeholder="رسوم الإضافة (ج.م)">
                <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="remove" title="حذف">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>`).join("") || `<p class="adm-order-item-meta" style="padding: 4px 2px;">مفيش فئات مبالغ مضافة لسه.</p>`;

        container.querySelectorAll("[data-field]").forEach((input) => {
            input.addEventListener("input", () => {
                const idx = Number(input.closest("[data-idx]").getAttribute("data-idx"));
                items[idx][input.getAttribute("data-field")] = parseFloat(input.value) || 0;
            });
        });
        container.querySelectorAll('[data-action="remove"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                items.splice(Number(btn.closest("[data-idx]").getAttribute("data-idx")), 1);
                renderMoneyCategories(items);
            });
        });
    }

    /* ============================= أنواع الورد (3 قيم ثابتة + صورة فقط) ============================= */

    // 🐛🖼️👑 [إصلاح جذري - "لو ضفنا نوع ورد جديد بتختفي صور كل الأنواع"]:
    // السبب الحقيقي كان إن الموقع نفسه (flower-builder.html) عنده 3 أزرار
    // اختيار نوع ورد ثابتة ومكتوبة يدوي في الصفحة (natural/artificial/satin)
    // مفيش أي طريقة تقنية تضيفي بيها نوع رابع يظهر فعلياً للعميلة - القائمة
    // القديمة هنا كانت بتسمحلك "تضيفي" عنصر جديد بزرار "إضافة نوع"، لكن العنصر
    // الجديد ده كان بياخد id عشوائي (opt-xxxxx) مش هيتطابق أبداً مع أي من الـ3
    // قيم الحقيقية (natural/artificial/satin) اللي محاكي الورد بيدور عليها فعلياً
    // عشان يعرض صورة كل نوع - يعني العنصر الجديد كان بيتحفظ في قاعدة البيانات
    // من غير ما يظهر في أي مكان، ومع كل ضغطة "إضافة" جديدة كانت القائمة بتتلخبط
    // أكتر (عناصر بلا أسماء ولا صور ظاهرة) وبتوهم إن "الصور اتمسحت" رغم إنها
    // موجودة فعلياً بس مربوطة بعنصر تاني غلط. الحل الحقيقي: قائمة ثابتة بـ3
    // عناصر بالظبط (بنفس الـid اللي محاكي الورد بيدور عليه)، صورة لكل واحد
    // بس - من غير أي زرار إضافة أو حذف يقدر يكسّر الربط.
    const FIXED_FLOWER_TYPES = [
        { id: "natural", label: "🌸 ورد طبيعي نضر" },
        { id: "artificial", label: "✨ ورد صناعي فاخر" },
        { id: "satin", label: "🎀 ورد ستان راقٍ" },
    ];

    function normalizeFixedFlowerTypes(items) {
        const existing = Array.isArray(items) ? items : [];
        return FIXED_FLOWER_TYPES.map((fixed) => {
            const found = existing.find((it) => it && it.id === fixed.id);
            return { id: fixed.id, name: fixed.label, image: (found && found.image) || "" };
        });
    }

    function renderFixedFlowerTypeImages(containerId, items) {
        const e = window.BoseAdminUI.escapeHtml;
        const container = document.getElementById(containerId);
        container.innerHTML = items.map((item, idx) => `
            <div class="adm-curated-item" data-idx="${idx}">
                <label class="adm-image-upload-btn" style="width:56px; height:56px; padding:0; overflow:hidden; flex-shrink:0;" title="صورة ${e(item.name)}">
                    <input type="file" accept="image/*" data-action="upload-image" hidden>
                    ${item.image
                        ? `<img src="${e(item.image)}" alt="" style="width:100%; height:100%; object-fit:cover;">`
                        : `<i class="fa-solid fa-camera"></i>`}
                </label>
                <span class="adm-order-item-meta" style="flex:1;">${e(item.name)}</span>
            </div>`).join("");

        container.querySelectorAll('[data-action="upload-image"]').forEach((input) => {
            input.addEventListener("change", async () => {
                const file = input.files && input.files[0];
                if (!file) return;
                const idx = Number(input.closest("[data-idx]").getAttribute("data-idx"));
                const label = input.closest("label");
                const original = label.innerHTML;
                label.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                try {
                    const url = await window.BoseAdminUI.uploadImageToCloudinary(file);
                    items[idx].image = url;
                    renderFixedFlowerTypeImages(containerId, items);
                } catch (err) {
                    window.BoseAdminUI.showToast("تعذر رفع الصورة", "error");
                    label.innerHTML = original;
                }
            });
        });
    }

    /* ============================= التحميل والربط ============================= */

    function fillNumberFields(prefix, obj, fields) {
        fields.forEach((f) => {
            const el = document.getElementById(`${prefix}-${f}`);
            if (el) el.value = obj[f] ?? "";
        });
    }

    function readNumberFields(prefix, fields) {
        const result = {};
        fields.forEach((f) => {
            result[f] = parseFloat(document.getElementById(`${prefix}-${f}`).value) || 0;
        });
        return result;
    }

    async function init() {
        const settings = await window.BoseAdmin.getBuilderSettings();
        cakeBuilder = settings.cake_builder || {};
        flowerBuilder = settings.flower_builder || {};

        cakeBuilder.cakeTypes = cakeBuilder.cakeTypes || [];
        cakeBuilder.printingOptions = cakeBuilder.printingOptions || [];
        cakeBuilder.shapes = cakeBuilder.shapes || [];
        cakeBuilder.persons = cakeBuilder.persons || { minimum: 4, maximum: 100, step: 2 };
        cakeBuilder.images = cakeBuilder.images || {};
        cakeBuilder.giftCard = cakeBuilder.giftCard || { enabled: true, price: 30 };
        cakeBuilder.giftCard.images = cakeBuilder.giftCard.images || [];
        cakeBuilder.referenceUpload = cakeBuilder.referenceUpload || { enabled: true, note: "" };
        cakeBuilder.portfolioGallery = cakeBuilder.portfolioGallery || [];

        flowerBuilder.flowerTypes = normalizeFixedFlowerTypes(flowerBuilder.flowerTypes);
        flowerBuilder.wrappingTypes = flowerBuilder.wrappingTypes || [];
        flowerBuilder.chocolateTypes = flowerBuilder.chocolateTypes || [];
        flowerBuilder.moneyCategories = flowerBuilder.moneyCategories || [];
        flowerBuilder.portfolioGallery = flowerBuilder.portfolioGallery || [];
        flowerBuilder.giftCardImages = flowerBuilder.giftCardImages || [];

        // تفعيل/إيقاف المحاكي
        document.getElementById("cake-enabled").checked = cakeBuilder.enabled !== false;
        document.getElementById("flower-enabled").checked = flowerBuilder.enabled !== false;

        // الأسعار الأساسية
        fillNumberFields("cake", cakeBuilder, ["basePrice", "pricePerPerson"]);
        fillNumberFields("cake-persons", cakeBuilder.persons, ["minimum", "maximum", "step"]);
        fillNumberFields("flower", flowerBuilder, [
            "basePrice", "baseFlowers", "giftCardPrice", "photoPrintPrice",
            "extraFlowerPrice", "largeChocolateMinimumPrice",
        ]);

        // كارت إهداء التورت + صورة التصميم المرجعية
        document.getElementById("cake-giftcard-enabled").checked = cakeBuilder.giftCard.enabled !== false;
        document.getElementById("cake-giftCard-price").value = cakeBuilder.giftCard.price ?? 30;
        document.getElementById("cake-replicaUpload-note").value = cakeBuilder.referenceUpload.note || "";

        // نصوص محاكي التورت
        document.getElementById("cake-text-pricingInfo").value = cakeBuilder.images.pricingInfo || "";
        document.getElementById("cake-text-squareMinimum").value = cakeBuilder.images.squareMinimum || "";
        document.getElementById("cake-text-rectangleMinimum").value = cakeBuilder.images.rectangleMinimum || "";
        document.getElementById("cake-text-rectangleUpgrade").value = cakeBuilder.images.rectangleUpgrade || "";

        // القوائم
        renderNamedList("list-cake-types", cakeBuilder.cakeTypes, { imageField: true });
        wireAddButton("add-cake-type-btn", "list-cake-types", cakeBuilder.cakeTypes, {});

        renderNamedList("list-printing-options", cakeBuilder.printingOptions, { priceField: true, imageField: true });
        wireAddButton("add-printing-option-btn", "list-printing-options", cakeBuilder.printingOptions, { priceField: true });

        renderNamedList("list-shapes", cakeBuilder.shapes, { extraField: "minimumPersons", extraLabel: "أقل عدد أفراد", imageField: true });
        wireAddButton("add-shape-btn", "list-shapes", cakeBuilder.shapes, { extraField: "minimumPersons", extraLabel: "أقل عدد أفراد" });

        // صور محاكي التورت (بانر + معرض)
        renderSingleImageSlot("cake-hero-image-slot", cakeBuilder.heroImage || "", (url) => { cakeBuilder.heroImage = url; });
        renderNamedList("list-cake-gallery", cakeBuilder.portfolioGallery, { imageField: true });
        document.getElementById("add-cake-gallery-btn").addEventListener("click", () => {
            cakeBuilder.portfolioGallery.push({ image: "", name: "" });
            renderNamedList("list-cake-gallery", cakeBuilder.portfolioGallery, { imageField: true });
        });

        // 🎁🖼️ [معرض نماذج كارت الإهداء المطبوع - محاكي التورت]: نفس آلية معرض
        // "تورت شرفت عملاءنا" بالظبط، بس مخزنة جوه cakeBuilder.giftCard.images
        // (مش على مستوى cakeBuilder نفسه) عشان تفضل مرتبطة منطقياً بإعدادات
        // كارت الإهداء نفسها.
        renderNamedList("list-cake-giftcard-gallery", cakeBuilder.giftCard.images, { imageField: true });
        document.getElementById("add-cake-giftcard-gallery-btn").addEventListener("click", () => {
            cakeBuilder.giftCard.images.push({ image: "", name: "" });
            renderNamedList("list-cake-giftcard-gallery", cakeBuilder.giftCard.images, { imageField: true });
        });

        renderFixedFlowerTypeImages("list-flower-types", flowerBuilder.flowerTypes);

        renderNamedList("list-wrapping-types", flowerBuilder.wrappingTypes, { priceField: true, imageField: true });
        wireAddButton("add-wrapping-type-btn", "list-wrapping-types", flowerBuilder.wrappingTypes, { priceField: true });

        renderNamedList("list-chocolate-types", flowerBuilder.chocolateTypes, { priceField: true });
        wireAddButton("add-chocolate-type-btn", "list-chocolate-types", flowerBuilder.chocolateTypes, { priceField: true });

        renderMoneyCategories(flowerBuilder.moneyCategories);
        document.getElementById("add-money-category-btn").addEventListener("click", () => {
            flowerBuilder.moneyCategories.push({ amount: 0, fee: 0 });
            renderMoneyCategories(flowerBuilder.moneyCategories);
        });

        // صور محاكي الورد (بانر + معرض)
        renderSingleImageSlot("flower-hero-image-slot", flowerBuilder.heroImage || "", (url) => { flowerBuilder.heroImage = url; });
        renderNamedList("list-flower-gallery", flowerBuilder.portfolioGallery, { imageField: true });
        document.getElementById("add-flower-gallery-btn").addEventListener("click", () => {
            flowerBuilder.portfolioGallery.push({ image: "", name: "" });
            renderNamedList("list-flower-gallery", flowerBuilder.portfolioGallery, { imageField: true });
        });

        // 🎁🖼️ [معرض نماذج كارت الإهداء المطبوع - محاكي الورد]: نفس فكرة معرض
        // محاكي التورت بالظبط، مخزنة هنا على مستوى flowerBuilder.giftCardImages
        // (بما إن كارت إهداء الورد أصلاً بياخد حقوله كحقول مستوية زي giftCardPrice،
        // مش object متداخل زي محاكي التورت).
        renderNamedList("list-flower-giftcard-gallery", flowerBuilder.giftCardImages, { imageField: true });
        document.getElementById("add-flower-giftcard-gallery-btn").addEventListener("click", () => {
            flowerBuilder.giftCardImages.push({ image: "", name: "" });
            renderNamedList("list-flower-giftcard-gallery", flowerBuilder.giftCardImages, { imageField: true });
        });

        document.getElementById("builders-save-btn").addEventListener("click", handleSaveAll);
        document.getElementById("builders-content").style.display = "";
        document.getElementById("builders-loading").style.display = "none";
    }

    async function handleSaveAll() {
        const saveBtn = document.getElementById("builders-save-btn");
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

        try {
            const updatedCake = {
                ...cakeBuilder,
                enabled: document.getElementById("cake-enabled").checked,
                ...readNumberFields("cake", ["basePrice", "pricePerPerson"]),
                persons: readNumberFields("cake-persons", ["minimum", "maximum", "step"]),
                images: {
                    ...cakeBuilder.images,
                    pricingInfo: document.getElementById("cake-text-pricingInfo").value.trim(),
                    squareMinimum: document.getElementById("cake-text-squareMinimum").value.trim(),
                    rectangleMinimum: document.getElementById("cake-text-rectangleMinimum").value.trim(),
                    rectangleUpgrade: document.getElementById("cake-text-rectangleUpgrade").value.trim(),
                },
                giftCard: {
                    enabled: document.getElementById("cake-giftcard-enabled").checked,
                    price: parseFloat(document.getElementById("cake-giftCard-price").value) || 0,
                    images: cakeBuilder.giftCard.images,
                },
                referenceUpload: {
                    ...cakeBuilder.referenceUpload,
                    note: document.getElementById("cake-replicaUpload-note").value.trim(),
                },
                cakeTypes: cakeBuilder.cakeTypes,
                printingOptions: cakeBuilder.printingOptions,
                shapes: cakeBuilder.shapes,
                occasions: [],
                heroImage: cakeBuilder.heroImage || "",
                portfolioGallery: cakeBuilder.portfolioGallery,
            };

            const updatedFlower = {
                ...flowerBuilder,
                enabled: document.getElementById("flower-enabled").checked,
                ...readNumberFields("flower", [
                    "basePrice", "baseFlowers", "giftCardPrice", "photoPrintPrice",
                    "extraFlowerPrice", "largeChocolateMinimumPrice",
                ]),
                flowerTypes: flowerBuilder.flowerTypes,
                wrappingTypes: flowerBuilder.wrappingTypes,
                chocolateTypes: flowerBuilder.chocolateTypes,
                moneyCategories: flowerBuilder.moneyCategories,
                heroImage: flowerBuilder.heroImage || "",
                portfolioGallery: flowerBuilder.portfolioGallery,
                giftCardImages: flowerBuilder.giftCardImages,
            };

            await window.BoseAdmin.saveBuilderSettings({ cake_builder: updatedCake, flower_builder: updatedFlower });
            cakeBuilder = updatedCake;
            flowerBuilder = updatedFlower;
            window.BoseAdminUI.showToast("تم حفظ إعدادات المحاكيات", "success");
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر حفظ الإعدادات", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ كل التغييرات';
        }
    }

    document.addEventListener("BoseAdminReady", init);
})();
