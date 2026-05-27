/**
 * =========================================================
 * Bose Sweets — Enterprise Runtime Kernel
 * =========================================================
 * File               : system-core.js
 * Architecture Level : ENTERPRISE RUNTIME KERNEL
 * Runtime Level      : SELF HEALING
 * Stability Level    : MAXIMUM PRODUCTION
 * Security Level     : HARDENED
 * =========================================================
 */

'use strict';

import REGISTRY from './system-registry.js';

/**
 * =========================================================
 * Runtime Constants
 * =========================================================
 */

const CORE_VERSION = '8.1.0';

const MAX_DIAGNOSTICS = 500;

const MAX_EVENT_QUEUE = 500;

const MAX_TASK_QUEUE = 300;

const MAX_RUNTIME_ERRORS = 200;

const MAX_MEMORY_SNAPSHOTS = 100;

const MAX_EVENT_EXECUTION_TIME = 2500;

const MAX_ASYNC_TIMEOUT = 15000;

const MEMORY_CLEANUP_INTERVAL = 30000;

const RUNTIME_HEALTH_INTERVAL = 10000;

const WATCHDOG_INTERVAL = 15000;

const EVENT_FLOOD_LIMIT = 120;

const MAX_RUNTIME_LOCKS = 50;

/**
 * =========================================================
 * Runtime Containers
 * =========================================================
 */

const __STATE__ = new Map();

const __EVENTS__ = new Map();

const __TASKS__ = [];

const __DIAGNOSTICS__ = [];

const __ASYNC__ = new Map();

const __WATCHDOGS__ = new Map();

const __LOCKS__ = new Set();

const __ERRORS__ = [];

const __MEMORY__ = [];

const __EVENT_QUEUE__ = [];

const __RUNTIME__ = Object.seal({

    booted: false,

    initialized: false,

    locked: false,

    recovering: false,

    healthy: true,

    panicMode: false,

    online: navigator.onLine,

    memoryPressure: false,

    lastHeartbeat: Date.now(),

    activeTasks: 0,

    eventRate: 0,

    destroyed: false

});

/**
 * =========================================================
 * Utilities
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

function deepFreeze(target) {

    if (

        !target ||

        typeof target !== 'object'

    ) {

        return target;

    }

    Object

        .getOwnPropertyNames(target)

        .forEach((key) => {

            const value = target[key];

            if (

                value &&

                typeof value === 'object' &&

                !Object.isFrozen(value)

            ) {

                deepFreeze(value);

            }

        });

    return Object.freeze(target);

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
 * Runtime Error
 * =========================================================
 */

class SystemCoreError extends Error {

    constructor(message, metadata = {}) {

        super(message);

        this.name = 'SystemCoreError';

        this.timestamp = now();

        this.metadata = metadata;

    }

}

/**
 * =========================================================
 * Diagnostics
 * =========================================================
 */

const Diagnostics = {

    push(type, message, metadata = {}) {

        const payload = {

            id: uuid(),

            type,

            message,

            metadata,

            timestamp: now()

        };

        __DIAGNOSTICS__.push(payload);

        trim(

            __DIAGNOSTICS__,

            MAX_DIAGNOSTICS

        );

        const logger =

            type === 'error'

                ? console.error

                : type === 'warn'

                    ? console.warn

                    : console.log;

        logger(

            `[SYSTEM_CORE] ${message}`,

            metadata

        );

    },

    info(message, metadata = {}) {

        Diagnostics.push(

            'info',

            message,

            metadata

        );

    },

    warn(message, metadata = {}) {

        Diagnostics.push(

            'warn',

            message,

            metadata

        );

    },

    error(message, metadata = {}) {

        __ERRORS__.push({

            message,

            metadata,

            timestamp: now()

        });

        trim(

            __ERRORS__,

            MAX_RUNTIME_ERRORS

        );

        Diagnostics.push(

            'error',

            message,

            metadata

        );

    },

    getAll() {

        return deepClone(

            __DIAGNOSTICS__

        );

    },

    clear() {

        __DIAGNOSTICS__.length = 0;

    }

};

/**
 * =========================================================
 * Runtime Locks
 * =========================================================
 */

const LOCKS = {

    acquire(lockName) {

        if (

            __LOCKS__.has(lockName)

        ) {

            return false;

        }

        __LOCKS__.add(lockName);

        return true;

    },

    release(lockName) {

        __LOCKS__.delete(lockName);

    },

    clear() {

        __LOCKS__.clear();

    }

};

/**
 * =========================================================
 * DOM Engine
 * =========================================================
 */

const DOM = {

    get(contract) {

        if (

            !contract ||

            !contract.id

        ) {

            throw new SystemCoreError(

                'Invalid DOM Contract'

            );

        }

        const element =

            document.getElementById(

                contract.id

            );

        if (

            !element &&

            contract.required

        ) {

            throw new SystemCoreError(

                `DOM Missing: ${contract.id}`

            );

        }

        return element || null;

    },

    text(contract, value = '') {

        const element = DOM.get(contract);

        if (!element) return;

        element.textContent = String(value);

    },

    html(contract, value = '') {

        const element = DOM.get(contract);

        if (!element) return;

        element.innerHTML = String(value);

    },

    clear(contract) {

        const element = DOM.get(contract);

        if (!element) return;

        element.innerHTML = '';

    },

    show(contract) {

        const element = DOM.get(contract);

        if (!element) return;

        element.classList.remove(

            'hidden'

        );

    },

    hide(contract) {

        const element = DOM.get(contract);

        if (!element) return;

        element.classList.add(

            'hidden'

        );

    }

};

/**
 * =========================================================
 * State Engine
 * =========================================================
 */

const STATE = {

    initialize() {

        Object

            .values(REGISTRY.STATE)

            .forEach(entry => {

                if (

                    !__STATE__.has(entry.key)

                ) {

                    __STATE__.set(

                        entry.key,

                        deepClone(

                            entry.default ?? null

                        )

                    );

                }

            });

    },

    get(key) {

        return deepClone(

            __STATE__.get(key)

        );

    },

    set(key, value) {

        __STATE__.set(

            key,

            deepClone(value)

        );

        if (key === REGISTRY.STATE.MENU.key) {

            EVENTS.emit(REGISTRY.EVENTS.MENU.UPDATED, { menu: value });

        } else if (key === REGISTRY.STATE.OUT_OF_STOCK_ITEMS.key) {

            EVENTS.emit(REGISTRY.EVENTS.MENU.STOCK_CHANGED, { outOfStockItems: value });

        } else if (key === REGISTRY.STATE.CART.key) {

            EVENTS.emit(REGISTRY.EVENTS.CART.UPDATED, { cart: value });

        } else if (key === REGISTRY.STATE.CHECKOUT.key) {

            EVENTS.emit(REGISTRY.EVENTS.CHECKOUT.UPDATED, { checkout: value });

        } else {

            EVENTS.emit(REGISTRY.EVENTS.CONFIG.UPDATED, { key, value });

        }

    },

    merge(key, payload = {}) {

        const current =

            STATE.get(key);

        STATE.set(

            key,

            {

                ...current,

                ...deepClone(payload)

            }

        );

    },

    clear(key) {

        __STATE__.delete(key);

    },

    dump() {

        return deepClone(

            Object.fromEntries(__STATE__)

        );

    }

};

/**
 * =========================================================
 * Event Queue Engine
 * =========================================================
 */

const EVENT_QUEUE = {

    push(eventName, payload) {

        __EVENT_QUEUE__.push({

            id: uuid(),

            eventName,

            payload,

            timestamp: now()

        });

        trim(

            __EVENT_QUEUE__,

            MAX_EVENT_QUEUE

        );

    },

    detectFlood() {

        const recent =

            __EVENT_QUEUE__.filter(event => {

                return (

                    now() - event.timestamp

                    < 1000

                );

            });

        __RUNTIME__.eventRate =

            recent.length;

        if (

            recent.length >

            EVENT_FLOOD_LIMIT

        ) {

            Diagnostics.warn(

                'Event Flood Detected',

                {

                    count:

                        recent.length                }

            );

        }

    }

};

/**
 * =========================================================
 * Event Bus
 * =========================================================
 */

const EVENTS = {

    on(eventName, callback) {

        if (

            typeof callback !== 'function'

        ) {

            throw new SystemCoreError(

                'Invalid Event Callback'

            );

        }

        if (

            !__EVENTS__.has(eventName)

        ) {

            __EVENTS__.set(

                eventName,

                []

            );

        }

        __EVENTS__

            .get(eventName)

            .push(callback);

    },

    off(eventName, callback) {

        if (

            !__EVENTS__.has(eventName)

        ) {

            return;

        }

        __EVENTS__.set(

            eventName,

            __EVENTS__

                .get(eventName)

                .filter(fn => fn !== callback)

        );

    },

    emit(eventName, payload = {}) {

        EVENT_QUEUE.push(

            eventName,

            payload

        );

        if (

            !__EVENTS__.has(eventName)

        ) {

            return;

        }

        __EVENTS__

            .get(eventName)

            .forEach(listener => {

                const start = performance.now();

                try {

                    listener(

                        deepClone(payload)

                    );

                } catch (error) {

                    Diagnostics.error(

                        `Event Failure: ${eventName}`,

                        { error }

                    );

                }

                const duration =

                    performance.now() - start;

                if (

                    duration >

                    MAX_EVENT_EXECUTION_TIME

                ) {

                    Diagnostics.warn(

                        'Slow Event Execution',

                        {

                            eventName,

                            duration

                        }

                    );

                }

            });

    },

    clear(eventName = null) {

        if (eventName) {

            __EVENTS__.delete(eventName);

            return;

        }

        __EVENTS__.clear();

    }

};

/**
 * =========================================================
 * Task Scheduler
 * =========================================================
 */

const TASKS = {

    async run(taskName, callback, options = {}) {

        const {

            timeout = MAX_ASYNC_TIMEOUT,

            priority = 'normal'

        } = options;

        const taskId = uuid();

        __RUNTIME__.activeTasks++;

        __TASKS__.push({

            id: taskId,

            taskName,

            priority,

            timestamp: now()

        });

        trim(

            __TASKS__,

            MAX_TASK_QUEUE

        );

        const controller =

            new AbortController();

        __ASYNC__.set(

            taskId,

            controller

        );

        const timeoutId = setTimeout(() => {

            controller.abort();

        }, timeout);

        try {

            const result = await callback({

                signal:

                    controller.signal

            });

            return result;

        } catch (error) {

            Diagnostics.error(

                `Task Failure: ${taskName}`,

                { error }

            );

            throw error;

        } finally {

            clearTimeout(timeoutId);

            __ASYNC__.delete(taskId);

            __RUNTIME__.activeTasks--;

        }

    },

    abortAll() {

        __ASYNC__.forEach(controller => {

            controller.abort();

        });

        __ASYNC__.clear();

    }

};

/**
 * =========================================================
 * Recovery Engine
 * =========================================================
 */

const RECOVERY = {

    async recover() {

        if (

            __RUNTIME__.recovering

        ) {

            return false;

        }

        __RUNTIME__.recovering = true;

        try {

            Diagnostics.warn(

                'Runtime Recovery Started'

            );

            await TASKS.run(

                'runtime_recovery',

                async () => {

                    EVENTS.clear();

                    LOCKS.clear();

                }

            );

            __RUNTIME__.healthy = true;

            Diagnostics.info(

                'Runtime Recovery Completed'

            );

            return true;

        } catch (error) {

            Diagnostics.error(

                'Recovery Failure',

                { error }

            );

            return false;

        } finally {

            __RUNTIME__.recovering = false;

        }

    },

    safeMode() {

        __RUNTIME__.panicMode = true;

        Diagnostics.warn(

            'Emergency Safe Mode Activated'

        );

    }

};

/**
 * =========================================================
 * Memory Protection
 * =========================================================
 */

const MEMORY = {

    snapshot() {

        const payload = {

            timestamp: now(),

            heap:

                performance.memory

                    ? Math.round(

                        performance.memory.usedJSHeapSize /

                        1048576

                    )

                    : 0,

            dom:

                document

                    .querySelectorAll('*')

                    .length,

            events:

                __EVENTS__.size,

            tasks:

                __TASKS__.length

        };

        __MEMORY__.push(payload);

        trim(

            __MEMORY__,

            MAX_MEMORY_SNAPSHOTS

        );

        return payload;

    },

    detectPressure() {

        if (

            !performance.memory

        ) {

            return false;

        }

        const heap =

            Math.round(

                performance.memory.usedJSHeapSize /

                1048576

            );

        if (heap > 250) {

            __RUNTIME__.memoryPressure = true;

            Diagnostics.warn(

                'Memory Pressure Detected',

                { heap }

            );

            return true;

        }

        return false;

    },

    cleanup() {

        trim(

            __TASKS__,

            100

        );

        trim(

            __ERRORS__,

            100

        );

        trim(

            __MEMORY__,

            50

        );

    }

};

/**
 * =========================================================
 * Runtime Watchdog
 * =========================================================
 */

const WATCHDOG = {

    start(name, callback, interval) {

        if (

            __WATCHDOGS__.has(name)

        ) {

            return;

        }

        const runtime = setInterval(

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
 * Runtime Health
 * =========================================================
 */

const HEALTH = {

    calculate() {

        const errors =

            __ERRORS__.length;

        if (errors === 0) {

            __RUNTIME__.healthy = true;

            return 'excellent';

        }

        if (errors < 5) {

            return 'stable';

        }

        if (errors < 15) {

            return 'warning';

        }

        __RUNTIME__.healthy = false;

        return 'critical';

    },

    status() {

        return deepFreeze({

            runtime:

                deepClone(__RUNTIME__),

            errors:

                deepClone(__ERRORS__),

            diagnostics:

                deepClone(__DIAGNOSTICS__),

            tasks:

                deepClone(__TASKS__),

            memory:

                deepClone(__MEMORY__)

        });

    }

};

/**
 * =========================================================
 * Runtime Guards
 * =========================================================
 */

const GUARDS = {

    protectGlobals() {

        Object.defineProperty(

            window,

            '__BOSE_RUNTIME_KERNEL__',

            {

                value: true,

                configurable: false,

                writable: false

            }

        );

    },

    freezeRegistry() {

        deepFreeze(REGISTRY);

    }

};

/**
 * =========================================================
 * Safe Execute
 * =========================================================
 */

async function safeExecute(

    callback,

    fallback = null

) {

    try {

        return await callback();

    } catch (error) {

        Diagnostics.error(

            'Safe Execute Failure',

            { error }

        );

        return fallback;

    }

}

/**
 * =========================================================
 * Bootstrap
 * =========================================================
 */

async function boot() {

    if (__RUNTIME__.booted) {

        return true;

    }

    Diagnostics.info(

        'Enterprise Runtime Kernel Boot Started'

    );

    GUARDS.protectGlobals();

    GUARDS.freezeRegistry();

    STATE.initialize();

    WATCHDOG.start(

        'runtime_health',

        () => {

            HEALTH.calculate();

        },

        RUNTIME_HEALTH_INTERVAL

    );

    WATCHDOG.start(

        'memory_cleanup',

        () => {

            MEMORY.cleanup();

        },

        MEMORY_CLEANUP_INTERVAL

    );

    WATCHDOG.start(

        'event_monitor',

        () => {

            EVENT_QUEUE.detectFlood();

        },

        WATCHDOG_INTERVAL

    );

    WATCHDOG.start(

        'memory_monitor',

        () => {

            MEMORY.snapshot();

            MEMORY.detectPressure();

        },

        WATCHDOG_INTERVAL

    );

    __RUNTIME__.booted = true;

    __RUNTIME__.initialized = true;

    Diagnostics.info(

        'Enterprise Runtime Kernel Ready'

    );

    EVENTS.emit(

        REGISTRY.EVENTS.SYSTEM.READY,

        {

            runtime: 'SYSTEM_CORE',

            status: 'READY'

        }

    );

    return true;

}

/**
 * =========================================================
 * Cleanup
 * =========================================================
 */

function cleanup() {

    WATCHDOG.stopAll();

    TASKS.abortAll();

    EVENTS.clear();

    LOCKS.clear();

    __RUNTIME__.destroyed = true;

    Diagnostics.info(

        'Runtime Cleanup Completed'

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

        Diagnostics.error(

            event.message,

            {

                filename:

                    event.filename,

                line:

                    event.lineno

            }

        );

    }

);

window.addEventListener(

    'unhandledrejection',

    (event) => {

        Diagnostics.error(

            'Unhandled Promise Rejection',

            {

                reason:

                    event.reason

            }

        );

    }

);

window.addEventListener(

    'online',

    () => {

        __RUNTIME__.online = true;

    }

);

window.addEventListener(

    'offline',

    () => {

        __RUNTIME__.online = false;

    }

);

window.addEventListener(

    'beforeunload',

    cleanup

);

/**
 * =========================================================
 * Public API
 * =========================================================
 */

export const SYSTEM_CORE = deepFreeze({

    VERSION: CORE_VERSION,

    boot,

    DOM,

    STATE,

    EVENTS,

    TASKS,

    Diagnostics,

    MEMORY,

    RECOVERY,

    HEALTH,

    WATCHDOG,

    LOCKS,

    GUARDS,

    safeExecute,

    cleanup

});

/**
 * =========================================================
 * Auto Bootstrap
 * =========================================================
 */

safeExecute(async () => {

    await boot();

});

/**
 * =========================================================
 * Export
 * =========================================================
 */

export default SYSTEM_CORE;
