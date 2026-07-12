
/**
 * 👑 المحرك المركزي العالمي وحوكمة واجهات الاستخدام (js/core-engine.js)
 * علامة حلويات بوسي الفاخرة (BoseSweets) - إصدار الإنتاج المتطور 2026
 * 
 * يمنع نهائياً الحذف أو الاختصار أو التبسيط لضمان التوافق المطلق وسد الثغرات المالية[span_3](start_span)[span_3](end_span).
 */

(function() {
    // النطاق العالمي الآمن للمحرك
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; 

    // 1. تهيئة واستدعاء قاعدة بيانات حلويات بوسي المستقرة
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return;
        
        let retries = 5;
        let delay = 1000;
        
        while (retries > 0) {
            try {
                const response = await fetch('data/site-data-final.json');
                if (!response.ok) throw new Error('فشل جلب ملف قاعدة البيانات الرئيسي.');
                
                const serverDateHeader = response.headers.get('Date');
                if (serverDateHeader) {
                    const serverTime = new Date(serverDateHeader).getTime();
                    const clientTime = Date.now();
                    window.boseServerTimeOffset = serverTime - clientTime;
                } else {
                    window.boseServerTimeOffset = 0;
                }
                
                window.BoseStoreData = await response.json();
                
                // تشغيل البناء الديناميكي للمكونات المشتركة فوراً
                buildAndInjectUniversalLayout();
                applyGlobalSEOAndBranding();
                window.updateGlobalCartCounter();
                
                // تفعيل حدث مخصص لباقي المحركات المعتمدة على البيانات[span_4](start_span)[span_4](end_span)
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
     * 2. دالة مراجعة زيادة الأسعار الرسمية وحظر الثغرات المالية[span_5](start_span)[span_5](end_span)
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
     * 3. الدالة الهندسية لحساب السعر النهائي للمنتج شامل خيارات التخصيص[span_6](start_span)[span_6](end_span)
     */
    window.calculateProductFinalPrice = function(product, selectedOptions) {
        const opts = selectedOptions || {};
        let price = 0;
        
        if (product) {
            price = product.price || product.basePrice || 0;

            if (product.prices && opts.size) {
                price = product.prices[opts.size] || price;
            }

            const selectedPrinting = opts.printing || opts.printingType || 'none';
            if (selectedPrinting && selectedPrinting !== 'none') {
                let printingFee = 0;
                if (product.customizationOptions && product.customizationOptions.printing) {
                    const printOptions = product.customizationOptions.printing.options;
                    if (Array.isArray(printOptions)) {
                        const printingOpt = printOptions.find(opt => opt.id === selectedPrinting || opt.type === selectedPrinting);
                        if (printingOpt) printingFee = printingOpt.price;
                    }
                }
                
                // صمام الأمان والامتثال المالي القياسي[span_7](start_span)[span_7](end_span)
                if (printingFee === 0) {
                    if (['edible', 'printable-edible', 'صورة_صالحة_للأكل'].includes(selectedPrinting)) {
                        printingFee = 60;
                    } else if (['non-edible', 'printable-non-edible', 'صورة_غير_صالحة_للأكل'].includes(selectedPrinting)) {
                        printingFee = 15;
                    }
                }
                price += printingFee;
            }
            
            if (product.isMiniCake || product.type === "mini-cake" || product.slug === "mini-cake-two-person") {
                if (opts.extraToppingPrice) price += parseFloat(opts.extraToppingPrice);
                if (opts.printingPrice) price += parseFloat(opts.printingPrice);
            }
        }
        return window.calculateBosePrice(price, "menu-only");
    };

    /**
     * 4. بناء كائن السلة القياسي الموحد[span_8](start_span)[span_8](end_span)
     */
    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;
        const opts = selectedOptions || {};
        const finalUnitPrice = window.calculateProductFinalPrice(product, opts);
        
        const isCustomizable = product.isMiniCake ||
                             product.type === "custom-cake" || 
                             product.type === "custom-flower" || 
                             (product.customizationOptions && Object.keys(opts).length > 0);
                             
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}` : String(product.slug || product.id);
        
        return {
            id: finalId,
            productSlug: product.slug,
            title: product.title,
            flavorName: opts.flavorName || opts.cakeType || product.flavor || "افتراضي",
            basePrice: parseFloat((product.price || product.basePrice || 0).toFixed(4)),
            finalPrice: parseFloat(finalUnitPrice.toFixed(4)),
            quantity: parseInt(quantity, 10) || 1,
            image: product.image || "",
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
    };

    /**
     * 5. الحسبة الهندسية للتورت المخصصة وحساب الأفراد الاحترافي[span_9](start_span)[span_9](end_span)
     */
    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = window.BoseStoreData?.cakeBuilder;
        const safePersons = parseInt(persons, 10) || 10;
        let price = config?.basePrice || 580;
        
        const minPersons = config?.persons.minimum || 10;
        const pricePerPerson = config?.pricePerPerson || 145; // الالتزام بسعر الفرد المحصن 145 جنيهاً[span_10](start_span)[span_10](end_span)
        
        const extraPersons = Math.max(0, safePersons - minPersons);
        price += extraPersons * pricePerPerson;
        
        const selectedPrinting = options.printingType || options.printing || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (config?.printingOptions) {
                const printOpt = config.printingOptions.find(opt => opt.id === selectedPrinting);
                if (printOpt) printingFee = printOpt.price;
            }
            if (printingFee === 0) {
                printingFee = ['edible', 'printable-edible', 'صورة_صالحة_للأكل'].includes(selectedPrinting) ? 60 : 15;
            }
            price += printingFee;
        }
        if (options.wrappingPrice) price += parseFloat(options.wrappingPrice) || 0;
        
        return window.calculateBosePrice(price, "menu-only");
    };

    /**
     * 6. الحسبة الهندسية لبوكيهات الورد المخصصة مع الإضافات ومفاجآت الكاش[span_11](start_span)[span_11](end_span)
     */
    window.calculateCustomFlowerPrice = function(flowerType, flowerCount, options = {}) {
        const config = window.BoseStoreData?.flowerBuilder;
        if (!config) return 0;
        
        const safeFlowerCount = parseInt(flowerCount, 10) || config.baseFlowers;
        const safeCashAmount = parseInt(options.moneyAmount, 10) || 0;
        const safeCashCategoryAmount = parseInt(options.moneyCategoryAmount, 10) || 0;
        const safeChocolatePieces = parseInt(options.chocolatePieces, 10) || 0;
        const safePhotoCount = parseInt(options.photoCount, 10) || 0;
        
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
        
        // حساب رسوم فئات العملات النقدية بدقة[span_12](start_span)[span_12](end_span)
        let cashHandlingFee = 0;
        if (safeCashAmount > 0 && safeCashCategoryAmount > 0) {
            const selectedCategory = config.moneyCategories.find(cat => cat.amount === safeCashCategoryAmount);
            if (selectedCategory) {
                const billCount = Math.floor(safeCashAmount / safeCashCategoryAmount);
                cashHandlingFee += billCount * selectedCategory.fee;
                const remainder = safeCashAmount % safeCashCategoryAmount;
                if (remainder > 0) {
                    const remainderCategory = config.moneyCategories
                        .filter(cat => cat.amount <= remainder)
                        .sort((a, b) => b.amount - a.amount)[0] || config.moneyCategories[0];
                    if (remainderCategory) cashHandlingFee += remainderCategory.fee;
                }
            }
        }
        
        servicePrice += cashHandlingFee;
        return window.calculateBosePrice(servicePrice, "menu-only") + safeCashAmount;
    };

    /**
     * 7. دوال التحقق والتطهير لأرقام الهواتف وجدول التحضير الصارم (24 ساعة)[span_13](start_span)[span_13](end_span)
     */
    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") return isOptional;
        return /^01[0125][0-9]{8}$/.test(window.sanitizeBosePhoneNumber(phone));
    };

    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return "";
        let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        else if (cleaned.startsWith("00201")) cleaned = "0" + cleaned.substring(4);
        else if (cleaned.startsWith("1") && cleaned.length === 10) cleaned = "0" + cleaned;
        return cleaned;
    };

    window.validateBoseDeliverySchedule = function(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
        return (selectedDateTime - new Date(synchronizedTime)) / (1000 * 60 * 60) >= 23.95;
    };

    window.onBoseDatabaseReady = function(callback) {
        if (window.BoseStoreData && window.BoseStoreData.store) callback(window.BoseStoreData);
        else {
            const handleLoaded = (e) => {
                callback(e.detail);
                document.removeEventListener('BoseDatabaseLoaded', handleLoaded);
            };
            document.addEventListener('BoseDatabaseLoaded', handleLoaded);
        }
    };

    /**
     * 8. بروتوكول بناء وضخ الهياكل الموحدة (Universal Injection Protocol)[span_14](start_span)[span_14](end_span)
     */
    function buildAndInjectUniversalLayout() {
        const headerInjector = document.getElementById('bose-header-injector');
        const footerInjector = document.getElementById('bose-footer-injector');
        const data = window.BoseStoreData;
        if (!data) return;

        // أ. بناء الهيدر والشريط العلوي المتحرك والقائمة الجانبية الفاخرة
        if (headerInjector) {
            // تجميع رسائل الشريط العلوي
            const marqueeMessages = data.navigation.topBarMessages.map(msg => `<span>${msg}</span>`).join('<span class="bose-separator">✦</span>');
            
            headerInjector.innerHTML = `
                <!-- TOP BAR MARQUEE[span_15](start_span)[span_15](end_span) -->
                <div id="top-bar-marquee" style="background: var(--bose-pink); color: #FFFFFF; padding: 10px 0; overflow: hidden; direction: rtl; border-bottom: 1px solid rgba(255,255,255,0.2); z-index: 1001; position: relative;">
                    <div class="animate-marquee" style="white-space: nowrap; display: inline-block; padding-left: 100%;">
                        ${marqueeMessages} ${marqueeMessages}
                    </div>
                </div>
                
                <!-- STICKY HEADER[span_16](start_span)[span_16](end_span) -->
                <header class="bose-sticky-header" style="position: sticky; top: 0; background: var(--bose-white); box-shadow: var(--bose-shadow-glow); z-index: 1000; padding: 12px 5%; display: flex; align-items: center; justify-content: space-between; direction: rtl;">
                    <button id="mobile-menu-toggle" aria-label="فتح القائمة" style="background: none; border: none; color: var(--bose-black); fontSize: 22px; cursor: pointer;">
                        <i class="fa-solid fa-bars-staggered"></i>
                    </button>
                    <div class="brand-logo-container" style="display: flex; align-items: center; gap: 10px;">
                        <img id="bose-store-logo" src="${data.store.logo}" alt="حلويات بوسي" style="height: 45px; width: 45px; object-fit: contain;">
                        <span class="brand-name-display" style="font-weight: 700; font-size: 20px; color: var(--bose-black);">حلويات بوسي</span>
                    </div>
                    <div class="header-actions-wrapper" style="display: flex; align-items: center; gap: 18px;">
                        <button id="nav-search-btn" aria-label="بحث" style="background: none; border: none; color: var(--bose-black); font-size: 20px; cursor: pointer;">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <a href="cart.html" class="nav-cart-icon-wrapper" style="position: relative; color: var(--bose-black); font-size: 20px; text-decoration: none;">
                            <i class="fa-solid fa-bag-shopping"></i>
                            <span id="nav-cart-count" style="position: absolute; top: -7px; left: -10px; background: var(--bose-pink); color: #FFFFFF; font-size: 11px; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">0</span>
                        </a>
                    </div>
                </header>

                <!-- NAVIGATION SIDEBAR DRAWER[span_17](start_span)[span_17](end_span) -->
                <div id="bose-sidebar-drawer" style="position: fixed; top: 0; right: -100%; width: 320px; height: 100%; background: var(--bose-white); box-shadow: -5px 0 25px rgba(0,0,0,0.05); z-index: 2000; transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1); direction: rtl; padding: 30px 24px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; border-bottom: var(--bose-border-pink); padding-bottom: 15px;">
                        <span style="font-weight: 700; font-size: 18px; color: var(--bose-black);">تصفح الأقسام</span>
                        <button id="bose-sidebar-close" style="background: none; border: none; color: var(--bose-black); font-size: 20px; cursor: pointer;">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <nav style="display: flex; flex-direction: column; gap: 16px;">
                        <a href="index.html" class="sidebar-link" style="font-weight:600; color:var(--bose-black); text-decoration:none; padding:10px; border-radius:8px; display:block; transition:all 0.3s;"><i class="fa-solid fa-house" style="margin-left:10px; color:var(--bose-pink);"></i> الرئيسية</a>
                        <a href="menu.html" class="sidebar-link" style="font-weight:600; color:var(--bose-black); text-decoration:none; padding:10px; border-radius:8px; display:block; transition:all 0.3s;"><i class="fa-solid fa-utensils" style="margin-left:10px; color:var(--bose-pink);"></i> المنيو الشامل</a>
                        <a href="cake-builder.html" class="sidebar-link" style="font-weight:600; color:var(--bose-black); text-decoration:none; padding:10px; border-radius:8px; display:block; transition:all 0.3s;"><i class="fa-solid fa-cake-candles" style="margin-left:10px; color:var(--bose-pink);"></i> محاكي التورتة</a>
                        <a href="flower-builder.html" class="sidebar-link" style="font-weight:600; color:var(--bose-black); text-decoration:none; padding:10px; border-radius:8px; display:block; transition:all 0.3s;"><i class="fa-solid fa-seedling" style="margin-left:10px; color:var(--bose-pink);"></i> محاكي الورد</a>
                        <a href="cart.html" class="sidebar-link" style="font-weight:600; color:var(--bose-black); text-decoration:none; padding:10px; border-radius:8px; display:block; transition:all 0.3s;"><i class="fa-solid fa-basket-shopping" style="margin-left:10px; color:var(--bose-pink);"></i> سلة المشتريات</a>
                        <a href="about.html" class="sidebar-link" style="font-weight:600; color:var(--bose-black); text-decoration:none; padding:10px; border-radius:8px; display:block; transition:all 0.3s;"><i class="fa-solid fa-heart" style="margin-left:10px; color:var(--bose-pink);"></i> من نحن</a>
                        <a href="contact.html" class="sidebar-link" style="font-weight:600; color:var(--bose-black); text-decoration:none; padding:10px; border-radius:8px; display:block; transition:all 0.3s;"><i class="fa-solid fa-phone" style="margin-left:10px; color:var(--bose-pink);"></i> تواصل معنا</a>
                    </nav>
                </div>
                <!-- OVERLAY BACKGROUND -->
                <div id="bose-sidebar-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.15); backdrop-filter: blur(2px); z-index: 1999; display: none; transition: opacity 0.3s ease;"></div>
            `;
            
            // ربط أحداث فتح وإغلاق القائمة الجانبية مركزياً
            bindSidebarEvents();
        }

        // ب. بناء الفوتر الموحد الصارم بلونه الفاتح الخالي من الخلفيات السوداء
        if (footerInjector) {
            footerInjector.innerHTML = `
                <footer class="bose-footer" style="background: var(--bose-white); border-top: var(--bose-border-pink); padding: 60px 5% 20px; direction: rtl;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; margin-bottom: 40px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                                <img src="${data.store.logo}" alt="حلويات بوسي" style="height: 50px;">
                                <span style="font-weight: 700; font-size: 22px; color: var(--bose-black);">حلويات بوسي</span>
                            </div>
                            <p id="footer-about-text" style="color: var(--bose-black); opacity: 0.8; font-size: 14px; line-height: 1.8; text-align: justify; margin: 0;">${data.footer.about}</p>
                        </div>
                        <div>
                            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 20px; color: var(--bose-black);">روابط سريعة</h3>
                            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
                                <li><a href="index.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px; transition: color 0.3s;">الرئيسية</a></li>
                                <li><a href="menu.html" style="style="color: var(--bose-black); text-decoration: none; font-size: 14px; transition: color 0.3s;">المنيو الشامل</a></li>
                                <li><a href="cake-builder.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px; transition: color 0.3s;">محاكي التورت التفاعلي</a></li>
                                <li><a href="flower-builder.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px; transition: color 0.3s;">محاكي الورد التفاعلي</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 20px; color: var(--bose-black);">وثائق السياسات</h3>
                            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
                                <li><a href="policies/privacy-policy.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px;">سياسة الخصوصية</a></li>
                                <li><a href="policies/refund-policy.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px;">سياسة الاسترجاع والتبديل</a></li>
                                <li><a href="policies/shipping-policy.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px;">سياسة التوصيل والشحن</a></li>
                                <li><a href="policies/terms.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px;">الشروط والأحكام القانونية</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 20px; color: var(--bose-black);">تواصل معنا</h3>
                            <p style="color: var(--bose-black); font-size: 14px; margin-bottom: 15px;"><i class="fa-solid fa-location-dot" style="color: var(--bose-pink); margin-left: 8px;"></i> ${data.store.pickup.address}</p>
                            <div id="footer-social-links" style="display: flex; gap: 15px; margin-top: 20px;">
                                <a href="${data.social.facebook}" target="_blank" aria-label="Facebook" style="color: #1877F2; font-size: 22px;"><i class="fa-brands fa-facebook"></i></a>
                                <a href="${data.social.instagram}" target="_blank" aria-label="Instagram" style="color: #E1306C; font-size: 22px;"><i class="fa-brands fa-instagram"></i></a>
                                <a href="${data.social.tiktok}" target="_blank" aria-label="TikTok" style="color: #000000; font-size: 22px;"><i class="fa-brands fa-tiktok"></i></a>
                                <a href="https://wa.me/${data.sanitizeBosePhoneNumber(data.social.whatsapp)}" target="_blank" aria-label="WhatsApp" style="color: #25D366; font-size: 22px;"><i class="fa-brands fa-whatsapp"></i></a>
                            </div>
                        </div>
                    </div>
                    <div style="border-top: var(--bose-border-pink); padding-top: 20px; text-align: center;">
                        <p class="footer-copyright-block" style="margin: 0; font-size: 13px; color: var(--bose-black); opacity: 0.7;">جميع الحقوق محفوظة © حلويات بوسي - عام 2026</p>
                    </div>
                </footer>
            `;
        }
    }

    function bindSidebarEvents() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const closeBtn = document.getElementById('bose-sidebar-close');
        const drawer = document.getElementById('bose-sidebar-drawer');
        const overlay = document.getElementById('bose-sidebar-overlay');
        const searchBtn = document.getElementById('nav-search-btn');

        if (toggleBtn && drawer && overlay) {
            toggleBtn.addEventListener('click', () => {
                drawer.style.right = '0';
                overlay.style.display = 'block';
            });
        }
        if (closeBtn && drawer && overlay) {
            closeBtn.addEventListener('click', () => {
                drawer.style.right = '-100%';
                overlay.style.display = 'none';
            });
            overlay.addEventListener('click', () => {
                drawer.style.right = '-100%';
                overlay.style.display = 'none';
            });
        }
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                window.location.href = 'search.html';
            });
        }
    }

    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;
        applyGlobalStyles(data.store.theme);
    }

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
                margin: 0; padding: 0; overflow-x: hidden;
            }
            h1, h2 { font-family: 'Cairo', sans-serif !important; font-weight: 700 !important; color: var(--bose-black) !important; }
            h3, h4, h5, h6 { font-family: 'Cairo', sans-serif !important; font-weight: 600 !important; color: var(--bose-black) !important; }
            p, span, a, button, input, select, textarea { font-family: 'Cairo', sans-serif !important; }
            .sidebar-link:hover { background: rgba(255,145,164,0.08); padding-right: 15px !important; color: var(--bose-pink) !important; }
            
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
            .animate-marquee { display: flex; width: max-content; animation: boseMarquee 25s linear infinite; will-change: transform; }
            .bose-separator { margin: 0 30px; color: var(--bose-gold); font-size: 12px; }
            .waterfall-up { animation: boseWaterfallUp 40s linear infinite; will-change: transform; }
            .waterfall-down { animation: boseWaterfallDown 40s linear infinite; will-change: transform; }
        `;
        document.head.appendChild(styleElement);
    }

    /**
     * 9. دالة تحديث عداد السلة العالمي بالهيدر والتحكم الدقيق بالكميات[span_18](start_span)[span_18](end_span)
     */
    window.updateGlobalCartCounter = function() {
        const cartCountBadge = document.getElementById('nav-cart-count');
        if (!cartCountBadge) return;
        
        const rawCart = localStorage.getItem('bose_cart');
        const cart = rawCart ? JSON.parse(rawCart) : [];
        
        let totalDisplayItems = 0;
        cart.forEach(item => {
            const isBespokeOrCustom = item.type === "custom-cake" || 
                                      item.type === "custom-flower" || 
                                      item.type === "mini-cake" || 
                                      (item.id && item.id.includes("-"));
            if (isBespokeOrCustom) totalDisplayItems += 1;
            else totalDisplayItems += (parseInt(item.quantity, 10) || 1);
        });
        cartCountBadge.textContent = totalDisplayItems;
    };

    /**
     * 10. تشغيل العدادات التصاعدية الذكية لقسم الفخر والاعتزاز (Section 08)[span_19](start_span)[span_19](end_span)
     */
    window.initializeBosePrideCounters = function() {
        const prideSection = document.getElementById('pride-section');
        if (!prideSection) return;

        const counters = prideSection.querySelectorAll('.stats-counter-value');
        if (counters.length === 0) return;

        const runCounters = () => {
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'), 10) || 0;
                let current = 0;
                const duration = 2000; 
                const stepTime = Math.max(Math.floor(duration / target), 15);
                
                const timer = setInterval(() => {
                    current += Math.ceil(target / (duration / stepTime));
                    if (current >= target) {
                        counter.textContent = target;
                        clearInterval(timer);
                    } else {
                        counter.textContent = current;
                    }
                }, stepTime);
            });
        };

        // تفعيل العدادات عند ظهور القسم في الشاشة لراحة عين العميل البصرية[span_20](start_span)[span_20](end_span)
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    runCounters();
                    observer.disconnect();
                }
            }, { threshold: 0.2 });
            observer.observe(prideSection);
        } else {
            runCounters();
        }
    };

    function showGlobalFriendlyError() {
        const errorDiv = document.createElement('div');
        errorDiv.style = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#FF91A4; color:#FFFFFF; padding:12px 24px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:99999; direction:rtl; font-size:14px;';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.';
        document.body.appendChild(errorDiv);
    }

    loadStoreDatabase();
})();

/**
 * 🛡️ حارس التمهيد النهائي ومنع التعارض البرمجي (Engine Bootstrap Guard)[span_21](start_span)[span_21](end_span)
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
                console.error("❌ حارس التمهيد: تجاوز الحد الأقصى لمحاولات تحميل قاعدة البيانات.");
            }
        }, 50);
    }
});

function verifyAndInitializeEngine() {
    console.log("🚀 تم التحقق من مطابقة المحرك المخصص وتوافقه مع قاعدة بيانات حلويات بوسي بنجاح.");
    window.initializeBosePrideCounters();
}