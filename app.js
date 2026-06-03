(function () {
    'use strict';

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
                { id: "p-despacito", title: "الديسباسيتو", flavor: "نوتيلا دارك", description: "طبقات متوازنة من الكيك الفادج والموس الغني مع حشوات واضحة الطعم وقوام مريح من أول لقمة لآخر قطعة معمول بخامات مختارة بعناية.", price: 264, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller", "new-arrival"] },
                { id: "p-qashtota", title: "القشطوطة", flavor: "بيستاشيو", description: "كيك هش بطبقات ناعمة وحشوات متوازنة معمول بخامات طبيعية وطعم واضح من أول لقمة مناسب للضيافة اليومية ولأي وقت بجودة حقيقية.", price: 143, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "p-donuts", title: "الدوناتس", flavor: "ماتيلدا شوكولاتة", description: "دوناتس طازجة بقوام خفيف وحشوات متنوعة معمولين يوم بيوم علشان يوصلك نفس الطعم والجودة اللي بنقدمها داخل الفرع.", price: 110, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival"] },
                { id: "p-cinabon", title: "السينابون", flavor: "كلاسيك صوص تشيز", description: "لفات سينابون مخبوزة بقوام طري وصوصات غنية متوازنة من غير مبالغة معمول علشان تاخد تجربة واضحة في الطعم والجودة.", price: 121, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller"] },
                { id: "p-gateaux", title: "الجاتوهات الكلاسيك", flavor: "فانيليا وشوكولاتة منوعة", description: "تشكيلات جاتوه متنوعة بخامات متوازنة وطعم واضح مناسب للضيافة اليومية والمناسبات السعيدة.", price: 506, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival", "our-products"] },
                { id: "p-cinabon-pistachio", title: "سينابون بيستاشيو", flavor: "صوص فستق فاخر", description: "لفات سينابون مخبوزة بقوام طري مغطاة بصوص البيستاشيو الغني والمميز طازج يوم بيوم.", price: 143, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival", "our-products"] },
                { id: "p-minicake", title: "الميني تورت", flavor: "فرد أو اتنين فانيليا وشوكولاتة", description: "طبقات غنية من كيك الفانيليا أو الشوكولاتة مع حشوات موس وصوصات ومكسرات وفواكه مختارة بعناية لتمنحك تجربة متكاملة في حجم صغير أنيق وتُغلف بطبقة فاكيوم شفافة تبرز جمال الطبقات والحشوات داخلها.", price: 154, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["best-seller", "new-arrival", "our-products"] },
                { id: "p-redvelvet", title: "مثلث الريدڤيلڤت", flavor: "كريم تشيز غني", description: "طبقات من الريدڤيلڤت الغني بقوامه الناعم ولونه المميز مع طبقات من موس التشيز الفاخر.", price: 72, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["new-arrival", "our-products"] },
                
                // المنتجات الأربعة الإضافية المعتمدة رسمياً من قائمة منتجات حلويات بوسي
                { id: "p-happiness-cups", title: "كبات السعادة", flavor: "لوتس غني", description: "أكواب متنوعة بحشوات غنية وطعم متوازن مناسب للتقديم الفردي أو الهدايا البسيطة اللي فيها قيمة واضحة ونظيفة.", price: 61, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p-relax-box", title: "بوكس الروقان", flavor: "تجميعة منوعة متسقة", description: "تجربة متكاملة تجمع بين أكثر المنتجات التي يحبها عملاؤنا داخل بوكس واحد يحتوي على تورتة و 2 كب سعادة و 1 كب ديسباسيتو و 1 كب ريدفيلفت.", price: 550, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p-cupcake", title: "الكب كيك", flavor: "دستة كب كيك شوكولاتة", description: "قطع صغيرة من اللذة بطابع غني ومميز يتم تحضير الكيك بنسبة زبدة مدروسة تمنحه قواماً وطعماً مختلفاً ومزين بالكريمة اللباني الفاخرة.", price: 324, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] },
                { id: "p-qashtota-nutella", title: "القشطوطة", flavor: "نوتيلا وايت", description: "كيك فانيليا مشرب بالحليب يعلوه طبقة ناعمة من الكريمة اللباني الغنية مع صوص النوتيلا البيضاء الفاخرة بطعم متوازن.", price: 121, image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png", tags: ["our-products"] }
            ]
        },
        Runtime: {
            state: { products: [], categories: [], showAllProducts: false, currentCraftIndex: 0, quantities: {} },
            craftTimer: null
        }
    };

    const Core = window.BoseSweets.Core;
    const LocalDb = window.BoseSweets.LocalDatabase;
    const Runtime = window.BoseSweets.Runtime;

    Core.init = function () {
        Runtime.state.products = LocalDb.products;
        Runtime.state.categories = LocalDb.categories;
        Runtime.state.products.forEach(p => {
            Runtime.state.quantities[p.id] = 1;
        });
        Core.renderStorefrontUI();
        Core.startCraftsmanshipSlider();
        Core.bindScrollEvents();
    };

    Core.escapeHTML = function (str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function (m) {
            switch (m) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#039;';
            }
        });
    };

    Core.renderStorefrontUI = function () {
        const state = Runtime.state;
        
        const w1 = document.getElementById('waterfall-column-1');
        const w2 = document.getElementById('waterfall-column-2');
        if (w1 && w2 && w1.children.length === 0) {
            let column1Html = '';
            let column2Html = '';
            for (let i = 0; i < 4; i++) {
                column1Html += `<img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="waterfall-img-item" alt="منتجات حلويات بوسي الفاخرة">`;
                column2Html += `<img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="waterfall-img-item" alt="منتجات حلويات بوسي الفاخرة">`;
            }
            w1.innerHTML = column1Html;
            w2.innerHTML = column2Html;
            
            w1.querySelectorAll('.waterfall-img-item').forEach(img => {
                img.addEventListener('click', () => { location.href = 'menu.html'; });
            });
            w2.querySelectorAll('.waterfall-img-item').forEach(img => {
                img.addEventListener('click', () => { location.href = 'menu.html'; });
            });
        }

        const craftTrack = document.getElementById('craftsmanship-slider-track');
        const craftDots = document.getElementById('craftsmanship-slider-dots');
        if (craftTrack && craftDots && craftTrack.children.length === 0) {
            craftTrack.innerHTML = `
                <div class="full-slider-image-link"><img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="slider-full-img" alt="إتقان الجودة 1"></div>
                <div class="full-slider-image-link"><img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="slider-full-img" alt="إتقان الجودة 2"></div>
                <div class="full-slider-image-link"><img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="slider-full-img" alt="إتقان الجودة 3"></div>
            `;
            
            craftTrack.querySelectorAll('.slider-full-img').forEach(img => {
                img.addEventListener('click', () => { location.href = 'menu.html'; });
            });

            craftDots.innerHTML = Array(3).fill(0).map((_, idx) => `<button class="dot-node" data-index="${idx}" aria-label="شريحة ${idx + 1}"></button>`).join('');
            if (craftDots.children.length > 0) craftDots.children[0].classList.add('active');
            
            Array.from(craftDots.children).forEach(dot => {
                dot.addEventListener('click', function() {
                    const idx = parseInt(this.getAttribute('data-index'), 10);
                    BoseSweets.Core.scrollCraftsmanship(idx);
                });
            });
        }

        const bestSellersTrack = document.getElementById('best-sellers-slider-container');
        const newArrivalsTrack = document.getElementById('new-arrivals-slider-container');
        const productsGrid = document.getElementById('storefront-products-grid-container');

        if (bestSellersTrack) bestSellersTrack.innerHTML = '';
        if (newArrivalsTrack) newArrivalsTrack.innerHTML = '';
        if (productsGrid) productsGrid.innerHTML = '';

        let bestSellersCount = 0;
        let newArrivalsCount = 0;
        let ourProductsTotal = [];

        state.products.forEach(product => {
            if (product.tags.includes('our-products')) {
                ourProductsTotal.push(product);
            }
        });

        const buildProductCardHtml = (product) => {
            const currentQty = state.quantities[product.id] || 1;
            const safeId = Core.escapeHTML(product.id);
            const safeTitle = Core.escapeHTML(product.title);
            const safeFlavor = Core.escapeHTML(product.flavor);
            const safeDesc = Core.escapeHTML(product.description);
            const safeImg = Core.escapeHTML(product.image);

            return `
                <div class="bs-product-card" data-id="${safeId}">
                    <img src="${safeImg}" class="card-image-box" alt="${safeTitle}" loading="lazy" onclick="location.href='product.html?id=${safeId}'">
                    <h3 class="card-title-text" onclick="location.href='product.html?id=${safeId}'">${safeTitle}</h3>
                    <div class="card-flavor-text">${safeFlavor}</div>
                    <p class="card-desc-paragraph">${safeDesc}</p>
                    <div class="card-meta-action-row">
                        <div class="card-controls-block">
                            <div class="card-price-and-counter-zone">
                                <div class="card-quantity-selector">
                                    <button class="selector-action-btn pulse-trigger" data-action="plus" data-id="${safeId}">+</button>
                                    <span class="selector-value-display" id="qty-node-${safeId}">${currentQty}</span>
                                    <button class="selector-action-btn pulse-trigger" data-action="minus" data-id="${safeId}">-</button>
                                </div>
                                <div class="card-price-display-text">${product.price} EGP</div>
                            </div>
                            <button class="card-add-to-cart-action-btn" data-id="${safeId}">إضافة للسلة</button>
                        </div>
                    </div>
                </div>
            `;
        };

        state.products.forEach(product => {
            if (product.tags.includes('best-seller') && bestSellersTrack && bestSellersCount < 8) {
                bestSellersTrack.innerHTML += buildProductCardHtml(product);
                bestSellersCount++;
            }
            if (product.tags.includes('new-arrival') && newArrivalsTrack && newArrivalsCount < 6) {
                newArrivalsTrack.innerHTML += buildProductCardHtml(product);
                newArrivalsCount++;
            }
        });

        if (productsGrid) {
            const itemsToRender = state.showAllProducts ? ourProductsTotal.slice(0, 8) : ourProductsTotal.slice(0, 4);
            itemsToRender.forEach(product => {
                productsGrid.innerHTML += buildProductCardHtml(product);
            });

            const loadMoreBtn = document.getElementById('action-trigger-load-more');
            if (loadMoreBtn) {
                if (state.showAllProducts || ourProductsTotal.length <= 4) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'block';
                }
            }
        }

        const bsDots = document.getElementById('best-sellers-dots');
        if (bsDots) {
            bsDots.innerHTML = Array(bestSellersCount).fill(0).map((_, idx) => `<button class="dot-node" data-index="${idx}" aria-label="شريحة الأكثر مبيعاً ${idx + 1}"></button>`).join('');
            if (bsDots.children.length > 0) bsDots.children[0].classList.add('active');
            Array.from(bsDots.children).forEach(dot => {
                dot.addEventListener('click', function() {
                    const idx = parseInt(this.getAttribute('data-index'), 10);
                    Core.scrollToCard('best-sellers-slider-container', idx);
                });
            });
        }

        const naDots = document.getElementById('new-arrivals-dots');
        if (naDots) {
            naDots.innerHTML = Array(newArrivalsCount).fill(0).map((_, idx) => `<button class="dot-node" data-index="${idx}" aria-label="شريحة وصل حديثاً ${idx + 1}"></button>`).join('');
            if (naDots.children.length > 0) naDots.children[0].classList.add('active');
            Array.from(naDots.children).forEach(dot => {
                dot.addEventListener('click', function() {
                    const idx = parseInt(this.getAttribute('data-index'), 10);
                    Core.scrollToCard('new-arrivals-slider-container', idx);
                });
            });
        }

        const catTrack = document.getElementById('categories-carousel-slider-track');
        const catDots = document.getElementById('categories-carousel-slider-dots');
        if (catTrack && catDots && catTrack.children.length === 0) {
            catTrack.innerHTML = '';
            state.categories.forEach(cat => {
                const safeCatId = Core.escapeHTML(cat.id);
                const safeCatName = Core.escapeHTML(cat.name);
                catTrack.innerHTML += `
                    <div class="bs-category-large-card" data-link="category.html?id=${safeCatId}">
                        <img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" class="category-large-img" alt="${safeCatName}" loading="lazy">
                        <div class="category-large-title">${safeCatName}</div>
                    </div>
                `;
            });
            
            Array.from(catTrack.children).forEach(card => {
                card.addEventListener('click', function() {
                    location.href = this.getAttribute('data-link');
                });
            });

            catDots.innerHTML = Array(state.categories.length).fill(0).map((_, idx) => `<button class="dot-node" data-index="${idx}" aria-label="فئة ${idx + 1}"></button>`).join('');
            if (catDots.children.length > 0) catDots.children[0].classList.add('active');
            Array.from(catDots.children).forEach(dot => {
                dot.addEventListener('click', function() {
                    const idx = parseInt(this.getAttribute('data-index'), 10);
                    Core.scrollToCard('categories-carousel-slider-track', idx);
                });
            });
        }

        Core.rebindCardEvents();
    };

    Core.rebindCardEvents = function () {
        document.querySelectorAll('.pulse-trigger').forEach(btn => {
            btn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                const action = this.getAttribute('data-action');
                Core.adjustQty(id, action === 'plus' ? 1 : -1);
            };
        });

        document.querySelectorAll('.card-add-to-cart-action-btn').forEach(btn => {
            btn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                Core.addToCart(id);
            };
        });
    };

    Core.startCraftsmanshipSlider = function () {
        if (Runtime.craftTimer) clearInterval(Runtime.craftTimer);
        const track = document.getElementById('craftsmanship-slider-track');
        const dots = document.getElementById('craftsmanship-slider-dots');
        Runtime.craftTimer = setInterval(() => {
            let index = Runtime.state.currentCraftIndex;
            index = (index + 1) % 3;
            Runtime.state.currentCraftIndex = index;
            if (track) track.style.transform = `translateX(${index * (100 / 3)}%)`;
            if (dots) {
                Array.from(dots.children).forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === index);
                });
            }
        }, 5000);
    };

    Core.scrollCraftsmanship = function (index) {
        if (Runtime.craftTimer) clearInterval(Runtime.craftTimer);
        Runtime.state.currentCraftIndex = index;
        const track = document.getElementById('craftsmanship-slider-track');
        const dots = document.getElementById('craftsmanship-slider-dots');
        if (track) track.style.transform = `translateX(${index * (100 / 3)}%)`;
        if (dots) {
            Array.from(dots.children).forEach((dot, idx) => {
                dot.classList.toggle('active', idx === index);
            });
        }
        Core.startCraftsmanshipSlider();
    };

    Core.scrollToCard = function (trackId, index) {
        const track = document.getElementById(trackId);
        if (!track || !track.children.length) return;
        const cardWidth = track.children[0].offsetWidth + 16;
        const scrollPosition = index * cardWidth;
        track.scrollTo({
            left: -scrollPosition,
            behavior: 'smooth'
        });
    };

    Core.bindScrollEvents = function () {
        const setupScrollListener = (trackId, dotsId) => {
            const track = document.getElementById(trackId);
            const dots = document.getElementById(dotsId);
            if (!track || !dots || !track.children.length) return;

            track.addEventListener('scroll', () => {
                const cardWidth = track.children[0].offsetWidth + 16;
                const activeIndex = Math.round(Math.abs(track.scrollLeft) / cardWidth);
                Array.from(dots.children).forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === activeIndex);
                });
            }, { passive: true });
        };

        setupScrollListener('best-sellers-slider-container', 'best-sellers-dots');
        setupScrollListener('new-arrivals-slider-container', 'new-arrivals-dots');
        setupScrollListener('categories-carousel-slider-track', 'categories-carousel-slider-dots');
    };

    Core.adjustQty = function (id, delta) {
        if (Runtime.state.quantities[id] !== undefined) {
            let val = Runtime.state.quantities[id] + delta;
            if (val < 1) val = 1;
            Runtime.state.quantities[id] = val;
            
            const nodes = document.querySelectorAll(`[id="qty-node-${id}"]`);
            nodes.forEach(node => {
                node.innerText = val;
            });
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
            });
        }
    });
})();
