/**
 * 👑 BoseSweets Cloud Engine - الموتور الرسمي والنهائي (V20.0 - Sovereign Zero-Delay Sync Edition)
 * تم دمج بروتوكول المزامنة العكسية (Reverse Sync Broadcast) لإجبار العملاء على مسح التخزين المؤقت
 * فور حدوث أي تعديل من قبل الإدارة.
 * تم تنظيف هذا الملف من "قواعد الأمان" ليعمل كمحرك تشغيل فقط.
 * ملاحظة للإدارة: مفتاح الـ API مدمج الآن بشكل صحيح وبأحدث معايير الأمان.
 * الترقية الجديدة (V5.1): دمج نظام الطابور الذكي لمعالجة الطلبات المعلقة بالتوازي (Parallel Processing)
 * مع خوارزمية (Exponential Backoff + Jitter) والمزامنة العكسية (Reverse Sync).
 * الترقية (V5.2): ربط المتغيرات الأساسية بجذر المتصفح (Window) لمنع أخطاء النطاق (Scope).
 * الترقية السيادية (V20.0): تحديث معرف القياس وضبط بروتوكول التحقق المباشر من الهوية.
 */

const firebaseConfig = {
  apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
  authDomain: "bosy-sweets.firebaseapp.com",
  projectId: "bosy-sweets",
  storageBucket: "bosy-sweets.firebasestorage.app",
  messagingSenderId: "473615735083",
  appId: "1:473615735083:web:f09c6001c72640b2588d6e",
  measurementId: "G-6S8EXY7Y4P" // 👑 تحديث معرف القياس المعتمد
};

// تهيئة النظام وتفعيل خدمات السحابة لبراند حلويات بوسي
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 👑 التحديث الملكي V5.2: ربط المتغيرات بـ window لضمان عدم فقدان الاتصال في متصفحات الموبايل والكمبيوتر
window.db = firebase.firestore();
window.auth = firebase.auth();
window.firebase = firebase;
const db = window.db;
const auth = window.auth;

/**
 * 🛡️ Engine Upgrade: تفعيل ميزة الأوفلاين (Persistence) 
 * لضمان عمل الموقع بالكامل "أوفلاين" وضمان السرعة الفائقة للعملاء في الفرافرة والكفاح
 * حيث يتم تخزين البيانات محلياً واسترجاعها فوراً حتى بدون إنترنت.
 */
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn("BoseSweets Warning: تعدد التبويبات يمنع وضع الأوفلاين حالياً.");
    } else if (err.code == 'unimplemented') {
        console.warn("BoseSweets Warning: المتصفح الحالي لا يدعم التخزين المحلي.");
    }
});

/**
 * 🛡️ Engine Upgrade: Reverse Sync Engine (Webhook Fallback & Broadcast)
 * محرك المزامنة العكسية لضمان وصول الطلب للإدارة كخط دفاع بديل وقوي جداً
 */
const ReverseSyncEngine = {
    triggerOrderWebhook(orderData) {
        try {
            const webhookUrl = 'https://us-central1-bosy-sweets.cloudfunctions.net/secureReverseSync';
            
            if(orderData && orderData.status === 'pending') {
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source: 'BoseSweets_Engine_Sovereign',
                        type: 'new_order_fallback',
                        orderId: orderData.id,
                        customerName: orderData.name,
                        customerPhone: orderData.phone,
                        area: orderData.area,
                        total: orderData.total,
                        timestamp: orderData.timestamp,
                        itemsCount: orderData.itemsArray ? orderData.itemsArray.length : 0
                    })
                }).catch(e => console.warn('BoseSweets: Reverse Sync non-critical network delay.', e));
                
                console.log(`BoseSweets: Reverse Sync Hook triggered successfully for order #${String(orderData.id).substring(0,6)} 📲`);
            }
        } catch (error) {
            console.warn("BoseSweets: Reverse Sync Engine encountered a background issue.", error);
        }
    },

    broadcastGlobalUpdate() {
        try {
            if (typeof db !== 'undefined') {
                db.collection('system').doc('syncFlag').set({
                    lastAdminUpdate: Date.now(),
                    trigger: 'Sovereign_Admin_Update',
                    version: 'V20.0'
                }, { merge: true }).catch(e => console.warn('BoseSweets Sync Broadcast slightly delayed.'));
                console.log("BoseSweets 👑: Reverse Sync Signal broadcasted to all clients.");
            }
        } catch (error) {
            console.warn("BoseSweets: Failed to broadcast sync signal.", error);
        }
    }
};

/**
 * 🛡️ Engine Upgrade: خزنة العمليات المعلقة (Smart Background Queue)
 * تستخدم IndexedDB لتخزين أي عملية كتابة أو حذف فشلت بسبب انقطاع الإنترنت.
 */
const CloudQueueDB = {
    dbName: 'BoseSweetsCloudQueue',
    storeName: 'Operations',
    version: 1,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(this.storeName)) {
                    database.createObjectStore(this.storeName, { keyPath: 'queueId' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    async enqueue(operation) {
        try {
            const database = await this.init();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.put({ 
                    ...operation, 
                    queueId: 'op_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                    createdAt: Date.now()
                });
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) { console.warn("BoseSweets Queue Enqueue Error:", e); }
    },
    async getAll() {
        try {
            const database = await this.init();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch (e) { return []; }
    },
    async remove(queueId) {
        try {
            const database = await this.init();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.delete(queueId);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) { console.warn("BoseSweets Queue Remove Error:", e); }
    }
};

/**
 * 🛡️ الموتور الأساسي للتعامل الآمن مع السحابة (NetworkEngine) - ترقية V20.0
 * يدعم المعالجة المتوازية (Parallel Processing) والمزامنة اللحظية
 */
const NetworkEngine = {
    async safeWrite(collectionName, docId, data) {
        try {
            // 👑 فلترة برمجية صارمة وفحص الهوية قبل التعديل السيادي
            if (collectionName === 'settings' && docId === 'main') {
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    const authError = "🔒 رفض الأمان: لا يمكن تعديل الإعدادات السيادية بدون توثيق 🛡️";
                    console.error(authError);
                    if (typeof showSystemToast === 'function') {
                        showSystemToast(authError, "error");
                    }
                    throw new Error(authError);
                }
            }

            await db.collection(collectionName).doc(String(docId)).set(data, { merge: true });
            console.log(`BoseSweets: Data synced to [${collectionName}] securely. 👑`);
            
            // تفعيل المزامنة العكسية وإشارات البث
            if(collectionName === 'orders') {
                ReverseSyncEngine.triggerOrderWebhook(data);
            } else if (['settings', 'catalog', 'shipping', 'gallery'].includes(collectionName)) {
                ReverseSyncEngine.broadcastGlobalUpdate();
            }
            
            return true;
        } catch (error) {
            // إذا كان الخطأ أمني (عدم تسجيل دخول)، لا نضع العملية في الطابور
            if (error.message && error.message.includes("🛡️")) {
                return false;
            }

            console.warn(`BoseSweets Network Warning: Network fluctuation detected. Queuing write operation for [${collectionName}] in background... 🔄`);
            await CloudQueueDB.enqueue({ type: 'write', collectionName, docId, data });
            return true; 
        }
    },
    
    async safeDelete(collectionName, docId) {
        try {
            await db.collection(collectionName).doc(String(docId)).delete();
            console.log(`BoseSweets: Data deleted from [${collectionName}] securely. 👑`);
            
            if (['settings', 'catalog', 'shipping', 'gallery'].includes(collectionName)) {
                ReverseSyncEngine.broadcastGlobalUpdate();
            }
            
            return true;
        } catch (error) {
            console.warn(`BoseSweets Network Warning: Network fluctuation detected. Queuing delete operation for [${collectionName}] in background... 🔄`);
            await CloudQueueDB.enqueue({ type: 'delete', collectionName, docId });
            return true;
        }
    },
    
    async processQueue() {
        if (!navigator.onLine) return;
        
        try {
            const queue = await CloudQueueDB.getAll();
            if (queue.length === 0) return;
            
            console.log(`BoseSweets Engine: Processing ${queue.length} background operations in SMART BATCHES... ⚡👑`);
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
                            if(op.collectionName === 'orders') {
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
                console.log(`BoseSweets Engine: Successfully synced ${processedCount} queued operations. ☁️⚡👑`);
            }
        } catch (e) {
            console.error("BoseSweets Queue Processing Error:", e);
        }
    }
};

// إلحاق المحركات بنطاق window لضمان الوصول الشامل
window.ReverseSyncEngine = ReverseSyncEngine;
window.CloudQueueDB = CloudQueueDB;
window.NetworkEngine = NetworkEngine;

// تفعيل المزامنة التلقائية عند عودة الإنترنت
window.addEventListener('online', () => NetworkEngine.processQueue());
setTimeout(() => NetworkEngine.processQueue(), 5000);

console.log("BoseSweets Cloud Engine V20.0: Sovereign Zero-Delay Sync & Parallel Background Queue Enabled 👑");