/**
 * =========================================================
 * Bose Sweets — Data Service
 * =========================================================
 * FILE: data-service.js
 * PURPOSE:
 * Central Unified Data Access Layer
 * =========================================================
 */

'use strict';

import CONTRACTS from './contracts.js';

/**
 * =========================================================
 * PRIVATE STATE
 * =========================================================
 */

const state = {
    products: null,
    loaded: false,
    loading: false
};

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function deepClone(data) {
    return JSON.parse(JSON.stringify(data));
}

function ensureLoaded() {
    if (!state.loaded || !state.products) {
        throw new Error(
            '[DataService] Products are not loaded yet.'
        );
    }
}

function normalizeText(text = '') {
    return String(text)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function safeArray(value) {
    return Array.isArray(value)
        ? value
        : [];
}

/**
 * =========================================================
 * DATA SERVICE
 * =========================================================
 */

const DataService = {

    /**
     * =====================================================
     * LOAD PRODUCTS
     * =====================================================
     */

    async load() {

        if (state.loaded) {
            return deepClone(state.products);
        }

        if (state.loading) {
            return null;
        }

        try {

            state.loading = true;

            const response = await fetch('./products.json', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(
                    `[DataService] Failed To Load Products: ${response.status}`
                );
            }

            const data = await response.json();

            validateProductsFile(data);

            state.products = data;
            state.loaded = true;

            return deepClone(state.products);

        } catch (error) {

            console.error(error);

            throw error;

        } finally {

            state.loading = false;
        }
    },

    /**
     * =====================================================
     * STORE
     * =====================================================
     */

    getStore() {

        ensureLoaded();

        return deepClone(state.products.store);
    },

    /**
     * =====================================================
     * PRODUCTS
     * =====================================================
     */

    getAllProducts() {

        ensureLoaded();

        return deepClone(
            safeArray(state.products.products)
        );
    },

    getFeaturedProducts() {

        ensureLoaded();

        return deepClone(
            safeArray(state.products.products)
                .filter(product => product.featured === true)
        );
    },

    getProductById(productId) {

        ensureLoaded();

        const normalizedId = normalizeText(productId);

        const product = safeArray(state.products.products)
            .find(product => normalizeText(product.id) === normalizedId);

        return product
            ? deepClone(product)
            : null;
    },

    getProductBySlug(slug) {

        ensureLoaded();

        const normalizedSlug = normalizeText(slug);

        const product = safeArray(state.products.products)
            .find(product => normalizeText(product.slug) === normalizedSlug);

        return product
            ? deepClone(product)
            : null;
    },

    getProductsByCategory(category) {

        ensureLoaded();

        const normalizedCategory = normalizeText(category);

        return deepClone(
            safeArray(state.products.products)
                .filter(product =>
                    normalizeText(product.category) === normalizedCategory
                )
        );
    },

    searchProducts(searchText) {

        ensureLoaded();

        const normalizedSearch = normalizeText(searchText);

        if (!normalizedSearch) {
            return [];
        }

        return deepClone(

            safeArray(state.products.products)

                .filter(product => {

                    const title = normalizeText(product.title);

                    const description = normalizeText(product.description);

                    const terms = safeArray(product.searchTerms)
                        .map(term => normalizeText(term));

                    return (
                        title.includes(normalizedSearch) ||
                        description.includes(normalizedSearch) ||
                        terms.some(term => term.includes(normalizedSearch))
                    );
                })
        );
    },

    /**
     * =====================================================
     * SHIPPING
     * =====================================================
     */

    getShippingZones() {

        ensureLoaded();

        return deepClone(
            safeArray(state.products.shippingZones)
        );
    },

    getShippingZoneById(zoneId) {

        ensureLoaded();

        const normalizedId = normalizeText(zoneId);

        const zone = safeArray(state.products.shippingZones)
            .find(zone =>
                normalizeText(zone.id) === normalizedId
            );

        return zone
            ? deepClone(zone)
            : null;
    },

    /**
     * =====================================================
     * BUILDERS
     * =====================================================
     */

    getCakeBuilder() {

        ensureLoaded();

        return deepClone(
            state.products.cakeBuilder
        );
    },

    getFlowerBuilder() {

        ensureLoaded();

        return deepClone(
            state.products.flowerBuilder
        );
    },

    /**
     * =====================================================
     * PRICE HELPERS
     * =====================================================
     */

    calculateCakePrice(personsCount = 4) {

        ensureLoaded();

        const rules = state.products.cakeBuilder;

        const persons = Number(personsCount);

        return persons * rules.pricePerPerson;
    },

    calculateFlowerPrice(flowersCount = 15) {

        ensureLoaded();

        const builder = state.products.flowerBuilder;

        const flowers = Number(flowersCount);

        if (flowers <= builder.baseFlowers) {
            return builder.basePrice;
        }

        const extraFlowers =
            flowers - builder.baseFlowers;

        return (
            builder.basePrice +
            (extraFlowers * builder.extraFlowerPrice)
        );
    },

    /**
     * =====================================================
     * VALIDATION
     * =====================================================
     */

    isValidEgyptianPhone(phone) {

        const normalizedPhone = String(phone).trim();

        return CONTRACTS.VALIDATION.PHONE_REGEX
            .test(normalizedPhone);
    }
};

/**
 * =========================================================
 * VALIDATION
 * =========================================================
 */

function validateProductsFile(data) {

    if (!data || typeof data !== 'object') {
        throw new Error(
            '[DataService] Invalid products.json structure.'
        );
    }

    if (!Array.isArray(data.products)) {
        throw new Error(
            '[DataService] Products list is missing.'
        );
    }

    const ids = new Set();

    for (const product of data.products) {

        if (!product.id) {
            throw new Error(
                '[DataService] Product ID is required.'
            );
        }

        if (ids.has(product.id)) {
            throw new Error(
                `[DataService] Duplicate Product ID: ${product.id}`
            );
        }

        ids.add(product.id);
    }
}

/**
 * =========================================================
 * FREEZE
 * =========================================================
 */

Object.freeze(DataService);

/**
 * =========================================================
 * EXPORT
 * =========================================================
 */

export default DataService;