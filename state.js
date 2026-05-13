/**
 * 👑 BoseSweets State & Sync Engine (V26.5 - Sovereign Monitor Edition)
 * محرك إدارة الحالة الديناميكية والمزامنة السيادية - براند حلويات بوسي
 * تم هندسة هذا الملف ليكون "النخاع الشوكي" للبيانات، لضمان استقرار المعلومات 
 * بين المتصفح، الذاكرة المحلية، وقاعدة البيانات السحابية.
 * 🛡️ التحديث الأمني المتقدم: تم زراعة مستشعر BoseMonitor في كافة الدوال الحيوية.
 */

import { defaultSettings, defaultShipping, defaultCatalog } from './config.js';

// 👑 الترقية السيادية: توحيد مسار الذاكرة بين الإدارة والعميل لضمان مرجعية واحدة (Single Source of Truth)
export let siteSettings = (typeof window !== 'undefined' && window.siteSettings) || { ...defaultSettings };
export let shippingZones = (typeof window !== 'undefined' && window.shippingZones) || [ ...defaultShipping ];
export let catalog = (typeof window !== 'undefined' && window.catalog) || []; 
export let galleryData = (typeof window !== 'undefined' && window.galleryData) || []; 
export let catMenu = (typeof window !== 'undefined' && window.catMenu) || [];
export let isAppReady = false; 

/**
 * 🛡️ بروتوكول الربط العالمي (Global Binding Protocol)
 * ربط المتغيرات الأساسية بجذر المتصفح لضمان رؤية لوحة التحكم والسكربتات الخارجية لها دون تصادم
 */
if (typeof window !== 'undefined') {
    try {
        window.siteSettings = siteSettings;
        window.shippingZones = shippingZones;
        window.catalog = catalog;
        window.galleryData = galleryData;
        window.catMenu = catMenu;
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'state.js', null, null, 'Global State Initialization Failure');
    }
}

/**
 * 👑 هيكل الحالة الموحد (Unified State Structure)
 * تم تصميمه ليكون المصدر الوحيد لاتخاذ القرارات البرمجية في الواجهة.
 */
export const state = {
    activeCat: 'الرئيسية',
    dSize: 'مثلث',
    fType: 'بوكيه',
    isAppReady: false,
    cart: [],
    currentShippingFee: 0,
    appliedPromo: null,
    cakeState: {
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
    },
    currentBuilderStep: 1
};

export const cakeState = state.cakeState;
export const currentBuilderStep = state.currentBuilderStep;

/**
 * 👑 محرك الوصول السريع (Fast Access Map)
 * فهرسة الكتالوج لضمان جلب بيانات أي منتج في أجزاء من الثانية.
 */
export const catalogMap = new Map();
export function syncCatalogMap() {
    try {
        catalogMap.clear();
        if (Array.isArray(catalog)) {
            catalog.forEach(p => {
                if (p && p.id) {
                    catalogMap.set(String(p.id), p);
                }
            });
        } else {
            throw new Error("Catalog is not an array during syncCatalogMap call");
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'state.js', null, null, 'syncCatalogMap - Indexing Error');
    }
}

/**
 * إشارة الجاهزية السيادية لفك تجميد الواجهة الأمامية وتطهير شاشة التحميل
 */
export function setAppReady() {
    try {
        isAppReady = true;
        state.isAppReady = true;
        
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { 
                loader.style.display = 'none'; 
                const mainContent = document.getElementById('main-content');
                if(mainContent) mainContent.style.opacity = '1';
            }, 700);
        }
        
        // إطلاق حدث عالمي لجميع المكونات لبدء العمل الميداني
        window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready', { detail: { timestamp: Date.now() } }));
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'state.js', null, null, 'setAppReady - UI Transition Failure');
    }
}

/**
 * 👑 محرك الذاكرة المحلية (Persistent Storage Handler)
 * التعامل مع ذاكرة المتصفح لضمان عمل الموقع في وضع انقطاع الإنترنت أو التحميل السريع.
 */
export function saveToLocalMemory(key, data) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
            localStorage.setItem(`${key}_timestamp`, Date.now().toString());
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'state.js', null, null, `saveToLocalMemory - Key: ${key}`);
        console.warn("BoseSweets State: Local memory storage operation failed.");
    }
}

export function getFromLocalMemory(key) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const saved = localStorage.getItem(key);
            if (saved) {
                return JSON.parse(saved);
            }
        }
        return null;
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'state.js', null, null, `getFromLocalMemory - Key: ${key}`);
        return null;
    }
}

/**
 * 👑 بروتوكول المزامنة السيادية الشاملة (The Master Sync Protocol)
 * المحرك المسؤول عن التوازن بين البيانات السحابية والذاكرة المحلية الموثقة.
 * تم تدعيمه بالمستشعر لمراقبة دقة البيانات المستلمة وضمان سلامة التدفق.
 */
export async function fetchAndSyncBoseSweetsData(fetchPromise, cacheKey, updateCallback) {
    try {
        // 1. بروتوكول التحميل المتفائل (Optimistic Loading Phase)
        const localData = getFromLocalMemory(cacheKey);
        if (localData && Array.isArray(localData) && localData.length > 0) {
            if (cacheKey === 'bosesweets_catalog') {
                catalog.splice(0, catalog.length, ...localData);
                syncCatalogMap();
            }
            if (typeof updateCallback === 'function') updateCallback(localData);
        }

        // 2. بروتوكول التحقق السحابي (Cloud Verification Phase)
        try {
            const freshData = await fetchPromise();
            
            if (freshData && Array.isArray(freshData) && freshData.length > 0) {
                // تحديث الذاكرة السيادية الموحدة مع الحفاظ على مراجع المصفوفات
                if (cacheKey === 'bosesweets_catalog') {
                    catalog.splice(0, catalog.length, ...freshData);
                    syncCatalogMap();
                }
                
                // حفظ النسخة الجديدة في الذاكرة الفولاذية
                saveToLocalMemory(cacheKey, freshData);
                
                if (typeof updateCallback === 'function') {
                    updateCallback(freshData);
                }
                
                setAppReady();
                return true;
            } else if (freshData && freshData.length === 0) {
                // تسجيل حالة البيانات الفارغة كمخاطرة محتملة
                if(window.BoseMonitor) window.BoseMonitor.report("تم استلام مصفوفة فارغة من السحابة", 'state.js', null, null, `Empty Response: ${cacheKey}`);
                throw new Error("Empty Cloud Response Received");
            } else {
                throw new Error("Non-Array Cloud Data Format Detected");
            }
        } catch (cloudError) {
            // فشل السحابة: التراجع الآمن للوضع المحلي
            if(window.BoseMonitor) window.BoseMonitor.report(cloudError, 'state.js', null, null, `Cloud Sync Failure: ${cacheKey}`);
            
            if (catalog.length === 0 && cacheKey === 'bosesweets_catalog') {
                catalog.push(...defaultCatalog);
                syncCatalogMap();
            }
            
            setAppReady();
            return false;
        }
    } catch (masterError) {
        // حماية الطبقة العليا لضمان تجربة مستخدم مستقرة (Fail-Safe)
        if(window.BoseMonitor) window.BoseMonitor.report(masterError, 'state.js', null, null, 'Master Sync Guard Failure');
        setAppReady();
        return false;
    }
}

/**
 * 👑 تأكيد التوافقية الشاملة والنهائية (Final Comprehensive Compatibility)
 * ربط كافة الأدوات بنطاق window لضمان إمكانية الوصول السيادي من أي ملف آخر.
 */
if (typeof window !== 'undefined') {
    try {
        window.setAppReady = setAppReady;
        window.saveToLocalMemory = saveToLocalMemory;
        window.getFromLocalMemory = getFromLocalMemory;
        window.state = state;
        window.cakeState = cakeState;
        window.currentBuilderStep = currentBuilderStep;
        window.siteSettings = siteSettings;
        window.catalog = catalog;
        window.catalogMap = catalogMap;
        window.fetchAndSyncBoseSweetsData = fetchAndSyncBoseSweetsData;
        window.syncCatalogMap = syncCatalogMap;
        
        // إشعار المستشعر باكتمال تهيئة محرك الحالة
        console.log("👑 BoseSweets Engine: State finalized and bound to window.");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'state.js', null, null, 'Final Window Bindings Critical Error');
    }
}