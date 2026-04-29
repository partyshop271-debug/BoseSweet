// ⚡ Engine Upgrade: Smart Pre-load Engine
const PreloadEngine = {
    loadedUrls: new Set(),
    ignite(catalogData, galleryData = []) {
        setTimeout(() => {
            const allUrls = [];
            catalogData.forEach(i => {
                if(i.images && i.images.length > 0) i.images.forEach(img => allUrls.push(img));
                else allUrls.push(i.img || getImgFallback(i.category));
            });
            galleryData.forEach(g => allUrls.push(g.url));
            allUrls.forEach(url => { if(url && !this.loadedUrls.has(url)) { const img = new Image(); img.src = url; this.loadedUrls.add(url); } });
        }, 3000); 
    }
};

function hexToMathHSL(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length == 4) { r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3]; } 
    else if (hex.length == 7) { r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6]; }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0;
    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60); if (h < 0) h += 360;
    return h;
}

let catalogMap = new Map();
function syncCatalogMap() { catalogMap.clear(); catalog.forEach(p => catalogMap.set(String(p.id), p)); }

function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function generateUniqueID() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

function showSystemToast(message, type = 'info') {
    const toast = document.getElementById('system-toast');
    if(!toast) return;
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    msgEl.innerText = message;
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm max-w-[90vw] text-center border border-gray-700 toast-enter ${type === 'error' ? 'bg-red-900' : (type === 'success' ? 'bg-emerald-800' : 'bg-gray-900')}`;
    iconEl.setAttribute('data-lucide', type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info'));
    if(window.lucide) lucide.createIcons();
    setTimeout(() => { toast.classList.replace('flex', 'hidden'); toast.classList.remove('toast-enter'); }, 4000);
}

const defaultSettings = {
    brandName: "حلويات بوسي", announcement: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب",
    heroTitle: "أهلاً بكم في <br class='hidden md:block'/> <span class='text-white relative inline-block mt-1 md:mt-2 drop-shadow-md'>حلويات بوسي</span>",
    heroDesc: "يسر إدارة حلويات بوسي استعراض تشكيلتها الحصرية من الأصناف الفاخرة والمُعدة بعناية فائقة لتليق بذوقكم الرفيع ومناسباتكم السعيدة.",
    footerPhone: "01097238441", footerAddress: "الكفاح، مركز الفرافرة، <br> محافظة الوادي الجديد",
    footerQuote: `"نؤمن أن الحلويات لغة للتعبير عن المحبة، لذا نصنع كل قطعة بشغف لنكون شركاءكم في أجمل اللحظات."`,
    productLayout: "grid", brandColorHex: "#ec4899", bgColor: "#ffffff", textColor: "#663b3b",
    fontFamily: "'Cairo', sans-serif", baseFontSize: 16, baseFontWeight: 400,
    tickerActive: true, tickerText: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب ✨", tickerSpeed: 20, tickerFont: "'Cairo', sans-serif", tickerColor: "#ffffff",
    cakeBuilder: { basePrice: 145, desc: "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة.", minSquare: 16, minRect: 20, flavors: ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت'], images: [], imagePrinting: [{ label: 'بدون', price: 0 }, { label: 'صورة قابلة للأكل', price: 60 }, { label: 'صورة غير قابلة للأكل', price: 20 }] }
};

const defaultShipping = [ { id: 'sh_1', name: 'الكفاح', fee: 0 }, { id: 'sh_2', name: 'أبو منقار', fee: 50 }, { id: 'sh_3', name: 'النهضة', fee: 30 }, { id: 'sh_4', name: 'مركز الفرافرة', fee: 20 } ];
let defaultCatalog = [];

async function fetchDefaultCatalog() {
    try { const response = await fetch('data.json'); defaultCatalog = await response.json(); } 
    catch (error) { console.error("تعذر تحميل الكتالوج الافتراضي:", error); }
}

let siteSettings = { ...defaultSettings };
let shippingZones = [ ...defaultShipping ];
let catalog = []; let globalOrders = []; let galleryData = []; let catMenu = [];

const dSizes = ['مثلث', 'وسط', 'كبير']; const fTypes = ['ورد طبيعي', 'ورد صناعي', 'ورد ستان', 'ورد بالصور', 'ورد بالفلوس'];
let state = { activeCat: 'تورت', dSize: 'مثلث', fType: 'ورد طبيعي', cart: [], currentShippingFee: 0, cakeBuilder: { flv: 'فانيليا', ps: 4, sh: 'دائري', trd: false, img: 'بدون', msg: '', alg: '', occ: '', refImgUrl: '', hasRefImg: false, crd: false, dlg: false } };

async function loadEngineMemory() {
    try {
        await fetchDefaultCatalog(); catalog = [...defaultCatalog];
        const catSnap = await db.collection('catalog').get();
        if (catSnap.empty) { for (let p of catalog) await NetworkEngine.safeWrite('catalog', String(p.id), p); } 
        else { catalog = []; catSnap.forEach(doc => catalog.push(doc.data())); }
        
        const orderSnap = await db.collection('orders').orderBy('timestamp', 'desc').get();
        if (!orderSnap.empty) { globalOrders = []; orderSnap.forEach(doc => globalOrders.push(doc.data())); }
        const gallerySnap = await db.collection('gallery').orderBy('timestamp', 'desc').get();
        if (!gallerySnap.empty) { galleryData = []; gallerySnap.forEach(doc => galleryData.push(doc.data())); }
        const settingsSnap = await db.collection('settings').doc('main').get();
        if (settingsSnap.exists) { siteSettings = { ...defaultSettings, ...settingsSnap.data() }; }
        const shipSnap = await db.collection('shipping').get();
        if (!shipSnap.empty) { shippingZones = []; shipSnap.forEach(doc => shippingZones.push(doc.data())); }

        if (siteSettings.catMenu && siteSettings.catMenu.length > 0) catMenu = siteSettings.catMenu;
        else catMenu = [...new Set(catalog.map(p => p.category))].filter(Boolean);
        if (!catMenu.includes('تورت')) catMenu.unshift('تورت');
        syncCatalogMap(); 
    } catch(err) { catalog = [...defaultCatalog]; syncCatalogMap(); }
    try { const savedCart = localStorage.getItem('boseSweets_cart_data'); if (savedCart) state.cart = JSON.parse(savedCart); } catch (e) { state.cart = []; }
}

async function saveEngineMemory(type) {
    try {
        if (type === 'cat' || type === 'all') localStorage.setItem('bSweets_catalog', JSON.stringify(catalog));
        if (type === 'set' || type === 'all') localStorage.setItem('bSweets_settings', JSON.stringify(siteSettings));
        if (type === 'ship' || type === 'all') localStorage.setItem('bSweets_shipping', JSON.stringify(shippingZones));
        if (type === 'gal' || type === 'all') localStorage.setItem('bSweets_gallery', JSON.stringify(galleryData));
    } catch (e) {}
}

function saveCartToStorage() { try { localStorage.setItem('boseSweets_cart_data', JSON.stringify(state.cart)); } catch (e) {} }
function clearCartStorage() { try { localStorage.removeItem('boseSweets_cart_data'); } catch (e) {} }

function applySettingsToUI() {
    const root = document.documentElement;
    const computedHue = hexToMathHSL(siteSettings.brandColorHex || '#ec4899');
    root.style.setProperty('--brand-hue', computedHue);
    root.style.setProperty('--brand-font', siteSettings.fontFamily || "'Cairo', sans-serif");
    root.style.setProperty('--base-font-size', (siteSettings.baseFontSize || 16) + 'px');
    root.style.setProperty('--base-font-weight', siteSettings.baseFontWeight || 400);
    root.style.setProperty('--site-bg', siteSettings.bgColor || '#ffffff');
    root.style.setProperty('--site-text', siteSettings.textColor || '#663b3b');
    
    const isTickerActive = siteSettings.tickerActive !== false; 
    const tickerContainer = document.getElementById('ticker-container');
    if(tickerContainer) {
        if (isTickerActive) {
            tickerContainer.classList.remove('hidden'); tickerContainer.classList.add('flex');
            root.style.setProperty('--ticker-color', siteSettings.tickerColor || '#ffffff');
            root.style.setProperty('--ticker-font', siteSettings.tickerFont || "'Cairo', sans-serif");
            root.style.setProperty('--ticker-speed', (siteSettings.tickerSpeed || 20) + 's');
            document.getElementById('dyn-ticker-text').innerText = siteSettings.tickerText || siteSettings.announcement;
        } else { tickerContainer.classList.add('hidden'); tickerContainer.classList.remove('flex'); }
    }

    if(document.getElementById('dyn-page-title')) document.getElementById('dyn-page-title').innerText = `${siteSettings.brandName} | القائمة الرسمية`;
    if(document.getElementById('dyn-brand-name')) document.getElementById('dyn-brand-name').innerText = siteSettings.brandName;
    if(document.getElementById('dyn-hero-title')) document.getElementById('dyn-hero-title').innerHTML = siteSettings.heroTitle;
    if(document.getElementById('dyn-hero-desc')) document.getElementById('dyn-hero-desc').innerText = siteSettings.heroDesc;
    if(document.getElementById('dyn-footer-brand')) document.getElementById('dyn-footer-brand').innerText = siteSettings.brandName;
    if(document.getElementById('dyn-footer-quote')) document.getElementById('dyn-footer-quote').innerText = siteSettings.footerQuote;
    if(document.getElementById('dyn-footer-phone')) document.getElementById('dyn-footer-phone').innerText = siteSettings.footerPhone;
    if(document.getElementById('dyn-footer-address')) document.getElementById('dyn-footer-address').innerHTML = siteSettings.footerAddress;

    const areaSelect = document.getElementById('cust-area');
    if(areaSelect) areaSelect.innerHTML = `<option value="" disabled selected>اختر المنطقة...</option>` + shippingZones.map(z => `<option value="${z.id}">${escapeHTML(z.name)} (+${Number(z.fee)} ج.م توصيل)</option>`).join('');
    
    if(document.getElementById('sidebar-categories')) renderCustomerSidebarCategories();
}

async function initApp() {
    await loadEngineMemory();
    const loader = document.getElementById('global-loader');
    if(loader) { loader.style.opacity = '0'; loader.style.visibility = 'hidden'; setTimeout(() => loader.style.display = 'none', 500); }
    applySettingsToUI();
    
    if(document.getElementById('gallery-customer-section')) renderCustomerGallery(); 
    if(document.getElementById('categories-nav')) renderCategories();
    if(document.getElementById('display-container')) renderMainDisplay();
    
    syncCartUI(); 
    if(window.lucide) lucide.createIcons();
    PreloadEngine.ignite(catalog, galleryData);
    
    const urlParams = new URLSearchParams(window.location.search);
    const sharedProductId = urlParams.get('product');
    if(sharedProductId && document.getElementById('display-container')) {
        const prod = catalogMap.get(sharedProductId);
        if(prod) {
            setCategory(prod.category); 
            setTimeout(() => {
                const el = document.getElementById('product-card-' + sharedProductId);
                if(el) { el.scrollIntoView({behavior: 'smooth', block: 'center'}); el.classList.add('highlight-target'); setTimeout(() => el.classList.remove('highlight-target'), 2500); }
            }, 500);
        }
    }
}

// ----------------------------------------------------
// UI Logic (Search, Menu, Cart, Cross Sell)
// ----------------------------------------------------
function toggleLiveSearch(show) {
    const overlay = document.getElementById('live-search-overlay'); const input = document.getElementById('live-search-input'); const results = document.getElementById('live-search-results');
    if (show) { overlay.classList.remove('hidden'); setTimeout(() => { overlay.classList.add('opacity-100'); input.focus(); }, 10); input.value = ''; results.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-white/50 font-bold mt-10"><i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30"></i><p>ابدأ البحث في قائمة حلويات بوسي...</p></div>`; if(window.lucide) lucide.createIcons(); } 
    else { overlay.classList.remove('opacity-100'); setTimeout(() => overlay.classList.add('hidden'), 300); }
}

function performLiveSearch(query) {
    const resultsContainer = document.getElementById('live-search-results'); const q = query.trim().toLowerCase();
    if (!q) { resultsContainer.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-white/50 font-bold mt-10"><i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30"></i><p>ابدأ البحث في قائمة حلويات بوسي...</p></div>`; if(window.lucide) lucide.createIcons(); return; }
    const matches = catalog.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)) || (p.desc && p.desc.toLowerCase().includes(q)));
    if (matches.length === 0) { resultsContainer.innerHTML = `<div class="flex flex-col items-center justify-center text-white/70 font-bold mt-10 bg-white/5 p-8 rounded-2xl"><i data-lucide="search-x" class="w-12 h-12 mb-4 text-pink-400"></i><p>لم نجد تطابق للبحث عن "${escapeHTML(query)}"</p><p class="text-xs opacity-70 mt-2">جرب البحث بكلمة مختلفة مثل "تورتة"، "نوتيلا"، "لوتس"</p></div>`; if(window.lucide) lucide.createIcons(); return; }
    resultsContainer.innerHTML = matches.map(p => {
        const imgUrl = (p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category)); const isOutOfStock = p.inStock === false;
        return `
        <div class="flex items-center gap-4 p-3 rounded-2xl bg-white shadow-sm border border-pink-100 transition-all hover:shadow-md cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}" onclick="toggleLiveSearch(false); setCategory('${p.category}'); setTimeout(()=> { const el = document.getElementById('product-card-${p.id}'); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight-target'); setTimeout(()=>el.classList.remove('highlight-target'), 2500);} }, 500);">
            <img src="${imgUrl}" class="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100 ${isOutOfStock ? 'grayscale' : ''}">
            <div class="flex-1">
                <h4 class="font-bold text-sm text-gray-800">${escapeHTML(p.name)}</h4>
                <div class="flex items-center gap-2 mt-1"><span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">${p.category}</span><span class="font-bold text-pink-600 text-sm">${Number(p.price) > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span></div>
            </div>
            <div class="px-2">${isOutOfStock ? `<span class="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100"><i data-lucide="ban" class="w-3 h-3 inline"></i> نفدت</span>` : `<button class="w-10 h-10 bg-pink-50 text-pink-500 hover:bg-pink-500 hover:text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>`}</div>
        </div>`;
    }).join('');
    if(window.lucide) lucide.createIcons();
}

function shareProduct(id, name) {
    const url = window.location.origin + window.location.pathname + '?product=' + id;
    if (navigator.share) { navigator.share({ title: siteSettings.brandName + ' - ' + name, text: 'شوف المنتج الروعة ده من حلويات بوسي!', url: url }).catch(console.error); } 
    else { navigator.clipboard.writeText(url).then(() => { showSystemToast('تم نسخ رابط المنتج بنجاح!', 'success'); }).catch(() => { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); showSystemToast('تم نسخ الرابط!', 'success'); }); }
}

function toggleCustomerMenu(show) {
    const ov = document.getElementById('customer-menu-overlay'); const sd = document.getElementById('customer-menu-sidebar');
    if (show) { ov.classList.remove('hidden'); setTimeout(() => { ov.classList.add('opacity-100'); sd.classList.remove('translate-x-full'); }, 10); } 
    else { ov.classList.remove('opacity-100'); sd.classList.add('translate-x-full'); setTimeout(() => ov.classList.add('hidden'), 500); }
}

function renderCustomerSidebarCategories() {
    const container = document.getElementById('sidebar-categories');
    if(!container) return;
    container.innerHTML = catMenu.map(c => `<button onclick="toggleCustomerMenu(false); setCategory('${c}')" class="text-right w-full p-3 rounded-xl font-bold text-sm transition-all hover:bg-gray-50 flex items-center justify-between" style="border: 1px solid hsl(var(--brand-hue), 80%, 95%); color: var(--site-text);"><span>${c === 'ورد' ? 'ورد وهدايا 💐' : (c === 'تورت' ? 'تورت وتصميم 🎂' : c)}</span><i data-lucide="chevron-left" class="w-4 h-4 opacity-50"></i></button>`).join('');
    if(window.lucide) lucide.createIcons();
}

function renderCustomerGallery() {
    const sec = document.getElementById('gallery-customer-section'); const slider = document.getElementById('gallery-slider');
    if(!sec) return;
    if (galleryData.length === 0) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');
    slider.innerHTML = galleryData.map(g => `<div class="shrink-0 cursor-pointer hover:scale-105 transition-transform" onclick="openLightbox('${g.url}')"><div class="w-32 h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-sm border" style="border-color: hsl(var(--brand-hue), 80%, 90%);"><img src="${g.url}" class="w-full h-full object-cover" loading="lazy" alt="سابقة أعمال حلويات بوسي"></div></div>`).join('');
}

function openLightbox(url) { const lb = document.getElementById('gallery-lightbox'); document.getElementById('lightbox-img').src = url; lb.classList.remove('hidden'); lb.classList.add('flex'); if(window.lucide) lucide.createIcons(); }
function closeLightbox() { const lb = document.getElementById('gallery-lightbox'); lb.classList.add('hidden'); lb.classList.remove('flex'); }

function renderCategories() {
    const el = document.getElementById('categories-nav');
    if(!el) return;
    el.innerHTML = catMenu.map(c => `<button id="cat-btn-${c.replace(/\s+/g, '-')}" onclick="setCategory('${c}')" class="whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all border-2 text-sm sm:text-base ${state.activeCat === c ? 'text-white shadow-lg scale-105 brand-gradient border-transparent' : 'border-pink-100 hover:border-pink-300'}" style="${state.activeCat === c ? '' : `background-color: var(--site-bg); color: var(--site-text); border-color: hsl(var(--brand-hue), 80%, 90%);`}">${c === 'ورد' ? 'ورد وهدايا 💐' : (c === 'تورت' ? 'تورت وتصميم 🎂' : c)}</button>`).join('');
}

function setCategory(c) { state.activeCat = c; renderCategories(); renderMainDisplay(); setTimeout(() => { const activeBtn = document.getElementById(`cat-btn-${c.replace(/\s+/g, '-')}`); if (activeBtn) { activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } }, 50); }

// 👑 نظام عرض الورد المطور: عرض متتالي سريع الاستجابة
function renderFlowerTabs(container) {
    container.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border flex flex-wrap justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">
        ${fTypes.map(f => `<button onclick="setSub('f', '${f}')" class="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.fType === f ? 'text-white shadow-md brand-gradient' : 'opacity-80 hover:opacity-100'}" style="${state.fType === f ? '' : 'color: var(--site-text);'}">${f}</button>`).join('')}
    </div>`;
}

function setSub(t, v) { 
    if(t === 's') { state.dSize = v; renderMainDisplay(); } 
    if(t === 'f') {
        state.fType = v;
        const targetSection = document.getElementById(`flower-group-${v.replace(/\s+/g, '-')}`);
        if(targetSection) targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const subTabs = document.getElementById('sub-tabs-area');
        if(subTabs) renderFlowerTabs(subTabs); 
    }
}

function renderMainDisplay() {
    const container = document.getElementById('display-container'); const subTabs = document.getElementById('sub-tabs-area');
    if(!container) return;
    subTabs.classList.add('hidden'); container.innerHTML = '';

    if (state.activeCat === 'تورت') { 
        renderCakeBuilder(container); 
    } 
    else if (state.activeCat === 'ورد') {
        // --- قسم الورد: العرض الكامل المتتالي لزيادة فرص البيع ---
        subTabs.classList.remove('hidden');
        renderFlowerTabs(subTabs);

        let flowerHtml = `<div class="flex flex-col gap-12 w-full">`;
        fTypes.forEach(type => {
            const list = catalog.filter(p => p.category === 'ورد' && (p.flowerType === type || (p.desc && p.desc.includes(type))));
            if(list.length > 0) {
                flowerHtml += `
                <div id="flower-group-${type.replace(/\s+/g, '-')}" class="space-y-6 animate-fade-in">
                    <div class="flex items-center gap-4 mb-4">
                        <h3 class="font-black text-xl text-pink-600 shrink-0">${type}</h3>
                        <div class="h-[1px] w-full bg-pink-100"></div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${list.map(p => drawProductCard(p, 'full')).join('')} 
                    </div>
                </div>`;
            }
        });
        flowerHtml += `</div>`;
        container.innerHTML = flowerHtml;
    }
    else {
        if (state.activeCat === 'ديسباسيتو') {
            subTabs.classList.remove('hidden');
            subTabs.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border flex justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">${dSizes.map(s => `<button onclick="setSub('s', '${s}')" class="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.dSize === s ? 'text-white shadow-md brand-gradient' : 'opacity-80 hover:opacity-100'}" style="${state.dSize === s ? '' : 'color: var(--site-text);'}">${s}</button>`).join('')}</div>`;
        }
        
        let list = catalog.filter(p => p.category === state.activeCat);
        if (state.activeCat === 'ديسباسيتو') list = list.filter(p => p.size === state.dSize || p.subType === state.dSize || (p.desc && p.desc.includes(state.dSize)));

        const userLayout = siteSettings.productLayout || 'grid';
        container.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-8 items-stretch">${list.map(p => drawProductCard(p, userLayout)).join('')}</div>`;
    }
    if(window.lucide) lucide.createIcons();
}

// 👑 التطوير الجذري لواجهة الكارت - Smart UX Premium Overhaul 👑
window.updateTempQty = function(id, delta) {
    const el = document.getElementById('temp-qty-' + id);
    if(el) {
        let val = parseInt(el.innerText) + delta;
        if(val < 1) val = 1; if(val > 50) val = 50;
        el.innerText = val;
    }
};

window.addWithQty = function(id) {
    const el = document.getElementById('temp-qty-' + id);
    let qty = 1; if(el) qty = parseInt(el.innerText) || 1;
    const safeId = String(id); const prod = catalogMap.get(safeId); 
    if (!prod) return;
    if (prod.inStock === false) { showSystemToast('نأسف، هذا المنتج غير متوفر حالياً.', 'error'); return; }
    const exist = state.cart.find(i => String(i.id) === safeId);
    if (exist) { exist.quantity = Number(exist.quantity) + qty; } 
    else { const newCartItem = JSON.parse(JSON.stringify(prod)); newCartItem.quantity = qty; newCartItem.cartItemId = generateUniqueID(); state.cart.push(newCartItem); }
    saveCartToStorage(); syncCartUI(); updateCardUI(safeId); calculateCartTotal(); 
    showSystemToast(`تم إضافة الكمية (${qty}) للسلة بنجاح 🛍️`, 'success');
};


function drawProductCard(p, layoutMode = 'grid') {
    const pIdSafe = String(p.id); const item = state.cart.find(i => String(i.cartItemId) === pIdSafe || String(i.id) === pIdSafe);
    let itemLayout = (p.layout && p.layout !== 'default') ? p.layout : layoutMode;
    let isFullWidth = (itemLayout === 'full');
    let colSpanClass = isFullWidth ? 'col-span-full' : '';
    const isOutOfStock = p.inStock === false;
    const imageList = (p.images && p.images.length > 0) ? p.images : [p.img || getImgFallback(p.category)];
    const hasMultipleImages = imageList.length > 1;

    const renderBtns = () => {
        if (isOutOfStock) return `<button disabled class="w-full font-bold text-xs py-3.5 rounded-xl flex justify-center items-center gap-2 bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed shadow-inner"><i data-lucide="clock" class="w-4 h-4"></i> غير متوفر حالياً</button>`;
        if (item) {
            return `
            <div class="flex items-center justify-between bg-white rounded-xl p-1.5 shadow-sm border border-pink-200 w-full">
                <button onclick="modQ('${item.cartItemId || item.id}', -1)" class="w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-90 bg-pink-50 text-pink-500 hover:bg-pink-100"><i data-lucide="${item.quantity == 1 ? 'trash-2' : 'minus'}" class="w-4 h-4"></i></button>
                <div class="flex flex-col items-center justify-center">
                    <span class="font-black text-xl leading-none text-pink-600 mt-1">${Number(item.quantity)}</span>
                    <span class="text-[10px] font-bold opacity-70 text-gray-500">تمت الإضافة للسلة</span>
                </div>
                <button onclick="modQ('${item.cartItemId || item.id}', 1)" class="w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-90 bg-pink-50 text-pink-500 hover:bg-pink-100"><i data-lucide="plus" class="w-4 h-4"></i></button>
            </div>`;
        }
        return `
        <div class="flex items-center gap-2.5 w-full">
            <div class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-1 w-[40%] shrink-0">
                <button onclick="updateTempQty('${p.id}', -1)" class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:text-pink-500 transition-colors active:scale-95"><i data-lucide="minus" class="w-3.5 h-3.5"></i></button>
                <span id="temp-qty-${p.id}" class="font-black text-sm sm:text-base text-gray-800">1</span>
                <button onclick="updateTempQty('${p.id}', 1)" class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:text-pink-500 transition-colors active:scale-95"><i data-lucide="plus" class="w-3.5 h-3.5"></i></button>
            </div>
            <button onclick="addWithQty('${p.id}')" class="flex-1 font-bold text-[12px] sm:text-sm py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-md hover:shadow-lg active:scale-95 text-white brand-gradient border-0 hover:-translate-y-0.5"><i data-lucide="shopping-bag" class="w-4 h-4"></i><span>إضافة للسلة</span></button>
        </div>`;
    };

    if (isFullWidth) {
        return `
        <div id="product-card-${p.id}" class="${colSpanClass} rounded-[2rem] shadow-sm hover:shadow-2xl border border-gray-100 flex flex-col group transition-all duration-500 overflow-hidden bg-white mb-4 hover:-translate-y-1">
            <div class="relative w-full aspect-[4/5] sm:aspect-square md:aspect-[16/9] bg-gray-50 overflow-hidden">
                <button onclick="shareProduct('${p.id}', '${escapeHTML(p.name)}')" class="absolute top-4 left-4 z-30 w-10 h-10 rounded-full shadow-lg bg-white/90 text-gray-600 flex items-center justify-center hover:scale-110 hover:text-pink-500 transition-all backdrop-blur-sm"><i data-lucide="share-2" class="w-5 h-5"></i></button>
                ${isOutOfStock ? `<div class="absolute top-4 right-4 z-30 bg-gray-900/90 text-white text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-sm shadow-xl flex items-center gap-2"><i data-lucide="ban" class="w-4 h-4 text-red-400"></i> نفدت الكمية</div>` : ''}
                ${p.badge && !isOutOfStock ? `<div class="absolute top-4 right-4 z-30 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl tracking-wide brand-gradient animate-pulse">${p.badge}</div>` : ''}
                <div id="slider-${p.id}" class="relative w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pointer-events-auto touch-pan-x snap-slider">
                    ${imageList.map(url => `<img src="${url}" class="min-w-full w-full h-full object-cover shrink-0 snap-center transition-transform duration-1000 snap-slide ${isOutOfStock ? 'grayscale-overlay' : 'group-hover:scale-105'}" loading="lazy">`).join('')}
                </div>
                ${hasMultipleImages ? `<div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">${imageList.map((_, idx) => `<div class="w-2 h-2 rounded-full ${idx === 0 ? 'bg-white opacity-100 w-4' : 'bg-white opacity-60'} shadow-md transition-all"></div>`).join('')}</div>` : ''}
            </div>
            <div class="p-6 sm:p-10 flex flex-col justify-between z-10 w-full text-center items-center max-w-4xl mx-auto">
                <span class="text-[10px] sm:text-xs font-bold px-3 py-1 rounded-lg mb-4 inline-block shadow-sm tracking-widest uppercase bg-pink-50 text-pink-600 border border-pink-100">${escapeHTML(p.category)}</span>
                <h3 class="font-black text-2xl sm:text-4xl text-gray-800 leading-tight mb-4">${escapeHTML(p.name)}</h3>
                ${p.desc ? `<p class="font-bold text-sm sm:text-lg text-gray-500 line-clamp-none leading-loose mb-8 max-w-2xl px-4">${escapeHTML(p.desc)}</p>` : ''}
                <div class="font-black text-3xl sm:text-5xl text-pink-600 drop-shadow-sm mb-8">${Number(p.price) > 0 ? Number(p.price) + ' ج.م' : 'حسب الطلب'}</div>
                <div class="w-full sm:w-2/3 md:w-1/2 mx-auto">${renderBtns()}</div>
            </div>
        </div>`;
    } else {
        return `
        <div id="product-card-${p.id}" class="rounded-[1.5rem] shadow-sm hover:shadow-xl border border-gray-100 flex flex-col group transition-all duration-300 relative overflow-hidden bg-white hover:-translate-y-1 h-full">
            <button onclick="shareProduct('${p.id}', '${escapeHTML(p.name)}')" class="absolute top-3 left-3 z-30 w-8 h-8 rounded-full shadow-md bg-white/90 text-gray-500 flex items-center justify-center hover:scale-110 hover:text-pink-500 transition-all backdrop-blur-sm"><i data-lucide="share-2" class="w-4 h-4"></i></button>
            ${isOutOfStock ? `<div class="absolute top-3 right-3 z-30 bg-gray-900/85 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-md flex items-center gap-1"><i data-lucide="ban" class="w-3 h-3 text-red-400"></i> نفدت</div>` : ''}
            <div class="aspect-square sm:aspect-[4/5] w-full relative shrink-0 bg-gray-50 overflow-hidden">
                <div id="slider-${p.id}" class="relative w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pointer-events-auto touch-pan-x snap-slider">
                    ${imageList.map(url => `<img src="${url}" class="min-w-full w-full h-full object-cover shrink-0 snap-center transition-transform duration-700 snap-slide ${isOutOfStock ? 'grayscale-overlay' : 'group-hover:scale-105'}" loading="lazy">`).join('')}
                </div>
            </div>
            <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white z-10">
                <div class="mb-5">
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded-md mb-2.5 inline-block shadow-sm bg-pink-50 text-pink-600 border border-pink-100">${escapeHTML(p.category)}</span>
                    <h4 class="font-black text-[14px] sm:text-[16px] leading-tight mb-2 line-clamp-2 text-gray-800">${escapeHTML(p.name)}</h4>
                </div>
                <div class="mt-auto">
                    <div class="font-black text-[18px] sm:text-xl text-pink-600 drop-shadow-sm mb-4">${Number(p.price) > 0 ? Number(p.price) + ' ج.م' : 'حسب الطلب'}</div>
                    ${renderBtns()}
                </div>
            </div>
        </div>`;
    }
}

function getImgFallback(cat) {
    const m = { 'تورت': 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80', 'جاتوهات': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 'قشطوطة': 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80', 'بامبوليني': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', 'دوناتس': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', 'ديسباسيتو': 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=80', 'سينابون': 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80', 'ريد فيلفت': 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80', 'كبات السعادة': 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80', 'ميل فاي': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80', 'إكلير': 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=800&q=80', 'تشيز كيك': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', 'عروض وبوكسات': 'https://images.unsplash.com/photo-1558326567-98ae2405596b?auto=format&fit=crop&w=800&q=80', 'ميني تورتة': 'https://images.unsplash.com/photo-1562777717-b6aff3dacd65?auto=format&fit=crop&w=800&q=80', 'ورد': 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=800&q=80' };
    return m[cat] || m['جاتوهات'];
}

// 👑 محرك بناء التورت الملكية (Cake Builder) - القسم المقدس للتورت
function renderCakeBuilder(target) {
    const c = state.cakeBuilder; const settings = siteSettings.cakeBuilder || defaultSettings.cakeBuilder;
    const baseP = Number(settings.basePrice) || 145; const imgOpts = settings.imagePrinting || defaultSettings.cakeBuilder.imagePrinting;
    const selectedImgOption = imgOpts.find(opt => opt.label === c.img) || {price: 0};
    const price = Number(c.ps) * baseP + Number(selectedImgOption.price);
    const flavors = settings.flavors || ['فانيليا']; const imagesList = (settings.images && settings.images.length > 0) ? settings.images : [getImgFallback('تورت')];
    const descText = settings.desc || defaultSettings.cakeBuilder.desc;

    let sliderHtml = `<div class="w-full md:w-2/5 aspect-[3/4] md:aspect-square rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-2 shadow-xl relative flex snap-slider hide-scrollbar bg-white group" style="border-color: hsl(var(--brand-hue), 80%, 90%);">${imagesList.map(url => `<img src="${url}" class="w-full h-full object-cover shrink-0 snap-slide transition-transform duration-700 group-hover:scale-105">`).join('')}</div>`;

    target.innerHTML = `
        <div class="rounded-[2.5rem] shadow-xl border overflow-hidden animate-fade-in relative" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">
            <div class="p-6 md:p-10 border-b flex flex-col md:flex-row items-center gap-8" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);">
                ${sliderHtml}
                <div class="flex-1 text-center md:text-right"><h2 class="text-2xl md:text-4xl font-bold mb-4 uppercase tracking-tight" style="color: hsl(var(--brand-hue), 70%, 50%);">تخصيص التورت الملكية 👑</h2><p class="text-sm md:text-base font-bold leading-loose opacity-80" style="color: var(--site-text);">${escapeHTML(descText)}</p></div>
            </div>
            <div class="p-6 md:p-12 space-y-12">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div class="space-y-4">
                        <label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="cake" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> نكهة الكيك المفضلة</label>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">${flavors.map(fl => `<button onclick="uCake('flv', '${escapeHTML(fl)}')" class="py-3 rounded-xl font-bold border-2 text-sm transition-all ${c.flv === fl ? 'text-white shadow-md scale-105 brand-gradient border-transparent' : 'hover:opacity-80'}" style="${c.flv === fl ? '' : `background-color: var(--site-bg); color: hsl(var(--brand-hue), 70%, 50%); border-color: hsl(var(--brand-hue), 80%, 90%);`}">${escapeHTML(fl)}</button>`).join('')}</div>
                    </div>
                    <div class="space-y-4">
                        <label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="heart" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> عدد الأفراد</label>
                        <div class="flex items-center justify-between border rounded-2xl p-2 shadow-inner h-full max-h-[80px]" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);">
                            <button onclick="adjP(-2)" class="p-3 rounded-xl border hover:scale-105 transition-all"><i data-lucide="minus"></i></button>
                            <span class="text-3xl font-bold">${c.ps}</span>
                            <button onclick="adjP(2)" class="p-3 rounded-xl border hover:scale-105 transition-all"><i data-lucide="plus"></i></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-8 md:p-14 border-t-2 flex flex-col md:flex-row justify-between items-center gap-8" style="background-color: hsl(var(--brand-hue), 80%, 95%);">
                <div class="text-center md:text-right"><span class="block font-bold mb-2">الإجمالي التقديري</span><span class="text-4xl md:text-6xl font-bold">${price} ج.م</span></div>
                <button onclick="commitCakeBuilder()" class="w-full md:w-auto text-white font-bold text-xl md:text-2xl py-5 px-12 rounded-2xl shadow-xl brand-gradient">إضافة للمراجعة</button>
            </div>
        </div>`;
    if(window.lucide) lucide.createIcons();
}

function uCake(k, v) { state.cakeBuilder[k] = v; renderMainDisplay(); }
function handleRefImage(e) {
    const file = e.target.files[0];
    if (file) {
        if (state.cakeBuilder.refImgUrl) URL.revokeObjectURL(state.cakeBuilder.refImgUrl);
        state.cakeBuilder.refImgUrl = URL.createObjectURL(file); state.cakeBuilder.hasRefImg = true; renderMainDisplay();
    }
}
function adjP(d) {
    let n = Number(state.cakeBuilder.ps) + Number(d); if (n < 4) n = 4;
    state.cakeBuilder.ps = n; renderMainDisplay();
}

function updateCardUI(id) {
    const safeId = String(id); const cardEl = document.getElementById(`product-card-${safeId}`);
    const prod = catalogMap.get(safeId); const userLayout = siteSettings.productLayout || 'grid';
    if (cardEl && prod) { cardEl.outerHTML = drawProductCard(prod, userLayout); if(window.lucide) lucide.createIcons(); }
}

function renderCartCrossSell() {
    const cartIds = state.cart.map(i => String(i.id)); const cartCats = new Set(state.cart.map(i => i.category));
    let available = catalog.filter(p => !cartIds.includes(String(p.id)) && p.inStock !== false);
    if (available.length === 0) return '';
    let suggestions = available.slice(0, 3);
    return `
        <div class="mt-8 animate-fade-in border-t border-dashed border-pink-200 pt-6">
            <p class="text-sm font-black text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="sparkles"></i> كملي اللحظة الحلوة بمنتجات تليق بيكي</p>
            <div class="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-slider">
                ${suggestions.map(p => {
                    const img = (p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category));
                    return `
                        <div class="shrink-0 w-[260px] snap-slide bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col group">
                            <div class="relative w-full h-36 mb-4 rounded-xl overflow-hidden bg-gray-50"><img src="${img}" class="w-full h-full object-cover"></div>
                            <div class="flex-1 flex flex-col">
                                <h5 class="text-[14px] font-bold mb-1">${escapeHTML(p.name)}</h5>
                                <div class="flex items-center justify-between mt-auto">
                                    <span class="text-pink-600 font-black">${p.price} ج.م</span>
                                    <button onclick="addWithQty('${p.id}')" class="px-4 py-2 border border-pink-200 text-pink-500 rounded-xl text-[11px] font-bold">إضافة</button>
                                </div>
                            </div>
                        </div>`;
                }).join('')}
            </div>
        </div>`;
}

function renderCartList() {
    const container = document.getElementById('cart-list'); const crossSellArea = document.getElementById('cross-sell-area'); const totalDisplay = document.getElementById('cart-total-display');
    if (!container) return;
    if (state.cart.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center py-12 px-4 text-center"><i data-lucide="shopping-bag" class="w-10 h-10 text-pink-300 mb-4"></i><h3 class="font-bold">سلة حلويات بوسي في انتظارك 🌸</h3><button onclick="toggleCart(false)" class="mt-6 bg-pink-500 text-white px-8 py-3 rounded-2xl font-bold">يلا نتسوق</button></div>`;
        if (crossSellArea) crossSellArea.innerHTML = ''; if (totalDisplay) totalDisplay.innerText = "0 ج.م"; if (window.lucide) lucide.createIcons(); return;
    }
    let total = 0;
    container.innerHTML = state.cart.map(item => {
        const identifier = item.cartItemId || item.id; const q = Number(item.quantity); const p = Number(item.price); total += (p * q);
        const renderImg = (item.images && item.images.length > 0) ? item.images[0] : (item.img || getImgFallback(item.category));
        return `
            <div class="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl mb-3 shadow-sm">
                <div class="w-16 h-16 rounded-xl overflow-hidden"><img src="${renderImg}" class="w-full h-full object-cover"></div>
                <div class="flex-1 text-right"><h4 class="font-bold text-[13px]">${escapeHTML(item.name)}</h4><p class="text-pink-500 font-bold">${p} ج.م</p></div>
                <div class="flex flex-col items-end gap-2">
                    <button onclick="modQ('${identifier}', -${q})" class="p-1 text-gray-300 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border"><button onclick="modQ('${identifier}', -1)"><i data-lucide="minus" class="w-3 h-3"></i></button><span>${q}</span><button onclick="modQ('${identifier}', 1)"><i data-lucide="plus" class="w-3 h-3"></i></button></div>
                </div>
            </div>`;
    }).join('');
    if (totalDisplay) totalDisplay.innerText = total + " ج.م";
    if (crossSellArea) crossSellArea.innerHTML = renderCartCrossSell();
    if(window.lucide) lucide.createIcons();
}

function modQ(cartId, d) {
    const safeCartId = String(cartId); const it = state.cart.find(x => String(x.cartItemId) === safeCartId || String(x.id) === safeCartId);
    if (it) { it.quantity = Number(it.quantity) + Number(d); if (it.quantity <= 0) state.cart = state.cart.filter(x => String(x.cartItemId) !== safeCartId && String(x.id) !== safeCartId); }
    saveCartToStorage(); syncCartUI(); if(it && it.id) updateCardUI(it.id); calculateCartTotal();
}

function commitCakeBuilder() {
    const c = state.cakeBuilder; const settings = siteSettings.cakeBuilder || defaultSettings.cakeBuilder;
    const baseP = Number(settings.basePrice) || 145;
    const pr = Number(c.ps) * baseP;
    let ds = `النكهة: ${c.flv} | العدد: ${c.ps} أفراد | الشكل: ${c.sh}`;
    const customId = generateUniqueID();
    state.cart.push({ id: customId, cartItemId: customId, name: 'تورتة الفئة الملكية (تصميم خاص)', price: pr, desc: ds, quantity: 1, isCustom: true });
    saveCartToStorage(); toggleCart(true); calculateCartTotal();
    state.cakeBuilder.msg = ''; renderMainDisplay(); showSystemToast('تم تسجيل التورتة في السلة بنجاح', 'success');
}

function toggleDeliveryMethod() {
    const method = document.querySelector('input[name="delivery_method"]:checked').value;
    const areaContainer = document.getElementById('delivery-area-container'); const pickupInfo = document.getElementById('pickup-info');
    if (method === 'pickup') { areaContainer.classList.add('hidden'); pickupInfo.classList.remove('hidden'); } 
    else { areaContainer.classList.remove('hidden'); pickupInfo.classList.add('hidden'); }
    calculateCartTotal();
}

function calculateCartTotal() {
    let sub = 0; state.cart.forEach(i => sub += (Number(i.price) * Number(i.quantity)));
    let shipFee = 0; const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
    if (deliveryMethod === 'delivery') { const areaSelect = document.getElementById('cust-area'); if(areaSelect && areaSelect.value) { const zone = shippingZones.find(z => String(z.id) === String(areaSelect.value)); if(zone) shipFee = Number(zone.fee); } }
    state.currentShippingFee = shipFee;
    if(document.getElementById('cart-subtotal-text')) document.getElementById('cart-subtotal-text').innerText = sub + ' ج.م';
    if(document.getElementById('cart-shipping-text')) document.getElementById('cart-shipping-text').innerText = (shipFee > 0 ? '+' + shipFee : '0') + ' ج.م';
    if(document.getElementById('cart-total-text')) document.getElementById('cart-total-text').innerText = (sub + shipFee) + ' ج.م';
}

function syncCartUI() {
    const b = document.getElementById('cart-count-badge'); if(!b) return;
    const totalCount = state.cart.reduce((s, i) => s + Number(i.quantity), 0);
    if (totalCount > 0) { b.innerText = totalCount; b.classList.remove('hidden'); } else { b.classList.add('hidden'); }
    renderCartList(); calculateCartTotal();
}

function toggleCart(show) {
    const sd = document.getElementById('cart-sidebar'); if (!sd) return;
    if (show) { sd.classList.remove('-translate-x-full'); backToCart(); renderCartList(); document.body.style.overflow = 'hidden'; } 
    else { sd.classList.add('-translate-x-full'); document.body.style.overflow = 'auto'; }
}

function goToCheckout() {
    const step1 = document.getElementById('step-1-cart'); const step2 = document.getElementById('step-2-checkout');
    if (state.cart.length === 0) { showSystemToast("المشتريات لسه فاضية يا سكر 🌸", "info"); return; }
    step1.classList.add('hidden'); step2.classList.remove('hidden'); step2.scrollTop = 0;
}

function backToCart() {
    const step1 = document.getElementById('step-1-cart'); const step2 = document.getElementById('step-2-checkout');
    step2.classList.add('hidden'); step1.classList.remove('hidden');
}

async function submitOrder() {
    if (state.cart.length === 0) return;
    const cName = document.getElementById('cust-name').value.trim(); const cPhone = document.getElementById('cust-phone').value.trim();
    if (!cName || !cPhone) { showSystemToast('يرجى كتابة الاسم والموبايل.', 'error'); return; }
    const orderId = 'BS-' + Math.floor(10000 + Math.random() * 90000);
    let m = `*طلب جديد من حلويات بوسي* 🧁\n*رقم الطلب:* ${orderId}\n\n👤 الاسم: ${cName}\n📞 الموبايل: ${cPhone}\n`;
    state.cart.forEach((i, idx) => m += `\n*${idx+1}. ${i.name}* (x${i.quantity}) = ${(i.price * i.quantity)} ج\n`);
    window.open(`https://wa.me/201097238441?text=${encodeURIComponent(m)}`, '_blank');
    state.cart = []; clearCartStorage(); syncCartUI(); toggleCart(false); renderMainDisplay();
    showSystemToast('تم إرسال طلبك بنجاح! 🎂', 'success');
}

function showInfo(t) {
    const d = { about: { t: 'من نحن', b: siteSettings.footerQuote }, privacy: { t: 'سياسة الخصوصية والأمان', b: 'تلتزم إدارة حلويات بوسي بالسرية.' } };
    document.getElementById('info-title').innerText = d[t].t; document.getElementById('info-body').innerText = d[t].b;
    document.getElementById('info-modal').classList.remove('hidden'); document.getElementById('info-modal').classList.add('flex');
}
function closeInfo() { document.getElementById('info-modal').classList.add('hidden'); document.getElementById('info-modal').classList.remove('flex'); }

// ⚡ تحسين السكرول لضمان أداء عالي وسلس
let isScrolling = false;
window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            const n = document.getElementById('navbar');
            if (n) { if (window.scrollY > 30) n.classList.add('nav-scrolled'); else n.classList.remove('nav-scrolled'); }
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

window.onload = initApp;
