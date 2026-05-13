/**
 * ============================================================================
 * 👑 BoseSweets Admin UI Engine (V20.0 - Sovereign Dashboard Edition)
 * ============================================================================
 * محرك رندر الواجهة الإدارية - حلويات بوسي
 * تم هندسة هذا الملف لتقديم أعلى أداء إداري، تحليل لحظي للبيانات، 
 * وتأمين نطاق الدوال (Global Scope) لضمان الاستقرار التام للنظام.
 * 🛡️ التحديث الأمني الجديد: تم زراعة مستشعر BoseMonitor لتأمين التفاعلات والملاحة.
 */

// ==========================================
// 🛠️ أدوات النظام الأساسية (System Utilities)
// ==========================================

window.escapeHTML = function(str) {
    try {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, 'escapeHTML');
        return '';
    }
};

window.showSystemToast = function(message, type = 'info') {
    try {
        const toast = document.getElementById('system-toast');
        const msgEl = document.getElementById('toast-message');
        const iconEl = document.getElementById('toast-icon');
        if(!toast || !msgEl || !iconEl) return;

        msgEl.textContent = message;
        
        // تطبيق الهوية البصرية السيادية على الإشعارات
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
        
        // إعادة تعيين المؤقت لضمان عدم تداخل الإشعارات
        if(window.toastTimeout) clearTimeout(window.toastTimeout);
        window.toastTimeout = setTimeout(() => { 
            toast.classList.remove('animate-fade-in');
            toast.classList.add('hidden'); 
        }, 3000);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, 'showSystemToast');
    }
};

window.unfreezeAdminUI = function() {
    try {
        const loader = document.getElementById('admin-boot-loader');
        if(loader) {
            loader.classList.add('opacity-0');
            setTimeout(() => loader.classList.add('hidden'), 300);
        }
        document.body.style.overflow = 'auto';
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, 'unfreezeAdminUI');
    }
};

// ==========================================
// 🧭 محرك التنقل السيادي (Sovereign Navigation Engine)
// ==========================================

window.showAdminTab = function(tabId) {
    try {
        // 1. إخفاء كافة الشاشات
        document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.add('hidden'));
        
        // 2. تفعيل الشاشة المطلوبة (دعم للمعرفات القديمة والحديثة)
        const target = document.getElementById(`admin-${tabId}`) || document.getElementById(`tab-${tabId}`);
        if(target) target.classList.remove('hidden');

        // 3. إعادة ضبط كافة الأزرار (دعم للكلاسات القديمة والحديثة)
        document.querySelectorAll('.main-nav-btn, .admin-nav-btn').forEach(b => {
            b.classList.remove('active-tab', 'active', 'text-[#ff91a4]', 'bg-[#ff91a4]/10');
            // التحقق الذكي من الزر النشط
            if(b.getAttribute('onclick')?.includes(`'${tabId}'`)) {
                b.classList.add('active-tab', 'active', 'text-[#ff91a4]', 'bg-[#ff91a4]/10');
            }
        });

        // 4. تشغيل بروتوكولات الرندر الخاصة بكل قسم بقرار مهني
        if(tabId === 'overview') {
            if(typeof window.renderAdminOverview === 'function') window.renderAdminOverview();
            if(typeof window.initAdminCharts === 'function') window.initAdminCharts();
            if(typeof window.renderHomepageSelection === 'function') window.renderHomepageSelection();
        }
        if(tabId === 'catalog') {
            if(typeof window.renderAdminCatalogTabs === 'function') window.renderAdminCatalogTabs();
            const currentSearch = document.getElementById('admin-search-catalog')?.value || '';
            if(typeof window.renderAdminMenu === 'function') window.renderAdminMenu(currentSearch);
            if(typeof window.renderAdminCatalogGridUI === 'function') window.renderAdminCatalogGridUI();
        }
        if(tabId === 'orders') {
            if(typeof window.renderAdminOrderFilters === 'function') window.renderAdminOrderFilters();
            if(typeof window.renderAdminOrders === 'function') window.renderAdminOrders(); // يدعم الجدول والكروت
            if(typeof window.renderAdminOrdersList === 'function') window.renderAdminOrdersList(); // للدعم المزدوج
        }
        if(tabId === 'settings') {
            if(typeof window.fillAdminSettingsForm === 'function') window.fillAdminSettingsForm();
            if(typeof window.renderAdminCategories === 'function') window.renderAdminCategories();
            if(typeof window.initAdminPromoCodes === 'function') window.initAdminPromoCodes();
        }
        if(tabId === 'shipping') {
            if(typeof window.renderAdminShipping === 'function') window.renderAdminShipping();
        }
        if(tabId === 'gallery') {
            if(typeof window.renderAdminGalleryGridUI === 'function') window.renderAdminGalleryGridUI();
        }

        if(window.lucide) lucide.createIcons();
        
        // رفع مستوى التمرير لأعلى الشاشة
        const scrollArea = document.getElementById('main-scroll-area');
        if(scrollArea) scrollArea.scrollTop = 0;
        else window.scrollTo(0, 0);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, `showAdminTab (${tabId})`);
    }
};

// ==========================================
// 📊 لوحة القيادة والتحليلات (Dashboard & Analytics)
// ==========================================

window.updateAdminDashboardStatsUI = function() {
    try {
        window.renderAdminOverview();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, 'updateAdminDashboardStatsUI');
    }
};

window.renderAdminOverview = function() {
    try {
        const ordersArray = window.globalOrders || [];
        const catalogArray = window.catalog || [];

        // التحليلات المالية والتشغيلية المباشرة
        const totalOrders = ordersArray.length;
        const pendingOrders = ordersArray.filter(o => (o.status === 'pending' || !o.status)).length;
        const completedSales = ordersArray.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const totalProds = catalogArray.length;

        // تحديث المؤشرات العلوية
        const totalOrdersEl = document.getElementById('stat-total-orders');
        const totalSalesEl = document.getElementById('stat-total-sales');
        const pendingOrdersEl = document.getElementById('stat-pending-orders');
        const prodsEl = document.getElementById('stat-total-products');

        if(totalOrdersEl) totalOrdersEl.textContent = totalOrders;
        if(totalSalesEl) totalSalesEl.textContent = completedSales.toLocaleString('ar-EG') + ' ج.م';
        if(pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
        if(prodsEl) prodsEl.textContent = totalProds;

        // تحديث قائمة الطلبات اللحظية (أحدث 5 تحركات)
        const recentContainer = document.getElementById('recent-orders-list');
        if(recentContainer) {
            const recent = [...ordersArray].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
            if(recent.length === 0) {
                recentContainer.innerHTML = '<p class="text-xs text-slate-500 font-bold text-center py-4 border border-dashed border-slate-700 rounded-xl">لا توجد تحركات مسجلة حالياً</p>';
            } else {
                recentContainer.innerHTML = recent.map(o => {
                    const isPending = (o.status === 'pending' || !o.status);
                    return `
                    <div onclick="if(typeof window.openOrderDetails === 'function') window.openOrderDetails('${o.id || o.orderId}')" class="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-800/80 rounded-xl border border-slate-700/50 cursor-pointer transition-colors group">
                        <div class="flex flex-col">
                            <span class="text-xs font-black text-white group-hover:text-[#ff91a4] transition-colors">${window.escapeHTML(o.name || o.customerName || 'عميل محترم')}</span>
                            <span class="text-[10px] text-slate-400 font-mono mt-0.5">#${(o.id || o.orderId || '').substring(0,8)}</span>
                        </div>
                        <div class="text-right">
                            <span class="block text-xs font-black text-emerald-400">${Number(o.total || 0).toLocaleString()} ج</span>
                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${isPending ? 'bg-yellow-400/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'}">${isPending ? 'مراجعة' : (o.status === 'cancelled' ? 'ملغي' : 'معتمد')}</span>
                        </div>
                    </div>
                `}).join('');
            }
        }

        // رندر المخطط البياني للنمو إذا كان موجوداً ضمن الإضافات
        if(typeof window.renderGrowthChart === 'function') window.renderGrowthChart();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, 'renderAdminOverview');
    }
};

window.initAdminCharts = function() {
    try {
        const canvas = document.getElementById('admin-sales-chart');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        const ordersArray = window.globalOrders || [];
        const last7Days = [];
        const salesData = [0, 0, 0, 0, 0, 0, 0];
        const dateOptions = { month: 'short', day: 'numeric' };

        // تجهيز تواريخ آخر 7 أيام
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toLocaleDateString('ar-EG', dateOptions));
        }

        // استخراج الإيرادات بناءً على الطلبات المكتملة فقط
        ordersArray.filter(o => o.status === 'completed' && o.timestamp).forEach(o => {
            const orderDate = new Date(o.timestamp).setHours(0,0,0,0);
            for(let i=0; i<7; i++) {
                const checkDate = new Date();
                checkDate.setDate(checkDate.getDate() - (6-i));
                if(orderDate === checkDate.setHours(0,0,0,0)) {
                    salesData[i] += (Number(o.total) || 0);
                }
            }
        });

        if(window.salesChartInstance) window.salesChartInstance.destroy();
        
        // التأكد من وجود مكتبة Chart.js قبل التهيئة
        if(typeof Chart !== 'undefined') {
            window.salesChartInstance = new Chart(ctx, {
                type: 'line', 
                data: { 
                    labels: last7Days, 
                    datasets: [{ 
                        label: 'الإيرادات السيادية (ج.م)', 
                        data: salesData, 
                        borderColor: '#ff91a4', 
                        backgroundColor: 'rgba(255, 145, 164, 0.1)', 
                        borderWidth: 3, 
                        tension: 0.4, 
                        fill: true, 
                        pointBackgroundColor: '#101726', 
                        pointBorderColor: '#ff91a4', 
                        pointBorderWidth: 2, 
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false }, tooltip: { bodyFont: { family: 'Cairo' }, titleFont: { family: 'Cairo' } } }, 
                    scales: { 
                        y: { beginAtZero: true, grid: { color: '#1e293b', drawBorder: false }, ticks: { color: '#94a3b8', font: { family: 'Cairo', size: 10 } } }, 
                        x: { grid: { display: false, drawBorder: false }, ticks: { color: '#94a3b8', font: { family: 'Cairo', size: 10 } } } 
                    },
                    interaction: { intersect: false, mode: 'index' }
                }
            });
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, 'initAdminCharts');
    }
};

// ==========================================
// 🛡️ نوافذ القرار الإداري (Confirmation Modals)
// ==========================================

window.confirmActionCallback = null;

window.openConfirmModal = function(title, message, callback) {
    try {
        const modal = document.getElementById('admin-confirm-modal');
        const titleEl = document.getElementById('confirm-modal-title');
        const msgEl = document.getElementById('confirm-modal-body');
        if(!modal || !titleEl || !msgEl) {
            // Fallback في حال عدم وجود المودال في الهيكل
            if(confirm(`${title}\n\n${message}`)) { if(typeof callback === 'function') callback(); }
            return;
        }

        titleEl.textContent = title;
        msgEl.textContent = message;
        window.confirmActionCallback = callback;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, 'openConfirmModal');
    }
};

window.closeConfirmModal = function() {
    try {
        const modal = document.getElementById('admin-confirm-modal');
        if(modal) {
            modal.classList.add('opacity-0');
            setTimeout(() => { 
                modal.classList.add('hidden'); 
                modal.classList.remove('flex'); 
                window.confirmActionCallback = null; 
            }, 300);
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, 'closeConfirmModal');
    }
};

window.executeConfirmedAction = function() {
    try {
        if(typeof window.confirmActionCallback === 'function') {
            window.confirmActionCallback();
        }
        window.closeConfirmModal();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, 'executeConfirmedAction');
    }
};

// ==========================================
// 🚀 مستمعات تهيئة النظام (Boot Listeners)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        // 1. تفعيل الأيقونات
        if(window.lucide) lucide.createIcons();
        
        // 2. تحديث التاريخ الإداري
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateEl = document.getElementById('admin-current-date');
        if(dateEl) dateEl.textContent = new Date().toLocaleDateString('ar-EG', dateOptions);
        
        // 3. ربط مستمع البحث الفوري للكتالوج داخل اللوحة (دعم مزدوج)
        const searchCatalogInput = document.getElementById('admin-search-catalog');
        if(searchCatalogInput) {
            searchCatalogInput.addEventListener('input', (e) => {
                const term = (e.target.value || '').toLowerCase();
                if(typeof window.renderAdminMenu === 'function') window.renderAdminMenu(term);
                if(typeof window.renderAdminCatalogGridUI === 'function') window.renderAdminCatalogGridUI();
            });
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-ui.js', null, null, 'DOMContentLoaded (Boot Listeners)');
    }
});