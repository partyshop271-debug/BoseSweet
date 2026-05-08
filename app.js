/**
 * 👑 BoseSweets Main Orchestrator (V6.5 - Full Architecture Edition)
 * القلب النابض للمحرك الرئيسي - حلويات بوسي - النسخة المستقرة والمؤمنة بالكامل
 * المحرك السيادي لربط البيانات بالواجهة الرسومية وضمان استمرارية العمل
 * تم كسر العزل التقني، إعادة ربط المتغيرات بالنطاق العام، وتطبيق التزامن الشامل
 */

import { defaultSettings, defaultShipping, defaultCatalog, detailedDescriptions, dSizes, fTypes } from './config.js';
import { siteSettings, shippingZones, catalog, galleryData, catMenu, isAppReady, state, currentBuilderStep, cakeState, catalogMap, syncCatalogMap, setAppReady } from './state.js';
import { MemoryManager, hexToMathHSL, escapeHTML, generateUniqueID, optimizeCloudinaryUrl, generateSecureOrderId, showSystemToast } from './utils.js';
import { ClientStorageEngine } from './storage.js';
import { LiveSearchEngine, performLiveSearchDebounced, toggleLiveSearch, performLiveSearch } from './search.js';
import { saveCartToStorage, clearCartStorage, calculateCartTotal, syncCartUI, updateTempQtyContext, addWithQtyContext, modQ, commitCakeBuilderToCart, submitOrderFinal, dispatchWhatsAppOrder, processBoseSweetsOrder, updateCartDisplay } from './cart.js';
import { getCapsuleDescription, getFinalDescription, applySettingsToUI, toggleCustomerMenu, renderCustomerSidebarCategories, renderCustomerGallery, shareProduct, initWaterfall, setupSliderButtons, renderCategories, setActiveCategoryPill, renderFlowerTabs, renderMainDisplay, initHomepageSections } from './ui.js';

// كسر العزل التقني وإعادة ربط قاعدة البيانات بالمحرك
const db = window.firebase ? window.firebase.firestore() : undefined;

// 👑 ربط الدوال الحيوية والحالة (State) بالنطاق العام (Window Scope) لتعمل مع واجهات HTML بثبات تام
// هذا الإجراء يمنع شلل أزرار التنقل ويضمن استجابة الواجهة لأوامر المستخدم
window.state = state;
window.siteSettings = siteSettings;
window.catalog = catalog;
window.catMenu = catMenu;
window.galleryData = galleryData;

window.performLiveSearchDebounced = performLiveSearchDebounced;
window.toggleLiveSearch = toggleLiveSearch;
window.performLiveSearch = performLiveSearch;
window.updateTempQtyContext = updateTempQtyContext;
window.addWithQtyContext = addWithQtyContext;
window.modQ = modQ;
window.commitCakeBuilderToCart = commitCakeBuilderToCart;
window.submitOrderFinal = submitOrderFinal;
window.dispatchWhatsAppOrder = dispatchWhatsAppOrder;
window.processBoseSweetsOrder = processBoseSweetsOrder;
window.updateCartDisplay = updateCartDisplay;
window.MemoryManager = MemoryManager;
window.LiveSearchEngine = LiveSearchEngine;
window.renderMainDisplay = renderMainDisplay;
window.renderCategories = renderCategories;
window.initWaterfall = initWaterfall;
window.initHomepageSections = initHomepageSections;

/**
 * دقة متناهية في ترتيب عمليات الإقلاع (نظام الإقلاع المحمي - Protected Boot Sequence)
 * يضمن تشغيل الواجهة الرسومية فوراً وعدم التأثر بأعطال الشبكة أو تأخير قاعدة البيانات
 */
async function bootSystemCore() {
    console.log("👑 حلويات بوسي: بدء تشغيل المحرك الرئيسي...");
    
    // 👑 فتح بوابات الواجهة الرسومية فوراً لمنع الشاشة البيضاء نهائياً
    setAppReady();
    if(state) state.isAppReady = true;

    try {
        if (!db) {
            console.warn("حلويات بوسي: قاعدة البيانات غير متصلة، جاري تفعيل نظام الطوارئ.");
            fallbackToEmergencyData();
            return;
        }

        // 1. جلب الإعدادات (الشريط واللوجو) - معزولة للحماية
        try {
            const sSnap = await db.collection('settings').doc('main').get();
            if (sSnap.exists) Object.assign(siteSettings, sSnap.data());
        } catch(e) { 
            console.warn("حلويات بوسي: تم تجاوز خطأ في جلب الإعدادات، سيتم استخدام الإعدادات الافتراضية."); 
        }

        // 2. جلب المنتجات (الكتالوج) - محمية من أخطاء الفهرسة وقواعد الأمان
        try {
            const pSnap = await db.collection('catalog').where('isActive', '==', true).get();
            if (!pSnap.empty) {
                catalog.length = 0;
                pSnap.forEach(doc => catalog.push({ id: doc.id, ...doc.data() }));
                console.log(`حلويات بوسي: تم استيراد ${catalog.length} منتج بنجاح.`);
            } else {
                throw new Error("قاعدة البيانات لا تحتوي على منتجات نشطة حالياً.");
            }
        } catch(e) {
            console.warn("حلويات بوسي: خطأ في فلترة المنتجات، جاري إجراء فحص شامل للكتالوج...");
            try {
                const pSnap2 = await db.collection('catalog').get();
                if (!pSnap2.empty) {
                    catalog.length = 0;
                    pSnap2.forEach(doc => {
                        if(doc.data().isActive !== false) catalog.push({ id: doc.id, ...doc.data() });
                    });
                } else {
                    fallbackToEmergencyData();
                }
            } catch(err) {
                fallbackToEmergencyData();
            }
        }

        // 3. جلب صور الشلال - معزولة للحماية
        try {
            const gSnap = await db.collection('gallery').orderBy('timestamp', 'desc').limit(15).get();
            galleryData.length = 0;
            gSnap.forEach(doc => galleryData.push({ id: doc.id, ...doc.data() }));
        } catch(e) { 
            console.warn("حلويات بوسي: تم تجاوز خطأ في جلب صور سابقة الأعمال."); 
        }

    } catch (e) {
        console.error("حلويات بوسي: خطأ حرج في المحرك الأساسي:", e);
        fallbackToEmergencyData();
    }
}

/**
 * دالة الطوارئ لضمان وجود محتوى دائم وعدم انهيار الواجهة
 * تعتمد على البيانات المدمجة في config.js في حال فشل السحابة
 */
function fallbackToEmergencyData() {
    if (catalog.length === 0 && typeof defaultCatalog !== 'undefined') {
        console.log("حلويات بوسي: تفعيل الكتالوج الاحتياطي لضمان استمرارية الخدمة.");
        catalog.push(...defaultCatalog);
    }
}

/**
 * دالة استكمال الربط ومزامنة الكتالوج
 */
function syncBoseSweetsLayout() {
    const uniqueCats = [...new Set(catalog.map(p => p.category))].filter(Boolean);
    catMenu.length = 0;
    
    const priorityCategories = ['الرئيسية', 'تورت', 'ورد'];
    priorityCategories.forEach(c => catMenu.push(c));
    
    uniqueCats.forEach(c => {
        if (!priorityCategories.includes(c)) catMenu.push(c);
    });

    syncCatalogMap();
    if(typeof LiveSearchEngine !== 'undefined' && LiveSearchEngine.build) {
        LiveSearchEngine.build(catalog);
    }
}

/**
 * معالجة سلة المشتريات المؤمنة واسترجاعها
 */
async function recoverBoseSweetsCart() {
    if(typeof ClientStorageEngine === 'undefined') return;
    try {
        const savedCart = await ClientStorageEngine.get('bose_cart');
        if (savedCart && Array.isArray(savedCart)) {
            state.cart.length = 0;
            state.cart.push(...savedCart);
        }
        if(db) {
            const shipSnap = await db.collection('shipping').get();
            if (!shipSnap.empty) {
                shippingZones.length = 0;
                shipSnap.forEach(doc => shippingZones.push(doc.data()));
            }
        }
    } catch(e) { 
        console.warn("حلويات بوسي: تعذر استرجاع السلة، سيتم بدء سلة جديدة."); 
    }
}

/**
 * تشغيل واجهة المستخدم الرسومية (UI) وتوزيع المهام
 */
function initUI() {
    const urlParams = new URLSearchParams(window.location.search);
    const routeCat = urlParams.get('category');

    state.activeCat = (routeCat && catMenu.includes(routeCat)) ? routeCat : 'الرئيسية';

    applySettingsToUI();
    renderCategories();

    if (state.activeCat === 'الرئيسية') {
        if (typeof window.showHomeView === 'function') window.showHomeView();
        initWaterfall();
        initHomepageSections();
    } else {
        if (typeof window.showMenuView === 'function') window.showMenuView();
        renderMainDisplay();
    }

    if (document.getElementById('gallery-customer-section') && typeof renderCustomerGallery === 'function') {
        renderCustomerGallery();
    }

    if(typeof syncCartUI === 'function') syncCartUI();
    if (window.lucide) lucide.createIcons();

    if (typeof window.renderSmartSuggestions === 'function') window.renderSmartSuggestions('main');

    const phoneDisplay = document.getElementById('footer-phone-display');
    if (phoneDisplay && siteSettings) {
        phoneDisplay.innerText = siteSettings.footerPhone || '';
    }

    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
}

/**
 * مزامنة الطلبات المعلقة في وضع عدم الاتصال (Offline Persistence)
 */
async function syncOfflineOrders() {
    if (!navigator.onLine || !db || typeof ClientStorageEngine === 'undefined') return;
    try {
        const pendingOrders = await ClientStorageEngine.getQueuedOrders();
        if (!pendingOrders || pendingOrders.length === 0) return;
        
        console.log(`حلويات بوسي: جاري مزامنة ${pendingOrders.length} طلبات معلقة من وضع الأوفلاين.`);
        for (let order of pendingOrders) {
            try {
                await db.collection('orders').doc(String(order.id)).set(order);
                await ClientStorageEngine.removeQueuedOrder(order.id);
            } catch (e) { 
                console.warn(`حلويات بوسي: فشل مزامنة الطلب رقم ${order.id}`);
            }
        }
    } catch (e) {}
}

window.addEventListener('online', syncOfflineOrders);

let isScrolling = false;
window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            const n = document.getElementById('navbar');
            if (n) { if (window.scrollY > 30) n.classList.add('nav-scrolled'); else n.classList.remove('nav-scrolled'); }
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

/**
 * 👑 إقلاع المحرك بشكل تسلسلي متزامن وآمن (Synchronous Boot)
 */
async function startBoseSweetsEngine() {
    // منع تشغيل محرك العميل داخل لوحة الإدارة
    if (window.location.pathname.includes('admin.html') || document.title.includes('الإدارة') || document.getElementById('admin-orders-tbody')) { return; }

    await bootSystemCore();         // 1. جلب البيانات من السحابة (معزول ومحمي)
    syncBoseSweetsLayout();         // 2. بناء الهيكل والروابط
    initUI();                       // 3. تفعيل الواجهة وعرض المنتجات

    recoverBoseSweetsCart();        // 4. استرجاع السلة والمناطق
    syncOfflineOrders();            // 5. مزامنة العمليات الخلفية
    
    console.log("👑 حلويات بوسي: المنظومة تعمل الآن بكامل طاقتها واستقرارها.");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBoseSweetsEngine);
} else {
    startBoseSweetsEngine();
}

/**
 * التقاط أوامر الإضافة للسلة من كافة أنحاء الواجهة بشكل ديناميكي
 */
document.addEventListener('click', function(event) {
    if (event.target && event.target.closest('.add-to-cart-btn')) {
        event.preventDefault();
        const button = event.target.closest('.add-to-cart-btn');
        const card = button.closest('.product-card') || button.closest('.product-item');
        if (!card) return;
        
        const productId = card.getAttribute('data-id') || Date.now().toString();
        const productName = card.querySelector('.product-title, .product-name').innerText;
        const priceText = card.querySelector('.product-price').innerText;
        const productPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        
        if(typeof processBoseSweetsOrder === 'function') processBoseSweetsOrder(productId, productName, productPrice);
    }
});
