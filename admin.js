/**
 * ============================================================================
 * محرك مركز قيادة حلويات بوسي | BoseSweets Admin Engine (V6.0 ULTIMATE DYNAMIC)
 * ============================================================================
 * تم بناء وتوسيع هذا المحرك لضمان أعلى أداء، وتوسيع القدرات الإدارية، مع الحفاظ
 * على كامل البيانات والوظائف السابقة بنظام (البناء والتطوير دون حذف).
 * التحديث الجديد (V6.0) يتضمن: محرك الهوية البصرية، الأسعار العالمية، نظام المخزون،
 * الخصومات والعروض، والترتيب المخصص للأقسام والمنتجات.
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
            console.warn(`BoseSweets Admin Vault: Error intercepted in [${context}] and logged securely. 🛡️`);
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
            console.warn("StorageEngine Set Error:", e); 
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

/**
 * 🛡️ Engine Upgrade: Offline Storage Manager (Isolated Base64 Storage)
 */
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
        } catch (e) { 
            AdminErrorTracker.log('OfflineVault_Enqueue', e);
        }
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
        } catch (e) { 
            AdminErrorTracker.log('OfflineVault_GetAll', e);
            return []; 
        }
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
        } catch (e) {
            AdminErrorTracker.log('OfflineVault_Remove', e);
        }
    }
};

const defaultSettings = {
    brandName: "حلويات بوسي", announcement: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب",
    heroTitle: "أهلاً بكم في <br class='hidden md:block'/> <span class='text-white relative inline-block mt-1 md:mt-2 drop-shadow-md'>حلويات بوسي</span>",
    heroDesc: "يسر إدارة حلويات بوسي استعراض تشكيلتها الحصرية من الأصناف الفاخرة والمُعدة بعناية فائقة لتليق بذوقكم الرفيع ومناسباتكم السعيدة.",
    footerPhone: "01097238441", footerAddress: "الكفاح، مركز الفرافرة، <br> محافظة الوادي الجديد",
    footerQuote: `"نؤمن أن الحلويات لغة للتعبير عن المحبة، لذا نصنع كل قطعة بشغف لنكون شركاءكم في أجمل اللحظات."`,
    productLayout: "grid", 
    visuals: {
        themeHex: "#ec4899", bgHex: "#ffffff", textHex: "#4a2b2b",
        fontFamily: "'Cairo', sans-serif", loaderText: "أهلاً بكم في عالم حلويات بوسي ✨"
    },
    tickerActive: true, tickerText: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب ✨", tickerSpeed: 20, tickerFont: "'Cairo', sans-serif", tickerColor: "#ffffff",
    cakeBuilder: { basePrice: 145, desc: "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة.", minSquare: 16, minRect: 20, flavors: ['فانيليا', 'شيكولاتة', ' نص ونص', 'ريد فيلفت'], images: [], imagePrinting: [{ label: 'بدون', price: 0 }, { label: 'صورة قابلة للأكل', price: 60 }, { label: 'صورة غير قابلة للأكل', price: 20 }] }
};

const defaultShipping = [ { id: 'sh_1', name: 'الكفاح', fee: 0 }, { id: 'sh_2', name: 'أبو منقار', fee: 50 }, { id: 'sh_3', name: 'النهضة', fee: 30 }, { id: 'sh_4', name: 'مركز الفرافرة', fee: 20 } ];
let defaultCatalog = [];

let siteSettings = { ...defaultSettings };
let shippingZones = [ ...defaultShipping ];
let catalog = []; let globalOrders = []; let galleryData = []; let catMenu = [];
let catalogMap = new Map();

function syncCatalogMap() { catalogMap.clear(); catalog.forEach(p => catalogMap.set(String(p.id), p)); }

async function fetchDefaultCatalog() {
    try { const response = await fetch('data.json'); defaultCatalog = await response.json(); } 
    catch (error) { console.warn("تعذر تحميل الكتالوج الافتراضي، سيتم استخدام الذاكرة المحلية."); }
}

let isFirstOrderLoad = true;
let ordersUnsubscribe = null; 

/**
 * 🛡️ Engine Upgrade: Differential Sync Realtime Orders
 */
function setupRealtimeOrders() {
    if (typeof db === 'undefined') return;

    if (ordersUnsubscribe) {
        ordersUnsubscribe();
    }

    ordersUnsubscribe = db.collection('orders').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        let hasNewOrder = false;

        snapshot.docChanges().forEach(change => {
            const orderData = change.doc.data();
            
            if (change.type === 'added') {
                if (!globalOrders.find(o => String(o.id) === String(orderData.id))) {
                    globalOrders.unshift(orderData);
                    hasNewOrder = true;
                }
            }
            if (change.type === 'modified') {
                const index = globalOrders.findIndex(o => String(o.id) === String(orderData.id));
                if (index !== -1) {
                    globalOrders[index] = orderData;
                }
            }
            if (change.type === 'removed') {
                globalOrders = globalOrders.filter(o => String(o.id) !== String(orderData.id));
            }
        });

        globalOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        saveEngineMemory('ord');

        if (!isFirstOrderLoad && hasNewOrder) {
            playNotificationSound();
            showSystemToast("🔔 طلب جديد وصل لمركز القيادة!", "success");
        }

        isFirstOrderLoad = false;

        executeSafely('OrdersSync', () => {
            if (typeof renderAdminOrders === 'function') renderAdminOrders();
            if (typeof renderAdminOverview === 'function') renderAdminOverview();
        });
    }, error => {
        AdminErrorTracker.log('RealtimeOrdersSync', error);
    });
}

function playNotificationSound() {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.6;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.warn("Auto-play prevented by browser policy"));
        }
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
                
                if(cloudData.visuals) {
                    siteSettings.visuals = { ...(defaultSettings.visuals || {}), ...cloudData.visuals };
                }
                
                // 🛡️ الحماية العميقة لخانات التورتة جوه لوحة الإدارة
                if(cloudData.cakeBuilder) {
                    siteSettings.cakeBuilder = { ...(defaultSettings.cakeBuilder || {}), ...cloudData.cakeBuilder };
                    if(!siteSettings.cakeBuilder.flavors || siteSettings.cakeBuilder.flavors.length === 0) {
                        siteSettings.cakeBuilder.flavors = defaultSettings.cakeBuilder.flavors;
                    }
                } else {
                    siteSettings.cakeBuilder = { ...defaultSettings.cakeBuilder };
                }
            }
            
            const shipSnap = await db.collection('shipping').get();
            if (!shipSnap.empty) { shippingZones = []; shipSnap.forEach(doc => shippingZones.push(doc.data())); }
            
            const gallerySnap = await db.collection('gallery').orderBy('timestamp', 'desc').get();
            if (!gallerySnap.empty) { galleryData = []; gallerySnap.forEach(doc => galleryData.push(doc.data())); }
            
            setupRealtimeOrders();

        } else {
            throw new Error("قاعدة البيانات غير متصلة.");
        }
    } catch(err) { 
        console.warn("جاري التحميل من الذاكرة الفولاذية (IndexedDB) بسبب خطأ في الاتصال بالسحابة");
        catalog = (await StorageEngine.get('boseSweets_catalog')) || JSON.parse(localStorage.getItem('bSweets_catalog') || localStorage.getItem('boseSweets_catalog')) || [...defaultCatalog]; 
        globalOrders = (await StorageEngine.get('boseSweets_admin_orders')) || JSON.parse(localStorage.getItem('bSweets_orders') || localStorage.getItem('boseSweets_admin_orders')) || [];
        siteSettings = (await StorageEngine.get('boseSweets_settings')) || JSON.parse(localStorage.getItem('bSweets_settings') || localStorage.getItem('boseSweets_settings')) || { ...defaultSettings };
        shippingZones = (await StorageEngine.get('boseSweets_shipping')) || JSON.parse(localStorage.getItem('bSweets_shipping') || localStorage.getItem('boseSweets_shipping')) || [ ...defaultShipping ];
        galleryData = (await StorageEngine.get('boseSweets_gallery')) || JSON.parse(localStorage.getItem('bSweets_gallery') || localStorage.getItem('boseSweets_gallery')) || [];
    }

    // 👑 التحديث الملكي: دعم ترتيب الأقسام
    if (siteSettings.catMenu && siteSettings.catMenu.length > 0) catMenu = siteSettings.catMenu;
    else catMenu = [...new Set(catalog.map(p => p.category))].filter(Boolean).map((name, i) => ({name, order: i+1}));
    
    // تحويل الأقسام القديمة إلى النظام الجديد الداعم للترتيب
    if(catMenu.length > 0 && typeof catMenu[0] === 'string') {
        catMenu = catMenu.map((name, i) => ({name, order: i+1}));
    }
    
    if (!catMenu.find(c => c.name === 'تورت')) catMenu.unshift({name: 'تورت', order: 0});
    syncCatalogMap(); 
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
// 2. Admin Logic & UI Variables
// ==========================================
let adminCurrentCat = 'all';
let adminOrderFilter = 'all';
let tempProdImages = []; 
let currentEditId = null;
let salesChartInstance = null;
let confirmActionCallback = null;

const executeSafely = (taskName, taskFunction) => {
    try {
        if (typeof taskFunction === 'function') {
            taskFunction();
        }
    } catch (error) {
        console.error(`BoseSweets Engine Warning: تم احتواء خطأ في [${taskName}] لضمان استمرار عمل مركز قيادة حلويات بوسي`, error);
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
        
        executeSafely('Tabs', renderAdminCatalogTabs);
        executeSafely('OrderFilters', renderAdminOrderFilters); 
        executeSafely('Categories', renderAdminCategories);
        executeSafely('Overview', renderAdminOverview); 
        executeSafely('Orders', renderAdminOrders); 
        executeSafely('CatalogMenu', () => renderAdminMenu('')); 
        executeSafely('Shipping', renderAdminShipping); 
        executeSafely('SettingsForm', fillAdminSettingsForm);
        executeSafely('PromoCodes', initAdminPromoCodes); 
        executeSafely('Gallery', () => { if(typeof renderAdminGallery === 'function') renderAdminGallery(); });
        
        setTimeout(() => {
            executeSafely('Charts', () => { if(typeof initAdminCharts === 'function') initAdminCharts(); });
        }, 500);

        executeSafely('Icons', () => { if(window.lucide) lucide.createIcons(); });
        
    } catch (error) {
        showSystemToast("تنبيه: تم تشغيل وضع الطوارئ لاستعادة البيانات...", "info");
    }
}

function closeAdminDashboard() {
    if (ordersUnsubscribe) {
        ordersUnsubscribe();
    }
    
    sessionStorage.removeItem('bosy_admin_auth');
    if(typeof auth !== 'undefined') auth.signOut();
    window.location.href = 'index.html';
}

function showSystemToast(message, type = 'info') {
    const toast = document.getElementById('system-toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    
    if(!toast || !msgEl || !iconEl) return;

    msgEl.textContent = message;
    
    if(type === 'success') {
        iconEl.setAttribute('data-lucide', 'check-circle');
        iconEl.className = "w-5 h-5 shrink-0 text-emerald-500";
    } else if(type === 'error') {
        iconEl.setAttribute('data-lucide', 'alert-circle');
        iconEl.className = "w-5 h-5 shrink-0 text-red-500";
    } else {
        iconEl.setAttribute('data-lucide', 'info');
        iconEl.className = "w-5 h-5 shrink-0 text-pink-500";
    }
    
    if(window.lucide) lucide.createIcons();
    
    toast.classList.remove('hidden');
    toast.classList.add('animate-fade-in');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => {
        el.classList.remove('block'); el.classList.add('hidden');
    });
    const target = document.getElementById('admin-' + tabId);
    if(target) {
        target.classList.remove('hidden'); target.classList.add('block');
    }
    
    document.querySelectorAll('.fixed.bottom-0 button').forEach(btn => {
        if(!btn.classList.contains('bg-gradient-to-tr')) { 
            btn.classList.remove('text-pink-400'); btn.classList.add('text-slate-400');
        }
    });
    
    const activeBtn = Array.from(document.querySelectorAll('.fixed.bottom-0 button')).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`switchAdminTab('${tabId}')`));
    if(activeBtn && !activeBtn.classList.contains('bg-gradient-to-tr')) {
        activeBtn.classList.remove('text-slate-400'); activeBtn.classList.add('text-pink-400');
    }
    
    const scrollArea = document.getElementById('main-scroll-area');
    if(scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openConfirmModal(title, message, callback) {
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    confirmActionCallback = callback;
    const modal = document.getElementById('admin-confirm-modal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    document.getElementById('btn-confirm-action').onclick = () => {
        if(confirmActionCallback) confirmActionCallback();
        closeConfirmModal();
    };
}

function closeConfirmModal() {
    const modal = document.getElementById('admin-confirm-modal');
    if(modal){ modal.classList.add('opacity-0'); setTimeout(() => modal.classList.add('hidden'), 300); }
}

// 👑 التحديث الملكي: محرك تعديل الأسعار الجماعي والتخفيضات
async function applyGlobalPriceChange() {
    const percentStr = document.getElementById('global-price-percent')?.value;
    const percent = parseFloat(percentStr);
    const action = document.getElementById('global-price-action')?.value;
    
    if(isNaN(percent) || percent <= 0) { showSystemToast("يرجى إدخال نسبة صحيحة أكبر من 0", "error"); return; }
    
    const msg = action === 'increase' ? `هل أنت متأكد من رفع جميع أسعار المنتجات بنسبة ${percent}%؟` : `هل أنت متأكد من تطبيق خصم بنسبة ${percent}%؟ (سيتم حفظ السعر القديم للمنتجات لإظهار العروض)`;
    
    openConfirmModal('تأكيد التعديل الجماعي للأسعار', msg, async () => {
        const multiplier = action === 'increase' ? (1 + (percent / 100)) : (1 - (percent / 100));
        let updatedCount = 0;
        
        for (let p of catalog) {
            if (p.price && !isNaN(p.price)) {
                if (action === 'decrease') {
                    p.oldPrice = p.price; // حفظ السعر القديم
                } else {
                    p.oldPrice = null; // إزالة السعر القديم عند الزيادة
                }
                
                p.price = Math.round(p.price * multiplier);
                updatedCount++;
                
                try { 
                    if (typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('catalog', String(p.id), p); 
                } catch (e) {}
            }
        }
        
        saveEngineMemory('cat'); syncCatalogMap();
        const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
        renderAdminMenu(currentSearch); renderAdminOverview();
        
        showSystemToast(`تم تطبيق النسبة بنجاح على ${updatedCount} منتج 👑`, "success");
    });
}

function exportBackupJSON() {
    try {
        const backupData = { catalog, settings: siteSettings, shipping: shippingZones, orders: globalOrders, gallery: galleryData };
        const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `BoseSweets_CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); a.remove(); 
        setTimeout(() => URL.revokeObjectURL(url), 100);
        showSystemToast("تم سحب نسخة سحابية شاملة لـ حلويات بوسي بنجاح ☁️", "success");
    } catch (e) { showSystemToast("حدث خطأ أثناء إعداد ملف النسخة", "error"); }
}

function importBackupJSON(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(ev) {
        try {
            const data = JSON.parse(ev.target.result);
            if (Array.isArray(data)) {
                window.catalog = data; saveEngineMemory('cat');
            } else {
                if(data.settings) { window.siteSettings = data.settings; saveEngineMemory('set'); }
                if(data.shipping) { window.shippingZones = data.shipping; saveEngineMemory('ship'); }
                if(data.catalog) { window.catalog = data.catalog; saveEngineMemory('cat'); }
                if(data.orders) { window.globalOrders = data.orders; saveEngineMemory('ord'); }
                if(data.gallery) { window.galleryData = data.gallery; saveEngineMemory('gal'); }
            }
            try {
                if (typeof NetworkEngine !== 'undefined') {
                    if (Array.isArray(data)) { for (let p of data) await NetworkEngine.safeWrite('catalog', String(p.id), p); } 
                    else {
                        if(data.settings) await NetworkEngine.safeWrite('settings', 'main', data.settings); 
                        if(data.shipping) for (let z of data.shipping) await NetworkEngine.safeWrite('shipping', String(z.id), z); 
                        if(data.catalog) for (let p of data.catalog) await NetworkEngine.safeWrite('catalog', String(p.id), p); 
                        if(data.orders) for (let o of data.orders) await NetworkEngine.safeWrite('orders', String(o.id), o); 
                    }
                }
            } catch(cloudErr) {}

            showSystemToast("تم استرجاع بيانات حلويات بوسي بنجاح! جاري إعادة التشغيل... 🚀", "success");
            setTimeout(() => location.reload(), 2000);
        } catch(err) { showSystemToast("ملف JSON غير صالح للاستيراد!", "error"); }
    };
    reader.readAsText(file);
}

// 👑 التحديث الملكي: حقن إعدادات الهوية البصرية لاستوديو الألوان
function fillAdminSettingsForm() {
    if(!window.siteSettings) return;
    if(document.getElementById('set-brand')) document.getElementById('set-brand').value = siteSettings.brandName || 'حلويات بوسي'; 
    if(document.getElementById('set-hero-title')) document.getElementById('set-hero-title').value = siteSettings.heroTitle || ''; 
    if(document.getElementById('set-hero-desc')) document.getElementById('set-hero-desc').value = siteSettings.heroDesc || '';
    if(document.getElementById('set-footer-phone')) document.getElementById('set-footer-phone').value = siteSettings.footerPhone || ''; 
    if(document.getElementById('set-footer-address')) document.getElementById('set-footer-address').value = (siteSettings.footerAddress || '').replace(/<br>/g, '');
    if(document.getElementById('set-footer-quote')) document.getElementById('set-footer-quote').value = siteSettings.footerQuote || ''; 
    if(document.getElementById('set-ticker-active')) document.getElementById('set-ticker-active').checked = siteSettings.tickerActive !== false;
    if(document.getElementById('set-ticker-text')) document.getElementById('set-ticker-text').value = siteSettings.tickerText || siteSettings.announcement || '';

    // إعدادات الهوية
    const v = siteSettings.visuals || defaultSettings.visuals;
    if(document.getElementById('set-visual-color-hex')) {
        document.getElementById('set-visual-color-hex').value = v.themeHex || '#ec4899';
        if(document.getElementById('set-visual-color-picker')) document.getElementById('set-visual-color-picker').value = v.themeHex || '#ec4899';
    }
    if(document.getElementById('set-visual-bg')) document.getElementById('set-visual-bg').value = v.bgHex || '#ffffff';
    if(document.getElementById('set-visual-text')) document.getElementById('set-visual-text').value = v.textHex || '#4a2b2b';
    if(document.getElementById('set-visual-font')) document.getElementById('set-visual-font').value = v.fontFamily || "'Cairo', sans-serif";
    if(document.getElementById('set-visual-loader')) document.getElementById('set-visual-loader').value = v.loaderText || "أهلاً بكم في عالم حلويات بوسي ✨";

    executeSafely('CakeBuilder', fillCakeBuilderAdmin);
}

async function saveStoreSettings() {
    if(!window.siteSettings) window.siteSettings = {};
    if(document.getElementById('set-brand')) siteSettings.brandName = document.getElementById('set-brand').value; 
    if(document.getElementById('set-hero-title')) siteSettings.heroTitle = document.getElementById('set-hero-title').value; 
    if(document.getElementById('set-hero-desc')) siteSettings.heroDesc = document.getElementById('set-hero-desc').value;
    if(document.getElementById('set-footer-phone')) siteSettings.footerPhone = document.getElementById('set-footer-phone').value; 
    if(document.getElementById('set-footer-address')) siteSettings.footerAddress = document.getElementById('set-footer-address').value;
    if(document.getElementById('set-footer-quote')) siteSettings.footerQuote = document.getElementById('set-footer-quote').value; 
    if(document.getElementById('set-ticker-active')) siteSettings.tickerActive = document.getElementById('set-ticker-active').checked;
    if(document.getElementById('set-ticker-text')) {
        siteSettings.tickerText = document.getElementById('set-ticker-text').value;
        siteSettings.announcement = document.getElementById('set-ticker-text').value; 
    }

    // حفظ الهوية
    if(!siteSettings.visuals) siteSettings.visuals = {};
    if(document.getElementById('set-visual-color-hex')) siteSettings.visuals.themeHex = document.getElementById('set-visual-color-hex').value;
    if(document.getElementById('set-visual-bg')) siteSettings.visuals.bgHex = document.getElementById('set-visual-bg').value;
    if(document.getElementById('set-visual-text')) siteSettings.visuals.textHex = document.getElementById('set-visual-text').value;
    if(document.getElementById('set-visual-font')) siteSettings.visuals.fontFamily = document.getElementById('set-visual-font').value;
    if(document.getElementById('set-visual-loader')) siteSettings.visuals.loaderText = document.getElementById('set-visual-loader').value;

    try {
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings); 
        saveEngineMemory('set'); 
        showSystemToast("تم حفظ إعدادات حلويات بوسي بنجاح! 👑", "success");
    } catch(e) { saveEngineMemory('set'); showSystemToast("تم الحفظ محلياً", "info"); }
}

/**
 * 🛡️ Engine Upgrade: Secure Cloud Password Management
 */
async function changeAdminPassword() {
    const currentInput = document.getElementById('sec-current-pwd').value; 
    const newPwd = document.getElementById('sec-new-pwd').value; 
    const confirmPwd = document.getElementById('sec-confirm-pwd').value;

    if (!currentInput || !newPwd || !confirmPwd) { showSystemToast("يرجى ملء جميع الحقول", "error"); return; }
    if (newPwd !== confirmPwd) { showSystemToast("كلمة المرور الجديدة غير متطابقة", "error"); return; }
    if (newPwd.length < 6) { showSystemToast("الرمز السري للسحابة يجب أن يكون 6 أحرف/أرقام على الأقل", "error"); return; }

    try {
        const user = auth.currentUser;
        if (!user) { showSystemToast("انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً", "error"); return; }

        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentInput);
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPwd);

        if (siteSettings.adminPassword) {
            delete siteSettings.adminPassword;
            if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings);
            saveEngineMemory('set');
        }

        showSystemToast("تم تغيير الرمز السري وتشفيره سحابياً بنجاح 🛡️", "success");
        document.getElementById('sec-current-pwd').value = ''; 
        document.getElementById('sec-new-pwd').value = ''; 
        document.getElementById('sec-confirm-pwd').value = '';

    } catch(e) {
        AdminErrorTracker.log('AdminPasswordChange', e);
        if (e.code === 'auth/wrong-password') {
            showSystemToast("كلمة المرور الحالية غير صحيحة", "error");
        } else {
            showSystemToast("حدث خطأ أثناء تشفير كلمة المرور الجديدة", "error");
        }
    }
}

function renderAdminShipping() {
    const tbody = document.getElementById('admin-shipping-tbody');
    if(!tbody) return;
    if(!shippingZones || shippingZones.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-500 font-bold text-xs">لا يوجد مناطق شحن مضافة</td></tr>`;
        return;
    }
    tbody.innerHTML = shippingZones.map(z => `
        <tr class="hover:bg-slate-800 border-b border-slate-800/50 transition-colors">
            <td class="p-3 font-bold text-slate-200 whitespace-nowrap">${escapeHTML(z.name || '')}</td>
            <td class="p-3 font-black text-emerald-400 whitespace-nowrap">${z.fee} ج.م</td>
            <td class="p-3 text-center whitespace-nowrap">
                <button onclick="deleteShippingZoneConfirm('${z.id}', '${escapeHTML(z.name || '')}')" class="text-red-400 hover:text-white p-1.5 bg-slate-800 hover:bg-red-600 rounded-lg transition-colors relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    if(window.lucide) lucide.createIcons();
}

function openAddShippingModal() { 
    if(document.getElementById('ship-area-name')) document.getElementById('ship-area-name').value = ''; 
    if(document.getElementById('ship-area-fee')) document.getElementById('ship-area-fee').value = ''; 
    const modal = document.getElementById('admin-ship-modal');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => modal.classList.remove('opacity-0'), 10); }
}

function closeShipModal() { 
    const modal = document.getElementById('admin-ship-modal');
    if(modal) { modal.classList.add('opacity-0'); setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300); }
}

async function saveShippingZone() {
    const n = document.getElementById('ship-area-name').value.trim(); const f = parseInt(document.getElementById('ship-area-fee').value) || 0;
    if(!n) { showSystemToast("الرجاء كتابة اسم المنطقة", "error"); return; }
    const newZone = { id: 'sh_' + Date.now() + Math.floor(Math.random() * 100), name: n, fee: f }; 
    shippingZones.push(newZone);
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('shipping', String(newZone.id), newZone); 
        saveEngineMemory('ship'); showSystemToast("تم إضافة منطقة الشحن بنجاح", "success"); 
    } catch (e) { saveEngineMemory('ship'); showSystemToast("تم الإضافة محلياً", "info"); }
    closeShipModal(); renderAdminShipping();
}

function deleteShippingZoneConfirm(id, name) {
    openConfirmModal('حذف منطقة شحن', `هل أنت متأكد من حذف منطقة "${name}"؟`, () => { executeDeleteShippingZone(id); });
}

async function executeDeleteShippingZone(id) {
    shippingZones = shippingZones.filter(z => String(z.id) !== String(id));
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeDelete('shipping', String(id)); 
        saveEngineMemory('ship'); showSystemToast("تم الحذف بنجاح", "success"); 
    } catch(e) { saveEngineMemory('ship'); }
    renderAdminShipping();
}

function renderAdminOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const validOrders = globalOrders.filter(o => o.status !== 'cancelled');
    const monthlyRevenue = validOrders.filter(o => (o.timestamp || 0) >= startOfMonth).reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    
    if(document.getElementById('admin-stat-products')) document.getElementById('admin-stat-products').innerText = catalog ? catalog.length : 0;
    if(document.getElementById('admin-stat-orders')) document.getElementById('admin-stat-orders').innerText = validOrders.length;
    if(document.getElementById('admin-stat-revenue')) document.getElementById('admin-stat-revenue').innerHTML = monthlyRevenue.toLocaleString('ar-EG') + ' <span class="text-lg text-slate-400">ج.م</span>';
    renderQuickRecentOrders();
}

function renderQuickRecentOrders() {
    const container = document.getElementById('quick-recent-orders');
    if(!container) return;
    if(!globalOrders || globalOrders.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-500 text-center py-4">لا توجد طلبات حديثة</p>'; return;
    }
    const recent = [...globalOrders].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
    container.innerHTML = recent.map(o => {
        let statusColor = "bg-slate-500/20 text-slate-400"; let statusText = "مجهول";
        if(o.status === 'pending') { statusColor = "bg-amber-500/20 text-amber-400"; statusText = "مراجعة"; }
        if(o.status === 'processing') { statusColor = "bg-blue-500/20 text-blue-400"; statusText = "تجهيز"; }
        if(o.status === 'completed') { statusColor = "bg-emerald-500/20 text-emerald-400"; statusText = "مكتمل"; }
        if(o.status === 'cancelled') { statusColor = "bg-red-500/20 text-red-400"; statusText = "ملغي"; }
        let timeString = o.date || ''; try { if(timeString.includes(',')) timeString = timeString.split(',')[1]; } catch(e){}
        return `
            <div onclick="openOrderDetails('${o.id}')" class="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 flex justify-between items-center cursor-pointer transition-colors active:scale-95">
                <div>
                    <p class="text-sm font-bold text-white tracking-wide">#${(o.id||'').substring(0,6)}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5"><i data-lucide="user" class="w-3 h-3 inline"></i> ${escapeHTML(o.name || 'عميل')}</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <span class="text-[10px] ${statusColor} px-2 py-0.5 rounded-md font-bold">${statusText}</span>
                    <span class="text-[9px] text-slate-500 font-mono" dir="ltr">${timeString}</span>
                </div>
            </div>
        `;
    }).join('');
    if(window.lucide) lucide.createIcons();
}

function initAdminCharts() {
    const canvas = document.getElementById('salesChart'); const placeholder = document.getElementById('chart-placeholder');
    if(!canvas || typeof Chart === 'undefined') return;
    if(placeholder) placeholder.style.display = 'none';

    const last7Days = []; const salesData = []; const now = new Date();
    for(let i=6; i>=0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        last7Days.push(d.toLocaleDateString('ar-EG', { weekday: 'short' }));
        const startOfDay = d.setHours(0, 0, 0, 0); const endOfDay = d.setHours(23, 59, 59, 999);
        let dayTotal = 0;
        if(globalOrders && globalOrders.length > 0) {
            dayTotal = globalOrders.filter(o => o.status === 'completed' && o.timestamp >= startOfDay && o.timestamp <= endOfDay).reduce((sum, o) => sum + Number(o.total || 0), 0);
        }
        salesData.push(dayTotal); 
    }
    if(salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(canvas, {
        type: 'line', data: { labels: last7Days, datasets: [{ label: 'المبيعات (ج.م)', data: salesData, borderColor: '#ec4899', backgroundColor: 'rgba(236, 72, 153, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#0f172a', pointBorderColor: '#ec4899', pointBorderWidth: 2, pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Cairo' } } } } }
    });
}

function renderAdminOrderFilters() {
    const filtersEl = document.getElementById('admin-order-filters');
    if(!filtersEl) return;
    const filters = [ { id: 'all', label: 'الكل' }, { id: 'pending', label: '🟡 مراجعة' }, { id: 'processing', label: '🟠 تجهيز' }, { id: 'completed', label: '🟢 مكتمل' }, { id: 'cancelled', label: '🔴 ملغي' } ];
    filtersEl.innerHTML = filters.map(f => `
        <button onclick="setAdminOrderFilter('${f.id}')" class="whitespace-nowrap px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm border ${adminOrderFilter === f.id ? 'bg-pink-500 text-white border-pink-400 scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border-slate-700'}">${f.label}</button>
    `).join('');
}

function setAdminOrderFilter(f) { adminOrderFilter = f; renderAdminOrderFilters(); renderAdminOrders(); }
function filterOrdersByDate() { renderAdminOrders(); }
function refreshOrders() { showSystemToast('الرصد الحي يعمل. القائمة محدثة...', 'info'); renderAdminOrders(); }

function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-tbody');
    if(!tbody) return;
    if(!globalOrders || globalOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-slate-500 font-bold bg-slate-900/50">لا توجد طلبات مسجلة حالياً في مركز القيادة.</td></tr>`; return; 
    }
    let list = [...globalOrders].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (adminOrderFilter !== 'all') list = list.filter(o => (o.status || 'pending') === adminOrderFilter);
    
    const dateFilter = document.getElementById('order-filter-date')?.value;
    if(dateFilter) {
        const filterDate = new Date(dateFilter); const startOfFilter = filterDate.setHours(0,0,0,0); const endOfFilter = filterDate.setHours(23,59,59,999);
        list = list.filter(o => o.timestamp >= startOfFilter && o.timestamp <= endOfFilter);
    }

    const pendingCount = globalOrders.filter(o => o.status === 'pending').length;
    const navBadge = document.getElementById('nav-order-badge');
    if(navBadge) { if(pendingCount > 0) navBadge.classList.remove('hidden'); else navBadge.classList.add('hidden'); }

    if(list.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-slate-500 font-bold bg-slate-900/50">لا توجد طلبات مطابقة للبحث.</td></tr>`; return; }
    
    tbody.innerHTML = list.map(o => {
        const s = o.status || 'pending'; let statusBadge = '';
        if(s === 'pending') statusBadge = '<span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-[10px] font-bold">قيد المراجعة</span>';
        if(s === 'processing') statusBadge = '<span class="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded text-[10px] font-bold">جاري التجهيز</span>';
        if(s === 'completed') statusBadge = '<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold">مكتمل</span>';
        if(s === 'cancelled') statusBadge = '<span class="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[10px] font-bold">ملغي</span>';
        return `
        <tr class="hover:bg-slate-800 transition-colors border-b border-slate-800/50 cursor-pointer group" onclick="openOrderDetails('${o.id}')">
            <td class="p-4 font-mono text-pink-400 whitespace-nowrap font-bold text-xs">#${escapeHTML((o.id||'').substring(0,8))}</td>
            <td class="p-4 text-[11px] text-slate-400 whitespace-nowrap" dir="ltr">${escapeHTML(o.date || '')}</td>
            <td class="p-4 min-w-[150px]"><p class="font-bold text-slate-200">${escapeHTML(o.name || 'عميل')}</p><p class="text-[10px] text-slate-500 mt-1 font-mono">${escapeHTML(o.phone || '')}</p></td>
            <td class="p-4 font-black text-emerald-400 whitespace-nowrap">${escapeHTML((o.total||0).toString())} ج</td>
            <td class="p-4 whitespace-nowrap">${statusBadge}</td>
            <td class="p-4 text-center whitespace-nowrap"><button class="text-slate-400 group-hover:text-pink-400 p-2 bg-slate-900 group-hover:bg-pink-500/10 rounded-lg transition-colors border border-slate-700 group-hover:border-pink-500/30"><i data-lucide="eye" class="w-4 h-4"></i></button></td>
        </tr>
    `}).join('');
    if(window.lucide) lucide.createIcons();
}

function openOrderDetails(orderId) {
    const order = globalOrders.find(o => String(o.id) === String(orderId));
    if(!order) return;
    if(document.getElementById('modal-order-id')) document.getElementById('modal-order-id').innerText = `#${(order.id||'').substring(0,8)}`;
    if(document.getElementById('modal-order-date')) document.getElementById('modal-order-date').innerText = order.date || '';
    if(document.getElementById('modal-order-name')) document.getElementById('modal-order-name').innerText = order.name || '';
    if(document.getElementById('modal-order-phone')) document.getElementById('modal-order-phone').innerText = order.phone || '';
    
    const waBtn = document.getElementById('modal-order-whatsapp');
    if(waBtn && order.phone) {
        let phoneStr = order.phone.replace(/\D/g,''); if(phoneStr.startsWith('0')) phoneStr = '2' + phoneStr; 
        waBtn.href = `https://wa.me/${phoneStr}?text=أهلاً بك يا فندم من إدارة حلويات بوسي 👑 بخصوص طلبك رقم: ${(order.id||'').substring(0,6)}`;
    }

    if(document.getElementById('modal-order-area')) document.getElementById('modal-order-area').innerText = order.area || 'غير محدد';
    if(document.getElementById('modal-order-address')) document.getElementById('modal-order-address').innerText = order.address || 'لا يوجد عنوان تفصيلي';
    
    const notesEl = document.getElementById('modal-order-notes');
    if(notesEl) { if(order.notes) { notesEl.classList.remove('hidden'); notesEl.innerText = `ملاحظات: ${order.notes}`; } else { notesEl.classList.add('hidden'); } }

    const itemsContainer = document.getElementById('modal-order-items');
    if(itemsContainer) {
        if (Array.isArray(order.itemsArray)) {
            itemsContainer.innerHTML = order.itemsArray.map(item => `
                <div class="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="flex items-center gap-3"><span class="w-6 h-6 flex items-center justify-center bg-slate-900 text-pink-400 font-bold rounded text-xs">${item.qty || item.quantity || 1}x</span><div><p class="text-sm font-bold text-white">${escapeHTML(item.name || '')}</p>${item.desc || item.notes ? `<p class="text-[10px] text-amber-400 mt-0.5">${escapeHTML(item.desc || item.notes)}</p>` : ''}</div></div>
                    <span class="text-sm font-mono text-emerald-400">${(item.price || 0) * (item.qty || item.quantity || 1)} ج</span>
                </div>
            `).join('');
        } else if(typeof order.items === 'string') { itemsContainer.innerHTML = `<div class="p-3 bg-slate-800 rounded-lg text-sm text-slate-300 leading-relaxed">${escapeHTML(order.items).replace(/\n/g, '<br>')}</div>`; } 
        else if(typeof order.itemsDesc === 'string') { itemsContainer.innerHTML = `<div class="p-3 bg-slate-800 rounded-lg text-sm text-slate-300 leading-relaxed">${escapeHTML(order.itemsDesc).replace(/\n/g, '<br>')}</div>`; } 
        else { itemsContainer.innerHTML = `<div class="p-3 bg-slate-800 rounded-lg text-sm text-slate-500 italic">لا توجد تفاصيل للعناصر</div>`; }
    }

    if(document.getElementById('modal-order-subtotal')) document.getElementById('modal-order-subtotal').innerText = ((order.total || 0) - (order.shippingFee || 0)) + ' ج.م';
    if(document.getElementById('modal-order-shipping')) document.getElementById('modal-order-shipping').innerText = (order.shippingFee || 0) + ' ج.م';
    if(document.getElementById('modal-order-total')) document.getElementById('modal-order-total').innerText = (order.total || 0) + ' ج.م';

    const statusSelect = document.getElementById('modal-order-status');
    if(statusSelect) { statusSelect.value = order.status || 'pending'; statusSelect.setAttribute('data-current-id', order.id); }

    const modal = document.getElementById('admin-order-modal');
    if(modal) { modal.classList.remove('hidden'); setTimeout(() => modal.classList.remove('opacity-0'), 10); }
    if(window.lucide) lucide.createIcons();
}

function closeOrderModal() {
    const modal = document.getElementById('admin-order-modal');
    if(modal) { modal.classList.add('opacity-0'); setTimeout(() => modal.classList.add('hidden'), 300); }
}

async function updateOrderStatus() {
    const selectEl = document.getElementById('modal-order-status');
    if(!selectEl) return;
    const id = selectEl.getAttribute('data-current-id'); 
    const newStatus = selectEl.value;
    const orderIdx = globalOrders.findIndex(o => String(o.id) === String(id));
    
    if (orderIdx > -1) {
        const oldStatus = globalOrders[orderIdx].status;
        globalOrders[orderIdx].status = newStatus;
        saveEngineMemory('ord');
        
        try {
            if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('orders', String(id), globalOrders[orderIdx]);
            showSystemToast('تم تحديث حالة الطلب بنجاح 👑', 'success');

            if (oldStatus !== newStatus && (newStatus === 'processing' || newStatus === 'completed')) {
                triggerMakeWebhook(globalOrders[orderIdx], newStatus);
            }

        } catch (e) { showSystemToast('تم تحديث الحالة محلياً', 'info'); }
        renderAdminOverview(); renderAdminOrders(); closeOrderModal();
    }
}

async function triggerMakeWebhook(orderData, status) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const idToken = await user.getIdToken();
        const secureEndpoint = 'https://us-central1-bosy-sweets.cloudfunctions.net/secureWebhookTrigger';

        await fetch(secureEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` 
            },
            body: JSON.stringify({
                orderId: orderData.id,
                customerName: orderData.name,
                customerPhone: orderData.phone,
                status: status,
                total: orderData.total,
                brand: siteSettings.brandName
            })
        });
        console.log("BoseSweets: Secure Cloud Webhook triggered successfully. 👑");
    } catch(e) {
        console.warn("BoseSweets: Secure Webhook communication passed to offline queue.", e);
    }
}

function printOrderInvoice() { window.print(); }

function renderAdminCatalogTabs() {
    const tabsEl = document.getElementById('admin-catalog-tabs');
    if(!tabsEl) return;
    
    // 👑 التحديث الملكي: ترتيب الأقسام
    const sortedCats = [...catMenu].sort((a, b) => a.order - b.order);
    
    let html = `<button onclick="setAdminCat('all')" class="whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border relative z-20 pointer-events-auto ${adminCurrentCat === 'all' ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}">الكل</button>`;
    if(sortedCats && sortedCats.length > 0) {
        sortedCats.forEach(c => { html += `<button onclick="setAdminCat('${escapeHTML(c.name)}')" class="whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border relative z-20 pointer-events-auto ${adminCurrentCat === c.name ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}">${escapeHTML(c.name)}</button>`; });
    }
    tabsEl.innerHTML = html;
}

function setAdminCat(c) {
    adminCurrentCat = c; renderAdminCatalogTabs();
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    renderAdminMenu(currentSearch);
}

// 👑 التحديث الملكي: ترتيب المنتجات المخصص وإظهار الخصومات والمخزون
function renderAdminMenu(searchQuery = '') {
    const container = document.getElementById('admin-menu-list');
    if (!container) return; 
    container.innerHTML = '';
    if(!catalog || catalog.length === 0) {
        container.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700 relative z-10"><i data-lucide="package-x" class="w-12 h-12 mb-3 text-slate-600"></i><p class="font-bold text-sm">لا يوجد منتجات مسجلة في متجر حلويات بوسي بعد</p><button onclick="openAddProductModal()" class="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg text-xs font-bold hover:bg-pink-600 transition-colors relative z-50 pointer-events-auto cursor-pointer">إضافة منتج جديد</button></div>`;
        if(window.lucide) lucide.createIcons(); return;
    }

    let list = [...catalog];
    if (adminCurrentCat !== 'all') list = list.filter(p => p.category === adminCurrentCat);
    if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)) || (p.subType && p.subType.toLowerCase().includes(q)));
    }
    
    const sortType = document.getElementById('admin-sort-catalog')?.value || 'custom';
    if(sortType === 'custom') list.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
    if(sortType === 'newest') list.sort((a, b) => { const timeA = a.id.split('_')[1]; const timeB = b.id.split('_')[1]; return timeB - timeA; });
    if(sortType === 'price_high') list.sort((a, b) => b.price - a.price);
    if(sortType === 'price_low') list.sort((a, b) => a.price - b.price);
    if(sortType === 'name') list.sort((a, b) => (a.name||'').localeCompare(b.name||'', 'ar'));

    if (list.length === 0) {
        container.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700 relative z-10"><i data-lucide="search-x" class="w-12 h-12 mb-3 text-slate-600"></i><p class="font-bold text-sm">لا يوجد منتجات مطابقة لعملية البحث</p></div>`;
        if(window.lucide) lucide.createIcons(); return;
    }

    container.innerHTML = list.map(prod => {
        const imageUrl = (prod.images && prod.images.length > 0) ? (prod.images[0].startsWith('offline_img_') ? 'https://via.placeholder.com/150?text=جاري+الرفع' : prod.images[0]) : (prod.img || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80');
        const isInstock = prod.inStock !== false;
        const oldPriceHtml = (prod.oldPrice && prod.oldPrice > prod.price) ? `<del class="text-[10px] text-slate-500 ml-1 font-normal">${prod.oldPrice}</del>` : '';
        
        return `
            <div class="admin-card flex flex-col md:flex-row gap-4 relative overflow-visible group transition-all duration-300 hover:border-pink-500/50 ${!isInstock ? 'opacity-60' : ''} p-4 bg-slate-900 rounded-xl border border-slate-800">
                <div class="w-full md:w-28 h-36 md:h-28 rounded-xl bg-slate-800 shrink-0 overflow-hidden relative shadow-inner">
                    <img src="${imageUrl}" alt="${escapeHTML(prod.name || '')}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ${prod.badge ? `<span class="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] px-2 py-0.5 rounded shadow-lg font-bold z-10">${prod.badge}</span>` : ''}
                    ${!isInstock ? `<div class="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm z-10"><span class="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold">نفذت الكمية</span></div>` : ''}
                    ${(prod.images && prod.images.length > 1) ? `<span class="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold z-10">+${prod.images.length - 1}</span>` : ''}
                </div>
                <div class="flex-1 flex flex-col justify-between py-1 relative z-20">
                    <div>
                        <div class="flex justify-between items-start mb-1">
                            <p class="text-[10px] text-pink-400 font-bold uppercase tracking-wider bg-pink-500/10 px-2 py-0.5 rounded inline-block">${escapeHTML(prod.category || '')}</p>
                            <p class="text-white font-black text-base bg-slate-900 px-2 py-0.5 rounded border border-slate-700">${Number(prod.price) > 0 ? prod.price + '<span class="text-[9px] text-slate-400 ml-1">ج.م</span>' + oldPriceHtml : 'متغير'}</p>
                        </div>
                        <h3 class="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">${escapeHTML(prod.name || '')}</h3>
                        ${prod.subType || prod.size ? `<p class="text-[10px] text-slate-400 mb-2 truncate"><i data-lucide="tag" class="w-3 h-3 inline"></i> ${escapeHTML(prod.subType || prod.size)}</p>` : ''}
                    </div>
                    <div class="flex gap-2 mt-3 md:mt-0 relative z-50 pointer-events-auto">
                        <button onclick="editProduct('${prod.id}')" class="flex-1 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white transition-colors py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 border border-indigo-500/20 cursor-pointer pointer-events-auto"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i> تعديل</button>
                        <button onclick="deleteProductConfirm('${prod.id}')" class="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-colors py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 border border-red-500/20 cursor-pointer pointer-events-auto"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> حذف</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    if(window.lucide) lucide.createIcons();
}

function renderAdminTempImages() {
    const container = document.getElementById('edit-prod-images-container');
    if(!container) return;
    if(tempProdImages.length === 0) {
        container.innerHTML = `<div class="w-full text-center py-4 text-xs text-slate-500 font-bold border border-dashed border-slate-700 rounded-lg">لم يتم إضافة صور للمنتج بعد</div>`; return;
    }
    container.innerHTML = tempProdImages.map((url, idx) => `
        <div class="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 border-slate-700 group">
            <img src="${url.startsWith('offline_img_') ? 'https://via.placeholder.com/150?text=صورة+محلية' : url}" class="w-full h-full object-cover">
            ${idx === 0 ? `<div class="absolute bottom-0 left-0 right-0 bg-pink-500/90 text-white text-[9px] font-bold text-center py-0.5 backdrop-blur-sm z-10">الرئيسية</div>` : ''}
            <button onclick="removeTempImage(${idx})" class="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-md hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-sm cursor-pointer z-50 pointer-events-auto"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
}
function removeTempImage(idx) { tempProdImages.splice(idx, 1); renderAdminTempImages(); }

async function getSecureUploadSignature() {
    try {
        if(typeof auth === 'undefined' || !auth.currentUser) return null;
        const idToken = await auth.currentUser.getIdToken();
        const secureEndpoint = 'https://us-central1-bosy-sweets.cloudfunctions.net/getCloudinarySignature';
        const response = await fetch(secureEndpoint, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (!response.ok) throw new Error("Signature Server Unavailable");
        return await response.json(); 
    } catch (e) {
        AdminErrorTracker.log('SecureUploadSignature', e);
        console.warn("BoseSweets Security: Failed to fetch secure signature. Falling back to temporary preset.", e);
        return null;
    }
}

async function compressAndUploadMultiImage(e) {
    const files = e.target.files; if (!files || files.length === 0) return;
    const spinner = document.getElementById('uploading-spinner'); if(spinner) spinner.classList.remove('hidden');
    let offlineSaved = false;

    for(let i=0; i<files.length; i++) {
        const file = files[i];
        if (!file.type.match('image.*')) { showSystemToast("الرجاء اختيار ملف صورة فقط", "error"); continue; }
        await new Promise((resolve) => {
            const reader = new FileReader(); reader.readAsDataURL(file);
            reader.onload = function(ev) {
                const img = new Image(); img.src = ev.target.result;
                img.onload = async function() {
                    const canvas = document.createElement('canvas'); const MAX_WIDTH = 1000; let scaleSize = 1;
                    if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
                    canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const base64Str = canvas.toDataURL('image/jpeg', 0.85); 
                    
                    if (navigator.onLine) {
                        try {
                            const secureToken = await getSecureUploadSignature();
                            const formData = new FormData(); 
                            formData.append('file', base64Str); 
                            
                            if (secureToken && secureToken.signature) {
                                formData.append('signature', secureToken.signature);
                                formData.append('timestamp', secureToken.timestamp);
                                formData.append('api_key', secureToken.api_key);
                            } else {
                                formData.append('upload_preset', 'gct8i28h'); 
                            }
                            
                            const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                            const data = await response.json();
                            if (data.secure_url) { tempProdImages.push(data.secure_url); } else throw new Error("Upload failed");
                        } catch (err) { 
                            const offlineId = 'offline_img_' + Date.now() + Math.random().toString(36).substr(2, 5);
                            await OfflineStorageManager.enqueuePayload({ offlineId: offlineId, base64: base64Str });
                            tempProdImages.push(offlineId); 
                            offlineSaved = true; 
                        } 
                    } else {
                        const offlineId = 'offline_img_' + Date.now() + Math.random().toString(36).substr(2, 5);
                        await OfflineStorageManager.enqueuePayload({ offlineId: offlineId, base64: base64Str });
                        tempProdImages.push(offlineId); 
                        offlineSaved = true;
                    }
                    resolve();
                }
            }
        });
    }
    renderAdminTempImages();
    if(spinner) spinner.classList.add('hidden'); 
    if(document.getElementById('prod-img-upload')) document.getElementById('prod-img-upload').value = '';
    
    if (offlineSaved) {
        showSystemToast("تم حفظ الصور مؤقتا في الخزنة لضعف الإنترنت ستُرفع للسحابة لاحقا 🔄", "info");
    } else {
        showSystemToast("تم الرفع وإضافة الصور للمنتج 👑", "success");
    }
}

function openAddProductModal() {
    currentEditId = null; 
    if(document.getElementById('prod-modal-title')) document.getElementById('prod-modal-title').innerHTML = `<i data-lucide="plus-circle" class="w-6 h-6 text-pink-500"></i> إضافة منتج جديد`;
    
    const fields = ['edit-prod-id','edit-prod-name','edit-prod-price','edit-prod-old-price','edit-prod-sub','edit-prod-sort','edit-prod-desc'];
    fields.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    
    const catSelect = document.getElementById('edit-prod-cat');
    const sortedCats = [...catMenu].sort((a, b) => a.order - b.order);
    if(catSelect) {
        catSelect.innerHTML = sortedCats.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('');
        catSelect.value = adminCurrentCat === 'all' ? (sortedCats.length > 0 ? sortedCats[0].name : "تورت") : adminCurrentCat; 
    }
    
    if(document.getElementById('edit-prod-layout')) document.getElementById('edit-prod-layout').value = 'default';
    if(document.getElementById('edit-prod-badge')) document.getElementById('edit-prod-badge').value = '';
    
    const stockEl = document.getElementById('edit-prod-instock');
    if(stockEl) { stockEl.checked = true; if(document.getElementById('instock-label-text')) document.getElementById('instock-label-text').innerText = 'متوفر'; }
    
    tempProdImages = []; renderAdminTempImages();
    const m = document.getElementById('admin-prod-modal'); 
    if(m) { m.classList.remove('hidden'); m.classList.add('flex'); setTimeout(() => m.classList.remove('opacity-0'), 10); }
    if(window.lucide) lucide.createIcons();
}

function editProduct(id) {
    let p = catalog.find(x => String(x.id) === String(id));
    if(!p && typeof catalogMap !== 'undefined') p = catalogMap.get(String(id)); 
    if (p) {
        currentEditId = String(id); 
        if(document.getElementById('prod-modal-title')) document.getElementById('prod-modal-title').innerHTML = `<i data-lucide="edit-3" class="w-6 h-6 text-pink-500"></i> تعديل المنتج`;
        
        const catSelect = document.getElementById('edit-prod-cat');
        const sortedCats = [...catMenu].sort((a, b) => a.order - b.order);
        if(catSelect) catSelect.innerHTML = sortedCats.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('');
        
        if(document.getElementById('edit-prod-id')) document.getElementById('edit-prod-id').value = p.id; 
        if(document.getElementById('edit-prod-name')) document.getElementById('edit-prod-name').value = p.name || '';
        if(document.getElementById('edit-prod-price')) document.getElementById('edit-prod-price').value = p.price || ''; 
        if(document.getElementById('edit-prod-old-price')) document.getElementById('edit-prod-old-price').value = p.oldPrice || ''; 
        if(document.getElementById('edit-prod-cat')) document.getElementById('edit-prod-cat').value = p.category;
        if(document.getElementById('edit-prod-sub')) document.getElementById('edit-prod-sub').value = p.subType || p.size || p.flowerType || ""; 
        if(document.getElementById('edit-prod-sort')) document.getElementById('edit-prod-sort').value = p.sortOrder || ""; 
        if(document.getElementById('edit-prod-layout')) document.getElementById('edit-prod-layout').value = p.layout || 'default';
        if(document.getElementById('edit-prod-badge')) document.getElementById('edit-prod-badge').value = p.badge || '';
        
        const stockEl = document.getElementById('edit-prod-instock');
        if(stockEl) { 
            stockEl.checked = p.inStock !== false; 
            if(document.getElementById('instock-label-text')) document.getElementById('instock-label-text').innerText = (p.inStock !== false) ? 'متوفر' : 'نفذت'; 
        }
        
        if(document.getElementById('edit-prod-desc')) document.getElementById('edit-prod-desc').value = p.desc || ''; 
        
        if(p.images && p.images.length > 0) tempProdImages = [...p.images]; else if(p.img) tempProdImages = [p.img]; else tempProdImages = [];
        renderAdminTempImages();
        
        const m = document.getElementById('admin-prod-modal'); 
        if(m) { m.classList.remove('hidden'); m.classList.add('flex'); setTimeout(() => m.classList.remove('opacity-0'), 10); }
        if(window.lucide) lucide.createIcons();
    }
}

function closeProdModal() { 
    const m = document.getElementById('admin-prod-modal'); 
    if(m) { m.classList.add('opacity-0'); setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); currentEditId = null; }, 300); }
}

async function saveProductData() {
    const nName = document.getElementById('edit-prod-name')?.value.trim(); 
    const nPrice = parseInt(document.getElementById('edit-prod-price')?.value) || 0;
    const nOldPrice = parseInt(document.getElementById('edit-prod-old-price')?.value) || null;
    const nSort = parseInt(document.getElementById('edit-prod-sort')?.value) || 999;
    const nCat = document.getElementById('edit-prod-cat')?.value; 
    const nSub = document.getElementById('edit-prod-sub')?.value.trim();
    const nLayout = document.getElementById('edit-prod-layout')?.value || 'default'; 
    const nBadge = document.getElementById('edit-prod-badge')?.value || '';
    const nInStock = document.getElementById('edit-prod-instock')?.checked; 
    const nDesc = document.getElementById('edit-prod-desc')?.value.trim();
    
    if(!nName) { showSystemToast("يجب كتابة اسم المنتج", "error"); return; }
    
    const finalImagesArray = [...tempProdImages]; const finalImg = finalImagesArray.length > 0 ? finalImagesArray[0] : '';
    let prodObj;
    
    if (currentEditId) {
        const idx = catalog.findIndex(x => String(x.id) === String(currentEditId));
        if (idx > -1) {
            catalog[idx].name = nName; catalog[idx].price = nPrice; catalog[idx].oldPrice = nOldPrice;
            catalog[idx].category = nCat; catalog[idx].desc = nDesc; catalog[idx].sortOrder = nSort;
            catalog[idx].images = finalImagesArray; catalog[idx].img = finalImg; catalog[idx].subType = nSub; 
            catalog[idx].layout = nLayout; catalog[idx].badge = nBadge; catalog[idx].inStock = nInStock;
            if(nCat === 'ديسباسيتو') catalog[idx].size = nSub; if(nCat === 'ورد') catalog[idx].flowerType = nSub; 
            prodObj = catalog[idx];
        }
    } else {
        prodObj = { id: 'prod_' + Date.now() + Math.floor(Math.random()*1000), category: nCat, name: nName, price: nPrice, oldPrice: nOldPrice, desc: nDesc, sortOrder: nSort, images: finalImagesArray, img: finalImg, subType: nSub, layout: nLayout, badge: nBadge, inStock: nInStock };
        if(nCat === 'ديسباسيتو') prodObj.size = nSub || 'وسط'; if(nCat === 'ورد') prodObj.flowerType = nSub || 'ورد طبيعي'; 
        catalog.unshift(prodObj); 
    }
    
    if(typeof syncCatalogMap === 'function') syncCatalogMap(); 
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('catalog', String(prodObj.id), prodObj); 
        saveEngineMemory('cat'); showSystemToast("تم الحفظ في متجر حلويات بوسي بنجاح 👑", "success"); 
    } catch(e) { saveEngineMemory('cat'); showSystemToast("تم الحفظ محلياً", "info"); }
    
    tempProdImages = []; renderAdminTempImages();
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    closeProdModal(); renderAdminMenu(currentSearch); renderAdminOverview();
    
    syncOfflineImages();
}

function deleteProductConfirm(id) {
    const p = catalog.find(x => String(x.id) === String(id));
    if(!p) return;
    openConfirmModal('حذف منتج نهائياً', `هل أنت متأكد من حذف "${p.name}" بشكل نهائي؟`, () => { executeDeleteProduct(id); });
}

async function executeDeleteProduct(id) {
    const safeId = String(id); catalog = catalog.filter(p => String(p.id) !== safeId); 
    if(typeof syncCatalogMap === 'function') syncCatalogMap(); 
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeDelete('catalog', safeId); 
        saveEngineMemory('cat'); showSystemToast("تم الحذف بنجاح", "success"); 
    } catch(e) { saveEngineMemory('cat'); }
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    renderAdminMenu(currentSearch); renderAdminOverview(); 
}

async function saveCakeBuilderSettings() {
    if(!window.siteSettings) window.siteSettings = { ...defaultSettings };
    if(!siteSettings.cakeBuilder) siteSettings.cakeBuilder = { ...defaultSettings.cakeBuilder };
    
    const c = siteSettings.cakeBuilder;
    if(c) {
        c.basePrice = Number(document.getElementById('set-cake-base-price')?.value) || 145;
        c.minSquare = Number(document.getElementById('set-cake-min-sq')?.value) || 16;
        c.minRect = Number(document.getElementById('set-cake-min-rect')?.value) || 20;
        c.imagePrinting = [ 
            { label: 'بدون', price: 0 }, 
            { label: 'صورة قابلة للأكل', price: Number(document.getElementById('set-print-edible')?.value) || 0 }, 
            { label: 'صورة غير قابلة للأكل', price: 0 } 
        ];
    }
    try {
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings); 
        saveEngineMemory('set'); 
        showSystemToast("تم حفظ إعدادات التورت الملكية 👑", "success");
    } catch(e) { 
        saveEngineMemory('set'); 
        showSystemToast("تم الحفظ محلياً", "info"); 
    }
}

// 👑 التحديث الملكي: الترتيب المخصص للأقسام
function renderAdminCategories() {
    const listEl = document.getElementById('admin-categories-list');
    if (!listEl) return;
    
    const sortedCats = [...catMenu].sort((a, b) => a.order - b.order);

    if (sortedCats.length === 0) { listEl.innerHTML = `<p class="text-center text-slate-500 py-6 font-bold text-xs">لا توجد أقسام حالياً. ابدأ بإضافة أول قسم!</p>`; return; }
    listEl.innerHTML = sortedCats.map((cat, index) => `
        <div class="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-xl group hover:border-blue-500/50 transition-all mb-2">
            <div class="flex items-center gap-3"><span class="w-6 h-6 flex items-center justify-center bg-slate-900 rounded-lg text-[10px] text-slate-400 font-bold">${cat.order}</span><span class="font-bold text-slate-200 text-sm">${escapeHTML(cat.name)}</span></div>
            <button onclick="removeCategory('${cat.name}')" class="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
    const catSelect = document.getElementById('edit-prod-cat');
    if(catSelect) catSelect.innerHTML = sortedCats.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('');
}

function addNewCategory() {
    const input = document.getElementById('new-category-input'); 
    const orderInput = document.getElementById('new-category-order');
    if(!input) return;
    const val = input.value.trim();
    const order = parseInt(orderInput?.value) || (catMenu.length + 1);

    if (!val) { showSystemToast("يرجى كتابة اسم القسم", "error"); return; }
    if (catMenu.find(c => c.name === val)) { showSystemToast("هذا القسم موجود بالفعل", "error"); return; }
    
    catMenu.push({name: val, order: order}); 
    input.value = ''; 
    if(orderInput) orderInput.value = '';
    renderAdminCategories(); renderAdminCatalogTabs();
    showSystemToast(`تم إضافة القسم. لا تنسى الضغط على حفظ الأقسام.`, "success");
}

function removeCategory(catName) {
    if (catName === 'تورت') { showSystemToast("عفواً، قسم التورت الملكية أساسي لا يمكن حذفه! 👑", "error"); return; }
    openConfirmModal('حذف قسم', `هل أنت متأكد من حذف قسم "${catName}"؟`, () => {
        catMenu = catMenu.filter(c => c.name !== catName);
        renderAdminCategories(); renderAdminCatalogTabs();
    });
}

async function saveCategoriesToCloud() {
    try {
        if(!window.siteSettings) window.siteSettings = {};
        siteSettings.catMenu = catMenu; 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings);
        saveEngineMemory('set');
        showSystemToast("تم حفظ الأقسام سحابياً بنجاح! ✨", "success");
    } catch (e) { showSystemToast("فشل الحفظ سحابياً", "error"); }
}

function initAdminPromoCodes() {
    if(!window.siteSettings) window.siteSettings = {};
    if(!siteSettings.promoCodes) siteSettings.promoCodes = [];
    renderPromoCodes();
}

function renderPromoCodes() {
    const container = document.getElementById('promo-codes-list'); if(!container) return;
    const codes = siteSettings.promoCodes || [];
    if(codes.length === 0) { container.innerHTML = `<p class="text-xs text-slate-500 text-center py-2">لا توجد كوبونات مفعلة حالياً</p>`; return; }
    container.innerHTML = codes.map((c, idx) => `
        <div class="flex justify-between items-center bg-orange-500/5 border border-orange-500/20 p-2.5 rounded-xl mb-2">
            <div><span class="font-mono font-black text-orange-400 uppercase">${escapeHTML(c.code)}</span><span class="text-[10px] text-slate-400 ml-2">خصم ${c.discount}%</span></div>
            <button onclick="deletePromoCode(${idx})" class="text-red-400 hover:text-white p-1 rounded hover:bg-red-500/20 relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
}

function addPromoCode() {
    const codeInput = document.getElementById('promo-code-input'); const discountInput = document.getElementById('promo-discount-input');
    if(!codeInput || !discountInput) return;
    const code = codeInput.value.trim().toUpperCase(); const discount = parseInt(discountInput.value) || 0;
    if(!code || discount <= 0 || discount > 100) { showSystemToast("يرجى إدخال كود صحيح ونسبة خصم من 1 إلى 100", "error"); return; }
    if(!window.siteSettings) window.siteSettings = {};
    if(!siteSettings.promoCodes) siteSettings.promoCodes = [];
    if(siteSettings.promoCodes.find(c => c.code === code)) { showSystemToast("هذا الكود موجود بالفعل", "error"); return; }
    siteSettings.promoCodes.push({ code, discount });
    codeInput.value = ''; discountInput.value = '';
    renderPromoCodes(); saveStoreSettings(); 
}

function deletePromoCode(idx) {
    if(!siteSettings.promoCodes) return;
    siteSettings.promoCodes.splice(idx, 1);
    renderPromoCodes(); saveStoreSettings();
}

async function generateSmartDescription() {
    const prodNameEl = document.getElementById('edit-prod-name'); const prodCatEl = document.getElementById('edit-prod-cat');
    const btn = document.getElementById('btn-smart-desc'); const descField = document.getElementById('edit-prod-desc');
    
    if(!prodNameEl || !prodCatEl || !btn || !descField) return;
    
    const prodName = prodNameEl.value.trim(); const prodCat = prodCatEl.value;
    if (!prodName) { showSystemToast('اكتبي اسم المنتج الأول يا إدارة عشان نقدر نولد وصفه ✨', 'error'); return; }
    
    const originalBtnHTML = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> جاري التفكير...'; btn.disabled = true;
    if(window.lucide) lucide.createIcons();
    
    try {
        const secureEndpoint = 'https://us-central1-bosy-sweets.cloudfunctions.net/generateSmartDesc'; 
        const response = await fetch(secureEndpoint, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ productName: prodName, categoryName: prodCat })
        });
        if (!response.ok) throw new Error('الخادم السحابي غير متصل أو يتم تحديثه حالياً');
        const data = await response.json();
        if (data && data.description) {
            descField.value = data.description.trim();
            showSystemToast('تم التوليد بنجاح! 👑 راجعي الوصف.', 'success');
        } else {
            throw new Error('السيرفر لم يرجع الوصف المطلوب.');
        }
    } catch (error) { 
        showSystemToast("تنويه: " + error.message, "info"); 
        descField.value = `قطعة فنية مميزة من حلويات بوسي 👑.. ${prodName} بيضمنلك تجربة طعم مفيش زيها!`;
    } finally { 
        btn.innerHTML = originalBtnHTML; btn.disabled = false; if(window.lucide) lucide.createIcons(); 
    }
}

function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
}

async function syncOfflineImages() {
    if (!navigator.onLine) return; 
    let needsSync = false;
    
    try {
        const payloads = await OfflineStorageManager.getAllPayloads();
        if(payloads.length === 0) return;

        console.log(`BoseSweets Engine: Found ${payloads.length} images in offline vault. Starting background sync... ☁️`);

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
                } else {
                    formData.append('upload_preset', 'gct8i28h');
                }
                
                const res = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.secure_url) { uploadedUrl = data.secure_url; }
            } catch (e) { 
                AdminErrorTracker.log('BackgroundUpload_Failed', e);
                console.warn("Background Upload Failed for", payload.offlineId); 
                continue; 
            }

            if(uploadedUrl) {
                for (let p of catalog) {
                    if (p.images) {
                        for (let i = 0; i < p.images.length; i++) {
                            if (p.images[i] === payload.offlineId) {
                                p.images[i] = uploadedUrl;
                                if (i === 0) p.img = uploadedUrl;
                                needsSync = true;
                                if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('catalog', String(p.id), p);
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
            renderAdminMenu(currentSearch);
            showSystemToast("تمت مزامنة الصور المعلقة مع السحابة وتنظيف الخزنة بنجاح ☁️", "success");
        }
    } catch(e) {
        AdminErrorTracker.log('OfflineSync_Images', e);
    }
}

window.addEventListener('online', syncOfflineImages);

document.addEventListener('DOMContentLoaded', () => {
    if(window.lucide) lucide.createIcons();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('admin-current-date');
    if(dateEl) dateEl.textContent = new Date().toLocaleDateString('ar-EG', dateOptions);
});

function bootBoseSweetsEngine() {
    console.log("BoseSweets Admin Engine Initiating...");
    unfreezeAdminUI();
    if(typeof auth !== 'undefined') {
        auth.onAuthStateChanged(async user => {
            if (user) { 
                try { await loadEngineMemory(); } catch(e) {}
                openAdminDashboardDirectly();
                syncOfflineImages(); 
            } else { 
                window.location.href = 'login.html';
            }
        });
    } else {
        window.location.href = 'login.html';
    }
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', bootBoseSweetsEngine); } 
else { bootBoseSweetsEngine(); }
