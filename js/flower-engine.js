/**
 * 👑 محرك محاكي بوكيهات الورد والملحقات التفاعلي المطور - حلويات بوسي 👑
 * النسخة الهندسية القياسية الكاملة والمعزولة كلياً - النسخة V3.0 فائقة الأداء وتوفير البيانات.
 * التوافق: يلتزم بمهام محاكي الورد فقط ولا يتدخل بأي ملف آخر، ويتكامل بأمان مع البيئة المحلية.
 */

(function () {
    "use strict";

    // مفاتيح التخزين الموحدة لعلامة بوسي الفاخرة لضمان التزامن المطلق[span_36](start_span)[span_36](end_span)
    const CART_STORAGE_KEY = 'bose_cart';
    const FLOWER_STATE_STORAGE_KEY = 'bose_flower_builder_state';
    const BASE64_IMAGE_SESSION_KEY = 'bose_active_base64_image_session';

    // ذاكرة احتياطية لضمان استقرار التصفح الخفي (Incognito Mode Fallback)[span_37](start_span)[span_37](end_span)
    let flowerStateMemoryFallback = {};
    let activeBase64ImageInMemory = "";

    try {
        activeBase64ImageInMemory = sessionStorage.getItem(BASE64_IMAGE_SESSION_KEY) || "";
    } catch (e) {
        console.warn("⚠️ الـ sessionStorage غير متاح في المتصفح الحالي.");
    }

    // الإعدادات الافتراضية الصارمة للأسعار تماشياً مع الوثيقة القياسية لحلويات بوسي[span_38](start_span)[span_38](end_span)[span_39](start_span)[span_39](end_span)
    let flowerConfig = {
        basePrice: 400,
        baseFlowers: 15,
        extraFlowerPrice: 35,
        photoPrintPrice: 15,
        giftCardPrice: 20,
        satinRibbonPrice: 50
    };

    // الحالة الديناميكية الحالية لرحلة العميل داخل المحاكي[span_40](start_span)[span_40](end_span)
    let state = {
        currentActiveStep: 1,
        totalSteps: 4,
        flowerType: "natural",
        flowerCount: 15,
        wrappingType: "classic", 
        ribbonColor: "pink",
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

    // عناصر واجهة الـ DOM الخاصة بمحاكي الورد[span_41](start_span)[span_41](end_span)
    let flowerCountInput, includePhotoCheckbox, photoFileInput, photoPreviewContainer, photoPreviewImg;
    let includeCardCheckbox, cardTextInput, moneyCategorySelect, bouquetTotalVal, addToCartBtn;
    let includeRibbonTextCheckbox, ribbonTextSection, ribbonTextInput, ribbonStepPriceDisplay;
    let includeCashCheckbox, cashMasterBlock, cashIntegrationCounterBlock, moneyAmountDisplay;
    let includeChocolateCheckbox, chocolateBudgetMasterBlock, chocolateBudgetDisplay;
    let photoCountInput, dynamicAddonsArea, embeddedPriceDisplay, bosePhotosPriceDisplay, boseCardPriceDisplay;
    let btnNext, btnPrev, stepsPanels, stepsIndicators, iconicBtns, hiddenTypeInput, dynamicPricingWidget;

    /**
     * 🛡️ حفظ وتأمين الحالة التفاعلية الحالية للعميل منعاً لفقد الخيارات[span_42](start_span)[span_42](end_span)
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
     * 🧮 محرك الفحص المالي لأسعار البوكيه - مطور كلياً لمنع تحميل ميزانية الكاش أو الشوكولاتة أي رسوم[span_43](start_span)[span_43](end_span)[span_44](start_span)[span_44](end_span)
     */
    function recalculatePrice() {
        let extraFlowers = Math.max(0, state.flowerCount - flowerConfig.baseFlowers);
        let extraCost = extraFlowers * flowerConfig.extraFlowerPrice;
        let ribbonCost = state.includeRibbonText ? flowerConfig.satinRibbonPrice : 0;
        let photoCost = state.includePhoto ? (state.photoCount * flowerConfig.photoPrintPrice) : 0;
        let cardCost = (state.includeCard && state.cardText.trim() !== "") ? flowerConfig.giftCardPrice : 0;
        
        // 1. حساب تكلفة الخدمة والتنسيق القابلة لزيادة السعر الرسمية
        let servicePrice = flowerConfig.basePrice + extraCost + ribbonCost + photoCost + cardCost;
        
        // استدعاء دالة الزيادة الرسمية من المحرك المركزي الموحد لتوحيد السياسة المالية للموقع إن وجدت[span_45](start_span)[span_45](end_span)[span_46](start_span)[span_46](end_span)
        let finalServicePrice = window.calculateBosePrice ? window.calculateBosePrice(servicePrice, "menu-only") : servicePrice;

        // 2. الكاش والشوكولاتة تُحسب كقيم صافية 100% بدون أي رسوم معالجة لثقة العميل[span_47](start_span)[span_47](end_span)[span_48](start_span)[span_48](end_span)
        let total = Math.round(finalServicePrice) + state.moneyAmount + state.chocolateBudget;
        state.totalPrice = total;

        if (bouquetTotalVal) {
            bouquetTotalVal.textContent = `${total} جنيه`;
        }

        // تحديث نص السعر التوضيحي بداخل كارت الخطوة الأولى[span_49](start_span)[span_49](end_span)
        if (embeddedPriceDisplay) {
            const currentCountCost = flowerConfig.basePrice + (extraFlowers * flowerConfig.extraFlowerPrice);
            let finalCountCost = window.calculateBosePrice ? window.calculateBosePrice(currentCountCost, "menu-only") : currentCountCost;
            embeddedPriceDisplay.innerHTML = `سعر هذا البوكيه الذي يحتوي على ${state.flowerCount} وردة هو <span>${Math.round(finalCountCost)} جنيه</span>`;
        }

        // تحديث سعر شريط الستان[span_50](start_span)[span_50](end_span)
        if (ribbonStepPriceDisplay) {
            ribbonStepPriceDisplay.innerHTML = `سعر إضافة شريط الستان المطبوع حرارياً هو <span>${flowerConfig.satinRibbonPrice} جنيه</span>`;
        }

        // تحديث سعر الصور الشخصية[span_51](start_span)[span_51](end_span)
        if (bosePhotosPriceDisplay) {
            bosePhotosPriceDisplay.style.display = state.includePhoto ? "block" : "none";
            if (state.includePhoto) {
                bosePhotosPriceDisplay.innerHTML = `<p class="bose-embedded-price-text">سعر طباعة وتنسيق الصور الشخصية (${state.photoCount} صورة) هو <span>${photoCost} جنيه</span></p>`;
            }
        }

        // تحديث سعر كارت الإهداء[span_52](start_span)[span_52](end_span)
        if (boseCardPriceDisplay) {
            boseCardPriceDisplay.style.display = state.includeCard ? "block" : "none";
        }

        // رندرة الفاتورة الجانبية بتنسيق فاخر صريح وواضح للعين[span_53](start_span)[span_53](end_span)[span_54](start_span)[span_54](end_span)
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
                html += `<div class="bose-invoice-addon-row"><span>مفاجأة الكاش جوه البوكيه:</span><span>+ ${state.moneyAmount} جنيه</span></div>`;
            }
            if (state.chocolateBudget > 0) {
                html += `<div class="bose-invoice-addon-row"><span>ميزانية الشوكولاتة الفخمة:</span><span>+ ${state.chocolateBudget} جنيه</span></div>`;
            }
            dynamicAddonsArea.innerHTML = html;
        }
    }

    /**
     * 🗺️ حارس التحكم وتوجيه خطوات الـ Stepper ذكياً[span_55](start_span)[span_55](end_span)
     */
    function updateActiveStepUI() {
        if (stepsPanels.length > 0) {
            stepsPanels.forEach(panel => {
                const stepNum = parseInt(panel.getAttribute("data-step"), 10);
                panel.classList.toggle("active", stepNum === state.currentActiveStep);
            });
        }

        if (stepsIndicators.length > 0) {
            stepsIndicators.forEach(node => {
                const nodeNum = parseInt(node.getAttribute("data-step-target"), 10);
                if (nodeNum === state.currentActiveStep) {
                    node.className = "step-node active";
                } else if (nodeNum < state.currentActiveStep) {
                    node.className = "step-node completed";
                } else {
                    node.className = "step-node";
                }
            });
        }

        if (btnPrev) btnPrev.style.display = (state.currentActiveStep === 1) ? "none" : "inline-flex";

        if (state.currentActiveStep === state.totalSteps) {
            if (btnNext) btnNext.style.display = "none";
            if (addToCartBtn) {
                addToCartBtn.style.display = "inline-flex";
                addToCartBtn.textContent = "اضافة للسلة";
            }
        } else {
            if (btnNext) btnNext.style.display = "inline-flex";
            if (addToCartBtn) addToCartBtn.style.display = "none";
        }
        
        if (dynamicPricingWidget) {
            dynamicPricingWidget.style.display = "block";
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
            formData.append('upload_preset', 'ml_default');

            const res = await fetch(endpoint, { method: 'POST', body: formData });
            const resData = await res.json();
            
            if (resData && resData.secure_url) {
                state.photoUrl = resData.secure_url;
                if (photoPreviewImg) photoPreviewImg.src = resData.secure_url;
                if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
                if (window.showBoseGlobalToast) window.showBoseGlobalToast("تم تأمين وحفظ الصورة بنجاح! ✨");
            }
        } catch (err) {
            // Fallback في حال تعثر الشبكة أو السيرفر
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                state.photoUrl = reader.result;
                if (photoPreviewImg) photoPreviewImg.src = reader.result;
                if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
            };
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
        stepsPanels = document.querySelectorAll(".bose-step-card-panel");
        stepsIndicators = document.querySelectorAll(".simulator-steps-indicator .step-node");
        iconicBtns = document.querySelectorAll("#flower-type-iconic-row .bose-iconic-btn-node");
        hiddenTypeInput = document.getElementById("flower-type");
        dynamicPricingWidget = document.getElementById("bose-dynamic-pricing-widget");

        // تغذية القائمة المنسدلة ديناميكياً للفئات النقدية
        if (moneyCategorySelect) {
            let optionsHtml = `<option value="0" selected>اختار فئة الفلوس النقدية...</option>`;
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

        // ربط أحداث أزرار نوع الورد الكروي الفخم
        if (iconicBtns.length > 0) {
            iconicBtns.forEach(btn => {
                btn.classList.toggle("active-selected", btn.getAttribute("data-value") === state.flowerType);
                btn.onclick = function () {
                    iconicBtns.forEach(b => b.classList.remove("active-selected"));
                    this.classList.add("active-selected");
                    state.flowerType = this.getAttribute("data-value");
                    if (hiddenTypeInput) hiddenTypeInput.value = state.flowerType;
                    saveCurrentState();
                    recalculatePrice();
                };
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
        if (btnNext) {
            btnNext.onclick = () => { 
                if (state.currentActiveStep < state.totalSteps) { 
                    state.currentActiveStep++; 
                    updateActiveStepUI(); 
                } 
            };
        }
        if (btnPrev) {
            btnPrev.onclick = () => { 
                if (state.currentActiveStep > 1) { 
                    state.currentActiveStep--; 
                    updateActiveStepUI(); 
                } 
            };
        }
        if (stepsIndicators.length > 0) {
            stepsIndicators.forEach(node => {
                node.onclick = function () {
                    const target = parseInt(this.getAttribute("data-step-target"), 10);
                    if (!isNaN(target)) { 
                        state.currentActiveStep = target; 
                        updateActiveStepUI(); 
                    }
                };
            });
        }

        // معرض سابقة الأعمال والـ Popups
        const portfolioModal = document.getElementById('portfolio-popup-modal');
        const modalImg = document.getElementById('modal-display-img');
        const modalClose = document.getElementById('modal-close-node');
        const portfolioCards = document.querySelectorAll('.portfolio-item-card');

        if (portfolioCards.length > 0 && portfolioModal && modalImg) {
            portfolioCards.forEach(card => {
                card.onclick = function () {
                    modalImg.src = this.querySelector('img').src;
                    portfolioModal.style.display = "flex";
                    portfolioModal.setAttribute("aria-hidden", "false");
                };
            });
        }
        if (modalClose && portfolioModal) {
            modalClose.onclick = () => { 
                portfolioModal.style.display = "none"; 
                portfolioModal.setAttribute("aria-hidden", "true"); 
            };
        }
        if (portfolioModal) {
            portfolioModal.onclick = function (e) { 
                if (e.target === this) { 
                    this.style.display = "none"; 
                    this.setAttribute("aria-hidden", "true"); 
                } 
            };
        }

        // إضافة كائن البوكيه المعزول بداخل سلة المشتريات الموحدة
        if (addToCartBtn) {
            addToCartBtn.onclick = function () {
                if (state.isUploading) return;

                const flowerTypeName = state.flowerType === "natural" ? "ورد طبيعي نضر" : (state.flowerType === "artificial" ? "ورد صناعي فاخر" : "ورد ستان راقٍ");
                const customOptionsObj = {
                    flowerType: state.flowerType, 
                    flowerCount: state.flowerCount,
                    hasSatinRibbon: state.includeRibbonText,
                    satinRibbonText: state.ribbonText,
                    chocolateBudget: state.chocolateBudget,
                    moneyAmount: state.moneyAmount,
                    photoCount: state.includePhoto ? state.photoCount : 0,
                    giftCardText: state.includeCard ? state.cardText : ""
                };

                const boseCartItem = {
                    id: `flowers-master-${Date.now()}`,
                    productSlug: "flowers-master",
                    title: "الورد",
                    flavorName: `بوكيه مخصص (${flowerTypeName})`,
                    basePrice: 400.0,
                    finalPrice: parseFloat(state.totalPrice),
                    quantity: 1,
                    image: state.photoUrl || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
                    type: "custom-flower",
                    customDetails: customOptionsObj
                };

                let currentCart = [];
                try { 
                    currentCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || []; 
                } catch (e) { 
                    currentCart = []; 
                }
                currentCart.push(boseCartItem);
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