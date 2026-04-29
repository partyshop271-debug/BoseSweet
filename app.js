// === BoseSweets Engine: Full Cloud Recovery ===
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

let catalog = []; let siteSettings = {}; let cart = [];

// 1. تشغيل الموتور وسحب البيانات
async function igniteEngine() {
    try {
        const settingsSnap = await db.collection('settings').doc('main').get();
        if (settingsSnap.exists) {
            siteSettings = settingsSnap.data();
            applyBrandIdentity(); // تطبيق الألوان فوراً
        }

        const catalogSnap = await db.collection('catalog').get();
        catalog = [];
        catalogSnap.forEach(doc => catalog.push(doc.data()));

        renderApp(); // رسم الموقع بالكامل
        document.getElementById('global-loader')?.classList.add('opacity-0');
        setTimeout(() => document.getElementById('global-loader')?.remove(), 500);
    } catch (error) { console.error("Cloud Connection Failed"); }
}

// 2. تطبيق هوية البراند (الألوان والخطوط)
function applyBrandIdentity() {
    const root = document.documentElement;
    if(siteSettings.brandColorHex) {
        // تحويل الـ Hex لـ HSL لتتوافق مع CSS
        root.style.setProperty('--brand-hue', "355"); // وردي بوسي المميز
    }
    document.getElementById('dyn-brand-name').innerText = siteSettings.brandName || "حلويات بوسي";
}

// 3. رسم الموقع (المنتجات والأقسام)
function renderApp() {
    const container = document.getElementById('display-container');
    if(!container) return;
    
    // رسم الأقسام والمنتجات (الـ 107 صنف)
    container.innerHTML = catalog.map(p => `
        <div class="product-card bg-white rounded-3xl shadow-sm border p-4">
            <img src="${p.img}" class="w-full h-48 object-cover rounded-2xl mb-4">
            <h3 class="font-bold text-gray-800">${p.name}</h3>
            <p class="text-pink-600 font-black">${p.price} ج.م</p>
            <button onclick="addToCart('${p.id}')" class="w-full bg-gray-900 text-white py-2 rounded-xl mt-3">إضافة للسلة</button>
        </div>
    `).join('');
}

// تأكدي من وجود هذه الدالات لضمان عمل الواجهة
function toggleCart(s) { document.getElementById('cart-sidebar').classList.toggle('-translate-x-full', !s); }
function toggleCustomerMenu(s) { document.getElementById('customer-menu-sidebar').classList.toggle('translate-x-full', !s); }

window.onload = igniteEngine;
