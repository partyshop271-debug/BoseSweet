// === BoseSweets Pro Engine: Original Comprehensive Edition ===
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
let currentCategory = 'تورت';
let cart = JSON.parse(localStorage.getItem('boseSweets_cart_data')) || [];

// 1. تشغيل المحرك (igniteEngine)
async function igniteEngine() {
    try {
        const setDoc = await db.collection('settings').doc('main').get();
        if (setDoc.exists) siteSettings = setDoc.data();

        const catSnap = await db.collection('catalog').get();
        catalog = [];
        catSnap.forEach(doc => catalog.push({ id: doc.id, ...doc.data() }));

        const categories = [...new Set(catalog.map(p => p.category))].filter(Boolean);
        if (!categories.includes('تورت')) categories.unshift('تورت');

        renderCategoriesNav(categories);
        setCategory(currentCategory);
        syncCartUI();
    } catch (e) { console.error("Connection Error"); }
    finally {
        // إجبار إخفاء شاشة التحميل لضمان فتح الموقع فوراً
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('opacity-0');
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }
}

// 2. محرك التبويبات (نفس كفاءة Zo.html الأصلي)
function renderCategoriesNav(categories) {
    const nav = document.getElementById('categories-nav');
    if (!nav) return;
    nav.innerHTML = categories.map(cat => `
        <button id="cat-btn-${cat.replace(/\s+/g, '-')}" 
                onclick="setCategory('${cat}')" 
                class="whitespace-nowrap px-8 py-3 rounded-full font-black border-2 transition-all duration-300
                ${currentCategory === cat ? 'bg-pink-500 text-white border-pink-500 shadow-lg scale-105 brand-gradient' : 'bg-white text-gray-500 border-gray-100'}">
            ${cat}
        </button>`).join('');
}

function setCategory(cat) {
    currentCategory = cat;
    renderCategoriesNav([...new Set(catalog.map(p => p.category))].filter(Boolean));
    renderFilteredProducts(cat);
    const activeBtn = document.getElementById(`cat-btn-${cat.replace(/\s+/g, '-')}`);
    if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// 3. محرك العرض المزدوج (Grid & Full-Width)
function renderFilteredProducts(cat) {
    const container = document.getElementById('display-container');
    if (cat === 'تورت') { renderCakeBuilder(container); return; }
    
    const filtered = catalog.filter(p => p.category === cat);
    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-8">
            ${filtered.map(p => {
                const isFull = p.layout === 'full' ? 'col-span-2' : 'col-span-1';
                const flexDir = p.layout === 'full' ? 'md:flex-row' : 'flex-col';
                return `
                <div class="${isFull} bg-white rounded-[2rem] overflow-hidden shadow-sm border border-pink-50 flex ${flexDir} h-full transition-all group animate-fade-in">
                    <div class="${p.layout === 'full' ? 'md:w-1/2' : 'w-full'} relative aspect-video">
                        <img src="${p.img}" class="w-full h-full object-cover">
                    </div>
                    <div class="${p.layout === 'full' ? 'md:w-1/2' : 'w-full'} p-4 md:p-8 flex flex-col justify-between flex-1">
                        <div>
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="text-sm md:text-2xl font-black text-gray-800">${p.name}</h3>
                                <div class="text-pink-600 font-black text-xs md:text-xl">${p.price} ج.م</div>
                            </div>
                            <p class="text-[10px] md:text-sm text-gray-500 font-bold leading-relaxed mb-4 line-clamp-none">${p.desc || ''}</p>
                        </div>
                        <button onclick="addToCart('${p.id}')" class="w-full bg-gray-900 text-white py-3 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm hover:bg-pink-600 transition-all">إضافة للسلة ✨</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    if (window.lucide) lucide.createIcons();
}

// 4. محرك التورت الملكية (إضافة للسلة دون خروج)
function renderCakeBuilder(target) {
    target.innerHTML = `
        <div class="bg-white rounded-[2.5rem] shadow-xl border border-pink-50 p-6 md:p-12 animate-fade-in">
            <h2 class="text-2xl md:text-4xl font-black text-pink-600 mb-6 text-center">تخصيص التورت الملكية 👑</h2>
            <p class="text-center font-bold text-gray-500 mb-10">صممي تورتة أحلامك وسنقوم بتنفيذها بأعلى معايير الجودة.</p>
            <div class="space-y-8">
                <button onclick="commitCakeToCart()" class="w-full brand-gradient text-white py-5 rounded-2xl font-black text-xl shadow-lg">إضافة للمشتريات ✨</button>
            </div>
        </div>`;
}

function commitCakeToCart() {
    // منطق إضافة التورتة المخصصة للسلة
    const customCake = { id: Date.now(), name: "تورتة تصميم خاص", price: 580, quantity: 1, isCake: true }; 
    cart.push(customCake);
    saveCart();
    showToast("تمت إضافة التورتة للسلة بنجاح 🌸");
}

// 5. نظام السلة (syncCartUI & addToCart)
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
