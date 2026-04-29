// === BoseSweets Admin: Smart Command Center & Theme Engine ===
const db = firebase.firestore();
let fullCatalog = []; 
let siteSettings = {};

// 1. الدخول الآمن وتحميل البيانات
async function loginAdmin() {
    const pass = document.getElementById('admin-pass-input').value;
    if(pass === "Aaboohamdy") { // رمز المرور الملكي الأصلي
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('admin-dashboard-content').classList.remove('opacity-0', 'pointer-events-none');
        document.body.style.overflow = 'auto';
        await loadAdminData();
    } else {
        alert("رمز المرور غير صحيح يا فندم ❌");
    }
}

async function loadAdminData() {
    try {
        // جلب الكتالوج الكامل للإدارة
        const catSnap = await db.collection('catalog').get();
        fullCatalog = [];
        catSnap.forEach(doc => fullCatalog.push({ id: doc.id, ...doc.data() }));

        // جلب إعدادات الهوية والألوان
        const setSnap = await db.collection('settings').doc('main').get();
        if(setSnap.exists) siteSettings = setSnap.data();

        renderEverything();
        document.getElementById('admin-stat-products').innerText = fullCatalog.length;
    } catch (error) { 
        console.error("Admin Load Error:", error);
    }
}

// 2. محرك الكتالوج الذكي (البحث والترتيب السريع)
function renderAdminMenu(filterText = '', filterCat = 'الكل') {
    const tbody = document.getElementById('admin-menu-tbody');
    if(!tbody) return;

    // فلترة ذكية لسهولة الوصول
    let filtered = fullCatalog.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(filterText.toLowerCase());
        const matchesCat = (filterCat === 'الكل' || p.category === filterCat);
        return matchesSearch && matchesCat;
    });

    // ترتيب أبجدي تلقائي لتسهيل البحث البصري
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    tbody.innerHTML = filtered.map(p => `
        <tr class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors group">
            <td class="p-4"><img src="${p.img}" class="w-12 h-12 rounded-xl object-cover border border-gray-700"></td>
            <td class="p-4">
                <div class="font-black text-white">${p.name}</div>
                <div class="text-[10px] text-pink-400 font-bold uppercase">${p.category}</div>
            </td>
            <td class="p-4 text-pink-500 font-black text-lg">${p.price} ج.م</td>
            <td class="p-4 text-left">
                <div class="flex gap-2 justify-end">
                    <button onclick="openEditModal('${p.id}')" class="p-2 bg-gray-700 hover:bg-pink-600 rounded-lg transition-all">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteProduct('${p.id}')" class="p-2 bg-gray-700 hover:bg-red-600 rounded-lg transition-all">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

// 3. إدارة الهوية البصرية (درجات البمبي والخطوط)
async function saveStoreSettings() {
    const settings = {
        brandName: document.getElementById('set-brand').value,
        brandColorHex: document.getElementById('set-brand-color').value, // التحكم في درجة البمبي
        bgColor: document.getElementById('set-bg-color').value,
        textColor: document.getElementById('set-text-color').value,
        fontFamily: document.getElementById('set-font').value,
        baseFontSize: document.getElementById('set-font-size').value,
        tickerText: document.getElementById('set-ticker-text').value,
        tickerSpeed: document.getElementById('set-ticker-speed').value + 's'
    };

    try {
        await db.collection('settings').doc('main').set(settings, {merge: true});
        alert("تم حفظ إعدادات الهوية الملكية وتطبيق الألوان بنجاح! 👑🌸");
        location.reload(); 
    } catch (e) {
        alert("حدث خطأ أثناء الحفظ");
    }
}

// 4. وظائف التنظيم والتحكم
function renderEverything() {
    renderAdminMenu();
    setupCatalogListeners();
    // تفعيل التبويبات الأصلية
    const tabs = document.querySelectorAll('.admin-tab-btn');
    tabs.forEach(btn => {
        btn.onclick = () => switchAdminTab(btn.dataset.target.replace('admin-', ''));
    });
}

function setupCatalogListeners() {
    const searchInput = document.getElementById('admin-catalog-search');
    const catFilter = document.getElementById('admin-catalog-filter');
    if(searchInput) searchInput.oninput = (e) => renderAdminMenu(e.target.value, catFilter.value);
    if(catFilter) catFilter.onchange = (e) => renderAdminMenu(searchInput.value, e.target.value);
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('admin-' + tabId)?.classList.remove('hidden');
    // تحديث شكل الأزرار النشطة
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-pink-500', 'text-white');
        if(btn.dataset.target === 'admin-' + tabId) btn.classList.add('bg-pink-500', 'text-white');
    });
}

// دالة تسجيل الخروج لضمان الأمان
function logoutAdmin() {
    location.reload();
}

window.onload = () => { if (window.lucide) lucide.createIcons(); };
