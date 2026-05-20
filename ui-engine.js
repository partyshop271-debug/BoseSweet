/**
 * ============================================================================
 * 👑 BoseSweets Sovereign UI Engine | محرك الواجهة البصرية السيادي
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي (The Management)
 * الحالة: التحكم الكامل في الهيكل البصري وتوزيع المحتوى والربط مع المحرك الأساسي.
 * ============================================================================
 */

// 🔗 جسر الربط السيادي مع المحرك الأساسي (Core Bridge)
// نعتمد على استدعاء هذا الملف بعد core-engine.js لضمان توفر البيانات
const BOSE_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg";

// ============================================================================
// 🎨 القسم الثامن: واجهة المستخدم والتحكم البصري والرسم الهندسي (UI Logic)
// ============================================================================

export function renderProductCardsUI(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const boseConfig = window.boseConfig;
    const processBoseImage = window.processBoseImage;
    const BoseState = window.BoseState;

    // رصد بيئة الحاوية بذكاء لتحديد نوع الهندسة المطلوبة (سلايدر أفقي أم شبكة رأسية)
    const isSliderContainer = container.classList.contains('bose-horizontal-slider') || container.classList.contains('snap-x');

    const sectionTitle = container.dataset.sectionTitle || '';
    const currentLayoutBlock = BoseState.theme.builderLayout?.find(b => b.title === sectionTitle);
    const defaultWidth = currentLayoutBlock?.cardWidth || 280;
    const defaultHeight = currentLayoutBlock?.cardHeight || 350;

    container.innerHTML = products.map(p => {
        const isOut = p.inStock === false;
        const customWidth = p.cardWidth || defaultWidth;
        const customHeight = p.cardHeight || defaultHeight;
        
        const isDonutOrCinnabon = p.category && (p.category.includes('دوناتس') || p.category.includes('سينابون') || p.category.includes('ديسباسيتو') || p.category.includes('قشطوطة') || p.category.includes('كبات السعادة'));
        const isRoyalItem = p.category && (p.category.includes('تورت') || p.category.includes('جاتوهات') || p.category.includes('ورد'));
        
        let isFullSpan = p.gridSpan === 'full' || p.displayStyle === 'full' || isRoyalItem;
        if (isDonutOrCinnabon) isFullSpan = false;

        // التدخل الهندسي الحاسم: فصل مسار السلايدر عن مسار الشبكة لمنع انهيار التصميم
        let spanClass = '';
        let widthStyle = '';
        
        if (isSliderContainer) {
            spanClass = 'snap-start flex-shrink-0'; // يمنع الانكماش ويسمح بالتمرير
            widthStyle = `width: ${isFullSpan ? '85vw' : customWidth + 'px'}; max-width: 100%; margin: 0 auto;`;
        } else {
            spanClass = isFullSpan ? 'col-span-full w-full' : 'col-span-1 w-full';
            widthStyle = `max-width: ${isFullSpan ? '100%' : customWidth + 'px'}; margin: 0 auto; width: 100%;`;
        }

        const hasDiscount = p.hasDiscount === true && p.oldPrice > p.price;
        const img = processBoseImage ? processBoseImage(p.img || p.image) : (p.img || p.image || BOSE_LOGO_FALLBACK);

        return `
            <div class="catalog-card-wrapper ${spanClass} p-2" style="${widthStyle}">
                <div class="bose-double-wrap group h-full block text-decoration-none relative bg-white rounded-[32px] border-2 border-[#ff91a4] p-1.5 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="bose-double-inner bg-white h-full flex flex-col rounded-[26px] overflow-hidden">
                        <div class="w-full overflow-hidden bg-brand-pinkLight border-b border-[#ff91a4]/20 relative" style="height: ${customHeight}px">
                            <img src="${img}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
                            ${hasDiscount && !isOut ? `<div class="absolute top-4 right-4 bg-[#ff91a4] text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-sm z-10">عرض خاص 🔥</div>` : ''}
                            ${isOut ? '<div class="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white font-black text-lg">نفذت الكمية 🚫</div>' : ''}
                        </div>
                        <div class="p-5 flex flex-col flex-grow text-right bg-white justify-between">
                            <div>
                                <h3 class="font-bold text-lg text-[#3d241c] mb-1 truncate">${p.name}</h3>
                                <p class="text-xs text-[#ff91a4] font-black mb-2">${p.category || 'صنف فاخر'}</p>
                                <p class="text-xs text-gray-500 line-clamp-2 mb-4">${p.description || p.desc || ''}</p>
                                ${p.flavors ? `<p class="text-[11px] text-[#ff91a4] font-bold border-t border-dashed border-[#fff5f6] pt-2 mb-4 leading-relaxed">${p.flavors}</p>` : ''}
                            </div>
                            <div class="mt-auto flex justify-between items-center border-t border-[#ff91a4]/10 pt-4">
                                <div class="flex flex-col">
                                    ${hasDiscount ? `<span class="text-xs text-gray-400 line-through font-bold mb-0.5">${p.oldPrice} ج.م</span>` : ''}
                                    <span class="font-black text-xl text-[#ff91a4]">${p.price} <span class="text-xs">ج.م</span></span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center gap-1.5 bg-gray-50 rounded-full px-2 py-1 border border-gray-100">
                                        <button onclick="window.updateTempQtyContext(this, -1)" class="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 bg-white rounded-full border border-gray-200">-</button>
                                        <span class="temp-qty-display text-xs font-bold w-4 text-center">1</span>
                                        <button onclick="window.updateTempQtyContext(this, 1)" class="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-500 bg-white rounded-full border border-gray-200">+</button>
                                    </div>
                                    <button onclick="window.cartSystem.addWithQtyContext(this, '${p.id}')" class="w-10 h-10 rounded-full bg-brand-pinkLight text-[#ff91a4] flex items-center justify-center hover:bg-[#ff91a4] hover:text-white border border-[#ff91a4]/20 transition-colors shadow-sm cursor-pointer" ${isOut ? 'disabled' : ''}>
                                        <i data-lucide="plus" class="w-5 h-5"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

// مصدة الذاكرة لمنع الوميض (Debounce Mechanism)
let uiRenderDebounceTimer = null;

export function distributeProductsToUI(products) {
    const BoseState = window.BoseState;
    const normalizeArabic = window.normalizeArabic;
    
    // تأمين جلب المنتجات إذا لم يتم تمريرها
    const currentProducts = products || (BoseState ? BoseState.catalog : []);
    
    if (uiRenderDebounceTimer) clearTimeout(uiRenderDebounceTimer);
    
    uiRenderDebounceTimer = setTimeout(() => {
        ['new-arrivals-container', 'best-sellers-container', 'menuGrid'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const sectionTitle = el.dataset.sectionTitle || '';
                const block = BoseState?.theme?.builderLayout?.find(b => b.title === sectionTitle);
                let filteredList = [...currentProducts];
                if (block && block.dataSource) {
                    if (block.dataSource.startsWith('category:')) {
                        const catName = block.dataSource.split(':')[1];
                        const normalizedCatName = normalizeArabic ? normalizeArabic(catName) : catName;
                        filteredList = currentProducts.filter(p => p.category && (normalizeArabic ? normalizeArabic(p.category) : p.category) === normalizedCatName);
                    } else if (block.dataSource === 'latest') {
                        filteredList = [...currentProducts].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 12);
                    } else if (block.dataSource === 'bestsellers') {
                        filteredList = currentProducts.filter(p => p.hasDiscount === true).slice(0, 12);
                    }
                }
                renderProductCardsUI(filteredList, id);
            }
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
        content = `تأسست حلويات بوسي عام 2014 في مدينة الكفاح... نحن نلتزم بأعلى معايير المهنية والجودة العالمية لتوفير أفخر المخبوزات والحلويات الغربية والشرقية المصنوعة يدوياً وبأعلى مقاييس الفخامة.`;
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
        // استخدام استيراد ديناميكي تفادياً لأي مشاكل في الاستدعاء للواجهة
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
            console.log("تمت تهيئة وحدة محاكي التنسيق الفاخر بنجاح.");
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
        if (typeof window.updateCartUI === 'function') window.updateCartUI();
    } else if (BoseState && Array.isArray(BoseState.cart)) {
        BoseState.cart.push(cartItem);
        if(window.saveToLocalMemory) {
            window.saveToLocalMemory('BoseSweets_Cart', BoseState.cart);
            window.saveToLocalMemory('bose_cart_storage', BoseState.cart);
            window.saveToLocalMemory('bose_cart', BoseState.cart);
        }
    } else {
        let localCart = JSON.parse(localStorage.getItem('bose_cart_storage') || localStorage.getItem('bose_cart') || '[]');
        localCart.push(cartItem);
        localStorage.setItem('bose_cart_storage', JSON.stringify(localCart));
        localStorage.setItem('bose_cart', JSON.stringify(localCart));
    }

    window.location.href = 'cart.html';
    return true;
}

if (typeof window !== 'undefined') {
    window.addToCart = integrateSimulatorWithCart;
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

// 👑 مستمع البث اللحظي لإعادة رسم المنتجات فور تعديلها من لوحة الإدارة
window.addEventListener('BoseSweets_Catalog_Updated', () => {
    if (window.BoseState && Array.isArray(window.BoseState.catalog)) {
        if (typeof window.distributeProductsToUI === 'function') {
            window.distributeProductsToUI(window.BoseState.catalog);
        }
    }
});

// مستمع إضافي لضمان تحديث الأقسام واللوجستيات فوراً في الواجهة البصرية
window.addEventListener('BoseSweets_Logistics_Updated', () => {
    if (typeof window.applyLogisticsRulesUI === 'function') {
        window.applyLogisticsRulesUI();
    }
});

console.log("👑 BoseSweets Engine: تم ترقية المحرك الموحد وفصله تقنياً بنجاح إلى (Core) و (UI) للإصدار السيادي (V39.7 Premium).");