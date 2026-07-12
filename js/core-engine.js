/**
 * 👑 ملف المحرك المركزي العالمي النظيف والمصحح بالكامل V16.0 - حلويات بوسي 2026 👑
 * حوكمة كاملة لواجهات الشريط العلوي، القائمة الجانبية المتطورة، والفوتر الموحد ومنع تداخل الملفات
 * القضاء التام والنهائي على ثغرة اختفاء نصوص الشريط العلوي وصور قسم "عقد من الإتقان"
 * المسؤول الوحيد والمطلق عن التحكم في حركة وسرعة وتكرار وضخ نصوص الشريط العلوي وقسم "عقد من الإتقان"
 * [تطهير برمي]: حذف كامل لجميع الدوال الميتة وحسابات التحميل المعقدة لضمان استقرار العرض اللحظي.
 */
(function() {
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0;

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
                    
                    injectEarlyDependencies();
                    renderUniversalHeader();
                    renderUniversalSidebar();
                    renderUniversalFooter();
                    
                    applyGlobalSEOAndBranding();
                    window.updateGlobalCartCounter();
                    renderBoseDynamicContent();
                    
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
                            <img id="bose-store-logo" src="${window.BoseStoreData.store.logo}" alt="شعار حلويات بوسي" loading="lazy">
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
        
        const sidebar = document.createElement('div');
        sidebar.id = 'sidebar-drawer';
        sidebar.className = 'bose-drawer-menu';
        
        sidebar.innerHTML = `
            <div class="drawer-overlay" id="sidebar-close-overlay"></div>
            <div class="bose-drawer-panel-content">
                <div class="drawer-premium-header">
                    <h3>تصفح أقسامنا الفاخرة</h3>
                    <p class="bose-arabic-text">حلويات بوسي</p>
                    <button id="sidebar-close-btn" class="drawer-close-btn"><i class="fas fa-times"></i></button>
                </div>
                
                <div class="drawer-links-scrollable" style="padding-bottom: 60px !important;">
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

                    <div class="drawer-premium-footer-block" style="margin-top: 30px; padding: 20px 24px;">
                        <div class="drawer-social-icons-row" id="sidebar-social-links-injector" style="display: flex; gap: 15px; justify-content: center; margin-bottom: 15px;"></div>
                        <a href="https://wa.me/${window.sanitizeBosePhoneNumber(window.BoseStoreData.social.whatsapp)}" target="_blank" class="drawer-support-call-btn">
                            <i class="fab fa-whatsapp"></i> دعم عملاء حلويات بوسي
                        </a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(sidebar);

        const quickCategoriesContainer = document.getElementById('sidebar-quick-categories-node');
        if (quickCategoriesContainer && window.BoseStoreData.homepage.categoriesSlider) {
            quickCategoriesContainer.innerHTML = window.BoseStoreData.homepage.categoriesSlider.map(cat => {
                let targetUrl = `category.html?id=${cat.id}`;
                if (cat.id === "taswaq-toort") targetUrl = "cake-builder.html";
                if (cat.id === "taswaq-flowers") targetUrl = "flower-builder.html";
                return `<a href="${targetUrl}" class="sidebar-cat-chip-node"><img src="${cat.image}" alt="${cat.title}" loading="lazy"><span>${cat.title}</span></a>`;
            }).join('');
        }

        const socialLinksContainer = document.getElementById('sidebar-social-links-injector');
        if (socialLinksContainer) {
            socialLinksContainer.innerHTML = `
                <a href="${window.BoseStoreData.social.facebook}" target="_blank" style="color: #111111; font-size: 1.2rem;" aria-label="فيسبوك"><i class="fab fa-facebook-f"></i></a>
                <a href="${window.BoseStoreData.social.instagram}" target="_blank" style="color: #111111; font-size: 1.2rem;" aria-label="انستجرام"><i class="fab fa-instagram"></i></a>
                <a href="${window.BoseStoreData.social.tiktok}" target="_blank" style="color: #111111; font-size: 1.2rem;" aria-label="تيك توك"><i class="fab fa-tiktok"></i></a>
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
            totalAmount += item.finalPrice * item.quantity;
            return `
                <div class="sidebar-mini-cart-item-node">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
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
                <a href="cart.html" class="sidebar-mini-cart-checkout-cta-btn">استعراض السلة وإتمام الطلب <i class="fas fa-arrow-left"></i></a>
            </div>
        `;
    };

    function renderUniversalFooter() {
        let footerInjector = document.getElementById('bose-footer-injector');
        if (!footerInjector) return;
        
        footerInjector.innerHTML = `
            <footer class="bose-footer">
                <div class="footer-logo-container">
                    <a href="index.html"><img id="bose-footer-logo-node" src="${window.BoseStoreData.store.logo}" alt="شعار حلويات بوسي" loading="lazy"></a>
                </div>
                <span class="brand-name-display footer-brand-name">حلويات بوسي</span>
                <div class="footer-about-block"><p id="footer-about-text">${window.BoseStoreData.footer.about}</p></div>
                <div class="footer-quick-links">
                    <ul>
                        <li><a href="index.html">الرئيسية</a></li>
                        <li><a href="menu.html">المنيو الشامل</a></li>
                        <li><a href="cart.html">سلة التسوق</a></li>
                    </ul>
                </div>
                <div id="footer-social-links" class="bose-social-links-wrapper">
                    <a href="${window.BoseStoreData.social.facebook}" class="social-link-facebook" target="_blank"><i class="fab fa-facebook-f"></i></a>
                    <a href="${window.BoseStoreData.social.instagram}" class="social-link-instagram" target="_blank"><i class="fab fa-instagram"></i></a>
                    <a href="${window.BoseStoreData.social.tiktok}" class="social-link-tiktok" target="_blank"><i class="fab fa-tiktok"></i></a>
                    <a href="https://wa.me/${window.sanitizeBosePhoneNumber(window.BoseStoreData.social.whatsapp)}" class="social-link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>
                </div>
                <div class="footer-policies-container">
                    <ul class="nav-list">
                        <li><a href="privacy-policy.html">سياسة الخصوصية</a></li>
                        <li><a href="refund-policy.html">سياسة الاسترجاع</a></li>
                        <li><a href="shipping-policy.html">سياسة الطلبات</a></li>
                        <li><a href="terms.html">الشروط والأحكام</a></li>
                    </ul>
                </div>
                <div class="footer-location-block"><p><i class="fas fa-map-marker-alt"></i> ${window.BoseStoreData.store.pickup.address}</p></div>
                <div class="footer-copyright-block"><p>© <span>2026</span> جميع الحقوق محفوظة لعلامة حلويات بوسي التجارية الفاخرة</p></div>
            </footer>
        `;
    }

    function renderBoseDynamicContent() {
        const data = window.BoseStoreData;
        if (!data) return;

        // إصلاح شريط الماركي العلوي
        const tickerTrack = document.getElementById('top-bar-marquee-track');
        if (tickerTrack && data.navigation.topBarMessages) {
            let messagesHtml = data.navigation.topBarMessages.map(msg => `<span class="ticker-message-item">${msg} &nbsp;&nbsp;&nbsp;&nbsp; 🌸 &nbsp;&nbsp;&nbsp;&nbsp;</span>`).join('');
            tickerTrack.innerHTML = messagesHtml + messagesHtml + messagesHtml + messagesHtml;
        }

        // إصلاح قسم الهيرو والشلال البصري
        if (document.getElementById('hero-description')) document.getElementById('hero-description').textContent = data.homepage.hero.description;
        if (document.getElementById('hero-cta-btn')) document.getElementById('hero-cta-btn').textContent = data.homepage.hero.cta;

        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        if (leftCol && rightCol) {
            leftCol.innerHTML = data.homepage.waterfall.leftColumnImages.map(img => `<img src="${img}" alt="حلويات بوسي فخامة بصرية" loading="lazy">`).join('');
            rightCol.innerHTML = data.homepage.waterfall.rightColumnImages.map(img => `<img src="${img}" alt="حلويات بوسي فخامة بصرية" loading="lazy">`).join('');
        }

        // إصلاح وعزل قسم عقد من الإتقان تماماً عن الجافا سكريبت الميت
        if (document.getElementById('excellence-title')) document.getElementById('excellence-title').textContent = data.homepage.excellence.title;
        if (document.getElementById('excellence-description')) document.getElementById('excellence-description').textContent = data.homepage.excellence.description;
        
        const excellenceTrack = document.getElementById('excellence-images-track');
        if (excellenceTrack && data.homepage.excellence.images) {
            let imagesHtml = data.homepage.excellence.images.map(img => `<a href="menu.html" class="perfection-slide-node"><img src="${img}" alt="إتقان حلويات بوسي" loading="lazy"></a>`).join('');
            excellenceTrack.innerHTML = imagesHtml + imagesHtml + imagesHtml + imagesHtml;
        }

        function createProductCardHTML(product) {
            return `
                <div class="product-card-unified" data-slug="${product.slug}">
                    <img src="${product.images[0]}" class="product-card-img" alt="${product.title}" loading="lazy">
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
            let items = data.products.filter(p => data.homepage.mostSelling.includes(p.slug));
            mostSellingGrid.innerHTML = items.map(p => createProductCardHTML(p)).join('');
            if (window.innerWidth <= 767) mostSellingGrid.className = "bose-most-selling-grid-slider";
            initializeBoseSliderLogic(mostSellingGrid, 'most-selling-dots');
        }

        const newArrivalsGrid = document.getElementById('new-arrivals-grid');
        if (newArrivalsGrid) {
            let items = data.products.filter(p => data.homepage.newArrivals.includes(p.slug));
            newArrivalsGrid.innerHTML = items.map(p => createProductCardHTML(p)).join('');
            if (window.innerWidth <= 767) newArrivalsGrid.className = "bose-new-arrivals-grid-slider";
            initializeBoseSliderLogic(newArrivalsGrid, 'new-arrivals-dots');
        }

        const ourProductsGrid = document.getElementById('our-products-grid');
        if (ourProductsGrid) {
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

        const categoriesTrack = document.getElementById('categories-track');
        if (categoriesTrack && data.homepage.categoriesSlider) {
            categoriesTrack.innerHTML = data.homepage.categoriesSlider.map(cat => {
                let catUrl = `category.html?id=${cat.id}`;
                if (cat.id === "taswaq-toort") catUrl = "cake-builder.html";
                if (cat.id === "taswaq-flowers") catUrl = "flower-builder.html";
                return `<div class="bose-category-slider-card"><a href="${catUrl}"><img src="${cat.image}" class="category-img" alt="${cat.title}" loading="lazy"><div class="category-title-display">${cat.title}</div></a></div>`;
            }).join('');
            initializeBoseSliderLogic(categoriesTrack, 'categories-dots', true); 
        }
    }

    function initializeBoseSliderLogic(sliderTrack, dotsContainerId, isCategoryType = false) {
        if (!sliderTrack) return;
        let isDown = false; let startX; let scrollLeft;
        
        sliderTrack.addEventListener('mousedown', (e) => { isDown = true; startX = e.pageX - sliderTrack.offsetLeft; scrollLeft = sliderTrack.scrollLeft; });
        sliderTrack.addEventListener('mouseleave', () => { isDown = false; });
        sliderTrack.addEventListener('mouseup', () => { isDown = false; updateSliderDots(sliderTrack, dotsContainerId, isCategoryType); });
        sliderTrack.addEventListener('mousemove', (e) => { if(!isDown) return; e.preventDefault(); const x = e.pageX - sliderTrack.offsetLeft; const walk = (x - startX) * 1.5; sliderTrack.scrollLeft = scrollLeft - walk; });
        sliderTrack.addEventListener('touchstart', (e) => { isDown = true; startX = e.touches[0].pageX - sliderTrack.offsetLeft; scrollLeft = sliderTrack.scrollLeft; }, {passive: true});
        sliderTrack.addEventListener('touchmove', (e) => { if(!isDown) return; const x = e.touches[0].pageX - sliderTrack.offsetLeft; const walk = (x - startX) * 1.5; sliderTrack.scrollLeft = scrollLeft - walk; }, {passive: true});
        sliderTrack.addEventListener('touchend', () => { isDown = false; updateSliderDots(sliderTrack, dotsContainerId, isCategoryType); });
        sliderTrack.addEventListener('scroll', () => { if (!isDown) { updateSliderDots(sliderTrack, dotsContainerId, isCategoryType); } }, {passive: true});
        buildSliderDots(sliderTrack, dotsContainerId, isCategoryType);
    }

    function buildSliderDots(track, containerId, isCategoryType) {
        const container = document.getElementById(containerId);
        if (!container) return; container.innerHTML = '';
        const totalItems = track.children.length; if(totalItems === 0) return;
        const cardWidth = isCategoryType ? 280 : (track.children[0].offsetWidth || 280);
        const visibleItemsCount = Math.max(1, Math.floor(track.offsetWidth / cardWidth)); 
        const dotsCount = Math.max(1, totalItems - visibleItemsCount + 1);
        for (let i = 0; i < Math.min(dotsCount, 8); i++) {
            const dot = document.createElement('span'); dot.className = 'bose-slider-dot' + (i === 0 ? ' active' : ''); container.appendChild(dot);
        }
    }

    function updateSliderDots(track, containerId, isCategoryType) {
        const container = document.getElementById(containerId);
        if (!container || !track.children.length) return;
        const finalCardWidth = (isCategoryType ? 280 : track.children[0].offsetWidth) + 16;
        const activeIndex = Math.round(Math.abs(track.scrollLeft) / finalCardWidth);
        const dots = container.querySelectorAll('.bose-slider-dot');
        dots.forEach((dot, idx) => { if (idx === activeIndex % (dots.length || 1)) dot.classList.add('active'); else dot.classList.remove('active'); });
    }

    window.modifyBoseQtyCard = function(button, change) {
        const counterWrapper = button.parentElement;
        const input = counterWrapper.querySelector('.input-qty-value');
        let currentVal = parseInt(input.value, 10) || 1;
        currentVal += change; if (currentVal < 1) currentVal = 1;
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
        
        if (existingIndex > -1) cart[existingIndex].quantity += quantity;
        else cart.push(cartItem);
        
        localStorage.setItem('bose_cart', JSON.stringify(cart));
        window.updateGlobalCartCounter();
        window.refreshSidebarMiniCartDisplay(); 
        showBoseToast(`تمت إضافة ${product.title} إلى السلة.`);
    };

    function showBoseToast(message) {
        let container = document.getElementById('bose-toast-central-container');
        if (!container) { container = document.createElement('div'); container.id = 'bose-toast-central-container'; container.className = 'bose-toast-container'; document.body.appendChild(container); }
        const toast = document.createElement('div'); toast.className = 'bose-toast-node'; toast.textContent = message; container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3000);
    }

    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return ""; let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        else if (cleaned.startsWith("00201")) cleaned = "0" + cleaned.substring(4);
        return cleaned;
    };

    window.updateGlobalCartCounter = function() {
        const cartCountBadge = document.getElementById('nav-cart-count'); if (!cartCountBadge) return;
        const rawCart = localStorage.getItem('bose_cart'); const cart = rawCart ? JSON.parse(rawCart) : [];
        let totalDisplayItems = 0;
        cart.forEach(item => { const isBespoke = item.id && item.id.includes("-"); totalDisplayItems += isBespoke ? 1 : (parseInt(item.quantity, 10) || 1); });
        cartCountBadge.textContent = totalDisplayItems;
    };

    window.onBoseDatabaseReady = function(callback) { if (window.BoseStoreData) { callback(window.BoseStoreData); } };
    function applyGlobalSEOAndBranding() { document.title = window.BoseStoreData.seo.title; applyGlobalStyles(window.BoseStoreData.store.theme); }
    function injectEarlyDependencies() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link'); fa.rel = 'stylesheet'; fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'; document.head.appendChild(fa);
        }
    }

    function applyGlobalStyles(theme) {
        if (document.getElementById('bose-global-dynamic-styles')) return;
        const styleElement = document.createElement('style'); styleElement.id = 'bose-global-dynamic-styles';
        styleElement.textContent = `
            :root {
                --bose-pink: ${theme.primary || '#FF91A4'}; --bose-white: ${theme.background || '#FFFFFF'};
                --bose-black: ${theme.text || '#111111'}; --bose-gold: ${theme.secondary || '#D4AF37'};
                --bose-shadow-glow: 0 8px 32px rgba(255, 145, 164, 0.12); --bose-shadow-hover: 0 16px 40px rgba(255, 145, 164, 0.22);
                --bose-border-pink: 1px solid rgba(255, 145, 164, 0.3); --bose-border-thick: 2px solid ${theme.primary || '#FF91A4'};
            }
            body { font-family: 'Cairo', sans-serif !important; background-color: var(--bose-white) !important; color: var(--bose-black) !important; }
            #top-bar-marquee-track { direction: ltr !important; }
            @keyframes boseMarquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
            @keyframes boseWaterfallUp { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(0, -50%, 0); } }
            @keyframes boseWaterfallDown { 0% { transform: translate3d(0, -50%, 0); } 100% { transform: translate3d(0, 0, 0); } }
            @keyframes boseExcellenceLoop { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
            .animate-marquee { display: flex; width: max-content; animation: boseMarquee 25s linear infinite; will-change: transform; }
            .waterfall-up { animation: boseWaterfallUp 40s linear infinite; will-change: transform; }
            .waterfall-down { animation: boseWaterfallDown 40s linear infinite; will-change: transform; }
            .bose-excellence-animate-loop { display: flex !important; width: max-content !important; direction: ltr !important; animation: boseExcellenceLoop 20s linear infinite !important; will-change: transform; }
        `;
        document.head.appendChild(styleElement);
    }

    function showGlobalFriendlyError() {
        const errorDiv = document.createElement('div'); errorDiv.className = 'global-error-banner-node';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.'; document.body.appendChild(errorDiv);
    }

    loadStoreDatabase();
})();