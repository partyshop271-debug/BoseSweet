/**
 * 📑 الدليل الهندسي للمواصفات القياسية الفاخرة - النسخة المصححة والمطورة V2
 * المحرك المركزي العالمي وعمليات الفحص المالي والمزامنة الزمنية المتقدمة (js/core-engine.js)
 * براند: حلويات بوسي (BoseSweets) - يمنع الاختصار أو الحذف نهائياً.
 */
(function() {
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; // فارق التوقيت بالمللي ثانية: (وقت الخادم - وقت جهاز العميل)

    // تهيئة واستدعاء قاعدة بيانات حلويات بوسي المستقرة والوحيدة للموقع
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return;
        
        let retries = 5;
        let delay = 1000;
        
        while (retries > 0) {
            try {
                const response = await fetch('site-data-final.json');
                if (!response.ok) throw new Error('فشل جلب ملف قاعدة البيانات الرئيسي.');
                
                // [حل الثغرة اللوجستية: تزامن التوقيت المحلي لشرط التحضير ومنع تلاعب العملاء]
                const serverDateHeader = response.headers.get('Date');
                if (serverDateHeader) {
                    const serverTime = new Date(serverDateHeader).getTime();
                    const clientTime = Date.now();
                    window.boseServerTimeOffset = serverTime - clientTime;
                } else {
                    window.boseServerTimeOffset = 0;
                }
                
                window.BoseStoreData = await response.json();
                applyGlobalSEOAndBranding();
                updateGlobalCartCounter();
                
                // تفعيل حدث مخصص لباقي المحركات المعتمدة على البيانات (cart, cake, flower) لمنع التعارض اللامتزامن
                document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
                return;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    console.error("❌ خطأ حرج في تهيئة نظام حلويات بوسي الموحد:", error);
                    showGlobalFriendlyError();
                } else {
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; 
                }
            }
        }
    }

    /**
     * دالة مراجعة زيادة الأسعار الرسمية وحظر الثغرات المالية
     */
    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        if (!window.BoseStoreData) return basePrice;
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return parseFloat((basePrice * (1 + (rule.percent / 100))).toFixed(4));
        }
        return basePrice;
    };

    /**
     * دالة هندسية لحساب السعر النهائي للمنتج (finalPrice) شامل خيارات التخصيص والأحجام والميني تورت والكب كيك
     */
    window.calculateProductFinalPrice = function(product, selectedOptions) {
        const opts = selectedOptions || {};
        let price = 0;
        
        if (product) {
            price = product.price || product.basePrice || 0;

            // 1. حساب السعر بناءً على الحجم المحدد من صفحة التبويبات أو خيارات العميل
            if (product.prices && opts.size) {
                price = product.prices[opts.size] || price;
            }

            // 2. حساب قيمة خيارات الطباعة والصور المخصصة (دعم المنتجات العادية والكب كيك بمرونة تامة وحظر الثغرات المادية)
            const selectedPrinting = opts.printing || opts.printingType || 'none';
            if (selectedPrinting && selectedPrinting !== 'none') {
                let printingFee = 0;
                // البحث في خيارات التخصيص للمنتج المتاحة بملف الـ JSON إن وجدت
                if (product.customizationOptions && product.customizationOptions.printing) {
                    const printOptions = product.customizationOptions.printing.options;
                    if (Array.isArray(printOptions)) {
                        const printingOpt = printOptions.find(opt => opt.id === selectedPrinting || opt.type === selectedPrinting);
                        if (printingOpt) {
                            printingFee = printingOpt.price;
                        }
                    }
                }
                
                // صمام الأمان والامتثال المالي لإصلاح ثغرة الكب كيك والمنتجات العادية:
                // في حال عدم وجود السعر المعرف بالملف أو تعذر جلب التوصيف، نطبق التسعيرة القياسية آلياً:
                // 60 جنيهاً للصورة الصالحة للأكل، و15 جنيهاً للصورة غير الصالحة للأكل.
                if (printingFee === 0) {
                    if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') {
                        printingFee = 60;
                    } else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') {
                        printingFee = 15;
                    }
                }
                
                price += printingFee;
            }
            
            // 3. دعم خيارات الميني تورت المخصصة والملحقات الإضافية
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
     * دالة توليد وإنشاء كائن السلة الموحد بالصيغة المعيارية المانعة للتداخل والتصادم البرمجي
     */
    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;
        const opts = selectedOptions || {};
        const finalUnitPrice = window.calculateProductFinalPrice(product, opts);
        
        // توليد معرف فريد غير قابل للتصادم البرمجي للمنتجات المخصصة، الميني تورت، أو الكب كيك المخصص بصيغة [slug]-[timestamp]
        const isCustomizable = product.isMiniCake ||
                             product.type === "custom-cake" || 
                             product.type === "custom-flower" || 
                             (product.customizationOptions && Object.keys(opts).length > 0);
                             
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}` : String(product.slug || product.id);
        
        const cartItem = {
            id: finalId,
            productSlug: product.slug,
            title: product.title,
            flavorName: opts.flavorName || opts.cakeType || product.flavor || "افتراضي",
            basePrice: parseFloat((product.price || product.basePrice || 0).toFixed(4)),
            finalPrice: parseFloat(finalUnitPrice.toFixed(4)),
            quantity: parseInt(quantity, 10) || 1,
            image: product.image || (product.images && product.images[0]) || "",
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
     * الحسبة الهندسية لمحاكاة أسعار التورتة المخصصة ديناميكياً بدقة مطلقة
     * [تم التحديث هنا لحظر الثغرة المالية ورفع سعر الفرد الاحتياطي إلى 145 جنيهاً بنجاح]
     */
    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = window.BoseStoreData?.cakeBuilder;
        const safePersons = parseInt(persons, 10) || (config ? config.persons.minimum : 10) || 10;
        let price = (config ? config.basePrice : 580) || 580;
        
        const minPersons = (config ? config.persons.minimum : 10) || 10;
        const pricePerPerson = (config ? config.pricePerPerson : 145) || 145; // الالتزام بـ 145 جنيهاً لسلامة التسعير الفاخر للمواد الطبيعية 100%
        
        const extraPersons = Math.max(0, safePersons - minPersons);
        price += extraPersons * pricePerPerson;
        
        // فحص وقراءة نوع الطباعة بدقة متناهية من كافة المتغيرات الممكنة للإرسال للمحاكي التفاعلي
        const selectedPrinting = options.printingType || options.printing || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (config && config.printingOptions) {
                const printOpt = config.printingOptions.find(opt => opt.id === selectedPrinting);
                if (printOpt) {
                    printingFee = printOpt.price;
                }
            }
            
            // صمام الأمان والامتثال المالي لحسابات التورت المخصصة (60 جنيهاً للأكل، 15 جنيهاً لغير الأكل كفولباك موثوق)
            if (printingFee === 0) {
                if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') {
                    printingFee = 60;
                } else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') {
                    printingFee = 15;
                }
            }
            
            price += printingFee;
        }

        // إدماج أي زيادة خاصة بخيارات أخرى إضافية ممررة
        if (options.wrappingPrice) {
            price += parseFloat(options.wrappingPrice) || 0;
        }
        
        return window.calculateBosePrice(price, "menu-only");
    };

    /**
     * الحسبة الهندسية لمحاكاة أسعار بوكيهات الورد المخصصة مع كافة الإضافات التفاعلية وحساب مصاريف الكاش
     */
    window.calculateCustomFlowerPrice = function(flowerType, flowerCount, options = {}) {
        const config = window.BoseStoreData?.flowerBuilder;
        if (!config) return 0;
        
        const safeFlowerCount = parseInt(flowerCount, 10) || config.baseFlowers;
        const safeCashAmount = parseInt(options.moneyAmount, 10) || 0;
        const safeCashCategoryAmount = parseInt(options.moneyCategoryAmount, 10) || 0;
        const safeChocolatePieces = parseInt(options.chocolatePieces, 10) || 0;
        const safePhotoCount = parseInt(options.photoCount, 10) || 0;
        
        // 1. حساب قيمة الخدمات والمكونات الخاضعة لزيادة السعر (Service / Taxable Bouquet Price)
        let servicePrice = config.basePrice || 400;
        const extraFlowers = Math.max(0, safeFlowerCount - config.baseFlowers);
        servicePrice += extraFlowers * config.extraFlowerPrice;
        
        if (options.wrappingType) {
            const wrapOpt = config.wrappingTypes.find(opt => opt.id === options.wrappingType);
            if (wrapOpt) servicePrice += wrapOpt.price;
        }
        
        if (options.chocolateType && safeChocolatePieces > 0) {
            const chocOpt = config.chocolateTypes.find(opt => opt.id === options.chocolateType);
            if (chocOpt) servicePrice += chocOpt.price * safeChocolatePieces;
        }
        
        if (options.hasGiftCard) servicePrice += config.giftCardPrice || 20;
        if (safePhotoCount > 0) servicePrice += safePhotoCount * (config.photoPrintPrice || 15);
        
        // 2. حساب رسوم ومصاريف خدمة دمج الكاش (Handling Fee) بدقة الأوراق النقدية
        let cashHandlingFee = 0;
        if (safeCashAmount > 0 && safeCashCategoryAmount > 0) {
            const selectedCategory = config.moneyCategories.find(cat => cat.amount === safeCashCategoryAmount);
            if (selectedCategory) {
                // تقسيم واحتساب عدد الأوراق النقدية
                const billCount = Math.floor(safeCashAmount / safeCashCategoryAmount);
                cashHandlingFee += billCount * selectedCategory.fee;
                
                // حساب رسوم المتبقي من الكاش الذي يقل عن قيمة الفئة الرئيسية لمنع الثغرات الحسابية
                const remainder = safeCashAmount % safeCashCategoryAmount;
                if (remainder > 0) {
                    const remainderCategory = config.moneyCategories
                        .filter(cat => cat.amount <= remainder)
                        .sort((a, b) => b.amount - a.amount)[0] || config.moneyCategories[0];
                    if (remainderCategory) {
                        cashHandlingFee += remainderCategory.fee;
                    }
                }
            }
        }
        
        // رسوم خدمة دمج الكاش تُضاف لوعاء الخدمات ويُطبق عليها تضخم الأسعار بشكل طبيعي
        servicePrice += cashHandlingFee;
        
        // 3. تمرير الوعاء الخدمي على دالة زيادة الأسعار المركزية للموقع
        const finalServicePrice = window.calculateBosePrice(servicePrice, "menu-only");
        
        // 4. دمج مبلغ الكاش الأساسي الصافي المعفى تماماً من أي زيادة تضخمية أو عمولات
        return finalServicePrice + safeCashAmount;
    };

    /**
     * الدالة القياسية والوحيدة للتحقق من أرقام الهواتف المحمولة المصرية
     */
    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") {
            return isOptional; // إن كان اختيارياً كالرقم البديل نمرر القيمة بسلام لزيادة التحويلات والمبيعات
        }
        const cleaned = window.sanitizeBosePhoneNumber(phone);
        const egPhoneRegex = /^01[0125][0-9]{8}$/;
        return egPhoneRegex.test(cleaned);
    };

    /**
     * دالة تنظيف وتطهير أرقام الهواتف وإعادتها بالصيغة المحلية الموحدة (01XXXXXXXXX)
     */
    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return "";
        let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
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
     * حارس الوقت الموحد والذكي لشرط التحضير (The 24-Hour Schedule Core Lock)
     */
    window.validateBoseDeliverySchedule = function(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        
        // احتساب الوقت الحقيقي الموثق من الخادم بدلاً من ساعة العميل المحلية العشوائية القابلة للتلاعب
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
        const currentDateTime = new Date(synchronizedTime);
        
        if (selectedDateTime <= currentDateTime) return false;
        
        const diffMs = selectedDateTime - currentDateTime;
        const hoursDiff = diffMs / (1000 * 60 * 60);
        // شرط تحضير صارم لا يقل عن 24 ساعة (مع إعطاء سماحية آمنة 3 دقائق لتجنب التباطؤ اللحظي أثناء الإرسال)
        return hoursDiff >= 23.95;
    };

    /**
     * بواب الأمان والتحكم لمنع حالات التعارض والتحميل اللامتزامن لبيانات الـ JSON لباقي المحركات الموزعة
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

    // مزامنة عناصر الهوية البصرية، اللوجو، وعلامات الـ SEO الفاخرة لمنع مشاكل التحميل والوميض البصري
    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;
        
        document.title = data.seo.title;
        
        const logoImgs = document.querySelectorAll('img#bose-store-logo');
        logoImgs.forEach(img => {
            if(img.src !== data.store.logo) img.src = data.store.logo;
        });
        
        const aboutText = document.getElementById('footer-about-text');
        if (aboutText && !aboutText.textContent) aboutText.textContent = data.footer.about;
        
        // حقن التبعيات والخطوط مبكراً لمنع تضخم ومشاكل تحميل الشاشات
        injectEarlyDependencies();
        applyGlobalStyles(data.store.theme);
    }

    // حقن الخطوط المعتمدة Cairo والأيقونات الفاخرة FontAwesome في الرأس مباشرة وبطرق آمنة ومجانية 100%
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

    // زراعة وتطبيق الألوان والرموز الحاكمة والمقدسة للعلامة لتأمين التنفس البصري الكامل ومنع التكدس
    function applyGlobalStyles(theme) {
        if (document.getElementById('bose-global-dynamic-styles')) return;
        const styleElement = document.createElement('style');
        styleElement.id = 'bose-global-dynamic-styles';
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
            
            body {
                font-family: 'Cairo', sans-serif !important;
                background-color: var(--bose-white) !important;
                color: var(--bose-black) !important;
                margin: 0;
                padding: 0;
                overflow-x: hidden;
            }
            
            h1, h2 {
                font-family: 'Cairo', sans-serif !important;
                font-weight: 700 !important;
                color: var(--bose-black) !important;
            }
            h3, h4, h5, h6 {
                font-family: 'Cairo', sans-serif !important;
                font-weight: 600 !important;
                color: var(--bose-black) !important;
            }
            p, span, a, button, input, select, textarea {
                font-family: 'Cairo', sans-serif !important;
            }

            @keyframes boseMarquee {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-50%, 0, 0); }
            }
            
            @keyframes boseWaterfallUp {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(0, -50%, 0); }
            }
            
            @keyframes boseWaterfallDown {
                0% { transform: translate3d(0, -50%, 0); }
                100% { transform: translate3d(0, 0, 0); }
            }
            
            @keyframes boseCategoriesLoop {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-50%, 0, 0); }
            }

            .animate-marquee {
                display: flex;
                width: max-content;
                animation: boseMarquee 25s linear infinite;
                will-change: transform;
            }

            .waterfall-up {
                animation: boseWaterfallUp 40s linear infinite;
                will-change: transform;
            }

            .waterfall-down {
                animation: boseWaterfallDown 40s linear infinite;
                will-change: transform;
            }

            .categories-track-loop {
                display: flex;
                width: max-content;
                animation: boseCategoriesLoop 30s linear infinite;
                will-change: transform;
            }
        `;
        document.head.appendChild(styleElement);
    }

    /**
     * تحديث شارة العداد الصغير للسلة بالهيدر ديناميكياً ولحظياً بشكل مدروس برمجياً وهندسياً
     */
    window.updateGlobalCartCounter = function() {
        const cartCountBadge = document.getElementById('nav-cart-count');
        if (!cartCountBadge) return;
        
        const rawCart = localStorage.getItem('bose_cart');
        const cart = rawCart ? JSON.parse(rawCart) : [];
        
        let totalDisplayItems = 0;
        cart.forEach(item => {
            // المنتجات المخصصة داخل المحاكيات أو الميني تورت المخصصة تحتسب كقطعة/لوت فريد واحد في شارة العداد بالهيدر لمنع تداخل الأعداد
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
        cartCountBadge.textContent = totalDisplayItems;
    };

    function showGlobalFriendlyError() {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.bottom = '20px';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translateX(-50%)';
        errorDiv.style.backgroundColor = '#FF91A4';
        errorDiv.style.color = '#FFFFFF';
        errorDiv.style.padding = '12px 24px';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        errorDiv.style.zIndex = '99999';
        errorDiv.style.direction = 'rtl';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.fontWeight = '600';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.';
        document.body.appendChild(errorDiv);
    }

    loadStoreDatabase();
})();

/**
 * 🛡️ حارس التمهيد ومنع التعارض البرمجي (Engine Bootstrap Guard)
 * فحص تكراري متقدم لحماية معالجات الموبايل وضمان استقرار جلب البيانات قبل تشغيل المحركات الفرعية الصفحات
 */
document.addEventListener("DOMContentLoaded", () => {
    if (window.BoseStoreData && window.BoseStoreData.store) {
        verifyAndInitializeEngine();
    } else {
        let attempts = 0;
        const maxAttempts = 100; 
        
        const coreGuardInterval = setInterval(() => {
            attempts++;
            if (window.BoseStoreData && window.BoseStoreData.store) {
                clearInterval(coreGuardInterval);
                verifyAndInitializeEngine();
            } else if (attempts >= maxAttempts) {
                clearInterval(coreGuardInterval);
                console.error("❌ حارس التمهيد: تجاوز الحد الأقصى لمحاولات تحميل قاعدة البيانات. تم إيقاف الفحص لتأمين الأداء.");
            }
        }, 50);
    }
});

function verifyAndInitializeEngine() {
    console.log("🚀 تم التحقق من مطابقة المحرك المخصص وتوافقه مع قاعدة بيانات حلويات بوسي.");
    if (typeof startEngineLogic === "function") {
        startEngineLogic();
    }
}
