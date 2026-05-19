/**
 * ============================================================================
 * 👑 BoseSweets Core Data Engine | المحرك المركزي للبيانات (V39.4 - سيادي ومسيطر)
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي
 * الحالة: دمج شامل، أداء فائق، كسر إجباري للذاكرة المؤقتة لضمان التحديث اللحظي للصور.
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

// 🛡️ التهيئة الآمنة والملطقة للنظام السحابي (Modern Architecture)
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
        window.BoseSweets_Engine_Version = "V39.4";
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
    console.error("رصد تذبذب في الاتصال، جاري تفعيل الحماية والمحاولة من جديد...");
    if (ConnectionGuard.retryCount < ConnectionGuard.maxRetries) {
        ConnectionGuard.retryCount++;
        setTimeout(retryFunction, ConnectionGuard.retryDelay);
    } else {
        console.error("فشل الاتصال اللحظي بعد استنفاد المحاولات.");
    }
}

// 🛡️ الصندوق الأسود (BoseMonitor) لرصد وتحليل الأعطال بالموقع تلقائياً
(function() {
    if (typeof window === 'undefined' || window.BoseMonitor) return;

    window.BoseMonitor = {
        logQueue: [],
        isReporting: false, 
        diagnose: function(errorMsg) {
            const msg = String(errorMsg).toLowerCase();
            if (msg.includes('auth') || msg.includes('credential')) return "عائق توثيق (Auth Error): فشل في تأكيد الصلاحيات مع السحابة.";
            if (msg.includes('network') || msg.includes('fetch') || msg.includes('offline')) return "عطل اتصالي (Network): المحرك فقد الاتصال بالسحابة المركزية.";
            if (msg.includes('permission') || msg.includes('access-denied')) return "رفض سيادي (Permission): محاولة الوصول لبيانات غير مصرح بها.";
            if (msg.includes('quota') || msg.includes('exceeded')) return "اختناق سحابي (Quota): تجاوز الحد الأقصى لعمليات السحابة المسموح بها.";
            if (msg.includes('null (reading') || msg.includes('undefined (reading')) return "انهيار هيكلي (DOM): محاولة قراءة بيانات مفقودة أو الواجهة فقدت حقول أساسية.";
            if (msg.includes('firebase')) return "خلل في قلب المحرك (Firebase Core Error).";
            return "خلل تقني مجهول يتطلب تحليلاً برمجياً عميقاً.";
        },
        parseStackTrace: function(stack) {
            if (!stack) return { file: 'core-engine.js', line: 'غير معروف', col: 'غير معروف' };
            const lines = stack.split('\n');
            for (let i = 1; i < lines.length; i++) {
                const match = lines[i].match(/(.*):(\d+):(\d+)/);
                if (match) return { file: match[1].split('/').pop(), line: match[2], col: match[3] };
            }
            return { file: 'تحليل معقد', line: 'N/A', col: 'N/A' };
        },
        report: async function(error, sourceFile = 'core-engine.js', lineNo = null, colNo = null, functionName = 'رصد تلقائي (Auto-Detect)') {
            if (this.isReporting) return; 
            this.isReporting = true;
            try {
                const errorMessage = error && error.message ? error.message : String(error);
                const stackTrace = error && error.stack ? error.stack : 'لا يوجد تتبع برمجي متاح (No Stack Trace)';
                const parsedStack = this.parseStackTrace(stackTrace);
                const finalFile = sourceFile || parsedStack.file;
                
                console.warn(`%c[BoseMonitor - رصد أمني]%c تم رصد خلل في: ${finalFile} | دالة: ${functionName}`, "color: #ff91a4; font-weight: bold; background: #1a1012; padding: 2px 6px; border-radius: 4px;", "color: inherit;");

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
                    engineVersion: 'V39.4'
                };

                await this.saveToDatabase(reportData);
            } catch (e) {
                console.error("👑 BoseMonitor: فشل نظام الرصد العميق في تسجيل الخطأ:", e);
            } finally {
                this.isReporting = false;
            }
        },
        saveToDatabase: async function(reportData) {
            try {
                reportData.serverTime = new Date();
                if (db) {
                    const logsRef = collection(db, 'system_logs');
                    await setDoc(doc(logsRef), reportData);
                    if (this.logQueue.length > 0) await this.syncQueueToDatabase();
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
                let fName = event.filename ? event.filename.split('/').pop() : 'core-engine.js';
                this.report(event.error || event.message, fName, null, null, 'رصد تلقائي للواجهة (Global Error)');
            });
            window.addEventListener('unhandledrejection', (event) => {
                this.report(event.reason || 'عملية خلفية تم رفضها ولم تعالج', 'core-engine.js', null, null, 'عملية شبكية غير مكتملة (Promise Rejection)');
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
            try {
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
            } catch (err) {
                reject(err);
            }
        });
    },
    set(key, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) { resolve(null); return; }
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put(value, key);
                request.onsuccess = () => resolve(true);
                request.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
        });
    },
    get(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) { resolve(null); return; }
            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(key);
                request.onsuccess = (e) => resolve(e.target.result);
                request.onerror = (e) => reject(e.target.error);
            } catch (err) {
                reject(err);
            }
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
    if (window.BoseMonitor) window.BoseMonitor.report(err, 'core-engine.js', null, null, 'StorageEngine.init');
});

window.saveEngineMemory = async function(type) {
    try {
        if (type === 'cat') {
            await StorageEngine.set('bose_catalog', BoseState.catalog);
        } else if (type === 'theme') {
            await StorageEngine.set('bose_theme', BoseState.theme);
        }
    } catch (e) {
        if (window.BoseMonitor) window.BoseMonitor.report(e, 'core-engine.js', null, null, 'saveEngineMemory');
    }
};

window.loadEngineMemory = async function() {
    try {
        const cachedCatalog = await StorageEngine.get('bose_catalog');
        const cachedTheme = await StorageEngine.get('bose_theme');
        
        if (cachedCatalog && cachedCatalog.length > 0 && BoseState.catalog.length === 0) {
            BoseState.catalog = cachedCatalog;
            syncCatalogMap();
            if(window.distributeProductsToUI) window.distributeProductsToUI();
        }
        if (cachedTheme && Object.keys(cachedTheme).length > 0 && Object.keys(BoseState.theme).length === 0) {
            BoseState.theme = cachedTheme;
            if(window.applyThemeConfigUI) window.applyThemeConfigUI();
        }
    } catch (e) {
        if (window.BoseMonitor) window.BoseMonitor.report(e, 'core-engine.js', null, null, 'loadEngineMemory');
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
                        source: 'BoseSweets_Engine_V39.4',
                        engine_status: 'Active',
                        type: 'new_order_fallback',
                        orderId: orderData.id,
                        customerName: orderData.customerName || orderData.name,
                        customerPhone: orderData.customerPhone || orderData.phone,
                        area: orderData.deliveryMode || orderData.area || 'غير محدد',
                        total: orderData.total,
                        timestamp: orderData.timestamp,
                        itemsCount: orderData.itemsArray ? orderData.itemsArray.length : 0
                    })
                }).catch(e => console.warn('تنويه هندسي: تأمين العملية عبر المسار البديل.'));
            }
        } catch (error) {
            console.warn("حلويات بوسي 👑: عائق في المزامنة العكسية وتم تجاوزه.");
        }
    },
    async broadcastGlobalUpdate() {
        try {
            if (db) {
                const syncDocRef = doc(db, 'system', 'syncFlag');
                await setDoc(syncDocRef, { lastAdminUpdate: Date.now(), version: 'V39.4', forceRefresh: true }, { merge: true });
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
            if (!db) throw new Error("المحرك غير متصل.");
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
            if (!db) throw new Error("المحرك غير متصل.");
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

// 🔥 تطبيق الختم الزمني السيادي لكسر الذاكرة المؤقتة (Dynamic Cache Buster)
export const processBoseImage = (imgPath) => {
    if (!imgPath) return BOSE_LOGO_FALLBACK;
    
    let finalUrl = imgPath;
    if (!imgPath.startsWith('http') && !imgPath.startsWith('data:')) {
        const cleanPath = imgPath.replace(/^\//, '');
        finalUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${cleanPath}`;
    }
    
    // جلب توقيت آخر تحديث سيادي، لضمان عرض أحدث نسخة وتجاهل الذاكرة القديمة للمتصفح أو الخادم
    const state = typeof window !== 'undefined' ? (window.BoseState || {}) : {};
    const syncStamp = (state.theme && state.theme.lastAdminUpdate) 
        ? state.theme.lastAdminUpdate 
        : (typeof localStorage !== 'undefined' ? (localStorage.getItem('bose_last_local_sync') || Date.now()) : Date.now());

    if (finalUrl.startsWith('http') && !finalUrl.includes('data:')) {
        // تنظيف الرابط من أي ختم زمني قديم لتفادي تراكم المتغيرات
        finalUrl = finalUrl.split('?v=')[0].split('&v=')[0];
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl = `${finalUrl}${separator}v=${syncStamp}`;
    }
    
    return finalUrl;
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
    cart: (typeof localStorage !== 'undefined') ? JSON.parse(localStorage.getItem('bose_cart_storage') || localStorage.getItem('BoseSweets_Cart') || '[]') : [], 
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
        window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready', { detail: { timestamp: Date.now(), status: 'Ready' } }));
    } catch (e) {}
}

if (typeof window !== 'undefined') {
    window.boseConfig = boseConfig; window.BoseState = BoseState; window.syncCatalogMap = syncCatalogMap;
    window.saveToLocalMemory = saveToLocalMemory; window.getFromLocalMemory = getFromLocalMemory; window.setAppReady = setAppReady;
    window.processBoseImage = processBoseImage; window.normalizeArabic = normalizeArabic;
}

// ============================================================================
// 🔗 القسم السادس: جسر البيانات السيادي (Data Bridge) ودعم التوافق الرجعي
// ============================================================================

export const defaultSettingsFallback = {
    brandName: "حلويات بوسي", heroTitle: "أهلاً بالجميع في حلويات بوسي", heroDesc: "نخبة المختارات من أجود الخامات العالمية.",
    brandColorHex: "#ff91a4", catMenu: ["الرئيسية", "ديسباسيتو", "سينابون", "تورت", "ورد"]
};

export async function fetchSystemSettings() {
    try {
        if (!db) return;
        const sSnap = await getDoc(doc(db, 'settings', 'main'));
        if (sSnap.exists()) { Object.assign(BoseState.siteSettings, sSnap.data()); saveToLocalMemory('bosesweets_settings', BoseState.siteSettings); }
        
        ConnectionGuard.active = true;
        ConnectionGuard.retryCount = 0; 
    } catch (e) { 
        handleConnectionDrop(fetchSystemSettings);
        Object.assign(BoseState.siteSettings, getFromLocalMemory('bosesweets_settings') || defaultSettingsFallback); 
    }
}

export async function fetchShippingZones() {
    try {
        if (!db) return;
        const shipSnap = await getDocs(collection(db, 'shipping'));
        if (!shipSnap.empty) { BoseState.shippingZones = shipSnap.docs.map(d => ({id: d.id, ...d.data()})); saveToLocalMemory('bosesweets_shipping', BoseState.shippingZones); }
        
        ConnectionGuard.active = true;
        ConnectionGuard.retryCount = 0; 
    } catch (e) { 
        handleConnectionDrop(fetchShippingZones);
        BoseState.shippingZones = getFromLocalMemory('bosesweets_shipping') || []; 
    }
}

export async function fetchProductsCatalog() {
    try {
        if (!db) throw new Error("المحرك غير متصل.");
        
        if (BoseState.catalog.length > 0 && window.__BoseListenersActive) {
            return BoseState.catalog;
        }

        const q = query(collection(db, 'catalog'));
        const snapshot = await getDocs(q);
        
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
        saveToLocalMemory('bosesweets_catalog', products);
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('catalogDataReady', { detail: products }));
        
        ConnectionGuard.active = true;
        ConnectionGuard.retryCount = 0; 
        
        return products;

    } catch (e) { 
        handleConnectionDrop(fetchProductsCatalog);
        console.error("اعتماد الذاكرة المحلية بسبب انقطاع الاتصال:", e);
        BoseState.catalog = getFromLocalMemory('bosesweets_catalog') || []; 
        syncCatalogMap(); 
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('catalogDataReady', { detail: BoseState.catalog }));
        return BoseState.catalog; 
    }
}

export async function initializeDataBridge() {
    if (window.__BoseBridgeInitialized) return; window.__BoseBridgeInitialized = true;
    const emergencyTimeout = new Promise(resolve => setTimeout(() => resolve('timeout'), 4000));
    const operations = Promise.all([fetchSystemSettings(), fetchShippingZones(), fetchProductsCatalog()]);
    await Promise.race([operations, emergencyTimeout]);
    const uniqueCats = [...new Set(BoseState.catalog.map(p => p.category))].filter(Boolean);
    BoseState.catMenu = BoseState.siteSettings.catMenu?.map(c => c.name || c) || uniqueCats;
    setAppReady(); window.dispatchEvent(new CustomEvent('catalogDataReady'));
}

export function listenToSovereignUpdates() {
    if (!db || window.__BoseListenersActive) return; window.__BoseListenersActive = true;
    
    onSnapshot(collection(db, 'catalog'), (snap) => {
        const list = [];
        snap.forEach(d => {
            const data = d.data();
            if (data.isActive !== false) {
                list.push({ id: d.id, ...data });
            }
        });
        BoseState.catalog = list;
        syncCatalogMap(); 
        saveToLocalMemory('bosesweets_catalog', BoseState.catalog);
        window.saveEngineMemory('cat'); 
        
        window.dispatchEvent(new Event('catalogDataReady'));
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
        if (window.distributeProductsToUI) window.distributeProductsToUI(BoseState.catalog);
    }, (err) => {
        if (window.BoseMonitor) window.BoseMonitor.report(err, 'core-engine.js', null, null, 'listenToSovereignUpdates Error');
    });
}

if (typeof window !== 'undefined') {
    window.initializeDataBridge = initializeDataBridge; window.listenToSovereignUpdates = listenToSovereignUpdates;
    const startBridge = () => { if (!window.location.pathname.includes('admin')) { initializeDataBridge(); listenToSovereignUpdates(); } };
    if (document.readyState === 'complete') {
        startBridge();
        fetchProductsCatalog();
    } else {
        document.addEventListener('DOMContentLoaded', () => { startBridge(); fetchProductsCatalog(); });
    }
}

// ============================================================================
// 🔒 القسم السابع: مستمعي المزامنة الفورية السحابية (Firebase Real-time Sync V39.4)
// ============================================================================

export function initializeSovereignSync() {
    if (!db) return;

    listenToSovereignUpdates();

    if (!window.__BoseSovereignSyncActive) {
        window.__BoseSovereignSyncActive = true;

        onSnapshot(doc(db, 'settings', 'theme'), (snap) => {
            if(snap.exists()) {
                const themeData = snap.data();
                BoseState.theme = themeData;
                window.saveEngineMemory('theme');
                if(window.applyThemeConfigUI) window.applyThemeConfigUI();
                if(window.distributeProductsToUI) window.distributeProductsToUI();
            }
        }, (err) => {
            if (window.BoseMonitor) window.BoseMonitor.report(err, 'core-engine.js', null, null, 'Theme SnapshotListener');
        });

        onSnapshot(doc(db, 'settings', 'logistics'), (snap) => {
            if(snap.exists()) {
                BoseState.logistics = snap.data();
                window.dispatchEvent(new CustomEvent('BoseSweets_Logistics_Updated'));
            }
        }, (err) => {
            if (window.BoseMonitor) window.BoseMonitor.report(err, 'core-engine.js', null, null, 'Logistics SnapshotListener');
        });

        onSnapshot(doc(db, 'settings', 'pricingRules'), (snap) => {
            if(snap.exists()) {
                const data = snap.data();
                BoseState.pricingRules = {
                    pricePerPerson: data.pricePerPerson !== undefined ? data.pricePerPerson : 145,
                    printEdible: data.printEdible !== undefined ? data.printEdible : 60,
                    printNonEdible: data.printNonEdible !== undefined ? data.printNonEdible : 20,
                    giftCardPrice: data.giftCardPrice !== undefined ? data.giftCardPrice : 40,
                    ...data
                };
                window.dispatchEvent(new CustomEvent('BoseSweets_Pricing_Updated'));
            }
        }, (err) => {
            if (window.BoseMonitor) window.BoseMonitor.report(err, 'core-engine.js', null, null, 'Pricing SnapshotListener');
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
        }, (err) => {
            if (window.BoseMonitor) window.BoseMonitor.report(err, 'core-engine.js', null, null, 'SyncFlag SnapshotListener');
        });
    }
}
