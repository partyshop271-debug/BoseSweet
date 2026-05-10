/**
 * 👑 BoseSweets UI Engine (V21.2 - Sovereign Display Edition)
 * محرك العرض والواجهات السيادي - حلويات بوسي
 * تم التطوير لضمان ثبات الواجهات، استقرار الشلال والأقسام، ومنع الاختفاء الفني للمكونات.
 * القرار المهني: تم تأمين كافة عمليات الإدراج (DOM) بحواجز حماية لضمان عدم توقف الموقع، وتم توحيد بروتوكولات التوجيه.
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

export const showHomeView = function() {
    try {
        ['view-menu', 'view-tips', 'view-cake-builder', 'view-product-details', 'menu-view', 'product-details-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
        const vHome = document.getElementById('view-home') || document.getElementById('home-view'); 
        if(vHome) {
            vHome.classList.remove('hidden');
            vHome.style.display = 'block'; // تأمين الظهور
        }
        
        setActiveCategoryPill('all');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.warn("حلويات بوسي: استثناء أثناء عرض الرئيسية", e); }
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
            vMenu.style.display = 'block'; // تأمين الظهور
        }
        
        // إجبار النظام على وضع العمودين لضمان الراحة البصرية
        const menuGrid = document.getElementById('menu-grid-container');
        if(menuGrid) {
            menuGrid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-24';
        }
        
        if(window.switchCategory) window.switchCategory('all');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.warn("حلويات بوسي: استثناء أثناء عرض المنيو", e); }
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
            vTips.style.display = 'block'; // تأمين الظهور
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) {}
};
window.showGoldenTips = showGoldenTips;

export const showCakeBuilderView = function() {
    try {
        ['view-home', 'view-menu', 'view-tips', 'view-product-details', 'home-view', 'menu-view', 'product-details-view'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
        const vCake = document.getElementById('view-cake-builder'); 
        if(vCake) {
            vCake.classList.remove('hidden');
            vCake.style.display = 'block'; // تأمين الظهور
        }
        
        window.currentBuilderStep = 1;
        if(window.renderMultiStepCakeBuilder) window.renderMultiStepCakeBuilder();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) {}
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

// 👑 تأمين شلال المنتجات وتفعيل العرض الدائم
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
    
    // دعم للإصدارين (nav القديم و scroll الجديد) لضمان عدم توقف أي واجهة
    const el = document.getElementById('categories-nav') || document.getElementById('categories-scroll') || document.getElementById('categories-container');
    if(!el) return;
    
    // إجبار الحاوية على الظهور
    el.classList.remove('hidden');
    el.style.display = 'block';

    const sortedCats = [...catMenu].sort((a, b) => (a.order || 99) - (b.order || 99));

    // زر الرئيسية
    let html = `<button id="cat-btn-الرئيسية" onclick="window.setCategory('الرئيسية')" class="cat-pill whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-2xl font-bold transition-all border-2 text-sm sm:text-base ${state.activeCat === 'الرئيسية' ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-lg' : 'bg-[#ffffff] text-[var(--site-text)] border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">الرئيسية</button>`;

    // باقي الأقسام
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

// 👑 تأمين الإدراج الآمن (DocumentFragment) لمنع اختفاء العناصر
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
            // إجبار الحاوية على الظهور
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

// 👑 المحرك الأساسي لعرض الأقسام مع الحماية المطلقة
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

    let breadcrumbHtml = `<nav class="flex items-center gap-2 text-sm font-bold text-[var(--site-text)] mb-6 justify-center w-full"><span class="cursor-pointer hover:text-[var(--brand-primary)]" onclick="window.showHomeView ? window.showHomeView() : window.setCategory('الرئيسية')">الرئيسية</span> <i data-lucide="chevron-left" class="w-4 h-4 text-[var(--brand-primary)]"></i> <span class="text-[var(--brand-primary)]">${state.activeCat}</span></nav>`;

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
        
        if (isFullWidth) {
            container.className = 'grid grid-cols-1 gap-10 items-stretch w-full animate-fade-in max-w-4xl mx-auto';
        } else {
            let baseGrid = 'grid-cols-1';
            if (siteSettings.layout_settings && siteSettings.layout_settings.layout_viewMode === 'columns_2') {
                baseGrid = 'grid-cols-2';
            }
            container.className = `grid ${baseGrid} md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 items-stretch w-full animate-fade-in`;
        }
        
        let list = catalog.filter(p => p && p.isActive !== false && p.category === state.activeCat);
        if (state.activeCat === 'ديسباسيتو') {
            list = list.filter(p => {
                const matchSize = p.size === state.dSize || p.subType === state.dSize || (p.desc && typeof p.desc === 'string' && p.desc.includes(state.dSize));
                const isUncategorized = !p.size && !p.subType;
                return matchSize || isUncategorized;
            });
        }
        
        targetHTML = breadcrumbHtml + list.map(p => window.drawProductCard(p)).join('');
        
        // 👑 تأمين حالة القسم الفارغ لعدم اختفاء الواجهة
        if (list.length === 0) {
            container.className = 'w-full animate-fade-in';
            targetHTML = breadcrumbHtml + `<div class="text-center py-20 bg-[#ffffff] rounded-[2rem] border-2 border-dashed border-[var(--brand-primary)]"><i data-lucide="package-search" class="w-16 h-16 mx-auto mb-4 text-[var(--brand-primary)]"></i><p class="font-bold text-[var(--site-text)] text-lg">جاري تجهيز أصناف فاخرة في هذا القسم.</p></div>`;
        }
    }

    // التنفيذ القاطع للإدراج
    window.enforceCategoryRender('display-container', targetHTML);
    if(window.lucide) lucide.createIcons();

    if (showSubTabs) {
        subTabs.classList.remove('hidden');
        if (state.activeCat === 'ورد') renderFlowerTabs(subTabs);
        if (state.activeCat === 'ديسباسيتو') {
            subTabs.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border-2 flex justify-center gap-2 bg-[#ffffff] border-[var(--brand-primary)]">${dSizes.map(s => `<button onclick="window.setSub('s', '${s}')" class="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border-2 ${state.dSize === s ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)]' : 'bg-[#ffffff] text-[var(--site-text)] border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">${s}</button>`).join('')}</div>`;
        }
    } else {
        if(subTabs) subTabs.classList.add('hidden');
    }
    
    if(window.renderSmartSuggestions) window.renderSmartSuggestions('main');
};
window.renderMainDisplay = renderMainDisplay;

/**
 * 👑 محرك بناء صفحة تفاصيل المنتج (Product Details Architecture المدمج والمحدث)
 * يبني الهيكل المطلوب حرفياً ويتوافق تماماً مع نظام التوجيه السيادي
 */
export const showProductDetails = function(productId) {
    const safeId = String(productId);
    const product = (window.catalogMap && typeof window.catalogMap.get === 'function') 
                    ? window.catalogMap.get(safeId) 
                    : catalog.find(p => String(p.id) === safeId);
    
    if (!product) {
        if(typeof window.showSystemToast === 'function') window.showSystemToast('نأسف لحضرتك، بيانات هذا المنتج قيد التحديث.', 'error');
        return;
    }

    try {
        let userPrefs = JSON.parse(localStorage.getItem('bose_user_prefs')) || {};
        userPrefs[product.category] = (userPrefs[product.category] || 0) + 1;
        localStorage.setItem('bose_user_prefs', JSON.stringify(userPrefs));
    } catch(e) {}

    // تأمين حاوية العرض الداخلية للمنتج وإخفاء الشاشات النشطة لمنع التداخل
    const detailsContainer = document.getElementById('single-product-container') || document.getElementById('product-details-content');
    let vProd = document.getElementById('view-product-details') || document.getElementById('product-details-view'); 
    
    if (!vProd) {
        vProd = document.createElement('div');
        vProd.id = 'view-product-details';
        vProd.className = 'w-full flex flex-col gap-8 overflow-x-hidden content-padding-top pb-24';
        document.body.appendChild(vProd);
    }

    ['view-home', 'view-menu', 'view-tips', 'view-cake-builder', 'home-view', 'menu-view'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    
    vProd.classList.remove('hidden');
    vProd.style.display = 'block';

    const targetContainer = detailsContainer || vProd;
    const isOutOfStock = product.inStock === false || product.isActive === false;
    
    const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
    let rawImageUrl = defaultFallbackImage;
    if (product.images && product.images.length > 0 && product.images[0] && String(product.images[0]).trim() !== '') {
        rawImageUrl = product.images[0];
    } else if (product.img && String(product.img).trim() !== '') {
        rawImageUrl = product.img;
    } else if (typeof window.getImgFallback === 'function') {
        rawImageUrl = window.getImgFallback(product.category) || defaultFallbackImage;
    }
    const imageUrl = optimizeCloudinaryUrl(rawImageUrl);

    let imagesGalleryHtml = '';
    if (product.images && product.images.length > 1) {
        imagesGalleryHtml = `<div class="flex gap-2 mt-4 overflow-x-auto hide-scrollbar pb-2">
            ${product.images.map(img => `<img src="${optimizeCloudinaryUrl(img)}" onclick="document.getElementById('main-prod-img-${product.id}').src='${optimizeCloudinaryUrl(img)}'" class="w-16 h-16 rounded-xl object-cover border-2 border-[var(--brand-primary)] cursor-pointer hover:opacity-80 transition-opacity">`).join('')}
        </div>`;
    }

    const desc = product.desc || getFinalDescription(product);

    // هندسة وبناء شجرة العناصر (DOM) بأسلوب راقي ومريح بصرياً
    targetContainer.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 px-4 w-full">
            
            <button onclick="window.showMenuView()" class="flex items-center gap-2 text-[var(--site-text)] opacity-70 hover:opacity-100 hover:text-[var(--brand-primary)] font-bold transition-colors bg-[#ffffff] border-2 border-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)] px-4 py-2 rounded-xl shadow-sm">
                <i data-lucide="arrow-right" class="w-5 h-5"></i> العودة للمنيو
            </button>

            <div class="text-center space-y-4">
                <h1 class="text-3xl md:text-4xl font-black text-[var(--brand-primary)] tracking-tight">${escapeHTML(product.name)}</h1>
                ${desc ? `<p class="text-sm md:text-base text-[var(--site-text)] font-bold leading-relaxed max-w-2xl mx-auto">${escapeHTML(desc)}</p>` : ''}
            </div>

            <div class="bg-[#ffffff] rounded-[2.5rem] shadow-2xl shadow-[var(--brand-primary)]/20 border-2 border-[var(--brand-primary)] overflow-hidden flex flex-col md:flex-row mb-12">
                <div class="md:w-1/2 relative h-72 md:h-auto border-b-2 md:border-b-0 md:border-l-2 border-[var(--brand-primary)]/20 cursor-zoom-in" onclick="window.openGlobalLightbox(document.getElementById('main-prod-img-${product.id}').src)">
                    <img id="main-prod-img-${product.id}" src="${imageUrl}" alt="${escapeHTML(product.name)}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale opacity-60' : ''}">
                    ${product.badge ? `<span class="absolute top-4 right-4 bg-[var(--brand-primary)] text-[#ffffff] text-[10px] font-black px-3 py-1.5 rounded-lg shadow-md border border-[#ffffff]">${escapeHTML(product.badge)}</span>` : ''}
                    ${isOutOfStock ? `<div class="absolute inset-0 bg-[#ffffff]/40 flex items-center justify-center backdrop-blur-[2px]"><span class="bg-[var(--brand-primary)] text-[#ffffff] px-4 py-2 rounded-xl text-xs font-bold shadow-lg border-2 border-[#ffffff]">نفدت الكمية مؤقتاً</span></div>` : ''}
                </div>
                
                <div class="p-6 md:p-8 md:w-1/2 flex flex-col justify-center space-y-6 bg-gradient-to-br from-[#ffffff] to-[var(--brand-primary)]/5">
                    <div>
                        <h3 class="text-sm font-black text-[var(--brand-primary)] uppercase tracking-widest mb-2 border-b-2 border-[var(--brand-primary)]/20 pb-2 inline-block">تفاصيل النكهة</h3>
                        <p class="text-xs text-[var(--site-text)] font-bold leading-relaxed mt-2">${product.category === 'ديسباسيتو' ? 'قاعدة فادج كيك غنية متوجة بأفضل الصوصات.' : (product.category === 'سينابون' ? 'عجينة خميرة طبيعية قطنية مخبوزة بعناية فائقة.' : 'أجود المكونات المختارة بعناية لضمان تجربة تذوق راقية ومرضية ذوقاً وحجماً.')}</p>
                    </div>
                    
                    ${imagesGalleryHtml}

                    <div class="flex items-center justify-between border-t-2 border-b-2 border-[var(--brand-primary)]/10 py-4">
                        <span class="text-2xl font-black text-[var(--site-text)]">${product.price > 0 ? Number(product.price).toLocaleString('ar-EG') + ' <span class="text-sm text-[var(--brand-primary)]">ج.م</span>' : 'حسب الطلب'}</span>
                        
                        <div class="quantity-controls flex items-center gap-4 bg-[#ffffff] border-2 border-[var(--brand-primary)]/30 rounded-2xl p-1 shadow-inner">
                            <button onclick="window.updateTempQtyContext(this, -1)" class="w-8 h-8 flex items-center justify-center bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-xl hover:bg-[var(--brand-primary)] hover:text-[#ffffff] active:scale-95 transition-all"><i data-lucide="minus" class="w-4 h-4"></i></button>
                            <span class="temp-qty-display w-6 text-center font-black text-[var(--site-text)] text-sm" data-prod-id="${product.id}">1</span>
                            <button onclick="window.updateTempQtyContext(this, 1)" class="w-8 h-8 flex items-center justify-center bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-xl hover:bg-[var(--brand-primary)] hover:text-[#ffffff] active:scale-95 transition-all"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        </div>
                    </div>

                    <button onclick="window.addWithQtyContext(this, '${product.id}')" class="${isOutOfStock ? 'bg-[var(--site-text)]/20 text-[var(--site-text)]/50 cursor-not-allowed border-none' : 'bg-[var(--brand-primary)] hover:-translate-y-1 hover:shadow-lg text-[#ffffff] border-2 border-[var(--brand-primary)] hover:bg-[#ffffff] hover:text-[var(--brand-primary)]'} w-full py-4 rounded-[1.5rem] font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3" ${isOutOfStock ? 'disabled' : ''}>
                        <i data-lucide="${isOutOfStock ? 'x-circle' : 'shopping-bag'}" class="w-6 h-6"></i> 
                        ${isOutOfStock ? 'غير متوفر مؤقتاً' : 'إضافة إلى السلة 🛍️'}
                    </button>
                </div>
            </div>

            <div id="product-reviews-section" class="pt-8 mb-12 border-t-2 border-[var(--brand-primary)]/20">
                <h3 class="text-xl font-black text-[var(--site-text)] mb-6 flex items-center gap-2 border-b-2 border-[var(--brand-primary)]/20 pb-3"><i data-lucide="star" class="w-6 h-6 text-amber-400"></i> آراء عملاء حلويات بوسي</h3>
                <div id="reviews-list-${product.id}" class="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[50px]">
                    <p class="text-xs text-[var(--site-text)] font-bold text-center py-4 w-full col-span-full">جاري استدعاء التقييمات المعتمدة...</p>
                </div>
                <div class="mt-6 bg-[#ffffff] p-6 rounded-[2rem] border-2 border-[var(--brand-primary)]">
                    <h4 class="font-black text-[var(--site-text)] text-sm mb-4 flex items-center gap-2"><i data-lucide="edit-3" class="w-5 h-5 text-[var(--brand-primary)]"></i> رأيك بيفرق معانا.. شاركنا تجربتك مع طعم حلويات بوسي</h4>
                    <div class="space-y-4">
                        <input type="text" id="review-cust-name-${product.id}" placeholder="الاسم..." class="w-full p-4 bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-xl text-sm font-bold focus:outline-none text-[var(--site-text)]">
                        <textarea id="review-cust-comment-${product.id}" rows="2" placeholder="رأيك في الطعم والجودة..." class="w-full p-4 bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-xl text-sm font-bold focus:outline-none text-[var(--site-text)] resize-none"></textarea>
                        <div class="flex justify-between items-center bg-[#ffffff] p-3 rounded-xl border-2 border-[var(--brand-primary)]">
                            <span class="text-xs font-bold text-[var(--site-text)]">التقييم:</span>
                            <select id="review-cust-rating-${product.id}" class="text-sm font-black text-[var(--brand-primary)] bg-transparent focus:outline-none border-none">
                                <option value="5">⭐⭐⭐⭐⭐ (ممتاز)</option>
                                <option value="4">⭐⭐⭐⭐ (جيد جداً)</option>
                                <option value="3">⭐⭐⭐ (متوسط)</option>
                            </select>
                        </div>
                        <button id="review-submit-btn-${product.id}" onclick="window.submitCustomerReviewLive('${product.id}')" class="w-full py-4 bg-[var(--brand-primary)] text-[#ffffff] rounded-xl text-sm font-black shadow-sm border-2 border-[var(--brand-primary)] hover:bg-[#ffffff] hover:text-[var(--brand-primary)] transition-all">إرسال التقييم</button>
                    </div>
                </div>
            </div>

            <div id="product-related-section" class="pt-8 border-t-2 border-[var(--brand-primary)]/20">
                <h3 class="text-xl font-black text-[var(--site-text)] mb-6 flex items-center gap-2"><i data-lucide="sparkles" class="w-6 h-6 text-[var(--brand-primary)]"></i> تشكيلات قد تنال إعجاب حضرتك</h3>
                <div id="product-related-container" class="grid grid-cols-2 md:grid-cols-4 gap-4 hide-scrollbar pb-4">
                </div>
            </div>
        </div>
    `;

    if(window.lucide) window.lucide.createIcons();
    if (window.loadLiveReviews) window.loadLiveReviews(product.id);
    
    // استدعاء الترشيحات المرتبطة باحترافية
    if(window.renderRelatedProducts) {
        window.renderRelatedProducts(product.category, product.id);
    } else if(typeof window.renderSmartSuggestions === 'function') {
        window.renderSmartSuggestions('main');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.showProductDetails = showProductDetails;

// تعيين الدالة القديمة لتعمل من خلال المعمارية المحدثة حفاظاً على الترابط البرمجي
export const navigateToProduct = window.showProductDetails;
window.navigateToProduct = navigateToProduct;

// 👑 محرك التوصيات الديناميكي المدمج بشكل آمن
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
                <div class="w-full h-32 overflow-hidden">
                    <img src="${safeUrl}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="${window.escapeHTML(item.name)}">
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
                        ${(siteSettings.cakeBuilder.flavors || ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت']).map(fl => `
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
                        <button onclick="window.updateCakeBuilderField('printing', 'صورة قابلة للأكل')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.printing === 'صورة قابلة للأكل' ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-md transform scale-105' : 'bg-[#ffffff] border-[var(--brand-primary)] text-[var(--site-text)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">صورة قابلة للأكل (+${siteSettings.cakeBuilder.imagePrintingPrice || 60} ج)</button>
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

// 👑 دالة هندسية متطورة لرسم بطاقات المنتجات مع تأمين قاطع للصور
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
    
    let discountBadgeHtml = '';
    const oldP = Number(p.oldPrice);
    const currentP = Number(p.price);
    if (oldP && oldP > currentP) {
        const discountPercent = Math.round(((oldP - currentP) / oldP) * 100);
        discountBadgeHtml = `<div class="text-[var(--brand-primary)] text-sm font-black mb-2 px-3 py-1 bg-[#ffffff] rounded-full inline-block border-2 border-[var(--brand-primary)]">خصم ${discountPercent}% 🔥</div>`;
    } else if (p.badge) {
        discountBadgeHtml = `<div class="text-[var(--brand-primary)] text-sm font-black mb-2 px-3 py-1 bg-[#ffffff] rounded-full inline-block border-2 border-[var(--brand-primary)]">${escapeHTML(p.badge)}</div>`;
    }

    let cardHtml = `
    <div id="product-card-${pIdSafe}" class="product-card-premium">
        <div class="product-image-glow w-full aspect-square mb-4 relative overflow-hidden rounded-[2rem]" onclick="window.navigateToProduct('${pIdSafe}')">
            <img src="${displayImg}" class="${isOutOfStock ? 'grayscale opacity-70' : ''} blur-load w-full h-full object-contain transition-all duration-700 hover:scale-110 cursor-pointer" loading="lazy" decoding="async" alt="صنف ${escapeHTML(p.name)} من قسم ${escapeHTML(p.category)} - حلويات بوسي" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(p.category)}');">
            ${isOutOfStock ? `<div class="absolute inset-0 bg-[#ffffff]/50 backdrop-blur-[4px] z-10 flex items-center justify-center"><span class="bg-[var(--brand-primary)] text-[#ffffff] font-black px-4 py-2 rounded-xl shadow-lg border-2 border-[#ffffff]">نفدت الكمية مؤقتاً</span></div>` : ''}
        </div>
        
        <div class="flex flex-col flex-1 text-center bg-[#ffffff] relative z-20">
            ${discountBadgeHtml}
            <h4 class="text-xl font-black leading-tight text-[var(--site-text)] mb-2">${escapeHTML(p.name)}</h4>
            <p class="text-sm font-bold text-[var(--site-text)] mb-4 line-clamp-3 leading-relaxed">${getFinalDescription(p)}</p>
            
            <div class="mt-auto flex flex-col gap-4 w-full border-t-2 border-[var(--brand-primary)] pt-4">
                <div class="flex items-center justify-center rounded-full py-2 px-4 mx-auto min-w-[70%] bg-[#ffffff] border-2 border-[var(--brand-primary)] shadow-sm">
                    <span class="font-black text-2xl text-[var(--brand-primary)]">${currentP > 0 ? currentP + ' ج.م' : 'حسب الطلب'}</span>
                    ${(oldP && oldP > currentP) ? `<del class="text-sm text-[var(--site-text)] font-bold ml-2">${oldP}</del>` : ''}
                </div>
                
                <div class="flex flex-col gap-3 w-full">
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2 bg-[#ffffff] rounded-full p-1 border-2 border-[var(--brand-primary)] shadow-inner quantity-controls">
                            <button onclick="window.updateTempQtyContext(this, -1)" class="w-10 h-10 flex items-center justify-center bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-full shadow-sm text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] font-black transition-all"><i data-lucide="minus" class="w-4 h-4"></i></button>
                            <span class="temp-qty-display text-lg font-black text-[var(--site-text)] w-6 text-center" data-prod-id="${pIdSafe}">1</span>
                            <button onclick="window.updateTempQtyContext(this, 1)" class="w-10 h-10 flex items-center justify-center bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-full shadow-sm text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] font-black transition-all"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        </div>
                        ${isOutOfStock ? 
                        `<button class="flex-1 py-3 bg-[#ffffff] text-[var(--site-text)] rounded-full font-black text-lg shadow-inner cursor-not-allowed border-2 border-[var(--brand-primary)]">غير متوفر</button>` 
                        : 
                        `<button onclick="window.addWithQtyContext(this, '${pIdSafe}')" class="flex-1 py-3 bg-[var(--brand-primary)] text-[#ffffff] border-2 border-[var(--brand-primary)] rounded-full font-black text-lg btn-premium-action flex items-center justify-center gap-2 hover:bg-[#ffffff] hover:text-[var(--brand-primary)]"><i data-lucide="shopping-bag" class="w-5 h-5"></i> إضافة للسلة</button>`
                        }
                    </div>
                    <div class="flex gap-2 w-full">
                        <button onclick="window.navigateToProduct('${pIdSafe}')" class="flex-1 py-2.5 bg-[#ffffff] text-[var(--site-text)] rounded-full font-bold text-sm hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-colors border-2 border-[var(--brand-primary)]">استعراض التفاصيل</button>
                        <button onclick="window.shareProduct('${pIdSafe}', '${escapeHTML(p.name)}')" class="px-3 bg-[#ffffff] text-[var(--brand-primary)] rounded-full hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-colors border-2 border-[var(--brand-primary)] flex items-center justify-center"><i data-lucide="share-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
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
        const collectionPath = `catalog/${productId}/livereviews`;
        if (window.NetworkEngine && typeof window.NetworkEngine.safeWrite === 'function') {
            await window.NetworkEngine.safeWrite(collectionPath, reviewId, reviewPayload);
        } else if (typeof db !== 'undefined' && db) {
            await db.collection('catalog').doc(String(productId)).collection('livereviews').doc(reviewId).set(reviewPayload);
        }
        showSystemToast("شكراً لحضرتك! تم إرسال التقييم بنجاح 👑", "success");
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
        
        // 👑 تأمين ظهور الشلال الرئيسي عند العودة للرئيسية
        const waterfallContainer = document.getElementById('waterfall-section') || document.getElementById('waterfall-container');
        const mainContent = document.getElementById('main-display-area');
        if(waterfallContainer) {
            waterfallContainer.classList.remove('hidden');
            waterfallContainer.style.display = 'block';
        }
        if(mainContent) mainContent.classList.add('hidden');
        if(window.initWaterfall) window.initWaterfall();

    } else {
        state.activeCat = c;
        if(window.showMenuView) window.showMenuView();
        else if(window.switchToMenuView) window.switchToMenuView();
        
        // 👑 إخفاء الشلال وإظهار المنتجات للأقسام المحددة
        const waterfallContainer = document.getElementById('waterfall-section') || document.getElementById('waterfall-container');
        const mainContent = document.getElementById('main-display-area');
        if(waterfallContainer) waterfallContainer.classList.add('hidden');
        if(mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.style.display = 'block';
        }
        
        if(window.renderMainDisplay) window.renderMainDisplay();

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
                        // إزالة الإخفاء القسري
                        container.classList.remove('hidden'); 
                        container.style.display = container.className.includes('grid') ? 'grid' : 'block'; 
                    }
                });
            }, 150);
        }
    });
});