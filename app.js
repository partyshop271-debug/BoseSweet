// === BoseSweets Pro Engine: Royal Identity Edition ===
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
let currentCategory = ''; // هيبدأ فاضي عشان ياخد أول قسم حقيقي

async function igniteEngine() {
    try {
        const settingsSnap = await db.collection('settings').doc('main').get();
        if (settingsSnap.exists) siteSettings = settingsSnap.data();

        const catalogSnap = await db.collection('catalog').get();
        catalog = [];
        catalogSnap.forEach(doc => catalog.push(doc.data()));

        // ترتيب الأقسام: التورت أولاً دائماً
        const categories = [...new Set(catalog.map(p => p.category))].filter(Boolean);
        currentCategory = categories.includes('تورت') ? 'تورت' : categories[0];

        applyGlobalUI(); 
        renderCategoriesNav(categories); 
        renderFilteredProducts(currentCategory); 
        
        document.getElementById('global-loader')?.classList.add('opacity-0');
    } catch (e) { console.error("Cloud Error"); }
}

function renderCategoriesNav(categories) {
    const nav = document.getElementById('categories-nav');
    if (!nav) return;
    
    nav.innerHTML = categories.map(cat => `
        <button onclick="renderFilteredProducts('${cat}')" 
                class="px-8 py-3 rounded-full font-black whitespace-nowrap transition-all border-2
                ${currentCategory === cat ? 'bg-pink-500 text-white border-pink-500 shadow-md' : 'bg-white text-gray-500 border-gray-50 hover:border-pink-100'}">
            ${cat}
        </button>
    `).join('');
}

function renderFilteredProducts(cat) {
    currentCategory = cat;
    const categories = [...new Set(catalog.map(p => p.category))].filter(Boolean);
    renderCategoriesNav(categories); 
    
    const container = document.getElementById('display-container');
    const filtered = catalog.filter(p => p.category === cat);
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            ${filtered.map(p => `
                <div class="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-50 flex flex-col h-full hover:shadow-xl transition-all duration-500">
                    <div class="relative aspect-square">
                        <img src="${p.img || ''}" class="w-full h-full object-cover">
                        ${p.badge ? `<span class="absolute top-5 right-5 bg-pink-500 text-white text-[11px] font-black px-4 py-2 rounded-full">${p.badge}</span>` : ''}
                    </div>
                    <div class="p-8 flex flex-col flex-1">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-[10px] font-bold text-pink-400 tracking-widest uppercase">${p.category}</span>
                            <span class="text-2xl font-black text-gray-900">${p.price} ج.م</span>
                        </div>
                        <h3 class="text-xl font-black text-gray-800 mb-4">${p.name}</h3>
                        <p class="text-sm text-gray-500 font-bold leading-relaxed mb-8 flex-1">${p.desc || ''}</p>
                        
                        <button onclick="openProductDetails('${p.id}')" class="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
                            تخصيص وطلب التورتة 👑
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function applyGlobalUI() {
    document.documentElement.style.setProperty('--brand-hue', "355"); // وردي بوسي الموحد
    document.getElementById('dyn-brand-name').innerText = "حلويات بوسي";
}

window.onload = igniteEngine;
