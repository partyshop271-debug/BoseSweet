/**
 * ============================================================================
 * محرك معرض سابقة الأعمال (الشلال) | BoseSweets Gallery Engine
 * ============================================================================
 */

window.renderAdminGalleryGridUI = function() {
    const grid = document.getElementById('admin-gallery-grid');
    if(!grid) return;
    grid.innerHTML = galleryData.map(img => `
        <div class="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800">
            <img src="${img.url || img}" class="w-full h-full object-cover">
            <button onclick="window.deleteGalleryPhotoSecurely('${img.id}')" class="absolute top-2 right-2 bg-red-600 p-1 rounded-lg text-white">X</button>
        </div>`).join('');
    if(window.lucide) lucide.createIcons();
};

window.uploadNewGalleryPhotoDirectly = async function() {
    const u = document.getElementById('gallery-image-url-input').value;
    if(!u) return;
    const id = 'gal_' + Date.now();
    const p = { id, url: u, timestamp: Date.now() };
    await NetworkEngine.safeWrite('gallery', id, p);
    galleryData.unshift(p); renderAdminGalleryGridUI();
    document.getElementById('gallery-image-url-input').value = '';
};

window.deleteGalleryPhotoSecurely = async function(id) {
    if(!confirm("حذف الصورة نهائياً؟")) return;
    await NetworkEngine.safeDelete('gallery', id);
    galleryData = galleryData.filter(i => i.id !== id); renderAdminGalleryGridUI();
};

async function uploadGalleryToCloud(e) {
    const file = e.target.files[0]; if(!file) return;
    const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', 'gct8i28h');
    try {
        const res = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if(data.secure_url) {
            const id = 'gal_' + Date.now();
            const p = { id, url: data.secure_url, timestamp: Date.now() };
            await NetworkEngine.safeWrite('gallery', id, p);
            galleryData.unshift(p); renderAdminGalleryGridUI();
        }
    } catch(e) {}
}