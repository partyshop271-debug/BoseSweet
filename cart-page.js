/**
 * =========================================================
 * Bose Sweets — Cart Page
 * =========================================================
 * FILE: cart-page.js
 * PURPOSE:
 * Render Cart UI
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

function createElement(tag, className = '') {

    const element =
        document.createElement(tag);

    if (className) {
        element.className = className;
    }

    return element;
}

function safeSetText(element, value) {

    if (!element) {
        return;
    }

    element.textContent = value;
}

/**
 * =========================================================
 * CART ITEM
 * =========================================================
 */

function createCartItem(item) {

    const card = createElement(
        'div',
        'cart-item'
    );

    /**
     * =============================================
     * IMAGE
     * =============================================
     */

    const image = createElement(
        'img',
        'cart-item-image'
    );

    image.src =
        item.image ||
        'assets/images/placeholder.jpg';

    image.alt =
        item.title;

    /**
     * =============================================
     * CONTENT
     * =============================================
     */

    const content = createElement(
        'div',
        'cart-item-content'
    );

    const title = createElement(
        'h3',
        'cart-item-title'
    );

    title.textContent =
        item.title;

    const details = createElement(
        'div',
        'cart-item-details'
    );

    if (item.variant) {

        const variant =
            createElement(
                'p'
            );

        variant.textContent =
            `النكهة: ${item.variant}`;

        details.appendChild(
            variant
        );
    }

    if (item.size) {

        const size =
            createElement(
                'p'
            );

        size.textContent =
            `الحجم: ${item.size}`;

        details.appendChild(
            size
        );
    }

    /**
     * =============================================
     * PRICE
     * =============================================
     */

    const price = createElement(
        'div',
        'cart-item-price'
    );

    price.textContent =
        `${item.price} ج.م`;

    /**
     * =============================================
     * QUANTITY
     * =============================================
     */

    const quantityContainer =
        createElement(
            'div',
            'quantity-container'
        );

    const minusButton =
        createElement(
            'button',
            'quantity-button'
        );

    minusButton.textContent = '-';

    const quantityText =
        createElement(
            'span',
            'quantity-text'
        );

    quantityText.textContent =
        item.quantity;

    const plusButton =
        createElement(
            'button',
            'quantity-button'
        );

    plusButton.textContent = '+';

    quantityContainer.appendChild(
        minusButton
    );

    quantityContainer.appendChild(
        quantityText
    );

    quantityContainer.appendChild(
        plusButton
    );

    /**
     * =============================================
     * REMOVE
     * =============================================
     */

    const removeButton =
        createElement(
            'button',
            'remove-button'
        );

    removeButton.textContent =
        'حذف';

    /**
     * =============================================
     * EVENTS
     * =============================================
     */

    plusButton.addEventListener(
        'click',
        () => {

            CartService.updateQuantity(

                item.cartItemId,

                item.quantity + 1
            );

            renderCart();
        }
    );

    minusButton.addEventListener(
        'click',
        () => {

            CartService.updateQuantity(

                item.cartItemId,

                item.quantity - 1
            );

            renderCart();
        }
    );

    removeButton.addEventListener(
        'click',
        () => {

            CartService.removeItem(
                item.cartItemId
            );

            renderCart();
        }
    );

    /**
     * =============================================
     * BUILD
     * =============================================
     */

    content.appendChild(title);

    content.appendChild(details);

    content.appendChild(price);

    content.appendChild(
        quantityContainer
    );

    content.appendChild(
        removeButton
    );

    card.appendChild(image);

    card.appendChild(content);

    return card;
}

/**
 * =========================================================
 * SUMMARY
 * =========================================================
 */

function updateSummary() {

    const subtotal =
        CartService.getSubtotal();

    const subtotalElement =
        getElement(
            '#cart-subtotal'
        );

    const totalElement =
        getElement(
            '#cart-total'
        );

    safeSetText(
        subtotalElement,
        `${subtotal} ج.م`
    );

    safeSetText(
        totalElement,
        `${subtotal} ج.م`
    );
}

/**
 * =========================================================
 * EMPTY STATE
 * =========================================================
 */

function renderEmptyState(container) {

    container.innerHTML = '';

    const empty =
        createElement(
            'div',
            'empty-cart'
        );

    empty.textContent =
        'السلة فارغة حالياً';

    container.appendChild(
        empty
    );
}

/**
 * =========================================================
 * RENDER CART
 * =========================================================
 */

function renderCart() {

    const container =
        getElement(
            '#cart-items'
        );

    if (!container) {
        return;
    }

    const items =
        CartService.getItems();

    container.innerHTML = '';

    if (!items.length) {

        renderEmptyState(
            container
        );

        updateSummary();

        UIEngine.updateCartCount();

        return;
    }

    items.forEach(item => {

        const card =
            createCartItem(item);

        container.appendChild(
            card
        );
    });

    updateSummary();

    UIEngine.updateCartCount();
}

/**
 * =========================================================
 * INITIALIZE
 * =========================================================
 */

function initializePage() {

    renderCart();
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