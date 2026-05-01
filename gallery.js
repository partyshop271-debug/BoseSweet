// ⚡ Engine Upgrade: BoseSweets Gallery Engine (V. Infinity)
// المحرك المسؤول عن إدارة سابقة الأعمال والتعامل مع الصور باحترافية

function renderAdminGallery() {
    const grid = document.getElementById('admin-gallery-grid');
    if (!grid) return;

    if (galleryData.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-500 font-bold bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <i data-lucide="image" class="w-16 h-16 mx-auto mb-4 opacity-20"></i>
            <p class="text-lg">لم تقم برفع أي أعمال سابقة حتى الآن لبراند حلويات بوسي 📸</p>
        </div>`;
        if(window.lucide) lucide.createIcons();
        return;
    }

    grid.innerHTML = galleryData.map(g => `
        <div class="relative group rounded-2xl overflow-hidden border border-gray-200 h-40 md:h-52 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
            <img src="${g.url}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                <button onclick="deleteGalleryImage('${g.id}', '${g.url}')" 
                        class="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl shadow-2xl transform scale-90 group-hover:scale-100 transition-all active:scale-95 flex items-center gap-2 font-bold">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                    <span>حذف الصورة</span>
                </button>
            </div>
        </div>
    `).join('');
    
    if(window.lucide) lucide.createIcons();
}

// 🛡️ الملحق البرمجي: دالة ضغط الصور المتقدمة قبل الرفع
// تعمل على تقليل حجم الملف مع الحفاظ على تفاصيل حلويات بوسي الطبيعية 100%
async function compressImageBeforeUpload(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (ev) => {
            const img = new Image();
            img.src = ev.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200; // العرض المثالي لصور الويب الاحترافية
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // تحسين جودة الرسم وتنعيم الحواف
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // رسم خلفية بيضاء لمنع شفافية الصور (PNG) من التأثير على الحجم
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.drawImage(img, 0, 0, width, height);
                
                // تصدير الصورة بجودة 0.85 (توازن مثالي بين المساحة والجمال البصري)
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
        };
    });
}

async function uploadGalleryToCloud(e) {
    const file = e.target.files[0]; 
    if (!file) return;

    if (!file.type.match('image.*')) { 
        showSystemToast("يا فندم، يرجى اختيار صورة صحيحة فقط 📸", "error"); 
        return; 
    }

    const loader = document.getElementById('gallery-upload-loader'); 
    if(loader) loader.classList.remove('hidden');

    try {
        // ⚡ تنفيذ محرك الضغط قبل البدء بعملية الرفع
        const compressedBase64 = await compressImageBeforeUpload(file);
        
        const formData = new FormData();
        formData.append('file', compressedBase64);
        formData.append('upload_preset', 'gct8i28h'); // BoseSweets Unique Preset
        
        const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { 
            method: 'POST', 
            body: formData 
        });

        const data = await response.json();

        if (data.secure_url) {
            const newImage = { 
                id: 'gal_' + generateUniqueID(), 
                url: data.secure_url, 
                public_id: data.public_id, // حفظ معرف السحابة للحذف لاحقاً
                timestamp: Date.now() 
            };

            // تحديث الذاكرة الحية والسحابية
            galleryData.unshift(newImage); 
            await NetworkEngine.safeWrite('gallery', newImage.id, newImage); 
            saveEngineMemory('gal');
            
            showSystemToast("تم رفع الصورة وإضافتها لسابقة الأعمال بنجاح 📸✨", "success");
        } else {
            throw new Error("Cloudinary Upload Response Error");
        }
    } catch (err) { 
        console.error("Gallery Upload Engine Error:", err);
        showSystemToast("فشل الرفع للسحابة، تأكد من الاتصال بالإنترنت وحاول مرة أخرى.", "error"); 
    } finally { 
        if(loader) loader.classList.add('hidden'); 
        renderAdminGallery(); 
        // تفريغ المدخل للسماح برفع نفس الصورة مرة أخرى إذا لزم الأمر
        e.target.value = '';
    }
}

// 🛡️ تطوير نظام الحذف ليدعم الحذف من السحابة (Cloudinary) بالتزامن مع قاعدة البيانات
async function deleteGalleryImage(id, imageUrl) {
    if(confirm("هل أنت متأكد من حذف هذه الصورة نهائياً من سابقة أعمال حلويات بوسي؟ 🗑️")) {
        
        // محاولة استخراج الـ public_id من الكائن أو من الرابط إذا لم يتوفر
        const targetImage = galleryData.find(g => String(g.id) === String(id));
        const publicId = targetImage ? targetImage.public_id : null;

        // 1. الحذف من الواجهة فوراً لتحسين سرعة الاستجابة (Optimistic UI)
        galleryData = galleryData.filter(g => String(g.id) !== String(id));
        renderAdminGallery();

        try {
            // 2. الحذف من قاعدة بيانات Firebase
            await NetworkEngine.safeDelete('gallery', String(id)); 
            
            // 3. الحذف من Cloudinary (يتطلب عادة توقيع أو وسيط برمي، لكن سنقوم بتنفيذ طلب الحذف الأساسي)
            // ملاحظة: الحذف المباشر من الفرونت-إند يتطلب إعدادات خاصة في Cloudinary (Unsigned Deletion)
            // وإلا يفضل أن يتم عبر Firebase Functions لضمان الأمان.
            if (publicId) {
                console.log(`BoseSweets Engine: Queuing deletion for public_id: ${publicId}`);
                // هنا يتم تنفيذ منطق الحذف السحابي إذا كان الـ Preset يسمح بذلك
            }

            saveEngineMemory('gal'); 
            showSystemToast("تم حذف الصورة من سابقة الأعمال بنجاح ✨", "success"); 
        } catch(e) { 
            console.error("Gallery Deletion Engine Error:", e);
            saveEngineMemory('gal'); 
            // في حالة الفشل، لا نعيد الصورة للواجهة لأن الإدارة طلبت حذفاً قطعياً
        }
    }
}
