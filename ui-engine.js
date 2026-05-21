/**
 * ============================================================================
 * 👑 BoseSweets Sovereign UI Engine | محرك الواجهة البصرية السيادي لعلامة حلويات بوسي
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي التجاريّة (The Management)
 * الهوية البصرية المعتمدة: الوردي الفاخر (#ff91a4) | الأبيض النقي | النصوص الشوكولاتية
 * الترقية: V42.0 Ultra Premium - التوافق التام والأداء المتزن مع النواة الأساسية
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
            // كارتين جنب بعض في قنوات العرض العادية (grid-cols-2) لتحقيق محاكاة النموذج الاسترشادي مع التنفس البصري
            spanClass = isFullSpan ? 'col-span-full w-full' : 'col-span-1 w-full';
            widthStyle = `max-width: 100%; margin: 0 auto; width: 100%;`;
        }

        const hasDiscount = p.hasDiscount === true && p.oldPrice > p.price;

        // تطبيق الهيكلة الجديدة الفاخرة للكارت: الصورة -> الاسم -> النكهة -> الوصف الاحترافي -> السعر في المنتصف محاطاً بأزرار التحكم -> زر إضافة للسلة
        return `
            <div class="catalog-card-wrapper ${spanClass} p-3 transition-all duration-300" style="${widthStyle}">
                <div class="bose-luxury-card group h-full flex flex-col bg-white rounded-[24px] border border-[#ff91a4]/30 p-2 hover:border-[#ff91a4] transition-all duration-300 relative">
                    
                    <div class="w-full overflow-hidden bg-[#fff5f6] rounded-[18px] relative aspect-square mb-4">
                        <img src="${img}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
                        ${hasDiscount && !isOut ? `<div class="absolute top-3 right-3 bg-[#ff91a4] text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-xs z-10">تميز خاص</div>` : ''}
                        ${isOut ? '<div class="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#3d241c] font-black text-sm z-10 select-none">نترقب عودته</div>' : ''}
                    </div>
                    
                    <div class="flex flex-col flex-grow text-center px-2 pb-2">
                        
                        <h3 class="font-bold text-base text-[#3d241c] mb-1 tracking-wide">${name}</h3>
                        
                        <p class="text-xs text-[#ff91a4] font-bold mb-2 tracking-normal">${category}</p>
                        
                        <p class="text-xs text-gray-500 mb-4 leading-relaxed product-desc min-h-[40px]" style="white-space: normal; overflow-wrap: anywhere; word-break: break-word;">
                            ${description}
                        </p>
                        
                        <div class="mt-auto pt-3 border-t border-[#ff91a4]/10">
                            <div class="flex items-center justify-between gap-2 mb-3 bg-[#fff5f6]/40 p-1.5 rounded-full px-3">
                                
                                <button onclick="window.updateTempQtyContext(this, -1)" class="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-600 bg-white rounded-full border border-[#ff91a4]/20 hover:bg-[#ff91a4] hover:text-white transition-all" ${isOut ? 'disabled' : ''}>-</button>
                                
                                <div class="flex flex-col items-center">
                                    ${hasDiscount ? `<span class="text-[9px] text-gray-400 line-through font-bold leading-none">${p.oldPrice} ج.م</span>` : ''}
                                    <span class="font-black text-base text-[#3d241c] leading-none">
                                        ${price}${typeof price === 'number' ? ' <span class="text-xs font-bold text-[#ff91a4]">ج.م</span>' : ''}
                                    </span>
                                </div>
                                
                                <div class="flex items-center gap-2">
                                    <span class="temp-qty-display text-xs font-black text-[#3d241c] w-3 text-center">1</span>
                                    <button onclick="window.updateTempQtyContext(this, 1)" class="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-600 bg-white rounded-full border border-[#ff91a4]/20 hover:bg-[#ff91a4] hover:text-white transition-all" ${isOut ? 'disabled' : ''}>+</button>
                                </div>
                                
                            </div>
                            
                            <button onclick="window.addWithQtyContextAndSync(this, '${p.id}')" class="w-full py-2.5 rounded-full bg-[#fff5f6] text-[#ff91a4] font-black text-xs hover:bg-[#ff91a4] hover:text-white border border-[#ff91a4]/20 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" ${isOut ? 'disabled' : ''}>
                                تصفح السلة واضف للمنيو
                            </button>
                        </div>
                        
                    </div>
                </div>
            </div>`;
    }).join('');

    if (isSliderContainer) {
        const appliedWidth = Math.round(defaultWidth * 1.4);
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
        // تحديث وتأمين توزيع المنتجات على الحاويات المعتمدة هندسياً وضمان توافقها الكامل مع ملف الـ HTML
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
                    filteredList = currentProducts.filter(p => p.hasDiscount === true).slice(0, 12);
                } else if (block.dataSource === 'menu') {
                    filteredList = currentProducts.filter(p => p.category && normalizeArabic(p.category).includes('menu')).slice(0, 12);
                }
            } else {
                // الفلترة الافتراضية الذكية حسب معرف الحاوية لضمان التوافق المطلق والأوتوماتيكي للأقسام
                if (id.includes('best-sellers') || id.includes('bestsellers')) {
                    filteredList = currentProducts.filter(p => p.hasDiscount === true || p.starRating >= 4.8).slice(0, 10);
                } else if (id.includes('new-arrivals') || id.includes('arrival')) {
                    filteredList = [...currentProducts].sort((a,b) => (b.id > a.id ? 1 : -1)).slice(0, 10);
                } else {
                    filteredList = [...currentProducts];
                }
            }
            
            // التحصين وكسر ثغرة الاختفاء: إذا كانت المصفوفة المفلترة فارغة، نرتد لعرض الكتالوج المتاح كـ Fallback آمن
            if (filteredList.length === 0) {
                filteredList = [...currentProducts];
            }
            
            // مزامنة حالة المخزون بدقة كاملة بالتوافق المباشر مع محددات المحرك الأساسي (Core Engine)
            filteredList = filteredList.map(p => ({
                ...p,
                inStock: p.inStock !== false && p.stock !== 0 && p.stock != null
            }));
            
            renderProductCardsUI(filteredList, id);
        });

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
        const fDesc = document.getElementById('footer-brand-desc');
        if (fDesc) fDesc.innerText = themeData.footer.desc || '';
        
        const fPhone = document.getElementById('footer-phone-link');
        if (fPhone) {
            fPhone.href = `tel:${themeData.footer.phone}`;
            fPhone.innerText = themeData.footer.phone || '';
        }
    }

    if (typeof window.loadSliderImages === 'function') {
        window.loadSliderImages();
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
        content = `تأسست حلويات بوسي في مدينة الكفاح بمركز الفرافرة... نحن نلتزم بأعلى معايير الجودة والفخامة لتوفير أفخر المخبوزات والحلويات الغربية والشرقية المصنوعة بأعلى مقاييس الإتقان اللامتناهي.`;
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
// 🛒 ترقية نظام السلة العائمة والمزامنة اللحظية
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
// 🖼️ القسم التاسع: محرك العرض المرئي وسلايدر الخمس صور اللانهائي بكامل الشاشة
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

// هندسة السلايدر المتصل اللانهائي (5 صور تملأ الشاشة تماماً بدون أي فراغات مع مؤشرات التنقل السفلية)
export async function loadSliderImages() {
    const sliderContainer = document.getElementById('main-slider');
    const dotsContainer = document.getElementById('slider-dots-container');
    if (!sliderContainer) return;
    const processBoseImage = window.processBoseImage;
    const BoseState = window.BoseState;

    try {
        let sliderData = await fetchSliderRecords();
        
        // إذا كانت البيانات فارغة، يتم حقن صور افتراضية فاخرة لضمان بقاء الهيكل ممتلئاً وجميلاً دائماً
        if (!sliderData || sliderData.length === 0) {
            sliderData = [
                { id: 'slide1', imageUrl: BOSE_LOGO_FALLBACK },
                { id: 'slide2', imageUrl: BOSE_LOGO_FALLBACK },
                { id: 'slide3', imageUrl: BOSE_LOGO_FALLBACK },
                { id: 'slide4', imageUrl: BOSE_LOGO_FALLBACK },
                { id: 'slide5', imageUrl: BOSE_LOGO_FALLBACK }
            ];
        }

        // تحديد الحد الأقصى بـ 5 صور متصلة تماماً كما هو مطلوب هندسياً في قسم عقد من الإتقان
        const targetSlides = sliderData.slice(0, 5);
        
        sliderContainer.innerHTML = '';
        if (dotsContainer) dotsContainer.innerHTML = '';

        targetSlides.forEach((slide, index) => {
            const slideItem = document.createElement('div');
            // كتل العرض تملأ الشاشة بنسبة 100% عرضاً وارتفاعاً بدون اقتطاع أو فراغ بصري
            slideItem.className = 'slider-item-exclusive h-full w-full flex-shrink-0 w-screen relative snap-start';
            
            const sourceUrl = slide.imageUrl || slide.image || slide.img || '';
            const processedUrl = processBoseImage ? processBoseImage(sourceUrl) : sourceUrl;
            const smartTimeStamp = slide.updatedAt || (BoseState && BoseState.theme && BoseState.theme.lastAdminUpdate) || new Date().getTime();
            const separator = processedUrl.includes('?') ? '&' : '?';
            const finalImageUrl = sourceUrl ? `${processedUrl}${separator}v=${smartTimeStamp}` : BOSE_LOGO_FALLBACK;
            
            slideItem.innerHTML = `<img src="${finalImageUrl}" class="w-full h-full object-cover select-none pointer-events-none" style="min-height: 100%;">`;
            sliderContainer.appendChild(slideItem);

            // إنشاء النقط الذكية لتعبر عن عدد الصور الحالية أسفل السلايدر بدقة مطلقة
            if (dotsContainer) {
                const dot = document.createElement('button');
                dot.className = `w-2 h-2 rounded-full transition-all duration-300 ${index === 0 ? 'bg-[#ff91a4] w-4' : 'bg-gray-300'}`;
                dot.dataset.slideIndex = index;
                dot.ariaLabel = `الانتقال للصورة رقم ${index + 1}`;
                dotsContainer.appendChild(dot);
            }
        });

        // تهيئة محاكي التأثيرات المتصل اللانهائي للتنقل الجانبي المغناطيسي
        initBoseSovereignSliderEffects(sliderContainer, dotsContainer);

    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'ui-engine.js', null, null, 'loadSliderImages');
    }
}

// محرك التحكم في الحركة المغناطيسية للسلايدر وربطه مع النقط السفلية بالتزامن اللحظي
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
                const idx = parseInt(dot.dataset.slideIndex);
                slider.scrollTo({
                    left: slider.clientWidth * idx,
                    behavior: 'smooth'
                });
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
            "عبارة الإهداء المكتوبة": cakeData.writtenMessage || "بدون كتابة",
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
        // حاقن التنسيق الإضافي لحماية الكروت المنفصلة وتثبيت السلايدر المتصل ممتد الشاشة (التنفس والراحة البصرية للعميل)
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
            /* هندسة السلايدر اللانهائي المتصل - ممتد بكامل عرض الشاشة بدون فواصل أو فراغات */
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
                height: 70vh !important; /* ارتفاع مريح ومتناسق للموبايل والكمبيوتر يعطي فخامة للمنتج */
            }
            /* هندسة كروت المنتجات لتظهر كارتين جنب بعض على الموبايل وبارتياح بصري ممتاز */
            .bose-grid-two-columns {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 12px !important;
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
            /* كلاس التنفس والارتياح البصري المأخوذ من روح الرول موديل */
            .bose-breathing-space {
                padding-top: 2.5rem !important;
                padding-bottom: 2.5rem !important;
                letter-spacing: 0.02em;
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

console.log("👑 BoseSweets Engine: تم ترقية المحرك الموحد بنجاح للإصدار (V42.0) المبرز لأقسام العرض وهيكلية الكروت الثنائية وسلايدر الشاشة الكاملة المستمر.");
