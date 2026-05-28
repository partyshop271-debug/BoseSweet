/**
 * =========================================================
 * Bose Sweets — Search Engine
 * =========================================================
 * FILE: search-engine.js
 * PURPOSE:
 * Smart Product Search
 * =========================================================
 */

'use strict';

import DataService from './data-service.js';

/**
 * =========================================================
 * STATE
 * =========================================================
 */

const state = {

    debounceTimer: null
};

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeText(text = '') {

    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}

function includesText(source, target) {

    return normalizeText(source)
        .includes(
            normalizeText(target)
        );
}

/**
 * =========================================================
 * SEARCH
 * =========================================================
 */

function searchProducts(query) {

    const products =
        DataService.getAllProducts();

    if (!query) {
        return products;
    }

    return products.filter(product => {

        /**
         * =============================================
         * TITLE
         * =============================================
         */

        if (
            includesText(
                product.title,
                query
            )
        ) {

            return true;
        }

        /**
         * =============================================
         * DESCRIPTION
         * =============================================
         */

        if (
            includesText(
                product.description,
                query
            )
        ) {

            return true;
        }

        /**
         * =============================================
         * CATEGORY
         * =============================================
         */

        if (
            includesText(
                product.category,
                query
            )
        ) {

            return true;
        }

        /**
         * =============================================
         * SEARCH TERMS
         * =============================================
         */

        if (
            Array.isArray(
                product.searchTerms
            )
        ) {

            const matched =
                product.searchTerms.some(
                    term => {

                        return includesText(
                            term,
                            query
                        );
                    }
                );

            if (matched) {
                return true;
            }
        }

        /**
         * =============================================
         * VARIANTS
         * =============================================
         */

        if (
            Array.isArray(
                product.variants
            )
        ) {

            const variantMatch =
                product.variants.some(
                    variant => {

                        return includesText(

                            variant.flavor ||
                            variant.name ||
                            '',

                            query
                        );
                    }
                );

            if (variantMatch) {
                return true;
            }
        }

        /**
         * =============================================
         * SIZES
         * =============================================
         */

        if (
            Array.isArray(
                product.sizes
            )
        ) {

            const sizeMatch =
                product.sizes.some(
                    size => {

                        /**
                         * =====================
                         * SIZE NAME
                         * =====================
                         */

                        if (
                            includesText(
                                size.name,
                                query
                            )
                        ) {

                            return true;
                        }

                        /**
                         * =====================
                         * SIZE VARIANTS
                         * =====================
                         */

                        if (
                            Array.isArray(
                                size.variants
                            )
                        ) {

                            return size.variants.some(
                                variant => {

                                    return includesText(

                                        variant.flavor ||
                                        '',

                                        query
                                    );
                                }
                            );
                        }

                        return false;
                    }
                );

            if (sizeMatch) {
                return true;
            }
        }

        return false;
    });
}

/**
 * =========================================================
 * DISPATCH
 * =========================================================
 */

function dispatchSearch(query) {

    const results =
        searchProducts(query);

    document.dispatchEvent(

        new CustomEvent(

            'bose-search-results',

            {

                detail: {

                    query,

                    results
                }
            }
        )
    );
}

/**
 * =========================================================
 * INPUT EVENTS
 * =========================================================
 */

function initializeSearch() {

    const input =
        document.querySelector(
            '#header-search'
        );

    if (!input) {
        return;
    }

    input.addEventListener(
        'input',
        event => {

            clearTimeout(
                state.debounceTimer
            );

            const query =
                event.target.value;

            state.debounceTimer =
                setTimeout(() => {

                    dispatchSearch(
                        query
                    );

                }, 250);
        }
    );
}

/**
 * =========================================================
 * INITIALIZE
 * =========================================================
 */

async function initializeEngine() {

    try {

        await DataService.load();

        initializeSearch();

    } catch (error) {

        console.error(
            '[SearchEngine]',
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
    initializeEngine
);