// === BoseSweets Gallery Engine: Visual Identity & Lightbox ===

const galleryDb = firebase.firestore();

/**
 * جلب وتشغيل معرض الصور في شاشة العميل
 */
async function loadGallery() {
    try {
        const gallerySnap = await galleryDb.collection('gallery').get();
        const galleryItems = [];
        gallerySnap.forEach(doc => galleryItems.push(doc.data()));

        const slider = document.getElementById('gallery-slider');
        const section = document.getElementById('gallery-customer-section');

        if (galleryItems.length > 0 && slider) {
            section.classList.remove('hidden');
            slider.innerHTML = galleryItems.map(item => `
                <div class="min-w-[200px] md:min-w-[300px] aspect-[4/5] rounded-2xl overflow-hidden shadow-md border-2 border-white cursor-pointer transition-transform hover:scale-95 active:scale-90"
                     onclick="openLightbox('${item.url}')">
                    <img src="${item.url}" class="w-full h-full object-cover" loading="lazy">
                </div>
            `).join('');
        }
    } catch (e) {
        console.error("Gallery Load Error:", e);
    }
}

/**
 * فتح الصورة بالحجم الكامل (Lightbox)
 */
function openLightbox(url) {
    const lightbox = document.getElementById('gallery-lightbox');
    const img = document.getElementById('lightbox-img');
    if (lightbox && img) {
        img.src = url;
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        document.body.style.overflow = 'hidden'; // منع التمرير عند الفتح
    }
}

/**
 * إغلاق نافذة العرض الكامل
 */
function closeLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    if (lightbox) {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
        document.body.style.overflow = 'auto'; // إعادة التمرير
    }
}

// تشغيل المعرض عند التحميل
document.addEventListener('DOMContentLoaded', loadGallery);

