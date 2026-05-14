/**
 * ============================================================================
 * 👑 BoseSweets Cart & Checkout Engine | محرك السلة وإتمام الطلبات
 * ============================================================================
 * الإصدار: V1.0
 * الوظيفة: إدارة حالة السلة محلياً، حساب الإجماليات، وتوليد رسالة الواتساب.
 */

// رقم الإدارة المعتمد لاستقبال الطلبات
const BUSINESS_WHATSAPP = "201097238441";

// التهيئة الأولية عند تحميل أي صفحة
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    
    // إذا كنا في صفحة السلة، قم برسم المنتجات
    if (document.getElementById('cart-items-list')) {
        renderCartPage();
    }

    // إذا كنا في صفحة إتمام الطلب، قم بتفعيل زر الواتساب
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
});

/* -------------------------------------------------------------------------- */
/* 1. إدارة بيانات السلة (State Management)                                   */
/* -------------------------------------------------------------------------- */
function getCartData() {
    try {
        const data = localStorage.getItem('BoseSweets_Cart');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Cart retrieval error", e);
        return [];
    }
}

function saveCartData(cartArray) {
    localStorage.setItem('BoseSweets_Cart', JSON.stringify(cartArray));
    updateCartBadge();
}

/* -------------------------------------------------------------------------- */
/* 2. العمليات الأساسية (Add, Remove, Update)                                 */
/* -------------------------------------------------------------------------- */
window.addToCart = function(id, name, size, price, image, quantity = 1) {
    let cart = getCartData();
    
    // البحث إذا كان المنتج بنفس الحجم موجوداً مسبقاً
    const existingIndex = cart.findIndex(item => item.id === id && item.size === size);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ id, name, size, price, image, quantity });
    }
    
    saveCartData(cart);
    
    // إشعار احترافي للعميل
    alert(`تمت إضافة ${name} (${size}) إلى حقيبة المشتريات بنجاح.`);
};

window.updateQuantity = function(index, change) {
    let cart = getCartData();
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1); // حذف المنتج إذا وصلت الكمية لصفر
        }
        saveCartData(cart);
        renderCartPage(); // تحديث الواجهة فوراً
    }
};

window.removeFromCart = function(index) {
    let cart = getCartData();
    cart.splice(index, 1);
    saveCartData(cart);
    renderCartPage();
};

/* -------------------------------------------------------------------------- */
/* 3. تحديث واجهة المستخدم (UI Updates)                                       */
/* -------------------------------------------------------------------------- */
function updateCartBadge() {
    const cart = getCartData();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCount');
    
    if (badge) {
        if (totalItems > 0) {
            badge.innerText = totalItems > 99 ? '+99' : totalItems;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderCartPage() {
    const cart = getCartData();
    const container = document.getElementById('cart-items-list');
    const emptyMsg = document.getElementById('empty-cart-msg');
    
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '';
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        updateOrderSummary(0);
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');
    
    let html = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <div class="cart-item-header">
                    <div>
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-meta">الحجم: ${item.size}</div>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${index})" aria-label="حذف">
                        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>
                
                <div class="cart-item-actions">
                    <div style="display: flex; align-items: center; gap: 15px; background: var(--bg-white); border: 1px solid rgba(255,145,164,0.3); border-radius: 50px; padding: 5px 15px;">
                        <button onclick="updateQuantity(${index}, 1)" style="background: none; border: none; color: var(--primary-pink); cursor: pointer;"><i data-lucide="plus" style="width: 16px;"></i></button>
                        <span style="font-weight: 700;">${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, -1)" style="background: none; border: none; color: var(--primary-pink); cursor: pointer;"><i data-lucide="minus" style="width: 16px;"></i></button>
                    </div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary-pink);">${itemTotal} ج.م</div>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
    lucide.createIcons(); // إعادة تفعيل الأيقونات للعناصر الجديدة
    updateOrderSummary(subtotal);
}

function updateOrderSummary(subtotal) {
    const summaryRows = document.querySelectorAll('.summary-row span:nth-child(2)');
    const totalRow = document.querySelector('.summary-total span:nth-child(2)');
    
    if (summaryRows.length > 0 && totalRow) {
        summaryRows[0].innerText = `${subtotal} ج.م`;
        totalRow.innerText = `${subtotal} ج.م`; // الإجمالي المبدئي بدون التوصيل
    }
}

/* -------------------------------------------------------------------------- */
/* 4. محرك إتمام الطلب والواتساب (Checkout & WhatsApp Generator)              */
/* -------------------------------------------------------------------------- */
function handleCheckoutSubmit(e) {
    e.preventDefault();
    const cart = getCartData();
    
    if (cart.length === 0) {
        alert("حقيبة المشتريات فارغة. الرجاء إضافة منتجات قبل إتمام الطلب.");
        window.location.href = 'menu.html';
        return;
    }

    // تجميع بيانات العميل
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('whatsapp-phone').value.trim();
    const date = document.getElementById('order-date').value;
    const time = document.getElementById('order-time').value;
    
    const deliveryMode = document.querySelector('input[name="deliveryMode"]:checked').value;
    let locationDetails = '';
    
    if (deliveryMode === 'delivery') {
        const zone = document.getElementById('delivery-zone').value;
        const address = document.getElementById('detailed-address').value.trim();
        const altPhone = document.getElementById('alt-phone').value.trim();
        locationDetails = `📍 نوع الطلب: توصيل للمنزل\nالمنطقة: ${zone}\nالعنوان التفصيلي: ${address}\nرقم هاتف بديل: ${altPhone}`;
    } else {
        locationDetails = `🏬 نوع الطلب: استلام من الفرع\n(الكفاح، شارع الوحدة المحلية)`;
    }

    // بناء نص الرسالة الاحترافي
    let message = `مرحباً إدارة حلويات بوسي،\nأرغب في تأكيد طلب جديد:\n\n`;
    message += `👤 بيانات العميل:\nالاسم: ${name}\nرقم الواتساب: ${phone}\n\n`;
    message += `${locationDetails}\n\n`;
    message += `🕒 موعد الاستلام:\nالتاريخ: ${date}\nالوقت: ${time}\n\n`;
    message += `🛍️ تفاصيل الطلب:\n`;
    
    let subtotal = 0;
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        message += `${index + 1}. ${item.name} | الحجم: ${item.size} | الكمية: ${item.quantity} | السعر: ${itemTotal} ج.م\n`;
    });

    message += `\n💰 الإجمالي المبدئي للطلبات: ${subtotal} ج.م`;
    
    if (deliveryMode === 'delivery') {
        message += `\n(يُضاف رسوم التوصيل حسب المنطقة المحددة)`;
    }

    // تفريغ السلة وتوجيه العميل للواتساب
    localStorage.removeItem('BoseSweets_Cart');
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodedMessage}`;
    
    window.location.href = whatsappUrl;
}