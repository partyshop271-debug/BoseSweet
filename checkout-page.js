/**
 * =========================================================
 * Bose Sweets — Checkout Page
 * =========================================================
 * FILE: checkout-page.js
 * PURPOSE:
 * Handle Checkout Form Logic
 * =========================================================
 */

'use strict';

import CartService from './cart-service.js';
import UIEngine from './ui-engine.js';

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getElement(selector) {
    return document.querySelector(selector);
}

function safeSetText(element, value) {
    if (!element) return;
    element.textContent = value;
}

/**
 * =========================================================
 * STATE
 * =========================================================
 */

const state = {
    subtotal: 0,
    shippingCost: 0,
    total: 0
};

const shippingPrices = {
    farafra: 50,
    '13': 70,
    gamaa: 50,
    snaa: 40,
    abubakr: 40,
    abouhol: 30,
    alkefah: 30,
    alamel: 50,
    '17': 70,
    abuhuraira: 140
};

/**
 * =========================================================
 * INIT
 * =========================================================
 */

function initializeCheckoutForm() {
    const form = getElement('#checkout-form');
    const deliveryMethod = getElement('#delivery-method');
    const shippingOptions = getElement('#shipping-options');
    const shippingRegion = getElement('#shipping-region');
    const deliveryDate = getElement('#delivery-date');
    const deliveryTime = getElement('#delivery-time');
    const totalElement = getElement('#checkout-total');

    function updateShipping() {
        const method = deliveryMethod.value;
        if (method === 'shipping') {
            shippingOptions.style.display = 'block';
            state.shippingCost =
                shippingPrices[shippingRegion.value] || 0;
        } else {
            shippingOptions.style.display = 'none';
            state.shippingCost = 0;
        }
        updateTotal();
    }

    function updateTotal() {
        state.subtotal = CartService.getSubtotal();
        state.total = state.subtotal + state.shippingCost;
        safeSetText(totalElement, `${state.total} ج.م`);
    }

    deliveryMethod.addEventListener('change', updateShipping);
    shippingRegion.addEventListener('change', updateShipping);

    // Prevent selecting past date
    const today = new Date();
    today.setDate(today.getDate() + 1); // Minimum 24h later
    deliveryDate.min = today.toISOString().split('T')[0];

    form.addEventListener('submit', e => {
        e.preventDefault();

        const name = getElement('#customer-name').value.trim();
        const phone = getElement('#customer-phone').value.trim();
        const method = deliveryMethod.value;
        const region = shippingRegion.value;
        const date = deliveryDate.value;
        const time = deliveryTime.value;

        if (!name || !phone || !date || !time) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        // Validate Egyptian phone
        if (!/^01[0-9]{9}$/.test(phone)) {
            alert('يرجى إدخال رقم هاتف مصري صالح');
            return;
        }

        const now = new Date();
        const selectedDate = new Date(`${date}T${time}`);
        if (selectedDate <= now) {
            alert('يرجى اختيار تاريخ ووقت صالح للاستلام');
            return;
        }

        // Compose order
        const order = {
            customer: { name, phone },
            delivery: {
                method,
                region: method === 'shipping' ? region : 'pickup',
                date,
                time
            },
            items: CartService.getItems(),
            subtotal: state.subtotal,
            shippingCost: state.shippingCost,
            total: state.total
        };

        // Send order (example via WhatsApp)
        const message = encodeURIComponent(JSON.stringify(order, null, 2));
        window.open(
            `https://wa.me/201097238441?text=${message}`,
            '_blank'
        );

        alert('تم إرسال الطلب بنجاح!');

        CartService.clear();
        UIEngine.updateCartCount();
        form.reset();
        updateTotal();
    });

    // Initialize totals
    updateShipping();
}

/**
 * =========================================================
 * DOM READY
 * =========================================================
 */

document.addEventListener('DOMContentLoaded', initializeCheckoutForm);