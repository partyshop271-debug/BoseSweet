/**
 * =========================================================
 * Bose Sweets — Enterprise UI Performance Engine
 * =========================================================
 * File               : ui-performance.js
 * Architecture Level : ENTERPRISE UI PERFORMANCE LAYER
 * Runtime Level      : ULTRA PERFORMANCE
 * Stability Level    : MAXIMUM PRODUCTION
 * Mobile Level       : LOW MEMORY / LOW DATA
 * =========================================================
 */

'use strict';

import REGISTRY from './system-registry.js';

import SYSTEM_CORE from './system-core.js';

/**
 * =========================================================
 * Constants
 * =========================================================
 */

const ENGINE_VERSION = '1.0.0';

const MAX_RENDER_QUEUE = 500;

const MAX_RENDER_BATCH = 25;

const MAX_CACHE_SIZE = 100;

const MAX_IDLE_CALLBACK = 5000;

const RENDER_FRAME_TIME = 16;

const CLEANUP_INTERVAL = 30000;

const CACHE_TTL = 300000;

const MOBILE_MEMORY_LIMIT = 120;

const MAX_PERFORMANCE_HISTORY = 100;

const MAX_MEMORY_HISTORY = 50;

const MAX_DOM_SNAPSHOTS = 20;

/**
 * =========================================================
 * Runtime
 * =========================================================
 */

const __RUNTIME__ = Object.seal({

    initialized: false,

    booted: false,

    rendering: false,

    lowMemoryMode: false,

    suspended: false,

    activeRenders: 0

});

/**
 * =========================================================
 * Internal Stores
 * =========================================================
 */

const __CACHE__ = new Map();

const __RENDER_QUEUE__ = [];

const __RENDER_BATCH__ = [];

const __IDLE_TASKS__ = [];

const __IMAGE_OBSERVERS__ = new Map();

const __WATCHDOGS__ = new Map();

const __PERFORMANCE__ = [];

const __MEMORY__ = [];

const __DOM_SNAPSHOTS__ = [];

const __INTERACTIONS__ = [];

/**
 * =========================================================
 * Diagnostics
 * =========================================================
 */

function info(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.info(

        `[UI_PERFORMANCE] ${message}`,

        metadata

    );

}

function warn(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.warn(

        `[UI_PERFORMANCE] ${message}`,

        metadata

    );

}

function error(message, metadata = {}) {

    SYSTEM_CORE.Diagnostics.error(

        `[UI_PERFORMANCE] ${message}`,

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

    },

    size() {

        return __CACHE__.size;

    }

};

/**
 * =========================================================
 * Render Queue Engine
 * =========================================================
 */

const RENDER_QUEUE = {

    push(task = {}) {

        if (

            typeof task.callback !== 'function'

        ) {

            return false;

        }

        __RENDER_QUEUE__.push({

            id: uuid(),

            priority:

                task.priority || 'normal',

            callback:

                task.callback,

            timestamp:

                now()

        });

        trim(

            __RENDER_QUEUE__,

            MAX_RENDER_QUEUE

        );

        return true;

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

                __RUNTIME__.activeRenders += batch.length;

                await Promise.all(

                    batch.map(task => {

                        return SYSTEM_CORE.safeExecute(

                            async () => {

                                await task.callback();

                            }

                        );

                    })

                );

                __RUNTIME__.activeRenders -= batch.length;

                await new Promise(resolve => {

                    requestAnimationFrame(resolve);

                });

            }

        } catch (ex) {

            error(

                'Render Queue Failure',

                { exception: ex }

            );

        } finally {

            __RUNTIME__.rendering = false;

        }

    },

    clear() {

        __RENDER_QUEUE__.length = 0;

    },

    size() {

        return __RENDER_QUEUE__.length;

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

            return false;

        }

        const fragment =

            document.createDocumentFragment();

        nodes.forEach(node => {

            if (node) {

                fragment.appendChild(node);

            }

        });

        container.replaceChildren(fragment);

        return true;

    },

    diff(container, html = '') {

        if (!container) {

            return false;

        }

        if (

            container.__lastHTML === html

        ) {

            return true;

        }

        container.innerHTML = html;

        container.__lastHTML = html;

        return true;

    }

};

/**
 * =========================================================
 * Lazy Image Engine
 * =========================================================
 */

const LAZY_IMAGES = {

    observe(image) {

        if (!image) {

            return false;

        }

        if (

            __IMAGE_OBSERVERS__.has(image)

        ) {

            return true;

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

                            const source =

                                target.dataset.src;

                            if (source) {

                                target.src = source;

                            }

                            observer.unobserve(target);

                            __IMAGE_OBSERVERS__.delete(target);

                        }

                    });

                },

                {

                    rootMargin: '150px',

                    threshold: 0.01

                }

            );

        observer.observe(image);

        __IMAGE_OBSERVERS__.set(

            image,

            observer

        );

        return true;

    },

    observeAll(selector = '.lazy-image') {

        document

            .querySelectorAll(selector)

            .forEach(image => {

                LAZY_IMAGES.observe(image);

            });

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

            heapLimit:

                performance.memory

                    ? Math.round(

                        performance.memory.jsHeapSizeLimit /

                        1048576

                    )

                    : 0,

            dom:

                document

                    .querySelectorAll('*')

                    .length,

            renders:

                __RUNTIME__.activeRenders,

            queue:

                __RENDER_QUEUE__.length,

            cache:

                __CACHE__.size

        };

        __PERFORMANCE__.push(payload);

        trim(

            __PERFORMANCE__,

            MAX_PERFORMANCE_HISTORY

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

            CACHE.clear();

            CLEANUP.runtime();

            return true;

        }

        __RUNTIME__.lowMemoryMode = false;

        return false;

    },

    getHistory() {

        return deepClone(

            __PERFORMANCE__

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

        if (

            typeof task !== 'function'

        ) {

            return false;

        }

        __IDLE_TASKS__.push(task);

        return true;

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

    },

    clear() {

        __IDLE_TASKS__.length = 0;

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

                    SYSTEM_CORE.EVENTS.emit(

                        'UI_OPTIMIZED_SCROLL'

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
 * Interaction Engine
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
 * Animation Engine
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

            MAX_PERFORMANCE_HISTORY

        );

        trim(

            __MEMORY__,

            MAX_MEMORY_HISTORY

        );

        trim(

            __DOM_SNAPSHOTS__,

            MAX_DOM_SNAPSHOTS

        );

    },

    dom() {

        document

            .querySelectorAll(

                '[data-runtime-temp]'

            )

            .forEach(node => {

                node.remove();

            });

    },

    aggressive() {

        CACHE.clear();

        CLEANUP.runtime();

        CLEANUP.dom();

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

            return false;

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

        return true;

    },

    stop(name) {

        if (

            !__WATCHDOGS__.has(name)

        ) {

            return false;

        }

        clearInterval(

            __WATCHDOGS__.get(name)

        );

        __WATCHDOGS__.delete(name);

        return true;

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
 * Runtime Suspend / Resume
 * =========================================================
 */

const RUNTIME = {

    suspend() {

        __RUNTIME__.suspended = true;

    },

    resume() {

        __RUNTIME__.suspended = false;

    },

    status() {

        return deepClone(__RUNTIME__);

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

        'UI Performance Engine Boot Started'

    );

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

    document.addEventListener(

        'visibilitychange',

        () => {

            if (document.hidden) {

                RUNTIME.suspend();

            } else {

                RUNTIME.resume();

            }

        },

        {

            passive: true

        }

    );

    __RUNTIME__.initialized = true;

    __RUNTIME__.booted = true;

    SYSTEM_CORE.EVENTS.emit(

        REGISTRY.EVENTS.SYSTEM.READY,

        {

            runtime:

                'UI_PERFORMANCE',

            status:

                'READY'

        }

    );

    info(

        'UI Performance Engine Ready'

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

    RENDER_QUEUE.clear();

    IDLE.clear();

    LAZY_IMAGES.disconnect();

    __RENDER_BATCH__.length = 0;

    __INTERACTIONS__.length = 0;

    __PERFORMANCE__.length = 0;

    __MEMORY__.length = 0;

    __DOM_SNAPSHOTS__.length = 0;

    info(

        'UI Performance Engine Cleanup Completed'

    );

}

/**
 * =========================================================
 * Global Cleanup
 * =========================================================
 */

window.addEventListener(

    'beforeunload',

    cleanup

);

/**
 * =========================================================
 * Public API
 * =========================================================
 */

export const UI_PERFORMANCE = Object.freeze({

    VERSION: ENGINE_VERSION,

    boot,

    CACHE,

    RENDER_QUEUE,

    VIRTUAL_RENDERER,

    LAZY_IMAGES,

    PERFORMANCE,

    IDLE,

    SCROLL,

    INTERACTION,

    ANIMATION,

    CLEANUP,

    WATCHDOGS,

    RUNTIME,

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
 * Export
 * =========================================================
 */

export default UI_PERFORMANCE;