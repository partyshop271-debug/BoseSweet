/**
 * =========================================================
 * Bose Sweets — Enterprise UX & Rendering Engine
 * =========================================================
 * File               : unified-engine.js
 * Architecture Level : ENTERPRISE UX INFRASTRUCTURE
 * Runtime Level      : ULTRA PERFORMANCE
 * Rendering Level    : GOVERNED UI ORCHESTRATION
 * Mobile Level       : LOW MEMORY / LOW DATA
 * =========================================================
 */

'use strict';

import REGISTRY from './system-registry.js';

import SYSTEM_CORE from './system-core.js';

import FIREBASE_ENGINE from './firebase-engine.js';

import COMMERCE_ENGINE from './commerce-engine.js';

import UI_PERFORMANCE from './ui-performance.js';

/**
 * =========================================================
 * Constants
 * =========================================================
 */

const ENGINE_VERSION = '10.0.0';

/**
 * =========================================================
 * Runtime
 * =========================================================
 */

const __RUNTIME__ = Object.seal({

    initialized: false,

    booted: false,

    navigating: false,

    offlineMode: false,

    currentSection: 'home',

    currentRoute: '/',

    scrollLocked: false

});

/**
 * =========================================================
 * Runtime Stores
 * =========================================================
 */

const __SECTIONS__ = new Map();

const __NAVIGATION_STACK__ = [];

const __LIFECYCLES__ = new Map();

/**
 * =========================================================
 * Diagnostics
 * =========================================================
 */

function info(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.info(

        `[UNIFIED_ENGINE] ${message}`,

        metadata

    );

}

function warn(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.warn(

        `[UNIFIED_ENGINE] ${message}`,

        metadata

    );

}

function error(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.error(

        `[UNIFIED_ENGINE] ${message}`,

        metadata

    );

}

/**
 * =========================================================
 * Utilities
 * =========================================================
 */

function now() {

    return Date.now();

}

function deepClone(value) {

    try {

        return structuredClone(value);

    } catch {

        return JSON.parse(

            JSON.stringify(value)

        );

    }

}

/**
 * =========================================================
 * DOM Engine
 * =========================================================
 */

const DOM = {

    get(id) {

        return document.getElementById(id);

    },

    query(selector) {

        return document.querySelector(selector);

    },

    queryAll(selector) {

        return Array.from(

            document.querySelectorAll(selector)

        );

    },

    clear(element) {

        if (!element) return;

        element.textContent = '';

    },

    html(element, html = '') {

        if (!element) return;

        element.innerHTML = html;

    },

    text(element, text = '') {

        if (!element) return;

        element.textContent = text;

    },

    fragment(nodes = []) {

        const fragment =

            document.createDocumentFragment();

        nodes.forEach(node => {

            if (node) {

                fragment.appendChild(node);

            }

        });

        return fragment;

    }

};

/**
 * =========================================================
 * Events
 * =========================================================
 */

const EVENTS = {

    emit(event, payload = {}) {

        SYSTEM_CORE.EVENTS.emit(

            event,

            payload

        );

    },

    on(event, callback) {

        SYSTEM_CORE.EVENTS.on(

            event,

            callback

        );

    },

    off(event, callback) {

        SYSTEM_CORE.EVENTS.off(

            event,

            callback

        );

    }

};

/**
 * =========================================================
 * Navigation Engine
 * =========================================================
 */

const NAVIGATION = {

    async go(route, options = {}) {

        if (

            __RUNTIME__.navigating

        ) {

            return false;

        }

        __RUNTIME__.navigating = true;

        try {

            const {

                replace = false

            } = options;

            if (!replace) {

                history.pushState(

                    {},

                    '',

                    route

                );

            }

            __RUNTIME__.currentRoute = route;

            __NAVIGATION_STACK__.push({

                route,

                timestamp: now()

            });

            EVENTS.emit(

                'navigation:change',

                {

                    route

                }

            );

            return true;

        } catch (ex) {

            error(

                'Navigation Failure',

                {

                    exception: ex

                }

            );

            return false;

        } finally {

            __RUNTIME__.navigating = false;

        }

    },

    current() {

        return __RUNTIME__.currentRoute;

    },

    history() {

        return deepClone(

            __NAVIGATION_STACK__

        );

    }

};

/**
 * =========================================================
 * Sections Lifecycle
 * =========================================================
 */

const SECTIONS = {

    register(name, config = {}) {

        __SECTIONS__.set(

            name,

            deepClone(config)

        );

        return true;

    },

    exists(name) {

        return __SECTIONS__.has(name);

    },

    async mount(name) {

        if (

            !__SECTIONS__.has(name)

        ) {

            return false;

        }

        const section =

            __SECTIONS__.get(name);

        if (

            typeof section.mount === 'function'

        ) {

            await SYSTEM_CORE.safeExecute(

                async () => {

                    await section.mount();

                }

            );

        }

        __RUNTIME__.currentSection = name;

        EVENTS.emit(

            'section:mounted',

            {

                section: name

            }

        );

        return true;

    },

    async unmount(name) {

        if (

            !__SECTIONS__.has(name)

        ) {

            return false;

        }

        const section =

            __SECTIONS__.get(name);

        if (

            typeof section.unmount === 'function'

        ) {

            await SYSTEM_CORE.safeExecute(

                async () => {

                    await section.unmount();

                }

            );

        }

        EVENTS.emit(

            'section:unmounted',

            {

                section: name

            }

        );

        return true;

    }

};

/**
 * =========================================================
 * Offline Recovery
 * =========================================================
 */

const OFFLINE = {

    detect() {

        window.addEventListener(

            'offline',

            () => {

                __RUNTIME__.offlineMode = true;

                warn(

                    'Offline Mode Activated'

                );

            }

        );

        window.addEventListener(

            'online',

            async () => {

                __RUNTIME__.offlineMode = false;

                info(

                    'Online Recovery Activated'

                );

                await SYSTEM_CORE.safeExecute(

                    async () => {

                        await FIREBASE_ENGINE

                            .NETWORK

                            .reconnect();

                    }

                );

            }

        );

    }

};

/**
 * =========================================================
 * Cloud Data Pipeline
 * =========================================================
 */
const CLOUD_PIPELINE = {

    async fetchAndRenderCatalog() {

        const container = DOM.get(

            REGISTRY.DOM.HOMEPAGE.DYNAMIC_CONTENT.id

        );

        if (!container) {

            error(

                'Homepage Dynamic Content Container Missing'

            );

            return;

        }

        info(

            'Executing Cloud Data Pipeline Catalog Fetch'

        );

        try {

            const menuData =

                SYSTEM_CORE.STATE.get(

                    REGISTRY.STATE.MENU.key

                ) || [];

            if (!menuData.length) {

                DOM.html(

                    container,

                    '<div class="loading-state text-xs font-bold text-brandBlack/40 text-center py-8">جاري استعراض المنيو الفاخر...</div>'

                );

                return;

            }

            let htmlBuffer =

                '<div class="bose-dynamic-grid">';

            menuData.forEach(item => {

                if (item.hidden) {

                    return;

                }

                const isOutOfStock =

                    SYSTEM_CORE.STATE.get(

                        REGISTRY.STATE.OUT_OF_STOCK_ITEMS.key

                    )?.includes(item.id);

                const category =

                    String(

                        item.category || ''

                    ).toLowerCase();

                let gridClass =

                    'bose-full-card bose-full-card-row';

                if (

                    category === 'donuts' ||

                    category === 'cinnabon' ||

                    item.name?.includes('دوناتس') ||

                    item.name?.includes('سينابون') ||

                    category === 'حلويات'

                ) {

                    gridClass =

                        'bose-full-card';

                }

                htmlBuffer += `

                    <div class="${gridClass} ${isOutOfStock ? 'opacity-60 relative' : ''}" onclick="${isOutOfStock ? '' : `BoseSweetsEngine.viewProductDetails('${item.id}')`}">

                        <div class="card-image-section relative w-full aspect-square bg-brandPinkLight overflow-hidden">

                            <img
                                class="lazy-product-image absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
                                data-src="${item.image || ''}"
                                alt="${item.name || ''}"
                                loading="lazy"
                                decoding="async"
                            />

                            <span class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-brandPink/15 text-brandPink text-[10px] font-black px-2.5 py-1 rounded-full">${item.category}</span>

                            ${isOutOfStock ? `
                                <div class="absolute inset-0 bg-brandBlack/40 flex items-center justify-center text-white font-extrabold text-xs">
                                    نفذت الكمية مؤقتاً 🛑
                                </div>
                            ` : ''}

                        </div>

                        <div class="card-content-section p-5 flex flex-col justify-between flex-grow space-y-4">

                            <div class="space-y-1.5">

                                <h3 class="text-xs font-extrabold text-brandBlack line-clamp-1">
                                    ${item.name || ''}
                                </h3>

                                <p class="text-[11px] text-brandBlack/50 font-medium line-clamp-2 leading-relaxed">
                                    ${item.description || item.desc || ''}
                                </p>

                            </div>

                            <div class="flex items-center justify-between pt-2 border-t border-brandPink/5 gap-3">

                                <span class="text-brandPink font-black text-sm tracking-tight">
                                    ${item.price || 0} ج.م
                                </span>

                                <span class="text-[10px] font-bold text-brandBlack/40 bg-brandPinkLight px-2 py-0.5 rounded-md">
                                    ${item.unit || 'معياري فاخر'}
                                </span>

                            </div>

                        </div>

                    </div>

                `;

            });

            htmlBuffer += '</div>';

            UI_PERFORMANCE.VIRTUAL_RENDERER.diff(

                container,

                htmlBuffer

            );

            UI_PERFORMANCE.LAZY_IMAGES.observeAll(

                '.lazy-product-image'

            );

        } catch (ex) {

            error(

                'Failure inside Cloud Data Pipeline Render Engine',

                {

                    exception: ex

                }

            );

        }

    }

};

/**
 * =========================================================
 * Interactive Builders
 * =========================================================
 */

const INTERACTIVE_BUILDERS = {

    initializeSimulators() {

        info(

            'Synthesizing Interactive Builders Simulators Contexts'

        );

        EVENTS.on(

            REGISTRY.EVENTS.VIEW.CHANGED,

            (payload) => {

                if (

                    payload.view === 'cake-builder'

                ) {

                    this.syncCakeBuilderSimulator();

                } else if (

                    payload.view === 'rose-builder'

                ) {

                    this.syncRoseBuilderSimulator();

                }

            }

        );

    },

    syncCakeBuilderSimulator() {

        const priceDisplay = DOM.get(

            REGISTRY.DOM.CAKE.PRICE_DISPLAY.id

        );

        const peopleInput = DOM.get(

            REGISTRY.DOM.CAKE.PEOPLE_COUNT.id

        );

        if (

            !priceDisplay ||

            !peopleInput

        ) {

            return;

        }

        const updateLivePrice = () => {

            if (window.BoseSweetsEngine) {

                window.BoseSweetsEngine.updateCakePriceDisplay();

            }

        };

        const observer =

            new MutationObserver(

                updateLivePrice

            );

        observer.observe(

            peopleInput,

            {

                childList: true,

                characterData: true,

                subtree: true

            }

        );

        peopleInput.addEventListener(

            'input',

            UI_PERFORMANCE.INTERACTION.throttle(

                updateLivePrice,

                100

            ),

            {

                passive: true

            }

        );

    },

    syncRoseBuilderSimulator() {

        const priceDisplay = DOM.get(

            REGISTRY.DOM.ROSE.PRICE_DISPLAY.id

        );

        const countInput = DOM.get(

            REGISTRY.DOM.ROSE.COUNT.id

        );

        if (

            !priceDisplay ||

            !countInput

        ) {

            return;

        }

        const updateLivePrice = () => {

            if (window.BoseSweetsEngine) {

                window.BoseSweetsEngine.updateRosePriceDisplay();

            }

        };

        const observer =

            new MutationObserver(

                updateLivePrice

            );

        observer.observe(

            countInput,

            {

                childList: true,

                characterData: true,

                subtree: true

            }

        );

        countInput.addEventListener(

            'input',

            UI_PERFORMANCE.INTERACTION.throttle(

                updateLivePrice,

                100

            ),

            {

                passive: true

            }

        );

    }

};

/**
 * =========================================================
 * Bootstrap
 * =========================================================
 */

async function boot() {

    if (__RUNTIME__.booted) {

        return true;

    }

    info(

        'Enterprise UX Engine Boot Started'

    );

    await UI_PERFORMANCE.boot();

    OFFLINE.detect();

    INTERACTIVE_BUILDERS.initializeSimulators();

    EVENTS.on(

        REGISTRY.EVENTS.MENU.UPDATED,

        async () => {

            await CLOUD_PIPELINE.fetchAndRenderCatalog();

        }

    );

    EVENTS.on(

        REGISTRY.EVENTS.MENU.STOCK_CHANGED,

        async () => {

            await CLOUD_PIPELINE.fetchAndRenderCatalog();

        }

    );

    __RUNTIME__.initialized = true;

    __RUNTIME__.booted = true;

    EVENTS.emit(

        REGISTRY.EVENTS.SYSTEM.READY,

        {

            runtime: 'UNIFIED_ENGINE',

            status: 'READY'

        }

    );

    info(

        'Enterprise UX Engine Ready'

    );

    return true;

}

/**
 * =========================================================
 * Cleanup
 * =========================================================
 */

function cleanup() {

    UI_PERFORMANCE.cleanup();

    __SECTIONS__.clear();

    __NAVIGATION_STACK__.length = 0;

    __LIFECYCLES__.clear();

    info(

        'Unified Engine Cleanup Completed'

    );

}

/**
 * =========================================================
 * Public API
 * =========================================================
 */

export const UNIFIED_ENGINE = Object.freeze({

    VERSION: ENGINE_VERSION,

    boot,

    DOM,

    EVENTS,

    NAVIGATION,

    SECTIONS,

    OFFLINE,

    CLOUD_PIPELINE,

    INTERACTIVE_BUILDERS,

    UI_PERFORMANCE,

    cleanup

});

/**
 * =========================================================
 * Auto Bootstrap
 * =========================================================
 */

SYSTEM_CORE.safeExecute(async () => {

    await boot();

});

/**
 * =========================================================
 * Window Cleanup
 * =========================================================
 */

window.addEventListener(

    'beforeunload',

    cleanup

);

/**
 * =========================================================
 * Export
 * =========================================================
 */

export default UNIFIED_ENGINE;
