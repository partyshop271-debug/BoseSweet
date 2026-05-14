/**
 * ============================================================================
 * 👑 BoseSweets Cart & Checkout Engine | محرك السلة وإتمام الطلبات المتطور
 * ============================================================================
 * الإصدار: V3.0 - Sovereign Integration Edition
 * الإدارة المرجعية: حلويات بوسي
 * الوظيفة: إدارة حالة السلة محلياً، حساب الإجماليات، وربط خطوط الشحن بالواتساب.
 */

import boseConfig from './core-engine.js';

// رقم الإدارة المعتمد والرسمي لاستقبال الطلبات وحجز المناسبات
const BUSINESS_WHATSAPP = "201097238441";

// مناطق ومصاريف الشحن المعتمدة رسمياً لمركز الفرافرة وقراها
const shippingZones = [
    { id: 'sh_1', name: 'الكفاح (داخل القرية)', fee: 10 },
    { id: 'sh_2', name: 'القرى المجاورة للكفاح (أبو منقار / عين غصين...)', fee: 20 },
    { id: 'sh_3', name: 'قرية النهضة', fee: 30 },
    { id: 'sh_4', name: 'مركز الفرافرة (المدينة)', fee: 25 }
];

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    
    // التعبئة الفورية للواجهة إذا كان المستخدم داخل صفحة السلة
    if (document.getElementById('cart-items-list')) {
        renderCartPage();
    }

    // ربط نموذج الحجز والطلب بمحرك التحقق قبل الإرسال للواتساب
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        populateShippingZones();
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
});

/**
 * 👑 جلب بيانات السلة الآمنة من الذاكرة المحلية
 */
export function getCartData() {
    try {
        const data = localStorage.getItem('BoseSweets_Cart');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        if (window.BoseMonitor) window.BoseMonitor.report(e, 'cart-system.js', null, null, 'getCartData');
        return [];
    }
}
window.getCartData = getCartData;

/**
 * 👑 حفظ التعديلات وتحديث الشارات الرقمية فوراً
 */
export function saveCartData(cartArray) {
    try {
        localStorage.setItem('BoseSweets_Cart', JSON.stringify(cartArray));
        updateCartBadge();
    } catch (e) {
        if (window.BoseMonitor) window.BoseMonitor.report(e, 'cart-system.js', null, null, 'saveCartData');
    }
}
window.saveCartData = saveCartData;

/**
 * 👑 دالة إضافة المنتجات مع كميتها المختارة من الواجهة
 */
export function addWithQtyContext(btnElement, productId) {
    try {
        const cardEl = document.getElementById(`product-card-${productId}`);
        let qty = 1;
        if (cardEl) {
            const qtySpan = cardEl.querySelector('.temp-qty-display');
            if (qtySpan) qty = parseInt(qtySpan.innerText) || 1;
        }
        
        // البحث عن المنتج في الكتالوج العام الحقيقي أو المحلي الاحتياطي
        const allProducts = window.catalog || [];
        const product = allProducts.find(p => String(p.id) === String(productId));
        
        if (!product) {
            if (typeof window.showSystemToast === 'function') {
                window.showSystemToast('تعذر العثور على بيانات الصنف، جاري تحديث الصفحة.', 'error');
            }
            return;
        }

        let cart = getCartData();
        const existingItem = cart.find(item => String(item.id) === String(productId));

        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                size: product.size || 'قطعة',
                category: product.category,
                img: product.img || '',
                quantity: qty
            });
        }

        saveCartData(cart);
        
        if (typeof window.showSystemToast === 'function') {
            window.showSystemToast(`👑 تم إضافة ${qty} من (${product.name}) بنجاح لحقيبتك.`, 'success');
        }
        
        // إعادة تعيين العداد بالكرت إلى 1 بعد الإضافة الناجحة
        if (cardEl) {
            const qtySpan = cardEl.querySelector('.temp-qty-display');
            if (qtySpan) qtySpan.innerText = "1";
        }
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'cart-system.js', null, null, 'addWithQtyContext');
    }
}
window.addWithQtyContext = addWithQtyContext;

/**
 * 👑 تحديث الشارة الرقمية العلوية على أيقونة السلة لراحة العميل
 */
export function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    
    const cart = getCartData();
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    
    if (totalItems > 0) {
        badge.innerText = totalItems;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}
window.updateCartBadge = updateCartBadge;

/**
 * 👑 تعبئة خيارات التوصيل ديناميكياً بأسعار شحن الفرافرة
 */
function populateShippingZones() {
    const zoneSelect = document.getElementById('delivery-zone');
    if (!zoneSelect) return;
    
    let optionsHtml = '<option value="" data-fee="0" disabled selected>اختر منطقة التوصيل الرسمية...</option>';
    shippingZones.forEach(zone => {
        optionsHtml += `<option value="${zone.name}" data-fee="${zone.fee}">${zone.name} (+${zone.fee} ج.م)</option>`;
    });
    zoneSelect.innerHTML = optionsHtml;
    
    zoneSelect.addEventListener('change', () => {
        if (typeof calculateOrderTotal === 'function') calculateOrderTotal();
    });
}

/**
 * 👑 رسم وتحديث مكونات صفحة السلة وجدول المشتريات
 */
export function renderCartPage() {
    const container = document.getElementById('cart-items-list');
    const summaryContainer = document.getElementById('cart-summary-box');
    if (!container) return;

    const cart = getCartData();

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 10px;">
                <p style="font-weight: 700; opacity: 0.6; margin-bottom: 20px;">حقيبة المشتريات فارغة حالياً.. تصفح المنيو واحجز طلبك الآن ✨</p>
                <a href="menu.html" class="btn-primary" style="display: inline-block; text-decoration: none;">الانتقال للمنيو الملكي</a>
            </div>
        `;
        if (summaryContainer) summaryContainer.style.display = 'none';
        return;
    }

    if (summaryContainer) summaryContainer.style.display = 'block';

    let html = '';
    cart.forEach(item => {
        let finalImg = item.img || 'v1712586716/logo_bose_gold.jpg';
        if (!finalImg.startsWith('http') && !finalImg.startsWith('https')) {
            finalImg = `${boseConfig.cloudinary.baseDeliveryUrl}${finalImg}`;
        }

        html += `
        <div class="flex items-center justify-between p-4 mb-3" style="background: ${boseConfig.branding.colors.white}; border: 1px solid rgba(255,145,164,0.15); border-radius: 12px; gap: 15px;">
            <img src="${finalImg}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(255,145,164,0.1);" alt="${item.name}">
            
            <div class="flex-1">
                <h4 class="font-black text-sm" style="color: ${boseConfig.branding.colors.dark}; margin:0;">${item.name}</h4>
                <p class="text-xs opacity-70" style="margin:2px 0;">الحجم/النوع: ${item.size}</p>
                <div class="font-bold text-xs" style="color: ${boseConfig.branding.colors.pink};">${item.price} ج.م</div>
            </div>

            <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 bg-gray-50 rounded-full p-0.5 border border-pink-100">
                    <button onclick="updateCartItemQty('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-black" style="color: ${boseConfig.branding.colors.pink}; border:1px solid #eee;">-</button>
                    <span class="font-black text-xs px-1" style="color: ${boseConfig.branding.colors.dark}; min-w:15px; text-align:center;">${item.quantity}</span>
                    <button onclick="updateCartItemQty('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-black" style="color: ${boseConfig.branding.colors.pink}; border:1px solid #eee;">+</button>
                </div>
                
                <button onclick="removeCartItem('${item.id}')" style="background: transparent; border: none; color: #ff4d4d; cursor: pointer; padding: 5px;" aria-label="حذف الصنف">
                    💔
                </button>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
    calculateOrderTotal();
}
window.renderCartPage = renderCartPage;

/**
 * 👑 تحديث الكمية داخل صفحة السلة وإعادة حساب الأسعار
 */
export function updateCartItemQty(productId, delta) {
    let cart = getCartData();
    const item = cart.find(i => String(i.id) === String(productId));
    if (!item) return;

    item.quantity = parseInt(item.quantity) + delta;
    if (item.quantity < 1) {
        cart = cart.filter(i => String(i.id) !== String(productId));
    }
    
    saveCartData(cart);
    renderCartPage();
}
window.updateCartItemQty = updateCartItemQty;

/**
 * 👑 حذف صنف تماماً من السلة
 */
export function removeCartItem(productId) {
    let cart = getCartData();
    cart = cart.filter(i => String(i.id) !== String(productId));
    saveCartData(cart);
    renderCartPage();
}
window.removeCartItem = removeCartItem;

/**
 * 👑 حساب الإجماليات بدقة متناهية متضمناً شحن الفرافرة
 */
export function calculateOrderTotal() {
    const cart = getCartData();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let shippingFee = 0;
    const deliveryModeEl = document.querySelector('input[name="delivery-mode"]:checked');
    const zoneSelect = document.getElementById('delivery-zone');
    
    if (deliveryModeEl && deliveryModeEl.value === 'home' && zoneSelect) {
        const selectedOption = zoneSelect.options[zoneSelect.selectedIndex];
        if (selectedOption && selectedOption.value !== "") {
            shippingFee = parseInt(selectedOption.getAttribute('data-fee')) || 0;
        }
    }

    const total = subtotal + shippingFee;

    // تحديث عناصر العرض بالـ HTML إن وُجدت
    const subtotalEl = document.getElementById('summary-subtotal');
    const shippingEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');

    if (subtotalEl) subtotalEl.innerText = `${subtotal} ج.م`;
    if (shippingEl) shippingEl.innerText = shippingFee > 0 ? `${shippingFee} ج.م` : `0 ج.م`;
    if (totalEl) totalEl.innerText = `${total} ج.م`;

    return { subtotal, shippingFee, total };
}
window.calculateOrderTotal = calculateOrderTotal;

/**
 * 👑 معالجة إرسال الطلب وصياغة الرسالة الرسمية للواتساب
 */
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const cart = getCartData();
    if (cart.length === 0) {
        if (typeof window.showSystemToast === 'function') window.showSystemToast('حقيبتك فارغة، لا يمكن إتمام الطلب.', 'error');
        return;
    }

    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const date = document.getElementById('delivery-date').value;
    const time = document.getElementById('delivery-time').value;
    const notes = document.getElementById('order-notes').value.trim();
    
    const deliveryModeEl = document.querySelector('input[name="delivery-mode"]:checked');
    const deliveryMode = deliveryModeEl ? deliveryModeEl.value : 'pickup';

    if (!name || !phone || !date || !time) {
        if (typeof window.showSystemToast === 'function') window.showSystemToast('يرجى ملء جميع الحقول الأساسية لتأكيد الحجز.', 'error');
        return;
    }

    let locationDetails = '';
    if (deliveryMode === 'home') {
        const zone = document.getElementById('delivery-zone').value;
        const address = document.getElementById('detailed-address').value.trim();
        const altPhone = document.getElementById('alt-phone').value.trim();
        
        if (!zone || !address) {
            if (typeof window.showSystemToast === 'function') window.showSystemToast('يرجى اختيار منطقة الشحن وكتابة العنوان التفصيلي بدقة.', 'error');
            return;
        }
        locationDetails = `📍 نوع الطلب: توصيل للمنزل\nالمنطقة: ${zone}\nالعنوان: ${address}${altPhone ? `\nرقم هاتف بديل: ${altPhone}` : ''}`;
    } else {
        locationDetails = `🏬 نوع الطلب: استلام من مقر البراند\nالموقع الفرعي: (الكفاح، شارع الوحدة المحلية، بجوار صيدلية د. أحمد مجدي)`;
    }

    // 👑 بناء النص المهني لرسالة الإدارة المرجعية لعلامة حلويات بوسي
    let message = `👑 طلب حجز جديد - حلويات بوسي 👑\n\n`;
    message += `👤 بيانات العميل الراقية:\nالاسم: ${name}\nرقم الاتصال: ${phone}\n\n`;
    message += `${locationDetails}\n\n`;
    message += `🕒 الموعد المطلوب المعتمد:\nالتاريخ: ${date}\nالوقت: ${time}\n\n`;
    message += `🛍️ تفاصيل المشتريات الفاخرة:\n`;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        message += `${index + 1}. ${item.name} [${item.size}] | العدد: ${item.quantity} | القيمة: ${itemTotal} ج.م\n`;
    });

    const totals = calculateOrderTotal();
    message += `\n💰 الإجماليات المالية الدقيقة:\n`;
    message += `- قيمة المنتجات الصافية: ${totals.subtotal} ج.م\n`;
    message += `- مصاريف شحن المنطقة: ${totals.shippingFee} ج.م\n`;
    message += `🔹 الإجمالي الكلي للطلب: ${totals.total} ج.م\n`;

    if (notes) {
        message += `\n📝 ملاحظات وتنسيقات مخصصة من العميل:\n"${notes}"\n`;
    }
    
    message += `\nيرجى مراجعة الجدول الزمني وتأكيد الحجز والإفادة بالقبول الفوري للإدارة المرجعية.`;

    // المزامنة اللحظية مع الفايربيز لحفظ الطلب في الخزنة السحابية قبل التوجيه للواتساب
    if (boseConfig.network && boseConfig.network.safeWrite) {
        const orderId = 'order_' + Date.now();
        await boseConfig.network.safeWrite('orders', orderId, {
            id: orderId,
            customerName: name,
            customerPhone: phone,
            deliveryDate: date,
            deliveryTime: time,
            deliveryMode: deliveryMode,
            itemsArray: cart,
            subtotal: totals.subtotal,
            shippingFee: totals.shippingFee,
            total: totals.total,
            status: 'pending',
            timestamp: Date.now()
        });
    }

    // تفريغ السلة وتوجيه العميل مباشرة إلى الواتساب الرسمي المعتمد
    localStorage.removeItem('BoseSweets_Cart');
    updateCartBadge();
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}
