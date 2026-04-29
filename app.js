// === BoseSweets Pro Engine: Elite Cloud Edition ===
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

let catalog = []; 
let siteSettings = {}; 
let currentCategory = 'الكل';

// 1. تشغيل المحرك وسحب البيانات
async function igniteEngine() {
    try {
        // سحب الإعدادات
        const settingsSnap = await db.collection('settings').doc('main').get();
        if (settingsSnap.exists) siteSettings = settingsSnap.data();

        // سحب الـ 107 منتج كاملة
        const catalogSnap = await db.collection('catalog').get();
        catalog = [];
        catalogSnap.forEach(doc => catalog.push(doc.data()));

        applyGlobalUI(); // تطبيق الهوية
        renderCategoriesNav(); // رسم التبويبات
        renderFilteredProducts('الكل'); // عرض الكل كبداية
        
        // إخفاء شاشة التحميل
        document.getElementById('global-loader')?.classList.add('opacity-0');
        setTimeout(() => document.getElementById('global-loader')?.remove(), 500);
    } catch (e) { console.error("Cloud Error:", e); }
}

// 2. رسم شريط الأقسام وتفعيل الضغط (حل مشكلة التوقف)
function renderCategoriesNav() {
    const nav = document.getElementById('categories-nav');
    if (!nav) return;

    // استخراج الأقسام الفريدة من المنتجات
    const categories = ['الكل', ...new Set(catalog.map(p => p.category))].filter(Boolean);
    
    nav.innerHTML = categories.map(cat => `
        <button onclick="renderFilteredProducts('${cat}')" 
                class="px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all border shadow-sm
                ${currentCategory === cat ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-600 border-gray-100'}">
            ${cat}
        </button>
    `).join('');
}

// 3. عرض المنتجات حسب القسم المختار (حل مشكلة رص المنتجات)
function renderFilteredProducts(cat) {
    currentCategory = cat;
    renderCategoriesNav(); // لتحديث شكل الزر النشط
    
    const container = document.getElementById('display-container');
    if (!container) return;

    // فلترة المنتجات بناءً على القسم
    const filtered = cat === 'الكل' ? catalog : catalog.filter(p => p.category === cat);
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="py-20 text-center text-gray-400 font-bold">قريباً في حلويات بوسي... ✨</div>`;
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${filtered.map(p => `
                <div class="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-50 flex flex-col h-full animate-fade-in">
                    <div class="relative aspect-square overflow-hidden">
                        <img src="${p.img || ''}" class="w-full h-full object-cover">
                        ${p.badge ? `<span class="absolute top-4 right-4 bg-pink-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full">${p.badge}</span>` : ''}
                    </div>
                    <div class="p-6 flex flex-col flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-[10px] font-bold text-pink-400">${p.category}</span>
                            <span class="text-xl font-black text-gray-900">${p.price} ج.م</span>
                        </div>
                        <h3 class="text-lg font-black text-gray-800 mb-3">${p.name}</h3>
                        <p class="text-xs text-gray-500 font-bold leading-relaxed mb-6 flex-1">${p.desc || ''}</p>
                        <button class="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i> إضافة للسلة
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function applyGlobalUI() {
    document.title = siteSettings.brandName || "حلويات بوسي";
    document.getElementById('dyn-brand-name').innerText = siteSettings.brandName || "حلويات بوسي";
    document.documentElement.style.setProperty('--brand-hue', "355");
}

function toggleCart(s) { document.getElementById('cart-sidebar')?.classList.toggle('-translate-x-full', !s); }
function toggleCustomerMenu(s) { document.getElementById('customer-menu-sidebar')?.classList.toggle('translate-x-full', !s); }

window.onload = igniteEngine;
