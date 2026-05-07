// محرك البحث السيادي لمنصة حلويات بوسي
import { MemoryManager, escapeHTML, optimizeCloudinaryUrl, getImgFallback } from './utils.js';

export const LiveSearchEngine = {
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

export function performLiveSearchDebounced(query) {
    if (liveSearchTimeout) clearTimeout(liveSearchTimeout);
    liveSearchTimeout = setTimeout(() => { performLiveSearch(query); }, 500); 
}

export function toggleLiveSearch(show) {
    const overlay = document.getElementById('live-search-overlay'); const input = document.getElementById('live-search-input'); const results = document.getElementById('live-search-results');
    if (show) { overlay.classList.remove('hidden'); MemoryManager.set('search_show', () => { overlay.classList.add('opacity-100'); input.focus(); }, 10); input.value = ''; results.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-white/50 font-bold mt-10"><i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30"></i><p>ابدأ البحث في قائمة حلويات بوسي...</p></div>`; if(window.lucide) lucide.createIcons(); } 
    else { overlay.classList.remove('opacity-100'); MemoryManager.set('search_hide', () => overlay.classList.add('hidden'), 300); MemoryManager.flush(); }
}

export function performLiveSearch(query) {
    const resultsContainer = document.getElementById('live-search-results'); 
    const q = query.trim().toLowerCase();
    
    if (!q) { resultsContainer.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-white/50 font-bold mt-10"><i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30"></i><p>ابدأ البحث في قائمة حلويات بوسي...</p></div>`; if(window.lucide) lucide.createIcons(); return; }
    
    const matches = LiveSearchEngine.search(q);
    
    if (matches.length === 0) { resultsContainer.innerHTML = `<div class="flex flex-col items-center justify-center text-white/70 font-bold mt-10 bg-white/5 p-8 rounded-2xl"><i data-lucide="search-x" class="w-12 h-12 mb-4" style="color: #ff3377;"></i><p>لم نجد تطابق للبحث عن "${escapeHTML(query)}"</p><p class="text-xs opacity-70 mt-2">جرب البحث بكلمة مختلفة مثل "تورتة"، "نوتيلا"، "لوتس"</p></div>`; if(window.lucide) lucide.createIcons(); return; }
    resultsContainer.innerHTML = matches.map(p => {
        const imgUrl = optimizeCloudinaryUrl((p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category))); 
        const isOutOfStock = p.inStock === false;
        return `<div class="flex items-center gap-4 p-3 rounded-2xl bg-white shadow-sm border transition-all hover:shadow-md cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}" style="border-color: rgba(255, 51, 119, 0.2);" onclick="toggleLiveSearch(false); window.setCategory('${p.category}'); window.MemoryManager.set('search_scroll_${p.id}', ()=> { const el = document.getElementById('product-card-${p.id}'); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight-target'); window.MemoryManager.set('search_hl_${p.id}', ()=>el.classList.remove('highlight-target'), 2500);} }, 500);"><img src="${imgUrl}" class="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100 ${isOutOfStock ? 'grayscale' : ''}"><div class="flex-1"><h4 class="font-bold text-sm text-gray-800">${escapeHTML(p.name)}</h4><div class="flex items-center gap-2 mt-1"><span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">${p.category}</span><span class="font-bold text-sm text-[#ff3377]">${Number(p.price) > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span></div></div><div class="px-2">${isOutOfStock ? `<span class="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100">نفدت</span>` : `<button class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm bg-pink-50 text-[#ff3377]"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>`}</div></div>`;
    }).join('');
    if(window.lucide) lucide.createIcons();
}
