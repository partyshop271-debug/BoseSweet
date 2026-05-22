/**
 * ============================================================================
 * 👑 BoseSweets Sovereign Core Engine | المحرك الأساسي السيادي لعلامة حلويات بوسي
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي التجاريّة (The Management)
 * المرجعية الهيكلية: الدستور التكنولوجي السيادي المحدث V44.0 Ultra Premium & Clean
 * الحالة: مركز البيانات السيادي، الاتصال السحابي المحصن، ونظام السلة المركزي المحمي.
 * التوافق الكامل: معالجة فورية لتحديثات المخزون والتزامن اللحظي دون اهتزازات بصريّة.
 * ============================================================================
 */

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
    getDocs, 
    getDoc, 
    onSnapshot,
    query
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ============================================================================
// 🔒 القسم الأول: التهيئة السحابية المحصنة ونظام الرصد التلقائي الشامل (BoseMonitor)
// ============================================================================

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
        window.BoseSweets_Engine_Version = "V44.0_Ultra_Premium_Clean";
    }
} catch (error) {
    console.error("🔒 قرار إداري أمني: فشل تهيئة السحابة، يرجى مراجعة الخوادم فوراً.", error);
}

export { app, db, auth };

// 🛡️ الصندوق الأسود السيادي (BoseMonitor) لرصد وتحليل الأعطال تلقائياً
(function() {
    if (typeof window === 'undefined' || window.BoseMonitor) return;

    window.BoseMonitor = {
        logQueue: [],
        diagnose: function(errorMsg) {
            const msg = String(errorMsg).toLowerCase();
            if (msg.includes('auth') || msg.includes('credential')) return "عائق توثيق (Auth Error): فشل في تأكيد الصلاحيات مع السحابة.";
            if (msg.includes('network') || msg.includes('fetch') || msg.includes('offline')) return "عططل اتصالي (Network): المحرك فقد الاتصال بالسحابة المركزية.";
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
                    engineVersion: 'V44.0_Ultra_Premium_Clean'
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
// 🔒 القسم الثاني: نظام حفظ الذاكرة ومحرك التخزين المحلي السيادي (IndexedDB)
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

export async function initProducts() {
    try {
        await StorageEngine.init(); 
        const catalog = await StorageEngine.get('bose_catalog') || [];
        window.BoseState = window.BoseState || {};
        
        catalog.forEach(p => {
            p.id = p.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            p.category = p.category || 'صنف فاخر';
            p.stock = p.stock != null ? p.stock : 1;
            p.inStock = p.stock !== 0;
            p.price = p.price || 0;
        });
        
        window.BoseState.catalog = catalog;
        syncCatalogMap();

        const triggerUIDistribution = () => {
            if (typeof window.distributeProductsToUI === 'function') {
                window.distributeProductsToUI(window.BoseState.catalog);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', triggerUIDistribution);
        } else {
            triggerUIDistribution();
        }

    } catch (err) {
        if (window.BoseMonitor) {
            window.BoseMonitor.report(err, 'core-engine.js', null, null, 'initProducts');
        }
    }
}

StorageEngine.init().then(() => {
    if (typeof window !== 'undefined') {
        if (typeof window.loadEngineMemory === 'function') {
            window.loadEngineMemory();
        }
    }
    initProducts();
}).catch(err => {
    if (window.BoseMonitor) window.BoseMonitor.report(err, 'core-engine.js', null, null, 'StorageEngine.init');
});

window.saveEngineMemory = async function(type) {
    try {
        if (type === 'cat') {
            await StorageEngine.set('bose_catalog', window.BoseState.catalog);
        } else if (type === 'theme') {
            await StorageEngine.set('bose_theme', window.BoseState.theme);
        }
    } catch (e) {
        if (window.BoseMonitor) window.BoseMonitor.report(e, 'core-engine.js', null, null, 'saveEngineMemory');
    }
};

window.loadEngineMemory = async function() {
    try {
        const cachedCatalog = await StorageEngine.get('bose_catalog');
        const cachedTheme = await StorageEngine.get('bose_theme');
        
        if (typeof window !== 'undefined' && !window.BoseState) {
            window.BoseState = { catalog: [], cart: [] };
        }

        if (cachedCatalog && cachedCatalog.length > 0) {
            cachedCatalog.forEach(p => {
                p.id = p.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                p.category = p.category || 'صنف فاخر';
                p.stock = p.stock != null ? p.stock : 1;
                p.inStock = p.stock !== 0;
                p.price = p.price || 0;
            });

            window.BoseState.catalog = cachedCatalog;
            syncCatalogMap();
            
            const triggerUIDistribution = () => {
                if (typeof window.distributeProductsToUI === 'function') {
                    window.distributeProductsToUI(window.BoseState.catalog);
                }
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', triggerUIDistribution);
            } else {
                triggerUIDistribution();
            }

            window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
        }
        if (cachedTheme && Object.keys(cachedTheme).length > 0) {
            window.BoseState.theme = cachedTheme;
        }
    } catch (e) {
        if (window.BoseMonitor) window.BoseMonitor.report(e, 'core-engine.js', null, null, 'loadEngineMemory');
    }
};

// ============================================================================
// 🛡️ القسم الثالث: محركات المزامنة والطوارئ السحابية الفعالة (NetworkEngine)
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
                        source: 'BoseSweets_Engine_Sovereign_V44.0_Ultra_Premium_Clean',
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
                await setDoc(syncDocRef, { lastAdminUpdate: Date.now(), version: 'V44.0_Ultra_Premium_Clean', forceRefresh: true }, { merge: true });
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
        const opWithId = { ...operation, queueId: 'op_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5), createdAt: Date.now() };
        try {
            let fallbackQ = this.getFallbackQueue();
            fallbackQ.push(opWithId);
            this.setFallbackQueue(fallbackQ);
        } catch (e) {}

        try {
            const database = await this.init();
            if (database) {
                const tx = database.transaction(this.storeName, 'readwrite');
                tx.objectStore(this.storeName).put(opWithId);
            }
            return true;
        } catch (e) { 
            return true; 
        }
    },
    async getAll() {
        try {
            let results = this.getFallbackQueue();
            const database = await this.init();
            if (!database) return results;
            return new Promise((resolve) => {
                const tx = database.transaction(this.storeName, 'readonly');
                const request = tx.objectStore(this.storeName).getAll();
                request.onsuccess = () => {
                    const merged = [...results];
                    const dbResults = request.result || [];
                    dbResults.forEach(item => {
                        if (!merged.some(m => m.queueId === item.queueId)) {
                            merged.push(item);
                        }
                    });
                    resolve(merged);
                };
                request.onerror = () => resolve(results); 
            });
        } catch (e) { return []; }
    },
    async remove(queueId) {
        try {
            let fallbackQ = this.getFallbackQueue();
            fallbackQ = fallbackQ.filter(op => op.queueId !== queueId);
            this.setFallbackQueue(fallbackQ);
        } catch (e) {}

        try {
            const database = await this.init();
            if (database) {
                const tx = database.transaction(this.storeName, 'readwrite');
                tx.objectStore(this.storeName).delete(queueId);
            }
            return true;
        } catch (e) { 
            return false; 
        }
    }
};

const executeWithBackoff = async (operationFunction, retries = 4, delay = 1000) => {
    try {
        return await operationFunction();
    } catch (err) {
        const isNetworkErr = err.message && (
            err.message.toLowerCase().includes('network') ||
            err.message.toLowerCase().includes('fetch') ||
            err.message.toLowerCase().includes('offline') ||
            err.message.toLowerCase().includes('failed to get')
        );
        if (retries > 0 && isNetworkErr) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return executeWithBackoff(operationFunction, retries - 1, delay * 2);
        }
        throw err;
    }
};

export const NetworkEngine = {
    async safeWrite(collectionName, docId, data) {
        try {
            if (collectionName === 'settings' && docId === 'main') {
                if (!auth || !auth.currentUser) throw new Error("🔒 توثيق الإدارة مطلوب.");
            }
            if (!db) throw new Error("Database not ready.");
            
            await executeWithBackoff(async () => {
                await setDoc(doc(db, collectionName, String(docId)), data, { merge: true });
            }, 3, 1000);

            if (collectionName === 'orders') ReverseSyncEngine.triggerOrderWebhook(data);
            else if (['settings', 'catalog', 'shipping'].includes(collectionName)) ReverseSyncEngine.broadcastGlobalUpdate();
            return true;
        } catch (error) {
            await CloudQueueDB.enqueue({ type: 'write', collectionName, docId, data });
            return true; 
        }
    },
    async safeDelete(collectionName, docId) {
        try {
            if (!db) throw new Error("Database not ready.");

            await executeWithBackoff(async () => {
                await deleteDoc(doc(db, collectionName, String(docId)));
            }, 3, 1000);

            if (['settings', 'catalog', 'shipping'].includes(collectionName)) ReverseSyncEngine.broadcastGlobalUpdate();
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
                if (op.type === 'write') {
                    await executeWithBackoff(async () => {
                        await setDoc(doc(db, op.collectionName, String(op.docId)), op.data, { merge: true });
                    }, 2, 1000);
                } else if (op.type === 'delete') {
                    await executeWithBackoff(async () => {
                        await deleteDoc(doc(db, op.collectionName, String(op.docId)));
                    }, 2, 1000);
                }
                await CloudQueueDB.remove(op.queueId);
            } catch (e) {
                break;
            }
        }
    }
};

if (typeof window !== 'undefined') {
    window.ReverseSyncEngine = ReverseSyncEngine;
    window.CloudQueueDB = CloudQueueDB;
    window.NetworkEngine = NetworkEngine;
    window.addEventListener('online', () => {
        NetworkEngine.processQueue();
    });
    setTimeout(() => NetworkEngine.processQueue(), 5000);
}

// ============================================================================
// 🧠 القسم الرابع: الذاكرة المركزية الموحدة وعزل الحسابات الفعالة (BoseState)
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
    cloudinary: { cloudName: CLOUDINARY_CLOUD_NAME, baseDeliveryUrl: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload//` },
    branding: { colors: { pink: "#ff91a4", dark: "#111111", white: "#FFFFFF" } },
    location: { address: "الكفاح، شارع الوحدة المحلية، بجوار صيدلية د. أحمد مجدي وعيادة د. علي" }
};

if (typeof window !== 'undefined') {
    if (!window.BoseState) {
        window.BoseState = { catalog: [], cart: [] };
    }
}

export const BoseState = {
    catalog: [],
    theme: {},
    logistics: { isOpen: true, allowPickup: true, minOrder: 0 },
    pricingRules: {}, 
    siteSettings: {}, 
    shippingZones: [], 
    catMenu: [], 
    activeCat: 'الرئيسية', 
    isAppReady: false,         
    cart: [], 
    currentShippingFee: 0, 
    appliedPromo: null,
    catalogMap: new Map(),
    securityLayer: {
        validateCartPrices: function(cartArray) {
            if (!Array.isArray(cartArray) || window.BoseState.catalogMap.size === 0) return cartArray;
            return cartArray.map(item => {
                const referenceItem = window.BoseState.catalogMap.get(String(item.id));
                if (referenceItem && parseFloat(item.price) !== parseFloat(referenceItem.price)) {
                    item.price = parseFloat(referenceItem.price);
                }
                return item;
            });
        }
    },
    checkoutState: {
        deliveryMethod: 'الاستلام من المقر', deliveryDate: null, deliveryTime: null, customerName: '', primaryPhone: '', secondaryPhone: '', detailedAddress: '',
        setDeliveryMethod(method) { const mapping = { 'pickup': 'الاستلام من المقر', 'delivery': 'الشحن للمنزل' }; this.deliveryMethod = mapping[method] || method; }
    },
    cakeState: { flavor: 'فانيليا', shape: 'دائري', persons: 4, printingOption: 'بدون', notes: '', refImage: null, allergies: '', hasCard: false, cardText: '', occasionTheme: '', designStyle: 'تصميم محدد' },
    currentBuilderStep: 1
};

try {
    if (typeof window !== 'undefined') {
        BoseState.cart = JSON.parse(localStorage.getItem('bose_cart_storage') || localStorage.getItem('BoseSweets_Cart') || localStorage.getItem('bose_cart') || '[]');
    }
} catch (e) {
    BoseState.cart = [];
}

export function syncCatalogMap() {
    window.BoseState.catalogMap.clear();
    window.BoseState.catalog.forEach(p => {
        if (p && p.id) window.BoseState.catalogMap.set(String(p.id), p);
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
        window.BoseState.isAppReady = true;
        const executeReadyLogic = () => {
            window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready', { 
                detail: { timestamp: Date.now(), status: 'Sovereign_Ready' } 
            }));
        };

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
    Object.assign(window.BoseState, BoseState);
}

// ============================================================================
// 🛒 القسم الخامس: محرك السلة المركزي الموحد والمحمي (Cart System)
// ============================================================================

export const cartSystem = {
    getAdjustedPrice: function(basePrice) { return Math.round(parseFloat(basePrice)); },
    getCart: function() {
        const localCart = localStorage.getItem('bose_cart_storage') || localStorage.getItem('BoseSweets_Cart') || localStorage.getItem('bose_cart');
        if (localCart) { 
            const parsed = JSON.parse(localCart); 
            window.BoseState.cart = parsed; 
            return parsed; 
        }
        return window.BoseState.cart || [];
    },
    saveCartToStorage: function() { 
        saveToLocalMemory('BoseSweets_Cart', window.BoseState.cart);
        saveToLocalMemory('bose_cart_storage', window.BoseState.cart);
        saveToLocalMemory('bose_cart', window.BoseState.cart);
        this.updateCartDisplay();
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('BoseSweets_Cart_Updated'));
    },
    save: function() { this.saveCartToStorage(); },
    clearCartStorage: function() { 
        window.BoseState.cart = []; 
        this.saveCartToStorage(); 
    },
    calculateCartTotal: function(deliveryMode = 'الاستلام من المقر') {
        this.getCart();
        if (window.BoseState.securityLayer?.validateCartPrices) window.BoseState.cart = window.BoseState.securityLayer.validateCartPrices(window.BoseState.cart);
        let subtotal = 0;
        window.BoseState.cart.forEach(item => {
            const product = window.BoseState.catalogMap.get(String(item.id)) || window.BoseState.catalog.find(p => String(p.id) === String(item.id));
            let finalPrice = this.getAdjustedPrice(product ? product.price : item.price);
            let qty = parseInt(item.quantity || item.qty) || 1;
            let addonsPrice = 0;
            if (item.isCustomCake || item.isCustom) {
                if (item.printing?.includes('أكل') || item.details?.printType === 'edible') {
                    addonsPrice = parseFloat(window.BoseState.pricingRules?.printEdible) || 60;
                } else if (item.printing?.includes('غير قابلة') || item.details?.printType === 'non_edible') {
                    addonsPrice = parseFloat(window.BoseState.pricingRules?.printNonEdible) || 20;
                }
            }
            subtotal += ((finalPrice + addonsPrice) * qty);
        });
        let shippingFee = 0;
        const isPickup = deliveryMode === 'pickup' || deliveryMode === 'الاستلام من المقر' || deliveryMode === 'استلام';
        if (!isPickup) {
            shippingFee = deliveryMode.includes('الفرافرة') ? 25 : (deliveryMode.includes('الكفاح') ? 10 : 20);
        }
        return { subtotal, shippingFee, total: subtotal + shippingFee };
    },
    updateCartDisplay: function() {
        this.getCart();
        const totalItems = window.BoseState.cart.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
        if (typeof document !== 'undefined') {
            const applyBadge = () => {
                const badges = document.querySelectorAll('#cart-count-badge');
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
    modQ: function(index, delta) {
        this.getCart();
        if (window.BoseState.cart[index]) {
            let qty = window.BoseState.cart[index].quantity || window.BoseState.cart[index].qty || 1;
            qty += delta;
            if (qty <= 0) window.BoseState.cart.splice(index, 1);
            else window.BoseState.cart[index].quantity = Math.min(50, qty);
            window.BoseState.cart[index].qty = window.BoseState.cart[index].quantity;
            this.saveCartToStorage();
        }
    },
    addWithQtyContext: function(btn, productId) {
        const wrapper = btn.closest('.suggestion-item') || btn.closest('.bose-double-wrap-cart') || btn.parentElement.parentElement;
        const qtyDisplay = wrapper ? wrapper.querySelector('.temp-qty-display') : null;
        const qty = qtyDisplay ? parseInt(qtyDisplay.innerText) : 1;
        const product = window.BoseState.catalogMap.get(String(productId)) || window.BoseState.catalog.find(p => String(p.id) === String(productId));
        if (!product) return;

        const existingItemIdx = window.BoseState.cart.findIndex(item => String(item.id) === String(productId) && !item.isCustomCake && !item.isCustom);
        if (existingItemIdx > -1) {
            window.BoseState.cart[existingItemIdx].quantity = (window.BoseState.cart[existingItemIdx].quantity || 1) + qty;
            window.BoseState.cart[existingItemIdx].qty = window.BoseState.cart[existingItemIdx].quantity;
        } else {
            window.BoseState.cart.push({ 
                id: product.id, name: product.name, price: parseFloat(product.price) || 0, 
                image: product.img || product.image || "", quantity: qty, qty: qty, 
                isCustomCake: false, isCustom: false, category: product.category || ''
            });
        }
        this.saveCartToStorage();
        if (qtyDisplay) qtyDisplay.innerText = "1";
        
        if (typeof window.showToastMessage === 'function') {
            window.showToastMessage(`تم إضافة [${product.name}] للسلة.`);
        }
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('BoseSweets_Cart_Updated'));
    }
};

if (typeof window !== 'undefined') {
    window.cartSystem = cartSystem;
}

// ============================================================================
// 🔗 القسم السادس: جسر جلب البيانات وتوزيع الكتالوج (Data Bridge)
// ============================================================================

export async function fetchSystemSettings() {
    try {
        if (!db) return;
        const sSnap = await getDoc(doc(db, 'settings', 'main'));
        if (sSnap.exists()) {
            Object.assign(window.BoseState.siteSettings, sSnap.data());
            saveToLocalMemory('bosesweets_settings', window.BoseState.siteSettings);
        }
    } catch (e) {
        Object.assign(window.BoseState.siteSettings, getFromLocalMemory('bosesweets_settings') || {});
    }
}

export async function fetchThemeSettings() {
    try {
        if (!db) return;
        const tSnap = await getDoc(doc(db, 'settings', 'theme'));
        if (tSnap.exists()) {
            window.BoseState.theme = tSnap.data();
            saveToLocalMemory('bosesweets_theme', window.BoseState.theme);
            window.saveEngineMemory('theme');
        }
    } catch (e) {
        window.BoseState.theme = getFromLocalMemory('bosesweets_theme') || {};
    }
}

export async function fetchShippingZones() {
    try {
        if (!db) return;
        const shipSnap = await getDocs(collection(db, 'shipping'));
        if (!shipSnap.empty) {
            window.BoseState.shippingZones = shipSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            saveToLocalMemory('bosesweets_shipping', window.BoseState.shippingZones);
        }
    } catch (e) {
        window.BoseState.shippingZones = getFromLocalMemory('bosesweets_shipping') || [];
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
                const parsedProduct = {
                    id: d.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: raw.name || "صنف فاخر",
                    price: parseFloat(raw.price) || 0,
                    category: raw.category || "عام",
                    img: raw.img || raw.image || "",
                    description: raw.description || raw.desc || "",
                    stock: raw.stock != null ? raw.stock : 1,
                    inStock: raw.stock !== 0,
                    ...raw 
                };
                products.push(parsedProduct);
            }
        });
        window.BoseState.catalog = products;
        syncCatalogMap();
        saveToLocalMemory('bosesweets_catalog', window.BoseState.catalog);
        window.saveEngineMemory('cat');
        
        const triggerUIDistribution = () => {
            if (typeof window.distributeProductsToUI === 'function') {
                window.distributeProductsToUI(window.BoseState.catalog);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', triggerUIDistribution);
        } else {
            triggerUIDistribution();
        }
        
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
        return window.BoseState.catalog;
    } catch (e) {
        window.BoseState.catalog = getFromLocalMemory('bosesweets_catalog') || [];
        window.BoseState.catalog.forEach(p => {
            p.id = p.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            p.category = p.category || 'صنف فاخر';
            p.stock = p.stock != null ? p.stock : 1;
            p.inStock = p.stock !== 0;
            p.price = p.price || 0;
        });
        syncCatalogMap();
        
        const triggerUIDistribution = () => {
            if (typeof window.distributeProductsToUI === 'function') {
                window.distributeProductsToUI(window.BoseState.catalog);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', triggerUIDistribution);
        } else {
            triggerUIDistribution();
        }
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
        return window.BoseState.catalog;
    }
}

export async function initializeDataBridge() {
    if (window.__BoseBridgeInitialized) return;
    window.__BoseBridgeInitialized = true;
    await Promise.all([fetchSystemSettings(), fetchThemeSettings(), fetchShippingZones(), fetchProductsCatalog()]);
    syncCatalogMap();
    
    const triggerUIDistribution = () => {
        if (typeof window.distributeProductsToUI === 'function') {
            window.distributeProductsToUI(window.BoseState.catalog);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', triggerUIDistribution);
    } else {
        triggerUIDistribution();
    }

    const uniqueCats = [...new Set(window.BoseState.catalog.map(p => p.category))].filter(Boolean);
    window.BoseState.catMenu = window.BoseState.siteSettings.catMenu?.map(c => c.name || c) || uniqueCats;
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
                const parsedProduct = {
                    id: d.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: data.name || "صنف فاخر",
                    price: parseFloat(data.price) || 0,
                    category: data.category || "عام",
                    img: data.img || data.image || "",
                    description: data.description || data.desc || "",
                    stock: data.stock != null ? data.stock : 1,
                    inStock: data.stock !== 0,
                    ...data 
                };
                list.push(parsedProduct);
            }
        });
        window.BoseState.catalog = list;
        syncCatalogMap(); 
        saveToLocalMemory('bosesweets_catalog', window.BoseState.catalog);
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
        
        const triggerUIDistribution = () => {
            if (typeof window.distributeProductsToUI === 'function') {
                window.distributeProductsToUI(window.BoseState.catalog);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', triggerUIDistribution);
        } else {
            triggerUIDistribution();
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
            initializeSovereignSync();
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
// 🔒 القسم السابع: مستمعي المزامنة الفورية اللحظية (Firebase Real-time Sync)
// ============================================================================

export function initializeSovereignSync() {
    if (!db) return;
    if (window.__BoseSovereignSyncActive) return;
    window.__BoseSovereignSyncActive = true;

    let isCatalogLoaded = false;
    let isThemeLoaded = false;
    let isLogisticsLoaded = false;
    let isPricingLoaded = false;

    function checkEngineStatus() {
        if (isCatalogLoaded && isThemeLoaded && isLogisticsLoaded && isPricingLoaded) {
            window.BoseState.isAppReady = true;
            window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready'));
        }
    }

    onSnapshot(collection(db, 'catalog'), (snap) => {
        const list = [];
        snap.forEach(d => {
            const data = d.data();
            if (data.isActive !== false) {
                const parsedProduct = {
                    id: d.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: data.name || "صنف فاخر",
                    price: parseFloat(data.price) || 0,
                    category: data.category || "عام",
                    img: data.img || data.image || "",
                    description: data.description || data.desc || "",
                    stock: data.stock != null ? data.stock : 1,
                    inStock: data.stock !== 0,
                    ...data 
                };
                list.push(parsedProduct);
            }
        });
        window.BoseState.catalog = list;
        syncCatalogMap();
        window.saveEngineMemory('cat');
        
        if (window.BoseState.cart.length > 0 && typeof window.cartSystem !== 'undefined') {
            window.BoseState.cart = window.BoseState.securityLayer.validateCartPrices(window.BoseState.cart);
            window.cartSystem.saveCartToStorage();
        }
        
        isCatalogLoaded = true;
        checkEngineStatus();
        
        const triggerUIDistribution = () => {
            if (typeof window.distributeProductsToUI === 'function') {
                window.distributeProductsToUI(window.BoseState.catalog);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', triggerUIDistribution);
        } else {
            triggerUIDistribution();
        }
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
    });

    onSnapshot(doc(db, 'settings', 'theme'), (snap) => {
        if (snap.exists()) {
            window.BoseState.theme = snap.data();
            saveToLocalMemory('bosesweets_theme', window.BoseState.theme);
            window.saveEngineMemory('theme');
        }
        isThemeLoaded = true;
        checkEngineStatus();
        window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
    });

    onSnapshot(doc(db, 'settings', 'logistics'), (snap) => {
        if (snap.exists()) {
            window.BoseState.logistics = snap.data();
        }
        isLogisticsLoaded = true;
        checkEngineStatus();
    });

    onSnapshot(doc(db, 'settings', 'pricingRules'), (snap) => {
        if (snap.exists()) {
            window.BoseState.pricingRules = snap.data();
        }
        isPricingLoaded = true;
        checkEngineStatus();
    });

    onSnapshot(doc(db, 'system', 'syncFlag'), (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            const lastUpdate = parseInt(localStorage.getItem('bose_last_local_sync') || '0');
            if (data.lastAdminUpdate > lastUpdate && data.forceRefresh === true) {
                localStorage.setItem('bose_last_local_sync', data.lastAdminUpdate.toString());
                window.dispatchEvent(new CustomEvent('BoseSweets_Catalog_Updated'));
            }
        }
    });
}

if (typeof window !== 'undefined') {
    window.initializeSovereignSync = initializeSovereignSync;
}

// ============================================================================
// 🔒 القسم الثامن: مستمعي الأحداث السيادية لتحديث العرض تلقائياً
// ============================================================================
if (typeof window !== 'undefined') {
    window.addEventListener('BoseSweets_Catalog_Updated', () => {
        const triggerUIDistribution = () => {
            if (typeof window.distributeProductsToUI === 'function') {
                window.distributeProductsToUI(window.BoseState.catalog);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', triggerUIDistribution);
        } else {
            triggerUIDistribution();
        }
    });
}
