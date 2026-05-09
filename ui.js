// المعالجات الرسومية والواجهات (ui.js) لمنصة حلويات بوسي
import { detailedDescriptions, dSizes, fTypes } from './config.js';
import { siteSettings, catalog, galleryData, catMenu, state, cakeState, isAppReady, shippingZones } from './state.js';
import { MemoryManager, hexToMathHSL, escapeHTML, optimizeCloudinaryUrl, showSystemToast } from './utils.js';

const db = window.db || (typeof window !== 'undefined' && window.firebase ? window.firebase.firestore() : undefined);
const firebase = window.firebase || (typeof window !== 'undefined' ? window.firebase : undefined);

// بناء الدالة المفقودة داخلياً لضمان عدم انهيار النظام
export const getImgFallback = function(category) {
    return (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
};
window.getImgFallback = getImgFallback;
window.currentBuilderStep = 1;

export const getCapsuleDescription = function(p) {
    if (!p) return '';
    let n = (p.name ? String(p.name) : '').trim().toLowerCase();
    let c = (p.category ? String(p.category) : '').trim().toLowerCase();

    if (c.includes('دوناتس') && n.includes('نوتيلا')) return 'دوناتس تعتمد على عجينة خفيفة محشوة بشيكولاتة نوتيلا أصلية، مجهزة بعناية عشان تديك أعلى جودة.';
    if (c.includes('سينابون') && n.includes('نوتيلا')) return 'مزيج من عجينة السينابون القطنية القائمة على الخميرة مع صوص النوتيلا الفاخر، اختيار مثالي لعشاق الشيكولاتة.';
    if (c.includes('قشطوط') && n.includes('نوتيلا')) return 'قشطوطة غنية بالحليب وطبقة قشطة طبيعية مغطاة بالنوتيلا الأصلية لطعم متوازن ومميز.';
    if (n.includes('كبات') && n.includes('نوتيلا')) return 'طبقات كيك وكريمة نوتيلا غنية في كب بتصميم عصري يناسبك.';
    if (c.includes('ديسباسيتو') && n.includes('نوتيلا')) return 'فادج كيك شيكولاتة مركز مع طبقة غنية من النوتيلا البرازيلية الأصلية لتجربة طعم فخمة.';
    if (c.includes('دوناتس') || c.includes('بامبوليني')) return 'عجينة مخبوزات خفيفة مغطاة بصوصات متنوعة محضرة بأعلى معايير الجودة في مطبخ حلويات بوسي.';
    if (c.includes('سينابون') || n.includes('سينابون')) return 'عجينة قطنية طرية غنية بالقرفة وصوص الجبن المخصوص وتعتمد كلياً على عجين الخميرة المخبوز بعناية.';
    if (c.includes('ديسباسيتو') || n.includes('ديسباسيتو')) return detailedDescriptions['ديسباسيتو'];
    if (c.includes('ريد فيلفت') || n.includes('ريد فيلفت')) return detailedDescriptions['ريد فيلفت'];
    if (c.includes('قشطوط') || n.includes('قشطوط')) return detailedDescriptions['قشطوطة'];
    if (c.includes('كبات') || n.includes('كبات')) return detailedDescriptions['كبات السعادة'];
    if (c.includes('جاتوه') || n.includes('جاتوه')) return detailedDescriptions['جاتوه'];
    
    return 'إصدار فاخر من حلويات بوسي، مجهز بمكونات عالية الجودة عشان تعيش تجربة تذوق استثنائية.';
};
window.getCapsuleDescription = getCapsuleDescription;

export const getFinalDescription = function(p, isFullWidth) {
    if (!p) return '';
    if (p.desc && typeof p.desc === 'string' && p.desc.trim().length > 3) return escapeHTML(p.desc.trim());
    
    let n = (p.name ? String(p.name) : '').trim().toLowerCase();
    let c = (p.category ? String(p.category) : '').trim().toLowerCase();
    let sub = (p.subType ? String(p.subType) : (p.size ? String(p.size) : (p.flowerType ? String(p.flowerType) : ''))).trim().toLowerCase();
    
    const exactKey1 = `${c} ${n} ${sub}`.trim(); 
    const exactKey2 = `${n} ${sub}`.trim();      
    const exactKey3 = `${c} ${sub}`.trim();      
    const exactKey4 = `${sub}`.trim();           
    const exactKey5 = `${n}`.trim();             

    for (let key in detailedDescriptions) {
        let kLower = key.toLowerCase();
        if (exactKey1 === kLower || exactKey2 === kLower || exactKey3 === kLower || exactKey4 === kLower || exactKey5 === kLower) {
            return detailedDescriptions[key];
        }
    }
    
    for (let key in detailedDescriptions) {
        let kLower = key.toLowerCase();
        if ((n.includes(kLower) || sub.includes(kLower)) && c === 'تورت') return detailedDescriptions[key];
        if ((n.includes('جاتوه') || c.includes('جاتوه')) && key.includes('جاتوه')) return detailedDescriptions['جاتوه كلاسيك']; 
    }

    return getCapsuleDescription(p);
};
window.getFinalDescription = getFinalDescription;

export const showHomeView = function() {
    const vMenu = document.getElementById('view-menu'); if(vMenu) vMenu.classList.add('hidden');
    const vTips = document.getElementById('view-tips'); if(vTips) vTips.classList.add('hidden');
    const vCake = document.getElementById('view-cake-builder'); if(vCake) vCake.classList.add('hidden');
    const vProd = document.getElementById('view-product-details'); if(vProd) vProd.classList.add('hidden');
    const vHome = document.getElementById('view-home'); if(vHome) vHome.classList.remove('hidden');
    setActiveCategoryPill('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.showHomeView = showHomeView;

export const showMenuView = function() {
    const vHome = document.getElementById('view-home'); if(vHome) vHome.classList.add('hidden');
    const vTips = document.getElementById('view-tips'); if(vTips) vTips.classList.add('hidden');
    const vCake = document.getElementById('view-cake-builder'); if(vCake) vCake.classList.add('hidden');
    const vProd = document.getElementById('view-product-details'); if(vProd) vProd.classList.add('hidden');
    const vMenu = document.getElementById('view-menu'); if(vMenu) vMenu.classList.remove('hidden');
    
    window.switchCategory && window.switchCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.showMenuView = showMenuView;

export const showGoldenTips = function() {
    const vHome = document.getElementById('view-home'); if(vHome) vHome.classList.add('hidden');
    const vMenu = document.getElementById('view-menu'); if(vMenu) vMenu.classList.add('hidden');
    const vCake = document.getElementById('view-cake-builder'); if(vCake) vCake.classList.add('hidden');
    const vProd = document.getElementById('view-product-details'); if(vProd) vProd.classList.add('hidden');
    const vTips = document.getElementById('view-tips'); if(vTips) vTips.classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.showGoldenTips = showGoldenTips;

export const showCakeBuilderView = function() {
    const vHome = document.getElementById('view-home'); if(vHome) vHome.classList.add('hidden');
    const vMenu = document.getElementById('view-menu'); if(vMenu) vMenu.classList.add('hidden');
    const vTips = document.getElementById('view-tips'); if(vTips) vTips.classList.add('hidden');
    const vProd = document.getElementById('view-product-details'); if(vProd) vProd.classList.add('hidden');
    const vCake = document.getElementById('view-cake-builder'); if(vCake) vCake.classList.remove('hidden');
    
    window.currentBuilderStep = 1;
    window.renderMultiStepCakeBuilder && window.renderMultiStepCakeBuilder();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.showCakeBuilderView = showCakeBuilderView;

export const openGlobalLightbox = function(imgUrl) {
    const lightbox = document.getElementById('global-image-lightbox');
    const mainImg = document.getElementById('lightbox-main-img');
    if(lightbox && mainImg) {
        mainImg.src = imgUrl;
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        setTimeout(() => {
            lightbox.classList.remove('opacity-0');
            mainImg.classList.remove('scale-95');
            mainImg.classList.add('scale-100');
        }, 10);
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
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
        }, 300);
    }
};
window.closeGlobalLightbox = closeGlobalLightbox;

export const renderTicker = function() {
    let container = document.getElementById('ticker-container');
    const navbar = document.getElementById('navbar');
    
    const isActive = siteSettings.ticker_isActive ?? siteSettings.tickerActive ?? true;
    
    if (!isActive) {
        if(container) { container.classList.add('hidden'); container.classList.remove('flex'); }
        if(navbar) navbar.style.top = '0';
        return;
    }

    if (!container) {
        container = document.createElement('div');
        container.id = 'ticker-container';
        container.className = 'w-full py-1.5 overflow-hidden absolute top-0 left-0 right-0 border-b-2 border-[#ffffff]';
        container.style.zIndex = '9999';
        document.body.insertBefore(container, document.body.firstChild);
    }

    const text = siteSettings.ticker_text || siteSettings.tickerText || siteSettings.announcement || 'حلويات بوسي: تجربة تذوق بتعكس الجودة الأصلية وتليق بمناسباتك السعيدة';
    const speed = siteSettings.ticker_speed || siteSettings.tickerSpeed || 20;
    const bgColor = siteSettings.ticker_bgColor || '#ff91a4';
    const textColor = siteSettings.ticker_textColor || '#ffffff';

    container.style.backgroundColor = bgColor;
    container.classList.remove('hidden');
    container.classList.add('flex', 'items-center');
    
    container.innerHTML = `<span class="animate-ticker text-xs md:text-sm font-bold" style="white-space: nowrap; animation-duration: ${speed}s; color: ${textColor}; font-family: var(--brand-font);">${text} &nbsp;&nbsp;✨&nbsp;&nbsp; ${text} &nbsp;&nbsp;✨&nbsp;&nbsp; ${text}</span>`;
    
    if(navbar) navbar.style.top = '32px';
};
window.renderTicker = renderTicker;

export const loadLiveReviews = async function(productId) {
    const reviewsContainer = document.getElementById(`reviews-list-${productId}`);
    if (!reviewsContainer || typeof db === 'undefined') return;

    try {
        const snapshot = await db.collection('catalog').doc(String(productId)).collection('livereviews').where('isApproved', '==', true).orderBy('timestamp', 'desc').limit(10).get();
        if (snapshot.empty) {
            reviewsContainer.innerHTML = '<p class="text-xs text-[#1a1a1a] font-bold text-center py-4">كن أول من يشارك تجربته مع الصنف ده... </p>';
            return;
        }
        reviewsContainer.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const stars = '⭐'.repeat(data.rating || 5);
            return `<div class="bg-[#ffffff] p-4 rounded-[1.5rem] border-2 border-[#ff91a4] mb-3"><div class="flex justify-between items-center mb-2"><span class="font-black text-[#1a1a1a] text-xs">${escapeHTML(data.customerName)}</span><span class="text-[10px]">${stars}</span></div><p class="text-xs text-[#1a1a1a] leading-relaxed font-bold">${escapeHTML(data.comment)}</p></div>`;
        }).join('');
    } catch (error) {
        reviewsContainer.innerHTML = '<p class="text-xs text-[#1a1a1a] font-bold text-center py-4">جاري مزامنة الآراء...</p>';
    }
};
window.loadLiveReviews = loadLiveReviews;

export const applySettingsToUI = function() {
    window.renderTicker(); 

    if (!isAppReady) return; 

    const root = document.documentElement;
    root.style.setProperty('--brand-font', (siteSettings.visuals && siteSettings.visuals.fontFamily) ? siteSettings.visuals.fontFamily : (siteSettings.fontFamily || "'Cairo', sans-serif"));
    root.style.setProperty('--site-bg', '#ffffff');
    root.style.setProperty('--site-text', '#1a1a1a');

    const loaderTextEl = document.getElementById('dyn-loader-text');
    if (loaderTextEl) loaderTextEl.innerText = (siteSettings.visuals && siteSettings.visuals.loaderText) ? siteSettings.visuals.loaderText : "حلويات بوسي ✨";

    if (siteSettings.seo) {
        if (siteSettings.seo.title && siteSettings.seo.title.trim() !== '') {
            document.title = siteSettings.seo.title.trim();
            const titleEl = document.getElementById('dyn-page-title');
            if(titleEl) titleEl.innerText = siteSettings.seo.title.trim();
        } else {
            document.title = `${siteSettings.brandName} | المنصة الرسمية المعتمدة في الفرافرة`;
        }
        
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        if (siteSettings.seo.desc && siteSettings.seo.desc.trim() !== '') {
            metaDesc.setAttribute('content', siteSettings.seo.desc.trim());
        } else {
            metaDesc.setAttribute('content', `الموقع الرسمي لبراند حلويات بوسي (BoseSweets). نتميز بصناعة التورت الملكية، السينابون الفاخر، والدوناتس المبتكرة في الفرافرة والكفاح.`);
        }

        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.setAttribute('name', 'keywords');
            document.head.appendChild(metaKeywords);
        }
        if (siteSettings.seo.keywords && siteSettings.seo.keywords.trim() !== '') {
            metaKeywords.setAttribute('content', siteSettings.seo.keywords.trim());
        } else {
            metaKeywords.setAttribute('content', `حلويات بوسي, BoseSweets, تورت الفرافرة, حلويات الوادي الجديد, كيك الكفاح, سينابون بوسي`);
        }
    }

    if (siteSettings.UI_Settings) {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.backgroundColor = '#ffffff';
            const loaderTextEl = loader.querySelector('h1');
            if (loaderTextEl) {
                loaderTextEl.style.color = '#ff91a4';
            }
            const loaderIcon = loader.querySelector('i');
            if(loaderIcon) loaderIcon.style.color = '#ff91a4';
        }
    }

    if (siteSettings.layout_settings) {
        if (siteSettings.layout_settings.layout_waterfall_img_height) root.style.setProperty('--layout-waterfall-height', siteSettings.layout_settings.layout_waterfall_img_height);
        if (siteSettings.layout_settings.layout_waterfall_img_width) root.style.setProperty('--layout-waterfall-width', siteSettings.layout_settings.layout_waterfall_img_width);
        if (siteSettings.layout_settings.layout_waterfall_img_objectFit) root.style.setProperty('--layout-waterfall-fit', siteSettings.layout_settings.layout_waterfall_img_objectFit);
    }

    if (siteSettings.social) {
        document.querySelectorAll('a[href*="facebook.com"]').forEach(a => a.href = siteSettings.social.facebook || 'https://facebook.com/BoseSweets');
        document.querySelectorAll('a[href*="instagram.com"]').forEach(a => a.href = siteSettings.social.instagram || 'https://instagram.com/BoseSweets');
    }
    
    if(document.getElementById('dyn-page-title')) document.getElementById('dyn-page-title').innerText = `${siteSettings.brandName} | القائمة الرسمية`;
    if(document.getElementById('dyn-brand-name')) document.getElementById('dyn-brand-name').innerText = siteSettings.brandName;
    
    if(document.getElementById('dyn-hero-title')) {
        const title = document.getElementById('dyn-hero-title');
        title.innerHTML = siteSettings.heroTitle;
        title.style.opacity = '1';
    }
    
    if(document.getElementById('dyn-hero-desc')) {
        const desc = document.getElementById('dyn-hero-desc');
        desc.innerText = siteSettings.heroDesc;
        desc.style.opacity = '0.9';
    }
    
    if(document.getElementById('dyn-footer-brand')) document.getElementById('dyn-footer-brand').innerText = siteSettings.brandName;
    if(document.getElementById('dyn-footer-quote')) document.getElementById('dyn-footer-quote').innerText = siteSettings.footerQuote;
    if(document.getElementById('dyn-footer-phone')) document.getElementById('dyn-footer-phone').innerText = siteSettings.footerPhone;
    if(document.getElementById('dyn-footer-address')) document.getElementById('dyn-footer-address').innerHTML = siteSettings.footerAddress;
    
    const areaSelect = document.getElementById('cust-area');
    if(areaSelect) areaSelect.innerHTML = `<option value="" disabled selected>اختار منطقة التوصيل...</option>` + shippingZones.map(z => `<option value="${z.id}">${escapeHTML(z.name)} (+${Number(z.fee)} ج.م توصيل)</option>`).join('');
    
    if(document.getElementById('sidebar-categories')) renderCustomerSidebarCategories();

    // 👑 الترقية السيادية: نظام التوجيه الذكي للروابط المشتركة (Deep Link Router)
    setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('product');
        if (productId && typeof window.navigateToProduct === 'function') {
            window.navigateToProduct(productId);
        }
    }, 800);
};
window.applySettingsToUI = applySettingsToUI;

export const toggleCustomerMenu = function(show) {
    const ov = document.getElementById('customer-menu-overlay'); const sd = document.getElementById('customer-menu-sidebar');
    if(!ov || !sd) return;
    if (show) { ov.classList.remove('hidden'); MemoryManager.set('menu_show', () => { ov.classList.add('opacity-100'); sd.classList.remove('translate-x-full'); }, 10); } 
    else { ov.classList.remove('opacity-100'); sd.classList.add('translate-x-full'); MemoryManager.set('menu_hide', () => ov.classList.add('hidden'), 500); MemoryManager.flush(); }
};
window.toggleCustomerMenu = toggleCustomerMenu;

export const renderCustomerSidebarCategories = function() {
    if (!isAppReady) return; 
    const container = document.getElementById('sidebar-categories');
    if(!container) return;
    
    container.innerHTML = catMenu.map(c => `<button onclick="toggleCustomerMenu(false); window.setCategory('${c.name || c}')" class="text-right w-full p-3 rounded-xl font-bold text-sm transition-all hover:bg-[#ffffff] flex items-center justify-between" style="border: 2px solid #ff91a4; color: #1a1a1a;"><span>${c.name === 'ورد' || c === 'ورد' ? 'ورد وهدايا 💐' : (c.name === 'تورت' || c === 'تورت' ? 'تورت وتصميم 🎂' : (c.name || c))}</span><i data-lucide="chevron-left" class="w-4 h-4 opacity-50"></i></button>`).join('');
    if(window.lucide) lucide.createIcons();
};
window.renderCustomerSidebarCategories = renderCustomerSidebarCategories;

export const renderCustomerGallery = function() {
    if (!isAppReady) return; 
    const sec = document.getElementById('gallery-customer-section'); const slider = document.getElementById('gallery-slider');
    if(!sec || !slider) return;
    if (galleryData.length === 0) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');
    
    slider.innerHTML = galleryData.map(g => `<div class="shrink-0 cursor-pointer hover:scale-105 transition-transform" onclick="openGlobalLightbox('${optimizeCloudinaryUrl(g.url)}')"><div class="w-32 h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-sm border-2 border-[#ff91a4]"><img src="${optimizeCloudinaryUrl(g.url)}" class="w-full h-full object-cover" loading="lazy" alt="سابقة أعمال حلويات بوسي" onerror="this.onerror=null; this.src=window.getImgFallback('سابقة أعمال');"></div></div>`).join('');
};
window.renderCustomerGallery = renderCustomerGallery;

export const shareProduct = function(id, name) {
    const url = window.location.origin + window.location.pathname + '?product=' + id;
    if (navigator.share) { navigator.share({ title: siteSettings.brandName + ' - ' + name, text: 'شوف المنتج الروعة ده من حلويات بوسي!', url: url }).catch(console.error); } 
    else { navigator.clipboard.writeText(url).then(() => { showSystemToast('تم نسخ رابط المنتج بنجاح!', 'success'); }).catch(() => { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); showSystemToast('تم نسخ الرابط!', 'success'); }); }
};
window.shareProduct = shareProduct;

export const initWaterfall = function() {
    const col1 = document.getElementById('waterfall-col-1');
    const col2 = document.getElementById('waterfall-col-2');
    if (!col1 || !col2) return;

    const visualItems = catalog.filter(p => p && (p.images && p.images.length > 0 || p.img));
    if (visualItems.length === 0) return;

    const hourChunk = new Date().getHours() % Math.max(1, Math.floor(visualItems.length / 6));
    const startIdx = hourChunk * 6;
    const itemsToDisplay = visualItems.slice(startIdx, startIdx + 6);
    
    if(itemsToDisplay.length < 6) {
        itemsToDisplay.push(...visualItems.slice(0, 6 - itemsToDisplay.length));
    }

    const buildCardHTML = (item) => {
        const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://via.placeholder.com/400x400/ffffff/ff91a4.png?text=BoseSweets';
        let rawImageUrl = defaultFallbackImage;
        if (item.images && item.images.length > 0 && item.images[0] && String(item.images[0]).trim() !== '') {
            rawImageUrl = item.images[0];
        } else if (item.img && String(item.img).trim() !== '') {
            rawImageUrl = item.img;
        } else if (typeof window.getImgFallback === 'function') {
            rawImageUrl = window.getImgFallback(item.category) || defaultFallbackImage;
        }
        const url = optimizeCloudinaryUrl(rawImageUrl);

        return `
            <div class="waterfall-card cursor-pointer group relative" onclick="window.navigateToProduct('${item.id}')" title="اضغط لاستعراض تفاصيل ${escapeHTML(item.name)}">
                <img src="${url}" loading="lazy" decoding="async" class="transition-transform duration-500 group-hover:scale-105" alt="صنف ${escapeHTML(item.name)} من قسم ${escapeHTML(item.category)} - حلويات بوسي بمركز الفرافرة" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(item.category)}');">
                <div class="absolute inset-x-0 bottom-0 bg-[#ffffff]/80 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start border-t-2 border-[#ff91a4]">
                    <span class="text-[#ff91a4] text-xs font-bold truncate tracking-wide">${escapeHTML(item.name)}</span>
                </div>
            </div>`;
    };

    const htmlCol1 = itemsToDisplay.slice(0, 3).map(buildCardHTML).join('');
    const htmlCol2 = itemsToDisplay.slice(3, 6).map(buildCardHTML).join('');

    col1.innerHTML = htmlCol1 + htmlCol1;
    col2.innerHTML = htmlCol2 + htmlCol2;
};
window.initWaterfall = initWaterfall;

export const initHomepageSections = function() {
    const sectionBS = document.getElementById('section-bestsellers');
    const sectionNA = document.getElementById('section-newarrivals');
    const bsContainer = document.getElementById('bestsellers-container');
    const naContainer = document.getElementById('newarrivals-container');
    
    if (!bsContainer && !naContainer) return;

    const bestSellers = catalog.filter(p => p.badge && (p.badge.includes('مبيعاً') || p.badge.includes('مبيعات'))).slice(0, 8);
    const newArrivals = catalog.filter(p => p.badge && (p.badge.includes('جديد') || p.badge.includes('🌟'))).slice(0, 8);

    const fallbackBS = bestSellers.length > 0 ? bestSellers : catalog.slice(0, 6);
    const fallbackNA = newArrivals.length > 0 ? newArrivals : catalog.slice().reverse().slice(0, 6);

    if (bsContainer && fallbackBS.length > 0) {
        if(sectionBS) sectionBS.classList.remove('hidden');
        bsContainer.innerHTML = fallbackBS.map(p => `
            <div class="shrink-0 w-[300px] snap-center">
                ${window.drawProductCard(p)}
            </div>
        `).join('');
    } else {
        if(sectionBS) sectionBS.classList.add('hidden');
    }

    if (naContainer && fallbackNA.length > 0) {
        if(sectionNA) sectionNA.classList.remove('hidden');
        naContainer.innerHTML = fallbackNA.map(p => `
            <div class="shrink-0 w-[300px] snap-center">
                ${window.drawProductCard(p)}
            </div>
        `).join('');
    } else {
        if(sectionNA) sectionNA.classList.add('hidden');
    }
    
    if (window.lucide) lucide.createIcons();
    if (typeof setupSliderButtons === 'function') setupSliderButtons();
};
window.initHomepageSections = initHomepageSections;

export const setupSliderButtons = function() {
    const attachScroll = (btnId, sliderId, direction) => {
        const btn = document.getElementById(btnId);
        const slider = document.getElementById(sliderId);
        if(btn && slider) {
            btn.onclick = () => {
                const scrollAmount = direction === 'right' ? 300 : -300;
                slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            };
        }
    };
    attachScroll('bs-next', 'bestsellers-slider-home', 'left');
    attachScroll('bs-prev', 'bestsellers-slider-home', 'right');
    attachScroll('na-next', 'new-arrivals-slider-home', 'left');
    attachScroll('na-prev', 'new-arrivals-slider-home', 'right');
};
window.setupSliderButtons = setupSliderButtons;

export const renderCategories = function() {
    if (!isAppReady) return; 
    const el = document.getElementById('categories-nav');
    if(!el) return;
    
    el.innerHTML = catMenu.map(c => `<button id="cat-btn-${(c.name || c).replace(/\s+/g, '-')}" onclick="window.setCategory('${c.name || c}')" class="cat-pill whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-2xl font-bold transition-all border-2 text-sm sm:text-base ${state.activeCat === (c.name || c) ? 'bg-[#ff91a4] text-[#ffffff] border-[#ff91a4]' : 'bg-[#ffffff] text-[#1a1a1a] border-[#ff91a4] hover:bg-[#ff91a4] hover:text-[#ffffff]'}">${c.name === 'ورد' || c === 'ورد' ? 'ورد وهدايا 💐' : (c.name === 'تورت' || c === 'تورت' ? 'تورت وتصميم 🎂' : (c.name || c))}</button>`).join('');
};
window.renderCategories = renderCategories;

export const setActiveCategoryPill = function(catName) {
    document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.classList.remove('bg-[#ff91a4]', 'text-[#ffffff]');
        btn.classList.add('bg-[#ffffff]', 'text-[#1a1a1a]');
    });
    const safeId = String(catName).replace(/\s+/g, '-');
    const activeBtn = document.getElementById(`cat-btn-${safeId}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-[#ffffff]', 'text-[#1a1a1a]');
        activeBtn.classList.add('bg-[#ff91a4]', 'text-[#ffffff]');
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
};
window.setActiveCategoryPill = setActiveCategoryPill;

export const renderFlowerTabs = function(container) {
    container.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border-2 bg-[#ffffff] border-[#ff91a4] flex flex-wrap justify-center gap-2">${fTypes.map(f => `<button onclick="window.setSub('f', '${f}')" class="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border-2 ${state.fType === f ? 'bg-[#ff91a4] text-[#ffffff] border-[#ff91a4]' : 'bg-[#ffffff] text-[#1a1a1a] border-[#ff91a4] hover:bg-[#ff91a4] hover:text-[#ffffff]'}">${f}</button>`).join('')}</div>`;
};
window.renderFlowerTabs = renderFlowerTabs;

// 👑 نظام التحديث الجزئي للواجهة (Virtual Patcher) لمنع إعادة التحميل الكامل مدمج برمجياً داخل المحرك
export const enforceCategoryRender = function(containerId, productsHTML) {
    const container = document.getElementById(containerId);
    if (container) {
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = productsHTML;
        
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        
        container.innerHTML = ''; 
        container.appendChild(fragment);
        container.classList.remove('hidden'); 
        container.style.display = 'grid'; 
    }
};
window.enforceCategoryRender = enforceCategoryRender;

export const setSub = function(type, val) {
    if (type === 's') state.dSize = val;
    if (type === 'f') state.fType = val;
    window.renderMainDisplay();
};
window.setSub = setSub;

export const renderMainDisplay = function() {
    if (!isAppReady) return; 

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

        let desc = siteSettings.catDescriptions && siteSettings.catDescriptions[state.activeCat] 
                    ? siteSettings.catDescriptions[state.activeCat] 
                    : (defaultDescs[state.activeCat] || `أشهى الأصناف المميزة من قسم ${state.activeCat} محضرة بعناية عشان تضمن لك أعلى جودة.`);
        
        if (catDescEl) catDescEl.innerText = desc;
    } else if (catDescArea) {
        catDescArea.classList.add('hidden');
    }

    let breadcrumbHtml = `<nav class="flex items-center gap-2 text-sm font-bold text-[#1a1a1a] mb-6 justify-center w-full"><span class="cursor-pointer hover:text-[#ff91a4]" onclick="window.showHomeView ? window.showHomeView() : goToHome()">الرئيسية</span> <i data-lucide="chevron-left" class="w-4 h-4 text-[#ff91a4]"></i> <span class="text-[#ff91a4]">${state.activeCat}</span></nav>`;

    const container = document.getElementById('display-container'); 
    const subTabs = document.getElementById('sub-tabs-area');
    if(!container) return;

    let targetHTML = '';
    let showSubTabs = false;

    const fullWidthCategories = ['تورت', 'تورتة ميني', 'جاتوه', 'ورد', 'ريد فيلفت', 'كب كيك', 'بوكس الروقان'];
    const isFullWidth = fullWidthCategories.includes(state.activeCat);
    
    if (state.activeCat === 'تورت') { 
        container.className = 'w-full animate-fade-in';
        targetHTML = breadcrumbHtml + `<div id="cake-builder-steps-wrapper" class="w-full mt-6 rounded-[3rem] shadow-2xl border-2 overflow-hidden bg-[#ffffff] border-[#ff91a4]"></div>`; 
        setTimeout(() => { if(window.renderMultiStepCakeBuilder) window.renderMultiStepCakeBuilder(); }, 10);
    } 
    else if (state.activeCat === 'ورد') {
        showSubTabs = true;
        container.className = 'w-full animate-fade-in';
        let flowerHtml = breadcrumbHtml + `<div class="flex flex-col gap-12 w-full">`;
        fTypes.forEach(type => {
            const list = catalog.filter(p => p && p.category === 'ورد' && (p.flowerType === type || (p.desc && typeof p.desc === 'string' && p.desc.includes(type))));
            if(list.length > 0) { 
                flowerHtml += `<div id="flower-group-${type.replace(/\s+/g, '-')}" class="space-y-6 animate-fade-in"><div class="flex items-center gap-4 mb-4"><h3 class="font-black text-xl text-[#ff91a4] shrink-0">${type}</h3><div class="h-[2px] w-full bg-[#ff91a4]"></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">${list.map(p => window.drawProductCard(p)).join('')}</div></div>`; 
            }
        });
        flowerHtml += `</div>`; 
        targetHTML = flowerHtml;
    }
    else {
        if (state.activeCat === 'ديسباسيتو') showSubTabs = true;
        
        if (isFullWidth) {
            container.className = 'grid grid-cols-1 gap-10 items-stretch w-full animate-fade-in max-w-4xl mx-auto';
        } else {
            let baseGrid = 'grid-cols-1';
            if (siteSettings.layout_settings && siteSettings.layout_settings.layout_viewMode === 'columns_2') {
                baseGrid = 'grid-cols-2';
            }
            container.className = `grid ${baseGrid} md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 items-stretch w-full animate-fade-in`;
        }
        
        let list = catalog.filter(p => p && p.category === state.activeCat);
        if (state.activeCat === 'ديسباسيتو') {
            list = list.filter(p => {
                const matchSize = p.size === state.dSize || p.subType === state.dSize || (p.desc && typeof p.desc === 'string' && p.desc.includes(state.dSize));
                const isUncategorized = !p.size && !p.subType;
                return matchSize || isUncategorized;
            });
        }
        
        targetHTML = breadcrumbHtml + list.map(p => window.drawProductCard(p)).join('');
        
        if (list.length === 0) {
            container.className = 'w-full animate-fade-in';
            targetHTML = breadcrumbHtml + `<div class="text-center py-20"><i data-lucide="package-x" class="w-16 h-16 mx-auto mb-4 text-[#ff91a4]"></i><p class="font-bold text-[#1a1a1a]">جاري إعداد منتجات فاخرة في هذا القسم.</p></div>`;
        }
    }

    window.enforceCategoryRender('display-container', targetHTML);
    if(window.lucide) lucide.createIcons();

    if (showSubTabs) {
        subTabs.classList.remove('hidden');
        if (state.activeCat === 'ورد') renderFlowerTabs(subTabs);
        if (state.activeCat === 'ديسباسيتو') {
            subTabs.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border-2 flex justify-center gap-2 bg-[#ffffff] border-[#ff91a4]">${dSizes.map(s => `<button onclick="window.setSub('s', '${s}')" class="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border-2 ${state.dSize === s ? 'bg-[#ff91a4] text-[#ffffff] border-[#ff91a4]' : 'bg-[#ffffff] text-[#1a1a1a] border-[#ff91a4] hover:bg-[#ff91a4] hover:text-[#ffffff]'}">${s}</button>`).join('')}</div>`;
        }
    } else {
        subTabs.classList.add('hidden');
    }
    
    window.renderSmartSuggestions && window.renderSmartSuggestions('main');
};
window.renderMainDisplay = renderMainDisplay;

export const navigateToProduct = function(productId) {
    const prod = catalog.find(p => String(p.id) === String(productId));
    if (!prod) return;
    
    try {
        let userPrefs = JSON.parse(localStorage.getItem('bose_user_prefs')) || {};
        userPrefs[prod.category] = (userPrefs[prod.category] || 0) + 1;
        localStorage.setItem('bose_user_prefs', JSON.stringify(userPrefs));
    } catch(e) {}

    const vHome = document.getElementById('view-home'); if(vHome) vHome.classList.add('hidden');
    const vMenu = document.getElementById('view-menu'); if(vMenu) vMenu.classList.add('hidden');
    const vTips = document.getElementById('view-tips'); if(vTips) vTips.classList.add('hidden');
    const vCake = document.getElementById('view-cake-builder'); if(vCake) vCake.classList.add('hidden');
    
    const container = document.getElementById('single-product-container');
    if (!container) return;
    
    const isOutOfStock = prod.inStock === false;
    
    const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://via.placeholder.com/400x400/ffffff/ff91a4.png?text=BoseSweets';
    let rawImageUrl = defaultFallbackImage;
    if (prod.images && prod.images.length > 0 && prod.images[0] && String(prod.images[0]).trim() !== '') {
        rawImageUrl = prod.images[0];
    } else if (prod.img && String(prod.img).trim() !== '') {
        rawImageUrl = prod.img;
    } else if (typeof window.getImgFallback === 'function') {
        rawImageUrl = window.getImgFallback(prod.category) || defaultFallbackImage;
    }
    const imageUrl = optimizeCloudinaryUrl(rawImageUrl);

    let imagesGalleryHtml = '';
    if (prod.images && prod.images.length > 1) {
        imagesGalleryHtml = `<div class="flex gap-2 mt-4 overflow-x-auto hide-scrollbar pb-2">
            ${prod.images.map(img => `<img src="${optimizeCloudinaryUrl(img)}" onclick="document.getElementById('main-prod-img-${prod.id}').src='${optimizeCloudinaryUrl(img)}'" class="w-16 h-16 rounded-xl object-cover border-2 border-[#ff91a4] cursor-pointer hover:opacity-80 transition-opacity">`).join('')}
        </div>`;
    }
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start bg-[#ffffff] p-6 rounded-[2.5rem] border-2 border-[#ff91a4] shadow-sm max-w-4xl mx-auto">
            <div class="flex flex-col">
                <div class="rounded-2xl overflow-hidden bg-[#ffffff] border-2 border-[#ff91a4] h-64 md:h-[350px] relative" onclick="openGlobalLightbox(document.getElementById('main-prod-img-${prod.id}').src)">
                    <img id="main-prod-img-${prod.id}" src="${imageUrl}" class="w-full h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-105 ${isOutOfStock ? 'grayscale opacity-60' : ''}" alt="صنف ${escapeHTML(prod.name)} من قسم ${escapeHTML(prod.category)} - حلويات بوسي بمركز الفرافرة" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(prod.category)}');">
                    ${isOutOfStock ? `<div class="absolute inset-0 bg-[#ffffff]/40 flex items-center justify-center"><span class="bg-[#ff91a4] text-[#ffffff] px-4 py-2 rounded-xl text-xs font-bold shadow border-2 border-[#ffffff]">نفدت الكمية</span></div>` : ''}
                </div>
                ${imagesGalleryHtml}
            </div>
            <div class="space-y-4 text-right flex flex-col h-full justify-between">
                <div class="space-y-2">
                    <span class="inline-block px-3 py-1 bg-[#ffffff] border-2 border-[#ff91a4] text-[#ff91a4] rounded-md text-[11px] font-bold">${escapeHTML(prod.category)}</span>
                    <h2 class="text-xl font-black text-[#1a1a1a]">${escapeHTML(prod.name)}</h2>
                    <p class="text-[#1a1a1a] text-xs leading-relaxed font-bold">${escapeHTML(prod.desc || getFinalDescription(prod))}</p>
                </div>
                <div class="pt-4 border-t-2 border-[#ff91a4] space-y-4">
                    <div class="flex justify-between items-center bg-[#ffffff] border-2 border-[#ff91a4] p-4 rounded-xl">
                        <span class="text-xs font-bold text-[#1a1a1a]">السعر:</span>
                        <span class="text-xl font-black text-[#ff91a4]">${prod.price > 0 ? prod.price + ' ج.م' : 'حسب الطلب'}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.showMenuView ? window.showMenuView() : window.setCategory('${prod.category}')" class="px-4 py-3 bg-[#ffffff] text-[#1a1a1a] rounded-full font-bold text-xs active:scale-95 transition-all border-2 border-[#ff91a4] hover:bg-[#ff91a4] hover:text-[#ffffff]">العودة للمنيو</button>
                        ${isOutOfStock ? 
                            `<button class="flex-1 py-3 bg-[#ffffff] text-[#1a1a1a] rounded-full font-black text-xs cursor-not-allowed text-center border-2 border-[#ff91a4]">غير متوفر حالياً</button>` : 
                            `<button onclick="window.addWithQtyContext(this, '${prod.id}')" class="flex-1 py-3 bg-[#ff91a4] text-[#ffffff] border-2 border-[#ff91a4] rounded-full font-black text-xs text-center shadow-md hover:bg-[#ffffff] hover:text-[#ff91a4]">إضافة للسلة 🛍️</button>`
                        }
                    </div>
                </div>
                <div class="pt-6 mt-4 border-t-2 border-[#ff91a4] w-full">
                    <h3 class="font-black text-[#1a1a1a] text-sm mb-4 flex items-center gap-2"><i data-lucide="star" class="w-4 h-4 text-[#ff91a4]"></i> آراء عملاء بوسي</h3>
                    <div id="reviews-list-${prod.id}" class="space-y-3 min-h-[50px]">
                        <p class="text-xs text-[#1a1a1a] font-bold text-center py-4">جاري تحميل الآراء...</p>
                    </div>
                    <div class="mt-6 bg-[#ffffff] p-4 rounded-[2rem] border-2 border-[#ff91a4]">
                        <h4 class="font-black text-[#1a1a1a] text-xs mb-3 flex items-center gap-1.5"><i data-lucide="edit-3" class="w-4 h-4 text-[#ff91a4]"></i> رأيك بيفرق معانا.. شاركنا تجربتك مع طعم حلويات بوسي</h4>
                        <div class="space-y-3">
                            <input type="text" id="review-cust-name-${prod.id}" placeholder="الاسم..." class="w-full p-3 bg-[#ffffff] border-2 border-[#ff91a4] rounded-xl text-xs font-bold focus:outline-none text-[#1a1a1a]">
                            <textarea id="review-cust-comment-${prod.id}" rows="2" placeholder="رأيك في الطعم والجودة..." class="w-full p-3 bg-[#ffffff] border-2 border-[#ff91a4] rounded-xl text-xs font-bold focus:outline-none text-[#1a1a1a] resize-none"></textarea>
                            <div class="flex justify-between items-center bg-[#ffffff] p-2 rounded-xl border-2 border-[#ff91a4]">
                                <span class="text-[10px] font-bold text-[#1a1a1a]">التقييم:</span>
                                <select id="review-cust-rating-${prod.id}" class="text-xs font-black text-[#ff91a4] bg-transparent focus:outline-none border-none">
                                    <option value="5">⭐⭐⭐⭐⭐ (ممتاز)</option>
                                    <option value="4">⭐⭐⭐⭐ (جيد جداً)</option>
                                    <option value="3">⭐⭐⭐ (متوسط)</option>
                                </select>
                            </div>
                            <button id="review-submit-btn-${prod.id}" onclick="window.submitCustomerReviewLive('${prod.id}')" class="w-full py-2.5 bg-[#ff91a4] text-[#ffffff] rounded-xl text-xs font-black shadow-sm border-2 border-[#ff91a4] hover:bg-[#ffffff] hover:text-[#ff91a4] transition-all">إرسال التقييم</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const vProd = document.getElementById('view-product-details'); if(vProd) vProd.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
    if (window.loadLiveReviews) window.loadLiveReviews(prod.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.navigateToProduct = navigateToProduct;

export const renderMultiStepCakeBuilder = function() {
    const wrapper = document.getElementById('cake-builder-steps-wrapper');
    if (!wrapper) return;

    const basePrice = siteSettings.cakeBuilder.basePrice || 145;
    let printingPrice = 0;
    if (cakeState.printing === 'صورة قابلة للأكل') printingPrice = siteSettings.cakeBuilder.imagePrintingPrice || 60;
    else if (cakeState.printing === 'صورة غير قابلة للأكل') printingPrice = 20;
    const cardPrice = cakeState.hasCard ? 40 : 0;
    const currentPrice = (cakeState.persons * basePrice) + printingPrice + cardPrice;

    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`step-dot-${i}`);
        if (dot) {
            if (i <= window.currentBuilderStep) dot.classList.add('dot-active');
            else dot.classList.remove('dot-active');
        }
    }

    let stepContentHTML = '';

    if (window.currentBuilderStep === 1) {
        stepContentHTML = `
            <div class="relative w-full h-48 md:h-64 rounded-t-[3rem] overflow-hidden bg-[#ffffff] border-b-2 border-[#ff91a4]">
                <img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg" class="w-full h-full object-cover opacity-90" alt="تصميم تورت حلويات بوسي">
                <div class="absolute inset-0 bg-gradient-to-t from-[#ffffff] to-transparent"></div>
                <div class="absolute bottom-6 w-full text-center px-4">
                    <h2 class="text-3xl font-black uppercase tracking-tight text-[#ff91a4] drop-shadow-md">صمم تورتة مناسبتك السعيدة 👑</h2>
                </div>
            </div>
            <div class="cake-builder-step-panel step-active p-8 md:p-12 space-y-8 bg-[#ffffff]">
                <div class="bg-[#ffffff] border-2 border-[#ff91a4] rounded-2xl p-4 text-center">
                    <p class="text-xs font-bold text-[#1a1a1a]"><i data-lucide="info" class="w-4 h-4 inline text-[#ff91a4]"></i> تنويه احترافي: لضمان أعلى جودة، يُفضل تأكيد طلبات التورت المخصصة قبل الموعد بـ 48 ساعة.</p>
                </div>
                <div class="space-y-4">
                    <label class="block font-black text-lg text-[#1a1a1a] flex items-center gap-3"><i data-lucide="calendar-heart" class="w-5 h-5 text-[#ff91a4]"></i> نوع المناسبة السعيدة</label>
                    <input type="text" value="${escapeHTML(cakeState.occasion)}" oninput="cakeState.occasion = this.value" class="w-full p-4 bg-[#ffffff] border-2 border-[#ff91a4] rounded-xl text-sm font-bold focus:outline-none" placeholder="مثال: عيد ميلاد، خطوبة، تخرج، ذكرى زواج...">
                </div>
                <div class="space-y-4 pt-4 border-t-2 border-[#ff91a4]">
                    <label class="block font-black text-lg text-[#1a1a1a] flex items-center gap-3"><i data-lucide="cake" class="w-5 h-5 text-[#ff91a4]"></i> نكهة الكيك الأساسي</label>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        ${(siteSettings.cakeBuilder.flavors || ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت']).map(fl => `
                            <button onclick="window.updateCakeBuilderField('flavor', '${fl}')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.flavor === fl ? 'bg-[#ff91a4] text-[#ffffff] border-[#ff91a4] shadow-md transform scale-105' : 'bg-[#ffffff] border-[#ff91a4] text-[#1a1a1a] hover:bg-[#ff91a4] hover:text-[#ffffff]'}">${fl}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="space-y-4 pt-4 border-t-2 border-[#ff91a4]">
                    <label class="block font-black text-lg text-[#1a1a1a] flex items-center gap-3"><i data-lucide="box" class="w-5 h-5 text-[#ff91a4]"></i> التصميم والشكل الهندسي</label>
                    <div class="grid grid-cols-3 gap-4">
                        ${['دائري', 'مربع', 'مستطيل'].map(sh => `
                            <button onclick="window.updateCakeBuilderField('shape', '${sh}')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.shape === sh ? 'bg-[#ff91a4] text-[#ffffff] border-[#ff91a4] shadow-md transform scale-105' : 'bg-[#ffffff] border-[#ff91a4] text-[#1a1a1a] hover:bg-[#ff91a4] hover:text-[#ffffff]'}">${sh}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="flex justify-end pt-6 mt-4">
                    <button onclick="window.changeBuilderStep(1)" class="px-8 py-4 bg-[#ff91a4] text-[#ffffff] border-2 border-[#ff91a4] font-black text-sm rounded-full shadow-lg hover:bg-[#ffffff] hover:text-[#ff91a4] transition-all">التالي: الحجم والطباعة ⬅️</button>
                </div>
            </div>`;
    }
    else if (window.currentBuilderStep === 2) {
        stepContentHTML = `
            <div class="p-10 text-center bg-[#ffffff] border-b-2 border-[#ff91a4] relative z-10 rounded-t-[3rem]">
                <h2 class="text-3xl font-black mb-4 uppercase tracking-tight text-[#ff91a4]">الحجم وتفاصيل التصميم</h2>
            </div>
            <div class="cake-builder-step-panel step-active p-8 md:p-12 space-y-8 bg-[#ffffff]">
                <div class="space-y-4">
                    <label class="block font-black text-lg text-[#1a1a1a] flex items-center gap-3"><i data-lucide="users" class="w-5 h-5 text-[#ff91a4]"></i> عدد الأفراد (حجم التورتة)</label>
                    <div class="flex items-center justify-between border-2 rounded-[2rem] p-4 bg-[#ffffff] border-[#ff91a4] max-w-md mx-auto">
                        <button onclick="window.adjustBuilderPersons(-2)" class="p-3 bg-[#ffffff] border-2 border-[#ff91a4] text-[#ff91a4] rounded-2xl flex items-center justify-center font-black shadow-sm hover:bg-[#ff91a4] hover:text-[#ffffff] transition-all"><i data-lucide="minus" class="w-6 h-6"></i></button>
                        <span class="text-4xl font-black text-[#1a1a1a]">${cakeState.persons}</span>
                        <button onclick="window.adjustBuilderPersons(2)" class="p-3 bg-[#ffffff] border-2 border-[#ff91a4] text-[#ff91a4] rounded-2xl flex items-center justify-center font-black shadow-sm hover:bg-[#ff91a4] hover:text-[#ffffff] transition-all"><i data-lucide="plus" class="w-6 h-6"></i></button>
                    </div>
                </div>
                <div class="space-y-4 pt-4 border-t-2 border-[#ff91a4]">
                    <label class="block font-black text-lg text-[#1a1a1a] flex items-center gap-3"><i data-lucide="palette" class="w-5 h-5 text-[#ff91a4]"></i> أسلوب التصميم</label>
                    <div class="grid grid-cols-2 gap-4">
                        <button onclick="window.updateCakeBuilderField('designStyle', 'تصميم محدد')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.designStyle === 'تصميم محدد' ? 'bg-[#ff91a4] text-[#ffffff] border-[#ff91a4] shadow-md transform scale-105' : 'bg-[#ffffff] border-[#ff91a4] text-[#1a1a1a] hover:bg-[#ff91a4] hover:text-[#ffffff]'}">عندي تصميم محدد</button>
                        <button onclick="window.updateCakeBuilderField('designStyle', 'على ذوق بوسي')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.designStyle === 'على ذوق بوسي' ? 'bg-[#ff91a4] text-[#ffffff] border-[#ff91a4] shadow-md transform scale-105' : 'bg-[#ffffff] border-[#ff91a4] text-[#1a1a1a] hover:bg-[#ff91a4] hover:text-[#ffffff]'}">سيب الإبداع علينا</button>
                    </div>
                </div>
                <div class="space-y-4 pt-4 border-t-2 border-[#ff91a4]">
                    <label class="block font-black text-lg text-[#1a1a1a] flex items-center gap-3"><i data-lucide="printer" class="w-5 h-5 text-[#ff91a4]"></i> دمج وطباعة الصور</label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="window.updateCakeBuilderField('printing', 'بدون')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.printing === 'بدون' ? 'bg-[#ff91a4] text-[#ffffff] border-[#ff91a4] shadow-md transform scale-105' : 'bg-[#ffffff] border-[#ff91a4] text-[#1a1a1a] hover:bg-[#ff91a4] hover:text-[#ffffff]'}">بدون صورة</button>
                        <button onclick="window.updateCakeBuilderField('printing', 'صورة قابلة للأكل')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.printing === 'صورة قابلة للأكل' ? 'bg-[#ff91a4] text-[#ffffff] border-[#ff91a4] shadow-md transform scale-105' : 'bg-[#ffffff] border-[#ff91a4] text-[#1a1a1a] hover:bg-[#ff91a4] hover:text-[#ffffff]'}">صورة قابلة للأكل (+${siteSettings.cakeBuilder.imagePrintingPrice || 60} ج)</button>
                        <button onclick="window.updateCakeBuilderField('printing', 'صورة غير قابلة للأكل')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.printing === 'صورة غير قابلة للأكل' ? 'bg-[#ff91a4] text-[#ffffff] border-[#ff91a4] shadow-md transform scale-105' : 'bg-[#ffffff] border-[#ff91a4] text-[#1a1a1a] hover:bg-[#ff91a4] hover:text-[#ffffff]'}">صورة غير قابلة للأكل (+20 ج)</button>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row justify-between gap-4 pt-6 mt-4">
                    <button onclick="window.changeBuilderStep(-1)" class="px-8 py-4 bg-[#ffffff] border-2 border-[#ff91a4] text-[#1a1a1a] font-black text-sm rounded-full active:scale-95 hover:bg-[#ff91a4] hover:text-[#ffffff]">➡️ السابق</button>
                    <button onclick="window.changeBuilderStep(1)" class="px-8 py-4 bg-[#ff91a4] border-2 border-[#ff91a4] text-[#ffffff] font-black text-sm rounded-full shadow-lg hover:bg-[#ffffff] hover:text-[#ff91a4]">التالي: التخصيص النهائي ⬅️</button>
                </div>
            </div>`;
    }
    else if (window.currentBuilderStep === 3) {
        stepContentHTML = `
            <div class="p-10 text-center bg-[#ffffff] border-b-2 border-[#ff91a4] relative z-10 rounded-t-[3rem]">
                <h2 class="text-3xl font-black mb-4 uppercase tracking-tight text-[#ff91a4]">اللمسات الأخيرة والمراجعة</h2>
            </div>
            <div class="cake-builder-step-panel step-active p-8 md:p-12 space-y-8 bg-[#ffffff]">
                
                <div class="space-y-4">
                    <label class="block font-black text-lg text-[#1a1a1a] flex items-center gap-3"><i data-lucide="image-plus" class="w-5 h-5 text-[#ff91a4]"></i> إرفاق صورة (للتصميم أو الطباعة)</label>
                    <div class="border-2 border-dashed border-[#ff91a4] p-4 rounded-2xl text-center bg-[#ffffff]">
                        <input type="file" id="cake-image-upload" accept="image/*" class="hidden" onchange="window.handleCakeImageUpload(this)">
                        <label for="cake-image-upload" class="cursor-pointer inline-flex items-center gap-2 bg-[#ff91a4] text-[#ffffff] px-6 py-3 rounded-full font-bold text-sm hover:bg-[#ffffff] hover:text-[#ff91a4] border-2 border-[#ff91a4] transition-colors">
                            <i data-lucide="upload-cloud" class="w-4 h-4"></i> رفع صورة توضيحية
                        </label>
                        <p class="text-[11px] font-bold text-[#1a1a1a] mt-3">يتم إرفاق نسخة مصغرة لتأكيد الطلب. للإدارة الحق في طلب الصورة الأصلية عالية الجودة عبر الواتساب لضمان دقة التنفيذ.</p>
                        ${cakeState.refImage ? `<div class="mt-3 inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold border border-green-200 rounded-lg">تم إرفاق الصورة بنجاح ✅</div>` : ''}
                    </div>
                </div>

                <div class="space-y-4 pt-4 border-t-2 border-[#ff91a4]">
                    <div class="flex items-center justify-between">
                        <label class="font-black text-lg text-[#1a1a1a] flex items-center gap-3"><i data-lucide="mail" class="w-5 h-5 text-[#ff91a4]"></i> كارت إهداء راقي (+40 ج.م)</label>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" class="sr-only peer" ${cakeState.hasCard ? 'checked' : ''} onchange="window.updateCakeBuilderField('hasCard', this.checked)">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff91a4]"></div>
                        </label>
                    </div>
                    ${cakeState.hasCard ? `<textarea rows="2" oninput="cakeState.cardText = this.value" class="w-full p-4 bg-[#ffffff] border-2 border-[#ff91a4] rounded-xl font-bold text-[#1a1a1a] text-sm focus:outline-none resize-none" placeholder="اكتب رسالتك للإهداء هنا...">${escapeHTML(cakeState.cardText)}</textarea>` : ''}
                </div>

                <div class="space-y-4 pt-4 border-t-2 border-[#ff91a4]">
                    <label class="block font-black text-lg text-[#1a1a1a] flex items-center gap-3 text-red-500"><i data-lucide="shield-alert" class="w-5 h-5 text-red-500"></i> موانع صحية أو حساسية (إن وجد)</label>
                    <input type="text" value="${escapeHTML(cakeState.allergies)}" oninput="cakeState.allergies = this.value" class="w-full p-4 bg-[#ffffff] border-2 border-red-300 rounded-xl text-sm font-bold focus:outline-none focus:border-red-500 placeholder-red-300" placeholder="مثال: حساسية مكسرات، حساسية فراولة، الخ...">
                </div>

                <div class="space-y-4 pt-4 border-t-2 border-[#ff91a4]">
                    <label class="block font-black text-lg text-[#1a1a1a] flex items-center gap-3"><i data-lucide="edit-3" class="w-5 h-5 text-[#ff91a4]"></i> ملاحظات دقيقة للإدارة</label>
                    <textarea rows="3" oninput="cakeState.notes = this.value" class="w-full p-4 bg-[#ffffff] border-2 border-[#ff91a4] rounded-xl font-bold text-[#1a1a1a] text-sm focus:outline-none resize-none" placeholder="الاسم للكتابة على التورتة، السن، الألوان المفضلة...">${escapeHTML(cakeState.notes)}</textarea>
                </div>
                
                <div class="bg-[#ffffff] p-6 rounded-[2rem] border-2 border-[#ff91a4] space-y-3 mt-6">
                    <h4 class="font-black text-[#1a1a1a] text-lg mb-4 border-b-2 border-[#ff91a4] pb-3 flex items-center gap-2"><i data-lucide="file-check-2" class="w-5 h-5 text-[#ff91a4]"></i> ملخص الاعتماد:</h4>
                    <div class="flex justify-between items-center text-sm"><span class="font-bold text-[#1a1a1a]">النوع:</span><span class="font-black text-[#1a1a1a]">${cakeState.flavor} (${cakeState.shape})</span></div>
                    <div class="flex justify-between items-center text-sm"><span class="font-bold text-[#1a1a1a]">تكفي:</span><span class="font-black text-[#1a1a1a]">${cakeState.persons} أفراد</span></div>
                    <div class="flex justify-between items-center text-sm"><span class="font-bold text-[#1a1a1a]">إضافات:</span><span class="font-black text-[#1a1a1a]">${cakeState.printing}${cakeState.hasCard ? ' + كارت إهداء' : ''}</span></div>
                    <div class="flex justify-between items-center pt-4 border-t-2 border-[#ff91a4] mt-4 text-lg font-black">
                        <span class="text-[#1a1a1a]">القيمة التقديرية:</span>
                        <span class="text-2xl text-[#ff91a4] font-mono">${currentPrice} ج.م</span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row justify-between gap-4 pt-6 mt-4">
                    <button onclick="window.changeBuilderStep(-1)" class="px-8 py-4 bg-[#ffffff] border-2 border-[#ff91a4] text-[#1a1a1a] font-black text-sm rounded-full active:scale-95 hover:bg-[#ff91a4] hover:text-[#ffffff]">➡️ تعديل البيانات</button>
                    <button onclick="window.commitCakeBuilderToCart()" class="px-8 py-4 bg-[#ff91a4] text-[#ffffff] border-2 border-[#ff91a4] font-black text-lg rounded-full shadow-xl flex-1 text-center hover:bg-[#ffffff] hover:text-[#ff91a4]">اعتماد وإضافة للسلة 👑</button>
                </div>
            </div>`;
    }

    wrapper.innerHTML = stepContentHTML;
    if (window.lucide) lucide.createIcons();
};
window.renderMultiStepCakeBuilder = renderMultiStepCakeBuilder;

// دالة لمعالجة الصورة المرفوعة وربطها بالمحرك
window.handleCakeImageUpload = async function(input) {
    if (input.files && input.files[0]) {
        try {
            const compressedBase64 = await window.MemoryManager.compressImageClientSide ? window.MemoryManager.compressImageClientSide(input.files[0]) : (await import('./utils.js')).compressImageClientSide(input.files[0]);
            cakeState.refImage = compressedBase64;
            window.renderMultiStepCakeBuilder();
            showSystemToast('تم إرفاق ومعالجة الصورة بنجاح.', 'success');
        } catch (e) {
            showSystemToast('حدث خطأ أثناء معالجة الصورة، يرجى إرسالها عبر الواتساب لاحقاً.', 'error');
        }
    }
};
export const changeBuilderStep = function(delta) {
    window.currentBuilderStep += delta;
    if (window.currentBuilderStep < 1) window.currentBuilderStep = 1;
    if (window.currentBuilderStep > 3) window.currentBuilderStep = 3;
    window.renderMultiStepCakeBuilder();
};
window.changeBuilderStep = changeBuilderStep;

export const updateCakeBuilderField = function(field, value) {
    cakeState[field] = value;
    if (field === 'shape') {
        if (value === 'مربع' && cakeState.persons < 16) cakeState.persons = 16;
        else if (value === 'مستطيل' && cakeState.persons < 20) cakeState.persons = 20;
        else if (value === 'دائري' && cakeState.persons < 4) cakeState.persons = 4;
    }
    window.renderMultiStepCakeBuilder();
};
window.updateCakeBuilderField = updateCakeBuilderField;

export const adjustBuilderPersons = function(delta) {
    let newPersons = cakeState.persons + delta;
    let limit = 4;
    if (cakeState.shape === 'مربع') limit = 16;
    if (cakeState.shape === 'مستطيل') limit = 20;
    
    if (newPersons < limit) newPersons = limit;
    if (newPersons > 100) newPersons = 100;
    
    cakeState.persons = newPersons;
    window.renderMultiStepCakeBuilder();
};
window.adjustBuilderPersons = adjustBuilderPersons;

// 👑 دالة هندسية متطورة لرسم بطاقات المنتجات بتقنية Blur-up مع تصفية لونية صارمة
export const drawProductCard = function(p) {
    if (!p) return '';
    const pIdSafe = String(p.id || ''); 
    const isOutOfStock = p.inStock === false;
    
    const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://via.placeholder.com/400x400/ffffff/ff91a4.png?text=BoseSweets';
    let rawImageUrl = defaultFallbackImage;
    
    if (p.images && p.images.length > 0 && p.images[0] && String(p.images[0]).trim() !== '') {
        rawImageUrl = p.images[0];
    } else if (p.img && String(p.img).trim() !== '') {
        rawImageUrl = p.img;
    } else if (typeof window.getImgFallback === 'function') {
        rawImageUrl = window.getImgFallback(p.category) || defaultFallbackImage;
    }

    const displayImg = optimizeCloudinaryUrl(rawImageUrl);
    
    let discountBadgeHtml = '';
    const oldP = Number(p.oldPrice);
    const currentP = Number(p.price);
    if (oldP && oldP > currentP) {
        const discountPercent = Math.round(((oldP - currentP) / oldP) * 100);
        discountBadgeHtml = `<div class="text-[#ff91a4] text-sm font-black mb-2 px-3 py-1 bg-[#ffffff] rounded-full inline-block border-2 border-[#ff91a4]">خصم ${discountPercent}% 🔥</div>`;
    } else if (p.badge) {
        discountBadgeHtml = `<div class="text-[#ff91a4] text-sm font-black mb-2 px-3 py-1 bg-[#ffffff] rounded-full inline-block border-2 border-[#ff91a4]">${escapeHTML(p.badge)}</div>`;
    }

    let cardHtml = `
    <div id="product-card-${pIdSafe}" class="product-card-premium">
        <div class="product-image-glow w-full aspect-square mb-4 relative overflow-hidden rounded-[2rem]" onclick="navigateToProduct('${pIdSafe}')">
            <img src="${displayImg}" class="${isOutOfStock ? 'grayscale opacity-70' : ''} blur-load w-full h-full object-contain transition-all duration-700 hover:scale-110 cursor-pointer" loading="lazy" decoding="async" alt="صنف ${escapeHTML(p.name)} من قسم ${escapeHTML(p.category)} - حلويات بوسي بمركز الفرافرة" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(p.category)}');">
            ${isOutOfStock ? `<div class="absolute inset-0 bg-[#ffffff]/50 backdrop-blur-[4px] z-10 flex items-center justify-center"><span class="bg-[#ff91a4] text-[#ffffff] font-black px-4 py-2 rounded-xl shadow-lg border-2 border-[#ffffff]">نفدت الكمية</span></div>` : ''}
        </div>
        
        <div class="flex flex-col flex-1 text-center bg-[#ffffff] relative z-20">
            ${discountBadgeHtml}
            <h4 class="text-xl font-black leading-tight text-[#1a1a1a] mb-2">${escapeHTML(p.name)}</h4>
            <p class="text-sm font-bold text-[#1a1a1a] mb-4 line-clamp-3 leading-relaxed">${getFinalDescription(p)}</p>
            
            <div class="mt-auto flex flex-col gap-4 w-full border-t-2 border-[#ff91a4] pt-4">
                <div class="flex items-center justify-center rounded-full py-2 px-4 mx-auto min-w-[70%] bg-[#ffffff] border-2 border-[#ff91a4] shadow-sm">
                    <span class="font-black text-2xl text-[#ff91a4]">${currentP > 0 ? currentP + ' ج.م' : 'حسب الطلب'}</span>
                    ${(oldP && oldP > currentP) ? `<del class="text-sm text-[#1a1a1a] font-bold ml-2">${oldP}</del>` : ''}
                </div>
                
                <div class="flex flex-col gap-3 w-full">
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2 bg-[#ffffff] rounded-full p-1 border-2 border-[#ff91a4] shadow-inner quantity-controls">
                            <button onclick="updateTempQtyContext(this, -1)" class="w-10 h-10 flex items-center justify-center bg-[#ffffff] border-2 border-[#ff91a4] rounded-full shadow-sm text-[#ff91a4] hover:bg-[#ff91a4] hover:text-[#ffffff] font-black transition-all"><i data-lucide="minus" class="w-4 h-4"></i></button>
                            <span class="temp-qty-display text-lg font-black text-[#1a1a1a] w-6 text-center" data-prod-id="${pIdSafe}">1</span>
                            <button onclick="updateTempQtyContext(this, 1)" class="w-10 h-10 flex items-center justify-center bg-[#ffffff] border-2 border-[#ff91a4] rounded-full shadow-sm text-[#ff91a4] hover:bg-[#ff91a4] hover:text-[#ffffff] font-black transition-all"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        </div>
                        ${isOutOfStock ? 
                        `<button class="flex-1 py-3 bg-[#ffffff] text-[#1a1a1a] rounded-full font-black text-lg shadow-inner cursor-not-allowed border-2 border-[#ff91a4]">غير متوفر</button>` 
                        : 
                        `<button onclick="addWithQtyContext(this, '${pIdSafe}')" class="flex-1 py-3 bg-[#ff91a4] text-[#ffffff] border-2 border-[#ff91a4] rounded-full font-black text-lg btn-premium-action flex items-center justify-center gap-2 hover:bg-[#ffffff] hover:text-[#ff91a4]"><i data-lucide="shopping-bag" class="w-5 h-5"></i> إضافة للسلة</button>`
                        }
                    </div>
                    <div class="flex gap-2 w-full">
                        <button onclick="navigateToProduct('${pIdSafe}')" class="flex-1 py-2.5 bg-[#ffffff] text-[#1a1a1a] rounded-full font-bold text-sm hover:bg-[#ff91a4] hover:text-[#ffffff] transition-colors border-2 border-[#ff91a4]">استعراض التفاصيل</button>
                        <button onclick="shareProduct('${pIdSafe}', '${escapeHTML(p.name)}')" class="px-3 bg-[#ffffff] text-[#ff91a4] rounded-full hover:bg-[#ff91a4] hover:text-[#ffffff] transition-colors border-2 border-[#ff91a4] flex items-center justify-center"><i data-lucide="share-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    // فلترة وضبط الألوان للحفاظ على هوية براند حلويات بوسي
    cardHtml = cardHtml.replace(/#ff3377/g, '#ff91a4'); 
    cardHtml = cardHtml.replace(/#4E342E/g, '#1a1a1a'); 
    cardHtml = cardHtml.replace(/bg-red-50/g, 'bg-[#ffffff]'); 
    cardHtml = cardHtml.replace(/text-red-500/g, 'text-[#ff91a4]'); 

    return cardHtml;
};
window.drawProductCard = drawProductCard;

export const renderCartList = function() {
    const container = document.getElementById('cart-items-list') || document.getElementById('cart-items-container'); 
    const totalDisplay = document.getElementById('cart-total-display') || document.getElementById('cart-total-price-display');
    const badge = document.getElementById('cart-badge-count');
    
    if (badge) {
        const totalItemsCount = state.cart.reduce((sum, item) => sum + Number(item.quantity), 0);
        if (totalItemsCount > 0) { badge.innerText = totalItemsCount; badge.classList.remove('hidden'); }
        else { badge.classList.add('hidden'); }
    }
    
    if (!container) return;
    if (state.cart.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center py-20 px-6 text-center bg-[#ffffff] rounded-[2.5rem] border-2 border-dashed border-[#ff91a4]"><i data-lucide="shopping-bag" class="w-16 h-16 mb-6 text-[#ff91a4]"></i><h3 class="font-black text-2xl text-[#1a1a1a] mb-4">السلة فارغة حالياً.</h3><button onclick="window.showMenuView ? window.showMenuView() : (window.toggleCart && window.toggleCart(false))" class="text-[#ffffff] px-10 py-4 rounded-full font-black text-lg bg-[#ff91a4] border-2 border-[#ff91a4] hover:bg-[#ffffff] hover:text-[#ff91a4] btn-premium-action">استكشف المنيو</button></div>`;
        if (totalDisplay) totalDisplay.innerText = "0 ج.م"; 
        if (window.lucide) lucide.createIcons(); 
        return;
    }
    
    let total = 0;
    container.innerHTML = state.cart.map(item => {
        const identifier = item.cartItemId || item.id; 
        const q = Number(item.quantity); 
        const p = Number(item.price); 
        total += (p * q);
        
        const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://via.placeholder.com/400x400/ffffff/ff91a4.png?text=BoseSweets';
        let rawImageUrl = defaultFallbackImage;
        if (item.images && item.images.length > 0 && item.images[0] && String(item.images[0]).trim() !== '') {
            rawImageUrl = item.images[0];
        } else if (item.img && String(item.img).trim() !== '') {
            rawImageUrl = item.img;
        } else if (typeof window.getImgFallback === 'function') {
            rawImageUrl = window.getImgFallback(item.category) || defaultFallbackImage;
        }
        const renderImg = optimizeCloudinaryUrl(rawImageUrl);
        
        // هندسة الواجهة الجديدة: فصل السعر عن أزرار الكمية وعرض تصنيف المنتج بوضوح
        return `
        <div class="cart-item-premium flex flex-col bg-[#ffffff] p-4 rounded-[2rem] border-2 border-[#ff91a4] shadow-sm relative mb-4">
            <div class="absolute top-4 left-4 z-10">
                <button onclick="window.modQ('${identifier}', 'remove')" class="p-2 text-[#ff91a4] hover:bg-[#ff91a4] hover:text-[#ffffff] border-2 border-transparent hover:border-[#ff91a4] rounded-xl transition-all"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
            
            <div class="flex items-start gap-4 mb-4">
                <div class="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] overflow-hidden shrink-0 bg-[#ffffff] border-2 border-[#ff91a4] p-1 flex items-center justify-center">
                    <img src="${renderImg}" class="w-full h-full object-contain" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(item.category)}');">
                </div>
                <div class="flex-1 text-right pr-2 pt-1 min-w-0">
                    <span class="text-[10px] font-black text-[#ffffff] bg-[#ff91a4] px-3 py-1 rounded-full mb-2 inline-block shadow-sm">${escapeHTML(item.category)}</span>
                    <h4 class="font-black text-sm md:text-base text-[#1a1a1a] mb-1 leading-tight pr-8 truncate">${escapeHTML(item.name)}</h4>
                    ${item.isCustom ? `<p class="text-[11px] font-bold text-[#1a1a1a] leading-relaxed line-clamp-2">${escapeHTML(item.desc)}</p>` : ''}
                </div>
            </div>
            
            <div class="flex justify-between items-center border-t-2 border-[#ff91a4] pt-4 mt-auto">
                <div class="font-black text-[#ff91a4] text-xl font-mono">${p} ج.م</div>
                <div class="flex items-center gap-3 bg-[#ffffff] rounded-full p-1 border-2 border-[#ff91a4] shadow-sm">
                    <button class="w-8 h-8 flex justify-center items-center rounded-full text-[#ff91a4] hover:bg-[#ff91a4] hover:text-[#ffffff] font-black transition-all" onclick="window.modQ('${identifier}', -1)"><i data-lucide="minus" class="w-4 h-4"></i></button>
                    <span class="font-black text-base text-[#1a1a1a] w-6 text-center">${q}</span>
                    <button class="w-8 h-8 flex justify-center items-center rounded-full text-[#ff91a4] hover:bg-[#ff91a4] hover:text-[#ffffff] font-black transition-all" onclick="window.modQ('${identifier}', 1)"><i data-lucide="plus" class="w-4 h-4"></i></button>
                </div>
            </div>
        </div>`;
    }).join('');
    
    if (totalDisplay) totalDisplay.innerText = total + " ج.م";
    if (window.lucide) lucide.createIcons();
};
window.renderCartList = renderCartList;

export const renderSmartSuggestions = function(context = 'main') {
    if (context === 'main' && siteSettings.Structure_Settings && siteSettings.Structure_Settings.section_youMayAlsoLike_isActive === false) {
        const parentArea = document.getElementById('related-products-area');
        if (parentArea) parentArea.classList.add('hidden');
        return;
    }

    const containerId = context === 'cart' ? 'cart-suggestions-container' : 'related-products-container';
    const parentAreaId = context === 'cart' ? 'cart-suggestions-area' : 'related-products-area';
    
    const container = document.getElementById(containerId);
    const parentArea = document.getElementById(parentAreaId);

    if (!container || !parentArea) return;

    const cartIds = state.cart.map(i => String(i.id));
    
    let availableProducts = catalog.filter(p => p && p.inStock !== false && !cartIds.includes(String(p.id)) && p.category !== state.activeCat);
    
    if (availableProducts.length === 0) {
        parentArea.classList.add('hidden');
        return;
    }

    parentArea.classList.remove('hidden');

    let userPrefs = {};
    try { userPrefs = JSON.parse(localStorage.getItem('bose_user_prefs')) || {}; } catch(e) {}
    
    const sortedProducts = availableProducts.sort((a, b) => {
        const scoreA = userPrefs[a.category] || 0;
        const scoreB = userPrefs[b.category] || 0;
        return (scoreB - scoreA) + (0.5 - Math.random());
    });
    
    const suggestions = sortedProducts.slice(0, context === 'cart' ? 4 : 8);

    container.innerHTML = suggestions.map(p => {
        const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://via.placeholder.com/400x400/ffffff/ff91a4.png?text=BoseSweets';
        let rawImageUrl = defaultFallbackImage;
        if (p.images && p.images.length > 0 && p.images[0] && String(p.images[0]).trim() !== '') {
            rawImageUrl = p.images[0];
        } else if (p.img && String(p.img).trim() !== '') {
            rawImageUrl = p.img;
        } else if (typeof window.getImgFallback === 'function') {
            rawImageUrl = window.getImgFallback(p.category) || defaultFallbackImage;
        }
        const img = optimizeCloudinaryUrl(rawImageUrl);
        
        // استخدام object-cover حصرياً لهذا القسم لإبراز التفاصيل
        return `<div class="shrink-0 w-[240px] snap-slide bg-[#ffffff] border-2 border-[#ff91a4] rounded-[2rem] p-4 shadow-sm flex flex-col group hover:-translate-y-2 transition-transform cursor-pointer" onclick="navigateToProduct('${p.id}')">
            <div class="relative w-full aspect-square mb-4 rounded-xl overflow-hidden bg-[#ffffff] border-2 border-[#ff91a4] flex items-center justify-center p-0">
                <img src="${img}" class="w-full h-full object-cover drop-shadow-sm transition-transform duration-500 group-hover:scale-110" loading="lazy" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(p.category)}');">
            </div>
            <div class="flex-1 flex flex-col text-center">
                <span class="text-[10px] bg-[#ff91a4] text-[#ffffff] px-3 py-1 rounded-full font-black mb-2 self-center shadow-sm">${escapeHTML(p.category)}</span>
                <h5 class="text-[15px] font-black text-[#1a1a1a] mb-2 leading-tight line-clamp-1">${escapeHTML(p.name)}</h5>
                <div class="mt-auto">
                    <span class="font-black text-[#ff91a4] block mb-3 text-lg font-mono">${p.price > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span>
                    <button onclick="event.stopPropagation(); addWithQtyContext(this, '${p.id}')" class="w-full py-2.5 bg-[#ffffff] text-[#ff91a4] rounded-full font-black hover:bg-[#ff91a4] hover:text-[#ffffff] transition-colors border-2 border-[#ff91a4] flex items-center justify-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> إضافة</button>
                </div>
            </div>
        </div>`;
    }).join('');
    
    if(window.lucide) lucide.createIcons();
};
window.renderSmartSuggestions = renderSmartSuggestions;

export const showInfo = function(t) {
    const d = { 
        about: { t: 'عن حلويات بوسي', b: siteSettings.footerQuote || 'العلامة التجارية الرائدة في صناعة الحلويات الفاخرة بالفرافرة.' }, 
        privacy: { t: 'سياسة الأمان والبيانات', b: 'بنلتزم في حلويات بوسي بحماية بيانات عملائنا وفق أعلى معايير الخصوصية.' }, 
        refund: { t: 'سياسة الاستبدال والاسترجاع', b: 'كل طلباتنا بتخضع لرقابة جودة صارمة عشان نضمن رضاك التام.' } 
    };
    if(!d[t]) return;
    const titleEl = document.getElementById('info-title');
    const bodyEl = document.getElementById('info-body');
    if(titleEl) titleEl.innerText = d[t].t; 
    if(bodyEl) bodyEl.innerText = d[t].b;
    const m = document.getElementById('info-modal'); 
    if(m) { m.classList.remove('hidden'); m.classList.add('flex'); }
    if(window.lucide) lucide.createIcons();
};
window.showInfo = showInfo;

export const closeInfo = function() { 
    const m = document.getElementById('info-modal'); 
    if(m) { m.classList.add('hidden'); m.classList.remove('flex'); }
    MemoryManager.flush(); 
};
window.closeInfo = closeInfo;

export const submitCustomerReviewLive = async function(productId) {
    const nameInput = document.getElementById(`review-cust-name-${productId}`);
    const commentInput = document.getElementById(`review-cust-comment-${productId}`);
    const ratingSelect = document.getElementById(`review-cust-rating-${productId}`);
    const submitBtn = document.getElementById(`review-submit-btn-${productId}`);

    if (!nameInput || !commentInput || !ratingSelect) return;

    // 👑 تعقيم وتأمين المدخلات لحماية قواعد البيانات من الحقن البرمجي
    const customerName = escapeHTML(nameInput.value.trim());
    const comment = escapeHTML(commentInput.value.trim());
    const rating = parseInt(ratingSelect.value) || 5;

    if (!customerName || !comment) {
        showSystemToast("اكتب الاسم ورأيك عشان التقييم يوصل ✨", "error");
        return;
    }

    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.innerText = "جاري الحفظ...";

    const reviewId = 'rev_' + Date.now().toString(36);
    const serverTime = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : Date.now();
    
    const reviewPayload = {
        reviewId: reviewId,
        customerName: customerName,
        rating: rating,
        comment: comment,
        timestamp: serverTime,
        isApproved: false 
    };

    try {
        // 👑 الترقية السيادية: توجيه التقييم عبر محرك السحابة لتأمين الحفظ الأوفلاين
        const collectionPath = `catalog/${productId}/livereviews`;
        if (window.NetworkEngine && typeof window.NetworkEngine.safeWrite === 'function') {
            await window.NetworkEngine.safeWrite(collectionPath, reviewId, reviewPayload);
        } else if (typeof db !== 'undefined') {
            await db.collection('catalog').doc(String(productId)).collection('livereviews').doc(reviewId).set(reviewPayload);
        }
        showSystemToast("شكراً ليك! تم إرسال تقييمك بنجاح 👑", "success");
        nameInput.value = '';
        commentInput.value = '';
    } catch (e) {
        showSystemToast("حدث تأخير في الشبكة، تم الحفظ وجاري الإرسال", "info");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "إرسال التقييم";
    }
};
window.submitCustomerReviewLive = submitCustomerReviewLive;

export const setCategory = function(c) {
    if (c === 'الرئيسية') {
        if(window.showHomeView) window.showHomeView();
        else if(window.goToHome) window.goToHome();
        state.activeCat = 'الرئيسية';
    } else {
        state.activeCat = c;
        if(window.showMenuView) window.showMenuView();
        else if(window.switchToMenuView) window.switchToMenuView();
        
        window.renderMainDisplay && window.renderMainDisplay();

        MemoryManager.set('scroll_to_products', () => {
            const displayContainer = document.getElementById('display-container');
            const catDescArea = document.getElementById('category-description-area');
            const targetElement = (catDescArea && !catDescArea.classList.contains('hidden')) ? catDescArea : displayContainer;
            
            if (targetElement) {
                const headerOffset = 140; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        }, 100);
    }
    
    renderCategories();
    history.pushState({category: c}, '', `?category=${encodeURIComponent(c)}`);
    
    MemoryManager.set('scroll_cat', () => { 
        const safeId = String(c).replace(/\s+/g, '-');
        const activeBtn = document.getElementById(`cat-btn-${safeId}`); 
        if (activeBtn) { activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } 
    }, 50);
};
window.setCategory = setCategory;

/* محرك تصحيح التبويبات والأقسام - حلويات بوسي */
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();

    document.body.addEventListener('click', function(e) {
        const tabBtn = e.target.closest('.category-tab, .cat-btn, [onclick*="Category"], [onclick*="Cat"]');
        
        if (tabBtn) {
            setTimeout(() => {
                const productContainers = document.querySelectorAll('.products-grid, #products-container, .catalog-grid, [id*="grid"], #display-container');
                
                productContainers.forEach(container => {
                    if (container) {
                        container.style.display = 'grid'; 
                        container.classList.remove('hidden'); 
                    }
                });
            }, 150);
        }
    });
});
