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
