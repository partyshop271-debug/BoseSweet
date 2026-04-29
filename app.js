
// === Engine Upgrade: Firebase Integration ===
const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e",
    measurementId: "G-46D1CS3WLB"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🛡️ Engine Upgrade: Network Resilience Engine
const NetworkEngine = {
    async safeWrite(collectionName, docId, data, maxRetries = 4) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try { await db.collection(collectionName).doc(String(docId)).set(data); return true; } 
            catch (error) { attempt++; if (attempt === maxRetries) throw error; await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, attempt))); }
        }
    },
    async safeDelete(collectionName, docId, maxRetries = 3) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try { await db.collection(collectionName).doc(String(docId)).delete(); return true; } 
            catch (error) { attempt++; if (attempt === maxRetries) throw error; await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, attempt))); }
        }
    }
};

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
            
            allUrls.forEach(url => {
                if(url && !this.loadedUrls.has(url)) {
                    const img = new Image(); img.src = url; this.loadedUrls.add(url);
                }
            });
        }, 3000); 
    }
};

// 🎨 Math Engine for Colors
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
    return str.replace(/[&<>'"]/g, tag => ({ 
        '&': '&amp;', 
        '<': '&lt;', 
        '>': '&gt;', 
        "'": '&#39;', 
        '"': '&quot;' 
    }[tag] || tag));
}


function generateUniqueID() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

function showSystemToast(message, type = 'info') {
    const toast = document.getElementById('system-toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    
    msgEl.innerText = message;
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm max-w-[90vw] text-center border border-gray-700 toast-enter ${type === 'error' ? 'bg-red-900' : (type === 'success' ? 'bg-emerald-800' : 'bg-gray-900')}`;
    iconEl.setAttribute('data-lucide', type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info'));
    lucide.createIcons();
    setTimeout(() => { toast.classList.replace('flex', 'hidden'); toast.classList.remove('toast-enter'); }, 4000);
}


// Data Models
const defaultSettings = {
    brandName: "حلويات بوسي", announcement: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب",
    heroTitle: "أهلاً بكم في <br class='hidden md:block'/> <span class='text-white relative inline-block mt-1 md:mt-2 drop-shadow-md'>حلويات بوسي</span>",
    heroDesc: "يسر إدارة حلويات بوسي استعراض تشكيلتها الحصرية من الأصناف الفاخرة والمُعدة بعناية فائقة لتليق بذوقكم الرفيع ومناسباتكم السعيدة.",
    footerPhone: "01097238441", footerAddress: "الكفاح، مركز الفرافرة، <br> محافظة الوادي الجديد",
    footerQuote: `"نؤمن أن الحلويات لغة للتعبير عن المحبة، لذا نصنع كل قطعة بشغف لنكون شركاءكم في أجمل اللحظات."`,
    productLayout: "grid",
    
    brandColorHex: "#ec4899", bgColor: "#ffffff", textColor: "#663b3b",
    fontFamily: "'Cairo', sans-serif", baseFontSize: 16, baseFontWeight: 400,
    
    tickerActive: true, tickerText: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب ✨", tickerSpeed: 20, 
    tickerFont: "'Cairo', sans-serif", tickerColor: "#ffffff",

    cakeBuilder: {
        basePrice: 145, 
        desc: "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة، مع ضمان تنفيذ إدارة حلويات بوسي لكافة الطلبات بأعلى مستوى احترافي.",
        minSquare: 16,
        minRect: 20,
        flavors: ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت', 'كراميل', 'فستق', 'لوتس', 'ميكس فواكه'],
        images: [], 
        imagePrinting: [
            { label: 'بدون', price: 0 },
            { label: 'صورة قابلة للأكل', price: 60 },
            { label: 'صورة غير قابلة للأكل', price: 20 }
        ]
    }
}; // <-- تم إصلاح خطأ السكريبت هنا

const defaultShipping = [ { id: 'sh_1', name: 'الكفاح', fee: 0 }, { id: 'sh_2', name: 'أبو منقار', fee: 50 }, { id: 'sh_3', name: 'النهضة', fee: 30 }, { id: 'sh_4', name: 'مركز الفرافرة', fee: 20 } ];

let defaultCatalog = [];

// محرك سحب البيانات الافتراضية
async function fetchDefaultCatalog() {
    try {
        const response = await fetch('data.json');
        defaultCatalog = await response.json();
    } catch (error) {
        console.error("تعذر تحميل الكتالوج الافتراضي:", error);
    }
}

let siteSettings = { ...defaultSettings };
let shippingZones = [ ...defaultShipping ];
let catalog = [];
let globalOrders = []; 
let galleryData = []; 

let adminCurrentCat = 'all';
let adminOrderFilter = 'all';

// Tracking images for multi-upload modal
let tempProdImages = []; 
//         // --- بناء موتور الذاكرة المطور لعلامة حلويات بوسي ---
async function loadEngineMemory() {
    try {
        // 1. استدعاء المحرك المحلي لجلب البيانات والأسعار من ملف الجيسون
        await fetchDefaultCatalog(); 
        catalog = [...defaultCatalog];

        // 2. مزامنة السحابة (Firebase)
        const catSnap = await db.collection('catalog').get();
        if (catSnap.empty) {
            console.log("جاري رفع منيو حلويات بوسي المتطورة للسحابة... 🚀");
            for (let p of catalog) {
                await NetworkEngine.safeWrite('catalog', String(p.id), p);
            }
        } else {
            catalog = [];
            catSnap.forEach(doc => catalog.push(doc.data()));
        }
        
        console.log("تم تفعيل المنيو الشاملة لـ BoseSweets بنجاح! 👑✨");

        // 3. استكمال باقي البيانات (طلبات، معرض صور، إعدادات، مناطق شحن)
        const orderSnap = await db.collection('orders').orderBy('timestamp', 'desc').get();
        if (!orderSnap.empty) { globalOrders = []; orderSnap.forEach(doc => globalOrders.push(doc.data())); }

        const gallerySnap = await db.collection('gallery').orderBy('timestamp', 'desc').get();
        if (!gallerySnap.empty) { galleryData = []; gallerySnap.forEach(doc => galleryData.push(doc.data())); }
        
        const settingsSnap = await db.collection('settings').doc('main').get();
        if (settingsSnap.exists) { siteSettings = { ...defaultSettings, ...settingsSnap.data() }; }

        const shipSnap = await db.collection('shipping').get();
        if (!shipSnap.empty) { shippingZones = []; shipSnap.forEach(doc => shippingZones.push(doc.data())); }

        // 4. ترتيب الأقسام والتأكد من وجود قسم "تورت" في المقدمة
        if (siteSettings.catMenu && siteSettings.catMenu.length > 0) {
            catMenu = siteSettings.catMenu;
        } else {
            catMenu = [...new Set(catalog.map(p => p.category))].filter(Boolean);
        }
        if (!catMenu.includes('تورت')) {
            catMenu.unshift('تورت');
        }

        syncCatalogMap(); 

    } catch(err) { 
        console.error("Cloud Error:", err);
        catalog = [...defaultCatalog]; 
        syncCatalogMap(); 
    }
    // 5. استرجاع السلة لو العميل كان طالب حاجات ومقفلش الأوردر
    try { 
        const savedCart = localStorage.getItem('boseSweets_cart_data'); 
        if (savedCart) state.cart = JSON.parse(savedCart); 
    } catch (e) { 
        state.cart = []; 
    }
} // <--- القوس ده هو مفتاح الحل اللي هيرجع الموتور للحياة 🚀

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

// 🎨 Engine Upgrade: Smart Theme Injector & Ticker Control
function applySettingsToUI() {
    const root = document.documentElement;
    const computedHue = hexToMathHSL(siteSettings.brandColorHex || '#ec4899');
    
    root.style.setProperty('--brand-hue', computedHue);
    root.style.setProperty('--brand-font', siteSettings.fontFamily || "'Cairo', sans-serif");
    root.style.setProperty('--base-font-size', (siteSettings.baseFontSize || 16) + 'px');
    root.style.setProperty('--base-font-weight', siteSettings.baseFontWeight || 400);
    root.style.setProperty('--site-bg', siteSettings.bgColor || '#ffffff');
    root.style.setProperty('--site-text', siteSettings.textColor || '#663b3b');
    
    // Ticker Settings Application (Now perfectly synced with Brand Identity)
    const isTickerActive = siteSettings.tickerActive !== false; 
    const tickerContainer = document.getElementById('ticker-container');
    if (isTickerActive) {
        tickerContainer.classList.remove('hidden');
        tickerContainer.classList.add('flex');
        root.style.setProperty('--ticker-color', siteSettings.tickerColor || '#ffffff');
        root.style.setProperty('--ticker-font', siteSettings.tickerFont || "'Cairo', sans-serif");
        root.style.setProperty('--ticker-speed', (siteSettings.tickerSpeed || 20) + 's');
        document.getElementById('dyn-ticker-text').innerText = siteSettings.tickerText || siteSettings.announcement;
    } else {
        tickerContainer.classList.add('hidden');
        tickerContainer.classList.remove('flex');
    }

    document.getElementById('dyn-page-title').innerText = `${siteSettings.brandName} | القائمة الرسمية`;
    document.getElementById('dyn-brand-name').innerText = siteSettings.brandName;
    document.getElementById('dyn-hero-title').innerHTML = siteSettings.heroTitle;
    document.getElementById('dyn-hero-desc').innerText = siteSettings.heroDesc;
    document.getElementById('dyn-footer-brand').innerText = siteSettings.brandName;
    document.getElementById('dyn-footer-quote').innerText = siteSettings.footerQuote;
    document.getElementById('dyn-footer-phone').innerText = siteSettings.footerPhone;
    document.getElementById('dyn-footer-address').innerHTML = siteSettings.footerAddress;

    const areaSelect = document.getElementById('cust-area');
    if(areaSelect) areaSelect.innerHTML = `<option value="" disabled selected>اختر المنطقة...</option>` + shippingZones.map(z => `<option value="${z.id}">${escapeHTML(z.name)} (+${Number(z.fee)} ج.م توصيل)</option>`).join('');
    
    renderCustomerSidebarCategories();
}
let catMenu = []; // ⚡ Engine Upgrade: Dynamic Category System

const dSizes = ['مثلث', 'وسط', 'كبير'];
const fTypes = ['ورد طبيعي', 'ورد صناعي', 'ورد ستان', 'ورد بالصور', 'ورد بالفلوس'];

let state = {
    activeCat: 'تورت', dSize: 'مثلث', fType: 'ورد طبيعي', cart: [], currentShippingFee: 0,
    cakeBuilder: { flv: 'فانيليا', ps: 4, sh: 'دائري', trd: false, img: 'بدون', msg: '', alg: '', occ: '', refImgUrl: '', hasRefImg: false, crd: false, dlg: false }
};

async function initApp() {
    await loadEngineMemory();
    await fetchDefaultCatalog();
    const loader = document.getElementById('global-loader');
    if(loader) { 
        loader.style.opacity = '0'; 
        loader.style.visibility = 'hidden';
        setTimeout(() => loader.style.display = 'none', 500); 
    }
    applySettingsToUI();
    renderCustomerGallery(); 
    renderCategories();
    renderMainDisplay();
    syncCartUI(); 
    lucide.createIcons();
    PreloadEngine.ignite(catalog, galleryData);
    
    // CX Upgrade: Check Deep Link and handle smooth scroll and highlight
    const urlParams = new URLSearchParams(window.location.search);
    const sharedProductId = urlParams.get('product');
    if(sharedProductId) {
        const prod = catalogMap.get(sharedProductId);
        if(prod) {
            setCategory(prod.category); // switch to that category first
            setTimeout(() => {
                const el = document.getElementById('product-card-' + sharedProductId);
                if(el) {
                    el.scrollIntoView({behavior: 'smooth', block: 'center'});
                    el.classList.add('highlight-target');
                    setTimeout(() => el.classList.remove('highlight-target'), 2500);
                }
            }, 500);
        }
    }
}

// CX Upgrade: Customer Live Search Engine
function toggleLiveSearch(show) {
    const overlay = document.getElementById('live-search-overlay');
    const input = document.getElementById('live-search-input');
    const results = document.getElementById('live-search-results');
    
    if (show) {
        overlay.classList.remove('hidden');
        setTimeout(() => { 
            overlay.classList.add('opacity-100'); 
            input.focus(); 
        }, 10);
        input.value = '';
        results.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-white/50 font-bold mt-10">
                <i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30"></i>
                <p>ابدأ البحث في قائمة حلويات بوسي...</p>
            </div>`;
        lucide.createIcons();
    } else {
        overlay.classList.remove('opacity-100');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

function performLiveSearch(query) {
    const resultsContainer = document.getElementById('live-search-results');
    const q = query.trim().toLowerCase();
    
    if (!q) {
        resultsContainer.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-white/50 font-bold mt-10">
                <i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30"></i>
                <p>ابدأ البحث في قائمة حلويات بوسي...</p>
            </div>`;
        lucide.createIcons();
        return;
    }
    
    const matches = catalog.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.desc && p.desc.toLowerCase().includes(q))
    );
    
    if (matches.length === 0) {
        resultsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center text-white/70 font-bold mt-10 bg-white/5 p-8 rounded-2xl">
                <i data-lucide="search-x" class="w-12 h-12 mb-4 text-pink-400"></i>
                <p>لم نجد تطابق للبحث عن "${escapeHTML(query)}"</p>
                <p class="text-xs opacity-70 mt-2">جرب البحث بكلمة مختلفة مثل "تورتة"، "نوتيلا"، "لوتس"</p>
            </div>`;
        lucide.createIcons();
        return;
    }
    
    resultsContainer.innerHTML = matches.map(p => {
        const imgUrl = (p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category));
        const isOutOfStock = p.inStock === false;
        
        return `
        <div class="flex items-center gap-4 p-3 rounded-2xl bg-white shadow-sm border border-pink-100 transition-all hover:shadow-md cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}" onclick="toggleLiveSearch(false); setCategory('${p.category}'); setTimeout(()=> { const el = document.getElementById('product-card-${p.id}'); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight-target'); setTimeout(()=>el.classList.remove('highlight-target'), 2500);} }, 500);">
            <img src="${imgUrl}" class="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100 ${isOutOfStock ? 'grayscale' : ''}">
            <div class="flex-1">
                <h4 class="font-bold text-sm text-gray-800">${escapeHTML(p.name)}</h4>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">${p.category}</span>
                    <span class="font-bold text-pink-600 text-sm">${Number(p.price) > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span>
                </div>
            </div>
            <div class="px-2">
                ${isOutOfStock ? 
                    `<span class="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100"><i data-lucide="ban" class="w-3 h-3 inline"></i> نفدت</span>` : 
                    `<button class="w-10 h-10 bg-pink-50 text-pink-500 hover:bg-pink-500 hover:text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>`
                }
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

// CX Upgrade: Product Deep Share
function shareProduct(id, name) {
    const url = window.location.origin + window.location.pathname + '?product=' + id;
    if (navigator.share) {
        navigator.share({
            title: siteSettings.brandName + ' - ' + name,
            text: 'شوف المنتج الروعة ده من حلويات بوسي!',
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showSystemToast('تم نسخ رابط المنتج بنجاح!', 'success');
        }).catch(() => {
            const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); 
            showSystemToast('تم نسخ الرابط!', 'success');
        });
    }
}

// Engine Upgrade: Customer Sidebar Menu Logic
function toggleCustomerMenu(show) {
    const ov = document.getElementById('customer-menu-overlay');
    const sd = document.getElementById('customer-menu-sidebar');
    if (show) {
        ov.classList.remove('hidden'); 
        setTimeout(() => { ov.classList.add('opacity-100'); sd.classList.remove('translate-x-full'); }, 10);
    } else {
        ov.classList.remove('opacity-100'); sd.classList.add('translate-x-full');
        setTimeout(() => ov.classList.add('hidden'), 500);
    }
}

function renderCustomerSidebarCategories() {
    const container = document.getElementById('sidebar-categories');
    container.innerHTML = catMenu.map(c => `
        <button onclick="toggleCustomerMenu(false); setCategory('${c}')" class="text-right w-full p-3 rounded-xl font-bold text-sm transition-all hover:bg-gray-50 flex items-center justify-between" style="border: 1px solid hsl(var(--brand-hue), 80%, 95%); color: var(--site-text);">
            <span>${c === 'ورد' ? 'ورد وهدايا 💐' : (c === 'تورت' ? 'تورت وتصميم 🎂' : c)}</span>
            <i data-lucide="chevron-left" class="w-4 h-4 opacity-50"></i>
        </button>
    `).join('');
    lucide.createIcons();
}

function renderCustomerGallery() {
    const sec = document.getElementById('gallery-customer-section');
    const slider = document.getElementById('gallery-slider');
    if (galleryData.length === 0) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');
    slider.innerHTML = galleryData.map(g => `
        <div class="shrink-0 cursor-pointer hover:scale-105 transition-transform" onclick="openLightbox('${g.url}')">
            <div class="w-32 h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-sm border" style="border-color: hsl(var(--brand-hue), 80%, 90%);">
                <img src="${g.url}" class="w-full h-full object-cover" loading="lazy" alt="سابقة أعمال حلويات بوسي">
            </div>
        </div>
    `).join('');
}

function openLightbox(url) {
    const lb = document.getElementById('gallery-lightbox');
    document.getElementById('lightbox-img').src = url;
    lb.classList.remove('hidden'); lb.classList.add('flex'); lucide.createIcons();
}
function closeLightbox() {
    const lb = document.getElementById('gallery-lightbox');
    lb.classList.add('hidden'); lb.classList.remove('flex');
}

function renderCategories() {
    const el = document.getElementById('categories-nav');
    el.innerHTML = catMenu.map(c => `
        <button id="cat-btn-${c.replace(/\s+/g, '-')}" onclick="setCategory('${c}')" class="whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all border-2 text-sm sm:text-base 
        ${state.activeCat === c ? 'text-white shadow-md scale-105 brand-gradient border-transparent' : 'border-pink-100 hover:border-pink-300'}"
        style="${state.activeCat === c ? '' : `background-color: var(--site-bg); color: var(--site-text); border-color: hsl(var(--brand-hue), 80%, 90%);`}">
            ${c === 'ورد' ? 'ورد وهدايا 💐' : (c === 'تورت' ? 'تورت وتصميم 🎂' : c)}
        </button>
    `).join('');
}

function setCategory(c) {
    state.activeCat = c; renderCategories(); renderMainDisplay();
    setTimeout(() => { const activeBtn = document.getElementById(`cat-btn-${c.replace(/\s+/g, '-')}`); if (activeBtn) { activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } }, 50);
}

function renderMainDisplay() {
    const container = document.getElementById('display-container');
    const subTabs = document.getElementById('sub-tabs-area');
    subTabs.classList.add('hidden'); container.innerHTML = '';

    if (state.activeCat === 'تورت') { renderCakeBuilder(container); } 
    else {
        if (state.activeCat === 'ديسباسيتو') {
            subTabs.classList.remove('hidden');
            subTabs.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border flex justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">
                ${dSizes.map(s => `<button onclick="setSub('s', '${s}')" class="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.dSize === s ? 'text-white shadow-md brand-gradient' : 'opacity-80 hover:opacity-100'}" style="${state.dSize === s ? '' : 'color: var(--site-text);'}">${s}</button>`).join('')}
            </div>`;
        } else if (state.activeCat === 'ورد') {
            subTabs.classList.remove('hidden');
            subTabs.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border flex flex-wrap justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">
                ${fTypes.map(f => `<button onclick="setSub('f', '${f}')" class="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.fType === f ? 'text-white shadow-md brand-gradient' : 'opacity-80 hover:opacity-100'}" style="${state.fType === f ? '' : 'color: var(--site-text);'}">${f}</button>`).join('')}
            </div>`;
        }
        
        let list = catalog.filter(p => p.category === state.activeCat);
        if (state.activeCat === 'ديسباسيتو') list = list.filter(p => p.size === state.dSize || p.subType === state.dSize || (p.desc && p.desc.includes(state.dSize)));
        if (state.activeCat === 'ورد') list = list.filter(p => p.flowerType === state.fType || p.subType === state.fType || (p.desc && p.desc.includes(state.fType)));

        const userLayout = siteSettings.productLayout || 'grid';
        let gridClass = (userLayout === 'full') ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

        container.innerHTML = `<div class="grid ${gridClass} gap-4 sm:gap-6 lg:gap-8 items-stretch">${list.map(p => drawProductCard(p, userLayout)).join('')}</div>`;
    }
    lucide.createIcons();
}

function drawProductCard(p, layoutMode = 'grid') {
    const pIdSafe = String(p.id); const item = state.cart.find(i => String(i.cartItemId) === pIdSafe || String(i.id) === pIdSafe);
    
    let itemLayout = (p.layout && p.layout !== 'default') ? p.layout : layoutMode;
    let isFullWidth = (itemLayout === 'full');
    
    let colSpanClass = '';
    if (layoutMode === 'grid' && isFullWidth) {
        colSpanClass = 'col-span-2 md:col-span-2 lg:col-span-2'; 
    }

    // 👑 التعديل الذكي الأول: هندسة أبعاد متغيرة (مربع للكارتين، ومستطيل للكارت الكبير)
    const aspectClass = isFullWidth ? 'aspect-[4/3] w-full' : 'aspect-square w-full';
    
    const titleClass = isFullWidth ? 'text-[16px] sm:text-lg' : 'text-[12px] sm:text-sm';
    const descClass = isFullWidth ? 'text-[13px] sm:text-sm line-clamp-none mt-2' : 'text-[11px] sm:text-xs line-clamp-none';
    const cardPadding = isFullWidth ? 'p-4 sm:p-5' : 'p-2.5 sm:p-4';

    const isOutOfStock = p.inStock === false;
    
    const imageList = (p.images && p.images.length > 0) ? p.images : [p.img || getImgFallback(p.category)];
    const hasMultipleImages = imageList.length > 1;

    return `
        <div id="product-card-${p.id}" class="rounded-[1rem] sm:rounded-2xl shadow-sm hover:shadow-lg border flex flex-col group ${cardPadding} ${colSpanClass} transition-all duration-300 relative h-full" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">
            
            <button onclick="shareProduct('${p.id}', '${escapeHTML(p.name)}')" class="absolute top-4 left-4 z-20 w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform active:scale-95" style="background-color: var(--site-bg); color: var(--site-text);">
                <i data-lucide="share-2" class="w-4 h-4"></i>
            </button>

            ${isOutOfStock ? `<div class="absolute top-4 right-4 z-20 bg-gray-900/85 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-600 backdrop-blur-sm shadow-lg flex items-center gap-1"><i data-lucide="ban" class="w-3 h-3 text-red-400"></i> نفدت الكمية</div>` : ''}
            
            ${p.badge && !isOutOfStock ? `<div class="absolute top-4 right-4 z-20 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg border animate-pulse tracking-wide" style="background-color: hsl(var(--brand-hue), 70%, 55%); border-color: hsl(var(--brand-hue), 80%, 75%);">${p.badge}</div>` : ''}

            <div class="${aspectClass} rounded-lg sm:rounded-xl overflow-hidden border relative shrink-0" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);">
                
                <div class="relative w-full h-full flex overflow-x-auto snap-slider hide-scrollbar ${isOutOfStock ? 'grayscale-overlay' : ''}">
                    ${imageList.map(url => `
                        <img src="${url}" class="w-full h-full object-cover shrink-0 snap-slide transition-transform duration-700 ${isOutOfStock ? '' : 'group-hover:scale-105'}" loading="lazy">
                    `).join('')}
                </div>
                
                ${hasMultipleImages ? `
                    <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                        ${imageList.map((_, idx) => `<div class="w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-white opacity-100 w-3' : 'bg-white opacity-50'} shadow-sm transition-all"></div>`).join('')}
                    </div>
                    <div class="absolute top-2 left-2 bg-black/40 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm"><i data-lucide="images" class="w-3 h-3"></i> ${imageList.length}</div>
                ` : ''}

                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent opacity-0 ${isOutOfStock ? '' : 'group-hover:opacity-100'} pointer-events-none transition-opacity duration-300"></div>
            </div>
            
            <div class="mt-2.5 sm:mt-3 flex-1 flex flex-col justify-between">
                <div class="mb-3">
                    <h4 class="font-bold ${titleClass} leading-tight mb-1 line-clamp-1" style="color: var(--site-text);">${escapeHTML(p.name)}</h4>
                    ${p.desc ? `<p class="font-bold leading-relaxed ${descClass} ${isOutOfStock ? 'opacity-50' : 'opacity-80'}" style="color: var(--site-text);">${escapeHTML(p.desc)}</p>` : ''}
                </div>
                
                <div class="mt-auto flex flex-col gap-1.5 sm:gap-2">
                    <div class="border rounded-lg p-1.5 flex items-center justify-between shadow-inner" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);">
                        <button ${isOutOfStock ? 'disabled' : `onclick="${item ? `modQ('${item.cartItemId || item.id}', -1)` : ''}"`} class="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-md shadow-sm transition-all border ${item && !isOutOfStock ? 'active:scale-90 cursor-pointer hover:text-white' : 'opacity-40 cursor-not-allowed'}" style="${item && !isOutOfStock ? `background-color: var(--site-bg); color: hsl(var(--brand-hue), 80%, 60%); border-color: hsl(var(--brand-hue), 80%, 90%);` : `background-color: var(--site-bg);`}" ${item && !isOutOfStock ? `onmouseover="this.style.backgroundColor='hsl(var(--brand-hue), 70%, 65%)'" onmouseout="this.style.backgroundColor='var(--site-bg)'"` : ''}>
                            <i data-lucide="minus" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
                        </button>
                        <div class="flex flex-col items-center justify-center px-1">
                            <span class="font-bold text-[12px] sm:text-[14px] tracking-tight leading-none ${isOutOfStock ? 'opacity-50' : ''}" style="color: hsl(var(--brand-hue), 70%, 40%);">${Number(p.price) > 0 ? Number(p.price) + ' ج.م' : 'حسب الطلب'}</span>
                            ${item ? `<span class="text-[9px] font-bold mt-0.5 px-2 py-0.5 rounded-full border shadow-sm transition-all" style="background-color: var(--site-bg); color: hsl(var(--brand-hue), 70%, 60%); border-color: hsl(var(--brand-hue), 80%, 90%);">الكمية: ${Number(item.quantity)}</span>` : ''}
                        </div>
                        <button ${isOutOfStock ? 'disabled' : `onclick="addJS('${p.id}')"`} class="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-md shadow-sm transition-all border ${!isOutOfStock ? 'active:scale-90 cursor-pointer hover:text-white' : 'opacity-40 cursor-not-allowed'}" style="${!isOutOfStock ? `background-color: var(--site-bg); color: hsl(var(--brand-hue), 80%, 60%); border-color: hsl(var(--brand-hue), 80%, 90%);` : `background-color: var(--site-bg);`}" ${!isOutOfStock ? `onmouseover="this.style.backgroundColor='hsl(var(--brand-hue), 70%, 65%)'" onmouseout="this.style.backgroundColor='var(--site-bg)'"` : ''}>
                            <i data-lucide="plus" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
                        </button>
                    </div>
                    
                    ${isOutOfStock ? 
                        `<button disabled class="w-full font-bold text-[11px] sm:text-xs py-2 rounded-lg border flex justify-center items-center gap-1.5 shadow-sm bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed">
                            <i data-lucide="clock" class="w-3.5 h-3.5"></i> غير متوفر حالياً
                        </button>` 
                    : 
                        `<button onclick="addJS('${p.id}')" class="w-full font-bold text-[11px] sm:text-xs py-2 rounded-lg border transition-all flex justify-center items-center gap-1.5 shadow-sm active:scale-95 ${item ? 'text-white brand-gradient border-transparent' : 'hover:text-white'}" style="${item ? '' : `background-color: var(--site-bg); color: hsl(var(--brand-hue), 70%, 60%); border-color: hsl(var(--brand-hue), 80%, 80%);`}" ${item ? '' : `onmouseover="this.style.background='hsl(var(--brand-hue), 70%, 65%)'" onmouseout="this.style.background='var(--site-bg)'"`}>
                            <i data-lucide="${item ? 'check-circle' : 'shopping-cart'}" class="w-3.5 h-3.5"></i>
                            <span>${item ? 'تمت الإضافة' : 'إضافة للسلة'}</span>
                        </button>`
                    }
                </div>
            </div>
        </div>
    `;
}


function getImgFallback(cat) {
    const m = {
        'تورت': 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80',
        'جاتوهات': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        'قشطوطة': 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80',
        'بامبوليني': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
        'دوناتس': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
        'ديسباسيتو': 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=80',
        'سينابون': 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80',
        'ريد فيلفت': 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80',
        'كبات السعادة': 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80',
        'ميل فاي': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
        'إكلير': 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=800&q=80',
        'تشيز كيك': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
        'عروض وبوكسات': 'https://images.unsplash.com/photo-1558326567-98ae2405596b?auto=format&fit=crop&w=800&q=80',
        'ميني تورتة': 'https://images.unsplash.com/photo-1562777717-b6aff3dacd65?auto=format&fit=crop&w=800&q=80',
        'ورد': 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=800&q=80'
    };
    return m[cat] || m['جاتوهات'];
}

function renderCakeBuilder(target) {
    const c = state.cakeBuilder;
    const settings = siteSettings.cakeBuilder || defaultSettings.cakeBuilder;
    
    const baseP = Number(settings.basePrice) || 145;
    const imgOpts = settings.imagePrinting || defaultSettings.cakeBuilder.imagePrinting;
    const selectedImgOption = imgOpts.find(opt => opt.label === c.img) || {price: 0};
    const price = Number(c.ps) * baseP + Number(selectedImgOption.price);
    
    const flavors = settings.flavors || ['فانيليا'];
    const imagesList = (settings.images && settings.images.length > 0) ? settings.images : [getImgFallback('تورت')];
    const descText = settings.desc || defaultSettings.cakeBuilder.desc;
    const minSq = settings.minSquare || 16;
    const minRect = settings.minRect || 20;

    // التعديل الذكي المربع هنا مبني على نسبة 3/4 عشان يتطابق مع مقاس صورتك ويملا الشاشة
    let sliderHtml = `
        <div class="w-full md:w-2/5 aspect-[3/4] md:aspect-square rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-2 shadow-xl relative flex snap-slider hide-scrollbar bg-white group" style="border-color: hsl(var(--brand-hue), 80%, 90%);">
            ${imagesList.map(url => `<img src="${url}" class="w-full h-full object-cover shrink-0 snap-slide transition-transform duration-700 group-hover:scale-105">`).join('')}
            ${imagesList.length > 1 ? `<div class="absolute bottom-3 w-full text-center z-10"><span class="bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md font-bold tracking-wider border border-white/20 shadow-lg">مرر لمشاهدة ${imagesList.length} صور</span></div>` : ''}
        </div>`;

    target.innerHTML = `
        <div class="rounded-[2.5rem] shadow-xl border overflow-hidden animate-fade-in relative" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">
            <div class="p-6 md:p-10 border-b flex flex-col md:flex-row items-center gap-8" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);">
                ${sliderHtml}
                <div class="flex-1 text-center md:text-right">
                    <h2 class="text-2xl md:text-4xl font-bold mb-4 uppercase tracking-tight" style="color: hsl(var(--brand-hue), 70%, 50%);">تخصيص التورت الملكية 👑</h2>
                    <p class="text-sm md:text-base font-bold leading-loose opacity-80" style="color: var(--site-text);">${escapeHTML(descText)}</p>
                </div>
            </div>
            
            <div class="p-6 md:p-12 space-y-12">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div class="space-y-4">
                        <label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="cake" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> نكهة الكيك المفضلة</label>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            ${flavors.map(fl => `<button onclick="uCake('flv', '${escapeHTML(fl)}')" class="py-3 rounded-xl font-bold border-2 text-sm transition-all ${c.flv === fl ? 'text-white shadow-md scale-105 brand-gradient border-transparent' : 'hover:opacity-80'}" style="${c.flv === fl ? '' : `background-color: var(--site-bg); color: hsl(var(--brand-hue), 70%, 50%); border-color: hsl(var(--brand-hue), 80%, 90%);`}">${escapeHTML(fl)}</button>`).join('')}
                        </div>
                    </div>
                    <div class="space-y-4">
                        <label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="heart" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> عدد الأفراد (رقم زوجي)</label>
                        <div class="flex items-center justify-between border rounded-2xl p-2 shadow-inner h-full max-h-[80px]" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);">
                            <button onclick="adjP(-2)" class="p-3 rounded-xl border hover:scale-105 transition-all" style="background-color: var(--site-bg); color: hsl(var(--brand-hue), 70%, 60%); border-color: hsl(var(--brand-hue), 80%, 90%);"><i data-lucide="minus" class="w-6 h-6"></i></button>
                            <div class="text-center flex flex-col items-center"><span class="text-3xl font-bold" style="color: hsl(var(--brand-hue), 70%, 40%);">${c.ps}</span><span class="text-[9px] font-bold uppercase tracking-widest" style="color: hsl(var(--brand-hue), 70%, 65%);">فرداً</span></div>
                            <button onclick="adjP(2)" class="p-3 rounded-xl border hover:scale-105 transition-all" style="background-color: var(--site-bg); color: hsl(var(--brand-hue), 70%, 60%); border-color: hsl(var(--brand-hue), 80%, 90%);"><i data-lucide="plus" class="w-6 h-6"></i></button>
                        </div>
                    </div>
                </div>

                <div class="p-8 rounded-[2rem] border space-y-8 shadow-inner relative" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);">
                    <label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="star" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> الشكل الهندسي المختار</label>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${['دائري', 'قلب', 'مربع', 'مستطيل'].map(sh => `
                            <button onclick="setSh('${sh}')" class="py-5 rounded-xl font-bold flex flex-col items-center gap-2 border-2 transition-all ${c.sh === sh ? 'text-white shadow-lg scale-105 brand-gradient border-transparent' : 'hover:opacity-80'}" style="${c.sh === sh ? '' : `background-color: var(--site-bg); color: hsl(var(--brand-hue), 70%, 50%); border-color: hsl(var(--brand-hue), 80%, 90%);`}">
                                <span class="text-sm">${sh}</span>
                                ${sh === 'مربع' || sh === 'مستطيل' ? `<span class="text-[9px] opacity-75">${sh === 'مربع' ? `(من ${minSq})` : `(من ${minRect})`}</span>` : ''}
                            </button>
                        `).join('')}
                    </div>
                    <label class="flex items-center gap-4 cursor-pointer p-3 rounded-xl border" style="background-color: rgba(var(--site-bg), 0.5);"><input type="checkbox" ${c.trd ? 'checked' : ''} onchange="uCake('trd', this.checked)" class="w-6 h-6 rounded"> <span class="font-bold text-sm md:text-base" style="color: var(--site-text);">هل تفضلون التصميم متعدد الأدوار؟</span></label>
                </div>

                <div class="p-8 rounded-[2rem] border flex flex-col md:flex-row gap-6 shadow-sm" style="background-color: hsl(var(--brand-hue), 30%, 97%); border-color: hsl(var(--brand-hue), 30%, 90%);">
                    <i data-lucide="alert-circle" class="w-10 h-10 flex-shrink-0" style="color: hsl(var(--brand-hue), 60%, 50%);"></i>
                    <div class="flex-1">
                        <h4 class="font-bold mb-3 text-lg md:text-xl tracking-tight leading-tight" style="color: hsl(var(--brand-hue), 60%, 40%);">الرعاية الصحية وسلامة الغذاء</h4>
                        <p class="text-xs mb-5 font-bold leading-loose opacity-80" style="color: hsl(var(--brand-hue), 60%, 30%);">صحتكم وسلامتكم أولوية؛ نرجو تدوين أي تفاصيل تتعلق بالحساسية الغذائية لضمان تجربة آمنة تماماً.</p>
                        <input type="text" value="${escapeHTML(c.alg)}" onchange="uCake('alg', this.value)" placeholder="ملاحظات صحية إن وجدت..." class="w-full p-4 rounded-xl border outline-none focus:ring-2 font-bold text-sm shadow-inner" style="background-color: var(--site-bg); color: var(--site-text); border-color: hsl(var(--brand-hue), 30%, 85%);">
                    </div>
                </div>

                <div class="p-8 rounded-[2rem] border flex flex-col md:flex-row gap-8 shadow-sm relative overflow-hidden" style="background-color: hsl(var(--brand-hue), 10%, 97%); border-color: hsl(var(--brand-hue), 10%, 90%);">
                    <div class="flex-1 space-y-4 relative z-10">
                        <label class="font-bold flex items-center gap-2 text-lg" style="color: var(--site-text);"><i data-lucide="party-popper" class="w-6 h-6" style="color: hsl(var(--brand-hue), 60%, 50%);"></i> طبيعة المناسبة</label>
                        <input type="text" value="${escapeHTML(c.occ)}" onchange="uCake('occ', this.value)" placeholder="مثال: عيد ميلاد، زفاف..." class="w-full p-4 rounded-xl border shadow-sm outline-none transition-all font-bold text-sm" style="background-color: var(--site-bg); color: var(--site-text); border-color: hsl(var(--brand-hue), 20%, 85%);">
                    </div>
                    <div class="flex-1 space-y-4 relative z-10 border-t md:border-t-0 md:border-r pt-6 md:pt-0 md:pr-8" style="border-color: hsl(var(--brand-hue), 20%, 85%);">
                         <label class="font-bold flex items-center gap-2 text-lg" style="color: var(--site-text);"><i data-lucide="image-plus" class="w-6 h-6" style="color: hsl(var(--brand-hue), 60%, 50%);"></i> تصميم مرجعي</label>
                         <div class="relative border-2 border-dashed rounded-xl p-4 text-center hover:opacity-80 transition-all cursor-pointer overflow-hidden group" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 40%, 80%);">
                             <input type="file" accept="image/*" onchange="handleRefImage(event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                             ${c.refImgUrl ? `
                                <div class="relative z-0">
                                    <img src="${c.refImgUrl}" class="h-24 w-full object-cover rounded-lg shadow-sm mb-2 border">
                                    <span class="text-[10px] font-bold px-3 py-1 rounded-md border inline-block shadow-sm">✓ تم الإرفاق</span>
                                </div>
                             ` : `
                                <div class="relative z-0 py-2">
                                    <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2" style="background-color: hsl(var(--brand-hue), 80%, 97%);"><i data-lucide="upload-cloud" class="w-6 h-6"></i></div>
                                    <span class="text-[10px] font-bold opacity-70 block">اضغط هنا لرفع تصميم أعجبك</span>
                                </div>
                             `}
                         </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-10 border-t pt-10" style="border-color: hsl(var(--brand-hue), 80%, 90%);">
                    <div class="space-y-4">
                        <label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="camera" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> طباعة صورة</label>
                        <div class="space-y-3">
                            ${imgOpts.map(it => `
                                <label class="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${c.img === it.label ? 'shadow-sm scale-[1.01]' : ''}" style="${c.img === it.label ? `background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 70%, 60%);` : `background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 95%);`}">
                                    <div class="flex items-center gap-3"><input type="radio" name="cakeImg" ${c.img === it.label ? 'checked' : ''} onclick="uCake('img', '${it.label}')" class="w-5 h-5"> <span class="font-bold text-sm" style="color: var(--site-text);">${it.label}</span></div>
                                    ${it.price > 0 ? `<span class="px-3 py-1.5 rounded-lg border font-bold text-[10px] shadow-sm" style="background-color: var(--site-bg); color: hsl(var(--brand-hue), 70%, 50%); border-color: hsl(var(--brand-hue), 80%, 90%);">+${it.price} ج.م</span>` : ''}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="space-y-6">
                        <div class="space-y-3">
                            <label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="pen-tool" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> العبارة المراد تدوينها</label>
                            <input type="text" value="${escapeHTML(c.msg)}" onchange="uCake('msg', this.value)" placeholder="يرجى كتابة العبارة بوضوح..." class="w-full p-4 rounded-xl border font-bold text-sm shadow-inner" style="background-color: rgba(var(--site-bg), 0.5); border-color: hsl(var(--brand-hue), 80%, 90%); color: var(--site-text);">
                        </div>
                        <div class="flex flex-col gap-4">
                            <label class="flex items-center gap-3 cursor-pointer p-4 rounded-xl border shadow-sm transition-all active:scale-95" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 95%);"><input type="checkbox" ${c.crd ? 'checked' : ''} onchange="uCake('crd', this.checked)" class="w-5 h-5 rounded"> <span class="font-bold text-sm" style="color: var(--site-text);">إرفاق بطاقة إهداء فاخرة.</span></label>
                            <label class="flex items-center gap-3 cursor-pointer p-4 rounded-xl border shadow-sm transition-all active:scale-95" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 95%);"><input type="checkbox" ${c.dlg ? 'checked' : ''} onchange="uCake('dlg', this.checked)" class="w-5 h-5 rounded"> <span class="font-bold text-sm" style="color: var(--site-text);">تفويض الإدارة لابتكار التصميم.</span></label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="p-8 md:p-14 border-t-2 flex flex-col md:flex-row justify-between items-center gap-8" style="background-color: hsl(var(--brand-hue), 80%, 95%); border-color: hsl(var(--brand-hue), 80%, 85%);">
                <div class="text-center md:text-right">
                    <span class="block font-bold mb-2 text-lg md:text-xl opacity-70 uppercase tracking-widest" style="color: hsl(var(--brand-hue), 70%, 50%);">الإجمالي التقديري</span>
                    <div class="flex items-center gap-4 justify-center md:justify-start">
                        <span class="text-4xl md:text-6xl font-bold drop-shadow-md" style="color: hsl(var(--brand-hue), 70%, 30%);">${price} ج.م</span>
                        <i data-lucide="award" class="w-10 h-10 animate-pulse hidden md:block" style="color: hsl(var(--brand-hue), 70%, 60%);"></i>
                    </div>
                </div>
                <button onclick="commitCakeBuilder()" class="w-full md:w-auto text-white font-bold text-xl md:text-2xl py-5 px-12 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all border-b-4 brand-gradient" style="border-color: hsl(var(--brand-hue), 70%, 40%);">إضافة للمراجعة</button>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function setSub(t, v) { if(t==='s') state.dSize=v; if(t==='f') state.fType=v; renderMainDisplay(); }
function uCake(k, v) { state.cakeBuilder[k] = v; renderMainDisplay(); }
function handleRefImage(e) {
    const file = e.target.files[0];
    if (file) {
        if (state.cakeBuilder.refImgUrl) URL.revokeObjectURL(state.cakeBuilder.refImgUrl);
        state.cakeBuilder.refImgUrl = URL.createObjectURL(file); state.cakeBuilder.hasRefImg = true; renderMainDisplay();
    }
}

function adjP(d) {
    let n = Number(state.cakeBuilder.ps) + Number(d);
    if (n < 4) n = 4; if (n > 250) n = 250;
    const s = state.cakeBuilder.sh;
    const minSq = siteSettings.cakeBuilder?.minSquare || 16;
    const minRect = siteSettings.cakeBuilder?.minRect || 20;
    if (s === 'مربع' && n < minSq) { showSystemToast(`التصميم المربع يتطلب ${minSq} فرداً على الأقل.`, 'error'); return; }
    if (s === 'مستطيل' && n < minRect) { showSystemToast(`التصميم المستطيل يتطلب ${minRect} فرداً على الأقل.`, 'error'); return; }
    state.cakeBuilder.ps = n; renderMainDisplay();
}

function setSh(s) {
    const p = Number(state.cakeBuilder.ps);
    const minSq = siteSettings.cakeBuilder?.minSquare || 16;
    const minRect = siteSettings.cakeBuilder?.minRect || 20;
    if (s === 'مربع' && p < minSq) { showSystemToast(`للتصميم المربع، يرجى زيادة العدد لـ ${minSq}.`, 'error'); return; }
    if (s === 'مستطيل' && p < minRect) { showSystemToast(`للتصميم المستطيل، يرجى زيادة العدد لـ ${minRect}.`, 'error'); return; }
    state.cakeBuilder.sh = s; renderMainDisplay();
}


function updateCardUI(id) {
    const safeId = String(id);
    const cardEl = document.getElementById(`product-card-${safeId}`);
    const prod = catalogMap.get(safeId); 
    const userLayout = siteSettings.productLayout || 'grid';
    if (cardEl && prod) { cardEl.outerHTML = drawProductCard(prod, userLayout); lucide.createIcons(); }
}
// ⚡ Engine Upgrade: Cross-Sell logic for BoseSweets
function renderCartCrossSell() {
// نقترح منتجات من قسم الورد لو السلة فيها تورتة، أو العكس
const hasCake = state.cart.some(i => i.category === 'تورت' || i.isCustom);
const hasFlowers = state.cart.some(i => i.category === 'ورد');

let suggestion = null;
if (hasCake && !hasFlowers) {
suggestion = catalog.find(p => p.category === 'ورد' && p.inStock !== false);
} else if (!hasCake) {
suggestion = catalog.find(p => p.category === 'تورت' || p.category === 'ميني تورتة');
}

if (!suggestion) return '';

return `
<div class="mt-8 p-4 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/30 animate-fade-in">
    <p class="text-[11px] font-bold text-pink-500 mb-3 flex items-center gap-2">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> كملي اللحظة الحلوة.. قد يعجبك أيضاً:
    </p>
    <div class="flex items-center gap-3">
        <img src="${suggestion.images?.[0] || suggestion.img || getImgFallback(suggestion.category)}" class="w-12 h-12 rounded-lg object-cover border shadow-sm">
        <div class="flex-1">
            <h5 class="text-xs font-bold text-gray-800">${suggestion.name}</h5>
            <p class="text-[10px] text-pink-600 font-bold">${suggestion.price} ج.م</p>
        </div>
        <button onclick="addJS('${suggestion.id}')" class="bg-white text-pink-500 border border-pink-200 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-pink-500 hover:text-white transition-all shadow-sm">
            إضافة للسلة
        </button>
    </div>
</div>
`;
}

// ⚡ Engine Upgrade: Enhanced Cart List Renderer
function renderCartList() {
const l = document.getElementById('cart-list');
const f = document.getElementById('cart-checkout');

if (state.cart.length === 0) {
l.innerHTML = `
    <div class="h-full flex flex-col items-center justify-center opacity-50 mt-10">
        <div class="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-6 border-2 border-pink-100 shadow-inner">
            <i data-lucide="shopping-cart" class="w-12 h-12 text-pink-300"></i>
        </div>
        <p class="text-xl font-bold text-gray-400">سلة حلويات بوسي في انتظارك</p>
        <button onclick="toggleCart(false)" class="mt-6 px-6 py-2 bg-white border-2 border-pink-200 text-pink-500 rounded-xl font-bold hover:bg-pink-50 transition-colors">تصفح المنيو</button>
    </div>`;
f.classList.add('hidden');
} else {
l.innerHTML = state.cart.map(item => {
    const identifier = item.cartItemId || item.id;
    const q = Number(item.quantity); 
    const p = Number(item.price);
    const renderImg = (item.images && item.images.length > 0) ? item.images[0] : (item.img || getImgFallback(item.category));

    return `
        <div class="p-3 sm:p-4 rounded-2xl bg-white border border-pink-100 shadow-sm flex gap-4 relative mb-4">
            <div class="w-20 h-20 shrink-0 rounded-xl overflow-hidden border bg-gray-50">
                <img src="${renderImg}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1">
                <h4 class="font-bold text-sm text-gray-800">${item.name}</h4>
                <p class="text-xs text-pink-600 font-bold mt-1">${p * q} ج.م</p>
                <div class="flex items-center gap-3 mt-2">
                    <button onclick="modQ('${identifier}', -1)" class="w-6 h-6 flex items-center justify-center border rounded-md text-pink-500 hover:bg-pink-500 hover:text-white transition-all"><i data-lucide="minus" class="w-3 h-3"></i></button>
                    <span class="text-sm font-bold">${q}</span>
                    <button onclick="modQ('${identifier}', 1)" class="w-6 h-6 flex items-center justify-center border rounded-md text-pink-500 hover:bg-pink-500 hover:text-white transition-all"><i data-lucide="plus" class="w-3 h-3"></i></button>
                </div>
            </div>
            <button onclick="modQ('${identifier}', -${q})" class="absolute top-3 left-3 text-gray-300 hover:text-red-500 transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `;
}).join('');

// ربط دالة الاقتراحات (Cross-Sell)
l.innerHTML += renderCartCrossSell();
f.classList.remove('hidden');
}
lucide.createIcons();
}

function addJS(id) {
    const safeId = String(id);
    const prod = catalogMap.get(safeId); 
    if (!prod) return;
    if (prod.inStock === false) { showSystemToast('نأسف، هذا المنتج غير متوفر حالياً.', 'error'); return; }
    const exist = state.cart.find(i => String(i.id) === safeId);
    if (exist) { exist.quantity = Number(exist.quantity) + 1; } 
    else {
        const newCartItem = JSON.parse(JSON.stringify(prod));
        newCartItem.quantity = 1; newCartItem.cartItemId = generateUniqueID(); 
        state.cart.push(newCartItem);
    }
    saveCartToStorage(); syncCartUI(); updateCardUI(safeId); calculateCartTotal();
    showSystemToast('تمت إضافة المنتج للسلة', 'success');
}

function modQ(cartId, d) {
    const safeCartId = String(cartId);
    const it = state.cart.find(x => String(x.cartItemId) === safeCartId || String(x.id) === safeCartId);
    if (it) { 
        it.quantity = Number(it.quantity) + Number(d); 
        if (it.quantity <= 0) state.cart = state.cart.filter(x => String(x.cartItemId) !== safeCartId && String(x.id) !== safeCartId); 
    }
    saveCartToStorage(); syncCartUI(); 
    if(it && it.id) updateCardUI(it.id); 
    calculateCartTotal();
}

function commitCakeBuilder() {
    const c = state.cakeBuilder;
    const settings = siteSettings.cakeBuilder || defaultSettings.cakeBuilder;
    const baseP = Number(settings.basePrice) || 145;
    const imgOpts = settings.imagePrinting || defaultSettings.cakeBuilder.imagePrinting;
    const selectedImgOption = imgOpts.find(opt => opt.label === c.img) || {price: 0};
    
    const pr = Number(c.ps) * baseP + Number(selectedImgOption.price);
    
    let ds = `النكهة: ${c.flv} | العدد: ${c.ps} أفراد | الشكل: ${c.sh}${c.trd ? ' (أدوار)' : ''}`;
    if (c.occ) ds += `\nالمناسبة: ${c.occ}`;
    ds += `\nالإضافات: ${c.img}${c.crd ? ' + بطاقة' : ''}`;
    if (c.hasRefImg) ds += `\n📎 [يوجد صورة تصميم مرجعي مرفقة للطلب]`;
    ds += `\nالعبارة: ${c.msg || 'لا يوجد'}`;
    if (c.alg) ds += `\nملاحظة صحية: ${c.alg}`;

    const customId = generateUniqueID();
    state.cart.push({ id: customId, cartItemId: customId, name: 'تورتة الفئة الملكية (تصميم خاص)', price: pr, desc: ds, quantity: 1, isCustom: true, hasRefImg: c.hasRefImg });
    saveCartToStorage(); toggleCart(true); calculateCartTotal();
    state.cakeBuilder.msg = ''; state.cakeBuilder.alg = ''; state.cakeBuilder.occ = ''; state.cakeBuilder.hasRefImg = false;
    if(state.cakeBuilder.refImgUrl) { URL.revokeObjectURL(state.cakeBuilder.refImgUrl); state.cakeBuilder.refImgUrl = ''; }
    renderMainDisplay();
    showSystemToast('تم تسجيل التورتة في السلة بنجاح', 'success');
}


function toggleDeliveryMethod() {
    const method = document.querySelector('input[name="delivery_method"]:checked').value;
    const areaContainer = document.getElementById('delivery-area-container');
    const pickupInfo = document.getElementById('pickup-info');
    
    if (method === 'pickup') {
        areaContainer.classList.add('hidden');
        pickupInfo.classList.remove('hidden');
    } else {
        areaContainer.classList.remove('hidden');
        pickupInfo.classList.add('hidden');
    }
    calculateCartTotal();
}

function calculateCartTotal() {
    let sub = 0;
    state.cart.forEach(i => sub += (Number(i.price) * Number(i.quantity)));
    
    let shipFee = 0;
    const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
    
    if (deliveryMethod === 'delivery') {
        const areaSelect = document.getElementById('cust-area');
        if(areaSelect && areaSelect.value) { 
            const zone = shippingZones.find(z => String(z.id) === String(areaSelect.value)); 
            if(zone) shipFee = Number(zone.fee); 
        }
    }

    state.currentShippingFee = shipFee;
    document.getElementById('cart-subtotal-text').innerText = sub + ' ج.م';
    document.getElementById('cart-shipping-text').innerText = (shipFee > 0 ? '+' + shipFee : '0') + ' ج.م';
    document.getElementById('cart-total-text').innerText = (sub + shipFee) + ' ج.م';
}

function syncCartUI() {
    const b = document.getElementById('cart-count-badge');
    const totalCount = state.cart.reduce((s, i) => s + Number(i.quantity), 0);
    if (totalCount > 0) { 
        b.innerText = totalCount; b.classList.remove('hidden'); b.classList.add('scale-125');
        setTimeout(() => b.classList.remove('scale-125'), 200);
    } else { b.classList.add('hidden'); }
    if (document.getElementById('cart-overlay').classList.contains('opacity-100')) renderCartList();
    calculateCartTotal();
}

// ⚡ Engine Upgrade: Customer Auto-Fill Memory
function loadCustomerData() {
try {
const savedData = localStorage.getItem('boseSweets_customer_data');
if (savedData) {
    const data = JSON.parse(savedData);
    
    if (data.name) document.getElementById('cust-name').value = data.name;
    if (data.phone) document.getElementById('cust-phone').value = data.phone;
    
    if (data.method) {
        const methodRadio = document.querySelector(`input[name="delivery_method"][value="${data.method}"]`);
        if (methodRadio) {
            methodRadio.checked = true;
            toggleDeliveryMethod();
        }
    }
    
    if (data.area && data.method === 'delivery') {
        setTimeout(() => {
            const areaSelect = document.getElementById('cust-area');
            if (areaSelect) {
                areaSelect.value = data.area;
                calculateCartTotal();
            }
        }, 200);
    }
}
} catch (e) {
console.warn("No previous customer data found.");
}
}

// 🔄 محرك التنقل المطور لـ BoseSweets
// التحديث الشامل لموتور السلة الموحد 

function syncCartUI() {
const b = document.getElementById('cart-count-badge')
const totalCount = state.cart.reduce((s, i) => s + Number(i.quantity), 0)
if (totalCount > 0) { 
b.innerText = totalCount
b.classList.remove('hidden')
b.classList.add('scale-125')
setTimeout(() => b.classList.remove('scale-125'), 200)
} else { 
b.classList.add('hidden') 
}
renderCartList()
calculateCartTotal()
}

function toggleCart(show) {
const sd = document.getElementById('cart-sidebar')
if (!sd) return
if (show) {
sd.classList.remove('-translate-x-full')
backToCart() 
renderCartList() 
document.body.style.overflow = 'hidden' 
} else {
sd.classList.add('-translate-x-full')
document.body.style.overflow = 'auto' 
}
}

function goToCheckout() {
const step1 = document.getElementById('step-1-cart')
const step2 = document.getElementById('step-2-checkout')
if (state.cart.length === 0) {
showSystemToast("المشتريات لسه فاضية يا سكر 🌸", "info")
return
}

// السطر السحري لاستدعاء بيانات العميل من الذاكرة 🧠
loadCustomerData(); 

step1.classList.add('hidden')
step2.classList.remove('hidden')
step2.scrollTop = 0 
}


function backToCart() {
const step1 = document.getElementById('step-1-cart')
const step2 = document.getElementById('step-2-checkout')
step2.classList.add('hidden')
step1.classList.remove('hidden')
}
// محرك الاقتراحات الذكي والمتجدد (النسخة الاحترافية الفاخرة) لـ حلويات بوسي 👑✨
function renderCartCrossSell() {
const cartIds = state.cart.map(i => String(i.id));
const cartCats = new Set(state.cart.map(i => i.category));

// 1. تصفية المنيو (استبعاد اللي في السلة + اللي خلصان من المخزن)
let available = catalog.filter(p => !cartIds.includes(String(p.id)) && p.inStock !== false);

if (available.length === 0) return '';

let suggestions = [];

// 2. منطق "ذكاء المكملات": لو السلة فيها تورتة.. الورد أولوية 💐
if (cartCats.has('تورت') || state.cart.some(i => i.isCustom)) {
const flower = available.find(p => p.category === 'ورد');
if (flower) suggestions.push(flower);
}

// 3. منطق "الاكتشاف": بنعرض منتجات من أقسام العميل لسه ما اشتراش منها 🍰
const newExperiences = available.filter(p => !cartCats.has(p.category));
if (newExperiences.length > 0) {
// خلط عشوائي عشان الاقتراحات تتغير في كل مرة "Renewable"
const shuffled = newExperiences.sort(() => 0.5 - Math.random());
suggestions.push(...shuffled.slice(0, 2));
}

// 4. لو لسه فيه مساحة، بنكمل من باقي المنيو بشكل عشوائي تماماً
if (suggestions.length < 3) {
const remaining = available.filter(p => !suggestions.includes(p));
const extra = remaining.sort(() => 0.5 - Math.random()).slice(0, 3 - suggestions.length);
suggestions.push(...extra);
}

// تأمين الحصول على منتجات فريدة بحد أقصى 3 كروت عرض
suggestions = [...new Set(suggestions)].slice(0, 3);

return `
<div class="mt-8 animate-fade-in border-t border-dashed border-pink-200 pt-6">
    <p class="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
        <i data-lucide="sparkles" class="w-4 h-4 text-pink-500"></i> كملي اللحظة الحلوة بمنتجات تليق بيكي
    </p>
    <div class="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-slider">
        ${suggestions.map(p => {
            const img = (p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category));
            return `
                <div class="shrink-0 w-[260px] snap-slide bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col hover:shadow-md hover:border-pink-300 transition-all group">
                    <div class="relative w-full h-36 mb-4 rounded-xl overflow-hidden border border-gray-50 bg-gray-50">
                        <img src="${img}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                        ${p.badge ? `<span class="absolute top-2 right-2 bg-pink-500 text-white text-[10px] px-2 py-1 rounded-lg font-bold shadow-md">${p.badge}</span>` : ''}
                    </div>
                    
                    <div class="flex-1 flex flex-col">
                        <span class="text-[10px] font-bold text-pink-500 mb-1 tracking-wider bg-pink-50 self-start px-2 py-0.5 rounded-md">${escapeHTML(p.category)}</span>
                        
                        <h5 class="text-[14px] font-bold text-gray-800 mb-1 leading-tight">${escapeHTML(p.name)}</h5>
                        
                        <p class="text-[11px] text-gray-500 line-clamp-2 mb-4 font-bold opacity-90 leading-relaxed">${escapeHTML(p.desc || 'لمسة ساحرة من إبداعات حلويات بوسي تذوب في الفم.')}</p>
                        
                        <div class="flex items-center justify-between mt-auto">
                            <span class="text-[14px] text-pink-600 font-black">${p.price > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span>
                            <button onclick="addJS('${p.id}')" class="px-4 py-2 bg-white border border-pink-200 text-pink-500 rounded-xl flex items-center gap-1.5 hover:bg-pink-500 hover:text-white transition-all shadow-sm text-[11px] font-bold active:scale-95">
                                <i data-lucide="plus" class="w-3.5 h-3.5"></i> إضافة
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('')}
    </div>
</div>
`;
}

function renderCartList() {
const container = document.getElementById('cart-list')
const crossSellArea = document.getElementById('cross-sell-area')
const totalDisplay = document.getElementById('cart-total-display')

if (!container) return

if (state.cart.length === 0) {
container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div class="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-4 border-2 border-pink-100 shadow-inner text-pink-300">
            <i data-lucide="shopping-bag" class="w-10 h-10"></i>
        </div>
        <h3 class="text-gray-800 font-bold mb-1 text-lg">سلة حلويات بوسي في انتظارك 🌸</h3>
        <p class="text-gray-500 text-sm mb-6">دلع نفسك واختار أحلى الحلويات من القائمة</p>
        <button onclick="toggleCart(false)" class="bg-pink-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-pink-200 active:scale-95 transition-all">يلا نتسوق</button>
    </div>
`
if (crossSellArea) crossSellArea.innerHTML = ''
if (totalDisplay) totalDisplay.innerText = "0 ج.م"
if (window.lucide) lucide.createIcons()
return
}

let total = 0
container.innerHTML = state.cart.map(item => {
const identifier = item.cartItemId || item.id
const q = Number(item.quantity)
const p = Number(item.price)
total += (p * q)
const renderImg = (item.images && item.images.length > 0) ? item.images[0] : (item.img || getImgFallback(item.category))

return `
    <div class="group flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl mb-3 hover:border-pink-200 transition-all shadow-sm">
        <div class="w-16 h-16 bg-pink-50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-50">
            <img src="${renderImg}" class="w-full h-full object-cover">
        </div>
        <div class="flex-1 min-w-0 text-right">
            <h4 class="font-bold text-gray-800 text-[13px] line-clamp-1">${escapeHTML(item.name)}</h4>
            <p class="text-[11px] text-pink-500 font-bold mt-1">${p} ج.م</p>
        </div>
        <div class="flex flex-col items-end gap-2">
            <button onclick="modQ('${identifier}', -${q})" class="p-1 text-gray-300 hover:text-red-500 transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
            <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border">
                <button onclick="modQ('${identifier}', -1)" class="w-5 h-5 flex items-center justify-center rounded text-pink-500 hover:bg-pink-200 transition-all"><i data-lucide="minus" class="w-3 h-3"></i></button>
                <span class="text-xs font-bold w-4 text-center">${q}</span>
                <button onclick="modQ('${identifier}', 1)" class="w-5 h-5 flex items-center justify-center rounded text-pink-500 hover:bg-pink-200 transition-all"><i data-lucide="plus" class="w-3 h-3"></i></button>
            </div>
        </div>
    </div>
`
}).join('')

if (totalDisplay) totalDisplay.innerText = total + " ج.م"
if (crossSellArea) crossSellArea.innerHTML = renderCartCrossSell()
if (window.lucide) lucide.createIcons()
}


async function submitOrder() {
    if (state.cart.length === 0) return;
    
    const cDate = document.getElementById('cust-date').value;
    const cTime = document.getElementById('cust-time').value;
    const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
    const cName = document.getElementById('cust-name').value.trim();
    const cPhone = document.getElementById('cust-phone').value.trim();
    const cAreaId = document.getElementById('cust-area').value;
    
    // جلب قيمة العنوان الجديد والملاحظات
    const addressEl = document.getElementById('cust-address');
    const cAddress = addressEl ? addressEl.value.trim() : '';
    const notesEl = document.getElementById('cust-notes');
    const cNotes = notesEl ? notesEl.value.trim() : '';

    // درع الحماية: التأكد من البيانات الأساسية
    if (!cName || !cPhone || !cDate || !cTime) { 
        showSystemToast('يرجى استكمال البيانات الأساسية (التاريخ، الوقت، الاسم، والموبايل).', 'error'); 
        return; 
    }
    
    // إجبار العميل على كتابة العنوان لو اختار توصيل بالرسالة المبسطة
    if (deliveryMethod === 'delivery') {
        if (!cAreaId) { showSystemToast('يرجى تحديد منطقة التوصيل.', 'error'); return; }
        if (!cAddress) { showSystemToast('يرجى كتابة العنوان لضمان وصول الأوردر 🛵', 'error'); return; }
    }

    let formattedDate = cDate;
    try { formattedDate = new Date(cDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); } catch(e){}
    
    let formattedTime = cTime;
    try {
        const [hours, minutes] = cTime.split(':');
        const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
        const hours12 = hours % 12 || 12;
        formattedTime = `${hours12}:${minutes} ${ampm}`;
    } catch(e){}

    const areaName = deliveryMethod === 'pickup' ? 'استلام من الفرع' : (shippingZones.find(z => String(z.id) === String(cAreaId))?.name || 'أخرى');
    const orderId = 'BS-' + Math.floor(10000 + Math.random() * 90000);
    let sub = 0; let itemsDesc = [];

    // بناء الرسالة: العنوان سيظهر الآن باسم "العنوان" وليس ملاحظات
    let m = `*طلب جديد من حلويات بوسي* 🧁\n*رقم الطلب:* ${orderId}\nــــــــــــــــــــــــــــــــــــــــ\n\n`;
    m += `👤 الاسم: ${cName}\n📞 الموبايل: ${cPhone}\n`;
    m += `🚚 الاستلام: ${deliveryMethod === 'pickup' ? 'استلام من الفرع 🏪' : 'توصيل للمنزل 🛵'}\n`;
    
    if (deliveryMethod === 'delivery') {
        m += `📍 المنطقة: ${areaName}\n`;
        m += `🏠 العنوان: ${cAddress}\n`; // العنوان يظهر هنا بشكل مستقل
    }
    
    m += `⏰ الموعد: ${formattedDate} - ${formattedTime}\n`;
    if (cNotes) m += `📝 ملاحظات: ${cNotes}\n`; // الملاحظات تظهر هنا بشكل مستقل
    m += `ــــــــــــــــــــــــــــــــــــــــ\n\n*الطلبات:*\n`;

    state.cart.forEach((i, idx) => {
        let p = Number(i.price); let q = Number(i.quantity); sub += (p * q);
        let finalItemName = i.isCustom ? i.name : `[${i.category}] ${i.name}`.trim();
        m += `\n*${idx+1}. ${finalItemName}* (x${q}) = ${(p * q)} ج\n`;
        if (i.isCustom && i.desc) m += `_التفاصيل:_ ${i.desc}\n`;
        itemsDesc.push(`${finalItemName} (x${q})`);
    });

    m += `\nــــــــــــــــــــــــــــــــــــــــ\n*الحساب:* ${sub + state.currentShippingFee} ج.م\n`;

    // حفظ الطلب سحابياً مع فصل العنوان عن الملاحظات
    const orderObj = { 
        id: orderId, timestamp: Date.now(), date: formattedDate, name: cName, phone: cPhone, 
        area: areaName, address: cAddress, notes: cNotes, total: (sub + state.currentShippingFee), status: 'pending' 
    };

    try {
        await NetworkEngine.safeWrite('orders', orderId, orderObj);
        globalOrders.unshift(orderObj); localStorage.setItem('boseSweets_admin_orders', JSON.stringify(globalOrders));
    } catch(e) {}

    window.open(`https://wa.me/201097238441?text=${encodeURIComponent(m)}`, '_blank');
    state.cart = []; clearCartStorage(); syncCartUI(); toggleCart(false); renderMainDisplay();
    
    // تفريغ الخانات بعد نجاح الطلب عشان السلة ترجع جديدة
    document.getElementById('cust-date').value = ''; 
    document.getElementById('cust-time').value = '';
    if (addressEl) addressEl.value = '';
    if (notesEl) notesEl.value = '';
    
    showSystemToast('تم إرسال طلبك بنجاح! 🎂', 'success');
}


// 🛡️ Engine Upgrade: Advanced Security & Hashing Engine
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// شفرة الباسورد الافتراضية 2026
const DEFAULT_ADMIN_HASH = "e4125b7405be53da470ec0865e8aebfcb03b223403ba78028f24419cb7ed490c";

let secretTaps = 0; let tapTimer = null;
function handleSecretTap() {

    secretTaps++; clearTimeout(tapTimer);
    if (secretTaps >= 5) { secretTaps = 0; openAdminDashboard(); } else { tapTimer = setTimeout(() => { secretTaps = 0; }, 2000); }
}

let currentEditId = null;

function toggleAdminSidebar() {
    const sb = document.getElementById('admin-sidebar'); const ov = document.getElementById('admin-sidebar-overlay');
    if(sb.classList.contains('translate-x-full')) { sb.classList.remove('translate-x-full'); ov.classList.remove('hidden'); } 
    else { sb.classList.add('translate-x-full'); ov.classList.add('hidden'); }
}

async function openAdminDashboard() {
    const pwd = prompt("النظام السحابي المشفر لإدارة المتجر ☁️🛡️\n\nبرجاء إدخال رمز المرور السري:");
    if (pwd === null) return; 
    
    try {
        const hashedInput = await hashPassword(pwd);
        let isMatch = false;

        // 🛡️ التوافق الذكي: التحقق من الباسورد لو لسه ماتشفرتش في السحابة
        if (siteSettings.adminPasswordHash) {
            isMatch = (hashedInput === siteSettings.adminPasswordHash);
        } else if (siteSettings.adminPassword) {
            isMatch = (pwd === siteSettings.adminPassword); // لو الباسورد القديمة موجودة وماتشفرتش
        } else {
            isMatch = (hashedInput === DEFAULT_ADMIN_HASH);
        }

        if (isMatch) {
            document.getElementById('admin-dashboard').classList.remove('hidden'); document.getElementById('admin-dashboard').classList.add('flex');
            
            renderAdminCatalogTabs();
            renderAdminOrderFilters(); 
            renderAdminCategories();
            renderAdminOverview(); renderAdminOrders(); renderAdminMenu(); renderAdminShipping(); renderAdminGallery(); fillAdminSettingsForm();
            document.getElementById('sec-current-pwd').value = ''; document.getElementById('sec-new-pwd').value = ''; document.getElementById('sec-confirm-pwd').value = '';
            lucide.createIcons();
        } else { 
            showSystemToast("رمز المرور غير صحيح.. المحاولة مسجلة 🛡️", "error"); 
        }
    } catch (error) {
        if(pwd === (siteSettings.adminPassword || "2026")) {
            document.getElementById('admin-dashboard').classList.remove('hidden'); document.getElementById('admin-dashboard').classList.add('flex');
            renderAdminOverview(); fillAdminSettingsForm();
        } else {
            showSystemToast("رمز المرور غير صحيح", "error");
        }
    }
}

function closeAdminDashboard() {
    document.getElementById('admin-dashboard').classList.add('hidden'); document.getElementById('admin-dashboard').classList.remove('flex');
    initApp(); 
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => { el.classList.add('hidden'); el.classList.remove('block'); });
    document.querySelectorAll('.admin-tab-btn').forEach(btn => { btn.classList.remove('bg-pink-500', 'text-white'); btn.classList.add('text-gray-400'); });
    document.getElementById(`admin-${tabId}`).classList.remove('hidden'); document.getElementById(`admin-${tabId}`).classList.add('block');
    event.currentTarget.classList.add('bg-pink-500', 'text-white'); event.currentTarget.classList.remove('text-gray-400');
    if(window.innerWidth < 768) { toggleAdminSidebar(); }
}

function exportBackupJSON() {
    try {
        const backupData = { catalog, settings: siteSettings, shipping: shippingZones, orders: globalOrders, gallery: galleryData };
        const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `BoseSweets_CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 100);
        showSystemToast("تم سحب نسخة سحابية بنجاح", "success");
    } catch (e) { showSystemToast("حدث خطأ أثناء إعداد ملف النسخة", "error"); }
}

function importBackupJSON(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(ev) {
        try {
            const data = JSON.parse(ev.target.result);

            // ⚡ Engine Upgrade: Smart Import Logic for BoseSweets
            if (Array.isArray(data)) {
                for (let p of data) {
                    await NetworkEngine.safeWrite('catalog', String(p.id), p);
                }
            } else {
                if(data.settings) await NetworkEngine.safeWrite('settings', 'main', data.settings); 
                if(data.shipping) for (let z of data.shipping) await NetworkEngine.safeWrite('shipping', String(z.id), z); 
                if(data.catalog) for (let p of data.catalog) await NetworkEngine.safeWrite('catalog', String(p.id), p); 
                if(data.orders) for (let o of data.orders) await NetworkEngine.safeWrite('orders', String(o.id), o); 
                if(data.gallery) for (let g of data.gallery) await NetworkEngine.safeWrite('gallery', String(g.id), g);
            }

            showSystemToast("تم استرجاع بيانات حلويات بوسي للسحابة بنجاح! جاري إعادة تشغيل النظام...", "success");
            setTimeout(() => location.reload(), 2000);
        } catch(err) { 
            showSystemToast("ملف JSON غير صالح أو تعذر الاتصال بالسحابة!", "error"); 
        }
    };
    reader.readAsText(file);
}


function copyBackupText() {
    try {
        const str = JSON.stringify({ catalog, settings: siteSettings, shipping: shippingZones, orders: globalOrders, gallery: galleryData });
        navigator.clipboard.writeText(str).then(() => { showSystemToast("تم نسخ بيانات النظام", "success"); })
        .catch(err => { const t = document.createElement("textarea"); t.value = str; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); showSystemToast("تم النسخ", "success"); });
    } catch (e) { showSystemToast("فشل النسخ", "error"); }
}

// 🎨 Engine Upgrade: Live Preview Function including Ticker
function updateLiveThemePreview() {
    const brandColor = document.getElementById('set-brand-color').value;
    const bgColor = document.getElementById('set-bg-color').value;
    const textColor = document.getElementById('set-text-color').value;
    const fontFamily = document.getElementById('set-font').value;
    const fontSize = document.getElementById('set-font-size').value + 'px';
    const fontWeight = document.getElementById('set-font-weight').value;
    
    // Ticker live update (Integrated Gradient)
    const isTickerActive = document.getElementById('set-ticker-active').checked;
    const tickerText = document.getElementById('set-ticker-text').value || "حلويات بوسي: تجربة التذوق الفاخرة...";
    const tickerSpeed = document.getElementById('set-ticker-speed').value + 's';
    const tickerFont = document.getElementById('set-ticker-font').value;
    
    const previewTickerWrap = document.getElementById('preview-ticker-wrap');
    const previewTickerText = document.getElementById('preview-ticker-text');
    const calculatedHue = hexToMathHSL(brandColor);
    
    if(isTickerActive) {
        previewTickerWrap.style.display = 'flex';
        previewTickerWrap.style.background = `linear-gradient(135deg, hsl(${calculatedHue}, 80%, 65%) 0%, hsl(${calculatedHue}, 85%, 75%) 50%, hsl(${calculatedHue}, 90%, 85%) 100%)`;
        previewTickerText.style.color = '#ffffff'; // Always white for gradient readability
        previewTickerText.style.fontFamily = tickerFont;
        previewTickerText.style.animationDuration = tickerSpeed;
        previewTickerText.innerText = tickerText;
    } else {
        previewTickerWrap.style.display = 'none';
    }
    
    const previewBox = document.getElementById('theme-live-preview');
    const previewBtn = document.getElementById('preview-button');
    
    previewBox.style.backgroundColor = bgColor;
    previewBox.style.color = textColor;
    previewBox.style.fontFamily = fontFamily;
    previewBox.style.fontSize = fontSize;
    previewBox.style.fontWeight = fontWeight;
    
    previewBtn.style.backgroundImage = `linear-gradient(135deg, hsl(${calculatedHue}, 80%, 65%) 0%, hsl(${calculatedHue}, 85%, 75%) 50%, hsl(${calculatedHue}, 90%, 85%) 100%)`;
}

function syncColorInput(inputId, textId) {
    const colorInput = document.getElementById(inputId);
    const textInput = document.getElementById(textId);
    
    // فك الحماية لتمكين الكتابة
    textInput.removeAttribute('readonly');

    // من مربع اللون للنص
    colorInput.addEventListener('input', (e) => {
        textInput.value = e.target.value.toUpperCase();
        updateLiveThemePreview();
    });

    // ⚡ تحديث الموتور الذكي: يقبل الكود حتى لو فيه مسافات أو بدون علامة #
    textInput.addEventListener('input', (e) => {
        let val = e.target.value.trim(); 
        
        // وضع علامة الشباك أوتوماتيكياً لو نسيها المستخدم
        if (val.length > 0 && !val.startsWith('#')) {
            val = '#' + val;
        }
        
        // لو الكود سليم يتم تطبيقه فوراً
        if(/^#[0-9A-Fa-f]{6}$/i.test(val)) {
            colorInput.value = val;
            updateLiveThemePreview();
        }
    });

    // تأكيد أخير عند الخروج من المربع لضمان صحة الكود
    textInput.addEventListener('blur', (e) => {
        let val = e.target.value.trim();
        if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
        if(/^#[0-9A-Fa-f]{6}$/i.test(val)) {
            colorInput.value = val;
            e.target.value = val.toUpperCase();
        } else {
            e.target.value = colorInput.value.toUpperCase(); 
        }
        updateLiveThemePreview();
    });
}


function fillAdminSettingsForm() {
    // Data Tab
    document.getElementById('set-brand').value = siteSettings.brandName; 
    document.getElementById('set-announcement').value = siteSettings.announcement;
    document.getElementById('set-hero-title').value = siteSettings.heroTitle; 
    document.getElementById('set-hero-desc').value = siteSettings.heroDesc;
    document.getElementById('set-footer-phone').value = siteSettings.footerPhone; 
    document.getElementById('set-footer-address').value = siteSettings.footerAddress.replace(/<br>/g, '');
    document.getElementById('set-footer-quote').value = siteSettings.footerQuote; 
    
    const layout = siteSettings.productLayout || 'grid';
    if(layout === 'full') document.getElementById('set-layout-full').checked = true; else document.getElementById('set-layout-grid').checked = true;

    // Theme Tab
    document.getElementById('set-brand-color').value = siteSettings.brandColorHex || '#ec4899';
    document.getElementById('set-brand-color-text').value = (siteSettings.brandColorHex || '#ec4899').toUpperCase();
    
    document.getElementById('set-bg-color').value = siteSettings.bgColor || '#ffffff';
    document.getElementById('set-bg-color-text').value = (siteSettings.bgColor || '#ffffff').toUpperCase();
    
    document.getElementById('set-text-color').value = siteSettings.textColor || '#663b3b';
    document.getElementById('set-text-color-text').value = (siteSettings.textColor || '#663b3b').toUpperCase();
    
    document.getElementById('set-font').value = siteSettings.fontFamily || "'Cairo', sans-serif";
    document.getElementById('set-font-size').value = siteSettings.baseFontSize || 16;
    document.getElementById('font-size-val').innerText = (siteSettings.baseFontSize || 16) + 'px';
    document.getElementById('set-font-weight').value = siteSettings.baseFontWeight || 400;
    
    // Ticker Tab
    document.getElementById('set-ticker-active').checked = siteSettings.tickerActive !== false;
    document.getElementById('set-ticker-text').value = siteSettings.tickerText || siteSettings.announcement;
    document.getElementById('set-ticker-speed').value = siteSettings.tickerSpeed || 20;
    document.getElementById('ticker-speed-val').innerText = (siteSettings.tickerSpeed || 20) + 's';
    document.getElementById('set-ticker-font').value = siteSettings.tickerFont || "'Cairo', sans-serif";

    syncColorInput('set-brand-color', 'set-brand-color-text');
    syncColorInput('set-bg-color', 'set-bg-color-text');
    syncColorInput('set-text-color', 'set-text-color-text');
    
document.getElementById('set-font-weight').addEventListener('change', updateLiveThemePreview);

// === تشغيل وربط قسم التورت الملكية ===
fillCakeBuilderAdmin();

updateLiveThemePreview();
}


async function saveStoreSettings() {
    // Identity Data
    siteSettings.brandName = document.getElementById('set-brand').value; 
    siteSettings.announcement = document.getElementById('set-announcement').value;
    siteSettings.heroTitle = document.getElementById('set-hero-title').value; 
    siteSettings.heroDesc = document.getElementById('set-hero-desc').value;
    siteSettings.footerPhone = document.getElementById('set-footer-phone').value; 
    siteSettings.footerAddress = document.getElementById('set-footer-address').value;
    siteSettings.footerQuote = document.getElementById('set-footer-quote').value; 
    siteSettings.productLayout = document.getElementById('set-layout-full').checked ? 'full' : 'grid';

    // Theme Data
    siteSettings.brandColorHex = document.getElementById('set-brand-color').value;
    siteSettings.bgColor = document.getElementById('set-bg-color').value;
    siteSettings.textColor = document.getElementById('set-text-color').value;
    siteSettings.fontFamily = document.getElementById('set-font').value;
    siteSettings.baseFontSize = parseInt(document.getElementById('set-font-size').value);
    siteSettings.baseFontWeight = parseInt(document.getElementById('set-font-weight').value);
    
    // Ticker Data (Background color is now tied to Brand Gradient in CSS)
    siteSettings.tickerActive = document.getElementById('set-ticker-active').checked;
    siteSettings.tickerText = document.getElementById('set-ticker-text').value;
    siteSettings.tickerSpeed = parseInt(document.getElementById('set-ticker-speed').value);
    siteSettings.tickerFont = document.getElementById('set-ticker-font').value;
    siteSettings.tickerColor = "#ffffff"; // Always white for gradient readability

    try {
        await NetworkEngine.safeWrite('settings', 'main', siteSettings); saveEngineMemory('set'); 
        showSystemToast("تم حفظ الإعدادات والمظهر بنجاح! سيتم التطبيق فور إغلاق اللوحة.", "success");
        applySettingsToUI(); 
    } catch(e) { saveEngineMemory('set'); showSystemToast("تم الحفظ محلياً", "info"); applySettingsToUI(); }
}

async function changeAdminPassword() {
    const currentInput = document.getElementById('sec-current-pwd').value; 
    const newPwd = document.getElementById('sec-new-pwd').value; 
    const confirmPwd = document.getElementById('sec-confirm-pwd').value;
    
    if (!currentInput || !newPwd || !confirmPwd) { showSystemToast("يرجى ملء جميع الحقول", "error"); return; }
    
    try {
        const hashedCurrentInput = await hashPassword(currentInput);
        let isMatch = false;

        if (siteSettings.adminPasswordHash) {
            isMatch = (hashedCurrentInput === siteSettings.adminPasswordHash);
        } else if (siteSettings.adminPassword) {
            isMatch = (currentInput === siteSettings.adminPassword);
        } else {
            isMatch = (hashedCurrentInput === DEFAULT_ADMIN_HASH);
        }

        if (!isMatch) { showSystemToast("الرمز الحالي غير صحيح", "error"); return; }
        if (newPwd !== confirmPwd) { showSystemToast("الرمز الجديد غير متطابق", "error"); return; }
        if (newPwd.length < 4) { showSystemToast("يجب أن يكون 4 أحرف أو أرقام على الأقل", "error"); return; }
        
        siteSettings.adminPasswordHash = await hashPassword(newPwd);
        if(siteSettings.adminPassword) delete siteSettings.adminPassword; // تنظيف الباسورد القديمة
        
        await NetworkEngine.safeWrite('settings', 'main', siteSettings); 
        saveEngineMemory('set'); 
        showSystemToast("تم تغيير الرمز وتشفيره بنجاح 🛡️", "success");
        document.getElementById('sec-current-pwd').value = ''; document.getElementById('sec-new-pwd').value = ''; document.getElementById('sec-confirm-pwd').value = '';
    } catch(e) { 
        saveEngineMemory('set'); 
        showSystemToast("تم الحفظ محلياً", "info"); 
    }
}


function renderAdminShipping() {
    document.getElementById('admin-shipping-tbody').innerHTML = shippingZones.map(z => `
        <tr class="hover:bg-gray-800 border-b border-gray-700 transition-colors">
            <td class="p-4 font-bold text-gray-200 whitespace-nowrap">${escapeHTML(z.name)}</td>
            <td class="p-4 font-bold text-emerald-400 whitespace-nowrap">${z.fee}</td>
            <td class="p-4 text-center whitespace-nowrap"><button onclick="deleteShippingZone('${z.id}')" class="text-red-400 hover:text-white p-2 bg-gray-700 hover:bg-red-600 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function openAddShippingModal() { document.getElementById('ship-area-name').value = ''; document.getElementById('ship-area-fee').value = ''; document.getElementById('admin-ship-modal').classList.remove('hidden'); document.getElementById('admin-ship-modal').classList.add('flex'); }
function closeShipModal() { document.getElementById('admin-ship-modal').classList.add('hidden'); document.getElementById('admin-ship-modal').classList.remove('flex'); }

async function saveShippingZone() {
    const n = document.getElementById('ship-area-name').value.trim(); const f = parseInt(document.getElementById('ship-area-fee').value) || 0;
    if(!n) { showSystemToast("اكتب اسم المنطقة", "error"); return; }
    const newZone = { id: 'sh_' + generateUniqueID(), name: n, fee: f }; shippingZones.push(newZone);
    try { await NetworkEngine.safeWrite('shipping', String(newZone.id), newZone); saveEngineMemory('ship'); showSystemToast("تم الإضافة بنجاح", "success"); } 
    catch (e) { saveEngineMemory('ship'); showSystemToast("تم الإضافة محلياً", "info"); }
    closeShipModal(); renderAdminShipping();
}

async function deleteShippingZone(id) {
    if(confirm("حذف هذه المنطقة؟")) {
        shippingZones = shippingZones.filter(z => String(z.id) !== String(id));
        try { await NetworkEngine.safeDelete('shipping', String(id)); saveEngineMemory('ship'); showSystemToast("تم الحذف", "success"); } 
        catch(e) { saveEngineMemory('ship'); }
        renderAdminShipping();
    }
}

function renderAdminOverview() {
    document.getElementById('admin-stat-products').innerText = catalog.length;
    const validOrders = globalOrders.filter(o => o.status !== 'cancelled');
    document.getElementById('admin-stat-orders').innerText = validOrders.length;
    document.getElementById('admin-stat-revenue').innerText = validOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0).toLocaleString('ar-EG') + ' ج.م';
}

function renderAdminOrderFilters() {
    const filtersEl = document.getElementById('admin-order-filters');
    const filters = [
        { id: 'all', label: 'الكل' },
        { id: 'pending', label: '⏳ قيد المراجعة' },
        { id: 'processing', label: '👨‍🍳 جاري التجهيز' },
        { id: 'completed', label: '✅ تم التسليم' },
        { id: 'cancelled', label: '❌ ملغي' }
    ];
    
    filtersEl.innerHTML = filters.map(f => `
        <button onclick="setAdminOrderFilter('${f.id}')" class="whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm ${adminOrderFilter === f.id ? 'bg-pink-500 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'}">${f.label}</button>
    `).join('');
}

function setAdminOrderFilter(f) {
    adminOrderFilter = f;
    renderAdminOrderFilters();
    renderAdminOrders();
}

function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-tbody');
    
    let list = globalOrders;
    if (adminOrderFilter !== 'all') {
        list = list.filter(o => (o.status || 'pending') === adminOrderFilter);
    }

    if(list.length === 0) { tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-500 font-bold">لا توجد طلبات في هذا القسم.</td></tr>`; return; }
    
    tbody.innerHTML = list.map(o => {
        const s = o.status || 'pending';
        return `
        <tr class="hover:bg-gray-800 transition-colors border-b border-gray-700">
            <td class="p-4 font-mono text-pink-400 whitespace-nowrap">${escapeHTML(o.id)}</td>
            <td class="p-4 text-xs text-gray-400 whitespace-nowrap" dir="ltr">${escapeHTML(o.date)}</td>
            <td class="p-4 min-w-[150px]"><p class="font-bold text-gray-200">${escapeHTML(o.name)}</p><p class="text-xs text-gray-500">${escapeHTML(o.phone)} | ${escapeHTML(o.area)}</p></td>
            <td class="p-4 text-xs text-gray-400 max-w-xs truncate min-w-[200px]" title="${escapeHTML(o.items)}">${escapeHTML(o.items)}</td>
            <td class="p-4 font-black text-emerald-400 whitespace-nowrap">${escapeHTML(o.total.toString())} ج.م</td>
            <td class="p-4 whitespace-nowrap">
                <select onchange="updateOrderStatus('${o.id}', this.value)" class="bg-gray-700 border border-gray-600 font-bold text-xs text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer">
                    <option value="pending" ${s==='pending'?'selected':''}>⏳ قيد المراجعة</option>
                    <option value="processing" ${s==='processing'?'selected':''}>👨‍🍳 جاري التجهيز</option>
                    <option value="completed" ${s==='completed'?'selected':''}>✅ تم التسليم</option>
                    <option value="cancelled" ${s==='cancelled'?'selected':''}>❌ ملغي</option>
                </select>
            </td>
            <td class="p-4 text-center whitespace-nowrap">
                <button onclick="deleteOrder('${o.id}')" class="text-red-400 hover:text-white p-2 bg-gray-700 hover:bg-red-600 rounded-lg transition-colors shadow-sm"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `}).join('');
    lucide.createIcons();
}

async function updateOrderStatus(id, newStatus) {
    const orderIdx = globalOrders.findIndex(o => String(o.id) === String(id));
    if (orderIdx > -1) {
        globalOrders[orderIdx].status = newStatus;
        localStorage.setItem('boseSweets_admin_orders', JSON.stringify(globalOrders));
        try {
            await NetworkEngine.safeWrite('orders', String(id), globalOrders[orderIdx]);
            showSystemToast('تم تحديث حالة الطلب', 'success');
        } catch (e) { showSystemToast('تم تحديث الحالة محلياً', 'info'); }
        renderAdminOverview(); 
        if(adminOrderFilter !== 'all') renderAdminOrders(); 
    }
}

async function deleteOrder(id) {
    if(confirm("هل أنت متأكد من حذف أو أرشفة هذا الطلب نهائياً من السجلات؟")) {
        globalOrders = globalOrders.filter(o => String(o.id) !== String(id));
        localStorage.setItem('boseSweets_admin_orders', JSON.stringify(globalOrders));
        try { 
            await NetworkEngine.safeDelete('orders', String(id)); 
            showSystemToast("تم حذف الطلب نهائياً", "success"); 
        } catch(e) { }
        renderAdminOrders();
        renderAdminOverview();
    }
}

function renderAdminGallery() {
    const grid = document.getElementById('admin-gallery-grid');
    if (galleryData.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-8 text-center text-gray-500 font-bold"><i data-lucide="image" class="w-12 h-12 mx-auto mb-2 opacity-50"></i> لم تقم برفع أي أعمال سابقة حتى الآن.</div>`;
        lucide.createIcons(); return;
    }
    grid.innerHTML = galleryData.map(g => `
        <div class="relative group rounded-xl overflow-hidden border border-gray-600 h-32 md:h-40">
            <img src="${g.url}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button onclick="deleteGalleryImage('${g.id}')" class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

async function uploadGalleryToCloud(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.match('image.*')) { showSystemToast("الرجاء اختيار صورة فقط", "error"); return; }
    const loader = document.getElementById('gallery-upload-loader'); loader.classList.remove('hidden');
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = function(ev) {
        const img = new Image(); img.src = ev.target.result;
        img.onload = async function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 1200; let scaleSize = 1;
            if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
            canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64Str = canvas.toDataURL('image/jpeg', 0.85);
            try {
                const formData = new FormData(); formData.append('file', base64Str); formData.append('upload_preset', 'gct8i28h'); 
                const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) {
                    const newImage = { id: 'gal_' + generateUniqueID(), url: data.secure_url, timestamp: Date.now() };
                    galleryData.unshift(newImage); await NetworkEngine.safeWrite('gallery', newImage.id, newImage); saveEngineMemory('gal');
                    showSystemToast("تم رفع الصورة وإضافتها لسابقة الأعمال بنجاح 📸", "success");
                } else throw new Error("Upload failed");
            } catch (err) { showSystemToast("فشل الرفع للسحابة، تأكد من الاتصال بالإنترنت.", "error"); } 
            finally { loader.classList.add('hidden'); renderAdminGallery(); }
        }
    }
}

async function deleteGalleryImage(id) {
    if(confirm("هل أنت متأكد من حذف هذه الصورة من سابقة الأعمال؟")) {
        galleryData = galleryData.filter(g => String(g.id) !== String(id));
        try { await NetworkEngine.safeDelete('gallery', String(id)); saveEngineMemory('gal'); showSystemToast("تم الحذف بنجاح", "success"); } 
        catch(e) { saveEngineMemory('gal'); }
        renderAdminGallery();
    }
}

// CX Upgrade: Handle Multiple Images Upload Array
function renderAdminTempImages() {
    const container = document.getElementById('edit-prod-images-container');
    if(tempProdImages.length === 0) {
        container.innerHTML = `<div class="w-full text-center py-4 text-xs text-gray-500 font-bold border-2 border-dashed border-gray-700 rounded-lg">لم يتم إضافة صور للمنتج بعد</div>`;
        return;
    }
    
    container.innerHTML = tempProdImages.map((url, idx) => `
        <div class="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border-2 border-gray-600 group">
            <img src="${url}" class="w-full h-full object-cover">
            ${idx === 0 ? `<div class="absolute bottom-0 left-0 right-0 bg-pink-500/90 text-white text-[9px] font-bold text-center py-0.5">الرئيسية</div>` : ''}
            <button onclick="removeTempImage(${idx})" class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

function removeTempImage(idx) {
    tempProdImages.splice(idx, 1);
    renderAdminTempImages();
}

async function compressAndUploadMultiImage(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.match('image.*')) { showSystemToast("الرجاء اختيار ملف صورة فقط", "error"); return; }
    
    const spinner = document.getElementById('uploading-spinner');
    spinner.classList.remove('hidden');

    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = function(ev) {
        const img = new Image(); img.src = ev.target.result;
        img.onload = async function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; let scaleSize = 1;
            if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
            canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64Str = canvas.toDataURL('image/jpeg', 0.8);
            
            try {
                const formData = new FormData(); formData.append('file', base64Str); formData.append('upload_preset', 'gct8i28h'); 
                const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) { 
                    tempProdImages.push(data.secure_url);
                    renderAdminTempImages();
                    showSystemToast("تم رفع الصورة وإضافتها للمنتج ☁️", "success"); 
                } else throw new Error("Upload failed");
            } catch (err) { 
                tempProdImages.push(base64Str);
                renderAdminTempImages();
                showSystemToast("تم الحفظ محلياً", "info"); 
            } finally {
                spinner.classList.add('hidden');
                document.getElementById('prod-img-upload').value = ''; // reset input
            }
        }
    }
}

function renderAdminCatalogTabs() {
    const tabsEl = document.getElementById('admin-catalog-tabs');
    let html = `<button onclick="setAdminCat('all')" class="whitespace-nowrap px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm ${adminCurrentCat === 'all' ? 'bg-pink-500 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'}">عرض الكل</button>`;
    
    catMenu.forEach(c => {
        html += `<button onclick="setAdminCat('${c}')" class="whitespace-nowrap px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm ${adminCurrentCat === c ? 'bg-pink-500 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'}">${c}</button>`;
    });
    tabsEl.innerHTML = html;
}

function setAdminCat(c) {
    adminCurrentCat = c;
    renderAdminCatalogTabs();
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    renderAdminMenu(currentSearch);
}

function renderAdminMenu(searchQuery = '') {
    let list = catalog;

    if (adminCurrentCat !== 'all') {
        list = list.filter(p => p.category === adminCurrentCat);
    }

    if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(p => 
            (p.name && p.name.toLowerCase().includes(q)) || 
            (p.category && p.category.toLowerCase().includes(q)) || 
            (p.subType && p.subType.toLowerCase().includes(q))
        );
    }
    
    document.getElementById('admin-menu-tbody').innerHTML = list.map(p => {
        let layoutBadge = '';
        if (p.layout === 'full') layoutBadge = '<span class="mr-3 text-[10px] bg-pink-900/40 text-pink-300 px-2.5 py-1 rounded-md border border-pink-700/50">كارت كبير</span>';
        if (p.layout === 'half') layoutBadge = '<span class="mr-3 text-[10px] bg-blue-900/40 text-blue-300 px-2.5 py-1 rounded-md border border-blue-700/50">كارت صغير</span>';
        
        let stockBadge = p.inStock === false ? '<span class="mr-2 text-[10px] bg-red-900/40 text-red-300 px-2.5 py-1 rounded-md border border-red-700/50"><i data-lucide="ban" class="w-3 h-3 inline"></i> نفدت</span>' : '';

        // First image or fallback
        const renderImg = (p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category));

        return `
        <tr class="hover:bg-gray-800 transition-colors border-b border-gray-700 ${p.inStock === false ? 'opacity-70' : ''}">
            <td class="p-4 whitespace-nowrap relative">
                <img src="${renderImg}" class="w-10 h-10 object-cover rounded-lg border border-gray-600 ${p.inStock === false ? 'grayscale' : ''}">
                ${(p.images && p.images.length > 1) ? `<span class="absolute top-3 left-3 bg-black/60 text-white text-[8px] px-1 rounded font-bold">+${p.images.length - 1}</span>` : ''}
            </td>
            <td class="p-4 whitespace-nowrap"><span class="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">${escapeHTML(p.category)}</span></td>
            <td class="p-4 font-bold text-gray-200 min-w-[200px] flex items-center flex-wrap gap-y-2 h-[73px]">${escapeHTML(p.name)} ${layoutBadge} ${stockBadge}</td>
            <td class="p-4 text-emerald-400 font-black whitespace-nowrap">${Number(p.price) > 0 ? Number(p.price) : 'متغير'}</td>
            <td class="p-4 whitespace-nowrap text-xs font-bold text-pink-300">${p.badge ? p.badge : '-'}</td>
            <td class="p-4 text-center whitespace-nowrap">
                <div class="flex gap-2 justify-center">
                    <button onclick="openEditModal('${p.id}')" class="text-blue-400 hover:text-white p-2 bg-gray-700 hover:bg-blue-600 rounded-lg shadow-sm transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="deleteProduct('${p.id}')" class="text-red-400 hover:text-white p-2 bg-gray-700 hover:bg-red-600 rounded-lg shadow-sm transition-colors"><i data-lucide="trash" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>
    `}).join('');
    lucide.createIcons();
}

function openAddProductModal() {
    currentEditId = null; document.getElementById('prod-modal-title').innerText = "إضافة منتج";
    ['id','name','price','sub','desc'].forEach(k => { const el = document.getElementById(`edit-prod-${k}`); if(el) el.value = ''; });
    document.getElementById('edit-prod-cat').value = adminCurrentCat === 'all' ? "جاتوهات" : adminCurrentCat; 
    document.getElementById('edit-prod-layout').value = 'default';
    document.getElementById('edit-prod-badge').value = '';
    document.getElementById('edit-prod-instock').checked = true; 
    
    tempProdImages = [];
    renderAdminTempImages();
    
    const m = document.getElementById('admin-prod-modal'); m.classList.remove('hidden'); m.classList.add('flex');
}

function openEditModal(id) {
    const p = catalogMap.get(String(id)); 
    if (p) {
        currentEditId = String(id); document.getElementById('prod-modal-title').innerText = "تعديل المنتج";
        document.getElementById('edit-prod-id').value = p.id; document.getElementById('edit-prod-name').value = p.name;
        document.getElementById('edit-prod-price').value = p.price; document.getElementById('edit-prod-cat').value = p.category;
        
        document.getElementById('edit-prod-sub').value = p.subType || p.size || p.flowerType || ""; 
        document.getElementById('edit-prod-layout').value = p.layout || 'default';
        document.getElementById('edit-prod-badge').value = p.badge || '';
        document.getElementById('edit-prod-instock').checked = p.inStock !== false; 
        document.getElementById('edit-prod-desc').value = p.desc || ''; 
        
        // Init Temp Images
        if(p.images && p.images.length > 0) {
            tempProdImages = [...p.images];
        } else if(p.img) {
            tempProdImages = [p.img];
        } else {
            tempProdImages = [];
        }
        renderAdminTempImages();
        
        const m = document.getElementById('admin-prod-modal'); m.classList.remove('hidden'); m.classList.add('flex');
    }
}

function closeProdModal() { const m = document.getElementById('admin-prod-modal'); m.classList.add('hidden'); m.classList.remove('flex'); currentEditId = null; }

async function saveProductData() {
    const nName = document.getElementById('edit-prod-name').value.trim(); const nPrice = parseInt(document.getElementById('edit-prod-price').value) || 0;
    const nCat = document.getElementById('edit-prod-cat').value; const nSub = document.getElementById('edit-prod-sub').value.trim();
    const nLayout = document.getElementById('edit-prod-layout').value;
    const nBadge = document.getElementById('edit-prod-badge').value;
    const nInStock = document.getElementById('edit-prod-instock').checked; 
    const nDesc = document.getElementById('edit-prod-desc').value.trim();
    
    if(!nName) { showSystemToast("يجب كتابة اسم المنتج", "error"); return; }

    const finalImagesArray = [...tempProdImages];
    const finalImg = finalImagesArray.length > 0 ? finalImagesArray[0] : '';

    let prodObj;
    if (currentEditId) {
        const idx = catalog.findIndex(x => String(x.id) === String(currentEditId));
        if (idx > -1) {
            catalog[idx].name = nName; catalog[idx].price = nPrice; catalog[idx].category = nCat; catalog[idx].desc = nDesc; 
            catalog[idx].images = finalImagesArray; catalog[idx].img = finalImg;
            catalog[idx].subType = nSub; catalog[idx].layout = nLayout; catalog[idx].badge = nBadge; catalog[idx].inStock = nInStock;
            if(nCat === 'ديسباسيتو') catalog[idx].size = nSub; if(nCat === 'ورد') catalog[idx].flowerType = nSub; 
            prodObj = catalog[idx];
        }
    } else {
        prodObj = { id: Date.now() + Math.floor(Math.random()*1000), category: nCat, name: nName, price: nPrice, desc: nDesc, images: finalImagesArray, img: finalImg, subType: nSub, layout: nLayout, badge: nBadge, inStock: nInStock };
        if(nCat === 'ديسباسيتو') prodObj.size = nSub || 'وسط'; if(nCat === 'ورد') prodObj.flowerType = nSub || 'ورد طبيعي'; 
        catalog.unshift(prodObj); 
    }
    syncCatalogMap(); 
    try { await NetworkEngine.safeWrite('catalog', String(prodObj.id), prodObj); saveEngineMemory('cat'); showSystemToast("تم الحفظ بنجاح", "success"); } 
    catch(e) { saveEngineMemory('cat'); showSystemToast("تم الحفظ محلياً", "info"); }
    
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    closeProdModal(); renderAdminMenu(currentSearch); renderAdminOverview(); if(state.activeCat === nCat) renderMainDisplay();
}

async function deleteProduct(id) {
    if(confirm("حذف هذا المنتج بشكل نهائي؟")) {
        const safeId = String(id); catalog = catalog.filter(p => String(p.id) !== safeId); syncCatalogMap(); 
        try { await NetworkEngine.safeDelete('catalog', safeId); saveEngineMemory('cat'); showSystemToast("تم الحذف بنجاح", "success"); } 
        catch(e) { saveEngineMemory('cat'); }
        
        const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
        renderAdminMenu(currentSearch); renderAdminOverview(); renderMainDisplay(); 
    }
}

function showInfo(t) {
    const d = {
        about: { t: 'من نحن', b: siteSettings.footerQuote },
        privacy: { t: 'سياسة الخصوصية والأمان', b: 'تلتزم إدارة حلويات بوسي بمنتهى السرية والاحترافية في التعامل مع بياناتكم وطلباتكم.' },
        refund: { t: 'سياسة الاسترجاع والتعديل', b: 'يتم التعديل على الطلبات المخصصة قبل التنفيذ بـ 24 ساعة على الأقل.' },
        care: { t: 'دليل الجودة الملكي', b: '1. الحفظ في مبرد (4-8 مئوية).\n2. تجنب ترك المنتج في السيارة.\n3. يُنصح بالتقديم بعد 10 دقائق من الخروج من المبرد.' }
    };
    document.getElementById('info-title').innerText = d[t].t; document.getElementById('info-body').innerText = d[t].b;
    const m = document.getElementById('info-modal'); m.classList.remove('hidden'); m.classList.add('flex'); lucide.createIcons();
}
function closeInfo() { const m = document.getElementById('info-modal'); m.classList.add('hidden'); m.classList.remove('flex'); }

// === محرك إدارة التورت الملكية ===
function fillCakeBuilderAdmin() {
    if (!siteSettings.cakeBuilder) siteSettings.cakeBuilder = JSON.parse(JSON.stringify(defaultSettings.cakeBuilder));
    const c = siteSettings.cakeBuilder;
    document.getElementById('set-cake-base-price').value = c.basePrice || 145;
    document.getElementById('set-cake-desc').value = c.desc || "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة، مع ضمان تنفيذ إدارة حلويات بوسي لكافة الطلبات بأعلى مستوى احترافي.";
    document.getElementById('set-cake-min-sq').value = c.minSquare || 16;
    document.getElementById('set-cake-min-rect').value = c.minRect || 20;
    
    const edible = c.imagePrinting.find(i => i.label === 'صورة قابلة للأكل');
    const nonedible = c.imagePrinting.find(i => i.label === 'صورة غير قابلة للأكل');
    if(edible) document.getElementById('set-print-edible').value = edible.price;
    if(nonedible) document.getElementById('set-print-nonedible').value = nonedible.price;

    renderAdminCakeFlavors();
    renderAdminCakeImages();
}

function renderAdminCakeFlavors() {
    const list = siteSettings.cakeBuilder.flavors || [];
    document.getElementById('admin-cake-flavors-list').innerHTML = list.map((fl, idx) => `
        <div class="bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-gray-600">
            <span>${fl}</span>
            <button onclick="removeCakeFlavor(${idx})" class="text-red-400 hover:text-red-300"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

function addCakeFlavor() {
    const val = document.getElementById('new-flavor-input').value.trim();
    if(!val) return;
    if(!siteSettings.cakeBuilder.flavors) siteSettings.cakeBuilder.flavors = [];
    siteSettings.cakeBuilder.flavors.push(val);
    document.getElementById('new-flavor-input').value = '';
    renderAdminCakeFlavors();
}

function removeCakeFlavor(idx) {
    siteSettings.cakeBuilder.flavors.splice(idx, 1);
    renderAdminCakeFlavors();
}

function renderAdminCakeImages() {
    const list = siteSettings.cakeBuilder.images || [];
    const container = document.getElementById('admin-cake-images-list');
    if(list.length === 0) { container.innerHTML = `<span class="text-xs text-gray-500">لا يوجد صور، سيتم استخدام الصورة الافتراضية.</span>`; return; }
    container.innerHTML = list.map((url, idx) => `
        <div class="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-600 group">
            <img src="${url}" class="w-full h-full object-cover">
            <button onclick="removeCakeImage(${idx})" class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

function removeCakeImage(idx) {
    siteSettings.cakeBuilder.images.splice(idx, 1);
    renderAdminCakeImages();
}

async function uploadCakeImage(e) {
    const file = e.target.files[0]; if (!file) return;
    const spinner = document.getElementById('cake-upload-spinner'); spinner.classList.remove('hidden');
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = function(ev) {
        const img = new Image(); img.src = ev.target.result;
        img.onload = async function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; let scaleSize = 1;
            if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
            canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64Str = canvas.toDataURL('image/jpeg', 0.8);
            try {
                const formData = new FormData(); formData.append('file', base64Str); formData.append('upload_preset', 'gct8i28h'); 
                const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) { 
                    if(!siteSettings.cakeBuilder.images) siteSettings.cakeBuilder.images = [];
                    siteSettings.cakeBuilder.images.push(data.secure_url);
                    renderAdminCakeImages();
                    showSystemToast("تم رفع الصورة للسحابة", "success");
                }
            } catch (err) { 
                if(!siteSettings.cakeBuilder.images) siteSettings.cakeBuilder.images = [];
                siteSettings.cakeBuilder.images.push(base64Str); renderAdminCakeImages(); showSystemToast("تم الحفظ محلياً", "info");
            } finally { spinner.classList.add('hidden'); }
        }
    }
}

async function saveCakeBuilderSettings() {
    const c = siteSettings.cakeBuilder;
    c.basePrice = Number(document.getElementById('set-cake-base-price').value) || 145;
    c.desc = document.getElementById('set-cake-desc').value;
    c.minSquare = Number(document.getElementById('set-cake-min-sq').value) || 16;
    c.minRect = Number(document.getElementById('set-cake-min-rect').value) || 20;
    
    c.imagePrinting = [
        { label: 'بدون', price: 0 },
        { label: 'صورة قابلة للأكل', price: Number(document.getElementById('set-print-edible').value) || 0 },
        { label: 'صورة غير قابلة للأكل', price: Number(document.getElementById('set-print-nonedible').value) || 0 }
    ];

    try {
        await NetworkEngine.safeWrite('settings', 'main', siteSettings); saveEngineMemory('set'); 
        showSystemToast("تم حفظ تعديلات التورت الملكية بنجاح! 👑", "success");
        if(state.activeCat === 'تورت') renderMainDisplay();
    } catch(e) { saveEngineMemory('set'); showSystemToast("تم الحفظ محلياً", "info"); }
}


window.addEventListener('scroll', () => {
    const n = document.getElementById('navbar');
    if (window.scrollY > 30) { n.classList.add('nav-scrolled'); }
    else { n.classList.remove('nav-scrolled'); }
});

window.onload = initApp;
// --- محرك إدارة الأقسام الديناميكي لـ BoseSweets ---

function renderAdminCategories() {
const listEl = document.getElementById('admin-categories-list');
if (!listEl) return;
if (catMenu.length === 0) {
listEl.innerHTML = `<p class="text-center text-gray-500 py-8 font-bold">لا توجد أقسام حالياً. ابدأ بإضافة أول قسم لـ BoseSweets!</p>`;
return;
}
listEl.innerHTML = catMenu.map((cat, index) => `
<div class="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-xl group hover:border-pink-500 transition-all">
    <div class="flex items-center gap-3">
        <span class="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg text-xs text-gray-400 font-mono">${index + 1}</span>
        <span class="font-bold text-gray-200">${cat}</span>
    </div>
    <button onclick="removeCategory(${index})" class="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
        <i data-lucide="trash-2" class="w-5 h-5"></i>
    </button>
</div>
`).join('');
lucide.createIcons();
}

function addNewCategory() {
const input = document.getElementById('new-category-input');
const val = input.value.trim();
if (!val) { showSystemToast("اكتبي اسم القسم الأول يا إدارة", "error"); return; }
if (catMenu.includes(val)) { showSystemToast("القسم ده موجود فعلاً", "error"); return; }
catMenu.push(val);
input.value = '';
renderAdminCategories();
showSystemToast(`تمت إضافة "${val}" للقائمة المؤقتة`, "success");
}

function removeCategory(index) {
// 👑 درع الحماية: منع حذف قسم التورت الملكية
if (catMenu[index] === 'تورت') {
showSystemToast("عفواً، لا يمكن حذف قسم التورت الملكية الأساسي! 👑", "error");
return;
}

if (confirm(`حذف قسم "${catMenu[index]}"؟ (المنتجات مش هتتحذف)`)) {
catMenu.splice(index, 1);
renderAdminCategories();
}
}


async function saveCategoriesToCloud() {
try {
siteSettings.catMenu = catMenu; 
await NetworkEngine.safeWrite('settings', 'main', siteSettings);
renderCategories();
renderAdminCatalogTabs();
renderCustomerSidebarCategories();
showSystemToast("تم حفظ وترتيب الأقسام سحابياً بنجاح! ✨", "success");
} catch (e) { showSystemToast("فشل الحفظ سحابياً", "error"); }
}
// === محرك حلويات بوسي لتوليد الوصف الذكي (نسخة كشف الأعطال) ===
async function generateSmartDescription() {
const prodName = document.getElementById('edit-prod-name').value.trim();
const prodCat = document.getElementById('edit-prod-cat').value;
const btn = document.getElementById('btn-smart-desc');
const descField = document.getElementById('edit-prod-desc');

if (!prodName) {
alert('اكتبي اسم المنتج الأول يا إدارة عشان نقدر نولد وصفه ✨');
return;
}

const originalBtnHTML = btn.innerHTML;
btn.innerHTML = 'جاري التفكير... ⏳';
btn.disabled = true;

try {
// حطي المفتاح بتاعك هنا زي ما عملتي المرة اللي فاتت بالظبط
const apiKey = 'AIzaSyBr3ERdNUbAegDPHk4TOMF3sHxMMVYCFxk'; 

const promptText = `أنت كاتب إعلانات محترف لعلامة تجارية مصرية راقية اسمها "حلويات بوسي"
اكتب وصف قصير وجذاب لمنتج اسمه "${prodName}" من قسم "${prodCat}"
الشروط: لهجة مصرية عامية راقية، بدون علامات ترقيم، استخدم إيموجي تخدم المعنى، لا يتعدى سطرين.`;

const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
    })
});

const data = await response.json();

// لو جوجل رفض الطلب، هنمسك رسالة الرفض ونعرضها
if (!response.ok) {
    throw new Error(data.error ? data.error.message : 'خطأ غير معروف من جوجل');
}

if (data.candidates && data.candidates.length > 0) {
    descField.value = data.candidates[0].content.parts[0].text.trim();
    alert('تم التوليد بنجاح! 👑 راجعي الوصف في الخانة.');
} else {
    throw new Error('الذكاء الاصطناعي ماردش بوصف صحيح.');
}

} catch (error) {
// الشاشة المنبثقة اللي هتقولنا العيب فين بالظبط
alert("تنبيه للإدارة! سبب المشكلة: \n" + error.message);
} finally {
// إرجاع الزرار لشكله الطبيعي في كل الحالات
btn.innerHTML = originalBtnHTML;
btn.disabled = false;
lucide.createIcons();
}
}

