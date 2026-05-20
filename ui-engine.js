/**
 * ============================================================================
 * 👑 BoseSweets Sovereign UI Engine | محرك الواجهة البصرية السيادي
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي (The Management)
 * الحالة: التحكم الكامل في الهيكل البصري وتوزيع المحتوى والربط مع المحرك الأساسي.
 * الترقية: V40.3 Premium - دعم مرونة التوزيع التلقائي وعرض كامل المنتجات وتأمين السلايدر
 * ============================================================================
 */

// 🔗 جسر الربط السيادي مع المحرك الأساسي (Core Bridge)
// نعتمد على استدعاء هذا الملف بعد core-engine.js لضمان توفر البيانات
const BOSE_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg";

// دالة داخلية لتسوية النصوص العربية لضمان المطابقة الكاملة للأقسام والأصناف الفاخرة
function normalizeArabicText(text) {
    if (!text) return '';
    return text.toString()
        .replace(/[أإآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[ًٌٍَُِّ]/g, '') // إزالة الحركات تماماً لضمان دقة الفلترة
        .trim();
}

// ============================================================================
// 🎨 القسم الثامن: واجهة المستخدم والتحكم البصري والرسم الهندسي (UI Logic)
// ============================================================================

export function renderProductCardsUI(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const boseConfig = window.boseConfig;
    const processBoseImage = window.processBoseImage || ((img) => img || '');
    const BoseState = window.BoseState;

    // رصد بيئة الحاوية بذكاء لتحديد نوع الهندسة المطلوبة وتوسيع النطاق ليشمل الحاويات الديناميكية والسلايدرات
    const isSliderContainer = container.classList.contains('bose-horizontal-slider') || 
                              container.classList.contains('snap-x') || 
                              [
                                'dynamic-new-arrivals',
                                'dynamic-best-sellers',
                                'dynamic-categories-container'
                              ].includes(container.id);

    const sectionTitle = container.dataset.sectionTitle || '';
    const currentLayoutBlock = BoseState?.theme?.builderLayout?.find(b => (b.containerId && b.containerId === containerId) || (b.title && b.title === sectionTitle));
    const defaultWidth = currentLayoutBlock?.cardWidth || 280;
    const defaultHeight = currentLayoutBlock?.cardHeight || 350;

    container.innerHTML = products.map(p => {
        // إدارة علامة حلويات بوسي: السماح بعرض المنتجات حتى لو انتهت الكمية مع عرض علامة نفذت الكمية بوضوح
        const isOut = p.inStock === false || p.stock === 0;
        let customWidth = p.cardWidth || defaultWidth;
        let customHeight = p.cardHeight || defaultHeight;
        
        // التحقق الدقيق والموسع من تصنيفات المنتجات الخاصة لضمان ثبات الهيكل البصري لعلامة حلويات بوسي
        const categoryNormalized = p.category ? normalizeArabicText(p.category) : '';
        const nameNormalized = p.name ? normalizeArabicText(p.name) : '';

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

        // التدخل الهندسي الحاسم: فصل مسار السلايدر عن مسار الشبكة لمنع انهيار التصميم مع تطبيق ترقية التكبير
        let spanClass = '';
        let widthStyle = '';
        
        if (isSliderContainer) {
            // تكبير كروت السلايدر الفاخر بنسبة 40% لزيادة الجاذبية والوضوح البصري لمنتجات علامة حلويات بوسي
            customWidth = Math.round(customWidth * 1.4);
            customHeight = Math.round(customHeight * 1.4);

            spanClass = 'snap-start flex-shrink-0'; // يمنع الانكماش ويسمح بالتمرير المغناطيسي السلس
            widthStyle = `width: ${customWidth}px; max-width: 85vw;`;
        } else {
            spanClass = isFullSpan ? 'col-span-full w-full' : 'col-span-1 w-full';
            widthStyle = `max-width: ${isFullSpan ? '100%' : customWidth + 'px'}; margin: 0 auto; width: 100%;`;
        }

        const hasDiscount = p.hasDiscount === true && p.oldPrice > p.price;
        const img = processBoseImage(p.img || p.image) || BOSE_LOGO_FALLBACK;

        // تطبيق هيكلة الكارت الموحدة الفاخرة المعتمدة (الاسم ← النكهة ← الوصف ← السعر ← ± زر الكمية) لعلامة حلويات بوسي
        return `
            <div class="catalog-card-wrapper ${spanClass} p-2 transition-transform duration-300 hover:-translate-y-1" style="${widthStyle}">
                <div class="bose-double-wrap group h-full flex flex-col bg-white rounded-[32px] border-2 border-[#ff91a4] p-1.5 shadow-sm hover:shadow-md transition-all duration-300 relative">
                    <div class="bose-double-inner bg-white h-full flex flex-col rounded-[26px] overflow-hidden">
                        <div class="w-full overflow-hidden bg-brand-pinkLight border-b border-[#ff91a4]/20 relative" style="height: ${customHeight}px">
                            <img src="${img}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
                            ${hasDiscount && !isOut ? `<div class="absolute top-4 right-4 bg-[#ff91a4] text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-sm z-10">عرض خاص 🔥</div>` : ''}
                            ${isOut ? '<div class="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white font-black text-lg z-10 select-none">نفذت الكمية 🚫</div>' : ''}
                        </div>
                        <div class="p-5 flex flex-col flex-grow text-right bg-white justify-between">
                            <div>
                                <h3 class="font-bold text-lg text-[#3d241c] mb-1">${p.name}</h3>
                                
                                <p class="text-xs text-[#ff91a4] font-black mb-1">${p.category || 'صنف فاخر'}</p>
                                ${p.flavors ? `<p class="text-[11px] text-[#ff91a4] font-bold border-t border-dashed border-[#fff5f6] pt-1 mb-2 leading-relaxed">${p.flavors}</p>` : ''}
                                
                                <p class="text-xs text-gray-500 mb-4 leading-relaxed product-desc" style="white-space: normal; overflow-wrap: anywhere; word-break: break-word;">
                                    ${p.description || p.desc || ''}
                                </p>
                            </div>
                            
                            <div class="mt-auto flex justify-between items-center border-t border-[#ff91a4]/10 pt-4">
                                <div class="flex items-center gap-1.5 bg-gray-50 rounded-full px-2 py-1 border border-gray-100">
                                    <button onclick="window.updateTempQtyContext(this, -1)" class="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 bg-white rounded-full border border-gray-200" ${isOut ? 'disabled' : ''}>-</button>
                                    <span class="temp-qty-display text-xs font-bold w-4 text-center">1</span>
                                    <button onclick="window.updateTempQtyContext(this, 1)" class="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 bg-white rounded-full border border-gray-200" ${isOut ? 'disabled' : ''}>+</button>
                                </div>
                                
                                <div class="flex flex-col text-center items-center justify-center">
                                    ${hasDiscount ? `<span class="text-[10px] text-gray-400 line-through font-bold mb-0.5">${p.oldPrice} ج.م</span>` : ''}
                                    <span class="font-black text-lg text-[#ff91a4] leading-none">${p.price} <span class="text-xs">ج.م</span></span>
                                </div>
                                
                                <button onclick="window.addWithQtyContextAndSync(this, '${p.id}')" class="w-10 h-10 rounded-full bg-brand-pinkLight text-[#ff91a4] flex items-center justify-center hover:bg-[#ff91a4] hover:text-white border border-[#ff91a4]/20 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" ${isOut ? 'disabled' : ''}>
                                    <i data-lucide="plus" class="w-5 h-5"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    // فرض وتأمين التكبير الهندسي بنسبة 40% لبطاقات السلايدر لضمان التناسق البصري المطلق وتجنب انهيار العرض
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

// مصدة الذاكرة لمنع الوميض (Debounce Mechanism)
let uiRenderDebounceTimer = null;

export function distributeProductsToUI(products) {
    const BoseState = window.BoseState;
    const normalizeArabic = window.normalizeArabic || normalizeArabicText;
    
    // تأمين جلب المنتجات وضمان استخدام البيانات الموجودة فقط بعد التأكد من اكتمال التحميل
    const currentProducts = Array.isArray(products) && products.length ? products : (BoseState?.catalog || []);
    
    if (window.uiRenderDebounceTimer) clearTimeout(window.uiRenderDebounceTimer);
    
    window.uiRenderDebounceTimer = setTimeout(() => {
        // تحديث جميع الحاويات المستهدفة وتأمين المعرفات لعلامة حلويات بوسي
        const sections = [
            'new-arrivals-container',
            'best-sellers-container',
            'menuGrid',
            'dynamic-new-arrivals',
            'dynamic-best-sellers',
            'dynamic-categories-container'
        ];

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            const sectionTitle = el.dataset.sectionTitle || '';
            const block = BoseState?.theme?.builderLayout?.find(b => (b.containerId && b.containerId === id) || (b.title && b.title === sectionTitle));
            
            // تعديل هندسي موسع: إتاحة كامل الكتالوج ليعرض كافة المنتجات كخيار أساسي ومثالي للأقسام
            let filteredList = [...currentProducts];
            
            // التوزيع والتأكد الفني من الفلترة الذكية إن وجدت تخصيصات محددة بالبلوك
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
                    // فلترة مخصصة لقسم المنيو والـ menuGrid لضمان سحب المنتجات المرتبطة بالمنيو بدقة
                    filteredList = currentProducts.filter(p => p.category && normalizeArabic(p.category).includes('menu')).slice(0, 12);
                }
            } else {
                // بديل احتياطي ذكي يعرض كامل الكتالوج لمنع تجميد أو إفراغ الواجهة البصرية للموقع
                filteredList = [...currentProducts];
            }
            
            // عرض كافة المنتجات وتأمين الخصائص البرمجية
            filteredList = filteredList.map(p => ({
                ...p,
                inStock: p.inStock !== false && p.stock !== 0
            }));
            
            renderProductCardsUI(filteredList, id);
        });
    }, 150); // تأخير متعمد ومدروس 150 مللي ثانية لمنع الاستدعاءات المتضاربة
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
        const tickerContainer = document.getElementById('sovereign-ticker-inner');
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
        content = `تأسست حلويات بوسي في مدينة الكفاح بمركز الفرافرة... نحن نلتزم بأعلى معايير المهنية والجودة العالمية لتوفير أفخر المخبوزات والحلويات الغربية والشرقية المصنوعة يدوياً وبأعلى مقاييس الفخامة.`;
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
    
    // حفظ السلة الحالية في الذاكرة المحلية والاحتياطية لضمان الاستمرارية
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

    // إطلاق حدث التحديث المتزامن لتنبيه السلة العائمة
    window.dispatchEvent(new CustomEvent('BoseSweets_Cart_Updated', { detail: BoseState?.cart }));
    window.dispatchEvent(new CustomEvent('cart_updated'));

    // استدعاء دوال التحديث المباشرة إن كانت معرفة في المحرك الرئيسي
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
        // استخدام نظام الإضافة الأساسي الخاص بالمحرك لعلامة حلويات بوسي
        window.cartSystem.addWithQtyContext(btn, productId);
        
        // التدخل لضمان الكمية المحددة بدقة ثم مزامنة السلة العائمة
        setTimeout(() => {
            const BoseState = window.BoseState;
            if (BoseState && Array.isArray(BoseState.cart)) {
                const targetItem = BoseState.cart.find(item => item.id === productId);
                if (targetItem) {
                    targetItem.quantity = qty;
                }
                window.syncBoseCartUI();
            }
            // إعادة تعيين شاشة اختيار الكمية المؤقتة إلى 1 بعد الإضافة والمزامنة لثبات الواجهة البصرية
            if (qtyDisplay) qtyDisplay.innerText = "1";
        }, 80);
    } else {
        // نظام حماية بديل فوري في حال لم يكن المحرك الأساسي قد تم تحميله بالكامل
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

        // إعادة تعيين شاشة اختيار الكمية المؤقتة إلى 1 بعد الإضافة الناجحة
        if (qtyDisplay) qtyDisplay.innerText = "1";
    }
};

if (typeof window !== 'undefined') {
    window.renderProductCards = renderProductCardsUI;
    window.distributeProductsToUI = distributeProductsToUI;
    window.showInfo = showInfo;
}

// ============================================================================
// 🖼️ القسم التاسع: محرك العرض المرئي والشريط المتحرك (Slider Engine)
// ============================================================================

export async function fetchSliderRecords() {
    const BoseState = window.BoseState;
    const db = window.db;
    
    try {
        if (!db) return [];
        if (BoseState && BoseState.theme && BoseState.theme.sliderImages && Array.isArray(BoseState.theme.sliderImages)) {
            return BoseState.theme.sliderImages;
        }
        // استخدام استيراد ديناميكي تفادياً لأي مشاكل في الاستدعاء للواجهة البصرية لعلامة حلويات بوسي
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

export async function loadSliderImages() {
    const sliderContainer = document.getElementById('main-slider');
    if (!sliderContainer) return;
    const processBoseImage = window.processBoseImage;
    const BoseState = window.BoseState;

    try {
        const sliderData = await fetchSliderRecords();
        sliderContainer.innerHTML = '';
        if (sliderData && sliderData.length > 0) {
            sliderData.forEach(slide => {
                const slideItem = document.createElement('div');
                slideItem.className = 'slider-item-exclusive h-full w-full flex-shrink-0 relative';
                const sourceUrl = slide.imageUrl || slide.image || slide.img || '';
                if (!sourceUrl) return;
                const processedUrl = processBoseImage ? processBoseImage(sourceUrl) : sourceUrl;
                const smartTimeStamp = slide.updatedAt || (BoseState && BoseState.theme && BoseState.theme.lastAdminUpdate) || new Date().getTime();
                const separator = processedUrl.includes('?') ? '&' : '?';
                const finalImageUrl = `${processedUrl}${separator}v=${smartTimeStamp}`;
                slideItem.innerHTML = `<img src="${finalImageUrl}" class="w-full h-full object-cover rounded-[24px]">`;
                sliderContainer.appendChild(slideItem);
            });
            if (typeof window.initSliderEffects === 'function') {
                window.initSliderEffects();
            }
        }
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'ui-engine.js', null, null, 'loadSliderImages');
    }
}

if (typeof window !== 'undefined') {
    window.loadSliderImages = loadSliderImages;
    window.fetchSliderRecords = fetchSliderRecords;
}

// ============================================================================
// 💐 القسم العاشر: محاكي التنسيق الفاخر وتكاملات السلة (Simulator Integration)
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

// ============================================================================
// 🎂 ربط محاكي التورتات المخصص بالسلة مباشرة ومزامنة الخيارات
// ============================================================================

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
            ${opts["رابط_الصورة_التذكارية"] ? `
                <div class="pt-2 text-left">
                    <a href="${opts["رابط_الصورة_التذكارية"]}" target="_blank" class="inline-flex items-center gap-1 bg-[#ff91a4] text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:opacity-90 transition-all">
                        عرض وتحميل الصورة المرفوعة
                    </a>
                </div>
            ` : ''}
        </div>
    `;
};

// ============================================================================
// 🔒 القسم الحادي عشر: جاهزية النظام والتشغيل التلقائي (Bootloader)
// ============================================================================

if (typeof window !== 'undefined') {
    window.renderProductCards = renderProductCardsUI; 
    window.distributeProductsToUI = distributeProductsToUI;
    
    // تأكيد استدعاء المتغيرات من المحرك الأساسي لضمان التوافق المطلق
    if (window.cartSystem) window.cartSystem = window.cartSystem;
    if (window.BoseState) window.BoseState = window.BoseState;
}

document.addEventListener('DOMContentLoaded', () => {
    // حقن وتوثيق خصائص التنسيق الخاصة لضمان منع اقتطاع النصوص في المتصفح تلقائياً وحماية السلايدرات
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
            .bose-horizontal-slider > div {
                flex: 0 0 auto !important;
                scroll-snap-align: start;
                width: auto;
            }
            /* تأمين السلايدر ليكون مغناطيسياً، مع إخفاء شريط التمرير المزعج برمجياً لتأمين تجربة مستخدم فاخرة */
            .bose-horizontal-slider {
                display: flex !important;
                overflow-x: auto !important;
                scroll-snap-type: x mandatory !important;
                -webkit-overflow-scrolling: touch !important;
                scrollbar-width: none !important;
            }
            .bose-horizontal-slider::-webkit-scrollbar {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    } catch (e) {
        console.error("فشل حقن التنسيقات الإضافية لحماية النصوص وهندسة السلايدر لعلامة حلويات بوسي:", e);
    }

    // استدعاء دالة التهيئة المربوطة من المحرك الأساسي
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

// 👑 مستمع البث اللحظي لإعادة رسم المنتجات فور تعديلها من لوحة الإدارة لضمان تحديث الكتالوج مباشرة من فايربيز بعد اكتمال التحميل
window.addEventListener('BoseSweets_Catalog_Updated', () => {
    if (typeof window.distributeProductsToUI === 'function') {
        window.distributeProductsToUI(window.BoseState?.catalog);
    }
});

// مستمع إضافي لضمان تحديث الأقسام واللوجستيات فوراً في الواجهة البصرية لـ BoseSweets
window.addEventListener('BoseSweets_Logistics_Updated', () => {
    if (typeof window.applyLogisticsRulesUI === 'function') {
        window.applyLogisticsRulesUI();
    }
});

console.log("👑 BoseSweets Engine: تم ترقية المحرك الموحد بنجاح للإصدار السيادي (V40.3 Premium) مع تأمين السلايدر، ومرونة توزيع الفئات، وتصفير العداد التلقائي.");