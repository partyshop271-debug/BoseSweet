(function () {
    window.BoseSweets = {
        Core: {},
        LocalDatabase: {
            categories: [
                { id: "cakes", name: "التورت" }, { id: "gateaux", name: "الجاتوهات" },
                { id: "qashtota", name: "القشطوطة" }, { id: "despacito", name: "الديسباسيتو" },
                { id: "cinnabon", name: "السينابون" }, { id: "donuts", name: "الدوناتس" },
                { id: "red-velvet", name: "الريدڤيلڤت" }, { id: "cupcake", name: "الكب كيك" },
                { id: "mini-cake", name: "الميني تورت" }, { id: "flowers", name: "الورد" },
                { id: "happiness-cups", name: "كبات السعادة" }, { id: "relax-box", name: "بوكس الروقان" }
            ],
            products: [
                { id: "p1", title: "طاجن ديسباسيتو كبير", flavor: "نوتيلا دارك فاخرة", description: "تم اختيار المكونات بعناية للحصول على أفضل جودة، كيك فادج مشبع بالشوكولاتة البلجيكية الغنية بطعم واضح ومميز.", price: 264, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller", "new-arrival"] },
                { id: "p2", title: "قشطوطة المكسرات", flavor: "بيستاشيو أصلي طازج", description: "كيكة الحليب التركية الغنية مشربة باللبن بالكامل تعلوها طبقة ناعمة من القشطة البلدية والمكسرات المحمصة.", price: 143, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "p3", title: "دوناتس بوكس", flavor: "ماتيلدا شوكولاتة", description: "دوناتس طازجة ومخبوزة يوم بيوم بقوام قطني خفيف وحشوات منتقاة بعناية لتوفر روعة المذاق الحقيقي.", price: 110, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival"] },
                { id: "p4", title: "لفات سينابون فاخر", flavor: "كلاسيك كريم تشيز", description: "سينابون هباري طري غني بصوص الجبن السري والقرفة السيلانية الممتازة لتجربة تذوق دافئة ومثالية.", price: 121, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p5", title: "كبات السعادة الحصرية", flavor: "لوتس بلجيكي مقرمش", description: "طبقات من السعادة المحضرة بحب في كبات فردية فاخرة تناسب التقديم والضيافة الراقية ولمات العيلة.", price: 61, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p6", title: "ميني تورتة مناسبات", flavor: "فانيليا وتوت بري طازج", description: "تورتة ميني مصممة لشخصين من أجود أنواع الكريمة الطبيعية والفواكه الطازجة لتوفر طعماً يشرفكم.", price: 154, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p7", title: "بوكس الروقان الكامل", flavor: "ميكس كبات وجاتوه منوع", description: "تم تنسيق هذا البوكس بعناية ليجمع أفضل قطعنا مبيعاً وشهرة في علبة واحدة منسقة للفخامة والروقان.", price: 550, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p8", title: "قطع جاتوه سوبريم", flavor: "فواكه مشكلة وكريمة غنية", description: "قطع جاتوه محضرة يومياً بخامات ممتازة تضمن أعلى مستويات النضارة والطعم الأصلي المميز لكل قطعة.", price: 324, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] }
            ]
        },
        Runtime: {
            state: { products: [], categories: [], showAllProducts: false, currentCraftIndex: 0 },
            craftTimer: null
        }
    };

    const Core = window.BoseSweets.Core;
    const LocalDb = window.BoseSweets.LocalDatabase;
    const Runtime = window.BoseSweets.Runtime;

    Core.init = function () {
        Runtime.state.products = LocalDb.products;
        Runtime.state.categories = LocalDb.categories;
        Core.renderStorefrontUI();
        Core.startCraftsmanshipSlider();
    };

    Core.renderStorefrontUI = function () {
        const state = Runtime.state;
        
        // 1. بناء الشلال العمودي
        const w1 = document.getElementById('waterfall-column-1');
        const w2 = document.getElementById('waterfall-column-2');
        if (w1 && w2) {
            const placeholder = `<img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="waterfall-img-item" alt="Placeholder">`;
            w1.innerHTML = Array(4).fill(placeholder).join('');
            w2.innerHTML = Array(4).fill(placeholder).join('');
        }

        // 2. بناء سلايدر عقد من الإتقان بـ 3 صور متصلة و 3 دوتس فقط
        const craftTrack = document.getElementById('craftsmanship-slider-track');
        const craftDots = document.getElementById('craftsmanship-slider-dots');
        if (craftTrack && craftDots) {
            craftTrack.innerHTML = Array(3).fill(`<div class="full-slider-image-link"><img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="slider-full-img" alt="إتقان"></div>`).join('');
            craftDots.innerHTML = Array(3).fill(`<span class="dot-node"></span>`).join('');
            craftDots.children[0].classList.add('active');
        }

        // 3. بناء شبكات المجموعات بالهيكل الموحد الصارم للعداد والكارت
        const bestSellersTrack = document.getElementById('best-sellers-slider-container');
        const newArrivalsTrack = document.getElementById('new-arrivals-slider-container');
        const productsGrid = document.getElementById('storefront-products-grid-container');

        if (bestSellersTrack) bestSellersTrack.innerHTML = '';
        if (newArrivalsTrack) newArrivalsTrack.innerHTML = '';
        if (productsGrid) productsGrid.innerHTML = '';

        let ourProductsCount = 0;

        state.products.forEach(product => {
            // الهيكل الموحد الملتزم حرفياً بوثيقة التشغيل
            const cardHtml = `
                <div class="bs-product-card" data-id="${product.id}">
                    <img src="${product.image}" class="card-image-box" alt="${product.title}" loading="lazy">
                    <h3 class="card-title-text">${product.title}</h3>
                    <div class="card-flavor-text">${product.flavor}</div>
                    <p class="card-desc-paragraph">${product.description}</p>
                    <div class="card-meta-action-row">
                        <div class="card-quantity-selector">
                            <button class="selector-action-btn" onclick="BoseSweets.Core.adjustQty('${product.id}', 1)">+</button>
                            <span class="selector-value-display" id="qty-node-${product.id}">1</span>
                            <button class="selector-action-btn" onclick="BoseSweets.Core.adjustQty('${product.id}', -1)">-</button>
                        </div>
                        <div class="card-price-display-text">${product.price} EGP</div>
                        <button class="card-add-to-cart-action-btn" onclick="BoseSweets.Core.addToCart('${product.id}')">إضافة للسلة</button>
                    </div>
                </div>
            `;

            if (product.tags.includes('best-seller') && bestSellersTrack) bestSellersTrack.innerHTML += cardHtml;
            if (product.tags.includes('new-arrival') && newArrivalsTrack) newArrivalsTrack.innerHTML += cardHtml;
            
            if (product.tags.includes('our-products') && productsGrid) {
                ourProductsCount++;
                if (ourProductsCount <= 4 || state.showAllProducts) {
                    productsGrid.innerHTML += cardHtml;
                }
            }
        });

        // 4. بناء الـ 12 فئة لقسم تسوق حسب الفئة بالمقاس الأكبر والخط المتمركز المعتمد بوزن 700
        const catTrack = document.getElementById('categories-carousel-slider-track');
        const catDots = document.getElementById('categories-carousel-slider-dots');
        if (catTrack && catDots) {
            catTrack.innerHTML = '';
            state.categories.forEach(cat => {
                catTrack.innerHTML += `
                    <div class="bs-category-large-card" onclick="location.href='category.html?id=${cat.id}'">
                        <img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="category-large-img" alt="${cat.name}">
                        <div class="category-large-title">${cat.name}</div>
                    </div>
                `;
            });
            catDots.innerHTML = Array(12).fill(`<span class="dot-node"></span>`).join('');
            catDots.children[0].classList.add('active');
        }
    };

    // محرك حركة سلايدر عقد من الإتقان التلقائي المستمر والدوتس المضيئة بدقة
    Core.startCraftsmanshipSlider = function () {
        if (Runtime.craftTimer) clearInterval(Runtime.craftTimer);
        
        const track = document.getElementById('craftsmanship-slider-track');
        const dots = document.getElementById('craftsmanship-slider-dots');
        
        Runtime.craftTimer = setInterval(() => {
            let index = Runtime.state.currentCraftIndex;
            index = (index + 1) % 3;
            Runtime.state.currentCraftIndex = index;
            
            if (track) {
                track.style.transform = `translateX(${index * 33.3333}%)`;
            }
            
            if (dots) {
                Array.from(dots.children).forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === index);
                });
            }
        }, 4000); // الانتقال السلس التلقائي كل 4 ثوانٍ بدون توقف
    };

    Core.adjustQty = function (id, delta) {
        const node = document.getElementById(`qty-node-${id}`);
        if (node) {
            let val = parseInt(node.innerText) || 1;
            val += delta;
            if (val < 1) val = 1;
            node.innerText = val;
        }
    };

    Core.addToCart = function (id) {
        alert("تمت إضافة المنتج إلى السلة.");
    };

    document.addEventListener('DOMContentLoaded', () => {
        Core.init();
        
        const loadMoreBtn = document.getElementById('action-trigger-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                Runtime.state.showAllProducts = true;
                Core.renderStorefrontUI();
                loadMoreBtn.style.display = 'none';
            });
        }
    });
})();
