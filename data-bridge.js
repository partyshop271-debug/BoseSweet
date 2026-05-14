/**
 * ============================================================================
 * 👑 BoseSweets Data Bridge | جسر البيانات الديناميكي المتطور
 * ============================================================================
 * الإصدار: V2.2 - Sovereign Integration & Asset Safety Edition
 * الوظيفة: جلب البيانات حياً من الفايربيز مع دعم التخزين المؤقت المحلي، ضخ الكروت التفاعلية،
 * ومعالجة أمنية متقدمة لمنع ظهور أيقونات الصور المكسورة.
 */

import boseConfig from './core-engine.js';

// الرابط الرسمي لشعار العلامة التجارية "حلويات بوسي" كبديل آمن في حالة الخطأ
const BOSE_LOGO_FALLBACK = "https://res.cloudinary.com/demo/image/upload/v1712586716/logo_bose_gold.jpg";

// قائمة المنتجات الاحتياطية الكاملة (تضمن بقاء الموقع حياً وسريعاً جداً في وضع الأوفلاين)
const localCatalog = [
    {
        id: 'dp_nutella',
        name: 'ديسباسيتو نوتيلا',
        category: 'ديسباسيتو',
        desc: 'قاعدة كثيفة من فادج كيك الشيكولاتة الغني، تعلوها طبقة سميكة وسخية من صوص النوتيلا الأصلي.',
        price: 66,
        size: 'مثلث',
        img: 'v1712586716/logo_bose_gold.jpg',
        badge: 'مبيعاً 🔥',
        inStock: true,
        isActive: true
    },
    {
        id: 'dp_lotus',
        name: 'ديسباسيتو لوتس',
        category: 'ديسباسيتو',
        desc: 'مزيج فاخر يجمع بين كيك الفادج المشبع وزبدة اللوتس الكثيفة، لتقديم تجربة تذوق استثنائية.',
        price: 66,
        size: 'مثلث',
        img: 'v1712586716/logo_bose_gold.jpg',
        badge: 'مبيعاً 🔥',
        inStock: true,
        isActive: true
    },
    {
        id: 'cn_classic',
        name: 'سينابون كلاسيك',
        category: 'سينابون',
        desc: 'لفائف القرفة الأصلية المحضرة من عجينة الخميرة القطنية الهشة، مغطاة بصوص الجبن الكريمي المخصوص.',
        price: 45,
        size: 'قطعة',
        img: 'v1712586716/logo_bose_gold.jpg',
        badge: 'جديد 🌟',
        inStock: true,
        isActive: true
    }
];

/**
 * دالة مركزية لجلب البيانات حياً من قاعدة البيانات السحابية (Firestore)
 * تدعم التحول التلقائي للمصفوفة المحلية حال تذبذب الشبكة
 */
export async function fetchProducts() {
    try {
        const db = boseConfig.db;
        if (!db) {
            console.warn("BoseSweets Guard: لم يتم العثور على محرك قاعدة البيانات السحابية، سيتم العرض من الذاكرة المحلية مؤقتاً.");
            return localCatalog;
        }

        // جلب مجموعة المنتجات النشطة من الفايربيز
        const snapshot = await db.collection('catalog').where('isActive', '==', true).get();
        if (snapshot.empty) {
            console.log("BoseSweets Guard: سحابة المنتجات فارغة حالياً، جاري ملء البيانات الافتراضية.");
            return localCatalog;
        }

        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        // مزامنة الكتالوج في نطاق الذاكرة الحية (Global State)
        window.catalog = products;
        return products;
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'data-bridge.js', null, null, 'fetchProducts');
        console.warn("BoseSweets Engine: تعذر الاتصال بالسحابة حالياً، تفعيل وضع الطوارئ المحلي.", error.message);
        return localCatalog;
    }
}
window.fetchProducts = fetchProducts;

/**
 * دالة مسؤولة عن بناء وتوليد كروت المنتجات السيادية بنظام الجريد التفاعلي المتطور
 * @param {Array} products - مصفوفة المنتجات
 * @param {String} containerId - اسم الحاوية (Div ID) في الـ HTML
 */
export function renderProductCards(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; font-weight: bold; opacity: 0.6; padding: 20px;">نجهز لكم أصنافاً جديدة فاخرة.. انتظرونا ✨</p>`;
        return;
    }

    let html = '';
    products.forEach(p => {
        const pIdSafe = String(p.id || '');
        const isOutOfStock = p.inStock === false || p.isActive === false;
        
        // --- 🛡️ منطق معالجة واستخلاص الروابط الآمن لصور منتجات علامة حلويات بوسي التجارية ---
        let rawImg = p.img || (p.images && p.images.length > 0 ? p.images[0] : 'v1712586716/logo_bose_gold.jpg');
        let finalImgUrl = "";

        if (rawImg.startsWith('http') || rawImg.startsWith('https')) {
            finalImgUrl = rawImg;
        } else {
            // معالجة وتنظيف الرابط الأساسي من أي سلاش زائد لضمان سلامة بناء المسار
            const baseUrl = boseConfig.cloudinary.baseDeliveryUrl.replace(/\/$/, '');
            const cleanPath = rawImg.replace(/^\//, '');
            finalImgUrl = `${baseUrl}/${cleanPath}`;
        }
        
        // إضافة شارات الخصومات أو التميز (جديد / الأكثر مبيعاً) المتوافقة مع ألوان الهيكل
        let badgeHtml = '';
        if (p.badge) {
            badgeHtml = `<div style="position: absolute; top: 15px; right: 15px; z-index: 10; background: ${boseConfig.branding.colors.white}; color: ${boseConfig.branding.colors.pink}; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; border: 2px solid ${boseConfig.branding.colors.pink}; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">${p.badge}</div>`;
        }

        html += `
        <div id="product-card-${pIdSafe}" class="royal-card flex flex-col p-4 relative" style="background: ${boseConfig.branding.colors.white}; min-height: 400px; border-radius: 2rem;">
            ${badgeHtml}
            
            <div class="w-full aspect-square overflow-hidden rounded-[1.5rem] relative mb-4" onclick="if(window.navigateToProduct) window.navigateToProduct('${pIdSafe}'); else window.location.href='product.html?product=${pIdSafe}'">
                <img src="${finalImgUrl}" 
                     onerror="this.onerror=null; this.src='${BOSE_LOGO_FALLBACK}';" 
                     class="w-full h-full object-cover transition-transform duration-500 hover:scale-110 cursor-pointer ${isOutOfStock ? 'grayscale opacity-60' : ''}" 
                     alt="${p.name} - حلويات بوسي" 
                     loading="lazy">
                ${isOutOfStock ? `<div style="position: absolute; inset:0; background: rgba(255,255,255,0.5); display:flex; align-items:center; justify-content:center; backdrop-filter: blur(2px);"><span style="background: ${boseConfig.branding.colors.pink}; color: white; padding: 6px 16px; border-radius: 8px; font-weight: 900; font-size: 0.85rem; border: 2px solid white;">نفدت مؤقتاً</span></div>` : ''}
            </div>

            <div class="flex flex-col flex-1 text-center justify-between space-y-3">
                <div>
                    <h4 class="text-xl font-black" style="color: ${boseConfig.branding.colors.dark};">${p.name}</h4>
                    <p class="text-xs font-bold opacity-80 mt-1 line-clamp-2" style="color: ${boseConfig.branding.colors.dark}; line-height: ${boseConfig.branding.typography.lineHeight};">${p.desc || p.description || ''}</p>
                </div>

                <div class="mt-auto space-y-3 pt-2" style="border-top: 1px dashed rgba(255,145,164,0.2);">
                    <div class="flex items-center justify-center font-black text-2xl" style="color: ${boseConfig.branding.colors.pink};">
                        <span>${p.price} ج.م</span>
                    </div>
                    
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-pink-100">
                            <button onclick="if(window.updateTempQtyContext) window.updateTempQtyContext(this, -1)" class="w-8 h-8 flex items-center justify-center bg-white rounded-full text-sm font-black border border-pink-200" style="color: ${boseConfig.branding.colors.pink};">-</button>
                            <span class="temp-qty-display font-black text-sm px-2" style="color: ${boseConfig.branding.colors.dark}; min-w: 20px;" data-prod-id="${pIdSafe}">1</span>
                            <button onclick="if(window.updateTempQtyContext) window.updateTempQtyContext(this, 1)" class="w-8 h-8 flex items-center justify-center bg-white rounded-full text-sm font-black border border-pink-200" style="color: ${boseConfig.branding.colors.pink};">+</button>
                        </div>

                        ${isOutOfStock ? 
                            `<button class="flex-1 py-2.5 rounded-full font-black text-xs cursor-not-allowed bg-gray-100 text-gray-400">غير متوفر</button>` : 
                            `<button onclick="if(window.addWithQtyContext) window.addWithQtyContext(this, '${pIdSafe}'); else if(window.addToCart) window.addToCart('${pIdSafe}');" class="flex-1 py-2.5 rounded-full font-black text-xs text-white btn-premium-action transition-all" style="background: ${boseConfig.branding.colors.pink}; border: 2px solid ${boseConfig.branding.colors.pink}; box-shadow: 0 8px 20px rgba(255,145,164,0.2);">إضافة 🛍️</button>`
                        }
                    </div>
                </div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}
window.renderProductCards = renderProductCards;

/**
 * الاستماع الفوري لدورة حياة الصفحات لحقن المحتوى ديناميكياً فور جاهزية البيانات
 */
document.addEventListener('DOMContentLoaded', async () => {
    // تشغيل محرك الجلب المركزي
    const products = await fetchProducts();

    // 1. حاوية "وصل حديثاً" بالصفحة الرئيسية
    if (document.getElementById('new-arrivals-container')) {
        const newProducts = products.filter(p => p.badge && (p.badge.includes('جديد') || p.badge.includes('🌟')));
        const fallbackNew = newProducts.length > 0 ? newProducts : products.slice(0, 4);
        renderProductCards(fallbackNew, 'new-arrivals-container');
    }

    // 2. حاوية "الأكثر مبيعاً" بالصفحة الرئيسية
    if (document.getElementById('best-sellers-container')) {
        const bestSellers = products.filter(p => p.badge && (p.badge.includes('مبيعاً') || p.badge.includes('🔥')));
        const fallbackBest = bestSellers.length > 0 ? bestSellers : products.slice().reverse().slice(0, 4);
        renderProductCards(fallbackBest, 'best-sellers-container');
    }

    // 3. الترشيحات الذكية داخل صفحات التفاصيل وعربات الشراء
    const suggestedContainer = document.getElementById('suggested-products-container') || document.getElementById('cart-suggestions-container');
    if (suggestedContainer) {
        // تقديم تشكيلة منوعة عشوائية لكسر رتابة التكرار للعميل
        const mixedSuggestions = products.sort(() => 0.5 - Math.random()).slice(0, 4);
        renderProductCards(mixedSuggestions, suggestedContainer.id);
    }
});
