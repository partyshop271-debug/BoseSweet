/**
 * 👑 BoseSweets Main Orchestrator (V28.1 - Sovereign Execution Protocol)
 * المحرك الرئيسي للإدارة المرجعية - حلويات بوسي
 * تم التحصين الشامل: إزالة تعارضات التوجيه وتأمين مسارات التنقل (Routing Overrides)
 * لضمان عدم اختفاء الأقسام أو تصادم الواجهات عند الإقلاع.
 */

import { defaultSettings, defaultShipping, defaultCatalog, detailedDescriptions, dSizes, fTypes } from './config.js';
import { 
    siteSettings, shippingZones, catalog, galleryData, catMenu, isAppReady, state, 
    currentBuilderStep, cakeState, catalogMap, syncCatalogMap, setAppReady, fetchAndSyncBoseSweetsData, getFromLocalMemory 
} from './state.js';
import { MemoryManager, hexToMathHSL, escapeHTML, generateUniqueID, optimizeCloudinaryUrl, generateSecureOrderId, showSystemToast, BehavioralAnalytics, AdvancedNetworkEngine } from './utils.js';
import { ClientStorageEngine } from './storage.js';
import { LiveSearchEngine, performLiveSearchDebounced, toggleLiveSearch, performLiveSearch } from './search.js';
import { saveCartToStorage, clearCartStorage, calculateCartTotal, addWithQtyContext, modQ, commitCakeBuilderToCart, submitOrderFinal, dispatchWhatsAppOrder, processBoseSweetsOrder, updateCartDisplay } from './cart.js';
import { getCapsuleDescription, getFinalDescription, applySettingsToUI, toggleCustomerMenu, renderCustomerSidebarCategories, renderCustomerGallery, shareProduct, initWaterfall, setupSliderButtons, renderCategories, setActiveCategoryPill, renderFlowerTabs, renderMainDisplay, initHomepageSections, renderTicker, showHomeView, updateTempQtyContext, renderCartList, syncCartUI, showMenuView, setCategory } from './ui.js';

let db = (typeof window !== 'undefined' && window.firebase) ? window.firebase.firestore() : undefined;
window.db = db;

window.state = state;
window.siteSettings = siteSettings;
window.catalog = catalog;
window.catMenu = catMenu;
window.galleryData = galleryData;
window.performLiveSearchDebounced = performLiveSearchDebounced;
window.toggleLiveSearch = toggleLiveSearch;
window.performLiveSearch = performLiveSearch;

// 👑 ربط الدوال الرئيسية بجذر المتصفح لضمان توافرها أثناء البناء
window.updateTempQtyContext = updateTempQtyContext;
window.addWithQtyContext = addWithQtyContext;
window.renderCartList = renderCartList;
window.showHomeView = showHomeView;
window.showMenuView = showMenuView;
window.setCategory = setCategory;
window.syncCartUI = syncCartUI;

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
window.applySettingsToUI = applySettingsToUI;
window.renderTicker = renderTicker;
window.syncCatalogMap = syncCatalogMap;

let lastSyncTime = Date.now();

async function startBoseSweetsEngine(isUpdate = false) {
    if (!isUpdate && (window.location.pathname.includes('admin.html') || document.title.includes('الإدارة'))) return;

    if (!isUpdate) {
        console.log("👑 حلويات بوسي: بدء تشغيل محرك الإقلاع السيادي (V28.1)...");
        registerBoseSweetsPWA();
    }

    try {
        if (typeof window.applySettingsToUI === 'function') window.applySettingsToUI();
        if (typeof window.renderTicker === 'function') window.renderTicker();
        
        if (!isUpdate) forceRenderCoreUI();

        if (!db && typeof window !== 'undefined' && window.firebase) {
             db = window.firebase.firestore();
             window.db = db;
        }

        if (db) {
            try {
                const sSnap = await db.collection('settings').doc('main').get();
                if (sSnap.exists) {
                    Object.assign(siteSettings, sSnap.data());
                    if(sSnap.data().social) siteSettings.social = sSnap.data().social;
                    if(sSnap.data().dynamicSections) siteSettings.dynamicSections = sSnap.data().dynamicSections;
                    if(typeof applySettingsToUI === 'function') applySettingsToUI();
                }
            } catch(e) { console.error("BoseSweets: عطل في جلب الإعدادات المرجعية.", e); }
        }

        const fetchPromise = async () => {
            if (!db) throw new Error("تأخير أو غياب في تهيئة محرك قواعد البيانات.");
            const snapshot = await db.collection('catalog').get(); 
            if (snapshot.empty) throw new Error("البيانات المستلمة من الخوادم فارغة.");
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        };

        const isDataSynced = await fetchAndSyncBoseSweetsData(fetchPromise, 'bosesweets_catalog');

        if (isDataSynced) {
            console.log(`👑 حلويات بوسي: تم التصديق على البيانات وضخها في المحرك بنجاح.`);
        } else {
            throw new Error("فشل المزامنة المركزية، سيتم تفعيل الذاكرة الفولاذية.");
        }

        if (db) {
            try {
                const gSnap = await db.collection('gallery').orderBy('timestamp', 'desc').limit(15).get();
                galleryData.length = 0;
                gSnap.forEach(doc => galleryData.push({ id: doc.id, ...doc.data() }));
            } catch(e) { }
        }

        syncBoseSweetsLayout();
        setAppReady();
        if(state) state.isAppReady = true;

        forceRenderDynamicUI();
        
        if (isUpdate) {
            if(typeof syncCartUI === 'function') syncCartUI();
            showSystemToast("تم تحديث القائمة بأحدث إصدارات وأسعار حلويات بوسي 👑", "success");
        } else {
            handleInitialRouting();
            recoverBoseSweetsCart();
            syncOfflineOrders();
            setupSovereignSyncListener();
            console.log("👑 حلويات بوسي: المنظومة تعمل الآن بكامل طاقتها واستقرارها السيادي.");
        }

    } catch (error) {
        console.warn("تنبيه للإدارة: رصد تأخير أو خلل شبكي، تم تفعيل بروتوكول الطوارئ.", error);
        fallbackToEmergencyData();
        syncBoseSweetsLayout();
        forceRenderDynamicUI();
        setAppReady();
        handleInitialRouting();
    } finally {
        if (!isUpdate) removeGlobalLoader();
    }
}

function forceRenderCoreUI() {
    try {
        if (typeof window.renderCategories === 'function') window.renderCategories();
        if (typeof window.showHomeView === 'function') window.showHomeView();
        
        const phoneDisplay = document.getElementById('footer-phone-display');
        if (phoneDisplay && siteSettings) {
            phoneDisplay.innerText = siteSettings.footerPhone || '';
        }
    } catch (e) {
        console.error("BoseSweets: خطأ في رسم الهيكل الأساسي.", e);
    }
}

function forceRenderDynamicUI() {
    try {
        if (state.activeCat === 'الرئيسية') {
            if (typeof window.initWaterfall === 'function') window.initWaterfall();
            if (typeof window.initHomepageSections === 'function') window.initHomepageSections();
        } else {
            if (typeof window.renderMainDisplay === 'function') window.renderMainDisplay();
        }
    } catch (e) {
        console.error("BoseSweets: خطأ في تمرير محرك الشلال أو الأقسام الديناميكية.", e);
    }

    try {
        if (typeof window.renderCartList === 'function') window.renderCartList();
        if (typeof window.syncCartUI === 'function') window.syncCartUI();
    } catch (e) {
        console.error("BoseSweets: خطأ في رسم تفاصيل السلة.", e);
    }
}

function removeGlobalLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            const mainContainer = document.getElementById('main-content') || document.querySelector('main');
            if(mainContainer) {
                mainContainer.style.visibility = 'visible';
                mainContainer.style.opacity = '1';
            }
        }, 600);
    }
}

// 👑 تأمين مسارات التوجيه الأولية لمنع تصادم الواجهات
function handleInitialRouting() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    const routeCat = urlParams.get('category');

    if (productId && typeof window.showProductDetails === 'function') {
        window.showProductDetails(productId);
    } else if (routeCat && catMenu.includes(routeCat) && typeof window.setCategory === 'function') {
        window.setCategory(routeCat);
    } else {
        state.activeCat = 'الرئيسية';
        if (typeof window.showHomeView === 'function') window.showHomeView();
    }

    if (document.getElementById('gallery-customer-section') && typeof renderCustomerGallery === 'function') {
        renderCustomerGallery();
    }

    if (typeof window.renderSmartSuggestions === 'function') {
        window.renderSmartSuggestions('main');
    }

    if (window.lucide) window.lucide.createIcons();
}

function fallbackToEmergencyData() {
    if (catalog.length === 0) {
        console.log("BoseSweets: تفعيل الكتالوج الاحتياطي لضمان استمرارية الخدمة.");
        
        const fallbackData = typeof getFromLocalMemory === 'function' ? getFromLocalMemory('bosesweets_catalog') : null;
        
        if (fallbackData && Array.isArray(fallbackData) && fallbackData.length > 0) {
            catalog.push(...fallbackData);
        } else {
            const localMemory = typeof window !== 'undefined' && localStorage.getItem('bosesweets_catalog');
            if(localMemory) {
                try {
                    const parsed = JSON.parse(localMemory);
                    if(Array.isArray(parsed) && parsed.length > 0) catalog.push(...parsed);
                } catch(e){}
            }
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

    if (typeof syncCatalogMap === 'function') syncCatalogMap();
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

function setupSovereignSyncListener() {
    if (!db) return;
    
    db.collection('system').doc('syncFlag').onSnapshot(async doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.lastAdminUpdate > lastSyncTime || data.forceRefresh) {
                console.log("👑 إشارة سيادية: تم رصد تحديث من مركز قيادة حلويات بوسي. جاري التطهير والمزامنة...");
                lastSyncTime = Date.now();
                
                localStorage.removeItem('bosesweets_catalog');
                localStorage.removeItem('boseSweets_catalog');
                localStorage.removeItem('bSweets_catalog');
                localStorage.removeItem('boseSweets_settings');
                
                if (typeof ClientStorageEngine !== 'undefined' && ClientStorageEngine.remove) {
                    await ClientStorageEngine.remove('catalog');
                    await ClientStorageEngine.remove('settings');
                }
                
                await startBoseSweetsEngine(true);
            }
        }
    }, error => {
        console.warn("تنبيه: محرك المزامنة اللحظية في وضع الاستعداد المستقل.");
    });
}

function registerBoseSweetsPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(registration => {
            console.log('حلويات بوسي: تم تأكيد تسجيل محرك التطبيق بنجاح.', registration.scope);
        }).catch(error => {
            console.log('حلويات بوسي: تأخير في تسجيل محرك التطبيق.', error);
        });
    }
}

// 👑 دوال التوجيه الأساسية مأخوذة بشكل مباشر وآمن من الواجهة لعدم إحداث تصادم
window.goToHome = () => { if(typeof window.setCategory === 'function') window.setCategory('الرئيسية'); };

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => startBoseSweetsEngine(false));
} else {
    startBoseSweetsEngine(false);
}

// 👑 معالجة التوجيه الخلفي للأنظمة لضمان التوافق مع التعديلات الجديدة
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.category) {
        if (typeof window.setCategory === 'function') {
            window.setCategory(event.state.category);
        }
    } else {
        if (typeof window.showHomeView === 'function') window.showHomeView();
    }
});

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