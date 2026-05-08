// القلب النابض للمحرك الرئيسي (app.js) - حلويات بوسي - النسخة الكاملة
import { defaultSettings, defaultShipping, defaultCatalog, detailedDescriptions, dSizes, fTypes } from './config.js';
import { siteSettings, shippingZones, catalog, galleryData, catMenu, isAppReady, state, currentBuilderStep, cakeState, catalogMap, syncCatalogMap, setAppReady } from './state.js';
import { MemoryManager, hexToMathHSL, escapeHTML, generateUniqueID, optimizeCloudinaryUrl, generateSecureOrderId, showSystemToast } from './utils.js';
import { ClientStorageEngine } from './storage.js';
import { LiveSearchEngine, performLiveSearchDebounced, toggleLiveSearch, performLiveSearch } from './search.js';
import { saveCartToStorage, clearCartStorage, calculateCartTotal, syncCartUI, updateTempQtyContext, addWithQtyContext, modQ, commitCakeBuilderToCart, submitOrderFinal, dispatchWhatsAppOrder, processBoseSweetsOrder, updateCartDisplay } from './cart.js';
import { getCapsuleDescription, getFinalDescription, showHomeView, showMenuView, showGoldenTips, showCakeBuilderView, openGlobalLightbox, closeGlobalLightbox, renderTicker, loadLiveReviews, applySettingsToUI, toggleCustomerMenu, renderCustomerSidebarCategories, renderCustomerGallery, shareProduct, initWaterfall, initHomepageSections, setupSliderButtons, renderCategories, setActiveCategoryPill, renderFlowerTabs, enforceCategoryRender, renderMainDisplay, navigateToProduct, renderMultiStepCakeBuilder, changeBuilderStep, updateCakeBuilderField, adjustBuilderPersons, drawProductCard, renderCartList, renderSmartSuggestions, showInfo, closeInfo, submitCustomerReviewLive, setCategory, setSub, getImgFallback } from './ui.js';

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
window.toggleCustomerMenu = toggleCustomerMenu;
window.MemoryManager = MemoryManager;
window.LiveSearchEngine = LiveSearchEngine;
window.showHomeView = showHomeView;
window.showMenuView = showMenuView;
window.showGoldenTips = showGoldenTips;
window.showCakeBuilderView = showCakeBuilderView;
window.openGlobalLightbox = openGlobalLightbox;
window.closeGlobalLightbox = closeGlobalLightbox;
window.renderTicker = renderTicker;
window.loadLiveReviews = loadLiveReviews;
window.applySettingsToUI = applySettingsToUI;
window.renderCustomerSidebarCategories = renderCustomerSidebarCategories;
window.renderCustomerGallery = renderCustomerGallery;
window.shareProduct = shareProduct;
window.initWaterfall = initWaterfall;
window.initHomepageSections = initHomepageSections;
window.setupSliderButtons = setupSliderButtons;
window.renderCategories = renderCategories;
window.setActiveCategoryPill = setActiveCategoryPill;
window.renderFlowerTabs = renderFlowerTabs;
window.enforceCategoryRender = enforceCategoryRender;
window.renderMainDisplay = renderMainDisplay;
window.navigateToProduct = navigateToProduct;
window.renderMultiStepCakeBuilder = renderMultiStepCakeBuilder;
window.changeBuilderStep = changeBuilderStep;
window.updateCakeBuilderField = updateCakeBuilderField;
window.adjustBuilderPersons = adjustBuilderPersons;
window.drawProductCard = drawProductCard;
window.renderCartList = renderCartList;
window.renderSmartSuggestions = renderSmartSuggestions;
window.showInfo = showInfo;
window.closeInfo = closeInfo;
window.submitCustomerReviewLive = submitCustomerReviewLive;
window.setCategory = setCategory;
window.setSub = setSub;
window.getImgFallback = getImgFallback;
window.processBoseSweetsOrder = processBoseSweetsOrder;
window.updateCartDisplay = updateCartDisplay;

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

                    if(cloudData.visuals) siteSettings.visuals = { ...(defaultSettings.visuals || {}), ...cloudData.visuals };
                    if(cloudData.cakeBuilder) {
                        siteSettings.cakeBuilder = { ...(defaultSettings.cakeBuilder || {}), ...cloudData.cakeBuilder };
                        if(!siteSettings.cakeBuilder.flavors || siteSettings.cakeBuilder.flavors.length === 0) {
                            siteSettings.cakeBuilder.flavors = defaultSettings.cakeBuilder.flavors;
                        }
                    } else siteSettings.cakeBuilder = { ...defaultSettings.cakeBuilder };

                    if(cloudData.social) siteSettings.social = { ...siteSettings.social, ...cloudData.social };

                    if (siteSettings.catMenu && siteSettings.catMenu.length > 0) {
                        const newMenu = typeof siteSettings.catMenu[0] === 'object' ? siteSettings.catMenu.sort((a, b) => a.order - b.order).map(c => c.name) : siteSettings.catMenu;
                        catMenu.length = 0;
                        catMenu.push(...newMenu);
                    }
                }
            } catch(e) { console.warn("Firebase Settings Failed - Using Defaults"); }

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
                if (!gallerySnap.empty) { galleryData.length = 0; gallerySnap.forEach(doc => galleryData.push(doc.data())); if(isAppReady) renderCustomerGallery(); }
            }).catch(()=>{});
            
            db.collection('shipping').get().then(shipSnap => {
                if (!shipSnap.empty) { shippingZones.length = 0; shipSnap.forEach(doc => shippingZones.push(doc.data())); if(isAppReady) applySettingsToUI(); }
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

    applySettingsToUI();
    renderCategories();
    
    if (state.activeCat === 'الرئيسية') {
        if (window.showHomeView) window.showHomeView();
        else if (window.goToHome) window.goToHome();
    } else {
        if (window.showMenuView) window.showMenuView();
        else if (window.switchToMenuView) window.switchToMenuView();
        renderMainDisplay();
    }

    initWaterfall(); 
    window.initHomepageSections(); 

    if(document.getElementById('gallery-customer-section')) renderCustomerGallery(); 
    syncCartUI(); 
    if(window.lucide) lucide.createIcons();
    
    renderSmartSuggestions('main');
    
    const phoneDisplay = document.getElementById('footer-phone-display');
    if (phoneDisplay) {
        phoneDisplay.innerText = siteSettings.footerPhone;
        phoneDisplay.parentElement.parentElement.onclick = () => { window.location.href = `tel:${siteSettings.footerPhone}`; };
    }
    
    const socialGrid = document.getElementById('footer-social-links-grid');
    if (socialGrid && siteSettings.social) {
        socialGrid.innerHTML = `
            <a href="${siteSettings.social.facebook}" target="_blank" class="p-2 bg-[#ffffff] border-2 border-[#ff91a4] text-[#ff91a4] rounded-lg hover:scale-110 hover:bg-[#ff91a4] hover:text-[#ffffff] transition-all"><i data-lucide="facebook" class="w-4 h-4"></i></a>
            <a href="${siteSettings.social.instagram}" target="_blank" class="p-2 bg-[#ffffff] border-2 border-[#ff91a4] text-[#ff91a4] rounded-lg hover:scale-110 hover:bg-[#ff91a4] hover:text-[#ffffff] transition-all"><i data-lucide="instagram" class="w-4 h-4"></i></a>
        `;
        if (window.lucide) lucide.createIcons();
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

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin.html') || document.title.includes('الإدارة') || document.getElementById('admin-orders-tbody')) { return; }
    initApp();
    syncOfflineOrders();
});

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', function(e) {
        const tabBtn = e.target.closest('.category-tab, .cat-btn, [onclick*="Category"], [onclick*="Cat"]');
        
        if (tabBtn) {
            setTimeout(() => {
                const productContainers = document.querySelectorAll('.products-grid, #products-container, .catalog-grid, [id*="grid"]');
                
                productContainers.forEach(container => {
                    if (container) {
                        container.style.display = 'grid'; 
                        container.classList.remove('hidden'); 
                    }
                });
            }, 150);
        }
    });
});

document.addEventListener('click', function(event) {
    if (event.target && event.target.closest('.add-to-cart-btn')) {
        event.preventDefault();
        
        const button = event.target.closest('.add-to-cart-btn');
        const card = button.closest('.product-card') || button.closest('.product-item');
        
        const productId = card.getAttribute('data-id') || Date.now().toString();
        const productName = card.querySelector('.product-title, .product-name').innerText;
        
        const priceText = card.querySelector('.product-price').innerText;
        const productPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));

        processBoseSweetsOrder(productId, productName, productPrice);
    }
});

document.addEventListener('DOMContentLoaded', updateCartDisplay);