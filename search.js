// محرك البحث السيادي لمنصة حلويات بوسي (إصدار البحث المتسامح والذكي واللحظي)
import { MemoryManager, escapeHTML, optimizeCloudinaryUrl } from './utils.js';
import { getImgFallback } from './ui.js';
import { catalog } from './state.js';

export const LiveSearchEngine = {
    index: new Map(),
    // 👑 إضافة نظام الذاكرة المؤقتة لضمان استجابة لحظية للكلمات المكررة
    cache: new Map(),
    
    // توحيد الحروف العربية وإزالة التشكيل لضمان دقة البحث
    normalizeArabic(text) {
        if (!text) return '';
        return String(text)
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ي')
            .replace(/ـ/g, '')
            .replace(/[ًٌٍَُِّْ]/g, ''); 
    },

    // خوارزمية هندسية لقياس المسافة بين الكلمات واكتشاف الأخطاء الإملائية
    calculateDistance(a, b) {
        if(a.length === 0) return b.length;
        if(b.length === 0) return a.length;
        const matrix = [];
        for(let i = 0; i <= b.length; i++) matrix[i] = [i];
        for(let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for(let i = 1; i <= b.length; i++){
            for(let j = 1; j <= a.length; j++){
                if(b.charAt(i-1) === a.charAt(j-1)){
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
                }
            }
        }
        return matrix[b.length][a.length];
    },

    // بناء كشاف البحث مرة واحدة وتجهيز الكلمات لتقليل استهلاك معالج المتصفح
    buildIndex() {
        this.index.clear();
        this.cache.clear(); // تفريغ الذاكرة المؤقتة عند تحديث البيانات لضمان دقة المخزون

        if (!catalog || catalog.length === 0) return;
        
        catalog.forEach(item => {
            if (item.isActive === false) return; 
            const normalizedName = this.normalizeArabic(item.name || '').toLowerCase();
            const normalizedDesc = this.normalizeArabic(item.desc || '').toLowerCase();
            const normalizedCat = this.normalizeArabic(item.category || '').toLowerCase();
            
            const searchString = `${normalizedName} ${normalizedDesc} ${normalizedCat}`;
            // القرار المهني: تقسيم الكلمات هنا وتخزينها كـ Array يوفر وقتاً كبيراً أثناء عملية البحث
            const searchWords = searchString.split(/\s+/).filter(w => w.length > 0);

            this.index.set(item.id, {
                ref: item,
                searchString: searchString,
                searchWords: searchWords
            });
        });
    },

    search(query) {
        try {
            if (!query || query.trim().length < 2) return [];
            if (this.index.size === 0 || this.index.size !== catalog.filter(i => i.isActive !== false).length) {
                this.buildIndex();
            }
            
            const normalizedQuery = this.normalizeArabic(query).toLowerCase();
            
            // فحص الذاكرة المؤقتة (Cache) لإرجاع النتائج فورا إذا تم البحث عنها مسبقاً
            if (this.cache.has(normalizedQuery)) {
                return this.cache.get(normalizedQuery);
            }

            const queryTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
            let results = [];
            
            this.index.forEach((data, id) => {
                let score = 0;
                let matchesAll = true;

                for (const term of queryTerms) {
                    if (data.searchString.includes(term)) {
                        score += 10; 
                    } else {
                        let termMatched = false;
                        // الاعتماد على الكلمات المقسمة مسبقاً بدلاً من تقسيمها مع كل دورة
                        for (const word of data.searchWords) {
                            if (Math.abs(word.length - term.length) <= 2) {
                                const distance = this.calculateDistance(term, word);
                                if (distance <= 1) { 
                                    score += 5;
                                    termMatched = true;
                                    break;
                                }
                            }
                        }
                        if (!termMatched) {
                            matchesAll = false;
                            break;
                        }
                    }
                }

                if (matchesAll && score > 0) {
                    results.push({ item: data.ref, score: score });
                }
            });

            const finalResults = results.sort((a, b) => b.score - a.score).map(r => r.item);
            
            // تخزين النتيجة في الذاكرة المؤقتة لعمليات البحث القادمة
            this.cache.set(normalizedQuery, finalResults);
            
            return finalResults;
            
        } catch (error) {
            console.error("حلويات بوسي - خطأ آمن في محرك البحث:", error);
            return []; // إرجاع مصفوفة فارغة لضمان عدم توقف الواجهة
        }
    }
};

export function performLiveSearchDebounced() {
    MemoryManager.set('liveSearchTyping', () => {
        performLiveSearch();
    }, 400);
}

export function toggleLiveSearch() {
    try {
        const overlay = document.getElementById('search-overlay');
        const input = document.getElementById('main-search-input');
        if (!overlay) return;

        if (overlay.classList.contains('hidden')) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            setTimeout(() => { if(input) input.focus(); }, 100);
            document.body.style.overflow = 'hidden';
        } else {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
            document.body.style.overflow = '';
        }
    } catch (e) {
        console.warn("حلويات بوسي: تعذر تبديل حالة نافذة البحث.");
    }
}

export function performLiveSearch() {
    try {
        const input = document.getElementById('main-search-input');
        const resultsContainer = document.getElementById('search-results-container');
        if (!input || !resultsContainer) return;

        const query = input.value.trim();
        if (query.length < 2) {
            resultsContainer.innerHTML = '<div class="text-center text-[#1a1a1a] opacity-50 text-sm mt-10 font-bold">يرجى كتابة حرفين على الأقل للبحث...</div>';
            return;
        }

        const results = LiveSearchEngine.search(query);
        
        if (results.length === 0) {
            // محظور المساس بالهيكل الذي يراه العميل، تم الإبقاء عليه كما هو تماماً
            resultsContainer.innerHTML = `
                <div class="text-center mt-10">
                    <i data-lucide="search-x" class="w-12 h-12 text-[#ff91a4] opacity-50 mx-auto mb-4"></i>
                    <div class="text-[#1a1a1a] text-sm font-bold">لم نتمكن من العثور على "${escapeHTML(query)}"</div>
                    <div class="text-xs text-[#1a1a1a] opacity-60 mt-2 font-semibold">جرب البحث بكلمات أخرى أو تصفح الأقسام.</div>
                </div>`;
            if(window.lucide) lucide.createIcons();
            return;
        }

        // محظور المساس بالهيكل الذي يراه العميل، تم الإبقاء عليه كما هو تماماً
        resultsContainer.innerHTML = results.map(p => {
            const imgUrl = p.img ? optimizeCloudinaryUrl(p.img, 150) : (p.images && p.images.length > 0 ? optimizeCloudinaryUrl(p.images[0], 150) : getImgFallback(p.category));
            const isOutOfStock = p.inStock === false;
            
            return `
            <div class="flex items-center gap-4 p-3 bg-[#ffffff] rounded-2xl border border-[#ff91a4]/20 shadow-sm active:scale-[0.98] transition-transform cursor-pointer" 
                 onclick="toggleLiveSearch(); window.setCategory('${p.category}'); setTimeout(() => { const el = document.getElementById('product-card-${p.id}'); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight-target'); window.MemoryManager.set('search_hl_${p.id}', ()=>el.classList.remove('highlight-target'), 2500);} }, 500);">
                <img src="${imgUrl}" class="w-16 h-16 object-cover rounded-xl shadow-sm border-2 border-[#ff91a4]/30 ${isOutOfStock ? 'grayscale' : ''}" loading="lazy">
                <div class="flex-1">
                    <h4 class="font-bold text-sm text-[#1a1a1a]">${escapeHTML(p.name)}</h4>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] bg-[#ffffff] border border-[#ff91a4] text-[#ff91a4] px-2 py-0.5 rounded-md font-bold">${p.category}</span>
                        <span class="font-black text-sm text-[#ff91a4]">${Number(p.price) > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span>
                    </div>
                </div>
                <div class="px-2">
                    ${isOutOfStock ? 
                        `<span class="text-xs text-[#1a1a1a] font-bold bg-[#ffffff] px-2 py-1 rounded-lg border-2 border-[#1a1a1a]">نفدت</span>` : 
                        `<button class="w-10 h-10 rounded-xl bg-[#ff91a4] text-[#ffffff] flex items-center justify-center shadow-md border-2 border-[#ff91a4] pointer-events-none">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>`
                    }
                </div>
            </div>`;
        }).join('');
        
        if(window.lucide) lucide.createIcons();
    } catch (e) {
        console.error("حلويات بوسي: خطأ أثناء عرض نتائج البحث", e);
    }
}

// التوافقية المطلقة: إتاحة الدوال للاستدعاء الخارجي بضمان وأمان
if (typeof window !== 'undefined') {
    window.toggleLiveSearch = toggleLiveSearch;
    window.performLiveSearch = performLiveSearch;
    window.performLiveSearchDebounced = performLiveSearchDebounced;
    window.LiveSearchEngine = LiveSearchEngine;
}