// محرك إدارة معرض سابقة الأعمال (Gallery Engine) - حلويات بوسي
window.renderAdminGalleryGridUI = function() {
    const grid = document.getElementById('admin-gallery-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    if (galleryData.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500 text-xs font-bold">المعرض السحابي للشلال فارغ حالياً.</div>`;
        return;
    }
    
    grid.innerHTML = galleryData.map(img => `
        <div class="relative group rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-900">
            <img src="${img.url || img.imgUrl || img}" class="w-full h-full object-cover">
            <button onclick="window.deleteGalleryPhotoSecurely('${img.id}')" class="absolute top-2 right-2 p-1.5 bg-[#ff91a4] text-white rounded-lg opacity-90 transition-transform active:scale-90 relative z-50 pointer-events-auto" title="حذف الصورة من الشلال">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        </div>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
};

window.uploadNewGalleryPhotoDirectly = async function() {
    const urlInput = document.getElementById('gallery-image-url-input');
    const url = urlInput?.value.trim();
    
    if (!url) {
        showSystemToast('الرجاء إدراج رابط الصورة الفني أولاً 📸', 'error');
        return;
    }

    const uniqueId = 'gal_' + Date.now();
    const payload = { id: uniqueId, url: url, timestamp: Date.now() };

    try {
        // 👑 الترقية السيادية: تمرير العملية عبر محرك السحابة الآمن
        if (window.NetworkEngine && typeof window.NetworkEngine.safeWrite === 'function') {
            await window.NetworkEngine.safeWrite('gallery', uniqueId, payload);
        } else if (typeof db !== 'undefined') {
            await db.collection('gallery').doc(uniqueId).set(payload);
        }
        
        galleryData.push(payload);
        if (typeof saveEngineMemory === 'function') saveEngineMemory('gal');
        
        if (urlInput) urlInput.value = '';
        renderAdminGalleryGridUI();
        if(typeof updateAdminDashboardStatsUI === 'function') updateAdminDashboardStatsUI();
        showSystemToast('تم دمج ونشر الصورة الجديدة في محرك شلال العميل بنجاح باهر 📸👑', 'success');
    } catch (e) {
        if (typeof saveEngineMemory === 'function') saveEngineMemory('gal');
        showSystemToast('تم الحفظ محلياً لحين اتصال السحابة', 'info');
    }
};

window.deleteGalleryPhotoSecurely = async function(photoId) {
    if (!confirm('هل تودين مسح هذه الصورة وسحبها من شلال سابقة الأعمال؟')) return;
    
    try {
        // 👑 الترقية السيادية: استخدام محرك الحذف الآمن لضمان التزامن
        if (window.NetworkEngine && typeof window.NetworkEngine.safeDelete === 'function') {
            await window.NetworkEngine.safeDelete('gallery', photoId);
        } else if (typeof db !== 'undefined') {
            await db.collection('gallery').doc(photoId).delete();
        }
        
        galleryData = galleryData.filter(item => String(item.id) !== String(photoId));
        if (typeof saveEngineMemory === 'function') saveEngineMemory('gal');
        
        renderAdminGalleryGridUI();
        if(typeof updateAdminDashboardStatsUI === 'function') updateAdminDashboardStatsUI();
        showSystemToast('تم إقصاء وحذف الصورة سحابياً بنجاح 👑', 'success');
    } catch (e) {
        showSystemToast('حدث خطأ أثناء محاولة الحذف، يرجى المحاولة لاحقاً', 'error');
    }
};
