/**
 * =========================================================
 * Bose Sweets — Cart Service
 * =========================================================
 * FILE: cart-service.js
 * PURPOSE:
 * Stable Cart State Management
 * =========================================================
 */

'use strict';

import CONTRACTS from './contracts.js';
import DataService from './data-service.js';

/**
 * =========================================================
 * PRIVATE STATE
 * =========================================================
 */

const state = {
    items: []
};

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function deepClone(data) {
    return JSON.parse(JSON.stringify(data));
}

function saveCart() {

    localStorage.setItem(
        CONTRACTS.STORAGE_KEYS.CART,
        JSON.stringify(state.items)
    );
}

function loadCart() {

    const rawCart = localStorage.getItem(
        CONTRACTS.STORAGE_KEYS.CART
    );

    if (!rawCart) {
        state.items = [];
        return;
    }

    try {

        const parsed = JSON.parse(rawCart);

        state.items = Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(error);

        state.items = [];
    }
}

function generateCartItemId() {

    return (
        'cart_' +
        Date.now() +
        '_' +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}

function calculateItemsTotal(items = []) {

    return items.reduce((total, item) => {

        return total + (
            Number(item.price) *
            Number(item.quantity)
        );

    }, 0);
}

/**
 * =========================================================
 * INITIALIZE
 * =========================================================
 */

loadCart();

/**
 * =========================================================
 * CART SERVICE
 * =========================================================
 */

const CartService = {

    /**
     * =====================================================
     * GET CART
     * =====================================================
     */

    getItems() {

        return deepClone(state.items);
    },

    getItemsCount() {

        return state.items.reduce((count, item) => {

            return count + Number(item.quantity);

        }, 0);
    },

    getSubtotal() {

        return calculateItemsTotal(state.items);
    },

    getTotal(shippingPrice = 0) {

        return (
            this.getSubtotal() +
            Number(shippingPrice)
        );
    },

    clearCart() {

        state.items = [];

        saveCart();
    },

    /**
     * =====================================================
     * ADD PRODUCT
     * =====================================================
     */

    addProduct(productData = {}) {

        const {
            productId,
            title,
            variant,
            size,
            quantity = 1,
            price = 0,
            image = ''
        } = productData;

        if (!productId) {
            throw new Error(
                '[CartService] Product ID is required.'
            );
        }

        const existingItem = state.items.find(item => {

            return (
                item.productId === productId &&
                item.variant === variant &&
                item.size === size
            );
        });

        if (existingItem) {

            existingItem.quantity += Number(quantity);

            saveCart();

            return deepClone(existingItem);
        }

        const newItem = {

            cartItemId: generateCartItemId(),

            productId,

            title,

            variant,

            size,

            quantity: Number(quantity),

            price: Number(price),

            image,

            addedAt: Date.now()
        };

        state.items.push(newItem);

        saveCart();

        return deepClone(newItem);
    },

    /**
     * =====================================================
     * ADD CUSTOM CAKE
     * =====================================================
     */

    addCakeBuilder(builderData = {}) {

        const newItem = {

            cartItemId: generateCartItemId(),

            type: 'custom-cake',

            title: 'تورتة ملكية - تصميم خاص',

            quantity: 1,

            price: Number(builderData.totalPrice || 0),

            builderData,

            addedAt: Date.now()
        };

        state.items.push(newItem);

        saveCart();

        return deepClone(newItem);
    },

    /**
     * =====================================================
     * ADD FLOWER BUILDER
     * =====================================================
     */

    addFlowerBuilder(builderData = {}) {

        const newItem = {

            cartItemId: generateCartItemId(),

            type: 'custom-flower',

            title: 'بوكيه ورد - بناء خاص',

            quantity: 1,

            price: Number(builderData.totalPrice || 0),

            builderData,

            addedAt: Date.now()
        };

        state.items.push(newItem);

        saveCart();

        return deepClone(newItem);
    },

    /**
     * =====================================================
     * UPDATE QUANTITY
     * =====================================================
     */

    updateQuantity(cartItemId, quantity) {

        const item = state.items.find(item => {

            return item.cartItemId === cartItemId;
        });

        if (!item) {
            return null;
        }

        const normalizedQuantity = Number(quantity);

        if (normalizedQuantity <= 0) {

            this.removeItem(cartItemId);

            return null;
        }

        item.quantity = normalizedQuantity;

        saveCart();

        return deepClone(item);
    },

    /**
     * =====================================================
     * REMOVE ITEM
     * =====================================================
     */

    removeItem(cartItemId) {

        state.items = state.items.filter(item => {

            return item.cartItemId !== cartItemId;
        });

        saveCart();
    },

    /**
     * =====================================================
     * SHIPPING
     * =====================================================
     */

    getShippingPrice(zoneId) {

        const zone = DataService
            .getShippingZoneById(zoneId);

        return zone
            ? Number(zone.price)
            : 0;
    },

    /**
     * =====================================================
     * WHATSAPP ORDER
     * =====================================================
     */

    buildWhatsAppMessage(orderData = {}) {

        const lines = [];

        lines.push('طلب جديد - حلويات بوسي');
        lines.push('====================');

        lines.push(
            `الاسم: ${orderData.customerName || '-'}`
        );

        lines.push(
            `الهاتف 1: ${orderData.phone1 || '-'}`
        );

        lines.push(
            `الهاتف 2: ${orderData.phone2 || '-'}`
        );

        lines.push('');

        lines.push('المنتجات:');

        state.items.forEach((item, index) => {

            lines.push(
                `${index + 1}- ${item.title}`
            );

            if (item.variant) {

                lines.push(
                    `النكهة: ${item.variant}`
                );
            }

            if (item.size) {

                lines.push(
                    `الحجم: ${item.size}`
                );
            }

            lines.push(
                `الكمية: ${item.quantity}`
            );

            lines.push(
                `السعر: ${item.price} ${CONTRACTS.BRAND.CURRENCY}`
            );

            lines.push('----------------');
        });

        lines.push('');

        lines.push(
            `الإجمالي: ${this.getSubtotal()} ${CONTRACTS.BRAND.CURRENCY}`
        );

        return encodeURIComponent(
            lines.join('\n')
        );
    }
};

/**
 * =========================================================
 * FREEZE
 * =========================================================
 */

Object.freeze(CartService);

/**
 * =========================================================
 * EXPORT
 * =========================================================
 */

export default CartService;