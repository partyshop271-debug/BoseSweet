/**
 * 👑 BoseSweets UI Interactions (V21.5 - Production Protocol)
 * محرك التفاعلات المباشرة والعمليات المنطقية - حلويات بوسي
 * تم استعادة جميع وظائف الحماية للمدخلات والقوائم الجانبية ومشاركة المنتجات من الملف السيادي.
 */

import { siteSettings, cakeState } from './state.js';
import { showSystemToast, MemoryManager } from './utils.js';

// 👑 معالج كميات السلة المؤقتة
export const updateTempQtyContext = function(btnElement, delta) {
    const displaySpan = btnElement.parentElement.querySelector('.temp-qty-display');
    if (!displaySpan) return;

    let currentQty = parseInt(displaySpan.innerText) || 1;
    currentQty += delta;

    if (currentQty < 1) currentQty = 1;
    if (currentQty > 50) {
        showSystemToast("الكمية المطلوبة كبيرة، سيتم التنسيق مع الإدارة لتأكيد التوافر وفق الجداول المهنية.", "info");
        currentQty = 50;
    }
    displaySpan.innerText = currentQty;
};
window.updateTempQtyContext = updateTempQtyContext;

// 👑 محرك القائمة الجانبية (Mobile Sidebar)
export const toggleCustomerMenu = function(show) {
    const ov = document.getElementById('customer-menu-overlay'); 
    const sd = document.getElementById('customer-menu-sidebar');
    if(!ov || !sd) return;
    if (show) { 
        ov.classList.remove('hidden'); 
        MemoryManager.set('menu_show', () => { ov.classList.add('opacity-100'); sd.classList.remove('translate-x-full'); }, 10); 
    } else { 
        ov.classList.remove('opacity-100'); 
        sd.classList.add('translate-x-full'); 
        MemoryManager.set('menu_hide', () => ov.classList.add('hidden'), 500); 
        MemoryManager.flush(); 
    }
};
window.toggleCustomerMenu = toggleCustomerMenu;

// 👑 محرك مشاركة المنتجات (Social Sharing Engine)
export const shareProduct = function(id, name) {
    const url = window.location.origin + window.location.pathname + '?product=' + id;
    if (navigator.share) { 
        navigator.share({ title: siteSettings.brandName + ' - ' + name, text: 'شوف المنتج الروعة ده من حلويات بوسي!', url: url }).catch(console.error); 
    } else { 
        navigator.clipboard.writeText(url).then(() => { 
            showSystemToast('تم نسخ رابط المنتج بنجاح!', 'success'); 
        }).catch(() => { 
            const t = document.createElement("textarea"); 
            t.value = url; 
            document.body.appendChild(t); 
            t.select(); 
            document.execCommand("Copy"); 
            t.remove(); 
            showSystemToast('تم نسخ الرابط بنجاح!', 'success'); 
        }); 
    }
};
window.shareProduct = shareProduct;

// 👑 معالج رفع صور التورتات المخصصة
export const handleCakeImageUpload = async function(input) {
    if (input.files && input.files[0]) {
        try {
            const compressedBase64 = await (window.MemoryManager && window.MemoryManager.compressImageClientSide ? window.MemoryManager.compressImageClientSide(input.files[0]) : (await import('./utils.js')).compressImageClientSide(input.files[0]));
            cakeState.refImage = compressedBase64;
            if(window.renderMultiStepCakeBuilder) window.renderMultiStepCakeBuilder();
            showSystemToast('تم إرفاق ومعالجة الصورة بنجاح.', 'success');
        } catch (e) {
            console.error("Image Upload Error:", e);
            showSystemToast('حدث خطأ أثناء معالجة الصورة، يرجى إرسالها عبر الواتساب لاحقاً.', 'error');
        }
    }
};
window.handleCakeImageUpload = handleCakeImageUpload;

// 👑 محرك المعلومات القانونية والتعريفية
export const showInfo = function(t) {
    const d = { 
        about: { t: 'عن حلويات بوسي', b: siteSettings.footerQuote || 'العلامة التجارية الرائدة في صناعة الحلويات الفاخرة بالفرافرة.' }, 
        privacy: { t: 'سياسة الأمان والبيانات', b: 'بنلتزم في حلويات بوسي بحماية بيانات عملائنا وفق أعلى معايير الخصوصية والأمان التقني.' }, 
        refund: { t: 'سياسة الاستبدال والاسترجاع', b: 'كل طلباتنا بتخضع لرقابة جودة صارمة عشان نضمن لحضرتك رضا تام وتقديم أفضل مستوى.' } 
    };
    if(!d[t]) return;
    const titleEl = document.getElementById('info-title');
    const bodyEl = document.getElementById('info-body');
    if(titleEl) titleEl.innerText = d[t].t; 
    if(bodyEl) bodyEl.innerText = d[t].b;
    const m = document.getElementById('info-modal'); 
    if(m) { m.classList.remove('hidden'); m.classList.add('flex'); }
    if(window.lucide) lucide.createIcons();
};
window.showInfo = showInfo;

export const closeInfo = function() { 
    const m = document.getElementById('info-modal'); 
    if(m) { m.classList.add('hidden'); m.classList.remove('flex'); }
    if(window.MemoryManager) window.MemoryManager.flush();
};
window.closeInfo = closeInfo;