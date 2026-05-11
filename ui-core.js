/**
 * 👑 BoseSweets UI Core Engine (V22.1 - Sovereign Core)
 * المحرك الأساسي والوظائف السيادية - حلويات بوسي
 * تم تحصين الدورة الرسومية لحماية الشلال والشريط من الانهيار إذا تأخرت السحابة.
 */

import { detailedDescriptions } from './config.js';
import { siteSettings, isAppReady, shippingZones } from './state.js';
import { escapeHTML, optimizeCloudinaryUrl, showSystemToast } from './utils.js';

const db = window.db || (typeof window !== 'undefined' && window.firebase ? window.firebase.firestore() : undefined);
const firebase = window.firebase || (typeof window !== 'undefined' ? window.firebase : undefined);

// 👑 تأمين الصور الافتراضية
export const getImgFallback = function(category) {
    return (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
};
window.getImgFallback = getImgFallback;

// 👑 محرك توليد الأوصاف الاحترافي
export const getFinalDescription = function(p) {
    if (!p) return '';
    if (p.desc && typeof p.desc === 'string' && p.desc.trim().length > 3) {
        return escapeHTML(p.desc.trim());
    }
    
    const name = (p.name ? String(p.name) : '').trim();
    const category = (p.category ? String(p.category) : '').trim();
    const subType = (p.subType || p.size || '').trim();
    
    for (let key in detailedDescriptions) {
        if (name.includes(key) || `${category} ${subType}`.includes(key)) {
            return detailedDescriptions[key];
        }
    }
    
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

export const getCapsuleDescription = (p) => getFinalDescription(p);
window.getCapsuleDescription = getCapsuleDescription;

// 👑 شريط الإعلانات (Ticker - تم تحصينه بالكامل)
export const renderTicker = function() {
    try {
        let container = document.getElementById('ticker-container');
        const navbar = document.getElementById('navbar');
        
        // التحصين الفولاذي: ضمان وجود siteSettings قبل الفحص
        const settings = siteSettings || {};
        const isActive = settings.ticker_isActive ?? settings.tickerActive ?? true;
        
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

        const text = settings.ticker_text || settings.tickerText || settings.announcement || 'حلويات بوسي: تجربة تذوق بتعكس الجودة الأصلية وتليق بمناسباتك السعيدة';
        const speed = settings.ticker_speed || settings.tickerSpeed || 20;
        const bgColor = settings.ticker_bgColor || '#ff91a4';
        const textColor = settings.ticker_textColor || '#ffffff';

        container.style.backgroundColor = bgColor;
        container.classList.remove('hidden');
        container.classList.add('flex', 'items-center');
        container.innerHTML = `<span class="animate-ticker text-xs md:text-sm font-bold" style="white-space: nowrap; animation-duration: ${speed}s; color: ${textColor}; font-family: var(--brand-font);">${text} &nbsp;&nbsp;✨&nbsp;&nbsp; ${text} &nbsp;&nbsp;✨&nbsp;&nbsp; ${text}</span>`;
        
        if(navbar) navbar.style.top = '32px';
    } catch (e) {
        console.warn("BoseSweets: تم تجاوز خطأ في الشريط المتحرك لضمان سير الواجهة.", e);
    }
};
window.renderTicker = renderTicker;

// 👑 تطبيق إعدادات الموقع والهوية البصرية على الواجهة
export const applySettingsToUI = function() {
    try {
        window.renderTicker(); 
        if (!isAppReady) return; 

        const settings = siteSettings || {};
        const root = document.documentElement;
        
        if(settings.visuals && settings.visuals.fontFamily) root.style.setProperty('--brand-font', settings.visuals.fontFamily);
        else if(settings.fontFamily) root.style.setProperty('--brand-font', settings.fontFamily);
        
        const themeColor = (settings.visuals && settings.visuals.themeHex) ? settings.visuals.themeHex : '#ff91a4';
        root.style.setProperty('--brand-primary', themeColor);
        root.style.setProperty('--site-bg', '#ffffff');
        root.style.setProperty('--site-text', '#1a1a1a');

        const loaderTextEl = document.getElementById('dyn-loader-text');
        if (loaderTextEl) loaderTextEl.innerText = (settings.UI_Settings && settings.UI_Settings.loader_text) ? settings.UI_Settings.loader_text : ((settings.visuals && settings.visuals.loaderText) ? settings.visuals.loaderText : "حلويات بوسي ✨");

        if (settings.seo) {
            document.title = (settings.seo.title && settings.seo.title.trim() !== '') ? settings.seo.title.trim() : `${settings.brandName || 'حلويات بوسي'} | المنصة الرسمية المعتمدة في الفرافرة`;
            const titleEl = document.getElementById('dyn-page-title');
            if(titleEl) titleEl.innerText = document.title;
            
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.setAttribute('name', 'description'); document.head.appendChild(metaDesc); }
            metaDesc.setAttribute('content', settings.seo.desc || `الموقع الرسمي لبراند حلويات بوسي (BoseSweets). نتميز بصناعة التورت الملكية، السينابون الفاخر، والدوناتس المبتكرة في الفرافرة والكفاح.`);

            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) { metaKeywords = document.createElement('meta'); metaKeywords.setAttribute('name', 'keywords'); document.head.appendChild(metaKeywords); }
            metaKeywords.setAttribute('content', settings.seo.keywords || `حلويات بوسي, BoseSweets, تورت الفرافرة, حلويات الوادي الجديد, كيك الكفاح, سينابون بوسي`);
        }

        if (settings.UI_Settings) {
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.style.backgroundColor = settings.UI_Settings.loader_bgColor || '#ffffff';
                const loaderTextEl = loader.querySelector('h1');
                if (loaderTextEl) loaderTextEl.style.color = settings.UI_Settings.loader_textColor || '#ff91a4';
                const loaderIcon = loader.querySelector('i');
                if(loaderIcon) loaderIcon.style.color = settings.UI_Settings.loader_textColor || '#ff91a4';
            }
        }

        if (settings.social) {
            document.querySelectorAll('a[href*="facebook.com"]').forEach(a => a.href = settings.social.facebook || 'https://facebook.com/BoseSweets');
            document.querySelectorAll('a[href*="instagram.com"]').forEach(a => a.href = settings.social.instagram || 'https://instagram.com/BoseSweets');
            
            const footerLinksContainer = document.getElementById('custom-social-links-container');
            if (footerLinksContainer) {
                let customHtml = '';
                if (settings.social.tiktok) customHtml += `<a href="${settings.social.tiktok}" target="_blank" class="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] flex items-center justify-center transition-all" title="TikTok"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.33 6.33 0 0 0 6.27-6.36v-6.9a8.16 8.16 0 0 0 4.7 1.48v-3.4a4.85 4.85 0 0 1-2.65-.17z"/></svg></a>`;
                if (settings.social.whatsapp) customHtml += `<a href="https://wa.me/${settings.social.whatsapp}" target="_blank" class="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] flex items-center justify-center transition-all" title="WhatsApp"><i data-lucide="message-circle" class="w-5 h-5"></i></a>`;
                
                if (settings.social.customLinks && settings.social.customLinks.length > 0) {
                    settings.social.customLinks.forEach(link => {
                        customHtml += `<a href="${escapeHTML(link.url)}" target="_blank" class="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] flex items-center justify-center transition-all" title="${escapeHTML(link.label)}"><i data-lucide="link-2" class="w-5 h-5"></i></a>`;
                    });
                }
                footerLinksContainer.innerHTML = customHtml;
                if(window.lucide) lucide.createIcons();
            }
        }
        
        if(document.getElementById('dyn-page-title')) document.getElementById('dyn-page-title').innerText = `${settings.brandName || 'حلويات بوسي'} | القائمة الرسمية`;
        if(document.getElementById('dyn-brand-name')) document.getElementById('dyn-brand-name').innerText = settings.brandName || 'حلويات بوسي';
        
        if(document.getElementById('dyn-hero-title')) { const title = document.getElementById('dyn-hero-title'); title.innerHTML = settings.heroTitle || 'حلويات بوسي'; title.style.opacity = '1'; }
        if(document.getElementById('dyn-hero-desc')) { const desc = document.getElementById('dyn-hero-desc'); desc.innerText = settings.heroDesc || 'الطعم الفاخر'; desc.style.opacity = '0.9'; }
        if(document.getElementById('dyn-footer-brand')) document.getElementById('dyn-footer-brand').innerText = settings.brandName || 'حلويات بوسي';
        if(document.getElementById('dyn-footer-quote')) document.getElementById('dyn-footer-quote').innerText = settings.footerQuote || 'عقد من التميز';
        if(document.getElementById('dyn-footer-phone')) document.getElementById('dyn-footer-phone').innerText = settings.footerPhone || '';
        if(document.getElementById('dyn-footer-address')) document.getElementById('dyn-footer-address').innerHTML = settings.footerAddress || '';
        
        const areaSelect = document.getElementById('cust-area');
        if(areaSelect && shippingZones) areaSelect.innerHTML = `<option value="" disabled selected>اختار منطقة التوصيل...</option>` + shippingZones.map(z => `<option value="${z.id}">${escapeHTML(z.name)} (+${Number(z.fee)} ج.م توصيل)</option>`).join('');
        
        if(typeof window.renderCustomerSidebarCategories === 'function') window.renderCustomerSidebarCategories();

        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('product');
            if (productId && typeof window.navigateToProduct === 'function') {
                window.navigateToProduct(productId);
            }
        }, 800);
    } catch(e) {
        console.error("BoseSweets: خطأ أثناء تطبيق الإعدادات الفنية", e);
    }
};
window.applySettingsToUI = applySettingsToUI;

// 👑 رسم بطاقة المنتج الموحدة (Sovereign Product Card)
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

    return `
    <div id="product-card-${pIdSafe}" class="product-card-premium relative bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-[2rem] overflow-hidden shadow-sm hover:-translate-y-1 transition-all group flex flex-col p-4">
        <div class="product-image-glow w-full aspect-square mb-4 relative overflow-hidden rounded-[1.5rem]" onclick="window.navigateToProduct('${pIdSafe}')">
            <img src="${displayImg}" class="${isOutOfStock ? 'grayscale opacity-70' : ''} blur-load w-full h-full object-cover transition-all duration-700 group-hover:scale-110 cursor-pointer" loading=\"lazy\" decoding=\"async\" alt="صنف ${escapeHTML(p.name)} من قسم ${escapeHTML(p.category)} - حلويات بوسي" onerror="this.onerror=null; this.src=window.getImgFallback('${escapeHTML(p.category)}');">
            ${isOutOfStock ? `<div class="absolute inset-0 bg-[#ffffff]/50 backdrop-blur-[4px] z-10 flex items-center justify-center"><span class="bg-[var(--brand-primary)] text-[#ffffff] font-black px-4 py-2 rounded-xl shadow-lg border-2 border-[#ffffff]">نفدت الكمية مؤقتاً</span></div>` : ''}
        </div>
        
        <div class="flex flex-col flex-1 text-center relative z-20">
            ${discountBadgeHtml}
            <h4 class="text-xl font-black leading-tight text-[var(--site-text)] mb-2">${escapeHTML(p.name)}</h4>
            <p class="text-xs font-bold text-[var(--site-text)] mb-4 line-clamp-3 leading-relaxed opacity-80">${getFinalDescription(p)}</p>
            
            <div class="mt-auto flex flex-col gap-4 w-full border-t-2 border-[var(--brand-primary)]/20 pt-4">
                <div class="flex items-center justify-center rounded-full py-2 px-4 mx-auto min-w-[70%] bg-[#ffffff] border-2 border-[var(--brand-primary)] shadow-sm">
                    <span class="font-black text-2xl text-[var(--brand-primary)]">${currentP > 0 ? currentP + ' ج.م' : 'حسب الطلب'}</span>
                    ${(oldP && oldP > currentP) ? `<del class="text-sm text-[var(--site-text)] font-bold ml-2 opacity-50">${oldP}</del>` : ''}
                </div>
                
                <div class="flex flex-col gap-3 w-full">
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2 bg-[#ffffff] rounded-full p-1 border-2 border-[var(--brand-primary)] shadow-inner quantity-controls">
                            <button onclick="window.updateTempQtyContext(this, -1)" class="w-10 h-10 flex items-center justify-center bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-full shadow-sm text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] font-black transition-all"><i data-lucide="minus" class="w-4 h-4"></i></button>
                            <span class="temp-qty-display text-lg font-black text-[var(--site-text)] w-6 text-center" data-prod-id="${pIdSafe}">1</span>
                            <button onclick="window.updateTempQtyContext(this, 1)" class="w-10 h-10 flex items-center justify-center bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-full shadow-sm text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff] font-black transition-all"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        </div>
                        ${isOutOfStock ? 
                        `<button class="flex-1 py-3 bg-[var(--site-text)]/10 text-[var(--site-text)]/50 rounded-full font-black text-sm shadow-inner cursor-not-allowed border-2 border-transparent">غير متوفر</button>` 
                        : 
                        `<button onclick="window.addWithQtyContext(this, '${pIdSafe}')" class="flex-1 py-3 bg-[var(--brand-primary)] text-[#ffffff] border-2 border-[var(--brand-primary)] rounded-full font-black text-sm btn-premium-action flex items-center justify-center gap-2 hover:bg-[#ffffff] hover:text-[var(--brand-primary)]"><i data-lucide="shopping-bag" class="w-5 h-5"></i> إضافة للسلة</button>`
                        }
                    </div>
                    <div class="flex gap-2 w-full">
                        <button onclick="window.navigateToProduct('${pIdSafe}')" class="flex-1 py-2.5 bg-[#ffffff] text-[var(--site-text)] rounded-full font-bold text-sm hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-colors border-2 border-[var(--brand-primary)]/50">التفاصيل</button>
                        <button onclick="window.shareProduct('${pIdSafe}', '${escapeHTML(p.name)}')" class="px-4 bg-[#ffffff] text-[var(--brand-primary)] rounded-full hover:bg-[var(--brand-primary)] hover:text-[#ffffff] transition-colors border-2 border-[var(--brand-primary)]/50 flex items-center justify-center"><i data-lucide="share-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};
window.drawProductCard = drawProductCard;

// 👑 إدارة المراجعات المباشرة (Live Reviews)
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
    
    const reviewPayload = { reviewId, customerName, rating, comment, timestamp: serverTime, isApproved: false };

    try {
        const collectionPath = `catalog/${productId}/livereviews`;
        if (window.NetworkEngine && typeof window.NetworkEngine.safeWrite === 'function') {
            await window.NetworkEngine.safeWrite(collectionPath, reviewId, reviewPayload);
        } else if (typeof db !== 'undefined' && db) {
            await db.collection('catalog').doc(String(productId)).collection('livereviews').doc(reviewId).set(reviewPayload);
        }
        showSystemToast("شكراً لحضرتك! تم إرسال التقييم بنجاح 👑", "success");
        nameInput.value = ''; commentInput.value = '';
    } catch (e) {
        showSystemToast("حدث تأخير في الشبكة، تم الحفظ وجاري الإرسال", "info");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "إرسال التقييم";
    }
};
window.submitCustomerReviewLive = submitCustomerReviewLive;

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