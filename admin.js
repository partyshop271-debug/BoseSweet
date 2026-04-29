/**
 * ============================================================================
 * محرك مركز قيادة حلويات بوسي | BoseSweets Admin Engine (V2.1 PRO MAX)
 * ============================================================================
 * تم بناء وتوسيع هذا المحرك لضمان أعلى أداء، وتوسيع القدرات الإدارية، مع الحفاظ
 * على كامل البيانات والوظائف السابقة بنظام (البناء والتطوير دون حذف).
 * يحتوي على قلب النظام (Data Core) ومحرك الإقلاع (Boot Controller)
 */

// ==========================================
// 1. Data Core & Shared State
// ==========================================
const defaultSettings = {
    brandName: "حلويات بوسي", announcement: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب",
    heroTitle: "أهلاً بكم في <br class='hidden md:block'/> <span class='text-white relative inline-block mt-1 md:mt-2 drop-shadow-md'>حلويات بوسي</span>",
    heroDesc: "يسر إدارة حلويات بوسي استعراض تشكيلتها الحصرية من الأصناف الفاخرة والمُعدة بعناية فائقة لتليق بذوقكم الرفيع ومناسباتكم السعيدة.",
    footerPhone: "01097238441", footerAddress: "الكفاح، مركز الفرافرة، <br> محافظة الوادي الجديد",
    footerQuote: `"نؤمن أن الحلويات لغة للتعبير عن المحبة، لذا نصنع كل قطعة بشغف لنكون شركاءكم في أجمل اللحظات."`,
    productLayout: "grid", brandColorHex: "#ec4899", bgColor: "#ffffff", textColor: "#663b3b",
    fontFamily: "'Cairo', sans-serif", baseFontSize: 16, baseFontWeight: 400,
    tickerActive: true, tickerText: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب ✨", tickerSpeed: 20, tickerFont: "'Cairo', sans-serif", tickerColor: "#ffffff",
    cakeBuilder: { basePrice: 145, desc: "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة.", minSquare: 16, minRect: 20, flavors: ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت'], images: [], imagePrinting: [{ label: 'بدون', price: 0 }, { label: 'صورة قابلة للأكل', price: 60 }, { label: 'صورة غير قابلة للأكل', price: 20 }] }
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

async function loadEngineMemory() {
    try {
        await fetchDefaultCatalog(); 
        catalog = [...defaultCatalog];
        
        // جلب البيانات من السحابة إذا كان الاتصال متاح
        if (typeof db !== 'undefined') {
            const catSnap = await db.collection('catalog').get();
            if (!catSnap.empty) { catalog = []; catSnap.forEach(doc => catalog.push(doc.data())); }
            
            const orderSnap = await db.collection('orders').orderBy('timestamp', 'desc').get();
            if (!orderSnap.empty) { globalOrders = []; orderSnap.forEach(doc => globalOrders.push(doc.data())); }
            
            const settingsSnap = await db.collection('settings').doc('main').get();
            if (settingsSnap.exists) { siteSettings = { ...defaultSettings, ...settingsSnap.data() }; }
            
            const shipSnap = await db.collection('shipping').get();
            if (!shipSnap.empty) { shippingZones = []; shipSnap.forEach(doc => shippingZones.push(doc.data())); }
            
            const gallerySnap = await db.collection('gallery').orderBy('timestamp', 'desc').get();
            if (!gallerySnap.empty) { galleryData = []; gallerySnap.forEach(doc => galleryData.push(doc.data())); }
        } else {
            throw new Error("قاعدة البيانات غير متصلة.");
        }
    } catch(err) { 
        console.warn("جاري التحميل من الذاكرة المحلية بسبب خطأ في الاتصال بالسحابة");
        catalog = JSON.parse(localStorage.getItem('bSweets_catalog') || localStorage.getItem('boseSweets_catalog')) || [...defaultCatalog]; 
        globalOrders = JSON.parse(localStorage.getItem('bSweets_orders') || localStorage.getItem('boseSweets_admin_orders')) || [];
        siteSettings = JSON.parse(localStorage.getItem('bSweets_settings') || localStorage.getItem('boseSweets_settings')) || { ...defaultSettings };
        shippingZones = JSON.parse(localStorage.getItem('bSweets_shipping') || localStorage.getItem('boseSweets_shipping')) || [ ...defaultShipping ];
        galleryData = JSON.parse(localStorage.getItem('bSweets_gallery') || localStorage.getItem('boseSweets_gallery')) || [];
    }

    if (siteSettings.catMenu && siteSettings.catMenu.length > 0) catMenu = siteSettings.catMenu;
    else catMenu = [...new Set(catalog.map(p => p.category))].filter(Boolean);
    if (!catMenu.includes('تورت')) catMenu.unshift('تورت');
    syncCatalogMap(); 
}

async function saveEngineMemory(type) {
    try {
        if (type === 'cat' || type === 'all') localStorage.setItem('boseSweets_catalog', JSON.stringify(catalog));
        if (type === 'set' || type === 'all') localStorage.setItem('boseSweets_settings', JSON.stringify(siteSettings));
        if (type === 'ship' || type === 'all') localStorage.setItem('boseSweets_shipping', JSON.stringify(shippingZones));
        if (type === 'gal' || type === 'all') localStorage.setItem('boseSweets_gallery', JSON.stringify(galleryData));
        if (type === 'ord' || type === 'all') localStorage.setItem('boseSweets_admin_orders', JSON.stringify(globalOrders));
    } catch (e) { console.error("Local Save Error", e); }
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
        
        setTimeout(() => {
            executeSafely('Charts', () => { if(typeof initAdminCharts === 'function') initAdminCharts(); });
        }, 500);

        executeSafely('Icons', () => { if(window.lucide) lucide.createIcons(); });
        
    } catch (error) {
        console.error("BoseSweets Error: فشل غير متوقع في الإقلاع الأساسي", error);
        showSystemToast("تنبيه: تم تشغيل وضع الطوارئ لاستعادة البيانات...", "info");
    }
}

function closeAdminDashboard() {
    sessionStorage.removeItem('bosy_admin_auth');
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

// --- Tabs Navigation ---
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

// --- Confirmation Modals ---
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

// --- Backups ---
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

// --- Settings & UI ---
function syncColorInput(inputId, textId) {
    const colorInput = document.getElementById(inputId); const textInput = document.getElementById(textId);
    if(!colorInput || !textInput) return;
    textInput.removeAttribute('readonly');
    colorInput.addEventListener('input', (e) => { textInput.value = e.target.value.toUpperCase(); });
    textInput.addEventListener('input', (e) => {
        let val = e.target.value.trim(); if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
        if(/^#[0-9A-Fa-f]{6}$/i.test(val)) { colorInput.value = val; }
    });
    textInput.addEventListener('blur', (e) => {
        let val = e.target.value.trim(); if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
        if(/^#[0-9A-Fa-f]{6}$/i.test(val)) { colorInput.value = val; e.target.value = val.toUpperCase(); } 
        else { e.target.value = colorInput.value.toUpperCase(); }
    });
}

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

    try {
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings); 
        saveEngineMemory('set'); 
        showSystemToast("تم حفظ إعدادات حلويات بوسي بنجاح! 👑", "success");
    } catch(e) { saveEngineMemory('set'); showSystemToast("تم الحفظ محلياً", "info"); }
}

async function changeAdminPassword() {
    const currentInput = document.getElementById('sec-current-pwd').value; 
    const newPwd = document.getElementById('sec-new-pwd').value; 
    const confirmPwd = document.getElementById('sec-confirm-pwd').value;
    if (!currentInput || !newPwd || !confirmPwd) { showSystemToast("يرجى ملء جميع الحقول", "error"); return; }
    try {
        if (newPwd !== confirmPwd) { showSystemToast("كلمة المرور الجديدة غير متطابقة", "error"); return; }
        if (newPwd.length < 4) { showSystemToast("يجب أن تكون 4 أحرف أو أرقام على الأقل", "error"); return; }
        siteSettings.adminPassword = newPwd;
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings); 
        saveEngineMemory('set'); 
        showSystemToast("تم تغيير الرمز السري بنجاح 🛡️", "success");
        document.getElementById('sec-current-pwd').value = ''; document.getElementById('sec-new-pwd').value = ''; document.getElementById('sec-confirm-pwd').value = '';
    } catch(e) { saveEngineMemory('set'); showSystemToast("تم الحفظ محلياً", "info"); }
}

// --- Shipping ---
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

// --- Overview & Orders ---
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
function refreshOrders() { showSystemToast('جاري تحديث الطلبات...', 'info'); renderAdminOrders(); }

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
    const id = selectEl.getAttribute('data-current-id'); const newStatus = selectEl.value;
    const orderIdx = globalOrders.findIndex(o => String(o.id) === String(id));
    if (orderIdx > -1) {
        globalOrders[orderIdx].status = newStatus;
        saveEngineMemory('ord');
        try {
            if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('orders', String(id), globalOrders[orderIdx]);
            showSystemToast('تم تحديث حالة الطلب بنجاح 👑', 'success');
        } catch (e) { showSystemToast('تم تحديث الحالة محلياً', 'info'); }
        renderAdminOverview(); renderAdminOrders(); closeOrderModal();
    }
}
function printOrderInvoice() { window.print(); }

// --- Catalog Menu ---
function renderAdminCatalogTabs() {
    const tabsEl = document.getElementById('admin-catalog-tabs');
    if(!tabsEl) return;
    let html = `<button onclick="setAdminCat('all')" class="whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border relative z-20 pointer-events-auto ${adminCurrentCat === 'all' ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}">الكل</button>`;
    if(catMenu && catMenu.length > 0) {
        catMenu.forEach(c => { html += `<button onclick="setAdminCat('${escapeHTML(c)}')" class="whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border relative z-20 pointer-events-auto ${adminCurrentCat === c ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}">${escapeHTML(c)}</button>`; });
    }
    tabsEl.innerHTML = html;
}

function setAdminCat(c) {
    adminCurrentCat = c; renderAdminCatalogTabs();
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    renderAdminMenu(currentSearch);
}

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
    const sortType = document.getElementById('admin-sort-catalog')?.value || 'newest';
    if(sortType === 'price_high') list.sort((a, b) => b.price - a.price);
    if(sortType === 'price_low') list.sort((a, b) => a.price - b.price);
    if(sortType === 'name') list.sort((a, b) => (a.name||'').localeCompare(b.name||'', 'ar'));

    if (list.length === 0) {
        container.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700 relative z-10"><i data-lucide="search-x" class="w-12 h-12 mb-3 text-slate-600"></i><p class="font-bold text-sm">لا يوجد منتجات مطابقة لعملية البحث</p></div>`;
        if(window.lucide) lucide.createIcons(); return;
    }

    container.innerHTML = list.map(prod => {
        const imageUrl = (prod.images && prod.images.length > 0) ? prod.images[0] : (prod.img || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80');
        const isInstock = prod.inStock !== false;
        return `
            <div class="admin-card flex flex-col md:flex-row gap-4 relative overflow-visible group transition-all duration-300 hover:border-pink-500/50 ${!isInstock ? 'opacity-60' : ''} p-4 bg-slate-900 rounded-xl border border-slate-800">
                <div class="w-full md:w-28 h-36 md:h-28 rounded-xl bg-slate-800 shrink-0 overflow-hidden relative shadow-inner">
                    <img src="${imageUrl}" alt="${escapeHTML(prod.name || '')}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ${prod.badge ? `<span class="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] px-2 py-0.5 rounded shadow-lg font-bold z-10">${prod.badge}</span>` : ''}
                    ${!isInstock ? `<div class="absolute inset-0 bg-slate-900/70 flex items-center justify-center backdrop-blur-sm z-10"><span class="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold">نفذت</span></div>` : ''}
                    ${(prod.images && prod.images.length > 1) ? `<span class="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold z-10">+${prod.images.length - 1}</span>` : ''}
                </div>
                <div class="flex-1 flex flex-col justify-between py-1 relative z-20">
                    <div>
                        <div class="flex justify-between items-start mb-1"><p class="text-[10px] text-pink-400 font-bold uppercase tracking-wider bg-pink-500/10 px-2 py-0.5 rounded inline-block">${escapeHTML(prod.category || '')}</p><p class="text-white font-black text-base bg-slate-900 px-2 py-0.5 rounded border border-slate-700">${Number(prod.price) > 0 ? prod.price + '<span class="text-[9px] text-slate-400 ml-1">ج.م</span>' : 'متغير'}</p></div>
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

// --- Product Editor ---
function renderAdminTempImages() {
    const container = document.getElementById('edit-prod-images-container');
    if(!container) return;
    if(tempProdImages.length === 0) {
        container.innerHTML = `<div class="w-full text-center py-4 text-xs text-slate-500 font-bold border border-dashed border-slate-700 rounded-lg">لم يتم إضافة صور للمنتج بعد</div>`; return;
    }
    container.innerHTML = tempProdImages.map((url, idx) => `
        <div class="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 border-slate-700 group">
            <img src="${url}" class="w-full h-full object-cover">
            ${idx === 0 ? `<div class="absolute bottom-0 left-0 right-0 bg-pink-500/90 text-white text-[9px] font-bold text-center py-0.5 backdrop-blur-sm z-10">الرئيسية</div>` : ''}
            <button onclick="removeTempImage(${idx})" class="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-md hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-sm cursor-pointer z-50 pointer-events-auto"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
}
function removeTempImage(idx) { tempProdImages.splice(idx, 1); renderAdminTempImages(); }

async function compressAndUploadMultiImage(e) {
    const files = e.target.files; if (!files || files.length === 0) return;
    const spinner = document.getElementById('uploading-spinner'); if(spinner) spinner.classList.remove('hidden');
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
                    try {
                        const formData = new FormData(); formData.append('file', base64Str); formData.append('upload_preset', 'gct8i28h'); 
                        const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                        const data = await response.json();
                        if (data.secure_url) { tempProdImages.push(data.secure_url); } else throw new Error("Upload failed");
                    } catch (err) { tempProdImages.push(base64Str); } 
                    resolve();
                }
            }
        });
    }
    renderAdminTempImages();
    if(spinner) spinner.classList.add('hidden'); 
    if(document.getElementById('prod-img-upload')) document.getElementById('prod-img-upload').value = '';
    showSystemToast("تم الرفع وإضافة الصور للمنتج 👑", "success");
}

function openAddProductModal() {
    currentEditId = null; 
    if(document.getElementById('prod-modal-title')) document.getElementById('prod-modal-title').innerHTML = `<i data-lucide="plus-circle" class="w-6 h-6 text-pink-500"></i> إضافة منتج جديد`;
    const fields = ['edit-prod-id','edit-prod-name','edit-prod-price','edit-prod-sub','edit-prod-desc'];
    fields.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    const catSelect = document.getElementById('edit-prod-cat');
    if(catSelect) {
        catSelect.innerHTML = (catMenu || []).map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
        catSelect.value = adminCurrentCat === 'all' ? (catMenu && catMenu.length > 0 ? catMenu[0] : "تورت") : adminCurrentCat; 
    }
    if(document.getElementById('edit-prod-layout')) document.getElementById('edit-prod-layout').value = 'default';
    if(document.getElementById('edit-prod-badge')) document.getElementById('edit-prod-badge').value = '';
    if(document.getElementById('edit-prod-instock')) document.getElementById('edit-prod-instock').checked = true; 
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
        if(catSelect) catSelect.innerHTML = (catMenu || []).map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
        if(document.getElementById('edit-prod-id')) document.getElementById('edit-prod-id').value = p.id; 
        if(document.getElementById('edit-prod-name')) document.getElementById('edit-prod-name').value = p.name || '';
        if(document.getElementById('edit-prod-price')) document.getElementById('edit-prod-price').value = p.price || ''; 
        if(document.getElementById('edit-prod-cat')) document.getElementById('edit-prod-cat').value = p.category;
        if(document.getElementById('edit-prod-sub')) document.getElementById('edit-prod-sub').value = p.subType || p.size || p.flowerType || ""; 
        if(document.getElementById('edit-prod-layout')) document.getElementById('edit-prod-layout').value = p.layout || 'default';
        if(document.getElementById('edit-prod-badge')) document.getElementById('edit-prod-badge').value = p.badge || '';
        if(document.getElementById('edit-prod-instock')) document.getElementById('edit-prod-instock').checked = p.inStock !== false; 
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
    const nName = document.getElementById('edit-prod-name')?.value.trim(); const nPrice = parseInt(document.getElementById('edit-prod-price')?.value) || 0;
    const nCat = document.getElementById('edit-prod-cat')?.value; const nSub = document.getElementById('edit-prod-sub')?.value.trim();
    const nLayout = document.getElementById('edit-prod-layout')?.value || 'default'; const nBadge = document.getElementById('edit-prod-badge')?.value || '';
    const nInStock = document.getElementById('edit-prod-instock')?.checked; const nDesc = document.getElementById('edit-prod-desc')?.value.trim();
    if(!nName) { showSystemToast("يجب كتابة اسم المنتج", "error"); return; }
    const finalImagesArray = [...tempProdImages]; const finalImg = finalImagesArray.length > 0 ? finalImagesArray[0] : '';
    let prodObj;
    if (currentEditId) {
        const idx = catalog.findIndex(x => String(x.id) === String(currentEditId));
        if (idx > -1) {
            catalog[idx].name = nName; catalog[idx].price = nPrice; catalog[idx].category = nCat; catalog[idx].desc = nDesc; 
            catalog[idx].images = finalImagesArray; catalog[idx].img = finalImg; catalog[idx].subType = nSub; catalog[idx].layout = nLayout; catalog[idx].badge = nBadge; catalog[idx].inStock = nInStock;
            if(nCat === 'ديسباسيتو') catalog[idx].size = nSub; if(nCat === 'ورد') catalog[idx].flowerType = nSub; 
            prodObj = catalog[idx];
        }
    } else {
        prodObj = { id: 'prod_' + Date.now() + Math.floor(Math.random()*1000), category: nCat, name: nName, price: nPrice, desc: nDesc, images: finalImagesArray, img: finalImg, subType: nSub, layout: nLayout, badge: nBadge, inStock: nInStock };
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

// --- Cake Builder Settings ---
function fillCakeBuilderAdmin() {
    if(!window.siteSettings) return;
    if (!siteSettings.cakeBuilder) siteSettings.cakeBuilder = JSON.parse(JSON.stringify(defaultSettings.cakeBuilder));
    const c = siteSettings.cakeBuilder;
    if(document.getElementById('set-cake-base-price')) document.getElementById('set-cake-base-price').value = c.basePrice || 145;
    if(document.getElementById('set-cake-min-sq')) document.getElementById('set-cake-min-sq').value = c.minSquare || 16;
    if(document.getElementById('set-cake-min-rect')) document.getElementById('set-cake-min-rect').value = c.minRect || 20;
    if(c.imagePrinting) {
        const edible = c.imagePrinting.find(i => i.label === 'صورة قابلة للأكل');
        if(edible && document.getElementById('set-print-edible')) document.getElementById('set-print-edible').value = edible.price;
    }
    renderAdminCakeFlavors(); 
}

function renderAdminCakeFlavors() {
    if(!window.siteSettings) return;
    const list = siteSettings.cakeBuilder?.flavors || [];
    const container = document.getElementById('admin-cake-flavors-list');
    if(!container) return;
    container.innerHTML = list.map((fl, idx) => `
        <div class="bg-purple-500/10 text-purple-300 text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-purple-500/20 font-bold">
            <span>${escapeHTML(fl)}</span>
            <button onclick="removeCakeFlavor(${idx})" class="text-red-400 hover:text-red-300 ml-1 relative z-50 pointer-events-auto"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
}

function addCakeFlavor() {
    const input = document.getElementById('new-flavor-input'); if(!input) return;
    const val = input.value.trim(); if(!val) return;
    if(!siteSettings.cakeBuilder.flavors) siteSettings.cakeBuilder.flavors = [];
    siteSettings.cakeBuilder.flavors.push(val);
    input.value = ''; renderAdminCakeFlavors();
}

function removeCakeFlavor(idx) { 
    if(siteSettings.cakeBuilder && siteSettings.cakeBuilder.flavors) { siteSettings.cakeBuilder.flavors.splice(idx, 1); renderAdminCakeFlavors(); }
}

async function saveCakeBuilderSettings() {
    if(!window.siteSettings) return;
    const c = siteSettings.cakeBuilder;
    if(c) {
        c.basePrice = Number(document.getElementById('set-cake-base-price')?.value) || 145;
        c.minSquare = Number(document.getElementById('set-cake-min-sq')?.value) || 16;
        c.minRect = Number(document.getElementById('set-cake-min-rect')?.value) || 20;
        c.imagePrinting = [ { label: 'بدون', price: 0 }, { label: 'صورة قابلة للأكل', price: Number(document.getElementById('set-print-edible')?.value) || 0 }, { label: 'صورة غير قابلة للأكل', price: 0 } ];
    }
    try {
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings); 
        saveEngineMemory('set'); showSystemToast("تم حفظ إعدادات التورت الملكية 👑", "success");
    } catch(e) { saveEngineMemory('set'); showSystemToast("تم الحفظ محلياً", "info"); }
}

// --- Categories ---
function renderAdminCategories() {
    const listEl = document.getElementById('admin-categories-list');
    if (!listEl) return;
    if (!catMenu || catMenu.length === 0) { listEl.innerHTML = `<p class="text-center text-slate-500 py-6 font-bold text-xs">لا توجد أقسام حالياً. ابدأ بإضافة أول قسم!</p>`; return; }
    listEl.innerHTML = catMenu.map((cat, index) => `
        <div class="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-xl group hover:border-blue-500/50 transition-all mb-2">
            <div class="flex items-center gap-3"><span class="w-6 h-6 flex items-center justify-center bg-slate-900 rounded-lg text-[10px] text-slate-400 font-bold">${index + 1}</span><span class="font-bold text-slate-200 text-sm">${escapeHTML(cat)}</span></div>
            <button onclick="removeCategory(${index})" class="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
    const catSelect = document.getElementById('edit-prod-cat');
    if(catSelect) catSelect.innerHTML = catMenu.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
}

function addNewCategory() {
    const input = document.getElementById('new-category-input'); if(!input) return;
    const val = input.value.trim();
    if (!val) { showSystemToast("يرجى كتابة اسم القسم", "error"); return; }
    if (catMenu && catMenu.includes(val)) { showSystemToast("هذا القسم موجود بالفعل", "error"); return; }
    if(!catMenu) window.catMenu = [];
    catMenu.push(val); input.value = ''; renderAdminCategories(); renderAdminCatalogTabs();
    showSystemToast(`تم إضافة القسم. لا تنسى الضغط على حفظ الأقسام.`, "success");
}

function removeCategory(index) {
    if (catMenu[index] === 'تورت') { showSystemToast("عفواً، قسم التورت الملكية أساسي لا يمكن حذفه! 👑", "error"); return; }
    openConfirmModal('حذف قسم', `هل أنت متأكد من حذف قسم "${catMenu[index]}"؟`, () => {
        catMenu.splice(index, 1); renderAdminCategories(); renderAdminCatalogTabs();
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

// --- Promo Codes ---
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

// --- AI Description ---
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
        const apiKey = 'AIzaSyCYIz6kCuMZ6g5dqJaDTJh5yDRizTHMhQU'; 
        const promptText = `أنت كاتب إعلانات محترف لعلامة تجارية مصرية راقية اسمها "حلويات بوسي"\nاكتب وصف قصير وجذاب لمنتج اسمه "${prodName}" من قسم "${prodCat}"\nالشروط: لهجة مصرية عامية راقية، بدون علامات ترقيم، استخدم إيموجي تخدم المعنى، لا يتعدى سطرين. يفتح الشهية ويشجع على الشراء فوراً.`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ? data.error.message : 'خطأ غير معروف من خوادم الذكاء الاصطناعي');
        if (data.candidates && data.candidates.length > 0) {
            descField.value = data.candidates[0].content.parts[0].text.trim();
            showSystemToast('تم التوليد بنجاح! 👑 راجعي الوصف.', 'success');
        } else { throw new Error('لم يتم إرجاع وصف صالح.'); }
    } catch (error) { showSystemToast("تعذر التوليد حالياً: " + error.message, "error"); } 
    finally { btn.innerHTML = originalBtnHTML; btn.disabled = false; if(window.lucide) lucide.createIcons(); }
}

function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
}

// ==========================================
// 3. Engine Initialization & Failsafe Boot
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if(window.lucide) lucide.createIcons();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('admin-current-date');
    if(dateEl) dateEl.textContent = new Date().toLocaleDateString('ar-EG', dateOptions);
});

// 🛡️ Boot Controller (The Master Fix)
window.addEventListener('load', async () => {
    console.log("BoseSweets Admin Engine Initiating...");
    
    // 1. Force Load Data (With error catching)
    try { await loadEngineMemory(); } 
    catch(e) { console.error("Memory load warning:", e); }

    // 2. Safely start the dashboard regardless of Auth state delays
    if(typeof auth !== 'undefined') {
        auth.onAuthStateChanged(user => {
            if (user) {
                openAdminDashboardDirectly();
            } else {
                console.warn("BoseSweets: User not logged in. Booting Dashboard in local mode to prevent freeze.");
                openAdminDashboardDirectly();
            }
        });
    } else {
        console.warn("BoseSweets: Firebase Auth undefined. Booting locally.");
        openAdminDashboardDirectly();
    }
    
    // Failsafe Unfreeze Timeout
    setTimeout(unfreezeAdminUI, 2000);
}
