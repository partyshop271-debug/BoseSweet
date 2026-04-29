// === BoseSweets Pro Engine: Global Cloud Edition ===
const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let catalog = []; let siteSettings = {}; let currentCategory = 'الكل';

// 1. تشغيل الموتور وسحب الـ 107 منتج
async function initApp() {
    try {
        const settingsSnap = await db.collection('settings').doc('main').get();
        if (settingsSnap.exists) siteSettings = settingsSnap.data();

        const catalogSnap = await db.collection('catalog').get();
        catalog = [];
        catalogSnap.forEach(doc => catalog.push(doc.data()));

        applySettings(); // تطبيق الألوان والاسم
        renderCategoriesNav(); // رسم أقسام المنيو
        renderProducts('الكل'); // عرض كل المنتجات بتنسيق احترافي
        
        document.getElementById('global-loader')?.classList.add('opacity-0');
    } catch (e) { console.error("Cloud Error"); }
}

// 2. تطبيق الهوية الملكية (الألوان)
function applySettings() {
    document.title = siteSettings.brandName || "حلويات بوسي";
    document.getElementById('dyn-brand-name').innerText = siteSettings.brandName || "حلويات بوسي";
    // تطبيق اللون الوردي الموحد
    document.documentElement.style.setProperty('--brand-hue', "355");
}

// 3. رسم شريط الأقسام (تورت، جاتوهات، سينابون...)
function renderCategoriesNav() {
    const nav = document.getElementById('categories-nav');
    const categories = ['الكل', ...new Set(catalog.map(p => p.category))].filter(Boolean);
    
    nav.innerHTML = categories.map(cat => `
        <button onclick="renderProducts('${cat}')" class="category-btn px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all border ${currentCategory === cat ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-600 border-gray-100 hover:border-pink-200'}">
            ${cat}
        </button>
    `).join('');
}

// 4. رسم المنتجات (الفخامة والترتيب)
function renderProducts(cat) {
    currentCategory = cat;
    renderCategoriesNav(); // لتحديث شكل الزر المختار
    
    const container = document.getElementById('display-container');
    const filtered = cat === 'الكل' ? catalog : catalog.filter(p => p.category === cat);
    
    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-center py-20 font-bold text-gray-400">قريباً في حلويات بوسي... ✨</p>`;
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${filtered.map(p => `
                <div class="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-50 flex flex-col h-full">
                    <div class="relative overflow-hidden aspect-square">
                        <img src="${p.img || ''}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                        ${p.badge ? `<span class="absolute top-4 right-4 bg-pink-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">${p.badge}</span>` : ''}
                    </div>
                    <div class="p-6 md:p-8 flex flex-col flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-[10px] font-bold text-pink-400 uppercase tracking-widest">${p.category}</span>
                            <span class="text-xl font-black text-gray-900">${p.price} ج.م</span>
                        </div>
                        <h3 class="text-lg md:text-xl font-black text-gray-800 mb-3">${p.name}</h3>
                        <p class="text-xs text-gray-500 font-bold leading-relaxed mb-6 flex-1">${p.desc || ''}</p>
                        <button onclick="addToCart('${p.id}')" class="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all hover:bg-black active:scale-95 shadow-lg">
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i> إضافة للسلة
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    lucide.createIcons();
}

// دوال الواجهة الأساسية
function toggleCart(s) { document.getElementById('cart-sidebar').classList.toggle('-translate-x-full', !s); }
function toggleCustomerMenu(s) { document.getElementById('customer-menu-sidebar').classList.toggle('translate-x-full', !s); }

window.onload = initApp;
