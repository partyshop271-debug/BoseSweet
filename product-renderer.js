/**
 * =========================================================
 * Bose Sweets — Product Renderer
 * =========================================================
 * FILE: product-renderer.js
 * PURPOSE:
 * Render Products Into UI
 * =========================================================
 */

'use strict';

import DataService from './data-service.js';
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

function createElement(tag, className = '') {

    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    return element;
}

function safeAppend(parent, child) {

    if (!parent || !child) {
        return;
    }

    parent.appendChild(child);
}

function getProductPrice(product) {

    if (product.price) {
        return product.price;
    }

    if (product.basePrice) {
        return product.basePrice;
    }

    if (
        Array.isArray(product.variants) &&
        product.variants.length
    ) {
        return product.variants[0].price;
    }

    if (
        Array.isArray(product.sizes) &&
        product.sizes.length
    ) {

        const firstSize = product.sizes[0];

        if (firstSize.price) {
            return firstSize.price;
        }

        if (
            Array.isArray(firstSize.variants) &&
            firstSize.variants.length
        ) {
            return firstSize.variants[0].price;
        }
    }

    return 0;
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

/**
 * =========================================================
 * PRODUCT CARD
 * =========================================================
 */

function createProductCard(product) {

    const card = createElement(
        'div',
        'product-card'
    );

    const image = createElement('img');

    image.src = getProductImage(product);

    image.alt = product.title;

    const title = createElement('h3');

    title.textContent = product.title;

    const description = createElement('p');

    description.textContent =
        product.description || '';

    const price = createElement('div');

    price.className = 'product-price';

    price.textContent =
        `${getProductPrice(product)} ج.م`;

    const quantityContainer = createElement(
        'div',
        'quantity-container'
    );

    const minusButton = createElement(
        'button',
        'quantity-button'
    );

    minusButton.textContent = '-';

    const quantityText = createElement(
        'span',
        'quantity-text'
    );

    quantityText.textContent = '1';

    const plusButton = createElement(
        'button',
        'quantity-button'
    );

    plusButton.textContent = '+';

    safeAppend(
        quantityContainer,
        minusButton
    );

    safeAppend(
        quantityContainer,
        quantityText
    );

    safeAppend(
        quantityContainer,
        plusButton
    );

    const addButton = createElement(
        'button',
        'add-to-cart'
    );

    addButton.textContent =
        'إضافة للسلة';

    let quantity = 1;

    plusButton.addEventListener(
        'click',
        () => {

            quantity++;

            quantityText.textContent =
                quantity;
        }
    );

    minusButton.addEventListener(
        'click',
        () => {

            if (quantity <= 1) {
                return;
            }

            quantity--;

            quantityText.textContent =
                quantity;
        }
    );

    addButton.addEventListener(
        'click',
        () => {

            CartService.addProduct({

                productId: product.id,

                title: product.title,

                quantity,

                price: getProductPrice(product),

                image: getProductImage(product)
            });

            UIEngine.updateCartCount();
        }
    );

    safeAppend(card, image);

    safeAppend(card, title);

    safeAppend(card, description);

    safeAppend(card, price);

    safeAppend(card, quantityContainer);

    safeAppend(card, addButton);

    return card;
}

/**
 * =========================================================
 * RENDER PRODUCTS GRID
 * =========================================================
 */

function renderProductsGrid(products = []) {

    const container = getElement(
        '.products-grid'
    );

    if (!container) {
        return;
    }

    container.innerHTML = '';

    products.forEach(product => {

        const card =
            createProductCard(product);

        safeAppend(container, card);
    });
}

/**
 * =========================================================
 * FEATURED SLIDER
 * =========================================================
 */

function renderFeaturedSlider(products = []) {

    const container = getElement(
        '#featured-slider'
    );

    if (!container) {
        return;
    }

    container.innerHTML = '';

    products.forEach(product => {

        const card =
            createProductCard(product);

        safeAppend(container, card);
    });
}

/**
 * =========================================================
 * LATEST SLIDER
 * =========================================================
 */

function renderLatestSlider(products = []) {

    const container = getElement(
        '.latest-slider'
    );

    if (!container) {
        return;
    }

    container.innerHTML = '';

    products.forEach(product => {

        const card =
            createProductCard(product);

        safeAppend(container, card);
    });
}

/**
 * =========================================================
 * SEARCH EVENTS
 * =========================================================
 */

function initializeSearchRendering() {

    document.addEventListener(
        'bose-search',
        event => {

            const searchText =
                event.detail.value;

            if (!searchText) {

                const allProducts =
                    DataService.getAllProducts();

                renderProductsGrid(
                    allProducts
                );

                return;
            }

            const results =
                DataService.searchProducts(
                    searchText
                );

            renderProductsGrid(results);
        }
    );
}

/**
 * =========================================================
 * INITIALIZE
 * =========================================================
 */

async function initializeRenderer() {

    try {

        await DataService.load();

        const allProducts =
            DataService.getAllProducts();

        const featuredProducts =
            DataService.getFeaturedProducts();

        renderProductsGrid(
            allProducts
        );

        renderFeaturedSlider(
            featuredProducts
        );

        renderLatestSlider(
            allProducts.slice(0, 6)
        );

        initializeSearchRendering();

    } catch (error) {

        console.error(
            '[ProductRenderer]',
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
    initializeRenderer
);