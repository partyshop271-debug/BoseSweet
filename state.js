// إدارة الحالة الديناميكية والمزامنة السيادية - براند حلويات بوسي
import { defaultSettings, defaultShipping } from './config.js';

// 👑 الترقية السيادية: توحيد مسار الذاكرة بين الإدارة والعميل لضمان مرجعية واحدة (Single Source of Truth)
export let siteSettings = (typeof window !== 'undefined' && window.siteSettings) || { ...defaultSettings };
export let shippingZones = (typeof window !== 'undefined' && window.shippingZones) || [ ...defaultShipping ];
export let catalog = (typeof window !== 'undefined' && window.catalog) || []; 
export let galleryData = (typeof window !== 'undefined' && window.galleryData) || []; 
export let catMenu = (typeof window !== 'undefined' && window.catMenu) || [];
export let isAppReady = false; 

// ربط المتغيرات الأساسية بجذر المتصفح لضمان رؤية لوحة التحكم والسكربتات الخارجية لها
if (typeof window !== 'undefined') {
    window.siteSettings = siteSettings;
    window.shippingZones = shippingZones;
    window.catalog = catalog;
    window.galleryData = galleryData;
    window.catMenu = catMenu;
}

// 👑 هيكل الحالة الموحد (يضم كافة المتغيرات لضمان التوافق مع أي تعديلات سابقة أو لاحقة)
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
        sp: '',
        alg: '', // توافقية خلفية لطلبات الحساسية
        occ: '', // توافقية خلفية للمناسبات
        refImgUrl: '', // مسار الصورة المرجعية
        hasRefImg: false,
        crd: false, // كارت الإهداء
        dlg: false,
        isReady: false
    },
    isAppReady: false 
};

// 👑 هيكل بناء التورتة الملكية مدمج بجميع الخصائص المطلوبة لضمان استقرار الواجهة
export const cakeState = {
    flavors: [],
    images: [],
    shapes: [{ id: 'دائري', name: 'دائري' }, { id: 'مستطيل', name: 'مستطيل' }, { id: 'قلب', name: 'قلب' }, { id: 'مربع', name: 'مربع' }],
    basePrice: 0,
    sizePrice: 0,
    imgPrice: 0,
    total: 0,
    // خصائص إضافية لضمان عدم توقف أي دوال قديمة تستدعيها
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

export let currentBuilderStep = 1;
export const catalogMap = new Map();

/**
 * 👑 مزامنة خارطة المنتجات (Catalog Map) لسرعة البحث
 * تم إضافة إطلاق حدث (Event) لتنبيه الواجهة بتحديث المنتجات
 */
export function syncCatalogMap() {
    catalogMap.clear();
    if (Array.isArray(catalog)) {
        catalog.forEach(p => {
            if (p && p.id) catalogMap.set(String(p.id), p);
        });
    }
    
    // إرسال إشارة سيادية لتحديث مكونات الواجهة تلقائياً دون إعادة تحميل
    if (typeof window !== 'undefined') {
        const syncEvent = new CustomEvent('BoseSweets_Catalog_Synced', { 
            detail: { count: catalogMap.size, timestamp: Date.now() } 
        });
        window.dispatchEvent(syncEvent);
    }
}

/**
 * إعلان جاهزية التطبيق للاستخدام وفك التجميد عن الواجهة
 */
export function setAppReady() {
    isAppReady = true;
    state.isAppReady = true;
    if (typeof window !== 'undefined') {
        window.isAppReady = true;
        window.dispatchEvent(new CustomEvent('BoseSweets_App_Ready'));
    }
}

// ============================================================================
// هندسة التخزين والاستدعاء المركزي والمحصن (Persistent Storage Engine)
// ============================================================================

export function saveToLocalMemory(key, data) {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn("تنبيه نظام حلويات بوسي: امتلاء الذاكرة المحلية، يتم العمل بالذاكرة الحية.", e);
            // محاولة تنظيف بعض المساحة في حالة الطوارئ
            if(e.name === 'QuotaExceededError') {
                localStorage.removeItem('BoseSweets_Local_Sync_Force');
            }
        }
    }
}

export function getFromLocalMemory(key) {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn("تنبيه نظام حلويات بوسي: تعذر قراءة الذاكرة، سيتم جلب بيانات جديدة.", e);
            return null;
        }
    }
    return null;
}

/**
 * 👑 محرك الاستدعاء المركزي (BoseSweets Sync Engine)
 * يضمن سحب البيانات من السحابة وتحديث الذاكرة الحية فوراً مع حماية ضد انهيار الاتصال.
 * تم تحصينه بمرونة لتخطي الكاش في لوحة الإدارة وقبول كافة أنواع البيانات.
 */
export async function fetchAndSyncBoseSweetsData(fetchPromise, cacheKey = 'boseSweets_catalog', cacheDuration = 3600000) {
    const timeKey = `${cacheKey}_timestamp`;
    
    try {
        const currentTime = Date.now();
        const cacheTime = typeof window !== 'undefined' ? localStorage.getItem(timeKey) : null;
        const localData = getFromLocalMemory(cacheKey);
        const isAdminPath = typeof window !== 'undefined' && window.location.pathname.includes('admin');
        const forceRefresh = typeof window !== 'undefined' && localStorage.getItem('BoseSweets_Local_Sync_Force');
        
        // مسح الكاش إجبارياً إذا طلبت الإدارة ذلك لضمان التحديث اللحظي
        if (forceRefresh) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(timeKey);
                localStorage.removeItem('BoseSweets_Local_Sync_Force');
            }
        } else if (!isAdminPath && localData && cacheTime && (currentTime - Number(cacheTime) < cacheDuration)) {
            // القرار المهني: التحقق الذكي من نوع البيانات لمنع الأخطاء
            if (Array.isArray(localData) && cacheKey.includes('catalog')) {
                catalog.length = 0;
                localData.forEach(item => catalog.push(item));
                syncCatalogMap();
                return true;
            }
        }

        const data = await fetchPromise(); 
        
        if (data) {
            // معالجة ذكية: إذا كانت البيانات مصفوفة خاصة بالكتالوج
            if (Array.isArray(data) && cacheKey.includes('catalog')) {
                catalog.length = 0;
                data.forEach(item => catalog.push(item));
                syncCatalogMap();
            }
            
            // حفظ النسخة المحدثة في الخزنة المحلية
            saveToLocalMemory(cacheKey, (Array.isArray(data) && cacheKey.includes('catalog')) ? catalog : data); 
            
            if (typeof window !== 'undefined') {
                localStorage.setItem(timeKey, currentTime.toString()); 
            }
            return true; 
        } else {
            throw new Error("بيانات الخادم غير صالحة أو فارغة");
        }
    } catch (error) {
        console.warn('منظومة حلويات بوسي: جاري تفعيل وضع الاستدعاء المحلي لتأمين العرض ضد تقلبات الشبكة.');
        
        // البحث الموسع عن أي نسخة احتياطية لضمان عدم خلو الموقع من المنتجات
        const localData = getFromLocalMemory(cacheKey) || getFromLocalMemory('bSweets_catalog') || getFromLocalMemory('boseSweets_catalog');
        
        if (localData && Array.isArray(localData) && cacheKey.includes('catalog')) {
            catalog.length = 0;
            localData.forEach(item => catalog.push(item));
            syncCatalogMap();
            return true;
        }
        return false;
    }
}

// 👑 تأكيد التوافقية الشاملة على نطاق المتصفح للسكربتات الخارجية
if (typeof window !== 'undefined') {
    window.fetchAndSyncBoseSweetsData = fetchAndSyncBoseSweetsData;
    window.syncCatalogMap = syncCatalogMap;
    window.setAppReady = setAppReady;
    window.saveToLocalMemory = saveToLocalMemory;
    window.getFromLocalMemory = getFromLocalMemory;
    window.catalogMap = catalogMap;
    window.state = state;
    window.cakeState = cakeState;
    window.currentBuilderStep = currentBuilderStep;
}