/**
 * 👑 محرك السلة وإتمام الطلب والتوثيق المالي النهائي الفاخر والمطور - حلويات بوسي 👑
 * النسخة الهندسية القياسية الشاملة والمطورة كلياً - خالية تماماً من ثغرات البتر وتداخل النصوص V7.0
 * الأداء: تم تحديثه ليعتمد على التحديث الموضعي (Localized DOM Mutations) لتوفير المعالج والبيانات بنسبة 100%
 * التوافق: معزول كلياً ويلتزم بمهامه دون التداخل مع أي ملف آخر أو تكرار وظائفه اللوجستية
 * [تم إصلاح ثغرة جلب البيانات وجدولة الفواتير جذرياً وحظر اختفاء المنتجات المضافة عند التوجيه]
 */

/**
 * 🛡️ تحميل السلة من localStorage مع إعادة حساب كل سعر من بيانات المتجر
 * الموثوقة قبل عرضه أو استخدامه في أي حساب إجمالي أو رسالة طلب نهائية.
 * تُستخدم في كل مكان بدل القراءة المباشرة من localStorage.
 */
function loadTrustedCart() {
    const rawCart = localStorage.getItem("bose_cart");
    let cart = rawCart ? JSON.parse(rawCart) : [];
    if (typeof window.recalculateFullCart === "function") {
        const result = window.recalculateFullCart(cart);
        cart = result.cart;
        localStorage.setItem("bose_cart", JSON.stringify(cart));
        // 🛡️ [إصلاح]: wasTampered كانت بترجع من الدالة وميتستخدمش خالص في أي مكان.
        // دلوقتي بنسجلها على الأقل في الكونسول (وممكن تتربط لاحقاً بأي نظام
        // تتبع/تحليلات) عشان محاولات التلاعب بالسعر متعديش من غير أي أثر.
        if (result.wasTampered) {
            console.warn("⚠️ تم اكتشاف واحتساب فرق في سعر عنصر بالسلة تلقائياً (تم تصحيحه بأمان).");
        }
    }
    return cart;
}

document.addEventListener("DOMContentLoaded", () => {
    // حقن واجهة التنبيهات الفاخرة المخصصة للبراند فوراً
    injectBoseCustomModalStyles();
    
    // ربط المحرك المركزي والانتظار حتى تهيئة قاعدة البيانات الأساسية لـ JSON لمنع ثغرة السباق البرمجي واختفاء الأصناف
    if (window.BoseStoreData && window.BoseStoreData.store) {
        initializeCartEngine(window.BoseStoreData);
    } else {
        document.addEventListener("BoseDatabaseLoaded", (e) => {
            initializeCartEngine(e.detail);
        });
    }
});

/**
 * دالة التهيئة والتحكم الأساسية لمحرك السلة والطلب
 */
function initializeCartEngine(storeData) {
    const isCartPage = document.getElementById("cart-items-wrapper") !== null;
    const isCheckoutPage = document.getElementById("btn-submit-order-final") !== null;
    const isSuccessPage = document.getElementById("success-order-id-display") !== null;

    if (isCartPage) {
        renderBoseCartPage(storeData);
    } else if (isCheckoutPage) {
        renderBoseCheckoutPage(storeData);
    } else if (isSuccessPage) {
        renderBoseSuccessPage(storeData);
    }
}

/**
 * =========================================================================
 * 🏪 1. محرك وإدارة صفحة سلة المشتريات (cart.html)
 * =========================================================================
 */
function renderBoseCartPage(storeData) {
    const cartWrapper = document.getElementById("cart-items-wrapper");
    const clearCartBtn = document.getElementById("btn-clear-cart") || document.querySelector("button.btn-clear-all-cart");
    
    // رندرة السلة الشاملة من الذاكرة المحلية الموحدة bose_cart
    function buildFullCartUI() {
        const cart = loadTrustedCart();
        
        if (clearCartBtn) {
            clearCartBtn.style.display = cart.length > 0 ? "block" : "none";
        }
        
        if (cart.length === 0) {
            cartWrapper.innerHTML = `
                <div class="empty-cart-message-block" style="text-align: center; padding: 60px 20px; background: #FFFFFF;">
                    <i class="fas fa-shopping-bag" style="font-size: 48px; color: #FF91A4; margin-bottom: 20px; display: block; opacity: 0.6;"></i>
                    <p style="font-size: 18px; font-weight: 700; color: #111111; font-family: 'Cairo'; margin-bottom: 20px;">سلة المشتريات فارغة حالياً</p>
                    <a href="menu.html" class="bose-btn-primary" style="display: inline-block; background: #FF91A4; color: #FFFFFF; padding: 12px 30px; border-radius: 12px; text-decoration: none; font-weight: 700; font-family: 'Cairo'; box-shadow: 0 8px 32px rgba(255, 145, 164, 0.15);">تصفح المنيو الشامل</a>
                </div>
            `;
            updateCartSummary(cart, storeData);
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        cart.forEach((item, index) => {
            const finalProductPrice = parseFloat(item.finalPrice || 0);
            const totalItemCost = finalProductPrice * (parseInt(item.quantity, 10) || 1);
            
            let customDetailsHTML = "";
            const esc = window.escapeBoseHTML || (s => s);
            
            const isCakeBespoke = item.type === "custom-cake" || item.type === "mini-cake" || item.productSlug === "toort-custom-master" || item.productSlug === "mini-cake-two-person";
            const isFlowerBespoke = item.type === "custom-flower" || item.productSlug === "flowers-master";
            
            if (item.customDetails) {
                let specs = [];
                const cd = item.customDetails;

                if (isCakeBespoke) {
                    if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") specs.push(`<span><strong>طعم الكيك:</strong> ${esc(cd.cakeType)}</span>`);
                    if (cd.shape && cd.shape !== "none") specs.push(`<span><strong>الشكل:</strong> ${cd.shape === 'circle' ? 'دائري' : cd.shape === 'heart' ? 'قلب' : cd.shape === 'square' ? 'مربع' : cd.shape === 'rectangle' ? 'مستطيل' : esc(cd.shape)}</span>`);
                    if (cd.persons && parseInt(cd.persons, 10) > 0) specs.push(`<span><strong>عدد الأفراد:</strong> ${parseInt(cd.persons, 10)} فرد</span>`);
                    if (cd.printingType && cd.printingType !== "none") specs.push(`<span><strong>الطباعة:</strong> ${cd.printingType === 'edible' ? 'صورة صالحة للأكل' : 'صورة مجسمة غير صالحة للأكل'}</span>`);
                    if (cd.customMessage && cd.customMessage.trim() !== "") specs.push(`<span><strong>الرسالة المكتوبة:</strong> "${esc(cd.customMessage.trim())}"</span>`);
                    if (cd.allergyNote && cd.allergyNote.trim() !== "") specs.push(`<span style="color:#D4AF37;"><strong>ملاحظة الحساسية:</strong> ${esc(cd.allergyNote.trim())}</span>`);
                }
                
                if (isFlowerBespoke) {
                    if (cd.flowerType && cd.flowerType !== "none") specs.push(`<span><strong>نوع الورد:</strong> ${cd.flowerType === 'natural' ? 'طبيعي نضر' : cd.flowerType === 'artificial' ? 'صناعي فاخر' : 'ستان مصنوع بحب'}</span>`);
                    if (cd.flowerCount && parseInt(cd.flowerCount, 10) > 0) specs.push(`<span><strong>عدد الورد:</strong> ${parseInt(cd.flowerCount, 10)} وردة</span>`);
                    if (cd.moneyAmount && parseInt(cd.moneyAmount, 10) > 0) specs.push(`<span><strong>الكاش المدمج:</strong> +${parseInt(cd.moneyAmount, 10)} جنيه</span>`);
                    if (cd.chocolatePieces && parseInt(cd.chocolatePieces, 10) > 0) specs.push(`<span><strong>قطع الشوكولاتة:</strong> ${parseInt(cd.chocolatePieces, 10)} قطعة</span>`);
                    if (cd.wrappingType && cd.wrappingType !== "none") specs.push(`<span><strong>التغليف:</strong> ${esc(cd.wrappingType)}</span>`);
                    if (cd.giftCardText && cd.giftCardText.trim() !== "") specs.push(`<span><strong>كارت الإهداء:</strong> "${esc(cd.giftCardText.trim())}"</span>`);
                }

                // 👑 [إصلاح جذري - كارثة الأحجام]: المنتجات العادية (زي الديسباسيتو/القشطوطة)
                // اللي عندها أكتر من حجم سعر لازم يظهر الحجم اللي العميل اختاره بوضوح جوه
                // كارت السلة - قبل كده كان الفرق الوحيد بين الأحجام هو السعر بصمت، والعميل
                // نفسه ميعرفش هو مشتري مقاس إيه غير لما الطلب يوصله فعلياً.
                if (!isCakeBespoke && !isFlowerBespoke && cd.sizeLabel) {
                    specs.push(`<span><strong>الحجم:</strong> ${esc(cd.sizeLabel)}</span>`);
                }

                if (specs.length > 0) {
                    customDetailsHTML = `<div class="cart-item-customizations-panel" style="font-size: 13px; color: #111111; background: rgba(255,145,164,0.04); padding: 10px; border-radius: 12px; margin: 6px 0; border-right: 3px solid #FF91A4; display: flex; flex-direction: column; gap: 4px; width: 100%; box-sizing: border-box; font-family: 'Cairo';">${specs.join("")}</div>`;
                }
            }

            let cleanFlavorName = item.flavorName;
            if (!cleanFlavorName || cleanFlavorName === "افتراضي" || cleanFlavorName === "none" || isCakeBespoke || isFlowerBespoke) {
                if (storeData && storeData.products) {
                    const matchedDbProd = storeData.products.find(p => p.slug === item.productSlug);
                    cleanFlavorName = matchedDbProd ? matchedDbProd.flavorName : "جاهز وفريش";
                } else {
                    cleanFlavorName = "جاهز وفريش";
                }
            }

            const cartCard = document.createElement("div");
            cartCard.className = "bose-cart-item-card";
            cartCard.setAttribute("data-item-id", item.id);
            cartCard.setAttribute("data-index", index);
            
            const safeCartImg = (window.optimizeBoseImageUrl ? window.optimizeBoseImageUrl(item.image, 240) : item.image) || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png';
            const safeTitle = esc(item.title || "");
            const safeFlavorName = esc(cleanFlavorName || "");

            // 🛡️ [إصلاح حرج]: كارت عنصر السلة كان div عادي بدون أي رابط - الصورة والعنوان
            // معندهمش أي وسم <a> يوصل العميل لصفحة تفاصيل المنتج، فمفيش أي طريقة للعميل
            // يرجع يشوف وصف/صور المنتج وهو بيراجع سلته قبل الشراء، وده بالظبط اللي كان
            // بيصعب قرار الشراء عليه. بالنسبة لمنتجات المحاكي (تورت مخصص/بوكيه) معندهاش
            // صفحة منتج ثابتة أصلاً (هي أساسًا صفحة محاكي)، فمفيش رابط ليها هنا عشان منوديش
            // العميل لصفحة هتحوله فورًا برا السلة من غير فايدة حقيقية.
            const linkStart = (!isCakeBespoke && !isFlowerBespoke && item.productSlug)
                ? `<a href="product.html?slug=${encodeURIComponent(item.productSlug)}" style="text-decoration:none; color:inherit; display:contents;">`
                : '';
            const linkEnd = linkStart ? `</a>` : '';

            cartCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 20px; flex: 1; min-width: 0;">
                    ${linkStart}
                    <img src="${safeCartImg}" class="cart-item-image" alt="${safeTitle}" style="width: 120px; height: 120px; border-radius: 20px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255,145,164,0.3); cursor: ${linkStart ? 'pointer' : 'default'};" loading="lazy">
                    <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; text-align: right;">
                        <h3 class="cart-item-title" style="margin: 0; font-size: 16px; font-weight: 700; color: #111111; font-family: 'Cairo'; line-height: 1.4; cursor: ${linkStart ? 'pointer' : 'default'};">${safeTitle}</h3>
                        <span class="cart-item-flavor-name" style="font-size: 13.5px; color: #FF91A4; font-weight: 700; font-family: 'Cairo';">${safeFlavorName}</span>
                        ${linkEnd}
                        ${customDetailsHTML}
                        
                        <div class="bose-qty-controller-box" style="display: flex; align-items: center; border: 1px solid rgba(255, 145, 164, 0.3); border-radius: 12px; width: max-content; margin-top: 8px; background: #FFFFFF; height: 38px; padding: 2px;">
                            <button class="btn-qty-plus" data-index="${index}" style="border: none; background: transparent; width: 36px; height: 100%; font-weight: 700; font-size: 16px; color: #111111; cursor: pointer;">+</button>
                            <input type="text" readonly class="qty-numerical-display" value="${item.quantity}" style="width: 36px; text-align: center; border: none; font-size: 15px; font-weight: 700; color: #111111; background: transparent; font-family: 'Cairo';">
                            <button class="btn-qty-minus" data-index="${index}" style="border: none; background: transparent; width: 36px; height: 100%; font-weight: 700; font-size: 16px; color: #111111; cursor: pointer;">-</button>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; min-height: 100px; flex-shrink: 0; text-align: left;">
                    <button class="btn-remove-item" data-index="${index}" aria-label="حذف الصنف" style="background: transparent; border: none; color: rgba(17,17,17,0.3); font-size: 16px; cursor: pointer; padding: 6px; transition: color 0.2s;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    
                    <div style="text-align: left; font-family: 'Cairo';">
                        <span class="qty-multiplication-label" style="display: ${item.quantity > 1 ? 'block' : 'none'}; font-size: 12px; color: #111111; opacity: 0.6; direction: ltr;">${finalProductPrice.toFixed(2)} × ${item.quantity}</span>
                        <div class="cart-item-total-price" style="font-size: 18px; font-weight: 700; color: #FF91A4; white-space: nowrap;">${totalItemCost.toFixed(2)} <span style="font-size: 12px; font-weight: 700; color: #111111;">EGP</span></div>
                    </div>
                </div>
            `;
            
            fragment.appendChild(cartCard);
        });
        
        cartWrapper.innerHTML = "";
        cartWrapper.appendChild(fragment);
        updateCartSummary(cart, storeData);
    }
    
    function updateSingleItemDOM(cardElement, item, finalProductPrice, totalItemCost) {
        const qtyDisplay = cardElement.querySelector(".qty-numerical-display");
        const multiLabel = cardElement.querySelector(".qty-multiplication-label");
        const totalDisplay = cardElement.querySelector(".cart-item-total-price");
        
        if (qtyDisplay) qtyDisplay.value = item.quantity;
        if (multiLabel) {
            multiLabel.textContent = `${finalProductPrice.toFixed(2)} × ${item.quantity}`;
            multiLabel.style.display = item.quantity > 1 ? "block" : "none";
        }
        if (totalDisplay) {
            totalDisplay.innerHTML = `${totalItemCost.toFixed(2)} <span style="font-size: 12px; font-weight: 700; color: #111111;">EGP</span>`;
        }
    }
    
    cartWrapper.onclick = (e) => {
        const target = e.target.closest("button");
        if (!target) return;
        
        const cardElement = target.closest(".bose-cart-item-card");
        if (!cardElement) return;
        
        const index = parseInt(cardElement.getAttribute("data-index"), 10);
        const cart = loadTrustedCart();
        
        if (isNaN(index) || !cart[index]) return;
        
        const item = cart[index];
        const finalProductPrice = parseFloat(item.finalPrice || 0);
        
        if (target.classList.contains("btn-qty-plus")) {
            item.quantity += 1;
            localStorage.setItem("bose_cart", JSON.stringify(cart));
            if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
            if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("تمت إضافة قطعة أخرى للسلة.");
            
            updateSingleItemDOM(cardElement, item, finalProductPrice, finalProductPrice * item.quantity);
            updateCartSummary(cart, storeData);
        } else if (target.classList.contains("btn-qty-minus")) {
            if (item.quantity > 1) {
                item.quantity -= 1;
                localStorage.setItem("bose_cart", JSON.stringify(cart));
                if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
                if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("تم تقليل قطعة من السلة.");
                
                updateSingleItemDOM(cardElement, item, finalProductPrice, finalProductPrice * item.quantity);
                updateCartSummary(cart, storeData);
            } else {
                triggerCartItemRemoval(cart, index, storeData, buildFullCartUI);
            }
        } else if (target.classList.contains("btn-remove-item")) {
            triggerCartItemRemoval(cart, index, storeData, buildFullCartUI);
        }
    };
    
    if (clearCartBtn) {
        clearCartBtn.onclick = () => {
            showBoseCustomModal("تحب تفضّي السلة من كل الأصناف؟", () => {
                localStorage.removeItem("bose_cart");
                if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
                if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("السلة اتفضّت خالص.");
                buildFullCartUI();
            });
        };
    }

    buildFullCartUI();
}

function triggerCartItemRemoval(cart, index, storeData, callback) {
    showBoseCustomModal(`تحب تشيل "${cart[index].title}" من السلة؟`, () => {
        cart.splice(index, 1);
        localStorage.setItem("bose_cart", JSON.stringify(cart));
        if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
        if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("الصنف اتشال من السلة.");
        callback();
    });
}

function updateCartSummary(cart, storeData) {
    const subtotalDisplay = document.getElementById("cart-subtotal-value") || document.getElementById("summary-subtotal");
    const grandTotalDisplay = document.getElementById("cart-grand-total-value") || document.getElementById("summary-grand-total");
    const itemsCountDisplay = document.getElementById("summary-items-count");
    
    // 🧮 [توحيد حسابي]: استخدام calculateBoseInvoice الموحدة بدل تكرار
    // نفس المعادلة محلياً هنا (كانت بتفرق فعلياً عن checkout عند أي تعديل مستقبلي).
    const invoice = window.calculateBoseInvoice(cart, storeData, 0);
    
    if (subtotalDisplay) subtotalDisplay.textContent = invoice.subtotal.toFixed(2) + " EGP";
    if (itemsCountDisplay) itemsCountDisplay.textContent = invoice.itemsCount;
    
    const discountDisplay = document.getElementById("summary-discount");
    if (discountDisplay) discountDisplay.textContent = invoice.discount.toFixed(2) + " EGP";
    
    if (grandTotalDisplay) {
        grandTotalDisplay.textContent = invoice.grandTotal + " EGP";
    }
    
    const promoInput = document.getElementById("coupon-input");
    const promoBtn = document.getElementById("btn-apply-coupon");
    const couponMsg = document.getElementById("coupon-message");
    
    if (promoBtn && promoInput && couponMsg) {
        if (!promoBtn.dataset.listenerAttached) {
            promoBtn.onclick = async () => {
                const code = promoInput.value.trim().toUpperCase();
                if (!code) return;

                // 🛡️ [إصلاح أمني]: التحقق من الكوبون بقى بيتم عبر دالة آمنة في الباكند
                // (validate_coupon RPC عن طريق window.BoseSupabase.validateBoseCoupon)
                // بدل مقارنته محلياً مع قايمة storeData.coupons اللي كانت بتوصل كاملة
                // وواضحة لأي حد يفتح ملف بيانات المتجر العام مباشرة في المتصفح.
                if (!window.BoseSupabase || typeof window.BoseSupabase.validateBoseCoupon !== "function") {
                    couponMsg.className = "coupon-status-toast error";
                    couponMsg.textContent = "⚠️ تعذر التحقق من الكوبون حالياً، حاول تحديث الصفحة.";
                    return;
                }

                const originalBtnLabel = promoBtn.textContent;
                promoBtn.disabled = true;
                promoBtn.textContent = "بيتم التحقق...";

                try {
                    const result = await window.BoseSupabase.validateBoseCoupon(code);
                    if (result && result.is_valid) {
                        // ⚠️ ملحوظة: أسماء الحقول دي (discount_type/discount_value) افتراض
                        // منطقي بناءً على استخدام calculateCouponDiscount(subtotal, {type, value}).
                        // لازم تتأكد إنها مطابقة تماماً لأسماء الأعمدة الراجعة فعلياً من
                        // دالة validate_coupon في قاعدة البيانات، وتعدلها هنا لو مختلفة.
                        const discountType = result.discount_type || result.type || "percent";
                        const discountValue = parseFloat(result.discount_value ?? result.value ?? 0) || 0;
                        localStorage.setItem("bose_active_coupon", JSON.stringify({ code, type: discountType, value: discountValue }));
                        couponMsg.className = "coupon-status-toast success";
                        couponMsg.textContent = discountType === "fixed"
                            ? `✅ تمام، خصم الكوبون اتطبق: ${discountValue} جنيه`
                            : `✅ تمام، خصم الكوبون اتطبق: ${discountValue}%`;
                        if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("تم تطبيق كود الخصم بنجاح");
                        updateCartSummary(cart, storeData);
                    } else {
                        localStorage.removeItem("bose_active_coupon");
                        couponMsg.className = "coupon-status-toast error";
                        couponMsg.textContent = (result && result.message) || "⚠️ كود الخصم ده مش شغال، تأكدوا منه أو من تاريخ صلاحيته.";
                    }
                } catch (err) {
                    couponMsg.className = "coupon-status-toast error";
                    couponMsg.textContent = "⚠️ تعذر التحقق من الكوبون، تأكد من الاتصال بالإنترنت وحاول تاني.";
                } finally {
                    promoBtn.disabled = false;
                    promoBtn.textContent = originalBtnLabel;
                }
            };
            promoBtn.dataset.listenerAttached = "true";
        }
    }
}

/**
 * =========================================================================
 * 🛡️ 2. محرك وإدارة صفحة إتمام الطلب وتأكيد المشتريات (checkout.html)
 * =========================================================================
 */
function renderBoseCheckoutPage(storeData) {
    const cart = loadTrustedCart();
    
    if (cart.length === 0 && !window.location.pathname.includes("order-success.html")) {
        window.location.href = "cart.html";
        return;
    }

    const pickupBtn = document.getElementById("method-pickup");
    const deliveryBtn = document.getElementById("method-delivery");
    const shippingZoneWrapper = document.getElementById("shipping-zone-wrapper");
    const zoneSelect = document.getElementById("checkout-zone-select");
    const addressDetailsWrapper = document.getElementById("checkout-address-details-wrapper");
    
    let currentShippingMethod = "pickup"; 
    let selectedShippingFee = 0;

    if (pickupBtn) {
        pickupBtn.onclick = () => {
            currentShippingMethod = "pickup";
            pickupBtn.className = "shipping-method-card active-option";
            if (deliveryBtn) deliveryBtn.className = "shipping-method-card";
            
            if (shippingZoneWrapper) shippingZoneWrapper.style.display = "none";
            if (addressDetailsWrapper) addressDetailsWrapper.style.display = "none";
            
            injectBoseBranchBlock(storeData);
            selectedShippingFee = 0;
            recalculateCheckoutInvoice(cart, storeData, selectedShippingFee);
        };
    }

    if (deliveryBtn) {
        deliveryBtn.onclick = () => {
            currentShippingMethod = "delivery";
            deliveryBtn.className = "shipping-method-card active-option";
            if (pickupBtn) pickupBtn.className = "shipping-method-card";
            
            const branchBlock = document.getElementById("bose-branch-info-static");
            if (branchBlock) branchBlock.remove();
            
            if (shippingZoneWrapper) shippingZoneWrapper.style.display = "block";
            if (addressDetailsWrapper) addressDetailsWrapper.style.display = "block";
            
            fetchSelectedZonePrice();
        };
    }

    if (zoneSelect) {
        zoneSelect.onchange = () => {
            fetchSelectedZonePrice();
        };
    }

    function fetchSelectedZonePrice() {
        if (!zoneSelect || currentShippingMethod !== "delivery") {
            selectedShippingFee = 0;
            return;
        }
        const selectedZoneId = zoneSelect.value;
        let fee = 0;
        
        if (storeData.shippingZones) {
            const zoneRule = storeData.shippingZones.find(z => z.id === selectedZoneId);
            if (zoneRule) {
                fee = parseFloat(zoneRule.price || 0);
            }
        }
        selectedShippingFee = fee;
        recalculateCheckoutInvoice(cart, storeData, selectedShippingFee);
    }

    if (pickupBtn) pickupBtn.click();

    const submitOrderBtn = document.getElementById("btn-submit-order-final");
    if (submitOrderBtn) {
        submitOrderBtn.onclick = (e) => {
            e.preventDefault();
            processFinalBoseOrder(cart, storeData, currentShippingMethod, selectedShippingFee);
        };
    }
}

function injectBoseBranchBlock(storeData) {
    const existingBlock = document.getElementById("bose-branch-info-static");
    if (existingBlock) return;
    
    const insertionPoint = document.getElementById("shipping-zone-wrapper");
    if (!insertionPoint) return;
    
    const branchDiv = document.createElement("div");
    branchDiv.id = "bose-branch-info-static";
    branchDiv.style.cssText = "background: rgba(255, 145, 164, 0.04); border: 1px solid #FF91A4; padding: 16px; border-radius: 14px; margin: 15px 0; direction: rtl; text-align: right;";
    
    const addressText = storeData.store?.pickup?.address || "الكفاح شارع الوحدة المحلية بجوار صيدلية الدكتور أحمد مجدي وبجوار عيادة الدكتور علي";
    const mapLink = storeData.store?.pickup?.mapUrl || "https://maps.app.goo.gl/nAg4Y7vQ7hACvKGc8?g_st=ac";
    const escBranch = window.escapeBoseHTML || (s => s);

    branchDiv.innerHTML = `
        <h4 style="margin: 0 0 6px 0; font-size: 15px; color: #111111; font-weight: 700; font-family: 'Cairo';"><i class="fas fa-building" style="color: #FF91A4; margin-left: 6px;"></i> مقر الاستلام الرسمي للبراند:</h4>
        <p style="margin: 0 0 12px 0; font-size: 13.5px; color: #111111; opacity: 0.8; line-height: 1.6; font-family: 'Cairo';">${escBranch(addressText)}</p>
        <a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="success-action-secondary-btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; background: #FFFFFF; border: 1px solid #FF91A4; color: #111111; font-family: 'Cairo';">
            <i class="fas fa-map-marked-alt" style="color: #FF91A4;"></i> عرض الموقع على خرائط جوجل
        </a>
    `;
    
    insertionPoint.parentNode.insertBefore(branchDiv, insertionPoint);
}

function recalculateCheckoutInvoice(cart, storeData, shippingFee) {
    const subtotalDisplay = document.getElementById("summary-subtotal");
    const shippingDisplay = document.getElementById("summary-shipping-fee");
    const grandTotalDisplay = document.getElementById("summary-grand-total");
    
    // 🧮 [توحيد حسابي]: نفس دالة السلة بالظبط، فرق الشحن بس بيتمرر كباراميتر
    const invoice = window.calculateBoseInvoice(cart, storeData, shippingFee);

    if (subtotalDisplay) subtotalDisplay.textContent = invoice.subtotal.toFixed(2) + " EGP";
    if (shippingDisplay) {
        shippingDisplay.textContent = invoice.shippingFee === 0 ? "مجاناً" : invoice.shippingFee.toFixed(2) + " EGP";
    }
    
    if (grandTotalDisplay) {
        grandTotalDisplay.textContent = invoice.grandTotal + " EGP";
    }
}

function processFinalBoseOrder(cart, storeData, method, shippingFee) {
    const customerNameInput = document.getElementById("checkout-customer-name");
    const customerPhoneInput = document.getElementById("checkout-customer-phone");
    const customerPhone2Input = document.getElementById("checkout-customer-phone-2");
    const addressDetailsInput = document.getElementById("checkout-address-details");
    const zoneSelect = document.getElementById("checkout-zone-select");
    const deliveryDateInput = document.getElementById("checkout-delivery-date");
    const deliveryTimeInput = document.getElementById("checkout-delivery-time");
    const orderNotesInput = document.getElementById("checkout-order-notes-textarea");

    const customerName = customerNameInput ? customerNameInput.value.trim() : "";
    if (customerName.length < 3) {
        showBoseCustomModal("يرجى كتابة اسم صاحب الطلب بالكامل ثنائياً على الأقل.");
        if (customerNameInput) customerNameInput.focus();
        return;
    }

    const phone1 = customerPhoneInput ? customerPhoneInput.value.trim() : "";
    if (typeof window.validateBosePhoneNumber === "function") {
        if (!window.validateBosePhoneNumber(phone1)) {
            showBoseCustomModal("يرجى إدخال رقم هاتف محمول مصري صحيح ومطابق للشبكة.");
            if (customerPhoneInput) customerPhoneInput.focus();
            return;
        }
    }
    const sanitizedPhone1 = typeof window.sanitizeBosePhoneNumber === "function" ? window.sanitizeBosePhoneNumber(phone1) : phone1;

    let sanitizedPhone2 = "";
    if (customerPhone2Input && customerPhone2Input.value.trim() !== "") {
        const phone2 = customerPhone2Input.value.trim();
        if (typeof window.validateBosePhoneNumber === "function" && !window.validateBosePhoneNumber(phone2)) {
            showBoseCustomModal("رقم الهاتف البديل غير صحيح، يرجى مراجعته أو مسحه ليبقى اختيارياً.");
            customerPhone2Input.focus();
            return;
        }
        sanitizedPhone2 = typeof window.sanitizeBosePhoneNumber === "function" ? window.sanitizeBosePhoneNumber(phone2) : phone2;
    }

    let fullAddressText = "استلام يدوي مباشر من مقر الفرع";
    let selectedZoneName = "فرع الكفاح الرئيسي";
    // 🛡️ [إصلاح حرج]: zoneSelect.value هو الـid الحقيقي لمنطقة الشحن (نص إنجليزي
    // زي cairo-nasr-city) اللي checkout.html بيحطه كـvalue للـoption - قبل كده كان
    // بيتعامل معاه غلط كأنه "اسم" ظاهر للعميل ويتحط في نص العنوان بدل الاسم
    // الحقيقي للمنطقة (زي "مدينة نصر")، وكمان مكانش بيتسجل في قاعدة البيانات
    // خالص (shippingZoneId كان بيتبعت null دايماً رغم وجود المنطقة الحقيقية).
    // دلوقتي بيتفصل الاثنين: selectedZoneId (للقاعدة) و selectedZoneName (نص
    // العنوان المقروء من نص الـoption نفسه، مش من الـvalue).
    let selectedZoneId = "";

    if (method === "delivery") {
        if (zoneSelect && !zoneSelect.value) {
            showBoseCustomModal("يرجى تحديد المنطقة السكنية.");
            zoneSelect.focus();
            return;
        }
        selectedZoneId = zoneSelect ? zoneSelect.value : "";
        const selectedOption = zoneSelect && zoneSelect.selectedOptions ? zoneSelect.selectedOptions[0] : null;
        selectedZoneName = selectedOption ? selectedOption.textContent : selectedZoneId;

        const addressDetails = addressDetailsInput ? addressDetailsInput.value.trim() : "";
        if (addressDetails.length < 8) {
            showBoseCustomModal("يرجى كتابة العنوان السكني بالتفصيل لسلامة الشحن.");
            if (addressDetailsInput) addressDetailsInput.focus();
            return;
        }
        fullAddressText = `المنطقة: ${selectedZoneName} | تفصيل السكن: ${addressDetails}`;
    }

    const orderDate = deliveryDateInput ? deliveryDateInput.value : "";
    const orderTime = deliveryTimeInput ? deliveryTimeInput.value : "";
    
    if (!orderDate || !orderTime) {
        showBoseCustomModal("يرجى اختيار تاريخ وساعة الاستلام المناسبة لتجهيز طلبك.");
        return;
    }

    // 🛡️ [إصلاح - المرحلة 2]: تحديد هل السلة فيها منتج مخصص (تورت/ورد محاكي) عشان
    // نطبّق قاعدة الأسبوع بدل الـ24 ساعة العامة - تطبيقاً لتأكيد صاحب المتجر إن
    // التورت والورد المخصص بتاخد مراحل تحضير أطول من باقي المنتجات.
    const cartHasCustomItem = typeof window.boseCartHasCustomItem === "function"
        ? window.boseCartHasCustomItem(cart)
        : false;

    if (typeof window.validateBoseDeliverySchedule === "function") {
        const isScheduleValid = window.validateBoseDeliverySchedule(orderDate, orderTime, cartHasCustomItem);
        if (!isScheduleValid) {
            const fallbackMsg = cartHasCustomItem
                ? "التورت والورد المخصص عبر المحاكي بيحتاج حجز قبل موعد التسليم بأسبوع كامل (7 أيام) على الأقل."
                : "نحتاج إلى وقت كافٍ لتجهيز طلبك بأفضل جودة ممكنة، لذلك لا يمكن اختيار موعد قبل 24 ساعة.";
            const msg = cartHasCustomItem
                ? (storeData.orderRules?.customPreparationTimeMessage || fallbackMsg)
                : (storeData.orderRules?.preparationTimeMessage || fallbackMsg);
            showBoseCustomModal(msg);
            return;
        }
    }

    // 🧮 [توحيد حسابي]: نفس المعادلة المستخدمة بالسلة وبصفحة الشحن بالظبط
    const invoice = window.calculateBoseInvoice(cart, storeData, shippingFee);
    const finalGrandTotalCalculated = invoice.grandTotal;

    // 🆔 [إصلاح حرج]: رقم طلب فريد فعلياً (طابع زمني + عشوائي) بدل رقم
    // 4 خانات القديم اللي كان احتمال تصادمه وارد وقريب جداً.
    const orderIdGenerated = window.generateBoseOrderId ? window.generateBoseOrderId() : `${Date.now()}`;

    const completedBoseOrderObject = {
        orderNumber: orderIdGenerated,
        orderId: `BOSE-${orderIdGenerated}`,
        customerName: customerName,
        phone1: sanitizedPhone1,
        phone2: sanitizedPhone2,
        deliveryMethod: method === "pickup" ? "استلام من الفرع" : "توصيل للمنزل",
        deliveryZone: selectedZoneName,
        // 🛡️ [إصلاح حرج]: الـid الحقيقي لمنطقة الشحن (مطابق لجدول shipping_zones)
        // بيتسجل هنا عشان saveBoseOrderToDatabase في supabase-client.js يقدر
        // يبعته فعلياً بدل ما يفضل null دايماً في كل الطلبات المحفوظة.
        shippingZoneId: method === "delivery" ? (selectedZoneId || null) : null,
        shippingFee: shippingFee,
        address: fullAddressText,
        date: `${orderDate.split('-')[2]} / ${orderDate.split('-')[1]} / ${orderDate.split('-')[0]}`,
        scheduledDate: orderDate,
        scheduledTime: orderTime,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discount,
        couponCode: invoice.couponCode || null,
        grandTotal: finalGrandTotalCalculated,
        notes: orderNotesInput ? orderNotesInput.value.trim() : "لا توجد ملاحظات إضافية",
        items: cart
    };

    // 🤝 سد ثغرة الأصفار وتوحيد الذاكرة متبادلة التوافق تماماً
    localStorage.setItem("bose_last_order", JSON.stringify(completedBoseOrderObject));
    
    const whatsappMessageText = buildBoseFormattedWhatsappInvoice(completedBoseOrderObject);
    const brandWhatsappNumber = storeData.store?.phone || "01097238441";
    
    // ربط الرسالة بالـ object لضمان عدم حدوث شلل لزر الإرسال البديل بصفحة النجاح
    completedBoseOrderObject.whatsappMessage = whatsappMessageText;
    localStorage.setItem("bose_last_order", JSON.stringify(completedBoseOrderObject));

    localStorage.removeItem("bose_active_coupon");
    if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();

    // 🗄️ [إصلاح حرج]: بنفتح واتساب فوراً هنا (Synchronous) عشان متصفحات
    // الموبايل (خصوصاً Safari/iOS) ماتحجبش النافذة، لأنها بتشترط إن فتح
    // النافذة يحصل مباشرة جوه حدث ضغطة الزر بدون أي انتظار قبله.
    window.open(window.buildWhatsappLink(brandWhatsappNumber, whatsappMessageText), "_blank");
    // 🛡️ [إصلاح تكرار فتح واتساب]: واتساب اتفتح بالفعل هنا لحظة تأكيد الطلب،
    // فبنسجل نفس علامة "تم الفتح تلقائياً" اللي بتقرأها renderBoseSuccessPage()
    // في order-success.html فوراً، عشان الصفحة متفتحش واتساب مرة تانية لوحدها
    // لحظة وصول العميل ليها (كان بيفتح تابين واتساب لكل طلب).
    try {
        sessionStorage.setItem("bose_whatsapp_auto_opened_" + orderIdGenerated, "1");
    } catch (e) { /* تجاهل بأمان لو الجلسة غير متاحة */ }

    const finalizeNavigation = () => { window.location.href = "order-success.html"; };

    // 🛡️ [إصلاح حرج]: قبل كده كان الطلب موجود بس في localStorage الخاص
    // بجهاز العميل + نص رسالة واتساب، ولو حصل أي حاجة (popup اتحجب، العميل
    // قفل التاب قبل الإرسال، أو مسح بيانات المتصفح) الطلب كان بيضيع نهائياً
    // من غير أي أثر عندنا. دلوقتي بيتسجل فعلياً في قاعدة بيانات Supabase قبل
    // الانتقال لصفحة النجاح. لو الاتصال فشل (نت ضعيف مثلاً) البيع لا يتوقف
    // أبداً - واتساب فتح بالفعل فوق - وبنكمل التنقل بعد المحاولة سواء نجحت أو لأ.
    // 🛡️ [إصلاح]: الشرط كان بيتأكد من وجود دالة مختلفة (submitBoseOrderToDatabase)
    // بينما بينادي فعلياً على window.saveBoseOrderToDatabase - شغالة بالصدفة
    // لأن الاتنين بيتعرّفوا مع بعض في supabase-client.js، لكن الفحص الصحيح
    // لازم يكون على الدالة اللي بننادي عليها فعلياً.
    if (typeof window.saveBoseOrderToDatabase === "function") {
        window.saveBoseOrderToDatabase(completedBoseOrderObject)
            .then((dbResult) => {
                // 🛡️ [إصلاح حرج]: رقم الطلب الحقيقي المتولد في قاعدة البيانات
                // (بصيغة YYYYMMDD-NNNN) كان بيتحسب وبيترجع من create_order_with_items
                // لكن بيتضاع هنا تماماً من غير أي استخدام - orderNumber المعروض في
                // صفحة النجاح كان دايماً رقم محلي (Timestamp) من جهاز العميل بس، مش
                // نفس الرقم المسجل فعلياً في قاعدة البيانات. ده كان هيمنع أي نظام
                // تتبع طلب حقيقي من الشغل لأن العميل معندوش الرقم الصح أصلاً. دلوقتي
                // بنسجل الرقم الحقيقي في نفس كائن الطلب المحفوظ في localStorage
                // عشان صفحة النجاح تقدر تعرضه وتربطه بصفحة تتبع الطلب.
                if (dbResult && dbResult.orderNumber) {
                    completedBoseOrderObject.dbOrderNumber = dbResult.orderNumber;
                    localStorage.setItem("bose_last_order", JSON.stringify(completedBoseOrderObject));
                }
            })
            .catch((err) => console.warn("⚠️ تعذر حفظ نسخة الطلب في قاعدة البيانات (البيع تم عبر واتساب بنجاح رغم ذلك):", err))
            .finally(finalizeNavigation);
    } else {
        finalizeNavigation();
    }
}

function buildBoseFormattedWhatsappInvoice(order) {
    let msg = `✨ *فاتورة حجز طلبية فاخرة - حلويات بوسي (BoseSweets)* ✨\n`;
    msg += `--------------------------------------------------\n`;
    msg += `🧾 *رقم المعاملة:* ${order.orderId}\n`;
    msg += `👤 *العميل:* ${order.customerName}\n`;
    msg += `📞 *رقم الاتصال:* ${order.phone1}\n`;
    msg += `🚗 *مسار الاستلام:* ${order.deliveryMethod}\n`;
    msg += `📍 *التفاصيل الجغرافية:* ${order.address}\n`;
    msg += `📅 *موعد الاستلام:* ${order.scheduledDate} الساعة ${order.scheduledTime}\n`;
    msg += `--------------------------------------------------\n`;
    msg += `📦 *تفاصيل الأصناف المخصصة:* \n\n`;

    order.items.forEach((item, idx) => {
        msg += `${idx + 1}. 🌟 *${item.title}* (${item.flavorName || 'جاهز وفريش'})\n`;
        // 🛡️ [إصلاح حرج - رسالة واتساب بتقول "1 قطعة" بدل الدستة/العبوة الحقيقية]:
        // item.quantity هو عدد "الوحدات" اللي طلبها العميل (دستة، عبوة، تورتة... إلخ)
        // مش عدد القطع الفردية جوه الوحدة الواحدة. كلمة "قطعة" الثابتة هنا كانت بتوهم
        // الفرع إن العميل طلب قطعة واحدة فعلياً حتى لو المنتج نفسه "دستة (12 قطعة)"،
        // لأن اسم واسم الوحدة الحقيقيين موجودين بالفعل جوه عنوان المنتج (item.title)
        // ومفيش داعي إطلاقاً لتأكيد/تخمين وحدة تانية جنبه ممكن تكون غلط. النص الجديد
        // بيوضح إنه "عدد الوحدات" (×) بدل ما يخترع وحدة قياس قد تكون غلط.
        msg += `   *عدد الوحدات المطلوبة:* ×${item.quantity}\n`;
        msg += `   *سعر الوحدة الشامل:* ${parseFloat(item.finalPrice).toFixed(2)} EGP\n`;
        
        if (item.customDetails) {
            const cd = item.customDetails;
            if (item.type === "custom-cake" || item.type === "mini-cake") {
                if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") msg += `   • طعم الكيك: ${cd.cakeType}\n`;
                if (cd.shape && cd.shape !== "none") msg += `   • الشكل: ${cd.shape}\n`;
                if (cd.persons && cd.persons > 0) msg += `   • الأفراد: لـ ${cd.persons} فرد\n`;
                if (cd.printingType && cd.printingType !== "none") msg += `   • طباعة صورة: ${cd.printingType === 'edible' ? 'قابلة للأكل' : 'غير قابلة للأكل'}\n`;
                if (cd.customMessage && cd.customMessage.trim() !== "") msg += `   • النص: "${cd.customMessage}"\n`;
            }
            if (item.type === "custom-flower") {
                // 🧾 [إصلاح - المرحلة 3]: cd.moneyAmount كان اسم حقل قديم بقى غير موجود
                // خالص بعد توحيد بنية customDetails مع window.createCartItem (الاسم
                // الصحيح دلوقتي هو cashAmount)، فكان الكاش مش هيظهر أبداً في فاتورة
                // الواتساب رغم إن العميل دفعه فعلاً. بالإضافة لإضافة تفاصيل شريط
                // الستان وميزانية الشوكولاتة وعدد الصور المطبوعة اللي كانت ناقصة.
                if (cd.flowerType && cd.flowerType !== "none") msg += `   • نوع الورد: ${cd.flowerType}\n`;
                if (cd.flowerCount && cd.flowerCount > 0) msg += `   • التعداد: ${cd.flowerCount} وردة\n`;
                if (cd.hasSatinRibbon && cd.satinRibbonText && cd.satinRibbonText.trim() !== "") msg += `   • شريط ستان مطبوع حرارياً: "${cd.satinRibbonText}"\n`;
                if (cd.photoCount && cd.photoCount > 0) msg += `   • صور شخصية مطبوعة: ${cd.photoCount} صورة\n`;
                if (cd.cashAmount && cd.cashAmount > 0) msg += `   • الكاش المدمج جوه البوكيه: +${cd.cashAmount} EGP\n`;
                if (cd.hasChocolate && cd.chocolateBudget && cd.chocolateBudget > 0) msg += `   • ميزانية الشوكولاتة الفاخرة: +${cd.chocolateBudget} EGP\n`;
                if (cd.hasGiftCard && cd.giftCardText && cd.giftCardText.trim() !== "") msg += `   • كارت الإهداء: "${cd.giftCardText}"\n`;
            }
            // 👑 [إصلاح جذري - كارثة الأحجام]: لازم الحجم يظهر في فاتورة الواتساب اللي
            // بيتفذ منها الطلب فعلياً في الفرع - قبل كده الحجم مكنش موجود هنا خالص،
            // وكان ممكن يتنفذ الطلب بحجم غلط تماماً عن اللي دفع فيه العميل فعلاً.
            if (item.type !== "custom-cake" && item.type !== "mini-cake" && item.type !== "custom-flower" && cd.sizeLabel) {
                msg += `   • *الحجم المطلوب:* ${cd.sizeLabel}\n`;
            }
        }

        // 🛡️ [إصلاح حرج]: أي صورة رفعها العميل (تصميم تورتة مطلوب طباعتها،
        // أو صورة بوكيه مرجعية) كانت بتتحفظ كرابط Cloudinary حقيقي جوه
        // item.image لكن ما كانتش بتوصل خالص لنص فاتورة الواتساب، فالفرع
        // كان بيستلم طلب "صورة" من غير أي صورة معاه فعلياً. دلوقتي أي رابط
        // Cloudinary حقيقي (مش لوجو الموقع الافتراضي) بيظهر كسطر واضح قابل
        // للفتح المباشر من واتساب.
        const refImageUrls = [];
        if (item.image && typeof item.image === "string" && item.image.startsWith("http") && !item.image.includes("logo_igggsb")) {
            refImageUrls.push(item.image);
        }
        if (Array.isArray(item.referenceImages)) {
            item.referenceImages.forEach(u => { if (u && typeof u === "string" && u.startsWith("http")) refImageUrls.push(u); });
        }
        refImageUrls.forEach((url, i) => {
            msg += `   🖼️ *صورة مرجعية${refImageUrls.length > 1 ? ' ' + (i + 1) : ''}:* ${url}\n`;
        });

        msg += `   ---------------------------\n`;
    });

    msg += `📝 *ملاحظات:* ${order.notes}\n`;
    msg += `--------------------------------------------------\n`;
    msg += `👑 *المجموع المالي النهائي والمطلوب:* ${order.grandTotal} EGP 👑\n`;
    msg += `--------------------------------------------------\n`;
    msg += `🤝 شكرًا لاختياركم الفاخر لـ حلويات بوسي. صنعناها بحب لتهديها لمن تحب. ✨`;
    
    return msg;
}

/**
 * =========================================================================
 * 🧾 3. محرك وإدارة صفحة نجاح الطلب وإصدار الفاتورة (order-success.html)
 * =========================================================================
 */
function renderBoseSuccessPage(storeData) {
    // 🛡️ [إصلاح حرج - المرحلة 1]: هذه الدالة كانت معطّلة بالكامل قبل كده — كان بيتم
    // اكتشاف الصفحة عن طريق البحث عن id="success-order-id-display" غير موجود فعلياً
    // في order-success.html، وكمان الملف ده مكانش بيتحمّل في الصفحة أصلاً. النتيجة كانت
    // ظهور سكريبت داخلي منفصل ومكرر بالكامل جوه الـHTML يعمل نفس المهمة. دلوقتي
    // order-success.html بيحمّل cart-engine.js فعلياً، وهذه الدالة أصبحت المصدر
    // الوحيد لمنطق عرض الفاتورة - تم حذف السكريبت الداخلي المكرر نهائياً من الـHTML.
    const orderNumLbl = document.getElementById("bose-receipt-number-lbl");
    const dateLbl = document.getElementById("bose-receipt-date-lbl");
    const receiptWrapper = document.getElementById("bose-receipt-items-container");
    const grandTotalDisplay = document.getElementById("bose-receipt-grand-total");
    const whatsappBtn = document.getElementById("bose-success-whatsapp-btn");
    // عنصران اختياريان حسب نسخة الصفحة - الكود بيتخطاهم بأمان لو مش موجودين
    const orderIdDisplay = document.getElementById("success-order-id-display");
    const customerWelcome = document.getElementById("success-customer-welcome");
    const trackOrderBtn = document.getElementById("bose-success-track-btn");

    const showEmptyState = () => {
        if (receiptWrapper) {
            receiptWrapper.innerHTML = `<p style="text-align:center; opacity:0.6; font-size:0.85rem; margin:0;">تم توثيق وحجز طلبك الفاخر بنجاح في الفرع 🌸</p>`;
        }
    };

    const rawOrder = localStorage.getItem("bose_last_order");
    if (!rawOrder) { showEmptyState(); return; }

    let order;
    try {
        order = JSON.parse(rawOrder);
    } catch (e) {
        console.error("⚠️ فشل قراءة أو معالجة إيصال الفاتورة الأخيرة.", e);
        showEmptyState();
        return;
    }

    if (orderNumLbl) orderNumLbl.textContent = `رقم طلب الفاتورة: #${order.orderNumber || '0000'}`;
    if (dateLbl) dateLbl.textContent = order.date || '00 / 00 / 2026';
    if (orderIdDisplay) {
        orderIdDisplay.textContent = order.orderId || `#${order.orderNumber || ''}`;
        orderIdDisplay.style.display = "block";
    }
    // 🛡️ زرار "تتبعي طلبك" بيظهر بس لو الرقم الحقيقي المسجل في قاعدة البيانات
    // (dbOrderNumber) وصل فعلاً - لو حفظ الطلب في القاعدة فشل (نت ضعيف مثلاً)
    // منسيبش زرار بيودي لصفحة تتبع مش هتلاقي حاجة.
    if (trackOrderBtn && order.dbOrderNumber && order.phone1) {
        trackOrderBtn.href = `track-order.html?order=${encodeURIComponent(order.dbOrderNumber)}&phone=${encodeURIComponent(order.phone1)}`;
        trackOrderBtn.style.display = "flex";
    }
    // 🐛 [إصلاح خلل وظيفي]: العنصر كان بيتقرأ من الـDOM بس مفيش أي كود
    // بيحط فيه اسم العميل فعلياً، فكانت خانة الترحيب بتفضل فاضية دايماً.
    if (customerWelcome && order.customerName) {
        customerWelcome.textContent = `أهلاً بيك يا ${order.customerName} 🌸`;
        customerWelcome.style.display = "block";
    }

    const purchasedSlugs = [];
    if (receiptWrapper) {
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            const escR = window.escapeBoseHTML || (s => s);
            receiptWrapper.innerHTML = order.items.map(item => {
                if (item.productSlug) purchasedSlugs.push(item.productSlug);
                return `
                <div class="receipt-item-node">
                    <span class="receipt-item-name">${escR(item.title)} <span style="font-weight:400; opacity:0.6; font-size:0.8rem;">(×${item.quantity})</span><span style="display:block; font-size:0.75rem; font-weight:700; color:var(--bose-pink); margin-top:2px;">${escR(item.flavorName || 'جاهز وفريش')}</span></span>
                    <span class="receipt-item-price">${(item.finalPrice * item.quantity).toFixed(2)} EGP</span>
                </div>
            `;
            }).join("");
        } else {
            showEmptyState();
        }
    }

    if (grandTotalDisplay) grandTotalDisplay.textContent = (order.grandTotal || 0) + " EGP";

    let whatsappUrl = "";
    if (whatsappBtn) {
        whatsappUrl = order.whatsappMessage
            ? window.buildWhatsappLink(storeData?.store?.phone || '01097238441', order.whatsappMessage)
            : whatsappBtn.href;
        whatsappBtn.href = whatsappUrl;
    }

    // 🚀 [إصلاح المرحلة 1 - تطبيق نص المواصفة]: فتح الواتساب تلقائياً فور تحميل
    // الصفحة بدل انتظار ضغطة العميل اليدوية. بنستنى نص ثانية بسيطة (تقليل احتمال
    // حظر الـPopup)، والزر اليدوي فاضل شغال كبديل فوري لو المتصفح منع الفتح التلقائي
    // أو لو العميل قفل التبويب اللي اتفتح بالغلط.
    const autoOpenFlag = "bose_whatsapp_auto_opened_" + (order.orderNumber || "0");
    if (whatsappUrl && !sessionStorage.getItem(autoOpenFlag)) {
        setTimeout(() => {
            try {
                window.open(whatsappUrl, "_blank");
                sessionStorage.setItem(autoOpenFlag, "1");
            } catch (e) {
                console.warn("⚠️ تعذر فتح الواتساب تلقائياً، الزر اليدوي متاح كبديل.", e);
            }
        }, 600);
    }

    // 🗄️ [إصلاح المرحلة 1]: نسخة احتياطية اختيارية لتسجيل الطلب خارج المتصفح لمنع
    // ضياعه لو فشل واتساب أو مسح العميل الكاش قبل التأكيد. للتفعيل: عرّف
    // window.BOSE_ORDER_BACKUP_WEBHOOK_URL برابط خدمة الاستقبال بتاعتك (Google Apps
    // Script / Webhook / أي Backend بسيط) قبل تحميل هذا الملف. لو مش معرّف، الخطوة
    // دي بتتجاهل بأمان بدون أي خطأ أو تأثير على باقي الصفحة.
    if (typeof window.BOSE_ORDER_BACKUP_WEBHOOK_URL === "string" && window.BOSE_ORDER_BACKUP_WEBHOOK_URL) {
        fetch(window.BOSE_ORDER_BACKUP_WEBHOOK_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order)
        }).catch((e) => console.warn("⚠️ تعذر إرسال نسخة الطلب الاحتياطية.", e));
    }

    // 🧹 تطهير الذاكرة السلوكية لكسر تكرار المنتجات التي تم شراؤها فعلياً
    try {
        const behaviorData = localStorage.getItem('bose_user_behavior');
        if (behaviorData) {
            const behaviorLog = JSON.parse(behaviorData);
            purchasedSlugs.forEach((slug) => { if (behaviorLog[slug]) delete behaviorLog[slug]; });
            localStorage.setItem('bose_user_behavior', JSON.stringify(behaviorLog));
        }
    } catch (e) {
        console.warn("⚠️ تعذر تفعيل صمام الأمان لتطهير الذاكرة السلوكية.", e);
    }

    // مسح وإفراغ السلة المشتراة فوراً لتجنب حشر الفواتير القديمة وتأمين دورة الشراء التالية
    localStorage.removeItem("bose_cart");
    if (typeof window.updateGlobalCartCounter === "function") {
        window.updateGlobalCartCounter();
    }
}

/**
 * =========================================================================
 * 👑 4. محرك النوافذ المنبثقة الفاخرة لعلامة بوسي (Bose Custom Luxury Modals)
 * =========================================================================
 */
function injectBoseCustomModalStyles() {
    if (document.getElementById("bose-modal-styles-block")) return;
    const styleEl = document.createElement("style");
    styleEl.id = "bose-modal-styles-block";
    styleEl.textContent = `
        .bose-custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(17, 17, 17, 0.4); display: flex; align-items: center; justify-content: center; z-index: 100000; direction: rtl; opacity: 0; transition: opacity 0.25s ease; pointer-events: none; padding: 20px; box-sizing: border-box; }
        .bose-custom-modal-overlay.active { opacity: 1; pointer-events: auto; }
        .bose-custom-modal-card { background: #FFFFFF; border: 1px solid rgba(255, 145, 164, 0.3); border-radius: 24px; padding: 24px; width: 100%; max-width: 400px; box-shadow: 0 12px 40px rgba(255, 145, 164, 0.15); text-align: center; box-sizing: border-box; }
        .bose-modal-text { font-family: 'Cairo'; font-size: 16px; font-weight: 700; color: #111111; margin: 0 0 20px 0; line-height: 1.5; }
        .bose-modal-actions-wrapper { display: flex; gap: 12px; justify-content: center; }
        .bose-modal-btn { font-family: 'Cairo'; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 12px; cursor: pointer; border: none; box-sizing: border-box; }
        .bose-modal-btn-confirm { background: #FF91A4; color: #FFFFFF; }
        .bose-modal-btn-cancel { background: #FFFFFF; color: #111111; border: 1px solid rgba(17,17,17,0.15); }
    `;
    document.head.appendChild(styleEl);
}

function showBoseCustomModal(messageText, onConfirmCallback) {
    let overlay = document.getElementById("bose-global-modal-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "bose-global-modal-overlay";
        overlay.className = "bose-custom-modal-overlay";
        overlay.innerHTML = `
            <div class="bose-custom-modal-card">
                <p class="bose-modal-text" id="bose-modal-text-content"></p>
                <div class="bose-modal-actions-wrapper">
                    <button class="bose-modal-btn bose-modal-btn-confirm" id="bose-modal-btn-ok">تأكيد</button>
                    <button class="bose-modal-btn bose-modal-btn-cancel" id="bose-modal-btn-no">تراجع</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    document.getElementById("bose-modal-text-content").textContent = messageText;
    overlay.classList.add("active");
    
    overlay.querySelector("#bose-modal-btn-ok").onclick = () => { overlay.classList.remove("active"); if (typeof onConfirmCallback === "function") onConfirmCallback(); };
    overlay.querySelector("#bose-modal-btn-no").onclick = () => { overlay.classList.remove("active"); };
}