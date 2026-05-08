/**
 * 👑 BoseSweets Main Orchestrator (V6.1) - النسخة المستقرة والمؤمنة
 * القلب النابض للمحرك - تم معالجة الانقطاع في دوائر الاتصال وضبط تزامن العمليات
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

// 👑 ربط الدوال الحيوية والحالة (State) بالنطاق العام لتعمل مع واجهات HTML بنجاح
window.state = state; // إصلاح جذري لانقطاع الاتصال وتفعيل أزرار التنقل
window.siteSettings = siteSettings;
window.catalog = catalog;
window.catMenu = catMenu;

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
 * دقة متناهية في ترتيب عمليات الإقلاع (تزامن كامل)
 */
async function bootSystemCore() {
    try {
        const db = window.firebase ? window.firebase.firestore() : undefined;
        if (!db) return;

        // 1. جلب الإعدادات (الشريط واللوجو)
        const sSnap = await db.collection('settings').doc('main').get();
        if (sSnap.exists) Object.assign(siteSettings, sSnap.data());

        // 2. جلب المنتجات (الكتالوج)
        const pSnap = await db.collection('catalog').where('isActive', '==', true).get();
        catalog.length = 0; 
        pSnap.forEach(doc => catalog.push({ id: doc.id, ...doc.data() }));

        // 3. جلب صور الشلال
        const gSnap = await db.collection('gallery').orderBy('timestamp', 'desc').limit(15).get();
        galleryData.length = 0;
        gSnap.forEach(doc => galleryData.push({ id: doc.id, ...doc.data() }));

        setAppReady();
    } catch (e) {
        console.error("خطأ في تشغيل المحرك:", e);
    }
}

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

async function recoverBoseSweetsCart() {
    if(!ClientStorageEngine) return;
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
}

// 👑 دالة تفعيل الواجهة تم استدعاؤها في المكان الصحيح الآن
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
    if (!navigator.onLine || !db || typeof ClientStorageEngine === 'undefined') return;
    try {
        const pendingOrders = await ClientStorageEngine.getQueuedOrders();
        if (!pendingOrders || pendingOrders.length === 0) return;
        for (let order of pendingOrders) {
            try { 
                await db.collection('orders').doc(String(order.id)).set(order); 
                await ClientStorageEngine.removeQueuedOrder(order.id); 
            } catch (e) { }
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

// 👑 المحرك يعمل الآن بشكل تسلسلي متزامن
async function startBoseSweetsEngine() {
    if (window.location.pathname.includes('admin.html') || document.title.includes('الإدارة') || document.getElementById('admin-orders-tbody')) { return; }
    
    await bootSystemCore();         // 1. انتظر جلب البيانات بالكامل
    syncBoseSweetsLayout();         // 2. قم ببناء القوائم بناءً على البيانات الدقيقة
    initUI();                       // 3. فعّل الواجهة وارسم المنتجات والشريط والشلال
    
    recoverBoseSweetsCart();        
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
        if (!card) return;
        const productId = card.getAttribute('data-id') || Date.now().toString();
        const productName = card.querySelector('.product-title, .product-name').innerText;
        const priceText = card.querySelector('.product-price').innerText;
        const productPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        if(typeof processBoseSweetsOrder === 'function') processBoseSweetsOrder(productId, productName, productPrice);
    }
});
