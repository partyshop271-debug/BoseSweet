let adminCurrentCat = 'all';
let adminOrderFilter = 'all';
let tempProdImages = []; 
let currentEditId = null;

function toggleAdminSidebar() {
    const sb = document.getElementById('admin-sidebar'); const ov = document.getElementById('admin-sidebar-overlay');
    if(sb.classList.contains('translate-x-full')) { sb.classList.remove('translate-x-full'); ov.classList.remove('hidden'); } 
    else { sb.classList.add('translate-x-full'); ov.classList.add('hidden'); }
}

function openAdminDashboardDirectly() {
    renderAdminCatalogTabs();
    renderAdminOrderFilters(); 
    renderAdminCategories();
    renderAdminOverview(); 
    renderAdminOrders(); 
    renderAdminMenu(); 
    renderAdminShipping(); 
    if(typeof renderAdminGallery === 'function') renderAdminGallery(); 
    fillAdminSettingsForm();
    lucide.createIcons();
}

function closeAdminDashboard() {
    sessionStorage.removeItem('bosy_admin_auth');
    window.location.href = 'index.html';
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => { el.classList.add('hidden'); el.classList.remove('block'); });
    document.querySelectorAll('.admin-tab-btn').forEach(btn => { btn.classList.remove('bg-pink-500', 'text-white'); btn.classList.add('text-gray-400'); });
    document.getElementById(`admin-${tabId}`).classList.remove('hidden'); document.getElementById(`admin-${tabId}`).classList.add('block');
    event.currentTarget.classList.add('bg-pink-500', 'text-white'); event.currentTarget.classList.remove('text-gray-400');
    if(window.innerWidth < 768) { toggleAdminSidebar(); }
}

function exportBackupJSON() {
    try {
        const backupData = { catalog, settings: siteSettings, shipping: shippingZones, orders: globalOrders, gallery: galleryData };
        const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `BoseSweets_CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 100);
        showSystemToast("تم سحب نسخة سحابية بنجاح", "success");
    } catch (e) { showSystemToast("حدث خطأ أثناء إعداد ملف النسخة", "error"); }
}

function importBackupJSON(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(ev) {
        try {
            const data = JSON.parse(ev.target.result);
            if (Array.isArray(data)) {
                for (let p of data) await NetworkEngine.safeWrite('catalog', String(p.id), p);
            } else {
                if(data.settings) await NetworkEngine.safeWrite('settings', 'main', data.settings); 
                if(data.shipping) for (let z of data.shipping) await NetworkEngine.safeWrite('shipping', String(z.id), z); 
                if(data.catalog) for (let p of data.catalog) await NetworkEngine.safeWrite('catalog', String(p.id), p); 
                if(data.orders) for (let o of data.orders) await NetworkEngine.safeWrite('orders', String(o.id), o); 
                if(data.gallery) for (let g of data.gallery) await NetworkEngine.safeWrite('gallery', String(g.id), g);
            }
            showSystemToast("تم استرجاع بيانات حلويات بوسي للسحابة بنجاح! جاري إعادة تشغيل النظام...", "success");
            setTimeout(() => location.reload(), 2000);
        } catch(err) { showSystemToast("ملف JSON غير صالح أو تعذر الاتصال بالسحابة!", "error"); }
    };
    reader.readAsText(file);
}

function copyBackupText() {
    try {
        const str = JSON.stringify({ catalog, settings: siteSettings, shipping: shippingZones, orders: globalOrders, gallery: galleryData });
        navigator.clipboard.writeText(str).then(() => { showSystemToast("تم نسخ بيانات النظام", "success"); })
        .catch(err => { const t = document.createElement("textarea"); t.value = str; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); showSystemToast("تم النسخ", "success"); });
    } catch (e) { showSystemToast("فشل النسخ", "error"); }
}

function updateLiveThemePreview() {
    const brandColor = document.getElementById('set-brand-color').value;
    const bgColor = document.getElementById('set-bg-color').value;
    const textColor = document.getElementById('set-text-color').value;
    const fontFamily = document.getElementById('set-font').value;
    const fontSize = document.getElementById('set-font-size').value + 'px';
    const fontWeight = document.getElementById('set-font-weight').value;
    
    const isTickerActive = document.getElementById('set-ticker-active').checked;
    const tickerText = document.getElementById('set-ticker-text').value || "حلويات بوسي: تجربة التذوق الفاخرة...";
    const tickerSpeed = document.getElementById('set-ticker-speed').value + 's';
    const tickerFont = document.getElementById('set-ticker-font').value;
    
    const previewTickerWrap = document.getElementById('preview-ticker-wrap');
    const previewTickerText = document.getElementById('preview-ticker-text');
    const calculatedHue = hexToMathHSL(brandColor);
    
    if(isTickerActive) {
        previewTickerWrap.style.display = 'flex';
        previewTickerWrap.style.background = `linear-gradient(135deg, hsl(${calculatedHue}, 80%, 65%) 0%, hsl(${calculatedHue}, 85%, 75%) 50%, hsl(${calculatedHue}, 90%, 85%) 100%)`;
        previewTickerText.style.color = '#ffffff';
        previewTickerText.style.fontFamily = tickerFont;
        previewTickerText.style.animationDuration = tickerSpeed;
        previewTickerText.innerText = tickerText;
    } else {
        previewTickerWrap.style.display = 'none';
    }
    
    const previewBox = document.getElementById('theme-live-preview');
    const previewBtn = document.getElementById('preview-button');
    
    previewBox.style.backgroundColor = bgColor;
    previewBox.style.color = textColor;
    previewBox.style.fontFamily = fontFamily;
    previewBox.style.fontSize = fontSize;
    previewBox.style.fontWeight = fontWeight;
    previewBtn.style.backgroundImage = `linear-gradient(135deg, hsl(${calculatedHue}, 80%, 65%) 0%, hsl(${calculatedHue}, 85%, 75%) 50%, hsl(${calculatedHue}, 90%, 85%) 100%)`;
}

function syncColorInput(inputId, textId) {
    const colorInput = document.getElementById(inputId);
    const textInput = document.getElementById(textId);
    textInput.removeAttribute('readonly');
    colorInput.addEventListener('input', (e) => { textInput.value = e.target.value.toUpperCase(); updateLiveThemePreview(); });
    textInput.addEventListener('input', (e) => {
        let val = e.target.value.trim(); 
        if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
        if(/^#[0-9A-Fa-f]{6}$/i.test(val)) { colorInput.value = val; updateLiveThemePreview(); }
    });
    textInput.addEventListener('blur', (e) => {
        let val = e.target.value.trim();
        if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
        if(/^#[0-9A-Fa-f]{6}$/i.test(val)) { colorInput.value = val; e.target.value = val.toUpperCase(); } 
        else { e.target.value = colorInput.value.toUpperCase(); }
        updateLiveThemePreview();
    });
}

function fillAdminSettingsForm() {
    document.getElementById('set-brand').value = siteSettings.brandName; 
    document.getElementById('set-announcement').value = siteSettings.announcement;
    document.getElementById('set-hero-title').value = siteSettings.heroTitle; 
    document.getElementById('set-hero-desc').value = siteSettings.heroDesc;
    document.getElementById('set-footer-phone').value = siteSettings.footerPhone; 
    document.getElementById('set-footer-address').value = siteSettings.footerAddress.replace(/<br>/g, '');
    document.getElementById('set-footer-quote').value = siteSettings.footerQuote; 
    const layout = siteSettings.productLayout || 'grid';
    if(layout === 'full') document.getElementById('set-layout-full').checked = true; else document.getElementById('set-layout-grid').checked = true;

    document.getElementById('set-brand-color').value = siteSettings.brandColorHex || '#ec4899';
    document.getElementById('set-brand-color-text').value = (siteSettings.brandColorHex || '#ec4899').toUpperCase();
    document.getElementById('set-bg-color').value = siteSettings.bgColor || '#ffffff';
    document.getElementById('set-bg-color-text').value = (siteSettings.bgColor || '#ffffff').toUpperCase();
    document.getElementById('set-text-color').value = siteSettings.textColor || '#663b3b';
    document.getElementById('set-text-color-text').value = (siteSettings.textColor || '#663b3b').toUpperCase();
    document.getElementById('set-font').value = siteSettings.fontFamily || "'Cairo', sans-serif";
    document.getElementById('set-font-size').value = siteSettings.baseFontSize || 16;
    document.getElementById('font-size-val').innerText = (siteSettings.baseFontSize || 16) + 'px';
    document.getElementById('set-font-weight').value = siteSettings.baseFontWeight || 400;
    
    document.getElementById('set-ticker-active').checked = siteSettings.tickerActive !== false;
    document.getElementById('set-ticker-text').value = siteSettings.tickerText || siteSettings.announcement;
    document.getElementById('set-ticker-speed').value = siteSettings.tickerSpeed || 20;
    document.getElementById('ticker-speed-val').innerText = (siteSettings.tickerSpeed || 20) + 's';
    document.getElementById('set-ticker-font').value = siteSettings.tickerFont || "'Cairo', sans-serif";

    syncColorInput('set-brand-color', 'set-brand-color-text');
    syncColorInput('set-bg-color', 'set-bg-color-text');
    syncColorInput('set-text-color', 'set-text-color-text');
    
    document.getElementById('set-font-weight').addEventListener('change', updateLiveThemePreview);
    fillCakeBuilderAdmin();
    updateLiveThemePreview();
}

async function saveStoreSettings() {
    siteSettings.brandName = document.getElementById('set-brand').value; 
    siteSettings.announcement = document.getElementById('set-announcement').value;
    siteSettings.heroTitle = document.getElementById('set-hero-title').value; 
    siteSettings.heroDesc = document.getElementById('set-hero-desc').value;
    siteSettings.footerPhone = document.getElementById('set-footer-phone').value; 
    siteSettings.footerAddress = document.getElementById('set-footer-address').value;
    siteSettings.footerQuote = document.getElementById('set-footer-quote').value; 
    siteSettings.productLayout = document.getElementById('set-layout-full').checked ? 'full' : 'grid';

    siteSettings.brandColorHex = document.getElementById('set-brand-color').value;
    siteSettings.bgColor = document.getElementById('set-bg-color').value;
    siteSettings.textColor = document.getElementById('set-text-color').value;
    siteSettings.fontFamily = document.getElementById('set-font').value;
    siteSettings.baseFontSize = parseInt(document.getElementById('set-font-size').value);
    siteSettings.baseFontWeight = parseInt(document.getElementById('set-font-weight').value);
    
    siteSettings.tickerActive = document.getElementById('set-ticker-active').checked;
    siteSettings.tickerText = document.getElementById('set-ticker-text').value;
    siteSettings.tickerSpeed = parseInt(document.getElementById('set-ticker-speed').value);
    siteSettings.tickerFont = document.getElementById('set-ticker-font').value;
    siteSettings.tickerColor = "#ffffff"; 

    try {
        await NetworkEngine.safeWrite('settings', 'main', siteSettings); saveEngineMemory('set'); 
        showSystemToast("تم حفظ الإعدادات بنجاح!", "success");
    } catch(e) { saveEngineMemory('set'); showSystemToast("تم الحفظ محلياً", "info"); }
}

async function changeAdminPassword() {
    const currentInput = document.getElementById('sec-current-pwd').value; 
    const newPwd = document.getElementById('sec-new-pwd').value; 
    const confirmPwd = document.getElementById('sec-confirm-pwd').value;
    if (!currentInput || !newPwd || !confirmPwd) { showSystemToast("يرجى ملء جميع الحقول", "error"); return; }
    try {
        const hashedCurrentInput = await hashPassword(currentInput);
        let isMatch = false;
        if (siteSettings.adminPasswordHash) isMatch = (hashedCurrentInput === siteSettings.adminPasswordHash);
        else if (siteSettings.adminPassword) isMatch = (currentInput === siteSettings.adminPassword);
        else isMatch = (hashedCurrentInput === DEFAULT_ADMIN_HASH);

        if (!isMatch) { showSystemToast("الرمز الحالي غير صحيح", "error"); return; }
        if (newPwd !== confirmPwd) { showSystemToast("الرمز الجديد غير متطابق", "error"); return; }
        if (newPwd.length < 4) { showSystemToast("يجب أن يكون 4 أحرف أو أرقام على الأقل", "error"); return; }
        
        siteSettings.adminPasswordHash = await hashPassword(newPwd);
        if(siteSettings.adminPassword) delete siteSettings.adminPassword; 
        
        await NetworkEngine.safeWrite('settings', 'main', siteSettings); 
        saveEngineMemory('set'); 
        showSystemToast("تم تغيير الرمز وتشفيره بنجاح 🛡️", "success");
        document.getElementById('sec-current-pwd').value = ''; document.getElementById('sec-new-pwd').value = ''; document.getElementById('sec-confirm-pwd').value = '';
    } catch(e) { saveEngineMemory('set'); showSystemToast("تم الحفظ محلياً", "info"); }
}

function renderAdminShipping() {
    document.getElementById('admin-shipping-tbody').innerHTML = shippingZones.map(z => `
        <tr class="hover:bg-gray-800 border-b border-gray-700 transition-colors">
            <td class="p-4 font-bold text-gray-200 whitespace-nowrap">${escapeHTML(z.name)}</td>
            <td class="p-4 font-bold text-emerald-400 whitespace-nowrap">${z.fee}</td>
            <td class="p-4 text-center whitespace-nowrap"><button onclick="deleteShippingZone('${z.id}')" class="text-red-400 hover:text-white p-2 bg-gray-700 hover:bg-red-600 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function openAddShippingModal() { document.getElementById('ship-area-name').value = ''; document.getElementById('ship-area-fee').value = ''; document.getElementById('admin-ship-modal').classList.remove('hidden'); document.getElementById('admin-ship-modal').classList.add('flex'); }
function closeShipModal() { document.getElementById('admin-ship-modal').classList.add('hidden'); document.getElementById('admin-ship-modal').classList.remove('flex'); }

async function saveShippingZone() {
    const n = document.getElementById('ship-area-name').value.trim(); const f = parseInt(document.getElementById('ship-area-fee').value) || 0;
    if(!n) { showSystemToast("اكتب اسم المنطقة", "error"); return; }
    const newZone = { id: 'sh_' + generateUniqueID(), name: n, fee: f }; shippingZones.push(newZone);
    try { await NetworkEngine.safeWrite('shipping', String(newZone.id), newZone); saveEngineMemory('ship'); showSystemToast("تم الإضافة بنجاح", "success"); } 
    catch (e) { saveEngineMemory('ship'); showSystemToast("تم الإضافة محلياً", "info"); }
    closeShipModal(); renderAdminShipping();
}

async function deleteShippingZone(id) {
    if(confirm("حذف هذه المنطقة؟")) {
        shippingZones = shippingZones.filter(z => String(z.id) !== String(id));
        try { await NetworkEngine.safeDelete('shipping', String(id)); saveEngineMemory('ship'); showSystemToast("تم الحذف", "success"); } 
        catch(e) { saveEngineMemory('ship'); }
        renderAdminShipping();
    }
}

function renderAdminOverview() {
    document.getElementById('admin-stat-products').innerText = catalog.length;
    const validOrders = globalOrders.filter(o => o.status !== 'cancelled');
    document.getElementById('admin-stat-orders').innerText = validOrders.length;
    document.getElementById('admin-stat-revenue').innerText = validOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0).toLocaleString('ar-EG') + ' ج.م';
}

function renderAdminOrderFilters() {
    const filtersEl = document.getElementById('admin-order-filters');
    const filters = [
        { id: 'all', label: 'الكل' },
        { id: 'pending', label: '⏳ قيد المراجعة' },
        { id: 'processing', label: '👨‍🍳 جاري التجهيز' },
        { id: 'completed', label: '✅ تم التسليم' },
        { id: 'cancelled', label: '❌ ملغي' }
    ];
    filtersEl.innerHTML = filters.map(f => `
        <button onclick="setAdminOrderFilter('${f.id}')" class="whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm ${adminOrderFilter === f.id ? 'bg-pink-500 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'}">${f.label}</button>
    `).join('');
}

function setAdminOrderFilter(f) { adminOrderFilter = f; renderAdminOrderFilters(); renderAdminOrders(); }

function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-tbody');
    let list = globalOrders;
    if (adminOrderFilter !== 'all') list = list.filter(o => (o.status || 'pending') === adminOrderFilter);
    if(list.length === 0) { tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-500 font-bold">لا توجد طلبات في هذا القسم.</td></tr>`; return; }
    
    tbody.innerHTML = list.map(o => {
        const s = o.status || 'pending';
        return `
        <tr class="hover:bg-gray-800 transition-colors border-b border-gray-700">
            <td class="p-4 font-mono text-pink-400 whitespace-nowrap">${escapeHTML(o.id)}</td>
            <td class="p-4 text-xs text-gray-400 whitespace-nowrap" dir="ltr">${escapeHTML(o.date)}</td>
            <td class="p-4 min-w-[150px]"><p class="font-bold text-gray-200">${escapeHTML(o.name)}</p><p class="text-xs text-gray-500">${escapeHTML(o.phone)} | ${escapeHTML(o.area)}</p></td>
            <td class="p-4 text-xs text-gray-400 max-w-xs truncate min-w-[200px]" title="${escapeHTML(o.items)}">${escapeHTML(o.items)}</td>
            <td class="p-4 font-black text-emerald-400 whitespace-nowrap">${escapeHTML(o.total.toString())} ج.م</td>
            <td class="p-4 whitespace-nowrap">
                <select onchange="updateOrderStatus('${o.id}', this.value)" class="bg-gray-700 border border-gray-600 font-bold text-xs text-white rounded-lg p-2 outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer">
                    <option value="pending" ${s==='pending'?'selected':''}>⏳ قيد المراجعة</option>
                    <option value="processing" ${s==='processing'?'selected':''}>👨‍🍳 جاري التجهيز</option>
                    <option value="completed" ${s==='completed'?'selected':''}>✅ تم التسليم</option>
                    <option value="cancelled" ${s==='cancelled'?'selected':''}>❌ ملغي</option>
                </select>
            </td>
            <td class="p-4 text-center whitespace-nowrap">
                <button onclick="deleteOrder('${o.id}')" class="text-red-400 hover:text-white p-2 bg-gray-700 hover:bg-red-600 rounded-lg transition-colors shadow-sm"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `}).join('');
    lucide.createIcons();
}

async function updateOrderStatus(id, newStatus) {
    const orderIdx = globalOrders.findIndex(o => String(o.id) === String(id));
    if (orderIdx > -1) {
        globalOrders[orderIdx].status = newStatus;
        localStorage.setItem('boseSweets_admin_orders', JSON.stringify(globalOrders));
        try {
            await NetworkEngine.safeWrite('orders', String(id), globalOrders[orderIdx]);
            showSystemToast('تم تحديث حالة الطلب', 'success');
        } catch (e) { showSystemToast('تم تحديث الحالة محلياً', 'info'); }
        renderAdminOverview(); if(adminOrderFilter !== 'all') renderAdminOrders(); 
    }
}

async function deleteOrder(id) {
    if(confirm("هل أنت متأكد من حذف أو أرشفة هذا الطلب نهائياً من السجلات؟")) {
        globalOrders = globalOrders.filter(o => String(o.id) !== String(id));
        localStorage.setItem('boseSweets_admin_orders', JSON.stringify(globalOrders));
        try { await NetworkEngine.safeDelete('orders', String(id)); showSystemToast("تم حذف الطلب نهائياً", "success"); } catch(e) { }
        renderAdminOrders(); renderAdminOverview();
    }
}

function renderAdminTempImages() {
    const container = document.getElementById('edit-prod-images-container');
    if(tempProdImages.length === 0) {
        container.innerHTML = `<div class="w-full text-center py-4 text-xs text-gray-500 font-bold border-2 border-dashed border-gray-700 rounded-lg">لم يتم إضافة صور للمنتج بعد</div>`;
        return;
    }
    container.innerHTML = tempProdImages.map((url, idx) => `
        <div class="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border-2 border-gray-600 group">
            <img src="${url}" class="w-full h-full object-cover">
            ${idx === 0 ? `<div class="absolute bottom-0 left-0 right-0 bg-pink-500/90 text-white text-[9px] font-bold text-center py-0.5">الرئيسية</div>` : ''}
            <button onclick="removeTempImage(${idx})" class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

function removeTempImage(idx) { tempProdImages.splice(idx, 1); renderAdminTempImages(); }

async function compressAndUploadMultiImage(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.match('image.*')) { showSystemToast("الرجاء اختيار ملف صورة فقط", "error"); return; }
    const spinner = document.getElementById('uploading-spinner'); spinner.classList.remove('hidden');
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = function(ev) {
        const img = new Image(); img.src = ev.target.result;
        img.onload = async function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; let scaleSize = 1;
            if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
            canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64Str = canvas.toDataURL('image/jpeg', 0.8);
            try {
                const formData = new FormData(); formData.append('file', base64Str); formData.append('upload_preset', 'gct8i28h'); 
                const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) { tempProdImages.push(data.secure_url); renderAdminTempImages(); showSystemToast("تم رفع الصورة وإضافتها للمنتج ☁️", "success"); } 
                else throw new Error("Upload failed");
            } catch (err) { tempProdImages.push(base64Str); renderAdminTempImages(); showSystemToast("تم الحفظ محلياً", "info"); } 
            finally { spinner.classList.add('hidden'); document.getElementById('prod-img-upload').value = ''; }
        }
    }
}

function renderAdminCatalogTabs() {
    const tabsEl = document.getElementById('admin-catalog-tabs');
    let html = `<button onclick="setAdminCat('all')" class="whitespace-nowrap px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm ${adminCurrentCat === 'all' ? 'bg-pink-500 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'}">عرض الكل</button>`;
    catMenu.forEach(c => {
        html += `<button onclick="setAdminCat('${c}')" class="whitespace-nowrap px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm ${adminCurrentCat === c ? 'bg-pink-500 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'}">${c}</button>`;
    });
    tabsEl.innerHTML = html;
}

function setAdminCat(c) {
    adminCurrentCat = c; renderAdminCatalogTabs();
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    renderAdminMenu(currentSearch);
}

function renderAdminMenu(searchQuery = '') {
    let list = catalog;
    if (adminCurrentCat !== 'all') list = list.filter(p => p.category === adminCurrentCat);
    if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)) || (p.subType && p.subType.toLowerCase().includes(q)));
    }
    document.getElementById('admin-menu-tbody').innerHTML = list.map(p => {
        let layoutBadge = '';
        if (p.layout === 'full') layoutBadge = '<span class="mr-3 text-[10px] bg-pink-900/40 text-pink-300 px-2.5 py-1 rounded-md border border-pink-700/50">كارت كبير</span>';
        if (p.layout === 'half') layoutBadge = '<span class="mr-3 text-[10px] bg-blue-900/40 text-blue-300 px-2.5 py-1 rounded-md border border-blue-700/50">كارت صغير</span>';
        let stockBadge = p.inStock === false ? '<span class="mr-2 text-[10px] bg-red-900/40 text-red-300 px-2.5 py-1 rounded-md border border-red-700/50"><i data-lucide="ban" class="w-3 h-3 inline"></i> نفدت</span>' : '';
        const renderImg = (p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category));

        return `
        <tr class="hover:bg-gray-800 transition-colors border-b border-gray-700 ${p.inStock === false ? 'opacity-70' : ''}">
            <td class="p-4 whitespace-nowrap relative">
                <img src="${renderImg}" class="w-10 h-10 object-cover rounded-lg border border-gray-600 ${p.inStock === false ? 'grayscale' : ''}">
                ${(p.images && p.images.length > 1) ? `<span class="absolute top-3 left-3 bg-black/60 text-white text-[8px] px-1 rounded font-bold">+${p.images.length - 1}</span>` : ''}
            </td>
            <td class="p-4 whitespace-nowrap"><span class="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">${escapeHTML(p.category)}</span></td>
            <td class="p-4 font-bold text-gray-200 min-w-[200px] flex items-center flex-wrap gap-y-2 h-[73px]">${escapeHTML(p.name)} ${layoutBadge} ${stockBadge}</td>
            <td class="p-4 text-emerald-400 font-black whitespace-nowrap">${Number(p.price) > 0 ? Number(p.price) : 'متغير'}</td>
            <td class="p-4 whitespace-nowrap text-xs font-bold text-pink-300">${p.badge ? p.badge : '-'}</td>
            <td class="p-4 text-center whitespace-nowrap">
                <div class="flex gap-2 justify-center">
                    <button onclick="openEditModal('${p.id}')" class="text-blue-400 hover:text-white p-2 bg-gray-700 hover:bg-blue-600 rounded-lg shadow-sm transition-colors"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="deleteProduct('${p.id}')" class="text-red-400 hover:text-white p-2 bg-gray-700 hover:bg-red-600 rounded-lg shadow-sm transition-colors"><i data-lucide="trash" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>
    `}).join('');
    lucide.createIcons();
}

function openAddProductModal() {
    currentEditId = null; document.getElementById('prod-modal-title').innerText = "إضافة منتج";
    ['id','name','price','sub','desc'].forEach(k => { const el = document.getElementById(`edit-prod-${k}`); if(el) el.value = ''; });
    document.getElementById('edit-prod-cat').value = adminCurrentCat === 'all' ? "جاتوهات" : adminCurrentCat; 
    document.getElementById('edit-prod-layout').value = 'default';
    document.getElementById('edit-prod-badge').value = '';
    document.getElementById('edit-prod-instock').checked = true; 
    tempProdImages = []; renderAdminTempImages();
    const m = document.getElementById('admin-prod-modal'); m.classList.remove('hidden'); m.classList.add('flex');
}

function openEditModal(id) {
    const p = catalogMap.get(String(id)); 
    if (p) {
        currentEditId = String(id); document.getElementById('prod-modal-title').innerText = "تعديل المنتج";
        document.getElementById('edit-prod-id').value = p.id; document.getElementById('edit-prod-name').value = p.name;
        document.getElementById('edit-prod-price').value = p.price; document.getElementById('edit-prod-cat').value = p.category;
        document.getElementById('edit-prod-sub').value = p.subType || p.size || p.flowerType || ""; 
        document.getElementById('edit-prod-layout').value = p.layout || 'default';
        document.getElementById('edit-prod-badge').value = p.badge || '';
        document.getElementById('edit-prod-instock').checked = p.inStock !== false; 
        document.getElementById('edit-prod-desc').value = p.desc || ''; 
        if(p.images && p.images.length > 0) tempProdImages = [...p.images]; else if(p.img) tempProdImages = [p.img]; else tempProdImages = [];
        renderAdminTempImages();
        const m = document.getElementById('admin-prod-modal'); m.classList.remove('hidden'); m.classList.add('flex');
    }
}

function closeProdModal() { const m = document.getElementById('admin-prod-modal'); m.classList.add('hidden'); m.classList.remove('flex'); currentEditId = null; }

async function saveProductData() {
    const nName = document.getElementById('edit-prod-name').value.trim(); const nPrice = parseInt(document.getElementById('edit-prod-price').value) || 0;
    const nCat = document.getElementById('edit-prod-cat').value; const nSub = document.getElementById('edit-prod-sub').value.trim();
    const nLayout = document.getElementById('edit-prod-layout').value;
    const nBadge = document.getElementById('edit-prod-badge').value;
    const nInStock = document.getElementById('edit-prod-instock').checked; 
    const nDesc = document.getElementById('edit-prod-desc').value.trim();
    if(!nName) { showSystemToast("يجب كتابة اسم المنتج", "error"); return; }

    const finalImagesArray = [...tempProdImages];
    const finalImg = finalImagesArray.length > 0 ? finalImagesArray[0] : '';
    let prodObj;
    if (currentEditId) {
        const idx = catalog.findIndex(x => String(x.id) === String(currentEditId));
        if (idx > -1) {
            catalog[idx].name = nName; catalog[idx].price = nPrice; catalog[idx].category = nCat; catalog[idx].desc = nDesc; 
            catalog[idx].images = finalImagesArray; catalog[idx].img = finalImg;
            catalog[idx].subType = nSub; catalog[idx].layout = nLayout; catalog[idx].badge = nBadge; catalog[idx].inStock = nInStock;
            if(nCat === 'ديسباسيتو') catalog[idx].size = nSub; if(nCat === 'ورد') catalog[idx].flowerType = nSub; 
            prodObj = catalog[idx];
        }
    } else {
        prodObj = { id: Date.now() + Math.floor(Math.random()*1000), category: nCat, name: nName, price: nPrice, desc: nDesc, images: finalImagesArray, img: finalImg, subType: nSub, layout: nLayout, badge: nBadge, inStock: nInStock };
        if(nCat === 'ديسباسيتو') prodObj.size = nSub || 'وسط'; if(nCat === 'ورد') prodObj.flowerType = nSub || 'ورد طبيعي'; 
        catalog.unshift(prodObj); 
    }
    syncCatalogMap(); 
    try { await NetworkEngine.safeWrite('catalog', String(prodObj.id), prodObj); saveEngineMemory('cat'); showSystemToast("تم الحفظ بنجاح", "success"); } 
    catch(e) { saveEngineMemory('cat'); showSystemToast("تم الحفظ محلياً", "info"); }
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    closeProdModal(); renderAdminMenu(currentSearch); renderAdminOverview();
}

async function deleteProduct(id) {
    if(confirm("حذف هذا المنتج بشكل نهائي؟")) {
        const safeId = String(id); catalog = catalog.filter(p => String(p.id) !== safeId); syncCatalogMap(); 
        try { await NetworkEngine.safeDelete('catalog', safeId); saveEngineMemory('cat'); showSystemToast("تم الحذف بنجاح", "success"); } 
        catch(e) { saveEngineMemory('cat'); }
        const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
        renderAdminMenu(currentSearch); renderAdminOverview(); 
    }
}

function fillCakeBuilderAdmin() {
    if (!siteSettings.cakeBuilder) siteSettings.cakeBuilder = JSON.parse(JSON.stringify(defaultSettings.cakeBuilder));
    const c = siteSettings.cakeBuilder;
    document.getElementById('set-cake-base-price').value = c.basePrice || 145;
    document.getElementById('set-cake-desc').value = c.desc || "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة، مع ضمان تنفيذ إدارة حلويات بوسي لكافة الطلبات بأعلى مستوى احترافي.";
    document.getElementById('set-cake-min-sq').value = c.minSquare || 16;
    document.getElementById('set-cake-min-rect').value = c.minRect || 20;
    const edible = c.imagePrinting.find(i => i.label === 'صورة قابلة للأكل');
    const nonedible = c.imagePrinting.find(i => i.label === 'صورة غير قابلة للأكل');
    if(edible) document.getElementById('set-print-edible').value = edible.price;
    if(nonedible) document.getElementById('set-print-nonedible').value = nonedible.price;
    renderAdminCakeFlavors(); renderAdminCakeImages();
}

function renderAdminCakeFlavors() {
    const list = siteSettings.cakeBuilder.flavors || [];
    document.getElementById('admin-cake-flavors-list').innerHTML = list.map((fl, idx) => `
        <div class="bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-gray-600">
            <span>${fl}</span>
            <button onclick="removeCakeFlavor(${idx})" class="text-red-400 hover:text-red-300"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

function addCakeFlavor() {
    const val = document.getElementById('new-flavor-input').value.trim();
    if(!val) return;
    if(!siteSettings.cakeBuilder.flavors) siteSettings.cakeBuilder.flavors = [];
    siteSettings.cakeBuilder.flavors.push(val);
    document.getElementById('new-flavor-input').value = ''; renderAdminCakeFlavors();
}

function removeCakeFlavor(idx) { siteSettings.cakeBuilder.flavors.splice(idx, 1); renderAdminCakeFlavors(); }

function renderAdminCakeImages() {
    const list = siteSettings.cakeBuilder.images || [];
    const container = document.getElementById('admin-cake-images-list');
    if(list.length === 0) { container.innerHTML = `<span class="text-xs text-gray-500">لا يوجد صور، سيتم استخدام الصورة الافتراضية.</span>`; return; }
    container.innerHTML = list.map((url, idx) => `
        <div class="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-600 group">
            <img src="${url}" class="w-full h-full object-cover">
            <button onclick="removeCakeImage(${idx})" class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="x" class="w-3 h-3"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

function removeCakeImage(idx) { siteSettings.cakeBuilder.images.splice(idx, 1); renderAdminCakeImages(); }

async function uploadCakeImage(e) {
    const file = e.target.files[0]; if (!file) return;
    const spinner = document.getElementById('cake-upload-spinner'); spinner.classList.remove('hidden');
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = function(ev) {
        const img = new Image(); img.src = ev.target.result;
        img.onload = async function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; let scaleSize = 1;
            if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
            canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64Str = canvas.toDataURL('image/jpeg', 0.8);
            try {
                const formData = new FormData(); formData.append('file', base64Str); formData.append('upload_preset', 'gct8i28h'); 
                const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) { 
                    if(!siteSettings.cakeBuilder.images) siteSettings.cakeBuilder.images = [];
                    siteSettings.cakeBuilder.images.push(data.secure_url);
                    renderAdminCakeImages(); showSystemToast("تم رفع الصورة للسحابة", "success");
                }
            } catch (err) { 
                if(!siteSettings.cakeBuilder.images) siteSettings.cakeBuilder.images = [];
                siteSettings.cakeBuilder.images.push(base64Str); renderAdminCakeImages(); showSystemToast("تم الحفظ محلياً", "info");
            } finally { spinner.classList.add('hidden'); }
        }
    }
}

async function saveCakeBuilderSettings() {
    const c = siteSettings.cakeBuilder;
    c.basePrice = Number(document.getElementById('set-cake-base-price').value) || 145;
    c.desc = document.getElementById('set-cake-desc').value;
    c.minSquare = Number(document.getElementById('set-cake-min-sq').value) || 16;
    c.minRect = Number(document.getElementById('set-cake-min-rect').value) || 20;
    c.imagePrinting = [
        { label: 'بدون', price: 0 },
        { label: 'صورة قابلة للأكل', price: Number(document.getElementById('set-print-edible').value) || 0 },
        { label: 'صورة غير قابلة للأكل', price: Number(document.getElementById('set-print-nonedible').value) || 0 }
    ];
    try {
        await NetworkEngine.safeWrite('settings', 'main', siteSettings); saveEngineMemory('set'); 
        showSystemToast("تم حفظ تعديلات التورت الملكية بنجاح! 👑", "success");
    } catch(e) { saveEngineMemory('set'); showSystemToast("تم الحفظ محلياً", "info"); }
}

function renderAdminCategories() {
    const listEl = document.getElementById('admin-categories-list');
    if (!listEl) return;
    if (catMenu.length === 0) {
        listEl.innerHTML = `<p class="text-center text-gray-500 py-8 font-bold">لا توجد أقسام حالياً. ابدأ بإضافة أول قسم لـ BoseSweets!</p>`;
        return;
    }
    listEl.innerHTML = catMenu.map((cat, index) => `
        <div class="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 rounded-xl group hover:border-pink-500 transition-all">
            <div class="flex items-center gap-3">
                <span class="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg text-xs text-gray-400 font-mono">${index + 1}</span>
                <span class="font-bold text-gray-200">${cat}</span>
            </div>
            <button onclick="removeCategory(${index})" class="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

function addNewCategory() {
    const input = document.getElementById('new-category-input');
    const val = input.value.trim();
    if (!val) { showSystemToast("اكتبي اسم القسم الأول يا إدارة", "error"); return; }
    if (catMenu.includes(val)) { showSystemToast("القسم ده موجود فعلاً", "error"); return; }
    catMenu.push(val); input.value = ''; renderAdminCategories();
    showSystemToast(`تمت إضافة "${val}" للقائمة المؤقتة`, "success");
}

function removeCategory(index) {
    if (catMenu[index] === 'تورت') { showSystemToast("عفواً، لا يمكن حذف قسم التورت الملكية الأساسي! 👑", "error"); return; }
    if (confirm(`حذف قسم "${catMenu[index]}"؟ (المنتجات مش هتتحذف)`)) { catMenu.splice(index, 1); renderAdminCategories(); }
}

async function saveCategoriesToCloud() {
    try {
        siteSettings.catMenu = catMenu; 
        await NetworkEngine.safeWrite('settings', 'main', siteSettings);
        renderAdminCatalogTabs();
        showSystemToast("تم حفظ وترتيب الأقسام سحابياً بنجاح! ✨", "success");
    } catch (e) { showSystemToast("فشل الحفظ سحابياً", "error"); }
}

async function generateSmartDescription() {
    const prodName = document.getElementById('edit-prod-name').value.trim();
    const prodCat = document.getElementById('edit-prod-cat').value;
    const btn = document.getElementById('btn-smart-desc');
    const descField = document.getElementById('edit-prod-desc');
    if (!prodName) { alert('اكتبي اسم المنتج الأول يا إدارة عشان نقدر نولد وصفه ✨'); return; }
    const originalBtnHTML = btn.innerHTML;
    btn.innerHTML = 'جاري التفكير... ⏳'; btn.disabled = true;
    try {
        const apiKey = 'AIzaSyBr3ERdNUbAegDPHk4TOMF3sHxMMVYCFxk'; 
        const promptText = `أنت كاتب إعلانات محترف لعلامة تجارية مصرية راقية اسمها "حلويات بوسي"\nاكتب وصف قصير وجذاب لمنتج اسمه "${prodName}" من قسم "${prodCat}"\nالشروط: لهجة مصرية عامية راقية، بدون علامات ترقيم، استخدم إيموجي تخدم المعنى، لا يتعدى سطرين.`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ? data.error.message : 'خطأ غير معروف من جوجل');
        if (data.candidates && data.candidates.length > 0) {
            descField.value = data.candidates[0].content.parts[0].text.trim();
            alert('تم التوليد بنجاح! 👑 راجعي الوصف في الخانة.');
        } else { throw new Error('الذكاء الاصطناعي ماردش بوصف صحيح.'); }
    } catch (error) { alert("تنبيه للإدارة! سبب المشكلة: \n" + error.message); } 
    finally { btn.innerHTML = originalBtnHTML; btn.disabled = false; lucide.createIcons(); }
}
