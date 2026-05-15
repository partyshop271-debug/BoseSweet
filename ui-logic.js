/**
 * ============================================================================
 * 👑 BoseSweets Sovereign UI Logic Engine | المحرك البصري السيادي (V30.3)
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي (The Management)
 * الوظيفة: التنفيذ الحرفي للدستور البرمجي والهندسي الشامل لضمان تجربة مستخدم فاخرة.
 * التعديل الحالي (V30.3): 
 * 1. الربط الصارم مع كلاسات CSS السيادية (.active) وإلغاء الاعتمادية على Tailwind في الحركة.
 * 2. إضافة صمامات أمان لمحركات الرسم (DOM Readiness Check) لمنع التكدس والأخطاء.
 * التوافقية: يعمل بتناغم مطلق مع (data-bridge.js) و (core-engine.js) و (style.css).
 * ============================================================================
 */

import coreExports from './core-engine.js';
const { boseConfig, BoseState } = coreExports;

const BOSE_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg";

// ============================================================================
// 🎨 القسم الأول: النواة البصرية (UI Core) - الهوية والإعدادات العامة
// ============================================================================

export const getImgFallback = function(category) {
    try {
        return (BoseState.siteSettings && BoseState.siteSettings.brandLogo) 
            ? BoseState.siteSettings.brandLogo 
            : BOSE_LOGO_FALLBACK;
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'getImgFallback');
        return BOSE_LOGO_FALLBACK;
    }
};

/**
 * 👑 محرك السياسات والمعلومات السيادية (Info Engine)
 */
export const showInfo = function(type) {
    try {
        let title = "";
        let content = "";
        
        if (type === 'about') {
            title = "عن علامة حلويات بوسي";
            content = `تأسست حلويات بوسي عام 2014 في مدينة الكفاح بمركز الفرافرة، لتكون واجهة رائدة في عالم الحلويات الفاخرة بمحافظة الوادي الجديد. نحن نلتزم بأعلى معايير المهنية والجودة العالمية، مع اختيار أدق الخامات لتقديم تجربة تذوق تليق بسيادتكم. هدفنا هو تقديم "القرار الفني الصحيح" في كل قطعة ننتجها، لضمان استمرارية الثقة المتبادلة بين الإدارة وعملاء العلامة الراقين.`;
        } else if (type === 'privacy') {
            title = "سياسة الخصوصية والتعامل";
            content = `تحرص إدارة حلويات بوسي على حماية بيانات سيادتكم بالكامل. كافة المعلومات الشخصية وأرقام التواصل تُستخدم حصرياً لتنسيق طلباتكم وضمان جودة التوصيل. نحن نؤمن بالاحترام المهني المتبادل؛ لذا، تلتزم الإدارة بعدم مشاركة بياناتكم مع أي جهة خارجية، وضمان تشفير العمليات الرقمية داخل منظومتنا لضمان أمان وخصوصية رحلة تسوقكم معنا.`;
        } else if (type === 'orderPolicy') {
            title = "سياسة التعامل مع الطلبات";
            content = `تلتزم إدارة حلويات بوسي بتقديم تجربة تسوق احترافية لحضرتك. تخضع كافة الطلبات للمراجعة الفنية للتأكد من التوافر وتنسيق مواعيد الاستلام الدقيقة. يحق للإدارة التواصل مع سيادتكم لترتيب أية تفاصيل إضافية تضمن خروج المنتج بالشكل الذي يليق بعلامتنا التجارية.`;
        } else if (type === 'preservationGuide') {
            title = "الدليل الفني للحفظ";
            content = `لضمان تجربة تذوق استثنائية، نوصي في إدارة حلويات بوسي بحفظ التورت والجاتوهات في التبريد الفوري. المخبوزات مثل السينابون يُفضل تسخينها قليلاً قبل التقديم لإبراز قوامها القطني الناعم والخميرة الطبيعية. نرجو من حضرتك الالتزام بهذه المعايير للاستمتاع بالجودة الكاملة.`;
        }

        const modalId = 'bose-info-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl transform transition-transform duration-300 scale-100 border-4" style="border-color: ${boseConfig.branding.colors.pink}20;">
                <div class="p-8">
                    <h3 class="text-2xl font-black mb-6 text-center" style="color: ${boseConfig.branding.colors.dark}; border-bottom: 2px solid ${boseConfig.branding.colors.pink}10; padding-bottom: 1rem;">${title}</h3>
                    <p class="text-base font-bold opacity-90 leading-loose text-right" style="color: ${boseConfig.branding.colors.dark};">${content}</p>
                    <button onclick="document.getElementById('${modalId}').classList.add('opacity-0'); setTimeout(()=>document.getElementById('${modalId}').remove(), 300);" 
                            class="w-full mt-8 py-4 rounded-full font-black text-white text-lg shadow-lg active:scale-95 transition-all" 
                            style="background: ${boseConfig.branding.colors.pink};">
                        تم استيعاب القرار
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        modal.style.opacity = '1';
        
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'showInfo');
    }
};

export const getFinalDescription = function(productName, category) {
    try {
        if (BoseState.siteSettings?.catDescriptions && BoseState.siteSettings.catDescriptions[category]) {
            return BoseState.siteSettings.catDescriptions[category];
        }
        return "تجربة تذوق استثنائية تأخذك في رحلة من الغنى والذوبان والملمس القطني الناعم، صُنعت بكل احترافية لتليق بذوق حضرتك الرفيع وتضيف لمسة من الفخامة المطلقة ليومك.";
    } catch (error) {
        return "قطعة فنية من حلويات بوسي، صُنعت بعناية فائقة لتليق بحضرتك.";
    }
};

export const applySettingsToUI = function() {
    try {
        const root = document.documentElement;
        const s = BoseState.siteSettings;
        if (!s) return;

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
        if(heroDesc) heroDesc.innerHTML = s.heroDesc || "الطعم الفاخر الذي تستحقه حضرتك.";

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
            t.innerHTML = `<div class="ticker-content" style="animation-duration: ${s.tickerSpeed || 20}s; color: ${s.tickerColor || '#fff'}; font-family: ${s.tickerFont || 'inherit'};">${s.tickerText || 'حلويات بوسي: طعم فاخر يليق بحضرتك ✨'}</div>`;
            t.style.background = (s.visuals && s.visuals.themeHex) ? s.visuals.themeHex : boseConfig.branding.colors.pink;
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'renderTicker');
    }
};

// ============================================================================
// 🏗️ القسم الثاني: محركات العرض والتشكيلات البصرية (Layout Engines)
// ============================================================================

/**
 * 👑 محرك كروت المنتجات الملكي (Royal Product Renderer)
 * التعديل الهندسي (V30.3): إضافة صمام أمان للتحقق من وجود الحاوية (Container) قبل المعالجة.
 */
export function renderProductCards(products, containerId, config = {}) {
    // صمام الأمان: التحقق من وجود الحاوية في شجرة الـ DOM
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`👑 UI Engine: تعذر العثور على حاوية الرسم [${containerId}]. تم إيقاف عملية الرسم مؤقتاً لحين بناء الصفحة.`);
        return;
    }

    if (!products || products.length === 0) {
        const emptyMsg = config.emptyMsg || "نجهز لحضرتك أصنافاً جديدة فاخرة.. انتظرونا ✨";
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; font-weight: bold; opacity: 0.6; padding: 40px;">${emptyMsg}</p>`;
        return;
    }

    const pinkColor = boseConfig.branding.colors.pink;
    const whiteColor = boseConfig.branding.colors.white;
    const darkColor = boseConfig.branding.colors.dark;

    container.innerHTML = products.map(p => {
        const isOutOfStock = p.inStock === false || p.status === 'غير متاح';
        const rawImg = p.img || p.image || (p.images?.[0]) || BOSE_LOGO_FALLBACK;
        const finalImgUrl = rawImg.startsWith('http') ? rawImg : `${boseConfig.cloudinary.baseDeliveryUrl}/${rawImg.replace(/^\//, '')}`;
        
        const badgeHtml = p.badge ? `
            <div style="position: absolute; top: 15px; right: 15px; z-index: 10; background: ${whiteColor}; color: ${pinkColor}; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; border: 2px solid ${pinkColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                ${p.badge}
            </div>` : '';

        return `
        <div class="royal-card flex flex-col p-4 relative animate-fade-in" style="background: ${whiteColor}; min-height: 420px; border-radius: 2rem; box-shadow: 0 15px 35px rgba(0,0,0,0.03);">
            ${badgeHtml}
            <div class="w-full aspect-square overflow-hidden rounded-[1.5rem] relative mb-4 cursor-pointer" onclick="window.navigateToProduct('${p.id}')">
                <img src="${finalImgUrl}" 
                     onerror="this.onerror=null; this.src='${BOSE_LOGO_FALLBACK}';" 
                     class="w-full h-full object-cover transition-transform duration-700 hover:scale-110 ${isOutOfStock ? 'grayscale opacity-60' : ''}" 
                     alt="${p.name} - حلويات بوسي" loading="lazy">
                ${isOutOfStock ? `<div style="position: absolute; inset:0; background: rgba(255,255,255,0.5); display:flex; align-items:center; justify-content:center; backdrop-filter: blur(2px);"><span style="background: ${pinkColor}; color: ${whiteColor}; padding: 8px 20px; border-radius: 10px; font-weight: 900; border: 2px solid ${whiteColor};">نفدت مؤقتاً</span></div>` : ''}
            </div>

            <div class="flex flex-col flex-1 text-center justify-between">
                <div>
                    <h4 class="text-xl font-black" style="color: ${darkColor};">${p.name}</h4>
                    <p class="text-xs font-bold opacity-70 mt-2 line-clamp-2" style="line-height: 1.6;">${p.desc || ''}</p>
                </div>

                <div class="mt-4 pt-4" style="border-top: 1px dashed rgba(255,145,164,0.2);">
                    <div class="font-black text-2xl mb-4" style="color: ${pinkColor};">${p.price} ج.م</div>
                    <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-pink-50">
                            <button onclick="window.updateTempQtyContext(this, -1)" class="w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#ff91a4] border border-pink-100 font-black">-</button>
                            <span class="temp-qty-display font-black text-sm px-2" data-prod-id="${p.id}">1</span>
                            <button onclick="window.updateTempQtyContext(this, 1)" class="w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#ff91a4] border border-pink-100 font-black">+</button>
                        </div>
                        <button onclick="window.addWithQtyContext(this, '${p.id}')" 
                                class="flex-1 py-3 rounded-full font-black text-white text-sm transition-all active:scale-95" 
                                style="background: ${pinkColor}; box-shadow: 0 8px 20px rgba(255,145,164,0.2);"
                                ${isOutOfStock ? 'disabled' : ''}>
                            ${isOutOfStock ? 'غير متوفر' : 'إضافة لطلب حضرتك 🛍️'}
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

/**
 * 👑 محرك توزيع المنتجات السيادي (Distribution Engine)
 * التعديل الهندسي (V30.3): تأجيل الرسم (Defer Rendering) إذا لم يكتمل بناء الصفحة.
 */
export function distributeProductsToUI(products = BoseState.catalog) {
    // صمام الأمان: منع محاولة الرسم إذا لم يكن هيكل الصفحة جاهزاً بالكامل لتفادي الأخطاء.
    if (document.readyState === 'loading') {
        console.log("👑 UI Engine: تم تأجيل محرك التوزيع لحين اكتمال البناء الهيكلي للصفحة.");
        document.addEventListener('DOMContentLoaded', () => distributeProductsToUI(products), { once: true });
        return;
    }

    const containers = {
        'new-arrivals-container': p => p.isNew || p.badge?.includes('جديد') || p.badge?.includes('🌟'),
        'best-sellers-container': p => p.isBestSeller || p.badge?.includes('مبيعاً') || p.badge?.includes('🔥'),
        'menuGrid': () => true 
    };

    Object.entries(containers).forEach(([id, filterFn]) => {
        const el = document.getElementById(id);
        if (!el) return;

        if (id === 'menuGrid') {
            const activeCat = document.querySelector('.category-item.active')?.dataset.category || 'all';
            const filtered = activeCat === 'all' ? products : products.filter(p => p.category === activeCat);
            renderProductCards(filtered, id, { emptyMsg: "نعتذر لحضرتك، لا توجد أصناف متاحة في هذا القسم حالياً." });
        } else {
            const filtered = products.filter(filterFn);
            renderProductCards(filtered.length > 0 ? filtered : products.slice(0, 4), id);
        }
    });
}

/**
 * 👑 صمام الأمان لإعادة الرسم التلقائي (Auto Re-render Trigger)
 */
window.addEventListener('BoseSweets_Catalog_Updated', () => {
    console.log("👑 UI Engine: تم رصد تحديث في الكتالوج، جاري إعادة الرسم التلقائي...");
    // استخدام requestAnimationFrame لضمان سلاسة الأداء أثناء إعادة الرسم
    requestAnimationFrame(() => {
        distributeProductsToUI(BoseState.catalog);
    });
});

export const getGridLayoutConfig = function(category) {
    const twoColsCategories = ['الديسباسيتو', 'القشطوطة', 'كبات السعادة', 'الدوناتس', 'السينابون'];
    const oneColCategories = ['التورت', 'الجاتوهات', 'الورد', 'بوكس الروقان', 'الميني تورت', 'الكب كيك', 'الريدفيلفت'];
    
    if (twoColsCategories.includes(category)) return 'grid-cols-2';
    if (oneColCategories.includes(category)) return 'grid-cols-1';
    
    return 'grid-cols-1';
};

export const showProductDetails = function(productId) {
    try {
        const safeId = String(productId);
        const product = BoseState.catalog.find(p => String(p.id) === safeId);
        
        if (!product) {
            if(typeof window.showSystemToast === 'function') window.showSystemToast('نعتذر لحضرتك، بيانات هذا المنتج قيد التحديث حالياً من قبل الإدارة.', 'error');
            return;
        }

        const detailsContainer = document.getElementById('product-details-container');
        if (!detailsContainer) return;

        let rawImg = product.img || product.image || (product.images && product.images.length > 0 ? product.images[0] : getImgFallback(product.category));
        let finalImgUrl = (rawImg.startsWith('http')) ? rawImg : `${boseConfig.cloudinary.baseDeliveryUrl.replace(/\/$/, '')}/${rawImg.replace(/^\//, '')}`;

        const isCustomCake = product.category === 'التورت' || product.category === 'تورت' || product.name.includes('مخصص');
        
        let dynamicTabsHtml = '';
        if (product.category === 'الديسباسيتو') {
            dynamicTabsHtml = `
                <div class="dynamic-tabs my-4">
                    <label class="block text-sm font-bold mb-2" style="color: ${boseConfig.branding.colors.dark};">المقاس المفضل لحضرتك:</label>
                    <div class="flex gap-2">
                        <button class="flex-1 py-3 border rounded-xl font-bold transition-all hover:bg-pink-50" style="border-color: ${boseConfig.branding.colors.pink}; color: ${boseConfig.branding.colors.dark};">صغير</button>
                        <button class="flex-1 py-3 border rounded-xl font-bold transition-all hover:bg-pink-50" style="border-color: ${boseConfig.branding.colors.pink}; color: ${boseConfig.branding.colors.dark};">وسط</button>
                        <button class="flex-1 py-3 border rounded-xl font-bold transition-all hover:bg-pink-50" style="border-color: ${boseConfig.branding.colors.pink}; color: ${boseConfig.branding.colors.dark};">كبير</button>
                    </div>
                </div>`;
        } else if (product.category === 'الورد') {
            dynamicTabsHtml = `
                <div class="dynamic-tabs my-4">
                    <label class="block text-sm font-bold mb-2" style="color: ${boseConfig.branding.colors.dark};">نوع التنسيق الفاخر:</label>
                    <div class="grid grid-cols-3 gap-2">
                        ${['طبيعي', 'صناعي', 'ستان', 'مع فلوس', 'مع صور', 'مع شيكولاتة'].map(type => `
                            <button class="py-2 border rounded-xl text-xs font-bold transition-all hover:bg-pink-50" style="border-color: ${boseConfig.branding.colors.pink}; color: ${boseConfig.branding.colors.dark};">${type}</button>
                        `).join('')}
                    </div>
                </div>`;
        }
        
        let html = `
            <div class="product-details-wrapper animate-fade-in" style="background: ${boseConfig.branding.colors.white}; border-radius: 2rem; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                
                <div class="p-6 pb-4 text-center border-b border-gray-50">
                    <span class="text-xs font-bold px-4 py-1 rounded-full mb-3 inline-block" style="background: ${boseConfig.branding.colors.pink}15; color: ${boseConfig.branding.colors.pink};">${product.category}</span>
                    <h1 class="text-3xl font-black mb-3 leading-tight" style="color: ${boseConfig.branding.colors.dark};">${product.name}</h1>
                    <div class="text-2xl font-black inline-block px-6 py-2 rounded-xl" style="background: #fafafa; color: ${boseConfig.branding.colors.pink}; border: 1px solid ${boseConfig.branding.colors.pink}20;">${product.price} ج.م</div>
                </div>

                <div class="product-hero-image" style="width: 100%; position: relative;">
                    <img src="${finalImgUrl}" loading="lazy" style="width: 100%; max-height: 65vh; object-fit: contain; background: #fafafa;" alt="${product.name}" onerror="this.onerror=null; this.src='${getImgFallback()}';">
                    <button onclick="window.history.back()" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.2s;"><i data-lucide="arrow-right"></i></button>
                    <button onclick="window.shareProduct('${product.id}', '${product.name}')" style="position: absolute; top: 15px; left: 15px; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.2s;"><i data-lucide="share-2"></i></button>
                </div>

                <div class="product-info-content p-6 pt-6">
                    <div class="bg-gray-50 p-4 rounded-2xl mb-6">
                        <p class="text-base font-bold opacity-90 leading-loose" style="color: ${boseConfig.branding.colors.dark}; text-align: right;">${product.desc || getFinalDescription(product.name, product.category)}</p>
                    </div>
                    
                    ${dynamicTabsHtml}

                    ${isCustomCake ? '<div id="cake-builder-injection"></div>' : ''}
                    
                    <div class="action-bar flex items-center justify-between gap-4 mt-8 pt-6" style="border-top: 1px dashed rgba(0,0,0,0.1);">
                        <div class="qty-controller flex items-center gap-3 bg-gray-50 rounded-full p-1 border" style="border-color: ${boseConfig.branding.colors.pink}30;">
                            <button onclick="window.updateTempQtyContext(this, -1)" class="w-12 h-12 flex items-center justify-center rounded-full font-black text-xl transition-colors hover:bg-pink-100" style="color: ${boseConfig.branding.colors.pink}; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">-</button>
                            <span class="temp-qty-display font-black text-xl px-4" data-prod-id="${product.id}" style="color: ${boseConfig.branding.colors.dark};">1</span>
                            <button onclick="window.updateTempQtyContext(this, 1)" class="w-12 h-12 flex items-center justify-center rounded-full font-black text-xl transition-colors hover:bg-pink-100" style="color: ${boseConfig.branding.colors.pink}; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">+</button>
                        </div>
                        <button onclick="${isCustomCake ? 'window.validateAndCommitCakeBuilder()' : `if(window.cartSystem) window.cartSystem.addWithQtyContext(this, '${product.id}'); else window.addWithQtyContext(this, '${product.id}');`}" class="flex-1 py-4 rounded-full font-black text-white shadow-xl transition-transform hover:scale-105 text-lg flex items-center justify-center gap-2" style="background: linear-gradient(135deg, ${boseConfig.branding.colors.pink}, #ff7b93);">
                            <span>إضافة لطلب حضرتك</span>
                            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        detailsContainer.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
        if (isCustomCake) renderMultiStepCakeBuilder(product.id);

        renderRelatedProducts(product.category, product.id);

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

        const gridLayout = getGridLayoutConfig(currentCategory);
        container.className = `grid ${gridLayout} gap-4`;

        // استدعاء دالة الرسم الموحدة في نفس الملف
        renderProductCards(related, 'related-products-container');
        
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'renderRelatedProducts');
    }
};

export const renderCustomerSidebarCategories = function() {
    try {
        const container = document.getElementById('sidebar-categories-list');
        if (!container) return;

        const cats = BoseState.catMenu || [];
        
        let navButtonsHtml = `
            <div class="mb-6 pb-6 border-b border-gray-100">
                <button onclick="window.location.href='/'; window.toggleCustomerMenu();" class="w-full flex items-center justify-between p-4 mb-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md" style="background: ${boseConfig.branding.colors.pink}10; color: ${boseConfig.branding.colors.pink};">
                    <span>العودة للرئيسية</span>
                    <i data-lucide="home" class="w-5 h-5"></i>
                </button>
                <button onclick="window.history.back(); window.toggleCustomerMenu();" class="w-full flex items-center justify-between p-4 rounded-xl font-bold border transition-all hover:bg-gray-50" style="border-color: #eee; color: ${boseConfig.branding.colors.dark};">
                    <span>الصفحة السابقة</span>
                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </button>
            </div>
            <h4 class="text-sm font-black mb-4 opacity-60 px-2 uppercase tracking-wide">أقسام حلويات بوسي</h4>
        `;

        container.innerHTML = navButtonsHtml + cats.map(cat => `
            <button onclick="window.setCategory('${cat}'); window.toggleCustomerMenu();" class="w-full text-right p-4 mb-3 rounded-xl font-bold text-sm bg-white border border-gray-100 shadow-sm hover:border-pink-200 hover:shadow-md transition-all flex justify-between items-center group" style="color: ${boseConfig.branding.colors.dark};">
                <span>${cat}</span>
                <i data-lucide="chevron-left" class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-pink-500"></i>
            </button>
        `).join('');
        
        if (window.lucide) window.lucide.createIcons();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'renderCustomerSidebarCategories');
    }
};

export const renderCustomerGallery = function() {
    try {
        const container = document.getElementById('customer-gallery-grid');
        if (!container) return;

        if (BoseState.galleryData.length === 0) {
            container.innerHTML = '<p class="text-center w-full font-bold opacity-50 py-10">معرض الصور قيد التجهيز لحضرتك..</p>';
            return;
        }

        container.innerHTML = BoseState.galleryData.map(g => `
            <div class="gallery-item overflow-hidden rounded-2xl aspect-square bg-gray-100 shadow-sm">
                <img src="${(g.url.startsWith('http')) ? g.url : boseConfig.cloudinary.baseDeliveryUrl + g.url}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110 cursor-pointer" loading="lazy" alt="سابقة أعمال حلويات بوسي الفاخرة" onclick="window.openImageModal(this.src)">
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

        if (!BoseState.cakeState) BoseState.cakeState = {};
        BoseState.cakeState.persons = BoseState.cakeState.persons || 4; 
        
        const currentPrice = 580 + ((BoseState.cakeState.persons - 4) * 145);

        const s = BoseState.siteSettings?.cakeBuilder || { flavors: ['فانيليا', 'شيكولاتة', 'ريد فيلفت', 'مكس'] };
        
        let html = `
            <div class="cake-builder-box mt-8 p-6 rounded-3xl border-2 shadow-sm" style="border-color: ${boseConfig.branding.colors.pink}30; background: #fffcfd;">
                <div class="flex items-center justify-between mb-6 border-b pb-4" style="border-color: ${boseConfig.branding.colors.pink}20;">
                    <h3 class="text-xl font-black" style="color: ${boseConfig.branding.colors.dark}; flex-1">صمم تورتتك بنفسك 👑</h3>
                    <div class="text-center bg-white px-5 py-2 rounded-2xl shadow-sm border flex flex-col items-center justify-center" style="border-color: ${boseConfig.branding.colors.pink}40;">
                        <span class="text-xs font-bold opacity-70 mb-1">الإجمالي المبدئي</span>
                        <span id="builder-live-price" class="font-black text-xl" style="color: ${boseConfig.branding.colors.pink}">${currentPrice} ج</span>
                    </div>
                </div>
                
                <div class="builder-step mb-5">
                    <label class="block text-sm font-bold mb-3">1. المقاس (عدد الأفراد)</label>
                    <div class="flex items-center gap-4 bg-white p-3 rounded-2xl border shadow-sm" style="border-color: ${boseConfig.branding.colors.pink}40;">
                        <button onclick="window.adjustBuilderPersons(-2)" class="w-12 h-12 rounded-xl bg-gray-50 font-black text-2xl hover:bg-pink-100 transition-colors flex items-center justify-center shadow-sm" style="color: ${boseConfig.branding.colors.pink};">-</button>
                        <div class="flex-1 text-center">
                            <span id="builder-persons-display" class="font-black text-2xl">${BoseState.cakeState.persons}</span>
                            <span class="text-sm font-bold opacity-70 block mt-1">أفراد</span>
                        </div>
                        <button onclick="window.adjustBuilderPersons(2)" class="w-12 h-12 rounded-xl bg-gray-50 font-black text-2xl hover:bg-pink-100 transition-colors flex items-center justify-center shadow-sm" style="color: ${boseConfig.branding.colors.pink};">+</button>
                    </div>
                </div>

                <div class="builder-step mb-5">
                    <label class="block text-sm font-bold mb-3">2. النكهة الأساسية</label>
                    <select onchange="window.updateCakeBuilderField('flavor', this.value)" class="w-full p-4 rounded-2xl border text-sm font-bold outline-none bg-white shadow-sm focus:border-pink-500 transition-colors" style="border-color: ${boseConfig.branding.colors.pink}40;">
                        ${s.flavors.map(f => `<option value="${f}" ${BoseState.cakeState.flavor === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>

                <div class="builder-step mb-5">
                    <label class="block text-sm font-bold mb-3">3. المناسبة والاهتمامات لتحديد الثيم</label>
                    <input type="text" onchange="window.updateCakeBuilderField('occasion', this.value)" class="w-full p-4 rounded-2xl border text-sm outline-none bg-white placeholder-gray-400 shadow-sm focus:border-pink-500 transition-colors" placeholder="مثال: عيد ميلاد، بيحب الكورة..." style="border-color: ${boseConfig.branding.colors.pink}40;" value="${BoseState.cakeState.occasion || ''}">
                </div>

                <div class="builder-step mb-5">
                    <label class="block text-sm font-bold mb-3">4. رفع صورة للموديل (اختياري)</label>
                    <input type="file" accept="image/*" onchange="window.updateCakeBuilderField('photo', this.files[0])" class="w-full p-3 rounded-2xl border text-sm outline-none bg-white shadow-sm file:mr-4 file:py-2 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition-all cursor-pointer" style="border-color: ${boseConfig.branding.colors.pink}40;">
                </div>

                <div class="builder-step mb-5">
                    <label class="block text-sm font-bold mb-3">5. إضافات الطباعة</label>
                    <select onchange="window.updateCakeBuilderField('printing', this.value)" class="w-full p-4 rounded-2xl border text-sm font-bold outline-none bg-white shadow-sm focus:border-pink-500 transition-colors" style="border-color: ${boseConfig.branding.colors.pink}40;">
                        <option value="بدون" ${BoseState.cakeState.printing === 'بدون' ? 'selected' : ''}>بدون طباعة</option>
                        <option value="صورة قابلة للأكل" ${BoseState.cakeState.printing === 'صورة قابلة للأكل' ? 'selected' : ''}>صورة قابلة للأكل (+60 ج)</option>
                        <option value="صورة زينة" ${BoseState.cakeState.printing === 'صورة زينة' ? 'selected' : ''}>صورة زينة (+20 ج)</option>
                    </select>
                </div>

                <div class="builder-step mb-5">
                    <label class="block text-sm font-bold mb-3 text-red-600 flex justify-between items-center">
                        <span>6. ملاحظات صحية / حساسية</span>
                        <span class="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-black">حقل إلزامي</span>
                    </label>
                    <textarea id="cake-health-notes" onchange="window.updateCakeBuilderField('healthNotes', this.value)" class="w-full p-4 rounded-2xl border-2 text-sm outline-none resize-none bg-white placeholder-red-300 shadow-sm focus:border-red-400 transition-colors" rows="2" placeholder="الرجاء كتابة أي موانع أو حساسية من مكونات معينة لحضرتك، أو كتابة 'لا يوجد'..." style="border-color: #fca5a5;">${BoseState.cakeState.healthNotes || ''}</textarea>
                </div>
                
                <div class="builder-step mb-2">
                    <label class="block text-sm font-bold mb-3">7. اللمسة النهائية (النص المكتوب على التورتة)</label>
                    <textarea onchange="window.updateCakeBuilderField('notes', this.value)" class="w-full p-4 rounded-2xl border text-sm outline-none resize-none bg-white placeholder-gray-400 shadow-sm focus:border-pink-500 transition-colors" rows="2" placeholder="اكتب لحضرتك هنا النص المطلوب بدقة..." style="border-color: ${boseConfig.branding.colors.pink}40;">${BoseState.cakeState.notes || ''}</textarea>
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
        if(field === 'printing') {
             const basePrice = 580 + ((BoseState.cakeState.persons - 4) * 145);
             let extra = 0;
             if(value === 'صورة قابلة للأكل') extra = 60;
             if(value === 'صورة زينة') extra = 20;
             const priceDisplay = document.getElementById('builder-live-price');
             if(priceDisplay) priceDisplay.innerText = (basePrice + extra) + ' ج';
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'updateCakeBuilderField');
    }
};

export const adjustBuilderPersons = function(delta) {
    try {
        BoseState.cakeState.persons += delta;
        if(BoseState.cakeState.persons < 4) BoseState.cakeState.persons = 4; 
        if(BoseState.cakeState.persons > 100) BoseState.cakeState.persons = 100;
        
        const disp = document.getElementById('builder-persons-display');
        const priceDisp = document.getElementById('builder-live-price');
        if(disp) disp.innerText = BoseState.cakeState.persons;
        
        if(priceDisp) {
            let basePrice = 580 + ((BoseState.cakeState.persons - 4) * 145);
            let extra = 0;
            if(BoseState.cakeState.printing === 'صورة قابلة للأكل') extra = 60;
            if(BoseState.cakeState.printing === 'صورة زينة') extra = 20;
            priceDisp.innerText = (basePrice + extra) + ' ج';
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'adjustBuilderPersons');
    }
};

export const validateAndCommitCakeBuilder = function() {
    try {
        const notes = BoseState.cakeState.healthNotes || '';
        if (!notes.trim()) {
            if(typeof window.showSystemToast === 'function') {
                window.showSystemToast("القرار المهني يقتضي التأكد من سلامتكم أولاً. يرجى ملء حقل الملاحظات الصحية لحضرتكم.", "error");
            }
            const noteInput = document.getElementById('cake-health-notes');
            if(noteInput) {
                noteInput.style.borderColor = "red";
                noteInput.focus();
                setTimeout(() => noteInput.style.borderColor = "#fca5a5", 3000);
            }
            return;
        }
        
        if (window.cartSystem && typeof window.cartSystem.commitCakeBuilderToCart === 'function') {
            window.cartSystem.commitCakeBuilderToCart();
        } else if (typeof window.commitCakeBuilderToCart === 'function') {
            window.commitCakeBuilderToCart();
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'validateAndCommitCakeBuilder');
    }
};


// ============================================================================
// 🛒 القسم الرابع: هندسة السلة وإتمام الطلب (Cart & Checkout Logic)
// ============================================================================

export const renderCheckoutForm = function() {
    try {
        const container = document.getElementById('checkout-form-container');
        if (!container) return;

        const today = new Date().toISOString().split('T')[0];

        const html = `
            <div class="checkout-wrapper bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-6">
                <h3 class="text-2xl font-black mb-8 border-b pb-4" style="color: ${boseConfig.branding.colors.dark}; border-color: ${boseConfig.branding.colors.pink}20;">بيانات الاستلام والتواصل</h3>
                
                <div class="mb-5">
                    <label class="block text-sm font-bold mb-3 text-gray-700">الاسم الكريم</label>
                    <input type="text" id="checkout-name" class="w-full p-4 rounded-xl border-2 outline-none bg-gray-50 focus:bg-white focus:border-pink-400 transition-all text-base">
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                        <label class="block text-sm font-bold mb-3 text-gray-700">رقم التواصل الأساسي</label>
                        <input type="tel" id="checkout-phone1" class="w-full p-4 rounded-xl border-2 outline-none bg-gray-50 focus:bg-white focus:border-pink-400 transition-all text-base" placeholder="01...">
                    </div>
                    <div>
                        <label class="block text-sm font-bold mb-3 text-gray-700">رقم تواصل بديل</label>
                        <input type="tel" id="checkout-phone2" class="w-full p-4 rounded-xl border-2 outline-none bg-gray-50 focus:bg-white focus:border-pink-400 transition-all text-base" placeholder="01...">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div>
                        <label class="block text-sm font-bold mb-3 text-gray-700">تاريخ الاستلام</label>
                        <input type="date" id="checkout-date" min="${today}" class="w-full p-4 rounded-xl border-2 outline-none bg-gray-50 focus:bg-white focus:border-pink-400 transition-all text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-bold mb-3 text-gray-700">وقت الاستلام المفضل</label>
                        <input type="time" id="checkout-time" class="w-full p-4 rounded-xl border-2 outline-none bg-gray-50 focus:bg-white focus:border-pink-400 transition-all text-base">
                    </div>
                </div>

                <div class="mb-6 border-t pt-8" style="border-color: ${boseConfig.branding.colors.pink}20;">
                    <label class="block text-base font-black mb-5 text-center text-gray-800">طريقة الاستلام المفضلة لحضرتك:</label>
                    <div class="flex gap-4">
                        <label class="flex-1 cursor-pointer">
                            <input type="radio" name="delivery_type" value="pickup" checked onchange="window.toggleDeliveryOptions(this.value)" class="hidden peer">
                            <div class="p-5 border-2 rounded-2xl text-center font-black peer-checked:bg-pink-50 peer-checked:shadow-md transition-all flex flex-col items-center gap-2" style="border-color: ${boseConfig.branding.colors.pink}; color: ${boseConfig.branding.colors.dark};">
                                <i data-lucide="store" class="w-6 h-6 text-pink-500"></i>
                                استلام من المقر
                            </div>
                        </label>
                        <label class="flex-1 cursor-pointer">
                            <input type="radio" name="delivery_type" value="delivery" onchange="window.toggleDeliveryOptions(this.value)" class="hidden peer">
                            <div class="p-5 border-2 border-gray-200 rounded-2xl text-center font-black peer-checked:border-pink-400 peer-checked:bg-pink-50 peer-checked:shadow-md transition-all flex flex-col items-center gap-2 text-gray-500 peer-checked:text-gray-900">
                                <i data-lucide="truck" class="w-6 h-6"></i>
                                توصيل للمنزل
                            </div>
                        </label>
                    </div>
                </div>

                <div id="pickup-details" class="p-6 bg-gray-50 rounded-2xl mb-4 border border-gray-200 shadow-inner">
                    <p class="text-base font-black mb-3 text-gray-800 flex items-center gap-2"><i data-lucide="map-pin" class="w-5 h-5 text-pink-500"></i> عنوان الاستلام:</p>
                    <p class="text-sm font-bold text-gray-600 leading-loose mb-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        الكفاح - شارع الوحدة المحلية - بجوار صيدلية د. أحمد مجدي وعيادة د. علي.
                    </p>
                    <div class="w-full h-32 bg-gray-200 rounded-xl overflow-hidden relative flex items-center justify-center border border-gray-300 shadow-sm">
                        <a href="https://maps.google.com/?q=الكفاح،+شارع+الوحدة+المحلية" target="_blank" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors group">
                            <i data-lucide="map" class="w-8 h-8 text-pink-500 mb-2 group-hover:scale-110 transition-transform"></i>
                            <span class="text-xs font-bold text-gray-700">اضغط لفتح خريطة جوجل التفاعلية</span>
                        </a>
                    </div>
                </div>

                <div id="delivery-details" class="hidden mb-4 p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner animate-fade-in">
                    <div class="mb-5">
                        <label class="block text-sm font-bold mb-3 text-gray-700">العنوان بالتفصيل</label>
                        <textarea id="checkout-address" class="w-full p-4 rounded-xl border-2 outline-none bg-white resize-none focus:border-pink-400 transition-colors shadow-sm" rows="3" placeholder="المحافظة، المدينة، الشارع، رقم العمارة..."></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-bold mb-3 text-gray-700">أقرب معلم واضح (لتسهيل التوصيل)</label>
                        <input type="text" id="checkout-landmark" class="w-full p-4 rounded-xl border-2 outline-none bg-white focus:border-pink-400 transition-colors shadow-sm" placeholder="بجوار مدرسة، مسجد، صيدلية...">
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        if(window.lucide) lucide.createIcons();

    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'renderCheckoutForm');
    }
};

export const toggleDeliveryOptions = function(type) {
    const pickup = document.getElementById('pickup-details');
    const delivery = document.getElementById('delivery-details');
    if(type === 'pickup') {
        if(pickup) pickup.classList.remove('hidden');
        if(delivery) delivery.classList.add('hidden');
    } else {
        if(pickup) pickup.classList.add('hidden');
        if(delivery) delivery.classList.remove('hidden');
    }
};

// ============================================================================
// 👑 القسم الخامس: التفاعلات والعمليات المنطقية (UI Interactions)
// ============================================================================

export const updateTempQtyContext = function(btnElement, delta) {
    try {
        const displaySpan = btnElement.parentElement.querySelector('.temp-qty-display');
        if (!displaySpan) return;

        let currentQty = parseInt(displaySpan.innerText) || 1;
        currentQty += delta;

        if (currentQty < 1) currentQty = 1;
        if (currentQty > 50) {
            if(typeof window.showSystemToast === 'function') window.showSystemToast("الكمية المطلوبة كبيرة، سيتم التنسيق مع إدارة حلويات بوسي لتأكيد التوافر لحضرتك.", "info");
            currentQty = 50;
        }
        displaySpan.innerText = currentQty;
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'updateTempQtyContext');
    }
};

/**
 * 👑 محرك تشغيل القائمة الجانبية
 * التعديل الهندسي (V30.3): إحلال نظام Tailwind المتغير والاعتماد الكامل على الكلاس السيادي (.active).
 */
export const toggleCustomerMenu = function() {
    try {
        const menu = document.getElementById('side-menu') || document.getElementById('mobile-sidebar-menu');
        const overlay = document.getElementById('menu-overlay') || document.getElementById('mobile-sidebar-overlay');
        
        // صمام الأمان: التأكد من وجود العناصر قبل التعديل عليها
        if (!menu || !overlay) {
            console.warn("👑 UI Engine: الحاويات الجانبية غير متوفرة في الـ DOM حالياً.");
            return;
        }

        // الاعتماد الكلي على الكلاس (.active) المبرمج في style.css
        if (menu.classList.contains('active')) {
            // إغلاق القائمة
            menu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            // فتح القائمة
            menu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            renderCustomerSidebarCategories();
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
                text: `اكتشف إبداع ${productName} من حلويات بوسي، طعم يليق بحضرتك!`,
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

export const showSystemToast = function(message, type = 'info') {
    try {
        let toast = document.getElementById('system-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'system-toast';
            toast.className = 'fixed bottom-5 left-1/2 transform -translate-x-1/2 z-[9999] hidden flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300';
            toast.style.background = '#ffffff';
            toast.style.border = `2px solid ${boseConfig.branding.colors.pink}30`;
            toast.innerHTML = `
                <i id="toast-icon" class="w-5 h-5 shrink-0" style="color: ${boseConfig.branding.colors.pink};"></i>
                <span id="toast-message" class="font-bold text-sm" style="color: ${boseConfig.branding.colors.dark};"></span>
            `;
            document.body.appendChild(toast);
        }

        const msgEl = document.getElementById('toast-message');
        const iconEl = document.getElementById('toast-icon');
        
        msgEl.textContent = message;
        
        if (type === 'success') {
            iconEl.setAttribute('data-lucide', 'check-circle');
            iconEl.style.color = '#2e7d32'; 
        } else if (type === 'error') {
            iconEl.setAttribute('data-lucide', 'alert-circle');
            iconEl.style.color = '#d32f2f'; 
        } else {
            iconEl.setAttribute('data-lucide', 'info');
            iconEl.style.color = boseConfig.branding.colors.pink;
        }

        if (window.lucide) window.lucide.createIcons();
        toast.classList.remove('hidden', 'translate-y-10', 'opacity-0');
        
        if (window.toastTimeout) clearTimeout(window.toastTimeout);
        window.toastTimeout = setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);

    } catch (error) {
        console.error("خطأ في عرض الإشعار السيادي:", error);
    }
};

// ============================================================================
// 🎬 القسم السادس: السلايدر الديناميكي والعروض المرئية (Dynamic Presentation)
// ============================================================================

export function initMasterySlider() {
    try {
        const sliderContainer = document.getElementById('mastery-slider-container');
        if (!sliderContainer) return;

        const masteryImages = BoseState.galleryData.slice(0, 5).map(g => (g.url.startsWith('http') ? g.url : boseConfig.cloudinary.baseDeliveryUrl + g.url));
        if(masteryImages.length === 0) masteryImages.push(BOSE_LOGO_FALLBACK);

        let currentIndex = 0;

        const changeSlide = () => {
            sliderContainer.style.opacity = 0;
            setTimeout(() => {
                sliderContainer.innerHTML = `<img src="${masteryImages[currentIndex]}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" alt="إبداعات حلويات بوسي">`;
                sliderContainer.style.opacity = 1;
                currentIndex = (currentIndex + 1) % masteryImages.length;
            }, 500); 
        };

        sliderContainer.style.transition = 'opacity 0.5s ease-in-out';
        changeSlide();
        
        setInterval(changeSlide, 10000);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'initMasterySlider');
    }
}

export function initDynamicSections() {
    try {
        distributeProductsToUI(BoseState.catalog);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'initDynamicSections');
    }
}

// ============================================================================
// 🔗 القسم السابع: الربط السيادي بنطاق النافذة (Global Window Bindings)
// ============================================================================

if (typeof window !== 'undefined') {
    try {
        window.getImgFallback = getImgFallback;
        window.showInfo = showInfo;
        window.getFinalDescription = getFinalDescription;
        window.applySettingsToUI = applySettingsToUI;
        window.renderTicker = renderTicker;
        window.renderProductCards = renderProductCards;
        window.distributeProductsToUI = distributeProductsToUI;
        window.getGridLayoutConfig = getGridLayoutConfig;
        window.showProductDetails = showProductDetails;
        window.navigateToProduct = navigateToProduct;
        window.renderRelatedProducts = renderRelatedProducts;
        window.renderMultiStepCakeBuilder = renderMultiStepCakeBuilder;
        window.updateCakeBuilderField = updateCakeBuilderField;
        window.adjustBuilderPersons = adjustBuilderPersons;
        window.validateAndCommitCakeBuilder = validateAndCommitCakeBuilder;
        window.renderCustomerSidebarCategories = renderCustomerSidebarCategories;
        window.renderCustomerGallery = renderCustomerGallery;
        window.renderCheckoutForm = renderCheckoutForm;
        window.toggleDeliveryOptions = toggleDeliveryOptions;
        window.updateTempQtyContext = updateTempQtyContext;
        window.toggleCustomerMenu = toggleCustomerMenu;
        window.shareProduct = shareProduct;
        window.showSystemToast = showSystemToast;
        window.initMasterySlider = initMasterySlider;
        window.initDynamicSections = initDynamicSections;
        
        console.log("👑 BoseSweets Engine: تم تفعيل المحرك البصري السيادي المحدث (UI Logic V30.3) بنجاح.");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-logic.js', null, null, 'Final Global Bindings');
    }
}