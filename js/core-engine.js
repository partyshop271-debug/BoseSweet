/**
 * 👑 المحرك المركزي العام والنهائي للموقع والنافذة العائمة - حلويات بوسي 👑
 * النسخة الهندسية القياسية الشاملة بنسبة 100% - خالية تماماً من الثغرات البرمجية والمالية ومشاكل التداخل V56.0
 * متوافق بشكل مطلق وثنائي الاتجاه مع كافة ملفات css/ وجافا سكريبت الموقع وقاعدة البيانات data/site-data-final.json
 * [تم التحديث: جعل السلة العائمة طافية ومتحركة بشكل مطلق فوق كافة العناصر وحل مشكلة اختفاء الهيدر والفوتر تلقائياً]
 */

(function () {
    "use strict";

    // 🎨 نظام الألوان الحاكمة والمقدسة للعلامة التجارية للهندسة البصرية الرقمية (The Strict Palette)
    const BRAND_COLORS = {
        pink: "#FF91A4",  // نبض الحياة في الموقع
        white: "#FFFFFF", // المسيطر تماماً على الخلفيات والمساحات للتنفس البصري
        black: "#111111", // النصوص والعناوين فقط - معزول تماماً عن الظلال والخلفيات
        gold: "#D4AF37",  // وجود رمزي ناعم وخفيف جداً لفخامة اللوجو
        cream: "#FFF5F6"  // خلفية دافئة ناعمة للفواصل وكروت السلة
    };

    // 🔑 مفتاح تخزين السلة الموحد والثابت عبر كافة محركات الموقع لضمان التزامن الكامل
    const CART_STORAGE_KEY = 'bose_cart';
    
    // 🧠 ذاكرة البيانات المركزية للموقع (Global Singleton Pattern) لمنع تكرار الاتصال بالخادم
    let boseGlobalStoreData = null;
    let databaseReadyCallbacks = [];

    /* ==========================================================================\
       1. حارس التمهيد واستدعاء قاعدة البيانات المعتمدة data/site-data-final.json مع كسر الكاش المطلق
       ========================================================================== */
    async function loadBoseAbsoluteDatabase() {
        try {
            const boseLocation = window.location;
            
            // فحص إذا كنا داخل مجلد فرعي لإرجاع المسار للجذر
            let baseRootPath = "";
            const currentPath = boseLocation.pathname;
            if (currentPath.includes('/css/') || currentPath.includes('/js/') || currentPath.includes('/pages/') || currentPath.includes('/admin/')) {
                baseRootPath = "../";
            }

            const jsonPath = `${baseRootPath}data/site-data-final.json`;
            
            // 👑 [تقنية كسر كاش المتصفح الحتمية]: إضافة طابع زمني فريد لإجبار السيرفر على جلب النسخة المحدثة فوراً
            const cacheBuster = `?v=${Date.now()}`;
            
            const response = await fetch(jsonPath + cacheBuster);
            if (!response.ok) {
                const alternativePath = `${baseRootPath}site-data-final.json${cacheBuster}`;
                const fallbackResponse = await fetch(alternativePath);
                if (!fallbackResponse.ok) throw new Error(`فشل جلب البيانات من كافة المسارات القياسية: ${fallbackResponse.status}`);
                boseGlobalStoreData = await fallbackResponse.json();
            } else {
                boseGlobalStoreData = await response.json();
            }
            
            window.BoseStoreData = boseGlobalStoreData;
            
            injectEarlyDependencies();
            
            document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: boseGlobalStoreData }));
            
            databaseReadyCallbacks.forEach(callback => callback(boseGlobalStoreData));
            databaseReadyCallbacks = [];

            initializeGlobalFeatures();
            
            // 🛡️ [حارس الحقن والمطابقة]: تأمين عدم ضياع الهيدر والفوتر في صفحات المنيو والصفحات الأخرى والنافذة العائمة
            ensureSharedLayoutHubs(boseGlobalStoreData);
            
        } catch (error) {
            console.error("❌ خطأ حرج في تهيئة نظام حلويات بوسي الموحد:", error);
            injectFallbackErrorDisplay();
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

    function ensureSharedLayoutHubs(storeData) {
        if (!storeData) return;
        
        // 🛡️ [تأمين ذكي للهيدر]: إذا كان عنصر النافذة غير موجود في الـ HTML نقوم بخلطه وحقنه فوراً في أعلى الـ Body لضمان ظهوره
        let headerNode = document.querySelector('.bose-navbar');
        if (!headerNode) {
            headerNode = document.createElement('header');
            headerNode.className = 'bose-navbar';
            document.body.insertBefore(headerNode, document.body.firstChild);
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
                            <span id="nav-cart-count" class="bose-cart-counter-global">0</span>
                        </a>
                    </div>
                </div>
            `;
        }

        // 🛡️ [تأمين ذكي للفوتر]: إذا لم يكن وسم الفوتر موجوداً نقوم بخلطه وحقنه في أسفل الـ Body تلقائياً لراحة العميل النفسية
        let footerNode = document.querySelector('.bose-footer');
        if (!footerNode) {
            footerNode = document.createElement('footer');
            footerNode.className = 'bose-footer';
            document.body.appendChild(footerNode);
        }
        
        if (footerNode.innerHTML.trim() === "") {
            footerNode.innerHTML = `
                <div class="footer-inner-wrapper">
                    <div class="footer-logo-container">
                        <a href="index.html">
                            <img id="bose-store-logo" src="${storeData.store.logo}" alt="شعار حلويات بوسي">
                        </a>
                    </div>
                    <span class="brand-name-display footer-brand-name">حلويات بوسي</span>
                    <div class="footer-about-block">
                        <p id="footer-about-text">${storeData.footer.about}</p>
                    </div>
                    <div id="footer-social-links">
                        <a href="${storeData.social.facebook}" class="social-link-facebook" target="_blank"><i class="fab fa-facebook-f"></i></a>
                        <a href="${storeData.social.instagram}" class="social-link-instagram" target="_blank"><i class="fab fa-instagram"></i></a>
                        <a href="${storeData.social.tiktok}" class="social-link-tiktok" target="_blank"><i class="fab fa-tiktok"></i></a>
                        <a href="https://wa.me/2${storeData.store.phone}" class="social-link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>
                    </div>
                    <div class="footer-copyright-block">
                        <p>© <span id="copyright-year">2026</span> جميع الحقوق محفوظة لعلامة حلويات بوسي التجارية الفاخرة</p>
                    </div>
                </div>
            `;
        }
        
        // تأمين بقاء وعاء الدروج الجانبي للموبايل
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
        const toggleBtn = document.getElementById('mobile-menu-toggle') || document.querySelector('[aria-label="فتح قائمة التصفح"]');
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
                                <a href="product.html?slug=${prod.slug}" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 0.85rem; font-weight: 600; color: #333333; padding: 8px 16px; text-decoration: none; border-bottom: 1px solid rgba(255,145,164,0.05);">
                                    <span style="display: flex; align-items: center; gap: 6px;"><i class="fas fa-angle-left" style="color: ${BRAND_COLORS.pink}; font-size: 10px;"></i> ${prod.flavorName || prod.title}</span>
                                    <span style="font-size: 11px; color: ${BRAND_COLORS.pink}; font-weight: 700;">${Math.round(prod.price)} EGP</span>
                                </a>
                            `;
                        });
                    } else {
                        productLinksHTML = `
                            <a href="category.html?category=${cat.id}" style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 600; color: #666; padding: 10px 16px; text-decoration: none; font-style: italic;">
                                <i class="fas fa-cookie"></i> استعراض تشكيلة قسم ${cat.title}
                            </a>
                        `;
                    }
                    
                    accordionCategoriesHTML += `
                        <div class="sidebar-nested-category-block" style="border-bottom: 1px solid rgba(17,17,17,0.04);">
                            <div class="sidebar-sub-accordion-trigger" data-target="sub-cat-${cat.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; background: rgba(255,145,164,0.02);">
                                <span style="font-size: 0.88rem; font-weight: 700; color: ${BRAND_COLORS.black};"><i class="fas fa-chevron-left" style="font-size: 8px; color: ${BRAND_COLORS.gold}; margin-left: 6px;"></i> ${cat.title}</span>
                                <i class="fas fa-plus sub-accordion-plus-icon" style="font-size: 0.7rem; color: ${BRAND_COLORS.pink}; transition: transform 0.3s;"></i>
                            </div>
                            <div id="sub-cat-${cat.id}" class="sidebar-sub-accordion-content" style="max-height: 0px; overflow: hidden; transition: max-height 0.3s ease; display: flex; flex-direction: column; background: #FFFFFF; padding-right: 8px;">
                                ${productLinksHTML}
                            </div>
                        </div>
                    `;
                });
            }

            drawer.innerHTML = `
                <div class="sidebar-luxury-header" style="padding: 24px 20px; border-bottom: 1px solid ${BRAND_COLORS.cream}; display: flex; justify-content: space-between; align-items: center; background: ${BRAND_COLORS.white};">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${boseGlobalStoreData.store.logo}" style="width: 44px; height: 44px; object-fit: contain;" alt="لوجو بوسي الفاخر">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-family: 'Cairo'; font-weight: 700; font-size: 15px; color: ${BRAND_COLORS.black}; line-height: 1.3;">حلويات بوسي</span>
                            <span style="font-family: 'Cairo'; font-size: 11px; color: #777;">صنعناها بحب لتهديها لمن تحب</span>
                        </div>
                    </div>
                    <button id="sidebar-close-panel-btn" style="background: none; border: none; font-size: 28px; color: ${BRAND_COLORS.black}; cursor: pointer; line-height: 1; padding: 0 4px;">&times;</button>
                </div>
                <div class="sidebar-luxury-body" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: ${BRAND_COLORS.white};">
                    <span style="font-size: 11px; font-weight: 700; color: ${BRAND_COLORS.pink}; letter-spacing: 0.5px; margin-bottom: 4px; font-family: 'Cairo';">أقسام التصفح الأساسية</span>
                    
                    <a href="index.html" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; background: ${BRAND_COLORS.cream}; color: ${BRAND_COLORS.black}; font-weight: 700; font-size: 13px; text-decoration: none; font-family: 'Cairo';"><i class="fas fa-home" style="color: ${BRAND_COLORS.pink}; font-size: 15px;"></i> الواجهة الرئيسية للموقع</a>
                    
                    <div class="drawer-link-item" style="display: flex; flex-direction: column; gap: 4px;">
                        <div id="sidebar-menu-accordion-toggle" class="sidebar-accordion-trigger" style="display: flex; align-items: center; justify-content: space-between; font-size: 0.95rem; font-weight: 700; color: ${BRAND_COLORS.black}; padding: 10px 14px; border-radius: 12px; cursor: pointer; background: rgba(255,145,164,0.03);">
                            <span style="display: flex; align-items: center; gap: 10px;"><i class="fas fa-utensils" style="color: ${BRAND_COLORS.pink};"></i> المنيو حسب الفئة</span>
                            <i class="fas fa-chevron-down" style="font-size: 0.8rem; color: ${BRAND_COLORS.pink}; transition: transform 0.3s ease;"></i>
                        </div>
                        <div id="sidebar-menu-accordion-content" class="sidebar-accordion-content" style="max-height: 0px; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1); background-color: #FFF5F6; border-radius: 12px; display: flex; flex-direction: column; gap: 2px; padding: 0 4px; box-sizing: border-box;">
                            ${accordionCategoriesHTML}
                        </div>
                    </div>
                    
                    <a href="cart.html" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; color: ${BRAND_COLORS.black}; font-weight: 600; font-size: 13px; text-decoration: none; font-family: 'Cairo'; transition: 0.2s;"><i class="fas fa-shopping-bag" style="color: ${BRAND_COLORS.pink}; font-size: 15px;"></i> سلة المشتريات والطلبات</a>
                    
                    <div style="height: 1px; background: #F1F1F1; margin: 8px 0;"></div>
                    
                    <span style="font-size: 11px; font-weight: 700; color: ${BRAND_COLORS.pink}; letter-spacing: 0.5px; margin-bottom: 4px; font-family: 'Cairo';">أجنحة التخصيص والمحاكاة الفاخرة</span>
                    
                    <a href="cake-builder.html" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1px solid rgba(255,145,164,0.22); border-radius: 12px; color: ${BRAND_COLORS.black}; font-weight: 700; font-size: 13px; text-decoration: none; background: #FFFFFF; font-family: 'Cairo'; transition: 0.2s; box-shadow: 0 4px 12px rgba(255,145,164,0.03);"><span style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-birthday-cake" style="color: ${BRAND_COLORS.gold}; font-size: 16px;"></i> محاكي وتصميم التورت الحصري</span> <i class="fas fa-chevron-left" style="font-size: 11px; color: ${BRAND_COLORS.pink};"></i></a>
                    <a href="flower-builder.html" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1px solid rgba(255,145,164,0.22); border-radius: 12px; color: ${BRAND_COLORS.black}; font-weight: 700; font-size: 13px; text-decoration: none; background: #FFFFFF; font-family: 'Cairo'; transition: 0.2s; box-shadow: 0 4px 12px rgba(255,145,164,0.03);"><span style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-seedling" style="color: ${BRAND_COLORS.gold}; font-size: 16px;"></i> تنسيق بوكيهات الورد والمال الفاخرة</span> <i class="fas fa-chevron-left" style="font-size: 11px; color: ${BRAND_COLORS.pink};"></i></a>
                    
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
            <a href="category.html?category=${cat.id}" class="category-slide-card">
                <div style="width: 100%; aspect-ratio: 1/1; overflow: hidden; border-radius: 20px; border: 1px solid rgba(255, 145, 164, 0.2); background: ${BRAND_COLORS.cream}; position: relative;">
                    <img src="${cat.image}" alt="${cat.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy">
                </div>
                <h3 style="margin-top: 12px; font-size: 16px; font-weight: 700; color: #111111; text-align: center; font-family: 'Cairo';">${cat.title}</h3>
            </a>
        `).join('');

        let controlsContainer = document.getElementById('bose-categories-controls');
        if (!controlsContainer && wrapper) {
            controlsContainer = document.createElement('div');
            controlsContainer.id = 'bose-categories-controls';
            controlsContainer.style.cssText = `display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 20px; width: 100%; direction: rtl;`;
            
            let arrowsRow = document.createElement('div');
            arrowsRow.style.cssText = `display: flex; gap: 40px; align-items: center; justify-content: center;`;
            arrowsRow.innerHTML = `
                <button id="cat-arrow-prev" style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid ${BRAND_COLORS.pink}; background: ${BRAND_COLORS.white}; color: ${BRAND_COLORS.pink}; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: 0.2s;"><i class="fas fa-chevron-right"></i></button>
                <button id="cat-arrow-next" style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid ${BRAND_COLORS.pink}; background: ${BRAND_COLORS.white}; color: ${BRAND_COLORS.pink}; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: 0.2s;"><i class="fas fa-chevron-left"></i></button>
            `;
            
            const dotsRow = document.createElement('div');
            dotsRow.id = 'cat-dots-container';
            dotsRow.style.cssText = `display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap; max-width: 90%;`;
            dotsRow.innerHTML = cats.map((_, i) => `
                <span class="cat-dot ${i === 0 ? 'active' : ''}" data-index="${i}" style="width: 8px; height: 8px; border-radius: 50%; background: ${i === 0 ? BRAND_COLORS.pink : 'rgba(255,145,164,0.3)'}; cursor: pointer; transition: 0.3s;"></span>
            `).join('');

            controlsContainer.appendChild(arrowsRow);
            controlsContainer.appendChild(dotsRow);
            wrapper.appendChild(controlsContainer);

            let currentCatInx = 0;
            const cardWidth = 260; 

            function updateCatSliderPosition() {
                track.style.transform = `translate3d(${currentCatInx * cardWidth}px, 0px, 0px)`;
                
                document.querySelectorAll('.cat-dot').forEach((d, i) => {
                    if (i === currentCatInx) {
                        d.style.background = BRAND_COLORS.pink;
                        d.style.width = '24px';
                        d.style.borderRadius = '6px';
                        d.classList.add('active');
                    } else {
                        d.style.background = 'rgba(255,145,164,0.3)';
                        d.style.width = '8px';
                        d.style.borderRadius = '50%';
                        d.classList.remove('active');
                    }
                });
            }

            const prevBtn = document.getElementById('cat-arrow-prev');
            const nextBtn = document.getElementById('cat-arrow-next');
            
            if (prevBtn && nextBtn) {
                prevBtn.onclick = () => {
                    if (currentCatInx > 0) {
                        currentCatInx--;
                        updateCatSliderPosition();
                    }
                };
                nextBtn.onclick = () => {
                    if (currentCatInx < cats.length - 1) {
                        currentCatInx++;
                        updateCatSliderPosition();
                    }
                };
            }

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
                    currentIdx = parseInt(this.dataset.index, 10) + cloneCount;
                    scrollPrideToEach(true);
                    restartAutoPlay();
                };
                prideDotsContainer.appendChild(dot);
            });
            prideWrapper.appendChild(prideDotsContainer);
        }

        const cloneCount = originalSlides.length;
        
        originalSlides.forEach(slide => {
            const cloneAfter = slide.cloneNode(true);
            prideTrack.appendChild(cloneAfter);
        });
        
        for (let i = cloneCount - 1; i >= 0; i--) {
            const cloneBefore = originalSlides[i].cloneNode(true);
            prideTrack.insertBefore(cloneBefore, prideTrack.firstChild);
        }

        const totalSlides = prideTrack.children;
        let currentIdx = cloneCount; 
        let slideInterval = null;
        let isTransitioning = false;

        prideTrack.style.display = 'flex';
        prideTrack.style.transition = 'none';
        
        function getSlideWidth() {
            return totalSlides[0].offsetWidth + 16; 
        }

        function scrollPrideToEach(animate = true) {
            const slideWidth = getSlideWidth();
            if (animate) {
                prideTrack.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
                isTransitioning = true;
            } else {
                prideTrack.style.transition = 'none';
            }
            
            prideTrack.style.transform = `translateX(${currentIdx * slideWidth}px)`;
            
            let activeDotIndex = (currentIdx - cloneCount) % cloneCount;
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
            
            if (currentIdx >= cloneCount * 2) {
                prideTrack.style.transition = 'none';
                currentIdx = cloneCount;
                prideTrack.style.transform = `translateX(${currentIdx * slideWidth}px)`;
            } else if (currentIdx < cloneCount) {
                prideTrack.style.transition = 'none';
                currentIdx = cloneCount * 2 - 1;
                prideTrack.style.transform = `translateX(${currentIdx * slideWidth}px)`;
            }
        });

        function startAutoPlay() {
            slideInterval = setInterval(() => {
                if (isTransitioning) return;
                currentIdx++;
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
        prideTrack.addEventListener('touchstart', () => clearInterval(slideInterval), {passive: true});
        prideTrack.addEventListener('touchend', startAutoPlay, {passive: true});
        
        window.addEventListener('resize', () => {
            scrollPrideToEach(false);
        });
    }

    /* ==========================================================================\
       2. نظام الزر العائم الذكي والموحد (Floating Action Hub) للتوجيه إلى السلة الأصلية
       ========================================================================== */
    function injectFloatingCartSystem() {
        if (document.getElementById('bose-floating-cart-wrapper')) return;

        // بناء وعاء الزر العائم ليكون رابطاً مباشراً يقود إلى صفحة السلة الرسمية cart.html
        const container = document.createElement('div');
        container.id = 'bose-floating-cart-wrapper';

        const triggerLink = document.createElement('a');
        triggerLink.id = 'bose-floating-cart-trigger';
        triggerLink.href = 'cart.html';
        triggerLink.setAttribute('aria-label', 'الانتقال إلى صفحة سلة المشتريات الموحدة');
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

        // تفعيل النبض البصري في حال كانت السلة فارغة لتنبيه العميل بلطف للتصفح
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

    function saveInMemoryCart(cart) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        document.dispatchEvent(new CustomEvent('BoseCartUpdated'));
        applyPsychologicalBlinking();
    }

    window.showBoseToast = function (message, type = 'success') {
        let container = document.getElementById('bose-toast-central-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-central-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `bose-toast-card bose-toast-${type}`;
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
        }, 3500);
    };

    window.addAbsoluteProductToCart = function (productObject) {
        if (!productObject || !productObject.id) return;
        
        const cart = getInMemoryCart();
        const existingIndex = cart.findIndex(item => item.id === productObject.id && !item.customDetails?.isCustomized);
        
        if (existingIndex > -1) {
            cart[existingIndex].quantity = (Number(cart[existingIndex].quantity) || 1) + 1;
        } else {
            cart.push({
                id: productObject.id,
                productSlug: productObject.slug,
                title: productObject.title,
                flavorName: productObject.flavorName || "افتراضي",
                price: productObject.price,
                finalPrice: productObject.price,
                image: productObject.images ? productObject.images[0] : productObject.image,
                quantity: 1,
                type: productObject.type || "standard",
                customDetails: {}
            });
        }
        
        saveInMemoryCart(cart);
        window.showBoseToast(`تمت إضافة ${productObject.title} إلى السلة بنجاح 🌸`);
    };

    window.generateStrictProductCardHTML = function (product, currency = 'EGP') {
        if (!product) return '';
        const price = Math.round(Number(product.price || 0));
        const imgUrl = product.images ? product.images[0] : (product.image || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png');
        const displayTitle = product.title || product.name || 'منتج فاخر';
        const displayFlavor = product.flavorName || 'نكهة بوسي المميزة';
        const displayDesc = product.flavorDesc || product.description || '';
        
        return `
            <div class="product-card" data-slug="${product.slug}" style="background: ${BRAND_COLORS.white}; border: 1px solid rgba(255,145,164,0.18); border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 12px; justify-content: space-between; position: relative; box-shadow: 0 8px 32px rgba(255,145,164,0.04); direction: rtl; text-align: right; width: 100%; box-sizing: border-box; transition: transform 0.3s ease;">
                
                <a href="product.html?slug=${product.slug}" class="bose-product-details-link" style="text-decoration: none; display: flex; flex-direction: column; gap: 12px; width: 100%; color: inherit;">
                    <div class="product-card-top" style="position: relative; overflow: hidden; border-radius: 14px; height: 210px; width: 100%;">
                        <img src="${imgUrl}" alt="${displayTitle}" style="width: 100%; height: 100%; object-fit: cover; transition: 0.3s;" loading="lazy">
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 4px; width: 100%; margin-top: 4px;">
                        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: ${BRAND_COLORS.black}; font-family: 'Cairo'; line-height: 1.4;">${displayTitle}</h3>
                        <span style="font-size: 12px; font-weight: 700; color: ${BRAND_COLORS.pink}; font-family: 'Cairo';">${displayFlavor}</span>
                    </div>

                    <div class="product-card-info" style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                        <p style="margin: 0; font-size: 12px; color: #555; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 38px; font-family: 'Cairo';">${displayDesc}</p>
                    </div>
                    
                    <div class="product-card-price-block" style="margin: 4px 0; text-align: right; width: 100%;">
                        <span style="font-size: 17px; font-weight: 700; color: ${BRAND_COLORS.pink}; font-family: 'Cairo';">
                            ${price} <span style="font-size: 11px; font-weight: 600; color: ${BRAND_COLORS.black};">EGP</span>
                        </span>
                    </div>
                </a>
                
                <div class="bose-qty-controller-box" style="display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 145, 164, 0.2); border-radius: 10px; width: 100%; background: #FFFFFF; height: 38px; padding: 2px; box-sizing: border-box; margin: 4px 0;">
                    <button class="btn-qty-card-minus" style="border: none; background: transparent; width: 33%; height: 100%; font-weight: 700; font-size: 18px; color: ${BRAND_COLORS.black}; cursor: pointer; display: flex; align-items: center; justify-content: center;">-</button>
                    <input type="text" readonly class="input-qty-card-val" value="1" style="width: 34%; text-align: center; border: none; font-size: 14px; font-weight: 700; color: ${BRAND_COLORS.black}; background: transparent; padding:0; font-family: 'Cairo';">
                    <button class="btn-qty-card-plus" style="border: none; background: transparent; width: 33%; height: 100%; font-weight: 700; font-size: 18px; color: ${BRAND_COLORS.black}; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
                </div>

                <div class="product-card-action-row" style="width: 100%; margin-top: 2px;">
                    <button class="bose-add-to-cart-btn" data-id="${product.id}" style="width: 100%; background-color: ${BRAND_COLORS.pink}; color: ${BRAND_COLORS.white}; border: none; height: 44px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Cairo'; box-shadow: 0 4px 12px rgba(255,145,164,0.15);">
                        <i class="fas fa-shopping-cart bose-btn-cart-icon"></i>
                        <span class="bose-btn-text-label">إضافة للسلة</span>
                    </button>
                </div>
            </div>
        `;
    };

    window.attachProductCardEvents = function (containerElement, productsList, currency) {
        if (!containerElement || !productsList) return;
        
        containerElement.querySelectorAll('.product-card').forEach(card => {
            const plusBtn = card.querySelector('.btn-qty-card-plus');
            const minusBtn = card.querySelector('.btn-qty-card-minus');
            const qtyInput = card.querySelector('.input-qty-card-val');

            if (plusBtn && minusBtn && qtyInput) {
                plusBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    let currentVal = parseInt(qtyInput.value, 10) || 1;
                    qtyInput.value = currentVal + 1;
                };

                minusBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    let currentVal = parseInt(qtyInput.value, 10) || 1;
                    if (currentVal > 1) {
                        qtyInput.value = currentVal - 1;
                    }
                };
            }
        });

        containerElement.querySelectorAll('.bose-add-to-cart-btn').forEach(btn => {
            btn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation(); 
                
                const currentButton = this;
                const prodId = currentButton.dataset.id;
                const matchedProduct = productsList.find(p => String(p.id) === String(prodId));
                const cardNode = currentButton.closest('.product-card');
                const qtyInput = cardNode ? cardNode.querySelector('.input-qty-card-val') : null;
                const selectedQuantity = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;

                if (matchedProduct) {
                    const cart = getInMemoryCart();
                    const existingIndex = cart.findIndex(item => item.id === matchedProduct.id && !item.customDetails?.isCustomized);
                    
                    if (existingIndex > -1) {
                        cart[existingIndex].quantity = (Number(cart[existingIndex].quantity) || 1) + selectedQuantity;
                    } else {
                        cart.push({
                            id: matchedProduct.id,
                            productSlug: matchedProduct.slug,
                            title: matchedProduct.title,
                            flavorName: matchedProduct.flavorName || "افتراضي",
                            price: matchedProduct.price,
                            finalPrice: matchedProduct.price,
                            image: matchedProduct.images ? matchedProduct.images[0] : matchedProduct.image,
                            quantity: selectedQuantity,
                            type: matchedProduct.type || "standard",
                            customDetails: {}
                        });
                    }
                    
                    saveInMemoryCart(cart);
                    
                    const iconNode = currentButton.querySelector('.bose-btn-cart-icon');
                    const textNode = currentButton.querySelector('.bose-btn-text-label');
                    
                    if (iconNode && textNode) {
                        iconNode.className = "fas fa-check bose-btn-cart-icon";
                        textNode.textContent = "تمت الإضافة بنجاح ✨";
                        currentButton.style.backgroundColor = "#2ECC71";
                        
                        setTimeout(() => {
                            iconNode.className = "fas fa-shopping-cart bose-btn-cart-icon";
                            textNode.textContent = "إضافة للسلة";
                            currentButton.style.backgroundColor = BRAND_COLORS.pink;
                        }, 2000);
                    }

                    window.showBoseToast(`تمت إضافة ${selectedQuantity} من ${matchedProduct.title} بنجاح لراحتك 🌸`);
                    if (qtyInput) qtyInput.value = 1;
                }
            };
        });
    };

    function updateGlobalCartCounters() {
        const cart = getInMemoryCart();
        let totalItems = 0;
        cart.forEach(item => {
            totalItems += (Number(item.quantity) || 1);
        });

        const floatingBadge = document.getElementById('bose-floating-badge-counter');
        if (floatingBadge) {
            floatingBadge.textContent = totalItems;
            floatingBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        const headerCounters = document.querySelectorAll('.cart-count, #cart-badge-count, .bose-cart-counter-global, #nav-cart-count');
        headerCounters.forEach(counter => {
            counter.textContent = totalItems;
        });

        applyPsychologicalBlinking();
    }

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
                50% { transform: scale(1.06); box-shadow: 0 12px 32px rgba(255,145,164,0.6); border-color: ${BRAND_COLORS.gold}; }
                100% { transform: scale(1); box-shadow: 0 8px 24px rgba(255,145,164,0.3); border-color: ${BRAND_COLORS.pink}; }
            }
            .bose-pulse-blinking-active {
                animation: bosePulseBlinking 2.2s infinite ease-in-out;
            }

            /* 👑 [تثبيت وحماية السلة العائمة فوق الفوتر وكافة العناصر] */
            #bose-floating-cart-wrapper {
                position: fixed !important;
                bottom: 24px !important;
                left: 24px !important;
                width: 64px !important;
                height: 64px !important;
                z-index: 9999999 !important;
                pointer-events: auto !important;
            }

            #bose-floating-cart-trigger {
                display: flex !important;
                width: 100% !important;
                height: 100% !important;
                background-color: ${BRAND_COLORS.white} !important;
                border: 2px solid ${BRAND_COLORS.pink} !important;
                border-radius: 50% !important;
                box-shadow: 0 8px 32px rgba(255,145,164,0.25) !important;
                cursor: pointer !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 !important;
                text-decoration: none !important;
                transition: transform 0.2s ease, box-shadow 0.2s ease !important;
            }
            #bose-floating-cart-trigger:hover {
                transform: scale(1.08) !important;
                box-shadow: 0 12px 40px rgba(255,145,164,0.4) !important;
            }
            .bose-trigger-icon-box {
                position: relative !important;
                color: ${BRAND_COLORS.black} !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            #bose-floating-badge-counter {
                position: absolute !important;
                top: -12px !important;
                right: -12px !important;
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
                z-index: 10000000 !important;
            }
            
            #bose-toast-central-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 9999999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
                direction: rtl;
                font-family: 'Cairo', sans-serif;
            }
            .bose-toast-card {
                background: ${BRAND_COLORS.white};
                border-left: 4px solid ${BRAND_COLORS.pink};
                border-radius: 8px;
                padding: 14px 20px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                min-width: 280px;
                max-width: 360px;
                opacity: 0;
                transform: translateX(50px);
                transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.35s ease;
            }
            .bose-toast-card.bose-toast-active {
                opacity: 1;
                transform: translateX(0);
            }
            .bose-toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .bose-toast-text {
                margin: 0;
                font-size: 13px;
                color: ${BRAND_COLORS.black};
                font-weight: 600;
            }
        `;
        document.head.appendChild(styleBlock);
    }

    function injectFallbackErrorDisplay() {
        if (document.getElementById('bose-db-fallback-error')) return;
        const errorDiv = document.createElement('div');
        errorDiv.id = "bose-db-fallback-error";
        errorDiv.style.cssText = `position:fixed; bottom:16px; right:16px; background-color:${BRAND_COLORS.cream}; border:1px solid ${BRAND_COLORS.pink}; padding:12px 20px; border-radius:8px; z-index:999999; direction:rtl; font-size:14px; font-family:Cairo;`;
        errorDiv.textContent = 'عذراً، هناك صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة لراحتك.';
        document.body.appendChild(errorDiv);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadBoseAbsoluteDatabase);
    } else {
        loadBoseAbsoluteDatabase();
    }

})();
