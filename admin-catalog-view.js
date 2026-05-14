/**
 * ============================================================================
 * 👑 محرك عرض الكتالوج السيادي | Admin Catalog View Engine
 * ============================================================================
 * الوظيفة: جلب المنتجات من السحابة، رسم جدول الإدارة، وتفعيل قرارات الحذف.
 */

import { fetchAllProducts, executeDeleteProduct } from './admin-database.js';

// ============================================================================
// 1. دالة البناء والرسم (Table Renderer)
// ============================================================================
export async function renderCatalogTable() {
    const tableBody = document.getElementById('admin-catalog-list');
    if (!tableBody) return; // تأكد من أننا في شاشة الكتالوج

    // إظهار حالة التحميل الاحترافية
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" style="padding: 40px; text-align: center; color: var(--text-muted);">
                <i data-lucide="loader-2" class="spin-animation" style="width: 32px; height: 32px; color: var(--primary-pink); margin-bottom: 10px;"></i>
                <p style="font-weight: 700;">جاري مزامنة الكتالوج من السحابة السيادية...</p>
            </td>
        </tr>
    `;
    lucide.createIcons();

    try {
        // جلب البيانات من السحابة
        const products = await fetchAllProducts();

        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 40px; text-align: center; color: var(--text-muted);">
                        <i data-lucide="package-open" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 10px;"></i>
                        <p style="font-weight: 700;">الكتالوج فارغ حالياً. يمكنك إضافة منتجات جديدة.</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        // بناء صفوف الجدول
        let html = '';
        products.forEach(product => {
            const statusBadge = product.status === 'متاح' 
                ? `<span style="background: #e8f5e9; color: #2e7d32; padding: 5px 12px; border-radius: 50px; font-size: 0.85rem; font-weight: 700;">متاح</span>`
                : `<span style="background: #ffebee; color: #c62828; padding: 5px 12px; border-radius: 50px; font-size: 0.85rem; font-weight: 700;">غير متاح</span>`;

            html += `
                <tr style="border-bottom: 1px solid rgba(255,145,164,0.1); transition: background 0.3s;" id="row-${product.id}">
                    <td style="padding: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,145,164,0.2);">
                            <span style="font-weight: 700;">${product.name}</span>
                        </div>
                    </td>
                    <td style="padding: 20px;">${product.category}</td>
                    <td style="padding: 20px; color: var(--primary-pink); font-weight: 700;">${product.price} ج.م</td>
                    <td style="padding: 20px;">${statusBadge}</td>
                    <td style="padding: 20px; text-align: center;">
                        <button onclick="window.initiateProductEdit('${product.id}')" style="background: none; border: none; color: var(--primary-pink); cursor: pointer; margin-left: 15px;" title="تعديل">
                            <i data-lucide="edit-3"></i>
                        </button>
                        <button onclick="window.initiateProductDelete('${product.id}', '${product.name}')" style="background: none; border: none; color: #d32f2f; cursor: pointer;" title="حذف قاطع">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        lucide.createIcons();

    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 30px; text-align: center; color: #d32f2f; font-weight: 700;">
                    حدث خلل في الاتصال بالسحابة. يرجى مراجعة الصندوق الأسود.
                </td>
            </tr>
        `;
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-catalog-view.js', null, 'renderCatalogTable');
    }
}

// ============================================================================
// 2. دالة الحذف القاطع (Sovereign Deletion)
// ============================================================================
window.initiateProductDelete = async function(productId, productName) {
    // رسالة تأكيد إدارية حازمة
    const isConfirmed = confirm(`قرار سيادي:\nهل أنت متأكد من الحذف القاطع لمنتج "${productName}" من قاعدة البيانات؟\n(هذا الإجراء لا يمكن التراجع عنه وسيتم إخفاؤه من واجهة العملاء فوراً)`);
    
    if (!isConfirmed) return;

    try {
        // تغيير شكل الزر أو الصف كدليل بصري أثناء الحذف
        const row = document.getElementById(`row-${productId}`);
        if (row) row.style.opacity = '0.5';

        // تنفيذ الحذف السحابي
        await executeDeleteProduct(productId);
        
        // إشعار الإدارة
        alert(`تمت إزالة "${productName}" بنجاح.`);
        
        // إعادة رسم الجدول لتحديث البيانات
        await renderCatalogTable();

    } catch (error) {
        alert('فشل الحذف. يرجى المحاولة مرة أخرى.');
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-catalog-view.js', null, 'initiateProductDelete');
    }
};

window.initiateProductEdit = function(productId) {
    // سيتم برمجتها لاحقاً لفتح نافذة التعديل
    alert('قسم التعديل قيد التجهيز الهندسي وسيتم إرفاقه قريباً.');
};

// ============================================================================
// 3. مستشعرات التشغيل اللحظي
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. عند الضغط على تبويب "إدارة الكتالوج" في القائمة الجانبية، قم برسم الجدول فوراً
    const catalogNavBtn = document.getElementById('nav-products');
    if (catalogNavBtn) {
        catalogNavBtn.addEventListener('click', () => {
            // ننتظر قليلاً حتى يقوم محرك SPA برسم الهيكل الفارغ، ثم نملأه
            setTimeout(renderCatalogTable, 350); 
        });
    }

    // 2. إعادة رسم الجدول تلقائياً بعد إضافة منتج جديد
    const form = document.getElementById('product-form');
    if (form) {
        form.addEventListener('submit', () => {
            // ننتظر 2 ثانية لضمان وصول المنتج للسحابة ثم نحدث الجدول
            setTimeout(() => {
                if(document.getElementById('admin-catalog-list')) {
                    renderCatalogTable();
                }
            }, 2000);
        });
    }
});