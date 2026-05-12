/**
 * 👑 BoseSweets UI Master Hub (V22.0 - Modular Architecture)
 * الموزع السيادي لملفات الواجهة - حلويات بوسي
 * هذا الملف يعمل كنقطة تجميع مركزية تضمن قراءة الموقع لجميع الملفات المقسمة
 * دون الحاجة لتعديل أي استدعاءات في ملفات HTML أو النواة.
 */

// 1. استدعاء وتصدير وظائف المحرك الأساسي
export * from './ui-core.js';

// 2. استدعاء وتصدير وظائف العرض والتنقل
export * from './ui-views.js';

// 3. استدعاء وتصدير وظائف بناة المحتوى (مثل مصمم التورتات وتفاصيل المنتج)
export * from './ui-builders.js';

// 4. استدعاء وتصدير وظائف التفاعل (مثل القوائم والمشاركة)
export * from './ui-interactions.js';

/**
 * 5. ربط وظائف سلة المشتريات (Cart Logic Integration)
 * تم توجيه الموزع لاستمداد كافة عمليات السلة وإدارة الطلبات من ملف cart.js
 * لضمان المزامنة الكاملة مع واجهة المستخدم (syncCartUI).
 */
export { 
    syncCartUI, 
    updateCartDisplay, 
    updateTempQtyContext, 
    addWithQtyContext, 
    processBoseSweetsOrder, 
    modQ, 
    commitCakeBuilderToCart, 
    submitOrderFinal, 
    dispatchWhatsAppOrder 
} from './cart.js';

// تأكيد أخير لضمان تسجيل جاهزية الواجهة في الذاكرة المركزية
if (typeof window !== 'undefined') {
    window.BoseUI_Architecture = 'Modular_V22.0_Integrated';
    console.log("👑 حلويات بوسي: تم تحميل معمارية الواجهات المقسمة وربط وظائف السلة بنجاح.");
}
