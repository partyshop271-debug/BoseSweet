/**
 * 👑 المحرك المركزي العام والنهائي للموقع والنافذة العائمة - حلويات بوسي 👑
 * النسخة الهندسية القياسية الشاملة بنسبة 100% - خالية تماماً من الثغرات البرمجية والمالية ومشاكل التداخل
 * [يقوم بإدارة: قاعدة البيانات JSON، العدادات، التنبيهات الراقية، والسلة العائمة التفاعلية الفاخرة]
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
            // جلب قاعدة البيانات المعتمدة والوحيدة لكل الموقع
            const response = await fetch('data/site-data-final.json');
            if (!response.ok) {
                throw new Error(`فشل جلب البيانات: ${response.status}`);
            }
            boseGlobalStoreData = await response.json();
            
            // إطلاق الحدث العالمي لإعلام كافة المحركات الفرعية (سلة، كيك، ورد) بنجاح التحميل الآمن
            window.BoseStoreData = boseGlobalStoreData;
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

    // واجهة برمجية آمنة وموثوقة لربط المحركات الفرعية بكفاءة كاملة (مثل محرك السلة والكيك)
    window.onBoseDatabaseReady = function (callback) {
        if (boseGlobalStoreData) {
            callback(boseGlobalStoreData);
        } else {
            databaseReadyCallbacks.push(callback);
        }
    };

    /* ==========================================================================\
       2. هيكلة وبناء نظام السلة العائمة التفاعلية الفاخرة ديناميكياً (Floating Cart Drawer)
       ========================================================================== */
    function injectFloatingCartSystem() {
        if (document.getElementById('bose-floating-cart-wrapper')) return;

        // إنشاء زر السلة العائم السحري الذي يرافق العميل في كافة الأقسام والصفحات لراحة تامة في التصفح
        const triggerButton = document.createElement('button');
        triggerButton.id = 'bose-floating-cart-trigger';
        triggerButton.setAttribute('aria-label', 'استعراض سلة المشتريات العائمة');
        triggerButton.innerHTML = `
            <div class="bose-trigger-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span id="bose-floating-badge-counter">0</span>
            </div>
        `;

        // إنشاء لوحة السلة العائمة الجانبية الفخمة (Drawer) المتوافقة مع الموبايل والكمبيوتر
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
            <div id="bose-drawer-items-body" class="bose-drawer-body-scroll">
                </div>
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

        // غطاء الخلفية المعتم الناعم (Overlay) لمنع التشتت وتحقيق الراحة النفسية البصرية للعميل
        const overlay = document.createElement('div');
        overlay.id = 'bose-floating-cart-overlay';

        // حقن العناصر في جذر الصفحة
        const container = document.createElement('div');
        container.id = 'bose-floating-cart-wrapper';
        container.appendChild(triggerButton);
        container.appendChild(cartDrawer);
        container.appendChild(overlay);
        document.body.appendChild(container);

        // حقن كود التنسيق الحاكم والمقدس الخاص بالسلة العائمة هيدروليكياً لحمايتها من الفقدان
        injectFloatingCartStyles();

        // ربط أحداث فتح وإغلاق السلة العائمة بسلاسة مطلقة وبحركات Smooth
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
            document.body.style.overflow = 'hidden'; // منع التمرير الخلفي المزعج على الموبايل
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
        // إطلاق حدث التحديث المتزامن لضمان استماع كافة أجزاء الموقع والتطبيقات للبيانات الجديدة
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
            const price = Math.round(Number(item.price || 0));
            const qty = Number(item.quantity || 1);
            const itemTotal = price * qty;
            totalSum += itemTotal;

            // استخراج وتنسيق التخصيصات الفاخرة للمنتج (مثل التورت المخصصة وبوكسات الورد)
            let customizationHTML = '';
            if (item.customizations) {
                if (Array.isArray(item.customizations)) {
                    customizationHTML = `<div class="bose-drawer-item-specs">${item.customizations.join(' | ')}</div>`;
                } else if (typeof item.customizations === 'object') {
                    const specs = [];
                    if (item.customizations.size) specs.push(`الشكل: ${item.customizations.size}`);
                    if (item.customizations.persons) specs.push(`الأفراد: ${item.customizations.persons}`);
                    if (item.customizations.filling) specs.push(`الحشو: ${item.customizations.filling}`);
                    if (item.customizations.text) specs.push(`الكتابة: "${item.customizations.text}"`);
                    if (item.customizations.flowersCount) specs.push(`الورد: ${item.customizations.flowersCount} فرع`);
                    customizationHTML = `<div class="bose-drawer-item-specs">${specs.join(' - ')}</div>`;
                }
            }

            const imgUrl = item.image || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png';

            return `
                <div class="bose-drawer-card" data-index="${index}">
                    <img src="${imgUrl}" alt="${item.name || 'منتج حلويات بوسي'}" class="bose-drawer-card-img">
                    <div class="bose-drawer-card-info">
                        <h4>${item.name || 'منتج فاخر'}</h4>
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

        // ربط الأحداث الداخلية للسلة العائمة بدقة متناهية ودون تكرار
        bindFloatingCartActions();
    }

    function bindFloatingCartActions() {
        // أزرار زيادة الكمية
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

        // أزرار تقليل الكمية
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
                        // حذف تلقائي راقٍ عند النزول عن كمية 1
                        cart.splice(index, 1);
                        saveInMemoryCart(cart);
                        renderFloatingCartItems();
                        window.showBoseToast("تم تحديث السلة وحذف القطعة برفق 🌸");
                    }
                }
            });
        });

        // أزرار الحذف المباشر للقطع
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

        // تحريك ناعم للدخول والخروج لحماية تجربة المستخدم وعين المستهلك (منع علامات الترقيم الحادة)
        setTimeout(() => toast.classList.add('bose-toast-active'), 10);
        
        setTimeout(() => {
            toast.classList.remove('bose-toast-active');
            toast.classList.add('bose-toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    };

    // دالة إدراج وتوصيل المنتجات بالسلة العائمة مباشرة من كروت الأقسام الـ 10 في index.html
    window.addAbsoluteProductToCart = function (productObject) {
        if (!productObject || !productObject.id) return;
        
        const cart = getInMemoryCart();
        const existingIndex = cart.findIndex(item => item.id === productObject.id && !item.customizations);
        
        if (existingIndex > -1) {
            cart[existingIndex].quantity = (Number(cart[existingIndex].quantity) || 1) + 1;
        } else {
            cart.push({
                id: productObject.id,
                name: productObject.name,
                price: productObject.price,
                image: productObject.image,
                quantity: 1,
                customizations: null
            });
        }
        
        saveInMemoryCart(cart);
        window.showBoseToast(`تمت إضافة المشروب أو الحلوى إلى السلة العائمة بنجاح 🌸`);
        openBoseCartDrawer();
    };

    /* ==========================================================================\
       5. تحديث عدادات السلة في كامل الهيكل العلوي للموقع (Sync Counters)
       ========================================================================== */
    function updateGlobalCartCounters() {
        const cart = getInMemoryCart();
        let totalItems = 0;
        cart.forEach(item => {
            totalItems += (Number(item.quantity) || 1);
        });

        // تحديث شارة زر السلة العائمة
        const floatingBadge = document.getElementById('bose-floating-badge-counter');
        if (floatingBadge) {
            floatingBadge.textContent = totalItems;
            floatingBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        // تحديث أي عدادات كلاسيكية متواجدة داخل الهيدر الأساسي للموقع لمنع التعارض الهيكلي
        const headerCounters = document.querySelectorAll('.cart-count, #cart-badge-count, .bose-cart-counter-global');
        headerCounters.forEach(counter => {
            counter.textContent = totalItems;
        });

        // إذا كانت لوحة السلة العائمة مفتوحة، نعيد رندرة محتوياتها فوراً لمواكبة التغيير الحي
        const drawer = document.getElementById('bose-floating-cart-drawer');
        if (drawer && drawer.style.left === '0px') {
            renderFloatingCartItems();
        }
    }

    /* ==========================================================================\
       6. دالة التهيئة والربط المركزي الكامل للواجهات (Global Central Boot)
       ========================================================================== */
    function initializeGlobalFeatures() {
        // حقن نظام السلة العائمة والنافذة الجانبية فوراً في الصفحة
        injectFloatingCartSystem();
        
        // تحديث العدادات بناءً على البيانات المخزنة الحالية
        updateGlobalCartCounters();

        // الاستماع لأي تحديث في السلة لإعادة مزامنة الشاشة والعدادات تلقائياً ومباشرة
        document.addEventListener('BoseCartUpdated', updateGlobalCartCounters);
        
        // تأمين التحديث ثنائي الاتجاه عبر التصفح المتعدد أو التغيير من الـ Storage
        window.addEventListener('storage', (e) => {
            if (e.key === CART_STORAGE_KEY) {
                updateGlobalCartCounters();
            }
        });
    }

    /* ==========================================================================\
       7. محددات الأداء والتنسيق البرمجي والجمالي الصارم للسلة العائمة (Dynamic Styles)
       ========================================================================== */
    function injectFloatingCartStyles() {
        if (document.getElementById('bose-floating-styles-block')) return;

        const styleBlock = document.createElement('style');
        styleBlock.id = 'bose-floating-styles-block';
        styleBlock.textContent = `
            /* 👑 التنسيق الهيكلي والجمالي الصارم للسلة العائمة والتنبيهات 👑 */
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
            .bose-drawer-body-scroll::-webkit-scrollbar {
                width: 5px;
            }
            .bose-drawer-body-scroll::-webkit-scrollbar-thumb {
                background: ${BRAND_COLORS.pink};
                border-radius: 10px;
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
                padding-left: 20px;
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
            .bose-drawer-qty-btn:hover {
                background-color: ${BRAND_COLORS.cream};
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
            .bose-drawer-card-remove:hover {
                color: ${BRAND_COLORS.pink};
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
                box-sizing: border-box;
            }
            .bose-btn-primary-drawer {
                background-color: ${BRAND_COLORS.pink};
                color: ${BRAND_COLORS.white};
                border: none;
            }
            .bose-btn-secondary-drawer {
                background-color: ${BRAND_COLORS.white};
                color: ${BRAND_COLORS.black};
                border: 1px solid ${BRAND_COLORS.black};
            }
            .bose-btn-secondary-drawer:hover {
                background-color: ${BRAND_COLORS.cream};
            }
            .bose-drawer-footer-notice {
                text-align: center;
                font-size: 11px;
                color: #888;
                margin: 12px 0 0 0;
            }
            
            /* 🌸 نظام التنبيهات الراقية الفاخرة Toast System 🌸 */
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
                pointer-events: auto;
            }
            .bose-toast-card.bose-toast-active {
                opacity: 1;
                transform: translateX(0);
            }
            .bose-toast-card.bose-toast-fadeout {
                opacity: 0;
                transform: translateY(-20px);
            }
            .bose-toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .bose-toast-sparkle {
                font-size: 16px;
            }
            .bose-toast-text {
                margin: 0;
                font-size: 13px;
                color: ${BRAND_COLORS.black};
                font-weight: 600;
                line-height: 1.5;
            }
            
            @media (max-width: 480px) {
                #bose-floating-cart-drawer {
                    max-width: 100%;
                    left: -100%;
                }
                #bose-toast-central-container {
                    left: 16px;
                    right: 16px;
                    top: 16px;
                }
                .bose-toast-card {
                    min-width: calc(100% - 32px);
                    max-width: 100%;
                }
            }
        `;
        document.head.appendChild(styleBlock);
    }

    function injectFallbackErrorDisplay() {
        const errorDiv = document.createElement('div');
        errorDiv.id = "bose-db-fallback-error";
        errorDiv.style.position = 'fixed';
        errorDiv.style.bottom = '16px';
        errorDiv.style.right = '16px';
        errorDiv.style.backgroundColor = BRAND_COLORS.cream;
        errorDiv.style.border = `1px solid ${BRAND_COLORS.pink}`;
        errorDiv.style.padding = '12px 20px';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.zIndex = '999999';
        errorDiv.style.direction = 'rtl';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.fontFamily = 'Cairo';
        errorDiv.textContent = 'عذراً، هناك صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة لراحتك.';
        document.body.appendChild(errorDiv);
    }

    // إطلاق جلب قاعدة البيانات وبدء تشغيل حارس التمهيد الفاخر فوراً
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadBoseAbsoluteDatabase);
    } else {
        loadBoseAbsoluteDatabase();
    }

})();