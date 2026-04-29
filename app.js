// === BoseSweets Pro Engine: Royal Identity Edition (2026) ===

const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

let catalog = []; 
let siteSettings = {}; 
let currentCategory = ''; 

/**
 * دالة تشغيل المحرك الرئيسي
 * تقوم بجلب البيانات من السحابة وترتيب الأقسام وبناء الواجهة
 */
async function igniteEngine() {
    try {
        // 1. جلب إعدادات المتجر العامة
        const settingsSnap = await db.collection('settings').doc('main').get();
        if (settingsSnap.exists) {
            siteSettings = settingsSnap.data();
            applyGlobalSettings(siteSettings);
        }

        // 2. جلب الكتالوج الكامل
        const catalogSnap = await db.collection('catalog').get();
        catalog = [];
        catalogSnap.forEach(doc => {
            catalog.push({ id: doc.id, ...doc.data() });
        });

        // 3. استخراج الأقسام وترتيبها (التورت أولاً بذكاء)
        const categories = [...new Set(catalog.map(p => p.category))].filter(Boolean);
        
        // تحديد القسم الافتراضي (تورت أو أول قسم متاح)
        const priorityCat = categories.find(c => c.includes('تورت')) || categories[0];
        currentCategory = priorityCat;

        // 4. بناء الواجهة
        renderCategoriesNav(categories); 
        renderFilteredProducts(currentCategory); 
        
        // إخفاء الشاشة التحميلية
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('opacity-0');
            setTimeout(() => loader.style.display = 'none', 500);
        }

    } catch (e) { 
        console.error("Cloud Connection Error:", e);
        showToast("عذراً، يوجد مشكلة في الاتصال بالسحابة");
    }
}

/**
 * بناء شريط الأقسام العلوي
 */
function renderCategoriesNav(categories) {
    const nav = document.getElementById('categories-nav');
    if (!nav) return;
    
    nav.innerHTML = categories.map(cat => `
        <button onclick="renderFilteredProducts('${cat}')" 
                class="px-8 py-3 rounded-full font-black whitespace-nowrap transition-all border-2
                ${currentCategory === cat 
                    ? 'bg-pink-500 text-white border-pink-500 shadow-md' 
                    : 'bg-white text-gray-500 border-gray-50 hover:border-pink-100 hover:text-pink-500'}">
            ${cat}
        </button>
    `).join('');
}

/**
 * عرض المنتجات بناءً على القسم المختار
 * تطبق نظام الكروت الاحترافي المتنوع (توسيع وبناء)
 */
function renderFilteredProducts(cat) {
    currentCategory = cat;
    
    // تحديث شكل الأزرار النشطة
    const categories = [...new Set(catalog.map(p => p.category))].filter(Boolean);
    renderCategoriesNav(categories); 
    
    const container = document.getElementById('display-container');
    if (!container) return;

    const filtered = catalog.filter(p => p.category === cat);
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-center py-20 font-bold text-gray-400">لا توجد منتجات في هذا القسم حالياً</div>`;
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            ${filtered.map(p => {
                // التحكم في حجم الكارت (كامل العرض للأصناف المميزة)
                const layoutClass = p.layout === 'full' ? 'md:col-span-2 lg:col-span-3' : '';
                
                return `
                <div class="${layoutClass} bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-pink-50 flex flex-col h-full hover:shadow-xl transition-all duration-500 group animate-fade-in">
                    <div class="relative aspect-[4/3] md:aspect-video overflow-hidden">
                        <img src="${p.img || ''}" alt="${p.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy">
                        ${p.badge ? `
                            <span class="absolute top-5 right-5 bg-pink-500 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg">
                                ${p.badge}
                            </span>
                        ` : ''}
                        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                    
                    <div class="p-6 md:p-8 flex flex-col flex-1">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <span class="text-[9px] font-bold text-pink-400 tracking-[0.2em] uppercase">${p.category}</span>
                                <h3 class="text-xl md:text-2xl font-black text-gray-800 mt-1">${p.name}</h3>
                            </div>
                            <div class="text-left bg-pink-50 px-3 py-1 rounded-xl">
                                <span class="text-xl md:text-2xl font-black text-pink-600">${p.price}</span>
                                <span class="text-[10px] font-bold text-pink-400 mr-1">ج.م</span>
                            </div>
                        </div>
                        
                        <p class="text-sm text-gray-500 font-medium leading-relaxed mb-8 flex-1 opacity-80">
                            ${p.desc || 'نقدم لكم أرقى المكونات الطبيعية 100% المحضرة يدوياً بكل حب.'}
                        </p>
                        
                        <button onclick="handleProductAction('${p.id}', '${p.category}')" 
                                class="w-full bg-gray-900 text-white py-4 md:py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transform active:scale-95 transition-all hover:bg-pink-600 shadow-lg shadow-gray-200">
                            <span>${p.category.includes('تورت') ? 'تخصيص وطلب التورتة 👑' : 'إضافة للسلة ✨'}</span>
                            <i data-lucide="${p.category.includes('تورت') ? 'settings-2' : 'shopping-cart'}" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;}).join('')}
        </div>
    `;
    
    if (window.lucide) lucide.createIcons();
}

/**
 * تطبيق الإعدادات العالمية للهوية البصرية (اللون الوردي الموحد)
 */
function applyGlobalSettings(settings) {
    document.documentElement.style.setProperty('--brand-hue', "355"); 
    
    if (settings.brandName) {
        document.getElementById('dyn-brand-name').innerText = settings.brandName;
        document.getElementById('dyn-page-title').innerText = `${settings.brandName} | القائمة الرسمية`;
    }
}

/**
 * دالة التنبيهات (Toast)
 */
function showToast(message) {
    const toast = document.getElementById('system-toast');
    const msgSpan = document.getElementById('toast-message');
    if (!toast || !msgSpan) return;

    msgSpan.innerText = message;
    toast.classList.remove('hidden');
    toast.classList.add('flex', 'toast-enter');
    
    setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('flex', 'toast-enter');
    }, 3000);
}

// تشغيل المحرك عند تحميل النافذة
window.addEventListener('DOMContentLoaded', igniteEngine);
