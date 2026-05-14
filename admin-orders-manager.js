/**
 * ============================================================================
 * 👑 محرك إدارة الطلبات السيادي | Admin Orders Engine
 * ============================================================================
 * الإدارة: حلويات بوسي
 * الوظيفة: جلب الطلبات السحابية، تنظيمها حسب الحالة، وتحديث مسار التجهيز.
 */

import boseConfig from './core-engine.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// تهيئة الاتصال
const app = initializeApp(boseConfig.firebase);
const db = getFirestore(app);

// ============================================================================
// 1. محرك جلب الطلبات (Fetch Engine)
// ============================================================================
export async function fetchOrders(statusFilter = 'جديد') {
    try {
        const ordersRef = collection(db, "orders");
        // جلب الطلبات مرتبة من الأحدث للأقدم حسب الحالة
        const q = query(ordersRef, where("status", "==", statusFilter), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        let orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        return orders;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-orders-manager.js', null, 'fetchOrders');
        return [];
    }
}

// ============================================================================
// 2. تحديث حالة الطلب (Status Updater)
// ============================================================================
window.updateOrderStatus = async function(orderId, newStatus) {
    const isConfirmed = confirm(`تأكيد إداري:\nهل تريد تغيير حالة الطلب إلى "${newStatus}"؟`);
    if (!isConfirmed) return;

    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status: newStatus });
        
        alert(`تم تحديث حالة الطلب إلى: ${newStatus}`);
        // إعادة رسم واجهة الطلبات بعد التحديث
        window.renderAdminOrders('جديد'); 
    } catch (error) {
        alert('حدث خلل أثناء تحديث الحالة. يرجى مراجعة الصندوق الأسود.');
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-orders-manager.js', null, 'updateOrderStatus');
    }
};

// ============================================================================
// 3. محرك الرسم البياني (UI Renderer)
// ============================================================================
window.renderAdminOrders = async function(activeTab = 'جديد') {
    // هذه الدالة ستقوم بحقن الكود داخل الحاوية التي أنشأناها في admin-logic.js
    const contentArea = document.getElementById('admin-content-area');
    if (!contentArea) return;

    // رسم الهيكل الأساسي لصفحة الطلبات مع التبويبات
    contentArea.innerHTML = `
        <div class="admin-panel">
            <div style="display: flex; gap: 15px; margin-bottom: 30px; border-bottom: 2px solid rgba(255,145,164,0.1); padding-bottom: 15px;">
                <button onclick="window.renderAdminOrders('جديد')" style="background:none; border:none; cursor:pointer; color:${activeTab === 'جديد' ? 'var(--primary-pink)' : 'var(--text-muted)'}; font-weight:700; font-size:1.1rem; border-bottom:${activeTab === 'جديد' ? '3px solid var(--primary-pink)' : 'none'}; padding-bottom:10px; transition: all 0.3s;">الطلبات الجديدة</button>
                
                <button onclick="window.renderAdminOrders('مكتمل')" style="background:none; border:none; cursor:pointer; color:${activeTab === 'مكتمل' ? 'var(--primary-pink)' : 'var(--text-muted)'}; font-weight:700; font-size:1.1rem; border-bottom:${activeTab === 'مكتمل' ? '3px solid var(--primary-pink)' : 'none'}; padding-bottom:10px; transition: all 0.3s;">المكتملة</button>
            </div>
            
            <div id="orders-list-container" style="display: flex; flex-direction: column; gap: 20px;">
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i data-lucide="loader" class="spin-animation" style="width: 32px; height: 32px; color: var(--primary-pink); margin-bottom: 10px;"></i>
                    <p style="font-weight: 700;">جاري مزامنة الطلبات من السحابة...</p>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();

    // جلب البيانات
    const ordersListContainer = document.getElementById('orders-list-container');
    const orders = await fetchOrders(activeTab);

    if (orders.length === 0) {
        ordersListContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 0; color: var(--text-muted);">
                <i data-lucide="${activeTab === 'جديد' ? 'inbox' : 'check-circle'}" style="width: 48px; height: 48px; color: rgba(255,145,164,0.5); margin-bottom: 15px;"></i>
                <p style="font-weight: 700; font-size: 1.1rem;">لا توجد طلبات في قسم "${activeTab}".</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // بناء كروت الطلبات
    let html = '';
    orders.forEach(order => {
        let itemsHtml = '';
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                itemsHtml += `<div style="font-size: 0.95rem; color: var(--text-main); margin-bottom: 5px;">- ${item.name} (الكمية: ${item.quantity})</div>`;
            });
        }

        const actionButton = activeTab === 'جديد' 
            ? `<button onclick="window.updateOrderStatus('${order.id}', 'مكتمل')" class="btn-primary" style="padding: 8px 20px; font-size: 0.95rem; border-radius: 8px;"><i data-lucide="check" style="width: 16px; margin-left: 5px;"></i> إنهاء الطلب</button>`
            : `<span style="color: #2e7d32; font-weight: 700; display: flex; align-items: center; gap: 5px;"><i data-lucide="check-circle" style="width: 18px;"></i> تم التسليم</span>`;

        html += `
            <div style="border: 2px solid rgba(255,145,164,0.15); border-radius: 12px; padding: 25px; background: var(--surface-light); display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
                <div style="flex: 1; min-width: 250px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <h3 style="margin: 0; color: var(--primary-pink); font-size: 1.2rem;">طلب #${order.id.slice(-6).toUpperCase()}</h3>
                        <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 700;">${order.createdAt ? new Date(order.createdAt).toLocaleString('ar-EG') : 'وقت غير معروف'}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; background: var(--bg-white); padding: 15px; border-radius: 8px; border: 1px dashed rgba(0,0,0,0.1);">
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.85rem; display: block;">اسم العميل</span>
                            <span style="font-weight: 700;">${order.customerName || 'غير مسجل'}</span>
                        </div>
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.85rem; display: block;">رقم التواصل</span>
                            <span style="font-weight: 700; direction: ltr; display: inline-block;">${order.phone || 'غير مسجل'}</span>
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <span style="color: var(--text-muted); font-size: 0.85rem; display: block;">تفاصيل الاستلام</span>
                            <span style="font-weight: 700;">${order.deliveryDetails || 'استلام من الفرع'}</span>
                        </div>
                    </div>

                    <div>
                        <h4 style="font-size: 1rem; margin-bottom: 10px;">المنتجات المطلوبة:</h4>
                        ${itemsHtml}
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; min-width: 150px; height: 100%;">
                    <div style="text-align: left; margin-bottom: 20px;">
                        <span style="color: var(--text-muted); font-size: 0.9rem; display: block;">الإجمالي</span>
                        <span style="color: var(--primary-pink); font-size: 1.5rem; font-weight: 700;">${order.total || 0} ج.م</span>
                    </div>
                    ${actionButton}
                </div>
            </div>
        `;
    });

    ordersListContainer.innerHTML = html;
    lucide.createIcons();
};

// ============================================================================
// 4. ربط المحرك بالقائمة الجانبية
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const ordersNavBtn = document.getElementById('nav-orders');
    if (ordersNavBtn) {
        ordersNavBtn.addEventListener('click', () => {
            // ننتظر التحميل البصري للمحرك الأساسي ثم نفرض رسم واجهة الطلبات الخاصة بنا
            setTimeout(() => {
                window.renderAdminOrders('جديد');
            }, 350);
        });
    }
});