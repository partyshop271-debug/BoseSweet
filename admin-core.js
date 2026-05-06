/**
 * ============================================================================
 * محرك مركز قيادة حلويات بوسي السحابي | BoseSweets Admin Engine V19.0 Official
 * ============================================================================
 * 👑 التحديث الجذري (V19.0 + V7.0 ARCHITECTURAL FIX): 
 * تم تطبيق نظام العزل المعماري وإدارة الحالة الأحادية، مع إضافة إدارة وتوسيع 
 * قنوات السوشيال ميديا والتكوين السحابي الشامل والمستقر.
 * يعتمد أسلوب التوسيع والبناء دون أي حذف للمكونات الأساسية.
 */

// 🛡️ Engine Upgrade: Centralized Admin Error Tracking System
const AdminErrorTracker = {
    log(context, error) {
        try {
            const errLog = { context, msg: error.message || String(error), time: new Date().toLocaleString('ar-EG') };
            let logs = JSON.parse(localStorage.getItem('BoseSweets_Admin_ErrorLogs') || '[]');
            logs.unshift(errLog);
            if(logs.length > 50) logs.pop(); 
            localStorage.setItem('BoseSweets_Admin_ErrorLogs', JSON.stringify(logs));
            console.warn(`BoseSweets Admin Vault: Error intercepted in [${context}]. 🛡️`);
        } catch(e) {}
    }
};

// ==========================================
// 1. Data Core & Storage Engines (IndexedDB)
// ==========================================
const StorageEngine = {
    dbName: 'BoseSweetsDB',
    storeName: 'DataCore',
    version: 1,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    async set(key, value) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.put(value, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) { 
            AdminErrorTracker.log('StorageEngine_Set', e); 
        }
    },
    async get(key) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null); 
            });
        } catch (e) { 
            AdminErrorTracker.log('StorageEngine_Get', e); 
            return null; 
        }
    }
};

const OfflineStorageManager = {
    dbName: 'BoseSweetsOfflineVault',
    storeName: 'ImagePayloads',
    version: 1,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'offlineId' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    async enqueuePayload(payload) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.put(payload);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) { AdminErrorTracker.log('OfflineVault_Enqueue', e); }
    },
    async getAllPayloads() {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch (e) { return []; }
    },
    async removePayload(offlineId) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.delete(offlineId);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {}
    }
};

// 👑 كائن التكوين السحابي الشامل والمطور حصرياً لمنصة حلويات بوسي
const defaultSettings = {
    brandName: "حلويات بوسي", 
    announcement: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب",
    heroTitle: "أهلاً بكم في <br class='hidden md:block'/> <span class='text-white relative inline-block mt-1 md:mt-2 drop-shadow-md'>حلويات بوسي</span>",
    heroDesc: "يسر إدارة حلويات بوسي استعراض تشكيلتها الحصرية من الأصناف الفاخرة والمُعدة بعناية فائقة لتليق بذوقكم الرفيع ومناسباتكم Сعيدة.",
    footerPhone: "01097238441", 
    footerAddress: "الكفاح، مركز الفرافرة، محافظة الوادي الجديد",
    footerQuote: "العلامة التجارية الرائدة في صناعة الحلويات الفاخرة وتصميم التورت الملكية بمركز الفرافرة منذ عام 2014.",
    productLayout: "grid", 
    
    // الهيكل القديم محتفظ به التزاماً بمعايير استقرار النظام
    visuals: {
        themeHex: "#ff3377", 
        bgHex: "#ffffff", 
        textHex: "#475569",
        fontFamily: "'Cairo', sans-serif", 
        loaderText: "أهلاً بكم في عالم حلويات بوسي ✨",
        loaderBgColor: "#fff0f5",
        loaderTextColor: "#ff3377",
        fontSizeBase: "16px",
        fontWeightBold: "900"
    },
    layoutControl: {
        viewMode: "2_columns",             
        cardWidth: "100%",                 
        cardHeight: "auto",                
        waterfallImgWidth: "100%",         
        waterfallImgHeight: "270px",       
        productImageWidth: "100%",         
        productImageHeight: "100%",        
        productPageMinHeight: "auto",      
        productPageMaxHeight: "auto",      
        innerPageFontSize: "16px"          
    },
    seo: { title: "", desc: "", keywords: "" },
    social: { facebook: "https://facebook.com/BoseSweets", tiktok: "https://tiktok.com/@BoseSweets", instagram: "https://instagram.com/BoseSweets" },
    catDescriptions: {}, 
    goldenTips: [],      
    customerReviews: [], 
    tickerActive: true, 
    tickerText: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب ✨", 
    tickerSpeed: 20, 
    tickerFont: "'Cairo', sans-serif", 
    tickerColor: "#ffffff",
    cakeBuilder: { basePrice: 145, desc: "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة.", minSquare: 16, minRect: 20, flavors: ['فانيليا', 'شيكولاتة', ' نص ونص', 'ريد فيلفت'], images: [], imagePrinting: [{ label: 'بدون', price: 0 }, { label: 'صورة قابلة للأكل', price: 60 }, { label: 'صورة غير قابلة للأكل', price: 20 }] },

    // 👑 التوسيع الهندسي الجديد المعتمد بوثيقة المواصفات الفنية
    // 1. Ticker Settings
    ticker_isActive: true,
    ticker_text: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب",
    ticker_speed: 15,
    ticker_bgColor: "#D2386C", 
    ticker_textColor: "#ffffff",

    // 2. Layout Settings 
    layout_settings: {
        layout_viewMode: "columns_2", 
        layout_card_height: "auto",
        layout_card_width: "100%",
        layout_waterfall_img_height: "270px",
        layout_waterfall_img_width: "100%",
        layout_waterfall_img_objectFit: "cover" 
    },

    // 3. UI Settings 
    UI_Settings: {
        loader_bgColor: "#fff0f5",
        loader_textColor: "#D2386C",
        loader_text: "جاري تجهيز منصة حلويات بوسي لحضرتك...",
        typography_config: {
            main_font_family: "'Cairo', sans-serif",
            global_font_size_base: "16px",
            global_font_weight_bold: "900",
            global_text_color: "#475569"
        },
        page_dimensions: {
            productPageMaxHeight: "auto",
            productPageMinHeight: "100vh"
        }
    },

    // 4. Structure Settings 
    Structure_Settings: {
        footer_sections: [],
        section_youMayAlsoLike_isActive: true,
        future_sections_registry: []
    }
};

const defaultShipping = [ { id: 'sh_1', name: 'الكفاح', fee: 0 }, { id: 'sh_2', name: 'أبو منقار', fee: 50 }, { id: 'sh_3', name: 'النهضة', fee: 30 }, { id: 'sh_4', name: 'مركز الفرافرة', fee: 20 } ];
let defaultCatalog = [];

// 👑 SINGLE SOURCE OF TRUTH (STATE)
let siteSettings = { ...defaultSettings };
let shippingZones = [ ...defaultShipping ];
let catalog = []; 
let globalOrders = []; 
let galleryData = []; 
let catMenu = [];
let catalogMap = new Map();

function syncCatalogMap() { catalogMap.clear(); catalog.forEach(p => catalogMap.set(String(p.id), p)); }

async function fetchDefaultCatalog() {
    try { const response = await fetch('data.json'); defaultCatalog = await response.json(); } 
    catch (error) { console.warn("Fallback to local memory."); }
}

let isFirstOrderLoad = true;
let ordersUnsubscribe = null; 
let adminOrdersHash = '';
let adminRenderDebounce = null;

function setupRealtimeOrders() {
    if (typeof db === 'undefined') return;
    
    // 🛡️ Guard: منع إنشاء أكثر من مستمع واحد نهائياً
    if (window.__ordersListenerActive) {
        console.warn("BoseSweets Guard: Orders Listener already active. Preventing duplicate.");
        return;
    }
    window.__ordersListenerActive = true;

    if (ordersUnsubscribe) ordersUnsubscribe();

    ordersUnsubscribe = db.collection('orders').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        
        // 1. بناء حالة جديدة تماماً (Immutable State)
        const freshOrders = [];
        let hasNewOrder = false;

        snapshot.forEach(doc => {
            freshOrders.push(doc.data());
        });

        // 2. التحقق من وجود طلبات جديدة فقط للإشعارات
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') hasNewOrder = true;
        });

        // 3. The Ultimate Deep Hash
        const newHash = JSON.stringify(freshOrders);
        
        // 4. Guard: إذا لم يتغير الهاش، توقف فوراً
        if (newHash === adminOrdersHash && !isFirstOrderLoad) return; 
        
        // 5. التحديث الآمن للحالة
        adminOrdersHash = newHash;
        globalOrders = freshOrders; 

        saveEngineMemory('ord');

        if (!isFirstOrderLoad && hasNewOrder) {
            playNotificationSound();
            showSystemToast("🔔 طلب جديد وصل لمركز القيادة!", "success");
        }

        isFirstOrderLoad = false;

        // 6. الرندر الموحد
        if(adminRenderDebounce) clearTimeout(adminRenderDebounce);
        adminRenderDebounce = setTimeout(() => {
            window.requestAnimationFrame(() => {
                executeSafely('OrdersSync', () => {
                    if (typeof renderAdminOrders === 'function') renderAdminOrders();
                    if (typeof renderAdminOverview === 'function') renderAdminOverview();
                });
            });
        }, 300); 

    }, error => {
        AdminErrorTracker.log('RealtimeOrdersSync', error);
        window.__ordersListenerActive = false; 
    });
}

function playNotificationSound() {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => {});
    } catch(e) {}
}

async function loadEngineMemory() {
    try {
        await fetchDefaultCatalog(); 
        catalog = [...defaultCatalog];
        
        if (typeof db !== 'undefined') {
            const catSnap = await db.collection('catalog').get();
            if (!catSnap.empty) { catalog = []; catSnap.forEach(doc => catalog.push(doc.data())); }
            
            const settingsSnap = await db.collection('settings').doc('main').get();
            if (settingsSnap.exists) { 
                const cloudData = settingsSnap.data();
                siteSettings = { ...defaultSettings, ...cloudData };
                
                if(cloudData.visuals) siteSettings.visuals = { ...(defaultSettings.visuals || {}), ...cloudData.visuals };
                if(cloudData.catDescriptions) siteSettings.catDescriptions = { ...(defaultSettings.catDescriptions || {}), ...cloudData.catDescriptions };
                else siteSettings.catDescriptions = defaultSettings.catDescriptions;
                
                if(cloudData.goldenTips) siteSettings.goldenTips = [...cloudData.goldenTips];
                else siteSettings.goldenTips = [...defaultSettings.goldenTips];
                
                if(cloudData.customerReviews) siteSettings.customerReviews = [...cloudData.customerReviews];
                else siteSettings.customerReviews = [...defaultSettings.customerReviews];

                if(cloudData.cakeBuilder) {
                    siteSettings.cakeBuilder = { ...(defaultSettings.cakeBuilder || {}), ...cloudData.cakeBuilder };
                    if(!siteSettings.cakeBuilder.flavors || siteSettings.cakeBuilder.flavors.length === 0) siteSettings.cakeBuilder.flavors = defaultSettings.cakeBuilder.flavors;
                } else { siteSettings.cakeBuilder = { ...defaultSettings.cakeBuilder }; }

                // 👑 استدعاء التوسعات الهندسية الجديدة بأمان تام
                if(cloudData.layout_settings) siteSettings.layout_settings = { ...defaultSettings.layout_settings, ...cloudData.layout_settings };
                if(cloudData.UI_Settings) {
                    siteSettings.UI_Settings = { ...defaultSettings.UI_Settings, ...cloudData.UI_Settings };
                    if(cloudData.UI_Settings.typography_config) siteSettings.UI_Settings.typography_config = { ...defaultSettings.UI_Settings.typography_config, ...cloudData.UI_Settings.typography_config };
                    if(cloudData.UI_Settings.page_dimensions) siteSettings.UI_Settings.page_dimensions = { ...defaultSettings.UI_Settings.page_dimensions, ...cloudData.UI_Settings.page_dimensions };
                }
                if(cloudData.Structure_Settings) {
                    siteSettings.Structure_Settings = { ...defaultSettings.Structure_Settings, ...cloudData.Structure_Settings };
                    if(cloudData.Structure_Settings.footer_sections) siteSettings.Structure_Settings.footer_sections = [...cloudData.Structure_Settings.footer_sections];
                    if(cloudData.Structure_Settings.future_sections_registry) siteSettings.Structure_Settings.future_sections_registry = [...cloudData.Structure_Settings.future_sections_registry];
                }
            }
            
            const shipSnap = await db.collection('shipping').get();
            if (!shipSnap.empty) { shippingZones = []; shipSnap.forEach(doc => shippingZones.push(doc.data())); }
            
            const gallerySnap = await db.collection('gallery').orderBy('timestamp', 'desc').get();
            if (!gallerySnap.empty) { galleryData = []; gallerySnap.forEach(doc => galleryData.push(doc.data())); }
            
            setupRealtimeOrders();
            if (typeof updateAdminDashboardStatsUI === 'function') updateAdminDashboardStatsUI();
            if (typeof fillGlobalSettingsFormFields === 'function') fillGlobalSettingsFormFields();

        } else {
            throw new Error("قاعدة البيانات غير متصلة.");
        }
    } catch(err) { 
        console.warn("BoseSweets: جاري التحميل من الذاكرة الفولاذية");
        catalog = (await StorageEngine.get('boseSweets_catalog')) || JSON.parse(localStorage.getItem('bSweets_catalog') || localStorage.getItem('boseSweets_catalog')) || [...defaultCatalog]; 
        globalOrders = (await StorageEngine.get('boseSweets_admin_orders')) || JSON.parse(localStorage.getItem('bSweets_orders') || localStorage.getItem('boseSweets_admin_orders')) || [];
        siteSettings = (await StorageEngine.get('boseSweets_settings')) || JSON.parse(localStorage.getItem('bSweets_settings') || localStorage.getItem('boseSweets_settings')) || { ...defaultSettings };
        shippingZones = (await StorageEngine.get('boseSweets_shipping')) || JSON.parse(localStorage.getItem('bSweets_shipping') || localStorage.getItem('boseSweets_shipping')) || [ ...defaultShipping ];
        galleryData = (await StorageEngine.get('boseSweets_gallery')) || JSON.parse(localStorage.getItem('bSweets_gallery') || localStorage.getItem('boseSweets_gallery')) || [];
        if (typeof updateAdminDashboardStatsUI === 'function') updateAdminDashboardStatsUI();
        if (typeof fillGlobalSettingsFormFields === 'function') fillGlobalSettingsFormFields();
    }

    if (siteSettings.catMenu && siteSettings.catMenu.length > 0) catMenu = siteSettings.catMenu;
    else catMenu = [...new Set(catalog.map(p => p.category))].filter(Boolean).map((name, i) => ({name, order: i+1}));
    
    if(catMenu.length > 0 && typeof catMenu[0] === 'string') catMenu = catMenu.map((name, i) => ({name, order: i+1}));
    if (!catMenu.find(c => c.name === 'تورت')) catMenu.unshift({name: 'تورت', order: 0});
    syncCatalogMap(); 
}

async function loadAdminEngineMemory() {
    await loadEngineMemory();
}

async function saveEngineMemory(type) {
    try {
        if (type === 'cat' || type === 'all') await StorageEngine.set('boseSweets_catalog', catalog);
        if (type === 'set' || type === 'all') await StorageEngine.set('boseSweets_settings', siteSettings);
        if (type === 'ship' || type === 'all') await StorageEngine.set('boseSweets_shipping', shippingZones);
        if (type === 'gal' || type === 'all') await StorageEngine.set('boseSweets_gallery', galleryData);
        if (type === 'ord' || type === 'all') await StorageEngine.set('boseSweets_admin_orders', globalOrders);
    } catch (e) { 
        if (type === 'set') localStorage.setItem('boseSweets_settings', JSON.stringify(siteSettings));
    }
}

// ==========================================
// 2. Admin Logic & Shared Variables
// ==========================================
let adminCurrentCat = 'all';
let adminOrderFilter = 'all';
let tempProdImages = []; 
let currentEditId = null;
let salesChartInstance = null;
let confirmActionCallback = null;

const executeSafely = (taskName, taskFunction) => {
    try {
        if (typeof taskFunction === 'function') taskFunction();
    } catch (error) {
        AdminErrorTracker.log(taskName, error);
    }
};

function unfreezeAdminUI() {
    document.body.style.overflow = ''; 
    document.body.style.pointerEvents = 'auto';
    document.documentElement.style.overflow = '';
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
}

function openAdminDashboardDirectly() {
    try {
        unfreezeAdminUI();
        executeSafely('Tabs', () => { if(typeof renderAdminCatalogTabs === 'function') renderAdminCatalogTabs(); });
        executeSafely('OrderFilters', () => { if(typeof renderAdminOrderFilters === 'function') renderAdminOrderFilters(); }); 
        executeSafely('Categories', () => { if(typeof renderAdminCategories === 'function') renderAdminCategories(); });
        executeSafely('Overview', () => { if(typeof renderAdminOverview === 'function') renderAdminOverview(); }); 
        executeSafely('Orders', () => { if(typeof renderAdminOrders === 'function') renderAdminOrders(); }); 
        executeSafely('CatalogMenu', () => { if(typeof renderAdminMenu === 'function') renderAdminMenu(''); }); 
        executeSafely('Shipping', () => { if(typeof renderAdminShipping === 'function') renderAdminShipping(); }); 
        executeSafely('SettingsForm', () => { if(typeof fillAdminSettingsForm === 'function') fillAdminSettingsForm(); });
        executeSafely('PromoCodes', () => { if(typeof initAdminPromoCodes === 'function') initAdminPromoCodes(); }); 
        executeSafely('Gallery', () => { if(typeof renderAdminGallery === 'function') renderAdminGallery(); });
        executeSafely('HomepageSelection', () => { if(typeof renderHomepageSelection === 'function') renderHomepageSelection(); });
        executeSafely('CategoryDesc', () => { if(typeof renderCategoryDescAdmin === 'function') renderCategoryDescAdmin(); });
        
        setTimeout(() => { executeSafely('Charts', () => { if(typeof initAdminCharts === 'function') initAdminCharts(); }); }, 500);
        executeSafely('Icons', () => { if(window.lucide) lucide.createIcons(); });
        if(typeof updateAdminDashboardStatsUI === 'function') updateAdminDashboardStatsUI();
        if(typeof fillGlobalSettingsFormFields === 'function') fillGlobalSettingsFormFields();
    } catch (error) {}
}

function closeAdminDashboard() {
    if (ordersUnsubscribe) ordersUnsubscribe();
    sessionStorage.removeItem('bosy_admin_auth');
    if(typeof auth !== 'undefined') auth.signOut();
    window.location.href = 'index.html';
}

window.logoutAdminSecurely = function() {
    closeAdminDashboard();
};

async function getSecureUploadSignature() {
    try {
        if(typeof auth === 'undefined' || !auth.currentUser) return null;
        const idToken = await auth.currentUser.getIdToken();
        const secureEndpoint = 'https://us-central1-bosy-sweets.cloudfunctions.net/getCloudinarySignature';
        const response = await fetch(secureEndpoint, { headers: { 'Authorization': `Bearer ${idToken}` } });
        if (!response.ok) throw new Error("Signature Server Unavailable");
        return await response.json(); 
    } catch (e) { return null; }
}

async function syncOfflineImages() {
    if (!navigator.onLine) return; 
    let needsSync = false;
    
    try {
        const payloads = await OfflineStorageManager.getAllPayloads();
        if(payloads.length === 0) return;

        for (let payload of payloads) {
            let uploadedUrl = null;
            try {
                const secureToken = await getSecureUploadSignature();
                const formData = new FormData();
                formData.append('file', payload.base64);
                
                if (secureToken && secureToken.signature) {
                    formData.append('signature', secureToken.signature);
                    formData.append('timestamp', secureToken.timestamp);
                    formData.append('api_key', secureToken.api_key);
                } else { formData.append('upload_preset', 'gct8i28h'); }
                
                const res = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.secure_url) { uploadedUrl = data.secure_url; }
            } catch (e) { continue; }

            if(uploadedUrl) {
                for (let p of catalog) {
                    if (p.images) {
                        for (let i = 0; i < p.images.length; i++) {
                            if (p.images[i] === payload.offlineId) {
                                p.images[i] = uploadedUrl;
                                if (i === 0) p.img = uploadedUrl;
                                needsSync = true;
                                if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('catalog', String(p.id), p);
                                if(typeof db !== 'undefined') await db.collection('catalog').doc(String(p.id)).set(p, { merge: true });
                            }
                        }
                    }
                }
                await OfflineStorageManager.removePayload(payload.offlineId);
            }
        }

        if (needsSync) {
            saveEngineMemory('cat');
            const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
            if(typeof renderAdminMenu === 'function') renderAdminMenu(currentSearch);
            if(typeof renderAdminCatalogGridUI === 'function') renderAdminCatalogGridUI();
            if(typeof showSystemToast === 'function') showSystemToast("تمت معالجة وتزامن الصور المؤجلة مع السحابة المركزية بنجاح ☁️", "success");
        }
    } catch(e) {}
}

window.addEventListener('online', syncOfflineImages);

// 👑 THE ULTIMATE BOOT GUARD
function bootBoseSweetsEngine() {
    if (window.__BoseSweetsAdminBooted) return; 
    window.__BoseSweetsAdminBooted = true;
    
    console.log("BoseSweets Admin Engine Initiating Architecture Safe Mode...");
    unfreezeAdminUI();
    
    if(typeof auth !== 'undefined') {
        auth.onAuthStateChanged(async user => {
            if (user) { 
                try { await loadAdminEngineMemory(); } catch(e) {}
                openAdminDashboardDirectly();
                syncOfflineImages(); 
            } else { 
                window.location.href = 'login.html';
            }
        });
    } else {
        loadAdminEngineMemory().then(() => {
            openAdminDashboardDirectly();
        });
    }
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', bootBoseSweetsEngine); } 
else { bootBoseSweetsEngine(); }
