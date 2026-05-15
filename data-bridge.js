/**
 * ============================================================================
 * 👑 BoseSweets Data Bridge | جسر البيانات السيادي (V28.0 - Sovereign Integration)
 * ============================================================================
 * الإدارة المرجعية: حلويات بوسي
 * الوظيفة: هذا الملف هو الجسر الآمن الوحيد المسموح له بالتحدث مع قاعدة البيانات السحابية.
 * يقوم بجلب (الإعدادات، الكتالوج، الشحن) ويضخها مباشرة في الذاكرة المركزية (core-engine.js).
 * تم دمج الخزنة الفولاذية والبيانات الافتراضية لضمان عمل الموقع في أسوأ ظروف الشبكة.
 */

import { collection, query, where, getDocs, doc, getDoc, setDoc, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import coreExports from './core-engine.js';

// استخراج المراجع من النواة المركزية
const { boseConfig, BoseState } = coreExports;
const syncCatalogMap = window.syncCatalogMap;
const saveToLocalMemory = window.saveToLocalMemory;
const getFromLocalMemory = window.getFromLocalMemory;
const setAppReady = window.setAppReady;

// ============================================================================
// 🛡️ الترسانة الاحتياطية (المستخرجة من config.js القديم لحماية النظام من الانهيار)
// ============================================================================
const BOSE_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg";

export const defaultSettingsFallback = {
    brandName: "حلويات بوسي", 
    announcement: "حلويات بوسي: طعم فاخر يليق بيك",
    heroTitle: "حلويات بوسي <br class='hidden md:block'/> <span class='text-[#ff91a4] relative inline-block mt-1 md:mt-2 drop-shadow-md'>الطعم الفاخر اللي تستحقه</span>",
    heroDesc: "بنختار خاماتنا بعناية وبنهتم بأدق التفاصيل، عشان نقدم طعم مميز وتجربة تذوق راقية.",
    footerPhone: "01097238441", 
    footerAddress: "الكفاح، مركز الفرافرة، محافظة الوادي الجديد",
    brandColorHex: "#ff91a4", 
    bgColor: "#ffffff", 
    textColor: "#1a1a1a",
    tickerActive: true, 
    tickerText: "حلويات بوسي: عشر سنين من التميز في الفرافرة.. طعم فاخر يليق بيك ✨", 
    catMenu: ["الرئيسية", "ديسباسيتو", "سينابون", "تورت", "ورد"]
};

export const defaultShippingFallback = [
    { id: 'sh_1', name: 'الكفاح', fee: 0 }, 
    { id: 'sh_2', name: 'أبو منقار', fee: 50 }, 
    { id: 'sh_3', name: 'النهضة', fee: 30 }, 
    { id: 'sh_4', name: 'مركز الفرافرة', fee: 20 }
];

export const defaultCatalogFallback = [
    { id: 'dp_nutella', name: 'ديسباسيتو نوتيلا', category: 'ديسباسيتو', desc: 'فادج كيك غني يعلوه صوص نوتيلا أصلي.', price: 66, size: 'مثلث', img: BOSE_LOGO_FALLBACK, badge: 'مبيعاً 🔥', inStock: true, isActive: true },
    { id: 'dp_lotus', name: 'ديسباسيتو لوتس', category: 'ديسباسيتو', desc: 'مزيج فاخر بين الفادج وزبدة اللوتس.', price: 66, size: 'مثلث', img: BOSE_LOGO_FALLBACK, inStock: true, isActive: true },
    { id: 'cn_classic', name: 'سينابون كلاسيك', category: 'سينابون', desc: 'عجينة قطنية بصوص الجبن الكريمي المخصوص.', price: 45, size: 'قطعة', img: BOSE_LOGO_FALLBACK, badge: 'جديد 🌟', inStock: true, isActive: true }
];

// ============================================================================
// 👑 عمليات جلب البيانات السيادية وضخها في الذاكرة المركزية
// ============================================================================

/**
 * 1. جلب الإعدادات المرجعية للإدارة
 */
export async function fetchSystemSettings() {
    try {
        if (!db) throw new Error("قاعدة البيانات غير متصلة.");
        const sSnap = await getDoc(doc(db, 'settings', 'main'));
        
        if (sSnap.exists()) {
            Object.assign(BoseState.siteSettings, sSnap.data());
            saveToLocalMemory('bosesweets_settings', BoseState.siteSettings);
            console.log("👑 Data Bridge: تم سحب الإعدادات السيادية بنجاح.");
        } else {
            throw new Error("مستند الإعدادات غير موجود سحابياً.");
        }
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'data-bridge.js', null, null, 'fetchSystemSettings');
        console.warn("تنويه هندسي: تعذر جلب الإعدادات، تفعيل الإعدادات الاحتياطية.");
        const localSettings = getFromLocalMemory('bosesweets_settings');
        Object.assign(BoseState.siteSettings, localSettings || defaultSettingsFallback);
    }
}

/**
 * 2. جلب مناطق الشحن
 */
export async function fetchShippingZones() {
    try {
        if (!db) throw new Error("قاعدة البيانات غير متصلة.");
        const shipSnap = await getDocs(collection(db, 'shipping'));
        
        if (!shipSnap.empty) {
            BoseState.shippingZones.length = 0; // تفريغ الذاكرة القديمة
            shipSnap.forEach(document => BoseState.shippingZones.push(document.data()));
            saveToLocalMemory('bosesweets_shipping', BoseState.shippingZones);
        } else {
            throw new Error("قائمة الشحن السحابية فارغة.");
        }
    } catch (error) {
        console.warn("تنويه هندسي: استخدام مناطق الشحن الاحتياطية.");
        const localShipping = getFromLocalMemory('bosesweets_shipping');
        BoseState.shippingZones.length = 0;
        BoseState.shippingZones.push(...(localShipping && localShipping.length > 0 ? localShipping : defaultShippingFallback));
    }
}

/**
 * 3. جلب كتالوج المنتجات وفهرستها في الذاكرة
 */
export async function fetchProductsCatalog() {
    try {
        if (!db) throw new Error("قاعدة البيانات غير متصلة.");
        
        const q = query(collection(db, 'catalog'), where('isActive', '==', true));
        const snapshot = await getDocs(q);

        if (snapshot.empty) throw new Error("كتالوج السحابة فارغ.");

        const products = [];
        snapshot.forEach(document => {
            products.push({ id: document.id, ...document.data() });
        });

        BoseState.catalog.length = 0;
        BoseState.catalog.push(...products);
        
        if (typeof syncCatalogMap === 'function') syncCatalogMap();
        saveToLocalMemory('bosesweets_catalog', products);
        
        console.log(`👑 Data Bridge: تم تأمين وضخ ${products.length} منتج في الذاكرة المركزية.`);
        return products;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'data-bridge.js', null, null, 'fetchProductsCatalog');
        console.warn("BoseSweets Guard: الاتصال بالسحابة متذبذب، تفعيل الكتالوج الفولاذي.");
        
        const localMemoryCatalog = getFromLocalMemory('bosesweets_catalog');
        BoseState.catalog.length = 0;
        
        if (localMemoryCatalog && localMemoryCatalog.length > 0) {
            BoseState.catalog.push(...localMemoryCatalog);
        } else {
            BoseState.catalog.push(...defaultCatalogFallback);
        }
        
        if (typeof syncCatalogMap === 'function') syncCatalogMap();
        return BoseState.catalog;
    }
}

/**
 * 👑 المنسق المركزي: دالة التشغيل الرئيسية للجسر
 * تقوم بتشغيل كل عمليات الجلب، ثم تطلق إشارة فتح الموقع للعميل.
 */
export async function initializeDataBridge() {
    console.log("👑 Data Bridge: بدء تدفق البيانات السيادية...");
    
    // تشغيل عمليات الجلب بالتوازي لضمان أقصى سرعة
    await Promise.all([
        fetchSystemSettings(),
        fetchShippingZones(),
        fetchProductsCatalog()
    ]);

    // تحديد التصنيفات النشطة في القائمة
    const uniqueCats = [...new Set(BoseState.catalog.map(p => p.category))].filter(Boolean);
    BoseState.catMenu.length = 0;
    
    if (BoseState.siteSettings.catMenu && BoseState.siteSettings.catMenu.length > 0) {
        BoseState.catMenu.push(...BoseState.siteSettings.catMenu.map(c => c.name || c));
    } else {
        const priorityCategories = ['الرئيسية', 'تورت', 'ورد'];
        priorityCategories.forEach(c => BoseState.catMenu.push(c));
        uniqueCats.forEach(c => {
            if (!priorityCategories.includes(c)) BoseState.catMenu.push(c);
        });
    }

    // إطلاق إشارة الجاهزية لرفع شاشة التحميل
    if (typeof setAppReady === 'function') setAppReady();
    
    // إطلاق حدث عالمي لتحديث الواجهات
    window.dispatchEvent(new Event('catalogDataReady'));
}
window.initializeDataBridge = initializeDataBridge;

// ============================================================================
// 👑 الاستماع اللحظي (Real-time Sync) للكتالوج
// ============================================================================
export function listenToCatalogUpdates() {
    try {
        if (!db) return;
        const q = query(collection(db, 'catalog'), where('isActive', '==', true));
        onSnapshot(q, (snapshot) => {
            const products = [];
            snapshot.forEach(document => products.push({ id: document.id, ...document.data() }));
            
            BoseState.catalog.length = 0;
            BoseState.catalog.push(...products);
            if (typeof syncCatalogMap === 'function') syncCatalogMap();
            saveToLocalMemory('bosesweets_catalog', products);
            
            window.dispatchEvent(new Event('catalogDataReady'));
            if(window.distributeProductsToUI) window.distributeProductsToUI(BoseState.catalog);
        }, (error) => {
            if (window.BoseMonitor) window.BoseMonitor.report(error, 'data-bridge.js', null, null, 'listenToCatalogUpdates');
        });
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'data-bridge.js', null, null, 'listenToCatalogUpdates (Master)');
    }
}
window.listenToCatalogUpdates = listenToCatalogUpdates;

// ============================================================================
// 👑 مستشعر تأمين الطلبات السحابية التابع للجسر (الخزنة المؤقتة)
// ============================================================================
window.addEventListener('secureOrderBackup', async (e) => {
    const orderData = e.detail;
    console.log(`🛡️ BoseSweets Guard: جاري تأمين الطلب [${orderData.orderId}] في قاعدة البيانات المركزية...`);
    try {
        if (db && orderData && orderData.orderId) {
            await setDoc(doc(db, 'orders', orderData.orderId), orderData);
            console.log("✅ BoseSweets Guard: تم توثيق الطلب بنجاح وتأمينه سحابياً.");
        }
    } catch (error) {
        console.error("⚠️ BoseSweets Guard: تعذر تأمين الطلب سحابياً، سيتم الاعتماد على واتساب والذاكرة المؤقتة.", error);
    }
});

// ============================================================================
// 👑 دوال العرض المؤقتة (مُعدلة هندسياً للتوافق مع الذاكرة المركزية والهوية المرجعية)
// ============================================================================
export function renderProductCards(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; font-weight: bold; opacity: 0.6; padding: 20px;">نجهز لكم أصنافاً جديدة فاخرة.. انتظرونا ✨</p>`;
        return;
    }

    let html = '';
    const pinkColor = boseConfig.branding.colors.pink;
    const whiteColor = boseConfig.branding.colors.white;
    const darkColor = boseConfig.branding.colors.dark;

    products.forEach(p => {
        const pIdSafe = String(p.id || '');
        const isOutOfStock = p.inStock === false || p.status === 'غير متاح';
        
        let rawImg = p.img || p.image || (p.images && p.images.length > 0 ? p.images[0] : BOSE_LOGO_FALLBACK);
        let finalImgUrl = "";

        if (rawImg.startsWith('http') || rawImg.startsWith('https')) {
            finalImgUrl = rawImg;
        } else {
            const baseUrl = boseConfig.cloudinary.baseDeliveryUrl.replace(/\/$/, '');
            const cleanPath = rawImg.replace(/^\//, '');
            finalImgUrl = `${baseUrl}/${cleanPath}`;
        }
        
        let badgeHtml = '';
        if (p.badge || p.isNew || p.isBestSeller) {
            let badgeText = p.badge || (p.isNew ? 'وصل حديثاً ✨' : (p.isBestSeller ? 'الأكثر مبيعاً 🔥' : ''));
            badgeHtml = `<div style="position: absolute; top: 15px; right: 15px; z-index: 10; background: ${whiteColor}; color: ${pinkColor}; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; border: 2px solid ${pinkColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">${badgeText}</div>`;
        }

        html += `
        <div id="product-card-${pIdSafe}" class="royal-card flex flex-col p-4 relative" style="background: ${whiteColor}; min-height: 400px; border-radius: 2rem;">
            ${badgeHtml}
            
            <div class="w-full aspect-square overflow-hidden rounded-[1.5rem] relative mb-4" onclick="if(window.navigateToProduct) window.navigateToProduct('${pIdSafe}'); else window.location.href='product.html?product=${pIdSafe}'">
                <img src="${finalImgUrl}" 
                     onerror="this.onerror=null; this.src='${BOSE_LOGO_FALLBACK}';" 
                     class="w-full h-full object-cover transition-transform duration-500 hover:scale-110 cursor-pointer ${isOutOfStock ? 'grayscale opacity-60' : ''}" 
                     alt="${p.name} - حلويات بوسي" 
                     loading="lazy">
                ${isOutOfStock ? `<div style="position: absolute; inset:0; background: rgba(255,255,255,0.5); display:flex; align-items:center; justify-content:center; backdrop-filter: blur(2px);"><span style="background: ${pinkColor}; color: ${whiteColor}; padding: 6px 16px; border-radius: 8px; font-weight: 900; font-size: 0.85rem; border: 2px solid ${whiteColor};">نفدت مؤقتاً</span></div>` : ''}
            </div>

            <div class="flex flex-col flex-1 text-center justify-between space-y-3">
                <div>
                    <h4 class="text-xl font-black" style="color: ${darkColor};">${p.name}</h4>
                    <p class="text-xs font-bold opacity-80 mt-1 line-clamp-2" style="color: ${darkColor}; line-height: 1.7;">${p.desc || p.description || ''}</p>
                </div>

                <div class="mt-auto space-y-3 pt-2" style="border-top: 1px dashed rgba(255,145,164,0.2);">
                    <div class="flex items-center justify-center font-black text-2xl" style="color: ${pinkColor};">
                        <span>${p.price} ج.م</span>
                    </div>
                    
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-pink-100">
                            <button onclick="if(window.updateTempQtyContext) window.updateTempQtyContext(this, -1)" class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-black" style="background: ${whiteColor}; color: ${pinkColor}; border: 1px solid rgba(255,145,164,0.3);">-</button>
                            <span class="temp-qty-display font-black text-sm px-2" style="color: ${darkColor}; min-w: 20px;" data-prod-id="${pIdSafe}">1</span>
                            <button onclick="if(window.updateTempQtyContext) window.updateTempQtyContext(this, 1)" class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-black" style="background: ${whiteColor}; color: ${pinkColor}; border: 1px solid rgba(255,145,164,0.3);">+</button>
                        </div>

                        ${isOutOfStock ? 
                            `<button class="flex-1 py-2.5 rounded-full font-black text-xs cursor-not-allowed" style="background: #ccc; color: ${whiteColor}; border: 2px solid #ccc;">غير متوفر</button>` : 
                            `<button onclick="if(window.addWithQtyContext) window.addWithQtyContext(this, '${pIdSafe}'); else if(window.addToCart) window.addToCart('${pIdSafe}');" class="flex-1 py-2.5 rounded-full font-black text-xs transition-all" style="background: ${pinkColor}; color: ${whiteColor}; border: 2px solid ${pinkColor}; box-shadow: 0 8px 20px rgba(255,145,164,0.2);">إضافة 🛍️</button>`
                        }
                    </div>
                </div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}
window.renderProductCards = renderProductCards;

export function distributeProductsToUI(products) {
    if (!products) products = BoseState.catalog;
    
    if (document.getElementById('new-arrivals-container')) {
        const newProducts = products.filter(p => p.isNew || (p.badge && (p.badge.includes('جديد') || p.badge.includes('🌟'))));
        const fallbackNew = newProducts.length > 0 ? newProducts : products.slice(0, 4);
        renderProductCards(fallbackNew, 'new-arrivals-container');
    }

    if (document.getElementById('best-sellers-container')) {
        const bestSellers = products.filter(p => p.isBestSeller || (p.badge && (p.badge.includes('مبيعاً') || p.badge.includes('🔥'))));
        const fallbackBest = bestSellers.length > 0 ? bestSellers : products.slice().reverse().slice(0, 4);
        renderProductCards(fallbackBest, 'best-sellers-container');
    }

    const suggestedContainer = document.getElementById('suggested-products-container') || document.getElementById('cart-suggestions-container');
    if (suggestedContainer) {
        const mixedSuggestions = [...products].sort(() => 0.5 - Math.random()).slice(0, 4);
        renderProductCards(mixedSuggestions, suggestedContainer.id);
    }

    const menuGrid = document.getElementById('menuGrid');
    if (menuGrid) {
        const activeCategoryItem = document.querySelector('.category-item.active');
        const activeCategory = activeCategoryItem ? activeCategoryItem.dataset.category : 'all';
        
        let filteredProducts = products;
        if (activeCategory && activeCategory !== 'all') {
            filteredProducts = products.filter(p => p.category === activeCategory);
        }
        renderProductCards(filteredProducts, 'menuGrid');
    }
}
window.distributeProductsToUI = distributeProductsToUI;

// التشغيل التلقائي عند فتح الموقع للعميل
document.addEventListener('DOMContentLoaded', () => {
    // التأكد من عدم التشغيل في لوحة الإدارة
    if (!window.location.pathname.includes('admin.html') && !document.title.includes('الإدارة')) {
        initializeDataBridge();
        listenToCatalogUpdates();
    }
});
