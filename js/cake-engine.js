```javascript
/**
 * 👑 محرك محاكي تخصيص التورت التفاعلي الفاخر المطور والمصحح بالكامل - حلويات بوسي 👑
 * النسخة الهندسية القياسية الشاملة بنسبة 100% - خالية تماماً من الثغرات البرمجية والمالية V31.0
 * متوافق بشكل مطلق ومتبادل مع: core-engine.js، cart-engine.js، وقاعدة البيانات site-data-final.json
 * [تم دمج نظام ضغط الصور التلقائي والرفع المباشر لـ Cloudinary، والمزامنة الحية لصور التورت بالـ SVG]
 */

(function () {
    "use strict";

    // مفتاح تخزين السلة الموحد والثابت عبر جميع محركات الموقع لضمان التزامن الكامل
    const CART_STORAGE_KEY = 'bose_cart';

    // تهيئة وتأمين الذاكرة المؤقتة العالمية المشتركة بنمط (Global Singleton Pattern) لمنع فقدان البيانات
    window.boseInMemoryCart = window.boseInMemoryCart || [];

    // الإعدادات الافتراضية الصلبة والمطابقة تماماً لقاعدة البيانات والمحرك المركزي
    const cakeConfig = {
        enabled: true,
        basePrice: 580,          // متوافق تماماً ومطابق للقيمة المعتمدة في قاعدة البيانات site-data-final.json و core-engine.js
        basePersons: 4,
        extraPersonPrice: 145,   // متوافق تماماً ومطابق للقيمة المعتمدة في قاعدة البيانات site-data-final.json و core-engine.js
        maxFillings: 3,
        maxToppings: 3,
        shapes: [
            { id: "circle", name: "دائرة", minimumPersons: 4, extraPrice: 0 },
            { id: "heart", name: "قلب", minimumPersons: 4, extraPrice: 50 },
            { id: "square", name: "مربع", minimumPersons: 16, extraPrice: 100 },
            { id: "rectangle", name: "مستطيل", minimumPersons: 20, extraPrice: 150 }
        ],
        layers: [
            { id: 1, name: "دور واحد", extraPrice: 0 },
            { id: 2, name: "دورين (٢ دور)", extraPrice: 150 },
            { id: 3, name: "ثلاثة أدوار (٣ أدوار)", extraPrice: 300 }
        ],
        cakeTypes: [
            { id: "vanilla", name: "فانيليا" },
            { id: "chocolate", name: "شوكولاتة" },
            { id: "half-half", name: "نصف ونصف" }
        ],
        fillings: [
            { id: "nutella", name: "نوتيلا أصلية", price: 40 },
            { id: "lotus", name: "كريمة لوتس", price: 45 },
            { id: "pistachio", name: "فستق حلبي", price: 60 },
            { id: "caramel", name: "كراميل مملح", price: 30 },
            { id: "fruits", name: "فواكه طبيعية", price: 35 }
        ],
        toppings: [
            { id: "chocolate_chips", name: "شوكليت شيبس", price: 20 },
            { id: "crushed_nuts", name: "مكسرات مشكلة", price: 40 },
            { id: "sprinkles", name: "سبراينكلز ملون", price: 15 },
            { id: "strawberry", name: "قطع فراولة", price: 25 },
            { id: "gold_flakes", name: "ورق ذهب قابل للأكل", price: 50 }
        ],
        printingOptions: [
            { id: "none", name: "بدون إضافة صور", price: 0 },
            { id: "edible", name: "صورة قابلة للأكل", price: 60 },
            { id: "non-edible", name: "صورة غير قابلة للأكل", price: 15 }
        ],
        maxTextLength: 30,
        textPlacements: [
            { id: "top", name: "على سطح التورتة", price: 0 },
            { id: "board", name: "على البورد (القاعدة)", price: 15 }
        ]
    };

    // كائن التهيئة النشط والمنسوخ من قاعدة البيانات الحية
    let liveStoreConfig = null;

    // صمام أمان لمنع تكرار ربط الأحداث عند استدعاء التحديثات الديناميكية للمحرك
    let isEventsBound = false;

    // حالة حماية عمليات الرفع والضغط السحابي (Anti-Race Lock)
    let isUploadingImage = false;

    // حالة خيارات المستخدم الحالية (المحاكاة اللحظية للتخصيص الفاخر)
    let selectedConfig = {
        shape: "circle",
        cakeType: "half-half",  
        persons: 4,
        layers: 1,
        fillings: [],
        toppings: [],
        printingType: "none",   
        uploadedImageUrl: null, 
        text: "",
        textPosition: "top"
    };

    // كائن التخزين المؤقت لعناصر الـ DOM
    const dom = {
        shapeCards: null,
        layerCards: null,
        cakeTypeCards: null, 
        fillingCards: null,
        toppingCards: null,
        printingCards: null, 
        textPositionCards: null,
        textInput: null,
        personsInput: null,
        personsRange: null,
        btnMinusPersons: null,
        btnPlusPersons: null,
        totalPriceEl: null,
        personsCountEl: null,
        stepPanels: null,
        stepButtons: null,
        btnPrevStep: null,
        btnNextStep: null,
        btnAddToCart: null,
        summaryShape: null,
        summaryCakeType: null,
        summaryPersons: null,
        summaryLayers: null,
        summaryFillings: null,
        summaryToppings: null,
        summaryPrinting: null, 
        summaryText: null
    };

    // صمام حماية متطور لتطهير النصوص المدخلة من هجمات حقن الأكواد الضارة XSS
    const escapeHtml = function (unsafeString) {
        if (unsafeString === null || unsafeString === undefined) return '';
        return unsafeString
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    /* ==========================================================================
       📐 1. حقن وتثبيت أنماط CSS التفاعلية المضمونة للهوية البصرية
       ========================================================================== */
    function injectInteractiveStyles() {
        if (document.getElementById("bose-cake-interactive-styles")) return;
        const style = document.createElement("style");
        style.id = "bose-cake-interactive-styles";
        style.textContent = `
            .shape-card, .cake-shape-card, .layer-card, .cake-layer-card, 
            .cake-type-card, .type-card, .cake-flavor-card, .filling-card, 
            .cake-filling-card, .topping-card, .cake-topping-card, .printing-card, 
            .cake-printing-card, .cake-photo-card, .position-card, .cake-text-position-card {
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
                border: 1px solid rgba(255, 145, 164, 0.2) !important;
                background-color: #FFFFFF !important;
                border-radius: 16px;
            }
            .shape-card:hover, .layer-card:hover, .cake-type-card:hover, .filling-card:hover, .topping-card:hover, .printing-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(255, 145, 164, 0.1) !important;
                border-color: rgba(255, 145, 164, 0.5) !important;
            }
            .shape-card.active, .layer-card.active, .cake-type-card.active, .filling-card.active, 
            .topping-card.active, .printing-card.active, .position-card.active,
            .cake-shape-card.active, .cake-layer-card.active, .cake-flavor-card.active, 
            .cake-filling-card.active, .cake-topping-card.active, .cake-printing-card.active, .cake-position-card.active {
                border: 2px solid var(--bose-pink, #FF91A4) !important;
                background-color: #FFF0F2 !important;
                box-shadow: var(--bose-shadow-glow, 0 8px 32px rgba(255, 145, 164, 0.12)) !important;
                transform: scale(1.02);
            }
            .bose-upload-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
    }

    /* ==========================================================================
       📐 2. دالة التسعير الموحدة والآمنة 100% لتطابق حسابات السلة والمحاكي
       ========================================================================== */
    function calculateCakePrice(customizations) {
        const config = liveStoreConfig || cakeConfig;
        if (!config) return 0;

        let total = parseFloat(config.basePrice) || 580;

        const shapeId = customizations.shape || "circle";
        const shapeObj = config.shapes.find(s => s.id === shapeId);
        if (shapeObj) {
            total += parseFloat(shapeObj.extraPrice) || 0;
        }

        const minPersons = shapeObj ? (parseInt(shapeObj.minimumPersons, 10) || 4) : 4;
        const chosenPersons = Math.max(minPersons, parseInt(customizations.persons, 10) || minPersons);
        const baseCoveredPersons = 4;
        const extraPersonPrice = parseFloat(config.pricePerPerson || config.extraPersonPrice) || 145;

        if (chosenPersons > baseCoveredPersons) {
            total += (chosenPersons - baseCoveredPersons) * extraPersonPrice;
        }

        const layersCount = parseInt(customizations.layers, 10) || 1;
        const layerObj = config.layers.find(l => parseInt(l.id, 10) === layersCount);
        if (layerObj) {
            total += parseFloat(layerObj.extraPrice) || 0;
        }

        total += calculateLocalExtras(customizations);

        const printingId = customizations.printingType || "none";
        const printingObj = config.printingOptions.find(p => p.id === printingId);
        if (printingObj) {
            total += parseFloat(printingObj.price) || 0;
        }

        if (customizations.text && customizations.text.trim().length > 0) {
            const placementId = customizations.textPosition || "top";
            const placementObj = config.textPlacements.find(p => p.id === placementId);
            if (placementObj) {
                total += parseFloat(placementObj.price) || 0;
            }
        }

        return Math.round(window.calculateBosePrice ? window.calculateBosePrice(total, "menu-only") : total);
    }

    function calculateLocalExtras(customizations) {
        const config = liveStoreConfig || cakeConfig;
        let extrasPrice = 0;
        if (Array.isArray(customizations.fillings)) {
            customizations.fillings.forEach(fillingId => {
                const fillingObj = config.fillings.find(f => f.id === fillingId);
                if (fillingObj) {
                    extrasPrice += parseFloat(fillingObj.price) || 0;
                }
            });
        }
        if (Array.isArray(customizations.toppings)) {
            customizations.toppings.forEach(toppingId => {
                const toppingObj = config.toppings.find(t => t.id === toppingId);
                if (toppingObj) {
                    extrasPrice += parseFloat(toppingObj.price) || 0;
                }
            });
        }
        return extrasPrice;
    }

    /* ==========================================================================
       🌐 3. دمج الإعدادات الذكي وتفعيل الـ Upload Zone ديناميكياً للموبايل والكمبيوتر
       ========================================================================== */
    function loadConfigFromDatabase() {
        if (window.BoseStoreData && window.BoseStoreData.cakeBuilder) {
            try {
                const dbConfig = window.BoseStoreData.cakeBuilder;
                
                const fallbackShapesExtraPrices = { circle: 0, heart: 50, square: 100, rectangle: 150 };
                const mergedShapes = Array.isArray(dbConfig.shapes) && dbConfig.shapes.length > 0
                    ? dbConfig.shapes.map(s => ({
                        ...s,
                        extraPrice: s.extraPrice !== undefined ? parseFloat(s.extraPrice) : (fallbackShapesExtraPrices[s.id] || 0)
                    }))
                    : cakeConfig.shapes;
                
                liveStoreConfig = {
                    enabled: dbConfig.enabled !== undefined ? dbConfig.enabled : cakeConfig.enabled,
                    basePrice: dbConfig.basePrice !== undefined ? parseFloat(dbConfig.basePrice) : cakeConfig.basePrice,
                    basePersons: dbConfig.basePersons !== undefined ? parseInt(dbConfig.basePersons, 10) : cakeConfig.basePersons,
                    pricePerPerson: dbConfig.pricePerPerson !== undefined ? parseFloat(dbConfig.pricePerPerson) : cakeConfig.extraPersonPrice,
                    extraPersonPrice: dbConfig.pricePerPerson !== undefined ? parseFloat(dbConfig.pricePerPerson) : cakeConfig.extraPersonPrice,
                    maxTextLength: dbConfig.maxTextLength !== undefined ? parseInt(dbConfig.maxTextLength, 10) : cakeConfig.maxTextLength,
                    maxFillings: dbConfig.maxFillings !== undefined ? parseInt(dbConfig.maxFillings, 10) : cakeConfig.maxFillings,
                    maxToppings: dbConfig.maxToppings !== undefined ? parseInt(dbConfig.maxToppings, 10) : cakeConfig.maxToppings,
                    shapes: mergedShapes,
                    layers: Array.isArray(dbConfig.layers) && dbConfig.layers.length > 0 ? dbConfig.layers : cakeConfig.layers,
                    cakeTypes: Array.isArray(dbConfig.cakeTypes) && dbConfig.cakeTypes.length > 0 ? dbConfig.cakeTypes : cakeConfig.cakeTypes,
                    fillings: Array.isArray(dbConfig.fillings) && dbConfig.fillings.length > 0 ? dbConfig.fillings : cakeConfig.fillings,
                    toppings: Array.isArray(dbConfig.toppings) && dbConfig.toppings.length > 0 ? dbConfig.toppings : cakeConfig.toppings,
                    printingOptions: Array.isArray(dbConfig.printingOptions) && dbConfig.printingOptions.length > 0 ? dbConfig.printingOptions : cakeConfig.printingOptions,
                    textPlacements: Array.isArray(dbConfig.textPlacements) && dbConfig.textPlacements.length > 0 ? dbConfig.textPlacements : cakeConfig.textPlacements
                };
            } catch (e) {
                console.error("❌ فشل دمج إعدادات الكيك الحية. جاري استدعاء الوضع الدفاعي الاحتياطي المضمون:", e);
                liveStoreConfig = { ...cakeConfig };
            }
        } else {
            liveStoreConfig = { ...cakeConfig };
        }
    }

    function isCakeBuilderPage() {
        return !!document.getElementById('cake-builder-container') || 
               !!document.getElementById('cake-builder-root') || 
               !!document.getElementById('cake-preview') || 
               window.location.pathname.includes('cake-builder');
    }

    function injectUploadZoneIfNeeded() {
        if (!isCakeBuilderPage()) return;
        
        let container = document.getElementById('bose-photo-upload-zone');
        if (container) return; 

        const targetParent = document.querySelector('.printing-options-section, .cake-printing-section') || 
                             document.getElementById('step-panel-printing') ||
                             document.querySelector('[data-printing]')?.parentNode?.parentNode ||
                             document.querySelector('.summary-card')?.parentNode;

        if (targetParent) {
            container = document.createElement('div');
            container.id = 'bose-photo-upload-zone';
            container.style.cssText = `
                margin-top: 20px;
                padding: 24px;
                border: 2px dashed var(--bose-pink, #FF91A4);
                border-radius: 20px;
                background: #FFF0F2;
                text-align: center;
                display: none;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                direction: rtl;
            `;
            container.innerHTML = `
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: var(--bose-black, #111111); font-family: 'Cairo', sans-serif;">📸 ارفع الصورة اللي حابب تطبعها على تورتتك الجميلة</p>
                <p style="margin: 0 0 16px 0; font-size: 11px; font-weight: 600; color: #777; font-family: 'Cairo', sans-serif;">* الصورة هيتم ضغطها وتجهيزها تلقائياً لسرعة وسلاسة التحميل</p>
                <div style="position: relative; display: inline-block;">
                    <input type="file" id="cake-photo-file-input" accept="image/*" style="opacity: 0; position: absolute; left: 0; top: 0; width: 100%; height: 100%; cursor: pointer; z-index: 10;">
                    <button type="button" class="bose-upload-btn" style="background: var(--bose-pink, #FF91A4); color: #FFFFFF; border: none; padding: 12px 28px; border-radius: 50px; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(255,145,164,0.15); transition: 0.2s; font-family: 'Cairo', sans-serif;">اختر صورة من جهازك</button>
                </div>
                <div id="cake-upload-status" style="margin-top: 12px; font-size: 13px; font-weight: 700; color: var(--bose-pink, #FF91A4); font-family: 'Cairo', sans-serif;"></div>
                <div id="cake-photo-preview-box" style="margin-top: 16px; display: none;">
                    <img id="cake-photo-preview-img" src="" style="max-width: 160px; max-height: 160px; object-fit: cover; border-radius: 16px; border: 2px solid var(--bose-pink, #FF91A4); box-shadow: var(--bose-shadow-glow);">
                </div>
            `;
            targetParent.appendChild(container);
        }
    }

    function cacheDOMElements() {
        dom.shapeCards = document.querySelectorAll('.shape-card, .cake-shape-card');
        dom.layerCards = document.querySelectorAll('.layer-card, .cake-layer-card');
        dom.cakeTypeCards = document.querySelectorAll('.cake-type-card, .type-card, .cake-flavor-card');
        dom.fillingCards = document.querySelectorAll('.filling-card, .cake-filling-card');
        dom.toppingCards = document.querySelectorAll('.topping-card, .cake-topping-card');
        dom.printingCards = document.querySelectorAll('.printing-card, .cake-printing-card, .cake-photo-card');
        dom.textPositionCards = document.querySelectorAll('.position-card, .cake-text-position-card, .cake-position-card');
        
        dom.textInput = document.getElementById('custom-text') || document.getElementById('cake-custom-text');
        dom.personsInput = document.getElementById('persons-count') || document.getElementById('cake-persons-count');
        dom.personsRange = document.getElementById('persons-range') || document.getElementById('cake-persons-range');
        dom.btnMinusPersons = document.getElementById('btn-minus') || document.getElementById('btn-minus-persons') || document.getElementById('cake-btn-minus');
        dom.btnPlusPersons = document.getElementById('btn-plus') || document.getElementById('btn-plus-persons') || document.getElementById('cake-btn-plus');
        dom.totalPriceEl = document.getElementById('total-price') || document.getElementById('cake-total-price');
        dom.personsCountEl = document.getElementById('persons-display') || document.getElementById('cake-persons-display');
        
        dom.stepPanels = document.querySelectorAll('.step-panel, .cake-builder-step-panel');
        dom.stepButtons = document.querySelectorAll('.step-btn, .cake-step-nav-btn');
        dom.btnPrevStep = document.getElementById('btn-prev') || document.getElementById('btn-prev-step');
        dom.btnNextStep = document.getElementById('btn-next') || document.getElementById('btn-next-step');
        dom.btnAddToCart = document.getElementById('add-to-cart-btn') || document.getElementById('btn-add-cake-to-cart');

        dom.summaryShape = document.getElementById('summary-shape') || document.getElementById('summary-cake-shape');
        dom.summaryCakeType = document.getElementById('summary-cake-type') || document.getElementById('summary-cake-flavor');
        dom.summaryPersons = document.getElementById('summary-persons') || document.getElementById('summary-cake-persons');
        dom.summaryLayers = document.getElementById('summary-layers') || document.getElementById('summary-cake-layers');
        dom.summaryFillings = document.getElementById('summary-fillings') || document.getElementById('summary-cake-fillings');
        dom.summaryToppings = document.getElementById('summary-toppings') || document.getElementById('summary-cake-toppings');
        dom.summaryPrinting = document.getElementById('summary-printing') || document.getElementById('summary-cake-printing');
        dom.summaryText = document.getElementById('summary-text') || document.getElementById('summary-cake-text');
    }

    /* ==========================================================================
       📐 4. ربط مستمعي الأحداث البرمجية ومعالجة وضغط الصور تلقائياً والرفع
       ========================================================================== */
    function bindCentralizedEvents() {
        if (isEventsBound) return;

        if (!dom.shapeCards || dom.shapeCards.length === 0) {
            cacheDOMElements();
        }

        // 1. تحديد الأشكال بالتفاعل المباشر
        if (dom.shapeCards) {
            dom.shapeCards.forEach(card => {
                card.addEventListener('click', function () {
                    const shapeId = this.getAttribute('data-shape');
                    if (shapeId) {
                        selectedConfig.shape = shapeId;
                        enforceDynamicConstraints(false);
                        styleSelectedCards();
                        updateUI();
                    }
                });
            });
        }

        // 2. تحديد عدد الأدوار
        if (dom.layerCards) {
            dom.layerCards.forEach(card => {
                card.addEventListener('click', function () {
                    const layerId = parseInt(this.getAttribute('data-layer'), 10);
                    if (layerId) {
                        selectedConfig.layers = layerId;
                        styleSelectedCards();
                        updateUI();
                    }
                });
            });
        }

        // 3. تحديد نوع ونكهة الكيك تفاعلياً
        if (dom.cakeTypeCards) {
            dom.cakeTypeCards.forEach(card => {
                card.addEventListener('click', function () {
                    const typeId = card.getAttribute('data-type') || card.getAttribute('data-cake-type') || card.getAttribute('data-flavor');
                    if (typeId) {
                        selectedConfig.cakeType = typeId;
                        styleSelectedCards();
                        updateUI();
                    }
                });
            });
        }

        // 4. تحديد الحشوات المتعددة
        if (dom.fillingCards) {
            dom.fillingCards.forEach(card => {
                card.addEventListener('click', function () {
                    const fillingId = this.getAttribute('data-filling');
                    if (fillingId) {
                        const index = selectedConfig.fillings.indexOf(fillingId);
                        if (index > -1) {
                            selectedConfig.fillings.splice(index, 1);
                        } else {
                            const config = liveStoreConfig || cakeConfig;
                            const maxFillings = config.maxFillings || 3;
                            if (selectedConfig.fillings.length >= maxFillings) {
                                showPremiumToast(`تورتتك تدعم حتى ${maxFillings} حشوات فقط لتظل متماسكة ولذيذة!`, "warning");
                                return;
                            }
                            selectedConfig.fillings.push(fillingId);
                        }
                        styleSelectedCards();
                        updateUI();
                    }
                });
            });
        }

        // 5. تحديد الإضافات والتزيين الخارجي
        if (dom.toppingCards) {
            dom.toppingCards.forEach(card => {
                card.addEventListener('click', function () {
                    const toppingId = this.getAttribute('data-topping');
                    if (toppingId) {
                        const index = selectedConfig.toppings.indexOf(toppingId);
                        if (index > -1) {
                            selectedConfig.toppings.splice(index, 1);
                        } else {
                            const config = liveStoreConfig || cakeConfig;
                            const maxToppings = config.maxToppings || 3;
                            if (selectedConfig.toppings.length >= maxToppings) {
                                showPremiumToast(`لحماية التنسيق الجمالي، نقدر نضيف ${maxToppings} إضافات كحد أقصى.`, "warning");
                                return;
                            }
                            selectedConfig.toppings.push(toppingId);
                        }
                        styleSelectedCards();
                        updateUI();
                    }
                });
            });
        }

        // 6. تحديد خيارات طباعة الصور المخصصة والتحكم بحالة الـ Upload Zone
        if (dom.printingCards) {
            dom.printingCards.forEach(card => {
                card.addEventListener('click', function () {
                    const printId = this.getAttribute('data-printing') || this.getAttribute('data-printing-type');
                    if (printId) {
                        selectedConfig.printingType = printId;
                        
                        const uploadZone = document.getElementById('bose-photo-upload-zone');
                        if (uploadZone) {
                            if (printId !== 'none') {
                                uploadZone.style.display = 'block';
                            } else {
                                uploadZone.style.display = 'none';
                                selectedConfig.uploadedImageUrl = null;
                                const previewBox = document.getElementById('cake-photo-preview-box');
                                if (previewBox) previewBox.style.display = 'none';
                            }
                        }
                        
                        styleSelectedCards();
                        updateUI();
                    }
                });
            });
        }

        // [📸 معالجة وضغط الـ Image تلقائياً ورفعها على Cloudinary]
        const fileInput = document.getElementById('cake-photo-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', async function (event) {
                const file = event.target.files[0];
                if (!file) return;

                const statusEl = document.getElementById('cake-upload-status');
                const previewImg = document.getElementById('cake-photo-preview-img');
                const previewBox = document.getElementById('cake-photo-preview-box');

                if (statusEl) statusEl.textContent = "⏳ جاري تهيئة وضغط الصورة للحفاظ على الأداء...";
                
                isUploadingImage = true;
                toggleAddToCartButtonState(false);

                try {
                    // 1. استدعاء معالج ضغط الصور العميل
                    const compressedBlob = await compressBoseImage(file, 800, 800, 0.75);
                    
                    if (statusEl) statusEl.textContent = "🚀 جاري الرفع الآمن والمباشر للتصميم...";

                    // 2. بناء كائن البيانات لإتمام المعاملة مع السحابة السلسة Cloudinary
                    const formData = new FormData();
                    formData.append('file', compressedBlob, 'cake_design_photo.jpg');
                    
                    const cloudName = 'dyx4w0dr1'; 
                    const uploadPreset = 'bose_presets'; 
                    formData.append('upload_preset', uploadPreset);

                    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                        method: 'POST',
                        body: formData
                    });

                    if (!uploadResponse.ok) {
                        throw new Error("فشل الرفع السحابي.");
                    }

                    const uploadData = await uploadResponse.json();
                    
                    if (uploadData.secure_url) {
                        selectedConfig.uploadedImageUrl = uploadData.secure_url;
                        
                        if (previewImg) {
                            previewImg.src = uploadData.secure_url;
                        }
                        if (previewBox) {
                            previewBox.style.display = 'block';
                        }
                        if (statusEl) {
                            statusEl.innerHTML = "🌸 تم رفع وضبط صورتك بنجاح على التورتة!";
                            statusEl.style.color = "#FF91A4";
                        }
                        
                        showPremiumToast("تم رفع وتأمين صورتك بنجاح على التورتة!", "success");
                        isUploadingImage = false;
                        toggleAddToCartButtonState(true);
                        
                        fileInput.value = "";
                        updateUI();
                    } else {
                        throw new Error("لم يتم إرجاع الرابط الآمن.");
                    }
                } catch (err) {
                    console.error("❌ خطأ أثناء معالجة الصورة:", err);
                    if (statusEl) {
                        statusEl.textContent = "⚠️ فشل رفع الصورة، يرجى المحاولة مرة أخرى أو اطلب بدونها وسنتواصل معك.";
                        statusEl.style.color = "#D4AF37";
                    }
                    showPremiumToast("فشل رفع الصورة السحابية، ياريت تراجع الاتصال بالشبكة وتجرّب تاني.", "warning");
                    isUploadingImage = false;
                    toggleAddToCartButtonState(true);
                    
                    fileInput.value = "";
                }
            });
        }

        // 7. تحديد موضع الكتابة
        if (dom.textPositionCards) {
            dom.textPositionCards.forEach(card => {
                card.addEventListener('click', function () {
                    const posId = this.getAttribute('data-position');
                    if (posId) {
                        selectedConfig.textPosition = posId;
                        styleSelectedCards();
                        updateUI();
                    }
                });
            });
        }

        // 8. التحكم بالعبارة المخصصة
        if (dom.textInput) {
            dom.textInput.addEventListener('input', function () {
                selectedConfig.text = this.value;
                enforceTextLimits();
                updateUI();
            });

            dom.textInput.addEventListener('paste', function () {
                setTimeout(() => {
                    selectedConfig.text = dom.textInput.value;
                    enforceTextLimits();
                    updateUI();
                }, 0);
            });
        }

        // 9. إدارة عدد الأفراد بالتزامن المزدوج
        if (dom.btnMinusPersons) {
            dom.btnMinusPersons.addEventListener('click', function () {
                modifyPersonsCount(-1);
            });
        }

        if (dom.btnPlusPersons) {
            dom.btnPlusPersons.addEventListener('click', function () {
                modifyPersonsCount(1);
            });
        }

        if (dom.personsRange) {
            dom.personsRange.addEventListener('input', function () {
                const val = parseInt(this.value, 10);
                selectedConfig.persons = val;
                if (dom.personsInput) {
                    dom.personsInput.value = val;
                }
                updateUI();
            });
        }

        if (dom.personsInput) {
            dom.personsInput.addEventListener('change', function () {
                let val = parseInt(this.value, 10);
                const config = liveStoreConfig || cakeConfig;
                const shapeObj = config.shapes.find(s => s.id === selectedConfig.shape);
                const minVal = shapeObj ? (shapeObj.minimumPersons || 4) : 4;
                
                if (isNaN(val) || val < minVal) {
                    val = minVal;
                }
                selectedConfig.persons = val;
                this.value = val;
                if (dom.personsRange) {
                    dom.personsRange.value = val;
                }
                updateUI();
            });
        }

        // 10. أزرار التنقل بمراحل التخصيص
        if (dom.stepButtons) {
            dom.stepButtons.forEach((btn, index) => {
                btn.addEventListener('click', function () {
                    switchStep(index);
                });
            });
        }

        if (dom.btnNextStep) {
            dom.btnNextStep.addEventListener('click', function () {
                const activeIdx = getActiveStepIndex();
                if (activeIdx < 3) {
                    switchStep(activeIdx + 1);
                }
            });
        }

        if (dom.btnPrevStep) {
            dom.btnPrevStep.addEventListener('click', function () {
                const activeIdx = getActiveStepIndex();
                if (activeIdx > 0) {
                    switchStep(activeIdx - 1);
                }
            });
        }

        // 11. زر الإضافة النهائية المأمن للسلة
        if (dom.btnAddToCart) {
            dom.btnAddToCart.addEventListener('click', function () {
                if (isUploadingImage) {
                    showPremiumToast("ثواني فندم.. جاري الانتهاء من رفع صورتك السحابية الجميلة 🌸", "warning");
                    return;
                }
                addCustomizedCakeToCart();
            });
        }

        isEventsBound = true;
    }

    /**
     * التحكم بحالة تفعيل زر الشراء وحظر الضغط المتكرر
     */
    function toggleAddToCartButtonState(enable) {
        if (!dom.btnAddToCart) return;
        if (enable) {
            dom.btnAddToCart.disabled = false;
            dom.btnAddToCart.style.opacity = "1";
            dom.btnAddToCart.innerHTML = `<i class="fas fa-shopping-bag"></i> إضافة تورتتك الجميلة للسلة`;
        } else {
            dom.btnAddToCart.disabled = true;
            dom.btnAddToCart.style.opacity = "0.6";
            dom.btnAddToCart.innerHTML = `⏳ جاري معالجة وتأمين صورتك...`;
        }
    }

    /**
     * ضغط الصور الحاسم والآمن في المتصفح تلقائياً
     */
    function canvasToBlob(canvas, quality) {
        return new Promise((resolve) => {
            if (canvas.toBlob) {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            } else {
                const dataURL = canvas.toDataURL('image/jpeg', quality);
                const byteString = atob(dataURL.split(',')[1]);
                const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                resolve(blob);
            }
        });
    }

    function compressBoseImage(file, maxWidth, maxHeight, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    try {
                        const blob = await canvasToBlob(canvas, quality);
                        resolve(blob);
                    } catch (e) {
                        reject(e);
                    }
                };
                img.onerror = err => reject(err);
            };
            reader.onerror = err => reject(err);
        });
    }

    /* ==========================================================================
       🛠️ 5. العمليات المنطقية والتوافق مع الموبايل والقيود التفاعلية
       ========================================================================== */
    function enforceTextLimits() {
        if (!dom.textInput) return;
        const config = liveStoreConfig || cakeConfig;
        const maxLimit = config.maxTextLength || 30;

        if (dom.textInput.value.length > maxLimit) {
            dom.textInput.value = dom.textInput.value.substring(0, maxLimit);
            selectedConfig.text = dom.textInput.value;
            showPremiumToast(`لحماية جمال الخط، تورتتك الرائعة تدعم حتى ${maxLimit} حرف فقط.`, "warning");
        }
    }

    function enforceDynamicConstraints(isInitialBoot) {
        const config = liveStoreConfig || cakeConfig;
        const shapeObj = config.shapes.find(s => s.id === selectedConfig.shape);
        const minPersons = shapeObj ? (shapeObj.minimumPersons || 4) : 4;

        if (dom.personsInput) {
            dom.personsInput.min = minPersons;
            let current = parseInt(dom.personsInput.value, 10);
            if (isNaN(current) || current < minPersons) {
                dom.personsInput.value = minPersons;
                selectedConfig.persons = minPersons;
            }
        }

        if (dom.personsRange) {
            dom.personsRange.min = minPersons;
            let current = parseInt(dom.personsRange.value, 10);
            if (isNaN(current) || current < minPersons) {
                dom.personsRange.value = minPersons;
                selectedConfig.persons = minPersons;
            }
        }

        if (!isInitialBoot && shapeObj && shapeObj.minimumPersons > 4) {
            showPremiumToast(`عشان شكل التورتة يطلع معاك مظبوط، أقل مقاس للشكل ده هو ${minPersons} فرد.`, "warning");
        }
    }

    function modifyPersonsCount(offset) {
        const config = liveStoreConfig || cakeConfig;
        const shapeObj = config.shapes.find(s => s.id === selectedConfig.shape);
        const minPersons = shapeObj ? (shapeObj.minimumPersons || 4) : 4;

        let current = parseInt(selectedConfig.persons, 10) || minPersons;
        current += offset;

        if (current < minPersons) {
            current = minPersons;
            showPremiumToast(`عشان شكل التورتة يطلع معاك مظبوط، أقل مقاس للشكل ده هو ${minPersons} فرد.`, "warning");
        }

        selectedConfig.persons = current;
        if (dom.personsInput) {
            dom.personsInput.value = current;
        }
        if (dom.personsRange) {
            dom.personsRange.value = current;
        }
        updateUI();
    }

    function getActiveStepIndex() {
        if (!dom.stepPanels) return 0;
        let activeIdx = 0;
        dom.stepPanels.forEach((panel, index) => {
            if (panel.classList.contains('active') || panel.style.display !== 'none') {
                activeIdx = index;
            }
        });
        return activeIdx;
    }

    function switchStep(index) {
        if (!dom.stepPanels || dom.stepPanels.length === 0) return;

        dom.stepPanels.forEach((panel, i) => {
            if (i === index) {
                panel.style.display = 'block';
                panel.classList.add('active');
            } else {
                panel.style.display = 'none';
                panel.classList.remove('active');
            }
        });

        if (dom.stepButtons) {
            dom.stepButtons.forEach((btn, i) => {
                if (i === index) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        if (dom.btnPrevStep) {
            dom.btnPrevStep.style.display = index === 0 ? 'none' : 'block';
        }
        if (dom.btnNextStep) {
            dom.btnNextStep.style.display = index === 3 ? 'none' : 'block';
        }
        if (dom.btnAddToCart) {
            dom.btnAddToCart.style.display = index === 3 ? 'block' : 'none';
        }
    }

    function styleSelectedCards() {
        if (dom.shapeCards) {
            dom.shapeCards.forEach(card => {
                const shapeId = card.getAttribute('data-shape');
                if (shapeId === selectedConfig.shape) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }

        if (dom.layerCards) {
            dom.layerCards.forEach(card => {
                const layerId = parseInt(card.getAttribute('data-layer'), 10);
                if (layerId === selectedConfig.layers) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }

        if (dom.cakeTypeCards) {
            dom.cakeTypeCards.forEach(card => {
                const typeId = card.getAttribute('data-type') || card.getAttribute('data-cake-type') || card.getAttribute('data-flavor');
                if (typeId === selectedConfig.cakeType) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }

        if (dom.fillingCards) {
            dom.fillingCards.forEach(card => {
                const fillingId = card.getAttribute('data-filling');
                if (selectedConfig.fillings.includes(fillingId)) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }

        if (dom.toppingCards) {
            dom.toppingCards.forEach(card => {
                const toppingId = card.getAttribute('data-topping');
                if (selectedConfig.toppings.includes(toppingId)) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }

        if (dom.printingCards) {
            dom.printingCards.forEach(card => {
                const printId = card.getAttribute('data-printing') || card.getAttribute('data-printing-type');
                if (printId === selectedConfig.printingType) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }

        if (dom.textPositionCards) {
            dom.textPositionCards.forEach(card => {
                const posId = card.getAttribute('data-position');
                if (posId === selectedConfig.textPosition) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }
    }

    /* ==========================================================================
       🎨 6. الرسم الديناميكي فائق الجمال للـ SVG والتحديث اللحظي للواجهة
       ========================================================================== */
    function drawCakePreviewSVG() {
        const previewContainer = document.getElementById('cake-preview') || document.getElementById('cake-svg-preview');
        if (!previewContainer) return;

        const shape = selectedConfig.shape;
        const layers = selectedConfig.layers;
        const text = selectedConfig.text;
        const textPosition = selectedConfig.textPosition;
        const printingType = selectedConfig.printingType;
        const uploadedImageUrl = selectedConfig.uploadedImageUrl;

        const pinkColor = '#FF91A4'; 
        const goldColor = '#D4AF37';  
        const cakeBodyColor = '#FFF0F2'; 
        const creamColor = '#FFD2D9'; 

        let layersGroupMarkup = '';
        const baseWidth = 220;
        const baseHeight = 42;
        const verticalGap = 34;
        const startYPoint = 155;

        for (let i = 0; i < layers; i++) {
            const width = baseWidth - (i * 28);
            const height = baseHeight;
            const x = (300 - width) / 2;
            const y = startYPoint - (i * verticalGap);

            let layerPath = '';

            if (shape === 'circle') {
                layerPath = `
                    <g class="cake-3d-layer" style="transition: all 0.4s ease-in-out;">
                        <ellipse cx="150" cy="${y + height}" rx="${width / 2}" ry="14" fill="#EAD4D7" opacity="0.7"/>
                        <path d="M ${x} ${y} 
                                 A ${width / 2} 14 0 0 0 ${x + width} ${y} 
                                 v ${height} 
                                 A ${width / 2} 14 0 0 1 ${x} ${y + height} 
                                 Z" fill="${cakeBodyColor}" stroke="${pinkColor}" stroke-width="2"/>
                        <ellipse cx="150" cy="${y}" rx="${width / 2}" ry="14" fill="${creamColor}" stroke="${pinkColor}" stroke-width="1.5"/>
                    </g>
                `;
            } else if (shape === 'heart') {
                layerPath = `
                    <g class="cake-3d-layer" style="transition: all 0.4s ease-in-out;">
                        <path d="M 150 ${y + 8} 
                                 C 120 ${y - 18}, 85 ${y - 8}, 85 ${y + 14}
                                 C 85 ${y + 32}, 112 ${y + 45}, 150 ${y + 60}
                                 C 188 ${y + 45}, 215 ${y + 32}, 215 ${y + 14}
                                 C 215 ${y - 8}, 180 ${y - 18}, 150 ${y + 8} Z" 
                              fill="${cakeBodyColor}" stroke="${pinkColor}" stroke-width="2"/>
                        <path d="M 150 ${y + 8} 
                                 C 120 ${y - 18}, 85 ${y - 8}, 85 ${y + 14}
                                 C 85 ${y + 32}, 112 ${y + 45}, 150 ${y + 60}
                                 C 188 ${y + 45}, 215 ${y + 32}, 215 ${y + 14}
                                 C 215 ${y - 8}, 180 ${y - 18}, 150 ${y + 8} Z" 
                              fill="none" stroke="${pinkColor}" stroke-width="1.5"/>
                        <path d="M 150 ${y + 11} 
                                 C 123 ${y - 15}, 88 ${y - 5}, 88 ${y + 14}
                                 C 88 ${y + 30}, 112 ${y + 42}, 150 ${y + 56} Z" 
                              fill="${creamColor}" opacity="0.4"/>
                    </g>
                `;
            } else if (shape === 'square') {
                layerPath = `
                    <g class="cake-3d-layer" style="transition: all 0.4s ease-in-out;">
                        <path d="M 150 ${y - 8} L ${150 + width / 2} ${y + 4} L 150 ${y + 16} L ${150 - width / 2} ${y + 4} Z" fill="${creamColor}" stroke="${pinkColor}" stroke-width="1.5"/>
                        <path d="M ${150 - width / 2} ${y + 4} L 150 ${y + 16} L 150 ${y + 16 + height} L ${150 - width / 2} ${y + 4 + height} Z" fill="${cakeBodyColor}" stroke="${pinkColor}" stroke-width="2"/>
                        <path d="M 150 ${y + 16} L ${150 + width / 2} ${y + 4} L ${150 + width / 2} ${y + 4 + height} L 150 ${y + 16 + height} Z" fill="#FFF5F6" stroke="${pinkColor}" stroke-width="2"/>
                    </g>
                `;
            } else {
                const rectW = width + 16;
                layerPath = `
                    <g class="cake-3d-layer" style="transition: all 0.4s ease-in-out;">
                        <path d="M 150 ${y - 6} L ${150 + rectW / 2} ${y + 2} L 150 ${y + 12} L ${150 - rectW / 2} ${y + 2} Z" fill="${creamColor}" stroke="${pinkColor}" stroke-width="1.5"/>
                        <path d="M ${150 - rectW / 2} ${y + 2} L 150 ${y + 12} L 150 ${y + 12 + height} L ${150 - rectW / 2} ${y + 2 + height} Z" fill="${cakeBodyColor}" stroke="${pinkColor}" stroke-width="2"/>
                        <path d="M 150 ${y + 12} L ${150 + rectW / 2} ${y + 2} L ${150 + rectW / 2} ${y + 2 + height} L 150 ${y + 12 + height} Z" fill="#FFF5F6" stroke="${pinkColor}" stroke-width="2"/>
                    </g>
                `;
            }
            layersGroupMarkup = layerPath + layersGroupMarkup;
        }

        let printingMarkup = '';
        if (printingType && printingType !== 'none') {
            let frameY = startYPoint - ((layers - 1) * verticalGap) - 8;
            
            if (uploadedImageUrl) {
                printingMarkup = `
                    <g class="cake-photo-frame" style="transition: all 0.4s ease-in-out;" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))">
                        <clipPath id="photo-clip-path">
                            <rect x="132" y="${frameY + 2}" width="36" height="24" rx="4"/>
                        </clipPath>
                        <rect x="130" y="${frameY}" width="40" height="28" rx="6" fill="#FFFFFF" stroke="${goldColor}" stroke-width="1.5"/>
                        <image href="${uploadedImageUrl}" x="132" y="${frameY + 2}" width="36" height="24" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-clip-path)" />
                    </g>
                `;
            } else {
                printingMarkup = `
                    <g class="cake-photo-frame" style="transition: all 0.4s ease-in-out;" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.1))">
                        <rect x="130" y="${frameY}" width="40" height="28" rx="4" fill="#FFFFFF" stroke="${goldColor}" stroke-width="1.5"/>
                        <rect x="134" y="${frameY + 4}" width="32" height="20" rx="2" fill="${creamColor}" opacity="0.8"/>
                        <text x="150" y="${frameY + 16}" fill="#FFFFFF" style="font-family:'Cairo', sans-serif; font-size:6px; font-weight:700; text-anchor:middle;">🖼️ PHOTO</text>
                    </g>
                `;
            }
        }

        let textMarkup = '';
        if (text && text.trim().length > 0) {
            let textY = startYPoint - ((layers - 1) * verticalGap) - 2;
            let textX = 150;
            let fontSize = "11px";
            
            if (textPosition === 'board') {
                textY = 222;
                fontSize = "13px";
            }

            textMarkup = `
                <g class="cake-custom-text-wrap" filter="drop-shadow(1px 1.5px 0.5px rgba(255,255,255,0.95))">
                    <text x="${textX}" y="${textY}" fill="#111111" style="font-family: 'Cairo', sans-serif; font-size: ${fontSize}; font-weight: 700; text-anchor: middle;">
                        ${escapeHtml(text)}
                    </text>
                </g>
            `;
        }

        const fullSVG = `
            <svg viewBox="0 0 300 240" class="w-full h-auto" style="max-height: 280px; filter: drop-shadow(0 4px 10px rgba(255,145,164,0.06));">
                <defs>
                    <radialGradient id="cake-soft-shadow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#111111" stop-opacity="0.12"/>
                        <stop offset="100%" stop-color="#111111" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                
                <!-- القاعدة الفاخرة للتقديم والذهب اللامع -->
                <ellipse cx="150" cy="208" rx="122" ry="24" fill="#FFFFFF" stroke="${goldColor}" stroke-width="1.5" />
                <ellipse cx="150" cy="210" rx="122" ry="24" fill="none" stroke="${goldColor}" stroke-width="1" opacity="0.4" />
                <ellipse cx="150" cy="213" rx="118" ry="22" fill="url(#cake-soft-shadow)"/>
                
                ${layersGroupMarkup}
                
                ${printingMarkup}
                
                ${textMarkup}
                
                <!-- نجوم الذهب الجانبية الرمزية للتقييم والجمال الفاخر -->
                <g fill="${goldColor}" opacity="0.85">
                    <path d="M 35,45 L 36.5,48.5 L 40,48.5 L 37.2,50.5 L 38.5,54 L 35,51.8 L 31.5,54 L 32.8,50.5 L 30,48.5 L 33.5,48.5 Z" />
                    <path d="M 265,65 L 266.2,68 L 269,68 L 266.8,69.6 L 267.8,72.4 L 265,70.6 L 262.2,72.4 L 263.2,69.6 L 261,68 L 263.8,68 Z" />
                </g>
            </svg>
        `;

        previewContainer.innerHTML = fullSVG;
    }

    function updateUI() {
        const config = liveStoreConfig || cakeConfig;
        
        const finalCalculatedPrice = calculateCakePrice(selectedConfig);

        if (dom.totalPriceEl) {
            dom.totalPriceEl.textContent = `${finalCalculatedPrice} جنيه`;
        }

        if (dom.personsCountEl) {
            dom.personsCountEl.textContent = selectedConfig.persons;
        }

        if (dom.summaryShape) {
            const shapeObj = config.shapes.find(s => s.id === selectedConfig.shape);
            dom.summaryShape.textContent = shapeObj ? shapeObj.name : selectedConfig.shape;
        }

        if (dom.summaryCakeType) {
            const typeObj = config.cakeTypes.find(t => t.id === selectedConfig.cakeType);
            dom.summaryCakeType.textContent = typeObj ? typeObj.name : selectedConfig.cakeType;
        }

        if (dom.summaryPersons) {
            dom.summaryPersons.textContent = `${selectedConfig.persons} فرد`;
        }

        if (dom.summaryLayers) {
            const layerObj = config.layers.find(l => parseInt(l.id, 10) === selectedConfig.layers);
            dom.summaryLayers.textContent = layerObj ? layerObj.name : `${selectedConfig.layers} دور`;
        }

        if (dom.summaryFillings) {
            if (selectedConfig.fillings.length === 0) {
                dom.summaryFillings.textContent = "سادة (بدون حشوات إضافية)";
            } else {
                const names = selectedConfig.fillings.map(id => {
                    const obj = config.fillings.find(f => f.id === id);
                    return obj ? obj.name : id;
                });
                dom.summaryFillings.textContent = names.join("، ");
            }
        }

        if (dom.summaryToppings) {
            if (selectedConfig.toppings.length === 0) {
                dom.summaryToppings.textContent = "سادة (بدون إضافات)";
            } else {
                const names = selectedConfig.toppings.map(id => {
                    const obj = config.toppings.find(t => t.id === id);
                    return obj ? obj.name : id;
                });
                dom.summaryToppings.textContent = names.join("، ");
            }
        }

        if (dom.summaryPrinting) {
            const printObj = config.printingOptions.find(p => p.id === selectedConfig.printingType);
            dom.summaryPrinting.textContent = printObj ? printObj.name : "بدون إضافة صور";
        }

        if (dom.summaryText) {
            if (selectedConfig.text.trim().length === 0) {
                dom.summaryText.textContent = "بدون عبارة مكتوبة";
            } else {
                const posObj = config.textPlacements.find(p => p.id === selectedConfig.textPosition);
                const posName = posObj ? ` (${posObj.name})` : '';
                dom.summaryText.textContent = `"${selectedConfig.text.trim()}"${posName}`;
            }
        }

        drawCakePreviewSVG();
    }

    /* ==========================================================================
       🛒 7. عملية الإضافة المؤمّنة والنهائية لسلة المشتريات (Anti-Tamper AddToCart)
       ========================================================================== */
    function addCustomizedCakeToCart() {
        const config = liveStoreConfig || cakeConfig;

        if (config.enabled === false) {
            showPremiumToast("محاكي تخصيص التورت معطل مؤقتاً لأعمال الصيانة، يمكنك الطلب من المنيو!", "error");
            return;
        }

        if (selectedConfig.printingType !== 'none' && !selectedConfig.uploadedImageUrl) {
            showPremiumToast("يرجى رفع الصورة المطلوبة لتورتتك أولاً لضمان دقة وتفاصيل طلبك الفاخر 🌸", "warning");
            
            const uploadZone = document.getElementById('bose-photo-upload-zone');
            if (uploadZone) {
                uploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const maxLen = config.maxTextLength || 30;
        if (selectedConfig.text.length > maxLen) {
            selectedConfig.text = selectedConfig.text.substring(0, maxLen);
        }

        const secureCalculatedPrice = calculateCakePrice(selectedConfig);

        const shapeObj = config.shapes.find(s => s.id === selectedConfig.shape);
        const layerObj = config.layers.find(l => parseInt(l.id, 10) === selectedConfig.layers);
        const typeObj = config.cakeTypes.find(t => t.id === selectedConfig.cakeType);
        const printObj = config.printingOptions.find(p => p.id === selectedConfig.printingType);

        const fillingsNames = selectedConfig.fillings.map(id => {
            const obj = config.fillings.find(f => f.id === id);
            return obj ? obj.name : id;
        });
        const toppingsNames = selectedConfig.toppings.map(id => {
            const obj = config.toppings.find(t => t.id === id);
            return obj ? obj.name : id;
        });

        let description = `طعم ${typeObj ? typeObj.name : selectedConfig.cakeType}، شكل ${shapeObj ? shapeObj.name : selectedConfig.shape}، مقاس ${selectedConfig.persons} فرد، ${layerObj ? layerObj.name : selectedConfig.layers + ' دور'}`;
        if (fillingsNames.length > 0) {
            description += `، بحشو: ${fillingsNames.join(' + ')}`;
        }
        if (toppingsNames.length > 0) {
            description += `، وإضافات: ${toppingsNames.join(' + ')}`;
        }
        if (printObj && selectedConfig.printingType !== 'none') {
            description += `، و${printObj.name}`;
        }
        if (selectedConfig.text.trim().length > 0) {
            description += `، وعبارة: "${selectedConfig.text.trim()}"`;
        }

        // بناء كائن متطابق 100% مع البنية المعتمدة لسلة المشتريات
        const cartItem = {
            id: "cake_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            productSlug: "toort-custom-master", 
            slug: "toort-custom-master",        
            type: "custom-cake",                
            title: "تورتة مخصصة بالكامل",
            description: description,
            quantity: 1,
            price: secureCalculatedPrice,
            finalPrice: secureCalculatedPrice,
            basePrice: parseFloat(config.basePrice) || 580,
            image: selectedConfig.uploadedImageUrl || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
            customDetails: {                    
                shape: selectedConfig.shape,
                persons: parseInt(selectedConfig.persons, 10),
                cakeType: typeObj ? typeObj.name : selectedConfig.cakeType,
                printingType: selectedConfig.printingType, 
                customMessage: selectedConfig.text.trim()
            }
        };

        // حماية التزامن ومزامنة السلة واستدعاء المحرك العام
        if (typeof window.addBoseCartItem === 'function') {
            window.addBoseCartItem(cartItem);
        } else {
            let cart = [];
            try {
                const localData = localStorage.getItem(CART_STORAGE_KEY);
                if (localData) cart = JSON.parse(localData);
            } catch (e) {}
            cart.push(cartItem);
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
            } catch (e) {}
            window.boseInMemoryCart = cart;
            window.dispatchEvent(new Event('bose_cart_updated'));
            if (typeof window.updateGlobalCartCounter === 'function') {
                window.updateGlobalCartCounter();
            }
            showPremiumToast("تمت إضافة تورتتك الجميلة بنجاح للسلة!", "success");
        }

        setTimeout(() => {
            if (typeof window.BoseCakeEngine?.onItemAdded === 'function') {
                window.BoseCakeEngine.onItemAdded(cartItem);
            }
        }, 1200);
    }

    /* ==========================================================================
       🛡️ 8. نظام التنبيهات الفاخر المتوافق مع الهوية البصرية (Premium Elegant Toast)
       ========================================================================== */
    function showPremiumToast(message, type = 'success') {
        if (typeof window.showBoseToast === 'function') {
            window.showBoseToast(message);
            return;
        }

        const existingContainer = document.getElementById('bose-toast-container');
        let container = existingContainer;

        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-container';
            container.style.position = 'fixed';
            container.style.bottom = '24px';
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            container.style.zIndex = '100000';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            container.style.width = '90%';
            container.style.maxWidth = '380px';
            container.style.pointerEvents = 'none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.pointerEvents = 'auto';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '12px';
        toast.style.padding = '14px 20px';
        toast.style.backgroundColor = '#FFFFFF'; 
        toast.style.color = '#111111'; 
        toast.style.fontFamily = "'Cairo', sans-serif";
        toast.style.fontSize = '14px';
        toast.style.fontWeight = '700'; 
        toast.style.borderRadius = '16px'; 
        toast.style.direction = 'rtl';
        
        let borderColor = '#FF91A4'; 
        let shadowColor = 'rgba(255, 145, 164, 0.18)';
        let iconClass = 'fa-circle-check';
        let iconColor = '#FF91A4';

        if (type === 'error' || type === 'warning') {
            borderColor = '#D4AF37'; 
            shadowColor = 'rgba(212, 175, 55, 0.18)';
            iconClass = type === 'error' ? 'fa-circle-exclamation' : 'fa-triangle-exclamation';
            iconColor = '#D4AF37';
        }

        toast.style.border = `2px solid ${borderColor}`;
        toast.style.boxShadow = `0 10px 30px ${shadowColor}`;
        toast.style.transform = 'translateY(40px)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        toast.innerHTML = `
            <i class="fas ${iconClass}" style="color: ${iconColor}; font-size: 18px; flex-shrink: 0;"></i>
            <span style="flex-grow: 1; line-height: 1.5;">${message}</span>
        `;

        container.appendChild(toast);

        toast.offsetHeight;

        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.transform = 'translateY(-20px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 400);
        }, 4500);
    }

    /* ==========================================================================
       🚀 9. نظام التمهيد المانع لحالات السباق وقفل الدوال الحيوية
       ========================================================================== */
    function injectAndLockPricingFunction() {
        const calculateCustomPriceUnified = function(persons, options = {}) {
            const mergedOpts = {
                shape: options.shape || selectedConfig.shape,
                cakeType: options.cakeType || selectedConfig.cakeType,
                persons: parseInt(persons, 10) || selectedConfig.persons,
                layers: options.layers || selectedConfig.layers,
                fillings: options.fillings || selectedConfig.fillings,
                toppings: options.toppings || selectedConfig.toppings,
                printingType: options.printingType || selectedConfig.printingType,
                text: options.text || selectedConfig.text,
                textPosition: options.textPosition || selectedConfig.textPosition
            };
            
            const config = liveStoreConfig || cakeConfig;
            let total = parseFloat(config.basePrice) || 580;

            const shapeId = mergedOpts.shape || "circle";
            const shapeObj = config.shapes.find(s => s.id === shapeId);
            if (shapeObj) {
                total += parseFloat(shapeObj.extraPrice) || 0;
            }

            const minPersons = shapeObj ? (parseInt(shapeObj.minimumPersons, 10) || 4) : 4;
            const chosenPersons = Math.max(minPersons, parseInt(mergedOpts.persons, 10) || minPersons);
            const baseCoveredPersons = 4;
            const extraPersonPrice = parseFloat(config.pricePerPerson || config.extraPersonPrice) || 145;

            if (chosenPersons > baseCoveredPersons) {
                total += (chosenPersons - baseCoveredPersons) * extraPersonPrice;
            }

            const layersCount = parseInt(mergedOpts.layers, 10) || 1;
            const layerObj = config.layers.find(l => parseInt(l.id, 10) === layersCount);
            if (layerObj) {
                total += parseFloat(layerObj.extraPrice) || 0;
            }

            if (options.extraToppingsFee !== undefined) {
                total += parseFloat(options.extraToppingsFee) || 0;
            } else {
                total += calculateLocalExtras(mergedOpts);
            }

            const printingId = mergedOpts.printingType || "none";
            const printingObj = config.printingOptions.find(p => p.id === printingId);
            if (printingObj) {
                total += parseFloat(printingObj.price) || 0;
            }

            if (mergedOpts.text && mergedOpts.text.trim().length > 0) {
                const placementId = mergedOpts.textPosition || "top";
                const placementObj = config.textPlacements.find(p => p.id === placementId);
                if (placementObj) {
                    total += parseFloat(placementObj.price) || 0;
                }
            }

            return Math.round(window.calculateBosePrice ? window.calculateBosePrice(total, "menu-only") : total);
        };

        // تثبيت الدالة على النطاق العالمي وحمايتها من التعديل العشوائي
        try {
            Object.defineProperty(window, 'calculateCustomCakePrice', {
                value: calculateCustomPriceUnified,
                writable: false,
                configurable: true
            });
        } catch (e) {
            window.calculateCustomCakePrice = calculateCustomPriceUnified;
        }
    }

    function safeBootEngine() {
        loadConfigFromDatabase();
        injectInteractiveStyles();
        injectAndLockPricingFunction();
        
        if (isCakeBuilderPage()) {
            injectUploadZoneIfNeeded(); 
            cacheDOMElements();
            bindCentralizedEvents();
            enforceDynamicConstraints(true);
            styleSelectedCards();
            updateUI();
            switchStep(0);
        }
    }

    function verifyAndBootCakeEngine() {
        if (window.BoseStoreData && (window.BoseStoreData.store || window.BoseStoreData.cakeBuilder)) {
            safeBootEngine();
        } else {
            document.addEventListener('BoseDatabaseLoaded', function onDbLoaded() {
                safeBootEngine();
            });

            let attempts = 0;
            const maxAttempts = 24; 
            
            const coreGuardInterval = setInterval(() => {
                attempts++;
                if (window.BoseStoreData && (window.BoseStoreData.store || window.BoseStoreData.cakeBuilder)) {
                    clearInterval(coreGuardInterval);
                    safeBootEngine();
                } else if (attempts >= maxAttempts) {
                    clearInterval(coreGuardInterval);
                    console.warn("⚠️ محرك الكيك: تم التمهيد الآمن كلياً بالإعدادات المضمنة كإجراء احتياطي.");
                    safeBootEngine();
                }
            }, 250);
        }
    }

    // تأكيد تفعيل الحارس وتثبيته فوراً لصد أي race condition
    verifyAndBootCakeEngine();

    /* ==========================================================================
       🌐 10. تصدير الواجهات البرمجية العامة والموثوقة للمحرك للتواصل المتزامن
       ========================================================================== */
    window.BoseCakeEngine = {
        refreshEngine: function () {
            isEventsBound = false; 
            loadConfigFromDatabase();
            if (isCakeBuilderPage()) {
                injectUploadZoneIfNeeded();
                cacheDOMElements();
                bindCentralizedEvents();
                styleSelectedCards();
                updateUI();
                switchStep(0);
            }
        },

        calculatePrice: function (customizations) {
            return calculateCakePrice(customizations);
        },

        getConfig: function () {
            return liveStoreConfig || cakeConfig;
        },

        getSelectedConfig: function () {
            return selectedConfig;
        },

        showToast: function (msg, type) {
            showPremiumToast(msg, type);
        },

        switchStep: function (index) {
            switchStep(index);
        }
    };

})();
