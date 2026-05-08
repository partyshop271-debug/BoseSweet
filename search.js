// محرك البحث السيادي لمنصة حلويات بوسي (إصدار البحث المتسامح والذكي)
import { MemoryManager, escapeHTML, optimizeCloudinaryUrl } from './utils.js';
import { getImgFallback } from './ui.js';

export const LiveSearchEngine = {
    index: new Map(),
    
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
            let score = 0;
            let isMatch = true;
            
            const itemWords = item.tokens.split(/\s+/);
            
            for (let qt of qTokens) {
                // التطابق التام يمنح المنتج الأولوية القصوى
                if (item.tokens.includes(qt)) {
                    score += 10; 
                    continue;
                }
                
                let typoMatch = false;
                let bestDist = 99;
                
                for(let w of itemWords) {
                    // تفعيل التسامح الإملائي للكلمات المكونة من 3 حروف فأكثر
                    if(qt.length >= 3 && Math.abs(w.length - qt.length) <= 2) {
                        const dist = this.calculateDistance(qt, w);
                        // السماح بخطأين مطبعيين كحد أقصى للكلمة الواحدة
                        if(dist <= 2) { 
                            typoMatch = true;
                            if(dist < bestDist) bestDist = dist;
                        }
                    }
                }
                
                if(typoMatch) {
                    score += (5 - bestDist); // تقييم بناءً على دقة الكلمة المكتوبة
                } else {
                    isMatch = false;
                    break;
                }
            }
            
            if (isMatch) {
                results.push({ item: item.data, score: score });
            }
        }
        
        // ترتيب النتائج التنازلي لضمان ظهور التطابق الدقيق أولاً
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, 12).map(r => r.item); 
    }
};

let liveSearchTimeout = null;

export function performLiveSearchDebounced(query) {
    if (liveSearchTimeout) clearTimeout(liveSearchTimeout);
    liveSearchTimeout = setTimeout(() => { performLiveSearch(query); }, 500); 
}

export function toggleLiveSearch(show) {
    const overlay = document.getElementById('live-search-overlay'); 
    const input = document.getElementById('live-search-input'); 
    const results = document.getElementById('live-search-results');
    
    if (show) { 
        overlay.classList.remove('hidden'); 
        MemoryManager.set('search_show', () => { 
            overlay.classList.add('opacity-100'); 
            input.focus(); 
        }, 10); 
        input.value = ''; 
        results.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-[#1a1a1a]/50 font-bold mt-10"><i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30 text-[#ff91a4]"></i><p>ابدأ البحث في قائمة حلويات بوسي...</p></div>`; 
        if(window.lucide) lucide.createIcons(); 
    } else { 
        overlay.classList.remove('opacity-100'); 
        MemoryManager.set('search_hide', () => overlay.classList.add('hidden'), 300); 
        MemoryManager.flush(); 
    }
}

export function performLiveSearch(query) {
    const resultsContainer = document.getElementById('live-search-results'); 
    const q = query.trim().toLowerCase();
    
    if (!q) { 
        resultsContainer.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-[#1a1a1a]/50 font-bold mt-10"><i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30 text-[#ff91a4]"></i><p>ابدأ البحث في قائمة حلويات بوسي...</p></div>`; 
        if(window.lucide) lucide.createIcons(); 
        return; 
    }
    
    const matches = LiveSearchEngine.search(q);
    
    if (matches.length === 0) { 
        resultsContainer.innerHTML = `<div class="flex flex-col items-center justify-center text-[#1a1a1a]/70 font-bold mt-10 bg-[#ffffff] p-8 rounded-2xl border-2 border-[#ff91a4] shadow-sm"><i data-lucide="search-x" class="w-12 h-12 mb-4 text-[#ff91a4]"></i><p>لم نجد تطابق للبحث عن "${escapeHTML(query)}"</p><p class="text-xs opacity-70 mt-2 text-[#1a1a1a]">جرب البحث بكلمة مختلفة مثل "تورتة"، "نوتيلا"، "لوتس"</p></div>`; 
        if(window.lucide) lucide.createIcons(); 
        return; 
    }
    
    resultsContainer.innerHTML = matches.map(p => {
        const imgUrl = optimizeCloudinaryUrl((p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category))); 
        const isOutOfStock = p.inStock === false;
        
        return `
        <div class="flex items-center gap-4 p-3 rounded-2xl bg-[#ffffff] shadow-sm border-2 border-[#ff91a4]/20 transition-all hover:border-[#ff91a4] hover:shadow-md cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}" onclick="toggleLiveSearch(false); window.setCategory('${p.category}'); window.MemoryManager.set('search_scroll_${p.id}', ()=> { const el = document.getElementById('product-card-${p.id}'); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight-target'); window.MemoryManager.set('search_hl_${p.id}', ()=>el.classList.remove('highlight-target'), 2500);} }, 500);">
            <img src="${imgUrl}" class="w-16 h-16 object-cover rounded-xl shadow-sm border-2 border-[#ff91a4]/30 ${isOutOfStock ? 'grayscale' : ''}">
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
                    `<button class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm bg-[#ffffff] border-2 border-[#ff91a4] text-[#ff91a4] hover:bg-[#ff91a4] hover:text-[#ffffff]"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>`
                }
            </div>
        </div>`;
    }).join('');
    
    if(window.lucide) lucide.createIcons();
}
