/**
 * ============================================================================
 * 👑 BoseSweets Sovereign Admin Engine | المحرك الإداري السيادي
 * ============================================================================
 * الإصدار: V3.0
 * الوظيفة: إدارة واجهة التحكم، مزامنة البيانات السحابية، ورصد الأخطاء المركزية.
 */

import boseConfig from './core-engine.js';

// ============================================================================
// 1. نظام الرصد العميق (BoseMonitor V2.0)
// ============================================================================
window.BoseMonitor = {
    report: function(error, source, line, functionName) {
        const errorData = {
            message: error.message || String(error),
            source: source,
            line: line,
            function: functionName,
            time: new Date().toLocaleString('ar-EG')
        };
        console.warn(`%c[درع حلويات بوسي]%c تم رصد تدخل أو خطأ في: ${functionName}`, "color: #ff91a4; font-weight: bold;", "color: inherit;");
        console.error("تفاصيل:", errorData);
        // سيتم لاحقاً إرسال هذا التقرير لقاعدة البيانات
    }
};

// ============================================================================
// 2. محرك التنقل الديناميكي (SPA Navigation)
// ============================================================================
class AdminRouter {
    constructor() {
        this.navItems = document.querySelectorAll('.admin-nav-item');
        this.contentArea = document.getElementById('admin-content-area');
        this.pageTitle = document.getElementById('admin-page-title');
        
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
    }

    switchView(viewId, activeNavItem) {
        try {
            // تحديث حالة القائمة الجانبية
            this.navItems.forEach(nav => nav.classList.remove('active'));
            activeNavItem.classList.add('active');

            // تحديث عنوان الصفحة
            this.pageTitle.innerText = activeNavItem.innerText.trim();

            // تبديل المحتوى (سيتم استدعاء دوال البناء لكل قسم هنا)
            this.contentArea.style.opacity = 0;
            
            setTimeout(() => {
                if (viewId === 'overview') {
                    this.renderOverview();
                } else if (viewId === 'products') {
                    this.renderCatalogManager();
                } else if (viewId === 'orders') {
                    this.renderOrdersManager();
                } else {
                    this.renderUnderConstruction(activeNavItem.innerText);
                }
                this.contentArea.style.opacity = 1;
            }, 300);

        } catch (error) {
            window.BoseMonitor.report(error, 'admin-logic.js', null, 'switchView');
        }
    }

    // بناء واجهة النظرة العامة
    renderOverview() {
        this.contentArea.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-bottom: 40px;">
                <div class="stat-card">
                    <span class="stat-title">طلبات اليوم</span>
                    <span class="stat-value" id="stat-today-orders">0</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">المنتجات النشطة</span>
                    <span class="stat-value" id="stat-active-products">0</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">زيارات اليوم</span>
                    <span class="stat-value">0</span>
                </div>
            </div>
            <div class="admin-panel">
                <h2 style="margin-top: 0; margin-bottom: 20px;">أحدث الطلبات</h2>
                <div style="text-align: center; padding: 40px 0; color: var(--text-muted);">
                    <p style="font-weight: 700;">لا توجد طلبات جديدة حتى الآن.</p>
                </div>
            </div>
        `;
    }

    // بناء واجهة إدارة الكتالوج (Products)
    renderCatalogManager() {
        this.contentArea.innerHTML = `
            <div class="admin-panel" style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 15px; flex-grow: 1; max-width: 500px;">
                    <input type="text" placeholder="ابحث عن منتج..." style="flex-grow: 1; padding: 12px 20px; border: 2px solid rgba(255,145,164,0.2); border-radius: 50px; outline: none;">
                    <button class="btn-primary" style="padding: 12px 25px;"><i data-lucide="search" style="width: 18px;"></i></button>
                </div>
                <button class="btn-primary" style="display: flex; gap: 10px; align-items: center;">
                    <i data-lucide="plus"></i> إضافة منتج جديد
                </button>
            </div>
            
            <div class="admin-panel" style="padding: 0; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; text-align: right;">
                    <thead style="background: rgba(255,145,164,0.05); border-bottom: 2px solid rgba(255,145,164,0.1);">
                        <tr>
                            <th style="padding: 20px; color: var(--text-muted);">المنتج</th>
                            <th style="padding: 20px; color: var(--text-muted);">القسم</th>
                            <th style="padding: 20px; color: var(--text-muted);">السعر</th>
                            <th style="padding: 20px; color: var(--text-muted);">الحالة</th>
                            <th style="padding: 20px; color: var(--text-muted); text-align: center;">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="admin-catalog-list">
                        <tr style="border-bottom: 1px solid rgba(255,145,164,0.1); transition: background 0.3s;">
                            <td style="padding: 20px; font-weight: 700;">ديسباسيتو نوتيلا</td>
                            <td style="padding: 20px;">الديسباسيتو</td>
                            <td style="padding: 20px; color: var(--primary-pink); font-weight: 700;">66 ج.م</td>
                            <td style="padding: 20px;"><span style="background: #e8f5e9; color: #2e7d32; padding: 5px 12px; border-radius: 50px; font-size: 0.85rem; font-weight: 700;">متاح</span></td>
                            <td style="padding: 20px; text-align: center;">
                                <button style="background: none; border: none; color: var(--primary-pink); cursor: pointer; margin-left: 15px;"><i data-lucide="edit-3"></i></button>
                                <button style="background: none; border: none; color: #d32f2f; cursor: pointer;"><i data-lucide="trash-2"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        lucide.createIcons();
    }

    // بناء واجهة إدارة الطلبات
    renderOrdersManager() {
        this.contentArea.innerHTML = `
            <div class="admin-panel">
                <div style="display: flex; gap: 15px; margin-bottom: 30px; border-bottom: 2px solid rgba(255,145,164,0.1); padding-bottom: 15px;">
                    <button style="background:none; border:none; color:var(--primary-pink); font-weight:700; font-size:1.1rem; border-bottom:3px solid var(--primary-pink); padding-bottom:10px;">الطلبات الجديدة</button>
                    <button style="background:none; border:none; color:var(--text-muted); font-weight:700; font-size:1.1rem; padding-bottom:10px;">المكتملة</button>
                </div>
                <div style="text-align: center; padding: 60px 0; color: var(--text-muted);">
                    <i data-lucide="check-circle" style="width: 48px; height: 48px; color: #2e7d32; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p style="font-weight: 700; font-size: 1.1rem;">تم إنجاز كافة الطلبات. لا توجد طلبات معلقة.</p>
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    // شاشة بديلة للأقسام قيد التطوير
    renderUnderConstruction(title) {
        this.contentArea.innerHTML = `
            <div class="admin-panel" style="text-align: center; padding: 100px 20px;">
                <i data-lucide="settings-2" style="width: 64px; height: 64px; color: rgba(255,145,164,0.3); margin-bottom: 20px;"></i>
                <h2 style="margin-bottom: 10px;">قسم ${title}</h2>
                <p style="color: var(--text-muted);">هذا القسم قيد التجهيز الهندسي حالياً وسيتم تفعيله قريباً.</p>
            </div>
        `;
        lucide.createIcons();
    }
}

// ============================================================================
// التشغيل عند جاهزية الصفحة
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // تفعيل المحرك
    window.BoseAdmin = new AdminRouter();
    
    // يجب ربط الملف في أسفل admin.html
    // <script type="module" src="admin-logic.js"></script>
});