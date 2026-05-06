function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function showSystemToast(message, type = 'info') {
    const toast = document.getElementById('system-toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    if(!toast || !msgEl || !iconEl) return;

    msgEl.textContent = message;
    if(type === 'success') { iconEl.setAttribute('data-lucide', 'check-circle'); iconEl.className = "w-5 h-5 shrink-0 text-emerald-500"; } 
    else if(type === 'error') { iconEl.setAttribute('data-lucide', 'alert-circle'); iconEl.className = "w-5 h-5 shrink-0 text-red-500"; } 
    else { iconEl.setAttribute('data-lucide', 'info'); iconEl.className = "w-5 h-5 shrink-0 text-[#ff3377]"; }
    
    if(window.lucide) lucide.createIcons();
    toast.classList.remove('hidden'); toast.classList.add('animate-fade-in');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

// 👑 دمج أساليب التنقل بين علامات التبويب لضمان التوافق مع V19 و V7
window.switchAdminTab = function(tabId) {
    document.querySelectorAll('.admin-tab-content, .admin-panel').forEach(el => { el.classList.remove('block'); el.classList.add('hidden'); });
    const target = document.getElementById('admin-' + tabId) || document.getElementById('panel-' + tabId);
    if(target) { target.classList.remove('hidden'); target.classList.add('block'); }
    
    document.querySelectorAll('.fixed.bottom-0 button, .tab-btn').forEach(btn => {
        if(btn.classList.contains('tab-btn')) btn.classList.remove('active');
        if(!btn.classList.contains('bg-gradient-to-tr') && !btn.classList.contains('tab-btn')) { btn.classList.remove('text-[#ff3377]'); btn.classList.add('text-slate-400'); }
    });
    
    const activeBtn = Array.from(document.querySelectorAll('.fixed.bottom-0 button, .tab-btn')).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`switchAdminTab('${tabId}')`));
    if(activeBtn) {
        if(activeBtn.classList.contains('tab-btn')) activeBtn.classList.add('active');
        else if(!activeBtn.classList.contains('bg-gradient-to-tr')) { activeBtn.classList.remove('text-slate-400'); activeBtn.classList.add('text-[#ff3377]'); }
    }
    
    if (tabId === 'catalog' && typeof renderAdminCatalogGridUI === 'function') renderAdminCatalogGridUI();
    if (tabId === 'gallery' && typeof renderAdminGalleryGridUI === 'function') renderAdminGalleryGridUI();
    if (tabId === 'settings' && typeof fillGlobalSettingsFormFields === 'function') fillGlobalSettingsFormFields();
    
    if (window.lucide) lucide.createIcons();
    
    const scrollArea = document.getElementById('main-scroll-area');
    if(scrollArea) scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
};

function updateAdminDashboardStatsUI() {
    const pCount = document.getElementById('stat-total-products');
    const gCount = document.getElementById('stat-total-gallery');
    const adminStatProducts = document.getElementById('admin-stat-products');
    
    if (pCount) pCount.innerText = catalog.length;
    if (gCount) gCount.innerText = galleryData.length;
    if (adminStatProducts) adminStatProducts.innerText = catalog.length;
}

function openConfirmModal(title, message, callback) {
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    confirmActionCallback = callback;
    const modal = document.getElementById('admin-confirm-modal');
    modal.classList.remove('hidden'); setTimeout(() => modal.classList.remove('opacity-0'), 10);
    document.getElementById('btn-confirm-action').onclick = () => { if(confirmActionCallback) confirmActionCallback(); closeConfirmModal(); };
}

function closeConfirmModal() {
    const modal = document.getElementById('admin-confirm-modal');
    if(modal){ modal.classList.add('opacity-0'); setTimeout(() => modal.classList.add('hidden'), 300); }
}

function renderAdminOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const validOrders = globalOrders.filter(o => o.status !== 'cancelled');
    const monthlyRevenue = validOrders.filter(o => (o.timestamp || 0) >= startOfMonth).reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    
    if(document.getElementById('admin-stat-products')) document.getElementById('admin-stat-products').innerText = catalog ? catalog.length : 0;
    if(document.getElementById('admin-stat-orders')) document.getElementById('admin-stat-orders').innerText = validOrders.length;
    if(document.getElementById('admin-stat-revenue')) document.getElementById('admin-stat-revenue').innerHTML = monthlyRevenue.toLocaleString('ar-EG') + ' <span class=\"text-lg text-slate-400\">ج.م</span>';
    renderQuickRecentOrders();
    executeSafely('HomepageSelection', () => { if(typeof renderHomepageSelection === 'function') renderHomepageSelection(); });
    updateAdminDashboardStatsUI();
}

function renderQuickRecentOrders() {
    const container = document.getElementById('quick-recent-orders');
    if(!container) return;
    if(!globalOrders || globalOrders.length === 0) {
        container.innerHTML = '<p class=\"text-xs text-slate-500 text-center py-4\">لا توجد طلبات حديثة في السجل</p>'; return;
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
            <div onclick=\"openOrderDetails('${o.id}')\" class=\"p-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 flex justify-between items-center cursor-pointer transition-colors active:scale-95\">
                <div>
                    <p class=\"text-sm font-bold text-white tracking-wide\">#${(o.id||'').substring(0,6)}</p>
                    <p class=\"text-[10px] text-slate-400 mt-0.5\"><i data-lucide=\"user\" class=\"w-3 h-3 inline\"></i> ${escapeHTML(o.name || 'عميل')}</p>
                </div>
                <div class=\"flex flex-col items-end gap-1\">
                    <span class=\"text-[10px] ${statusColor} px-2 py-0.5 rounded-md font-bold\">${statusText}</span>
                    <span class=\"text-[9px] text-slate-500 font-mono\" dir=\"ltr\">${timeString}</span>
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
        type: 'line', data: { labels: last7Days, datasets: [{ label: 'المبيعات (ج.م)', data: salesData, borderColor: '#ff3377', backgroundColor: 'rgba(255, 51, 119, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#0f172a', pointBorderColor: '#ff3377', pointBorderWidth: 2, pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Cairo' } } } } }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if(window.lucide) lucide.createIcons();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('admin-current-date');
    if(dateEl) dateEl.textContent = new Date().toLocaleDateString('ar-EG', dateOptions);
    
    // ربط مستمع البحث الفوري للكتالوج داخل اللوحة
    const searchCatalogInput = document.getElementById('admin-search-catalog');
    if(searchCatalogInput) {
        searchCatalogInput.addEventListener('input', () => {
            if(typeof renderAdminCatalogGridUI === 'function') renderAdminCatalogGridUI();
            if(typeof renderAdminMenu === 'function') renderAdminMenu(searchCatalogInput.value);
        });
    }
});
