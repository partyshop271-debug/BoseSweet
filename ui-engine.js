/**
 * ============================================================================
 * 👑 BoseSweets UI Visual Engine | محرك التفاعل وواجهة المستخدم (V39.2 - مطور)
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي (The Management)
 * الحالة: نظام عرض ذكي، محرك سلة محمي، توافق تام، وأداء فائق باستهلاك بيانات منخفض.
 * ============================================================================
 */

const getBoseState = () => window.BoseState || { catalog: [], theme: {}, cart: [], catalogMap: new Map(), checkoutState: {}, shippingZones: [] };
const safeImage = (img) => window.processBoseImage ? window.processBoseImage(img) : img;
const getBranding = () => window.boseConfig?.branding?.colors || { pink: "#ff91a4", dark: "#1a1a1a", white: "#FFFFFF" };

// ============================================================================
// 🛒 القسم الخامس: محرك السلة السيادي (Cart System)
// ============================================================================

export const cartSystem = {
    getAdjustedPrice: function(basePrice) { return Math.round(parseFloat(basePrice)); },
    getCart: function() {
        const state = getBoseState();
        const localCart = localStorage.getItem('BoseSweets_Cart') || localStorage.getItem('bose_cart_storage');
        if (localCart) { 
            const parsed = JSON.parse(localCart); 
            state.cart = parsed; 
            return parsed; 
        }
        return state.cart || [];
    },
    saveCartToStorage: function() { 
        const state = getBoseState();
        if(typeof window.saveToLocalMemory === 'function') {
            window.saveToLocalMemory('BoseSweets_Cart', state.cart);
            window.saveToLocalMemory('bose_cart_storage', state.cart);
        } else {
            localStorage.setItem('BoseSweets_Cart', JSON.stringify(state.cart));
        }
        this.updateCartDisplay();
        if(typeof window !== 'undefined') window.dispatchEvent(new Event('BoseSweets_Cart_Updated'));
    },
    save: function() {
        this.saveCartToStorage();
    },
    clearCartStorage: function() { 
        getBoseState().cart = []; 
        this.saveCartToStorage(); 
        if(typeof this.syncCartUI === 'function') this.syncCartUI(); 
    },
    calculateCartTotal: function(deliveryMode = 'الاستلام من المقر') {
        this.getCart();
        const state = getBoseState();
        if (state.securityLayer?.validateCartPrices) state.cart = state.securityLayer.validateCartPrices(state.cart);
        let subtotal = 0;
        
        state.cart.forEach(item => {
            const product = state.catalogMap.get(String(item.id)) || state.catalog.find(p => String(p.id) === String(item.id));
            let finalPrice = this.getAdjustedPrice(product ? product.price : item.price);
            let qty = parseInt(item.quantity || item.qty) || 1;
            let addonsPrice = 0;
            if (item.isCustomCake || item.isCustom) {
                if (item.printing?.includes('أكل') || item.details?.printType === 'edible') addonsPrice = 60;
                else if (item.printing?.includes('غير قابلة') || item.details?.printType === 'non_edible') addonsPrice = 20;
            }
            subtotal += ((finalPrice + addonsPrice) * qty);
        });

        let shippingFee = 0;
        const isPickup = deliveryMode === 'pickup' || deliveryMode === 'الاستلام من المقر' || deliveryMode === 'استلام';
        if (!isPickup) {
            const zone = state.shippingZones.find(z => z.id === deliveryMode || z.name === deliveryMode);
            shippingFee = zone ? parseFloat(zone.fee) : (deliveryMode.includes('الفرافرة') ? 25 : (deliveryMode.includes('الكفاح') ? 10 : 20));
        }
        
        return { subtotal, shippingFee, total: subtotal + shippingFee };
    },
    updateCartDisplay: function() {
        this.getCart();
        const state = getBoseState();
        const totalItems = state.cart.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
        
        if (typeof document !== 'undefined') {
            const badges = document.querySelectorAll('#cart-count-badge, #mobile-cart-badge, .cart-badge-global');
            badges.forEach(el => {
                el.innerText = totalItems;
                if(totalItems > 0) {
                    el.classList.remove('hidden');
                    el.style.display = 'flex';
                } else {
                    el.classList.add('hidden');
                    el.style.display = 'none';
                }
            });
        }
    },
    syncCartUI: function() {
        const cartList = document.getElementById('cart-items-list');
        if (!cartList) return;
        const state = getBoseState();
        const colors = getBranding();
        const fallback = window.boseConfig?.branding?.colors?.pink || "#ff91a4";

        if (state.securityLayer?.validateCartPrices) state.cart = state.securityLayer.validateCartPrices(state.cart);
        if (state.cart.length === 0) {
            cartList.innerHTML = `<div class="empty-cart flex flex-col items-center justify-center p-12 text-center"><i data-lucide="shopping-bag" class="w-20 h-20 mb-4 opacity-20" style="color: ${colors.pink || fallback};"></i><h3 class="text-xl font-black mb-2">سلة المشتريات فارغة</h3></div>`;
            ['summary-subtotal', 'summary-total'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = '0 ج.م'; });
            if (window.lucide) window.lucide.createIcons(); return;
        }
        let html = '';
        state.cart.forEach((item, index) => {
            let finalPrice = this.getAdjustedPrice(item.price);
            let qty = parseInt(item.quantity || item.qty) || 1;
            if (item.isCustomCake || item.isCustom) {
                finalPrice += (item.printing?.includes('أكل') || item.details?.printType === 'edible') ? 60 : ((item.printing?.includes('غير قابلة') || item.details?.printType === 'non_edible') ? 20 : 0);
            }
            const imgUrl = safeImage(item.image || item.img);
            // إضافة loading="lazy" لتقليل استهلاك البيانات دون المساس بالهيكل
            html += `<div class="cart-item bg-white p-4 rounded-2xl border mb-4 flex gap-4 items-center" style="border-color: ${colors.pink || fallback}20;">
                        <img src="${imgUrl}" loading="lazy" class="w-20 h-20 rounded-xl object-cover" onerror="this.src='https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';">
                        <div class="flex-1 text-right"><h4 class="font-black text-sm">${item.name}</h4><div class="font-black mt-2" style="color: ${colors.pink || fallback};">${finalPrice} ج.م</div></div>
                        <div class="flex flex-col items-center gap-2">
                            <button onclick="window.cartSystem.modQ(${index}, 1)" class="w-8 h-8 rounded-full border text-black bg-white">+</button>
                            <span class="font-black text-sm">${qty}</span>
                            <button onclick="window.cartSystem.modQ(${index}, -1)" class="w-8 h-8 rounded-full border text-black bg-white">-</button>
                        </div>
                    </div>`;
        });
        cartList.innerHTML = html;
        const totals = this.calculateCartTotal(document.getElementById('checkout-area')?.value || state.checkoutState.deliveryMethod);
        if(document.getElementById('summary-subtotal')) document.getElementById('summary-subtotal').innerText = `${totals.subtotal} ج.م`;
        if(document.getElementById('summary-total')) document.getElementById('summary-total').innerText = `${totals.total} ج.م`;
    },
    modQ: function(index, delta) {
        this.getCart();
        const state = getBoseState();
        if (state.cart[index]) {
            let qty = state.cart[index].quantity || state.cart[index].qty || 1;
            qty += delta;
            if (qty <= 0) {
                state.cart.splice(index, 1);
            } else {
                if (qty > 50) qty = 50;
                state.cart[index].quantity = qty;
                state.cart[index].qty = qty; 
            }
            this.saveCartToStorage(); 
            this.syncCartUI();
        }
    },
    addWithQtyContext: function(btn, productId) {
        const state = getBoseState();
        const wrapper = btn.closest('.catalog-item') || btn.closest('.catalog-card-wrapper') || btn.closest('.royal-card') || btn.closest('.product-card') || btn.closest('.product-info-content') || btn.parentElement.parentElement;
        const qtyDisplay = wrapper ? wrapper.querySelector('.temp-qty-display') : null;
        const qty = qtyDisplay ? parseInt(qtyDisplay.innerText) : 1;

        const product = state.catalog.find(p => String(p.id) === String(productId)) || state.catalogMap.get(String(productId));
        if (!product) return;

        const existingItemIdx = state.cart.findIndex(item => String(item.id) === String(productId) && !item.isCustomCake && !item.isCustom);
        if (existingItemIdx > -1) {
            state.cart[existingItemIdx].quantity = (state.cart[existingItemIdx].quantity || 1) + qty;
            state.cart[existingItemIdx].qty = state.cart[existingItemIdx].quantity;
        } else {
            state.cart.push({ 
                id: product.id, 
                name: product.name, 
                price: parseFloat(product.price) || 0, 
                image: product.img || product.image || "", 
                quantity: qty, 
                qty: qty, 
                isCustomCake: false, 
                isCustom: false,
                category: product.category || ''
            });
        }
        
        this.saveCartToStorage();
        if(qtyDisplay) qtyDisplay.innerText = "1"; 
        if(typeof window.showSystemToast === 'function') {
            window.showSystemToast(`تمت إضافة [${product.name}] بنجاح إلى السلة.`, 'success');
        }
        window.dispatchEvent(new CustomEvent('BoseSweets_Cart_Updated'));
    }
};

if (typeof window !== 'undefined') {
    window.cartSystem = cartSystem;
    window.addEventListener('BoseSweets_Order_Secured', () => cartSystem.clearCartStorage());
    document.addEventListener('DOMContentLoaded', () => cartSystem.updateCartDisplay());
    window.addEventListener('BoseSweets_Cart_Updated', () => cartSystem.updateCartDisplay());
}

// ============================================================================
// 🎨 القسم الثامن: واجهة المستخدم والتحكم البصري والرسم الهندسي (UI Logic)
// ============================================================================

export function renderProductCardsUI(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = getBoseState();
    const sectionTitle = container.dataset.sectionTitle || '';
    const currentLayoutBlock = state.theme?.builderLayout?.find(b => b.title === sectionTitle);
    
    const defaultWidth = currentLayoutBlock?.cardWidth || 280;
    const defaultHeight = currentLayoutBlock?.cardHeight || 350;

    container.innerHTML = products.map(p => {
        const isOut = p.inStock === false;
        
        const customWidth = p.cardWidth || defaultWidth;
        const customHeight = p.cardHeight || defaultHeight;
        
        const isFullSpan = p.gridSpan === 'full';
        const spanClass = isFullSpan ? 'col-span-full w-full' : 'col-span-1 w-full sm:w-auto';
        
        const displayMode = (p.displayStyle === 'half') ? 'layout-half' : 'layout-full';
        
        const hasDiscount = p.hasDiscount === true && p.oldPrice > p.price;
        const currentPrice = parseFloat(p.price) || 0;
        const img = safeImage(p.img || p.image);

        // تم دمج loading="lazy" في الصورة لرفع الكفاءة وتخفيض التحميل
        return `
            <div class="catalog-card-wrapper ${spanClass} p-3 ${displayMode}" data-id="${p.id}" style="max-width: ${isFullSpan ? '100%' : customWidth + 'px'}; width: 100%;">
                <div class="catalog-item royal-card ${isOut ? 'out-of-stock opacity-60 grayscale' : ''} bg-white border border-[#fff5f6] rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col h-full">
                    ${hasDiscount && !isOut ? `<div class="absolute top-4 right-4 bg-[#ff91a4] text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-sm z-10">عرض خاص 🔥</div>` : ''}
                    
                    <div class="product-image-container overflow-hidden bg-[#fff5f6] relative border-b border-[#fff5f6]" style="height: ${customHeight}px; width: 100%;">
                        <img src="${img}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" alt="${p.name || ''}" onerror="this.src='https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg'">
                        ${isOut ? '<div class="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white font-black text-lg">نفذت الكمية 🚫</div>' : ''}
                    </div>

                    <div class="p-6 flex flex-col flex-grow">
                        <div class="flex justify-between items-start mb-3 gap-2">
                            <span class="bg-[#fff5f6] text-[#ff91a4] px-3 py-1 rounded-full text-xs font-black shrink-0">${p.category || 'عام'}</span>
                            <div class="text-right shrink-0">
                                ${hasDiscount ? `<span class="block text-gray-400 line-through text-xs font-bold mb-0.5">${p.oldPrice} ج.م</span>` : ''}
                                <span class="font-black text-lg ${hasDiscount ? 'text-[#f43f5e]' : 'text-[#3d241c]'}">${currentPrice} <span class="text-xs">ج.م</span></span>
                            </div>
                        </div>

                        <h4 class="font-bold text-lg text-[#3d241c] mb-2 leading-tight">${p.name || ''}</h4>
                        <p class="text-xs text-gray-500 font-bold line-clamp-2 mb-4 flex-grow">${p.description || p.desc || ''}</p>
                        
                        ${p.flavors ? `<p class="text-[11px] text-[#ff91a4] font-bold border-t border-dashed border-[#fff5f6] pt-2 mb-4 leading-relaxed">${p.flavors}</p>` : ''}

                        <div class="pt-4 mt-auto border-t border-[#fff5f6] flex items-center justify-between gap-3">
                            <div class="flex items-center gap-2 bg-gray-50 rounded-full px-2">
                                <button onclick="window.updateTempQtyContext(this, -1)" class="w-6 h-6">-</button>
                                <span class="temp-qty-display">1</span>
                                <button onclick="window.updateTempQtyContext(this, 1)" class="w-6 h-6">+</button>
                            </div>
                            <button onclick="window.cartSystem.addWithQtyContext(this, '${p.id}')" class="flex-1 py-2 bg-[#ff91a4] text-white rounded-full text-xs font-black">إضافة إلى السلة 🛍️</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

export function distributeProductsToUI(products = getBoseState().catalog) {
    const state = getBoseState();
    ['new-arrivals-container', 'best-sellers-container', 'menuGrid'].forEach(id => {
        const el = document.getElementById(id); 
        if (el) {
            const sectionTitle = el.dataset.sectionTitle || '';
            const block = state.theme?.builderLayout?.find(b => b.title === sectionTitle);
            let filteredList = [...products];

            if (block && block.dataSource) {
                if (block.dataSource.startsWith('category:')) {
                    const catName = block.dataSource.split(':')[1];
                    const normalizedCatName = window.normalizeArabic ? window.normalizeArabic(catName) : catName;
                    filteredList = products.filter(p => p.category && (window.normalizeArabic ? window.normalizeArabic(p.category) : p.category) === normalizedCatName);
                } else if (block.dataSource === 'latest') {
                    filteredList = [...products].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 12);
                } else if (block.dataSource === 'bestsellers') {
                    filteredList = products.filter(p => p.hasDiscount === true).slice(0, 12);
                }
            } else {
                filteredList = products.slice(0, 12);
            }
            renderProductCardsUI(filteredList, id);
        }
    });
}

export function applyThemeConfigUI() {
    const themeData = getBoseState().theme;
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
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'ui-engine.js', null, null, 'toggleSidebar');
    }
};

export const showInfo = function(type) {
    const colors = getBranding();
    let title = "", content = "";
    if (type === 'about') {
        title = "عن علامة حلويات بوسي";
        content = `تأسست حلويات بوسي عام 2014 في مدينة الكفاح... نحن نلتزم بأعلى معايير المهنية والجودة العالمية لتوفير أفخر المخبوزات والحلويات الغربية والشرقية المصنوعة يدوياً وبأعلى مقاييس الفخامة.`;
    }
    const modalId = 'bose-info-modal'; let modal = document.getElementById(modalId);
    if (!modal) { 
        modal = document.createElement('div'); 
        modal.id = modalId; 
        modal.className = 'fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300'; 
        document.body.appendChild(modal); 
    }
    modal.innerHTML = `<div class="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden p-8 border-4" style="border-color: ${colors.pink || '#ff91a4'}20;">
        <h3 class="text-2xl font-black mb-6 text-center">${title}</h3>
        <p class="text-base font-bold text-right leading-relaxed">${content}</p>
        <button onclick="document.getElementById('${modalId}').remove()" class="w-full mt-8 py-4 rounded-full font-black text-white" style="background: ${colors.pink || '#ff91a4'};">تم الاستيعاب</button>
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

if (typeof window !== 'undefined') {
    window.renderProductCards = renderProductCardsUI; 
    window.distributeProductsToUI = distributeProductsToUI;
    window.showInfo = showInfo;
}

// ============================================================================
// 🖼️ القسم التاسع: محرك العرض المرئي والشريط المتحرك (Slider Engine) - التحديث V39.2
// ============================================================================

export async function fetchSliderRecords() {
    try {
        const state = getBoseState();
        if (typeof window.db === 'undefined' || !window.db) return [];
        if (state.theme && state.theme.sliderImages && Array.isArray(state.theme.sliderImages)) {
            return state.theme.sliderImages;
        }
        
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        const sliderSnap = await getDocs(collection(window.db, 'sliders'));
        
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

    try {
        const state = getBoseState();
        const sliderData = await fetchSliderRecords(); 
        
        sliderContainer.innerHTML = ''; 

        if (sliderData && sliderData.length > 0) {
            sliderData.forEach(slide => {
                const slideItem = document.createElement('div');
                slideItem.className = 'slider-item-exclusive h-full w-full flex-shrink-0 relative';

                const sourceUrl = slide.imageUrl || slide.image || slide.img || '';
                if (!sourceUrl) return;

                const processedUrl = safeImage(sourceUrl);
                
                const smartTimeStamp = slide.updatedAt || (state.theme && state.theme.lastAdminUpdate) || new Date().getTime();
                const separator = processedUrl.includes('?') ? '&' : '?';
                const finalImageUrl = `${processedUrl}${separator}v=${smartTimeStamp}`;

                slideItem.innerHTML = `<img src="${finalImageUrl}" loading="lazy" alt="${slide.alt || 'عرض حلويات بوسي'}" class="w-full h-full object-cover rounded-[24px]">`;
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
    window.fetchSliderRecords = fetchSliderRecords;
    window.loadSliderImages = loadSliderImages;
}

// ============================================================================
// 🔒 القسم العاشر: جاهزية النظام والتشغيل التلقائي (Bootloader)
// ============================================================================

if (typeof window !== 'undefined') {
    window.renderProductCards = renderProductCardsUI; 
    window.distributeProductsToUI = distributeProductsToUI;
    window.cartSystem = cartSystem;
}

document.addEventListener('DOMContentLoaded', () => {
    if(typeof window.initializeSovereignSync === 'function') window.initializeSovereignSync();
    setTimeout(() => {
        if (typeof window.loadSliderImages === 'function') window.loadSliderImages();

        if(window.BoseState) window.BoseState.isAppReady = true;
        if(typeof window.setAppReady === 'function') window.setAppReady();
        window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready'));
    }, 500);
});

// ============================================================================
// ربط وتكامل محاكي التنسيق البصري مع المحرك الموحد - حلويات بوسي
// ============================================================================

if (typeof boseEngineRegistry !== 'undefined') {
    boseEngineRegistry.registerModule('bouquetSimulator', {
        init: function() {
            // وحدة محاكي التنسيق مهيأة
        },
        validate: function(data) {
            return data && data.material && data.density >= 10;
        }
    });
}

function integrateSimulatorWithCart(simulatorData) {
    if (!simulatorData || !simulatorData.totalPrice) {
        if (window.BoseMonitor) window.BoseMonitor.report(new Error("بيانات التنسيق غير مكتملة"), 'ui-engine.js', null, null, 'integrateSimulatorWithCart');
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

    if (typeof boseCartEngine !== 'undefined' && typeof boseCartEngine.addItem === 'function') {
        boseCartEngine.addItem(cartItem);
    } else if (typeof globalCart !== 'undefined' && Array.isArray(globalCart)) {
        globalCart.push(cartItem);
        if (typeof updateCartUI === 'function') updateCartUI();
    } else {
        const state = getBoseState();
        if(state.cart) {
            state.cart.push(cartItem);
            cartSystem.saveCartToStorage();
        } else {
            let localCart = JSON.parse(localStorage.getItem('bose_cart')) || [];
            localCart.push(cartItem);
            localStorage.setItem('bose_cart', JSON.stringify(localCart));
        }
    }

    window.location.href = 'cart.html';
    return true;
}

if (typeof window !== 'undefined') {
    window.addToCart = integrateSimulatorWithCart;
}

// ============================================================================
// المحرك الإداري للوحة التحكم وتفكيك طلبات التنسيق - حلويات بوسي
// ============================================================================

window.saveBoseSimulatorSettings = async function() {
    if (typeof window.db === 'undefined' || !window.db) {
        if (window.BoseMonitor) window.BoseMonitor.report(new Error("قاعدة بيانات فايربيز غير معرفة"), 'ui-engine.js', null, null, 'saveBoseSimulatorSettings');
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
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        await setDoc(doc(window.db, 'settings', 'simulator_config'), simulatorSettings, { merge: true });
    } catch (error) {
        if (window.BoseMonitor) window.BoseMonitor.report(error, 'ui-engine.js', null, null, 'saveBoseSimulatorSettings Cloud Error');
        localStorage.setItem('bose_simulator_config', JSON.stringify(simulatorSettings));
    }
};

window.parseCustomBouquetOrder = function(item) {
    if (!item || item.metadata?.source !== "visual-simulator") return '';

    const opts = item.options || {};
    const additionals = Array.isArray(opts["اللمسات الفاخرة"]) ? opts["اللمسات الفاخرة"].join(' | ') : 'لا يوجد';
    
    return `
        <div class="mt-3 p-4 bg-[#1a1012] rounded-xl border border-[#42282d] text-xs text-[#e0c8cc] space-y-2">
            <p class="text-[#ff91a4] font-black flex items-center gap-1">
                💐 تفكيك بنود بوكيه التنسيق المخصص (دقة التنفيذ):
            </p>
            <div class="grid grid-cols-2 gap-y-1 text-[11px]">
                <p>• الخامة الأساسية: <span class="text-white font-bold">${opts["الخامة الأساسية"] || 'طبيعي'}</span></p>
                <p>• اللون المطلوب: <span class="text-white font-bold">${opts["اللون الأساسي"] || 'أحمر'}</span></p>
                <p>• الكثافة والعدد: <span class="text-white font-bold">${opts["كثافة التنسيق"] || '15 وردة'}</span></p>
                <p>• السعر الإجمالي المعتمد: <span class="text-[#ff91a4] font-bold">${item.price} ج.م</span></p>
            </div>
            <p class="text-[11px] border-t border-[#42282d] pt-1 mt-1">
                • اللمسات الفاخرة المرفقة: <span class="text-white">${additionals}</span>
            </p>
            ${opts["رابط_الصورة_التذكارية"] ? `
                <div class="pt-2">
                    <a href="${opts["رابط_الصورة_التذكارية"]}" target="_blank" class="inline-flex items-center gap-1 bg-[#ff91a4] text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:opacity-90 transition-all">
                        عرض وتحميل الصورة التذكارية المرفوعة بدقة الطباعة
                    </a>
                </div>
            ` : ''}
        </div>
    `;
};