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
                { id: "b1", title: "طاجن ديسباسيتو كب", flavor: "نوتيلا دارك فاخرة", description: "كيك فادج غني مشبع بالشوكولاتة البلجيكية بطعم واضح ومميز من أول لقمة.", price: 66, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "b2", title: "قشطوطة لوتس", flavor: "زبدة لوتس أصلية", description: "كيكة الحليب التركية الغنية مشربة بالكامل باللبن تعلوها طبقة ناعمة من القشطة.", price: 121, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "b3", title: "دوناتس ماتيلدا", flavor: "شوكولاتة غنية مكثفة", description: "دوناتس طازجة ومخبوزة يوم بيوم بقوام قطني خفيف وحشوة داخلية ممتازة.", price: 110, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "b4", title: "سينابون كلاسيك", flavor: "كريم تشيز قرفة", description: "لفات سينابون مخبوزة بقوام طري وصوصات غنية متوانة من غير مبالغة.", price: 121, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "b5", title: "كبات السعادة الفاخرة", flavor: "نوتيلا ومكسرات طازجة", description: "أكواب حلوى مصممة لتمنحك تجربة غنية مريحة ولذيذة في كل ملعقة.", price: 61, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "b6", title: "ميني تورتة فانيليا", flavor: "فواكه مشكلة طازجة", description: "طبقات غنية من كيك الفانيليا الهش مع حشوات موس وصوصات مختارة.", price: 154, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "b7", title: "بوكس الروقان الشامل", flavor: "تشكيلة منوعة هادية", description: "تجميعة متنوعة متنسقة بعناية مناسبة للهدايا واللمة بطعم واضح وخامات حقيقية.", price: 550, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "b8", title: "جاتوه كلاسيك فاخر", flavor: "شوكولاتة سويسري غنية", description: "تشكيلات جاتوه منوعة بخامات متوازنة وطعم واضح مناسب لكل ضيافة.", price: 506, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                
                { id: "n1", title: "ديسباسيتو بستاشيو", flavor: "زبدة فستق أصلي", description: "نكهة حصرية جديدة كلياً بمزيج رائع غني لعشاق الفستق والموس.", price: 83, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival"] },
                { id: "n2", title: "قشطوطة مانجا طازجة", flavor: "قطع مانجو طبيعية", description: "توليفة منعشة تجمع بين كيكة الحليب وقطع المانجو الاستوائية الطازجة.", price: 121, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival"] },
                { id: "n3", title: "دوناتس ريدفيلفت", flavor: "كريمة تشيز ناعمة", description: "عجينة الدونات الهشة مع لمسة الريدفيلفت الفاخرة لتجربة فريدة.", price: 99, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival"] },
                { id: "n4", title: "سينابون كيندر غني", flavor: "صوص شوكولاتة كيندر", description: "لفات السينابون الطرية المخبوزة بعناية مع غمر كامل بصوص كيندر.", price: 121, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival"] },
                { id: "n5", title: "كبات سعادة سنيكرز", flavor: "كراميل وفول سوداني", description: "مزيج غني يجمع بين الكراميل المملح الخفيف والشوكولاتة لعشاق السنيكرز.", price: 61, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival"] },
                { id: "n6", title: "ميني كعكة قلب", flavor: "موس فراولة مخملي", description: "تصميم أنيق بشكل قلب يعبر عن الذوق والاهتمام الفاخر بالتفاصيل.", price: 154, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival"] },
                
                { id: "p4", title: "دستة كب كيك شوكولاتة", flavor: "زبدة طبيعية غنية", description: "قطع صغيرة مخبوزة بدقة ومزينة بالكريمة اللباني الفاخرة.", price: 324, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p5", title: "دستة كب كيك ميكس", flavor: "فانيليا وشوكولاتة منوعة", description: "تجميعة رائعة تناسب أعياد الميلاد والتجمعات العائلية المبهجة.", price: 324, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p6", title: "طاجن ريدفيلفت كبير", flavor: "موس تشيز وراسبيري", description: "طبقات مخملية من الريدفيلفت متوازنة النكهة تمنحك شعور الرفاهية.", price: 165, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p7", title: "جاتوه ملكي فاخر", flavor: "موس فرنسي ميكس", description: "تشكيلة سوبريم ملكية محضرة بعناية فائقة لتناسب أرقى الحفلات والمناسبات.", price: 638, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] }
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
        Core.bindScrollEvents();
    };

    Core.renderStorefrontUI = function () {
        const state = Runtime.state;
        
        const w1 = document.getElementById('waterfall-column-1');
        const w2 = document.getElementById('waterfall-column-2');
        if (w1 && w2) {
            const placeholder = `<img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="waterfall-img-item" alt="Placeholder">`;
            w1.innerHTML = Array(4).fill(placeholder).join('');
            w2.innerHTML = Array(4).fill(placeholder).join('');
        }

        const craftTrack = document.getElementById('craftsmanship-slider-track');
        const craftDots = document.getElementById('craftsmanship-slider-dots');
        if (craftTrack && craftDots) {
            craftTrack.innerHTML = Array(3).fill(`<div class="full-slider-image-link"><img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="slider-full-img" alt="إتقان"></div>`).join('');
            craftDots.innerHTML = Array(3).fill(`<span class="dot-node"></span>`).join('');
            craftDots.children[0].classList.add('active');
        }

        const bestSellersTrack = document.getElementById('best-sellers-slider-container');
        const newArrivalsTrack = document.getElementById('new-arrivals-slider-container');
        const productsGrid = document.getElementById('storefront-products-grid-container');

        if (bestSellersTrack) bestSellersTrack.innerHTML = '';
        if (newArrivalsTrack) newArrivalsTrack.innerHTML = '';
        if (productsGrid) productsGrid.innerHTML = '';

        let bestSellersCount = 0;
        let newArrivalsCount = 0;
        let ourProductsCount = 0;

        state.products.forEach(product => {
            // كود الكارت الموحد بتمحور السعر أسفل العداد تماماً
            const cardHtml = `
                <div class="bs-product-card" data-id="${product.id}">
                    <img src="${product.image}" class="card-image-box" alt="${product.title}" loading="lazy">
                    <h3 class="card-title-text">${product.title}</h3>
                    <div class="card-flavor-text">${product.flavor}</div>
                    <p class="card-desc-paragraph">${product.description}</p>
                    <div class="card-meta-action-row">
                        <div class="card-controls-block">
                            <div class="card-price-and-counter-zone">
                                <div class="card-quantity-selector">
                                    <button class="selector-action-btn" onclick="BoseSweets.Core.adjustQty('${product.id}', 1)">+</button>
                                    <span class="selector-value-display" id="qty-node-${product.id}">1</span>
                                    <button class="selector-action-btn" onclick="BoseSweets.Core.adjustQty('${product.id}', -1)">-</button>
                                </div>
                                <div class="card-price-display-text">${product.price} EGP</div>
                            </div>
                            <button class="card-add-to-cart-action-btn" onclick="BoseSweets.Core.addToCart('${product.id}')">إضافة للسلة</button>
                        </div>
                    </div>
                </div>
            `;

            // جلب 8 عناصر للأكثر مبيعاً و 6 عناصر لوصل حديثاً بدقة تامة
            if (product.tags.includes('best-seller') && bestSellersTrack && bestSellersCount < 8) {
                bestSellersTrack.innerHTML += cardHtml;
                bestSellersCount++;
            }
            if (product.tags.includes('new-arrival') && newArrivalsTrack && newArrivalsCount < 6) {
                newArrivalsTrack.innerHTML += cardHtml;
                newArrivalsCount++;
            }
            if (product.tags.includes('our-products') && productsGrid) {
                ourProductsCount++;
                if (ourProductsCount <= 4 || state.showAllProducts) {
                    productsGrid.innerHTML += cardHtml;
                }
            }
        });

        // رندرة الدوتس التفاعلية لقسم الأكثر مبيعاً (8 منتجات) ووصل حديثاً (6 منتجات)
        const bsDots = document.getElementById('best-sellers-dots');
        if (bsDots) {
            bsDots.innerHTML = Array(bestSellersCount).fill(`<span class="dot-node"></span>`).join('');
            if (bsDots.children.length > 0) bsDots.children[0].classList.add('active');
        }
        const naDots = document.getElementById('new-arrivals-dots');
        if (naDots) {
            naDots.innerHTML = Array(newArrivalsCount).fill(`<span class="dot-node"></span>`).join('');
            if (naDots.children.length > 0) naDots.children[0].classList.add('active');
        }

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

    Core.startCraftsmanshipSlider = function () {
        if (Runtime.craftTimer) clearInterval(Runtime.craftTimer);
        const track = document.getElementById('craftsmanship-slider-track');
        const dots = document.getElementById('craftsmanship-slider-dots');
        Runtime.craftTimer = setInterval(() => {
            let index = Runtime.state.currentCraftIndex;
            index = (index + 1) % 3;
            Runtime.state.currentCraftIndex = index;
            if (track) track.style.transform = `translateX(${index * 33.3333}%)`;
            if (dots) {
                Array.from(dots.children).forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === index);
                });
            }
        }, 4000);
    };

    // معالجة الدوتس التفاعلية وربطها برميًا بحركة سكرول السلايدرات
    Core.bindScrollEvents = function () {
        const setupScrollListener = (trackId, dotsId) => {
            const track = document.getElementById(trackId);
            const dots = document.getElementById(dotsId);
            if (!track || !dots) return;

            track.addEventListener('scroll', () => {
                const cardWidth = track.children[0].offsetWidth + 16;
                const activeIndex = Math.round(track.scrollLeft / -cardWidth);
                Array.from(dots.children).forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === activeIndex);
                });
            });
        };

        setupScrollListener('best-sellers-slider-container', 'best-sellers-dots');
        setupScrollListener('new-arrivals-slider-container', 'new-arrivals-dots');
        setupScrollListener('categories-carousel-slider-track', 'categories-carousel-slider-dots');
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
