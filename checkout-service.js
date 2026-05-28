/**
 * =========================================================
 * Bose Sweets — Checkout Service
 * =========================================================
 * FILE: checkout-service.js
 * PURPOSE:
 * Process Orders Safely
 * =========================================================
 */

'use strict';

import CartService from './cart-service.js';

/**
 * =========================================================
 * SHIPPING
 * =========================================================
 */

const SHIPPING_PRICES = {

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
 * HELPERS
 * =========================================================
 */

function cleanText(value = '') {

    return value
        .trim()
        .replace(/\s+/g, ' ');
}

function isValidEgyptianPhone(phone) {

    return /^01[0-9]{9}$/.test(phone);
}

function getShippingCost(method, region) {

    if (method !== 'shipping') {
        return 0;
    }

    return SHIPPING_PRICES[
        region
    ] || 0;
}

function validateDate(date, time) {

    const now = new Date();

    const selected =
        new Date(`${date}T${time}`);

    return selected > now;
}

/**
 * =========================================================
 * VALIDATE
 * =========================================================
 */

function validateOrder(data) {

    const errors = [];

    /**
     * =============================================
     * NAME
     * =============================================
     */

    if (!data.name) {

        errors.push(
            'الاسم مطلوب'
        );
    }

    /**
     * =============================================
     * PHONE
     * =============================================
     */

    if (
        !isValidEgyptianPhone(
            data.phone
        )
    ) {

        errors.push(
            'رقم الهاتف غير صالح'
        );
    }

    /**
     * =============================================
     * CART
     * =============================================
     */

    const items =
        CartService.getItems();

    if (!items.length) {

        errors.push(
            'السلة فارغة'
        );
    }

    /**
     * =============================================
     * DATE
     * =============================================
     */

    if (
        !validateDate(
            data.date,
            data.time
        )
    ) {

        errors.push(
            'موعد الاستلام غير صالح'
        );
    }

    /**
     * =============================================
     * SHIPPING
     * =============================================
     */

    if (
        data.method === 'shipping' &&
        !data.region
    ) {

        errors.push(
            'المنطقة مطلوبة'
        );
    }

    return errors;
}

/**
 * =========================================================
 * BUILD ORDER
 * =========================================================
 */

function buildOrder(data) {

    const items =
        CartService.getItems();

    const subtotal =
        CartService.getSubtotal();

    const shippingCost =
        getShippingCost(
            data.method,
            data.region
        );

    const total =
        subtotal + shippingCost;

    return {

        customer: {

            name:
                cleanText(data.name),

            phone:
                cleanText(data.phone)
        },

        delivery: {

            method:
                data.method,

            region:
                data.region || null,

            date:
                data.date,

            time:
                data.time
        },

        items,

        subtotal,

        shippingCost,

        total,

        createdAt:
            new Date().toISOString()
    };
}

/**
 * =========================================================
 * PROCESS
 * =========================================================
 */

function processOrder(data) {

    const errors =
        validateOrder(data);

    if (errors.length) {

        return {

            success: false,

            errors
        };
    }

    const order =
        buildOrder(data);

    return {

        success: true,

        order
    };
}

/**
 * =========================================================
 * EXPORT
 * =========================================================
 */

const CheckoutService = {

    processOrder
};

export default CheckoutService;