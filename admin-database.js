/**
 * ============================================================================
 * 👑 محرك قواعد البيانات السيادي للوحة التحكم | Admin Database Engine (V30.0)
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي (The Management)
 * الوظيفة: القناة الشرعية الوحيدة للتحكم في البيانات السحابية (الكتالوج، الإعدادات، الطلبات).
 * التحديث: تطبيق سجلات التدقيق (Audit Log) وفلتر الأداء للطلبات الملغاة قديماً.
 */

import coreExports from './core-engine.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    setDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// استدعاء محرك قاعدة البيانات من النواة المركزية المعتمدة
const db = coreExports.boseConfig.db;

// ============================================================================
// 📦 أولاً: منظومة الكتالوج والمنتجات (Catalog Management)
// ============================================================================

/**
 * حفظ منتج جديد في السحابة السيادية
 */
export async function saveNewProduct(productData) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        
        const docRef = await addDoc(collection(db, "catalog"), {
            ...productData,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            systemStatus: 'active'
        });
        
        console.log(`🛡️ BoseSweets Admin: تم إدراج المنتج بنجاح. المعرف السيادي: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'saveNewProduct');
        throw error;
    }
}

/**
 * تحديث بيانات منتج (تحديث جزئي آمن مع فرض بروتوكول سجلات التدقيق)
 */
export async function updateProductDetails(productId, updatedData, adminId = 'الإدارة العليا') {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        
        const productRef = doc(db, "catalog", String(productId));
        
        // 👑 بروتوكول سجلات التدقيق (Audit Log Protocol)
        const auditData = {
            ...updatedData,
            lastUpdated: serverTimestamp(),
            lastModifiedBy: adminId,
            lastModifiedTimestamp: Date.now()
        };
        
        // 👑 بروتوكول الحماية: استخدام setDoc مع merge لضمان عدم فقدان الحقول غير المذكورة
        await setDoc(productRef, auditData, { merge: true });
        
        console.log(`🛡️ BoseSweets Admin: تم تحديث البيانات السيادية للمنتج: ${productId} بواسطة ${adminId}`);
        return true;
    } catch (error) {
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'updateProductDetails');
        throw error;
    }
}

/**
 * الحذف القاطع لمنتج من الكتالوج
 */
export async function executeDeleteProduct(productId) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        
        await deleteDoc(doc(db, "catalog", String(productId)));
        console.log(`🛡️ BoseSweets Admin: قرار إداري نهائي، تم حذف المنتج: ${productId}`);
        return true;
    } catch (error) {
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'executeDeleteProduct');
        throw error;
    }
}

/**
 * الاستماع اللحظي لتغيرات الكتالوج
 */
export function listenToAllProducts(callback) {
    try {
        if (!db) return null;
        
        const q = query(collection(db, "catalog"));
        return onSnapshot(q, (querySnapshot) => {
            let products = [];
            querySnapshot.forEach((document) => {
                products.push({ id: document.id, ...document.data() });
            });
            if (callback) callback(products);
        }, (error) => {
            if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'listenToAllProducts (Snapshot)');
        });
    } catch (error) {
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'listenToAllProducts (Master)');
        return null;
    }
}

// ============================================================================
// ⚙️ ثانياً: منظومة الإعدادات العامة للموقع (Settings & Config)
// ============================================================================

/**
 * حفظ الإعدادات المركزية وتكوينات "حلويات بوسي"
 */
export async function saveSettingsToCloud(settingsData) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        
        const settingsRef = doc(db, 'settings', 'main');
        
        // الحفاظ على تكوينات الأقسام أثناء تحديث الإعدادات الأخرى
        await setDoc(settingsRef, {
            ...settingsData,
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log(`🛡️ BoseSweets Admin: تم تأمين الإعدادات السحابية بنجاح.`);
        return true;
    } catch (error) {
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'saveSettingsToCloud');
        throw error;
    }
}

// ============================================================================
// 🚚 ثالثاً: منظومة الشحن والتوصيل (Shipping Zones)
// ============================================================================

export async function saveShippingZoneCloud(zoneData) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        
        const zoneRef = doc(db, 'shipping', String(zoneData.id));
        await setDoc(zoneRef, {
            ...zoneData,
            lastAudit: serverTimestamp()
        }, { merge: true });
        
        console.log(`🛡️ BoseSweets Admin: تم اعتماد نطاق التوصيل: ${zoneData.name}`);
        return true;
    } catch (error) {
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'saveShippingZoneCloud');
        throw error;
    }
}

export async function deleteShippingZoneCloud(zoneId) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        
        await deleteDoc(doc(db, 'shipping', String(zoneId)));
        console.log(`🛡️ BoseSweets Admin: تم إلغاء نطاق التوصيل: ${zoneId}`);
        return true;
    } catch (error) {
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'deleteShippingZoneCloud');
        throw error;
    }
}

// ============================================================================
// 🛒 رابعاً: منظومة الطلبات (Orders Management)
// ============================================================================

/**
 * تحديث حالة الطلب في مسار التجهيز
 */
export async function updateOrderStatusCloud(orderId, newStatus) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        
        const orderRef = doc(db, 'orders', String(orderId));
        
        // تحديث الحالة مع الحفاظ على كافة بيانات العميل والمنتجات المطلوبة
        await setDoc(orderRef, { 
            status: newStatus,
            statusUpdatedAt: serverTimestamp() 
        }, { merge: true });
        
        console.log(`🛡️ BoseSweets Admin: تم تغيير حالة الطلب ${orderId} إلى ${newStatus}`);
        return true;
    } catch (error) {
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'updateOrderStatusCloud');
        throw error;
    }
}

/**
 * الاستماع اللحظي للطلبات الواردة لمركز القيادة مع فلتر الأداء
 */
export function listenToAdminOrders(callback) {
    try {
        if (!db) return null;
        
        const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const freshOrders = [];
            let hasNewOrder = false;
            
            // مرجع زمني لحساب عمر الطلب (7 أيام كحد أقصى للطلبات الملغاة)
            const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
            const currentTime = Date.now();

            snapshot.forEach(document => {
                const orderData = document.data();
                
                // 🛡️ فلتر الأداء البرمجي: استبعاد الطلبات الملغاة التي مر عليها وقت طويل
                const isCancelled = orderData.status === 'cancelled' || orderData.status === 'ملغى' || orderData.status === 'تم الإلغاء';
                const orderAge = currentTime - (orderData.timestamp || 0);
                
                if (isCancelled && orderAge > SEVEN_DAYS_MS) {
                    return; // استبعاد السجل من الذاكرة لتسريع أداء لوحة التحكم على الموبايل
                }
                
                freshOrders.push({ id: document.id, ...orderData });
            });

            snapshot.docChanges().forEach(change => {
                // رصد الطلبات الجديدة فقط لإطلاق التنبيهات الصوتية أو المرئية
                if (change.type === 'added') hasNewOrder = true;
            });

            if (callback) callback(freshOrders, hasNewOrder);
        }, error => {
            if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'listenToAdminOrders (Snapshot)');
        });
    } catch (error) {
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'listenToAdminOrders (Master)');
        return null;
    }
}

// ============================================================================
// 🔄 خامساً: إشارة التحديث السيادية (Sovereign Sync Broadcast)
// ============================================================================

/**
 * بث نبضة التحديث لإجبار كافة واجهات العملاء على المزامنة
 */
export async function triggerSovereignSyncCloud(adminId = 'system') {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        
        const syncRef = doc(db, 'system', 'syncFlag');
        const flag = { 
            lastAdminUpdate: Date.now(), 
            adminId: adminId,
            forceRefresh: true,
            broadcastTime: serverTimestamp()
        };
        
        await setDoc(syncRef, flag, { merge: true });
        console.log(`🛡️ BoseSweets Admin: تم بث إشارة التحديث السيادية لضمان توافق كافة الأجهزة.`);
        return true;
    } catch (error) {
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'triggerSovereignSyncCloud');
        throw error;
    }
}

// تصدير الكيان البرمجي الموحد
export default {
    saveNewProduct,
    updateProductDetails,
    executeDeleteProduct,
    listenToAllProducts,
    saveSettingsToCloud,
    saveShippingZoneCloud,
    deleteShippingZoneCloud,
    updateOrderStatusCloud,
    listenToAdminOrders,
    triggerSovereignSyncCloud
};