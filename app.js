// === BoseSweets Pro Engine: Comprehensive Logic ===
const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let catalog = [];
let currentCategory = '';

async function igniteEngine() {
    try {
        // جلب البيانات من السحابة
        const catalogSnap = await db.collection('catalog').get();
        catalog = [];
        catalogSnap.forEach(doc => catalog.push({ id: doc.id, ...doc.data() }));

        const categories = [...new Set(catalog.map(p => p.category))].filter(Boolean);
        currentCategory = categories.find(c => c.includes('تورت')) || categories[0];

        renderCategoriesNav(categories);
        renderFilteredProducts(currentCategory);
        
        // إشارة الفتح: إخفاء اللودر فوراً
        hideLoader();
    } catch (e) { 
        console.error("Cloud Error:", e);
        hideLoader(); // افتح الموقع حتى لو فيه خطأ في السحابة
    }
}

function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.classList.add('opacity-0');
        setTimeout(() => loader.style.display = 'none', 500);
    }
}

function renderCategoriesNav(categories) {
    const nav = document.getElementById('categories-nav');
    if (!nav) return;
    nav.innerHTML = categories.map(cat => `
        <button onclick="renderFilteredProducts('${cat}')" 
                class="px-8 py-3 rounded-full font-black border-2 transition-all
                ${currentCategory === cat ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-500 border-gray-100'}">
            ${cat}
        </button>
    `).join('');
}

function renderFilteredProducts(cat) {
    currentCategory = cat;
    const container = document.getElementById('display-container');
    const filtered = catalog.filter(p => p.category === cat);
    
    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${filtered.map(p => `
            <div class="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-pink-50 flex flex-col h-full hover:shadow-md transition-all group">
                <div class="relative aspect-video">
                    <img src="${p.img || ''}" class="w-full h-full object-cover">
                </div>
                <div class="p-6 flex flex-col flex-1">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-black text-gray-800">${p.name}</h3>
                        <div class="text-pink-600 font-black text-lg">${p.price} ج.م</div>
                    </div>
                    <p class="text-sm text-gray-500 font-bold mb-6 flex-1">${p.desc || ''}</p>
                    <button class="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-sm hover:bg-pink-600 transition-all">إضافة للسلة ✨</button>
                </div>
            </div>
        `).join('')}
    </div>`;
    if (window.lucide) lucide.createIcons();
}

window.onload = igniteEngine;
