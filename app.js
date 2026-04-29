function renderFilteredProducts(cat) {
    currentCategory = cat;
    const categories = [...new Set(catalog.map(p => p.category))].filter(Boolean);
    renderCategoriesNav(categories); 
    
    const container = document.getElementById('display-container');
    const filtered = catalog.filter(p => p.category === cat);
    
    // نظام العرض الذكي بناءً على إعدادات المنتج (بناء وتوسيع)
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            ${filtered.map(p => {
                // تحديد لو كان الكارت هيشغل مساحة كاملة بناءً على الإعدادات الأصلية
                const isFullWidth = p.layout === 'full' ? 'md:col-span-2 lg:col-span-3' : '';
                return `
                <div class="${isFullWidth} bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-pink-50 flex flex-col h-full hover:shadow-xl transition-all duration-500 group">
                    <div class="relative aspect-[4/3] md:aspect-video overflow-hidden">
                        <img src="${p.img || ''}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy">
                        ${p.badge ? `<span class="absolute top-5 right-5 bg-pink-500 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg">${p.badge}</span>` : ''}
                        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                    <div class="p-6 md:p-8 flex flex-col flex-1">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <span class="text-[9px] font-bold text-pink-400 tracking-[0.2em] uppercase">${p.category}</span>
                                <h3 class="text-xl md:text-2xl font-black text-gray-800 mt-1">${p.name}</h3>
                            </div>
                            <div class="text-left">
                                <span class="text-xl md:text-2xl font-black text-pink-600">${p.price}</span>
                                <span class="text-[10px] font-bold text-gray-400 mr-1">ج.م</span>
                            </div>
                        </div>
                        <p class="text-sm text-gray-500 font-medium leading-relaxed mb-8 flex-1 opacity-80">${p.desc || ''}</p>
                        
                        <button onclick="openProductDetails('${p.id}')" class="w-full bg-gray-900 text-white py-4 md:py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transform active:scale-95 transition-all hover:bg-pink-600 shadow-lg shadow-gray-200">
                            <span>تخصيص وطلب المنتج</span>
                            <i data-lucide="arrow-left" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `}).join('')}
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}
