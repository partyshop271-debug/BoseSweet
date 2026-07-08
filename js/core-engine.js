/**
 * 👑 المحرك المركزي العام والنهائي للموقع والنافذة العائمة - حلويات بوسي 👑
 * النسخة الهندسية القياسية الشاملة بنسبة 100% - خالية تماماً من الثغرات البرمجية والمالية ومشاكل التداخل V40.0
 * متوافق بشكل مطلق وثنائي الاتجاه مع كافة ملفات css/ وجافا سكريبت الموقع وقاعدة البيانات site-data-final.json
 */

(function () {
    "use strict";

    // 🎨 نظام الألوان الحاكمة والمقدسة للعلامة التجارية للهندسة البصرية الرقمية (The Strict Palette)
    const BRAND_COLORS = {
        pink: "#FF91A4",  // نبض الحياة في الموقع
        white: "#FFFFFF", // المسيطر تماماً على الخلفيات والمساحات للتنفس البصري
        black: "#111111", // النصوص والعناوين فقط - معزول تماماً عن الظلال والخلفيات
        gold: "#D4AF37",  // وجود رمزي ناعم وخفيف جداً لفخامة اللوجو
        cream: "#FFF5F6"  // خلفية دافئة ناعمة للفواصل وكروت السلة
    };

    // 🔑 مفتاح تخزين السلة الموحد والثابت عبر كافة محركات الموقع لضمان التزامن الكامل
    const CART_STORAGE_KEY = 'bose_cart';
    
    // 🧠 ذاكرة البيانات المركزية للموقع (Global Singleton Pattern) لمنع تكرار الاتصال بالخادم
    let boseGlobalStoreData = null;
    let databaseReadyCallbacks = [];

    /* ==========================================================================\
       1. حارس التمهيد واستدعاء قاعدة البيانات المعتمدة site-data-final.json
       ========================================================================== */
    async function loadBoseAbsoluteDatabase() {
        try {
            // صمام أمان لتحديد المسار الصحيح للملف سواء كنا في الصفحة الرئيسية أو صفحة فرعية
            const isSubPage = window.location.pathname.includes('/css/') || window.location.pathname.includes('/js/');
            const jsonPath = isSubPage ? '../data/site-data-final.json' : 'data/site-data-final.json';

            const response = await fetch(jsonPath);
            if (!response.ok) {
                const fallbackResponse = await fetch('data/site-data-final.json');
                if (!fallbackResponse.ok) throw new Error(`فشل جلب البيانات: ${fallbackResponse.status}`);
                boseGlobalStoreData = await fallbackResponse.json();
            } else {
                boseGlobalStoreData = await response.json();
            }
            
            // إطلاق الحدث العالمي لإعلام كافة المحركات الفرعية بنجاح التحميل الآمن
            window.BoseStoreData = boseGlobalStoreData;
            
            // حقن الأيقونات والخطوط والأنماط الحيوية فوراً لمنع وميض الألوان والأيقونات المكسورة
            injectEarlyDependencies();
            
            document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: boseGlobalStoreData }));
            
            // تنفيذ كافة المهام المؤجلة المنتظرة لقاعدة البيانات فوراً لمنع الـ Race Condition
            databaseReadyCallbacks.forEach(callback => callback(boseGlobalStoreData));
            databaseReadyCallbacks = [];

            // تهيئة الخصائص المركزية للموقع والسلة العائمة فوراً
            initializeGlobalFeatures();
            
        } catch (error) {
            console.error("❌ حارس البيانات المركزي: تعذر تحميل قاعدة البيانات السيادية.", error);
            injectFallbackErrorDisplay();
        }
    }

    window.onBoseDatabaseReady = function (callback) {
        if (boseGlobalStoreData) {
            callback(boseGlobalStoreData);
        } else {
            databaseReadyCallbacks.push(callback);
        }
    };

    // حقن مكتبات الخطوط والـ FontAwesome برمجياً في الـ Head لتجنب أخطاء التحميل واختفاء الأيقونات
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

        if (!document.querySelector('link[href*="all.min.css"]')) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(faLink);
        }
    }

    /* ==========================================================================\
       2. هيكلة وبناء نظام السلة العائمة التفاعلية الفاخرة ديناميكياً (Floating Cart Drawer)
       ========================================================================== */
    function injectFloatingCartSystem() {
        if (document.getElementById('bose-floating-cart-wrapper')) return;

        const triggerButton = document.createElement('button');
        triggerButton.id = 'bose-floating-cart-trigger';
        triggerButton.setAttribute('aria-label', 'استعراض سلة المشتريات العائمة');
        triggerButton.innerHTML = `
            <div class="bose-trigger-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span id="bose-floating-badge-counter">0</span>
            </div>
        `;

        const cartDrawer = document.createElement('div');
        cartDrawer.id = 'bose-floating-cart-drawer';
        cartDrawer.innerHTML = `
            <div class="bose-drawer-header">
                <div class="bose-drawer-title-box">
                    <h3>سلة المشتريات العائمة</h3>
                    <span id="bose-drawer-items-count">(0 منتجات)</span>
                </div>
                <button id="bose-close-drawer-trigger" aria-label="إغلاق السلة">&times;</button>
            </div>
            <div id="bose-drawer-items-body" class="bose-drawer-body-scroll"></div>
            <div class="bose-drawer-footer">
                <div class="bose-drawer-summary-row">
                    <span>إجمالي السلة التقريبي:</span>
                    <strong id="bose-drawer-subtotal-value">0 EGP</strong>
                </div>
                <div class="bose-drawer-actions-grid">
                    <a href="cart.html" class="bose-btn-secondary-drawer">معاينة السلة كاملة</a>
                    <a href="checkout.html" class="bose-btn-primary-drawer">إتمام الشراء فوراً</a>
                </div>
                <p class="bose-drawer-footer-notice">✨ خاماتنا طبيعية 100% وصُنعت بحب خصيصاً لأجلك.</p>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.id = 'bose-floating-cart-overlay';

        const container = document.createElement('div');
        container.id = 'bose-floating-cart-wrapper';
        container.appendChild(triggerButton);
        container.appendChild(cartDrawer);
        container.appendChild(overlay);
        document.body.appendChild(container);

        injectFloatingCartStyles();

        triggerButton.addEventListener('click', openBoseCartDrawer);
        document.getElementById('bose-close-drawer-trigger').addEventListener('click', closeBoseCartDrawer);
        overlay.addEventListener('click', closeBoseCartDrawer);
    }

    function openBoseCartDrawer() {
        const drawer = document.getElementById('bose-floating-cart-drawer');
        const overlay = document.getElementById('bose-floating-cart-overlay');
        if (drawer && overlay) {
            renderFloatingCartItems();
            drawer.style.left = '0px';
            overlay.style.display = 'block';
            setTimeout(() => overlay.style.opacity = '1', 10);
            document.body.style.overflow = 'hidden';
        }
    }

    function closeBoseCartDrawer() {
        const drawer = document.getElementById('bose-floating-cart-drawer');
        const overlay = document.getElementById('bose-floating-cart-overlay');
        if (drawer && overlay) {
            drawer.style.left = '-420px';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    /* ==========================================================================\
       3. رندرة وإدارة بيانات عناصر السلة العائمة والمزامنة المطلقة
       ========================================================================== */
    function getInMemoryCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveInMemoryCart(cart) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        document.dispatchEvent(new CustomEvent('BoseCartUpdated'));
    }

    function renderFloatingCartItems() {
        const bodyContainer = document.getElementById('bose-drawer-items-body');
        const subtotalDisplay = document.getElementById('bose-drawer-subtotal-value');
        const countDisplay = document.getElementById('bose-drawer-items-count');
        
        if (!bodyContainer) return;

        const cart = getInMemoryCart();
        countDisplay.textContent = `(${cart.length} منتجات)`;

        if (cart.length === 0) {
            bodyContainer.innerHTML = `
                <div class="bose-drawer-empty-state">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#FF91A4" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    <p>سلتك فاضية دلوقتي.. تصفح المنيو واستمتع بأجود الحلويات الفاخرة 🌸</p>
                    <button class="bose-btn-primary-drawer" onclick="document.getElementById('bose-close-drawer-trigger').click();">ابدأ التسوق</button>
                </div>
            `;
            subtotalDisplay.textContent = "0 EGP";
            return;
        }

        let totalSum = 0;
        bodyContainer.innerHTML = cart.map((item, index) => {
            const price = Math.round(Number(item.finalPrice || item.price || 0));
            const qty = Number(item.quantity || 1);
            const itemTotal = price * qty;
            totalSum += itemTotal;

            let customizationHTML = '';
            if (item.customDetails) {
                const cd = item.customDetails;
                const specs = [];
                if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") specs.push(`الطعم: ${cd.cakeType}`);
                if (cd.persons && cd.persons > 0) specs.push(`الأفراد: ${cd.persons}`);
                if (cd.flowerCount && cd.flowerCount > 0) specs.push(`الورد: ${cd.flowerCount}`);
                if (specs.length > 0) {
                    customizationHTML = `<div class="bose-drawer-item-specs">${specs.join(' | ')}</div>`;
                }
            }

            const imgUrl = item.image || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png';

            return `
                <div class="bose-drawer-card" data-index="${index}">
                    <img src="${imgUrl}" alt="${item.title || 'منتجحلويات بوسي'}" class="bose-drawer-card-img">
                    <div class="bose-drawer-card-info">
                        <h4>${item.title || 'منتج فاخر'}</h4>
                        ${customizationHTML}
                        <div class="bose-drawer-card-pricing">
                            <span class="bose-drawer-card-price">${price} EGP</span>
                            <div class="bose-drawer-qty-control">
                                <button class="bose-drawer-qty-btn minus" data-index="${index}">&minus;</button>
                                <span class="bose-drawer-qty-value">${qty}</span>
                                <button class="bose-drawer-qty-btn plus" data-index="${index}">&plus;</button>
                            </div>
                        </div>
                    </div>
                    <button class="bose-drawer-card-remove" data-index="${index}" aria-label="حذف المنتج">&times;</button>
                </div>
            `;
        }).join('');

        subtotalDisplay.textContent = `${Math.round(totalSum)} EGP`;

        bindFloatingCartActions();
    }

    function bindFloatingCartActions() {
        document.querySelectorAll('.bose-drawer-qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                const cart = getInMemoryCart();
                if (cart[index]) {
                    cart[index].quantity = (Number(cart[index].quantity) || 1) + 1;
                    saveInMemoryCart(cart);
                    renderFloatingCartItems();
                }
            });
        });

        document.querySelectorAll('.bose-drawer-qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                const cart = getInMemoryCart();
                if (cart[index]) {
                    const currentQty = (Number(cart[index].quantity) || 1);
                    if (currentQty > 1) {
                        cart[index].quantity = currentQty - 1;
                        saveInMemoryCart(cart);
                        renderFloatingCartItems();
                    } else {
                        cart.splice(index, 1);
                        saveInMemoryCart(cart);
                        renderFloatingCartItems();
                        window.showBoseToast("تم تحديث السلة وحذف القطعة برفق 🌸");
                    }
                }
            });
        });

        document.querySelectorAll('.bose-drawer-card-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                const cart = getInMemoryCart();
                cart.splice(index, 1);
                saveInMemoryCart(cart);
                renderFloatingCartItems();
                window.showBoseToast("تم إزالة المنتج من السلة العائمة 🌸");
            });
        });
    }

    /* ==========================================================================\
       4. المايسترو العالمي لإدارة وعرض التنبيهات الراقية الفاخرة (Toast System)
       ========================================================================== */
    window.showBoseToast = function (message, type = 'success') {
        let container = document.getElementById('bose-toast-central-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-central-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `bose-toast-card bose-toast-${type}`;
        toast.innerHTML = `
            <div class="bose-toast-content">
                <span class="bose-toast-sparkle">🌸</span>
                <p class="bose-toast-text">${message}</p>
            </div>
        `;

        container.appendChild(toast);
        setTimeout(() => toast.classList.add('bose-toast-active'), 10);
        
        setTimeout(() => {
            toast.classList.remove('bose-toast-active');
            toast.classList.add('bose-toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    };

    window.addAbsoluteProductToCart = function (productObject) {
        if (!productObject || !productObject.id) return;
        
        const cart = getInMemoryCart();
        const existingIndex = cart.findIndex(item => item.id === productObject.id && !item.customDetails?.isCustomized);
        
        if (existingIndex > -1) {
            cart[existingIndex].quantity = (Number(cart[existingIndex].quantity) || 1) + 1;
        } else {
            cart.push({
                id: productObject.id,
                productSlug: productObject.slug,
                title: productObject.title,
                flavorName: productObject.flavorName || "افتراضي",
                price: productObject.price,
                finalPrice: productObject.price,
                image: productObject.images ? productObject.images[0] : productObject.image,
                quantity: 1,
                type: productObject.type || "standard",
                customDetails: {}
            });
        }
        
        saveInMemoryCart(cart);
        window.showBoseToast(`تمت إضافة ${productObject.title} إلى السلة العائمة بنجاح 🌸`);
        openBoseCartDrawer();
    };

    /* ==========================================================================\
       5. مهندس ومولد كروت المنتجات الصارم (تم حل ثغرة undefined بقراءة title)
       ========================================================================== */
    window.generateStrictProductCardHTML = function (product, currency = 'EGP') {
        if (!product) return '';
        const price = Math.round(Number(product.price || 0));
        const imgUrl = product.images ? product.images[0] : (product.image || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png');
        const displayTitle = product.title || product.name || 'منتج فاخر';
        const displayFlavor = product.flavorName || 'نكهة بوسي المميزة';
        const displayDesc = product.flavorDesc || product.description || '';
        
        return `
            <div class="product-card" data-slug="${product.slug}" style="background: ${BRAND_COLORS.white}; border: 1px solid rgba(255,145,164,0.2); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px; justify-content: space-between; position: relative; box-shadow: 0 4px 16px rgba(255,145,164,0.03); direction: rtl; text-align: right; min-width: 260px;">
                <div class="product-card-top" style="position: relative; overflow: hidden; border-radius: 12px; height: 180px; width: 100%;">
                    <img src="${imgUrl}" alt="${displayTitle}" style="width: 100%; height: 100%; object-fit: cover; transition: 0.3s;" loading="lazy">
                </div>
                <div class="product-card-info" style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                    <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: ${BRAND_COLORS.black};">${displayTitle}</h3>
                    <span style="font-size: 0.8rem; font-weight: 700; color: ${BRAND_COLORS.pink};">${displayFlavor}</span>
                    <p style="margin: 0; font-size: 0.75rem; color: #666; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px;">${displayDesc}</p>
                </div>
                <div class="product-card-bottom" style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                    <span style="font-size: 1rem; font-weight: 700; color: ${BRAND_COLORS.pink};">${price} ${currency}</span>
                    <button class="bose-add-to-cart-btn" data-id="${product.id}" style="background-color: ${BRAND_COLORS.pink}; color: ${BRAND_COLORS.white}; border: none; padding: 8px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: 0.2s;">إضافة للسلة</button>
                </div>
            </div>
        `;
    };

    window.attachProductCardEvents = function (containerElement, productsList, currency) {
        if (!containerElement || !productsList) return;
        
        containerElement.querySelectorAll('.bose-add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const prodId = this.dataset.id;
                const matchedProduct = productsList.find(p => String(p.id) === String(prodId));
                if (matchedProduct) {
                    window.addAbsoluteProductToCart(matchedProduct);
                }
            });
        });
    };

    /* ==========================================================================\
       6. تحديث عدادات السلة في كامل الهيكل العلوي للموقع (Sync Counters)
       ========================================================================== */
    function updateGlobalCartCounters() {
        const cart = getInMemoryCart();
        let totalItems = 0;
        cart.forEach(item => {
            totalItems += (Number(item.quantity) || 1);
        });

        const floatingBadge = document.getElementById('bose-floating-badge-counter');
        if (floatingBadge) {
            floatingBadge.textContent = totalItems;
            floatingBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        const headerCounters = document.querySelectorAll('.cart-count, #cart-badge-count, .bose-cart-counter-global, #nav-cart-count');
        headerCounters.forEach(counter => {
            counter.textContent = totalItems;
        });

        const drawer = document.getElementById('bose-floating-cart-drawer');
        if (drawer && drawer.style.left === '0px') {
            renderFloatingCartItems();
        }
    }

    function initializeGlobalFeatures() {
        injectFloatingCartSystem();
        updateGlobalCartCounters();
    }

    document.addEventListener('BoseCartUpdated', updateGlobalCartCounters);
    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) updateGlobalCartCounters();
    });

    function injectFloatingCartStyles() {
        if (document.getElementById('bose-floating-styles-block')) return;

        const styleBlock = document.createElement('style');
        styleBlock.id = 'bose-floating-styles-block';
        styleBlock.textContent = `
            #bose-floating-cart-trigger {
                position: fixed;
                bottom: 24px;
                left: 24px;
                width: 64px;
                height: 64px;
                background-color: ${BRAND_COLORS.white};
                border: 2px solid ${BRAND_COLORS.pink};
                border-radius: 50%;
                box-shadow: 0 8px 32px rgba(255,145,164,0.25);
                cursor: pointer;
                z-index: 999998;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
            }
            #bose-floating-cart-trigger:hover {
                transform: scale(1.08);
                box-shadow: 0 12px 40px rgba(255,145,164,0.4);
            }
            .bose-trigger-icon-box {
                position: relative;
                color: ${BRAND_COLORS.black};
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #bose-floating-badge-counter {
                position: absolute;
                top: -12px;
                right: -12px;
                background-color: ${BRAND_COLORS.pink};
                color: ${BRAND_COLORS.white};
                font-family: 'Cairo', sans-serif;
                font-weight: 700;
                font-size: 12px;
                min-width: 22px;
                height: 22px;
                border-radius: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
                box-sizing: border-box;
                border: 2px solid ${BRAND_COLORS.white};
            }
            #bose-floating-cart-drawer {
                position: fixed;
                top: 0;
                left: -420px;
                width: 100%;
                max-width: 400px;
                height: 100%;
                background-color: ${BRAND_COLORS.white};
                box-shadow: 25px 0 50px rgba(0,0,0,0.15);
                z-index: 999999;
                display: flex;
                flex-direction: column;
                transition: left 0.35s cubic-bezier(0.25, 1, 0.5, 1);
                direction: rtl;
                font-family: 'Cairo', sans-serif;
            }
            #bose-floating-cart-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(17, 17, 17, 0.4);
                backdrop-filter: blur(4px);
                z-index: 999997;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .bose-drawer-header {
                padding: 20px;
                border-bottom: 1px solid ${BRAND_COLORS.cream};
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .bose-drawer-title-box h3 {
                margin: 0;
                font-size: 18px;
                color: ${BRAND_COLORS.black};
                font-weight: 700;
            }
            #bose-drawer-items-count {
                font-size: 13px;
                color: ${BRAND_COLORS.pink};
                font-weight: 600;
            }
            #bose-close-drawer-trigger {
                background: none;
                border: none;
                font-size: 32px;
                color: ${BRAND_COLORS.black};
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            .bose-drawer-body-scroll {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background-color: ${BRAND_COLORS.cream};
            }
            .bose-drawer-empty-state {
                text-align: center;
                padding: 40px 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }
            .bose-drawer-empty-state p {
                font-size: 14px;
                color: ${BRAND_COLORS.black};
                line-height: 1.6;
                margin: 0;
            }
            .bose-drawer-card {
                background: ${BRAND_COLORS.white};
                border-radius: 12px;
                padding: 12px;
                margin-bottom: 14px;
                display: flex;
                gap: 12px;
                position: relative;
                border: 1px solid rgba(255,145,164,0.15);
                box-shadow: 0 4px 12px rgba(255,145,164,0.04);
            }
            .bose-drawer-card-img {
                width: 70px;
                height: 70px;
                border-radius: 8px;
                object-fit: cover;
            }
            .bose-drawer-card-info {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            .bose-drawer-card-info h4 {
                margin: 0;
                font-size: 14px;
                color: ${BRAND_COLORS.black};
                font-weight: 700;
            }
            .bose-drawer-item-specs {
                font-size: 11px;
                color: #666;
                margin-top: 4px;
                line-height: 1.4;
            }
            .bose-drawer-card-pricing {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 8px;
            }
            .bose-drawer-card-price {
                font-size: 14px;
                color: ${BRAND_COLORS.pink};
                font-weight: 700;
            }
            .bose-drawer-qty-control {
                display: flex;
                align-items: center;
                border: 1px solid ${BRAND_COLORS.pink};
                border-radius: 20px;
                background: ${BRAND_COLORS.white};
                overflow: hidden;
            }
            .bose-drawer-qty-btn {
                background: none;
                border: none;
                width: 28px;
                height: 24px;
                cursor: pointer;
                font-weight: 700;
                font-size: 14px;
                color: ${BRAND_COLORS.black};
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .bose-drawer-qty-value {
                padding: 0 8px;
                font-size: 13px;
                font-weight: 700;
                min-width: 16px;
                text-align: center;
            }
            .bose-drawer-card-remove {
                position: absolute;
                top: 8px;
                left: 8px;
                background: none;
                border: none;
                font-size: 20px;
                color: #aaa;
                cursor: pointer;
            }
            .bose-drawer-footer {
                padding: 20px;
                border-top: 1px solid ${BRAND_COLORS.cream};
                background: ${BRAND_COLORS.white};
            }
            .bose-drawer-summary-row {
                display: flex;
                justify-content: space-between;
                font-size: 15px;
                margin-bottom: 16px;
                color: ${BRAND_COLORS.black};
            }
            .bose-drawer-summary-row strong {
                color: ${BRAND_COLORS.pink};
                font-size: 18px;
                font-weight: 700;
            }
            .bose-drawer-actions-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            .bose-btn-primary-drawer, .bose-btn-secondary-drawer {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 46px;
                border-radius: 23px;
                font-size: 14px;
                font-weight: 700;
                text-decoration: none;
                cursor: pointer;
                font-family: 'Cairo', sans-serif;
            }
            .bose-btn-primary-drawer {
                background-color: ${BRAND_COLORS.pink};
                color: ${BRAND_COLORS.white};
            }
            .bose-btn-secondary-drawer {
                background-color: ${BRAND_COLORS.white};
                color: ${BRAND_COLORS.black};
                border: 1px solid ${BRAND_COLORS.black};
            }
            
            #bose-toast-central-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 9999999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
                direction: rtl;
                font-family: 'Cairo', sans-serif;
            }
            .bose-toast-card {
                background: ${BRAND_COLORS.white};
                border-left: 4px solid ${BRAND_COLORS.pink};
                border-radius: 8px;
                padding: 14px 20px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                min-width: 280px;
                max-width: 360px;
                opacity: 0;
                transform: translateX(50px);
                transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.35s ease;
            }
            .bose-toast-card.bose-toast-active {
                opacity: 1;
                transform: translateX(0);
            }
            .bose-toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .bose-toast-text {
                margin: 0;
                font-size: 13px;
                color: ${BRAND_COLORS.black};
                font-weight: 600;
            }
        `;
        document.head.appendChild(styleBlock);
    }

    function injectFallbackErrorDisplay() {
        if (document.getElementById('bose-db-fallback-error')) return;
        const errorDiv = document.createElement('div');
        errorDiv.id = "bose-db-fallback-error";
        errorDiv.style.cssText = `position:fixed; bottom:16px; right:16px; background-color:${BRAND_COLORS.cream}; border:1px solid ${BRAND_COLORS.pink}; padding:12px 20px; border-radius:8px; z-index:999999; direction:rtl; font-size:14px; font-family:Cairo;`;
        errorDiv.textContent = 'عذراً، هناك صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة لراحتك.';
        document.body.appendChild(errorDiv);
    }

    updateGlobalCartCounters();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadBoseAbsoluteDatabase);
    } else {
        loadBoseAbsoluteDatabase();
    }

})();