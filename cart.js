// منظومة السلة والعمليات الحسابية السيادية - براند حلويات بوسي
import { state, catalogMap, catalog, siteSettings, shippingZones, cakeState } from './state.js';
import { ClientStorageEngine } from './storage.js';
import { MemoryManager, showSystemToast, generateSecureOrderId, generateUniqueID } from './utils.js';

// تهيئة الاتصال بقاعدة البيانات لضمان تمرير الفواتير بسلامة في حالة التوفر
const db = window.db || (typeof window !== 'undefined' && window.firebase ? window.firebase.firestore() : undefined);

/**
 * 👑 هندسة التخزين المزدوج: حفظ السلة في الخزنة الموحدة مع تأمين نسخة احتياطية
 */
export function saveCartToStorage() { 
    try { 
        if (ClientStorageEngine && typeof ClientStorageEngine.set === 'function') {
            ClientStorageEngine.set('cart', state.cart); 
        }
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('boseSweets_cart_data', JSON.stringify(state.cart)); 
            localStorage.setItem('boseSweets_secured_cart', JSON.stringify(state.cart)); 
        }
    } catch (e) {
        if(window.BoseMonitor) window.BoseMonitor.report(e, 'cart.js', null, null, 'saveCartToStorage');
        console.warn('تنويه نظام حلويات بوسي: تعذر الحفظ السحابي للسلة، تم الاعتماد على الذاكرة الحية.');
    } 
}

/**
 * تفريغ السلة برمجياً وتطهير كافة المسارات الاحتياطية
 */
export function clearCartStorage() { 
    try { 
        if (ClientStorageEngine && typeof ClientStorageEngine.remove === 'function') {
            ClientStorageEngine.remove('cart');
        }
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('boseSweets_cart_data'); 
            localStorage.removeItem('boseSweets_secured_cart');
        }
    } catch (e) {
        if(window.BoseMonitor) window.BoseMonitor.report(e, 'cart.js', null, null, 'clearCartStorage');
    } 
}

/**
 * 👑 المحرك الحسابي السيادي: حساب الإجماليات بدقة شاملة (رسوم توصيل، خصومات، وتحديث الواجهة)
 */
export function calculateCartTotal() {
    try {
        let sub = 0; 
        state.cart.forEach(i => {
            // حماية ضد القيم غير الرقمية
            const price = Number(i.price) || 0;
            const qty = Number(i.quantity) || 1;
            sub += (price * qty);
        });
        
        let shipFee = 0; 
        let deliveryMethod = 'delivery';
        
        if (typeof document !== 'undefined') {
            const methodInput = document.querySelector('input[name="delivery_method"]:checked');
            if (methodInput) deliveryMethod = methodInput.value;
        }

        // مطابقة رسوم التوصيل بناءً على الـ ID أو الـ Name لضمان التوافق المطلق مع جميع إصدارات الواجهة
        if (deliveryMethod === 'delivery' && typeof document !== 'undefined') { 
            const areaSelect = document.getElementById('cust-area'); 
            if (areaSelect && areaSelect.value) {
                const areaVal = String(areaSelect.value).trim();
                const zone = shippingZones.find(z => String(z.id) === areaVal || String(z.name) === areaVal);
                if (zone) shipFee = Number(zone.fee) || 0;
            }
        }
        
        state.currentShippingFee = shipFee;
        
        let discount = 0;
        let total = sub + shipFee;
        
        // تطبيق نظام الخصومات (Promo Codes) إن وجد
        const appliedPromo = state.appliedPromo;
        if (appliedPromo && Number(appliedPromo.discount) > 0) {
            discount = (sub * (Number(appliedPromo.discount) / 100));
            total = (sub - discount) + shipFee;
        }
        
        // تحديث الواجهة مباشرة إن كانت العناصر متاحة لتجنب أخطاء المتصفح (Safe DOM Update)
        if (typeof document !== 'undefined') {
            const subEl = document.getElementById('cart-subtotal-text');
            const shipEl = document.getElementById('cart-shipping-text');
            const totEl = document.getElementById('cart-total-text');
            
            if (subEl) subEl.innerText = `${sub} ج.م`;
            if (shipEl) shipEl.innerText = `${shipFee > 0 ? '+' + shipFee : '0'} ج.م`;
            if (totEl) totEl.innerText = `${Math.max(0, total)} ج.م`; // منع ظهور قيم سالبة
        }
        
        return { sub, shipFee, discount, total: Math.max(0, total) };
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'calculateCartTotal');
        return { sub: 0, shipFee: 0, discount: 0, total: 0 };
    }
}

/**
 * مزامنة الإشعارات والواجهة الخاصة بالعميل برمجياً
 */
export function syncCartUI() {
    try {
        if (typeof document === 'undefined') return;

        const b = document.getElementById('cart-count-badge');
        const totalCount = state.cart.reduce((s, i) => s + Number(i.quantity || 1), 0);
        
        if (b) {
            if (totalCount > 0) { 
                b.innerText = totalCount; 
                b.classList.remove('hidden'); 
            } else { 
                b.classList.add('hidden'); 
            }
        }
        
        if (typeof window.renderCartList === 'function') window.renderCartList(); 
        calculateCartTotal();
        
        // إرسال إشارة للمكونات الأخرى لتحديث نفسها (State Broadcasting)
        window.dispatchEvent(new CustomEvent('BoseSweets_Cart_Updated', { detail: { count: totalCount } }));
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'syncCartUI');
    }
}

/**
 * توافقية الواجهة: تحديث شاشة السلة المركزية
 */
export function updateCartDisplay() {
    try {
        syncCartUI();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'updateCartDisplay');
    }
}

/**
 * إدارة عداد الكميات المؤقت في بطاقات المنتجات
 */
export function updateTempQtyContext(buttonElement, delta) {
    try {
        if (!buttonElement) return;
        const container = buttonElement.closest('.quantity-controls');
        if (container) {
            const el = container.querySelector('.temp-qty-display');
            if (el) {
                let val = parseInt(el.innerText.replace(/[^0-9]/g, '')) || 1;
                val += delta;
                if (val < 1) val = 1; 
                if (val > 50) val = 50; // الحد الأقصى للطلبيات التجارية العادية
                el.innerText = val; 
            }
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'updateTempQtyContext');
    }
}

/**
 * 👑 إضافة منتج مع مراعاة الكمية المحددة مسبقاً في الواجهة (استنساخ عميق وحماية للمخزون)
 */
export function addWithQtyContext(buttonElement, id) {
    try {
        let qty = 1; 
        let cardElement = null;
        
        if (buttonElement) {
            cardElement = buttonElement.closest('.product-card-premium') || buttonElement.closest('.bg-white.flex.flex-col') || buttonElement.closest('.group');
            if (cardElement) {
                const qtyEl = cardElement.querySelector('.temp-qty-display');
                if (qtyEl) qty = parseInt(qtyEl.innerText) || 1;
            }
        }

        const safeId = String(id); 
        const prod = catalogMap.get(safeId) || catalog.find(p => String(p.id) === safeId); 
        
        if (!prod) {
            showSystemToast('قرار إداري: تعذر جلب بيانات المنتج، يرجى تحديث الصفحة.', 'error');
            return;
        }
        
        if (prod.inStock === false || prod.isActive === false) { 
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
            showSystemToast('نأسف لحضرتك، هذا المنتج غير متوفر حالياً لتلبية الطلب.', 'error'); 
            return; 
        }
        
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
        
        const exist = state.cart.find(i => String(i.id) === safeId && !i.isCustom);
        if (exist) { 
            exist.quantity = Number(exist.quantity) + qty; 
        } else { 
            // 👑 الاستنساخ العميق (Deep Cloning) لضمان عدم تأثر الكتالوج بالتعديلات
            const newCartItem = JSON.parse(JSON.stringify(prod)); 
            newCartItem.quantity = qty; 
            newCartItem.cartItemId = generateUniqueID(); 
            state.cart.push(newCartItem); 
        }
        
        saveCartToStorage(); 
        syncCartUI(); 
        
        // إعادة ضبط عداد البطاقة بعد الإضافة
        if (cardElement) {
            const qtyEl = cardElement.querySelector('.temp-qty-display');
            if (qtyEl) qtyEl.innerText = '1';
        }
        
        // تأثير بصري لأيقونة السلة الرئيسية
        if (typeof document !== 'undefined') {
            const cartBtn = document.querySelector('button[onclick="toggleCart(true)"]') || document.getElementById('main-cart-btn');
            if (cartBtn) { 
                cartBtn.classList.add('scale-110'); 
                setTimeout(() => cartBtn.classList.remove('scale-110'), 200); 
            }
        }
        
        showSystemToast(`تمت إضافة الكمية (${qty}) بنجاح لقائمة المشتريات 🛍️`, 'success');
        
        if (typeof window.renderSmartSuggestions === 'function') {
            window.renderSmartSuggestions('main');
            window.renderSmartSuggestions('cart');
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'addWithQtyContext');
    }
}

/**
 * 👑 إضافة سريعة للمنتج (Fallback & Direct Add) لضمان توافقية جميع الأزرار القديمة
 */
export function processBoseSweetsOrder(id, name, price) {
    try {
        const safeId = String(id);
        const prod = catalogMap.get(safeId) || catalog.find(p => String(p.id) === safeId);

        if (!prod) {
            // في حالة كان المنتج مضافاً عبر عرض خاص أو لم يتم مزامنته بعد في الكتالوج
            const exist = state.cart.find(i => String(i.id) === safeId && !i.isCustom);
            if (exist) {
                exist.quantity = Number(exist.quantity) + 1;
            } else {
                state.cart.push({ id: safeId, name: name, price: Number(price) || 0, quantity: 1, cartItemId: generateUniqueID() });
            }
        } else {
            if (prod.inStock === false || prod.isActive === false) {
                showSystemToast('نأسف لحضرتك، هذا المنتج نفد من المخزون حالياً.', 'error');
                return;
            }
            const exist = state.cart.find(i => String(i.id) === safeId && !i.isCustom);
            if (exist) {
                exist.quantity = Number(exist.quantity) + 1;
            } else {
                const newCartItem = JSON.parse(JSON.stringify(prod));
                newCartItem.quantity = 1;
                newCartItem.cartItemId = generateUniqueID();
                state.cart.push(newCartItem);
            }
        }

        saveCartToStorage();
        syncCartUI();
        showSystemToast(`تمت إضافة (${name}) إلى سلة مشترياتك بنجاح ✨`, 'success');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'processBoseSweetsOrder');
    }
}

/**
 * تعديل أو حذف عنصر من السلة برقم المعرف الفريد
 */
export function modQ(cartId, delta) {
    try {
        const safeCartId = String(cartId); 
        
        if (delta === 'remove') {
            state.cart = state.cart.filter(x => String(x.cartItemId) !== safeCartId && String(x.id) !== safeCartId);
        } else {
            const itemIndex = state.cart.findIndex(i => String(i.cartItemId) === safeCartId || String(i.id) === safeCartId);
            if (itemIndex > -1) {
                state.cart[itemIndex].quantity = Number(state.cart[itemIndex].quantity) + Number(delta);
                if (state.cart[itemIndex].quantity <= 0) {
                    state.cart.splice(itemIndex, 1);
                }
            }
        }
        
        saveCartToStorage(); 
        syncCartUI(); 
        
        if (typeof window.renderSmartSuggestions === 'function') {
            window.renderSmartSuggestions('main');
            window.renderSmartSuggestions('cart');
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'modQ');
    }
}

/**
 * 👑 هندسة التورتة المخصصة (Cake Builder Processor)
 * تحويل اختيارات العميل لمنتج قابل للدفع مع دقة التسعير
 */
export function commitCakeBuilderToCart() {
    try {
        const basePrice = (siteSettings.cakeBuilder && siteSettings.cakeBuilder.basePrice) ? siteSettings.cakeBuilder.basePrice : 145;
        let printingPrice = 0;
        
        if (cakeState.printing === 'صورة قابلة للأكل') {
            printingPrice = (siteSettings.cakeBuilder && siteSettings.cakeBuilder.imagePrintingPrice) ? siteSettings.cakeBuilder.imagePrintingPrice : 60;
        } else if (cakeState.printing === 'صورة غير قابلة للأكل') {
            printingPrice = 20;
        }
        
        const cardPrice = cakeState.hasCard ? 40 : 0;
        const finalPrice = (Number(cakeState.persons || 4) * basePrice) + printingPrice + cardPrice;
        
        let detailsString = `النوع: ${cakeState.flavor || 'فانيليا'} (${cakeState.shape || 'دائري'}) | الحجم: ${cakeState.persons} أفراد | التصميم: ${cakeState.designStyle || 'محدد'} | الصورة: ${cakeState.printing || 'بدون'}`;
        
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
        
        // تصفير هندسة التورتة لبناء تورتة جديدة إن لزم الأمر
        cakeState.flavor = 'فانيليا'; cakeState.shape = 'دائري'; cakeState.persons = 4; cakeState.printing = 'بدون'; cakeState.notes = ''; cakeState.refImage = null; cakeState.allergies = ''; cakeState.hasCard = false; cakeState.cardText = ''; cakeState.occasion = ''; cakeState.designStyle = 'تصميم محدد';
        
        if (typeof window.toggleCart === 'function') window.toggleCart(true);
        if (typeof window.showMenuView === 'function') window.showMenuView();
        
        showSystemToast('تمت هندسة واعتماد التورتة المخصصة وإدراجها بالسلة بنجاح 👑', 'success');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'commitCakeBuilderToCart');
    }
}

/**
 * 👑 المحرك الشامل لاعتماد وإصدار الفواتير (Unified Checkout Engine)
 * يدعم استقبال البيانات ككائن (Object) أو استخراجها برمجياً من الواجهة، مع نظام حماية (Spam Filter)
 */
export async function submitOrderFinal(customerData = null) {
    try {
        if (state.cart.length === 0) {
            showSystemToast('قرار إداري: السلة فارغة، يرجى إضافة منتجات قبل إرسال الطلب.', 'error');
            return;
        }
        
        // نظام الحماية ضد الإرسال المتكرر (Anti-Spam Shield)
        const sysTime = Date.now();
        let orderHistoryTime = null;
        let orderAttempts = 0;
        
        if (typeof window !== 'undefined' && window.localStorage) {
            orderHistoryTime = localStorage.getItem('bose_order_timer');
            orderAttempts = localStorage.getItem('bose_order_attempts') || 0;
            
            if (orderHistoryTime && (sysTime - Number(orderHistoryTime) < 180000)) { // حظر لمدة 3 دقائق
                if (Number(orderAttempts) >= 2) {
                    showSystemToast('قرار إداري: يرجى الانتظار قليلاً قبل إرسال طلب جديد لضمان استقرار الخدمة.', 'error');
                    return;
                }
                localStorage.setItem('bose_order_attempts', Number(orderAttempts) + 1);
            } else {
                localStorage.setItem('bose_order_timer', sysTime);
                localStorage.setItem('bose_order_attempts', 1);
            }
        }
        
        // فحص المخزون الفعلي والنهائي قبل إتمام الفاتورة
        let outOfStockItems = [];
        for (let item of state.cart) {
            if (item.isCustom) continue;
            const freshProd = catalogMap.get(String(item.id)) || catalog.find(p => String(p.id) === String(item.id));
            if (freshProd && (freshProd.inStock === false || freshProd.isActive === false)) {
                outOfStockItems.push(item.name);
            }
        }
        
        if (outOfStockItems.length > 0) {
            showSystemToast(`نعتذر لحضرتك، المنتجات التالية نفدت للتو: ${outOfStockItems.join('، ')}. يرجى تعديل السلة.`, 'error');
            return;
        }

        // استخراج بيانات العميل (ذكاء هجين: من الـ Object أو من الـ DOM)
        let finalCustomerData = {
            name: '', phone: '', area: '', address: '', deliveryMethod: 'delivery', date: '', time: '', notes: ''
        };

        if (customerData && typeof customerData === 'object' && customerData.name) {
            finalCustomerData = { ...finalCustomerData, ...customerData };
        } else if (typeof document !== 'undefined') {
            const cNameEl = document.getElementById('cust-name');
            // إذا لم توجد حقول البيانات، نوجه الطلب مباشرة لمدير الواتساب
            if (!cNameEl) return dispatchWhatsAppOrder();
            
            finalCustomerData.name = cNameEl.value.trim();
            finalCustomerData.phone = document.getElementById('cust-phone') ? document.getElementById('cust-phone').value.trim() : '';
            finalCustomerData.deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
            
            const areaEl = document.getElementById('cust-area');
            finalCustomerData.area = areaEl ? areaEl.options[areaEl.selectedIndex]?.text || areaEl.value : '';
            finalCustomerData.address = document.getElementById('cust-address') ? document.getElementById('cust-address').value.trim() : '';
            
            finalCustomerData.date = document.getElementById('cust-date') ? document.getElementById('cust-date').value : '';
            finalCustomerData.time = document.getElementById('cust-time') ? document.getElementById('cust-time').value : '';
            finalCustomerData.notes = document.getElementById('cust-notes') ? document.getElementById('cust-notes').value.trim() : '';
        }

        // الفحص الإداري لمدخلات العميل
        if (!finalCustomerData.name || !finalCustomerData.phone) { 
            showSystemToast('قرار إداري: يرجى إكمال بيانات الاسم ورقم التواصل لاعتماد الطلب.', 'error'); 
            return; 
        }
        
        if (finalCustomerData.deliveryMethod === 'delivery' && (!finalCustomerData.area || !finalCustomerData.address)) { 
            showSystemToast('قرار إداري: يرجى تحديد المنطقة والعنوان التفصيلي للتوصيل.', 'error'); 
            return; 
        }

        // تجميد زر الإرسال بصرياً لضمان عدم تكرار الضغط
        let btn = null;
        let originalBtnHtml = '';
        if (typeof document !== 'undefined') {
            btn = document.querySelector('button[onclick="submitOrderFinal()"]') || document.getElementById('submit-order-btn');
            if (btn) {
                originalBtnHtml = btn.innerHTML;
                btn.innerHTML = `<i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i> جاري معالجة الفاتورة...`; 
                btn.disabled = true; 
                if (typeof window.lucide !== 'undefined') lucide.createIcons();
            }
        }

        try {
            const orderId = generateSecureOrderId(); 
            const orderTotals = calculateCartTotal();
            
            // بناء رسالة الواتساب الرسمية للبراند
            let m = `*أمر توريد منتجات فاخرة - حلويات بوسي* 👑\n*الرقم المرجعي الموثق:* ${orderId}\n`;
            m += `-------------------------------------------\n`;
            m += `👤 العميل: ${finalCustomerData.name}\n📞 الهاتف: ${finalCustomerData.phone}\n`;
            
            if (finalCustomerData.deliveryMethod === 'pickup') {
                m += `🛵 وسيلة الحصول: استلام مباشر من الفرع\n`;
                finalCustomerData.area = 'استلام من الفرع';
            } else {
                m += `🛵 التوصيل: ${finalCustomerData.area} - ${finalCustomerData.address}\n`;
            }
            
            if (finalCustomerData.date) m += `📅 الموعد: ${finalCustomerData.date} ${finalCustomerData.time ? 'الساعة ' + finalCustomerData.time : ''}\n`;
            m += `\n*بيان الأصناف والكميات:*\n`;
            
            state.cart.forEach((i, idx) => {
                const cost = Number(i.price) * Number(i.quantity);
                m += `${idx + 1}. *${i.category || 'صنف'} | ${i.name}*\n`;
                
                if (i.isCustom) {
                    m += `   - التخصيص: ${i.desc}\n`;
                } else {
                    let details = [];
                    if (i.size) details.push(i.size);
                    if (i.flowerType) details.push(i.flowerType);
                    if (details.length > 0) m += `   - التفاصيل: ${details.join(' - ')}\n`;
                }
                m += `   - الكمية: ${i.quantity} × السعر: ${i.price} ج ⬅️ الإجمالي: ${cost} ج.م\n\n`;
            });
            
            m += `-------------------------------------------\n`;
            if (orderTotals.discount > 0) m += `الخصم المطبق: -${orderTotals.discount} ج.م\n`;
            if (orderTotals.shipFee > 0) m += `رسوم التوصيل: ${orderTotals.shipFee} ج.م\n`;
            m += `*الإجمالي المالي للطلب:* ${orderTotals.total} ج.م\n`;
            if (finalCustomerData.notes) m += `\n*ملاحظات للتنفيذ:* ${finalCustomerData.notes}\n`;
            m += `\nتنويه للإدارة: الطلب موجه تلقائياً من المنصة، يرجى مراجعة الخزنة واعتماده.`;

            // إرسال الإشعار للواتساب الإداري
            const storePhone = siteSettings.footerPhone || '201097238441';
            let cleanPhone = String(storePhone).replace(/\D/g, '');
            if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;

            if (typeof window !== 'undefined') {
                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(m)}`, '_blank');
            }
            
            // بناء الوثيقة لتسجيلها في قواعد البيانات
            const orderDocument = { 
                id: orderId, // لدعم التوافق مع الأنظمة القديمة
                orderId: orderId, 
                name: finalCustomerData.name, 
                customerName: finalCustomerData.name,
                phone: finalCustomerData.phone, 
                customerPhone: finalCustomerData.phone,
                area: finalCustomerData.area, 
                customerArea: finalCustomerData.area,
                address: finalCustomerData.address, 
                customerAddress: finalCustomerData.address,
                deliveryMethod: finalCustomerData.deliveryMethod, 
                pickupDate: finalCustomerData.date, 
                pickupTime: finalCustomerData.time, 
                notes: finalCustomerData.notes, 
                itemsArray: state.cart, 
                items: state.cart,
                subtotal: orderTotals.sub, 
                subTotal: orderTotals.sub,
                shippingFee: orderTotals.shipFee, 
                discount: orderTotals.discount,
                total: orderTotals.total, 
                status: 'pending', 
                timestamp: Date.now(), 
                date: new Date().toLocaleString('ar-EG'),
                isArchived: false,
                deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
            };

            // 👑 التمرير السحابي مع الحماية (Network Delivery Protocol)
            if (typeof window !== 'undefined' && window.NetworkEngine && typeof window.NetworkEngine.safeWrite === 'function') {
                window.NetworkEngine.safeWrite('orders', String(orderId), orderDocument);
            } else if (typeof navigator !== 'undefined' && navigator.onLine && typeof db !== 'undefined' && db) { 
                await db.collection('orders').doc(String(orderId)).set(orderDocument);
            } else {
                // التمرير للخزنة المحلية في حال انقطاع الاتصال (طابور العمليات)
                if (ClientStorageEngine && typeof ClientStorageEngine.enqueueOperation === 'function') {
                    await ClientStorageEngine.enqueueOperation({
                        type: 'CREATE_ORDER', collection: 'orders', docId: orderId, data: orderDocument
                    });
                } else if (ClientStorageEngine && typeof ClientStorageEngine.queueOrder === 'function') {
                    await ClientStorageEngine.queueOrder(orderDocument);
                }
                showSystemToast('قرار إداري: تم حفظ الطلب محلياً وسيتم المزامنة فور استقرار الشبكة 🔄', 'info');
            }

            // إنهاء العمليات وتصفير السلة
            state.cart.length = 0; 
            clearCartStorage(); 
            syncCartUI(); 
            
            if (typeof window !== 'undefined') {
                if (typeof window.toggleCart === 'function') window.toggleCart(false); 
                if (typeof window.showHomeView === 'function') window.showHomeView();
                else if (typeof window.switchToMenuView === 'function') window.switchToMenuView();
                else if (typeof window.renderMainDisplay === 'function') window.renderMainDisplay();
            }
            
            showSystemToast('تم اعتماد الطلب مهنياً وتمريره لمركز العمليات. نشكر ثقتكم!', 'success');
            return orderId;

        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'submitOrderFinal (Transaction Phase)');
            console.error("عطل فني في تسجيل الطلب الموثق:", error);
            showSystemToast('قرار إداري: تعذر إنهاء الفاتورة تقنياً، يرجى المحاولة مرة أخرى.', 'error');
            throw error;
        } finally {
            // فك تجميد الواجهة
            if (btn) {
                btn.innerHTML = originalBtnHtml; 
                btn.disabled = false;
                if (typeof window.lucide !== 'undefined') lucide.createIcons();
            }
        }
    } catch (masterError) {
        if(window.BoseMonitor) window.BoseMonitor.report(masterError, 'cart.js', null, null, 'submitOrderFinal (Master Guard)');
    }
}

/**
 * 👑 الإرسال المباشر للواتساب (تجاوز الإجراءات المعقدة في حالات الطوارئ)
 */
export function dispatchWhatsAppOrder() {
    try {
        if (state.cart.length === 0) return;
        
        const referenceId = 'BS-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 100).toString();
        const orderTotals = calculateCartTotal();
        
        let orderMessage = `*أمر توريد منتجات فاخرة - حلويات بوسي* 👑\n`;
        orderMessage += `*الرقم المرجعي الموثق:* ${referenceId}\n`;
        orderMessage += `-------------------------------------------\n\n`;
        orderMessage += `*بيان الأصناف والكميات المحجوزة:*\n`;
        
        state.cart.forEach((item, index) => {
            const cost = Number(item.price) * Number(item.quantity);
            
            orderMessage += `${index + 1}. *${item.category || 'صنف'} | ${item.name}*\n`;
            
            if (item.isCustom) {
                orderMessage += `   - التخصيص: ${item.desc}\n`;
            } else {
                let details = [];
                if (item.size) details.push(item.size);
                if (item.flowerType) details.push(item.flowerType);
                if (details.length > 0) orderMessage += `   - التفاصيل: ${details.join(' - ')}\n`;
            }
            
            orderMessage += `   - الكمية: ${item.quantity} × السعر: ${item.price} ج ⬅️ الإجمالي: ${cost} ج.م\n\n`;
        });
        
        orderMessage += `-------------------------------------------\n`;
        if (orderTotals.discount > 0) orderMessage += `الخصم المطبق: -${orderTotals.discount} ج.م\n`;
        orderMessage += `*الإجمالي المالي المبدئي:* ${orderTotals.sub - orderTotals.discount} ج.م (غير شامل التوصيل)\n\n`;
        orderMessage += `تنويه للإدارة: الطلب موجه للواتساب مباشرة كطلب سريع، يرجى استيفاء بيانات التوصيل من العميل واعتماد حالة التجهيز.`;
        
        const storePhone = siteSettings.footerPhone || '201097238441';
        let cleanPhone = String(storePhone).replace(/\D/g, '');
        const finalTargetPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
        
        if (typeof window !== 'undefined') {
            window.open(`https://wa.me/${finalTargetPhone}?text=${encodeURIComponent(orderMessage)}`, '_blank');
        }
        
        state.cart.length = 0;
        saveCartToStorage();
        syncCartUI();
        
        if (typeof window !== 'undefined') {
            if (typeof window.toggleCartSidebar === 'function') window.toggleCartSidebar(false);
            if (typeof window.showHomeView === 'function') window.showHomeView();
        }
        
        showSystemToast('تم اعتماد المعاملة وتمرير بيانات الفاتورة لمركز العمليات بنجاح 👑', 'success');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'dispatchWhatsAppOrder');
    }
}

// 👑 الربط السيادي الشامل: إتاحة كافة الوظائف لجميع ملفات الموقع لضمان التوافق التام
try {
    if (typeof window !== 'undefined') {
        window.saveCartToStorage = saveCartToStorage;
        window.clearCartStorage = clearCartStorage;
        window.calculateCartTotal = calculateCartTotal;
        window.syncCartUI = syncCartUI;
        window.updateCartDisplay = updateCartDisplay;
        window.updateTempQtyContext = updateTempQtyContext;
        window.addWithQtyContext = addWithQtyContext;
        window.processBoseSweetsOrder = processBoseSweetsOrder;
        window.modQ = modQ;
        window.commitCakeBuilderToCart = commitCakeBuilderToCart;
        window.submitOrderFinal = submitOrderFinal;
        window.dispatchWhatsAppOrder = dispatchWhatsAppOrder;
    }
} catch (error) {
    if(window.BoseMonitor) window.BoseMonitor.report(error, 'cart.js', null, null, 'Global Object Bindings');
}