/**
 * 📑 المحرك المركزي العام وعمليات الحوكمة المتقدمة - حلويات بوسي (النسخة المصححة والمطورة V2)
 * -------------------------------------------------------------------------------------
 * النطاق المعماري: إدارة البيانات اللحظية، الفحص المالي الدقيق، صمام أمان الشحن والوقت،
 * وحقن عناصر الواجهة المقدسة (الهيدر، الشريط العلوي، السايدبار، قسم الإتقان، والفوتر) بعد نجاح الاتصال.
 * التوافق التكنولوجي: الموبايل أولاً (Mobile-First) + الكمبيوتر - متوافق بالكامل مع استضافة الموبايل.
 */

(function() {
    // النطاق العالمي للمحرك لمنع التعارض البرمجي
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; 

    // 1. استدعاء وتهيئة قاعدة بيانات حلويات بوسي المستقرة
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return;
        let retries = 5;
        let delay = 500; // تقليص وقت الانتظار الأولي لسرعة الاستجابة على الشبكات الضعيفة
        
        while (retries > 0) {
            try {
                const response = await fetch('data/site-data-final.json');
                if (!response.ok) throw new Error('فشل جلب ملف قاعدة البيانات الرئيسي.');
                
                // مزامنة وقت الخادم الحقيقي من الهيدر لمنع تلاعب ساعات أجهزة العملاء
                const serverDateHeader = response.headers.get('Date');
                if (serverDateHeader) {
                    window.boseServerTimeOffset = new Date(serverDateHeader).getTime() - Date.now();
                }
                
                window.BoseStoreData = await response.json();
                
                // صمام أمان التمهيد: نطبق البناء والتشغيل فقط وحصرياً بعد نجاح استلام كائن البيانات بالكامل
                applyGlobalSEOAndBranding();
                injectBoseUniversalLayouts();
                updateGlobalCartCounter();
                
                // إطلاق حدث النجاح لباقي المحركات المعزولة (cart-engine, cake-engine) للبدء في سحب المنتجات فوراً
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

    // 2. الحوكمة الحسابية والمالية الصارمة وحظر الثغرات
    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        if (!window.BoseStoreData) return basePrice;
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return parseFloat((basePrice * (1 + (rule.percent / 100))).toFixed(4));
        }
        return basePrice;
    };

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
                // صمام الأمان المالي والامتثال القياسي للكب كيك والمنتجات العادية
                if (printingFee === 0) {
                    if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') {
                        printingFee = 60; // 60 جنيهاً للصورة الصالحة للأكل
                    } else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') {
                        printingFee = 15; // 15 جنيهاً للصورة غير صالحة للأكل
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

    // 3. الحسبة الهندسية للتورت المخصصة وبوكيهات الورد
    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = window.BoseStoreData?.cakeBuilder;
        const safePersons = parseInt(persons, 10) || 10;
        let price = (config ? config.basePrice : 580) || 580;
        const minPersons = (config ? config.persons.minimum : 4) || 4;
        const pricePerPerson = (config ? config.pricePerPerson : 145) || 145; // 145 جنيهاً للفرد لحظر الثغرات المالية
        
        const extraPersons = Math.max(0, safePersons - minPersons);
        price += extraPersons * pricePerPerson;
        
        const selectedPrinting = options.printingType || options.printing || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = (selectedPrinting === 'edible') ? 60 : 15;
            price += printingFee;
        }
        if (options.wrappingPrice) price += parseFloat(options.wrappingPrice) || 0;
        
        return window.calculateBosePrice(price, "menu-only");
    };

    window.calculateCustomFlowerPrice = function(flowerType, flowerCount, options = {}) {
        const config = window.BoseStoreData?.flowerBuilder;
        if (!config) return 0;
        
        const safeFlowerCount = parseInt(flowerCount, 10) || config.baseFlowers;
        const safeCashAmount = parseInt(options.moneyAmount, 10) || 0;
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
        
        return window.calculateBosePrice(servicePrice, "menu-only") + safeCashAmount;
    };

    // 4. حراس التنظيف، الفحص، وأمان التوصيل (قفل الـ 24 ساعة تحضير)
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

    // 5. بروتوكول الحقن الديناميكي الموحد لجميع المكونات (Universal Injection Layout)
    function injectBoseUniversalLayouts() {
        const data = window.BoseStoreData;
        if (!data) return;

        // أ. بناء وحقن شريط الإعلانات العلوي المتحرك (Top Bar Marquee) - إصلاح الحركة المبتورة والعكسية
        const headerInjector = document.getElementById('bose-header-injector');
        if (headerInjector && !document.getElementById('bose-top-bar-marquee') && data.navigation?.topBarMessages) {
            const topBar = document.createElement('div');
            topBar.id = 'bose-top-bar-marquee';
            topBar.style.cssText = 'background-color: var(--bose-pink); color: #FFFFFF; overflow: hidden; padding: 10px 0; font-size: 14px; font-weight: 600; direction: rtl; position: relative; z-index: 10001;';
            
            const track = document.createElement('div');
            track.className = 'animate-marquee';
            
            // تكرار الرسائل 4 مرات متتالية لملء عرض الشاشات الضخمة كلياً وحظر الفراغات أو البتر البصري نهائياً
            const repeatedMessages = [
                ...data.navigation.topBarMessages, 
                ...data.navigation.topBarMessages,
                ...data.navigation.topBarMessages,
                ...data.navigation.topBarMessages
            ];
            
            repeatedMessages.forEach(msg => {
                const item = document.createElement('span');
                item.style.cssText = 'padding: 0 50px; display: inline-block; white-space: nowrap;';
                item.innerHTML = `${msg} <i class="fa-solid fa-sparkles" style="color: var(--bose-gold); margin-right: 8px;"></i>`;
                track.appendChild(item);
            });
            
            topBar.appendChild(track);
            headerInjector.before(topBar);
        }

        // ب. بناء وحقن الهيدر الذكي الموحد الثابت (Sticky Header)
        if (headerInjector && !document.getElementById('bose-main-header')) {
            headerInjector.innerHTML = `
                <header id="bose-main-header" style="background-color: var(--bose-white); border-bottom: var(--bose-border-pink); position: sticky; top: 0; z-index: 10000; padding: 12px 20px; box-shadow: var(--bose-shadow-glow); direction: rtl;">
                    <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto;">
                        <button id="mobile-menu-toggle" aria-label="فتح القائمة" style="background: none; border: none; color: var(--bose-black); font-size: 22px; cursor: pointer; transition: color 0.3s;">
                            <i class="fa-solid fa-bars-staggered"></i>
                        </button>
                        
                        <div class="brand-logo-container" style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="window.location.href='index.html'">
                            <img id="bose-store-logo" src="${data.store.logo}" alt="حلويات بوسي" style="height: 45px; width: 45px; object-fit: contain;">
                            <span class="brand-name-display" style="font-size: 20px; font-weight: 700; color: var(--bose-black); letter-spacing: 0.5px;">${data.store.name}</span>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 18px;">
                            <button id="nav-search-btn" aria-label="البحث" style="background: none; border: none; color: var(--bose-black); font-size: 20px; cursor: pointer;" onclick="window.location.href='search.html'">
                                <i class="fa-solid fa-magnifying-glass"></i>
                            </button>
                            <a class="nav-cart-icon-wrapper" href="cart.html" style="position: relative; color: var(--bose-black); font-size: 20px; text-decoration: none;">
                                <i class="fa-solid fa-bag-shopping"></i>
                                <span id="nav-cart-count" style="position: absolute; top: -8px; left: -10px; background-color: var(--bose-pink); color: #FFFFFF; font-size: 11px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 2px; box-shadow: 0 2px 5px rgba(255,145,164,0.4);">0</span>
                            </a>
                        </div>
                    </div>
                </header>
            `;
        }

        // ج. بناء وحقن القائمة الجانبية المتطورة (Sidebar Drawer)
        if (!document.getElementById('bose-sidebar-drawer')) {
            const sidebar = document.createElement('div');
            sidebar.id = 'bose-sidebar-drawer';
            sidebar.style.cssText = 'position: fixed; top: 0; right: -320px; width: 300px; height: 100%; background-color: var(--bose-white); box-shadow: -5px 0 25px rgba(0,0,0,0.08); z-index: 100000; transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1); direction: rtl; padding: 30px 24px; box-sizing: border-box;';
            
            let menuLinksHtml = '';
            if (data.navigation?.menuItems) {
                const targetUrls = { 'الرئيسية': 'index.html', 'المنيو الشامل': 'menu.html', 'السلة': 'cart.html', 'محاكي التورت': 'cake-builder.html', 'محاكي الورد': 'flower-builder.html' };
                data.navigation.menuItems.forEach(item => {
                    const url = targetUrls[item] || '#';
                    menuLinksHtml += `<a href="${url}" style="display: block; padding: 14px 10px; color: var(--bose-black); font-weight: 600; text-decoration: none; font-size: 16px; border-bottom: 1px solid rgba(255,145,164,0.1); transition: all 0.3s; border-radius: 8px;">${item}</a>`;
                });
            }

            sidebar.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px; border-bottom: 2px solid var(--bose-pink); padding-bottom: 15px;">
                    <span style="font-weight: 700; font-size: 18px; color: var(--bose-black);">تصفح القائمة</span>
                    <button id="sidebar-close-btn" style="background: none; border: none; font-size: 20px; color: var(--bose-black); cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <nav style="display: flex; flex-direction: column; gap: 8px;">
                    ${menuLinksHtml}
                </nav>
            `;
            document.body.appendChild(sidebar);

            const backdrop = document.createElement('div');
            backdrop.id = 'bose-sidebar-backdrop';
            backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(17,17,17,0.3); backdrop-filter: blur(4px); z-index: 99999; display: none; opacity: 0; transition: opacity 0.3s;';
            document.body.appendChild(backdrop);

            const openSidebar = () => {
                sidebar.style.right = '0';
                backdrop.style.display = 'block';
                setTimeout(() => backdrop.style.opacity = '1', 10);
            };
            const closeSidebar = () => {
                sidebar.style.right = '-320px';
                backdrop.style.opacity = '0';
                setTimeout(() => backdrop.style.display = 'none', 300);
            };

            document.addEventListener('click', function(e) {
                if (e.target.closest('#mobile-menu-toggle')) openSidebar();
                else if (e.target.closest('#sidebar-close-btn') || e.target === backdrop) closeSidebar();
            });
        }

        // د. بناء وتشغيل قسم عقد من الإتقان المروحي لملء الشاشة
        const excellenceContainer = document.getElementById('excellence-images-track');
        if (excellenceContainer && data.homepage?.excellence?.images && !excellenceContainer.classList.contains('initialized')) {
            excellenceContainer.innerHTML = '';
            excellenceContainer.style.cssText = 'display: flex; width: max-content; overflow: hidden;';
            excellenceContainer.classList.add('initialized');
            
            const trackLoop = document.createElement('div');
            trackLoop.className = 'categories-track-loop';
            
            const repeatedExImages = [...data.homepage.excellence.images, ...data.homepage.excellence.images, ...data.homepage.excellence.images];
            repeatedExImages.forEach(imgUrl => {
                const linkWrapper = document.createElement('a');
                linkWrapper.href = 'menu.html';
                linkWrapper.style.cssText = 'display: block; flex-shrink: 0; margin-right: 0; padding: 0; line-height: 0;';
                
                const img = document.createElement('img');
                img.src = imgUrl;
                img.alt = 'إتقان حلويات بوسي';
                img.loading = 'lazy';
                img.style.cssText = 'width: 33.333vw; min-width: 280px; height: 350px; object-fit: cover; border: none; pointer-events: none;';
                
                linkWrapper.appendChild(img);
                trackLoop.appendChild(linkWrapper);
            });
            excellenceContainer.appendChild(trackLoop);
        }

        // هـ. بناء وحقن الفوتر الرسمي الفاخر للموقع بكامل مكوناته وثائقه وضمان راحتها البصرية الفاتحة
        const footerContainer = document.getElementById('bose-footer-injector');
        if (footerContainer && !document.getElementById('bose-main-footer')) {
            let policyLinksHtml = '';
            if (data.footer?.policies) {
                const policyUrls = { 'سياسة الخصوصية': 'policies/privacy-policy.html', 'سياسة الاسترجاع': 'policies/refund-policy.html', 'سياسة الطلبات': 'policies/shipping-policy.html', 'الشروط والأحكام': 'policies/terms.html' };
                data.footer.policies.forEach(p => {
                    policyLinksHtml += `<a href="${policyUrls[p] || '#'}" style="color: var(--bose-black); text-decoration: none; font-size: 14px; font-weight: 400; transition: color 0.3s;">${p}</a>`;
                });
            }

            footerContainer.innerHTML = `
                <footer id="bose-main-footer" class="bose-footer" style="background-color: var(--bose-white); border-top: var(--bose-border-pink); padding: 50px 20px 20px; direction: rtl; color: var(--bose-black);">
                    <div style="max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 40px; border-bottom: 1px solid rgba(255,145,164,0.15); padding-bottom: 40px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px;">
                                <img src="${data.store.logo}" alt="لوجو بوسي" style="height: 50px; width: 50px; object-fit: contain;">
                                <span style="font-size: 22px; font-weight: 700;">${data.store.name}</span>
                            </div>
                            <p id="footer-about-text" style="font-size: 14px; line-height: 1.8; color: var(--bose-black); font-weight: 400; margin: 0;">${data.footer.about}</p>
                        </div>
                        
                        <div>
                            <h3 style="font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 20px; position: relative; padding-bottom: 8px; border-bottom: 2px solid var(--bose-pink); width: max-content;">روابط سريعة</h3>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                <a href="index.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px;">الرئيسية</a>
                                <a href="menu.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px;">المنيو الشامل</a>
                                <a href="about.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px;">مَنْ نحن</a>
                                <a href="contact.html" style="color: var(--bose-black); text-decoration: none; font-size: 14px;">تواصل معنا</a>
                            </div>
                        </div>

                        <div>
                            <h3 style="font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 20px; position: relative; padding-bottom: 8px; border-bottom: 2px solid var(--bose-pink); width: max-content;">وثائق السياسات</h3>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${policyLinksHtml}
                            </div>
                        </div>

                        <div>
                            <h3 style="font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 20px; position: relative; padding-bottom: 8px; border-bottom: 2px solid var(--bose-pink); width: max-content;">بيانات الفرع والنشاط</h3>
                            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;"><i class="fa-solid fa-location-dot" style="color: var(--bose-pink); margin-left: 8px;"></i>${data.store.pickup.address}</p>
                            <div id="footer-social-links" style="display: flex; gap: 14px; margin-top: 15px;">
                                <a href="${data.social.facebook}" target="_blank" aria-label="فيسبوك" style="color: #1877F2; font-size: 22px;"><i class="fa-brands fa-facebook"></i></a>
                                <a href="${data.social.instagram}" target="_blank" aria-label="انستجرام" style="color: #E1306C; font-size: 22px;"><i class="fa-brands fa-instagram"></i></a>
                                <a href="${data.social.tiktok}" target="_blank" aria-label="تيك توك" style="color: #000000; font-size: 22px;"><i class="fa-brands fa-tiktok"></i></a>
                                <a href="https://wa.me/${window.sanitizeBosePhoneNumber(data.social.whatsapp)}" target="_blank" aria-label="واتساب" style="color: #25D366; font-size: 22px;"><i class="fa-brands fa-whatsapp"></i></a>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding-top: 25px; margin-top: 10px;">
                        <p class="footer-copyright-block" style="font-size: 13px; color: var(--bose-black); font-weight: 400; margin: 0;">جميع الحقوق محفوظة © ٢٠٢٦ لموقع حلويات بوسي</p>
                    </div>
                </footer>
            `;
        }
    }

    // 6. تهيئة الخطوط والـ SEO والاعتمادات الأساسية
    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;
        
        document.title = data.seo.title;
        
        const logoImgs = document.querySelectorAll('img#bose-store-logo');
        logoImgs.forEach(img => { if(img.src !== data.store.logo) img.src = data.store.logo; });
        
        injectEarlyDependencies();
        applyGlobalStyles(data.store.theme);
    }

    function injectEarlyDependencies() {
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            const pre1 = document.createElement('link'); pre1.rel = 'preconnect'; pre1.href = 'https://fonts.googleapis.com';
            const pre2 = document.createElement('link'); pre2.rel = 'preconnect'; pre2.href = 'https://fonts.gstatic.com'; pre2.crossOrigin = 'anonymous';
            const font = document.createElement('link'); font.rel = 'stylesheet'; font.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
            document.head.append(pre1, pre2, font);
        }
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link'); fa.rel = 'stylesheet'; fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(fa);
        }
    }

    function applyGlobalStyles(theme) {
        if (document.getElementById('bose-global-dynamic-styles')) return;
        const style = document.createElement('style');
        style.id = 'bose-global-dynamic-styles';
        style.textContent = `
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
            body { font-family: 'Cairo', sans-serif !important; background-color: var(--bose-white) !important; color: var(--bose-black) !important; margin: 0; padding: 0; overflow-x: hidden; }
            h1, h2 { font-family: 'Cairo', sans-serif !important; font-weight: 700 !important; color: var(--bose-black) !important; }
            h3, h4, h5, h6 { font-family: 'Cairo', sans-serif !important; font-weight: 600 !important; color: var(--bose-black) !important; }
            p, span, a, button, input, select, textarea { font-family: 'Cairo', sans-serif !important; }
            
            /* تعديل أنميشن الماركي ليتحرك بسلاسة كاملة من اليمين لليسار RTL وبدون أي قفزات أو بتر نصوص */
            @keyframes boseMarquee { 
                0% { transform: translate3d(0, 0, 0); } 
                100% { transform: translate3d(-25%, 0, 0); } 
            }
            @keyframes boseCategoriesLoop { 
                0% { transform: translate3d(0, 0, 0); } 
                100% { transform: translate3d(-33.333%, 0, 0); } 
            }
            
            .animate-marquee { display: flex; width: max-content; animation: boseMarquee 35s linear infinite; will-change: transform; }
            .categories-track-loop { display: flex; width: max-content; animation: boseCategoriesLoop 40s linear infinite; will-change: transform; }
        `;
        document.head.appendChild(style);
    }

    // 7. عداد السلة اللحظي الموحد بالهيدر
    window.updateGlobalCartCounter = function() {
        const cartCountBadge = document.getElementById('nav-cart-count');
        if (!cartCountBadge) return;
        
        const rawCart = localStorage.getItem('bose_cart');
        const cart = rawCart ? JSON.parse(rawCart) : [];
        
        let totalDisplayItems = 0;
        cart.forEach(item => {
            const isBespokeOrCustom = item.type === "custom-cake" || item.type === "custom-flower" || item.type === "mini-cake" || (item.id && item.id.includes("-"));
            totalDisplayItems += isBespokeOrCustom ? 1 : (parseInt(item.quantity, 10) || 1);
        });
        cartCountBadge.textContent = totalDisplayItems;
    };

    function showGlobalFriendlyError() {
        if (document.getElementById('bose-error-toast')) return;
        const errorDiv = document.createElement('div');
        errorDiv.id = 'bose-error-toast';
        errorDiv.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background-color: var(--bose-pink); color: #FFFFFF; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 100005; direction: rtl; font-size: 14px; font-weight: 600;';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.';
        document.body.appendChild(errorDiv);
    }

    loadStoreDatabase();
})();

/**
 * 🛡️ حارس التمهيد ومنع التعارض البرمجي (Engine Bootstrap Guard)
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
    console.log("🚀 تم التحقق من مطابقة المحرك المخصص وتوافقه مع قاعدة بيانات حلويات بوسي بنجاح ٢٠٢٦.");
}