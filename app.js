/**
 * 👑 BoseSweets Main Orchestrator (V22.1 - Sovereign Shield Edition)
 * القلب النابض للمحرك الرئيسي - حلويات بوسي 
 * التحصين الأخير: إجبار محرك البيانات على انتظار Firebase ومنع الانهيار الفوري.
 */

import { defaultSettings, defaultShipping, defaultCatalog, detailedDescriptions, dSizes, fTypes } from './config.js';
import { 
    siteSettings, shippingZones, catalog, galleryData, catMenu, isAppReady, state, 
    currentBuilderStep, cakeState, catalogMap, syncCatalogMap, setAppReady, fetchAndSyncBoseSweetsData 
} from './state.js';
import { MemoryManager, hexToMathHSL, escapeHTML, generateUniqueID, optimizeCloudinaryUrl, generateSecureOrderId, showSystemToast, BehavioralAnalytics, AdvancedNetworkEngine } from './utils.js';
import { ClientStorageEngine } from './storage.js';
import { LiveSearchEngine, performLiveSearchDebounced, toggleLiveSearch, performLiveSearch } from './search.js';
import { saveCartToStorage, clearCartStorage, calculateCartTotal, syncCartUI, updateTempQtyContext, addWithQtyContext, modQ, commitCakeBuilderToCart, submitOrderFinal, dispatchWhatsAppOrder, processBoseSweetsOrder, updateCartDisplay } from './cart.js';
import { getCapsuleDescription, getFinalDescription, applySettingsToUI, toggleCustomerMenu, renderCustomerSidebarCategories, renderCustomerGallery, shareProduct, initWaterfall, setupSliderButtons, renderCategories, setActiveCategoryPill, renderFlowerTabs, renderMainDisplay, initHomepageSections } from './ui.js';

// تعريف قاعدة البيانات عالمياً لضمان التوافق مع كافة المحركات (مع آلية تأخير آمنة)
let db = window.firebase ? window.firebase.firestore() : undefined;
window.db = db;

// تصدير الوظائف للنافذة العالمية لضمان عمل الواجهة التفاعلية
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

/**
 * 👑 بروتوكول الاستماع السيادي (Sovereign Sync Listener)
 */
function setupSovereignSyncListener() {
    if (!db) return;
    
    db.collection('system').doc('syncFlag').onSnapshot(async doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.lastAdminUpdate > lastSyncTime || data.forceRefresh) {
                console.log("👑 إشارة سيادية: تم رصد تحديث من مركز قيادة حلويات بوسي. جاري التطهير والمزامنة اللحظية...");
                lastSyncTime = Date.now();
                
                localStorage.removeItem('boseSweets_catalog');
                localStorage.removeItem('bSweets_catalog');
                localStorage.removeItem('boseSweets_settings');
                localStorage.removeItem('boseSweets_catalog_timestamp');
                
                if (typeof ClientStorageEngine !== 'undefined' && ClientStorageEngine.remove) {
                    await ClientStorageEngine.remove('catalog');
                    await ClientStorageEngine.remove('settings');
                }
                
                await startBoseSweetsEngine(true);
            }
        }
    }, error => {
        console.warn("تنبيه: محرك المزامنة اللحظية في وضع الاستعداد (Sovereign Listener Standby).");
    });
}

/**
 * 👑 محرك التشغيل الرئيسي (BoseSweets Engine)
 */
async function startBoseSweetsEngine(isUpdate = false) {
    if (!isUpdate && (window.location.pathname.includes('admin.html') || document.title.includes('الإدارة'))) return;

    if (!isUpdate) {
        console.log("👑 حلويات بوسي: بدء تشغيل المحرك الرئيسي...");
        registerBoseSweetsPWA();
    }

    try {
        // تأمين وتأكيد الاتصال بـ Firebase (تأخير مقصود لتجاوز defer)
        if (!db && window.firebase) {
             db = window.firebase.firestore();
             window.db = db;
        }

        if (!db) {
            console.warn("حلويات بوسي: قاعدة البيانات غير متصلة، جاري تفعيل نظام الطوارئ الفولاذي.");
            fallbackToEmergencyData();
            initUI();
            return;
        }

        try {
            const sSnap = await db.collection('settings').doc('main').get();
            if (sSnap.exists) {
                Object.assign(siteSettings, sSnap.data());
                if(sSnap.data().social) siteSettings.social = sSnap.data().social;
                if(sSnap.data().dynamicSections) siteSettings.dynamicSections = sSnap.data().dynamicSections;
            }
        } catch(e) { console.error("عطل في جلب الإعدادات:", e); }

        const catalogStatus = await fetchAndSyncBoseSweetsData(async () => {
            try {
                const pSnap = await db.collection('catalog').get();
                if (!pSnap.empty) {
                    return pSnap.docs.map(doc => {
                        const data = doc.data();
                        if (data.isActive === undefined || data.isActive === null) data.isActive = true;
                        if (data.inStock === undefined || data.inStock === null) data.inStock = true;
                        return { id: doc.id, ...data };
                    }).filter(d => d.isActive === true); 
                } else {
                    return [];
                }
            } catch (err) {
                throw err;
            }
        }, 'boseSweets_catalog');

        if (catalogStatus && catalogStatus.length > 0) {
            catalog.length = 0;
            catalog.push(...catalogStatus);
            console.log(`حلويات بوسي: تم مزامنة ${catalog.length} منتج بنجاح وبدقة متناهية.`);
        } else {
            console.warn("حلويات بوسي: الكتالوج السحابي فارغ أو لم يستجب، تفعيل الذاكرة الفولاذية.");
            fallbackToEmergencyData();
        }

        try {
            const gSnap = await db.collection('gallery').orderBy('timestamp', 'desc').limit(15).get();
            galleryData.length = 0;
            gSnap.forEach(doc => galleryData.push({ id: doc.id, ...doc.data() }));
        } catch(e) { }

        syncBoseSweetsLayout();
        setAppReady();
        if(state) state.isAppReady = true;

        if (isUpdate) {
            if (typeof renderCategories === 'function') renderCategories();
            
            if (state.activeCat === 'الرئيسية') {
                if (typeof initWaterfall === 'function' && catalog.length > 0) initWaterfall();
                if (typeof initHomepageSections === 'function') initHomepageSections();
            } else {
                if (typeof renderMainDisplay === 'function') renderMainDisplay();
            }
            if(typeof syncCartUI === 'function') syncCartUI();
            showSystemToast("تم تحديث القائمة بأحدث إصدارات وأسعار حلويات بوسي 👑", "success");
        } else {
            initUI();
            recoverBoseSweetsCart();
            syncOfflineOrders();
            setupSovereignSyncListener();
            console.log("👑 حلويات بوسي: المنظومة تعمل الآن بكامل طاقتها واستقرارها.");
        }

    } catch (e) {
        console.error("عطل في إقلاع المحرك الرئيسي:", e);
        fallbackToEmergencyData();
        initUI();
    }
}

function fallbackToEmergencyData() {
    if (catalog.length === 0) {
        console.log("حلويات بوسي: تفعيل الكتالوج الاحتياطي لضمان استمرارية الخدمة.");
        // محاولة الاعتماد على التخزين المحلي أولاً، ثم الملفات الثابتة
        const localMemory = typeof window !== 'undefined' && localStorage.getItem('boseSweets_catalog');
        if(localMemory) {
            try {
                const parsed = JSON.parse(localMemory);
                if(Array.isArray(parsed) && parsed.length > 0) catalog.push(...parsed);
            } catch(e){}
        }
        
        if(catalog.length === 0 && typeof defaultCatalog !== 'undefined') {
             catalog.push(...defaultCatalog);
        }
    }
}

function syncBoseSweetsLayout() {
    const uniqueCats = [...new Set(catalog.map(p => p.category))].filter(Boolean);
    catMenu.length = 0;
    
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
    if(typeof applySettingsToUI === 'function') applySettingsToUI();
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    const routeCat = urlParams.get('category');

    if (productId) {
        if (typeof window.showProductDetails === 'function') window.showProductDetails(productId);
    } else if (routeCat && catMenu.includes(routeCat)) {
        if (typeof window.setCategory === 'function') window.setCategory(routeCat);
    } else {
        state.activeCat = 'الرئيسية';
        if (typeof window.showHomeView === 'function') window.showHomeView();
        if (typeof initWaterfall === 'function') initWaterfall();
        if (typeof initHomepageSections === 'function') initHomepageSections();
    }
    
    if (typeof window.renderCategories === 'function') window.renderCategories();
    
    if (document.getElementById('gallery-customer-section') && typeof renderCustomerGallery === 'function') {
        renderCustomerGallery();
    }

    if(typeof syncCartUI === 'function') syncCartUI();
    if (window.lucide) window.lucide.createIcons();

    if (typeof window.renderSmartSuggestions === 'function') {
        window.renderSmartSuggestions('main');
    }

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

// الانطلاق القاطع (مع مهلة صغيرة لضمان تحميل الـ Firebase)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => startBoseSweetsEngine(false), 200); // 200ms grace period
    });
} else {
    setTimeout(() => startBoseSweetsEngine(false), 200);
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