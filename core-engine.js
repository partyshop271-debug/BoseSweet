/**
 * ============================================================================
 * 👑 BoseSweets Core Engine - الذاكرة المركزية والعقل المدبر (V28.0 - Sovereign Edition)
 * ============================================================================
 * الإدارة المرجعية: حلويات بوسي
 * الوظيفة: هذا الملف هو "النخاع الشوكي" للموقع. يحتفظ بالحالة اللحظية للبيانات، 
 * الإعدادات السيادية، والذاكرة المحلية، دون التدخل في جلب البيانات (الذي يتولاه الجسر).
 */

import { firebaseConfig, NetworkEngine, ReverseSyncEngine, CloudQueueDB, db, auth } from './firebase-config.js';

// 👑 الإعدادات الثابتة والمرجعية لعلامة حلويات بوسي
const boseConfig = {
    firebase: firebaseConfig,
    db: db,
    auth: auth,
    network: NetworkEngine,
    sync: ReverseSyncEngine,
    queue: CloudQueueDB,

    cloudinary: {
        cloudName: "dyx4w0dr1",
        baseDeliveryUrl: "https://res.cloudinary.com/dyx4w0dr1/image/upload/"
    },

    branding: {
        colors: {
            pink: "#ff91a4",        
            dark: "#1a1a1a",   
            white: "#FFFFFF"        
        },
        typography: {
            titleWeight: "700",     
            lineHeight: "1.7"       
        }
    },

    location: {
        address: "الكفاح، شارع الوحدة المحلية، بجوار صيدلية د. أحمد مجدي وعيادة د. علي",
    }
};

// 👑 هيكل الحالة الموحد (Unified Dynamic State)
// هذا الهيكل هو الذاكرة الحية التي تتغير بناءً على توجيهات لوحة الإدارة وتفاعل العميل
export const BoseState = {
    siteSettings: {},          // ستُملأ من الجسر السحابي
    shippingZones: [],         // ستُملأ من الجسر السحابي
    catalog: [],               // الكتالوج الرئيسي للمنتجات
    galleryData: [],           // بيانات معرض الصور
    catMenu: [],               // التصنيفات النشطة
    
    activeCat: 'الرئيسية',      // التصنيف المفتوح حالياً للعميل
    isAppReady: false,         // إشارة جاهزية الموقع لرفع شاشة التحميل
    cart: [],                  // سلة مشتريات العميل الحالية
    currentShippingFee: 0,
    appliedPromo: null,
    
    // ذاكرة بناء التورت المخصصة
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
    currentBuilderStep: 1,
    
    // محرك الفهرسة السريعة للمنتجات (للبحث وجلب السعر اللحظي)
    catalogMap: new Map()
};

/**
 * 👑 محرك الفهرسة السريعة (Fast Indexing Engine)
 * لتسريع عملية البحث داخل الكتالوج وعرض البيانات للعميل في أجزاء من الثانية.
 */
export function syncCatalogMap() {
    try {
        BoseState.catalogMap.clear();
        if (Array.isArray(BoseState.catalog)) {
            BoseState.catalog.forEach(p => {
                if (p && p.id) {
                    BoseState.catalogMap.set(String(p.id), p);
                }
            });
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'core-engine.js', null, null, 'syncCatalogMap - Indexing Error');
    }
}

/**
 * 👑 محرك الذاكرة المحلية الفولاذية (Persistent Local Storage)
 * يحمي بيانات الموقع من الضياع عند عمل تحديث للصفحة أو انقطاع الإنترنت.
 */
export function saveToLocalMemory(key, data) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
            localStorage.setItem(`${key}_timestamp`, Date.now().toString());
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'core-engine.js', null, null, `saveToLocalMemory - Key: ${key}`);
        console.warn("BoseSweets Core: فشل التخزين المحلي المنيع.");
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
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'core-engine.js', null, null, `getFromLocalMemory - Key: ${key}`);
        return null;
    }
}

/**
 * 👑 إشارة الجاهزية السيادية (Sovereign Readiness Signal)
 * تُستخدم لإخبار الواجهة بأن البيانات اكتملت ويمكن رفع شاشة التحميل للعميل.
 */
export function setAppReady() {
    try {
        BoseState.isAppReady = true;
        
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { 
                loader.style.display = 'none'; 
                const mainContent = document.getElementById('main-content');
                if(mainContent) mainContent.style.opacity = '1';
            }, 700);
        }
        
        // إطلاق إشارة للبدء الفوري لكل واجهات العميل
        window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready', { detail: { timestamp: Date.now() } }));
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'core-engine.js', null, null, 'setAppReady - UI Transition Failure');
    }
}

/**
 * 🛡️ بروتوكول الربط العالمي (Global Binding Protocol)
 * ربط المحرك المركزي والذاكرة بنطاق المتصفح لضمان رؤية مطلقة من جميع الملفات الأخرى.
 */
if (typeof window !== 'undefined') {
    try {
        window.boseConfig = boseConfig;
        window.BoseState = BoseState;
        
        // ربط المتغيرات بشكل مباشر لتسهيل الاستدعاء في واجهات العميل والإدارة
        window.siteSettings = BoseState.siteSettings;
        window.shippingZones = BoseState.shippingZones;
        window.catalog = BoseState.catalog;
        window.galleryData = BoseState.galleryData;
        window.catMenu = BoseState.catMenu;
        window.cakeState = BoseState.cakeState;
        
        window.syncCatalogMap = syncCatalogMap;
        window.saveToLocalMemory = saveToLocalMemory;
        window.getFromLocalMemory = getFromLocalMemory;
        window.setAppReady = setAppReady;

        console.log("👑 النواة المركزية لعلامة حلويات بوسي (V28.0): تم تفعيل الذاكرة بنجاح وربطها بالشبكة العالمية.");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'core-engine.js', null, null, 'Global Core Bindings Critical Error');
    }
}

export default { boseConfig, BoseState };
