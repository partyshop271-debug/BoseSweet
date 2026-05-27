/**
 * =========================================================
 * Bose Sweets — Enterprise Firebase Infrastructure Engine
 * =========================================================
 * File               : firebase-engine.js
 * Architecture Level : PRODUCTION ENTERPRISE
 * Stability Level    : MAXIMUM
 * Runtime Policy     : STRICT GOVERNED
 * Sync Policy        : SELF HEALING
 * Network Policy     : RESILIENT
 * =========================================================
 */

'use strict';

import REGISTRY from './system-registry.js';
import SYSTEM_CORE from './system-core.js';

import {
    initializeApp,
    getApps,
    getApp
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';

import {
    initializeAuth,
    browserLocalPersistence,
    indexedDBLocalPersistence,
    browserPopupRedirectResolver,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    memoryLocalCache,
    doc,
    collection,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    enableNetwork,
    disableNetwork,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const ENGINE_VERSION = '3.1.0';
const RETRY_LIMIT = 5;
const RETRY_DELAY = 1200;
const NETWORK_TIMEOUT = 15000;
const CACHE_TTL = 1000 * 60 * 5;
const HEARTBEAT_INTERVAL = 10000;
const MAX_LISTENERS = 150;
const MAX_CACHE_ITEMS = 500;

const __LISTENERS__ = new Map();
const __CACHE__ = new Map();
const __QUEUE__ = [];
const __HEARTBEATS__ = new Map();

const __PERFORMANCE__ = {
    reads: 0,
    writes: 0,
    listeners: 0,
    uploads: 0,
    reconnects: 0
};

const __HEALTH__ = {
    initialized: false,
    online: navigator.onLine,
    authReady: false,
    firestoreReady: false,
    reconnecting: false,
    lastHeartbeat: null,
    lastSync: null,
    bootedAt: null
};

let firebaseApp = null;
let auth = null;
let firestore = null;

const FIREBASE_CONFIG = Object.freeze({
    apiKey: 'AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc',
    authDomain: 'bosy-sweets.firebaseapp.com',
    projectId: 'bosy-sweets',
    storageBucket: 'bosy-sweets.firebasestorage.app',
    messagingSenderId: '473615735083',
    appId: '1:473615735083:web:f09c6001c72640b2588d6e',
    measurementId: 'G-46D1CS3WLB'
});

const CLOUDINARY_CONFIG = Object.freeze({
    cloudName: 'dyx4w0dr1',
    uploadPreset: 'gct8i28h'
});

function deepClone(value) {
    try {
        return structuredClone(value);
    } catch {
        return JSON.parse(JSON.stringify(value));
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function now() {
    return Date.now();
}

function validatePath(pathArray) {
    if (!Array.isArray(pathArray) || !pathArray.length) {
        throw new Error('Invalid Firestore path context configuration');
    }
    return [...pathArray];
}

function buildCacheKey(pathArray) {
    return pathArray.join('/');
}

function isCacheExpired(entry) {
    if (!entry) return true;
    return (now() - entry.timestamp) > CACHE_TTL;
}

function info(message, metadata = {}) {
    SYSTEM_CORE.Diagnostics.info(`[FIREBASE] ${message}`, metadata);
}

function warn(message, metadata = {}) {
    SYSTEM_CORE.Diagnostics.warn(`[FIREBASE] ${message}`, metadata);
}

function error(message, metadata = {}) {
    SYSTEM_CORE.Diagnostics.error(`[FIREBASE] ${message}`, metadata);
}

async function withRetry(operation, options = {}) {
    const { retries = RETRY_LIMIT, delay = RETRY_DELAY, operationName = 'unknown' } = options;
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await operation();
        } catch (err) {
            attempt++;
            if (attempt >= retries) {
                error(`Retry Failed Matrix Exhausted: ${operationName}`, { attempt, error: err });
                throw err;
            }
            warn(`Retrying Network State Pipeline: ${operationName}`, { attempt, retries });
            await sleep(delay * attempt);
        }
    }
}

async function initializeFirebase() {
    if (__HEALTH__.initialized) return true;
    try {
        firebaseApp = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
        auth = initializeAuth(firebaseApp, {
            persistence: [indexedDBLocalPersistence, browserLocalPersistence],
            popupRedirectResolver: browserPopupRedirectResolver
        });
        firestore = initializeFirestore(firebaseApp, {
            localCache: navigator.onLine ? persistentLocalCache({ tabManager: persistentMultipleTabManager() }) : memoryLocalCache(),
            experimentalForceLongPolling: false,
            useFetchStreams: true
        });
        __HEALTH__.initialized = true;
        __HEALTH__.firestoreReady = true;
        __HEALTH__.authReady = true;
        __HEALTH__.bootedAt = now();
        info('Firebase Infrastructure Initialized Securely');
        return true;
    } catch (err) {
        error('Firebase Bootstrap Initialization Failed', { err });
        throw err;
    }
}

const NETWORK = {
    async disable() {
        if (!firestore) return;
        await disableNetwork(firestore);
        __HEALTH__.online = false;
    },
    async enable() {
        if (!firestore) return;
        await enableNetwork(firestore);
        __HEALTH__.online = true;
    },
    async reconnect() {
        try {
            __HEALTH__.reconnecting = true;
            await NETWORK.disable();
            await sleep(1500);
            await NETWORK.enable();
            __PERFORMANCE__.reconnects++;
            info('Realtime Cloud Network Reconnected');
        } catch (err) {
            error('Reconnect Operation Failed', { err });
        } finally {
            __HEALTH__.reconnecting = false;
        }
    }
};

const AUTH = {
    async login(email, password) {
        return withRetry(async () => {
            const result = await signInWithEmailAndPassword(auth, email, password);
            SYSTEM_CORE.EVENTS.emit(REGISTRY.EVENTS.AUTH.LOGIN_SUCCESS, { uid: result.user.uid });
            return result.user;
        }, { operationName: 'AUTH_LOGIN' });
    },
    async logout() {
        await signOut(auth);
        SYSTEM_CORE.EVENTS.emit(REGISTRY.EVENTS.AUTH.LOGOUT, {});
    },
    watch(callback) {
        if (!auth) return () => {};
        return onAuthStateChanged(auth, callback);
    }
};

const CACHE = {
    set(key, value) {
        if (__CACHE__.size >= MAX_CACHE_ITEMS) {
            const firstKey = __CACHE__.keys().next().value;
            __CACHE__.delete(firstKey);
        }
        __CACHE__.set(key, { data: deepClone(value), timestamp: now() });
    },
    get(key) {
        const entry = __CACHE__.get(key);
        if (isCacheExpired(entry)) {
            __CACHE__.delete(key);
            return null;
        }
        return deepClone(entry.data);
    },
    remove(key) { __CACHE__.delete(key); },
    clear() { __CACHE__.clear(); }
};

const DATABASE = {
    async getDocument(pathArray) {
        const path = validatePath(pathArray);
        const cacheKey = buildCacheKey(path);
        const cached = CACHE.get(cacheKey);
        if (cached) return cached;
        return withRetry(async () => {
            const reference = doc(firestore, ...path);
            const snapshot = await getDoc(reference);
            if (!snapshot.exists()) return null;
            const payload = { id: snapshot.id, ...snapshot.data() };
            CACHE.set(cacheKey, payload);
            __PERFORMANCE__.reads++;
            return payload;
        }, { operationName: 'GET_DOCUMENT' });
    },
    async getCollection(pathArray) {
        const path = validatePath(pathArray);
        return withRetry(async () => {
            const reference = collection(firestore, ...path);
            const snapshot = await getDocs(reference);
            __PERFORMANCE__.reads++;
            return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
        }, { operationName: 'GET_COLLECTION' });
    },
    async createDocument(pathArray, payload = {}) {
        const path = validatePath(pathArray);
        return withRetry(async () => {
            const reference = collection(firestore, ...path);
            const result = await addDoc(reference, {
                ...deepClone(payload),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            __PERFORMANCE__.writes++;
            __HEALTH__.lastSync = now();
            return result.id;
        }, { operationName: 'CREATE_DOCUMENT' });
    },
    async setDocument(pathArray, payload = {}) {
        const path = validatePath(pathArray);
        return withRetry(async () => {
            const reference = doc(firestore, ...path);
            await setDoc(reference, { ...deepClone(payload), updatedAt: serverTimestamp() }, { merge: true });
            __PERFORMANCE__.writes++;
            __HEALTH__.lastSync = now();
        }, { operationName: 'SET_DOCUMENT' });
    },
    async updateDocument(pathArray, payload = {}) {
        const path = validatePath(pathArray);
        return withRetry(async () => {
            const reference = doc(firestore, ...path);
            await updateDoc(reference, { ...deepClone(payload), updatedAt: serverTimestamp() });
            __PERFORMANCE__.writes++;
            __HEALTH__.lastSync = now();
        }, { operationName: 'UPDATE_DOCUMENT' });
    },
    async deleteDocument(pathArray) {
        const path = validatePath(pathArray);
        return withRetry(async () => {
            const reference = doc(firestore, ...path);
            await deleteDoc(reference);
            __PERFORMANCE__.writes++;
        }, { operationName: 'DELETE_DOCUMENT' });
    }
};

const WATCHERS = {
    collection(pathArray, callback) {
        if (__LISTENERS__.size >= MAX_LISTENERS) {
            throw new Error('Maximum snapshot listeners matrix capacity exceeded');
        }
        const path = validatePath(pathArray);
        const listenerId = generateId('listener');
        const reference = collection(firestore, ...path);
        const unsubscribe = onSnapshot(reference, (snapshot) => {
            const data = snapshot.docs.map(docItem => ({ id: docItem.id, ...docItem.data() }));
            CACHE.set(listenerId, data);
            callback(deepClone(data));
            __PERFORMANCE__.listeners++;
            __HEALTH__.lastSync = now();
        }, async (err) => {
            warn('Realtime Collection Stream Failure', { err, path });
            await NETWORK.reconnect();
        });
        __LISTENERS__.set(listenerId, unsubscribe);
        return listenerId;
    },
    document(pathArray, callback) {
        const path = validatePath(pathArray);
        const listenerId = generateId('listener');
        const reference = doc(firestore, ...path);
        const unsubscribe = onSnapshot(reference, (snapshot) => {
            const payload = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
            CACHE.set(listenerId, payload);
            callback(deepClone(payload));
            __HEALTH__.lastSync = now();
        }, async (err) => {
            warn('Document Realtime Listener Failure', { err });
            await NETWORK.reconnect();
        });
        __LISTENERS__.set(listenerId, unsubscribe);
        return listenerId;
    },
    stop(listenerId) {
        if (!__LISTENERS__.has(listenerId)) return;
        __LISTENERS__.get(listenerId)();
        __LISTENERS__.delete(listenerId);
        CACHE.remove(listenerId);
    },
    stopAll() {
        __LISTENERS__.forEach(unsub => unsub());
        __LISTENERS__.clear();
    }
};

const UPLOADS = {
    async compressImage(file) { return file; },
    async uploadImage(file) {
        return withRetry(async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!response.ok) throw new Error('Cloudinary secure asset engine upload failed');
            const result = await response.json();
            __PERFORMANCE__.uploads++;
            return result.secure_url;
        }, { operationName: 'UPLOAD_IMAGE' });
    }
};

const SYNC = {
    push(operation) { __QUEUE__.push(operation); },
    dump() { return deepClone(__QUEUE__); },
    clear() { __QUEUE__.length = 0; }
};

const HEALTH = {
    status() {
        return {
            runtime: deepClone(__HEALTH__),
            performance: deepClone(__PERFORMANCE__),
            listeners: __LISTENERS__.size,
            cache: __CACHE__.size,
            queue: __QUEUE__.length
        };
    },
    isHealthy() {
        return __HEALTH__.initialized && __HEALTH__.online && __HEALTH__.firestoreReady && __HEALTH__.authReady;
    }
};

function startHeartbeat() {
    const heartbeat = setInterval(() => { __HEALTH__.lastHeartbeat = now(); }, HEARTBEAT_INTERVAL);
    __HEARTBEATS__.set('main', heartbeat);
}

function cleanup() {
    WATCHERS.stopAll();
    CACHE.clear();
    SYNC.clear();
    __HEARTBEATS__.forEach(runtime => clearInterval(runtime));
    __HEARTBEATS__.clear();
    info('Firebase Infrastructure System Context Cleaned Successfully');
}

async function bootFirebaseEngine() {
    await initializeFirebase();
    startHeartbeat();
    window.addEventListener('online', NETWORK.enable);
    window.addEventListener('offline', NETWORK.disable);
    info('Enterprise Firebase Infrastructure Engine Connected');
    return true;
}

export const FIREBASE_ENGINE = Object.freeze({
    VERSION: ENGINE_VERSION,
    boot: bootFirebaseEngine,
    AUTH,
    DATABASE,
    WATCHERS,
    CACHE,
    UPLOADS,
    NETWORK,
    SYNC,
    HEALTH,
    cleanup
});

SYSTEM_CORE.safeExecute(async () => {
    await bootFirebaseEngine();
});

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
}

export {
    AUTH,
    DATABASE,
    WATCHERS,
    CACHE,
    UPLOADS,
    NETWORK,
    SYNC,
    HEALTH,
    cleanup
};

export default FIREBASE_ENGINE;