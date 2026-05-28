/**
 * =========================================================
 * Bose Sweets — Stable Project Contracts
 * =========================================================
 * FILE: contracts.js
 * PURPOSE:
 * Single Source Of Truth For Entire Project
 * =========================================================
 */

'use strict';

/**
 * =========================================================
 * BRAND
 * =========================================================
 */

export const BRAND = Object.freeze({
    NAME: 'حلويات بوسي',
    SLOGAN: 'صنعناها بحب لتهديها لمن تحب',
    WHATSAPP_NUMBER: '201097238441',
    CURRENCY: 'ج.م'
});

/**
 * =========================================================
 * ROUTES
 * =========================================================
 */

export const ROUTES = Object.freeze({
    HOME: './index.html',
    MENU: './menu.html',
    PRODUCT: './product.html',
    CART: './cart.html',
    CHECKOUT: './checkout.html',
    DASHBOARD: './dashboard.html'
});

/**
 * =========================================================
 * STORAGE KEYS
 * =========================================================
 */

export const STORAGE_KEYS = Object.freeze({
    CART: 'bose_sweets_cart',
    PRODUCTS_CACHE: 'bose_sweets_products_cache',
    LAST_ORDER: 'bose_sweets_last_order'
});

/**
 * =========================================================
 * GLOBAL IDS
 * =========================================================
 */

export const IDS = Object.freeze({

    /**
     * Header
     */
    HEADER: 'header',
    HEADER_SEARCH: 'header-search',
    HEADER_CART_BUTTON: 'header-cart-button',
    HEADER_CART_COUNT: 'header-cart-count',
    SIDEBAR: 'sidebar',
    SIDEBAR_OVERLAY: 'sidebar-overlay',
    SIDEBAR_TOGGLE: 'sidebar-toggle',
    SIDEBAR_CLOSE: 'sidebar-close',

    /**
     * Hero
     */
    HERO_SECTION: 'hero-section',
    HERO_VIDEO: 'hero-video',
    HERO_ORDER_BUTTON: 'hero-order-button',

    /**
     * Best Sellers
     */
    BEST_SELLERS_SECTION: 'best-sellers-section',
    BEST_SELLERS_SLIDER: 'best-sellers-slider',

    /**
     * Products
     */
    PRODUCTS_SECTION: 'products-section',
    PRODUCTS_GRID: 'products-grid',
    PRODUCTS_SHOW_MORE: 'products-show-more',

    /**
     * Latest Products
     */
    LATEST_PRODUCTS_SECTION: 'latest-products-section',
    LATEST_PRODUCTS_SLIDER: 'latest-products-slider',

    /**
     * Categories
     */
    CATEGORIES_SECTION: 'categories-section',
    CATEGORIES_SLIDER: 'categories-slider',

    /**
     * Cake Builder
     */
    CAKE_BUILDER_SECTION: 'cake-builder-section',
    CAKE_BUILDER_FORM: 'cake-builder-form',

    /**
     * Flower Builder
     */
    FLOWER_BUILDER_SECTION: 'flower-builder-section',
    FLOWER_BUILDER_FORM: 'flower-builder-form',

    /**
     * Menu
     */
    MENU_SECTION: 'menu-section',
    MENU_GRID: 'menu-grid',

    /**
     * Product Page
     */
    PRODUCT_SECTION: 'product-section',
    PRODUCT_IMAGE: 'product-image',
    PRODUCT_NAME: 'product-name',
    PRODUCT_DESCRIPTION: 'product-description',
    PRODUCT_PRICE: 'product-price',
    PRODUCT_ADD_TO_CART: 'product-add-to-cart',

    /**
     * Cart
     */
    CART_SECTION: 'cart-section',
    CART_ITEMS: 'cart-items',
    CART_SUBTOTAL: 'cart-subtotal',
    CART_TOTAL: 'cart-total',
    CART_CHECKOUT_BUTTON: 'cart-checkout-button',

    /**
     * Checkout
     */
    CHECKOUT_SECTION: 'checkout-section',
    CHECKOUT_FORM: 'checkout-form',
    CHECKOUT_SUBMIT: 'checkout-submit',

    /**
     * Footer
     */
    FOOTER: 'footer'
});

/**
 * =========================================================
 * PRODUCT TYPES
 * =========================================================
 */

export const PRODUCT_TYPES = Object.freeze({
    CAKES: 'cakes',
    DONUTS: 'donuts',
    CINNABON: 'cinnabon',
    DESPACITO: 'despacito',
    QASHTOTA: 'qashtota',
    HAPPINESS_CUPS: 'happiness-cups',
    BOX_ROQAN: 'box-roqan',
    RED_VELVET: 'red-velvet',
    MINI_CAKE: 'mini-cake',
    CUPCAKES: 'cupcakes',
    FLOWERS: 'flowers'
});

/**
 * =========================================================
 * SHIPPING ZONES
 * =========================================================
 */

export const SHIPPING_ZONES = Object.freeze({
    FARAFLA: {
        KEY: 'farafra',
        NAME: 'الفرافرة',
        PRICE: 50
    },

    THIRTEEN: {
        KEY: '13',
        NAME: '13',
        PRICE: 70
    },

    GAM3EYA: {
        KEY: 'gam3eya',
        NAME: 'الجمعية',
        PRICE: 50
    },

    SANAYE3: {
        KEY: 'sanaye3',
        NAME: 'الصنايع',
        PRICE: 40
    },

    ABOBAKR: {
        KEY: 'abobakr',
        NAME: 'ابوبكر',
        PRICE: 40
    },

    ABOELHOOL: {
        KEY: 'aboelhool',
        NAME: 'ابوالهول',
        PRICE: 30
    },

    ELKEFAH: {
        KEY: 'elkefah',
        NAME: 'الكفاح',
        PRICE: 30
    },

    ALAMAL: {
        KEY: 'alamal',
        NAME: 'الامل',
        PRICE: 50
    },

    SEVENTEEN: {
        KEY: '17',
        NAME: '17',
        PRICE: 70
    },

    ABOHORIRA: {
        KEY: 'abohorira',
        NAME: 'ابوهريرة',
        PRICE: 140
    }
});

/**
 * =========================================================
 * VALIDATION RULES
 * =========================================================
 */

export const VALIDATION = Object.freeze({
    PHONE_REGEX: /^01[0125][0-9]{8}$/,

    MIN_CAKE_PEOPLE: 4,
    MAX_CAKE_PEOPLE: 250,

    MIN_FLOWERS: 15,

    MIN_BOOKING_HOURS: 24
});

/**
 * =========================================================
 * CAKE BUILDER RULES
 * =========================================================
 */

export const CAKE_RULES = Object.freeze({
    RECTANGLE_MIN: 20,
    SQUARE_MIN: 16,
    PRICE_PER_PERSON: 145
});

/**
 * =========================================================
 * UI TOKENS
 * =========================================================
 */

export const UI = Object.freeze({
    COLORS: {
        PRIMARY: '#ff91a4',
        BLACK: '#1a1a1a',
        WHITE: '#ffffff'
    },

    BORDER_RADIUS: {
        SMALL: '12px',
        MEDIUM: '18px',
        LARGE: '28px',
        FULL: '999px'
    }
});

/**
 * =========================================================
 * DEFAULT EXPORT
 * =========================================================
 */

const CONTRACTS = Object.freeze({
    BRAND,
    ROUTES,
    STORAGE_KEYS,
    IDS,
    PRODUCT_TYPES,
    SHIPPING_ZONES,
    VALIDATION,
    CAKE_RULES,
    UI
});

export default CONTRACTS;