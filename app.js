(function () {
    // تأسيس النطاق الموحد الحاكم والآمن على نافذة المتصفح لمنع تضارب الملفات مستقبلاً
    window.BoseSweets = {
        Core: {},
        // قاعدة البيانات المحلية المدمجة: خط الدفاع الصلب والكامل لحماية المنتجات والأسعار من انقطاع الاتصال بالإنترنت
        LocalDatabase: {
            store: {
                name: "حلويات بوسي",
                slogan: "صنعناها بحب لتهديها لمن تحب",
                phone: "01097238441",
                address: "الكفاح - شارع الوحدة المحلية - بجوار صيدلية الدكتور أحمد مجدي وبجوار عيادة الدكتور علي"
            },
            // المنتجات المعتمدة والمطابقة لوثائق النشاط بالوصف الدقيق غير المبالغ فيه
            products: [
                {
                    id: "despacito-box",
                    title: "طاجن ديسباسيتو حلويات بوسي",
                    flavor: "شوكولاتة بلجيكية غنية مع فدج طازج",
                    description: "تم تحضير المكونات بعناية فائقة للحصول على أفضل جودة، كيكة فدج غنية مشبعة بصوص الشوكولاتة الأصلي تعلوها طبقة مقرمشة فاخرة تناسب تجمعاتكم السعيدة.",
                    price: 120,
                    image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
                    category: "despacito",
                    tags: ["best-seller", "new"]
                },
                {
                    id: "qashtoutah-nuts",
                    title: "قشطوطة بالمكسرات المحمصة",
                    flavor: "قشطة بلدي طبيعية 100% ومكسرات طازجة",
                    description: "كيكة الحليب التركية الفاخرة مشربة باللبن الطازج بالكامل، تعلوها طبقة غنية من القشطة البلدية والمكسرات المقرمشة المنتقاة لراحة تذوق عميلنا.",
                    price: 140,
                    image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
                    category: "qashtoutah",
                    tags: ["best-seller"]
                },
                {
                    id: "box-roqan-luxury",
                    title: "بوكس الروقان الشامل",
                    flavor: "تشكيلة حصرية من الكبات والميني جاتوه",
                    description: "تم تصميم وتجميع هذه التشكيلة لتناسب مختلف الأوقات واللمات، تحتوي على توليفة منوعة من أكثر قطعنا طلباً وشهرة لتوفر قيمة رائعة تشرفكم.",
                    price: 250,
                    image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
                    category: "boxes",
                    tags: ["new"]
                }
            ]
        },
        Runtime: {
            state: {
                currentRoute: 'home',
                cart: [],
                products: []
            },
            events: {}
        }
    };

    const Core = window.BoseSweets.Core;
    const Runtime = window.BoseSweets.Runtime;
    const LocalDb = window.BoseSweets.LocalDatabase;

    // محرك إدارة وتتبع الأحداث المركزي (Event Bus)
    Core.listen = function (eventName, callback) {
        if (!Runtime.events[eventName]) {
            Runtime.events[eventName] = [];
        }
        Runtime.events[eventName].push(callback);
    };

    Core.emit = function (eventName, payload) {
        if (Runtime.events[eventName]) {
            Runtime.events[eventName].forEach(callback => {
                try { callback(payload); } catch (e) { console.error(`خطأ بالحدث ${eventName}:`, e); }
            });
        }
    };

    Core.getState = function () { return Runtime.state; };
    
    Core.setState = function (newState) {
        Runtime.state = { ...Runtime.state, ...newState };
        Core.emit('system.state.changed', Runtime.state);
    };

    // محرك جلب المنتجات الذكي: يشحن البيانات المحلية فورا لحماية الموقع من الفراغ الفايربيزي
    Core.loadProducts = function () {
        console.log("تفعيل خط الدفاع الأول: جاري ضخ المنتجات المدمجة محلياً لضمان السرعة المطلقة للموقع...");
        Core.setState({ products: LocalDb.products });
        Core.renderStorefront();
    };

    // محرك رندرة وبناء الكروت بالهيكل الموحد المعتمد
    Core.renderStorefront = function () {
        const products = Core.getState().products;
        
        const bestSellersContainer = document.getElementById('best-sellers-carousel');
        const newArrivalsContainer = document.getElementById('new-arrivals-carousel');
        const gridContainer = document.getElementById('products-grid-view');

        if (!bestSellersContainer || !gridContainer) return;

        bestSellersContainer.innerHTML = '';
        if (newArrivalsContainer) newArrivalsContainer.innerHTML = '';
        gridContainer.innerHTML = '';

        products.forEach(product => {
            // كود الكارت الموحد بحدوده البمبية الناعمة والتنفس البصري والعداد المرن للموبايل
            const cardHtml = `
                <div class="bs-product-card" data-id="${product.id}">
                    <img src="${product.image}" alt="${product.title}" class="card-product-image" loading="lazy">
                    <h3 class="card-product-title">${product.title}</h3>
                    <div class="card-flavor-title">${product.flavor}</div>
                    <p class="card-product-description">${product.description}</p>
                    
                    <div class="card-footer-action-row">
                        <div class="card-price-value">${product.price} EGP</div>
                        
                        <div class="card-quantity-counter">
                            <button class="counter-btn" onclick="BoseSweets.Core.updateCardQty('${product.id}', -1)">-</button>
                            <span class="counter-value" id="qty-${product.id}">1</span>
                            <button class="counter-btn" onclick="BoseSweets.Core.updateCardQty('${product.id}', 1)">+</button>
                        </div>
                        
                        <button class="card-add-to-cart-btn" onclick="BoseSweets.Core.addToCart('${product.id}')">إضافة للسلة</button>
                    </div>
                </div>
            `;

            // التوزيع الذكي والتلقائي للمنتجات داخل واجهات الأقسام بناءً على دلالات التاجات
            if (product.tags.includes('best-seller')) {
                bestSellersContainer.innerHTML += cardHtml;
            }
            if (product.tags.includes('new') && newArrivalsContainer) {
                newArrivalsContainer.innerHTML += cardHtml;
            }
            gridContainer.innerHTML += cardHtml;
        });
    };

    // التحكم الذكي بعدادات كمية الكروت لتجربة لمس مريحة بالموبايل والكمبيوتر
    Core.updateCardQty = function (productId, change) {
        const qtyElement = document.getElementById(`qty-${productId}`);
        if (qtyElement) {
            let currentQty = parseInt(qtyElement.innerText) || 1;
            currentQty += change;
            if (currentQty < 1) currentQty = 1;
            qtyElement.innerText = currentQty;
        }
    };

    // التفاعل الفوري الراقي عند الضغط على إضافة للسلة
    Core.addToCart = function (productId) {
        const qtyElement = document.getElementById(`qty-${productId}`);
        const qty = qtyElement ? parseInt(qtyElement.innerText) : 1;
        console.log(`نواة الحركة: تمت إضافة المنتج ${productId} بكمية ${qty} للمشتريات محلياً.`);
        
        // إشعار مباشر خفيف وواضح ومفهوم للجميع دون تعقيد أو بطء
        alert("تمت إضافة المنتج إلى السلة.");
    };

    // نظام التوجيه والتنقل لربط مسارات الموقع وصفحاته مستقبلاً بنعومة كاملة
    Core.navigate = function (route) {
        Core.setState({ currentRoute: route });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // الإقلاع الرسمي الوحيد والموحد للموقع (System Bootstrap)
    Core.bootstrap = function () {
        console.log("تم تشغيل وتهيئة النظام والمحرك المحلي لـ حلويات بوسي بنجاح تام.");
        Core.loadProducts();
    };

    // التشغيل الفوري الآمن فور جاهزية مستند المتصفح
    document.addEventListener('DOMContentLoaded', () => {
        Core.bootstrap();
    });
})();