/**
 * 👑 ملف المحرك المركزي العالمي المصحح والمطور بالكامل V8.5 - حلويات بوسي 2026 👑
 * معالجة هندسية شاملة وحوكمة كاملة لواجهات الشريط العلوي، القائمة الجانبية، والفوتر الموحد
 * امتثال مطلق وأعمى لملف الحوكمة والمواصفة الرسمية القياسية الفاخرة لمنع الأخطاء البصرية
 * تم إصلاح حركة ونصوص الشريط العلوي المتحرك ليكون صافياً وبدون أي انقطاع أو بتر بصرى
 * حظر كامل للون الأسود والظلال المظلمة من القائمة الجانبية والفوتر لتأمين التنفس البصري الكامل
 * متوافق ومترابط بشكل مطلق ومتبادل مع: global.css و main.css وقاعدة البيانات site-data-final.json
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
                    
                    // إدارة وضخ العناصر العالمية المشتركة عبر بروتوكول الحقن الهندسي الصحيح
                    injectEarlyDependencies();
                    applyGlobalStyles(window.BoseStoreData.store.theme);
                    renderUniversalHeader();
                    renderUniversalSidebar();
                    renderUniversalFooter();
                    
                    // تحديثات الحالة العامة والـ SEO
                    applyGlobalSEOAndBranding();
                    window.updateGlobalCartCounter();

                    // محرك ضخ واجهات الصفحة الرئيسية والمنيو تلقائياً لملء الأوسمة الفارغة
                    renderBoseDynamicContent();
                    
                    // تفعيل حدث مخصص فوراً وضمان ترحيله للمتصفح لمنع التعارض الزمني
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
        let headerInjector = document.getElementById('bose-header-injector');
        if (!headerInjector) return; 
        
        headerInjector.innerHTML = `
            <!-- شريط علوي متحرك (#top-bar-marquee) في مكانه الصحيح والمطلق بأعلى الصفحة -->
            <div id="top-bar-marquee">
                <div id="top-bar-marquee-track" class="animate-marquee"></div>
            </div>
            
            <!-- الهيدر الهيكلي المقدس Sticky الثابت الملتزم بالمواصفة بالملي من اليمين لليسار -->
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

    function renderUniversalSidebar() {
        let sidebarPanel = document.getElementById('sidebar-drawer');
        if (sidebarPanel) sidebarPanel.remove(); 
        
        const storeSlogan = window.BoseStoreData.store.slogan || "صنعناها بحب لتهديها لمن تحب";
        
        const sidebar = document.createElement('div');
        sidebar.id = 'sidebar-drawer';
        sidebar.className = 'bose-drawer-menu';
        
        sidebar.innerHTML = `
            <div class="drawer-overlay" id="sidebar-close-overlay" style="background: rgba(255, 145, 164, 0.05) !important;"></div>
            <div class="bose-drawer-panel-content" style="background: var(--bose-white) !important; border-right: var(--bose-border-pink);">
                <div class="drawer-premium-header" style="border-bottom: 2px solid var(--bose-pink); padding: 24px 20px;">
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--bose-black) !important; margin: 0 0 6px 0;">تصفح أقسامنا الفاخرة</h3>
                    <p class="bose-arabic-text" style="color: var(--bose-pink) !important; font-weight: 600; font-size: 0.9rem; margin: 0;">حلويات بوسي - ${storeSlogan}</p>
                    <button id="sidebar-close-btn" class="drawer-close-btn" style="color: var(--bose-pink);"><i class="fas fa-times"></i></button>
                </div>
                <div class="drawer-links-scrollable" style="background-color: var(--bose-white) !important; padding: 15px 0;">
                    <ul class="drawer-links-list">
                        <li class="drawer-link-item"><a href="index.html" style="color: var(--bose-black) !important; font-weight: 600;"><i class="fas fa-home" style="color: var(--bose-pink);"></i> الرئيسية</a></li>
                        <li class="drawer-link-item"><a href="menu.html" style="color: var(--bose-black) !important; font-weight: 600;"><i class="fas fa-utensils" style="color: var(--bose-pink);"></i> المنيو الشامل</a></li>
                        <li class="drawer-link-item"><a href="cake-builder.html" style="color: var(--bose-black) !important; font-weight: 600;"><i class="fas fa-birthday-cake" style="color: var(--bose-pink);"></i> محاكي التورت التفاعلي</a></li>
                        <li class="drawer-link-item"><a href="flower-builder.html" style="color: var(--bose-black) !important; font-weight: 600;"><i class="fas fa-seedling" style="color: var(--bose-pink);"></i> محاكي الورد التفاعلي</a></li>
                        <li class="drawer-link-item"><a href="cart.html" style="color: var(--bose-black) !important; font-weight: 600;"><i class="fas fa-shopping-basket" style="color: var(--bose-pink);"></i> سلة المشتريات</a></li>
                        <li class="drawer-link-item"><a href="checkout.html" style="color: var(--bose-black) !important; font-weight: 600;"><i class="fas fa-credit-card" style="color: var(--bose-pink);"></i> إتمام الطلب الشامل</a></li>
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
        let footerInjector = document.getElementById('bose-footer-injector');
        if (!footerInjector) return;
        
        footerInjector.innerHTML = `
            <footer class="bose-footer" style="background-color: var(--bose-white) !important; border-top: var(--bose-border-pink); padding: 50px 20px 30px 20px;">
                <div class="footer-logo-container" style="margin-bottom: 12px;">
                    <a href="index.html">
                        <img id="bose-footer-logo-node" src="${window.BoseStoreData.store.logo}" alt="شعار حلويات بوسي" style="height: 65px; margin: 0 auto;">
                    </a>
                </div>
                <span class="brand-name-display footer-brand-name" style="font-size: 1.45rem; font-weight: 700; color: var(--bose-black) !important; margin-bottom: 16px;">حلويات بوسي</span>
                
                <div class="footer-about-block" style="max-width: 650px; margin-bottom: 24px;">
                    <p id="footer-about-text" style="font-size: 0.95rem; color: var(--bose-black) !important; line-height: 1.7; opacity: 0.95;">${window.BoseStoreData.footer.about}</p>
                </div>
                
                <div class="footer-quick-links" style="margin-bottom: 24px;">
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; font-weight: 600; font-size: 0.95rem;">
                        <li><a href="index.html" style="color: var(--bose-black) !important; transition: color 0.3s;">الرئيسية</a></li>
                        <li><a href="menu.html" style="color: var(--bose-black) !important; transition: color 0.3s;">المنيو الشامل</a></li>
                        <li><a href="cart.html" style="color: var(--bose-black) !important; transition: color 0.3s;">سلة التسوق</a></li>
                    </ul>
                </div>

                <div id="footer-social-links" class="bose-social-links-wrapper" style="display: flex; gap: 24px; justify-content: center; margin-bottom: 30px;">
                    <a href="${window.BoseStoreData.social.facebook}" class="social-link-facebook" target="_blank" aria-label="فيسبوك حلويات بوسي" style="font-size: 1.6rem; color: #1877F2; transition: transform 0.3s;"><i class="fab fa-facebook-f"></i></a>
                    <a href="${window.BoseStoreData.social.instagram}" class="social-link-instagram" target="_blank" aria-label="انستجرام حلويات بوسي" style="font-size: 1.6rem; color: #E1306C; transition: transform 0.3s;"><i class="fab fa-instagram"></i></a>
                    <a href="${window.BoseStoreData.social.tiktok}" class="social-link-tiktok" target="_blank" aria-label="تيك توك حلويات بوسي" style="font-size: 1.6rem; color: #000000; transition: transform 0.3s;"><i class="fab fa-tiktok"></i></a>
                    <a href="https://wa.me/${window.sanitizeBosePhoneNumber(window.BoseStoreData.social.whatsapp)}" class="social-link-whatsapp" target="_blank" aria-label="واتساب حلويات بوسي" style="font-size: 1.6rem; color: #25D366; transition: transform 0.3s;"><i class="fab fa-whatsapp"></i></a>
                </div>

                <div class="footer-policies-container" id="bose-footer-policies" style="margin-bottom: 24px;">
                    <ul class="nav-list" style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; list-style: none; padding:0; margin:0; font-size: 0.9rem; font-weight: 600;">
                        <li><a href="privacy-policy.html" style="color: var(--bose-black) !important;">سياسة الخصوصية</a></li>
                        <li><a href="refund-policy.html" style="color: var(--bose-black) !important;">سياسة الاسترجاع</a></li>
                        <li><a href="shipping-policy.html" style="color: var(--bose-black) !important;">سياسة الطلبات</a></li>
                        <li><a href="terms.html" style="color: var(--bose-black) !important;">الشروط والأحكام</a></li>
                    </ul>
                </div>

                <div class="footer-location-block" style="margin-bottom: 24px; font-size: 0.9rem; color: var(--bose-black); opacity: 0.85; max-width: 500px; line-height: 1.5;">
                    <p><i class="fas fa-map-marker-alt" style="color: var(--bose-pink); margin-left: 6px;"></i> ${window.BoseStoreData.store.pickup.address}</p>
                </div>

                <div class="footer-copyright-block" style="width: 100%; border-top: 1px solid rgba(255, 145, 164, 0.15); padding-top: 20px; text-align: center;">
                    <p style="font-size: 0.85rem; color: var(--bose-black) !important; opacity: 0.7; margin: 0;">© <span id="copyright-year">2026</span> جميع الحقوق محفوظة لعلامة حلويات بوسي التجارية الفاخرة</p>
                </div>
            </footer>
        `;
    }

    /* ==========================================================================
       👑 محرك ضخ وبناء المحتوى الحركي والشبكي التفاعلي (Dynamic Render Engine)
       ========================================================================== */
    function renderBoseDynamicContent() {
        const data = window.BoseStoreData;
        if (!data) return;

        // 🔄 تصحيح الشريط العلوي المتحرك حتمياً وضخ النصوص وتكرارها هندسياً لملء المسار
        const tickerTrack = document.getElementById('top-bar-marquee-track');
        if (tickerTrack && data.navigation.topBarMessages) {
            let messagesHtml = data.navigation.topBarMessages.map(msg => `
                <span class="ticker-message-item" style="color: var(--bose-white) !important;">${msg} &nbsp;&nbsp;&nbsp;&nbsp; 🌸 &nbsp;&nbsp;&nbsp;&nbsp;</span>
            `).join('');
            // مضاعفة المحتوى تكرارياً لملء مسار الحركة بالكامل لضمان الانسيابية اللانهائية وعدم ظهور فراغ بصرى
            tickerTrack.innerHTML = `${messagesHtml}${messagesHtml}${messagesHtml}${messagesHtml}${messagesHtml}${messagesHtml}`;
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

        const excellenceTitle = document.getElementById('excellence-title');
        const excellenceDesc = document.getElementById('excellence-description');
        const excellenceTrack = document.getElementById('excellence-images-track');
        if (excellenceTitle) excellenceTitle.textContent = data.homepage.excellence.title;
        if (excellenceDesc) excellenceDesc.textContent = data.homepage.excellence.description;
        if (excellenceTrack && data.homepage.excellence.images) {
            excellenceTrack.innerHTML = data.homepage.excellence.images.map(img => `<a href="menu.html" class="perfection-slide-node"><img src="${img}" alt="إتقان حلويات بوسي"></a>`).join('');
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
            initializeBoseTracksSliderLogic(newArrivalsGrid, 'new-arrivals-dots', false, false);
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

        if (document.getElementById('pride-main-title')) {
            document.getElementById('pride-main-title').textContent = data.homepage.pride.title;
            document.getElementById('pride-main-text').textContent = data.homepage.pride.text;
            
            document.getElementById('stat-years-value').textContent = data.homepage.pride.stats.years.value + data.homepage.pride.stats.years.suffix;
            document.getElementById('stat-customers-value').textContent = data.homepage.pride.stats.customers.value + data.homepage.pride.stats.customers.suffix;
            document.getElementById('stat-orders-value').textContent = data.homepage.pride.stats.orders.value + data.homepage.pride.stats.orders.suffix;
            document.getElementById('stat-cakes-value').textContent = data.homepage.pride.stats.cakes.value + data.homepage.pride.stats.cakes.suffix;
            document.getElementById('stat-bouquets-value').textContent = data.homepage.pride.stats.bouquets.value + data.homepage.pride.stats.bouquets.suffix;
        }

        const categoriesTrack = document.getElementById('categories-track');
        if (categoriesTrack && data.homepage.categoriesSlider) {
            document.getElementById('categories-section-title').textContent = "تسوق حسب الفئة";
            document.getElementById('categories-section-subtitle').textContent = "اختر فئتك المفضلة لتستعرض كافة تفاصيلها ونكهاتها الموزونة.";
            
            categoriesTrack.innerHTML = data.homepage.categoriesSlider.map(cat => `
                <div class="bose-category-slider-card">
                    <a href="category.html?id=${cat.id}" style="text-decoration:none; display:block; width:100%;">
                        <img src="${cat.image}" class="category-img" alt="${cat.title}">
                        <div class="category-title-display">${cat.title}</div>
                    </a>
                </div>
            `).join('');
            initializeBoseSliderLogic(categoriesTrack, 'categories-dots', false, true); 
        }

        const menuCategoriesGrid = document.getElementById('menu-categories-grid');
        if (menuCategoriesGrid && data.homepage.categoriesSlider) {
            menuCategoriesGrid.innerHTML = data.homepage.categoriesSlider.map(cat => `
                <div class="menu-category-card">
                    <a href="category.html?id=${cat.id}" style="text-decoration:none; display:block;">
                        <img src="${cat.image}" style="width:100%; height:280px; object-fit:cover; border-radius:15px;" alt="${cat.title}">
                    </a>
                    <h3 style="font-size:20px; font-weight:700; color:var(--bose-black); margin:15px 0 10px 0; text-align:center;">${cat.title}</h3>
                    <div style="display:flex; justify-content:center; width:100%;">
                        <a href="category.html?id=${cat.id}" class="bose-hero-btn" style="padding:8px 24px; font-size:14px; text-decoration:none; text-align:center;">استعرض المنتجات</a>
                    </div>
                </div>
            `).join('');
        }
    }

    /* ==========================================================================
       👑 محرك السحب واللمس والتصفح الأفقي المصلح الشامل (Universal Slider Logic)
       ========================================================================== */
    function initializeBoseSliderLogic(sliderTrack, dotsContainerId, isAutoPlay = false, isCategoryType = false) {
        if (!sliderTrack) return;
        if (sliderTrack.id === 'top-bar-marquee-track') return;

        let isDown = false;
        let startX;
        let scrollLeft;
        let autoPlayTimer = null;
        
        sliderTrack.addEventListener('mousedown', (e) => {
            isDown = true;
            sliderTrack.classList.add('grabbing');
            startX = e.pageX - sliderTrack.offsetLeft;
            scrollLeft = sliderTrack.scrollLeft;
            if(autoPlayTimer) clearInterval(autoPlayTimer);
        });
        sliderTrack.addEventListener('mouseleave', () => {
            isDown = false;
            sliderTrack.classList.remove('grabbing');
            if (isAutoPlay) startAutoPlayLogic();
        });
        sliderTrack.addEventListener('mouseup', () => {
            isDown = false;
            sliderTrack.classList.remove('grabbing');
            updateSliderDots(sliderTrack, dotsContainerId, isCategoryType);
            if (isAutoPlay) startAutoPlayLogic();
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
            if(autoPlayTimer) clearInterval(autoPlayTimer);
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
            if (isAutoPlay) startAutoPlayLogic();
        });

        sliderTrack.addEventListener('scroll', () => {
            if (!isDown) {
                updateSliderDots(sliderTrack, dotsContainerId, isCategoryType);
            }
        }, {passive: true});

        buildSliderDots(sliderTrack, dotsContainerId, isCategoryType);

        function startAutoPlayLogic() {
            const isRTL = window.getComputedStyle(sliderTrack).direction === 'rtl';
            let autoSliderDirection = isRTL ? -1 : 1;

            autoPlayTimer = setInterval(() => {
                if (!isDown) {
                    const maxScroll = sliderTrack.scrollWidth - sliderTrack.clientWidth;
                    
                    if (isRTL) {
                        sliderTrack.scrollLeft += autoSliderDirection * 2; 
                        if (Math.abs(sliderTrack.scrollLeft) >= maxScroll - 2) {
                            autoSliderDirection = 1; 
                        } else if (sliderTrack.scrollLeft >= -2) {
                            autoSliderDirection = -1; 
                        }
                    } else {
                        sliderTrack.scrollLeft += autoSliderDirection * 2;
                        if (sliderTrack.scrollLeft >= maxScroll - 2) {
                            autoSliderDirection = -1;
                        } else if (sliderTrack.scrollLeft <= 2) {
                            autoSliderDirection = 1;
                        }
                    }
                }
            }, 30);
        }

        if (isAutoPlay) {
            startAutoPlayLogic();
        }
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

        for (let i = 0; i < dotsCount; i++) {
            const dot = document.createElement('span');
            dot.className = 'bose-slider-dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => {
                const finalCardWidth = (isCategoryType ? 280 : track.children[0].offsetWidth) + 16; 
                const isRTL = window.getComputedStyle(track).direction === 'rtl';
                const targetScroll = isRTL ? -(i * finalCardWidth) : (i * finalCardWidth);
                track.scrollTo({ left: targetScroll, behavior: 'smooth' });
            };
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
            if (idx === activeIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    window.initializeBoseTracksSliderLogic = function(sliderTrack, dotsContainerId, isAutoPlay = false, isCategoryType = false) {
        initializeBoseSliderLogic(sliderTrack, dotsContainerId, isAutoPlay, isCategoryType);
    };

    /* ==========================================================================
       👑 إدارة عمليات تفاعل الكروت الفورية (إضافة للسلة وتعديل الكميات)
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
        const cardNode = button.closest('.product-card-unified') || button.closest('.menu-category-card');
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
       👑 الحسابات المالية الدقيقة وحوكمة الفئات (Core Mathematical System)
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
        // حظر كامل لضخ الأكواد البصرية والأنميشن داخل ملفات الجافا سكريبت منعاً لأي تعارض هيكلي مع ملفات الستايل المستقلة
        console.log("🛡️ حوكمة الحركية: تم عزل وحظر ضخ الاستايلات محلياً للتأكيد على تخصص ملفات الستايل الخارجية بدورها فقط.");
    }

    function showGlobalFriendlyError() {
        const errorDiv = document.createElement('div');
        errorDiv.style = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#FF91A4; color:#FFF; padding:12px 24px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:99999; direction:rtl; font-size:14px;';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.';
        document.body.appendChild(errorDiv);
    }

    loadStoreDatabase();
})();