/**
 * 👑 ملف المحرك المركزي العالمي المصحح والمطور بالكامل V11.0 - حلويات بوسي 2026 👑
 * حوكمة كاملة لواجهات الشريط العلوي، القائمة الجانبية المتطورة، والفوتر الموحد ومنع تداخل الملفات
 * المسؤول الوحيد والمطلق عن التحكم في حركة وسرعة وتكرار وضخ صور قسم "عقد من الإتقان" لتطهير الستايل تماماً[span_5](start_span)[span_5](end_span)
 */
(function() {
    // محددات الحالة المركزية المعزولة بأمان
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; 

    // ==========================================
    // 1. موديول إدارة قاعدة البيانات والتمهيد
    // ==========================================
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
                    
                    // استدعاء موديولات البناء الداخلي بالتتابع الهندسي الصارم
                    injectEarlyDependencies();
                    renderUniversalHeader();
                    renderUniversalSidebar();
                    renderUniversalFooter();
                    
                    applyGlobalSEOAndBranding();
                    window.updateGlobalCartCounter();
                    renderBoseDynamicContent();
                    
                    // إطلاق حدث الاعتماد الآمن لحراس ومحركات الموقع
                    document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
                    
                    if (typeof window.onBoseDatabaseReadyWrapper === "function") {
                        window.onBoseDatabaseReadyWrapper(window.BoseStoreData);
                    }
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

    // ==========================================
    // 2. موديول حقن الهيدر والشريط العلوي المقدس
    // ==========================================
    function renderUniversalHeader() {
        let headerInjector = document.getElementById('bose-header-injector');
        if (!headerInjector) return; 
        
        headerInjector.innerHTML = `
            <div id="top-bar-marquee">
                <div id="top-bar-marquee-track" class="animate-marquee"></div>
            </div>
            
            <header class="bose-navbar">
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
            </header>
        `;
    }

    // ==========================================
    // 3. موديول القائمة الجانبية التفاعلية المتطورة (Sidebar Drawer)
    // ==========================================
    function renderUniversalSidebar() {
        let sidebarPanel = document.getElementById('sidebar-drawer');
        if (sidebarPanel) sidebarPanel.remove(); 
        
        const storeSlogan = window.BoseStoreData.store.slogan || "صنعناها بحب لتهديها لمن تحب";
        
        const sidebar = document.createElement('div');
        sidebar.id = 'sidebar-drawer';
        sidebar.className = 'bose-drawer-menu';
        
        sidebar.innerHTML = `
            <div class="drawer-overlay" id="sidebar-close-overlay"></div>
            <div class="bose-drawer-panel-content">
                <div class="drawer-premium-header">
                    <h3>تصفح أقسامنا الفاخرة</h3>
                    <p class="bose-arabic-text">حلويات بوسي - ${storeSlogan}</p>
                    <button id="sidebar-close-btn" class="drawer-close-btn"><i class="fas fa-times"></i></button>
                </div>
                
                <div class="drawer-links-scrollable">
                    <ul class="drawer-links-list">
                        <li class="drawer-link-item"><a href="index.html"><i class="fas fa-home"></i> الرئيسية</a></li>
                        <li class="drawer-link-item"><a href="menu.html"><i class="fas fa-utensils"></i> المنيو الشامل</a></li>
                        <li class="drawer-link-item"><a href="cake-builder.html"><i class="fas fa-birthday-cake"></i> محاكي التورت التفاعلي</a></li>
                        <li class="drawer-link-item"><a href="flower-builder.html"><i class="fas fa-seedling"></i> محاكي الورد التفاعلي</a></li>
                    </ul>

                    <div class="drawer-premium-section-title">تسوق حسب الفئة</div>
                    <div class="drawer-categories-quick-grid" id="sidebar-quick-categories-node"></div>

                    <div class="drawer-premium-section-title">سلتك الحالية</div>
                    <div id="sidebar-mini-cart-wrapper" class="sidebar-mini-cart-container"></div>
                </div>

                <div class="drawer-premium-footer-block">
                    <div class="drawer-social-icons-row" id="sidebar-social-links-injector"></div>
                    <a href="https://wa.me/${window.sanitizeBosePhoneNumber(window.BoseStoreData.social.whatsapp)}" target="_blank" class="drawer-support-call-btn">
                        <i class="fab fa-whatsapp"></i> دعم عملاء حلويات بوسي
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(sidebar);

        const quickCategoriesContainer = document.getElementById('sidebar-quick-categories-node');
        if (quickCategoriesContainer && window.BoseStoreData.homepage.categoriesSlider) {
            quickCategoriesContainer.innerHTML = window.BoseStoreData.homepage.categoriesSlider.map(cat => `
                <a href="category.html?id=${cat.id}" class="sidebar-cat-chip-node">
                    <img src="${cat.image}" alt="${cat.title}">
                    <span>${cat.title}</span>
                </a>
            `).join('');
        }

        const socialLinksContainer = document.getElementById('sidebar-social-links-injector');
        if (socialLinksContainer) {
            socialLinksContainer.innerHTML = `
                <a href="${window.BoseStoreData.social.facebook}" target="_blank" class="social-link-facebook" aria-label="فيسبوك"><i class="fab fa-facebook-f"></i></a>
                <a href="${window.BoseStoreData.social.instagram}" target="_blank" class="social-link-instagram" aria-label="انستجرام"><i class="fab fa-instagram"></i></a>
                <a href="${window.BoseStoreData.social.tiktok}" target="_blank" class="social-link-tiktok" aria-label="تيك توك"><i class="fab fa-tiktok"></i></a>
            `;
        }

        window.refreshSidebarMiniCartDisplay();

        setTimeout(() => {
            const toggleBtn = document.getElementById('mobile-menu-toggle');
            const closeBtn = document.getElementById('sidebar-close-btn');
            const overlay = document.getElementById('sidebar-close-overlay');
            const menuPanel = document.getElementById('sidebar-drawer');

            if (toggleBtn && menuPanel) {
                toggleBtn.onclick = (e) => {
                    e.preventDefault();
                    window.refreshSidebarMiniCartDisplay(); 
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

    window.refreshSidebarMiniCartDisplay = function() {
        const miniCartWrapper = document.getElementById('sidebar-mini-cart-wrapper');
        if (!miniCartWrapper) return;

        const rawCart = localStorage.getItem('bose_cart');
        const cart = rawCart ? JSON.parse(rawCart) : [];

        if (cart.length === 0) {
            miniCartWrapper.innerHTML = `
                <div class="sidebar-mini-cart-empty">
                    <i class="fas fa-shopping-basket"></i>
                    <p>السلة فارغة حالياً</p>
                    <a href="menu.html" onclick="document.getElementById('sidebar-close-btn').click();" class="sidebar-browse-menu-trigger">تصفح المنيو الشامل</a>
                </div>
            `;
            return;
        }

        let totalAmount = 0;
        let itemsHtml = cart.map(item => {
            const finalPriceSum = item.finalPrice * item.quantity;
            totalAmount += finalPriceSum;
            return `
                <div class="sidebar-mini-cart-item-node">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="sidebar-mini-cart-item-details">
                        <h4>${item.title}</h4>
                        <h5>النكهة: ${item.flavorName}</h5>
                        <p class="sidebar-mini-cart-item-meta">العدد: ${item.quantity} × ${item.finalPrice} جنيه</p>
                    </div>
                </div>
            `;
        }).join('');

        miniCartWrapper.innerHTML = `
            <div class="sidebar-mini-cart-items-list-track">${itemsHtml}</div>
            <div class="sidebar-mini-cart-footer-summary">
                <div class="sidebar-mini-cart-total-row">
                    <span>إجمالي المشتريات:</span>
                    <strong>${totalAmount.toFixed(2)} جنيه</strong>
                </div>
                <a href="cart.html" class="sidebar-mini-cart-checkout-cta-btn">
                    استعراض السلة وإتمام الطلب <i class="fas fa-arrow-left"></i>
                </a>
            </div>
        `;
    };

    // ==========================================
    // 4. موديول حقن الفوتر الرسمي الموحد
    // ==========================================
    function renderUniversalFooter() {
        let footerInjector = document.getElementById('bose-footer-injector');
        if (!footerInjector) return;
        
        footerInjector.innerHTML = `
            <footer class="bose-footer">
                <div class="footer-logo-container">
                    <a href="index.html">
                        <img id="bose-footer-logo-node" src="${window.BoseStoreData.store.logo}" alt="شعار حلويات بوسي">
                    </a>
                </div>
                <span class="brand-name-display footer-brand-name">حلويات بوسي</span>
                
                <div class="footer-about-block">
                    <p id="footer-about-text">${window.BoseStoreData.footer.about}</p>
                </div>
                
                <div class="footer-quick-links">
                    <ul>
                        <li><a href="index.html">الرئيسية</a></li>
                        <li><a href="menu.html">المنيو الشامل</a></li>
                        <li><a href="cart.html">سلة التسوق</a></li>
                    </ul>
                </div>

                <div id="footer-social-links" class="bose-social-links-wrapper">
                    <a href="${window.BoseStoreData.social.facebook}" class="social-link-facebook" target="_blank" aria-label="فيسبوك حلويات بوسي"><i class="fab fa-facebook-f"></i></a>
                    <a href="${window.BoseStoreData.social.instagram}" class="social-link-instagram" target="_blank" aria-label="انستجرام حلويات بوسي"><i class="fab fa-instagram"></i></a>
                    <a href="${window.BoseStoreData.social.tiktok}" class="social-link-tiktok" target="_blank" aria-label="تيك توك حلويات بوسي"><i class="fab fa-tiktok"></i></a>
                    <a href="https://wa.me/${window.sanitizeBosePhoneNumber(window.BoseStoreData.social.whatsapp)}" class="social-link-whatsapp" target="_blank" aria-label="واتساب حلويات بوسي"><i class="fab fa-whatsapp"></i></a>
                </div>

                <div class="footer-policies-container" id="bose-footer-policies">
                    <ul class="nav-list">
                        <li><a href="privacy-policy.html">سياسة الخصوصية</a></li>
                        <li><a href="refund-policy.html">سياسة الاسترجاع</a></li>
                        <li><a href="shipping-policy.html">سياسة الطلبات</a></li>
                        <li><a href="terms.html">الشروط والأحكام</a></li>
                    </ul>
                </div>

                <div class="footer-location-block">
                    <p><i class="fas fa-map-marker-alt"></i> ${window.BoseStoreData.store.pickup.address}</p>
                </div>

                <div class="footer-copyright-block">
                    <p>© <span id="copyright-year">2026</span> جميع الحقوق محفوظة لعلامة حلويات بوسي التجارية الفاخرة</p>
                </div>
            </footer>
        `;
    }

    // ==========================================
    // 5. موديول حقن المحتوى الديناميكي وحركات الـ JavaScript
    // ==========================================
    function renderBoseDynamicContent() {
        const data = window.BoseStoreData;
        if (!data) return;

        const tickerTrack = document.getElementById('top-bar-marquee-track');
        if (tickerTrack && data.navigation.topBarMessages) {
            let messagesHtml = data.navigation.topBarMessages.map(msg => `
                <span class="ticker-message-item">${msg} &nbsp;&nbsp;&nbsp;&nbsp; 🌸 &nbsp;&nbsp;&nbsp;&nbsp;</span>
            `).join('');
            
            let infiniteLoopHtml = '';
            for (let i = 0; i < 40; i++) { 
                infiniteLoopHtml += messagesHtml;
            }
            tickerTrack.innerHTML = infiniteLoopHtml;
        }

        const heroDesc = document.getElementById('hero-description');
        const heroCta = document.getElementById('hero-cta-btn');
        if (heroDesc) heroDesc.textContent = data.homepage.hero.description;
        if (heroCta) heroCta.textContent = data.homepage.hero.cta;

        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        if (leftCol && rightCol) {
            leftCol.innerHTML = data.homepage.waterfall.leftColumnImages.map(img => `<img src="${img}" alt="حلويات بوسي فخامة بصرية">`).join('');
            rightCol.innerHTML = data.homepage.waterfall.rightColumnImages.map(img => `<img src="${img}" alt="حلويات بوسي فخامة بصرية">`).join('');
        }

        // 🎯 [المسؤول الوحيد والمطور لقسم عقد من الإتقان][span_6](start_span)[span_6](end_span)
        // بناء وضخ وتدوير المجرى بالكامل برمجياً مع سحب الأكواد من ملفات الـ CSS لمنع التعارض[span_7](start_span)[span_7](end_span)
        const excellenceTitle = document.getElementById('excellence-title');
        const excellenceDesc = document.getElementById('excellence-description');
        const excellenceTrack = document.getElementById('excellence-images-track');
        if (excellenceTitle) excellenceTitle.textContent = data.homepage.excellence.title;
        if (excellenceDesc) excellenceDesc.textContent = data.homepage.excellence.description;
        if (excellenceTrack && data.homepage.excellence.images) {
            let imagesHtml = data.homepage.excellence.images.map(img => `
                <a href="menu.html" class="perfection-slide-node"><img src="${img}" alt="إتقان حلويات بوسي"></a>
            `).join('');
            
            let infiniteExcellenceHtml = '';
            for (let i = 0; i < 30; i++) {
                infiniteExcellenceHtml += imagesHtml;
            }
            excellenceTrack.innerHTML = infiniteExcellenceHtml;

            // تطبيق التحكم المركزي الصارم في سرعة وحركة التكرار الانسيابي من هنا[span_8](start_span)[span_8](end_span)
            excellenceTrack.style.display = 'flex';
            excellenceTrack.style.gap = '16px';
            excellenceTrack.style.width = 'max-content';
            
            let currentX = 0;
            const scrollSpeed = 1.2; // ⚡ تحكم كامل في سرعة الحركة بكسل لكل إطار[span_9](start_span)[span_9](end_span)
            
            function animateExcellenceLoop() {
                currentX -= scrollSpeed;
                // إعادة تعيين موضع المجرى عند تكرار الدورة لمنع أي وميض أو فراغ[span_10](start_span)[span_10](end_span)
                if (Math.abs(currentX) >= (excellenceTrack.scrollWidth / 2)) {
                    currentX = 0;
                }
                excellenceTrack.style.transform = `translate3d(${currentX}px, 0, 0)`;
                requestAnimationFrame(animateExcellenceLoop);
            }
            // إطلاق المحرك البرمجي للحركة التلقائية الملساء[span_11](start_span)[span_11](end_span)
            requestAnimationFrame(animateExcellenceLoop);

            initializeBoseSliderLogic(excellenceTrack, 'excellence-dots', true, false); 
        }

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

        const mostSellingGrid = document.getElementById('most-selling-grid');
        if (mostSellingGrid) {
            document.getElementById('most-selling-title').textContent = "الأكثر مبيعاً";
            document.getElementById('most-selling-description').textContent = "تشكيلة فاخرة حازت على إعجاب وتقدير عملائنا دائماً.";
            let items = data.products.filter(p => data.homepage.mostSelling.includes(p.slug));
            mostSellingGrid.innerHTML = items.map(p => createProductCardHTML(p)).join('');
            
            if (window.innerWidth <= 767) {
                mostSellingGrid.className = "bose-most-selling-grid-slider";
            }
            initializeBoseSliderLogic(mostSellingGrid, 'most-selling-dots', false, false);
        }

        const newArrivalsGrid = document.getElementById('new-arrivals-grid');
        if (newArrivalsGrid) {
            document.getElementById('new-arrivals-title').textContent = "وصل حديثاً";
            document.getElementById('new-arrivals-description').textContent = "استكشف نكهاتنا المبتكرة والجديدة كلياً لهذا الأسبوع.";
            let items = data.products.filter(p => data.homepage.newArrivals.includes(p.slug));
            newArrivalsGrid.innerHTML = items.map(p => createProductCardHTML(p)).join('');
            
            if (window.innerWidth <= 767) {
                newArrivalsGrid.className = "bose-new-arrivals-grid-slider";
            }
            initializeBoseSliderLogic(newArrivalsGrid, 'new-arrivals-dots', false, false);
        }

        const ourProductsGrid = document.getElementById('our-products-grid');
        if (ourProductsGrid) {
            document.getElementById('our-products-title').textContent = "منتجاتنا";
            document.getElementById('our-products-description').textContent = "الجودة والقيمة العالية للمكونات الطازجة يومياً.";
            let allItems = data.products.filter(p => data.homepage.ourProducts.includes(p.slug));
            ourProductsGrid.innerHTML = allItems.slice(0, 4).map(p => createProductCardHTML(p)).join('');
            
            const showMoreBtn = document.getElementById('our-products-show-more');
            if (showMoreBtn) {
                showMoreBtn.textContent = "استعرض المزيد";
                showMoreBtn.style.display = "inline-flex";
                showMoreBtn.onclick = function() {
                    ourProductsGrid.innerHTML = allItems.map(p => createProductCardHTML(p)).join('');
                    showMoreBtn.style.display = "none";
                };
            }
        }

        if (document.getElementById('pride-main-title')) {
            document.getElementById('pride-main-title').textContent = data.homepage.pride.title;
            document.getElementById('pride-main-text').textContent = data.homepage.pride.text;
            initializeBosePrideCounters(data.homepage.pride.stats);
        }

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

        const categoriesTrack = document.getElementById('categories-track');
        if (categoriesTrack && data.homepage.categoriesSlider) {
            document.getElementById('categories-section-title').textContent = "تسوق حسب الفئة";
            document.getElementById('categories-section-subtitle').textContent = "اختر فئتك المفضلة لتستعرض كافة تفاصيلها ونكهاتها الموزونة.";
            
            categoriesTrack.innerHTML = data.homepage.categoriesSlider.map(cat => `
                <div class="bose-category-slider-card">
                    <a href="category.html?id=${cat.id}">
                        <img src="${cat.image}" class="category-img" alt="${cat.title}">
                        <div class="category-title-display">${cat.title}</div>
                    </a>
                </div>
            `).join('');
            initializeBoseSliderLogic(categoriesTrack, 'categories-dots', true, true); 
        }
    }

    // ==========================================
    // 6. موديول إدارة وتفعيل العدادات التصاعدية الذكية
    // ==========================================
    function initializeBosePrideCounters(statsConfig) {
        if (!statsConfig) return;
        
        const mapPrideDomIds = {
            years: 'counter-years-node',
            customers: 'counter-customers-node',
            orders: 'counter-orders-node',
            cakes: 'counter-cakes-node',
            bouquets: 'counter-bouquets-node'
        };

        Object.keys(mapPrideDomIds).forEach(key => {
            const domId = mapPrideDomIds[key];
            const targetElement = document.getElementById(domId);
            if (!targetElement) return;

            const targetValue = parseInt(statsConfig[key].value, 10) || 0;
            const suffixStr = statsConfig[key].suffix || '';
            
            let startCount = 0;
            const animationDuration = 2000; 
            const stepsCount = 50;
            const incrementValue = Math.ceil(targetValue / stepsCount);
            const stepIntervalTime = animationDuration / stepsCount;

            const counterInterval = setInterval(() => {
                startCount += incrementValue;
                if (startCount >= targetValue) {
                    targetElement.textContent = targetValue.toLocaleString() + suffixStr;
                    clearInterval(counterInterval);
                } else {
                    targetElement.textContent = startCount.toLocaleString() + suffixStr;
                }
            }, stepIntervalTime);
        });
    }

    // ==========================================
    // 7. موديول إدارة وتوجيه السلايدرات اللمسية والتلقائية
    // ==========================================
    function initializeBoseSliderLogic(sliderTrack, dotsContainerId, isAutoPlay = false, isCategoryType = false) {
        if (!sliderTrack) return;
        
        let isDown = false;
        let startX;
        let scrollLeft;
        
        sliderTrack.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - sliderTrack.offsetLeft;
            scrollLeft = sliderTrack.scrollLeft;
        });
        sliderTrack.addEventListener('mouseleave', () => { isDown = false; });
        sliderTrack.addEventListener('mouseup', () => {
            isDown = false;
            updateSliderDots(sliderTrack, dotsContainerId, isCategoryType);
        });
        sliderTrack.addEventListener('mousemove', (e) => {
            if(!isDown) return;
            e.preventDefault();
            const x = e.pageX - sliderTrack.offsetLeft;
            const walk = (x - startX) * 1.5; 
            sliderTrack.scrollLeft = scrollLeft - walk;
        });

        sliderTrack.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - sliderTrack.offsetLeft;
            scrollLeft = sliderTrack.scrollLeft;
        }, {passive: true});
        
        sliderTrack.addEventListener('touchmove', (e) => {
            if(!isDown) return;
            const x = e.touches[0].pageX - sliderTrack.offsetLeft;
            const walk = (x - startX) * 1.5;
            sliderTrack.scrollLeft = scrollLeft - walk;
        }, {passive: true});

        sliderTrack.addEventListener('touchend', () => {
            isDown = false;
            updateSliderDots(sliderTrack, dotsContainerId, isCategoryType);
        });

        sliderTrack.addEventListener('scroll', () => {
            if (!isDown) { updateSliderDots(sliderTrack, dotsContainerId, isCategoryType); }
        }, {passive: true});

        buildSliderDots(sliderTrack, dotsContainerId, isCategoryType);
    }

    function buildSliderDots(track, containerId, isCategoryType) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        const totalItems = track.children.length;
        if(totalItems === 0) return;
        
        const cardWidth = isCategoryType ? 280 : (track.children[0].offsetWidth || 280);
        const visibleItemsCount = Math.max(1, Math.floor(track.offsetWidth / cardWidth)); 
        const dotsCount = Math.max(1, totalItems - visibleItemsCount + 1);

        for (let i = 0; i < Math.min(dotsCount, 8); i++) {
            const dot = document.createElement('span');
            dot.className = 'bose-slider-dot' + (i === 0 ? ' active' : '');
            container.appendChild(dot);
        }
    }

    function updateSliderDots(track, containerId, isCategoryType) {
        const container = document.getElementById(containerId);
        if (!container || !track.children.length) return;
        
        const finalCardWidth = (isCategoryType ? 280 : track.children[0].offsetWidth) + 16;
        const activeIndex = Math.round(Math.abs(track.scrollLeft) / finalCardWidth);
        
        const dots = container.querySelectorAll('.bose-slider-dot');
        dots.forEach((dot, idx) => {
            if (idx === activeIndex % (dots.length || 1)) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    // ==========================================
    // 8. موديول العمليات المالية وإدارة السلة التأسيسية
    // ==========================================
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
        const qtyInput = cardNode ? cardNode.querySelector('.input-qty-value') : null;
        const quantity = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;
        
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
        window.refreshSidebarMiniCartDisplay(); 
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
        toast.className = 'bose-toast-node';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3000);
    }

    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        if (!window.BoseStoreData) return basePrice;
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return parseFloat((basePrice * (1 + (rule.percent / 100))).toFixed(4));
        }
        return basePrice;
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
        window.onBoseDatabaseReadyWrapper = callback;
        if (window.BoseStoreData) {
            callback(window.BoseStoreData);
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

    function showGlobalFriendlyError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'global-error-banner-node';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.';
        document.body.appendChild(errorDiv);
    }

    loadStoreDatabase();
})();