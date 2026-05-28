/**
 * =========================================================
 * Bose Sweets — Product Page
 * =========================================================
 * FILE: product-page.js
 * PURPOSE:
 * Dynamic Product Details Page
 * =========================================================
 */

'use strict';

import DataService from './data-service.js';
import CartService from './cart-service.js';
import UIEngine from './ui-engine.js';

/**
 * =========================================================
 * STATE
 * =========================================================
 */

const state = {

    product: null,

    quantity: 1,

    selectedVariant: null,

    selectedSize: null
};

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getElement(selector) {

    return document.querySelector(selector);
}

function safeSetText(element, value) {

    if (!element) {
        return;
    }

    element.textContent = value;
}

function getSlugFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get('slug');
}

function getProductImage(product) {

    if (
        Array.isArray(product.images) &&
        product.images.length
    ) {
        return product.images[0];
    }

    return 'assets/images/placeholder.jpg';
}

function calculateCurrentPrice() {

    const product = state.product;

    if (!product) {
        return 0;
    }

    if (
        state.selectedVariant &&
        state.selectedVariant.price
    ) {
        return state.selectedVariant.price;
    }

    if (
        state.selectedSize &&
        state.selectedSize.price
    ) {
        return state.selectedSize.price;
    }

    if (
        state.selectedSize &&
        Array.isArray(state.selectedSize.variants)
    ) {

        return state.selectedSize.variants[0].price;
    }

    if (product.price) {
        return product.price;
    }

    return 0;
}

/**
 * =========================================================
 * RENDER PRODUCT
 * =========================================================
 */

function renderProduct() {

    const product = state.product;

    if (!product) {
        return;
    }

    const image =
        getElement('#product-image');

    const title =
        getElement('#product-title');

    const description =
        getElement('#product-description');

    const price =
        getElement('#product-price');

    image.src =
        getProductImage(product);

    image.alt =
        product.title;

    safeSetText(
        title,
        product.title
    );

    safeSetText(
        description,
        product.description
    );

    updatePrice();
}

/**
 * =========================================================
 * PRICE
 * =========================================================
 */

function updatePrice() {

    const priceElement =
        getElement('#product-price');

    const currentPrice =
        calculateCurrentPrice();

    safeSetText(
        priceElement,
        `${currentPrice} ج.م`
    );
}

/**
 * =========================================================
 * VARIANTS
 * =========================================================
 */

function renderVariants() {

    const product = state.product;

    const container =
        getElement('#product-options');

    if (!container || !product) {
        return;
    }

    container.innerHTML = '';

    /**
     * =============================================
     * DIRECT VARIANTS
     * =============================================
     */

    if (
        Array.isArray(product.variants)
    ) {

        product.variants.forEach(variant => {

            const button =
                document.createElement(
                    'button'
                );

            button.textContent =
                variant.flavor ||
                variant.name;

            button.addEventListener(
                'click',
                () => {

                    state.selectedVariant =
                        variant;

                    updatePrice();
                }
            );

            container.appendChild(button);
        });
    }

    /**
     * =============================================
     * SIZES
     * =============================================
     */

    if (
        Array.isArray(product.sizes)
    ) {

        product.sizes.forEach(size => {

            const button =
                document.createElement(
                    'button'
                );

            button.textContent =
                size.name;

            button.addEventListener(
                'click',
                () => {

                    state.selectedSize =
                        size;

                    /**
                     * =====================
                     * SIZE VARIANTS
                     * =====================
                     */

                    if (
                        Array.isArray(size.variants)
                    ) {

                        renderSizeVariants(
                            size.variants
                        );
                    }

                    updatePrice();
                }
            );

            container.appendChild(button);
        });
    }
}

/**
 * =========================================================
 * SIZE VARIANTS
 * =========================================================
 */

function renderSizeVariants(variants = []) {

    const container =
        getElement('#product-options');

    variants.forEach(variant => {

        const button =
            document.createElement(
                'button'
            );

        button.textContent =
            variant.flavor;

        button.addEventListener(
            'click',
            () => {

                state.selectedVariant =
                    variant;

                updatePrice();
            }
        );

        container.appendChild(button);
    });
}

/**
 * =========================================================
 * QUANTITY
 * =========================================================
 */

function initializeQuantity() {

    const plus =
        getElement('#quantity-plus');

    const minus =
        getElement('#quantity-minus');

    const text =
        getElement('#quantity-text');

    plus.addEventListener(
        'click',
        () => {

            state.quantity++;

            safeSetText(
                text,
                state.quantity
            );
        }
    );

    minus.addEventListener(
        'click',
        () => {

            if (
                state.quantity <= 1
            ) {
                return;
            }

            state.quantity--;

            safeSetText(
                text,
                state.quantity
            );
        }
    );
}

/**
 * =========================================================
 * CART
 * =========================================================
 */

function initializeAddToCart() {

    const button =
        getElement('#add-to-cart');

    if (!button) {
        return;
    }

    button.addEventListener(
        'click',
        () => {

            const currentPrice =
                calculateCurrentPrice();

            CartService.addProduct({

                productId:
                    state.product.id,

                title:
                    state.product.title,

                quantity:
                    state.quantity,

                price:
                    currentPrice,

                variant:
                    state.selectedVariant
                        ? (
                            state.selectedVariant.flavor ||
                            state.selectedVariant.name
                        )
                        : null,

                size:
                    state.selectedSize
                        ? state.selectedSize.name
                        : null,

                image:
                    getProductImage(
                        state.product
                    )
            });

            UIEngine.updateCartCount();
        }
    );
}

/**
 * =========================================================
 * INITIALIZE
 * =========================================================
 */

async function initializePage() {

    try {

        await DataService.load();

        const slug =
            getSlugFromURL();

        if (!slug) {
            return;
        }

        const product =
            DataService.getProductBySlug(
                slug
            );

        if (!product) {
            return;
        }

        state.product =
            product;

        renderProduct();

        renderVariants();

        initializeQuantity();

        initializeAddToCart();

    } catch (error) {

        console.error(
            '[ProductPage]',
            error
        );
    }
}

/**
 * =========================================================
 * DOM READY
 * =========================================================
 */

document.addEventListener(
    'DOMContentLoaded',
    initializePage
);