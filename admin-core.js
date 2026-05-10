/**
 * ============================================================================
 * محرك مركز قيادة حلويات بوسي السحابي | BoseSweets Admin Engine V20.0 Official
 * ============================================================================
 * 👑 التحديث السيادي للسيطرة المطلقة: 
 * تم معالجة تصادم التعريفات وتوحيد مسارات الذاكرة لضمان اتصال لوحة التحكم 
 * بالموقع وقاعدة البيانات لحظياً دون أي انقطاع.
 * يعتمد أسلوب التوسيع والبناء دون أي حذف للمكونات الأساسية.
 * * ⚠️ تحذير: هذا الملف هو النواة المركزية لإدارة حلويات بوسي.
 */

// 🛡️ بروتوكول تتبع الأخطاء الإداري المركزي (Admin Error Tracking System)
const AdminErrorTracker = {
    log(context, error) {
        try {
            const errLog = { 
                context, 
                msg: error.message || String(error), 
                time: new Date().toLocaleString('ar-EG'),
                stack: error.stack || 'No Stack Trace'
            };
            let logs = JSON.parse(localStorage.getItem('BoseSweets_Admin_ErrorLogs') || '[]');
            logs.unshift(errLog);
            if(logs.length > 50) logs.pop(); 
            localStorage.setItem('BoseSweets_Admin_ErrorLogs', JSON.stringify(logs));
            console.warn(`BoseSweets Admin Vault: Error intercepted in [${context}]. 🛡️`);
        } catch(e) {}
    },
    report(error, context) { this.log(context, error); } // توافق مع النسخ الجديدة
};

// ==========================================
// 1. محركات البيانات والتخزين (Data & Storage Engines)
// ==========================================

// محرك التخزين الأساسي (IndexedDB)
const StorageEngine = {
    dbName: 'BoseSweetsDB',
    storeName: 'DataCore',
    version: 1,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(this.storeName)) {
                    database.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    async set(key, value) {
        try {
            const database = await this.init();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(this.storeName, 'readwrite');
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
            const database = await this.init();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(this.storeName, 'readonly');
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

// محرك الصور والبيانات الثقيلة أوفلاين
const OfflineStorageManager = {
    dbName: 'BoseSweetsOfflineVault',
    storeName: 'ImagePayloads',
    version: 1,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(this.storeName)) {
                    database.createObjectStore(this.storeName, { keyPath: 'offlineId' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    async enqueuePayload(payload) {
        try {
            const database = await this.init();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.put(payload);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) { AdminErrorTracker.log('OfflineVault_Enqueue', e); }
    },
    async getAllPayloads() {
        try {
            const database = await this.init();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch (e) { return []; }
    },
    async removePayload(offlineId) {
        try {
            const database = await this.init();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.delete(offlineId);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {}
    }
};

// ==========================================
// 2. كائن التكوين السحابي الشامل والمطور (Full Config)
// ==========================================
const defaultSettings = {
    brandName: "حلويات بوسي", 
    announcement: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب",
    heroTitle: "أهلاً بكم في <br class='hidden md:block'/> <span class='text-white relative inline-block mt-1 md:mt-2 drop-shadow-md'>حلويات بوسي</span>",
    heroDesc: "يسر إدارة حلويات بوسي استعراض تشكيلتها الحصرية من الأصناف الفاخرة والمُعدة بعناية فائقة لتليق بذوقكم الرفيع ومناسباتكم السعيدة.",
    footerPhone: "01097238441", 
    footerAddress: "الكفاح، مركز الفرافرة، محافظة الوادي الجديد",
    footerQuote: "العلامة التجارية الرائدة في صناعة الحلويات الفاخرة وتصميم التورت الملكية بمركز الفرافرة منذ عام 2014.",
    productLayout: "grid", 
    
    visuals: {
        themeHex: "#ff91a4", 
        bgHex: "#ffffff", 
        textHex: "#1a1a1a",
        fontFamily: "'Cairo', sans-serif", 
        loaderText: "أهلاً بكم في عالم حلويات بوسي",
        loaderBgColor: "#ffffff",
        loaderTextColor: "#ff91a4",
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
    
    social: { 
        facebook: "https://facebook.com/BoseSweets", 
        tiktok: "https://tiktok.com/@BoseSweets", 
        instagram: "https://instagram.com/BoseSweets",
        whatsapp: "201097238441",
        customLinks: []
    },
    
    catDescriptions: {}, 
    goldenTips: [],      
    customerReviews: [], 
    dynamicSections: [], 
    tickerActive: true, 
    tickerText: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب ✨", 
    tickerSpeed: 20, 
    tickerFont: "'Cairo', sans-serif", 
    tickerColor: "#ffffff",

    cakeBuilder: { 
        basePrice: 145, 
        desc: "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة.", 
        minSquare: 16, 
        minRect: 20, 
        flavors: ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت'], 
        images: [], 
        imagePrinting: [
            { label: 'بدون', price: 0 },
            { label: 'صورة قابلة للأكل', price: 60 }, 
            { label: 'صورة غير قابلة للأكل', price: 20 }
        ] 
    },

    layout_settings: {
        layout_viewMode: "columns_2", 
        layout_card_width: "100%",
        layout_card_height: "auto",
        layout_waterfall_img_height: "270px",
        layout_waterfall_speed: 3000,
        layout_waterfall_img_width: "100%",
        layout_waterfall_img_objectFit: "cover" 
    },

    UI_Settings: {
        loader_text: "جاري تجهيز عالم بوسي السحري...", 
        loader_bgColor: "#ffffff", 
        loader_textColor: "#ff91a4",
        typography_config: {
            main_font_family: "'Cairo', sans-serif",
            global_font_size_base: "16px",
            global_font_weight_bold: "900",
            global_text_color: "#1a1a1a"
        },
        page_dimensions: {
            productPageMaxHeight: "auto",
            productPageMinHeight: "100vh"
        }
    },

    Structure_Settings: {
        footer_sections: [],
        section_youMayAlsoLike_isActive: true,
        future_sections_registry: []
    }
};

const defaultShipping = [ 
    { id: 'sh_1', name: 'الكفاح', fee: 0 }, 
    { id: 'sh_2', name: 'أبو منقار', fee: 50 }, 
    { id: 'sh_3', name: 'النهضة', fee: 30 }, 
    { id: 'sh_4', name: 'مركز الفرافرة', fee: 20 } 
];

// ==========================================
// 3. الحالة العالمية (Global Sovereign State)
// ==========================================
window.catalog = [];
window.globalOrders = [];
window.siteSettings = { ...defaultSettings };
window.shippingZones = [ ...defaultShipping ];
window.galleryData = [];
window.catMenu = [];
window.catalogMap = new Map();

// متغيرات التحكم الإداري
window.adminCurrentCat = 'all';
window.adminOrderFilter = 'all';
window.tempProdImages = []; 
window.currentEditId = null;
window.salesChartInstance = null;
window.confirmActionCallback = null;

var isFirstOrderLoad = true;
var ordersUnsubscribe = null; 
var adminOrdersHash = '';
var adminRenderDebounce = null;

// ==========================================
// 4. وظائف المحرك الأساسية (Core Logic)
// ==========================================

function syncCatalogMap() { 
    window.catalogMap.clear(); 
    window.catalog.forEach(p => window.catalogMap.set(String(p.id), p)); 
}

async function fetchDefaultCatalog() {
    try { 
        const response = await fetch('data.json'); 
        return await response.json(); 
    } catch (error) { 
        console.warn("BoseSweets: Catalog fallback to internal memory."); 
        return [];
    }
}

/**
 * إعداد المزامنة اللحظية للطلبات مع حماية السحابة
 */
function setupRealtimeOrders() {
    if (typeof window.db === 'undefined' || !window.db) return;
    
    if (window.__ordersListenerActive) {
        console.warn("BoseSweets Guard: Orders Listener already active. Preventing duplicate.");
        return;
    }
    window.__ordersListenerActive = true;

    if (ordersUnsubscribe) ordersUnsubscribe();

    ordersUnsubscribe = window.db.collection('orders').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        const freshOrders = [];
        let hasNewOrder = false;

        snapshot.forEach(doc => {
            freshOrders.push({ id: doc.id, ...doc.data() });
        });

        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') hasNewOrder = true;
        });

        const newHash = JSON.stringify(freshOrders);
        if (newHash === adminOrdersHash && !isFirstOrderLoad) return; 
        
        adminOrdersHash = newHash;
        window.globalOrders = freshOrders; 

        saveEngineMemory('ord');

        if (!isFirstOrderLoad && hasNewOrder) {
            playNotificationSound();
            if (typeof showSystemToast === 'function') {
                showSystemToast("🔔 طلب جديد وصل لمركز القيادة!", "success");
            }
        }

        // تحديث شارة التنبيه (Badge)
        const pendingCount = window.globalOrders.filter(o => o.status === 'pending').length;
        const badge = document.getElementById('nav-order-badge');
        if (badge) {
            if (pendingCount > 0) {
                badge.classList.remove('hidden');
                badge.innerText = pendingCount > 9 ? '+9' : pendingCount;
            } else {
                badge.classList.add('hidden');
            }
        }

        isFirstOrderLoad = false;

        if(adminRenderDebounce) clearTimeout(adminRenderDebounce);
        adminRenderDebounce = setTimeout(() => {
            window.requestAnimationFrame(() => {
                executeSafely('OrdersSync', () => {
                    if (typeof renderAdminOrders === 'function') renderAdminOrders();
                    if (typeof renderAdminOverview === 'function') renderAdminOverview();
                    if (typeof updateAdminDashboardStatsUI === 'function') updateAdminDashboardStatsUI();
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

/**
 * تحميل الذاكرة الكاملة للمحرك من كافة المصادر
 */
async function loadEngineMemory() {
    try {
        // تحميل الكتالوج الافتراضي أولاً
        const localDefCat = await fetchDefaultCatalog();
        window.catalog = localDefCat.length > 0 ? localDefCat : window.catalog;
        
        if (typeof window.db !== 'undefined' && window.db !== null) {
            // 1. مزامنة الكتالوج
            const catSnap = await window.db.collection('catalog').get();
            if (!catSnap.empty) { 
                window.catalog = []; 
                catSnap.forEach(doc => window.catalog.push({ id: doc.id, ...doc.data() })); 
            }
            
            // 2. مزامنة الإعدادات (Main Settings)
            const settingsSnap = await window.db.collection('settings').doc('main').get();
            if (settingsSnap.exists) { 
                const cloudData = settingsSnap.data();
                window.siteSettings = { ...defaultSettings, ...cloudData };
                
                // دمج ذكي للقيم العميقة لضمان عدم فقدان أي خاصية
                if(cloudData.visuals) window.siteSettings.visuals = { ...(defaultSettings.visuals || {}), ...cloudData.visuals };
                if(cloudData.catDescriptions) window.siteSettings.catDescriptions = { ...(defaultSettings.catDescriptions || {}), ...cloudData.catDescriptions };
                
                window.siteSettings.goldenTips = cloudData.goldenTips || [...defaultSettings.goldenTips];
                window.siteSettings.customerReviews = cloudData.customerReviews || [...defaultSettings.customerReviews];
                window.siteSettings.dynamicSections = cloudData.dynamicSections || [];

                if(cloudData.social) {
                    window.siteSettings.social = { ...defaultSettings.social, ...cloudData.social };
                    if(cloudData.social.customLinks) window.siteSettings.social.customLinks = [...cloudData.social.customLinks];
                }

                if(cloudData.cakeBuilder) {
                    window.siteSettings.cakeBuilder = { ...(defaultSettings.cakeBuilder || {}), ...cloudData.cakeBuilder };
                    if(!window.siteSettings.cakeBuilder.flavors || window.siteSettings.cakeBuilder.flavors.length === 0) 
                        window.siteSettings.cakeBuilder.flavors = defaultSettings.cakeBuilder.flavors;
                }

                if(cloudData.layout_settings) window.siteSettings.layout_settings = { ...defaultSettings.layout_settings, ...cloudData.layout_settings };
                if(cloudData.UI_Settings) {
                    window.siteSettings.UI_Settings = { ...defaultSettings.UI_Settings, ...cloudData.UI_Settings };
                    if(cloudData.UI_Settings.typography_config) 
                        window.siteSettings.UI_Settings.typography_config = { ...defaultSettings.UI_Settings.typography_config, ...cloudData.UI_Settings.typography_config };
                }
            }
            
            // 3. مزامنة مناطق الشحن
            const shipSnap = await window.db.collection('shipping').get();
            if (!shipSnap.empty) { 
                window.shippingZones = []; 
                shipSnap.forEach(doc => window.shippingZones.push(doc.data())); 
            }
            
            // 4. مزامنة المعرض
            const gallerySnap = await window.db.collection('gallery').orderBy('timestamp', 'desc').get();
            if (!gallerySnap.empty) { 
                window.galleryData = []; 
                gallerySnap.forEach(doc => window.galleryData.push(doc.data())); 
            }
            
            setupRealtimeOrders();
            if (typeof updateAdminDashboardStatsUI === 'function') updateAdminDashboardStatsUI();
            if (typeof fillGlobalSettingsFormFields === 'function') fillGlobalSettingsFormFields();

        } else {
            throw new Error("قاعدة البيانات غير متصلة بالنطاق الشامل.");
        }
    } catch(err) { 
        console.warn("BoseSweets: جاري التحميل من الذاكرة الفولاذية البديلة", err);
        window.catalog = (await StorageEngine.get('boseSweets_catalog')) || JSON.parse(localStorage.getItem('bSweets_catalog')) || window.catalog; 
        window.globalOrders = (await StorageEngine.get('boseSweets_admin_orders')) || JSON.parse(localStorage.getItem('bSweets_orders')) || [];
        window.siteSettings = (await StorageEngine.get('boseSweets_settings')) || JSON.parse(localStorage.getItem('bSweets_settings')) || { ...defaultSettings };
        window.shippingZones = (await StorageEngine.get('boseSweets_shipping')) || JSON.parse(localStorage.getItem('bSweets_shipping')) || [ ...defaultShipping ];
        window.galleryData = (await StorageEngine.get('boseSweets_gallery')) || JSON.parse(localStorage.getItem('bSweets_gallery')) || [];
        
        if (typeof updateAdminDashboardStatsUI === 'function') updateAdminDashboardStatsUI();
        if (typeof fillGlobalSettingsFormFields === 'function') fillGlobalSettingsFormFields();
    }

    // تهيئة قائمة التصنيفات
    if (window.siteSettings.catMenu && window.siteSettings.catMenu.length > 0) {
        window.catMenu = window.siteSettings.catMenu;
    } else {
        window.catMenu = [...new Set(window.catalog.map(p => p.category))].filter(Boolean).map((name, i) => ({name, order: i+1}));
    }
    
    if(window.catMenu.length > 0 && typeof window.catMenu[0] === 'string') {
        window.catMenu = window.catMenu.map((name, i) => ({name, order: i+1}));
    }
    
    if (!window.catMenu.find(c => c.name === 'تورت')) window.catMenu.unshift({name: 'تورت', order: 0});
    syncCatalogMap(); 
}

/**
 * 👑 هندسة توحيد الذاكرة (Memory Unification Protocol)
 * تضمن هذه الدالة كتابة البيانات بمسارات مزدوجة في الذاكرة المحلية 
 * لضمان وصول التعديلات إلى محرك العميل دون أي فجوات أو انعزال.
 */
async function saveEngineMemory(type) {
    try {
        // 1. التخزين المتقدم في IndexedDB لضمان عدم فقدان البيانات الكبيرة
        if (type === 'cat' || type === 'all') await StorageEngine.set('boseSweets_catalog', window.catalog);
        if (type === 'set' || type === 'all') await StorageEngine.set('boseSweets_settings', window.siteSettings);
        if (type === 'ship' || type === 'all') await StorageEngine.set('boseSweets_shipping', window.shippingZones);
        if (type === 'gal' || type === 'all') await StorageEngine.set('boseSweets_gallery', window.galleryData);
        if (type === 'ord' || type === 'all') await StorageEngine.set('boseSweets_admin_orders', window.globalOrders);
        
        // 2. التخزين الاحتياطي الفولاذي المزدوج في LocalStorage لمطابقة محرك العميل تماماً
        if (type === 'cat' || type === 'all') {
            localStorage.setItem('boseSweets_catalog', JSON.stringify(window.catalog));
            localStorage.setItem('bSweets_catalog', JSON.stringify(window.catalog)); // مسار إضافي للحماية
            localStorage.setItem('boseSweets_catalog_timestamp', Date.now().toString());
        }
        if (type === 'ord' || type === 'all') {
            localStorage.setItem('bSweets_orders', JSON.stringify(window.globalOrders));
            localStorage.setItem('boseSweets_admin_orders', JSON.stringify(window.globalOrders)); // توحيد قطعي للمسار
        }
        if (type === 'set' || type === 'all') {
            localStorage.setItem('boseSweets_settings', JSON.stringify(window.siteSettings));
            localStorage.setItem('bSweets_settings', JSON.stringify(window.siteSettings)); // مسار إضافي للحماية
        }
        if (type === 'ship' || type === 'all') {
            localStorage.setItem('boseSweets_shipping', JSON.stringify(window.shippingZones));
            localStorage.setItem('bSweets_shipping', JSON.stringify(window.shippingZones)); // مسار إضافي للحماية
        }
        if (type === 'gal' || type === 'all') {
            localStorage.setItem('boseSweets_gallery', JSON.stringify(window.galleryData));
            localStorage.setItem('bSweets_gallery', JSON.stringify(window.galleryData)); // مسار إضافي للحماية
        }
        
    } catch (e) { 
        AdminErrorTracker.log('SaveEngineMemory', e);
        console.warn("BoseSweets Guard: حدث خلل أثناء توحيد الذاكرة الفولاذية.", e);
    }
}

// ==========================================
// 5. التحكم في واجهة الإدارة (Admin UI Controllers)
// ==========================================

window.executeSafely = function(taskName, taskFunction) {
    try {
        if (typeof taskFunction === 'function') return taskFunction();
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
        executeSafely('Overview', () => { if(typeof renderAdminOverview === 'function') renderAdminOverview(); }); 
        executeSafely('Orders', () => { if(typeof renderAdminOrders === 'function') renderAdminOrders(); }); 
        executeSafely('CatalogMenu', () => { if(typeof renderAdminMenu === 'function') renderAdminMenu(''); }); 
        executeSafely('Shipping', () => { if(typeof renderAdminShipping === 'function') renderAdminShipping(); }); 
        executeSafely('SettingsForm', () => { if(typeof fillAdminSettingsForm === 'function') fillAdminSettingsForm(); });
        executeSafely('Gallery', () => { if(typeof renderAdminGallery === 'function') renderAdminGallery(); });
        
        setTimeout(() => { executeSafely('Charts', () => { if(typeof initAdminCharts === 'function') initAdminCharts(); }); }, 500);
        executeSafely('Icons', () => { if(window.lucide) lucide.createIcons(); });
        
        // تحديث حالة السحابة في الواجهة
        const statusEl = document.getElementById('cloud-sync-status');
        if (statusEl) statusEl.innerHTML = '<i data-lucide="cloud-lightning" class="w-3 h-3"></i> متصل بالسحابة';
        
    } catch (error) {
        AdminErrorTracker.log('DashboardInit', error);
    }
}

window.logoutAdminSecurely = async function() {
    if (!confirm("هل تودين إغلاق جلسة الإدارة وتأمين مركز القيادة؟")) return;
    try {
        if (ordersUnsubscribe) ordersUnsubscribe();
        sessionStorage.removeItem('bosy_admin_auth');
        if(typeof window.auth !== 'undefined' && window.auth) await window.auth.signOut();
        window.location.href = 'index.html';
    } catch (e) {
        window.location.href = 'login.html';
    }
};

/**
 * 👑 بروتوكول المزامنة السيادية للصور المؤجلة (Offline Image Sync Master)
 * النسخة المتطورة لضمان عدم ضياع أي بيانات أثناء التذبذب الشبكي
 */
async function syncOfflineImages() {
    if (!navigator.onLine) return; 
    let needsSync = false;
    let syncCount = 0;
    
    try {
        const payloads = await OfflineStorageManager.getAllPayloads();
        if(payloads.length === 0) return;
        
        if (typeof showSystemToast === 'function') {
            showSystemToast("بدء بروتوكول مزامنة الصور المؤجلة مع السحابة ☁️...", "info");
        }

        for (let payload of payloads) {
            let uploadedUrl = null;
            try {
                const formData = new FormData();
                formData.append('file', payload.base64);
                formData.append('upload_preset', 'gct8i28h'); 
                
                const res = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.secure_url) uploadedUrl = data.secure_url;
            } catch (e) { 
                AdminErrorTracker.log('OfflineImageSync', e);
                continue; 
            }

            if(uploadedUrl) {
                // البحث في الكتالوج وتحديث مسار الصورة
                for (let i = 0; i < window.catalog.length; i++) {
                    let p = window.catalog[i];
                    let updated = false;
                    
                    if (p.images && p.images.includes(payload.offlineId)) {
                        p.images = p.images.map(img => img === payload.offlineId ? uploadedUrl : img);
                        updated = true;
                    }
                    if (p.img === payload.offlineId) {
                        p.img = uploadedUrl;
                        updated = true;
                    }
                    
                    if (updated) {
                        needsSync = true;
                        // التحديث المباشر في قاعدة البيانات السحابية
                        if(window.db) await window.db.collection('catalog').doc(String(p.id)).set(p, { merge: true });
                    }
                }
                // مسح الصورة من الخزنة المؤقتة بعد نجاح الرفع
                await OfflineStorageManager.removePayload(payload.offlineId);
                syncCount++;
            }
        }

        if (needsSync) {
            syncCatalogMap();
            await saveEngineMemory('cat');
            if(typeof renderAdminMenu === 'function') renderAdminMenu('');
            if(typeof renderAdminCatalogGridUI === 'function') renderAdminCatalogGridUI();
            if(typeof window.triggerSovereignSync === 'function') window.triggerSovereignSync();
            
            if (typeof showSystemToast === 'function') {
                showSystemToast(`تمت معالجة وتزامن (${syncCount}) صور مؤجلة بنجاح 👑`, "success");
            }
        }
    } catch(e) {
        AdminErrorTracker.log('OfflineSyncMaster', e);
    }
}

window.addEventListener('online', syncOfflineImages);

// ==========================================
// 6. تشغيل المحرك (Bootloader)
// ==========================================

function bootBoseSweetsEngine() {
    if (window.__BoseSweetsAdminBooted) return; 
    window.__BoseSweetsAdminBooted = true;
    
    console.log("👑 BoseSweets Admin: Initiating Sovereign Architecture...");
    unfreezeAdminUI();
    
    if(typeof window.auth !== 'undefined' && window.auth !== null) {
        window.auth.onAuthStateChanged(async user => {
            if (user) { 
                try { await loadEngineMemory(); } catch(e) { AdminErrorTracker.log('BootMemoryLoad', e); }
                openAdminDashboardDirectly();
                syncOfflineImages(); 
            } else { 
                window.location.href = 'login.html';
            }
        });
    } else {
        loadEngineMemory().then(() => openAdminDashboardDirectly());
    }
}

// البث السيادي لتحديث الواجهة لحظياً
window.triggerSovereignSync = async function() {
    try {
        // إضافة مؤشر forceRefresh لإجبار الواجهة على مسح الذاكرة المؤقتة القديمة
        const flag = { 
            lastAdminUpdate: Date.now(), 
            adminId: window.auth?.currentUser?.uid || 'system',
            forceRefresh: true 
        };
        
        if (typeof window.db !== 'undefined' && window.db !== null) {
            await window.db.collection('system').doc('syncFlag').set(flag, { merge: true });
        }
        
        // تحديث إجباري للمتغيرات في نفس الجهاز إذا كان المسؤول يختبر الموقع
        localStorage.setItem('BoseSweets_Local_Sync_Force', Date.now().toString());
        
    } catch (error) {
        AdminErrorTracker.log('SovereignSyncTrigger', error);
    }
};

// التشغيل النهائي
if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', bootBoseSweetsEngine); 
} else { 
    bootBoseSweetsEngine(); 
}