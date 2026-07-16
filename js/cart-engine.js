/**
 * 👑 محرك السلة وإتمام الطلب والتوثيق المالي النهائي الفاخر والمطور - حلويات بوسي 👑
 * النسخة الهندسية القياسية الشاملة والمطورة كلياً - خالية تماماً من ثغرات البتر وتداخل النصوص V7.0
 * الأداء: تم تحديثه ليعتمد على التحديث الموضعي (Localized DOM Mutations) لتوفير المعالج والبيانات بنسبة 100%
 * التوافق: معزول كلياً ويلتزم بمهامه دون التداخل مع أي ملف آخر أو تكرار وظائفه اللوجستية
 * [تم إصلاح ثغرة جلب البيانات وجدولة الفواتير جذرياً وحظر اختفاء المنتجات المضافة عند التوجيه]
 */

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
        const rawCart = localStorage.getItem("bose_cart");
        const cart = rawCart ? JSON.parse(rawCart) : [];
        
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
            
            // حصر التحقق من كتل التخصيص بناءً على نوع المنتج المعتمد رسمياً لمنع ظهورها عشوائياً في المنتجات العادية
            const isCakeBespoke = item.type === "custom-cake" || item.type === "mini-cake" || item.productSlug === "toort-custom-master" || item.productSlug === "mini-cake-two-person";
            const isFlowerBespoke = item.type === "custom-flower" || item.productSlug === "flowers-master";
            
            if (item.customDetails) {
                let specs = [];
                const cd = item.customDetails;
                
                if (isCakeBespoke) {
                    if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") specs.push(`<span><strong>طعم الكيك:</strong> ${cd.cakeType}</span>`);
                    if (cd.shape && cd.shape !== "none") specs.push(`<span><strong>الشكل:</strong> ${cd.shape === 'circle' ? 'دائري' : cd.shape === 'heart' ? 'قلب' : cd.shape === 'square' ? 'مربع' : cd.shape === 'rectangle' ? 'مستطيل' : cd.shape}</span>`);
                    if (cd.persons && parseInt(cd.persons, 10) > 0) specs.push(`<span><strong>عدد الأفراد:</strong> ${cd.persons} فرد</span>`);
                    if (cd.printingType && cd.printingType !== "none") specs.push(`<span><strong>الطباعة:</strong> ${cd.printingType === 'edible' ? 'صورة صالحة للأكل' : 'صورة مجسمة غير صالحة للأكل'}</span>`);
                    if (cd.customMessage && cd.customMessage.trim() !== "") specs.push(`<span><strong>الرسالة المكتوبة:</strong> "${cd.customMessage}"</span>`);
                    if (cd.allergyNote && cd.allergyNote.trim() !== "") specs.push(`<span style="color:#D4AF37;"><strong>ملاحظة الحساسية:</strong> ${cd.allergyNote}</span>`);
                }
                
                if (isFlowerBespoke) {
                    if (cd.flowerType && cd.flowerType !== "none") specs.push(`<span><strong>نوع الورد:</strong> ${cd.flowerType === 'natural' ? 'طبيعي نضر' : cd.flowerType === 'artificial' ? 'صناعي فاخر' : 'ستان مصنوع بحب'}</span>`);
                    if (cd.flowerCount && parseInt(cd.flowerCount, 10) > 0) specs.push(`<span><strong>عدد الورد:</strong> ${cd.flowerCount} وردة</span>`);
                    if (cd.moneyAmount && parseInt(cd.moneyAmount, 10) > 0) specs.push(`<span><strong>الكاش المدمج:</strong> +${cd.moneyAmount} جنيه</span>`);
                    if (cd.chocolatePieces && parseInt(cd.chocolatePieces, 10) > 0) specs.push(`<span><strong>قطع الشوكولاتة:</strong> ${cd.chocolatePieces} قطعة</span>`);
                    if (cd.wrappingType && cd.wrappingType !== "none") specs.push(`<span><strong>التغليف:</strong> ${cd.wrappingType}</span>`);
                    if (cd.giftCardText && cd.giftCardText.trim() !== "") specs.push(`<span><strong>كارت الإهداء:</strong> "${cd.giftCardText}"</span>`);
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
            
            cartCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 20px; flex: 1; min-width: 0;">
                    <img src="${item.image || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png'}" class="cart-item-image" alt="${item.title}" style="width: 120px; height: 120px; border-radius: 20px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255,145,164,0.3);" loading="lazy">
                    <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; text-align: right;">
                        <h3 class="cart-item-title" style="margin: 0; font-size: 16px; font-weight: 700; color: #111111; font-family: 'Cairo'; line-height: 1.4;">${item.title}</h3>
                        <span class="cart-item-flavor-name" style="font-size: 13.5px; color: #FF91A4; font-weight: 700; font-family: 'Cairo';">${cleanFlavorName}</span>
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
    
    // التحديث الموضعي الذكي لمنع الـ Reflow الكامل وحماية معالجات الأجهزة الذكية
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
    
    // ربط الأحداث تفويضياً لمرة واحدة على الحاوية كلياً لحماية الذاكرة العشوائية وتفعيل الإشعارات الحية
    cartWrapper.onclick = (e) => {
        const target = e.target.closest("button");
        if (!target) return;
        
        const cardElement = target.closest(".bose-cart-item-card");
        if (!cardElement) return;
        
        const index = parseInt(cardElement.getAttribute("data-index"), 10);
        const cart = JSON.parse(localStorage.getItem("bose_cart") || "[]");
        
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
            showBoseCustomModal("هل ترغب في إفراغ كافة محتويات سلة المشتريات؟", () => {
                localStorage.removeItem("bose_cart");
                if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
                if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("تم تفريغ السلة كلياً.");
                buildFullCartUI();
            });
        };
    }

    buildFullCartUI();
}

function triggerCartItemRemoval(cart, index, storeData, callback) {
    showBoseCustomModal(`هل ترغب في إزالة صنف "${cart[index].title}" من السلة؟`, () => {
        cart.splice(index, 1);
        localStorage.setItem("bose_cart", JSON.stringify(cart));
        if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
        if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("تم إزالة الصنف بنجاح.");
        callback();
    });
}

function updateCartSummary(cart, storeData) {
    const subtotalDisplay = document.getElementById("cart-subtotal-value") || document.getElementById("summary-subtotal");
    const grandTotalDisplay = document.getElementById("cart-grand-total-value") || document.getElementById("summary-grand-total");
    const itemsCountDisplay = document.getElementById("summary-items-count");
    
    let subtotal = 0;
    let displayItems = 0;
    
    cart.forEach(item => {
        subtotal += parseFloat(item.finalPrice || 0) * (parseInt(item.quantity, 10) || 1);
        displayItems += (parseInt(item.quantity, 10) || 1);
    });
    
    if (subtotalDisplay) subtotalDisplay.textContent = subtotal.toFixed(2) + " EGP";
    if (itemsCountDisplay) itemsCountDisplay.textContent = displayItems;
    
    let discount = 0;
    const activeCoupon = localStorage.getItem("bose_active_coupon");
    if (activeCoupon && storeData.coupons) {
        const couponRule = storeData.coupons.find(c => c.code === activeCoupon);
        if (couponRule) {
            discount = subtotal * (couponRule.value / 100);
        }
    }
    
    const discountDisplay = document.getElementById("summary-discount");
    if (discountDisplay) discountDisplay.textContent = discount.toFixed(2) + " EGP";
    
    let finalGrandTotal = subtotal - discount;
    if (finalGrandTotal < 0) finalGrandTotal = 0;
    
    if (grandTotalDisplay) {
        grandTotalDisplay.textContent = Math.round(finalGrandTotal) + " EGP";
    }
    
    const promoInput = document.getElementById("coupon-input");
    const promoBtn = document.getElementById("btn-apply-coupon");
    const couponMsg = document.getElementById("coupon-message");
    
    if (promoBtn && promoInput && couponMsg) {
        if (!promoBtn.dataset.listenerAttached) {
            promoBtn.onclick = () => {
                const code = promoInput.value.trim().toUpperCase();
                if (!code) return;
                
                if (storeData.coupons) {
                    const found = storeData.coupons.find(c => c.code === code);
                    if (found) {
                        localStorage.setItem("bose_active_coupon", code);
                        couponMsg.className = "coupon-status-toast success";
                        couponMsg.textContent = `✅ تم تطبيق خصم الكوبون بنجاح بقيمة ${found.value}%`;
                        if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast(`تم تطبيق خصم الكوبون بقيمة ${found.value}%`);
                        updateCartSummary(cart, storeData);
                    } else {
                        couponMsg.className = "coupon-status-toast error";
                        couponMsg.textContent = "⚠️ كود الخصم المدخل غير صحيح أو منتهي الصلاحية.";
                    }
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
    const cart = JSON.parse(localStorage.getItem("bose_cart") || "[]");
    
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
    
    branchDiv.innerHTML = `
        <h4 style="margin: 0 0 6px 0; font-size: 15px; color: #111111; font-weight: 700; font-family: 'Cairo';"><i class="fas fa-building" style="color: #FF91A4; margin-left: 6px;"></i> مقر الاستلام الرسمي للبراند:</h4>
        <p style="margin: 0 0 12px 0; font-size: 13.5px; color: #111111; opacity: 0.8; line-height: 1.6; font-family: 'Cairo';">${addressText}</p>
        <a href="${mapLink}" target="_blank" class="success-action-secondary-btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; background: #FFFFFF; border: 1px solid #FF91A4; color: #111111; font-family: 'Cairo';">
            <i class="fas fa-map-marked-alt" style="color: #FF91A4;"></i> عرض الموقع على خرائط جوجل
        </a>
    `;
    
    insertionPoint.parentNode.insertBefore(branchDiv, insertionPoint);
}

function recalculateCheckoutInvoice(cart, storeData, shippingFee) {
    const subtotalDisplay = document.getElementById("summary-subtotal");
    const shippingDisplay = document.getElementById("summary-shipping-fee");
    const grandTotalDisplay = document.getElementById("summary-grand-total");
    
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += parseFloat(item.finalPrice || 0) * (parseInt(item.quantity, 10) || 1);
    });
    
    if (subtotalDisplay) subtotalDisplay.textContent = subtotal.toFixed(2) + " EGP";
    if (shippingDisplay) {
        shippingDisplay.textContent = shippingFee === 0 ? "مجاناً" : shippingFee.toFixed(2) + " EGP";
    }
    
    let discount = 0;
    const activeCoupon = localStorage.getItem("bose_active_coupon");
    if (activeCoupon && storeData.coupons) {
        const couponRule = storeData.coupons.find(c => c.code === activeCoupon);
        if (couponRule) discount = subtotal * (couponRule.value / 100);
    }
    
    let absoluteTotal = subtotal - discount + shippingFee;
    if (absoluteTotal < 0) absoluteTotal = 0;
    
    if (grandTotalDisplay) {
        grandTotalDisplay.textContent = Math.round(absoluteTotal) + " EGP";
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
        alert("يرجى كتابة اسم صاحب الطلب بالكامل.");
        if (customerNameInput) customerNameInput.focus();
        return;
    }

    const phone1 = customerPhoneInput ? customerPhoneInput.value.trim() : "";
    if (typeof window.validateBosePhoneNumber === "function") {
        if (!window.validateBosePhoneNumber(phone1)) {
            alert("يرجى إدخال رقم هاتف محمول مصري صحيح ومطابق للشبكة.");
            if (customerPhoneInput) customerPhoneInput.focus();
            return;
        }
    }
    const sanitizedPhone1 = typeof window.sanitizeBosePhoneNumber === "function" ? window.sanitizeBosePhoneNumber(phone1) : phone1;

    let sanitizedPhone2 = "";
    if (customerPhone2Input && customerPhone2Input.value.trim() !== "") {
        const phone2 = customerPhone2Input.value.trim();
        if (typeof window.validateBosePhoneNumber === "function" && !window.validateBosePhoneNumber(phone2)) {
            alert("رقم الهاتف البديل غير صحيح، يرجى مراجعته أو مسحه ليبقى اختيارياً.");
            customerPhone2Input.focus();
            return;
        }
        sanitizedPhone2 = typeof window.sanitizeBosePhoneNumber === "function" ? window.sanitizeBosePhoneNumber(phone2) : phone2;
    }

    let fullAddressText = "استلام يدوي مباشر من مقر الفرع";
    let selectedZoneName = "فرع الكفاح الرئيسي";
    
    if (method === "delivery") {
        if (zoneSelect && !zoneSelect.value) {
            alert("يرجى تحديد المنطقة السكنية.");
            zoneSelect.focus();
            return;
        }
        selectedZoneName = zoneSelect ? zoneSelect.value : "";
        
        const addressDetails = addressDetailsInput ? addressDetailsInput.value.trim() : "";
        if (addressDetails.length < 8) {
            alert("يرجى كتابة العنوان السكني بالتفصيل لسلامة الشحن.");
            if (addressDetailsInput) addressDetailsInput.focus();
            return;
        }
        fullAddressText = `المنطقة: ${selectedZoneName} | تفصيل السكن: ${addressDetails}`;
    }

    const orderDate = deliveryDateInput ? deliveryDateInput.value : "";
    const orderTime = deliveryTimeInput ? deliveryTimeInput.value : "";
    
    if (!orderDate || !orderTime) {
        alert("يرجى اختيار تاريخ وساعة الاستلام المناسبة لتجهيز طلبك.");
        return;
    }

    if (typeof window.validateBoseDeliverySchedule === "function") {
        const isScheduleValid = window.validateBoseDeliverySchedule(orderDate, orderTime);
        if (!isScheduleValid) {
            alert(storeData.orderRules?.preparationTimeMessage || "نحتاج إلى وقت كافٍ لتجهيز طلبك بأفضل جودة ممكنة، لذلك لا يمكن اختيار موعد قبل 24 ساعة.");
            return;
        }
    }

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += parseFloat(item.finalPrice || 0) * (parseInt(item.quantity, 10) || 1);
    });
    
    let discount = 0;
    const activeCoupon = localStorage.getItem("bose_active_coupon");
    if (activeCoupon && storeData.coupons) {
        const couponRule = storeData.coupons.find(c => c.code === activeCoupon);
        if (couponRule) discount = subtotal * (couponRule.value / 100);
    }
    
    const finalGrandTotalCalculated = Math.round(subtotal - discount + shippingFee);
    const orderIdGenerated = `BOSE-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const completedBoseOrderObject = {
        orderId: orderIdGenerated,
        customerName: customerName,
        phone1: sanitizedPhone1,
        phone2: sanitizedPhone2,
        deliveryMethod: method === "pickup" ? "استلام من الفرع" : "توصيل للمنزل",
        deliveryZone: selectedZoneName,
        shippingFee: shippingFee,
        address: fullAddressText,
        scheduledDate: orderDate,
        scheduledTime: orderTime,
        grandTotal: finalGrandTotalCalculated,
        notes: orderNotesInput ? orderNotesInput.value.trim() : "لا توجد ملاحظات إضافية",
        items: cart
    };

    // 🤝 مزامنة القنوات والمفاتيح الموحدة لمنع ثغرات الفواتير والصفحات الفارغة
    localStorage.setItem("bose_last_order", JSON.stringify(completedBoseOrderObject));
    
    const whatsappMessageText = buildBoseFormattedWhatsappInvoice(completedBoseOrderObject);
    const brandWhatsappNumber = storeData.store?.phone || "01097238441";
    
    localStorage.removeItem("bose_cart");
    localStorage.removeItem("bose_active_coupon");
    if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();

    window.open(`https://wa.me/20${brandWhatsappNumber}?text=${encodeURIComponent(whatsappMessageText)}`, "_blank");
    window.location.href = "order-success.html";
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
        msg += `   *الكمية:* ${item.quantity} قطعة\n`;
        msg += `   *سعر الوحدة الشامل:* ${parseFloat(item.finalPrice).toFixed(2)} EGP\n`;
        
        if (item.customDetails) {
            const cd = item.customDetails;
            if (item.type === "custom-cake" || item.type === "mini-cake") {
                if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") msg += `   • طعم الكيك: ${cd.cakeType}\n`;
                if (cd.shape && cd.shape !== "none") msg += `   • الشكل: ${cd.shape}\n`;
                if (cd.persons && cd.persons > 0) msg += `   • الأفراد: لـ ${cd.persons} فرد\n`;
                if (cd.customMessage && cd.customMessage.trim() !== "") msg += `   • النص: "${cd.customMessage}"\n`;
            }
            if (item.type === "custom-flower") {
                if (cd.flowerType && cd.flowerType !== "none") msg += `   • نوع الورد: ${cd.flowerType}\n`;
                if (cd.flowerCount && cd.flowerCount > 0) msg += `   • التعداد: ${cd.flowerCount} وردة\n`;
                if (cd.moneyAmount && cd.moneyAmount > 0) msg += `   • الكاش المدمج: +${cd.moneyAmount} EGP\n`;
                if (cd.giftCardText && cd.giftCardText.trim() !== "") msg += `   • كارت الإهداء: "${cd.giftCardText}"\n`;
            }
        }
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
    const rawOrder = localStorage.getItem("bose_last_order");
    if (!rawOrder) {
        window.location.href = "index.html";
        return;
    }
    const order = JSON.parse(rawOrder);

    const orderIdDisplay = document.getElementById("success-order-id-display");
    const customerWelcome = document.getElementById("success-customer-welcome");
    const receiptWrapper = document.getElementById("bose-receipt-items-container");
    
    if (orderIdDisplay) orderIdDisplay.textContent = order.orderId;
    if (customerWelcome) customerWelcome.textContent = `مرحباً بك عميلنا المحترم: ${order.customerName}`;
    
    if (receiptWrapper && order.items) {
        receiptWrapper.innerHTML = order.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; font-family: 'Cairo';">
                <span><strong>${item.title}</strong> (×${item.quantity})</span>
                <span style="color:#FF91A4; font-weight:700;">${(item.finalPrice * item.quantity).toFixed(2)} EGP</span>
            </div>
        `).join("");
    }

    const grandTotalDisplay = document.getElementById("bose-receipt-grand-total");
    if (grandTotalDisplay) grandTotalDisplay.textContent = order.grandTotal + " EGP";
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