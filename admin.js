// === النسخة المستقرة والآمنة لإدارة حلويات بوسي ===
const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();

let adminPass = "Aaboohamdy";
let catalog = []; let siteSettings = {}; 

// 🔐 تسجيل دخول آمن يفتح السكرول فوراً
function loginAdmin() {
    const input = document.getElementById('admin-pass-input').value;
    if (input === adminPass) {
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('admin-dashboard-content').classList.remove('opacity-0', 'pointer-events-none');
        document.body.style.overflow = 'auto'; // تفعيل السكرول
        loadDataFromLocal(); 
    } else { alert('رمز المرور غير صحيح'); }
}

// 🚀 سحب البيانات من الملف المحلي فوراً
async function loadDataFromLocal() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        catalog = data.catalog || [];
        siteSettings = data.settings || {};
        
        renderAdminUI(); // تشغيل الواجهة فوراً
        showSystemToast('تم تحميل البيانات من ملف الحفظ بنجاح ✨', 'success');
    } catch (e) {
        console.error("Local Load Error:", e);
    }
}

// 🔄 تبديل الأقسام (التبويبات) - حل مشكلة التوقف
function switchAdminTab(tabId) {
    const contents = document.querySelectorAll('.admin-tab-content');
    contents.forEach(c => { c.classList.add('hidden'); c.classList.remove('block'); });

    const target = document.getElementById('admin-' + tabId);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('block');
    }

    // تحديث شكل الأزرار
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-pink-500', 'text-white');
        if(btn.dataset.target === 'admin-' + tabId) btn.classList.add('bg-pink-500', 'text-white');
    });
}

function renderAdminUI() {
    renderAdminMenu();
    updateDashboardStats();
    if(window.lucide) lucide.createIcons();
}

function renderAdminMenu() {
    const tbody = document.getElementById('admin-menu-tbody');
    if(!tbody) return;
    tbody.innerHTML = catalog.map(p => `
        <tr class="hover:bg-gray-800 border-b border-gray-700">
            <td class="p-4"><img src="${p.img || ''}" class="w-12 h-12 object-cover rounded-lg"></td>
            <td class="p-4 text-xs font-bold text-gray-400">${p.category}</td>
            <td class="p-4 font-bold text-white">${p.name}</td>
            <td class="p-4 text-pink-400">${p.price} ج.م</td>
            <td class="p-4 text-center">
                <button class="text-blue-400"><i data-lucide="edit" class="w-4 h-4"></i></button>
            </td>
        </tr>`).join('');
}

function updateDashboardStats() {
    const statProd = document.getElementById('admin-stat-products');
    if(statProd) statProd.innerText = catalog.length;
}

function showSystemToast(m) {
    const toast = document.getElementById('system-toast');
    if(toast) {
        document.getElementById('toast-message').innerText = m;
        toast.classList.replace('hidden', 'flex');
        setTimeout(() => toast.classList.replace('flex', 'hidden'), 3000);
    }
}
