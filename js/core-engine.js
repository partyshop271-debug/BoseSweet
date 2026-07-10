/**
 * 📑 الدليل الهندسي للمواصفات القياسية الفاخرة - النسخة الكاملة والمطورة V4
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
                // جلب قاعدة البيانات من المسار المعتمد والصحيح هندسياً
                const response = await fetch('data/site-data-final.json');
                if (!response.ok) throw new Error('فشل جلب ملف قاعدة البيانات الرئيسي.');
                
                const serverDateHeader = response.headers.get('Date');
                if (serverDateHeader) {
                    const serverTime = new Date(serverDateHeader).getTime();
                    const clientTime = Date.now();
                    window.boseServerTimeOffset = serverTime - clientTime;
                }
                
                window.BoseStoreData = await response.json();
                
                // 1. إدارة وضخ العناصر العالمية المشتركة في كل الصفحات لتوحيد الواجهات
                injectEarlyDependencies();
                applyGlobalStyles(window.BoseStoreData.store.theme);
                renderUniversalHeader();
                renderUniversalSidebar();
                renderUniversalFooter();
                
                // 2. تحديثات الحالة العامة والـ SEO
                applyGlobalSEOAndBranding();
                window.updateGlobalCartCounter();
                
                // 3. الفحص الجغرافي للواجهة: إذا كنا في الصفحة الرئيسية، يتم تفعيل محرك ضخ الأقسام تلقائياً
                if (document.getElementById('hero-section') || document.querySelector('.bose-waterfall-section-container') || !!document.getElementById('most-selling-grid')) {
                    renderMainPageSections();
                }
                
                // تفعيل حدث مخصص لباقي المحركات والملفات المعتمدة على البيانات لمنع التعارض
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
        if (sidebarPanel) sidebarPanel.remove(); // منع التكرار التكديسي
        
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

        // ربط أحداث القائمة المتطورة فوراً بطريقة مستقرة مئة بالمئة للكمبيوتر والموبايل
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
                <a href="https://wa.me/${window.BoseStoreData.sanitizeBosePhoneNumber(window.BoseStoreData.social.whatsapp)}" class="social-link-whatsapp" target="_blank" aria-label="واتساب حلويات بوسي"><i class="fab fa-whatsapp"></i></a>
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
       🏪 محرك الصفحة الرئيسية وضخ الأقسام الـ 10 (Main Page Layout Engine)
       ========================================================================== */

    function renderMainPageSections() {
        const data = window.BoseStoreData;

        // ضخ رسائل الهيرو والأوصاف لمنع الفراغات البصرية
        const heroDesc = document.getElementById('hero-description');
        const heroBtn = document.getElementById('hero-cta-btn');
        if (heroDesc) heroDesc.textContent = data.homepage.hero.description;
        if (heroBtn) {
            heroBtn.textContent = data.homepage.hero.cta;
            heroBtn.href = "menu.html";
        }

        // شريط علوي متحرك لضمان حركة لانهائية بدون أي فراغات مرئية
        const tickerTrack = document.getElementById('top-bar-marquee-track');
        if (tickerTrack && data.navigation.topBarMessages) {
            let messagesHTML = data.navigation.topBarMessages.map(msg => `
                <span class="bose-ticker-item"><i class="fas fa-sparkles"></i> ${msg}</span>
            `).join('');
            tickerTrack.innerHTML = `${messagesHTML}${messagesHTML}`;
        }

        // قسم شلال المنتجات البصري الأنيق المتعاكس الحركة بدون فراغات بصرية
        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        if (leftCol && rightCol && data.homepage.waterfall) {
            let leftHTML = data.homepage.waterfall.leftColumnImages.map(img => `<img src="${img}" alt="شلال بوسي الفاخر">`).join('');
            let rightHTML = data.homepage.waterfall.rightColumnImages.map(img => `<img src="${img}" alt="شلال بوسي الفاخر">`).join('');
            leftCol.innerHTML = `<div class="waterfall-up">${leftHTML}${leftHTML}</div>`;
            rightCol.innerHTML = `<div class="waterfall-down">${rightHTML}${rightHTML}</div>`;
        }

        // قسم عقد من الإتقان - مجرى حركة أفقي تلقائي متصل لملء الشاشة
        const excellenceTrack = document.getElementById('excellence-images-track');
        const excellenceTitle = document.getElementById('excellence-title');
        const excellenceDesc = document.getElementById('excellence-description');
        if (excellenceTitle) excellenceTitle.textContent = data.homepage.excellence.title;
        if (excellenceDesc) excellenceDesc.textContent = data.homepage.excellence.description;
        if (excellenceTrack && data.homepage.excellence.images) {
            let trackHTML = data.homepage.excellence.images.map(img => `
                <div class="bose-perfection-card" onclick="window.location.href='menu.html'">
                    <div class="perfection-card-img-holder">
                        <img src="${img}" alt="إتقان حلويات بوسي">
                    </div>
                </div>
            `).join('');
            excellenceTrack.innerHTML = `${trackHTML}${trackHTML}`;
            renderDotsSystem('excellence-dots', data.homepage.excellence.images.length);
        }

        // ضخ نصوص المحاكيات (التورت والورد) وصمامات الأمان الخاصة بها
        const cakeTitle = document.getElementById('cake-preview-title');
        const cakeDesc = document.getElementById('cake-preview-desc');
        const cakeCta = document.getElementById('cake-preview-cta');
        const cakeImg = document.getElementById('cake-preview-img');
        if (cakeTitle) cakeTitle.textContent = data.homepage.cakePreview.title;
        if (cakeDesc) cakeDesc.textContent = data.homepage.cakePreview.description;
        if (cakeCta) {
            cakeCta.textContent = data.homepage.cakePreview.cta;
            cakeCta.href = data.homepage.cakePreview.target;
        }
        if (cakeImg) cakeImg.src = data.homepage.cakePreview.image;

        const flowerTitle = document.getElementById('flower-preview-title');
        const flowerDesc = document.getElementById('flower-preview-desc');
        const flowerCta = document.getElementById('flower-preview-cta');
        const flowerImg = document.getElementById('flower-preview-img');
        if (flowerTitle) flowerTitle.textContent = data.homepage.flowerPreview.title;
        if (flowerDesc) flowerDesc.textContent = data.homepage.flowerPreview.description;
        if (flowerCta) {
            flowerCta.textContent = data.homepage.flowerPreview.cta;
            flowerCta.href = data.homepage.flowerPreview.target;
        }
        if (flowerImg) flowerImg.src = data.homepage.flowerPreview.image;

        // ضخ شبكات العناوين للمجموعات (الأكثر مبيعاً، وصل حديثاً)
        const msTitle = document.getElementById('most-selling-title');
        const msDesc = document.getElementById('most-selling-description');
        if (msTitle) msTitle.textContent = "الأكثر مبيعاً";
        if (msDesc) msDesc.textContent = "تشكيلة حصرية من الأصناف الأكثر طلباً وشهية التي نالت ثقة عملائنا.";
        injectProductGrid('most-selling-grid', data.homepage.mostSelling);
        renderDotsSystem('most-selling-dots', 4);

        const naTitle = document.getElementById('new-arrivals-title');
        const naDesc = document.getElementById('new-arrivals-description');
        if (naTitle) naTitle.textContent = "وصل حديثاً";
        if (naDesc) naDesc.textContent = "اكتشف أحدث ابتكارات وتوليفات نكهاتنا المبتكرة والفريدة المصنوعة بشغف.";
        injectProductGrid('new-arrivals-grid', data.homepage.newArrivals);
        renderDotsSystem('new-arrivals-dots', 3);

        // قسم منتجاتنا - التوزيع الثنائي المتوازن الصارم (4 كروت أولية وعرض ديناميكي)
        const ourTitle = document.getElementById('our-products-title');
        const ourDesc = document.getElementById('our-products-description');
        if (ourTitle) ourTitle.textContent = "منتجاتنا الفاخرة";
        if (ourDesc) ourDesc.textContent = "استعرض التشكيلة الكاملة والمنوعة المعدة طازجة يومياً بمكونات طبيعية 100%.";
        injectProductsOurSection();

        // قسم الفخر والاعتزاز - العدادات الرقمية التصاعدية الذكية لمنع الـ NaN
        const prideTitle = document.getElementById('pride-main-title');
        const prideText = document.getElementById('pride-main-text');
        if (prideTitle) prideTitle.textContent = data.homepage.pride.title;
        if (prideText) prideText.textContent = data.homepage.pride.text;
        
        const stats = data.homepage.pride.stats;
        if (stats) {
            setupStatNode('stat-years-value', 'stat-years-label', stats.years);
            setupStatNode('stat-customers-value', 'stat-customers-label', stats.customers);
            setupStatNode('stat-orders-value', 'stat-orders-label', stats.orders);
            setupStatNode('stat-cakes-value', 'stat-cakes-label', stats.cakes);
            setupStatNode('stat-bouquets-value', 'stat-bouquets-label', stats.bouquets);
            triggerCounterAnimations();
        }

        // قسم تسوق حسب الفئة - مجرى الـ 12 كارت ذو الوزن البصري الأكبر بـ 30%
        const catTitle = document.getElementById('categories-section-title');
        const catDesc = document.getElementById('categories-section-subtitle');
        if (catTitle) catTitle.textContent = "تسوق حسب الفئة";
        if (catDesc) catDesc.textContent = "انتقل مباشرة وبكل سهولة إلى فئتك المفضلة لاستكشاف نكهاتها الخاصة وأسعارها.";
        
        const categoriesTrack = document.getElementById('categories-track');
        if (categoriesTrack && data.homepage.categoriesSlider) {
            let catHTML = data.homepage.categoriesSlider.map(cat => `
                <div class="category-slide-card" onclick="window.location.href='category.html?id=${cat.id}'" style="flex-shrink:0; cursor:pointer;">
                    <img src="${cat.image}" alt="${cat.title}">
                    <span class="brand-name-display" style="display:block; text-align:center; margin-top:12px; font-size:20px; font-weight:700;">${cat.title}</span>
                </div>
            `).join('');
            categoriesTrack.innerHTML = `${catHTML}${catHTML}`;
            renderDotsSystem('categories-dots', data.homepage.categoriesSlider.length);
        }
    }

    function setupStatNode(valId, labelId, statObj) {
        const valEl = document.getElementById(valId);
        const labelEl = document.getElementById(labelId);
        if (valEl && labelEl && statObj) {
            valEl.setAttribute('data-target', statObj.value);
            valEl.textContent = "0";
            labelEl.textContent = statObj.label;
            
            // تنظيف الحاوية لمنع التراكم الإلحاقي
            const oldSuffix = valEl.parentNode.querySelector('.stat-suffix');
            if(oldSuffix) oldSuffix.remove();
            
            valEl.insertAdjacentHTML('afterend', `<span class="stat-suffix" style="font-size:24px; font-weight:700; color:var(--bose-black); margin-left:4px;">${statObj.suffix}</span>`);
        }
    }

    function renderDotsSystem(containerId, count) {
        const container = document.getElementById(containerId);
        if (!container) return;
        let dotsHTML = '';
        for (let i = 0; i < count; i++) {
            dotsHTML += `<button class="bose-dot ${i === 0 ? 'active' : ''}"></button>`;
        }
        container.innerHTML = dotsHTML;
    }

    function injectProductGrid(targetId, slugList) {
        const gridContainer = document.getElementById(targetId);
        if (!gridContainer || !slugList) return;

        const filteredProducts = window.BoseStoreData.products.filter(p => slugList.includes(p.slug));
        gridContainer.innerHTML = filteredProducts.map(p => createStrictProductCardHTML(p)).join('');
        bindCardEvents(gridContainer);
    }

    function injectProductsOurSection() {
        const gridContainer = document.getElementById('our-products-grid');
        if (!gridContainer) return;

        const allSlugs = window.BoseStoreData.homepage.ourProducts;
        const allProducts = window.BoseStoreData.products.filter(p => allSlugs.includes(p.slug));
        
        const initialProducts = allProducts.slice(0, 4);
        gridContainer.innerHTML = initialProducts.map(p => createStrictProductCardHTML(p)).join('');
        bindCardEvents(gridContainer);

        const showMoreBtn = document.getElementById('our-products-show-more');
        if (showMoreBtn) {
            showMoreBtn.textContent = "إظهار المزيد";
            showMoreBtn.onclick = () => {
                const remainingProducts = allProducts.slice(4);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = remainingProducts.map(p => createStrictProductCardHTML(p)).join('');
                
                while (tempDiv.firstChild) {
                    gridContainer.appendChild(tempDiv.firstChild);
                }
                bindCardEvents(gridContainer);
                showMoreBtn.style.display = 'none'; 
            };
        }
    }

    function createStrictProductCardHTML(product) {
        const displayPrice = window.calculateBosePrice(product.price || product.basePrice, "menu-only");
        const flavorDisplay = product.flavorName ? `<span class="product-card-flavor-name" style="color:var(--bose-pink); font-size:0.85rem; font-weight:700; display:block; margin:4px 0;">${product.flavorName}</span>` : '';
        
        return `
            <div class="product-card" data-slug="${product.slug}" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div class="product-card-top" onclick="window.location.href='product.html?slug=${product.slug}'" style="cursor:pointer;">
                    <img class="product-card-img" src="${product.images[0]}" alt="${product.title}">
                    <h3 class="product-card-title" style="margin-top:8px; font-size:1rem;">${product.title}</h3>
                    ${flavorDisplay}
                    <p class="product-card-desc" style="font-size:0.8rem; opacity:0.7; margin:6px 0; line-height:1.4;">${product.flavorDesc || product.description.substring(0, 75) + '...'}</p>
                </div>
                <div class="product-card-bottom" style="margin-top:auto;">
                    <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:12px; direction:ltr;">
                        <button class="btn-qty-plus" style="width:30px; height:30px; background:rgba(255,145,164,0.1); color:var(--bose-pink); border-radius:50%; font-weight:700; cursor:pointer;">+</button>
                        <input class="input-qty-value" type="number" value="1" min="1" readonly style="width:40px; text-align:center; font-weight:700; border:none; color:var(--bose-black);">
                        <button class="btn-qty-minus" style="width:30px; height:30px; background:rgba(255,145,164,0.1); color:var(--bose-pink); border-radius:50%; font-weight:700; cursor:pointer;">-</button>
                    </div>
                    <div class="product-card-price" style="text-align:center; font-size:1.1rem; margin-bottom:8px;">${Math.round(displayPrice)} جنيه</div>
                    <button class="btn-add-to-cart" style="width:100%; padding:10px; background:var(--bose-pink); color:#fff; border-radius:12px; font-weight:700; cursor:pointer; transition:var(--bose-transition-smooth);">اضافة للسلة</button>
                </div>
            </div>
        `;
    }

    function bindCardEvents(container) {
        container.querySelectorAll('.product-card').forEach(card => {
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
                        showCentralToast("تمت إضافة المنتج إلى السلة.");
                    }
                };
            }
        });
    }

    function showCentralToast(msg) {
        let container = document.getElementById('bose-toast-central-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-central-container';
            container.className = 'bose-toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'bose-toast-card bose-toast-active';
        toast.innerHTML = `<div class="bose-toast-content"><p class="bose-toast-text">${msg}</p></div>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('bose-toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 2000);
    }

    function triggerCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            if(!target) return;
            const speed = 60;
            const updateCount = () => {
                const count = +counter.innerText;
                const inc = target / speed;
                if (count < target) {
                    counter.innerText = Math.ceil(count + inc);
                    setTimeout(updateCount, 20);
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
            .bose-drawer-menu { position: fixed; top: 0; right: 0; width: 340px; max-width: 85vw; height: 100vh; background: #fff !important; z-index: 30000; transform: translate3d(100%, 0, 0); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
            .bose-drawer-menu.active { transform: translate3d(0, 0, 0) !important; }
            .bose-drawer-panel-content { display: flex; flex-direction: column; height: 100vh; width: 100%; }
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