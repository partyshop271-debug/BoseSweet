/**
 * =========================================================
 * Bose Sweets — Commerce Infrastructure Engine
 * =========================================================
 * File               : commerce-engine.js
 * Architecture Level : VIP COMMERCE DOMAIN
 * Stability Level    : ENTERPRISE SAFE
 * Runtime Policy     : STRICT
 * Commerce Policy    : GOVERNED
 * Performance Mode   : MOBILE OPTIMIZED
 * =========================================================
 */

'use strict';

import REGISTRY from './system-registry.js';

import SYSTEM_CORE from './system-core.js';

import FIREBASE_ENGINE from './firebase-engine.js';

/**
 * =========================================================
 * Luxury Sensory Content - Identity Constants
 * =========================================================
 */
const DESPACITO_IDENTITY = Object.freeze({
    id: 'despacito',
    name: 'ديسباسيتو كيك الملكي',
    description: 'فدج كيك غني بالشوكولاتة البلجيكية الفاخرة خالي تماماً من الإضافات الإسفنجية الجافة'
});

/**
 * =========================================================
 * Internal Commerce Runtime
 * =========================================================
 */
const __COMMERCE_CACHE__ = {

    lastCalculation: null,

    shippingCalculation: null

};

const __LIMITS__ = Object.freeze({

    MAX_CART_ITEMS: 100,

    MAX_SINGLE_QTY: 50,

    MAX_CAKE_PEOPLE: 250,

    MIN_CAKE_PEOPLE: 4,

    MIN_SQUARE_CAKE_PEOPLE: 16,

    MIN_RECTANGLE_CAKE_PEOPLE: 20,

    MAX_ROSE_COUNT: 500,

    MIN_ROSE_COUNT: 15

});

/**
 * =========================================================
 * Diagnostics
 * =========================================================
 */
function logInfo(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.info(
        `[COMMERCE] ${message}`,
        metadata
    );

}

function logWarn(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.warn(
        `[COMMERCE] ${message}`,
        metadata
    );

}

function logError(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.error(
        `[COMMERCE] ${message}`,
        metadata
    );

}

/**
 * =========================================================
 * Helpers
 * =========================================================
 */
function deepClone(value) {

    try {

        return structuredClone(value);

    } catch {

        return JSON.parse(
            JSON.stringify(value)
        );

    }

}

function generateId(prefix = 'item') {

    return `${prefix}_${Date.now()}_${Math.random()}`;

}

function getState(key) {

    return SYSTEM_CORE.STATE.get(key);

}

function setState(key, value) {

    SYSTEM_CORE.STATE.set(key, value);

}

function emit(eventName, payload = {}) {

    SYSTEM_CORE.EVENTS.emit(
        eventName,
        payload
    );

}

/**
 * =========================================================
 * Cart Engine
 * =========================================================
 */
const CART = {

    getItems() {

        return deepClone(
            getState(
                REGISTRY.STATE.CART.key
            ) || []
        );

    },

    setItems(items = []) {

        setState(
            REGISTRY.STATE.CART.key,
            deepClone(items)
        );

        emit(
            REGISTRY.EVENTS.CART.UPDATED,
            {
                cart: deepClone(items)
            }
        );

    },

    count() {

        return CART
            .getItems()
            .reduce(
                (accumulator, item) =>
                    accumulator + (item.qty || 1),
                0
            );

    },

    subtotal() {

        return CART
            .getItems()
            .reduce(
                (accumulator, item) =>
                    accumulator + (
                        Number(item.price || 0)
                    ),
                0
            );

    },

    add(item = {}) {

        const cart =
            CART.getItems();

        if (
            cart.length >=
            __LIMITS__.MAX_CART_ITEMS
        ) {

            throw new Error(
                'Cart Limit Reached'
            );

        }

        // تفعيل الهوية الحسية المعتمدة للديسباسيتو لمنع تمرير أي وصف إسفنجي جاف
        const isDespacito = item.id === DESPACITO_IDENTITY.id || item.name?.includes('ديسباسيتو');

        const normalized = {

            uid: generateId('cart'),

            id: isDespacito ? DESPACITO_IDENTITY.id : (item.id || 'unknown'),

            name: isDespacito ? DESPACITO_IDENTITY.name : (item.name || 'Unnamed Product'),

            qty: Number(item.qty || 1),

            price: Number(item.price || 0),

            details: isDespacito 
                ? { ...deepClone(item.details || {}), identity: DESPACITO_IDENTITY.description } 
                : deepClone(item.details || {}),

            isCustom: Boolean(
                item.isCustom
            ),

            createdAt: Date.now()

        };

        cart.push(normalized);

        CART.setItems(cart);

        emit(
            REGISTRY.EVENTS.CART.ITEM_ADDED,
            normalized
        );

        return normalized;

    },

    remove(uid) {

        let cart =
            CART.getItems();

        cart = cart.filter(
            item => item.uid !== uid
        );

        CART.setItems(cart);

        emit(
            REGISTRY.EVENTS.CART.ITEM_REMOVED,
            {
                uid
            }
        );

    },

    clear() {

        CART.setItems([]);

        emit(
            REGISTRY.EVENTS.CART.CLEARED,
            {}
        );

    },

    validateAgainstStock() {

        const cart =
            CART.getItems();

        const outOfStock =
            getState(
                REGISTRY.STATE
                    .OUT_OF_STOCK_ITEMS
                    .key
            ) || [];

        const validCart =
            cart.filter((item) => {

                let normalizedId =
                    item.id;

                if (
                    normalizedId ===
                    'custom-cake'
                ) {

                    normalizedId =
                        'tortes';

                }

                if (
                    normalizedId ===
                    'custom-rose'
                ) {

                    normalizedId =
                        'roses';

                }

                return !outOfStock.includes(
                    normalizedId
                );

            });

        if (
            validCart.length !==
            cart.length
        ) {

            CART.setItems(validCart);

            logWarn(
                'Out Of Stock Items Removed From Cart'
            );

        }

    }

};

/**
 * =========================================================
 * Pricing Engine
 * =========================================================
 */
const PRICING = {

    calculateCartTotal() {

        const subtotal =
            CART.subtotal();

        const shipping =
            CHECKOUT.shippingFee();

        const total =
            subtotal + shipping;

        __COMMERCE_CACHE__
            .lastCalculation = {

            subtotal,

            shipping,

            total,

            calculatedAt: Date.now()

        };

        return {

            subtotal,

            shipping,

            total

        };

    },

    cake(cakeState = {}) {

        const liveConfig = getState(REGISTRY.STATE.CONFIG.key) || {};

        const people = Math.max(__LIMITS__.MIN_CAKE_PEOPLE, Number(cakeState.people || 4));

        // فحص المفتاح الأساسي لتكلفة الفرد لكعك المناسبات
        const basePriceKey = REGISTRY.CONFIG.CAKE_BASE_PRICE.key;
        let basePrice = 145;
        
        if (liveConfig[basePriceKey] !== undefined) {
            basePrice = liveConfig[basePriceKey];
        } else {
            // توسيع البحث للتحقق من المسميات البديلة الصادرة من لوحة التحكم لمنع القيم الصفرية
            const aliasFound = REGISTRY.CONFIG.CAKE_BASE_PRICE.aliases.find(alias => liveConfig[alias] !== undefined);
            if (aliasFound) {
                basePrice = liveConfig[aliasFound];
            } else {
                basePrice = cakeState.basePricePerPerson ?? cakeState.cakeBasePricePerPerson ?? 145;
            }
        }
        
        basePrice = Number(basePrice);

        // قراءة أسعار الطباعة الصالحة للأكل والغير صالحة للأكل بشكل مرن ودقيق
        const edible = Number(
            liveConfig[REGISTRY.CONFIG.CAKE_PRINT_EDIBLE_PRICE.key] ??
            liveConfig.cake_print_edible_price ??
            cakeState.cakePrintEdiblePrice ??
            60
        );

        const nonEdible = Number(
            liveConfig[REGISTRY.CONFIG.CAKE_PRINT_NON_EDIBLE_PRICE.key] ??
            liveConfig.cake_print_non_edible_price ??
            cakeState.cakePrintNonEdiblePrice ??
            20
        );

        let total = people * basePrice;

        if (cakeState.printOption === 'edible' || cakeState.print === 'edible') {

            total += edible;

        } else if (cakeState.printOption === 'non-edible' || cakeState.print === 'non-edible') {

            total += nonEdible;

        }

        return Number(isNaN(total) ? 0 : total);

    },

    rose(roseState = {}) {

        const liveConfig = getState(REGISTRY.STATE.CONFIG.key) || {};

        // جلب الأسعار الأساسية لباقات الورد مع توفير مسميات مرنة بالتنسيق السحابي
        const base = Number(
            liveConfig[REGISTRY.CONFIG.ROSE_BASE_PRICE.key] ??
            liveConfig.rose_base_price ??
            roseState.roseBasePrice ??
            400
        );

        const minCount = Number(
            liveConfig[REGISTRY.CONFIG.ROSE_MIN_COUNT.key] ??
            liveConfig.rose_min_count ??
            roseState.roseMinCount ??
            15
        );

        const currentCount = Math.max(
            minCount,
            Number(roseState.count ?? minCount)
        );

        const additional = Number(
            liveConfig[REGISTRY.CONFIG.ROSE_PRICE_PER_ADDITIONAL.key] ??
            liveConfig.rose_price_per_additional ??
            roseState.rosePricePerAdditional ??
            15
        );

        const photoPrice = Number(
            liveConfig[REGISTRY.CONFIG.ROSE_PHOTO_PRICE.key] ??
            liveConfig.rose_photo_price ??
            roseState.rosePhotoPrice ??
            15
        );

        const ribbonPrice = Number(
            liveConfig[REGISTRY.CONFIG.ROSE_RIBBON_PRICE.key] ??
            liveConfig.rose_ribbon_price ??
            roseState.roseRibbonPrice ??
            50
        );

        const cardPrice = Number(
            liveConfig[REGISTRY.CONFIG.ROSE_CARD_PRICE.key] ??
            liveConfig.rose_card_price ??
            roseState.roseCardPrice ??
            20
        );

        let total = base;

        // حساب الورد الإضافي المتجاوز للحد الأدنى للباقة لعلامة حلويات بوسي
        if (currentCount > minCount) {

            total += (currentCount - minCount) * additional;

        }

        // إضافة تكلفة الملحقات الإضافية المخصصة بدقة
        const pCount = Number(roseState.photosCount ?? roseState.photos ?? 0);
        total += (pCount * photoPrice);

        if (roseState.ribbonEnabled || roseState.ribbon) {

            total += ribbonPrice;

        }

        if (roseState.cardEnabled || roseState.card) {

            total += cardPrice;

        }

        // دمج حسابات الشوكولاتة والعملات النقدية داخل الباقة لضمان عدم إسقاط أي تكلفة مخصصة
        if (Number(roseState.cashAmount || roseState.cash || 0) > 0) {
            total += Number(roseState.cashAmount || roseState.cash || 0);
        }

        if (Number(roseState.chocBudget || 0) > 0) {
            total += Number(roseState.chocBudget || 0);
        }

        const premiumBar100Price = Number(liveConfig.premiumBar100Price ?? 100);
        const premiumBar120Price = Number(liveConfig.premiumBar120Price ?? 120);

        // مسح قنوات البارات الفاخرة المضافة للمحاكي الذكي
        const pBar100 = roseState.premiumBars ? roseState.premiumBars[100] : roseState.premiumBar100;
        const pBar120 = roseState.premiumBars ? roseState.premiumBars[120] : roseState.premiumBar120;

        if (Number(pBar100 || 0) > 0) {
            total += Number(pBar100 || 0) * premiumBar100Price;
        }

        if (Number(pBar120 || 0) > 0) {
            total += Number(pBar120 || 0) * premiumBar120Price;
        }

        return Number(isNaN(total) ? 0 : total);

    }

};

/**
 * =========================================================
 * Shipping Engine
 * =========================================================
 */
const SHIPPING = {

    regions() {

        return deepClone(
            getState(
                REGISTRY.STATE
                    .SHIPPING_RATES
                    .key
            ) || {}
        );

    },

    fee(region = '') {

        const regions =
            SHIPPING.regions();

        return Number(
            regions[region] || 0
        );

    }

};

/**
 * =========================================================
 * Checkout Engine
 * =========================================================
 */
const CHECKOUT = {

    get() {

        return deepClone(
            getState(
                REGISTRY.STATE
                    .CHECKOUT
                    .key
            ) || {}
        );

    },

    set(payload = {}) {

        const merged = {

            ...CHECKOUT.get(),

            ...deepClone(payload)

        };

        setState(
            REGISTRY.STATE
                .CHECKOUT
                .key,
            merged
        );

        emit(
            REGISTRY.EVENTS
                .CHECKOUT
                .UPDATED,
            merged
        );

    },

    shippingFee() {

        const checkout =
            CHECKOUT.get();

        return SHIPPING.fee(
            checkout.region
        );

    },

    validate() {

        const checkout =
            CHECKOUT.get();

        if (
            !checkout.method
        ) {

            throw new Error(
                'Checkout Method Missing'
            );

        }

        if (
            checkout.method ===
            'shipping' &&
            !checkout.region
        ) {

            throw new Error(
                'Shipping Region Missing'
            );

        }

        return true;

    },

    async submit(orderPayload = {}) {

        CHECKOUT.validate();

        const totals =
            PRICING
                .calculateCartTotal();

        const payload = {

            ...deepClone(orderPayload),

            cart: CART.getItems(),

            checkout:
                CHECKOUT.get(),

            totals,

            status: 'pending',

            createdAt: Date.now()

        };

        const orderId =
            await FIREBASE_ENGINE
                .DATABASE
                .createDocument(
                    REGISTRY.FIREBASE
                        .COLLECTIONS
                        .ORDERS,
                    payload
                );

        emit(
            REGISTRY.EVENTS
                .CHECKOUT
                .SUBMITTED,
            {
                orderId
            }
        );

        CART.clear();

        return orderId;

    }

};

/**
 * =========================================================
 * Cake Builder Engine
 * =========================================================
 */
const CAKE = {

    defaultState() {

        const liveConfig = getState(REGISTRY.STATE.CONFIG.key) || {};

        return {

            step: 1,

            base: 'فانيليا',

            people: 4,

            shape: 'دائرة',

            designFile: null,

            printOption: 'none',

            printFile: null,

            theme: '',

            allergies: '',

            writing: '',

            cardEnabled: false,

            cardText: '',

            basePricePerPerson: Number(liveConfig[REGISTRY.CONFIG.CAKE_BASE_PRICE.key] || 145),

            cakePrintEdiblePrice: Number(liveConfig[REGISTRY.CONFIG.CAKE_PRINT_EDIBLE_PRICE.key] || 60),

            cakePrintNonEdiblePrice: Number(liveConfig[REGISTRY.CONFIG.CAKE_PRINT_NON_EDIBLE_PRICE.key] || 20)

        };

    },

    get() {

        return deepClone(
            getState(
                REGISTRY.STATE.CAKE.key
            ) || CAKE.defaultState()
        );

    },

    set(payload = {}) {

        const merged = {

            ...CAKE.get(),

            ...deepClone(payload)

        };

        setState(
            REGISTRY.STATE.CAKE.key,
            merged
        );

    },

    reset() {

        CAKE.set(
            CAKE.defaultState()
        );

    },

    validateShapeRules() {

        const cake =
            CAKE.get();

        if (
            cake.shape === 'مربع' &&
            cake.people <
            __LIMITS__
                .MIN_SQUARE_CAKE_PEOPLE
        ) {

            throw new Error(
                'Square Cake Minimum Is 16'
            );

        }

        if (
            cake.shape === 'مستطيل' &&
            cake.people <
            __LIMITS__
                .MIN_RECTANGLE_CAKE_PEOPLE
        ) {

            throw new Error(
                'Rectangle Cake Minimum Is 20'
            );

        }

    },

    calculatePrice() {

        CAKE.validateShapeRules();

        return PRICING.cake(
            CAKE.get()
        );

    },

    buildCartItem() {

        return {

            id: 'custom-cake',

            name:
                'تورتة ملكية - تصميم خاص',

            qty: 1,

            isCustom: true,

            price:
                CAKE.calculatePrice(),

            details: deepClone(
                CAKE.get()
            )

        };

    },

    addToCart() {

        const item =
            CAKE.buildCartItem();

        CART.add(item);

        return item;

    }

};

/**
 * =========================================================
 * Rose Rose Engine
 * =========================================================
 */
const ROSE = {

    defaultState() {

        const liveConfig = getState(REGISTRY.STATE.CONFIG.key) || {};

        return {

            step: 1,

            referenceFile: null,

            count: 15,

            type: 'ورد طبيعي',

            colors: '',

            cashAmount: 0,

            cashDenomination: 20,

            photosCount: 0,

            photoFiles: [],

            ribbonEnabled: false,

            ribbonText: '',

            chocBudget: 0,

            chocPiecePrice: 20,

            premiumBar100: 0,

            premiumBar120: 0,

            cardEnabled: false,

            cardText: '',

            roseBasePrice: Number(liveConfig[REGISTRY.CONFIG.ROSE_BASE_PRICE.key] || 400),

            roseMinCount: Number(liveConfig[REGISTRY.CONFIG.ROSE_MIN_COUNT.key] || 15),

            rosePricePerAdditional: Number(liveConfig[REGISTRY.CONFIG.ROSE_PRICE_PER_ADDITIONAL.key] || 15),

            rosePhotoPrice: Number(liveConfig[REGISTRY.CONFIG.ROSE_PHOTO_PRICE.key] || 15),

            roseRibbonPrice: Number(liveConfig[REGISTRY.CONFIG.ROSE_RIBBON_PRICE.key] || 50),

            roseCardPrice: Number(liveConfig[REGISTRY.CONFIG.ROSE_CARD_PRICE.key] || 20)

        };

    },

    get() {

        return deepClone(
            getState(
                REGISTRY.STATE.ROSE.key
            ) || ROSE.defaultState()
        );

    },

    set(payload = {}) {

        const merged = {

            ...ROSE.get(),

            ...deepClone(payload)

        };

        setState(
            REGISTRY.STATE.ROSE.key,
            merged
        );

    },

    reset() {

        ROSE.set(
            ROSE.defaultState()
        );

    },

    validate() {

        const rose =
            ROSE.get();

        if (
            rose.count <
            __LIMITS__
                .MIN_ROSE_COUNT
        ) {

            throw new Error(
                'Minimum Rose Count Is 15'
            );

        }

        if (
            rose.count >
            __LIMITS__
                .MAX_ROSE_COUNT
        ) {

            throw new Error(
                'Maximum Rose Count Reached'
            );

        }

    },

    calculatePrice() {

        ROSE.validate();

        return PRICING.rose(
            ROSE.get()
        );

    },

    buildCartItem() {

        return {

            id: 'custom-rose',

            name:
                'بوكيه ورد فاخر - تصميم خاص',

            qty: 1,

            isCustom: true,

            price:
                ROSE.calculatePrice(),

            details: deepClone(
                ROSE.get()
            )

        };

    },

    addToCart() {

        const item =
            ROSE.buildCartItem();

        CART.add(item);

        return item;

    }

};

/**
 * =========================================================
 * Preparation Engine
 * =========================================================
 */
const PREPARATION = {

    estimatedHours() {

        return Number(
            getState(
                REGISTRY.STATE
                    .CONFIG
            )?.orderPrepTimeHours || 24
        );

    },

    estimatedDate() {

        const hours =
            PREPARATION
                .estimatedHours();

        return (
            Date.now() +
            (hours * 60 * 60 * 1000)
        );

    }

};

/**
 * =========================================================
 * Health Engine
 * =========================================================
 */
const HEALTH = {

    status() {

        return {

            cartItems:
                CART.count(),

            subtotal:
                CART.subtotal(),

            cache:
                deepClone(
                    __COMMERCE_CACHE__
                ),

            timestamp:
                Date.now()

        };

    }

};

/**
 * =========================================================
 * Bootstrap
 * =========================================================
 */
async function bootCommerceEngine() {

    logInfo(
        'Commerce Engine Boot Started'
    );

    CART.validateAgainstStock();

    logInfo(
        'Commerce Engine Boot Completed'
    );

    return true;

}

/**
 * =========================================================
 * Cleanup
 * =========================================================
 */
function cleanup() {

    logInfo(
        'Commerce Engine Cleanup Completed'
    );

}

/**
 * =========================================================
 * Public API
 * =========================================================
 */
export const COMMERCE_ENGINE =
    Object.freeze({

        boot:
            bootCommerceEngine,

        CART,

        PRICING,

        SHIPPING,

        CHECKOUT,

        CAKE,

        ROSE,

        PREPARATION,

        HEALTH,

        cleanup

    });

/**
 * =========================================================
 * Auto Bootstrap
 * =========================================================
 */
SYSTEM_CORE.safeExecute(async () => {

    await bootCommerceEngine();

});

/**
 * =========================================================
 * Window Cleanup
 * =========================================================
 */
if (typeof window !== 'undefined') {

    window.addEventListener(
        'beforeunload',
        cleanup
    );

}

/**
 * =========================================================
 * Exports
 * =========================================================
 */
export {

    CART,

    PRICING,

    SHIPPING,

    CHECKOUT,

    CAKE,

    ROSE,

    PREPARATION,

    HEALTH,

    cleanup

};

export default COMMERCE_ENGINE;
