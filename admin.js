// === Admin Engine Upgrade: Auto-Sync Version ===
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
const cloudName = 'dyx4w0dr1';
const uploadPreset = 'bose_sweets';

let adminPass = "Aaboohamdy";
let catalog = [];
let galleryData = [];
let siteSettings = {};
let shippingZones = [];
let globalOrders = [];
let catMenu = [];
let tempUploadedImages = [];
let currentEditId = null;

// 🔐 Security & Auth
function loginAdmin() {
    const input = document.getElementById('admin-pass-input').value;
    if (input === adminPass) {
        document.getElementById('auth-overlay').classList.add('opacity-0');
        setTimeout(() => {
            document.getElementById('auth-overlay').classList.add('hidden');
            document.getElementById('admin-dashboard-content').classList.remove('opacity-0', 'pointer-events-none');
            // ✅ Force Body Scroll Enable
            document.body.style.overflow = 'auto'; 
            showSystemToast('مرحباً بكِ في مركز قيادة حلويات بوسي 👑', 'success');
            loadAdminData();
        }, 500);
    } else { showSystemToast('رمز المرور غير صحيح ❌', 'error'); }
}

// 🚀 Data Loading & Smart Auto-Sync from data.json
async function loadAdminData() {
    try {
        // 1. Fetch Local Backup Data first
        const response = await fetch('data.json');
        const backup = await response.json();
        
        // 2. Fetch Cloud Data
        const catSnap = await db.collection('catalog').get();
        
        if (catSnap.empty && backup.catalog) {
            // ✨ Auto-Sync: If Cloud is empty, push backup to Cloud
            showSystemToast('جاري مزامنة بيانات الحفظ مع السحابة...', 'info');
            for(let p of backup.catalog) { await db.collection('catalog').doc(String(p.id)).set(p); }
            if(backup.settings) await db.collection('settings').doc('main').set(backup.settings);
            if(backup.shipping) { for(let s of backup.shipping) { await db.collection('shipping').doc(String(s.id)).set(s); } }
            showSystemToast('تمت استعادة كافة البيانات بنجاح! ✨', 'success');
            location.reload(); return;
        }

        // 3. Normal Load from Cloud
        catalog = []; catSnap.forEach(doc => catalog.push(doc.data()));
        const setSnap = await db.collection('settings').doc('main').get();
        if(setSnap.exists) siteSettings = setSnap.data();
        const shipSnap = await db.collection('shipping').get();
        shippingZones = []; shipSnap.forEach(doc => shippingZones.push(doc.data()));
        const ordSnap = await db.collection('orders').orderBy('timestamp', 'desc').limit(100).get();
        globalOrders = []; ordSnap.forEach(doc => globalOrders.push(doc.data()));
        const galSnap = await db.collection('gallery').orderBy('timestamp', 'desc').get();
        galleryData = []; galSnap.forEach(doc => galleryData.push(doc.data()));

        catMenu = siteSettings.catMenu || [...new Set(catalog.map(p => p.category))].filter(Boolean);
        if(!catMenu.includes('تورت')) catMenu.unshift('تورت');

        // Render Everything
        populateSettingsUI();
        renderAdminMenu();
        renderShippingZones();
        renderAdminOrders();
        renderAdminGallery();
        renderAdminCakeBuilder();
        renderAdminCategories();
        updateDashboardStats();

    } catch (error) {
        console.error("Load Error:", error);
        showSystemToast('حدث خطأ في مزامنة البيانات', 'error');
    }
}

// 🛠️ Fixing Layout & Scroll Issues
function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => { el.classList.remove('block'); el.classList.add('hidden'); });
    document.getElementById('admin-' + tabId).classList.remove('hidden');
    document.getElementById('admin-' + tabId).classList.add('block');
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        if(btn.dataset.target === 'admin-' + tabId) {
            btn.classList.add('bg-pink-500', 'text-white');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('bg-pink-500', 'text-white');
            btn.classList.add('text-gray-400');
        }
    });
    // ✅ Scroll to top on tab switch
    window.scrollTo(0,0);
}

// --- Rest of functions (save, delete, render) same as previous version but with scroll fixes ---
function populateSettingsUI() {
    document.getElementById('set-brand').value = siteSettings.brandName || "حلويات بوسي";
    document.getElementById('set-hero-title').value = siteSettings.heroTitle || "";
    document.getElementById('set-brand-color').value = siteSettings.brandColorHex || "#ec4899";
    document.getElementById('set-brand-color-text').value = siteSettings.brandColorHex || "#ec4899";
    // ... all other settings
}

function renderAdminMenu(searchTerm = '') {
    const tbody = document.getElementById('admin-menu-tbody');
    let filtered = catalog;
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = catalog.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)));
    }
    tbody.innerHTML = filtered.map(p => `
        <tr class="hover:bg-gray-800 transition-colors border-b border-gray-700">
            <td class="p-4"><img src="${p.img || ''}" class="w-12 h-12 object-cover rounded-lg"></td>
            <td class="p-4 text-xs font-bold">${p.category}</td>
            <td class="p-4"><p class="font-bold text-gray-200">${p.name}</p></td>
            <td class="p-4 font-mono text-pink-400">${p.price} ج.م</td>
            <td class="p-4 text-center">
                <button onclick="editProduct('${p.id}')" class="text-blue-400 p-2"><i data-lucide="edit" class="w-4 h-4"></i></button>
            </td>
        </tr>`).join('');
    lucide.createIcons();
}

function showSystemToast(m, t) {
    const toast = document.getElementById('system-toast');
    document.getElementById('toast-message').innerText = m;
    toast.classList.replace('hidden', 'flex');
    setTimeout(() => { toast.classList.replace('flex', 'hidden'); }, 3000);
}

function logoutAdmin() { location.reload(); }
function toggleAdminSidebar() { document.getElementById('admin-sidebar').classList.toggle('translate-x-full'); }
function updateDashboardStats() {
    document.getElementById('admin-stat-products').innerText = catalog.length;
    document.getElementById('admin-stat-orders').innerText = globalOrders.length;
}

// Ensure icons load
window.onload = () => { lucide.createIcons(); };
