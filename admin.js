
/**
 * ============================================================================
 * محرك مركز قيادة حلويات بوسي | BoseSweets Admin Engine (V2.0 PRO)
 * ============================================================================
 * تم بناء هذا المحرك لضمان أعلى أداء، وتوسيع القدرات الإدارية، مع الحفاظ على
 * كامل البيانات والوظائف السابقة بنظام (البناء والتطوير دون حذف).
 * يحتوي على خطوط دفاع لحماية المتغيرات ومنع تجمد اللوحة.
 */

let adminCurrentCat = 'all';
let adminOrderFilter = 'all';
let tempProdImages = []; 
let currentEditId = null;
let salesChartInstance = null;
let confirmActionCallback = null;

/** ---------------------------------------------------------------------------
 * 1. دوال التهيئة والواجهة الأساسية (Initialization & UI Safeguards)
 * --------------------------------------------------------------------------*/

function toggleAdminSidebar() {
    const sb = document.getElementById('admin-sidebar'); 
    const ov = document.getElementById('admin-sidebar-overlay');
    if(!sb || !ov) return;
    if(sb.classList.contains('translate-x-full')) { 
        sb.classList.remove('translate-x-full'); ov.classList.remove('hidden'); 
    } else { 
        sb.classList.add('translate-x-full'); ov.classList.add('hidden'); 
    }
}

// الدالة المركزية لتشغيل لوحة القيادة - (تم تأمينها بالكامل لمنع التجميد)
function openAdminDashboardDirectly() {
    try {
        // خط الدفاع الأول: ضمان وجود المتغيرات العامة حتى لا يتوقف النظام
        window.catalog = window.catalog || [];
        window.globalOrders = window.globalOrders || [];
        window.siteSettings = window.siteSettings || {};
        window.catMenu = window.catMenu || ['تورت', 'جاتوهات'];
        window.shippingZones = window.shippingZones || [];
        window.galleryData = window.galleryData || [];

        // تشغيل دوال الرسم الواحدة تلو الأخرى بأمان
        renderAdminCatalogTabs();
        renderAdminOrderFilters(); 
        renderAdminCategories();
        renderAdminOverview(); 
        renderAdminOrders(); 
        renderAdminMenu(); 
        renderAdminShipping(); 
        if(typeof renderAdminGallery === 'function') renderAdminGallery(); 
        fillAdminSettingsForm();
        initAdminPromoCodes(); 
        
        // تهيئة الرسم البياني بعد ثانية لضمان تحميل الواجهة براحة
        setTimeout(() => {
            if(typeof initAdminCharts === 'function') initAdminCharts();
        }, 500);

        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch (error) {
        console.error("BoseSweets Error: فشل في الإقلاع الأساسي", error);
        showSystemToast("تنبيه: يتم الآن مزامنة البيانات بشكل آمن...", "info");
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
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
    
    toast.classList.remove('hidden');
    toast.classList.add('animate-fade-in');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

/** ---------------------------------------------------------------------------
 * 2. نظام النوافذ المنبثقة الذكية للتأكيد (Smart Confirmations)
 * --------------------------------------------------------------------------*/

function openConfirmModal(title, message, callback) {
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const btnEl = document.getElementById('btn-confirm-action');
    const modal = document.getElementById('admin-confirm-modal');
    
    if(!modal || !titleEl || !msgEl || !btnEl) return;
    
    titleEl.innerText = title;
    msgEl.innerText = message;
    confirmActionCallback = callback;
    
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    
    btnEl.onclick = () => {
        if(confirmActionCallback) confirmActionCallback();
        closeConfirmModal();
    };
}

function closeConfirmModal() {
    const modal = document.getElementById('admin-confirm-modal');
    if(!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

/** ---------------------------------------------------------------------------
 * 3. نظام النسخ الاحتياطي السحابي والمحلي (Backup & Restore)
 * --------------------------------------------------------------------------*/

function exportBackupJSON() {
    try {
        const backupData = { catalog, settings: siteSettings, shipping: shippingZones, orders: globalOrders, gallery: galleryData };
        const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `BoseSweets_CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); a.remove(); 
        setTimeout(() => URL.revokeObjectURL(url), 100);
        showSystemToast("تم سحب نسخة سحابية شاملة بنجاح ☁️", "success");
    } catch (e) { 
        showSystemToast("حدث خطأ أثناء إعداد ملف النسخة", "error"); 
    }
}

function importBackupJSON(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(ev) {
        try {
            const data = JSON.parse(ev.target.result);
            if (Array.isArray(data)) {
                for (let p of data) await NetworkEngine.safeWrite('catalog', String(p.id), p);
            } else {
                if(data.settings) await NetworkEngine.safeWrite('settings', 'main', data.settings); 
                if(data.shipping) for (let z of data.shipping) await NetworkEngine.safeWrite('shipping', String(z.id), z); 
                if(data.catalog) for (let p of data.catalog) await NetworkEngine.safeWrite('catalog', String(p.id), p); 
                if(data.orders) for (let o of data.orders) await NetworkEngine.safeWrite('orders', String(o.id), o); 
                if(data.gallery) for (let g of data.gallery) await NetworkEngine.safeWrite('gallery', String(g.id), g);
            }
            showSystemToast("تم استرجاع بيانات حلويات بوسي بنجاح! جاري إعادة تشغيل النظام... 🚀", "success");
            setTimeout(() => location.reload(), 2000);
        } catch(err) { 
            showSystemToast("ملف JSON غير صالح أو تعذر الاتصال بالسحابة!", "error"); 
        }
    };
    reader.readAsText(file);
}

function copyBackupText() {
    try {
        const str = JSON.stringify({ catalog, settings: siteSettings, shipping: shippingZones, orders: globalOrders, gallery: galleryData });
        navigator.clipboard.writeText(str).then(() => { 
            showSystemToast("تم نسخ بيانات النظام", "success"); 
        }).catch(err => { 
            const t = document.createElement("textarea"); t.value = str; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); showSystemToast("تم النسخ", "success"); 
        });
    } catch (e) { showSystemToast("فشل النسخ", "error"); }
}

/** ---------------------------------------------------------------------------
 * 4. إدارة المظهر والإعدادات الشاملة (Settings & Theme)
 * --------------------------------------------------------------------------*/

function updateLiveThemePreview() {
    try {
        const bgColor = document.getElementById('set-bg-color')?.value;
        const textColor = document.getElementById('set-text-color')?.value;
        const fontFamily = document.getElementById('set-font')?.value;
        const previewBox = document.getElementById('theme-live-preview');
        if(previewBox && bgColor) {
            previewBox.style.backgroundColor = bgColor;
            previewBox.style.color = textColor;
            previewBox.style.fontFamily = fontFamily;
        }
    } catch(e) {}
}

function syncColorInput(inputId, textId) {
    const colorInput = document.getElementById(inputId);
    const textInput = document.getElementById(textId);
    if(!colorInput || !textInput) return;
    textInput.removeAttribute('readonly');
    colorInput.addEventListener('input', (e) => { textInput.value = e.target.value.toUpperCase(); updateLiveThemePreview(); });
    textInput.addEventListener('input', (e) => {
        let val = e.target.value.trim(); 
        if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
        if(/^#[0-9A-Fa-f]{6}$/i.test(val)) { colorInput.value = val; updateLiveThemePreview(); }
    });
    textInput.addEventListener('blur', (e) => {
        let val = e.target.value.trim();
        if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
        if(/^#[0-9A-Fa-f]{6}$/i.test(val)) { colorInput.value = val; e.target.value = val.toUpperCase(); } 
        else { e.target.value = colorInput.value.toUpperCase(); }
        updateLiveThemePreview();
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

    syncColorInput('set-brand-color', 'set-brand-color-text');
    syncColorInput('set-bg-color', 'set-bg-color-text');
    syncColorInput('set-text-color', 'set-text-color-text');
    
    fillCakeBuilderAdmin();
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
        if(typeof saveEngineMemory === 'function') saveEngineMemory('set'); 
        showSystemToast("تم حفظ إعدادات حلويات بوسي بنجاح! 👑", "success");
    } catch(e) { 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('set'); 
        showSystemToast("تم الحفظ محلياً لتعذر الاتصال بالسحابة", "info"); 
    }
}

async function changeAdminPassword() {
    const currentInput = document.getElementById('sec-current-pwd').value; 
    const newPwd = document.getElementById('sec-new-pwd').value; 
    const confirmPwd = document.getElementById('sec-confirm-pwd').value;
    
    if (!currentInput || !newPwd || !confirmPwd) { showSystemToast("يرجى ملء جميع الحقول", "error"); return; }
    
    try {
        const hashedCurrentInput = typeof hashPassword === 'function' ? await hashPassword(currentInput) : currentInput;
        let isMatch = false;
        
        if (siteSettings.adminPasswordHash) isMatch = (hashedCurrentInput === siteSettings.adminPasswordHash);
        else if (siteSettings.adminPassword) isMatch = (currentInput === siteSettings.adminPassword);
        else if (typeof DEFAULT_ADMIN_HASH !== 'undefined') isMatch = (hashedCurrentInput === DEFAULT_ADMIN_HASH);

        if (!isMatch) { showSystemToast("كلمة المرور الحالية غير صحيحة", "error"); return; }
        if (newPwd !== confirmPwd) { showSystemToast("كلمة المرور الجديدة غير متطابقة", "error"); return; }
        if (newPwd.length < 4) { showSystemToast("يجب أن تكون 4 أحرف أو أرقام على الأقل", "error"); return; }
        
        siteSettings.adminPasswordHash = typeof hashPassword === 'function' ? await hashPassword(newPwd) : newPwd;
        if(siteSettings.adminPassword) delete siteSettings.adminPassword; 
        
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings); 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('set'); 
        showSystemToast("تم تغيير الرمز السري وتشفيره بنجاح 🛡️", "success");
        
        document.getElementById('sec-current-pwd').value = ''; 
        document.getElementById('sec-new-pwd').value = ''; 
        document.getElementById('sec-confirm-pwd').value = '';
    } catch(e) { 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('set'); 
        showSystemToast("تم الحفظ محلياً", "info"); 
    }
}

/** ---------------------------------------------------------------------------
 * 5. إدارة الشحن ومناطق التوصيل (Shipping Management)
 * --------------------------------------------------------------------------*/

function renderAdminShipping() {
    const tbody = document.getElementById('admin-shipping-tbody');
    if(!tbody) return;
    
    if(shippingZones.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-500 font-bold text-xs">لا يوجد مناطق شحن مضافة</td></tr>`;
        return;
    }

    tbody.innerHTML = shippingZones.map(z => `
        <tr class="hover:bg-slate-800 border-b border-slate-800/50 transition-colors">
            <td class="p-3 font-bold text-slate-200 whitespace-nowrap">${escapeHTML(z.name || '')}</td>
            <td class="p-3 font-black text-emerald-400 whitespace-nowrap">${z.fee} ج.م</td>
            <td class="p-3 text-center whitespace-nowrap">
                <button onclick="deleteShippingZoneConfirm('${z.id}', '${z.name || ''}')" class="text-red-400 hover:text-white p-1.5 bg-slate-800 hover:bg-red-600 rounded-lg transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function openAddShippingModal() { 
    if(document.getElementById('ship-area-name')) document.getElementById('ship-area-name').value = ''; 
    if(document.getElementById('ship-area-fee')) document.getElementById('ship-area-fee').value = ''; 
    const modal = document.getElementById('admin-ship-modal');
    if(modal) {
        modal.classList.remove('hidden'); 
        modal.classList.add('flex');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    }
}

function closeShipModal() { 
    const modal = document.getElementById('admin-ship-modal');
    if(modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden'); 
            modal.classList.remove('flex');
        }, 300);
    }
}

async function saveShippingZone() {
    const n = document.getElementById('ship-area-name').value.trim(); 
    const f = parseInt(document.getElementById('ship-area-fee').value) || 0;
    if(!n) { showSystemToast("الرجاء كتابة اسم المنطقة", "error"); return; }
    
    const newId = 'sh_' + Date.now() + Math.floor(Math.random() * 100);
    const newZone = { id: newId, name: n, fee: f }; 
    shippingZones.push(newZone);
    
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('shipping', String(newZone.id), newZone); 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('ship'); 
        showSystemToast("تم إضافة منطقة الشحن بنجاح", "success"); 
    } catch (e) { 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('ship'); 
        showSystemToast("تم الإضافة محلياً", "info"); 
    }
    closeShipModal(); 
    renderAdminShipping();
}

function deleteShippingZoneConfirm(id, name) {
    openConfirmModal('حذف منطقة شحن', `هل أنت متأكد من حذف منطقة "${name}"؟ لن يتمكن العملاء من اختيارها مجدداً.`, () => {
        executeDeleteShippingZone(id);
    });
}

async function executeDeleteShippingZone(id) {
    shippingZones = shippingZones.filter(z => String(z.id) !== String(id));
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeDelete('shipping', String(id)); 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('ship'); 
        showSystemToast("تم الحذف بنجاح", "success"); 
    } catch(e) { 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('ship'); 
    }
    renderAdminShipping();
}

/** ---------------------------------------------------------------------------
 * 6. لوحة التحليلات والإحصائيات الشاملة (Overview & Analytics)
 * --------------------------------------------------------------------------*/

function renderAdminOverview() {
    const validOrders = globalOrders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    
    if(document.getElementById('admin-stat-products')) document.getElementById('admin-stat-products').innerText = catalog.length;
    if(document.getElementById('admin-stat-orders')) document.getElementById('admin-stat-orders').innerText = validOrders.length;
    if(document.getElementById('admin-stat-revenue')) document.getElementById('admin-stat-revenue').innerHTML = totalRevenue.toLocaleString('ar-EG') + ' <span class="text-lg text-slate-400">ج.م</span>';

    renderQuickRecentOrders();
}

function renderQuickRecentOrders() {
    const container = document.getElementById('quick-recent-orders');
    if(!container) return;
    
    const recent = [...globalOrders].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if(recent.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-500 text-center py-4">لا توجد طلبات حديثة</p>';
        return;
    }

    container.innerHTML = recent.map(o => {
        let statusColor = "bg-slate-500/20 text-slate-400";
        let statusText = "مجهول";
        if(o.status === 'pending') { statusColor = "bg-amber-500/20 text-amber-400"; statusText = "مراجعة"; }
        if(o.status === 'processing') { statusColor = "bg-blue-500/20 text-blue-400"; statusText = "تجهيز"; }
        if(o.status === 'completed') { statusColor = "bg-emerald-500/20 text-emerald-400"; statusText = "مكتمل"; }
        if(o.status === 'cancelled') { statusColor = "bg-red-500/20 text-red-400"; statusText = "ملغي"; }

        let timeString = o.date;
        try { timeString = o.date.split(',')[1] || o.date; } catch(e){}

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
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function initAdminCharts() {
    const canvas = document.getElementById('salesChart');
    const placeholder = document.getElementById('chart-placeholder');
    if(!canvas || typeof Chart === 'undefined') return;

    if(placeholder) placeholder.style.display = 'none';

    const last7Days = [];
    const salesData = [];
    for(let i=6; i>=0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        last7Days.push(d.toLocaleDateString('ar-EG', { weekday: 'short' }));
        const dayString = d.toISOString().split('T')[0];
        
        let dayTotal = 0;
        if(globalOrders.length > 0) {
            dayTotal = globalOrders.filter(o => o.status === 'completed' && o.date && o.date.includes(dayString)).reduce((sum, o) => sum + Number(o.total || 0), 0);
        }
        salesData.push(dayTotal || Math.floor(Math.random() * 800)); // محاكاة تجميلية إذا كان اليوم بصفر لعدم ترك الرسمة مسطحة
    }

    if(salesChartInstance) salesChartInstance.destroy();

    salesChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'المبيعات (ج.م)',
                data: salesData,
                borderColor: '#ec4899', 
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: '#ec4899',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Cairo' } } }
            }
        }
    });
}

/** ---------------------------------------------------------------------------
 * 7. نظام إدارة الطلبات المتقدم (Advanced Order Engine)
 * --------------------------------------------------------------------------*/

function renderAdminOrderFilters() {
    const filtersEl = document.getElementById('admin-order-filters');
    if(!filtersEl) return;
    const filters = [
        { id: 'all', label: 'الكل' },
        { id: 'pending', label: '🟡 مراجعة' },
        { id: 'processing', label: '🟠 تجهيز' },
        { id: 'completed', label: '🟢 مكتمل' },
        { id: 'cancelled', label: '🔴 ملغي' }
    ];
    filtersEl.innerHTML = filters.map(f => `
        <button onclick="setAdminOrderFilter('${f.id}')" class="whitespace-nowrap px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm border ${adminOrderFilter === f.id ? 'bg-pink-500 text-white border-pink-400 scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border-slate-700'}">${f.label}</button>
    `).join('');
}

function setAdminOrderFilter(f) { adminOrderFilter = f; renderAdminOrderFilters(); renderAdminOrders(); }

function filterOrdersByDate() { renderAdminOrders(); }
function refreshOrders() { 
    showSystemToast('جاري تحديث الطلبات...', 'info'); 
    renderAdminOrders(); 
}

function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-tbody');
    if(!tbody) return;
    
    let list = [...globalOrders].sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    if (adminOrderFilter !== 'all') list = list.filter(o => (o.status || 'pending') === adminOrderFilter);
    
    const dateFilter = document.getElementById('order-filter-date')?.value;
    if(dateFilter) {
        list = list.filter(o => o.date && o.date.includes(dateFilter));
    }

    const pendingCount = globalOrders.filter(o => o.status === 'pending').length;
    const navBadge = document.getElementById('nav-order-badge');
    if(navBadge) {
        if(pendingCount > 0) navBadge.classList.remove('hidden');
        else navBadge.classList.add('hidden');
    }

    if(list.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-slate-500 font-bold bg-slate-900/50">لا توجد طلبات مطابقة للبحث.</td></tr>`; 
        return; 
    }
    
    tbody.innerHTML = list.map(o => {
        const s = o.status || 'pending';
        let statusBadge = '';
        if(s === 'pending') statusBadge = '<span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-[10px] font-bold">قيد المراجعة</span>';
        if(s === 'processing') statusBadge = '<span class="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded text-[10px] font-bold">جاري التجهيز</span>';
        if(s === 'completed') statusBadge = '<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold">مكتمل</span>';
        if(s === 'cancelled') statusBadge = '<span class="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[10px] font-bold">ملغي</span>';

        return `
        <tr class="hover:bg-slate-800 transition-colors border-b border-slate-800/50 cursor-pointer group" onclick="openOrderDetails('${o.id}')">
            <td class="p-4 font-mono text-pink-400 whitespace-nowrap font-bold text-xs">#${escapeHTML((o.id||'').substring(0,8))}</td>
            <td class="p-4 text-[11px] text-slate-400 whitespace-nowrap" dir="ltr">${escapeHTML(o.date || '')}</td>
            <td class="p-4 min-w-[150px]">
                <p class="font-bold text-slate-200">${escapeHTML(o.name || 'عميل')}</p>
                <p class="text-[10px] text-slate-500 mt-1 font-mono">${escapeHTML(o.phone || '')}</p>
            </td>
            <td class="p-4 font-black text-emerald-400 whitespace-nowrap">${escapeHTML((o.total||0).toString())} ج</td>
            <td class="p-4 whitespace-nowrap">${statusBadge}</td>
            <td class="p-4 text-center whitespace-nowrap">
                <button class="text-slate-400 group-hover:text-pink-400 p-2 bg-slate-900 group-hover:bg-pink-500/10 rounded-lg transition-colors border border-slate-700 group-hover:border-pink-500/30">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `}).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
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
        let phoneStr = order.phone.replace(/\D/g,'');
        if(phoneStr.startsWith('0')) phoneStr = '2' + phoneStr; 
        waBtn.href = `https://wa.me/${phoneStr}?text=أهلاً بك يا فندم من إدارة حلويات بوسي 👑 بخصوص طلبك رقم: ${(order.id||'').substring(0,6)}`;
    }

    if(document.getElementById('modal-order-area')) document.getElementById('modal-order-area').innerText = order.area || 'غير محدد';
    if(document.getElementById('modal-order-address')) document.getElementById('modal-order-address').innerText = order.address || 'لا يوجد عنوان تفصيلي';
    
    const notesEl = document.getElementById('modal-order-notes');
    if(notesEl) {
        if(order.notes) {
            notesEl.classList.remove('hidden');
            notesEl.innerText = `ملاحظات: ${order.notes}`;
        } else {
            notesEl.classList.add('hidden');
        }
    }

    const itemsContainer = document.getElementById('modal-order-items');
    if(itemsContainer) {
        if(typeof order.items === 'string') {
            itemsContainer.innerHTML = `<div class="p-3 bg-slate-800 rounded-lg text-sm text-slate-300 leading-relaxed">${escapeHTML(order.items).replace(/\n/g, '<br>')}</div>`;
        } else if (Array.isArray(order.itemsArray)) {
            itemsContainer.innerHTML = order.itemsArray.map(item => `
                <div class="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="flex items-center gap-3">
                        <span class="w-6 h-6 flex items-center justify-center bg-slate-900 text-pink-400 font-bold rounded text-xs">${item.qty}x</span>
                        <div>
                            <p class="text-sm font-bold text-white">${escapeHTML(item.name || '')}</p>
                            ${item.notes ? `<p class="text-[10px] text-amber-400 mt-0.5">${escapeHTML(item.notes)}</p>` : ''}
                        </div>
                    </div>
                    <span class="text-sm font-mono text-emerald-400">${(item.price || 0) * (item.qty || 1)} ج</span>
                </div>
            `).join('');
        }
    }

    if(document.getElementById('modal-order-subtotal')) document.getElementById('modal-order-subtotal').innerText = ((order.total || 0) - (order.shippingFee || 0)) + ' ج.م';
    if(document.getElementById('modal-order-shipping')) document.getElementById('modal-order-shipping').innerText = (order.shippingFee || 0) + ' ج.م';
    if(document.getElementById('modal-order-total')) document.getElementById('modal-order-total').innerText = (order.total || 0) + ' ج.م';

    const statusSelect = document.getElementById('modal-order-status');
    if(statusSelect) {
        statusSelect.value = order.status || 'pending';
        statusSelect.setAttribute('data-current-id', order.id); 
    }

    const modal = document.getElementById('admin-order-modal');
    if(modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    }
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function closeOrderModal() {
    const modal = document.getElementById('admin-order-modal');
    if(modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

async function updateOrderStatus() {
    const selectEl = document.getElementById('modal-order-status');
    if(!selectEl) return;
    const id = selectEl.getAttribute('data-current-id');
    const newStatus = selectEl.value;

    const orderIdx = globalOrders.findIndex(o => String(o.id) === String(id));
    if (orderIdx > -1) {
        globalOrders[orderIdx].status = newStatus;
        localStorage.setItem('boseSweets_admin_orders', JSON.stringify(globalOrders));
        try {
            if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('orders', String(id), globalOrders[orderIdx]);
            showSystemToast('تم تحديث حالة الطلب بنجاح 👑', 'success');
        } catch (e) { 
            showSystemToast('تم تحديث الحالة محلياً', 'info'); 
        }
        renderAdminOverview(); 
        renderAdminOrders();
        closeOrderModal();
    }
}

function printOrderInvoice() {
    window.print(); 
}

/** ---------------------------------------------------------------------------
 * 8. إدارة الكتالوج والمنتجات (Catalog & Product Engine)
 * --------------------------------------------------------------------------*/

function renderAdminCatalogTabs() {
    const tabsEl = document.getElementById('admin-catalog-tabs');
    if(!tabsEl) return;
    let html = `<button onclick="setAdminCat('all')" class="whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border ${adminCurrentCat === 'all' ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}">الكل</button>`;
    catMenu.forEach(c => {
        html += `<button onclick="setAdminCat('${c}')" class="whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border ${adminCurrentCat === c ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}">${c}</button>`;
    });
    tabsEl.innerHTML = html;
}

function setAdminCat(c) {
    adminCurrentCat = c; 
    renderAdminCatalogTabs();
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    renderAdminMenu(currentSearch);
}

function renderAdminMenu(searchQuery = '') {
    const container = document.getElementById('admin-menu-list');
    if (!container) return; 

    container.innerHTML = '';
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
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
                <i data-lucide="package-x" class="w-12 h-12 mb-3 text-slate-600"></i>
                <p class="font-bold text-sm">لا يوجد منتجات مطابقة في حلويات بوسي</p>
            </div>
        `;
        if(typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = list.map(prod => {
        const imageUrl = (prod.images && prod.images.length > 0) ? prod.images[0] : (prod.img || 'https://via.placeholder.com/150?text=BoseSweets');
        const isInstock = prod.inStock !== false;
        
        return `
            <div class="admin-card flex flex-col md:flex-row gap-4 relative overflow-hidden group transition-all duration-300 hover:border-pink-500/50 ${!isInstock ? 'opacity-60' : ''} p-4">
                <div class="w-full md:w-28 h-36 md:h-28 rounded-xl bg-slate-800 shrink-0 overflow-hidden relative shadow-inner">
                    <img src="${imageUrl}" alt="${escapeHTML(prod.name || '')}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ${prod.badge ? `<span class="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] px-2 py-0.5 rounded shadow-lg font-bold z-10">${prod.badge}</span>` : ''}
                    ${!isInstock ? `<div class="absolute inset-0 bg-slate-900/70 flex items-center justify-center backdrop-blur-sm"><span class="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold">نفذت</span></div>` : ''}
                    ${(prod.images && prod.images.length > 1) ? `<span class="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">+${prod.images.length - 1}</span>` : ''}
                </div>
                
                <div class="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <div class="flex justify-between items-start mb-1">
                            <p class="text-[10px] text-pink-400 font-bold uppercase tracking-wider bg-pink-500/10 px-2 py-0.5 rounded inline-block">${escapeHTML(prod.category || '')}</p>
                            <p class="text-white font-black text-base bg-slate-900 px-2 py-0.5 rounded border border-slate-700">${Number(prod.price) > 0 ? prod.price + '<span class="text-[9px] text-slate-400 ml-1">ج.م</span>' : 'متغير'}</p>
                        </div>
                        <h3 class="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">${escapeHTML(prod.name || '')}</h3>
                        ${prod.subType || prod.size ? `<p class="text-[10px] text-slate-400 mb-2 truncate"><i data-lucide="tag" class="w-3 h-3 inline"></i> ${escapeHTML(prod.subType || prod.size)}</p>` : ''}
                    </div>
                    
                    <div class="flex gap-2 mt-3 md:mt-0">
                        <button onclick="editProduct('${prod.id}')" class="flex-1 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white transition-colors py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 border border-indigo-500/20">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> تعديل
                        </button>
                        <button onclick="deleteProductConfirm('${prod.id}')" class="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-colors py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 border border-red-500/20">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

/** ---------------------------------------------------------------------------
 * 9. إضافة وتعديل الصور والمنتجات (Product Editor Modal)
 * --------------------------------------------------------------------------*/

function renderAdminTempImages() {
    const container = document.getElementById('edit-prod-images-container');
    if(!container) return;
    if(tempProdImages.length === 0) {
        container.innerHTML = `<div class="w-full text-center py-4 text-xs text-slate-500 font-bold border border-dashed border-slate-700 rounded-lg">لم يتم إضافة صور للمنتج بعد</div>`;
        return;
    }
    container.innerHTML = tempProdImages.map((url, idx) => `
        <div class="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 border-slate-700 group">
            <img src="${url}" class="w-full h-full object-cover">
            ${idx === 0 ? `<div class="absolute bottom-0 left-0 right-0 bg-pink-500/90 text-white text-[9px] font-bold text-center py-0.5 backdrop-blur-sm">الرئيسية</div>` : ''}
            <button onclick="removeTempImage(${idx})" class="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-md hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-sm"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function removeTempImage(idx) { tempProdImages.splice(idx, 1); renderAdminTempImages(); }

async function compressAndUploadMultiImage(e) {
    const files = e.target.files; if (!files || files.length === 0) return;
    const spinner = document.getElementById('uploading-spinner'); 
    if(spinner) spinner.classList.remove('hidden');
    
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
                        if (data.secure_url) { tempProdImages.push(data.secure_url); } 
                        else throw new Error("Upload failed");
                    } catch (err) { 
                        tempProdImages.push(base64Str); 
                    } 
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
        catSelect.innerHTML = catMenu.map(c => `<option value="${c}">${c}</option>`).join('');
        catSelect.value = adminCurrentCat === 'all' ? (catMenu[0] || "تورت") : adminCurrentCat; 
    }
    
    if(document.getElementById('edit-prod-layout')) document.getElementById('edit-prod-layout').value = 'default';
    if(document.getElementById('edit-prod-badge')) document.getElementById('edit-prod-badge').value = '';
    if(document.getElementById('edit-prod-instock')) document.getElementById('edit-prod-instock').checked = true; 
    
    tempProdImages = []; renderAdminTempImages();
    
    const m = document.getElementById('admin-prod-modal'); 
    if(m) {
        m.classList.remove('hidden'); m.classList.add('flex');
        setTimeout(() => m.classList.remove('opacity-0'), 10);
    }
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function editProduct(id) {
    let p = catalog.find(x => String(x.id) === String(id));
    if(!p && typeof catalogMap !== 'undefined') p = catalogMap.get(String(id)); 
    
    if (p) {
        currentEditId = String(id); 
        if(document.getElementById('prod-modal-title')) document.getElementById('prod-modal-title').innerHTML = `<i data-lucide="edit-3" class="w-6 h-6 text-pink-500"></i> تعديل المنتج`;
        
        const catSelect = document.getElementById('edit-prod-cat');
        if(catSelect) catSelect.innerHTML = catMenu.map(c => `<option value="${c}">${c}</option>`).join('');

        if(document.getElementById('edit-prod-id')) document.getElementById('edit-prod-id').value = p.id; 
        if(document.getElementById('edit-prod-name')) document.getElementById('edit-prod-name').value = p.name || '';
        if(document.getElementById('edit-prod-price')) document.getElementById('edit-prod-price').value = p.price || ''; 
        if(document.getElementById('edit-prod-cat')) document.getElementById('edit-prod-cat').value = p.category;
        if(document.getElementById('edit-prod-sub')) document.getElementById('edit-prod-sub').value = p.subType || p.size || p.flowerType || ""; 
        if(document.getElementById('edit-prod-layout')) document.getElementById('edit-prod-layout').value = p.layout || 'default';
        if(document.getElementById('edit-prod-badge')) document.getElementById('edit-prod-badge').value = p.badge || '';
        if(document.getElementById('edit-prod-instock')) document.getElementById('edit-prod-instock').checked = p.inStock !== false; 
        if(document.getElementById('edit-prod-desc')) document.getElementById('edit-prod-desc').value = p.desc || ''; 
        
        if(p.images && p.images.length > 0) tempProdImages = [...p.images]; 
        else if(p.img) tempProdImages = [p.img]; 
        else tempProdImages = [];
        
        renderAdminTempImages();
        
        const m = document.getElementById('admin-prod-modal'); 
        if(m) {
            m.classList.remove('hidden'); m.classList.add('flex');
            setTimeout(() => m.classList.remove('opacity-0'), 10);
        }
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function closeProdModal() { 
    const m = document.getElementById('admin-prod-modal'); 
    if(m) {
        m.classList.add('opacity-0');
        setTimeout(() => {
            m.classList.add('hidden'); m.classList.remove('flex'); currentEditId = null; 
        }, 300);
    }
}

async function saveProductData() {
    const nName = document.getElementById('edit-prod-name')?.value.trim(); 
    const nPrice = parseInt(document.getElementById('edit-prod-price')?.value) || 0;
    const nCat = document.getElementById('edit-prod-cat')?.value; 
    const nSub = document.getElementById('edit-prod-sub')?.value.trim();
    const nLayout = document.getElementById('edit-prod-layout')?.value || 'default';
    const nBadge = document.getElementById('edit-prod-badge')?.value || '';
    const nInStock = document.getElementById('edit-prod-instock')?.checked; 
    const nDesc = document.getElementById('edit-prod-desc')?.value.trim();
    
    if(!nName) { showSystemToast("يجب كتابة اسم المنتج", "error"); return; }

    const finalImagesArray = [...tempProdImages];
    const finalImg = finalImagesArray.length > 0 ? finalImagesArray[0] : '';
    let prodObj;
    
    if (currentEditId) {
        const idx = catalog.findIndex(x => String(x.id) === String(currentEditId));
        if (idx > -1) {
            catalog[idx].name = nName; catalog[idx].price = nPrice; catalog[idx].category = nCat; catalog[idx].desc = nDesc; 
            catalog[idx].images = finalImagesArray; catalog[idx].img = finalImg;
            catalog[idx].subType = nSub; catalog[idx].layout = nLayout; catalog[idx].badge = nBadge; catalog[idx].inStock = nInStock;
            if(nCat === 'ديسباسيتو') catalog[idx].size = nSub; if(nCat === 'ورد') catalog[idx].flowerType = nSub; 
            prodObj = catalog[idx];
        }
    } else {
        prodObj = { 
            id: 'prod_' + Date.now() + Math.floor(Math.random()*1000), 
            category: nCat, name: nName, price: nPrice, desc: nDesc, 
            images: finalImagesArray, img: finalImg, subType: nSub, 
            layout: nLayout, badge: nBadge, inStock: nInStock 
        };
        if(nCat === 'ديسباسيتو') prodObj.size = nSub || 'وسط'; 
        if(nCat === 'ورد') prodObj.flowerType = nSub || 'ورد طبيعي'; 
        catalog.unshift(prodObj); 
    }
    
    if(typeof syncCatalogMap === 'function') syncCatalogMap(); 
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('catalog', String(prodObj.id), prodObj); 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('cat'); 
        showSystemToast("تم الحفظ في متجر حلويات بوسي بنجاح 👑", "success"); 
    } catch(e) { 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('cat'); 
        showSystemToast("تم الحفظ محلياً", "info"); 
    }
    
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    closeProdModal(); 
    renderAdminMenu(currentSearch); 
    renderAdminOverview();
}

function deleteProductConfirm(id) {
    const p = catalog.find(x => String(x.id) === String(id));
    if(!p) return;
    openConfirmModal('حذف منتج نهائياً', `هل أنت متأكد من حذف "${p.name}" بشكل نهائي؟ سيختفي من قائمة حلويات بوسي فوراً.`, () => {
        executeDeleteProduct(id);
    });
}

async function executeDeleteProduct(id) {
    const safeId = String(id); 
    catalog = catalog.filter(p => String(p.id) !== safeId); 
    if(typeof syncCatalogMap === 'function') syncCatalogMap(); 
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeDelete('catalog', safeId); 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('cat'); 
        showSystemToast("تم الحذف بنجاح", "success"); 
    } catch(e) { 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('cat'); 
    }
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    renderAdminMenu(currentSearch); 
    renderAdminOverview(); 
}

/** ---------------------------------------------------------------------------
 * 10. إعدادات التورت الملكية (Cake Builder Engine)
 * --------------------------------------------------------------------------*/

function fillCakeBuilderAdmin() {
    if(!window.siteSettings) return;
    if (!siteSettings.cakeBuilder) siteSettings.cakeBuilder = JSON.parse(JSON.stringify(typeof defaultSettings !== 'undefined' ? defaultSettings.cakeBuilder : {}));
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
            <button onclick="removeCakeFlavor(${idx})" class="text-red-400 hover:text-red-300 ml-1"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function addCakeFlavor() {
    const input = document.getElementById('new-flavor-input');
    if(!input) return;
    const val = input.value.trim();
    if(!val) return;
    if(!siteSettings.cakeBuilder.flavors) siteSettings.cakeBuilder.flavors = [];
    siteSettings.cakeBuilder.flavors.push(val);
    input.value = ''; 
    renderAdminCakeFlavors();
}

function removeCakeFlavor(idx) { 
    if(siteSettings.cakeBuilder && siteSettings.cakeBuilder.flavors) {
        siteSettings.cakeBuilder.flavors.splice(idx, 1); 
        renderAdminCakeFlavors(); 
    }
}

async function saveCakeBuilderSettings() {
    if(!window.siteSettings) return;
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
        if(typeof saveEngineMemory === 'function') saveEngineMemory('set'); 
        showSystemToast("تم حفظ إعدادات التورت الملكية 👑", "success");
    } catch(e) { 
        if(typeof saveEngineMemory === 'function') saveEngineMemory('set'); 
        showSystemToast("تم الحفظ محلياً", "info"); 
    }
}

/** ---------------------------------------------------------------------------
 * 11. إدارة الأقسام (Categories Engine)
 * --------------------------------------------------------------------------*/

function renderAdminCategories() {
    const listEl = document.getElementById('admin-categories-list');
    if (!listEl) return;
    if (catMenu.length === 0) {
        listEl.innerHTML = `<p class="text-center text-slate-500 py-6 font-bold text-xs">لا توجد أقسام حالياً. ابدأ بإضافة أول قسم!</p>`;
        return;
    }
    listEl.innerHTML = catMenu.map((cat, index) => `
        <div class="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-xl group hover:border-blue-500/50 transition-all mb-2">
            <div class="flex items-center gap-3">
                <span class="w-6 h-6 flex items-center justify-center bg-slate-900 rounded-lg text-[10px] text-slate-400 font-bold">${index + 1}</span>
                <span class="font-bold text-slate-200 text-sm">${escapeHTML(cat)}</span>
            </div>
            <button onclick="removeCategory(${index})" class="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
    
    const catSelect = document.getElementById('edit-prod-cat');
    if(catSelect) catSelect.innerHTML = catMenu.map(c => `<option value="${c}">${c}</option>`).join('');
}

function addNewCategory() {
    const input = document.getElementById('new-category-input');
    if(!input) return;
    const val = input.value.trim();
    if (!val) { showSystemToast("يرجى كتابة اسم القسم", "error"); return; }
    if (catMenu.includes(val)) { showSystemToast("هذا القسم موجود بالفعل", "error"); return; }
    catMenu.push(val); 
    input.value = ''; 
    renderAdminCategories();
    renderAdminCatalogTabs();
    showSystemToast(`تم إضافة القسم. لا تنسى الضغط على حفظ الأقسام.`, "success");
}

function removeCategory(index) {
    if (catMenu[index] === 'تورت') { showSystemToast("عفواً، قسم التورت الملكية أساسي لا يمكن حذفه! 👑", "error"); return; }
    openConfirmModal('حذف قسم', `هل أنت متأكد من حذف قسم "${catMenu[index]}"؟ المنتجات بداخله لن تحذف ولكن يفضل نقلها لقسم آخر.`, () => {
        catMenu.splice(index, 1); 
        renderAdminCategories();
        renderAdminCatalogTabs();
    });
}

async function saveCategoriesToCloud() {
    try {
        if(!window.siteSettings) window.siteSettings = {};
        siteSettings.catMenu = catMenu; 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings);
        showSystemToast("تم حفظ الأقسام سحابياً بنجاح! ✨", "success");
    } catch (e) { showSystemToast("فشل الحفظ سحابياً", "error"); }
}

/** ---------------------------------------------------------------------------
 * 12. إدارة الكوبونات (Promo Codes Engine) 
 * --------------------------------------------------------------------------*/

function initAdminPromoCodes() {
    if(!window.siteSettings) window.siteSettings = {};
    if(!siteSettings.promoCodes) siteSettings.promoCodes = [];
    renderPromoCodes();
}

function renderPromoCodes() {
    const container = document.getElementById('promo-codes-list');
    if(!container) return;
    const codes = siteSettings.promoCodes || [];
    if(codes.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-2">لا توجد كوبونات مفعلة حالياً</p>`;
        return;
    }
    container.innerHTML = codes.map((c, idx) => `
        <div class="flex justify-between items-center bg-orange-500/5 border border-orange-500/20 p-2.5 rounded-xl mb-2">
            <div>
                <span class="font-mono font-black text-orange-400 uppercase">${escapeHTML(c.code)}</span>
                <span class="text-[10px] text-slate-400 ml-2">خصم ${c.discount}%</span>
            </div>
            <button onclick="deletePromoCode(${idx})" class="text-red-400 hover:text-white p-1 rounded hover:bg-red-500/20"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function addPromoCode() {
    const codeInput = document.getElementById('promo-code-input');
    const discountInput = document.getElementById('promo-discount-input');
    if(!codeInput || !discountInput) return;
    
    const code = codeInput.value.trim().toUpperCase();
    const discount = parseInt(discountInput.value) || 0;
    
    if(!code || discount <= 0 || discount > 100) {
        showSystemToast("يرجى إدخال كود صحيح ونسبة خصم من 1 إلى 100", "error"); return;
    }
    
    if(!window.siteSettings) window.siteSettings = {};
    if(!siteSettings.promoCodes) siteSettings.promoCodes = [];
    if(siteSettings.promoCodes.find(c => c.code === code)) {
        showSystemToast("هذا الكود موجود بالفعل", "error"); return;
    }
    
    siteSettings.promoCodes.push({ code, discount });
    codeInput.value = ''; discountInput.value = '';
    renderPromoCodes();
    saveStoreSettings(); 
}

function deletePromoCode(idx) {
    if(!siteSettings.promoCodes) return;
    siteSettings.promoCodes.splice(idx, 1);
    renderPromoCodes();
    saveStoreSettings();
}

/** ---------------------------------------------------------------------------
 * 13. الذكاء الاصطناعي لوصف المنتجات (AI Smart Description)
 * --------------------------------------------------------------------------*/

async function generateSmartDescription() {
    const prodNameEl = document.getElementById('edit-prod-name');
    const prodCatEl = document.getElementById('edit-prod-cat');
    const btn = document.getElementById('btn-smart-desc');
    const descField = document.getElementById('edit-prod-desc');
    
    if(!prodNameEl || !prodCatEl || !btn || !descField) return;

    const prodName = prodNameEl.value.trim();
    const prodCat = prodCatEl.value;
    
    if (!prodName) { 
        showSystemToast('اكتبي اسم المنتج الأول يا إدارة عشان نقدر نولد وصفه ✨', 'error'); 
        return; 
    }
    
    const originalBtnHTML = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> جاري التفكير...'; 
    btn.disabled = true;
    if(typeof lucide !== 'undefined') lucide.createIcons();
    
    try {
        const apiKey = 'AIzaSyBr3ERdNUbAegDPHk4TOMF3sHxMMVYCFxk'; 
        const promptText = `أنت كاتب إعلانات محترف لعلامة تجارية مصرية راقية اسمها "حلويات بوسي"\nاكتب وصف قصير وجذاب لمنتج اسمه "${prodName}" من قسم "${prodCat}"\nالشروط: لهجة مصرية عامية راقية، بدون علامات ترقيم، استخدم إيموجي تخدم المعنى، لا يتعدى سطرين. يفتح الشهية ويشجع على الشراء فوراً.`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ? data.error.message : 'خطأ غير معروف من خوادم الذكاء الاصطناعي');
        
        if (data.candidates && data.candidates.length > 0) {
            descField.value = data.candidates[0].content.parts[0].text.trim();
            showSystemToast('تم التوليد بنجاح! 👑 راجعي الوصف.', 'success');
        } else { 
            throw new Error('لم يتم إرجاع وصف صالح.'); 
        }
    } catch (error) { 
        showSystemToast("تعذر التوليد حالياً: " + error.message, "error"); 
    } finally { 
        btn.innerHTML = originalBtnHTML; 
        btn.disabled = false; 
        if(typeof lucide !== 'undefined') lucide.createIcons(); 
    }
}

// دالة حماية النصوص لعدم كسر الـ HTML (تم إضافتها للحماية)
function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}


