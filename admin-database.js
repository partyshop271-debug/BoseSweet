/**
 * ============================================================================
 * 👑 محرك قواعد البيانات السيادي للوحة التحكم | Admin Database Engine (V28.0)
 * ============================================================================
 * الإدارة المرجعية: حلويات بوسي
 * الوظيفة: هذا الملف هو القناة الشرعية والوحيدة المسؤولة عن رفع، تعديل، وحذف 
 * البيانات السحابية (منتجات، إعدادات، طلبات، شحن) من لوحة تحكم الإدارة.
 * تم سحب كافة العمليات المتناثرة في النسخ القديمة ودمجها هنا لضمان السيطرة المطلقة.
 */

import coreExports from './core-engine.js';
import { collection, addDoc, getDocs, updateDoc, setDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// استدعاء محرك قاعدة البيانات من النواة المركزية المعتمدة
const db = coreExports.boseConfig.db;

// ============================================================================
// 📦 أولاً: منظومة الكتالوج والمنتجات (Catalog Management)
// ============================================================================

export async function saveNewProduct(productData) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        const docRef = await addDoc(collection(db, "catalog"), {
            ...productData,
            createdAt: new Date().toISOString()
        });
        console.log(`🛡️ BoseSweets Admin: تم إضافة المنتج بنجاح. المعرف السحابي: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'saveNewProduct');
        throw error;
    }
}

export async function updateProductDetails(productId, updatedData) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        const productRef = doc(db, "catalog", String(productId));
        // نستخدم setDoc مع merge لضمان الحفاظ على البيانات القديمة وتحديث الجديدة فقط بأمان
        await setDoc(productRef, updatedData, { merge: true });
        console.log(`🛡️ BoseSweets Admin: تم تحديث بيانات المنتج سيادياً: ${productId}`);
        return true;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'updateProductDetails');
        throw error;
    }
}

export async function executeDeleteProduct(productId) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        await deleteDoc(doc(db, "catalog", String(productId)));
        console.log(`🛡️ BoseSweets Admin: قرار سيادي، تم الحذف القاطع للمنتج: ${productId}`);
        return true;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'executeDeleteProduct');
        throw error;
    }
}

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
            if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'listenToAllProducts');
        });
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'listenToAllProducts (Master)');
        return null;
    }
}

// ============================================================================
// ⚙️ ثانياً: منظومة الإعدادات العامة للموقع (Settings & Config)
// ============================================================================

export async function saveSettingsToCloud(settingsData) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        const settingsRef = doc(db, 'settings', 'main');
        await setDoc(settingsRef, settingsData, { merge: true });
        console.log(`🛡️ BoseSweets Admin: تم اعتماد التكوينات والإعدادات السحابية بنجاح.`);
        return true;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'saveSettingsToCloud');
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
        await setDoc(zoneRef, zoneData, { merge: true });
        console.log(`🛡️ BoseSweets Admin: تم تأمين نطاق التوصيل: ${zoneData.name}`);
        return true;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'saveShippingZoneCloud');
        throw error;
    }
}

export async function deleteShippingZoneCloud(zoneId) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        await deleteDoc(doc(db, 'shipping', String(zoneId)));
        console.log(`🛡️ BoseSweets Admin: تم حذف نطاق التوصيل: ${zoneId}`);
        return true;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'deleteShippingZoneCloud');
        throw error;
    }
}

// ============================================================================
// 🛒 رابعاً: منظومة الطلبات (Orders Management)
// ============================================================================

export async function updateOrderStatusCloud(orderId, newStatus) {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        const orderRef = doc(db, 'orders', String(orderId));
        await setDoc(orderRef, { status: newStatus }, { merge: true });
        console.log(`🛡️ BoseSweets Admin: تم اعتماد قرار تغيير حالة الطلب ${orderId} إلى ${newStatus}`);
        return true;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'updateOrderStatusCloud');
        throw error;
    }
}

export function listenToAdminOrders(callback) {
    try {
        if (!db) return null;
        // جلب الطلبات مرتبة زمنياً (الأحدث أولاً)
        const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const freshOrders = [];
            let hasNewOrder = false;

            snapshot.forEach(document => {
                freshOrders.push({ id: document.id, ...document.data() });
            });

            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') hasNewOrder = true;
            });

            if (callback) callback(freshOrders, hasNewOrder);
        }, error => {
            if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'listenToAdminOrders (Snapshot Error)');
        });
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'listenToAdminOrders (Master)');
        return null;
    }
}

// ============================================================================
// 🔄 خامساً: إشارة التحديث السيادية (Sovereign Sync Broadcast)
// ============================================================================

export async function triggerSovereignSyncCloud(adminId = 'system') {
    try {
        if (!db) throw new Error("قاعدة البيانات السحابية غير متصلة.");
        const syncRef = doc(db, 'system', 'syncFlag');
        const flag = { 
            lastAdminUpdate: Date.now(), 
            adminId: adminId,
            forceRefresh: true 
        };
        await setDoc(syncRef, flag, { merge: true });
        console.log(`🛡️ BoseSweets Admin: تم بث إشارة التحديث السيادية لإجبار جميع أجهزة العملاء على التحديث.`);
        return true;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, null, 'triggerSovereignSyncCloud');
        throw error;
    }
}

// تصدير كافة الدوال لربطها بالمنطق التشغيلي للوحة الإدارة
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
