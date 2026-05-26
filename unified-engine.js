/**
 * =========================================================
 * Bose Sweets — Enterprise UX & Rendering Engine
 * =========================================================
 * File               : unified-engine.js
 * Architecture Level : ENTERPRISE UX INFRASTRUCTURE
 * Runtime Level      : ULTRA PERFORMANCE
 * Rendering Level    : VIRTUALIZED
 * Mobile Level       : LOW MEMORY / LOW DATA
 * =========================================================
 */

'use strict';

import REGISTRY from './system-registry.js';

import SYSTEM_CORE from './system-core.js';

import FIREBASE_ENGINE from './firebase-engine.js';

import COMMERCE_ENGINE from './commerce-engine.js';

/**
 * =========================================================
 * Constants
 * =========================================================
 */

const ENGINE_VERSION = '9.0.0';

const MAX_RENDER_QUEUE = 500;

const MAX_RENDER_BATCH = 25;

const MAX_CACHE_SIZE = 100;

const MAX_IDLE_CALLBACK = 5000;

const RENDER_FRAME_TIME = 16;

const MAX_SCROLL_EVENTS = 80;

const CLEANUP_INTERVAL = 30000;

const CACHE_TTL = 300000;

const MOBILE_MEMORY_LIMIT = 120;

/**
 * =========================================================
 * Runtime
 * =========================================================
 */

const __RUNTIME__ = Object.seal({

    initialized: false,

    booted: false,

    rendering: false,

    navigating: false,

    lowMemoryMode: false,

    offlineMode: false,

    currentSection: 'home',

    currentRoute: '/',

    activeRenders: 0,

    scrollLocked: false,

    suspended: false

});

/**
 * =========================================================
 * Queues & Stores
 * =========================================================
 */

const __RENDER_QUEUE__ = [];

const __CACHE__ = new Map();

const __SECTIONS__ = new Map();

const __RENDER_BATCH__ = [];

const __NAVIGATION_STACK__ = [];

const __INTERACTIONS__ = [];

const __IDLE_TASKS__ = [];

const __IMAGE_OBSERVERS__ = new Map();

const __LIFECYCLES__ = new Map();

const __MEMORY__ = [];

const __PERFORMANCE__ = [];

const __DOM_SNAPSHOTS__ = [];

const __WATCHDOGS__ = new Map();

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

function uuid() {

    return crypto.randomUUID();

}

function trim(array, max) {

    if (array.length > max) {

        array.splice(

            0,

            array.length - max

        );

    }

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

function idle(callback) {

    if (

        'requestIdleCallback' in window

    ) {

        return requestIdleCallback(

            callback,

            {

                timeout:

                    MAX_IDLE_CALLBACK

            }

        );

    }

    return setTimeout(

        callback,

        1

    );

}

/**
 * =========================================================
 * Cache Engine
 * =========================================================
 */

const CACHE = {

    set(key, value) {

        __CACHE__.set(key, {

            value:

                deepClone(value),

            timestamp:

                now()

        });

        if (

            __CACHE__.size >

            MAX_CACHE_SIZE

        ) {

            const oldest =

                __CACHE__

                    .keys()

                    .next()

                    .value;

            __CACHE__.delete(oldest);

        }

    },

    get(key) {

        if (

            !__CACHE__.has(key)

        ) {

            return null;

        }

        const cache =

            __CACHE__.get(key);

        if (

            now() - cache.timestamp >

            CACHE_TTL

        ) {

            __CACHE__.delete(key);

            return null;

        }

        return deepClone(

            cache.value

        );

    },

    remove(key) {

        __CACHE__.delete(key);

    },

    clear() {

        __CACHE__.clear();

    }

};

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

            fragment.appendChild(node);

        });

        return fragment;

    }

};

/**
 * =========================================================
 * Render Queue
 * =========================================================
 */

const RENDER_QUEUE = {

    push(task) {

        __RENDER_QUEUE__.push({

            id: uuid(),

            ...task,

            timestamp: now()

        });

        trim(

            __RENDER_QUEUE__,

            MAX_RENDER_QUEUE

        );

    },

    async process() {

        if (

            __RUNTIME__.rendering

        ) {

            return;

        }

        __RUNTIME__.rendering = true;

        try {

            while (

                __RENDER_QUEUE__.length

            ) {

                const batch =

                    __RENDER_QUEUE__

                        .splice(

                            0,

                            MAX_RENDER_BATCH

                        );

                await Promise.all(

                    batch.map(task => {

                        return SYSTEM_CORE

                            .safeExecute(

                                async () => {

                                    await task.callback();

                                }

                            );

                    })

                );

                await new Promise(resolve => {

                    requestAnimationFrame(resolve);

                });

            }

        } finally {

            __RUNTIME__.rendering = false;

        }

    }

};

/**
 * =========================================================
 * Virtual Renderer
 * =========================================================
 */

const VIRTUAL_RENDERER = {

    render(container, nodes = []) {

        if (!container) {

            return;

        }

        const fragment =

            DOM.fragment(nodes);

        container.replaceChildren(

            fragment

        );

    },

    diff(container, html) {

        if (!container) {

            return;

        }

        if (

            container.__lastHTML === html

        ) {

            return;

        }

        container.innerHTML = html;

        container.__lastHTML = html;

    }

};

/**
 * =========================================================
 * Lazy Images
 * =========================================================
 */

const LAZY_IMAGES = {

    observe(image) {

        if (!image) {

            return;

        }

        const observer =

            new IntersectionObserver(

                entries => {

                    entries.forEach(entry => {

                        if (

                            entry.isIntersecting

                        ) {

                            const target =

                                entry.target;

                            target.src =

                                target.dataset.src;

                            observer.unobserve(target);

                        }

                    });

                },

                {

                    rootMargin: '150px'

                }

            );

        observer.observe(image);

        __IMAGE_OBSERVERS__.set(

            image,

            observer

        );

    },

    disconnect() {

        __IMAGE_OBSERVERS__

            .forEach(observer => {

                observer.disconnect();

            });

        __IMAGE_OBSERVERS__.clear();

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

            __RUNTIME__.currentRoute =

                route;

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

        } finally {

            __RUNTIME__.navigating = false;

        }

    }

};

/**
 * =========================================================
 * Section Lifecycle
 * =========================================================
 */

const SECTIONS = {

    register(name, config) {

        __SECTIONS__.set(

            name,

            deepClone(config)

        );

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

            typeof section.mount ===

            'function'

        ) {

            await section.mount();

        }

        __RUNTIME__.currentSection =

            name;

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

            typeof section.unmount ===

            'function'

        ) {

            await section.unmount();

        }

        return true;

    }

};

/**
 * =========================================================
 * Performance Engine
 * =========================================================
 */

const PERFORMANCE = {

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

            renders:

                __RUNTIME__.activeRenders

        };

        __PERFORMANCE__.push(payload);

        trim(

            __PERFORMANCE__,

            100

        );

        return payload;

    },

    detectLowMemory() {

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

        if (

            heap >

            MOBILE_MEMORY_LIMIT

        ) {

            __RUNTIME__.lowMemoryMode = true;

            warn(

                'Low Memory Mode Activated',

                { heap }

            );

            return true;

        }

        return false;

    }

};

/**
 * =========================================================
 * Scroll Optimization
 * =========================================================
 */

const SCROLL = {

    optimize() {

        let ticking = false;

        window.addEventListener(

            'scroll',

            () => {

                if (ticking) {

                    return;

                }

                ticking = true;

                requestAnimationFrame(() => {

                    EVENTS.emit(

                        'scroll:optimized'

                    );

                    ticking = false;

                });

            },

            {

                passive: true

            }

        );

    }

};

/**
 * =========================================================
 * Interaction Protection
 * =========================================================
 */

const INTERACTION = {

    debounce(callback, delay = 300) {

        let timeout;

        return (...args) => {

            clearTimeout(timeout);

            timeout = setTimeout(() => {

                callback(...args);

            }, delay);

        };

    },

    throttle(callback, limit = 250) {

        let waiting = false;

        return (...args) => {

            if (waiting) {

                return;

            }

            callback(...args);

            waiting = true;

            setTimeout(() => {

                waiting = false;

            }, limit);

        };

    }

};

/**
 * =========================================================
 * Animation Governance
 * =========================================================
 */

const ANIMATION = {

    frame(callback) {

        return requestAnimationFrame(

            callback

        );

    },

    cancel(frameId) {

        cancelAnimationFrame(frameId);

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
 * Idle Tasks
 * =========================================================
 */

const IDLE = {

    push(task) {

        __IDLE_TASKS__.push(task);

    },

    process() {

        idle(() => {

            while (

                __IDLE_TASKS__.length

            ) {

                const task =

                    __IDLE_TASKS__.shift();

                SYSTEM_CORE.safeExecute(

                    async () => {

                        await task();

                    }

                );

            }

        });

    }

};

/**
 * =========================================================
 * Cleanup Engine
 * =========================================================
 */

const CLEANUP = {

    runtime() {

        trim(

            __INTERACTIONS__,

            100

        );

        trim(

            __PERFORMANCE__,

            100

        );

        trim(

            __MEMORY__,

            50

        );

        trim(

            __DOM_SNAPSHOTS__,

            20

        );

    },

    dom() {

        DOM.queryAll(

            '[data-runtime-temp]'

        ).forEach(node => {

            node.remove();

        });

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

                await FIREBASE_ENGINE

                    .NETWORK

                    .reconnect();

            }

        );

    }

};

/**
 * =========================================================
 * Watchdogs
 * =========================================================
 */

const WATCHDOGS = {

    start(name, callback, interval) {

        if (

            __WATCHDOGS__.has(name)

        ) {

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

    if (__RUNTIME__.booted) {

        return true;

    }

    info(

        'Enterprise UX Engine Boot Started'

    );

    OFFLINE.detect();

    SCROLL.optimize();

    WATCHDOGS.start(

        'render_queue',

        async () => {

            await RENDER_QUEUE.process();

        },

        RENDER_FRAME_TIME

    );

    WATCHDOGS.start(

        'performance_monitor',

        () => {

            PERFORMANCE.snapshot();

            PERFORMANCE.detectLowMemory();

        },

        10000

    );

    WATCHDOGS.start(

        'idle_tasks',

        () => {

            IDLE.process();

        },

        5000

    );

    WATCHDOGS.start(

        'cleanup_runtime',

        () => {

            CLEANUP.runtime();

            CLEANUP.dom();

        },

        CLEANUP_INTERVAL

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

    WATCHDOGS.stopAll();

    CACHE.clear();

    LAZY_IMAGES.disconnect();

    __SECTIONS__.clear();

    __CACHE__.clear();

    __RENDER_QUEUE__.length = 0;

    __RENDER_BATCH__.length = 0;

    __INTERACTIONS__.length = 0;

    __IDLE_TASKS__.length = 0;

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

    CACHE,

    EVENTS,

    NAVIGATION,

    SECTIONS,

    PERFORMANCE,

    RENDER_QUEUE,

    VIRTUAL_RENDERER,

    LAZY_IMAGES,

    INTERACTION,

    ANIMATION,

    OFFLINE,

    IDLE,

    CLEANUP,

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
 * Export
 * =========================================================
 */

export default UNIFIED_ENGINE;