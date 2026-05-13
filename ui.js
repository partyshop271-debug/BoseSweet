/**
 * 👑 BoseSweets UI Master Hub (V22.5 - Sovereign Monitor Edition)
 * الموزع السيادي لملفات الواجهة - حلويات بوسي
 * يعمل كنقطة تجميع مركزية تضمن قراءة الموقع لجميع الملفات المقسمة.
 * 🛡️ التحديث الأمني: زراعة مستشعر BoseMonitor لمراقبة نزاهة الربط العالمي وتكامل الواجهات.
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

/**
 * بروتوكول الربط الشامل (Global Sovereign Binding)
 * هذا الجزء هو المسؤول عن جعل كافة الدوال متاحة في نطاق الصفحة (Scope).
 * تم تغليفه بالمستشعر لضمان رصد أي فشل في عملية دمج المكونات.
 */
if (typeof window !== 'undefined') {
    try {
        // دمج كافة الوظائف المستوردة في كائن window لضمان الوصول إليها من أي مكان بالموقع
        Object.assign(window, Core, Views, Builders, Interactions, Cart);
        
        window.BoseUI_Architecture = 'Modular_V22.5_Sovereign_Monitor';
        
        // إشعار المستشعر بنجاح بناء الهيكل وتوافره للإدارة والعملاء
        console.log("👑 حلويات بوسي: تم تفعيل البروتوكول السيادي وربط كافة الوظائف بجذر المتصفح بنجاح.");
        
    } catch (error) {
        // التبليغ الفوري للمستشعر في حال حدوث تصادم برمج أو فشل في الحقن
        if(window.BoseMonitor) {
            window.BoseMonitor.report(error, 'ui.js', null, null, 'Global Binding Failure - Master Hub Injection');
        }
        console.error("BoseSweets Critical Error: فشل ربط وظائف الواجهة السيادية.", error);
    }
}