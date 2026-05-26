/**
 * =========================================================
 * Bose Sweets — Enterprise Runtime Protection Engine
 * =========================================================
 * File: runtime-validator.js
 * Architecture: Enterprise Production Runtime
 * Protection Level: Maximum
 * Runtime Policy: Self Healing
 * =========================================================
 */

'use strict';

import REGISTRY from './system-registry.js';

import SYSTEM_CORE from './system-core.js';

import FIREBASE_ENGINE from './firebase-engine.js';

import COMMERCE_ENGINE from './commerce-engine.js';

import UNIFIED_ENGINE from './unified-engine.js';

/**
 * =========================================================
 * Runtime Constants
 * =========================================================
 */

const ENGINE_VERSION = '7.0.0';

const VALIDATION_INTERVAL = 15000;

const MEMORY_INTERVAL = 20000;

const PERFORMANCE_INTERVAL = 10000;

const CLEANUP_INTERVAL = 30000;

const NETWORK_INTERVAL = 12000;

const MAX_ERRORS = 100;

const MAX_WARNINGS = 250;

const MAX_RENDER_RATE = 120;

const MAX_EVENT_RATE = 200;

const MAX_LISTENERS = 300;

const MAX_DOM_GROWTH = 300;

const MAX_HEAP_MB = 300;

const MAX_ACTIONS_PER_SECOND = 150;

/**
 * =========================================================
 * Runtime State
 * =========================================================
 */

const __STATE__ = Object.seal({

    initialized: false,

    running: false,

    locked: false,

    lastValidation: null,

    health: 'unknown',

    network: navigator.onLine,

    recovering: false,

    renderRate: 0,

    eventRate: 0,

    memoryPressure: false,

    heapPressure: false,

    runtimeIntegrity: true

});

/**
 * =========================================================
 * Containers
 * =========================================================
 */

const __ERRORS__ = [];

const __WARNINGS__ = [];

const __CHECKS__ = [];

const __WATCHDOGS__ = new Map();

const __PERFORMANCE__ = [];

const __MEMORY__ = [];

const __NETWORK__ = [];

const __EVENTS__ = [];

const __LISTENERS__ = [];

const __RENDERS__ = [];

const __ASYNC_FAILURES__ = [];

const __MUTATIONS__ = [];

const __RECOVERY__ = [];

/**
 * =========================================================
 * Diagnostics
 * =========================================================
 */

function info(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.info(

        `[RUNTIME_VALIDATOR] ${message}`,

        metadata

    );

}

function warn(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.warn(

        `[RUNTIME_VALIDATOR] ${message}`,

        metadata

    );

}

function error(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.error(

        `[RUNTIME_VALIDATOR] ${message}`,

        metadata

    );

}

/**
 * =========================================================
 * Helpers
 * =========================================================
 */

function now() {

    return Date.now();

}

function uuid() {

    return crypto.randomUUID();

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

function trim(array, max) {

    if (array.length > max) {

        array.splice(

            0,

            array.length - max

        );

    }

}

/**
 * =========================================================
 * Push Runtime Data
 * =========================================================
 */

function pushError(type, message, metadata = {}) {

    __ERRORS__.push({

        id: uuid(),

        type,

        message,

        metadata,

        timestamp: now()

    });

    trim(__ERRORS__, MAX_ERRORS);

    error(message, metadata);

}

function pushWarning(type, message, metadata = {}) {

    __WARNINGS__.push({

        id: uuid(),

        type,

        message,

        metadata,

        timestamp: now()

    });

    trim(__WARNINGS__, MAX_WARNINGS);

    warn(message, metadata);

}

function pushCheck(name, success, metadata = {}) {

    __CHECKS__.push({

        id: uuid(),

        name,

        success,

        metadata,

        timestamp: now()

    });

    trim(__CHECKS__, 500);

}

/**
 * =========================================================
 * DOM Protection
 * =========================================================
 */

const DOM_PROTECTION = {

    validateRequiredElements() {

        const required = [

            'app',

            'sidebar',

            'globalModal',

            'cartItemsList',

            'checkoutForm'

        ];

        required.forEach(id => {

            const element =

                document.getElementById(id);

            if (!element) {

                pushError(

                    'DOM_MISSING',

                    `Missing DOM Element: ${id}`

                );

                return;

            }

            pushCheck(

                `DOM:${id}`,

                true

            );

        });

    },

    detectDuplicateIds() {

        const map = new Set();

        const duplicates = [];

        document

            .querySelectorAll('[id]')

            .forEach(node => {

                if (map.has(node.id)) {

                    duplicates.push(node.id);

                }

                map.add(node.id);

            });

        if (duplicates.length) {

            pushError(

                'DOM_DUPLICATES',

                'Duplicate DOM IDs detected',

                { duplicates }

            );

        }

    },

    detectDomStorm() {

        const total =

            document.querySelectorAll('*')

                .length;

        __RENDERS__.push({

            timestamp: now(),

            total

        });

        trim(__RENDERS__, 10);

        if (__RENDERS__.length < 2) {

            return;

        }

        const latest =

            __RENDERS__[

                __RENDERS__.length - 1

            ];

        const previous =

            __RENDERS__[

                __RENDERS__.length - 2

            ];

        const growth =

            latest.total -

            previous.total;

        if (growth > MAX_DOM_GROWTH) {

            pushWarning(

                'DOM_STORM',

                'Abnormal DOM Growth Detected',

                { growth }

            );

        }

    }

};

/**
 * =========================================================
 * Runtime Integrity
 * =========================================================
 */

const RUNTIME_INTEGRITY = {

    validateRegistry() {

        if (!REGISTRY) {

            pushError(

                'REGISTRY_FAILURE',

                'Registry Missing'

            );

            return false;

        }

        pushCheck(

            'REGISTRY_RUNTIME',

            true

        );

        return true;

    },

    validateCore() {

        if (!SYSTEM_CORE) {

            pushError(

                'CORE_FAILURE',

                'System Core Missing'

            );

            return false;

        }

        pushCheck(

            'SYSTEM_CORE_RUNTIME',

            true

        );

        return true;

    },

    validateFirebase() {

        if (!FIREBASE_ENGINE) {

            pushError(

                'FIREBASE_FAILURE',

                'Firebase Engine Missing'

            );

            return false;

        }

        pushCheck(

            'FIREBASE_RUNTIME',

            true

        );

        return true;

    },

    validateCommerce() {

        if (!COMMERCE_ENGINE) {

            pushError(

                'COMMERCE_FAILURE',

                'Commerce Engine Missing'

            );

            return false;

        }

        pushCheck(

            'COMMERCE_RUNTIME',

            true

        );

        return true;

    },

    validateUnified() {

        if (!UNIFIED_ENGINE) {

            pushError(

                'UNIFIED_FAILURE',

                'Unified Engine Missing'

            );

            return false;

        }

        pushCheck(

            'UNIFIED_RUNTIME',

            true

        );

        return true;

    }

};

/**
 * =========================================================
 * Memory Protection
 * =========================================================
 */

const MEMORY_PROTECTION = {

    snapshot() {

        const heap =

            performance.memory

                ? Math.round(

                    performance.memory.usedJSHeapSize /

                    1048576

                )

                : 0;

        const snapshot = {

            timestamp: now(),

            heap,

            dom:

                document

                    .querySelectorAll('*')

                    .length,

            listeners:

                __LISTENERS__.length,

            errors:

                __ERRORS__.length

        };

        __MEMORY__.push(snapshot);

        trim(__MEMORY__, 50);

    },

    detectHeapPressure() {

        if (

            !performance.memory

        ) {

            return;

        }

        const heap =

            Math.round(

                performance.memory.usedJSHeapSize /

                1048576

            );

        if (heap > MAX_HEAP_MB) {

            __STATE__.heapPressure = true;

            pushWarning(

                'HEAP_PRESSURE',

                'Heap Pressure Detected',

                { heap }

            );

        }

    },

    cleanup() {

        trim(__ERRORS__, 50);

        trim(__WARNINGS__, 100);

        trim(__EVENTS__, 200);

        trim(__PERFORMANCE__, 100);

        trim(__LISTENERS__, 100);

        trim(__ASYNC_FAILURES__, 50);

        trim(__MUTATIONS__, 100);

        trim(__RECOVERY__, 100);

    }

};

/**
 * =========================================================
 * Event Protection
 * =========================================================
 */

const EVENT_PROTECTION = {

    monitorEvents() {

        const events = [

            'click',

            'mousemove',

            'keydown',

            'touchstart'

        ];

        events.forEach(type => {

            window.addEventListener(

                type,

                () => {

                    __EVENTS__.push({

                        type,

                        timestamp: now()

                    });

                },

                {

                    passive: true

                }

            );

        });

    },

    detectEventStorm() {

        const lastSecond = now() - 1000;

        const count =

            __EVENTS__.filter(event => {

                return event.timestamp > lastSecond;

            }).length;

        __STATE__.eventRate = count;

        if (count > MAX_EVENT_RATE) {

            pushWarning(

                'EVENT_STORM',

                'Abnormal Event Rate Detected',

                { count }

            );

        }

    }

};

/**
 * =========================================================
 * Render Protection
 * =========================================================
 */

const RENDER_PROTECTION = {

    trackRender() {

        __STATE__.renderRate++;

    },

    detectRenderStorm() {

        if (

            __STATE__.renderRate >

            MAX_RENDER_RATE

        ) {

            pushWarning(

                'RENDER_STORM',

                'Render Storm Detected',

                {

                    renders:

                        __STATE__.renderRate

                }

            );

        }

        __STATE__.renderRate = 0;

    }

};

/**
 * =========================================================
 * Listener Protection
 * =========================================================
 */

const LISTENER_PROTECTION = {

    track(target, type) {

        __LISTENERS__.push({

            target,

            type,

            timestamp: now()

        });

    },

    detectLeaks() {

        if (

            __LISTENERS__.length >

            MAX_LISTENERS

        ) {

            pushWarning(

                'LISTENER_LEAK',

                'Potential Listener Leak Detected',

                {

                    listeners:

                        __LISTENERS__.length

                }

            );

        }

    }

};

/**
 * =========================================================
 * Network Protection
 * =========================================================
 */

const NETWORK_PROTECTION = {

    track() {

        __NETWORK__.push({

            online: navigator.onLine,

            timestamp: now()

        });

        trim(__NETWORK__, 50);

    },

    validate() {

        if (!navigator.onLine) {

            pushWarning(

                'NETWORK_OFFLINE',

                'Network Offline'

            );

        }

    }

};

/**
 * =========================================================
 * Async Protection
 * =========================================================
 */

const ASYNC_PROTECTION = {

    capture(errorObject) {

        __ASYNC_FAILURES__.push({

            id: uuid(),

            error: errorObject,

            timestamp: now()

        });

    },

    recover() {

        if (

            __ASYNC_FAILURES__.length > 10

        ) {

            pushWarning(

                'ASYNC_FAILURES',

                'Multiple Async Failures Detected'

            );

        }

    }

};

/**
 * =========================================================
 * Mutation Protection
 * =========================================================
 */

const MUTATION_PROTECTION = {

    freezeRuntime() {

        try {

            Object.freeze(REGISTRY);

        } catch {}

    },

    observe() {

        const observer =

            new MutationObserver((mutations) => {

                __MUTATIONS__.push({

                    total: mutations.length,

                    timestamp: now()

                });

            });

        observer.observe(

            document.body,

            {

                childList: true,

                subtree: true,

                attributes: true

            }

        );

    }

};

/**
 * =========================================================
 * Recovery Engine
 * =========================================================
 */

const RECOVERY_ENGINE = {

    async recoverRuntime() {

        if (__STATE__.recovering) {

            return;

        }

        __STATE__.recovering = true;

        try {

            await FIREBASE_ENGINE

                .NETWORK

                .reconnect();

            __RECOVERY__.push({

                timestamp: now(),

                success: true

            });

            info(

                'Runtime Recovery Completed'

            );

        } catch (err) {

            pushError(

                'RECOVERY_FAILURE',

                'Runtime Recovery Failed',

                { err }

            );

        } finally {

            __STATE__.recovering = false;

        }

    },

    emergencyLockdown() {

        __STATE__.locked = true;

        pushWarning(

            'EMERGENCY_LOCKDOWN',

            'Runtime Emergency Lockdown Activated'

        );

    }

};

/**
 * =========================================================
 * Health Engine
 * =========================================================
 */

const HEALTH_ENGINE = {

    calculate() {

        if (__ERRORS__.length === 0) {

            __STATE__.health = 'excellent';

            return;

        }

        if (__ERRORS__.length < 5) {

            __STATE__.health = 'stable';

            return;

        }

        if (__ERRORS__.length < 15) {

            __STATE__.health = 'warning';

            return;

        }

        __STATE__.health = 'critical';

    },

    status() {

        return {

            state:

                deepClone(__STATE__),

            errors:

                deepClone(__ERRORS__),

            warnings:

                deepClone(__WARNINGS__),

            checks:

                deepClone(__CHECKS__),

            memory:

                deepClone(__MEMORY__),

            performance:

                deepClone(__PERFORMANCE__)

        };

    }

};

/**
 * =========================================================
 * Validation Pipeline
 * =========================================================
 */

async function validateRuntime() {

    __STATE__.lastValidation = now();

    DOM_PROTECTION.validateRequiredElements();

    DOM_PROTECTION.detectDuplicateIds();

    DOM_PROTECTION.detectDomStorm();

    RUNTIME_INTEGRITY.validateRegistry();

    RUNTIME_INTEGRITY.validateCore();

    RUNTIME_INTEGRITY.validateFirebase();

    RUNTIME_INTEGRITY.validateCommerce();

    RUNTIME_INTEGRITY.validateUnified();

    MEMORY_PROTECTION.snapshot();

    MEMORY_PROTECTION.detectHeapPressure();

    MEMORY_PROTECTION.cleanup();

    EVENT_PROTECTION.detectEventStorm();

    RENDER_PROTECTION.detectRenderStorm();

    LISTENER_PROTECTION.detectLeaks();

    NETWORK_PROTECTION.validate();

    ASYNC_PROTECTION.recover();

    HEALTH_ENGINE.calculate();

}

/**
 * =========================================================
 * Watchdogs
 * =========================================================
 */

const WATCHDOGS = {

    start(name, callback, interval) {

        if (__WATCHDOGS__.has(name)) {

            return;

        }

        const runtime =

            setInterval(

                callback,

                interval

            );

        __WATCHDOGS__.set(

            name,

            runtime

        );

    },

    stop(name) {

        if (

            !__WATCHDOGS__.has(name)

        ) {

            return;

        }

        clearInterval(

            __WATCHDOGS__.get(name)

        );

        __WATCHDOGS__.delete(name);

    },

    stopAll() {

        __WATCHDOGS__.forEach(runtime => {

            clearInterval(runtime);

        });

        __WATCHDOGS__.clear();

    }

};

/**
 * =========================================================
 * Bootstrap
 * =========================================================
 */

async function boot() {

    if (__STATE__.initialized) {

        return true;

    }

    info(

        'Enterprise Runtime Validator Boot Started'

    );

    __STATE__.initialized = true;

    __STATE__.running = true;

    EVENT_PROTECTION.monitorEvents();

    MUTATION_PROTECTION.freezeRuntime();

    MUTATION_PROTECTION.observe();

    await validateRuntime();

    WATCHDOGS.start(

        'runtime_validation',

        async () => {

            await validateRuntime();

        },

        VALIDATION_INTERVAL

    );

    WATCHDOGS.start(

        'memory_tracking',

        () => {

            MEMORY_PROTECTION.snapshot();

        },

        MEMORY_INTERVAL

    );

    WATCHDOGS.start(

        'network_tracking',

        () => {

            NETWORK_PROTECTION.track();

        },

        NETWORK_INTERVAL

    );

    WATCHDOGS.start(

        'performance_tracking',

        () => {

            RENDER_PROTECTION.detectRenderStorm();

        },

        PERFORMANCE_INTERVAL

    );

    WATCHDOGS.start(

        'cleanup_runtime',

        () => {

            MEMORY_PROTECTION.cleanup();

        },

        CLEANUP_INTERVAL

    );

    info(

        'Enterprise Runtime Validator Ready'

    );

    return true;

}

/**
 * =========================================================
 * Cleanup
 * =========================================================
 */

function cleanup() {

    WATCHDOGS.stopAll();

    __STATE__.running = false;

    info(

        'Runtime Validator Cleanup Completed'

    );

}

/**
 * =========================================================
 * Global Error Hooks
 * =========================================================
 */

window.addEventListener(

    'error',

    (event) => {

        pushError(

            'GLOBAL_ERROR',

            event.message,

            {

                filename:

                    event.filename,

                lineno:

                    event.lineno

            }

        );

    }

);

window.addEventListener(

    'unhandledrejection',

    (event) => {

        ASYNC_PROTECTION.capture(

            event.reason

        );

    }

);

/**
 * =========================================================
 * Public API
 * =========================================================
 */

export const RUNTIME_VALIDATOR = Object.freeze({

    VERSION: ENGINE_VERSION,

    boot,

    validate: validateRuntime,

    HEALTH_ENGINE,

    DOM_PROTECTION,

    RUNTIME_INTEGRITY,

    MEMORY_PROTECTION,

    EVENT_PROTECTION,

    RENDER_PROTECTION,

    LISTENER_PROTECTION,

    NETWORK_PROTECTION,

    ASYNC_PROTECTION,

    MUTATION_PROTECTION,

    RECOVERY_ENGINE,

    WATCHDOGS,

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
 * Exports
 * =========================================================
 */

export default RUNTIME_VALIDATOR;