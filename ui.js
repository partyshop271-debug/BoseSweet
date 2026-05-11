/**
 * 👑 BoseSweets UI Engine (V22.0 - Sovereign Architecture Edition)
 * محرك العرض والواجهات السيادي - حلويات بوسي
 * تم التطوير لضمان ثبات الواجهات، استقرار الشلال والأقسام، ومنع الاختفاء الفني للمكونات.
 * القرار المهني: تم تأمين كافة عمليات الإدراج (DOM) بحواجز حماية لضمان عدم توقف الموقع، وتم توحيد بروتوكولات التوجيه.
 * تم إعادة هيكلة العرض لمنع التكدس مع الحفاظ على الكود الأساسي كاملاً دون اختصار.
 */

import { detailedDescriptions, dSizes, fTypes } from './config.js';
import { siteSettings, catalog, galleryData, catMenu, state, cakeState, isAppReady, shippingZones } from './state.js';
import { MemoryManager, hexToMathHSL, escapeHTML, optimizeCloudinaryUrl, showSystemToast } from './utils.js';

const db = window.db || (typeof window !== 'undefined' && window.firebase ? window.firebase.firestore() : undefined);
const firebase = window.firebase || (typeof window !== 'undefined' ? window.firebase : undefined);

// 👑 بناء الدالة داخلياً لضمان عدم انهيار النظام البصري
export const getImgFallback = function(category) {
    return (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
};
window.getImgFallback = getImgFallback;
window.currentBuilderStep = 1;

export const getFinalDescription = function(p) {
    if (!p) return '';
    
    // 1. الأولوية المطلقة للوصف المكتوب يدوياً من لوحة التحكم
    if (p.desc && typeof p.desc === 'string' && p.desc.trim().length > 3) {
        return escapeHTML(p.desc.trim());
    }
    
    const name = (p.name ? String(p.name) : '').trim();
    const category = (p.category ? String(p.category) : '').trim();
    const subType = (p.subType || p.size || '').trim();
    
    // 2. البحث الدقيق في القاموس السيادي
    for (let key in detailedDescriptions) {
        if (name.includes(key) || `${category} ${subType}`.includes(key)) {
            return detailedDescriptions[key];
        }
    }
    
    // 3. محرك التوليد الآلي الاحترافي
    let dynamicDesc = `إصدار فاخر من قائمة ${escapeHTML(category)} الخاصة بحلويات بوسي. `;
    
    if (category.includes('تورت')) {
        dynamicDesc = `تورتة ${escapeHTML(name)} مصممة بحرفية عالية لتناسب مناسباتك السعيدة، تعتمد على مكونات طازجة وحشوات غنية تضمن لك تجربة تذوق تليق بضيوفك.`;
    } else if (category.includes('دوناتس') || category.includes('بامبوليني')) {
        dynamicDesc = `قطع ${escapeHTML(name)} المحضرة من عجينة مخبوزات خفيفة وطازجة، مدعمة بتغطية غنية ومكونات مضبوطة بدقة لتقديم حلاوة معتدلة وقوام طري.`;
    } else if (category.includes('سينابون')) {
        dynamicDesc = `لفائف ${escapeHTML(name)} المخبوزة من عجينة الخميرة الطبيعية، تتميز بقوام قطني هش يتداخل مع الإضافات المميزة لضمان طعم غني في كل قطعة.`;
    } else if (name.includes('نوتيلا')) {
        dynamicDesc += `تعتمد تركيبة ${escapeHTML(name)} بشكل أساسي على دمج قوام المنتج مع شوكولاتة النوتيلا الأصلية لرفع القيمة التذوقية وإعطاء طعم مكثف.`;
    } else if (name.includes('لوتس')) {
        dynamicDesc += `يتميز ${escapeHTML(name)} بإضافة زبدة اللوتس الكثيفة التي تمنح المنتج نكهة مكرملة وقواماً متكاملاً يلبي تطلعاتك.`;
    } else {
        dynamicDesc += `يتم تحضير ${escapeHTML(name)} وفق أعلى معايير الجودة المعتمدة في مطبخنا، بمكونات مختارة بعناية لتقديم مذاق أصيل وموزون.`;
    }
    
    return dynamicDesc;
};
window.getFinalDescription = getFinalDescription;

export const getCapsuleDescription = function(p) {
    return getFinalDescription(p);
};
window.getCapsuleDescription = getCapsuleDescription;

// ============================================================================
// هندسة التنقل بين الواجهات (Sovereign Views Management)
// ============================================================================

const hideAllViews = () => {
    ['view-home', 'view-menu', 'view-tips', 'view-cake-builder', 'view-product-details', 'home-view', 'menu-view', 'product-details-view'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { el.classList.add('hidden'); el.style.display = 'none'; }
    });
};

export const showHomeView = function() {
    try {
        hideAllViews();
        const vHome = document.getElementById('view-home') || document.getElementById('home-view'); 
        if(vHome) {
            vHome.classList.remove('hidden');
            vHome.style.display = 'block';
        }
        
        // إخفاء الأقسام لمنع التكدس بالرئيسية
        const waterfallContainer = document.getElementById('waterfall-section') || document.getElementById('waterfall-container');
        if(waterfallContainer) waterfallContainer.classList.add('hidden');
        const mainContent = document.getElementById('main-display-area');
        if(mainContent) mainContent.classList.add('hidden');
        
        if(typeof setActiveCategoryPill === 'function') setActiveCategoryPill('all');
        if(typeof state !== 'undefined') state.activeCat = 'الرئيسية';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.warn("استثناء أثناء عرض الرئيسية", e); }
};
window.showHomeView = showHomeView;

export const showMenuView = function() {
    try {
        hideAllViews();
        const vMenu = document.getElementById('view-menu') || document.getElementById('menu-view'); 
        if(vMenu) {
            vMenu.classList.remove('hidden');
            vMenu.style.display = 'block';
        }
        
        const mainContent = document.getElementById('main-display-area');
        if(mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.style.display = 'block';
        }

        if (typeof state !== 'undefined' && state.activeCat === 'الرئيسية') {
            state.activeCat = 'المنيو'; 
        }
        
        if(window.renderMainDisplay) window.renderMainDisplay();
        if(window.renderCategories) window.renderCategories();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.warn("استثناء أثناء عرض المنيو", e); }
};
window.showMenuView = showMenuView;

export const showGoldenTips = function() {
    try {
        hideAllViews();
        const vTips = document.getElementById('view-tips'); 
        if(vTips) {
            vTips.classList.remove('hidden');
            vTips.style.display = 'block';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) {}
};
window.showGoldenTips = showGoldenTips;

export const showCakeBuilderView = function() {
    try {
        hideAllViews();
        const vCake = document.getElementById('view-cake-builder'); 
        if(vCake) {
            vCake.classList.remove('hidden');
            vCake.style.display = 'block';
        }
        
        window.currentBuilderStep = 1;
        if(window.renderMultiStepCakeBuilder) window.renderMultiStepCakeBuilder();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) {}
};
window.showCakeBuilderView = showCakeBuilderView;

export const navigateDirectlyToCat = function(categoryName) {
    if(typeof state !== 'undefined') state.activeCat = categoryName;
    showMenuView();
    if(typeof window.toggleSidebarMenu === 'function') window.toggleSidebarMenu(false);
};
window.navigateDirectlyToCat = navigateDirectlyToCat;

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
    const reviewsContainer = document.getElementById(`reviews-list-${productId}`) || document.getElementById('product-reviews-container');
    if (!reviewsContainer || typeof db === 'undefined') return;

    try {
        const snapshot = await db.collection('catalog').doc(String(productId)).collection('livereviews').where('isApproved', '==', true).orderBy('timestamp', 'desc').limit(10).get();
        if (snapshot.empty) {
            reviewsContainer.innerHTML = '<p class="text-xs text-[#1a1a1a] font-bold text-center col-span-full py-4 w-full">كن أول من يشارك تجربته مع الصنف ده... </p>';
            return;
        }
        reviewsContainer.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const stars = '⭐'.repeat(data.rating || 5);
            return `<div class="bg-[#ffffff] p-4 rounded-[1.5rem] border-2 border-[var(--brand-primary)] mb-3"><div class="flex justify-between items-center mb-2"><span class="font-black text-[#1a1a1a] text-xs">${escapeHTML(data.customerName)}</span><span class="text-[10px]">${stars}</span></div><p class="text-xs text-[#1a1a1a] leading-relaxed font-bold">${escapeHTML(data.comment)}</p></div>`;
        }).join('');
    } catch (error) {
        reviewsContainer.innerHTML = '<p class="text-xs text-[#1a1a1a] font-bold text-center col-span-full py-4">جاري مزامنة الآراء...</p>';
    }
};
window.loadLiveReviews = loadLiveReviews;

export const applySettingsToUI = function() {
    window.renderTicker(); 

    if (!isAppReady) return; 

    const root = document.documentElement;
    root.style.setProperty('--brand-font', (siteSettings.visuals && siteSettings.visuals.fontFamily) ? siteSettings.visuals.fontFamily : (siteSettings.fontFamily || "'Cairo', sans-serif"));
    
    const themeColor = (siteSettings.visuals && siteSettings.visuals.themeHex) ? siteSettings.visuals.themeHex : '#ff91a4';
    root.style.setProperty('--brand-primary', themeColor);
    root.style.setProperty('--site-bg', '#ffffff');
    root.style.setProperty('--site-text', '#1a1a1a');

    const loaderTextEl = document.getElementById('dyn-loader-text');
    if (loaderTextEl) loaderTextEl.innerText = (siteSettings.UI_Settings && siteSettings.UI_Settings.loader_text) ? siteSettings.UI_Settings.loader_text : ((siteSettings.visuals && siteSettings.visuals.loaderText) ? siteSettings.visuals.loaderText : "حلويات بوسي ✨");

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
            loader.style.backgroundColor = siteSettings.UI_Settings.loader_bgColor || '#ffffff';
            const loaderTextEl = loader.querySelector('h1');
            if (loaderTextEl) {
                loaderTextEl.style.color = siteSettings.UI_Settings.loader_textColor || '#ff91a4';
            }
            const loaderIcon = loader.querySelector('i');
            if(loaderIcon) loaderIcon.style.color = siteSettings.UI_Settings.loader_textColor || '#ff91a4';
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
        
        const footerLinksContainer = document.getElementById('custom-social-links-container');
        if (footerLinksContainer) {
            let customHtml = '';
            if (siteSettings.social.tiktok) customHtml += `<a href="${siteSettings.social.tiktok}" target="_blank" class="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] flex items-center justify-center transition-all" title="TikTok"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.33 6.33 0 0 0 6.27-6.36v-6.9a8.16 8.16 0 0 0 4.7 1.48v-3.4a4.85 4.85 0 0 1-2.65-.17z"/></svg></a>`;
            if (siteSettings.social.whatsapp) customHtml += `<a href="https://wa.me/${siteSettings.social.whatsapp}" target="_blank" class="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] flex items-center justify-center transition-all" title="WhatsApp"><i data-lucide="message-circle" class="w-5 h-5"></i></a>`;
            
            if (siteSettings.social.customLinks && siteSettings.social.customLinks.length > 0) {
                siteSettings.social.customLinks.forEach(link => {
                    customHtml += `<a href="${escapeHTML(link.url)}" target="_blank" class="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] flex items-center justify-center transition-all" title="${escapeHTML(link.label)}"><i data-lucide="link-2" class="w-5 h-5"></i></a>`;
                });
            }
            footerLinksContainer.innerHTML = customHtml;
            if(window.lucide) lucide.createIcons();
        }
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
    
    container.innerHTML = catMenu.map(c => `<button onclick="toggleCustomerMenu(false); window.setCategory('${c.name || c}')" class="text-right w-full p-3 rounded-xl font-bold text-sm transition-all hover:bg-[#ffffff] flex items-center justify-between" style="border: 2px solid var(--brand-primary); color: var(--site-text);"><span>${c.name === 'ورد' || c === 'ورد' ? 'ورد وهدايا 💐' : (c.name === 'تورت' || c === 'تورت' ? 'تورت وتصميم 🎂' : (c.name || c))}</span><i data-lucide="chevron-left" class="w-4 h-4 opacity-50"></i></button>`).join('');
    if(window.lucide) lucide.createIcons();
};
window.renderCustomerSidebarCategories = renderCustomerSidebarCategories;

export const renderCustomerGallery = function() {
    if (!isAppReady) return; 
    const sec = document.getElementById('gallery-customer-section'); const slider = document.getElementById('gallery-slider');
    if(!sec || !slider) return;
    if (galleryData.length === 0) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');
    
    slider.innerHTML = galleryData.map(g => `<div class="shrink-0 cursor-pointer hover:scale-105 transition-transform" onclick="openGlobalLightbox('${optimizeCloudinaryUrl(g.url)}')"><div class="w-32 h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-sm border-2 border-[var(--brand-primary)]"><img src="${optimizeCloudinaryUrl(g.url)}" class="w-full h-full object-cover" loading="lazy" alt="سابقة أعمال حلويات بوسي" onerror="this.onerror=null; this.src=window.getImgFallback('سابقة أعمال');"></div></div>`).join('');
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
    const waterfallContainer = document.getElementById('waterfall-section') || document.getElementById('waterfall-container');
    
    if (waterfallContainer) {
        waterfallContainer.classList.remove('hidden');
        waterfallContainer.style.display = 'block';
    }

    if (!col1 || !col2) return;

    const visualItems = catalog.filter(p => p && p.isActive !== false && (p.images && p.images.length > 0 || p.img));
    if (visualItems.length === 0) {
        col1.innerHTML = `<div class="text-center py-10 text-[var(--site-text)] opacity-50 font-bold col-span-2">نجهز لكم أصنافاً جديدة فاخرة.. انتظرونا ✨</div>`;
        col2.innerHTML = '';
        return;
    }

    const hourChunk = new Date().getHours() % Math.max(1, Math.floor(visualItems.length / 6));
    const startIdx = hourChunk * 6;
    const itemsToDisplay = visualItems.slice(startIdx, startIdx + 6);
    
    if(itemsToDisplay.length < 6) {
        itemsToDisplay.push(...visualItems.slice(0, 6 - itemsToDisplay.length));
    }

    const buildCardHTML = (item) => {
        const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
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
            <div class="waterfall-card cursor-pointer group relative bg-[#ffffff] rounded-[2rem] overflow-hidden shadow-sm border border-[var(--brand-primary)]/10" onclick="window.navigateToProduct('${item.id}')" title="اضغط لاستعراض تفاصيل ${escapeHTML(item.name)}">
                <img src="${url}" loading="lazy" decoding="async" class="transition-transform duration-500 group-hover:scale-105 w-full h-full object-cover" alt="صنف ${escapeHTML(item.name)} من قسم ${escapeHTML(item.category)} - حلويات بوسي" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(item.category)}');">
                <div class="absolute inset-x-0 bottom-0 bg-[#ffffff]/90 backdrop-blur-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start border-t-2 border-[var(--brand-primary)]">
                    <span class="text-[var(--brand-primary)] text-xs font-bold truncate tracking-wide w-full">${escapeHTML(item.name)}</span>
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
    
    if (bsContainer && naContainer) {
        const bestSellers = catalog.filter(p => p.isActive !== false && p.badge && (p.badge.includes('مبيعاً') || p.badge.includes('مبيعات'))).slice(0, 8);
        const newArrivals = catalog.filter(p => p.isActive !== false && p.badge && (p.badge.includes('جديد') || p.badge.includes('🌟'))).slice(0, 8);

        const fallbackBS = bestSellers.length > 0 ? bestSellers : catalog.filter(p => p.isActive !== false).slice(0, 6);
        const fallbackNA = newArrivals.length > 0 ? newArrivals : catalog.filter(p => p.isActive !== false).slice().reverse().slice(0, 6);

        if (bsContainer && fallbackBS.length > 0) {
            if(sectionBS) sectionBS.classList.remove('hidden');
            bsContainer.innerHTML = fallbackBS.map(p => `<div class="shrink-0 w-[300px] snap-center">${window.drawProductCard(p)}</div>`).join('');
        } else {
            if(sectionBS) sectionBS.classList.add('hidden');
        }

        if (naContainer && fallbackNA.length > 0) {
            if(sectionNA) sectionNA.classList.remove('hidden');
            naContainer.innerHTML = fallbackNA.map(p => `<div class="shrink-0 w-[300px] snap-center">${window.drawProductCard(p)}</div>`).join('');
        } else {
            if(sectionNA) sectionNA.classList.add('hidden');
        }
    }

    let dynContainer = document.getElementById('dynamic-sections-container');
    const homeView = document.getElementById('view-home') || document.getElementById('home-view');
    
    if (homeView && siteSettings.dynamicSections && siteSettings.dynamicSections.length > 0) {
        if (!dynContainer) {
            dynContainer = document.createElement('div');
            dynContainer.id = 'dynamic-sections-container';
            dynContainer.className = 'w-full flex flex-col gap-12 mt-12';
            if (sectionNA && sectionNA.parentNode) {
                sectionNA.parentNode.insertBefore(dynContainer, sectionNA.nextSibling);
            } else {
                homeView.appendChild(dynContainer);
            }
        }
        
        const activeDynSections = siteSettings.dynamicSections.filter(s => s.active).sort((a,b) => (a.order || 0) - (b.order || 0));
        
        dynContainer.innerHTML = activeDynSections.map(sec => {
            const sectionProducts = catalog.filter(p => p.isActive !== false && p.badge && p.badge.includes(sec.title)).slice(0, 8);
            if (sectionProducts.length === 0) return ''; 
            
            let itemsHtml = '';
            if (sec.type === 'slider') {
                itemsHtml = `<div class="relative w-full"><div id="dyn-slider-${sec.id}" class="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar scroll-smooth pl-4">${sectionProducts.map(p => `<div class="shrink-0 w-[300px] snap-center">${window.drawProductCard(p)}</div>`).join('')}</div></div>`;
            } else {
                itemsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">${sectionProducts.map(p => window.drawProductCard(p)).join('')}</div>`;
            }

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
    } else if (dynContainer) {
        dynContainer.innerHTML = '';
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

// 👑 تأمين ظهور أزرار الأقسام مع الحفاظ على الهيكل القديم
export const renderCategories = function() {
    if (!isAppReady) return; 
    
    const el = document.getElementById('categories-nav') || document.getElementById('categories-scroll') || document.getElementById('categories-container');
    if(!el) return;
    
    el.classList.remove('hidden');
    el.style.display = 'block';

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
};
window.renderCategories = renderCategories;

export const setActiveCategoryPill = function(catName) {
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
};
window.setActiveCategoryPill = setActiveCategoryPill;

export const renderFlowerTabs = function(container) {
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
            
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
            
            container.innerHTML = ''; 
            container.appendChild(fragment);
            container.classList.remove('hidden'); 
            container.style.display = container.className.includes('grid') ? 'grid' : 'block'; 
        } catch(e) {
            console.error("حلويات بوسي: خطأ أثناء عرض المنتجات", e);
        }
    }
};
window.enforceCategoryRender = enforceCategoryRender;

export const setSub = function(type, val) {
    if (type === 's') state.dSize = val;
    if (type === 'f') state.fType = val;
    window.renderMainDisplay();
};
window.setSub = setSub;

// 👑 المحرك الجديد للرندر: تقسيم ذكي بين (شاشة الأقسام ككروت) و (شاشة النكهات الخاصة بالقسم)
export const renderMainDisplay = function() {
    if (!isAppReady) return; 

    const container = document.getElementById('display-container'); 
    const subTabsArea = document.getElementById('sub-tabs-area');
    if(!container) return;

    // 1️⃣ حالة عرض المنيو العام (الأقسام ككروت)
    if (state.activeCat === 'المنيو' || state.activeCat === 'الرئيسية') {
        if(subTabsArea) subTabsArea.classList.add('hidden');
        
        container.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 items-stretch w-full animate-fade-in pb-10';
        
        const sortedCats = [...catMenu].sort((a, b) => (a.order || 99) - (b.order || 99));
        
        let targetHTML = sortedCats.map(c => {
            const catName = c.name || c;
            if(catName === 'الرئيسية') return ''; 
            
            const displayName = catName === 'ورد' ? 'ورد وهدايا 💐' : (catName === 'تورت' ? 'تورت وتصميم 🎂' : catName);
            const sampleItem = catalog.find(p => p.category === catName && p.images && p.images.length > 0) || catalog.find(p => p.category === catName);
            const rawImageUrl = sampleItem ? ((sampleItem.images && sampleItem.images[0]) ? sampleItem.images[0] : sampleItem.img) : window.getImgFallback(catName);
            const displayImg = optimizeCloudinaryUrl(rawImageUrl);

            return `
            <div class="bg-[#ffffff] rounded-[2.5rem] border-2 border-[var(--brand-primary)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer" onclick="window.setCategory('${catName}')">
                <div class="w-full h-48 md:h-56 relative overflow-hidden bg-[#f8fafc] p-2">
                    <img src="${displayImg}" class="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" loading="lazy" alt="${escapeHTML(displayName)}">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/80 to-transparent"></div>
                    <h3 class="absolute bottom-4 left-0 right-0 text-center text-xl md:text-2xl font-black text-[#ffffff] tracking-wide drop-shadow-md z-10">${escapeHTML(displayName)}</h3>
                </div>
                <div class="p-4 flex justify-center items-center bg-[#ffffff]">
                    <button class="px-6 py-3 bg-[#ffffff] text-[var(--brand-primary)] border-2 border-[var(--brand-primary)] rounded-full font-black text-sm group-hover:bg-[var(--brand-primary)] group-hover:text-[#ffffff] transition-all flex items-center gap-2">
                        تصفح المزيد <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>`;
        }).join('');

        container.innerHTML = targetHTML;
        if(window.lucide) lucide.createIcons();
        return; 
    }

    // 2️⃣ حالة الدخول لقسم معين (صفحة المنتج/النكهات)
    let list = catalog.filter(p => p && p.isActive !== false && p.category === state.activeCat);
    
    if (state.activeCat === 'ديسباسيتو') {
        if(subTabsArea) {
            subTabsArea.classList.remove('hidden');
            const sizes = ['مثلث', 'وسط', 'كبير'];
            subTabsArea.innerHTML = `
                <div class="flex justify-center gap-2 p-2 bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-2xl mb-8">
                    ${sizes.map(s => `
                        <button onclick="window.setSubSize('${s}')" class="flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all border-2 ${state.dSize === s ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)]' : 'bg-[#ffffff] text-[var(--site-text)] border-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)]'}">
                            ${s}
                        </button>
                    `).join('')}
                </div>`;
        }
        list = list.filter(p => p.size === state.dSize || p.subType === state.dSize);
    } 
    else if (state.activeCat === 'ورد') {
        if(subTabsArea) {
            subTabsArea.classList.remove('hidden');
            const flowerTypes = ['بوكيه', 'فازة', 'سبت', 'صندوق'];
            subTabsArea.innerHTML = `
                <div class="flex overflow-x-auto hide-scrollbar gap-2 p-2 bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-2xl mb-8">
                    ${flowerTypes.map(t => `
                        <button onclick="window.setFlowerType('${t}')" class="whitespace-nowrap flex-1 min-w-[80px] px-4 py-3 rounded-xl font-black text-sm transition-all border-2 ${state.fType === t ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)]' : 'bg-[#ffffff] text-[var(--site-text)] border-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)]'}">
                            ${t}
                        </button>
                    `).join('')}
                </div>`;
        }
        list = list.filter(p => p.flowerType === state.fType || p.subType === state.fType);
    } else {
        if(subTabsArea) subTabsArea.classList.add('hidden');
    }

    container.className = 'w-full animate-fade-in pb-10';
    let targetHTML = '';
    
    if (list.length === 0) {
        targetHTML = `<div class="col-span-full text-center py-20 bg-[#ffffff] rounded-[2rem] border-2 border-dashed border-[var(--brand-primary)]"><p class="font-bold text-[var(--site-text)] text-lg">جاري تجهيز تشكيلة جديدة لهذا الاختيار.. انتظرونا ✨</p></div>`;
    } else {
        const catDesc = (siteSettings.catDescriptions && siteSettings.catDescriptions[state.activeCat]) || `تشكيلة فاخرة من ${state.activeCat} محضرة بأجود الخامات لتليق بمناسباتك السعيدة.`;
        
        let headerHtml = `
        <div class="text-center mb-12 border-b-2 border-[var(--brand-primary)]/20 pb-10">
            <h1 class="text-4xl md:text-5xl font-black text-[var(--brand-primary)] tracking-tight mb-4">${escapeHTML(state.activeCat)}</h1>
            <p class="text-base md:text-lg text-[var(--site-text)] font-bold max-w-2xl mx-auto leading-loose">${escapeHTML(catDesc)}</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">`;
        
        let flavorsHtml = list.map(p => window.drawProductCard(p)).join('');
        
        let reviewsHtml = `
        </div>
        <div id="category-reviews-section" class="mb-16 border-t-2 border-[var(--brand-primary)]/20 pt-10">
            <h3 class="text-2xl font-black text-[var(--site-text)] mb-8 flex items-center justify-center gap-2"><i data-lucide="message-square-heart" class="w-6 h-6 text-[var(--brand-primary)]"></i> آراء عملائنا في ${escapeHTML(state.activeCat)}</h3>
            <div id="reviews-list-${state.activeCat.replace(/\s+/g, '-')}" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"></div>
            
            <div class="bg-[#ffffff] p-6 rounded-[2.5rem] border-2 border-[var(--brand-primary)] shadow-sm max-w-2xl mx-auto">
                <h4 class="font-black text-lg text-[var(--site-text)] mb-4 text-center">شاركنا رأيك في ${escapeHTML(state.activeCat)}</h4>
                <input type="text" id="review-cust-name-${state.activeCat.replace(/\s+/g, '-')}" placeholder="الاسم الكريم..." class="w-full mb-3 p-3 bg-[#f8fafc] border-2 border-[var(--brand-primary)]/30 rounded-xl font-bold text-sm focus:outline-none focus:border-[var(--brand-primary)]">
                <textarea id="review-cust-comment-${state.activeCat.replace(/\s+/g, '-')}" placeholder="رأيك يهمنا جداً..." rows="3" class="w-full mb-3 p-3 bg-[#f8fafc] border-2 border-[var(--brand-primary)]/30 rounded-xl font-bold text-sm focus:outline-none focus:border-[var(--brand-primary)] resize-none"></textarea>
                <div class="flex items-center justify-between gap-4">
                    <select id="review-cust-rating-${state.activeCat.replace(/\s+/g, '-')}" class="p-3 bg-[#f8fafc] border-2 border-[var(--brand-primary)]/30 rounded-xl font-bold text-sm focus:outline-none focus:border-[var(--brand-primary)]">
                        <option value="5">⭐⭐⭐⭐⭐ ممتاز</option>
                        <option value="4">⭐⭐⭐⭐ جيد جداً</option>
                        <option value="3">⭐⭐⭐ جيد</option>
                    </select>
                    <button id="review-submit-btn-${state.activeCat.replace(/\s+/g, '-')}" onclick="window.submitCustomerReviewLive('${state.activeCat.replace(/\s+/g, '-')}')" class="flex-1 py-3 bg-[var(--brand-primary)] text-[#ffffff] font-black text-sm rounded-xl hover:bg-[#1a1a1a] transition-colors border-2 border-[var(--brand-primary)]">إرسال التقييم</button>
                </div>
            </div>
        </div>`;

        targetHTML = headerHtml + flavorsHtml + reviewsHtml;
    }

    container.innerHTML = targetHTML;
    
    if(window.lucide) lucide.createIcons();
    if(window.loadLiveReviews) window.loadLiveReviews(state.activeCat.replace(/\s+/g, '-'));
    if(window.renderSmartSuggestions) window.renderSmartSuggestions('main');
};
window.renderMainDisplay = renderMainDisplay;

window.setSubSize = function(size) {
    if(typeof state !== 'undefined') state.dSize = size;
    window.renderMainDisplay();
};

window.setFlowerType = function(type) {
    if(typeof state !== 'undefined') state.fType = type;
    window.renderMainDisplay();
};

export const showProductDetails = function(productId) {
    const safeId = String(productId);
    const product = (window.catalogMap && typeof window.catalogMap.get === 'function') 
                    ? window.catalogMap.get(safeId) 
                    : catalog.find(p => String(p.id) === safeId);
    
    if (!product) {
        if(window.showSystemToast) window.showSystemToast('نأسف لحضرتك، بيانات الصنف قيد التحديث.', 'error');
        return;
    }

    try {
        let userPrefs = JSON.parse(localStorage.getItem('bose_user_prefs')) || {};
        userPrefs[product.category] = (userPrefs[product.category] || 0) + 1;
        localStorage.setItem('bose_user_prefs', JSON.stringify(userPrefs));
    } catch(e) {}

    hideAllViews();
    
    let vProd = document.getElementById('view-product-details') || document.getElementById('product-details-view'); 
    if (!vProd) {
        vProd = document.createElement('div');
        vProd.id = 'view-product-details';
        vProd.className = 'w-full flex flex-col gap-8 overflow-x-hidden content-padding-top pb-24';
        document.body.appendChild(vProd);
    }
    
    vProd.classList.remove('hidden');
    vProd.style.display = 'block';

    let displayMode = product.displayMode; 
    if (!displayMode) {
        const fullHeroCategories = ['تورت', 'ورد', 'بوكس روقان', 'ريد فيلفت'];
        displayMode = fullHeroCategories.includes(product.category) ? 'royal-hero' : 'compact-grid';
    }

    const rawImageUrl = (product.images && product.images[0]) ? product.images[0] : (product.img || window.getImgFallback(product.category));
    const imageUrl = optimizeCloudinaryUrl(rawImageUrl);
    const desc = product.desc || getFinalDescription(product);
    const isOutOfStock = product.inStock === false || product.isActive === false;

    let contentHtml = '';

    if (displayMode === 'royal-hero') {
        contentHtml = `
            <div class="max-w-5xl mx-auto px-4 animate-fade-in w-full">
                <button onclick="window.showMenuView()" class="mb-6 flex items-center gap-2 text-[var(--site-text)] font-bold bg-[#ffffff] border-2 border-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)] px-4 py-2 rounded-xl shadow-sm transition-colors">
                    <i data-lucide="arrow-right" class="w-5 h-5"></i> العودة للمنيو
                </button>
                <div class="flex flex-col gap-8">
                    <div class="w-full h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden border-4 border-[var(--brand-primary)] shadow-2xl relative cursor-zoom-in" onclick="window.openGlobalLightbox('${imageUrl}')">
                        <img src="${imageUrl}" class="w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${isOutOfStock ? 'grayscale opacity-70' : ''}" alt="${escapeHTML(product.name)}">
                        ${isOutOfStock ? `<div class="absolute inset-0 bg-[#ffffff]/50 backdrop-blur-[4px] flex items-center justify-center"><span class="bg-[var(--brand-primary)] text-[#ffffff] font-black px-6 py-3 rounded-2xl shadow-xl text-lg">نفدت الكمية مؤقتاً</span></div>` : ''}
                    </div>
                    <div class="text-center space-y-4">
                        <h1 class="text-3xl md:text-5xl font-black text-[var(--brand-primary)] tracking-tight">${escapeHTML(product.name)}</h1>
                        <p class="text-base md:text-lg text-[var(--site-text)] font-bold max-w-3xl mx-auto leading-loose">${escapeHTML(desc)}</p>
                        <div class="flex flex-col items-center gap-6 mt-8 bg-[#ffffff] p-8 rounded-[2.5rem] border-2 border-[var(--brand-primary)] shadow-sm inline-block mx-auto min-w-[300px]">
                            <span class="text-4xl font-black text-[var(--brand-primary)] font-mono">${product.price > 0 ? product.price + ' ج.م' : 'حسب الطلب'}</span>
                            <div class="flex items-center gap-4 bg-[#ffffff] border-2 border-[var(--brand-primary)]/30 rounded-2xl p-2 w-full justify-center">
                                <button onclick="window.updateTempQtyContext(this, -1)" class="w-10 h-10 flex items-center justify-center bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-xl font-black hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-colors">-</button>
                                <span class="temp-qty-display w-8 text-center font-black text-xl text-[var(--site-text)]" data-prod-id="${product.id}">1</span>
                                <button onclick="window.updateTempQtyContext(this, 1)" class="w-10 h-10 flex items-center justify-center bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-xl font-black hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-colors">+</button>
                            </div>
                            <button onclick="window.addWithQtyContext(this, '${product.id}')" class="w-full py-4 bg-[var(--brand-primary)] text-[#ffffff] rounded-2xl font-black text-xl shadow-lg hover:bg-[#ffffff] hover:text-[var(--brand-primary)] border-2 border-[var(--brand-primary)] transition-all flex items-center justify-center gap-3" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                                <i data-lucide="shopping-bag" class="w-6 h-6"></i> ${isOutOfStock ? 'غير متوفر' : 'إضافة للسلة'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    } else {
        contentHtml = `
            <div class="max-w-4xl mx-auto px-4 animate-fade-in w-full">
                <button onclick="window.showMenuView()" class="mb-6 flex items-center gap-2 text-[var(--site-text)] font-bold bg-[#ffffff] border-2 border-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)] px-4 py-2 rounded-xl shadow-sm transition-colors">
                    <i data-lucide="arrow-right" class="w-5 h-5"></i> العودة للمنيو
                </button>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 bg-[#ffffff] rounded-[3rem] border-2 border-[var(--brand-primary)] overflow-hidden shadow-xl">
                    <div class="h-80 md:h-full relative cursor-zoom-in border-b-2 md:border-b-0 md:border-l-2 border-[var(--brand-primary)]/10" onclick="window.openGlobalLightbox('${imageUrl}')">
                        <img src="${imageUrl}" class="w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${isOutOfStock ? 'grayscale opacity-70' : ''}" alt="${escapeHTML(product.name)}">
                        ${isOutOfStock ? `<div class="absolute inset-0 bg-[#ffffff]/50 backdrop-blur-[2px] flex items-center justify-center"><span class="bg-[var(--brand-primary)] text-[#ffffff] font-black px-4 py-2 rounded-xl text-sm border-2 border-[#ffffff] shadow-md">نفدت الكمية</span></div>` : ''}
                    </div>
                    <div class="p-8 flex flex-col justify-center gap-6">
                        <div>
                            <span class="text-xs font-black text-[#ffffff] bg-[var(--brand-primary)] px-3 py-1 rounded-full mb-3 inline-block">${escapeHTML(product.category)}</span>
                            <h1 class="text-3xl font-black text-[var(--site-text)] tracking-tight">${escapeHTML(product.name)}</h1>
                        </div>
                        <p class="text-sm font-bold text-[var(--site-text)] leading-relaxed opacity-90">${escapeHTML(desc)}</p>
                        <div class="border-t-2 border-[var(--brand-primary)]/10 pt-6 mt-auto">
                            <div class="flex justify-between items-center mb-6">
                                <span class="text-3xl font-black text-[var(--brand-primary)] font-mono">${product.price > 0 ? product.price + ' ج.م' : 'حسب الطلب'}</span>
                                <div class="flex items-center gap-3 bg-[#ffffff] border-2 border-[var(--brand-primary)]/30 rounded-xl p-1 shadow-inner">
                                    <button onclick="window.updateTempQtyContext(this, -1)" class="w-8 h-8 flex items-center justify-center bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-lg font-black hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-colors">-</button>
                                    <span class="temp-qty-display w-6 text-center font-black text-lg text-[var(--site-text)]" data-prod-id="${product.id}">1</span>
                                    <button onclick="window.updateTempQtyContext(this, 1)" class="w-8 h-8 flex items-center justify-center bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-lg font-black hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-colors">+</button>
                                </div>
                            </div>
                            <button onclick="window.addWithQtyContext(this, '${product.id}')" class="w-full py-4 bg-[var(--brand-primary)] text-[#ffffff] rounded-2xl font-black text-lg border-2 border-[var(--brand-primary)] hover:bg-[#ffffff] hover:text-[var(--brand-primary)] transition-all flex items-center justify-center gap-3 shadow-md" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                                <i data-lucide="shopping-bag" class="w-5 h-5"></i> ${isOutOfStock ? 'غير متوفر مؤقتاً' : 'إضافة للسلة'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    vProd.innerHTML = contentHtml + `
        <div id="product-related-section" class="max-w-5xl mx-auto mt-20 px-4 w-full">
            <h3 class="text-2xl font-black text-[var(--site-text)] mb-8 border-r-4 border-[var(--brand-primary)] pr-4 flex items-center gap-2"><i data-lucide="sparkles" class="w-6 h-6 text-[var(--brand-primary)]"></i> تشكيلة قد تنال إعجاب حضرتك</h3>
            <div id="product-related-container" class="grid grid-cols-2 md:grid-cols-4 gap-4 hide-scrollbar pb-4"></div>
        </div>`;

    if(window.lucide) window.lucide.createIcons();
    if(window.renderRelatedProducts) window.renderRelatedProducts(product.category, product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.showProductDetails = showProductDetails;
window.navigateToProduct = showProductDetails;

export const renderRelatedProducts = function(category, currentId) {
    const container = document.getElementById('product-related-container') || document.getElementById('related-products-container');
    if (!container) return;
    
    const related = window.catalog.filter(p => p.category === category && String(p.id) !== String(currentId) && p.isActive !== false).slice(0, 4);
    
    if (related.length === 0) {
        container.innerHTML = '<p class="text-sm text-[var(--site-text)] font-bold col-span-full text-center">لا توجد ترشيحات إضافية حالياً في هذا القسم.</p>';
        return;
    }
    
    container.innerHTML = related.map(item => {
        const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : (item.img || window.getImgFallback(item.category));
        const safeUrl = window.optimizeCloudinaryUrl ? window.optimizeCloudinaryUrl(imgUrl) : imgUrl;
        return `
            <div class="bg-[#ffffff] rounded-2xl border-2 border-[var(--brand-primary)]/20 overflow-hidden cursor-pointer hover:border-[var(--brand-primary)] transition-colors btn-interactive group" onclick="window.navigateToProduct('${item.id}')">
                <div class="w-full h-32 overflow-hidden bg-[#f8fafc] p-1">
                    <img src="${safeUrl}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt="${window.escapeHTML(item.name)}">
                </div>
                <div class="p-3 text-center">
                    <h4 class="text-xs font-black text-[var(--site-text)] truncate mb-1">${window.escapeHTML(item.name)}</h4>
                    <p class="text-sm font-black text-[var(--brand-primary)]">${Number(item.price)} ج.م</p>
                </div>
            </div>
        `;
    }).join('');
};
window.renderRelatedProducts = renderRelatedProducts;

export const renderMultiStepCakeBuilder = function() {
    const wrapper = document.getElementById('cake-builder-steps-wrapper');
    if (!wrapper) return;

    const basePrice = siteSettings.cakeBuilder?.basePrice || 145;
    let printingPrice = 0;
    if (cakeState.printing === 'صورة قابلة للأكل') printingPrice = siteSettings.cakeBuilder?.imagePrintingPrice || 60;
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
            <div class="relative w-full h-48 md:h-64 rounded-t-[3rem] overflow-hidden bg-[#ffffff] border-b-2 border-[var(--brand-primary)]">
                <img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg" class="w-full h-full object-cover opacity-90" alt="تصميم تورت حلويات بوسي">
                <div class="absolute inset-0 bg-gradient-to-t from-[#ffffff] to-transparent"></div>
                <div class="absolute bottom-6 w-full text-center px-4">
                    <h2 class="text-3xl font-black uppercase tracking-tight text-[var(--brand-primary)] drop-shadow-md">صمم تورتة مناسبتك السعيدة 👑</h2>
                </div>
            </div>
            <div class="cake-builder-step-panel step-active p-8 md:p-12 space-y-8 bg-[#ffffff]">
                <div class="bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-2xl p-4 text-center">
                    <p class="text-xs font-bold text-[var(--site-text)]"><i data-lucide="info" class="w-4 h-4 inline text-[var(--brand-primary)]"></i> تنويه احترافي: لضمان أعلى جودة، يُفضل تأكيد طلبات التورت المخصصة قبل الموعد بـ 48 ساعة.</p>
                </div>
                <div class="space-y-4">
                    <label class="block font-black text-lg text-[var(--site-text)] flex items-center gap-3"><i data-lucide="calendar-heart" class="w-5 h-5 text-[var(--brand-primary)]"></i> نوع المناسبة السعيدة</label>
                    <input type="text" value="${escapeHTML(cakeState.occasion)}" oninput="cakeState.occasion = this.value" class="w-full p-4 bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-xl text-sm font-bold focus:outline-none" placeholder="مثال: عيد ميلاد، خطوبة، تخرج، ذكرى زواج...">
                </div>
                <div class="space-y-4 pt-4 border-t-2 border-[var(--brand-primary)]">
                    <label class="block font-black text-lg text-[var(--site-text)] flex items-center gap-3"><i data-lucide="cake" class="w-5 h-5 text-[var(--brand-primary)]"></i> نكهة الكيك الأساسي</label>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        ${(siteSettings.cakeBuilder?.flavors || ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت']).map(fl => `
                            <button onclick="window.updateCakeBuilderField('flavor', '${fl}')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.flavor === fl ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-md transform scale-105' : 'bg-[#ffffff] border-[var(--brand-primary)] text-[var(--site-text)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">${fl}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="space-y-4 pt-4 border-t-2 border-[var(--brand-primary)]">
                    <label class="block font-black text-lg text-[var(--site-text)] flex items-center gap-3"><i data-lucide="box" class="w-5 h-5 text-[var(--brand-primary)]"></i> التصميم والشكل الهندسي</label>
                    <div class="grid grid-cols-3 gap-4">
                        ${['دائري', 'مربع', 'مستطيل'].map(sh => `
                            <button onclick="window.updateCakeBuilderField('shape', '${sh}')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.shape === sh ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-md transform scale-105' : 'bg-[#ffffff] border-[var(--brand-primary)] text-[var(--site-text)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">${sh}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="flex justify-end pt-6 mt-4">
                    <button onclick="window.changeBuilderStep(1)" class="px-8 py-4 bg-[var(--brand-primary)] text-[#ffffff] border-2 border-[var(--brand-primary)] font-black text-sm rounded-full shadow-lg hover:bg-[#ffffff] hover:text-[var(--brand-primary)] transition-all">التالي: الحجم والطباعة ⬅️</button>
                </div>
            </div>`;
    }
    else if (window.currentBuilderStep === 2) {
        stepContentHTML = `
            <div class="p-10 text-center bg-[#ffffff] border-b-2 border-[var(--brand-primary)] relative z-10 rounded-t-[3rem]">
                <h2 class="text-3xl font-black mb-4 uppercase tracking-tight text-[var(--brand-primary)]">الحجم وتفاصيل التصميم</h2>
            </div>
            <div class="cake-builder-step-panel step-active p-8 md:p-12 space-y-8 bg-[#ffffff]">
                <div class="space-y-4">
                    <label class="block font-black text-lg text-[var(--site-text)] flex items-center gap-3"><i data-lucide="users" class="w-5 h-5 text-[var(--brand-primary)]"></i> عدد الأفراد (حجم التورتة)</label>
                    <div class="flex items-center justify-between border-2 rounded-[2rem] p-4 bg-[#ffffff] border-[var(--brand-primary)] max-w-md mx-auto">
                        <button onclick="window.adjustBuilderPersons(-2)" class="p-3 bg-[#ffffff] border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] rounded-2xl flex items-center justify-center font-black shadow-sm hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-all"><i data-lucide="minus" class="w-6 h-6"></i></button>
                        <span class="text-4xl font-black text-[var(--site-text)]">${cakeState.persons}</span>
                        <button onclick="window.adjustBuilderPersons(2)" class="p-3 bg-[#ffffff] border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] rounded-2xl flex items-center justify-center font-black shadow-sm hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-all"><i data-lucide="plus" class="w-6 h-6"></i></button>
                    </div>
                </div>
                <div class="space-y-4 pt-4 border-t-2 border-[var(--brand-primary)]">
                    <label class="block font-black text-lg text-[var(--site-text)] flex items-center gap-3"><i data-lucide="palette" class="w-5 h-5 text-[var(--brand-primary)]"></i> أسلوب التصميم</label>
                    <div class="grid grid-cols-2 gap-4">
                        <button onclick="window.updateCakeBuilderField('designStyle', 'تصميم محدد')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.designStyle === 'تصميم محدد' ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-md transform scale-105' : 'bg-[#ffffff] border-[var(--brand-primary)] text-[var(--site-text)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">عندي تصميم محدد</button>
                        <button onclick="window.updateCakeBuilderField('designStyle', 'على ذوق بوسي')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.designStyle === 'على ذوق بوسي' ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-md transform scale-105' : 'bg-[#ffffff] border-[var(--brand-primary)] text-[var(--site-text)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">سيب الإبداع علينا</button>
                    </div>
                </div>
                <div class="space-y-4 pt-4 border-t-2 border-[var(--brand-primary)]">
                    <label class="block font-black text-lg text-[var(--site-text)] flex items-center gap-3"><i data-lucide="printer" class="w-5 h-5 text-[var(--brand-primary)]"></i> دمج وطباعة الصور</label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="window.updateCakeBuilderField('printing', 'بدون')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.printing === 'بدون' ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-md transform scale-105' : 'bg-[#ffffff] border-[var(--brand-primary)] text-[var(--site-text)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">بدون صورة</button>
                        <button onclick="window.updateCakeBuilderField('printing', 'صورة قابلة للأكل')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.printing === 'صورة قابلة للأكل' ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-md transform scale-105' : 'bg-[#ffffff] border-[var(--brand-primary)] text-[var(--site-text)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">صورة قابلة للأكل (+${siteSettings.cakeBuilder?.imagePrintingPrice || 60} ج)</button>
                        <button onclick="window.updateCakeBuilderField('printing', 'صورة غير قابلة للأكل')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.printing === 'صورة غير قابلة للأكل' ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-md transform scale-105' : 'bg-[#ffffff] border-[var(--brand-primary)] text-[var(--site-text)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">صورة غير قابلة للأكل (+20 ج)</button>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row justify-between gap-4 pt-6 mt-4">
                    <button onclick="window.changeBuilderStep(-1)" class="px-8 py-4 bg-[#ffffff] border-2 border-[var(--brand-primary)] text-[var(--site-text)] font-black text-sm rounded-full active:scale-95 hover:bg-[var(--brand-primary)] hover:text-[#ffffff]">➡️ السابق</button>
                    <button onclick="window.changeBuilderStep(1)" class="px-8 py-4 bg-[var(--brand-primary)] border-2 border-[var(--brand-primary)] text-[#ffffff] font-black text-sm rounded-full shadow-lg hover:bg-[#ffffff] hover:text-[var(--brand-primary)]">التالي: التخصيص النهائي ⬅️</button>
                </div>
            </div>`;
    }
    else if (window.currentBuilderStep === 3) {
        stepContentHTML = `
            <div class="p-10 text-center bg-[#ffffff] border-b-2 border-[var(--brand-primary)] relative z-10 rounded-t-[3rem]">
                <h2 class="text-3xl font-black mb-4 uppercase tracking-tight text-[var(--brand-primary)]">اللمسات الأخيرة والمراجعة</h2>
            </div>
            <div class="cake-builder-step-panel step-active p-8 md:p-12 space-y-8 bg-[#ffffff]">
                
                <div class="space-y-4">
                    <label class="block font-black text-lg text-[var(--site-text)] flex items-center gap-3"><i data-lucide="image-plus" class="w-5 h-5 text-[var(--brand-primary)]"></i> إرفاق صورة (للتصميم أو الطباعة)</label>
                    <div class="border-2 border-dashed border-[var(--brand-primary)] p-4 rounded-2xl text-center bg-[#ffffff]">
                        <input type="file" id="cake-image-upload" accept="image/*" class="hidden" onchange="window.handleCakeImageUpload(this)">
                        <label for="cake-image-upload" class="cursor-pointer inline-flex items-center gap-2 bg-[var(--brand-primary)] text-[#ffffff] px-6 py-3 rounded-full font-bold text-sm hover:bg-[#ffffff] hover:text-[var(--brand-primary)] border-2 border-[var(--brand-primary)] transition-colors">
                            <i data-lucide="upload-cloud" class="w-4 h-4"></i> رفع صورة توضيحية
                        </label>
                        <p class="text-[11px] font-bold text-[var(--site-text)] mt-3">يتم إرفاق نسخة مصغرة لتأكيد الطلب. للإدارة الحق في طلب الصورة الأصلية عالية الجودة عبر الواتساب لضمان دقة التنفيذ.</p>
                        ${cakeState.refImage ? `<div class="mt-3 inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold border border-green-200 rounded-lg">تم إرفاق الصورة بنجاح ✅</div>` : ''}
                    </div>
                </div>

                <div class="space-y-4 pt-4 border-t-2 border-[var(--brand-primary)]">
                    <div class="flex items-center justify-between">
                        <label class="font-black text-lg text-[var(--site-text)] flex items-center gap-3"><i data-lucide="mail" class="w-5 h-5 text-[var(--brand-primary)]"></i> كارت إهداء راقي (+40 ج.م)</label>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" class="sr-only peer" ${cakeState.hasCard ? 'checked' : ''} onchange="window.updateCakeBuilderField('hasCard', this.checked)">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
                        </label>
                    </div>
                    ${cakeState.hasCard ? `<textarea rows="2" oninput="cakeState.cardText = this.value" class="w-full p-4 bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-xl font-bold text-[var(--site-text)] text-sm focus:outline-none resize-none" placeholder="اكتب رسالتك للإهداء هنا...">${escapeHTML(cakeState.cardText)}</textarea>` : ''}
                </div>

                <div class="space-y-4 pt-4 border-t-2 border-[var(--brand-primary)]">
                    <label class="block font-black text-lg text-[var(--site-text)] flex items-center gap-3 text-red-500"><i data-lucide="shield-alert" class="w-5 h-5 text-red-500"></i> موانع صحية أو حساسية (إن وجد)</label>
                    <input type="text" value="${escapeHTML(cakeState.allergies)}" oninput="cakeState.allergies = this.value" class="w-full p-4 bg-[#ffffff] border-2 border-red-300 rounded-xl text-sm font-bold focus:outline-none focus:border-red-500 placeholder-red-300" placeholder="مثال: حساسية مكسرات، حساسية فراولة، الخ...">
                </div>

                <div class="space-y-4 pt-4 border-t-2 border-[var(--brand-primary)]">
                    <label class="block font-black text-lg text-[var(--site-text)] flex items-center gap-3"><i data-lucide="edit-3" class="w-5 h-5 text-[var(--brand-primary)]"></i> ملاحظات دقيقة للإدارة</label>
                    <textarea rows="3" oninput="cakeState.notes = this.value" class="w-full p-4 bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-xl font-bold text-[var(--site-text)] text-sm focus:outline-none resize-none" placeholder="الاسم للكتابة على التورتة، السن، الألوان المفضلة...">${escapeHTML(cakeState.notes)}</textarea>
                </div>
                
                <div class="bg-[#ffffff] p-6 rounded-[2rem] border-2 border-[var(--brand-primary)] space-y-3 mt-6">
                    <h4 class="font-black text-[var(--site-text)] text-lg mb-4 border-b-2 border-[var(--brand-primary)] pb-3 flex items-center gap-2"><i data-lucide="file-check-2" class="w-5 h-5 text-[var(--brand-primary)]"></i> ملخص الاعتماد:</h4>
                    <div class="flex justify-between items-center text-sm"><span class="font-bold text-[var(--site-text)]">النوع:</span><span class="font-black text-[var(--site-text)]">${cakeState.flavor} (${cakeState.shape})</span></div>
                    <div class="flex justify-between items-center text-sm"><span class="font-bold text-[var(--site-text)]">تكفي:</span><span class="font-black text-[var(--site-text)]">${cakeState.persons} أفراد</span></div>
                    <div class="flex justify-between items-center text-sm"><span class="font-bold text-[var(--site-text)]">إضافات:</span><span class="font-black text-[var(--site-text)]">${cakeState.printing}${cakeState.hasCard ? ' + كارت إهداء' : ''}</span></div>
                    <div class="flex justify-between items-center pt-4 border-t-2 border-[var(--brand-primary)] mt-4 text-lg font-black">
                        <span class="text-[var(--site-text)]">القيمة التقديرية:</span>
                        <span class="text-2xl text-[var(--brand-primary)] font-mono">${currentPrice} ج.م</span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row justify-between gap-4 pt-6 mt-4">
                    <button onclick="window.changeBuilderStep(-1)" class="px-8 py-4 bg-[#ffffff] border-2 border-[var(--brand-primary)] text-[var(--site-text)] font-black text-sm rounded-full active:scale-95 hover:bg-[var(--brand-primary)] hover:text-[#ffffff]">➡️ تعديل البيانات</button>
                    <button onclick="window.commitCakeBuilderToCart()" class="px-8 py-4 bg-[var(--brand-primary)] text-[#ffffff] border-2 border-[var(--brand-primary)] font-black text-lg rounded-full shadow-xl flex-1 text-center hover:bg-[#ffffff] hover:text-[var(--brand-primary)]">اعتماد وإضافة للسلة 👑</button>
                </div>
            </div>`;
    }

    wrapper.innerHTML = stepContentHTML;
    if (window.lucide) lucide.createIcons();
};
window.renderMultiStepCakeBuilder = renderMultiStepCakeBuilder;

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

// 👑 دالة هندسية متطورة لرسم بطاقات النكهات المتوافقة مع النظام السيادي
export const drawProductCard = function(p) {
    if (!p) return '';
    const pIdSafe = String(p.id || ''); 
    const isOutOfStock = p.inStock === false || p.isActive === false;
    
    const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
    let rawImageUrl = defaultFallbackImage;
    
    if (p.images && p.images.length > 0 && p.images[0] && String(p.images[0]).trim() !== '') {
        rawImageUrl = p.images[0];
    } else if (p.img && String(p.img).trim() !== '') {
        rawImageUrl = p.img;
    } else if (typeof window.getImgFallback === 'function') {
        rawImageUrl = window.getImgFallback(p.category) || defaultFallbackImage;
    }

    const displayImg = optimizeCloudinaryUrl(rawImageUrl);
    const currentP = Number(p.price);
    
    let cardHtml = `
    <div id="flavor-${pIdSafe}" class="bg-[#ffffff] rounded-[2.5rem] border-2 border-[var(--brand-primary)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
        <div class="w-full h-64 relative overflow-hidden bg-[#f8fafc] p-2 cursor-zoom-in" onclick="window.openGlobalLightbox('${displayImg}')">
            <img src="${displayImg}" class="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-70' : ''}" loading="lazy" alt="${escapeHTML(p.name)}">
            ${isOutOfStock ? `<div class="absolute inset-0 bg-[#ffffff]/50 backdrop-blur-[4px] z-10 flex items-center justify-center"><span class="bg-[var(--brand-primary)] text-[#ffffff] font-black px-4 py-2 rounded-xl shadow-lg border-2 border-[#ffffff]">نفدت الكمية مؤقتاً</span></div>` : ''}
        </div>
        <div class="p-6 flex flex-col flex-1 text-center bg-[#ffffff]">
            <h3 class="text-2xl font-black text-[var(--site-text)] mb-3 leading-tight">${escapeHTML(p.name)}</h3>
            <p class="text-sm font-bold text-[var(--site-text)] opacity-80 mb-6 leading-relaxed line-clamp-3">${window.getFinalDescription(p)}</p>
            <div class="mt-auto border-t-2 border-[var(--brand-primary)]/10 pt-6">
                <span class="block text-3xl font-black text-[var(--brand-primary)] font-mono mb-6">${currentP > 0 ? currentP + ' ج.م' : 'حسب الطلب'}</span>
                
                <div class="flex items-center gap-3 bg-[#ffffff] rounded-full p-2 border-2 border-[var(--brand-primary)] shadow-sm mb-4 quantity-controls mx-auto max-w-[200px] justify-between">
                    <button onclick="window.updateTempQtyContext(this, -1)" class="w-10 h-10 flex items-center justify-center bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-full font-black hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-all btn-interactive"><i data-lucide="minus" class="w-5 h-5"></i></button>
                    <span class="temp-qty-display text-xl font-black text-[var(--site-text)] w-8 text-center" data-prod-id="${pIdSafe}">1</span>
                    <button onclick="window.updateTempQtyContext(this, 1)" class="w-10 h-10 flex items-center justify-center bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-full font-black hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-all btn-interactive"><i data-lucide="plus" class="w-5 h-5"></i></button>
                </div>
                
                <button onclick="window.addWithQtyContext(this, '${pIdSafe}')" class="w-full py-4 bg-[var(--brand-primary)] text-[#ffffff] border-2 border-[var(--brand-primary)] rounded-full font-black text-lg hover:bg-[#ffffff] hover:text-[var(--brand-primary)] transition-all flex items-center justify-center gap-2 shadow-md btn-interactive" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    <i data-lucide="shopping-bag" class="w-6 h-6"></i> ${isOutOfStock ? 'غير متوفر مؤقتاً' : 'إضافة للسلة'}
                </button>
            </div>
        </div>
    </div>`;

    return cardHtml;
};
window.drawProductCard = drawProductCard;

export const renderCartList = function() {
    const container = document.getElementById('cart-items-list') || document.getElementById('cart-items-container'); 
    const totalDisplay = document.getElementById('cart-total-display') || document.getElementById('cart-total-price-display');
    const badge = document.getElementById('cart-badge-count') || document.getElementById('cart-count-badge');
    
    if (badge) {
        const totalItemsCount = state.cart.reduce((sum, item) => sum + Number(item.quantity), 0);
        if (totalItemsCount > 0) { badge.innerText = totalItemsCount; badge.classList.remove('hidden'); }
        else { badge.classList.add('hidden'); }
    }
    
    if (!container) return;
    
    if (state.cart.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center py-20 px-6 text-center bg-[#ffffff] rounded-[2.5rem] border-2 border-dashed border-[var(--brand-primary)]"><i data-lucide="shopping-bag" class="w-16 h-16 mb-6 text-[var(--brand-primary)]"></i><h3 class="font-black text-2xl text-[var(--site-text)] mb-4">السلة فارغة حالياً.</h3><button onclick="window.showMenuView ? window.showMenuView() : (window.toggleCart && window.toggleCart(false))" class="text-[#ffffff] px-10 py-4 rounded-full font-black text-lg bg-[var(--brand-primary)] border-2 border-[var(--brand-primary)] hover:bg-[#ffffff] hover:text-[var(--brand-primary)] btn-premium-action">استكشف المنيو</button></div>`;
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
        
        const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
        let rawImageUrl = defaultFallbackImage;
        if (item.images && item.images.length > 0 && item.images[0] && String(item.images[0]).trim() !== '') {
            rawImageUrl = item.images[0];
        } else if (item.img && String(item.img).trim() !== '') {
            rawImageUrl = item.img;
        } else if (typeof window.getImgFallback === 'function') {
            rawImageUrl = window.getImgFallback(item.category) || defaultFallbackImage;
        }
        const renderImg = optimizeCloudinaryUrl(rawImageUrl);
        
        return `
        <div class="cart-item-premium flex flex-col bg-[#ffffff] p-4 rounded-[2rem] border-2 border-[var(--brand-primary)] shadow-sm relative mb-4">
            <div class="absolute top-4 left-4 z-10">
                <button onclick="window.modQ('${identifier}', 'remove')" class="p-2 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] border-2 border-transparent hover:border-[var(--brand-primary)] rounded-xl transition-all"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
            
            <div class="flex items-start gap-4 mb-4">
                <div class="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] overflow-hidden shrink-0 bg-[#ffffff] border-2 border-[var(--brand-primary)] p-1 flex items-center justify-center">
                    <img src="${renderImg}" class="w-full h-full object-contain" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(item.category)}');">
                </div>
                <div class="flex-1 text-right pr-2 pt-1 min-w-0">
                    <span class="text-[10px] font-black text-[#ffffff] bg-[var(--brand-primary)] px-3 py-1 rounded-full mb-2 inline-block shadow-sm">${escapeHTML(item.category)}</span>
                    <h4 class="font-black text-sm md:text-base text-[var(--site-text)] mb-1 leading-tight pr-8 truncate">${escapeHTML(item.name)}</h4>
                    ${item.isCustom ? `<p class="text-[11px] font-bold text-[var(--site-text)] leading-relaxed line-clamp-2">${escapeHTML(item.desc)}</p>` : ''}
                </div>
            </div>
            
            <div class="flex justify-between items-center border-t-2 border-[var(--brand-primary)] pt-4 mt-auto">
                <div class="font-black text-[var(--brand-primary)] text-xl font-mono">${p} ج.م</div>
                <div class="flex items-center gap-3 bg-[#ffffff] rounded-full p-1 border-2 border-[var(--brand-primary)] shadow-sm">
                    <button class="w-8 h-8 flex justify-center items-center rounded-full text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] font-black transition-all" onclick="window.modQ('${identifier}', -1)"><i data-lucide="minus" class="w-4 h-4"></i></button>
                    <span class="font-black text-base text-[var(--site-text)] w-6 text-center">${q}</span>
                    <button class="w-8 h-8 flex justify-center items-center rounded-full text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] font-black transition-all" onclick="window.modQ('${identifier}', 1)"><i data-lucide="plus" class="w-4 h-4"></i></button>
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
    
    let availableProducts = catalog.filter(p => p && p.inStock !== false && p.isActive !== false && !cartIds.includes(String(p.id)) && p.category !== state.activeCat);
    
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
        const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
        let rawImageUrl = defaultFallbackImage;
        if (p.images && p.images.length > 0 && p.images[0] && String(p.images[0]).trim() !== '') {
            rawImageUrl = p.images[0];
        } else if (p.img && String(p.img).trim() !== '') {
            rawImageUrl = p.img;
        } else if (typeof window.getImgFallback === 'function') {
            rawImageUrl = window.getImgFallback(p.category) || defaultFallbackImage;
        }
        const img = optimizeCloudinaryUrl(rawImageUrl);
        
        return `<div class="shrink-0 w-[240px] snap-slide bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-[2rem] p-4 shadow-sm flex flex-col group hover:-translate-y-2 transition-transform cursor-pointer" onclick="window.navigateToProduct('${p.id}')">
            <div class="relative w-full aspect-square mb-4 rounded-xl overflow-hidden bg-[#ffffff] border-2 border-[var(--brand-primary)] flex items-center justify-center p-0">
                <img src="${img}" class="w-full h-full object-cover drop-shadow-sm transition-transform duration-500 group-hover:scale-110" loading="lazy" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(p.category)}');">
            </div>
            <div class="flex-1 flex flex-col text-center">
                <span class="text-[10px] bg-[var(--brand-primary)] text-[#ffffff] px-3 py-1 rounded-full font-black mb-2 self-center shadow-sm">${escapeHTML(p.category)}</span>
                <h5 class="text-[15px] font-black text-[var(--site-text)] mb-2 leading-tight line-clamp-1">${escapeHTML(p.name)}</h5>
                <div class="mt-auto">
                    <span class="font-black text-[var(--brand-primary)] block mb-3 text-lg font-mono">${p.price > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span>
                    <button onclick="event.stopPropagation(); window.addWithQtyContext(this, '${p.id}')" class="w-full py-2.5 bg-[#ffffff] text-[var(--brand-primary)] rounded-full font-black hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-colors border-2 border-[var(--brand-primary)] flex items-center justify-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> إضافة</button>
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
        privacy: { t: 'سياسة الأمان والبيانات', b: 'نلتزم بقرار إداري صارم بحماية بيانات عملائنا وفق أعلى معايير الخصوصية.' }, 
        refund: { t: 'سياسة الاستبدال والاسترجاع', b: 'كافة طلباتنا تخضع لرقابة جودة صارمة لضمان الرضا التام لحضراتكم.' } 
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

export const submitCustomerReviewLive = async function(catIdSafe) {
    const nameInput = document.getElementById(`review-cust-name-${catIdSafe}`);
    const commentInput = document.getElementById(`review-cust-comment-${catIdSafe}`);
    const ratingSelect = document.getElementById(`review-cust-rating-${catIdSafe}`);
    const submitBtn = document.getElementById(`review-submit-btn-${catIdSafe}`);

    if (!nameInput || !commentInput || !ratingSelect) return;

    const customerName = escapeHTML(nameInput.value.trim());
    const comment = escapeHTML(commentInput.value.trim());
    const rating = parseInt(ratingSelect.value) || 5;

    if (!customerName || !comment) {
        showSystemToast("يرجى تدوين الاسم وتفاصيل التقييم لاعتماده.", "error");
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
        const collectionPath = `catalog/${catIdSafe}/livereviews`;
        if (window.NetworkEngine && typeof window.NetworkEngine.safeWrite === 'function') {
            await window.NetworkEngine.safeWrite(collectionPath, reviewId, reviewPayload);
        } else if (typeof db !== 'undefined' && db) {
            await db.collection('catalog').doc(String(catIdSafe)).collection('livereviews').doc(reviewId).set(reviewPayload);
        }
        showSystemToast("نشكر لحضرتك التقييم الراقي، تم اعتماده للإدارة 👑", "success");
        nameInput.value = '';
        commentInput.value = '';
    } catch (e) {
        showSystemToast("تم الحفظ محلياً وجاري الإرسال بسبب حالة الشبكة.", "info");
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
    } else if (c === 'تورت' || c === 'تورت وتصميم 🎂') {
        state.activeCat = c;
        if(window.showCakeBuilderView) window.showCakeBuilderView();
    } else {
        state.activeCat = c;
        if(window.showMenuView) window.showMenuView();
        if(window.renderMainDisplay) window.renderMainDisplay();
    }
    
    if(window.renderCategories) window.renderCategories();
    history.pushState({category: c}, '', `?category=${encodeURIComponent(c)}`);
    
    MemoryManager.set('scroll_cat', () => { 
        const safeId = String(c).replace(/\s+/g, '-');
        const activeBtn = document.getElementById(`cat-btn-${safeId}`); 
        if (activeBtn) { activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } 
    }, 50);
};
window.setCategory = setCategory;

// 👑 تأمين مستمعات الأحداث لفك تجميد الشاشات
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
