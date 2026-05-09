function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>'\"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', \"'\": '&#39;', '\"': '&quot;' }[tag] || tag));
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
    } 
    else if(type === 'error') { 
        iconEl.setAttribute('data-lucide', 'alert-circle'); 
        iconEl.className = "w-5 h-5 shrink-0 text-red-500"; 
    } 
    else { 
        iconEl.setAttribute('data-lucide', 'info'); 
        iconEl.className = "w-5 h-5 shrink-0 text-[#ff91a4]"; 
    }
    
    if(window.lucide) lucide.createIcons();
    toast.classList.remove('hidden'); 
    toast.classList.add('animate-fade-in');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

// 👑 دمج أساليب التنقل بين علامات التبويب لضمان التوافق مع V19.0 السيادي
function showAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById(`admin-${tabId}`);
    if(target) target.classList.remove('hidden');

    document.querySelectorAll('.main-nav-btn').forEach(b => {
        b.classList.remove('active-tab');
        if(b.getAttribute('onclick')?.includes(`'${tabId}'`)) b.classList.add('active-tab');
    });

    if(tabId === 'overview') {
        if(typeof renderAdminOverview === 'function') renderAdminOverview();
        if(typeof initAdminCharts === 'function') initAdminCharts();
        if(typeof renderHomepageSelection === 'function') renderHomepageSelection();
    }
    if(tabId === 'catalog') {
        if(typeof renderAdminCatalogTabs === 'function') renderAdminCatalogTabs();
        if(typeof renderAdminMenu === 'function') renderAdminMenu('');
        if(typeof renderAdminCatalogGridUI === 'function') renderAdminCatalogGridUI();
    }
    if(tabId === 'orders') {
        if(typeof renderAdminOrderFilters === 'function') renderAdminOrderFilters();
        if(typeof renderAdminOrders === 'function') renderAdminOrders();
    }
    if(tabId === 'settings') {
        if(typeof fillAdminSettingsForm === 'function') fillAdminSettingsForm();
        if(typeof renderAdminCategories === 'function') renderAdminCategories();
        if(typeof initAdminPromoCodes === 'function') initAdminPromoCodes();
    }
    if(tabId === 'shipping') {
        if(typeof renderAdminShipping === 'function') renderAdminShipping();
    }
    if(tabId === 'gallery') {
        if(typeof renderAdminGalleryGridUI === 'function') renderAdminGalleryGridUI();
    }

    if(window.lucide) lucide.createIcons();
    const scrollArea = document.getElementById('main-scroll-area');
    if(scrollArea) scrollArea.scrollTop = 0;
}

window.renderAdminOverview = function() {
    const totalOrdersEl = document.getElementById('stat-total-orders');
    const totalSalesEl = document.getElementById('stat-total-sales');
    const pendingOrdersEl = document.getElementById('stat-pending-orders');
    
    if(!totalOrdersEl || !totalSalesEl || !pendingOrdersEl) return;

    const totalOrders = globalOrders.length;
    const pendingOrders = globalOrders.filter(o => o.status === 'pending' || !o.status).length;
    const completedSales = globalOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);

    totalOrdersEl.textContent = totalOrders;
    totalSalesEl.textContent = completedSales.toLocaleString('ar-EG') + ' ج.م';
    pendingOrdersEl.textContent = pendingOrders;

    // تحديث قائمة الطلبات السريعة في نظرة عامة
    const recentContainer = document.getElementById('recent-orders-list');
    if(recentContainer) {
        const recent = [...globalOrders].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
        if(recent.length === 0) {
            recentContainer.innerHTML = '<p class="text-xs text-slate-500 font-bold text-center py-4">لا توجد طلبات حديثة</p>';
        } else {
            recentContainer.innerHTML = recent.map(o => `
                <div class="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                    <div class="flex flex-col">
                        <span class="text-xs font-black text-white">${escapeHTML(o.name || 'عميل')}</span>
                        <span class="text-[10px] text-slate-400 font-mono">${(o.id || '').substring(0,8)}</span>
                    </div>
                    <div class="text-right">
                        <span class="block text-xs font-black text-[#ff91a4]">${o.total || 0} ج</span>
                        <span class="text-[9px] font-bold text-slate-500">${o.status === 'pending' ? 'مراجعة' : 'مكتمل'}</span>
                    </div>
                </div>
            `).join('');
        }
    }
};

window.updateAdminDashboardStatsUI = function() {
    window.renderAdminOverview();
};

window.openConfirmModal = function(title, message, callback) {
    const modal = document.getElementById('admin-confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-body');
    if(!modal || !titleEl || !msgEl) return;

    titleEl.textContent = title;
    msgEl.textContent = message;
    confirmActionCallback = callback;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
};

window.closeConfirmModal = function() {
    const modal = document.getElementById('admin-confirm-modal');
    if(modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); confirmActionCallback = null; }, 300);
    }
};

window.executeConfirmedAction = function() {
    if(typeof confirmActionCallback === 'function') confirmActionCallback();
    window.closeConfirmModal();
};

window.initAdminCharts = function() {
    const canvas = document.getElementById('admin-sales-chart');
    if(!canvas) return;

    const last7Days = [];
    const salesData = [0, 0, 0, 0, 0, 0, 0];
    const dateOptions = { month: 'short', day: 'numeric' };

    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toLocaleDateString('ar-EG', dateOptions));
    }

    globalOrders.filter(o => o.status === 'completed' && o.timestamp).forEach(o => {
        const orderDate = new Date(o.timestamp).setHours(0,0,0,0);
        for(let i=0; i<7; i++) {
            const checkDate = new Date();
            checkDate.setDate(checkDate.getDate() - (6-i));
            if(orderDate === checkDate.setHours(0,0,0,0)) {
                salesData[i] += (o.total || 0);
            }
        }
    });

    if(salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(canvas, {
        type: 'line', 
        data: { 
            labels: last7Days, 
            datasets: [{ 
                label: 'المبيعات (ج.م)', 
                data: salesData, 
                borderColor: '#ff91a4', 
                backgroundColor: 'rgba(255, 145, 164, 0.1)', 
                borderWidth: 3, 
                tension: 0.4, 
                fill: true, 
                pointBackgroundColor: '#101726', 
                pointBorderColor: '#ff91a4', 
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
};

document.addEventListener('DOMContentLoaded', () => {
    if(window.lucide) lucide.createIcons();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('admin-current-date');
    if(dateEl) dateEl.textContent = new Date().toLocaleDateString('ar-EG', dateOptions);
    
    // ربط مستمع البحث الفوري للكتالوج داخل اللوحة
    const searchCatalogInput = document.getElementById('admin-search-catalog');
    if(searchCatalogInput) {
        searchCatalogInput.addEventListener('input', (e) => {
            if(typeof renderAdminMenu === 'function') renderAdminMenu(e.target.value);
            if(typeof renderAdminCatalogGridUI === 'function') renderAdminCatalogGridUI();
        });
    }
});
