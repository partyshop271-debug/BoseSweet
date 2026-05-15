/**
 * ============================================================================
 * 👑 محرك عرض الكتالوج السيادي | Admin Catalog View Engine (V28.1)
 * ============================================================================
 * الإدارة المرجعية: حلويات بوسي
 * الوظيفة: الاستماع اللحظي للمنتجات، رسم جداول الإدارة، وتفعيل قرارات الحذف والتعديل.
 * التوافق: مرتبط برمجياً بـ (admin-catalog-manager) و (admin-logic).
 */

import { listenToAllProducts, executeDeleteProduct } from './admin-database.js';

let catalogListenerUnsubscribe = null;

// ============================================================================
// 📊 1. دالة البناء والرسم اللحظي (Live Table Renderer)
// ============================================================================
export async function renderCatalogTable() {
    const tableBody = document.getElementById('admin-catalog-list');
    // البحث عن الحاوية البديلة في حال تغير الهيكل برمجياً
    const targetContainer = tableBody || document.querySelector('[data-admin-target="catalog-list"]');
    
    if (!targetContainer) return; 

    // إظهار حالة التحميل الاحترافية (بصمة الإدارة العليا)
    targetContainer.innerHTML = `
        <tr>
            <td colspan="5" style="padding: 60px; text-align: center; color: var(--text-muted);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <i data-lucide="loader-2" class="spin-animation" style="width: 40px; height: 40px; color: var(--primary-pink);"></i>
                    <p style="font-weight: 700; font-size: 1.1rem; letter-spacing: 0.5px;">جاري فتح مسار المزامنة الحية مع السحابة السيادية لـ "حلويات بوسي"...</p>
                </div>
            </td>
        </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // حماية الذاكرة من التكرار (Memory Leak Protection)
    if (catalogListenerUnsubscribe) {
        catalogListenerUnsubscribe();
    }

    try {
        // تفعيل الاستماع اللحظي (onSnapshot)
        catalogListenerUnsubscribe = listenToAllProducts((products) => {
            if (!products || products.length === 0) {
                targetContainer.innerHTML = `
                    <tr>
                        <td colspan="5" style="padding: 80px; text-align: center; color: var(--text-muted);">
                            <i data-lucide="package-search" style="width: 60px; height: 60px; opacity: 0.3; margin-bottom: 20px;"></i>
                            <p style="font-weight: 700; font-size: 1.2rem;">الكتالوج السيادي فارغ حالياً. يرجى البدء بإضافة منتجات جديدة.</p>
                        </td>
                    </tr>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }

            // فرز المنتجات (الأحدث في الإضافة يظهر أولاً)
            const sortedProducts = [...products].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            let html = '';
            sortedProducts.forEach(product => {
                // تحديد الحالة المهنية للمنتج
                const isActive = product.isActive !== false;
                const statusBadge = isActive
                    ? `<span style="background: rgba(46, 125, 50, 0.1); color: #2e7d32; padding: 6px 14px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; border: 1px solid rgba(46, 125, 50, 0.2);">متاح للعرض</span>`
                    : `<span style="background: rgba(198, 40, 40, 0.1); color: #c62828; padding: 6px 14px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; border: 1px solid rgba(198, 40, 40, 0.2);">مخفي حالياً</span>`;

                html += `
                    <tr style="border-bottom: 1px solid rgba(255,145,164,0.08); transition: all 0.3s;" id="row-${product.id}" class="admin-table-row">
                        <td style="padding: 20px;">
                            <div style="display: flex; align-items: center; gap: 18px;">
                                <div style="position: relative;">
                                    <img src="${product.image || product.img || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg'}" 
                                         alt="${product.name}" 
                                         style="width: 55px; height: 55px; border-radius: 12px; object-fit: cover; border: 2px solid rgba(255,145,164,0.15); box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                                    ${product.isBestSeller ? '<div style="position: absolute; -top: 8px; -right: 8px; background: #FFD700; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;" title="الأكثر مبيعاً"></div>' : ''}
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <span style="font-weight: 700; color: var(--text-main); font-size: 1rem;">${product.name}</span>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">ID: ${product.id.substring(0, 8)}...</span>
                                </div>
                            </div>
                        </td>
                        <td style="padding: 20px; font-weight: 600; color: var(--text-muted);">${product.category}</td>
                        <td style="padding: 20px;">
                            <div style="display: flex; flex-direction: column;">
                                <span style="color: var(--primary-pink); font-weight: 800; font-size: 1.1rem;">${product.price} ج.م</span>
                                ${product.oldPrice ? `<span style="text-decoration: line-through; font-size: 0.85rem; color: #999;">${product.oldPrice} ج.م</span>` : ''}
                            </div>
                        </td>
                        <td style="padding: 20px;">${statusBadge}</td>
                        <td style="padding: 20px; text-align: center;">
                            <div style="display: flex; gap: 10px; justify-content: center;">
                                <button onclick="window.initiateProductEdit('${product.id}')" 
                                        style="width: 40px; height: 40px; border-radius: 10px; border: 1px solid rgba(255,145,164,0.2); background: white; color: var(--primary-pink); cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;" 
                                        title="تعديل البيانات"
                                        onmouseover="this.style.background='rgba(255,145,164,0.05)'" 
                                        onmouseout="this.style.background='white'">
                                    <i data-lucide="edit-3" style="width: 18px;"></i>
                                </button>
                                <button onclick="window.initiateProductDelete('${product.id}', '${product.name.replace(/'/g, "\\'")}')" 
                                        style="width: 40px; height: 40px; border-radius: 10px; border: 1px solid rgba(211, 47, 47, 0.1); background: white; color: #d32f2f; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;" 
                                        title="حذف نهائي"
                                        onmouseover="this.style.background='rgba(211, 47, 47, 0.05)'" 
                                        onmouseout="this.style.background='white'">
                                    <i data-lucide="trash-2" style="width: 18px;"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            targetContainer.innerHTML = html;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });

    } catch (error) {
        targetContainer.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 40px; text-align: center; color: #d32f2f;">
                    <i data-lucide="alert-triangle" style="width: 40px; height: 40px; margin-bottom: 10px;"></i>
                    <p style="font-weight: 700;">فشل الاتصال بمركز البيانات السيادي. يرجى مراجعة الصندوق الأسود.</p>
                </td>
            </tr>
        `;
        if (window.AdminErrorTracker) window.AdminErrorTracker.report(error, 'renderCatalogTable');
    }
}

// ============================================================================
// 🗑️ 2. دالة الحذف السيادي (Sovereign Deletion Protocol)
// ============================================================================
window.initiateProductDelete = async function(productId, productName) {
    // استخدام نافذة القرار السيادي (Confirm Modal) بدلاً من confirm التقليدية
    const message = `هل أنت متأكد من الحذف القاطع للمنتج "${productName}"؟\nهذا الإجراء سيقوم بإزالة المنتج نهائياً من كافة واجهات العرض السحابية.`;
    
    if (typeof window.openConfirmModal === 'function') {
        window.openConfirmModal("قرار حذف سيادي", message, async () => {
            try {
                const row = document.getElementById(`row-${productId}`);
                if (row) row.style.opacity = '0.3';
                
                await executeDeleteProduct(productId);
                window.showSystemToast(`تم تنفيذ قرار الحذف لـ "${productName}" بنجاح.`, "success");
                if (typeof window.triggerSovereignSync === 'function') window.triggerSovereignSync();
            } catch (error) {
                window.showSystemToast("تعذر تنفيذ قرار الحذف. يرجى مراجعة سجلات النظام.", "error");
                if (row) row.style.opacity = '1';
            }
        });
    } else {
        // Fallback في حال عدم توفر المودال
        if (confirm(`قرار سيادي:\n${message}`)) {
            await executeDeleteProduct(productId);
            window.showSystemToast("تم الحذف بنجاح.", "success");
        }
    }
};

// ============================================================================
// ✏️ 3. تفعيل وظيفة التعديل (Edit Engine Connection)
// ============================================================================
window.initiateProductEdit = function(productId) {
    // الربط المباشر مع محرك (admin-catalog-manager)
    if (typeof window.openProductModal === 'function') {
        window.openProductModal(productId);
    } else {
        window.showSystemToast("تنبيه نظام: محرك إدارة المنتجات غير مفعل حالياً.", "error");
    }
};

// ============================================================================
// 🔌 4. مستشعرات التشغيل اللحظي (Event Listeners)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // ربط التنقل السلس من القائمة الجانبية
    const catalogNavBtn = document.getElementById('nav-products');
    if (catalogNavBtn) {
        catalogNavBtn.addEventListener('click', () => {
            // انتظار تأكيد محرك SPA برسم منطقة العمل
            setTimeout(renderCatalogTable, 300); 
        });
    }
});