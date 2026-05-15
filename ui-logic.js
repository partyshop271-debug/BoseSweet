/**
 * ============================================================================
 * 👑 BoseSweets Sovereign UI Logic Engine | المحرك البصري السيادي (V28.0)
 * ============================================================================
 * الإدارة المرجعية: حلويات بوسي
 * الوظيفة: دمج شامل ومطلق لملفات (ui-core, ui-builders, ui-interactions, ui-views)
 * للتواصل اللحظي مع العقل المركزي (core-engine.js) دون تضارب أو تأخير في رندر الواجهة.
 * هذا الملف هو حلقة الوصل بين أوامر الإدارة وتجربة العميل المرئية.
 */

import coreExports from './core-engine.js';
const { boseConfig, BoseState } = coreExports;

// ============================================================================
// 🎨 القسم الأول: النواة البصرية (UI Core) - الهوية والإعدادات العامة
// ============================================================================

export const getImgFallback = function(category) {
    try {
        return (BoseState.siteSettings && BoseState.siteSettings.brandLogo) 
            ? BoseState.siteSettings.brandLogo 
            : `${boseConfig.cloudinary.baseDeliveryUrl}v1712586716/logo_bose_gold.jpg`;
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'getImgFallback');
        return `${boseConfig.cloudinary.baseDeliveryUrl}v1712586716/logo_bose_gold.jpg`;
    }
};

export const getFinalDescription = function(productName, category) {
    try {
        if (BoseState.siteSettings?.catDescriptions && BoseState.siteSettings.catDescriptions[category]) {
            return BoseState.siteSettings.catDescriptions[category];
        }
        return "قطعة فنية من حلويات بوسي، صُنعت بعناية لتليق بذوقكم الرفيع.";
    } catch (error) {
        return "قطعة فنية من حلويات بوسي، صُنعت بعناية.";
    }
};

export const applySettingsToUI = function() {
    try {
        const root = document.documentElement;
        const s = BoseState.siteSettings;
        if (!s) return;

        // تطبيق الألوان السيادية القادمة من الإدارة
        const mainColor = (s.visuals && s.visuals.themeHex) ? s.visuals.themeHex : boseConfig.branding.colors.pink;
        const bgColor = (s.visuals && s.visuals.bgHex) ? s.visuals.bgHex : boseConfig.branding.colors.white;
        const textColor = (s.visuals && s.visuals.textHex) ? s.visuals.textHex : boseConfig.branding.colors.dark;

        root.style.setProperty('--site-color-theme', mainColor);
        root.style.setProperty('--site-bg', bgColor);
        root.style.setProperty('--site-text', textColor);
        
        if (s.visuals && s.visuals.fontFamily) root.style.setProperty('--site-font', s.visuals.fontFamily);

        const heroTitle = document.getElementById('hero-main-title');
        const heroDesc = document.getElementById('hero-main-desc');
        if(heroTitle) heroTitle.innerHTML = s.heroTitle || `أهلاً بكم في <br/><span style="color: ${mainColor}">حلويات بوسي</span>`;
        if(heroDesc) heroDesc.innerHTML = s.heroDesc || "الطعم الفاخر الذي تستحقه.";

        renderTicker();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'applySettingsToUI');
    }
};

export const renderTicker = function() {
    try {
        const t = document.getElementById('site-ticker');
        const s = BoseState.siteSettings;
        if(!t) return;
        
        if (s && s.tickerActive === false) {
            t.style.display = 'none';
        } else {
            t.style.display = 'block';
            t.innerHTML = `<div class="ticker-content" style="animation-duration: ${s.tickerSpeed || 20}s; color: ${s.tickerColor || '#fff'}; font-family: ${s.tickerFont || 'inherit'};">${s.tickerText || 'حلويات بوسي: طعم فاخر يليق بيك ✨'}</div>`;
            t.style.background = (s.visuals && s.visuals.themeHex) ? s.visuals.themeHex : boseConfig.branding.colors.pink;
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'renderTicker');
    }
};

// ============================================================================
// 🏗️ القسم الثاني: بناة المحتوى التفصيلي (UI Builders)
// ============================================================================

export const showProductDetails = function(productId) {
    try {
        const safeId = String(productId);
        const product = BoseState.catalog.find(p => String(p.id) === safeId);
        
        if (!product) {
            if(typeof window.showSystemToast === 'function') window.showSystemToast('نأسف لحضرتك، بيانات هذا المنتج قيد التحديث.', 'error');
            return;
        }

        const detailsContainer = document.getElementById('product-details-container');
        if (!detailsContainer) return;

        let rawImg = product.img || product.image || (product.images && product.images.length > 0 ? product.images[0] : getImgFallback(product.category));
        let finalImgUrl = (rawImg.startsWith('http')) ? rawImg : `${boseConfig.cloudinary.baseDeliveryUrl.replace(/\/$/, '')}/${rawImg.replace(/^\//, '')}`;

        const isCustomCake = product.category === 'تورت' || product.name.includes('مخصص');
        
        let html = `
            <div class="product-details-wrapper animate-fade-in" style="background: ${boseConfig.branding.colors.white}; border-radius: 2rem; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <div class="product-hero-image" style="width: 100%; height: 40vh; position: relative;">
                    <img src="${finalImgUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${product.name}" onerror="this.onerror=null; this.src='${getImgFallback()}';">
                    <button onclick="window.history.back()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.8); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; cursor: pointer; backdrop-filter: blur(5px);"><i data-lucide="arrow-right"></i></button>
                    <button onclick="window.shareProduct('${product.id}', '${product.name}')" style="position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.8); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; cursor: pointer; backdrop-filter: blur(5px);"><i data-lucide="share-2"></i></button>
                </div>
                <div class="product-info-content p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block" style="background: ${boseConfig.branding.colors.pink}20; color: ${boseConfig.branding.colors.pink};">${product.category}</span>
                            <h1 class="text-2xl font-black" style="color: ${boseConfig.branding.colors.dark};">${product.name}</h1>
                        </div>
                        <div class="text-xl font-black" style="color: ${boseConfig.branding.colors.pink};">${product.price} ج.م</div>
                    </div>
                    <p class="text-sm font-bold opacity-80 leading-relaxed mb-6" style="color: ${boseConfig.branding.colors.dark};">${product.desc || getFinalDescription(product.name, product.category)}</p>
                    
                    ${isCustomCake ? '<div id="cake-builder-injection"></div>' : ''}
                    
                    <div class="action-bar flex items-center justify-between gap-4 mt-6 pt-6" style="border-top: 1px dashed rgba(0,0,0,0.1);">
                        <div class="qty-controller flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-pink-100">
                            <button onclick="window.updateTempQtyContext(this, -1)" class="w-10 h-10 flex items-center justify-center rounded-full font-black text-lg" style="color: ${boseConfig.branding.colors.pink}; background: white;">-</button>
                            <span class="temp-qty-display font-black text-lg px-2" data-prod-id="${product.id}" style="color: ${boseConfig.branding.colors.dark};">1</span>
                            <button onclick="window.updateTempQtyContext(this, 1)" class="w-10 h-10 flex items-center justify-center rounded-full font-black text-lg" style="color: ${boseConfig.branding.colors.pink}; background: white;">+</button>
                        </div>
                        <button onclick="${isCustomCake ? 'window.commitCakeBuilderToCart()' : `if(window.addWithQtyContext) window.addWithQtyContext(this, '${product.id}'); else window.addToCart('${product.id}');`}" class="flex-1 py-3 rounded-full font-black text-white shadow-lg transition-transform hover:scale-105" style="background: ${boseConfig.branding.colors.pink};">إضافة للسلة 🛍️</button>
                    </div>
                </div>
            </div>
        `;

        detailsContainer.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
        if (isCustomCake) renderMultiStepCakeBuilder(product.id);

        renderRelatedProducts(product.category, product.id);

        // التوجيه البصري بسلاسة
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
        document.getElementById('product-details-view').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'showProductDetails');
    }
};

export const navigateToProduct = function(productId) {
    try {
        const url = new URL(window.location.href);
        url.searchParams.set('product', productId);
        window.history.pushState({ product: productId }, '', url);
        showProductDetails(productId);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'navigateToProduct');
    }
};

export const renderRelatedProducts = function(currentCategory, currentId) {
    try {
        const container = document.getElementById('related-products-container');
        if (!container) return;

        let related = BoseState.catalog.filter(p => p.category === currentCategory && String(p.id) !== String(currentId));
        if (related.length === 0) related = BoseState.catalog.filter(p => String(p.id) !== String(currentId));
        
        related = related.sort(() => 0.5 - Math.random()).slice(0, 4);

        if(window.renderProductCards) {
            window.renderProductCards(related, 'related-products-container');
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'renderRelatedProducts');
    }
};

export const renderCustomerSidebarCategories = function() {
    try {
        const container = document.getElementById('sidebar-categories-list');
        if (!container) return;

        const cats = BoseState.catMenu || [];
        container.innerHTML = cats.map(cat => `
            <button onclick="window.setCategory('${cat}'); window.toggleCustomerMenu();" class="w-full text-right p-3 rounded-xl font-bold text-sm hover:bg-pink-50 transition-colors" style="color: ${boseConfig.branding.colors.dark};">
                ${cat}
            </button>
        `).join('');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'renderCustomerSidebarCategories');
    }
};

export const renderCustomerGallery = function() {
    try {
        const container = document.getElementById('customer-gallery-grid');
        if (!container) return;

        if (BoseState.galleryData.length === 0) {
            container.innerHTML = '<p class="text-center w-full font-bold opacity-50 py-10">معرض الصور قيد التجهيز..</p>';
            return;
        }

        container.innerHTML = BoseState.galleryData.map(g => `
            <div class="gallery-item overflow-hidden rounded-2xl aspect-square bg-gray-100">
                <img src="${(g.url.startsWith('http')) ? g.url : boseConfig.cloudinary.baseDeliveryUrl + g.url}" class="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer" loading="lazy" alt="سابقة أعمال حلويات بوسي" onclick="window.openImageModal(this.src)">
            </div>
        `).join('');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'renderCustomerGallery');
    }
};

// ============================================================================
// 🎂 القسم الثالث: مصمم التورتات الملكية (Cake Builder)
// ============================================================================

export const renderMultiStepCakeBuilder = function(productId) {
    try {
        const injectPoint = document.getElementById('cake-builder-injection');
        if(!injectPoint) return;

        const s = BoseState.siteSettings?.cakeBuilder || { flavors: ['فانيليا', 'شيكولاتة', 'ريد فيلفت'], imagePrinting: [{label:'بدون', price:0}, {label:'صورة قابلة للأكل', price:60}] };
        
        let html = `
            <div class="cake-builder-box mt-4 p-4 rounded-2xl border" style="border-color: ${boseConfig.branding.colors.pink}40; background: #fffcfd;">
                <h3 class="text-sm font-black mb-3" style="color: ${boseConfig.branding.colors.dark};"><i data-lucide="pen-tool" class="inline w-4 h-4 mr-1" style="color: ${boseConfig.branding.colors.pink}"></i> صمم تورتتك بنفسك</h3>
                
                <div class="builder-step mb-3">
                    <label class="block text-xs font-bold mb-2 opacity-80">النكهة الأساسية (الكيك)</label>
                    <select onchange="window.updateCakeBuilderField('flavor', this.value)" class="w-full p-2 rounded-xl border text-xs outline-none" style="border-color: ${boseConfig.branding.colors.pink}40;">
                        ${s.flavors.map(f => `<option value="${f}" ${BoseState.cakeState.flavor === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>

                <div class="builder-step mb-3">
                    <label class="block text-xs font-bold mb-2 opacity-80">عدد الأفراد (الحجم)</label>
                    <div class="flex items-center gap-3">
                        <button onclick="window.adjustBuilderPersons(-1)" class="w-8 h-8 rounded-full border bg-white font-black" style="color: ${boseConfig.branding.colors.pink}; border-color: ${boseConfig.branding.colors.pink}40;">-</button>
                        <span id="builder-persons-display" class="font-black text-sm w-8 text-center">${BoseState.cakeState.persons}</span>
                        <button onclick="window.adjustBuilderPersons(1)" class="w-8 h-8 rounded-full border bg-white font-black" style="color: ${boseConfig.branding.colors.pink}; border-color: ${boseConfig.branding.colors.pink}40;">+</button>
                    </div>
                </div>

                <div class="builder-step mb-3">
                    <label class="block text-xs font-bold mb-2 opacity-80">طباعة الصورة</label>
                    <select onchange="window.updateCakeBuilderField('printing', this.value)" class="w-full p-2 rounded-xl border text-xs outline-none" style="border-color: ${boseConfig.branding.colors.pink}40;">
                        ${s.imagePrinting.map(p => `<option value="${p.label}" ${BoseState.cakeState.printing === p.label ? 'selected' : ''}>${p.label} (+${p.price} ج)</option>`).join('')}
                    </select>
                </div>

                <div class="builder-step mb-2">
                    <label class="block text-xs font-bold mb-2 opacity-80">ملاحظات دقيقة (كتابة اسم، ألوان معينة)</label>
                    <textarea onchange="window.updateCakeBuilderField('notes', this.value)" class="w-full p-2 rounded-xl border text-xs outline-none resize-none" rows="2" placeholder="اكتب هنا أي تفاصيل خاصة..." style="border-color: ${boseConfig.branding.colors.pink}40;">${BoseState.cakeState.notes}</textarea>
                </div>
            </div>
        `;

        injectPoint.innerHTML = html;
        if(window.lucide) lucide.createIcons();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'renderMultiStepCakeBuilder');
    }
};

export const updateCakeBuilderField = function(field, value) {
    try {
        BoseState.cakeState[field] = value;
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'updateCakeBuilderField');
    }
};

export const adjustBuilderPersons = function(delta) {
    try {
        BoseState.cakeState.persons += delta;
        if(BoseState.cakeState.persons < 2) BoseState.cakeState.persons = 2;
        if(BoseState.cakeState.persons > 50) BoseState.cakeState.persons = 50;
        
        const disp = document.getElementById('builder-persons-display');
        if(disp) disp.innerText = BoseState.cakeState.persons;
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'adjustBuilderPersons');
    }
};

// ============================================================================
// 🖱️ القسم الرابع: التفاعلات والعمليات المنطقية (UI Interactions)
// ============================================================================

export const updateTempQtyContext = function(btnElement, delta) {
    try {
        const displaySpan = btnElement.parentElement.querySelector('.temp-qty-display');
        if (!displaySpan) return;

        let currentQty = parseInt(displaySpan.innerText) || 1;
        currentQty += delta;

        if (currentQty < 1) currentQty = 1;
        if (currentQty > 50) {
            if(typeof window.showSystemToast === 'function') window.showSystemToast("الكمية المطلوبة كبيرة، سيتم التنسيق مع الإدارة لتأكيد التوافر.", "info");
            currentQty = 50;
        }
        displaySpan.innerText = currentQty;
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'updateTempQtyContext');
    }
};

export const toggleCustomerMenu = function() {
    try {
        const menu = document.getElementById('mobile-sidebar-menu');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        if (!menu || !overlay) return;

        if (menu.classList.contains('translate-x-full')) {
            menu.classList.remove('translate-x-full');
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            document.body.style.overflow = 'hidden';
            renderCustomerSidebarCategories();
        } else {
            menu.classList.add('translate-x-full');
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.classList.add('hidden'), 300);
            document.body.style.overflow = '';
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'toggleCustomerMenu');
    }
};

export const shareProduct = function(productId, productName) {
    try {
        const url = `${window.location.origin}${window.location.pathname}?product=${productId}`;
        if (navigator.share) {
            navigator.share({
                title: 'حلويات بوسي - طعم فاخر',
                text: `اكتشف ${productName} من حلويات بوسي!`,
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url).then(() => {
                if(typeof window.showSystemToast === 'function') window.showSystemToast('تم نسخ الرابط للمشاركة بنجاح ✨', 'success');
            });
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'shareProduct');
    }
};

// ============================================================================
// 🎬 القسم الخامس: السلايدر والشلال الديناميكي (Dynamic Presentation)
// ============================================================================

export function initMasterySlider() {
    try {
        const sliderContainer = document.getElementById('mastery-slider-container');
        if (!sliderContainer) return;

        // سحب الصور من المعرض لضمان الديناميكية
        const masteryImages = BoseState.galleryData.slice(0, 5).map(g => (g.url.startsWith('http') ? g.url : boseConfig.cloudinary.baseDeliveryUrl + g.url));
        if(masteryImages.length === 0) masteryImages.push(`${boseConfig.cloudinary.baseDeliveryUrl}v1712586716/logo_bose_gold.jpg`);

        let currentIndex = 0;

        const changeSlide = () => {
            sliderContainer.style.opacity = 0;
            setTimeout(() => {
                sliderContainer.innerHTML = `<img src="${masteryImages[currentIndex]}" style="width: 100%; height: 100%; object-fit: cover;" alt="إبداعات حلويات بوسي" loading="lazy">`;
                sliderContainer.style.opacity = 1;
                currentIndex = (currentIndex + 1) % masteryImages.length;
            }, 500); 
        };

        sliderContainer.style.transition = 'opacity 0.5s ease-in-out';
        changeSlide();
        
        // تبديل كل 10 ثواني (السرعة المعتمدة للمتصفح للحفاظ على الانتباه)
        setInterval(changeSlide, 10000);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'initMasterySlider');
    }
}

export function initDynamicSections() {
    try {
        if(window.distributeProductsToUI) window.distributeProductsToUI(BoseState.catalog);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'initDynamicSections');
    }
}

// ============================================================================
// 🔗 القسم السادس: الربط السيادي بنطاق النافذة (Global Window Bindings)
// ============================================================================

if (typeof window !== 'undefined') {
    try {
        window.getImgFallback = getImgFallback;
        window.getFinalDescription = getFinalDescription;
        window.applySettingsToUI = applySettingsToUI;
        window.renderTicker = renderTicker;
        
        window.showProductDetails = showProductDetails;
        window.navigateToProduct = navigateToProduct;
        window.renderRelatedProducts = renderRelatedProducts;
        window.renderMultiStepCakeBuilder = renderMultiStepCakeBuilder;
        window.updateCakeBuilderField = updateCakeBuilderField;
        window.adjustBuilderPersons = adjustBuilderPersons;
        window.renderCustomerSidebarCategories = renderCustomerSidebarCategories;
        window.renderCustomerGallery = renderCustomerGallery;

        window.updateTempQtyContext = updateTempQtyContext;
        window.toggleCustomerMenu = toggleCustomerMenu;
        window.shareProduct = shareProduct;

        window.initMasterySlider = initMasterySlider;
        window.initDynamicSections = initDynamicSections;
        
        console.log("👑 BoseSweets Engine: تم تفعيل المحرك البصري السيادي (UI Logic) بنجاح وربطه بالذاكرة المركزية.");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'Final Global Bindings');
    }
}
