/**
 * 👑 BoseSweets UI Master Hub (V22.1 - Sovereign Integrated)
 * الموزع السيادي لملفات الواجهة - حلويات بوسي
 * هذا الملف يعمل كنقطة تجميع مركزية تضمن قراءة الموقع لجميع الملفات المقسمة
 * مع تفعيل التحصين البرمجي لضمان التوافق الكامل مع كافة ملفات الموقع.
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

// 🛡️ التحصين السيادي: ربط كافة الدوال بـ window لضمان عمل أزرار HTML المباشرة
import * as Core from './ui-core.js';
import * as Views from './ui-views.js';
import * as Builders from './ui-builders.js';
import * as Interactions from './ui-interactions.js';
import * as Cart from './cart.js';

// تأكيد تسجيل جاهزية الواجهة في الذاكرة المركزية وتفعيل الربط الشامل
if (typeof window !== 'undefined') {
    // دمج كافة الوظائف المستوردة في كائن window لضمان الوصول إليها من أي مكان بالموقع
    Object.assign(window, Core, Views, Builders, Interactions, Cart);
    
    window.BoseUI_Architecture = 'Modular_V22.1_Sovereign';
    console.log("👑 حلويات بوسي: تم تفعيل البروتوكول السيادي وربط كافة الوظائف بجذر المتصفح بنجاح.");
}
