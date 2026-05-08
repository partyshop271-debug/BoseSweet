// منظومة السلة والعمليات الحسابية السيادية
import { state, catalogMap, catalog, siteSettings, shippingZones, cakeState } from './state.js';
import { ClientStorageEngine } from './storage.js';
import { MemoryManager, showSystemToast, generateSecureOrderId, generateUniqueID } from './utils.js';

// تهيئة الاتصال بقاعدة البيانات لضمان تمرير الفواتير بسلامة
const db = window.db || (typeof window !== 'undefined' && window.firebase ? window.firebase.firestore() : undefined);

export function saveCartToStorage() { 
    try { 
        ClientStorageEngine.set('cart', state.cart); 
        localStorage.setItem('boseSweets_cart_data', JSON.stringify(state.cart)); 
        localStorage.setItem('boseSweets_secured_cart', JSON.stringify(state.cart)); 
    } catch (e) {} 
}

export function clearCartStorage() { 
    try { 
        ClientStorageEngine.remove('cart');
        localStorage.removeItem('boseSweets_cart_data'); 
        localStorage.removeItem('boseSweets_secured_cart');
    } catch (e) {} 
}

export function calculateCartTotal() {
    let sub = 0; state.cart.forEach(i => sub += (Number(i.price) * Number(i.quantity)));
    let shipFee = 0; const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
    if (deliveryMethod === 'delivery') { const areaSelect = document.getElementById('cust-area'); if(areaSelect && areaSelect.value) { const zone = shippingZones.find(z => String(z.id) === String(areaSelect.value)); if(zone) shipFee = Number(zone.fee); } }
    state.currentShippingFee = shipFee;
    if(document.getElementById('cart-subtotal-text')) document.getElementById('cart-subtotal-text').innerText = sub + ' ج.م';
    if(document.getElementById('cart-shipping-text')) document.getElementById('cart-shipping-text').innerText = (shipFee > 0 ? '+' + shipFee : '0') + ' ج.م';
    if(document.getElementById('cart-total-text')) document.getElementById('cart-total-text').innerText = (sub + shipFee) + ' ج.م';
}

export function syncCartUI() {
    const b = document.getElementById('cart-count-badge');
    const totalCount = state.cart.reduce((s, i) => s + Number(i.quantity), 0);
    if (b) {
        if (totalCount > 0) { b.innerText = totalCount; b.classList.remove('hidden'); } else { b.classList.add('hidden'); }
    }
    if(window.renderCartList) window.renderCartList(); calculateCartTotal();
}

export function updateTempQtyContext(buttonElement, delta) {
    const container = buttonElement.closest('.quantity-controls');
    if(container) {
        const el = container.querySelector('.temp-qty-display');
        if(el) {
            let val = parseInt(el.innerText.replace(/[^0-9]/g, '')) + delta;
            if(val < 1) val = 1; if(val > 50) val = 50;
            el.innerText = val; 
        }
    }
}

export function addWithQtyContext(buttonElement, id) {
    let qty = 1; 
    const cardElement = buttonElement.closest('.product-card-premium') || buttonElement.closest('.bg-white.flex.flex-col') || buttonElement.closest('.group');
    if(cardElement) {
        const qtyEl = cardElement.querySelector('.temp-qty-display');
        if(qtyEl) qty = parseInt(qtyEl.innerText) || 1;
    }

    const safeId = String(id); const prod = catalogMap.get(safeId) || catalog.find(p => String(p.id) === safeId); 
    if (!prod) return;
    
    if (prod.inStock === false) { 
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
        showSystemToast('نأسف لحضرتك، هذا المنتج غير متوفر حالياً لتلبية الطلب.', 'error'); 
        return; 
    }
    
    if(navigator.vibrate) navigator.vibrate(50);
    
    const exist = state.cart.find(i => String(i.id) === safeId && !i.isCustom);
    if (exist) { exist.quantity = Number(exist.quantity) + qty; } 
    else { const newCartItem = JSON.parse(JSON.stringify(prod)); newCartItem.quantity = qty; newCartItem.cartItemId = generateUniqueID(); state.cart.push(newCartItem); }
    
    saveCartToStorage(); syncCartUI(); calculateCartTotal(); 
    
    if(cardElement) {
        const qtyEl = cardElement.querySelector('.temp-qty-display');
        if(qtyEl) qtyEl.innerText = '1';
    }
    
    const cartBtn = document.querySelector('button[onclick="toggleCart(true)"]');
    if(cartBtn) { cartBtn.classList.add('scale-110'); setTimeout(() => cartBtn.classList.remove('scale-110'), 200); }
    
    showSystemToast(`تم إضافة الكمية (${qty}) بنجاح لقائمة المشتريات 🛍️`, 'success');
    if(window.renderSmartSuggestions) {
        window.renderSmartSuggestions('main');
        window.renderSmartSuggestions('cart');
    }
}

export function modQ(cartId, d) {
    const safeCartId = String(cartId); 
    const it = state.cart.find(x => String(x.cartItemId) === safeCartId || String(x.id) === safeCartId);
    if (it) { 
        if (d === 'remove') state.cart = state.cart.filter(x => String(x.cartItemId) !== safeCartId && String(x.id) !== safeCartId);
        else { it.quantity = Number(it.quantity) + Number(d); if (it.quantity < 1) it.quantity = 1; }
    }
    saveCartToStorage(); syncCartUI(); calculateCartTotal();
    if(window.renderSmartSuggestions) {
        window.renderSmartSuggestions('main');
        window.renderSmartSuggestions('cart');
    }
}

export function commitCakeBuilderToCart() {
    const basePrice = siteSettings.cakeBuilder.basePrice || 145;
    let printingPrice = 0;
    if (cakeState.printing === 'صورة قابلة للأكل') printingPrice = siteSettings.cakeBuilder.imagePrintingPrice || 60;
    else if (cakeState.printing === 'صورة غير قابلة للأكل') printingPrice = 20;
    const cardPrice = cakeState.hasCard ? 40 : 0;
    
    const finalPrice = (cakeState.persons * basePrice) + printingPrice + cardPrice;
    
    let detailsString = `النوع: ${cakeState.flavor} (${cakeState.shape}) | الحجم: ${cakeState.persons} أفراد | التصميم: ${cakeState.designStyle} | الصورة: ${cakeState.printing}`;
    if (cakeState.occasion) detailsString += ` | المناسبة: ${cakeState.occasion}`;
    if (cakeState.hasCard) detailsString += ` | كارت إهداء: نعم (${cakeState.cardText || 'لم يُكتب نص'})`;
    if (cakeState.allergies) detailsString += ` | 🚨 موانع صحية: ${cakeState.allergies}`;
    if (cakeState.notes && cakeState.notes.trim() !== '') detailsString += ` | ملاحظات للتنفيذ: ${cakeState.notes.trim()}`;
    
    const uniqueCustomId = 'cb_' + Date.now();
    const customCakeItem = {
        id: uniqueCustomId,
        cartItemId: uniqueCustomId,
        name: 'تورتة الإصدار الملكي المخصص',
        category: 'تورت',
        price: finalPrice,
        quantity: 1,
        desc: detailsString,
        isCustom: true,
        img: cakeState.refImage || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg'
    };
    
    state.cart.push(customCakeItem);
    saveCartToStorage();
    syncCartUI();
    
    cakeState.flavor = 'فانيليا'; cakeState.shape = 'دائري'; cakeState.persons = 4; cakeState.printing = 'بدون'; cakeState.notes = ''; cakeState.refImage = null; cakeState.allergies = ''; cakeState.hasCard = false; cakeState.cardText = ''; cakeState.occasion = ''; cakeState.designStyle = 'تصميم محدد';
    
    if (window.toggleCart) window.toggleCart(true);
    if (window.showMenuView) window.showMenuView();
    
    showSystemToast('تمت هندسة واعتماد التورتة المخصصة وإدراجها بالسلة بنجاح 👑', 'success');
}

export async function submitOrderFinal() {
    if (state.cart.length === 0) return;
    
    let outOfStockItems = [];
    for (let item of state.cart) {
        if (item.isCustom) continue;
        const freshProd = catalogMap.get(String(item.id)) || catalog.find(p => String(p.id) === String(item.id));
        if (freshProd && freshProd.inStock === false) outOfStockItems.push(item.name);
    }
    
    if (outOfStockItems.length > 0) {
        showSystemToast(`نعتذر، المنتجات التالية غير متوفرة حالياً: ${outOfStockItems.join('، ')}. يرجى تحديث القائمة للاستمرار.`, 'error');
        return;
    }

    const cName = document.getElementById('cust-name') ? document.getElementById('cust-name').value.trim() : ''; 
    const cPhone = document.getElementById('cust-phone') ? document.getElementById('cust-phone').value.trim() : '';
    const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
    const cArea = document.getElementById('cust-area') ? document.getElementById('cust-area').options[document.getElementById('cust-area').selectedIndex]?.text : '';
    const cAddress = document.getElementById('cust-address') ? document.getElementById('cust-address').value.trim() : '';
    const cDate = document.getElementById('cust-date') ? document.getElementById('cust-date').value : '';
    const cTime = document.getElementById('cust-time') ? document.getElementById('cust-time').value : '';
    const cNotes = document.getElementById('cust-notes') ? document.getElementById('cust-notes').value.trim() : '';
    
    if (!document.getElementById('cust-name')) {
        return dispatchWhatsAppOrder();
    }

    if (!cName || !cPhone) { 
        showSystemToast('قرار إداري: يرجى إكمال بيانات الاسم ورقم التواصل لاعتماد الطلب.', 'error'); 
        return; 
    }
    
    if (deliveryMethod === 'delivery' && (!cArea || !cAddress)) { 
        showSystemToast('قرار إداري: يرجى تحديد المنطقة والعنوان التفصيلي للتوصيل.', 'error'); 
        return; 
    }

    if (!cDate || !cTime) {
        showSystemToast('قرار إداري: يرجى تحديد يوم وساعة الاستلام المطلوبة.', 'error'); 
        return; 
    }

    const btn = document.querySelector('button[onclick="submitOrderFinal()"]');
    let originalBtnHtml = '';
    if(btn) {
        originalBtnHtml = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i> جاري معالجة الطلب...`; 
        btn.disabled = true; 
        if(window.lucide) lucide.createIcons();
    }

    const orderId = generateSecureOrderId(); 
    let subtotal = 0;
    state.cart.forEach(item => {
        if (!item.isCustom) {
            const trueProd = catalogMap.get(String(item.id)) || catalog.find(p => String(p.id) === String(item.id));
            if (trueProd && trueProd.price) { item.price = Number(trueProd.price); }
        }
        subtotal += (Number(item.price) * Number(item.quantity));
    });
    
    let shipFee = 0;
    if(deliveryMethod === 'delivery' && document.getElementById('cust-area')) {
        const areaVal = document.getElementById('cust-area').value;
        const zone = shippingZones.find(z => String(z.id) === String(areaVal));
        if(zone) shipFee = Number(zone.fee);
    }
    const finalTotal = subtotal + shipFee;

    let m = `*أمر توريد منتجات فاخرة - حلويات بوسي* 👑\n*الرقم المرجعي الموثق:* ${orderId}\n`;
    m += `-------------------------------------------\n`;
    m += `👤 العميل: ${cName}\n📞 الهاتف: ${cPhone}\n`;
    if(deliveryMethod === 'pickup') m += `🛵 وسيلة الحصول: استلام مباشر من الفرع\n`;
    else m += `🛵 وسيلة التوصيل: ${cArea} - ${cAddress}\n`;
    
    m += `📅 موعد الاستلام: ${cDate} الساعة ${cTime}\n`;
    m += `\n*بيان الأصناف والكميات المحجوزة:*\n`;
    state.cart.forEach((i, idx) => {
        const cost = i.price * i.quantity;
        m += `${idx + 1}. *${i.name}*\n`;
        m += `   - التخصيص: ${i.desc || 'صنف قياسي بالمنيو'}\n`;
        m += `   - الكمية: ${i.quantity} × السعر: ${i.price} ج ⬅️ الحساب: ${cost} ج.م\n\n`;
    });
    m += `-------------------------------------------\n`;
    if(shipFee > 0) m += `رسوم التوصيل: ${shipFee} ج.م\n`;
    m += `*الإجمالي المالي للطلب:* ${finalTotal} ج.م\n`;
    if(cNotes) m += `\n*ملاحظات للتنفيذ:* ${cNotes}\n`;
    m += `\nتنويه للإدارة: الطلب موجه تلقائياً من المنصة الرسمية، يرجى مراجعة الخزنة واعتماد التجهيز الفوري.`;

    const storePhone = siteSettings.footerPhone || '201097238441';
    let cleanPhone = storePhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(m)}`, '_blank');
    
    const orderData = { id: orderId, name: cName, phone: cPhone, area: deliveryMethod === 'pickup' ? 'استلام من الفرع' : cArea, address: cAddress, deliveryMethod: deliveryMethod, pickupDate: cDate, pickupTime: cTime, notes: cNotes, itemsArray: state.cart, subtotal: subtotal, shippingFee: shipFee, total: finalTotal, status: 'pending', timestamp: Date.now(), date: new Date().toLocaleString('ar-EG') };

    try {
        if(navigator.onLine && typeof db !== 'undefined') { db.collection('orders').doc(String(orderId)).set(orderData).catch(e => { ClientStorageEngine.queueOrder(orderData); }); } 
        else { throw new Error("Offline"); }
    } catch(e) { ClientStorageEngine.queueOrder(orderData); }

    state.cart.length = 0; 
    clearCartStorage(); syncCartUI(); 
    if (window.toggleCart) window.toggleCart(false); 
    if(window.showHomeView) window.showHomeView();
    else if(window.switchToMenuView) window.switchToMenuView();
    else if(window.renderMainDisplay) window.renderMainDisplay();
    
    showSystemToast('تم اعتماد الطلب مهنياً وتمريره لمركز العمليات. نشكر ثقتكم!', 'success');

    if(btn) {
        btn.innerHTML = originalBtnHtml; 
        btn.disabled = false;
        if(window.lucide) lucide.createIcons();
    }
}

export function dispatchWhatsAppOrder() {
    if (state.cart.length === 0) return;
    
    const referenceId = 'BS-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random()*100).toString();
    let subtotal = 0;
    
    let orderMessage = `*أمر توريد منتجات فاخرة - حلويات بوسي* 👑\n`;
    orderMessage += `*الرقم المرجعي الموثق:* ${referenceId}\n`;
    orderMessage += `-------------------------------------------\n\n`;
    orderMessage += `*بيان الأصناف والكميات المحجوزة:*\n`;
    
    state.cart.forEach((item, index) => {
        const cost = item.price * item.quantity;
        subtotal += cost;
        orderMessage += `${index + 1}. *${item.name}*\n`;
        orderMessage += `   - التخصيص: ${item.desc || 'صنف قياسي بالمنيو'}\n`;
        orderMessage += `   - الكمية: ${item.quantity} × السعر: ${item.price} ج ⬅️ الحساب: ${cost} ج.م\n\n`;
    });
    
    orderMessage += `-------------------------------------------\n`;
    orderMessage += `*الإجمالي المالي للطلب:* ${subtotal} ج.م\n\n`;
    orderMessage += `تنويه للإدارة: الطلب موجه تلقائياً من المنصة الرسمية، يرجى مراجعة الخزنة واعتماد حالة التجهيز الفوري.`;
    
    const storePhone = siteSettings.footerPhone || '201097238441';
    let cleanPhone = storePhone.replace(/\D/g, '');
    const finalTargetPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    
    window.open(`https://wa.me/${finalTargetPhone}?text=${encodeURIComponent(orderMessage)}`, '_blank');
    
    state.cart.length = 0;
    saveCartToStorage();
    syncCartUI();
    if(window.toggleCartSidebar) window.toggleCartSidebar(false);
    if(window.showHomeView) window.showHomeView();
    
    showSystemToast('تم اعتماد المعاملة وتمرير بيانات الفاتورة لمركز العمليات بنجاح 👑', 'success');
}

export function processBoseSweetsOrder(id, name, price) {
    let currentCart = JSON.parse(localStorage.getItem('boseSweetsCartData')) || [];
    let existingItem = currentCart.find(item => item.id === id || item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentCart.push({ id: id, name: name, price: price, quantity: 1 });
    }
    
    localStorage.setItem('boseSweetsCartData', JSON.stringify(currentCart));
    updateCartDisplay();
}

export function updateCartDisplay() {
    let currentCart = JSON.parse(localStorage.getItem('boseSweetsCartData')) || [];
    let totalItems = currentCart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCounters = document.querySelectorAll('.cart-counter, .cart-badge');
    cartCounters.forEach(counter => {
        counter.innerText = totalItems;
        counter.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}