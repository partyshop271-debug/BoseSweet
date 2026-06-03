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
            // البيانات الصادقة المعتمدة حرفياً بدون تلاعب أو ادعاءات غير مثبتة
            products: [
                { id: "p-despacito", title: "الديسباسيتو", flavor: "نوتيلا دارك", description: "طبقات متوازنة من الكيك الفادج والموس الغني مع حشوات واضحة الطعم وقوام مريح من أول لقمة لآخر قطعة معمول بخامات مختارة بعناية.", price: 264, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller", "new-arrival"] },
                { id: "p-qashtota", title: "القشطوطة", flavor: "بيستاشيو", description: "كيك هش بطبقات ناعمة وحشوات متوازنة معمول بخامات طبيعية وطعم واضح من أول لقمة مناسب للضيافة اليومية ولأي وقت بجودة حقيقية.", price: 143, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "p-donuts", title: "الدوناتس", flavor: "ماتيلدا شوكولاتة", description: "دوناتس طازجة بقوام خفيف وحشوات متنوعة معمولين يوم بيوم علشان يوصلك نفس الطعم والجودة اللي بنقدمها داخل الفرع.", price: 110, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival"] },
                { id: "p-cinabon", title: "السينابون", flavor: "كلاسيك صوص تشيز", description: "لفات سينابون مخبوزة بقوام طري وصوصات غنية متوازنة من غير مبالغة معمول علشان تاخد تجربة واضحة في الطعم والجودة.", price: 121, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p-cups", title: "كبات السعادة", flavor: "لوتس غني", description: "أكواب متنوعة بحشوات غنية وطعم متوازن مناسب للتقديم الفردي أو الهدايا البسيطة اللي فيها قيمة واضحة ونظيفة.", price: 61, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                
                // الوصف الصارم والمطابق حرفياً للمواصفة المعتمدة للميني تورت الدائرية بالفاكيوم
                { id: "p-minicake", title: "الميني تورت", flavor: "فرد أو اتنين فانيليا وشوكولاتة", description: "طبقات غنية من كيك الفانيليا أو الشوكولاتة مع حشوات موس وصوصات ومكسرات وفواكه مختارة بعناية لتمنحك تجربة متكاملة في حجم صغير أنيق وتُغلف بطبقة فاكيوم شفافة تبرز جمال الطبقات والحشوات داخلها.", price: 154, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival", "our-products"] },
                
                { id: "p-relax", title: "بوكس الروقان", flavor: "تجميعة منوعة متسقة", description: "تجربة متكاملة تجمع بين أكثر المنتجات التي يحبها عملاؤنا داخل بوكس واحد يحتوي على تورتة و 2 كب سعادة و 1 كب ديسباسيتو و 1 كب ريدفيلفت.", price: 550, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p-cupcake", title: "الكب كيك", flavor: "دستة كب كيك شوكولاتة", description: "قطع صغيرة من اللذة بطابع غني ومميز يتم تحضير الكيك بنسبة زبدة مدروسة تمنحه قواماً وطعماً مختلفاً ومزين بالكريمة اللباني الفاخرة.", price: 324, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] }
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
            // الهيكل الموحد المحدث الصارم بمحاذاة السعر أسفل العداد تماماً وبشكل منسق
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
