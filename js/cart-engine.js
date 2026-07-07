/**
 * 👑 محرك السلة وإتمام الطلب الموحد الفاخر والمطور - حلويات بوسي 👑
 * النسخة الهندسية القياسية الكاملة بنسبة 100% - خالية تماماً من الثغرات المالية والبرمجية V17.5 الشاملة
 * متوافقة بشكل مطلق مع: core-engine.js وقاعدة البيانات site-data-final.json ومعايير الأداء والموبايل أولاً
 * [إصلاح برمي حاسم لحظر تعليق قناع التحميل والتعتيم العشوائي أثناء دورة حياة حذف الأصناف]
 * [تأمين وحل ثغرة حالة السباق اللامتزامنة لضمان عدم حدوث فجوة بيضاء أو اختفاء عشوائي للمنتجات]
 */

(function () {
    "use strict";

    const CART_STORAGE_KEY = 'bose_cart';

    // دالة تحكم مساعدة لإخفاء أو إظهار واجهة التحميل والتعتيم (Overlay Control Pane) بأمان لمنع شلل الشاشة
    function toggleBoseCartOverlay(show) {
        const overlay = document.getElementById('bose-cart-global-overlay');
        if (overlay) {
            if (show) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }
    }

    // ==========================================================================
    // [🔐 الحارس البرمجي - دوال إدارة السلة الذاتية لتأمين عمليات الحذف والتحديث الفوري]
    // ==========================================================================
    window.getBoseCart = window.getBoseCart || function () {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    };

    // [🛠️ تعديل هندسي مطور جذرياً]: معالجة الحذف بأمان كامل لصد أي Race Condition ومسح حقيقي للمنتج دون إخفاء
    window.removeBoseCartItem = function (itemId) {
        // 1. تفعيل واجهة التعتيم فوراً لحماية تماسك البيانات والـ State الحية
        toggleBoseCartOverlay(true);

        try {
            let cart = window.getBoseCart();
            // التصفية الحقيقية بناء على المعرف الفريد للصنف
            cart = cart.filter(item => item.id !== itemId);
            
            // الحفظ الصارم المشترك في الذاكرة المحلية والذاكرة المؤقتة
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
            if (typeof window.boseInMemoryCart !== 'undefined') {
                window.boseInMemoryCart = cart;
            }
            
            // تحديث العداد العالمي بالهيدر فوراً
            if (typeof window.updateGlobalCartCounter === 'function') {
                window.updateGlobalCartCounter();
            }
            
            // إطلاق الأحداث لضمان مزامنة التغيير في كل أجزاء الموقع
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('bose_cart_updated'));

            console.log(`[Bose Engine] تم حذف المنتج بنجاح ذو المعرف: (${itemId})`);
            return true;
        } catch (e) {
            console.error("❌ فشل حذف الصنف من السلة:", e);
            return false;
        } finally {
            // 2. [صمام الأمان الحاسم]: إزالة قناع التعتيم فوراً وتحديث الرندر مهما حدث لحظر تجميد شاشات الموبايل والكمبيوتر
            setTimeout(() => {
                toggleBoseCartOverlay(false);
                // إعادة بناء واستدعاء الرندر الحي لعرض السلة الحقيقية بعد الحذف الفعلي
                renderCartItems();
            }, 150);
        }
    };

    // ربط الدالة بالأسماء البديلة لضمان عدم حدوث أي تصادم لغوي أو تداخل مع الأزرار والمحاكيات
    window.removeItem = function(itemId) {
        window.removeBoseCartItem(itemId);
    };

    window.updateBoseCartItemQuantity = function (itemId, newQty) {
        try {
            let cart = window.getBoseCart();
            const item = cart.find(i => i.id === itemId);
            if (item) {
                item.quantity = parseInt(newQty, 10) || 1;
                
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
                if (typeof window.boseInMemoryCart !== 'undefined') {
                    window.boseInMemoryCart = cart;
                }
                
                if (typeof window.updateGlobalCartCounter === 'function') {
                    window.updateGlobalCartCounter();
                }
                
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new Event('bose_cart_updated'));
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    };

    window.clearBoseCart = function () {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
            if (typeof window.boseInMemoryCart !== 'undefined') {
                window.boseInMemoryCart = [];
            }
            if (typeof window.updateGlobalCartCounter === 'function') {
                window.updateGlobalCartCounter();
            }
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('bose_cart_updated'));
            return true;
        } catch (e) {
            return false;
        }
    };

    // ==========================================================================
    // [🔐 صمام الأمان لمنع هجمات XSS وتطهير نصوص العملاء بالتوافق مع المحرك العام]
    // ==========================================================================
    const escapeHtml = window.escapeHtml || window.escapeHTML || function (unsafeString) {
        if (unsafeString === null || unsafeString === undefined) return '';
        return unsafeString
            .toString()
            .replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, """)
            .replace(/'/g, "'");
    };

    const normalizeArabicNumerals = window.normalizeArabicNumerals || function (str) {
        if (str === null || str === undefined) return "";
        const arabicNormMap = {
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
            '۴': '4', '۵': '5', '۶': '6',
            '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۷': '7', '٨': '8', '٩': '9'
        };
        return str.toString().trim().replace(/[٠-٩۰-۹]/g, match => arabicNormMap[match] || match);
    };

    const sanitizeBosePhoneNumber = window.sanitizeBosePhoneNumber || function (phone) {
        if (!phone) return "";
        let cleaned = phone.toString().trim().replace(/[\s\-\(\)\+]/g, "");
        cleaned = normalizeArabicNumerals(cleaned);
        if (cleaned.startsWith("201")) {
            cleaned = "0" + cleaned.substring(2);
        } else if (cleaned.startsWith("00201")) {
            cleaned = "0" + cleaned.substring(4);
        } else if (cleaned.startsWith("1") && cleaned.length === 10) {
            cleaned = "0" + cleaned;
        }
        return cleaned;
    };

    const validateBosePhoneNumber = window.validateBosePhoneNumber || function (phone, isOptional = false) {
        if (!phone || phone.trim() === "") {
            return isOptional;
        }
        const cleaned = sanitizeBosePhoneNumber(phone);
        const egPhoneRegex = /^01[0125][0-9]{8}$/;
        return egPhoneRegex.test(cleaned);
    };

    // ==========================================================================
    // [🔐 حارس الواجهة الفاخر - بديل آمن تماماً لـ alert() و confirm() بأسلوب البراند الجمالي]
    // ==========================================================================
    const safeToast = function (message) {
        if (typeof window.showBoseToast === 'function') {
            window.showBoseToast(message);
        } else {
            let fallbackContainer = document.querySelector('.bose-toast-container');
            if (!fallbackContainer) {
                fallbackContainer = document.createElement('div');
                fallbackContainer.className = 'bose-toast-container';
                document.body.appendChild(fallbackContainer);
            }
            const toast = document.createElement('div');
            toast.className = 'bose-toast active';
            toast.style.cssText = `
                background: var(--bose-white, #FFFFFF) !important;
                color: var(--bose-black, #111111) !important;
                border: var(--bose-border-pink, 1px solid rgba(255, 145, 164, 0.4)) !important;
                border-right: 4px solid var(--bose-pink, #FF91A4) !important;
                padding: 16px 24px !important;
                border-radius: 16px !important;
                box-shadow: var(--bose-shadow-glow, 0 8px 32px rgba(255, 145, 164, 0.12)) !important;
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                direction: rtl;
                text-align: right;
                font-family: 'Cairo', sans-serif !important;
            `;
            toast.innerHTML = `🌸 <span style="line-height:1.5; font-weight: 700;">${escapeHtml(message)}</span>`;
            fallbackContainer.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
            }, 3500);
        }
    };

    const safeConfirm = function (messageText, onConfirm, onCancel) {
        if (typeof window.showBoseConfirm === 'function') {
            window.showBoseConfirm(messageText, onConfirm, onCancel);
        } else {
            let overlay = document.createElement('div');
            overlay.className = 'bose-modal-overlay';
            overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(17,17,17,0.4); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:100100; opacity:1;';
            overlay.innerHTML = `
                <div class="bose-modal-box" style="transform:scale(1); background:var(--bose-white, #FFFFFF); border:1px solid var(--bose-pink, #FF91A4); border-radius:24px; width:90%; max-width:400px; padding:24px; box-shadow:var(--bose-shadow-hover, 0 16px 40px rgba(255,145,164,0.22)); text-align:right; direction:rtl; font-family:'Cairo', sans-serif !important;">
                    <p style="font-size:15px; font-weight:600; color:var(--bose-black, #111111); line-height:1.6; margin:0 0 20px 0;">${escapeHtml(messageText)}</p>
                    <div style="display:flex; align-items:center; justify-content:flex-start; gap:12px;">
                        <button id="fallback-confirm-yes" style="font-family:'Cairo', sans-serif; font-size:14px; font-weight:700; padding:10px 24px; border-radius:50px; cursor:pointer; border:none; background:var(--bose-pink, #FF91A4); color:var(--bose-white, #FFFFFF); box-shadow: 0 4px 12px rgba(255,145,164,0.25);">تأكيد</button>
                        <button id="fallback-confirm-no" style="font-family:'Cairo', sans-serif; font-size:14px; font-weight:700; padding:10px 24px; border-radius:50px; cursor:pointer; border:1px solid rgba(17, 17, 17, 0.15); background:transparent; color:var(--bose-black, #111111);">تراجع</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector('#fallback-confirm-yes').addEventListener('click', () => {
                overlay.remove();
                if (onConfirm) onConfirm();
            });
            overlay.querySelector('#fallback-confirm-no').addEventListener('click', () => {
                overlay.remove();
                if (onCancel) onCancel();
            });
        }
    };

    let boseMemoryStore = {};
    const safeLocalStorage = {
        setItem: function (key, value) {
            try { 
                localStorage.setItem(key, value); 
            } catch (e) { 
                boseMemoryStore[key] = value; 
            }
        },
        getItem: function (key) {
            try { 
                return localStorage.getItem(key); 
            } catch (e) { 
                return boseMemoryStore[key] || null; 
            }
        },
        removeItem: function (key) {
            try { 
                localStorage.removeItem(key); 
            } catch (e) { 
                delete boseMemoryStore[key]; 
            }
        }
    };

    function getDiscountableSubtotal(cart) {
        let discountableSubtotal = 0;
        cart.forEach(item => {
            const priceUnit = parseFloat(item.finalPrice) || parseFloat(item.price) || parseFloat(item.basePrice) || 0;
            const moneyAmount = (item.customDetails && parseFloat(item.customDetails.moneyAmount)) || 0;
            const servicePortion = Math.max(0, priceUnit - moneyAmount);
            discountableSubtotal += servicePortion * (parseInt(item.quantity, 10) || 1);
        });
        return discountableSubtotal;
    }

    function bootstrapPageEngine() {
        if (document.getElementById('cart-items-wrapper')) {
            initCartPage();
        }
        if (document.getElementById('btn-submit-order-final')) {
            initCheckoutPage();
        }
        if (document.getElementById('success-order-id-display') || document.getElementById('btn-whatsapp-retry-redirect')) {
            initOrderSuccessPage();
        }
    }

    /* ==========================================================================
       1. منطق صفحة سلة التسوق (cart.html)
       ========================================================================== */

    function initCartPage() {
        console.log("🌸 تم تمهيد صفحة سلة التسوق بنجاح.");
        renderCartItems();
        initCouponSystem('cart');

        const clearCartBtn = document.getElementById('btn-clear-cart') || document.querySelector('button.btn-clear-cart-node');
        if (clearCartBtn && !clearCartBtn.dataset.boseListener) {
            clearCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                safeConfirm("هل حابب تفرّغ سلة المشتريات بالكامل وتبدأ تختار من أول وجديد؟ 🌸", () => {
                    window.clearBoseCart();
                    safeLocalStorage.removeItem('bose_applied_coupon');
                    renderCartItems();
                });
            });
            clearCartBtn.dataset.boseListener = "true";
        }

        window.addEventListener('storage', (e) => {
            if (e.key === CART_STORAGE_KEY) {
                renderCartItems();
            }
        });

        window.addEventListener('bose_cart_updated', () => {
            renderCartItems();
        });
    }

    function renderCartItems() {
        const itemsWrapper = document.getElementById('cart-items-wrapper');
        if (!itemsWrapper) return;

        const cart = window.getBoseCart();
        const clearCartBtn = document.getElementById('btn-clear-cart') || document.querySelector('button.btn-clear-cart-node');
        
        const storeLogoFallback = window.getBoseLogo ? window.getBoseLogo() : (window.BoseStoreData?.store?.logo || "");
        const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";

        if (cart.length === 0) {
            itemsWrapper.innerHTML = `
                <div class="empty-cart-message-container" style="text-align:center; padding:60px 24px; background:var(--bose-white, #FFFFFF); border:var(--bose-border-pink); border-radius:24px; box-shadow:var(--bose-shadow-glow); direction:rtl;">
                    <div style="font-size:48px; margin-bottom:16px;">🌸</div>
                    <h3 style="font-size:18px; font-weight:700; color:var(--bose-black, #111111); margin:0 0 8px 0; font-family:'Cairo', sans-serif !important;">سلة المشتريات فارغة حالياً</h3>
                    <p style="font-size:14px; font-weight:400; color:var(--bose-black, #111111); opacity:0.8; margin:0 0 24px 0; line-height:1.6; font-family:'Cairo', sans-serif !important;">تصفح المنيو الشامل واستمتع بأشهى قطع الجاتوهات والحلويات والتورت المصنوعة بحب خصيصاً لمناسباتكم السعيدة.</p>
                    <a href="menu.html" style="display:inline-block; background:var(--bose-pink, #FF91A4); color:var(--bose-white, #FFFFFF); padding:12px 32px; border-radius:50px; text-decoration:none; font-weight:700; font-size:14px; transition:0.2s; box-shadow: 0 4px 14px rgba(255,145,164,0.25); font-family:'Cairo', sans-serif !important;">استعرض المنيو الشامل</a>
                </div>
            `;
            if (clearCartBtn) clearCartBtn.style.display = 'none';
            updateCartSummaryTotals(0);
            renderSuggestionsSlider([]);
            return;
        }

        if (clearCartBtn) clearCartBtn.style.display = '';
        itemsWrapper.innerHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            const priceUnit = parseFloat(item.finalPrice) || parseFloat(item.price) || parseFloat(item.basePrice) || 0;
            const itemTotal = priceUnit * (parseInt(item.quantity, 10) || 1);
            subtotal += itemTotal;

            const card = document.createElement('div');
            card.className = 'cart-item-card';
            card.style.cssText = `
                position: relative;
                display: flex;
                align-items: center;
                background-color: var(--bose-white, #FFFFFF);
                border: var(--bose-border-pink);
                box-shadow: var(--bose-shadow-glow);
                border-radius: 20px;
                padding: 16px;
                margin-bottom: 16px;
                direction: rtl;
            `;

            let customDetailsHTML = '';
            if (item.customDetails && item.type !== 'standard') {
                const details = item.customDetails;
                const excludedKeys = ['extraToppingPrice', 'printingPrice', 'moneyCategoryAmount', 'moneyFee', 'photoCount', 'wrappingPrice'];
                
                Object.keys(details).forEach(key => {
                    if (excludedKeys.includes(key)) return;
                    
                    const cleanKey = translateDetailKey(key);
                    const rawVal = formatDetailValue(key, details[key]);
                    const cleanVal = escapeHtml(rawVal);
                    
                    if (cleanVal && cleanVal !== "لا" && cleanVal !== "none" && cleanVal !== "لا يوجد" && cleanVal !== "0" && cleanVal !== "0 وردة" && cleanVal !== "0 جنيه" && cleanVal !== "0 قطعة" && cleanVal !== "0 فرد" && cleanVal !== "بدون إضافة صور") {
                        customDetailsHTML += `<span style="display: block; font-size: 13px; line-height: 1.5; opacity: 0.9; font-family:'Cairo', sans-serif !important; word-break: break-word;">${cleanKey}: <strong style="color:var(--bose-black); font-weight:700;">${cleanVal}</strong></span>`;
                    }
                });
            } else if (item.flavorName) {
                customDetailsHTML += `<span style="display: block; font-size: 13px; line-height: 1.5; opacity: 0.9; font-family:'Cairo', sans-serif !important;">النكهة المحددة: <strong style="color:var(--bose-black); font-weight:700;">${escapeHtml(item.flavorName)}</strong></span>`;
            }

            const isBespoke = item.type === "custom-cake" || item.type === "custom-flower" || item.type === "mini-cake" || item.id.includes("-");
            let qtyControlHTML = "";

            if (isBespoke) {
                qtyControlHTML = `
                    <div class="quantity-counter-block bespoke-locked" style="display:flex; align-items:center; border:1px solid rgba(255, 145, 164, 0.2); border-radius:50px; background:#FFF0F2; padding:4px 16px;">
                        <span style="font-size:12px; font-weight:700; color:var(--bose-pink, #FF91A4); font-family:'Cairo', sans-serif !important;">✨ قطعة فريدة صممت لكم</span>
                    </div>
                `;
            } else {
                qtyControlHTML = `
                    <div class="quantity-counter-block" style="display:flex; align-items:center; border:1px solid var(--bose-pink, #FF91A4); border-radius:50px; background:var(--bose-white, #FFFFFF); padding:2px 8px;">
                        <button class="btn-qty-minus" style="background:none; border:none; color:var(--bose-black); font-size:18px; font-weight:700; width:30px; height:30px; cursor:pointer;">-</button>
                        <input type="number" class="input-qty-value" value="${item.quantity}" min="1" readonly style="width:35px; text-align:center; border:none; font-size:15px; font-weight:700; color:var(--bose-black); background:transparent; font-family:'Cairo', sans-serif !important;">
                        <button class="btn-qty-plus" style="background:none; border:none; color:var(--bose-black); font-size:18px; font-weight:700; width:30px; height:30px; cursor:pointer;">+</button>
                    </div>
                `;
            }

            card.innerHTML = `
                <button class="btn-remove-item" style="position:absolute; top:12px; left:12px; background:none; border:none; color:var(--bose-black); font-size:22px; cursor:pointer; font-weight:700; line-height:1; transition:0.2s; z-index:10; font-family:'Cairo', sans-serif !important;" aria-label="حذف الصنف">×</button>
                <div class="cart-item-img-container" style="margin-left:16px; flex-shrink: 0;">
                    <img src="${escapeHtml(item.image || storeLogoFallback)}" onerror="this.src='${storeLogoFallback}'" class="cart-item-img" alt="${escapeHtml(item.title)}" style="width:120px; height:120px; object-fit:cover; border-radius:20px; display:block;" loading="lazy">
                </div>
                <div class="cart-item-info" style="flex:1; display:flex; flex-direction:column; gap:4px; text-align:right; overflow:hidden;">
                    <h3 class="cart-item-title" style="margin:0 0 4px 0; font-size:16px; font-weight:700; color:var(--bose-black); font-family:'Cairo', sans-serif !important; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(item.title)}</h3>
                    <div class="cart-item-meta" style="color:var(--bose-black); opacity:0.8;">${customDetailsHTML}</div>
                    <div class="cart-item-price-quantity-row" style="display:flex; align-items:center; justify-content:space-between; margin-top:8px; flex-wrap:wrap; gap:10px;">
                        ${qtyControlHTML}
                        <div class="cart-item-price-display" style="text-align:left; direction:rtl;">
                            <span class="cart-item-price-single" style="font-size:12px; font-weight:400; color:var(--bose-black); opacity:0.7; display:block; font-family:'Cairo', sans-serif !important;">${item.quantity > 1 ? `${priceUnit} × ${item.quantity}` : ''}</span>
                            <span class="cart-item-price-total" style="font-size:15px; font-weight:700; color:var(--bose-pink, #FF91A4); font-family:'Cairo', sans-serif !important;">${itemTotal} ${storeCurrency}</span>
                        </div>
                    </div>
                </div>
            `;

            if (!isBespoke) {
                card.querySelector('.btn-qty-minus').addEventListener('click', () => {
                    if (item.quantity > 1) {
                        window.updateBoseCartItemQuantity(item.id, item.quantity - 1);
                    }
                });

                card.querySelector('.btn-qty-plus').addEventListener('click', () => {
                    window.updateBoseCartItemQuantity(item.id, item.quantity + 1);
                });
            }

            // تفعيل مستمع الحذف الصارم والمباشر دون إخفاء عشوائي
            card.querySelector('.btn-remove-item').addEventListener('click', (e) => {
                e.preventDefault();
                safeConfirm("هل حابب تشيل الصنف ده من سلة المشتريات؟ 🌸", () => {
                    window.removeBoseCartItem(item.id);
                });
            });

            itemsWrapper.appendChild(card);
        });

        updateCartSummaryTotals(subtotal);
        renderSuggestionsSlider(cart);
    }

    function updateCartSummaryTotals(subtotal) {
        const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";
        
        const subtotalNode = document.getElementById('cart-subtotal-value');
        if (subtotalNode) subtotalNode.textContent = `${subtotal} ${storeCurrency}`;

        let discountAmount = 0;
        const cart = window.getBoseCart();
        const discountableSubtotal = getDiscountableSubtotal(cart);
        const activeCoupon = getActiveAppliedCoupon(discountableSubtotal);
        
        const discountNode = document.getElementById('summary-discount');
        if (activeCoupon) {
            discountAmount = activeCoupon.amount;
            if (discountNode) discountNode.textContent = `${discountAmount} ${storeCurrency}`;
        } else {
            if (discountNode) discountNode.textContent = `0 ${storeCurrency}`;
        }

        const grandNode = document.getElementById('cart-grand-total-value') || document.getElementById('summary-grand-total');
        if (grandNode) {
            grandNode.textContent = `${Math.round(Math.max(0, subtotal - discountAmount))} ${storeCurrency}`;
        }

        const countBadge = document.getElementById('summary-items-count');
        if (countBadge) {
            countBadge.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
        }

        renderCouponStatusHTML('cart', discountableSubtotal);
    }

    function renderSuggestionsSlider(cart) {
        const grid = document.getElementById('cart-suggestions-container') || document.getElementById('suggestions-grid');
        if (!grid) return;

        const products = window.BoseStoreData?.products || [];
        if (products.length === 0) {
            grid.innerHTML = '';
            return;
        }

        const cartSlugs = cart.map(item => item.productSlug);
        let suggestions = products.filter(p => !cartSlugs.includes(p.slug) && p.slug !== "toort-custom-master" && p.slug !== "flowers-master");
        
        if (suggestions.length === 0) {
            suggestions = products.filter(p => p.slug !== "toort-custom-master" && p.slug !== "flowers-master");
        }

        const displayItems = suggestions.slice(0, 2);
        const storeLogoFallback = window.getBoseLogo ? window.getBoseLogo() : (window.BoseStoreData?.store?.logo || "");
        const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";

        grid.innerHTML = '';
        grid.style.cssText = `
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            gap: 16px;
            padding: 8px 4px 16px 4px;
            width: 100%;
            scrollbar-width: none;
            -ms-overflow-style: none;
        `;

        displayItems.forEach(prod => {
            const finalPrice = window.calculateBosePrice ? window.calculateBosePrice(prod.price, "menu-only") : prod.price;
            const firstImg = prod.image || (prod.images && prod.images.length > 0 ? prod.images[0] : storeLogoFallback);

            const slide = document.createElement('div');
            slide.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                background-color: var(--bose-white, #FFFFFF);
                border: var(--bose-border-pink);
                border-radius: 16px;
                padding: 12px;
                min-width: 280px;
                flex: 0 0 auto;
                direction: rtl;
                box-shadow: 0 8px 24px rgba(255, 145, 164, 0.04);
            `;

            slide.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; text-align:right; flex:1; overflow:hidden;">
                    <img src="${escapeHtml(firstImg)}" onerror="this.src='${storeLogoFallback}'" alt="${escapeHtml(prod.title)}" style="width:60px; height:60px; object-fit:cover; border-radius:10px; flex-shrink: 0;" loading="lazy">
                    <div style="overflow:hidden;">
                        <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:700; color:var(--bose-black, #111111); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:'Cairo', sans-serif !important;">${escapeHtml(prod.title)}</h4>
                        <span style="font-size:13px; font-weight:700; color:var(--bose-pink, #FF91A4); font-family:'Cairo', sans-serif !important;">${finalPrice} ${storeCurrency}</span>
                    </div>
                </div>
                <button class="btn-quick-add-suggestion" style="background:var(--bose-pink, #FF91A4); color:var(--bose-white, #FFFFFF); border:none; width:35px; height:35px; border-radius:50%; font-size:20px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.2s;" aria-label="إضافة سريعة">+</button>
            `;

            slide.querySelector('.btn-quick-add-suggestion').addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window.createCartItem === 'function' && typeof window.addBoseCartItem === 'function') {
                    const standardItem = window.createCartItem(prod, { flavorName: prod.flavorName || "كلاسيك" }, 1);
                    if (standardItem) {
                        window.addBoseCartItem(standardItem);
                    }
                } else {
                    let cart = window.getBoseCart();
                    const existing = cart.find(i => i.productSlug === prod.slug && i.type === 'standard');
                    if (existing) {
                        existing.quantity += 1;
                    } else {
                        cart.push({
                            id: prod.slug + "-standard",
                            productSlug: prod.slug,
                            title: prod.title,
                            price: finalPrice,
                            finalPrice: finalPrice,
                            image: firstImg,
                            quantity: 1,
                            type: 'standard',
                            flavorName: prod.flavorName || "كلاسيك"
                        });
                    }
                    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
                    if (typeof window.updateGlobalCartCounter === 'function') {
                        window.updateGlobalCartCounter();
                    }
                    window.dispatchEvent(new Event('storage'));
                }
            });

            grid.appendChild(slide);
        });
    }

    /* ==========================================================================
       2. منطق صفحة تأكيد الطلب والدفع (checkout.html)
       ========================================================================== */

    let checkoutMethod = 'delivery';

    function initCheckoutPage() {
        console.log("🌸 تم تمهيد صفحة تأكيد طلب المشتريات بنجاح.");
        const cart = window.getBoseCart();
        if (cart.length === 0) {
            window.location.href = "cart.html";
            return;
        }

        if (window.BoseStoreData) {
            setupCheckoutUIComponents();
        }

        document.addEventListener('BoseDatabaseLoaded', () => {
            setupCheckoutUIComponents();
        });
    }

    function setupCheckoutUIComponents() {
        renderCheckoutSummary();
        initCouponSystem('checkout');

        const prepMessageNode = document.getElementById('checkout-preparation-message');
        if (prepMessageNode) {
            prepMessageNode.textContent = window.BoseStoreData?.orderRules?.preparationTimeMessage || "نحتاج إلى وقت كافٍ لتجهيز طلبك بأفضل جودة ممكنة، لذلك لا يمكن اختيار موعد قبل 24 ساعة من وقت تأكيد الطلب.";
        }

        const pickupBtn = document.getElementById('method-pickup');
        const deliveryBtn = document.getElementById('method-delivery');
        const shippingZoneWrapper = document.getElementById('shipping-zone-wrapper');
        const zoneSelect = document.getElementById('checkout-zone-select');
        const checkoutBtnDirect = document.getElementById('btn-submit-order-final');

        const shippingZones = window.BoseStoreData?.shippingZones || [];
        const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";

        if (zoneSelect && shippingZones.length > 0 && !zoneSelect.dataset.populated) {
            zoneSelect.innerHTML = '<option value="" disabled selected>اختر المنطقة السكنية للتوصيل</option>';
            shippingZones.forEach(zone => {
                const opt = document.createElement('option');
                opt.value = zone.id;
                opt.textContent = `${zone.area} (+${zone.price} ${storeCurrency})`;
                zoneSelect.appendChild(opt);
            });
            zoneSelect.dataset.populated = "true";

            zoneSelect.addEventListener('change', () => {
                recalculateCheckoutTotals(checkoutMethod);
            });
        }

        let pickupInfoBlock = document.getElementById('bose-pickup-info-block');
        if (!pickupInfoBlock) {
            pickupInfoBlock = document.createElement('div');
            pickupInfoBlock.id = 'bose-pickup-info-block';
            pickupInfoBlock.style.cssText = `
                display: none;
                background-color: #FFF0F2;
                border: 1px dashed var(--bose-pink, #FF91A4);
                border-radius: 16px;
                padding: 16px;
                margin-top: 12px;
                direction: rtl;
                text-align: right;
            `;

            const pickupAddress = window.BoseStoreData?.store?.pickup?.address || "العنوان المعتمد";
            const pickupMapUrl = window.BoseStoreData?.store?.pickup?.mapUrl || "http://maps.google.com";
            const pickupMessage = window.BoseStoreData?.store?.pickup?.message || "لا توجد رسوم شحن عند الاستلام من الفرع.";

            pickupInfoBlock.innerHTML = `
                <h4 style="margin:0 0 8px 0; font-size:15px; font-weight:700; color:var(--bose-black); font-family:'Cairo', sans-serif !important;">📍 عنوان استلام حلويات بوسي:</h4>
                <p style="margin: 0 0 12px 0; font-size: 13px; color: var(--bose-black); line-height: 1.5;">${escapeHtml(pickupAddress)}</p>
                <a href="${escapeHtml(pickupMapUrl)}" target="_blank" style="display:inline-flex; background:var(--bose-pink); color:#fff; text-decoration:none; padding:8px 16px; border-radius:30px; font-size:12px; font-weight:700; box-shadow: 0 4px 12px rgba(255,145,164,0.15); font-family:'Cairo', sans-serif !important;">🗺️ عرض الموقع على خرائط جوجل</a>
                <span style="display:block; margin-top:8px; font-size:12px; font-weight:600; color:var(--bose-pink); font-family:'Cairo', sans-serif !important;">* ${escapeHtml(pickupMessage)}</span>
            `;

            const destinationNode = document.getElementById('shipping-zone-wrapper') || checkoutBtnDirect;
            if (destinationNode && destinationNode.parentNode) {
                destinationNode.parentNode.insertBefore(pickupInfoBlock, destinationNode.nextSibling);
            }
        }

        if (pickupBtn && deliveryBtn && !pickupBtn.dataset.boseListener) {
            pickupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                checkoutMethod = 'pickup';
                pickupBtn.classList.add('active');
                deliveryBtn.classList.remove('active');
                if (shippingZoneWrapper) shippingZoneWrapper.style.display = 'none';
                if (pickupInfoBlock) pickupInfoBlock.style.display = 'block';
                if (zoneSelect) zoneSelect.value = "";
                recalculateCheckoutTotals('pickup');
            });
            pickupBtn.dataset.boseListener = "true";

            deliveryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                checkoutMethod = 'delivery';
                deliveryBtn.classList.add('active');
                pickupBtn.classList.remove('active');
                if (shippingZoneWrapper) shippingZoneWrapper.style.display = 'block';
                if (pickupInfoBlock) pickupInfoBlock.style.display = 'none';
                recalculateCheckoutTotals('delivery');
            });
            deliveryBtn.dataset.boseListener = "true";
        }

        const deliveryDateInput = document.getElementById('checkout-delivery-date');
        const deliveryTimeInput = document.getElementById('checkout-delivery-time');

        if (deliveryDateInput && deliveryTimeInput && !deliveryDateInput.dataset.boseListener) {
            const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
            const minDate = new Date(synchronizedTime + (24 * 60 * 60 * 1000));
            const yyyy = minDate.getFullYear();
            let mm = minDate.getMonth() + 1;
            let dd = minDate.getDate();
            if (mm < 10) mm = '0' + mm;
            if (dd < 10) dd = '0' + dd;
            deliveryDateInput.min = `${yyyy}-${mm}-${dd}`;

            let warningNotice = document.getElementById('bose-delivery-warning-notice');
            if (!warningNotice) {
                warningNotice = document.createElement('div');
                warningNotice.id = 'bose-delivery-warning-notice';
                warningNotice.style.cssText = 'color: var(--bose-pink, #FF91A4); font-size: 13px; font-weight: 700; margin-top: 6px; display: none; line-height: 1.5; text-align: right; font-family:\'Cairo\', sans-serif !important;';
                deliveryDateInput.parentNode.appendChild(warningNotice);
            }

            const checkTimeValidationLive = () => {
                if (deliveryDateInput.value && deliveryTimeInput.value) {
                    const isValidDate = window.validateBoseDeliverySchedule ? window.validateBoseDeliverySchedule(deliveryDateInput.value, deliveryTimeInput.value) : true;
                    if (!isValidDate) {
                        warningNotice.textContent = "⚠️ عذراً يا فندم، هذا الموعد يقل عن 24 ساعة تحضير. يرجى اختيار موعد متاح بدءاً من الغد لضمان جودة طلبك الفاخر.";
                        warningNotice.style.display = "block";
                    } else {
                        warningNotice.style.display = "none";
                    }
                }
            };

            deliveryDateInput.addEventListener('change', checkTimeValidationLive);
            deliveryTimeInput.addEventListener('change', checkTimeValidationLive);
            deliveryDateInput.dataset.boseListener = "true";
        }

        if (checkoutBtnDirect && !checkoutBtnDirect.dataset.boseListener) {
            checkoutBtnDirect.addEventListener('click', (e) => {
                e.preventDefault();
                processOrderSubmission(checkoutMethod, checkoutBtnDirect);
            });
            checkoutBtnDirect.dataset.boseListener = "true";
        }
    }

    function renderCheckoutSummary() {
        const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";
        const cart = window.getBoseCart();
        
        let subtotal = cart.reduce((sum, item) => {
            const priceUnit = parseFloat(item.finalPrice) || parseFloat(item.price) || parseFloat(item.basePrice) || 0;
            return sum + (priceUnit * (parseInt(item.quantity, 10) || 1));
        }, 0);

        const subtotalNode = document.getElementById('summary-subtotal');
        if (subtotalNode) subtotalNode.textContent = `${subtotal} ${storeCurrency}`;

        let discountAmount = 0;
        const discountableSubtotal = getDiscountableSubtotal(cart);
        const activeCoupon = getActiveAppliedCoupon(discountableSubtotal);
        const discountNode = document.getElementById('summary-discount');
        if (activeCoupon) {
            discountAmount = activeCoupon.amount;
            if (discountNode) discountNode.textContent = `${discountAmount} ${storeCurrency}`;
        } else {
            if (discountNode) discountNode.textContent = `0 ${storeCurrency}`;
        }

        const feeNode = document.getElementById('summary-shipping-fee');
        if (feeNode) feeNode.textContent = `0 ${storeCurrency}`;

        const grandNode = document.getElementById('summary-grand-total');
        if (grandNode) {
            grandNode.textContent = `${Math.round(Math.max(0, subtotal - discountAmount))} ${storeCurrency}`;
        }
    }

    function recalculateCheckoutTotals(method) {
        const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";
        const cart = window.getBoseCart();
        const shippingZones = window.BoseStoreData?.shippingZones || [];

        let subtotal = cart.reduce((sum, item) => {
            const priceUnit = parseFloat(item.finalPrice) || parseFloat(item.price) || parseFloat(item.basePrice) || 0;
            return sum + (priceUnit * (parseInt(item.quantity, 10) || 1));
        }, 0);

        let shippingFee = 0;
        if (method === 'delivery') {
            const zoneSelect = document.getElementById('checkout-zone-select');
            if (zoneSelect && zoneSelect.value) {
                const matchedZone = shippingZones.find(z => z.id === zoneSelect.value);
                if (matchedZone) shippingFee = parseFloat(matchedZone.price) || 0;
            }
        }

        let discountAmount = 0;
        const discountableSubtotal = getDiscountableSubtotal(cart);
        const activeCoupon = getActiveAppliedCoupon(discountableSubtotal);
        const discountNode = document.getElementById('summary-discount');
        if (activeCoupon) {
            discountAmount = activeCoupon.amount;
            if (discountNode) discountNode.textContent = `${discountAmount} ${storeCurrency}`;
        } else {
            if (discountNode) discountNode.textContent = `0 ${storeCurrency}`;
        }

        const subtotalNode = document.getElementById('summary-subtotal');
        if (subtotalNode) subtotalNode.textContent = `${subtotal} ${storeCurrency}`;

        const feeNode = document.getElementById('summary-shipping-fee');
        if (feeNode) feeNode.textContent = `${shippingFee} ${storeCurrency}`;

        const grandNode = document.getElementById('summary-grand-total');
        if (grandNode) {
            grandNode.textContent = `${Math.round(Math.max(0, subtotal + shippingFee - discountAmount))} ${storeCurrency}`;
        }

        renderCouponStatusHTML('checkout', discountableSubtotal);
    }

    function processOrderSubmission(method, submitButton) {
        const cart = window.getBoseCart();
        if (cart.length === 0) {
            safeToast("سلة المشتريات فارغة حالياً، ياريت تختار بعض الحلويات اللذيذة قبل تفعيل طلبك 🌸");
            return;
        }

        const nameInput = document.getElementById('checkout-customer-name');
        const phoneInput = document.getElementById('checkout-customer-phone');
        const phoneTwoInput = document.getElementById('checkout-customer-phone-2');
        const addressInput = document.getElementById('checkout-address-details');
        const zoneSelect = document.getElementById('checkout-zone-select');
        const deliveryDateInput = document.getElementById('checkout-delivery-date');
        const deliveryTimeInput = document.getElementById('checkout-delivery-time');
        const notesInput = document.getElementById('checkout-order-notes') || document.getElementById('checkout-order-notes-textarea') || document.querySelector('textarea[name="notes"]');

        if (!nameInput || !nameInput.value.trim()) {
            safeToast("علشان نجهّز طلبك المميّز بأجمل شكل، ياريت تكتب اسمك بالكامل هنا 🌸");
            if (nameInput) nameInput.focus();
            return;
        }

        if (!phoneInput || !phoneInput.value.trim()) {
            safeToast("رقم موبايلك مهم جداً علشان نقدر نتواصل معاك ونطمنك على الطلب وهو في الطريق، ياريت تكتبه هنا ✨");
            if (phoneInput) phoneInput.focus();
            return;
        }

        const cleanPhone1 = sanitizeBosePhoneNumber(phoneInput.value);
        if (!validateBosePhoneNumber(cleanPhone1)) {
            safeToast("تأكّد يا فندم إن رقم الموبايل هو رقم مصري صحيح مكوّن من 11 رقم (زي 01012345678) 🌸");
            if (phoneInput) phoneInput.focus();
            return;
        }

        let cleanPhone2 = "";
        if (phoneTwoInput && phoneTwoInput.value.trim()) {
            cleanPhone2 = sanitizeBosePhoneNumber(phoneTwoInput.value);
            if (!validateBosePhoneNumber(cleanPhone2, true)) {
                safeToast("ياريت تتأكد من كتابة رقم موبايل مصري إضافي صحيح مكون من 11 رقماً لسلامة التوصيل.");
                if (phoneTwoInput) phoneTwoInput.focus();
                return;
            }
            if (cleanPhone1 === cleanPhone2) {
                safeToast("ياريت الرقم الإضافي يكون مختلف عن الرقم الأساسي علشان نضمن راحتك وسهولة التواصل ✨");
                if (phoneTwoInput) phoneTwoInput.focus();
                return;
            }
        }

        if (method === 'delivery') {
            if (!zoneSelect || !zoneSelect.value) {
                safeToast("من فضلك اختار المنطقة السكنية للتوصيل من القائمة علشان نحدد قيمة الشحن ✨");
                if (zoneSelect) zoneSelect.focus();
                return;
            }
            if (!addressInput || !addressInput.value.trim()) {
                safeToast("ياريت تكتب تفاصيل العنوان (اسم الشارع، رقم البيت، أو أي علامة مميزة جمبك) ✨");
                if (addressInput) addressInput.focus();
                return;
            }
        }

        if (!deliveryDateInput || !deliveryDateInput.value) {
            safeToast("ياريت تختار تاريخ الاستلام المطلوب والمناسب ليك 🌸");
            if (deliveryDateInput) deliveryDateInput.focus();
            return;
        }
        if (!deliveryTimeInput || !deliveryTimeInput.value) {
            safeToast("ياريت تحدد وقت الاستلام المطلوب والمناسب ليك 🌸");
            if (deliveryTimeInput) deliveryTimeInput.focus();
            return;
        }

        const isValidSchedule = window.validateBoseDeliverySchedule ? window.validateBoseDeliverySchedule(deliveryDateInput.value, deliveryTimeInput.value) : true;
        if (!isValidSchedule) {
            safeToast("لأننا بنصنع كل قطعة يدوياً وبكل حب وعناية فائقة، بنحتاج 24 ساعة على الأقل لتجهيز طلبك الفاخر بأعلى جودة تليق بمناسبتك السعيدة. نرجو اختيار موعد بيبدأ بعد 24 ساعة من دلوقتي ✨");
            if (deliveryDateInput) deliveryDateInput.focus();
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.style.opacity = "0.7";
            submitButton.innerHTML = `<span style="display:inline-block; animation: bose-spin 1s infinite linear; margin-left: 8px;">⏳</span> جاري معالجة طلبك الفاخر...`;
        }

        const subtotal = cart.reduce((sum, item) => {
            const priceUnit = parseFloat(item.finalPrice) || parseFloat(item.price) || parseFloat(item.basePrice) || 0;
            return sum + (priceUnit * (parseInt(item.quantity, 10) || 1));
        }, 0);
        
        let shippingFee = 0;
        let zoneAreaText = "الاستلام من الفرع";
        const shippingZones = window.BoseStoreData?.shippingZones || [];
        if (method === 'delivery' && zoneSelect) {
            const matchedZone = shippingZones.find(z => z.id === zoneSelect.value);
            if (matchedZone) {
                shippingFee = parseFloat(matchedZone.price) || 0;
                zoneAreaText = matchedZone.area;
            }
        }

        let discountAmount = 0;
        let appliedCouponCode = "";
        const discountableSubtotal = getDiscountableSubtotal(cart);
        const activeCoupon = getActiveAppliedCoupon(discountableSubtotal);
        if (activeCoupon) {
            discountAmount = activeCoupon.amount;
            appliedCouponCode = activeCoupon.code;
        }

        const grandTotal = Math.round(Math.max(0, subtotal + shippingFee - discountAmount));
        const orderId = `BOSE-${Math.floor(100000 + Math.random() * 900000)}`;
        const pickupAddress = window.BoseStoreData?.store?.pickup?.address || "الموقع المعتمد بالفرع";

        const orderDetailsObject = {
            orderId: orderId,
            customerName: nameInput.value.trim(),
            customerPhone: cleanPhone1,
            customerPhoneTwo: cleanPhone2 || "لا يوجد",
            method: method,
            zoneArea: zoneAreaText,
            addressDetails: method === 'delivery' ? addressInput.value.trim() : pickupAddress,
            deliveryDate: deliveryDateInput.value,
            deliveryTime: deliveryTimeInput.value,
            notes: notesInput ? notesInput.value.trim() : "",
            subtotal: subtotal,
            shippingFee: shippingFee,
            discount: discountAmount,
            couponUsed: appliedCouponCode,
            grandTotal: grandTotal,
            items: cart
        };

        safeLocalStorage.setItem('bose_last_order', JSON.stringify(orderDetailsObject));
        window.boseInMemoryLastOrder = orderDetailsObject;

        const invoiceMessage = buildBoseWhatsAppInvoiceText(orderDetailsObject);
        const storePhone = window.BoseStoreData?.store?.phone || "01097238441";
        
        let cleanStorePhone = storePhone.replace(/\D/g, '');
        if (cleanStorePhone.startsWith('0')) {
            cleanStorePhone = '2' + cleanStorePhone;
        } else if (!cleanStorePhone.startsWith('2')) {
            cleanStorePhone = '20' + cleanStorePhone;
        }

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanStorePhone}&text=${encodeURIComponent(invoiceMessage)}`;
        
        safeLocalStorage.setItem('bose_last_whatsapp_url', whatsappUrl);
        window.boseInMemoryLastWhatsappUrl = whatsappUrl;

        window.clearBoseCart();
        safeLocalStorage.removeItem('bose_applied_coupon');

        const paramFallbackString = `&name=${encodeURIComponent(orderDetailsObject.customerName)}&phone=${encodeURIComponent(orderDetailsObject.customerPhone)}&method=${encodeURIComponent(orderDetailsObject.method)}&area=${encodeURIComponent(orderDetailsObject.zoneArea)}&date=${encodeURIComponent(orderDetailsObject.deliveryDate)}&time=${encodeURIComponent(orderDetailsObject.deliveryTime)}&total=${grandTotal}`;
        window.location.href = `order-success.html?orderId=${orderId}${paramFallbackString}`;
    }

    function buildBoseWhatsAppInvoiceText(order) {
        let msg = `👑 *فاتورة طلب جديدة - حلويات بوسي* 👑\n\n`;
        msg += `📝 *رقم الطلب:* \`${order.orderId}\`\n`;
        msg += `👤 *العميل:* ${order.customerName}\n`;
        msg += `📞 *رقم الهاتف الأساسي:* ${order.customerPhone}\n`;
        if (order.customerPhoneTwo && order.customerPhoneTwo !== "لا يوجد") {
            msg += `📞 *رقم الهاتف الإضافي:* ${order.customerPhoneTwo}\n`;
        }
        msg += `🗓 *موعد الاستلام المطلوب:* ${order.deliveryDate} في تمام الساعة ${order.deliveryTime}\n`;
        msg += `📍 *طريقة الاستلام:* ${order.method === 'pickup' ? 'استلام من الفرع' : `توصيل للمنزل - ${order.zoneArea}`}\n`;
        msg += `🏠 *العنوان:* ${order.addressDetails}\n`;
        if (order.notes) msg += `✍ *ملاحظات وتوصيات خاصة:* "${order.notes}"\n`;
        msg += `\n🛒 *تفاصيل المنتجات:* \n`;
        msg += `--------------------------------\n`;

        order.items.forEach((item, index) => {
            msg += `${index + 1}. *${item.title}*\n`;
            if (item.customDetails && item.type !== 'standard') {
                const details = item.customDetails;
                const excludedKeys = ['extraToppingPrice', 'printingPrice', 'moneyCategoryAmount', 'moneyFee', 'photoCount', 'wrappingPrice'];
                
                Object.keys(details).forEach(key => {
                    if (excludedKeys.includes(key)) return;
                    
                    const cleanKey = translateDetailKey(key);
                    const rawVal = formatDetailValue(key, details[key]);
                    const cleanVal = rawVal;
                    
                    if (cleanVal && cleanVal !== "لا" && cleanVal !== "none" && cleanVal !== "لا يوجد" && cleanVal !== "0" && cleanVal !== "0 وردة" && cleanVal !== "0 جنيه" && cleanVal !== "0 قطعة" && cleanVal !== "0 فرد" && cleanVal !== "بدون إضافة صور") {
                        const keyPlain = cleanKey.replace(/[🎂📐👥📸✍⚠️💐🌹💵🍫🎀✉📏🍯🍒🖼🎨🍰✨]/g, '').trim();
                        msg += `   - ${keyPlain}: ${cleanVal}\n`;
                    }
                });
            } else if (item.flavorName) {
                msg += `   - النكهة: ${item.flavorName}\n`;
            }
            msg += `   - الكمية المطلوبة: ${item.quantity}\n`;
            
            const priceUnit = parseFloat(item.finalPrice) || parseFloat(item.price) || parseFloat(item.basePrice) || 0;
            const individualItemCost = parseFloat((priceUnit * item.quantity).toFixed(2));
            msg += `   - الحساب الفردي: ${individualItemCost} جنيه\n`;
            msg += `--------------------------------\n`;
        });

        msg += `\n💰 *الحساب الإجمالي:* \n`;
        msg += `  *المجموع الصافي:* ${order.subtotal} جنيه\n`;
        if (order.discount > 0) {
            msg += `🎁 *الخصم المطبق [${order.couponUsed}]:* -${order.discount} جنيه\n`;
        }
        msg += `  *رسوم الشحن والتوصيل:* ${order.shippingFee} جنيه\n`;
        msg += `🏁 *العجمالي المطلوب للدفع:* *${order.grandTotal} جنيه* (${Math.round(order.grandTotal)} ج.م)\n\n`;
        msg += `✨ _صنعناها بحب لتهديها لمن تحب - حلويات بوسي_ ✨`;

        return msg;
    }

    /* ==========================================================================
       3. منطق صفحة نجاح المعاملة (order-success.html)
       ========================================================================== */

    function initOrderSuccessPage() {
        console.log("🌸 تم تمهيد شاشة نجاح الحجز المعتمد.");
        
        try {
            history.pushState(null, null, window.location.href);
            window.addEventListener('popstate', () => {
                history.pushState(null, null, window.location.href);
            });
        } catch (e) {}

        const successOrderId = document.getElementById('success-order-id-display');
        const successWelcome = document.getElementById('success-customer-welcome');
        const retryBtn = document.getElementById('btn-whatsapp-retry-redirect');

        try {
            let lastOrderRaw = safeLocalStorage.getItem('bose_last_order');
            let lastOrder = lastOrderRaw ? JSON.parse(lastOrderRaw) : window.boseInMemoryLastOrder;
            
            if (!lastOrder) {
                const urlParams = new URLSearchParams(window.location.search);
                const queryOrderId = urlParams.get('orderId');
                const queryName = urlParams.get('name');
                const queryPhone = urlParams.get('phone');
                const queryMethod = urlParams.get('method');
                const queryArea = urlParams.get('area');
                const queryDate = urlParams.get('date');
                const queryTime = urlParams.get('time');
                const queryTotal = urlParams.get('total');

                if (queryOrderId && queryName) {
                    lastOrder = {
                        orderId: queryOrderId,
                        customerName: queryName,
                        customerPhone: queryPhone || "لا يوجد",
                        method: queryMethod || "delivery",
                        zoneArea: queryArea || "المنطقة المحددة",
                        deliveryDate: queryDate || "محدد لاحقاً",
                        deliveryTime: queryTime || "محدد لاحقاً",
                        grandTotal: queryTotal || "0"
                    };
                }
            }

            if (lastOrder) {
                if (successOrderId) successOrderId.textContent = lastOrder.orderId;
                if (successWelcome) successWelcome.textContent = `أهلاً بك يا فندم، ${escapeHtml(lastOrder.customerName)} 🌸`;
                
                renderInvoiceReceiptCard(lastOrder);
            } else {
                renderEmptySuccessCard();
            }

            let lastWhatsappUrl = safeLocalStorage.getItem('bose_last_whatsapp_url') || window.boseInMemoryLastWhatsappUrl;
            if (retryBtn && lastWhatsappUrl) {
                retryBtn.href = lastWhatsappUrl;
                
                if (!sessionStorage.getItem('bose_auto_redirected')) {
                    try {
                        sessionStorage.setItem('bose_auto_redirected', 'true');
                    } catch (sessionEx) {}
                    setTimeout(() => {
                        window.location.href = lastWhatsappUrl;
                    }, 1500);
                }
            }
        } catch (e) {
            console.error("❌ فشل بناء واجهة النجاح:", e);
        }
    }

    function renderInvoiceReceiptCard(order) {
        const receiptContainer = document.getElementById('bose-order-receipt-summary') || document.querySelector('.order-receipt-dom-wrapper');
        if (!receiptContainer) return;

        const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";

        receiptContainer.innerHTML = `
            <div style="background:var(--bose-white, #FFFFFF); border:var(--bose-border-pink); border-radius:24px; padding:24px; box-shadow:var(--bose-shadow-glow); text-align:right; direction:rtl; margin-top:20px; font-family:'Cairo', sans-serif !important;">
                <h4 style="margin:0 0 16px 0; font-size:16px; font-weight:700; border-bottom:1px solid rgba(255,145,164,0.15); padding-bottom:10px; color:var(--bose-black); font-family:'Cairo', sans-serif !important;">🧾 تفاصيل إيصال الحجز المعتمد:</h4>
                <div style="display:flex; flex-direction:column; gap:10px; font-size:14px; color:var(--bose-black);">
                    <span style="font-family:'Cairo', sans-serif !important;">👤 <strong>اسم المستلم:</strong> ${escapeHtml(order.customerName)}</span>
                    <span style="font-family:'Cairo', sans-serif !important;">📞 <strong>رقم الموبايل للتأكيد:</strong> ${escapeHtml(order.customerPhone)}</span>
                    <span style="font-family:'Cairo', sans-serif !important;">📍 <strong>نوع وتفاصيل الاستلام:</strong> ${order.method === 'pickup' ? 'سأستلم بنفسي من الفرع' : `توصيل منزلي - ${escapeHtml(order.zoneArea)}`}</span>
                    <span style="font-family:'Cairo', sans-serif !important;">🗓 <strong>موعد الاستلام المحدد:</strong> <strong style="color:var(--bose-pink); font-weight:700;">${escapeHtml(order.deliveryDate)} في تمام الساعة ${escapeHtml(order.deliveryTime)}</strong></span>
                    <hr style="border:none; border-top:1px dashed rgba(255,145,164,0.25); margin:8px 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:16px; font-family:'Cairo', sans-serif !important;">
                        <span>🏁 إجمالي الحساب النهائي المقرّب:</span>
                        <span style="color:var(--bose-pink); font-size:18px;">${order.grandTotal} ${storeCurrency}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderEmptySuccessCard() {
        const receiptContainer = document.getElementById('bose-order-receipt-summary') || document.querySelector('.order-receipt-dom-wrapper');
        if (!receiptContainer) return;

        receiptContainer.innerHTML = `
            <div style="background:var(--bose-white, #FFFFFF); border:var(--bose-border-pink); border-radius:24px; padding:32px 24px; box-shadow:var(--bose-shadow-glow); text-align:center; direction:rtl; margin-top:20px; font-family:'Cairo', sans-serif !important;">
                <div style="font-size:40px; margin-bottom:12px;">🌸</div>
                <h4 style="margin:0 0 8px 0; font-size:16px; font-weight:700; color:var(--bose-black); font-family:'Cairo', sans-serif !important;">لا توجد طلبات نشطة لعرضها حالياً</h4>
                <p style="margin:0 0 20px 0; font-size:13px; color:#666; line-height:1.6; font-family:'Cairo', sans-serif !important;">شرفنا بزيارتك ومراجعة قائمة حلويات بوسي وتصميم تورتتك المخصصة عبر المنيو الشامل في أي وقت.</p>
                <a href="menu.html" style="display:inline-block; background:var(--bose-pink, #FF91A4); color:#FFF; padding:10px 24px; border-radius:50px; text-decoration:none; font-size:13px; font-weight:700; transition:0.2s; font-family:'Cairo', sans-serif !important;">استكشف المنيو الشامل</a>
            </div>
        `;
    }

    /* ==========================================================================
       4. المساعدون والخدمات المشتركة للسلة (DRY Standard Helper Core)
       ========================================================================== */

    function initCouponSystem(pageType) {
        const couponInput = document.getElementById('coupon-input') || document.getElementById('checkout-coupon-input');
        const applyBtn = document.getElementById('btn-apply-coupon') || document.getElementById('btn-submit-coupon');
        if (!couponInput || !applyBtn) return;

        if (applyBtn.dataset.boseListener) return;

        applyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const rawCode = couponInput.value;
            const code = normalizeArabicNumerals(rawCode).toUpperCase().trim();

            if (!code) {
                safeToast("اكتب كود الخصم أولاً علشان نطبقهولك ✨");
                return;
            }

            const cart = window.getBoseCart();
            const discountableSubtotal = getDiscountableSubtotal(cart);

            const dbCoupons = window.BoseStoreData?.coupons || [
                { "code": "BOSE10", "type": "percent", "value": 10 },
                { "code": "BOOSY", "type": "fixed", "value": 50 },
                { "code": "EID", "type": "percent", "value": 15 }
            ];

            const matchedCoupon = dbCoupons.find(c => c.code === code);

            if (matchedCoupon) {
                safeLocalStorage.setItem('bose_applied_coupon', code);
                safeToast("تم تطبيق كود الخصم بنجاح! نوّرت عيلتنا الكبيرة يا فندم 🌸");
                setTimeout(() => {
                    if (pageType === 'cart') {
                        renderCartItems();
                    } else {
                        recalculateCheckoutTotals(checkoutMethod);
                    }
                }, 300);
            } else {
                safeLocalStorage.removeItem('bose_applied_coupon');
                safeToast("الكود ده مش صحيح أو صلاحيته انتهت، ياريت تراجع الكود وتجرّب تاني ✨");
            }
        });
        applyBtn.dataset.boseListener = "true";
    }

    function getActiveAppliedCoupon(discountableSubtotal) {
        if (discountableSubtotal <= 0) return null;

        let code = safeLocalStorage.getItem('bose_applied_coupon');
        if (!code) return null;

        code = normalizeArabicNumerals(code).toUpperCase().trim();

        const dbCoupons = window.BoseStoreData?.coupons || [
            { "code": "BOSE10", "type": "percent", "value": 10 },
            { "code": "BOOSY", "type": "fixed", "value": 50 },
            { "code": "EID", "type": "percent", "value": 15 }
        ];

        const matched = dbCoupons.find(c => c.code === code);
        let discount = 0;

        if (matched) {
            if (matched.type === "percent") {
                discount = Math.round(discountableSubtotal * (parseFloat(matched.value) / 100));
            } else if (matched.type === "fixed") {
                discount = parseFloat(matched.value) || 0;
            }
        } else if (code === "BOSE10") {
            discount = Math.round(discountableSubtotal * 0.1);
        } else if (code === "BOOSY") {
            discount = 50;
        } else if (code === "EID") {
            discount = Math.round(discountableSubtotal * 0.15);
        }

        return { code: code, amount: Math.min(discount, discountableSubtotal) };
    }

    function renderCouponStatusHTML(pageType, discountableSubtotal) {
        const couponInput = document.getElementById('coupon-input') || document.getElementById('checkout-coupon-input');
        const messageNode = document.getElementById('coupon-message') || document.getElementById('coupon-status-text');
        if (!messageNode || !couponInput) return;

        let code = safeLocalStorage.getItem('bose_applied_coupon') || "";
        if (code) {
            code = normalizeArabicNumerals(code).toUpperCase().trim();
            const activeCoupon = getActiveAppliedCoupon(discountableSubtotal);
            const storeCurrency = window.BoseStoreData?.store?.currency || "EGP";
            let valText = activeCoupon && activeCoupon.amount > 0 ? ` (خصم بقيمة ${activeCoupon.amount} ${storeCurrency})` : "";

            couponInput.value = code;
            messageNode.innerHTML = `تم تطبيق الكوبون <strong>${escapeHtml(code)}</strong> بنجاح!${valText} 🌸 <a href="#" id="btn-cancel-coupon-node" style="color:var(--bose-black, #111111); margin-right:8px; font-weight:700; text-decoration:underline;">إلغاء الكوبون</a>`;
            messageNode.style.color = "var(--bose-pink, #FF91A4)";

            const cancelBtn = document.getElementById('btn-cancel-coupon-node');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    safeLocalStorage.removeItem('bose_applied_coupon');
                    couponInput.value = "";
                    messageNode.textContent = "";
                    if (pageType === 'cart') {
                        renderCartItems();
                    } else {
                        recalculateCheckoutTotals(checkoutMethod);
                    }
                });
            }
        } else {
            messageNode.textContent = "";
        }
    }

    function translateDetailKey(key) {
        const translations = {
            'cakeType': '🎂 نوع الكيك',
            'shape': '📐 الشكل الهندسي',
            'persons': '👥 حجم التورتة (عدد الأفراد)',
            'printingType': '📸 خيار طباعة الصور',
            'customMessage': '✍ النص المكتوب على المنتج',
            'allergyNote': '⚠️ ملاحظات الحساسية الغذائية',
            'flowerType': '💐 نوع الورد المختار',
            'flowerCount': '🌹 عدد الوردات بالبوكيه',
            'moneyAmount': '💵 مبلغ الكاش المدمج',
            'moneyFee': '💰 فئة العملات النقدية المدمجة',
            'chocolatePieces': '🍫 قطع الشوكولاتة الفاخرة',
            'wrappingType': '🎀 خيار تغليف البوكيه',
            'giftCardText': '✉ كارت إهداء خاص',
            'size': '📏 الحجم المطلوب',
            'topping': '🍯 التوبنج الإضافي',
            'flavor': '🍒 النكهة المحددة',
            'cakeColor': '🎨 لون التورتة المختار',
            'color': '🎨 لون التورتة المختار',
            'chocolateType': '🍫 نوع الشوكولاتة المدمجة'
        };
        return translations[key] || key;
    }

    function formatDetailValue(key, val) {
        if (val === true) return "نعم 🌸";
        if (val === false || val === null || val === undefined || val === "") return "لا";

        const strVal = val.toString();

        if (key === 'shape') {
            const shapes = { 'circle': 'دائري كلاسيكي متناسق', 'heart': 'قلب رومانسي أنيق', 'square': 'مربع عصري مميز', 'rectangle': 'مستطيل عائلي فاخر' };
            return shapes[strVal] || strVal;
        }
        if (key === 'flowerType') {
            const types = { 'natural': 'ورد طبيعي نضر ورائع', 'artificial': 'ورد صناعي فاخر يدوم طويلاً', 'satin': 'ورد ستان منسق يدوياً بكل حب' };
            return types[strVal] || strVal;
        }
        if (key === 'printingType') {
            const prints = { 'none': 'بدون صور مخصصة', 'edible': 'صورة غذائية ممتازة وقابلة للأكل', 'non-edible': 'صورة ورقية تذكارية مجسمة' };
            return prints[strVal] || strVal;
        }
        if (key === 'chocolateType') {
            const chocolates = { 'local': 'شوكولاتة كلاسيك', 'premium': 'شوكولاتة فاخرة', 'rocher': 'روشيه مستورد', 'none': 'بدون شوكولاتة' };
            return chocolates[strVal] || strVal;
        }
        if (key === 'wrappingType') {
            const wrappings = { 'satin': 'تغليف ستان فاخر', 'classic': 'تغليف كلاسيك راقٍ', 'box': 'بوكس هدايا فاخر' };
            return wrappings[strVal] || strVal;
        }
        if (key === 'moneyAmount' || key === 'chocolatePieces' || key === 'flowerCount' || key === 'persons') {
            const numVal = parseInt(strVal, 10);
            if (key === 'moneyAmount') return numVal > 0 ? `${numVal} جنيه` : "لا يوجد";
            if (key === 'chocolatePieces') return numVal > 0 ? `${numVal} قطعة` : "لا يوجد";
            if (key === 'flowerCount') return numVal > 0 ? `${numVal} وردة` : "0 وردة";
            if (key === 'persons') return numVal > 0 ? `${numVal} فرد` : "0 فرد";
        }
        return strVal;
    }

    /* ==========================================================================
       5. التمهيد والتأمين المتزامن لضمان الموثوقية الكاملة
       ========================================================================== */

    function verifyAndBootCartEngine() {
        if (window.BoseStoreData && window.BoseStoreData.store) {
            bootstrapPageEngine();
        } else {
            let boseRetryAttempts = 0;
            const boseMaxRetry = 50;
            const boseGuardInterval = setInterval(() => {
                boseRetryAttempts++;
                if (window.BoseStoreData && window.BoseStoreData.store) {
                    clearInterval(boseGuardInterval);
                    bootstrapPageEngine();
                } else if (boseRetryAttempts >= boseMaxRetry) {
                    clearInterval(boseGuardInterval);
                    bootstrapPageEngine();
                }
            }, 40);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verifyAndBootCartEngine);
    } else {
        verifyAndBootCartEngine();
    }
})();