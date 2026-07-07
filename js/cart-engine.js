/**
 * 📑 محرك السلة وإتمام الطلب والتوثيق المالي النهائي (js/cart-engine.js)
 * الإصدار الفاخر والمطور V2 - علامة حلويات بوسي الفاخرة (BoseSweets)
 * * يلتزم هذا المحرك بإدارة العمليات الحسابية الشفافة، وتطبيقات الشحن اللوجستي الجغرافي،
 * وتأمين التحويلات المباشرة لتطبيق الواتساب، وحظر كافة الثغرات المالية والبرمجية.
 */

document.addEventListener("DOMContentLoaded", () => {
    // تحديد الصفحة الحالية لتفعيل المحرك الداخلي المناسب لمنع التداخل والتعارض
    const currentPath = window.location.pathname;
    
    // ربط المحرك المركزي والانتظار حتى تهيئة قاعدة البيانات الأساسية لـ JSON
    if (typeof window.onBoseDatabaseReady === "function") {
        window.onBoseDatabaseReady((storeData) => {
            initializeCartEngine(storeData);
        });
    } else {
        // حارس احتياطي في حال تأخر تحميل الملفات المتقاطعة
        document.addEventListener("BoseDatabaseLoaded", (e) => {
            initializeCartEngine(e.detail);
        });
    }
});

/**
 * دالة التهيئة والتحكم الأساسية لمحرك السلة والطلب
 */
function initializeCartEngine(storeData) {
    const pageBodyId = document.body.id || "";
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
    
    // دالة داخلية لإعادة بناء وعرض كروت السلة الأفقية الفاخرة
    function refreshCartUI() {
        const rawCart = localStorage.getItem("bose_cart");
        const cart = rawCart ? JSON.parse(rawCart) : [];
        
        // التحكم في ظهور واختفاء زر إفراغ السلة المستقل برمجياً تبعا لامتلاء السلة
        if (clearCartBtn) {
            clearCartBtn.style.display = cart.length > 0 ? "block" : "none";
        }
        
        if (cart.length === 0) {
            cartWrapper.innerHTML = `
                <div class="empty-cart-message-block" style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-shopping-bag" style="font-size: 48px; color: var(--bose-pink); margin-bottom: 20px; display: block; opacity: 0.5;"></i>
                    <p style="font-size: 18px; font-weight: 600; color: var(--bose-black);">سلة المشتريات فارغة حالياً</p>
                    <a href="menu.html" class="bose-btn-primary" style="display: inline-block; margin-top: 15px; background: var(--bose-pink); color: #FFF; padding: 10px 25px; border-radius: 8px; text-decoration: none; font-weight: 600;">تصفح المنيو الشامل</a>
                </div>
            `;
            updateCartSummary(cart, storeData);
            return;
        }
        
        cartWrapper.innerHTML = ""; // تصفير الحاوية قبل إعادة الحقن الديناميكي للـ DOM
        
        cart.forEach((item, index) => {
            const finalProductPrice = parseFloat(item.finalPrice || 0);
            const totalItemCost = finalProductPrice * (parseInt(item.quantity, 10) || 1);
            
            // بناء كتلة التفاصيل المخصصة للمنتجات والمحاكيات الفخمة
            let customDetailsHTML = "";
            if (item.customDetails && (item.type === "custom-cake" || item.type === "custom-flower" || item.type === "mini-cake" || String(item.id).includes("-"))) {
                customDetailsHTML = `<div class="cart-item-custom-specifications" style="font-size: 13px; color: #555; background: rgba(255,145,164,0.04); padding: 8px; border-radius: 6px; margin: 5px 0;">`;
                
                if (item.customDetails.cakeType && item.customDetails.cakeType !== "none") customDetailsHTML += `<span><strong>نوع الكيك:</strong> ${item.customDetails.cakeType}</span> | `;
                if (item.customDetails.shape && item.customDetails.shape !== "none") customDetailsHTML += `<span><strong>الشكل:</strong> ${item.customDetails.shape === 'circle' ? 'دائري' : item.customDetails.shape === 'heart' ? 'قلب' : item.customDetails.shape === 'square' ? 'مربع' : 'مستطيل'}</span> | `;
                if (item.customDetails.persons && parseInt(item.customDetails.persons, 10) > 0) customDetailsHTML += `<span><strong>عدد الأفراد:</strong> ${item.customDetails.persons} فرد</span> | `;
                if (item.customDetails.printingType && item.customDetails.printingType !== "none") {
                    const printText = item.customDetails.printingType === 'edible' ? 'صورة صالحة للأكل' : 'صورة مجسمة غير صالحة للأكل';
                    customDetailsHTML += `<span><strong>الطباعة:</strong> ${printText}</span> | `;
                }
                if (item.customDetails.customMessage && item.customDetails.customMessage.trim() !== "") customDetailsHTML += `<span><strong>الرسالة:</strong> "${item.customDetails.customMessage}"</span> | `;
                if (item.customDetails.allergyNote && item.customDetails.allergyNote.trim() !== "") customDetailsHTML += `<span style="color:#D4AF37;"><strong>ملاحظة الحساسية:</strong> ${item.customDetails.allergyNote}</span> | `;
                if (item.customDetails.flowerType && item.customDetails.flowerType !== "none") customDetailsHTML += `<span><strong>نوع الورد:</strong> ${item.customDetails.flowerType === 'natural' ? 'طبيعي نضر' : item.customDetails.flowerType === 'artificial' ? 'صناعي فاخر' : 'ستان مصنوع بحب'}</span> | `;
                if (item.customDetails.flowerCount && parseInt(item.customDetails.flowerCount, 10) > 0) customDetailsHTML += `<span><strong>عدد الورد:</strong> ${item.customDetails.flowerCount} وردة</span> | `;
                if (item.customDetails.moneyAmount && parseInt(item.customDetails.moneyAmount, 10) > 0) customDetailsHTML += `<span><strong>الكاش المدمج:</strong> +${item.customDetails.moneyAmount} جنيه</span> | `;
                if (item.customDetails.chocolatePieces && parseInt(item.customDetails.chocolatePieces, 10) > 0) customDetailsHTML += `<span><strong>قطع الشوكولاتة:</strong> ${item.customDetails.chocolatePieces} قطعة</span> | `;
                if (item.customDetails.wrappingType && item.customDetails.wrappingType !== "none") customDetailsHTML += `<span><strong>التغليف:</strong> ${item.customDetails.wrappingType === 'satin' ? 'ستان فاخر' : item.customDetails.wrappingType === 'classic' ? 'كلاسيكي' : 'بوكس فخم'}</span> | `;
                if (item.customDetails.giftCardText && item.customDetails.giftCardText.trim() !== "") customDetailsHTML += `<span><strong>كارت الإهداء:</strong> "${item.customDetails.giftCardText}"</span> | `;
                
                // تنظيف الفواصل الزائدة في نهاية النص
                if (customDetailsHTML.endsWith(" | ")) customDetailsHTML = customDetailsHTML.slice(0, -3);
                customDetailsHTML += `</div>`;
            }

            // بناء هيكل الكارت الأفقي الموحد والملتزم بالـ DOM الصارم لمنع الجداول الجافة
            const cartCard = document.createElement("div");
            cartCard.className = "bose-horizontal-cart-card";
            cartCard.setAttribute("data-item-id", item.id);
            cartCard.style.cssText = "display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(255, 145, 164, 0.3); background: #FFFFFF; padding: 16px; border-radius: 20px; margin-bottom: 16px; box-shadow: 0 8px 32px rgba(255, 145, 164, 0.06); position: relative; direction: rtl;";
            
            cartCard.innerHTML = `
                <div class="cart-card-right-section" style="display: flex; align-items: center; gap: 16px; flex: 1;">
                    <img src="${item.image || 'img/placeholder.png'}" class="cart-item-image" alt="${item.title}" style="width: 120px; height: 120px; border-radius: 12px; object-fit: cover; flex-shrink: 0;">
                    <div class="cart-item-meta-data" style="display: flex; flex-direction: column; gap: 4px;">
                        <h3 class="cart-item-title" style="margin: 0; font-size: 16px; font-weight: 600; color: var(--bose-black);">${item.title}</h3>
                        <span class="cart-item-flavor-name" style="font-size: 14px; color: var(--bose-pink); font-weight: 600;">${item.flavorName}</span>
                        ${customDetailsHTML}
                        
                        <div class="bose-cart-qty-counter" style="display: flex; align-items: center; border: 1px solid rgba(255, 145, 164, 0.3); border-radius: 8px; width: max-content; margin-top: 8px; background: #FFFFFF;">
                            <button class="btn-qty-plus" data-index="${index}" style="border: none; background: transparent; padding: 6px 12px; font-weight: 700; color: var(--bose-black); cursor: pointer;">+</button>
                            <input type="text" readonly class="input-qty-value" value="${item.quantity}" style="width: 35px; text-align: center; border: none; font-size: 14px; font-weight: 600; color: var(--bose-black); background: transparent;">
                            <button class="btn-qty-minus" data-index="${index}" style="border: none; background: transparent; padding: 6px 12px; font-weight: 700; color: var(--bose-black); cursor: pointer;">-</button>
                        </div>
                    </div>
                </div>
                
                <div class="cart-card-left-section" style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; height: 120px; min-width: 90px;">
                    <button class="btn-remove-item" data-index="${index}" aria-label="حذف الصنف" style="background: transparent; border: none; color: #ff4d4d; font-size: 16px; cursor: pointer; padding: 4px; transition: transform 0.2s;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    
                    <div class="product-card-price-wrapper" style="text-align: left;">
                        ${item.quantity > 1 ? `<span class="single-unit-price-calc" style="display: block; font-size: 12px; color: #888; direction: ltr;">${finalProductPrice.toFixed(2)} × ${item.quantity}</span>` : ""}
                        <div class="product-card-price" style="font-size: 18px; font-weight: 700; color: var(--bose-pink); margin-top: 2px;">${totalItemCost.toFixed(2)} <span style="font-size: 12px; font-weight: 400; color: var(--bose-black);">جنيه</span></div>
                    </div>
                </div>
            `;
            
            cartWrapper.appendChild(cartCard);
        });
        
        // ربط أحداث وأزرار كروت السلة المضافة حديثاً
        bindCartCardsEvents(cart, storeData);
        updateCartSummary(cart, storeData);
    }
    
    // تفعيل حدث زر إفراغ السلة بالكامل التفاعلي مع رسالة التأكيد اللطيفة الراقية
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", () => {
            if (confirm("هل ترغب في إفراغ كافة محتويات سلة المشتريات؟")) {
                localStorage.removeItem("bose_cart");
                if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
                refreshCartUI();
            }
        });
    }

    // تشغيل العرض الأولي للسلة
    refreshCartUI();
}

/**
 * ربط أحداث زيادة ونقص وحذف المنتجات داخل صفحة السلة
 */
function bindCartCardsEvents(cart, storeData) {
    // 1. زر زيادة الكمية (+)
    document.querySelectorAll("#cart-items-wrapper .btn-qty-plus").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.currentTarget.getAttribute("data-index"), 10);
            cart[index].quantity += 1;
            localStorage.setItem("bose_cart", JSON.stringify(cart));
            if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
            renderBoseCartPage(storeData);
        });
    });
    
    // 2. زر نقص الكمية (-) وحظر القيم السالبة أو الصفرية
    document.querySelectorAll("#cart-items-wrapper .btn-qty-minus").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.currentTarget.getAttribute("data-index"), 10);
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                localStorage.setItem("bose_cart", JSON.stringify(cart));
                if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
                renderBoseCartPage(storeData);
            } else {
                // إذا كانت الكمية 1 وضغط ناقص، نطلب التأكيد لحذف الصنف لراحة العميل
                triggerCartItemRemoval(cart, index, storeData);
            }
        });
    });
    
    // 3. زر حذف واستبعاد المنتج الفوري من أعلى يسار الكارت
    document.querySelectorAll("#cart-items-wrapper .btn-remove-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.currentTarget.getAttribute("data-index"), 10);
            triggerCartItemRemoval(cart, index, storeData);
        });
    });
}

/**
 * دالة طلب تأكيد الحذف اللطيفة لمنع الفقد العشوائي لخيارات العميل المخصصة
 */
function triggerCartItemRemoval(cart, index, storeData) {
    if (confirm(`هل أنت متأكد من رغبتك في استبعاد "${cart[index].title}" من السلة؟`)) {
        cart.splice(index, 1);
        localStorage.setItem("bose_cart", JSON.stringify(cart));
        if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
        renderBoseCartPage(storeData);
    }
}

/**
 * تحديث ملخص الفاتورة المالي الدقيق والشفاف بالكسور الكاملة قبل التقريب النهائي
 */
function updateCartSummary(cart, storeData) {
    const subtotalDisplay = document.getElementById("cart-subtotal-value") || document.getElementById("summary-subtotal");
    const grandTotalDisplay = document.getElementById("summary-grand-total");
    
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += parseFloat(item.finalPrice || 0) * (parseInt(item.quantity, 10) || 1);
    });
    
    if (subtotalDisplay) {
        subtotalDisplay.textContent = subtotal.toFixed(2);
    }
    
    // معالجة قسيمة الخصم إن وُجدت مخزنة مؤقتاً
    let discount = 0;
    const activeCoupon = localStorage.getItem("bose_active_coupon");
    if (activeCoupon && storeData.store && storeData.store.coupons) {
        const couponRule = storeData.store.coupons.find(c => c.code === activeCoupon && c.active);
        if (couponRule) {
            discount = subtotal * (couponRule.percent / 100);
        }
    }
    
    // في صفحة السلة الشحن يظهر 0 جنيه افتراضياً قبل خطوة تحديد المنطقة الجغرافية بصفحة التشيك أوت
    let shippingFee = 0;
    let finalGrandTotal = subtotal - discount + shippingFee;
    if (finalGrandTotal < 0) finalGrandTotal = 0;
    
    if (grandTotalDisplay) {
        // حظر دالة التقريب الكلي بالفردي بالسلة بل إظهار الحساب الدقيق بالكسور لعلم العميل الكامل
        grandTotalDisplay.textContent = finalGrandTotal.toFixed(2);
    }
    
    // معالجة تفعيل وتطبيق الكوبون برمجياً بداخل واجهة السلة
    const promoInput = document.getElementById("checkout-coupon-input");
    const promoBtn = document.getElementById("btn-apply-coupon");
    if (promoBtn && promoInput) {
        promoBtn.addEventListener("click", () => {
            const code = promoInput.value.trim().toUpperCase();
            if (!code) return;
            
            if (storeData.store && storeData.store.coupons) {
                const found = storeData.store.coupons.find(c => c.code === code && c.active);
                if (found) {
                    localStorage.setItem("bose_active_coupon", code);
                    alert(`تم تطبيق كود الخصم "${code}" بنجاح بقيمة ${found.percent}%`);
                    updateCartSummary(cart, storeData);
                } else {
                    alert("عذراً، كود الخصم هذا غير صلاح أو منتهي الصلاحية.");
                }
            }
        });
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
    const addressDetailsWrapper = document.getElementById("checkout-address-details-wrapper") || document.getElementById("textarea-address-wrapper");
    
    let currentShippingMethod = "pickup"; // القيمة الافتراضية الآمنة للامتثال
    let selectedShippingFee = 0;

    // 1. بروتوكول التبديل التفاعلي في حال الاستلام من الفرع
    if (pickupBtn) {
        pickupBtn.addEventListener("click", () => {
            currentShippingMethod = "pickup";
            pickupBtn.classList.add("active-method-btn");
            if (deliveryBtn) deliveryBtn.classList.remove("active-method-btn");
            
            // إخفاء حاويات التوصيل والمنطقة وحقن بلوك المقر الموثق من الـ JSON
            if (shippingZoneWrapper) shippingZoneWrapper.style.display = "none";
            if (addressDetailsWrapper) addressDetailsWrapper.style.display = "none";
            
            injectBoseBranchBlock(storeData);
            selectedShippingFee = 0;
            recalculateCheckoutInvoice(cart, storeData, selectedShippingFee);
        });
    }

    // 2. بروتوكول التبديل التفاعلي في حال الرغبة بالتوصيل للمنزل
    if (deliveryBtn) {
        deliveryBtn.addEventListener("click", () => {
            currentShippingMethod = "delivery";
            deliveryBtn.classList.add("active-method-btn");
            if (pickupBtn) pickupBtn.classList.remove("active-method-btn");
            
            // إخفاء كتلة الفرع وإظهار مدخلات الشحن والمناطق الـ 10
            const branchBlock = document.getElementById("bose-branch-info-static");
            if (branchBlock) branchBlock.remove();
            
            if (shippingZoneWrapper) shippingZoneWrapper.style.display = "block";
            if (addressDetailsWrapper) addressDetailsWrapper.style.display = "block";
            
            // قراءة المناطق الجغرافية ديناميكياً وتحديث السعر فوراً أمام العميل
            fetchSelectedZonePrice();
        });
    }

    // 3. آلية جلب واستدعاء سعر وتكلفة الشحن الجغرافية المخصصة (Real-time Shipping Fetch)
    if (zoneSelect) {
        zoneSelect.addEventListener("change", () => {
            fetchSelectedZonePrice();
        });
    }

    function fetchSelectedZonePrice() {
        if (!zoneSelect || currentShippingMethod !== "delivery") {
            selectedShippingFee = 0;
            return;
        }
        const selectedZoneId = zoneSelect.value;
        let fee = 0;
        
        if (storeData.store && storeData.store.shippingZones) {
            const zoneRule = storeData.store.shippingZones.find(z => z.id === selectedZoneId || z.slug === selectedZoneId || z.name === selectedZoneId);
            if (zoneRule) {
                fee = parseFloat(zoneRule.price || zoneRule.fee || 0);
            } else {
                // صمام أمان التكلفة الاحتياطية الثابتة بالمواصفة في حال تعذر القراءة
                if (selectedZoneId === "الكفاح" || selectedZoneId === "أبو الهول") fee = 30;
                else if (selectedZoneId === "الصنايع" || selectedZoneId === "أبو بكر") fee = 40;
                else if (selectedZoneId === "الفرافرة" || selectedZoneId === "الجمعية" || selectedZoneId === "الأمل") fee = 50;
                else if (selectedZoneId === "قرية_13" || selectedZoneId === "قرية_17") fee = 70;
                else if (selectedZoneId === "أبو_هريرة") fee = 140;
            }
        }
        selectedShippingFee = fee;
        recalculateCheckoutInvoice(cart, storeData, selectedShippingFee);
    }

    // تشغيل الحسبة الأولية الافتراضية (استلام فرع) فور التحميل
    if (pickupBtn) pickupBtn.click();

    // 4. حارس الفحص النهائي الشامل والتحصين عند الضغط على زر "تأكيد الطلب"
    const submitOrderBtn = document.getElementById("btn-submit-order-final");
    if (submitOrderBtn) {
        submitOrderBtn.addEventListener("click", (e) => {
            e.preventDefault();
            processFinalBoseOrder(cart, storeData, currentShippingMethod, selectedShippingFee);
        });
    }
}

/**
 * حقن بلوك بيانات مقر فرع حلويات بوسي الصريح والمثبت هندسياً مع زر خرائط جوجل
 */
function injectBoseBranchBlock(storeData) {
    const existingBlock = document.getElementById("bose-branch-info-static");
    if (existingBlock) return;
    
    const insertionPoint = document.getElementById("shipping-zone-wrapper");
    if (!insertionPoint) return;
    
    const branchDiv = document.createElement("div");
    branchDiv.id = "bose-branch-info-static";
    branchDiv.style.cssText = "background: rgba(212, 175, 55, 0.05); border: 1px solid var(--bose-gold); padding: 16px; border-radius: 12px; margin: 15px 0; direction: rtl;";
    
    const addressText = storeData.store?.address || "الكفاح - شارع الوحدة المحلية - بجوار صيدلية الدكتور أحمد مجدي وبجوار عيادة الدكتور علي";
    const mapLink = storeData.store?.mapUrl || "https://maps.app.goo.gl/nAg4Y7vQ7hACvKGc8?g_st=ac";
    
    branchDiv.innerHTML = `
        <h4 style="margin: 0 0 8px 0; font-size: 15px; color: var(--bose-black); font-weight: 700;"><i class="fas fa-building" style="color: var(--bose-gold); margin-left: 6px;"></i> مقر الاستلام الرسمي للبراند:</h4>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #333; line-height: 1.6;">${addressText}</p>
        <a href="${mapLink}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #FFFFFF; background: var(--bose-black); padding: 6px 14px; border-radius: 6px; text-decoration: none; width: max-content;">
            <i class="fas fa-map-marked-alt" style="color: var(--bose-gold);"></i> عرض الموقع على خرائط جوجل
        </a>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #666; font-style: italic;">لا توجد رسوم شحن عند الاستلام من الفرع.</p>
    `;
    
    insertionPoint.parentNode.insertBefore(branchDiv, insertionPoint);
}

/**
 * دالة إعادة الحساب والتحديث المالي الحاسم للفاتورة الكبرى المطبقة للتقريب الصارم الكلي مرة واحدة فقط
 */
function recalculateCheckoutInvoice(cart, storeData, shippingFee) {
    const subtotalDisplay = document.getElementById("summary-subtotal");
    const shippingDisplay = document.getElementById("summary-shipping-fee");
    const grandTotalDisplay = document.getElementById("summary-grand-total");
    
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += parseFloat(item.finalPrice || 0) * (parseInt(item.quantity, 10) || 1);
    });
    
    if (subtotalDisplay) subtotalDisplay.textContent = subtotal.toFixed(2);
    if (shippingDisplay) shippingDisplay.textContent = shippingFee.toFixed(2);
    
    let discount = 0;
    const activeCoupon = localStorage.getItem("bose_active_coupon");
    if (activeCoupon && storeData.store && storeData.store.coupons) {
        const couponRule = storeData.store.coupons.find(c => c.code === activeCoupon && c.active);
        if (couponRule) discount = subtotal * (couponRule.percent / 100);
    }
    
    let absoluteTotal = subtotal - discount + shippingFee;
    if (absoluteTotal < 0) absoluteTotal = 0;
    
    if (grandTotalDisplay) {
        // ⚖️ القاعدة المالية الصارمة الحتمية: تطبيق دالة التقريب الكلي الصارم Math.round مرّة واحدة فقط على الفاتورة النهائية الكبرى الكلية
        grandTotalDisplay.textContent = Math.round(absoluteTotal);
    }
}

/**
 * معالجة وتدقيق وحقن حارس التمهيد للأمر النهائي وصياغة رسالة الواتساب الفاخرة الملتزمة بالبناء الهندسي وسد الثغرات
 */
function processFinalBoseOrder(cart, storeData, method, shippingFee) {
    const customerNameInput = document.getElementById("checkout-customer-name");
    const customerPhoneInput = document.getElementById("checkout-customer-phone");
    const customerPhone2Input = document.getElementById("checkout-customer-phone-2"); // الحقل الاختياري برمجياً لحماية التحويلات
    const addressDetailsInput = document.getElementById("checkout-address-details");
    const zoneSelect = document.getElementById("checkout-zone-select");
    const deliveryDateInput = document.getElementById("checkout-delivery-date");
    const deliveryTimeInput = document.getElementById("checkout-delivery-time");
    const orderNotesInput = document.getElementById("checkout-order-notes") || document.getElementById("checkout-notes");

    // 1. الفحص الصارم للبيانات الإلزامية ومنع الإرسال الخالي
    const customerName = customerNameInput ? customerNameInput.value.trim() : "";
    if (customerName.length < 3) {
        alert("يرجى كتابة اسم صاحب الطلب بالكامل (الاسم الثنائي كحد أدنى) لتأمين المعاملة.");
        if (customerNameInput) customerNameInput.focus();
        return;
    }

    const phone1 = customerPhoneInput ? customerPhoneInput.value.trim() : "";
    if (typeof window.validateBosePhoneNumber === "function") {
        if (!window.validateBosePhoneNumber(phone1)) {
            alert("يرجى إدخال رقم هاتف محمول مصري صحيح ومطابق لشبكات الاتصال (01XXXXXXXXX).");
            if (customerPhoneInput) customerPhoneInput.focus();
            return;
        }
    }
    const sanitizedPhone1 = typeof window.sanitizeBosePhoneNumber === "function" ? window.sanitizeBosePhoneNumber(phone1) : phone1;

    // معالجة الهاتف الثاني الاحتياطي ليكون اختيارياً تماماً حماية لنسب المبيعات ومنع تشتيت العميل
    let sanitizedPhone2 = "";
    if (customerPhone2Input && customerPhone2Input.value.trim() !== "") {
        const phone2 = customerPhone2Input.value.trim();
        if (typeof window.validateBosePhoneNumber === "function" && !window.validateBosePhoneNumber(phone2)) {
            alert("رقم الهاتف الإضافي البديل غير صحيح، يرجى مراجعته أو تركه فارغاً بسلامة.");
            customerPhone2Input.focus();
            return;
        }
        sanitizedPhone2 = typeof window.sanitizeBosePhoneNumber === "function" ? window.sanitizeBosePhoneNumber(phone2) : phone2;
    }

    // 2. فحص محددات الشحن والتوصيل اللوجستية الجغرافية
    let fullAddressText = "استلام مباشر من مقر الفرع البصري للبراند";
    let selectedZoneName = "فرع الكفاح الرئيسي";
    
    if (method === "delivery") {
        if (zoneSelect && !zoneSelect.value) {
            alert("يرجى تحديد المنطقة السكنية الدقيقة لقراءة قيمة التوصيل والشحن الشفافة.");
            zoneSelect.focus();
            return;
        }
        selectedZoneName = zoneSelect ? zoneSelect.value : "";
        
        const addressDetails = addressDetailsInput ? addressDetailsInput.value.trim() : "";
        if (addressDetails.length < 8) {
            alert("يرجى كتابة تفاصيل العنوان السكني بالكامل (شارع، منزل، علامة مميزة) لمنع توهان مندوب التوصيل.");
            if (addressDetailsInput) addressDetailsInput.focus();
            return;
        }
        fullAddressText = `المحافظة: الوادي الجديد | المركز: الفرافرة | المنطقة: ${selectedZoneName} | تفاصيل العنوان: ${addressDetails}`;
    }

    // 3. اختبار حارس الوقت والميعاد القياسي (24 ساعة تحضير صلبة)
    const orderDate = deliveryDateInput ? deliveryDateInput.value : "";
    const orderTime = deliveryTimeInput ? deliveryTimeInput.value : "";
    
    if (!orderDate || !orderTime) {
        alert("يرجى تحديد موعد ويوم وساعة الاستلام المناسبة لمناسبتكم السعيدة.");
        return;
    }

    if (typeof window.validateBoseDeliverySchedule === "function") {
        const isScheduleValid = window.validateBoseDeliverySchedule(orderDate, orderTime);
        if (!isScheduleValid) {
            const staticMsg = storeData.cakeBuilder?.preparationTimeMessage || "نحتاج إلى وقت كافٍ لتجهيز طلبك بأفضل جودة ممكنة، لذلك لا يمكن اختيار موعد قبل 24 ساعة من وقت تأكيد الطلب.";
            alert(staticMsg);
            return;
        }
    }

    // 4. صياغة التوثيق المالي النهائي وحساب المجاميع المنسقة بالمليم مع التقريب لمرة واحدة
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += parseFloat(item.finalPrice || 0) * (parseInt(item.quantity, 10) || 1);
    });
    
    let discount = 0;
    const activeCoupon = localStorage.getItem("bose_active_coupon");
    if (activeCoupon && storeData.store && storeData.store.coupons) {
        const couponRule = storeData.store.coupons.find(c => c.code === activeCoupon && c.active);
        if (couponRule) discount = subtotal * (couponRule.percent / 100);
    }
    
    const finalGrandTotalCalculated = Math.round(subtotal - discount + shippingFee);
    const orderIdGenerated = `BOSE-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. بناء وتخزين كائن المعاملة المكتملة في الذاكرة لتمريره لصفحة النجاح الفاخرة
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
    
    // إرسال وصياغة نص رسالة الفاتورة المنسقة والموجهة لتطبيق الواتساب
    const whatsappMessageText = buildBoseFormattedWhatsappInvoice(completedBoseOrderObject);
    const brandWhatsappNumber = storeData.store?.phone || "201097238441";
    const secureWhatsappUrl = `https://api.whatsapp.com/send?phone=${brandWhatsappNumber.replace("+","")}&text=${encodeURIComponent(whatsappMessageText)}`;
    
    // حفظ الرابط مؤقتاً لغرض الاستدعاء البديل اليدوي في صفحة النجاح
    localStorage.setItem("bose_secure_whatsapp_url", secureWhatsappUrl);

    // 🚨 تصفير وإفراغ السلة الموحدة بالذاكرة فوراً لمنع ثغرات تكرار سحب الطلب وتجهيز الموقع للطلب التالي
    localStorage.removeItem("bose_cart");
    localStorage.removeItem("bose_active_coupon");
    if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();

    // تشغيل التوجيه التلقائي الآمن إلى الواتساب في نافذة جديدة
    window.open(secureWhatsappUrl, "_blank");

    // تحويل ونقل العميل بسلاسة وسرعة فائقة لصفحة نجاح الطلب الرسمية لتوثيق رقم الطلب الفخم
    window.location.href = "order-success.html";
}

/**
 * الدالة الهندسية لصياغة الفاتورة التسويقية والمالية الفاخرة المنسقة للواتساب بالعامية الراقية
 */
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
        msg += `   *سعر وحدة الصنف الشامل:* ${parseFloat(item.finalPrice).toFixed(2)} جنيه\n`;
        
        // تفاصيل التخصيص الدقيقة والمحاكيات
        if (item.customDetails && (item.type === "custom-cake" || item.type === "custom-flower" || item.type === "mini-cake" || String(item.id).includes("-"))) {
            const cd = item.customDetails;
            if (cd.cakeType && cd.cakeType !== "none") msg += `   • طعم الكيك: ${cd.cakeType}\n`;
            if (cd.shape && cd.shape !== "none") msg += `   • الشكل الهندسي: ${cd.shape}\n`;
            if (cd.persons && cd.persons > 0) msg += `   • سعة الأفراد: لـ ${cd.persons} فرد\n`;
            if (cd.printingType && cd.printingType !== "none") msg += `   • نوع الصورة المطبوعة: ${cd.printingType === 'edible' ? 'صالحة للأكل' : 'مجسمة غير صالحة للأكل'}\n`;
            if (cd.customMessage && cd.customMessage.trim() !== "") msg += `   • النص المطلوب فوقه: "${cd.customMessage}"\n`;
            if (cd.flowerType && cd.flowerType !== "none") msg += `   • صنف الورد المختار: ${cd.flowerType}\n`;
            if (cd.flowerCount && cd.flowerCount > 0) msg += `   • التعداد الكلي للورد: ${cd.flowerCount} وردة\n`;
            if (cd.moneyAmount && cd.moneyAmount > 0) msg += `   • قيمة الكاش المدمج بالبوكيه: +${cd.moneyAmount} جنيه صفي\n`;
            if (cd.chocolatePieces && cd.chocolatePieces > 0) msg += `   • مضاف قطع شوكولاتة: ${cd.chocolatePieces} قطعة\n`;
            if (cd.wrappingType && cd.wrappingType !== "none") msg += `   • التغليف الفاخر: ${cd.wrappingType}\n`;
            if (cd.giftCardText && cd.giftCardText.trim() !== "") msg += `   • رسالة كارت الإهداء: "${cd.giftCardText}"\n`;
        }
        msg += `   ---------------------------\n`;
    });

    msg += `📝 *ملاحظات لوجستية وطبية خاصة بالطلب:* ${order.notes}\n`;
    msg += `--------------------------------------------------\n`;
    msg += `💰 *ملخص العمليات الحسابية المعتمدة:* \n`;
    msg += `   • إجمالي الأصناف الصافي: ${order.subtotal.toFixed(2)} جنيه\n`;
    if (order.discount > 0) msg += `   • كود الخصم المطبق [${order.couponUsed}]: -${order.discount.toFixed(2)} جنيه\n`;
    msg += `   • رسوم ومصاريف التوصيل الجغرافية: ${order.shippingFee.toFixed(2)} جنيه\n`;
    msg += `👑 *المجموع المالي النهائي والمطلوب (مقرب كلياً):* ${order.grandTotal} جنيه مصري بالمليم 👑\n`;
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
        // حماية الصفحة ومنع دخولها دون وجود طلبية معالجة في الذاكرة
        window.location.href = "index.html";
        return;
    }
    const order = JSON.parse(rawOrder);

    // 1. حقن وتحديث كتل البيانات الترحيبية ورقم الطلب الفريد بالـ DOM
    const orderIdDisplay = document.getElementById("success-order-id-display");
    const customerWelcome = document.getElementById("success-customer-welcome");
    const receiptWrapper = document.getElementById("bose-order-receipt-summary") || document.querySelector(".order-receipt-dom");
    
    if (orderIdDisplay) orderIdDisplay.textContent = order.orderId;
    if (customerWelcome) customerWelcome.textContent = `مرحباً بك عميلنا المحترم: ${order.customerName}`;
    
    // 2. حقن ملخص بيانات الايصال البصري الفخم داخل كتلة الفاتورة المصغرة
    if (receiptWrapper) {
        receiptWrapper.style.cssText = "background: #FFFFFF; border: 1px solid rgba(255, 145, 164, 0.2); padding: 20px; border-radius: 16px; box-shadow: 0 8px 32px rgba(255,145,164,0.04); direction: rtl; margin-top: 20px;";
        receiptWrapper.innerHTML = `
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: var(--bose-black); font-weight: 700; border-bottom: 1px dashed rgba(255,145,164,0.3); padding-bottom: 8px;">📊 ملخص الفاتورة المؤكدة والمحجوزة:</h3>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #333;">
                <li><strong>اسم المستلم الصريح:</strong> ${order.customerName}</li>
                <li><strong>رقم الهاتف الأساسي المؤكد:</strong> ${order.phone1}</li>
                <li><strong>مسار ونوع الاستلام الجغرافي:</strong> ${order.deliveryMethod} (${order.deliveryZone})</li>
                <li><strong>الموعد الملتزم بشرط الـ 24 ساعة تحضير:</strong> ${order.scheduledDate} في ${order.scheduledTime}</li>
                <li style="font-size: 16px; color: var(--bose-pink); font-weight: 700; border-top: 1px solid rgba(255,145,164,0.1); padding-top: 8px; margin-top: 4px;">
                    <strong>المجموع المالي الكلي والنهائي (مقرب كلياً):</strong> ${order.grandTotal} جنيه مصري بالمليم
                </li>
            </ul>
        `;
    }

    // 3. ربط وتأمين زر التحويل والاتصال المباشر البديل للواتساب لمنع ضياع المعاملة
    const retryRedirectBtn = document.getElementById("btn-whatsapp-retry-redirect");
    const secureWhatsappUrl = localStorage.getItem("bose_secure_whatsapp_url");
    
    if (retryRedirectBtn && secureWhatsappUrl) {
        retryRedirectBtn.setAttribute("href", secureWhatsappUrl);
        retryRedirectBtn.setAttribute("target", "_blank");
    }

    // 🔒 حظر وتأمين حالات التعارض ومنع العميل من الرجوع للخلف لصفحة الشراء لعدم تكرار سحب أو إنشاء المعاملة مرتين
    if (window.history && window.history.pushState) {
        window.history.pushState('forward', null, window.location.href);
        window.addEventListener('popstate', function () {
            window.history.pushState('forward', null, window.location.href);
            window.location.href = "index.html"; // إرساله للواجهة الرئيسية تلقائياً عند التلاعب بالرجوع
        });
    }
}