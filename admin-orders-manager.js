/**
 * ============================================================================
 * 👑 محرك إدارة الطلبات السيادي | Admin Orders Engine (V28.1)
 * ============================================================================
 * الإدارة المرجعية: حلويات بوسي
 * الوظيفة: إدارة مسار التجهيز، التنظيم اللحظي للطلبات، وتوثيق حالات التسليم.
 * التحديث: الربط الكامل مع (admin-database) وإلغاء التكرار البرمجي للـ Firebase.
 */

import adminDB from './admin-database.js';

// ============================================================================
// 🛒 1. محرك تحديث مسار التجهيز (Status Master)
// ============================================================================
window.updateOrderStatus = async function(orderId, newStatus) {
    const statusText = newStatus === 'مكتمل' ? 'اكتمال التجهيز والتسليم' : 'قيد المعالجة';
    const message = `هل أنت متأكد من اعتماد قرار "${statusText}" للطلب رقم #${orderId.slice(-6).toUpperCase()}؟`;

    // استخدام نافذة القرار السيادي الموحدة
    if (typeof window.openConfirmModal === 'function') {
        window.openConfirmModal("قرار إداري: تحديث مسار الطلب", message, async () => {
            try {
                // تنفيذ التحديث عبر الذراع السحابي
                await adminDB.updateOrderStatusCloud(orderId, newStatus);
                
                window.showSystemToast(`قرار نظام: تم توثيق حالة الطلب كـ (${newStatus}) بنجاح.`, "success");
                
                // إرسال نبضة تحديث سيادية لضمان مزامنة كافة الأجهزة
                if (typeof window.triggerSovereignSync === 'function') {
                    window.triggerSovereignSync();
                }
            } catch (error) {
                window.AdminErrorTracker.report(error, 'updateOrderStatus');
                window.showSystemToast("فشل في مسار التحديث السحابي. يرجى مراجعة الصندوق الأسود.", "error");
            }
        });
    }
};

// ============================================================================
// 📊 2. محرك الرسم البصري للطلبات (UI Rendering Engine)
// ============================================================================
window.renderAdminOrders = function(activeTab = 'جديد') {
    const contentArea = document.getElementById('admin-content-area');
    if (!contentArea) return;

    // رسم الهيكل التنظيمي لقسم الطلبات (بصمة الإدارة العليا)
    contentArea.innerHTML = `
        <div class="admin-panel" style="animation: fadeIn 0.4s ease-out;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px; border-bottom: 2px solid rgba(255,145,164,0.1); padding-bottom: 20px;">
                <div style="display: flex; gap: 25px;">
                    <button onclick="window.renderAdminOrders('جديد')" 
                            style="background:none; border:none; cursor:pointer; color:${activeTab === 'جديد' ? 'var(--primary-pink)' : 'var(--text-muted)'}; font-weight:700; font-size:1.2rem; position:relative; padding-bottom:15px; transition: all 0.3s;">
                        الطلبات الواردة
                        ${activeTab === 'جديد' ? '<div style="position:absolute; bottom:-2px; left:0; width:100%; height:4px; background:var(--primary-pink); border-radius:10px;"></div>' : ''}
                    </button>
                    
                    <button onclick="window.renderAdminOrders('مكتمل')" 
                            style="background:none; border:none; cursor:pointer; color:${activeTab === 'مكتمل' ? 'var(--primary-pink)' : 'var(--text-muted)'}; font-weight:700; font-size:1.2rem; position:relative; padding-bottom:15px; transition: all 0.3s;">
                        الأرشيف المكتمل
                        ${activeTab === 'مكتمل' ? '<div style="position:absolute; bottom:-2px; left:0; width:100%; height:4px; background:var(--primary-pink); border-radius:10px;"></div>' : ''}
                    </button>
                </div>
                <div style="background: rgba(255,145,164,0.05); padding: 8px 15px; border-radius: 10px; border: 1px solid rgba(255,145,164,0.1);">
                    <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 700;">إجمالي الحالات: </span>
                    <span style="color: var(--primary-pink); font-weight: 800;" id="order-count-display">...</span>
                </div>
            </div>
            
            <div id="orders-list-container" style="display: grid; grid-template-columns: 1fr; gap: 25px;">
                <div style="text-align: center; padding: 80px 0;">
                    <i data-lucide="loader" class="spin-animation" style="width: 45px; height: 45px; color: var(--primary-pink); margin-bottom: 15px;"></i>
                    <p style="font-weight: 700; font-size: 1.1rem; color: var(--text-muted);">جاري استدعاء سجلات السحابة السيادية...</p>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();

    // الاعتماد على الذاكرة العالمية (window.globalOrders) التي يحدثها admin-logic لحظياً
    const filteredOrders = window.globalOrders.filter(o => {
        if (activeTab === 'جديد') return o.status === 'pending' || !o.status || o.status === 'جديد';
        return o.status === 'مكتمل' || o.status === 'completed';
    });

    document.getElementById('order-count-display').innerText = filteredOrders.length;
    const container = document.getElementById('orders-list-container');

    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 100px 0; background: rgba(255,145,164,0.02); border-radius: 20px; border: 2px dashed rgba(255,145,164,0.1);">
                <i data-lucide="${activeTab === 'جديد' ? 'inbox' : 'archive'}" style="width: 60px; height: 60px; color: rgba(255,145,164,0.3); margin-bottom: 20px;"></i>
                <p style="font-weight: 700; font-size: 1.3rem; color: var(--text-muted);">قسم "${activeTab === 'جديد' ? 'الواردة' : 'المكتملة'}" لا يحتوي على سجلات حالياً.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    // بناء مصفوفة الكروت الاحترافية
    let html = '';
    filteredOrders.forEach(order => {
        let itemsHtml = '';
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                itemsHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <span style="font-weight: 700; color: var(--text-main); font-size: 1rem;">• ${item.name}</span>
                        <span style="background: rgba(255,145,164,0.1); color: var(--primary-pink); padding: 2px 10px; border-radius: 15px; font-weight: 800; font-size: 0.9rem;">×${item.quantity}</span>
                    </div>`;
            });
        }

        const actionSection = activeTab === 'جديد' 
            ? `<button onclick="window.updateOrderStatus('${order.id}', 'مكتمل')" class="btn-primary" style="width: 100%; padding: 15px; font-size: 1.1rem; border-radius: 14px; font-weight: 700; margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <i data-lucide="shield-check" style="width: 20px;"></i> اعتماد اكتمال التجهيز
               </button>`
            : `<div style="width: 100%; padding: 15px; background: rgba(46, 125, 50, 0.05); color: #2e7d32; border: 1px solid rgba(46, 125, 50, 0.2); border-radius: 14px; font-weight: 800; text-align: center; margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <i data-lucide="check-circle" style="width: 20px;"></i> تم التسليم والتوثيق سيادياً
               </div>`;

        html += `
            <div class="stat-card" style="display: flex; flex-direction: column; padding: 30px; border: 1px solid rgba(255,145,164,0.15); box-shadow: 0 10px 25px -5px rgba(255,145,164,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px;">
                    <div>
                        <span style="background: var(--primary-pink); color: white; padding: 5px 15px; border-radius: 50px; font-size: 0.85rem; font-weight: 800; letter-spacing: 1px;">طلب #${order.id.slice(-6).toUpperCase()}</span>
                        <h3 style="margin: 15px 0 5px; color: var(--text-main); font-size: 1.4rem;">${order.customerName || 'عميل مجهول'}</h3>
                        <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.95rem;">
                            <i data-lucide="clock" style="width: 16px;"></i>
                            <span>${order.timestamp ? new Date(order.timestamp).toLocaleString('ar-EG') : 'توقيت غير موثق'}</span>
                        </div>
                    </div>
                    <div style="text-align: left;">
                        <span style="color: var(--text-muted); font-size: 0.9rem; display: block; margin-bottom: 5px;">إجمالي القيمة المالية</span>
                        <span style="color: var(--primary-pink); font-size: 1.8rem; font-weight: 900;">${order.total || 0} <small style="font-size: 0.9rem;">ج.م</small></span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; background: #fafafa; padding: 20px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #f0f0f0;">
                    <div>
                        <label style="color: var(--text-muted); font-size: 0.85rem; display: block; margin-bottom: 5px;">رقم التواصل السيادي</label>
                        <a href="tel:${order.phone}" style="font-weight: 800; color: var(--text-main); text-decoration: none; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="phone" style="width: 18px; color: #25D366;"></i>
                            <span style="direction: ltr;">${order.phone || 'غير متاح'}</span>
                        </a>
                    </div>
                    <div>
                        <label style="color: var(--text-muted); font-size: 0.85rem; display: block; margin-bottom: 5px;">طريقة الاستلام</label>
                        <span style="font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="map-pin" style="width: 18px; color: var(--primary-pink);"></i>
                            ${order.deliveryMethod === 'delivery' ? 'توصيل للمقر' : 'استلام من الفرع (الكفاح)'}
                        </span>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label style="color: var(--text-muted); font-size: 0.85rem; display: block; margin-bottom: 5px;">العنوان التفصيلي / ملاحظات الإدارة</label>
                        <span style="font-weight: 700; color: var(--text-main); line-height: 1.5;">${order.address || order.deliveryDetails || 'لا توجد ملاحظات إضافية.'}</span>
                    </div>
                </div>

                <div style="background: white; border: 1px solid rgba(255,145,164,0.1); border-radius: 16px; padding: 20px;">
                    <h4 style="margin: 0 0 15px; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; gap: 10px;">
                        <i data-lucide="shopping-bag" style="width: 20px; color: var(--primary-pink);"></i>
                        قائمة المحتويات المطلوبة
                    </h4>
                    ${itemsHtml}
                </div>

                ${actionSection}
            </div>
        `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
};

// ============================================================================
// 🔌 3. الإقلاع والربط (Bootloader)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const ordersNavBtn = document.getElementById('nav-orders');
    if (ordersNavBtn) {
        ordersNavBtn.addEventListener('click', () => {
            // انتظار تهيئة الـ SPA ثم تفعيل الرندر
            setTimeout(() => {
                window.renderAdminOrders('جديد');
            }, 300);
        });
    }
});
