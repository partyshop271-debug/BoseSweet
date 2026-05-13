/**
 * ============================================================================
 * محرك مركز قيادة حلويات بوسي السحابي | BoseSweets Admin Engine V20.0 Official
 * ============================================================================
 * 👑 التحديث السيادي للسيطرة المطلقة: 
 * تم معالجة تصادم التعريفات وتوحيد مسارات الذاكرة لضمان اتصال لوحة التحكم 
 * بالموقع وقاعدة البيانات لحظياً دون أي انقطاع.
 * تم دمج مستشعر الرصد العميق (BoseMonitor) لاصطياد الأخطاء وتوجيهها لغرفة العمليات.
 * يعتمد أسلوب التوسيع والبناء دون أي حذف للمكونات الأساسية.
 * * ⚠️ تحذير: هذا الملف هو النواة المركزية لإدارة حلويات بوسي.
 */

// ==========================================
// 1. محركات البيانات والتخزين (Data & Storage Engines)
// ==========================================

// محرك التخزين الأساسي (IndexedDB)
window.StorageEngine = {
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
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-catalog.js', null, null, 'StorageEngine.set'); 
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
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-catalog.js', null, null, 'StorageEngine.get'); 
            return null; 
        }
    }
};

// محرك الصور والبيانات الثقيلة أوفلاين
window.OfflineStorageManager = {
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
        } catch (e) { 
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-catalog.js', null, null, 'OfflineStorageManager.enqueuePayload'); 
        }
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
        } catch (e) { 
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-catalog.js', null, null, 'OfflineStorageManager.getAllPayloads');
            return []; 
        }
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
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-catalog.js', null, null, 'OfflineStorageManager.removePayload');
        }
    }
};

// ==========================================
// 2. كائن التكوين السحابي الشامل والمطور (Full Config)
// ==========================================
window.defaultSettings = {
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

window.defaultShipping = [ 
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
window.siteSettings = { ...window.defaultSettings };
window.shippingZones = [ ...window.defaultShipping ];
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

window.isFirstOrderLoad = true;
window.ordersUnsubscribe = null; 
window.adminOrdersHash = '';
window.adminRenderDebounce = null;

// ==========================================
// 4. وظائف المحرك الأساسية (Core Logic)
// ==========================================

window.syncCatalogMap = function() { 
    window.catalogMap.clear(); 
    window.catalog.forEach(p => window.catalogMap.set(String(p.id), p)); 
};

window.fetchDefaultCatalog = async function() {
    try { 
        const response = await fetch('data.json'); 
        return await response.json(); 
    } catch (error) { 
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-catalog.js', null, null, 'fetchDefaultCatalog');
        console.warn("BoseSweets: Catalog fallback to internal memory."); 
        return [];
    }
};

/**
 * إعداد المزامنة اللحظية للطلبات مع حماية السحابة
 */
window.setupRealtimeOrders = function() {
    if (typeof window.db === 'undefined' || !window.db) return;
    
    if (window.__ordersListenerActive) {
        console.warn("BoseSweets Guard: Orders Listener already active. Preventing duplicate.");
        return;
    }
    window.__ordersListenerActive = true;

    if (window.ordersUnsubscribe) window.ordersUnsubscribe();

    window.ordersUnsubscribe = window.db.collection('orders').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        const freshOrders = [];
        let hasNewOrder = false;

        snapshot.forEach(doc => {
            freshOrders.push({ id: doc.id, ...doc.data() });
        });

        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') hasNewOrder = true;
        });

        const newHash = JSON.stringify(freshOrders);
        if (newHash === window.adminOrdersHash && !window.isFirstOrderLoad) return; 
        
        window.adminOrdersHash = newHash;
        window.globalOrders = freshOrders; 

        window.saveEngineMemory('ord');

        if (!window.isFirstOrderLoad && hasNewOrder) {
            window.playNotificationSound();
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

        window.isFirstOrderLoad = false;

        if(window.adminRenderDebounce) clearTimeout(window.adminRenderDebounce);
        window.adminRenderDebounce = setTimeout(() => {
            window.requestAnimationFrame(() => {
                window.executeSafely('OrdersSync', () => {
                    if (typeof renderAdminOrders === 'function') renderAdminOrders();
                    if (typeof renderAdminOverview === 'function') renderAdminOverview();
                    if (typeof updateAdminDashboardStatsUI === 'function') updateAdminDashboardStatsUI();
                });
            });
        }, 300); 

    }, error => {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-catalog.js', null, null, 'setupRealtimeOrders');
        window.__ordersListenerActive = false; 
    });
};

window.playNotificationSound = function() {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => {});
    } catch(e) {}
};

/**
 * تحميل الذاكرة الكاملة للمحرك من كافة المصادر
 */
window.loadEngineMemory = async function() {
    try {
        // تحميل الكتالوج الافتراضي أولاً
        const localDefCat = await window.fetchDefaultCatalog();
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
                window.siteSettings = { ...window.defaultSettings, ...cloudData };
                
                // دمج ذكي للقيم العميقة لضمان عدم فقدان أي خاصية
                if(cloudData.visuals) window.siteSettings.visuals = { ...(window.defaultSettings.visuals || {}), ...cloudData.visuals };
                if(cloudData.catDescriptions) window.siteSettings.catDescriptions = { ...(window.defaultSettings.catDescriptions || {}), ...cloudData.catDescriptions };
                
                window.siteSettings.goldenTips = cloudData.goldenTips || [...window.defaultSettings.goldenTips];
                window.siteSettings.customerReviews = cloudData.customerReviews || [...window.defaultSettings.customerReviews];
                window.siteSettings.dynamicSections = cloudData.dynamicSections || [];

                if(cloudData.social) {
                    window.siteSettings.social = { ...window.defaultSettings.social, ...cloudData.social };
                    if(cloudData.social.customLinks) window.siteSettings.social.customLinks = [...cloudData.social.customLinks];
                }

                if(cloudData.cakeBuilder) {
                    window.siteSettings.cakeBuilder = { ...(window.defaultSettings.cakeBuilder || {}), ...cloudData.cakeBuilder };
                    if(!window.siteSettings.cakeBuilder.flavors || window.siteSettings.cakeBuilder.flavors.length === 0) 
                        window.siteSettings.cakeBuilder.flavors = window.defaultSettings.cakeBuilder.flavors;
                }

                if(cloudData.layout_settings) window.siteSettings.layout_settings = { ...window.defaultSettings.layout_settings, ...cloudData.layout_settings };
                if(cloudData.UI_Settings) {
                    window.siteSettings.UI_Settings = { ...window.defaultSettings.UI_Settings, ...cloudData.UI_Settings };
                    if(cloudData.UI_Settings.typography_config) 
                        window.siteSettings.UI_Settings.typography_config = { ...window.defaultSettings.UI_Settings.typography_config, ...cloudData.UI_Settings.typography_config };
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
            
            window.setupRealtimeOrders();
            if (typeof updateAdminDashboardStatsUI === 'function') updateAdminDashboardStatsUI();
            if (typeof fillGlobalSettingsFormFields === 'function') fillGlobalSettingsFormFields();

        } else {
            throw new Error("قاعدة البيانات غير متصلة بالنطاق الشامل.");
        }
    } catch(err) { 
        if(window.BoseMonitor) window.BoseMonitor.report(err, 'admin-catalog.js', null, null, 'loadEngineMemory');
        console.warn("BoseSweets: جاري التحميل من الذاكرة الفولاذية البديلة", err);
        window.catalog = (await window.StorageEngine.get('boseSweets_catalog')) || JSON.parse(localStorage.getItem('bSweets_catalog')) || window.catalog; 
        window.globalOrders = (await window.StorageEngine.get('boseSweets_admin_orders')) || JSON.parse(localStorage.getItem('bSweets_orders')) || [];
        window.siteSettings = (await window.StorageEngine.get('boseSweets_settings')) || JSON.parse(localStorage.getItem('bSweets_settings')) || { ...window.defaultSettings };
        window.shippingZones = (await window.StorageEngine.get('boseSweets_shipping')) || JSON.parse(localStorage.getItem('bSweets_shipping')) || [ ...window.defaultShipping ];
        window.galleryData = (await window.StorageEngine.get('boseSweets_gallery')) || JSON.parse(localStorage.getItem('bSweets_gallery')) || [];
        
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
    window.syncCatalogMap(); 
};

window.saveEngineMemory = async function(type) {
    try {
        if (type === 'cat' || type === 'all') await window.StorageEngine.set('boseSweets_catalog', window.catalog);
        if (type === 'set' || type === 'all') await window.StorageEngine.set('boseSweets_settings', window.siteSettings);
        if (type === 'ship' || type === 'all') await window.StorageEngine.set('boseSweets_shipping', window.shippingZones);
        if (type === 'gal' || type === 'all') await window.StorageEngine.set('boseSweets_gallery', window.galleryData);
        if (type === 'ord' || type === 'all') await window.StorageEngine.set('boseSweets_admin_orders', window.globalOrders);
        
        // Fallback to LocalStorage for redundant safety
        localStorage.setItem(`bSweets_${type}`, JSON.stringify(type === 'cat' ? window.catalog : type === 'ord' ? window.globalOrders : window.siteSettings));
    } catch (e) { 
        if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-catalog.js', null, null, 'saveEngineMemory');
    }
};

// ==========================================
// 5. التحكم في واجهة الإدارة (Admin UI Controllers)
// ==========================================

window.executeSafely = function(taskName, taskFunction) {
    try {
        if (typeof taskFunction === 'function') return taskFunction();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-catalog.js', null, null, 'executeSafely: ' + taskName);
    }
};

window.unfreezeAdminUI = function() {
    document.body.style.overflow = ''; 
    document.body.style.pointerEvents = 'auto';
    document.documentElement.style.overflow = '';
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
};

window.openAdminDashboardDirectly = function() {
    try {
        window.unfreezeAdminUI();
        window.executeSafely('Tabs', () => { if(typeof renderAdminCatalogTabs === 'function') renderAdminCatalogTabs(); });
        window.executeSafely('OrderFilters', () => { if(typeof renderAdminOrderFilters === 'function') renderAdminOrderFilters(); }); 
        window.executeSafely('Overview', () => { if(typeof renderAdminOverview === 'function') renderAdminOverview(); }); 
        window.executeSafely('Orders', () => { if(typeof renderAdminOrders === 'function') renderAdminOrders(); }); 
        window.executeSafely('CatalogMenu', () => { if(typeof renderAdminMenu === 'function') renderAdminMenu(''); }); 
        window.executeSafely('Shipping', () => { if(typeof renderAdminShipping === 'function') renderAdminShipping(); }); 
        window.executeSafely('SettingsForm', () => { if(typeof fillAdminSettingsForm === 'function') fillAdminSettingsForm(); });
        window.executeSafely('Gallery', () => { if(typeof renderAdminGallery === 'function') renderAdminGallery(); });
        
        setTimeout(() => { window.executeSafely('Charts', () => { if(typeof initAdminCharts === 'function') initAdminCharts(); }); }, 500);
        window.executeSafely('Icons', () => { if(window.lucide) lucide.createIcons(); });
        
        // تحديث حالة السحابة في الواجهة
        const statusEl = document.getElementById('cloud-sync-status');
        if (statusEl) statusEl.innerHTML = '<i data-lucide="cloud-lightning" class="w-3 h-3"></i> متصل بالسحابة';
        
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-catalog.js', null, null, 'openAdminDashboardDirectly');
    }
};

window.logoutAdminSecurely = async function() {
    if (!confirm("هل تودين إغلاق جلسة الإدارة وتأمين مركز القيادة؟")) return;
    try {
        if (window.ordersUnsubscribe) window.ordersUnsubscribe();
        sessionStorage.removeItem('bosy_admin_auth');
        if(typeof window.auth !== 'undefined' && window.auth) await window.auth.signOut();
        window.location.href = 'index.html';
    } catch (e) {
        if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-catalog.js', null, null, 'logoutAdminSecurely');
        window.location.href = 'login.html';
    }
};

/**
 * 👑 هندسة المحاولة المزدوجة والمزامنة الآمنة (Dual-Retry Upload System)
 * تم دمج هذا النظام لضمان عدم ضياع الصور عند انقطاع الاتصال أو بطء الشبكة
 */
window.compressAndUploadMultiImage = async function(e) {
    const files = e.target.files; 
    if (!files || files.length === 0) return;
    
    const spinner = document.getElementById('uploading-spinner'); 
    if(spinner) spinner.classList.remove('hidden');
    
    let offlineSaved = false;
    let successCount = 0;

    for(let i=0; i<files.length; i++) {
        const file = files[i];
        if (!file.type.match('image.*')) { 
            showSystemToast("قرار فني: الرجاء اختيار ملف صورة مدعوم", "error"); 
            continue; 
        }
        
        await new Promise((resolve) => {
            const reader = new FileReader(); 
            reader.readAsDataURL(file);
            reader.onload = function(ev) {
                const img = new Image(); 
                img.src = ev.target.result;
                img.onload = async function() {
                    const canvas = document.createElement('canvas'); 
                    const MAX_WIDTH = 1200; 
                    let scaleSize = 1;
                    if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
                    
                    canvas.width = img.width * scaleSize; 
                    canvas.height = img.height * scaleSize;
                    
                    const ctx = canvas.getContext('2d'); 
                    ctx.fillStyle = '#FFFFFF'; 
                    ctx.fillRect(0, 0, canvas.width, canvas.height); 
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    const base64Str = canvas.toDataURL('image/jpeg', 0.85); 
                    
                    if (navigator.onLine) {
                        try {
                            const secureToken = (typeof getSecureUploadSignature === 'function') ? await getSecureUploadSignature() : null;
                            const formData = new FormData(); 
                            formData.append('file', base64Str); 
                            
                            if (secureToken && secureToken.signature) {
                                formData.append('signature', secureToken.signature);
                                formData.append('timestamp', secureToken.timestamp);
                                formData.append('api_key', secureToken.api_key);
                            } else { 
                                formData.append('upload_preset', 'gct8i28h'); 
                            }
                            
                            // إضافة مهلة زمنية للطلب (Timeout) لمنع تجميد النظام
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 15000);
                            
                            const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { 
                                method: 'POST', 
                                body: formData,
                                signal: controller.signal
                            });
                            clearTimeout(timeoutId);
                            
                            if (!response.ok) throw new Error("الخادم السحابي رفض الاستجابة");
                            const data = await response.json();
                            
                            if (data.secure_url) { 
                                window.tempProdImages.push(data.secure_url); 
                                successCount++;
                            } else throw new Error("استجابة الخادم غير صالحة");
                            
                        } catch (err) { 
                            // حفظ أوفلاين في حالة فشل الرفع أو انتهاء المهلة الزمنية
                            if(window.BoseMonitor) window.BoseMonitor.report(err, 'admin-catalog.js', null, null, 'compressAndUploadMultiImage (Upload Failure)');
                            const offlineId = 'offline_img_' + Date.now() + Math.random().toString(36).substr(2, 5);
                            if(typeof window.OfflineStorageManager !== 'undefined') {
                                await window.OfflineStorageManager.enqueuePayload({ offlineId: offlineId, base64: base64Str });
                                window.tempProdImages.push(offlineId); 
                                offlineSaved = true; 
                            }
                        } 
                    } else {
                        // حفظ أوفلاين فوراً عند انقطاع الشبكة
                        const offlineId = 'offline_img_' + Date.now() + Math.random().toString(36).substr(2, 5);
                        if(typeof window.OfflineStorageManager !== 'undefined') {
                            await window.OfflineStorageManager.enqueuePayload({ offlineId: offlineId, base64: base64Str });
                            window.tempProdImages.push(offlineId); 
                            offlineSaved = true;
                        }
                    }
                    resolve();
                }
            }
        });
    }
    
    if (typeof renderAdminTempImages === 'function') renderAdminTempImages();
    if(spinner) spinner.classList.add('hidden'); 
    if(document.getElementById('prod-img-upload')) document.getElementById('prod-img-upload').value = '';
    
    if (offlineSaved) {
        if(typeof showSystemToast === 'function') showSystemToast("تم تجميد الصور في الخزنة مؤقتاً.. سيتم الرفع تلقائياً عند الاتصال 🔄", "info");
    } else if (successCount > 0) {
        if(typeof showSystemToast === 'function') showSystemToast("تم الاعتماد ورفع الصور الفنية للمنتج 👑", "success");
    }
};

/**
 * مزامنة الصور التي تم رفعها في وضع الأوفلاين
 */
window.syncOfflineImages = async function() {
    if (!navigator.onLine) return; 
    let needsSync = false;
    
    try {
        const payloads = await window.OfflineStorageManager.getAllPayloads();
        if(payloads.length === 0) return;

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
                if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-catalog.js', null, null, 'syncOfflineImages (Individual Upload)');
                continue; 
            }

            if(uploadedUrl) {
                window.catalog.forEach(p => {
                    if (p.images && p.images.includes(payload.offlineId)) {
                        p.images = p.images.map(img => img === payload.offlineId ? uploadedUrl : img);
                        if (p.img === payload.offlineId) p.img = uploadedUrl;
                        needsSync = true;
                        if(window.db) window.db.collection('catalog').doc(String(p.id)).set(p, { merge: true });
                    }
                });
                await window.OfflineStorageManager.removePayload(payload.offlineId);
            }
        }

        if (needsSync) {
            window.saveEngineMemory('cat');
            if(typeof renderAdminMenu === 'function') renderAdminMenu('');
            if(typeof showSystemToast === 'function') showSystemToast("تمت معالجة وتزامن الصور المؤجلة مع السحابة ☁️", "success");
        }
    } catch(e) {
        if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-catalog.js', null, null, 'syncOfflineImages (General Failure)');
    }
};

window.addEventListener('online', window.syncOfflineImages);

// ==========================================
// 6. تشغيل المحرك (Bootloader)
// ==========================================

window.bootBoseSweetsEngine = function() {
    if (window.__BoseSweetsAdminBooted) return; 
    window.__BoseSweetsAdminBooted = true;
    
    console.log("👑 BoseSweets Admin: Initiating Sovereign Architecture...");
    window.unfreezeAdminUI();
    
    if(typeof window.auth !== 'undefined' && window.auth !== null) {
        window.auth.onAuthStateChanged(async user => {
            if (user) { 
                try { 
                    await window.loadEngineMemory(); 
                } catch(e) { 
                    if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-catalog.js', null, null, 'bootBoseSweetsEngine (Memory Load)'); 
                }
                window.openAdminDashboardDirectly();
                window.syncOfflineImages(); 
            } else { 
                window.location.href = 'login.html';
            }
        });
    } else {
        window.loadEngineMemory().then(() => window.openAdminDashboardDirectly());
    }
};

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
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-catalog.js', null, null, 'triggerSovereignSync');
    }
};


// ==========================================
// 7. دوال التحكم والسيطرة (Save & Delete)
// ==========================================

window.saveProductData = async function(productObj) {
    try {
        // 1. تحديث الكتالوج المحلي
        const existingIndex = window.catalog.findIndex(p => p.id === productObj.id);
        if (existingIndex > -1) {
            window.catalog[existingIndex] = productObj;
        } else {
            window.catalog.push(productObj);
        }
        window.syncCatalogMap();
        
        // 2. تحديث السحابة والذاكرة المحلية
        if (typeof window.db !== 'undefined' && window.db !== null) {
            await window.db.collection('catalog').doc(String(productObj.id)).set(productObj, { merge: true });
        }
        await window.saveEngineMemory('cat');

        if (typeof showSystemToast === 'function') showSystemToast("تم اعتماد المنتج في الكتالوج بنجاح", "success");

        // 3. إجبار الموقع على التحديث اللحظي عند التعديل (البث السيادي)
        if(typeof window.triggerSovereignSync === 'function') window.triggerSovereignSync();
        
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-catalog.js', null, null, 'saveProductData');
    }
};

window.executeDeleteProduct = async function(productId) {
    try {
        // 1. الحذف من الكتالوج المحلي
        window.catalog = window.catalog.filter(p => p.id !== productId);
        window.syncCatalogMap();

        // 2. الحذف من السحابة والذاكرة المحلية
        if (typeof window.db !== 'undefined' && window.db !== null) {
            await window.db.collection('catalog').doc(String(productId)).delete();
        }
        await window.saveEngineMemory('cat');

        if (typeof showSystemToast === 'function') showSystemToast("تم إزالة المنتج نهائياً من سجلات حلويات بوسي", "success");

        // 3. إجبار الموقع على التحديث اللحظي عند التعديل (البث السيادي)
        if(typeof window.triggerSovereignSync === 'function') window.triggerSovereignSync();

    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-catalog.js', null, null, 'executeDeleteProduct');
    }
};


// التشغيل النهائي
if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', window.bootBoseSweetsEngine); 
} else { 
    window.bootBoseSweetsEngine(); 
}