/**
 * ============================================================================
 * 👑 BoseSweets Sovereign UI Engine | محرك الواجهة البصرية السيادي لعلامة حلويات بوسي
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي التجاريّة (The Management)
 * الهوية البصرية Mعتمدة: الوردي الفاخر (#ff91a4) | الأبيض النقي | النصوص الشوكولاتية
 * الترقية: V42.1 Ultra Premium - التوافق التام والأداء المتزن مع النواة الأساسية
 * الحالة: التحكم الكامل في الهيكل البصري، التنفس، الراحة البصرية، السلايدرات المتصلة، وتوزيع الأقسام السيادية.
 * ============================================================================
 */

const BOSE_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg";

// دالة داخلية لتسوية النصوص العربية لضمان المطابقة الكاملة للأقسام والأصناف الفاخرة
function normalizeArabicText(text) {
    if (!text) return '';
    return text.toString()
        .replace(/[أإآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[ًٌٍَُِّ]/g, '') 
        .trim();
}

// ============================================================================
// 🎨 القسم الثامن: واجهة المستخدم والتحكم البصري والرسم الهندسي (UI Logic)
// ============================================================================

export function renderProductCardsUI(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(products)) return;

    const boseConfig = window.boseConfig;
    const processBoseImage = window.processBoseImage || ((img) => img || '');
    const BoseState = window.BoseState;

    // رصد حاويات السلايدر الأفقي لضبط هندستها المستقلة من أجل التنفس والراحة البصرية
    const isSliderContainer = container.classList.contains('bose-horizontal-slider') || 
                              container.classList.contains('snap-x') || 
                              [
                                'dynamic-new-arrivals',
                                'dynamic-best-sellers',
                                'dynamic-categories-container',
                                'best-sellers-slider-container',
                                'arrival-section-container'
                              ].includes(container.id);

    const sectionTitle = container.dataset.sectionTitle || '';
    const currentLayoutBlock = BoseState?.theme?.builderLayout?.find(b => (b.containerId && b.containerId === containerId) || (b.title && b.title === sectionTitle));
    const defaultWidth = currentLayoutBlock?.cardWidth || 280;
    const defaultHeight = currentLayoutBlock?.cardHeight || 350;

    // دمج ميزة التحقق من خلو القسم لمنع الاختفاء بصرياً مع الحفاظ على الأقسام كاملة
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-12 px-4 text-center w-full">
                <div class="inline-flex items-center justify-center w-12 h-12 bg-[#fff5f6] text-[#ff91a4] rounded-full mb-3">
                    <i class="fa-solid fa-cookie-bite text-lg"></i>
                </div>
                <h3 class="text-sm font-bold text-[#3d241c] mb-1">الأصناف الفاخرة قيد التجهيز</h3>
                <p class="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    نقوم الآن بتحضير وتحديث هذه القائمة الطازجة من أجلك.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(p => {
        const img = processBoseImage(p.img || p.image) || BOSE_LOGO_FALLBACK;
        const name = p.name || 'منتج حلويات بوسي';
        const category = p.category || 'صنف فاخر';
        const description = p.description || p.desc || 'نهتم بأدق التفاصيل لنقدم لكم تجربة تذوق استثنائية تعكس الجودة المطلقة لمنتجاتنا المخبوزة طازجاً.';
        const price = p.price || 'يحدد عند الطلب';
        const isOut = p.inStock === false || p.stock === 0;

        let customWidth = p.cardWidth || defaultWidth;
        let customHeight = p.cardHeight || defaultHeight;
        
        const categoryNormalized = p.category ? normalizeArabicText(p.category) : '';
        const nameNormalized = p.name ? normalizeArabicText(p.name) : '';

        // التحقق من الأصناف لتحديد طريقة العرض في الشبكة (كارتين جنب بعض للمنتجات العادية، أو عرض كامل للتورت)
        const isDonutOrCinnabon = categoryNormalized.includes('دوناتس') || 
                                  categoryNormalized.includes('سينابون') || 
                                  categoryNormalized.includes('ديسباسيتو') || 
                                  categoryNormalized.includes('قشطوطه') || 
                                  categoryNormalized.includes('كبات السعاده') ||
                                  nameNormalized.includes('دونات') ||
                                  nameNormalized.includes('سينابون');

        const isRoyalItem = categoryNormalized.includes('تورت') || 
                            categoryNormalized.includes('جاتوه') || 
                            categoryNormalized.includes('ورد') || 
                            categoryNormalized.includes('بوكيه') ||
                            nameNormalized.includes('تورته') ||
                            nameNormalized.includes('جاتوه') ||
                            nameNormalized.includes('بوكيه');
        
        let isFullSpan = p.gridSpan === 'full' || p.displayStyle === 'full' || isRoyalItem;
        if (isDonutOrCinnabon) isFullSpan = false;

        let spanClass = '';
        let widthStyle = '';
        
        if (isSliderContainer) {
            spanClass = 'snap-start flex-shrink-0';
            widthStyle = `width: ${customWidth}px; max-width: 85vw;`;
        } else {
            spanClass = isFullSpan ? 'col-span-full w-full' : 'col-span-1 w-full';
            widthStyle = `max-width: 100%; margin: 0 auto; width: 100%;`;
        }

        const hasDiscount = p.hasDiscount === true && p.oldPrice > p.price;

        // دمج التنسيق المكتوب مع الحفاظ التام على الهيكل الأصلي والالتزام بالنصوص الفاخرة المعتمدة للبراند
        return `
            <div class="catalog-card-wrapper ${spanClass} p-1 transition-all duration-300" style="${widthStyle}">
                <div class="bose-luxury-card group h-full flex flex-col bg-white rounded-xl border border-[#ff91a4]/30 p-2 text-center hover:border-[#ff91a4] transition-all duration-300 relative">
                    
                    <div class="w-full overflow-hidden bg-[#fff5f6] rounded-xl relative aspect-square mb-3">
                        <img src="${img}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
                        ${hasDiscount && !isOut ? `<div class="absolute top-2 right-2 bg-[#ff91a4] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs z-10">تميز خاص</div>` : ''}
                        ${isOut ? '<div class="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#3d241c] font-bold text-xs z-10 select-none">نترقب عودته</div>' : ''}
                    </div>
                    
                    <div class="flex flex-col flex-grow px-1">
                        
                        <h3 class="font-bold text-base text-[#3d241c] mb-0.5 truncate">${name}</h3>
                        
                        <p class="text-xs text-[#ff91a4] font-bold mb-2">${category}</p>
                        
                        <p class="text-[11px] text-gray-500 mb-3 min-h-[34px] leading-relaxed product-desc line-clamp-2" style="white-space: normal; overflow-wrap: anywhere; word-break: break-word;">
                            ${description}
                        </p>
                        
                        <div class="mt-auto pt-2 border-t border-[#ff91a4]/5">
                            <div class="flex items-center justify-between gap-1 mb-2 bg-[#fff5f6] py-1 px-2 rounded-full">
                                
                                <button onclick="window.updateTempQtyContext(this, -1)" class="w-5 h-5 flex items-center justify-center text-xs font-bold bg-white text-[#ff91a4] rounded-full border border-[#ff91a4]/10 cursor-pointer select-none" ${isOut ? 'disabled' : ''}>-</button>
                                
                                <div class="flex flex-col items-center">
                                    ${hasDiscount ? `<span class="text-[9px] text-gray-400 line-through font-bold leading-none">${p.oldPrice} ج.م</span>` : ''}
                                    <span class="font-bold text-xs text-[#3d241c] leading-none">
                                        ${price}${typeof price === 'number' ? ' <span class="text-[10px] font-bold text-[#ff91a4]">ج.م</span>' : ''}
                                    </span>
                                </div>
                                
                                <div class="flex items-center gap-1.5">
                                    <span class="temp-qty-display text-xs font-bold text-[#3d241c] w-3 text-center">1</span>
                                    <button onclick="window.updateTempQtyContext(this, 1)" class="w-5 h-5 flex items-center justify-center text-xs font-bold bg-white text-[#ff91a4] rounded-full border border-[#ff91a4]/10 cursor-pointer select-none" ${isOut ? 'disabled' : ''}>+</button>
                                </div>
                                
                            </div>
                            
                            <button onclick="window.addWithQtyContextAndSync(this, '${p.id}')" class="w-full py-2 rounded-full bg-[#ff91a4] text-white font-bold text-xs hover:bg-[#3d241c] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" ${isOut ? 'disabled' : ''}>
                                تصفح المنيو استعرض المزيد
                            </button>
                        </div>
                        
                    </div>
                </div>
            </div>`;
    }).join('');

    if (isSliderContainer) {
        const appliedWidth = Math.round(defaultWidth * 1.1);
        container.querySelectorAll('.catalog-card-wrapper').forEach(card => {
            card.style.width = `${appliedWidth}px`;
            card.style.flexShrink = '0';
            card.style.maxWidth = '85vw';
        });
    }

    if (window.lucide) lucide.createIcons();
}

// مصدة الذاكرة لمنع الوميض وضمان استقرار معالجة DOM
let uiRenderDebounceTimer = null;

export function distributeProductsToUI(products) {
    const BoseState = window.BoseState;
    const normalizeArabic = window.normalizeArabic || normalizeArabicText;
    
    const currentProducts = Array.isArray(products) && products.length ? products : (BoseState?.catalog || []);
    
    if (window.uiRenderDebounceTimer) clearTimeout(window.uiRenderDebounceTimer);
    
    window.uiRenderDebounceTimer = setTimeout(() => {
        const sections = [
            'menuGrid',
            'dynamic-new-arrivals',
            'dynamic-best-sellers',
            'best-sellers-slider-container',
            'dynamic-categories-container',
            'new-arrivals-container',
            'best-sellers-container',
            'arrival-section-container'
        ];

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            const sectionTitle = el.dataset.sectionTitle || '';
            const block = BoseState?.theme?.builderLayout?.find(b => (b.containerId && b.containerId === id) || (b.title && b.title === sectionTitle));
            
            let filteredList = [];
            
            if (block && block.dataSource) {
                if (block.dataSource.startsWith('category:')) {
                    const catName = block.dataSource.split(':')[1];
                    const normalizedCatName = normalizeArabic(catName);
                    filteredList = currentProducts.filter(p => p.category && normalizeArabic(p.category).includes(normalizedCatName));
                } else if (block.dataSource === 'latest') {
                    filteredList = [...currentProducts].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 12);
                } else if (block.dataSource === 'bestsellers') {
                    filteredList = currentProducts.filter(p => p.hasDiscount === true || p.starRating >= 4.5).slice(0, 12);
                } else if (block.dataSource === 'menu') {
                    filteredList = currentProducts.filter(p => p.category && !normalizeArabic(p.category).includes('ورد')).slice(0, 12);
                }
            } else {
                // الفلترة الافتراضية المدمجة والمحسنة لضمان دقة التوزيع اللحظي بالواجهة الرئيسية لقواطع الاستعراض
                if (id.includes('best-sellers') || id.includes('bestsellers')) {
                    filteredList = currentProducts.filter(p => p.hasDiscount === true || p.starRating >= 4.5);
                    if (filteredList.length === 0) filteredList = currentProducts.slice(0, 10);
                } else if (id.includes('new-arrivals') || id.includes('arrival')) {
                    filteredList = [...currentProducts].sort((a,b) => String(b.id || '').localeCompare(String(a.id || '')));
                    if (filteredList.length === 0) filteredList = currentProducts.slice(0, 10);
                } else if (id === 'menuGrid') {
                    filteredList = currentProducts.filter(p => p.category && !normalizeArabic(p.category).includes('ورد'));
                    if (filteredList.length === 0) filteredList = currentProducts.slice(0, 8);
                } else {
                    filteredList = [...currentProducts];
                }
            }
            
            // حماية كاملة: منع الحاوية من الظهور فارغة عبر مدها ببدائل ذكية من الكتالوج الحالي المتاح
            if (filteredList.length === 0 && currentProducts.length > 0) {
                filteredList = currentProducts.slice(0, 10);
            }
            
            filteredList = filteredList.map(p => ({
                ...p,
                inStock: p.inStock !== false && p.stock !== 0 && p.stock != null
            }));
            
            renderProductCardsUI(filteredList, id);
        });

        // استدعاء شلال الصور المعتمد على المنتجات المتاحة والمحملة بالذاكرة الحية
        if (typeof window.initializeBoseWaterfall === 'function') {
            window.initializeBoseWaterfall(currentProducts);
        }

        if (typeof applyThemeConfigUI === 'function') applyThemeConfigUI();
    }, 150);
}

export function applyThemeConfigUI() {
    const BoseState = window.BoseState;
    const themeData = BoseState ? BoseState.theme : null;
    if (!themeData) return;

    if (themeData.header && themeData.header.logoText) {
        document.querySelectorAll('.bose-logo-text').forEach(el => {
            el.innerText = themeData.header.logoText;
        });
    }

    if (themeData.ticker && themeData.ticker.length > 0) {
        const tickerContainer = document.getElementById('sovereign-ticker-inner') || document.getElementById('dynamic-ticker-scroll');
        if (tickerContainer) {
            tickerContainer.innerHTML = themeData.ticker.map(t => `<span class="mx-10 inline-block font-black">${t}</span>`).join('');
        }
    }

    if (themeData.footer) {
        const fDesc = document.getElementById('footer-brand-desc') || document.getElementById('footer-dynamic-desc');
        if (fDesc) fDesc.innerText = themeData.footer.desc || themeData.footer.description || fDesc.innerText;
        
        const fPhone = document.getElementById('footer-phone-link');
        if (fPhone) {
            fPhone.href = `tel:${themeData.footer.phone}`;
            fPhone.innerText = themeData.footer.phone || '';
        }
    }

    if (typeof window.loadSliderImages === 'function') {
        window.loadSliderImages(BoseState?.catalog);
    }
}

window.toggleSidebar = function() {
    try {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar || !overlay) return;

        const isActive = sidebar.classList.contains('active');
        if (isActive) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    } catch (error) {}
};

export const showInfo = function(type) {
    const boseConfig = window.boseConfig;
    const pinkColor = boseConfig?.branding?.colors?.pink || '#ff91a4';

    let title = "", content = "";
    if (type === 'about') {
        title = "عن علامة حلويات بوسي";
        content = `تأسست حلويات بوسي في مدينة الكفاح بمركز الفرافرة... نلتزم بأعلى معايير الجودة والفخامة لتوفير أفخر المخبوزات والحلويات الغربية والشرقية المصنوعة بأعلى مقاييس الإتقان اللامتناهي.`;
    }
    const modalId = 'bose-info-modal'; let modal = document.getElementById(modalId);
    if (!modal) { 
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `<div class="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden p-8 border-4 text-right" style="border-color: ${pinkColor}20;">
        <h3 class="text-2xl font-black mb-6 text-center">${title}</h3>
        <p class="text-base font-bold leading-relaxed">${content}</p>
        <button onclick="document.getElementById('${modalId}').remove()" class="w-full mt-8 py-4 rounded-full font-black text-white" style="background: ${pinkColor};">تم الاستيعاب</button>
    </div>`;
};

window.updateTempQtyContext = function(btn, delta) {
    const display = btn.parentElement.querySelector('.temp-qty-display');
    if (display) {
        let val = parseInt(display.innerText) + delta;
        if (val < 1) val = 1;
        if (val > 50) val = 50;
        display.innerText = val;
    }
};

// ============================================================================
// 🛒 ترقية نظام السلة العائمة والمزامنة اللحظية مع تأثيرات النبض البصري
// ============================================================================

window.syncBoseCartUI = function() {
    const BoseState = window.BoseState;
    
    if (BoseState && BoseState.cart) {
        if (window.saveToLocalMemory) {
            window.saveToLocalMemory('BoseSweets_Cart', BoseState.cart);
            window.saveToLocalMemory('bose_cart_storage', BoseState.cart);
            window.saveToLocalMemory('bose_cart', BoseState.cart);
        } else {
            localStorage.setItem('bose_cart_storage', JSON.stringify(BoseState.cart));
            localStorage.setItem('bose_cart', JSON.stringify(BoseState.cart));
        }
    }

    window.dispatchEvent(new CustomEvent('BoseSweets_Cart_Updated', { detail: BoseState?.cart }));
    window.dispatchEvent(new CustomEvent('cart_updated'));

    if (typeof window.updateCartUI === 'function') {
        window.updateCartUI();
    }
    if (window.cartSystem && typeof window.cartSystem.render === 'function') {
        window.cartSystem.render();
    }
};

window.addWithQtyContextAndSync = function(btn, productId) {
    const cardWrapper = btn.closest('.catalog-card-wrapper');
    const qtyDisplay = cardWrapper ? cardWrapper.querySelector('.temp-qty-display') : null;
    const qty = qtyDisplay ? parseInt(qtyDisplay.innerText) : 1;

    const originalText = btn.innerText;
    btn.innerHTML = `<i class="fa-solid fa-check ml-1.5"></i> تم التحديث`;
    btn.classList.remove('bg-[#ff91a4]', 'text-[#ff91a4]');
    btn.classList.add('bg-[#3d241c]', 'text-white');
    
    const badgeContainer = document.getElementById('cart-badge-container');
    if (badgeContainer) {
        badgeContainer.classList.remove('bose-pulse');
        void badgeContainer.offsetWidth; 
        badgeContainer.classList.add('bose-pulse');
    }

    setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-[#3d241c]', 'text-white');
        btn.classList.add('bg-[#fff5f6]', 'text-[#ff91a4]');
    }, 1200);

    if (window.cartSystem && typeof window.cartSystem.addWithQtyContext === 'function') {
        window.cartSystem.addWithQtyContext(btn, productId);
        
        setTimeout(() => {
            const BoseState = window.BoseState;
            if (BoseState && Array.isArray(BoseState.cart)) {
                const targetItem = BoseState.cart.find(item => item.id === productId);
                if (targetItem) {
                    targetItem.quantity = qty;
                }
                window.syncBoseCartUI();
            }
            if (qtyDisplay) qtyDisplay.innerText = "1";
        }, 80);
    } else if (window.cartSystem && typeof window.cartSystem.add === 'function') {
        window.cartSystem.add(productId, qty);
        if (qtyDisplay) qtyDisplay.innerText = "1";
    } else {
        const BoseState = window.BoseState;
        const product = BoseState?.catalog?.find(p => p.id === productId);
        if (!product) return;

        let cart = BoseState?.cart || [];
        const existingIdx = cart.findIndex(item => item.id === productId);

        if (existingIdx > -1) {
            cart[existingIdx].quantity += qty;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: qty,
                image: product.image || product.img || BOSE_LOGO_FALLBACK
            });
        }

        if (BoseState) BoseState.cart = cart;
        window.syncBoseCartUI();

        if (qtyDisplay) qtyDisplay.innerText = "1";
    }
};

// ============================================================================
// 🖼️ القسم التاسع: هندسة السلايدر المتكامل والشامل لكلا الخيارين (Firebase + Fallbacks)
// ============================================================================

export async function fetchSliderRecords() {
    const BoseState = window.BoseState;
    const db = window.db;
    
    try {
        if (!db) return [];
        if (BoseState && BoseState.theme && BoseState.theme.sliderImages && Array.isArray(BoseState.theme.sliderImages)) {
            return BoseState.theme.sliderImages;
        }
        const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        const sliderSnap = await getDocs(collection(db, 'sliders'));
        if (!sliderSnap.empty) {
            return sliderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return [];
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'ui-engine.js', null, null, 'fetchSliderRecords');
        return [];
    }
}

export async function loadSliderImages(products) {
    const sliderContainer = document.getElementById('main-slider');
    const dotsContainer = document.getElementById('slider-dots-container');
    if (!sliderContainer) return;
    
    sliderContainer.classList.remove('bose-skeleton');
    const processBoseImage = window.processBoseImage;
    const BoseState = window.BoseState;
    const currentProducts = Array.isArray(products) && products.length ? products : (BoseState?.catalog || []);

    try {
        let sliderData = await fetchSliderRecords();
        
        if (!sliderData || sliderData.length === 0) {
            if (currentProducts.length >= 1) {
                sliderData = currentProducts.slice(0, 5).map((p, i) => ({
                    id: `slide-prod-${i}`,
                    imageUrl: p.img || p.image,
                    title: p.name || "إتقان فريد من نوعه"
                }));
            } else {
                sliderData = [
                    { id: 'slide1', imageUrl: BOSE_LOGO_FALLBACK, title: "حلويات بوسي الفاخرة" },
                    { id: 'slide2', imageUrl: BOSE_LOGO_FALLBACK, title: "حلويات بوسي الفاخرة" },
                    { id: 'slide3', imageUrl: BOSE_LOGO_FALLBACK, title: "حلويات بوسي الفاخرة" },
                    { id: 'slide4', imageUrl: BOSE_LOGO_FALLBACK, title: "حلويات بوسي الفاخرة" },
                    { id: 'slide5', imageUrl: BOSE_LOGO_FALLBACK, title: "حلويات بوسي الفاخرة" }
                ];
            }
        }

        const targetSlides = sliderData.slice(0, 5);
        
        let slidesHtml = '';
        let dotsHtml = '';

        targetSlides.forEach((slide, index) => {
            const sourceUrl = slide.imageUrl || slide.image || slide.img || '';
            const processedUrl = processBoseImage ? processBoseImage(sourceUrl) : sourceUrl;
            const smartTimeStamp = slide.updatedAt || (BoseState && BoseState.theme && BoseState.theme.lastAdminUpdate) || new Date().getTime();
            const separator = processedUrl.includes('?') ? '&' : '?';
            const finalImageUrl = sourceUrl ? `${processedUrl}${separator}v=${smartTimeStamp}` : BOSE_LOGO_FALLBACK;
            const slideTitle = slide.title || "تميز وإتقان ممتد منذ عام 2014";

            slidesHtml += `
                <div class="slider-item-exclusive bose-slide h-full flex-shrink-0 w-screen relative snap-start transition-opacity duration-1000 ease-in-out" data-index="${index}">
                    <img src="${finalImageUrl}" class="w-full h-full object-cover select-none pointer-events-none" style="min-height: 100%;" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#3d241c]/80 via-transparent to-transparent flex items-end p-8 text-right">
                        <div>
                            <h3 class="text-white text-xl md:text-2xl font-bold mb-1">${slideTitle}</h3>
                            <p class="text-[#ff91a4] font-bold text-xs md:text-sm">تميز وإتقان ممتد منذ عام 2014 بمركز الفرافرة</p>
                        </div>
                    </div>
                </div>
            `;

            dotsHtml += `
                <button class="bose-dot w-2 h-2 rounded-full transition-all duration-300 ${index === 0 ? 'bg-[#ff91a4] w-4' : 'bg-gray-300'}" data-slide-index="${index}" aria-label="Annihilation Layer ${index + 1}"></button>
            `;
        });

        sliderContainer.innerHTML = slidesHtml;
        if (dotsContainer) dotsContainer.innerHTML = dotsHtml;

        let currentSlideIdx = 0;
        if (window.boseSlideInterval) clearInterval(window.boseSlideInterval);
        
        window.boseSlideInterval = setInterval(() => {
            if (sliderContainer.clientWidth > 0) {
                currentSlideIdx = (currentSlideIdx + 1) % targetSlides.length;
                window.setBoseSlide(currentSlideIdx);
            }
        }, 4500);

        window.setBoseSlide = function(index) {
            currentSlideIdx = index;
            const width = sliderContainer.clientWidth;
            if (width > 0) {
                sliderContainer.scrollTo({
                    left: width * index,
                    behavior: 'smooth'
                });
            }
            
            const dots = dotsContainer ? dotsContainer.querySelectorAll('button') : [];
            dots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.add('bg-[#ff91a4]', 'w-4');
                    dot.classList.remove('bg-gray-300');
                } else {
                    dot.classList.remove('bg-[#ff91a4]', 'w-4');
                    dot.classList.add('bg-gray-300');
                }
            });
        };

        initBoseSovereignSliderEffects(sliderContainer, dotsContainer);

    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'ui-engine.js', null, null, 'loadSliderImages');
    }
}

function initBoseSovereignSliderEffects(slider, dotsContainer) {
    if (!slider) return;
    
    slider.addEventListener('scroll', () => {
        const width = slider.clientWidth;
        if (width <= 0) return;
        const currentIndex = Math.round(slider.scrollLeft / width);
        
        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('button');
            dots.forEach((dot, idx) => {
                if (idx === currentIndex) {
                    dot.classList.add('bg-[#ff91a4]', 'w-4');
                    dot.classList.remove('bg-gray-300');
                } else {
                    dot.classList.remove('bg-[#ff91a4]', 'w-4');
                    dot.classList.add('bg-gray-300');
                }
            });
        }
    });

    if (dotsContainer) {
        dotsContainer.querySelectorAll('button').forEach(dot => {
            dot.addEventListener('click', () => {
                const idx = parseInt(dot.dataset.slideIndex || dot.dataset.index);
                if (typeof window.setBoseSlide === 'function') {
                    window.setBoseSlide(idx);
                } else {
                    slider.scrollTo({
                        left: slider.clientWidth * idx,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

if (typeof window !== 'undefined') {
    window.loadSliderImages = loadSliderImages;
    window.fetchSliderRecords = fetchSliderRecords;
    window.distributeProductsToUI = distributeProductsToUI;
}

// ============================================================================
// 🔒 القسم العاشر: محاكي التنسيق الفاخر وتكاملات السلة (Simulator Integration)
// ============================================================================

if (typeof window.boseEngineRegistry !== 'undefined') {
    window.boseEngineRegistry.registerModule('bouquetSimulator', {
        init: function() {
            console.log("تمت تهيئة وحدة محاكي التنسيق الفاخر بنجاح لعلامة حلويات بوسي.");
        },
        validate: function(data) {
            return data && data.material && data.density >= 10;
        }
    });
}

function integrateSimulatorWithCart(simulatorData) {
    if (!simulatorData || !simulatorData.totalPrice) {
        console.error("خطأ: بيانات التنسيق غير مكتملة أو غير متوافقة مع محرك الموقع.");
        return false;
    }

    const cartItem = {
        id: `bouquet-${Date.now()}`,
        name: simulatorData.productName,
        price: parseFloat(simulatorData.totalPrice.replace(/[^\d.]/g, '')),
        quantity: 1,
        options: {
            "الخامة الأساسية": simulatorData.material,
            "اللون الأساسي": simulatorData.color,
            "كثافة التنسيق": `${simulatorData.density} وردة`,
            "اللمسات الفاخرة": [
                simulatorData.hasChocolate ? "شوكولاتة فاخرة" : null,
                simulatorData.hasCash ? "تغليف مبالغ نقدية" : null,
                simulatorData.hasCard ? "كارت إهداء مخطوط" : null,
                simulatorData.hasPhoto ? "صورة تذكارية مصورة" : null
            ].filter(Boolean)
        },
        metadata: {
            source: "visual-simulator",
            timestamp: new Date().toISOString()
        }
    };

    const BoseState = window.BoseState;

    if (typeof window.boseCartEngine !== 'undefined' && typeof window.boseCartEngine.addItem === 'function') {
        window.boseCartEngine.addItem(cartItem);
    } else if (typeof window.globalCart !== 'undefined' && Array.isArray(window.globalCart)) {
        window.globalCart.push(cartItem);
        window.syncBoseCartUI();
    } else if (BoseState && Array.isArray(BoseState.cart)) {
        BoseState.cart.push(cartItem);
        window.syncBoseCartUI();
    } else {
        let localCart = JSON.parse(localStorage.getItem('bose_cart_storage') || localStorage.getItem('bose_cart') || '[]');
        localCart.push(cartItem);
        localStorage.setItem('bose_cart_storage', JSON.stringify(localCart));
        localStorage.setItem('bose_cart', JSON.stringify(localCart));
        window.dispatchEvent(new CustomEvent('BoseSweets_Cart_Updated'));
    }

    window.location.href = 'cart.html';
    return true;
}

export function integrateCakeSimulatorWithCart(cakeData) {
    if (!cakeData || !cakeData.totalPrice) {
        console.error("خطأ: بيانات تصميم التورتة غير متوافقة مع محرك الموقع الخاص بـ BoseSweets.");
        return false;
    }

    const cartItem = {
        id: `cake-custom-${Date.now()}`,
        name: cakeData.productName || "تورتة من تصميمك المخصص",
        price: parseFloat(cakeData.totalPrice.replace(/[^\d.]/g, '')),
        quantity: cakeData.quantity || 1,
        options: {
            "الحجم والأدوار": cakeData.sizeLabel || "دور واحد متناسق",
            "نوع الكيك والسبونج": cakeData.spongeType || "فانيليا هشة",
            "الحشو والطبقات الداخلية": cakeData.filling || "كريمة غنية",
            "التغطية الخارجية": cakeData.topping || "كريمة شوكولاتة فاخرة",
            "عبارة الإهداء المكتبوبة": cakeData.writtenMessage || "بدون كتابة",
            "إضافات تزيينية مخصصة": [
                cakeData.hasFruits ? "قطع فواكه موسمية طازجة" : null,
                cakeData.hasMacarons ? "قطع ماكرون فرنسي" : null,
                cakeData.hasFlowers ? "ورود طبيعية منسقة" : null,
                cakeData.hasCandles ? "شمع احتفالي فاخر" : null
            ].filter(Boolean)
        },
        metadata: {
            source: "cake-simulator",
            timestamp: new Date().toISOString()
        }
    };

    const BoseState = window.BoseState;

    if (BoseState && Array.isArray(BoseState.cart)) {
        BoseState.cart.push(cartItem);
        window.syncBoseCartUI();
    } else {
        let localCart = JSON.parse(localStorage.getItem('bose_cart_storage') || localStorage.getItem('bose_cart') || '[]');
        localCart.push(cartItem);
        localStorage.setItem('bose_cart_storage', JSON.stringify(localCart));
        localStorage.setItem('bose_cart', JSON.stringify(localCart));
        if (BoseState) BoseState.cart = localCart;
        window.syncBoseCartUI();
    }

    window.location.href = 'cart.html';
    return true;
}

window.parseCustomCakeOrder = function(item) {
    if (!item || item.metadata?.source !== "cake-simulator") return '';

    const opts = item.options || {};
    const additionals = Array.isArray(opts["إضافات تزيينية مخصصة"]) ? opts["إضافات تزيينية مخصصة"].join(' | ') : 'لا يوجد';
    
    return `
        <div class="mt-3 p-4 bg-[#1a1012] rounded-xl border border-[#42282d] text-xs text-[#e0c8cc] space-y-2 text-right">
            <p class="text-[#ff91a4] font-black flex items-center justify-end gap-1">
                🎂 تفاصيل تصميم التورتة المخصصة (دقة التنفيذ):
            </p>
            <div class="grid grid-cols-2 gap-y-1 text-[11px] direction-rtl">
                <p>• الحجم والطبقات: <span class="text-white font-bold">${opts["الحجم والأدوار"] || 'دور واحد'}</span></p>
                <p>• نوع الكيك: <span class="text-white font-bold">${opts["نوع الكيك والسبونج"] || 'فانيليا'}</span></p>
                <p>• الحشو المعتمد: <span class="text-white font-bold">${opts["الحشو والطبقات الداخلية"] || 'كريمة'}</span></p>
                <p>• التغطية الخارجية: <span class="text-white font-bold">${opts["التغطية الخارجية"] || 'كريمة'}</span></p>
            </div>
            <p class="text-[11px] border-t border-[#42282d] pt-1 mt-1">
                • الكتابة المطلوبة: <span class="text-[#ff91a4] font-bold">${opts["عبارة الإهداء المكتوبة"] || 'لا يوجد'}</span>
            </p>
            <p class="text-[11px] pt-1">
                • الإضافات الفاخرة المرفقة: <span class="text-white">${additionals}</span>
            </p>
        </div>
    `;
};

if (typeof window !== 'undefined') {
    window.addToCart = integrateSimulatorWithCart;
    window.addCakeToCart = integrateCakeSimulatorWithCart;
}

window.saveBoseSimulatorSettings = async function() {
    const db = window.db;

    if (!db) {
        console.error("عطل اتصالي: قاعدة بيانات فايربيز غير معرفة في هذا النطاق.");
        return;
    }

    const simulatorSettings = {
        prices: {
            natural: parseFloat(document.getElementById('adm-price-natural').value) || 20,
            artificial: parseFloat(document.getElementById('adm-price-artificial').value) || 15,
            satin: parseFloat(document.getElementById('adm-price-satin').value) || 25,
            chocolate: parseFloat(document.getElementById('adm-price-chocolate').value) || 250,
            cash: parseFloat(document.getElementById('adm-price-cash').value) || 100,
            card: parseFloat(document.getElementById('adm-price-card').value) || 25,
            photo: parseFloat(document.getElementById('adm-price-photo').value) || 15
        },
        layers: {
            chocolateUrl: document.getElementById('adm-layer-chocolate-url').value.trim(),
            cashUrl: document.getElementById('adm-layer-cash-url').value.trim()
        },
        updatedAt: Date.now()
    };

    try {
        const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        const docRef = doc(db, 'settings', 'simulator_config');
        await setDoc(docRef, simulatorSettings, { merge: true });
        
        if (typeof window.showBoseToast === 'function') {
            window.showBoseToast("تم توثيق وحفظ لوجستيات وأسعار محاكي التنسيق سحابياً بنجاح.");
        } else if (typeof window.showSystemToast === 'function') {
            window.showSystemToast("تم توثيق وحفظ لوجستيات وأسعار محاكي التنسيق سحابياً بنجاح.", "success");
        } else {
            console.log("تم توثيق وحفظ لوجستيات وأسعار محاكي التنسيق سحابياً بنجاح.");
        }
    } catch (error) {
        console.error("فشل الحفظ السحابي لقسم التنسيق:", error);
        localStorage.setItem('bose_simulator_config', JSON.stringify(simulatorSettings));
    }
};

window.parseCustomBouquetOrder = function(item) {
    if (!item || item.metadata?.source !== "visual-simulator") return '';

    const opts = item.options || {};
    const additionals = Array.isArray(opts["اللمسات الفاخرة"]) ? opts["اللمسات الفاخرة"].join(' | ') : 'لا يوجد';
    
    return `
        <div class="mt-3 p-4 bg-[#1a1012] rounded-xl border border-[#42282d] text-xs text-[#e0c8cc] space-y-2 text-right">
            <p class="text-[#ff91a4] font-black flex items-center justify-end gap-1">
                💐 تفكيك بنود بوكيه التنسيق المخصص (دقة التنفيذ):
            </p>
            <div class="grid grid-cols-2 gap-y-1 text-[11px] direction-rtl">
                <p>• الخامة الأساسية: <span class="text-white font-bold">${opts["الخامة الأساسية"] || 'طبيعي'}</span></p>
                <p>• اللون المطلوب: <span class="text-white font-bold">${opts["اللون الأساسي"] || 'أحمر'}</span></p>
                <p>• الكثافة والعدد: <span class="text-white font-bold">${opts["كثافة التنسيق"] || '15 وردة'}</span></p>
                <p>• السعر الإجمالي المعتمد: <span class="text-[#ff91a4] font-bold">${item.price} ج.م</span></p>
            </div>
            <p class="text-[11px] border-t border-[#42282d] pt-1 mt-1">
                • اللمسات الفاخرة المرفقة: <span class="text-white">${additionals}</span>
            </p>
        </div>
    `;
};

// ============================================================================
// 🔒 القسم الحادي عشر: جاهزية النظام والتشغيل التلقائي وترتيب الأقسام الفاخرة (Bootloader)
// ============================================================================

if (typeof window !== 'undefined') {
    window.renderProductCards = renderProductCardsUI;
    window.distributeProductsToUI = distributeProductsToUI;
    if (window.cartSystem) window.cartSystem = window.cartSystem;
    if (window.BoseState) window.BoseState = window.BoseState;
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        const style = document.createElement('style');
        style.textContent = `
            .product-desc {
                white-space: normal !important;
                overflow-wrap: anywhere !important;
                word-break: break-word !important;
                line-clamp: unset !important;
                -webkit-line-clamp: unset !important;
                height: auto !important;
            }
            .bose-full-slider-container {
                display: flex !important;
                overflow-x: auto !important;
                scroll-snap-type: x mandatory !important;
                -webkit-overflow-scrolling: touch !important;
                scrollbar-width: none !important;
                width: 100vw !important;
                position: relative;
                left: 50%;
                right: 50%;
                margin-left: -50vw;
                margin-right: -50vw;
            }
            .bose-full-slider-container::-webkit-scrollbar {
                display: none !important;
            }
            .slider-item-exclusive {
                width: 100vw !important;
                max-width: 100vw !important;
                height: 50vh !important;
                min-height: 380px;
                overflow: hidden;
            }
            .bose-grid-two-columns {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 16px !important;
                padding: 8px !important;
            }
            @media (min-width: 768px) {
                .bose-grid-two-columns {
                    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                    gap: 24px !important;
                }
                .slider-item-exclusive {
                    height: 85vh !important;
                }
            }
            .bose-breathing-space {
                padding-top: 2.5rem !important;
                padding-bottom: 2.5rem !important;
                letter-spacing: 0.02em;
            }
            .bose-pulse {
                animation: boseCartPulse 0.5s ease-in-out;
            }
            @keyframes boseCartPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    } catch (e) {
        console.error("فشل حقن التنسيقات الإضافية لحماية النصوص وهندسة السلايدر لعلامة حلويات بوسي:", e);
    }

    if (typeof window.initializeSovereignSync === 'function') {
        window.initializeSovereignSync();
    }
    
    setTimeout(() => {
        if (typeof window.loadSliderImages === 'function') window.loadSliderImages();
        if (window.BoseState) window.BoseState.isAppReady = true;
        if (typeof window.setAppReady === 'function') window.setAppReady();
        window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready'));
    }, 500);
});

window.addEventListener('BoseSweets_Catalog_Updated', () => {
    if (typeof window.distributeProductsToUI === 'function') {
        window.distributeProductsToUI(window.BoseState?.catalog);
    }
});

window.addEventListener('BoseSweets_Logistics_Updated', () => {
    if (typeof window.applyLogisticsRulesUI === 'function') {
        window.applyLogisticsRulesUI();
    }
});

console.log("👑 BoseSweets Engine: تم ترقية المحرك الموحد بنجاح للإصدار (V42.1) لربط كروت العرض بالصفحة الرئيسية.");
