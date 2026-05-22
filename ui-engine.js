/**
 * ============================================================================
 * 👑 BoseSweets Sovereign UI Engine | محرك الواجهة البصرية السيادي لعلامة حلويات بوسي
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي التجاريّة (The Management)
 * الهوية البصرية المعتمدة: الوردي الفاخر (#ff91a4) | الوردي الهادئ (#fff5f6) | الأسود الناعم (#111111) للخطوط حصراً
 * الترقية والدستور: V44.0 Ultra Premium & Clean - التوافق الشامل ونقاء منطق الواجهات
 * الحالة: التحكم الكامل في الهيكل البصري، التنفس، الراحة البصرية، وتوزيع الأقسام السيادية.
 * ============================================================================
 */

import { BoseState, normalizeArabic, cartSystem, processBoseImage } from "./core-engine.js";

const BOSE_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg";

// ============================================================================
// 🎨 واجهة المستخدم والتحكم البصري والرسم الهندسي لحاويات الحقن (UI Logic)
// ============================================================================

export function renderProductCardsUI(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(products)) return;

    const currentBoseState = window.BoseState || BoseState;
    const processImg = window.processBoseImage || processBoseImage;

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
    const currentLayoutBlock = currentBoseState?.theme?.builderLayout?.find(b => (b.containerId && b.containerId === containerId) || (b.title && b.title === sectionTitle));
    const defaultWidth = currentLayoutBlock?.cardWidth || 280;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-12 px-4 text-center w-full bose-breathing-space">
                <div class="inline-flex items-center justify-center w-12 h-12 bg-[#fff5f6] text-[#ff91a4] rounded-full mb-3">
                    <i class="fa-solid fa-cookie-bite text-lg"></i>
                </div>
                <h3 class="text-sm font-bold text-[#111111] mb-1">الأصناف الفاخرة قيد التجهيز</h3>
                <p class="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    نقوم الآن بتحضير وتحديث هذه القائمة الطازجة من أجلك.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(p => {
        const img = processImg(p.img || p.image) || BOSE_LOGO_FALLBACK;
        const name = p.name || 'منتج حلويات بوسي';
        const category = p.category || 'صنف فاخر';
        const description = p.description || p.desc || 'نهتم بأدق التفاصيل لنقدم لكم تجربة تذوق استثنائية تعكس الجودة المطلقة لمنتجاتنا المخبوزة طازجاً.';
        const price = p.price || 'يحدد عند الطلب';
        const isOut = p.inStock === false || p.stock === 0;

        let customWidth = p.cardWidth || defaultWidth;
        
        const categoryNormalized = p.category ? normalizeArabic(p.category) : '';
        const nameNormalized = p.name ? normalizeArabic(p.name) : '';

        // فرز شبكة العرض (أعمدة ثنائية للدونات والسينابون، وعرض كامل للتورت الفاخرة والجاتوه)
        const isDonutOrCinnabon = categoryNormalized.includes('دوناتس') || 
                                  categoryNormalized.includes('سينابون') || 
                                  categoryNormalized.includes('ديسباسيتو') || 
                                  categoryNormalized.includes('قشطوطه') || 
                                  categoryNormalized.includes('كبات السعاده') ||
                                  nameNormalized.includes('دونات') ||
                                  nameNormalized.includes('سينابون');

        const isRoyalItem = categoryNormalized.includes('تورت') || 
                            categoryNormalized.includes('جاتوه') || 
                            nameNormalized.includes('تورته') || 
                            nameNormalized.includes('جاتوه');
        
        let isFullSpan = p.gridSpan === 'full' || p.displayStyle === 'full' || (isRoyalItem && containerId === 'menuGrid');
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

        return `
            <div class="catalog-card-wrapper ${spanClass} p-1 transition-all duration-300" style="${widthStyle}">
                <div class="bose-luxury-card group h-full flex flex-col bg-white rounded-xl border border-[#ff91a4]/30 p-2 text-center hover:border-[#ff91a4] transition-all duration-300 relative">
                    
                    <a href="product.html?id=${p.id || ''}" class="w-full overflow-hidden bg-[#fff5f6] rounded-xl relative aspect-square mb-3 block text-decoration-none">
                        <img src="${img}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
                        ${hasDiscount && !isOut ? `<div class="absolute top-2 right-2 bg-[#ff91a4] text-white text-[9px] px-2 py-0.5 rounded shadow-xs z-10">تميز خاص</div>` : ''}
                        ${isOut ? '<div class="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#111111] text-xs z-10 select-none">نترقب عودته</div>' : ''}
                    </a>
                    
                    <div class="flex flex-col flex-grow px-1">
                        
                        <a href="product.html?id=${p.id || ''}" class="block text-decoration-none group-hover:text-[#ff91a4] transition-colors">
                            <h3 class="text-base text-[#111111] mb-0.5 truncate">${name}</h3>
                        </a>
                        
                        <p class="text-xs text-[#ff91a4] mb-2">${category}</p>
                        
                        <p class="text-[11px] text-gray-500 mb-3 min-h-[34px] leading-relaxed product-desc line-clamp-2" style="white-space: normal; overflow-wrap: anywhere; word-break: break-word;">
                            ${description}
                        </p>
                        
                        <div class="mt-auto pt-2 border-t border-[#ff91a4]/5">
                            <div class="flex items-center justify-between gap-1 mb-2 bg-[#fff5f6] py-1 px-2 rounded-full">
                                
                                <button onclick="window.updateTempQtyContext(this, -1)" class="w-5 h-5 flex items-center justify-center text-xs bg-white text-[#ff91a4] rounded-full border border-[#ff91a4]/10 cursor-pointer select-none" ${isOut ? 'disabled' : ''}>-</button>
                                
                                <div class="flex flex-col items-center">
                                    ${hasDiscount ? `<span class="text-[9px] text-gray-400 line-through leading-none">${p.oldPrice} ج.م</span>` : ''}
                                    <span class="text-xs text-[#111111] leading-none">
                                        ${price}${typeof price === 'number' ? ' <span class="text-[10px] text-[#ff91a4]">ج.م</span>' : ''}
                                    </span>
                                </div>
                                
                                <div class="flex items-center gap-1.5">
                                    <span class="temp-qty-display text-xs text-[#111111] w-3 text-center">1</span>
                                    <button onclick="window.updateTempQtyContext(this, 1)" class="w-5 h-5 flex items-center justify-center text-xs bg-white text-[#ff91a4] rounded-full border border-[#ff91a4]/10 cursor-pointer select-none" ${isOut ? 'disabled' : ''}>+</button>
                                </div>
                                
                            </div>
                            
                            <button onclick="window.addWithQtyContextAndSync(this, '${p.id}')" class="w-full py-2 block text-center rounded-full bg-[#ff91a4] text-white text-xs hover:bg-[#ff91a4]/90 transition-all cursor-pointer border-0" ${isOut ? 'disabled' : ''}>
                                اضافة للسلة
                            </button>
                        </div>
                        
                    </div>
                </div>
            </div>`;
    }).join('');

    if (isSliderContainer) {
        const appliedWidth = Math.round(defaultWidth * 1.4); // التكبير بنسبة 40% المعتمد للسلايدرات الجانبية
        container.querySelectorAll('.catalog-card-wrapper').forEach(card => {
            card.style.width = `${appliedWidth}px`;
            card.style.flexShrink = '0';
            card.style.maxWidth = '85vw';
        });
    }

    if (window.lucide) lucide.createIcons();
}

let uiRenderDebounceTimer = null;

export function distributeProductsToUI(products) {
    const currentBoseState = window.BoseState || BoseState;
    const currentProducts = Array.isArray(products) && products.length ? products : (currentBoseState?.catalog || []);
    if (currentProducts.length === 0) return;

    if (uiRenderDebounceTimer) clearTimeout(uiRenderDebounceTimer);
    
    uiRenderDebounceTimer = setTimeout(() => {
        const baseMenuProducts = currentProducts.filter(p => p.category && !normalizeArabic(p.category).includes('ورد'));
        const baseMenuIds = baseMenuProducts.map(p => p.id);

        const bestSellersPool = currentProducts.filter(p => !baseMenuIds.includes(p.id) && (p.hasDiscount === true || p.starRating >= 4.2));
        const finalBestSellers = bestSellersPool.length ? bestSellersPool.slice(0, 6) : currentProducts.slice(2, 8);
        const bestSellersIds = finalBestSellers.map(p => p.id);

        const newArrivalsPool = currentProducts.filter(p => !baseMenuIds.includes(p.id) && !bestSellersIds.includes(p.id));
        const finalNewArrivals = newArrivalsPool.length ? newArrivalsPool.slice(0, 4) : currentProducts.slice(4, 8);

        const menuGrid = document.getElementById('menuGrid');
        if (menuGrid) {
            window.boseFullMenuProducts = baseMenuProducts.slice(0, 8); 
            renderProductCardsUI(window.boseFullMenuProducts.slice(0, 4), 'menuGrid');
            
            const viewMoreBtn = document.getElementById('bose-view-more-btn');
            if (viewMoreBtn) {
                if (window.boseFullMenuProducts.length > 4) {
                    viewMoreBtn.classList.remove('hidden');
                } else {
                    viewMoreBtn.classList.add('hidden');
                }
            }
        }

        const bestSellersSlider = document.getElementById('best-sellers-slider-container');
        if (bestSellersSlider) {
            renderProductCardsUI(finalBestSellers, 'best-sellers-slider-container');
            initializeBoseSliderDots(finalBestSellers.length, 'bestsellers-dots-container', 'best-sellers-slider-container');
        }

        const arrivalSlider = document.getElementById('arrival-section-container');
        if (arrivalSlider) {
            renderProductCardsUI(finalNewArrivals, 'arrival-section-container');
        }

        const sections = [
            'dynamic-new-arrivals',
            'dynamic-best-sellers',
            'dynamic-categories-container',
            'new-arrivals-container',
            'best-sellers-container'
        ];

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            let list = [];
            if (id.includes('best-sellers') || id.includes('bestsellers')) {
                list = finalBestSellers;
            } else if (id.includes('new-arrivals') || id.includes('arrival')) {
                list = finalNewArrivals;
            } else {
                list = currentProducts;
            }
            renderProductCardsUI(list, id);
        });

        if (typeof window.initializeBoseCategories === 'function') window.initializeBoseCategories();
        if (typeof applyThemeConfigUI === 'function') applyThemeConfigUI();
    }, 150);
}

function initializeBoseSliderDots(count, dotsContainerId, sliderContainerId) {
    const dotsContainer = document.getElementById(dotsContainerId);
    const slider = document.getElementById(sliderContainerId);
    if (!dotsContainer || !slider) return;

    let dotsHtml = '';
    for (let i = 0; i < count; i++) {
        dotsHtml += `
            <button class="bose-slider-dot w-2 h-2 rounded-full transition-all duration-300 ${i === 0 ? 'bg-[#ff91a4] w-4' : 'bg-gray-300'}" data-index="${i}"></button>
        `;
    }
    dotsContainer.innerHTML = dotsHtml;

    const dots = dotsContainer.querySelectorAll('button');
    slider.addEventListener('scroll', () => {
        const width = slider.clientWidth;
        if (width <= 0) return;
        const currentIndex = Math.round(slider.scrollLeft / width);
        dots.forEach((dot, idx) => {
            if (idx === currentIndex) {
                dot.classList.add('bg-[#ff91a4]', 'w-4');
                dot.classList.remove('bg-gray-300');
            } else {
                dot.classList.remove('bg-[#ff91a4]', 'w-4');
                dot.classList.add('bg-gray-300');
            }
        });
    });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const idx = parseInt(dot.dataset.index);
            slider.scrollTo({
                left: slider.clientWidth * idx,
                behavior: 'smooth'
            });
        });
    });
}

export function applyThemeConfigUI() {
    const currentBoseState = window.BoseState || BoseState;
    const themeData = currentBoseState ? currentBoseState.theme : null;
    if (!themeData) return;

    if (themeData.header && themeData.header.logoText) {
        document.querySelectorAll('.bose-logo-text').forEach(el => {
            el.innerText = themeData.header.logoText;
        });
    }

    if (themeData.ticker && themeData.ticker.length > 0) {
        const tickerContainer = document.getElementById('sovereign-ticker-inner') || document.getElementById('dynamic-ticker-scroll');
        if (tickerContainer) {
            tickerContainer.innerHTML = themeData.ticker.map(t => `<span class="mx-10 inline-block text-[#111111]">${t}</span>`).join('');
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

window.updateTempQtyContext = function(btn, delta) {
    const display = btn.parentElement.querySelector('.temp-qty-display');
    if (display) {
        let val = parseInt(display.innerText) + delta;
        if (val < 1) val = 1;
        if (val > 50) val = 50;
        display.innerText = val;
    }
};

window.syncBoseCartUI = function() {
    const currentBoseState = window.BoseState || BoseState;
    if (currentBoseState && currentBoseState.cart) {
        localStorage.setItem('bose_cart_storage', JSON.stringify(currentBoseState.cart));
        localStorage.setItem('bose_cart', JSON.stringify(currentBoseState.cart));
    }

    window.dispatchEvent(new CustomEvent('BoseSweets_Cart_Updated', { detail: currentBoseState?.cart }));
    if (cartSystem && typeof cartSystem.updateCartDisplay === 'function') {
        cartSystem.updateCartDisplay();
    }
};

window.addWithQtyContextAndSync = function(btn, productId) {
    const cardWrapper = btn.closest('.catalog-card-wrapper');
    const qtyDisplay = cardWrapper ? cardWrapper.querySelector('.temp-qty-display') : null;
    const qty = qtyDisplay ? parseInt(qtyDisplay.innerText) : 1;

    const originalText = btn.innerText;
    btn.innerHTML = `<i class="fa-solid fa-check ml-1.5"></i> تم التحديث`;
    btn.classList.remove('bg-[#ff91a4]');
    btn.classList.add('bg-[#fff5f6]', 'text-[#ff91a4]');
    
    const badgeContainer = document.getElementById('cart-badge-container');
    if (badgeContainer) {
        badgeContainer.classList.remove('bose-pulse');
        void badgeContainer.offsetWidth; 
        badgeContainer.classList.add('bose-pulse');
    }

    setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-[#fff5f6]', 'text-[#ff91a4]');
        btn.classList.add('bg-[#ff91a4]', 'text-white');
    }, 1200);

    const currentBoseState = window.BoseState || BoseState;
    const currentCartSystem = window.cartSystem || cartSystem;

    if (currentCartSystem && typeof currentCartSystem.addWithQtyContext === 'function') {
        currentCartSystem.addWithQtyContext(btn, productId);
        setTimeout(() => {
            if (currentBoseState && Array.isArray(currentBoseState.cart)) {
                const targetItem = currentBoseState.cart.find(item => item.id === productId);
                if (targetItem) targetItem.quantity = qty;
                window.syncBoseCartUI();
            }
            if (qtyDisplay) qtyDisplay.innerText = "1";
        }, 80);
    }
};

export async function loadSliderImages(products) {
    const sliderContainer = document.getElementById('main-slider');
    const dotsContainer = document.getElementById('slider-dots-container');
    if (!sliderContainer) return;
    
    sliderContainer.classList.remove('bose-skeleton');
    const processImg = window.processBoseImage || processBoseImage;
    const currentBoseState = window.BoseState || BoseState;
    const currentProducts = Array.isArray(products) && products.length ? products : (currentBoseState?.catalog || []);

    try {
        let sliderData = [];
        if (currentProducts.length >= 1) {
            sliderData = currentProducts.slice(0, 5).map((p, i) => ({
                id: p.id || `slide-prod-${i}`,
                imageUrl: p.img || p.image || BOSE_LOGO_FALLBACK,
                title: p.name || "إتقان فريد من نوعه منذ عام 2014"
            }));
        }

        const targetSlides = sliderData.slice(0, 5);
        let slidesHtml = '';
        let dotsHtml = '';

        targetSlides.forEach((slide, index) => {
            const sourceUrl = slide.imageUrl || '';
            const processedUrl = processImg(sourceUrl);
            const smartTimeStamp = currentBoseState?.theme?.lastAdminUpdate || new Date().getTime();
            const separator = processedUrl.includes('?') ? '&' : '?';
            const finalImageUrl = sourceUrl ? `${processedUrl}${separator}v=${smartTimeStamp}` : BOSE_LOGO_FALLBACK;
            const slideTitle = slide.title || "تميز وإتقان ممتد منذ عام 2014";

            slidesHtml += `
                <div class="slider-item-exclusive bose-slide h-full flex-shrink-0 w-screen relative snap-start transition-opacity duration-1000 ease-in-out" data-index="${index}">
                    <a href="product.html?id=${slide.id}" class="block w-full h-full text-decoration-none">
                        <img src="${finalImageUrl}" class="w-full h-full object-cover select-none pointer-events-none" style="min-height: 100%;" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8 text-right bose-breathing-space">
                            <div>
                                <h3 class="text-white text-xl md:text-2xl mb-1">${slideTitle}</h3>
                                <p class="text-[#ff91a4] text-xs md:text-sm">تميز وإتقان ممتد منذ عام 2014 بمركز الفرافرة</p>
                            </div>
                        </div>
                    </a>
                </div>
            `;

            dotsHtml += `
                <button class="bose-dot w-2 h-2 rounded-full transition-all duration-300 ${index === 0 ? 'bg-[#ff91a4] w-4' : 'bg-gray-300'}" data-slide-index="${index}" aria-label="Slide ${index + 1}"></button>
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
        }, 5000);

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

        if (sliderContainer) {
            sliderContainer.addEventListener('scroll', () => {
                const width = sliderContainer.clientWidth;
                if (width <= 0) return;
                const currentIndex = Math.round(sliderContainer.scrollLeft / width);
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
        }

    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'ui-engine.js', null, null, 'loadSliderImages');
    }
}

if (typeof window !== 'undefined') {
    window.loadSliderImages = loadSliderImages;
    window.distributeProductsToUI = distributeProductsToUI;
    window.renderProductCards = renderProductCardsUI;
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
            }
            .bose-breathing-space {
                padding: 1.5rem !important;
            }
            h1, h2, h3, h4, h5, h6, p, span, a, button {
                font-weight: 700 !important;
                max-font-weight: 700 !important;
            }
        `;
        document.head.appendChild(style);
    } catch (e) {}
});
