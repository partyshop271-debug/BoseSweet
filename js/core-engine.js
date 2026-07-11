/**
 * 📑 الدليل الهندسي للمواصفات القياسية الفاخرة - النسخة الكاملة والمطورة V5.5
 * المحرك المركزي العالمي لبناء وضخ الواجهات وعمليات الفحص المالي (js/core-engine.js)
 * براند: حلويات بوسي (BoseSweets) - تم دمج محرك حقن كروت المنتجات والشلال والفئات تلقائياً.
 */
(function() {
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; 

    // تهيئة واستدعاء قاعدة بيانات حلويات بوسي المستقرة والوحيدة للموقع
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return;
        let retries = 5;
        let delay = 1000;
        
        const pathsToTry = [
            'data/site-data-final.json',
            '/data/site-data-final.json',
            './data/site-data-final.json',
            'site-data-final.json'
        ];
        
        while (retries > 0) {
            for (let path of pathsToTry) {
                try {
                    const response = await fetch(path);
                    if (!response.ok) continue;
                    
                    const serverDateHeader = response.headers.get('Date');
                    if (serverDateHeader) {
                        const serverTime = new Date(serverDateHeader).getTime();
                        const clientTime = Date.now();
                        window.boseServerTimeOffset = serverTime - clientTime;
                    }
                    
                    window.BoseStoreData = await response.json();
                    
                    // 1. إدارة وضخ العناصر العالمية المشتركة
                    injectEarlyDependencies();
                    applyGlobalStyles(window.BoseStoreData.store.theme);
                    renderUniversalHeader();
                    renderUniversalSidebar();
                    renderUniversalFooter();
                    
                    // 2. تحديثات الحالة العامة والـ SEO
                    applyGlobalSEOAndBranding();
                    window.updateGlobalCartCounter();

                    // 3. محرك ضخ واجهات الصفحة الرئيسية والمنيو تلقائياً لملء الأوسمة الفارغة
                    renderBoseDynamicContent();
                    
                    // 4. تفعيل حدث مخصص فوراً وضمان ترحيله للمتصفح لمنع التعارض الزمني
                    document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
                    
                    return;
                } catch (error) {
                    continue;
                }
            }
            retries--;
            if (retries === 0) {
                console.error("❌ خطأ حرج في نظام حلويات بوسي الموحد: تعذر جلب البيانات.");
                showGlobalFriendlyError();
            } else {
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; 
            }
        }
    }

    /* ==========================================================================
       👑 قسم ضخ وبناء الواجهات الموحدة الثابتة (Universal Layout Injection)
       ========================================================================== */

    function renderUniversalHeader() {
        let headerEl = document.querySelector('header.bose-navbar');
        if (!headerEl) return; 
        
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
        let sidebarPanel = document.getElementById('sidebar-drawer');
        if (sidebarPanel) sidebarPanel.remove(); 
        
        const sidebar = document.createElement('div');
        sidebar.id = 'sidebar-drawer';
        sidebar.className = 'bose-drawer-menu';
        sidebar.innerHTML = `
            <div class="drawer-overlay" id="sidebar-close-overlay"></div>
            <div class="bose-drawer-panel-content">
                <div class="drawer-premium-header">
                    <h3>تصفح أقسامنا الفاخرة</h3>
                    <p>حلويات بوسي - صنعناها بحب</p>
                    <button id="sidebar-close-btn" class="drawer-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="drawer-links-scrollable">
                    <ul class="drawer-links-list">
                        <li class="drawer-link-item"><a href="index.html"><i class="fas fa-home"></i> الرئيسية</a></li>
                        <li class="drawer-link-item"><a href="menu.html"><i class="fas fa-utensils"></i> المنيو الشامل</a></li>
                        <li class="drawer-link-item"><a href="cake-builder.html"><i class="fas fa-birthday-cake"></i> محاكي التورت التفاعلي</a></li>
                        <li class="drawer-link-item"><a href="flower-builder.html"><i class="fas fa-seedling"></i> محاكي الورد التفاعلي</a></li>
                        <li class="drawer-link-item"><a href="cart.html"><i class="fas fa-shopping-basket"></i> سلة المشتريات</a></li>
                        <li class="drawer-link-item"><a href="checkout.html"><i class="fas fa-credit-card"></i> إتمام الطلب الشامل</a></li>
                    </ul>
                </div>
            </div>
        `;
        document.body.appendChild(sidebar);

        setTimeout(() => {
            const toggleBtn = document.getElementById('mobile-menu-toggle');
            const closeBtn = document.getElementById('sidebar-close-btn');
            const overlay = document.getElementById('sidebar-close-overlay');
            const menuPanel = document.getElementById('sidebar-drawer');

            if (toggleBtn && menuPanel) {
                toggleBtn.onclick = (e) => {
                    e.preventDefault();
                    menuPanel.classList.add('active');
                    if(overlay) overlay.classList.add('active');
                    document.body.classList.add('drawer-active');
                };
            }

            const closeMenu = () => {
                if(menuPanel) menuPanel.classList.remove('active');
                if(overlay) overlay.classList.remove('active');
                document.body.classList.remove('drawer-active');
            };

            if (closeBtn) closeBtn.onclick = closeMenu;
            if (overlay) overlay.onclick = closeMenu;
        }, 150);
    }

    function renderUniversalFooter() {
        let footerEl = document.querySelector('footer.bose-footer');
        if (!footerEl) return;
        
        footerEl.innerHTML = `
            <div class="footer-logo-container">
                <a href="index.html">
                    <img id="bose-footer-logo-node" src="${window.BoseStoreData.store.logo}" alt="شعار حلويات بوسي">
                </a>
            </div>
            <span class="brand-name-display footer-brand-name">حلويات بوسي</span>
            <div class="footer-about-block">
                <p id="footer-about-text">${window.BoseStoreData.footer.about}</p>
            </div>
            <div id="footer-social-links" class="bose-social-links-wrapper">
                <a href="${window.BoseStoreData.social.facebook}" class="social-link-facebook" target="_blank" aria-label="فيسبوك حلويات بوسي"><i class="fab fa-facebook-f"></i></a>
                <a href="${window.BoseStoreData.social.instagram}" class="social-link-instagram" target="_blank" aria-label="انستجرام حلويات بوسي"><i class="fab fa-instagram"></i></a>
                <a href="${window.BoseStoreData.social.tiktok}" class="social-link-tiktok" target="_blank" aria-label="تيك توك حلويات بوسي"><i class="fab fa-tiktok"></i></a>
                <a href="https://wa.me/${window.sanitizeBosePhoneNumber(window.BoseStoreData.social.whatsapp)}" class="social-link-whatsapp" target="_blank" aria-label="واتساب حلويات بوسي"><i class="fab fa-whatsapp"></i></a>
            </div>
            <div class="footer-policies-container" id="bose-footer-policies">
                <ul class="nav-list" style="justify-content: center; gap: 16px; flex-wrap: wrap; list-style: none;">
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
       🎯 محرك بناء وضخ كروت المنتجات والشلال والأقسام تلقائياً لملء الأوسمة الفارغة
       ========================================================================== */
    function renderBoseDynamicContent() {
        const data = window.BoseStoreData;
        if (!data) return;

        // أ. تحديث نصوص التيكر والمرحلة الأولى (Top Bar Marquee)
        const tickerTrack = document.getElementById('top-bar-marquee-track');
        if (tickerTrack && data.navigation.topBarMessages) {
            let messagesHtml = data.navigation.topBarMessages.map(msg => `<span class="ticker-message-item">${msg}</span>`).join('');
            tickerTrack.innerHTML = `<div class="animate-marquee">${messagesHtml}${messagesHtml}</div>`;
        }

        // ب. بناء وضخ أقسام الصفحة الرئيسية (index.html) إن وجدت الأوسمة
        const heroDesc = document.getElementById('hero-description');
        const heroCta = document.getElementById('hero-cta-btn');
        if (heroDesc) heroDesc.textContent = data.homepage.hero.description;
        if (heroCta) heroCta.textContent = data.homepage.hero.cta;

        // ج. بناء قسم الشلال (Waterfall) بدون أي فراغات
        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        if (leftCol && rightCol) {
            leftCol.innerHTML = data.homepage.waterfall.leftColumnImages.map(img => `<img src="${img}" alt="حلويات بوسي فخامة بصري">`).join('');
            rightCol.innerHTML = data.homepage.waterfall.rightColumnImages.map(img => `<img src="${img}" alt="حلويات بوسي فخامة بصري">`).join('');
        }

        // د. بناء السلايدر الأفقي لقسم عقد من الإتقان
        const excellenceTitle = document.getElementById('excellence-title');
        const excellenceDesc = document.getElementById('excellence-description');
        const excellenceTrack = document.getElementById('excellence-images-track');
        if (excellenceTitle) excellenceTitle.textContent = data.homepage.excellence.title;
        if (excellenceDesc) excellenceDesc.textContent = data.homepage.excellence.description;
        if (excellenceTrack && data.homepage.excellence.images) {
            excellenceTrack.innerHTML = data.homepage.excellence.images.map(img => `<a href="menu.html" class="perfection-slide-node"><img src="${img}" alt="إتقان حلويات بوسي"></a>`).join('');
        }

        // هـ. دالة مساعدة لإنشاء كارت المنتج القياسي بالعداد والترتيب البرمجي المعياري
        function createProductCardHTML(product) {
            return `
                <div class="product-card-unified" data-slug="${product.slug}">
                    <img src="${product.images[0]}" class="product-card-img" alt="${product.title}">
                    <h3 class="product-card-title">${product.title}</h3>
                    <span class="product-card-flavor-name">${product.flavorName}</span>
                    <p class="product-card-desc">${product.flavorDesc}</p>
                    <div class="bose-quantity-counter">
                        <button class="btn-qty-minus" onclick="window.modifyBoseQtyCard(this, -1)">-</button>
                        <input type="text" class="input-qty-value" value="1" readonly>
                        <button class="btn-qty-plus" onclick="window.modifyBoseQtyCard(this, 1)">+</button>
                    </div>
                    <div class="product-card-price">${product.price} جنيه</div>
                    <button class="btn-add-to-cart" onclick="window.addBoseCardToCart(this, '${product.slug}')">إضافة للسلة</button>
                </div>
            `;
        }

        // و. ضخ شبكة الأكثر مبيعاً (8 منتجات)
        const mostSellingGrid = document.getElementById('most-selling-grid');
        if (mostSellingGrid) {
            document.getElementById('most-selling-title').textContent = "الأكثر مبيعاً";
            document.getElementById('most-selling-description').textContent = "تشكيلة فاخرة حازت على إعجاب وتقدير عملائنا دائمًا.";
            let items = data.products.filter(p => data.homepage.mostSelling.includes(p.slug));
            mostSellingGrid.innerHTML = items.map(p => createProductCardHTML(p)).join('');
        }

        // ز. ضخ شبكة وصل حديثاً (6 منتجات)
        const newArrivalsGrid = document.getElementById('new-arrivals-grid');
        if (newArrivalsGrid) {
            document.getElementById('new-arrivals-title').textContent = "وصل حديثاً";
            document.getElementById('new-arrivals-description').textContent = "استكشف نكهاتنا المبتكرة والجديدة كلياً لهذا الأسبوع.";
            let items = data.products.filter(p => data.homepage.newArrivals.includes(p.slug));
            newArrivalsGrid.innerHTML = items.map(p => createProductCardHTML(p)).join('');
        }

        // ح. ضخ قسم منتجاتنا (التوزيع الثنائي - 4 كروت أولية)
        const ourProductsGrid = document.getElementById('our-products-grid');
        if (ourProductsGrid) {
            document.getElementById('our-products-title').textContent = "منتجاتنا";
            document.getElementById('our-products-description').textContent = "الجودة والقيمة العالية للمكونات الطازجة يومياً.";
            window.boseOurProductsRendered = false;
            let allItems = data.products.filter(p => data.homepage.ourProducts.includes(p.slug));
            ourProductsGrid.innerHTML = allItems.slice(0, 4).map(p => createProductCardHTML(p)).join('');
            
            const showMoreBtn = document.getElementById('our-products-show-more');
            if (showMoreBtn) {
                showMoreBtn.textContent = "استعرض المزيد";
                showMoreBtn.onclick = function() {
                    ourProductsGrid.innerHTML = allItems.map(p => createProductCardHTML(p)).join('');
                    showMoreBtn.style.display = "none";
                };
            }
        }

        // ط. محاكيات التورت والورد عريضة الحجم والتخصيص الحصري
        if (document.getElementById('cake-preview-title')) {
            document.getElementById('cake-preview-title').textContent = data.homepage.cakePreview.title;
            document.getElementById('cake-preview-desc').textContent = data.homepage.cakePreview.description;
            document.getElementById('cake-preview-img').src = data.homepage.cakePreview.image;
            document.getElementById('cake-preview-cta').textContent = data.homepage.cakePreview.cta;
        }
        if (document.getElementById('flower-preview-title')) {
            document.getElementById('flower-preview-title').textContent = data.homepage.flowerPreview.title;
            document.getElementById('flower-preview-desc').textContent = data.homepage.flowerPreview.description;
            document.getElementById('flower-preview-img').src = data.homepage.flowerPreview.image;
            document.getElementById('flower-preview-cta').textContent = data.homepage.flowerPreview.cta;
        }

        // ي. قسم الفخر والاعتزاز والعدادات الذكية التصاعدية
        if (document.getElementById('pride-main-title')) {
            document.getElementById('pride-main-title').textContent = data.homepage.pride.title;
            document.getElementById('pride-main-text').textContent = data.homepage.pride.text;
            
            // حقن الأرقام الثابتة واللواحق
            document.getElementById('stat-years-value').textContent = data.homepage.pride.stats.years.value + data.homepage.pride.stats.years.suffix;
            document.getElementById('stat-years-label').textContent = data.homepage.pride.stats.years.label;
            
            document.getElementById('stat-customers-value').textContent = data.homepage.pride.stats.customers.value + data.homepage.pride.stats.customers.suffix;
            document.getElementById('stat-customers-label').textContent = data.homepage.pride.stats.customers.label;
            
            document.getElementById('stat-orders-value').textContent = data.homepage.pride.stats.orders.value + data.homepage.pride.stats.orders.suffix;
            document.getElementById('stat-orders-label').textContent = data.homepage.pride.stats.orders.label;
            
            document.getElementById('stat-cakes-value').textContent = data.homepage.pride.stats.cakes.value + data.homepage.pride.stats.cakes.suffix;
            document.getElementById('stat-cakes-label').textContent = data.homepage.pride.stats.cakes.label;
            
            document.getElementById('stat-bouquets-value').textContent = data.homepage.pride.stats.bouquets.value + data.homepage.pride.stats.bouquets.suffix;
            document.getElementById('stat-bouquets-label').textContent = data.homepage.pride.stats.bouquets.label;
        }

        // ك. شريط تسوق حسب الفئة الـ 12 كارت المعتمدة
        const categoriesTrack = document.getElementById('categories-track');
        if (categoriesTrack && data.homepage.categoriesSlider) {
            document.getElementById('categories-section-title').textContent = "تسوق حسب الفئة";
            document.getElementById('categories-section-subtitle').textContent = "اختر فئتك المفضلة لتستعرض كافة تفاصيلها ونكهاتها الموزونة.";
            
            let categoriesHtml = data.homepage.categoriesSlider.map(cat => `
                <div class="bose-category-slider-card">
                    <img src="${cat.image}" class="category-img" alt="${cat.title}">
                    <div class="category-title-display">${cat.title}</div>
                </div>
            `).join('');
            categoriesTrack.innerHTML = categoriesHtml;
        }

        // ل. ضخ صفحة المنيو الشامل (menu.html) إن وجد وسام المنيو الشامل المخصص
        const menuCategoriesGrid = document.getElementById('menu-categories-grid');
        if (menuCategoriesGrid && data.homepage.categoriesSlider) {
            menuCategoriesGrid.innerHTML = data.homepage.categoriesSlider.map(cat => `
                <div class="menu-category-card" style="width:100%; background:#fff; border:var(--bose-border-pink); border-radius:20px; padding:16px; box-shadow:var(--bose-shadow-glow); display:flex; flex-direction:column; align-items:center;">
                    <img src="${cat.image}" style="width:100%; height:280px; object-fit:cover; border-radius:15px;" alt="${cat.title}">
                    <h3 style="font-size:20px; font-weight:700; color:var(--bose-black); margin:15px 0 10px 0;">${cat.title}</h3>
                    <a href="category.html?id=${cat.id}" class="bose-hero-btn" style="padding:8px 24px; font-size:14px;">استعرض المنتجات</a>
                </div>
            `).join('');
        }
    }

    /* ==========================================================================
       🎰 إدارة عمليات تفاعل الكروت الفورية (إضافة للسلة وتعديل الكميات)
       ========================================================================== */
    window.modifyBoseQtyCard = function(button, change) {
        const counterWrapper = button.parentElement;
        const input = counterWrapper.querySelector('.input-qty-value');
        let currentVal = parseInt(input.value, 10) || 1;
        currentVal += change;
        if (currentVal < 1) currentVal = 1;
        input.value = currentVal;
    };

    window.addBoseCardToCart = function(button, productSlug) {
        const cardNode = button.closest('.product-card-unified');
        const qtyInput = cardNode.querySelector('.input-qty-value');
        const quantity = parseInt(qtyInput.value, 10) || 1;
        
        const product = window.BoseStoreData.products.find(p => p.slug === productSlug);
        if (!product) return;
        
        let cartItem = window.createCartItem(product, {}, quantity);
        
        let rawCart = localStorage.getItem('bose_cart');
        let cart = rawCart ? JSON.parse(rawCart) : [];
        
        let existingIndex = cart.findIndex(item => item.productSlug === productSlug && (!item.id || !item.id.includes("-")));
        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push(cartItem);
        }
        
        localStorage.setItem('bose_cart', JSON.stringify(cart));
        window.updateGlobalCartCounter();
        
        // إشعار توست مبهج وسريع للعميل
        showBoseToast(`تمت إضافة ${product.title} إلى السلة.`);
    };

    function showBoseToast(message) {
        let container = document.getElementById('bose-toast-central-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-central-container';
            container.className = 'bose-toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.style = 'background:var(--bose-pink); color:#fff; padding:12px 24px; border-radius:12px; margin-top:8px; box-shadow:var(--bose-shadow-hover); font-family:Cairo; font-weight:600; direction:rtl;';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3000);
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
        const safePersons = parseInt(persons, 10) || (config ? config.persons.minimum : 4) || 4;
        let price = (config ? config.basePrice : 580) || 580;
        const minPersons = (config ? config.persons.minimum : 4) || 4;
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

    window.validateBoseDeliverySchedule = function(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
        return (selectedDateTime - new Date(synchronizedTime)) / (1000 * 60 * 60) >= 23.95;
    };

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

    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        document.title = window.BoseStoreData.seo.title;
        const logoImgs = document.querySelectorAll('img#bose-store-logo');
        logoImgs.forEach(img => { img.src = window.BoseStoreData.store.logo; });
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

    function applyGlobalStyles(theme) {
        if (document.getElementById('bose-global-dynamic-styles')) return;
        const styleElement = document.createElement('style');
        styleElement.id = 'bose-global-dynamic-styles';
        
        styleElement.textContent = `
            @keyframes boseMarquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
            @keyframes boseWaterfallUp { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(0, -50%, 0); } }
            @keyframes boseWaterfallDown { 0% { transform: translate3d(0, -50%, 0); } 100% { transform: translate3d(0, 0, 0); } }
            .animate-marquee { display: flex; width: max-content; animation: boseMarquee 25s linear infinite; will-change: transform; }
            .waterfall-up { animation: boseWaterfallUp 40s linear infinite; will-change: transform; }
            .waterfall-down { animation: boseWaterfallDown 40s linear infinite; will-change: transform; }
            .categories-track-loop { display: flex; width: max-content; animation: boseMarquee 30s linear infinite; will-change: transform; }
            
            .bose-drawer-menu { position: fixed; top: 0; right: 0; width: 340px; max-width: 85vw; height: 100vh; background: #ffffff !important; z-index: 30000; transform: translate3d(100%, 0, 0); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: -8px 0 32px rgba(17,17,17,0.08); font-family: 'Cairo', sans-serif; }
            .bose-drawer-menu.active { transform: translate3d(0, 0, 0) !important; }
            .bose-drawer-panel-content { display: flex; flex-direction: column; height: 100vh; width: 100%; direction: rtl; }
            .drawer-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(11,11,11,0.4); z-index: 29999; opacity: 0; pointer-events: none; transition: opacity 0.4s ease; }
            .drawer-overlay.active { opacity: 1 !important; pointer-events: auto !important; }
            .drawer-premium-header { padding: 24px 20px; background-color: #ffffff; border-bottom: 1px solid rgba(255, 145, 164, 0.2); position: relative; }
            .drawer-premium-header h3 { font-size: 1.15rem; color: #111111 !important; margin: 0 0 4px 0; font-weight: 700; }
            .drawer-premium-header p { font-size: 0.85rem; color: #FF91A4 !important; margin: 0; }
            .drawer-close-btn { position: absolute; left: 20px; top: 24px; font-size: 1.3rem; color: #111111; cursor: pointer; border: none; background: none; }
            .drawer-links-scrollable { flex: 1; overflow-y: auto; padding: 15px 0; }
            .drawer-links-list { list-style: none; padding: 0; margin: 0; }
            .drawer-link-item a { display: flex; align-items: center; gap: 14px; padding: 14px 24px; color: #111111 !important; font-weight: 600; font-size: 0.95rem; border-bottom: 1px solid rgba(255, 145, 164, 0.05); transition: background 0.3s; }
            .drawer-link-item a i { color: #FF91A4; width: 20px; text-align: center; }
            .drawer-link-item a:hover { background-color: rgba(255, 145, 164, 0.08); color: #FF91A4 !important; }
            .ticker-message-item { padding: 0 40px; font-family: Cairo; font-weight: 600; color: var(--bose-black); font-size: 0.9rem; }
        `;
        document.head.appendChild(styleElement);
    }

    function showGlobalFriendlyError() {
        const errorDiv = document.createElement('div');
        errorDiv.style = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#FF91A4; color:#FFF; padding:12px 24px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:99999; direction:rtl; font-size:14px;';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.';
        document.body.appendChild(errorDiv);
    }

    loadStoreDatabase();
})();