/**
 * ============================================================================
 * 👑 BoseSweets Data Bridge | جسر البيانات السيادي (V29.0 - Sovereign Integration)
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي التجارية
 * الحالة الفنية: مراجعة شاملة | تحليل ثغرات | توافقية كاملة
 * الوظيفة: المحرك الرسمي والوحيد لنقل وتوطين البيانات بين Firestore والذاكرة المركزية.
 * التوافق: متوافق كلياً مع (core-engine.js) وأنظمة العرض على الموبايل والكمبيوتر.
 * ============================================================================
 */

import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    onSnapshot,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import coreExports from './core-engine.js';

// استخراج المراجع السيادية من النواة المركزية
const { boseConfig, BoseState } = coreExports;
const syncCatalogMap = window.syncCatalogMap;
const saveToLocalMemory = window.saveToLocalMemory;
const getFromLocalMemory = window.getFromLocalMemory;
const setAppReady = window.setAppReady;

// ============================================================================
// 🛡️ الترسانة الاحتياطية (Data Fortress) - حماية النظام من الانقطاع
// ============================================================================
const BOSE_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg";

export const defaultSettingsFallback = {
    brandName: "حلويات بوسي", 
    announcement: "حلويات بوسي: طعم فاخر يليق بسيادتكم",
    heroTitle: "أهلاً بحضرتك في <br class='hidden md:block'/> <span class='text-[#ff91a4] relative inline-block mt-1 md:mt-2 drop-shadow-md'>حلويات بوسي</span>",
    heroDesc: "نحن في إدارة حلويات بوسي نختار خاماتنا بعناية فائقة لنقدم لحضرتك تجربة تذوق ملكية تعكس التزامنا بالمهنية والجودة.",
    footerPhone: "01097238441", 
    footerAddress: "الكفاح، مركز الفرافرة، محافظة الوادي الجديد",
    brandColorHex: "#ff91a4", 
    bgColor: "#ffffff", 
    textColor: "#1a1a1a",
    tickerActive: true, 
    tickerText: "حلويات بوسي: طعم فاخر يليق بحضرتك ✨ | نتشرف بخدمتكم دائماً في الفرافرة", 
    catMenu: ["الرئيسية", "ديسباسيتو", "سينابون", "تورت", "ورد"]
};

export const defaultShippingFallback = [
    { id: 'sh_1', name: 'الكفاح (داخل القرية)', fee: 0 }, 
    { id: 'sh_2', name: 'مركز الفرافرة', fee: 20 }, 
    { id: 'sh_3', name: 'النهضة', fee: 30 },
    { id: 'sh_4', name: 'أبو منقار', fee: 50 }
];

export const defaultCatalogFallback = [
    { id: 'dp_nutella', name: 'ديسباسيتو نوتيلا', category: 'ديسباسيتو', desc: 'فادج كيك غني يعلوه صوص نوتيلا أصلي مع توازن مثالي للنكهات.', price: 73, size: 'مثلث', img: BOSE_LOGO_FALLBACK, badge: 'الأكثر مبيعاً 🔥', inStock: true, isActive: true },
    { id: 'cn_classic', name: 'سينابون كلاسيك', category: 'سينابون', desc: 'عجينة خميرة قطنية محضرة يدوياً بصوص الجبن الكريمي المخصوص.', price: 50, size: 'قطعة', img: BOSE_LOGO_FALLBACK, badge: 'وصل حديثاً 🌟', inStock: true, isActive: true }
];

// ============================================================================
// 👑 محركات جلب البيانات وضخها في العقل المركزي (BoseState)
// ============================================================================

/**
 * 1. جلب الإعدادات المرجعية وتطبيق الهوية البصرية السيادية
 */
export async function fetchSystemSettings() {
    try {
        if (!db) throw new Error("Database Connection Failed");
        const sSnap = await getDoc(doc(db, 'settings', 'main'));
        
        if (sSnap.exists()) {
            Object.assign(BoseState.siteSettings, sSnap.data());
            saveToLocalMemory('bosesweets_settings', BoseState.siteSettings);
            console.log("👑 Data Bridge: تم جلب الإعدادات المرجعية بنجاح.");
        } else {
            throw new Error("Settings document not found");
        }
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'data-bridge.js', null, null, 'fetchSystemSettings');
        console.warn("🛡️ BoseSweets Guard: تفعيل إعدادات الحماية الاحتياطية.");
        const local = getFromLocalMemory('bosesweets_settings');
        Object.assign(BoseState.siteSettings, local || defaultSettingsFallback);
    }
}

/**
 * 2. جلب مناطق الشحن وتحديث اللوجستيات
 */
export async function fetchShippingZones() {
    try {
        if (!db) throw new Error("Database Connection Failed");
        const shipSnap = await getDocs(collection(db, 'shipping'));
        
        if (!shipSnap.empty) {
            BoseState.shippingZones.length = 0;
            shipSnap.forEach(d => BoseState.shippingZones.push({ id: d.id, ...d.data() }));
            saveToLocalMemory('bosesweets_shipping', BoseState.shippingZones);
        } else {
            throw new Error("Shipping collection is empty");
        }
    } catch (error) {
        console.warn("🛡️ BoseSweets Guard: استخدام قاعدة بيانات الشحن الاحتياطية.");
        const local = getFromLocalMemory('bosesweets_shipping');
        BoseState.shippingZones.length = 0;
        BoseState.shippingZones.push(...(local && local.length > 0 ? local : defaultShippingFallback));
    }
}

/**
 * 3. جلب كتالوج المنتجات وتدشين الفهرسة الشاملة
 */
export async function fetchProductsCatalog() {
    try {
        if (!db) throw new Error("Database Connection Failed");
        const q = query(collection(db, 'catalog'), where('isActive', '==', true));
        const snapshot = await getDocs(q);

        if (snapshot.empty) throw new Error("Cloud catalog is empty");

        const products = [];
        snapshot.forEach(d => products.push({ id: d.id, ...d.data() }));

        BoseState.catalog.length = 0;
        BoseState.catalog.push(...products);
        
        if (typeof syncCatalogMap === 'function') syncCatalogMap();
        saveToLocalMemory('bosesweets_catalog', products);
        
        console.log(`👑 Data Bridge: تم تأمين ${products.length} صنف في الذاكرة.`);
        return products;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'data-bridge.js', null, null, 'fetchProductsCatalog');
        console.warn("🛡️ BoseSweets Guard: تفعيل الكتالوج الفولاذي لضمان الخدمة.");
        
        const local = getFromLocalMemory('bosesweets_catalog');
        BoseState.catalog.length = 0;
        BoseState.catalog.push(...(local && local.length > 0 ? local : defaultCatalogFallback));
        
        if (typeof syncCatalogMap === 'function') syncCatalogMap();
        return BoseState.catalog;
    }
}

/**
 * 👑 المنسق المركزي: تفعيل الجسر وإطلاق إشارة الجاهزية القصوى
 */
export async function initializeDataBridge() {
    console.log("👑 Data Bridge V29: بدء تدفق البيانات السيادية...");
    
    // تنفيذ الجلب المتوازي لسرعة الاستجابة
    await Promise.all([
        fetchSystemSettings(),
        fetchShippingZones(),
        fetchProductsCatalog()
    ]);

    // معالجة تصنيفات القائمة بناءً على التوافر الفعلي
    const uniqueCats = [...new Set(BoseState.catalog.map(p => p.category))].filter(Boolean);
    BoseState.catMenu.length = 0;
    
    if (BoseState.siteSettings.catMenu && BoseState.siteSettings.catMenu.length > 0) {
        BoseState.catMenu.push(...BoseState.siteSettings.catMenu.map(c => c.name || c));
    } else {
        const priority = ['الرئيسية', 'تورت', 'ورد'];
        priority.forEach(c => BoseState.catMenu.push(c));
        uniqueCats.forEach(c => { if (!priority.includes(c)) BoseState.catMenu.push(c); });
    }

    if (typeof setAppReady === 'function') setAppReady();
    window.dispatchEvent(new CustomEvent('catalogDataReady'));
}
window.initializeDataBridge = initializeDataBridge;

// ============================================================================
// 👑 الاستماع اللحظي (Sovereign Real-time Sync)
// ============================================================================
export function listenToSovereignUpdates() {
    if (!db) return;

    // مزامنة الكتالوج اللحظية
    onSnapshot(query(collection(db, 'catalog'), where('isActive', '==', true)), (snap) => {
        const products = [];
        snap.forEach(d => products.push({ id: d.id, ...d.data() }));
        BoseState.catalog.length = 0;
        BoseState.catalog.push(...products);
        if (typeof syncCatalogMap === 'function') syncCatalogMap();
        saveToLocalMemory('bosesweets_catalog', products);
        
        window.dispatchEvent(new Event('catalogDataReady'));
        if (window.distributeProductsToUI) window.distributeProductsToUI(BoseState.catalog);
    });

    // مزامنة الإعدادات اللحظية (الهوية البصرية)
    onSnapshot(doc(db, 'settings', 'main'), (snap) => {
        if (snap.exists()) {
            Object.assign(BoseState.siteSettings, snap.data());
            if (window.applySettingsToUI) window.applySettingsToUI();
        }
    });
}
window.listenToSovereignUpdates = listenToSovereignUpdates;

// ============================================================================
// 🛡️ مستشعر تأمين الطلبات (The Vault)
// ============================================================================
window.addEventListener('secureOrderBackup', async (e) => {
    const orderData = e.detail;
    try {
        if (db && orderData?.orderId) {
            await setDoc(doc(db, 'orders', orderData.orderId), orderData);
            console.log(`✅ BoseSweets Guard: تم توثيق الطلب [${orderData.orderId}] سحابياً.`);
        }
    } catch (error) {
        console.error("⚠️ فشل التوثيق السحابي، الاعتماد على النسخ الاحتياطي المحلي.");
    }
});

// ============================================================================
// 👑 محرك العرض البصري (Royal Product Renderer)
// ============================================================================
export function renderProductCards(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; font-weight: bold; opacity: 0.6; padding: 40px;">نجهز لحضرتك أصنافاً جديدة فاخرة.. انتظرونا ✨</p>`;
        return;
    }

    const pinkColor = "#ff91a4";
    const whiteColor = "#ffffff";
    const darkColor = "#1a1a1a";

    container.innerHTML = products.map(p => {
        const isOutOfStock = p.inStock === false || p.status === 'غير متاح';
        const rawImg = p.img || p.image || (p.images?.[0]) || BOSE_LOGO_FALLBACK;
        const finalImgUrl = rawImg.startsWith('http') ? rawImg : `${boseConfig.cloudinary.baseDeliveryUrl}/${rawImg.replace(/^\//, '')}`;
        
        const badgeHtml = p.badge ? `
            <div style="position: absolute; top: 15px; right: 15px; z-index: 10; background: ${whiteColor}; color: ${pinkColor}; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; border: 2px solid ${pinkColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                ${p.badge}
            </div>` : '';

        return `
        <div class="royal-card flex flex-col p-4 relative" style="background: ${whiteColor}; min-height: 420px; border-radius: 2rem; box-shadow: 0 15px 35px rgba(0,0,0,0.03);">
            ${badgeHtml}
            <div class="w-full aspect-square overflow-hidden rounded-[1.5rem] relative mb-4 cursor-pointer" onclick="window.navigateToProduct('${p.id}')">
                <img src="${finalImgUrl}" 
                     onerror="this.onerror=null; this.src='${BOSE_LOGO_FALLBACK}';" 
                     class="w-full h-full object-cover transition-transform duration-700 hover:scale-110 ${isOutOfStock ? 'grayscale opacity-60' : ''}" 
                     alt="${p.name} - حلويات بوسي" loading="lazy">
                ${isOutOfStock ? `<div style="position: absolute; inset:0; background: rgba(255,255,255,0.5); display:flex; align-items:center; justify-content:center; backdrop-filter: blur(2px);"><span style="background: ${pinkColor}; color: ${whiteColor}; padding: 8px 20px; border-radius: 10px; font-weight: 900; border: 2px solid ${whiteColor};">نفدت مؤقتاً</span></div>` : ''}
            </div>

            <div class="flex flex-col flex-1 text-center justify-between">
                <div>
                    <h4 class="text-xl font-black" style="color: ${darkColor};">${p.name}</h4>
                    <p class="text-xs font-bold opacity-70 mt-2 line-clamp-2" style="line-height: 1.6;">${p.desc || ''}</p>
                </div>

                <div class="mt-4 pt-4" style="border-top: 1px dashed rgba(255,145,164,0.2);">
                    <div class="font-black text-2xl mb-4" style="color: ${pinkColor};">${p.price} ج.م</div>
                    <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-pink-50">
                            <button onclick="window.updateTempQtyContext(this, -1)" class="w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#ff91a4] border border-pink-100 font-black">-</button>
                            <span class="temp-qty-display font-black text-sm px-2" data-prod-id="${p.id}">1</span>
                            <button onclick="window.updateTempQtyContext(this, 1)" class="w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#ff91a4] border border-pink-100 font-black">+</button>
                        </div>
                        <button onclick="window.addWithQtyContext(this, '${p.id}')" 
                                class="flex-1 py-3 rounded-full font-black text-white text-sm transition-all active:scale-95" 
                                style="background: ${pinkColor}; box-shadow: 0 8px 20px rgba(255,145,164,0.2);"
                                ${isOutOfStock ? 'disabled' : ''}>
                            ${isOutOfStock ? 'غير متوفر' : 'إضافة لطلب حضرتك 🛍️'}
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}
window.renderProductCards = renderProductCards;

/**
 * توزيع المنتجات على واجهات الموقع المختلفة
 */
export function distributeProductsToUI(products = BoseState.catalog) {
    const containers = {
        'new-arrivals-container': p => p.isNew || p.badge?.includes('جديد') || p.badge?.includes('🌟'),
        'best-sellers-container': p => p.isBestSeller || p.badge?.includes('مبيعاً') || p.badge?.includes('🔥'),
        'menuGrid': () => true // الفلترة تتم برمجياً داخل قسم المنيو
    };

    Object.entries(containers).forEach(([id, filterFn]) => {
        const el = document.getElementById(id);
        if (!el) return;

        if (id === 'menuGrid') {
            const activeCat = document.querySelector('.category-item.active')?.dataset.category || 'all';
            const filtered = activeCat === 'all' ? products : products.filter(p => p.category === activeCat);
            renderProductCards(filtered, id);
        } else {
            const filtered = products.filter(filterFn);
            renderProductCards(filtered.length > 0 ? filtered : products.slice(0, 4), id);
        }
    });
}
window.distributeProductsToUI = distributeProductsToUI;

// ============================================================================
// 🎬 التشغيل التلقائي السيادي
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const isNotAdmin = !window.location.pathname.includes('admin') && !document.title.includes('الإدارة');
    if (isNotAdmin) {
        initializeDataBridge();
        listenToSovereignUpdates();
    }
});