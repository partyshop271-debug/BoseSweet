/**
 * ============================================================================
 * 👑 محرك إدارة الكتالوج السيادي | Catalog Manager Engine (V28.1)
 * ============================================================================
 * الإدارة المرجعية: حلويات بوسي
 * الوظيفة: إدارة نوافذ الإضافة والتعديل، وتأمين عمليات الرفع عبر محرك safeWrite.
 * التوافق: يدعم العمل في ظروف الشبكة الضعيفة مع المزامنة التلقائية.
 */

import coreExports from './core-engine.js';
import adminDB from './admin-database.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const db = coreExports.boseConfig.db;
let currentEditingProductId = null;

// ============================================================================
// 🛡️ 1. محرك الكتابة الآمنة (Sovereign safeWrite Engine)
// ============================================================================
/**
 * يضمن هذا المحرك دخول القرار الإداري في طابور المزامنة إذا تعذر الاتصال اللحظي.
 */
async function safeProductWrite(productId, productData, isEdit = false) {
    if (!navigator.onLine) {
        // في حالة عدم وجود إنترنت، يتم الحفظ في الخزنة المحلية لإعادة المزامنة
        const offlineId = isEdit ? productId : 'offline_prod_' + Date.now();
        await window.StorageEngine.set(`pending_sync_${offlineId}`, {
            action: isEdit ? 'update' : 'create',
            data: productData,
            timestamp: Date.now()
        });
        throw new Error("OFFLINE_QUEUED");
    }

    if (isEdit) {
        return await adminDB.updateProductDetails(productId, productData);
    } else {
        return await adminDB.saveNewProduct(productData);
    }
}

// ============================================================================
// 🏗️ 2. بناء واجهة النافذة المنبثقة (Professional UI Injection)
// ============================================================================
function injectProductModal() {
    if (document.getElementById('product-modal-overlay')) return;

    const modalHTML = `
    <div id="product-modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 3000; align-items: center; justify-content: center; opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
        <div style="background: #ffffff; width: 95%; max-width: 650px; border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); transform: scale(0.9) translateY(20px); transition: all 0.3s; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(255,145,164,0.2);">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid rgba(255,145,164,0.1); padding-bottom: 20px;">
                <div>
                    <h2 style="margin: 0; color: var(--primary-pink); font-size: 1.6rem; font-weight: 700;" id="modal-title">اعتماد منتج جديد</h2>
                    <p style="margin: 5px 0 0; font-size: 0.9rem; color: var(--text-muted);">تحديث الكتالوج السيادي لعلامة حلويات بوسي</p>
                </div>
                <button class="btn-icon" id="close-modal-btn" type="button" style="background: rgba(255,145,164,0.1); border-radius: 50%; padding: 8px;">
                    <i data-lucide="x" style="color: var(--primary-pink);"></i>
                </button>
            </div>
            
            <form id="product-form">
                <div style="margin-bottom: 25px;">
                    <label style="font-weight: 700; display: block; margin-bottom: 10px; color: var(--text-main); font-size: 0.95rem;">مسمى المنتج الإداري</label>
                    <input type="text" id="prod-name" style="width: 100%; padding: 16px; border: 2px solid rgba(255,145,164,0.1); border-radius: 14px; font-family: 'Cairo'; font-size: 1rem; transition: border-color 0.3s;" placeholder="ادخل الاسم الرسمي للمنتج..." required>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                    <div>
                        <label style="font-weight: 700; display: block; margin-bottom: 10px; font-size: 0.95rem;">التصنيف المهني</label>
                        <select id="prod-category" style="width: 100%; padding: 16px; border: 2px solid rgba(255,145,164,0.1); border-radius: 14px; font-family: 'Cairo'; cursor: pointer; appearance: none; background: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%23ff91a4%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E') no-repeat left 15px center; background-size: 18px;" required>
                            <option value="تورت">تورت</option>
                            <option value="ديسباسيتو">ديسباسيتو</option>
                            <option value="سينابون">سينابون</option>
                            <option value="قشطوطة">قشطوطة</option>
                            <option value="دوناتس">دوناتس</option>
                            <option value="ورد">قسم الورد</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-weight: 700; display: block; margin-bottom: 10px; font-size: 0.95rem;">القيمة المالية (ج.م)</label>
                        <input type="number" id="prod-price" style="width: 100%; padding: 16px; border: 2px solid rgba(255,145,164,0.1); border-radius: 14px; font-family: 'Cairo';" required>
                    </div>
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="font-weight: 700; display: block; margin-bottom: 10px; font-size: 0.95rem;">الوصف الفني (هندسة نصوص التفاعل)</label>
                    <textarea id="prod-desc" rows="4" style="width: 100%; padding: 16px; border: 2px solid rgba(255,145,164,0.1); border-radius: 14px; font-family: 'Cairo'; line-height: 1.7; resize: none;" placeholder="صف تفاصيل المنتج بما يعكس الجودة العالية..." required></textarea>
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="font-weight: 700; display: block; margin-bottom: 10px; font-size: 0.95rem;">عنوان الوسائط السحابي (URL)</label>
                    <div style="position: relative;">
                        <input type="url" id="prod-image" style="width: 100%; padding: 16px; border: 2px solid rgba(255,145,164,0.1); border-radius: 14px; font-family: 'Cairo';" placeholder="رابط صورة المنتج الرسمية..." required>
                        <i data-lucide="image" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--primary-pink); width: 20px;"></i>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 35px; background: rgba(255,145,164,0.03); padding: 20px; border-radius: 16px; border: 1px dashed rgba(255,145,164,0.2);">
                    <label style="display: flex; align-items: center; gap: 12px; font-weight: 700; cursor: pointer; color: var(--text-main);">
                        <input type="checkbox" id="prod-isNew" style="width: 22px; height: 22px; accent-color: var(--primary-pink); cursor: pointer;"> إصدار حديث
                    </label>
                    <label style="display: flex; align-items: center; gap: 12px; font-weight: 700; cursor: pointer; color: var(--text-main);">
                        <input type="checkbox" id="prod-isBestSeller" style="width: 22px; height: 22px; accent-color: var(--primary-pink); cursor: pointer;"> الأكثر طلباً
                    </label>
                </div>

                <div style="display: flex; gap: 15px;">
                    <button type="button" onclick="window.closeProductModal()" class="btn-secondary" style="flex: 1; padding: 16px; border-radius: 14px; font-weight: 700;">إلغاء الإجراء</button>
                    <button type="submit" id="save-product-btn" class="btn-primary" style="flex: 2; padding: 16px; border-radius: 14px; font-size: 1.1rem; display: flex; justify-content: center; gap: 12px; font-weight: 700;">
                        <i data-lucide="shield-check"></i> <span id="btn-text">رفع واعتماد المنتج</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    document.getElementById('close-modal-btn').addEventListener('click', window.closeProductModal);
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
}

// ============================================================================
// 📑 3. دوال التحكم بالقرار الإداري (Open & Close Logic)
// ============================================================================
window.openProductModal = async function(productId = null) {
    const modal = document.getElementById('product-modal-overlay');
    const form = document.getElementById('product-form');
    const title = document.getElementById('modal-title');
    const btnText = document.getElementById('btn-text');
    
    if (!modal) return;
    currentEditingProductId = productId;

    if (productId) {
        title.innerText = "تعديل البيانات السيادية";
        btnText.innerText = "تحديث واعتماد التعديلات";
        form.style.opacity = '0.6';
        modal.style.display = 'flex';
        
        try {
            const docRef = doc(db, 'catalog', productId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('prod-name').value = data.name || '';
                document.getElementById('prod-category').value = data.category || 'تورت';
                document.getElementById('prod-price').value = data.price || 0;
                document.getElementById('prod-desc').value = data.description || '';
                document.getElementById('prod-image').value = data.image || '';
                document.getElementById('prod-isNew').checked = !!data.isNew;
                document.getElementById('prod-isBestSeller').checked = !!data.isBestSeller;
            } else {
                window.showSystemToast("تنبيه نظام: السجل المطلوب غير متوفر في السحابة.", "error");
                window.closeProductModal();
                return;
            }
        } catch (e) {
            window.AdminErrorTracker.report(e, 'openProductModal');
            window.showSystemToast("خلل في مسار البيانات: تعذر جلب السجل.", "error");
            window.closeProductModal();
            return;
        } finally {
            form.style.opacity = '1';
        }
    } else {
        title.innerText = "اعتماد منتج جديد";
        btnText.innerText = "رفع واعتماد المنتج";
        form.reset();
        modal.style.display = 'flex';
    }

    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('div').style.transform = 'scale(1) translateY(0)';
    }, 50);
};

window.closeProductModal = function() {
    const modal = document.getElementById('product-modal-overlay');
    if (!modal) return;
    modal.style.opacity = '0';
    modal.querySelector('div').style.transform = 'scale(0.9) translateY(20px)';
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('product-form').reset();
        currentEditingProductId = null;
    }, 300);
};

// ============================================================================
// 🚀 4. معالجة إرسال القرار (Safe Write Implementation)
// ============================================================================
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('save-product-btn');
    const originalContent = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> جاري بث القرار للسحابة...';
    submitBtn.disabled = true;

    try {
        const productData = {
            name: document.getElementById('prod-name').value.trim(),
            category: document.getElementById('prod-category').value,
            price: parseFloat(document.getElementById('prod-price').value),
            description: document.getElementById('prod-desc').value.trim(),
            image: document.getElementById('prod-image').value.trim(),
            size: 'قياسي',
            isNew: document.getElementById('prod-isNew').checked,
            isBestSeller: document.getElementById('prod-isBestSeller').checked,
            status: 'متاح',
            isActive: true,
            lastAdminAction: 'web_dashboard'
        };

        await safeProductWrite(currentEditingProductId, productData, !!currentEditingProductId);
        
        window.showSystemToast("قرار نظام: تم توثيق البيانات في السحابة السيادية بنجاح.", "success");
        window.closeProductModal();
        if (typeof window.triggerSovereignSync === 'function') window.triggerSovereignSync();

    } catch (error) {
        if (error.message === "OFFLINE_QUEUED") {
            window.showSystemToast("تنبيه: تعذر الاتصال اللحظي. تم إدراج القرار في طابور المزامنة.", "info");
            window.closeProductModal();
        } else {
            window.AdminErrorTracker.report(error, 'handleProductSubmit');
            window.showSystemToast("فشل في مسار التنفيذ. يرجى مراجعة الصندوق الأسود.", "error");
        }
    } finally {
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ============================================================================
// 🔌 5. الإقلاع والربط (Bootloader)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    injectProductModal();
    
    // ربط كافة أزرار الإضافة في الواجهة بهذا المحرك
    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'add-new-product-master-btn') {
            window.openProductModal();
        }
    });
});

window.initiateProductEdit = window.openProductModal;