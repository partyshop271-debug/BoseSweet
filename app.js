// ⚡ Engine Upgrade: Clean & Stable Catalog Engine (BoseSweets Sovereign V17.0)
// 👑 تم تنظيف المحرك ودمج نظام Lightbox والمساحات الواسعة مع الحفاظ على الاستقرار 100%

const MemoryManager = {
    timers: {},
    set(key, callback, delay) {
        if (this.timers[key]) clearTimeout(this.timers[key]);
        this.timers[key] = setTimeout(() => {
            callback();
            delete this.timers[key];
        }, delay);
    },
    clear(key) {
        if (this.timers[key]) clearTimeout(this.timers[key]);
        delete this.timers[key];
    },
    flush() {
        for (let key in this.timers) {
            clearTimeout(this.timers[key]);
            delete this.timers[key];
        }
    }
};

const LiveSearchEngine = {
    index: new Map(),
    normalizeArabic(text) {
        if (!text) return '';
        return String(text).replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ـ/g, ''); 
    },
    build(catalogData) {
        this.index.clear();
        catalogData.forEach(p => {
            const rawTokens = `${p.name || ''} ${p.category || ''} ${p.desc || ''} ${p.subType || ''} ${p.size || ''}`;
            const tokens = this.normalizeArabic(rawTokens).toLowerCase();
            this.index.set(p.id, { tokens, data: p });
        });
    },
    search(query) {
        const q = this.normalizeArabic(query.toLowerCase().trim());
        if (!q) return [];
        const results = [];
        const qTokens = q.split(/\s+/);
        
        for (let [id, item] of this.index.entries()) {
            let isMatch = true;
            for (let qt of qTokens) {
                if (!item.tokens.includes(qt)) {
                    let typoMatch = false;
                    if(qt.length > 3) {
                        const itemWords = item.tokens.split(/\s+/);
                        for(let w of itemWords) {
                            if(w.length === qt.length) {
                                let diff = 0;
                                for(let i=0; i<qt.length; i++) if(qt[i] !== w[i]) diff++;
                                if(diff <= 1) { typoMatch = true; break; } 
                            }
                        }
                    }
                    if(!typoMatch) { isMatch = false; break; }
                }
            }
            if (isMatch) results.push(item.data);
        }
        return results.slice(0, 12); 
    }
};

let liveSearchTimeout = null;
window.performLiveSearchDebounced = function(query) {
    if (liveSearchTimeout) clearTimeout(liveSearchTimeout);
    liveSearchTimeout = setTimeout(() => { performLiveSearch(query); }, 500); 
};

const ClientStorageEngine = {
    dbName: 'BoseSweetsClientDB',
    cartStore: 'CartStore',
    queueStore: 'PendingOrdersQueue',
    version: 2,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.cartStore)) db.createObjectStore(this.cartStore);
                if (!db.objectStoreNames.contains(this.queueStore)) db.createObjectStore(this.queueStore, { keyPath: 'id' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    async set(key, value) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.cartStore, 'readwrite');
                const store = tx.objectStore(this.cartStore);
                store.put(value, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {}
    },
    async get(key) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.cartStore, 'readonly');
                const store = tx.objectStore(this.cartStore);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            });
        } catch (e) { return null; }
    },
    async remove(key) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.cartStore, 'readwrite');
                const store = tx.objectStore(this.cartStore);
                store.delete(key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch(e) {}
    },
    async queueOrder(orderData) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.queueStore, 'readwrite');
                const store = tx.objectStore(this.queueStore);
                store.put(orderData);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch(e) {}
    },
    async getQueuedOrders() {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.queueStore, 'readonly');
                const store = tx.objectStore(this.queueStore);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch(e) { return []; }
    },
    async removeQueuedOrder(id) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.queueStore, 'readwrite');
                const store = tx.objectStore(this.queueStore);
                store.delete(id);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch(e) {}
    }
};

const detailedDescriptions = {
    'ديسباسيتو نوتيلا مثلث': 'منتج ديسباسيتو الفاخر بحجم صغير، يتكون من قاعدة فادج كيك غنية مضاف إليها طبقة كثيفة من صوص النوتيلا الأصلي لضمان تجربة تذوق احترافية 🍫',
    'ديسباسيتو نوتيلا وسط': 'الإصدار المتوسط من ديسباسيتو نوتيلا، يتميز بتوازن دقيق بين طبقة الكيك الغنية وكريمة النوتيلا، مصمم لمحبي المذاق المتزن 🍫',
    'ديسباسيتو نوتيلا كبير': 'الحجم العائلي الفاخر من ديسباسيتو نوتيلا، يحتوي على كمية مضاعفة من صوص النوتيلا الأصلي فوق قاعدة فادج حلويات بوسي الكثيفة 🍫',
    'ورد طبيعي': 'تنسيق فاخر من الورد الطبيعي الطازج، يتم اختياره وفق معايير الجودة العالية لضمان النضارة والاستدامة، يمثل لغة تعبير راقية في المناسبات الرسمية 💐',
    'ورد صناعي': 'ورد صناعي مصنع من خامات ملكية فاخرة تحاكي الملمس الطبيعي، قطعة ديكور مستديمة تحتفظ برونقها كذكرى كلاسيكية راقية 🌷👑',
    'ورد ستان': 'عمل يدوي احترافي مصنع من أجود أنواع الستان بحرفية حلويات بوسي، يتميز بملمس ناعم ومظهر بريستيج مخصص للإهداءات الخاصة 🎀💖',
    'ورد فلوس': 'طريقة مهنية ومبتكرة لتنسيق الهدايا النقدية، تدمج بين الفن ودقة التقديم لتوفير تجربة إهداء غير تقليدية ومبهرة 💸🌹',
    'ورد هدايا': 'تنسيق متكامل يدمج بين رقة الورد وشياكة التغليف الهندسي، مصمم ليكون المكمل المثالي للهدايا القيمة بلمسات فنية متطورة 🎁✨',
    'ورد شيكولاتة': 'بوكيه حصري يجمع بين تنسيق الورد الفاخر وقطع شيكولاتة حلويات بوسي الملكية، هدية تدمج بين القيمة البصرية والمذاق الرفيع 🍫🌹',
    'جاتوه كلاسيك': 'قطعة جاتوه فاخرة تعتمد على فادج كيك خفيف الوزن مع كريمة غنية ونسبة سكر مدروسة بدقة، تمثل الاختيار الاحترافي للمناسبات 🍰✨',
    'تورتة ميني': 'تورتة ميني مصممة لشخصين، تتميز بتصميم ملكي مكثف وتفاصيل دقيقة تناسب الاحتفالات الثنائية الخاصة 🎂🥰',
    'حجم (فرد - فردين)': 'تورتة الإصدار الخاص من حلويات بوسي، تتميز بتصميم هندسي انسيابي يكفي لشخصين، مع حشوات غنية وكيك هش عالي الجودة 🥰',
    'حجم (3 - 4 أفراد)': 'الاختيار المتوازن للمناسبات العائلية الصغيرة، تورتة تجمع بين الرقي في التصميم ووفرة المكونات، تكفي 4 أفراد بقطع متساوية وغنية ✨',
    'حجم (5 - 6 أفراد)': 'تورتة المناسبات الرسمية الكبيرة، تتميز بحجم عائلي وتفاصيل فنية معقدة وحشوات بريميوم تضمن أعلى معايير الضيافة 🎂🎉',
    'سينابون': 'مخبوزات سينابون تعتمد على عجينة قطنية احترافية محشوة بالقرفة الفاخرة والسكر البني، مغطاة بصوص كريمي خاص يمنحها مذاقاً متفرداً 🍥🤎',
    'سينابون نوتيلا': 'مزيج احترافي بين القرفة الدافئة وصوص النوتيلا الأصلي الموزع بعناية فوق عجينة السينابون الهشة 🤎🍫'
};

function getCapsuleDescription(p) {
    if (!p) return '';
    let n = (p.name ? String(p.name) : '').trim().toLowerCase();
    let c = (p.category ? String(p.category) : '').trim().toLowerCase();

    if (c.includes('دوناتس') && n.includes('نوتيلا')) return 'دوناتس تعتمد على عجينة خفيفة محشوة بشيكولاتة نوتيلا أصلية، مصنعة لضمان أعلى مستويات الجودة 🍩🍫';
    if (c.includes('سينابون') && n.includes('نوتيلا')) return 'مزيج من عجينة السينابون القطنية مع صوص النوتيلا الفاخر، اختيار مثالي لمحبي التميز 🤎🍫';
    if (c.includes('قشطوط') && n.includes('نوتيلا')) return 'قشطوطة مكونة من كيك غني بالحليب وطبقة قشطة طبيعية مغطاة بالنوتيلا الأصلية لضمان توازن المذاق ☁️🍫';
    if (n.includes('كبات') && n.includes('نوتيلا')) return 'طبقات كيك وكريمة نوتيلا غنية مقدمة في كب بتصميم عصري يناسب التقديم الفردي الراقي 🧁🍫';
    if (c.includes('ديسباسيتو') && n.includes('نوتيلا')) return 'فادج كيك شيكولاتة مركز مع طبقة سخية من النوتيلا البرازيلية الأصلية 🍫';
    if (c.includes('دوناتس') || c.includes('بامبوليني')) return 'عجينة مخبوزات خفيفة مغطاة بصوصات متنوعة محضرة وفق معايير حلويات بوسي 🍩';
    if (c.includes('سينابون') || n.includes('سينابون')) return 'عجينة قطنية طرية غنية بالقرفة وصوص الجبن الكريمي الخاص 🤎✨';
    if (c.includes('ديسباسيتو') || n.includes('ديسباسيتو')) return 'كيك فادج غني مضاف إليه صوص الشيكولاتة البرازيلي الفاخر 🍫';
    if (c.includes('قشطوط') || n.includes('قشطوط')) return 'كيكة مشبعة بالحليب والقشطة الطبيعية، تتميز بملمس ناعم ومذاق منعش ☁️🤍';

    return 'إصدار فاخر من حلويات بوسي، مُعد بمكونات عالية الجودة لضمان تجربة تذوق استثنائية ✨';
}

function getFinalDescription(p, isFullWidth) {
    if (!p) return '';
    if (p.desc && typeof p.desc === 'string' && p.desc.trim().length > 3) return escapeHTML(p.desc.trim());
    
    let n = (p.name ? String(p.name) : '').trim().toLowerCase();
    let c = (p.category ? String(p.category) : '').trim().toLowerCase();
    let sub = (p.subType ? String(p.subType) : (p.size ? String(p.size) : (p.flowerType ? String(p.flowerType) : ''))).trim().toLowerCase();
    
    const exactKey1 = `${c} ${n} ${sub}`.trim(); 
    const exactKey2 = `${n} ${sub}`.trim();      
    const exactKey3 = `${c} ${sub}`.trim();      
    const exactKey4 = `${sub}`.trim();           
    const exactKey5 = `${n}`.trim();             

    for (let key in detailedDescriptions) {
        let kLower = key.toLowerCase();
        if (exactKey1 === kLower || exactKey2 === kLower || exactKey3 === kLower || exactKey4 === kLower || exactKey5 === kLower) {
            return detailedDescriptions[key];
        }
    }
    
    for (let key in detailedDescriptions) {
        let kLower = key.toLowerCase();
        if ((n.includes(kLower) || sub.includes(kLower)) && c === 'تورت') return detailedDescriptions[key];
        if ((n.includes('جاتوه') || c.includes('جاتوه')) && key.includes('جاتوه')) return detailedDescriptions['جاتوه كلاسيك']; 
    }

    return getCapsuleDescription(p);
}

function hexToMathHSL(hex) {
    try {
        if (!hex || typeof hex !== 'string') return 340;
        hex = hex.replace('#', '').trim();
        let r = 0, g = 0, b = 0;
        if (hex.length === 3) { 
            r = parseInt(hex[0]+hex[0], 16); g = parseInt(hex[1]+hex[1], 16); b = parseInt(hex[2]+hex[2], 16); 
        } else if (hex.length === 6) { 
            r = parseInt(hex.substring(0,2), 16); g = parseInt(hex.substring(2,4), 16); b = parseInt(hex.substring(4,6), 16); 
        } else { return 340; }
        
        r /= 255; g /= 255; b /= 255;
        let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0;
        if (delta === 0) h = 0;
        else if (cmax === r) h = ((g - b) / delta) % 6;
        else if (cmax === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = Math.round(h * 60); if (h < 0) h += 360;
        return isNaN(h) ? 340 : h;
    } catch(e) { return 340; }
}

let catalogMap = new Map();
function syncCatalogMap() { 
    catalogMap.clear(); 
    if(Array.isArray(catalog)) {
        catalog.forEach(p => { if(p) catalogMap.set(String(p.id), p) }); 
    }
}

function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function generateUniqueID() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

function optimizeCloudinaryUrl(url) {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return url;
    if (url.includes('q_auto') || url.includes('f_auto')) return url; 
    return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
}

function generateSecureOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const cryptoRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BS-${timestamp}-${cryptoRandom}`;
}

function showSystemToast(message, type = 'info') {
    const toast = document.getElementById('system-toast');
    if(!toast) return;
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    msgEl.innerText = message;
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[1500] flex items-center gap-4 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl font-bold text-sm max-w-[90vw] text-center border border-gray-700 animate-fade-in ${type === 'error' ? 'bg-red-900' : (type === 'success' ? 'bg-emerald-800' : 'bg-gray-900')}`;
    iconEl.setAttribute('data-lucide', type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info'));
    if(window.lucide) lucide.createIcons();
    
    MemoryManager.set('toast_timer', () => {
        toast.classList.replace('flex', 'hidden'); 
        toast.classList.remove('animate-fade-in');
    }, 4000);
}

const defaultSettings = {
    brandName: "حلويات بوسي", announcement: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب",
    heroTitle: "أهلاً بكم في <br class='hidden md:block'/> <span class='text-white relative inline-block mt-1 md:mt-2 drop-shadow-md'>حلويات بوسي</span>",
    heroDesc: "يسر إدارة حلويات بوسي استعراض تشكيلتها الحصرية من الأصناف الفاخرة والمُعدة بعناية فائقة لتليق بذوقكم الرفيع ومناسباتكم السعيدة.",
    footerPhone: "01097238441", footerAddress: "الكفاح، مركز الفرافرة، <br> محافظة الوادي الجديد",
    footerQuote: `"نؤمن أن الحلويات لغة للتعبير عن المحبة، لذا نصنع كل قطعة بشغف لنكون شركاءكم في أجمل اللحظات."`,
    productLayout: "grid", brandColorHex: "#ff3377", bgColor: "#ffffff", textColor: "#663b3b",
    fontFamily: "'Cairo', sans-serif", baseFontSize: 16, baseFontWeight: 400,
    tickerActive: true, tickerText: "حلويات بوسي: تجربة تذوق ملكية في قلب الوادي الجديد ✨", tickerSpeed: 20, tickerFont: "'Cairo', sans-serif", tickerColor: "#ffffff",
    cakeBuilder: { basePrice: 145, desc: "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة وفق أعلى معايير الجودة.", minSquare: 16, minRect: 20, flavors: ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت'], images: [], imagePrinting: [{ label: 'بدون', price: 0 }, { label: 'صورة قابلة للأكل', price: 60 }, { label: 'صورة غير قابلة للأكل', price: 20 }] }
};

const defaultShipping = [ { id: 'sh_1', name: 'الكفاح', fee: 0 }, { id: 'sh_2', name: 'أبو منقار', fee: 50 }, { id: 'sh_3', name: 'النهضة', fee: 30 }, { id: 'sh_4', name: 'مركز الفرافرة', fee: 20 } ];

let defaultCatalog = [
    { id: 'dp_tri_dark', name: 'ديسباسيتو نوتيلا دارك', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_lotus', name: 'ديسباسيتو لوتس', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_white', name: 'ديسباسيتو نوتيلا وايت', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_caramel', name: 'ديسباسيتو كراميل', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_kinder', name: 'ديسباسيتو كيندر', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true }
];

async function fetchDefaultCatalog() {
    try { const response = await fetch('data.json'); const fetchedData = await response.json(); if(fetchedData && fetchedData.length > 0) defaultCatalog = [...defaultCatalog, ...fetchedData]; } 
    catch (error) {}
}

let siteSettings = { ...defaultSettings };
let shippingZones = [ ...defaultShipping ];
let catalog = []; let galleryData = []; let catMenu = [];
let isAppReady = false; 

const dSizes = ['مثلث', 'وسط', 'كبير']; const fTypes = ['ورد طبيعي', 'ورد صناعي', 'ورد ستان', 'ورد هدايا', 'ورد فلوس', 'ورد شيكولاتة'];
let state = { activeCat: 'تورت', dSize: 'مثلث', fType: 'ورد طبيعي', cart: [], currentShippingFee: 0, cakeBuilder: { flv: 'فانيليا', ps: 4, sh: 'دائري', trd: false, img: 'بدون', msg: '', alg: '', occ: '', refImgUrl: '', hasRefImg: false, crd: false, dlg: false } };

window.openGlobalLightbox = function(imgUrl) {
    const lightbox = document.getElementById('global-image-lightbox');
    const mainImg = document.getElementById('lightbox-main-img');
    if(lightbox && mainImg) {
        mainImg.src = imgUrl;
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        setTimeout(() => {
            lightbox.classList.remove('opacity-0');
            mainImg.classList.remove('scale-95');
            mainImg.classList.add('scale-100');
        }, 10);
    }
};

window.closeGlobalLightbox = function() {
    const lightbox = document.getElementById('global-image-lightbox');
    const mainImg = document.getElementById('lightbox-main-img');
    if(lightbox && mainImg) {
        lightbox.classList.add('opacity-0');
        mainImg.classList.remove('scale-100');
        mainImg.classList.add('scale-95');
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
        }, 300);
    }
};

function applySettingsToUI() {
    if (!isAppReady) return; 

    const root = document.documentElement;
    const brandHue = (siteSettings.visuals && siteSettings.visuals.themeHex) ? hexToMathHSL(siteSettings.visuals.themeHex) : (siteSettings.brandColorHex ? hexToMathHSL(siteSettings.brandColorHex) : 340);
    
    root.style.setProperty('--brand-hue', brandHue);
    root.style.setProperty('--brand-font', (siteSettings.visuals && siteSettings.visuals.fontFamily) ? siteSettings.visuals.fontFamily : (siteSettings.fontFamily || "'Cairo', sans-serif"));
    root.style.setProperty('--site-bg', (siteSettings.visuals && siteSettings.visuals.bgHex) ? siteSettings.visuals.bgHex : (siteSettings.bgColor || '#ffffff'));
    root.style.setProperty('--site-text', (siteSettings.visuals && siteSettings.visuals.textHex) ? siteSettings.visuals.textHex : (siteSettings.textColor || '#663b3b'));
    
    const loaderTextEl = document.getElementById('dyn-loader-text');
    if (loaderTextEl) loaderTextEl.innerText = (siteSettings.visuals && siteSettings.visuals.loaderText) ? siteSettings.visuals.loaderText : "أهلاً بكم في عالم حلويات بوسي ✨";

    const isTickerActive = siteSettings.tickerActive !== false; 
    let tickerContainer = document.getElementById('ticker-container');
    
    if (isTickerActive) {
        if (!tickerContainer) {
            tickerContainer = document.createElement('div');
            tickerContainer.id = 'ticker-container';
            tickerContainer.className = 'w-full z-[500] py-1.5 overflow-hidden flex items-center absolute top-0 left-0 right-0';
            tickerContainer.style.backgroundColor = 'var(--brand-primary, #ff3377)'; 
            tickerContainer.innerHTML = '<span id="dyn-ticker-text" class="animate-ticker text-xs md:text-sm text-white font-medium" style="white-space: nowrap;"></span>';
            document.body.insertBefore(tickerContainer, document.body.firstChild);
            
            const nav = document.getElementById('navbar');
            if(nav) nav.style.top = '30px';
        }
        tickerContainer.classList.remove('hidden'); 
        tickerContainer.classList.add('flex');
        
        root.style.setProperty('--ticker-color', siteSettings.tickerColor || '#ffffff');
        root.style.setProperty('--ticker-font', siteSettings.tickerFont || "'Cairo', sans-serif");
        root.style.setProperty('--ticker-speed', (siteSettings.tickerSpeed || 20) + 's');
        
        const tickerTextEl = document.getElementById('dyn-ticker-text');
        if(tickerTextEl) tickerTextEl.innerText = siteSettings.tickerText || siteSettings.announcement;
    } else if (tickerContainer) {
        tickerContainer.classList.add('hidden');
        tickerContainer.classList.remove('flex');
    }

    if (siteSettings.seo) {
        if (siteSettings.seo.title) {
            document.title = siteSettings.seo.title;
            const titleEl = document.getElementById('dyn-page-title');
            if(titleEl) titleEl.innerText = siteSettings.seo.title;
        }
        if (siteSettings.seo.desc) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if(metaDesc) metaDesc.setAttribute('content', siteSettings.seo.desc);
        }
    }

    if (siteSettings.social) {
        document.querySelectorAll('a[href*="facebook.com"]').forEach(a => a.href = siteSettings.social.facebook || 'https://facebook.com/BoseSweets');
        document.querySelectorAll('a[href*="instagram.com"]').forEach(a => a.href = siteSettings.social.instagram || 'https://instagram.com/BoseSweets');
    }
    
    if(document.getElementById('dyn-page-title')) document.getElementById('dyn-page-title').innerText = `${siteSettings.brandName} | القائمة الرسمية`;
    if(document.getElementById('dyn-brand-name')) document.getElementById('dyn-brand-name').innerText = siteSettings.brandName;
    
    if(document.getElementById('dyn-hero-title')) {
        const title = document.getElementById('dyn-hero-title');
        title.innerHTML = siteSettings.heroTitle;
        title.style.opacity = '1';
    }
    
    if(document.getElementById('dyn-hero-desc')) {
        const desc = document.getElementById('dyn-hero-desc');
        desc.innerText = siteSettings.heroDesc;
        desc.style.opacity = '0.9';
    }
    
    if(document.getElementById('dyn-footer-brand')) document.getElementById('dyn-footer-brand').innerText = siteSettings.brandName;
    if(document.getElementById('dyn-footer-quote')) document.getElementById('dyn-footer-quote').innerText = siteSettings.footerQuote;
    if(document.getElementById('dyn-footer-phone')) document.getElementById('dyn-footer-phone').innerText = siteSettings.footerPhone;
    if(document.getElementById('dyn-footer-address')) document.getElementById('dyn-footer-address').innerHTML = siteSettings.footerAddress;
    
    const areaSelect = document.getElementById('cust-area');
    if(areaSelect) areaSelect.innerHTML = `<option value="" disabled selected>اختر المنطقة...</option>` + shippingZones.map(z => `<option value="${z.id}">${escapeHTML(z.name)} (+${Number(z.fee)} ج.م توصيل)</option>`).join('');
    
    if(document.getElementById('sidebar-categories')) renderCustomerSidebarCategories();
}

// 👑 معالجة الشلل الحركي في الشلال عن طريق التكرار البرمجي المانع للتقطيع
function initWaterfall() {
    const sectionWaterfall = document.getElementById('section-waterfall');
    const col1 = document.getElementById('waterfall-col-1');
    const col2 = document.getElementById('waterfall-col-2');
    if (!col1 || !col2 || !sectionWaterfall) return;

    const allImages = catalog.filter(p => p.images && p.images.length > 0)
                             .map(p => ({url: p.images[0], id: p.id}));
    
    if (allImages.length === 0) {
        sectionWaterfall.classList.add('hidden');
        return;
    } else {
        sectionWaterfall.classList.remove('hidden');
    }

    const shuffled = allImages.sort(() => 0.5 - Math.random()).slice(0, 6); 
    
    const renderCard = (img) => `
        <div class="waterfall-card cursor-pointer" onclick="navigateToProduct('${img.id}')">
            <img src="${optimizeCloudinaryUrl(img.url)}" loading="lazy">
        </div>`;

    const col1Content = shuffled.slice(0, 3).map(renderCard).join('');
    const col2Content = shuffled.slice(3, 6).map(renderCard).join('');

    // تكرار العنصر 4 مرات بدلاً من 3 لضمان التغطية التامة ومحاكاة التسريع السلس (Infinite Loop Fix)
    col1.innerHTML = col1Content + col1Content + col1Content + col1Content;
    col2.innerHTML = col2Content + col2Content + col2Content + col2Content;
}

window.initHomepageSections = function() {
    const sectionBS = document.getElementById('section-bestsellers');
    const sectionNA = document.getElementById('section-newarrivals');
    const bsContainer = document.getElementById('bestsellers-container');
    const naContainer = document.getElementById('newarrivals-container');
    
    if (!bsContainer && !naContainer) return;

    const bestSellers = catalog.filter(p => p.badge && p.badge.includes('مبيعاً')).slice(0, 8);
    const newArrivals = catalog.filter(p => p.badge && p.badge.includes('جديد')).slice(0, 8);

    const fallbackBS = bestSellers.length > 0 ? bestSellers : catalog.slice(0, 6);
    const fallbackNA = newArrivals.length > 0 ? newArrivals : catalog.slice().reverse().slice(0, 6);

    if (bsContainer && fallbackBS.length > 0) {
        if(sectionBS) {
            sectionBS.classList.remove('hidden');
            setTimeout(() => sectionBS.classList.add('is-visible'), 100); 
        }
        bsContainer.innerHTML = fallbackBS.map(p => `
            <div class="shrink-0 w-[260px] md:w-[300px] snap-center">
                ${window.drawProductCard(p, siteSettings.productLayout || 'grid')}
            </div>
        `).join('');
    } else {
        if(sectionBS) sectionBS.classList.add('hidden');
    }

    if (naContainer && fallbackNA.length > 0) {
        if(sectionNA) {
            sectionNA.classList.remove('hidden');
            setTimeout(() => sectionNA.classList.add('is-visible'), 100); 
        }
        naContainer.innerHTML = fallbackNA.map(p => `
            <div class="shrink-0 w-[260px] md:w-[300px] snap-center">
                ${window.drawProductCard(p, siteSettings.productLayout || 'grid')}
            </div>
        `).join('');
    } else {
        if(sectionNA) sectionNA.classList.add('hidden');
    }
    
    if (window.lucide) lucide.createIcons();
    if (typeof setupSliderButtons === 'function') setupSliderButtons();
};

function setupSliderButtons() {
    const attachScroll = (btnId, sliderId, direction) => {
        const btn = document.getElementById(btnId);
        const slider = document.getElementById(sliderId);
        if(btn && slider) {
            btn.onclick = () => {
                const scrollAmount = direction === 'right' ? 300 : -300;
                slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            };
        }
    };
    attachScroll('bs-next', 'bestsellers-slider-home', 'left');
    attachScroll('bs-prev', 'bestsellers-slider-home', 'right');
    attachScroll('na-next', 'new-arrivals-slider-home', 'left');
    attachScroll('na-prev', 'new-arrivals-slider-home', 'right');
}

window.navigateToProduct = function(id) {
    const prod = catalogMap.get(String(id));
    if (prod) {
        if(window.switchToMenuView) window.switchToMenuView();
        window.setCategory(prod.category);
        MemoryManager.set(`nav_scroll_${id}`, () => {
            const el = document.getElementById(`product-card-${id}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('highlight-target');
                setTimeout(() => el.classList.remove('highlight-target'), 2500);
            }
        }, 500);
    }
};

async function loadEngineMemory() {
    try {
        await fetchDefaultCatalog(); 
        
        if (typeof db === 'undefined') {
            catalog = [...defaultCatalog]; 
            return;
        }
        
        try {
            let settingsDoc = await db.collection('settings').doc('main').get();
            if (settingsDoc.exists) {
                const cloudData = settingsDoc.data();
                siteSettings = { ...defaultSettings, ...cloudData };
                
                if(cloudData.visuals) siteSettings.visuals = { ...(defaultSettings.visuals || {}), ...cloudData.visuals };
                if(cloudData.cakeBuilder) {
                    siteSettings.cakeBuilder = { ...(defaultSettings.cakeBuilder || {}), ...cloudData.cakeBuilder };
                    if(!siteSettings.cakeBuilder.flavors || siteSettings.cakeBuilder.flavors.length === 0) {
                        siteSettings.cakeBuilder.flavors = defaultSettings.cakeBuilder.flavors;
                    }
                } else siteSettings.cakeBuilder = { ...defaultSettings.cakeBuilder };

                if (siteSettings.catMenu && siteSettings.catMenu.length > 0) {
                    catMenu = typeof siteSettings.catMenu[0] === 'object' ? siteSettings.catMenu.sort((a, b) => a.order - b.order).map(c => c.name) : siteSettings.catMenu;
                }
            }
        } catch(e) {}

        if (!catMenu || catMenu.length === 0) catMenu = [...new Set(defaultCatalog.map(p => p.category))].filter(Boolean);
        if (!catMenu.includes('تورت')) catMenu.unshift('تورت');
        
        try {
            let catalogSnap = await db.collection('catalog').get();
            let firebaseData = [];
            catalogSnap.forEach(doc => firebaseData.push(doc.data()));

            if (firebaseData.length > 0) {
                firebaseData.sort((a, b) => {
                    if ((a.sortOrder || 999) !== (b.sortOrder || 999)) return (a.sortOrder || 999) - (b.sortOrder || 999);
                    return String(a.id).localeCompare(String(b.id));
                });
                catalog = firebaseData;
            } else {
                catalog = [...defaultCatalog];
            }
        } catch (e) {
            catalog = [...defaultCatalog];
        }

        syncCatalogMap();
        LiveSearchEngine.build(catalog);

        if (typeof db !== 'undefined') {
            db.collection('gallery').orderBy('timestamp', 'desc').get().then(gallerySnap => {
                if (!gallerySnap.empty) { galleryData = []; gallerySnap.forEach(doc => galleryData.push(doc.data())); if(isAppReady) renderCustomerGallery(); }
            }).catch(()=>{});
            
            db.collection('shipping').get().then(shipSnap => {
                if (!shipSnap.empty) { shippingZones = []; shipSnap.forEach(doc => shippingZones.push(doc.data())); if(isAppReady) applySettingsToUI(); }
            }).catch(()=>{});
        }
        
    } catch(err) { 
        catalog = [...defaultCatalog]; syncCatalogMap(); LiveSearchEngine.build(catalog);
        const availableCats = [...new Set(catalog.map(p => p.category))];
        if (!availableCats.includes(state.activeCat) && availableCats.length > 0) state.activeCat = availableCats[0];
    }
    
    try { 
        const dbCart = await ClientStorageEngine.get('cart');
        if (dbCart) state.cart = dbCart;
        else {
            const savedCart = localStorage.getItem('boseSweets_cart_data'); 
            if (savedCart) state.cart = JSON.parse(savedCart);
        }
    } catch (e) { state.cart = []; }
}

function saveCartToStorage() { 
    try { 
        ClientStorageEngine.set('cart', state.cart); 
        localStorage.setItem('boseSweets_cart_data', JSON.stringify(state.cart)); 
    } catch (e) {} 
}

function clearCartStorage() { 
    try { 
        ClientStorageEngine.remove('cart');
        localStorage.removeItem('boseSweets_cart_data'); 
    } catch (e) {} 
}

async function initApp() {
    await loadEngineMemory(); 
    isAppReady = true;

    const urlParams = new URLSearchParams(window.location.search);
    const routeCat = urlParams.get('category');
    
    if (routeCat && catMenu.includes(routeCat)) {
        state.activeCat = routeCat;
    } else {
        state.activeCat = 'الرئيسية';
    }

    applySettingsToUI();
    renderCategories();
    
    if (state.activeCat === 'الرئيسية') {
        if (window.goToHome) window.goToHome();
    } else {
        if (window.switchToMenuView) window.switchToMenuView();
        renderMainDisplay();
    }

    initWaterfall(); 
    window.initHomepageSections(); 

    if(document.getElementById('gallery-customer-section')) renderCustomerGallery(); 
    syncCartUI(); 
    if(window.lucide) lucide.createIcons();
    
    renderSmartSuggestions('main');
}

function toggleLiveSearch(show) {
    const overlay = document.getElementById('live-search-overlay'); const input = document.getElementById('live-search-input'); const results = document.getElementById('live-search-results');
    if (show) { overlay.classList.remove('hidden'); MemoryManager.set('search_show', () => { overlay.classList.add('opacity-100'); input.focus(); }, 10); input.value = ''; results.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-white/50 font-bold mt-10"><i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30"></i><p>ابدأ البحث في قائمة حلويات بوسي...</p></div>`; if(window.lucide) lucide.createIcons(); } 
    else { overlay.classList.remove('opacity-100'); MemoryManager.set('search_hide', () => overlay.classList.add('hidden'), 300); MemoryManager.flush(); }
}

function performLiveSearch(query) {
    const resultsContainer = document.getElementById('live-search-results'); 
    const q = query.trim().toLowerCase();
    
    if (!q) { resultsContainer.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-white/50 font-bold mt-10"><i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30"></i><p>ابدأ البحث في قائمة حلويات بوسي...</p></div>`; if(window.lucide) lucide.createIcons(); return; }
    
    const matches = LiveSearchEngine.search(q);
    
    if (matches.length === 0) { resultsContainer.innerHTML = `<div class="flex flex-col items-center justify-center text-white/70 font-bold mt-10 bg-white/5 p-8 rounded-2xl"><i data-lucide="search-x" class="w-12 h-12 mb-4" style="color: hsl(var(--brand-hue), 70%, 60%);"></i><p>لم نجد تطابق للبحث عن "${escapeHTML(query)}"</p><p class="text-xs opacity-70 mt-2">جرب البحث بكلمة مختلفة مثل "تورتة"، "نوتيلا"، "لوتس"</p></div>`; if(window.lucide) lucide.createIcons(); return; }
    resultsContainer.innerHTML = matches.map(p => {
        const imgUrl = optimizeCloudinaryUrl((p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category))); 
        const isOutOfStock = p.inStock === false;
        return `<div class="flex items-center gap-4 p-3 rounded-2xl bg-white shadow-sm border transition-all hover:shadow-md cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}" style="border-color: hsla(var(--brand-hue), 80%, 90%, 0.5);" onclick="toggleLiveSearch(false); window.setCategory('${p.category}'); MemoryManager.set('search_scroll_${p.id}', ()=> { const el = document.getElementById('product-card-${p.id}'); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight-target'); MemoryManager.set('search_hl_${p.id}', ()=>el.classList.remove('highlight-target'), 2500);} }, 500);"><img src="${imgUrl}" class="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100 ${isOutOfStock ? 'grayscale' : ''}"><div class="flex-1"><h4 class="font-bold text-sm text-gray-800">${escapeHTML(p.name)}</h4><div class="flex items-center gap-2 mt-1"><span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">${p.category}</span><span class="font-bold text-sm" style="color: hsl(var(--brand-hue), 70%, 40%);">${Number(p.price) > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span></div></div><div class="px-2">${isOutOfStock ? `<span class="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100"><i data-lucide="ban" class="w-3 h-3 inline"></i> نفدت</span>` : `<button class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm dyn-hover-bg" style="background-color: hsl(var(--brand-hue), 80%, 95%); color: hsl(var(--brand-hue), 70%, 50%);"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>`}</div></div>`;
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
    if (show) { ov.classList.remove('hidden'); MemoryManager.set('menu_show', () => { ov.classList.add('opacity-100'); sd.classList.remove('translate-x-full'); }, 10); } 
    else { ov.classList.remove('opacity-100'); sd.classList.add('translate-x-full'); MemoryManager.set('menu_hide', () => ov.classList.add('hidden'), 500); MemoryManager.flush(); }
}

function renderCustomerSidebarCategories() {
    if (!isAppReady) return; 
    const container = document.getElementById('sidebar-categories');
    if(!container) return;
    
    container.innerHTML = catMenu.map(c => `<button onclick="toggleCustomerMenu(false); window.setCategory('${c.name || c}')" class="text-right w-full p-3 rounded-xl font-bold text-sm transition-all hover:bg-gray-50 flex items-center justify-between" style="border: 1px solid hsl(var(--brand-hue), 80%, 95%); color: var(--site-text);"><span>${c.name === 'ورد' || c === 'ورد' ? 'ورد وهدايا 💐' : (c.name === 'تورت' || c === 'تورت' ? 'تورت وتصميم 🎂' : (c.name || c))}</span><i data-lucide="chevron-left" class="w-4 h-4 opacity-50"></i></button>`).join('');
    if(window.lucide) lucide.createIcons();
}

function renderCustomerGallery() {
    if (!isAppReady) return; 
    const sec = document.getElementById('gallery-customer-section'); const slider = document.getElementById('gallery-slider');
    if(!sec || !slider) return;
    if (galleryData.length === 0) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');
    
    slider.innerHTML = galleryData.map(g => `<div class="shrink-0 cursor-pointer hover:scale-105 transition-transform" onclick="openGlobalLightbox('${optimizeCloudinaryUrl(g.url)}')"><div class="w-32 h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-sm border" style="border-color: hsl(var(--brand-hue), 80%, 90%);"><img src="${optimizeCloudinaryUrl(g.url)}" class="w-full h-full object-cover" loading="lazy" alt="سابقة أعمال حلويات بوسي"></div></div>`).join('');
}

function renderCategories() {
    if (!isAppReady) return; 
    const el = document.getElementById('categories-nav');
    if(!el) return;
    
    el.innerHTML = catMenu.map(c => `<button id="cat-btn-${(c.name || c).replace(/\s+/g, '-')}" onclick="window.setCategory('${c.name || c}')" class="whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all border-2 text-sm sm:text-base ${state.activeCat === (c.name || c) ? 'text-white shadow-lg scale-105 brand-gradient border-transparent' : 'border-pink-100 hover:border-pink-300'}" style="${state.activeCat === (c.name || c) ? '' : `background-color: var(--site-bg); color: var(--site-text); border-color: hsl(var(--brand-hue), 80%, 90%);`}">${c.name === 'ورد' || c === 'ورد' ? 'ورد وهدايا 💐' : (c.name === 'تورت' || c === 'تورت' ? 'تورت وتصميم 🎂' : (c.name || c))}</button>`).join('');
}

function renderFlowerTabs(container) {
    container.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border flex flex-wrap justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">${fTypes.map(f => `<button onclick="window.setSub('f', '${f}')" class="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.fType === f ? 'text-white shadow-md brand-gradient' : 'opacity-80 hover:opacity-100'}" style="${state.fType === f ? '' : 'color: var(--site-text);'}">${f}</button>`).join('')}</div>`;
}

// 👑 هندسة التورت الملكية المحدثة: معالجة الأحجام الضخمة وإزالة التداخل تماماً
window.getCakeBuilderHTML = function() {
    const c = state.cakeBuilder; 
    const settings = siteSettings.cakeBuilder || defaultSettings.cakeBuilder;
    const baseP = Number(settings.basePrice) || 145; 
    const imgOpts = settings.imagePrinting || defaultSettings.cakeBuilder.imagePrinting;
    const selectedImgOption = imgOpts.find(opt => opt.label === c.img) || {price: 0};
    const price = Number(c.ps) * baseP + Number(selectedImgOption.price);
    const flavors = settings.flavors || ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت']; 
    const shapes = ['دائري', 'مربع', 'مستطيل'];
    
    return `
    <div class="rounded-[3rem] shadow-2xl border-2 overflow-hidden animate-fade-in relative bg-white border-pink-100 mt-6">
        <div class="w-full h-64 bg-[#fff0f5] relative overflow-hidden rounded-t-[3rem]">
            <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80" class="w-full h-full object-cover opacity-90 mix-blend-multiply">
            <div class="absolute inset-0 bg-gradient-to-t from-pink-50 via-transparent to-transparent"></div>
        </div>
        
        <div class="p-10 text-center bg-pink-50 border-b border-pink-100 relative z-10">
            <h2 class="text-3xl font-black mb-4 uppercase tracking-tight text-pink-600">هندسة التورت الملكية المخصصة 👑</h2>
            <p class="text-base font-bold text-slate-600 max-w-2xl mx-auto">نمنحك التحكم الكامل في أدق التفاصيل لضمان تصميم تورته تعكس فخامة مناسبتك السعيدة.</p>
        </div>
        
        <div class="p-12 space-y-16">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                <div class="space-y-6">
                    <label class="font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="cake" class="text-pink-500"></i> النكهة الأساسية</label>
                    <div class="grid grid-cols-2 gap-4">
                        ${flavors.map(fl => `<button onclick="window.uCake('flv', '${fl}')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${c.flv === fl ? 'brand-gradient text-white border-transparent shadow-md transform scale-105' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-pink-300'}">${fl}</button>`).join('')}
                    </div>
                </div>
                
                <div class="space-y-6">
                    <label class="font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="box" class="text-pink-500"></i> التصميم الهندسي</label>
                    <div class="grid grid-cols-3 gap-4">
                        ${shapes.map(sh => `<button onclick="window.uCake('sh', '${sh}')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${c.sh === sh ? 'brand-gradient text-white border-transparent shadow-md transform scale-105' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-pink-300'}">${sh}</button>`).join('')}
                    </div>
                </div>

                <div class="space-y-6">
                    <label class="font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="users" class="text-pink-500"></i> عدد الأفراد المقترح</label>
                    <div class="flex items-center justify-between border-2 rounded-[2rem] p-4 bg-slate-50 border-slate-100">
                        <button onclick="window.adjP(-2)" class="p-3 rounded-2xl bg-white shadow-sm hover:scale-110 transition-all text-pink-500"><i data-lucide="minus" class="w-6 h-6"></i></button>
                        <span class="text-4xl font-black text-slate-800">${c.ps}</span>
                        <button onclick="window.adjP(2)" class="p-3 rounded-2xl bg-white shadow-sm hover:scale-110 transition-all text-pink-500"><i data-lucide="plus" class="w-6 h-6"></i></button>
                    </div>
                </div>

                <div class="space-y-6">
                    <label class="font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="printer" class="text-pink-500"></i> تكنولوجيا طباعة الصور</label>
                    <div class="grid grid-cols-2 gap-4">
                        ${imgOpts.map(opt => `<button onclick="window.uCake('img', '${opt.label}')" class="py-4 px-2 rounded-2xl font-black text-sm transition-all border-2 ${c.img === opt.label ? 'brand-gradient text-white border-transparent shadow-md transform scale-105' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-pink-300'}">${opt.label} <span class="block text-xs mt-2 opacity-80">(+${opt.price} ج.م)</span></button>`).join('')}
                    </div>
                    ${c.img !== 'بدون' ? `
                    <div class="mt-4 p-6 bg-pink-50 border-2 border-pink-100 rounded-2xl animate-fade-in">
                        <label class="block font-black text-slate-700 mb-3">إرفاق الصورة المراد طباعتها <span class="text-pink-500">*</span></label>
                        <input type="file" id="cake-print-img" class="w-full font-bold text-slate-600" accept="image/*">
                    </div>` : ''}
                </div>

                <div class="space-y-6 lg:col-span-2 bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100">
                    <label class="font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="image-plus" class="text-pink-500"></i> صورة مرجعية للتصميم (اختياري)</label>
                    <p class="text-xs font-bold text-slate-500 mb-4">إذا كان لديك تصميم معين تود تنفيذه، يمكنك إرفاق صورته هنا لندرسه فنياً.</p>
                    <input type="file" id="cake-ref-img" class="w-full font-bold text-slate-600 bg-white p-3 rounded-xl border border-slate-200 text-sm" accept="image/*">
                </div>

                <div class="space-y-6 lg:col-span-2">
                    <label class="font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="pen-tool" class="text-pink-500"></i> ملاحظات التنفيذ الفنية</label>
                    <textarea id="cake-notes" rows="3" class="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-base outline-none focus:border-pink-500 resize-none" placeholder="اكتب أي تفاصيل، عبارات للطباعة، أو ألوان معينة تود إضافتها للتصميم...">${c.msg || ''}</textarea>
                </div>

            </div>
        </div>

        <div class="p-8 border-t-2 bg-pink-50 border-pink-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="text-center md:text-right">
                <span class="block font-black mb-1 uppercase tracking-widest text-xs text-slate-500">الإجمالي التقديري للتصميم</span>
                <span class="text-4xl font-black text-pink-600">${price} ج.م</span>
            </div>
            <button onclick="window.commitCakeBuilder()" class="w-full md:w-auto text-white font-black text-xl py-4 px-12 rounded-[3rem] btn-premium-action brand-gradient">إضافة للمراجعة الإدارية</button>
        </div>
    </div>`;
};

function renderMainDisplay() {
    if (!isAppReady) return; 

    const catDescArea = document.getElementById('category-description-area');
    const catNameEl = document.getElementById('current-cat-name');
    const catDescEl = document.getElementById('current-cat-desc');

    if (catDescArea && state.activeCat !== 'الرئيسية' && state.activeCat !== 'تورت') {
        catDescArea.classList.remove('hidden');
        if (catNameEl) catNameEl.innerText = state.activeCat === 'ورد' ? 'ورد وهدايا 💐' : state.activeCat;
        
        const defaultDescs = {
            'ديسباسيتو': 'أكواب الديسباسيتو الغنية المجهزة خصيصاً من فادج كيك حلويات بوسي الأصلي، مغطاة بأرقى أنواع الشيكولاتة.',
            'سينابون': 'مخبوزات السينابون الفاخرة، معتمدة على عجينة الخميرة القطنية الهشة (Yeast Dough) والمحشوة بالقرفة والسكر البني.',
            'قشطوطة': 'كيك الحليب الغني والمشبع، يعلوه طبقة من القشطة الطبيعية لترطيب مثالي وتجربة تذوق استثنائية.',
            'جاتوهات': 'قطع جاتوه كلاسيكية تعتمد على إسفنج كيك خفيف الوزن مع كريمة غنية ونسبة سكر مدروسة بدقة.'
        };

        let desc = siteSettings.catDescriptions && siteSettings.catDescriptions[state.activeCat] 
                    ? siteSettings.catDescriptions[state.activeCat] 
                    : (defaultDescs[state.activeCat] || `أشهى الأصناف المميزة من قسم ${state.activeCat} محضرة بحرفية لضمان أعلى معايير الجودة.`);
        
        if (catDescEl) catDescEl.innerText = desc;
    } else if (catDescArea) {
        catDescArea.classList.add('hidden');
    }

    const container = document.getElementById('display-container'); 
    const subTabs = document.getElementById('sub-tabs-area');
    if(!container) return;

    let targetHTML = '';
    let showSubTabs = false;

    if (state.activeCat === 'تورت') { 
        container.className = 'w-full animate-fade-in';
        targetHTML = window.getCakeBuilderHTML(); 
    } 
    else if (state.activeCat === 'ورد') {
        showSubTabs = true;
        container.className = 'w-full animate-fade-in';
        
        let flowerHtml = `<div class="flex flex-col gap-12 w-full">`;
        fTypes.forEach(type => {
            const list = catalog.filter(p => p && p.category === 'ورد' && (p.flowerType === type || (p.desc && typeof p.desc === 'string' && p.desc.includes(type))));
            if(list.length > 0) { 
                flowerHtml += `<div id="flower-group-${type.replace(/\s+/g, '-')}" class="space-y-6 animate-fade-in"><div class="flex items-center gap-4 mb-4"><h3 class="font-black text-xl text-pink-600 shrink-0">${type}</h3><div class="h-[1px] w-full bg-pink-100"></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">${list.map(p => window.drawProductCard(p, 'grid')).join('')}</div></div>`; 
            }
        });
        flowerHtml += `</div>`; 
        targetHTML = flowerHtml;
    }
    else {
        if (state.activeCat === 'ديسباسيتو') showSubTabs = true;
        
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch w-full animate-fade-in';
        
        let list = catalog.filter(p => p && p.category === state.activeCat);
        if (state.activeCat === 'ديسباسيتو') {
            list = list.filter(p => {
                const matchSize = p.size === state.dSize || p.subType === state.dSize || (p.desc && typeof p.desc === 'string' && p.desc.includes(state.dSize));
                const isUncategorized = !p.size && !p.subType;
                return matchSize || isUncategorized;
            });
        }
        
        targetHTML = list.map(p => window.drawProductCard(p, siteSettings.productLayout || 'grid')).join('');
        
        if (list.length === 0) {
            container.className = 'w-full animate-fade-in';
            targetHTML = `<div class="text-center py-20"><i data-lucide="package-x" class="w-16 h-16 mx-auto mb-4 text-gray-300"></i><p class="font-bold text-gray-500">لا توجد منتجات في هذا القسم حالياً.</p></div>`;
        }
    }

    container.innerHTML = targetHTML;
    if(window.lucide) lucide.createIcons();

    if (showSubTabs) {
        subTabs.classList.remove('hidden');
        if (state.activeCat === 'ورد') renderFlowerTabs(subTabs);
        if (state.activeCat === 'ديسباسيتو') {
            subTabs.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border flex justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">${dSizes.map(s => `<button onclick="window.setSub('s', '${s}')" class="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.dSize === s ? 'text-white shadow-md brand-gradient' : 'opacity-80 hover:opacity-100'}" style="${state.dSize === s ? '' : 'color: var(--site-text);'}">${s}</button>`).join('')}</div>`;
        }
    } else {
        subTabs.classList.add('hidden');
    }
}

window.updateTempQtyContext = function(buttonElement, delta) {
    const container = buttonElement.closest('.quantity-controls');
    if(container) {
        const el = container.querySelector('.temp-qty-display');
        if(el) {
            let val = parseInt(el.innerText.replace(/[^0-9]/g, '')) + delta;
            if(val < 1) val = 1; if(val > 50) val = 50;
            el.innerText = val; 
        }
    }
};

window.addWithQtyContext = function(buttonElement, id) {
    let qty = 1; 
    const cardElement = buttonElement.closest('.bg-white.flex.flex-col') || buttonElement.closest('.group');
    if(cardElement) {
        const qtyEl = cardElement.querySelector('.temp-qty-display');
        if(qtyEl) qty = parseInt(qtyEl.innerText) || 1;
    }

    const safeId = String(id); const prod = catalogMap.get(safeId); 
    if (!prod) return;
    
    if (prod.inStock === false) { 
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]); 
        showSystemToast('نأسف، هذا المنتج غير متوفر حالياً لتلبية الطلب.', 'error'); 
        return; 
    }
    
    if(navigator.vibrate) navigator.vibrate(50); 
    
    const exist = state.cart.find(i => String(i.id) === safeId);
    if (exist) { exist.quantity = Number(exist.quantity) + qty; } 
    else { const newCartItem = JSON.parse(JSON.stringify(prod)); newCartItem.quantity = qty; newCartItem.cartItemId = generateUniqueID(); state.cart.push(newCartItem); }
    
    saveCartToStorage(); syncCartUI(); calculateCartTotal(); 
    
    if(cardElement) {
        const qtyEl = cardElement.querySelector('.temp-qty-display');
        if(qtyEl) qtyEl.innerText = '1';
    }
    
    const cartBtn = document.querySelector('button[onclick="toggleCart(true)"]');
    if(cartBtn) { cartBtn.classList.add('scale-110'); MemoryManager.set('cart_bounce', ()=> cartBtn.classList.remove('scale-110'), 200); }
    showSystemToast(`تم إضافة الكمية (${qty}) بنجاح لقائمة المشتريات 🛍️`, 'success');

    window.renderSmartSuggestions('main');
    window.renderSmartSuggestions('cart');
};

window.drawProductCard = function(p, layoutMode = 'grid') {
    if (!p) return '';
    const pIdSafe = String(p.id || ''); 
    const isOutOfStock = p.inStock === false;
    
    const rawImageList = (p.images && p.images.length > 0) ? p.images : [p.img || getImgFallback(p.category)];
    const imageList = rawImageList.map(url => optimizeCloudinaryUrl(url));
    const displayImg = imageList[0] || 'https://via.placeholder.com/400';
    
    let discountBadgeHtml = '';
    const oldP = Number(p.oldPrice);
    const currentP = Number(p.price);
    if (oldP && oldP > currentP) {
        const discountPercent = Math.round(((oldP - currentP) / oldP) * 100);
        discountBadgeHtml = `<span class="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1.5 rounded-br-2xl rounded-tl-2xl shadow-lg font-black z-20 animate-pulse border border-red-400">خصم ${discountPercent}% 🔥</span>`;
    } else if (p.badge) {
        discountBadgeHtml = `<span class="absolute top-4 right-4 brand-gradient text-white text-xs px-3 py-1.5 rounded-br-2xl rounded-tl-2xl shadow-md font-bold z-20">${escapeHTML(p.badge)}</span>`;
    }

    return `
    <div id="product-card-${pIdSafe}" class="bg-white flex flex-col h-full overflow-hidden border-2 rounded-[2.5rem] transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 border-pink-50 p-4">
        <div class="relative aspect-square overflow-hidden rounded-[2rem] bg-[#fff0f5] cursor-zoom-in p-4" onclick="openGlobalLightbox('${displayImg}')">
            ${discountBadgeHtml}
            <img src="${displayImg}" class="w-full h-full object-contain transition-transform duration-700 hover:scale-110 drop-shadow-md" loading="lazy" alt="${escapeHTML(p.name)}">
            ${isOutOfStock ? `<div class="absolute inset-0 bg-white/50 backdrop-blur-[4px] z-10 flex items-center justify-center"><span class="bg-red-500 text-white font-black px-4 py-2 rounded-xl shadow-lg">نفدت الكمية</span></div>` : ''}
        </div>
        
        <div class="pt-6 pb-2 px-2 flex flex-col flex-1 text-center bg-white relative z-20">
            <h4 class="text-xl font-black leading-tight text-slate-800 mb-2">${escapeHTML(p.name)}</h4>
            <p class="text-xs font-bold text-slate-500 mb-4 line-clamp-2 leading-relaxed">${getFinalDescription(p)}</p>
            <div class="mt-auto flex flex-col gap-4 w-full">
                <div class="flex items-center justify-center rounded-full py-2 px-4 border mx-auto min-w-[70%] shadow-sm bg-pink-50 border-pink-100">
                    <span class="font-black text-2xl text-pink-600">${currentP > 0 ? currentP + ' ج.م' : 'حسب الطلب'}</span>
                    ${(oldP && oldP > currentP) ? `<del class="text-sm text-slate-400 font-bold ml-2">${oldP}</del>` : ''}
                </div>
                
                <div class="flex items-center justify-between gap-3 w-full">
                    <div class="flex items-center gap-2 bg-slate-50 rounded-2xl p-1.5 border border-slate-100 shadow-inner quantity-controls">
                        <button onclick="updateTempQtyContext(this, -1)" class="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-pink-500 hover:bg-pink-50 font-black"><i data-lucide="minus"></i></button>
                        <span class="temp-qty-display text-lg font-black text-slate-700 w-6 text-center" data-prod-id="${pIdSafe}">1</span>
                        <button onclick="updateTempQtyContext(this, 1)" class="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-pink-500 hover:bg-pink-50 font-black"><i data-lucide="plus"></i></button>
                    </div>
                    ${isOutOfStock ? 
                    `<button class="flex-1 py-3 bg-slate-100 text-slate-400 rounded-2xl font-black text-lg shadow-inner cursor-not-allowed border border-slate-200">غير متوفر</button>` 
                    : 
                    `<button onclick="addWithQtyContext(this, '${pIdSafe}')" class="flex-1 py-3 brand-gradient text-white rounded-2xl font-black text-lg shadow-lg btn-premium-action flex items-center justify-center gap-2"><i data-lucide="shopping-bag"></i> إضافة</button>`
                    }
                </div>
            </div>
        </div>
    </div>`;
};

window.renderCartList = function() {
    const container = document.getElementById('cart-items-list'); 
    const totalDisplay = document.getElementById('cart-total-display');
    
    if (!container) return;
    if (state.cart.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center py-20 px-6 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200"><i data-lucide="shopping-bag" class="w-16 h-16 mb-6 text-slate-300"></i><h3 class="font-black text-2xl text-slate-600 mb-4">حقيبة مشترياتك فارغة حالياً.</h3><button onclick="toggleCart(false)" class="text-white px-10 py-4 rounded-full font-black text-lg brand-gradient btn-premium-action">استعراض المنيو الملكي</button></div>`;
        if (totalDisplay) totalDisplay.innerText = "0 ج.م"; 
        if (window.lucide) lucide.createIcons(); 
        return;
    }
    
    let total = 0;
    container.innerHTML = state.cart.map(item => {
        const identifier = item.cartItemId || item.id; 
        const q = Number(item.quantity); 
        const p = Number(item.price); 
        total += (p * q);
        const renderImg = optimizeCloudinaryUrl((item.images && item.images.length > 0) ? item.images[0] : (item.img || getImgFallback(item.category)));
        
        return `
        <div class="cart-item-spacious flex items-center gap-6 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
            <div class="w-24 h-24 rounded-[1.5rem] overflow-hidden shrink-0 shadow-sm bg-[#fff0f5] p-2">
                <img src="${renderImg}" class="w-full h-full object-contain drop-shadow-sm">
            </div>
            <div class="flex-1 text-right">
                <h4 class="font-black text-lg text-slate-800 mb-1">${escapeHTML(item.name)}</h4>
                <p class="font-black text-pink-600 text-xl">${p} ج.م</p>
            </div>
            <div class="flex flex-col items-end gap-3 shrink-0">
                <button onclick="window.modQ('${identifier}', 'remove')" class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><i data-lucide="trash-2" class="w-6 h-6"></i></button>
                <div class="flex items-center gap-3 bg-slate-50 rounded-2xl p-1 border border-slate-100">
                    <button class="w-8 h-8 flex justify-center items-center bg-white rounded-xl shadow-sm text-pink-500 font-black" onclick="window.modQ('${identifier}', -1)"><i data-lucide="minus" class="w-4 h-4"></i></button>
                    <span class="font-black text-lg text-slate-700">${q}</span>
                    <button class="w-8 h-8 flex justify-center items-center bg-white rounded-xl shadow-sm text-pink-500 font-black" onclick="window.modQ('${identifier}', 1)"><i data-lucide="plus" class="w-4 h-4"></i></button>
                </div>
            </div>
        </div>`;
    }).join('');
    
    if (totalDisplay) totalDisplay.innerText = total + " ج.م";
    if (window.lucide) lucide.createIcons();
};

window.renderSmartSuggestions = function(context = 'main') {
    const containerId = context === 'cart' ? 'cart-suggestions-container' : 'related-products-container';
    const parentAreaId = context === 'cart' ? 'cart-suggestions-area' : 'related-products-area';
    
    const container = document.getElementById(containerId);
    const parentArea = document.getElementById(parentAreaId);

    if (!container || !parentArea) return;

    const cartIds = state.cart.map(i => String(i.id));
    const currentHour = new Date().getHours();
    
    let availableProducts = catalog.filter(p => p && p.inStock !== false && !cartIds.includes(String(p.id)));
    
    if (availableProducts.length === 0) {
        parentArea.classList.add('hidden');
        return;
    }

    parentArea.classList.remove('hidden');

    const rotateIndex = currentHour % availableProducts.length;
    const rotated = availableProducts.slice(rotateIndex).concat(availableProducts.slice(0, rotateIndex));
    const suggestions = rotated.slice(0, context === 'cart' ? 4 : 8);

    container.innerHTML = suggestions.map(p => {
        const img = optimizeCloudinaryUrl((p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category)));
        return `<div class="shrink-0 w-[220px] snap-slide bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col group hover:-translate-y-1 transition-transform"><div class="relative w-full h-36 mb-4 rounded-xl overflow-hidden bg-[#fff0f5] p-2"><img src="${img}" class="w-full h-full object-contain drop-shadow-sm"></div><div class="flex-1 flex flex-col"><h5 class="text-[14px] font-bold mb-1">${escapeHTML(p.name)}</h5><div class="flex items-center justify-between mt-auto"><span class="font-black text-pink-600">${p.price} ج.م</span><button onclick="addWithQtyContext(this, '${p.id}')" class="px-4 py-2 border rounded-xl text-[11px] font-bold border-pink-100 text-pink-500 hover:bg-pink-50 transition-colors">إضافة</button></div></div></div>`;
    }).join('');
    
    if(window.lucide) lucide.createIcons();
};

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
    window.renderCartList(); calculateCartTotal();
}

window.submitOrderFinal = async function() {
    if (state.cart.length === 0) return;
    
    let outOfStockItems = [];
    for (let item of state.cart) {
        if (item.isCustom) continue;
        const freshProd = catalogMap.get(String(item.id));
        if (freshProd && freshProd.inStock === false) outOfStockItems.push(item.name);
    }
    
    if (outOfStockItems.length > 0) {
        showSystemToast(`نعتذر، المنتجات التالية غير متوفرة حالياً: ${outOfStockItems.join('، ')}. يرجى تحديث القائمة للاستمرار.`, 'error');
        return;
    }

    const cName = document.getElementById('cust-name').value.trim(); 
    const cPhone = document.getElementById('cust-phone').value.trim();
    const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
    const cArea = document.getElementById('cust-area') ? document.getElementById('cust-area').options[document.getElementById('cust-area').selectedIndex]?.text : '';
    const cAddress = document.getElementById('cust-address') ? document.getElementById('cust-address').value.trim() : '';
    const cDate = document.getElementById('cust-date') ? document.getElementById('cust-date').value : '';
    const cTime = document.getElementById('cust-time') ? document.getElementById('cust-time').value : '';
    const cNotes = document.getElementById('cust-notes') ? document.getElementById('cust-notes').value.trim() : '';
    
    if (!cName || !cPhone) { 
        showSystemToast('يرجى إكمال بيانات الاسم ورقم التواصل لاعتماد الطلب.', 'error'); 
        return; 
    }
    
    if (deliveryMethod === 'delivery' && (!cArea || !cAddress)) { 
        showSystemToast('يرجى تحديد المنطقة والعنوان التفصيلي للتوصيل.', 'error'); 
        return; 
    }

    if (!cDate || !cTime) {
        showSystemToast('يرجى تحديد يوم وساعة الاستلام المطلوبة.', 'error'); 
        return; 
    }

    const btn = document.querySelector('button[onclick="submitOrderFinal()"]');
    let originalBtnHtml = '';
    if(btn) {
        originalBtnHtml = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i> جاري معالجة الطلب...`; 
        btn.disabled = true; 
        if(window.lucide) lucide.createIcons();
    }

    const orderId = generateSecureOrderId(); 
    let subtotal = 0;
    state.cart.forEach(item => {
        if (!item.isCustom) {
            const trueProd = catalogMap.get(String(item.id));
            if (trueProd && trueProd.price) {
                item.price = Number(trueProd.price);
            }
        }
        subtotal += (Number(item.price) * Number(item.quantity));
    });
    
    let shipFee = 0;
    if(deliveryMethod === 'delivery' && document.getElementById('cust-area')) {
        const areaVal = document.getElementById('cust-area').value;
        const zone = shippingZones.find(z => String(z.id) === String(areaVal));
        if(zone) shipFee = Number(zone.fee);
    }
    const finalTotal = subtotal + shipFee;

    let m = `*أمر توريد منتجات - حلويات بوسي* 👑\n*الرقم المرجعي:* ${orderId}\n\n👤 العميل: ${cName}\n📞 الهاتف: ${cPhone}\n`;
    if(deliveryMethod === 'pickup') m += `🛵 وسيلة الحصول: استلام مباشر من الفرع\n`;
    else m += `🛵 وسيلة التوصيل: ${cArea} - ${cAddress}\n`;
    
    m += `📅 موعد الاستلام: ${cDate} الساعة ${cTime}\n`;
    
    m += `\n*بيان الأصناف:*\n`;
    state.cart.forEach((i) => m += `▪️ *${i.name}* (الكمية: ${i.quantity}) = ${i.price * i.quantity} ج.م\n`);
    if(shipFee > 0) m += `\nرسوم التوصيل: ${shipFee} ج.م`;
    m += `\n*القيمة الإجمالية:* ${finalTotal} ج.م`;
    
    if(cNotes) m += `\n\n*ملاحظات مهنية:* ${cNotes}`;

    const storePhone = siteSettings.footerPhone || '201097238441';
    let cleanPhone = storePhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(m)}`, '_blank');
    
    const orderData = {
        id: orderId,
        name: cName,
        phone: cPhone,
        area: deliveryMethod === 'pickup' ? 'استلام من الفرع' : cArea,
        address: cAddress,
        deliveryMethod: deliveryMethod,
        pickupDate: cDate,
        pickupTime: cTime,
        notes: cNotes,
        itemsArray: state.cart,
        subtotal: subtotal,
        shippingFee: shipFee,
        total: finalTotal,
        status: 'pending',
        timestamp: Date.now(),
        date: new Date().toLocaleString('ar-EG')
    };

    try {
        if(navigator.onLine && typeof db !== 'undefined') {
            db.collection('orders').doc(String(orderId)).set(orderData).catch(e => {
                ClientStorageEngine.queueOrder(orderData);
            });
        } else {
            throw new Error("Offline");
        }
    } catch(e) {
        ClientStorageEngine.queueOrder(orderData);
    }

    state.cart = []; 
    clearCartStorage(); 
    syncCartUI(); 
    if (window.toggleCart) window.toggleCart(false); 
    if(window.switchToMenuView) window.switchToMenuView();
    else renderMainDisplay();
    
    showSystemToast('تم إرسال الطلب لمركز العمليات بنجاح. نشكر ثقتكم!', 'success');

    if(btn) {
        btn.innerHTML = originalBtnHtml; 
        btn.disabled = false;
        if(window.lucide) lucide.createIcons();
    }
};

async function syncOfflineOrders() {
    if (!navigator.onLine || typeof db === 'undefined') return;
    try {
        const pendingOrders = await ClientStorageEngine.getQueuedOrders();
        if (pendingOrders.length === 0) return;
        for (let order of pendingOrders) {
            try {
                await db.collection('orders').doc(String(order.id)).set(order);
                await ClientStorageEngine.removeQueuedOrder(order.id);
            } catch (e) { }
        }
    } catch (e) {}
}

window.addEventListener('online', syncOfflineOrders);

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

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin.html') || document.title.includes('الإدارة') || document.getElementById('admin-orders-tbody')) {
        return; 
    }
    initApp();
    syncOfflineOrders();
});

window.setCategory = function(c) {
    if (c === 'الرئيسية') {
        if(window.goToHome) window.goToHome();
        state.activeCat = 'الرئيسية';
    } else {
        if(window.switchToMenuView) window.switchToMenuView();
        state.activeCat = c;
        renderMainDisplay();
    }
    renderCategories();
    history.pushState({category: c}, '', `?category=${encodeURIComponent(c)}`);
    MemoryManager.set('scroll_cat', () => { 
        const safeId = String(c).replace(/\s+/g, '-');
        const activeBtn = document.getElementById(`cat-btn-${safeId}`); 
        if (activeBtn) { activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } 
    }, 50); 
};

window.setSub = function(t, v) { 
    if(t === 's') { state.dSize = v; renderMainDisplay(); } 
    if(t === 'f') {
        state.fType = v;
        renderMainDisplay();
        const targetSection = document.getElementById(`flower-group-${v.replace(/\s+/g, '-')}`);
        if(targetSection) targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.uCake = function(k, v) { 
    state.cakeBuilder[k] = v; 
    if (k === 'sh') {
        if (v === 'مربع' && state.cakeBuilder.ps < 16) state.cakeBuilder.ps = 16;
        else if (v === 'مستطيل' && state.cakeBuilder.ps < 20) state.cakeBuilder.ps = 20;
        else if (v === 'دائري' && state.cakeBuilder.ps < 4) state.cakeBuilder.ps = 4;
    }
    renderMainDisplay(); 
};

window.adjP = function(d) {
    let n = Number(state.cakeBuilder.ps) + Number(d); 
    let min = 4;
    if (state.cakeBuilder.sh === 'مربع') min = 16;
    if (state.cakeBuilder.sh === 'مستطيل') min = 20;
    if (n < min) n = min;
    state.cakeBuilder.ps = n; 
    renderMainDisplay();
};

window.modQ = function(cartId, d) {
    const safeCartId = String(cartId); 
    const it = state.cart.find(x => String(x.cartItemId) === safeCartId || String(x.id) === safeCartId);
    if (it) { 
        if (d === 'remove') state.cart = state.cart.filter(x => String(x.cartItemId) !== safeCartId && String(x.id) !== safeCartId);
        else { it.quantity = Number(it.quantity) + Number(d); if (it.quantity < 1) it.quantity = 1; }
    }
    saveCartToStorage(); syncCartUI(); calculateCartTotal();
    window.renderSmartSuggestions('main');
    window.renderSmartSuggestions('cart');
};

window.commitCakeBuilder = function() {
    const c = state.cakeBuilder; 
    const settings = siteSettings.cakeBuilder || defaultSettings.cakeBuilder;
    const baseP = Number(settings.basePrice) || 145;
    const imgOpts = settings.imagePrinting || defaultSettings.cakeBuilder.imagePrinting;
    const selectedImgOption = imgOpts.find(opt => opt.label === c.img) || {price: 0};
    
    const pr = Number(c.ps) * baseP + Number(selectedImgOption.price);
    const notesInput = document.getElementById('cake-notes');
    if(notesInput) c.msg = notesInput.value;

    let ds = `النكهة: ${c.flv} | العدد: ${c.ps} أفراد | الشكل: ${c.sh} | الطباعة: ${c.img}`;
    if (c.msg) ds += ` | ملاحظات العميل: ${c.msg}`;
    
    const customId = "cb_" + Date.now();
    state.cart.push({ id: customId, cartItemId: customId, name: 'تورتة الإصدار الملكي (طلب خاص)', price: pr, category: 'تورت', desc: ds, quantity: 1, isCustom: true });
    
    saveCartToStorage(); 
    if (window.toggleCart) window.toggleCart(true); 
    calculateCartTotal();
    
    state.cakeBuilder.msg = ''; state.cakeBuilder.occ = ''; state.cakeBuilder.alg = ''; 
    renderMainDisplay(); 
    showSystemToast('تم إضافة التورتة المخصصة للسلة بنجاح 👑', 'success');
};

window.showInfo = function(t) {
    const d = { about: { t: 'عن حلويات بوسي', b: siteSettings.footerQuote || 'العلامة التجارية الرائدة في صناعة الحلويات الفاخرة بالفرافرة.' }, privacy: { t: 'سياسة الأمان والبيانات', b: 'نلتزم في إدارة حلويات بوسي بحماية بيانات عملائنا وفق أعلى معايير الخصوصية.' }, refund: { t: 'سياسة الاستبدال والاسترجاع', b: 'تخضع كافة الطلبات لمعايير رقابة الجودة لضمان رضاكم التام.' } };
    if(!d[t]) return;
    const titleEl = document.getElementById('info-title');
    const bodyEl = document.getElementById('info-body');
    if(titleEl) titleEl.innerText = d[t].t; 
    if(bodyEl) bodyEl.innerText = d[t].b;
    const m = document.getElementById('info-modal'); 
    if(m) { m.classList.remove('hidden'); m.classList.add('flex'); }
    if(window.lucide) lucide.createIcons();
};

window.closeInfo = function() { 
    const m = document.getElementById('info-modal'); 
    if(m) { m.classList.add('hidden'); m.classList.remove('flex'); }
    MemoryManager.flush(); 
};
