// إدارة الحالة الديناميكية والمزامنة السيادية - براند حلويات بوسي
import { defaultSettings, defaultShipping, defaultCatalog } from './config.js';

// 👑 الترقية السيادية: توحيد مسار الذاكرة بين الإدارة والعميل لضمان مرجعية واحدة (Single Source of Truth)
export let siteSettings = (typeof window !== 'undefined' && window.siteSettings) || { ...defaultSettings };
export let shippingZones = (typeof window !== 'undefined' && window.shippingZones) || [ ...defaultShipping ];
export let catalog = (typeof window !== 'undefined' && window.catalog) || []; 
export let galleryData = (typeof window !== 'undefined' && window.galleryData) || []; 
export let catMenu = (typeof window !== 'undefined' && window.catMenu) || [];
export let isAppReady = false; 

// 🛡️ ربط المتغيرات الأساسية بجذر المتصفح لضمان رؤية لوحة التحكم والسكربتات الخارجية لها دون تصادم
if (typeof window !== 'undefined') {
    window.siteSettings = siteSettings;
    window.shippingZones = shippingZones;
    window.catalog = catalog;
    window.galleryData = galleryData;
    window.catMenu = catMenu;
}

// 👑 هيكل الحالة الموحد (يضم كافة المتغيرات لضمان التوافق مع أي تعديلات سابقة أو لاحقة)
export const state = {
    activeCat: 'الرئيسية',
    dSize: 'مثلث',
    fType: 'بوكيه',
    isAppReady: false,
    cart: [],
    cakeState: {
        // تم دمج الخصائص الجديدة مع الخصائص الأساسية لضمان عدم توقف أي دوال بالواجهة
        occasion: '',
        flavor: '',
        layerShape: '',
        layers: 1,
        printing: 'بدون',
        size: 16,
        uploadedImage: null,
        total: 0,
        shape: 'دائري',
        persons: 4,
        designStyle: 'على ذوق بوسي',
        hasCard: false,
        cardText: '',
        allergies: '',
        notes: '',
        refImage: null
    }
};

if (typeof window !== 'undefined') {
    window.globalState = state;
}

// 👑 هيكل بناء التورتة الملكية المنفصل (تم الإبقاء عليه لدعم المكونات القديمة وتجنب أي انهيار)
export const cakeState = {
    flavors: [],
    images: [],
    shapes: [{ id: 'دائري', name: 'دائري' }, { id: 'مستطيل', name: 'مستطيل' }, { id: 'قلب', name: 'قلب' }, { id: 'مربع', name: 'مربع' }],
    basePrice: 0,
    sizePrice: 0,
    imgPrice: 0,
    total: 0,
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
 * تم دمج التحديث الجديد مع الاحتفاظ بإشارات التنبيه للواجهة
 */
export function syncCatalogMap() {
    catalogMap.clear();
    if (Array.isArray(catalog)) {
        catalog.forEach(p => {
            // تأمين إضافي: تعيين حالة النشاط الافتراضية لمنع استبعاد المنتجات بالخطأ
            if (p && p.id) {
                if (p.isActive === undefined) p.isActive = true;
                if (p.inStock === undefined) p.inStock = true;
                catalogMap.set(String(p.id), p);
            }
        });
    }
    
    if (typeof window !== 'undefined') {
        window.catalogMap = catalogMap;
        // إرسال إشارة سيادية لتحديث مكونات الواجهة تلقائياً دون إعادة تحميل (ميزة ضرورية للاستقرار)
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
        
        // فك تجميد الواجهة بعد تأكيد الجاهزية وإزالة أي شاشات تحميل عالقة
        const loader = document.getElementById('bose-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                document.body.classList.remove('overflow-hidden');
            }, 500);
        }
        
        window.dispatchEvent(new CustomEvent('BoseSweets_App_Ready'));
    }
}

// ============================================================================
// هندسة التخزين والاستدعاء المركزي والمحصن (Persistent Storage Engine)
// ============================================================================

export function saveToLocalMemory(key, data) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(key, JSON.stringify(data));
        }
    } catch (e) {
        console.warn('تنبيه فني من نظام حلويات بوسي: تعذر الحفظ المحلي. يتم العمل بالذاكرة الحية لضمان استمرار الخدمة.');
        // معالجة امتلاء الذاكرة للحفاظ على استقرار التطبيق
        if(e.name === 'QuotaExceededError' && typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('BoseSweets_Local_Sync_Force');
        }
    }
}

export function getFromLocalMemory(key) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        }
    } catch (e) {
        console.warn("تنبيه فني من نظام حلويات بوسي: تعذر قراءة الذاكرة، سيتم جلب بيانات جديدة.");
        return null;
    }
    return null;
}

/**
 * 👑 الدالة السيادية لجلب ومزامنة البيانات بهندسة تمنع الانهيار (Firestore Integration)
 * تم دمجها لتقرأ مباشرة من محرك السحابة مع الاحتفاظ بقوة التحديث التلقائي للمصفوفات المحلية
 */
export async function fetchAndSyncBoseSweetsData(collectionName, cacheKey, updateCallback) {
    try {
        const db = typeof window !== 'undefined' && window.db ? window.db : null;
        if (!db) throw new Error("محرك السحابة غير متصل بنطاق المتصفح");

        const snapshot = await db.collection(collectionName).get();
        if (!snapshot.empty) {
            const freshData = [];
            snapshot.forEach(doc => {
                const docData = doc.data();
                if (collectionName === 'catalog') {
                     // ضمان استمرار ظهور المنتجات القديمة
                     if (docData.isActive === undefined) docData.isActive = true;
                     freshData.push({ id: doc.id, ...docData });
                } else {
                     freshData.push(docData);
                }
            });
            
            // تحديث المصفوفة السيادية في حالة الكتالوج لمنع اختفاء المنتجات من الواجهة
            // تم التعديل إلى splice للحفاظ على المرجع الفعلي للمصفوفة في الذاكرة
            if (collectionName === 'catalog') {
                catalog.splice(0, catalog.length);
                freshData.forEach(item => catalog.push(item));
                syncCatalogMap();
            }

            saveToLocalMemory(cacheKey, freshData);
            
            if (typeof updateCallback === 'function') {
                updateCallback(freshData);
            }
            setAppReady();
            return true; 
        } else {
            throw new Error("بيانات الخادم غير صالحة أو فارغة");
        }
    } catch (error) {
        console.warn('منظومة حلويات بوسي: جاري تفعيل وضع الاستدعاء المحلي لتأمين العرض ضد تقلبات الشبكة.');
        
        // خط الدفاع السيادي الأخير لضمان عرض المنتجات الدائم
        const fallbackData = getFromLocalMemory(cacheKey) || getFromLocalMemory('bSweets_catalog') || getFromLocalMemory('boseSweets_catalog') || (cacheKey && cacheKey.includes('catalog') ? defaultCatalog : null);
        
        if (fallbackData && Array.isArray(fallbackData) && cacheKey && cacheKey.includes('catalog')) {
            // تم التعديل إلى splice للحفاظ على المرجع الفعلي للمصفوفة في وضع الاستدعاء المحلي أيضاً
            catalog.splice(0, catalog.length);
            fallbackData.forEach(item => {
                if (item.isActive === undefined) item.isActive = true;
                catalog.push(item);
            });
            syncCatalogMap();
            setAppReady(); // إجبار الجاهزية لاستمرار العمل
            return true;
        } else if (fallbackData && typeof updateCallback === 'function') {
            updateCallback(fallbackData);
            setAppReady();
            return true;
        }
        
        setAppReady(); // إجبار فك تجميد الواجهة في أسوأ الظروف
        return false;
    }
}

// 👑 تأكيد التوافقية الشاملة والنهائية على نطاق المتصفح للسكربتات الخارجية واللوحة السيادية
if (typeof window !== 'undefined') {
    // التصديرات الأساسية للوظائف والحالة
    window.setAppReady = setAppReady;
    window.saveToLocalMemory = saveToLocalMemory;
    window.getFromLocalMemory = getFromLocalMemory;
    window.state = state;
    window.cakeState = cakeState;
    window.currentBuilderStep = currentBuilderStep;
    
    // التصديرات الحيوية المطلوبة لتأمين المرجعية وضمان استقرار الواجهة
    window.siteSettings = siteSettings;
    window.catalog = catalog;
    window.catalogMap = catalogMap;
    window.fetchAndSyncBoseSweetsData = fetchAndSyncBoseSweetsData;
    window.syncCatalogMap = syncCatalogMap;
}