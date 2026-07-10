/**
 * 👑 محرك السلة وإتمام الطلب والتوثيق المالي النهائي المصحح كلياً - حلويات بوسي 👑
 * النسخة الهندسية القياسية الشاملة بنسبة 100% - خالية تماماً من ثغرات البتر وتداخل النصوص V4.1
 * متوافق بشكل مطلق وثنائي الاتجاه مع: core-engine.js، وقاعدة البيانات site-data-final.json ومعايير الأداء والموبايل أولاً
 */

document.addEventListener("DOMContentLoaded", () => {
    // ربط المحرك المركزي والانتظار حتى تهيئة قاعدة البيانات الأساسية لـ JSON
    if (typeof window.onBoseDatabaseReady === "function") {
        window.onBoseDatabaseReady((storeData) => {
            initializeCartEngine(storeData);
        });
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
    
    function refreshCartUI() {
        const rawCart = localStorage.getItem("bose_cart");
        const cart = rawCart ? JSON.parse(rawCart) : [];
        
        if (clearCartBtn) {
            clearCartBtn.style.display = cart.length > 0 ? "block" : "none";
        }
        
        if (cart.length === 0) {
            cartWrapper.innerHTML = `
                <div class="empty-cart-message-block" style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-shopping-bag" style="font-size: 48px; color: #FF91A4; margin-bottom: 20px; display: block; opacity: 0.5;"></i>
                    <p style="font-size: 18px; font-weight: 600; color: #111111; font-family: 'Cairo';">سلة المشتريات فارغة حالياً</p>
                    <a href="menu.html" class="bose-btn-primary" style="display: inline-block; margin-top: 15px; background: #FF91A4; color: #FFF; padding: 10px 25px; border-radius: 8px; text-decoration: none; font-weight: 600; font-family: 'Cairo';">تصفح المنيو الشامل</a>
                </div>
            `;
            updateCartSummary(cart, storeData);
            return;
        }
        
        cartWrapper.innerHTML = ""; 
        
        cart.forEach((item, index) => {
            const finalProductPrice = parseFloat(item.finalPrice || 0);
            const totalItemCost = finalProductPrice * (parseInt(item.quantity, 10) || 1);
            
            let customDetailsHTML = "";
            const isBespokeItem = item.type === "custom-cake" || item.type === "custom-flower" || item.type === "mini-cake";
            
            if (item.customDetails && isBespokeItem) {
                let specs = [];
                const cd = item.customDetails;
                
                if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") specs.push(`<strong>نوع الكيك:</strong> ${cd.cakeType}`);
                if (cd.shape && cd.shape !== "none") specs.push(`<strong>الشكل:</strong> ${cd.shape === 'circle' ? 'دائري' : cd.shape === 'heart' ? 'قلب' : cd.shape === 'square' ? 'مربع' : 'مستطيل'}`);
                if (cd.persons && parseInt(cd.persons, 10) > 0) specs.push(`<strong>عدد الأفراد:</strong> ${cd.persons} فرد`);
                if (cd.printingType && cd.printingType !== "none") specs.push(`<strong>الطباعة:</strong> ${cd.printingType === 'edible' ? 'صورة صالحة للأكل' : 'صورة مجسمة غير صالحة للأكل'}`);
                if (cd.customMessage && cd.customMessage.trim() !== "") specs.push(`<strong>الرسالة:</strong> "${cd.customMessage}"`);
                if (cd.allergyNote && cd.allergyNote.trim() !== "") specs.push(`<span style="color:#D4AF37;"><strong>ملاحظة الحساسية:</strong> ${cd.allergyNote}</span>`);
                if (cd.flowerType && cd.flowerType !== "none") specs.push(`<strong>نوع الورد:</strong> ${cd.flowerType === 'natural' ? 'طبيعي نضر' : cd.flowerType === 'artificial' ? 'صناعي فاخر' : 'ستان مصنوع بحب'}`);
                if (cd.flowerCount && parseInt(cd.flowerCount, 10) > 0) specs.push(`<strong>عدد الورد:</strong> ${cd.flowerCount} وردة`);
                if (cd.moneyAmount && parseInt(cd.moneyAmount, 10) > 0) specs.push(`<strong>الكاش المدمج:</strong> +${cd.moneyAmount} جنيه`);
                if (cd.chocolatePieces && parseInt(cd.chocolatePieces, 10) > 0) specs.push(`<strong>قطع الشوكولاتة:</strong> ${cd.chocolatePieces} قطعة`);
                if (cd.wrappingType && cd.wrappingType !== "none") specs.push(`<strong>التغليف:</strong> ${cd.wrappingType}`);
                if (cd.giftCardText && cd.giftCardText.trim() !== "") specs.push(`<strong>كارت الإهداء:</strong> "${cd.giftCardText}"`);
                
                if (specs.length > 0) {
                    customDetailsHTML = `<div class="cart-item-customizations-panel" style="font-size: 13px; color: #555; background: rgba(255,145,164,0.04); padding: 10px; border-radius: 12px; margin: 6px 0; border-right: 3px solid #FF91A4; display: flex; flex-direction: column; gap: 4px; width: 100%; box-sizing: border-box; font-family: 'Cairo';">${specs.join("")}</div>`;
                }
            }

            const cartCard = document.createElement("div");
            cartCard.className = "bose-horizontal-cart-card";
            cartCard.setAttribute("data-item-id", item.id);
            cartCard.style.cssText = "display: flex; flex-direction: row; align-items: center; justify-content: space-between; border: 1px solid rgba(255, 145, 164, 0.2); background: #FFFFFF; padding: 16px; border-radius: 20px; margin-bottom: 16px; box-shadow: 0 8px 32px rgba(255, 145, 164, 0.05); position: relative; direction: rtl; width: 100%; box-sizing: border-box; gap: 12px; min-width: 0;";
            
            cartCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
                    <img src="${item.image || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png'}" class="cart-item-image" alt="${item.title}" style="width: 85px; height: 85px; border-radius: 14px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255,145,164,0.1);">
                    <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; text-align: right;">
                        <h3 class="cart-item-title" style="margin: 0; font-size: 15px; font-weight: 700; color: #111111; font-family: 'Cairo'; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h3>
                        <span class="cart-item-flavor-name" style="font-size: 13px; color: #FF91A4; font-weight: 700; font-family: 'Cairo';">${item.flavorName}</span>
                        ${customDetailsHTML}
                        
                        <div class="bose-qty-controller-box" style="display: flex; align-items: center; border: 1px solid rgba(255, 145, 164, 0.2); border-radius: 10px; width: max-content; margin-top: 6px; background: #FFFFFF; height: 34px; padding: 2px;">
                            <button class="btn-qty-plus" data-index="${index}" style="border: none; background: transparent; width: 32px; height: 100%; font-weight: 700; font-size: 15px; color: #111111; cursor: pointer;">+</button>
                            <input type="text" readonly class="qty-numerical-display" value="${item.quantity}" style="width: 32px; text-align: center; border: none; font-size: 14px; font-weight: 700; color: #111111; background: transparent; font-family: 'Cairo';">
                            <button class="btn-qty-minus" data-index="${index}" style="border: none; background: transparent; width: 32px; height: 100%; font-weight: 700; font-size: 15px; color: #111111; cursor: pointer;">-</button>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; min-height: 85px; flex-shrink: 0; text-align: left;">
                    <button class="btn-remove-item" data-index="${index}" aria-label="حذف الصنف" style="background: transparent; border: none; color: rgba(17,17,17,0.3); font-size: 15px; cursor: pointer; padding: 4px; transition: color 0.2s;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    
                    <div style="text-align: left; font-family: 'Cairo';">
                        ${item.quantity > 1 ? `<span style="display: block; font-size: 11px; color: #888; direction: ltr;">${finalProductPrice.toFixed(2)} × ${item.quantity}</span>` : ""}
                        <div class="cart-item-total-price" style="font-size: 16px; font-weight: 700; color: #FF91A4; white-space: nowrap;">${totalItemCost.toFixed(2)} <span style="font-size: 11px; font-weight: 400; color: #111111;">EGP</span></div>
                    </div>
                </div>
            `;
            
            cartWrapper.appendChild(cartCard);
        });
        
        bindCartCardsEvents(cart, storeData);
        updateCartSummary(cart, storeData);
    }
    
    if (clearCartBtn) {
        clearCartBtn.onclick = () => {
            if (confirm("هل ترغب في إفراغ كافة محتويات سلة المشتريات؟")) {
                localStorage.removeItem("bose_cart");
                if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
                refreshCartUI();
            }
        };
    }

    refreshCartUI();
}

function bindCartCardsEvents(cart, storeData) {
    document.querySelectorAll("#cart-items-wrapper .btn-qty-plus").forEach(btn => {
        btn.onclick = (e) => {
            const index = parseInt(e.currentTarget.getAttribute("data-index"), 10);
            cart[index].quantity += 1;
            localStorage.setItem("bose_cart", JSON.stringify(cart));
            if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
            renderBoseCartPage(storeData);
        };
    });
    
    document.querySelectorAll("#cart-items-wrapper .btn-qty-minus").forEach(btn => {
        btn.onclick = (e) => {
            const index = parseInt(e.currentTarget.getAttribute("data-index"), 10);
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                localStorage.setItem("bose_cart", JSON.stringify(cart));
                if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
                renderBoseCartPage(storeData);
            } else {
                triggerCartItemRemoval(cart, index, storeData);
            }
        };
    });
    
    document.querySelectorAll("#cart-items-wrapper .btn-remove-item").forEach(btn => {
        btn.onclick = (e) => {
            const index = parseInt(e.currentTarget.getAttribute("data-index"), 10);
            triggerCartItemRemoval(cart, index, storeData);
        };
    });
}

function triggerCartItemRemoval(cart, index, storeData) {
    if (confirm(`هل ترغب في إزالة صنف "${cart[index].title}" من السلة؟`)) {
        cart.splice(index, 1);
        localStorage.setItem("bose_cart", JSON.stringify(cart));
        if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
        renderBoseCartPage(storeData);
    }
}

function updateCartSummary(cart, storeData) {
    const subtotalDisplay = document.getElementById("cart-subtotal-value") || document.getElementById("summary-subtotal");
    const grandTotalDisplay = document.getElementById("cart-grand-total-value") || document.getElementById("summary-grand-total");
    const itemsCountDisplay = document.getElementById("summary-items-count");
    
    let subtotal = 0;
    let displayItems = 0;
    
    cart.forEach(item => {
        subtotal += parseFloat(item.finalPrice || 0) * (parseInt(item.quantity, 10) || 1);
        if (item.type === "custom-cake" || item.type === "custom-flower" || item.type === "mini-cake") {
            displayItems += 1;
        } else {
            displayItems += (parseInt(item.quantity, 10) || 1);
        }
    });
    
    if (subtotalDisplay) subtotalDisplay.textContent = subtotal.toFixed(2) + " EGP";
    if (itemsCountDisplay) itemsCountDisplay.textContent = displayItems;
    
    let discount = 0;
    const activeCoupon = localStorage.getItem("bose_active_coupon");
    if (activeCoupon && storeData.coupons) {
        const couponRule = storeData.coupons.find(c => c.code === activeCoupon);
        if (couponRule) discount = subtotal * (couponRule.value / 100);
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
    const rawCart = localStorage.getItem("bose_cart");
    const cart = rawCart ? JSON.parse(rawCart) : [];
    
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
    branchDiv.style.cssText = "background: rgba(212, 175, 55, 0.04); border: 1px solid #D4AF37; padding: 16px; border-radius: 14px; margin: 15px 0; direction: rtl; text-align: right;";
    
    const addressText = storeData.store?.pickup?.address || "الكفاح شارع الوحدة المحلية بجوار صيدلية الدكتور أحمد مجدي وبجوار عيادة الدكتور علي";
    const mapLink = storeData.store?.pickup?.mapUrl || "https://maps.app.goo.gl/nAg4Y7vQ7hACvKGc8?g_st=ac";
    
    branchDiv.innerHTML = `
        <h4 style="margin: 0 0 6px 0; font-size: 15px; color: #111111; font-weight: 700; font-family: 'Cairo';"><i class="fas fa-building" style="color: #D4AF37; margin-left: 6px;"></i> مقر الاستلام الرسمي للبراند:</h4>
        <p style="margin: 0 0 12px 0; font-size: 13.5px; color: #444; line-height: 1.6; font-family: 'Cairo';">${addressText}</p>
        <a href="${mapLink}" target="_blank" class="success-action-secondary-btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; background: #FFF; border: 1px solid #D4AF37; color: #111; font-family: 'Cairo';">
            <i class="fas fa-map-marked-alt" style="color: #D4AF37;"></i> عرض الموقع على خرائط جوجل
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
        if (shippingFee === 0) shippingDisplay.style.color = "#2ECC71";
        else shippingDisplay.style.color = "#111111";
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
        alert("يرجى كتابة اسم صاحب الطلب بالكامل ثنائياً على الأقل.");
        if (customerNameInput) customerNameInput.focus();
        return;
    }

    const phone1 = customerPhoneInput ? customerPhoneInput.value.trim() : "";
    if (typeof window.validateBosePhoneNumber === "function") {
        if (!window.validateBosePhoneNumber(phone1)) {
            alert("يرجى إدخال رقم هاتف محمول مصري صحيح ومطابق للشبكة (01XXXXXXXXX).");
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
            alert("يرجى تحديد المنطقة السكنية لقراءة مصاريف التوصيل بشفافية.");
            zoneSelect.focus();
            return;
        }
        selectedZoneName = zoneSelect ? zoneSelect.value : "";
        
        const addressDetails = addressDetailsInput ? addressDetailsInput.value.trim() : "";
        if (addressDetails.length < 8) {
            alert("يرجى كتابة العنوان السكني بالتفصيل (شارع/منزل/علامة مميزة) لسلامة الشحن.");
            if (addressDetailsInput) addressDetailsInput.focus();
            return;
        }
        fullAddressText = `المحافظة: الوادي الجديد | المركز: الفرافرة | المنطقة: ${selectedZoneName} | تفصيل السكن: ${addressDetails}`;
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
            alert(storeData.orderRules?.preparationTimeMessage || "نحتاج إلى وقت كافٍ لتجهيز طلبك بأفضل جودة ممكنة، لذلك لا يمكن اختيار موعد قبل 24 ساعة من وقت تأكيد الطلب.");
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
        couponUsed: activeCoupon || "لا يوجد",
        subtotal: subtotal,
        discount: discount,
        grandTotal: finalGrandTotalCalculated,
        notes: orderNotesInput ? orderNotesInput.value.trim() : "لا توجد ملاحظات إضافية",
        items: cart
    };

    localStorage.setItem("bose_last_processed_order", JSON.stringify(completedBoseOrderObject));
    
    const whatsappMessageText = buildBoseFormattedWhatsappInvoice(completedBoseOrderObject);
    const brandWhatsappNumber = storeData.store?.phone || "01097238441";
    const secureWhatsappUrl = `https://api.whatsapp.com/send?phone=2${brandWhatsappNumber}&text=${encodeURIComponent(whatsappMessageText)}`;
    
    localStorage.setItem("bose_secure_whatsapp_url", secureWhatsappUrl);

    localStorage.removeItem("bose_cart");
    localStorage.removeItem("bose_active_coupon");
    if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();

    window.open(secureWhatsappUrl, "_blank");
    window.location.href = "order-success.html";
}

function buildBoseFormattedWhatsappInvoice(order) {
    let msg = `✨ *فاتورة حجز طلبية فاخرة - حلويات بوسي (BoseSweets)* ✨\n`;
    msg += `--------------------------------------------------\n`;
    msg += `🧾 *رقم المعاملة الموحد:* ${order.orderId}\n`;
    msg += `👤 *العميل المحترم:* ${order.customerName}\n`;
    msg += `📞 *رقم الاتصال الأساسي:* ${order.phone1}\n`;
    if (order.phone2) msg += `📞 *رقم الاتصال البديل:* ${order.phone2}\n`;
    msg += `🚗 *طريقة ومسار الاستلام:* ${order.deliveryMethod}\n`;
    msg += `📍 *الموقع والتفاصيل الجغرافية:* ${order.address}\n`;
    msg += `📅 *موعد الاستلام المحدد والمقدس:* ${order.scheduledDate} في تمام الساعة ${order.scheduledTime}\n`;
    msg += `--------------------------------------------------\n`;
    msg += `📦 *تفاصيل الأصناف والخيارات المصممة:* \n\n`;

    order.items.forEach((item, idx) => {
        msg += `${idx + 1}. 🌟 *${item.title}* (${item.flavorName})\n`;
        msg += `   *الكمية المطلوبة:* ${item.quantity} قطعة / صنف\n`;
        msg += `   *سعر وحدة الصنف الشامل:* ${parseFloat(item.finalPrice).toFixed(2)} EGP\n`;
        
        if (item.customDetails && (item.type === "custom-cake" || item.type === "custom-flower" || item.type === "mini-cake")) {
            const cd = item.customDetails;
            if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") msg += `   • طعم الكيك: ${cd.cakeType}\n`;
            if (cd.shape && cd.shape !== "none") msg += `   • الشكل الهندسي: ${cd.shape}\n`;
            if (cd.persons && cd.persons > 0) msg += `   • سعة الأفراد: لـ ${cd.persons} فرد\n`;
            if (cd.printingType && cd.printingType !== "none") msg += `   • نوع الصورة المطبوعة: ${cd.printingType}\n`;
            if (cd.customMessage && cd.customMessage.trim() !== "") msg += `   • النص المطلوب فوقه: "${cd.customMessage}"\n`;
            if (cd.flowerType && cd.flowerType !== "none") msg += `   • صنف الورد المختار: ${cd.flowerType}\n`;
            if (cd.flowerCount && cd.flowerCount > 0) msg += `   • التعداد الكلي للورد: ${cd.flowerCount}\n`;
            if (cd.moneyAmount && cd.moneyAmount > 0) msg += `   • قيمة الكاش المدمج بالبوكيه: +${cd.moneyAmount} EGP\n`;
            if (cd.chocolatePieces && cd.chocolatePieces > 0) msg += `   • مضاف قطع شوكولاتة: ${cd.chocolatePieces} قطعة\n`;
            if (cd.wrappingType && cd.wrappingType !== "none") msg += `   • التغليف الفاخر: ${cd.wrappingType}\n`;
            if (cd.giftCardText && cd.giftCardText.trim() !== "") msg += `   • رسالة كارت الإهداء: "${cd.giftCardText}"\n`;
        }
        msg += `   ---------------------------\n`;
    });

    msg += `📝 *ملاحظات لوجستية وطبية خاصة بالطلب:* ${order.notes}\n`;
    msg += `--------------------------------------------------\n`;
    msg += `💰 *ملخص العمليات الحسابية المعتمدة:* \n`;
    msg += `   • إجمالي الأصناف الصافي: ${order.subtotal.toFixed(2)} EGP\n`;
    if (order.discount > 0) msg += `   • كود الخصم المطبق [${order.couponUsed}]: -${order.discount.toFixed(2)} EGP\n`;
    msg += `   • رسوم ومصاريف التوصيل الجغرافية: ${order.shippingFee === 0 ? 'مجاناً' : order.shippingFee.toFixed(2) + ' EGP'}\n`;
    msg += `👑 *المجموع المالي النهائي والمطلوب (مقرب كلياً):* ${order.grandTotal} EGP 👑\n`;
    msg += `--------------------------------------------------\n`;
    msg += `🤝 شكرًا لاختياركم الفاخر لـ حلويات بوسي. تم توثيق وحفظ حجز موعدكم بنجاح وسعادة في النظام التكنولوجي الموحد لعام 2026. ✨`;
    
    return msg;
}

/**
 * =========================================================================
 * 🧾 3. محرك وإدارة صفحة نجاح الطلب وإصدار الفاتورة (order-success.html)
 * =========================================================================
 */
function renderBoseSuccessPage(storeData) {
    const rawOrder = localStorage.getItem("bose_last_processed_order");
    if (!rawOrder) {
        window.location.href = "index.html";
        return;
    }
    const order = JSON.parse(rawOrder);

    const orderIdDisplay = document.getElementById("success-order-id-display");
    const customerWelcome = document.getElementById("success-customer-welcome");
    const receiptWrapper = document.getElementById("bose-order-receipt-summary");
    
    if (orderIdDisplay) orderIdDisplay.textContent = order.orderId;
    if (customerWelcome) customerWelcome.textContent = `مرحباً بك عميلنا المحترم: ${order.customerName}`;
    
    if (receiptWrapper) {
        receiptWrapper.innerHTML = `
            <div class="receipt-card-header" style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,145,164,0.1); padding-bottom: 8px; margin-bottom: 12px; font-family: 'Cairo';">
                <span class="order-id-label" style="font-weight:700; color:#FF91A4;">رقم الطلب المرجعي: ${order.orderId}</span>
                <span style="font-size: 13px; color: #777;">توقيت المعاملة: 2026</span>
            </div>
            <div class="invoice-receipt-details-list" style="display: flex; flex-direction: column; gap: 8px; direction: rtl; text-align: right; font-family: 'Cairo';">
                <div class="receipt-row-item"><span>اسم المستلم الصريح:</span> <strong>${order.customerName}</strong></div>
                <div class="receipt-row-item"><span>رقم الهاتف الأساسي المؤكد:</span> <strong>${order.phone1}</strong></div>
                <div class="receipt-row-item"><span>نوع ومسار الاستلام:</span> <strong>${order.deliveryMethod} (${order.deliveryZone})</strong></div>
                <div class="receipt-row-item"><span>الموعد الملتزم للتجهيز:</span> <strong>${order.scheduledDate} في ${order.scheduledTime}</strong></div>
                <div class="receipt-grand-total-divider" style="height: 1px; background: rgba(17,17,17,0.06); margin: 6px 0;"></div>
                <div class="receipt-grand-total-row" style="display: flex; justify-content: space-between; align-items: center;"><span class="receipt-total-label" style="font-weight:700;">المجموع المالي الكلي والنهائي:</span> <span class="receipt-total-value" style="font-size: 18px; font-weight: 700; color: #FF91A4;">${order.grandTotal} EGP</span></div>
            </div>
        `;
    }

    const retryRedirectBtn = document.getElementById("btn-whatsapp-retry-redirect");
    const secureWhatsappUrl = localStorage.getItem("bose_secure_whatsapp_url");
    
    if (retryRedirectBtn && secureWhatsappUrl) {
        retryRedirectBtn.setAttribute("href", secureWhatsappUrl);
        retryRedirectBtn.setAttribute("target", "_blank");
    }

    if (window.history && window.history.pushState) {
        window.history.pushState('forward', null, window.location.href);
        window.addEventListener('popstate', function () {
            window.history.pushState('forward', null, window.location.href);
            window.location.href = "index.html"; 
        });
    }
}