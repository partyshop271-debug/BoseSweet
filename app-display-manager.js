/**
 * =========================================================
 * Bose Sweets — Enterprise UI Display Manager
 * =========================================================
 * File               : app-display-manager.js
 * Architecture Level : ENTERPRISE UI PERFORMANCE LAYER
 * Runtime Level      : SELF-HEALING GOVERNED DISPLAY ENGINE
 * Stability Level    : MAXIMUM PRODUCTION
 * Mobile Optimized   : ULTRA LOW MEMORY FOOTPRINT
 * =========================================================
 */

'use strict';

import REGISTRY from './system-registry.js';
import SYSTEM_CORE from './system-core.js';
import FIREBASE_ENGINE from './firebase-engine.js';
import COMMERCE_ENGINE from './commerce-engine.js';
import UNIFIED_ENGINE from './unified-engine.js';

class BoseSweetsAppManager {

    constructor() {

        /**
         * =====================================================
         * Runtime State
         * =====================================================
         */

        this.currentView = 'home';

        this.menuData = [];

        this.globalConfig = {};

        this.cart = [];

        this.selectedShippingCost = 0;

        this.activeListeners = [];

        this.renderLocked = false;

        this.lastRenderHash = '';

        this.destroyed = false;

        this.initialized = false;

        /**
         * =====================================================
         * Cake State
         * =====================================================
         */

        this.cakeCustomState = {

            base: 'فانيليا',

            shape: 'دائرة',

            people: 4,

            print: 'none'

        };

        /**
         * =====================================================
         * Rose State
         * =====================================================
         */

        this.roseCustomState = {

            type: 'ورد طبيعي',

            count: 15,

            cash: 0,

            denomination: 20,

            photos: 0,

            ribbon: false,

            chocBudget: 0,

            chocPiecePrice: 20,

            premiumBars: {

                100: 0,

                120: 0

            },

            card: false

        };

    }

    /**
     * =========================================================
     * Bootstrap
     * =========================================================
     */

    init() {

        if (this.initialized) {

            return true;

        }

        /**
         * =====================================================
         * Early Window Reservation
         * =====================================================
         */

        window.BoseSweetsEngine = this;
        window.BoseSweets = this;

        SYSTEM_CORE.Diagnostics.info(
            '[DISPLAY_MANAGER] Enterprise Display Runtime Initializing'
        );

        try {

            this.syncWithCoreState();

            this.activateRealtimeCloudSync();

            this.bindRuntimeEvents();

            this.populateShippingRegions();

            this.renderMenuCategories();

            this.initialized = true;

            SYSTEM_CORE.Diagnostics.info(
                '[DISPLAY_MANAGER] Enterprise Display Runtime Ready'
            );

            return true;

        } catch (error) {

            SYSTEM_CORE.Diagnostics.error(
                '[DISPLAY_MANAGER] Initialization Failure',
                { error }
            );

            return false;

        }

    }

    /**
     * =========================================================
     * Runtime Events
     * =========================================================
     */

    bindRuntimeEvents() {

        SYSTEM_CORE.EVENTS.on(

            REGISTRY.EVENTS.SYSTEM.READY,

            () => {

                this.safeRender();

            }

        );

        SYSTEM_CORE.EVENTS.on(

            REGISTRY.EVENTS.MENU.UPDATED,

            (payload) => {

                if (
                    payload &&
                    Array.isArray(payload.menu)
                ) {

                    this.menuData = payload.menu;

                    this.safeRender();

                }

            }

        );

        SYSTEM_CORE.EVENTS.on(

            REGISTRY.EVENTS.CART.UPDATED,

            () => {

                this.updateCartBadge();

            }

        );

    }

    /**
     * =========================================================
     * Core Sync
     * =========================================================
     */

    syncWithCoreState() {

        try {

            const menu = SYSTEM_CORE.STATE.get(
                REGISTRY.STATE.MENU.key
            );

            if (Array.isArray(menu)) {

                this.menuData = menu;

            }

            const cart = SYSTEM_CORE.STATE.get(
                REGISTRY.STATE.CART.key
            );

            if (Array.isArray(cart)) {

                this.cart = cart;

            }

        } catch (error) {

            SYSTEM_CORE.Diagnostics.error(
                '[DISPLAY_MANAGER] State Sync Failure',
                { error }
            );

        }

    }

    /**
     * =========================================================
     * Firebase Sync
     * =========================================================
     */

    activateRealtimeCloudSync() {

        /**
         * =====================================================
         * Global Config Watcher
         * =====================================================
         */

        const unsubscribeConfig = FIREBASE_ENGINE.WATCHERS.document(

            REGISTRY.FIREBASE.SETTINGS.GLOBAL_CONFIG,

            (config) => {

                try {

                    if (
                        !config ||
                        typeof config !== 'object'
                    ) {

                        return;

                    }

                    this.globalConfig = {

                        ...this.globalConfig,

                        ...config

                    };

                    SYSTEM_CORE.STATE.set(

                        REGISTRY.STATE.SYSTEM_STATUS.key,

                        this.globalConfig

                    );

                    this.updateStaticLabels();

                    this.updateCakePriceDisplay();

                    this.updateRosePriceDisplay();

                    this.updateGlobalUI();

                } catch (error) {

                    SYSTEM_CORE.Diagnostics.error(
                        '[DISPLAY_MANAGER] Global Config Sync Failure',
                        { error }
                    );

                }

            }

        );

        this.activeListeners.push(unsubscribeConfig);

        /**
         * =====================================================
         * Menu Watcher
         * =====================================================
         */

        const unsubscribeMenu = FIREBASE_ENGINE.WATCHERS.collection(

            REGISTRY.FIREBASE.COLLECTIONS.MENU,

            (cloudMenu) => {

                try {

                    /**
                     * =================================================
                     * CRITICAL FIX:
                     * Never stop rendering if Firebase responds empty
                     * =================================================
                     */

                    if (!Array.isArray(cloudMenu)) {

                        return;

                    }

                    this.menuData = cloudMenu
                        .filter(Boolean)
                        .map(item => this.normalizeMenuItem(item))
                        .filter(Boolean);

                    SYSTEM_CORE.STATE.set(
                        REGISTRY.STATE.MENU.key,
                        this.menuData
                    );

                    this.safeRender();

                } catch (error) {

                    SYSTEM_CORE.Diagnostics.error(
                        '[DISPLAY_MANAGER] Menu Sync Failure',
                        { error }
                    );

                }

            }

        );

        this.activeListeners.push(unsubscribeMenu);

    }

    /**
     * =========================================================
     * Normalize Menu Item
     * =========================================================
     */

    normalizeMenuItem(item = {}) {

        try {

            let computedPrice = 0;

            if (
                item.flavors &&
                item.flavors[0]
            ) {

                computedPrice =
                    Number(item.flavors[0].price) || 0;

            } else if (
                item.sizes &&
                item.sizes[0] &&
                item.sizes[0].flavors &&
                item.sizes[0].flavors[0]
            ) {

                computedPrice =
                    Number(
                        item.sizes[0]
                            .flavors[0]
                            .price
                    ) || 0;

            } else {

                computedPrice =
                    Number(item.price) || 0;

            }

            return {

                id:
                    item.id ||
                    crypto.randomUUID(),

                name:
                    item.name ||
                    'منتج فاخر',

                category:
                    item.category ||
                    'حلويات',

                price:
                    computedPrice || 150,

                image:
                    item.img ||
                    item.image ||
                    './assets/cake-placeholder.webp',

                img:
                    item.img ||
                    item.image ||
                    './assets/cake-placeholder.webp',

                desc:
                    item.desc ||
                    item.description ||
                    '',

                unit:
                    item.unit ||
                    'قطعة',

                hidden:
                    Boolean(item.hidden),

                status:
                    item.status ||
                    'visible'

            };

        } catch {

            return null;

        }

    }

    /**
     * =========================================================
     * Safe Render
     * =========================================================
     */

    safeRender() {

        if (this.renderLocked) {

            return;

        }

        this.renderLocked = true;

        requestAnimationFrame(() => {

            try {

                this.renderMenuCategories();

                this.updateCartBadge();

            } catch (error) {

                SYSTEM_CORE.Diagnostics.error(
                    '[DISPLAY_MANAGER] Render Failure',
                    { error }
                );

            } finally {

                this.renderLocked = false;

            }

        });

    }

    /**
     * =========================================================
     * Global UI
     * =========================================================
     */

    updateGlobalUI() {

        const footerPhone = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.GLOBAL.FOOTER_PHONE_DISPLAY.id
        );

        if (
            footerPhone &&
            this.globalConfig.phone
        ) {

            footerPhone.textContent =
                this.globalConfig.phone;

        }

        const marquee = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.GLOBAL.MARQUEE_CONTENT.id
        );

        if (
            marquee &&
            this.globalConfig.marqueeText
        ) {

            marquee.innerHTML =
                `<span>✨ ${this.globalConfig.marqueeText}</span>`.repeat(4);

        }

    }

    /**
     * =========================================================
     * Static Labels
     * =========================================================
     */

    updateStaticLabels() {

        const edibleBtn = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CAKE.PRINT_EDIBLE_BTN.id
        );

        if (edibleBtn) {

            edibleBtn.textContent =
                `قابلة للأكل (+${this.globalConfig.cakePrintEdiblePrice || 60} ج.م)`;

        }

        const nonEdibleBtn = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CAKE.PRINT_NON_EDIBLE_BTN.id
        );

        if (nonEdibleBtn) {

            nonEdibleBtn.textContent =
                `غير قابلة للأكل (+${this.globalConfig.cakePrintNonEdiblePrice || 20} ج.م)`;

        }

    }

    /**
     * =========================================================
     * Shipping
     * =========================================================
     */

    populateShippingRegions() {

        const select = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CHECKOUT.SHIPPING_REGION.id
        );

        if (!select) {

            return;

        }

        const rates =
            COMMERCE_ENGINE.SHIPPING.regions();

        select.innerHTML =
            '<option value="" disabled selected>اختر المنطقة...</option>' +
            Object.keys(rates)
                .map(region => {

                    return `
                        <option value="${region}">
                            ${region} (${rates[region]} ج.م)
                        </option>
                    `;

                })
                .join('');

    }

    /**
     * =========================================================
     * Navigation
     * =========================================================
     */

    navigateTo(viewId) {

        const views = [

            'home',

            'menu',

            'product',

            'cake-builder',

            'rose-builder',

            'cart',

            'checkout'

        ];

        if (!views.includes(viewId)) {

            return;

        }

        views.forEach(view => {

            const screen =
                UNIFIED_ENGINE.DOM.get(
                    `view-${view}`
                );

            if (screen) {

                screen.classList.add('hidden');

            }

        });

        const target =
            UNIFIED_ENGINE.DOM.get(
                `view-${viewId}`
            );

        if (target) {

            target.classList.remove('hidden');

        }

        this.currentView = viewId;

        window.scrollTo({

            top: 0,

            behavior: 'smooth'

        });

        if (viewId === 'cart') {

            this.renderCartView();

        }

        if (viewId === 'checkout') {

            this.renderCheckoutView();

        }

    }

    /**
     * =========================================================
     * Menu Rendering
     * =========================================================
     */

    renderMenuCategories() {

        /**
         * =====================================================
         * CRITICAL FIX:
         * Official Registry Contract ONLY
         * =====================================================
         */

        const grid = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.HOMEPAGE.MENU_GRID.id
        );

        if (!grid) {

            SYSTEM_CORE.Diagnostics.warn(
                '[DISPLAY_MANAGER] Menu Grid Missing'
            );

            return;

        }

        const outOfStock =
            SYSTEM_CORE.STATE.get(
                REGISTRY.STATE.OUT_OF_STOCK_ITEMS.key
            ) || [];

        /**
         * =====================================================
         * Empty State
         * =====================================================
         */

        if (
            !Array.isArray(this.menuData) ||
            this.menuData.length === 0
        ) {

            grid.innerHTML = `
                <div class="col-span-full py-16 text-center">
                    <div class="space-y-4">
                        <div class="w-20 h-20 mx-auto rounded-full bg-brandPinkLight flex items-center justify-center">
                            <i class="fa-solid fa-cake-candles text-brandPink text-3xl"></i>
                        </div>
                        <h3 class="text-sm font-black text-brandBlack">
                            جاري تحميل المنيو الفاخر...
                        </h3>
                    </div>
                </div>
            `;

            return;

        }

        /**
         * =====================================================
         * Categories
         * =====================================================
         */

        const categories = [

            'تورتات',

            'باقات الورد',

            'حلويات'

        ];

        grid.innerHTML = categories
            .map(category => {

                const items =
                    this.menuData.filter(item => {

                        const current =
                            String(
                                item.category || ''
                            ).toLowerCase();

                        if (category === 'تورتات') {

                            return (
                                current.includes('تورت') ||
                                current.includes('cake')
                            );

                        }

                        if (category === 'باقات الورد') {

                            return (
                                current.includes('ورد') ||
                                current.includes('rose')
                            );

                        }

                        if (category === 'حلويات') {

                            return (
                                current.includes('حلو') ||
                                current.includes('sweet')
                            );

                        }

                        return false;

                    });

                return `
                    <div class="bg-brandPinkLight/40 rounded-3xl p-6 border border-brandPink/10 space-y-4">

                        <h2 class="text-sm font-black text-brandBlack border-r-4 border-brandPink pr-2.5">
                            ${category}
                        </h2>

                        <div class="space-y-3">

                            ${items.map(item => {

                                const unavailable =
                                    outOfStock.includes(item.id);

                                return `
                                    <div
                                        class="
                                            flex
                                            items-center
                                            gap-3
                                            bg-white
                                            p-3
                                            rounded-2xl
                                            border
                                            border-brandPink/5
                                            hover:border-brandPink/20
                                            transition-colors
                                            cursor-pointer
                                            ${unavailable ? 'opacity-50' : ''}
                                        "

                                        onclick="
                                            ${unavailable
                                                ? ''
                                                : `BoseSweetsEngine.viewProductDetails('${item.id}')`
                                            }
                                        "
                                    >

                                        <img
                                            src="${item.image}"
                                            alt="${item.name}"
                                            class="
                                                w-14
                                                h-14
                                                rounded-xl
                                                object-cover
                                                flex-shrink-0
                                            "
                                        >

                                        <div class="flex-grow min-w-0">

                                            <h3 class="text-xs font-extrabold text-brandBlack truncate">
                                                ${item.name}
                                            </h3>

                                            <span class="text-brandPink font-black text-xs block mt-1">
                                                ${item.price} ج.م
                                            </span>

                                        </div>

                                    </div>
                                `;

                            }).join('')}

                        </div>

                    </div>
                `;

            })
            .join('');

    }

    /**
     * =========================================================
     * Product Details
     * =========================================================
     */

    viewProductDetails(productId) {

        const item =
            this.menuData.find(
                product => product.id === productId
            );

        if (!item) {

            return;

        }

        const container = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.PRODUCT.CONTAINER.id
        );

        if (!container) {

            return;

        }

        container.innerHTML = `
            <div class="bg-white rounded-[2rem] border border-brandPink/15 overflow-hidden shadow-sm p-6 space-y-6">

                <button
                    onclick="BoseSweetsEngine.navigateTo('menu')"
                    class="text-xs font-bold text-brandPink"
                >
                    العودة للمنيو
                </button>

                <div class="grid md:grid-cols-2 gap-8">

                    <div class="aspect-square overflow-hidden rounded-2xl bg-brandPinkLight">

                        <img
                            src="${item.image}"
                            alt="${item.name}"
                            class="w-full h-full object-cover"
                        >

                    </div>

                    <div class="space-y-6">

                        <div class="space-y-3">

                            <span class="inline-block px-3 py-1 bg-brandPinkLight rounded-full text-[10px] font-black text-brandPink">
                                ${item.category}
                            </span>

                            <h1 class="text-2xl font-black text-brandBlack">
                                ${item.name}
                            </h1>

                            <p class="text-xs leading-relaxed text-brandBlack/60">
                                ${item.desc}
                            </p>

                        </div>

                        <div class="flex items-center justify-between pt-6 border-t border-brandPink/10">

                            <span class="text-2xl font-black text-brandPink">
                                ${item.price} ج.م
                            </span>

                            <button
                                onclick="BoseSweetsEngine.addItemToCart('${item.id}')"
                                class="px-6 py-4 rounded-full bg-brandPink text-white text-xs font-black"
                            >
                                إضافة للسلة
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        `;

        this.navigateTo('product');

    }

    /**
     * =========================================================
     * Cart
     * =========================================================
     */

    addItemToCart(productId) {

        const item =
            this.menuData.find(
                product => product.id === productId
            );

        if (!item) {

            return;

        }

        COMMERCE_ENGINE.CART.add(item);

        this.cart =
            COMMERCE_ENGINE.CART.getItems();

        SYSTEM_CORE.STATE.set(
            REGISTRY.STATE.CART.key,
            this.cart
        );

        this.updateCartBadge();

        this.navigateTo('cart');

    }

    updateCartBadge() {

        const badge = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CART.BADGE.id
        );

        if (!badge) {

            return;

        }

        const total =
            COMMERCE_ENGINE.CART.count();

        if (total > 0) {

            badge.textContent = total;

            badge.classList.remove('hidden');

        } else {

            badge.classList.add('hidden');

        }

    }

    renderCartView() {

        const emptyState = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CART.EMPTY_STATE.id
        );

        const container = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CART.CONTAINER.id
        );

        const list = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CART.ITEMS.id
        );

        const total = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CART.TOTAL.id
        );

        if (
            !emptyState ||
            !container ||
            !list ||
            !total
        ) {

            return;

        }

        this.cart =
            COMMERCE_ENGINE.CART.getItems();

        if (this.cart.length === 0) {

            emptyState.classList.remove('hidden');

            container.classList.add('hidden');

            return;

        }

        emptyState.classList.add('hidden');

        container.classList.remove('hidden');

        list.innerHTML = this.cart.map(item => {

            return `
                <div class="p-4 rounded-2xl border border-brandPink/10 bg-white flex items-center justify-between">

                    <div>

                        <h3 class="text-xs font-black text-brandBlack">
                            ${item.name}
                        </h3>

                        <p class="text-[10px] text-brandBlack/50">
                            ${item.price} ج.م
                        </p>

                    </div>

                    <button
                        onclick="BoseSweetsEngine.removeCartItem('${item.uid}')"
                        class="text-brandPink"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>
            `;

        }).join('');

        total.textContent =
            `${COMMERCE_ENGINE.CART.subtotal()} ج.م`;

    }

    removeCartItem(uid) {

        COMMERCE_ENGINE.CART.remove(uid);

        this.cart =
            COMMERCE_ENGINE.CART.getItems();

        SYSTEM_CORE.STATE.set(
            REGISTRY.STATE.CART.key,
            this.cart
        );

        this.renderCartView();

        this.updateCartBadge();

    }

    clearCart() {

        COMMERCE_ENGINE.CART.clear();

        this.cart = [];

        SYSTEM_CORE.STATE.set(
            REGISTRY.STATE.CART.key,
            []
        );

        this.renderCartView();

        this.updateCartBadge();

    }

    /**
     * =========================================================
     * Checkout
     * =========================================================
     */

    renderCheckoutView() {

        const calculations =
            COMMERCE_ENGINE.PRICING
                .calculateCartTotal();

        const subtotal = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CHECKOUT.SUBTOTAL.id
        );

        const shipping = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CHECKOUT.SHIPPING.id
        );

        const total = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CHECKOUT.TOTAL.id
        );

        if (subtotal) {

            subtotal.textContent =
                `${calculations.subtotal} ج.م`;

        }

        if (shipping) {

            shipping.textContent =
                `${calculations.shipping} ج.م`;

        }

        if (total) {

            total.textContent =
                `${calculations.total} ج.م`;

        }

    }

    /**
     * =========================================================
     * Cake Pricing
     * =========================================================
     */

    updateCakePriceDisplay() {

        const price =
            COMMERCE_ENGINE.PRICING.cake({

                people:
                    this.cakeCustomState.people,

                printOption:
                    this.cakeCustomState.print

            });

        const display = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.CAKE.PRICE_DISPLAY.id
        );

        if (display) {

            display.textContent =
                `${price} ج.م`;

        }

    }

    /**
     * =========================================================
     * Rose Pricing
     * =========================================================
     */

    updateRosePriceDisplay() {

        const price =
            COMMERCE_ENGINE.PRICING.rose({

                count:
                    this.roseCustomState.count,

                photosCount:
                    this.roseCustomState.photos,

                ribbonEnabled:
                    this.roseCustomState.ribbon,

                cardEnabled:
                    this.roseCustomState.card,

                chocBudget:
                    this.roseCustomState.chocBudget,

                premiumBars:
                    this.roseCustomState.premiumBars,

                cashAmount:
                    this.roseCustomState.cash

            });

        const display = UNIFIED_ENGINE.DOM.get(
            REGISTRY.DOM.ROSE.PRICE_DISPLAY.id
        );

        if (display) {

            display.textContent =
                `${price} ج.م`;

        }

    }

    /**
     * =========================================================
     * Destroy
     * =========================================================
     */

    destroy() {

        this.activeListeners.forEach(unsubscribe => {

            try {

                if (
                    typeof unsubscribe === 'function'
                ) {

                    unsubscribe();

                }

            } catch {}

        });

        this.activeListeners = [];

        this.destroyed = true;

    }

}

/**
 * =========================================================
 * Runtime Export
 * =========================================================
 */

const manager = new BoseSweetsAppManager();

window.BoseSweetsEngine = manager;
window.BoseSweets = manager;

export default manager;