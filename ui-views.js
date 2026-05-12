/**
 * 👑 BoseSweets UI View Management (V24.3 - Sovereign Architecture Protocol)
 * مهندس عرض الواجهات والتنقل - علامة حلويات بوسي
 * تم التحصين الشامل: تطبيق التوجيهات الهندسية (Grid Protocol) وفرض نظام الكروت بصرامة،
 * حماية واجهات الشلال، وتأمين التبويبات الذكية لقسم الديسباسيتو ضد الشاشات الفارغة.
 */

import { dSizes, fTypes } from './config.js';
import { siteSettings, catalog, catMenu, state } from './state.js';
import { MemoryManager, escapeHTML, optimizeCloudinaryUrl } from './utils.js';

// 👑 1. إصلاح اختفاء "الشلال" و"الشريط العلوي" (Sovereign Routing)
export const showHomeView = function() {
    try {
        // إخفاء الواجهات الفرعية فقط والإبقاء على الهيكل الأساسي
        ['view-menu', 'view-tips', 'view-cake-builder', 'view-product-details', 'menu-view', 'product-details-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) { 
                el.classList.add('hidden'); 
                el.style.display = 'none'; 
                el.style.opacity = '0'; 
            }
        });
        
        // إظهار الصفحة الرئيسية والعناصر التابعة لها بصرامة
        const vHome = document.getElementById('view-home') || document.getElementById('home-view'); 
        if(vHome) { 
            vHome.classList.remove('hidden'); 
            vHome.style.display = 'block'; 
            vHome.style.opacity = '1';
        }
        
        // إخفاء التقييمات والترشيحات من الصفحة الرئيسية لعدم التضارب
        const reviewsSec = document.getElementById('global-reviews-section');
        const relatedSec = document.getElementById('related-products-area');
        if(reviewsSec) { reviewsSec.classList.add('hidden'); reviewsSec.style.display = 'none'; }
        if(relatedSec) { relatedSec.classList.add('hidden'); relatedSec.style.display = 'none'; }

        // تفعيل المحركات الأساسية فوراً لضمان عدم الاختفاء (التحصين الشامل)
        if(window.renderTicker) window.renderTicker();
        if(window.initWaterfall) window.initWaterfall();
        if(window.initHomepageSections) window.initHomepageSections();
        
        if(window.setActiveCategoryPill) window.setActiveCategoryPill('الرئيسية');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.error("BoseSweets Error في عرض الرئيسية: ", e); }
};
window.showHomeView = showHomeView;

export const showMenuView = function() {
    try {
        ['view-home', 'view-tips', 'view-cake-builder', 'view-product-details', 'home-view', 'product-details-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) { el.classList.add('hidden'); el.style.display = 'none'; el.style.opacity = '0'; }
        });
        const vMenu = document.getElementById('view-menu') || document.getElementById('menu-view'); 
        if(vMenu) { 
            vMenu.classList.remove('hidden'); 
            vMenu.style.display = 'flex'; 
            vMenu.style.opacity = '1';
        }
        
        const reviewsSec = document.getElementById('global-reviews-section');
        const relatedSec = document.getElementById('related-products-area');
        if(reviewsSec) { reviewsSec.classList.remove('hidden'); reviewsSec.style.display = 'block'; }
        if(relatedSec) { relatedSec.classList.remove('hidden'); relatedSec.style.display = 'block'; }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.warn("BoseSweets: استثناء أثناء عرض المنيو", e); }
};
window.showMenuView = showMenuView;

export const showGoldenTips = function() {
    try {
        ['view-home', 'view-menu', 'view-cake-builder', 'view-product-details', 'home-view', 'menu-view', 'product-details-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) { el.classList.add('hidden'); el.style.display = 'none'; }
        });
        const vTips = document.getElementById('view-tips'); 
        if(vTips) { 
            vTips.classList.remove('hidden'); 
            vTips.style.display = 'flex'; 
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.warn("BoseSweets: استثناء أثناء عرض الدليل", e); }
};
window.showGoldenTips = showGoldenTips;

export const showCakeBuilderView = function() {
    try {
        ['view-home', 'view-menu', 'view-tips', 'view-product-details', 'home-view', 'menu-view', 'product-details-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) { el.classList.add('hidden'); el.style.display = 'none'; }
        });
        const vCake = document.getElementById('view-cake-builder'); 
        if(vCake) { vCake.classList.remove('hidden'); vCake.style.display = 'block'; }
        
        window.currentBuilderStep = 1;
        if(window.renderMultiStepCakeBuilder) window.renderMultiStepCakeBuilder();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.warn("BoseSweets: استثناء أثناء عرض صانع التورت", e); }
};
window.showCakeBuilderView = showCakeBuilderView;

export const openGlobalLightbox = function(imgUrl) {
    const lightbox = document.getElementById('global-image-lightbox');
    const mainImg = document.getElementById('lightbox-main-img');
    if(lightbox && mainImg) {
        mainImg.src = imgUrl;
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        lightbox.style.display = 'flex';
        setTimeout(() => { lightbox.classList.remove('opacity-0'); mainImg.classList.remove('scale-95'); mainImg.classList.add('scale-100'); }, 10);
    }
};
window.openGlobalLightbox = openGlobalLightbox;

export const closeGlobalLightbox = function() {
    const lightbox = document.getElementById('global-image-lightbox');
    const mainImg = document.getElementById('lightbox-main-img');
    if(lightbox && mainImg) {
        lightbox.classList.add('opacity-0');
        mainImg.classList.remove('scale-100');
        mainImg.classList.remove('scale-95');
        setTimeout(() => { lightbox.classList.add('hidden'); lightbox.classList.remove('flex'); lightbox.style.display = 'none'; }, 300);
    }
};
window.closeGlobalLightbox = closeGlobalLightbox;

// 👑 3. تفعيل "تبويبات الديسباسيتو" (Sovereign State Control)
export const setSub = function(type, val) {
    if (type === 's') state.dSize = val;
    if (type === 'f') state.fType = val;
    // إجبار إعادة الرسم فوراً لتحديث الكروت بناءً على المقاس المختار
    if(window.renderMainDisplay) window.renderMainDisplay();
};
window.setSub = setSub;

// 👑 هندسة الشلال (Waterfall - التحصين ضد الاختفاء)
export const initWaterfall = function() {
    try {
        const col1 = document.getElementById('waterfall-col-1');
        const col2 = document.getElementById('waterfall-col-2');
        const waterfallContainer = document.getElementById('section-waterfall'); 
        
        if (waterfallContainer) {
            waterfallContainer.classList.remove('hidden');
            waterfallContainer.style.display = 'block';
            waterfallContainer.style.opacity = '1';
        }

        if (!col1 || !col2) return;

        const visualItems = catalog.filter(p => p && p.isActive !== false && (p.img || (p.images && p.images.length > 0)));
        
        if (visualItems.length === 0) {
            col1.innerHTML = `<div class="text-center py-10 text-[var(--site-text)] opacity-50 font-bold col-span-2">نجهز لكم أصنافاً جديدة فاخرة.. انتظرونا ✨</div>`;
            col2.innerHTML = '';
            return;
        }

        const half = Math.ceil(visualItems.length / 2);
        const leftItems = visualItems.slice(0, half);
        const rightItems = visualItems.slice(half);

        const buildCardHTML = (item) => {
            const rawImageUrl = (item.images && item.images.length > 0) ? item.images[0] : (item.img || window.getImgFallback(item.category));
            const url = optimizeCloudinaryUrl(rawImageUrl);

            return `
                <div class="waterfall-card cursor-pointer group relative bg-[#ffffff] rounded-[2rem] overflow-hidden shadow-sm border border-[var(--brand-primary)]/10 mb-4 animate-fade-in" onclick="window.navigateToProduct('${item.id}')" title="اضغط لاستعراض تفاصيل ${escapeHTML(item.name)}">
                    <img src="${url}" loading="lazy" decoding="async" class="transition-transform duration-500 group-hover:scale-105 w-full h-auto object-cover" alt="صنف ${escapeHTML(item.name)} من قسم ${escapeHTML(item.category)} - حلويات بوسي" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(item.category)}');">
                    <div class="absolute inset-x-0 bottom-0 bg-[#ffffff]/90 backdrop-blur-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start border-t-2 border-[var(--brand-primary)]">
                        <span class="text-[var(--brand-primary)] text-xs font-bold truncate tracking-wide w-full">${escapeHTML(item.name)}</span>
                    </div>
                </div>`;
        };

        col1.innerHTML = leftItems.map(buildCardHTML).join('');
        col2.innerHTML = rightItems.map(buildCardHTML).join('');
    } catch(e) { console.error("BoseSweets: استثناء في محرك الشلال", e); }
};
window.initWaterfall = initWaterfall;

export const initHomepageSections = function() {
    try {
        const sectionBS = document.getElementById('section-bestsellers');
        const sectionNA = document.getElementById('section-newarrivals');
        const bsContainer = document.getElementById('bestsellers-container');
        const naContainer = document.getElementById('newarrivals-container');
        
        if (bsContainer && naContainer) {
            const bestSellers = catalog.filter(p => p.isActive !== false && p.badge && (p.badge.includes('مبيعاً') || p.badge.includes('مبيعات'))).slice(0, 8);
            const newArrivals = catalog.filter(p => p.isActive !== false && p.badge && (p.badge.includes('جديد') || p.badge.includes('🌟'))).slice(0, 8);

            const fallbackBS = bestSellers.length > 0 ? bestSellers : catalog.filter(p => p.isActive !== false).slice(0, 6);
            const fallbackNA = newArrivals.length > 0 ? newArrivals : catalog.filter(p => p.isActive !== false).slice().reverse().slice(0, 6);

            if (bsContainer && fallbackBS.length > 0) {
                if(sectionBS) { sectionBS.classList.remove('hidden'); sectionBS.style.display = 'block'; }
                bsContainer.innerHTML = fallbackBS.map(p => `<div class="shrink-0 w-[300px] snap-center">${window.drawProductCard(p)}</div>`).join('');
            } else { if(sectionBS) { sectionBS.classList.add('hidden'); sectionBS.style.display = 'none'; } }

            if (naContainer && fallbackNA.length > 0) {
                if(sectionNA) { sectionNA.classList.remove('hidden'); sectionNA.style.display = 'block'; }
                naContainer.innerHTML = fallbackNA.map(p => `<div class="shrink-0 w-[300px] snap-center">${window.drawProductCard(p)}</div>`).join('');
            } else { if(sectionNA) { sectionNA.classList.add('hidden'); sectionNA.style.display = 'none'; } }
        }

        let dynContainer = document.getElementById('dynamic-sections-container');
        const homeView = document.getElementById('view-home') || document.getElementById('home-view');
        
        if (homeView && siteSettings.dynamicSections && siteSettings.dynamicSections.length > 0) {
            if (!dynContainer) {
                dynContainer = document.createElement('div');
                dynContainer.id = 'dynamic-sections-container';
                dynContainer.className = 'w-full flex flex-col gap-12 mt-12';
                if (sectionNA && sectionNA.parentNode) sectionNA.parentNode.insertBefore(dynContainer, sectionNA.nextSibling);
                else homeView.appendChild(dynContainer);
            }
            
            const activeDynSections = siteSettings.dynamicSections.filter(s => s.active).sort((a,b) => (a.order || 0) - (b.order || 0));
            
            dynContainer.innerHTML = activeDynSections.map(sec => {
                const sectionProducts = catalog.filter(p => p.isActive !== false && p.badge && p.badge.includes(sec.title)).slice(0, 8);
                if (sectionProducts.length === 0) return ''; 
                
                let itemsHtml = (sec.type === 'slider') 
                    ? `<div class="relative w-full"><div id="dyn-slider-${sec.id}" class="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar scroll-smooth pl-4">${sectionProducts.map(p => `<div class="shrink-0 w-[300px] snap-center">${window.drawProductCard(p)}</div>`).join('')}</div></div>`
                    : `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">${sectionProducts.map(p => window.drawProductCard(p)).join('')}</div>`;

                return `
                <section class="w-full relative z-10 animate-fade-in mb-8">
                    <div class="px-6 md:px-12 mb-8 flex justify-between items-end border-r-4 border-[var(--brand-primary)]">
                        <div>
                            <h2 class="text-3xl font-black text-[var(--site-text)] leading-tight">${escapeHTML(sec.title)}</h2>
                            <p class="text-[var(--brand-primary)] text-sm font-bold mt-2 tracking-wide">أحدث الإضافات لعلامة حلويات بوسي</p>
                        </div>
                    </div>
                    ${itemsHtml}
                </section>`;
            }).join('');
        } else if (dynContainer) { dynContainer.innerHTML = ''; }
        
        if (window.lucide) lucide.createIcons();
        if (typeof window.setupSliderButtons === 'function') window.setupSliderButtons();
    } catch(e) { console.error("BoseSweets: استثناء في محرك الأقسام الديناميكية", e); }
};
window.initHomepageSections = initHomepageSections;

export const setupSliderButtons = function() {
    const attachScroll = (btnId, sliderId, direction) => {
        const btn = document.getElementById(btnId);
        const slider = document.getElementById(sliderId);
        if(btn && slider) {
            btn.onclick = () => { slider.scrollBy({ left: direction === 'right' ? 300 : -300, behavior: 'smooth' }); };
        }
    };
    attachScroll('bs-next', 'bestsellers-slider-home', 'left');
    attachScroll('bs-prev', 'bestsellers-slider-home', 'right');
    attachScroll('na-next', 'new-arrivals-slider-home', 'left');
    attachScroll('na-prev', 'new-arrivals-slider-home', 'right');
};
window.setupSliderButtons = setupSliderButtons;

export const renderCategories = function() {
    try {
        const el = document.getElementById('categories-nav') || document.getElementById('categories-scroll') || document.getElementById('categories-container');
        if(!el) return;
        
        el.classList.remove('hidden');
        el.style.display = 'flex'; 

        const sortedCats = [...catMenu].sort((a, b) => (a.order || 99) - (b.order || 99));

        let html = `<button id="cat-btn-الرئيسية" onclick="window.setCategory('الرئيسية')" class="cat-pill whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-2xl font-bold transition-all border-2 text-sm sm:text-base ${state.activeCat === 'الرئيسية' ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-lg' : 'bg-[#ffffff] text-[var(--site-text)] border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">الرئيسية</button>`;

        html += sortedCats.map(c => {
            const catName = c.name || c;
            const safeId = String(catName).replace(/\s+/g, '-');
            const isActive = state.activeCat === catName;
            const displayName = catName === 'ورد' ? 'ورد وهدايا 💐' : (catName === 'تورت' ? 'تورت وتصميم 🎂' : catName);
            
            return `<button id="cat-btn-${safeId}" onclick="window.setCategory('${catName}')" class="cat-pill whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-2xl font-bold transition-all border-2 text-sm sm:text-base ${isActive ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-lg' : 'bg-[#ffffff] text-[var(--site-text)] border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">${displayName}</button>`;
        }).join('');
        
        el.innerHTML = html;
    } catch(e) { console.error("BoseSweets: خطأ أثناء عرض الأقسام اللحظية", e); }
};
window.renderCategories = renderCategories;

export const setActiveCategoryPill = function(catName) {
    try {
        document.querySelectorAll('.cat-pill').forEach(btn => {
            btn.classList.remove('bg-[var(--brand-primary)]', 'text-[#ffffff]', 'shadow-lg');
            btn.classList.add('bg-[#ffffff]', 'text-[var(--site-text)]');
        });
        const safeId = String(catName).replace(/\s+/g, '-');
        const activeBtn = document.getElementById(`cat-btn-${safeId}`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-[#ffffff]', 'text-[var(--site-text)]');
            activeBtn.classList.add('bg-[var(--brand-primary)]', 'text-[#ffffff]', 'shadow-lg');
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    } catch(e) {}
};
window.setActiveCategoryPill = setActiveCategoryPill;

export const renderFlowerTabs = function(container) {
    if(!container) return;
    container.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border-2 bg-[#ffffff] border-[var(--brand-primary)] flex flex-wrap justify-center gap-2">${fTypes.map(f => `<button onclick="window.setSub('f', '${f}')" class="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border-2 ${state.fType === f ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)]' : 'bg-[#ffffff] text-[var(--site-text)] border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">${f}</button>`).join('')}</div>`;
};
window.renderFlowerTabs = renderFlowerTabs;

export const enforceCategoryRender = function(containerId, productsHTML) {
    const container = document.getElementById(containerId);
    if (container) {
        try {
            const fragment = document.createDocumentFragment();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = productsHTML;
            while (tempDiv.firstChild) { fragment.appendChild(tempDiv.firstChild); }
            container.innerHTML = ''; 
            container.appendChild(fragment);
            container.classList.remove('hidden'); 
            if (!container.className.includes('grid') && !container.className.includes('flex')) {
                container.style.display = 'block'; 
            }
        } catch(e) { console.error("BoseSweets: خطأ أثناء عرض المنتجات", e); }
    }
};
window.enforceCategoryRender = enforceCategoryRender;

// 👑 2. تطبيق نظام "الكارتين" و"الكارت الواحد" (Grid Protocol المحسن)
export const renderMainDisplay = function() {
    try {
        const catDescArea = document.getElementById('category-description-area');
        const catNameEl = document.getElementById('current-cat-name');
        const catDescEl = document.getElementById('current-cat-desc');

        if (catDescArea && state.activeCat !== 'الرئيسية' && state.activeCat !== 'تورت') {
            catDescArea.classList.remove('hidden');
            catDescArea.style.display = 'block';
            if (catNameEl) catNameEl.innerText = state.activeCat === 'ورد' ? 'ورد وهدايا 💐' : state.activeCat;
            
            const defaultDescs = {
                'ديسباسيتو': 'أكواب الديسباسيتو المجهزة خصيصاً من فادج كيك حلويات بوسي الأصلي، مغطاة بأرقى أنواع الشيكولاتة.',
                'سينابون': 'مخبوزات السينابون الفاخرة، معتمدة على عجينة الخميرة القطنية الهشة ومحشية قرفة وسكر بني.',
                'قشطوطة': 'كيك الحليب المشبع، عليه طبقة قشطة طبيعية لترطيب وتجربة تذوق ولا أروع.',
                'جاتوه': 'قطع جاتوه كلاسيك من كيك إسفنجي خفيف مع كريمة غنية ونسبة سكر مظبوطة.'
            };
            let desc = siteSettings.catDescriptions && siteSettings.catDescriptions[state.activeCat] ? siteSettings.catDescriptions[state.activeCat] : (defaultDescs[state.activeCat] || `أشهى الأصناف المميزة من قسم ${state.activeCat} محضرة بعناية عشان تضمن لحضرتك أعلى جودة.`);
            if (catDescEl) catDescEl.innerText = desc;
        } else if (catDescArea) { 
            catDescArea.classList.add('hidden'); 
            catDescArea.style.display = 'none'; 
        }

        let breadcrumbHtml = `<nav class="flex items-center gap-2 text-sm font-bold text-[var(--site-text)] mb-6 justify-center w-full col-span-full"><span class="cursor-pointer hover:text-[var(--brand-primary)]" onclick="window.setCategory('الرئيسية')">الرئيسية</span> <i data-lucide="chevron-left" class="w-4 h-4 text-[var(--brand-primary)]"></i> <span class="text-[var(--brand-primary)]">${state.activeCat}</span></nav>`;

        const container = document.getElementById('display-container'); 
        const subTabs = document.getElementById('sub-tabs-area');
        if(!container) return;

        let targetHTML = '';
        let showSubTabs = false;
        
        // تطبيق رؤية الإدارة لتقسيم الكروت بصرامة
        const fullWidthCategories = ['تورت', 'جاتوه', 'جاتوهات', 'ريد فيلفت', 'بوكس الروقان', 'ميني تورته', 'تورتة ميني', 'ورد', 'كب كيك'];
        const twoColumnCategories = ['دوناتس', 'سينابون', 'ديسباسيتو', 'كبات السعاده', 'القشطوطه', 'قشطوطة'];

        if (state.activeCat === 'تورت') { 
            container.className = 'w-full animate-fade-in';
            targetHTML = breadcrumbHtml + `<div id="cake-builder-steps-wrapper" class="w-full mt-6 rounded-[3rem] shadow-2xl border-2 overflow-hidden bg-[#ffffff] border-[var(--brand-primary)]"></div>`; 
            setTimeout(() => { if(window.renderMultiStepCakeBuilder) window.renderMultiStepCakeBuilder(); }, 10);
        } 
        else if (state.activeCat === 'ورد') {
            showSubTabs = true;
            container.className = 'w-full animate-fade-in';
            let flowerHtml = breadcrumbHtml + `<div class="flex flex-col gap-12 w-full">`;
            fTypes.forEach(type => {
                const list = catalog.filter(p => p && p.isActive !== false && p.category === 'ورد' && (p.flowerType === type || (p.desc && typeof p.desc === 'string' && p.desc.includes(type))));
                if(list.length > 0) { 
                    flowerHtml += `<div id="flower-group-${type.replace(/\s+/g, '-')}" class="space-y-6 animate-fade-in"><div class="flex items-center gap-4 mb-4"><h3 class="font-black text-xl text-[var(--brand-primary)] shrink-0">${type}</h3><div class="h-[2px] w-full bg-[var(--brand-primary)]"></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">${list.map(p => window.drawProductCard(p)).join('')}</div></div>`; 
                }
            });
            flowerHtml += `</div>`; 
            targetHTML = flowerHtml;
        }
        else {
            if (state.activeCat === 'ديسباسيتو') showSubTabs = true;
            
            // تحديد كلاس الحاوية بناءً على التصنيف الهندسي
            if (fullWidthCategories.includes(state.activeCat)) {
                // كارت واحد مالي الشاشة (Full Width) لزيادة الفخامة
                container.className = 'grid grid-cols-1 gap-10 items-stretch w-full animate-fade-in max-w-4xl mx-auto';
            } else if (twoColumnCategories.includes(state.activeCat)) {
                // كارتين جنب بعض (2 Columns) بصرامة كما طلبت الإدارة
                container.className = 'grid grid-cols-2 gap-4 md:gap-6 items-stretch w-full animate-fade-in';
            } else {
                // التقسيم الافتراضي لبقية الأصناف
                container.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 items-stretch w-full animate-fade-in';
            }
            
            let list = catalog.filter(p => p && p.isActive !== false && p.category === state.activeCat);
            
            // ترقية ذكاء التبويبات للديسباسيتو (منع الشاشات الفارغة)
            if (state.activeCat === 'ديسباسيتو' && state.dSize) {
                const filteredList = list.filter(p => {
                    return p.size === state.dSize || p.subType === state.dSize || (p.desc && typeof p.desc === 'string' && p.desc.includes(state.dSize)) || (p.name && p.name.includes(state.dSize));
                });
                if (filteredList.length > 0) list = filteredList;
                else state.dSize = null; // تصفير الاختيار لضمان عدم ظهور شاشة بيضاء
            }
            
            if (list.length === 0) {
                container.className = 'w-full animate-fade-in flex justify-center items-center';
                targetHTML = breadcrumbHtml + `<div class="text-center w-full py-20 bg-[#ffffff] rounded-[2rem] border-2 border-dashed border-[var(--brand-primary)]"><i data-lucide="package-search" class="w-16 h-16 mx-auto mb-4 text-[var(--brand-primary)]"></i><p class="font-bold text-[var(--site-text)] text-lg">جاري تجهيز أصناف فاخرة في هذا القسم.</p></div>`;
            } else {
                targetHTML = breadcrumbHtml + list.map(p => window.drawProductCard(p)).join('');
            }
        }

        window.enforceCategoryRender('display-container', targetHTML);
        if(window.lucide) lucide.createIcons();

        if (showSubTabs) {
            subTabs.classList.remove('hidden');
            subTabs.style.display = 'block';
            if (state.activeCat === 'ورد') window.renderFlowerTabs(subTabs);
            if (state.activeCat === 'ديسباسيتو') {
                subTabs.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border-2 flex justify-center gap-2 bg-[#ffffff] border-[var(--brand-primary)] flex-wrap">${dSizes.map(s => `<button onclick="window.setSub('s', '${s}')" class="flex-1 min-w-[80px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border-2 ${state.dSize === s ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-lg' : 'bg-[#ffffff] text-[var(--site-text)] border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">${s}</button>`).join('')}</div>`;
            }
        } else { if(subTabs) { subTabs.classList.add('hidden'); subTabs.style.display = 'none'; } }
        
        if(window.renderSmartSuggestions) window.renderSmartSuggestions('main');
        if(window.loadLiveReviews) window.loadLiveReviews('general_' + state.activeCat);
        
    } catch(e) { console.error("BoseSweets: استثناء في محرك العرض الأساسي", e); }
};
window.renderMainDisplay = renderMainDisplay;

// 👑 هندسة توجيه الأقسام المنيعة (Sovereign Routing Control)
export const setCategory = function(c) {
    try {
        if (c === 'الرئيسية') {
            state.activeCat = 'الرئيسية';
            if(window.showHomeView) window.showHomeView();
        } else {
            state.activeCat = c;
            if(window.showMenuView) window.showMenuView();
            if(window.renderMainDisplay) window.renderMainDisplay();

            MemoryManager.set('scroll_to_products', () => {
                const displayContainer = document.getElementById('display-container');
                const catDescArea = document.getElementById('category-description-area');
                const targetElement = (catDescArea && !catDescArea.classList.contains('hidden')) ? catDescArea : displayContainer;
                if (targetElement) {
                    const offsetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - 140;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }, 100);
        }
        
        if(window.renderCategories) window.renderCategories();
        history.pushState({category: c}, '', `?category=${encodeURIComponent(c)}`);
        
        MemoryManager.set('scroll_cat', () => { 
            const safeId = String(c).replace(/\s+/g, '-');
            const activeBtn = document.getElementById(`cat-btn-${safeId}`); 
            if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); 
        }, 50);
    } catch(e) { console.error("BoseSweets: خطأ أثناء التوجيه للقسم", e); }
};
window.setCategory = setCategory;

export const handleDeepLinking = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    const categoryId = urlParams.get('category');
    if (productId && typeof window.navigateToProduct === 'function') setTimeout(() => window.navigateToProduct(productId), 500);
    else if (categoryId && typeof window.setCategory === 'function') setTimeout(() => window.setCategory(decodeURIComponent(categoryId)), 300);
};
window.handleDeepLinking = handleDeepLinking;

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
});
