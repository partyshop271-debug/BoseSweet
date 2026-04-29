// === BoseSweets Pro Engine: Comprehensive Logic (No Simplification) ===

const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e"
};

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// المتغيرات المركزية للمحرك
let catalog = [];
let siteSettings = {};
let shippingZones = [];
let catMenu = [];
let cart = JSON.parse(localStorage.getItem('boseSweets_cart_data')) || [];

let state = {
    activeCat: 'تورت',
    cakeBuilder: { 
        flv: 'فانيليا', ps: 4, sh: 'دائري', trd: false, 
        img: 'بدون', msg: '', alg: '', occ: '', 
        hasRefImg: false, crd: false, dlg: false 
    }
};

// 1. تشغيل المحرك الرئيسي
async function igniteEngine() {
    try {
        // جلب الإعدادات السحابية
        const setDoc = await db.collection('settings').doc('main').get();
        if (setDoc.exists) siteSettings = setDoc.data();

        // جلب الكتالوج
        const catSnap = await db.collection('catalog').get();
        catalog = [];
        catSnap.forEach(doc => catalog.push({ id: doc.id, ...doc.data() }));

        // جلب مناطق الشحن
        const shipSnap = await db.collection('shipping').get();
        shippingZones = [];
        shipSnap.forEach(doc => shippingZones.push(doc.data()));

        // ترتيب الأقسام
        catMenu = siteSettings.catMenu || [...new Set(catalog.map(p => p.category))].filter(Boolean);
        if (!catMenu.includes('تورت')) catMenu.unshift('تورت');

        applySettingsToUI();
        renderCategories();
        renderMainDisplay();
        syncCartUI();
        
        document.getElementById('global-loader')?.classList.add('opacity-0');
        setTimeout(() => document.getElementById('global-loader').style.display = 'none', 500);
    } catch (e) {
        console.error("Cloud Connection Failed:", e);
    }
}

// 2. تطبيق الهوية البصرية (محرك الألوان والخطوط)
function applySettingsToUI() {
    const root = document.documentElement;
    if (siteSettings.brandColorHex) {
        const hue = hexToMathHSL(siteSettings.brandColorHex);
        root.style.setProperty('--brand-hue', hue);
    }
    root.style.setProperty('--brand-font', siteSettings.fontFamily || "'Cairo', sans-serif");
    root.style.setProperty('--base-font-size', (siteSettings.baseFontSize || 16) + 'px');
    
    document.getElementById('dyn-brand-name').innerText = siteSettings.brandName || "حلويات بوسي";
    document.getElementById('dyn-ticker-text').innerText = siteSettings.tickerText || "حلويات بوسي: صنعناها بحب لتهديها لمن تحب ✨";
}

// 3. عرض المنتجات (مع الحفاظ على التنسيق الملكي)
function renderMainDisplay() {
    const container = document.getElementById('display-container');
    if (state.activeCat === 'تورت') {
        renderCakeBuilder(container);
    } else {
        const filtered = catalog.filter(p => p.category === state.activeCat);
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${filtered.map(p => drawProductCard(p)).join('')}
            </div>`;
    }
    if (window.lucide) lucide.createIcons();
}

function drawProductCard(p) {
    const isFull = p.layout === 'full' ? 'md:col-span-2 lg:col-span-3' : '';
    return `
        <div class="${isFull} bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-pink-50 flex flex-col h-full hover:shadow-xl transition-all duration-500 group">
            <div class="relative aspect-video overflow-hidden">
                <img src="${p.img || ''}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                ${p.badge ? `<span class="absolute top-5 right-5 bg-pink-500 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg">${p.badge}</span>` : ''}
            </div>
            <div class="p-8 flex flex-col flex-1">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl md:text-2xl font-black text-gray-800">${p.name}</h3>
                    <div class="text-pink-600 font-black text-xl">${p.price} ج.م</div>
                </div>
                <p class="text-sm text-gray-500 font-bold leading-relaxed mb-8 flex-1 line-clamp-none">${p.desc || ''}</p>
                <button onclick="addToCart('${p.id}')" class="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-pink-600 transition-all">
                    إضافة للسلة ✨ <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                </button>
            </div>
        </div>`;
}

// 4. نظام السلة والواتساب (بدون تبسيط)
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
    badge.innerText = totalQ;
    badge.classList.toggle('hidden', totalQ === 0);
}

async function submitOrder() {
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    if (!name || !phone) return alert("الرجاء إكمال البيانات الملكية ✨");

    let msg = `*طلب جديد من حلويات بوسي* 🧁\n👤 العميل: ${name}\n📞 الهاتف: ${phone}\n\n*الطلبات:*\n`;
    cart.forEach((i, idx) => msg += `${idx + 1}. ${i.name} (x${i.quantity}) = ${i.price * i.quantity} ج\n`);
    msg += `\n*الإجمالي:* ${cart.reduce((s, i) => s + (i.price * i.quantity), 0)} ج.م`;

    window.open(`https://wa.me/201097238441?text=${encodeURIComponent(msg)}`, '_blank');
}

// محول الألوان HEX -> HSL
function hexToMathHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = (max + min) / 2;
    if (max !== min) {
        let d = max - min;
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    } else h = 0;
    return Math.round(h * 360);
}

// الوظائف المساعدة
function setCategory(c) { state.activeCat = c; renderCategories(); renderMainDisplay(); }
function showToast(m) { alert(m); } // يمكن استبدالها بـ UI Toast
function renderCategories() {
    document.getElementById('categories-nav').innerHTML = catMenu.map(c => `
        <button onclick="setCategory('${c}')" class="px-8 py-3 rounded-full font-black border-2 ${state.activeCat === c ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-500 border-gray-50'}">${c}</button>
    `).join('');
}

window.onload = igniteEngine;
