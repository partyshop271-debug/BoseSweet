/**
 * builders-page.js - منطق صفحة إعدادات المحاكيات فقط
 * =====================================================================
 * كل قوائم الاختيارات هنا (أنواع التورت، خيارات الطباعة، الأشكال، أنواع
 * الورد) شكلها واحد بالظبط (اسم + سعر اختياري + حقل
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
                ${opts.checkboxField ? `
                <label style="display:flex; align-items:center; gap:6px; font-size:12px; white-space:nowrap; flex-shrink:0;" title="${opts.checkboxLabel || ""}">
                    <input type="checkbox" data-checkbox-field="${opts.checkboxField}" ${item[opts.checkboxField] !== false ? "checked" : ""}>
                    ${opts.checkboxLabel || ""}
                </label>` : ""}
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
        if (opts.checkboxField) {
            container.querySelectorAll("[data-checkbox-field]").forEach((input) => {
                input.addEventListener("change", () => {
                    const idx = Number(input.closest("[data-idx]").getAttribute("data-idx"));
                    const field = input.getAttribute("data-checkbox-field");
                    items[idx][field] = input.checked;
                });
            });
        }
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
            if (opts.checkboxField) newItem[opts.checkboxField] = true;
            items.push(newItem);
            renderNamedList(containerId, items, opts);
        });
    }

    /* ============================= فئات الورقة النقدية (محاكي الورد - money gift card) ============================= */
    // 🗑️ [حذف حقل "رسوم الإضافة" الميت]: مفيش أي عمولة أو رسوم على أي فئة -
    // ده مؤكد في نص الشرح اللي بيشوفه العميل في المحاكي نفسه (ⓘ خطوة الكاش).
    // الحقل ده كان موجود بس مالوش أي استخدام حقيقي في محاكي الورد.
    function renderMoneyCategories(items) {
        const container = document.getElementById("list-money-categories");
        container.innerHTML = items.map((item, idx) => `
            <div class="adm-curated-item" data-idx="${idx}">
                <input type="number" class="adm-input" style="flex:1;" data-field="amount" value="${item.amount ?? 0}" placeholder="فئة الورقة (ج.م) - مثال: 50">
                <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="remove" title="حذف">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>`).join("") || `<p class="adm-order-item-meta" style="padding: 4px 2px;">مفيش فئات مضافة لسه.</p>`;

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

    /* ============================= المعلومات الدوّارة (شريط 💡 لكل محاكي) =============================
       نفس فكرة قائمة رسائل الشريط العلوي (topbar) بالظبط - عنوان + نص + إعادة
       ترتيب بالأسهم + حذف، بالإضافة لصف اقتراحات جاهزة (chips) تضيف
       المعلومة المقترحة بضغطة واحدة بدل ما الأدمن تكتب من الصفر. عاملة كـ
       factory عشان تخدم محاكي التورت ومحاكي الورد من نفس الكود بالظبط. */

    // 💡 [نفس المعلومات الافتراضية بالحرف المستخدمة في js/cake-engine.js و
    // js/flower-engine.js]: لو الأدمن ما عدّلش حاجة، دي نفس المعلومات اللي
    // العميلة شايفاها فعلاً في المحاكي (fallback)، وهي كمان مصدر الاقتراحات
    // الجاهزة هنا - لازم تتحدّث في المكانين مع بعض لو المحتوى الافتراضي اتغيّر.
    const CAKE_TIP_SUGGESTIONS = [
        { title: "تحضير فريش 100% 🎂", text: "كل تورتة بنبدأ تحضيرها بعد تأكيد طلبك مباشرة - مفيش تورت جاهز مخزّن من قبل." },
        { title: "التصميم قريب من الصورة", text: "لو رفعتي صورة تصميم عجباكِ، بنحاول نقرب منها قد الإمكان مع مراعاة إن التنفيذ اليدوي ممكن يختلف شوية." },
        { title: "ليه في أقل عدد أفراد لكل شكل؟", text: "كل شكل تورتة ليه أقل عدد أفراد مناسب له عشان الشكل النهائي يطلع متوازن ومحترف بصرياً." },
        { title: "كارت إهداء بخط شيك 🎁", text: "تقدري تضيفي كارت إهداء مكتوب بخط شيك بسعر بسيط - لمسة صغيرة بتفرق كتير في الإحساس." },
        { title: "الدفعة المقدمة", text: "تقدري تأكدي طلبك بدفعة مقدمة أو الدفع كامل، والباقي بيتحصّل عند الاستلام." },
        { title: "تأكيد سريع على واتساب ✅", text: "بعد إضافة التورتة للسلة، هيتفتح واتساب تلقائي بكل تفاصيل طلبك عشان فريقنا يأكد عليه بسرعة." },
        { title: "التعديل من غير خسارة", text: "تقدري ترجعي لأي خطوة فاتت وتعدلي فيها براحتك بالضغط على رقمها فوق - وباقي اختياراتك بتفضل زي ما هي." },
        { title: "جودة المكونات", text: "بنستخدم مكونات مختارة بعناية عشان الطعم يكون في نفس مستوى جمال الشكل." },
        { title: "السعر قدامك أول بأول 💰", text: "هتشوفي السعر بيتحدث لحظياً مع كل اختيار تعمليه، من غير أي مفاجآت في الآخر." },
        { title: "آراء عميلاتنا", text: "قبل ما تأكدي، تقدري تشوفي تقييمات حقيقية من عميلات جربوا نفس تجربة التصميم قبل كده." },
    ];
    const FLOWER_TIP_SUGGESTIONS = [
        { title: "ورد طازة حسب الطلب 🌸", text: "الورد الطبيعي بيوصلنا من المزرعة وبيتنسق بعد تأكيد طلبك مباشرة - مش باقة جاهزة مخزّنة." },
        { title: "إيه الفرق بين الأنواع؟", text: "الورد الصناعي والستان بيحافظوا على شكلهم لفترة أطول من الطبيعي، وممكن يفضلوا كذكرى تحتفظي بيها." },
        { title: "التغليف مجاني دايماً 🎀", text: "التغليف الكلاسيك الفاخر جزء أساسي من كل باقة من غير أي تكلفة إضافية - مهما كان نوع الورد أو عدده." },
        { title: "مفاجآت جوه الباقة", text: "تقدري تضيفي كاش أو شوكولاتة فاخرة جوه الباقة، وبيوصل بالمبلغ أو الميزانية اللي تحدديها بالظبط من غير أي رسوم زيادة." },
        { title: "صور شخصية تذكارية 📸", text: "تقدري تطبعي صور شخصية وترتبيها جوه الباقة - لمسة بتحول الهدية للحظة تفضل شكلها في الدماغ." },
        { title: "كارت إهداء بخط شيك", text: "كلمة صغيرة على كارت أو شريط الستان بتخلي الباقة تحس إنها مكتوبة خصيصي لحد معين." },
        { title: "ليه بنبدأ من 15 وردة؟", text: "أقل عدد بنشتغل بيه 15 وردة عشان ده أقل حد يدّي شكل تنسيق فخم ومليان بصرياً، مش متباعد." },
        { title: "السعر قدامك أول بأول 💰", text: "هتشوفي السعر بيتحدث لحظياً مع كل اختيار تعمليه، من غير أي مفاجآت في الآخر." },
        { title: "تأكيد سريع على واتساب ✅", text: "بعد إضافة الباقة للسلة، هيتفتح واتساب تلقائي بكل تفاصيل طلبك عشان فريقنا يأكد عليه بسرعة." },
        { title: "التعديل من غير خسارة", text: "تقدري ترجعي لأي خطوة فاتت وتعدلي فيها براحتك بالضغط على رقمها فوق - وباقي اختياراتك بتفضل زي ما هي." },
    ];

    function createTipsListController(listContainerId, suggestionsContainerId, items, suggestionPool) {
        const e = window.BoseAdminUI.escapeHtml;

        function render() {
            const listEl = document.getElementById(listContainerId);
            listEl.innerHTML = items.map((item, idx) => `
                <div class="adm-curated-item" data-idx="${idx}" style="flex-direction:column; align-items:stretch; gap:8px;">
                    <div style="display:flex; gap:8px; align-items:center;">
                        <input type="text" class="adm-input" style="flex:1;" data-field="title" value="${e(item.title || "")}" placeholder="عنوان المعلومة">
                        <div class="adm-curated-item-actions">
                            <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="up" title="لأعلى" ${idx === 0 ? "disabled" : ""}><i class="fa-solid fa-arrow-up"></i></button>
                            <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="down" title="لأسفل" ${idx === items.length - 1 ? "disabled" : ""}><i class="fa-solid fa-arrow-down"></i></button>
                            <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="remove" title="حذف"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                    <textarea class="adm-input" style="width:100%; min-height:56px;" data-field="text" placeholder="النص التفصيلي">${e(item.text || "")}</textarea>
                </div>`).join("") || `<p class="adm-order-item-meta" style="padding: 4px 2px;">مفيش معلومات مضافة لسه - استخدمي الاقتراحات تحت أو أضيفي معلومتك بنفسك.</p>`;

            listEl.querySelectorAll("[data-field]").forEach((input) => {
                input.addEventListener("input", () => {
                    const idx = Number(input.closest("[data-idx]").getAttribute("data-idx"));
                    items[idx][input.getAttribute("data-field")] = input.value;
                });
            });
            listEl.querySelectorAll("[data-action]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const idx = Number(btn.closest("[data-idx]").getAttribute("data-idx"));
                    const action = btn.getAttribute("data-action");
                    if (action === "remove") items.splice(idx, 1);
                    else if (action === "up" && idx > 0) [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
                    else if (action === "down" && idx < items.length - 1) [items[idx + 1], items[idx]] = [items[idx], items[idx + 1]];
                    render();
                });
            });

            renderSuggestions();
        }

        function renderSuggestions() {
            const container = document.getElementById(suggestionsContainerId);
            container.innerHTML = suggestionPool.map((tip) => {
                const alreadyAdded = items.some((it) => it.title === tip.title);
                return `<button type="button" class="adm-suggestion-chip" data-suggestion-title="${e(tip.title)}" ${alreadyAdded ? "disabled" : ""}>
                    ${alreadyAdded ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i>'} ${e(tip.title)}
                </button>`;
            }).join("");
            container.querySelectorAll("[data-suggestion-title]").forEach((chip) => {
                chip.addEventListener("click", () => {
                    const title = chip.getAttribute("data-suggestion-title");
                    const tip = suggestionPool.find((t) => t.title === title);
                    if (!tip || items.some((it) => it.title === tip.title)) return;
                    items.push({ title: tip.title, text: tip.text });
                    render();
                });
            });
        }

        function addManual(title, text) {
            const trimmedTitle = (title || "").trim();
            const trimmedText = (text || "").trim();
            if (!trimmedTitle || !trimmedText) {
                window.BoseAdminUI.showToast("لازم تكتبي عنوان ونص المعلومة الاتنين", "error");
                return false;
            }
            items.push({ title: trimmedTitle, text: trimmedText });
            render();
            return true;
        }

        return { render, addManual };
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
        cakeBuilder.infoCarouselTips = Array.isArray(cakeBuilder.infoCarouselTips) ? cakeBuilder.infoCarouselTips : [];

        flowerBuilder.flowerTypes = flowerBuilder.flowerTypes || [];
        flowerBuilder.moneyCategories = flowerBuilder.moneyCategories || [];
        flowerBuilder.portfolioGallery = flowerBuilder.portfolioGallery || [];
        flowerBuilder.giftCardImages = flowerBuilder.giftCardImages || [];
        flowerBuilder.infoCarouselTips = Array.isArray(flowerBuilder.infoCarouselTips) ? flowerBuilder.infoCarouselTips : [];
        // 💰👑 [حقل جديد]: أول مرة يتفتح فيها هذا الحقل (لسه ماتحفظش قبل كده)،
        // بنعرض نفس القيمة الاحتياطية (50) المستخدمة فعلياً في flower-engine.js
        // و core-engine.js، بدل ما تشوف الأدمن خانة فاضية وتفتكر إن السعر صفر.
        if (flowerBuilder.satinRibbonPrice === undefined || flowerBuilder.satinRibbonPrice === null) {
            flowerBuilder.satinRibbonPrice = 50;
        }

        // تفعيل/إيقاف المحاكي
        document.getElementById("cake-enabled").checked = cakeBuilder.enabled !== false;
        document.getElementById("flower-enabled").checked = flowerBuilder.enabled !== false;

        // الأسعار الأساسية
        fillNumberFields("cake", cakeBuilder, ["basePrice", "pricePerPerson"]);
        fillNumberFields("cake-persons", cakeBuilder.persons, ["minimum", "maximum", "step"]);
        fillNumberFields("flower", flowerBuilder, [
            "basePrice", "baseFlowers", "giftCardPrice", "photoPrintPrice",
            "extraFlowerPrice", "satinRibbonPrice",
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
        // 🐛👑 [إصلاح: اختفاء الصور بعد "إضافة نوع"]: كل زوج render/wireAddButton
        // كان بياخد كائن opts مكتوب مرتين (مرة للعرض، مرة تانية ناقصة لزرار
        // الإضافة) - أي حقل يتنسى في نسخة الزرار (زي imageField أو checkboxLabel)
        // كان بيختفي من الصف كله بعد أول ضغطة "إضافة" لأن wireAddButton بيعيد
        // الرسم بنفس الـ opts الناقصة اللي اتبعتله. الحل: كائن opts واحد مشترك
        // لكل قائمة، يتبعت لنفس الاتنين، فمفيش احتمال يتنسى حقل في نسخة وينسي
        // في التانية.
        const cakeTypesOpts = { imageField: true };
        renderNamedList("list-cake-types", cakeBuilder.cakeTypes, cakeTypesOpts);
        wireAddButton("add-cake-type-btn", "list-cake-types", cakeBuilder.cakeTypes, cakeTypesOpts);

        const printingOptionsOpts = { priceField: true, imageField: true };
        renderNamedList("list-printing-options", cakeBuilder.printingOptions, printingOptionsOpts);
        wireAddButton("add-printing-option-btn", "list-printing-options", cakeBuilder.printingOptions, printingOptionsOpts);

        const shapesOpts = { extraField: "minimumPersons", extraLabel: "أقل عدد أفراد", imageField: true };
        renderNamedList("list-shapes", cakeBuilder.shapes, shapesOpts);
        wireAddButton("add-shape-btn", "list-shapes", cakeBuilder.shapes, shapesOpts);

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

        // 💡 [المعلومات الدوّارة - محاكي التورت]
        const cakeTipsController = createTipsListController("list-cake-info-tips", "cake-tip-suggestions", cakeBuilder.infoCarouselTips, CAKE_TIP_SUGGESTIONS);
        cakeTipsController.render();
        document.getElementById("cake-add-tip-btn").addEventListener("click", () => {
            const titleInput = document.getElementById("cake-new-tip-title");
            const textInput = document.getElementById("cake-new-tip-text");
            if (cakeTipsController.addManual(titleInput.value, textInput.value)) {
                titleInput.value = "";
                textInput.value = "";
            }
        });

        // 🌸👑 [ذكاء الخطوة رقم 3 - عدد الورد]: كل نوع دلوقتي معاه سعر ثابت
        // اختياري + مفتاح "بيتحسب بعدد الورد؟". لو اتشال التفعيل (يعني نوع
        // زي بوكيه فراشات/كاش/شوكولاتة مقفول مش هيتغير عدده)، محاكي الورد
        // هيتخطى خطوة "كام وردة؟" تلقائياً ويحسب السعر من السعر الثابت هنا
        // بدل معادلة الورد الإضافي - راجع flower-engine.js (usesFlowerCount).
        const flowerTypesOpts = {
            imageField: true,
            priceField: true,
            checkboxField: "usesFlowerCount",
            checkboxLabel: "بيتحسب بعدد الورد",
        };
        renderNamedList("list-flower-types", flowerBuilder.flowerTypes, flowerTypesOpts);
        wireAddButton("add-flower-type-btn", "list-flower-types", flowerBuilder.flowerTypes, flowerTypesOpts);

        renderMoneyCategories(flowerBuilder.moneyCategories);
        document.getElementById("add-money-category-btn").addEventListener("click", () => {
            flowerBuilder.moneyCategories.push({ amount: 0 });
            renderMoneyCategories(flowerBuilder.moneyCategories);
        });

        // 💡 [المعلومات الدوّارة - محاكي الورد]
        const flowerTipsController = createTipsListController("list-flower-info-tips", "flower-tip-suggestions", flowerBuilder.infoCarouselTips, FLOWER_TIP_SUGGESTIONS);
        flowerTipsController.render();
        document.getElementById("flower-add-tip-btn").addEventListener("click", () => {
            const titleInput = document.getElementById("flower-new-tip-title");
            const textInput = document.getElementById("flower-new-tip-text");
            if (flowerTipsController.addManual(titleInput.value, textInput.value)) {
                titleInput.value = "";
                textInput.value = "";
            }
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
                infoCarouselTips: cakeBuilder.infoCarouselTips,
            };

            const updatedFlower = {
                ...flowerBuilder,
                enabled: document.getElementById("flower-enabled").checked,
                ...readNumberFields("flower", [
                    "basePrice", "baseFlowers", "giftCardPrice", "photoPrintPrice",
                    "extraFlowerPrice", "satinRibbonPrice",
                ]),
                flowerTypes: flowerBuilder.flowerTypes,
                moneyCategories: flowerBuilder.moneyCategories,
                heroImage: flowerBuilder.heroImage || "",
                portfolioGallery: flowerBuilder.portfolioGallery,
                giftCardImages: flowerBuilder.giftCardImages,
                infoCarouselTips: flowerBuilder.infoCarouselTips,
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
