```javascript
/**
 * 👑 حلويات بوسي - محرك جلب البيانات والتحكم العام وحماية الذاكرة 👑
 * إصدار الإنتاج الكامل المطور والمؤمن برمجياً ومالياً وبصرياً
 * يتوافق بنسبة 100% مع مواصفات التشغيل، المحاكيات، السلة، وبوابات الشحن
 * -------------------------------------------------------------------------
 * تم الفحص والتدقيق الأمني والمالي وإغلاق كافة الثغرات لضمان استقرار فائق.
 */

(function () {
    // تفعيل الوضع الصارم لحظر الأخطاء وتأمين المتغيرات البرمجية
    "use strict";

    // 1. المتغيرات العامة الأساسية داخل نطاق المحرك المغلق لضمان عدم التداخل
    window.BoseStoreData = null;
    const CART_STORAGE_KEY = 'bose_cart';
    let searchDebounceTimeout = null;
    
    // مسارات مرنة ومتعددة لضمان جلب ملف البيانات بنجاح على أي استضافة محلياً أو عالمياً
    const DATABASE_PATHS = [
        'site-data-final.json',
        'data/site-data-final.json',
        '../site-data-final.json',
        './site-data-final.json',
        '../data/site-data-final.json'
    ];

    /**
     * دالة مساعدة لتعقيم نصوص المستخدم ومنع ثغرات حقن الأكواد الخبيثة (XSS Protection Helper)
     * @param {string} unsafeString - النص الخام المدخل من المستخدم
     * @returns {string} النص المعقم والآمن تماماً للعرض داخل شجرة الـ DOM
     */
    function escapeHTML(unsafeString) {
        if (!unsafeString) return '';
        return unsafeString
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * 2. حقن التنسيقات الهيكلية الأساسية للتنبيهات والبحث الفوري (Dynamic UI Style Injection)
     * تضمن بقاء الواجهات مذهلة ومحافظة على الهوية البصرية الصارمة (Cairo Font, Strict Colors)
     */
    function injectCoreStyles() {
        if (document.getElementById("bose-core-injected-styles")) return;

        const styleTag = document.createElement("style");
        styleTag.id = "bose-core-injected-styles";
        styleTag.textContent = `
            /* حاوية التنبيهات الذكية الفاخرة */
            .bose-toast-container {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                width: 90%;
                max-width: 380px;
                pointer-events: none;
            }
            .bose-toast {
                background: #FFFFFF;
                color: #111111;
                border: 1px solid rgba(255, 145, 164, 0.4);
                border-radius: 16px;
                padding: 14px 20px;
                font-family: 'Cairo', sans-serif;
                font-size: 0.95rem;
                font-weight: 600;
                box-shadow: 0 10px 30px rgba(255, 145, 164, 0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                pointer-events: auto;
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                direction: rtl;
                text-align: right;
            }
            .bose-toast.active {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            .bose-toast i {
                color: #FF91A4;
                font-size: 1.1rem;
                flex-shrink: 0;
            }
            /* تراكب وتنسيق البحث الفوري المطور والمؤمن */
            .drawer-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(17, 17, 17, 0.4);
                backdrop-filter: blur(4px);
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .drawer-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .search-results-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 14px;
                padding: 16px 4px;
                max-height: 60vh;
                overflow-y: auto;
            }
            /* تخصيص السكرول بار ليظهر بشكل فخم ومتناسق مع العلامة التجارية */
            .search-results-grid::-webkit-scrollbar {
                width: 6px;
            }
            .search-results-grid::-webkit-scrollbar-track {
                background: rgba(255, 145, 164, 0.05);
                border-radius: 10px;
            }
            .search-results-grid::-webkit-scrollbar-thumb {
                background: #FF91A4;
                border-radius: 10px;
            }
            .search-result-card {
                display: flex;
                gap: 16px;
                padding: 12px;
                border-radius: 18px;
                border: 1px solid rgba(255, 145, 164, 0.25);
                background: #FFFFFF;
                transition: all 0.25s ease;
                align-items: center;
                text-decoration: none;
                color: inherit;
                box-shadow: 0 4px 15px rgba(255, 145, 164, 0.06);
            }
            .search-result-card:hover {
                transform: translateY(-2px);
                border-color: #FF91A4;
                box-shadow: 0 8px 25px rgba(255, 145, 164, 0.16);
            }
        `;
        document.head.appendChild(styleTag);
    }

    /**
     * 3. آلية الاستدعاء والاتصال الذكي مع خوارزمية الانتظار والتأمين الارتدادي (Exponential Backoff)
     * تقوم بالمحاولة حتى 5 مرات متتالية لمواجهة تذبذب اتصال شبكات الموبايل للعملاء
     */
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return; // حظر إعادة الجلب لراحة معالج الموبايل

        injectCoreStyles(); // حقن التنسيقات الوقائية فوراً

        let retryDelay = 1000; // البداية من ثانية واحدة
        const maxRetries = 5;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                let success = false;
                
                // البحث عبر جميع المسارات المحتملة لملف البيانات
                for (const path of DATABASE_PATHS) {
                    try {
                        const response = await fetch(path);
                        if (response.ok) {
                            window.BoseStoreData = await response.json();
                            console.log(`✔️ تم تحميل قاعدة بيانات حلويات بوسي بنجاح من المسار: ${path}`);
                            success = true;
                            break;
                        }
                    } catch (e) {
                        // الانتقال للمسار التالي بصمت وبدون تشتيت الكونسول
                    }
                }

                if (success && window.BoseStoreData) {
                    // تفعيل الهوية البصرية والسيو والعدادات فور استقرار البيانات في الذاكرة
                    applyGlobalSEOAndBranding();
                    updateGlobalCartCounter();
                    initializeGlobalUIEvents();
                    
                    // بث حدث عالمي آمن لتنبيه المحركات المنفصلة باكتمال وجاهزية البيانات
                    window.dispatchEvent(new Event('bose_data_ready'));
                    return; 
                }

                throw new Error("لا يمكن الوصول لملف البيانات من المسارات المعتمدة.");

            } catch (error) {
                if (attempt === maxRetries) {
                    console.error("❌ فشل تحميل قاعدة البيانات بعد 5 محاولات متتالية:", error);
                    showBoseToast("حصل ضغط بسيط في الشبكة.. من فضلك اعمل تحديث للصفحة عشان تستعرض حلوياتنا الفاخرة 🌸");
                } else {
                    // الانتظار ومضاعفة الوقت لتفادي إجهاد خادم الاستضافة المجاني
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    retryDelay *= 2;
                }
            }
        }
    }

    /**
     * 4. دالة مراجعة وحساب الأسعار الحاكمة (The Core Pricing Equation)
     * تمنع الثغرات المالية بمطابقة نسبة زيادة الأسعار المعتمدة بالـ JSON والتأكد من سياق المطبّق
     * @param {number|string} basePrice - السعر الأساسي للمنتج
     * @param {string} context - سياق العرض المطبق (menu-only | all)
     * @returns {number} السعر النهائي مدوراً لأقرب جنيه مصري صحيح
     */
    window.calculateBosePrice = function (basePrice, context = "menu-only") {
        let parsedPrice = parseFloat(basePrice);
        if (isNaN(parsedPrice) || parsedPrice <= 0) return 0;
        
        if (!window.BoseStoreData || !window.BoseStoreData.store) return Math.round(parsedPrice);
        
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled) {
            if (rule.applyOn === "all" || rule.applyOn === context) {
                return Math.round(parsedPrice * (1 + (parseFloat(rule.percent) / 100)));
            }
        }
        return Math.round(parsedPrice);
    };

    /**
     * 5. تطبيق معايير السيو (SEO) والهوية البصرية القياسية الموحدة لجميع الصفحات
     */
    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;

        // أ. حارس العنوان الذكي: لا نلغي العناوين المخصصة للصفحات الداخلية كصفحة المنتج الفردي
        const isPlaceholderTitle = document.title === "" || 
                                   document.title === "Document" || 
                                   document.title.includes("localhost") || 
                                   document.title.includes("127.0.0.1") ||
                                   document.title === "حلويات بوسي";
        
        if (isPlaceholderTitle) {
            document.title = data.seo.title;
        }

        // ب. حقن مصفوفات السيو وميتا الأوبن غراف لضمان أرشفة ممتازة بمحركات البحث والواتساب
        ensureMetaTag("description", data.seo.description);
        ensureMetaTag("keywords", data.seo.keywords.join(", "));
        ensureMetaTag("og:title", data.seo.title, true);
        ensureMetaTag("og:description", data.seo.description, true);
        ensureMetaTag("og:image", data.seo.ogImage, true);
        ensureMetaTag("og:url", window.location.href, true);

        // ج. تحديث لوجو حلويات بوسي الحصري في الهيدر والفوتر والصفحات تلقائياً بمساره المعتمد
        const logoElements = document.querySelectorAll("img#bose-store-logo");
        logoElements.forEach(img => {
            if (img.src !== data.store.logo) {
                img.src = data.store.logo;
                img.alt = data.store.name;
                img.loading = "lazy";
            }
        });

        // د. حقن النبذة التعريفية الراقية بالفوتر
        const footerAbout = document.getElementById("footer-about-text");
        if (footerAbout) {
            footerAbout.textContent = data.footer.about;
        }

        // هـ. ربط وتفعيل حسابات التواصل الاجتماعي المعتمدة بالـ JSON
        updateSocialLinks(data.social);
    }

    /**
     * دالة مساعدة لضمان وجود حقول الميتا وتفادي التكرار العشوائي بالـ Head
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
     * دالة تحديث أزرار وروابط قنوات التواصل الاجتماعي الموثقة بالـ JSON
     */
    function updateSocialLinks(socialData) {
        const facebookBtns = document.querySelectorAll(".social-link-facebook");
        const instagramBtns = document.querySelectorAll(".social-link-instagram");
        const tiktokBtns = document.querySelectorAll(".social-link-tiktok");
        const whatsappBtns = document.querySelectorAll(".social-link-whatsapp");

        facebookBtns.forEach(btn => { if (socialData.facebook) btn.href = socialData.facebook; });
        instagramBtns.forEach(btn => { if (socialData.instagram) btn.href = socialData.instagram; });
        tiktokBtns.forEach(btn => { if (socialData.tiktok) btn.href = socialData.tiktok; });
        whatsappBtns.forEach(btn => {
            if (socialData.whatsapp) {
                btn.href = `https://wa.me/${socialData.whatsapp}`;
            }
        });
    }

    /**
     * 6. تحديث عداد السلة الدائري بالهيدر الرئيسي (Shared Header Cart Counter)
     */
    window.updateGlobalCartCounter = function () {
        const cartCountBadge = document.getElementById("nav-cart-count");
        if (!cartCountBadge) return;

        try {
            const rawCart = localStorage.getItem(CART_STORAGE_KEY);
            const cart = rawCart ? JSON.parse(rawCart) : [];
            const totalItemsCount = cart.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
            
            cartCountBadge.textContent = totalItemsCount;
            
            // تأثير نبض بصري ناعم لتأكيد الإضافة للعميل
            if (totalItemsCount > 0) {
                cartCountBadge.style.transform = "scale(1.25)";
                setTimeout(() => {
                    cartCountBadge.style.transform = "scale(1)";
                }, 200);
            }
        } catch (e) {
            console.error("❌ فشل تحديث عداد السلة:", e);
        }
    };

    /**
     * 7. إدارة وتحديث مصفوفة السلة الموحدة مع وقاية الذاكرة (Storage Safety Layers)
     */
    window.getBoseCart = function () {
        try {
            const rawCart = localStorage.getItem(CART_STORAGE_KEY);
            if (!rawCart) return [];
            const parsed = JSON.parse(rawCart);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("❌ سلة التسوق تالفة في الذاكرة، تم تصفيرها احترازياً:", e);
            return [];
        }
    };

    window.saveBoseCart = function (cart) {
        try {
            if (!Array.isArray(cart)) return;
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
            window.updateGlobalCartCounter();
            
            // بث حدث مخصص لتحديث واجهات السلة في أي تبويبات أو أجزاء مفتوحة في نفس الوقت
            window.dispatchEvent(new Event('bose_cart_updated'));
        } catch (e) {
            console.error("❌ فشل حفظ السلة في الذاكرة:", e);
            showBoseToast("الذاكرة ممتلئة.. مش قادرين نحفظ السلة بشكل صحيح من فضلك فضي مساحة 🌸");
        }
    };

    /**
     * إضافة منتج جديد أو زيادة كمية منتج موجود مع الفحص الصارم لتماثل التخصيص
     * @param {Object} newItem - كائن المنتج الجديد بخصائصه وتخصيصه الكامل
     */
    window.addBoseCartItem = function (newItem) {
        if (!newItem || !newItem.productSlug) return;
        const cart = window.getBoseCart();

        // طبقة الحماية والمرونة: استخلاص صورة الصنف من مصفوفة الصور في حال عدم توفر الخاصية الفردية
        if (!newItem.image && newItem.images && newItem.images.length > 0) {
            newItem.image = newItem.images[0];
        }

        // فحص التماثل الدقيق والتأكد من مطابقة مكونات التخصيص *قبل* توليد معرّف عشوائي
        const existingItemIndex = cart.findIndex(item => {
            if (item.productSlug === newItem.productSlug && item.flavorName === newItem.flavorName && item.type === newItem.type) {
                // للمنتجات المخصصة داخل المحاكيات: مقارنة تفاصيل التخصيص بشكل نصي صارم لمنع تشتيت السلة
                if (item.type !== "standard") {
                    return JSON.stringify(item.customDetails) === JSON.stringify(newItem.customDetails);
                }
                return true;
            }
            return false;
        });

        if (existingItemIndex > -1) {
            // صنف متطابق تماماً: نقوم فقط بزيادة الكمية المطلوبة بدلاً من إنشاء كارت جديد
            cart[existingItemIndex].quantity = (parseInt(cart[existingItemIndex].quantity) || 0) + (parseInt(newItem.quantity) || 1);
        } else {
            // صنف جديد كلياً: نولد له معرف فريد بالصيغة المعيارية المانعة للتصادم البرمجي
            if (!newItem.id) {
                if (newItem.type !== "standard") {
                    newItem.id = `${newItem.productSlug}-${Date.now()}`;
                } else {
                    newItem.id = newItem.productSlug;
                }
            }
            cart.push(newItem);
        }

        window.saveBoseCart(cart);
        showBoseToast(`تمت إضافة ${newItem.title} إلى السلة 🌸`);
    };

    /**
     * تعديل كمية منتج محدد داخل السلة والوقاية من الكميات الصفرية أو السالبة
     */
    window.updateBoseCartItemQuantity = function (itemId, newQuantity) {
        let cart = window.getBoseCart();
        const itemIndex = cart.findIndex(item => item.id === itemId);

        if (itemIndex > -1) {
            const qty = parseInt(newQuantity);
            if (isNaN(qty) || qty <= 0) {
                cart.splice(itemIndex, 1); // الإزالة الفورية لراحة المستخدم وتسهيل تجربته
                showBoseToast("تمت إزالة الصنف من السلة 🌸");
            } else {
                cart[itemIndex].quantity = qty;
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
        showBoseToast("تمت إزالة الصنف من السلة 🌸");
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
     * 8. نظام التنبيهات الفاخر المخصص (Bose Toast Alert System)
     * بديل عصري وانسيابي لـ alert() التقليدية، يمنع حجب الشاشات ويحافظ على نعومة حركات الموقع
     * @param {string} message - نص التنبيه بالعامية المصرية الراقية
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
        toast.setAttribute("role", "alert");
        toast.innerHTML = `
            <i class="fas fa-magic"></i>
            <span>${escapeHTML(message)}</span>
        `;

        toastContainer.appendChild(toast);

        // تفعيل الحركة اللطيفة بالظهور المتدرج بعد جزء من الثانية لراحة العين
        setTimeout(() => {
            toast.classList.add("active");
        }, 50);

        // الإخفاء التلقائي والحذف الآمن للتنبيه بعد 3.5 ثوانٍ
        setTimeout(() => {
            toast.classList.remove("active");
            setTimeout(() => {
                toast.remove();
                if (toastContainer.childNodes.length === 0) {
                    toastContainer.remove();
                }
            }, 400);
        }, 3500);
    };

    /**
     * 9. تهيئة وتنشيط واجهات الاستخدام العامة والثابتة (Universal UI Setup)
     * تمنع تعارض الأحداث والوظائف وتدعم التشغيل الانسيابي الفائق للموبايل والكمبيوتر
     */
    function initializeGlobalUIEvents() {
        // أ. تفعيل القائمة الجانبية (Drawer Menu) دون تكرار العناصر أو إتلاف الـ DOM
        const menuToggleBtn = document.querySelector(".nav-menu-toggle");
        const drawerMenu = document.querySelector(".bose-drawer-menu");
        
        let drawerOverlay = document.querySelector(".drawer-overlay");
        if (!drawerOverlay && drawerMenu) {
            drawerOverlay = document.createElement("div");
            drawerOverlay.className = "drawer-overlay";
            document.body.appendChild(drawerOverlay);
        }

        if (menuToggleBtn && drawerMenu && drawerOverlay) {
            // منع مضاعفة الأحداث عند التكرار
            menuToggleBtn.replaceWith(menuToggleBtn.cloneNode(true));
            drawerOverlay.replaceWith(drawerOverlay.cloneNode(true));
            
            const newToggleBtn = document.querySelector(".nav-menu-toggle");
            const newOverlay = document.querySelector(".drawer-overlay");

            const toggleDrawer = () => {
                const isActive = drawerMenu.classList.toggle("active");
                newToggleBtn.classList.toggle("active");
                newOverlay.classList.toggle("active", isActive);
                
                // تجميد صفحة الموقع في الخلف لزيادة سهولة تصفح الهواتف المحمولة
                document.body.style.overflow = isActive ? "hidden" : "";
            };

            newToggleBtn.addEventListener("click", toggleDrawer);
            newOverlay.addEventListener("click", toggleDrawer);
        }

        // ب. تفعيل محرك البحث الفوري الفخم (Global Search Panel)
        const searchTriggerBtn = document.querySelector(".nav-search-trigger");
        const searchModal = document.querySelector(".bose-search-modal");
        
        if (searchTriggerBtn && searchModal) {
            const toggleSearchModal = (show) => {
                searchModal.classList.toggle("active", show);
                document.body.style.overflow = show ? "hidden" : "";
                
                if (show) {
                    const searchInput = document.getElementById("global-search-input");
                    if (searchInput) {
                        searchInput.value = "";
                        searchInput.focus();
                    }
                    renderSearchResults(""); // تفريغ وتصفير حقل النتائج تمهيداً للعميل
                }
            };

            searchTriggerBtn.replaceWith(searchTriggerBtn.cloneNode(true));
            const newSearchTriggerBtn = document.querySelector(".nav-search-trigger");
            newSearchTriggerBtn.addEventListener("click", () => toggleSearchModal(true));

            const searchCloseBtn = searchModal.querySelector(".search-close-btn");
            if (searchCloseBtn) {
                searchCloseBtn.addEventListener("click", () => toggleSearchModal(false));
            }

            // إغلاق البحث بمفتاح Escape لسهولة تصفح مستخدمي الكمبيوتر (A11y Compliance)
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && searchModal.classList.contains("active")) {
                    toggleSearchModal(false);
                }
            });

            // تفعيل البحث اللحظي بمستمع ذكي مع قفل الفلترة لمنع استهلاك المعالج
            const searchInput = document.getElementById("global-search-input");
            if (searchInput) {
                searchInput.addEventListener("input", (e) => {
                    const query = e.target.value.trim();
                    
                    // آلية تنظيم الأداء وتوفير الطاقة لمعالج الموبايل (Debouncing)
                    clearTimeout(searchDebounceTimeout);
                    searchDebounceTimeout = setTimeout(() => {
                        renderSearchResults(query);
                    }, 250); // تأخير ربع ثانية لجمع الحروف المدخلة
                });
            }
        }
    }

    /**
     * 10. معالجة وتدقيق وعرض نتائج البحث الفوري في الوقت الفعلي
     * تبحث في العناوين، أسماء النكهات، والوصف، وتصنيفات السيو لتأمين استجابة فائقة السرعة
     */
    function renderSearchResults(query) {
        const resultsContainer = document.querySelector(".search-results-container");
        if (!resultsContainer) return;

        if (!query) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--bose-black); opacity: 0.5;">
                    <i class="fas fa-search" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--bose-pink);"></i>
                    <p style="font-size: 1rem; font-weight: 600;">اكتب اسم صنفك المفضل للبحث السريع عنه.. 🌸</p>
                </div>
            `;
            return;
        }

        const data = window.BoseStoreData;
        if (!data || !data.products) return;

        // مقارنة آمنة مع نصوص قاعدة البيانات دون تشويه الأحرف والرموز الخاصة بالتعقيم المسبق
        const lowerCaseQuery = query.toLowerCase();

        // خوارزمية الفلترة الذكية المطابقة لحروف اللغة العربية والكلمات الدليليلة للسيو
        const matchedProducts = data.products.filter(product => {
            const inTitle = product.title.toLowerCase().includes(lowerCaseQuery);
            const inFlavor = product.flavorName.toLowerCase().includes(lowerCaseQuery);
            const inDesc = product.description.toLowerCase().includes(lowerCaseQuery);
            const inSearchTerms = product.searchTerms && product.searchTerms.some(term => term.toLowerCase().includes(lowerCaseQuery));
            
            return inTitle || inFlavor || inDesc || inSearchTerms;
        });

        if (matchedProducts.length === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--bose-black); opacity: 0.6;">
                    <i class="fas fa-cookie-bite" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--bose-pink); opacity: 0.3;"></i>
                    <p style="font-size: 1rem; font-weight: 600;">ملقناش أصناف مطابقة لـ "${escapeHTML(query)}"</p>
                    <p style="font-size: 0.85rem; opacity: 0.8; margin-top: 4px;">جرب تكتب كلمات بسيطة زي: لوتس، كب كيك، بوكس، تورتة..</p>
                </div>
            `;
            return;
        }

        // بناء كروت نتائج البحث وعرض السعر النهائي المعتمد بعد الفحص المالي
        let htmlResults = `<div class="search-results-grid">`;
        
        matchedProducts.forEach(product => {
            const finalPrice = window.calculateBosePrice(product.price, "menu-only");
            const sanitizedTitle = escapeHTML(product.title);
            const sanitizedFlavor = escapeHTML(product.flavorName);
            const firstImage = product.images && product.images.length > 0 ? product.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png';
            
            htmlResults += `
                <a href="product.html?slug=${product.slug}" class="search-result-card">
                    <img src="${firstImage}" alt="${sanitizedTitle}" style="width: 70px; height: 70px; border-radius: 12px; object-fit: cover; flex-shrink: 0;" onerror="this.src='https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png'">
                    <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px; overflow: hidden; text-align: right; direction: rtl;">
                        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--bose-black); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0;">${sanitizedTitle}</h4>
                        <span style="font-size: 0.8rem; font-weight: 600; color: var(--bose-pink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sanitizedFlavor}</span>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <span class="bose-price-text" style="font-size: 0.95rem; font-weight: 700; color: var(--bose-pink);">${finalPrice} ${data.store.currency}</span>
                            <span style="font-size: 0.75rem; background: rgba(255, 145, 164, 0.1); padding: 2px 8px; border-radius: 8px; color: var(--bose-black); opacity: 0.8; font-weight: 700;">استعرض الصنف 🌸</span>
                        </div>
                    </div>
                </a>
            `;
        });

        htmlResults += `</div>`;
        resultsContainer.innerHTML = htmlResults;
    }

    // 11. تحديث فوري لعداد السلة عند قيام العميل بالتعديل من علامة تبويب أخرى (Tab Synchronization)
    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) {
            window.updateGlobalCartCounter();
            window.dispatchEvent(new Event('bose_cart_updated'));
        }
    });

    // 12. إيقاظ المحرك وبدء العمل الفعلي فور استقرار شجرة الـ DOM بالمتصفح
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadStoreDatabase);
    } else {
        loadStoreDatabase();
    }
})();

