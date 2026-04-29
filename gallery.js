function renderAdminGallery() {
    const grid = document.getElementById('admin-gallery-grid');
    if (galleryData.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-8 text-center text-gray-500 font-bold"><i data-lucide="image" class="w-12 h-12 mx-auto mb-2 opacity-50"></i> لم تقم برفع أي أعمال سابقة حتى الآن.</div>`;
        lucide.createIcons(); return;
    }
    grid.innerHTML = galleryData.map(g => `
        <div class="relative group rounded-xl overflow-hidden border border-gray-600 h-32 md:h-40">
            <img src="${g.url}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button onclick="deleteGalleryImage('${g.id}')" class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

async function uploadGalleryToCloud(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.match('image.*')) { showSystemToast("الرجاء اختيار صورة فقط", "error"); return; }
    const loader = document.getElementById('gallery-upload-loader'); loader.classList.remove('hidden');
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = function(ev) {
        const img = new Image(); img.src = ev.target.result;
        img.onload = async function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 1200; let scaleSize = 1;
            if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
            canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64Str = canvas.toDataURL('image/jpeg', 0.85);
            try {
                const formData = new FormData(); formData.append('file', base64Str); formData.append('upload_preset', 'gct8i28h'); 
                const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) {
                    const newImage = { id: 'gal_' + generateUniqueID(), url: data.secure_url, timestamp: Date.now() };
                    galleryData.unshift(newImage); await NetworkEngine.safeWrite('gallery', newImage.id, newImage); saveEngineMemory('gal');
                    showSystemToast("تم رفع الصورة وإضافتها لسابقة الأعمال بنجاح 📸", "success");
                } else throw new Error("Upload failed");
            } catch (err) { showSystemToast("فشل الرفع للسحابة، تأكد من الاتصال بالإنترنت.", "error"); } 
            finally { loader.classList.add('hidden'); renderAdminGallery(); }
        }
    }
}

async function deleteGalleryImage(id) {
    if(confirm("هل أنت متأكد من حذف هذه الصورة من سابقة الأعمال؟")) {
        galleryData = galleryData.filter(g => String(g.id) !== String(id));
        try { await NetworkEngine.safeDelete('gallery', String(id)); saveEngineMemory('gal'); showSystemToast("تم الحذف بنجاح", "success"); } 
        catch(e) { saveEngineMemory('gal'); }
        renderAdminGallery();
    }
}
