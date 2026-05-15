/**
 * ============================================================================
 * 👑 BoseSweets Cloud Engine - الموتور الرسمي والنهائي (V28.0 - Sovereign Modular Edition)
 * ============================================================================
 * الإدارة المرجعية: حلويات بوسي
 * التحديث التقني: الترقية الشاملة لمعمارية (Modular V10) مع دمج خوارزميات إحصاء الدفعات من النسخة القديمة لإنهاء تضارب السحابة وضمان التزامن اللحظي.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, enableMultiTabIndexedDbPersistence, doc, setDoc, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

export const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e",
    measurementId: "G-6S8EXY7Y4P" 
};

// 🛡️ التهيئة الآمنة المطلقة للنظام السحابي (Modular Architecture)
let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // تثبيت المراجع في النطاق العام للتوافق مع باقي المحركات وتطبيقات الموبايل
    if (typeof window !== 'undefined') {
        window.firebaseApp = app;
        window.db = db;
        window.auth = auth;
    }
    
    console.log("🔒 قرار إداري أمني: تم تهيئة محرك قاعدة البيانات السحابية (V10) لعلامة حلويات بوسي بنجاح.");
} catch (error) {
    if(window.BoseMonitor) window.BoseMonitor.report(error, 'firebase-config.js', null, null, 'initializeBoseSweetsEngine');
    console.error("🔒 قرار إداري أمني: فشل تهيئة السحابة، يرجى مراجعة الخوادم فوراً.", error);
}

export { app, db, auth };

/**
 * 🛡️ الذاكرة الفولاذية السحابية (Offline Persistence V10)
 */
if (db) {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
        if(window.BoseMonitor) window.BoseMonitor.report(err, 'firebase-config.js', null, null, 'enableMultiTabIndexedDbPersistence');
        if (err.code === 'failed-precondition') {
            console.warn("تنويه هندسي: تعدد التبويبات يمنع وضع الأوفلاين المزدوج، سيتم تفعيله للتبويب الرئيسي فقط.");
        } else if (err.code === 'unimplemented') {
            console.warn("تنويه هندسي: المتصفح الحالي لا يدعم التخزين المحلي الكامل.");
        }
    });
}

/**
 * 🛡️ محرك المزامنة العكسية (Reverse Sync Engine & Webhook Fallback)
 */
export const ReverseSyncEngine = {
    triggerOrderWebhook(orderData) {
        try {
            const webhookUrl = 'https://us-central1-bosy-sweets.cloudfunctions.net/secureReverseSync';
            
            if (orderData && orderData.status === 'pending') {
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source: 'BoseSweets_Engine_Sovereign_V28',
                        type: 'new_order_fallback',
                        orderId: orderData.id,
                        customerName: orderData.customerName || orderData.name,
                        customerPhone: orderData.customerPhone || orderData.phone,
                        area: orderData.deliveryMode || orderData.area || 'غير محدد',
                        total: orderData.total,
                        timestamp: orderData.timestamp,
                        itemsCount: orderData.itemsArray ? orderData.itemsArray.length : 0
                    })
                }).then(response => {
                    if (!response.ok) throw new Error("Webhook Server Error");
                    console.log(`BoseSweets 👑: مسار الخطاف العكسي للطلب #${String(orderData.id).substring(0,6)} تم بنجاح.`);
                }).catch(e => {
                    if(window.BoseMonitor) window.BoseMonitor.report(e, 'firebase-config.js', null, null, 'ReverseSyncEngine.triggerOrderWebhook (Fetch)');
                    console.warn('تنويه هندسي: تم تأمين العملية عبر المسار البديل لحين استقرار الشبكة.', e.message);
                });
            }
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'firebase-config.js', null, null, 'ReverseSyncEngine.triggerOrderWebhook (Master)');
            console.warn("BoseSweets 👑: واجه محرك المزامنة العكسية عائقاً خلفياً وتم تجاوزه.", error);
        }
    },

    async broadcastGlobalUpdate() {
        try {
            if (db) {
                const syncDocRef = doc(db, 'system', 'syncFlag');
                await setDoc(syncDocRef, {
                    lastAdminUpdate: Date.now(),
                    trigger: 'Sovereign_Admin_Update',
                    version: 'V28.0',
                    forceRefresh: true 
                }, { merge: true });
                console.log("BoseSweets 👑: إشارة المزامنة الشاملة تم بثها بنجاح لكافة العملاء.");
            }
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'firebase-config.js', null, null, 'ReverseSyncEngine.broadcastGlobalUpdate (Master)');
            console.warn("BoseSweets 👑: فشل مؤقت في بث إشارة المزامنة الشاملة.", error);
        }
    }
};

/**
 * 🛡️ الطابور الذكي والخزنة المنيعة (CloudQueueDB)
 */
export const CloudQueueDB = {
    dbName: 'BoseSweetsCloudQueue',
    storeName: 'Operations',
    version: 4, 
    
    isSupported() {
        return typeof window !== 'undefined' && window.indexedDB != null;
    },

    getFallbackQueue() {
        try {
            return JSON.parse(localStorage.getItem('BoseSweets_Emergency_Queue') || '[]');
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'firebase-config.js', null, null, 'CloudQueueDB.getFallbackQueue');
            return [];
        }
    },

    setFallbackQueue(queue) {
        try {
            localStorage.setItem('BoseSweets_Emergency_Queue', JSON.stringify(queue));
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'firebase-config.js', null, null, 'CloudQueueDB.setFallbackQueue');
        }
    },

    init() {
        return new Promise((resolve) => {
            if (!this.isSupported()) return resolve(null);
            try {
                const request = indexedDB.open(this.dbName, this.version);
                request.onupgradeneeded = (e) => {
                    const database = e.target.result;
                    if (!database.objectStoreNames.contains(this.storeName)) {
                        database.createObjectStore(this.storeName, { keyPath: 'queueId' });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            } catch (error) {
                if(window.BoseMonitor) window.BoseMonitor.report(error, 'firebase-config.js', null, null, 'CloudQueueDB.init');
                resolve(null);
            }
        });
    },

    async enqueue(operation) {
        try {
            const database = await this.init();
            if (!database) {
                let fallbackQ = this.getFallbackQueue();
                fallbackQ.push({ ...operation, queueId: 'op_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5), createdAt: Date.now() });
                this.setFallbackQueue(fallbackQ);
                return true;
            }

            return new Promise((resolve) => {
                const tx = database.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.put({ 
                    ...operation, 
                    queueId: 'op_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                    createdAt: Date.now()
                });
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
        } catch (e) { 
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'firebase-config.js', null, null, 'CloudQueueDB.enqueue');
            return false;
        }
    },

    async getAll() {
        try {
            let results = [];
            const fallbackQ = this.getFallbackQueue();
            if (fallbackQ.length > 0) results = [...fallbackQ];

            const database = await this.init();
            if (!database) return results;

            return new Promise((resolve) => {
                const tx = database.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve([...results, ...(request.result || [])]);
                request.onerror = () => resolve(results); 
            });
        } catch (e) { 
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'firebase-config.js', null, null, 'CloudQueueDB.getAll');
            return []; 
        }
    },

    async remove(queueId) {
        try {
            let fallbackQ = this.getFallbackQueue();
            const initialLength = fallbackQ.length;
            fallbackQ = fallbackQ.filter(op => op.queueId !== queueId);
            if (fallbackQ.length !== initialLength) this.setFallbackQueue(fallbackQ);

            const database = await this.init();
            if (!database) return false;

            return new Promise((resolve) => {
                const tx = database.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.delete(queueId);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
        } catch (e) { 
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'firebase-config.js', null, null, 'CloudQueueDB.remove');
            return false;
        }
    }
};

/**
 * 🛡️ محرك العمليات السحابية والشبكة (NetworkEngine V28.0)
 */
export const NetworkEngine = {
    async safeWrite(collectionName, docId, data) {
        try {
            if (collectionName === 'settings' && docId === 'main') {
                if (!auth || !auth.currentUser) {
                    const authError = "🔒 قرار أمني: تعديل الإعدادات السيادية لعلامة حلويات بوسي يتطلب توثيق الإدارة المرجعية.";
                    console.error(authError);
                    if (typeof window.showSystemToast === 'function') window.showSystemToast(authError, "error");
                    throw new Error(authError);
                }
            }

            if (!db) throw new Error("Database not ready.");

            // معمارية V10 في كتابة البيانات والمزامنة
            const docRef = doc(db, collectionName, String(docId));
            await setDoc(docRef, data, { merge: true });
            console.log(`BoseSweets 👑: تمت المزامنة بأمان في [${collectionName}].`);
            
            if (collectionName === 'orders') {
                ReverseSyncEngine.triggerOrderWebhook(data);
            } else if (['settings', 'catalog', 'shipping', 'gallery'].includes(collectionName)) {
                ReverseSyncEngine.broadcastGlobalUpdate();
            }
            
            return true;
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'firebase-config.js', null, null, `NetworkEngine.safeWrite (${collectionName})`);
            if (error.message && error.message.includes("أمني")) return false;

            console.warn(`تنويه هندسي: تم تحويل عملية [${collectionName}] للطابور الخلفي بسبب تذبذب الشبكة.`);
            await CloudQueueDB.enqueue({ type: 'write', collectionName, docId, data });
            return true; 
        }
    },
    
    async safeDelete(collectionName, docId) {
        try {
            if (!db) throw new Error("Database not ready.");

            // معمارية V10 في حذف البيانات
            const docRef = doc(db, collectionName, String(docId));
            await deleteDoc(docRef);
            console.log(`BoseSweets 👑: تم الحذف السحابي من [${collectionName}] بنجاح.`);
            
            if (['settings', 'catalog', 'shipping', 'gallery'].includes(collectionName)) {
                ReverseSyncEngine.broadcastGlobalUpdate();
            }
            
            return true;
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'firebase-config.js', null, null, `NetworkEngine.safeDelete (${collectionName})`);
            console.warn(`تنويه هندسي: تم تحويل أمر الحذف في [${collectionName}] للطابور الخلفي.`);
            await CloudQueueDB.enqueue({ type: 'delete', collectionName, docId });
            return true;
        }
    },
    
    async processQueue() {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        if (!db) return;
        
        try {
            const queue = await CloudQueueDB.getAll();
            if (queue.length === 0) return;
            
            console.log(`BoseSweets Engine 👑: معالجة ${queue.length} عملية معلقة بتقنية الدفعات الذكية... ⚡`);
            const baseDelay = 1500; 
            let processedCount = 0;
            
            const processSingleOperation = async (op) => {
                let retries = 0;
                const maxRetries = 5; 
                let success = false;

                while (retries < maxRetries && !success) {
                    if (!navigator.onLine) break;
                    try {
                        if (op.type === 'write') {
                            const docRef = doc(db, op.collectionName, String(op.docId));
                            await setDoc(docRef, op.data, { merge: true });
                            if (op.collectionName === 'orders') {
                                ReverseSyncEngine.triggerOrderWebhook(op.data);
                            } else if (['settings', 'catalog', 'shipping', 'gallery'].includes(op.collectionName)) {
                                ReverseSyncEngine.broadcastGlobalUpdate();
                            }
                        } else if (op.type === 'delete') {
                            const docRef = doc(db, op.collectionName, String(op.docId));
                            await deleteDoc(docRef);
                            if (['settings', 'catalog', 'shipping', 'gallery'].includes(op.collectionName)) {
                                ReverseSyncEngine.broadcastGlobalUpdate();
                            }
                        }
                        await CloudQueueDB.remove(op.queueId);
                        success = true;
                        return true; 
                    } catch (e) {
                        if(window.BoseMonitor && retries === maxRetries - 1) window.BoseMonitor.report(e, 'firebase-config.js', null, null, `NetworkEngine.processQueue (Retry Failed: ${op.collectionName})`);
                        retries++;
                        if (retries < maxRetries) {
                            const jitter = Math.random() * 1000;
                            const backoffTime = (baseDelay * Math.pow(2, retries)) + jitter;
                            await new Promise(res => setTimeout(res, backoffTime));
                        }
                    }
                }
                return false; 
            };

            const batchSize = 5; 
            for (let i = 0; i < queue.length; i += batchSize) {
                if (!navigator.onLine) break;
                const currentBatch = queue.slice(i, i + batchSize);
                const batchResults = await Promise.all(currentBatch.map(op => processSingleOperation(op)));
                processedCount += batchResults.filter(result => result === true).length;
                
                if (i + batchSize < queue.length) await new Promise(res => setTimeout(res, Math.random() * 500 + 500));
            }

            if (processedCount > 0) {
                console.log(`BoseSweets Engine 👑: تمت مزامنة ${processedCount} عملية خلفية بامتياز.`);
            }

        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'firebase-config.js', null, null, 'NetworkEngine.processQueue (Master)');
        }
    }
};

// تثبيت المحركات جذرياً بنطاق المتصفح لضمان التوافقية الشاملة مع تطبيقات الموبايل
if (typeof window !== 'undefined') {
    window.ReverseSyncEngine = ReverseSyncEngine;
    window.CloudQueueDB = CloudQueueDB;
    window.NetworkEngine = NetworkEngine;
    window.addEventListener('online', () => NetworkEngine.processQueue());
    setTimeout(() => NetworkEngine.processQueue(), 5000);
}

console.log("👑 محرك حلويات بوسي السحابي V28.0 (Sovereign Modular Edition): الجاهزية القصوى والارتباط التام مُفعلان.");
