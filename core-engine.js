```javascript
/**
 * ============================================================================
 * 👑 BoseSweets Sovereign Core Engine | المحرك الأساسي السيادي (القلب النابض)
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي (The Management)
 * الحالة: مركز البيانات، تهيئة السحابة، نظام المراقبة، ومحرك السلة.
 * التوافق الكامل: معالجة فورية لتحديثات المخزون والتزامن اللحظي دون اهتزازات.
 * الترقية: V40.2 Premium - التوافق المطلق والمزامنة الهندسية مع محرك الواجهة.
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
        window.BoseSweets_Engine_Version = "V40.2_Premium";
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
            if (!stack) return { file: 'core-engine.js', line: 'غير معروف', col: 'غير معروف' };
            const lines = stack.split('\n');
            for (let i = 1; i < lines.length; i++) {
                const match = lines[i].match(/(.*):(\d+):(\d+)/);
                if (match) return { file: match[1].split('/').pop(), line: match[2], col: match[3] };
            }
            return { file: 'تحليل معقد', line: 'N/A', col: 'N/A' };
        },
        report: async function(error, sourceFile = 'core-engine.js', lineNo = null, colNo = null, functionName = 'رصد تلقائي (Auto-Detect)') {
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
                    engineVersion: 'V40.2_Premium'
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
                let fName = event.filename ? event.filename.split('/').pop() : 'core-engine.js';
                this.report(event.error || event.message, fName, null, null, 'رصد تلقائي (Global Error)');
            });
            window.addEventListener('unhandledrejection', (event) => {
                this.report(event.reason || 'عملية خلفية تم رفضها ولم تعالج', 'core-engine.js', null, null, 'عملية شبكية (Promise Rejection)');
            });
        },
        initPerformanceWatch: function() {
            if (typeof window === 'undefined' || !window.PerformanceObserver) return;
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 500) { 
                            this.report(`اختناق في الأداء: عملية استغرقت ${Math.round(entry.duration)}ms`, 'معالج الواجهة', null, null, 'مستشعر النبض (Performance)');
                        }
                    }
                });
                observer.observe({entryTypes: ['longtask']});

                const resObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.initiatorType === 'img' && entry.transferSize > 500000) { 
                            this.report(`استهلاك بيانات زائد: صورة بحجم ${Math.round(entry.transferSize / 1024)}KB - الرابط: ${entry.name}`, 'شبكة الوسائط', null, null, 'مستشعر النبض (Network)');
                        }
                    }
                });
                resObserver.observe({entryTypes: ['resource']});
            } catch(e) {}
        }
    };
    window.BoseMonitor.initGlobalWatch();
    window.BoseMonitor.initPerformanceWatch();
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
    if (typeof window !== 'undefined') {
        if (typeof window.loadEngineMemory === 'function') {
            window.loadEngineMemory();
        } else if (typeof loadEngineMemory === 'function') {
            loadEngineMemory();
        }
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
            if (typeof window.distributeProductsToUI === 'function') {
                window.distributeProductsToUI(BoseState.catalog);
            }
            window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
        }
        if (cachedTheme && Object.keys(cachedTheme).length > 0 && Object.keys(BoseState.theme).length === 0) {
            BoseState.theme = cachedTheme;
            if (typeof window.applyThemeConfigUI === 'function') {
                window.applyThemeConfigUI();
            }
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
                        source: 'BoseSweets_Engine_Sovereign_V40.2_Premium',
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
                await setDoc(syncDocRef, { lastAdminUpdate: Date.now(), version: 'V40.2_Premium', forceRefresh: true }, { merge: true });
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
            } catch (e) break;
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

// 👑 تأكيد تهيئة متغير الحالة الأساسي مبكراً على النطاق العام لمنع أي أخطاء برمجية
if (typeof window !== 'undefined') {
    if (!window.BoseState) {
        window.BoseState = { catalog: [], cart: [] };
    }
}

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
    cart: [], 
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

// قراءة السلة بأمان بعد استيفاء تهيئة الهياكل المرجعية
try {
    if (typeof window !== 'undefined') {
        BoseState.cart = JSON.parse(localStorage.getItem('bose_cart_storage') || localStorage.getItem('BoseSweets_Cart') || localStorage.getItem('bose_cart') || '[]');
    }
} catch (e) {
    BoseState.cart = [];
}

export function syncCatalogMap() {
    BoseState.catalogMap.clear();
    BoseState.catalog.forEach(p => {
        if (p && p.id) BoseState.catalogMap.set(String(p.id), p);
    });
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
        
        const executeReadyLogic = () => {
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => { 
                    loader.style.display = 'none'; 
                    const mc = document.getElementById('main-content'); 
                    if (mc) mc.style.opacity = '1';
                }, 700);
            }
            window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready', { 
                detail: { timestamp: Date.now(), status: 'Sovereign_Ready' } 
            }));
        };

        // حارس التفاعل: تأمين التلاعب بعناصر DOM لضمان جاهزية الصفحة بنسبة 100%
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', executeReadyLogic);
        } else {
            executeReadyLogic();
        }
    } catch (e) {
        if (window.BoseMonitor) window.BoseMonitor.report(e, 'core-engine.js', null, null, 'setAppReady');
    }
}

if (typeof window !== 'undefined') {
    window.boseConfig = boseConfig; 
    window.BoseState = BoseState; 
    window.syncCatalogMap = syncCatalogMap;
    window.saveToLocalMemory = saveToLocalMemory; 
    window.getFromLocalMemory = getFromLocalMemory; 
    window.setAppReady = setAppReady;
    window.processBoseImage = processBoseImage; 
    window.normalizeArabic = normalizeArabic;
    
    // ربط مراجع الحالة بالنافذة العامة لضمان عدم وجود انفصال نسبي بين العناصر
    Object.assign(window.BoseState, BoseState);
    window.BoseState = BoseState;
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
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('BoseSweets_Cart_Updated'));
    },
    save: function() { this.saveCartToStorage(); },
    clearCartStorage: function() { 
        BoseState.cart = []; 
        this.saveCartToStorage(); 
        if (typeof this.syncCartUI === 'function') this.syncCartUI(); 
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
            const applyBadge = () => {
                const badges = document.querySelectorAll('#cart-count-badge, #mobile-cart-badge, .cart-badge-global');
                badges.forEach(el => {
                    el.innerText = totalItems;
                    el.style.display = totalItems > 0 ? 'flex' : 'none';
                    if (totalItems > 0) el.classList.remove('hidden'); else el.classList.add('hidden');
                });
            };
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', applyBadge);
            } else {
                applyBadge();
            }
        }
    },
    syncCartUI: function() {
        if (typeof document === 'undefined') return;
        
        const applySync = () => {
            const cartList = document.getElementById('cart-items-list');
            if (!cartList) return;
            if (BoseState.securityLayer?.validateCartPrices) BoseState.cart = BoseState.securityLayer.validateCartPrices(BoseState.cart);
            if (BoseState.cart.length === 0) {
                cartList.innerHTML = `<div class="empty-cart flex flex-col items-center justify-center p-12 text-center"><i data-lucide="shopping-bag" class="w-20 h-20 mb-4 opacity-20" style="color: ${boseConfig.branding.colors.pink};"></i><h3 class="text-xl font-black mb-2">سلة المشتريات فارغة</h3></div>`;
                ['summary-subtotal', 'summary-total'].forEach(id => { if (document.getElementById(id)) document.getElementById(id).innerText = '0 ج.م'; });
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
            if (document.getElementById('summary-subtotal')) document.getElementById('summary-subtotal').innerText = `${totals.subtotal} ج.م`;
            if (document.getElementById('summary-total')) document.getElementById('summary-total').innerText = `${totals.total} ج.م`;
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applySync);
        } else {
            applySync();
        }
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
        if (qtyDisplay) qtyDisplay.innerText = "1";
        
        if (typeof window.showBoseToast === 'function') {
            window.showBoseToast(`تم إضافة [${product.name}] للسلة بنجاح.`);
        } else if (typeof window.showSystemToast === 'function') {
            window.showSystemToast(`تم إضافة [${product.name}] للسلة بنجاح.`, 'success');
        } else {
            console.log(`تم إضافة [${product.name}] للسلة بنجاح.`);
        }
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('BoseSweets_Cart_Updated'));
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
            if (typeof window.applyThemeConfigUI === 'function') {
                window.applyThemeConfigUI();
            }
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
            BoseState.shippingZones = shipSnap.docs.map(d => ({ id: d.id, ...d.data() }));
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
        
        if (typeof window.distributeProductsToUI === 'function') {
            window.distributeProductsToUI(BoseState.catalog);
        }
        
        // إطلاق الحدث السيادي لتأكيد الجاهزية والتحديث في الواجهة
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
        return BoseState.catalog;
    } catch (e) {
        BoseState.catalog = getFromLocalMemory('bosesweets_catalog') || [];
        syncCatalogMap();
        if (typeof window.distributeProductsToUI === 'function') {
            window.distributeProductsToUI(BoseState.catalog);
        }
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
        return BoseState.catalog;
    }
}

export async function initializeDataBridge() {
    if (window.__BoseBridgeInitialized) return;
    window.__BoseBridgeInitialized = true;
    await Promise.all([fetchSystemSettings(), fetchThemeSettings(), fetchShippingZones(), fetchProductsCatalog()]);
    syncCatalogMap();
    if (typeof window.distributeProductsToUI === 'function') {
        window.distributeProductsToUI(BoseState.catalog);
    }
    const uniqueCats = [...new Set(BoseState.catalog.map(p => p.category))].filter(Boolean);
    BoseState.catMenu = BoseState.siteSettings.catMenu?.map(c => c.name || c) || uniqueCats;
    setAppReady();
}

export function listenToSovereignUpdates() {
    if (!db || window.__BoseListenersActive) return; 
    window.__BoseListenersActive = true;
    
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
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
        if (typeof window.distributeProductsToUI === 'function') {
            window.distributeProductsToUI(BoseState.catalog);
        }
    });
}

if (typeof window !== 'undefined') {
    window.initializeDataBridge = initializeDataBridge;
    window.listenToSovereignUpdates = listenToSovereignUpdates;
    const startBridge = () => { 
        if (!window.location.pathname.includes('admin')) { 
            initializeDataBridge(); 
            listenToSovereignUpdates(); 
            // تشغيل المحرك التزامني اللحظي لضمان تدفق التحديثات وتجنب الاختفاء
            if (typeof initializeSovereignSync === 'function') {
                initializeSovereignSync();
            }
        } 
    };
    
    // ضمان إرسال أحداث الجاهزية التامة لتنظيم التدفق البرمجي دون اهتزاز أو فقدان عناصر
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready'));
        }, 500);
    });

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
    if (!db) {
        if (window.BoseMonitor) window.BoseMonitor.report("Sync_Activation", 'core-engine.js', null, null, 'قاعدة البيانات غير مهيأة بالشكل الصحيح');
        return;
    }
    if (window.__BoseSovereignSyncActive) return;
    window.__BoseSovereignSyncActive = true;

    let isCatalogLoaded = false;
    let isThemeLoaded = false;
    let isLogisticsLoaded = false;
    let isPricingLoaded = false;

    // مراقب جاهزية المحرك لإعطاء إشارة البدء للواجهة البصرية
    function checkEngineStatus() {
        if (isCatalogLoaded && isThemeLoaded && isLogisticsLoaded && isPricingLoaded) {
            BoseState.isAppReady = true;
            window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready'));
        }
    }

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
        
        // التحصين اللحظي: مراجعة الأسعار في سلة العميل فوراً وتعديلها إذا تم تغييرها من لوحة الإدارة
        if (BoseState.cart.length > 0 && typeof window.cartSystem !== 'undefined') {
            BoseState.cart = BoseState.securityLayer.validateCartPrices(BoseState.cart);
            window.cartSystem.saveCartToStorage();
        }
        
        isCatalogLoaded = true;
        checkEngineStatus();
        
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
            if (typeof window.applyThemeConfigUI === 'function') {
                window.applyThemeConfigUI();
            }
            if (typeof window.distributeProductsToUI === 'function') {
                window.distributeProductsToUI(BoseState.catalog);
            }
        }
        isThemeLoaded = true;
        checkEngineStatus();
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
    });

    onSnapshot(doc(db, 'settings', 'logistics'), (snap) => {
        if (snap.exists()) {
            BoseState.logistics = snap.data();
            window.dispatchEvent(new CustomEvent('BoseSweets_Logistics_Updated'));
        }
        isLogisticsLoaded = true;
        checkEngineStatus();
    });

    onSnapshot(doc(db, 'settings', 'pricingRules'), (snap) => {
        if (snap.exists()) {
            BoseState.pricingRules = snap.data();
            window.dispatchEvent(new CustomEvent('BoseSweets_Pricing_Updated'));
        }
        isPricingLoaded = true;
        checkEngineStatus();
    });

    onSnapshot(doc(db, 'system', 'syncFlag'), (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            const lastUpdate = parseInt(localStorage.getItem('bose_last_local_sync') || '0');
            
            // التعديل: إرسال حدث تحديث للسماح بالتحديث السلس دون إغلاق المتصفح
            if (data.lastAdminUpdate > lastUpdate && data.forceRefresh === true) {
                localStorage.setItem('bose_last_local_sync', data.lastAdminUpdate.toString());
                console.log("👑 BoseSync: تم استقبال تحديث البيانات، جاري المزامنة السلسة...");
                window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
            }
        }
    });
}

// تصدير دالة التهيئة لتكون متاحة للواجهة
if (typeof window !== 'undefined') {
    window.initializeSovereignSync = initializeSovereignSync;
}

// ============================================================================
// 🛡️ القسم الثامن: مستمعي الأحداث السيادية لتوجيه الواجهات وتحديث العرض تلقائياً
// ============================================================================
if (typeof window !== 'undefined') {
    window.addEventListener('BoseSweets_Catalog_Updated', () => {
        if (typeof window.distributeProductsToUI === 'function') {
            window.distributeProductsToUI(window.BoseState.catalog);
        }
    });

    window.addEventListener('BoseSweets_Logistics_Updated', () => {
        if (typeof window.applyLogisticsRulesUI === 'function') {
            window.applyLogisticsRulesUI();
        }
    });
    
    window.addEventListener('BoseSweets_Pricing_Updated', () => {
        if (typeof window.applyPricingRulesUI === 'function') {
            window.applyPricingRulesUI();
        }
    });
}

```
