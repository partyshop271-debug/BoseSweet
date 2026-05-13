/**
 * 👑 BoseSweets UI Builders & Details (V24.5 - Sovereign Monitor Edition)
 * بناة المحتوى المتطور والعرض التفصيلي - إدارة حلويات بوسي
 * تم التحصين الشامل: تصحيح مسار حقن الصفحات (DOM Injection) لتجنب كسر واجهة الفوتر.
 * 🛡️ التحديث الأمني: زراعة مستشعر BoseMonitor لمراقبة استقرار بناء الواجهات وتجربة المستخدم.
 */

import { siteSettings, catalog, state, cakeState, galleryData, catMenu } from './state.js';
import { escapeHTML, optimizeCloudinaryUrl } from './utils.js';

// 👑 بناء صفحة تفاصيل المنتج (Sovereign Architecture - Protected Injection)
export const showProductDetails = function(productId) {
    try {
        const safeId = String(productId);
        const product = (window.catalogMap && typeof window.catalogMap.get === 'function') 
                        ? window.catalogMap.get(safeId) 
                        : catalog.find(p => String(p.id) === safeId);
        
        if (!product) {
            if(typeof window.showSystemToast === 'function') window.showSystemToast('نأسف لحضرتك، بيانات هذا المنتج قيد التحديث.', 'error');
            if(window.BoseMonitor) window.BoseMonitor.report("Product not found in catalog", 'ui-builders.js', null, null, `showProductDetails ID: ${productId}`);
            return;
        }

        // تسجيل اهتمامات العميل لتحسين الترشيحات مستقبلاً
        try {
            let userPrefs = JSON.parse(localStorage.getItem('bose_user_prefs')) || {};
            userPrefs[product.category] = (userPrefs[product.category] || 0) + 1;
            localStorage.setItem('bose_user_prefs', JSON.stringify(userPrefs));
        } catch(e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'ui-builders.js', null, null, 'showProductDetails - userPrefs Log');
        }

        // 👑 تصحيح مسار الإضافة: الاعتماد على حاوية المحتوى الرئيسية لعدم فصل الفوتر
        const mainContentArea = document.getElementById('main-content') || document.querySelector('main') || document.body;
        let vProd = document.getElementById('view-product-details');
        
        if (!vProd) {
            vProd = document.createElement('div');
            vProd.id = 'view-product-details';
            vProd.className = 'w-full flex flex-col gap-8 overflow-x-hidden content-padding-top pb-24 animate-fade-in';
            mainContentArea.appendChild(vProd); // الحقن الآمن داخل الحاوية وليس في النهاية
        }

        // الإخفاء القاطع للواجهات الأخرى لضمان التركيز البصري
        const otherViews = ['view-home', 'view-menu', 'view-tips', 'view-cake-builder', 'home-view', 'menu-view'];
        otherViews.forEach(id => {
            const el = document.getElementById(id);
            if(el) { 
                el.classList.add('hidden'); 
                el.style.display = 'none'; 
                el.style.opacity = '0'; 
            }
        });
        
        vProd.classList.remove('hidden');
        vProd.style.display = 'block';
        vProd.style.opacity = '1';

        const isOutOfStock = product.inStock === false || product.isActive === false;
        
        const defaultFallbackImage = (siteSettings && siteSettings.brandLogo) ? siteSettings.brandLogo : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
        let rawImageUrl = defaultFallbackImage;
        if (product.images && product.images.length > 0 && product.images[0]) rawImageUrl = product.images[0];
        else if (product.img) rawImageUrl = product.img;
        else if (typeof window.getImgFallback === 'function') rawImageUrl = window.getImgFallback(product.category) || defaultFallbackImage;
        
        const imageUrl = optimizeCloudinaryUrl(rawImageUrl);

        let imagesGalleryHtml = '';
        if (product.images && product.images.length > 1) {
            imagesGalleryHtml = `<div class="flex gap-2 mt-4 overflow-x-auto hide-scrollbar pb-2">
                ${product.images.map(img => `<img src="${optimizeCloudinaryUrl(img)}" onclick="document.getElementById('main-prod-img-${product.id}').src='${optimizeCloudinaryUrl(img)}'" class="w-16 h-16 rounded-xl object-cover border-2 border-[var(--brand-primary)] cursor-pointer hover:opacity-80 transition-opacity">`).join('')}
            </div>`;
        }

        const getDescFunc = window.getFinalDescription || function(p) { return escapeHTML(p.desc || ''); };
        const finalDesc = getDescFunc(product);

        // 👑 بناء الهيكل الموحد مع التقييمات والترشيحات ككتلة صلبة واحدة
        vProd.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-8 pb-20 px-4 w-full">
                <button onclick="window.showMenuView()" class="flex items-center gap-2 text-[var(--site-text)] opacity-70 hover:opacity-100 hover:text-[var(--brand-primary)] font-bold transition-colors bg-[#ffffff] border-2 border-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)] px-4 py-2 rounded-xl shadow-sm w-fit">
                    <i data-lucide="arrow-right" class="w-5 h-5"></i> العودة للمنيو
                </button>
                <div class="text-center space-y-4">
                    <h1 class="text-3xl md:text-4xl font-black text-[var(--brand-primary)] tracking-tight">${escapeHTML(product.name)}</h1>
                    ${finalDesc ? `<p class="text-sm md:text-base text-[var(--site-text)] font-bold leading-relaxed max-w-2xl mx-auto">${finalDesc}</p>` : ''}
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
                
                <!-- 👑 قسم المراجعات المدمج -->
                <div id="product-reviews-section-internal" class="pt-8 mb-12 border-t-2 border-[var(--brand-primary)]/20">
                    <h3 class="text-xl font-black text-[var(--site-text)] mb-6 flex items-center gap-2 border-b-2 border-[var(--brand-primary)]/20 pb-3"><i data-lucide="star" class="w-6 h-6 text-amber-400"></i> آراء عملاء حلويات بوسي</h3>
                    <div id="reviews-list-${product.id}" class="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[50px]">
                        <p class="text-xs text-[var(--site-text)] font-bold text-center py-4 w-full col-span-full">جاري استدعاء التقييمات المعتمدة...</p>
                    </div>
                    <div class="mt-6 bg-[#ffffff] p-6 rounded-[2rem] border-2 border-[var(--brand-primary)] shadow-sm">
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

                <!-- 👑 قسم الترشيحات المدمج -->
                <div id="product-related-section-internal" class="pt-8 border-t-2 border-[var(--brand-primary)]/20">
                    <h3 class="text-xl font-black text-[var(--site-text)] mb-6 flex items-center gap-2"><i data-lucide="sparkles" class="w-6 h-6 text-[var(--brand-primary)]"></i> تشكيلات قد تنال إعجاب حضرتك</h3>
                    <div id="product-related-container-internal" class="grid grid-cols-2 md:grid-cols-4 gap-4 hide-scrollbar pb-4"></div>
                </div>
            </div>`;

        if(window.lucide) window.lucide.createIcons();
        
        // استدعاء الدوال لملء الحاويات الداخلية المحصنة
        if (window.loadLiveReviews) window.loadLiveReviews(product.id);
        if (window.renderRelatedProducts) window.renderRelatedProducts(product.category, product.id, 'product-related-container-internal');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'showProductDetails - Master Failure');
    }
};
window.showProductDetails = showProductDetails;
export const navigateToProduct = window.showProductDetails;
window.navigateToProduct = navigateToProduct;

// 👑 محرك التوصيات المرتبطة (تم تأمينه للعمل مع الحاويات الديناميكية)
export const renderRelatedProducts = function(category, currentId, targetContainerId = 'related-products-container') {
    try {
        const container = document.getElementById(targetContainerId);
        if (!container) return;
        
        const related = window.catalog.filter(p => p.category === category && String(p.id) !== String(currentId) && p.isActive !== false).slice(0, 4);
        
        if (related.length === 0) {
            container.innerHTML = '<p class="text-sm text-[var(--site-text)] font-bold col-span-full text-center py-4 bg-[#ffffff] rounded-2xl border-2 border-dashed border-[var(--brand-primary)]">لا توجد ترشيحات إضافية حالياً في هذا القسم.</p>';
            return;
        }
        
        container.innerHTML = related.map(item => {
            const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : (item.img || (typeof window.getImgFallback === 'function' ? window.getImgFallback(item.category) : ''));
            const safeUrl = window.optimizeCloudinaryUrl ? window.optimizeCloudinaryUrl(imgUrl) : imgUrl;
            return `
                <div class="bg-[#ffffff] rounded-2xl border-2 border-[var(--brand-primary)]/20 overflow-hidden cursor-pointer hover:border-[var(--brand-primary)] hover:-translate-y-1 transition-all btn-interactive group shadow-sm" onclick="window.navigateToProduct('${item.id}')">
                    <div class="w-full h-32 overflow-hidden bg-[#ffffff] p-1"><img src="${safeUrl}" class="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500" alt="${window.escapeHTML(item.name)}"></div>
                    <div class="p-3 text-center border-t-2 border-[var(--brand-primary)]/10">
                        <h4 class="text-xs font-black text-[var(--site-text)] truncate mb-1">${window.escapeHTML(item.name)}</h4>
                        <p class="text-sm font-black text-[var(--brand-primary)]">${Number(item.price)} ج.م</p>
                    </div>
                </div>`;
        }).join('');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'renderRelatedProducts');
    }
};
window.renderRelatedProducts = renderRelatedProducts;

// 👑 مصمم التورتات المتعدد الخطوات (Sovereign Multi-Step Builder)
export const renderMultiStepCakeBuilder = function() {
    try {
        const wrapper = document.getElementById('cake-builder-steps-wrapper');
        if (!wrapper) return;
        
        const basePrice = (siteSettings.cakeBuilder && siteSettings.cakeBuilder.basePrice) ? siteSettings.cakeBuilder.basePrice : 145;
        let printingPrice = 0;
        if (cakeState.printing === 'صورة قابلة للأكل') printingPrice = (siteSettings.cakeBuilder && siteSettings.cakeBuilder.imagePrintingPrice) ? siteSettings.cakeBuilder.imagePrintingPrice : 60;
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
                            ${((siteSettings.cakeBuilder && siteSettings.cakeBuilder.flavors) || ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت']).map(fl => `
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
                            <button onclick="window.updateCakeBuilderField('printing', 'صورة قابلة للأكل')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.printing === 'صورة قابلة للأكل' ? 'bg-[var(--brand-primary)] text-[#ffffff] border-[var(--brand-primary)] shadow-md transform scale-105' : 'bg-[#ffffff] border-[var(--brand-primary)] text-[var(--site-text)] hover:bg-[var(--brand-primary)] hover:text-[#ffffff]'}">صورة قابلة للأكل (+${(siteSettings.cakeBuilder && siteSettings.cakeBuilder.imagePrintingPrice) ? siteSettings.cakeBuilder.imagePrintingPrice : 60} ج)</button>
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
                            <p class="text-[11px] font-bold text-[var(--site-text)] mt-3">يتم إرفاق نسخة مصغرة لتأكيد الطلب. للإدارة الحق في طلب الصورة الأصلية عبر الواتساب لضمان دقة التنفيذ.</p>
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
                        <textarea rows="3" oninput="cakeState.notes = this.value" class="w-full p-4 bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-xl font-bold text-[var(--site-text)] text-sm focus:outline-none resize-none" placeholder="الاسم للكتابة، السن، الألوان المفضلة...">${escapeHTML(cakeState.notes)}</textarea>
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
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'renderMultiStepCakeBuilder');
    }
};
window.renderMultiStepCakeBuilder = renderMultiStepCakeBuilder;

export const changeBuilderStep = function(delta) {
    try {
        window.currentBuilderStep += delta;
        if (window.currentBuilderStep < 1) window.currentBuilderStep = 1;
        if (window.currentBuilderStep > 3) window.currentBuilderStep = 3;
        window.renderMultiStepCakeBuilder();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'changeBuilderStep');
    }
};
window.changeBuilderStep = changeBuilderStep;

export const updateCakeBuilderField = function(field, value) {
    try {
        cakeState[field] = value;
        if (field === 'shape') {
            if (value === 'مربع' && cakeState.persons < 16) cakeState.persons = 16;
            else if (value === 'مستطيل' && cakeState.persons < 20) cakeState.persons = 20;
            else if (value === 'دائري' && cakeState.persons < 4) cakeState.persons = 4;
        }
        window.renderMultiStepCakeBuilder();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'updateCakeBuilderField');
    }
};
window.updateCakeBuilderField = updateCakeBuilderField;

export const adjustBuilderPersons = function(delta) {
    try {
        let newPersons = cakeState.persons + delta;
        let limit = 4;
        if (cakeState.shape === 'مربع') limit = 16;
        if (cakeState.shape === 'مستطيل') limit = 20;
        if (newPersons < limit) newPersons = limit;
        if (newPersons > 100) newPersons = 100;
        cakeState.persons = newPersons;
        window.renderMultiStepCakeBuilder();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'adjustBuilderPersons');
    }
};
window.adjustBuilderPersons = adjustBuilderPersons;

// 👑 عرض قائمة المنتجات في السلة (Sovereign Cart View)
export const renderCartList = function() {
    try {
        const container = document.getElementById('cart-items-list') || document.getElementById('cart-items-container'); 
        const totalDisplay = document.getElementById('cart-total-display') || document.getElementById('cart-total-price-display');
        const badge = document.getElementById('cart-badge-count') || document.getElementById('cart-count-badge');
        
        if (badge) {
            const totalItemsCount = state.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            if (totalItemsCount > 0) { 
                badge.innerText = totalItemsCount; 
                badge.classList.remove('hidden'); 
            } else { 
                badge.classList.add('hidden'); 
            }
        }
        
        if (!container) return;
        
        if (state.cart.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center py-20 px-6 text-center bg-[#ffffff] rounded-[2.5rem] border-2 border-dashed border-[var(--brand-primary)]">
                    <i data-lucide="shopping-bag" class="w-16 h-16 mb-6 text-[var(--brand-primary)]"></i>
                    <h3 class="font-black text-2xl text-[var(--site-text)] mb-4">السلة فارغة حالياً.</h3>
                    <button onclick="window.showMenuView ? window.showMenuView() : (window.toggleCart && window.toggleCart(false))" class="text-[#ffffff] px-10 py-4 rounded-full font-black text-lg bg-[var(--brand-primary)] border-2 border-[var(--brand-primary)] hover:bg-[#ffffff] hover:text-[var(--brand-primary)] btn-premium-action">استكشف المنيو</button>
                </div>`;
            if (totalDisplay) totalDisplay.innerText = "0 ج.م"; 
            if (window.lucide) lucide.createIcons(); 
            return;
        }
        
        let total = 0;
        container.innerHTML = state.cart.map(item => {
            const identifier = item.cartItemId || item.id; 
            const q = Number(item.quantity || 0); 
            const p = Number(item.price || 0); 
            total += (p * q);
            
            const rawImageUrl = (item.images && item.images.length > 0) ? item.images[0] : (item.img || (typeof window.getImgFallback === 'function' ? window.getImgFallback(item.category) : ''));
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
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'renderCartList');
    }
};
window.renderCartList = renderCartList;

// 👑 عرض الترشيحات الذكية (Sovereign Smart Suggestions)
export const renderSmartSuggestions = function(context = 'main') {
    try {
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
        if (availableProducts.length === 0) { parentArea.classList.add('hidden'); return; }
        
        parentArea.classList.remove('hidden');
        parentArea.style.display = 'block';

        let userPrefs = {};
        try { userPrefs = JSON.parse(localStorage.getItem('bose_user_prefs')) || {}; } catch(e) {}
        const sortedProducts = availableProducts.sort((a, b) => { 
            return (userPrefs[b.category] || 0) - (userPrefs[a.category] || 0) + (0.5 - Math.random()); 
        });
        const suggestions = sortedProducts.slice(0, context === 'cart' ? 4 : 8);

        container.innerHTML = suggestions.map(p => {
            const rawImageUrl = (p.images && p.images.length > 0) ? p.images[0] : (p.img || (typeof window.getImgFallback === 'function' ? window.getImgFallback(p.category) : ''));
            const img = optimizeCloudinaryUrl(rawImageUrl);
            return `
                <div class="shrink-0 w-[240px] snap-slide bg-[#ffffff] border-2 border-[var(--brand-primary)] rounded-[2rem] p-4 shadow-sm flex flex-col group hover:-translate-y-2 transition-transform cursor-pointer" onclick="window.navigateToProduct('${p.id}')">
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
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'renderSmartSuggestions');
    }
};
window.renderSmartSuggestions = renderSmartSuggestions;

export const renderCustomerSidebarCategories = function() {
    try {
        const container = document.getElementById('sidebar-categories');
        if(!container) return;
        container.innerHTML = catMenu.map(c => `
            <button onclick="window.toggleCustomerMenu ? window.toggleCustomerMenu(false) : null; window.setCategory('${c.name || c}')" class="text-right w-full p-3 rounded-xl font-bold text-sm transition-all hover:bg-[#ffffff] flex items-center justify-between" style="border: 2px solid var(--brand-primary); color: var(--site-text);">
                <span>${c.name === 'ورد' || c === 'ورد' ? 'ورد وهدايا 💐' : (c.name === 'تورت' || c === 'تورت' ? 'تورت وتصميم 🎂' : (c.name || c))}</span>
                <i data-lucide="chevron-left" class="w-4 h-4 opacity-50"></i>
            </button>`).join('');
        if(window.lucide) lucide.createIcons();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'renderCustomerSidebarCategories');
    }
};
window.renderCustomerSidebarCategories = renderCustomerSidebarCategories;

export const renderCustomerGallery = function() {
    try {
        const sec = document.getElementById('gallery-customer-section'); 
        const slider = document.getElementById('gallery-slider');
        if(!sec || !slider) return;
        
        if (!galleryData || galleryData.length === 0) { 
            sec.classList.add('hidden'); 
            return; 
        }
        
        sec.classList.remove('hidden');
        slider.innerHTML = galleryData.map(g => `
            <div class="shrink-0 cursor-pointer hover:scale-105 transition-transform" onclick="window.openGlobalLightbox('${optimizeCloudinaryUrl(g.url)}')">
                <div class="w-32 h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-sm border-2 border-[var(--brand-primary)]">
                    <img src="${optimizeCloudinaryUrl(g.url)}" class="w-full h-full object-cover" loading="lazy" alt="سابقة أعمال حلويات بوسي" onerror="this.onerror=null; this.src=window.getImgFallback('سابقة أعمال');">
                </div>
            </div>`).join('');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'renderCustomerGallery');
    }
};
window.renderCustomerGallery = renderCustomerGallery;

/**
 * 👑 الربط السيادي بنطاق النافذة (Sovereign Global Bindings)
 */
if (typeof window !== 'undefined') {
    try {
        window.showProductDetails = showProductDetails;
        window.navigateToProduct = navigateToProduct;
        window.renderRelatedProducts = renderRelatedProducts;
        window.renderMultiStepCakeBuilder = renderMultiStepCakeBuilder;
        window.changeBuilderStep = changeBuilderStep;
        window.updateCakeBuilderField = updateCakeBuilderField;
        window.adjustBuilderPersons = adjustBuilderPersons;
        window.renderCartList = renderCartList;
        window.renderSmartSuggestions = renderSmartSuggestions;
        window.renderCustomerSidebarCategories = renderCustomerSidebarCategories;
        window.renderCustomerGallery = renderCustomerGallery;
        
        console.log("👑 BoseSweets Engine: UI Builders finalized with Sovereign Monitoring.");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'ui-builders.js', null, null, 'Final Window Bindings Failure');
    }
}