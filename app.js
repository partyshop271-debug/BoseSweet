// القلب النابض للمحرك الرئيسي (app.js) - حلويات بوسي - النسخة المستقرة والمؤمنة
import { defaultSettings, defaultShipping, defaultCatalog, detailedDescriptions, dSizes, fTypes } from './config.js';
import { siteSettings, shippingZones, catalog, galleryData, catMenu, isAppReady, state, currentBuilderStep, cakeState, catalogMap, syncCatalogMap, setAppReady } from './state.js';
import { MemoryManager, hexToMathHSL, escapeHTML, generateUniqueID, optimizeCloudinaryUrl, generateSecureOrderId, showSystemToast } from './utils.js';
import { ClientStorageEngine } from './storage.js';
import { LiveSearchEngine, performLiveSearchDebounced, toggleLiveSearch, performLiveSearch } from './search.js';
import { saveCartToStorage, clearCartStorage, calculateCartTotal, syncCartUI, updateTempQtyContext, addWithQtyContext, modQ, commitCakeBuilderToCart, submitOrderFinal, dispatchWhatsAppOrder, processBoseSweetsOrder, updateCartDisplay } from './cart.js';
import { getCapsuleDescription, getFinalDescription, applySettingsToUI, toggleCustomerMenu, renderCustomerSidebarCategories, renderCustomerGallery, shareProduct, initWaterfall, setupSliderButtons, renderCategories, setActiveCategoryPill, renderFlowerTabs, renderMainDisplay } from './ui.js';

// كسر العزل التقني وإعادة ربط قاعدة البيانات بالمحرك
const db = window.db || (typeof window !== 'undefined' && window.firebase ? window.firebase.firestore() : undefined);

// ربط الدوال الحيوية بالنطاق العام لتعمل مع واجهات HTML بنجاح
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

async function fetchDefaultCatalog() {
    try { 
        const response = await fetch('data.json'); 
        const fetchedData = await response.json(); 
        if(fetchedData && fetchedData.length > 0) defaultCatalog.push(...fetchedData); 
    } catch (error) {}
}

async function loadEngineMemory() {
    try {
        await fetchDefaultCatalog();

        if (!catMenu || catMenu.length === 0) {
            const generated = [...new Set(defaultCatalog.map(p => p.category))].filter(Boolean);
            catMenu.length = 0;
            catMenu.push(...generated);
            if (!catMenu.includes('تورت')) catMenu.unshift('تورت');
        }

        if (typeof db !== 'undefined') {
            try {
                let settingsDoc = await db.collection('settings').doc('main').get();
                if (settingsDoc.exists) {
                    const cloudData = settingsDoc.data();
                    Object.assign(siteSettings, defaultSettings, cloudData);
                    
                    if (cloudData) {
                        window.siteSettings = { ...defaultSettings, ...cloudData };
                        if (cloudData.layout_settings) {
                            const root = document.documentElement;
                            if (cloudData.layout_settings.layout_waterfall_img_height) root.style.setProperty('--layout-waterfall-height', cloudData.layout_settings.layout_waterfall_img_height);
                            if (cloudData.layout_settings.layout_waterfall_img_width) root.style.setProperty('--layout-waterfall-width', cloudData.layout_settings.layout_waterfall_img_width);
                            if (cloudData.layout_settings.layout_waterfall_img_objectFit) root.style.setProperty('--layout-waterfall-fit', cloudData.layout_settings.layout_waterfall_img_objectFit);
                        }
                        if (cloudData.UI_Settings && cloudData.UI_Settings.typography_config) {
                            const config = cloudData.UI_Settings.typography_config;
                            const root = document.documentElement;
                            if (config.main_font_family) root.style.setProperty('--brand-font', config.main_font_family);
                        }
                    }
                }
            } catch(e) { console.warn("الاعتماد على الإعدادات الافتراضية"); }

            try {
                let catalogSnap = await db.collection('catalog').get();
                let firebaseData = [];
                catalogSnap.forEach(doc => firebaseData.push(doc.data()));

                if (firebaseData.length > 0) {
                    firebaseData.sort((a, b) => {
                        if ((a.sortOrder || 999) !== (b.sortOrder || 999)) return (a.sortOrder || 999) - (b.sortOrder || 999);
                        return String(a.id).localeCompare(String(b.id));
                    });
                    catalog.length = 0; catalog.push(...firebaseData);
                } else {
                    if (catalog.length === 0) catalog.push(...defaultCatalog);
                }
            } catch (e) {
                if (catalog.length === 0) catalog.push(...defaultCatalog);
            }
        } else {
            if (catalog.length === 0) catalog.push(...defaultCatalog);
        }

        syncCatalogMap();
        LiveSearchEngine.build(catalog);

        if (typeof db !== 'undefined') {
            db.collection('gallery').orderBy('timestamp', 'desc').get().then(gallerySnap => {
                if (!gallerySnap.empty) { galleryData.length = 0; gallerySnap.forEach(doc => galleryData.push(doc.data())); if(isAppReady && window.renderCustomerGallery) window.renderCustomerGallery(); }
            }).catch(()=>{});
            
            db.collection('shipping').get().then(shipSnap => {
                if (!shipSnap.empty) { shippingZones.length = 0; shipSnap.forEach(doc => shippingZones.push(doc.data())); if(isAppReady && window.applySettingsToUI) window.applySettingsToUI(); }
            }).catch(()=>{});
        }
        
    } catch(err) { 
        if (catalog.length === 0) catalog.push(...defaultCatalog); 
        syncCatalogMap(); 
        LiveSearchEngine.build(catalog);
    } finally {
        setAppReady();
    }
    
    try { 
        const dbCart = await ClientStorageEngine.get('cart');
        if (dbCart) {
            state.cart.length = 0; state.cart.push(...dbCart);
        } else {
            const savedCart = localStorage.getItem('boseSweets_cart_data'); 
            const savedCartSecured = localStorage.getItem('boseSweets_secured_cart'); 
            if (savedCartSecured) {
                state.cart.length = 0; state.cart.push(...JSON.parse(savedCartSecured));
            } else if (savedCart) {
                state.cart.length = 0; state.cart.push(...JSON.parse(savedCart));
            }
        }
    } catch (e) { state.cart.length = 0; }
}

async function fallbackToLocalMemory() {
    if (catalog.length === 0 && typeof defaultCatalog !== 'undefined' && defaultCatalog.length > 0) {
        catalog.push(...defaultCatalog);
        if (typeof syncCatalogMap === 'function') syncCatalogMap();
        if (typeof LiveSearchEngine !== 'undefined' && LiveSearchEngine.build) LiveSearchEngine.build(catalog);
    }
    initUI();
}

function initUI() {
    const urlParams = new URLSearchParams(window.location.search);
    const routeCat = urlParams.get('category');
    
    if (routeCat && catMenu.includes(routeCat)) {
        state.activeCat = routeCat;
    } else {
        state.activeCat = 'الرئيسية';
    }

    if(window.applySettingsToUI) window.applySettingsToUI();
    if(window.renderCategories) window.renderCategories();
    
    if (state.activeCat === 'الرئيسية') {
        if (window.showHomeView) window.showHomeView();
    } else {
        if (window.showMenuView) window.showMenuView();
        if(window.renderMainDisplay) window.renderMainDisplay();
    }

    if(window.initWaterfall) window.initWaterfall(); 
    if(window.initHomepageSections) window.initHomepageSections(); 

    if(document.getElementById('gallery-customer-section') && window.renderCustomerGallery) window.renderCustomerGallery(); 
    syncCartUI(); 
    if(window.lucide) lucide.createIcons();
    
    if(window.renderSmartSuggestions) window.renderSmartSuggestions('main');
    
    const phoneDisplay = document.getElementById('footer-phone-display');
    if (phoneDisplay && siteSettings) {
        phoneDisplay.innerText = siteSettings.footerPhone || '';
    }
}

async function initApp() {
    await loadEngineMemory(); 
    if (catalog.length > 0) {
        initUI(); 
    } else {
        fallbackToLocalMemory(); 
    }
}

async function syncOfflineOrders() {
    if (!navigator.onLine || typeof db === 'undefined') return;
    try {
        const pendingOrders = await ClientStorageEngine.getQueuedOrders();
        if (pendingOrders.length === 0) return;
        for (let order of pendingOrders) {
            try { await db.collection('orders').doc(String(order.id)).set(order); await ClientStorageEngine.removeQueuedOrder(order.id); } catch (e) { }
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

// هندسة التشغيل الذكي لضمان العمل على الموبايل
function startBoseSweetsEngine() {
    if (window.location.pathname.includes('admin.html') || document.title.includes('الإدارة') || document.getElementById('admin-orders-tbody')) { return; }
    initApp();
    syncOfflineOrders();
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
        if(!card) return;
        const productId = card.getAttribute('data-id') || Date.now().toString();
        const productName = card.querySelector('.product-title, .product-name').innerText;
        const priceText = card.querySelector('.product-price').innerText;
        const productPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        processBoseSweetsOrder(productId, productName, productPrice);
    }
});