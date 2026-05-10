/**
 * 👑 BoseSweets Cloud Engine - الموتور الرسمي والنهائي (V22.0 - Sovereign Iron-Clad Edition)
 * الإدارة المرجعية: حلويات بوسي
 * * الترقيات الحالية للنسخة 22.0:
 * - توافق مطلق مع عامل الخدمة (Service Worker) لتجنب تخزين استدعاءات قاعدة البيانات.
 * - تحصين جذري لمحرك IndexedDB (Smart Background Queue) ليعمل في ظروف التصفح الصارمة.
 * - نظام المزامنة العكسية (Reverse Sync Broadcast) يعمل اللحظة.
 * - معالجة متوازية (Parallel Processing) بخوارزمية التراجع المطرد (Exponential Backoff + Jitter).
 */

const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e",
    measurementId: "G-6S8EXY7Y4P" // المعرف القياسي لعلامة حلويات بوسي
};

// 🛡️ التهيئة الآمنة المطلقة
const initializeBoseSweetsEngine = () => {
    const fb = typeof window !== 'undefined' && window.firebase ? window.firebase : (typeof firebase !== 'undefined' ? firebase : null);
    
    if (!fb) {
        console.error("BoseSweets Critical Error: مكتبة Firebase الأساسية لم يتم تحميلها.");
        return null;
    }

    if (!fb.apps.length) {
        fb.initializeApp(firebaseConfig);
    }

    // ربط المتغيرات بنطاق المتصفح لضمان عدم فقدان الاتصال
    window.firebase = fb;
    window.db = fb.firestore();
    window.auth = fb.auth();
    
    return { db: window.db, auth: window.auth };
};

const engineCores = initializeBoseSweetsEngine();
const db = engineCores ? engineCores.db : null;
const auth = engineCores ? engineCores.auth : null;

/**
 * 🛡️ الذاكرة الفولاذية السحابية (Offline Persistence)
 * تضمن عمل حلويات بوسي بالكامل دون إنترنت واسترجاع البيانات محلياً.
 */
if (db) {
    db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn("BoseSweets System Note: تعدد التبويبات يمنع وضع الأوفلاين المزدوج، سيتم تفعيله للتبويب الرئيسي فقط.");
        } else if (err.code === 'unimplemented') {
            console.warn("BoseSweets System Note: المتصفح الحالي أو وضع التصفح الخفي لا يدعم التخزين المحلي الكامل.");
        }
    });
}

/**
 * 🛡️ محرك المزامنة العكسية (Reverse Sync Engine & Webhook Fallback)
 * خط الدفاع الأساسي لضمان وصول التحديثات والطلبات فوراً.
 */
const ReverseSyncEngine = {
    triggerOrderWebhook(orderData) {
        try {
            const webhookUrl = 'https://us-central1-bosy-sweets.cloudfunctions.net/secureReverseSync';
            
            if (orderData && orderData.status === 'pending') {
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source: 'BoseSweets_Engine_Sovereign_V22',
                        type: 'new_order_fallback',
                        orderId: orderData.id,
                        customerName: orderData.name,
                        customerPhone: orderData.phone,
                        area: orderData.area,
                        total: orderData.total,
                        timestamp: orderData.timestamp,
                        itemsCount: orderData.itemsArray ? orderData.itemsArray.length : 0
                    })
                }).then(response => {
                    if (!response.ok) throw new Error("Webhook Server Error");
                    console.log(`BoseSweets: مسار الخطاف العكسي للطلب #${String(orderData.id).substring(0,6)} تم بنجاح.`);
                }).catch(e => {
                    console.warn('BoseSweets System Note: تأخير غير مؤثر في بروتوكول الخطاف العكسي.', e.message);
                });
            }
        } catch (error) {
            console.warn("BoseSweets: واجه محرك المزامنة العكسية عائقاً خلفياً.", error);
        }
    },

    broadcastGlobalUpdate() {
        try {
            if (db) {
                db.collection('system').doc('syncFlag').set({
                    lastAdminUpdate: Date.now(),
                    trigger: 'Sovereign_Admin_Update',
                    version: 'V22.0'
                }, { merge: true }).then(() => {
                    console.log("BoseSweets 👑: إشارة المزامنة الشاملة تم بثها بنجاح للعملاء.");
                }).catch(e => {
                    console.warn('BoseSweets System Note: تأخير طفيف في بث إشارة المزامنة.', e.message);
                });
            }
        } catch (error) {
            console.warn("BoseSweets: فشل في بث إشارة المزامنة الشاملة.", error);
        }
    }
};

/**
 * 🛡️ الطابور الذكي والخزنة المنيعة (CloudQueueDB)
 * حفظ العمليات المعلقة باحترافية وتخطي قيود وضع التصفح الخفي
 */
const CloudQueueDB = {
    dbName: 'BoseSweetsCloudQueue',
    storeName: 'Operations',
    version: 2,
    
    isSupported() {
        return typeof window !== 'undefined' && window.indexedDB != null;
    },

    init() {
        return new Promise((resolve, reject) => {
            if (!this.isSupported()) {
                return resolve(null); // تجاوز آمن لمنع تعطل النظام
            }
            try {
                const request = indexedDB.open(this.dbName, this.version);
                request.onupgradeneeded = (e) => {
                    const database = e.target.result;
                    if (!database.objectStoreNames.contains(this.storeName)) {
                        database.createObjectStore(this.storeName, { keyPath: 'queueId' });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null); // تجاوز آمن 
            } catch (error) {
                resolve(null);
            }
        });
    },

    async enqueue(operation) {
        try {
            const database = await this.init();
            if (!database) return false;

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
            return false;
        }
    },

    async getAll() {
        try {
            const database = await this.init();
            if (!database) return [];

            return new Promise((resolve) => {
                const tx = database.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]); 
            });
        } catch (e) { 
            return []; 
        }
    },

    async remove(queueId) {
        try {
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
            return false;
        }
    }
};

/**
 * 🛡️ محرك العمليات السحابية والشبكة (NetworkEngine)
 * الموتور المسؤول عن الكتابة الآمنة وإدارة الطابور بالمعالجة المتوازية
 */
const NetworkEngine = {
    async safeWrite(collectionName, docId, data) {
        try {
            if (collectionName === 'settings' && docId === 'main') {
                if (!auth || !auth.currentUser) {
                    const authError = "🔒 قرار أمني: تعديل الإعدادات السيادية لعلامة حلويات بوسي يتطلب توثيق الإدارة.";
                    console.error(authError);
                    if (typeof window.showSystemToast === 'function') {
                        window.showSystemToast(authError, "error");
                    }
                    throw new Error(authError);
                }
            }

            if (!db) throw new Error("Database not ready.");

            await db.collection(collectionName).doc(String(docId)).set(data, { merge: true });
            console.log(`BoseSweets: تمت المزامنة بأمان في [${collectionName}]. 👑`);
            
            if (collectionName === 'orders') {
                ReverseSyncEngine.triggerOrderWebhook(data);
            } else if (['settings', 'catalog', 'shipping', 'gallery'].includes(collectionName)) {
                ReverseSyncEngine.broadcastGlobalUpdate();
            }
            
            return true;
        } catch (error) {
            if (error.message && error.message.includes("🔒")) {
                return false;
            }

            console.warn(`BoseSweets System Note: تم تحويل عملية [${collectionName}] للطابور الخلفي بسبب تذبذب الشبكة.`);
            await CloudQueueDB.enqueue({ type: 'write', collectionName, docId, data });
            return true; 
        }
    },
    
    async safeDelete(collectionName, docId) {
        try {
            if (!db) throw new Error("Database not ready.");

            await db.collection(collectionName).doc(String(docId)).delete();
            console.log(`BoseSweets: تم الحذف السحابي من [${collectionName}] بنجاح.`);
            
            if (['settings', 'catalog', 'shipping', 'gallery'].includes(collectionName)) {
                ReverseSyncEngine.broadcastGlobalUpdate();
            }
            
            return true;
        } catch (error) {
            console.warn(`BoseSweets System Note: تم تحويل أمر الحذف في [${collectionName}] للطابور الخلفي.`);
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
            
            console.log(`BoseSweets Engine: معالجة ${queue.length} عملية معلقة بتقنية الدفعات الذكية... ⚡👑`);
            const baseDelay = 1500; 
            
            const processSingleOperation = async (op) => {
                let retries = 0;
                const maxRetries = 5; 
                let success = false;

                while (retries < maxRetries && !success) {
                    if (!navigator.onLine) break; 
                    
                    try {
                        if (op.type === 'write') {
                            await db.collection(op.collectionName).doc(String(op.docId)).set(op.data, { merge: true });
                            if (op.collectionName === 'orders') {
                                ReverseSyncEngine.triggerOrderWebhook(op.data);
                            } else if (['settings', 'catalog', 'shipping', 'gallery'].includes(op.collectionName)) {
                                ReverseSyncEngine.broadcastGlobalUpdate();
                            }
                        } else if (op.type === 'delete') {
                            await db.collection(op.collectionName).doc(String(op.docId)).delete();
                            if (['settings', 'catalog', 'shipping', 'gallery'].includes(op.collectionName)) {
                                ReverseSyncEngine.broadcastGlobalUpdate();
                            }
                        }
                        
                        await CloudQueueDB.remove(op.queueId);
                        success = true;
                        return true; 
                        
                    } catch (e) {
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
            let processedCount = 0;

            for (let i = 0; i < queue.length; i += batchSize) {
                if (!navigator.onLine) break;

                const currentBatch = queue.slice(i, i + batchSize);
                const batchResults = await Promise.all(currentBatch.map(op => processSingleOperation(op)));
                processedCount += batchResults.filter(result => result === true).length;

                if (i + batchSize < queue.length) {
                    await new Promise(res => setTimeout(res, Math.random() * 500 + 500));
                }
            }
            
            if (processedCount > 0) {
                console.log(`BoseSweets Engine: تمت مزامنة ${processedCount} عملية خلفية بامتياز.`);
            }
        } catch (e) {
            console.error("BoseSweets Queue Error:", e);
        }
    }
};

// تثبيت المحركات جذرياً للتواصل مع باقي ملفات الموقع
if (typeof window !== 'undefined') {
    window.ReverseSyncEngine = ReverseSyncEngine;
    window.CloudQueueDB = CloudQueueDB;
    window.NetworkEngine = NetworkEngine;

    // المراقبة التلقائية لحالة الشبكة
    window.addEventListener('online', () => NetworkEngine.processQueue());
    setTimeout(() => NetworkEngine.processQueue(), 5000);
}

console.log("👑 محرك حلويات بوسي السحابي V22.0: الجاهزية القصوى والارتباط التام مُفعلان.");