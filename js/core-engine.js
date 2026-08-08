/**
 * core-engine.js - المحرك المركزي العالمي وحارس البيانات والحسابات المالية
 * موقع حلويات بوسي (BoseSweets) - النسخة الاحترافية الملوكية المطورة V13.0
 * [تحديث شامل وتوافق تام]: حل كافة تنبيهات الأنواع الضمنية (Implicit Any Warnings)، 
 * توثيق المعاملات الموحد، ودعم تبويب الأقسام والسلايدرات بمرونة وأمان كامل.
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

    // تشغيل حقن الخطوط والأيقونات فوراً من هنا لسرعة الظهور
    injectEarlyDependencies();

    // تهيئة المتغيرات العالمية الموحدة في نطاق window لخدمة صفحات الموقع
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; // فارق التوقيت بالمللي ثانية: (وقت الخادم - وقت جهاز العميل)

    /**
     * جلب وقراءة قاعدة بيانات حلويات بوسي الموحدة - نظام الكاش الذكي الموفر للبيانات والباقة
     * @returns {Promise<void>}
     */
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return;
        
        const cachedData = localStorage.getItem('bose_cached_store_data');
        const cachedTime = localStorage.getItem('bose_cached_store_time');
        const cacheExpiry = 15 * 60 * 1000; // صلاحية الكاش 15 دقيقة لضمان حداثة الأسعار

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
        applyGlobalSEOAndBranding();
        buildAndInjectGlobalComponents();
        
        if (typeof window.updateGlobalCartCounter === 'function') {
            window.updateGlobalCartCounter();
        }
        
        injectHomepageSectionMeta();
        renderDynamicWaterfall();
        renderOffersSection();
        renderAllOffersPage();
        renderHomepageProductGrids();
        setupOurProductsShowMore();
        injectSimulatorsPreviewData();
        setupPrideCountersAnimation();
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setupBoseUnifiedSliderEngine('offers-slider-track', 'offers-dots-container', 'offers-carousel-section');
                setupBoseUnifiedSliderEngine('categories-track', 'categories-dots-container', 'categories-slider-section');
                setupBoseUnifiedSliderEngine('most-selling-grid', 'most-selling-dots-container', 'most-selling-section');
                setupBoseUnifiedSliderEngine('new-arrivals-grid', 'new-arrivals-dots-container', 'new-arrivals-section');
            });
        });

        setupHeroTickerDragEngine();
        
        document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
    }

    /**
     * 👑 [إصلاح جذري]: محرك تبويب الفئات أسفل زر "اطلب الآن" (Hero Categories Ticker)
     * قبل كده كان التبويب "ثابت تماماً" ومسمى ticker بالغلط لأنه معندوش أي حركة تلقائية،
     * والعميل محتاج يكتشف بنفسه إنه قابل للسحب. دلوقتي بيتحرك لوحده بسلاسة ولا نهائياً
     * (المحتوى مكرر مرتين بالـ HTML لضمان عدم ظهور أي فراغ لحظة الالتفاف)، وبيوقف بس
     * لحظة ما العميل يلمسه أو يسحبه يدوياً، ويكمل تلقائي تاني بعد ما يسيبه.
     */
    function setupHeroTickerDragEngine() {
        /** @type {HTMLElement|null} */
        const track = document.querySelector('.hero-categories-ticker-track');
        if (!track) return;

        let posX = 0;
        let halfWidth = 0;
        let isDragging = false;
        let dragMoved = false;
        let startX = 0;
        let startPosX = 0;
        let autoScrollActive = true;
        let autoScrollSpeedCurrent = 0; // 🔧 [إصلاح السلاسة]: بيبدأ من 0 ويتسارع تدريجياً بدل قفزة مفاجئة
        const AUTO_SCROLL_SPEED = 0.45; // بكسل لكل فريم - حركة ناعمة ومريحة للعين
        // 🔧 [إصلاح جذري - سلاسة اللمس]: كانت الحركة بتتبع إصبع العميل 1:1 بالظبط من غير أي
        // عطالة (momentum)، فبتحس إنها "تقيلة" وبتقف فجأة لحظة رفع الإصبع بدل ما تكمل بسلاسة
        // زي أي سلايدر طبيعي. دلوقتي بنتتبع سرعة السحب الفعلية ونكمل بيها لحظة الإفلات
        // (momentum/inertia) وبنرجع للحركة التلقائية بتسارع تدريجي ناعم بدل قفزة سرعة مفاجئة.
        let lastMoveX = 0;
        let lastMoveTime = 0;
        let velocity = 0; // بكسل/مللي ثانية
        let momentumActive = false;

        const recalcBounds = () => {
            // النص متكرر مرتين، فنص عرض المحتوى هو طول الدورة الكاملة الواحدة
            halfWidth = track.scrollWidth / 2;
        };

        const applyTransform = () => {
            if (halfWidth > 0) {
                // تطبيع الموضع دايماً جوه الدورة عشان يمنع أي قفزة أو فراغ حتى أثناء السحب اليدوي السريع
                while (posX <= -halfWidth) posX += halfWidth;
                while (posX > 0) posX -= halfWidth;
            }
            track.style.transform = `translate3d(${posX}px, 0, 0)`;
        };

        const runMomentumLoop = () => {
            if (!momentumActive) return;
            velocity *= 0.94; // احتكاك ناعم لإيقاف تدريجي طبيعي
            posX += velocity;
            applyTransform();
            if (Math.abs(velocity) < 0.05) {
                momentumActive = false;
                setTimeout(() => { autoScrollActive = true; }, 250);
                return;
            }
            requestAnimationFrame(runMomentumLoop);
        };

        /** @param {PointerEvent} e */
        const onPointerDown = (e) => {
            isDragging = true;
            momentumActive = false;
            autoScrollActive = false;
            dragMoved = false;
            startX = e.clientX;
            startPosX = posX;
            lastMoveX = e.clientX;
            lastMoveTime = performance.now();
            velocity = 0;
            track.classList.add('is-dragging');
            if (typeof track.setPointerCapture === 'function') {
                track.setPointerCapture(e.pointerId);
            }
        };

        /** @param {PointerEvent} e */
        const onPointerMove = (e) => {
            if (!isDragging) return;
            const delta = e.clientX - startX;
            if (Math.abs(delta) > 6) dragMoved = true;
            posX = startPosX + delta;
            applyTransform();

            const now = performance.now();
            const dt = now - lastMoveTime;
            if (dt > 0) {
                velocity = (e.clientX - lastMoveX) / dt * 16.67; // تطبيع لسرعة بكسل/فريم (60fps)
            }
            lastMoveX = e.clientX;
            lastMoveTime = now;
        };

        /** @param {PointerEvent} e */
        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            track.classList.remove('is-dragging');
            if (typeof track.releasePointerCapture === 'function') {
                track.releasePointerCapture(e.pointerId);
            }

            // لو العميل سحب بسرعة ملحوظة، نكمل الحركة بعطالة طبيعية (momentum) بدل ما توقف فجأة
            if (Math.abs(velocity) > 0.5) {
                momentumActive = true;
                requestAnimationFrame(runMomentumLoop);
            } else {
                setTimeout(() => { autoScrollActive = true; }, 250);
            }

            if (dragMoved) {
                /** @param {MouseEvent} clickEvent */
                const suppressClick = (clickEvent) => {
                    clickEvent.preventDefault();
                    clickEvent.stopPropagation();
                };
                track.addEventListener('click', suppressClick, { capture: true, once: true });
            }
        };

        const runAutoScrollLoop = () => {
            if (autoScrollActive && halfWidth > 0) {
                // تسارع تدريجي ناعم بدل قفزة سرعة مفاجئة لحظة الرجوع من السحب اليدوي
                autoScrollSpeedCurrent += (AUTO_SCROLL_SPEED - autoScrollSpeedCurrent) * 0.08;
                posX -= autoScrollSpeedCurrent;
                applyTransform();
            } else {
                autoScrollSpeedCurrent = 0;
            }
            requestAnimationFrame(runAutoScrollLoop);
        };

        recalcBounds();
        window.addEventListener('resize', recalcBounds);
        // 🔧 [إصلاح الفراغ الفارغ]: recalcBounds بيتنفذ الأول قبل ما خط Cairo وأيقونات
        // Font Awesome يخلصوا تحميل، فبيحسب عرض غلط ويعمل قفزة/فراغ لحظة اللف.
        // بنعيد الحساب تاني بعد ما كل الخطوط تخلص تحميل، وبعد أول فريمين كمان كضمان إضافي.
        if (document.fonts && typeof document.fonts.ready?.then === 'function') {
            document.fonts.ready.then(recalcBounds);
        }
        requestAnimationFrame(() => requestAnimationFrame(recalcBounds));
        // ومراقبة أي تغيير فعلي في حجم المحتوى نفسه (صور اتحملت متأخر مثلاً)
        if (typeof ResizeObserver === 'function') {
            new ResizeObserver(() => recalcBounds()).observe(track);
        }

        track.addEventListener('pointerdown', onPointerDown);
        track.addEventListener('pointermove', onPointerMove);
        track.addEventListener('pointerup', onPointerUp);
        track.addEventListener('pointercancel', onPointerUp);
        track.addEventListener('pointerleave', onPointerUp);
        // وقف الحركة التلقائية وقت مرور الماوس فوقها على الكمبيوتر (مريح لعين وقرار العميل)
        track.addEventListener('mouseenter', () => { autoScrollActive = false; });
        track.addEventListener('mouseleave', () => { if (!isDragging) autoScrollActive = true; });

        requestAnimationFrame(runAutoScrollLoop);
    }

    /**
     * ✍️ ضخ العناوين والوصف للأقسام الرئيسية لعلامة حلويات بوسي
     */
    function injectHomepageSectionMeta() {
        const data = window.BoseStoreData;
        if (!data || !data.homepage) return;

        const heroDesc = document.getElementById('hero-description');
        if (heroDesc && data.homepage.hero) {
            heroDesc.textContent = data.homepage.hero.description || "نختار كل مكوّن بعناية فائقة، لنصنع لمناسباتكم جودة تستاهل ثقتكم.";
        }

        const categoriesSection = document.getElementById('categories-slider-section') || document.getElementById('categories-section') || document.querySelector('[id*="categories"]');
        if (categoriesSection && data.homepage.categoriesSlider) {
            const titleEl = document.getElementById('categories-section-title') || categoriesSection.querySelector('.section-title') || categoriesSection.querySelector('h2');
            const descEl = document.getElementById('categories-section-subtitle') || categoriesSection.querySelector('.bose-section-subtitle');
            
            if (titleEl) titleEl.textContent = "تسوق حسب الفئة";
            if (descEl) descEl.textContent = "قسّمنا منيو حلويات بوسي لـ 12 فئة واضحة بالصور، عشان تلاقوا اللي بتحبوه من غير حيرة.";
            
            const track = document.getElementById('categories-track') || categoriesSection.querySelector('.categories-track-slider') || categoriesSection.querySelector('[id*="track"]');
            if (track) {
                track.innerHTML = data.homepage.categoriesSlider.map(/** @param {Object} cat */ (cat) => `
                    <div class="category-card-unified" onclick="window.location.href='category.html?category=${encodeURIComponent(cat.id)}'">
                        <img src="${window.optimizeBoseImageUrl(cat.image, 250)}" alt="${window.escapeBoseHTML(cat.title)}" class="category-card-img" width="180" height="180" loading="lazy" />
                        <div class="category-card-name">${window.escapeBoseHTML(cat.title)}</div>
                    </div>
                `).join('');
            }
        }

        const mostSellingSection = document.getElementById('most-selling-section');
        if (mostSellingSection) {
            const titleEl = document.getElementById('most-selling-main-heading') || mostSellingSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "الأكثر مبيعاً";
            const descEl = document.getElementById('most-selling-description') || mostSellingSection.querySelector('.bose-section-subtitle');
            if (descEl) descEl.textContent = "دي الأصناف اللي بتطلبوها وتحبوها من سنين، نكهات مظبوطة بالملي، بقت رمز ثقتكم فينا.";
        }

        const newArrivalsSection = document.getElementById('new-arrivals-section');
        if (newArrivalsSection) {
            const titleEl = document.getElementById('new-arrivals-main-heading') || newArrivalsSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "وصل حديثاً";
            const descEl = document.getElementById('new-arrivals-description') || newArrivalsSection.querySelector('.bose-section-subtitle');
            if (descEl) descEl.textContent = "هنا هتلاقوا أحدث الأفكار اللي طورناها شهور كاملة، عشان تخطف قلبكم من أول معلقة.";
        }

        const ourProductsSection = document.getElementById('our-products-section');
        if (ourProductsSection) {
            const titleEl = document.getElementById('our-products-main-heading') || ourProductsSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "منيو حلويات بوسي";
            const descEl = document.getElementById('our-products-description') || ourProductsSection.querySelector('.bose-section-subtitle');
            if (descEl) descEl.textContent = "منيو حلويات بوسي بالكامل: تشكيلة غنية، بنحضرها طازة كل يوم بمكونات طبيعية 100%.";
        }
    }

    /**
     * 🏷️ رندر قسم العروض والخصومات في بداية الأقسام
     */
    /**
     * 👑 [مصدر واحد للحقيقة]: قسم العروض بالرئيسية وصفحة كل العروض offers.html
     * بيستخدموا نفس المصدر بالظبط - أي منتج في قاعدة البيانات معاه oldPrice > price.
     * محدش بيكتب عروض يدوي تاني في أكتر من مكان، فمفيش احتمال تضارب أو نسيان.
     */
    function getAllOfferProducts() {
        const data = window.BoseStoreData;
        if (!data || !data.products) return [];
        return data.products.filter(/** @param {Object} p */ (p) => p.oldPrice && p.oldPrice > p.price);
    }
    window.getAllOfferProducts = getAllOfferProducts;

    function renderOffersSection() {
        const offersTrack = document.getElementById('offers-slider-track');
        const offersSection = document.getElementById('offers-carousel-section');
        if (!offersTrack) return;

        const offersData = getAllOfferProducts();

        // مفيش عروض حالياً؟ القسم بالكامل يتخفي بدل ما يفضل فاضي قدام العميل
        if (offersData.length === 0) {
            if (offersSection) offersSection.style.display = 'none';
            return;
        }

        offersTrack.innerHTML = offersData.map(/** @param {Object} offer */ (offer) => createProductCardHTML(offer)).join('');
    }

    /**
     * 👑 [محرك التعمير الموحد لكافة الحركات الأفقية والسلايدرات]
     * @param {string} trackId
     * @param {string} dotsContainerId
     * @param {string} sectionId
     */
    function setupBoseUnifiedSliderEngine(trackId, dotsContainerId, sectionId) {
        /** @type {HTMLElement|null} */
        const track = document.getElementById(trackId);
        const section = document.getElementById(sectionId) || (track ? track.closest('section') : null);
        if (!track) return;

        const cards = track.children;
        const count = cards.length;
        if (count === 0) return;

        for (let i = 0; i < cards.length; i++) {
            /** @type {HTMLElement} */ (cards[i]).style.scrollSnapAlign = 'center';
        }

        let dotsContainer = document.getElementById(dotsContainerId) || (section ? section.querySelector('.bose-dots-container') : null);

        if (dotsContainer) {
            let dotsHtml = '';
            for (let i = 0; i < count; i++) {
                dotsHtml += `<span class="bose-slider-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`;
            }
            dotsContainer.innerHTML = dotsHtml;
            dotsContainer.removeAttribute('hidden');
        }

        const dots = dotsContainer ? dotsContainer.querySelectorAll('.bose-slider-dot') : [];

        const syncDotsAndPosition = () => {
            const cardEl = /** @type {HTMLElement} */ (cards[0]);
            const cardWidth = cardEl.offsetWidth + parseInt(window.getComputedStyle(track).gap || '20', 10);
            const scrollPosition = track.scrollLeft;
            let activeIndex = Math.round(scrollPosition / cardWidth);
            
            if (activeIndex < 0) activeIndex = 0;
            if (activeIndex >= count) activeIndex = count - 1;

            dots.forEach((/** @type {Element} */ dot, /** @type {number} */ idx) => {
                dot.classList.toggle('active', idx === activeIndex);
            });
        };

        track.addEventListener('scroll', syncDotsAndPosition);

        if (dotsContainer) {
            dotsContainer.addEventListener('click', (e) => {
                const target = /** @type {HTMLElement} */ (e.target);
                const dot = target.closest('.bose-slider-dot');
                if (!dot) return;
                const index = parseInt(dot.getAttribute('data-index') || '0', 10);
                if (cards[index]) {
                    const cardEl = /** @type {HTMLElement} */ (cards[0]);
                    const cardWidth = cardEl.offsetWidth + parseInt(window.getComputedStyle(track).gap || '20', 10);
                    track.style.scrollBehavior = 'smooth';
                    track.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
                }
            });
        }

        if (section) {
            const nextBtn = section.querySelector('.offers-nav-next') || section.querySelector('.bose-slider-arrow.next');
            const prevBtn = section.querySelector('.offers-nav-prev') || section.querySelector('.bose-slider-arrow.prev');
            
            if (nextBtn && prevBtn) {
                const getScrollStep = () => {
                    const cardEl = /** @type {HTMLElement} */ (cards[0]);
                    return cardEl.offsetWidth + parseInt(window.getComputedStyle(track).gap || '20', 10);
                };
                
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    track.style.scrollBehavior = 'smooth';
                    track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
                });
                
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    track.style.scrollBehavior = 'smooth';
                    track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
                });
            }
        }

        let isDragging = false, startX = 0, startScrollLeft = 0;

        /** @param {MouseEvent|TouchEvent} e */
        const onDragStart = (e) => {
            isDragging = true;
            track.style.scrollBehavior = 'auto';
            const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
            startX = pageX - track.offsetLeft;
            startScrollLeft = track.scrollLeft;
        };

        /** @param {MouseEvent|TouchEvent} e */
        const onDragMove = (e) => {
            if (!isDragging) return;
            const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
            const x = pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5;
            track.scrollLeft = startScrollLeft - walk;
        };

        const onDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            track.style.scrollBehavior = 'smooth';
            syncDotsAndPosition();
        };

        track.addEventListener('mousedown', onDragStart);
        track.addEventListener('mousemove', onDragMove);
        track.addEventListener('mouseup', onDragEnd);
        track.addEventListener('mouseleave', onDragEnd);

        track.addEventListener('touchstart', onDragStart, { passive: true });
        track.addEventListener('touchmove', onDragMove, { passive: true });
        track.addEventListener('touchend', onDragEnd);
    }

    /**
     * 📄 صفحة العروض المستقلة offers.html - المكان الشرعي الوحيد لعرض كل العروض
     * بتستخدم نفس مصدر البيانات ونفس دالة الكارت الموحدة، فأي تحديث في مكان واحد
     * بينعكس تلقائياً هنا وفي كارت الرئيسية بدون أي تكرار أو تضارب.
     */
    function renderAllOffersPage() {
        const grid = document.getElementById('all-offers-grid');
        if (!grid) return;

        const offersData = getAllOfferProducts();
        const emptyState = document.getElementById('all-offers-empty-state');

        if (offersData.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        grid.innerHTML = offersData.map(/** @param {Object} offer */ (offer) => createProductCardHTML(offer)).join('');
    }

    function renderDynamicWaterfall() {
        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        const waterfallData = window.BoseStoreData?.homepage?.waterfall;

        if (!waterfallData) return;

        /**
         * كل صورة في الشلال دلوقتي مرتبطة بمنتج حقيقي (image + slug) بدل ما تكون
         * صورة زخرفية مقطوعة عن أي منتج. الضغط على أي صورة يوصل العميل مباشرة
         * لصفحة المنتج المستقلة الخاصة بيها.
         * @param {Array<Object|string>} items
         */
        const buildWaterfallItemsHtml = (items) => items.map((item) => {
            const isLinked = item && typeof item === 'object' && item.slug;
            const imgSrc = isLinked ? item.image : item;
            const imgTag = `<img src="${window.optimizeBoseImageUrl(imgSrc, 300)}" alt="منتج فاخر حلويات بوسي" class="waterfall-img" width="220" height="220" loading="lazy" />`;
            return isLinked
                ? `<a href="product.html?slug=${encodeURIComponent(item.slug)}" class="waterfall-img-link" aria-label="عرض تفاصيل المنتج">${imgTag}</a>`
                : imgTag;
        }).join('');

        if (leftCol && waterfallData.leftColumnImages) {
            const leftHtml = buildWaterfallItemsHtml(waterfallData.leftColumnImages);
            leftCol.innerHTML = `<div class="waterfall-up">${leftHtml} ${leftHtml}</div>`;
        }

        if (rightCol && waterfallData.rightColumnImages) {
            const rightHtml = buildWaterfallItemsHtml(waterfallData.rightColumnImages);
            rightCol.innerHTML = `<div class="waterfall-down">${rightHtml} ${rightHtml}</div>`;
        }
    }

    /**
     * 👑 [محرك موحد وحيد لكل كروت المنتجات في الموقع كله]
     * أي منتج معاه oldPrice أكبر من price بيتحول تلقائياً وفي كل مكان يظهر فيه
     * (فئة، أكثر مبيعاً، وصل حديثاً، صفحة العروض) لكارت "عليه عرض" واضح بشارة خصم
     * وسعر قديم مشطوب ومبلغ التوفير - بدل ما يظهر كمنتج مستقل مربك للعميل.
     * ده الحل الجذري لمشكلة تكرار منتجات العروض (مش بس الجاتوهات) في كل الفئات.
     * @param {Object} product
     * @returns {string}
     */
    function createProductCardHTML(product) {
        if (!product) return '';
        const rawImg = product.images ? product.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png';
        const safeImg = window.optimizeBoseImageUrl(rawImg, 400);
        const safeTitle = window.escapeBoseHTML(product.title);
        const safeFlavor = window.escapeBoseHTML(product.flavorName || '');
        const safeDesc = window.escapeBoseHTML(product.flavorDesc || (product.description ? product.description.substring(0, 80) + '...' : ''));

        // 🛡️ [إصلاح جذري]: أي منتج "رئيسي" مرتبط بمحاكي تفاعلي (تورت مخصص / بوكيه ورد)
        // معندوش سعر أو تفاصيل ثابتة أصلاً — سعره وتفاصيله بيتحددوا داخل المحاكي فقط.
        // قبل كده كان الكارت بيوديه لصفحة منتج ثابتة (product.html) بسعر ووصف تقريبي غلط،
        // وكأنه "تورتة جاهزة" منفصلة عن المحاكي. دلوقتي بيوديه للمحاكي مباشرة وبس، ومفيش
        // زرار "إضافة للسلة" مباشر أو عداد كمية لأنه مش منطقي هنا خالص.
        const isBuilderMaster = !!product.customBuilderUrl && product.builderType && product.builderType !== 'standard';

        if (isBuilderMaster) {
            return `
                <div class="product-card-unified bose-builder-master-card" data-id="${product.id}" onclick="window.location.href='${product.customBuilderUrl}';" style="cursor:pointer;">
                    <img src="${safeImg}" alt="${safeTitle}" class="product-card-img" width="300" height="300" loading="lazy" />
                    <h3 class="product-card-title">${safeTitle}</h3>
                    <span class="product-card-flavor-name">${safeFlavor}</span>
                    <p class="product-card-desc">${safeDesc}</p>
                    <div class="product-card-price">
                        <span>أسعار تبدأ من ${Math.round(product.basePrice || product.price || 0)} جنيه</span>
                    </div>
                    <button class="btn-add-to-cart" onclick="event.stopPropagation(); window.location.href='${product.customBuilderUrl}';">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> ابدأ التصميم الآن
                    </button>
                </div>
            `;
        }

        const calculatedPrice = window.calculateProductFinalPrice(product, {});
        const hasDiscount = !!(product.oldPrice && product.oldPrice > product.price);
        let discountBadgeHtml = '';
        let oldPriceHtml = '';
        let savingsHtml = '';
        if (hasDiscount) {
            const savingsAmount = product.oldPrice - product.price;
            const discountPercent = Math.round((savingsAmount / product.oldPrice) * 100);
            discountBadgeHtml = `<div class="offer-badge bose-offer-badge">خصم ${discountPercent}%</div>`;
            oldPriceHtml = `<span class="product-old-price">${Math.round(product.oldPrice)} جنيه</span>`;
            savingsHtml = `<span class="offer-savings-note">وفر ${Math.round(savingsAmount)} جنيه</span>`;
        }

        return `
            <div class="product-card-unified${hasDiscount ? ' bose-offer-card' : ''}" data-id="${product.id}" onclick="if(!event.target.closest('.product-card-qty-wrapper') && !event.target.closest('.btn-add-to-cart')){ window.location.href='product.html?slug=${encodeURIComponent(product.slug)}'; }" style="cursor:pointer;">
                ${discountBadgeHtml}
                <img src="${safeImg}" alt="${safeTitle}" class="product-card-img" width="300" height="300" loading="lazy" />
                <h3 class="product-card-title">${safeTitle}</h3>
                <span class="product-card-flavor-name">${safeFlavor}</span>
                <p class="product-card-desc">${safeDesc}</p>
                
                <div class="product-card-qty-wrapper">
                    <button class="btn-qty-plus" onclick="window.handleBoseCardQtyChange(this, 1)">+</button>
                    <input type="number" class="input-qty-value" value="1" min="1" readonly />
                    <button class="btn-qty-minus" onclick="window.handleBoseCardQtyChange(this, -1)">-</button>
                </div>
                
                <div class="product-card-price" data-base-price="${calculatedPrice}">
                    ${oldPriceHtml}
                    <span>${Math.round(calculatedPrice)} جنيه</span>
                    ${savingsHtml}
                </div>
                <button class="btn-add-to-cart" onclick="window.handleBoseDirectAddToCart(this, '${product.id}')">
                    <i class="fa-solid fa-basket-shopping"></i> اضافة للسلة
                </button>
            </div>
        `;
    }

    /**
     * @param {HTMLElement} buttonElement
     * @param {number} direction
     */
    window.handleBoseCardQtyChange = function(buttonElement, direction) {
        const qtyContainer = buttonElement.closest('.product-card-qty-wrapper');
        const cardContainer = buttonElement.closest('.product-card-unified');
        if (!qtyContainer || !cardContainer) return;

        /** @type {HTMLInputElement|null} */
        const qtyInput = qtyContainer.querySelector('.input-qty-value');
        const priceDisplay = cardContainer.querySelector('.product-card-price');
        if (!qtyInput || !priceDisplay) return;

        let currentQty = parseInt(qtyInput.value, 10) || 1;
        currentQty += direction;
        if (currentQty < 1) currentQty = 1;
        qtyInput.value = String(currentQty);

        const basePrice = parseFloat(priceDisplay.getAttribute('data-base-price') || '0') || 0;
        priceDisplay.textContent = `${Math.round(basePrice * currentQty)} جنيه`;
    };

    function renderHomepageProductGrids() {
        const data = window.BoseStoreData;
        if (!data || !data.products) return;

        const mostSellingGrid = document.getElementById('most-selling-grid');
        if (mostSellingGrid && data.homepage.mostSelling) {
            const items = data.homepage.mostSelling.map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean);
            mostSellingGrid.innerHTML = items.map((/** @type {any} */ p) => createProductCardHTML(p)).join('');
        }

        const newArrivalsGrid = document.getElementById('new-arrivals-grid');
        if (newArrivalsGrid && data.homepage.newArrivals) {
            const items = data.homepage.newArrivals.map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean);
            newArrivalsGrid.innerHTML = items.map((/** @type {any} */ p) => createProductCardHTML(p)).join('');
        }

        const ourProductsGrid = document.getElementById('our-products-grid');
        if (ourProductsGrid && data.homepage.ourProducts) {
            const initialItems = data.homepage.ourProducts.slice(0, 4).map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean);
            ourProductsGrid.innerHTML = initialItems.map((/** @type {any} */ p) => createProductCardHTML(p)).join('');
        }
    }

    function setupOurProductsShowMore() {
        const showMoreBtn = document.getElementById('our-products-show-more-btn');
        const ourProductsGrid = document.getElementById('our-products-grid');
        const data = window.BoseStoreData;

        if (!showMoreBtn || !ourProductsGrid || !data) return;

        showMoreBtn.classList.add('btn-show-more-outline');
        showMoreBtn.textContent = "استعرض المزيد";

        showMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const allItems = data.homepage.ourProducts.map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean);
            ourProductsGrid.innerHTML = allItems.map((/** @type {any} */ p) => createProductCardHTML(p)).join('');
            showMoreBtn.style.setProperty('display', 'none', 'important'); 
        });
    }

    function injectSimulatorsPreviewData() {
        const data = window.BoseStoreData;
        if (!data || !data.homepage) return;

        const cakeSection = document.getElementById('cake-preview-section');
        if (cakeSection && data.homepage.cakePreview) {
            const preview = data.homepage.cakePreview;
            /** @type {HTMLImageElement|null} */ const imgEl = cakeSection.querySelector('#cake-preview-img');
            const titleEl = cakeSection.querySelector('#cake-preview-title');
            const descEl = cakeSection.querySelector('#cake-preview-desc');
            /** @type {HTMLAnchorElement|null} */ const ctaEl = cakeSection.querySelector('#cake-preview-cta');

            if (imgEl && preview.image) imgEl.src = preview.image;
            if (titleEl && preview.title) titleEl.textContent = preview.title;
            if (descEl && preview.description) descEl.textContent = preview.description;
            if (ctaEl && preview.cta) {
                ctaEl.textContent = preview.cta;
                if (preview.target) ctaEl.href = preview.target;
            }
        }

        const flowerSection = document.getElementById('flower-preview-section');
        if (flowerSection && data.homepage.flowerPreview) {
            const preview = data.homepage.flowerPreview;
            /** @type {HTMLImageElement|null} */ const imgEl = flowerSection.querySelector('#flower-preview-img');
            const titleEl = flowerSection.querySelector('#flower-preview-title');
            const descEl = flowerSection.querySelector('#flower-preview-desc');
            /** @type {HTMLAnchorElement|null} */ const ctaEl = flowerSection.querySelector('#flower-preview-cta');

            if (imgEl && preview.image) imgEl.src = preview.image;
            if (titleEl && preview.title) titleEl.textContent = preview.title;
            if (descEl && preview.description) descEl.textContent = preview.description;
            if (ctaEl && preview.cta) {
                ctaEl.textContent = preview.cta;
                if (preview.target) ctaEl.href = preview.target;
            }
        }
    }

    function setupPrideCountersAnimation() {
        const prideSection = document.getElementById('pride-section');
        if (!prideSection || !window.BoseStoreData?.homepage?.pride?.stats) return;

        const statsData = window.BoseStoreData.homepage.pride.stats;
        
        /**
         * @param {Element} el
         * @param {number} target
         * @param {string} suffix
         */
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
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    Object.keys(statsData).forEach((key) => {
                        const targetEl = prideSection.querySelector(`[data-stat="${key}"]`) || document.getElementById(`pride-stat-${key}`);
                        if (targetEl && !targetEl.classList.contains('animated')) {
                            targetEl.classList.add('animated');
                            animateCounter(targetEl, parseInt(statsData[key].value, 10), statsData[key].suffix || '+');
                        }
                    });
                    observer.unobserve(prideSection);
                }
            });
        }, { threshold: 0.3 });

        observer.observe(prideSection);
    }

    /**
     * @param {number} basePrice
     * @param {string} applyOnContext
     * @returns {number}
     */
    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        if (!window.BoseStoreData) return basePrice;
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return parseFloat((basePrice * (1 + (rule.percent / 100))).toFixed(4));
        }
        return basePrice;
    };

    /**
     * @param {Object} product
     * @param {Object} selectedOptions
     * @returns {number}
     */
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
                        const printingOpt = printOptions.find((/** @type {any} */ opt) => opt.id === selectedPrinting || opt.type === selectedPrinting);
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

    /**
     * @param {number|string} persons
     * @param {Object} options
     * @returns {number}
     */
    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = window.BoseStoreData?.cakeBuilder;
        const safePersons = parseInt(String(persons), 10) || (config ? config.persons.minimum : 10) || 10;
        let price = (config ? config.basePrice : 580) || 580;
        const minPersons = (config ? config.persons.minimum : 10) || 10;
        const pricePerPerson = (config ? config.pricePerPerson : 145) || 145; 
        const extraPersons = Math.max(0, safePersons - minPersons);
        price += extraPersons * pricePerPerson;
        
        const selectedPrinting = options.printingType || options.printing || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (config && config.printingOptions) {
                const printOpt = config.printingOptions.find((/** @type {any} */ opt) => opt.id === selectedPrinting);
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

    /**
     * @param {number|string} flowerCount
     * @param {Object} options
     * @returns {number}
     */
    window.calculateCustomFlowerPrice = function(flowerCount, options = {}) {
        // 🧮 [توحيد مصدر الأسعار - المرحلة 3]: القراءة من window.BoseStoreData.flowerBuilder
        // بدل الأرقام المكتوبة يدوياً، عشان أي تعديل مستقبلي على السعر من قاعدة البيانات
        // ينعكس فعلياً على الموقع. القيم بعد "||" هي نفس الأرقام القديمة تماماً كقيمة
        // احتياطية فقط لو الحقل مفقود من الـ JSON لأي سبب - نفس القيم المستخدمة حرفياً
        // في flower-engine.js لضمان تطابق سعر المحاكي مع سعر الحارس المركزي بالمليم.
        const fbConfig = window.BoseStoreData?.flowerBuilder || {};
        const basePrice = parseFloat(fbConfig.basePrice) || 400;
        const baseFlowers = parseInt(fbConfig.baseFlowers, 10) || 15;
        const extraFlowerPrice = parseFloat(fbConfig.extraFlowerPrice) || 35;
        const photoPrintPrice = parseFloat(fbConfig.photoPrintPrice) || 15;
        const giftCardPrice = parseFloat(fbConfig.giftCardPrice) || 20;
        // ملحوظة: مفيش حقل رسمي لسعر شريط الستان المطبوع (satinRibbonPrice) داخل
        // flowerBuilder بالـ JSON حالياً - فضّلنا نسيبه ثابت 50 بدل ما نخمّن ربطه بحقل
        // تاني (زي wrappingTypes) معناه مختلف، لحد ما يتضاف حقل مخصص له فعلياً.
        const satinRibbonPrice = 50;

        const safeFlowerCount = parseInt(String(flowerCount), 10) || baseFlowers;
        const extraFlowers = Math.max(0, safeFlowerCount - baseFlowers);
        let servicePrice = basePrice + (extraFlowers * extraFlowerPrice);
        if (options.hasSatinRibbon) servicePrice += satinRibbonPrice; 
        const safePhotoCount = parseInt(options.photoCount, 10) || 0;
        if (options.hasPhotos && safePhotoCount > 0) servicePrice += safePhotoCount * photoPrintPrice; 
        if (options.hasGiftCard) servicePrice += giftCardPrice; 
        const finalServicePrice = window.calculateBosePrice(servicePrice, "menu-only");
        
        const safeCashAmount = parseFloat(options.cashAmount) || 0;
        const safeChocolateBudget = parseFloat(options.chocolateBudget) || 0;
        return finalServicePrice + safeCashAmount + safeChocolateBudget;
    };

    /**
     * @param {Object} product
     * @param {Object} selectedOptions
     * @param {number} quantity
     * @returns {Object|null}
     */
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
            quantity: parseInt(String(quantity), 10) || 1,
            image: (product.images && product.images[0]) || product.image || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
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

    /**
     * @param {string} phone
     * @param {boolean} isOptional
     * @returns {boolean}
     */
    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") return isOptional;
        const cleaned = window.sanitizeBosePhoneNumber(phone);
        return /^01[0125][0-9]{8}$/.test(cleaned);
    };

    /**
     * @param {string} phone
     * @returns {string}
     */
    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return "";
        let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        else if (cleaned.startsWith("00201")) cleaned = "0" + cleaned.substring(4);
        else if (cleaned.startsWith("1") && cleaned.length === 10) cleaned = "0" + cleaned;
        return cleaned;
    };

    /**
     * @param {string} phone
     * @returns {string}
     */
    window.toInternationalWhatsappNumber = function(phone) {
        let cleaned = window.sanitizeBosePhoneNumber(phone || "");
        if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
        return "20" + cleaned;
    };

    /**
     * @param {string} phone
     * @param {string} text
     * @returns {string}
     */
    window.buildWhatsappLink = function(phone, text) {
        const intlNumber = window.toInternationalWhatsappNumber(phone);
        return `https://wa.me/${intlNumber}?text=${encodeURIComponent(text || "")}`;
    };

    /**
     * @param {number} subtotal
     * @param {Object} coupon
     * @returns {number}
     */
    window.calculateCouponDiscount = function(subtotal, coupon) {
        const safeSubtotal = parseFloat(String(subtotal)) || 0;
        if (!coupon) return 0;
        const value = parseFloat(coupon.value) || 0;
        let discount = 0;
        if (coupon.type === "fixed") {
            discount = value;
        } else {
            discount = safeSubtotal * (value / 100);
        }
        return Math.max(0, Math.min(discount, safeSubtotal));
    };

    /**
     * 🧮 [إصلاح حرج - المرحلة 1]: الدالة الموحدة الوحيدة لحساب فاتورة السلة/الشحن/الطلب النهائي.
     * تُستخدم من cart-engine.js في 3 نقاط: ملخص السلة، ملخص الشحن بالـ checkout، وتأكيد الطلب النهائي،
     * لضمان تطابق الأرقام بالمليم في كل مرحلة من رحلة الشراء.
     * القاعدة المالية الصارمة: لا تقريب على الأسعار الفردية أو subtotal/discount، والتقريب الوحيد
     * يتم مرة واحدة وحصرياً على الإجمالي الكلي النهائي (grandTotal).
     * @param {Array} cart
     * @param {Object} storeData
     * @param {number} shippingFee
     * @returns {{subtotal: number, discount: number, shippingFee: number, grandTotal: number, itemsCount: number}}
     */
    window.calculateBoseInvoice = function(cart, storeData, shippingFee) {
        const safeCart = Array.isArray(cart) ? cart : [];
        const safeShippingFee = parseFloat(String(shippingFee)) || 0;

        let subtotal = 0;
        let itemsCount = 0;
        safeCart.forEach((/** @type {any} */ item) => {
            const unitPrice = parseFloat(item.finalPrice) || 0;
            const qty = parseInt(item.quantity, 10) || 1;
            subtotal += unitPrice * qty;
            itemsCount += qty;
        });
        subtotal = parseFloat(subtotal.toFixed(4));

        let discount = 0;
        let activeCouponCode = null;
        try {
            // 🛡️ [إصلاح أمني]: بيانات الكوبون النشط بقت جاية من نتيجة تحقق آمن عبر
            // الباكند (validate_coupon RPC) وقت الضغط على "تطبيق"، مش من قايمة
            // storeData.coupons العامة القديمة اللي كانت بتفضح كل أكواد الخصم لأي
            // حد يفتح site-data-final.json مباشرة. راجع onclick الخاص بـ btn-apply-coupon
            // في cart-engine.js لمصدر بيانات bose_active_coupon الجديد.
            const rawActiveCoupon = localStorage.getItem("bose_active_coupon");
            if (rawActiveCoupon) {
                const activeCoupon = JSON.parse(rawActiveCoupon);
                if (activeCoupon && activeCoupon.code) {
                    discount = window.calculateCouponDiscount(subtotal, activeCoupon);
                    activeCouponCode = activeCoupon.code;
                }
            }
        } catch (e) {
            discount = 0;
            activeCouponCode = null;
        }
        discount = parseFloat(discount.toFixed(4));

        const grandTotal = Math.round(Math.max(0, subtotal - discount) + safeShippingFee);

        return {
            subtotal: subtotal,
            discount: discount,
            shippingFee: safeShippingFee,
            grandTotal: grandTotal,
            itemsCount: itemsCount,
            couponCode: activeCouponCode
        };
    };

    /**
     * 🆔 [إصلاح حرج - المرحلة 1]: توليد رقم طلب فريد فعلياً (طابع زمني بصيغة Base36 + رقم عشوائي)
     * لمنع تصادم أرقام الطلبات بين عمليتي شراء متزامنتين.
     * @returns {string}
     */
    window.generateBoseOrderId = function() {
        const timestampPart = Date.now().toString(36).toUpperCase();
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        return `${timestampPart}${randomPart}`;
    };

    /**
     * @param {string} url
     * @param {number|string} width
     * @returns {string}
     */
    window.optimizeBoseImageUrl = function(url, width) {
        if (!url || typeof url !== "string") return url;
        if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
        const safeWidth = parseInt(String(width), 10) || 600;
        const transform = `f_auto,q_auto,w_${safeWidth},c_limit`;
        if (url.includes("/upload/f_auto") || url.includes("/upload/q_auto")) return url;
        return url.replace("/upload/", `/upload/${transform}/`);
    };

    /**
     * @param {string} str
     * @returns {string}
     */
    window.escapeBoseHTML = function(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    /**
     * @param {string} dateStr
     * @param {string} timeStr
     * @returns {boolean}
     */
    // 🛡️ [إصلاح - المرحلة 2]: قبل كده كانت الدالة بتطبّق 24 ساعة على كل أنواع
    // الطلبات بدون استثناء، بينما "الشروط والأحكام" الرسمية بتوعد العميل بمدة
    // أسبوع كامل للتورت والورد المخصص عبر المحاكي (لأنها بتاخد مراحل تحضير وتنسيق
    // كتيرة). دلوقتي الدالة بتاخد isCustomOrder وتطبّق العتبة الصحيحة المطابقة
    // لصاحب المتجر: 168 ساعة (7 أيام) للمخصص، 24 ساعة لباقي المنتجات.
    window.validateBoseDeliverySchedule = function(dateStr, timeStr, isCustomOrder = false) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        const currentDateTime = new Date(Date.now() + (window.boseServerTimeOffset || 0));
        if (selectedDateTime <= currentDateTime) return false;
        const rules = window.BoseStoreData?.orderRules || {};
        const requiredHours = isCustomOrder
            ? (rules.minPreparationTimeHoursCustom || 168) - 0.05
            : (rules.minPreparationTimeHours || 24) - 0.05;
        return (selectedDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60) >= requiredHours;
    };

    // 🛡️ [إصلاح - المرحلة 2]: دالة مشتركة موحّدة لتحديد هل السلة فيها منتج مخصص
    // (تورت محاكي / ورد محاكي) يستوجب قاعدة الأسبوع، بدل تكرار نفس الشرط في أكتر
    // من ملف (cart-engine.js وcheckout.html) بشكل منفصل وعرضة للتعارض مستقبلاً.
    window.boseCartHasCustomItem = function(cart) {
        if (!Array.isArray(cart)) return false;
        return cart.some(item =>
            item.type === "custom-cake" ||
            item.type === "mini-cake" ||
            item.type === "custom-flower" ||
            item.productSlug === "toort-custom-master" ||
            item.productSlug === "flowers-master"
        );
    };

    /**
     * @param {Object} item
     * @returns {number}
     */
    window.recalculateCartItemPrice = function(item) {
        if (!item || !window.BoseStoreData) return parseFloat(item?.finalPrice) || 0;
        const details = item.customDetails || {};

        if (item.type === "custom-cake") {
            return window.calculateCustomCakePrice(details.persons, { printingType: details.printingType });
        }
        if (item.type === "custom-flower") {
            return window.calculateCustomFlowerPrice(details.flowerCount, {
                hasSatinRibbon: details.hasSatinRibbon,
                photoCount: details.photoCount,
                hasPhotos: details.photoCount > 0,
                hasGiftCard: details.hasGiftCard,
                cashAmount: details.cashAmount,
                chocolateBudget: details.hasChocolate ? details.chocolateBudget : 0
            });
        }

        const product = window.BoseStoreData.products?.find((/** @type {any} */ p) => p.slug === item.productSlug);
        if (!product) return parseFloat(item.finalPrice) || 0;

        return window.calculateProductFinalPrice(product, {
            printing: details.printingType,
            extraToppingPrice: item.extraToppingPrice,
            printingPrice: item.printingPrice
        });
    };

    /**
     * @param {Array} cart
     * @returns {{cart: Array, wasTampered: boolean}}
     */
    window.recalculateFullCart = function(cart) {
        let wasTampered = false;
        const fixedCart = (cart || []).map((/** @type {any} */ item) => {
            const trustedPrice = window.recalculateCartItemPrice(item);
            const storedPrice = parseFloat(item.finalPrice) || 0;
            if (Math.abs(trustedPrice - storedPrice) > 0.5) wasTampered = true;
            return { ...item, finalPrice: parseFloat(trustedPrice.toFixed(4)) };
        });
        return { cart: fixedCart, wasTampered };
    };

    window.updateGlobalCartCounter = function() {
        const cartCountBadges = document.querySelectorAll('#nav-cart-count, .nav-cart-badge');
        if (cartCountBadges.length === 0) return;
        
        const rawCart = localStorage.getItem('bose_cart');
        const cart = rawCart ? JSON.parse(rawCart) : [];
        let totalDisplayItems = 0;
        cart.forEach((/** @type {any} */ item) => {
            // ملاحظة: المنتجات المخصصة (تورت/ورد) بيتولد لها id بالشكل `${slug}-${Date.now()}`
            // يعني بينتهي بسلسلة أرقام طويلة (timestamp)، وده الفارق الحقيقي عن أكواد
            // المنتجات العادية اللي بتستخدم شرطات في كتابتها (kebab-case) زي donuts-matilda
            const hasTimestampSuffix = item.id && /-\d{10,}$/.test(String(item.id));
            const isBespokeOrCustom = item.type === "custom-cake" || 
                                      item.type === "custom-flower" || 
                                      item.type === "mini-cake" || 
                                      hasTimestampSuffix;
            totalDisplayItems += isBespokeOrCustom ? 1 : (parseInt(item.quantity, 10) || 1);
        });
        cartCountBadges.forEach((badge) => badge.textContent = String(totalDisplayItems));
    };

    /**
     * @param {string} message
     */
    window.showBoseGlobalToast = function(message) {
        let container = document.getElementById('bose-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'bose-toast-message';
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('is-visible'));
        setTimeout(() => {
            toast.classList.remove('is-visible');
            toast.classList.add('is-leaving');
            setTimeout(() => { toast.remove(); }, 400);
        }, 3000);
    };

    /**
     * @param {HTMLElement} buttonElement
     * @param {string} productId
     */
    window.handleBoseDirectAddToCart = function(buttonElement, productId) {
        if (!window.BoseStoreData || !buttonElement) return;
        const product = window.BoseStoreData.products ? window.BoseStoreData.products.find((/** @type {any} */ p) => p.id === productId || p.slug === productId) : null;
        if (!product) return;

        const cardContainer = buttonElement.closest('.product-card-unified');
        let qty = 1;
        if (cardContainer) {
            /** @type {HTMLInputElement|null} */
            const qtyInput = cardContainer.querySelector('.input-qty-value');
            if (qtyInput) qty = parseInt(qtyInput.value, 10) || 1;
        }

        const rawCart = localStorage.getItem('bose_cart');
        let cart = rawCart ? JSON.parse(rawCart) : [];
        const existingItem = cart.find((/** @type {any} */ item) => item.id === product.slug);
        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            const newItem = window.createCartItem(product, {}, qty);
            if (newItem) cart.push(newItem);
        }

        localStorage.setItem('bose_cart', JSON.stringify(cart));
        window.updateGlobalCartCounter();

        if (cardContainer) {
            /** @type {HTMLInputElement|null} */ const qtyInput = cardContainer.querySelector('.input-qty-value');
            const priceDisplay = cardContainer.querySelector('.product-card-price');
            if (qtyInput) qtyInput.value = "1";
            if (priceDisplay) priceDisplay.textContent = `${Math.round(product.price)} جنيه`;
        }

        const originalHtml = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fa-solid fa-check"></i> تمت الإضافة';
        /** @type {HTMLButtonElement} */ (buttonElement).disabled = true;

        window.showBoseGlobalToast('ضفنا المنتج للسلة.');

        setTimeout(() => {
            buttonElement.innerHTML = originalHtml;
            /** @type {HTMLButtonElement} */ (buttonElement).disabled = false;
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
        // 🛡️ [إصلاح - المرحلة 3]: manifest.json كان موجود كملف بس مش متربط بأي صفحة،
        // فكانت ميزة "تثبيت الموقع كتطبيق" (PWA) معطّلة فعلياً بدون أي فايدة من وجود
        // الملف. الحقن هنا مركزي في المحرك الرئيسي بدل تكرار الوسم يدوياً في كل صفحة.
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifest = document.createElement('link'); manifest.rel = 'manifest'; manifest.href = '/manifest.json';
            document.head.appendChild(manifest);
        }
        if (!document.querySelector('meta[name="theme-color"]')) {
            const theme = document.createElement('meta'); theme.name = 'theme-color'; theme.content = '#FF91A4';
            document.head.appendChild(theme);
        }
    }

    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;
        if (data.seo && data.seo.title && document.title !== data.seo.title) {
            document.title = data.seo.title;
        }
    }

    function buildAndInjectGlobalComponents() {
        const data = window.BoseStoreData;
        if (!data) return;

        const headerInjector = document.getElementById('bose-header-injector');
        if (headerInjector) {
            const marqueeMessages = data.navigation?.topBarMessages || ["صنعناها بحب لتهديها لمن تحب", "توصيل طازج يومياً لجميع المناطق"];
            let marqueeItemsHtml = '';
            marqueeMessages.forEach((/** @type {string} */ msg) => { marqueeItemsHtml += `<span class="bose-marquee-item">${msg}</span>`; });

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
                            <img id="bose-store-logo" src="${window.optimizeBoseImageUrl(data.store?.logo || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 150)}" alt="لوجو حلويات بوسي الفاخرة" class="brand-logo-img" width="80" height="80" />
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
                            <img src="${window.optimizeBoseImageUrl(data.store?.logo || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 150)}" alt="لوجو حلويات بوسي" class="sidebar-logo" width="80" height="80" />
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
                        <a href="https://wa.me/${window.toInternationalWhatsappNumber(data.social?.whatsapp || '201097238441')}" target="_blank" class="sidebar-contact-pill">
                            <i class="fa-brands fa-whatsapp"></i>
                            <span>راسلنا فوري عبر الواتساب</span>
                        </a>
                        <a href="tel:${data.store?.phone || '01097238441'}" class="sidebar-contact-pill">
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

        // 🔧 [إصلاح جذري]: الشريط السفلي الثابت كان Hardcoded جوه index.html بس، فكان بيختفي
        // تماماً في أي صفحة تانية (منتج، فئة، سلة، دفع...). دلوقتي بيتحقن تلقائياً في كل صفحة
        // محملة core-engine.js، وزرار "العروض" بقى بيوجه لصفحة العروض المستقلة الحقيقية
        // offers.html بدل ما يعمل Scroll جوه الرئيسية بس (اللي أصلاً معندهاش تأثير في أي صفحة تانية).
        if (!document.querySelector('.bose-bottom-nav-bar')) {
            const currentPage = (window.location.pathname.split('/').pop() || 'index.html');
            const isHome = currentPage === '' || currentPage === 'index.html';
            const isOffers = currentPage === 'offers.html';
            const isCart = currentPage === 'cart.html';

            const bottomNav = document.createElement('nav');
            bottomNav.className = 'bose-bottom-nav bose-bottom-nav-bar';
            bottomNav.setAttribute('aria-label', 'التنقل السفلي السريع');
            bottomNav.innerHTML = `
                <a href="index.html" class="bottom-nav-item bose-bottom-nav-item${isHome ? ' active' : ''}">
                    <i class="fas fa-home"></i>
                    <span>الرئيسية</span>
                </a>
                <a href="offers.html" class="bottom-nav-item bose-bottom-nav-item${isOffers ? ' active' : ''}">
                    <i class="fas fa-tags"></i>
                    <span>العروض</span>
                </a>
                <a href="https://wa.me/${window.toInternationalWhatsappNumber(data.social?.whatsapp || '201097238441')}" target="_blank" rel="noopener noreferrer" class="bottom-nav-item bose-bottom-nav-item whatsapp-item">
                    <i class="fab fa-whatsapp"></i>
                    <span>الواتساب</span>
                </a>
                <a href="cart.html" class="bottom-nav-item bose-bottom-nav-item cart-item${isCart ? ' active' : ''}">
                    <div class="nav-cart-icon-wrap">
                        <i class="fas fa-shopping-bag"></i>
                        <span class="nav-cart-badge bose-bottom-nav-badge">0</span>
                    </div>
                    <span>السلة</span>
                </a>
            `;
            document.body.appendChild(bottomNav);
        }

        const footerInjector = document.getElementById('bose-footer-injector');
        if (footerInjector) {
            footerInjector.innerHTML = `
                <footer class="bose-footer" role="contentinfo">
                    <div class="footer-grid-layout">
                        <div class="footer-column-block">
                            <div class="footer-brand-meta">
                                <img src="${window.optimizeBoseImageUrl(data.store?.logo || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 150)}" alt="حلويات بوسي الفاخرة" class="footer-logo" width="80" height="80" />
                                <span class="footer-title">حلويات بوسي</span>
                            </div>
                            <p id="footer-about-text" class="footer-about-paragraph">${data.footer?.about || 'صنعناها بحب لتهديها لمن تحب'}</p>
                            <div id="footer-social-links" class="footer-social-wrapper">
                                <a href="${data.social?.facebook || '#'}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-facebook-f"></i></a>
                                <a href="${data.social?.instagram || '#'}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-instagram"></i></a>
                                <a href="${data.social?.tiktok || '#'}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-tiktok"></i></a>
                                <a href="https://wa.me/${window.toInternationalWhatsappNumber(data.social?.whatsapp || '201097238441')}" target="_blank" class="footer-social-icon-btn"><i class="fa-brands fa-whatsapp"></i></a>
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
                                    <span>${data.store?.pickup?.address || 'العنوان الرئيسي'}</span>
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
        /** @type {HTMLInputElement|null} */ const searchField = document.querySelector('#bose-search-field');
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
            let searchDebounceTimer = null;
            searchField.addEventListener('input', (e) => {
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                const target = /** @type {HTMLInputElement} */ (e.target);
                const rawQuery = target.value;
                searchDebounceTimer = setTimeout(() => {
                    const query = rawQuery.trim().toLowerCase();
                    if (!query) { resultsContainer.innerHTML = ''; return; }

                    const allProducts = window.BoseStoreData?.products || [];
                    const filtered = allProducts.filter((/** @type {any} */ p) => p.title?.toLowerCase().includes(query) || p.flavorName?.toLowerCase().includes(query));

                    let html = '';
                    filtered.forEach((/** @type {any} */ p) => {
                        let targetUrl = (p.id === 'toort-custom-master' || p.slug === 'toort-custom-master') ? 'cake-builder.html' : 
                                        ((p.id === 'flowers-master' || p.slug === 'flowers-master') ? 'flower-builder.html' : `product.html?slug=${encodeURIComponent(p.slug)}`);
                        const safeImg = window.optimizeBoseImageUrl(p.images ? p.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 120);
                        const safeTitle = window.escapeBoseHTML(p.title);
                        const safeFlavor = window.escapeBoseHTML(p.flavorName || '');
                        html += `
                            <a href="${targetUrl}" class="search-result-card-item">
                                <img src="${safeImg}" class="search-result-img" width="60" height="60" loading="lazy" alt="${safeTitle}" />
                                <div class="search-result-info">
                                    <div class="search-result-name">${safeTitle}</div>
                                    ${safeFlavor ? `<div class="search-result-flavor">${safeFlavor}</div>` : ''}
                                </div>
                                <div class="search-result-price-view">${Math.round(p.price)} جنيه</div>
                            </a>
                        `;
                    });
                    resultsContainer.innerHTML = html || '<div class="search-no-results-msg">لم نجد أصنافاً تطابق بحثك.</div>';
                }, 200);
            });
        }
    }

    function showGlobalFriendlyError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bose-global-toast-error';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.';
        document.body.appendChild(errorDiv);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadStoreDatabase);
    } else {
        loadStoreDatabase();
    }
})();