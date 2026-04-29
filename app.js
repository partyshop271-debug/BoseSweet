// === BoseSweets Pro Engine: Original Identity & Advanced Performance ===
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
let currentCategory = 'تورت'; // القسم الافتراضي الملكي
let cart = JSON.parse(localStorage.getItem('boseSweets_cart_data')) || [];

// 1. تشغيل المحرك فور تحميل الصفحة
async function igniteEngine() {
    try {
        const settingsSnap = await db.collection('settings').doc('main').get();
        if (settingsSnap.exists) siteSettings = settingsSnap.data();

        const catalogSnap = await db.collection('catalog').get();
        catalog = [];
        catalogSnap.forEach(doc => catalog.push({ id: doc.id, ...doc.data() }));

        const categories = [...new Set(catalog.map(p => p.category))].filter(Boolean);
        if (!categories.includes('تورت')) categories.unshift('تورت');

        renderCategoriesNav(categories);
        setCategory(currentCategory);
        syncCartUI();
        
        // إخفاء شاشة التحميل فور جاهزية البيانات
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('opacity-0');
            setTimeout(() => loader.style.display = 'none', 500);
        }
    } catch (e) { console.error("Cloud Connection Error", e); }
}

// 2. محرك التبويبات التفاعلي (Active & Scroll System)
function renderCategoriesNav(categories) {
    const nav = document.getElementById('categories-nav');
    if (!nav) return;
    
    nav.innerHTML = categories.map(cat => `
        <button id="cat-btn-${cat.replace(/\s+/g, '-')}" 
                onclick="setCategory('${cat}')" 
                class="whitespace-nowrap px-8 py-3 rounded-full font-black border-2 transition-all duration-300
                ${currentCategory === cat 
                    ? 'bg-pink-500 text-white border-pink-500 shadow-lg scale-105 brand-gradient' 
                    : 'bg-white text-gray-500 border-gray-100 hover:border-pink-200'}">
            ${cat}
        </button>
    `).join('');
}

function setCategory(cat) {
    currentCategory = cat;
    const categories = [...new Set(catalog.map(p => p.category))].filter(Boolean);
    renderCategoriesNav(categories);
    renderFilteredProducts(cat);

    // جعل التبويب المختار يتحرك لمنتصف الشاشة تلقائياً
    const activeBtn = document.getElementById(`cat-btn-${cat.replace(/\s+/g, '-')}`);
    if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

// 3. محرك العرض المزدوج (Grid vs Full-Width)
function renderFilteredProducts(cat) {
    const container = document.getElementById('display-container');
    const filtered = catalog.filter(p => p.category === cat);
    
    if (cat === 'تورت') {
        renderCakeBuilder(container);
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-8">
            ${filtered.map(p => {
                const isFull = p.layout === 'full' ? 'col-span-2' : 'col-span-1';
                const flexDir = p.layout === 'full' ? 'md:flex-row' : 'flex-col';
                
                return `
                <div class="${isFull} bg-white rounded-[2rem] overflow-hidden shadow-sm border border-pink-50 flex ${flexDir} h-full transition-all group hover:shadow-xl animate-fade-in">
                    <div class="${p.layout === 'full' ? 'md:w-1/2' : 'w-full'} relative aspect-video">
                        <img src="${p.img}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                        ${p.badge ? `<span class="absolute top-4 right-4 bg-pink-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-md">${p.badge}</span>` : ''}
                    </div>
                    <div class="${p.layout === 'full' ? 'md:w-1/2' : 'w-full'} p-4 md:p-8 flex flex-col justify-between flex-1">
                        <div>
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="text-sm md:text-2xl font-black text-gray-800 leading-tight">${p.name}</h3>
                                <div class="text-pink-600 font-black text-xs md:text-xl whitespace-nowrap">${p.price} ج.م</div>
                            </div>
                            <p class="text-[10px] md:text-sm text-gray-500 font-bold leading-relaxed mb-4 line-clamp-none">${p.desc || ''}</p>
                        </div>
                        <button onclick="addToCart('${p.id}')" class="w-full bg-gray-900 text-white py-3 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm hover:bg-pink-600 transition-all flex items-center justify-center gap-2">
                            <span>إضافة للسلة ✨</span>
                            <i data-lucide="shopping-cart" class="w-3 h-3 md:w-4 md:h-4"></i>
                        </button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    if (window.lucide) lucide.createIcons();
}

// 4. محرك السلة والواتساب (البقاء في الموقع)
function addToCart(id) {
    const p = catalog.find(x => String(x.id) === String(id));
    const exist = cart.find(i => String(i.id) === String(id));
    if (exist) exist.quantity++; else cart.push({ ...p, quantity: 1 });
    saveCart();
    showToast("تمت الإضافة للسلة 🌸");
}

function saveCart() {
    localStorage.setItem('boseSweets_cart_data', JSON.stringify(cart));
    syncCartUI();
}

function syncCartUI() {
    const badge = document.getElementById('cart-count-badge');
    const totalQ = cart.reduce((s, i) => s + i.quantity, 0);
    if(badge) {
        badge.innerText = totalQ;
        badge.classList.toggle('hidden', totalQ === 0);
    }
}

// دالة التنبيهات (Toast) الأصلية
function showToast(msg) {
    const toast = document.getElementById('system-toast');
    const msgSpan = document.getElementById('toast-message');
    if (toast && msgSpan) {
        msgSpan.innerText = msg;
        toast.classList.remove('hidden');
        toast.classList.add('flex', 'toast-enter');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}

window.onload = igniteEngine;
