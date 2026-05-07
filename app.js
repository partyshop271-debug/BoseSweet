// ⚡ Engine Upgrade: Clean & Stable Catalog Engine (BoseSweets Sovereign V18.0 - Waterfall Enhanced)
// 👑 تم تنظيف المحرك بالكامل وتوسيع منطق العمليات والشبكة الذكية لنسخة V18.0 السيادية مع دمج الأوصاف الدستورية ودوران الشلال الذكي دون حذف أو اختصار نهائياً.
// 👑 التحديث الجذري الشامل:
// - إصلاح كامل لمنطق الفلترة وعودة جميع المنتجات المختفية للعمل فوراً.
// - تحويل محرك شلال الصور التفاعلي بالكامل لروابط ذكية ومباشرة للمنتج.
// - دمج وهندسة معالج التورت المخصص في خطوات متتالية (Multi-Step Wizard).
// - تأمين تداول البيانات محلياً وسحابياً بالتزامن المباشر.
// - معالج فرض العرض الشبكي لضمان استقرار التبويبات والمساحات.

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

// 👑 الصياغة المهنية المتطورة لأوصاف المنتجات الدستورية لبراند حلويات بوسي
const detailedDescriptions = {
    'ديسباسيتو': 'كيك فادج غني، محشو بطبقة من الشيكولاتة الفاخرة، ومغطى بطبقة كثيفة من صوص الشيكولاتة الأصلي لضمان تجربة تذوق احترافية.',
    'ديسباسيتو نوتيلا مثلث': 'منتج ديسباسيتو الفاخر بحجم صغير، يتكون من قاعدة فادج كيك غنية مضاف إليها طبقة كثيفة من صوص النوتيلا الأصلي لضمان تجربة تذوق احترافية.',
    'ديسباسيتو نوتيلا وسط': 'الإصدار المتوسط من ديسباسيتو نوتيلا، يتميز بتوازن دقيق بين طبقة الكيك الغنية وكريمة النوتيلا، مصمم لمحبي المذاق المتزن.',
    'ديسباسيتو نوتيلا كبير': 'الحجم العائلي الفاخر من ديسباسيتو نوتيلا، يحتوي على كمية مضاعفة من صوص النوتيلا الأصلي فوق قاعدة فادج حلويات بوسي الكثيفة.',
    'ريد فيلفت': 'طبقات من كيك الريد فيلفت المخملي، تتخللها طبقات من موس الجبن الغني، معززة بطبقة من حشوة التوت البري (الراسبري).',
    'قشطوطة': 'كيك فانيليا إسفنجي مسقي بعناية في الحليب المحلى، يعلوه طبقة من الكريمة الناعمة لضمان توازن القوام، ومزين بتشكيلة من المكسرات.',
    'كبات السعادة': 'طبقات من الكيك الإسفنجي (فانيليا أو شيكولاتة) المخبوز منزلياً بأعلى المعايير، مع طبقات متناغمة من الموس الفاخر (بدون استخدام خامات تجارية).',
    'سينابون': 'مخبوزات سينابون تعتمد على عجينة الخميرة القطنية الهشة (Yeast Dough)، محشوة بالقرفة والسكر البني. متوفرة بتخصيصات متعددة تلبي كافة الأذواق (شيكولاتة، لوتس، فستق).',
    'سينابون نوتيلا': 'مزيج احترافي بين القرفة الدافئة وصوص النوتيلا الأصلي الموزع بعناية فوق عجينة السينابون الهشة المعتمدة على عجينة الخميرة.',
    'دوناتس': 'عجينة مخبوزات خفيفة، تتميز بحشوها الغني من الداخل وتغطيتها الخارجية حسب الاختيار لضمان تجربة مخصصة لكل عميل.',
    'بامبوليني': 'عجينة مخبوزات خفيفة، تتميز بحشوها الغني من الداخل وتغطيتها الخارجية حسب الاختيار لضمان تجربة مخصصة لكل عميل.',
    'ورد طبيعي': 'تنسيق فاخر من الورد الطبيعي الطازج، يتم اختياره وفق معايير الجودة العالية لضمان النضارة والاستدامة، يمثل لغة تعبير راقية في المناسبات الرسمية.',
    'ورد صناعي': 'ورد صناعي مصنع من خامات ملكية فاخرة تحاكي الملمس الطبيعي، قطعة ديكور مستديمة تحتفظ برونقها كذكرى كلاسيكية راقية.',
    'ورد ستان': 'عمل يدوي احترافي مصنع من أجود أنواع الستان بحرفية حلويات بوسي، يتميز بملمس ناعم ومظهر بريستيج مخصص للإهداءات الخاصة.',
    'ورد فلوس': 'طريقة مهنية ومبتكرة لتنسيق الهدايا النقدية، تدمج بين الفن ودقة التقديم لتوفير تجربة إهداء غير تقليدية ومبهرة.',
    'ورد هدايا': 'تنسيق متكامل يدمج بين رقة الورد وشياكة التغليف الهندسي، مصمم ليكون المكمل المثالي للهدايا القيمة بلمسات فنية متطورة.',
    'ورد شيكولاتة': 'بوكيه حصري يجمع بين تنسيق الورد الفاخر وقطع شيكولاتة حلويات بوسي الملكية، هدية تدمج بين القيمة البصرية والمذاق الرفيع.',
    'جاتوه': 'قطع جاتوه كلاسيكية تعتمد على إسفنج كيك خفيف الوزن مع كريمة غنية ونسبة سكر مدروسة بدقة، تمثل الاختيار الاحترافي للمناسبات.',
    'جاتوه كلاسيك': 'قطعة جاتوه فاخرة تعتمد على فادج كيك خفيف الوزن مع كريمة غنية ونسبة سكر مدروسة بدقة، تمثل الاختيار الاحترافي للمناسبات.',
    'تورتة ميني': 'تورتة ميني مصممة لشخصين، تتميز بتصميم ملكي مكثف وتفاصيل دقيقة تناسب الاحتفالات الثنائية الخاصة.',
    'حجم (فرد - فردين)': 'تورتة الإصدار الخاص من حلويات بوسي، تتميز بتصميم هندسي انسيابي يكفي لشخصين، مع حشوات غنية وكيك هش عالي الجودة.',
    'حجم (3 - 4 أفراد)': 'الاختيار المتوازن للمناسبات العائلية الصغيرة، تورتة تجمع بين الرقي في التصميم ووفرة المكونات، تكفي 4 أفراد بقطع متساوية وغنية.',
    'حجم (5 - 6 أفراد)': 'تورتة المناسبات الرسمية الكبيرة، تتميز بحجم عائلي وتفاصيل فنية معقدة وحشوات بريميوم تضمن أعلى معايير الضيافة.'
};

function getCapsuleDescription(p) {
    if (!p) return '';
    let n = (p.name ? String(p.name) : '').trim().toLowerCase();
    let c = (p.category ? String(p.category) : '').trim().toLowerCase();

    if (c.includes('دوناتس') && n.includes('نوتيلا')) return 'دوناتس تعتمد على عجينة خفيفة محشوة بشيكولاتة نوتيلا أصلية، مصنعة لضمان أعلى مستويات الجودة.';
    if (c.includes('سينابون') && n.includes('نوتيلا')) return 'مزيج من عجينة السينابون القطنية القائمة على الخميرة مع صوص النوتيلا الفاخر، اختيار مثالي لمحبي التميز.';
    if (c.includes('قشطوط') && n.includes('نوتيلا')) return 'قشطوطة مكونة من كيك غني بالحليب وطبقة قشطة طبيعية مغطاة بالنوتيلا الأصلية لضمان توازن المذاق.';
    if (n.includes('كبات') && n.includes('نوتيلا')) return 'طبقات كيك وكريمة نوتيلا غنية مقدمة في كب بتصميم عصري يناسب التقديم الفردي الراقي.';
    if (c.includes('ديسباسيتو') && n.includes('نوتيلا')) return 'فادج كيك شيكولاتة مركز مع طبقة سخية من النوتيلا البرازيلية الأصلية لضمان تقديم فخامة متكاملة.';
    if (c.includes('دوناتس') || c.includes('بامبوليني')) return 'عجينة مخبوزات خفيفة مغطاة بصوصات متنوعة محضرة وفق معايير حلويات بوسي.';
    if (c.includes('سينابون') || n.includes('سينابون')) return 'عجينة قطنية طرية غنية بالقرفة وصوص الجبن الكريمي الخاص وتعتمد كلياً على عجين الخميرة المخبوز مهنياً.';
    if (c.includes('ديسباسيتو') || n.includes('ديسباسيتو')) return detailedDescriptions['ديسباسيتو'];
    if (c.includes('ريد فيلفت') || n.includes('ريد فيلفت')) return detailedDescriptions['ريد فيلفت'];
    if (c.includes('قشطوط') || n.includes('قشطوط')) return detailedDescriptions['قشطوطة'];
    if (c.includes('كبات') || n.includes('كبات')) return detailedDescriptions['كبات السعادة'];
    if (c.includes('جاتوه') || n.includes('جاتوه')) return detailedDescriptions['جاتوه'];
    
    return 'إصدار فاخر من حلويات بوسي، مُعد بمكونات عالية الجودة لضمان تجربة تذوق استثنائية.';
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
    
    let bgColor = 'bg-slate-900';
    if(type === 'error') bgColor = 'bg-[#ff3377]';
    if(type === 'success') bgColor = 'bg-emerald-600';

    toast.className = `fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl font-bold text-sm max-w-[90vw] text-center border border-transparent animate-fade-in ${bgColor}`;
    iconEl.setAttribute('data-lucide', type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info'));
    iconEl.style.color = '#ffffff';
    
    if(window.lucide) lucide.createIcons();
    
    MemoryManager.set('toast_timer', () => {
        toast.classList.replace('flex', 'hidden'); 
        toast.classList.remove('animate-fade-in');
    }, 4000);
}

const defaultSettings = {
    brandName: "حلويات بوسي", announcement: "حلويات بوسي: تجربة تذوق ملكية في قلب الوادي الجديد",
    heroTitle: "أهلاً بكم في <br class='hidden md:block'/> <span class='text-white relative inline-block mt-1 md:mt-2 drop-shadow-md'>حلويات بوسي</span>",
    heroDesc: "تشكيلة حصرية من الأصناف الفاخرة والمُعدة بعناية فائقة. نقدمها بكل هدوء ورقي لتليق بمناسباتكم الاستثنائية وذوقكم الرفيع.",
    footerPhone: "01097238441", footerAddress: "الكفاح، مركز الفرافرة، <br> محافظة الوادي الجديد",
    footerQuote: `"العلامة التجارية الرائدة في صناعة الحلويات الفاخرة وتصميم التورت الملكية بمركز الفرافرة منذ عام 2014."`,
    productLayout: "grid", brandColorHex: "#ff3377", bgColor: "#ffffff", textColor: "#663b3b",
    fontFamily: "'Cairo', sans-serif", baseFontSize: 16, baseFontWeight: 400,
    tickerActive: true, tickerText: "حلويات بوسي: تجربة تذوق ملكية في قلب الوادي الجديد ✨", tickerSpeed: 20, tickerFont: "'Cairo', sans-serif", tickerColor: "#ffffff",
    cakeBuilder: { basePrice: 145, desc: "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة وفق أعلى معايير الجودة.", minSquare: 16, minRect: 20, flavors: ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت'], images: [], imagePrintingPrice: 60, imagePrinting: [{ label: 'بدون', price: 0 }, { label: 'صورة قابلة للأكل', price: 60 }, { label: 'صورة غير قابلة للأكل', price: 20 }] },
    social: { facebook: "https://facebook.com/BoseSweets", tiktok: "https://tiktok.com/@BoseSweets", instagram: "https://instagram.com/BoseSweets" }
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
let state = { activeCat: 'الرئيسية', dSize: 'مثلث', fType: 'ورد طبيعي', cart: [], currentShippingFee: 0, cakeBuilder: { flv: 'فانيليا', ps: 4, sh: 'دائري', trd: false, img: 'بدون', msg: '', alg: '', occ: '', refImgUrl: '', hasRefImg: false, crd: false, dlg: false } };

// هندسة الحالة المخصصة للمعالج متعدد الخطوات
let currentBuilderStep = 1;
let cakeState = { flavor: 'فانيليا', shape: 'دائري', persons: 4, printing: 'بدون', notes: '', refImage: null };

// 🛡️ الموتور الأساسي لإدارة الواجهات السيادية
window.showHomeView = function() {
    const vMenu = document.getElementById('view-menu'); if(vMenu) vMenu.classList.add('hidden');
    const vTips = document.getElementById('view-tips'); if(vTips) vTips.classList.add('hidden');
    const vCake = document.getElementById('view-cake-builder'); if(vCake) vCake.classList.add('hidden');
    const vProd = document.getElementById('view-product-details'); if(vProd) vProd.classList.add('hidden');
    const vHome = document.getElementById('view-home'); if(vHome) vHome.classList.remove('hidden');
    setActiveCategoryPill('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.showMenuView = function() {
    const vHome = document.getElementById('view-home'); if(vHome) vHome.classList.add('hidden');
    const vTips = document.getElementById('view-tips'); if(vTips) vTips.classList.add('hidden');
    const vCake = document.getElementById('view-cake-builder'); if(vCake) vCake.classList.add('hidden');
    const vProd = document.getElementById('view-product-details'); if(vProd) vProd.classList.add('hidden');
    const vMenu = document.getElementById('view-menu'); if(vMenu) vMenu.classList.remove('hidden');
    
    window.switchCategory && window.switchCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.showGoldenTips = function() {
    const vHome = document.getElementById('view-home'); if(vHome) vHome.classList.add('hidden');
    const vMenu = document.getElementById('view-menu'); if(vMenu) vMenu.classList.add('hidden');
    const vCake = document.getElementById('view-cake-builder'); if(vCake) vCake.classList.add('hidden');
    const vProd = document.getElementById('view-product-details'); if(vProd) vProd.classList.add('hidden');
    const vTips = document.getElementById('view-tips'); if(vTips) vTips.classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.showCakeBuilderView = function() {
    const vHome = document.getElementById('view-home'); if(vHome) vHome.classList.add('hidden');
    const vMenu = document.getElementById('view-menu'); if(vMenu) vMenu.classList.add('hidden');
    const vTips = document.getElementById('view-tips'); if(vTips) vTips.classList.add('hidden');
    const vProd = document.getElementById('view-product-details'); if(vProd) vProd.classList.add('hidden');
    const vCake = document.getElementById('view-cake-builder'); if(vCake) vCake.classList.remove('hidden');
    
    currentBuilderStep = 1;
    window.renderMultiStepCakeBuilder && window.renderMultiStepCakeBuilder();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

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
        mainImg.classList.remove('scale-95');
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
        }, 300);
    }
};

// 👑 محرك شريط الإعلانات السيادي
window.renderTicker = function() {
    let container = document.getElementById('ticker-container');
    const navbar = document.getElementById('navbar');
    
    const isActive = siteSettings.ticker_isActive ?? siteSettings.tickerActive ?? false;
    
    if (!isActive) {
        if(container) { container.classList.add('hidden'); container.classList.remove('flex'); }
        if(navbar) navbar.style.top = '0';
        return;
    }

    if (!container) {
        container = document.createElement('div');
        container.id = 'ticker-container';
        container.className = 'w-full z-[500] py-1.5 overflow-hidden absolute top-0 left-0 right-0 border-b border-white/10';
        document.body.insertBefore(container, document.body.firstChild);
    }

    const text = siteSettings.ticker_text || siteSettings.tickerText || siteSettings.announcement || '';
    const speed = siteSettings.ticker_speed || siteSettings.tickerSpeed || 20;
    const bgColor = siteSettings.ticker_bgColor || siteSettings.visuals?.themeHex || '#D2386C';
    const textColor = siteSettings.ticker_textColor || '#ffffff';

    container.style.backgroundColor = bgColor;
    container.classList.remove('hidden');
    container.classList.add('flex', 'items-center');
    
    container.innerHTML = `<span class="animate-ticker text-xs md:text-sm font-bold" style="white-space: nowrap; animation-duration: ${speed}s; color: ${textColor}; font-family: var(--brand-font);">${text} &nbsp;&nbsp;✨&nbsp;&nbsp; ${text} &nbsp;&nbsp;✨&nbsp;&nbsp; ${text}</span>`;
    
    if(navbar) navbar.style.top = '32px';
};

// 👑 محرك المراجعات الحية
window.loadLiveReviews = async function(productId) {
    const reviewsContainer = document.getElementById(`reviews-list-${productId}`);
    if (!reviewsContainer || typeof db === 'undefined') return;

    try {
        const snapshot = await db.collection('catalog').doc(String(productId)).collection('livereviews').where('isApproved', '==', true).orderBy('timestamp', 'desc').limit(10).get();
        if (snapshot.empty) {
            reviewsContainer.innerHTML = '<p class="text-xs text-slate-400 font-bold text-center py-4">كن أول من يوثق تجربته مع هذا... </p>';
            return;
        }
        reviewsContainer.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const stars = '⭐'.repeat(data.rating || 5);
            return `<div class="bg-slate-50 p-4 rounded-[1.5rem] border border-pink-50 mb-3"><div class="flex justify-between items-center mb-2"><span class="font-black text-slate-700 text-xs">${escapeHTML(data.customerName)}</span><span class="text-[10px]">${stars}</span></div><p class="text-xs text-slate-500 leading-relaxed font-bold">${escapeHTML(data.comment)}</p></div>`;
        }).join('');
    } catch (error) {
        reviewsContainer.innerHTML = '<p class="text-xs text-slate-400 font-bold text-center py-4">جاري مزامنة الآراء...</p>';
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

    // تنفيذ قرار عرض شريط الإعلانات وتحديث متغيراته
    window.renderTicker();

    // 👑 محرك الـ SEO السيادي لحقن الميتا داتا برمجياً وتصدر محركات البحث
    if (siteSettings.seo) {
        if (siteSettings.seo.title && siteSettings.seo.title.trim() !== '') {
            document.title = siteSettings.seo.title.trim();
            const titleEl = document.getElementById('dyn-page-title');
            if(titleEl) titleEl.innerText = siteSettings.seo.title.trim();
        } else {
            document.title = `${siteSettings.brandName} | المنصة الرسمية المعتمدة في الفرافرة`;
        }
        
        // تحديث أو إنشاء وسم الوصف (Meta Description) تلقائياً
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        if (siteSettings.seo.desc && siteSettings.seo.desc.trim() !== '') {
            metaDesc.setAttribute('content', siteSettings.seo.desc.trim());
        } else {
            metaDesc.setAttribute('content', `الموقع الرسمي لبراند حلويات بوسي (BoseSweets). نتميز بصناعة التورت الملكية، السينابون الفاخر، والدوناتس المبتكرة في الفرافرة والكفاح.`);
        }

        // تحديث أو إنشاء وسم الكلمات المفتاحية (Meta Keywords) تلقائياً
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.setAttribute('name', 'keywords');
            document.head.appendChild(metaKeywords);
        }
        if (siteSettings.seo.keywords && siteSettings.seo.keywords.trim() !== '') {
            metaKeywords.setAttribute('content', siteSettings.seo.keywords.trim());
        } else {
            metaKeywords.setAttribute('content', `حلويات بوسي, BoseSweets, تورت الفرافرة, حلويات الوادي الجديد, كيك الكفاح, سينابون بوسي`);
        }
    }

    // 👑 التوسيع الهندسي: تطبيق إعدادات اللودر والخطوط والأبعاد
    if (siteSettings.UI_Settings) {
        const loader = document.getElementById('global-loader');
        if (loader) {
            if (siteSettings.UI_Settings.loader_bgColor) loader.style.backgroundColor = siteSettings.UI_Settings.loader_bgColor;
            const loaderTextEl = loader.querySelector('h1');
            if (loaderTextEl) {
                if (siteSettings.UI_Settings.loader_text) loaderTextEl.innerText = siteSettings.UI_Settings.loader_text;
                if (siteSettings.UI_Settings.loader_textColor) loaderTextEl.style.color = siteSettings.UI_Settings.loader_textColor;
            }
            const loaderIcon = loader.querySelector('i');
            if(loaderIcon && siteSettings.UI_Settings.loader_textColor) loaderIcon.style.color = siteSettings.UI_Settings.loader_textColor;
        }

        if (siteSettings.UI_Settings.typography_config) {
            if (siteSettings.UI_Settings.typography_config.main_font_family) root.style.setProperty('--brand-font', siteSettings.UI_Settings.typography_config.main_font_family);
            if (siteSettings.UI_Settings.typography_config.global_font_size_base) root.style.setProperty('--global-font-size-base', siteSettings.UI_Settings.typography_config.global_font_size_base);
            if (siteSettings.UI_Settings.typography_config.global_font_weight_bold) root.style.setProperty('--global-font-weight-bold', siteSettings.UI_Settings.typography_config.global_font_weight_bold);
            if (siteSettings.UI_Settings.typography_config.global_text_color) root.style.setProperty('--global-text-color', siteSettings.UI_Settings.typography_config.global_text_color);
        }
    }

    if (siteSettings.layout_settings) {
        if (siteSettings.layout_settings.layout_waterfall_img_height) root.style.setProperty('--layout-waterfall-height', siteSettings.layout_settings.layout_waterfall_img_height);
        if (siteSettings.layout_settings.layout_waterfall_img_width) root.style.setProperty('--layout-waterfall-width', siteSettings.layout_settings.layout_waterfall_img_width);
        if (siteSettings.layout_settings.layout_waterfall_img_objectFit) root.style.setProperty('--layout-waterfall-fit', siteSettings.layout_settings.layout_waterfall_img_objectFit);
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
    if(areaSelect) areaSelect.innerHTML = `<option value="" disabled selected>اختر المنطقة المعتمدة للتوصيل...</option>` + shippingZones.map(z => `<option value="${z.id}">${escapeHTML(z.name)} (+${Number(z.fee)} ج.م توصيل)</option>`).join('');
    
    if(document.getElementById('sidebar-categories')) renderCustomerSidebarCategories();
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
    
    if (matches.length === 0) { resultsContainer.innerHTML = `<div class="flex flex-col items-center justify-center text-white/70 font-bold mt-10 bg-white/5 p-8 rounded-2xl"><i data-lucide="search-x" class="w-12 h-12 mb-4" style="color: #ff3377;"></i><p>لم نجد تطابق للبحث عن "${escapeHTML(query)}"</p><p class="text-xs opacity-70 mt-2">جرب البحث بكلمة مختلفة مثل "تورتة"، "نوتيلا"، "لوتس"</p></div>`; if(window.lucide) lucide.createIcons(); return; }
    resultsContainer.innerHTML = matches.map(p => {
        const imgUrl = optimizeCloudinaryUrl((p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category))); 
        const isOutOfStock = p.inStock === false;
        return `<div class="flex items-center gap-4 p-3 rounded-2xl bg-white shadow-sm border transition-all hover:shadow-md cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}" style="border-color: rgba(255, 51, 119, 0.2);" onclick="toggleLiveSearch(false); window.setCategory('${p.category}'); MemoryManager.set('search_scroll_${p.id}', ()=> { const el = document.getElementById('product-card-${p.id}'); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight-target'); MemoryManager.set('search_hl_${p.id}', ()=>el.classList.remove('highlight-target'), 2500);} }, 500);"><img src="${imgUrl}" class="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100 ${isOutOfStock ? 'grayscale' : ''}"><div class="flex-1"><h4 class="font-bold text-sm text-gray-800">${escapeHTML(p.name)}</h4><div class="flex items-center gap-2 mt-1"><span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">${p.category}</span><span class="font-bold text-sm text-[#ff3377]">${Number(p.price) > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span></div></div><div class="px-2">${isOutOfStock ? `<span class="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100">نفدت</span>` : `<button class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm bg-pink-50 text-[#ff3377]"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>`}</div></div>`;
    }).join('');
    if(window.lucide) lucide.createIcons();
}

function shareProduct(id, name) {
    const url = window.location.origin + window.location.pathname + '?product=' + id;
    if (navigator.share) { navigator.share({ title: siteSettings.brandName + ' - ' + name, text: 'شوف المنتج الروعة ده من حلويات بوسي!', url: url }).catch(console.error); } 
    else { navigator.clipboard.writeText(url).then(() => { showSystemToast('تم نسخ رابط المنتج بنجاح!', 'success'); }).catch(() => { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); showSystemToast('تم نسخ الرابط!', 'success'); }); }
}

// 👑 شلال الصور المطور التفاعلي: تدوير الصور تلقائياً حسب الساعة الحالية وتحويلها لروابط مباشرة للمنتج
function initWaterfall() {
    const col1 = document.getElementById('waterfall-col-1');
    const col2 = document.getElementById('waterfall-col-2');
    if (!col1 || !col2) return;

    const visualItems = catalog.filter(p => p && (p.images && p.images.length > 0 || p.img));
    if (visualItems.length === 0) return;

    const hourChunk = new Date().getHours() % Math.max(1, Math.floor(visualItems.length / 6));
    const startIdx = hourChunk * 6;
    const itemsToDisplay = visualItems.slice(startIdx, startIdx + 6);
    
    if(itemsToDisplay.length < 6) {
        itemsToDisplay.push(...visualItems.slice(0, 6 - itemsToDisplay.length));
    }

    const buildCardHTML = (item) => {
        const url = optimizeCloudinaryUrl((item.images && item.images.length > 0) ? item.images[0] : item.img);
        return `
            <div class="waterfall-card cursor-pointer group relative" onclick="window.navigateToProduct('${item.id}')" title="اضغط لاستعراض تفاصيل ${escapeHTML(item.name)}">
                <img src="${url}" loading="lazy" decoding="async" class="transition-transform duration-500 group-hover:scale-105" alt="صنف ${escapeHTML(item.name)} من قسم ${escapeHTML(item.category)} - حلويات بوسي بمركز الفرافرة">
                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start">
                    <span class="text-white text-xs font-bold truncate tracking-wide">${escapeHTML(item.name)}</span>
                </div>
            </div>`;
    };

    const htmlCol1 = itemsToDisplay.slice(0, 3).map(buildCardHTML).join('');
    const htmlCol2 = itemsToDisplay.slice(3, 6).map(buildCardHTML).join('');

    col1.innerHTML = htmlCol1 + htmlCol1;
    col2.innerHTML = htmlCol2 + htmlCol2;
}

window.initHomepageSections = function() {
    const sectionBS = document.getElementById('section-bestsellers');
    const sectionNA = document.getElementById('section-newarrivals');
    const bsContainer = document.getElementById('bestsellers-container');
    const naContainer = document.getElementById('newarrivals-container');
    
    if (!bsContainer && !naContainer) return;

    const bestSellers = catalog.filter(p => p.badge && (p.badge.includes('مبيعاً') || p.badge.includes('مبيعات'))).slice(0, 8);
    const newArrivals = catalog.filter(p => p.badge && (p.badge.includes('جديد') || p.badge.includes('🌟'))).slice(0, 8);

    const fallbackBS = bestSellers.length > 0 ? bestSellers : catalog.slice(0, 6);
    const fallbackNA = newArrivals.length > 0 ? newArrivals : catalog.slice().reverse().slice(0, 6);

    if (bsContainer && fallbackBS.length > 0) {
        if(sectionBS) sectionBS.classList.remove('hidden');
        bsContainer.innerHTML = fallbackBS.map(p => `
            <div class="shrink-0 w-[300px] snap-center">
                ${window.drawProductCard(p)}
            </div>
        `).join('');
    } else {
        if(sectionBS) sectionBS.classList.add('hidden');
    }

    if (naContainer && fallbackNA.length > 0) {
        if(sectionNA) sectionNA.classList.remove('hidden');
        naContainer.innerHTML = fallbackNA.map(p => `
            <div class="shrink-0 w-[300px] snap-center">
                ${window.drawProductCard(p)}
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
                
                if (cloudData) {
                    // 👑 ربط المتغيرات بالجذر وتطبيق أبعاد الشلال والخطوط واللودر المعتمدة بوثيقة المواصفات
                    window.siteSettings = { ...defaultSettings, ...cloudData };
                    
                    if (cloudData.layout_settings) {
                        const root = document.documentElement;
                        if (cloudData.layout_settings.layout_waterfall_img_height) {
                            root.style.setProperty('--layout-waterfall-height', cloudData.layout_settings.layout_waterfall_img_height);
                        }
                        if (cloudData.layout_settings.layout_waterfall_img_width) {
                            root.style.setProperty('--layout-waterfall-width', cloudData.layout_settings.layout_waterfall_img_width);
                        }
                        if (cloudData.layout_settings.layout_waterfall_img_objectFit) {
                            root.style.setProperty('--layout-waterfall-fit', cloudData.layout_settings.layout_waterfall_img_objectFit);
                        }
                    }
                    
                    // تصدر محركات البحث أوتوماتيكياً عبر توليد الأوصاف والعناوين والكلمات المفتاحية ديناميكياً لكل منتج
                    if (cloudData.UI_Settings && cloudData.UI_Settings.typography_config) {
                        const config = cloudData.UI_Settings.typography_config;
                        const root = document.documentElement;
                        if (config.main_font_family) root.style.setProperty('--brand-font', config.main_font_family);
                        if (config.global_font_size_base) root.style.setProperty('--global-font-size-base', config.global_font_size_base);
                        if (config.global_font_weight_bold) root.style.setProperty('--global-font-weight-bold', config.global_font_weight_bold);
                        if (config.global_text_color) root.style.setProperty('--global-text-color', config.global_text_color);
                    }
                }

                if(cloudData.visuals) siteSettings.visuals = { ...(defaultSettings.visuals || {}), ...cloudData.visuals };
                if(cloudData.cakeBuilder) {
                    siteSettings.cakeBuilder = { ...(defaultSettings.cakeBuilder || {}), ...cloudData.cakeBuilder };
                    if(!siteSettings.cakeBuilder.flavors || siteSettings.cakeBuilder.flavors.length === 0) {
                        siteSettings.cakeBuilder.flavors = defaultSettings.cakeBuilder.flavors;
                    }
                } else siteSettings.cakeBuilder = { ...defaultSettings.cakeBuilder };

                if(cloudData.social) siteSettings.social = { ...siteSettings.social, ...cloudData.social };

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
    }
    
    try { 
        const dbCart = await ClientStorageEngine.get('cart');
        if (dbCart) state.cart = dbCart;
        else {
            const savedCart = localStorage.getItem('boseSweets_cart_data'); 
            const savedCartSecured = localStorage.getItem('boseSweets_secured_cart'); 
            if (savedCartSecured) state.cart = JSON.parse(savedCartSecured);
            else if (savedCart) state.cart = JSON.parse(savedCart);
        }
    } catch (e) { state.cart = []; }
}

function saveCartToStorage() { 
    try { 
        ClientStorageEngine.set('cart', state.cart); 
        localStorage.setItem('boseSweets_cart_data', JSON.stringify(state.cart)); 
        localStorage.setItem('boseSweets_secured_cart', JSON.stringify(state.cart)); 
    } catch (e) {} 
}

function clearCartStorage() { 
    try { 
        ClientStorageEngine.remove('cart');
        localStorage.removeItem('boseSweets_cart_data'); 
        localStorage.removeItem('boseSweets_secured_cart');
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
        if (window.showHomeView) window.showHomeView();
        else if (window.goToHome) window.goToHome();
    } else {
        if (window.showMenuView) window.showMenuView();
        else if (window.switchToMenuView) window.switchToMenuView();
        renderMainDisplay();
    }

    initWaterfall(); 
    window.initHomepageSections(); 

    if(document.getElementById('gallery-customer-section')) renderCustomerGallery(); 
    syncCartUI(); 
    if(window.lucide) lucide.createIcons();
    
    renderSmartSuggestions('main');
    
    const phoneDisplay = document.getElementById('footer-phone-display');
    if (phoneDisplay) {
        phoneDisplay.innerText = siteSettings.footerPhone;
        phoneDisplay.parentElement.parentElement.onclick = () => { window.location.href = `tel:${siteSettings.footerPhone}`; };
    }
    
    const socialGrid = document.getElementById('footer-social-links-grid');
    if (socialGrid && siteSettings.social) {
        socialGrid.innerHTML = `
            <a href="${siteSettings.social.facebook}" target="_blank" class="p-2 bg-white rounded-lg text-blue-600 hover:scale-110 transition-transform shadow-xs"><i data-lucide="facebook" class="w-4 h-4"></i></a>
            <a href="${siteSettings.social.instagram}" target="_blank" class="p-2 bg-white rounded-lg text-pink-600 hover:scale-110 transition-transform shadow-xs"><i data-lucide="instagram" class="w-4 h-4"></i></a>
        `;
        if (window.lucide) lucide.createIcons();
    }
}

function renderCategories() {
    if (!isAppReady) return; 
    const el = document.getElementById('categories-nav');
    if(!el) return;
    
    el.innerHTML = catMenu.map(c => `<button id="cat-btn-${(c.name || c).replace(/\s+/g, '-')}" onclick="window.setCategory('${c.name || c}')" class="cat-pill whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-2xl font-bold transition-all border-2 text-sm sm:text-base ${state.activeCat === (c.name || c) ? 'bg-pink-600 text-white shadow-sm border-transparent' : 'bg-pink-50 text-slate-600 border-pink-100 hover:border-pink-300'}">${c.name === 'ورد' || c === 'ورد' ? 'ورد وهدايا 💐' : (c.name === 'تورت' || c === 'تورت' ? 'تورت وتصميم 🎂' : (c.name || c))}</button>`).join('');
}

function setActiveCategoryPill(catName) {
    document.querySelectorAll('.cat-pill').forEach(btn => {
        btn.classList.remove('bg-pink-600', 'text-white', 'shadow-sm', 'brand-gradient');
        btn.classList.add('bg-pink-50', 'text-slate-600');
    });
    const safeId = String(catName).replace(/\s+/g, '-');
    const activeBtn = document.getElementById(`cat-btn-${safeId}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-pink-50', 'text-slate-600');
        activeBtn.classList.add('bg-pink-600', 'text-white', 'shadow-sm');
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function renderFlowerTabs(container) {
    container.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border bg-white border-pink-100 flex flex-wrap justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">${fTypes.map(f => `<button onclick="window.setSub('f', '${f}')" class="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.fType === f ? 'text-white shadow-md brand-gradient' : 'text-slate-600 opacity-80 hover:opacity-100'}" style="${state.fType === f ? '' : 'color: var(--site-text);'}">${f}</button>`).join('')}</div>`;
}

// 👑 معالج فرض العرض الشبكي (القرار المهني لمنع انهيار المساحات البيضاء)
window.enforceCategoryRender = function(containerId, productsHTML) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = ''; 
        container.classList.remove('hidden'); 
        container.style.display = 'grid'; 
        container.innerHTML = productsHTML; 
    }
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
            'جاتوه': 'قطع جاتوه كلاسيكية تعتمد على إسفنج كيك خفيف الوزن مع كريمة غنية ونسبة سكر مدروسة بدقة.'
        };

        let desc = siteSettings.catDescriptions && siteSettings.catDescriptions[state.activeCat] 
                    ? siteSettings.catDescriptions[state.activeCat] 
                    : (defaultDescs[state.activeCat] || `أشهى الأصناف المميزة من قسم ${state.activeCat} محضرة بحرفية لضمان أعلى معايير الجودة.`);
        
        if (catDescEl) catDescEl.innerText = desc;
    } else if (catDescArea) {
        catDescArea.classList.add('hidden');
    }

    let breadcrumbHtml = `<nav class="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6 justify-center w-full"><span class="cursor-pointer hover:text-[#ff3377]" onclick="window.showHomeView ? window.showHomeView() : goToHome()">الرئيسية</span> <i data-lucide="chevron-left" class="w-4 h-4"></i> <span class="text-[#ff3377]">${state.activeCat}</span></nav>`;

    const container = document.getElementById('display-container'); 
    const subTabs = document.getElementById('sub-tabs-area');
    if(!container) return;

    let targetHTML = '';
    let showSubTabs = false;

    const fullWidthCategories = ['تورت', 'تورتة ميني', 'جاتوه', 'ورد', 'ريد فيلفت', 'كب كيك', 'بوكس الروقان'];
    const isFullWidth = fullWidthCategories.includes(state.activeCat);
    
    if (state.activeCat === 'تورت') { 
        container.className = 'w-full animate-fade-in';
        targetHTML = breadcrumbHtml + `<div id="cake-builder-steps-wrapper" class="w-full mt-6 rounded-[3rem] shadow-2xl border-2 overflow-hidden bg-white border-pink-100"></div>`; 
        setTimeout(() => { if(window.renderMultiStepCakeBuilder) window.renderMultiStepCakeBuilder(); }, 10);
    } 
    else if (state.activeCat === 'ورد') {
        showSubTabs = true;
        container.className = 'w-full animate-fade-in';
        let flowerHtml = breadcrumbHtml + `<div class="flex flex-col gap-12 w-full">`;
        fTypes.forEach(type => {
            const list = catalog.filter(p => p && p.category === 'ورد' && (p.flowerType === type || (p.desc && typeof p.desc === 'string' && p.desc.includes(type))));
            if(list.length > 0) { 
                flowerHtml += `<div id="flower-group-${type.replace(/\s+/g, '-')}" class="space-y-6 animate-fade-in"><div class="flex items-center gap-4 mb-4"><h3 class="font-black text-xl text-[#ff3377] shrink-0">${type}</h3><div class="h-[1px] w-full bg-pink-100"></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">${list.map(p => window.drawProductCard(p)).join('')}</div></div>`; 
            }
        });
        flowerHtml += `</div>`; 
        targetHTML = flowerHtml;
    }
    else {
        if (state.activeCat === 'ديسباسيتو') showSubTabs = true;
        
        if (isFullWidth) {
            container.className = 'grid grid-cols-1 gap-10 items-stretch w-full animate-fade-in max-w-4xl mx-auto';
        } else {
            // 👑 التحكم الديناميكي في عرض كروت المنتجات
            let baseGrid = 'grid-cols-1';
            if (siteSettings.layout_settings && siteSettings.layout_settings.layout_viewMode === 'columns_2') {
                baseGrid = 'grid-cols-2';
            }
            container.className = `grid ${baseGrid} md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 items-stretch w-full animate-fade-in`;
        }
        
        let list = catalog.filter(p => p && p.category === state.activeCat);
        if (state.activeCat === 'ديسباسيتو') {
            list = list.filter(p => {
                const matchSize = p.size === state.dSize || p.subType === state.dSize || (p.desc && typeof p.desc === 'string' && p.desc.includes(state.dSize));
                const isUncategorized = !p.size && !p.subType;
                return matchSize || isUncategorized;
            });
        }
        
        targetHTML = breadcrumbHtml + list.map(p => window.drawProductCard(p)).join('');
        
        if (list.length === 0) {
            container.className = 'w-full animate-fade-in';
            targetHTML = breadcrumbHtml + `<div class="text-center py-20"><i data-lucide="package-x" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i><p class="font-bold text-slate-500">جاري إعداد منتجات فاخرة في هذا قسم.</p></div>`;
        }
    }

    // التنفيذ القاطع لدالة الإجبار الشبكي
    window.enforceCategoryRender('display-container', targetHTML);
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
    
    renderSmartSuggestions('main');
}

window.navigateToProduct = function(productId) {
    const prod = catalog.find(p => String(p.id) === String(productId));
    if (!prod) return;
    
    const vHome = document.getElementById('view-home'); if(vHome) vHome.classList.add('hidden');
    const vMenu = document.getElementById('view-menu'); if(vMenu) vMenu.classList.add('hidden');
    const vTips = document.getElementById('view-tips'); if(vTips) vTips.classList.add('hidden');
    const vCake = document.getElementById('view-cake-builder'); if(vCake) vCake.classList.add('hidden');
    
    const container = document.getElementById('single-product-container');
    if (!container) return;
    
    const imageUrl = optimizeCloudinaryUrl((prod.images && prod.images.length > 0) ? prod.images[0] : (prod.img || 'https://via.placeholder.com/400'));
    const isOutOfStock = prod.inStock === false;
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start bg-white p-6 rounded-[2.5rem] border border-pink-50 shadow-sm max-w-4xl mx-auto">
            <div class="rounded-2xl overflow-hidden bg-pink-50 h-64 md:h-[350px] relative" onclick="openGlobalLightbox('${imageUrl}')">
                <img src="${imageUrl}" class="w-full h-full object-contain cursor-pointer transition-transform duration-300 hover:scale-105 ${isOutOfStock ? 'grayscale opacity-60' : ''}" alt="صنف ${escapeHTML(prod.name)} من قسم ${escapeHTML(prod.category)} - حلويات بوسي بمركز الفرافرة">
                ${isOutOfStock ? `<div class="absolute inset-0 bg-white/40 flex items-center justify-center"><span class="bg-[#D2386C] text-white px-4 py-2 rounded-xl text-xs font-bold shadow">نفذت الكمية</span></div>` : ''}
            </div>
            <div class="space-y-4 text-right flex flex-col h-full justify-between">
                <div class="space-y-2">
                    <span class="inline-block px-3 py-1 bg-pink-50 text-pink-600 rounded-md text-[11px] font-bold">${escapeHTML(prod.category)}</span>
                    <h2 class="text-xl font-black text-slate-800">${escapeHTML(prod.name)}</h2>
                    <p class="text-slate-500 text-xs leading-relaxed font-medium">${escapeHTML(prod.desc || getFinalDescription(prod))}</p>
                </div>
                <div class="pt-4 border-t border-pink-50 space-y-4">
                    <div class="flex justify-between items-center bg-pink-50/50 p-4 rounded-xl">
                        <span class="text-xs font-bold text-slate-500">سعر الصنف المعتمد:</span>
                        <span class="text-xl font-black text-pink-600">${prod.price > 0 ? prod.price + ' ج.م' : 'حسب الطلب'}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.showMenuView ? window.showMenuView() : window.setCategory('${prod.category}')" class="px-4 py-3 bg-slate-100 text-slate-600 rounded-full font-bold text-xs active:scale-95 transition-all border border-slate-200">العودة للمنيو</button>
                        ${isOutOfStock ? 
                            `<button class="flex-1 py-3 bg-slate-200 text-slate-400 rounded-full font-black text-xs cursor-not-allowed text-center border border-slate-300">غير متوفر حالياً</button>` : 
                            `<button onclick="window.addWithQtyContext(this, '${prod.id}')" class="flex-1 py-3 btn-premium-action brand-gradient text-white rounded-full font-black text-xs text-center shadow-md">إضافة فورية لحقيبة المشتريات 🛍️</button>`
                        }
                    </div>
                </div>
                <div class="pt-6 mt-4 border-t border-pink-50 w-full">
                    <h3 class="font-black text-slate-800 text-sm mb-4 flex items-center gap-2"><i data-lucide="star" class="w-4 h-4 text-amber-400"></i> آراء عملاء بوسي</h3>
                    <div id="reviews-list-${prod.id}" class="space-y-3 min-h-[50px]">
                        <p class="text-xs text-slate-400 font-bold text-center py-4">جاري تحميل الآراء...</p>
                    </div>
                    <div class="mt-6 bg-slate-50 p-4 rounded-[2rem] border border-pink-100">
                        <h4 class="font-black text-slate-800 text-xs mb-3 flex items-center gap-1.5"><i data-lucide="edit-3" class="w-4 h-4 text-[#ff3377]"></i> شاركنا تجربتك المهنية مع هذا الصنف</h4>
                        <div class="space-y-3">
                            <input type="text" id="review-cust-name-${prod.id}" placeholder="اسم حضرتك بالكامل..." class="w-full p-3 bg-white border border-pink-100 rounded-xl text-xs font-bold focus:outline-none focus:border-[#ff3377]">
                            <textarea id="review-cust-comment-${prod.id}" rows="2" placeholder="اكتب تعليقك الحي وتجربتك الواقعية للطعم..." class="w-full p-3 bg-white border border-pink-100 rounded-xl text-xs font-bold focus:outline-none focus:border-[#ff3377] resize-none"></textarea>
                            <div class="flex justify-between items-center bg-white p-2 rounded-xl border border-pink-100">
                                <span class="text-[10px] font-bold text-slate-500">التقييم بالنجوم:</span>
                                <select id="review-cust-rating-${prod.id}" class="text-xs font-black text-amber-500 bg-transparent focus:outline-none">
                                    <option value="5">⭐⭐⭐⭐⭐ (ممتاز)</option>
                                    <option value="4">⭐⭐⭐⭐ (جيد جداً)</option>
                                    <option value="3">⭐⭐⭐ (متوسط)</option>
                                </select>
                            </div>
                            <button id="review-submit-btn-${prod.id}" onclick="window.submitCustomerReviewLive('${prod.id}')" class="w-full py-2.5 bg-[#ff3377] text-white rounded-xl text-xs font-black shadow-sm">إرسال المراجعة المعتمدة</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const vProd = document.getElementById('view-product-details'); if(vProd) vProd.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
    if (window.loadLiveReviews) window.loadLiveReviews(prod.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.renderMultiStepCakeBuilder = function() {
    const wrapper = document.getElementById('cake-builder-steps-wrapper');
    if (!wrapper) return;

    const basePrice = siteSettings.cakeBuilder.basePrice || 145;
    const printingPrice = siteSettings.cakeBuilder.imagePrintingPrice || 60;
    const currentPrice = cakeState.persons * basePrice + (cakeState.printing !== 'بدون' ? printingPrice : 0);

    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`step-dot-${i}`);
        if (dot) {
            if (i <= currentBuilderStep) dot.classList.add('dot-active');
            else dot.classList.remove('dot-active');
        }
    }

    let stepContentHTML = '';

    if (currentBuilderStep === 1) {
        stepContentHTML = `
            <div class="p-10 text-center bg-pink-50 border-b border-pink-100 relative z-10 rounded-t-[3rem]">
                <h2 class="text-3xl font-black mb-4 uppercase tracking-tight text-pink-600">هندسة التورتة الملكية المخصصة 👑</h2>
                <p class="text-base font-bold text-slate-600 max-w-2xl mx-auto">نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة وفق أعلى معايير الجودة.</p>
            </div>
            <div class="cake-builder-step-panel step-active p-8 md:p-12 space-y-8 bg-white">
                <div class="space-y-4">
                    <label class="block font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="cake" class="w-5 h-5 text-pink-600"></i> نكهة كيك القاعدة الأساسي</label>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        ${(siteSettings.cakeBuilder.flavors || ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت']).map(fl => `
                            <button onclick="window.updateCakeBuilderField('flavor', '${fl}')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.flavor === fl ? 'brand-gradient text-white border-transparent shadow-md transform scale-105' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-pink-300'}">${fl}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="space-y-4 pt-4 border-t border-slate-50">
                    <label class="block font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="box" class="w-5 h-5 text-pink-600"></i> التصميم والشكل الهندسي</label>
                    <div class="grid grid-cols-3 gap-4">
                        ${['دائري', 'مربع', 'مستطيل'].map(sh => `
                            <button onclick="window.updateCakeBuilderField('shape', '${sh}')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.shape === sh ? 'brand-gradient text-white border-transparent shadow-md transform scale-105' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-pink-300'}">${sh}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="flex justify-end pt-6 mt-4">
                    <button onclick="window.changeBuilderStep(1)" class="px-8 py-4 btn-premium-action brand-gradient text-white font-black text-sm rounded-full shadow-lg">التالي: الحجم والمرفقات ⬅️</button>
                </div>
            </div>`;
    }
    else if (currentBuilderStep === 2) {
        stepContentHTML = `
            <div class="p-10 text-center bg-pink-50 border-b border-pink-100 relative z-10 rounded-t-[3rem]">
                <h2 class="text-3xl font-black mb-4 uppercase tracking-tight text-pink-600">تحديد الحجم والإضافات</h2>
            </div>
            <div class="cake-builder-step-panel step-active p-8 md:p-12 space-y-8 bg-white">
                <div class="space-y-4">
                    <label class="block font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="users" class="w-5 h-5 text-pink-600"></i> عدد الأفراد المقترح والمقاس</label>
                    <div class="flex items-center justify-between border-2 rounded-[2rem] p-4 bg-slate-50 border-slate-100 max-w-md mx-auto">
                        <button onclick="window.adjustBuilderPersons(-2)" class="p-3 bg-white text-pink-600 rounded-2xl flex items-center justify-center font-black shadow-sm hover:scale-110 transition-all border border-pink-100"><i data-lucide="minus" class="w-6 h-6"></i></button>
                        <span class="text-4xl font-black text-slate-800">${cakeState.persons}</span>
                        <button onclick="window.adjustBuilderPersons(2)" class="p-3 bg-white text-pink-600 rounded-2xl flex items-center justify-center font-black shadow-sm hover:scale-110 transition-all border border-pink-100"><i data-lucide="plus" class="w-6 h-6"></i></button>
                    </div>
                    <p class="text-sm text-slate-500 text-center font-bold">حساب التسعير: المتر المقترح للفرد يعادل ${basePrice} ج.م فقط</p>
                </div>
                <div class="space-y-4 pt-4 border-t border-slate-50">
                    <label class="block font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="printer" class="w-5 h-5 text-pink-600"></i> تكنولوجيا دمج وطباعة الصور الغذائية</label>
                    <div class="grid grid-cols-2 gap-4">
                        <button onclick="window.updateCakeBuilderField('printing', 'بدون')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.printing === 'بدون' ? 'brand-gradient text-white border-transparent shadow-md transform scale-105' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-pink-300'}">بدون صورة دمج</button>
                        <button onclick="window.updateCakeBuilderField('printing', 'صورة مجسمة')" class="py-4 rounded-2xl font-black text-sm transition-all border-2 ${cakeState.printing === 'صورة مجسمة' ? 'brand-gradient text-white border-transparent shadow-md transform scale-105' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-pink-300'}">صورة قابلة للأكل (+${printingPrice} ج.م)</button>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row justify-between gap-4 pt-6 mt-4">
                    <button onclick="window.changeBuilderStep(-1)" class="px-8 py-4 bg-slate-100 text-slate-600 font-black text-sm rounded-full active:scale-95 border border-slate-200">➡️ العودة للسابق</button>
                    <button onclick="window.changeBuilderStep(1)" class="px-8 py-4 btn-premium-action brand-gradient text-white font-black text-sm rounded-full shadow-lg">التالي: الملاحظات والاعتماد ⬅️</button>
                </div>
            </div>`;
    }
    else if (currentBuilderStep === 3) {
        stepContentHTML = `
            <div class="p-10 text-center bg-pink-50 border-b border-pink-100 relative z-10 rounded-t-[3rem]">
                <h2 class="text-3xl font-black mb-4 uppercase tracking-tight text-pink-600">المراجعة والاعتماد الفني</h2>
            </div>
            <div class="cake-builder-step-panel step-active p-8 md:p-12 space-y-8 bg-white">
                <div class="space-y-4">
                    <label class="block font-black text-lg text-slate-800 flex items-center gap-3"><i data-lucide="edit-3" class="w-5 h-5 text-pink-600"></i> ملاحظات التنفيذ الفنية أو عبارات الطباعة</label>
                    <textarea id="builder-notes-textarea" rows="4" oninput="cakeState.notes = this.value" class="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-base focus:outline-none focus:border-pink-500 resize-none" placeholder="اكتب الاسم، السن، الألوان المفضلة، أو أي تفاصيل تصميم معينة تود إبلاغ الإدارة بها مسبقاً...">${escapeHTML(cakeState.notes)}</textarea>
                </div>
                
                <div class="bg-pink-50 p-6 rounded-[2rem] border border-pink-100 space-y-3">
                    <h4 class="font-black text-slate-800 text-lg mb-4 border-b border-pink-200 pb-3 flex items-center gap-2"><i data-lucide="file-text" class="w-5 h-5 text-pink-600"></i> ملخص التصميم السيادي:</h4>
                    <div class="flex justify-between items-center text-sm"><span class="font-bold text-slate-500">النكهة المختارة:</span><span class="font-black text-slate-800">${cakeState.flavor}</span></div>
                    <div class="flex justify-between items-center text-sm"><span class="font-bold text-slate-500">الهندسة والشكل:</span><span class="font-black text-slate-800">${cakeState.shape}</span></div>
                    <div class="flex justify-between items-center text-sm"><span class="font-bold text-slate-500">حجم الضيافة المستهدف:</span><span class="font-black text-slate-800 font-mono">${cakeState.persons} أفراد</span></div>
                    <div class="flex justify-between items-center text-sm"><span class="font-bold text-slate-500">إضافة صورة مجسمة:</span><span class="font-black text-slate-800">${cakeState.printing}</span></div>
                    <div class="flex justify-between items-center pt-4 border-t border-pink-200 mt-4 text-lg font-black">
                        <span class="text-slate-800">القيمة التقديرية للتصميم:</span>
                        <span class="text-2xl text-pink-600 font-mono">${currentPrice} ج.م</span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row justify-between gap-4 pt-6 mt-4">
                    <button onclick="window.changeBuilderStep(-1)" class="px-8 py-4 bg-slate-100 text-slate-600 font-black text-sm rounded-full active:scale-95 border border-slate-200">➡️ تعديل البيانات</button>
                    <button onclick="window.commitCakeBuilderToCart()" class="px-8 py-4 btn-premium-action brand-gradient text-white font-black text-lg rounded-full shadow-xl flex-1 text-center">اعتماد وإدراج في الحقيبة 👑</button>
                </div>
            </div>`;
    }

    wrapper.innerHTML = stepContentHTML;
    if (window.lucide) lucide.createIcons();
};

window.changeBuilderStep = function(delta) {
    currentBuilderStep += delta;
    if (currentBuilderStep < 1) currentBuilderStep = 1;
    if (currentBuilderStep > 3) currentBuilderStep = 3;
    window.renderMultiStepCakeBuilder();
};

window.updateCakeBuilderField = function(field, value) {
    cakeState[field] = value;
    if (field === 'shape') {
        if (value === 'مربع' && cakeState.persons < 16) cakeState.persons = 16;
        else if (value === 'مستطيل' && cakeState.persons < 20) cakeState.persons = 20;
        else if (value === 'دائري' && cakeState.persons < 4) cakeState.persons = 4;
    }
    window.renderMultiStepCakeBuilder();
};

window.adjustBuilderPersons = function(delta) {
    let newPersons = cakeState.persons + delta;
    let limit = 4;
    if (cakeState.shape === 'مربع') limit = 16;
    if (cakeState.shape === 'مستطيل') limit = 20;
    
    if (newPersons < limit) newPersons = limit;
    if (newPersons > 100) newPersons = 100;
    
    cakeState.persons = newPersons;
    window.renderMultiStepCakeBuilder();
};

window.commitCakeBuilderToCart = function() {
    const basePrice = siteSettings.cakeBuilder.basePrice || 145;
    const printingPrice = siteSettings.cakeBuilder.imagePrintingPrice || 60;
    const finalPrice = cakeState.persons * basePrice + (cakeState.printing !== 'بدون' ? printingPrice : 0);
    
    let detailsString = `نكهة: ${cakeState.flavor} | هندسة: ${cakeState.shape} | عدد: ${cakeState.persons} فرد | صورة: ${cakeState.printing}`;
    if (cakeState.notes && cakeState.notes.trim() !== '') detailsString += ` | ملاحظات العميل: ${cakeState.notes.trim()}`;
    
    const uniqueCustomId = 'cb_' + Date.now();
    const customCakeItem = {
        id: uniqueCustomId,
        cartItemId: uniqueCustomId,
        name: 'تورتة الإصدار الملكي المخصص (طلب خاص)',
        category: 'تورت',
        price: finalPrice,
        quantity: 1,
        desc: detailsString,
        isCustom: true
    };
    
    state.cart.push(customCakeItem);
    saveCartToStorage();
    syncCartUI();
    
    cakeState = { flavor: 'فانيليا', shape: 'دائري', persons: 4, printing: 'بدون', notes: '', refImage: null };
    currentBuilderStep = 1;
    
    if (window.toggleCart) window.toggleCart(true);
    if (window.showMenuView) window.showMenuView();
    
    showSystemToast('تمت هندسة واعتماد التورتة المخصصة وإدراجها بالسلة بنجاح 👑', 'success');
};

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
    const cardElement = buttonElement.closest('.product-card-premium') || buttonElement.closest('.bg-white.flex.flex-col') || buttonElement.closest('.group');
    if(cardElement) {
        const qtyEl = cardElement.querySelector('.temp-qty-display');
        if(qtyEl) qty = parseInt(qtyEl.innerText) || 1;
    }

    const safeId = String(id); const prod = catalogMap.get(safeId) || catalog.find(p => String(p.id) === safeId); 
    if (!prod) return;
    
    if (prod.inStock === false) { 
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
        showSystemToast('نأسف لحضرتك، هذا المنتج غير متوفر حالياً لتلبية الطلب.', 'error'); 
        return; 
    }
    
    if(navigator.vibrate) navigator.vibrate(50);
    
    const exist = state.cart.find(i => String(i.id) === safeId && !i.isCustom);
    if (exist) { exist.quantity = Number(exist.quantity) + qty; } 
    else { const newCartItem = JSON.parse(JSON.stringify(prod)); newCartItem.quantity = qty; newCartItem.cartItemId = generateUniqueID(); state.cart.push(newCartItem); }
    
    saveCartToStorage(); syncCartUI(); calculateCartTotal(); 
    
    if(cardElement) {
        const qtyEl = cardElement.querySelector('.temp-qty-display');
        if(qtyEl) qtyEl.innerText = '1';
    }
    
    const cartBtn = document.querySelector('button[onclick="toggleCart(true)"]');
    if(cartBtn) { cartBtn.classList.add('scale-110'); setTimeout(() => cartBtn.classList.remove('scale-110'), 200); }
    
    showSystemToast(`تم إضافة الكمية (${qty}) بنجاح لقائمة المشتريات 🛍️`, 'success');
    window.renderSmartSuggestions('main');
    window.renderSmartSuggestions('cart');
};

window.drawProductCard = function(p) {
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
        discountBadgeHtml = `<div class="text-[#ff3377] text-sm font-black mb-2 px-3 py-1 bg-pink-50 rounded-full inline-block border border-pink-100">خصم ${discountPercent}% 🔥</div>`;
    } else if (p.badge) {
        discountBadgeHtml = `<div class="text-[#ff3377] text-sm font-black mb-2 px-3 py-1 bg-pink-50 rounded-full inline-block border border-pink-100">${escapeHTML(p.badge)}</div>`;
    }

    return `
    <div id="product-card-${pIdSafe}" class="product-card-premium">
        <div class="product-image-glow w-full aspect-square mb-4 relative overflow-hidden rounded-[2rem]" onclick="navigateToProduct('${pIdSafe}')">
            <img src="${displayImg}" class="${isOutOfStock ? 'grayscale opacity-70' : ''} w-full h-full object-contain transition-transform duration-700 hover:scale-110 cursor-pointer" loading="lazy" decoding="async" alt="صنف ${escapeHTML(p.name)} من قسم ${escapeHTML(p.category)} - حلويات بوسي بمركز الفرافرة">
            ${isOutOfStock ? `<div class="absolute inset-0 bg-white/50 backdrop-blur-[4px] z-10 flex items-center justify-center"><span class="bg-[#ff3377] text-white font-black px-4 py-2 rounded-xl shadow-lg">نفدت الكمية</span></div>` : ''}
        </div>
        
        <div class="flex flex-col flex-1 text-center bg-white relative z-20">
            ${discountBadgeHtml}
            <h4 class="text-xl font-black leading-tight text-slate-800 mb-2">${escapeHTML(p.name)}</h4>
            <p class="text-sm font-bold text-slate-500 mb-4 line-clamp-3 leading-relaxed">${getFinalDescription(p)}</p>
            
            <div class="mt-auto flex flex-col gap-4 w-full border-t border-pink-50 pt-4">
                <div class="flex items-center justify-center rounded-full py-2 px-4 mx-auto min-w-[70%] bg-pink-50 border border-pink-100 shadow-sm">
                    <span class="font-black text-2xl text-[#ff3377]">${currentP > 0 ? currentP + ' ج.م' : 'حسب الطلب'}</span>
                    ${(oldP && oldP > currentP) ? `<del class="text-sm text-slate-400 font-bold ml-2">${oldP}</del>` : ''}
                </div>
                
                <div class="flex flex-col gap-3 w-full">
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2 bg-slate-50 rounded-full p-1 border border-pink-100 shadow-inner quantity-controls">
                            <button onclick="updateTempQtyContext(this, -1)" class="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-[#ff3377] hover:bg-pink-50 font-black"><i data-lucide="minus" class="w-4 h-4"></i></button>
                            <span class="temp-qty-display text-lg font-black text-slate-700 w-6 text-center" data-prod-id="${pIdSafe}">1</span>
                            <button onclick="updateTempQtyContext(this, 1)" class="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-[#ff3377] hover:bg-pink-50 font-black"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        </div>
                        ${isOutOfStock ? 
                        `<button class="flex-1 py-3 bg-slate-100 text-slate-400 rounded-full font-black text-lg shadow-inner cursor-not-allowed border border-slate-200">غير متوفر</button>` 
                        : 
                        `<button onclick="addWithQtyContext(this, '${pIdSafe}')" class="flex-1 py-3 brand-gradient text-white rounded-full font-black text-lg btn-premium-action flex items-center justify-center gap-2"><i data-lucide="shopping-bag" class="w-5 h-5"></i> إضافة للسلة</button>`
                        }
                    </div>
                    <div class="flex gap-2 w-full">
                        <button onclick="navigateToProduct('${pIdSafe}')" class="flex-1 py-2.5 bg-pink-50 text-[#ff3377] rounded-full font-bold text-sm hover:bg-pink-100 transition-colors border border-pink-100">استعراض التفاصيل</button>
                        <button onclick="shareProduct('${pIdSafe}', '${escapeHTML(p.name)}')" class="px-3 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center"><i data-lucide="share-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};

window.renderCartList = function() {
    const container = document.getElementById('cart-items-list') || document.getElementById('cart-items-container'); 
    const totalDisplay = document.getElementById('cart-total-display') || document.getElementById('cart-total-price-display');
    const badge = document.getElementById('cart-badge-count');
    
    if (badge) {
        const totalItemsCount = state.cart.reduce((sum, item) => sum + Number(item.quantity), 0);
        if (totalItemsCount > 0) { badge.innerText = totalItemsCount; badge.classList.remove('hidden'); }
        else { badge.classList.add('hidden'); }
    }
    
    if (!container) return;
    if (state.cart.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center py-20 px-6 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-pink-100"><i data-lucide="shopping-bag" class="w-16 h-16 mb-6 text-pink-200"></i><h3 class="font-black text-2xl text-slate-600 mb-4">حقيبة مشترياتك فارغة حالياً.</h3><button onclick="window.showMenuView ? window.showMenuView() : (window.toggleCart && window.toggleCart(false))" class="text-white px-10 py-4 rounded-full font-black text-lg brand-gradient btn-premium-action">استعراض المنيو الملكي</button></div>`;
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
            <div class="w-24 h-24 rounded-[1.5rem] overflow-hidden shrink-0 bg-[#fff0f5] p-2 flex items-center justify-center">
                <img src="${renderImg}" class="w-full h-full object-contain">
            </div>
            <div class="flex-1 text-right min-w-0">
                <h4 class="font-black text-lg text-slate-800 mb-1 truncate">${escapeHTML(item.name)}</h4>
                <p class="text-xs font-bold text-slate-500 mb-2 truncate">${escapeHTML(item.desc || 'منتج معتمد بقائمة الطلب الفاخر.')}</p>
                <p class="font-black text-[#ff3377] text-xl font-mono">${p} ج.م</p>
            </div>
            <div class="flex flex-col items-end gap-3 shrink-0">
                <button onclick="window.modQ('${identifier}', 'remove')" class="p-2 text-slate-300 hover:text-[#ff3377] hover:bg-pink-50 rounded-xl transition-colors"><i data-lucide="trash-2" class="w-6 h-6"></i></button>
                <div class="flex items-center gap-3 bg-white rounded-full p-1 border border-pink-100">
                    <button class="w-8 h-8 flex justify-center items-center rounded-full text-[#ff3377] hover:bg-pink-50 font-black" onclick="window.modQ('${identifier}', -1)"><i data-lucide="minus" class="w-4 h-4"></i></button>
                    <span class="font-black text-lg text-slate-700 w-6 text-center">${q}</span>
                    <button class="w-8 h-8 flex justify-center items-center rounded-full text-[#ff3377] hover:bg-pink-50 font-black" onclick="window.modQ('${identifier}', 1)"><i data-lucide="plus" class="w-4 h-4"></i></button>
                </div>
            </div>
        </div>`;
    }).join('');
    
    if (totalDisplay) totalDisplay.innerText = total + " ج.م";
    if (window.lucide) lucide.createIcons();
};

window.renderSmartSuggestions = function(context = 'main') {
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
    
    let availableProducts = catalog.filter(p => p && p.inStock !== false && !cartIds.includes(String(p.id)) && p.category !== state.activeCat);
    
    if (availableProducts.length === 0) {
        parentArea.classList.add('hidden');
        return;
    }

    parentArea.classList.remove('hidden');

    const shuffled = availableProducts.sort(() => 0.5 - Math.random());
    const suggestions = shuffled.slice(0, context === 'cart' ? 4 : 8);

    container.innerHTML = suggestions.map(p => {
        const img = optimizeCloudinaryUrl((p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category)));
        return `<div class="shrink-0 w-[240px] snap-slide bg-white border border-pink-100 rounded-[2rem] p-4 shadow-sm flex flex-col group hover:-translate-y-2 transition-transform cursor-pointer" onclick="navigateToProduct('${p.id}')">
            <div class="relative w-full aspect-square mb-4 rounded-xl overflow-hidden bg-[#fff0f5] p-2 flex items-center justify-center">
                <img src="${img}" class="w-full h-full object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-110" loading="lazy">
            </div>
            <div class="flex-1 flex flex-col text-center">
                <h5 class="text-[15px] font-bold text-slate-800 mb-2 leading-tight line-clamp-1">${escapeHTML(p.name)}</h5>
                <div class="mt-auto">
                    <span class="font-black text-[#ff3377] block mb-3 text-lg font-mono">${p.price} ج.م</span>
                    <button onclick="event.stopPropagation(); addWithQtyContext(this, '${p.id}')" class="w-full py-2.5 bg-pink-50 text-[#ff3377] rounded-full font-black hover:bg-pink-100 transition-colors border border-pink-100 flex items-center justify-center gap-1.5"><i data-lucide="plus" class="w-4 h-4"></i> إضافة</button>
                </div>
            </div>
        </div>`;
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
    const b = document.getElementById('cart-count-badge');
    const totalCount = state.cart.reduce((s, i) => s + Number(i.quantity), 0);
    if (b) {
        if (totalCount > 0) { b.innerText = totalCount; b.classList.remove('hidden'); } else { b.classList.add('hidden'); }
    }
    window.renderCartList(); calculateCartTotal();
}

window.submitOrderFinal = async function() {
    if (state.cart.length === 0) return;
    
    let outOfStockItems = [];
    for (let item of state.cart) {
        if (item.isCustom) continue;
        const freshProd = catalogMap.get(String(item.id)) || catalog.find(p => String(p.id) === String(item.id));
        if (freshProd && freshProd.inStock === false) outOfStockItems.push(item.name);
    }
    
    if (outOfStockItems.length > 0) {
        showSystemToast(`نعتذر، المنتجات التالية غير متوفرة حالياً: ${outOfStockItems.join('، ')}. يرجى تحديث القائمة للاستمرار.`, 'error');
        return;
    }

    const cName = document.getElementById('cust-name') ? document.getElementById('cust-name').value.trim() : ''; 
    const cPhone = document.getElementById('cust-phone') ? document.getElementById('cust-phone').value.trim() : '';
    const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
    const cArea = document.getElementById('cust-area') ? document.getElementById('cust-area').options[document.getElementById('cust-area').selectedIndex]?.text : '';
    const cAddress = document.getElementById('cust-address') ? document.getElementById('cust-address').value.trim() : '';
    const cDate = document.getElementById('cust-date') ? document.getElementById('cust-date').value : '';
    const cTime = document.getElementById('cust-time') ? document.getElementById('cust-time').value : '';
    const cNotes = document.getElementById('cust-notes') ? document.getElementById('cust-notes').value.trim() : '';
    
    if (!document.getElementById('cust-name')) {
        return window.dispatchWhatsAppOrder();
    }

    if (!cName || !cPhone) { 
        showSystemToast('قرار إداري: يرجى إكمال بيانات الاسم ورقم التواصل لاعتماد الطلب.', 'error'); 
        return; 
    }
    
    if (deliveryMethod === 'delivery' && (!cArea || !cAddress)) { 
        showSystemToast('قرار إداري: يرجى تحديد المنطقة والعنوان التفصيلي للتوصيل.', 'error'); 
        return; 
    }

    if (!cDate || !cTime) {
        showSystemToast('قرار إداري: يرجى تحديد يوم وساعة الاستلام المطلوبة.', 'error'); 
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
            const trueProd = catalogMap.get(String(item.id)) || catalog.find(p => String(p.id) === String(item.id));
            if (trueProd && trueProd.price) { item.price = Number(trueProd.price); }
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

    let m = `*أمر توريد منتجات فاخرة - حلويات بوسي* 👑\n*الرقم المرجعي الموثق:* ${orderId}\n`;
    m += `-------------------------------------------\n`;
    m += `👤 العميل: ${cName}\n📞 الهاتف: ${cPhone}\n`;
    if(deliveryMethod === 'pickup') m += `🛵 وسيلة الحصول: استلام مباشر من الفرع\n`;
    else m += `🛵 وسيلة التوصيل: ${cArea} - ${cAddress}\n`;
    
    m += `📅 موعد الاستلام: ${cDate} الساعة ${cTime}\n`;
    m += `\n*بيان الأصناف والكميات المحجوزة:*\n`;
    state.cart.forEach((i, idx) => {
        const cost = i.price * i.quantity;
        m += `${idx + 1}. *${i.name}*\n`;
        m += `   - التخصيص: ${i.desc || 'صنف قياسي بالمنيو'}\n`;
        m += `   - الكمية: ${i.quantity} × السعر: ${i.price} ج ⬅️ الحساب: ${cost} ج.م\n\n`;
    });
    m += `-------------------------------------------\n`;
    if(shipFee > 0) m += `رسوم التوصيل: ${shipFee} ج.م\n`;
    m += `*الإجمالي المالي للطلب:* ${finalTotal} ج.م\n`;
    if(cNotes) m += `\n*ملاحظات للتنفيذ:* ${cNotes}\n`;
    m += `\nتنويه للإدارة: الطلب موجه تلقائياً من المنصة الرسمية، يرجى مراجعة الخزنة واعتماد التجهيز الفوري.`;

    const storePhone = siteSettings.footerPhone || '201097238441';
    let cleanPhone = storePhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(m)}`, '_blank');
    
    const orderData = { id: orderId, name: cName, phone: cPhone, area: deliveryMethod === 'pickup' ? 'استلام من الفرع' : cArea, address: cAddress, deliveryMethod: deliveryMethod, pickupDate: cDate, pickupTime: cTime, notes: cNotes, itemsArray: state.cart, subtotal: subtotal, shippingFee: shipFee, total: finalTotal, status: 'pending', timestamp: Date.now(), date: new Date().toLocaleString('ar-EG') };

    try {
        if(navigator.onLine && typeof db !== 'undefined') { db.collection('orders').doc(String(orderId)).set(orderData).catch(e => { ClientStorageEngine.queueOrder(orderData); }); } 
        else { throw new Error("Offline"); }
    } catch(e) { ClientStorageEngine.queueOrder(orderData); }

    state.cart = []; clearCartStorage(); syncCartUI(); 
    if (window.toggleCart) window.toggleCart(false); 
    if(window.showHomeView) window.showHomeView();
    else if(window.switchToMenuView) window.switchToMenuView();
    else renderMainDisplay();
    
    showSystemToast('تم اعتماد الطلب مهنياً وتمريره لمركز العمليات. نشكر ثقتكم!', 'success');

    if(btn) {
        btn.innerHTML = originalBtnHtml; 
        btn.disabled = false;
        if(window.lucide) lucide.createIcons();
    }
};

window.dispatchWhatsAppOrder = function() {
    if (state.cart.length === 0) return;
    
    const referenceId = 'BS-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random()*100).toString();
    let subtotal = 0;
    
    let orderMessage = `*أمر توريد منتجات فاخرة - حلويات بوسي* 👑\n`;
    orderMessage += `*الرقم المرجعي الموثق:* ${referenceId}\n`;
    orderMessage += `-------------------------------------------\n\n`;
    orderMessage += `*بيان الأصناف والكميات المحجوزة:*\n`;
    
    state.cart.forEach((item, index) => {
        const cost = item.price * item.quantity;
        subtotal += cost;
        orderMessage += `${index + 1}. *${item.name}*\n`;
        orderMessage += `   - التخصيص: ${item.desc || 'صنف قياسي بالمنيو'}\n`;
        orderMessage += `   - الكمية: ${item.quantity} × السعر: ${item.price} ج ⬅️ الحساب: ${cost} ج.م\n\n`;
    });
    
    orderMessage += `-------------------------------------------\n`;
    orderMessage += `*الإجمالي المالي للطلب:* ${subtotal} ج.م\n\n`;
    orderMessage += `تنويه للإدارة: الطلب موجه تلقائياً من المنصة الرسمية، يرجى مراجعة الخزنة واعتماد حالة التجهيز الفوري.`;
    
    const storePhone = siteSettings.footerPhone || '201097238441';
    let cleanPhone = storePhone.replace(/\D/g, '');
    const finalTargetPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    
    window.open(`https://wa.me/${finalTargetPhone}?text=${encodeURIComponent(orderMessage)}`, '_blank');
    
    state.cart = [];
    saveCartToStorage();
    syncCartUI();
    if(window.toggleCartSidebar) window.toggleCartSidebar(false);
    if(window.showHomeView) window.showHomeView();
    
    showSystemToast('تم اعتماد المعاملة وتمرير بيانات الفاتورة لمركز العمليات بنجاح 👑', 'success');
};

async function syncOfflineOrders() {
    if (!navigator.onLine || typeof db === 'undefined') return;
    try {
        const pendingOrders = await ClientStorageEngine.getQueuedOrders();
        if (pendingOrders.length === 0) return;
        for (let order of pendingOrders) {
            try { await db.collection('orders').doc(String(order.id)).set(order); await ClientStorageEngine.removeQueuedOrder(order.id); } catch (e) { }
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
    if (window.location.pathname.includes('admin.html') || document.title.includes('الإدارة') || document.getElementById('admin-orders-tbody')) { return; }
    initApp();
    syncOfflineOrders();
});

// 👑 التوسيع السيادي لحماية المحرك من الانهيار الصامت
window.getImgFallback = function(categoryName) {
    const safeCat = categoryName ? String(categoryName).trim() : '';
    const encodedBrand = encodeURIComponent('حلويات بوسي');
    // توفير مسار آمن للصورة البديلة لضمان عدم توقف دورة رسم المنتجات
    return `https://via.placeholder.com/400/fff0f5/ff3377?text=${encodedBrand}`;
};

// 👑 تطوير دالة الأقسام لدمج التوجيه الرأسي السلس
window.setCategory = function(c) {
    if (c === 'الرئيسية') {
        if(window.showHomeView) window.showHomeView();
        else if(window.goToHome) window.goToHome();
        state.activeCat = 'الرئيسية';
    } else {
        if(window.showMenuView) window.showMenuView();
        else if(window.switchToMenuView) window.switchToMenuView();
        state.activeCat = c;
        renderMainDisplay();

        // التوجيه الرأسي الذكي لبداية القسم لحماية العميل من التشتت
        MemoryManager.set('scroll_to_products', () => {
            const displayContainer = document.getElementById('display-container');
            const catDescArea = document.getElementById('category-description-area');
            const targetElement = (catDescArea && !catDescArea.classList.contains('hidden')) ? catDescArea : displayContainer;
            
            if (targetElement) {
                const headerOffset = 140; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        }, 100);
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

// 👑 معالجة وإرسال مراجعات العملاء بأمان
window.submitCustomerReviewLive = async function(productId) {
    const nameInput = document.getElementById(`review-cust-name-${productId}`);
    const commentInput = document.getElementById(`review-cust-comment-${productId}`);
    const ratingSelect = document.getElementById(`review-cust-rating-${productId}`);
    const submitBtn = document.getElementById(`review-submit-btn-${productId}`);

    if (!nameInput || !commentInput || !ratingSelect) return;

    const customerName = nameInput.value.trim();
    const comment = commentInput.value.trim();
    const rating = parseInt(ratingSelect.value) || 5;

    if (!customerName || !comment) {
        showSystemToast("تنويه مهني: يرجى كتابة الاسم والتعليق لاعتماد التقييم الفني ✨", "error");
        return;
    }

    // 🛡️ تفعيل الحماية البرمجية لمنع العميل من الإرسال العشوائي المتكرر وحفظ استقرار الموقع 100%
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.innerText = "جاري الحفظ والاعتماد الفني...";

    const reviewId = 'rev_' + Date.now().toString(36);
    const reviewPayload = {
        reviewId: reviewId,
        customerName: customerName,
        rating: rating,
        comment: comment,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        isApproved: false // فلترة برمجية لحماية الواجهة من الكلمات غير اللائقة
    };

    try {
        if (typeof db !== 'undefined') {
            await db.collection('catalog').doc(String(productId)).collection('livereviews').doc(reviewId).set(reviewPayload);
            showSystemToast("تم إرسال مراجعتك بنجاح! ستظهر فور الاعتماد الإداري 👑", "success");
            nameInput.value = '';
            commentInput.value = '';
        }
    } catch (e) {
        showSystemToast("حدث تأخير في الشبكة، تم تجميد التقييم للمزامنة اللاحقة", "info");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "إرسال المراجعة المعتمدة";
    }
};

/* =========================================================
   محرك تصحيح التبويبات والأقسام - حلويات بوسي
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    // مراقبة الضغط على أي قسم من أقسام القائمة المعتمدة
    document.body.addEventListener('click', function(e) {
        // استهداف أزرار التبويبات بشكل ذكي
        const tabBtn = e.target.closest('.category-tab, .cat-btn, [onclick*="Category"], [onclick*="Cat"]');
        
        if (tabBtn) {
            // إعطاء المحرك مهلة زمنية دقيقة لمعالجة البيانات ثم إجبار العرض
            setTimeout(() => {
                const productContainers = document.querySelectorAll('.products-grid, #products-container, .catalog-grid, [id*="grid"]');
                
                productContainers.forEach(container => {
                    if (container) {
                        container.style.display = 'grid'; // فرض الشبكة الهندسية
                        container.classList.remove('hidden'); // إزالة حظر الظهور
                    }
                });
            }, 150);
        }
    });
});
/* ترقية محرك سلة المشتريات لمنصة حلويات بوسي */
document.addEventListener('click', function(event) {
    if (event.target && event.target.closest('.add-to-cart-btn')) {
        event.preventDefault();
        
        const button = event.target.closest('.add-to-cart-btn');
        const productCard = button.closest('.product-card') || button.closest('.product-item');
        
        const productId = productCard.getAttribute('data-id') || Date.now().toString();
        const productName = productCard.querySelector('.product-title, .product-name').innerText;
        
        const priceText = productCard.querySelector('.product-price').innerText;
        const productPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));

        processBoseSweetsOrder(productId, productName, productPrice);
    }
});

function processBoseSweetsOrder(id, name, price) {
    let currentCart = JSON.parse(localStorage.getItem('boseSweetsCartData')) || [];
    let existingItem = currentCart.find(item => item.id === id || item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentCart.push({ id: id, name: name, price: price, quantity: 1 });
    }
    
    localStorage.setItem('boseSweetsCartData', JSON.stringify(currentCart));
    updateCartDisplay();
}

function updateCartDisplay() {
    let currentCart = JSON.parse(localStorage.getItem('boseSweetsCartData')) || [];
    let totalItems = currentCart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCounters = document.querySelectorAll('.cart-counter, .cart-badge');
    cartCounters.forEach(counter => {
        counter.innerText = totalItems;
        counter.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', updateCartDisplay);
