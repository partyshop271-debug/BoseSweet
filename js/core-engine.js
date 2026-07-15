/**
 * core-engine.js - المحرك المركزي العالمي وحارس البيانات والحسابات المالية
 * موقع حلويات بوسي (BoseSweets) - النسخة الاحترافية الملوكية المطورة V10.0
 * [تطهير وحل نهائي]: علاج مشكلة عقد من الإتقان، الشلال، وحظر التعارض نهائياً.
 * محظور الحذف، الاختصار، الدمج، أو التبسيط نهائياً تماشياً مع فلسفة العلامة الفاخرة.
 */

(function() {
    "use strict";

    // 1. [صمام أمان الأداء]: حظر استعادة السكرول التلقائية لسرعة التصفح لراحة العميل النفسية
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    function forceScrollToTop() {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    forceScrollToTop();
    document.addEventListener('DOMContentLoaded', forceScrollToTop);
    window.addEventListener('load', forceScrollToTop);

    // تهيئة المتغيرات العالمية الموحدة في نطاق window لخدمة صفحات الموقع
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; // فارق التوقيت بالمللي ثانية: (وقت الخادم - وقت جهاز العميل)

    /**
     * جلب وقراءة قاعدة بيانات حلويات بوسي الموحدة - نظام الكاش الذكي الموفر للبيانات والباقة
     */
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return;
        
        const cachedData = localStorage.getItem('bose_cached_store_data');
        const cachedTime = localStorage.getItem('bose_cached_store_time');
        const cacheExpiry = 15 * 60 * 1000; // صلاحية الكاش 15 دقيقة لضمان حداثة الأسعار والروقان

        if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime, 10) < cacheExpiry)) {
            try {
                window.BoseStoreData = JSON.parse(cachedData);
                initCoreFlow();
                return;
            } catch (e) {
                localStorage.removeItem('bose_cached_store_data');
                localStorage.removeItem('bose_cached_store_time');
            }
        }
        
        let retries = 5;
        let delay = 1000;
        
        while (retries > 0) {
            try {
                const response = await fetch('data/site-data-final.json');
                if (!response.ok) throw new Error('فشل جلب ملف قاعدة البيانات الرئيسي.');
                
                const serverDateHeader = response.headers.get('Date');
                if (serverDateHeader) {
                    const serverTime = new Date(serverDateHeader).getTime();
                    const clientTime = Date.now();
                    window.boseServerTimeOffset = serverTime - clientTime;
                } else {
                    window.boseServerTimeOffset = 0;
                }
                
                window.BoseStoreData = await response.json();
                
                localStorage.setItem('bose_cached_store_data', JSON.stringify(window.BoseStoreData));
                localStorage.setItem('bose_cached_store_time', String(Date.now()));
                
                initCoreFlow();
                return;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    console.error("❌ خطأ حرج في تهيئة نظام حلويات بوسي الموحد:", error);
                    showGlobalFriendlyError();
                } else {
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; 
                }
            }
        }
    }

    /**
     * دالة تشغيل التدفق المركزي والتهيئات البصرية المبكرة للموقع مع حماية صارمة ضد أخطاء الـ DOM
     */
    function initCoreFlow() {
        injectEarlyDependencies();
        applyGlobalSEOAndBranding();
        buildAndInjectGlobalComponents();
        
        if (typeof window.updateGlobalCartCounter === 'function') {
            window.updateGlobalCartCounter();
        }
        
        // استدعاء جميع الدوال بالترتيب الصحيح لضمان حقن البيانات في كافة الأقسام
        injectHomepageSectionMeta();
        renderDynamicWaterfall();
        renderHomepageProductGrids();
        setupOurProductsShowMore();
        injectSimulatorsPreviewData();
        setupCategoriesSliderTouch();
        setupPrideCountersAnimation();
        
        document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
    }

    /**
     * ✍️ ضخ العناوين والوصف للأقسام الرئيسية لعلامة حلويات بوسي لمنع الاختفاء البصري واصلاح السلايدر
     */
    function injectHomepageSectionMeta() {
        const data = window.BoseStoreData;
        if (!data || !data.homepage) return;

        // [تثبيت الوصف والـ Hook لعنوان البانر الرئيسي]
        const heroDesc = document.getElementById('hero-description');
        if (heroDesc && data.homepage.hero) {
            heroDesc.textContent = data.homepage.hero.description;
        }

        // 1. قسم عقد من الإتقان - معالجة ظهور الصور بلا انقطاع ودون حجب طوال الوقت بنظام التكرار السلس
        const excellenceSection = document.getElementById('excellence-section') || document.querySelector('[id*="excellence"]');
        if (excellenceSection && data.homepage.excellence) {
            const titleEl = document.getElementById('excellence-main-heading') || excellenceSection.querySelector('.section-title') || excellenceSection.querySelector('h2');
            const descEl = document.getElementById('excellence-description') || excellenceSection.querySelector('.section-desc') || excellenceSection.querySelector('.bose-section-subtitle');
            
            if (titleEl) titleEl.textContent = data.homepage.excellence.title;
            if (descEl) descEl.textContent = data.homepage.excellence.description;
            
            const track = document.getElementById('excellence-images-track') || excellenceSection.querySelector('.bose-perfection-track') || excellenceSection.querySelector('[id*="track"]');
            if (track && data.homepage.excellence.images) {
                const imagesHtml = data.homepage.excellence.images.map(img => `
                    <div class="excellence-slide-card">
                        <img src="${img}" alt="إتقان حلويات بوسي الفاخرة" />
                    </div>
                `).join('');
                
                // حقن مصفوفة متكاملة وربطها تزامناً مع نسبة الـ 50% للـ CSS لإنهاء ثغرة الاختفاء
                track.innerHTML = `<div class="excellence-track-loop">${imagesHtml} ${imagesHtml}</div>`;
            }
        }

        // 2. قسم تسوق حسب الفئة (حقن مؤشرات التصفح والأسهم وكافة الكروت الـ 12 بالترتيب الأصيل)
        const categoriesSection = document.getElementById('categories-slider-section') || document.getElementById('categories-section') || document.querySelector('[id*="categories"]');
        if (categoriesSection && data.homepage.categoriesSlider) {
            const titleEl = document.getElementById('categories-section-title') || categoriesSection.querySelector('.section-title') || categoriesSection.querySelector('h2');
            const descEl = document.getElementById('categories-section-subtitle') || categoriesSection.querySelector('.bose-section-subtitle');
            
            if (titleEl) titleEl.textContent = "تسوق حسب الفئة";
            if (descEl) descEl.textContent = "سهولة الانتقال المباشر لأي صنف تفضله من فئاتنا الـ 12 المعتمدة رسمياً.";
            
            const track = document.getElementById('categories-track') || categoriesSection.querySelector('.categories-track-slider') || categoriesSection.querySelector('[id*="track"]');
            if (track) {
                track.innerHTML = data.homepage.categoriesSlider.map(cat => `
                    <div class="category-card-unified" onclick="window.location.href='category.html?id=${cat.id}'">
                        <img src="${cat.image}" alt="${cat.title}" class="category-card-img" loading="lazy" />
                        <div class="category-card-name">${cat.title}</div>
                    </div>
                `).join('');
                
                buildCategoriesDots(data.homepage.categoriesSlider.length);
            }
        }

        // 3. قسم الأكثر مبيعاً وعناوين الأقسام
        const mostSellingSection = document.getElementById('most-selling-section');
        if (mostSellingSection) {
            const titleEl = document.getElementById('most-selling-main-heading') || mostSellingSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "الأكثر مبيعاً";
            const descEl = document.getElementById('most-selling-description') || mostSellingSection.querySelector('.bose-section-subtitle');
            if (descEl) descEl.textContent = "تشكيلة من قطع السعادة الفاخرة والأكثر طلباً وإعجاباً من عملائنا.";
        }

        // 4. قسم وصل حديثاً
        const newArrivalsSection = document.getElementById('new-arrivals-section');
        if (newArrivalsSection) {
            const titleEl = document.getElementById('new-arrivals-main-heading') || newArrivalsSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "وصل حديثاً";
            const descEl = document.getElementById('new-arrivals-description') || newArrivalsSection.querySelector('.bose-section-subtitle');
            if (descEl) descEl.textContent = "اكتشف أحدث ابابتكاراتنا الحصرية وتوليفات النكهات الغنية المصنوعة بحب.";
        }

        // 5. قسم منتجاتنا
        const ourProductsSection = document.getElementById('our-products-section');
        if (ourProductsSection) {
            const titleEl = document.getElementById('our-products-main-heading') || ourProductsSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "منتجاتنا";
            const descEl = document.getElementById('our-products-description') || ourProductsSection.querySelector('.bose-section-subtitle');
            if (descEl) descEl.textContent = "التشكيلة العامة الفاخرة المحضرة يومياً بمكونات طبيعية 100%.";
        }
    }

    /**
     * بناء مؤشرات التنقل النقطية والأسهم لقسم تسوق حسب الفئة
     */
    function buildCategoriesDots(count) {
        const categoriesSection = document.getElementById('categories-slider-section') || document.getElementById('categories-section') || document.querySelector('[id*="categories"]');
        if (!categoriesSection) return;

        let dotsContainer = document.getElementById('categories-dots-container');
        if (dotsContainer) {
            let dotsHtml = '';
            for (let i = 0; i < count; i++) {
                dotsHtml += `<span class="bose-slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`;
            }
            dotsContainer.innerHTML = dotsHtml;
        }
        
        let controlsWrapper = categoriesSection.querySelector('.categories-slider-controls-wrapper');
        if (!controlsWrapper && !dotsContainer) {
            controlsWrapper = document.createElement('div');
            controlsWrapper.className = 'categories-slider-controls-wrapper';
            controlsWrapper.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:20px; margin-top:24px; width:100%;';
            
            const arrowsContainer = document.createElement('div');
            arrowsContainer.className = 'bose-slider-arrows';
            arrowsContainer.style.cssText = 'display:flex; gap:20px; direction:ltr;';
            arrowsContainer.innerHTML = `
                <button class="bose-slider-arrow prev" style="background:#FFFFFF; border:1px solid #FF91A4; color:#FF91A4; width:45px; height:45px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; transition:all 0.3s;"><i class="fa-solid fa-chevron-left"></i></button>
                <button class="bose-slider-arrow next" style="background:#FFFFFF; border:1px solid #FF91A4; color:#FF91A4; width:45px; height:45px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; transition:all 0.3s;"><i class="fa-solid fa-chevron-right"></i></button>
            `;
            
            dotsContainer = document.createElement('div');
            dotsContainer.id = 'categories-dots-container';
            dotsContainer.className = 'categories-slider-dots';
            
            controlsWrapper.appendChild(arrowsContainer);
            controlsWrapper.appendChild(dotsContainer);
            categoriesSection.appendChild(controlsWrapper);
            
            let dotsHtml = '';
            for (let i = 0; i < count; i++) {
                dotsHtml += `<span class="bose-slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`;
            }
            dotsContainer.innerHTML = dotsHtml;
        }
    }

    /**
     * 🎹 تفعيل معالجة الإيماءات والسحب اليدوي السلس والتحكم الكامل بالأسهم
     */
    function setupCategoriesSliderTouch() {
        const categoriesSection = document.getElementById('categories-slider-section') || document.getElementById('categories-section') || document.querySelector('[id*="categories"]');
        const track = document.getElementById('categories-track') || (categoriesSection ? categoriesSection.querySelector('.categories-track-slider') || categoriesSection.querySelector('[id*="track"]') : null);
        if (!track) return;

        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;

        track.style.display = 'flex';
        track.style.overflowX = 'auto';
        track.style.scrollBehavior = 'smooth';
        track.style.webkitOverflowScrolling = 'touch';

        track.addEventListener('scroll', () => {
            updateActiveDot(track);
        });

        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            track.style.cursor = 'grabbing';
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        });

        track.addEventListener('mouseleave', () => {
            isDragging = false;
            track.style.cursor = 'grab';
        });

        track.addEventListener('mouseup', () => {
            isDragging = false;
            track.style.cursor = 'grab';
            updateActiveDot(track);
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5; 
            track.scrollLeft = scrollLeft - walk;
        });

        track.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const x = e.touches[0].pageX - track.offsetLeft;
            const walk = (x - startX) * 1.2;
            track.scrollLeft = scrollLeft - walk;
        }, { passive: true });

        track.addEventListener('touchend', () => {
            isDragging = false;
            updateActiveDot(track);
        });

        if (categoriesSection) {
            const nextBtn = categoriesSection.querySelector('.bose-slider-arrow.next');
            const prevBtn = categoriesSection.querySelector('.bose-slider-arrow.prev');
            
            if (nextBtn && prevBtn) {
                const getStep = () => {
                    const card = track.querySelector('.category-card-unified');
                    return card ? card.offsetWidth + 20 : 300;
                };
                
                nextBtn.addEventListener('click', () => {
                    track.scrollBy({ left: getStep(), behavior: 'smooth' });
                });
                
                prevBtn.addEventListener('click', () => {
                    track.scrollBy({ left: -getStep(), behavior: 'smooth' });
                });
            }
        }

        const dotsContainer = document.getElementById('categories-dots-container');
        if (dotsContainer) {
            dotsContainer.addEventListener('click', (e) => {
                const dot = e.target.closest('.bose-slider-dot');
                if (!dot) return;
                const index = parseInt(dot.getAttribute('data-index'), 10);
                const cards = track.querySelectorAll('.category-card-unified');
                if (cards[index]) {
                    const cardWidth = cards[0].offsetWidth + 20; 
                    track.scrollTo({
                        left: cardWidth * index,
                        behavior: 'smooth'
                    });
                }
            });
        }
    }

    function updateActiveDot(track) {
        const cards = track.querySelectorAll('.category-card-unified');
        if (cards.length === 0) return;
        const cardWidth = cards[0].offsetWidth + 20;
        const currentIndex = Math.round(track.scrollLeft / cardWidth);
        
        const dots = document.querySelectorAll('#categories-dots-container .bose-slider-dot');
        dots.forEach((dot, idx) => {
            if (idx === currentIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    /**
     * 🌊 بناء وحقن شلال المنتجات البصري الأنيق ديناميكياً من المعرفات الصحيحة بالـ DOM
     */
    function renderDynamicWaterfall() {
        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        const waterfallData = window.BoseStoreData?.homepage?.waterfall;

        if (!waterfallData) return;

        if (leftCol && waterfallData.leftColumnImages) {
            const leftHtml = waterfallData.leftColumnImages.map(img => 
                `<img src="${img}" alt="منتج فاخر حلويات بوسي" class="waterfall-img" loading="lazy" />`
            ).join('');
            leftCol.innerHTML = `<div class="waterfall-up">${leftHtml} ${leftHtml}</div>`;
        }

        if (rightCol && waterfallData.rightColumnImages) {
            const rightHtml = waterfallData.rightColumnImages.map(img => 
                `<img src="${img}" alt="منتج راقي حلويات بوسي" class="waterfall-img" loading="lazy" />`
            ).join('');
            rightCol.innerHTML = `<div class="waterfall-down">${rightHtml} ${rightHtml}</div>`;
        }
    }

    /**
     * 🛒 دالة هندسية لبناء الكارت الموحد - زرار الزائد (+) على اليمين والصادر ناقص (-) على اليسار
     */
    function createProductCardHTML(product) {
        if (!product) return '';
        const calculatedPrice = window.calculateProductFinalPrice(product, {});
        
        return `
            <div class="product-card-unified" data-id="${product.id}">
                <img src="${product.images[0]}" alt="${product.title}" class="product-card-img" loading="lazy" onclick="window.location.href='product.html?slug=${product.slug}'" style="cursor:pointer;" />
                <h3 class="product-card-title">${product.title}</h3>
                <span class="product-card-flavor-name">${product.flavorName}</span>
                <p class="product-card-desc">${product.flavorDesc || product.description.substring(0, 80) + '...'}</p>
                
                <div class="product-card-qty-wrapper">
                    <button class="btn-qty-plus" onclick="window.handleBoseCardQtyChange(this, 1)">+</button>
                    <input type="number" class="input-qty-value" value="1" min="1" readonly />
                    <button class="btn-qty-minus" onclick="window.handleBoseCardQtyChange(this, -1)">-</button>
                </div>
                
                <div class="product-card-price" data-base-price="${calculatedPrice}">${Math.round(calculatedPrice)} جنيه</div>
                <button class="btn-add-to-cart" onclick="window.handleBoseDirectAddToCart(this, '${product.id}')">
                    <i class="fa-solid fa-basket-shopping"></i> اضافة للسلة
                </button>
            </div>
        `;
    }

    window.handleBoseCardQtyChange = function(buttonElement, direction) {
        const qtyContainer = buttonElement.closest('.product-card-qty-wrapper');
        const cardContainer = buttonElement.closest('.product-card-unified');
        if (!qtyContainer || !cardContainer) return;

        const qtyInput = qtyContainer.querySelector('.input-qty-value');
        const priceDisplay = cardContainer.querySelector('.product-card-price');
        if (!qtyInput || !priceDisplay) return;

        let currentQty = parseInt(qtyInput.value, 10) || 1;
        currentQty += direction;
        if (currentQty < 1) currentQty = 1;
        qtyInput.value = String(currentQty);

        const basePrice = parseFloat(priceDisplay.getAttribute('data-base-price')) || 0;
        priceDisplay.textContent = `${Math.round(basePrice * currentQty)} جنيه`;
    };

    /**
     * 📊 ضخ وحقن شبكات المنتجات لجميع الأقسام بالصفحة الرئيسية ديناميكياً
     */
    function renderHomepageProductGrids() {
        const data = window.BoseStoreData;
        if (!data || !data.products) return;

        // 1. قسم الأكثر مبيعاً (8 منتجات كاملة هندسياً)
        const mostSellingGrid = document.getElementById('most-selling-grid');
        if (mostSellingGrid && data.homepage.mostSelling) {
            const items = data.homepage.mostSelling.map(id => data.products.find(p => p.id === id || p.slug === id)).filter(Boolean);
            mostSellingGrid.innerHTML = items.map(p => createProductCardHTML(p)).join('');
        }

        // 2. قسم وصل حديثاً (6 منتجات بالتمام والكمال)
        const newArrivalsGrid = document.getElementById('new-arrivals-grid');
        if (newArrivalsGrid && data.homepage.newArrivals) {
            const items = data.homepage.newArrivals.map(id => data.products.find(p => p.id === id || p.slug === id)).filter(Boolean);
            newArrivalsGrid.innerHTML = items.map(p => createProductCardHTML(p)).join('');
        }

        // 3. قسم منتجاتنا (كروت ثنائية متوازنة العرض، صفين كل صف كارتين بالتمام والكمال لراحة العميل)
        const ourProductsGrid = document.getElementById('our-products-grid') || document.getElementById('our-products-section-grid') || document.querySelector('.our-products-grid');
        if (ourProductsGrid && data.homepage.ourProducts) {
            const initialItems = data.homepage.ourProducts.slice(0, 4).map(id => data.products.find(p => p.id === id || p.slug === id)).filter(Boolean);
            ourProductsGrid.innerHTML = initialItems.map(p => createProductCardHTML(p)).join('');
        }
    }

    /**
     * 🌟 نظام التحكم لزر (إظهار المزيد) بقسم منتجاتنا لحقن الـ 8 كروت كاملة ومستقرة
     */
    function setupOurProductsShowMore() {
        const showMoreBtn = document.getElementById('our-products-show-more-btn') || document.querySelector('[id*="show-more"]');
        const ourProductsGrid = document.getElementById('our-products-grid') || document.getElementById('our-products-section-grid') || document.querySelector('.our-products-grid');
        const data = window.BoseStoreData;

        if (!showMoreBtn || !ourProductsGrid || !data) return;

        showMoreBtn.style.cssText = "display: inline-block !important; background: #FFFFFF !important; border: 2px solid #FF91A4 !important; color: #FF91A4 !important; font-weight: 700; padding: 12px 36px; border-radius: 30px; cursor: pointer; transition: all 0.3s ease; opacity: 1 !important; visibility: visible !important;";
        showMoreBtn.textContent = "إظهار المزيد";

        showMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const allItems = data.homepage.ourProducts.map(id => data.products.find(p => p.id === id || p.slug === id)).filter(Boolean);
            ourProductsGrid.innerHTML = allItems.map(p => createProductCardHTML(p)).join('');
            showMoreBtn.style.setProperty('display', 'none', 'important'); 
        });
    }

    /**
     * 👑 ضخ وحقن خيارات وألوان محاكي التورت ومحاكي الورد لملء الشاشة بالكامل بدون أي إزاحة
     */
    function injectSimulatorsPreviewData() {
        const data = window.BoseStoreData;
        if (!data || !data.homepage) return;

        // محاكي التورت
        const cakeSection = document.getElementById('cake-preview-section') || document.querySelector('[id*="cake-preview"]');
        if (cakeSection && data.homepage.cakePreview) {
            const preview = data.homepage.cakePreview;
            const imgEl = cakeSection.querySelector('#cake-preview-img') || cakeSection.querySelector('.simulator-preview-img') || cakeSection.querySelector('img');
            const titleEl = cakeSection.querySelector('#cake-preview-title') || cakeSection.querySelector('h2');
            const descEl = cakeSection.querySelector('#cake-preview-desc') || cakeSection.querySelector('p');
            const ctaEl = cakeSection.querySelector('#cake-preview-cta') || cakeSection.querySelector('a') || cakeSection.querySelector('.bose-simulator-preview-cta-btn');

            if (imgEl) imgEl.src = preview.image;
            if (titleEl) titleEl.textContent = preview.title;
            if (descEl) descEl.textContent = preview.description;
            if (ctaEl) {
                ctaEl.textContent = preview.cta;
                ctaEl.href = preview.target;
            }
        }

        // محاكي الورد
        const flowerSection = document.getElementById('flower-preview-section') || document.querySelector('[id*="flower-preview"]');
        if (flowerSection && data.homepage.flowerPreview) {
            const preview = data.homepage.flowerPreview;
            const imgEl = flowerSection.querySelector('#flower-preview-img') || flowerSection.querySelector('.simulator-preview-img') || flowerSection.querySelector('img');
            const titleEl = flowerSection.querySelector('#flower-preview-title') || flowerSection.querySelector('h2');
            const descEl = flowerSection.querySelector('#flower-preview-desc') || flowerSection.querySelector('p');
            const ctaEl = flowerSection.querySelector('#flower-preview-cta') || flowerSection.querySelector('a') || flowerSection.querySelector('.bose-simulator-preview-cta-btn');

            if (imgEl) imgEl.src = preview.image;
            if (titleEl) titleEl.textContent = preview.title;
            if (descEl) descEl.textContent = preview.description;
            if (ctaEl) {
                ctaEl.textContent = preview.cta;
                ctaEl.href = preview.target;
            }
        }
    }

    /**
     * 📈 العدادات التصاعدية الذكية لقسم الفخر والاعتزاز لتعبر بصدق عن رحلة نجاح بوسي الأصيلة
     */
    function setupPrideCountersAnimation() {
        const prideSection = document.getElementById('pride-section') || document.querySelector('[id*="pride"]');
        if (!prideSection || !window.BoseStoreData?.homepage?.pride?.stats) return;

        const statsData = window.BoseStoreData.homepage.pride.stats;
        
        const animateCounter = (el, target, suffix) => {
            let current = 0;
            const duration = 2000;
            const stepTime = Math.max(Math.floor(duration / target), 15);
            const increment = Math.ceil(target / (duration / stepTime));
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    el.textContent = target + suffix;
                    clearInterval(timer);
                } else {
                    el.textContent = current + suffix;
                }
            }, stepTime);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    Object.keys(statsData).forEach(key => {
                        const targetEl = prideSection.querySelector(`[data-stat="${key}"]`) || document.getElementById(`pride-stat-${key}`);
                        if (targetEl && !targetEl.classList.contains('animated')) {
                            targetEl.classList.add('animated');
                            animateCounter(targetEl, parseInt(statsData[key].value, 10), statsData[key].stats[key].suffix || '');
                        }
                    });
                    observer.unobserve(prideSection);
                }
            });
        }, { threshold: 0.3 });

        observer.observe(prideSection);
    }

    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        if (!window.BoseStoreData) return basePrice;
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return parseFloat((basePrice * (1 + (rule.percent / 100))).toFixed(4));
        }
        return basePrice;
    };

    window.calculateProductFinalPrice = function(product, selectedOptions) {
        const opts = selectedOptions || {};
        let price = 0;
        
        if (product) {
            price = product.price || product.basePrice || 0;
            if (product.prices && opts.size) {
                price = product.prices[opts.size] || price;
            }
            const selectedPrinting = opts.printing || opts.printingType || 'none';
            if (selectedPrinting && selectedPrinting !== 'none') {
                let printingFee = 0;
                if (product.customizationOptions && product.customizationOptions.printing) {
                    const printOptions = product.customizationOptions.printing.options;
                    if (Array.isArray(printOptions)) {
                        const printingOpt = printOptions.find(opt => opt.id === selectedPrinting || opt.type === selectedPrinting);
                        if (printingOpt) printingFee = printingOpt.price;
                    }
                }
                if (printingFee === 0) {
                    if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') {
                        printingFee = 60;
                    } else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') {
                        printingFee = 15;
                    }
                }
                price += printingFee;
            }
            if (product.isMiniCake || product.type === "mini-cake" || product.slug === "mini-cake-two-person") {
                if (opts.extraToppingPrice) price += parseFloat(opts.extraToppingPrice);
                if (opts.printingPrice) price += parseFloat(opts.printingPrice);
            }
        }
        return window.calculateBosePrice(price, "menu-only");
    };

    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = window.BoseStoreData?.cakeBuilder;
        const safePersons = parseInt(persons, 10) || (config ? config.persons.minimum : 10) || 10;
        let price = (config ? config.basePrice : 580) || 580;
        const minPersons = (config ? config.persons.minimum : 10) || 10;
        const pricePerPerson = (config ? config.pricePerPerson : 145) || 145; 
        const extraPersons = Math.max(0, safePersons - minPersons);
        price += extraPersons * pricePerPerson;
        
        const selectedPrinting = options.printingType || options.printing || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (config && config.printingOptions) {
                const printOpt = config.printingOptions.find(opt => opt.id === selectedPrinting);
                if (printOpt) printingFee = printOpt.price;
            }
            if (printingFee === 0) {
                printingFee = (selectedPrinting === 'edible' || selectedPrinting === 'صورة_صالحة_للأكل') ? 60 : 15;
            }
            price += printingFee;
        }
        if (options.wrappingPrice) price += parseFloat(options.wrappingPrice) || 0;
        return window.calculateBosePrice(price, "menu-only");
    };

    window.calculateCustomFlowerPrice = function(flowerCount, options = {}) {
        const basePrice = 400; 
        const extraFlowerPrice = 35; 
        const safeFlowerCount = parseInt(flowerCount, 10) || 15;
        const extraFlowers = Math.max(0, safeFlowerCount - 15);
        let servicePrice = basePrice + (extraFlowers * extraFlowerPrice);
        if (options.hasSatinRibbon) servicePrice += 50; 
        const safePhotoCount = parseInt(options.photoCount, 10) || 0;
        if (options.hasPhotos && safePhotoCount > 0) servicePrice += safePhotoCount * 15; 
        if (options.hasGiftCard) servicePrice += 20; 
        const finalServicePrice = window.calculateBosePrice(servicePrice, "menu-only");
        
        const safeCashAmount = parseFloat(options.cashAmount) || 0;
        const safeChocolateBudget = parseFloat(options.chocolateBudget) || 0;
        return finalServicePrice + safeCashAmount + safeChocolateBudget;
    };

    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;
        const opts = selectedOptions || {};
        let finalUnitPrice = 0;
        if (product.type === "custom-flower") {
            finalUnitPrice = window.calculateCustomFlowerPrice(opts.flowerCount, opts);
        } else if (product.type === "custom-cake") {
            finalUnitPrice = window.calculateCustomCakePrice(opts.persons, opts);
        } else {
            finalUnitPrice = window.calculateProductFinalPrice(product, opts);
        }
        
        const isCustomizable = product.isMiniCake ||
                             product.type === "custom-cake" || 
                             product.type === "custom-flower" || 
                             (product.customizationOptions && Object.keys(opts).length > 0);
                             
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}` : String(product.slug || product.id);
        let correctFlavor = opts.flavorName || opts.cakeType || product.flavorName || product.flavor || "جاهز وفريش";
        if (correctFlavor === "none" || correctFlavor === "افتراضي") {
            correctFlavor = product.flavorName || "جاهز وفريش";
        }

        return {
            id: finalId,
            productSlug: product.slug,
            title: product.title,
            flavorName: correctFlavor,
            basePrice: parseFloat((product.price || product.basePrice || 0).toFixed(4)),
            finalPrice: parseFloat(finalUnitPrice.toFixed(4)),
            quantity: parseInt(quantity, 10) || 1,
            image: product.image || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
            type: product.type || (product.isMiniCake ? "mini-cake" : "standard"),
            customDetails: {
                cakeType: opts.cakeType || opts.cakeFlavor || "فانيليا",
                shape: opts.shape || "circle",
                persons: parseInt(opts.persons, 10) || (product.isMiniCake ? 2 : 0),
                printingType: opts.printingType || opts.printing || "none",
                customMessage: opts.customMessage || "",
                allergyNote: opts.allergyNote || "",
                flowerType: opts.flowerType || "none",
                flowerCount: parseInt(opts.flowerCount, 10) || 0,
                cashAmount: parseFloat(opts.cashAmount) || 0,
                hasSatinRibbon: !!opts.hasSatinRibbon,
                satinRibbonText: opts.satinRibbonText || "",
                photoCount: parseInt(opts.photoCount, 10) || 0,
                hasChocolate: !!opts.hasChocolate,
                chocolateBudget: parseFloat(opts.chocolateBudget) || 0,
                hasGiftCard: !!opts.hasGiftCard,
                giftCardText: opts.giftCardText || ""
            }
        };
    };

    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") return isOptional;
        const cleaned = window.sanitizeBosePhoneNumber(phone);
        return /^01[0125][0-9]{8}$/.test(cleaned);
    };

    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return "";
        let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        else if (cleaned.startsWith("00201")) cleaned = "0" + cleaned.substring(4);
        else if (cleaned.startsWith("1") && cleaned.length === 10) cleaned = "0" + cleaned;
        return cleaned;
    };

    window.validateBoseDeliverySchedule = function(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        const currentDateTime = new Date(Date.now() + (window.boseServerTimeOffset || 0));
        if (selectedDateTime <= currentDateTime) return false;
        return (selectedDateTime - currentDateTime) / (1000 * 60 * 60) >= 23.95; 
    };

    window.updateGlobalCartCounter = function() {
        const cartCountBadges = document.querySelectorAll('#nav-cart-count');
        if (cartCountBadges.length === 0) return;
        
        const rawCart = localStorage.getItem('bose_cart');
        const cart = rawCart ? JSON.parse(rawCart) : [];
        let totalDisplayItems = 0;
        cart.forEach(item => {
            const isBespokeOrCustom = item.type === "custom-cake" || 
                                      item.type === "custom-flower" || 
                                      item.type === "mini-cake" || 
                                      (item.id && item.id.includes("-"));
            totalDisplayItems += isBespokeOrCustom ? 1 : (parseInt(item.quantity, 10) || 1);
        });
        cartCountBadges.forEach(badge => badge.textContent = totalDisplayItems);
    };

    window.showBoseGlobalToast = function(message) {
        let container = document.getElementById('bose-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-container';
            container.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); z-index:999999; display:flex; flex-direction:column; gap:10px; pointer-events:none; font-family:"Cairo", sans-serif;';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.style.cssText = 'background-color:#FF91A4; color:#FFFFFF; padding:12px 24px; border-radius:30px; font-weight:700; font-size:14px; text-align:center; box-shadow:0 8px 32px rgba(255, 145, 164, 0.3); border:1px solid rgba(255,255,255,0.4); direction:rtl; opacity:0; transform:translateY(20px); transition:all 0.4s ease; pointer-events:auto;';
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 50);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => { toast.remove(); }, 400);
        }, 3000);
    };

    window.handleBoseDirectAddToCart = function(buttonElement, productId) {
        if (!window.BoseStoreData || !buttonElement) return;
        const product = window.BoseStoreData.products.find(p => p.id === productId);
        if (!product) return;

        const cardContainer = buttonElement.closest('.product-card-unified');
        let qty = 1;
        if (cardContainer) {
            const qtyInput = cardContainer.querySelector('.input-qty-value');
            if (qtyInput) qty = parseInt(qtyInput.value, 10) || 1;
        }

        const rawCart = localStorage.getItem('bose_cart');
        let cart = rawCart ? JSON.parse(rawCart) : [];
        const existingItem = cart.find(item => item.id === product.slug);
        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            const newItem = window.createCartItem(product, {}, qty);
            if (newItem) cart.push(newItem);
        }

        localStorage.setItem('bose_cart', JSON.stringify(cart));
        window.updateGlobalCartCounter();

        if (cardContainer) {
            const qtyInput = cardContainer.querySelector('.input-qty-value');
            const priceDisplay = cardContainer.querySelector('.product-card-price');
            if (qtyInput) qtyInput.value = "1";
            if (priceDisplay) priceDisplay.textContent = `${Math.round(product.price)} جنيه`;
        }

        const originalHtml = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fa-solid fa-check"></i> تمت الإضافة';
        buttonElement.style.backgroundColor = '#FF91A4';
        buttonElement.style.color = '#FFFFFF';
        buttonElement.style.borderColor = '#FF91A4';
        buttonElement.disabled = true;

        window.showBoseGlobalToast('تمت إضافة المنتج إلى السلة.');

        setTimeout(() => {
            buttonElement.innerHTML = originalHtml;
            buttonElement.style.backgroundColor = '';
            buttonElement.style.color = '';
            buttonElement.style.borderColor = '';
            buttonElement.disabled = false;
        }, 2500);
    };

    function injectEarlyDependencies() {
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            const p1 = document.createElement('link'); p1.rel = 'preconnect'; p1.href = 'https://fonts.googleapis.com';
            const p2 = document.createElement('link'); p2.rel = 'preconnect'; p2.href = 'https://fonts.gstatic.com'; p2.crossOrigin = 'anonymous';
            const font = document.createElement('link'); font.rel = 'stylesheet'; font.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
            document.head.append(p1, p2, font);
        }
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link'); fa.rel = 'stylesheet'; fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(fa);
        }
    }

    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;
        if (document.title !== data.seo.title) {
            document.title = data.seo.title;
        }
    }

    function buildAndInjectGlobalComponents() {
        const data = window.BoseStoreData;
        if (!data) return;

        const headerInjector = document.getElementById('bose-header-injector');
        if (headerInjector) {
            const marqueeMessages = data.navigation.topBarMessages;
            let marqueeItemsHtml = '';
            marqueeMessages.forEach(msg => { marqueeItemsHtml += `<span class="bose-marquee-item">${msg}</span>`; });

            headerInjector.innerHTML = `
                <div id="top-bar-marquee" class="bose-top-bar-marquee-container" aria-label="شريط الإعلانات التسويقية">
                    <div class="bose-top-bar-marquee-track">
                        ${marqueeItemsHtml} ${marqueeItemsHtml}
                    </div>
                </div>

                <header class="bose-sticky-header">
                    <div class="header-right-side">
                        <button id="mobile-menu-toggle" class="bose-nav-btn" aria-label="فتح القائمة الجانبية">
                            <i class="fa-solid fa-bars-staggered"></i>
                        </button>
                        <a href="index.html" class="brand-logo-container">
                            <img id="bose-store-logo" src="${data.store.logo}" alt="لوجو حلويات بوسي الفاخرة" class="brand-logo-img" />
                            <span class="brand-name-display">حلويات بوسي</span>
                        </a>
                    </div>
                    <div class="header-left-side">
                        <button id="nav-search-btn" class="bose-nav-btn" aria-label="البحث عن صنف أو نكهة">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <a href="cart.html" class="nav-cart-icon-wrapper" aria-label="عرض سلة المشتريات">
                            <i class="fa-solid fa-bag-shopping bose-nav-btn" style="padding:0;"></i>
                            <span id="nav-cart-count" class="nav-cart-count-badge">0</span>
                        </a>
                    </div>
                </header>

                <div id="bose-sidebar-drawer" class="bose-sidebar-drawer" aria-hidden="true">
                    <div class="sidebar-header">
                        <div class="sidebar-logo-container">
                            <img src="${data.store.logo}" alt="لوجو حلويات بوسي" class="sidebar-logo" />
                            <span class="sidebar-brand-name">حلويات بوسي</span>
                        </div>
                        <button id="sidebar-close-btn" class="sidebar-close-btn" aria-label="إغلاق القائمة">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div class="sidebar-scrollable-content">
                        <div class="sidebar-menu-wrapper">
                            <div class="sidebar-section-title">التصفح الفاخر</div>
                            <ul class="sidebar-links-list">
                                <li class="sidebar-link-item">
                                    <a href="index.html">
                                        <span class="link-main-side"><i class="fa-solid fa-house main-icon"></i>الرئيسية</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="menu.html">
                                        <span class="link-main-side"><i class="fa-solid fa-utensils main-icon"></i>المنيو الشامل</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="cake-builder.html">
                                        <span class="link-main-side"><i class="fa-solid fa-cake-candles main-icon"></i>محاكي التورت التفاعلي</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="flower-builder.html">
                                        <span class="link-main-side"><i class="fa-solid fa-seedling main-icon"></i>محاكي الورد الخاص</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="cart.html">
                                        <span class="link-main-side"><i class="fa-solid fa-basket-shopping main-icon"></i>سلة التسوق</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div class="sidebar-menu-wrapper" style="margin-top: 25px;">
                            <div class="sidebar-section-title">روابط المعرفة</div>
                            <ul class="sidebar-links-list">
                                <li class="sidebar-link-item">
                                    <a href="about.html">
                                        <span class="link-main-side"><i class="fa-solid fa-heart-pulse main-icon"></i>مَنْ نحن</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="contact.html">
                                        <span class="link-main-side"><i class="fa-solid fa-phone-flip main-icon"></i>تواصل معنا</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="sidebar-footer-contacts">
                        <a href="https://wa.me/${data.social.whatsapp}" target="_blank" class="sidebar-contact-pill">
                            <i class="fa-brands fa-whatsapp"></i>
                            <span>راسلنا فوري عبر الواتساب</span>
                        </a>
                        <a href="tel:${data.store.phone || '01097238441'}" class="sidebar-contact-pill">
                            <i class="fa-solid fa-phone"></i>
                            <span>اتصال هاتفي مباشر</span>
                        </a>
                    </div>
                </div>
                <div id="bose-sidebar-overlay" class="bose-sidebar-overlay"></div>

                <div id="bose-search-modal" class="bose-search-modal" aria-hidden="true">
                    <div class="search-modal-header">
                        <button id="search-modal-close" class="bose-nav-btn" style="font-size: 26px;" aria-label="إغلاق البحث">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="search-input-wrapper">
                        <input type="text" id="bose-search-field" class="bose-search-field" placeholder="ابحث عن النكهة أو الصنف (لوتس، بيستاشيو...)" aria-label="حقل البحث" autocomplete="off" />
                        <i class="fa-solid fa-magnifying-glass search-field-icon"></i>
                    </div>
                    <div id="search-results-container" class="search-results-container"></div>
                </div>
            `;
            setupHeaderAndSidebarEvents();
        }

        const footerInjector = document.getElementById('bose-footer-injector');
        if (footerInjector) {
            footerInjector.innerHTML = `
                <footer class="bose-footer" role="contentinfo">
                    <div class="footer-grid-layout">
                        <div class="footer-column-block">
                            <div class="footer-brand-meta">
                                <img src="${data.store.logo}" alt="حلويات بوسي الفاخرة" class="footer-logo" />
                                <span class="footer-title">حلويات بوسي</span>
                            </div>
                            <p id="footer-about-text" class="footer-about-paragraph">${data.footer.about}</p>
                            <div id="footer-social-links" class="footer-social-wrapper">
                                <a href="${data.social.facebook}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-facebook-f"></i></a>
                                <a href="${data.social.instagram}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-instagram"></i></a>
                                <a href="${data.social.tiktok}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-tiktok"></i></a>
                                <a href="https://wa.me/${data.social.whatsapp}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-whatsapp"></i></a>
                            </div>
                        </div>
                        <div class="footer-column-block">
                            <h3 class="footer-heading-title">روابط سريعة</h3>
                            <ul class="footer-links-ul">
                                <li><a href="index.html">الرئيسية</a></li>
                                <li><a href="menu.html">المنيو الشامل</a></li>
                                <li><a href="cake-builder.html">محاكي التورت</a></li>
                                <li><a href="flower-builder.html">محاكي الورد</a></li>
                                <li><a href="cart.html">سلة التسوق</a></li>
                            </ul>
                        </div>
                        <div class="footer-column-block">
                            <h3 class="footer-heading-title">وثائق وسياسات</h3>
                            <ul class="footer-links-ul">
                                <li><a href="policies/privacy-policy.html">سياسة الخصوصية</a></li>
                                <li><a href="policies/refund-policy.html">سياسة الاسترجاع المالي</a></li>
                                <li><a href="policies/shipping-policy.html">سياسة الشحن والتوصيل</a></li>
                                <li><a href="policies/terms.html">الشروط والأحكام</a></li>
                                <li class="footer-contact-item" style="margin-top: 15px; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #111111;">
                                    <i class="fa-solid fa-location-dot" style="color: #FF91A4;"></i>
                                    <span>${data.store.pickup.address}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <p class="footer-copyright-block">جميع الحقوق محفوظة &copy; <span id="footer-year-display">2026</span> لعلامة حلويات بوسي الفاخرة.</p>
                </footer>
            `;
        }
    }

    function setupHeaderAndSidebarEvents() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const closeBtn = document.getElementById('sidebar-close-btn');
        const sidebar = document.getElementById('bose-sidebar-drawer');
        const overlay = document.getElementById('bose-sidebar-overlay');
        
        const searchBtn = document.getElementById('nav-search-btn');
        const searchModal = document.getElementById('bose-search-modal');
        const searchClose = document.getElementById('search-modal-close');
        const searchField = document.getElementById('bose-search-field');
        const resultsContainer = document.getElementById('search-results-container');

        if (toggleBtn && sidebar && overlay) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.add('open');
                overlay.classList.add('show');
                document.body.classList.add('drawer-active');
            });
        }
        
        const closeSidebar = () => {
            if (sidebar && overlay) {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
                document.body.classList.remove('drawer-active');
            }
        };

        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);

        if (searchBtn && searchModal) {
            searchBtn.addEventListener('click', () => {
                searchModal.classList.add('active');
                setTimeout(() => searchField?.focus(), 200);
            });
        }

        if (searchClose) {
            searchClose.addEventListener('click', () => {
                searchModal.classList.remove('active');
            });
        }

        if (searchField && resultsContainer) {
            searchField.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                if (!query) { resultsContainer.innerHTML = ''; return; }

                const allProducts = window.BoseStoreData?.products || [];
                const filtered = allProducts.filter(p => p.title?.toLowerCase().includes(query) || p.flavorName?.toLowerCase().includes(query));

                let html = '';
                filtered.forEach(p => {
                    let targetUrl = (p.id === 'toort-custom-master' || p.slug === 'toort-custom-master') ? 'cake-builder.html' : 
                                    ((p.id === 'flowers-master' || p.slug === 'flowers-master') ? 'flower-builder.html' : `product.html?slug=${p.slug}`);
                    html += `
                        <a href="${targetUrl}" class="search-result-card-item">
                            <img src="${p.images[0]}" class="search-result-img" />
                            <div class="search-result-info">
                                <div class="search-result-name">${p.title} - ${p.flavorName}</div>
                            </div>
                            <div class="search-result-price-view">${Math.round(p.price)} جنيه</div>
                        </a>
                    `;
                });
                resultsContainer.innerHTML = html || '<div class="search-no-results-msg">لم نجد أصنافاً تطابق بحثك.</div>';
            });
        }
    }

    function showGlobalFriendlyError() {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background-color:#FF91A4; color:#FFFFFF; padding:12px 24px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:99999; direction:rtl; font-size:14px;';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.';
        document.body.appendChild(errorDiv);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadStoreDatabase);
    } else {
        loadStoreDatabase();
    }
})();