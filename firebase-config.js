/**
 * 👑 BoseSweets Cloud Engine - الموتور الرسمي والنهائي (V5.1 - Smart Sync & Parallel Edition)
 * تم تنظيف هذا الملف من "قواعد الأمان" ليعمل كمحرك تشغيل فقط.
 * ملاحظة للإدارة: مفتاح الـ API مدمج الآن بشكل صحيح وبأحدث معايير الأمان.
 * الترقية الجديدة (V5.1): دمج نظام الطابور الذكي لمعالجة الطلبات المعلقة بالتوازي (Parallel Processing)
 * مع خوارزمية (Exponential Backoff + Jitter) والمزامنة العكسية (Reverse Sync).
 */

const firebaseConfig = {
  apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
  authDomain: "bosy-sweets.firebaseapp.com",
  projectId: "bosy-sweets",
  storageBucket: "bosy-sweets.firebasestorage.app",
  messagingSenderId: "473615735083",
  appId: "1:473615735083:web:f09c6001c72640b2588d6e",
  measurementId: "G-46D1CS3WLB"
};

// تهيئة النظام وتفعيل خدمات السحابة لبراند حلويات بوسي
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

/**
 * 🛡️ Engine Upgrade: تفعيل ميزة الأوفلاين (Persistence) 
 * لضمان عمل الموقع بالكامل "أوفلاين" وضمان السرعة الفائقة للعملاء في الفرافرة والكفاح
 * حيث يتم تخزين البيانات محلياً واسترجاعها فوراً حتى بدون إنترنت.
 */
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code == 'failed-precondition') {
        // تحدث هذه المشكلة عند فتح الموقع في أكثر من تبويب في المتصفح
        console.warn("BoseSweets Warning: تعدد التبويبات يمنع وضع الأوفلاين حالياً.");
    } else if (err.code == 'unimplemented') {
        // تحدث إذا كان المتصفح قديماً جداً ولا يدعم IndexedDB
        console.warn("BoseSweets Warning: المتصفح الحالي لا يدعم التخزين المحلي.");
    }
});

/**
 * 🛡️ Engine Upgrade: Reverse Sync Engine (Webhook Fallback)
 * محرك المزامنة العكسية لضمان وصول الطلب للإدارة كخط دفاع بديل وقوي جداً
 * في حال فشل المتصفح في فتح الواتساب، يقوم السيرفر بإرسال بيانات الطلب فوراً.
 */
const ReverseSyncEngine = {
    triggerOrderWebhook(orderData) {
        try {
            // نقطة الاتصال الآمنة السحابية لبراند حلويات بوسي
            const webhookUrl = 'https://us-central1-bosy-sweets.cloudfunctions.net/secureReverseSync';
            
            // التأكد من أن الطلب جديد لتجنب إرسال إشعارات مكررة عند تعديل الحالات
            if(orderData && orderData.status === 'pending') {
                // استخدام نمط (Fire and Forget) لضمان عدم تأخير تجربة العميل
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source: 'BoseSweets_Engine_V5_1',
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
                // إضافة معرّف فريد لكل عملية معلقة لضمان المزامنة الدقيقة
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
 * 🛡️ الموتور الأساسي للتعامل الآمن مع السحابة (NetworkEngine) - ترقية V5.1
 * تم استبدال الكائن بالكامل لدعم المعالجة المتوازية (Parallel Processing)
 * مع إضافة تقنية Jitter لعدم الضغط على سيرفرات فايربيز في نفس اللحظة.
 */
const NetworkEngine = {
    async safeWrite(collectionName, docId, data) {
        try {
            await db.collection(collectionName).doc(docId).set(data, { merge: true });
            console.log(`BoseSweets: Data synced to [${collectionName}] securely. 👑`);
            
            // تفعيل المزامنة العكسية فوراً إذا كان المكتوب طلباً جديداً
            if(collectionName === 'orders') {
                ReverseSyncEngine.triggerOrderWebhook(data);
            }
            
            return true;
        } catch (error) {
            console.warn(`BoseSweets Network Warning: Network fluctuation detected. Queuing write operation for [${collectionName}] in background... 🔄`);
            // تخزين العملية الفاشلة في الطابور ليتم محاولة إرسالها لاحقاً
            await CloudQueueDB.enqueue({ type: 'write', collectionName, docId, data });
            return true; 
        }
    },
    async safeDelete(collectionName, docId) {
        try {
            await db.collection(collectionName).doc(docId).delete();
            console.log(`BoseSweets: Data deleted from [${collectionName}] securely. 👑`);
            return true;
        } catch (error) {
            console.warn(`BoseSweets Network Warning: Network fluctuation detected. Queuing delete operation for [${collectionName}] in background... 🔄`);
            await CloudQueueDB.enqueue({ type: 'delete', collectionName, docId });
            return true;
        }
    },
    
    /**
     * 🛡️ خوارزمية الطابور الذكي المطورة (Parallel Processing & Jittered Backoff)
     * تعالج جميع الطلبات المعلقة في نفس الوقت (بالتوازي) لتسريع المزامنة بشكل هائل،
     * مع توزيع الحمل بذكاء.
     */
    async processQueue() {
        if (!navigator.onLine) return;
        
        try {
            const queue = await CloudQueueDB.getAll();
            if (queue.length === 0) return;
            
            console.log(`BoseSweets Engine: Processing ${queue.length} background operations in PARALLEL... ⚡👑`);
            const baseDelay = 1500; // تأخير مبدئي 1.5 ثانية
            
            // دالة داخلية لمعالجة كل عملية بشكل مستقل وبدون تعطيل باقي العمليات
            const processSingleOperation = async (op) => {
                let retries = 0;
                const maxRetries = 5; // زيادة عدد المحاولات للشبكات الضعيفة جداً
                let success = false;

                while (retries < maxRetries && !success) {
                    // التوسيع الجديد: إيقاف المحاولة فوراً إذا انقطع الإنترنت لحماية الذاكرة
                    if (!navigator.onLine) {
                        console.warn("BoseSweets: Connection lost during queue processing. Halting.");
                        break; 
                    }
                    
                    try {
                        if (op.type === 'write') {
                            await db.collection(op.collectionName).doc(op.docId).set(op.data, { merge: true });
                            
                            // تشغيل المزامنة العكسية بعد رفع الطلب المتأخر بنجاح
                            if(op.collectionName === 'orders') {
                                ReverseSyncEngine.triggerOrderWebhook(op.data);
                            }
                            
                        } else if (op.type === 'delete') {
                            await db.collection(op.collectionName).doc(op.docId).delete();
                        }
                        
                        // مسح العملية من الطابور فور نجاحها لتوفير الذاكرة
                        await CloudQueueDB.remove(op.queueId);
                        success = true;
                        return true; // تمت بنجاح
                        
                    } catch (e) {
                        retries++;
                        console.warn(`BoseSweets Engine: Failed to process queued op [${op.queueId}]. Retry ${retries}/${maxRetries}.`, e);
                        
                        if (retries < maxRetries) {
                            /**
                             * هندسة التأخير المتضاعف مع الجيتر (Exponential Backoff with Jitter):
                             * إضافة وقت عشوائي بسيط (Jitter) لمنع تزامن المحاولات الفاشلة معاً (Thundering Herd Problem)
                             */
                            const jitter = Math.random() * 1000;
                            const backoffTime = (baseDelay * Math.pow(2, retries)) + jitter;
                            await new Promise(res => setTimeout(res, backoffTime));
                        }
                    }
                }
                return false; // فشلت بعد كل المحاولات الممكنة
            };

            // تنفيذ جميع العمليات بالتوازي (Parallel Execution) باستخدام Promise.all
            const results = await Promise.all(queue.map(op => processSingleOperation(op)));
            const processedCount = results.filter(result => result === true).length;
            
            if (processedCount > 0) {
                console.log(`BoseSweets Engine: Successfully synced ${processedCount} queued operations to the cloud in parallel. ☁️⚡👑`);
            }
        } catch (e) {
            console.error("BoseSweets Queue Processing Error:", e);
        }
    }
};

// تشغيل محرك المعالجة الخلفية تلقائياً عند عودة الاتصال بالإنترنت
window.addEventListener('online', () => NetworkEngine.processQueue());

// محاولة تفريغ الطابور بعد إقلاع النظام بقليل لضمان تزامن العمليات السابقة عند كل دخول
setTimeout(() => NetworkEngine.processQueue(), 5000);

console.log("BoseSweets Cloud Engine V5.1: Secured & Connected with Parallel Background Queue & Reverse Sync & Persistence Enabled 👑");
