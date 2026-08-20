/**
 * 👑 محرك محاكي بوكيهات الورد والملحقات التفاعلي المطور - حلويات بوسي 👑
 * النسخة الهندسية القياسية الكاملة والمعزولة كلياً - النسخة V3.0 فائقة الأداء وتوفير البيانات.
 * التوافق: يلتزم بمهام محاكي الورد فقط ولا يتدخل بأي ملف آخر، ويتكامل بأمان مع البيئة المحلية.
 */

(function () {
    "use strict";

    // مفاتيح التخزين الموحدة لعلامة بوسي الفاخرة لضمان التزامن المطلق
    const CART_STORAGE_KEY = 'bose_cart';
    const FLOWER_STATE_STORAGE_KEY = 'bose_flower_builder_state';
    const BASE64_IMAGE_SESSION_KEY = 'bose_active_base64_image_session';

    // ذاكرة احتياطية لضمان استقرار التصفح الخفي (Incognito Mode Fallback)
    let flowerStateMemoryFallback = {};
    let activeBase64ImageInMemory = "";

    try {
        activeBase64ImageInMemory = sessionStorage.getItem(BASE64_IMAGE_SESSION_KEY) || "";
    } catch (e) {
        console.warn("⚠️ الـ sessionStorage غير متاح في المتصفح الحالي.");
    }

    // الإعدادات الافتراضية الصارمة للأسعار تماشياً مع الوثيقة القياسية لحلويات بوسي
    let flowerConfig = {
        basePrice: 400,
        baseFlowers: 15,
        extraFlowerPrice: 35,
        photoPrintPrice: 15,
        // 💰👑 [توحيد سعر كارت الإهداء مع محاكي التورت]: كان 20 جنيه هنا مقابل
        // 30 جنيه في محاكي التورت لنفس بالظبط الخدمة (كارت ورقي فاخر بكلام
        // مكتوب) - وحدنا القيمة الافتراضية هنا لتبقى 30 زي محاكي التورت بالظبط.
        // لو فيه قيمة مُعدّة من لوحة التحكم (fbConfig.giftCardPrice) هي هتفضل
        // الأولوية زي ما كانت (شوف تحت في applyRemoteFlowerConfig).
        giftCardPrice: 30,
        satinRibbonPrice: 50
    };

    // 🌸👑 [أنواع ورد افتراضية]: تُستخدم فقط لو الأدمن لسه ما ضافش أي نوع من
    // لوحة التحكم (list-flower-types) - عشان الموقع ميفضلش من غير أي خيار
    // ظاهر للعميلة أبداً. بمجرد ما الأدمن يضيف نوع واحد على الأقل، القائمة
    // دي بتتجاهل خالص وبيتعرض بس اللي الأدمن ضافه/رتبه بلوحة التحكم.
    const DEFAULT_FLOWER_TYPES = [
        { id: "natural", name: "ورد طبيعي نضر", icon: "🌸", description: "ورد طازج ونضر، بيوصل مباشرة من أفضل مزارع الورد." },
        { id: "artificial", name: "ورد صناعي فاخر", icon: "✨", description: "خامة فاخرة تحافظ على شكلها ورونقها لفترة أطول بكتير." },
        { id: "satin", name: "ورد ستان راقٍ", icon: "🎀", description: "لمسة ستان ناعمة وراقية تدي إحساس مختلف تماماً." }
    ];

    // 🌸👑 [مصدر الحقيقة الحالي لأنواع الورد]: بتتحدد فور تحميل إعدادات
    // المتجر (إما قائمة الأدمن الحقيقية أو DEFAULT_FLOWER_TYPES كاحتياطي)،
    // وكل مكان تاني في الملف (الملخص، مشاركة التصميم، إضافة للسلة، الملاحظة
    // الحسية) بيرجع لنفس القائمة دي بدل أي قيم مكتوبة يدوياً متفرقة.
    let currentFlowerTypesList = DEFAULT_FLOWER_TYPES;

    function getFlowerTypeById(id) {
        return currentFlowerTypesList.find((t) => t && t.id === id) || null;
    }
    function getFlowerTypeName(id) {
        const t = getFlowerTypeById(id);
        return t ? t.name : (id || "");
    }

    // الحالة الديناميكية الحالية لرحلة العميل داخل المحاكي
    let state = {
        currentActiveStep: 1,
        // 🗑️👑 [حذف خطوة "لنفسي/هدية"]: بنفس فلسفة محاكي التورت V6.0. باقي
        // الخطوات اتقسّمت لخطوة قرار واحد لكل خطوة (كانت 5 خطوات مجمّعة، بقت
        // 9 خطوات قرار + خطوة خلاصة أخيرة = 10 بالظبط).
        totalSteps: 10,
        flowerType: "natural",
        flowerCount: 15,
        includeRibbonText: false,
        ribbonText: "",
        includePhoto: false,
        photoCount: 1,
        photoUrl: "",
        includeCash: false,
        moneyAmount: 0,
        moneyCategoryAmount: 0,
        includeChocolate: false,
        chocolateBudget: 0,
        includeCard: false,
        cardText: "",
        totalPrice: 400,
        isUploading: false
    };

    // عناصر واجهة الـ DOM الخاصة بمحاكي الورد
    let flowerCountInput, includePhotoCheckbox, photoFileInput, photoPreviewContainer, photoPreviewImg;
    let includeCardCheckbox, cardTextInput, moneyCategorySelect, bouquetTotalVal, addToCartBtn;
    let includeRibbonTextCheckbox, ribbonTextSection, ribbonTextInput, ribbonStepPriceDisplay;
    let includeCashCheckbox, cashMasterBlock, cashIntegrationCounterBlock, moneyAmountDisplay;
    let includeChocolateCheckbox, chocolateBudgetMasterBlock, chocolateBudgetDisplay;
    let photoCountInput, dynamicAddonsArea, embeddedPriceDisplay, bosePhotosPriceDisplay, boseCardPriceDisplay;
    let btnNext, btnPrev, stepsPanels, stepsIndicators, iconicBtns, hiddenTypeInput, heroEl, introEl;

    /**
     * 🛡️ حفظ وتأمين الحالة التفاعلية الحالية للعميل منعاً لفقد الخيارات
     */
    function saveCurrentState() {
        try {
            const tempState = { ...state };
            if (tempState.photoUrl && tempState.photoUrl.startsWith('data:image/')) {
                activeBase64ImageInMemory = tempState.photoUrl;
                tempState.photoUrl = "base64-stored-in-memory";
                try {
                    sessionStorage.setItem(BASE64_IMAGE_SESSION_KEY, activeBase64ImageInMemory);
                } catch (ex) {}
            }
            localStorage.setItem(FLOWER_STATE_STORAGE_KEY, JSON.stringify(tempState));
        } catch (err) {
            flowerStateMemoryFallback[FLOWER_STATE_STORAGE_KEY] = JSON.stringify(state);
        }
    }

    /**
     * 🧠👑 [الخطوة الذكية - عدد الورد]: نوع الباقة هو اللي بيقرر هل خطوة "كام
     * وردة؟" تظهر أصلاً ولا لأ. أي نوع باقة من لوحة التحكم معاه usesFlowerCount
     * = false (يعني نوع زي بوكيه فراشات/بوكيه صور/بوكيه فلوس مقفول مش بيتغير
     * عدده) بيخلي الخطوة دي تتخطى تلقائياً، والسعر بيتحسب من السعر الثابت
     * المسجل على النوع نفسه بدل معادلة "سعر أساسي + سعر الوردة الإضافية".
     */
    const FLOWER_COUNT_STEP = 3;
    function typeUsesFlowerCount() {
        const t = getFlowerTypeById(state.flowerType);
        return !t || t.usesFlowerCount !== false;
    }

    /**
     * 🧮 محرك الفحص المالي لأسعار البوكيه - مطور كلياً لمنع تحميل ميزانية الكاش أو الشوكولاتة أي رسوم
     */
    function recalculatePrice() {
        const usesCount = typeUsesFlowerCount();
        let extraFlowers = Math.max(0, state.flowerCount - flowerConfig.baseFlowers);
        let bouquetBaseCost;
        if (usesCount) {
            bouquetBaseCost = flowerConfig.basePrice + (extraFlowers * flowerConfig.extraFlowerPrice);
        } else {
            // نوع باقة بسعر ثابت (زي بوكيه فراشات/صور) - بناخد السعر المسجل
            // له في لوحة التحكم، وإلا السعر الأساسي العام كاحتياطي.
            const typeItem = getFlowerTypeById(state.flowerType);
            bouquetBaseCost = (typeItem && typeItem.price > 0) ? typeItem.price : flowerConfig.basePrice;
        }
        let extraCost = usesCount ? (extraFlowers * flowerConfig.extraFlowerPrice) : 0;
        let ribbonCost = state.includeRibbonText ? flowerConfig.satinRibbonPrice : 0;
        let photoCost = state.includePhoto ? (state.photoCount * flowerConfig.photoPrintPrice) : 0;
        let cardCost = (state.includeCard && state.cardText.trim() !== "") ? flowerConfig.giftCardPrice : 0;

        // 1. حساب تكلفة الخدمة والتنسيق القابلة لزيادة السعر الرسمية
        let servicePrice = bouquetBaseCost + ribbonCost + photoCost + cardCost;

        // استدعاء دالة الزيادة الرسمية من المحرك المركزي الموحد لتوحيد السياسة المالية للموقع إن وجدت
        let finalServicePrice = window.calculateBosePrice ? window.calculateBosePrice(servicePrice, "menu-only") : servicePrice;

        // 2. الكاش والشوكولاتة تُحسب كقيم صافية 100% بدون أي رسوم معالجة لثقة العميل
        // 🛡️ [إصلاح مالي]: القيمة المخزنة في state.totalPrice (اللي بتتحط في finalPrice
        // بالسلة) بتفضل بكسورها العشرية الكاملة بدون تقريب مبكر، والتقريب الوحيد
        // المسموح بيه بيتطبق على مستوى العرض بالواجهة فقط، تماشياً مع القاعدة المالية
        // الصارمة بعدم تقريب أي سعر فردي أو مخصص، والتقريب مرة واحدة على الإجمالي الكلي.
        let total = finalServicePrice + state.moneyAmount + state.chocolateBudget;
        state.totalPrice = total;

        if (bouquetTotalVal) {
            bouquetTotalVal.textContent = `${Math.round(total)} جنيه`;
        }

        // تحديث نص السعر التوضيحي بداخل كارت الخطوة الأولى (خطوة "كام وردة؟"
        // بس - مش هتظهر أصلاً لو النوع مش بيتحسب بعدد الورد)
        if (embeddedPriceDisplay) {
            const currentCountCost = flowerConfig.basePrice + (extraFlowers * flowerConfig.extraFlowerPrice);
            let finalCountCost = window.calculateBosePrice ? window.calculateBosePrice(currentCountCost, "menu-only") : currentCountCost;
            embeddedPriceDisplay.innerHTML = `سعر هذا البوكيه الذي يحتوي على ${state.flowerCount} وردة هو <span>${Math.round(finalCountCost)} جنيه</span>`;
        }

        // تحديث سعر شريط الستان
        if (ribbonStepPriceDisplay) {
            ribbonStepPriceDisplay.innerHTML = `سعر إضافة شريط الستان المطبوع حرارياً هو <span>${flowerConfig.satinRibbonPrice} جنيه</span>`;
        }

        // تحديث سعر الصور الشخصية
        if (bosePhotosPriceDisplay) {
            bosePhotosPriceDisplay.style.display = state.includePhoto ? "block" : "none";
            if (state.includePhoto) {
                bosePhotosPriceDisplay.innerHTML = `<p class="bose-embedded-price-text">سعر طباعة وتنسيق الصور الشخصية (${state.photoCount} صورة) هو <span>${photoCost} جنيه</span></p>`;
            }
        }

        // تحديث سعر كارت الإهداء
        if (boseCardPriceDisplay) {
            boseCardPriceDisplay.style.display = state.includeCard ? "block" : "none";
        }

        // رندرة الفاتورة الجانبية بتنسيق فاخر صريح وواضح للعين
        if (dynamicAddonsArea) {
            let html = "";
            if (extraFlowers > 0) {
                html += `<div class="bose-invoice-addon-row"><span>الورد الإضافي (${extraFlowers} وردة):</span><span>+ ${extraCost} جنيه</span></div>`;
            }
            if (ribbonCost > 0) {
                html += `<div class="bose-invoice-addon-row"><span>شريط ستان بكلام مخصوص:</span><span>+ ${flowerConfig.satinRibbonPrice} جنيه</span></div>`;
            }
            if (photoCost > 0) {
                html += `<div class="bose-invoice-addon-row"><span>الصور الشخصية المترتبة (${state.photoCount}):</span><span>+ ${photoCost} جنيه</span></div>`;
            }
            if (cardCost > 0) {
                html += `<div class="bose-invoice-addon-row"><span>كارت إهداء شيك مكتوب:</span><span>+ ${flowerConfig.giftCardPrice} جنيه</span></div>`;
            }
            if (state.moneyAmount > 0) {
                const denomLabel = state.moneyCategoryAmount > 0 ? ` (فئة ${state.moneyCategoryAmount} جنيه)` : "";
                html += `<div class="bose-invoice-addon-row"><span>فلوس كاش جوه الباقة${denomLabel}:</span><span>+ ${state.moneyAmount} جنيه</span></div>`;
            }
            if (state.chocolateBudget > 0) {
                html += `<div class="bose-invoice-addon-row"><span>ميزانية الشوكولاتة الفخمة:</span><span>+ ${state.chocolateBudget} جنيه</span></div>`;
            }
            dynamicAddonsArea.innerHTML = html;
        }
    }

    /**
     * 📋👑 [خطوة الخلاصة]: بترسم ملخص كل اختيار اتخد في الخطوات السابقة، كل
     * سطر معاه رابط "تعديل" بيرجع العميلة لنفس الخطوة تحدثها. بنفس فلسفة
     * "كل حاجة ظاهرة قدام العميل من غير ما يحتاج يدور عليها" المتبعة في باقي
     * الموقع - العميلة تتأكد من كل تفاصيل طلبها في مكان واحد قبل ما تضيفه للسلة.
     */
    /* 🧾👑 [سمتريه محاكي التورت]: نفس تنسيق "مراجعة السعر بالمفردات" بالحرف
       المستخدم في renderOrderSummary بمحاكي التورت (price-item-row لكل سطر +
       سطر إجمالي بارز) بدل التنسيق القديم المختلف (bose-order-summary-row).
       التعديل بقى بالضغط على رقم الخطوة فوق (bose-progress-node) بدل زرار
       "تعديل" منفصل جوه كل سطر - نفس فلسفة محاكي التورت بالظبط. */
    function renderFlowerSummary() {
        const list = document.getElementById("flower-summary-list");
        if (!list) return;

        const esc = window.escapeBoseHTML || (s => s);
        const extraFlowers = Math.max(0, state.flowerCount - flowerConfig.baseFlowers);

        const rows = [];
        const addRow = (label, value) => {
            rows.push(`<div class="price-item-row"><span>${esc(label)}:</span><span class="item-value">${esc(value)}</span></div>`);
        };

        if (typeUsesFlowerCount()) {
            addRow(`بوكيه ${getFlowerTypeName(state.flowerType)} (${state.flowerCount} وردة)`, `${Math.round(flowerConfig.basePrice + extraFlowers * flowerConfig.extraFlowerPrice)} جنيه`);
        } else {
            const typeItem = getFlowerTypeById(state.flowerType);
            const flatPrice = (typeItem && typeItem.price > 0) ? typeItem.price : flowerConfig.basePrice;
            addRow(`${getFlowerTypeName(state.flowerType)}`, `${Math.round(flatPrice)} جنيه`);
        }
        if (state.includeRibbonText && state.ribbonText.trim() !== "") {
            addRow("شريط ستان مطبوع", `+ ${flowerConfig.satinRibbonPrice} جنيه`);
        }
        if (state.includePhoto) {
            addRow(`صور شخصية داخل الباقة (${state.photoCount})`, `+ ${state.photoCount * flowerConfig.photoPrintPrice} جنيه`);
        }
        if (state.includeCard && state.cardText.trim() !== "") {
            addRow("كارت إهداء مطبوع", `+ ${flowerConfig.giftCardPrice} جنيه`);
        }
        if (state.includeCash && state.moneyAmount > 0) {
            const denomLabel = state.moneyCategoryAmount > 0 ? ` (فئة ${state.moneyCategoryAmount} جنيه)` : "";
            addRow(`فلوس كاش جوه الباقة${denomLabel}`, `${state.moneyAmount} جنيه`);
        }
        if (state.includeChocolate && state.chocolateBudget > 0) {
            addRow("ميزانية شوكولاتة فاخرة", `${state.chocolateBudget} جنيه`);
        }

        list.innerHTML = rows.join("");
    }

    /**
     * 🗺️ حارس التحكم وتوجيه خطوات الـ Stepper ذكياً
     */
    function updateActiveStepUI() {
        // 🧠👑 [حارس أمان لخطوة "كام وردة؟" الذكية]: لو بأي شكل (تغيير نوع
        // الباقة وإحنا واقفين في الخطوة دي، أو استرجاع حالة محفوظة قديمة)
        // العميلة لقت نفسها في خطوة العدد وهي مش منطقية لنوع الباقة الحالي،
        // بننقلها تلقائياً للخطوة اللي بعدها.
        if (state.currentActiveStep === FLOWER_COUNT_STEP && !typeUsesFlowerCount()) {
            state.currentActiveStep = FLOWER_COUNT_STEP + 1;
        }
        // 👑 [سمتريه محاكي التورت]: نفس منطق panel-wizard-step-N / node-step-N
        // بالحرف، بدل ما تكون كل خطوة بتتحدد بـ data-step على العنصر نفسه.
        for (let i = 1; i <= state.totalSteps; i++) {
            const panel = document.getElementById(`panel-wizard-step-${i}`);
            const node = document.getElementById(`node-step-${i}`);
            if (panel) panel.classList.remove('active-panel');
            if (node) {
                node.classList.remove('active', 'done', 'skipped');
                if (i === FLOWER_COUNT_STEP && !typeUsesFlowerCount()) node.classList.add('skipped');
                if (i === state.currentActiveStep) node.classList.add('active');
                else if (i < state.currentActiveStep) node.classList.add('done');
            }
        }
        const activePanelToShow = document.getElementById(`panel-wizard-step-${state.currentActiveStep}`);
        if (activePanelToShow) activePanelToShow.classList.add('active-panel');

        // 🛡️ [سمتريه محاكي التورت]: زرار "السابق" بيتعطّل (disabled) بدل ما
        // يختفي تماماً في خطوة 1 - نفس سلوك محاكي التورت بالظبط.
        if (btnPrev) btnPrev.disabled = (state.currentActiveStep === 1);

        if (state.currentActiveStep === state.totalSteps) {
            if (btnNext) btnNext.style.display = "none";
            // 📋 [خطوة الخلاصة]: بنعيد رسم ملخص الاختيارات في كل مرة العميلة توصل
            // للخطوة الأخيرة، عشان يفضل مطابق لآخر تعديل عملته في أي خطوة سابقة.
            renderFlowerSummary();
        } else {
            if (btnNext) btnNext.style.display = "block";
        }

        // 🧭👑 [سمتريه محاكي التورت]: نفس آلية إخفاء الهيرو والمقدمة بعد
        // الخطوة الأولى بالظبط (toggleHeroVisibilityForStep في cake-engine.js).
        const shouldCollapseHero = state.currentActiveStep !== 1;
        if (heroEl) heroEl.classList.toggle('bose-collapsed-hero', shouldCollapseHero);
        if (introEl) introEl.classList.toggle('bose-collapsed-hero', shouldCollapseHero);

        // إبقاء الرقم النشط ظاهر جوه شريط الخطوات القابل للسكرول الأفقي
        const activeNode = document.getElementById(`node-step-${state.currentActiveStep}`);
        if (activeNode && typeof activeNode.scrollIntoView === 'function') {
            activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }

        // 🛡️ [تمرير تلقائي لبداية بطاقة الخطوات]: نفس آلية محاكي التورت
        // بالظبط - بيمرر لبداية .bose-simulator-layout بارتفاع الهيدر الثابت مطروح منه.
        const scrollTarget = document.querySelector('.bose-simulator-layout');
        if (scrollTarget) {
            const stickyHeaderOffset = 90;
            const targetY = scrollTarget.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset;
            window.scrollTo({ top: Math.max(targetY, 0), behavior: 'smooth' });
        }
    }

    /**
     * 🖼️ محرك ضغط وتطهير ملفات الصور لحفظ المعالجة وتوفير 80% من بيانات الموبايل
     */
    function compressImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // تحجيم ذكي ومناسب لشاشات العرض بدون إهدار للبيانات
                    if (width > 600) {
                        height = Math.round((height * 600) / width);
                        width = 600;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.drawImage(img, 0, 0, width, height);

                    // تصدير الصورة بجودة مضغوطة ذكية للغاية
                    canvas.toBlob((blob) => {
                        blob ? resolve(blob) : reject();
                    }, 'image/jpeg', 0.65);
                };
            };
        });
    }

    async function uploadReferenceImage(file) {
        if (!file) return;
        state.isUploading = true;
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = "بنجيب لكِ أعلى جودة للصورة...";
        }

        try {
            // ضغط الصورة على جهاز العميل أولاً قبل عملية الرفع
            const compressedBlob = await compressImageFile(file);
            const cloudName = window.BoseStoreData?.store?.cloudinaryCloudName || 'dyx4w0dr1';
            const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

            const formData = new FormData();
            formData.append('file', compressedBlob, 'flower_compressed.jpg');
            // 🚨🚨 [إصلاح جذري حرج - نفس سبب فشل الرفع في محاكي التورت بالظبط]:
            // "ml_default" مش preset حقيقي مفعّل على حساب Cloudinary بتاعنا. استخدمنا
            // نفس الـ preset الحقيقي الشغال فعلياً في لوحة التحكم: "gct8i28h".
            formData.append('upload_preset', 'gct8i28h');

            const res = await fetch(endpoint, { method: 'POST', body: formData });
            const resData = await res.json();

            if (resData && resData.secure_url) {
                state.photoUrl = resData.secure_url;
                if (photoPreviewImg) photoPreviewImg.src = resData.secure_url;
                if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
                if (window.showBoseGlobalToast) window.showBoseGlobalToast("تم تأمين وحفظ الصورة بنجاح! ✨");
            }
        } catch (err) {
            // 🚨🚨 [إصلاح جذري حرج]: كان بيعمل Fallback صامت لصورة base64 عملاقة
            // (نص طويل جداً يمثل الصورة كاملة) وبيوهم العميل إن الرفع "نجح" (المعاينة
            // بتظهر عادي محلياً)، بينما في الحقيقة الصورة دي مش مرفوعة فعلياً على أي
            // سيرفر حقيقي - النص الطويل ده كان بيوصل لرابط الواتساب فيكسره تماماً
            // (روابط واتساب محدودة الطول) أو يوصل مقطوع/فاسد. الحل الصحيح: نوضح
            // للعميل إن الرفع فشل فعلياً ونسيبها تحاول تاني، بدل حل وهمي بيبان شغال.
            state.photoUrl = "";
            if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
            if (window.showBoseGlobalToast) window.showBoseGlobalToast("تعذر رفع الصورة، تأكدي من الاتصال بالإنترنت وحاولي تاني.");
        } finally {
            state.isUploading = false;
            if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = "اضافة للسلة";
            }
            saveCurrentState();
            recalculatePrice();
        }
    }

    /**
     * ⚙️ تهيئة المحرك وربط الأحداث
     */
    function initializeFlowerEngine() {
        // 🛡️ [تحصين الترتيب - نفس فلسفة cake-engine.js بالظبط]: نافذة تكبير
        // الصور بقت أول حاجة بتتفعل قبل أي كود تاني ممكن يرمي استثناء.
        wireUpAllFlowerLightboxImages();

        // 💡👑 [شريط المعلومات الدوّار - 10 معلومات حقيقية ومفيدة عن تجربة
        // طلب الورد]: بتتغير تلقائياً كل 6 ثواني، وبتجاوب على أسئلة شائعة
        // (الفرق بين الأنواع، التغليف، المفاجآت، الدفع، التعديل...) قبل ما
        // العميلة تحتاج تسأل عنها أصلاً. المحتوى دلوقتي قابل للتعديل بالكامل
        // من لوحة التحكم (fbConfig.infoCarouselTips) - القائمة المكتوبة هنا
        // بقت مجرد احتياطي افتراضي لو الأدمن لسه ما ضافتش/عدلتش حاجة.
        if (typeof window.initBoseInfoCarousel === "function") {
            const adminTips = Array.isArray(fbConfig.infoCarouselTips) ? fbConfig.infoCarouselTips.filter(t => t && t.title && t.text) : [];
            window.initBoseInfoCarousel({
                trackId: "bose-flower-info-carousel-track",
                progressId: "bose-flower-info-carousel-progress",
                intervalMs: 6000,
                tips: adminTips.length > 0 ? adminTips : [
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
                ],
            });
        }

        // 🧮 [توحيد مصدر الأسعار - المرحلة 3]: تحديث flowerConfig من
        // window.BoseStoreData.flowerBuilder فور جاهزية قاعدة البيانات، بنفس أسماء
        // الحقول وبنفس القيم الاحتياطية المستخدمة حرفياً في core-engine.js
        // (window.calculateCustomFlowerPrice) عشان يفضل سعر المحاكي المعروض للعميل
        // مطابق تماماً لسعر الحارس المركزي اللي بيتأكد منه بعدين في صفحة السلة.
        const fbConfig = window.BoseStoreData?.flowerBuilder || {};
        flowerConfig.basePrice = parseFloat(fbConfig.basePrice) || flowerConfig.basePrice;
        flowerConfig.baseFlowers = parseInt(fbConfig.baseFlowers, 10) || flowerConfig.baseFlowers;
        flowerConfig.extraFlowerPrice = parseFloat(fbConfig.extraFlowerPrice) || flowerConfig.extraFlowerPrice;
        flowerConfig.photoPrintPrice = parseFloat(fbConfig.photoPrintPrice) || flowerConfig.photoPrintPrice;
        flowerConfig.giftCardPrice = parseFloat(fbConfig.giftCardPrice) || flowerConfig.giftCardPrice;

        // 🖼️👑 [معرض نماذج كارت الإهداء المطبوع - محاكي الورد]: نفس آلية معرض
        // سابقة الأعمال فوق بالظبط، بس بيتقرا من fbConfig.giftCardImages وبيتعرض
        // كشريط صور صغير جوه خطوة كارت الإهداء نفسها (بدل ما تكون العميلة "شغالة
        // بالتخمين" وهي مش شايفة شكل الكارت النهائي قبل ما تختاره).
        const giftCardGalleryTrack = document.getElementById('flower-giftcard-gallery');
        if (giftCardGalleryTrack) {
            const giftCardImages = Array.isArray(fbConfig.giftCardImages) ? fbConfig.giftCardImages : [];
            if (giftCardImages.length > 0) {
                giftCardGalleryTrack.innerHTML = giftCardImages.map((item) => {
                    const url = (item && item.image) || "";
                    if (!url) return "";
                    const alt = (item && (item.alt || item.name)) ? String(item.alt || item.name).replace(/"/g, '&quot;') : "نموذج كارت إهداء حلويات بوسي";
                    return `<div class="bose-giftcard-img-node"><img src="${url}" alt="${alt}" loading="lazy"></div>`;
                }).join("");
            }
        }
        // satinRibbonPrice تفضل ثابتة (50) لعدم وجود حقل رسمي مخصص لها بالـ JSON حالياً،
        // بنفس القرار المتبع في core-engine.js بالظبط. state.totalPrice هيتحدث تلقائياً
        // بالقيم الجديدة عند نداء recalculatePrice() في نهاية الدالة دي.

        // 🖼️ [صور المحاكي الديناميكية]: البانر الرئيسي ومعرض "بوكيهات شرفت
        // عملائنا" كانوا ثابتين على شعار المتجر مكرر 4 مرات، بدون أي مكان في
        // لوحة التحكم لتغييرهم. دلوقتي بيتقروا من fbConfig.heroImage/
        // portfolioGallery (نفس آلية cake-engine.js بالظبط) - وبما إن الرندرة
        // دي بتحصل هنا في أول الدالة، أي كود تحت بيدور على .portfolio-item-card
        // هيلاقي العناصر الجديدة جاهزة عادي (نفس الـ scope المتزامن).
        const heroImg = document.querySelector('.hero-banner-frame');
        if (heroImg && fbConfig.heroImage) heroImg.src = fbConfig.heroImage;
        // 🖼️👑 [سمتريه محاكي التورت]: نفس مكان وحجم معرض الإلهام بالظبط
        // (bose-step1-gallery-scroller جوه خطوة 1) بدل قسم "سابقة الأعمال"
        // المنفصل تحت الصفحة كلها - نفس آلية renderCakeGalleryAndHero
        // بمحاكي التورت بالحرف.
        const portfolioTrack = document.getElementById('bose-flower-portfolio-lightbox-track');
        if (portfolioTrack) {
            if (Array.isArray(fbConfig.portfolioGallery) && fbConfig.portfolioGallery.length > 0) {
                portfolioTrack.innerHTML = fbConfig.portfolioGallery.map((item) => {
                    const url = (item && item.image) || "";
                    if (!url) return "";
                    const alt = (item && (item.alt || item.name)) ? String(item.alt || item.name).replace(/"/g, '&quot;') : "روائع حلويات بوسي";
                    return `<div class="bose-portfolio-img-node"><img src="${url}" alt="${alt}" loading="lazy"></div>`;
                }).join("");
            } else {
                portfolioTrack.innerHTML = `<p class="bose-gallery-empty-note">هنضيف هنا قريب مجموعة من أجمل البوكيهات اللي عملناها لعملائنا 💐</p>`;
            }
        }

        flowerCountInput = document.getElementById('flower-count');
        includePhotoCheckbox = document.getElementById('include-photo');
        photoFileInput = document.getElementById('photo-file');
        photoPreviewContainer = document.getElementById('photo-preview-container');
        photoPreviewImg = document.getElementById('photo-preview-img');
        includeCardCheckbox = document.getElementById('include-card');
        cardTextInput = document.getElementById('card-text');
        moneyCategorySelect = document.getElementById('money-category');
        bouquetTotalVal = document.getElementById('bouquet-total-val');
        addToCartBtn = document.getElementById('add-to-cart-btn');
        dynamicAddonsArea = document.getElementById('bose-dynamic-addons-injection-area');
        embeddedPriceDisplay = document.getElementById('bose-embedded-price-display');

        includeRibbonTextCheckbox = document.getElementById('include-ribbon-text');
        ribbonTextSection = document.getElementById('ribbon-text-section');
        ribbonTextInput = document.getElementById('ribbon-text-input');
        ribbonStepPriceDisplay = document.getElementById('bose-ribbon-price-display');

        bosePhotosPriceDisplay = document.getElementById('bose-photos-price-display');
        boseCardPriceDisplay = document.getElementById('bose-card-price-display');

        includeCashCheckbox = document.getElementById('include-cash-toggle');
        cashMasterBlock = document.getElementById('cash-master-integration-block');
        cashIntegrationCounterBlock = document.getElementById('cash-integration-counter-block');
        moneyAmountDisplay = document.getElementById('money-amount-display');

        includeChocolateCheckbox = document.getElementById('include-chocolate-toggle');
        chocolateBudgetMasterBlock = document.getElementById('chocolate-budget-master-block');
        chocolateBudgetDisplay = document.getElementById('chocolate-budget-display');
        photoCountInput = document.getElementById('photo-count-input');

        btnNext = document.getElementById("btn-next");
        btnPrev = document.getElementById("btn-prev");
        // 👑 [سمتريه محاكي التورت]: نفس أسماء كلاسات الخطوات والمؤشرات
        // بالحرف اللي بيستخدمها محاكي التورت (bose-step-wizard-panel /
        // bose-progress-node) بدل الأسماء المنفصلة القديمة الخاصة بمحاكي
        // الورد لوحده (bose-step-card-panel / step-node).
        stepsPanels = document.querySelectorAll(".bose-step-wizard-panel");
        stepsIndicators = document.querySelectorAll(".bose-progress-node");
        heroEl = document.getElementById("bose-flower-hero");
        introEl = document.getElementById("bose-flower-intro");

        // تغذية القائمة المنسدلة ديناميكياً للفئات النقدية
        if (moneyCategorySelect) {
            let optionsHtml = `<option value="0" selected>اختاري فئة الورقة النقدية...</option>`;
            const categories = window.BoseStoreData?.flowerBuilder?.moneyCategories || [
                {amount:5}, {amount:10}, {amount:20}, {amount:50}, {amount:100}, {amount:200}
            ];
            categories.forEach(cat => {
                optionsHtml += `<option value="${cat.amount}">فئة الـ ${cat.amount} جنيه</option>`;
            });
            moneyCategorySelect.innerHTML = optionsHtml;
        }

        // استعادة الحالة المحفوظة سابقاً إن وجدت
        try {
            const saved = localStorage.getItem(FLOWER_STATE_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.photoUrl === "base64-stored-in-memory") {
                    parsed.photoUrl = activeBase64ImageInMemory;
                }
                state = { ...state, ...parsed };
            }
        } catch (e) {}

        // تطبيق الحالة المستعادة على عناصر الـ UI مباشرة
        if (flowerCountInput) flowerCountInput.value = state.flowerCount;
        if (includeRibbonTextCheckbox) {
            includeRibbonTextCheckbox.checked = state.includeRibbonText;
            if (ribbonTextSection) ribbonTextSection.style.display = state.includeRibbonText ? "block" : "none";
        }
        if (ribbonTextInput) ribbonTextInput.value = state.ribbonText;
        if (includePhotoCheckbox) {
            includePhotoCheckbox.checked = state.includePhoto;
            const upSec = document.getElementById('photo-upload-section');
            if (upSec) upSec.style.display = state.includePhoto ? "block" : "none";
        }
        if (photoCountInput) photoCountInput.value = state.photoCount;
        if (state.photoUrl && photoPreviewImg) {
            photoPreviewImg.src = state.photoUrl;
            if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
        }
        if (includeCardCheckbox) {
            includeCardCheckbox.checked = state.includeCard;
            const cardSec = document.getElementById('card-text-section');
            if (cardSec) cardSec.style.display = state.includeCard ? "block" : "none";
        }
        if (cardTextInput) cardTextInput.value = state.cardText;
        if (includeCashCheckbox) {
            includeCashCheckbox.checked = state.includeCash;
            if (cashMasterBlock) cashMasterBlock.style.display = state.includeCash ? "block" : "none";
        }
        if (moneyCategorySelect) moneyCategorySelect.value = state.moneyCategoryAmount;
        if (moneyAmountDisplay) moneyAmountDisplay.value = state.moneyAmount;
        if (includeChocolateCheckbox) {
            includeChocolateCheckbox.checked = state.includeChocolate;
            if (chocolateBudgetMasterBlock) chocolateBudgetMasterBlock.style.display = state.includeChocolate ? "block" : "none";
        }
        if (chocolateBudgetDisplay) chocolateBudgetDisplay.value = state.chocolateBudget;
        updateCashSelectionLine();

        // 🌸👑 [رسم أنواع الورد ديناميكياً من لوحة التحكم]: بدل 3 كروت
        // مكتوبة يدوياً وثابتة في الـ HTML، بنبني الكروت كلها هنا من
        // fbConfig.flowerTypes (أو DEFAULT_FLOWER_TYPES لو الأدمن لسه ما
        // ضافش حاجة) - فأي نوع تضيفه الأدمن (حتى لو مش "ورد" أصلاً، زي بوكس
        // شوكولاتة أو بوكيه صور) بيظهر فوراً كخيار حقيقي قدام العميلة بصورته
        // واسمه، وأي نوع تحذفه الأدمن بيختفي فوراً من غير أي تعديل كود.
        renderFlowerTypeOptions();

        function renderFlowerTypeOptions() {
            const row = document.getElementById("flower-type-iconic-row");
            if (!row) return;

            const adminList = Array.isArray(fbConfig.flowerTypes) ? fbConfig.flowerTypes.filter(t => t && t.name) : [];
            currentFlowerTypesList = adminList.length > 0 ? adminList : DEFAULT_FLOWER_TYPES;

            // لو النوع المحفوظ في الحالة السابقة اتحذف من لوحة التحكم، بنرجع
            // تلقائياً لأول نوع متاح حالياً عشان الحالة تفضل صحيحة دايماً.
            if (!getFlowerTypeById(state.flowerType) && currentFlowerTypesList.length > 0) {
                state.flowerType = currentFlowerTypesList[0].id;
            }

            row.innerHTML = currentFlowerTypesList.map((item) => `
                <div class="bose-iconic-btn-node${item.id === state.flowerType ? " active-selected" : ""}" data-value="${item.id}">
                    ${item.image ? `<img src="${item.image}" alt="" class="bose-option-card-thumb">` : `<span class="btn-icon">${item.icon || "🌷"}</span>`}
                    <span class="btn-label">${item.name}</span>
                    <span class="bose-iconic-selected-checkmark">✅ مُختار</span>
                </div>`).join("");

            hiddenTypeInput = document.getElementById("flower-type");
            if (hiddenTypeInput) hiddenTypeInput.value = state.flowerType;

            iconicBtns = row.querySelectorAll(".bose-iconic-btn-node");
            iconicBtns.forEach(btn => {
                btn.onclick = function () {
                    iconicBtns.forEach(b => b.classList.remove("active-selected"));
                    this.classList.add("active-selected");
                    state.flowerType = this.getAttribute("data-value");
                    if (hiddenTypeInput) hiddenTypeInput.value = state.flowerType;
                    saveCurrentState();
                    recalculatePrice();
                    updateFlowerSensoryNote();
                    updateFlowerTypeSelectionLine();
                };
            });

            updateFlowerSensoryNote();
            updateFlowerTypeSelectionLine();
        }

        // ✅👑 [توضيح أكبر لتأكيد الاختيار - نفس فلسفة سطر التأكيد في محاكي
        // التورت]: بيقول للعميلة بالنص هي اختارت نوع الورد إيه بالظبط، بيتحدّث
        // فوراً مع أي تغيير.
        function updateFlowerTypeSelectionLine() {
            const lineEl = document.getElementById("flower-type-current-selection-line");
            if (!lineEl) return;
            const typeName = getFlowerTypeName(state.flowerType);
            lineEl.innerHTML = typeName ? `✅ اختياركِ الحالي: <strong>${typeName}</strong>` : "";
        }

        // 💰👑 [توضيح كامل - خطوة الكاش]: سطر تأكيد حي بيقول للعميلة بالنص
        // هنحط لها كام وبأنهي فئة، بنفس فلسفة سطر تأكيد نوع الورد فوق - عشان
        // متحسّش إنها "مش فاهمة" اختيارها وصل لفين.
        function updateCashSelectionLine() {
            const lineEl = document.getElementById("cash-current-selection-line");
            if (!lineEl) return;
            if (state.includeCash && state.moneyAmount > 0 && state.moneyCategoryAmount > 0) {
                lineEl.innerHTML = `✅ هنحط لكِ <strong>${state.moneyAmount} جنيه</strong> جوه الباقة، مرتبة بفئة <strong>${state.moneyCategoryAmount} جنيه</strong>`;
            } else {
                lineEl.innerHTML = "";
            }
        }

        // 🗑️ [حذف خطوة "الإحساس المطلوب" بالكامل]: بناءً على طلب مباشر -
        // moodBtns / moodNoteBox / FLOWER_MOOD_PRESETS / applyFlowerMoodPreset
        // وstate.mood اتشالوا من هنا خالص.
        function updateFlowerSensoryNote() {
            const noteEl = document.getElementById("flower-sensory-note");
            if (noteEl) noteEl.textContent = (getFlowerTypeById(state.flowerType) || {}).description || "";
        }

        const btnShareFlowerDesign = document.getElementById("btn-share-flower-design");
        if (btnShareFlowerDesign) {
            btnShareFlowerDesign.addEventListener("click", () => {
                const priceNow = document.getElementById("bouquet-total-val")?.textContent || "";
                const shareText = `شوفي التصميم اللي عملته لبوكيه ورد من حلويات بوسي 💐\nنوع الورد: ${getFlowerTypeName(state.flowerType)}\nعدد الورد: ${state.flowerCount}\nالسعر: ${priceNow}\nإيه رأيك؟`;
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
            });
        }

        const minusBtn = document.getElementById('flower-minus');
        const plusBtn = document.getElementById('flower-plus');

        if (plusBtn) {
            plusBtn.onclick = () => {
                state.flowerCount++;
                if (flowerCountInput) flowerCountInput.value = state.flowerCount;
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (minusBtn) {
            minusBtn.onclick = () => {
                if (state.flowerCount > flowerConfig.baseFlowers) {
                    state.flowerCount--;
                    if (flowerCountInput) flowerCountInput.value = state.flowerCount;
                    saveCurrentState();
                    recalculatePrice();
                }
            };
        }

        // ربط أحداث الستان المطور
        if (includeRibbonTextCheckbox) {
            includeRibbonTextCheckbox.onclick = (e) => {
                state.includeRibbonText = e.target.checked;
                if (ribbonTextSection) ribbonTextSection.style.display = state.includeRibbonText ? "block" : "none";
                if (!state.includeRibbonText) {
                    state.ribbonText = "";
                    if (ribbonTextInput) ribbonTextInput.value = "";
                }
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (ribbonTextInput) {
            ribbonTextInput.oninput = (e) => {
                state.ribbonText = e.target.value;
                saveCurrentState();
            };
        }

        // الملحقات والصور الشخصية
        if (includePhotoCheckbox) {
            includePhotoCheckbox.onclick = (e) => {
                state.includePhoto = e.target.checked;
                const uploadSectionDOM = document.getElementById('photo-upload-section');
                if (uploadSectionDOM) uploadSectionDOM.style.display = state.includePhoto ? "block" : "none";
                if (!state.includePhoto) {
                    state.photoUrl = "";
                    state.photoCount = 1;
                    if (photoCountInput) photoCountInput.value = 1;
                    if (photoFileInput) photoFileInput.value = "";
                    if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
                }
                saveCurrentState();
                recalculatePrice();
            };
        }

        const photoCountPlus = document.getElementById('photo-count-plus');
        const photoCountMinus = document.getElementById('photo-count-minus');
        if (photoCountPlus) {
            photoCountPlus.onclick = () => {
                state.photoCount++;
                if (photoCountInput) photoCountInput.value = state.photoCount;
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (photoCountMinus) {
            photoCountMinus.onclick = () => {
                if (state.photoCount > 1) {
                    state.photoCount--;
                    if (photoCountInput) photoCountInput.value = state.photoCount;
                    saveCurrentState();
                    recalculatePrice();
                }
            };
        }

        if (photoFileInput) {
            photoFileInput.onchange = (e) => {
                if (e.target.files[0]) uploadReferenceImage(e.target.files[0]);
            };
        }

        if (includeCardCheckbox) {
            includeCardCheckbox.onclick = (e) => {
                state.includeCard = e.target.checked;
                const cardSec = document.getElementById('card-text-section');
                if (cardSec) cardSec.style.display = state.includeCard ? "block" : "none";
                if (!state.includeCard) {
                    state.cardText = "";
                    if (cardTextInput) cardTextInput.value = "";
                }
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (cardTextInput) {
            cardTextInput.oninput = (e) => {
                state.cardText = e.target.value;
                saveCurrentState();
                recalculatePrice();
            };
        }

        // الكاش المدمج الصافي 100% بدون أي رسوم معالجة
        if (includeCashCheckbox) {
            includeCashCheckbox.onclick = (e) => {
                state.includeCash = e.target.checked;
                if (cashMasterBlock) cashMasterBlock.style.display = state.includeCash ? "block" : "none";
                if (!state.includeCash) {
                    state.moneyAmount = 0;
                    state.moneyCategoryAmount = 0;
                    if (moneyCategorySelect) moneyCategorySelect.value = "0";
                    if (cashIntegrationCounterBlock) cashIntegrationCounterBlock.style.display = "none";
                }
                saveCurrentState();
                recalculatePrice();
                updateCashSelectionLine();
            };
        }

        if (moneyCategorySelect) {
            moneyCategorySelect.onchange = (e) => {
                const val = parseInt(e.target.value, 10);
                state.moneyCategoryAmount = val;
                if (val > 0) {
                    if (cashIntegrationCounterBlock) cashIntegrationCounterBlock.style.display = "block";
                    if (state.moneyAmount <= 0) state.moneyAmount = val;
                } else {
                    if (cashIntegrationCounterBlock) cashIntegrationCounterBlock.style.display = "none";
                    state.moneyAmount = 0;
                }
                if (moneyAmountDisplay) moneyAmountDisplay.value = state.moneyAmount;
                saveCurrentState();
                recalculatePrice();
                updateCashSelectionLine();
            };
        }

        const billPlus = document.getElementById('bill-plus');
        const billMinus = document.getElementById('bill-minus');
        if (billPlus) {
            billPlus.onclick = () => {
                let step = state.moneyCategoryAmount || 50;
                state.moneyAmount += step;
                if (moneyAmountDisplay) moneyAmountDisplay.value = state.moneyAmount;
                saveCurrentState();
                recalculatePrice();
                updateCashSelectionLine();
            };
        }
        if (billMinus) {
            billMinus.onclick = () => {
                let step = state.moneyCategoryAmount || 50;
                if (state.moneyAmount >= step) {
                    state.moneyAmount -= step;
                    if (moneyAmountDisplay) moneyAmountDisplay.value = state.moneyAmount;
                    saveCurrentState();
                    recalculatePrice();
                    updateCashSelectionLine();
                }
            };
        }

        // ميزانية الشوكولاتة الصافية 100%
        if (includeChocolateCheckbox) {
            includeChocolateCheckbox.onclick = (e) => {
                state.includeChocolate = e.target.checked;
                if (chocolateBudgetMasterBlock) chocolateBudgetMasterBlock.style.display = state.includeChocolate ? "block" : "none";
                if (!state.includeChocolate) {
                    state.chocolateBudget = 0;
                    if (chocolateBudgetDisplay) chocolateBudgetDisplay.value = 0;
                }
                saveCurrentState();
                recalculatePrice();
            };
        }

        const chocBudgetPlus = document.getElementById('choc-budget-plus');
        const chocBudgetMinus = document.getElementById('choc-budget-minus');
        if (chocBudgetPlus) {
            chocBudgetPlus.onclick = () => {
                state.chocolateBudget += 50;
                if (chocolateBudgetDisplay) chocolateBudgetDisplay.value = state.chocolateBudget;
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (chocBudgetMinus) {
            chocBudgetMinus.onclick = () => {
                if (state.chocolateBudget >= 50) {
                    state.chocolateBudget -= 50;
                    if (chocolateBudgetDisplay) chocolateBudgetDisplay.value = state.chocolateBudget;
                    saveCurrentState();
                    recalculatePrice();
                }
            };
        }

        // أزرار التحكم في التصفح والـ Stepper
        // 🧠👑 [تخطي ذكي لخطوة "كام وردة؟"]: لو نوع الباقة المختار سعره ثابت
        // (usesFlowerCount: false من لوحة التحكم)، خطوة العدد دي مالهاش معنى
        // خالص - فبنتخطاها تلقائياً في الاتجاهين (تالي/سابق) وعند الضغط على
        // رقمها في الشريط، بدل ما تفضل ظاهرة وهي مش منطقية لنوع الباقة ده.
        function resolveStepTarget(target, movingForward) {
            if (target === FLOWER_COUNT_STEP && !typeUsesFlowerCount()) {
                return movingForward ? FLOWER_COUNT_STEP + 1 : FLOWER_COUNT_STEP - 1;
            }
            return target;
        }
        if (btnNext) {
            btnNext.onclick = () => {
                const next = resolveStepTarget(state.currentActiveStep + 1, true);
                if (next <= state.totalSteps) {
                    state.currentActiveStep = next;
                    updateActiveStepUI();
                }
            };
        }
        if (btnPrev) {
            btnPrev.onclick = () => {
                const prev = resolveStepTarget(state.currentActiveStep - 1, false);
                if (prev >= 1) {
                    state.currentActiveStep = prev;
                    updateActiveStepUI();
                }
            };
        }
        // 🔢👑 [سمتريه محاكي التورت]: أرقام الخطوات مبنية على ترتيبها في
        // الصفحة (node-step-1..10) بدل data-step-target - نفس منطق jumpToStep
        // بمحاكي التورت بالحرف.
        if (stepsIndicators.length > 0) {
            stepsIndicators.forEach((node, idx) => {
                const targetStep = idx + 1;
                node.setAttribute('role', 'button');
                node.setAttribute('tabindex', '0');
                node.setAttribute('aria-label', `الذهاب للخطوة ${targetStep}`);
                node.onclick = function () {
                    state.currentActiveStep = resolveStepTarget(targetStep, targetStep >= state.currentActiveStep);
                    updateActiveStepUI();
                };
                node.onkeydown = function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        state.currentActiveStep = resolveStepTarget(targetStep, targetStep >= state.currentActiveStep);
                        updateActiveStepUI();
                    }
                };
            });
        }

        // 🖼️👑 [كل صور محاكي الورد بقت بتفتح بملء الشاشة عند الضغط]: كان ده مقصور
        // على صور معرض سابقة الأعمال بس. دلوقتي أي صورة حقيقية في الصفحة - الصورة
        // الرئيسية فوق، صور توضيح كل خطوة، معاينة الصورة المرفوعة، وصور المعرض -
        // بتفتح بنفس المودال عن طريق تفويض حدث واحد على مستوى الصفحة، بنفس روح
        // initializeBoseLightboxGallery في cake-engine.js.
        //
        // 🐛💥 [إصلاح جذري - كسر كامل لمحاكي الورد بالكامل عند التحميل]: كان فيه
        // خطأ خطير هنا - `portfolioModal0`/`modalImg0` كانا متعرّفين بـ const برّه
        // الدالة (في نهاية initializeFlowerEngine، بعد أكتر من 400 سطر)، لكن
        // الدالة اللي بتستخدمهم (wireUpAllFlowerLightboxImages) كانت بتتنادى في
        // أول سطر فعلي في initializeFlowerEngine بالظبط - يعني قبل ما التنفيذ
        // يوصل خالص للسطر اللي فيه الـ const، فبيرمي استثناء
        // "Cannot access 'portfolioModal0' before initialization" (TDZ) مباشرة.
        // الاستثناء ده مكانش متلقّط بأي try/catch في نقطة النداء، فكان بيوقف
        // initializeFlowerEngine كلها فورًا من أول سطر - يعني كل حاجة بعد كده
        // في الدالة (تسعير، اختيار الأنواع، رفع الصور، وربط زرار "أضيفي للسلة")
        // مكانتش بتتنفذ خالص، وكان محاكي الورد بالكامل بيقف عن الاستجابة بصمت من
        // غير أي رسالة خطأ ظاهرة للعميلة. الحل: بنجيب العناصر مباشرة جوه الدالة
        // نفسها (زي initializeBoseLightboxGallery في cake-engine.js بالظبط) بدل
        // ما نعتمد على متغيرات من سكوب خارجي ممكن يتنفذ بعدها بترتيب مختلف.
        /* 🖼️👑 [سمتريه محاكي التورت]: نفس نافذة initializeBoseLightboxGallery
           بمحاكي التورت بالحرف - صورة تنبثق (pop-in) وتملأ الشاشة (لا مودال
           صغير مقصوص)، ونفس الحاويات القابلة للتكبير
           (.bose-step-wizard-card / .bose-main-hero-hook / .reviews-premium-section)
           بدل الأسماء المنفصلة القديمة الخاصة بمحاكي الورد لوحده. */
        function wireUpAllFlowerLightboxImages() {
            let lightboxOverlay = document.getElementById('bose-lightbox-container');
            let lightboxImg = document.getElementById('bose-lightbox-img');
            let lightboxClose = document.getElementById('bose-lightbox-close-btn');

            if (!lightboxOverlay || !lightboxImg) {
                lightboxOverlay = document.createElement('div');
                lightboxOverlay.className = 'bose-lightbox-overlay';
                lightboxOverlay.id = 'bose-lightbox-container';
                lightboxOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(17,17,17,0.9);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;z-index:999999;padding:20px;box-sizing:border-box;';
                lightboxOverlay.innerHTML = `
                    <div class="bose-lightbox-card" style="background:#FFFFFF;padding:10px;border-radius:20px;width:100%;height:100%;max-width:1400px;display:flex;align-items:center;justify-content:center;position:relative;">
                        <button type="button" class="bose-lightbox-close" id="bose-lightbox-close-btn" style="position:absolute;top:14px;left:14px;background:#FF91A4;color:#FFFFFF;border:none;width:44px;height:44px;border-radius:50%;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">&times;</button>
                        <img src="" id="bose-lightbox-img" alt="معاينة الصورة الفاخرة" style="max-width:100%;max-height:100%;width:auto;height:auto;border-radius:14px;object-fit:contain;display:block;">
                    </div>`;
                document.body.appendChild(lightboxOverlay);
                lightboxImg = document.getElementById('bose-lightbox-img');
                lightboxClose = document.getElementById('bose-lightbox-close-btn');
            }

            const lightboxCard = lightboxOverlay.querySelector('.bose-lightbox-card');

            const openLightbox = (src) => {
                if (!src) return;
                lightboxImg.src = src;
                lightboxOverlay.style.display = "flex";
                if (lightboxCard) {
                    lightboxCard.classList.remove('bose-lightbox-pop-in');
                    void lightboxCard.offsetWidth;
                    lightboxCard.classList.add('bose-lightbox-pop-in');
                }
                document.body.style.overflow = 'hidden';
            };
            const closeLightbox = () => {
                lightboxOverlay.style.display = "none";
                lightboxImg.src = "";
                document.body.style.overflow = '';
            };

            const isOpenableGalleryImage = (img) => {
                if (!img || img.id === 'bose-lightbox-img') return false;
                return !!(img.closest('.bose-step-wizard-card') || img.closest('.bose-main-hero-hook') || img.closest('.reviews-premium-section'));
            };

            window.addEventListener('click', (e) => {
                const target = /** @type {HTMLElement} */ (e.target);
                const img = target && target.closest ? target.closest('img') : null;
                if (!img || !isOpenableGalleryImage(img) || !img.src) return;
                const wrappingLabel = img.closest('label');
                if (wrappingLabel) { e.preventDefault(); e.stopPropagation(); }
                openLightbox(img.src);
            }, true);

            if (lightboxClose) lightboxClose.onclick = closeLightbox;
            lightboxOverlay.onclick = (e) => { if (e.target === lightboxOverlay) closeLightbox(); };

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightboxOverlay.style.display === 'flex') closeLightbox();
            });
        }

        // إضافة كائن البوكيه المعزول بداخل سلة المشتريات الموحدة
        if (addToCartBtn) {
            addToCartBtn.onclick = function () {
                if (state.isUploading) return;

                const flowerTypeName = getFlowerTypeName(state.flowerType);
                // نفس شرط ظهور كارت الإهداء بالضبط المستخدم في recalculatePrice() أعلاه
                const hasGiftCardFinal = !!(state.includeCard && state.cardText.trim() !== "");

                // 🧮 [إصلاح ثغرة مالية - المرحلة 2]: أسماء الحقول هنا لازم تطابق حرفياً
                // المخطط المعتمد في core-engine.js (window.createCartItem وحارس
                // window.recalculateCartItemPrice)، وهو: cashAmount (مش moneyAmount) و
                // hasChocolate + chocolateBudget معاً. الفرق في الأسماء القديم كان السبب
                // في تصفير الكاش والشوكولاتة تلقائياً كل ما تتفتح صفحة السلة.
                const customOptionsObj = {
                    flowerType: state.flowerType,
                    flowerCount: state.flowerCount,
                    hasSatinRibbon: state.includeRibbonText,
                    satinRibbonText: state.ribbonText,
                    hasChocolate: state.includeChocolate,
                    chocolateBudget: state.includeChocolate ? state.chocolateBudget : 0,
                    cashAmount: state.moneyAmount,
                    photoCount: state.includePhoto ? state.photoCount : 0,
                    hasGiftCard: hasGiftCardFinal,
                    giftCardText: hasGiftCardFinal ? state.cardText : "",
                    flavorName: `بوكيه مخصص (${flowerTypeName})`,
                    // 🗑️ [حذف isGift]: كان مرتبط بخطوة "لنفسي/هدية" المحذوفة - راجع
                    // شرح state.totalSteps فوق. cart-engine.js لسه فيه شرط عرض
                    // `if (cd.isGift)` بس هيفضل مجرد كود ميت آمن (مش بيتفعّل) لأن
                    // الحقل ده مبقاش بيتبعت خالص من هنا.
                    // 🗑️ [حذف خطوة "الإحساس المطلوب"]: moodLabel فضل "" ثابتة
                    // للتوافق مع أي كود قديم بيقرا الحقل ده، بس مفيش أي واجهة
                    // بتحدّثه تاني.
                    moodLabel: ""
                };

                // 🧮 [توحيد إنشاء عنصر السلة]: استخدام window.createCartItem() الموحدة
                // بدل بناء الكائن يدوياً، بنفس الأسلوب المتبع في cake-engine.js تماماً،
                // عشان يبقى مصدر الحقيقة لبنية customDetails واحد بس في كل الموقع.
                // بننسخ المنتج (بدل التعديل المباشر) عشان منلمسش window.BoseStoreData
                // الأصلية بأي أثر جانبي.
                const dbProduct = window.BoseStoreData?.products?.find(p => p.slug === "flowers-master");
                const masterProduct = Object.assign(
                    { slug: "flowers-master", title: "الورد", basePrice: flowerConfig.basePrice },
                    dbProduct || {},
                    { type: "custom-flower" }
                );

                const finalCartItem = window.createCartItem(masterProduct, customOptionsObj, 1);

                if (!finalCartItem) return;

                // القيمة المعروضة فعلياً للعميل طول رحلة المحاكي (بكامل دقتها العشرية)
                // هي مصدر الحقيقة للسعر عند الإضافة، والحارس المركزي هيتأكد منها لاحقاً
                // عند فتح السلة عبر calculateCustomFlowerPrice بنفس المدخلات بالظبط.
                finalCartItem.finalPrice = parseFloat(state.totalPrice);
                finalCartItem.type = "custom-flower";
                finalCartItem.image = state.photoUrl || finalCartItem.image;

                let currentCart = [];
                try {
                    currentCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
                } catch (e) {
                    currentCart = [];
                }
                currentCart.push(finalCartItem);
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentCart));

                if (window.updateGlobalCartCounter) window.updateGlobalCartCounter();
                if (window.showBoseGlobalToast) window.showBoseGlobalToast("تمت إضافة المنتج إلى السلة.");

                try {
                    sessionStorage.removeItem(BASE64_IMAGE_SESSION_KEY);
                    localStorage.removeItem(FLOWER_STATE_STORAGE_KEY);
                } catch (e) {}

                setTimeout(() => {
                    window.location.href = "cart.html";
                }, 400);
            };
        }

        // تشغيل الرندرة الأولية للمحاكي فور اكتمال الربط الموضعي
        recalculatePrice();
        updateActiveStepUI();
    }

    /**
     * حارس التشغيل الآمن بالتزامن مع قاعدة البيانات الموحدة
     */
    if (window.BoseStoreData && window.BoseStoreData.store) {
        initializeFlowerEngine();
    } else {
        document.addEventListener('BoseDatabaseLoaded', () => {
            initializeFlowerEngine();
        });
    }
})();
