/**
 * =========================================================
 * Bose Sweets — UI Engine
 * =========================================================
 * FILE: ui-engine.js
 * PURPOSE:
 * Stable DOM + UI Controller
 * =========================================================
 */

'use strict';

import CONTRACTS from './contracts.js';
import CartService from './cart-service.js';

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getElement(id) {

    return document.getElementById(id);
}

function safeAddEvent(element, event, callback) {

    if (!element) {
        return;
    }

    element.addEventListener(event, callback);
}

function safeSetText(element, value) {

    if (!element) {
        return;
    }

    element.textContent = value;
}

function safeToggleClass(element, className, force = null) {

    if (!element) {
        return;
    }

    if (force === null) {

        element.classList.toggle(className);

        return;
    }

    element.classList.toggle(className, force);
}

/**
 * =========================================================
 * SIDEBAR
 * =========================================================
 */

function openSidebar() {

    const sidebar = getElement(
        CONTRACTS.IDS.SIDEBAR
    );

    const overlay = getElement(
        CONTRACTS.IDS.SIDEBAR_OVERLAY
    );

    safeToggleClass(sidebar, 'active', true);

    safeToggleClass(overlay, 'active', true);

    document.body.style.overflow = 'hidden';
}

function closeSidebar() {

    const sidebar = getElement(
        CONTRACTS.IDS.SIDEBAR
    );

    const overlay = getElement(
        CONTRACTS.IDS.SIDEBAR_OVERLAY
    );

    safeToggleClass(sidebar, 'active', false);

    safeToggleClass(overlay, 'active', false);

    document.body.style.overflow = '';
}

/**
 * =========================================================
 * CART UI
 * =========================================================
 */

function updateCartCount() {

    const cartCount = getElement(
        CONTRACTS.IDS.HEADER_CART_COUNT
    );

    const totalItems =
        CartService.getItemsCount();

    safeSetText(cartCount, totalItems);
}

/**
 * =========================================================
 * SEARCH
 * =========================================================
 */

function initializeSearch() {

    const searchInput = getElement(
        CONTRACTS.IDS.HEADER_SEARCH
    );

    if (!searchInput) {
        return;
    }

    safeAddEvent(
        searchInput,
        'input',
        event => {

            const searchValue =
                event.target.value.trim();

            document.dispatchEvent(

                new CustomEvent(
                    'bose-search',
                    {
                        detail: {
                            value: searchValue
                        }
                    }
                )
            );
        }
    );
}

/**
 * =========================================================
 * SIDEBAR EVENTS
 * =========================================================
 */

function initializeSidebar() {

    const openButton = getElement(
        CONTRACTS.IDS.SIDEBAR_TOGGLE
    );

    const closeButton = getElement(
        CONTRACTS.IDS.SIDEBAR_CLOSE
    );

    const overlay = getElement(
        CONTRACTS.IDS.SIDEBAR_OVERLAY
    );

    safeAddEvent(
        openButton,
        'click',
        openSidebar
    );

    safeAddEvent(
        closeButton,
        'click',
        closeSidebar
    );

    safeAddEvent(
        overlay,
        'click',
        closeSidebar
    );
}

/**
 * =========================================================
 * GLOBAL UI EVENTS
 * =========================================================
 */

function initializeGlobalEvents() {

    window.addEventListener(
        'storage',
        () => {

            updateCartCount();
        }
    );
}

/**
 * =========================================================
 * INIT
 * =========================================================
 */

function initialize() {

    initializeSidebar();

    initializeSearch();

    initializeGlobalEvents();

    updateCartCount();
}

/**
 * =========================================================
 * DOM READY
 * =========================================================
 */

document.addEventListener(
    'DOMContentLoaded',
    initialize
);

/**
 * =========================================================
 * PUBLIC API
 * =========================================================
 */

const UIEngine = Object.freeze({

    updateCartCount,

    openSidebar,

    closeSidebar
});

/**
 * =========================================================
 * EXPORT
 * =========================================================
 */

export default UIEngine;