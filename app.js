(function () {
    window.BoseSweets = {
        Core: {},
        LocalDatabase: {
            store: {
                name: "حلويات بوسي",
                slogan: "صنعناها بحب لتهديها لمن تحب"
            },
            // تشغيل الـ 12 فئة الإلزامية المذكورة في المواصفة الرسمية لقسم تسوق حسب الفئة بدون أي تعديل أو ابتكار
            categories: [
                { id: "cakes", name: "التورت" },
                { id: "gateaux", name: "الجاتوهات" },
                { id: "qashtota", name: "القشطوطة" },
                { id: "despacito", name: "الديسباسيتو" },
                { id: "cinnabon", name: "السينابون" },
                { id: "donuts", name: "الدوناتس" },
                { id: "red-velvet", name: "الريدڤيلڤت" },
                { id: "cupcake", name: "الكب كيك" },
                { id: "mini-cake", name: "الميني تورت" },
                { id: "flowers", name: "الورد" },
                { id: "happiness-cups", name: "كبات السعادة" },
                { id: "relax-box", name: "بوكس الروقان" }
            ],
            // حشوة المنتجات الأولية الثابتة لاختبار الهيكل الموحد المكتوب في المواصفة
            products: [
                { id: "prod-1", title: "طاجن ديسباسيتو كبير", flavor: "نوتيلا دارك", description: "طبقات متوازنة من الكيك الفادج والموس الغني مع حشوات واضحة الطعم وقوام مريح من أول لقمة لآخر قطعة.", price: 264, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller", "new-arrival"] },
                { id: "prod-2", title: "قشطوطة فاخرة", flavor: "بيستاشيو", description: "كيك هش بطبقات ناعمة وحشوات متوازنة معمول بخامات طبيعية وطعم واضح من أول لقمة منافسة للضيافة الفاخرة.", price: 143, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "prod-3", title: "دوناتس طازجة", flavor: "ماتيلدا", description: "دوناتس طازجة بقوام خفيف وحشوات متنوعة معمولين يوم بيوم علشان يوصلك نفس الطعم والجودة الحقيقية.", price: 110, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival"] },
                { id: "prod-4", title: "لفات سينابون", flavor: "كلاسيك صوص تشيز", description: "لفات سينابون مخبوزة بقوام طري وصوصات غنية متوازنة من غير مبالغة لتاخذ تجربة واضحة في الطعم.", price: 121, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "prod-5", title: "كبات السعادة", flavor: "لوتس غني", description: "أكواب متنوعة بحشوات غنية وطعم متوازن مناسب للتقديم الفردي أو الهدايا البسيطة اللي فيها قيمة واضحة.", price: 61, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "prod-6", title: "ميني تورت", flavor: "فرد أو اتنين فانيليا", description: "تورت صغير معمول بنفس اهتمام تورت المناسبات الكبيرة بخامات واضحة وتفاصيل مناسبة للهدايا الخاصة.", price: 154, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "prod-7", title: "بوكس الروقان", flavor: "تجميعة منوعة هادية", description: "تجميعة متنوعة متنسقة بعناية مناسبة للهدايا واللمة الهادية بطعم واضح وخامات حقيقية ومضمونة.", price: 550, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "prod-8", title: "دستة كب كيك", flavor: "ميكس نكهات شوكولاتة وفانيليا", description: "كب كيك بتزيينات متنوعة وخامات متوازنة مناسب للهدايا والمناسبات والتجمعات الصغيرة والتقديم الفاخر.", price: 324, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] }
            ]
        },
        Runtime: {
            state: { products: [], categories: [], showAllProducts: false },
            events: {}
        }
    };

    const Core = window.BoseSweets.Core;
    const LocalDb = window.BoseSweets.LocalDatabase;

    Core.loadInitialData = function () {
        window.BoseSweets.Runtime.state.products = LocalDb.products;
        window.BoseSweets.Runtime.state.categories = LocalDb.categories;
        Core.renderUI();
    };

    Core.renderUI = function () {
        const state = window.BoseSweets.Runtime.state;
        
        // 1. رندرة الشلال بصور الـ Placeholder المعتمدة
        const waterfall1 = document.getElementById('waterfall-column-1');
        const waterfall2 = document.getElementById('waterfall-column-2');
        if (waterfall1 && waterfall2) {
            waterfall1.innerHTML = Array(4).fill(`<img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="waterfall-img-item" alt="Placeholder">`).join('');
            waterfall2.innerHTML = Array(4).fill(`<img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="waterfall-img-item" alt="Placeholder">`).join('');
        }

        // 2. رندرة قسم عقد من الإتقان بالسلايدر الأفقي بـ 3 صور متصلة بالكامل
        const craftTrack = document.getElementById('craftsmanship-slider-track');
        if (craftTrack) {
            craftTrack.innerHTML = Array(3).fill(`<a href="menu.html"><img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="full-slider-image-link" alt="إتقان"></a>`).join('');
            document.getElementById('craftsmanship-slider-dots').innerHTML = Array(3).fill(`<span class="dot-node"></span>`).join('');
            document.getElementById('craftsmanship-slider-dots').children[0].classList.add('active');
        }

        // 3. بناء وتوزيع كروت السلايدرات والشبكة بالهيكل الموحد الإلزامي
        const bestSellersTrack = document.getElementById('best-sellers-slider-container');
        const newArrivalsTrack = document.getElementById('new-arrivals-slider-container');
        const productsGrid = document.getElementById('storefront-products-grid-container');

        if (bestSellersTrack) bestSellersTrack.innerHTML = '';
        if (newArrivalsTrack) newArrivalsTrack.innerHTML = '';
        if (productsGrid) productsGrid.innerHTML = '';

        let ourProductsCount = 0;

        state.products.forEach(product => {
            // صياغة الهيكل الموحد الحاكم للكارت (صورة ◄ اسم ◄ نكهة ◄ وصف ◄ عداد [يمين+، وسط العدد، يسار-] ◄ سعر ◄ زر)
            const cardHtml = `
                <div class="bs-product-card" data-id="${product.id}">
                    <img src="${product.image}" class="card-image-box" alt="${product.title}" loading="lazy">
                    <h3 class="card-title-text">${product.title}</h3>
                    <div class="card-flavor-text">${product.flavor}</div>
                    <p class="card-desc-paragraph">${product.description}</p>
                    <div class="card-meta-action-row">
                        <div class="card-quantity-selector">
                            <button class="selector-action-btn" onclick="BoseSweets.Core.adjustQty('${product.id}', 1)">+</button>
                            <span class="selector-value-display" id="qty-val-${product.id}">1</span>
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
                // إخفاء الكروت الـ 4 الإضافية بشكل برمي حتى يضغط العميل إظهار المزيد
                if (ourProductsCount <= 4 || state.showAllProducts) {
                    productsGrid.innerHTML += cardHtml;
                }
            }
        });

        // 4. بناء الـ 12 كارت لقسم تسوق حسب الفئة بالمقاس الأكبر بـ 30% والخط المتمركز أسفله 20px وزن 700
        const catTrack = document.getElementById('categories-carousel-slider-track');
        if (catTrack) {
            catTrack.innerHTML = '';
            state.categories.forEach(cat => {
                catTrack.innerHTML += `
                    <div class="bs-category-large-card" onclick="location.href='category.html?id=${cat.id}'">
                        <img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="category-large-img" alt="${cat.name}">
                        <div class="category-large-title">${cat.name}</div>
                    </div>
                `;
            });
            document.getElementById('categories-carousel-slider-dots').innerHTML = Array(12).fill(`<span class="dot-node"></span>`).join('');
            document.getElementById('categories-carousel-slider-dots').children[0].classList.add('active');
        }
    };

    Core.adjustQty = function (id, delta) {
        const node = document.getElementById(`qty-val-${id}`);
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

    // معالجة ضغط زر إظهار المزيد لعرض الـ 4 كروت الإضافية بالهيكل الموحد لمنتجاتنا
    document.addEventListener('DOMContentLoaded', () => {
        Core.loadInitialData();
        
        const loadMoreBtn = document.getElementById('action-trigger-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                window.BoseSweets.Runtime.state.showAllProducts = true;
                Core.renderUI();
                loadMoreBtn.style.display = 'none'; // إخفاء الزر بعد عرض الـ 8 منتجات كاملة
            });
        }
    });
})();
