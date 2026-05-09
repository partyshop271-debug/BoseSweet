// إدارة الحالة الديناميكية والمزامنة السيادية - براند حلويات بوسي
import { defaultSettings, defaultShipping } from './config.js';

// 👑 الترقية السيادية: توحيد مسار الذاكرة بين الإدارة والعميل (Global Context Bridge)
export let siteSettings = (typeof window !== 'undefined' && window.siteSettings) || { ...defaultSettings };
export let shippingZones = (typeof window !== 'undefined' && window.shippingZones) || [ ...defaultShipping ];
export let catalog = (typeof window !== 'undefined' && window.catalog) || []; 
export let galleryData = (typeof window !== 'undefined' && window.galleryData) || []; 
export let catMenu = (typeof window !== 'undefined' && window.catMenu) || [];
export let isAppReady = false; 

// ربط المتغيرات بجذر المتصفح لضمان رؤية لوحة التحكم لها
if (typeof window !== 'undefined') {
    window.siteSettings = siteSettings;
    window.shippingZones = shippingZones;
    window.catalog = catalog;
    window.galleryData = galleryData;
    window.catMenu = catMenu;
}

export let state = { 
    activeCat: 'الرئيسية', 
    dSize: 'مثلث', 
    fType: 'ورد طبيعي', 
    cart: [], 
    currentShippingFee: 0, 
    cakeBuilder: { 
        flv: 'فانيليا', 
        ps: 4, 
        sh: 'دائري', 
        trd: false, 
        img: 'بدون', 
        msg: '', 
        alg: '', 
        occ: '', 
        refImgUrl: '', 
        hasRefImg: false, 
        crd: false, 
        dlg: false 
    } 
};

if (typeof window !== 'undefined') {
    window.state = state;
}

// هندسة الحالة المخصصة للمعالج متعدد الخطوات (تورت حلويات بوسي الملكية)
export let currentBuilderStep = 1;
export let cakeState = { 
    flavor: 'فانيليا', 
    shape: 'دائري', 
    persons: 4, 
    printing: 'بدون', 
    notes: '', 
    refImage: null, 
    allergies: '', 
    hasCard: false, 
    cardText: '', 
    occasion: '', 
    designStyle: 'تصميم محدد' 
};
export let catalogMap = new Map();

if (typeof window !== 'undefined') {
    window.cakeState = cakeState;
}

/**
 * مزامنة خارطة المنتجات لضمان سرعة الوصول للبيانات عن طريق المعرف (ID)
 */
export function syncCatalogMap() { 
    catalogMap.clear(); 
    if(Array.isArray(catalog)) {
        catalog.forEach(p => { 
            if(p) catalogMap.set(String(p.id), p); 
        }); 
    }
}

if (typeof window !== 'undefined') {
    window.syncCatalogMap = syncCatalogMap;
}

/**
 * تعيين حالة جاهزية التطبيق للاستخدام
 */
export function setAppReady() { 
    isAppReady = true; 
    if (typeof window !== 'undefined') {
        window.isAppReady = true;
    }
}

if (typeof window !== 'undefined') {
    window.setAppReady = setAppReady;
}

// ============================================================================
// هندسة التخزين والاستدعاء المركزي (Persistent Storage Engine)
// ============================================================================

export function saveToLocalMemory(key, data) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(key, JSON.stringify(data));
        }
    } catch (error) {
        console.warn('تنويه نظام حلويات بوسي: فشل حفظ النسخة الاحتياطية محلياً.', error);
    }
}

export function getFromLocalMemory(key) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedData = localStorage.getItem(key);
            return storedData ? JSON.parse(storedData) : null;
        }
    } catch (error) {
        console.warn('تنويه نظام حلويات بوسي: تعذر قراءة النسخة الاحتياطية المحلية.', error);
    }
    return null;
}

/**
 * 👑 محرك الاستدعاء المركزي: يضمن سحب البيانات من السحابة وتحديث الذاكرة الحية فوراً
 * تم تحسينه ليدعم تجاوز الكاش في وضع الإدارة وتقليل مدة التخزين لضمان التحديثات.
 */
export const fetchAndSyncBoseSweetsData = async (fetchPromise, cacheKey = 'boseSweets_catalog') => {
    try {
        const timeKey = `${cacheKey}_timestamp`;
        const cacheDuration = 12 * 60 * 60 * 1000; // 👑 تقليل المدة لـ 12 ساعة لضمان تحديث أسرع للبيانات
        
        const localData = getFromLocalMemory(cacheKey);
        const cacheTime = localStorage.getItem(timeKey);
        const currentTime = Date.now();
        
        // التحقق من صلاحية الكاش مع إمكانية التجاوز إذا كان المستخدم في لوحة الإدارة
        const isAdminPath = typeof window !== 'undefined' && window.location.pathname.includes('admin');
        
        if (!isAdminPath && localData && Array.isArray(localData) && localData.length > 0 && cacheTime && (currentTime - Number(cacheTime) < cacheDuration)) {
            catalog.length = 0;
            localData.forEach(item => catalog.push(item));
            syncCatalogMap();
            return true;
        }

        const data = await fetchPromise(); 
        
        if (data && Array.isArray(data)) {
            catalog.length = 0;
            data.forEach(item => catalog.push(item));
            
            // تحديث الذاكرة المحلية لضمان الاستمرارية
            saveToLocalMemory(cacheKey, catalog); 
            if (typeof window !== 'undefined') {
                localStorage.setItem(timeKey, currentTime.toString()); 
            }
            syncCatalogMap();
            return true; 
        } else {
            throw new Error("بيانات الخادم غير صالحة أو فارغة");
        }
    } catch (error) {
        console.warn('نظام حلويات بوسي: جاري تفعيل وضع الاستدعاء المحلي لتأمين عرض المنتجات نتيجة خطأ في الاتصال.');
        const localData = getFromLocalMemory('boseSweets_catalog');
        if (localData && Array.isArray(localData)) {
            catalog.length = 0;
            localData.forEach(item => catalog.push(item));
            syncCatalogMap();
            return true;
        }
        return false;
    }
};

if (typeof window !== 'undefined') {
    window.fetchAndSyncBoseSweetsData = fetchAndSyncBoseSweetsData;
}