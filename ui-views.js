/**
 * 👑 BoseSweets UI View Management (V23.0 - Sovereign Navigation Protocol)
 * مهندس عرض الواجهات والتنقل - حلويات بوسي
 * تم التحصين الشامل: تأمين الشلال ضد الاختفاء، تصحيح الـ IDs لمنع انهيار الواجهات واعتماد نظام عرض قاطع.
 */

import { dSizes, fTypes } from './config.js';
import { siteSettings, catalog, catMenu, state } from './state.js';
import { MemoryManager, escapeHTML, optimizeCloudinaryUrl } from './utils.js';

// 👑 تبديل الواجهات الأساسي (Sovereign Routing)
export const showHomeView = function() {
    try {
        ['view-menu', 'view-tips', 'view-cake-builder', 'view-product-details', 'menu-view', 'product-details-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
        const vHome = document.getElementById('view-home') || document.getElementById('home-view'); 
        if(vHome) { 
            vHome.classList.remove('hidden'); 
            vHome.style.display = 'flex'; // Flex to match standard layout
        }
        if(window.setActiveCategoryPill) window.setActiveCategoryPill('الرئيسية');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.warn("BoseSweets: استثناء أثناء عرض الرئيسية", e); }
};
window.showHomeView = showHomeView;

export const showMenuView = function() {
    try {
        ['view-home', 'view-tips', 'view-cake-builder', 'view-product-details', 'home-view', 'product-details-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
        const vMenu = document.getElementById('view-menu') || document.getElementById('menu-view'); 
        if(vMenu) { 
            vMenu.classList.remove('hidden'); 
            vMenu.style.display = 'flex'; // Flex to match layout
        }
        
        const menuGrid = document.getElementById('display-container');
        if(menuGrid) menuGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 items-stretch w-full animate-fade-in';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.warn("BoseSweets: استثناء أثناء عرض المنيو", e); }
};
window.showMenuView = showMenuView;

export const showGoldenTips = function() {
    try {
        ['view-home', 'view-menu', 'view-cake-builder', 'view-product-details', 'home-view', 'menu-view', 'product-details-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
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
            if(el) el.classList.add('hidden');
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
        setTimeout(() => { lightbox.classList.add('hidden'); lightbox.classList.remove('flex'); }, 300);
    }
};
window.closeGlobalLightbox = closeGlobalLightbox;

// 👑 هندسة الشلال (Waterfall - تم التأمين ضد الاختفاء والمساحات البيضاء)
export const initWaterfall = function() {
    try {
        const col1 = document.getElementById('waterfall-col-1');
        const col2 = document.getElementById('waterfall-col-2');
        const waterfallContainer = document.getElementById('section-waterfall'); 
        
        if (waterfallContainer) {
            waterfallContainer.classList.remove('hidden');
            waterfallContainer.style.display = 'block';
        }

        if (!col1 || !col2) return;

        // جلب العناصر التي تحتوي على صور صالحة للعرض
        const visualItems = catalog.filter(p => p && p.isActive !== false && (p.img || (p.images && p.images.length > 0)));
        
        if (visualItems.length === 0) {
            col1.innerHTML = `<div class="text-center py-10 text-[var(--site-text)] opacity-50 font-bold col-span-2">نجهز لكم أصنافاً جديدة فاخرة.. انتظرونا ✨</div>`;
            col2.innerHTML = '';
            return;
        }

        // تقسيم العناصر لضمان عدم وجود مساحات بيضاء بالتساوي بين العمودين
        const half = Math.ceil(visualItems.length / 2);
        const leftItems = visualItems.slice(0, half);
        const rightItems = visualItems.slice(half);

        // الحفاظ على الهيكل البصري المقدس الذي يراه العميل
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
                if(sectionBS) sectionBS.classList.remove('hidden');
                bsContainer.innerHTML = fallbackBS.map(p => `<div class="shrink-0 w-[300px] snap-center">${window.drawProductCard(p)}</div>`).join('');
            } else { if(sectionBS) sectionBS.classList.add('hidden'); }

            if (naContainer && fallbackNA.length > 0) {
                if(sectionNA) sectionNA.classList.remove('hidden');
                naContainer.innerHTML = fallbackNA.map(p => `<div class="shrink-0 w-[300px] snap-center">${window.drawProductCard(p)}</div>`).join('');
            } else { if(sectionNA) sectionNA.classList.add('hidden'); }
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

// 👑 معالجة التابات (Pills) - مع الاحتفاظ بالديناميكية والتوافق مع لوحة التحكم
export const renderCategories = function() {
    try {
        const el = document.getElementById('categories-nav') || document.getElementById('categories-scroll') || document.getElementById('categories-container');
        if(!el) return;
        
        el.classList.remove('hidden');
        el.style.display = 'flex'; // Use flex to maintain layout

        // دمج القوائم الديناميكية لضمان عدم تعطل الأقسام المضافة من لوحة التحكم
        const sortedCats = [...catMenu].sort((a, b) => (a.order || 99) - (b.order || 99));

        let html = `<button id="cat-btn-الرئيسية" onclick="window.setCategory('الرئيسية')" class="cat-pill whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-2xl font-bold transition-all border-2 text-sm sm:text-base ${state.activeCat === 'الرئيسية' ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-lg' : 'bg-[#ffffff] text-[var(--site-text)] border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">الرئيسية</button>`;

        html += sortedCats.map(c => {
            const catName = c.name || c;
            const safeId = String(catName).replace(/\s+/g, '-');
            const isActive = state.activeCat === catName;
            const displayName = catName === 'ورد' ? 'ورد وهدايا 💐' : (catName === 'تورت' ? 'تورت وتصميم 🎂' : catName);
            
            // الهيكل المدعوم بقوة الألوان الديناميكية للبراند
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
            container.style.display = container.className.includes('grid') ? 'grid' : 'block'; 
        } catch(e) { console.error("BoseSweets: خطأ أثناء عرض المنتجات", e); }
    }
};
window.enforceCategoryRender = enforceCategoryRender;

export const setSub = function(type, val) {
    if (type === 's') state.dSize = val;
    if (type === 'f') state.fType = val;
    if(window.renderMainDisplay) window.renderMainDisplay();
};
window.setSub = setSub;

// 👑 المحرك الأساسي لعرض الأقسام مع الحماية المطلقة
export const renderMainDisplay = function() {
    try {
        const catDescArea = document.getElementById('category-description-area');
        const catNameEl = document.getElementById('current-cat-name');
        const catDescEl = document.getElementById('current-cat-desc');

        if (catDescArea && state.activeCat !== 'الرئيسية' && state.activeCat !== 'تورت') {
            catDescArea.classList.remove('hidden');
            if (catNameEl) catNameEl.innerText = state.activeCat === 'ورد' ? 'ورد وهدايا 💐' : state.activeCat;
            
            const defaultDescs = {
                'ديسباسيتو': 'أكواب الديسباسيتو المجهزة خصيصاً من فادج كيك حلويات بوسي الأصلي، مغطاة بأرقى أنواع الشيكولاتة.',
                'سينابون': 'مخبوزات السينابون الفاخرة، معتمدة على عجينة الخميرة القطنية الهشة ومحشية قرفة وسكر بني.',
                'قشطوطة': 'كيك الحليب المشبع، عليه طبقة قشطة طبيعية لترطيب وتجربة تذوق ولا أروع.',
                'جاتوه': 'قطع جاتوه كلاسيك من كيك إسفنجي خفيف مع كريمة غنية ونسبة سكر مظبوطة.'
            };
            let desc = siteSettings.catDescriptions && siteSettings.catDescriptions[state.activeCat] ? siteSettings.catDescriptions[state.activeCat] : (defaultDescs[state.activeCat] || `أشهى الأصناف المميزة من قسم ${state.activeCat} محضرة بعناية عشان تضمن لحضرتك أعلى جودة.`);
            if (catDescEl) catDescEl.innerText = desc;
        } else if (catDescArea) { catDescArea.classList.add('hidden'); }

        let breadcrumbHtml = `<nav class="flex items-center gap-2 text-sm font-bold text-[var(--site-text)] mb-6 justify-center w-full"><span class="cursor-pointer hover:text-[var(--brand-primary)]" onclick="window.setCategory('الرئيسية')">الرئيسية</span> <i data-lucide="chevron-left" class="w-4 h-4 text-[var(--brand-primary)]"></i> <span class="text-[var(--brand-primary)]">${state.activeCat}</span></nav>`;

        const container = document.getElementById('display-container'); 
        const subTabs = document.getElementById('sub-tabs-area');
        if(!container) return;

        let targetHTML = '';
        let showSubTabs = false;
        const fullWidthCategories = ['تورت', 'تورتة ميني', 'جاتوه', 'ورد', 'ريد فيلفت', 'كب كيك', 'بوكس الروقان'];
        const isFullWidth = fullWidthCategories.includes(state.activeCat);
        
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
                    flowerHtml += `<div id="flower-group-${type.replace(/\s+/g, '-')}" class="space-y-6 animate-fade-in"><div class="flex items-center gap-4 mb-4"><h3 class="font-black text-xl text-[var(--brand-primary)] shrink-0">${type}</h3><div class="h-[2px] w-full bg-[var(--brand-primary)]"></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">${list.map(p => window.drawProductCard(p)).join('')}</div></div>`; 
                }
            });
            flowerHtml += `</div>`; 
            targetHTML = flowerHtml;
        }
        else {
            if (state.activeCat === 'ديسباسيتو') showSubTabs = true;
            
            if (isFullWidth) container.className = 'grid grid-cols-1 gap-10 items-stretch w-full animate-fade-in max-w-4xl mx-auto';
            else {
                let baseGrid = (siteSettings.layout_settings && siteSettings.layout_settings.layout_viewMode === 'columns_2') ? 'grid-cols-2' : 'grid-cols-1';
                container.className = `grid ${baseGrid} md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 items-stretch w-full animate-fade-in`;
            }
            
            let list = catalog.filter(p => p && p.isActive !== false && p.category === state.activeCat);
            if (state.activeCat === 'ديسباسيتو') {
                list = list.filter(p => {
                    const matchSize = p.size === state.dSize || p.subType === state.dSize || (p.desc && typeof p.desc === 'string' && p.desc.includes(state.dSize));
                    return matchSize || (!p.size && !p.subType);
                });
            }
            
            targetHTML = breadcrumbHtml + list.map(p => window.drawProductCard(p)).join('');
            
            if (list.length === 0) {
                container.className = 'w-full animate-fade-in';
                targetHTML = breadcrumbHtml + `<div class="text-center py-20 bg-[#ffffff] rounded-[2rem] border-2 border-dashed border-[var(--brand-primary)]"><i data-lucide="package-search" class="w-16 h-16 mx-auto mb-4 text-[var(--brand-primary)]"></i><p class="font-bold text-[var(--site-text)] text-lg">جاري تجهيز أصناف فاخرة في هذا القسم.</p></div>`;
            }
        }

        window.enforceCategoryRender('display-container', targetHTML);
        if(window.lucide) lucide.createIcons();

        if (showSubTabs) {
            subTabs.classList.remove('hidden');
            if (state.activeCat === 'ورد') window.renderFlowerTabs(subTabs);
            if (state.activeCat === 'ديسباسيتو') {
                subTabs.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border-2 flex justify-center gap-2 bg-[#ffffff] border-[var(--brand-primary)]">${dSizes.map(s => `<button onclick="window.setSub('s', '${s}')" class="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border-2 ${state.dSize === s ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)]' : 'bg-[#ffffff] text-[var(--site-text)] border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">${s}</button>`).join('')}</div>`;
            }
        } else { if(subTabs) subTabs.classList.add('hidden'); }
        
        if(window.renderSmartSuggestions) window.renderSmartSuggestions('main');
    } catch(e) { console.error("BoseSweets: استثناء في محرك العرض الأساسي", e); }
};
window.renderMainDisplay = renderMainDisplay;

// 👑 هندسة توجيه الأقسام المنیعة (Sovereign Routing Control)
export const setCategory = function(c) {
    try {
        if (c === 'الرئيسية') {
            state.activeCat = 'الرئيسية';
            if(window.showHomeView) window.showHomeView();
            if(window.initWaterfall) window.initWaterfall();
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
    } catch(e) {
        console.error("BoseSweets: خطأ أثناء التوجيه للقسم", e);
    }
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

// 👑 تأمين مستمعات الأحداث (السر وراء استقرار واجهة بوسي)
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    document.body.addEventListener('click', function(e) {
        const tabBtn = e.target.closest('.category-tab, .cat-btn, .cat-pill, [onclick*="Category"], [onclick*="Cat"]');
        if (tabBtn) {
            setTimeout(() => {
                const productContainers = document.querySelectorAll('.products-grid, #products-container, .catalog-grid, [id*="grid"], #display-container');
                productContainers.forEach(container => {
                    if (container) {
                        container.classList.remove('hidden'); 
                        container.style.display = container.className.includes('grid') ? 'grid' : 'block'; 
                    }
                });
            }, 150);
        }
    });
});