```javascript
/**
 * ============================================================================
 * 👑 BoseSweets Sovereign Unified Engine | المحرك السيادي الموحد (V39.6 Premium)
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي (The Management)
 * الحالة: دمج شامل، توحيد مسارات الفايربيز، ودعم كامل للهوية البصرية الموحدة.
 * التحديث الأخير (V39.6 Premium): حل مشكلة التراجع الهندسي ومزامنة لوحة التحكم 
 * اللحظية، وتطبيق قواعد العرض المزدوج والأبعاد المطلقة للكروت مع استعادة 
 * كامل قنوات التوافق الرجعي ومحاكي التنسيق الفاخر دون أي تعارض برمجي.
 * ============================================================================
 */

// ============================================================================
// 🔒 القسم الأول: التهيئة السحابية ونظام المراقبة العميقة (BoseMonitor)
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getFirestore, 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager, 
    doc, 
    setDoc, 
    deleteDoc,
    collection, 
    query, 
    where, 
    getDocs, 
    getDoc, 
    onSnapshot,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 👑 الإعدادات السيادية والمفاتيح الخاصة بقاعدة بيانات حلويات بوسي
export const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e",
    measurementId: "G-6S8EXY7Y4P" 
};

let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
    auth = getAuth(app);
    
    if (typeof window !== 'undefined') {
        window.firebaseApp = app;
        window.db = db;
        window.auth = auth;
        window.BoseSweets_Engine_Version = "V39.6_Premium";
    }
} catch (error) {
    console.error("🔒 قرار إداري أمني: فشل تهيئة السحابة، يرجى مراجعة الخوادم فوراً.", error);
}

export { app, db, auth };

const ConnectionGuard = {
    maxRetries: 5,
    retryDelay: 2000,
    active: false,
    retryCount: 0
};

function handleConnectionDrop(retryFunction) {
    ConnectionGuard.active = false;
    if (ConnectionGuard.retryCount < ConnectionGuard.maxRetries) {
        ConnectionGuard.retryCount++;
        setTimeout(retryFunction, ConnectionGuard.retryDelay);
    }
}

// 🛡️ الصندوق الأسود (BoseMonitor) لرصد وتحليل الأعطال بالموقع تلقائياً
(function() {
    if (typeof window === 'undefined' || window.BoseMonitor) return;

    window.BoseMonitor = {
        logQueue: [],
        diagnose: function(errorMsg) {
            const msg = String(errorMsg).toLowerCase();
            if (msg.includes('auth') || msg.includes('credential')) return "عائق توثيق (Auth Error): فشل في تأكيد الصلاحيات مع السحابة.";
            if (msg.includes('network') || msg.includes('fetch') || msg.includes('offline')) return "عطل اتصالي (Network): المحرك فقد الاتصال بالسحابة المركزية.";
            if (msg.includes('permission') || msg.includes('access-denied')) return "رفض سيادي (Permission): محاولة الوصول لبيانات غير مصرح بها.";
            if (msg.includes('quota') || msg.includes('exceeded')) return "اختناق سحابي (Quota): تجاوز الحد الأقصى لعمليات السحابة المسموح بها.";
            if (msg.includes('null (reading') || msg.includes('undefined (reading')) return "انهيار هيكلي (DOM): محاولة قراءة بيانات مفقودة أو الواجهة فقدت حقول أساسية.";
            return "خلل تقني مجهول يتطلب تحليلاً برمجياً عميقاً.";
        },
        parseStackTrace: function(stack) {
            if (!stack) return { file: 'unified-engine.js', line: 'غير معروف', col: 'غير معروف' };
            const lines = stack.split('\n');
            for (let i = 1; i < lines.length; i++) {
                const match = lines[i].match(/(.*):(\d+):(\d+)/);
                if (match) return { file: match[1].split('/').pop(), line: match[2], col: match[3] };
            }
            return { file: 'تحليل معقد', line: 'N/A', col: 'N/A' };
        },
        report: async function(error, sourceFile = 'unified-engine.js', lineNo = null, colNo = null, functionName = 'رصد تلقائي (Auto-Detect)') {
            try {
                const errorMessage = error && error.message ? error.message : String(error);
                const stackTrace = error && error.stack ? error.stack : 'لا يوجد تتبع برمجي متاح';
                const parsedStack = this.parseStackTrace(stackTrace);
                const finalFile = sourceFile || parsedStack.file;
                
                const reportData = {
                    fileName: finalFile,
                    functionName: functionName,
                    errorMessage: errorMessage,
                    stackTrace: stackTrace,
                    diagnosis: this.diagnose(errorMessage),
                    timestamp: Date.now(),
                    status: 'unresolved',
                    clientDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Device',
                    url: window.location.href,
                    isLoginPortal: false,
                    engineVersion: 'V39.6_Premium'
                };
                this.saveToDatabase(reportData);
            } catch (e) {}
        },
        saveToDatabase: async function(reportData) {
            try {
                reportData.serverTime = new Date();
                if (db) {
                    const logsRef = collection(db, 'system_logs');
                    await setDoc(doc(logsRef), reportData);
                    if (this.logQueue.length > 0) this.syncQueueToDatabase();
                } else {
                    this.saveToLocalStorage(reportData);
                }
            } catch (dbError) {
                this.saveToLocalStorage(reportData);
            }
        },
        syncQueueToDatabase: async function() {
            if (!db) return;
            while (this.logQueue.length > 0) {
                const item = this.logQueue.shift();
                try { 
                    const logsRef = collection(db, 'system_logs');
                    await setDoc(doc(logsRef), item); 
                } 
                catch (e) { this.logQueue.unshift(item); break; }
            }
        },
        saveToLocalStorage: function(reportData) {
            try {
                let localLogs = JSON.parse(localStorage.getItem('bose_blackbox_logs') || '[]');
                if (localLogs.length > 100) localLogs.shift();
                localLogs.push(reportData);
                localStorage.setItem('bose_blackbox_logs', JSON.stringify(localLogs));
            } catch(err) {}
        },
        initGlobalWatch: function() {
            window.addEventListener('error', (event) => {
                let fName = event.filename ? event.filename.split('/').pop() : 'unified-engine.js';
                this.report(event.error || event.message, fName, null, null, 'رصد تلقائي (Global Error)');
            });
            window.addEventListener('unhandledrejection', (event) => {
                this.report(event.reason || 'عملية خلفية تم رفضها ولم تعالج', 'unified-engine.js', null, null, 'عملية شبكية (Promise Rejection)');
            });
        }
    };
    window.BoseMonitor.initGlobalWatch();
})();

// ============================================================================
// 🔒 القسم الثاني: نظام حفظ الذاكرة ومحرك التخزين المحلي (IndexedDB)
// ============================================================================

export const StorageEngine = {
    dbName: 'BoseSweetsDB',
    storeName: 'DataCore',
    version: 1,
    db: null,
    init() {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                resolve(null);
                return;
            }
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(this.storeName)) {
                    database.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    },
    set(key, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) { resolve(null); return; }
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    },
    get(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) { resolve(null); return; }
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }
};

if (typeof window !== 'undefined') {
    window.StorageEngine = StorageEngine;
}

StorageEngine.init().then(() => {
    if (typeof window !== 'undefined' && typeof window.loadEngineMemory === 'function') {
        window.loadEngineMemory();
    }
}).catch(err => {
    if (window.BoseMonitor) window.BoseMonitor.report(err, 'unified-engine.js', null, null, 'StorageEngine.init');
});

window.saveEngineMemory = async function(type) {
    try {
        if (type === 'cat') {
            await StorageEngine.set('bose_catalog', BoseState.catalog);
        } else if (type === 'theme') {
            await StorageEngine.set('bose_theme', BoseState.theme);
        }
    } catch (e) {
        if (window.BoseMonitor) window.BoseMonitor.report(e, 'unified-engine.js', null, null, 'saveEngineMemory');
    }
};

window.loadEngineMemory = async function() {
    try {
        const cachedCatalog = await StorageEngine.get('bose_catalog');
        const cachedTheme = await StorageEngine.get('bose_theme');
        
        if (cachedCatalog && cachedCatalog.length > 0 && BoseState.catalog.length === 0) {
            BoseState.catalog = cachedCatalog;
            syncCatalogMap();
            distributeProductsToUI();
        }
        if (cachedTheme && Object.keys(cachedTheme).length > 0 && Object.keys(BoseState.theme).length === 0) {
            BoseState.theme = cachedTheme;
            applyThemeConfigUI();
        }
    } catch (e) {
        if (window.BoseMonitor) window.BoseMonitor.report(e, 'unified-engine.js', null, null, 'loadEngineMemory');
    }
};

// ============================================================================
// 🛡️ القسم الثالث: محركات المزامنة والطوارئ (ReverseSync & CloudQueue)
// ============================================================================

export const ReverseSyncEngine = {
    triggerOrderWebhook(orderData) {
        try {
            const webhookUrl = 'https://us-central1-bosy-sweets.cloudfunctions.net/secureReverseSync';
            if (orderData && orderData.status === 'pending') {
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source: 'BoseSweets_Engine_Sovereign_V39.6_Premium',
                        engine_status: 'Active_Sovereign',
                        type: 'new_order_fallback',
                        orderId: orderData.id,
                        customerName: orderData.customerName || orderData.name,
                        customerPhone: orderData.customerPhone || orderData.phone,
                        area: orderData.deliveryMode || orderData.area || 'غير محدد',
                        total: orderData.total,
                        timestamp: orderData.timestamp,
                        itemsCount: orderData.itemsArray ? orderData.itemsArray.length : 0
                    })
                }).catch(() => {});
            }
        } catch (error) {}
    },
    async broadcastGlobalUpdate() {
        try {
            if (db) {
                const syncDocRef = doc(db, 'system', 'syncFlag');
                await setDoc(syncDocRef, { lastAdminUpdate: Date.now(), version: 'V39.6_Premium', forceRefresh: true }, { merge: true });
            }
        } catch (error) {}
    }
};

export const CloudQueueDB = {
    dbName: 'BoseSweetsCloudQueue', storeName: 'Operations', version: 4,
    isSupported() { return typeof window !== 'undefined' && window.indexedDB != null; },
    getFallbackQueue() { try { return JSON.parse(localStorage.getItem('BoseSweets_Emergency_Queue') || '[]'); } catch (e) { return []; } },
    setFallbackQueue(queue) { try { localStorage.setItem('BoseSweets_Emergency_Queue', JSON.stringify(queue)); } catch (e) {} },
    init() {
        return new Promise((resolve) => {
            if (!this.isSupported()) return resolve(null);
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(this.storeName)) database.createObjectStore(this.storeName, { keyPath: 'queueId' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    },
    async enqueue(operation) {
        try {
            const database = await this.init();
            if (!database) {
                let fallbackQ = this.getFallbackQueue();
                fallbackQ.push({ ...operation, queueId: 'op_' + Date.now().toString(36), createdAt: Date.now() });
                this.setFallbackQueue(fallbackQ);
                return true;
            }
            const tx = database.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).put({ ...operation, queueId: 'op_' + Date.now().toString(36), createdAt: Date.now() });
            return true;
        } catch (e) { return false; }
    },
    async getAll() {
        try {
            let results = this.getFallbackQueue();
            const database = await this.init();
            if (!database) return results;
            return new Promise((resolve) => {
                const tx = database.transaction(this.storeName, 'readonly');
                const request = tx.objectStore(this.storeName).getAll();
                request.onsuccess = () => resolve([...results, ...(request.result || [])]);
                request.onerror = () => resolve(results); 
            });
        } catch (e) { return []; }
    },
    async remove(queueId) {
        try {
            let fallbackQ = this.getFallbackQueue();
            fallbackQ = fallbackQ.filter(op => op.queueId !== queueId);
            this.setFallbackQueue(fallbackQ);
            const database = await this.init();
            if (!database) return false;
            const tx = database.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).delete(queueId);
            return true;
        } catch (e) { return false; }
    }
};

export const NetworkEngine = {
    async safeWrite(collectionName, docId, data) {
        try {
            if (collectionName === 'settings' && docId === 'main') {
                if (!auth || !auth.currentUser) throw new Error("🔒 توثيق الإدارة مطلوب.");
            }
            if (!db) throw new Error("Database not ready.");
            await setDoc(doc(db, collectionName, String(docId)), data, { merge: true });
            if (collectionName === 'orders') ReverseSyncEngine.triggerOrderWebhook(data);
            else if (['settings', 'catalog', 'shipping', 'gallery'].includes(collectionName)) ReverseSyncEngine.broadcastGlobalUpdate();
            return true;
        } catch (error) {
            await CloudQueueDB.enqueue({ type: 'write', collectionName, docId, data });
            return true; 
        }
    },
    async safeDelete(collectionName, docId) {
        try {
            if (!db) throw new Error("Database not ready.");
            await deleteDoc(doc(db, collectionName, String(docId)));
            if (['settings', 'catalog', 'shipping', 'gallery'].includes(collectionName)) ReverseSyncEngine.broadcastGlobalUpdate();
            return true;
        } catch (error) {
            await CloudQueueDB.enqueue({ type: 'delete', collectionName, docId });
            return true;
        }
    },
    async processQueue() {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        const queue = await CloudQueueDB.getAll();
        if (queue.length === 0 || !db) return;
        for (const op of queue) {
            try {
                if (op.type === 'write') await setDoc(doc(db, op.collectionName, String(op.docId)), op.data, { merge: true });
                else if (op.type === 'delete') await deleteDoc(doc(db, op.collectionName, String(op.docId)));
                await CloudQueueDB.remove(op.queueId);
            } catch (e) { break; }
        }
    }
};

if (typeof window !== 'undefined') {
    window.ReverseSyncEngine = ReverseSyncEngine;
    window.CloudQueueDB = CloudQueueDB;
    window.NetworkEngine = NetworkEngine;
    window.addEventListener('online', () => NetworkEngine.processQueue());
    setTimeout(() => NetworkEngine.processQueue(), 5000);
}

// ============================================================================
// 🧠 القسم الرابع: الذاكرة المركزية والعقل المدبر (BoseState)
// ============================================================================

const BOSE_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg";
const CLOUDINARY_CLOUD_NAME = "dyx4w0dr1";

export const processBoseImage = (imgPath) => {
    if (!imgPath) return BOSE_LOGO_FALLBACK;
    if (imgPath.startsWith('http') || imgPath.startsWith('data:')) return imgPath;
    const cleanPath = imgPath.replace(/^\//, '');
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${cleanPath}`;
};

const boseConfig = {
    firebase: firebaseConfig, db: db, auth: auth, network: NetworkEngine, sync: ReverseSyncEngine, queue: CloudQueueDB,
    cloudinary: { cloudName: CLOUDINARY_CLOUD_NAME, baseDeliveryUrl: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/` },
    branding: { colors: { pink: "#ff91a4", dark: "#1a1a1a", white: "#FFFFFF" }, typography: { titleWeight: "700", lineHeight: "1.7" } },
    location: { address: "الكفاح، شارع الوحدة المحلية، بجوار صيدلية د. أحمد مجدي وعيادة د. علي" },
    layoutRules: {
        twoCardsGrid: ['الديسباسيتو', 'القشطوطة', 'كبات السعادة', 'الدوناتس', 'السينابون'],
        oneCardFull: ['التورت', 'الجاتوهات', 'الورد', 'بوكس الروقان', 'الميني تورت', 'الكب كيك', 'الريدفيلفت']
    },
    pricingRules: { cake: { basePersons: 4, basePrice: 580, pricePerPerson: 145, incrementStep: 2 }, printing: { edible: 60, decoration: 20, none: 0 } }
};

export const BoseState = {
    catalog: [],
    theme: {},
    logistics: { isOpen: true, allowPickup: true, minOrder: 0 },
    pricingRules: { pricePerPerson: 145, printEdible: 60, printNonEdible: 20, giftCardPrice: 40 },
    siteSettings: {}, 
    shippingZones: [], 
    galleryData: [], 
    catMenu: [], 
    activeCat: 'الرئيسية', 
    isAppReady: false,         
    cart: JSON.parse(localStorage.getItem('bose_cart_storage') || localStorage.getItem('BoseSweets_Cart') || localStorage.getItem('bose_cart') || '[]'), 
    currentShippingFee: 0, 
    appliedPromo: null,
    catalogMap: new Map(),
    securityLayer: {
        validateCartPrices: function(cartArray) {
            if (!Array.isArray(cartArray) || BoseState.catalogMap.size === 0) return cartArray;
            return cartArray.map(item => {
                const referenceItem = BoseState.catalogMap.get(String(item.id));
                if (referenceItem && item.price !== referenceItem.price) item.price = referenceItem.price;
                return item;
            });
        }
    },
    checkoutState: {
        deliveryMethod: 'الاستلام من المقر', deliveryDate: null, deliveryTime: null, customerName: '', primaryPhone: '', secondaryPhone: '', detailedAddress: '', nearestLandmark: '',
        setDeliveryMethod(method) { const mapping = { 'pickup': 'الاستلام من المقر', 'delivery': 'الشحن للمنزل' }; this.deliveryMethod = mapping[method] || method; }
    },
    cakeState: { flavor: 'فانيليا', shape: 'دائري', persons: 4, printingOption: 'بدون', notes: '', refImage: null, allergies: '', hasCard: false, cardText: '', occasionTheme: '', designStyle: 'تصميم محدد', currentCalculatedPrice: 580 },
    currentBuilderStep: 1
};

export function syncCatalogMap() {
    try {
        BoseState.catalogMap.clear();
        if (Array.isArray(BoseState.catalog)) {
            BoseState.catalog.forEach(p => { if (p && p.id) BoseState.catalogMap.set(String(p.id), p); });
        }
    } catch (error) {}
}

export function normalizeArabic(str) {
    if (!str) return '';
    return str.trim()
        .replace(/^ال/, '')       
        .replace(/[أإآا]/g, 'ا')   
        .replace(/ة/g, 'ه')        
        .replace(/ى/g, 'ي')        
        .replace(/\s+/g, '');      
}

export function saveToLocalMemory(key, data) { try { if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} }
export function getFromLocalMemory(key) { try { if (typeof window !== 'undefined') { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : null; } } catch (e) { return null; } }

export function setAppReady() {
    try {
        BoseState.isAppReady = true;
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { 
                loader.style.display = 'none'; 
                const mc = document.getElementById('main-content'); if(mc) mc.style.opacity = '1';
            }, 700);
        }
        window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready', { detail: { timestamp: Date.now(), status: 'Sovereign_Ready' } }));
    } catch (e) {}
}

if (typeof window !== 'undefined') {
    window.boseConfig = boseConfig; window.BoseState = BoseState; window.syncCatalogMap = syncCatalogMap;
    window.saveToLocalMemory = saveToLocalMemory; window.getFromLocalMemory = getFromLocalMemory; window.setAppReady = setAppReady;
    window.processBoseImage = processBoseImage; window.normalizeArabic = normalizeArabic;
}

// ============================================================================
// 🛒 القسم الخامس: محرك السلة السيادي (Cart System)
// ============================================================================

export const cartSystem = {
    getAdjustedPrice: function(basePrice) { return Math.round(parseFloat(basePrice)); },
    getCart: function() {
        const localCart = localStorage.getItem('BoseSweets_Cart') || localStorage.getItem('bose_cart_storage') || localStorage.getItem('bose_cart');
        if (localCart) { 
            const parsed = JSON.parse(localCart); 
            BoseState.cart = parsed; 
            return parsed; 
        }
        return BoseState.cart || [];
    },
    saveCartToStorage: function() { 
        saveToLocalMemory('BoseSweets_Cart', BoseState.cart);
        saveToLocalMemory('bose_cart_storage', BoseState.cart);
        saveToLocalMemory('bose_cart', BoseState.cart);
        this.updateCartDisplay();
        if(typeof window !== 'undefined') window.dispatchEvent(new Event('BoseSweets_Cart_Updated'));
    },
    save: function() { this.saveCartToStorage(); },
    clearCartStorage: function() { 
        BoseState.cart = []; 
        this.saveCartToStorage(); 
        if(typeof this.syncCartUI === 'function') this.syncCartUI(); 
    },
    calculateCartTotal: function(deliveryMode = 'الاستلام من المقر') {
        this.getCart();
        if (BoseState.securityLayer?.validateCartPrices) BoseState.cart = BoseState.securityLayer.validateCartPrices(BoseState.cart);
        let subtotal = 0;
        BoseState.cart.forEach(item => {
            const product = BoseState.catalogMap.get(String(item.id)) || BoseState.catalog.find(p => String(p.id) === String(item.id));
            let finalPrice = this.getAdjustedPrice(product ? product.price : item.price);
            let qty = parseInt(item.quantity || item.qty) || 1;
            let addonsPrice = 0;
            if (item.isCustomCake || item.isCustom) {
                if (item.printing?.includes('أكل') || item.details?.printType === 'edible') addonsPrice = 60;
                else if (item.printing?.includes('غير قابلة') || item.details?.printType === 'non_edible') addonsPrice = 20;
            }
            subtotal += ((finalPrice + addonsPrice) * qty);
        });
        let shippingFee = 0;
        const isPickup = deliveryMode === 'pickup' || deliveryMode === 'الاستلام من المقر' || deliveryMode === 'استلام';
        if (!isPickup) {
            const zone = BoseState.shippingZones.find(z => z.id === deliveryMode || z.name === deliveryMode);
            shippingFee = zone ? parseFloat(zone.fee) : (deliveryMode.includes('الفرافرة') ? 25 : (deliveryMode.includes('الكفاح') ? 10 : 20));
        }
        return { subtotal, shippingFee, total: subtotal + shippingFee };
    },
    updateCartDisplay: function() {
        this.getCart();
        const totalItems = BoseState.cart.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
        if (typeof document !== 'undefined') {
            const badges = document.querySelectorAll('#cart-count-badge, #mobile-cart-badge, .cart-badge-global');
            badges.forEach(el => {
                el.innerText = totalItems;
                el.style.display = totalItems > 0 ? 'flex' : 'none';
                if(totalItems > 0) el.classList.remove('hidden'); else el.classList.add('hidden');
            });
        }
    },
    syncCartUI: function() {
        const cartList = document.getElementById('cart-items-list');
        if (!cartList) return;
        if (BoseState.securityLayer?.validateCartPrices) BoseState.cart = BoseState.securityLayer.validateCartPrices(BoseState.cart);
        if (BoseState.cart.length === 0) {
            cartList.innerHTML = `<div class="empty-cart flex flex-col items-center justify-center p-12 text-center"><i data-lucide="shopping-bag" class="w-20 h-20 mb-4 opacity-20" style="color: ${boseConfig.branding.colors.pink};"></i><h3 class="text-xl font-black mb-2">سلة المشتريات فارغة</h3></div>`;
            ['summary-subtotal', 'summary-total'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = '0 ج.م'; });
            if (window.lucide) window.lucide.createIcons(); return;
        }
        let html = '';
        BoseState.cart.forEach((item, index) => {
            let finalPrice = this.getAdjustedPrice(item.price);
            let qty = parseInt(item.quantity || item.qty) || 1;
            if (item.isCustomCake || item.isCustom) {
                finalPrice += (item.printing?.includes('أكل') || item.details?.printType === 'edible') ? 60 : ((item.printing?.includes('غير قابلة') || item.details?.printType === 'non_edible') ? 20 : 0);
            }
            const imgUrl = processBoseImage(item.image || item.img);
            html += `<div class="cart-item bg-white p-4 rounded-2xl border mb-4 flex gap-4 items-center" style="border-color: ${boseConfig.branding.colors.pink}20;">
                        <img src="${imgUrl}" class="w-20 h-20 rounded-xl object-cover" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
                        <div class="flex-1 text-right"><h4 class="font-black text-sm">${item.name}</h4><div class="font-black mt-2" style="color: ${boseConfig.branding.colors.pink};">${finalPrice} ج.م</div></div>
                        <div class="flex flex-col items-center gap-2">
                            <button onclick="window.cartSystem.modQ(${index}, 1)" class="w-8 h-8 rounded-full border text-black bg-white">+</button>
                            <span class="font-black text-sm">${qty}</span>
                            <button onclick="window.cartSystem.modQ(${index}, -1)" class="w-8 h-8 rounded-full border text-black bg-white">-</button>
                        </div>
                    </div>`;
        });
        cartList.innerHTML = html;
        const totals = this.calculateCartTotal(document.getElementById('checkout-area')?.value || BoseState.checkoutState.deliveryMethod);
        if(document.getElementById('summary-subtotal')) document.getElementById('summary-subtotal').innerText = `${totals.subtotal} ج.م`;
        if(document.getElementById('summary-total')) document.getElementById('summary-total').innerText = `${totals.total} ج.م`;
    },
    modQ: function(index, delta) {
        this.getCart();
        if (BoseState.cart[index]) {
            let qty = BoseState.cart[index].quantity || BoseState.cart[index].qty || 1;
            qty += delta;
            if (qty <= 0) BoseState.cart.splice(index, 1);
            else BoseState.cart[index].quantity = Math.min(50, qty);
            BoseState.cart[index].qty = BoseState.cart[index].quantity;
            this.saveCartToStorage();
            this.syncCartUI();
        }
    },
    addWithQtyContext: function(btn, productId) {
        const wrapper = btn.closest('.catalog-item') || 
                        btn.closest('.catalog-card-wrapper') || 
                        btn.closest('.bose-double-wrap') || 
                        btn.closest('.royal-card') || 
                        btn.closest('.product-card') || 
                        btn.closest('.product-info-content') || 
                        btn.parentElement.parentElement;
        const qtyDisplay = wrapper ? wrapper.querySelector('.temp-qty-display, .card-qty-display') : null;
        const qty = qtyDisplay ? parseInt(qtyDisplay.innerText) : 1;
        const product = BoseState.catalogMap.get(String(productId)) || BoseState.catalog.find(p => String(p.id) === String(productId));
        if (!product) return;

        const existingItemIdx = BoseState.cart.findIndex(item => String(item.id) === String(productId) && !item.isCustomCake && !item.isCustom);
        if (existingItemIdx > -1) {
            BoseState.cart[existingItemIdx].quantity = (BoseState.cart[existingItemIdx].quantity || 1) + qty;
            BoseState.cart[existingItemIdx].qty = BoseState.cart[existingItemIdx].quantity;
        } else {
            BoseState.cart.push({ 
                id: product.id, name: product.name, price: parseFloat(product.price) || 0, 
                image: product.img || product.image || "", quantity: qty, qty: qty, 
                isCustomCake: false, isCustom: false, category: product.category || ''
            });
        }
        this.saveCartToStorage();
        if(qtyDisplay) qtyDisplay.innerText = "1";
        
        if (typeof window.showBoseToast === 'function') {
            window.showBoseToast(`تم إضافة [${product.name}] للسلة بنجاح.`);
        } else if (typeof window.showSystemToast === 'function') {
            window.showSystemToast(`تم إضافة [${product.name}] للسلة بنجاح.`, 'success');
        } else {
            console.log(`تم إضافة [${product.name}] للسلة بنجاح.`);
        }
        if(typeof window !== 'undefined') window.dispatchEvent(new Event('BoseSweets_Cart_Updated'));
    }
};

if (typeof window !== 'undefined') {
    window.cartSystem = cartSystem;
}

// ============================================================================
// 🔗 القسم السادس: جسر البيانات السيادي (Data Bridge) ودعم التوافق الرجعي
// ============================================================================

export async function fetchSystemSettings() {
    try {
        if (!db) return;
        const sSnap = await getDoc(doc(db, 'settings', 'main'));
        if (sSnap.exists()) {
            Object.assign(BoseState.siteSettings, sSnap.data());
            saveToLocalMemory('bosesweets_settings', BoseState.siteSettings);
        }
    } catch (e) {
        Object.assign(BoseState.siteSettings, getFromLocalMemory('bosesweets_settings') || {});
    }
}

export async function fetchThemeSettings() {
    try {
        if (!db) return;
        const tSnap = await getDoc(doc(db, 'settings', 'theme'));
        if (tSnap.exists()) {
            BoseState.theme = tSnap.data();
            saveToLocalMemory('bosesweets_theme', BoseState.theme);
            window.saveEngineMemory('theme');
            if (typeof window.applyThemeConfigUI === 'function') window.applyThemeConfigUI();
        }
    } catch (e) {
        BoseState.theme = getFromLocalMemory('bosesweets_theme') || {};
    }
}

export async function fetchShippingZones() {
    try {
        if (!db) return;
        const shipSnap = await getDocs(collection(db, 'shipping'));
        if (!shipSnap.empty) {
            BoseState.shippingZones = shipSnap.docs.map(d => ({id: d.id, ...d.data()}));
            saveToLocalMemory('bosesweets_shipping', BoseState.shippingZones);
        }
    } catch (e) {
        BoseState.shippingZones = getFromLocalMemory('bosesweets_shipping') || [];
    }
}

export async function fetchProductsCatalog() {
    try {
        if (!db) throw new Error("Database not ready.");
        const snapshot = await getDocs(query(collection(db, 'catalog')));
        const products = [];
        snapshot.docs.forEach(d => {
            const raw = d.data();
            if (raw.isActive !== false) {
                products.push({
                    id: d.id,
                    name: raw.name || "صنف فاخر",
                    price: parseFloat(raw.price) || 0,
                    category: raw.category || "عام",
                    img: raw.img || raw.image || "",
                    description: raw.description || raw.desc || "",
                    inStock: raw.inStock !== false,
                    ...raw 
                });
            }
        });
        BoseState.catalog = products;
        syncCatalogMap();
        saveToLocalMemory('bosesweets_catalog', BoseState.catalog);
        window.saveEngineMemory('cat');
        return BoseState.catalog;
    } catch (e) {
        BoseState.catalog = getFromLocalMemory('bosesweets_catalog') || [];
        syncCatalogMap();
        return BoseState.catalog;
    }
}

export async function initializeDataBridge() {
    if (window.__BoseBridgeInitialized) return;
    window.__BoseBridgeInitialized = true;
    await Promise.all([fetchSystemSettings(), fetchThemeSettings(), fetchShippingZones(), fetchProductsCatalog()]);
    const uniqueCats = [...new Set(BoseState.catalog.map(p => p.category))].filter(Boolean);
    BoseState.catMenu = BoseState.siteSettings.catMenu?.map(c => c.name || c) || uniqueCats;
    setAppReady();
}

export function listenToSovereignUpdates() {
    if (!db || window.__BoseListenersActive) return; window.__BoseListenersActive = true;
    
    onSnapshot(collection(db, 'catalog'), (snap) => {
        const list = [];
        snap.forEach(d => {
            const data = d.data();
            if (data.isActive !== false) {
                list.push({
                    id: d.id,
                    name: data.name || "صنف فاخر",
                    price: parseFloat(data.price) || 0,
                    category: data.category || "عام",
                    img: data.img || data.image || "",
                    description: data.description || data.desc || "",
                    inStock: data.inStock !== false,
                    ...data 
                });
            }
        });
        BoseState.catalog = list;
        syncCatalogMap(); 
        saveToLocalMemory('bosesweets_catalog', BoseState.catalog);
        window.dispatchEvent(new Event('catalogDataReady'));
        if (typeof window.distributeProductsToUI === 'function') window.distributeProductsToUI(BoseState.catalog);
    });
}

if (typeof window !== 'undefined') {
    window.initializeDataBridge = initializeDataBridge;
    window.listenToSovereignUpdates = listenToSovereignUpdates;
    const startBridge = () => { 
        if (!window.location.pathname.includes('admin')) { 
            initializeDataBridge(); 
            listenToSovereignUpdates(); 
        } 
    };
    if (document.readyState === 'complete') {
        startBridge();
        fetchProductsCatalog();
    } else {
        document.addEventListener('DOMContentLoaded', () => { 
            startBridge(); 
            fetchProductsCatalog(); 
        });
    }
}

// ============================================================================
// 🔒 القسم السابع: مستمعي المزامنة الفورية السحابية (Firebase Real-time Sync)
// ============================================================================

export function initializeSovereignSync() {
    if (!db) return;
    
    onSnapshot(collection(db, 'catalog'), (snap) => {
        const list = [];
        snap.forEach(d => {
            const data = d.data();
            if (data.isActive !== false) {
                list.push({
                    id: d.id,
                    name: data.name || "صنف فاخر",
                    price: parseFloat(data.price) || 0,
                    category: data.category || "عام",
                    img: data.img || data.image || "",
                    description: data.description || data.desc || "",
                    inStock: data.inStock !== false,
                    ...data 
                });
            }
        });
        BoseState.catalog = list;
        syncCatalogMap();
        window.saveEngineMemory('cat');
        if (typeof window.distributeProductsToUI === 'function') {
            window.distributeProductsToUI(BoseState.catalog);
        }
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
    });

    onSnapshot(doc(db, 'settings', 'theme'), (snap) => {
        if (snap.exists()) {
            BoseState.theme = snap.data();
            saveToLocalMemory('bosesweets_theme', BoseState.theme);
            window.saveEngineMemory('theme');
            if (typeof window.applyThemeConfigUI === 'function') window.applyThemeConfigUI();
            if (typeof window.distributeProductsToUI === 'function') {
                window.distributeProductsToUI(BoseState.catalog);
            }
            window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
        }
    });

    onSnapshot(doc(db, 'settings', 'logistics'), (snap) => {
        if(snap.exists()) {
            BoseState.logistics = snap.data();
            window.dispatchEvent(new CustomEvent('BoseSweets_Logistics_Updated'));
        }
    });

    onSnapshot(doc(db, 'settings', 'pricingRules'), (snap) => {
        if(snap.exists()) {
            BoseState.pricingRules = snap.data();
            window.dispatchEvent(new CustomEvent('BoseSweets_Pricing_Updated'));
        }
    });

    onSnapshot(doc(db, 'system', 'syncFlag'), (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            const lastUpdate = parseInt(localStorage.getItem('bose_last_local_sync') || '0');
            if (data.lastAdminUpdate > lastUpdate && data.forceRefresh === true) {
                localStorage.setItem('bose_last_local_sync', data.lastAdminUpdate.toString());
                window.location.reload();
            }
        }
    });
}

// ============================================================================
// 🎨 القسم الثامن: واجهة المستخدم والتحكم البصري والرسم الهندسي (UI Logic)
// ============================================================================

export function renderProductCardsUI(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const sectionTitle = container.dataset.sectionTitle || '';
    const currentLayoutBlock = BoseState.theme.builderLayout?.find(b => b.title === sectionTitle);
    const defaultWidth = currentLayoutBlock?.cardWidth || 280;
    const defaultHeight = currentLayoutBlock?.cardHeight || 350;

    container.innerHTML = products.map(p => {
        const isOut = p.inStock === false;
        const customWidth = p.cardWidth || defaultWidth;
        const customHeight = p.cardHeight || defaultHeight;
        
        const isDonutOrCinnabon = p.category && (p.category.includes('دوناتس') || p.category.includes('سينابون') || p.category.includes('ديسباسيتو') || p.category.includes('قشطوطة') || p.category.includes('كبات السعادة'));
        const isRoyalItem = p.category && (p.category.includes('تورت') || p.category.includes('جاتوهات') || p.category.includes('ورد'));
        
        let isFullSpan = p.gridSpan === 'full' || p.displayStyle === 'full' || isRoyalItem;
        if (isDonutOrCinnabon) isFullSpan = false;

        const spanClass = isFullSpan ? 'col-span-full w-full' : 'col-span-1 w-full';
        const hasDiscount = p.hasDiscount === true && p.oldPrice > p.price;
        const img = processBoseImage(p.img || p.image);

        return `
            <div class="catalog-card-wrapper ${spanClass} p-2" style="max-width: ${isFullSpan ? '100%' : customWidth + 'px'}; margin: 0 auto; width: 100%;">
                <div class="bose-double-wrap group h-full block text-decoration-none relative bg-white rounded-[32px] border-2 border-[#ff91a4] p-1.5 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="bose-double-inner bg-white h-full flex flex-col rounded-[26px] overflow-hidden">
                        <div class="w-full overflow-hidden bg-brand-pinkLight border-b border-[#ff91a4]/20 relative" style="height: ${customHeight}px">
                            <img src="${img}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
                            ${hasDiscount && !isOut ? `<div class="absolute top-4 right-4 bg-[#ff91a4] text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-sm z-10">عرض خاص 🔥</div>` : ''}
                            ${isOut ? '<div class="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white font-black text-lg">نفذت الكمية 🚫</div>' : ''}
                        </div>
                        <div class="p-5 flex flex-col flex-grow text-right bg-white justify-between">
                            <div>
                                <h3 class="font-bold text-lg text-[#3d241c] mb-1 truncate">${p.name}</h3>
                                <p class="text-xs text-[#ff91a4] font-black mb-2">${p.category || 'صنف فاخر'}</p>
                                <p class="text-xs text-gray-500 line-clamp-2 mb-4">${p.description || p.desc || ''}</p>
                                ${p.flavors ? `<p class="text-[11px] text-[#ff91a4] font-bold border-t border-dashed border-[#fff5f6] pt-2 mb-4 leading-relaxed">${p.flavors}</p>` : ''}
                            </div>
                            <div class="mt-auto flex justify-between items-center border-t border-[#ff91a4]/10 pt-4">
                                <div class="flex flex-col">
                                    ${hasDiscount ? `<span class="text-xs text-gray-400 line-through font-bold mb-0.5">${p.oldPrice} ج.م</span>` : ''}
                                    <span class="font-black text-xl text-[#ff91a4]">${p.price} <span class="text-xs">ج.م</span></span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center gap-1.5 bg-gray-50 rounded-full px-2 py-1 border border-gray-100">
                                        <button onclick="window.updateTempQtyContext(this, -1)" class="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 bg-white rounded-full border border-gray-200">-</button>
                                        <span class="temp-qty-display text-xs font-bold w-4 text-center">1</span>
                                        <button onclick="window.updateTempQtyContext(this, 1)" class="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 bg-white rounded-full border border-gray-200">+</button>
                                    </div>
                                    <button onclick="window.cartSystem.addWithQtyContext(this, '${p.id}')" class="w-10 h-10 rounded-full bg-brand-pinkLight text-[#ff91a4] flex items-center justify-center hover:bg-[#ff91a4] hover:text-white border border-[#ff91a4]/20 transition-colors shadow-sm cursor-pointer" ${isOut ? 'disabled' : ''}>
                                        <i data-lucide="plus" class="w-5 h-5"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

export function distributeProductsToUI(products = BoseState.catalog) {
    ['new-arrivals-container', 'best-sellers-container', 'menuGrid'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const sectionTitle = el.dataset.sectionTitle || '';
            const block = BoseState.theme.builderLayout?.find(b => b.title === sectionTitle);
            let filteredList = [...products];
            if (block && block.dataSource) {
                if (block.dataSource.startsWith('category:')) {
                    const catName = block.dataSource.split(':')[1];
                    const normalizedCatName = normalizeArabic(catName);
                    filteredList = products.filter(p => p.category && normalizeArabic(p.category) === normalizedCatName);
                } else if (block.dataSource === 'latest') {
                    filteredList = [...products].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 12);
                } else if (block.dataSource === 'bestsellers') {
                    filteredList = products.filter(p => p.hasDiscount === true).slice(0, 12);
                }
            }
            renderProductCardsUI(filteredList, id);
        }
    });
}

export function applyThemeConfigUI() {
    const themeData = BoseState.theme;
    if (!themeData) return;

    if (themeData.header && themeData.header.logoText) {
        document.querySelectorAll('.bose-logo-text').forEach(el => {
            el.innerText = themeData.header.logoText;
        });
    }

    if (themeData.ticker && themeData.ticker.length > 0) {
        const tickerContainer = document.getElementById('sovereign-ticker-inner');
        if (tickerContainer) {
            tickerContainer.innerHTML = themeData.ticker.map(t => `<span class="mx-10 inline-block font-black">${t}</span>`).join('');
        }
    }

    if (themeData.footer) {
        const fDesc = document.getElementById('footer-brand-desc');
        if (fDesc) fDesc.innerText = themeData.footer.desc || '';
        
        const fPhone = document.getElementById('footer-phone-link');
        if (fPhone) {
            fPhone.href = `tel:${themeData.footer.phone}`;
            fPhone.innerText = themeData.footer.phone || '';
        }
    }

    if (typeof window.loadSliderImages === 'function') {
        window.loadSliderImages();
    }
}

window.toggleSidebar = function() {
    try {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar || !overlay) return;

        const isActive = sidebar.classList.contains('active');
        if (isActive) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    } catch (error) {}
};

export const showInfo = function(type) {
    let title = "", content = "";
    if (type === 'about') {
        title = "عن علامة حلويات بوسي";
        content = `تأسست حلويات بوسي عام 2014 في مدينة الكفاح... نحن نلتزم بأعلى معايير المهنية والجودة العالمية لتوفير أفخر المخبوزات والحلويات الغربية والشرقية المصنوعة يدوياً وبأعلى مقاييس الفخامة.`;
    }
    const modalId = 'bose-info-modal'; let modal = document.getElementById(modalId);
    if (!modal) { 
        modal = document.createElement('div'); 
        modal.id = modalId; 
        modal.className = 'fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300'; 
        document.body.appendChild(modal); 
    }
    modal.innerHTML = `<div class="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden p-8 border-4 text-right" style="border-color: ${boseConfig.branding.colors.pink}20;">
        <h3 class="text-2xl font-black mb-6 text-center">${title}</h3>
        <p class="text-base font-bold leading-relaxed">${content}</p>
        <button onclick="document.getElementById('${modalId}').remove()" class="w-full mt-8 py-4 rounded-full font-black text-white" style="background: ${boseConfig.branding.colors.pink};">تم الاستيعاب</button>
    </div>`;
};

window.updateTempQtyContext = function(btn, delta) {
    const display = btn.parentElement.querySelector('.temp-qty-display');
    if (display) {
        let val = parseInt(display.innerText) + delta;
        if (val < 1) val = 1;
        if (val > 50) val = 50;
        display.innerText = val;
    }
};

if (typeof window !== 'undefined') {
    window.renderProductCards = renderProductCardsUI;
    window.distributeProductsToUI = distributeProductsToUI;
    window.showInfo = showInfo;
}

// ============================================================================
// 🖼️ القسم التاسع: محرك العرض المرئي والشريط المتحرك (Slider Engine)
// ============================================================================

export async function fetchSliderRecords() {
    try {
        if (!db) return [];
        if (BoseState.theme && BoseState.theme.sliderImages && Array.isArray(BoseState.theme.sliderImages)) {
            return BoseState.theme.sliderImages;
        }
        const sliderSnap = await getDocs(collection(db, 'sliders'));
        if (!sliderSnap.empty) {
            return sliderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return [];
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'unified-engine.js', null, null, 'fetchSliderRecords');
        return [];
    }
}

export async function loadSliderImages() {
    const sliderContainer = document.getElementById('main-slider');
    if (!sliderContainer) return;
    try {
        const sliderData = await fetchSliderRecords();
        sliderContainer.innerHTML = '';
        if (sliderData && sliderData.length > 0) {
            sliderData.forEach(slide => {
                const slideItem = document.createElement('div');
                slideItem.className = 'slider-item-exclusive h-full w-full flex-shrink-0 relative';
                const sourceUrl = slide.imageUrl || slide.image || slide.img || '';
                if (!sourceUrl) return;
                const processedUrl = processBoseImage(sourceUrl);
                const smartTimeStamp = slide.updatedAt || (BoseState.theme && BoseState.theme.lastAdminUpdate) || new Date().getTime();
                const separator = processedUrl.includes('?') ? '&' : '?';
                const finalImageUrl = `${processedUrl}${separator}v=${smartTimeStamp}`;
                slideItem.innerHTML = `<img src="${finalImageUrl}" class="w-full h-full object-cover rounded-[24px]">`;
                sliderContainer.appendChild(slideItem);
            });
            if (typeof window.initSliderEffects === 'function') {
                window.initSliderEffects();
            }
        }
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'unified-engine.js', null, null, 'loadSliderImages');
    }
}

if (typeof window !== 'undefined') {
    window.loadSliderImages = loadSliderImages;
    window.fetchSliderRecords = fetchSliderRecords;
}

// ============================================================================
// 💐 القسم العاشر: محاكي التنسيق الفاخر وتكاملات السلة (Simulator Integration)
// ============================================================================

if (typeof boseEngineRegistry !== 'undefined') {
    boseEngineRegistry.registerModule('bouquetSimulator', {
        init: function() {
            console.log("تمت تهيئة وحدة محاكي التنسيق الفاخر بنجاح.");
        },
        validate: function(data) {
            return data && data.material && data.density >= 10;
        }
    });
}

function integrateSimulatorWithCart(simulatorData) {
    if (!simulatorData || !simulatorData.totalPrice) {
        console.error("خطأ: بيانات التنسيق غير مكتملة أو غير متوافقة مع محرك الموقع.");
        return false;
    }

    const cartItem = {
        id: `bouquet-${Date.now()}`,
        name: simulatorData.productName,
        price: parseFloat(simulatorData.totalPrice.replace(/[^\d.]/g, '')),
        quantity: 1,
        options: {
            "الخامة الأساسية": simulatorData.material,
            "اللون الأساسي": simulatorData.color,
            "كثافة التنسيق": `${simulatorData.density} وردة`,
            "اللمسات الفاخرة": [
                simulatorData.hasChocolate ? "شوكولاتة فاخرة" : null,
                simulatorData.hasCash ? "تغليف مبالغ نقدية" : null,
                simulatorData.hasCard ? "كارت إهداء مخطوط" : null,
                simulatorData.hasPhoto ? "صورة تذكارية مصورة" : null
            ].filter(Boolean)
        },
        metadata: {
            source: "visual-simulator",
            timestamp: new Date().toISOString()
        }
    };

    if (typeof boseCartEngine !== 'undefined' && typeof boseCartEngine.addItem === 'function') {
        boseCartEngine.addItem(cartItem);
    } else if (typeof globalCart !== 'undefined' && Array.isArray(globalCart)) {
        globalCart.push(cartItem);
        if (typeof updateCartUI === 'function') updateCartUI();
    } else if (BoseState && Array.isArray(BoseState.cart)) {
        BoseState.cart.push(cartItem);
        saveToLocalMemory('BoseSweets_Cart', BoseState.cart);
        saveToLocalMemory('bose_cart_storage', BoseState.cart);
        saveToLocalMemory('bose_cart', BoseState.cart);
    } else {
        let localCart = JSON.parse(localStorage.getItem('bose_cart_storage') || localStorage.getItem('bose_cart') || '[]');
        localCart.push(cartItem);
        localStorage.setItem('bose_cart_storage', JSON.stringify(localCart));
        localStorage.setItem('bose_cart', JSON.stringify(localCart));
    }

    window.location.href = 'cart.html';
    return true;
}

if (typeof window !== 'undefined') {
    window.addToCart = integrateSimulatorWithCart;
}

window.saveBoseSimulatorSettings = async function() {
    if (!db) {
        console.error("عطل اتصالي: قاعدة بيانات فايربيز غير معرفة في هذا النطاق.");
        return;
    }

    const simulatorSettings = {
        prices: {
            natural: parseFloat(document.getElementById('adm-price-natural').value) || 20,
            artificial: parseFloat(document.getElementById('adm-price-artificial').value) || 15,
            satin: parseFloat(document.getElementById('adm-price-satin').value) || 25,
            chocolate: parseFloat(document.getElementById('adm-price-chocolate').value) || 250,
            cash: parseFloat(document.getElementById('adm-price-cash').value) || 100,
            card: parseFloat(document.getElementById('adm-price-card').value) || 25,
            photo: parseFloat(document.getElementById('adm-price-photo').value) || 15
        },
        layers: {
            chocolateUrl: document.getElementById('adm-layer-chocolate-url').value.trim(),
            cashUrl: document.getElementById('adm-layer-cash-url').value.trim()
        },
        updatedAt: Date.now()
    };

    try {
        const docRef = doc(db, 'settings', 'simulator_config');
        await setDoc(docRef, simulatorSettings, { merge: true });
        
        if (typeof window.showBoseToast === 'function') {
            window.showBoseToast("تم توثيق وحفظ لوجستيات وأسعار محاكي التنسيق سحابياً بنجاح.");
        } else if (typeof window.showSystemToast === 'function') {
            window.showSystemToast("تم توثيق وحفظ لوجستيات وأسعار محاكي التنسيق سحابياً بنجاح.", "success");
        } else {
            console.log("تم توثيق وحفظ لوجستيات وأسعار محاكي التنسيق سحابياً بنجاح.");
        }
    } catch (error) {
        console.error("فشل الحفظ السحابي لقسم التنسيق:", error);
        localStorage.setItem('bose_simulator_config', JSON.stringify(simulatorSettings));
    }
};

window.parseCustomBouquetOrder = function(item) {
    if (!item || item.metadata?.source !== "visual-simulator") return '';

    const opts = item.options || {};
    const additionals = Array.isArray(opts["اللمسات الفاخرة"]) ? opts["اللمسات الفاخرة"].join(' | ') : 'لا يوجد';
    
    return `
        <div class="mt-3 p-4 bg-[#1a1012] rounded-xl border border-[#42282d] text-xs text-[#e0c8cc] space-y-2 text-right">
            <p class="text-[#ff91a4] font-black flex items-center justify-end gap-1">
                💐 تفكيك بنود بوكيه التنسيق المخصص (دقة التنفيذ):
            </p>
            <div class="grid grid-cols-2 gap-y-1 text-[11px] direction-rtl">
                <p>• الخامة الأساسية: <span class="text-white font-bold">${opts["الخامة الأساسية"] || 'طبيعي'}</span></p>
                <p>• اللون المطلوب: <span class="text-white font-bold">${opts["اللون الأساسي"] || 'أحمر'}</span></p>
                <p>• الكثافة والعدد: <span class="text-white font-bold">${opts["كثافة التنسيق"] || '15 وردة'}</span></p>
                <p>• السعر الإجمالي المعتمد: <span class="text-[#ff91a4] font-bold">${item.price} ج.م</span></p>
            </div>
            <p class="text-[11px] border-t border-[#42282d] pt-1 mt-1">
                • اللمسات الفاخرة المرفقة: <span class="text-white">${additionals}</span>
            </p>
            ${opts["رابط_الصورة_التذكارية"] ? `
                <div class="pt-2 text-left">
                    <a href="${opts["رابط_الصورة_التذكارية"]}" target="_blank" class="inline-flex items-center gap-1 bg-[#ff91a4] text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:opacity-90 transition-all">
                        عرض وتحميل الصورة المرفوعة
                    </a>
                </div>
            ` : ''}
        </div>
    `;
};

// ============================================================================
// 🔒 القسم الحادي عشر: جاهزية النظام والتشغيل التلقائي (Bootloader)
// ============================================================================

if (typeof window !== 'undefined') {
    window.renderProductCards = renderProductCardsUI; 
    window.distributeProductsToUI = distributeProductsToUI;
    window.cartSystem = cartSystem;
    window.BoseState = BoseState;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeSovereignSync();
    setTimeout(() => {
        if (typeof window.loadSliderImages === 'function') window.loadSliderImages();
        BoseState.isAppReady = true;
        setAppReady();
        window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready'));
    }, 500);
});

console.log("👑 BoseSweets Engine: تم ترقية المحرك الموحد لعلامة حلويات بوسي إلى الإصدار السيادي المتطور (V39.6 Premium) المدمج والكامل بنجاح.");

```
