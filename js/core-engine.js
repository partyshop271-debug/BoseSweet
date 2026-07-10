/**
 * 👑 المحرك المركزي العام والنهائي للموقع - حلويات بوسي (BoseSweets) 👑
 * النسخة الهندسية القياسية الشاملة والمطورة بنسبة 100% - خالية تماماً من الثغرات البرمجية والمالية V66.0
 * متوافق بشكل مطلق وثنائي الاتجاه مع كافة ملفات css/ وجافا سكريبت الموقع وقاعدة البيانات site-data-final.json
 * يدمج حارس الإيماءات اللمسية الذكي وتأثير السكرول المتطور للهيدر مع الحفاظ التام على خريطة الـ DOM المقدسة
 */

(function () {
    "use strict";

    // 🎨 نظام الألوان الحاكمة والمقدسة للعلامة التجارية للهندسة البصرية الرقمية (The Strict Palette)
    const BRAND_COLORS = {
        pink: "#FF91A4",  // نبض الحياة في الموقع: حدود كروت المنتجات، الظلال الناعمة، نصوص الأسعار، والـ Hover
        white: "#FFFFFF", // المسيطر تماماً على الخلفيات والمساحات لخلق تنفس بصري ومنع التكديس لراحة العميل النفسية
        black: "#111111", // Texts and headings only to ensure absolute visual clarity - strictly isolated from shadows/backgrounds
        gold: "#D4AF37"   // وجود رمزي ناعم وخفيف جداً لمحاكاة فخامة اللوجو ونجوم التقييمات
    };

    const CART_STORAGE_KEY = 'bose_cart';
    let boseGlobalStoreData = null;
    let databaseReadyCallbacks = [];
    window.boseServerTimeOffset = 0; 

    /* ==========================================================================\
       1. حارس التمهيد واستدعاء قاعدة البيانات المعتمدة مع كسر الكاش
       ========================================================================== */
    async function loadBoseAbsoluteDatabase() {
        try {
            const cacheBuster = `?v=${Date.now()}`;
            // جلب البيانات الصريحة من المرجعية الموحدة للموقع مباشرة
            const response = await fetch('site-data-final.json' + cacheBuster);
            if (!response.ok) throw new Error(`فشل جلب ملف قاعدة البيانات الرئيسي الموحد.`);
            
            boseGlobalStoreData = await response.json();
            
            // مزامنة توقيت الخادم الموحد لحماية شرط التحضير الـ 24 ساعة ومنع التلاعب العشوائي للساعات
            const serverDateHeader = response.headers ? response.headers.get('Date') : null;
            if (serverDateHeader) {
                window.boseServerTimeOffset = new Date(serverDateHeader).getTime() - Date.now();
            } else {
                window.boseServerTimeOffset = 0;
            }

            window.BoseStoreData = boseGlobalStoreData;
            
            injectEarlyDependencies();
            applyGlobalSEOAndBranding();
            
            document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: boseGlobalStoreData }));
            
            databaseReadyCallbacks.forEach(callback => callback(boseGlobalStoreData));
            databaseReadyCallbacks = [];

            initializeGlobalFeatures();
            ensureSharedLayoutHubs(boseGlobalStoreData);
            
        } catch (error) {
            console.error("❌ خطأ حرج في تهيئة نظام حلويات بوسي الموحد:", error);
        }
    }

    window.onBoseDatabaseReady = function (callback) {
        if (boseGlobalStoreData) {
            callback(boseGlobalStoreData);
        } else {
            databaseReadyCallbacks.push(callback);
        }
    };

    function injectEarlyDependencies() {
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            const preconnect1 = document.createElement('link');
            preconnect1.rel = 'preconnect';
            preconnect1.href = 'https://fonts.googleapis.com';
            const preconnect2 = document.createElement('link');
            preconnect2.rel = 'preconnect';
            preconnect2.href = 'https://fonts.gstatic.com';
            preconnect2.crossOrigin = 'anonymous';
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
            document.head.appendChild(preconnect1);
            document.head.appendChild(preconnect2);
            document.head.appendChild(fontLink);
        }
        if (!document.querySelector('link[href*="all.min.css"]')) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(faLink);
        }
    }

    function applyGlobalSEOAndBranding() {
        if (!boseGlobalStoreData) return;
        const data = boseGlobalStoreData;
        document.title = data.seo?.title || "حلويات بوسي";
        
        const logoImgs = document.querySelectorAll('img#bose-store-logo');
        logoImgs.forEach(img => {
            if (data.store && img.src !== data.store.logo) img.src = data.store.logo;
        });
        const aboutText = document.getElementById('footer-about-text');
        if (aboutText && !aboutText.textContent && data.footer) aboutText.textContent = data.footer.about;
    }

    function ensureSharedLayoutHubs(storeData) {
        if (!storeData) return;

        // 🚨 حرس الترتيب الصارم: حقن الشريط التسويقي أولاً كأول عنصر هندسي مقدّس في الـ body قبل الهيدر تماماً
        let tickerNode = document.getElementById('top-bar-marquee');
        if (tickerNode && tickerNode.innerHTML.trim() === "" && storeData.navigation?.topBarMessages) {
            const messagesHTML = storeData.navigation.topBarMessages.map(msg => `
                <div class="bose-ticker-item"><i class="fas fa-star" style="color: ${BRAND_COLORS.gold};"></i> ${msg}</div>
            `).join('');
            tickerNode.innerHTML = `<div class="bose-ticker-wrapper animate-marquee">${messagesHTML}${messagesHTML}</div>`;
        }
        
        const logoImgs = document.querySelectorAll('img#bose-store-logo');
        logoImgs.forEach(img => {
            if (img.src !== storeData.store.logo) img.src = storeData.store.logo;
        });
        
        const aboutText = document.getElementById('footer-about-text');
        if (aboutText) aboutText.textContent = storeData.footer.about;

        let footerPolicies = document.getElementById("bose-footer-policies");
        if (footerPolicies && storeData.footer?.policies && footerPolicies.innerHTML.trim() === "") {
            footerPolicies.innerHTML = storeData.footer.policies.map(policy => `
                <a href="privacy-policy.html" class="footer-policy-link" style="font-size: 0.85rem; margin: 0 10px; font-weight: 600 !important; color: ${BRAND_COLORS.black};">${policy}</a>
            `).join('');
        }

        updateGlobalCartCounters();
    }

    /* ==========================================================================
       2. محرك السحب اللمسي المتطور والأجهزة الذكية (Flexible Touch Scroller Engine)
       ========================================================================== */
    function boseBuildAdvancedTouchTrack(wrapperId, trackId, dotsContainerId) {
        const wrapper = document.getElementById(wrapperId);
        const track = document.getElementById(trackId);
        const dotsContainer = document.getElementById(dotsContainerId);
        if (!wrapper || !track) return;

        let isDragging = false;
        let startX = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let animationId = 0;
        let currentIndex = 0;

        // تفعيل السحب اللمسي حصرياً على شاشات الهواتف والموبايل أولاً لمنع جمود وشلل الكروت
        if (window.innerWidth <= 480) {
            track.style.transition = "none";
            track.addEventListener("touchstart", (e) => {
                isDragging = true;
                startX = e.touches[0].clientX;
                track.style.transition = "none";
                animationId = requestAnimationFrame(renderTrackPhysics);
            }, { passive: true });

            track.addEventListener("touchmove", (e) => {
                if (!isDragging) return;
                const currentX = e.touches[0].clientX;
                const diff = currentX - startX;
                currentTranslate = prevTranslate + diff;
            }, { passive: true });

            track.addEventListener("touchend", () => {
                isDragging = false;
                cancelAnimationFrame(animationId);
                const cards = track.children;
                if (!cards.length) return;

                const cardWidth = cards[0].offsetWidth + 16; 
                const movedBy = currentTranslate - prevTranslate;

                if (movedBy < -50 && currentIndex < cards.length - 1) {
                    currentIndex++;
                } else if (movedBy > 50 && currentIndex > 0) {
                    currentIndex--;
                }

                snapToSlideIndex(currentIndex, cardWidth);
            });

            // بناء نظام المؤشرات النقطية المتفاعل تلقائياً بالمسطرة
            setTimeout(() => {
                const cards = track.children;
                if (cards.length > 0 && dotsContainer && dotsContainer.innerHTML.trim() === "") {
                    dotsContainer.innerHTML = Array.from(cards).map((_, i) => `
                        <button class="bose-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="الانتقال لعنصر ${i+1}"></button>
                    `).join('');
                    
                    Array.from(dotsContainer.children).forEach(dot => {
                        dot.onclick = function() {
                            const targetIdx = parseInt(this.getAttribute("data-index"), 10);
                            snapToSlideIndex(targetIdx, cards[0].offsetWidth + 16);
                        };
                    });
                }
            }, 400);
        }

        function renderTrackPhysics() {
            if (isDragging) {
                track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
                animationId = requestAnimationFrame(renderTrackPhysics);
            }
        }

        function snapToSlideIndex(index, cardWidth) {
            currentIndex = index;
            currentTranslate = -currentIndex * cardWidth;
            prevTranslate = currentTranslate;
            
            track.style.transition = "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
            track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
            
            if (dotsContainer && dotsContainer.children.length > index) {
                Array.from(dotsContainer.children).forEach(d => d.classList.remove("active"));
                dotsContainer.children[index].classList.add("active");
            }
        }
    }

    function runBoseStatsCounter(storeData) {
        const prideSection = document.getElementById('pride-section');
        if (!prideSection || !storeData?.homepage?.pride?.stats) return; 

        const statsConfig = storeData.homepage.pride.stats;
        const targets = [
            { id: 'stat-years-value', val: statsConfig.years.value, suf: statsConfig.years.suffix },
            { id: 'stat-customers-value', val: statsConfig.customers.value, suf: statsConfig.customers.suffix },
            { id: 'stat-orders-value', val: statsConfig.orders.value, suf: statsConfig.orders.suffix },
            { id: 'stat-cakes-value', val: statsConfig.cakes.value, suf: statsConfig.cakes.suffix },
            { id: 'stat-bouquets-value', val: statsConfig.bouquets.value, suf: statsConfig.bouquets.suffix }
        ];

        const animateNode = (item) => {
            const el = document.getElementById(item.id);
            if (!el || el.getAttribute('data-animated') === 'true') return;
            el.setAttribute('data-animated', 'true');

            let start = 0;
            const end = parseInt(item.val, 10);
            if (end === 0) return;
            
            const duration = 2000;
            const stepTime = Math.max(Math.floor(duration / end), 15);
            
            const timer = setInterval(() => {
                start += Math.ceil(end / 50);
                if (start >= end) {
                    start = end;
                    clearInterval(timer);
                }
                el.textContent = start.toLocaleString('en-US') + item.suf;
            }, stepTime);
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    targets.forEach(animateNode);
                    observer.unobserve(prideSection);
                }
            }, { threshold: 0.15 });
            observer.observe(prideSection);
        } else {
            targets.forEach(animateNode);
        }
    }

    function renderBoseCategoriesSlider(storeData) {
        const track = document.getElementById('categories-track');
        if (!track || !storeData?.homepage?.categoriesSlider) return; 

        track.innerHTML = storeData.homepage.categoriesSlider.map(cat => `
            <a href="category.html?id=${cat.id}" class="category-slide-card" style="background-color: #FFFFFF !important; text-decoration: none; display: block;">
                <img src="${cat.image}" alt="${cat.title} حلويات بوسي" loading="lazy">
                <h3 style="font-weight: 700 !important; font-size: 20px !important; text-align: center; color: #111111 !important; margin-top: 12px;">${cat.title}</h3>
            </a>
        `).join('');

        boseBuildAdvancedTouchTrack("categories-slider-wrapper", "categories-track", "categories-dots");
    }

    function initializeBosePrideSlider() {
        const prideTrack = document.getElementById('excellence-images-track');
        if (!prideTrack || !boseGlobalStoreData?.homepage?.excellence?.images) return; 

        // 🛡️ [حل ثغرة البياض الميت]: ضخ الصور فريش من الـ JSON قبل تشغيل فيزياء السلايدر
        const customCardData = [
            { title: "التورت المصممة بحب", label: "طعم فريد يشرفك", slug: "toort-custom-master" },
            { title: "خامات طبيعية 100%", label: "أعلى جودة ومذاق", slug: "gateaux-royal" },
            { title: "تغليف راقٍ وفخم", label: "مناسب لكافة هداياك", slug: "relax-box" }
        ];

        prideTrack.innerHTML = boseGlobalStoreData.homepage.excellence.images.map((img, idx) => `
            <a href="product.html?slug=${customCardData[idx].slug}" class="bose-perfection-card" style="background-color: #FFFFFF !important;">
                <div class="perfection-card-img-holder"><img src="${img}" alt="${customCardData[idx].title} حلويات بوسي" loading="lazy"></div>
                <div class="perfection-card-info">
                    <h3 style="font-weight: 600 !important; color: #111111 !important;">${customCardData[idx].title}</h3>
                    <span class="perfection-card-price" style="font-weight: 700 !important; color: #FF91A4 !important;">${customCardData[idx].label}</span>
                </div>
            </a>
        `).join('');

        boseBuildAdvancedTouchTrack("excellence-slider-wrapper", "excellence-images-track", "excellence-dots");
    }

    function updateGlobalCartCounters() {
        const rawCart = localStorage.getItem(CART_STORAGE_KEY);
        const cart = rawCart ? JSON.parse(rawCart) : [];
        let totalItems = 0;
        
        cart.forEach(item => {
            if (item.type === "custom-cake" || item.type === "custom-flower" || item.type === "mini-cake" || (item.id && item.id.includes("-"))) {
                totalItems += 1;
            } else {
                totalItems += (parseInt(item.quantity, 10) || 1);
            }
        });

        const headerCounters = document.querySelectorAll('#nav-cart-count');
        headerCounters.forEach(counter => {
            counter.textContent = totalItems;
        });
    }

    window.refreshBoseGlobalCartUI = function () {
        updateGlobalCartCounters();
    };

    /* ==========================================================================\
       3. الحسابات المالية الاحترافية الصارمة وحظر الثغرات الحسابية والتضخم
       ========================================================================== */
    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        if (!boseGlobalStoreData) return basePrice;
        const rule = boseGlobalStoreData.store?.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return parseFloat((basePrice * (1 + (rule.percent / 100))).toFixed(4));
        }
        return basePrice;
    };

    window.calculateProductFinalPrice = function(product, selectedOptions) {
        const opts = selectedOptions || {};
        let price = product ? (product.price || product.basePrice || 0) : 0;

        if (product?.prices && opts.size) {
            price = product.prices[opts.size] || price;
        }

        const selectedPrinting = opts.printing || opts.printingType || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (product?.customizationOptions?.printing) {
                const printingOpt = product.customizationOptions.printing.options.find(opt => opt.id === selectedPrinting || opt.type === selectedPrinting);
                if (printingOpt) printingFee = printingOpt.price;
            }
            if (printingFee === 0) {
                printingFee = (selectedPrinting === 'edible' || selectedPrinting === 'صورة_صالحة_للأكل') ? 60 : 15;
            }
            price += printingFee;
        }
        return window.calculateBosePrice(price, "menu-only");
    };

    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;
        const opts = selectedOptions || {};
        const finalUnitPrice = window.calculateProductFinalPrice(product, opts);
        const isCustomizable = product.isMiniCake || product.type === "custom-cake" || product.type === "custom-flower" || (product.customizationOptions && Object.keys(opts).length > 0);
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}` : String(product.slug || product.id);
        
        return {
            id: finalId,
            productSlug: product.slug,
            title: product.title,
            flavorName: opts.flavorName || opts.cakeType || product.flavor || "افتراضي",
            basePrice: parseFloat((product.price || product.basePrice || 0).toFixed(4)),
            finalPrice: parseFloat(finalUnitPrice.toFixed(4)),
            quantity: parseInt(quantity, 10) || 1,
            image: product.image || "",
            type: product.type || "standard",
            customDetails: {
                cakeType: opts.cakeType || "فانيليا",
                shape: opts.shape || "circle",
                persons: parseInt(opts.persons, 10) || 0,
                printingType: opts.printingType || "none",
                customMessage: opts.customMessage || "",
                allergyNote: opts.allergyNote || ""
            }
        };
    };

    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") return isOptional;
        let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        return /^01[0125][0-9]{8}$/.test(cleaned);
    };

    window.validateBoseDeliverySchedule = function(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
        return (selectedDateTime - new Date(synchronizedTime)) / (1000 * 60 * 60) >= 23.95;
    };

    window.generateStrictProductCardHTML = function (product, currency = 'EGP') {
        if (!product) return '';
        const price = parseFloat(Number(product.price || 0).toFixed(4));
        const imgUrl = product.image || (product.images ? product.images[0] : '');
        
        return `
            <div class="product-card" data-slug="${product.slug}">
                <a href="product.html?slug=${product.slug}" class="bose-product-details-link" style="text-decoration: none; color: inherit;">
                    <div class="product-card-top">
                        <img src="${imgUrl}" alt="${product.title}" loading="lazy">
                    </div>
                    <div class="search-card-info-pane">
                        <h3 class="product-card-title">${product.title}</h3>
                        <span class="product-card-flavor-name">${product.flavorName || 'نكهة متميزة'}</span>
                        <p class="product-card-desc">${product.flavorDesc || ''}</p>
                        <div class="product-card-price">${price} ${currency}</div>
                    </div>
                </a>
                <div class="bose-qty-controller-box" style="display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,145,164,0.2); border-radius: 10px; padding: 2px; height: 36px; background: #FFFFFF; margin: 8px 0;">
                    <button class="qty-control-trigger minus" style="width:30px; height:100%; font-weight:700; cursor:pointer; background: none; border: none; color: #111111;">-</button>
                    <input type="text" class="qty-numerical-display" value="1" readonly style="width:30px; text-align:center; border:none; font-weight:700; background:transparent; color: #111111;">
                    <button class="qty-control-trigger plus" style="width:30px; height:100%; font-weight:700; cursor:pointer; background: none; border: none; color: #111111;">+</button>
                </div>
                <button class="bose-add-to-cart-btn btn-add-to-cart">إضافة للسلة</button>
            </div>
        `;
    };

    function initializeGlobalFeatures() {
        if (document.getElementById('categories-track')) renderBoseCategoriesSlider(boseGlobalStoreData);
        if (document.getElementById('pride-section')) runBoseStatsCounter(boseGlobalStoreData);
        if (document.getElementById('excellence-images-track')) initializeBosePrideSlider();
        
        // تفعيل السحب اللمسي جانباً للأكثر مبيعاً ووصل حديثاً على شاشات الموبايل لمنع الشلل الرأسي
        if (document.getElementById('most-selling-grid')) boseBuildAdvancedTouchTrack("most-selling-section", "most-selling-grid", "most-selling-dots");
        if (document.getElementById('new-arrivals-grid')) boseBuildAdvancedTouchTrack("new-arrivals-section", "new-arrivals-grid", "new-arrivals-dots");

        // 👑 عزل كامل لطبقة الخلفية البمبي للمحاكيات لحماية صور المنتجات الطبيعية 100%
        const interactiveSimulatorBlocks = document.querySelectorAll(".preview-builder-block, #cake-preview-section, #flower-preview-section");
        interactiveSimulatorBlocks.forEach(block => {
            let backdropLayer = block.querySelector(".bose-isolated-backdrop-framework");
            if (!backdropLayer) {
                backdropLayer = document.createElement("div");
                backdropLayer.className = "bose-isolated-backdrop-framework";
                backdropLayer.style.cssText = `position: absolute; top:0; left:0; width:100%; height:100%; background-color: ${BRAND_COLORS.pink}; z-index:1; pointer-events:none;`;
                block.insertBefore(backdropLayer, block.firstChild);
            }
            const internalStructureImg = block.querySelector("img");
            if (internalStructureImg) {
                internalStructureImg.style.cssText = `position: relative; z-index:2; display:block; background-color: transparent !important;`;
                internalStructureImg.setAttribute("data-isolated-framework", "true"); 
            }
        });
        
        updateGlobalCartCounters();
    }

    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) updateGlobalCartCounters();
    });

    loadBoseAbsoluteDatabase();
})();