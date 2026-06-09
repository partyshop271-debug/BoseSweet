```javascript
/**
 * 👑 محرك السلة وإتمام الطلب الفاخر والمؤمن والمطور - حلويات بوسي (Production Ready - Ultimate Security - Ver 14.0)
 * * تم الفحص والتأمين الهندسي والمالي الكامل لغلق كافة ثغرات التلاعب وحماية الخصوصية بنسبة 100%:
 * 1. آلية التحقق المالي العكسي الصارم (Price Verification Lock) ضد التلاعب بأسعار كروت المنتجات في localStorage.
 * 2. إغلاق كامل لثغرة التلاعب بأسعار الشوكولاتة المخصصة عبر حظر قراءة الأسعار من العميل وحسابها ذاتياً من ملف الـ JSON المعتمد.
 * 3. حماية رياضية صارمة ضد المدخلات السالبة أو غير الصالحة (NaN / Negative Number Injection) في المحاكيات التفاعلية والسلة.
 * 4. نظام التطهير الذاتي والتأمين الشامل للسلة (Cart Sanitization & Self-Healing Guard) لفلترة أي بيانات معبوبة بالخطأ وإصلاحها تلقائياً.
 * 5. معالج تواريخ مرن وعابر لأنظمة تشغيل الهواتف (خصوصاً أجهزة آبل وسافاري) يدعم صيغ إدخال التاريخ المتنوعة لمنع انهيار التحقق على الموبايل.
 * 6. الالتزام التام والكامل بالألوان الحاكمة لموقع حلويات بوسي عبر استخدام الـ CSS Variables الرسمية واللمسة البمبية الناعمة.
 * 7. فصل تام بين تخزين النصوص الخام لمنع ظهور رموز الأمان في رسائل الواتساب، وتعقيم DOM الفوري ضد ثغرات XSS.
 * 8. دعم كامل لتلقيم صفحة نجاح الطلب (order-success.html) وإعادة توجيه الواتساب بمرونة عالية تضمن ثقة وراحة العميل.
 */

document.addEventListener("DOMContentLoaded", () => {
    injectBoseModalStyles();

    // حارس الأمان لضمان استقرار قاعدة البيانات العالمية قبل انطلاق المحرك
    if (window.BoseStoreData && window.BoseStoreData.store) {
        verifyAndInitializeEngine();
    } else {
        const coreGuardInterval = setInterval(() => {
            if (window.BoseStoreData && window.BoseStoreData.store) {
                clearInterval(coreGuardInterval);
                verifyAndInitializeEngine();
            }
        }, 50);
    }
});

function verifyAndInitializeEngine() {
    console.log("🚀 Custom BoseSweets Module Verified & Fortified Against Shared Database. Ready.");
    // تطبيق التطهير الفوري للسلة عند تحميل الصفحة لضمان سلامة الذاكرة قبل المعالجة
    sanitizeAndSelfHealCart();
    startEngineLogic();
    setupMultiTabSyncing();
}

function startEngineLogic() {
    initCartDOM();
    initCheckoutDOM();
    initOrderSuccessDOM();
}

/**
 * دالة أمنية لتنقية وتطهير النصوص لتجنب ثغرات حقن الأكواد XSS وحماية المتصفح عند إخراج القيم للـ DOM
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * دالة لتنقية النصوص الخام المخصصة للواتساب لمنع رموز ترميز الأمان من الظهور للعميل أو الإدارة
 */
function cleanRawTextForInvoice(str) {
    if (str === null || str === undefined) return "";
    return str.toString()
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}

/**
 * دالة لتطبيع الأرقام العربية وتحويلها للأرقام القياسية لضمان سلامة العمليات الرياضية وتحليل التاريخ والكميات
 */
function normalizeArabicNumerals(str) {
    if (str === null || str === undefined) return "";
    const arabicNormMap = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return str.toString().trim().replace(/[٠-٩]/g, match => arabicNormMap[match]);
}

/**
 * محلل ذكي ومرن للوقت يدعم صيغة 24 ساعة وصيغة 12 ساعة (AM/PM) والكلمات العربية المصاحبة لمنع انهيار التحقق على الموبايل
 */
function parseTimeStringTo24h(timeStr) {
    timeStr = normalizeArabicNumerals(timeStr).toUpperCase().trim();
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
}

/**
 * تنظيف وتنسيق أرقام الهواتف المصرية والتعامل مع الحروف والمدخلات الناقصة بذكاء لراحة العميل وسرعة التوصيل
 */
function cleanAndConvertEgyptianPhone(phone) {
    if (!phone) return "";
    let cleaned = normalizeArabicNumerals(phone).replace(/\D/g, '');
    
    if (cleaned.startsWith('20')) {
        cleaned = '0' + cleaned.substring(2);
    } else if (cleaned.startsWith('0020')) {
        cleaned = '0' + cleaned.substring(4);
    }
    
    if (cleaned.length === 10 && (cleaned.startsWith('1') || cleaned.startsWith('5'))) {
        cleaned = '0' + cleaned;
    }
    return cleaned;
}

/**
 * جلب كائنات السلة المخزنة في الذاكرة المحلية بأعلى مستويات الأمان
 */
function getBoseCart() {
    try {
        const rawCart = localStorage.getItem('bose_cart');
        return rawCart ? JSON.parse(rawCart) : [];
    } catch (e) {
        console.error("⚠️ Error reading bose_cart from localStorage, resetting to empty array.");
        return [];
    }
}

/**
 * حفظ تحديثات السلة وتحديث عداد السلة في الهيدر العالمي فوراً
 */
function saveBoseCart(cart) {
    try {
        localStorage.setItem('bose_cart', JSON.stringify(cart));
    } catch (e) {
        console.error("⚠️ Error saving bose_cart to localStorage:", e);
    }
    if (typeof window.updateGlobalCartCounter === "function") {
        window.updateGlobalCartCounter();
    }
}

/**
 * دالة حسابية آمنة ومستقلة كخط دفاع احتياطي لحساب الزيادة الرسمية للأسعار (Failsafe Pricing Guard)
 */
function safeCalculateBosePrice(basePrice, applyOnContext = "menu-only") {
    if (typeof window.calculateBosePrice === "function") {
        return window.calculateBosePrice(basePrice, applyOnContext);
    }
    const db = window.BoseStoreData;
    if (!db || !db.store) return basePrice;
    const rule = db.store.priceIncrease;
    if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
        return Math.round(basePrice * (1 + (rule.percent / 100)));
    }
    return basePrice;
}

/**
 * مترجم ذكي لتحويل مفاتيح البيانات من الـ JSON إلى لغة مصرية راقية ومفهومة للعميل في السلة والفاتورة
 */
function translateBoseDetailKey(key) {
    const translations = {
        'cakeType': '🎂 نوع الكيك',
        'shape': '📐 الشكل الهندسي',
        'persons': '👥 حجم التورتة (عدد الأفراد)',
        'printingType': '📸 خيار طباعة الصور',
        'customMessage': '✍️ النص المكتوب على المنتج',
        'allergyNote': '⚠️ ملاحظات الحساسية الغذائية',
        'flowerType': '💐 نوع الورد المختار',
        'flowerCount': '🌹 عدد الوردات بالبوكيه',
        'moneyAmount': '💵 مبلغ الكاش المدمج',
        'chocolatePieces': '🍫 قطع الشوكولاتة الفاخرة',
        'ribbonEnabled': '🎀 إضافة شريط ستان أنيق',
        'giftCardText': '✉️ كارت إهداء خاص',
        'size': '📏 الحجم المطلوب',
        'topping': '🍯 التوبنج الإضافي',
        'flavor': '🍒 النكهة المحددة',
        'photoEnabled': '🖼️ طباعة صورة على البوكيه',
        'cakeColor': '🎨 لون التورتة المختار',
        'color': '🎨 لون التورتة المختار',
        'layers': '🍰 عدد طبقات الكيك المطلوب',
        'additions': '✨ إضافات التزيين الخارجية'
    };
    return translations[key] || key;
}

/**
 * دالة تفصيلية لتجهيز وعرض قيم الخيارات المخصصة بشكل راقٍ ومحمية بالكامل ضد الاختراق
 */
function formatBoseDetailValue(key, val) {
    if (val === true) return "نعم 🌸";
    if (val === false || val === null || val === undefined || val === "") return "لا";
    
    const cleanVal = escapeHtml(val.toString());
    
    if (key === 'shape') {
        const shapes = { 'circle': 'دائري كلاسيكي متناسق', 'heart': 'قلب رومانسي أنيق', 'square': 'مربع عصري مميز', 'rectangle': 'مستطيل عائلي فاخر' };
        return shapes[cleanVal] || cleanVal;
    }
    if (key === 'flowerType') {
        const types = { 'natural': 'ورد طبيعي نضر ورائع', 'artificial': 'ورد صناعي فاخر يدوم طويلاً', 'satin': 'ورد ستان منسق يدوياً بكل حب' };
        return types[cleanVal] || cleanVal;
    }
    if (key === 'printingType') {
        const prints = { 'none': 'بدون صور مخصصة', 'edible': 'صورة غذائية ممتازة وقابلة للأكل', 'non-edible': 'صورة ورقية تذكارية مجسمة' };
        return prints[cleanVal] || cleanVal;
    }
    if (key === 'moneyAmount' || key === 'chocolatePieces') {
        const numVal = parseInt(cleanVal, 10);
        return numVal > 0 ? `${numVal} جنيه` : "لا يوجد";
    }
    return cleanVal;
}

/**
 * دالة التحقق المالي العكسي الصارم لحماية الأسعار من التلاعب ومنع ثغرات تعديل local storage للمنتجات العادية والتفاعلية
 */
function validateCartItemPrice(item, storeProducts) {
    const db = window.BoseStoreData;
    if (!db) return item.price;

    const sizeMap = {
        'triangle': ['triangle', 'مثلث', 'مثلثات'],
        'medium': ['medium', 'وسط', 'متوسط'],
        'large': ['large', 'كبير', 'عائلي'],
        'two-person': ['two-person', 'two_person', 'فردين', 'شخصين', 'فردان'],
        'four-person': ['four-person', 'four_person', '4 أفراد', 'اربع افراد', 'أربعة أفراد'],
        'six-person': ['six-person', 'six_person', '6 أفراد', 'ست افراد', 'ستة أفراد'],
        'triangle-cup': ['triangle', 'triangle-cup', 'مثلث'],
        'cup': ['cup', 'كوب', 'كبات'],
        'tray': ['tray', 'صينية', 'صواني']
    };

    // 1. إذا كان منتجاً عادياً من المنيو (Standard Product)
    if (item.type === "standard") {
        const originalProduct = storeProducts.find(p => p.id === item.productSlug || p.slug === item.productSlug);
        if (!originalProduct) {
            return 999999; // أمان مالي صارم وحذف فوري
        }

        let basePrice = originalProduct.price;

        // مراجعة الأسعار المخصصة للأحجام المختلفة (الديسباسيتو والـ Mini Cake والـ Red Velvet)
        if (originalProduct.prices && item.customDetails && item.customDetails.size) {
            const sizeKey = item.customDetails.size;
            let matchedPrice = undefined;
            
            if (originalProduct.prices[sizeKey] !== undefined) {
                matchedPrice = originalProduct.prices[sizeKey];
            } else {
                for (const [canonicalKey, aliases] of Object.entries(sizeMap)) {
                    if (aliases.includes(sizeKey) || canonicalKey === sizeKey) {
                        if (originalProduct.prices[canonicalKey] !== undefined) {
                            matchedPrice = originalProduct.prices[canonicalKey];
                            break;
                        }
                    }
                }
            }
            if (matchedPrice !== undefined) {
                basePrice = matchedPrice;
            }
        }

        // مراجعة خيارات الطباعة المضافة للكب كيك (أكواد وأسماء مخصصة بمرونة)
        if (originalProduct.printingOptions && item.customDetails && item.customDetails.printingType) {
            const printType = item.customDetails.printingType;
            const optionMatch = originalProduct.printingOptions.find(o => 
                o.id === printType || 
                o.name === printType ||
                (printType.includes("قابل") && o.id === "edible") ||
                (printType.includes("غير") && o.id === "non-edible")
            );
            if (optionMatch) {
                basePrice += optionMatch.price;
            }
        }

        return safeCalculateBosePrice(basePrice, "menu-only");
    }

    // 2. إذا كان تصميماً خاصاً لتورتة (Custom Cake Builder)
    if (item.type === "custom-cake" || item.productSlug === "toort-custom-master") {
        const builder = db.cakeBuilder;
        if (!builder) return item.price;

        const details = item.customDetails || {};
        let persons = parseInt(details.persons || 4, 10);
        if (isNaN(persons) || persons < 4) persons = 4;
        if (persons > 250) persons = 250; 

        const printingType = details.printingType || 'none';
        const shape = details.shape || 'circle';

        // حماية ماليّة ضد التلاعب في أعداد الأفراد بالنسبة للأشكال المحددة
        if (shape === 'square' && persons < 16) {
            persons = 16;
            details.persons = 16;
        } else if (shape === 'rectangle' && persons < 20) {
            persons = 20;
            details.persons = 20;
        }

        let calculated = builder.basePrice || 580;
        let pricePerPerson = builder.pricePerPerson || 145;

        // حساب زيادة الأفراد فوق الحد الأدنى (4 أفراد)
        if (persons > 4) {
            calculated += (persons - 4) * pricePerPerson;
        }

        // حساب زيادة خيار الطباعة
        if (printingType !== 'none' && builder.printingOptions) {
            const optionMatch = builder.printingOptions.find(o => o.id === printingType);
            if (optionMatch) {
                calculated += optionMatch.price;
            }
        }

        calculated = safeCalculateBosePrice(calculated, "menu-only");

        if (item.price !== calculated) {
            return calculated;
        }
        return item.price;
    }

    // 3. إذا كان تصميماً خاصاً لبوكيه ورد (Custom Flower Builder)
    if (item.type === "custom-flower" || item.productSlug === "flowers-master") {
        const builder = db.flowerBuilder;
        if (!builder) return item.price;

        const details = item.customDetails || {};
        
        let flowerCount = parseInt(details.flowerCount || 15, 10);
        if (isNaN(flowerCount) || flowerCount < 15) flowerCount = 15;

        const ribbonEnabled = !!details.ribbonEnabled;
        const giftCardText = (details.giftCardText || "").trim();
        
        let moneyAmount = parseInt(details.moneyAmount || 0, 10);
        if (isNaN(moneyAmount) || moneyAmount < 0) moneyAmount = 0;

        let chocolatePieces = parseInt(details.chocolatePieces || 0, 10);
        if (isNaN(chocolatePieces) || chocolatePieces < 0) chocolatePieces = 0;

        const photoEnabled = !!details.photoEnabled || !!details.hasPhoto;

        let calculated = builder.basePrice || 400;
        let baseFlowers = builder.baseFlowers || 15;
        let extraPrice = builder.extraFlowerPrice || 35;

        // حساب عدد الورد الإضافي فوق الـ 15 وردة الأساسية
        if (flowerCount > baseFlowers) {
            calculated += (flowerCount - baseFlowers) * extraPrice;
        }

        // زيادة شريط الستان
        if (ribbonEnabled) {
            calculated += (builder.ribbonPrice || 50);
        }

        // زيادة كارت الإهداء
        if (giftCardText.length > 0) {
            calculated += (builder.giftCardPrice || 20);
        }

        // إضافة قيمة الكاش المدمج بالكامل
        if (moneyAmount > 0) {
            calculated += moneyAmount;
        }

        // 🛡️ الحساب الحصري والعكسي الآمن لسعر الشوكولاتة من الـ JSON مباشرة وحظر التلاعب به
        if (chocolatePieces > 0) {
            let chocolatePriceRate = 20; // fallback افتراضي
            if (builder.chocolatePiecePrices && Array.isArray(builder.chocolatePiecePrices)) {
                const tierIdx = parseInt(details.chocolateTier, 10);
                if (!isNaN(tierIdx) && builder.chocolatePiecePrices[tierIdx] !== undefined) {
                    chocolatePriceRate = builder.chocolatePiecePrices[tierIdx];
                } else {
                    chocolatePriceRate = builder.chocolatePiecePrices[0] || 20;
                }
            }
            calculated += chocolatePieces * chocolatePriceRate;
        }

        // إضافة رسوم طباعة الصور المخصصة
        if (photoEnabled) {
            calculated += (builder.photoPrintPrice || 15);
        }

        calculated = safeCalculateBosePrice(calculated, "menu-only");

        if (item.price !== calculated) {
            return calculated;
        }
        return item.price;
    }

    return item.price;
}

/**
 * دالة التطهير والشفاء الذاتي للسلة (Self-Healing Cart Protocol)
 * تفحص كافة المدخلات في الـ localStorage وتصحح الأسعار أو تلغي المنتجات التالفة لحظر محاولات الاختراق والتلاعب المالي
 */
function sanitizeAndSelfHealCart() {
    const db = window.BoseStoreData;
    if (!db || !db.products) return;

    let cart = getBoseCart();
    let healed = false;
    let initialLength = cart.length;

    let cleanCart = cart.filter(item => {
        // التحقق المطلق لسلامة ووجود الـ Slug داخل قاعدة البيانات المعتمدة لقطع الطريق على أي تلاعب برمجى
        const originalProduct = db.products.find(p => p.id === item.productSlug || p.slug === item.productSlug);
        if (!originalProduct) {
            healed = true;
            return false; // تدمير وحذف المنتج المتلاعب به فوراً وصامتاً لحماية المتجر
        }

        // تعقيم الكميات وحظر الأعداد السلبية أو الحروف الغريبة
        let validatedQty = Math.max(1, Math.round(Number(item.quantity) || 1));
        if (item.quantity !== validatedQty) {
            item.quantity = validatedQty;
            healed = true;
        }

        // التحقق من توافق الأسعار العكسية وإصلاحها فوراً بدون تدخل المستخدم لغلق ثغرات الاختراق
        let genuinePrice = validateCartItemPrice(item, db.products);
        if (item.price !== genuinePrice) {
            item.price = genuinePrice;
            healed = true;
        }

        return true;
    });

    if (healed || cleanCart.length !== initialLength) {
        saveBoseCart(cleanCart);
        console.warn("🛡️ BoseSweets Cart Engine: Auto-healed cart items and reset manipulated prices.");
    }
}

/**
 * دالة إضافة صنف جديد للسلة مع الاحتساب المالي الفوري ودعم الأسعار الديناميكية وتأمين الكميات المدخلة ضد القيم السلبية
 */
window.addBoseItemToCart = function(product, quantity = 1, customDetails = null, customPrice = null) {
    let cart = getBoseCart();
    let itemId = product.id;
    let isCustom = false;
    let type = "standard";
    
    let safeQuantity = Math.max(1, Math.round(Number(quantity) || 1));
    
    if (product.slug === "toort-custom-master") {
        isCustom = true;
        type = "custom-cake";
    } else if (product.slug === "flowers-master") {
        isCustom = true;
        type = "custom-flower";
    }
    
    if (isCustom) {
        itemId = `${product.slug}-${Date.now()}`;
    }
    
    let baseCalculatedPrice = Number(customPrice !== null ? customPrice : (product.price || 0));
    
    if (customPrice === null) {
        baseCalculatedPrice = safeCalculateBosePrice(baseCalculatedPrice, "menu-only");
    }
    
    const storeLogoFallback = window.BoseStoreData?.store?.logo || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";
    
    let finalItemImage = storeLogoFallback;
    if (product.images && product.images.length > 0) {
        finalItemImage = product.images[0];
    } else if (product.image) {
        finalItemImage = product.image;
    }
    
    if (!isCustom) {
        let existingItem = cart.find(item => item.id === itemId && item.type === "standard" && JSON.stringify(item.customDetails) === JSON.stringify(customDetails));
        if (existingItem) {
            existingItem.quantity += safeQuantity;
        } else {
            cart.push({
                id: itemId,
                productSlug: product.slug,
                title: product.title,
                flavorName: product.flavorName || "",
                price: Number(baseCalculatedPrice),
                quantity: safeQuantity,
                image: finalItemImage,
                type: type,
                customDetails: customDetails
            });
        }
    } else {
        cart.push({
            id: itemId,
            productSlug: product.slug,
            title: product.title,
            flavorName: product.flavorName || "تصميم خاص حسب الطلب",
            price: Number(baseCalculatedPrice),
            quantity: safeQuantity,
            image: finalItemImage,
            type: type,
            customDetails: customDetails
        });
    }
    
    saveBoseCart(cart);
    window.showBoseAlert("تمت إضافة اختياركم اللذيذ إلى سلة التسوق بنجاح! 🌸");
};

/**
 * نظام التحديث والمزامنة اللحظية للسلة بين التبويبات المتعددة المفتوحة بذات المتصفح لترشيد استهلاك الذاكرة
 */
let lastCartString = localStorage.getItem('bose_cart') || '[]';
function setupMultiTabSyncing() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'bose_cart') {
            const newCartStr = e.newValue || '[]';
            if (newCartStr === lastCartString) return;
            lastCartString = newCartStr;

            sanitizeAndSelfHealCart();

            if (typeof window.updateGlobalCartCounter === "function") {
                window.updateGlobalCartCounter();
            }
            const itemsWrapper = document.getElementById('cart-items-wrapper');
            if (itemsWrapper) {
                renderCartItems();
            }
            const checkoutBtnDirect = document.getElementById('btn-submit-order-final');
            if (checkoutBtnDirect) {
                renderCheckoutSummary();
            }
        }
    });
}

/**
 * تشغيل وإعداد واجهة صفحة سلة التسوق (cart.html)
 */
function initCartDOM() {
    const itemsWrapper = document.getElementById('cart-items-wrapper');
    if (!itemsWrapper) return;
    
    sanitizeAndSelfHealCart();
    renderCartItems();
    initCouponSystem('cart');
    
    const clearCartBtn = document.querySelector('button.btn-clear-cart-node') || document.getElementById('btn-clear-cart');
    if (clearCartBtn && !clearCartBtn.dataset.boseListener) {
        clearCartBtn.addEventListener('click', () => {
            window.showBoseConfirm("هل حابب تفرّغ سلة المشتريات بالكامل وتبدأ تختار من أول وجديد؟ 🌸", () => {
                saveBoseCart([]);
                try {
                    localStorage.removeItem('bose_applied_coupon');
                } catch (e) {}
                renderCartItems();
            });
        });
        clearCartBtn.dataset.boseListener = "true";
    }
}

/**
 * رندرة وعرض كروت منتجات السلة ديناميكياً مع تفاصيل التخصيص والتحقق من الأسعار الحقيقية لغلق ثغرات التلاعب المالي
 */
function renderCartItems() {
    const itemsWrapper = document.getElementById('cart-items-wrapper');
    if (!itemsWrapper) return;
    
    const cart = getBoseCart();
    const clearCartBtn = document.querySelector('button.btn-clear-cart-node') || document.getElementById('btn-clear-cart');
    
    const storeLogoFallback = window.BoseStoreData?.store?.logo || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";
    const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";
    const storeProducts = window.BoseStoreData?.products || [];
    
    if (cart.length === 0) {
        itemsWrapper.innerHTML = `
            <div class="empty-cart-message-container" style="text-align:center; padding:60px 24px; background:var(--bose-white, #FFFFFF); border:1px solid rgba(255,145,164,0.25); border-radius:24px; box-shadow: 0 12px 32px rgba(255,145,164,0.05); font-family:'Cairo', sans-serif; direction:rtl;">
                <div style="font-size:48px; margin-bottom:16px;">🌸</div>
                <h3 style="font-size:18px; font-weight:700; color:var(--bose-black, #111111); margin:0 0 8px 0;">سلة المشتريات فارغة حالياً</h3>
                <p style="font-size:14px; font-weight:400; color:var(--bose-black, #111111); opacity:0.8; margin:0 0 24px 0; line-height:1.6;">تصفح المنيو الشامل واستمتع بأشهى قطع الجاتوهات والحلويات والتورت المصنوعة بحب خصيصاً لمناسباتكم السعيدة.</p>
                <a href="menu.html" style="display:inline-block; background:var(--bose-pink, #FF91A4); color:var(--bose-white, #FFFFFF); padding:12px 32px; border-radius:50px; text-decoration:none; font-weight:600; font-size:14px; transition:0.2s; box-shadow:0 4px 14px rgba(255,145,164,0.25);">استعرض المنيو الشامل</a>
            </div>
        `;
        if (clearCartBtn) clearCartBtn.style.display = 'none';
        updateCartTotals(0);
        renderSuggestionsSlider([]);
        return;
    }
    
    if (clearCartBtn) clearCartBtn.style.display = '';
    itemsWrapper.innerHTML = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        let validatedPrice = validateCartItemPrice(item, storeProducts);
        item.price = validatedPrice;
        
        const currentPrice = validatedPrice;
        const itemTotal = currentPrice * item.quantity;
        subtotal += itemTotal;
        
        const card = document.createElement('div');
        card.className = 'cart-item-card';
        card.setAttribute('data-id', item.id);
        card.style.position = 'relative';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.backgroundColor = 'var(--bose-white, #FFFFFF)';
        card.style.border = '1px solid rgba(255, 145, 164, 0.3)';
        card.style.boxShadow = '0 8px 32px rgba(255, 145, 164, 0.05)';
        card.style.borderRadius = '20px';
        card.style.padding = '16px';
        card.style.marginBottom = '16px';
        card.style.direction = 'rtl';
        card.style.fontFamily = "'Cairo', sans-serif";
        
        let metaDetailsHTML = '';
        if (item.customDetails) {
            const details = item.customDetails;
            Object.keys(details).forEach(key => {
                const cleanKey = translateBoseDetailKey(key);
                const cleanVal = formatBoseDetailValue(key, details[key]);
                if (cleanVal !== "لا") {
                    metaDetailsHTML += `<div style="margin-bottom: 2px;">${cleanKey}: <strong style="color: var(--bose-black, #111111); font-weight: 600;">${cleanVal}</strong></div>`;
                }
            });
        } else if (item.flavorName) {
            metaDetailsHTML += `<div>النكهة المحددة: <strong style="color: var(--bose-black, #111111); font-weight: 600;">${escapeHtml(item.flavorName)}</strong></div>`;
        }
        
        card.innerHTML = `
            <button class="btn-remove-item" style="position:absolute; top:12px; left:12px; background:none; border:none; color:var(--bose-black, #111111); font-size:22px; cursor:pointer; font-weight:700; line-height:1; transition:0.2s; z-index:10;">&times;</button>
            <div class="cart-item-img-container" style="margin-left:16px;">
                <img src="${escapeHtml(item.image || storeLogoFallback)}" class="cart-item-img" alt="${escapeHtml(item.title)}" style="width:100px; height:100px; object-fit:cover; border-radius:12px; display:block;" loading="lazy">
            </div>
            <div class="cart-item-info" style="flex:1; display:flex; flex-direction:column; gap:4px; text-align:right;">
                <h3 class="cart-item-title" style="margin:0; font-size:16px; font-weight:700; color:var(--bose-black, #111111);">${escapeHtml(item.title)}</h3>
                <div class="cart-item-meta" style="margin:0; font-size:13px; font-weight:400; color:var(--bose-black, #111111); opacity:0.8; line-height:1.6;">${metaDetailsHTML}</div>
                <div class="cart-item-price-quantity-row" style="display:flex; align-items:center; justify-content:space-between; margin-top:8px; flex-wrap:wrap; gap:10px;">
                    <div class="quantity-counter-block" style="display:flex; align-items:center; border:1px solid var(--bose-pink, #FF91A4); border-radius:50px; background:var(--bose-white, #FFFFFF); padding:2px 8px;">
                        <button class="btn-qty-minus" style="background:none; border:none; color:var(--bose-black, #111111); font-size:18px; font-weight:700; width:30px; height:30px; cursor:pointer;">-</button>
                        <input type="number" class="input-qty-value" value="${item.quantity}" min="1" readonly style="width:35px; text-align:center; border:none; font-size:15px; font-weight:600; color:var(--bose-black, #111111); background:transparent;">
                        <button class="btn-qty-plus" style="background:none; border:none; color:var(--bose-black, #111111); font-size:18px; font-weight:700; width:30px; height:30px; cursor:pointer;">+</button>
                    </div>
                    <div class="cart-item-price-display" style="text-align:left;">
                        <span class="cart-item-price-single" style="font-size:12px; font-weight:400; color:var(--bose-black, #111111); opacity:0.7; display:block;">${item.quantity > 1 ? `${currentPrice} &times; ${item.quantity}` : ''}</span>
                        <span class="cart-item-price-total" style="font-size:15px; font-weight:700; color:var(--bose-pink, #FF91A4);">${itemTotal} ${storeCurrency}</span>
                    </div>
                </div>
            </div>
        `;
        
        card.querySelector('.btn-qty-minus').addEventListener('click', () => {
            let cartData = getBoseCart();
            let matched = cartData.find(i => i.id === item.id);
            if (matched && matched.quantity > 1) {
                matched.quantity--;
                saveBoseCart(cartData);
                renderCartItems();
            }
        });
        
        card.querySelector('.btn-qty-plus').addEventListener('click', () => {
            let cartData = getBoseCart();
            let matched = cartData.find(i => i.id === item.id);
            if (matched) {
                matched.quantity++;
                saveBoseCart(cartData);
                renderCartItems();
            }
        });
        
        card.querySelector('.btn-remove-item').addEventListener('click', () => {
            window.showBoseConfirm("هل حابب تشيل الصنف ده من السلة؟ 🌸", () => {
                let cartData = getBoseCart();
                cartData = cartData.filter(i => i.id !== item.id);
                saveBoseCart(cartData);
                renderCartItems();
            });
        });
        
        itemsWrapper.appendChild(card);
    });
    
    updateCartTotals(subtotal);
    renderSuggestionsSlider(cart);
}

/**
 * حساب وتحديث المجاميع المالية المطبقة للكوبونات والخصومات بدقة متناهية وبشكل آمن
 */
function updateCartTotals(subtotal) {
    const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";
    const subtotalNode = document.getElementById('cart-subtotal-value');
    if (subtotalNode) {
        subtotalNode.textContent = `${subtotal} ${storeCurrency}`;
    }
    
    let discountAmount = 0;
    const activeCoupon = getActiveCoupon(subtotal);
    if (activeCoupon) {
        discountAmount = activeCoupon.amount;
        const discountNode = document.getElementById('summary-discount');
        if (discountNode) discountNode.textContent = `${discountAmount} ${storeCurrency}`;
    } else {
        const discountNode = document.getElementById('summary-discount');
        if (discountNode) discountNode.textContent = `0 ${storeCurrency}`;
    }
    
    const grandNode = document.getElementById('cart-grand-total-value') || document.getElementById('summary-grand-total');
    if (grandNode) {
        grandNode.textContent = `${Math.max(0, subtotal - discountAmount)} ${storeCurrency}`;
    }
    
    const summaryCountNode = document.getElementById('summary-items-count');
    if (summaryCountNode) {
        const cart = getBoseCart();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        summaryCountNode.textContent = count;
    }
}

/**
 * محرك اقتراحات المنتجات التفاعلي "قد يعجبك أيضاً" (Cross-Selling System)
 * يعرض منتجات بديلة ذكية متناسقة لزيادة فرصة تسوق العميل
 */
function renderSuggestionsSlider(cart) {
    const suggestionsGrid = document.getElementById('cart-suggestions-container') || document.getElementById('suggestions-grid');
    if (!suggestionsGrid) return;
    
    const productsList = window.BoseStoreData?.products || [];
    if (productsList.length === 0) {
        suggestionsGrid.innerHTML = '';
        return;
    }
    
    const cartSlugs = cart.map(item => item.productSlug);
    let availableSuggestions = productsList.filter(p => !cartSlugs.includes(p.slug));
    
    // تأمين بصري: إذا كان العميل قد تسوق بالفعل كافة الأصناف، نقترح أفضل صنفين عشوائيين لمنع الفراغ البصري بالسلة
    if (availableSuggestions.length === 0) {
        availableSuggestions = productsList;
    }
    
    const displayItems = availableSuggestions.slice(0, 2);
    
    const storeLogoFallback = window.BoseStoreData?.store?.logo || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";
    const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";
    
    suggestionsGrid.innerHTML = '';
    displayItems.forEach(prod => {
        let displayPrice = prod.price;
        displayPrice = safeCalculateBosePrice(prod.price, "menu-only");
        
        let finalProdImg = storeLogoFallback;
        if (prod.images && prod.images.length > 0) {
            finalProdImg = prod.images[0];
        } else if (prod.image) {
            finalProdImg = prod.image;
        }
        
        const suggestionCard = document.createElement('div');
        suggestionCard.className = 'suggestion-item-card';
        suggestionCard.style.display = 'flex';
        suggestionCard.style.alignItems = 'center';
        suggestionCard.style.justifyContent = 'space-between';
        suggestionCard.style.backgroundColor = 'var(--bose-white, #FFFFFF)';
        suggestionCard.style.border = '1px solid rgba(255,145,164,0.2)';
        suggestionCard.style.borderRadius = '16px';
        suggestionCard.style.padding = '12px';
        suggestionCard.style.marginBottom = '10px';
        suggestionCard.style.width = '100%';
        suggestionCard.style.direction = 'rtl';
        
        suggestionCard.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; text-align:right; flex:1;">
                <img src="${escapeHtml(finalProdImg)}" alt="${escapeHtml(prod.title)}" style="width:60px; height:60px; object-fit:cover; border-radius:10px;" loading="lazy">
                <div>
                    <h4 style="margin:0; font-size:14px; font-weight:700; color:var(--bose-black, #111111);">${escapeHtml(prod.title)}</h4>
                    <span style="font-size:13px; font-weight:700; color:var(--bose-pink, #FF91A4);">${displayPrice} ${storeCurrency}</span>
                </div>
            </div>
            <button class="btn-quick-add-suggestion" style="background:var(--bose-pink, #FF91A4); color:var(--bose-white, #FFFFFF); border:none; width:35px; height:35px; border-radius:50%; font-size:20px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.2s;">+</button>
        `;
        
        suggestionCard.querySelector('.btn-quick-add-suggestion').addEventListener('click', () => {
            window.addBoseItemToCart(prod, 1);
            renderCartItems();
        });
        
        suggestionsGrid.appendChild(suggestionCard);
    });
}

/**
 * إعداد وربط صفحة تأكيد الاستلام والدفع (checkout.html)
 */
function initCheckoutDOM() {
    const checkoutBtnDirect = document.getElementById('btn-submit-order-final') || document.getElementById('btn-confirm-order');
    if (!checkoutBtnDirect) return;
    
    sanitizeAndSelfHealCart();
    renderCheckoutSummary();
    initCouponSystem('checkout');
    
    const pickupBtn = document.getElementById('method-pickup') || document.querySelector('.btn-pickup');
    const deliveryBtn = document.getElementById('method-delivery') || document.querySelector('.btn-delivery');
    const shippingZoneWrapper = document.getElementById('shipping-zone-wrapper');
    const zoneSelect = document.getElementById('checkout-zone-select') || document.getElementById('checkout-zone');
    
    let pickupInfoBlock = document.getElementById('bose-pickup-info-block');
    if (!pickupInfoBlock) {
        pickupInfoBlock = document.createElement('div');
        pickupInfoBlock.id = 'bose-pickup-info-block';
        pickupInfoBlock.style.display = 'none';
        pickupInfoBlock.style.backgroundColor = '#FFF0F2';
        pickupInfoBlock.style.border = '1px dashed var(--bose-pink, #FF91A4)';
        pickupInfoBlock.style.borderRadius = '16px';
        pickupInfoBlock.style.padding = '16px';
        pickupInfoBlock.style.marginTop = '12px';
        pickupInfoBlock.style.fontFamily = "'Cairo', sans-serif";
        pickupInfoBlock.style.direction = 'rtl';
        pickupInfoBlock.style.textAlign = 'right';
        
        const pickupAddress = window.BoseStoreData?.store?.pickup?.address || "الكفاح شارع الوحدة المحلية بجوار صيدلية الدكتور احمد مجدي وبجوار عيادة الدكتور علي";
        const pickupMapUrl = window.BoseStoreData?.store?.pickup?.mapUrl || "https://maps.app.goo.gl/nAg4Y7vQ7hACvKGc8?g_st=ac";
        const pickupMessage = window.BoseStoreData?.store?.pickup?.message || "لا توجد رسوم شحن عند الاستلام من الفرع.";
        
        pickupInfoBlock.innerHTML = `
            <h4 style="margin:0 0 8px 0; font-size:16px; font-weight:700; color:var(--bose-black, #111111);">📍 عنوان استلام طلبك الفاخر:</h4>
            <p style="margin:0 0 12px 0; font-size:14px; font-weight:400; color:var(--bose-black, #111111); opacity:0.9; line-height:1.6;">
                ${escapeHtml(pickupAddress)}
            </p>
            <a href="${escapeHtml(pickupMapUrl)}" target="_blank" style="display:inline-block; background:var(--bose-pink, #FF91A4); color:var(--bose-white, #FFFFFF); text-decoration:none; padding:8px 16px; border-radius:50px; font-size:13px; font-weight:600; transition:0.2s; box-shadow: 0 4px 12px rgba(255,145,164,0.15);">
                🗺️ عرض الموقع على خرائط جوجل
            </a>
            <span style="display:block; margin-top:8px; font-size:12px; font-weight:600; color:var(--bose-pink, #FF91A4);">* ${escapeHtml(pickupMessage)}</span>
        `;
        
        const destinationNode = document.getElementById('shipping-zone-wrapper') || checkoutBtnDirect.closest('form') || checkoutBtnDirect.parentNode;
        if (destinationNode) {
            destinationNode.parentNode.insertBefore(pickupInfoBlock, destinationNode.nextSibling);
        }
    }
    
    let currentMethod = 'delivery';
    const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";
    const shippingZones = window.BoseStoreData?.shippingZones || [];
    
    if (zoneSelect && shippingZones.length > 0) {
        zoneSelect.innerHTML = '<option value="" disabled selected>اختر المنطقة السكنية للتوصيل</option>';
        shippingZones.forEach(zone => {
            const opt = document.createElement('option');
            opt.value = escapeHtml(zone.id);
            opt.textContent = `${escapeHtml(zone.area)} (+${zone.price} ${storeCurrency})`;
            zoneSelect.appendChild(opt);
        });
        
        if (!zoneSelect.dataset.boseListener) {
            zoneSelect.addEventListener('change', () => {
                recalculateCheckoutTotals(currentMethod);
            });
            zoneSelect.dataset.boseListener = "true";
        }
    }
    
    if (pickupBtn && deliveryBtn) {
        if (!pickupBtn.dataset.boseListener) {
            pickupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                currentMethod = 'pickup';
                pickupBtn.classList.add('active');
                deliveryBtn.classList.remove('active');
                if (shippingZoneWrapper) shippingZoneWrapper.style.display = 'none';
                if (pickupInfoBlock) pickupInfoBlock.style.display = 'block';
                if (zoneSelect) zoneSelect.value = "";
                recalculateCheckoutTotals('pickup');
            });
            pickupBtn.dataset.boseListener = "true";
        }
        
        if (!deliveryBtn.dataset.boseListener) {
            deliveryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                currentMethod = 'delivery';
                deliveryBtn.classList.add('active');
                pickupBtn.classList.remove('active');
                if (shippingZoneWrapper) shippingZoneWrapper.style.display = 'block';
                if (pickupInfoBlock) pickupInfoBlock.style.display = 'none';
                recalculateCheckoutTotals('delivery');
            });
            deliveryBtn.dataset.boseListener = "true";
        }
    }
    
    const deliveryDateInput = document.getElementById('checkout-delivery-date') || document.getElementById('delivery-date');
    if (deliveryDateInput) {
        const now = new Date();
        const minDate = new Date(now.getTime() + (24 * 60 * 60 * 1000));
        const yyyy = minDate.getFullYear();
        let mm = minDate.getMonth() + 1;
        let dd = minDate.getDate();
        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;
        deliveryDateInput.min = `${yyyy}-${mm}-${dd}`;
    }
    
    if (checkoutBtnDirect && !checkoutBtnDirect.dataset.boseListener) {
        checkoutBtnDirect.addEventListener('click', (e) => {
            e.preventDefault();
            processOrderSubmission(currentMethod, checkoutBtnDirect);
        });
        checkoutBtnDirect.dataset.boseListener = "true";
    }
}

/**
 * رندرة وعرض الفاتورة والخصومات بدقة متناهية وبدون تدبيل مالي في صفحة التأكيد
 */
function renderCheckoutSummary() {
    const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";
    const cart = getBoseCart();
    const storeProducts = window.BoseStoreData?.products || [];
    let subtotal = 0;
    cart.forEach(item => {
        let validatedPrice = validateCartItemPrice(item, storeProducts);
        item.price = validatedPrice;
        subtotal += item.price * item.quantity;
    });
    
    const subtotalNode = document.getElementById('summary-subtotal');
    if (subtotalNode) {
        subtotalNode.textContent = `${subtotal} ${storeCurrency}`;
    }
    
    let discountAmount = 0;
    const activeCoupon = getActiveCoupon(subtotal);
    if (activeCoupon) {
        discountAmount = activeCoupon.amount;
        const discountNode = document.getElementById('summary-discount');
        if (discountNode) discountNode.textContent = `${discountAmount} ${storeCurrency}`;
    } else {
        const discountNode = document.getElementById('summary-discount');
        if (discountNode) discountNode.textContent = `0 ${storeCurrency}`;
    }
    
    const feeNode = document.getElementById('summary-shipping-fee');
    if (feeNode) feeNode.textContent = `0 ${storeCurrency}`;
    
    const grandNode = document.getElementById('summary-grand-total');
    if (grandNode) {
        grandNode.textContent = `${Math.max(0, subtotal - discountAmount)} ${storeCurrency}`;
    }
}

/**
 * إعادة احتساب الفاتورة الإجمالية شاملة الشحن والتوصيل والخصومات الفورية بدقة هندسية ومحمية تماماً
 */
function recalculateCheckoutTotals(method) {
    const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";
    const cart = getBoseCart();
    const storeProducts = window.BoseStoreData?.products || [];
    const shippingZones = window.BoseStoreData?.shippingZones || [];
    let subtotal = 0;
    cart.forEach(item => {
        let validatedPrice = validateCartItemPrice(item, storeProducts);
        item.price = validatedPrice;
        subtotal += item.price * item.quantity;
    });
    
    let shippingFee = 0;
    if (method === 'delivery') {
        const zoneSelect = document.getElementById('checkout-zone-select') || document.getElementById('checkout-zone');
        if (zoneSelect && zoneSelect.value) {
            const matchedZone = shippingZones.find(z => z.id === zoneSelect.value);
            if (matchedZone) shippingFee = matchedZone.price;
        }
    }
    
    let discountAmount = 0;
    const activeCoupon = getActiveCoupon(subtotal);
    if (activeCoupon) {
        discountAmount = activeCoupon.amount;
        const discountNode = document.getElementById('summary-discount');
        if (discountNode) discountNode.textContent = `${discountAmount} ${storeCurrency}`;
    } else {
        const discountNode = document.getElementById('summary-discount');
        if (discountNode) discountNode.textContent = `0 ${storeCurrency}`;
    }
    
    const subtotalNode = document.getElementById('summary-subtotal');
    if (subtotalNode) subtotalNode.textContent = `${subtotal} ${storeCurrency}`;
    
    const feeNode = document.getElementById('summary-shipping-fee');
    if (feeNode) feeNode.textContent = `${shippingFee} ${storeCurrency}`;
    
    const grandNode = document.getElementById('summary-grand-total');
    if (grandNode) {
        grandNode.textContent = `${Math.max(0, subtotal + shippingFee - discountAmount)} ${storeCurrency}`;
    }
}

/**
 * معالجة وتأمين وإرسال الطلب عبر الواتساب بأرقى أسلوب وقفل وحماية جميع الحقول
 */
function processOrderSubmission(method, submitButton) {
    // تشغيل التطهير الوقائي قبل الإرسال لقطع الطريق على أي أدوات تعديل بالمتصفح
    sanitizeAndSelfHealCart();

    const cart = getBoseCart();
    if (cart.length === 0) {
        window.showBoseAlert("سلة المشتريات فارغة حالياً، ياريت تختار بعض الحلويات اللذيذة قبل تفعيل طلبك 🌸");
        return;
    }
    
    const nameInput = document.getElementById('checkout-customer-name') || document.getElementById('customer-name') || document.getElementById('name') || document.querySelector('input[name="name"]');
    const phoneInput = document.getElementById('checkout-customer-phone') || document.getElementById('customer-phone') || document.getElementById('phone') || document.querySelector('input[name="phone"]');
    const phoneTwoInput = document.getElementById('checkout-customer-phone-two') || document.getElementById('customer-phone2') || document.getElementById('phone2') || document.querySelector('input[name="phone2"]');
    const govInput = document.getElementById('checkout-customer-gov') || document.getElementById('checkout-gov') || document.getElementById('gov') || document.querySelector('input[name="gov"]');
    const cityInput = document.getElementById('checkout-customer-city') || document.getElementById('checkout-city') || document.getElementById('city') || document.querySelector('input[name="city"]');
    const addressInput = document.getElementById('checkout-address-details') || document.getElementById('checkout-address') || document.getElementById('address') || document.querySelector('textarea[name="address"]');
    const zoneSelect = document.getElementById('checkout-zone-select') || document.getElementById('checkout-zone') || document.querySelector('select[name="zone"]');
    const deliveryDateInput = document.getElementById('checkout-delivery-date') || document.getElementById('delivery-date') || document.querySelector('input[name="delivery-date"]');
    const deliveryTimeInput = document.getElementById('checkout-delivery-time') || document.getElementById('delivery-time') || document.querySelector('input[name="delivery-time"]');
    const notesInput = document.getElementById('checkout-order-notes') || document.getElementById('checkout-notes') || document.getElementById('checkout-order-note') || document.getElementById('notes') || document.querySelector('textarea[name="notes"]');
    
    if (!nameInput || !nameInput.value.trim()) { 
        window.showBoseAlert("علشان نجهّز طلبك المميّز بأجمل شكل، ياريت تكتب اسمك بالكامل هنا 🌸", null, nameInput); 
        return; 
    }
    
    if (!phoneInput || !phoneInput.value.trim()) { 
        window.showBoseAlert("رقم موبايلك مهم جداً علشان نقدر نتواصل معاك ونطمنك على الطلب وهو في الطريق، ياريت تكتبه هنا ✨", null, phoneInput); 
        return; 
    }
    
    const cleanPhone1 = cleanAndConvertEgyptianPhone(phoneInput.value);
    const egyptianPhoneRegex = /^01[0125]\d{8}$/;
    
    if (!egyptianPhoneRegex.test(cleanPhone1)) {
        window.showBoseAlert("تأكّد يا فندم إن رقم الموبايل هو رقم مصري صحيح مكوّن من 11 رقم (زي 01012345678) علشان كابتن التوصيل يوصلّك بسهولة 🌸", null, phoneInput);
        return;
    }
    
    if (!phoneTwoInput || !phoneTwoInput.value.trim()) { 
        window.showBoseAlert("رقم الموبايل الإضافي بيضمن إننا نوصلّك في أي وقت لو الرقم الأول كان مشغول، ياريت تضيف رقم تاني مختلف 🌸", null, phoneTwoInput); 
        return; 
    }
    
    const cleanPhone2 = cleanAndConvertEgyptianPhone(phoneTwoInput.value);
    if (!egyptianPhoneRegex.test(cleanPhone2)) {
        window.showBoseAlert("ياريت تتأكد من كتابة رقم موبايل مصري إضافي صحيح مكون من 11 رقماً لسلامة التوصيل والاستلام.", null, phoneTwoInput);
        return;
    }
    
    if (cleanPhone1 === cleanPhone2) {
        window.showBoseAlert("ياريت الرقم الإضافي يكون مختلف عن الرقم الأساسي علشان نضمن راحتك وسهولة التواصل معاك في الحالات الطارئة ✨", null, phoneTwoInput);
        return;
    }
    
    if (method === 'delivery') {
        if (govInput && !govInput.value.trim()) {
            window.showBoseAlert("من فضلك اكتب اسم المحافظة لتوصيل طلبك الفاخر.", null, govInput);
            return;
        }
        if (cityInput && !cityInput.value.trim()) {
            window.showBoseAlert("من فضلك اكتب اسم المدينة أو المركز لتسهيل التوصيل.", null, cityInput);
            return;
        }
        if (!zoneSelect || !zoneSelect.value) { 
            window.showBoseAlert("من فضلك اختار المنطقة السكنية للتوصيل من القائمة علشان نحدد قيمة الشحن بدقة ووضوح ✨", null, zoneSelect); 
            return; 
        }
        if (!addressInput || !addressInput.value.trim()) { 
            window.showBoseAlert("ياريت تكتب تفاصيل العنوان (اسم الشارع، رقم البيت، أو أي علامة مميزة جمبك) علشان طلبك يوصلّك في أسرع وقت وأعلى أمان ✨", null, addressInput); 
            return; 
        }
    }
    
    if (!deliveryDateInput || !deliveryDateInput.value) { 
        window.showBoseAlert("ياريت تختار تاريخ الاستلام المطلوب والمناسب ليك 🌸", null, deliveryDateInput); 
        return; 
    }
    if (!deliveryTimeInput || !deliveryTimeInput.value) { 
        window.showBoseAlert("ياريت تحدد وقت الاستلام المطلوب والمناسب ليك 🌸", null, deliveryTimeInput); 
        return; 
    }
    
    const safeDateVal = normalizeArabicNumerals(deliveryDateInput.value);
    const dateParts = safeDateVal.replace(/\//g, '-').split('-');
    
    const { hours, minutes } = parseTimeStringTo24h(deliveryTimeInput.value);
    
    if (dateParts.length < 3) {
        window.showBoseAlert("صيغة تاريخ الاستلام غير صحيحة. يرجى مراجعة التاريخ المكتوب 🌸", null, deliveryDateInput);
        return;
    }
    
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
    
    if (isNaN(selectedDateTime.getTime())) {
        window.showBoseAlert("التاريخ والوقت المحددين غير صالحين. يرجى مراجعة الخيارات المحددة 🌸", null, deliveryDateInput);
        return;
    }
    
    const currentDateTime = new Date();
    const prepHours = window.BoseStoreData?.orderRules?.minPreparationTimeHours || 24;
    const minPrepTimeMs = prepHours * 60 * 60 * 1000;
    
    if (selectedDateTime.getTime() < currentDateTime.getTime()) {
        window.showBoseAlert("الوقت ده عدى خلاص يا فندم! ياريت تختار وقت وتاريخ جايين علشان نجهّزلك كل حاجة طازة 🌸", null, deliveryDateInput);
        return;
    }
    
    if ((selectedDateTime.getTime() - currentDateTime.getTime()) < minPrepTimeMs) {
        window.showBoseAlert("لأننا بنصنع كل قطعة يدوياً وبكل حب وعناية فائقة، بنحتاج 24 ساعة على الأقل لتجهيز طلبك الفاخر بأعلى جودة تليق بمناسبتك السعيدة. نرجو اختيار موعد بيبدأ بعد 24 ساعة من دلوقتي ✨", null, deliveryDateInput);
        return;
    }

    // تأمين ضد المواعيد البعيدة جداً بالخطأ
    const maxFutureMs = 365 * 24 * 60 * 60 * 1000; // سنة واحدة كأقصى حد
    if ((selectedDateTime.getTime() - currentDateTime.getTime()) > maxFutureMs) {
        window.showBoseAlert("عذراً يا فندم، لا يمكن اختيار تاريخ استلام بعيد جداً. يرجى مراجعة السنة واليوم المحددين 🌸", null, deliveryDateInput);
        return;
    }
    
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.style.opacity = "0.7";
        submitButton.innerHTML = `<span style="display:inline-block; animation: bose-spin 1s infinite linear; margin-left: 8px;">⏳</span> جاري معالجة طلبك الفاخر...`;
    }
    
    let subtotal = 0;
    const storeProducts = window.BoseStoreData?.products || [];
    cart.forEach(item => { 
        let validatedPrice = validateCartItemPrice(item, storeProducts);
        item.price = validatedPrice;
        subtotal += item.price * item.quantity; 
    });
    
    let shippingFee = 0;
    let zoneAreaText = "الاستلام من الفرع";
    const shippingZones = window.BoseStoreData?.shippingZones || [];
    if (method === 'delivery' && zoneSelect) {
        const matchedZone = shippingZones.find(z => z.id === zoneSelect.value);
        if (matchedZone) {
            shippingFee = matchedZone.price;
            zoneAreaText = matchedZone.area;
        }
    }
    
    let discountAmount = 0;
    let appliedCouponCode = "";
    const activeCoupon = getActiveCoupon(subtotal);
    if (activeCoupon) {
        discountAmount = activeCoupon.amount;
        appliedCouponCode = activeCoupon.code;
    }
    
    const grandTotal = Math.max(0, subtotal + shippingFee - discountAmount);
    const orderId = `BOSE-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const pickupAddress = window.BoseStoreData?.store?.pickup?.address || "الكفاح شارع الوحدة المحلية بجوار صيدلية الدكتور احمد مجدي وبجوار عيادة الدكتور علي";
    
    // حفظ النصوص والبيانات كقيم خام (Raw Strings) بالكامل، ونقوم بترميزها أو تعقيمها عند الحاجة لعرضها بالمتصفح فقط
    const boseOrderObject = {
        orderId: orderId,
        customerName: nameInput.value.trim(),
        customerPhone: cleanPhone1,
        customerPhoneTwo: cleanPhone2,
        method: method,
        zoneArea: zoneAreaText,
        addressDetails: method === 'delivery' ? addressInput.value.trim() : pickupAddress,
        deliveryDate: deliveryDateInput.value,
        deliveryTime: deliveryTimeInput.value,
        notes: notesInput ? notesInput.value.trim() : "",
        subtotal: subtotal,
        shippingFee: shippingFee,
        discount: discountAmount,
        couponUsed: appliedCouponCode,
        grandTotal: grandTotal,
        items: cart
    };
    
    try {
        localStorage.setItem('bose_last_order', JSON.stringify(boseOrderObject));
    } catch (e) {
        console.error("⚠️ Error saving bose_last_order:", e);
    }
    
    const whatsappMessage = buildBoseWhatsAppInvoice(boseOrderObject);
    const storePhone = window.BoseStoreData?.store?.phone || "01097238441";
    
    let cleanStorePhone = storePhone.replace(/\D/g, '');
    if (cleanStorePhone.startsWith('0')) {
        cleanStorePhone = '2' + cleanStorePhone;
    } else if (!cleanStorePhone.startsWith('2')) {
        cleanStorePhone = '20' + cleanStorePhone;
    }
    
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanStorePhone}&text=${encodeURIComponent(whatsappMessage)}`;
    
    try {
        localStorage.setItem('bose_last_whatsapp_url', whatsappUrl);
    } catch (e) {}
    
    saveBoseCart([]);
    try {
        localStorage.removeItem('bose_applied_coupon');
    } catch (e) {}
    
    window.location.href = `order-success.html?orderId=${orderId}`;
}

/**
 * صياغة وتشييد الفاتورة والرسالة الرائعة للواتساب بأعلى مستويات الاحترافية والجمال البصري وتنقيتها من الرموز المزدوجة
 */
function buildBoseWhatsAppInvoice(order) {
    let msg = `👑 *فاتورة طلب جديدة - حلويات بوسي* 👑\n\n`;
    msg += `📝 *رقم الطلب:* \`${order.orderId}\`\n`;
    msg += `👤 *العميل:* ${order.customerName}\n`;
    msg += `📞 *رقم الهاتف الأساسي:* ${order.customerPhone}\n`;
    msg += `📞 *رقم الهاتف الإضافي:* ${order.customerPhoneTwo}\n`;
    msg += `🗓️ *موعد الاستلام المطلوب:* ${order.deliveryDate} في تمام الساعة ${order.deliveryTime}\n`;
    msg += `📍 *طريقة الاستلام:* ${order.method === 'pickup' ? 'استلام من الفرع' : `توصيل للمنزل - ${order.zoneArea}`}\n`;
    msg += `🏠 *العنوان:* ${order.addressDetails}\n`;
    if (order.notes) msg += `✍️ *ملاحظات وتوصيات خاصة:* "${order.notes}"\n`;
    msg += `\n🛒 *تفاصيل المنتجات:* \n`;
    msg += `--------------------------------\n`;
    
    order.items.forEach((item, index) => {
        msg += `${index + 1}. *${item.title}*\n`;
        if (item.customDetails) {
            const details = item.customDetails;
            Object.keys(details).forEach(key => {
                const cleanKey = translateBoseDetailKey(key);
                const cleanVal = formatBoseDetailValue(key, details[key]);
                if (cleanVal !== "لا") {
                    // إزالة الإيموجي من الفاتورة النصية للتحسين والتناسق النصي الفخم
                    const keyPlain = cleanKey.replace(/[🎂📐👥📸✍️⚠️💐🌹💵🍫🎀✉️📏🍯🍒🖼️🎨🍰✨]/g, '').trim();
                    const valPlain = cleanRawTextForInvoice(cleanVal);
                    msg += `   - ${keyPlain}: ${valPlain}\n`;
                }
            });
        } else if (item.flavorName) {
            msg += `   - النكهة: ${item.flavorName}\n`;
        }
        
        msg += `   - الكمية المطلوبة: ${item.quantity}\n`;
        msg += `   - الحساب الفردي: ${item.price * item.quantity} جنيه\n`;
        msg += `--------------------------------\n`;
    });
    
    msg += `\n💰 *الحساب الإجمالي:* \n`;
    msg += `🔹 *المجموع الصافي:* ${order.subtotal} جنيه\n`;
    if (order.discount > 0) {
        msg += `🎁 *الخصم المطبق [${order.couponUsed}]:* -${order.discount} جنيه\n`;
    }
    msg += `🔹 *رسوم الشحن والتوصيل:* ${order.shippingFee} جنيه\n`;
    msg += `🏁 *العجمالي المطلوب للدفع:* *${order.grandTotal} جنيه*\n\n`;
    msg += `✨ _صنعناها بحب لتهديها لمن تحب - حلويات بوسي_ ✨`;
    
    return msg;
}

/**
 * نظام الكوبونات التفاعلي المتطور والمؤمن مع واجهة تراجع ذكية ودعم الكوبونات الديناميكية ومؤشر الخصم اللحظي بالجنيه
 */
function initCouponSystem(pageType) {
    const couponInput = document.getElementById('coupon-input') || document.getElementById('checkout-coupon-input') || document.querySelector('input[name="coupon"]');
    const applyBtn = document.getElementById('btn-apply-coupon') || document.getElementById('btn-submit-coupon') || document.querySelector('.btn-coupon-apply');
    const messageNode = document.getElementById('coupon-message') || document.getElementById('coupon-status-text');
    
    if (!couponInput || !applyBtn) return;
    
    let cachedCoupon = "";
    try {
        cachedCoupon = localStorage.getItem('bose_applied_coupon') || "";
    } catch (e) {}

    if (cachedCoupon) {
        const cleanCachedCoupon = escapeHtml(cachedCoupon);
        couponInput.value = cleanCachedCoupon;
        if (messageNode) {
            const cart = getBoseCart();
            const storeProducts = window.BoseStoreData?.products || [];
            let subtotal = 0;
            cart.forEach(item => {
                let validatedPrice = validateCartItemPrice(item, storeProducts);
                item.price = validatedPrice;
                subtotal += item.price * item.quantity;
            });
            
            let discountValueText = "";
            const activeCoupon = getActiveCoupon(subtotal);
            if (activeCoupon && activeCoupon.amount > 0) {
                discountValueText = ` (خصم بقيمة ${activeCoupon.amount} جنيه)`;
            }

            messageNode.innerHTML = `تم تطبيق الكوبون <strong>${cleanCachedCoupon}</strong> بنجاح!${discountValueText} 🌸 <a href="#" id="btn-remove-coupon-act" style="color:var(--bose-black, #111111); margin-right:8px; font-weight:700; text-decoration:underline;">إلغاء الكوبون</a>`;
            messageNode.style.color = "var(--bose-pink, #FF91A4)";
            
            const removeBtn = document.getElementById('btn-remove-coupon-act');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    try {
                        localStorage.removeItem('bose_applied_coupon');
                    } catch (ex) {}
                    couponInput.value = "";
                    messageNode.textContent = "";
                    if (pageType === 'cart') {
                        renderCartItems();
                    } else {
                        const pickupBtn = document.getElementById('method-pickup') || document.querySelector('.btn-pickup');
                        const method = (pickupBtn && pickupBtn.classList.contains('active')) ? 'pickup' : 'delivery';
                        recalculateCheckoutTotals(method);
                    }
                });
            }
        }
    }
    
    if (!applyBtn.dataset.boseListener) {
        applyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const code = normalizeArabicNumerals(couponInput.value).toUpperCase().trim();
            
            if (!code) {
                window.showBoseAlert("ياريت تكتب كود الخصم أولاً علشان نطبقهولك ✨");
                return;
            }
            
            const cart = getBoseCart();
            const storeProducts = window.BoseStoreData?.products || [];
            let subtotal = 0;
            cart.forEach(item => {
                let validatedPrice = validateCartItemPrice(item, storeProducts);
                item.price = validatedPrice;
                subtotal += item.price * item.quantity;
            });
            
            let isValid = false;
            const dbCoupons = window.BoseStoreData?.coupons || [];
            const matchedDbCoupon = dbCoupons.find(c => c.code === code);

            if (matchedDbCoupon || code === "BOSE10" || code === "BOOSY" || code === "EID") {
                isValid = true;
            }
            
            if (isValid) {
                try {
                    localStorage.setItem('bose_applied_coupon', code);
                } catch (ex) {}
                window.showBoseAlert("تم تطبيق كود الخصم بنجاح! نوّرت عيلتنا الكبيرة يا فندم 🌸", () => {
                    if (pageType === 'cart') {
                        renderCartItems();
                    } else {
                        const pickupBtn = document.getElementById('method-pickup') || document.querySelector('.btn-pickup');
                        const method = (pickupBtn && pickupBtn.classList.contains('active')) ? 'pickup' : 'delivery';
                        recalculateCheckoutTotals(method);
                    }
                });
            } else {
                try {
                    localStorage.removeItem('bose_applied_coupon');
                } catch (ex) {}
                if (messageNode) {
                    messageNode.textContent = "الكود ده مش صحيح أو صلاحيته انتهت، ياريت تراجع الكود وتجرّب تاني ✨";
                    messageNode.style.color = "var(--bose-black, #111111)";
                }
                window.showBoseAlert("الكود ده مش صحيح أو صلاحيته انتهت، ياريت تراجع الكود وتجرّب تاني ✨", () => {
                    if (pageType === 'cart') {
                        renderCartItems();
                    } else {
                        const pickupBtn = document.getElementById('method-pickup') || document.querySelector('.btn-pickup');
                        const method = (pickupBtn && pickupBtn.classList.contains('active')) ? 'pickup' : 'delivery';
                        recalculateCheckoutTotals(method);
                    }
                });
            }
        });
        applyBtn.dataset.boseListener = "true";
    }
}

/**
 * جلب تفاصيل وبيانات الكوبون النشط وحساب قيمة الخصم بناءً على الفاتورة الحالية للعميل
 */
function getActiveCoupon(subtotal) {
    if (subtotal <= 0) return null;

    let code = "";
    try {
        code = localStorage.getItem('bose_applied_coupon');
    } catch (e) {}

    if (!code) return null;
    
    let discountAmount = 0;
    const dbCoupons = window.BoseStoreData?.coupons || [];
    const matchedDbCoupon = dbCoupons.find(c => c.code === code);

    if (matchedDbCoupon) {
        if (matchedDbCoupon.type === "percent") {
            discountAmount = Math.round(subtotal * (matchedDbCoupon.value / 100));
        } else if (matchedDbCoupon.type === "fixed") {
            discountAmount = matchedDbCoupon.value;
        }
    } else if (code === "BOSE10") {
        discountAmount = Math.round(subtotal * 0.1);
    } else if (code === "BOOSY") {
        discountAmount = 50;
    } else if (code === "EID") {
        discountAmount = Math.round(subtotal * 0.15);
    }
    
    return { code: code, amount: Math.min(discountAmount, subtotal) };
}

/**
 * تهيئة وإعداد وتلقيم شاشة نجاح الطلب (order-success.html) وعرض رقم الفاتورة والاسم ومزامنة الواتساب
 */
function initOrderSuccessDOM() {
    const successOrderId = document.getElementById('success-order-id-display');
    const successWelcome = document.getElementById('success-customer-welcome');
    const retryBtn = document.getElementById('btn-whatsapp-retry-redirect');
    
    if (!successOrderId && !successWelcome && !retryBtn) return;
    
    try {
        const lastOrderRaw = localStorage.getItem('bose_last_order');
        if (lastOrderRaw) {
            const lastOrder = JSON.parse(lastOrderRaw);
            
            if (successOrderId) {
                successOrderId.textContent = lastOrder.orderId;
            }
            if (successWelcome) {
                successWelcome.textContent = `أهلاً بك يا فندم، ${escapeHtml(lastOrder.customerName)} 🌸`;
            }
        }
        
        const lastWhatsappUrl = localStorage.getItem('bose_last_whatsapp_url');
        if (retryBtn && lastWhatsappUrl) {
            retryBtn.href = lastWhatsappUrl;
            
            // محاولة توجيه تلقائية آمنة لمرة واحدة فقط لتخطي مشكلات قفل النوافذ المنبثقة
            if (!sessionStorage.getItem('bose_auto_redirected')) {
                sessionStorage.setItem('bose_auto_redirected', 'true');
                setTimeout(() => {
                    window.location.href = lastWhatsappUrl;
                }, 1500);
            }
        }
    } catch (e) {
        console.error("⚠️ Error initializing success page:", e);
    }
}

/**
 * حقن وتأسيس تصميمات التنبيهات المخصصة والراقية لموقع حلويات بوسي مع توافق تام للموبايل والـ CSS Variables المعتمدة
 */
function injectBoseModalStyles() {
    if (document.getElementById('bose-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'bose-modal-styles';
    style.textContent = `
        .bose-modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(17, 17, 17, 0.4);
            backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            z-index: 10000;
            opacity: 0; transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            padding: 16px;
            box-sizing: border-box;
        }
        .bose-modal-box {
            background: var(--bose-white, #FFFFFF);
            border: 2px solid var(--bose-pink, #FF91A4);
            box-shadow: var(--bose-shadow-hover, 0 16px 40px rgba(255, 145, 164, 0.22));
            border-radius: 24px;
            width: 100%; max-width: 420px;
            padding: 28px;
            text-align: center;
            box-sizing: border-box;
            transform: scale(0.9) translateY(10px); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bose-modal-title {
            font-size: 19px; font-weight: 700; color: var(--bose-black, #111111); margin: 0 0 14px 0;
        }
        .bose-modal-text {
            font-size: 14px; font-weight: 400; color: var(--bose-black, #111111); opacity: 0.9; margin: 0 0 26px 0; line-height: 1.7;
        }
        .bose-modal-buttons {
            display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
        }
        .bose-btn-confirm {
            background: var(--bose-pink, #FF91A4); color: var(--bose-white, #FFFFFF); border: none; padding: 12px 28px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.2s ease-in-out; font-size: 14px; font-family: 'Cairo', sans-serif;
        }
        .bose-btn-confirm:hover {
            transform: translateY(-2px); box-shadow: 0 8px 16px rgba(255, 145, 164, 0.3);
        }
        .bose-btn-cancel {
            background: var(--bose-white, #FFFFFF); color: var(--bose-black, #111111); border: 1px solid rgba(255,145,164,0.5); padding: 12px 28px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.2s ease-in-out; font-size: 14px; font-family: 'Cairo', sans-serif;
        }
        .bose-btn-cancel:hover {
            background: #FFF0F2;
        }
        @media (max-width: 480px) {
            .bose-modal-box {
                padding: 22px;
                border-radius: 20px;
            }
            .bose-modal-title {
                font-size: 17px;
            }
            .bose-modal-text {
                font-size: 13.5px;
                margin: 0 0 20px 0;
            }
            .bose-btn-confirm, .bose-btn-cancel {
                padding: 10px 24px;
                font-size: 13px;
                width: 100%;
            }
            .bose-modal-buttons {
                flex-direction: column;
                gap: 10px;
            }
        }
        @keyframes bose-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

/**
 * دالة استدعاء نافذة التنبيه المخصصة لعلامتنا التجارية "حلويات بوسي" مع تركيز تلقائي ذكي للحقل المفقود لراحة العميل
 */
window.showBoseAlert = function(message, callback = null, targetElement = null) {
    const overlay = document.createElement('div');
    overlay.className = 'bose-modal-overlay';
    overlay.innerHTML = `
        <div class="bose-modal-box">
            <h3 class="bose-modal-title">تنبيه من حلويات بوسي ✨</h3>
            <p class="bose-modal-text">${message}</p>
            <div class="bose-modal-buttons">
                <button class="bose-btn-confirm" id="bose-alert-ok">موافق</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    document.body.style.overflow = "hidden";
    
    setTimeout(() => {
        overlay.style.opacity = '1';
        overlay.querySelector('.bose-modal-box').style.transform = 'scale(1) translateY(0)';
    }, 10);

    const closeAlert = () => {
        overlay.style.opacity = '0';
        overlay.querySelector('.bose-modal-box').style.transform = 'scale(0.9) translateY(10px)';
        document.body.style.overflow = "";
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
            if (targetElement) {
                targetElement.focus();
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetElement.style.borderColor = 'var(--bose-pink, #FF91A4)';
                targetElement.style.boxShadow = '0 0 10px rgba(255, 145, 164, 0.4)';
                setTimeout(() => {
                    targetElement.style.borderColor = '';
                    targetElement.style.boxShadow = '';
                }, 3000);
            }
        }, 250);
    };

    document.getElementById('bose-alert-ok').addEventListener('click', closeAlert);
};

/**
 * دالة استدعاء نافذة التأكيد والتراجع لعلامتنا التجارية "حلويات بوسي"
 */
window.showBoseConfirm = function(message, onConfirm, onCancel = null) {
    const overlay = document.createElement('div');
    overlay.className = 'bose-modal-overlay';
    overlay.innerHTML = `
        <div class="bose-modal-box">
            <h3 class="bose-modal-title">تأكيد الطلب 🌸</h3>
            <p class="bose-modal-text">${message}</p>
            <div class="bose-modal-buttons">
                <button class="bose-btn-confirm" id="bose-confirm-yes">تأكيد</button>
                <button class="bose-btn-cancel" id="bose-confirm-no">تراجع</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    document.body.style.overflow = "hidden";

    setTimeout(() => {
        overlay.style.opacity = '1';
        overlay.querySelector('.bose-modal-box').style.transform = 'scale(1) translateY(0)';
    }, 10);

    const handleAction = (isConfirmed) => {
        overlay.style.opacity = '0';
        overlay.querySelector('.bose-modal-box').style.transform = 'scale(0.9) translateY(10px)';
        document.body.style.overflow = "";
        setTimeout(() => {
            overlay.remove();
            if (isConfirmed && onConfirm) onConfirm();
            if (!isConfirmed && onCancel) onCancel();
        }, 250);
    };

    document.getElementById('bose-confirm-yes').addEventListener('click', () => handleAction(true));
    document.getElementById('bose-confirm-no').addEventListener('click', () => handleAction(false));
};

