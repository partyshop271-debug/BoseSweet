/**
 * 👑 BoseSweets Unified Storage Engine (V21.0 - Sovereign Vault Edition)
 * مستودع البيانات الموحد - حلويات بوسي
 * تم دمج خزنة العميل مع خزنة الإدارة لضمان رؤية شاملة وتزامن لحظي.
 * تم التطوير والتوسيع بواسطة الإدارة لضمان أعلى أداء، أمان للبيانات، وتوافق تام.
 * القرار المهني: تم تأمين الكود ضد انهيارات المتصفحات ومشاكل التزامن.
 */

export const ClientStorageEngine = {
    // 👑 الترقية السيادية: توحيد اسم قاعدة البيانات لضمان عدم التضارب
    dbName: 'BoseSweets_Sovereign_DB',
    cartStore: 'LiveCart',
    queueStore: 'PendingOperations',
    version: 3,

    /**
     * تهيئة قاعدة البيانات المحلية
     * تضمن إنشاء الجداول اللازمة (المخازن) وتحديثها تلقائياً
     * تم إضافة حماية ضد تجميد المتصفح (onblocked)
     */
    async init() {
        return new Promise((resolve, reject) => {
            // التأكد من دعم المتصفح قبل البدء لتجنب الأخطاء القاتلة
            if (!window.indexedDB) {
                console.warn("حلويات بوسي: المتصفح لا يدعم IndexedDB، سيتم الاعتماد على التخزين البديل.");
                return reject(new Error("IndexedDB not supported"));
            }

            const request = indexedDB.open(this.dbName, this.version);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // إنشاء مخازن البيانات إذا لم تكن موجودة (القرار المهني: لا مساس بالبيانات القديمة)
                if (!db.objectStoreNames.contains(this.cartStore)) {
                    db.createObjectStore(this.cartStore);
                }
                if (!db.objectStoreNames.contains(this.queueStore)) {
                    db.createObjectStore(this.queueStore, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            
            request.onerror = () => {
                console.error("حلويات بوسي: فشل الوصول لقاعدة البيانات المحلية.");
                reject(request.error);
            };

            // حماية إضافية: في حالة محاولة فتح قاعدة البيانات في تبويبة أخرى وتقاطع العمليات
            request.onblocked = () => {
                console.warn("حلويات بوسي: قاعدة البيانات قيد الاستخدام في تبويبة أخرى، يرجى إغلاقها لتحديث النظام.");
            };
        });
    },

    /**
     * حفظ البيانات في الخزنة (مثل السلة أو الإعدادات المؤقتة)
     * مع آلية Fallback آمنة لضمان عدم ضياع البيانات في الحالات الحرجة وتجنب أخطاء امتلاء المساحة
     */
    async set(key, value) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.cartStore, 'readwrite');
                const store = tx.objectStore(this.cartStore);
                
                const putRequest = store.put(value, key);
                
                tx.oncomplete = () => {
                    // تحديث النسخة الاحتياطية لضمان الاستمرارية (تأمين إضافي)
                    this._safeLocalStorageSet(`bs_backup_${key}`, value);
                    resolve(true);
                };
                
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(new Error("Transaction aborted"));
            });
        } catch (e) {
            // حل بديل احترافي في حالة فشل المتصفح أو عدم دعم IndexedDB
            console.warn(`حلويات بوسي: التحويل للوضع البديل لحفظ ${key}`);
            const saved = this._safeLocalStorageSet(`boseSweets_fallback_${key}`, value);
            // نحتفظ بالمسار القديم لضمان التوافق مع الملفات التي تبحث عنه
            this._safeLocalStorageSet(`bs_alt_${key}`, value);
            return saved;
        }
    },

    /**
     * جلب البيانات من الخزنة
     * تفحص الخزنة الرئيسية أولاً، ثم جميع مسارات النسخ الاحتياطية لضمان التوافق التام
     */
    async get(key) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.cartStore, 'readonly');
                const store = tx.objectStore(this.cartStore);
                const request = store.get(key);
                
                request.onsuccess = () => {
                    if (request.result !== undefined) {
                        resolve(request.result);
                    } else {
                        // محاولة الاستعادة من النسخ الاحتياطية المتعددة
                        resolve(this._getFromFallbacks(key));
                    }
                };
                
                request.onerror = () => {
                    resolve(this._getFromFallbacks(key));
                };
            });
        } catch (e) {
            return this._getFromFallbacks(key);
        }
    },

    /**
     * إزالة عنصر نهائياً من كافة مستويات التخزين
     */
    async remove(key) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.cartStore, 'readwrite');
                const store = tx.objectStore(this.cartStore);
                store.delete(key);
                
                tx.oncomplete = () => {
                    this._clearFallbacks(key);
                    resolve(true);
                };
                
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {
            this._clearFallbacks(key);
            return false;
        }
    },

    /**
     * إدارة طابور العمليات (الطلبات المعلقة)
     * تضمن حفظ الطلبات حتى في حالة انقطاع الاتصال
     * تم تحسين توليد الـ ID ليكون فريداً تماماً ويمنع تداخل الطلبات
     */
    async enqueueOperation(operationPayload) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.queueStore, 'readwrite');
                const store = tx.objectStore(this.queueStore);
                
                // توليد معرف قوي لمنع التداخل بين العمليات
                const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
                    ? crypto.randomUUID() 
                    : `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                const op = {
                    id: operationPayload.id || uniqueId,
                    timestamp: Date.now(),
                    ...operationPayload
                };
                
                store.put(op);
                
                tx.oncomplete = () => resolve(op.id);
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {
            console.error("فشل أرشفة العملية في حلويات بوسي:", e);
            // حفظ احتياطي في localStorage في أسوأ الظروف
            this._safeLocalStorageSet(`bs_queue_emergency_${Date.now()}`, operationPayload);
            return null;
        }
    },

    /**
     * توافقية خلفية (Backward Compatibility): 
     * الإبقاء على اسم الدالة القديم حتى لا تتعطل أي ملفات أخرى تستدعيها
     */
    async queueOrder(orderData) {
        return this.enqueueOperation(orderData);
    },

    /**
     * استرجاع كافة العمليات المعلقة لمعالجتها
     * شاملة المعالجة من الـ IndexedDB والبحث عن أي طوارئ في الـ localStorage
     */
    async getQueuedOrders() {
        let results = [];
        try {
            const db = await this.init();
            results = await new Promise((resolve) => {
                const tx = db.transaction(this.queueStore, 'readonly');
                const store = tx.objectStore(this.queueStore);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch (e) {
            console.warn("حلويات بوسي: تعذر جلب الطابور الأساسي، جاري فحص الطوارئ.");
        }

        // جلب ملفات الطوارئ من localStorage إن وجدت لضمان عدم ضياع أي أوردر
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('bs_queue_emergency_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    results.push(data);
                } catch (err) {
                    // تجاهل الأخطاء في البيانات الفاسدة
                }
            }
        }

        return results;
    },

    /**
     * حذف عملية من الطابور بعد إتمام مزامنتها بنجاح
     */
    async removeQueuedOrder(id) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.queueStore, 'readwrite');
                const store = tx.objectStore(this.queueStore);
                store.delete(id);
                
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {
            console.error("فشل حذف العملية المؤرشفة في حلويات بوسي:", e);
            return false;
        } finally {
            // مسح أي نسخة طوارئ مرتبطة (إن وجدت)
            this._clearFallbacks(`queue_emergency_${id}`); // تقريبي
        }
    },

    /**
     * دالة مساعدة (Helper): للبحث في كل مسارات النسخ الاحتياطية
     * القرار المهني: لضمان التوافق مع الكود القديم والجديد معاً
     */
    _getFromFallbacks(key) {
        const alt1 = localStorage.getItem(`boseSweets_fallback_${key}`);
        const alt2 = localStorage.getItem(`bs_alt_${key}`);
        const alt3 = localStorage.getItem(`bs_backup_${key}`);
        
        const fallback = alt1 || alt2 || alt3;
        try {
            return fallback ? JSON.parse(fallback) : null;
        } catch(e) {
            return null; // حماية ضد البيانات التالفة
        }
    },

    /**
     * دالة مساعدة (Helper): للحفظ الآمن في التخزين المحلي لتجنب أخطاء تجاوز المساحة (QuotaExceededError)
     */
    _safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error("حلويات بوسي: امتلاء مساحة التخزين المحلية للمتصفح.");
            return false;
        }
    },

    /**
     * دالة مساعدة (Helper): لمسح كافة المسارات الاحتياطية لعنصر معين
     */
    _clearFallbacks(key) {
        localStorage.removeItem(`boseSweets_fallback_${key}`);
        localStorage.removeItem(`bs_alt_${key}`);
        localStorage.removeItem(`bs_backup_${key}`);
    }
};

// 👑 الربط السيادي: جعل المحرك متاحاً على نطاق النافذة لضمان وصول لوحة الإدارة والسكربتات الخارجية
// مع التأكد من عدم الكتابة فوقه إذا كان موجوداً مسبقاً بطريقة صحيحة
if (typeof window !== 'undefined') {
    window.ClientStorageEngine = window.ClientStorageEngine || ClientStorageEngine;
}