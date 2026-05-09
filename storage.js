/**
 * 👑 BoseSweets Unified Storage Engine (V20.0 - Sovereign Vault Edition)
 * مستودع البيانات الموحد - حلويات بوسي
 * تم دمج خزنة العميل مع خزنة الإدارة لضمان رؤية شاملة وتزامن لحظي.
 * تم التطوير بواسطة الإدارة لضمان أعلى أداء وأمان للبيانات.
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
     */
    async init() {
        return new Promise((resolve, reject) => {
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
                console.error("عطل في الخزنة المحلية لحلويات بوسي:");
                reject(request.error);
            };
        });
    },

    /**
     * حفظ البيانات في الخزنة (مثل السلة أو الإعدادات المؤقتة)
     * مع آلية Fallback لضمان عدم ضياع البيانات في الحالات الحرجة
     */
    async set(key, value) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.cartStore, 'readwrite');
                const store = tx.objectStore(this.cartStore);
                store.put(value, key);
                tx.oncomplete = () => {
                    // تحديث النسخة الاحتياطية لضمان الاستمرارية
                    localStorage.setItem(`bs_backup_${key}`, JSON.stringify(value));
                    resolve();
                };
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {
            // حل بديل احترافي في حالة فشل المتصفح في دعم IndexedDB
            localStorage.setItem(`bs_alt_${key}`, JSON.stringify(value));
        }
    },

    /**
     * جلب البيانات من الخزنة
     * تفحص الخزنة الرئيسية أولاً، ثم النسخ الاحتياطية
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
                        // محاولة الاستعادة من النسخ الاحتياطية
                        const backup = localStorage.getItem(`bs_backup_${key}`) || localStorage.getItem(`bs_alt_${key}`);
                        resolve(backup ? JSON.parse(backup) : null);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            const alt = localStorage.getItem(`bs_alt_${key}`) || localStorage.getItem(`bs_backup_${key}`);
            return alt ? JSON.parse(alt) : null;
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
                    localStorage.removeItem(`bs_alt_${key}`);
                    localStorage.removeItem(`bs_backup_${key}`);
                    resolve();
                };
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {
            localStorage.removeItem(`bs_alt_${key}`);
            localStorage.removeItem(`bs_backup_${key}`);
        }
    },

    /**
     * إدارة طابور العمليات (الطلبات المعلقة)
     * تضمن حفظ الطلبات حتى في حالة انقطاع الاتصال
     */
    async queueOrder(orderData) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.queueStore, 'readwrite');
                const store = tx.objectStore(this.queueStore);
                store.put(orderData);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {
            console.error("فشل أرشفة العملية في حلويات بوسي:", e);
        }
    },

    /**
     * استرجاع كافة العمليات المعلقة لمعالجتها
     */
    async getQueuedOrders() {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.queueStore, 'readonly');
                const store = tx.objectStore(this.queueStore);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch (e) {
            return [];
        }
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
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {
            console.error("فشل حذف العملية المؤرشفة:", e);
        }
    }
};

// 👑 الربط السيادي: جعل المحرك متاحاً على نطاق النافذة لضمان وصول لوحة الإدارة والسكربتات الخارجية
if (typeof window !== 'undefined') {
    window.ClientStorageEngine = ClientStorageEngine;
}