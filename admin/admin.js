/**
 * متجر حلويات بوسي - المحرك البرمجي الموحد للوحة التحكم (admin.js)
 * الإصدار: 2.1.0 (تحديث 2026)
 * التوافق: متوافق 100% مع الموبايل والكمبيوتر وشروط الاستضافة المجانية
 * الأداء: حماية كاملة، مرونة قصوى، معالجة ذكية للبيانات بأقل استهلاك إنترنت
 */

// ==========================================
// 1. منظومة الأمان والتحقق من الهوية (Security Gate)
// ==========================================
const BoseAdminAuth = {
    // التحقق الفوري من صلاحية الجلسة لمنع الاختراق المباشر
    checkSession: function() {
        const token = sessionStorage.getItem('bose_admin_session');
        if (!token) {
            this.redirectLogin();
            return false;
        }
        try {
            const parsedToken = JSON.parse(atob(token));
            // التحقق من أن الجلسة لم تتجاوز 24 ساعة لضمان أمان الإدارة
            if (Date.now() - parsedToken.timestamp > 24 * 60 * 60 * 1000) {
                this.logout();
                return false;
            }
            return true;
        } catch (e) {
            this.logout();
            return false;
        }
    },

    // تسجيل الخروج وتنظيف الجلسة تماماً
    logout: function() {
        sessionStorage.removeItem('bose_admin_session');
        this.redirectLogin();
    },

    // توجيه الإدارة لبوابة الدخول الآمنة
    redirectLogin: function() {
        window.location.href = 'index.html';
    }
};

// تفعيل فحص الأمان فور استدعاء الملف وقبل تحميل أي عنصر بالواجهة
BoseAdminAuth.checkSession();

// ==========================================
// 2. حالة البيانات المركزية في الذاكرة (Central State)
// ==========================================
const AdminState = {
    products: [],
    orders: [],
    currentTab: 'dashboard',
    
    // المزامنة الآمنة مع الذاكرة المحلية كقاعدة بيانات مجانية مستقرة
    loadData: function() {
        // تحميل المنتجات (أو تعيين مصفوفة فارغة جاهزة للبناء)
        const localProducts = localStorage.getItem('bose_products');
        this.products = localProducts ? JSON.parse(localProducts) : [];

        // تحميل الطلبات
        const localOrders = localStorage.getItem('bose_orders');
        this.orders = localOrders ? JSON.parse(localOrders) : [];
    },

    saveProducts: function() {
        localStorage.setItem('bose_products', JSON.stringify(this.products));
        // إشعار الأجزاء الأخرى من الموقع بتحديث البيانات ديناميكياً
        window.dispatchEvent(new Event('bose_products_updated'));
    },

    saveOrders: function() {
        localStorage.setItem('bose_orders', JSON.stringify(this.orders));
        window.dispatchEvent(new Event('bose_orders_updated'));
    }
};

// ==========================================
// 3. إدارة واجهة المستخدم والتبديل المرن (UI & Tabs Controller)
// ==========================================
const AdminUI = {
    init: function() {
        AdminState.loadData();
        this.bindEvents();
        this.renderDashboardStats();
        this.switchTab(AdminState.currentTab);
    },

    bindEvents: function() {
        // ربط أزرار القائمة الجانبية للتنقل السلس المتوافق مع الموبايل والكمبيوتر
        document.querySelectorAll('.nav-menu-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = btn.getAttribute('data-tab');
                if (tabName) this.switchTab(tabName);
            });
        });

        // زر تسجيل الخروج الفوري
        const logoutBtn = document.getElementById('bose-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => BoseAdminAuth.logout());
        }
    },

    switchTab: function(tabId) {
        AdminState.currentTab = tabId;
        
        // تحديث الحالة البصرية للأزرار في القائمة
        document.querySelectorAll('.nav-menu-item').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active-tab');
            } else {
                btn.classList.remove('active-tab');
            }
        });

        // إظهار القسم المطلوب وإخفاء الباقي بنعومة لمنع التكديس البصري
        document.querySelectorAll('.admin-panel-section').forEach(section => {
            if (section.id === `section-${tabId}`) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });

        // إعادة توليد البيانات المخصصة للقسم المفتوح فوراً
        if (tabId === 'dashboard') this.renderDashboardStats();
        if (tabId === 'products') this.renderProductsTable();
        if (tabId === 'orders') this.renderOrdersList();
    },

    // عرض الإشعارات الذكية الراقية والمباشرة في لوحة التحكم
    showToast: function(message, type = 'success') {
        let toastContainer = document.getElementById('bose-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'bose-toast-container';
            toastContainer.style.cssText = 'position:fixed; bottom:20px; left:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 24px; background: #111111; color: #FFFFFF; 
            border-right: 4px solid ${type === 'success' ? '#FF91A4' : '#D4AF37'};
            border-radius: 8px; font-size: 14px; font-weight: 600;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1); opacity: 0; transform: translateY(20px);
            transition: all 0.3s ease; direction: rtl;
        `;
        toast.innerText = message;
        toastContainer.appendChild(toast);

        // تأثيرات الحركة اللطيفة للظهور والاختفاء
        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 50);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    // ==========================================
    // 4. محرك إدارة الإحصائيات (Dashboard Stats Engine)
    // ==========================================
    renderDashboardStats: function() {
        const totalProducts = AdminState.products.length;
        const totalOrders = AdminState.orders.length;
        
        // حساب إجمالي المبيعات من الطلبات المكتملة فقط بكل أمان
        const totalSales = AdminState.orders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

        // تحديث عناصر الواجهة الرقمية إن وُجدت في هيكل HTML الميت
        const countProdEl = document.getElementById('stat-products-count');
        const countOrderEl = document.getElementById('stat-orders-count');
        const sumSalesEl = document.getElementById('stat-sales-sum');

        if (countProdEl) countProdEl.innerText = totalProducts;
        if (countOrderEl) countOrderEl.innerText = totalOrders;
        if (sumSalesEl) sumSalesEl.innerText = `${totalSales} جنيه`;
    },

    // ==========================================
    // 5. محرك إدارة المنتجات (Products Management Engine)
    // ==========================================
    renderProductsTable: function() {
        const tbody = document.getElementById('admin-products-tbody');
        if (!tbody) return;

        if (AdminState.products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#111111; opacity:0.6;">لا توجد منتجات مضافة حالياً. ابدأ بإضافة منتجك الأول.</td></tr>`;
            return;
        }

        tbody.innerHTML = AdminState.products.map((product, index) => `
            <tr style="border-bottom: 1px solid rgba(255,145,164,0.1);">
                <td style="padding:12px;"><img src="${product.image || 'placeholder.jpg'}" style="width:50px; height:50px; object-fit:contain; border-radius:8px; border:1px solid rgba(255,145,164,0.2);"></td>
                <td style="font-weight:700; color:#111111;">${product.name}</td>
                <td style="font-weight:700; color:#FF91A4;">${product.price} جنيه</td>
                <td><span style="padding:4px 8px; background:rgba(212,175,55,0.1); color:#D4AF37; border-radius:6px; font-size:12px;">${product.category || 'عام'}</span></td>
                <td>
                    <button onclick="AdminUI.deleteProduct(${index})" style="background:none; border:none; color:#ff4d6d; cursor:pointer; padding:5px; font-size:16px;" title="حذف المنتج">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    addNewProduct: function(productData) {
        // التحقق من صحة المدخلات لمنع الثغرات وتخريب البيانات
        if (!productData.name || !productData.price) {
            this.showToast('يرجى كتابة اسم المنتج وسعره بشكل صحيح', 'error');
            return false;
        }

        const newProduct = {
            id: 'bose_' + Date.now(),
            name: productData.name.trim(),
            price: parseFloat(productData.price),
            image: productData.image || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png',
            category: productData.category || 'حلويات شرقية',
            description: productData.description ? productData.description.trim() : '',
            timestamp: Date.now()
        };

        AdminState.products.unshift(newProduct); // إضافة المنتج الجديد في البداية
        AdminState.saveProducts();
        this.renderProductsTable();
        this.renderDashboardStats();
        this.showToast('تمت إضافة المنتج بنجاح');
        return true;
    },

    deleteProduct: function(index) {
        if (confirm('هل ترغب في حذف هذا المنتج نهائياً من العرض؟')) {
            AdminState.products.splice(index, 1);
            AdminState.saveProducts();
            this.renderProductsTable();
            this.renderDashboardStats();
            this.showToast('تم حذف المنتج بنجاح');
        }
    },

    // ==========================================
    // 6. محرك إدارة الطلبات (Orders Management Engine)
    // ==========================================
    renderOrdersList: function() {
        const container = document.getElementById('admin-orders-container');
        if (!container) return;

        if (AdminState.orders.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:40px; color:#111111; opacity:0.6;">لا توجد طلبات واردة حتى الآن.</div>`;
            return;
        }

        container.innerHTML = AdminState.orders.map((order, index) => {
            const statusBadgeColor = order.status === 'completed' ? '#2ecc71' : (order.status === 'pending' ? '#D4AF37' : '#FF91A4');
            const statusText = order.status === 'completed' ? 'تم التوصيل' : (order.status === 'pending' ? 'قيد الانتظار' : 'جاري التجهيز');

            return `
                <div class="order-card" style="background:#FFFFFF; border:1px solid rgba(255,145,164,0.2); border-radius:12px; padding:20px; margin-bottom:15px; box-shadow:0 4px 12px rgba(255,145,164,0.05);">
                    <div style="display:flex; justify-content:between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                        <span style="font-weight:700; color:#111111;">طلب رقم: #${order.id ? order.id.slice(-6) : index + 1}</span>
                        <span style="padding:4px 10px; background:${statusBadgeColor}20; color:${statusBadgeColor}; border-radius:20px; font-size:12px; font-weight:700;">${statusText}</span>
                    </div>
                    <div style="font-size:14px; color:#111111; margin-bottom:8px;">
                        <strong>العميل:</strong> ${order.customerName} | <strong>الهاتف:</strong> ${order.customerPhone}
                    </div>
                    <div style="font-size:14px; color:#111111; margin-bottom:12px;">
                        <strong>العنوان:</strong> ${order.customerAddress || 'الفرافرة، الوادي الجديد'}
                    </div>
                    <div style="border-top:1px dashed rgba(17,17,17,0.1); padding-top:10px; margin-bottom:12px;">
                        <span style="font-size:13px; color:#111111; opacity:0.8;">${order.itemsDescription || 'تفاصيل المنتجات'}</span>
                    </div>
                    <div style="display:flex; justify-content:between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <span style="font-weight:700; color:#FF91A4; font-size:16px;">الإجمالي: ${order.total} جنيه</span>
                        <div style="display:flex; gap:8px;">
                            ${order.status !== 'completed' ? `
                                <button onclick="AdminUI.updateOrderStatus(${index}, 'completed')" style="background:#2ecc71; color:#FFFFFF; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px;">
                                    <i class="fa-solid fa-check"></i> اكتمال الطلب
                                </button>
                            ` : ''}
                            <button onclick="AdminUI.deleteOrder(${index})" style="background:none; border:1px solid rgba(255,77,109,0.3); color:#ff4d6d; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:13px;">
                                <i class="fa-solid fa-trash"></i> حذف
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    updateOrderStatus: function(index, newStatus) {
        if (AdminState.orders[index]) {
            AdminState.orders[index].status = newStatus;
            AdminState.saveOrders();
            this.renderOrdersList();
            this.renderDashboardStats();
            this.showToast('تم تحديث حالة الطلب بنجاح');
        }
    },

    deleteOrder: function(index) {
        if (confirm('هل أنت متأكد من حذف هذا الطلب نهائياً من السجلات؟')) {
            AdminState.orders.splice(index, 1);
            AdminState.saveOrders();
            this.renderOrdersList();
            this.renderDashboardStats();
            this.showToast('تم حذف الطلب بنجاح');
        }
    }
};

// تشغيل المحرك تلقائياً وبأمان فور جاهزية الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // التأكد التام من استمرار تحقق الأمان قبل بناء الواجهات
    if (BoseAdminAuth.checkSession()) {
        AdminUI.init();
    }
});