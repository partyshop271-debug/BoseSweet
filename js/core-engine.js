/**
 * 📑 الدليل الهندسي للمواصفات القياسية الفاخرة - النسخة المكتملة والمطورة V3
 * المحرك المركزي العالمي لبناء وضخ الواجهات وعمليات الفحص المالي (js/core-engine.js)
 * براند: حلويات بوسي (BoseSweets) - يمنع الاختصار أو الحذف أو التبسيط نهائياً.
 */
(function() {
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; 

    // تهيئة واستدعاء قاعدة بيانات حلويات بوسي المستقرة والوحيدة للموقع
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
                }
                
                window.BoseStoreData = await response.json();
                
                // 1. إدارة وضخ العناصر العالمية المشتركة في كل الصفحات
                injectEarlyDependencies();
                applyGlobalStyles(window.BoseStoreData.store.theme);
                renderUniversalHeader();
                renderUniversalSidebar();
                renderUniversalFooter();
                
                // 2. تحديثات الحالة والـ SEO
                applyGlobalSEOAndBranding();
                window.updateGlobalCartCounter();
                
                // 3. الفحص الجغرافي: إذا كنا في الصفحة الرئيسية، يتم تفعيل محرك ضخ الأقسام تلقائياً
                if (document.getElementById('hero-section') || document.querySelector('.waterfall-container') || !!document.getElementById('most-selling-grid')) {
                    renderMainPageSections();
                }
                
                document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
                return;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    console.error("❌ خطأ حرج في نظام حلويات بوسي الموحد:", error);
                    showGlobalFriendlyError();
                } else {
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; 
                }
            }
        }
    }

    /* ==========================================================================
       👑 قسم ضخ وبناء الواجهات الموحدة الثابتة (Universal Layout Injection)
       ========================================================================== */

    function renderUniversalHeader() {
        // البحث عن وسم الـ header المشترك في خريطة الـ DOM
        let headerEl = document.querySelector('header.bose-navbar');
        if (!headerEl) {
            headerEl = document.createElement('header');
            headerEl.className = 'bose-navbar';
            document.body.insertBefore(headerEl, document.body.firstChild);
        }
        
        headerEl.innerHTML = `
            <div class="navbar-mobile-wrapper">
                <button id="mobile-menu-toggle" class="nav-icon-btn" aria-label="فتح قائمة التصفح">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="brand-logo-container">
                    <a href="index.html">
                        <img id="bose-store-logo" src="${window.BoseStoreData.store.logo}" alt="شعار حلويات بوسي">
                    </a>
                </div>
                <span class="brand-name-display">حلويات بوسي</span>
                <nav id="bose-nav-menu">
                    <ul class="nav-list">
                        <li><a href="index.html">الرئيسية</a></li>
                        <li><a href="menu.html">المنيو الشامل</a></li>
                        <li><a href="cake-builder.html">محاكي التورت</a></li>
                        <li><a href="flower-builder.html">محاكي الورد</a></li>
                    </ul>
                </nav>
                <div class="nav-actions">
                    <button id="nav-search-btn" class="nav-icon-btn" aria-label="البحث في المنتجات">
                        <i class="fas fa-search"></i>
                    </button>
                    <a href="cart.html" class="nav-cart-icon-wrapper" aria-label="عرض سلة التسوق">
                        <i class="fas fa-shopping-bag"></i>
                        <span id="nav-cart-count">0</span>
                    </a>
                </div>
            </div>
        `;
    }

    function renderUniversalSidebar() {
        if (document.getElementById('bose-side-menu')) return;
        
        const sidebar = document.createElement('div');
        sidebar.id = 'bose-side-menu';
        sidebar.className = 'bose-sidebar-wrapper';
        sidebar.innerHTML = `
            <div class="sidebar-overlay" id="sidebar-close-overlay"></div>
            <div class="sidebar-content-panel">
                <div class="sidebar-header-block">
                    <span class="sidebar-title-text">تصفح أقسامنا</span>
                    <button id="sidebar-close-btn" class="sidebar-close-icon"><i class="fas fa-times"></i></button>
                </div>
                <div class="sidebar-logo-hero">
                    <img src="${window.BoseStoreData.store.logo}" alt="حلويات بوسي">
                    <span class="brand-name-display">حلويات بوسي</span>
                </div>
                <ul class="sidebar-links-list">
                    <li><a href="index.html"><i class="fas fa-home"></i> الرئيسية</a></li>
                    <li><a href="menu.html"><i class="fas fa-utensils"></i> المنيو الشامل</a></li>
                    <li><a href="cake-builder.html"><i class="fas fa-birthday-cake"></i> محاكي التورت التفاعلي</a></li>
                    <li><a href="flower-builder.html"><i class="fas fa-seedling"></i> محاكي الورد التفاعلي</a></li>
                    <li><a href="cart.html"><i class="fas fa-shopping-basket"></i> سلة المشتريات</a></li>
                    <li><a href="checkout.html"><i class="fas fa-credit-card"></i> إتمام الطلب الشامل</a></li>
                </ul>
            </div>
        `;
        document.body.appendChild(sidebar);

        // ربط أحداث القائمة المتطورة الذكية فوراً
        setTimeout(() => {
            const toggleBtn = document.getElementById('mobile-menu-toggle');
            const closeBtn = document.getElementById('sidebar-close-btn');
            const overlay = document.getElementById('sidebar-close-overlay');
            const menuPanel = document.getElementById('bose-side-menu');

            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => menuPanel.classList.add('sidebar-active'));
            }
            if (closeBtn) {
                closeBtn.addEventListener('click', () => menuPanel.classList.remove('sidebar-active'));
            }
            if (overlay) {
                overlay.addEventListener('click', () => menuPanel.classList.remove('sidebar-active'));
            }
        }, 100);
    }

    function renderUniversalFooter() {
        let footerEl = document.querySelector('footer.bose-footer');
        if (!footerEl) {
            footerEl = document.createElement('footer');
            footerEl.className = 'bose-footer';
            document.body.appendChild(footerEl);
        }
        
        footerEl.innerHTML = `
            <div class="footer-logo-container">
                <a href="index.html">
                    <img id="bose-store-logo" src="${window.BoseStoreData.store.logo}" alt="شعار حلويات بوسي">
                </a>
            </div>
            <span class="brand-name-display footer-brand-name">حلويات بوسي</span>
            <div class="footer-about-block">
                <p id="footer-about-text">${window.BoseStoreData.footer.about}</p>
            </div>
            <div id="footer-social-links">
                <a href="${window.BoseStoreData.social.facebook}" class="social-link-facebook" target="_blank" aria-label="فيسبوك حلويات بوسي"><i class="fab fa-facebook-f"></i></a>
                <a href="${window.BoseStoreData.social.instagram}" class="social-link-instagram" target="_blank" aria-label="انستجرام حلويات بوسي"><i class="fab fa-instagram"></i></a>
                <a href="${window.BoseStoreData.social.tiktok}" class="social-link-tiktok" target="_blank" aria-label="تيك توك حلويات بوسي"><i class="fab fa-tiktok"></i></a>
                <a href="https://wa.me/${window.BoseStoreData.social.whatsapp}" class="social-link-whatsapp" target="_blank" aria-label="واتساب حلويات بوسي"><i class="fab fa-whatsapp"></i></a>
            </div>
            <div class="footer-policies-container">
                <ul class="footer-policies-list">
                    <li><a href="privacy-policy.html">سياسة الخصوصية</a></li>
                    <li><a href="refund-policy.html">سياسة الاسترجاع</a></li>
                    <li><a href="shipping-policy.html">سياسة الطلبات</a></li>
                    <li><a href="terms.html">الشروط والأحكام</a></li>
                </ul>
            </div>
            <div class="footer-copyright-block">
                <p>© <span id="copyright-year">2026</span> جميع الحقوق محفوظة لعلامة حلويات بوسي التجارية الفاخرة</p>
            </div>
        `;
    }

    /* ==========================================================================
       🏪 محرك الصفحة الرئيسية والأقسام العشرة (Main Page Layout Engine)
       ========================================================================== */

    function renderMainPageSections() {
        const data = window.BoseStoreData;

        // شريط علوي متحرك (#top-bar-marquee)
        const topBar = document.getElementById('top-bar-marquee');
        if (topBar && data.navigation.topBarMessages) {
            let messagesHTML = data.navigation.topBarMessages.map(msg => `<span class="marquee-item">${msg}</span>`).join('');
            topBar.innerHTML = `<div class="animate-marquee">${messagesHTML}${messagesHTML}</div>`;
        }

        // قسم شلال المنتجات البصري الأنيق (#waterfall-section)
        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        if (leftCol && rightCol && data.homepage.waterfall) {
            leftCol.innerHTML = `<div class="waterfall-up">${data.homepage.waterfall.leftColumnImages.map(img => `<img src="${img}" alt="شلال بوسي الفاخر">`).join('')}${data.homepage.waterfall.leftColumnImages.map(img => `<img src="${img}" alt="شلال بوسي الفاخر">`).join('')}</div>`;
            rightCol.innerHTML = `<div class="waterfall-down">${data.homepage.waterfall.rightColumnImages.map(img => `<img src="${img}" alt="شلال بوسي الفاخر">`).join('')}${data.homepage.waterfall.rightColumnImages.map(img => `<img src="${img}" alt="شلال بوسي الفاخر">`).join('')}</div>`;
        }

        // قسم عقد من الإتقان (#excellence-section) - السلايدر الأفقي المتصل
        const excellenceTrack = document.getElementById('excellence-images-track');
        if (excellenceTrack && data.homepage.excellence) {
            let trackHTML = data.homepage.excellence.images.map(img => `<a href="menu.html" class="excellence-link-item"><img src="${img}" alt="إتقان حلويات بوسي"></a>`).join('');
            excellenceTrack.innerHTML = `${trackHTML}${trackHTML}`;
        }

        // الأقسام الديناميكية وشبكات المنتجات (الأكثر مبيعاً، وصل حديثاً، منتجاتنا)
        injectProductGrid('most-selling-grid', data.homepage.mostSelling);
        injectProductGrid('new-arrivals-grid', data.homepage.newArrivals);
        injectProductsOurSection();

        // قسم الفخر والاعتزاز (#pride-section) - العدادات التصاعدية
        const statsContainer = document.querySelector('.stats-container');
        if (statsContainer && data.homepage.pride.stats) {
            const stats = data.homepage.pride.stats;
            statsContainer.innerHTML = Object.keys(stats).map(key => `
                <div class="stat-card">
                    <span class="stat-number" data-target="${stats[key].value}">0</span><span class="stat-suffix">${stats[key].suffix}</span>
                    <h3 class="stat-label">${stats[key].label}</h3>
                </div>
            `).join('');
            triggerCounterAnimations();
        }

        // قسم تسوق حسب الفئة (#categories-slider-section) - كروت الفئات الأكبر بـ 30%
        const categoriesTrack = document.getElementById('categories-track');
        if (categoriesTrack && data.homepage.categoriesSlider) {
            let catHTML = data.homepage.categoriesSlider.map(cat => `
                <div class="category-slider-card" onclick="window.location.href='category.html?id=${cat.id}'">
                    <img src="${cat.image}" alt="${cat.title}">
                    <span class="category-card-title">${cat.title}</span>
                </div>
            `).join('');
            categoriesTrack.innerHTML = `<div class="categories-track-loop">${catHTML}${catHTML}</div>`;
        }
    }

    /**
     * دالة حقن شبكات المنتجات القياسية لالتزام الهيكل الموحد للكارت بالمسطرة
     */
    function injectProductGrid(targetId, slugList) {
        const gridContainer = document.getElementById(targetId);
        if (!gridContainer || !slugList) return;

        const filteredProducts = window.BoseStoreData.products.filter(p => slugList.includes(p.slug));
        gridContainer.innerHTML = filteredProducts.map(p => createStrictProductCardHTML(p)).join('');
        bindCardEvents(gridContainer);
    }

    /**
     * معالجة خاصة وفصل هندسي لقسم منتجاتنا (Section 06) لعرض 4 كروت أولاً ثم ضخ الباقي
     */
    function injectProductsOurSection() {
        const gridContainer = document.getElementById('our-products-grid');
        if (!gridContainer) return;

        const allSlugs = window.BoseStoreData.homepage.ourProducts;
        const allProducts = window.BoseStoreData.products.filter(p => allSlugs.includes(p.slug));
        
        // عرض أول 4 كروت فقط لضمان التنفس البصري
        const initialProducts = allProducts.slice(0, 4);
        gridContainer.innerHTML = initialProducts.map(p => createStrictProductCardHTML(p)).join('');
        bindCardEvents(gridContainer);

        const showMoreBtn = document.getElementById('our-products-show-more');
        if (showMoreBtn) {
            showMoreBtn.addEventListener('click', () => {
                const remainingProducts = allProducts.slice(4);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = remainingProducts.map(p => createStrictProductCardHTML(p)).join('');
                
                while (tempDiv.firstChild) {
                    gridContainer.appendChild(tempDiv.firstChild);
                }
                bindCardEvents(gridContainer);
                showMoreBtn.style.display = 'none'; // إخفاء الزر بعد اكتمال الشبكة بـ 8 كروت
            });
        }
    }

    /**
     * إنتاج وتوليد وسم كارت المنتج الفاخر الموحد والمطابق للمواصفة القياسية بالمليم
     */
    function createStrictProductCardHTML(product) {
        const displayPrice = window.calculateBosePrice(product.price || product.basePrice, "menu-only");
        const flavorDisplay = product.flavorName ? `<span class="product-card-flavor-name">${product.flavorName}</span>` : '';
        
        return `
            <div class="product-strict-card" data-slug="${product.slug}">
                <img class="product-card-img" src="${product.images[0]}" alt="${product.title}" onclick="window.location.href='product.html?slug=${product.slug}'">
                <h3 class="product-card-title" onclick="window.location.href='product.html?slug=${product.slug}'">${product.title}</h3>
                ${flavorDisplay}
                <p class="product-card-desc">${product.flavorDesc || product.description.substring(0, 85) + '...'}</p>
                
                <div class="product-card-qty-control-block">
                    <button class="btn-qty-minus"><i class="fas fa-minus"></i></button>
                    <input class="input-qty-value" type="number" value="1" min="1" readonly>
                    <button class="btn-qty-plus"><i class="fas fa-plus"></i></button>
                </div>
                
                <div class="product-card-price">${Math.round(displayPrice)} جنيه</div>
                <button class="btn-add-to-cart">اضافة للسلة</button>
            </div>
        `;
    }

    function bindCardEvents(container) {
        container.querySelectorAll('.product-strict-card').forEach(card => {
            const minusBtn = card.querySelector('.btn-qty-minus');
            const plusBtn = card.querySelector('.btn-qty-plus');
            const qtyInput = card.querySelector('.input-qty-value');
            const addToCartBtn = card.querySelector('.btn-add-to-cart');
            const slug = card.getAttribute('data-slug');

            if (minusBtn && plusBtn && qtyInput) {
                minusBtn.onclick = () => {
                    let val = parseInt(qtyInput.value, 10) || 1;
                    if (val > 1) qtyInput.value = val - 1;
                };
                plusBtn.onclick = () => {
                    let val = parseInt(qtyInput.value, 10) || 1;
                    qtyInput.value = val + 1;
                };
            }

            if (addToCartBtn) {
                addToCartBtn.onclick = () => {
                    const product = window.BoseStoreData.products.find(p => p.slug === slug);
                    if (product) {
                        const qty = parseInt(qtyInput.value, 10) || 1;
                        // تمرير كود التهيئة وحماية البيانات المالية للسلة الموحدة
                        const cartItem = window.createCartItem(product, {}, qty);
                        
                        let rawCart = localStorage.getItem('bose_cart');
                        let cart = rawCart ? JSON.parse(rawCart) : [];
                        
                        const existingIdx = cart.findIndex(item => item.id === cartItem.id);
                        if (existingIdx > -1) {
                            cart[existingIdx].quantity += qty;
                        } else {
                            cart.push(cartItem);
                        }
                        
                        localStorage.setItem('bose_cart', JSON.stringify(cart));
                        window.updateGlobalCartCounter();
                        
                        // إشعار تفاعلي راقٍ وقصير ممتثل للهوية
                        addToCartBtn.textContent = "تمت الإضافة";
                        addToCartBtn.style.backgroundColor = "var(--bose-gold)";
                        setTimeout(() => {
                            addToCartBtn.textContent = "اضافة للسلة";
                            addToCartBtn.style.backgroundColor = "var(--bose-pink)";
                        }, 1200);
                    }
                };
            }
        });
    }

    function triggerCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const speed = 200;
            const updateCount = () => {
                const count = +counter.innerText;
                const inc = target / speed;
                if (count < target) {
                    counter.innerText = Math.ceil(count + inc);
                    setTimeout(updateCount, 1);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    }

    /* ==========================================================================
       🎰 العمليات المالية المتقدمة والحسابات الدقيقة (Core Operations)
       ========================================================================== */

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
        let price = product ? (product.price || product.basePrice || 0) : 0;

        if (product && product.prices && opts.size) {
            price = product.prices[opts.size] || price;
        }

        const selectedPrinting = opts.printing || opts.printingType || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (product && product.customizationOptions && product.customizationOptions.printing) {
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
        return window.calculateBosePrice(price, "menu-only");
    };

    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;
        const opts = selectedOptions || {};
        const finalUnitPrice = window.calculateProductFinalPrice(product, opts);
        
        const isCustomizable = product.isMiniCake || product.type === "custom-cake" || product.type === "custom-flower" || (product.customizationOptions && Object.keys(opts).length > 0);
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}` : String(product.slug || product.id);
        
        return {
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
                persons: parseInt(opts.persons, 10) || 0,
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

    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = window.BoseStoreData?.cakeBuilder;
        const safePersons = parseInt(persons, 10) || 10;
        let price = (config ? config.basePrice : 580) || 580;
        const minPersons = (config ? config.persons.minimum : 10) || 10;
        const pricePerPerson = (config ? config.pricePerPerson : 145) || 145;
        
        const extraPersons = Math.max(0, safePersons - minPersons);
        price += extraPersons * pricePerPerson;
        
        const selectedPrinting = options.printingType || options.printing || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (config && config.printingOptions) {
                const printOpt = config.printingOptions.find(opt => opt.id === selectedPrinting);
                if (printOpt) printingFee = printOpt.price;
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
        return window.calculateBosePrice(price, "menu-only");
    };

    window.calculateCustomFlowerPrice = function(flowerType, flowerCount, options = {}) {
        const config = window.BoseStoreData?.flowerBuilder;
        if (!config) return 0;
        
        const safeFlowerCount = parseInt(flowerCount, 10) || config.baseFlowers;
        const safeCashAmount = parseInt(options.moneyAmount, 10) || 0;
        const safeCashCategoryAmount = parseInt(options.moneyCategoryAmount, 10) || 0;
        const safeChocolatePieces = parseInt(options.chocolatePieces, 10) || 0;
        
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
        return cleaned;
    };

    window.validateBoseDeliverySchedule = function(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
        return (selectedDateTime - new Date(synchronizedTime)) / (1000 * 60 * 60) >= 23.95;
    };

    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        document.title = window.BoseStoreData.seo.title;
    }

    function injectEarlyDependencies() {
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            const p1 = document.createElement('link'); p1.rel = 'preconnect'; p1.href = 'https://fonts.googleapis.com';
            const p2 = document.createElement('link'); p2.rel = 'preconnect'; p2.href = 'https://fonts.gstatic.com'; p2.crossOrigin = 'anonymous';
            const f = document.createElement('link'); f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
            document.head.appendChild(p1); document.head.appendChild(p2); document.head.appendChild(f);
        }
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link'); fa.rel = 'stylesheet'; fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(fa);
        }
    }

    function styleSidebarMenu(theme) {
        if (document.getElementById('bose-sidebar-custom-styles')) return;
        const style = document.createElement('style');
        style.id = 'bose-sidebar-custom-styles';
        style.textContent = `
            .bose-sidebar-wrapper { position: fixed; top: 0; right: -100%; width: 100%; height: 100%; z-index: 999999; transition: right 0.4s ease; }
            .bose-sidebar-wrapper.sidebar-active { right: 0; }
            .sidebar-overlay { position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.4); }
            .sidebar-content-panel { position: absolute; right: 0; width: 280px; height: 100%; background: #FFF; box-shadow: -4px 0 24px rgba(0,0,0,0.15); display: flex; flex-direction: column; padding: 20px; }
            .sidebar-header-block { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,145,164,0.2); padding-bottom: 15px; }
            .sidebar-title-text { font-weight: 700; color: #111; font-size: 18px; }
            .sidebar-close-icon { background: none; border: none; font-size: 20px; color: #111; cursor: pointer; }
            .sidebar-logo-hero { text-align: center; padding: 25px 0; }
            .sidebar-logo-hero img { width: 80px; height: 80px; border-radius: 50%; border: 2px solid ${theme.primary}; }
            .sidebar-links-list { list-style: none; padding: 0; margin: 0; }
            .sidebar-links-list li a { display: block; padding: 14px 10px; color: #111; text-decoration: none; font-weight: 600; border-radius: 8px; transition: all 0.2s; }
            .sidebar-links-list li a:hover { background: rgba(255,145,164,0.1); color: ${theme.primary}; }
            .sidebar-links-list li a i { margin-left: 8px; color: ${theme.secondary}; }
        `;
        document.head.appendChild(style);
    }

    function applyGlobalStyles(theme) {
        styleSidebarMenu(theme);
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
            body { font-family: 'Cairo', sans-serif !important; background-color: var(--bose-white) !important; color: var(--bose-black) !important; margin: 0; padding: 0; overflow-x: hidden; }
            h1, h2 { font-family: 'Cairo', sans-serif !important; font-weight: 700 !important; color: var(--bose-black) !important; }
            h3, h4 { font-family: 'Cairo', sans-serif !important; font-weight: 600 !important; color: var(--bose-black) !important; }
        `;
        document.head.appendChild(styleElement);
    }

    loadStoreDatabase();
})();