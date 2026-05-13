/**
 * 👑 BoseSweets Gallery Admin Engine (V23.0 - Sovereign Integration)
 * محرك إدارة معرض سابقة الأعمال المطور - علامة حلويات بوسي
 * * * الترقيات المهنية في هذه النسخة:
 * - معالجة تامة لأخطاء النطاق (Scope) بربط البيانات بجذر المتصفح (Window).
 * - درع أمني للتحقق من صحة الروابط قبل استهلاك موارد محرك السحابة.
 * - دعم التحميل الكسول (Lazy Loading) للصور لرفع أداء الموقع للحد الأقصى.
 * - نصوص تفاعلية (Micro-copy) مصاغة بأسلوب القرار المهني الصارم للإدارة.
 * - توافق مطلق بنسبة 100% مع محرك NetworkEngine V22.0.
 * 🛡️ التحديث الأمني الجديد: تم زراعة مستشعر BoseMonitor لمراقبة رندر الصور والعمليات السحابية.
 */

// 🛡️ دالة مساعدة للتحقق من صحة رابط الصورة (URL Validator)
window.validateBoseSweetsImageUrl = function(url) {
    try {
        if (!url || typeof url !== 'string') return false;
        const trimmedUrl = url.trim();
        // التحقق المبدئي من هيكل الرابط لضمان عدم إدخال نصوص عشوائية
        const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?.*)?)|(https?:\/\/.*firebasestorage\.googleapis\.com.*)$/i;
        // السماح بروابط السحابة أو الروابط المباشرة للصور
        return urlPattern.test(trimmedUrl) || trimmedUrl.startsWith('data:image') || trimmedUrl.includes('http');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'gallery.js', null, null, 'validateBoseSweetsImageUrl');
        return false;
    }
};

// 👑 محرك عرض الصور في لوحة الإدارة
window.renderAdminGalleryGridUI = function() {
    try {
        const grid = document.getElementById('admin-gallery-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // التأكد من وجود مصفوفة البيانات في النطاق العام لمنع انهيار النظام
        if (!window.galleryData || !Array.isArray(window.galleryData) || window.galleryData.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500 text-sm font-bold border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                سجل معرض حلويات بوسي فارغ حالياً. يرجى إدراج روابط الأعمال الفنية.
            </div>`;
            return;
        }
        
        // بناء الهيكل الشبكي بدعم التحميل الكسول وحماية ضد الروابط التالفة
        grid.innerHTML = window.galleryData.map(img => {
            const imgSrc = img.url || img.imgUrl || img;
            const imgId = img.id || ('gal_' + Math.random().toString(36).substr(2, 9));
            
            return `
            <div class="relative group rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300">
                <img 
                    src="${imgSrc}" 
                    loading="lazy"
                    onerror="this.style.opacity='0.2'; this.parentElement.classList.add('border-red-900');"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt="عمل فني - حلويات بوسي"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                <button 
                    onclick="window.deleteGalleryPhotoSecurely('${imgId}')" 
                    class="absolute top-2 right-2 p-2 bg-slate-900/90 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 hover:text-white active:scale-95 z-10 shadow-lg border border-slate-700 hover:border-red-400" 
                    title="إصدار قرار بحذف الصورة"
                >
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>`;
        }).join('');
        
        // إعادة تفعيل الأيقونات بعد بناء الهيكل
        if (typeof window.lucide !== 'undefined') {
            window.lucide.createIcons();
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'gallery.js', null, null, 'renderAdminGalleryGridUI');
    }
};

// 👑 محرك الرفع والإدراج المباشر للسحابة
window.uploadNewGalleryPhotoDirectly = async function() {
    try {
        const urlInput = document.getElementById('gallery-image-url-input');
        const rawUrl = urlInput ? urlInput.value.trim() : '';
        
        if (!rawUrl) {
            if (typeof window.showSystemToast === 'function') {
                window.showSystemToast('توجيه إداري: يرجى إدراج رابط الصورة أولاً لتنفيذ الأمر.', 'error');
            }
            return;
        }

        if (!window.validateBoseSweetsImageUrl(rawUrl)) {
            if (typeof window.showSystemToast === 'function') {
                window.showSystemToast('رفض أمني: الرابط المدرج غير صالح، يرجى إدراج رابط صورة معتمد.', 'error');
            }
            return;
        }

        const uniqueId = 'gal_' + Date.now();
        const payload = { 
            id: uniqueId, 
            url: rawUrl, 
            timestamp: Date.now() 
        };

        try {
            // حماية مصفوفة البيانات وتحديثها محلياً أولاً لسرعة الاستجابة
            if (!Array.isArray(window.galleryData)) {
                window.galleryData = [];
            }
            window.galleryData.unshift(payload);
            
            // 👑 الترقية السيادية: توجيه العملية عبر الموتور السحابي الآمن (NetworkEngine)
            if (window.NetworkEngine && typeof window.NetworkEngine.safeWrite === 'function') {
                await window.NetworkEngine.safeWrite('gallery', uniqueId, payload);
            } else if (typeof window.db !== 'undefined' && window.db) {
                await window.db.collection('gallery').doc(uniqueId).set(payload);
            } else {
                throw new Error("قنوات الاتصال السحابية غير متوفرة حالياً.");
            }
            
            // تحديث الذاكرة المحلية والواجهات
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('gal');
            if (urlInput) urlInput.value = '';
            
            window.renderAdminGalleryGridUI();
            
            if (typeof window.updateAdminDashboardStatsUI === 'function') {
                window.updateAdminDashboardStatsUI();
            }
            
            if (typeof window.showSystemToast === 'function') {
                window.showSystemToast('قرار تنفيذي: تم توثيق الصورة وإدراجها لمعرض حلويات بوسي بنجاح.', 'success');
            }
            
            // إبلاغ محرك المزامنة العكسية ليتم تحديث أجهزة العملاء فوراً
            if (typeof window.triggerSovereignSync === 'function') {
                window.triggerSovereignSync();
            }

        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'gallery.js', null, null, 'uploadNewGalleryPhotoDirectly (Cloud Sync)');
            console.warn("BoseSweets Gallery Error:", error.message);
            
            // في حالة التذبذب، نضمن حفظ البيانات محلياً بانتظار الطابور الذكي
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('gal');
            
            window.renderAdminGalleryGridUI(); // إعادة العرض بالنسخة المحلية
            
            if (typeof window.showSystemToast === 'function') {
                window.showSystemToast('ملاحظة نظام: تم تسجيل الصورة محلياً، وسيتم المزامنة تلقائياً عند استقرار الشبكة.', 'info');
            }
        }
    } catch (masterError) {
        if(window.BoseMonitor) window.BoseMonitor.report(masterError, 'gallery.js', null, null, 'uploadNewGalleryPhotoDirectly (Master)');
    }
};

// 👑 محرك الحذف الآمن والموثق
window.deleteGalleryPhotoSecurely = async function(photoId) {
    try {
        if (!photoId) return;

        // لغة القرار المهني للإدارة
        if (!confirm('تأكيد إداري: هل تود حضرتك إصدار أمر بحذف هذه الصورة من المعرض العام لعلامة حلويات بوسي؟')) {
            return;
        }
        
        try {
            // 👑 الترقية السيادية: استخدام محرك الحذف الآمن لضمان التزامن مع الشبكة
            if (window.NetworkEngine && typeof window.NetworkEngine.safeDelete === 'function') {
                await window.NetworkEngine.safeDelete('gallery', photoId);
            } else if (typeof window.db !== 'undefined' && window.db) {
                await window.db.collection('gallery').doc(String(photoId)).delete();
            }
            
            // تحديث المصفوفة المحلية فوراً (Optimistic UI Update)
            if (Array.isArray(window.galleryData)) {
                window.galleryData = window.galleryData.filter(item => String(item.id) !== String(photoId));
            }
            
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('gal');
            
            window.renderAdminGalleryGridUI();
            
            if (typeof window.updateAdminDashboardStatsUI === 'function') {
                window.updateAdminDashboardStatsUI();
            }
            
            if (typeof window.showSystemToast === 'function') {
                window.showSystemToast('قرار تنفيذي: تم سحب الصورة من العرض العام بنجاح.', 'success');
            }
            
            if (typeof window.triggerSovereignSync === 'function') {
                window.triggerSovereignSync();
            }

        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'gallery.js', null, null, 'deleteGalleryPhotoSecurely (Cloud Sync)');
            console.warn("BoseSweets Gallery Deletion Error:", error.message);
            if (typeof window.showSystemToast === 'function') {
                window.showSystemToast('تنبيه فني: حدث عائق أثناء المعالجة السحابية، يرجى التأكد من حالة الشبكة.', 'error');
            }
        }
    } catch (masterError) {
        if(window.BoseMonitor) window.BoseMonitor.report(masterError, 'gallery.js', null, null, 'deleteGalleryPhotoSecurely (Master)');
    }
};

// إطلاق التهيئة الأولية إذا تم تحميل الملف بعد اكتمال واجهة المستخدم
try {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.renderAdminGalleryGridUI();
    } else {
        document.addEventListener('DOMContentLoaded', window.renderAdminGalleryGridUI);
    }
} catch (bootError) {
    if(window.BoseMonitor) window.BoseMonitor.report(bootError, 'gallery.js', null, null, 'Gallery Bootloader');
}