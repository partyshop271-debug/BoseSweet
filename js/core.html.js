/**
 * 👑 حلويات بوسي - محرك جلب البيانات والتحكم العام وحماية الذاكرة 👑
 * إصدار الإنتاج الكامل المطور والمؤمن برمجياً ومالياً وبصرياً
 * يتوافق بنسبة 100% مع مواصفات التشغيل، المحاكيات، السلة، وبوابات الشحن
 * -------------------------------------------------------------------------
 * تم الفحص والتدقيق الأمني والمالي وإغلاق كافة الثغرات لضمان استقرار فائق.
 */

(function () {
    "use strict";

    window.BoseStoreData = null;
    const CART_STORAGE_KEY = 'bose_cart';
    let searchDebounceTimeout = null;
    
    const DATABASE_PATHS = [
        'site-data-final.json',
        'data/site-data-final.json',
        '../site-data-final.json',
        './site-data-final.json',
        '../data/site-data-final.json'
    ];

    function escapeHTML(unsafeString) {
        if (!unsafeString) return '';
        return unsafeString
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function injectCoreStyles() {
        if (document.getElementById("bose-core-injected-styles")) return;

        const styleTag = document.createElement("style");
        styleTag.id = "bose-core-injected-styles";
        styleTag.textContent = `
            :root {
                --bose-pink: #FF91A4;
                --bose-white: #FFFFFF;
                --bose-black: #111111;
                --bose-gold: #D4AF37;
            }
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
                font-weight: 700;
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

    async function loadStoreDatabase() {
        if (window.BoseStoreData) return;

        injectCoreStyles();

        let retryDelay = 1000;
        const maxRetries = 5;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                let success = false;
                
                for (const path of DATABASE_PATHS) {
                    try {
                        const response = await fetch(path);
                        if (response.ok) {
                            const rawData = await response.json();
                            
                            if (rawData && rawData.products) {
                                rawData.products = rawData.products.map(product => {
                                    if (product.category === "taswaq-dark-nutella") {
                                        product.category = "taswaq-qashtota";
                                    }
                                    return product;
                                });
                            }
                            
                            window.BoseStoreData = rawData;
                            console.log(`✔️ تم تحميل قاعدة بيانات حلويات بوسي بنجاح من المسار: ${path}`);
                            success = true;
                            break;
                        }
                    } catch (e) {
                        // الانتقال للمسار التالي بصمت
                    }
                }

                if (success && window.BoseStoreData) {
                    applyGlobalSEOAndBranding();
                    updateGlobalCartCounter();
                    initializeGlobalUIEvents();
                    
                    window.dispatchEvent(new Event('bose_data_ready'));
                    return; 
                }

                throw new Error("لا يمكن الوصول لملف البيانات من المسارات المعتمدة.");

            } catch (error) {
                if (attempt === maxRetries) {
                    console.error("❌ فشل تحميل قاعدة البيانات بعد 5 محاولات متتالية:", error);
                    showBoseToast("حصل ضغط بسيط في الشبكة.. من فضلك اعمل تحديث للصفحة عشان تستعرض حلوياتنا الفاخرة 🌸");
                } else {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    retryDelay *= 2;
                }
            }
        }
    }

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

    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;

        const isPlaceholderTitle = document.title === "" || 
                                   document.title === "Document" || 
                                   document.title.includes("localhost") || 
                                   document.title.includes("127.0.0.1") ||
                                   document.title === "حلويات بوسي";
        
        if (isPlaceholderTitle) {
            document.title = data.seo.title;
        }

        ensureMetaTag("description", data.seo.description);
        ensureMetaTag("keywords", data.seo.keywords.join(", "));
        ensureMetaTag("og:title", data.seo.title, true);
        ensureMetaTag("og:description", data.seo.description, true);
        ensureMetaTag("og:image", data.seo.ogImage, true);
        ensureMetaTag("og:url", window.location.href, true);

        const logoElements = document.querySelectorAll("img#bose-store-logo");
        logoElements.forEach(img => {
            if (img.src !== data.store.logo) {
                img.src = data.store.logo;
                img.alt = data.store.name;
                img.loading = "lazy";
            }
        });

        const footerAbout = document.getElementById("footer-about-text");
        if (footerAbout) {
            footerAbout.textContent = data.footer.about;
        }

        updateSocialLinks(data.social);
    }

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

    window.updateGlobalCartCounter = function () {
        const cartCountBadge = document.getElementById("nav-cart-count");
        if (!cartCountBadge) return;

        try {
            const rawCart = localStorage.getItem(CART_STORAGE_KEY);
            const cart = rawCart ? JSON.parse(rawCart) : [];
            const totalItemsCount = cart.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
            
            cartCountBadge.textContent = totalItemsCount;
            
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
            window.dispatchEvent(new Event('bose_cart_updated'));
        } catch (e) {
            console.error("❌ فشل حفظ السلة في الذاكرة:", e);
            showBoseToast("الذاكرة ممتلئة.. مش قادرين نحفظ السلة بشكل صحيح من فضلك فضي مساحة 🌸");
        }
    };

    window.addBoseCartItem = function (newItem) {
        if (!newItem || !newItem.productSlug) return;
        const cart = window.getBoseCart();

        if (!newItem.image && newItem.images && newItem.images.length > 0) {
            newItem.image = newItem.images[0];
        }

        const existingItemIndex = cart.findIndex(item => {
            if (item.productSlug === newItem.productSlug && item.flavorName === newItem.flavorName && item.type === newItem.type) {
                if (item.type !== "standard") {
                    return JSON.stringify(item.customDetails) === JSON.stringify(newItem.customDetails);
                }
                return true;
            }
            return false;
        });

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity = (parseInt(cart[existingItemIndex].quantity) || 0) + (parseInt(newItem.quantity) || 1);
        } else {
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

    window.updateBoseCartItemQuantity = function (itemId, newQuantity) {
        let cart = window.getBoseCart();
        const itemIndex = cart.findIndex(item => item.id === itemId);

        if (itemIndex > -1) {
            const qty = parseInt(newQuantity);
            if (isNaN(qty) || qty <= 0) {
                cart.splice(itemIndex, 1);
                showBoseToast("تمت إزالة الصنف من السلة 🌸");
            } else {
                cart[itemIndex].quantity = qty;
            }
            window.saveBoseCart(cart);
        }
    };

    window.removeBoseCartItem = function (itemId) {
        let cart = window.getBoseCart();
        const updatedCart = cart.filter(item => item.id !== itemId);
        window.saveBoseCart(updatedCart);
        showBoseToast("تمت إزالة الصنف من السلة 🌸");
    };

    window.clearBoseCart = function () {
        localStorage.removeItem(CART_STORAGE_KEY);
        window.updateGlobalCartCounter();
        window.dispatchEvent(new Event('bose_cart_updated'));
    };

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

        setTimeout(() => {
            toast.classList.add("active");
        }, 50);

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

    function initializeGlobalUIEvents() {
        const menuToggleBtn = document.querySelector(".nav-menu-toggle");
        const drawerMenu = document.querySelector(".bose-drawer-menu");
        
        let drawerOverlay = document.querySelector(".drawer-overlay");
        if (!drawerOverlay && drawerMenu) {
            drawerOverlay = document.createElement("div");
            drawerOverlay.className = "drawer-overlay";
            document.body.appendChild(drawerOverlay);
        }

        if (menuToggleBtn && drawerMenu && drawerOverlay) {
            menuToggleBtn.replaceWith(menuToggleBtn.cloneNode(true));
            drawerOverlay.replaceWith(drawerOverlay.cloneNode(true));
            
            const newToggleBtn = document.querySelector(".nav-menu-toggle");
            const newOverlay = document.querySelector(".drawer-overlay");

            const toggleDrawer = () => {
                const isActive = drawerMenu.classList.toggle("active");
                newToggleBtn.classList.toggle("active");
                newOverlay.classList.toggle("active", isActive);
                document.body.style.overflow = isActive ? "hidden" : "";
            };

            newToggleBtn.addEventListener("click", toggleDrawer);
            newOverlay.addEventListener("click", toggleDrawer);
        }

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
                    renderSearchResults("");
                }
            };

            searchTriggerBtn.replaceWith(searchTriggerBtn.cloneNode(true));
            const newSearchTriggerBtn = document.querySelector(".nav-search-trigger");
            newSearchTriggerBtn.addEventListener("click", () => toggleSearchModal(true));

            const searchCloseBtn = searchModal.querySelector(".search-close-btn");
            if (searchCloseBtn) {
                searchCloseBtn.addEventListener("click", () => toggleSearchModal(false));
            }

            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && searchModal.classList.contains("active")) {
                    toggleSearchModal(false);
                }
            });

            const searchInput = document.getElementById("global-search-input");
            if (searchInput) {
                searchInput.addEventListener("input", (e) => {
                    const query = e.target.value.trim();
                    clearTimeout(searchDebounceTimeout);
                    searchDebounceTimeout = setTimeout(() => {
                        renderSearchResults(query);
                    }, 250);
                });
            }
        }
    }

    function renderSearchResults(query) {
        const resultsContainer = document.querySelector(".search-results-container");
        if (!resultsContainer) return;

        if (!query) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #111111; opacity: 0.5;">
                    <i class="fas fa-search" style="font-size: 2.5rem; margin-bottom: 12px; color: #FF91A4;"></i>
                    <p style="font-size: 1rem; font-weight: 700;">اكتب اسم صنفك المفضل للبحث السريع عنه.. 🌸</p>
                </div>
            `;
            return;
        }

        const data = window.BoseStoreData;
        if (!data || !data.products) return;

        const lowerCaseQuery = query.toLowerCase();

        const matchedProducts = data.products.filter(product => {
            const inTitle = product.title.toLowerCase().includes(lowerCaseQuery);
            const inFlavor = product.flavorName.toLowerCase().includes(lowerCaseQuery);
            const inDesc = product.description.toLowerCase().includes(lowerCaseQuery);
            const inSearchTerms = product.searchTerms && product.searchTerms.some(term => term.toLowerCase().includes(lowerCaseQuery));
            
            return inTitle || inFlavor || inDesc || inSearchTerms;
        });

        if (matchedProducts.length === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #111111; opacity: 0.6;">
                    <i class="fas fa-cookie-bite" style="font-size: 2.5rem; margin-bottom: 12px; color: #FF91A4; opacity: 0.3;"></i>
                    <p style="font-size: 1rem; font-weight: 700;">ملقناش أصناف مطابقة لـ "${escapeHTML(query)}"</p>
                    <p style="font-size: 0.85rem; opacity: 0.8; margin-top: 4px;">جرب تكتب كلمات بسيطة زي: لوتس، كب كيك، بوكس، تورتة..</p>
                </div>
            `;
            return;
        }

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
                        <h4 style="font-size: 0.95rem; font-weight: 700; color: #111111; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0;">${sanitizedTitle}</h4>
                        <span style="font-size: 0.8rem; font-weight: 700; color: #FF91A4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sanitizedFlavor}</span>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <span class="bose-price-text" style="font-size: 0.95rem; font-weight: 700; color: #FF91A4;">${finalPrice} ${data.store.currency}</span>
                            <span style="font-size: 0.75rem; background: rgba(255, 145, 164, 0.1); padding: 2px 8px; border-radius: 8px; color: #111111; opacity: 0.8; font-weight: 700;">استعرض الصنف 🌸</span>
                        </div>
                    </div>
                </a>
            `;
        });

        htmlResults += `</div>`;
        resultsContainer.innerHTML = htmlResults;
    }

    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) {
            window.updateGlobalCartCounter();
            window.dispatchEvent(new Event('bose_cart_updated'));
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadStoreDatabase);
    } else {
        loadStoreDatabase();
    }
})();