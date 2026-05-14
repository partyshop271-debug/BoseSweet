/**
 * ============================================================================
 * 👑 محرك قواعد البيانات السيادي | Admin Database Engine
 * ============================================================================
 * الإدارة: حلويات بوسي
 * الوظيفة: تنفيذ أوامر الإدارة المباشرة على السحابة (إضافة، تعديل، حذف، واستدعاء).
 */

// استدعاء مفاتيح النواة المركزية
import boseConfig from './core-engine.js';

// استدعاء مكتبات السحابة الرسمية
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// تهيئة الاتصال الآمن بالسحابة
const app = initializeApp(boseConfig.firebase);
const db = getFirestore(app);

/**
 * 1. إضافة منتج جديد إلى الكتالوج
 */
export async function saveNewProduct(productData) {
    try {
        // يتم وضع المنتج في مجموعة المنتجات الرسمية
        const docRef = await addDoc(collection(db, "catalog"), {
            ...productData,
            createdAt: new Date().toISOString()
        });
        console.log(`🛡️ تم إضافة المنتج بنجاح. المعرف السحابي: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, 'saveNewProduct');
        throw error;
    }
}

/**
 * 2. جلب كافة المنتجات لعرضها في لوحة الإدارة
 */
export async function fetchAllProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "catalog"));
        let products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, 'fetchAllProducts');
        return [];
    }
}

/**
 * 3. تعديل منتج قائم (تحديث السعر أو الوصف)
 */
export async function updateProductDetails(productId, updatedData) {
    try {
        const productRef = doc(db, "catalog", productId);
        await updateDoc(productRef, updatedData);
        console.log(`🛡️ تم تحديث بيانات المنتج: ${productId}`);
        return true;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, 'updateProductDetails');
        throw error;
    }
}

/**
 * 4. الحذف القاطع لمنتج من السحابة
 */
export async function executeDeleteProduct(productId) {
    try {
        await deleteDoc(doc(db, "catalog", productId));
        console.log(`🛡️ قرار سيادي: تم الحذف القاطع للمنتج: ${productId}`);
        return true;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-database.js', null, 'executeDeleteProduct');
        throw error;
    }
}