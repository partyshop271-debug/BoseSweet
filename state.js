// إدارة الحالة الديناميكية لبراند حلويات بوسي
import { defaultSettings, defaultShipping } from './config.js';

export let siteSettings = { ...defaultSettings };
export let shippingZones = [ ...defaultShipping ];
export let catalog = []; 
export let galleryData = []; 
export let catMenu = [];
export let isAppReady = false; 

export let state = { 
    activeCat: 'الرئيسية', 
    dSize: 'مثلث', 
    fType: 'ورد طبيعي', 
    cart: [], 
    currentShippingFee: 0, 
    cakeBuilder: { flv: 'فانيليا', ps: 4, sh: 'دائري', trd: false, img: 'بدون', msg: '', alg: '', occ: '', refImgUrl: '', hasRefImg: false, crd: false, dlg: false } 
};

// هندسة الحالة المخصصة للمعالج متعدد الخطوات
export let currentBuilderStep = 1;
export let cakeState = { flavor: 'فانيليا', shape: 'دائري', persons: 4, printing: 'بدون', notes: '', refImage: null };

export let catalogMap = new Map();

export function syncCatalogMap() { 
    catalogMap.clear(); 
    if(Array.isArray(catalog)) {
        catalog.forEach(p => { if(p) catalogMap.set(String(p.id), p) }); 
    }
}

export function setAppReady() { isAppReady = true; }

// ============================================================================
// هندسة التخزين المحلي (Local Storage) لضمان استقرار عرض الأقسام والمنتجات
// ============================================================================

// وظيفة حفظ البيانات بشكل آمن في الذاكرة المحلية لجهاز العميل
export function saveToLocalMemory(key, data) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
        }
    } catch (error) {
        // يتم التعامل مع الخطأ بصمت للحفاظ على استقرار الواجهة في حال امتلاء الذاكرة
        console.warn('تنويه نظام حلويات بوسي: لم يتم حفظ النسخة الاحتياطية محلياً.', error);
    }
}

// وظيفة استدعاء البيانات من الذاكرة المحلية كخط دفاع أول عند ضعف الإنترنت
export function getFromLocalMemory(key) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedData = localStorage.getItem(key);
            if (storedData) {
                return JSON.parse(storedData);
            }
        }
        return null;
    } catch (error) {
        console.warn('تنويه نظام حلويات بوسي: تعذر قراءة النسخة الاحتياطية المحلية.', error);
        return null;
    }
}

// المعالج الذكي لجلب المنتجات (يدمج بين الخادم والذاكرة المحلية)
// يستقبل دالة الجلب الأصلية (fetchPromise) كمدخل لضمان مرونة المحرك
export async function loadAndCacheCatalog(fetchPromise) {
    try {
        // 1. محاولة جلب المنتجات من الخادم السحابي
        const data = await fetchPromise(); 
        
        if (data && Array.isArray(data) && data.length > 0) {
            catalog = data;
            // بناء مسار التخزين المحلي الخاص بعلامة حلويات بوسي
            saveToLocalMemory('boseSweets_catalog', catalog); 
            syncCatalogMap();
            return true; 
        } else {
            throw new Error("بيانات الخادم غير مكتملة");
        }
    } catch (error) {
        // 2. الاستدعاء الفوري للبيانات من الذاكرة المحلية إذا فشل الخادم
        console.warn('نظام حلويات بوسي: جاري تفعيل وضع الاستدعاء المحلي لتأمين عرض المنتجات.');
        
        const localData = getFromLocalMemory('boseSweets_catalog');
        
        if (localData && Array.isArray(localData) && localData.length > 0) {
            catalog = localData;
            syncCatalogMap(); // مزامنة الخريطة فوراً لضمان عمل كافة الوظائف المرتبطة
            return true;
        }
        
        return false; // في حالة عدم وجود اتصال مسبق وعدم توفر بيانات محلية
    }
}