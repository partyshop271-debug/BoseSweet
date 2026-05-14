/**
 * ============================================================================
 * 👑 BoseSweets Data Bridge | جسر البيانات الديناميكي
 * ============================================================================
 * الإصدار: V1.0
 * الوظيفة: جلب المنتجات من السحابة (أو الذاكرة المحلية) وضخها في واجهات العميل.
 */

// قائمة المنتجات الأساسية (محملة مسبقاً لضمان سرعة العرض حتى قبل الاتصال بالسحابة)
// تم مراجعة المكونات لضمان الدقة الاحترافية (فادج للديسباسيتو، وعجينة خميرة للسينابون)
const localCatalog = [
    {
        id: 'dp_nutella',
        name: 'ديسباسيتو نوتيلا',
        category: 'ديسباسيتو',
        description: 'قاعدة كثيفة من فادج كيك الشيكولاتة الغني، تعلوها طبقة سميكة وسخية من صوص النوتيلا الأصلي.',
        price: 66,
        size: 'مثلث',
        image: 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg', // سيتم استبدالها بصورة المنتج الحقيقية
        isNew: true,
        isBestSeller: true
    },
    {
        id: 'dp_lotus',
        name: 'ديسباسيتو لوتس',
        category: 'ديسباسيتو',
        description: 'مزيج فاخر يجمع بين كيك الفادج المشبع وزبدة اللوتس الكثيفة، لتقديم تجربة تذوق استثنائية.',
        price: 66,
        size: 'مثلث',
        image: 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg',
        isNew: false,
        isBestSeller: true
    },
    {
        id: 'cn_classic',
        name: 'سينابون كلاسيك',
        category: 'سينابون',
        description: 'لفائف القرفة الأصلية المحضرة من عجينة الخميرة القطنية الهشة، مغطاة بصوص الجبن الكريمي المخصوص.',
        price: 45,
        size: 'قطعة',
        image: 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg',
        isNew: true,
        isBestSeller: false
    }
];

/**
 * دالة مركزية لجلب البيانات (تستطيع لاحقاً الاتصال بـ Firebase)
 */
async function fetchProducts() {
    // في المستقبل، سيتم استبدال هذا السطر بكود يجلب البيانات من Firebase
    return localCatalog; 
}

/**
 * دالة مسؤولة عن بناء وتوليد كروت المنتجات في أي صفحة
 * @param {Array} products - مصفوفة المنتجات
 * @param {String} containerId - اسم الحاوية (Div ID) في الـ HTML
 */
function renderProductCards(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; // إذا لم يكن القسم موجوداً في الصفحة الحالية، تخطاه

    let html = '';
    products.forEach(product => {
        // نستخدم التصميم السيادي لكارت المنتج الذي أسسناه في style.css
        html += `
        <div class="product-card" style="min-width: 250px; cursor: pointer;" onclick="window.location.href='product.html?id=${product.id}'">
            <div class="product-img-wrapper">
                <img src="${product.image}" alt="${product.name}">
                ${product.isNew ? '<span style="position: absolute; top: 10px; right: 10px; background: var(--primary-pink); color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;">جديد</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${product.price} ج.م</div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * عند تحميل أي صفحة، نقوم بفحص الأقسام الموجودة وتعبئتها بالبيانات
 */
document.addEventListener('DOMContentLoaded', async () => {
    const products = await fetchProducts();

    // 1. إذا كنا في الصفحة الرئيسية - تعبئة "وصل حديثاً"
    if (document.getElementById('new-arrivals-container')) {
        const newProducts = products.filter(p => p.isNew);
        renderProductCards(newProducts, 'new-arrivals-container');
    }

    // 2. إذا كنا في الصفحة الرئيسية - تعبئة "الأكثر مبيعاً"
    if (document.getElementById('best-sellers-container')) {
        const bestSellers = products.filter(p => p.isBestSeller);
        renderProductCards(bestSellers, 'best-sellers-container');
    }

    // 3. إذا كنا في صفحة تفاصيل المنتج أو السلة - تعبئة "قد يعجبك أيضاً"
    if (document.getElementById('suggested-products-container') || document.getElementById('cart-suggestions-container')) {
        // اقتراح عشوائي مبسط حتى يتم تفعيل المستشعر الذكي
        const suggestions = products.slice(0, 4); 
        renderProductCards(suggestions, 'suggested-products-container');
        renderProductCards(suggestions, 'cart-suggestions-container');
    }
});
