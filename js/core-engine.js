/**
 * core-engine.js - المحرك المركزي العالمي وحارس البيانات والحسابات المالية
 * موقع حلويات بوسي (BoseSweets) - النسخة الاحترافية الشاملة والمطورة V23.0
 * تم تفعيل محرك أزرار الكميات والأسعار اللحظية وربطها هندسياً لتعمل ديناميكياً بدقة
 */

(function() {
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; 

    /**
     * 1. تهيئة واستدعاء قاعدة بيانات حلويات بوسي المستقرة
     */
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
                
                injectEarlyDependencies();
                applyGlobalSEOAndBranding();
                buildAndInjectGlobalComponents();
                window.updateGlobalCartCounter();
                
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
     * 2. دالة مراجعة زيادة الأسعار الرسمية وحظر الثغرات المالية
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
     * 3. دالة هندسية لحساب السعر النهائي للمنتج شامل خيارات التخصيص والأحجام
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
                if (opts.extraToppingPrice) price += parseFloat(opts.extraToppingPrice);
                if (opts.printingPrice) price += parseFloat(opts.printingPrice);
            }
        }

        return window.calculateBosePrice(price, "menu-only");
    };

    /**
     * 4. بناء عنصر السلة القياسي المانع للتداخل والتصادم البرمجي
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
     * 5. الحسبة الهندسية لمحاكاة أسعار التورتة المخصصة ديناميكياً
     */
    window.calculateCustomCakePrice = function(persons, options = {}) {
        const safePersons = parseInt(persons, 10) || 10;
        let price = 580; 
        const minPersons = 4;
        const pricePerPerson = 145; 
        
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

    /**
     * 6. الحسبة الهندسية لمحاكاة أسعار بوكيهات الورد المخصصة مع الإضافات
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
        
        let cashHandlingFee = 0;
        if (safeCashAmount > 0 && safeCashCategoryAmount > 0) {
            const selectedCategory = config.moneyCategories.find(cat => cat.amount === safeCashCategoryAmount);
            if (selectedCategory) {
                const billCount = Math.floor(safeCashAmount / safeCashCategoryAmount);
                cashHandlingFee += billCount * selectedCategory.fee;
            }
        }
        
        servicePrice += cashHandlingFee;
        return window.calculateBosePrice(servicePrice, "menu-only") + safeCashAmount;
    };

    /**
     * 7. التحقق من أرقام الهواتف وتطهيرها بالصيغة المصرية الصارمة
     */
    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") return isOptional;
        const cleaned = window.sanitizeBosePhoneNumber(phone);
        return /^01[0125][0-9]{8}$/.test(cleaned);
    };

    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return "";
        let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        else if (cleaned.startsWith("00201")) cleaned = "0" + cleaned.substring(4);
        else if (cleaned.startsWith("1") && cleaned.length === 10) cleaned = "0" + cleaned;
        return cleaned;
    };

    /**
     * 8. حارس الوقت القياسي والموحد (شرط الـ 24 ساعة للتحضير)
     */
    window.validateBoseDeliverySchedule = function(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        const currentDateTime = new Date(Date.now() + (window.boseServerTimeOffset || 0));
        if (selectedDateTime <= currentDateTime) return false;
        return (selectedDateTime - currentDateTime) / (1000 * 60 * 60) >= 23.95;
    };

    /**
     * 9. تحديث شارة عداد السلة اللحظي بالهيدر
     */
    window.updateGlobalCartCounter = function() {
        const cartCountBadges = document.querySelectorAll('#nav-cart-count');
        if (cartCountBadges.length === 0) return;
        
        const rawCart = localStorage.getItem('bose_cart');
        const cart = rawCart ? JSON.parse(rawCart) : [];
        
        let totalDisplayItems = 0;
        cart.forEach(item => {
            const isBespokeOrCustom = item.type === "custom-cake" || 
                                      item.type === "custom-flower" || 
                                      item.type === "mini-cake" || 
                                      (item.id && item.id.includes("-"));
            totalDisplayItems += isBespokeOrCustom ? 1 : (parseInt(item.quantity, 10) || 1);
        });
        
        cartCountBadges.forEach(badge => badge.textContent = totalDisplayItems);
    };

    /**
     * 10. خطاف تمهيد حارس التمهيد لمنع التعارض البرمجي
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

    function injectEarlyDependencies() {
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            const p1 = document.createElement('link'); p1.rel = 'preconnect'; p1.href = 'https://fonts.googleapis.com';
            const p2 = document.createElement('link'); p2.rel = 'preconnect'; p2.href = 'https://fonts.gstatic.com'; p2.crossOrigin = 'anonymous';
            const font = document.createElement('link'); font.rel = 'stylesheet'; font.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
            document.head.append(p1, p2, font);
        }
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link'); fa.rel = 'stylesheet'; fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(fa);
        }
    }

    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;
        if (document.title !== data.seo.title) {
            document.title = data.seo.title;
        }
    }

    /**
     * 11. بناء وضخ المكونات الهندسية الفاخرة ديناميكياً لجميع صفحات الموقع
     */
    function buildAndInjectGlobalComponents() {
        const data = window.BoseStoreData;
        if (!data) return;

        const headerInjector = document.getElementById('bose-header-injector');
        if (headerInjector) {
            const marqueeMessages = data.navigation.topBarMessages;
            let marqueeItemsHtml = '';
            marqueeMessages.forEach(msg => { marqueeItemsHtml += `<span class="bose-marquee-item">${msg}</span>`; });

            headerInjector.innerHTML = `
                <div id="top-bar-marquee" class="bose-top-bar-marquee-container" aria-label="شريط الإعلانات التسويقية">
                    <div class="bose-top-bar-marquee-track">
                        ${marqueeItemsHtml} ${marqueeItemsHtml}
                    </div>
                </div>

                <header class="bose-sticky-header">
                    <div class="header-right-side">
                        <button id="mobile-menu-toggle" class="bose-nav-btn" aria-label="فتح القائمة الجانبية">
                            <i class="fa-solid fa-bars-staggered"></i>
                        </button>
                        <a href="index.html" class="brand-logo-container">
                            <img id="bose-store-logo" src="${data.store.logo}" alt="لوجو حلويات بوسي الفاخرة" class="brand-logo-img" />
                            <span class="brand-name-display">حلويات بوسي</span>
                        </a>
                    </div>
                    <div class="header-left-side">
                        <button id="nav-search-btn" class="bose-nav-btn" aria-label="البحث عن صنف أو نكهة">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <a href="cart.html" class="nav-cart-icon-wrapper" aria-label="عرض سلة المشتريات">
                            <i class="fa-solid fa-bag-shopping bose-nav-btn" style="padding:0;"></i>
                            <span id="nav-cart-count" class="nav-cart-count-badge">0</span>
                        </a>
                    </div>
                </header>

                <div id="bose-sidebar-drawer" class="bose-sidebar-drawer" aria-hidden="true">
                    <div class="sidebar-header">
                        <div class="sidebar-logo-container">
                            <img src="${data.store.logo}" alt="لوجو بوسي" class="sidebar-logo" />
                            <span class="sidebar-brand-name">قائمة الأقسام الفاخرة</span>
                        </div>
                        <button id="sidebar-close-btn" class="sidebar-close-btn" aria-label="إغلاق القائمة">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <ul class="sidebar-links-list">
                        <li class="sidebar-link-item"><a href="index.html"><i class="fa-solid fa-house"></i> الرئيسية</a></li>
                        <li class="sidebar-link-item"><a href="menu.html"><i class="fa-solid fa-utensils"></i> المنيو الشامل</a></li>
                        <li class="sidebar-link-item"><a href="cake-builder.html"><i class="fa-solid fa-cake-candles"></i> محاكي التورت التفاعلي</a></li>
                        <li class="sidebar-link-item"><a href="flower-builder.html"><i class="fa-solid fa-seedling"></i> محاكي الورد الخاص</a></li>
                        <li class="sidebar-link-item"><a href="cart.html"><i class="fa-solid fa-basket-shopping"></i> سلة التسوق</a></li>
                        <li class="sidebar-link-item"><a href="about.html"><i class="fa-solid fa-heart-pulse"></i> مَنْ نحن (قصتنا أصيلة)</a></li>
                        <li class="sidebar-link-item"><a href="contact.html"><i class="fa-solid fa-phone-flip"></i> تواصل معنا</a></li>
                    </ul>
                </div>
                <div id="bose-sidebar-overlay" class="bose-sidebar-overlay"></div>

                <div id="bose-search-modal" class="bose-search-modal" aria-hidden="true">
                    <div class="search-modal-header">
                        <button id="search-modal-close" class="bose-nav-btn" style="font-size: 26px;" aria-label="إغلاق البحث">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="search-input-wrapper">
                        <input type="text" id="bose-search-field" class="bose-search-field" placeholder="ابحث عن النكهة أو الصنف (لوتس، بيستاشيو...)" aria-label="حقل البحث" autocomplete="off" />
                        <i class="fa-solid fa-magnifying-glass search-field-icon"></i>
                    </div>
                    <div id="search-results-container" class="search-results-container"></div>
                </div>
            `;
            setupHeaderAndSidebarEvents();
        }

        const footerInjector = document.getElementById('bose-footer-injector');
        if (footerInjector) {
            footerInjector.innerHTML = `
                <footer class="bose-footer" role="contentinfo">
                    <div class="footer-grid-layout">
                        <div class="footer-column-block">
                            <div class="footer-brand-meta">
                                <img src="${data.store.logo}" alt="حلويات بوسي الفاخرة" class="footer-logo" />
                                <span class="footer-title">حلويات بوسي</span>
                            </div>
                            <p id="footer-about-text" class="footer-about-paragraph">${data.footer.about}</p>
                            <div id="footer-social-links" class="footer-social-wrapper">
                                <a href="${data.social.facebook}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-facebook-f"></i></a>
                                <a href="${data.social.instagram}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-instagram"></i></a>
                                <a href="${data.social.tiktok}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-tiktok"></i></a>
                                <a href="https://wa.me/${data.social.whatsapp}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-whatsapp"></i></a>
                            </div>
                        </div>
                        <div class="footer-column-block">
                            <h3 class="footer-heading-title">روابط سريعة</h3>
                            <ul class="footer-links-ul">
                                <li><a href="index.html">الرئيسية</a></li>
                                <li><a href="menu.html">المنيو الشامل</a></li>
                                <li><a href="cake-builder.html">محاكي التورت</a></li>
                                <li><a href="flower-builder.html">محاكي الورد</a></li>
                                <li><a href="cart.html">سلة التسوق</a></li>
                            </ul>
                        </div>
                        <div class="footer-column-block">
                            <h3 class="footer-heading-title">وثائق وسياسات</h3>
                            <ul class="footer-links-ul">
                                <li><a href="policies/privacy-policy.html">سياسة الخصوصية</a></li>
                                <li><a href="policies/refund-policy.html">سياسة الاسترجاع المالي</a></li>
                                <li><a href="policies/shipping-policy.html">سياسة الشحن والتوصيل</a></li>
                                <li><a href="policies/terms.html">الشروط والأحكام</a></li>
                                <li class="footer-contact-item" style="margin-top: 15px;">
                                    <i class="fa-solid fa-location-dot"></i>
                                    <span>${data.store.pickup.address}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <p class="footer-copyright-block">جميع الحقوق محفوظة &copy; <span id="footer-year-display">2026</span> لعلامة حلويات بوسي الفاخرة.</p>
                </footer>
            `;
        }
    }

    function setupHeaderAndSidebarEvents() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const closeBtn = document.getElementById('sidebar-close-btn');
        const sidebar = document.getElementById('bose-sidebar-drawer');
        const overlay = document.getElementById('bose-sidebar-overlay');
        
        const searchBtn = document.getElementById('nav-search-btn');
        const searchModal = document.getElementById('bose-search-modal');
        const searchClose = document.getElementById('search-modal-close');
        const searchField = document.getElementById('bose-search-field');
        const resultsContainer = document.getElementById('search-results-container');

        if (toggleBtn && sidebar && overlay) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.add('open');
                overlay.classList.add('show');
            });
        }
        
        const closeSidebar = () => {
            if (sidebar && overlay) {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
            }
        };

        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);

        if (searchBtn && searchModal) {
            searchBtn.addEventListener('click', () => {
                searchModal.classList.add('active');
                setTimeout(() => searchField?.focus(), 200);
            });
        }

        if (searchClose) {
            searchClose.addEventListener('click', () => {
                searchModal.classList.remove('active');
            });
        }

        if (searchField && resultsContainer) {
            searchField.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                if (!query) { resultsContainer.innerHTML = ''; return; }

                const allProducts = window.BoseStoreData?.products || [];
                const filtered = allProducts.filter(p => p.title?.toLowerCase().includes(query) || p.flavorName?.toLowerCase().includes(query));

                let html = '';
                filtered.forEach(p => {
                    let targetUrl = (p.id === 'toort-custom-master' || p.slug === 'toort-custom-master') ? 'cake-builder.html' : 
                                    ((p.id === 'flowers-master' || p.slug === 'flowers-master') ? 'flower-builder.html' : `product.html?slug=${p.slug}`);
                    targetUrl += `
                        <a href="${targetUrl}" class="search-result-card-item">
                            <img src="${p.images[0]}" class="search-result-img" />
                            <div class="search-result-info">
                                <div class="search-result-name">${p.title} - ${p.flavorName}</div>
                            </div>
                            <div class="search-result-price-view">${Math.round(p.price)} جنيه</div>
                        </a>
                    `;
                });
                resultsContainer.innerHTML = html || '<div class="search-no-results-msg">لم نجد أصنافاً تطابق بحثك.</div>';
            });
        }
    }

    /**
     * 12. محرك تهيئة قسم عقد من الإتقان بالحركة التلقائية اللانهائية الخالصة بالـ CSS
     * التحسين الرياضي الفاصل لمنع الفراغات والقطع: تكرار كتل المصفوفة 6 مرات متتالية
     * ليغطي كامل العرض الافتراضي والحسابي الممتد للـ Track بشكل مثالي قبل إعادة الدورة البصرية
     */
    window.initializeExcellenceSectionSlider = function() {
        const track = document.getElementById('excellence-images-track');
        if (!track || !window.BoseStoreData) return;
        
        const config = window.BoseStoreData.homepage?.excellence;
        if (!config || !Array.isArray(config.images)) return;
        
        let imagesHtml = '';
        config.images.forEach(imgUrl => {
            imagesHtml += `
                <div class="perfection-slide-node">
                    <img src="${imgUrl}" alt="روائع وإتقان حلويات بوسي" loading="lazy" />
                </div>
            `;
        });
        
        // زراعة الكتل مكررة 6 مرات متتالية لملء شاشات الموبايل والكمبيوتر بشكل لانهائي مطلق
        track.innerHTML = imagesHtml + imagesHtml + imagesHtml + imagesHtml + imagesHtml + imagesHtml; 
        track.style.display = "flex";
        track.style.width = "max-content";
        
        // ربط مباشر مع محرك التزامن السلس بالـ CSS
        track.style.animation = "bosePerfectionLoop 30s linear infinite";
    };

    /**
     * 13. دالة ربط وتهيئة السلايدرات التفاعلية بالنقاط (Dots) والسحب الجانبي (Swipe) للأقسام الأخرى
     */
    window.setupBoseInteractiveSlider = function(trackId, dotsContainerId) {
        const track = document.getElementById(trackId);
        const dotsContainer = document.getElementById(dotsContainerId);
        if (!track) return;

        let items = Array.from(track.children);
        if (items.length === 0) return;

        if (dotsContainer) {
            dotsContainer.innerHTML = items.map((_, index) => `
                <span class="bose-dot-node ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
            `).join('');
        }

        const dots = dotsContainer ? Array.from(dotsContainer.children) : [];

        track.addEventListener('scroll', () => {
            const scrollLeft = Math.abs(track.scrollLeft);
            const itemWidth = items[0].offsetWidth || 300; 
            const activeIndex = Math.round(scrollLeft / itemWidth);
            
            dots.forEach((dot, idx) => {
                if (idx === activeIndex) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        });

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const targetIndex = parseInt(e.target.getAttribute('data-index'), 10);
                const itemWidth = items[0].offsetWidth || 300;
                track.scrollTo({ left: (targetIndex * itemWidth), behavior: 'smooth' });
            });
        });
    };

    /**
     * 14. محرك مالي وهندسي تفاعلي مخصص لإدارة عدادات الكروت والأسعار اللحظية بدقة
     */
    window.attachBoseCardQuantityEngine = function(containerElement, baseUnitPrice) {
        if (!containerElement) return;
        const plusBtn = containerElement.querySelector('.btn-qty-plus');
        const minusBtn = containerElement.querySelector('.btn-qty-minus');
        const qtyInput = containerElement.querySelector('.input-qty-value');
        const priceDisplay = containerElement.querySelector('.product-card-price');
        
        if (!plusBtn || !minusBtn || !qtyInput || !priceDisplay) return;
        
        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let currentVal = parseInt(qtyInput.value, 10) || 1;
            currentVal++;
            qtyInput.value = currentVal;
            let finalCost = currentVal * baseUnitPrice;
            priceDisplay.textContent = `${Math.round(finalCost)} جنيه`;
        });
        
        minusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let currentVal = parseInt(qtyInput.value, 10) || 1;
            if (currentVal > 1) {
                currentVal--;
                qtyInput.value = currentVal;
                let finalCost = currentVal * baseUnitPrice;
                priceDisplay.textContent = `${Math.round(finalCost)} جنيه`;
            }
        });
    };

    function showGlobalFriendlyError() {
        const err = document.createElement('div');
        err.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background-color:#FF91A4; color:#FFFFFF; padding:12px 24px; border-radius:8px; z-index:99999; font-weight:700;';
        err.textContent = 'عذراً، واجهنا صعوبة في جلب البيانات. يرجى تحديث الصفحة.';
        document.body.appendChild(err);
    }

    loadStoreDatabase();
})();

/**
 * حارس التمهيد والمزامنة الكاملة للأوصاف الفاخرة والعناوين من الـ JSON مباشرة
 */
document.addEventListener("DOMContentLoaded", () => {
    window.onBoseDatabaseReady && window.onBoseDatabaseReady((data) => {
        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        if (leftCol && rightCol) {
            leftCol.innerHTML = data.homepage.waterfall.leftColumnImages.map(img => `<img src="${img}" alt="شلال بوسي" />`).join('');
            rightCol.innerHTML = data.homepage.waterfall.rightColumnImages.map(img => `<img src="${img}" alt="شلال بوسي" />`).join('');
        }

        if(document.getElementById('hero-description')) document.getElementById('hero-description').textContent = data.homepage.hero.description;
        
        if(document.getElementById('excellence-title')) document.getElementById('excellence-title').textContent = data.homepage.excellence.title;
        if(document.getElementById('excellence-description')) document.getElementById('excellence-description').textContent = data.homepage.excellence.description;
        
        if(document.getElementById('most-selling-title')) document.getElementById('most-selling-title').textContent = "الأكثر مبيعاً";
        if(document.getElementById('most-selling-description')) document.getElementById('most-selling-description').textContent = "تشكيلة مختارة بعناية فائقة تبرز فخامة الاختيارات المعتمدة والأكثر طلباً وشهرة من عملائنا.";

        if(document.getElementById('new-arrivals-title')) document.getElementById('new-arrivals-title').textContent = "وصل حديثاً";
        if(document.getElementById('new-arrivals-description')) document.getElementById('new-arrivals-description').textContent = "استكشف توليفاتنا الجديدة والمبتكرة الحصرية التي تحمل بصمة الجودة وعراقة الإتقان.";

        if(document.getElementById('our-products-title')) document.getElementById('our-products-title').textContent = "منتجاتنا";
        if(document.getElementById('our-products-description')) document.getElementById('our-products-description').textContent = "تشكيلة غنية ومتنوعة من الحلويات الطازجة يومياً، ركزنا فيها على المكونات الطبيعية 100% لأعلى قيمة جودة.";

        if(document.getElementById('categories-section-title')) document.getElementById('categories-section-title').textContent = "تسوق حسب الفئة";
        if(document.getElementById('categories-section-subtitle')) document.getElementById('categories-section-subtitle').textContent = "انتقل مباشرة وبكل سهولة إلى الصنف المفضل لديك عبر فئاتنا الشاملة المعتمدة.";

        if(document.getElementById('cake-preview-img')) document.getElementById('cake-preview-img').src = data.homepage.cakePreview.image;
        if(document.getElementById('cake-preview-title')) document.getElementById('cake-preview-title').textContent = data.homepage.cakePreview.title;
        if(document.getElementById('cake-preview-desc')) document.getElementById('cake-preview-desc').textContent = data.homepage.cakePreview.description;
        if(document.getElementById('cake-preview-cta')) document.getElementById('cake-preview-cta').textContent = data.homepage.cakePreview.cta;

        if(document.getElementById('flower-preview-img')) document.getElementById('flower-preview-img').src = data.homepage.flowerPreview.image;
        if(document.getElementById('flower-preview-title')) document.getElementById('flower-preview-title').textContent = data.homepage.flowerPreview.title;
        if(document.getElementById('flower-preview-desc')) document.getElementById('flower-preview-desc').textContent = data.homepage.flowerPreview.description;
        if(document.getElementById('flower-preview-cta')) document.getElementById('flower-preview-cta').textContent = data.homepage.flowerPreview.cta;

        function buildProductCardHTML(p) {
            let isCake = (p.id === 'toort-custom-master' || p.slug === 'toort-custom-master');
            let isFlower = (p.id === 'flowers-master' || p.slug === 'flowers-master');
            let actionClickUrl = isCake ? 'cake-builder.html' : (isFlower ? 'flower-builder.html' : `product.html?slug=${p.slug}`);

            return `
                <div class="product-card-unified" data-product-id="${p.id}">
                    <img src="${p.images[0]}" class="product-card-img" alt="${p.title}" loading="lazy" />
                    <h3 class="product-card-title">${p.title}</h3>
                    <span class="product-card-flavor-name">${p.flavorName}</span>
                    <p class="product-card-desc">${p.flavorDesc}</p>
                    <div class="bose-quantity-counter">
                        <button class="btn-qty-plus">+</button>
                        <input type="text" class="input-qty-value" value="1" readonly />
                        <button class="btn-qty-minus">-</button>
                    </div>
                    <div class="product-card-price">${Math.round(p.price)} جنيه</div>
                    <button class="btn-add-to-cart" onclick="location.href='${actionClickUrl}'">اضافة للسلة</button>
                </div>
            `;
        }

        const mostSellingGrid = document.getElementById('most-selling-grid');
        if (mostSellingGrid) {
            mostSellingGrid.innerHTML = '';
            data.products.filter(p => data.homepage.mostSelling.includes(p.id)).forEach(p => { 
                const wrapper = document.createElement('div');
                wrapper.innerHTML = buildProductCardHTML(p);
                const card = wrapper.firstElementChild;
                mostSellingGrid.appendChild(card);
                window.attachBoseCardQuantityEngine(card, p.price);
            });
            window.setupBoseInteractiveSlider('most-selling-grid', 'most-selling-dots');
        }

        const newArrivalsGrid = document.getElementById('new-arrivals-grid');
        if (newArrivalsGrid) {
            newArrivalsGrid.innerHTML = '';
            data.products.filter(p => data.homepage.newArrivals.includes(p.id)).forEach(p => { 
                const wrapper = document.createElement('div');
                wrapper.innerHTML = buildProductCardHTML(p);
                const card = wrapper.firstElementChild;
                newArrivalsGrid.appendChild(card);
                window.attachBoseCardQuantityEngine(card, p.price);
            });
            window.setupBoseInteractiveSlider('new-arrivals-grid', 'new-arrivals-dots');
        }

        const ourProductsGrid = document.getElementById('our-products-grid');
        if (ourProductsGrid) {
            const allOurProducts = data.products.filter(p => data.homepage.ourProducts.includes(p.id));
            let initialProducts = allOurProducts.slice(0, 4);
            
            ourProductsGrid.innerHTML = '';
            initialProducts.forEach(p => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = buildProductCardHTML(p);
                const card = wrapper.firstElementChild;
                ourProductsGrid.appendChild(card);
                window.attachBoseCardQuantityEngine(card, p.price);
            });

            const showMoreBtn = document.getElementById('our-products-show-more');
            if (showMoreBtn) {
                showMoreBtn.textContent = "استعرض المزيد";
                if (allOurProducts.length > 4) {
                    showMoreBtn.addEventListener('click', () => {
                        let remainingProducts = allOurProducts.slice(4);
                        remainingProducts.forEach(p => {
                            const wrapper = document.createElement('div');
                            wrapper.innerHTML = buildProductCardHTML(p);
                            const card = wrapper.firstElementChild;
                            ourProductsGrid.appendChild(card);
                            window.attachBoseCardQuantityEngine(card, p.price);
                        });
                        showMoreBtn.style.display = 'none';
                    });
                } else {
                    showMoreBtn.style.display = 'none';
                }
            }
        }

        const categoriesTrack = document.getElementById('categories-track');
        if (categoriesTrack) {
            categoriesTrack.className = "categories-track-scrollable"; 
            categoriesTrack.innerHTML = data.homepage.categoriesSlider.map(cat => `
                <div class="bose-category-slider-card" onclick="location.href='menu.html'">
                    <img src="${cat.image}" class="category-img" alt="${cat.title}" loading="lazy" />
                    <div class="category-title-display">${cat.title}</div>
                </div>
            `).join('');
            window.setupBoseInteractiveSlider('categories-track', 'categories-dots');
        }

        if (document.getElementById('excellence-images-track')) {
            window.initializeExcellenceSectionSlider();
        }
    });
});