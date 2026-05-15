/**
 * ============================================================================
 * 👑 BoseSweets Sovereign Cart & Checkout Engine | محرك السلة السيادي (V30.0)
 * ============================================================================
 * الإدارة المرجعية: حلويات بوسي
 * التحديث التقني: إلغاء التحويل الإجباري للسلة بعد تصميم التورتة، للسماح للعميل
 * باستكمال التسوق وإضافة منتجات مكملة، مع الحفاظ على بروتوكول التسعير الإداري.
 * الوظيفة: تأمين السلة، حفظ الطلبات محلياً وسحابياً، دمج الطلبات المخصصة،
 * وتوجيه الطلب النهائي لغرفة العمليات عبر واتساب بشكل منسق وموثق.
 */

import coreExports from './core-engine.js';
const { boseConfig, BoseState } = coreExports;

const BUSINESS_WHATSAPP = "201097238441";

/**
 * 👑 محرك التسعير السيادي (Sovereign Pricing Engine)
 * تم إلغاء أي زيادات آلية؛ السعر يُستمد حصرياً من قرارات الإدارة في لوحة التحكم.
 */
export const getAdjustedPrice = function(basePrice) {
    // تم الحفاظ على الدالة لضمان توافقية الاستدعاءات، مع إعادة السعر الأصلي دون تعديل.
    return Math.round(parseFloat(basePrice));
};

// ============================================================================
// 💾 أولاً: إدارة التخزين والذاكرة الفولاذية
// ============================================================================

export const saveCartToStorage = function() { 
    try { 
        if (window.ClientStorageEngine && typeof window.ClientStorageEngine.set === 'function') {
            window.ClientStorageEngine.set('bose_cart', BoseState.cart); 
        }
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('boseSweets_cart_data', JSON.stringify(BoseState.cart)); 
        }
        updateCartDisplay();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'saveCartToStorage');
    } 
};

export const clearCartStorage = function() {
    try {
        BoseState.cart.length = 0;
        saveCartToStorage();
        syncCartUI();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'clearCartStorage');
    }
};

// ============================================================================
// 🛒 ثانياً: العمليات الحسابية وعرض السلة (UI Sync)
// ============================================================================

export const calculateCartTotal = function(deliveryMode = 'pickup') {
    let subtotal = 0;
    
    BoseState.cart.forEach(item => {
        const product = BoseState.catalogMap ? BoseState.catalogMap.get(String(item.id)) : BoseState.catalog.find(p => String(p.id) === String(item.id));
        let basePrice = product ? parseFloat(product.price) : parseFloat(item.price);
        
        let finalPrice = getAdjustedPrice(basePrice);
        
        // حساب إضافات التورتة المخصصة (الإضافات الفنية المعتمدة)
        let addonsPrice = 0;
        if (item.isCustomCake) {
            if (item.printing && item.printing.includes('أكل')) addonsPrice += 60;
            else if (item.printing && item.printing.includes('غير قابلة')) addonsPrice += 20;
        }

        subtotal += ((finalPrice + addonsPrice) * item.quantity);
    });

    let shippingFee = 0;
    if (deliveryMode !== 'pickup') {
        const zone = BoseState.shippingZones.find(z => z.id === deliveryMode || z.name === deliveryMode);
        if (zone) shippingFee = parseFloat(zone.fee);
        else if (deliveryMode.includes('الفرافرة')) shippingFee = 25;
        else if (deliveryMode.includes('الكفاح')) shippingFee = 10;
        else shippingFee = 20; 
    }

    return {
        subtotal: subtotal,
        shippingFee: shippingFee,
        total: subtotal + shippingFee
    };
};

export const updateCartDisplay = function() {
    try {
        const countBadge = document.getElementById('cart-count-badge');
        const countBadgeMobile = document.getElementById('mobile-cart-badge');
        
        const totalItems = BoseState.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (countBadge) {
            countBadge.innerText = totalItems;
            countBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        if (countBadgeMobile) {
            countBadgeMobile.innerText = totalItems;
            countBadgeMobile.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'updateCartDisplay');
    }
};

export const syncCartUI = function() {
    try {
        const cartList = document.getElementById('cart-items-list');
        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryTotal = document.getElementById('summary-total');
        
        if (!cartList) return;

        if (BoseState.cart.length === 0) {
            cartList.innerHTML = `
                <div class="empty-cart flex flex-col items-center justify-center p-12 text-center">
                    <i data-lucide="shopping-bag" class="w-20 h-20 mb-4 opacity-20" style="color: ${boseConfig.branding.colors.pink};"></i>
                    <h3 class="text-xl font-black mb-2" style="color: ${boseConfig.branding.colors.dark};">سلة المشتريات فارغة</h3>
                    <p class="font-bold opacity-60">تصفح المنيو واكتشف أشهى الحلويات التي تليق بحضرتك.</p>
                </div>`;
            if (summarySubtotal) summarySubtotal.innerText = '0 ج.م';
            if (summaryTotal) summaryTotal.innerText = '0 ج.م';
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        let html = '';
        BoseState.cart.forEach((item, index) => {
            let finalPrice = getAdjustedPrice(item.price);
            let addonsHtml = '';
            
            if (item.isCustomCake) {
                if (item.printing && item.printing.includes('أكل')) finalPrice += 60;
                else if (item.printing && item.printing.includes('غير قابلة')) finalPrice += 20;
                
                addonsHtml = `
                    <div class="text-[10px] opacity-70 mt-1 font-bold">
                        <span class="block">حجم: ${item.persons} أفراد | كيك: ${item.flavor}</span>
                        ${item.printing && item.printing !== 'بدون' ? `<span class="block">طباعة: ${item.printing}</span>` : ''}
                    </div>
                `;
            }

            let itemImgUrl = item.image;
            if (itemImgUrl && !itemImgUrl.startsWith('http')) {
                itemImgUrl = `${boseConfig.cloudinary.baseDeliveryUrl}${itemImgUrl.replace(/^\//, '')}`;
            }

            html += `
                <div class="cart-item bg-white p-4 rounded-2xl border mb-4 flex gap-4 items-center" style="border-color: ${boseConfig.branding.colors.pink}20; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                    <img src="${itemImgUrl}" alt="${item.name}" class="w-20 h-20 rounded-xl object-cover" onerror="this.onerror=null; this.src='${boseConfig.cloudinary.baseDeliveryUrl}v1712586716/logo_bose_gold.jpg';">
                    <div class="flex-1">
                        <h4 class="font-black text-sm" style="color: ${boseConfig.branding.colors.dark};">${item.name}</h4>
                        ${addonsHtml}
                        <div class="font-black mt-2" style="color: ${boseConfig.branding.colors.pink};">${finalPrice} ج.م</div>
                    </div>
                    <div class="flex flex-col items-center gap-2">
                        <button onclick="window.modQ(${index}, 1)" class="w-8 h-8 rounded-full border bg-gray-50 font-black" style="color: ${boseConfig.branding.colors.pink}; border-color: ${boseConfig.branding.colors.pink}40;">+</button>
                        <span class="font-black text-sm w-8 text-center">${item.quantity}</span>
                        <button onclick="window.modQ(${index}, -1)" class="w-8 h-8 rounded-full border bg-gray-50 font-black" style="color: ${boseConfig.branding.colors.pink}; border-color: ${boseConfig.branding.colors.pink}40;">-</button>
                    </div>
                </div>
            `;
        });

        cartList.innerHTML = html;
        
        const currentZone = document.getElementById('checkout-area') ? document.getElementById('checkout-area').value : 'pickup';
        const totals = calculateCartTotal(currentZone);
        
        if (summarySubtotal) summarySubtotal.innerText = `${totals.subtotal} ج.م`;
        if (summaryTotal) summaryTotal.innerText = `${totals.total} ج.م`;

    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'syncCartUI');
    }
};

export const modQ = function(index, delta) {
    try {
        if (BoseState.cart[index]) {
            BoseState.cart[index].quantity += delta;
            if (BoseState.cart[index].quantity <= 0) {
                BoseState.cart.splice(index, 1);
            } else if (BoseState.cart[index].quantity > 50) {
                if(typeof window.showSystemToast === 'function') window.showSystemToast("الكمية المطلوبة ضخمة، سيتم التنسيق مع الإدارة.", "info");
                BoseState.cart[index].quantity = 50;
            }
            saveCartToStorage();
            syncCartUI();
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'modQ');
    }
};

// ============================================================================
// 🛍️ ثالثاً: أوامر الإضافة والدمج (Cart Logic)
// ============================================================================

export const addWithQtyContext = function(btnElement, productId) {
    try {
        const container = btnElement.closest('.product-card') || btnElement.closest('.product-info-content') || btnElement.parentElement.parentElement;
        if (!container) return;
        
        const displaySpan = container.querySelector('.temp-qty-display');
        let qtyToAdd = 1;
        if (displaySpan) {
            qtyToAdd = parseInt(displaySpan.innerText) || 1;
        }

        const product = BoseState.catalogMap ? BoseState.catalogMap.get(String(productId)) : BoseState.catalog.find(p => String(p.id) === String(productId));
        if (!product) return;

        const existingItem = BoseState.cart.find(item => String(item.id) === String(productId) && !item.isCustomCake);
        if (existingItem) {
            existingItem.quantity += qtyToAdd;
        } else {
            BoseState.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.img || product.image || (product.images ? product.images[0] : null),
                size: product.size || 'حجم قياسي',
                quantity: qtyToAdd,
                category: product.category,
                isCustomCake: false
            });
        }

        if (displaySpan) displaySpan.innerText = "1";
        saveCartToStorage();
        if(typeof window.showSystemToast === 'function') window.showSystemToast(`تم إضافة (${qtyToAdd}) من ${product.name} لسلة حضرتك بنجاح.`, 'success');
        
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'addWithQtyContext');
    }
};

export const processBoseSweetsOrder = function(productId, productName, productPrice) {
    try {
        const existingItem = BoseState.cart.find(item => String(item.id) === String(productId) && !item.isCustomCake);
        if (existingItem) existingItem.quantity += 1;
        else {
            const product = BoseState.catalogMap ? BoseState.catalogMap.get(String(productId)) : BoseState.catalog.find(p => String(p.id) === String(productId));
            BoseState.cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                image: product ? (product.img || product.image) : null,
                quantity: 1,
                size: product ? product.size : 'حجم قياسي',
                isCustomCake: false
            });
        }
        saveCartToStorage();
        if(typeof window.showSystemToast === 'function') window.showSystemToast(`تم إضافة ${productName} للسلة بنجاح.`, 'success');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'processBoseSweetsOrder');
    }
};

export const commitCakeBuilderToCart = function() {
    try {
        const cState = BoseState.cakeState;
        const cakeId = 'custom_cake_' + Date.now();
        
        let basePrice = BoseState.siteSettings?.cakeBuilder?.basePrice || 145;
        let finalPrice = basePrice + ((cState.persons - 4) * 15); 
        
        BoseState.cart.push({
            id: cakeId,
            name: `تورتة مخصصة (${cState.persons} أفراد)`,
            price: finalPrice,
            image: cState.refImage || `${boseConfig.cloudinary.baseDeliveryUrl}v1712586716/logo_bose_gold.jpg`,
            quantity: 1,
            isCustomCake: true,
            flavor: cState.flavor,
            printing: cState.printing,
            notes: cState.notes
        });

        saveCartToStorage();
        
        // تطبيق قرار الإدارة: توجيه رسالة مريحة للعميل تتيح له الاستمرار في التسوق بدلاً من التحويل الإجباري
        if(typeof window.showSystemToast === 'function') {
            window.showSystemToast("تم إضافة التورتة المخصصة للسلة بنجاح. يمكن لحضرتك متابعة التسوق.", "success");
        }
        
        // تمت إزالة سطر التحويل الإجباري (window.location.href = 'cart.html') لضمان بقاء العميل في الصفحة
        
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'commitCakeBuilderToCart');
    }
};

// ============================================================================
// 🚀 رابعاً: التوثيق السحابي والإرسال للإدارة (Checkout & Dispatch)
// ============================================================================

export const submitOrderFinal = async function() {
    try {
        if (BoseState.cart.length === 0) {
            if(typeof window.showSystemToast === 'function') window.showSystemToast("سلة المشتريات فارغة.", "error");
            return;
        }

        const nameInput = document.getElementById('checkout-name');
        const phoneInput = document.getElementById('checkout-phone');
        const areaSelect = document.getElementById('checkout-area');

        if (!nameInput || !phoneInput || !nameInput.value.trim() || !phoneInput.value.trim()) {
            if(typeof window.showSystemToast === 'function') window.showSystemToast("برجاء إدخال البيانات المطلوبة بشكل صحيح.", "error");
            return;
        }

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const area = areaSelect ? areaSelect.options[areaSelect.selectedIndex].text : 'غير محدد';
        const areaValue = areaSelect ? areaSelect.value : 'pickup';

        const totals = calculateCartTotal(areaValue);
        
        const secureOrderId = typeof window.generateSecureOrderId === 'function' ? window.generateSecureOrderId() : 'BS_' + Date.now().toString(36).toUpperCase();

        const orderData = {
            orderId: secureOrderId,
            customerName: name,
            customerPhone: phone,
            area: area,
            itemsArray: BoseState.cart,
            totals: totals,
            status: 'pending',
            timestamp: Date.now()
        };

        const checkoutBtn = document.getElementById('final-checkout-btn');
        if (checkoutBtn) { checkoutBtn.disabled = true; checkoutBtn.innerHTML = 'جاري توثيق الطلب...'; }

        await dispatchWhatsAppOrder(orderData, totals);

    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'submitOrderFinal');
        if(typeof window.showSystemToast === 'function') window.showSystemToast("حدث عطل مؤقت، يرجى المحاولة مرة أخرى.", "error");
        const checkoutBtn = document.getElementById('final-checkout-btn');
        if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.innerHTML = 'تأكيد وإرسال الطلب عبر واتساب'; }
    }
};

export const dispatchWhatsAppOrder = async function(orderData, totals) {
    try {
        // 1. تسجيل الطلب سحابياً لتنبيه لوحة تحكم الإدارة فوراً
        if (boseConfig.network && boseConfig.network.safeWrite) {
            await boseConfig.network.safeWrite('orders', orderData.orderId, {
                id: orderData.orderId,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                area: orderData.area,
                itemsArray: orderData.itemsArray,
                total: totals.total,
                status: 'pending',
                timestamp: orderData.timestamp,
                createdAt: new Date().toISOString()
            });
        } else {
            window.dispatchEvent(new CustomEvent('secureOrderBackup', { detail: orderData }));
        }

        // 2. صياغة التقرير المرفق للإدارة
        let msg = `مرحباً إدارة حلويات بوسي 👑،\n`;
        msg += `طلب جديد قادم من الموقع الإلكتروني:\n`;
        msg += `---------------------------\n`;
        msg += `👤 العميل: ${orderData.customerName}\n`;
        msg += `📞 الموبايل: ${orderData.customerPhone}\n`;
        msg += `📍 المنطقة: ${orderData.area}\n`;
        msg += `---------------------------\n`;
        msg += `🛍️ التفاصيل:\n`;

        orderData.itemsArray.forEach((item, index) => {
            let itemFinalPrice = getAdjustedPrice(item.price);
            let addonsDesc = '';
            
            if (item.isCustomCake) {
                if (item.printing && item.printing.includes('أكل')) itemFinalPrice += 60;
                else if (item.printing && item.printing.includes('غير قابلة')) itemFinalPrice += 20;
                
                addonsDesc = ` [نكهة: ${item.flavor} | طباعة: ${item.printing}]`;
                if(item.notes) addonsDesc += `\n*ملاحظة العميل:* ${item.notes}`;
            }

            const itemTotal = itemFinalPrice * item.quantity;
            msg += `${index + 1}. ${item.name}${addonsDesc}\n   العدد: ${item.quantity} | القيمة: ${itemTotal} ج.م\n`;
        });

        msg += `---------------------------\n`;
        msg += `🧾 الإجماليات:\n`;
        msg += `- الحساب: ${totals.subtotal} ج.م\n`;
        if (totals.shippingFee > 0) {
            msg += `- التوصيل: ${totals.shippingFee} ج.م\n`;
        }
        msg += `🔹 الإجمالي المطلوب: ${totals.total} ج.م\n`;
        msg += `---------------------------\n`;
        msg += `رقم الطلب المرجعي: #${orderData.orderId}\n`;

        const encodedMsg = encodeURIComponent(msg);
        const waLink = `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodedMsg}`;
        
        clearCartStorage();
        
        if (typeof window.showSystemToast === 'function') {
            window.showSystemToast('تم تأكيد الطلب، سيتم تحويل حضرتك للتواصل مع الإدارة الآن 👑', 'success');
        }
        
        setTimeout(() => {
            window.open(waLink, '_blank');
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'dispatchWhatsAppOrder');
    }
};

// ============================================================================
// 🔗 الربط السيادي (Global Window Bindings)
// ============================================================================

if (typeof window !== 'undefined') {
    try {
        window.saveCartToStorage = saveCartToStorage;
        window.clearCartStorage = clearCartStorage;
        window.calculateCartTotal = calculateCartTotal;
        window.updateCartDisplay = updateCartDisplay;
        window.syncCartUI = syncCartUI;
        window.modQ = modQ;
        window.addWithQtyContext = addWithQtyContext;
        window.processBoseSweetsOrder = processBoseSweetsOrder;
        window.commitCakeBuilderToCart = commitCakeBuilderToCart;
        window.submitOrderFinal = submitOrderFinal;
        window.dispatchWhatsAppOrder = dispatchWhatsAppOrder;
        
        document.addEventListener('DOMContentLoaded', () => {
            updateCartDisplay();
            if (document.getElementById('cart-items-list')) {
                syncCartUI();
            }
        });
        
        console.log("👑 BoseSweets Engine: تم تحديث محرك السلة (V30.0) لمنح العميل مرونة الاستمرار في التسوق.");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'Final Global Bindings');
    }
}