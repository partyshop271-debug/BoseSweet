/**
 * 👑 محرك البحث السيادي لمنصة حلويات بوسي (V26.0 - Sovereign Iron-Clad Edition)
 * الإدارة المرجعية: حلويات بوسي
 * إصدار البحث المتسامح والذكي (Fuzzy Matching) ذو الاستجابة اللحظية المتقدمة.
 * * الترقيات المطبقة:
 * - معالجة التضارب البرمجي ودمج الكود في هيكل تشغيلي واحد لضمان استقرار المنصة.
 * - نظام ذاكرة مؤقتة لحظي للكلمات المكررة لتقليل استهلاك المعالج (خاصة للموبايل).
 * - خوارزمية ذكية لاكتشاف الأخطاء الإملائية وتصحيحها بناءً على المسافة الهندسية بين الكلمات.
 * - تثبيت الهيكل البصري بنسبة 100% كما صممته الإدارة المرجعية دون أي تبسيط أو تعديل.
 * 🛡️ التحديث الأمني الجديد: تم زرع مستشعر BoseMonitor لمراقبة دقة النتائج واستقرار المحرك.
 */

import { MemoryManager, escapeHTML, optimizeCloudinaryUrl } from './utils.js';
import { getImgFallback } from './ui.js';
import { catalog } from './state.js';

export const LiveSearchEngine = {
    index: new Map(),
    // إضافة نظام الذاكرة المؤقتة لضمان استجابة لحظية للكلمات المكررة
    cache: new Map(),
    
    // توحيد الحروف العربية وإزالة التشكيل لضمان دقة البحث المطلقة
    normalizeArabic(text) {
        try {
            if (!text) return '';
            return String(text)
                .replace(/[أإآ]/g, 'ا')
                .replace(/ة/g, 'ه')
                .replace(/ى/g, 'ي')
                .replace(/[ًٌٍَُِّ]/g, '') // إزالة التشكيل
                .trim()
                .toLowerCase();
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'search.js', null, null, 'LiveSearchEngine.normalizeArabic');
            return text || '';
        }
    },

    // خوارزمية ذكية لحساب التشابه بين الكلمات (تصحيح تلقائي)
    levenshteinDistance(s1, s2) {
        try {
            if (s1.length < s2.length) [s1, s2] = [s2, s1];
            if (s2.length === 0) return s1.length;

            let prevRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
            for (let i = 0; i < s1.length; i++) {
                let currRow = [i + 1];
                for (let j = 0; j < s2.length; j++) {
                    let insertions = prevRow[j + 1] + 1;
                    let deletions = currRow[j] + 1;
                    let substitutions = prevRow[j] + (s1[i] !== s2[j] ? 1 : 0);
                    currRow.push(Math.min(insertions, deletions, substitutions));
                }
                prevRow = currRow;
            }
            return prevRow[s2.length];
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'search.js', null, null, 'LiveSearchEngine.levenshteinDistance');
            return 100; // قيمة أمان عالية لتعطيل النتيجة التالفة
        }
    },

    // بناء الفهرس السيادي للبيانات (Indexing) لسرعة البرق في الاستجابة
    build(catalogData) {
        try {
            this.index.clear();
            this.cache.clear();
            
            if (!Array.isArray(catalogData)) return;

            catalogData.forEach(item => {
                if (item.isActive === false) return; // استبعاد الأصناف المعطلة بقرار إداري
                
                const combinedText = `${item.name} ${item.category} ${item.desc || ''} ${item.subCategory || ''}`;
                const tokens = combinedText.split(/\s+/).filter(t => t.length > 1);
                
                tokens.forEach(token => {
                    const normalized = this.normalizeArabic(token);
                    if (!this.index.has(normalized)) this.index.set(normalized, new Set());
                    this.index.get(normalized).add(item.id);
                });
            });
            console.log(`BoseSweets Search: تم بناء فهرس سيادي لعدد ${catalogData.length} صنف.`);
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'search.js', null, null, 'LiveSearchEngine.build');
        }
    },

    // محرك البحث المركزي المعتمد
    search(query) {
        try {
            const normalizedQuery = this.normalizeArabic(query);
            if (!normalizedQuery || normalizedQuery.length < 2) return [];

            // التحقق من الذاكرة المؤقتة (Cache Hit) لسرعة الأداء
            if (this.cache.has(normalizedQuery)) return this.cache.get(normalizedQuery);

            const queryTokens = normalizedQuery.split(/\s+/);
            const scores = new Map();

            // فحص الفهرس المباشر
            this.index.forEach((ids, token) => {
                queryTokens.forEach(qToken => {
                    // مطابقة مباشرة أو جزئية
                    if (token.includes(qToken) || qToken.includes(token)) {
                        ids.forEach(id => {
                            const currentScore = scores.get(id) || 0;
                            scores.set(id, currentScore + (token === qToken ? 10 : 5));
                        });
                    } else {
                        // مطابقة ذكية (Fuzzy) للأخطاء الإملائية
                        const distance = this.levenshteinDistance(token, qToken);
                        if (distance <= 1) { // سماحية حرف واحد فقط
                            ids.forEach(id => {
                                const currentScore = scores.get(id) || 0;
                                scores.set(id, currentScore + 3);
                            });
                        }
                    }
                });
            });

            // تحويل النتائج وترتيبها حسب قوة المطابقة (Relevance)
            const results = Array.from(scores.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([id]) => catalog.find(p => String(p.id) === String(id)))
                .filter(Boolean);

            // حفظ في الذاكرة المؤقتة (Cache Set)
            this.cache.set(normalizedQuery, results);
            if (this.cache.size > 50) { // تنظيف تلقائي للذاكرة
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            return results;
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'search.js', null, null, 'LiveSearchEngine.search');
            return [];
        }
    }
};

/**
 * 👑 دالة التحكم في ظهور واجهة البحث
 */
export function toggleLiveSearch(forceState) {
    try {
        const overlay = document.getElementById('search-overlay');
        const input = document.getElementById('main-search-input');
        if (!overlay) return;

        const isHidden = overlay.classList.contains('hidden');
        const shouldShow = forceState !== undefined ? forceState : isHidden;

        if (shouldShow) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            document.body.style.overflow = 'hidden'; // تجميد التمرير في الخلفية لراحة العميل
            if (input) {
                input.value = '';
                setTimeout(() => input.focus(), 100);
            }
            const container = document.getElementById('search-results-container');
            if (container) container.innerHTML = `<div class="text-center text-[#1a1a1a] opacity-60 text-sm font-bold mt-10 animate-pulse">يسرنا مساعدتكم في العثور على طلبكم...</div>`;
        } else {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
            document.body.style.overflow = '';
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'search.js', null, null, 'toggleLiveSearch');
    }
}

/**
 * 👑 تنفيذ البحث اللحظي السيادي
 */
export function performLiveSearch() {
    try {
        const input = document.getElementById('main-search-input');
        const container = document.getElementById('search-results-container');
        if (!input || !container) return;

        const query = input.value.trim();
        
        if (query.length < 2) {
            container.innerHTML = `<div class="text-center text-[#1a1a1a] opacity-60 text-sm font-bold mt-10">يرجى كتابة حرفين على الأقل للبحث بقرار مهني...</div>`;
            return;
        }

        const results = LiveSearchEngine.search(query);
        renderSearchResults(results);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'search.js', null, null, 'performLiveSearch');
    }
}

// أداة التحكم في توقيت البحث (Debouncer) لمنع إجهاد المعالج
let searchDebounceTimer;
export function performLiveSearchDebounced() {
    try {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => performLiveSearch(), 300);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'search.js', null, null, 'performLiveSearchDebounced');
    }
}

/**
 * 👑 رندر نتائج البحث بهيكل حلويات بوسي الأصلي
 */
export function renderSearchResults(results) {
    try {
        const container = document.getElementById('search-results-container');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 opacity-60">
                    <i data-lucide="search-x" class="w-16 h-16 mb-4 text-[#ff91a4]"></i>
                    <p class="font-black text-lg text-[#1a1a1a]">نعتذر لحضرتك، لا توجد نتائج مطابقة</p>
                    <p class="text-sm font-bold mt-2">جرب حضرتك البحث بكلمات أبسط (مثل: نوتيلا، تورتة، سينابون)</p>
                </div>`;
            if(window.lucide) lucide.createIcons();
            return;
        }

        container.innerHTML = results.map(p => {
            const isOutOfStock = p.inStock === false || p.isActive === false;
            // استخدام رابط Cloudinary مع التحسين السيادي
            const imgSrc = p.img ? (typeof optimizeCloudinaryUrl === 'function' ? optimizeCloudinaryUrl(p.img, 150) : p.img) : '';
            const fallback = typeof getImgFallback === 'function' ? getImgFallback() : '';

            return `
            <div onclick="if(typeof window.showProductDetails === 'function') { window.showProductDetails('${p.id}'); window.toggleLiveSearch(false); }" 
                 class="flex items-center gap-4 bg-[#ffffff] p-4 rounded-[1.8rem] border-2 border-[#ff91a4]/10 hover:border-[#ff91a4] transition-all cursor-pointer shadow-sm active:scale-[0.98] group">
                <div class="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#ff91a4]/5 shrink-0">
                    <img src="${imgSrc}" onerror="this.src='${fallback}'" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-50' : ''}" alt="${p.name}">
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-black text-[#1a1a1a] text-base truncate mb-1">${escapeHTML(p.name)}</h4>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] bg-[#ffffff] border border-[#ff91a4] text-[#ff91a4] px-2 py-0.5 rounded-md font-bold">${p.category}</span>
                        <span class="font-black text-sm text-[#ff91a4]">${Number(p.price) > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span>
                    </div>
                </div>
                <div class="px-2">
                    ${isOutOfStock ? 
                        `<span class="text-xs text-[#1a1a1a] font-bold bg-[#ffffff] px-2 py-1 rounded-lg border-2 border-[#ff91a4]">نفدت</span>` : 
                        `<button class="w-10 h-10 rounded-xl bg-[#ff91a4] text-[#ffffff] flex items-center justify-center shadow-md border-2 border-[#ff91a4] pointer-events-none">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>`
                    }
                </div>
            </div>`;
        }).join('');
        
        if(window.lucide) lucide.createIcons();
    } catch (e) {
        if(window.BoseMonitor) window.BoseMonitor.report(e, 'search.js', null, null, 'renderSearchResults');
        console.error("حلويات بوسي: خطأ تم تجاوزه أثناء عرض نتائج البحث", e);
    }
}

// التوافقية المطلقة: إتاحة الدوال للاستدعاء الخارجي بضمان وأمان
try {
    if (typeof window !== 'undefined') {
        window.LiveSearchEngine = LiveSearchEngine;
        window.toggleLiveSearch = toggleLiveSearch;
        window.performLiveSearch = performLiveSearch;
        window.performLiveSearchDebounced = performLiveSearchDebounced;
        window.renderSearchResults = renderSearchResults;

        // ربط مستمعات الأحداث فور تحميل الملف لضمان الجاهزية اللحظية
        document.addEventListener('DOMContentLoaded', () => {
            const input = document.getElementById('main-search-input');
            if (input) input.addEventListener('input', window.performLiveSearchDebounced);
            
            const openBtn = document.getElementById('open-search-btn');
            if (openBtn) openBtn.onclick = () => window.toggleLiveSearch(true);
            
            const closeBtn = document.getElementById('close-search-btn');
            if (closeBtn) closeBtn.onclick = () => window.toggleLiveSearch(false);
        });
    }
} catch (error) {
    if(window.BoseMonitor) window.BoseMonitor.report(error, 'search.js', null, null, 'Global Binding & Initialization');
}