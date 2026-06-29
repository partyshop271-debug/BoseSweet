/**
 * 👑 المحرك المركزي العالمي وعمليات الفحص المالي - حلويات بوسي 👑
 * النسخة الهندسية القياسية والمطورة بنسبة 100% - الإصدار الذهبي المصحح بالكامل والخالي من الثغرات V6.5
 * يتوافق بشكل مطلق مع: cart-engine.js وقاعدة البيانات site-data-final.json ومعايير الأداء والموبايل أولاً
 * [تم حل ثغرات التزامن اللامتناهي، وحالات السباق، وحماية الهوية البصرية، وتأمين الأداء على الموبايل والاستضافات المجانية]
 */

(function () {
    "use strict";

    // ==========================================================================
    // 1. تهيئة وتثبيت المتغيرات الحاكمة على النطاق العالمي لضمان جاهزيتها الفورية
    // ==========================================================================
    window.BoseStoreData = window.BoseStoreData || null;
    window.boseServerTimeOffset = window.boseServerTimeOffset || 0; 
    window.boseDatabaseLoading = false; 
    window.boseInMemoryCart = window.boseInMemoryCart || []; 
    
    let databaseResolvers = [];
    const CART_STORAGE_KEY = 'bose_cart';
    let searchDebounceTimeout = null;

    // كاش داخلي لتأمين أقصى سرعة أداء على الهواتف المحمولة ومنع تكرار عمليات قراءة الـ DOM
    const domCache = {
        cartCounts: null,
        searchModal: null,
        resultsContainer: null,
        logoImages: null
    };

    // مسارات التحميل التلقائية المتتالية لضمان استقرار الاستدعاء تحت أي بيئة استضافة مجانية
    const DATABASE_PATHS = [
        './data/site-data-final.json',
        'data/site-data-final.json',
        '../data/site-data-final.json',
        './site-data-final.json',
        'site-data-final.json',
        '../site-data-final.json',
        '../../site-data-final.json'
    ];

    // ==========================================================================
    // منع حالات السباق (Race Conditions) بتهيئة الـ Promise فوراً لمنع تكرار الإنشاء اللامتزامن
    // ==========================================================================
    window.boseDbPromise = window.boseDbPromise || new Promise((resolve) => {
        if (window.BoseStoreData) {
            resolve(window.BoseStoreData);
        } else {
            databaseResolvers.push(resolve);
        }
    });
    window.boseDbFetchPromise = window.boseDbPromise;

    /**
     * قاعدة بيانات احتياطية صلبة لتأمين التشغيل الفوري والكامل للموقع في حال انقطاع خادم الاستضافة
     */
    const BOSE_FALLBACK_DATABASE = {
        "store": {
            "id": "bose-sweets",
            "name": "حلويات بوسي",
            "slogan": "صنعناها بحب لتهديها لمن تحب",
            "currency": "EGP",
            "phone": "01097238441",
            "logo": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
            "theme": { "primary": "#FF91A4", "secondary": "#D4AF37", "text": "#111111", "background": "#FFFFFF" },
            "font": "Cairo",
            "priceIncrease": {
                "enabled": false,
                "percent": 0,
                "applyOn": "menu-only"
            },
            "pickup": {
                "address": "الكفاح شارع الوحدة المحلية بجوار صيدلية الدكتور احمد مجدي وبجوار عيادة الدكتور علي",
                "mapUrl": "https://maps.app.goo.gl/nAg4Y7vQ7hACvKGc8?g_st=ac",
                "shippingFee": 0,
                "message": "لا توجد رسوم شحن عند الاستلام من الفرع."
            }
        },
        "orderRules": {
            "minPreparationTimeHours": 24,
            "preparationTimeMessage": "نحتاج إلى وقت كافٍ لتجهيز طلبك بأفضل جودة ممكنة، لذلك لا يمكن اختيار موعد قبل 24 ساعة من وقت تأكيد الطلب."
        },
        "seo": {
            "title": "حلويات بوسي | صنعناها بحب لتهديها لمن تحب",
            "description": "منصة بيع إلكترونية متكاملة لعلامة حلويات بوسي الفاخرة. استمتع بتجربة تسوق فريدة، صمم تورتتك الخاصة وبوكيه الورد المخصص عبر محاكياتنا التفاعلية الفريدة.",
            "keywords": ["حلويات", "تورت", "بوكس هدايا", "كاب كيك", "سينابون", "ورد", "دوناتس", "حلويات بوسي"],
            "ogImage": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"
        },
        "social": {
            "facebook": "https://www.facebook.com/share/1H1vVMHyu9/",
            "instagram": "https://www.instagram.com/bose_sweets?igsh=amdkMmhxMXJyanYy",
            "tiktok": "https://www.tiktok.com/@bosesweets1?_r=1&_t=ZS-96lRDDHq9QK",
            "whatsapp": "01097238441"
        },
        "navigation": {
            "showSearch": true,
            "showCart": true,
            "topBarMessages": [
                "كل قطعة من حلويات بوسي صنعت يدوياً بحب وشغف لتليق بمناسباتكم السعيدة 🌸",
                "مكونات طبيعية 100% طازجة يومياً للحصول على الطعم الأصلي الفاخر ✨",
                "تميزوا بهداياكم وجلساتكم الفاخرة مع تشكيلة بوكس الروقان وكبات السعادة 👑"
            ]
        },
        "homepage": {
            "hero": {
                "title": "عقد من التميز في صناعة الحلويات",
                "description": "تم اختيار المكونات بعناية فائقة للحصول على أفضل جودة تليق بمناسباتكم السعيدة وتضمن ثقتكم الدائمة."
            },
            "waterfall": {
                "columns": 2,
                "imageSize": "320px",
                "leftColumnImages": [
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wl1",
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wl2"
                ],
                "rightColumnImages": [
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wr1",
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wr2"
                ]
            },
            "excellence": {
                "title": "عقد من الإتقان",
                "description": "خلف كل قطعة حكاية شغف وتفاصيل محفورة بالدقة والمهارة الفائقة لتقديم تجربة تذوق ساحرة تأخذكم لعالم من الفخامة والروقان.",
                "images": [
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=ex1",
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=ex2",
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=ex3"
                ]
            },
            "pride": {
                "title": "الفخر والاعتزاز",
                "stats": {
                    "years": { "value": 10, "suffix": "+", "label": "سنوات خبرة" },
                    "customers": { "value": 10000, "suffix": "+", "label": "عميل" },
                    "orders": { "value": 10000, "suffix": "+", "label": "طلب ناجح" },
                    "cakes": { "value": 5000, "suffix": "+", "label": "التورت المصممة" },
                    "bouquets": { "value": 3000, "suffix": "+", "label": "منسقة بحب" }
                }
            },
            "mostSelling": [
                "toort-custom-master",
                "gateaux-royal",
                "qashtota-lotus-new",
                "despacito-pistachio-new",
                "cinabon-classic",
                "donuts-matilda",
                "happiness-cups-nutella",
                "relax-box"
            ],
            "newArrivals": [
                "despacito-pistachio-new",
                "qashtota-lotus-new",
                "donuts-pistachio-new",
                "cinabon-pistachio-new",
                "happiness-cups-kinder-new",
                "cupcake-mix-new"
            ],
            "ourProducts": [
                "gateaux-classic",
                "qashtota-pistachio",
                "despacito-dark-nutella",
                "cinabon-dark-nutella",
                "donuts-white-nutella",
                "cupcake-chocolate",
                "mini-cake-two-person",
                "happiness-cups-nutella"
            ],
            "categoriesSlider": [
                { "id": "taswaq-toort", "title": "التورت", "builderType": "cake-customizer", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-gatowat", "title": "الجاتوهات", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-qashtota", "title": "القشطوطة", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-despacito", "title": "الديسباسيتو", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-cinabon", "title": "السينابون", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-donuts", "title": "الدوناتس", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-red-velvet", "title": "الريدڤيلڤت", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-cupcake", "title": "الكب كيك", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-mini-cake", "title": "الميني تورت", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-flowers", "title": "الورد", "builderType": "flower-customizer", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-happiness-cups", "title": "كبات السعادة", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
                { "id": "taswaq-relax-box", "title": "بوكس الروقان", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" }
            ],
            "cakePreview": {
                "title": "محاكي التورت",
                "description": "حلويات بوسي تتيح تصميم التورت حسب الطلب واختيار كافة التفاصيل التي تناسب ذوقكم ومناسباتكم الفريدة.",
                "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
                "cta": "تصميم التورتة الآن",
                "target": "cake-builder.html"
            },
            "flowerPreview": {
                "title": "محاكي الورد",
                "description": "تخصيص البوكيه واختيار الورد الطبيعي، الصناعي، أو الستان مع إضافة الهدايا والرسائل والصور الخاصة.",
                "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
                "cta": "تصميم البوكيه الآن",
                "target": "flower-builder.html"
            }
        },
        "shippingZones": [
            { "id": "elkefah", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الكفاح", "price": 30 },
            { "id": "aboelhol", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "أبو الهول", "price": 30 },
            { "id": "sanaye3", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الصنايع", "price": 40 },
            { "id": "abobakr", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "أبو بكر", "price": 40 },
            { "id": "farafra", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الفرافرة", "price": 50 },
            { "id": "association", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الجمعية", "price": 50 },
            { "id": "alamal", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الأمل", "price": 50 },
            { "id": "zone-13", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "قرية 13", "price": 70 },
            { "id": "zone-17", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "قرية 17", "price": 70 },
            { "id": "abohoraira", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "أبو هريرة", "price": 140 }
        ],
        "products": []
    };

    // ==========================================================================
    // 2. دوال معالجة وتطهير وحسابات البيانات وحل الثغرات الحاكمة والمالية
    // ==========================================================================

    /**
     * تطهير النصوص تماماً لمنع هجمات XSS وحماية سلامة القراءة للعميل
     */
    function escapeHTML(unsafeString) {
        if (unsafeString === null || unsafeString === undefined) return '';
        return unsafeString
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    window.escapeHTML = escapeHTML;
    window.escapeHtml = escapeHTML;

    /**
     * جلب رابط اللوجو الفاخر بشكل ديناميكي من الـ JSON مع فولباك آمن لمنع الوميض البصري
     */
    window.getBoseLogo = function() {
        return window.BoseStoreData?.store?.logo || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";
    };

    /**
     * تطبيع وتطهير الأرقام العربية والفارسية وتحويلها للأرقام القياسية لضمان سلامة العمليات الرياضية
     */
    window.normalizeArabicNumerals = function(str) {
        if (str === null || str === undefined) return "";
        const arabicNormMap = {
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
            '۴': '4', '۵': '5', '۶': '6',
            '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۷': '7', '۸': '8', '٩': '9'
        };
        return str.toString().trim().replace(/[٠-٩۰-۹]/g, match => arabicNormMap[match] || match);
    };

    /**
     * دالة مراجعة وحساب زيادة الأسعار الرسمية لعلامة بوسي الفاخرة مع صمام الأمان المالي
     */
    window.calculateBosePrice = function (basePrice, applyOnContext = "menu-only") {
        let parsedPrice = parseFloat(basePrice);
        if (isNaN(parsedPrice) || parsedPrice <= 0) return 0;
        
        if (!window.BoseStoreData || !window.BoseStoreData.store) return parsedPrice;
        
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled) {
            if (rule.applyOn === "all" || rule.applyOn === applyOnContext) {
                return parseFloat((parsedPrice * (1 + (parseFloat(rule.percent) / 100))).toFixed(4));
            }
        }
        return parsedPrice;
    };

    /**
     * دالة حساب السعر النهائي للمنتج شامل الخيارات والطباعة والكب كيك والمقاسات بالكسر العشري
     */
    window.calculateProductFinalPrice = function(product, selectedOptions) {
        const opts = selectedOptions || {};
        let price = 0;
        
        if (product) {
            price = parseFloat(product.price) || parseFloat(product.basePrice) || 0;

            if (product.prices && opts.size) {
                price = parseFloat(product.prices[opts.size]) || price;
            }

            const selectedPrinting = opts.printing || opts.printingType || 'none';
            if (selectedPrinting && selectedPrinting !== 'none') {
                let printingFee = 0;
                if (product.customizationOptions && product.customizationOptions.printing) {
                    const printOptions = product.customizationOptions.printing.options;
                    if (Array.isArray(printOptions)) {
                        const printingOpt = printOptions.find(opt => opt.id === selectedPrinting || opt.type === selectedPrinting);
                        if (printingOpt) {
                            printingFee = parseFloat(printingOpt.price);
                        }
                    }
                }
                
                if (printingFee === 0) {
                    if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') {
                        printingFee = 60;
                    } else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') {
                        printingFee = 15;
                    }
                }
                
                price += printingFee;
            }
            
            if (product.isMiniCake || product.type === "mini-cake" || product.slug === "mini-cake-two-person") {
                if (opts.extraToppingPrice) {
                    price += parseFloat(opts.extraToppingPrice);
                }
                if (opts.printingPrice) {
                    price += parseFloat(opts.printingPrice);
                }
            }
        }

        return window.calculateBosePrice(price, "menu-only");
    };

    /**
     * الحسبة الهندسية الصحيحة والمحمية لأسعار محاكي التورتة المخصصة لمنع الخسارة نهائياً
     */
    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = window.BoseStoreData?.cakeBuilder;
        let safePersons = parseInt(persons, 10) || (config ? config.persons.minimum : 4) || 4;
        
        // 1. فرض القيود الهندسية الصحيحة على الحدود الدنيا للأشكال لحماية شكل تماسك التورتة
        let shapeMin = 4;
        const shape = options.shape || 'circle';
        if (shape === 'square') {
            shapeMin = 16;
            safePersons = Math.max(safePersons, 16);
        } else if (shape === 'rectangle') {
            shapeMin = 20;
            safePersons = Math.max(safePersons, 20);
        } else {
            shapeMin = (config ? parseInt(config.persons.minimum) : 4) || 4;
        }

        let price = (config ? parseFloat(config.basePrice) : 580) || 580;
        const pricePerPerson = (config ? parseFloat(config.pricePerPerson) : 145) || 145; 
        
        // 2. الحارس المالي الفاخر: السعر الأساسي (580 جنيه) يغطي أول 4 أفراد فقط (الحد الأدنى للمنظومة)
        // أي فرد إضافي فوق الـ 4 يدفع سعر الفرد الكامل لحماية أرباح التورت المربعة والمستطيلة الكبيرة
        const baseCoveredPersons = 4; 
        const extraPersons = Math.max(0, safePersons - baseCoveredPersons);
        price += extraPersons * pricePerPerson;
        
        const selectedPrinting = options.printingType || options.printing || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (config && config.printingOptions) {
                const printOpt = config.printingOptions.find(opt => opt.id === selectedPrinting);
                if (printOpt) {
                    printingFee = parseFloat(printOpt.price);
                }
            }
            
            if (printingFee === 0) {
                if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') {
                    printingFee = 60;
                } else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') {
                    printingFee = 15;
                }
            }
            price += printingFee;
        }

        if (options.wrappingPrice) {
            price += parseFloat(options.wrappingPrice) || 0;
        }
        
        return window.calculateBosePrice(price, "menu-only");
    };

    /**
     * الحسبة الهندسية لمحاكاة أسعار بوكيهات الورد الفاخرة ورسوم خدمة ددمج الكاش بمرونة فائقة
     */
    window.calculateCustomFlowerPrice = function(flowerType, flowerCount, options = {}) {
        const config = window.BoseStoreData?.flowerBuilder;
        
        const basePrice = config ? parseFloat(config.basePrice) : 400;
        const baseFlowers = config ? parseInt(config.baseFlowers) : 15;
        const extraFlowerPrice = config ? parseFloat(config.extraFlowerPrice) : 35;
        
        const safeFlowerCount = parseInt(flowerCount, 10) || baseFlowers;
        const safeCashAmount = parseInt(options.moneyAmount, 10) || 0;
        const safeCashCategoryAmount = parseInt(options.moneyCategoryAmount, 10) || 0;
        const safeChocolatePieces = parseInt(options.chocolatePieces, 10) || 0;
        const safePhotoCount = parseInt(options.photoCount, 10) || 0;
        
        let servicePrice = basePrice;
        const extraFlowers = Math.max(0, safeFlowerCount - baseFlowers);
        servicePrice += extraFlowers * extraFlowerPrice;
        
        if (options.wrappingType && config) {
            const wrapOpt = config.wrappingTypes.find(opt => opt.id === options.wrappingType);
            if (wrapOpt) servicePrice += parseFloat(wrapOpt.price);
        }
        
        if (options.chocolateType && safeChocolatePieces > 0 && config) {
            const chocOpt = config.chocolateTypes.find(opt => opt.id === options.chocolateType);
            if (chocOpt) servicePrice += parseFloat(chocOpt.price) * safeChocolatePieces;
        }
        
        if (options.hasGiftCard) {
            servicePrice += config ? (parseFloat(config.giftCardPrice) || 20) : 20;
        }
        if (safePhotoCount > 0) {
            servicePrice += safePhotoCount * (config ? (parseFloat(config.photoPrintPrice) || 15) : 15);
        }
        
        let cashHandlingFee = 0;
        if (safeCashAmount > 0 && safeCashCategoryAmount > 0 && config) {
            const selectedCategory = config.moneyCategories.find(cat => cat.amount === safeCashCategoryAmount);
            if (selectedCategory) {
                const billCount = Math.floor(safeCashAmount / safeCashCategoryAmount);
                cashHandlingFee += billCount * parseFloat(selectedCategory.fee);
                
                const remainder = safeCashAmount % safeCashCategoryAmount;
                if (remainder > 0) {
                    const remainderCategory = config.moneyCategories
                        .filter(cat => cat.amount <= remainder)
                        .sort((a, b) => b.amount - a.amount)[0] || config.moneyCategories[0];
                    if (remainderCategory) {
                        cashHandlingFee += parseFloat(remainderCategory.fee);
                    }
                }
            }
        }
        
        servicePrice += cashHandlingFee;
        const finalServicePrice = window.calculateBosePrice(servicePrice, "menu-only");
        
        return finalServicePrice + safeCashAmount;
    };

    /**
     * دالة إنشاء كائن السلة الموحد المانع لأي تصادم أو فقدان في خيارات السلة
     */
    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;
        const opts = selectedOptions || {};
        const finalUnitPrice = window.calculateProductFinalPrice(product, opts);
        
        const isCustomizable = product.isMiniCake ||
                             product.type === "custom-cake" || 
                             product.type === "custom-flower" || 
                             (product.customizationOptions && Object.keys(opts).length > 0);
                             
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}-${Math.floor(Math.random() * 1000)}` : String(product.slug || product.id);
        
        const cartItem = {
            id: finalId,
            productSlug: product.slug,
            title: product.title,
            flavorName: opts.flavorName || opts.cakeType || product.flavorName || "كلاسيك",
            basePrice: parseFloat((product.price || product.basePrice || 0).toFixed(4)),
            finalPrice: parseFloat(finalUnitPrice.toFixed(4)),
            quantity: parseInt(quantity, 10) || 1,
            image: product.image || (product.images && product.images.length > 0 ? product.images[0] : ""),
            type: product.type || (product.isMiniCake ? "mini-cake" : "standard"),
            customDetails: {
                cakeType: opts.cakeType || opts.cakeFlavor || "فانيليا",
                shape: opts.shape || "circle",
                persons: parseInt(opts.persons, 10) || (product.isMiniCake ? 2 : 0),
                printingType: opts.printingType || opts.printing || "none",
                customMessage: opts.customMessage || "",
                allergyNote: opts.allergyNote || "",
                flowerType: opts.flowerType || "none",
                flowerCount: parseInt(opts.flowerCount, 10) || 0,
                moneyAmount: parseInt(opts.moneyAmount, 10) || 0,
                moneyFee: parseInt(opts.moneyFee, 10) || 0,
                chocolateType: opts.chocolateType || "none",
                chocolatePieces: parseInt(opts.chocolatePieces, 10) || 0,
                wrappingType: opts.wrappingType || "none",
                giftCardText: opts.giftCardText || ""
            }
        };
        return cartItem;
    };

    /**
     * دالة الفحص والتحقق الصارم لهواتف مصر لسلامة وصول الشحن والتأكيد
     */
    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") {
            return isOptional;
        }
        const cleaned = window.sanitizeBosePhoneNumber(phone);
        const egPhoneRegex = /^01[0125][0-9]{8}$/;
        return egPhoneRegex.test(cleaned);
    };

    /**
     * دالة تطهير وتوحيد تنسيق رقم الهاتف ليطابق معايير الاتصال والشحن لخدمات التوصيل
     */
    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return "";
        let cleaned = phone.toString().trim().replace(/[\s\-\(\)\+]/g, "");
        cleaned = window.normalizeArabicNumerals(cleaned);
        if (cleaned.startsWith("201")) {
            cleaned = "0" + cleaned.substring(2);
        } else if (cleaned.startsWith("00201")) {
            cleaned = "0" + cleaned.substring(4);
        } else if (cleaned.startsWith("1") && cleaned.length === 10) {
            cleaned = "0" + cleaned;
        }
        return cleaned;
    };

    /**
     * محلل ذكي للوقت يدعم صيغ الـ 12 والـ 24 ساعة لخدمة التوصيل والتحضير
     */
    window.parseTimeStringTo24h = function(timeStr) {
        timeStr = window.normalizeArabicNumerals(timeStr).toUpperCase().trim();
        let hours = 0;
        let minutes = 0;
        
        const hasPM = timeStr.includes("PM") || timeStr.includes("م") || timeStr.includes("مساءً") || timeStr.includes("مساء");
        const hasAM = timeStr.includes("AM") || timeStr.includes("ص") || timeStr.includes("صباحًا") || timeStr.includes("صباح");
        
        let cleanStr = timeStr.replace(/(AM|PM|ص|م|مساءً|صباحًا|مساء|صباح)/g, "").trim();
        const parts = cleanStr.split(":");
        if (parts.length >= 2) {
            hours = parseInt(parts[0], 10);
            minutes = parseInt(parts[1], 10);
            
            if (hasPM && hours < 12) {
                hours += 12;
            } else if (hasAM && hours === 12) {
                hours = 0;
            }
        } else if (parts.length === 1) {
            hours = parseInt(parts[0], 10);
            if (hasPM && hours < 12) hours += 12;
        }
        return { hours, minutes };
    };

    /**
     * حارس الوقت الموحد المانع لأخطاء التوقيت في الأجهزة المحمولة (تأمين شرط الـ 24 ساعة تحضير)
     */
    window.validateBoseDeliverySchedule = function(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        
        const safeDateVal = window.normalizeArabicNumerals(dateStr);
        const dateParts = safeDateVal.replace(/\//g, '-').split('-');
        const { hours, minutes } = window.parseTimeStringTo24h(timeStr);
        
        if (dateParts.length < 3) return false;
        
        let year, month, day;
        if (dateParts[0].length === 4) {
            year = parseInt(dateParts[0], 10);
            month = parseInt(dateParts[1], 10) - 1;
            day = parseInt(dateParts[2], 10);
        } else {
            year = parseInt(dateParts[2], 10);
            month = parseInt(dateParts[1], 10) - 1;
            day = parseInt(dateParts[0], 10);
        }

        const selectedDateTime = new Date(year, month, day, hours, minutes, 0, 0);
        if (isNaN(selectedDateTime.getTime())) return false;
        
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
        const currentDateTime = new Date(synchronizedTime);
        
        if (selectedDateTime <= currentDateTime) return false;
        
        const diffMs = selectedDateTime - currentDateTime;
        const hoursDiff = diffMs / (1000 * 60 * 60);
        
        return hoursDiff >= 23.95;
    };

    /**
     * مقارنة عميقة لخصائص كائنات التخصيص تمنع تكرار كروت السلة المتشابهة
     */
    function isEquivalentDetails(obj1, obj2) {
        if (!obj1 || !obj2) return obj1 === obj2;
        const keys1 = Object.keys(obj1).sort();
        const keys2 = Object.keys(obj2).sort();
        
        const filterEmptyKeys = (keys, obj) => keys.filter(k => {
            const val = obj[k];
            return val !== undefined && val !== null && val !== "" && val !== "none";
        });

        const activeKeys1 = filterEmptyKeys(keys1, obj1);
        const activeKeys2 = filterEmptyKeys(keys2, obj2);

        if (activeKeys1.length !== activeKeys2.length) return false;

        for (let key of activeKeys1) {
            if (!activeKeys2.includes(key)) return false;
            
            const val1 = obj1[key];
            const val2 = obj2[key];

            if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
                if (!isEquivalentDetails(val1, val2)) return false;
            } else {
                const norm1 = window.normalizeArabicNumerals(val1).toString().trim();
                const norm2 = window.normalizeArabicNumerals(val2).toString().trim();
                if (norm1 !== norm2) return false;
            }
        }
        return true;
    }
    window.isEquivalentDetails = isEquivalentDetails;

    // ==========================================================================
    // 3. محركات جلب وإطلاق وتزامن البيانات
    // ==========================================================================

    /**
     * جلب وقراءة قاعدة البيانات المركزية لعلامة بوسي مع حماية التزامن البرمجي التام
     */
    window.getBoseDatabase = function() {
        if (window.BoseStoreData) {
            return Promise.resolve(window.BoseStoreData);
        }
        return window.boseDbPromise;
    };

    /**
     * البوابة الأمنية الحارسة لتمهيد الملفات الخارجية والتابعة
     */
    window.onBoseDatabaseReady = function(callback) {
        if (window.BoseStoreData && window.BoseStoreData.store) {
            callback(window.BoseStoreData);
        } else {
            const handleLoaded = (e) => {
                callback(e.detail);
                document.removeEventListener('BoseDatabaseLoaded', handleLoaded);
            };
            document.addEventListener('BoseDatabaseLoaded', handleLoaded);
        }
    };

    /**
     * نظام التنبيهات الفاخر والتوست الذكي المتكامل لعلامة بوسي
     */
    window.showBoseToast = function(message, duration = 3500, focusElement = null) {
        let container = document.querySelector('.bose-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'bose-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'bose-toast';
        toast.innerHTML = `
            <span class="bose-toast-icon" style="color:var(--bose-pink); font-size:1.2rem;">🌸</span>
            <span class="bose-toast-text" style="line-height:1.5;">${escapeHTML(message)}</span>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('active');
            });
        });

        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, duration);

        if (focusElement) {
            if (typeof focusElement.scrollIntoView === 'function') {
                focusElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            focusElement.focus();
        }
    };

    /**
     * دالة التأكيد الفاخرة والمؤمنة هندسياً ضد تجميد الشاشات وبديلة لـ confirm
     */
    window.showBoseConfirm = function(messageText, onConfirm = null, onCancel = null) {
        let overlay = document.createElement('div');
        overlay.className = 'bose-modal-overlay';
        overlay.innerHTML = `
            <div class="bose-modal-box">
                <p class="bose-modal-text">${escapeHTML(messageText)}</p>
                <div class="bose-modal-actions">
                    <button class="bose-modal-btn bose-modal-btn-confirm" id="bose-confirm-yes">تأكيد</button>
                    <button class="bose-modal-btn bose-modal-btn-cancel" id="bose-confirm-no">تراجع</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                const box = overlay.querySelector('.bose-modal-box');
                if (box) box.style.transform = 'scale(1) translateY(0)';
            });
        });

        const closeBoxProcedure = () => {
            overlay.style.opacity = '0';
            const box = overlay.querySelector('.bose-modal-box');
            if (box) box.style.transform = 'scale(0.9) translateY(10px)';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        };

        overlay.querySelector('#bose-confirm-yes').addEventListener('click', () => {
            closeBoxProcedure();
            if (typeof onConfirm === 'function') onConfirm();
        });

        overlay.querySelector('#bose-confirm-no').addEventListener('click', () => {
            closeBoxProcedure();
            if (typeof onCancel === 'function') onCancel();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeBoxProcedure();
                if (typeof onCancel === 'function') onCancel();
            }
        });
    };

    /**
     * حقن الأنماط والسمات الأساسية الحاكمة لتفادي وميض الألوان غير المرغوب فيه (FOUC)
     * الالتزام الكامل بقوانين Cairo ووزن خط 700 كحد أقصى لمنع التشويه
     */
    function injectCoreStyles() {
        if (document.getElementById("bose-core-injected-styles")) return;

        const styleTag = document.createElement("style");
        styleTag.id = "bose-core-injected-styles";
        styleTag.textContent = `
            :root {
                --bose-pink: #FF91A4;
                --bose-white: #FFFFFF;
                --bose-black: #111111;
                --bose-gold: #D4AF37;
                --bose-shadow-glow: 0 8px 32px rgba(255, 145, 164, 0.12);
                --bose-shadow-hover: 0 16px 40px rgba(255, 145, 164, 0.22);
                --bose-border-pink: 1px solid rgba(255, 145, 164, 0.3);
                --bose-border-thick: 2px solid #FF91A4;
            }
            body {
                font-family: 'Cairo', sans-serif !important;
                background-color: var(--bose-white) !important;
                color: var(--bose-black) !important;
                margin: 0;
                padding: 0;
                overflow-x: hidden;
            }
            
            /* حظر تام للخطوط الباهتة والتداخل البصري */
            h1, h2 {
                font-family: 'Cairo', sans-serif !important;
                font-weight: 700 !important;
                color: var(--bose-black) !important;
                margin: 0;
            }
            h3, h4, h5, h6 {
                font-family: 'Cairo', sans-serif !important;
                font-weight: 600 !important;
                color: var(--bose-black) !important;
                margin: 0;
            }
            p, span, a, button, input, select, textarea {
                font-family: 'Cairo', sans-serif !important;
            }

            .bose-fade-in-img {
                opacity: 0;
                transition: opacity 0.4s ease-in-out;
            }
            .bose-fade-in-img.loaded {
                opacity: 1;
            }
            
            .bose-toast-container {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                width: 90%;
                max-width: 400px;
                pointer-events: none;
            }
            .bose-toast {
                background-color: var(--bose-white, #FFFFFF) !important;
                color: var(--bose-black, #111111) !important;
                border: 1px solid rgba(255, 145, 164, 0.4) !important;
                border-right: 4px solid var(--bose-pink, #FF91A4) !important;
                padding: 16px 24px !important;
                border-radius: 16px !important;
                box-shadow: 0 16px 40px rgba(255, 145, 164, 0.08) !important;
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                pointer-events: auto !important;
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                direction: rtl;
                text-align: right;
            }
            .bose-toast.active {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            
            .waterfall-overlay-top, .waterfall-overlay-bottom {
                position: absolute;
                left: 0;
                width: 100%;
                height: 100px;
                z-index: 5;
                pointer-events: none;
            }
            .waterfall-overlay-top {
                top: 0;
                background: linear-gradient(to bottom, var(--bose-white) 0%, rgba(255,255,255,0) 100%);
                backdrop-filter: blur(2px);
                -webkit-backdrop-filter: blur(2px);
            }
            .waterfall-overlay-bottom {
                bottom: 0;
                background: linear-gradient(to top, var(--bose-white) 0%, rgba(255,255,255,0) 100%);
                backdrop-filter: blur(2px);
                -webkit-backdrop-filter: blur(2px);
            }
            
            .bose-modal-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(17, 17, 17, 0.4);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100100;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: auto;
            }
            .bose-modal-box {
                background: var(--bose-white, #FFFFFF);
                border: 1px solid var(--bose-pink, #FF91A4);
                border-radius: 24px;
                width: 90%;
                max-width: 400px;
                padding: 24px;
                box-shadow: 0 16px 40px rgba(255, 145, 164, 0.12);
                transform: scale(0.9) translateY(10px);
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                direction: rtl;
                text-align: right;
                font-family: 'Cairo', sans-serif;
            }
            .bose-modal-text {
                font-size: 15px;
                font-weight: 600;
                color: var(--bose-black, #111111);
                line-height: 1.6;
                margin: 0 0 20px 0;
            }
            .bose-modal-actions {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 12px;
            }
            .bose-modal-btn {
                font-family: 'Cairo', sans-serif;
                font-size: 14px;
                font-weight: 700;
                padding: 10px 24px;
                border-radius: 50px;
                cursor: pointer;
                transition: 0.2s;
                border: none;
            }
            .bose-modal-btn-confirm {
                background: var(--bose-pink, #FF91A4);
                color: var(--bose-white, #FFFFFF);
                box-shadow: 0 4px 12px rgba(255, 145, 164, 0.2);
            }
            .bose-modal-btn-confirm:hover {
                opacity: 0.9;
            }
            .bose-modal-btn-cancel {
                background: transparent;
                color: var(--bose-black, #111111);
                border: 1px solid rgba(17, 17, 17, 0.15);
            }
            .bose-modal-btn-cancel:hover {
                background: rgba(17, 17, 17, 0.03);
            }
            
            .drawer-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(17, 17, 17, 0.4);
                backdrop-filter: blur(4px);
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .drawer-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .bose-search-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(17, 17, 17, 0.6);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .bose-search-modal.active {
                opacity: 1;
                pointer-events: auto;
            }
            .search-modal-box {
                background: var(--bose-white);
                border: var(--bose-border-thick);
                border-radius: 24px;
                width: 90%;
                max-width: 500px;
                padding: 24px;
                box-shadow: var(--bose-shadow-hover);
                transform: scale(0.9) translateY(10px);
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                direction: rtl;
                text-align: right;
            }
            .bose-search-modal.active .search-modal-box {
                transform: scale(1) translateY(0);
            }
            .search-results-container {
                transition: opacity 0.2s ease-in-out;
            }
            .search-results-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 14px;
                padding: 16px 4px;
                max-height: 50vh;
                overflow-y: auto;
            }
            .search-results-grid::-webkit-scrollbar {
                width: 6px;
            }
            .search-results-grid::-webkit-scrollbar-track {
                background: rgba(255, 145, 164, 0.05);
                border-radius: 10px;
            }
            .search-results-grid::-webkit-scrollbar-thumb {
                background: var(--bose-pink);
                border-radius: 10px;
            }
            .search-result-card {
                display: flex;
                gap: 16px;
                padding: 12px;
                border-radius: 18px;
                border: var(--bose-border-pink);
                background: var(--bose-white);
                transition: all 0.25s ease;
                align-items: center;
                text-decoration: none;
                color: inherit;
                box-shadow: 0 4px 15px rgba(255, 145, 164, 0.06);
            }
            .search-result-card:hover {
                transform: translateY(-2px);
                border-color: var(--bose-pink);
                box-shadow: var(--bose-shadow-hover);
            }
            .search-card-img {
                width: 70px;
                height: 70px;
                border-radius: 12px;
                object-fit: cover;
                flex-shrink: 0;
            }
            .search-card-info-pane {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
                overflow: hidden;
                text-align: right;
                direction: rtl;
            }
            .search-card-title {
                font-size: 0.95rem;
                font-weight: 700;
                color: var(--bose-black);
                line-height: 1.3;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin: 0;
            }
            .search-card-flavor {
                font-size: 0.8rem;
                font-weight: 700;
                color: var(--bose-pink);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .search-card-meta-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 4px;
            }
            .search-card-price {
                font-size: 0.95rem;
                font-weight: 700;
                color: var(--bose-pink);
            }
            .search-card-action-badge {
                font-size: 0.75rem;
                background: rgba(255, 145, 164, 0.1);
                padding: 2px 8px;
                border-radius: 8px;
                color: var(--bose-black);
                opacity: 0.8;
                font-weight: 700;
            }
            
            .bose-navbar, .bose-footer, .bose-drawer-menu {
                opacity: 0;
                transition: opacity 0.35s ease-in-out;
            }
            .bose-navbar.loaded, .bose-footer.loaded, .bose-drawer-menu.loaded {
                opacity: 1;
            }
            
            @keyframes bose-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .bose-dots-container {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                margin-top: 16px;
                width: 100%;
            }
            .bose-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: rgba(255, 145, 164, 0.3);
                transition: all 0.3s ease;
                cursor: pointer;
                border: none;
                padding: 0;
            }
            .bose-dot.active {
                background-color: var(--bose-pink);
                width: 24px;
                border-radius: 5px;
            }

            .nav-list a.active, .drawer-links-list a.active {
                color: var(--bose-pink) !important;
                border-bottom: 2px solid var(--bose-pink);
            }
            .drawer-links-list a.active {
                border-bottom: none !important;
                background: rgba(255, 145, 164, 0.08);
                border-radius: 12px;
                padding: 8px 12px;
                width: 100%;
            }
            
            .bose-manual-scroll-active {
                scroll-snap-type: x mandatory;
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch;
            }
            .bose-manual-scroll-active > * {
                scroll-snap-align: start;
            }

            .animate-marquee, .categories-track-loop {
                overflow-x: auto !important;
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            .animate-marquee::-webkit-scrollbar, .categories-track-loop::-webkit-scrollbar {
                display: none !important;
            }
        `;
        document.head.appendChild(styleTag);
    }

    /**
     * تفعيل ميزة السحب واللمس لجميع سلايدرات الماركيه اللانهائية
     */
    function enableMarqueeDragScrolling(track) {
        if (!track) return;
        
        let isDragging = false;
        let startX;
        let scrollLeft;

        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft || 0;
            track.style.animationPlayState = 'paused';
            track.style.cursor = 'grabbing';
        });

        track.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                track.style.animationPlayState = 'running';
                track.style.cursor = '';
            }
        });

        track.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                track.style.animationPlayState = 'running';
                track.style.cursor = '';
            }
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5; 
            track.scrollLeft = scrollLeft - walk;
        });

        track.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft || 0;
            track.style.animationPlayState = 'paused';
        }, { passive: true });

        track.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                track.style.animationPlayState = 'running';
            }
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const x = e.touches[0].pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5;
            track.scrollLeft = scrollLeft - walk;
        }, { passive: true });
    }

    /**
     * ربط حركة السكرول في السلايدرات بنقاط التنقل السفلية
     */
    function setupScrollToDotsBinding(trackElement, sectionContainer, itemsCount) {
        if (!trackElement || !sectionContainer) return;
        
        trackElement.addEventListener('scroll', () => {
            const width = trackElement.scrollWidth / itemsCount;
            const currentIdx = Math.round(trackElement.scrollLeft / width);
            
            const dotsWrapper = sectionContainer.querySelector('.bose-dots-container');
            if (dotsWrapper) {
                dotsWrapper.querySelectorAll('.bose-dot').forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === currentIdx);
                });
            }
        }, { passive: true });
    }

    /**
     * الهيكل الموحد الملتزم بالـ DOM هندسياً لحقن مكونات الهيدر والفوتر والدرج الجانبي
     */
    function injectUniversalLayout() {
        let pathPrefix = "";
        const currentPath = window.location.pathname;
        if (currentPath.includes("/admin/")) {
            return;
        }

        let pageFileName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
        if (pageFileName === '/' || pageFileName === '') {
            pageFileName = 'index.html';
        }

        const dynamicLogo = window.getBoseLogo();

        // 1. الهيدر الموحد والملتزم بالـ DOM هندسياً
        const existingNavbar = document.querySelector(".bose-navbar");
        if (existingNavbar && !existingNavbar.hasAttribute("data-dynamic-injected")) {
            existingNavbar.setAttribute("data-dynamic-injected", "true");
            existingNavbar.innerHTML = `
                <div class="navbar-mobile-wrapper" style="display: flex; width: 100%; justify-content: space-between; align-items: center; padding: 0 16px;">
                    <button id="mobile-menu-toggle" class="nav-icon-btn" aria-label="فتح قائمة التصفح" style="background: none; border: none; font-size: 1.4rem; color: var(--bose-black); cursor: pointer;">
                        <i class="fas fa-bars"></i>
                    </button>
                    
                    <div class="brand-logo-container" style="display: flex; align-items: center; gap: 8px;">
                        <a href="${pathPrefix}index.html" style="display: flex; align-items: center;">
                            <img id="bose-store-logo" src="${dynamicLogo}" alt="شعار حلويات بوسي" style="height: 44px; width: 44px; object-fit: contain;">
                        </a>
                    </div>
                    
                    <span class="brand-name-display" style="font-size: 1.15rem; font-weight: 700; color: var(--bose-black);">حلويات بوسي</span>
                    
                    <nav id="bose-nav-menu" style="display: none;">
                        <ul class="nav-list">
                            <li><a href="${pathPrefix}index.html" class="${pageFileName.includes('index.html') ? 'active' : ''}">الرئيسية</a></li>
                            <li><a href="${pathPrefix}menu.html" class="${pageFileName.includes('menu.html') || pageFileName.includes('category.html') ? 'active' : ''}">المنيو الشامل</a></li>
                            <li><a href="${pathPrefix}cake-builder.html" class="${pageFileName.includes('cake-builder.html') ? 'active' : ''}">محاكي التورت</a></li>
                            <li><a href="${pathPrefix}flower-builder.html" class="${pageFileName.includes('flower-builder.html') ? 'active' : ''}">محاكي الورد</a></li>
                        </ul>
                    </nav>
                    
                    <div class="nav-actions" style="display: flex; align-items: center; gap: 14px;">
                        <button id="nav-search-btn" class="nav-icon-btn" aria-label="البحث في المنتجات" style="background: none; border: none; font-size: 1.25rem; color: var(--bose-black); cursor: pointer;">
                            <i class="fas fa-search"></i>
                        </button>
                        
                        <a href="${pathPrefix}cart.html" class="nav-cart-icon-wrapper" aria-label="عرض سلة التسوق" style="position: relative; font-size: 1.3rem; color: var(--bose-black); text-decoration: none;">
                            <i class="fas fa-shopping-bag"></i>
                            <span id="nav-cart-count" style="position: absolute; top: -8px; left: -10px; background: var(--bose-pink); color: #FFF; font-size: 0.75rem; font-weight: 700; padding: 2px 6px; border-radius: 50%; min-width: 14px; text-align: center; line-height: 1.2;">0</span>
                        </a>
                    </div>
                </div>
            `;
            requestAnimationFrame(() => {
                existingNavbar.classList.add("loaded");
            });
        }

        // 2. الدرج الجانبي الفاخر للموبايل والكمبيوتر
        let drawerMenu = document.querySelector(".bose-drawer-menu, #sidebar-drawer");
        if (drawerMenu && !drawerMenu.hasAttribute("data-dynamic-injected")) {
            drawerMenu.setAttribute("data-dynamic-injected", "true");
            drawerMenu.innerHTML = `
                <div class="drawer-premium-header" style="padding: 24px 20px; background: rgba(255,145,164,0.08); border-bottom: var(--bose-border-pink);">
                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--bose-black);">قائمة التصفح الفاخرة</h3>
                    <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--bose-pink); font-weight: 600;">حلويات بوسي - فرع الكفاح 🌸</p>
                </div>
                <div class="drawer-links-scrollable" style="padding: 16px 20px; flex-grow: 1;">
                    <span class="drawer-divider-label" style="display: block; font-size: 0.75rem; font-weight: 700; color: #777; margin-bottom: 12px; letter-spacing: 0.5px;">الأقسام الرئيسية</span>
                    <ul class="drawer-links-list" style="list-style: none; padding: 0; margin: 0 0 24px 0; display: flex; flex-direction: column; gap: 14px;">
                        <li class="drawer-link-item"><a href="${pathPrefix}index.html" class="${pageFileName.includes('index.html') ? 'active' : ''}" style="text-decoration: none; color: var(--bose-black); font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-home" style="color: var(--bose-pink);"></i> الواجهة الرئيسية</a></li>
                        <li class="drawer-link-item"><a href="${pathPrefix}menu.html" class="${pageFileName.includes('menu.html') || pageFileName.includes('category.html') ? 'active' : ''}" style="text-decoration: none; color: var(--bose-black); font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-utensils" style="color: var(--bose-pink);"></i> المنيو الشامل</a></li>
                        <li class="drawer-link-item"><a href="${pathPrefix}cart.html" class="${pageFileName.includes('cart.html') ? 'active' : ''}" style="text-decoration: none; color: var(--bose-black); font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-shopping-basket" style="color: var(--bose-pink);"></i> سلة التسوق</a></li>
                    </ul>
                    <span class="drawer-divider-label" style="display: block; font-size: 0.75rem; font-weight: 700; color: #777; margin-bottom: 12px; letter-spacing: 0.5px;">المحاكيات الحصرية</span>
                    <ul class="drawer-links-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px;">
                        <li class="drawer-link-item featured-hub"><a href="${pathPrefix}cake-builder.html" class="${pageFileName.includes('cake-builder.html') ? 'active' : ''}" style="text-decoration: none; color: var(--bose-black); font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-birthday-cake" style="color: var(--bose-gold);"></i> محاكي التورت التفاعلي</a></li>
                        <li class="drawer-link-item featured-hub"><a href="${pathPrefix}flower-builder.html" class="${pageFileName.includes('flower-builder.html') ? 'active' : ''}" style="text-decoration: none; color: var(--bose-black); font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-spa" style="color: var(--bose-gold);"></i> محاكي الورد التفاعلي</a></li>
                    </ul>
                </div>
                <div class="drawer-premium-footer" style="padding: 20px; border-top: var(--bose-border-pink); display: flex; flex-direction: column; gap: 12px;">
                    <a href="tel:01097238441" class="bose-btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--bose-pink); color: #FFF; text-decoration: none; font-weight: 700; padding: 12px; border-radius: 12px; text-align: center; font-size: 0.9rem; box-shadow: var(--bose-shadow-glow);">اتصال فوري بالفرع</a>
                    <p style="margin: 0; font-size: 0.75rem; text-align: center; color: #888;">&copy; 2026 جميع الحقوق محفوظة لـ علامة حلويات بوسي الفاخرة.</p>
                </div>
            `;
            requestAnimationFrame(() => {
                drawerMenu.classList.add("loaded");
            });
        }

        // 3. الفوتر الموحد الفاتح والملتزم بالـ DOM لمنع المساحات المهدرة
        const existingFooter = document.querySelector(".bose-footer");
        if (existingFooter && !existingFooter.hasAttribute("data-dynamic-injected")) {
            existingFooter.setAttribute("data-dynamic-injected", "true");
            existingFooter.innerHTML = `
                <div class="footer-inner-wrapper" style="width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px 16px; display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center;">
                    <div class="footer-logo-container">
                        <a href="index.html">
                            <img id="bose-store-logo" src="${dynamicLogo}" alt="شعار حلويات بوسي" style="height: 60px; object-fit: contain;">
                        </a>
                    </div>
                    
                    <span class="brand-name-display footer-brand-name" style="font-size: 1.4rem; font-weight: 700; color: var(--bose-black);">حلويات بوسي</span>

                    <div class="footer-about-block" style="max-width: 600px;">
                        <p id="footer-about-text" style="font-size: 0.95rem; color: #555; line-height: 1.6; margin: 0;">صنعناها بحب لتهديها لمن تحب. خبرة أكثر من 10 سنوات في صناعة الحلويات الفاخرة وتنسيق الهدايا والورد لنوثق أسعد لحظاتكم بتميز واحترافية كاملة من فرع الكفاح.</p>
                    </div>
                    
                    <div id="footer-social-links" style="display: flex; gap: 16px; justify-content: center; margin: 8px 0;">
                        <a href="https://www.facebook.com/share/1H1vVMHyu9/" class="social-link-facebook" target="_blank" aria-label="فيسبوك حلويات بوسي" style="width: 40px; height: 40px; border-radius: 50%; background: #3b5998; color: #FFF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.1rem; transition: transform 0.2s;"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://www.instagram.com/bose_sweets?igsh=amdkMmhxMXJyanYy" class="social-link-instagram" target="_blank" aria-label="انستجرام حلويات بوسي" style="width: 40px; height: 40px; border-radius: 50%; background: #e1306c; color: #FFF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.1rem; transition: transform 0.2s;"><i class="fab fa-instagram"></i></a>
                        <a href="https://www.tiktok.com/@bosesweets1?_r=1&_t=ZS-96lRDDHq9QK" class="social-link-tiktok" target="_blank" aria-label="تيك توك حلويات بوسي" style="width: 40px; height: 40px; border-radius: 50%; background: #000000; color: #FFF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.1rem; transition: transform 0.2s;"><i class="fab fa-tiktok"></i></a>
                        <a href="https://wa.me/201097238441" class="social-link-whatsapp" target="_blank" aria-label="واتساب حلويات بوسي" style="width: 40px; height: 40px; border-radius: 50%; background: #25d366; color: #FFF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.1rem; transition: transform 0.2s;"><i class="fab fa-whatsapp"></i></a>
                    </div>
                    
                    <div class="footer-policies-container">
                        <ul class="footer-links-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">
                            <li><a href="${pathPrefix}privacy-policy.html" style="text-decoration: none; color: var(--bose-black); font-size: 0.85rem; font-weight: 700;">سياسة الخصوصية</a></li>
                            <li><a href="${pathPrefix}terms.html" style="text-decoration: none; color: var(--bose-black); font-size: 0.85rem; font-weight: 700;">الشروط والأحكام</a></li>
                            <li><a href="${pathPrefix}shipping-policy.html" style="text-decoration: none; color: var(--bose-black); font-size: 0.85rem; font-weight: 700;">سياسة الطلبات والتوصيل</a></li>
                            <li><a href="${pathPrefix}refund-policy.html" style="text-decoration: none; color: var(--bose-black); font-size: 0.85rem; font-weight: 700;">سياسة الاستبدال والاسترجاع</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-copyright-block" style="margin-top: 16px; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 20px; width: 100%;">
                        <p style="margin: 0; font-size: 0.8rem; color: #777; font-weight: 600;">© <span>2026</span> جميع الحقوق محفوظة لعلامة حلويات بوسي التجارية الفاخرة</p>
                    </div>
                </div>
            `;
            requestAnimationFrame(() => {
                existingFooter.classList.add("loaded");
            });
        }
    }

    /**
     * جلب وتحميل قاعدة البيانات مع حماية المزامنة الزمنية وفحص المسارات البديلة
     */
    async function loadStoreDatabase() {
        if (window.boseDatabaseLoading) return;
        window.boseDatabaseLoading = true;
        
        injectCoreStyles();

        const retryDelays = [1000, 2000, 4000, 8000, 16000];
        let successfulFetch = false;

        for (let attempt = 1; attempt <= 5; attempt++) {
            for (const path of DATABASE_PATHS) {
                try {
                    const response = await fetch(path);
                    if (!response.ok) continue;

                    const serverDateHeader = response.headers.get('Date');
                    if (serverDateHeader) {
                        const serverTime = new Date(serverDateHeader).getTime();
                        const clientTime = Date.now();
                        window.boseServerTimeOffset = serverTime - clientTime;
                    } else {
                        window.boseServerTimeOffset = 0;
                    }

                    const rawData = await response.json();
                    
                    if (rawData && rawData.products) {
                        rawData.products = rawData.products.map(product => {
                            if (product.category === "taswaq-dark-nutella") {
                                product.category = "taswaq-qashtota";
                            }
                            return product;
                        });
                    }
                    
                    window.BoseStoreData = rawData;
                    window.boseDatabaseLoading = false;
                    
                    injectUniversalLayout();
                    applyGlobalSEOAndBranding();
                    window.updateGlobalCartCounter();
                    initializeGlobalUIEvents();
                    
                    autoPopulateHomepageComponents(rawData);
                    
                    databaseResolvers.forEach(resolve => resolve(window.BoseStoreData));
                    databaseResolvers = [];
                    
                    const dbEvent = new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData });
                    window.dispatchEvent(dbEvent);
                    document.dispatchEvent(dbEvent);
                    window.dispatchEvent(new Event('bose_data_ready'));
                    successfulFetch = true;
                    return; 

                } catch (error) {
                    // الانتقال التلقائي للمسار البديل التالي
                }
            }

            if (successfulFetch) return;

            // التحميل الاحتياطي لقاعدة البيانات الفورية عند حدوث خطأ
            if (attempt === 5 || window.location.protocol === 'file:') {
                console.warn("⚠️ تم تفعيل بواب الأمان والتحميل الاحتياطي لقاعدة البيانات لتأمين التشغيل الفوري.");
                window.BoseStoreData = BOSE_FALLBACK_DATABASE;
                window.boseDatabaseLoading = false;
                
                injectUniversalLayout();
                applyGlobalSEOAndBranding();
                window.updateGlobalCartCounter();
                initializeGlobalUIEvents();
                autoPopulateHomepageComponents(BOSE_FALLBACK_DATABASE);
                
                databaseResolvers.forEach(resolve => resolve(BOSE_FALLBACK_DATABASE));
                databaseResolvers = [];
                
                const dbEvent = new CustomEvent('BoseDatabaseLoaded', { detail: BOSE_FALLBACK_DATABASE });
                window.dispatchEvent(dbEvent);
                document.dispatchEvent(dbEvent);
                window.dispatchEvent(new Event('bose_data_ready'));
                return;
            } else {
                await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
            }
        }
    }

    /**
     * رندرة وإنتاج كروت المنتجات بدقة هندسية ومظهر ناعم ومرتّب تماماً
     */
    function generateStrictProductCardHTML(product, currency) {
        const defaultImage = window.getBoseLogo();
        const cleanImg = product.image || (product.images && product.images[0] ? product.images[0] : defaultImage);
        const cleanTitle = escapeHTML(product.title);
        const cleanFlavor = escapeHTML(product.flavorName || "كلاسيك");
        const cleanDesc = escapeHTML(product.flavorDesc || product.description || "");
        
        const defaultSize = product.defaultSize || 'triangle';
        const initialRawPrice = (product.prices && product.prices[defaultSize]) ? product.prices[defaultSize] : product.price;
        const finalPrice = window.calculateBosePrice(initialRawPrice, "menu-only");

        let sizeSelectorHTML = "";
        if (product.sizes && product.prices) {
            sizeSelectorHTML = `<div class="product-card-size-tabs" style="display: flex; gap: 6px; margin: 4px 0 8px 0; justify-content: flex-start; flex-wrap: wrap; direction: rtl;">`;
            product.sizes.forEach((sz) => {
                const isActive = sz.id === defaultSize;
                sizeSelectorHTML += `
                    <button class="size-tab-btn ${isActive ? 'active' : ''}" data-size-id="${sz.id}" data-size-price="${product.prices[sz.id]}" style="background: ${isActive ? 'var(--bose-pink)' : 'rgba(255, 145, 164, 0.08)'}; color: ${isActive ? '#fff' : 'var(--bose-black)'}; border: 1px solid var(--bose-pink); border-radius: 8px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s;">
                        ${sz.name}
                    </button>
                `;
            });
            sizeSelectorHTML += `</div>`;
        }

        return `
            <div class="product-card" data-slug="${product.slug}" data-selected-size="${defaultSize}" style="border: var(--bose-border-pink); border-radius: 20px; background: var(--bose-white); overflow: hidden; padding: 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: var(--bose-shadow-glow); transition: 0.3s ease; text-align: right; direction: rtl;">
                <a href="product.html?slug=${product.slug}" style="text-decoration: none; display: block; overflow: hidden; border-radius: 12px; height: 220px;" aria-label="عرض تفاصيل ${cleanTitle}">
                    <img class="product-card-img bose-fade-in-img" src="${cleanImg}" alt="${cleanTitle}" style="width: 100%; height: 100%; object-fit: cover; display: block; transition: 0.3s;" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${defaultImage}';" loading="lazy">
                </a>
                
                <h3 class="product-card-title" style="margin: 4px 0 0 0; font-size: 1.05rem; font-weight: 700; color: var(--bose-black); line-height: 1.4;">${cleanTitle}</h3>
                
                <span class="product-card-flavor-name" style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--bose-pink); margin-top: -2px;">${cleanFlavor}</span>
                
                <p class="product-card-desc" style="margin: 4px 0 8px 0; font-size: 0.8rem; font-weight: 400; color: var(--bose-black); opacity: 0.8; line-height: 1.5; min-height: 60px; max-height: 60px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${cleanDesc}</p>
                
                ${sizeSelectorHTML}

                <div style="margin-top: auto; display: flex; flex-direction: column; gap: 12px;">
                    <div class="qty-counter-row" style="display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--bose-pink); border-radius: 50px; background: var(--bose-white); padding: 2px 8px; direction: rtl;">
                        <button class="btn-qty-plus" style="background: none; border: none; color: var(--bose-black); font-size: 18px; font-weight: 700; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center;" aria-label="زيادة الكمية">+</button>
                        <input type="number" class="input-qty-value" value="1" min="1" readonly style="width: 35px; text-align: center; border: none; font-size: 14px; font-weight: 700; color: var(--bose-black); background: transparent; outline: none;" aria-label="الكمية الحالية">
                        <button class="btn-qty-minus" style="background: none; border: none; color: var(--bose-black); font-size: 18px; font-weight: 700; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center;" aria-label="نقص الكمية">-</button>
                    </div>

                    <div class="product-card-price" style="font-size: 1.1rem; font-weight: 700; color: var(--bose-pink); text-align: right;" data-base-price="${finalPrice}">
                        ${finalPrice} ${currency}
                    </div>

                    <button class="btn-add-to-cart" style="background: var(--bose-pink); color: var(--bose-white); border: none; padding: 12px; border-radius: 50px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 12px rgba(255, 145, 164, 0.15); width: 100%;">
                        <i class="fas fa-shopping-bag" style="font-size: 0.9rem;"></i> إضافة للسلة
                    </button>
                </div>
            </div>
        `;
    }
    window.generateStrictProductCardHTML = generateStrictProductCardHTML;

    /**
     * ربط أحداث كروت المنتجات لضمان تفعيل العدادات وإضافة السلة التفاعلية بدقة
     */
    function attachProductCardEvents(container, productsList, currency) {
        if (!container) return;

        container.querySelectorAll('.product-card').forEach(card => {
            const slug = card.dataset.slug;
            const product = productsList.find(p => p.slug === slug);
            if (!product) return;

            const qtyInput = card.querySelector('.input-qty-value');
            const priceDisplay = card.querySelector('.product-card-price');
            const plusBtn = card.querySelector('.btn-qty-plus');
            const minusBtn = card.querySelector('.btn-qty-minus');
            const addToCartBtn = card.querySelector('.btn-add-to-cart');

            const updatePriceDisplay = () => {
                const qty = parseInt(qtyInput.value, 10) || 1;
                const currentBase = parseFloat(priceDisplay.dataset.basePrice) || product.price;
                priceDisplay.textContent = `${currentBase * qty} ${currency}`;
            };

            const sizeTabs = card.querySelectorAll('.size-tab-btn');
            sizeTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    sizeTabs.forEach(t => {
                        t.classList.remove('active');
                        t.style.background = 'rgba(255, 145, 164, 0.08)';
                        t.style.color = 'var(--bose-black)';
                    });

                    tab.classList.add('active');
                    tab.style.background = 'var(--bose-pink)';
                    tab.style.color = '#fff';

                    const selectedSize = tab.dataset.sizeId;
                    const rawPrice = parseFloat(tab.dataset.sizePrice);
                    const calculatedUnitPrice = window.calculateBosePrice(rawPrice, "menu-only");

                    card.dataset.selectedSize = selectedSize;
                    priceDisplay.dataset.basePrice = calculatedUnitPrice;
                    updatePriceDisplay();
                });
            });

            if (plusBtn && minusBtn && qtyInput) {
                plusBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    let val = parseInt(qtyInput.value, 10) || 1;
                    qtyInput.value = val + 1;
                    updatePriceDisplay();
                });

                minusBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    let val = parseInt(qtyInput.value, 10) || 1;
                    if (val > 1) {
                        qtyInput.value = val - 1;
                        updatePriceDisplay();
                    }
                });
            }

            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const qty = parseInt(qtyInput.value, 10) || 1;
                    const activeSize = card.dataset.selectedSize || 'triangle';
                    
                    const options = {};
                    if (product.sizes) {
                        options.size = activeSize;
                        const matchedSize = product.sizes.find(s => s.id === activeSize);
                        options.flavorName = `${product.flavorName || "كلاسيك"} (${matchedSize ? matchedSize.name : ""})`;
                    } else {
                        options.flavorName = product.flavorName || "كلاسيك";
                    }

                    const standardItem = window.createCartItem(product, options, qty);
                    if (standardItem) {
                        window.addBoseCartItem(standardItem);
                        qtyInput.value = 1;
                        updatePriceDisplay();
                    }
                });
            }
        });
    }
    window.attachProductCardEvents = attachProductCardEvents;

    /**
     * مولّد ومحرك مؤشرات التصفح النقطية (Dots) التفاعلية لجميع السلايدرات
     */
    function generateBoseDots(sliderContainer, totalItems, activeIndex = 0, onDotClick = null) {
        if (!sliderContainer) return;
        
        let dotsWrapper = sliderContainer.querySelector('.bose-dots-container');
        if (!dotsWrapper) {
            dotsWrapper = document.createElement('div');
            dotsWrapper.className = 'bose-dots-container';
            sliderContainer.appendChild(dotsWrapper);
        }
        
        dotsWrapper.innerHTML = '';
        for (let i = 0; i < totalItems; i++) {
            const dot = document.createElement('button');
            dot.className = `bose-dot ${i === activeIndex ? 'active' : ''}`;
            dot.setAttribute('aria-label', `الحقل رقم ${i + 1}`);
            
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                dotsWrapper.querySelectorAll('.bose-dot').forEach((d, idx) => {
                    d.classList.toggle('active', idx === i);
                });
                if (typeof onDotClick === 'function') onDotClick(i);
            });
            dotsWrapper.appendChild(dot);
        }
    }

    /**
     * الأتمتة والملء الكامل لجميع أقسام الصفحة الرئيسية لعلامة حلويات بوسي
     */
    function autoPopulateHomepageComponents(data) {
        if (!data) return;

        // صمام الأمان البنيوي لمنع إرهاق الصفحة والعمل فقط بالواجهة الرئيسية
        if (!document.getElementById('hero-section') && !document.getElementById('waterfall-section')) {
            const marqueeTrack = document.getElementById('top-bar-marquee');
            if (marqueeTrack && data.navigation && data.navigation.topBarMessages) {
                renderTopMarquee(marqueeTrack, data.navigation.topBarMessages);
            }
            return; 
        }

        const currency = data.store.currency || "EGP";
        const productsList = data.products || [];

        // 0. شريط الإعلانات التسويقية العلوي اللانهائي
        const marqueeTrack = document.getElementById('top-bar-marquee');
        if (marqueeTrack && data.navigation && data.navigation.topBarMessages) {
            renderTopMarquee(marqueeTrack, data.navigation.topBarMessages);
        }

        // 1. أتمتة القسم الأول: عقد من التميز
        const heroSection = document.getElementById('hero-section');
        if (heroSection && data.homepage.hero) {
            const heroData = data.homepage.hero;
            const heroTitleNode = document.getElementById('hero-title') || heroSection.querySelector('h1');
            const heroDescNode = document.getElementById('hero-description') || heroSection.querySelector('p');
            const heroCtaNode = document.getElementById('hero-cta-btn') || heroSection.querySelector('a');

            if (heroTitleNode) {
                const rawTitle = heroData.title || "عقد من التميز في صناعة الحلويات";
                const formattedTitle = rawTitle.replace("التميز", `<span style="color: var(--bose-pink); font-weight: 700;">التميز</span>`);
                heroTitleNode.innerHTML = formattedTitle;
            }
            if (heroDescNode) {
                heroDescNode.textContent = heroData.description;
            }
            if (heroCtaNode) {
                heroCtaNode.textContent = heroData.cta || "اطلب الآن";
                heroCtaNode.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.getElementById('waterfall-section');
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            }
        }

        // 2. أتمتة عمودي شلال المنتجات البصري المتعاكس
        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        const waterfallContainer = document.querySelector('.waterfall-container') || document.getElementById('waterfall-section');
        const waterfallConfig = data.homepage.waterfall;

        if (leftCol && rightCol && waterfallConfig && waterfallContainer) {
            leftCol.innerHTML = '';
            rightCol.innerHTML = '';

            const leftImages = [...waterfallConfig.leftColumnImages, ...waterfallConfig.leftColumnImages, ...waterfallConfig.leftColumnImages];
            const rightImages = [...waterfallConfig.rightColumnImages, ...waterfallConfig.rightColumnImages, ...waterfallConfig.rightColumnImages];

            leftCol.innerHTML = leftImages.map(img => `
                <img src="${img}" class="waterfall-img bose-fade-in-img" alt="حلويات بوسي" style="width: 100%; height: ${waterfallConfig.imageSize || '320px'}; object-fit: cover; border-radius: 16px; margin-bottom: 16px; display: block;" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${window.getBoseLogo()}';" loading="lazy">
            `).join('');

            rightCol.innerHTML = rightImages.map(img => `
                <img src="${img}" class="waterfall-img bose-fade-in-img" alt="حلويات بوسي" style="width: 100%; height: ${waterfallConfig.imageSize || '320px'}; object-fit: cover; border-radius: 16px; margin-bottom: 16px; display: block;" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${window.getBoseLogo()}';" loading="lazy">
            `).join('');

            leftCol.classList.add('waterfall-up');
            rightCol.classList.add('waterfall-down');

            const pauseWaterfall = () => {
                leftCol.style.animationPlayState = 'paused';
                rightCol.style.animationPlayState = 'paused';
            };
            const resumeWaterfall = () => {
                leftCol.style.animationPlayState = 'running';
                rightCol.style.animationPlayState = 'running';
            };
            
            waterfallContainer.addEventListener('touchstart', pauseWaterfall, {passive: true});
            waterfallContainer.addEventListener('touchend', resumeWaterfall, {passive: true});
            waterfallContainer.addEventListener('mouseenter', pauseWaterfall);
            waterfallContainer.addEventListener('mouseleave', resumeWaterfall);

            if (!waterfallContainer.querySelector('.waterfall-overlay-top')) {
                const overlayTop = document.createElement('div');
                overlayTop.className = 'waterfall-overlay-top';
                const overlayBottom = document.createElement('div');
                overlayBottom.className = 'waterfall-overlay-bottom';
                waterfallContainer.appendChild(overlayTop);
                waterfallContainer.appendChild(overlayBottom);
                waterfallContainer.style.position = 'relative';
            }
        }

        // 3. أتمتة مسار الإتقان الفاخر التلقائي ومؤشراتها النقطية المتزامنة
        const excellenceSection = document.getElementById('excellence-section');
        const excellenceTrack = document.getElementById('excellence-images-track');
        const excellenceConfig = data.homepage.excellence;
        if (excellenceTrack && excellenceConfig) {
            excellenceTrack.innerHTML = '';
            const doubledImages = [...excellenceConfig.images, ...excellenceConfig.images];
            excellenceTrack.className = 'animate-marquee';
            excellenceTrack.innerHTML = doubledImages.map(img => `
                <a href="menu.html" class="excellence-track-link" style="display: block; width: 33.33vw; min-width: 280px; flex-shrink: 0; padding: 0 8px; box-sizing: border-box;">
                    <img src="${img}" class="bose-fade-in-img" alt="إتقان بوسي" style="width: 100%; height: 350px; object-fit: cover; border-radius: 24px; border: var(--bose-border-pink);" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${window.getBoseLogo()}';" loading="lazy">
                </a>
            `).join('');
            
            excellenceTrack.addEventListener('mouseenter', () => { excellenceTrack.style.animationPlayState = 'paused'; });
            excellenceTrack.addEventListener('mouseleave', () => { excellenceTrack.style.animationPlayState = 'running'; });
            excellenceTrack.addEventListener('touchstart', () => { excellenceTrack.style.animationPlayState = 'paused'; }, {passive: true});
            excellenceTrack.addEventListener('touchend', () => { excellenceTrack.style.animationPlayState = 'running'; }, {passive: true});
            enableMarqueeDragScrolling(excellenceTrack);

            if (excellenceSection) {
                let activeDotIndex = 0;
                generateBoseDots(excellenceSection, excellenceConfig.images.length, activeDotIndex, (idx) => {
                    const slides = excellenceTrack.querySelectorAll('.excellence-track-link');
                    if (slides[idx]) {
                        const targetOffset = slides[idx].offsetLeft - (excellenceTrack.offsetWidth - slides[idx].offsetWidth) / 2;
                        excellenceTrack.scrollTo({
                            left: targetOffset,
                            behavior: 'smooth'
                        });
                    }
                });

                setupScrollToDotsBinding(excellenceTrack, excellenceSection, excellenceConfig.images.length);

                setInterval(() => {
                    if (excellenceTrack.style.animationPlayState !== 'paused') {
                        activeDotIndex = (activeDotIndex + 1) % excellenceConfig.images.length;
                        const dotsWrapper = excellenceSection.querySelector('.bose-dots-container');
                        if (dotsWrapper) {
                            dotsWrapper.querySelectorAll('.bose-dot').forEach((dot, idx) => {
                                dot.classList.toggle('active', idx === activeDotIndex);
                            });
                        }
                    }
                }, 5000);
            }
        }

        // 4. أتمتة رندرة الأقسام الحيوية الثلاثة بالصفحة الرئيسية
        
        // أ. الأكثر مبيعاً
        const mostSellingGrid = document.getElementById('most-selling-grid');
        if (mostSellingGrid && data.homepage.mostSelling) {
            mostSellingGrid.innerHTML = '';
            const matchedMSProducts = data.homepage.mostSelling.map(slug => productsList.find(p => p.slug === slug)).filter(Boolean);
            
            mostSellingGrid.innerHTML = matchedMSProducts.map(prod => generateStrictProductCardHTML(prod, currency)).join('');
            attachProductCardEvents(mostSellingGrid, productsList, currency);
        }

        // ب. وصل حديثاً ومؤشراتها النقطية
        const newArrivalsSection = document.getElementById('new-arrivals-section');
        const newArrivalsGrid = document.getElementById('new-arrivals-grid');
        if (newArrivalsGrid && data.homepage.newArrivals) {
            newArrivalsGrid.innerHTML = '';
            const matchedNAProducts = data.homepage.newArrivals.map(slug => productsList.find(p => p.slug === slug)).filter(Boolean);
            
            newArrivalsGrid.innerHTML = matchedNAProducts.map(prod => generateStrictProductCardHTML(prod, currency)).join('');
            attachProductCardEvents(newArrivalsGrid, productsList, currency);

            if (newArrivalsSection) {
                generateBoseDots(newArrivalsSection, Math.ceil(matchedNAProducts.length / 2), 0, (idx) => {
                    const cards = newArrivalsGrid.querySelectorAll('.product-card');
                    if (cards[idx * 2]) {
                        cards[idx * 2].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                    }
                });
                setupScrollToDotsBinding(newArrivalsGrid, newArrivalsSection, Math.ceil(matchedNAProducts.length / 2));
            }
        }

        // ج. منتجاتنا مع زر عرض المزيد لزيادة راحة تصفح العميل
        const ourProductsGrid = document.getElementById('our-products-grid');
        const showMoreBtn = document.getElementById('btn-show-more-products') || document.querySelector('.btn-show-more-node');
        
        if (ourProductsGrid && data.homepage.ourProducts) {
            ourProductsGrid.innerHTML = '';
            const matchedOPProducts = data.homepage.ourProducts.map(slug => productsList.find(p => p.slug === slug)).filter(Boolean);

            const initialProducts = matchedOPProducts.slice(0, 4);
            const remainingProducts = matchedOPProducts.slice(4);

            ourProductsGrid.innerHTML = initialProducts.map(prod => generateStrictProductCardHTML(prod, currency)).join('');
            attachProductCardEvents(ourProductsGrid, productsList, currency);

            if (showMoreBtn) {
                showMoreBtn.style.display = remainingProducts.length > 0 ? 'inline-flex' : 'none';
                
                if (!showMoreBtn.dataset.boseListener) {
                    showMoreBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = remainingProducts.map(prod => generateStrictProductCardHTML(prod, currency)).join('');
                        
                        while (tempDiv.firstChild) {
                            ourProductsGrid.appendChild(tempDiv.firstChild);
                        }

                        attachProductCardEvents(ourProductsGrid, productsList, currency);
                        showMoreBtn.style.display = 'none'; 
                        
                        window.dispatchEvent(new Event('bose_products_injected'));
                        window.showBoseToast("تم استعراض التشكيلة العامة الفاخرة بالكامل 🌸");
                    });
                    showMoreBtn.dataset.boseListener = "true";
                }
            }
        }

        // د. أتمتة كتلة محاكي التورت للقسم الفرعي
        const cakePreviewSec = document.getElementById('cake-preview-section');
        if (cakePreviewSec && data.homepage.cakePreview) {
            const previewData = data.homepage.cakePreview;
            const previewImg = document.getElementById('cake-preview-img') || cakePreviewSec.querySelector('img#cake-preview-img');
            const previewTitle = document.getElementById('cake-preview-title') || cakePreviewSec.querySelector('#cake-preview-title');
            const previewDesc = document.getElementById('cake-preview-desc') || cakePreviewSec.querySelector('#cake-preview-desc');
            const previewCta = document.getElementById('cake-preview-cta') || cakePreviewSec.querySelector('#cake-preview-cta');

            if (previewImg) {
                previewImg.src = previewData.image;
                previewImg.onload = () => previewImg.classList.add('loaded');
            }
            if (previewTitle) previewTitle.textContent = previewData.title;
            if (previewDesc) previewDesc.textContent = previewData.description;
            if (previewCta) {
                previewCta.href = previewData.target;
                previewCta.textContent = previewData.cta;
            }
        }

        // هـ. أتمتة كتلة محاكي الورد للقسم الفرعي
        const flowerPreviewSec = document.getElementById('flower-preview-section');
        if (flowerPreviewSec && data.homepage.flowerPreview) {
            const previewData = data.homepage.flowerPreview;
            const previewImg = document.getElementById('flower-preview-img') || flowerPreviewSec.querySelector('img#flower-preview-img');
            const previewTitle = document.getElementById('flower-preview-title') || flowerPreviewSec.querySelector('#flower-preview-title');
            const previewDesc = document.getElementById('flower-preview-desc') || flowerPreviewSec.querySelector('#flower-preview-desc');
            const previewCta = document.getElementById('flower-preview-cta') || flowerPreviewSec.querySelector('#flower-preview-cta');

            if (previewImg) {
                previewImg.src = previewData.image;
                previewImg.onload = () => previewImg.classList.add('loaded');
            }
            if (previewTitle) previewTitle.textContent = previewData.title;
            if (previewDesc) previewDesc.textContent = previewData.description;
            if (previewCta) {
                previewCta.href = previewData.target;
                previewCta.textContent = previewData.cta;
            }
        }

        // 5. أتمتة سلايدر الفئات الـ 12 ومؤشراتها النقطية التفاعلية
        const categoriesSliderSec = document.getElementById('categories-slider-section');
        const categoriesTrack = document.getElementById('categories-track');
        const categoriesData = data.homepage.categoriesSlider;
        if (categoriesTrack && categoriesData) {
            categoriesTrack.innerHTML = '';
            categoriesTrack.className = 'categories-track-loop';
            const categoriesLoopList = [...categoriesData, ...categoriesData]; 
            
            categoriesTrack.innerHTML = categoriesLoopList.map(cat => {
                const targetUrl = cat.builderType === 'cake-customizer' ? 'cake-builder.html' 
                                : (cat.builderType === 'flower-customizer' ? 'flower-builder.html' 
                                : `category.html?category=${cat.id}`);
                return `
                    <a href="${targetUrl}" class="category-slide-card" style="display: flex; flex-direction: column; align-items: center; width: 280px; flex-shrink: 0; padding: 12px; box-sizing: border-box; text-decoration: none;">
                        <img src="${cat.image}" class="bose-fade-in-img" alt="${escapeHTML(cat.title)}" style="width: 250px; height: 250px; object-fit: cover; border-radius: 20px; border: var(--bose-border-pink); box-shadow: var(--bose-shadow-glow);" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${window.getBoseLogo()}';" loading="lazy">
                        <span style="display: block; text-align: center; margin-top: 12px; font-size: 20px; font-weight: 700; color: var(--bose-black); line-height: 1.4;">${escapeHTML(cat.title)}</span>
                    </a>
                `;
            }).join('');

            categoriesTrack.addEventListener('mouseenter', () => { categoriesTrack.style.animationPlayState = 'paused'; });
            categoriesTrack.addEventListener('mouseleave', () => { categoriesTrack.style.animationPlayState = 'running'; });
            categoriesTrack.addEventListener('touchstart', () => { categoriesTrack.style.animationPlayState = 'paused'; }, {passive: true});
            categoriesTrack.addEventListener('touchend', () => { categoriesTrack.style.animationPlayState = 'running'; }, {passive: true});
            enableMarqueeDragScrolling(categoriesTrack);

            if (categoriesSliderSec) {
                let categoryDotIndex = 0;
                generateBoseDots(categoriesSliderSec, categoriesData.length, categoryDotIndex, (idx) => {
                    const slides = categoriesTrack.querySelectorAll('.category-slide-card');
                    if (slides[idx]) {
                        const targetOffset = slides[idx].offsetLeft - (categoriesTrack.offsetWidth - slides[idx].offsetWidth) / 2;
                        categoriesTrack.scrollTo({
                            left: targetOffset,
                            behavior: 'smooth'
                        });
                    }
                });

                setupScrollToDotsBinding(categoriesTrack, categoriesSliderSec, categoriesData.length);

                setInterval(() => {
                    if (categoriesTrack.style.animationPlayState !== 'paused') {
                        categoryDotIndex = (categoryDotIndex + 1) % categoriesData.length;
                        const dotsWrapper = categoriesSliderSec.querySelector('.bose-dots-container');
                        if (dotsWrapper) {
                            dotsWrapper.querySelectorAll('.bose-dot').forEach((dot, idx) => {
                                dot.classList.toggle('active', idx === categoryDotIndex);
                            });
                        }
                    }
                }, 6000);
            }
        }

        // 6. تشغيل العدادات التصاعدية لقسم الفخر والاعتزاز لثقة العملاء
        initBosePrideCounters(data);
    }

    /**
     * رندرة شريط الإعلانات التسويقية الموحد
     */
    function renderTopMarquee(marqueeTrack, messages) {
        marqueeTrack.innerHTML = '';
        const repeatedMessages = [
            ...messages, ...messages, ...messages, ...messages
        ];
        
        const listContainer = document.createElement('div');
        listContainer.className = 'animate-marquee';
        listContainer.style.cssText = 'display: flex; align-items: center; gap: 40px;';
        
        listContainer.innerHTML = repeatedMessages.map(msg => `
            <span class="marquee-msg" style="white-space: nowrap; font-size: 0.85rem; font-weight: 700; color: var(--bose-white); display: flex; align-items: center; gap: 8px;">
                🌸 ${escapeHTML(msg)}
            </span>
        `).join('');
        
        marqueeTrack.appendChild(listContainer);
        enableMarqueeDragScrolling(listContainer);
    }

    /**
     * محرك العدادات التصاعدية الذكي لقسم الفخر والاعتزاز
     */
    function initBosePrideCounters(data) {
        const statsContainer = document.querySelector('.stats-container') || document.getElementById('pride-section');
        if (!statsContainer) return;

        const prideConfig = data?.homepage?.pride;
        if (!prideConfig || !prideConfig.stats) return;

        const statsData = prideConfig.stats;

        const statsMap = {
            years: { selector: '.stat-years-val', id: 'stat-years-value', key: 'years' },
            customers: { selector: '.stat-customers-val', id: 'stat-customers-value', key: 'customers' },
            orders: { selector: '.stat-orders-val', id: 'stat-orders-value', key: 'orders' },
            cakes: { selector: '.stat-cakes-val', id: 'stat-cakes-value', key: 'cakes' },
            bouquets: { selector: '.stat-bouquets-val', id: 'stat-bouquets-value', key: 'bouquets' }
        };

        Object.entries(statsMap).forEach(([statName, mapping]) => {
            const element = statsContainer.querySelector(mapping.selector) || document.getElementById(mapping.id);
            if (!element) return;

            const configItem = statsData[mapping.key];
            if (!configItem) return;

            const targetValue = parseInt(configItem.value, 10) || 0;
            const suffix = configItem.suffix || "+";

            if (element.dataset.animated === "true") return;

            element.textContent = `0${suffix}`;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        element.dataset.animated = "true";
                        animateBoseCountUp(element, targetValue, suffix);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(entry.target);
        });
    }
    window.initBosePrideCounters = initBosePrideCounters;

    /**
     * حركة العداد التصاعدي ناعمة ومحسنة لحماية معالج الموبايل والأداء
     */
    function animateBoseCountUp(element, target, suffix) {
        let start = 0;
        const duration = 2000; 
        const startTime = performance.now();
        let lastUpdateTime = 0;

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeProgress = progress * (2 - progress);
            const currentValue = Math.floor(easeProgress * target);

            if (currentTime - lastUpdateTime > 16 || progress === 1) {
                element.textContent = `${currentValue}${suffix}`;
                lastUpdateTime = currentTime;
            }

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = `${target}${suffix}`;
            }
        }

        requestAnimationFrame(updateCounter);
    }

    /**
     * استرجاع آمن لسلة المشتريات من المتصفح الخفي والذاكرة الاحتياطية
     */
    window.getBoseCart = function () {
        try {
            let rawCart = null;
            try {
                rawCart = localStorage.getItem(CART_STORAGE_KEY);
            } catch (ex) {}
            
            if (!rawCart) return window.boseInMemoryCart || [];
            
            let parsed = JSON.parse(rawCart);
            if (!Array.isArray(parsed)) return [];
            
            return parsed;
        } catch (e) {
            console.error("❌ سلة التسوق تالفة في الذاكرة، تم تصفيرها احترازياً:", e);
            return [];
        }
    };

    /**
     * حفظ ومزامنة السلة وتحديث الشارات بالصفحات المفتوحة مع تمريرها على فلاتر التطهير
     */
    window.saveBoseCart = function (cart) {
        try {
            if (!Array.isArray(cart)) return;
            
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
            } catch (storageEx) {
                // Fallback لوضع التصفح الخاص
            }
            window.boseInMemoryCart = cart;
            window.updateGlobalCartCounter();
            window.dispatchEvent(new Event('bose_cart_updated'));
            window.dispatchEvent(new CustomEvent('bose_cart_changed', { detail: cart }));
        } catch (e) {
            console.error("❌ فشل حفظ السلة بالذاكرة المحلية:", e);
        }
    };

    /**
     * الإضافة الذكية والموحدة للسلة مع المطابقة الكاملة وتأمين الأسعار النهائية
     */
    window.addBoseCartItem = function (newItem) {
        if (!newItem || !newItem.productSlug) return;

        const cart = window.getBoseCart();

        if (!newItem.image && newItem.images && newItem.images.length > 0) {
            newItem.image = newItem.images[0];
        }

        const existingItemIndex = cart.findIndex(item => {
            if (item.productSlug === newItem.productSlug && item.type === newItem.type) {
                if (item.type !== "standard") {
                    return isEquivalentDetails(item.customDetails, newItem.customDetails);
                }
                return item.flavorName === newItem.flavorName;
            }
            return false;
        });

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity = (parseInt(cart[existingItemIndex].quantity) || 0) + (parseInt(newItem.quantity) || 1);
        } else {
            if (!newItem.id) {
                if (newItem.type !== "standard") {
                    newItem.id = `${newItem.productSlug}-${Date.now()}`;
                } else {
                    newItem.id = newItem.productSlug;
                }
            }
            cart.push(newItem);
        }

        window.saveBoseCart(cart);
        window.showBoseToast(`تمت إضافة ${newItem.title} إلى السلة بنجاح 🌸`);
    };

    window.addBoseItemToCart = function(product, quantity = 1, customDetails = null, customPrice = null) {
        const finalPrice = customPrice !== null ? customPrice : product.price;
        const newItem = {
            productSlug: product.slug,
            title: product.title,
            flavorName: (customDetails && customDetails.flavorName) || product.flavorName || "كلاسيك",
            price: parseFloat(finalPrice),
            finalPrice: parseFloat(finalPrice),
            basePrice: parseFloat(product.basePrice || product.price),
            quantity: parseInt(quantity, 10) || 1,
            image: product.image || (product.images && product.images.length > 0 ? product.images[0] : ""),
            type: product.type || (product.isMiniCake ? "mini-cake" : "standard"),
            customDetails: customDetails
        };
        window.addBoseCartItem(newItem);
    };

    /**
     * تحديث كمية صنف بداخل السلة مع منع القيم الصفرية أو السالبة
     */
    window.updateBoseCartItemQuantity = function (itemId, newQuantity) {
        let cart = window.getBoseCart();
        const itemIndex = cart.findIndex(item => item.id === itemId);

        if (itemIndex > -1) {
            const qty = parseInt(newQuantity);
            if (isNaN(qty) || qty <= 0) {
                cart.splice(itemIndex, 1);
                window.showBoseToast("تمت إزالة الصنف من السلة 🌸");
            } else {
                cart[itemIndex].quantity = qty;
            }
            window.saveBoseCart(cart);
        }
    };

    /**
     * إزالة صنف محدد من سلة المشتريات
     */
    window.removeBoseCartItem = function (itemId) {
        let cart = window.getBoseCart();
        const updatedCart = cart.filter(item => item.id !== itemId);
        window.saveBoseCart(updatedCart);
    };

    /**
     * تفريغ وتصفير السلة بالكامل لتجهيز المعاملات الجديدة
     */
    window.clearBoseCart = function () {
        try {
            localStorage.removeItem(CART_STORAGE_KEY);
        } catch (ex) {}
        window.boseInMemoryCart = [];
        window.updateGlobalCartCounter();
        window.dispatchEvent(new Event('bose_cart_updated'));
        window.dispatchEvent(new CustomEvent('bose_cart_changed', { detail: [] }));
    };

    /**
     * تحديث عداد السلة الصغير بالهيدر وفقاً للكميات
     */
    window.updateGlobalCartCounter = function () {
        if (!domCache.cartCounts) {
            domCache.cartCounts = document.querySelectorAll("#nav-cart-count, .nav-cart-count-badge");
        }
        if (domCache.cartCounts.length === 0) return;

        try {
            const cart = window.getBoseCart();
            let totalDisplayItems = 0;
            cart.forEach(item => {
                const isBespokeOrCustom = item.type === "custom-cake" || 
                                          item.type === "custom-flower" || 
                                          item.type === "mini-cake" || 
                                          (item.id && item.id.includes("-"));
                                      
                if (isBespokeOrCustom) {
                    totalDisplayItems += 1;
                } else {
                    totalDisplayItems += (parseInt(item.quantity, 10) || 1);
                }
            });
            
            domCache.cartCounts.forEach(badge => {
                badge.textContent = totalDisplayItems;
            });
        } catch (e) {
            console.error("❌ فشل تحديث شارة العداد بالسلة:", e);
        }
    };

    /**
     * بناء الـ Modal الخاص بالبحث السريع والذكي ديناميكياً لتأمين الشاشات والصفحات
     */
    function ensureSearchModalExists() {
        if (domCache.searchModal) return domCache.searchModal;

        let searchModal = document.querySelector(".bose-search-modal");
        if (!searchModal) {
            searchModal = document.createElement("div");
            searchModal.className = "bose-search-modal";
            searchModal.id = "search-container";
            searchModal.innerHTML = `
                <div class="search-modal-box">
                    <div class="search-modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(255,145,164,0.15); padding-bottom:12px;">
                        <h3 style="margin:0; font-size:1.15rem; font-weight:700; color:var(--bose-black);">البحث السريع في الأصناف</h3>
                        <button class="search-close-btn" style="background:none; border:none; font-size:1.5rem; color:var(--bose-black); cursor:pointer; font-weight:700;" aria-label="إغلاق نافذة البحث">×</button>
                    </div>
                    <div class="search-modal-body">
                        <input type="text" id="global-search-input" placeholder="اكتب اسم صنفك المفضل.. (لوتس، كب كيك، بوكس..)" style="width:100%; border:var(--bose-border-pink); border-radius:12px; padding:12px 16px; font-family:'Cairo', sans-serif; font-size:0.95rem; box-sizing:border-box; outline:none; transition:0.2s; color:var(--bose-black);" onfocus="this.style.borderColor='var(--bose-pink)'" onblur="this.style.borderColor='rgba(255,145,164,0.3)'">
                        <div class="search-results-container" style="margin-top:16px;">
                            <div class="search-empty-state">
                                <p class="search-empty-state-text">اكتب اسم صنفك المفضل للبحث السريع عنه.. 🌸</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(searchModal);
        }
        domCache.searchModal = searchModal;
        return searchModal;
    }

    /**
     * إعداد وربط أحداث الواجهات التفاعلية (البحث السريع والدرج الجانبي للموبايل والكمبيوتر)
     */
    function initializeGlobalUIEvents() {
        const menuToggleButtons = document.querySelectorAll("#mobile-menu-toggle, .nav-menu-toggle, #menu-toggle-btn");
        const drawerMenu = document.querySelector(".bose-drawer-menu, #sidebar-drawer");
        const closeDrawerButtons = document.querySelectorAll("#sidebar-close-panel-btn, #drawer-shield");
        
        let drawerOverlay = document.querySelector(".drawer-overlay, #drawer-shield");
        if (!drawerOverlay && drawerMenu) {
            drawerOverlay = document.createElement("div");
            drawerOverlay.className = "drawer-overlay";
            drawerOverlay.id = "drawer-shield";
            document.body.appendChild(drawerOverlay);
        }

        const toggleDrawer = (forceState) => {
            if (!drawerMenu) return;
            const currentState = drawerMenu.classList.contains("active");
            const nextState = typeof forceState === "boolean" ? forceState : !currentState;
            
            drawerMenu.classList.toggle("active", nextState);
            if (drawerOverlay) drawerOverlay.classList.toggle("active", nextState);
            document.body.style.overflow = nextState ? "hidden" : "";
        };

        menuToggleButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                toggleDrawer();
            });
        });

        if (drawerOverlay) {
            drawerOverlay.addEventListener("click", () => toggleDrawer(false));
        }

        closeDrawerButtons.forEach(btn => {
            btn.addEventListener("click", () => toggleDrawer(false));
        });

        const searchTriggerButtons = document.querySelectorAll("#nav-search-btn, .nav-search-trigger, #search-trigger-btn");
        
        searchTriggerButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const searchModal = ensureSearchModalExists();
                toggleSearchModal(searchModal, true);
            });
        });
    }

    function toggleSearchModal(modalElement, show) {
        if (!modalElement) return;
        modalElement.classList.toggle("active", show);
        document.body.style.overflow = show ? "hidden" : "";
        
        if (show) {
            const searchInput = document.getElementById("global-search-input");
            if (searchInput) {
                searchInput.value = "";
                searchInput.focus();
            }
            renderSearchResults("");
            
            const closeBtn = modalElement.querySelector(".search-close-btn");
            if (closeBtn && !closeBtn.dataset.boseListener) {
                closeBtn.addEventListener("click", () => toggleSearchModal(modalElement, false));
                closeBtn.dataset.boseListener = "true";
            }
            
            if (!modalElement.dataset.boseListener) {
                modalElement.addEventListener("click", (e) => {
                    if (e.target === modalElement) {
                        toggleSearchModal(modalElement, false);
                    }
                });
                
                document.addEventListener("keydown", (e) => {
                    if (e.key === "Escape" && modalElement.classList.contains("active")) {
                        toggleSearchModal(modalElement, false);
                    }
                });
                
                const searchInputLive = document.getElementById("global-search-input");
                if (searchInputLive) {
                    searchInputLive.addEventListener("input", (e) => {
                        const query = e.target.value.trim();
                        clearTimeout(searchDebounceTimeout);
                        searchDebounceTimeout = setTimeout(() => {
                            renderSearchResults(query);
                        }, 250);
                    });

                    searchInputLive.addEventListener("keydown", (e) => {
                        if (e.key === "Enter" || e.keyCode === 13) {
                            e.preventDefault();
                            const firstCard = resultsContainerElement().querySelector(".search-result-card");
                            if (firstCard) {
                                toggleSearchModal(modalElement, false);
                                window.location.href = firstCard.getAttribute("href");
                            }
                        }
                    });
                }
                modalElement.dataset.boseListener = "true";
            }
        }
    }

    function resultsContainerElement() {
        if (!domCache.resultsContainer) {
            domCache.resultsContainer = document.querySelector(".search-results-container");
        }
        return domCache.resultsContainer;
    }

    function renderSearchResults(query) {
        const resultsContainer = resultsContainerElement();
        if (!resultsContainer) return;

        if (!query) {
            resultsContainer.innerHTML = `
                <div class="search-empty-state">
                    <p class="search-empty-state-text">اكتب اسم صنفك المفضل للبحث السريع عنه.. 🌸</p>
                </div>
            `;
            return;
        }

        const data = window.BoseStoreData;
        
        if (!data || !data.products) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <p class="search-no-results-main">لحظة واحدة.. بنحضر المنيو الفاخر 🌸</p>
                </div>
            `;
            return;
        }

        const lowerCaseQuery = query.toLowerCase();

        const matchedProducts = data.products.filter(product => {
            const inTitle = product.title.toLowerCase().includes(lowerCaseQuery);
            const inFlavor = (product.flavorName || "").toLowerCase().includes(lowerCaseQuery);
            const inDesc = (product.description || "").toLowerCase().includes(lowerCaseQuery);
            const inSearchTerms = product.searchTerms && product.searchTerms.some(term => term.toLowerCase().includes(lowerCaseQuery));
            
            return inTitle || inFlavor || inDesc || inSearchTerms;
        });

        if (matchedProducts.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <p class="search-no-results-main">ملقناش أصناف مطابقة لـ "${escapeHTML(query)}"</p>
                    <p class="search-no-results-sub">جرب تكتب كلمات بسيطة زي: لوتس، كب كيك، بوكس، تورتة..</p>
                </div>
            `;
            return;
        }

        let htmlResults = `<div class="search-results-grid">`;
        
        matchedProducts.forEach(product => {
            const finalPrice = window.calculateBosePrice(product.price, "menu-only");
            const sanitizedTitle = escapeHTML(product.title);
            const sanitizedFlavor = escapeHTML(product.flavorName || "كلاسيك");
            const firstImage = product.image || (product.images && product.images.length > 0 ? product.images[0] : window.getBoseLogo());
            
            htmlResults += `
                <a href="product.html?slug=${product.slug}" class="search-result-card" data-slug="${product.slug}">
                    <img src="${firstImage}" alt="${sanitizedTitle}" class="search-card-img bose-fade-in-img" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${window.getBoseLogo()}';">
                    <div class="search-card-info-pane">
                        <h4 class="search-card-title">${sanitizedTitle}</h4>
                        <span class="search-card-flavor">${sanitizedFlavor}</span>
                        <div class="search-card-meta-row">
                            <span class="bose-price-text search-card-price">${finalPrice} ${data.store.currency}</span>
                            <span class="search-card-action-badge">استعرض الصنف 🌸</span>
                        </div>
                    </div>
                </a>
            `;
        });

        htmlResults += `</div>`;
        resultsContainer.innerHTML = htmlResults;

        resultsContainer.querySelectorAll(".search-result-card").forEach(card => {
            card.addEventListener("click", () => {
                const searchModal = document.querySelector(".bose-search-modal");
                if (searchModal) {
                    searchModal.classList.remove("active");
                }
                document.body.style.overflow = "";
            });
        });
    }

    /**
     * دوال خدمات التسهيل والربط المباشر الموحدة لجلب المنتجات والفئات من أي ملف داخلي
     */
    window.getBoseProductBySlug = async function(slug) {
        const data = await window.getBoseDatabase();
        if (!data || !data.products) return null;
        return data.products.find(p => p.slug === slug) || null;
    };

    window.getBoseProductsByCategory = async function(categoryId) {
        const data = await window.getBoseDatabase();
        if (!data || !data.products) return [];
        return data.products.filter(p => p.category === categoryId);
    };

    /**
     * تطبيق الإعدادات الفنية للـ SEO وتأمين الهوية البصرية الحاكمة لـ حلويات بوسي
     */
    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;

        const isPlaceholderTitle = document.title === "" || 
                                   document.title === "Document" || 
                                   document.title.includes("localhost") || 
                                   document.title.includes("127.0.0.1") ||
                                   document.title === "حلويات بوسي";
        
        if (isPlaceholderTitle) {
            document.title = data.seo.title;
        }

        ensureMetaTag("description", data.seo.description);
        ensureMetaTag("keywords", data.seo.keywords.join(", "));
        ensureMetaTag("og:title", data.seo.title, true);
        ensureMetaTag("og:description", data.seo.description, true);
        ensureMetaTag("og:image", data.seo.ogImage, true);
        ensureMetaTag("og:url", window.location.href, true);

        const logoElements = document.querySelectorAll("img#bose-store-logo, .bose-header-logo-image, .footer-brand-logo");
        logoElements.forEach(img => {
            if (img && img.src !== data.store.logo) {
                img.src = data.store.logo;
                img.alt = data.store.name;
                img.loading = "lazy";
            }
        });

        const footerAbout = document.getElementById("footer-about-text");
        if (footerAbout) {
            footerAbout.textContent = data.footer.about;
        }

        const copyrightYearSpan = document.getElementById("copyright-year");
        if (copyrightYearSpan) {
            copyrightYearSpan.textContent = "2026";
        }

        const copyrightBlocks = document.querySelectorAll(".footer-copyright-block p");
        copyrightBlocks.forEach(p => {
            if (p) {
                p.innerHTML = `© <span>2026</span> جميع الحقوق محفوظة لعلامة حلويات بوسي التجارية الفاخرة`;
            }
        });

        injectEarlyDependencies();
        applyGlobalStyles(data.store.theme);
        updateSocialLinks(data.social);
    }

    function ensureMetaTag(name, content, isProperty = false) {
        const attributeName = isProperty ? "property" : "name";
        let meta = document.querySelector(`meta[${attributeName}="${name}"]`);
        if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute(attributeName, name);
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
    }

    function updateSocialLinks(socialData) {
        const facebookBtns = document.querySelectorAll(".social-link-facebook");
        const instagramBtns = document.querySelectorAll(".social-link-instagram");
        const tiktokBtns = document.querySelectorAll(".social-link-tiktok");
        const whatsappBtns = document.querySelectorAll(".social-link-whatsapp");

        facebookBtns.forEach(btn => { if (socialData.facebook) btn.href = socialData.facebook; });
        instagramBtns.forEach(btn => { if (socialData.instagram) btn.href = socialData.instagram; });
        tiktokBtns.forEach(btn => { if (socialData.tiktok) btn.href = socialData.tiktok; });
        whatsappBtns.forEach(btn => {
            if (socialData.whatsapp) {
                btn.href = `https://wa.me/${socialData.whatsapp}`;
            }
        });
    }

    /**
     * زراعة الأنماط والألوان الحاكمة والمقدسة للبراند ديناميكياً
     */
    function applyGlobalStyles(theme) {
        if (!theme) return;
        let styleElement = document.getElementById('bose-global-dynamic-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'bose-global-dynamic-styles';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            :root {
                --bose-pink: ${theme.primary || '#FF91A4'};
                --bose-white: ${theme.background || '#FFFFFF'};
                --bose-black: ${theme.text || '#111111'};
                --bose-gold: ${theme.secondary || '#D4AF37'};
                --bose-shadow-glow: 0 8px 32px rgba(255, 145, 164, 0.12);
                --bose-shadow-hover: 0 16px 40px rgba(255, 145, 164, 0.22);
                --bose-border-pink: 1px solid rgba(255, 145, 164, 0.3);
                --bose-border-thick: 2px solid ${theme.primary || '#FF91A4'};
            }
        `;
    }

    /**
     * حقن مكتبات الخطوط Cairo والـ FontAwesome برمجياً لتجنب التأخر البصري للأيقونات والخطوط
     */
    function injectEarlyDependencies() {
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            const preconnect1 = document.createElement('link');
            preconnect1.rel = 'preconnect';
            preconnect1.href = 'https://fonts.googleapis.com';
            
            const preconnect2 = document.createElement('link');
            preconnect2.rel = 'preconnect';
            preconnect2.href = 'https://fonts.gstatic.com';
            preconnect2.crossOrigin = 'anonymous';

            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
            
            document.head.appendChild(preconnect1);
            document.head.appendChild(preconnect2);
            document.head.appendChild(fontLink);
        }

        if (!document.querySelector('link[href*="font-awesome"]')) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(faLink);
        }
    }

    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) {
            window.updateGlobalCartCounter();
            window.dispatchEvent(new Event('bose_cart_updated'));
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadStoreDatabase);
    } else {
        loadStoreDatabase();
    }
})();
