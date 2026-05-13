/**
 * 👑 BoseSweets Unified Storage Engine (V21.5 - Sovereign Vault Monitor Edition)
 * مستودع البيانات الموحد - حلويات بوسي
 * تم دمج خزنة العميل مع خزنة الإدارة لضمان رؤية شاملة وتزامن لحظي.
 * تم التطوير والتوسيع بواسطة الإدارة لضمان أعلى أداء، أمان للبيانات، وتوافق تام.
 * 🛡️ التحديث الأمني: تم زراعة مستشعر BoseMonitor لمراقبة نزاهة البيانات واستقرار العمليات.
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
     * تم إضافة حماية ضد تجميد المتصفح (onblocked) وربطها بالمستشعر
     */
    async init() {
        return new Promise((resolve, reject) => {
            try {
                // التأكد من دعم المتصفح قبل البدء لتجنب الأخطاء القاتلة
                if (!window.indexedDB) {
                    const supportError = new Error("IndexedDB not supported in this environment");
                    if(window.BoseMonitor) window.BoseMonitor.report(supportError, 'storage.js', null, null, 'init - Support Check');
                    console.warn("حلويات بوسي: المتصفح لا يدعم IndexedDB، سيتم الاعتماد على التخزين البديل.");
                    return reject(supportError);
                }

                const request = indexedDB.open(this.dbName, this.version);
                
                request.onupgradeneeded = (e) => {
                    try {
                        const db = e.target.result;
                        // إنشاء مخازن البيانات إذا لم تكن موجودة (القرار المهني: لا مساس بالبيانات القديمة)
                        if (!db.objectStoreNames.contains(this.cartStore)) {
                            db.createObjectStore(this.cartStore);
                        }
                        if (!db.objectStoreNames.contains(this.queueStore)) {
                            db.createObjectStore(this.queueStore, { keyPath: 'id' });
                        }
                    } catch (upgradeErr) {
                        if(window.BoseMonitor) window.BoseMonitor.report(upgradeErr, 'storage.js', null, null, 'init - onupgradeneeded');
                    }
                };

                request.onsuccess = () => resolve(request.result);
                
                request.onerror = () => {
                    if(window.BoseMonitor) window.BoseMonitor.report(request.error, 'storage.js', null, null, 'init - request.onerror');
                    console.error("حلويات بوسي: فشل الوصول لقاعدة البيانات المحلية.");
                    reject(request.error);
                };

                // حماية إضافية: في حالة محاولة فتح قاعدة البيانات في تبويبة أخرى وتقاطع العمليات
                request.onblocked = () => {
                    const blockMsg = "Database access blocked by another tab";
                    if(window.BoseMonitor) window.BoseMonitor.report(blockMsg, 'storage.js', null, null, 'init - onblocked');
                    console.warn("حلويات بوسي: قاعدة البيانات قيد الاستخدام في تبويبة أخرى، يرجى إغلاقها لتحديث النظام.");
                };
            } catch (masterErr) {
                if(window.BoseMonitor) window.BoseMonitor.report(masterErr, 'storage.js', null, null, 'init - Master Catch');
                reject(masterErr);
            }
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
                try {
                    const tx = db.transaction(this.cartStore, 'readwrite');
                    const store = tx.objectStore(this.cartStore);
                    
                    const putRequest = store.put(value, key);
                    
                    tx.oncomplete = () => {
                        // تحديث النسخة الاحتياطية لضمان الاستمرارية (تأمين إضافي)
                        this._safeLocalStorageSet(`bs_backup_${key}`, value);
                        resolve(true);
                    };
                    
                    tx.onerror = () => {
                        if(window.BoseMonitor) window.BoseMonitor.report(tx.error, 'storage.js', null, null, `set - tx.onerror [Key: ${key}]`);
                        reject(tx.error);
                    };

                    tx.onabort = () => {
                        const abortErr = new Error("Transaction aborted");
                        if(window.BoseMonitor) window.BoseMonitor.report(abortErr, 'storage.js', null, null, `set - tx.onabort [Key: ${key}]`);
                        reject(abortErr);
                    };
                } catch (txErr) {
                    if(window.BoseMonitor) window.BoseMonitor.report(txErr, 'storage.js', null, null, `set - Transaction Creation [Key: ${key}]`);
                    reject(txErr);
                }
            });
        } catch (e) {
            // حل بديل احترافي في حالة فشل المتصفح أو عدم دعم IndexedDB
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'storage.js', null, null, `set - Fallback Triggered [Key: ${key}]`);
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
                try {
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
                        if(window.BoseMonitor) window.BoseMonitor.report(request.error, 'storage.js', null, null, `get - request.onerror [Key: ${key}]`);
                        resolve(this._getFromFallbacks(key));
                    };
                } catch (txErr) {
                    if(window.BoseMonitor) window.BoseMonitor.report(txErr, 'storage.js', null, null, `get - Transaction Creation [Key: ${key}]`);
                    resolve(this._getFromFallbacks(key));
                }
            });
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'storage.js', null, null, `get - Master Catch [Key: ${key}]`);
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
                try {
                    const tx = db.transaction(this.cartStore, 'readwrite');
                    const store = tx.objectStore(this.cartStore);
                    store.delete(key);
                    
                    tx.oncomplete = () => {
                        this._clearFallbacks(key);
                        resolve(true);
                    };
                    
                    tx.onerror = () => {
                        if(window.BoseMonitor) window.BoseMonitor.report(tx.error, 'storage.js', null, null, `remove - tx.onerror [Key: ${key}]`);
                        reject(tx.error);
                    };
                } catch (txErr) {
                    if(window.BoseMonitor) window.BoseMonitor.report(txErr, 'storage.js', null, null, `remove - Transaction Creation [Key: ${key}]`);
                    reject(txErr);
                }
            });
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'storage.js', null, null, `remove - Master Catch [Key: ${key}]`);
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
                try {
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
                    tx.onerror = () => {
                        if(window.BoseMonitor) window.BoseMonitor.report(tx.error, 'storage.js', null, null, 'enqueueOperation - tx.onerror');
                        reject(tx.error);
                    };
                } catch (txErr) {
                    if(window.BoseMonitor) window.BoseMonitor.report(txErr, 'storage.js', null, null, 'enqueueOperation - Transaction Creation');
                    reject(txErr);
                }
            });
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'storage.js', null, null, 'enqueueOperation - Emergency Fallback Active');
            console.error("فشل أرشفة العملية في حلويات بوسي:", e);
            // حفظ احتياطي في localStorage في أسوأ الظروف
            const emergencyId = `bs_queue_emergency_${Date.now()}`;
            this._safeLocalStorageSet(emergencyId, operationPayload);
            return emergencyId;
        }
    },

    /**
     * توافقية خلفية (Backward Compatibility): 
     * الإبقاء على اسم الدالة القديم حتى لا تتعطل أي ملفات أخرى تستدعيها
     */
    async queueOrder(orderData) {
        try {
            return await this.enqueueOperation(orderData);
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'storage.js', null, null, 'queueOrder (Legacy Wrapper)');
            return null;
        }
    },

    /**
     * استرجاع كافة العمليات المعلقة لمعالجتها
     * شاملة المعالجة من الـ IndexedDB والبحث عن أي طوارئ في الـ localStorage
     */
    async getQueuedOrders() {
        let results = [];
        try {
            const db = await this.init();
            const dbResults = await new Promise((resolve) => {
                try {
                    const tx = db.transaction(this.queueStore, 'readonly');
                    const store = tx.objectStore(this.queueStore);
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => {
                        if(window.BoseMonitor) window.BoseMonitor.report(request.error, 'storage.js', null, null, 'getQueuedOrders - request.onerror');
                        resolve([]);
                    };
                } catch (txErr) {
                    if(window.BoseMonitor) window.BoseMonitor.report(txErr, 'storage.js', null, null, 'getQueuedOrders - Transaction Creation');
                    resolve([]);
                }
            });
            results = [...dbResults];
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'storage.js', null, null, 'getQueuedOrders - Main Queue Access Failure');
            console.warn("حلويات بوسي: تعذر جلب الطابور الأساسي، جاري فحص الطوارئ.");
        }

        // جلب ملفات الطوارئ من localStorage إن وجدت لضمان عدم ضياع أي أوردر
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('bs_queue_emergency_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data) results.push(data);
                    } catch (err) {
                        if(window.BoseMonitor) window.BoseMonitor.report(err, 'storage.js', null, null, `getQueuedOrders - Parsing Emergency Key: ${key}`);
                    }
                }
            }
        } catch (storageErr) {
            if(window.BoseMonitor) window.BoseMonitor.report(storageErr, 'storage.js', null, null, 'getQueuedOrders - LocalStorage Scanning Failure');
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
                try {
                    const tx = db.transaction(this.queueStore, 'readwrite');
                    const store = tx.objectStore(this.queueStore);
                    store.delete(id);
                    
                    tx.oncomplete = () => {
                        // مسح أي نسخة طوارئ مرتبطة في localStorage إذا كانت الـ id تطابق
                        if (typeof id === 'string' && id.startsWith('bs_queue_emergency_')) {
                            localStorage.removeItem(id);
                        }
                        resolve(true);
                    };
                    
                    tx.onerror = () => {
                        if(window.BoseMonitor) window.BoseMonitor.report(tx.error, 'storage.js', null, null, `removeQueuedOrder - tx.onerror [ID: ${id}]`);
                        reject(tx.error);
                    };
                } catch (txErr) {
                    if(window.BoseMonitor) window.BoseMonitor.report(txErr, 'storage.js', null, null, `removeQueuedOrder - Transaction Creation [ID: ${id}]`);
                    reject(txErr);
                }
            });
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'storage.js', null, null, `removeQueuedOrder - Master Catch [ID: ${id}]`);
            console.error("فشل حذف العملية المؤرشفة في حلويات بوسي:", e);
            // محاولة مسحها من localStorage كحل أخير في حال كانت هناك
            localStorage.removeItem(id);
            return false;
        }
    },

    /**
     * دالة مساعدة (Helper): للبحث في كل مسارات النسخ الاحتياطية
     * القرار المهني: لضمان التوافق مع الكود القديم والجديد معاً
     */
    _getFromFallbacks(key) {
        try {
            const alt1 = localStorage.getItem(`boseSweets_fallback_${key}`);
            const alt2 = localStorage.getItem(`bs_alt_${key}`);
            const alt3 = localStorage.getItem(`bs_backup_${key}`);
            
            const fallback = alt1 || alt2 || alt3;
            if (!fallback) return null;
            
            try {
                return JSON.parse(fallback);
            } catch(parseErr) {
                if(window.BoseMonitor) window.BoseMonitor.report(parseErr, 'storage.js', null, null, `_getFromFallbacks - JSON Parse Failure [Key: ${key}]`);
                return null;
            }
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'storage.js', null, null, `_getFromFallbacks - Access Failure [Key: ${key}]`);
            return null;
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
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'storage.js', null, null, `_safeLocalStorageSet - Quota Exceeded or Access Failure [Key: ${key}]`);
            console.error("حلويات بوسي: امتلاء مساحة التخزين المحلية للمتصفح.");
            return false;
        }
    },

    /**
     * دالة مساعدة (Helper): لمسح كافة المسارات الاحتياطية لعنصر معين
     */
    _clearFallbacks(key) {
        try {
            localStorage.removeItem(`boseSweets_fallback_${key}`);
            localStorage.removeItem(`bs_alt_${key}`);
            localStorage.removeItem(`bs_backup_${key}`);
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'storage.js', null, null, `_clearFallbacks - [Key: ${key}]`);
        }
    }
};

/**
 * 👑 الربط السيادي (Global Binding Protocol)
 * جعل المحرك متاحاً على نطاق النافذة لضمان وصول لوحة الإدارة والسكربتات الخارجية
 */
if (typeof window !== 'undefined') {
    try {
        window.ClientStorageEngine = window.ClientStorageEngine || ClientStorageEngine;
        // إشعار المستشعر بجاهزية محرك التخزين الموحد
        console.log("👑 BoseSweets Engine: Sovereign Storage Vault initialized.");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'storage.js', null, null, 'Global Binding Failure');
    }
}