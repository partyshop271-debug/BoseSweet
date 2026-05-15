/**
 * ============================================================================
 * 👑 BoseSweets Sovereign Admin Logic | العقل التشغيلي للوحة القيادة (V30.0)
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي (The Management)
 * الوظيفة: المايسترو المحرك للتنقل الديناميكي (SPA)، إدارة الذاكرة، والمزامنة السحابية.
 * التوافق: تم تأسيس محركات الرسم المفقودة لضمان استقرار رفع الوسائط والبحث.
 */

import coreExports from './core-engine.js';
import adminDB from './admin-database.js';

const { boseConfig, BoseState } = coreExports;
const db = boseConfig.db;

// ============================================================================
// 🛡️ 1. نظام الرصد وتتبع الأخطاء (BoseMonitor & Error Tracker)
// ============================================================================
window.BoseMonitor = {
    report: function(error, source, line, functionName) {
        const errorData = {
            message: error.message || String(error),
            source: source,
            function: functionName,
            time: new Date().toLocaleString('ar-EG')
        };
        console.warn(`%c[درع حلويات بوسي]%c تم رصد تدخل أو خطأ في: ${functionName}`, "color: #ff91a4; font-weight: bold;", "color: inherit;");
        console.error("تفاصيل:", errorData);
    }
};

window.AdminErrorTracker = {
    log(context, error) {
        if (window.BoseMonitor) {
            window.BoseMonitor.report(error, 'admin-logic.js', null, context);
        } else {
            console.warn(`BoseSweets Admin Vault: Error in [${context}]. 🛡️`, error);
        }
    },
    report(error, context) { this.log(context, error); } 
};

// ============================================================================
// 🛠️ 2. أدوات الواجهة والتفاعل (UI Utilities & Toasts)
// ============================================================================
window.escapeHTML = function(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
};

window.showSystemToast = function(message, type = 'info') {
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
        iconEl.className = "w-5 h-5 shrink-0 text-[#ff91a4]"; 
    }
    
    if(window.lucide) lucide.createIcons();
    toast.classList.remove('hidden'); 
    toast.classList.add('animate-fade-in');
    
    if(window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => { 
        toast.classList.remove('animate-fade-in');
        toast.classList.add('hidden'); 
    }, 3000);
};

window.unfreezeAdminUI = function() {
    const loader = document.getElementById('admin-boot-loader');
    if(loader) {
        loader.classList.add('opacity-0');
        setTimeout(() => loader.classList.add('hidden'), 300);
    }
    document.body.style.overflow = 'auto';
    document.body.style.pointerEvents = 'auto';
    document.documentElement.style.overflow = '';
};

// ============================================================================
// ⚖️ 3. نوافذ القرار السيادي (Confirmation & Modals)
// ============================================================================
window.confirmActionCallback = null;

window.openConfirmModal = function(title, message, callback) {
    const modal = document.getElementById('admin-confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-body');
    
    if(!modal || !titleEl || !msgEl) {
        if(confirm(`${title}\n\n${message}`)) { if(typeof callback === 'function') callback(); }
        return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;
    window.confirmActionCallback = callback;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
};

window.closeConfirmModal = function() {
    const modal = document.getElementById('admin-confirm-modal');
    if(modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => { 
            modal.classList.add('hidden'); 
            modal.classList.remove('flex'); 
            window.confirmActionCallback = null; 
        }, 300);
    }
};

window.executeConfirmedAction = function() {
    if(typeof window.confirmActionCallback === 'function') {
        window.confirmActionCallback();
    }
    window.closeConfirmModal();
};

window.openAdminModal = function(contentHTML) {
    const overlay = document.getElementById('admin-modal-overlay');
    const content = document.getElementById('admin-modal-content');
    if (overlay && content) {
        content.innerHTML = contentHTML;
        overlay.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    }
};

window.closeAdminModal = function() {
    const overlay = document.getElementById('admin-modal-overlay');
    if (overlay) overlay.style.display = 'none';
};

// ============================================================================
// 🗄️ 4. محركات التخزين والذاكرة الفولاذية (Storage Engines)
// ============================================================================
window.StorageEngine = {
    dbName: 'BoseSweetsDB',
    storeName: 'DataCore',
    version: 1,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(this.storeName)) database.createObjectStore(this.storeName);
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
                tx.objectStore(this.storeName).put(value, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) { window.AdminErrorTracker.log('StorageEngine_Set', e); }
    },
    async get(key) {
        try {
            const database = await this.init();
            return new Promise((resolve) => {
                const tx = database.transaction(this.storeName, 'readonly');
                const request = tx.objectStore(this.storeName).get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null); 
            });
        } catch (e) { return null; }
    }
};

window.OfflineStorageManager = {
    dbName: 'BoseSweetsOfflineVault',
    storeName: 'ImagePayloads',
    version: 1,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(this.storeName)) database.createObjectStore(this.storeName, { keyPath: 'offlineId' });
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
                tx.objectStore(this.storeName).put(payload);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) { window.AdminErrorTracker.log('OfflineVault_Enqueue', e); }
    },
    async getAllPayloads() {
        try {
            const database = await this.init();
            return new Promise((resolve) => {
                const tx = database.transaction(this.storeName, 'readonly');
                const request = tx.objectStore(this.storeName).getAll();
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
                tx.objectStore(this.storeName).delete(offlineId);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {}
    }
};

// ============================================================================
// 🧠 5. إدارة الذاكرة السيادية وحالة النظام (State Management)
// ============================================================================
window.catalog = window.catalog || [];
window.globalOrders = window.globalOrders || [];
window.siteSettings = window.siteSettings || {};
window.shippingZones = window.shippingZones || [];
window.galleryData = window.galleryData || [];
window.catMenu = window.catMenu || [];
window.catalogMap = window.catalogMap || new Map();

window.isFirstOrderLoad = true;
window.ordersUnsubscribe = null; 
window.adminOrdersHash = '';
window.adminRenderDebounce = null;
window.tempProdImages = []; 

window.syncCatalogMap = function() { 
    window.catalogMap.clear(); 
    window.catalog.forEach(p => window.catalogMap.set(String(p.id), p)); 
};

window.saveEngineMemory = async function(type) {
    try {
        if (type === 'cat' || type === 'all') await window.StorageEngine.set('boseSweets_catalog', window.catalog);
        if (type === 'set' || type === 'all') await window.StorageEngine.set('boseSweets_settings', window.siteSettings);
        if (type === 'ship' || type === 'all') await window.StorageEngine.set('boseSweets_shipping', window.shippingZones);
        if (type === 'gal' || type === 'all') await window.StorageEngine.set('boseSweets_gallery', window.galleryData);
        if (type === 'ord' || type === 'all') await window.StorageEngine.set('boseSweets_admin_orders', window.globalOrders);
        
        if (type === 'cat' || type === 'all') localStorage.setItem('boseSweets_catalog', JSON.stringify(window.catalog));
        if (type === 'set' || type === 'all') localStorage.setItem('boseSweets_settings', JSON.stringify(window.siteSettings));
    } catch (e) { window.AdminErrorTracker.log('SaveEngineMemory', e); }
};

window.setupRealtimeOrders = function() {
    if (window.__ordersListenerActive) return;
    window.__ordersListenerActive = true;

    if (window.ordersUnsubscribe) window.ordersUnsubscribe();

    window.ordersUnsubscribe = adminDB.listenToAdminOrders((freshOrders, hasNewOrder) => {
        const newHash = JSON.stringify(freshOrders);
        if (newHash === window.adminOrdersHash && !window.isFirstOrderLoad) return; 
        
        window.adminOrdersHash = newHash;
        window.globalOrders = freshOrders; 
        window.saveEngineMemory('ord');

        if (!window.isFirstOrderLoad && hasNewOrder) {
            window.playNotificationSound();
            window.showSystemToast("تنبيه نظام: طلب جديد قيد الانتظار بمركز القيادة.", "success");
        }

        const pendingCount = window.globalOrders.filter(o => o.status === 'pending').length;
        const badge = document.getElementById('new-orders-badge');
        if (badge) {
            if (pendingCount > 0) { 
                badge.style.display = 'block'; 
                badge.innerText = pendingCount > 9 ? '+9' : pendingCount; 
            } else { 
                badge.style.display = 'none'; 
            }
        }

        window.isFirstOrderLoad = false;

        if(window.adminRenderDebounce) clearTimeout(window.adminRenderDebounce);
        window.adminRenderDebounce = setTimeout(() => {
            window.requestAnimationFrame(() => {
                if (typeof window.renderAdminOrders === 'function') window.renderAdminOrders();
                if (typeof window.renderAdminOverview === 'function') window.renderAdminOverview();
                if (typeof window.updateAdminDashboardStatsUI === 'function') window.updateAdminDashboardStatsUI();
            });
        }, 300); 
    });
};

window.playNotificationSound = function() {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.6; audio.play().catch(() => {});
    } catch(e) {}
};

window.loadEngineMemory = async function() {
    try {
        if (db) {
            const catSnap = await db.collection('catalog').get();
            if (!catSnap.empty) { 
                window.catalog = []; 
                catSnap.forEach(doc => {
                    let data = doc.data();
                    if (data.isActive === undefined) data.isActive = true;
                    window.catalog.push({ id: doc.id, ...data });
                }); 
            }
            
            const settingsSnap = await db.collection('settings').doc('main').get();
            if (settingsSnap.exists) { window.siteSettings = settingsSnap.data(); }
            
            const shipSnap = await db.collection('shipping').get();
            if (!shipSnap.empty) { window.shippingZones = []; shipSnap.forEach(doc => window.shippingZones.push(doc.data())); }
            
            const gallerySnap = await db.collection('gallery').orderBy('timestamp', 'desc').limit(50).get();
            if (!gallerySnap.empty) { window.galleryData = []; gallerySnap.forEach(doc => window.galleryData.push(doc.data())); }
            
            window.setupRealtimeOrders();
            if (typeof window.updateAdminDashboardStatsUI === 'function') window.updateAdminDashboardStatsUI();

        } else {
            throw new Error("قاعدة البيانات السحابية غير متصلة.");
        }
    } catch(err) { 
        window.AdminErrorTracker.log('loadEngineMemory', err);
        window.catalog = (await window.StorageEngine.get('boseSweets_catalog')) || window.catalog; 
        window.siteSettings = (await window.StorageEngine.get('boseSweets_settings')) || window.siteSettings;
    }

    if (window.siteSettings.catMenu && window.siteSettings.catMenu.length > 0) {
        window.catMenu = window.siteSettings.catMenu;
    } else {
        window.catMenu = [...new Set(window.catalog.map(p => p.category))].filter(Boolean).map((name, i) => ({name, order: i+1}));
    }
    if (!window.catMenu.find(c => c.name === 'تورت')) window.catMenu.unshift({name: 'تورت', order: 0});
    window.syncCatalogMap(); 
};

// ============================================================================
// 🚀 6. محرك التنقل الديناميكي (SPA Admin Router)
// ============================================================================
class AdminRouter {
    constructor() {
        this.navItems = document.querySelectorAll('.admin-nav-item');
        this.pageTitle = document.getElementById('admin-page-title');
        this.sections = document.querySelectorAll('.admin-section');
        this.init();
    }

    init() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.id.replace('nav-', '');
                this.switchView(targetId, item);
            });
        });

        document.body.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'view-all-orders-btn') {
                const ordersNav = document.getElementById('nav-orders');
                if (ordersNav) ordersNav.click();
            }
        });
    }

    switchView(viewId, activeNavItem) {
        try {
            this.sections.forEach(sec => sec.style.display = 'none');
            const target = document.getElementById(`view-${viewId}`);
            if (target) {
                target.style.display = 'block';
            } else {
                console.warn(`[حلويات بوسي] القسم view-${viewId} غير موجود في الهيكل.`);
            }

            this.navItems.forEach(nav => nav.classList.remove('active'));
            activeNavItem.classList.add('active');
            
            if(this.pageTitle) this.pageTitle.innerText = activeNavItem.innerText.trim();

            if(viewId === 'overview') {
                if(typeof window.renderAdminOverview === 'function') window.renderAdminOverview();
                if(typeof window.updateAdminDashboardStatsUI === 'function') window.updateAdminDashboardStatsUI();
            }
            
            if(viewId === 'products') {
                if(typeof window.renderCatalogTable === 'function') {
                    window.renderCatalogTable();
                }
            }
            
            if(viewId === 'orders') {
                if(typeof window.renderAdminOrders === 'function') window.renderAdminOrders();
            }
            
            if(viewId === 'settings') {
                if(typeof window.fillAdminSettingsForm === 'function') window.fillAdminSettingsForm();
                if(typeof window.renderAdminCategories === 'function') window.renderAdminCategories();
            }

            if(window.lucide) lucide.createIcons();
            window.scrollTo(0, 0);

        } catch (error) {
            window.AdminErrorTracker.log('AdminRouter_switchView', error);
        }
    }
}

// ============================================================================
// ☁️ 7. المزامنة السحابية ومعالجة الصور (Cloud & Image Sync)
// ============================================================================
window.triggerSovereignSync = async function() {
    try {
        await adminDB.triggerSovereignSyncCloud(boseConfig.auth?.currentUser?.uid || 'system');
        const currentTime = Date.now().toString();
        localStorage.setItem('BoseSweets_Local_Sync_Force', currentTime);
        window.showSystemToast("قرار نظام: تم بث التحديثات السيادية بنجاح.", "success");
    } catch (error) {
        window.AdminErrorTracker.log('SovereignSyncTrigger', error);
    }
};

/**
 * 👑 محرك العرض المؤقت للصور (Sovereign Image Previewer)
 * الإجراء: تم تأسيس هذه الدالة لسد الفجوة في تجربة رفع الوسائط.
 * الوظيفة: رسم واجهة بصرية تسمح للإدارة بمراجعة الصور المرفوعة سحابياً قبل اعتماد المنتج.
 */
window.renderAdminTempImages = function() {
    const container = document.getElementById('temp-images-grid');
    if (!container) return;

    if (!window.tempProdImages || window.tempProdImages.length === 0) {
        container.innerHTML = '<p class="text-center py-4 opacity-50 font-bold">لم يتم رفع صور جديدة حالياً.</p>';
        return;
    }

    let html = '';
    window.tempProdImages.forEach((url, idx) => {
        const isOffline = url.startsWith('offline_');
        html += `
            <div class="relative group aspect-square rounded-xl overflow-hidden border-2" style="border-color: ${isOffline ? '#fca5a5' : '#ff91a4'}40;">
                <img src="${isOffline ? '#' : url}" class="w-full h-full object-cover" alt="Moot" onerror="this.src='https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';">
                ${isOffline ? '<div class="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-black">انتظار الشبكة</div>' : ''}
                <button onclick="window.tempProdImages.splice(${idx}, 1); window.renderAdminTempImages();" class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
                </button>
            </div>
        `;
    });
    container.innerHTML = html;
    if(window.lucide) lucide.createIcons();
};

/**
 * 👑 محرك البحث والفلترة اللحظي (Sovereign Menu Filter)
 * الإجراء: تم تأسيس المحرك لضمان قدرة الإدارة على العثور على المنتجات بسرعة فائقة.
 */
window.renderAdminMenu = function(searchTerm = '') {
    const tableBody = document.getElementById('admin-catalog-list');
    if (!tableBody) return;

    // تفعيل بروتوكول البحث السيادي
    const filtered = window.catalog.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // إعادة توجيه مسار الرسم لمحرك العرض السيادي (admin-catalog-view) المتاح عالمياً
    if (typeof window.renderCatalogTable === 'function') {
        // نمرر البيانات المفلترة في حال دعم المحرك لذلك، أو نعتمد على محرك SPA لإعادة التحديث
        window.renderCatalogTable(filtered);
    }
};

window.compressAndUploadMultiImage = async function(e) {
    try {
        const files = e.target.files; 
        if (!files || files.length === 0) return;
        
        const spinner = document.getElementById('uploading-spinner'); 
        if(spinner) spinner.classList.remove('hidden');
        
        let offlineSaved = false;
        let successCount = 0;

        for(let i=0; i<files.length; i++) {
            const file = files[i];
            if (!file.type.match('image.*')) { 
                window.showSystemToast("قرار نظام: تم تجاهل الملف. الرجاء اختيار صورة.", "error"); 
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
                        canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
                        
                        const ctx = canvas.getContext('2d'); 
                        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); 
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const base64Str = canvas.toDataURL('image/jpeg', 0.85); 
                        
                        if (navigator.onLine) {
                            try {
                                const formData = new FormData(); 
                                formData.append('file', base64Str); 
                                formData.append('upload_preset', 'gct8i28h'); 
                                
                                const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                                if (!response.ok) throw new Error("استجابة الخادم غير مكتملة.");
                                const data = await response.json();
                                
                                if (data.secure_url) { window.tempProdImages.push(data.secure_url); successCount++; }
                            } catch (err) { 
                                const offlineId = 'offline_img_' + Date.now() + Math.random().toString(36).substr(2, 5);
                                await window.OfflineStorageManager.enqueuePayload({ offlineId: offlineId, base64: base64Str });
                                window.tempProdImages.push(offlineId); offlineSaved = true; 
                            } 
                        } else {
                            const offlineId = 'offline_img_' + Date.now() + Math.random().toString(36).substr(2, 5);
                            await window.OfflineStorageManager.enqueuePayload({ offlineId: offlineId, base64: base64Str });
                            window.tempProdImages.push(offlineId); offlineSaved = true;
                        }
                        resolve();
                    }
                }
            });
        }
        
        // استدعاء محرك الرسم المؤسس حديثاً
        if (typeof window.renderAdminTempImages === 'function') window.renderAdminTempImages(); 
        if(spinner) spinner.classList.add('hidden'); 
        
        if (offlineSaved) window.showSystemToast("تم إدراج الصور في الخزنة المؤقتة. ستتم المزامنة عند الاتصال.", "info");
        else if (successCount > 0) window.showSystemToast(`تحديث مسار: تم رفع (${successCount}) صورة بنجاح.`, "success");

    } catch (masterError) {
        window.AdminErrorTracker.log('MultiImageUpload_Master', masterError);
        const spinner = document.getElementById('uploading-spinner'); 
        if(spinner) spinner.classList.add('hidden');
    }
};

window.syncOfflineImages = async function() {
    if (!navigator.onLine) return; 
    let needsSync = false;
    
    try {
        const payloads = await window.OfflineStorageManager.getAllPayloads();
        if(payloads.length === 0) return;
        window.showSystemToast("تحديث مسار: جاري مزامنة الصور المؤجلة...", "info");

        for (let payload of payloads) {
            let uploadedUrl = null;
            try {
                const formData = new FormData();
                formData.append('file', payload.base64);
                formData.append('upload_preset', 'gct8i28h'); 
                const res = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.secure_url) uploadedUrl = data.secure_url;
            } catch (e) { continue; }

            if(uploadedUrl) {
                for (let p of window.catalog) {
                    let updated = false;
                    if (p.images && p.images.includes(payload.offlineId)) { p.images = p.images.map(img => img === payload.offlineId ? uploadedUrl : img); updated = true; }
                    if (p.img === payload.offlineId) { p.img = uploadedUrl; updated = true; }
                    
                    if (updated) {
                        needsSync = true;
                        await adminDB.updateProductDetails(p.id, p);
                    }
                }
                await window.OfflineStorageManager.removePayload(payload.offlineId);
            }
        }

        if (needsSync) {
            window.syncCatalogMap();
            await window.saveEngineMemory('cat');
            if(typeof window.renderAdminMenu === 'function') window.renderAdminMenu('');
            await window.triggerSovereignSync();
            window.showSystemToast(`تمت تزامن الصور المؤجلة بنجاح.`, "success");
        }
    } catch(e) {
        window.AdminErrorTracker.log('OfflineSyncMaster', e);
    }
};

window.addEventListener('online', window.syncOfflineImages);

// ============================================================================
// 📊 8. محركات رسم واجهات الإدارة (Admin UI Renderers)
// ============================================================================
window.updateAdminDashboardStatsUI = function() {
    const totalOrders = window.globalOrders ? window.globalOrders.length : 0;
    const pendingOrders = window.globalOrders ? window.globalOrders.filter(o => o.status === 'pending').length : 0;
    const totalProducts = window.catalog ? window.catalog.length : 0;
    const activeProducts = window.catalog ? window.catalog.filter(p => p.isActive !== false).length : 0;

    const elTotalOrders = document.getElementById('stat-total-orders');
    const elPendingOrders = document.getElementById('stat-pending-orders');
    const elTotalProducts = document.getElementById('stat-total-products');
    const elActiveProducts = document.getElementById('stat-active-products');

    if(elTotalOrders) elTotalOrders.innerText = totalOrders;
    if(elPendingOrders) elPendingOrders.innerText = pendingOrders;
    if(elTotalProducts) elTotalProducts.innerText = totalProducts;
    if(elActiveProducts) elActiveProducts.innerText = activeProducts;
};

window.renderAdminOverview = function() {
    const recentList = document.getElementById('overview-recent-orders-list');
    if(!recentList) return;

    if(!window.globalOrders || window.globalOrders.length === 0) {
        recentList.innerHTML = `<div style="text-align: center; padding: 25px; color: var(--text-muted); font-weight: 700;">لا توجد طلبات مسجلة حتى الآن.</div>`;
        return;
    }

    const recent = [...window.globalOrders].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);
    
    let html = '';
    recent.forEach(order => {
        const statusColor = order.status === 'pending' ? '#ff91a4' : (order.status === 'completed' ? '#2e7d32' : '#666666');
        const statusText = order.status === 'pending' ? 'قيد الانتظار' : (order.status === 'completed' ? 'مكتمل' : 'مرفوض');
        
        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
            <div>
                <h4 style="margin: 0; font-weight: 700; color: var(--text-main); font-size: 1.1rem;">طلب #${order.id || order.orderId}</h4>
                <span style="font-size: 0.9rem; color: var(--text-muted);">${order.customerName || 'عميل'}</span>
            </div>
            <div style="text-align: left;">
                <span style="display: inline-block; padding: 6px 12px; background: ${statusColor}15; color: ${statusColor}; border-radius: 8px; font-size: 0.85rem; font-weight: 700;">${statusText}</span>
                <div style="font-weight: 700; margin-top: 8px; color: var(--text-main); font-size: 1.1rem;">${order.total} ج.م</div>
            </div>
        </div>`;
    });
    recentList.innerHTML = html;
};

window.renderAdminCategories = function() {
    const catList = document.getElementById('admin-categories-list');
    if(!catList) return;
    
    if(!window.catMenu || window.catMenu.length === 0) {
        catList.innerHTML = `<p style="color: var(--text-muted); text-align: center; font-weight: 700;">لم يتم إضافة أقسام بعد.</p>`;
        return;
    }

    let html = '';
    window.catMenu.forEach(cat => {
        html += `<div style="padding: 15px; background: #ffffff; border: 1px solid rgba(255,145,164,0.2); border-radius: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <span style="font-weight: 700; color: var(--text-main); font-size: 1.05rem;">${cat.name}</span>
            <span style="color: var(--primary-pink); font-size: 0.9rem; font-weight: 700; background: rgba(255,145,164,0.1); padding: 5px 12px; border-radius: 6px;">ترتيب: ${cat.order}</span>
        </div>`;
    });
    catList.innerHTML = html;
};

window.fillAdminSettingsForm = function() {
    const storeNameInput = document.getElementById('setting-store-name');
    const deliveryFeeInput = document.getElementById('setting-delivery-fee');
    
    if(window.siteSettings) {
        if(storeNameInput) storeNameInput.value = window.siteSettings.storeName || 'حلويات بوسي';
        if(deliveryFeeInput) deliveryFeeInput.value = window.siteSettings.defaultDeliveryFee || 0;
    }
};

// ============================================================================
// 🔌 9. الإقلاع السيادي (System Bootloader)
// ============================================================================
window.bootBoseSweetsEngine = function() {
    if (window.__BoseSweetsAdminBooted) return; 
    window.__BoseSweetsAdminBooted = true;
    
    console.log("👑 BoseSweets Admin: Initiating Sovereign Brain...");
    window.unfreezeAdminUI();
    
    window.BoseAdminRouter = new AdminRouter();

    if(boseConfig.auth) {
        boseConfig.auth.onAuthStateChanged(async user => {
            if (user) { 
                await window.loadEngineMemory(); 
                window.syncOfflineImages(); 
                
                const searchCatalogInput = document.getElementById('admin-search-catalog');
                if(searchCatalogInput) {
                    searchCatalogInput.addEventListener('input', (e) => {
                        if(typeof window.renderAdminMenu === 'function') window.renderAdminMenu(e.target.value.toLowerCase());
                    });
                }
            } else { 
                window.location.href = 'login.html';
            }
        });
    } else {
        window.loadEngineMemory();
    }
};

if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', window.bootBoseSweetsEngine); 
} else { 
    window.bootBoseSweetsEngine(); 
}
