// ⚡ Engine Upgrade: Ultimate Dynamic Catalog Engine (V. Infinity)
const PreloadEngine = {
    loadedUrls: new Set(),
    ignite(catalogData, galleryData = []) {
        MemoryManager.set('preload_ignite', () => {
            const allUrls = [];
            catalogData.forEach(i => {
                if(i.images && i.images.length > 0) i.images.forEach(img => allUrls.push(optimizeCloudinaryUrl(img)));
                else allUrls.push(optimizeCloudinaryUrl(i.img || getImgFallback(i.category)));
            });
            galleryData.forEach(g => allUrls.push(optimizeCloudinaryUrl(g.url)));
            allUrls.forEach(url => { if(url && !this.loadedUrls.has(url)) { const img = new Image(); img.src = url; this.loadedUrls.add(url); } });
        }, 3000); 
    }
};

// 🛡️ Engine Upgrade: Memory Manager (Garbage Collector) 
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
        if (this.timers[key]) {
            clearTimeout(this.timers[key]);
            delete this.timers[key];
        }
    },
    flush() {
        let cleared = 0;
        for (let key in this.timers) {
            clearTimeout(this.timers[key]);
            delete this.timers[key];
            cleared++;
        }
        if(cleared > 0) console.log(`BoseSweets Memory Manager: Flushed ${cleared} inactive references. 🧹`);
    }
};

// 🛡️ Engine Upgrade: Advanced Live Search Engine
const LiveSearchEngine = {
    index: new Map(),
    normalizeArabic(text) {
        if (!text) return '';
        return String(text)
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/ـ/g, ''); 
    },
    build(catalogData) {
        this.index.clear();
        catalogData.forEach(p => {
            const rawTokens = `${p.name || ''} ${p.category || ''} ${p.desc || ''} ${p.subType || ''} ${p.size || ''}`;
            const tokens = this.normalizeArabic(rawTokens).toLowerCase();
            this.index.set(p.id, { tokens, data: p });
        });
        console.log("BoseSweets: Live Search Engine Indexed successfully 👑");
    },
    observeIndexUpdate(newCatalog) {
        if (!this.index || this.index.size === 0) {
            this.build(newCatalog);
            return;
        }

        const newIds = new Set();
        let added = 0, updated = 0, removed = 0;

        newCatalog.forEach(p => {
            if (!p || !p.id) return;
            newIds.add(p.id);
            const rawTokens = `${p.name || ''} ${p.category || ''} ${p.desc || ''} ${p.subType || ''} ${p.size || ''}`;
            const tokens = this.normalizeArabic(rawTokens).toLowerCase();

            if (this.index.has(p.id)) {
                const existing = this.index.get(p.id);
                if (existing.tokens !== tokens || JSON.stringify(existing.data) !== JSON.stringify(p)) {
                    this.index.set(p.id, { tokens, data: p });
                    updated++;
                }
            } else {
                this.index.set(p.id, { tokens, data: p });
                added++;
            }
        });

        for (let id of this.index.keys()) {
            if (!newIds.has(id)) {
                this.index.delete(id);
                removed++;
            }
        }

        if (added > 0 || updated > 0 || removed > 0) {
            console.log(`BoseSweets: Search Index Auto-Updated (Differential) 🔄 [+${added} | ~${updated} | -${removed}]`);
        }
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
        return results;
    }
};

let liveSearchTimeout = null;
window.performLiveSearchDebounced = function(query) {
    if (liveSearchTimeout) clearTimeout(liveSearchTimeout);
    liveSearchTimeout = setTimeout(() => {
        performLiveSearch(query);
    }, 250); 
};

// 🛡️ Engine Upgrade: Robust Client Storage Engine (IndexedDB)
const ClientStorageEngine = {
    dbName: 'BoseSweetsClientDB',
    cartStore: 'CartStore',
    queueStore: 'PendingOrdersQueue',
    version: 2,
    logError(context, error) {
        try {
            const errLog = { context, msg: error.message || String(error), time: new Date().toLocaleString('ar-EG') };
            let logs = JSON.parse(localStorage.getItem('BoseSweets_ErrorLogs') || '[]');
            logs.unshift(errLog);
            if(logs.length > 50) logs.pop(); 
            localStorage.setItem('BoseSweets_ErrorLogs', JSON.stringify(logs));
            console.warn(`BoseSweets Storage Engine: Error caught in [${context}] and securely logged. 🛡️`);
        } catch(e) {}
    },
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
        } catch (e) { this.logError('ClientStorage_Set', e); }
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
        } catch (e) { this.logError('ClientStorage_Get', e); return null; }
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
        } catch(e) { this.logError('ClientStorage_Remove', e); }
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
        } catch(e) { this.logError('ClientStorage_QueueOrder', e); }
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
        } catch(e) { this.logError('ClientStorage_GetQueuedOrders', e); return []; }
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
        } catch(e) { this.logError('ClientStorage_RemoveQueuedOrder', e); }
    }
};

const detailedDescriptions = {
    'ديسباسيتو نوتيلا مثلث': 'مثلث السعادة الصغير.. جرعة "نوتيلا" مركزة جداً فوق قاعدة من فادج كيك حلويات بوسي الغني، معمولة عشان تذوب في ثواني وتعدل مودك في أسرع وقت. القطمة الواحدة فيها انفجار طعم مش هتحس بيه غير في الحجم ده 🍫🔺',
    'ديسباسيتو نوتيلا وسط': 'قلب الديسباسيتو النابض.. توازن رهيب بين طبقة الفادج السميكة وصوص النوتيلا البرازيلي اللي مغطي الوسط بالكامل، الحجم ده معمول للروقان الهادي اللي بياخدك لعالم تاني مع كل معلقة 🍫 روقان',
    'ديسباسيتو نوتيلا كبير': 'محيط من النوتيلا الأصلية السايحة.. فخامة الحجم الكبير بتخليك تغرق في طعم الفادج الكثيف مع طبقة نوتيلا سخية جداً، دي مش مجرد تحلية دي "وليمة" لعشاق الشيكولاتة اللي مبيعرفوش يوقفوا 🍫🌊',
    'ورد طبيعي': 'روح الطبيعة في بيتك.. ورد فريش بعبير ساحر وقطرات الندى، بنختاره بعناية من أحلى المزارع عشان يوصلك بريحته اللي بترد الروح ويكون لغة تعبير راقية عن مشاعرك في أجمل اللحظات 💐✨',
    'ورد صناعي': 'جمال يدوم للأبد.. ورد صناعي بخامات ملكية فاخرة وملمس طبيعي جداً، قطعة ديكور راقية بيفضل رونقها ثابت عشان يفضل ذكرى حلوة تزيّن بيتكم وتفكركم بأحلى الأيام 🌷👑',
    'ورد ستان': 'شغل الهاند-ميد الفاخر.. كل وردة معمولة يدوياً من أفخم أنواع الستان بحرفية "حلويات بوسي" الخاصة، ملمس ناعم وشكل "بريستيج" جداً يتقدم لهدية مفيش منها اتنين 🎀💖',
    'ورد فلوس': 'أشيك طريقة لتقديم العيدية والهدايا النقدية.. ورد منسق بلمسة إبداعية وفنية تخلي هديتك مش مجرد مبلغ مالي، دي ذكرى مبهجة ومفاجأة بتخطف العين والقلب 💸🌹',
    'ورد هدايا': 'تنسيق متكامل يجمع بين رقة الورد وشياكة التغليف.. البوكيه ده معمول مخصوص عشان يكون رفيق للهدايا القيمة، بلمسات فنية بتخلي شكل الهدية النهائي يبهر اللي هيستلمها 🎁✨',
    'ورد شيكولاتة': 'ميكس السعادة المطلق.. بوكيه بيجمع بين شياكة الورد وطعم شيكولاتة حلويات بوسي الملكية، هدية "تؤكل" وتفرح القلب والعين في نفس الوقت.. الدلع اللي بجد 🍫🌹',
    'جاتوه كلاسيك': 'قطعة الجاتوه الأصيلة اللي بترجعنا لأحلى الذكريات بلمسة بوسي.. فادج كيك خفيف جداً وهش، بيدوب مع كريمة غنية وسكر مظبوط بالمللي.. الاختيار اللي مبيختلفش عليه اتنين 🍰✨',
    'تورتة ميني': 'تورتة ميني كيوت تكفي فردين.. مثالية للمفاجآت السريعة والرومانسية 🎂🥰',
    'حجم (فرد - فردين)': 'تورتة "المفاجأة السعيدة" من حلويات بوسي 🎂 حجم كيوت وتصميم ملكي يخطف القلب، معمولة مخصوص للحظات الرومانسية أو احتفال صغير بين اتنين.. كيك هش وحشوات غنية تكفيكم وتفيض حب 🥰',
    'حجم (3 - 4 أفراد)': 'الاختيار الذهبي للمات العيلة الصغيرة 🏠 تورتة بتجمع بين الشياكة والطعم اللي يظبط المزاج، بتكفي 4 أفراد بقطع وافية وكريمة غنية.. توثقوا بيها أحلى صور وذكريات مع حلويات بوسي ✨',
    'حجم (5 - 6 أفراد)': 'تورتة المناسبات السعيدة اللي بتشرفك قدام ضيوفك 👑 حجم عائلي بامتياز وتفاصيل فنية دقيقة، حشوات بريميوم وكيك بمقادير مظبوطة بالمللي تضمن إن كل ضيف ياخد قطعته ويدعي لمزاجك الراقي 🎂🎉',
    'سينابون': 'سر السينابون عندنا في العجينة القطنية اللي مخبوزة بحب ومحشية بأجود قرفة وسكر بني 🍥 الصوص الكريمي بيغطيها ويدفي قلبك مع كل قطمة.. ريحة وطعم يودوك عالم تاني من الهدوء والروقان 🤎✨',
    'سينابون نوتيلا': 'ميكس القرفة الدافئة مع النوتيلا السايحة على عجينة سينابون هشة.. طعم يجمع بين الدفا والرفاهية اللي مفيش زيها 🤎🍫'
};

function getCapsuleDescription(p) {
    if (!p) return '';
    let n = (p.name ? String(p.name) : '').trim().toLowerCase();
    let c = (p.category ? String(p.category) : '').trim().toLowerCase();

    if (c.includes('دوناتس') && n.includes('نوتيلا')) return 'عجينة دوناتس قطنية خفيفة جداً "بتبظ" نوتيلا أصلية سايحة مع كل قطمة.. انفجار سعادة مستحيل تقاوميه! 🍩🍫';
    if (c.includes('سينابون') && n.includes('نوتيلا')) return 'ميكس القرفة الدافئة مع غرقانة النوتيلا السايحة على عجينة سينابون هشة.. طعم يجمع بين الدفا والرفاهية 🤎🍫';
    if (c.includes('قشطوط') && n.includes('نوتيلا')) return 'نوتيلا أصلية فوق طبقة قشطة طبيعية وكيك غرقان حليب.. توازن رهيب بين الحلاوة والانتعاش بيذوب في البق ☁️🍫';
    if (n.includes('كبات') && n.includes('نوتيلا')) return 'طبقات من الكيك الهش وكريمة النوتيلا الغنية في كب شيك.. جرعة سعادة مركزة وسريعة لمزاجك الراقي 🧁🍫';
    if (c.includes('ديسباسيتو') && n.includes('نوتيلا')) return 'فادج كيك شيكولاتة مركز وغرقان نوتيلا برازيلي.. دمار لذيذ لعشاق الشيكولاتة التقيلة وبس 🍫🤤';
    if (c.includes('دوناتس') || c.includes('بامبوليني')) return 'عجينة دوناتس مقلية خفيفة زي القطنة بصوصات مبهجة.. مستحيل تكتفي بواحدة 🍩😍';
    if (c.includes('سينابون') || n.includes('سينابون')) return 'عجينة قطنية طرية غرقانة قرفة وصوص جبنة.. ريحتها هتدفيك 🤎✨';
    if (c.includes('ديسباسيتو') || n.includes('ديسباسيتو')) return 'فادج كيك غني غرقان صوص شيكولاتة برازيلي.. بتطبطب عالقلب 🍫🤤';
    if (c.includes('قشطوط') || n.includes('قشطوط')) return 'كيكة هشة بتدوب غرقانة حليب وقشطة طبيعية.. تطبطب على قلبك ☁️🤍';

    return 'قطعة فنية من حلويات بوسي، معمولة بحب ومقادير مظبوطة عشان تليق بذوقك وتفتح شهيتك ✨';
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
        if ((n.includes(kLower) || sub.includes(kLower)) && c === 'تورت') {
            return detailedDescriptions[key];
        }
        if ((n.includes('جاتوه') || c.includes('جاتوه')) && key.includes('جاتوه')) {
            return detailedDescriptions['جاتوه كلاسيك']; 
        }
    }

    return getCapsuleDescription(p);
}

// 🛡️ المصدات القوية ضد انهيار الألوان
function hexToMathHSL(hex) {
    try {
        if (!hex || typeof hex !== 'string') return 340;
        hex = hex.replace('#', '').trim();
        let r = 0, g = 0, b = 0;
        if (hex.length === 3) { 
            r = parseInt(hex[0]+hex[0], 16); 
            g = parseInt(hex[1]+hex[1], 16); 
            b = parseInt(hex[2]+hex[2], 16); 
        } else if (hex.length === 6) { 
            r = parseInt(hex.substring(0,2), 16); 
            g = parseInt(hex.substring(2,4), 16); 
            b = parseInt(hex.substring(4,6), 16); 
        } else {
            return 340;
        }
        
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
    const perf = typeof performance !== 'undefined' ? Math.floor(performance.now() * 1000).toString(36).toUpperCase() : '0000';
    const cryptoRandom = window.crypto && window.crypto.getRandomValues 
        ? window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36).substring(0,4).toUpperCase() 
        : Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BS-${timestamp}-${perf}-${cryptoRandom}`;
}

function showSystemToast(message, type = 'info') {
    const toast = document.getElementById('system-toast');
    if(!toast) return;
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    msgEl.innerText = message;
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm max-w-[90vw] text-center border border-gray-700 toast-enter ${type === 'error' ? 'bg-red-900' : (type === 'success' ? 'bg-emerald-800' : 'bg-gray-900')}`;
    iconEl.setAttribute('data-lucide', type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info'));
    if(window.lucide) lucide.createIcons();
    
    MemoryManager.set('toast_timer', () => {
        toast.classList.replace('flex', 'hidden'); 
        toast.classList.remove('toast-enter');
    }, 4000);
}

let adminClicksCounter = 0;
window.triggerAdminAccess = function(e) {
    if(e) e.stopPropagation(); 
    adminClicksCounter++;
    MemoryManager.clear('admin_clicks_reset');
    
    if (adminClicksCounter >= 5) {
        adminClicksCounter = 0;
        showSystemToast('جاري التحويل لبوابة الحماية 🛡️...', 'success');
        MemoryManager.set('admin_redirect', () => { window.location.href = 'login.html'; }, 800);
    }
    
    MemoryManager.set('admin_clicks_reset', () => { adminClicksCounter = 0; }, 1500);
};

function autoBindAdminAccess() {
    const portal = document.getElementById('admin-secret-portal');
    if (portal) {
        portal.addEventListener('click', window.triggerAdminAccess);
        console.log("BoseSweets: Secret portal bound to Sidebar Header.");
    }
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

let defaultCatalog = [
    { id: 'dp_tri_dark', name: 'ديسباسيتو نوتيلا دارك', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_lotus', name: 'ديسباسيتو لوتس', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_white', name: 'ديسباسيتو نوتيلا وايت', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_caramel', name: 'ديسباسيتو كراميل', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_kinder', name: 'ديسباسيتو كيندر', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_blueb', name: 'ديسباسيتو بلوبيري', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_raspb', name: 'ديسباسيتو راسبيري', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_cherry', name: 'ديسباسيتو كرز', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_snick', name: 'ديسباسيتو اسنيكرز', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_mix', name: 'ديسباسيتو ميكس شوكليت', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_pist', name: 'ديسباسيتو بيستاشيو', category: 'ديسباسيتو', size: '83', inStock: true }
];

async function fetchDefaultCatalog() {
    try { const response = await fetch('data.json'); const fetchedData = await response.json(); if(fetchedData && fetchedData.length > 0) defaultCatalog = [...defaultCatalog, ...fetchedData]; } 
    catch (error) { console.error("تعذر تحميل الكتالوج الافتراضي الإضافي:", error); }
}

let siteSettings = { ...defaultSettings };
let shippingZones = [ ...defaultShipping ];
let catalog = []; let galleryData = []; let catMenu = [];

const dSizes = ['مثلث', 'وسط', 'كبير']; const fTypes = ['ورد طبيعي', 'ورد صناعي', 'ورد ستان', 'ورد هدايا', 'ورد فلوس', 'ورد شيكولاتة'];
let state = { activeCat: 'تورت', dSize: 'مثلث', fType: 'ورد طبيعي', cart: [], currentShippingFee: 0, cakeBuilder: { flv: 'فانيليا', ps: 4, sh: 'دائري', trd: false, img: 'بدون', msg: '', alg: '', occ: '', refImgUrl: '', hasRefImg: false, crd: false, dlg: false } };

// 🛡️ الموتور الأساسي: حماية الهوية البصرية (تعديل السيادة الشامل)
function applySettingsToUI() {
    const root = document.documentElement;
    
    const brandHue = (siteSettings.visuals && siteSettings.visuals.themeHex) 
        ? hexToMathHSL(siteSettings.visuals.themeHex) 
        : (siteSettings.brandColorHex ? hexToMathHSL(siteSettings.brandColorHex) : 340);
    
    root.style.setProperty('--brand-hue', brandHue);
    root.style.setProperty('--brand-font', (siteSettings.visuals && siteSettings.visuals.fontFamily) ? siteSettings.visuals.fontFamily : (siteSettings.fontFamily || "'Cairo', sans-serif"));
    root.style.setProperty('--base-font-size', (siteSettings.baseFontSize || 16) + 'px');
    root.style.setProperty('--base-font-weight', siteSettings.baseFontWeight || 400);
    root.style.setProperty('--site-bg', (siteSettings.visuals && siteSettings.visuals.bgHex) ? siteSettings.visuals.bgHex : (siteSettings.bgColor || '#ffffff'));
    root.style.setProperty('--site-text', (siteSettings.visuals && siteSettings.visuals.textHex) ? siteSettings.visuals.textHex : (siteSettings.textColor || '#663b3b'));
    
    const loaderTextEl = document.getElementById('dyn-loader-text');
    if (loaderTextEl) {
        loaderTextEl.innerText = (siteSettings.visuals && siteSettings.visuals.loaderText) ? siteSettings.visuals.loaderText : "أهلاً بكم في عالم حلويات بوسي ✨";
    }

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

// 👑 SINGLE SOURCE OF TRUTH (SSOT) ENGINE
// النظام العبقري لمنع التضارب بين النسخ وإنهاء الرندرة العشوائية للأبد
let isCloudSettingsReady = false;
let isCloudCatalogReady = false;

async function loadEngineMemory() {
    try {
        // نضع الديفولت كـ "شبكة أمان" للتشغيل الأولي فقط (لو النت فاصل عند العميل)
        await fetchDefaultCatalog(); 
        catalog = [...defaultCatalog]; 
        
        const settingsPromise = new Promise((resolve) => {
            if (typeof db === 'undefined') { resolve(); return; }
            db.collection('settings').doc('main').onSnapshot(snapshot => {
                if (snapshot.exists) {
                    const cloudData = snapshot.data();
                    const newSettingsHash = JSON.stringify(cloudData.visuals);
                    
                    if (window.lastSettingsHash !== newSettingsHash) {
                        window.lastSettingsHash = newSettingsHash;
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
                        } else {
                            catMenu = [...new Set(catalog.map(p => p.category))].filter(Boolean);
                        }
                        if (!catMenu.includes('تورت')) catMenu.unshift('تورت');
                        
                        applySettingsToUI();
                        if(isCloudSettingsReady && document.getElementById('categories-nav')) renderCategories();
                    }
                }
                if(!isCloudSettingsReady) { isCloudSettingsReady = true; resolve(); }
            }, (error) => { console.warn("BoseSweets: Settings Sync Error", error); resolve(); });
        });

        const catalogPromise = new Promise((resolve) => {
            if (typeof db === 'undefined') { resolve(); return; }
            db.collection('catalog').onSnapshot(snapshot => {
                
                // 👑 الخطوة الأولى: إلغاء محاولة دمج السحابة مع الأكواد الافتراضية.
                // السحابة (Firebase) هي الإدارة الوحيدة. طالما متصلين، ما يقوله الفايربيس ينفذ بالحرف.
                let firebaseData = [];
                snapshot.forEach(doc => firebaseData.push(doc.data()));
                
                // تحديث مباشر للكتالوج الرئيسي، لو الإدارة مسحت منتج هيتمسح، لو ضافوا هيتضاف. لا عودة للأشباح.
                if (firebaseData.length > 0) {
                    catalog = firebaseData;
                } else if (snapshot.empty && !isCloudCatalogReady) {
                    // السحابة فاضية تماما في أول تحميل؟ نستعمل الديفولت مؤقتا عشان الموقع ميبقاش فاضي
                    catalog = [...defaultCatalog];
                } else {
                    // السحابة فاضية والإدارة اللي مسحت كل حاجة؟ الموقع يفضي نفسه طاعة للإدارة.
                    catalog = [];
                }

                syncCatalogMap();
                LiveSearchEngine.observeIndexUpdate(catalog);
                
                // 👑 الخطوة الثانية: منع الرندرة العشوائية بإخبار المتصفح بإعادة الرسم فقط لو احنا فاتحين الصفحة.
                if(isCloudCatalogReady && document.getElementById('display-container')) {
                    if(window.renderDebounceTimer) clearTimeout(window.renderDebounceTimer);
                    window.renderDebounceTimer = setTimeout(() => { renderMainDisplay(); }, 150);
                }
                
                if(!isCloudCatalogReady) { isCloudCatalogReady = true; resolve(); }
            }, (error) => { console.warn("BoseSweets: Catalog Sync Error", error); resolve(); });
        });

        await Promise.all([settingsPromise, catalogPromise]);

        if (typeof db !== 'undefined') {
            const gallerySnap = await db.collection('gallery').orderBy('timestamp', 'desc').get();
            if (!gallerySnap.empty) { galleryData = []; gallerySnap.forEach(doc => galleryData.push(doc.data())); }
            
            const shipSnap = await db.collection('shipping').get();
            if (!shipSnap.empty) { shippingZones = []; shipSnap.forEach(doc => shippingZones.push(doc.data())); }
        }
        
    } catch(err) { 
        catalog = [...defaultCatalog]; 
        syncCatalogMap(); 
        LiveSearchEngine.build(catalog);
        const availableCats = [...new Set(catalog.map(p => p.category))];
        if (!availableCats.includes(state.activeCat) && availableCats.length > 0) state.activeCat = availableCats[0];
        console.warn("BoseSweets: Offline Mode active. 🛡️");
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

async function saveEngineMemory(type) {
    try {
        if (type === 'cat' || type === 'all') localStorage.setItem('bSweets_catalog', JSON.stringify(catalog));
        if (type === 'set' || type === 'all') localStorage.setItem('bSweets_settings', JSON.stringify(siteSettings));
        if (type === 'ship' || type === 'all') localStorage.setItem('bSweets_shipping', JSON.stringify(shippingZones));
        if (type === 'gal' || type === 'all') localStorage.setItem('bSweets_gallery', JSON.stringify(galleryData));
    } catch (e) {}
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
    
    const urlParams = new URLSearchParams(window.location.search);
    const routeCat = urlParams.get('category');
    if(routeCat && catMenu.includes(routeCat)) state.activeCat = routeCat;

    applySettingsToUI();
    if(document.getElementById('gallery-customer-section')) renderCustomerGallery(); 
    if(document.getElementById('categories-nav')) renderCategories();
    if(document.getElementById('display-container')) renderMainDisplay();
    syncCartUI(); 
    if(window.lucide) lucide.createIcons();
    PreloadEngine.ignite(catalog, galleryData);
    
    window.requestAnimationFrame(() => {
        const loader = document.getElementById('global-loader');
        if(loader) { 
            loader.style.opacity = '0'; 
            loader.style.visibility = 'hidden'; 
            MemoryManager.set('loader_hide', () => loader.style.display = 'none', 500); 
        }
    });
    
    const sharedProductId = urlParams.get('product');
    if(sharedProductId && document.getElementById('display-container')) {
        const prod = catalogMap.get(sharedProductId);
        if(prod) {
            setCategory(prod.category); 
            MemoryManager.set('product_scroll', () => {
                const el = document.getElementById('product-card-' + sharedProductId);
                if(el) { 
                    el.scrollIntoView({behavior: 'smooth', block: 'center'}); 
                    el.classList.add('highlight-target'); 
                    MemoryManager.set('remove_highlight', () => el.classList.remove('highlight-target'), 2500); 
                }
            }, 500);
        }
    }
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
        return `<div class="flex items-center gap-4 p-3 rounded-2xl bg-white shadow-sm border transition-all hover:shadow-md cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}" style="border-color: hsla(var(--brand-hue), 80%, 90%, 0.5);" onclick="toggleLiveSearch(false); setCategory('${p.category}'); MemoryManager.set('search_scroll_${p.id}', ()=> { const el = document.getElementById('product-card-${p.id}'); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight-target'); MemoryManager.set('search_hl_${p.id}', ()=>el.classList.remove('highlight-target'), 2500);} }, 500);"><img src="${imgUrl}" class="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100 ${isOutOfStock ? 'grayscale' : ''}"><div class="flex-1"><h4 class="font-bold text-sm text-gray-800">${escapeHTML(p.name)}</h4><div class="flex items-center gap-2 mt-1"><span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">${p.category}</span><span class="font-bold text-sm" style="color: hsl(var(--brand-hue), 70%, 40%);">${Number(p.price) > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span></div></div><div class="px-2">${isOutOfStock ? `<span class="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100"><i data-lucide="ban" class="w-3 h-3 inline"></i> نفدت</span>` : `<button class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm dyn-hover-bg" style="background-color: hsl(var(--brand-hue), 80%, 95%); color: hsl(var(--brand-hue), 70%, 50%);"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>`}</div></div>`;
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
    const container = document.getElementById('sidebar-categories');
    if(!container) return;
    
    // 👑 Data-Hashing for Sidebar: لا يتم تغيير الهيكل إلا إذا تغيرت التصنيفات فعلياً
    const newHash = JSON.stringify(catMenu);
    if (container.dataset.renderedHash !== newHash) {
        container.innerHTML = catMenu.map(c => `<button onclick="toggleCustomerMenu(false); setCategory('${c}')" class="text-right w-full p-3 rounded-xl font-bold text-sm transition-all hover:bg-gray-50 flex items-center justify-between" style="border: 1px solid hsl(var(--brand-hue), 80%, 95%); color: var(--site-text);"><span>${c === 'ورد' ? 'ورد وهدايا 💐' : (c === 'تورت' ? 'تورت وتصميم 🎂' : c)}</span><i data-lucide="chevron-left" class="w-4 h-4 opacity-50"></i></button>`).join('');
        container.dataset.renderedHash = newHash;
        if(window.lucide) lucide.createIcons();
    }
}

function renderCustomerGallery() {
    const sec = document.getElementById('gallery-customer-section'); const slider = document.getElementById('gallery-slider');
    if(!sec) return;
    if (galleryData.length === 0) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');
    
    const newHash = JSON.stringify(galleryData.map(g=>g.id));
    if (slider.dataset.renderedHash !== newHash) {
        slider.innerHTML = galleryData.map(g => `<div class="shrink-0 cursor-pointer hover:scale-105 transition-transform" onclick="openLightbox('${g.url}')"><div class="w-32 h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-sm border" style="border-color: hsl(var(--brand-hue), 80%, 90%);"><img src="${optimizeCloudinaryUrl(g.url)}" class="w-full h-full object-cover" loading="lazy" alt="سابقة أعمال حلويات بوسي"></div></div>`).join('');
        slider.dataset.renderedHash = newHash;
    }
}

function openLightbox(url) { const lb = document.getElementById('gallery-lightbox'); document.getElementById('lightbox-img').src = url; lb.classList.remove('hidden'); lb.classList.add('flex'); if(window.lucide) lucide.createIcons(); }
function closeLightbox() { const lb = document.getElementById('gallery-lightbox'); lb.classList.add('hidden'); lb.classList.remove('flex'); }

function renderCategories() {
    const el = document.getElementById('categories-nav');
    if(!el) return;
    
    const newHash = JSON.stringify(catMenu) + "_" + state.activeCat;
    if (el.dataset.renderedHash !== newHash) {
        el.innerHTML = catMenu.map(c => `<button id="cat-btn-${c.replace(/\s+/g, '-')}" onclick="setCategory('${c}')" class="whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all border-2 text-sm sm:text-base ${state.activeCat === c ? 'text-white shadow-lg scale-105 brand-gradient border-transparent' : 'border-pink-100 hover:border-pink-300'}" style="${state.activeCat === c ? '' : `background-color: var(--site-bg); color: var(--site-text); border-color: hsl(var(--brand-hue), 80%, 90%);`}">${c === 'ورد' ? 'ورد وهدايا 💐' : (c === 'تورت' ? 'تورت وتصميم 🎂' : c)}</button>`).join('');
        el.dataset.renderedHash = newHash;
    }
}

function setCategory(c) { 
    state.activeCat = c; 
    renderCategories(); 
    renderMainDisplay(); 
    history.pushState({category: c}, '', `?category=${encodeURIComponent(c)}`);
    MemoryManager.set('scroll_cat', () => { const activeBtn = document.getElementById(`cat-btn-${c.replace(/\s+/g, '-')}`); if (activeBtn) { activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } }, 50); 
}

function renderFlowerTabs(container) {
    const newHash = state.fType;
    if (container.dataset.renderedHash !== newHash) {
        container.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border flex flex-wrap justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">${fTypes.map(f => `<button onclick="setSub('f', '${f}')" class="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.fType === f ? 'text-white shadow-md brand-gradient' : 'opacity-80 hover:opacity-100'}" style="${state.fType === f ? '' : 'color: var(--site-text);'}">${f}</button>`).join('')}</div>`;
        container.dataset.renderedHash = newHash;
    }
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

function getCakeBuilderHTML() {
    const c = state.cakeBuilder; const settings = siteSettings.cakeBuilder || defaultSettings.cakeBuilder;
    const baseP = Number(settings.basePrice) || 145; const imgOpts = settings.imagePrinting || defaultSettings.cakeBuilder.imagePrinting;
    const selectedImgOption = imgOpts.find(opt => opt.label === c.img) || {price: 0};
    const price = Number(c.ps) * baseP + Number(selectedImgOption.price);
    const flavors = settings.flavors || ['فانيليا']; 
    const rawImagesList = (settings.images && settings.images.length > 0) ? settings.images : [getImgFallback('تورت')];
    const imagesList = rawImagesList.map(url => optimizeCloudinaryUrl(url));
    const descText = settings.desc || defaultSettings.cakeBuilder.desc;
    
    let sliderHtml = `<div class="w-full md:w-2/5 aspect-[3/4] md:aspect-square rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-2 shadow-xl relative flex snap-slider hide-scrollbar bg-white group" style="border-color: hsl(var(--brand-hue), 80%, 90%);">${imagesList.map(url => `<img src="${url}" class="w-full h-full object-cover shrink-0 snap-slide transition-transform duration-700 group-hover:scale-105">`).join('')}</div>`;
    
    return `<div class="rounded-[2.5rem] shadow-xl border overflow-hidden animate-fade-in relative" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);"><div class="p-6 md:p-10 border-b flex flex-col md:flex-row items-center gap-8" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);">${sliderHtml}<div class="flex-1 text-center md:text-right"><h2 class="text-2xl md:text-4xl font-bold mb-4 uppercase tracking-tight" style="color: hsl(var(--brand-hue), 70%, 50%);">تخصيص التورت الملكية 👑</h2><p class="text-sm md:text-base font-bold leading-loose opacity-80" style="color: var(--site-text);">${escapeHTML(descText)}</p></div></div><div class="p-6 md:p-12 space-y-12"><div class="grid grid-cols-1 lg:grid-cols-2 gap-10"><div class="space-y-4"><label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="cake" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> نكهة الكيك المفضلة</label><div class="grid grid-cols-2 md:grid-cols-4 gap-3">${flavors.map(fl => `<button onclick="uCake('flv', '${escapeHTML(fl)}')" class="py-3 rounded-xl font-bold border-2 text-sm transition-all ${c.flv === fl ? 'text-white shadow-md scale-105 brand-gradient border-transparent' : 'hover:opacity-80'}" style="${c.flv === fl ? '' : `background-color: var(--site-bg); color: hsl(var(--brand-hue), 70%, 50%); border-color: hsl(var(--brand-hue), 80%, 90%);`}">${escapeHTML(fl)}</button>`).join('')}</div></div><div class="space-y-4"><label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="heart" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> عدد الأفراد</label><div class="flex items-center justify-between border rounded-2xl p-2 shadow-inner h-full max-h-[80px]" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);"><button onclick="adjP(-2)" class="p-3 rounded-xl border hover:scale-105 transition-all"><i data-lucide="minus"></i></button><span class="text-3xl font-bold">${c.ps}</span><button onclick="adjP(2)" class="p-3 rounded-xl border hover:scale-105 transition-all"><i data-lucide="plus"></i></button></div></div></div></div><div class="p-8 md:p-14 border-t-2 flex flex-col md:flex-row justify-between items-center gap-8" style="background-color: hsl(var(--brand-hue), 80%, 95%);"><div class="text-center md:text-right"><span class="block font-bold mb-2">الإجمالي التقديري</span><span class="text-4xl md:text-6xl font-bold">${price} ج.م</span></div><button onclick="commitCakeBuilder()" class="w-full md:w-auto text-white font-bold text-xl md:text-2xl py-5 px-12 rounded-2xl shadow-xl brand-gradient">إضافة للمراجعة</button></div></div>`;
}

// 👑 DATA HASHING ENGINE (الحل النهائي لمنع الرندرة)
// يقوم بمقارنة "البيانات نفسها" (الاسم، السعر، المخزون) بدلا من مقارنة "شكل كود HTML"
// عشان لو المتصفح لعب في شكل الأيقونات، الموقع ميتلخبطش ويعيد الرسم!
function renderMainDisplay() {
    const container = document.getElementById('display-container'); 
    const subTabs = document.getElementById('sub-tabs-area');
    if(!container) return;

    let targetHTML = '';
    let showSubTabs = false;
    let dataHashToCompare = '';

    if (state.activeCat === 'تورت') { 
        targetHTML = getCakeBuilderHTML(); 
        dataHashToCompare = "CAKE_" + JSON.stringify(state.cakeBuilder);
    } 
    else if (state.activeCat === 'ورد') {
        showSubTabs = true;
        let flowerHtml = `<div class="flex flex-col gap-12 w-full">`;
        let listToHash = [];
        fTypes.forEach(type => {
            const list = catalog.filter(p => p && p.category === 'ورد' && (p.flowerType === type || (p.desc && typeof p.desc === 'string' && p.desc.includes(type))));
            if(list.length > 0) { 
                listToHash.push(...list);
                flowerHtml += `<div id="flower-group-${type.replace(/\s+/g, '-')}" class="space-y-6 animate-fade-in"><div class="flex items-center gap-4 mb-4"><h3 class="font-black text-xl text-pink-600 shrink-0">${type}</h3><div class="h-[1px] w-full bg-pink-100"></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${list.map(p => drawProductCard(p, 'full')).join('')}</div></div>`; 
            }
        });
        flowerHtml += `</div>`; 
        targetHTML = flowerHtml;
        dataHashToCompare = "FLOWER_" + listToHash.map(p => p.id + p.price + p.inStock + (p.images ? p.images.length : 0)).join('-');
    }
    else {
        if (state.activeCat === 'ديسباسيتو') {
            showSubTabs = true;
        }
        let list = catalog.filter(p => p && p.category === state.activeCat);
        if (state.activeCat === 'ديسباسيتو') {
            list = list.filter(p => {
                const matchSize = p.size === state.dSize || p.subType === state.dSize || (p.desc && typeof p.desc === 'string' && p.desc.includes(state.dSize));
                const isUncategorized = !p.size && !p.subType;
                return matchSize || isUncategorized;
            });
        }
        const userLayout = siteSettings.productLayout || 'grid';
        targetHTML = `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 items-stretch">${list.map(p => drawProductCard(p, userLayout)).join('')}</div>`;
        dataHashToCompare = "NORMAL_" + state.activeCat + "_" + list.map(p => p.id + p.price + p.inStock + p.name + (p.images ? p.images.length : 0)).join('-');
    }

    // 👑 التطبيق الفولاذي: إذا كانت بيانات المنتجات مطابقة لآخر مرة اترسمت فيها، لا تفعل شيئاً!
    if (container.dataset.renderedHash !== dataHashToCompare) {
        container.innerHTML = targetHTML;
        container.dataset.renderedHash = dataHashToCompare; // تسجيل بصمة البيانات
        if(window.lucide) lucide.createIcons();
    }

    if (showSubTabs) {
        subTabs.classList.remove('hidden');
        if (state.activeCat === 'ورد') renderFlowerTabs(subTabs);
        if (state.activeCat === 'ديسباسيتو') {
            const dHash = "DESP_TABS_" + state.dSize;
            if (subTabs.dataset.renderedHash !== dHash) {
                subTabs.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border flex justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">${dSizes.map(s => `<button onclick="setSub('s', '${s}')" class="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.dSize === s ? 'text-white shadow-md brand-gradient' : 'opacity-80 hover:opacity-100'}" style="${state.dSize === s ? '' : 'color: var(--site-text);'}">${s}</button>`).join('')}</div>`;
                subTabs.dataset.renderedHash = dHash;
            }
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
    const cardElement = buttonElement.closest('.bg-white.flex.flex-col');
    if(cardElement) {
        const qtyEl = cardElement.querySelector('.temp-qty-display');
        if(qtyEl) qty = parseInt(qtyEl.innerText) || 1;
    }

    const safeId = String(id); const prod = catalogMap.get(safeId); 
    if (!prod) return;
    if (prod.inStock === false) { showSystemToast('نأسف، هذا المنتج غير متوفر حالياً.', 'error'); return; }
    
    if(navigator.vibrate) navigator.vibrate(50); 
    
    const exist = state.cart.find(i => String(i.id) === safeId);
    if (exist) { 
        exist.quantity = Number(exist.quantity) + qty; 
    } else { 
        const newCartItem = JSON.parse(JSON.stringify(prod)); 
        newCartItem.quantity = qty; 
        newCartItem.cartItemId = generateUniqueID(); 
        state.cart.push(newCartItem); 
    }
    
    saveCartToStorage(); 
    syncCartUI(); 
    calculateCartTotal(); 
    
    if(cardElement) {
        const qtyEl = cardElement.querySelector('.temp-qty-display');
        if(qtyEl) qtyEl.innerText = '1';
    }
    
    const cartBtn = document.querySelector('button[onclick="toggleCart(true)"]');
    if(cartBtn) { cartBtn.classList.add('scale-110'); MemoryManager.set('cart_bounce', ()=> cartBtn.classList.remove('scale-110'), 200); }
    
    showSystemToast(`تم إضافة الكمية (${qty}) للسلة بنجاح 🛍️`, 'success');
};

function drawProductCard(p, layoutMode = 'grid') {
    if (!p) return '';
    const pIdSafe = String(p.id || ''); 
    let itemLayout = (p.layout && p.layout !== 'default') ? p.layout : layoutMode;
    let isFullWidth = (itemLayout === 'full');
    const isOutOfStock = p.inStock === false;
    
    const rawImageList = (p.images && p.images.length > 0) ? p.images : [p.img || getImgFallback(p.category)];
    const imageList = rawImageList.map(url => optimizeCloudinaryUrl(url));
    
    const finalDesc = getFinalDescription(p, isFullWidth);

    let discountBadgeHtml = '';
    const oldP = Number(p.oldPrice);
    const currentP = Number(p.price);
    if (oldP && oldP > currentP) {
        const discountPercent = Math.round(((oldP - currentP) / oldP) * 100);
        discountBadgeHtml = `<span class="absolute top-2 right-2 bg-red-500 text-white text-[11px] px-2.5 py-1 rounded-br-xl rounded-tl-xl shadow-lg font-black z-20 animate-pulse border border-red-400">خصم ${discountPercent}% 🔥</span>`;
    } else if (p.badge) {
        discountBadgeHtml = `<span class="absolute top-2 right-2 brand-gradient text-white text-[10px] px-2 py-1 rounded-br-xl rounded-tl-xl shadow-md font-bold z-20">${escapeHTML(p.badge)}</span>`;
    }

    const renderActionArea = () => {
        if (isOutOfStock) return `<div class="w-full py-2.5 mt-auto text-[11px] font-bold rounded-xl text-center border shadow-inner" style="color: hsl(var(--brand-hue), 70%, 50%); background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);">نفدت الكمية 😔</div>`;
        return `
        <div class="mt-auto flex flex-col gap-2 w-full pt-1">
            <div class="flex items-center justify-center rounded-full py-1.5 px-3 border mx-auto min-w-[70%] shadow-sm relative" style="background-color: hsla(var(--brand-hue), 80%, 95%, 0.8); border-color: hsl(var(--brand-hue), 80%, 90%);">
                <span class="font-black text-[14px] sm:text-[16px]" style="color: hsl(var(--brand-hue), 70%, 40%);">${currentP > 0 ? currentP + ' ج.م' : 'حسب الطلب'}</span>
                ${(oldP && oldP > currentP) ? `<del class="absolute -top-3 text-[10px] text-gray-400 font-bold opacity-70">${oldP}</del>` : ''}
            </div>
            
            <div class="flex items-center justify-between gap-2 w-full">
                <div class="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5 border border-gray-100 shadow-inner quantity-controls">
                    <button onclick="updateTempQtyContext(this, -1)" class="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded shadow-sm transition-all dyn-hover-bg" style="color: hsl(var(--brand-hue), 70%, 50%);"><i data-lucide="minus" class="w-3 h-3 sm:w-4 sm:h-4"></i></button>
                    <span class="temp-qty-display text-[11px] sm:text-[13px] font-black text-gray-700 w-3 sm:w-4 text-center" data-prod-id="${pIdSafe}">1</span>
                    <button onclick="updateTempQtyContext(this, 1)" class="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded shadow-sm transition-all dyn-hover-bg" style="color: hsl(var(--brand-hue), 70%, 50%);"><i data-lucide="plus" class="w-3 h-3 sm:w-4 sm:h-4"></i></button>
                </div>
                
                <button onclick="addWithQtyContext(this, '${pIdSafe}')" class="flex-1 py-1.5 sm:py-2 brand-gradient text-white rounded-lg font-bold text-[11px] sm:text-[13px] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-1.5 border" style="border-color: hsla(var(--brand-hue), 80%, 80%, 0.5);">
                    <i data-lucide="shopping-basket" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i> إضافة
                </button>
            </div>
        </div>`;
    };

    const titleClass = isFullWidth ? 'text-[15px] sm:text-[18px] mb-2' : 'text-[13px] sm:text-[15px] mb-1';
    const descClass = isFullWidth 
        ? 'text-[12px] sm:text-[14px] font-bold leading-relaxed mb-4 px-2' 
        : 'text-[10px] sm:text-[11px] font-bold leading-tight mb-2 px-0.5';

    return `
    <div id="product-card-${pIdSafe}" class="${isFullWidth ? 'col-span-full' : ''} bg-white flex flex-col h-full overflow-hidden border rounded-[1.2rem] sm:rounded-[1.5rem] transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1" style="border-color: hsla(var(--brand-hue), 80%, 80%, 0.8);">
        <div class="relative aspect-square overflow-hidden shrink-0" style="background-color: hsla(var(--brand-hue), 80%, 95%, 0.3);">
            ${discountBadgeHtml}
            <button onclick="shareProduct('${pIdSafe}', '${escapeHTML(p.name)}')" class="absolute top-2 left-2 z-20 w-7 h-7 sm:w-9 sm:h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110" style="color: hsl(var(--brand-hue), 70%, 50%);"><i data-lucide="share-2" class="w-3 h-3 sm:w-4 sm:h-4"></i></button>
            <div id="slider-${pIdSafe}" class="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar snap-slider">
                ${imageList.map(url => `<img src="${url}" class="min-w-full h-full object-cover snap-slide transition-transform duration-700 hover:scale-105" loading="lazy" alt="${escapeHTML(p.name)}">`).join('')}
            </div>
            ${isOutOfStock ? `<div class="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10"></div>` : ''}
        </div>
        
        <div class="p-2.5 sm:p-4 flex flex-col flex-1 text-center bg-white relative z-20">
            <h4 class="${titleClass} font-black leading-tight" style="color: hsl(var(--brand-hue), 70%, 40%);">${escapeHTML(p.name)}</h4>
            <p class="${descClass}" style="color: var(--site-text); opacity: 0.85;">${finalDesc}</p>
            ${renderActionArea()}
        </div>
    </div>`;
}

function getImgFallback(cat) {
    const m = { 'تورت': 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80', 'جاتوهات': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 'قشطوطة': 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80', 'بامبوليني': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', 'دوناتس': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', 'ديسباسيتو': 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=80', 'سينابون': 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80', 'ريد فيلفت': 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80', 'كبات السعادة': 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80', 'ميل فاي': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80', 'إكلير': 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=800&q=80', 'تشيز كيك': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', 'عروض وبوكسات': 'https://images.unsplash.com/photo-1558326567-98ae2405596b?auto=format&fit=crop&w=800&q=80', 'ميني تورتة': 'https://images.unsplash.com/photo-1562777717-b6aff3dacd65?auto=format&fit=crop&w=800&q=80', 'ورد': 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=800&q=80' };
    return m[cat] || m['جاتوهات'];
}

function uCake(k, v) { state.cakeBuilder[k] = v; renderMainDisplay(); }
function adjP(d) {
    let n = Number(state.cakeBuilder.ps) + Number(d); if (n < 4) n = 4;
    state.cakeBuilder.ps = n; renderMainDisplay();
}

function renderCartList() {
    const container = document.getElementById('cart-list'); const crossSellArea = document.getElementById('cross-sell-area'); const totalDisplay = document.getElementById('cart-total-display');
    if (!container) return;
    if (state.cart.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center py-12 px-4 text-center"><i data-lucide="shopping-bag" class="w-10 h-10 mb-4" style="color: hsl(var(--brand-hue), 80%, 75%);"></i><h3 class="font-bold">سلة حلويات بوسي في انتظارك 🌸</h3><button onclick="toggleCart(false)" class="mt-6 text-white px-8 py-3 rounded-2xl font-bold brand-gradient btn-premium-action">يلا نتسوق</button></div>`;
        if (crossSellArea) crossSellArea.innerHTML = ''; if (totalDisplay) totalDisplay.innerText = "0 ج.م"; if (window.lucide) lucide.createIcons(); return;
    }
    let total = 0;
    container.innerHTML = state.cart.map(item => {
        const identifier = item.cartItemId || item.id; const q = Number(item.quantity); const p = Number(item.price); total += (p * q);
        const renderImg = optimizeCloudinaryUrl((item.images && item.images.length > 0) ? item.images[0] : (item.img || getImgFallback(item.category)));
        return `<div class="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl mb-3 shadow-sm"><div class="w-16 h-16 rounded-xl overflow-hidden"><img src="${renderImg}" class="w-full h-full object-cover"></div><div class="flex-1 text-right"><h4 class="font-bold text-[13px]">${escapeHTML(item.name)}</h4><p class="font-bold" style="color: hsl(var(--brand-hue), 70%, 50%);">${p} ج.م</p></div><div class="flex flex-col items-end gap-2"><button onclick="modQ('${identifier}', 'remove')" class="p-1 text-gray-300 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button><div class="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border"><button onclick="modQ('${identifier}', -1)"><i data-lucide="minus" class="w-3 h-3"></i></button><span>${q}</span><button onclick="modQ('${identifier}', 1)"><i data-lucide="plus" class="w-3 h-3"></i></button></div></div></div>`;
    }).join('');
    if (totalDisplay) totalDisplay.innerText = total + " ج.م";
    if (crossSellArea) crossSellArea.innerHTML = renderCartCrossSell();
    if (window.lucide) lucide.createIcons();
}

function renderCartCrossSell() {
    const cartIds = state.cart.map(i => String(i.id)); 
    let available = catalog.filter(p => p && !cartIds.includes(String(p.id)) && p.inStock !== false);
    if (available.length === 0) return '';
    let suggestions = available.slice(0, 3);
    return `<div class="mt-8 animate-fade-in border-t border-dashed pt-6" style="border-color: hsl(var(--brand-hue), 80%, 85%);"><p class="text-sm font-black text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="sparkles"></i> كملي اللحظة الحلوة بمنتجات تليق بيكي</p><div class="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-slider">${suggestions.map(p => {
        const img = optimizeCloudinaryUrl((p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category)));
        return `<div class="shrink-0 w-[260px] snap-slide bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col group"><div class="relative w-full h-36 mb-4 rounded-xl overflow-hidden bg-gray-50"><img src="${img}" class="w-full h-full object-cover"></div><div class="flex-1 flex flex-col"><h5 class="text-[14px] font-bold mb-1">${escapeHTML(p.name)}</h5><div class="flex items-center justify-between mt-auto"><span class="font-black" style="color: hsl(var(--brand-hue), 70%, 40%);">${p.price} ج.م</span><button onclick="addWithQtyContext(this, '${p.id}')" class="px-4 py-2 border rounded-xl text-[11px] font-bold dyn-hover-bg transition-colors" style="border-color: hsl(var(--brand-hue), 80%, 85%); color: hsl(var(--brand-hue), 70%, 50%);">إضافة</button></div></div></div>`;
    }).join('')}</div></div>`;
}

function modQ(cartId, d) {
    const safeCartId = String(cartId); 
    const it = state.cart.find(x => String(x.cartItemId) === safeCartId || String(x.id) === safeCartId);
    
    if (it) { 
        if (d === 'remove') {
            state.cart = state.cart.filter(x => String(x.cartItemId) !== safeCartId && String(x.id) !== safeCartId);
        } else {
            it.quantity = Number(it.quantity) + Number(d); 
            if (it.quantity < 1) {
                it.quantity = 1; 
            }
        }
    }
    
    saveCartToStorage(); 
    syncCartUI(); 
    calculateCartTotal();
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
    else { sd.classList.add('-translate-x-full'); document.body.style.overflow = 'auto'; MemoryManager.flush(); }
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
    
    let outOfStockItems = [];
    for (let item of state.cart) {
        if (item.isCustom) continue;
        const freshProd = catalogMap.get(String(item.id));
        if (freshProd && freshProd.inStock === false) outOfStockItems.push(item.name);
    }
    
    if (outOfStockItems.length > 0) {
        showSystemToast(`عذراً يا فندم، المنتجات التالية نفدت للتو: ${outOfStockItems.join('، ')}. يرجى حذفها من السلة للاستمرار.`, 'error');
        return;
    }

    const cName = document.getElementById('cust-name').value.trim(); 
    const cPhone = document.getElementById('cust-phone').value.trim();
    const cArea = document.getElementById('cust-area') ? document.getElementById('cust-area').options[document.getElementById('cust-area').selectedIndex].text : '';
    const cAddress = document.getElementById('cust-address') ? document.getElementById('cust-address').value.trim() : '';
    const cNotes = document.getElementById('cust-notes') ? document.getElementById('cust-notes').value.trim() : '';
    const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
    
    if (!cName || !cPhone) { showSystemToast('يا فندم يرجى كتابة الاسم والموبايل عشان نقدر نوصلك 🌸', 'error'); return; }
    if (deliveryMethod === 'delivery' && (!document.getElementById('cust-area') || !document.getElementById('cust-area').value)) { showSystemToast('يا فندم يرجى اختيار منطقة التوصيل 🛵', 'error'); return; }
    
    const btn = document.querySelector('button[onclick="submitOrder()"]');
    let originalBtnHtml = '';
    if(btn) {
        originalBtnHtml = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> جاري إرسال الطلب...`; 
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
    
    const finalTotal = subtotal + state.currentShippingFee;

    const orderData = {
        id: orderId,
        name: cName,
        phone: cPhone,
        area: deliveryMethod === 'pickup' ? 'استلام من الفرع' : cArea,
        address: cAddress,
        notes: cNotes,
        itemsArray: state.cart,
        subtotal: subtotal,
        shippingFee: state.currentShippingFee,
        total: finalTotal,
        status: 'pending',
        timestamp: Date.now(),
        date: new Date().toLocaleString('ar-EG')
    };

    let m = `*طلب جديد من حلويات بوسي* 👑\n*رقم الطلب:* ${orderId}\n\n👤 الاسم: ${cName}\n📞 الموبايل: ${cPhone}\n`;
    if(deliveryMethod === 'pickup') m += `🛵 الطريقة: استلام من الفرع\n`;
    else m += `🛵 التوصيل: ${cArea} - ${cAddress}\n`;
    
    m += `\n*تفاصيل الأوردر:*\n`;
    state.cart.forEach((i, idx) => m += `▪️ *${i.name}* (x${i.quantity}) = ${i.price * i.quantity} ج.م\n`);
    m += `\n*الإجمالي المطلوب:* ${finalTotal} ج.م`;
    
    if(cNotes) m += `\n\n*ملاحظات إضافية:* ${cNotes}`;

    const storePhone = siteSettings.footerPhone || '201097238441';
    let cleanPhone = storePhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(m)}`, '_blank');
    
    try {
        if(navigator.onLine && typeof db !== 'undefined') {
            db.collection('orders').doc(String(orderId)).set(orderData).catch(e => {
                ClientStorageEngine.queueOrder(orderData);
            });
        } else {
            throw new Error("Offline or Firebase Unavailable");
        }
    } catch(e) {
        ClientStorageEngine.queueOrder(orderData);
    }

    state.cart = []; clearCartStorage(); syncCartUI(); toggleCart(false); renderMainDisplay();
    showSystemToast('تم تسجيل الطلب وإرساله لمركز القيادة بنجاح! 🎂', 'success');

    if(btn) {
        btn.innerHTML = originalBtnHtml; 
        btn.disabled = false;
        if(window.lucide) lucide.createIcons();
    }
    
    MemoryManager.flush();
}

async function syncOfflineOrders() {
    if (!navigator.onLine || typeof db === 'undefined') return;
    try {
        const pendingOrders = await ClientStorageEngine.getQueuedOrders();
        if (pendingOrders.length === 0) return;
        for (let order of pendingOrders) {
            try {
                await db.collection('orders').doc(String(order.id)).set(order);
                await ClientStorageEngine.removeQueuedOrder(order.id);
            } catch (e) { console.warn(`Failed to sync queued order ${order.id}`); }
        }
        console.log("BoseSweets: Offline orders synced successfully 🚀");
    } catch (e) {}
}

window.addEventListener('online', syncOfflineOrders);

function showInfo(t) {
    const d = { about: { t: 'من نحن', b: siteSettings.footerQuote || 'براند حلويات بوسي الأول بالفرافرة.' }, privacy: { t: 'سياسة الخصوصية والأمان', b: 'تلتزم إدارة حلويات بوسي بالسرية التامة لبيانات عملائنا.' }, refund: { t: 'سياسة الاسترجاع والتعديل', b: 'نسعى دائماً لرضاكم التام في حلويات بوسي 👑.' } };
    if(!d[t]) return;
    document.getElementById('info-title').innerText = d[t].t; document.getElementById('info-body').innerText = d[t].b;
    const m = document.getElementById('info-modal'); m.classList.remove('hidden'); m.classList.add('flex'); if(window.lucide) lucide.createIcons();
}

function closeInfo() { const m = document.getElementById('info-modal'); m.classList.add('hidden'); m.classList.remove('flex'); MemoryManager.flush(); }

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
    MemoryManager.set('failsafe_loader', () => {
        const loader = document.getElementById('global-loader');
        if (loader && loader.style.display !== 'none') {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            MemoryManager.set('failsafe_loader_hide', () => loader.style.display = 'none', 500);
            console.warn("BoseSweets Failsafe: Loader timeout triggered to protect UX.");
        }
    }, 8000);

    initApp();
    autoBindAdminAccess();
    syncOfflineOrders();
});