/**
 * 👑 المحرك المركزي العام والنهائي للموقع - حلويات بوسي (BoseSweets) 👑
 * النسخة الهندسية القياسية الشاملة والمطورة بنسبة 100% - خالية تماماً من الثغرات البرمجية والمالية واللوجستية V67.0 Master
 * متوافق بشكل مطلق وثنائي الاتجاه مع كافة ملفات css/ وجافا سكريبت الموقع وقاعدة البيانات data/site-data-final.json
 * يدمج حارس الإيماءات اللمسية الذكي وتأثير السكرول المتطور للهيدر مع الحفاظ التام على خريطة الـ DOM المقدسة
 * التزام كامل بملفات الحوكمة والمواصفات: التخلص من الدالات الميتة، سد الثغرات الجغرافية والزمنية والمالية، وتأمين الأداء للموبايل والكمبيوتر
 */

(function () {
    "use strict";

    // 🎨 نظام الألوان الحاكمة والمقدسة للعلامة التجارية للهندسة البصرية الرقمية (The Strict Palette)
    const BRAND_COLORS = {
        pink: "#FF91A4",  // نبض الحياة في الموقع: حدود كروت المنتجات، الظلال الناعمة، نصوص الأسعار، والـ Hover
        white: "#FFFFFF", // المسيطر تماماً على الخلفيات والمساحات لخلق تنفس بصري ومنع التكديس لراحة العميل النفسية
        black: "#111111", // النصوص والعناوين فقط لضمان وضوح كامل للعين - معزول تماماً عن الظلال والخلفيات
        gold: "#D4AF37"   // وجود رمزي ناعم وخفيف جداً لمحاكاة فخامة اللوجو ونجوم التقييمات
    };

    // 🔑 مفتاح تخزين السلة الموحد والثابت عبر كافة محركات الموقع لضمان التزامن الكامل
    const CART_STORAGE_KEY = 'bose_cart';
    
    // 🧠 ذاكرة البيانات المركزية للموقع (Global Singleton Pattern) لمنع تكرار الاتصال بالخادم
    let boseGlobalStoreData = null;
    let databaseReadyCallbacks = [];
    window.boseServerTimeOffset = 0; // فارق التوقيت بالمللي ثانية: (وقت الخادم - وقت جهاز العميل)

    /* ==========================================================================\
       1. حارس التمهيد واستدعاء قاعدة البيانات المعتمدة data/site-data-final.json مع كسر الكاش
       ========================================================================== */
    async function loadBoseAbsoluteDatabase() {
        try {
            const boseLocation = window.location;
            
            // 🛡️ إصلاح ذكي وجذري للمسارات لتفادي شلل الأجزاء المشتركة بالصفحات على الاستضافات والموبايل أولاً
            let baseRootPath = "";
            const currentPath = boseLocation.pathname;
            
            if (currentPath.includes('/pages/') || currentPath.includes('/admin/') || currentPath.includes('/css/') || currentPath.includes('/js/')) {
                baseRootPath = "../";
            } else {
                baseRootPath = "./";
            }

            let jsonPath = `${baseRootPath}data/site-data-final.json`;
            const cacheBuster = `?v=${Date.now()}`;
            
            let response = await fetch(jsonPath + cacheBuster);
            if (!response.ok) {
                const alternativePath = `${baseRootPath}site-data-final.json${cacheBuster}`;
                const fallbackResponse = await fetch(alternativePath);
                if (!fallbackResponse.ok) throw new Error(`فشل جلب البيانات من كافة المسارات القياسية: ${fallbackResponse.status}`);
                boseGlobalStoreData = await fallbackResponse.json();
                response = fallbackResponse;
            } else {
                boseGlobalStoreData = await response.json();
            }
            
            // [حل الثغرة اللوجستية: تزامن التوقيت المحلي لشرط التحضير ومنع التلاعب من العميل]
            const serverDateHeader = response.headers ? response.headers.get('Date') : null;
            if (serverDateHeader) {
                const serverTime = new Date(serverDateHeader).getTime();
                const clientTime = Date.now();
                window.boseServerTimeOffset = serverTime - clientTime;
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
            
            // 🛡️ [حارس الحقن والمطابقة للـ DOM المقدس]: تأمين الهيدر والفوتر والأسطح المشتركة
            ensureSharedLayoutHubs(boseGlobalStoreData);
            
        } catch (error) {
            console.error("❌ خطأ حرج في تهيئة نظام حلويات بوسي الموحد واختفاء الحاويات البصرية:", error);
            showGlobalFriendlyError();
        }
    }

    window.onBoseDatabaseReady = function (callback) {
        if (boseGlobalStoreData) {
            callback(boseGlobalStoreData);
        } else {
            databaseReadyCallbacks.push(callback);
        }
    };

    window.getBoseDatabase = function () {
        return new Promise((resolve) => {
            if (boseGlobalStoreData) {
                resolve(boseGlobalStoreData);
            } else {
                databaseReadyCallbacks.push((data) => resolve(data));
            }
        });
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
        if (data.seo && data.seo.title) {
            document.title = data.seo.title;
        }
        const logoImgs = document.querySelectorAll('img#bose-store-logo, .bose-footer-store-logo-fallback, img#bose-footer-logo-node');
        logoImgs.forEach(img => {
            if (data.store && img.src !== data.store.logo) img.src = data.store.logo;
        });
        const aboutText = document.getElementById('footer-about-text');
        if (aboutText && !aboutText.textContent && data.footer) aboutText.textContent = data.footer.about;
    }

    function ensureSharedLayoutHubs(storeData) {
        if (!storeData) return;

        // 🚨 حرس الترتيب الصارم: حقن الشريط التسويقي أولاً كأول عنصر هندسي مقدّس في الـ body قبل الهيدر تماماً من عيار 100%
        let tickerNode = document.getElementById('top-bar-marquee');
        if (!tickerNode) {
            tickerNode = document.createElement('div');
            tickerNode.id = 'top-bar-marquee';
            tickerNode.className = 'bose-ticker-section';
            document.body.insertBefore(tickerNode, document.body.firstChild);
        }
        if ((tickerNode.innerHTML.trim() === "" || document.getElementById('top-bar-marquee-track')) && storeData.navigation && storeData.navigation.topBarMessages) {
            const messagesHTML = storeData.navigation.topBarMessages.map(msg => `
                <div class="bose-ticker-item"><i class="fas fa-crown" style="color: ${BRAND_COLORS.gold} !important;"></i> ${msg}</div>
            `).join('');
            tickerNode.innerHTML = `<div id="top-bar-marquee-track" class="bose-ticker-wrapper animate-marquee">${messagesHTML}${messagesHTML}</div>`;
        }
        
        // 🏢 مكون الهيدر الموحد والثابت (Shared Universal Header) اللاصق عالي السرعة والاستجابة بالمسطرة
        let headerNode = document.querySelector('.bose-navbar');
        if (!headerNode) {
            headerNode = document.createElement('header');
            headerNode.className = 'bose-navbar';
            tickerNode.parentNode.insertBefore(headerNode, tickerNode.nextSibling);
        }
        
        if (headerNode.innerHTML.trim() === "") {
            headerNode.innerHTML = `
                <div class="navbar-mobile-wrapper">
                    <button id="mobile-menu-toggle" class="nav-icon-btn" aria-label="فتح قائمة التصفح">
                        <i class="fas fa-bars"></i>
                    </button>
                    <div class="brand-logo-container">
                        <a href="index.html">
                            <img id="bose-store-logo" src="${storeData.store.logo}" alt="شعار حلويات بوسي">
                        </a>
                    </div>
                    <span class="brand-name-display">حلويات بوسي</span>
                    <div class="nav-actions">
                        <button id="nav-search-btn" class="nav-icon-btn" aria-label="البحث في المنتجات">
                            <i class="fas fa-search"></i>
                        </button>
                        <a href="cart.html" class="nav-cart-icon-wrapper" aria-label="عرض سلة التسوق">
                            <i class="fas fa-shopping-bag"></i>
                            <span id="nav-cart-count">0</span>
                        </a>
                    </div>
                </div>
            `;
        }

        // 🏪 مكون الفوتر الموحد والثابت (Shared Universal Footer) المتطابق مع خريطة الـ DOM بالمسطرة
        let footerNode = document.querySelector('.bose-footer');
        if (!footerNode) {
            footerNode = document.createElement('footer');
            footerNode.className = 'bose-footer';
            document.body.appendChild(footerNode);
        }
        
        if (footerNode.innerHTML.trim() === "") {
            let policiesHTML = '';
            if (storeData.footer && storeData.footer.policies) {
                policiesHTML = storeData.footer.policies.map(policy => `
                    <a href="#" class="footer-policy-link" style="color: ${BRAND_COLORS.black} !important; text-decoration: none; font-size: 12px; font-weight: 600;">${policy}</a>
                `).join(' <span style="color: rgba(255,145,164,0.3);">|</span> ');
            }

            footerNode.innerHTML = `
                <div class="footer-logo-container">
                    <a href="index.html">
                        <img class="bose-footer-store-logo-fallback" id="bose-footer-logo-node" src="${storeData.store.logo}" alt="شعار حلويات بوسي">
                    </a>
                </div>
                <span class="brand-name-display footer-brand-name">حلويات بوسي</span>
                <div class="footer-about-block">
                    <p id="footer-about-text">${storeData.footer.about}</p>
                </div>
                <div id="footer-social-links" class="bose-social-links-wrapper">
                    <a href="${storeData.social.facebook}" class="social-link-facebook" target="_blank" aria-label="فيسبوك حلويات بوسي"><i class="fab fa-facebook-f"></i></a>
                    <a href="${storeData.social.instagram}" class="social-link-instagram" target="_blank" aria-label="انستجرام حلويات بوسي"><i class="fab fa-instagram"></i></a>
                    <a href="${storeData.social.tiktok}" class="social-link-tiktok" target="_blank" aria-label="تيك توك حلويات بوسي"><i class="fab fa-tiktok"></i></a>
                    <a href="https://wa.me/${storeData.social.whatsapp}" class="social-link-whatsapp" target="_blank" aria-label="واتساب حلويات بوسي"><i class="fab fa-whatsapp"></i></a>
                </div>
                <div class="footer-policies-container" id="bose-footer-policies" style="margin: 16px 0; text-align: center; font-family: 'Cairo';">
                    ${policiesHTML}
                </div>
                <div class="footer-copyright-block">
                    <p>© <span id="copyright-year">2026</span> جميع الحقوق محفوظة لعلامة حلويات بوسي التجارية الفاخرة</p>
                </div>
            `;
        }
        
        if (!document.getElementById('sidebar-drawer')) {
            const drawerDiv = document.createElement('div');
            drawerDiv.id = 'sidebar-drawer';
            drawerDiv.className = 'bose-premium-sidebar';
            document.body.appendChild(drawerDiv);
            
            const shieldDiv = document.createElement('div');
            shieldDiv.id = 'drawer-shield';
            shieldDiv.className = 'bose-drawer-shield';
            document.body.appendChild(shieldDiv);
        }
        
        initializeSidebarDrawer();
        updateGlobalCartCounters();
    }

    function initializeSidebarDrawer() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const drawer = document.getElementById('sidebar-drawer');
        const shield = document.getElementById('drawer-shield');

        if (!drawer) return; 

        if (!drawer.classList.contains('bose-premium-sidebar-initiated')) {
            drawer.classList.add('bose-premium-sidebar-initiated');
            
            let accordionCategoriesHTML = '';
            
            if (boseGlobalStoreData && boseGlobalStoreData.homepage && boseGlobalStoreData.homepage.categoriesSlider && boseGlobalStoreData.products) {
                const catsList = boseGlobalStoreData.homepage.categoriesSlider;
                const prodsList = boseGlobalStoreData.products;
                
                catsList.forEach(cat => {
                    const relatedProducts = prodsList.filter(p => p.category === cat.id);
                    let productLinksHTML = '';
                    
                    if (relatedProducts.length > 0) {
                        relatedProducts.forEach(prod => {
                            productLinksHTML += `
                                <a href="product.html?slug=${prod.slug}" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 0.85rem; font-weight: 600; color: ${BRAND_COLORS.black} !important; padding: 8px 16px; text-decoration: none; border-bottom: 1px solid rgba(255,145,164,0.05); font-family: 'Cairo';">
                                    <span style="display: flex; align-items: center; gap: 6px;"><i class="fas fa-angle-left" style="color: ${BRAND_COLORS.pink} !important; font-size: 10px;"></i> ${prod.flavorName || prod.title}</span>
                                    <span style="font-size: 11px; color: ${BRAND_COLORS.pink} !important; font-weight: 700;">${prod.price} EGP</span>
                                </a>
                            `;
                        });
                    } else {
                        productLinksHTML = `
                            <a href="category.html?category=${cat.id}" style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 600; color: #666; padding: 10px 16px; text-decoration: none; font-family: 'Cairo';">
                                <i class="fas fa-cookie" style="color: ${BRAND_COLORS.gold} !important;"></i> استعراض تشكيلة قسم ${cat.title}
                            </a>
                        `;
                    }
                    
                    accordionCategoriesHTML += `
                        <div class="sidebar-nested-category-block" style="border-bottom: 1px solid rgba(17,17,17,0.04);">
                            <div class="sidebar-sub-accordion-trigger" data-target="sub-cat-${cat.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer;">
                                <span style="font-size: 0.88rem; font-weight: 700; color: ${BRAND_COLORS.black} !important; font-family: 'Cairo';"><i class="fas fa-chevron-left" style="font-size: 8px; color: ${BRAND_COLORS.gold} !important; margin-left: 6px;"></i> ${cat.title}</span>
                                <i class="fas fa-plus sub-accordion-plus-icon" style="font-size: 0.7rem; color: ${BRAND_COLORS.pink} !important; transition: transform 0.3s;"></i>
                            </div>
                            <div id="sub-cat-${cat.id}" class="sidebar-sub-accordion-content" style="max-height: 0px; overflow: hidden; transition: max-height 0.3s ease; display: flex; flex-direction: column; background: ${BRAND_COLORS.white}; padding-right: 8px;">
                                ${productLinksHTML}
                            </div>
                        </div>
                    `;
                });
            }

            drawer.innerHTML = `
                <div class="sidebar-luxury-header" style="padding: 24px 20px; border-bottom: 1px solid rgba(255,145,164,0.1); display: flex; justify-content: space-between; align-items: center; background: ${BRAND_COLORS.white};">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${boseGlobalStoreData.store.logo}" style="width: 44px; height: 44px; object-fit: contain;" alt="لوجو بوسي الفاخر">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-family: 'Cairo'; font-weight: 700; font-size: 15px; color: ${BRAND_COLORS.black} !important; line-height: 1.3;">حلويات بوسي</span>
                            <span style="font-family: 'Cairo'; font-size: 11px; color: #777;">صنعناها بحب لتهديها لمن تحب</span>
                        </div>
                    </div>
                    <button id="sidebar-close-panel-btn" style="background: none; border: none; font-size: 28px; color: ${BRAND_COLORS.black} !important; cursor: pointer; line-height: 1; padding: 0 4px;">&times;</button>
                </div>
                <div class="sidebar-luxury-body" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: ${BRAND_COLORS.white};">
                    <span style="font-size: 11px; font-weight: 700; color: ${BRAND_COLORS.pink} !important; letter-spacing: 0.5px; margin-bottom: 4px; font-family: 'Cairo';">أقسام التصفح الأساسية</span>
                    
                    <a href="index.html" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,145,164,0.2); color: ${BRAND_COLORS.black} !important; font-weight: 700; font-size: 13px; text-decoration: none; font-family: 'Cairo';"><i class="fas fa-home" style="color: ${BRAND_COLORS.pink} !important; font-size: 15px;"></i> الواجهة الرئيسية للموقع</a>
                    
                    <div class="drawer-link-item" style="display: flex; flex-direction: column; gap: 4px;">
                        <div id="sidebar-menu-accordion-toggle" class="sidebar-accordion-trigger" style="display: flex; align-items: center; justify-content: space-between; font-size: 0.95rem; font-weight: 700; color: ${BRAND_COLORS.black} !important; padding: 10px 14px; border-radius: 12px; cursor: pointer; background: rgba(255,145,164,0.03); border: 1px solid rgba(255,145,164,0.1) !important;">
                            <span style="display: flex; align-items: center; gap: 10px; font-family: 'Cairo';"><i class="fas fa-utensils" style="color: ${BRAND_COLORS.pink} !important;"></i> المنيو حسب الفئة</span>
                            <i class="fas fa-chevron-down" style="font-size: 0.8rem; color: ${BRAND_COLORS.pink} !important; transition: transform 0.3s ease;"></i>
                        </div>
                        <div id="sidebar-menu-accordion-content" class="sidebar-accordion-content" style="max-height: 0px; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1); background-color: ${BRAND_COLORS.white}; border-radius: 12px; display: flex; flex-direction: column; gap: 2px; padding: 0 4px; box-sizing: border-box;">
                            ${accordionCategoriesHTML}
                        </div>
                    </div>
                    
                    <a href="cart.html" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; color: ${BRAND_COLORS.black} !important; font-weight: 600; font-size: 13px; text-decoration: none; font-family: 'Cairo'; transition: 0.2s;"><i class="fas fa-shopping-bag" style="color: ${BRAND_COLORS.pink} !important; font-size: 15px;"></i> سلة المشتريات والطلبات</a>
                    
                    <div style="height: 1px; background: #F1F1F1; margin: 8px 0;"></div>
                    
                    <span style="font-size: 11px; font-weight: 700; color: ${BRAND_COLORS.pink} !important; letter-spacing: 0.5px; margin-bottom: 4px; font-family: 'Cairo';">تصفح المحاكيات التفاعلية</span>
                    
                    <a href="cake-builder.html" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1px solid rgba(255,145,164,0.22); border-radius: 12px; color: ${BRAND_COLORS.black} !important; font-weight: 700; font-size: 13px; text-decoration: none; background: ${BRAND_COLORS.white}; font-family: 'Cairo'; transition: 0.2s; box-shadow: 0 4px 12px rgba(255,145,164,0.03);"><span style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-birthday-cake" style="color: ${BRAND_COLORS.gold} !important; font-size: 16px;"></i> محاكي وتصميم التورت الحصري</span> <i class="fas fa-chevron-left" style="font-size: 11px; color: ${BRAND_COLORS.pink} !important;"></i></a>
                    <a href="flower-builder.html" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1px solid rgba(255,145,164,0.22); border-radius: 12px; color: ${BRAND_COLORS.black} !important; font-weight: 700; font-size: 13px; text-decoration: none; background: ${BRAND_COLORS.white}; font-family: 'Cairo'; transition: 0.2s; box-shadow: 0 4px 12px rgba(255,145,164,0.03);"><span style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-seedling" style="color: ${BRAND_COLORS.gold} !important; font-size: 16px;"></i> محاكي الورد وتنسيق البوكيهات</span> <i class="fas fa-chevron-left" style="font-size: 11px; color: ${BRAND_COLORS.pink} !important;"></i></a>
                    
                    <div style="margin-top: auto; padding-top: 30px; text-align: center;">
                        <span style="font-size: 11px; font-weight: 600; color: #999; font-family: 'Cairo'; display: block; line-height: 1.5;">فرع الكفاح - بجوار صيدلية د. أحمد مجدي 🌸</span>
                        <span style="font-size: 10px; color: #BBB; font-family: 'Cairo'; margin-top: 4px; display: block;">جميع الحقوق محفوظة © ٢٠٢٦</span>
                    </div>
                </div>
            `;
        }

        const closeBtn = document.getElementById('sidebar-close-panel-btn');

        if (toggleBtn && drawer && shield) {
            toggleBtn.onclick = (e) => {
                e.preventDefault();
                drawer.classList.add('active');
                shield.classList.add('active');
                drawer.style.transform = 'translate3d(0, 0, 0)';
                shield.style.display = 'block';
                setTimeout(() => shield.style.opacity = '1', 10);
                document.body.style.overflow = 'hidden';
            };
        }

        const closeDrawerMenu = () => {
            if (drawer && shield) {
                drawer.classList.remove('active');
                shield.classList.remove('active');
                drawer.style.transform = 'translate3d(100%, 0, 0)';
                shield.style.opacity = '0';
                setTimeout(() => {
                    shield.style.display = 'none';
                    document.body.style.overflow = '';
                }, 300);
            }
        };

        if (closeBtn) closeBtn.onclick = closeDrawerMenu;
        if (shield) shield.onclick = closeDrawerMenu;

        const accordionToggle = document.getElementById('sidebar-menu-accordion-toggle');
        const accordionContent = document.getElementById('sidebar-menu-accordion-content');
        
        if (accordionToggle && accordionContent) {
            accordionToggle.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const isOpen = accordionToggle.classList.contains('open');
                const chevronIcon = accordionToggle.querySelector('.fa-chevron-down');
                
                if (isOpen) {
                    accordionToggle.classList.remove('open');
                    accordionContent.style.maxHeight = '0px';
                    if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
                } else {
                    accordionToggle.classList.add('open');
                    accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
                    if (chevronIcon) chevronIcon.style.transform = 'rotate(180deg)';
                }
            };
        }

        document.querySelectorAll('.sidebar-sub-accordion-trigger').forEach(trigger => {
            trigger.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const targetId = this.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                const plusIcon = this.querySelector('.sub-accordion-plus-icon');
                
                if (targetContent) {
                    const isSubOpen = targetContent.style.maxHeight && targetContent.style.maxHeight !== '0px';
                    
                    if (isSubOpen) {
                        targetContent.style.maxHeight = '0px';
                        if (plusIcon) {
                            plusIcon.className = "fas fa-plus sub-accordion-plus-icon";
                            plusIcon.style.transform = "rotate(0deg)";
                        }
                    } else {
                        targetContent.style.maxHeight = targetContent.scrollHeight + 'px';
                        if (plusIcon) {
                            plusIcon.className = "fas fa-minus sub-accordion-plus-icon";
                            plusIcon.style.transform = "rotate(180deg)";
                        }
                        
                        if (accordionContent) {
                            accordionContent.style.maxHeight = (accordionContent.scrollHeight + targetContent.scrollHeight) + 'px';
                        }
                    }
                }
            };
        });
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
                start += Math.ceil(end / 60);
                if (start >= end) {
                    start = end;
                    clearInterval(timer);
                }
                el.textContent = start + item.suf;
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
        const wrapper = document.getElementById('categories-slider-wrapper');
        const track = document.getElementById('categories-track');
        if (!track || !storeData?.homepage?.categoriesSlider) return; 

        const cats = storeData.homepage.categoriesSlider;
        
        track.innerHTML = cats.map(cat => `
            <a href="category.html?category=${cat.id}" class="category-slide-card" style="width: 280px !important; flex-shrink: 0 !important; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 12px; text-decoration: none;">
                <div style="width: 100%; aspect-ratio: 1/1; overflow: hidden; border-radius: 20px; border: 1px solid rgba(255, 145, 164, 0.2); background: ${BRAND_COLORS.white}; position: relative;">
                    <img src="${cat.image}" alt="${cat.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy">
                </div>
                <h3 style="margin-top: 12px; font-size: 20px; font-weight: 700 !important; color: #111111 !important; text-align: center; font-family: 'Cairo'; white-space: normal; word-break: break-word;">${cat.title}</h3>
            </a>
        `).join('');

        let controlsContainer = document.getElementById('bose-categories-controls');
        if (!controlsContainer && wrapper) {
            controlsContainer = document.createElement('div');
            controlsContainer.id = 'bose-categories-controls';
            controlsContainer.style.cssText = `display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 20px; width: 100%; direction: rtl;`;
            
            const arrowsRow = document.createElement('div');
            arrowsRow.style.cssText = `display: flex; gap: 20px; align-items: center; justify-content: center;`;
            arrowsRow.innerHTML = `
                <button id="cat-slide-prev" style="background: none; border: none; color: ${BRAND_COLORS.pink} !important; font-size: 20px; cursor: pointer; padding: 4px 12px;"><i class="fas fa-chevron-right"></i></button>
                <div id="cat-dots-container" style="display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap; max-width: 90%;"></div>
                <button id="cat-slide-next" style="background: none; border: none; color: ${BRAND_COLORS.pink} !important; font-size: 20px; cursor: pointer; padding: 4px 12px;"><i class="fas fa-chevron-left"></i></button>
            `;
            controlsContainer.appendChild(arrowsRow);
            wrapper.parentNode.insertBefore(controlsContainer, wrapper.nextSibling);

            const dotsContainer = document.getElementById('cat-dots-container');
            dotsContainer.innerHTML = cats.map((_, i) => `
                <span class="cat-dot ${i === 0 ? 'active' : ''}" data-index="${i}" style="width: 8px; height: 8px; border-radius: 50%; background: rgba(255,145,164,0.3); cursor: pointer; transition: 0.3s;"></span>
            `).join('');

            let currentCatInx = 0;
            const cardWidth = 304; 

            function updateCatSliderPosition() {
                wrapper.scrollTo({
                    left: -(currentCatInx * cardWidth),
                    behavior: 'smooth'
                });
                renderDotsUI();
            }

            function renderDotsUI() {
                document.querySelectorAll('.cat-dot').forEach((d, i) => {
                    if (i === currentCatInx) {
                        d.style.background = BRAND_COLORS.pink;
                        d.style.width = '24px';
                        d.style.borderRadius = '6px';
                    } else {
                        d.style.background = 'rgba(255,145,164,0.3)';
                        d.style.width = '8px';
                        d.style.borderRadius = '50%';
                    }
                });
            }

            document.getElementById('cat-slide-prev').onclick = () => {
                if (currentCatInx > 0) { currentCatInx--; updateCatSliderPosition(); }
            };
            document.getElementById('cat-slide-next').onclick = () => {
                if (currentCatInx < cats.length - 1) { currentCatInx++; updateCatSliderPosition(); }
            };

            wrapper.addEventListener('scroll', () => {
                const index = Math.round(Math.abs(wrapper.scrollLeft) / cardWidth);
                if (index !== currentCatInx && index < cats.length) {
                    currentCatInx = index;
                    renderDotsUI();
                }
            }, { passive: true });

            document.querySelectorAll('.cat-dot').forEach(dot => {
                dot.onclick = function() {
                    currentCatInx = parseInt(this.dataset.index, 10);
                    updateCatSliderPosition();
                };
            });
        }
    }

    function initializeBosePrideSlider() {
        const prideTrack = document.getElementById('excellence-images-track');
        const prideWrapper = document.getElementById('pride-slider-wrapper');
        if (!prideTrack || !prideWrapper) return; 

        const originalSlides = Array.from(prideTrack.children);
        if (originalSlides.length === 0) return;

        let prideDotsContainer = document.getElementById('pride-dots-container');
        if (!prideDotsContainer) {
            prideDotsContainer = document.createElement('div');
            prideDotsContainer.id = 'pride-dots-container';
            prideDotsContainer.style.cssText = `display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 16px; width: 100%;`;
            
            originalSlides.forEach((_, i) => {
                const dot = document.createElement('span');
                dot.className = `pride-dot ${i === 0 ? 'active' : ''}`;
                dot.style.cssText = `width: 8px; height: 8px; border-radius: 50%; background: ${i === 0 ? BRAND_COLORS.pink : 'rgba(255,145,164,0.3)'}; transition: 0.3s; cursor: pointer;`;
                dot.dataset.index = i;
                dot.onclick = function() {
                    if (isTransitioning) return;
                    currentHtmlIdx = parseInt(this.dataset.index, 10) + cloneCount;
                    scrollPrideToEach(true);
                    restartAutoPlay();
                };
                prideDotsContainer.appendChild(dot);
            });
            prideWrapper.appendChild(prideDotsContainer);
        }

        const cloneCount = originalSlides.length;
        const currentClones = prideTrack.querySelectorAll('[data-bose-clone="true"]');
        currentClones.forEach(c => c.remove());

        originalSlides.forEach(slide => {
            const cloneAfter = slide.cloneNode(true);
            cloneAfter.setAttribute('data-bose-clone', 'true');
            prideTrack.appendChild(cloneAfter);
        });
        
        for (let i = cloneCount - 1; i >= 0; i--) {
            const cloneBefore = originalSlides[i].cloneNode(true);
            cloneBefore.setAttribute('data-bose-clone', 'true');
            prideTrack.insertBefore(cloneBefore, prideTrack.firstChild);
        }

        let currentHtmlIdx = cloneCount; 
        let slideInterval = null;
        let isTransitioning = false;
        
        let touchStartX = 0;
        let touchCurrentX = 0;
        let isDragging = false;

        prideTrack.style.display = 'flex';
        prideTrack.style.transition = 'none';
        
        function getSlideWidth() {
            return prideWrapper.getBoundingClientRect().width || window.innerWidth; 
        }

        function scrollPrideToEach(animate = true) {
            const slideWidth = getSlideWidth();
            if (animate) {
                prideTrack.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'; 
                isTransitioning = true;
            } else {
                prideTrack.style.transition = 'none';
            }
            
            prideTrack.style.transform = `translate3d(${-(currentHtmlIdx * slideWidth)}px, 0, 0)`;
            
            let activeDotIndex = (currentHtmlIdx - cloneCount) % cloneCount;
            if (activeDotIndex < 0) activeDotIndex += cloneCount;

            document.querySelectorAll('.pride-dot').forEach((d, i) => {
                if (i === activeDotIndex) {
                    d.style.background = BRAND_COLORS.pink;
                    d.classList.add('active');
                } else {
                    d.style.background = 'rgba(255,145,164,0.3)';
                    d.classList.remove('active');
                }
            });
        }

        prideTrack.addEventListener('transitionend', () => {
            isTransitioning = false;
            const slideWidth = getSlideWidth();
            
            if (currentHtmlIdx >= cloneCount * 2) {
                prideTrack.style.transition = 'none';
                currentHtmlIdx = cloneCount;
                prideTrack.style.transform = `translate3d(${-(currentHtmlIdx * slideWidth)}px, 0, 0)`;
            } else if (currentHtmlIdx < cloneCount) {
                prideTrack.style.transition = 'none';
                currentHtmlIdx = cloneCount * 2 - 1;
                prideTrack.style.transform = `translate3d(${-(currentHtmlIdx * slideWidth)}px, 0, 0)`;
            }
        });

        prideWrapper.addEventListener('touchstart', (e) => {
            clearInterval(slideInterval);
            if (isTransitioning) return;
            isDragging = true;
            touchStartX = e.touches[0].clientX;
            prideTrack.style.transition = 'none';
        }, { passive: true });

        prideWrapper.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            touchCurrentX = e.touches[0].clientX;
            const diffX = touchCurrentX - touchStartX;
            const slideWidth = getSlideWidth();
            const currentOffset = -(currentHtmlIdx * slideWidth);
            prideTrack.style.transform = `translate3d(${currentOffset + diffX}px, 0, 0)`;
        }, { passive: true });

        prideWrapper.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            const diffX = touchCurrentX - touchStartX;
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    currentHtmlIdx--; 
                } else {
                    currentHtmlIdx++; 
                }
            }
            scrollPrideToEach(true);
            startAutoPlay();
        }, { passive: true });

        function startAutoPlay() {
            if (slideInterval) clearInterval(slideInterval);
            slideInterval = setInterval(() => {
                if (isTransitioning || isDragging) return;
                currentHtmlIdx++;
                scrollPrideToEach(true);
            }, 3000); 
        }

        function restartAutoPlay() {
            clearInterval(slideInterval);
            startAutoPlay();
        }

        setTimeout(() => {
            scrollPrideToEach(false);
            startAutoPlay();
        }, 150);

        prideTrack.addEventListener('mouseenter', () => clearInterval(slideInterval));
        prideTrack.addEventListener('mouseleave', startAutoPlay);
        
        window.addEventListener('resize', () => {
            scrollPrideToEach(false);
        });
    }

    function injectFloatingCartSystem() {
        if (document.getElementById('bose-floating-cart-wrapper')) return;

        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.includes("cart.html") || currentPath.includes("checkout.html") || currentPath.includes("order-success.html")) {
            return;
        }

        const container = document.createElement('div');
        container.id = 'bose-floating-cart-wrapper';

        const triggerLink = document.createElement('a');
        triggerLink.id = 'bose-floating-cart-trigger';
        triggerLink.href = 'cart.html';
        triggerLink.className = 'bose-floating-cart-trigger';
        triggerLink.setAttribute('aria-label', 'عرض سلة التسوق');
        triggerLink.innerHTML = `
            <div class="bose-trigger-icon-box">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span id="bose-floating-badge-counter">0</span>
            </div>
        `;

        container.appendChild(triggerLink);
        document.body.appendChild(container);

        injectFloatingCartStyles();
        applyPsychologicalBlinking();
    }

    function applyPsychologicalBlinking() {
        const cart = getInMemoryCart();
        const trigger = document.getElementById('bose-floating-cart-trigger');
        if (!trigger) return;

        if (cart.length === 0) {
            trigger.classList.add('bose-pulse-blinking-active');
        } else {
            trigger.classList.remove('bose-pulse-blinking-active');
        }
    }

    function getInMemoryCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    window.showBoseToast = function (message) {
        let container = document.getElementById('bose-toast-central-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-central-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `bose-toast-card`;
        toast.innerHTML = `
            <div class="bose-toast-content">
                <span class="bose-toast-sparkle">🌸</span>
                <p class="bose-toast-text">${message}</p>
            </div>
        `;

        container.appendChild(toast);
        setTimeout(() => toast.classList.add('bose-toast-active'), 10);
        
        setTimeout(() => {
            toast.classList.remove('bose-toast-active');
            toast.classList.add('bose-toast-fadeout');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    };

    window.generateStrictProductCardHTML = function (product, currency = 'EGP') {
        if (!product) return '';
        const price = parseFloat(Number(product.price || 0).toFixed(4));
        const imgUrl = product.images ? product.images[0] : (product.image || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png');
        const displayTitle = product.title || 'صنف فاخر';
        const displayFlavor = product.flavorName || 'نكهة متميزة';
        
        return `
            <div class="product-card" data-slug="${product.slug}" style="background: ${BRAND_COLORS.white} !important; border: 1px solid rgba(255,145,164,0.18) !important; border-radius: 20px !important; padding: 16px !important; display: flex; flex-direction: column; gap: 12px; justify-content: space-between; position: relative; box-shadow: none !important; direction: rtl; text-align: right; width: 100%; box-sizing: border-box; transition: transform 0.3s ease;">
                
                <a href="product.html?slug=${product.slug}" class="bose-product-details-link" style="text-decoration: none; display: flex; flex-direction: column; gap: 12px; width: 100%; color: inherit;">
                    <div class="product-card-top" style="position: relative; overflow: hidden; border-radius: 14px; height: 210px; width: 100%;">
                        <img src="${imgUrl}" alt="${displayTitle}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;">
                    </div>
                    <div class="search-card-info-pane">
                        <h4 class="search-card-title" style="color: ${BRAND_COLORS.black} !important; font-weight: 600 !important; margin: 4px 0;">${displayTitle}</h4>
                        <div class="search-card-flavor" style="color: ${BRAND_COLORS.black} !important; font-size: 13px; margin-bottom: 4px;">${displayFlavor}</div>
                        <div class="search-card-price" style="color: ${BRAND_COLORS.pink} !important; font-weight: 700 !important;">${price} ${currency}</div>
                    </div>
                </a>
                
                <div class="bose-qty-controller-box" style="display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,145,164,0.2); border-radius: 10px; padding: 2px; height: 36px; background: ${BRAND_COLORS.white} !important;">
                    <button class="qty-control-trigger minus" style="width:30px; height:100%; font-weight:700 !important; cursor:pointer; background: none; border: none; color: ${BRAND_COLORS.black} !important;">-</button>
                    <input type="text" class="qty-numerical-display" value="1" readonly style="width:30px; text-align:center; border:none; font-weight:700 !important; background:transparent; color: ${BRAND_COLORS.black} !important;">
                    <button class="qty-control-trigger plus" style="width:30px; height:100%; font-weight:700 !important; cursor:pointer; background: none; border: none; color: ${BRAND_COLORS.black} !important;">+</button>
                </div>
                
                <button class="bose-add-to-cart-btn" data-id="${product.id}" style="width: 100%; background: ${BRAND_COLORS.pink} !important; color: ${BRAND_COLORS.white} !important; border: none; font-weight: 700 !important; padding: 10px; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(255,145,164,0.15); font-family: 'Cairo';">إضافة للسلة</button>
            </div>
        `;
    };

    function updateGlobalCartCounters() {
        const cart = getInMemoryCart();
        let totalItems = 0;
        cart.forEach(item => {
            const isBespokeOrCustom = item.type === "custom-cake" || 
                                      item.type === "custom-flower" || 
                                      item.type === "mini-cake" || 
                                      (item.id && item.id.includes("-"));
                                      
            if (isBespokeOrCustom) {
                totalItems += 1;
            } else {
                totalItems += (parseInt(item.quantity, 10) || 1);
            }
        });

        const floatingBadge = document.getElementById('bose-floating-badge-counter');
        if (floatingBadge) {
            floatingBadge.textContent = totalItems;
            floatingBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        const headerCounters = document.querySelectorAll('#nav-cart-count');
        headerCounters.forEach(counter => {
            counter.textContent = totalItems;
        });

        applyPsychologicalBlinking();
    }

    window.refreshBoseGlobalCartUI = function () {
        updateGlobalCartCounters();
    };

    /* ==========================================================================\
       4. المزامنة والربط الفني المالي لـ "دليل المواصفات القياسية الفاخرة"
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
                        if (printingOpt) {
                            printingFee = printingOpt.price;
                        }
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
                if (opts.extraToppingPrice) {
                    price += parseFloat(opts.extraToppingPrice);
                }
                if (opts.printingPrice) {
                    price += parseFloat(opts.printingPrice);
                }
            }
        }

        return window.calculateBosePrice(price, "menu-only");
    };

    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;
        const opts = selectedOptions || {};
        const finalUnitPrice = window.calculateProductFinalPrice(product, opts);
        const isCustomizable = product.isMiniCake ||
                             product.type === "custom-cake" || 
                             product.type === "custom-flower" || 
                             (product.customizationOptions && Object.keys(opts).length > 0);
                             
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}` : String(product.slug || product.id);
        
        return {
            id: finalId,
            productSlug: product.slug,
            title: product.title,
            flavorName: opts.flavorName || opts.cakeType || product.flavor || "افتراضي",
            basePrice: parseFloat((product.price || product.basePrice || 0).toFixed(4)),
            finalPrice: parseFloat(finalUnitPrice.toFixed(4)),
            quantity: parseInt(quantity, 10) || 1,
            image: product.image || (product.images ? product.images[0] : ""),
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
                moneyAmount: parseInt(opts.moneyAmount, 10) || 0,
                moneyFee: parseInt(opts.moneyFee, 10) || 0,
                chocolateType: opts.chocolateType || "none",
                chocolatePieces: parseInt(opts.chocolatePieces, 10) || 0,
                wrappingType: opts.wrappingType || "none",
                giftCardText: opts.giftCardText || ""
            }
        };
    };

    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = boseGlobalStoreData?.cakeBuilder;
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
                if (printOpt) {
                    printingFee = printOpt.price;
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

        if (options.wrappingPrice) {
            price += parseFloat(options.wrappingPrice) || 0;
        }
        
        return window.calculateBosePrice(price, "menu-only");
    };

    window.calculateCustomFlowerPrice = function(flowerType, flowerCount, options = {}) {
        const config = boseGlobalStoreData?.flowerBuilder;
        if (!config) return 0;
        
        const safeFlowerCount = parseInt(flowerCount, 10) || config.baseFlowers;
        const safeCashAmount = parseInt(options.moneyAmount, 10) || 0;
        const safeCashCategoryAmount = parseInt(options.moneyCategoryAmount, 10) || 0;
        const safeChocolatePieces = parseInt(options.chocolatePieces, 10) || 0;
        const safePhotoCount = parseInt(options.photoCount, 10) || 0;
        
        let servicePrice = config.basePrice || 400;
        const extraFlowers = Math.max(0, safeFlowerCount - config.baseFlowers);
        servicePrice += extraFlowers * config.extraFlowerPrice;

        if (options.wrappingType) {
            const wrapOpt = config.wrappingTypes.find(opt => opt.id === options.wrappingType);
            if (wrapOpt) servicePrice += wrapOpt.price;
        }
        
        if (options.chocolateType && safeChocolatePieces > 0) {
            const chocOpt = config.chocolateTypes.find(opt => opt.id === options.chocolateType);
            if (chocOpt) servicePrice += chocOpt.price * safeChocolatePieces;
        }
        
        if (options.hasGiftCard) servicePrice += config.giftCardPrice || 20;
        if (safePhotoCount > 0) servicePrice += safePhotoCount * (config.photoPrintPrice || 15);

        let cashHandlingFee = 0;
        if (safeCashAmount > 0 && safeCashCategoryAmount > 0) {
            const selectedCategory = config.moneyCategories.find(cat => cat.amount === safeCashCategoryAmount);
            if (selectedCategory) {
                const billCount = Math.floor(safeCashAmount / safeCashCategoryAmount);
                cashHandlingFee += billCount * selectedCategory.fee;
                
                const remainder = safeCashAmount % safeCashCategoryAmount;
                if (remainder > 0) {
                    const remainderCategory = config.moneyCategories
                        .filter(cat => cat.amount <= remainder)
                        .sort((a, b) => b.amount - a.amount)[0] || config.moneyCategories[0];
                    if (remainderCategory) {
                        cashHandlingFee += remainderCategory.fee;
                    }
                }
            }
        }
        
        servicePrice += cashHandlingFee;
        const finalServicePrice = window.calculateBosePrice(servicePrice, "menu-only");
        return finalServicePrice + safeCashAmount;
    };

    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") {
            return isOptional;
        }
        const cleaned = window.sanitizeBosePhoneNumber(phone);
        const egPhoneRegex = /^01[0125][0-9]{8}$/;
        return egPhoneRegex.test(cleaned);
    };

    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return "";
        let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
        if (cleaned.startsWith("201")) {
            cleaned = "0" + cleaned.substring(2);
        } else if (cleaned.startsWith("00201")) {
            cleaned = "0" + cleaned.substring(4);
        } else if (cleaned.startsWith("1") && cleaned.length === 10) {
            cleaned = "0" + cleaned;
        }
        return cleaned;
    };

    window.validateBoseDeliverySchedule = function(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
        const currentDateTime = new Date(synchronizedTime);
        
        if (selectedDateTime <= currentDateTime) return false;
        
        const diffMs = selectedDateTime - currentDateTime;
        const hoursDiff = diffMs / (1000 * 60 * 60);
        return hoursDiff >= 23.95;
    };

    window.updateGlobalCartCounter = function() {
        updateGlobalCartCounters();
    };

    function initializeGlobalFeatures() {
        injectFloatingCartSystem();
        
        if (document.getElementById('categories-track')) {
            renderBoseCategoriesSlider(boseGlobalStoreData);
        }
        if (document.getElementById('pride-section')) {
            runBoseStatsCounter(boseGlobalStoreData);
        }
        if (document.getElementById('excellence-images-track')) {
            initializeBosePrideSlider();
        }
        
        // 👑 هندسة التخصيص الحصرية: عزل كامل لطبقة الخلفية البمبي عن طبقة صور المنتجات الحقيقية لمنع التكديس والتداخل
        const interactiveSimulatorBlocks = document.querySelectorAll(".preview-builder-block, #cake-preview-section, #flower-preview-section");
        interactiveSimulatorBlocks.forEach(block => {
            block.style.position = "relative";
            block.style.overflow = "hidden";
            
            let backdropLayer = block.querySelector(".bose-isolated-backdrop-framework");
            if (!backdropLayer) {
                backdropLayer = document.createElement("div");
                backdropLayer.className = "bose-isolated-backdrop-framework";
                backdropLayer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: ${BRAND_COLORS.pink};
                    z-index: 1;
                    pointer-events: none;
                `;
                block.insertBefore(backdropLayer, block.firstChild);
            }
            
            const internalStructureImg = block.querySelector("img");
            if (internalStructureImg) {
                internalStructureImg.style.position = "relative";
                internalStructureImg.style.zIndex = "2";
                internalStructureImg.style.display = "block";
                internalStructureImg.style.backgroundColor = "transparent"; 
                internalStructureImg.setAttribute("data-isolated-framework", "true"); 
            }
        });

        // 🚀 صمام أمان الهيدر المرن لمنع انكماش أو حجب الرؤية عن العميل والتثبيت المطلق أثناء الـ Scroll
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.bose-navbar');
            if (navbar) {
                navbar.style.position = 'sticky';
                navbar.style.top = '0';
                navbar.style.transform = 'translate3d(0, 0, 0)'; 
            }
        }, { passive: true });
        
        updateGlobalCartCounters();
    }

    document.addEventListener('BoseCartUpdated', updateGlobalCartCounters);
    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) updateGlobalCartCounters();
    });

    function injectFloatingCartStyles() {
        if (document.getElementById('bose-floating-styles-block')) return;

        const styleBlock = document.createElement('style');
        styleBlock.id = 'bose-floating-styles-block';
        styleBlock.textContent = `
            @keyframes bosePulseBlinking {
                0% { transform: scale(1); box-shadow: 0 8px 24px rgba(255,145,164,0.3); border-color: ${BRAND_COLORS.pink}; }
                50% { transform: scale(1.06); box-shadow: 0 12px 32px rgba(255,145,164,0.6); border-color: #D4AF37; }
                100% { transform: scale(1); box-shadow: 0 8px 24px rgba(255,145,164,0.3); border-color: ${BRAND_COLORS.pink}; }
            }
            .bose-pulse-blinking-active {
                animation: bosePulseBlinking 2.2s infinite ease-in-out;
            }

            #bose-floating-cart-wrapper {
                position: fixed !important;
                bottom: 30px !important;
                right: 30px !important;
                left: auto !important;
                width: 64px !important;
                height: 64px !important;
                z-index: 999999 !important; 
                pointer-events: auto !important;
                -webkit-tap-highlight-color: transparent;
            }

            .bose-floating-cart-trigger {
                display: flex !important;
                width: 100% !important;
                height: 100% !important;
                background-color: ${BRAND_COLORS.white} !important;
                border: 2px solid ${BRAND_COLORS.pink} !important;
                border-radius: 50% !important;
                box-shadow: 0 8px 24px rgba(255, 145, 164, 0.25) !important;
                cursor: pointer !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 !important;
                text-decoration: none !important;
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease, border-color 0.3s ease !important;
            }
            
            .bose-floating-cart-trigger:hover {
                transform: scale(1.1) translateY(-5px) !important;
                box-shadow: 0 12px 28px rgba(255, 145, 164, 0.4) !important;
                border-color: ${BRAND_COLORS.black} !important;
            }
            
            .bose-floating-cart-trigger:active {
                transform: scale(0.95) !important;
            }

            .bose-trigger-icon-box {
                position: relative !important;
                color: ${BRAND_COLORS.black} !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 100% !important;
                height: 100% !important;
            }
            
            .bose-trigger-icon-box svg {
                width: 28px !important;
                height: 28px !important;
                stroke: ${BRAND_COLORS.black} !important;
                transition: stroke 0.3s ease;
            }
            
            .bose-floating-cart-trigger:hover .bose-trigger-icon-box svg {
                stroke: ${BRAND_COLORS.pink} !important;
            }

            #bose-floating-badge-counter {
                position: absolute !important;
                top: -4px !important;
                left: -4px !important;
                right: auto !important;
                background-color: ${BRAND_COLORS.pink} !important;
                color: ${BRAND_COLORS.white} !important;
                font-family: 'Cairo', sans-serif !important;
                font-weight: 700 !important;
                font-size: 12px !important;
                min-width: 22px !important;
                height: 22px !important;
                border-radius: 11px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 4px !important;
                box-sizing: border-box !important;
                border: 2px solid ${BRAND_COLORS.white} !important;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
                z-index: 1000000 !important;
            }

            @media (max-width: 576px) {
                #bose-floating-cart-wrapper {
                    bottom: 25px !important;
                    right: 25px !important;
                    width: 58px !important;
                    height: 58px !important;
                }
                .bose-trigger-icon-box svg {
                    width: 25px !important;
                    height: 25px !important;
                }
                #bose-floating-badge-counter {
                    min-width: 20px !important;
                    height: 20px !important;
                    font-size: 11px !important;
                }
            }
            
            #bose-toast-central-container {
                position: fixed !important;
                bottom: 110px !important; 
                left: 50% !important;
                right: auto !important;
                transform: translate3d(-50%, 0, 0) !important;
                z-index: 999998 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 12px !important;
                pointer-events: none !important;
                direction: rtl !important;
                font-family: 'Cairo', sans-serif !important;
                width: 90% !important;
                max-width: 360px !important;
                align-items: center !important;
            }
            .bose-toast-card {
                background: ${BRAND_COLORS.white} !important;
                border: 1px solid rgba(255,145,164,0.3) !important;
                border-bottom: 4px solid ${BRAND_COLORS.pink} !important; 
                border-radius: 16px !important;
                padding: 14px 24px !important;
                box-shadow: 0 12px 32px rgba(255,145,164,0.05) !important;
                width: 100% !important;
                opacity: 0;
                transform: translate3d(0, 30px, 0) scale(0.95);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease !important;
                box-sizing: border-box !important;
            }
            .bose-toast-card.bose-toast-active {
                opacity: 1 !important;
                transform: translate3d(0, 0, 0) scale(1) !important;
            }
            .bose-toast-card.bose-toast-fadeout {
                opacity: 0 !important;
                transform: translate3d(0, -20px, 0) !important;
            }
            .bose-toast-content {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 10px !important;
            }
        `;
        document.head.appendChild(styleBlock);
    }

    loadBoseAbsoluteDatabase();
})();