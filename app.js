/**
 * 👑 BoseSweets Main Orchestrator (V20.0 - Sovereign Client Sync Edition)
 * القلب النابض للمحرك الرئيسي - حلويات بوسي 
 * تم دمج بروتوكول "الاستماع السيادي" (Sovereign Sync Listener) ليقوم بمسح الكاش
 * وتحديث الواجهة لحظياً فور قيام الإدارة بحفظ أي تعديل، دون إجبار العميل على إعادة التحميل.
 */

import { defaultSettings, defaultShipping, defaultCatalog, detailedDescriptions, dSizes, fTypes } from './config.js';
import { siteSettings, shippingZones, catalog, galleryData, catMenu, isAppReady, state, currentBuilderStep, cakeState, catalogMap, syncCatalogMap, setAppReady } from './state.js';
import { MemoryManager, hexToMathHSL, escapeHTML, generateUniqueID, optimizeCloudinaryUrl, generateSecureOrderId, showSystemToast, BehavioralAnalytics, AdvancedNetworkEngine } from './utils.js';
import { ClientStorageEngine } from './storage.js';
import { LiveSearchEngine, performLiveSearchDebounced, toggleLiveSearch, performLiveSearch } from './search.js';
import { saveCartToStorage, clearCartStorage, calculateCartTotal, syncCartUI, updateTempQtyContext, addWithQtyContext, modQ, commitCakeBuilderToCart, submitOrderFinal, dispatchWhatsAppOrder, processBoseSweetsOrder, updateCartDisplay } from './cart.js';
import { getCapsuleDescription, getFinalDescription, applySettingsToUI, toggleCustomerMenu, renderCustomerSidebarCategories, renderCustomerGallery, shareProduct, initWaterfall, setupSliderButtons, renderCategories, setActiveCategoryPill, renderFlowerTabs, renderMainDisplay, initHomepageSections } from './ui.js';

const db = window.firebase ? window.firebase.firestore() : undefined;

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

let lastSyncTime = Date.now();

// 👑 بروتوكول الاستماع السيادي (Sovereign Sync Listener)
function setupSovereignSyncListener() {
    if (!db) return;
    db.collection('system').doc('syncFlag').onSnapshot(async doc => {
        if (doc.exists) {
            const data = doc.data();
            // إذا كان التحديث القادم من الإدارة أحدث من وقت فتح العميل للموقع
            if (data.lastAdminUpdate > lastSyncTime) {
                console.log("👑 إشارة سيادية: تم رصد تحديث من الإدارة. جاري المزامنة اللحظية...");
                lastSyncTime = Date.now();
                showSystemToast("جاري مزامنة أحدث عروض وأصناف حلويات بوسي اللحظية ✨", "info");
                
                await bootSystemCore(); 
                syncBoseSweetsLayout();
                initUI();
                
                // تحديث السلة لتطبيق أي تغيير في الأسعار
                if(typeof syncCartUI === 'function') syncCartUI();
            }
        }
    }, error => {
        console.warn("BoseSweets: تعذر الاستماع للبث السيادي الخلفي.");
    });
}

async function bootSystemCore() {
    console.log("👑 حلويات بوسي: بدء تشغيل المحرك الرئيسي...");
    
    setAppReady();
    if(state) state.isAppReady = true;

    try {
        if (!db) {
            console.warn("حلويات بوسي: قاعدة البيانات غير متصلة، جاري تفعيل نظام الطوارئ.");
            fallbackToEmergencyData();
            return;
        }

        try {
            const sSnap = await db.collection('settings').doc('main').get();
            if (sSnap.exists) {
                Object.assign(siteSettings, sSnap.data());
                // حفظ التوسعات الجديدة في الذاكرة
                if(sSnap.data().social) siteSettings.social = sSnap.data().social;
                if(sSnap.data().dynamicSections) siteSettings.dynamicSections = sSnap.data().dynamicSections;
            }
        } catch(e) { }

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

        try {
            const gSnap = await db.collection('gallery').orderBy('timestamp', 'desc').limit(15).get();
            galleryData.length = 0;
            gSnap.forEach(doc => galleryData.push({ id: doc.id, ...doc.data() }));
        } catch(e) { }

    } catch (e) {
        fallbackToEmergencyData();
    }
}

function fallbackToEmergencyData() {
    if (catalog.length === 0 && typeof defaultCatalog !== 'undefined') {
        console.log("حلويات بوسي: تفعيل الكتالوج الاحتياطي لضمان استمرارية الخدمة.");
        catalog.push(...defaultCatalog);
    }
}

function syncBoseSweetsLayout() {
    const uniqueCats = [...new Set(catalog.map(p => p.category))].filter(Boolean);
    catMenu.length = 0;
    
    // استدعاء الترتيب المخصص إذا تم حفظه من الإدارة
    if (siteSettings.catMenu && siteSettings.catMenu.length > 0) {
        catMenu.push(...siteSettings.catMenu.map(c => c.name || c));
    } else {
        const priorityCategories = ['الرئيسية', 'تورت', 'ورد'];
        priorityCategories.forEach(c => catMenu.push(c));
        uniqueCats.forEach(c => {
            if (!priorityCategories.includes(c)) catMenu.push(c);
        });
    }

    syncCatalogMap();
    if(typeof LiveSearchEngine !== 'undefined' && LiveSearchEngine.build) {
        LiveSearchEngine.build(catalog);
    }
}

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
    } catch(e) { }
}

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

async function syncOfflineOrders() {
    if (!navigator.onLine || !db) return;
    
    if (typeof ClientStorageEngine !== 'undefined') {
        try {
            const pendingOrders = await ClientStorageEngine.getQueuedOrders();
            if (pendingOrders && pendingOrders.length > 0) {
                for (let order of pendingOrders) {
                    if (window.NetworkEngine) {
                        window.NetworkEngine.safeWrite('orders', order.id, order);
                    } else if (typeof AdvancedNetworkEngine !== 'undefined') {
                        AdvancedNetworkEngine.syncWithRetry('orders', order);
                    }
                    await ClientStorageEngine.removeQueuedOrder(order.id);
                }
            }
        } catch (e) {}
    }

    if (window.NetworkEngine && typeof window.NetworkEngine.processQueue === 'function') {
        window.NetworkEngine.processQueue();
    }
}

window.addEventListener('online', () => {
    syncOfflineOrders();
    showSystemToast('تمت استعادة الاتصال بالشبكة، جاري مزامنة البيانات.', 'success');
});

window.addEventListener('offline', () => {
    showSystemToast('لا يوجد اتصال بالإنترنت حالياً، السلة وبياناتك محفوظة بأمان.', 'error');
});

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

function registerBoseSweetsPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(registration => {
            console.log('حلويات بوسي: تم تأكيد تسجيل محرك التطبيق بنجاح.', registration.scope);
        }).catch(error => {
            console.log('حلويات بوسي: تأخير في تسجيل محرك التطبيق.', error);
        });
    }
}

async function startBoseSweetsEngine() {
    if (window.location.pathname.includes('admin.html') || document.title.includes('الإدارة') || document.getElementById('admin-orders-tbody')) { return; }

    registerBoseSweetsPWA();        
    await bootSystemCore();         
    syncBoseSweetsLayout();         
    
    // 👑 تفعيل الاستماع للبث السيادي
    setupSovereignSyncListener();

    initUI();                       
    recoverBoseSweetsCart();        
    syncOfflineOrders();            
    
    console.log("👑 حلويات بوسي: المنظومة تعمل الآن بكامل طاقتها واستقرارها.");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBoseSweetsEngine);
} else {
    startBoseSweetsEngine();
}

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
    
    if (event.target && event.target.closest('.cat-pill')) {
        const btn = event.target.closest('.cat-pill');
        if(typeof BehavioralAnalytics !== 'undefined') {
            BehavioralAnalytics.trackCategoryClick(btn.innerText.trim());
        }
    }
});