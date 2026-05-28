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

export class BoseSweetsAppManager {

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
     * Navigation & UI Sidebar Control (CRITICAL FIX)
     * =========================================================
     */

    toggleSidebar(isOpen = false) {
        const sidebar = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.GLOBAL.SIDEBAR.id);
        const overlay = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.GLOBAL.SIDEBAR_OVERLAY.id);

        if (!sidebar || !overlay) {
            return;
        }

        if (isOpen) {
            sidebar.classList.remove('translate-x-full');
            overlay.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            sidebar.classList.add('translate-x-full');
            overlay.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    /**
     * =========================================================
     * Realtime Catalog Search Processing (CRITICAL FIX)
     * =========================================================
     */

    handleSearch(event) {
        if (!event || !event.target) return;
        const query = String(event.target.value || '').toLowerCase().trim();
        
        const container = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.HOMEPAGE.DYNAMIC_CONTENT.id);
        if (!container) return;

        if (!query) {
            UNIFIED_ENGINE.CLOUD_PIPELINE.fetchAndRenderCatalog();
            return;
        }

        const filteredItems = this.menuData.filter(item => {
            return String(item.name || '').toLowerCase().includes(query) || 
                   String(item.desc || '').toLowerCase().includes(query);
        });

        if (filteredItems.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-16 text-center">
                    <p class="text-xs font-bold text-brandBlack/40">لا توجد نتائج تطابق بحثكم الفاخر حالياً...</p>
                </div>
            `;
            return;
        }

        // رندرة العناصر المفلترة بناءً على نظام القوالب الشبكية الموحدة لـ BoseSweets
        const outOfStockList = SYSTEM_CORE.STATE.get(REGISTRY.STATE.OUT_OF_STOCK_ITEMS.key) || [];
        let htmlBuffer = '<div class="bose-dynamic-grid bose-dynamic-grid-dual">';

        filteredItems.forEach(item => {
            if (item.hidden || item.status === 'hidden') return;
            const isOutOfStock = outOfStockList.includes(item.id);
            const category = String(item.category || '').toLowerCase();
            
            let gridClass = 'bose-full-card bose-full-card-row';
            if (category.includes('donut') || category.includes('cinnabon') || category.includes('sweet') || category.includes('حلو')) {
                gridClass = 'bose-full-card';
            }

            htmlBuffer += `
                <div class="${gridClass} ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}" onclick="${isOutOfStock ? '' : `BoseSweetsEngine.viewProductDetails('${item.id}')`}">
                    <div class="card-image-section relative w-full aspect-square bg-brandPinkLight overflow-hidden">
                        <img class="absolute inset-0 w-full h-full object-cover" src="${item.image}" alt="${item.name}" />
                    </div>
                    <div class="card-content-section p-6 flex flex-col justify-between flex-grow space-y-4">
                        <div class="space-y-1.5">
                            <h3 class="text-xs font-extrabold text-brandBlack line-clamp-1">${item.name}</h3>
                            <p class="text-[11px] text-brandBlack/50 line-clamp-2 leading-relaxed">${item.desc || ''}</p>
                        </div>
                        <div class="flex items-center justify-between pt-2 border-t border-brandPink/5 gap-3">
                            <span class="text-brandPink font-black text-sm">${item.price} ج.م</span>
                        </div>
                    </div>
                </div>
            `;
        });

        htmlBuffer += '</div>';
        container.innerHTML = htmlBuffer;
    }

    /**
     * =========================================================
     * Cake Simulator UI Interactivity Controls
     * =========================================================
     */

    selectCakeBase(baseValue) {
        this.cakeCustomState.base = baseValue;
        const bases = ['فانيليا', 'شوكولاتة', 'نصف ونصف'];
        bases.forEach(b => {
            const btn = UNIFIED_ENGINE.DOM.get(`cake-base-${b}`);
            if (btn) {
                if (b === baseValue) {
                    btn.className = "p-4 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-extrabold shadow-sm transition-all duration-300 text-center";
                } else {
                    btn.className = "p-4 rounded-2xl border border-brandPink/10 bg-white hover:border-brandPink/30 text-brandBlack/70 text-xs font-extrabold transition-all duration-300 text-center";
                }
            }
        });
        const notif = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.BASE_NOTIFICATION.id);
        if (notif) notif.classList.remove('hidden');
    }

    selectCakeShape(shapeValue) {
        this.cakeCustomState.shape = shapeValue;
        const shapes = ['دائرة', 'قلب', 'مربع', 'مستطيل'];
        shapes.forEach(s => {
            const btn = UNIFIED_ENGINE.DOM.get(`cake-shape-${s}`);
            if (btn) {
                if (s === shapeValue) {
                    btn.className = "p-3.5 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-extrabold transition-all duration-300 text-center";
                } else {
                    btn.className = "p-3.5 rounded-2xl border border-brandPink/10 bg-white hover:border-brandPink/30 text-brandBlack/70 text-xs font-extrabold transition-all duration-300 text-center";
                }
            }
        });

        const hint = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.SHAPE_HINT.id);
        if (hint) {
            if (shapeValue === 'مربع') {
                hint.textContent = "🛑 تورتات الشكل المربع تبدأ هندسياً من 16 فرد كحد أدنى للمطابقة.";
                hint.classList.remove('hidden');
                if (this.cakeCustomState.people < 16) this.adjustCakePeople(16 - this.cakeCustomState.people);
            } else if (shapeValue === 'مستطيل') {
                hint.textContent = "🛑 تورتات الشكل المستطيل العائلي تبدأ من 20 فرد كحد أدنى للمطابقة الفنية.";
                hint.classList.remove('hidden');
                if (this.cakeCustomState.people < 20) this.adjustCakePeople(20 - this.cakeCustomState.people);
            } else {
                hint.classList.add('hidden');
            }
        }
        this.updateCakePriceDisplay();
    }

    adjustCakePeople(amount) {
        let current = this.cakeCustomState.people + amount;
        if (this.cakeCustomState.shape === 'مربع' && current < 16) current = 16;
        if (this.cakeCustomState.shape === 'مستطيل' && current < 20) current = 20;
        if (current < 4) current = 4;
        if (current > 250) current = 250;

        this.cakeCustomState.people = current;
        const countDisplay = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.PEOPLE_COUNT.id);
        if (countDisplay) countDisplay.textContent = current;
        
        this.updateCakePriceDisplay();
    }

    selectCakePrintOption(option) {
        this.cakeCustomState.print = option;
        const options = ['none', 'edible', 'none-edible'];
        options.forEach(opt => {
            const btn = UNIFIED_ENGINE.DOM.get(`cake-print-${opt === 'none-edible' ? 'non-edible' : opt}`);
            if (btn) {
                if (opt === option) {
                    btn.className = "p-3.5 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-bold transition-all text-center";
                } else {
                    btn.className = "p-3.5 rounded-2xl border border-brandPink/10 bg-white text-brandBlack/70 text-xs font-bold transition-all text-center hover:border-brandPink/30";
                }
            }
        });

        const uploadArea = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.PRINT_UPLOAD_AREA.id);
        if (uploadArea) {
            if (option !== 'none') {
                uploadArea.classList.remove('hidden');
            } else {
                uploadArea.classList.add('hidden');
            }
        }
        this.updateCakePriceDisplay();
    }

    navigateCakeStep(stepNum) {
        const screens = [1, 2, 3];
        screens.forEach(s => {
            const screen = UNIFIED_ENGINE.DOM.get(`cake-screen-${s}`);
            const line = UNIFIED_ENGINE.DOM.get(`cake-line-${s}`);
            const ind = UNIFIED_ENGINE.DOM.get(`cake-step-${s}-indicator`);
            const txt = UNIFIED_ENGINE.DOM.get(`cake-text-step-${s}`);

            if (screen) {
                if (s === stepNum) screen.classList.remove('hidden');
                else screen.classList.add('hidden');
            }

            if (line && s < stepNum) line.style.width = '100%';
            if (line && s >= stepNum) line.style.width = '0%';

            if (ind) {
                if (s <= stepNum) {
                    ind.className = "w-10 h-10 rounded-full bg-brandPink text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-brandPink/20";
                } else {
                    ind.className = "w-10 h-10 rounded-full bg-brandPinkLight text-brandBlack/40 border border-brandPink/15 flex items-center justify-center font-extrabold text-sm";
                }
            }
        });
    }

    toggleCakeCardInput() {
        const check = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.CARD_CHECK.id);
        const area = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.CARD_INPUT_AREA.id);
        if (check && area) {
            if (check.checked) area.classList.remove('hidden');
            else area.classList.add('hidden');
        }
    }

    handleCakeFileUpload(type) {
        const labelId = type === 'design' ? REGISTRY.DOM.CAKE.DESIGN_LABEL.id : REGISTRY.DOM.CAKE.PRINT_LABEL.id;
        const label = UNIFIED_ENGINE.DOM.get(labelId);
        if (label) label.textContent = "✨ تم اختيار وإدراج الملف بنجاح للمطابقة السحابية الفورية.";
    }

    addCakeToCart() {
        COMMERCE_ENGINE.CAKE.set({
            base: this.cakeCustomState.base,
            shape: this.cakeCustomState.shape,
            people: this.cakeCustomState.people,
            printOption: this.cakeCustomState.print,
            theme: UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.THEME_DETAILS.id)?.value || '',
            allergies: UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.ALLERGIES.id)?.value || '',
            writing: UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.TEXT_INPUT.id)?.value || '',
            cardEnabled: UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.CARD_CHECK.id)?.checked || false,
            cardText: UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.CARD_TEXT.id)?.value || ''
        });

        COMMERCE_ENGINE.CAKE.addToCart();
        this.cart = COMMERCE_ENGINE.CART.getItems();
        SYSTEM_CORE.STATE.set(REGISTRY.STATE.CART.key, this.cart);
        this.updateCartBadge();
        this.navigateTo('cart');
    }

    showCakePriceInfo() {
        alert("تعتمد ميزانية التورت الملكية المخصصة على قنوات عادلة بمقدار 145 ج.م للفرد الواحد شاملة التجهيز والخامات الطبيعية 100%.");
    }

    /**
     * =========================================================
     * Rose Simulator UI Interactivity Controls
     * =========================================================
     */

    handleRoseReferenceUpload() {
        const label = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.REFERENCE_LABEL.id);
        if (label) label.textContent = "✨ تم اعتماد الصورة المرجعية لتنسيق باقة الورد الفاخرة بالكامل.";
    }

    quickBuyRoseBouquet() {
        this.addRoseToCart();
    }

    adjustRoseCount(amount) {
        let current = this.roseCustomState.count + amount;
        if (current < 15) current = 15;
        if (current > 500) current = 500;
        this.roseCustomState.count = current;
        const display = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.COUNT.id);
        if (display) display.textContent = current;
        this.updateRosePriceDisplay();
    }

    selectRoseType(typeValue) {
        this.roseCustomState.type = typeValue;
        const types = ['ورد طبيعي', 'صناعي', 'ستان'];
        types.forEach(t => {
            const btn = UNIFIED_ENGINE.DOM.get(`rose-type-${t}`);
            if (btn) {
                if (t === typeValue) {
                    btn.className = "p-3.5 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-extrabold transition-all text-center";
                } else {
                    btn.className = "p-3.5 rounded-2xl border border-brandPink/10 bg-white text-brandBlack/70 text-xs font-extrabold transition-all text-center hover:border-brandPink/30";
                }
            }
        });
        this.updateRosePriceDisplay();
    }

    calculateRoseCash() {
        const val = Number(UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CASH_AMOUNT.id)?.value || 0);
        this.roseCustomState.cash = val;
        const output = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CASH_OUTPUT.id);
        const txt = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CASH_CALC_TEXT.id);
        if (val > 0 && output && txt) {
            const papers = Math.ceil(val / this.roseCustomState.denomination);
            txt.innerHTML = `💸 سيتم لف وتنسيق المبلغ فنيًا بعدد <span class="text-brandPink font-black">${papers}</span> ورقة نقدية من فئة <span class="text-brandPink font-black">${this.roseCustomState.denomination} ج.م</span> وسط الورد.`;
            output.classList.remove('hidden');
        } else if (output) {
            output.classList.add('hidden');
        }
        this.updateRosePriceDisplay();
    }

    selectRoseDenomination(denom) {
        this.roseCustomState.denomination = denom;
        const denoms = [5, 10, 20, 50, 100, 200];
        denoms.forEach(d => {
            const btn = UNIFIED_ENGINE.DOM.get(`rose-denom-${d}`);
            if (btn) {
                if (d === denom) {
                    btn.className = "py-2 rounded-xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-bold transition-all text-center";
                } else {
                    btn.className = "py-2 rounded-xl border border-brandPink/10 text-brandBlack text-xs font-bold transition-all text-center bg-white hover:border-brandPink/20";
                }
            }
        });
        this.calculateRoseCash();
    }

    adjustRosePhotos(amount) {
        let current = this.roseCustomState.photos + amount;
        if (current < 0) current = 0;
        if (current > 12) current = 12;
        this.roseCustomState.photos = current;
        const display = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.PHOTOS_COUNT.id);
        if (display) display.textContent = current;

        const container = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.PHOTO_UPLOADS_CONTAINER.id);
        if (container) {
            if (current > 0) {
                container.classList.remove('hidden');
                let html = '';
                for (let i = 0; i < current; i++) {
                    html += `
                        <div class="relative border border-dashed border-brandPink/30 rounded-xl p-3 bg-brandPinkLight/20 text-center text-[10px] font-bold">
                            <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer">
                            <i class="fa-solid fa-camera text-brandPink block mb-1"></i> صورة ${i+1}
                        </div>
                    `;
                }
                container.innerHTML = html;
            } else {
                container.classList.add('hidden');
            }
        }
        this.updateRosePriceDisplay();
    }

    toggleRoseRibbonInput() {
        const check = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.RIBBON_CHECK.id);
        const area = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.RIBBON_INPUT_AREA.id);
        if (check && area) {
            if (check.checked) {
                area.classList.remove('hidden');
                this.roseCustomState.ribbon = true;
            } else {
                area.classList.add('hidden');
                this.roseCustomState.ribbon = false;
            }
        }
        this.updateRosePriceDisplay();
    }

    calculateRoseChocolate() {
        const val = Number(UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CHOC_BUDGET.id)?.value || 0);
        this.roseCustomState.chocBudget = val;
        const output = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CHOC_OUTPUT.id);
        const txt = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CHOC_CALC_TEXT.id);
        if (val > 0 && output && txt) {
            const pieces = Math.floor(val / this.roseCustomState.chocPiecePrice);
            txt.innerHTML = `🍫 الميزانية توفر إدراج وتثبيت حوالي <span class="text-brandPink font-black">${pieces}</span> قطعة شوكولاتة فاخرة فئة <span class="text-brandPink font-black">${this.roseCustomState.chocPiecePrice} جنيه</span> داخل التنسيق الفني للباقة.`;
            output.classList.remove('hidden');
        } else if (output) {
            output.classList.add('hidden');
        }
        this.updateRosePriceDisplay();
    }

    selectRoseChocPiecePrice(priceValue) {
        this.roseCustomState.chocPiecePrice = priceValue;
        const options = [20, 30, 50];
        options.forEach(o => {
            const btn = UNIFIED_ENGINE.DOM.get(`rose-choc-piece-${o}`);
            if (btn) {
                if (o === priceValue) {
                    btn.className = "py-2.5 rounded-xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-bold transition-all text-center";
                } else {
                    btn.className = "py-2.5 rounded-xl border border-brandPink/10 bg-white text-brandBlack/70 text-xs font-bold transition-all text-center hover:border-brandPink/20";
                }
            }
        });
        this.calculateRoseChocolate();
    }

    adjustRosePremiumBar(barType, amount) {
        let current = this.roseCustomState.premiumBars[barType] + amount;
        if (current < 0) current = 0;
        if (current > 10) current = 10;
        this.roseCustomState.premiumBars[barType] = current;
        const display = UNIFIED_ENGINE.DOM.get(barType === 100 ? REGISTRY.DOM.ROSE.PREMIUM_BAR_100.id : REGISTRY.DOM.ROSE.PREMIUM_BAR_120.id);
        if (display) display.textContent = current;
        this.updateRosePriceDisplay();
    }

    toggleRoseCardInput() {
        const check = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CARD_CHECK.id);
        const area = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CARD_INPUT_AREA.id);
        if (check && area) {
            if (check.checked) {
                area.classList.remove('hidden');
                this.roseCustomState.card = true;
            } else {
                area.classList.add('hidden');
                this.roseCustomState.card = false;
            }
        }
        this.updateRosePriceDisplay();
    }

    navigateRoseStep(stepNum) {
        const screens = [1, 2, 3];
        screens.forEach(s => {
            const screen = UNIFIED_ENGINE.DOM.get(`rose-screen-${s}`);
            const line = UNIFIED_ENGINE.DOM.get(`rose-line-${s}`);
            const ind = UNIFIED_ENGINE.DOM.get(`rose-step-${s}-indicator`);

            if (screen) {
                if (s === stepNum) screen.classList.remove('hidden');
                else screen.classList.add('hidden');
            }

            if (line && s < stepNum) line.style.width = '100%';
            if (line && s >= stepNum) line.style.width = '0%';

            if (ind) {
                if (s <= stepNum) {
                    ind.className = "w-10 h-10 rounded-full bg-brandPink text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-brandPink/20";
                } else {
                    ind.className = "w-10 h-10 rounded-full bg-brandPinkLight text-brandBlack/40 border border-brandPink/15 flex items-center justify-center font-extrabold text-sm";
                }
            }
        });
    }

    addRoseToCart() {
        COMMERCE_ENGINE.ROSE.set({
            count: this.roseCustomState.count,
            type: this.roseCustomState.type,
            colors: UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.COLORS_INPUT.id)?.value || '',
            cashAmount: this.roseCustomState.cash,
            cashDenomination: this.roseCustomState.denomination,
            photosCount: this.roseCustomState.photos,
            ribbonEnabled: this.roseCustomState.ribbon,
            ribbonText: UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.RIBBON_TEXT.id)?.value || '',
            chocBudget: this.roseCustomState.chocBudget,
            chocPiecePrice: this.roseCustomState.chocPiecePrice,
            premiumBar100: this.roseCustomState.premiumBars[100],
            premiumBar120: this.roseCustomState.premiumBars[120],
            cardEnabled: this.roseCustomState.card,
            cardText: UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CARD_TEXT.id)?.value || ''
        });

        COMMERCE_ENGINE.ROSE.addToCart();
        this.cart = COMMERCE_ENGINE.CART.getItems();
        SYSTEM_CORE.STATE.set(REGISTRY.STATE.CART.key, this.cart);
        this.updateCartBadge();
        this.navigateTo('cart');
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

    handleRegionChange() {
        const select = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.SHIPPING_REGION.id);
        if (!select) return;
        
        const region = select.value;
        COMMERCE_ENGINE.CHECKOUT.set({ region });
        
        this.renderCheckoutView();
    }

    async handleCheckoutSubmit(event) {
        if (event) event.preventDefault();

        try {
            const name = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.CUSTOMER_NAME.id)?.value;
            const phone = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.CUSTOMER_PHONE.id)?.value;
            const address = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.SHIPPING_ADDRESS.id)?.value;

            COMMERCE_ENGINE.CHECKOUT.set({
                method: 'shipping',
                customerName: name,
                customerPhone: phone,
                addressDetails: address
            });

            const orderId = await COMMERCE_ENGINE.CHECKOUT.submit({
                clientTimestamp: Date.now()
            });

            // إنشاء وهندسة رسالة الواتساب الفاخرة للعلامة التجارية بدون ألقاب أو رسميات جافة
            const calc = COMMERCE_ENGINE.PRICING.calculateCartTotal();
            let text = `✨ *طلب شراء جديد معتمد - حلويات بوسي* ✨\n\n`;
            text += `📝 *بيانات العميل:* ${name}\n`;
            text += `📞 *رقم الهاتف:* ${phone}\n`;
            text += `📍 *المنطقة والتسليم:* ${COMMERCE_ENGINE.CHECKOUT.get().region} - ${address}\n\n`;
            text += `🛒 *المنتجات المعتمدة في السلة:*\n`;
            
            this.cart.forEach((item, index) => {
                text += `${index + 1}. ${item.name} (${item.price} ج.م) ${item.details?.identity ? `\n   [${item.details.identity}]` : ''}\n`;
            });

            text += `\n💰 *إجمالي قيمة الفاتورة النهائي:* ${calc.total} ج.م\n`;
            text += `🚚 *شحن مبرد آمن:* ${calc.shipping} ج.م\n\n`;
            text += `🏁 جاري تجهيز الطلب ومطابقة المواصفات الفنية بمصنعنا في الفرافرة.`;

            const encodedText = encodeURIComponent(text);
            window.open(`https://wa.me/201097238441?text=${encodedText}`, '_blank');
            
            this.clearCart();
            this.navigateTo('home');

        } catch (err) {
            alert(`فشل حجز المعاملة: ${err.message}`);
        }
    }

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
 * Runtime Export (CRITICAL SYNCHRONIZATION FIX)
 * =========================================================
 */

const manager = new BoseSweetsAppManager();

window.BoseSweetsEngine = manager;
window.BoseSweets = manager;

export default manager;
