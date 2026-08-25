/**
 * homepage-engine.js - محرك عرض الصفحة الرئيسية فقط (شلال المنتجات، سلايدرات
 * العروض/الأكثر مبيعاً/وصل حديثاً، محاكيات الكيك/الورد على الصفحة الرئيسية،
 * عدادات الفخر، الخط الزمني، صفحة كل العروض، صفحة المفضلة، بلوك تحميل التطبيق
 * الكبير) - كل الدوال هنا كانت جزء من core-engine.js وانفصلت في هذا الملف
 * (2026-08-25) عشان الصفحات التانية (السلة/الدفع/المنتج/الفئة/القائمة/إلخ)
 * متضطرش تحمّل الكود ده وهي مش محتاجاه أصلاً - كل عناصر الـ DOM المستهدفة هنا
 * (offers-slider-track, most-selling-grid, new-arrivals-grid, categories-track,
 * bose-pride-counters, bose-timeline-item, app-promo-appstore-btn, إلخ) موجودة
 * فقط في index.html، بالإضافة لدالتين مستخدمتين في offers.html/favorites.html
 * تحديداً (renderAllOffersPage/renderBoseFavoritesPage).
 *
 * ⚠️ [تبعية حرجة]: لازم يتحمّل بعد core-engine.js (بالترتيب في HTML) لأنه
 * بيستخدم window.createProductCardHTML/window.optimizeBoseImageUrl/
 * window.escapeBoseHTML/window.BoseStoreData المُصدّرة من هناك. مفيش أي كود
 * هنا اتغيّر عن النسخة الأصلية غير استبدال النداءات المباشرة لـ
 * createProductCardHTML بـ window.createProductCardHTML (كان شغال قبل كده
 * كمرجع محلي في نفس الملف، دلوقتي لازم يوصل عن طريق window لأنه بقى في ملف
 * منفصل).
 *
 * محظور الحذف، الاختصار، الدمج، أو التبسيط نهائياً تماشياً مع فلسفة العلامة الفاخرة.
 */

(function () {
    "use strict";

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
        const liveCategoriesList = window.getBoseCategoriesList();
        if (categoriesSection && liveCategoriesList.length) {
            const titleEl = document.getElementById('categories-section-title') || categoriesSection.querySelector('.section-title') || categoriesSection.querySelector('h2');
            const descEl = document.getElementById('categories-section-subtitle') || categoriesSection.querySelector('.bose-section-subtitle');
            
            if (titleEl) titleEl.textContent = "تسوق حسب الفئة";
            if (descEl) descEl.textContent = "قسمنا منيو حلويات بوسي لـ 12 فئة واضحة بالصور، عشان تلاقوا اللي بتحبوه من غير حيرة.";
            
            const track = document.getElementById('categories-track') || categoriesSection.querySelector('.categories-track-slider') || categoriesSection.querySelector('[id*="track"]');
            if (track) {
                track.innerHTML = liveCategoriesList.map(/** @param {Object} cat */ (cat) => `
                    <div class="category-card-unified" onclick="window.location.href='/category.html?category=${encodeURIComponent(cat.id)}'">
                        <img src="${window.optimizeBoseImageUrl(cat.image, 450)}" alt="${window.escapeBoseHTML(cat.title)} | حلويات بوسي" class="category-card-img" width="180" height="180" loading="lazy" />
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
            if (titleEl) titleEl.textContent = "منتجاتنا";
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
     * 🛡️ [V14.0]: بيستبعد المنتجات المتعلّمة "غير متاحة" (isAvailable === false)
     * حتى لو عليها خصم فعلي - منتج نفدت كميته منطقي ميظهرش في واجهة العروض.
     */
    function getAllOfferProducts() {
        const data = window.BoseStoreData;
        if (!data || !data.products) return [];
        return data.products.filter(/** @param {Object} p */ (p) => p.oldPrice && p.oldPrice > p.price && p.isAvailable !== false);
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

        offersTrack.innerHTML = offersData.map(/** @param {Object} offer */ (offer) => window.createProductCardHTML(offer)).join('');
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

        // 🛡️ [أساس إصلاح اتجاه السحب]: بنحدد اتجاه العنصر مرة واحدة هنا،
        // ونستخدمه لتصحيح إشارة (+/-) كل عملية scrollTo/scrollBy تحت - بدل
        // ما نفترض LTR زي أي كود سلايدر عادي جاهز من الإنترنت مش مبني لموقع RTL.
        const isRTL = window.getComputedStyle(track).direction === 'rtl';

        for (let i = 0; i < cards.length; i++) {
            // 🛡️ لازم تتفق مع scroll-snap-align:start في main.css (كارت واحد
            // كامل يبدأ من حافة الشاشة) - لو فضلت center هنا هتتعارض مع القاعدة
            // اللي في الـ CSS وتخلي حساب موقع الدوت (syncDotsAndPosition تحت) غلط.
            /** @type {HTMLElement} */ (cards[i]).style.scrollSnapAlign = 'start';
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

        // 🛡️👑 [إصلاح جذري - عدم مزامنة الدوتس]: الموقع كله direction:rtl، وكل
        // المتصفحات الحديثة (Chrome/Safari/Firefox) بتطبّق معيار الـ scrollLeft
        // في RTL بحيث يبدأ من 0 عند أول كارت (يمين الشاشة) وبيبقى بالسالب كل
        // ما العميل يسحب لكروت تالية (بيتأكد ده تجريبياً على Chromium). يعني
        // scrollLeft بيرجع أرقام زي 0, -320, -640... مش 0, 320, 640 زي الافتراض
        // القديم. كان الكود القديم بيقسم القيمة السالبة دي على عرض الكارت
        // فيطلعله index سالب، وبعدين شرط "لو أقل من صفر خليه صفر" كان بيثبّت
        // الدوت الأول مضيء طول الوقت مهما سحب العميل لأي كارت. الحل: نستخدم
        // Math.abs() في القراءة عشان يشتغل صح في الحالتين (RTL بالسالب أو أي
        // حالة LTR مستقبلية بالموجب) من غير ما نحتاج نفرّق بينهم أصلاً.
        const syncDotsAndPosition = () => {
            const cardEl = /** @type {HTMLElement} */ (cards[0]);
            const cardWidth = cardEl.offsetWidth + parseInt(window.getComputedStyle(track).gap || '20', 10);
            const scrollPosition = Math.abs(track.scrollLeft);
            let activeIndex = Math.round(scrollPosition / cardWidth);
            
            if (activeIndex < 0) activeIndex = 0;
            if (activeIndex >= count) activeIndex = count - 1;

            dots.forEach((/** @type {Element} */ dot, /** @type {number} */ idx) => {
                dot.classList.toggle('active', idx === activeIndex);
            });
        };

        track.addEventListener('scroll', syncDotsAndPosition);

        // 🛡️ [إصلاح ربط الدوتس]: كان الدوت النشط بيتحدث بس مع حدث scroll - لو
        // العميل غيّر اتجاه الموبايل (portrait/landscape) أو غيّر حجم الشاشة
        // (بيغيّر عرض الكارت عند نقاط التوقف 1023/767/550/400px) من غير ما
        // يسحب السلايدر بعدها، كان الدوت القديم بيفضل مضيء غلط لحد أول سحبة
        // جديدة. أضفنا مزامنة على resize كمان (بعد تأخير بسيط عشان الأبعاد
        // تستقر) عشان الدوت يفضل مرتبط صح بموقع الكارت الفعلي دايماً.
        let resizeSyncTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeSyncTimer);
            resizeSyncTimer = setTimeout(syncDotsAndPosition, 150);
        });

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
                    // 🛡️ لازم نضرب في (isRTL ? -1 : 1) - غير كده في RTL أي index
                    // غير الصفر بيبقى رقم موجب برّه المدى المسموح (0 لحد -maxScroll)
                    // فالمتصفح كان بيتجاهله تمامًا ويرجّع الدوت لمكانه (زي ما مفيش
                    // ضغطة حصلت أصلاً) بدل ما يوديه للكارت المطلوب.
                    track.scrollTo({ left: cardWidth * index * (isRTL ? -1 : 1), behavior: 'smooth' });
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
                
                // 🛡️👑 [إصلاح - زرار "التالي" كان مش بيعمل حاجة خالص وزرار "السابق"
                // كان بيشتغل عكسه]: بنفس منطق الدوتس بالظبط - "التالي" لازم يودي
                // لكارت لاحق (يعني scrollLeft يزيد سالبية في RTL)، فلازم يضرب في
                // -1 مش +1. كان زرار "التالي" (+step) بيحاول يتخطى الحد الأقصى
                // المسموح (0) فالمتصفح كان بيرفضه ويسيب المكان زي ما هو، وزرار
                // "السابق" (-step) كان صدفة بيودي "قدام" مش "ورا" لإن اتجاهه
                // مطابق لاتجاه RTL الصحيح من غير قصد.
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    track.style.scrollBehavior = 'smooth';
                    track.scrollBy({ left: getScrollStep() * (isRTL ? -1 : 1), behavior: 'smooth' });
                });
                
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    track.style.scrollBehavior = 'smooth';
                    track.scrollBy({ left: getScrollStep() * (isRTL ? 1 : -1), behavior: 'smooth' });
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

        // 🖱️ السحب اليدوي بالماوس (ديسكتوب) فقط. الموبايل بيستخدم السكرول الأصلي
        // للمتصفح (native overflow-x touch scrolling) اللي أصلاً مفعّل ومظبوط بـ
        // scroll-snap فوق، وده سلس تلقائياً من غير أي تدخل جافاسكريبت.
        track.addEventListener('mousedown', onDragStart);
        track.addEventListener('mousemove', onDragMove);
        track.addEventListener('mouseup', onDragEnd);
        track.addEventListener('mouseleave', onDragEnd);

        // 🛡️ [إصلاح ثقل السحب باللمس]: كان فيه تطبيق يدوي لـ scrollLeft فوق نفس
        // العنصر اللي أصلاً native overflow-scroll، فالنظامين (سكرول المتصفح
        // الطبيعي + تعديل الجافاسكريبت اليدوي لنفس القيمة) كانوا بيتعاركوا مع
        // بعض في نفس اللحظة، وده اللي بيحس العميل بيه كسحب "تقيل" وغير سلس على
        // الموبايل تحديداً. اتشالت الاستماعات اليدوية دي بالكامل والسكرول
        // بالإصبع بقى معتمد 100% على سلوك المتصفح الأصلي السلس.
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
        grid.innerHTML = offersData.map(/** @param {Object} offer */ (offer) => window.createProductCardHTML(offer)).join('');
    }

    /**
     * 💗 صفحة المفضلة المستقلة favorites.html - بتقرا قائمة الـ IDs المحفوظة محلياً
     * من window.getBoseFavorites() وبتقارنها بأحدث نسخة حية من بيانات المنتجات
     * (مش نسخة قديمة مخزّنة)، فلو صاحبة المتجر غيّرت سعر/صورة/توفر منتج بعدين،
     * العميلة بتشوف أحدث حالة له في مفضلتها دايماً - مش تفاصيل قديمة. بتستخدم
     * نفس createProductCardHTML الموحدة، فزرار القلب والسعر وكل حاجة متطابقة
     * 100% مع باقي الموقع من غير أي كود مكرر.
     */
    function renderBoseFavoritesPage() {
        const grid = document.getElementById('bose-favorites-grid');
        if (!grid) return;

        const data = window.BoseStoreData;
        const emptyState = document.getElementById('bose-favorites-empty-state');
        if (!data || !data.products) return;

        const favIds = typeof window.getBoseFavorites === 'function' ? window.getBoseFavorites() : [];
        const favProducts = favIds
            .map((id) => data.products.find((p) => String(p.id) === String(id)))
            .filter(Boolean);

        if (favProducts.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        grid.innerHTML = favProducts.map((/** @type {Object} */ p) => window.createProductCardHTML(p)).join('');
    }
    window.renderBoseFavoritesPage = renderBoseFavoritesPage;

    function renderDynamicWaterfall() {
        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        const waterfallData = window.BoseStoreData?.homepage?.waterfall;

        if (!waterfallData) return;

        /**
         * كل صورة في الشلال دلوقتي رابط مباشر بسيط (image فقط) - مش مربوطة
         * بمنتج حقيقي. لسه بندعم الشكل القديم (image + slug) لو موجود في
         * بيانات قديمة عشان ميتكسرش أي حاجة، بس الإضافة من لوحة التحكم
         * دلوقتي بتحفظ روابط مباشرة بس.
         * @param {Array<Object|string>} items
         */
        const buildWaterfallItemsHtml = (items) => items.map((item) => {
            // 🛡️ [إصلاح حرج]: الصور المرفوعة يدوياً من لوحة التحكم (من غير ربط
            // بمنتج) بتتخزن ككائن { image, slug: "" } مش نص خام زي الشكل القديم.
            // كنا بنستخرج الصورة بس لو فيه slug، فأي صورة من غير ربط كانت بتاخد
            // الكائن كله كـ src وتظهر مكسورة. دلوقتي بنستخرج image صح في الحالتين.
            const isObject = item && typeof item === 'object';
            const imgSrc = isObject ? item.image : item;
            const isLinked = isObject && !!item.slug;
            const imgTag = `<img src="${window.optimizeBoseImageUrl(imgSrc, 300)}" alt="منتج فاخر حلويات بوسي" class="waterfall-img" width="220" height="220" loading="lazy" />`;
            return isLinked
                ? `<a href="/product.html?slug=${encodeURIComponent(item.slug)}" class="waterfall-img-link" aria-label="عرض تفاصيل المنتج">${imgTag}</a>`
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

        // ⚙️ [تحكم في سرعة الشلال وتشغيله/إيقافه من لوحة التحكم]: بيتقرا من
        // homepage.waterfall.speedSeconds و homepage.waterfall.enabled. الإيقاف
        // بيجمّد الحركة مكانها (بيفضل المحتوى ظاهر) بدل ما يخفي القسم بالكامل.
        const waterfallSpeed = Number(waterfallData.speedSeconds) > 0 ? Number(waterfallData.speedSeconds) : 57.2;
        const waterfallEnabled = waterfallData.enabled !== false;
        [leftCol?.querySelector('.waterfall-up'), rightCol?.querySelector('.waterfall-down')].forEach((track) => {
            if (!track) return;
            // ملحوظة: لازم !important هنا لأن قاعدة الـ CSS الأصلية لـ .waterfall-up/.waterfall-down
            // نفسها !important، وأي inline style عادي (من غير important) هيتجاهله المتصفح.
            track.style.setProperty('animation-duration', `${waterfallSpeed}s`, 'important');
            track.style.setProperty('animation-play-state', waterfallEnabled ? 'running' : 'paused', 'important');
        });
    }
    function renderHomepageProductGrids() {
        const data = window.BoseStoreData;
        // 🛡️ [تحصين]: data.homepage ممكن يوصل فاضي {} لحد ما يتملى من لوحة التحكم،
        // فالحماية هنا بتمنع أي كسر JS بدل ما تعتمد بس على وجود homepage نفسه.
        if (!data || !data.products || !data.homepage) return;

        const mostSellingGrid = document.getElementById('most-selling-grid');
        if (mostSellingGrid && data.homepage.mostSelling) {
            const items = data.homepage.mostSelling.map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean);
            mostSellingGrid.innerHTML = items.map((/** @type {any} */ p) => window.createProductCardHTML(p)).join('');
        }

        const newArrivalsGrid = document.getElementById('new-arrivals-grid');
        if (newArrivalsGrid && data.homepage.newArrivals) {
            const items = data.homepage.newArrivals.map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean);
            newArrivalsGrid.innerHTML = items.map((/** @type {any} */ p) => window.createProductCardHTML(p)).join('');
        }

        const ourProductsGrid = document.getElementById('our-products-grid');
        if (ourProductsGrid && data.homepage.ourProducts) {
            const initialItems = data.homepage.ourProducts.slice(0, 4).map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean).filter(isSingleSizeProduct);
            ourProductsGrid.innerHTML = initialItems.map((/** @type {any} */ p) => window.createProductCardHTML(p)).join('');
        }
    }

    // 🛡️👑 [قسم "منتجاتنا"]: بناءً على طلب صاحبة المتجر، أي منتج متعدد الأحجام
    // (زي الديسباسيتو والريدڤيلڤت) بيتشال من القسم ده تحديداً عشان بلوك تبويبات
    // الحجم بتاعه بيخلي طول الكارت زيادة عن اللزوم. القسم ده لازم يفضل يعرض
    // منتجات مفردة الحجم بس عشان الكروت تفضل قصيرة ومتسقة. لازم لوحة التحكم
    // تختار 8 منتجات مفردة الحجم بالظبط في homepage.ourProducts عشان يظهروا
    // 8 كروت كاملين هنا (أي منتج متعدد أحجام من ضمن الاختيار هيتشال من غير بديل).
    /** @param {any} product */
    function isSingleSizeProduct(product) {
        if (!product) return false;
        const availableSizes = (product.prices && typeof product.prices === 'object') ? Object.keys(product.prices) : [];
        const distinctSizePrices = new Set(availableSizes.map(s => product.prices[s]));
        return !(availableSizes.length > 1 && distinctSizePrices.size > 1);
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
            // 🛡️ [تحصين]: منع كسر JS لو ourProducts لسه مش متملي في لوحة التحكم
            if (!data.homepage || !data.homepage.ourProducts) return;
            const allItems = data.homepage.ourProducts.map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean).filter(isSingleSizeProduct);
            ourProductsGrid.innerHTML = allItems.map((/** @type {any} */ p) => window.createProductCardHTML(p)).join('');
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

        // 🎥 [إدارة فيديوهات الصفحة الرئيسية من لوحة التحكم - 2026-08-23]: نفس
        // فيديوهين "سيمفونية الطعم" و"عقد من الإتقان" كانوا Hardcoded بالكامل.
        // دلوقتي لو صاحبة المتجر رفعت فيديو جديد/عدّلت العنوان أو الوصف من
        // اللوحة، بيتقروا من homepage.videoSections هنا ويستبدلوا المحتوى
        // الافتراضي - مع نفس تحسين الجودة/استهلاك البيانات (q_auto/f_auto)
        // المطبّق أصلاً على الفيديوهين الافتراضيين. لو مفيش بيانات محفوظة
        // (أول نشر للميزة دي)، الفيديو الافتراضي الحالي بيفضل شغال زي ما هو
        // من غير أي تغيير.
        const VIDEO_SECTIONS_MAP = {
            symphony: { sectionId: 'symphony-video-section', titleId: 'symphony-main-heading', descId: 'symphony-description', iframeId: 'symphony-video-iframe' },
            excellence: { sectionId: 'excellence-video-section', titleId: 'excellence-main-heading', descId: 'excellence-description', iframeId: 'excellence-video-iframe' },
        };
        if (data.homepage.videoSections) {
            Object.keys(VIDEO_SECTIONS_MAP).forEach((key) => {
                const cfg = VIDEO_SECTIONS_MAP[key];
                const saved = data.homepage.videoSections[key];
                if (!saved) return;
                const titleEl = document.getElementById(cfg.titleId);
                const descEl = document.getElementById(cfg.descId);
                const iframeEl = document.getElementById(cfg.iframeId);
                if (titleEl && saved.title) titleEl.textContent = saved.title;
                if (descEl && saved.description) descEl.textContent = saved.description;
                if (iframeEl && saved.publicId) {
                    const params = [
                        'cloud_name=dyx4w0dr1',
                        `public_id=${encodeURIComponent(saved.publicId)}`,
                        'autoplay=true', 'muted=true', 'loop=true',
                        'player%5Bfluid%5D=true', 'player%5Bcontrols%5D=false',
                        'source%5Btransformation%5D%5B0%5D%5Bquality%5D=auto',
                        'source%5Btransformation%5D%5B0%5D%5Bfetch_format%5D=auto',
                    ];
                    iframeEl.setAttribute('data-src', `https://player.cloudinary.com/embed/?${params.join('&')}`);
                }
            });
        }
    }

    /**
     * 🎬👑 [حركة الظهور التدريجي لبلوكي محاكي التورت ومحاكي الورد]: بتفعّل كلاس
     * bose-in-view على كل بلوك (.bose-simulator-reveal) أول ما يوصله نظر العميل
     * أثناء التمرير، عشان البلوك كله ونقاط القيمة التنافسية جواه يظهروا بحركة
     * منظمة ومتتابعة بدل ما يكونوا ثابتين من أول ما الصفحة تحمل. نفس فلسفة
     * setupPrideCountersAnimation (IntersectionObserver + unobserve بعد التفعيل
     * مرة واحدة فقط) عشان مفيش أي استهلاك زيادة للمعالج بعد أول ظهور.
     */
    /**
     * 🎬 [تحميل كسول للفيديوهين]: بدل ما فيديو "سيمفونية الطعم" و"عقد من الإتقان"
     * يتحملوا ويشتغلوا فور فتح الصفحة وهما لسه تحت خالص برّه الشاشة (استهلاك
     * بيانات وأداء من غير داعي، خصوصًا على موبايل)، بننتظر لحد ما الفريم يوصل
     * فعليًا لمسافة قريبة من الشاشة (rootMargin) وبعدين بس نحط الـ src الحقيقي
     * من data-src ونفعّل كلاس bose-video-loaded عشان يظهر بحركة ناعمة بدل
     * السكيلتون النابض.
     */
    function setupLazyVideoLoading() {
        const frames = document.querySelectorAll('.bose-lazy-video-frame');
        if (!frames.length) return;

        const loadFrame = (/** @type {Element} */ frame) => {
            const iframe = frame.querySelector('iframe[data-src]');
            if (!iframe || iframe.getAttribute('src')) return;
            iframe.setAttribute('src', iframe.getAttribute('data-src'));
            iframe.addEventListener('load', () => frame.classList.add('bose-video-loaded'), { once: true });
        };

        if (!('IntersectionObserver' in window)) {
            frames.forEach(loadFrame);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    loadFrame(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '400px 0px' });

        frames.forEach((/** @type {Element} */ frame) => observer.observe(frame));
    }

    function setupSimulatorPreviewAnimations() {
        const revealBlocks = document.querySelectorAll('.bose-simulator-reveal');
        if (!revealBlocks.length) return;

        if (!('IntersectionObserver' in window)) {
            revealBlocks.forEach((/** @type {Element} */ block) => block.classList.add('bose-in-view'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('bose-in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.25 });

        revealBlocks.forEach((/** @type {Element} */ block) => observer.observe(block));
    }

    /**
     * 🛡️👑 [إصلاح ازدواجية العداد]: قبل كده كان فيه نسختين بيحركوا نفس أرقام
     * قسم الفخر والاعتزاز في نفس الوقت - نسخة هنا بتتفعل بالسكرول (IntersectionObserver)،
     * ونسخة تانية Inline جوه index.html بتتفعل فور جهوزية البيانات (onBoseDatabaseReady)
     * من غير أي علاقة بمكان العميل في الصفحة. النتيجة: لو العميل يوصل للقسم بعد
     * ما البيانات جهزت، الرقم كان بيتصفر ويتعد من الأول تاني قدامه - إحساس إن
     * حاجة "بايظة" بدل ما يبني ثقة. دلوقتي دالة واحدة بس هي مصدر الحقيقة
     * الوحيد لكل حاجة في القسم ده (الأرقام + التسميات القادمة من لوحة التحكم)،
     * والسكريبت الـ Inline اتشال بالكامل من index.html.
     */
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

        // 🏷️ تحديث التسميات القادمة من لوحة التحكم (كانت بس بتتحدث في السكريبت
        // الـ Inline المحذوف - دلوقتي بقت جزء من نفس الدالة عشان تفضل متزامنة
        // مع تحريك الأرقام بدل ما تكون منطق منفصل في مكان تاني بالكامل).
        Object.keys(statsData).forEach((key) => {
            const labelEl = document.getElementById(`stat-${key}-label`);
            if (labelEl && statsData[key].label) labelEl.textContent = statsData[key].label;
        });

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
     * 🎬 [ظهور متتابع لعقد التايم لاين في قسم الفخر والاعتزاز]: كل محطة في
     * الحكاية (.bose-timeline-item) بتتراقب لوحدها وتظهر بحركة بسيطة أول ما
     * توصل لشاشة العميل، عشان الإحساس يبقى إن الحكاية بتتحكي قدامه خطوة خطوة
     * أثناء نزوله بالسكرول - مش كل حاجة تظهر مرة واحدة كتلة واحدة جامدة.
     */
    function setupPrideTimelineReveal() {
        const timelineItems = document.querySelectorAll('.bose-timeline-item');
        if (!timelineItems.length) return;

        if (!('IntersectionObserver' in window)) {
            timelineItems.forEach((/** @type {Element} */ item) => item.classList.add('bose-in-view'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('bose-in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.35 });

        timelineItems.forEach((/** @type {Element} */ item) => observer.observe(item));
    }
    /**
     * 👑 [مرحلة جديدة - البلوك الكبير]: تفعيل زراير App Store / Google Play في
     * البلوك البصري الكبير بالصفحة الرئيسية - نفس الدالة الموحدة المستخدمة في
     * نافذة الترحيب بالظبط.
     */
    function setupAppPromoBlockButtons() {
        const iosBtn = document.getElementById('app-promo-appstore-btn');
        const androidBtn = document.getElementById('app-promo-googleplay-btn');
        if (iosBtn) iosBtn.addEventListener('click', () => window.triggerBoseAppInstall());
        if (androidBtn) androidBtn.addEventListener('click', () => window.triggerBoseAppInstall());
    }

    /**
     * 👑 [محتوى حقيقي - بلوك تحميل التطبيق]: الشاشة 1 (المنتجات) والشاشة 3 (السلة)
     * جوه محاكي الموبايل كانت مجرد صناديق رمادية فاضية (Placeholder بصري بحت من غير
     * أي بيانات حقيقية). الدالة دي بتاخد نفس منتجات "الأكثر مبيعاً" الحقيقية اللي
     * ظاهرة فعلاً في قسم most-selling بالصفحة (من data.homepage.mostSelling) وتحقن
     * صورها الحقيقية وأسمائها وأسعارها جوه الموبايل، عشان المعاينة تبقى انعكاس حقيقي
     * للمنيو الفعلي بدل تصميم تجريدي وهمي.
     */
    function injectAppPromoRealContent() {
        const data = window.BoseStoreData;
        if (!data || !data.products) return;

        const sourceIds = (data.homepage && (data.homepage.mostSelling || data.homepage.newArrivals)) || [];
        const items = sourceIds
            .map((/** @param {string} id */ id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id))
            .filter(Boolean);

        // 🛡️ لو مفيش عناصر متربطة في لوحة التحكم لسه، منسيبش الصناديق فاضية بلا داعي - نرجع لأول منتجات حقيقية موجودة في القاعدة
        const products = (items.length ? items : data.products).slice(0, 4);
        if (!products.length) return;

        const gridEl = document.getElementById('app-promo-product-grid');
        if (gridEl) {
            gridEl.innerHTML = products.slice(0, 4).map((/** @type {any} */ p) => {
                const img = window.optimizeBoseImageUrl((p.images && p.images.length > 0 && p.images[0]) ? p.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 200);
                const title = window.escapeBoseHTML(p.title || '');
                return `<div class="mock-product-card"><img src="${img}" alt="${title}" loading="lazy" /><span class="mock-product-name">${title}</span></div>`;
            }).join('');
        }

        const cartRowsEl = document.getElementById('app-promo-cart-rows');
        if (cartRowsEl) {
            cartRowsEl.innerHTML = products.slice(0, 2).map((/** @type {any} */ p) => {
                const img = window.optimizeBoseImageUrl((p.images && p.images.length > 0 && p.images[0]) ? p.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 100);
                const title = window.escapeBoseHTML(p.title || '');
                const price = Math.round(p.basePrice || p.price || 0);
                return `
                    <div class="mock-cart-row">
                        <div class="mock-cart-thumb"><img src="${img}" alt="${title}" loading="lazy" /></div>
                        <div class="mock-cart-lines">
                            <span class="mock-cart-name">${title}</span>
                            <span class="mock-cart-price">${price} جنيه</span>
                        </div>
                    </div>`;
            }).join('');
        }
    }


    /**
     * تشغيل كل دوال عرض الصفحة الرئيسية بعد ما بيانات المتجر توصل - بنفس
     * الترتيب والمنطق اللي كان في initCoreFlow() الأصلية بالظبط (فرق التوقيت
     * الوحيد إن ده بيحصل من خلال حدث BoseDatabaseLoaded بدل نداء مباشر، بنفس
     * الأسلوب المستخدم أصلاً في cart-engine.js/cake-engine.js/favorites-engine.js
     * وغيرهم لنفس الحدث - مش أسلوب جديد).
     */
    function runHomepageEngine() {
        injectHomepageSectionMeta();
        renderDynamicWaterfall();
        renderOffersSection();
        renderAllOffersPage();
        renderBoseFavoritesPage();
        renderHomepageProductGrids();
        setupOurProductsShowMore();
        injectSimulatorsPreviewData();
        setupSimulatorPreviewAnimations();
        setupLazyVideoLoading();
        setupPrideCountersAnimation();
        setupPrideTimelineReveal();
        setupAppPromoBlockButtons();
        injectAppPromoRealContent();

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setupBoseUnifiedSliderEngine('offers-slider-track', 'offers-dots-container', 'offers-carousel-section');
                setupBoseUnifiedSliderEngine('categories-track', 'categories-dots-container', 'categories-slider-section');
                setupBoseUnifiedSliderEngine('most-selling-grid', 'most-selling-dots-container', 'most-selling-section');
                setupBoseUnifiedSliderEngine('new-arrivals-grid', 'new-arrivals-dots-container', 'new-arrivals-section');
            });
        });
    }

    // لو البيانات وصلت بالفعل قبل ما نسجل المستمع (سباق تحميل نادر)، شغّليها فوراً؛
    // غير كده استني الحدث الرسمي - نفس نمط الحراسة المستخدم في menu.html.
    if (window.BoseStoreData) {
        runHomepageEngine();
    }
    document.addEventListener("BoseDatabaseLoaded", runHomepageEngine);
})();
