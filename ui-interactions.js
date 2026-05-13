/**
 * 👑 BoseSweets UI Interactions (V22.0 - Sovereign Monitor Edition)
 * محرك التفاعلات المباشرة والعمليات المنطقية - حلويات بوسي
 * تم استعادة جميع وظائف الحماية للمدخلات والقوائم الجانبية ومشاركة المنتجات.
 * 🛡️ التحديث الأمني: زراعة مستشعر BoseMonitor لمراقبة استقرار التفاعلات ونزاهة العمليات.
 */

import { siteSettings, cakeState } from './state.js';
import { showSystemToast, MemoryManager } from './utils.js';

/**
 * 👑 معالج كميات السلة المؤقتة (Temporary Quantity Context Handler)
 */
export const updateTempQtyContext = function(btnElement, delta) {
    try {
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
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-interactions.js', null, null, 'updateTempQtyContext');
    }
};
window.updateTempQtyContext = updateTempQtyContext;

/**
 * 👑 محرك القائمة الجانبية (Sovereign Mobile Sidebar)
 */
export const toggleCustomerMenu = function(show) {
    try {
        const ov = document.getElementById('customer-menu-overlay'); 
        const sd = document.getElementById('customer-menu-sidebar');
        if(!ov || !sd) {
            if(window.BoseMonitor) window.BoseMonitor.report("Sidebar elements missing in DOM", 'ui-interactions.js', null, null, 'toggleCustomerMenu');
            return;
        }

        if (show) { 
            ov.classList.remove('hidden'); 
            if(window.MemoryManager) {
                window.MemoryManager.set('menu_show', () => { 
                    ov.classList.add('opacity-100'); 
                    sd.classList.remove('translate-x-full'); 
                }, 10); 
            }
        } else { 
            ov.classList.remove('opacity-100'); 
            sd.classList.add('translate-x-full'); 
            if(window.MemoryManager) {
                window.MemoryManager.set('menu_hide', () => ov.classList.add('hidden'), 500); 
                window.MemoryManager.flush(); 
            } else {
                setTimeout(() => ov.classList.add('hidden'), 500);
            }
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-interactions.js', null, null, 'toggleCustomerMenu');
    }
};
window.toggleCustomerMenu = toggleCustomerMenu;

/**
 * 👑 محرك مشاركة المنتجات (Social Sharing Engine)
 */
export const shareProduct = function(id, name) {
    try {
        const url = window.location.origin + window.location.pathname + '?product=' + id;
        const brandName = (siteSettings && siteSettings.brandName) ? siteSettings.brandName : 'حلويات بوسي';
        
        if (navigator.share) { 
            navigator.share({ 
                title: brandName + ' - ' + name, 
                text: 'شوف المنتج الروعة ده من حلويات بوسي!', 
                url: url 
            }).catch(err => {
                if(window.BoseMonitor) window.BoseMonitor.report(err, 'ui-interactions.js', null, null, 'shareProduct - Native Share Cancel/Fail');
            }); 
        } else { 
            // Fallback: Clipboard Strategy
            const copyToClipboard = (text) => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    return navigator.clipboard.writeText(text);
                } else {
                    const t = document.createElement("textarea"); 
                    t.value = text; 
                    document.body.appendChild(t); 
                    t.select(); 
                    const result = document.execCommand("Copy"); 
                    t.remove(); 
                    return result ? Promise.resolve() : Promise.reject();
                }
            };

            copyToClipboard(url).then(() => { 
                showSystemToast('تم نسخ رابط المنتج بنجاح!', 'success'); 
            }).catch((err) => { 
                if(window.BoseMonitor) window.BoseMonitor.report(err, 'ui-interactions.js', null, null, 'shareProduct - Clipboard Fallback Failure');
                showSystemToast('نأسف، تعذر نسخ الرابط تلقائياً.', 'error');
            }); 
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-interactions.js', null, null, 'shareProduct - Master Catch');
    }
};
window.shareProduct = shareProduct;

/**
 * 👑 معالج رفع صور التورتات المخصصة (Cake Image Processor)
 */
export const handleCakeImageUpload = async function(input) {
    try {
        if (input.files && input.files[0]) {
            showSystemToast('جاري معالجة الصورة لضمان أفضل جودة...', 'info');
            
            let compressedBase64;
            if (window.MemoryManager && window.MemoryManager.compressImageClientSide) {
                compressedBase64 = await window.MemoryManager.compressImageClientSide(input.files[0]);
            } else {
                // محاولة الاستيراد الديناميكي في حال عدم وجود المانجر في النطاق العالمي
                const utils = await import('./utils.js');
                compressedBase64 = await utils.compressImageClientSide(input.files[0]);
            }

            if (compressedBase64) {
                cakeState.refImage = compressedBase64;
                if(window.renderMultiStepCakeBuilder) window.renderMultiStepCakeBuilder();
                showSystemToast('تم إرفاق ومعالجة الصورة بنجاح.', 'success');
            } else {
                throw new Error("Compression returned empty result");
            }
        }
    } catch (e) {
        if(window.BoseMonitor) window.BoseMonitor.report(e, 'ui-interactions.js', null, null, 'handleCakeImageUpload');
        console.error("Image Upload Error:", e);
        showSystemToast('حدث خطأ أثناء معالجة الصورة، يرجى إرسالها عبر الواتساب لاحقاً.', 'error');
    }
};
window.handleCakeImageUpload = handleCakeImageUpload;

/**
 * 👑 محرك المعلومات القانونية والتعريفية (Information & Policy Engine)
 */
export const showInfo = function(t) {
    try {
        const d = { 
            about: { 
                t: 'عن حلويات بوسي', 
                b: (siteSettings && siteSettings.footerQuote) ? siteSettings.footerQuote : 'العلامة التجارية الرائدة في صناعة الحلويات الفاخرة بالفرافرة.' 
            }, 
            privacy: { 
                t: 'سياسة الأمان والبيانات', 
                b: 'بنلتزم في حلويات بوسي بحماية بيانات عملائنا وفق أعلى معايير الخصوصية والأمان التقني.' 
            }, 
            refund: { 
                t: 'سياسة الاستبدال والاسترجاع', 
                b: 'كل طلباتنا بتخضع لرقابة جودة صارمة عشان نضمن لحضرتك رضا تام وتقديم أفضل مستوى.' 
            } 
        };

        if(!d[t]) return;

        const titleEl = document.getElementById('info-title');
        const bodyEl = document.getElementById('info-body');
        const m = document.getElementById('info-modal'); 

        if(titleEl) titleEl.innerText = d[t].t; 
        if(bodyEl) bodyEl.innerText = d[t].b;
        
        if(m) { 
            m.classList.remove('hidden'); 
            m.classList.add('flex', 'animate-fade-in'); 
        }

        if(window.lucide) window.lucide.createIcons();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-interactions.js', null, null, 'showInfo');
    }
};
window.showInfo = showInfo;

/**
 * 👑 إغلاق مودال المعلومات
 */
export const closeInfo = function() { 
    try {
        const m = document.getElementById('info-modal'); 
        if(m) { 
            m.classList.add('hidden'); 
            m.classList.remove('flex'); 
        }
        if(window.MemoryManager) window.MemoryManager.flush();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-interactions.js', null, null, 'closeInfo');
    }
};
window.closeInfo = closeInfo;

/**
 * 👑 الربط السيادي بنطاق النافذة (Global Bindings)
 */
if (typeof window !== 'undefined') {
    try {
        window.updateTempQtyContext = updateTempQtyContext;
        window.toggleCustomerMenu = toggleCustomerMenu;
        window.shareProduct = shareProduct;
        window.handleCakeImageUpload = handleCakeImageUpload;
        window.showInfo = showInfo;
        window.closeInfo = closeInfo;
        
        console.log("👑 BoseSweets Engine: UI Interactions finalized with Sovereign Monitoring.");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-interactions.js', null, null, 'Global Binding Failure');
    }
}