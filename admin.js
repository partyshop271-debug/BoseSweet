// === Admin Engine: Firebase Integration ===
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

// === Cloudinary Config ===
const cloudName = 'dyx4w0dr1';
const uploadPreset = 'bose_sweets'; // تأكدي من اسم البريسيت في حسابك

// === State & Data ===
let adminPass = "Aaboohamdy";
let catalog = [];
let galleryData = [];
let siteSettings = {};
let shippingZones = [];
let globalOrders = [];
let catMenu = [];
let tempUploadedImages = [];
let currentEditId = null;

// === Security & Auth ===
function loginAdmin() {
    const input = document.getElementById('admin-pass-input').value;
    if (input === adminPass) {
        document.getElementById('auth-overlay').classList.add('opacity-0');
        setTimeout(() => {
            document.getElementById('auth-overlay').classList.add('hidden');
            document.getElementById('admin-dashboard-content').classList.remove('opacity-0', 'pointer-events-none');
            showSystemToast('مرحباً بك في مركز قيادة حلويات بوسي 👑', 'success');
            loadAdminData();
        }, 500);
    } else {
        showSystemToast('رمز المرور غير صحيح ❌', 'error');
    }
}

function logoutAdmin() {
    document.getElementById('admin-dashboard-content').classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
        document.getElementById('auth-overlay').classList.remove('hidden');
        setTimeout(() => document.getElementById('auth-overlay').classList.remove('opacity-0'), 50);
        document.getElementById('admin-pass-input').value = '';
    }, 500);
}

function changeAdminPassword() {
    const curr = document.getElementById('sec-current-pwd').value;
    const newP = document.getElementById('sec-new-pwd').value;
    const conf = document.getElementById('sec-confirm-pwd').value;
    
    if (curr !== adminPass) { showSystemToast('الرمز الحالي غير صحيح', 'error'); return; }
    if (newP.length < 6) { showSystemToast('الرمز الجديد يجب أن يكون 6 أحرف على الأقل', 'error'); return; }
    if (newP !== conf) { showSystemToast('الرموز غير متطابقة', 'error'); return; }
    
    adminPass = newP;
    db.collection('settings').doc('security').set({ adminPassword: adminPass }, {merge: true});
    showSystemToast('تم تغيير رمز المرور بنجاح 🔒', 'success');
    document.getElementById('sec-current-pwd').value = '';
    document.getElementById('sec-new-pwd').value = '';
    document.getElementById('sec-confirm-pwd').value = '';
}

// === UI & Navigation ===
function toggleAdminSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-sidebar-overlay');
    sidebar.classList.toggle('translate-x-full');
    overlay.classList.toggle('hidden');
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => {
        el.classList.remove('block');
        el.classList.add('hidden');
    });
    document.getElementById('admin-' + tabId).classList.remove('hidden');
    document.getElementById('admin-' + tabId).classList.add('block');
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        if(btn.dataset.target === 'admin-' + tabId) {
            btn.classList.add('bg-pink-500', 'text-white');
            btn.classList.remove('text-gray-400', 'hover:bg-gray-700', 'text-amber-400', 'text-pink-400');
        } else {
            btn.classList.remove('bg-pink-500', 'text-white');
            if (btn.dataset.target === 'admin-theme') btn.classList.add('text-amber-400', 'hover:bg-gray-700');
            else if (btn.dataset.target === 'admin-cakebuilder') btn.classList.add('text-pink-400', 'hover:bg-gray-700');
            else btn.classList.add('text-gray-400', 'hover:bg-gray-700');
        }
    });
    if(window.innerWidth < 768) toggleAdminSidebar();
}

function showSystemToast(message, type = 'info') {
    const toast = document.getElementById('system-toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    msgEl.innerText = message;
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm max-w-[90vw] text-center border border-gray-700 toast-enter ${type === 'error' ? 'bg-red-900' : (type === 'success' ? 'bg-emerald-800' : 'bg-gray-900')}`;
    iconEl.setAttribute('data-lucide', type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info'));
    lucide.createIcons();
    setTimeout(() => { toast.classList.replace('flex', 'hidden'); toast.classList.remove('toast-enter'); }, 4000);
}

// === Data Loading ===
async function loadAdminData() {
    try {
        const catSnap = await db.collection('catalog').get();
        catalog = []; catSnap.forEach(doc => catalog.push(doc.data()));
        
        const setSnap = await db.collection('settings').doc('main').get();
        if(setSnap.exists) siteSettings = setSnap.data();
        
        const secSnap = await db.collection('settings').doc('security').get();
        if(secSnap.exists && secSnap.data().adminPassword) adminPass = secSnap.data().adminPassword;

        const shipSnap = await db.collection('shipping').get();
        shippingZones = []; shipSnap.forEach(doc => shippingZones.push(doc.data()));

        const ordSnap = await db.collection('orders').orderBy('timestamp', 'desc').limit(100).get();
        globalOrders = []; ordSnap.forEach(doc => globalOrders.push(doc.data()));

        const galSnap = await db.collection('gallery').orderBy('timestamp', 'desc').get();
        galleryData = []; galSnap.forEach(doc => galleryData.push(doc.data()));

        if (siteSettings.catMenu) { catMenu = siteSettings.catMenu; } 
        else { catMenu = [...new Set(catalog.map(p => p.category))].filter(Boolean); if(!catMenu.includes('تورت')) catMenu.unshift('تورت'); }

        populateSettingsUI();
        renderAdminMenu();
        renderShippingZones();
        renderAdminOrders();
        renderAdminGallery();
        renderAdminCakeBuilder();
        renderAdminCategories();
        updateDashboardStats();

    } catch (error) {
        console.error("Error loading admin data:", error);
        showSystemToast('حدث خطأ في تحميل البيانات من السحابة', 'error');
    }
}

function updateDashboardStats() {
    document.getElementById('admin-stat-products').innerText = catalog.length;
    document.getElementById('admin-stat-orders').innerText = globalOrders.length;
    const rev = globalOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total || 0), 0);
    document.getElementById('admin-stat-revenue').innerText = rev + ' ج.م';
}

// === Theme & Settings ===
function populateSettingsUI() {
    document.getElementById('set-brand').value = siteSettings.brandName || "حلويات بوسي";
    document.getElementById('set-hero-title').value = siteSettings.heroTitle || "";
    document.getElementById('set-hero-desc').value = siteSettings.heroDesc || "";
    document.getElementById('set-footer-phone').value = siteSettings.footerPhone || "";
    document.getElementById('set-footer-address').value = siteSettings.footerAddress || "";
    document.getElementById('set-footer-quote').value = siteSettings.footerQuote || "";
    
    if(siteSettings.productLayout === 'full') document.getElementById('set-layout-full').checked = true;
    else document.getElementById('set-layout-grid').checked = true;

    document.getElementById('set-ticker-active').checked = siteSettings.tickerActive !== false;
    document.getElementById('set-ticker-text').value = siteSettings.tickerText || "";
    document.getElementById('set-ticker-speed').value = siteSettings.tickerSpeed || 20;
    document.getElementById('ticker-speed-val').innerText = (siteSettings.tickerSpeed || 20) + 's';
    document.getElementById('set-ticker-font').value = siteSettings.tickerFont || "'Cairo', sans-serif";

    document.getElementById('set-brand-color').value = siteSettings.brandColorHex || "#ec4899";
    document.getElementById('set-brand-color-text').value = siteSettings.brandColorHex || "#ec4899";
    document.getElementById('set-bg-color').value = siteSettings.bgColor || "#ffffff";
    document.getElementById('set-bg-color-text').value = siteSettings.bgColor || "#ffffff";
    document.getElementById('set-text-color').value = siteSettings.textColor || "#663b3b";
    document.getElementById('set-text-color-text').value = siteSettings.textColor || "#663b3b";
    
    document.getElementById('set-font').value = siteSettings.fontFamily || "'Cairo', sans-serif";
    document.getElementById('set-font-size').value = siteSettings.baseFontSize || 16;
    document.getElementById('font-size-val').innerText = (siteSettings.baseFontSize || 16) + 'px';
    document.getElementById('set-font-weight').value = siteSettings.baseFontWeight || 400;

    // Link text inputs to color pickers
    ['brand-color', 'bg-color', 'text-color'].forEach(id => {
        document.getElementById(`set-${id}`).addEventListener('input', (e) => { document.getElementById(`set-${id}-text`).value = e.target.value.toUpperCase(); });
        document.getElementById(`set-${id}-text`).addEventListener('input', (e) => { if(/^#[0-9A-F]{6}$/i.test(e.target.value)) document.getElementById(`set-${id}`).value = e.target.value; });
    });
}

function updateLiveThemePreview() {
    // Optional: Could send postMessage to the main window if in an iframe, or just save.
}

async function saveStoreSettings() {
    siteSettings.brandName = document.getElementById('set-brand').value;
    siteSettings.heroTitle = document.getElementById('set-hero-title').value;
    siteSettings.heroDesc = document.getElementById('set-hero-desc').value;
    siteSettings.footerPhone = document.getElementById('set-footer-phone').value;
    siteSettings.footerAddress = document.getElementById('set-footer-address').value;
    siteSettings.footerQuote = document.getElementById('set-footer-quote').value;
    siteSettings.productLayout = document.getElementById('set-layout-full').checked ? 'full' : 'grid';
    
    siteSettings.tickerActive = document.getElementById('set-ticker-active').checked;
    siteSettings.tickerText = document.getElementById('set-ticker-text').value;
    siteSettings.tickerSpeed = document.getElementById('set-ticker-speed').value;
    siteSettings.tickerFont = document.getElementById('set-ticker-font').value;

    siteSettings.brandColorHex = document.getElementById('set-brand-color').value;
    siteSettings.bgColor = document.getElementById('set-bg-color').value;
    siteSettings.textColor = document.getElementById('set-text-color').value;
    siteSettings.fontFamily = document.getElementById('set-font').value;
    siteSettings.baseFontSize = parseInt(document.getElementById('set-font-size').value);
    siteSettings.baseFontWeight = parseInt(document.getElementById('set-font-weight').value);

    try {
        await db.collection('settings').doc('main').set(siteSettings, {merge: true});
        showSystemToast('تم حفظ إعدادات المتجر بنجاح سحابياً ✨', 'success');
    } catch(e) { showSystemToast('خطأ في الحفظ', 'error'); }
}

// === Backup & Restore ===
function exportBackupJSON() {
    const fullData = {
        catalog: catalog,
        settings: siteSettings,
        shipping: shippingZones,
        orders: globalOrders,
        gallery: galleryData,
        adminPassword: adminPass,
        catMenu: catMenu
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `BoseSweets_Backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    showSystemToast('تم تحميل النسخة الاحتياطية بنجاح 📦', 'success');
}

function importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(data.catalog) { catalog = data.catalog; catalog.forEach(p => db.collection('catalog').doc(String(p.id)).set(p)); }
            if(data.settings) { siteSettings = data.settings; db.collection('settings').doc('main').set(siteSettings); }
            if(data.shipping) { shippingZones = data.shipping; shippingZones.forEach(z => db.collection('shipping').doc(String(z.id)).set(z)); }
            if(data.gallery) { galleryData = data.gallery; galleryData.forEach(g => db.collection('gallery').doc(String(g.id)).set(g)); }
            if(data.catMenu) { catMenu = data.catMenu; db.collection('settings').doc('main').set({catMenu: catMenu}, {merge:true}); }
            showSystemToast('تم استيراد البيانات ورفعها للسحابة بنجاح ☁️', 'success');
            setTimeout(() => location.reload(), 2000);
        } catch(err) { showSystemToast('الملف غير صالح', 'error'); }
    };
    reader.readAsText(file);
}

// === Catalog Management ===
function renderAdminMenu(searchTerm = '') {
    const tbody = document.getElementById('admin-menu-tbody');
    let filtered = catalog;
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = catalog.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)));
    }
    
    tbody.innerHTML = filtered.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : (p.img || '');
        return `
        <tr class="hover:bg-gray-800 transition-colors">
            <td class="p-4"><img src="${img}" class="w-12 h-12 object-cover rounded-lg border border-gray-600"></td>
            <td class="p-4"><span class="bg-gray-700 px-2 py-1 rounded-md text-xs">${escapeHTML(p.category)}</span></td>
            <td class="p-4"><p class="font-bold text-gray-200">${escapeHTML(p.name)}</p><p class="text-[10px] ${p.inStock === false ? 'text-red-400' : 'text-emerald-400'}">${p.inStock === false ? 'نفدت الكمية' : 'متوفر'}</p></td>
            <td class="p-4 font-mono text-pink-400">${p.price} ج.م</td>
            <td class="p-4 text-xs text-amber-400">${p.badge || '---'}</td>
            <td class="p-4 text-center">
                <button onclick="editProduct('${p.id}')" class="text-blue-400 mx-1 p-2 hover:bg-gray-700 rounded-lg"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button onclick="deleteProduct('${p.id}')" class="text-red-400 mx-1 p-2 hover:bg-gray-700 rounded-lg"><i data-lucide="trash" class="w-4 h-4"></i></button>
            </td>
        </tr>`;
    }).join('');
    lucide.createIcons();
    updateDashboardStats();
}

function openAddProductModal() {
    currentEditId = null;
    document.getElementById('edit-prod-id').value = '';
    document.getElementById('edit-prod-name').value = '';
    document.getElementById('edit-prod-price').value = '';
    document.getElementById('edit-prod-cat').value = 'جاتوهات';
    document.getElementById('edit-prod-sub').value = '';
    document.getElementById('edit-prod-desc').value = '';
    document.getElementById('edit-prod-badge').value = '';
    document.getElementById('edit-prod-layout').value = 'default';
    document.getElementById('edit-prod-instock').checked = true;
    tempUploadedImages = [];
    renderTempImages();
    document.getElementById('prod-modal-title').innerText = 'إضافة منتج جديد';
    document.getElementById('admin-prod-modal').classList.remove('hidden');
    document.getElementById('admin-prod-modal').classList.add('flex');
}

function editProduct(id) {
    const prod = catalog.find(p => String(p.id) === String(id));
    if (!prod) return;
    currentEditId = id;
    document.getElementById('edit-prod-id').value = prod.id;
    document.getElementById('edit-prod-name').value = prod.name || '';
    document.getElementById('edit-prod-price').value = prod.price || 0;
    document.getElementById('edit-prod-cat').value = prod.category || 'جاتوهات';
    document.getElementById('edit-prod-sub').value = prod.subType || '';
    document.getElementById('edit-prod-desc').value = prod.desc || '';
    document.getElementById('edit-prod-badge').value = prod.badge || '';
    document.getElementById('edit-prod-layout').value = prod.layout || 'default';
    document.getElementById('edit-prod-instock').checked = prod.inStock !== false;
    tempUploadedImages = (prod.images && prod.images.length > 0) ? [...prod.images] : (prod.img ? [prod.img] : []);
    renderTempImages();
    document.getElementById('prod-modal-title').innerText = 'تعديل المنتج';
    document.getElementById('admin-prod-modal').classList.remove('hidden');
    document.getElementById('admin-prod-modal').classList.add('flex');
}

function closeProdModal() {
    document.getElementById('admin-prod-modal').classList.add('hidden');
    document.getElementById('admin-prod-modal').classList.remove('flex');
}

function renderTempImages() {
    const container = document.getElementById('edit-prod-images-container');
    container.innerHTML = tempUploadedImages.map((url, idx) => `
        <div class="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-600">
            <img src="${url}" class="w-full h-full object-cover">
            <button onclick="removeTempImg(${idx})" class="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

function removeTempImg(idx) { tempUploadedImages.splice(idx, 1); renderTempImages(); }

async function compressAndUploadMultiImage(event) {
    const file = event.target.files[0]; if (!file) return;
    const spinner = document.getElementById('uploading-spinner'); spinner.classList.remove('hidden');
    
    // Simple compression via Canvas
    const img = new Image(); img.src = URL.createObjectURL(file);
    await new Promise(r => img.onload = r);
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
    const MAX_WIDTH = 800; let width = img.width, height = img.height;
    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
    canvas.width = width; canvas.height = height; ctx.drawImage(img, 0, 0, width, height);
    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
        const formData = new FormData();
        formData.append('file', compressedDataUrl); formData.append('upload_preset', uploadPreset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.secure_url) { tempUploadedImages.push(data.secure_url); renderTempImages(); }
    } catch(err) { showSystemToast('فشل الرفع للسحابة', 'error'); }
    spinner.classList.add('hidden');
}

async function saveProductData() {
    const id = document.getElementById('edit-prod-id').value || Date.now().toString();
    const prod = {
        id: id,
        name: document.getElementById('edit-prod-name').value,
        price: Number(document.getElementById('edit-prod-price').value),
        category: document.getElementById('edit-prod-cat').value,
        subType: document.getElementById('edit-prod-sub').value,
        desc: document.getElementById('edit-prod-desc').value,
        badge: document.getElementById('edit-prod-badge').value,
        layout: document.getElementById('edit-prod-layout').value,
        inStock: document.getElementById('edit-prod-instock').checked,
        images: [...tempUploadedImages],
        img: tempUploadedImages.length > 0 ? tempUploadedImages[0] : ''
    };
    
    try {
        await db.collection('catalog').doc(String(id)).set(prod);
        if (currentEditId) { const idx = catalog.findIndex(p => String(p.id) === String(id)); if(idx > -1) catalog[idx] = prod; } 
        else { catalog.unshift(prod); }
        renderAdminMenu(); closeProdModal(); showSystemToast('تم حفظ المنتج سحابياً', 'success');
    } catch(e) { showSystemToast('فشل الحفظ', 'error'); }
}

async function deleteProduct(id) {
    if(!confirm('هل أنت متأكد من حذف المنتج نهائياً؟')) return;
    try {
        await db.collection('catalog').doc(String(id)).delete();
        catalog = catalog.filter(p => String(p.id) !== String(id));
        renderAdminMenu(); showSystemToast('تم الحذف', 'success');
    } catch(e) { showSystemToast('فشل الحذف', 'error'); }
}

// === Smart Gemini AI Description ===
async function generateSmartDescription() {
    const prodName = document.getElementById('edit-prod-name').value;
    const prodCat = document.getElementById('edit-prod-cat').value;
    const descField = document.getElementById('edit-prod-desc');
    
    if (!prodName) { showSystemToast('يرجى كتابة اسم المنتج أولاً', 'error'); return; }
    descField.value = "جاري التفكير وكتابة الوصف... 🧠✨";
    
    try {
        const apiKey = "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc"; // Same key used in old code
        const promptText = `أنت كاتب إعلانات محترف لعلامة تجارية مصرية راقية اسمها "حلويات بوسي"
        اكتب وصف قصير وجذاب لمنتج اسمه "${prodName}" من قسم "${prodCat}"
        الشروط: لهجة مصرية عامية راقية، بدون علامات ترقيم، استخدم إيموجي تخدم المعنى، لا يتعدى سطرين.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            descField.value = data.candidates[0].content.parts[0].text.trim();
            showSystemToast('تم التوليد بنجاح! 👑', 'success');
        } else { descField.value = ""; showSystemToast('فشل التوليد، حاول مرة أخرى', 'error'); }
    } catch (error) { descField.value = ""; showSystemToast("حدث خطأ في الاتصال بالذكاء الاصطناعي", "error"); }
}

// === Shipping Management ===
function renderShippingZones() {
    const tbody = document.getElementById('admin-shipping-tbody');
    tbody.innerHTML = shippingZones.map(z => `
        <tr class="hover:bg-gray-800">
            <td class="p-4 text-gray-200">${escapeHTML(z.name)}</td>
            <td class="p-4 font-mono text-pink-400">${z.fee}</td>
            <td class="p-4 text-center"><button onclick="deleteShippingZone('${z.id}')" class="text-red-400 p-2 hover:bg-gray-700 rounded-lg"><i data-lucide="trash" class="w-4 h-4"></i></button></td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function openAddShippingModal() {
    document.getElementById('ship-area-name').value = '';
    document.getElementById('ship-area-fee').value = '';
    document.getElementById('admin-ship-modal').classList.remove('hidden');
    document.getElementById('admin-ship-modal').classList.add('flex');
}
function closeShipModal() {
    document.getElementById('admin-ship-modal').classList.add('hidden');
    document.getElementById('admin-ship-modal').classList.remove('flex');
}

async function saveShippingZone() {
    const n = document.getElementById('ship-area-name').value;
    const f = document.getElementById('ship-area-fee').value;
    if(!n || f==='') return;
    const zone = { id: 'sh_' + Date.now(), name: n, fee: Number(f) };
    try {
        await db.collection('shipping').doc(zone.id).set(zone);
        shippingZones.push(zone); renderShippingZones(); closeShipModal(); showSystemToast('تم إضافة المنطقة', 'success');
    } catch(e) { showSystemToast('فشل الإضافة', 'error'); }
}

async function deleteShippingZone(id) {
    try {
        await db.collection('shipping').doc(String(id)).delete();
        shippingZones = shippingZones.filter(z => String(z.id) !== String(id));
        renderShippingZones(); showSystemToast('تم الحذف', 'success');
    } catch(e) {}
}

// === Gallery Management ===
function renderAdminGallery() {
    const grid = document.getElementById('admin-gallery-grid');
    grid.innerHTML = galleryData.map(g => `
        <div class="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-600 group">
            <img src="${g.url}" class="w-full h-full object-cover">
            <button onclick="deleteGalleryImage('${g.id}')" class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="trash" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

async function uploadGalleryToCloud(event) {
    const file = event.target.files[0]; if (!file) return;
    document.getElementById('gallery-upload-loader').classList.remove('hidden');
    const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', uploadPreset);
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.secure_url) {
            const item = { id: 'gal_' + Date.now(), url: data.secure_url, timestamp: Date.now() };
            await db.collection('gallery').doc(item.id).set(item);
            galleryData.unshift(item); renderAdminGallery(); showSystemToast('تم رفع الصورة', 'success');
        }
    } catch(e) { showSystemToast('فشل الرفع', 'error'); }
    document.getElementById('gallery-upload-loader').classList.add('hidden');
}

async function deleteGalleryImage(id) {
    if(!confirm('حذف الصورة؟')) return;
    try {
        await db.collection('gallery').doc(String(id)).delete();
        galleryData = galleryData.filter(g => String(g.id) !== String(id));
        renderAdminGallery();
    } catch(e) {}
}

// === Cake Builder Management ===
function renderAdminCakeBuilder() {
    const c = siteSettings.cakeBuilder || {};
    document.getElementById('set-cake-base-price').value = c.basePrice || 145;
    document.getElementById('set-cake-desc').value = c.desc || '';
    document.getElementById('set-cake-min-sq').value = c.minSquare || 16;
    document.getElementById('set-cake-min-rect').value = c.minRect || 20;
    
    const prints = c.imagePrinting || [];
    const edible = prints.find(p => p.label === 'صورة قابلة للأكل');
    const nonedible = prints.find(p => p.label === 'صورة غير قابلة للأكل');
    document.getElementById('set-print-edible').value = edible ? edible.price : 60;
    document.getElementById('set-print-nonedible').value = nonedible ? nonedible.price : 20;

    tempCakeImages = c.images ? [...c.images] : [];
    tempCakeFlavors = c.flavors ? [...c.flavors] : ['فانيليا'];
    
    renderCakeImagesUI();
    renderCakeFlavorsUI();
}

function renderCakeImagesUI() {
    const c = document.getElementById('admin-cake-images-list');
    c.innerHTML = tempCakeImages.map((url, idx) => `
        <div class="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-600">
            <img src="${url}" class="w-full h-full object-cover">
            <button onclick="removeCakeImg(${idx})" class="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

async function uploadCakeImage(e) {
    const file = e.target.files[0]; if(!file) return;
    document.getElementById('cake-upload-spinner').classList.remove('hidden');
    const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', uploadPreset);
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.secure_url) { tempCakeImages.push(data.secure_url); renderCakeImagesUI(); }
    } catch(e) {}
    document.getElementById('cake-upload-spinner').classList.add('hidden');
}
function removeCakeImg(idx) { tempCakeImages.splice(idx, 1); renderCakeImagesUI(); }

function renderCakeFlavorsUI() {
    const c = document.getElementById('admin-cake-flavors-list');
    c.innerHTML = tempCakeFlavors.map((fl, idx) => `<span class="bg-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">${fl} <button onclick="removeCakeFlavor(${idx})" class="text-red-400 hover:text-red-300"><i data-lucide="x" class="w-3 h-3"></i></button></span>`).join('');
    lucide.createIcons();
}
function addCakeFlavor() { const v = document.getElementById('new-flavor-input').value; if(v) { tempCakeFlavors.push(v); document.getElementById('new-flavor-input').value = ''; renderCakeFlavorsUI(); } }
function removeCakeFlavor(idx) { tempCakeFlavors.splice(idx, 1); renderCakeFlavorsUI(); }

async function saveCakeBuilderSettings() {
    const c = {
        basePrice: Number(document.getElementById('set-cake-base-price').value),
        desc: document.getElementById('set-cake-desc').value,
        minSquare: Number(document.getElementById('set-cake-min-sq').value),
        minRect: Number(document.getElementById('set-cake-min-rect').value),
        flavors: tempCakeFlavors,
        images: tempCakeImages,
        imagePrinting: [
            { label: 'بدون', price: 0 },
            { label: 'صورة قابلة للأكل', price: Number(document.getElementById('set-print-edible').value) },
            { label: 'صورة غير قابلة للأكل', price: Number(document.getElementById('set-print-nonedible').value) }
        ]
    };
    siteSettings.cakeBuilder = c;
    try { await db.collection('settings').doc('main').set({cakeBuilder: c}, {merge: true}); showSystemToast('تم حفظ إعدادات التورت', 'success'); } catch(e){}
}

// === Categories Management ===
function renderAdminCategories() {
    const c = document.getElementById('admin-categories-list');
    c.innerHTML = catMenu.map((cat, idx) => `
        <div class="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-700">
            <span class="font-bold">${cat}</span>
            <button onclick="removeCategory(${idx})" class="text-red-400 hover:bg-gray-800 p-2 rounded-lg"><i data-lucide="trash" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}
function addNewCategory() {
    const v = document.getElementById('new-category-input').value.trim();
    if(v && !catMenu.includes(v)) { catMenu.push(v); document.getElementById('new-category-input').value = ''; renderAdminCategories(); }
}
function removeCategory(idx) { catMenu.splice(idx, 1); renderAdminCategories(); }
async function saveCategoriesToCloud() {
    try { await db.collection('settings').doc('main').set({catMenu: catMenu}, {merge:true}); showSystemToast('تم حفظ الأقسام', 'success'); } catch(e){}
}

// === Orders Management ===
function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-tbody');
    tbody.innerHTML = globalOrders.map(o => `
        <tr class="hover:bg-gray-800 border-b border-gray-700">
            <td class="p-4 font-mono text-pink-400">${o.id}</td>
            <td class="p-4 text-xs text-gray-400">${o.date}</td>
            <td class="p-4"><p class="font-bold text-gray-200">${escapeHTML(o.name)}</p><p class="text-[10px] text-gray-400">${o.phone}</p><p class="text-[10px] text-blue-300">${o.area}</p></td>
            <td class="p-4"><button onclick="alert('${escapeHTML(o.notes || 'لا يوجد ملاحظات')}')" class="text-xs bg-gray-700 px-2 py-1 rounded">عرض التفاصيل</button></td>
            <td class="p-4 font-mono text-emerald-400">${o.total} ج.م</td>
            <td class="p-4 text-xs ${o.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'}">${o.status === 'pending' ? 'جديد' : o.status}</td>
            <td class="p-4 text-center"><button onclick="deleteOrder('${o.id}')" class="text-red-500 hover:bg-gray-700 p-2 rounded-lg"><i data-lucide="trash" class="w-4 h-4"></i></button></td>
        </tr>
    `).join('');
    lucide.createIcons();
}
async function deleteOrder(id) {
    if(!confirm('حذف الطلب؟')) return;
    try { await db.collection('orders').doc(String(id)).delete(); globalOrders = globalOrders.filter(o => String(o.id) !== String(id)); renderAdminOrders(); updateDashboardStats(); } catch(e){}
}

// Utility
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&', '<': '<', '>': '>', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
