/**
 * core-engine.js - المحرك المركزي العالمي وحارس البيانات والحسابات المالية
 * موقع حلويات بوسي (BoseSweets) - النسخة الاحترافية المؤمنة بالكامل V3.2
 * [تحديث صارم]: إصلاح شلال الصور، المحاكيات، أزرار منتجاتنا، وإيماءات سلايدر الفئات بالملي.
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
    window.boseServerTimeOffset = 0; 

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
        
        injectHomepageSectionMeta();
        renderDynamicWaterfall();
        renderHomepageProductGrids();
        setupOurProductsShowMore();
        injectSimulatorsPreviewData();
        setupCategoriesSliderTouch();
        
        document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
    }

    /**
     * ✍️ ضخ العناوين والوصف للأقسام الرئيسية لعلامة حلويات بوسي لمنع الاختفاء البصري واصلاح السلايدر
     */
    function injectHomepageSectionMeta() {
        const data = window.BoseStoreData;
        if (!data || !data.homepage) return;

        // 1. قسم عقد من الإتقان - معالجة ظهور الصور بلا انقطاع ودون حجب أو اختفاء
        const excellenceSection = document.getElementById('excellence-section') || document.querySelector('[id*="excellence"]');
        if (excellenceSection && data.homepage.excellence) {
            const titleEl = excellenceSection.querySelector('.section-title') || excellenceSection.querySelector('h2');
            const descEl = excellenceSection.querySelector('.section-desc') || excellenceSection.querySelector('p');
            if (titleEl) titleEl.textContent = data.homepage.excellence.title;
            if (descEl) descEl.textContent = data.homepage.excellence.description;
            
            const track = document.getElementById('excellence-images-track') || excellenceSection.querySelector('.excellence-track') || excellenceSection.querySelector('[id*="track"]');
            if (track && data.homepage.excellence.images) {
                const imagesHtml = data.homepage.excellence.images.map(img => `
                    <div class="excellence-slide-card" style="width: 100vw; flex-shrink: 0; display: block;">
                        <img src="${img}" alt="إتقان حلويات بوسي الفاخرة" style="width:100%; height:auto; display:block; object-fit:cover;" />
                    </div>
                `).join('');
                // حلقة حركة دائرية انسيابية مطلقة وممتدة هندسياً بلا أي مساحات فارغة
                track.innerHTML = `<div class="excellence-track-loop" style="display:flex; width:max-content; animation: boseExcellence 35s linear infinite; will-change: transform;">${imagesHtml} ${imagesHtml} ${imagesHtml}</div>`;
            }
        }

        // 2. قسم تسوق حسب الفئة (إلغاء الحركة التلقائية المزعجة وحقن مؤشرات التصفح والأسهم)
        const categoriesSection = document.getElementById('categories-slider-section') || document.getElementById('categories-section') || document.querySelector('[id*="categories"]');
        if (categoriesSection && data.homepage.categoriesSlider) {
            const titleEl = categoriesSection.querySelector('.section-title') || categoriesSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "تسوق حسب الفئة";
            
            const track = document.getElementById('categories-track') || categoriesSection.querySelector('.categories-track') || categoriesSection.querySelector('[id*="track"]');
            if (track) {
                track.innerHTML = data.homepage.categoriesSlider.map(cat => `
                    <div class="category-card-unified" onclick="window.location.href='category.html?id=${cat.id}'" style="cursor:pointer; background:#FFFFFF; border:1px solid rgba(255,145,164,0.15); border-radius:24px; padding:12px; width:280px; flex-shrink:0; box-sizing:border-box; margin:0 15px; text-align:center;">
                        <img src="${cat.image}" alt="${cat.title}" class="category-card-img" style="width:100%; height:280px; object-fit:cover; border-radius:18px;" loading="lazy" />
                        <div class="category-card-name" style="font-size:20px; font-weight:700; color:#111111; margin-top:15px;">${cat.title}</div>
                    </div>
                `).join('');
                
                // بناء الـ 12 دوتس والتحكم السهمي ديناميكياً
                buildCategoriesDots(data.homepage.categoriesSlider.length);
            }
        }

        // 3. قسم الأكثر مبيعاً
        const mostSellingSection = document.getElementById('most-selling-section');
        if (mostSellingSection) {
            const titleEl = mostSellingSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "الأكثر مبيعاً";
            const descEl = mostSellingSection.querySelector('p');
            if (descEl) descEl.textContent = "تشكيلة من قطع السعادة الفاخرة والأكثر طلباً وإعجاباً من عملائنا.";
        }

        // 4. قسم وصل حديثاً
        const newArrivalsSection = document.getElementById('new-arrivals-section');
        if (newArrivalsSection) {
            const titleEl = newArrivalsSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "وصل حديثاً";
            const descEl = newArrivalsSection.querySelector('p');
            if (descEl) descEl.textContent = "اكتشف أحدث ابتكاراتنا الحصرية وتوليفات النكهات الغنية المصنوعة بحب.";
        }

        // 5. قسم منتجاتنا
        const ourProductsSection = document.getElementById('our-products-section') || document.querySelector('[id*="our-products"]');
        if (ourProductsSection) {
            const titleEl = ourProductsSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "منتجاتنا";
            const descEl = ourProductsSection.querySelector('p');
            if (descEl) descEl.textContent = "التشكيلة العامة الفاخرة المحضرة يومياً بمكونات طبيعية 100%.";
        }
    }

    /**
     * بناء مؤشرات التنقل النقطية الـ 12 والأسهم لقسم تسوق حسب الفئة
     */
    function buildCategoriesDots(count) {
        const categoriesSection = document.getElementById('categories-slider-section') || document.getElementById('categories-section') || document.querySelector('[id*="categories"]');
        if (!categoriesSection) return;

        let controlsWrapper = categoriesSection.querySelector('.categories-slider-controls-wrapper');
        let dotsContainer = document.getElementById('categories-dots-container');
        
        if (!controlsWrapper) {
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
            dotsContainer.style.cssText = 'display:flex; justify-content:center; align-items:center; gap:8px;';
            
            controlsWrapper.appendChild(arrowsContainer);
            controlsWrapper.appendChild(dotsContainer);
            categoriesSection.appendChild(controlsWrapper);
        }
        
        let dotsHtml = '';
        for (let i = 0; i < count; i++) {
            dotsHtml += `<span class="bose-slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`;
        }
        dotsContainer.innerHTML = dotsHtml;
    }

    /**
     * 🎹 تفعيل معالجة الإيماءات والسحب اليدوي السلس والتحكم الكامل بالأسهم (حظر الحركة التلقائية)
     */
    function setupCategoriesSliderTouch() {
        const categoriesSection = document.getElementById('categories-slider-section') || document.getElementById('categories-section') || document.querySelector('[id*="categories"]');
        const track = document.getElementById('categories-track') || (categoriesSection ? categoriesSection.querySelector('.categories-track') || categoriesSection.querySelector('[id*="track"]') : null);
        if (!track) return;

        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;

        track.style.display = 'flex';
        track.style.overflowX = 'auto';
        track.style.scrollBehavior = 'smooth';
        track.style.webkitOverflowScrolling = 'touch';

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
            startX = e.touches[0].pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            const x = e.touches[0].pageX - track.offsetLeft;
            const walk = (x - startX) * 1.2;
            track.scrollLeft = scrollLeft - walk;
        }, { passive: true });

        track.addEventListener('touchend', () => {
            updateActiveDot(track);
        });

        // ربط أزرار التحكم السهمي يميناً ويساراً
        if (categoriesSection) {
            const nextBtn = categoriesSection.querySelector('.bose-slider-arrow.next');
            const prevBtn = categoriesSection.querySelector('.bose-slider-arrow.prev');
            
            if (nextBtn && prevBtn) {
                const getStep = () => {
                    const card = track.querySelector('.category-card-unified');
                    return card ? card.offsetWidth + 30 : 310;
                };
                
                nextBtn.addEventListener('click', () => {
                    track.scrollBy({ left: getStep(), behavior: 'smooth' });
                    setTimeout(() => updateActiveDot(track), 350);
                });
                
                prevBtn.addEventListener('click', () => {
                    track.scrollBy({ left: -getStep(), behavior: 'smooth' });
                    setTimeout(() => updateActiveDot(track), 350);
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
                    const cardWidth = cards[index].offsetWidth + 30; 
                    track.scrollTo({
                        left: cardWidth * index,
                        behavior: 'smooth'
                    });
                    
                    dotsContainer.querySelectorAll('.bose-slider-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                }
            });
        }
    }

    function updateActiveDot(track) {
        const cards = track.querySelectorAll('.category-card-unified');
        if (cards.length === 0) return;
        const cardWidth = cards[0].offsetWidth + 30;
        const currentIndex = Math.round(track.scrollLeft / cardWidth);
        
        const dots = document.querySelectorAll('.bose-slider-dot');
        dots.forEach((dot, idx) => {
            if (idx === currentIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    /**
     * 🌊 بناء وحقن شلال المنتجات البصري الأنيق ديناميكياً لمنع الاختفاء والقص البصري
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
     * 📊 ضخ وحقن شبكات المنتجات لجميع الأقسام بالصفحة الرئيسية ديناميكياً بحدود كمية هندسية صارمة
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

        // 3. قسم منتجاتنا (تأمين قراءة الـ ID أو الـ Class لضمان الحقن الفوري الفعّال)
        const ourProductsGrid = document.getElementById('our-products-section-grid') || document.getElementById('our-products-grid') || document.querySelector('.our-products-grid') || document.querySelector('[id*="our-products"][class*="grid"]');
        if (ourProductsGrid && data.homepage.ourProducts) {
            const initialItems = data.homepage.ourProducts.slice(0, 4).map(id => data.products.find(p => p.id === id || p.slug === id)).filter(Boolean);
            ourProductsGrid.innerHTML = initialItems.map(p => createProductCardHTML(p)).join('');
        }
    }

    /**
     * 🌟 نظام التحكم لزر (استعرض المزيد / إظهار المزيد) بقسم منتجاتنا لحقن الـ 8 كروت كاملة ومستقرة
     */
    function setupOurProductsShowMore() {
        const showMoreBtn = document.getElementById('our-products-show-more-btn') || document.querySelector('[id*="show-more"]');
        const ourProductsGrid = document.getElementById('our-products-section-grid') || document.getElementById('our-products-grid') || document.querySelector('.our-products-grid') || document.querySelector('[id*="our-products"][class*="grid"]');
        const data = window.BoseStoreData;

        if (!showMoreBtn || !ourProductsGrid || !data) return;

        showMoreBtn.addEventListener('click', function() {
            const allItems = data.homepage.ourProducts.map(id => data.products.find(p => p.id === id || p.slug === id)).filter(Boolean);
            ourProductsGrid.innerHTML = allItems.map(p => createProductCardHTML(p)).join('');
            showMoreBtn.style.display = 'none'; 
        });
    }

    /**
     * 👑 ضخ وحقن خيارات وألوان محاكي التورت وماكي الورد لملء الشاشة بالكامل بدون أي إزاحة وبأزرار واضحة
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
                ctaEl.style.display = 'inline-block';
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
                ctaEl.style.display = 'inline-block';
            }
        }
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

    window.onBoseDatabaseReady = function(callback) {
        if (window.BoseStoreData && window.BoseStoreData.store) {
            callback(window.BoseStoreData);
        } else {
            const handleLoaded = (e) => {
                callback(e.detail);
                document.removeEventListener('BoseDatabaseLoaded', handleLoaded);
            };
            document.addEventListener('BoseDatabaseLoaded', handleLoaded);
        }
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
        
        if (!document.getElementById('bose-header-fix-styles')) {
            const fixStyle = document.createElement('style');
            fixStyle.id = 'bose-header-fix-styles';
            fixStyle.textContent = `
                :root {
                    --bose-pink: #FF91A4;
                    --bose-white: #FFFFFF;
                    --bose-black: #111111;
                    --bose-gold: #D4AF37;
                    --bose-shadow-glow: 0 8px 32px rgba(255, 145, 164, 0.12);
                    --bose-shadow-hover: 0 16px 40px rgba(255, 145, 164, 0.22);
                }
                body { font-family: 'Cairo', sans-serif !important; background-color: #FFFFFF !important; color: #111111 !important; margin: 0; padding-top: 110px !important; overflow-x: hidden; }
                h1, h2 { font-weight: 700 !important; color: #111111 !important; }
                h3, h4 { font-weight: 600 !important; color: #111111 !important; }
                
                .bose-sticky-header { position: fixed !important; top: 40px !important; left: 0 !important; width: 100% !important; z-index: 40000 !important; box-shadow: 0 4px 20px rgba(255, 145, 164, 0.08) !important; background-color: #FFFFFF !important; display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; box-sizing: border-box; height: 70px; }
                .bose-top-bar-marquee-container { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; z-index: 41000 !important; height: 40px !important; background-color: #FF91A4; overflow: hidden; display: flex; align-items: center; }
                .bose-top-bar-marquee-track { display: flex; width: max-content; animation: boseMarquee 25s linear infinite; will-change: transform; }
                .bose-marquee-item { color: #FFFFFF; font-weight: 600; font-size: 13px; padding: 0 40px; direction: rtl; white-space: nowrap; }
                @keyframes boseMarquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
                
                .header-right-side, .header-left-side { display: flex; align-items: center; gap: 15px; }
                .bose-nav-btn { background: none; border: none; font-size: 20px; color: #111111; cursor: pointer; transition: color 0.2s; padding: 5px; }
                .bose-nav-btn:hover { color: #FF91A4; }
                .brand-logo-container { display: flex; align-items: center; gap: 10px; text-decoration: none; }
                .brand-logo-img { width: 42px; height: 42px; object-fit: contain; }
                .brand-name-display { font-size: 18px; font-weight: 700; color: #111111; }
                .nav-cart-icon-wrapper { position: relative; text-decoration: none; display: flex; align-items: center; }
                .nav-cart-count-badge { position: absolute; top: -5px; right: -8px; background-color: #FF91A4; color: #FFFFFF; font-size: 11px; font-weight: 700; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: 1px solid #FFFFFF; }
                
                .bose-sidebar-drawer { position: fixed; top: 0; right: -360px; width: 360px; height: 100%; background-color: #FFFFFF !important; z-index: 50000; transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: -8px 0 32px rgba(255, 145, 164, 0.12); direction: rtl; border-left: 1px solid rgba(255, 145, 164, 0.2); display: flex; flex-direction: column; overflow: hidden; }
                .bose-sidebar-drawer.open { right: 0; }
                .sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid rgba(255, 145, 164, 0.2); background: #FFFFFF; }
                .sidebar-brand-name { font-size: 18px; font-weight: 700; color: #111111; }
                .sidebar-close-btn { background: none; border: none; font-size: 26px; color: #FF91A4; cursor: pointer; transition: transform 0.3s ease; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; }
                .sidebar-close-btn:hover { transform: rotate(90deg); }
                
                .sidebar-scrollable-content { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 28px; scrollbar-width: none; }
                .sidebar-scrollable-content::-webkit-scrollbar { display: none; }
                .sidebar-section-title { font-size: 14px; font-weight: 700; color: #FF91A4; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-right: 4px; }
                .sidebar-links-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
                .sidebar-link-item a { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; color: #111111; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 12px; transition: all 0.25s ease; border: 1px solid transparent; min-height: 48px; }
                .sidebar-link-item a .link-main-side { display: flex; align-items: center; gap: 14px; }
                .sidebar-link-item a i.main-icon { color: #FF91A4; font-size: 18px; width: 24px; text-align: center; }
                .sidebar-link-item a i.arrow-icon { font-size: 12px; color: #111111; opacity: 0.3; }
                .sidebar-link-item a:hover { background-color: rgba(255, 145, 164, 0.05); border-color: rgba(255, 145, 164, 0.1); }
                .sidebar-link-item a:hover i.arrow-icon { opacity: 1; color: #FF91A4; transform: translateX(-4px); }
                
                .sidebar-footer-contacts { border-top: 1px solid rgba(255, 145, 164, 0.15); padding: 20px 24px; background-color: #FFFFFF; display: flex; flex-direction: column; gap: 10px; }
                .sidebar-contact-pill { display: flex; align-items: center; gap: 14px; padding: 12px 18px; background: rgba(255, 145, 164, 0.04); border-radius: 30px; text-decoration: none; color: #111111; font-size: 14px; font-weight: 600; border: 1px solid rgba(255, 145, 164, 0.05); min-height: 44px; }
                .sidebar-contact-pill i { font-size: 16px; color: #FF91A4; }
                .sidebar-contact-pill:hover { background: #FF91A4; color: #FFFFFF !important; }
                .sidebar-contact-pill:hover i { color: #FFFFFF; }
                
                .bose-sidebar-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(17, 17, 17, 0.35); opacity: 0; pointer-events: none; z-index: 49000; transition: opacity 0.4s ease; backdrop-filter: blur(4px); }
                .bose-sidebar-overlay.show { opacity: 1; pointer-events: auto; }
                
                .bose-search-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #FFFFFF; z-index: 60000; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; direction: rtl; padding: 30px; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px; }
                .bose-search-modal.active { opacity: 1; pointer-events: auto; }
                .search-modal-header { display: flex; justify-content: flex-end; }
                .search-input-wrapper { position: relative; max-width: 600px; width: 100%; margin: 0 auto; }
                .bose-search-field { width: 100%; border: 1px solid rgba(255, 145, 164, 0.4); padding: 14px 50px 14px 20px; border-radius: 30px; font-size: 16px; box-sizing: border-box; outline: none; font-family: "Cairo", sans-serif; }
                .bose-search-field:focus { border-color: #FF91A4; box-shadow: 0 0 10px rgba(255,145,164,0.2); }
                .search-field-icon { position: absolute; top: 50%; right: 20px; transform: translateY(-50%); color: #FF91A4; font-size: 18px; }
                .search-results-container { flex: 1; overflow-y: auto; max-width: 600px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
                .search-result-card-item { display: flex; align-items: center; gap: 15px; padding: 10px; border: 1px solid rgba(255, 145, 164, 0.15); border-radius: 12px; text-decoration: none; color: #111111; transition: background 0.2s; }
                .search-result-card-item:hover { background: rgba(255, 145, 164, 0.03); }
                .search-result-img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
                .search-result-info { flex: 1; }
                .search-result-name { font-weight: 700; font-size: 14px; }
                .search-result-price-view { font-weight: 700; color: #FF91A4; font-size: 14px; }
                .search-no-results-msg { text-align: center; color: #111111; opacity: 0.6; padding: 40px; font-weight: 600; }

                .bose-footer { background-color: #FFFFFF !important; border-top: 1px solid rgba(255, 145, 164, 0.3); padding: 60px 20px 20px; direction: rtl; }
                .footer-grid-layout { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; }
                .footer-brand-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
                .footer-logo { width: 50px; height: 50px; object-fit: contain; }
                .footer-title { font-size: 22px; font-weight: 700; color: #111111; }
                .footer-about-paragraph { color: #111111; font-size: 14px; line-height: 1.8; margin-bottom: 25px; font-weight: 400; }
                .footer-social-wrapper { display: flex; gap: 12px; }
                .footer-social-icon-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background-color: rgba(255, 145, 164, 0.1); color: #FF91A4 !important; text-decoration: none; font-size: 16px; transition: all 0.3s ease; }
                .footer-social-icon-btn:hover { background-color: #FF91A4; color: #FFFFFF !important; transform: translateY(-4px); box-shadow: 0 8px 20px rgba(255, 145, 164, 0.3); }
                .footer-heading-title { font-size: 16px; font-weight: 700; color: #111111; margin-bottom: 20px; position: relative; padding-bottom: 8px; }
                .footer-heading-title::after { content: ''; position: absolute; bottom: 0; right: 0; width: 40px; height: 2px; background-color: #FF91A4; }
                .footer-links-ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
                .footer-links-ul li a { color: #111111; text-decoration: none; font-size: 14px; font-weight: 600; transition: all 0.3s ease; display: inline-block; }
                .footer-links-ul li a:hover { color: #FF91A4; transform: translateX(-6px); }
                .footer-contact-item { display: flex; align-items: center; gap: 10px; color: #111111; font-size: 14px; font-weight: 600; }
                .footer-contact-item i { color: #FF91A4; font-size: 16px; }
                .footer-copyright-block { text-align: center; border-top: 1px solid rgba(255, 145, 164, 0.15); margin-top: 50px; padding-top: 20px; font-size: 13px; color: #111111; font-weight: 600; }
                .footer-copyright-block span { color: #FF91A4; font-weight: 700; }
                
                .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; width: 100%; max-width: 1200px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
                @media (max-width: 768px) { .products-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; } }
                .product-card-unified { background: #FFFFFF; border: 1px solid rgba(255, 145, 164, 0.2); border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 8px 32px rgba(255, 145, 164, 0.04); transition: transform 0.3s ease, box-shadow 0.3s ease; position: relative; }
                .product-card-unified:hover { transform: translateY(-5px); box-shadow: 0 12px 40px rgba(255, 145, 164, 0.12); }
                .product-card-img { width: 100%; height: 220px; object-fit: cover; border-radius: 14px; }
                @media (min-width: 768px) { .product-card-img { height: 260px; } }
                @media (min-width: 1024px) { .product-card-img { height: 320px; } }
                .product-card-title { font-size: 18px; font-weight: 700; color: #111111; margin: 0; font-family: "Cairo", sans-serif; }
                .product-card-flavor-name { font-size: 14px; font-weight: 600; color: #FF91A4; }
                .product-card-desc { font-size: 13px; color: #111111; opacity: 0.7; line-height: 1.6; margin: 0; min-height: 42px; }
                
                /* [تحديث هندسي]: العداد زائد يمين والناقص يسار لراحة الموبايل واليد */
                .product-card-qty-wrapper { display: flex; align-items: center; justify-content: center; gap: 10px; background: rgba(255, 145, 164, 0.05); padding: 6px; border-radius: 30px; margin-top: auto; direction: rtl; }
                .btn-qty-minus, .btn-qty-plus { background: #FFFFFF; border: 1px solid rgba(255, 145, 164, 0.3); width: 32px; height: 32px; border-radius: 50%; font-weight: 700; color: #111111; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .btn-qty-minus:hover, .btn-qty-plus:hover { background: #FF91A4; color: #FFFFFF; border-color: #FF91A4; }
                .input-qty-value { border: none; background: transparent; width: 40px; text-align: center; font-size: 15px; font-weight: 700; color: #111111; -moz-appearance: textfield; }
                .input-qty-value::-webkit-outer-spin-button, .input-qty-value::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                .product-card-price { font-size: 18px; font-weight: 700; color: #111111; text-align: center; margin: 4px 0; }
                .btn-add-to-cart { background: #FFFFFF; border: 1px solid #FF91A4; color: #FF91A4; padding: 10px 20px; border-radius: 25px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.3s ease; width: 100%; box-sizing: border-box; }
                .btn-add-to-cart:hover { background: #FF91A4; color: #FFFFFF; }
                
                /* [تحديث هندسي]: السلايدر الجانبي المستجيب للسحب الكامل مع النقاط والأسهم المتقاطعة */
                .categories-slider-outer-container { position: relative; width: 100%; max-width: 1200px; margin: 0 auto; overflow: hidden; padding: 20px 0; }
                .categories-track-slider { display: flex; overflow-x: auto; scroll-behavior: smooth; padding: 10px; cursor: grab; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
                .categories-track-slider::-webkit-scrollbar { display: none; }
                .category-card-unified { background: #FFFFFF; border: 1px solid rgba(255, 145, 164, 0.15); border-radius: 24px; padding: 12px; width: 280px; box-shadow: var(--bose-shadow-glow); transition: all 0.3s ease; text-align: center; flex-shrink: 0; box-sizing: border-box; margin: 0 15px; }
                .category-card-unified:hover { transform: translateY(-6px); box-shadow: var(--bose-shadow-hover); border-color: var(--bose-pink); }
                .category-card-img { width: 100%; height: 280px; object-fit: cover; border-radius: 18px; }
                .category-card-name { font-size: 20px; font-weight: 700; color: #111111; margin-top: 15px; font-family: "Cairo", sans-serif; }
                
                @media (min-width: 768px) { .category-card-unified { width: 340px; } .category-card-img { height: 340px; } }
                @media (min-width: 1024px) { .category-card-unified { width: 420px; } .category-card-img { height: 420px; } }
                
                /* تصميم نقاط التصفح والأسهم */
                .categories-slider-dots { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 24px; width: 100%; }
                .bose-slider-dot { width: 10px; height: 10px; background-color: rgba(255, 145, 164, 0.3); border-radius: 50%; cursor: pointer; transition: all 0.3s ease; }
                .bose-slider-dot.active { background-color: #FF91A4; width: 24px; border-radius: 50px; box-shadow: 0 0 8px rgba(255, 145, 164, 0.5); }
                .bose-slider-arrow { background: #FFFFFF; border: 1px solid #FF91A4; color: #FF91A4; width: 45px; height: 45px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; }
                .bose-slider-arrow:hover { background: #FF91A4 !important; color: #FFFFFF !important; }

                .waterfall-up { display: flex; flex-direction: column; gap: 20px; animation: boseWaterfallUp 40s linear infinite; will-change: transform; }
                .waterfall-down { display: flex; flex-direction: column; gap: 20px; animation: boseWaterfallDown 40s linear infinite; will-change: transform; }
                @keyframes boseWaterfallUp { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(0, -50%, 0); } }
                @keyframes boseWaterfallDown { 0% { transform: translate3d(0, -50%, 0); } 100% { transform: translate3d(0, 0, 0); } }
                
                /* [تحديث هندسي]: حلقة الحركة الدائرية اللانهائية الممتدة بلا أي فراغات بقسم عقد من الإتقان */
                .excellence-track-loop { display: flex; width: max-content; animation: boseExcellence 35s linear infinite; will-change: transform; }
                .excellence-slide-card { width: 100vw; height: auto; flex-shrink: 0; }
                .excellence-slide-card img { width: 100%; height: auto; object-fit: cover; }
                @keyframes boseExcellence { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-33.3333%, 0, 0); } }

                /* [تحديث هندسي]: تلوين خلفيات بلوك المحاكيات باللون البمبي الفاخر لملء الشاشة بالكامل بقوة الـ DOM الصريحة بالفيديو */
                #cake-preview-section, #flower-preview-section, .bose-simulator-preview-block, [id*="cake-preview"], [id*="flower-preview"] { background: #FF91A4 !important; padding: 60px 20px !important; border-radius: 0px !important; text-align: center !important; width: 100% !important; box-sizing: border-box !important; }
                #cake-preview-section h2, #cake-preview-section p, #flower-preview-section h2, #flower-preview-section p, [id*="preview"] h2, [id*="preview"] p { color: #FFFFFF !important; }
                .bose-simulator-preview-cta-btn, #cake-preview-cta, #flower-preview-cta, [id*="preview"] a { display: inline-block !important; background-color: #FFFFFF !important; color: #FF91A4 !important; font-weight: 700 !important; padding: 12px 32px !important; border-radius: 30px !important; text-decoration: none !important; margin-top: 20px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important; transition: all 0.3s !important; }
                .bose-simulator-preview-cta-btn:hover, #cake-preview-cta:hover, #flower-preview-cta:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important; }
                
                /* تأمين الحجم المثالي لصورة المنتج داخل المحاكي لتصبح أكبر بـ 5 أضعاف بدون إزاحة */
                #cake-preview-img, #flower-preview-img, .simulator-preview-img, [id*="preview-img"] { max-width: 600px !important; width: 100% !important; height: auto !important; object-fit: contain !important; border-radius: 16px !important; margin: 0 auto !important; padding: 0 !important; transform: scale(1.1); transition: transform 0.3s ease; }
            `;
            document.head.appendChild(fixStyle);
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
                        <div class="sidebar-logo-container" style="display:flex; align-items:center; gap:12px;">
                            <img src="${data.store.logo}" alt="لوجو حلويات بوسي" class="sidebar-logo" style="width:40px; height:40px; object-fit:contain;" />
                            <span class="sidebar-brand-name">حلويات بوسي</span>
                        </div>
                        <button id="sidebar-close-btn" class="sidebar-close-btn" aria-label="إغلاق القائمة">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div class="sidebar-scrollable-content">
                        <div>
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

                        <div>
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
                                <li class="footer-contact-item" style="margin-top: 15px;">
                                    <i class="fa-solid fa-location-dot"></i>
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
                document.body.style.overflow = 'hidden'; 
            });
        }
        
        const closeSidebar = () => {
            if (sidebar && overlay) {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
                document.body.style.overflow = ''; 
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadStoreDatabase);
    } else {
        loadStoreDatabase();
    }
})();