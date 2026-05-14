/**
 * ============================================================================
 * 👑 محرك إدارة الكتالوج السيادي | Catalog Manager Engine
 * ============================================================================
 * الوظيفة: تشغيل نافذة الإضافة/التعديل، جمع بيانات المنتج، وتمريرها لمحرك السحابة.
 */

import { saveNewProduct, fetchAllProducts } from './admin-database.js';

// ============================================================================
// 1. بناء واجهة النافذة المنبثقة (Modal Injection)
// ============================================================================
function injectProductModal() {
    if (document.getElementById('product-modal-overlay')) return;

    const modalHTML = `
    <div id="product-modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 3000; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;">
        <div style="background: var(--bg-white); width: 100%; max-width: 600px; border-radius: var(--border-radius-card); padding: 35px; box-shadow: var(--shadow-hover); transform: translateY(30px); transition: transform 0.3s; max-height: 90vh; overflow-y: auto;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid rgba(255,145,164,0.1); padding-bottom: 15px;">
                <h2 style="margin: 0; color: var(--primary-pink); font-size: 1.5rem;" id="modal-title">إضافة منتج جديد للكتالوج</h2>
                <button class="btn-icon" id="close-modal-btn" type="button"><i data-lucide="x"></i></button>
            </div>
            
            <form id="product-form">
                <div style="margin-bottom: 20px;">
                    <label style="font-weight: 700; display: block; margin-bottom: 8px; color: var(--text-main);">اسم المنتج</label>
                    <input type="text" id="prod-name" style="width: 100%; padding: 14px; border: 2px solid rgba(255,145,164,0.2); border-radius: 12px; font-family: 'Cairo';" placeholder="مثال: ديسباسيتو نوتيلا" required>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="font-weight: 700; display: block; margin-bottom: 8px;">القسم</label>
                        <select id="prod-category" style="width: 100%; padding: 14px; border: 2px solid rgba(255,145,164,0.2); border-radius: 12px; font-family: 'Cairo';" required>
                            <option value="تورت">تورت</option>
                            <option value="ديسباسيتو">ديسباسيتو</option>
                            <option value="سينابون">سينابون</option>
                            <option value="قشطوطة">قشطوطة</option>
                            <option value="ورد">قسم الورد</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-weight: 700; display: block; margin-bottom: 8px;">السعر (ج.م)</label>
                        <input type="number" id="prod-price" style="width: 100%; padding: 14px; border: 2px solid rgba(255,145,164,0.2); border-radius: 12px; font-family: 'Cairo';" required>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="font-weight: 700; display: block; margin-bottom: 8px;">الوصف الاحترافي (يظهر للعميل)</label>
                    <textarea id="prod-desc" rows="3" style="width: 100%; padding: 14px; border: 2px solid rgba(255,145,164,0.2); border-radius: 12px; font-family: 'Cairo'; line-height: 1.6;" placeholder="اكتب وصفاً يحفز حواس العميل..." required></textarea>
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="font-weight: 700; display: block; margin-bottom: 8px;">رابط الصورة (Cloudinary)</label>
                    <input type="url" id="prod-image" style="width: 100%; padding: 14px; border: 2px solid rgba(255,145,164,0.2); border-radius: 12px; font-family: 'Cairo';" placeholder="https://res.cloudinary.com/..." required>
                </div>

                <div style="display: flex; gap: 25px; margin-bottom: 30px; background: rgba(255,145,164,0.05); padding: 15px; border-radius: 12px;">
                    <label style="display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer;">
                        <input type="checkbox" id="prod-isNew" style="width: 20px; height: 20px; accent-color: var(--primary-pink);"> تصنيف كـ "وصل حديثاً"
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer;">
                        <input type="checkbox" id="prod-isBestSeller" style="width: 20px; height: 20px; accent-color: var(--primary-pink);"> تصنيف كـ "الأكثر مبيعاً"
                    </label>
                </div>

                <button type="submit" id="save-product-btn" class="btn-primary" style="width: 100%; padding: 16px; font-size: 1.1rem; display: flex; justify-content: center; gap: 10px;">
                    <i data-lucide="upload-cloud"></i> رفع واعتماد المنتج
                </button>
            </form>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    lucide.createIcons();
    
    // تفعيل أزرار الإغلاق والإرسال
    document.getElementById('close-modal-btn').addEventListener('click', closeProductModal);
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
}

// ============================================================================
// 2. دوال التحكم بالنافذة (Open & Close)
// ============================================================================
window.openProductModal = function() {
    const modal = document.getElementById('product-modal-overlay');
    if (!modal) return;
    modal.style.display = 'flex';
    // تفعيل الحركة الناعمة
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('div').style.transform = 'translateY(0)';
    }, 10);
};

function closeProductModal() {
    const modal = document.getElementById('product-modal-overlay');
    if (!modal) return;
    modal.style.opacity = '0';
    modal.querySelector('div').style.transform = 'translateY(30px)';
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('product-form').reset();
    }, 300);
}

// ============================================================================
// 3. معالجة الإرسال للسحابة (Form Submission)
// ============================================================================
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('save-product-btn');
    const originalText = submitBtn.innerHTML;
    
    // تحويل الزر لحالة التحميل لمنع التكرار
    submitBtn.innerHTML = '<i data-lucide="loader" class="spin-animation"></i> جاري الرفع للسحابة...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    try {
        // جمع البيانات من الإدارة
        const productData = {
            id: 'bose_' + Date.now(), // توليد معرف فريد
            name: document.getElementById('prod-name').value.trim(),
            category: document.getElementById('prod-category').value,
            price: parseFloat(document.getElementById('prod-price').value),
            description: document.getElementById('prod-desc').value.trim(),
            image: document.getElementById('prod-image').value.trim(),
            size: 'أساسي', // الحجم الافتراضي (يمكن تغييره لاحقاً)
            isNew: document.getElementById('prod-isNew').checked,
            isBestSeller: document.getElementById('prod-isBestSeller').checked,
            status: 'متاح'
        };

        // إرسال الأمر لمحرك قواعد البيانات
        await saveNewProduct(productData);
        
        // إشعار الإدارة بالنجاح
        alert('قرار إداري: تم اعتماد المنتج بنجاح ورفعه لقاعدة البيانات السيادية.');
        closeProductModal();
        
        // سيتم إضافة دالة هنا لاحقاً لتحديث جدول المنتجات فوراً

    } catch (error) {
        alert('حدث خلل أثناء الرفع، راجعي سجل الصندوق الأسود لمزيد من التفاصيل.');
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'admin-catalog-manager.js', null, 'handleProductSubmit');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        lucide.createIcons();
    }
}

// ============================================================================
// 4. التشغيل التلقائي عند التحميل
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    injectProductModal();

    // التقاط أي ضغطة على زر "إضافة منتج جديد" في لوحة التحكم وربطه بالنافذة
    document.body.addEventListener('click', (e) => {
        // التحقق مما إذا كان العنصر المضغوط هو زر الإضافة
        const target = e.target.closest('button');
        if (target && target.innerText.includes('إضافة منتج جديد')) {
            window.openProductModal();
        }
    });
});
