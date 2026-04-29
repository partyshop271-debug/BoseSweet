// === BoseSweets Admin: Full Control Recovery ===
const db = firebase.firestore();
let catalog = []; let siteSettings = {};

async function loadAdminData() {
    try {
        const catSnap = await db.collection('catalog').get();
        catalog = [];
        catSnap.forEach(doc => catalog.push(doc.data()));

        const setSnap = await db.collection('settings').doc('main').get();
        if(setSnap.exists) siteSettings = setSnap.data();

        renderEverything();
        document.getElementById('admin-stat-products').innerText = catalog.length;
    } catch (error) { alert("خطأ في الاتصال بالسحابة"); }
}

function renderEverything() {
    renderAdminMenu();
    // تشغيل التبويبات
    const tabs = document.querySelectorAll('.admin-tab-btn');
    tabs.forEach(btn => {
        btn.onclick = () => switchAdminTab(btn.dataset.target.replace('admin-', ''));
    });
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => {
        el.classList.add('hidden'); el.classList.remove('block');
    });
    document.getElementById('admin-' + tabId)?.classList.remove('hidden');
    document.getElementById('admin-' + tabId)?.classList.add('block');
}

function toggleAdminSidebar() {
    const sb = document.getElementById('admin-sidebar');
    sb.classList.toggle('translate-x-full');
}

// دالة تسجيل الدخول التي تستدعي البيانات
function loginAdmin() {
    const pass = document.getElementById('admin-pass-input').value;
    if(pass === "Aaboohamdy") {
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('admin-dashboard-content').classList.remove('opacity-0', 'pointer-events-none');
        document.body.style.overflow = 'auto';
        loadAdminData();
    }
}

function renderAdminMenu() {
    const tbody = document.getElementById('admin-menu-tbody');
    if(!tbody) return;
    tbody.innerHTML = catalog.map(p => `
        <tr class="border-b border-gray-800">
            <td class="p-4"><img src="${p.img}" class="w-10 h-10 rounded-lg"></td>
            <td class="p-4 font-bold">${p.name}</td>
            <td class="p-4 text-pink-500">${p.price} ج.م</td>
        </tr>
    `).join('');
}
