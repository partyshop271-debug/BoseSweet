/**
 * =========================================================
 * Bose Sweets — Supreme Governance Registry
 * =========================================================
 * File               : system-registry.js
 * Architecture Level : VIP GOVERNANCE CORE
 * Stability Level    : MAXIMUM
 * Runtime Policy     : STRICT
 * Mutation Policy    : FULLY LOCKED
 * AI Governance      : ENFORCED
 * Architecture Mode  : 8-FILE GOVERNED ARCHITECTURE
 * =========================================================
 *
 * هذا الملف هو:
 * المصدر المركزي الوحيد للحقيقة داخل النظام بالكامل.
 *
 * جميع أجزاء النظام يجب أن تعتمد عليه.
 *
 * يمنع تماماً:
 * - كتابة IDs مباشرة
 * - كتابة Firestore Paths مباشرة
 * - إنشاء Hidden Contracts
 * - Runtime Guessing
 * - Manual Synchronization
 * - Direct State Mutation
 * - Architectural Drift
 * - Cross-File Assumptions
 *
 * =========================================================
 */

'use strict';

/**
 * =========================================================
 * Deep Freeze Engine
 * =========================================================
 */
function deepFreeze(target) {

    if (
        target === null ||
        typeof target !== 'object'
    ) {
        return target;
    }

    Object
        .getOwnPropertyNames(target)
        .forEach((property) => {

            const value = target[property];

            if (
                value &&
                (
                    typeof value === 'object' ||
                    typeof value === 'function'
                ) &&
                !Object.isFrozen(value)
            ) {

                deepFreeze(value);

            }

        });

    return Object.freeze(target);

}

/**
 * =========================================================
 * Environment Detection
 * =========================================================
 */
const ENVIRONMENT = (() => {

    try {

        if (
            typeof location !== 'undefined' &&
            (
                location.hostname.includes('localhost') ||
                location.hostname.includes('127.0.0.1')
            )
        ) {

            return 'development';

        }

        return 'production';

    } catch {

        return 'unknown';

    }

})();

/**
 * =========================================================
 * Registry Metadata
 * =========================================================
 */
const REGISTRY_META = {

    SYSTEM_NAME: 'Bose Sweets Governance Registry',

    REGISTRY_VERSION: '20.2.0',

    SCHEMA_VERSION: '1.2.0',

    ENVIRONMENT,

    ARCHITECTURE_MODE: '8_FILE_GOVERNED_SYSTEM',

    GOVERNANCE_MODE: 'CENTRALIZED',

    RUNTIME_PROTECTION: true,

    MUTATION_PROTECTION: true,

    AI_GOVERNANCE: true,

    HIDDEN_CONTRACTS_ALLOWED: false,

    DIRECT_DOM_ACCESS_ALLOWED: false,

    DIRECT_FIREBASE_PATHS_ALLOWED: false,

    MANUAL_SYNCHRONIZATION_ALLOWED: false
};

/**
 * =========================================================
 * Central Registry
 * =========================================================
 */
const REGISTRY = {

    /**
     * =====================================================
     * META
     * =====================================================
     */
    META: REGISTRY_META,

    /**
     * =====================================================
     * APPLICATION
     * =====================================================
     */
    APP: {

        ID: 'bosy-sweets',

        NAME: 'Bose Sweets',

        VERSION: '5.2.0',

        ARCHITECTURE: 'GOVERNED',

        MODE: ENVIRONMENT

    },

    /**
     * =====================================================
     * FILE SYSTEM ARCHITECTURE
     * =====================================================
     */
    FILES: {

        PAGES: {

            CLIENT: 'index.html',

            ADMIN: 'admin-monitor.html',

            AUTH: 'login.html'

        },

        ENGINES: {

            UNIFIED: 'unified-engine.js',

            COMMERCE: 'commerce-engine.js',

            FIREBASE: 'firebase-engine.js',
            
            ADMIN_ENGINE: 'admin-engine.js',
            
            DISPLAY_MANAGER: 'app-display-manager.js'

        },

        GOVERNANCE: {

            REGISTRY: 'system-registry.js',

            CORE: 'system-core.js',
            
            VALIDATOR: 'runtime-validator.js'

        }

    },

    /**
     * =====================================================
     * FIREBASE CONTRACTS
     * =====================================================
     */
    FIREBASE: {

        ROOT: [
            'artifacts',
            'bosy-sweets',
            'public',
            'data'
        ],

        SETTINGS: {

            GLOBAL_CONFIG: [
                'artifacts',
                'bosy-sweets',
                'public',
                'data',
                'settings',
                'global_config'
            ],

            SHIPPING_RATES: [
                'artifacts',
                'bosy-sweets',
                'public',
                'data',
                'settings',
                'shipping_rates'
            ]

        },

        COLLECTIONS: {

            MENU: [
                'artifacts',
                'bosy-sweets',
                'public',
                'data',
                'menu'
            ],

            ORDERS: [
                'artifacts',
                'bosy-sweets',
                'public',
                'data',
                'orders'
            ],

            SYSTEM_LOGS: [
                'artifacts',
                'bosy-sweets',
                'public',
                'data',
                'system_logs'
            ]

        }

    },

    /**
     * =====================================================
     * DOM CONTRACTS
     * =====================================================
     */
    DOM: {

        GLOBAL: {

            APP: {
                id: 'app',
                required: true,
                critical: true,
                type: 'container'
            },

            SIDEBAR: {
                id: 'sidebar',
                required: true,
                critical: true,
                type: 'container'
            },

            SIDEBAR_OVERLAY: {
                id: 'sidebarOverlay',
                required: true,
                critical: true,
                type: 'overlay'
            },

            HEADER_SEARCH: {
                id: 'headerSearch',
                required: false,
                critical: false,
                type: 'input'
            },
            
            TOP_TICKER_BANNER: {
                id: 'topTickerBanner',
                required: false,
                critical: false,
                type: 'container'
            },
            
            MARQUEE_CONTENT: {
                id: 'marqueeContent',
                required: false,
                critical: false,
                type: 'container'
            },
            
            FOOTER_PHONE_DISPLAY: {
                id: 'footerPhoneDisplay',
                required: false,
                critical: false,
                type: 'text'
            }

        },

        HOMEPAGE: {

            DYNAMIC_CONTENT: {
                id: 'homepageDynamicContent',
                required: true,
                critical: true,
                type: 'container'
            },

            MENU_GRID: {
                id: 'menuCategoriesGrid',
                required: true,
                critical: true,
                type: 'container'
            }

        },

        HERO: {

            MEDIA: {
                id: 'heroVisualMedia',
                required: false,
                critical: false,
                type: 'media'
            }

        },

        PRODUCT: {

            CONTAINER: {
                id: 'productDetailContainer',
                required: true,
                critical: true,
                type: 'container'
            }

        },

        CART: {

            BADGE: {
                id: 'cartCountBadge',
                required: true,
                critical: true,
                type: 'badge'
            },

            CONTAINER: {
                id: 'cartItemsContainer',
                required: true,
                critical: true,
                type: 'container'
            },

            ITEMS: {
                id: 'cartItemsList',
                required: true,
                critical: true,
                type: 'container'
            },

            EMPTY_STATE: {
                id: 'cartEmptyState',
                required: true,
                critical: false,
                type: 'container'
            },

            TOTAL: {
                id: 'cartTotalSum',
                required: true,
                critical: true,
                type: 'text'
            }

        },

        CHECKOUT: {

            FORM: {
                id: 'checkoutForm',
                required: true,
                critical: true,
                type: 'form'
            },

            CUSTOMER_NAME: {
                id: 'custName',
                required: true,
                critical: true,
                type: 'input'
            },

            CUSTOMER_PHONE: {
                id: 'custPhone',
                required: true,
                critical: true,
                type: 'input'
            },

            SHIPPING_ADDRESS: {
                id: 'shippingAddress',
                required: true,
                critical: true,
                type: 'input'
            },

            SUBTOTAL: {
                id: 'checkoutSubtotal',
                required: true,
                critical: true,
                type: 'text'
            },

            SHIPPING: {
                id: 'checkoutShipping',
                required: true,
                critical: true,
                type: 'text'
            },

            TOTAL: {
                id: 'checkoutGrandTotal',
                required: true,
                critical: true,
                type: 'text'
            },

            SHIPPING_REGION: {
                id: 'shippingRegion',
                required: true,
                critical: true,
                type: 'select'
            }

        },

        CAKE: {

            PRICE_DISPLAY: {
                id: 'cakeLivePriceDisplay',
                required: true,
                critical: true,
                type: 'text'
            },

            PEOPLE_COUNT: {
                id: 'cakePeopleCount',
                required: true,
                critical: true,
                type: 'input'
            },
            
            PRINT_EDIBLE_BTN: {
                id: 'cake-print-edible',
                required: false,
                critical: false,
                type: 'button'
            },
            
            PRINT_NON_EDIBLE_BTN: {
                id: 'cake-print-non-edible',
                required: false,
                critical: false,
                type: 'button'
            },
            
            COUNTER_WARNING: {
                id: 'cakeCounterWarning',
                required: false,
                critical: false,
                type: 'container'
            },
            
            DESIGN_LABEL: {
                id: 'cakeDesignLabel',
                required: false,
                critical: false,
                type: 'text'
            },
            
            PRINT_LABEL: {
                id: 'cakePrintLabel',
                required: false,
                critical: false,
                type: 'text'
            },
            
            PRINT_UPLOAD_AREA: {
                id: 'cakePrintUploadArea',
                required: false,
                critical: false,
                type: 'container'
            },
            
            CARD_CHECK: {
                id: 'cakeCardCheck',
                required: false,
                critical: false,
                type: 'checkbox'
            },
            
            CARD_INPUT_AREA: {
                id: 'cakeCardInputArea',
                required: false,
                critical: false,
                type: 'container'
            },
            
            TEXT_INPUT: {
                id: 'cakeText',
                required: false,
                critical: false,
                type: 'input'
            },
            
            THEME_DETAILS: {
                id: 'cakeThemeDetails',
                required: false,
                critical: false,
                type: 'textarea'
            },
            
            ALLERGIES: {
                id: 'cakeAllergies',
                required: false,
                critical: false,
                type: 'textarea'
            },
            
            CARD_TEXT: {
                id: 'cakeCardText',
                required: false,
                critical: false,
                type: 'input'
            },
            
            BASE_NOTIFICATION: {
                id: 'cake-base-notification',
                required: false,
                critical: false,
                type: 'container'
            },
            
            SHAPE_HINT: {
                id: 'cake-shape-hint',
                required: false,
                critical: false,
                type: 'container'
            }

        },

        ROSE: {

            PRICE_DISPLAY: {
                id: 'roseLivePriceDisplay',
                required: true,
                critical: true,
                type: 'text'
            },

            COUNT: {
                id: 'roseCount',
                required: true,
                critical: true,
                type: 'input'
            },
            
            MIN_COUNT_HINT: {
                id: 'roseMinCountHint',
                required: false,
                critical: false,
                type: 'text'
            },
            
            PHOTO_PRICE_HINT: {
                id: 'rosePhotoPriceHint',
                required: false,
                critical: false,
                type: 'text'
            },
            
            RIBBON_LABEL: {
                id: 'roseRibbonLabel',
                required: false,
                critical: false,
                type: 'text'
            },
            
            CARD_LABEL: {
                id: 'roseCardLabel',
                required: false,
                critical: false,
                type: 'text'
            },
            
            REFERENCE_LABEL: {
                id: 'roseReferenceLabel',
                required: false,
                critical: false,
                type: 'text'
            },
            
            PHOTOS_COUNT: {
                id: 'rosePhotosCount',
                required: false,
                critical: false,
                type: 'text'
            },
            
            PHOTO_UPLOADS_CONTAINER: {
                id: 'rosePhotoUploadsContainer',
                required: false,
                critical: false,
                type: 'container'
            },
            
            RIBBON_CHECK: {
                id: 'roseRibbonCheck',
                required: false,
                critical: false,
                type: 'checkbox'
            },
            
            RIBBON_INPUT_AREA: {
                id: 'roseRibbonInputArea',
                required: false,
                critical: false,
                type: 'container'
            },
            
            CHOC_BUDGET: {
                id: 'roseChocBudget',
                required: false,
                critical: false,
                type: 'input'
            },
            
            CHOC_OUTPUT: {
                id: 'roseChocOutput',
                required: false,
                critical: false,
                type: 'container'
            },
            
            CHOC_CALC_TEXT: {
                id: 'roseChocCalcText',
                required: false,
                critical: false,
                type: 'text'
            },
            
            CASH_AMOUNT: {
                id: 'roseCashAmount',
                required: false,
                critical: false,
                type: 'input'
            },
            
            CASH_OUTPUT: {
                id: 'roseCashOutput',
                required: false,
                critical: false,
                type: 'container'
            },
            
            CASH_CALC_TEXT: {
                id: 'roseCashCalcText',
                required: false,
                critical: false,
                type: 'text'
            },
            
            PREMIUM_BAR_100: {
                id: 'rosePremiumBar100',
                required: false,
                critical: false,
                type: 'text'
            },
            
            PREMIUM_BAR_120: {
                id: 'rosePremiumBar120',
                required: false,
                critical: false,
                type: 'text'
            },
            
            CARD_CHECK: {
                id: 'roseCardCheck',
                required: false,
                critical: false,
                type: 'checkbox'
            },
            
            CARD_INPUT_AREA: {
                id: 'roseCardInputArea',
                required: false,
                critical: false,
                type: 'container'
            },
            
            COLORS_INPUT: {
                id: 'roseColors',
                required: false,
                critical: false,
                type: 'input'
            },
            
            CARD_TEXT: {
                id: 'roseCardText',
                required: false,
                critical: false,
                type: 'input'
            },
            
            RIBBON_TEXT: {
                id: 'roseRibbonText',
                required: false,
                critical: false,
                type: 'input'
            },
            
            QUICK_BUY_AREA: {
                id: 'roseQuickBuyArea',
                required: false,
                critical: false,
                type: 'container'
            }

        },

        ADMIN: {

            DASHBOARD: {
                id: 'adminDashboard',
                required: false,
                critical: false,
                type: 'container'
            },

            ORDERS_TABLE: {
                id: 'ordersTable',
                required: false,
                critical: false,
                type: 'container'
            },

            DASHBOARD_SECTION: { 
                id: 'dashboardSection', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            ORDERS_SECTION: { 
                id: 'ordersSection', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            MENU_SECTION: { 
                id: 'menuSection', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            LAYOUT_SECTION: { 
                id: 'layoutSection', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            CAKE_BUILDER_SECTION: { 
                id: 'cakeBuilderSection', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            ROSE_BUILDER_SECTION: { 
                id: 'roseBuilderSection', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            SHIPPING_SECTION: { 
                id: 'shippingSection', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            SETTINGS_SECTION: { 
                id: 'settingsSection', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            LOGS_SECTION: { 
                id: 'logsSection', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            ORDERS_CARDS_CONTAINER: { 
                id: 'ordersCardsContainer', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            MENU_TABS_CONTAINER: { 
                id: 'menuTabsContainer', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            OUT_OF_STOCK_CONTAINER: { 
                id: 'outOfStockContainer', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            LAYOUT_SECTIONS_CONTAINER: { 
                id: 'layoutSectionsContainer', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            SHIPPING_RATES_CONTAINER: { 
                id: 'shippingRatesContainer', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            LOGS_TABLE_BODY: { 
                id: 'logsTableBody', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            EMAIL_DISPLAY: { 
                id: 'adminEmailDisplay', 
                required: false, 
                critical: false, 
                type: 'text' 
            },
            
            LOADING_GUARD: { 
                id: 'loadingGuard', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            MARQUEE_SPEED_LABEL: { 
                id: 'marqueeSpeedLabel', 
                required: false, 
                critical: false, 
                type: 'text' 
            }

        },

        AUTH: {

            LOGIN_FORM: {
                id: 'loginForm',
                required: false,
                critical: false,
                type: 'form'
            },

            ADMIN_EMAIL: { 
                id: 'adminEmail', 
                required: true, 
                critical: true, 
                type: 'input' 
            },
            
            ADMIN_PASSWORD: { 
                id: 'adminPassword', 
                required: true, 
                critical: true, 
                type: 'input' 
            },
            
            AUTH_ALERT: { 
                id: 'authAlert', 
                required: false, 
                critical: false, 
                type: 'container' 
            },
            
            SUBMIT_BUTTON: { 
                id: 'submitButton', 
                required: true, 
                critical: true, 
                type: 'button' 
            },
            
            SUBMIT_TEXT: { 
                id: 'submitText', 
                required: true, 
                critical: true, 
                type: 'text' 
            }

        }

    },

    /**
     * =====================================================
     * STATE CONTRACTS
     * =====================================================
     */
    STATE: {

        CURRENT_VIEW: {
            key: 'currentView',
            type: 'string',
            required: true,
            default: 'home'
        },

        CART: {
            key: 'cart',
            type: 'array',
            required: true,
            default: []
        },

        CHECKOUT: {
            key: 'checkout',
            type: 'object',
            required: true,
            default: {}
        },

        CAKE: {
            key: 'cake',
            type: 'object',
            required: true,
            default: {}
        },

        ROSE: {
            key: 'rose',
            type: 'object',
            required: true,
            default: {}
        },

        MENU: {
            key: 'menu',
            type: 'array',
            required: true,
            default: []
        },

        HOMEPAGE_SECTIONS: {
            key: 'homepageSections',
            type: 'array',
            required: true,
            default: []
        },

        SHIPPING_RATES: {
            key: 'shippingRates',
            type: 'object',
            required: true,
            default: {}
        },

        OUT_OF_STOCK_ITEMS: {
            key: 'outOfStockItems',
            type: 'array',
            required: true,
            default: []
        },

        DISPLAY_MODE: {
            key: 'displayMode',
            type: 'string',
            required: true,
            default: 'grid2'
        },

        SYSTEM_STATUS: {
            key: 'systemStatus',
            type: 'object',
            required: true,
            default: {}
        },

        AUTH: {
            key: 'auth',
            type: 'object',
            required: true,
            default: {}
        }

    },

    /**
     * =====================================================
     * CONFIG CONTRACTS
     * =====================================================
     */
    CONFIG: {

        PHONE: {
            key: 'phone',
            type: 'string',
            required: true
        },

        MARQUEE_TEXT: {
            key: 'marqueeText',
            type: 'string',
            required: false
        },

        MARQUEE_SPEED: {
            key: 'marqueeSpeed',
            type: 'number',
            required: false
        },

        DISPLAY_MODE: {
            key: 'displayMode',
            type: 'string',
            required: true
        },

        ORDER_PREP_TIME: {
            key: 'orderPrepTimeHours',
            type: 'number',
            required: true
        },

        CAKE_BASE_PRICE: {
            key: 'cakeBasePricePerPerson',
            aliases: [
                'cakeBasePrice',
                'cake_price',
                'cakePricePerPerson',
                'pricePerPerson'
            ],
            type: 'number',
            required: true
        },

        CAKE_PRINT_EDIBLE_PRICE: {
            key: 'cakePrintEdiblePrice',
            type: 'number',
            required: true
        },

        CAKE_PRINT_NON_EDIBLE_PRICE: {
            key: 'cakePrintNonEdiblePrice',
            type: 'number',
            required: true
        },

        ROSE_BASE_PRICE: {
            key: 'roseBasePrice',
            type: 'number',
            required: true
        },

        ROSE_MIN_COUNT: {
            key: 'roseMinCount',
            type: 'number',
            required: true
        },

        ROSE_PRICE_PER_ADDITIONAL: {
            key: 'rosePricePerAdditional',
            type: 'number',
            required: true
        },

        ROSE_PHOTO_PRICE: {
            key: 'rosePhotoPrice',
            type: 'number',
            required: true
        },

        ROSE_RIBBON_PRICE: {
            key: 'roseRibbonPrice',
            type: 'number',
            required: true
        },

        ROSE_CARD_PRICE: {
            key: 'roseCardPrice',
            type: 'number',
            required: true
        }

    },

    /**
     * =====================================================
     * EVENT CONTRACTS
     * =====================================================
     */
    EVENTS: {

        SYSTEM: {

            READY: 'SYSTEM_READY',

            ERROR: 'SYSTEM_ERROR',

            WARNING: 'SYSTEM_WARNING'

        },

        VIEW: {

            CHANGED: 'VIEW_CHANGED'

        },

        MENU: {

            UPDATED: 'MENU_UPDATED',

            STOCK_CHANGED: 'STOCK_CHANGED'

        },

        CART: {

            UPDATED: 'CART_UPDATED',

            CLEARED: 'CART_CLEARED',

            ITEM_ADDED: 'CART_ITEM_ADDED',

            ITEM_REMOVED: 'CART_ITEM_REMOVED'

        },

        CHECKOUT: {

            UPDATED: 'CHECKOUT_UPDATED',

            SUBMITTED: 'CHECKOUT_SUBMITTED'

        },

        CONFIG: {

            UPDATED: 'CONFIG_UPDATED'

        },

        AUTH: {

            LOGIN_SUCCESS: 'LOGIN_SUCCESS',

            LOGIN_FAILED: 'LOGIN_FAILED',

            LOGOUT: 'LOGOUT'

        },

        UI: {

            MODAL_OPENED: 'MODAL_OPENED',

            MODAL_CLOSED: 'MODAL_CLOSED',

            TOAST_SHOWN: 'TOAST_SHOWN'

        }

    },

    /**
     * =====================================================
     * RUNTIME GOVERNANCE
     * =====================================================
     */
    RUNTIME: {

        STRICT_MODE: true,

        VALIDATE_DOM_ON_BOOT: true,

        VALIDATE_STATE_ON_BOOT: true,

        VALIDATE_FIREBASE_ON_BOOT: true,

        BLOCK_RUNTIME_MUTATION: true,

        BLOCK_UNKNOWN_DOM_IDS: true,

        BLOCK_UNKNOWN_STATE_KEYS: true,

        BLOCK_UNKNOWN_EVENTS: true,

        FAIL_ON_CRITICAL_DOM_MISSING: true,

        ENABLE_DIAGNOSTICS: true,

        ENABLE_RUNTIME_PROTECTION: true

    },

    /**
     * =====================================================
     * AI GOVERNANCE
     * =====================================================
     */
    AI_GOVERNANCE: {

        ALLOW_DIRECT_IDS: false,

        ALLOW_DIRECT_PATHS: false,

        ALLOW_DIRECT_DOM_ACCESS: false,

        ALLOW_RUNTIME_GUESSING: false,

        ALLOW_HIDDEN_CONTRACTS: false,

        ALLOW_MANUAL_SYNC: false,

        ALLOW_UNREGISTERED_STATE_KEYS: false,

        ALLOW_UNREGISTERED_EVENTS: false,

        ALLOW_ARCHITECTURE_DRIFT: false

    }

};

/**
 * =========================================================
 * Deep Registry Lock
 * =========================================================
 */
deepFreeze(REGISTRY);

/**
 * =========================================================
 * Registry Validators
 * =========================================================
 */
export function isRegisteredDOMId(id) {

    return JSON
        .stringify(REGISTRY.DOM)
        .includes(id);

}

export function isRegisteredEvent(eventName) {

    return JSON
        .stringify(REGISTRY.EVENTS)
        .includes(eventName);

}

export function isRegisteredStateKey(key) {

    return Object
        .values(REGISTRY.STATE)
        .some(entry => entry.key === key);

}

/**
 * =========================================================
 * Registry Helpers
 * =========================================================
 */
export function getRegistry() {

    return REGISTRY;

}

export function getRegistryMeta() {

    return REGISTRY.META;

}

export function isRegistryLocked() {

    return Object.isFrozen(REGISTRY);

}

/**
 * =========================================================
 * Exports
 * =========================================================
 */
export {
    REGISTRY
};

export default REGISTRY;
