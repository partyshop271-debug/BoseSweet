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
export let cakeState = { flavor: 'فانيليا', shape: 'دائري', persons: 4, printing: 'بدون', notes: '', refImage: null, allergies: '', hasCard: false, cardText: '', occasion: '', designStyle: 'تصميم محدد' };
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

export function saveToLocalMemory(key, data) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
        }
    } catch (error) {
        console.warn('تنويه نظام حلويات بوسي: لم يتم حفظ النسخة الاحتياطية محلياً.', error);
    }
}

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

export async function loadAndCacheCatalog(fetchPromise) {
    try {
        const data = await fetchPromise(); 
        
        if (data && Array.isArray(data) && data.length > 0) {
            catalog = data;
            saveToLocalMemory('boseSweets_catalog', catalog); 
            syncCatalogMap();
            return true; 
        } else {
            throw new Error("بيانات الخادم غير مكتملة");
        }
    } catch (error) {
        console.warn('نظام حلويات بوسي: جاري تفعيل وضع الاستدعاء المحلي لتأمين عرض المنتجات.');
        const localData = getFromLocalMemory('boseSweets_catalog');
        if (localData && Array.isArray(localData) && localData.length > 0) {
            catalog = localData;
            syncCatalogMap(); 
            return true;
        }
        return false; 
    }
}