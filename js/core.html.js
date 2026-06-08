(function () {
    // 1. المتغيرات العامة الأساسية داخل نطاق المحرك المغلق لضمان عدم التداخل
    window.BoseStoreData = null;
    const CART_STORAGE_KEY = 'bose_cart';
    const DATABASE_PATH = 'data/site-data-final.json';

    /**
     * 2. آلية الاستدعاء والاتصال الذكي مع خوارزمية الانتظار والتأمين الارتدادي (Exponential Backoff)
     * تقوم بالمحاولة حتى 5 مرات متتالية لمواجهة تذبذب اتصال الهواتف المحمولة
     */
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return; // منع جلب البيانات مجدداً لراحة المعالج

        let retryDelay = 1000; // يبدأ من ثانية واحدة
        const maxRetries = 5;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(DATABASE_PATH);
                if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
                
                window.BoseStoreData = await response.json();
                console.log("✔️ تم جلب قاعدة بيانات حلويات بوسي وتأمينها بنجاح في الذاكرة.");
                
                // تفعيل الميزات المشتركة فور تحميل البيانات واستقرارها
                applyGlobalSEOAndBranding();
                updateGlobalCartCounter();
                initializeGlobalUIEvents();
                return; // الخروج الفوري بعد النجاح

            } catch (error) {
                if (attempt === maxRetries) {
                    console.error("❌ فشل تحميل قاعدة البيانات بعد 5 محاولات:", error);
                    // عرض تنبيه راقٍ وودي للعميل بدلاً من التجميد أو استخدام alert()
                    showBoseToast("عذراً، نواجه ضغطاً خفيفاً في الشبكة. يرجى تحديث الصفحة لاستعراض حلوياتنا الفاخرة.");
                } else {
                    // الانتظار مع مضاعفة الوقت في كل محاولة (Exponential Backoff) دون إزعاج الكونسول باللوغات
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    retryDelay *= 2;
                }
            }
        }
    }

    /**
     * 3. دالة مراجعة وحساب الأسعار الحاكمة (The Core Pricing Equation)
     * تمنع الثغرات المالية بمطابقة نسبة الزيادة والتحقق من السياق المطبق
     * @param {number} basePrice - السعر الأساسي للمنتج
     * @param {string} context - سياق العرض (menu-only | all)
     * @returns {number} السعر النهائي مدوراً لأقرب رقم صحيح بالجنيه المصري
     */
    window.calculateBosePrice = function (basePrice, context = "menu-only") {
        if (!window.BoseStoreData || !window.BoseStoreData.store) return basePrice;
        
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled) {
            if (rule.applyOn === "all" || rule.applyOn === context) {
                return Math.round(basePrice * (1 + (rule.percent / 100)));
            }
        }
        return basePrice;
    };

    /**
     * 4. تطبيق معايير السيو (SEO) والهوية البصرية القياسية الموحدة لجميع الصفحات
     */
    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;

        // أ. تحديث عنوان التبويب إذا كان يطابق العنوان الافتراضي للمتصفح
        if (document.title === "" || document.title === "Document" || document.title.includes("localhost") || document.title.includes("127.0.0.1")) {
            document.title = data.seo.title;
        }

        // ب. حقن ووصف محرك البحث وميتا الأوبن غراف برمجياً لحفظ السيو
        ensureMetaTag("description", data.seo.description);
        ensureMetaTag("keywords", data.seo.keywords.join(", "));
        ensureMetaTag("og:title", data.seo.title, true);
        ensureMetaTag("og:description", data.seo.description, true);
        ensureMetaTag("og:image", data.seo.ogImage, true);
        ensureMetaTag("og:url", window.location.href, true);

        // ج. سحب وتحديث لوجو حلويات بوسي في الهيدر والفوتر والصفحات تلقائياً
        const logoElements = document.querySelectorAll("img#bose-store-logo");
        logoElements.forEach(img => {
            if (img.src !== data.store.logo) {
                img.src = data.store.logo;
                img.alt = data.store.name;
                img.loading = "lazy";
            }
        });

        // د. حقن نبذة الفوتر التعريفية الموحدة
        const footerAbout = document.getElementById("footer-about-text");
        if (footerAbout) {
            footerAbout.textContent = data.footer.about;
        }

        // هـ. تهيئة وتحديث روابط التواصل الاجتماعي الموثقة بالـ JSON
        updateSocialLinks(data.social);
    }

    /**
     * دالة مساعدة لضمان وجود حقول الميتا وصحتها لمنع التكرار والتكرير العشوائي
     */
    function ensureMetaTag(name, content, isProperty = false) {
        const attributeName = isProperty ? "property" : "name";
        let meta = document.querySelector(`meta[${attributeName}="${name}"]`);
        if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute(attributeName, name);
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
    }

    /**
     * دالة تحديث أزرار وروابط قنوات التواصل الاجتماعي في جميع الصفحات
     */
    function updateSocialLinks(socialData) {
        const facebookBtn = document.querySelector(".social-link-facebook");
        const instagramBtn = document.querySelector(".social-link-instagram");
        const tiktokBtn = document.querySelector(".social-link-tiktok");
        const whatsappBtn = document.querySelector(".social-link-whatsapp");

        if (facebookBtn && socialData.facebook) facebookBtn.href = socialData.facebook;
        if (instagramBtn && socialData.instagram) instagramBtn.href = socialData.instagram;
        if (tiktokBtn && socialData.tiktok) tiktokBtn.href = socialData.tiktok;
        if (whatsappBtn && socialData.whatsapp) {
            whatsappBtn.href = `https://wa.me/${socialData.whatsapp}`;
        }
    }

    /**
     * 5. تحديث عداد السلة الصغير في الهيدر (Shared Header Cart Counter Update)
     */
    window.updateGlobalCartCounter = function () {
        const cartCountBadge = document.getElementById("nav-cart-count");
        if (!cartCountBadge) return;

        try {
            const rawCart = localStorage.getItem(CART_STORAGE_KEY);
            const cart = rawCart ? JSON.parse(rawCart) : [];
            const totalItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
            
            cartCountBadge.textContent = totalItemsCount;
            
            // إضافة تأثير نبض بصري خفيف وجاذب للعين عند تحديث السلة
            if (totalItemsCount > 0) {
                cartCountBadge.style.transform = "scale(1.25)";
                setTimeout(() => {
                    cartCountBadge.style.transform = "scale(1)";
                }, 200);
            }
        } catch (e) {
            console.error("❌ فشل في قراءة أو تحديث عداد السلة من الذاكرة المحلية:", e);
        }
    };

    /**
     * 6. إدارة وتحديث مصفوفة السلة الموحدة (Shared Cart Business Logic)
     */
    window.getBoseCart = function () {
        try {
            const rawCart = localStorage.getItem(CART_STORAGE_KEY);
            return rawCart ? JSON.parse(rawCart) : [];
        } catch (e) {
            console.error("❌ فشل جلب السلة من الذاكرة المحلية:", e);
            return [];
        }
    };

    window.saveBoseCart = function (cart) {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
            window.updateGlobalCartCounter();
            
            // بث حدث مخصص لتحديث البيانات في الصفحات المفتوحة بالتوازي
            window.dispatchEvent(new Event('bose_cart_updated'));
        } catch (e) {
            console.error("❌ فشل حفظ السلة في الذاكرة المحلية:", e);
            showBoseToast("عذراً، امتلاء ذاكرة المتصفح يمنع حفظ سلتك بشكل صحيح.");
        }
    };

    /**
     * إضافة منتج جديد أو زيادة كمية منتج موجود مع التحقق الصارم من التماثل والتطابق
     * @param {Object} newItem - كائن المنتج الجديد بخصائصه وتفاصيل تخصيصه الكاملة
     */
    window.addBoseCartItem = function (newItem) {
        const cart = window.getBoseCart();

        // فحص التماثل الدقيق (التطابق التام للمنتجات المخصصة أو العادية)
        const existingItemIndex = cart.findIndex(item => {
            if (item.id === newItem.id) return true;
            if (item.productSlug === newItem.productSlug && item.flavorName === newItem.flavorName && item.type === newItem.type) {
                // للمنتجات المخصصة: مقارنة حقول تفاصيل التخصيص بدقة
                if (item.type !== "standard") {
                    return JSON.stringify(item.customDetails) === JSON.stringify(newItem.customDetails);
                }
                return true;
            }
            return false;
        });

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += newItem.quantity;
        } else {
            cart.push(newItem);
        }

        window.saveBoseCart(cart);
        showBoseToast(`تمت إضافة ${newItem.title} إلى السلة 🌸`);
    };

    /**
     * تعديل كمية منتج محدد داخل السلة
     */
    window.updateBoseCartItemQuantity = function (itemId, newQuantity) {
        let cart = window.getBoseCart();
        const itemIndex = cart.findIndex(item => item.id === itemId);

        if (itemIndex > -1) {
            if (newQuantity <= 0) {
                cart.splice(itemIndex, 1); // الحذف الفوري إذا كانت الكمية صفر أو أقل
                showBoseToast("تمت إزالة المنتج من السلة.");
            } else {
                cart[itemIndex].quantity = newQuantity;
            }
            window.saveBoseCart(cart);
        }
    };

    /**
     * حذف منتج محدد تماماً من السلة
     */
    window.removeBoseCartItem = function (itemId) {
        let cart = window.getBoseCart();
        const updatedCart = cart.filter(item => item.id !== itemId);
        window.saveBoseCart(updatedCart);
    };

    /**
     * مسح وإفراغ السلة بالكامل
     */
    window.clearBoseCart = function () {
        localStorage.removeItem(CART_STORAGE_KEY);
        window.updateGlobalCartCounter();
        window.dispatchEvent(new Event('bose_cart_updated'));
    };

    /**
     * 7. نظام التنبيهات المخصص (Bose Toast Alert System)
     * يمنع استخدام alert() في بيئة الـ iframe والإنتاج لضمان فخامة وانسيابية كاملة
     * @param {string} message - نص التنبيه
     */
    window.showBoseToast = function (message) {
        let toastContainer = document.querySelector(".bose-toast-container");
        if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.className = "bose-toast-container";
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement("div");
        toast.className = "bose-toast";
        toast.innerHTML = `
            <i class="fas fa-magic"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // تشغيل الحركة بعد جزء من الثانية ليعطي سلاسة بصرية
        setTimeout(() => {
            toast.classList.add("active");
        }, 50);

        // الإخفاء والحذف التلقائي الآمن بعد 3.5 ثوانٍ
        setTimeout(() => {
            toast.classList.remove("active");
            setTimeout(() => {
                toast.remove();
                if (toastContainer.childNodes.length === 0) {
                    toastContainer.remove();
                }
            }, 300);
        }, 3500);
    };

    /**
     * 8. تهيئة وتفعيل تفاعلات واجهات الاستخدام العامة والثابتة (DOM Events Setup)
     * تشمل: فتح وإغلاق القائمة الجانبية، تفعيل البحث العالمي الفوري والحي، وإغلاق البحث
     */
    function initializeGlobalUIEvents() {
        // أ. تفعيل القائمة الجانبية التفاعلية (Drawer Navigation)
        const menuToggleBtn = document.querySelector(".nav-menu-toggle");
        const drawerMenu = document.querySelector(".bose-drawer-menu");
        
        // التحقق من وجود طبقة الحماية وتوليدها إذا كانت غير موجودة في الـ HTML لمنع تكرار الهيكل
        let drawerOverlay = document.querySelector(".drawer-overlay");
        if (!drawerOverlay && drawerMenu) {
            drawerOverlay = document.createElement("div");
            drawerOverlay.className = "drawer-overlay";
            document.body.appendChild(drawerOverlay);
        }

        if (menuToggleBtn && drawerMenu && drawerOverlay) {
            const toggleDrawer = () => {
                const isActive = drawerMenu.classList.toggle("active");
                menuToggleBtn.classList.toggle("active");
                drawerOverlay.classList.toggle("active", isActive);
                
                // منع حركة صفحة الموقع في الخلفية عند فتح الدرج الجانبي
                document.body.style.overflow = isActive ? "hidden" : "initial";
            };

            // إزالة المستمعات القديمة لمنع تكرار تنفيذ الأحداث والتعليق
            menuToggleBtn.replaceWith(menuToggleBtn.cloneNode(true));
            drawerOverlay.replaceWith(drawerOverlay.cloneNode(true));

            const newToggleBtn = document.querySelector(".nav-menu-toggle");
            const newOverlay = document.querySelector(".drawer-overlay");

            newToggleBtn.addEventListener("click", toggleDrawer);
            newOverlay.addEventListener("click", toggleDrawer);
        }

        // ب. تفعيل محرك البحث الفوري الفاخر (Global Instant Search Engine)
        const searchTriggerBtn = document.querySelector(".nav-search-trigger");
        const searchModal = document.querySelector(".bose-search-modal");
        
        if (searchTriggerBtn && searchModal) {
            const toggleSearchModal = (show) => {
                searchModal.classList.toggle("active", show);
                document.body.style.overflow = show ? "hidden" : "initial";
                
                if (show) {
                    const searchInput = document.getElementById("global-search-input");
                    if (searchInput) {
                        searchInput.value = "";
                        searchInput.focus();
                    }
                    renderSearchResults(""); // تفريغ النتائج المبدئية
                }
            };

            searchTriggerBtn.addEventListener("click", () => toggleSearchModal(true));

            const searchCloseBtn = searchModal.querySelector(".search-close-btn");
            if (searchCloseBtn) {
                searchCloseBtn.addEventListener("click", () => toggleSearchModal(false));
            }

            // إغلاق البحث بمفتاح Escape لسهولة تصفح مستخدمي الكمبيوتر
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && searchModal.classList.contains("active")) {
                    toggleSearchModal(false);
                }
            });

            // الاستماع لحقل الإدخال للبحث اللحظي
            const searchInput = document.getElementById("global-search-input");
            if (searchInput) {
                searchInput.addEventListener("input", (e) => {
                    const query = e.target.value.trim().toLowerCase();
                    renderSearchResults(query);
                });
            }
        }
    }

    /**
     * 9. فلترة وعرض نتائج البحث الفوري في الوقت الفعلي
     * تبحث في العناوين، أسماء النكهات، الوصف، وكلمات السيو المساعدة
     */
    function renderSearchResults(query) {
        const resultsContainer = document.querySelector(".search-results-container");
        if (!resultsContainer) return;

        if (!query) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--bose-black); opacity: 0.5;">
                    <i class="fas fa-search" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--bose-pink);"></i>
                    <p style="font-size: 1rem; font-weight: 500;">اكتب اسم صنفك المفضل للبحث السريع عنه...</p>
                </div>
            `;
            return;
        }

        const data = window.BoseStoreData;
        if (!data || !data.products) return;

        // فلترة دقيقة ومتطورة لتوليف متوافق وسريع للنتائج
        const matchedProducts = data.products.filter(product => {
            const inTitle = product.title.toLowerCase().includes(query);
            const inFlavor = product.flavorName.toLowerCase().includes(query);
            const inDesc = product.description.toLowerCase().includes(query);
            const inSearchTerms = product.searchTerms && product.searchTerms.some(term => term.toLowerCase().includes(query));
            
            return inTitle || inFlavor || inDesc || inSearchTerms;
        });

        if (matchedProducts.length === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--bose-black); opacity: 0.6;">
                    <i class="fas fa-cookie-bite" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--bose-pink); opacity: 0.3;"></i>
                    <p style="font-size: 1rem; font-weight: 600;">لم نجد أصناف متطابقة مع "${query}"</p>
                    <p style="font-size: 0.85rem; opacity: 0.8; margin-top: 4px;">جرب كتابة كلمات بسيطة مثل: لوتس، كب كيك، بوكس، تورتة...</p>
                </div>
            `;
            return;
        }

        // بناء كروت نتائج البحث وعرض السعر النهائي بعد احتساب الزيادة
        let htmlResults = `<div class="search-results-grid">`;
        
        matchedProducts.forEach(product => {
            const finalPrice = window.calculateBosePrice(product.price, "menu-only");
            
            htmlResults += `
                <a href="product.html?slug=${product.slug}" class="search-result-card" style="display: flex; gap: 16px; padding: 12px; border-radius: 16px; border: var(--bose-border-pink); background: var(--bose-white); transition: var(--bose-transition-smooth); align-items: center; text-decoration: none; color: inherit; box-shadow: var(--bose-shadow-glow);">
                    <img src="${product.images[0]}" alt="${product.title}" style="width: 70px; height: 70px; border-radius: 12px; object-fit: cover; flex-shrink: 0;" onerror="this.src='https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png'">
                    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--bose-black); line-height: 1.3;">${product.title}</h4>
                        <span style="font-size: 0.8rem; font-weight: 600; color: var(--bose-pink);">${product.flavorName}</span>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <span class="bose-price-text" style="font-size: 0.95rem; font-weight: 700;">${finalPrice} ${data.store.currency}</span>
                            <span style="font-size: 0.75rem; background: var(--bose-cream); padding: 2px 8px; border-radius: 8px; color: var(--bose-black); opacity: 0.7; font-weight: 600;">استعراض 🌸</span>
                        </div>
                    </div>
                </a>
            `;
        });

        htmlResults += `</div>`;
        resultsContainer.innerHTML = htmlResults;

        // إضافة تأثير تفاعلي خفيف لبطاقات نتائج البحث عند التحويم بالماوس
        const cards = resultsContainer.querySelectorAll(".search-result-card");
        cards.forEach(card => {
            card.addEventListener("mouseenter", () => {
                card.style.transform = "translateY(-2px)";
                card.style.borderColor = "var(--bose-pink)";
                card.style.boxShadow = "var(--bose-shadow-hover)";
            });
            card.addEventListener("mouseleave", () => {
                card.style.transform = "translateY(0)";
                card.style.borderColor = "rgba(255, 145, 164, 0.3)";
                card.style.boxShadow = "var(--bose-shadow-glow)";
            });
        });
    }

    // 10. إيقاظ المحرك وبدء العمل الفعلي فور استقرار شجرة الـ DOM
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadStoreDatabase);
    } else {
        loadStoreDatabase();
    }
})();

