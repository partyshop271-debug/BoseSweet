function renderAdminCatalogTabs() {
    const tabsEl = document.getElementById('admin-catalog-tabs');
    if(!tabsEl) return;
    
    const sortedCats = [...catMenu].sort((a, b) => a.order - b.order);
    
    let html = `<button onclick=\"setAdminCat('all')\" class=\"whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border relative z-20 pointer-events-auto ${adminCurrentCat === 'all' ? 'bg-[#ff3377] text-white border-pink-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}\">الكل</button>`;
    if(sortedCats && sortedCats.length > 0) {
        sortedCats.forEach(c => { html += `<button onclick=\"setAdminCat('${escapeHTML(c.name)}')\" class=\"whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border relative z-20 pointer-events-auto ${adminCurrentCat === c.name ? 'bg-[#ff3377] text-white border-pink-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}\">${escapeHTML(c.name)}</button>`; });
    }
    tabsEl.innerHTML = html;
}

function setAdminCat(c) {
    adminCurrentCat = c; renderAdminCatalogTabs();
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    renderAdminMenu(currentSearch);
    renderAdminCatalogGridUI();
}

function renderAdminMenu(searchQuery = '') {
    const container = document.getElementById('admin-menu-list');
    if (!container) return; 
    container.innerHTML = '';
    if(!catalog || catalog.length === 0) {
        container.innerHTML = `<div class=\"col-span-full flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-700 relative z-10\"><i data-lucide=\"package-x\" class=\"w-12 h-12 mb-3 text-slate-600\"></i><p class=\"font-bold text-sm\">الكتالوج فارغ حالياً في متجر حلويات بوسي</p><button onclick=\"window.openProductFormModal()\" class=\"mt-4 px-5 py-2.5 bg-[#ff3377] text-white rounded-[1.5rem] text-xs font-black hover:bg-pink-600 transition-colors relative z-50 pointer-events-auto cursor-pointer shadow-lg shadow-pink-500/20\">إضافة أول منتج فاخر</button></div>`;
        if(window.lucide) lucide.createIcons(); return;
    }

    let list = [...catalog];
    if (adminCurrentCat !== 'all') list = list.filter(p => p.category === adminCurrentCat);
    if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)) || (p.subType && p.subType.toLowerCase().includes(q)));
    }
    
    const sortType = document.getElementById('admin-sort-catalog')?.value || 'custom';
    if(sortType === 'custom') list.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
    if(sortType === 'newest') list.sort((a, b) => { const timeA = a.id.split('_')[1]; const timeB = b.id.split('_')[1]; return timeB - timeA; });
    if(sortType === 'price_high') list.sort((a, b) => b.price - a.price);
    if(sortType === 'price_low') list.sort((a, b) => a.price - b.price);
    if(sortType === 'name') list.sort((a, b) => (a.name||'').localeCompare(b.name||'', 'ar'));

    if (list.length === 0) {
        container.innerHTML = `<div class=\"col-span-full flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-700 relative z-10\"><i data-lucide=\"search-x\" class=\"w-12 h-12 mb-3 text-slate-600\"></i><p class=\"font-bold text-sm\">لا توجد منتجات مطابقة لعملية البحث الدقيقة</p></div>`;
        if(window.lucide) lucide.createIcons(); return;
    }

    container.innerHTML = list.map(prod => {
        const imageUrl = (prod.images && prod.images.length > 0) ? (prod.images[0].startsWith('offline_img_') ? 'https://via.placeholder.com/150?text=جاري+الرفع' : prod.images[0]) : (prod.img || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80');
        const isInstock = prod.inStock !== false;
        const oldPriceHtml = (prod.oldPrice && prod.oldPrice > prod.price) ? `<del class=\"text-[10px] text-slate-500 ml-1 font-normal\">${prod.oldPrice}</del>` : '';
        
        return `
            <div class=\"admin-card flex flex-col md:flex-row gap-4 relative overflow-visible group transition-all duration-300 hover:border-pink-500/50 ${!isInstock ? 'opacity-60' : ''} p-4 bg-slate-900 rounded-[1.5rem] border border-slate-800\">
                <div class=\"w-full md:w-28 h-36 md:h-28 rounded-[1rem] bg-slate-800 shrink-0 overflow-hidden relative shadow-inner\">
                    <img src=\"${imageUrl}\" alt=\"${escapeHTML(prod.name || '')}\" class=\"w-full h-full object-cover group-hover:scale-110 transition-transform duration-500\" loading=\"lazy\" />
                    ${prod.badge ? `<span class=\"absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] px-2 py-0.5 rounded shadow-lg font-bold z-10\">${prod.badge}</span>` : ''}
                    ${!isInstock ? `<div class=\"absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm z-10\"><span class=\"bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold\">نفذت الكمية</span></div>` : ''}
                </div>
                <div class=\"flex-1 flex flex-col justify-between py-1 relative z-20\">
                    <div>
                        <div class=\"flex justify-between items-start mb-1\">
                            <p class=\"text-[10px] text-[#ff3377] font-bold uppercase tracking-wider bg-pink-500/10 px-2 py-0.5 rounded inline-block\">${escapeHTML(prod.category || '')}</p>
                            <p class=\"text-white font-black text-base bg-slate-900 px-2 py-0.5 rounded border border-slate-700\">${Number(prod.price) > 0 ? prod.price + '<span class=\"text-[9px] text-slate-400 ml-1\">ج.م</span>' + oldPriceHtml : 'متغير'}</p>
                        </div>
                        <h3 class=\"text-white font-bold text-sm leading-tight mb-1 line-clamp-2\">${escapeHTML(prod.name || '')}</h3>
                    </div>
                    <div class=\"flex gap-2 mt-3 md:mt-0 relative z-50 pointer-events-auto\">
                        <button onclick=\"window.openProductFormModal('${prod.id}')\" class=\"flex-1 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white transition-colors py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 border border-indigo-500/20 cursor-pointer pointer-events-auto\"><i data-lucide=\"edit-3\" class=\"w-3.5 h-3.5\"></i> التعديل الفني</button>
                        <button onclick=\"window.deleteProductSecurelyFromCloud('${prod.id}')\" class=\"flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-colors py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 border border-red-500/20 cursor-pointer pointer-events-auto\"><i data-lucide=\"trash-2\" class=\"w-3.5 h-3.5\"></i> إزالة</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    if(window.lucide) lucide.createIcons();
}

window.renderAdminCatalogGridUI = function() {
    const grid = document.getElementById('admin-catalog-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const searchQuery = document.getElementById('admin-search-catalog')?.value.trim().toLowerCase() || '';
    
    let filtered = [...catalog];
    if (searchQuery !== '') {
        filtered = filtered.filter(p => p.name?.toLowerCase().includes(searchQuery) || p.category?.toLowerCase().includes(searchQuery));
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500 font-bold text-xs">لا توجد منتجات مسجلة تطابق البحث حالياً.</div>`;
        return;
    }
    
    grid.innerHTML = filtered.map(p => `
        <div class="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div class="flex gap-3 items-center">
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 p-1 flex items-center justify-center shrink-0">
                    <img src="${p.img || (p.images && p.images[0]) || 'https://via.placeholder.com/100'}" class="w-full h-full object-contain">
                </div>
                <div class="min-w-0 flex-1 text-right">
                    <h4 class="text-xs font-bold text-white truncate">${escapeHTML(p.name)}</h4>
                    <p class="text-[10px] text-pink-500 font-black font-mono mt-0.5">${p.price} ج.م | ${escapeHTML(p.category)}</p>
                </div>
            </div>
            <div class="pt-3 border-t border-slate-800 flex gap-2 justify-left relative z-50 pointer-events-auto">
                <button onclick="window.deleteProductSecurelyFromCloud('${p.id}')" class="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-bold transition-colors">حذف</button>
                <button onclick="window.openProductFormModal('${p.id}')" class="flex-1 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-colors text-center">تعديل بيانات الصنف</button>
            </div>
        </div>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
};

window.openProductFormModal = function(productId) {
    currentEditId = null; 
    if(document.getElementById('prod-modal-title')) document.getElementById('prod-modal-title').innerHTML = `<i data-lucide=\"plus-circle\" class=\"w-6 h-6 text-[#ff3377]\"></i> إدراج منتج جديد`;
    
    const fields = ['edit-prod-id','edit-prod-name','edit-prod-price','edit-prod-old-price','edit-prod-sub','edit-prod-sort','edit-prod-desc', 'form-product-id', 'form-product-name', 'form-product-price', 'form-product-image', 'form-product-desc'];
    fields.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    
    const catSelect = document.getElementById('edit-prod-cat') || document.getElementById('form-product-cat');
    const sortedCats = [...catMenu].sort((a, b) => a.order - b.order);
    if(catSelect) {
        catSelect.innerHTML = sortedCats.map(c => `<option value=\"${escapeHTML(c.name)}\">${escapeHTML(c.name)}</option>`).join('');
        catSelect.value = adminCurrentCat === 'all' ? (sortedCats.length > 0 ? sortedCats[0].name : "تورت") : adminCurrentCat; 
    }
    
    if(document.getElementById('edit-prod-layout')) document.getElementById('edit-prod-layout').value = 'default';
    if(document.getElementById('edit-prod-badge')) document.getElementById('edit-prod-badge').value = '';
    
    const stockEl = document.getElementById('edit-prod-instock') || document.getElementById('form-product-stock');
    if(stockEl) { stockEl.checked = true; if(document.getElementById('instock-label-text')) document.getElementById('instock-label-text').innerText = 'متوفر'; }
    
    tempProdImages = []; renderAdminTempImages();
    const m = document.getElementById('admin-prod-modal') || document.getElementById('product-form-modal'); 
    if(m) { m.classList.remove('hidden'); m.classList.add('flex'); setTimeout(() => m.classList.remove('opacity-0'), 10); }
    if(window.lucide) lucide.createIcons();

    if (productId) editProduct(productId);
};

window.saveProductFormSubmit = async function() {
    await saveProductData();
};

window.deleteProductSecurelyFromCloud = async function(productId) {
    if (!confirm('هل حضرتك متأكدة تماماً من اتخاذ قرار حذف هذا الصنف نهائياً من قاعدة بيانات حلويات بوسي؟')) return;
    
    try {
        if (typeof db !== 'undefined') {
            await db.collection('catalog').doc(productId).delete();
        }
        catalog = catalog.filter(item => String(item.id) !== String(productId));
        syncCatalogMap();
        saveEngineMemory('cat');
        
        renderAdminCatalogGridUI();
        const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
        renderAdminMenu(currentSearch);
        updateAdminDashboardStatsUI();
        showSystemToast('تم مسح وإلغاء ارتباط الصنف من السيرفر السحابي بنجاح 👑', 'success');
    } catch (e) {
        showSystemToast(`فشل الحذف: ${e.message}`, 'error');
    }
};

function renderAdminTempImages() {
    const container = document.getElementById('edit-prod-images-container');
    if(!container) return;
    if(tempProdImages.length === 0) {
        container.innerHTML = `<div class=\"w-full text-center py-4 text-xs text-slate-500 font-bold border border-dashed border-slate-700 rounded-lg\">لم يتم إرفاق صور هندسية للمنتج بعد</div>`; return;
    }
    container.innerHTML = tempProdImages.map((url, idx) => `
        <div class=\"relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 border-slate-700 group\">
            <img src=\"${url.startsWith('offline_img_') ? 'https://via.placeholder.com/150?text=صورة+محلية' : url}\" class=\"w-full h-full object-cover\">
            ${idx === 0 ? `<div class=\"absolute bottom-0 left-0 right-0 bg-[#ff3377]/90 text-white text-[9px] font-bold text-center py-0.5 backdrop-blur-sm z-10\">الرئيسية</div>` : ''}
            <button type="button" onclick=\"removeTempImage(${idx})\" class=\"absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-md hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-sm cursor-pointer z-50 pointer-events-auto\"><i data-lucide=\"x\" class=\"w-3 h-3\"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
}

function removeTempImage(idx) { tempProdImages.splice(idx, 1); renderAdminTempImages(); }

async function compressAndUploadMultiImage(e) {
    const files = e.target.files; if (!files || files.length === 0) return;
    const spinner = document.getElementById('uploading-spinner'); if(spinner) spinner.classList.remove('hidden');
    let offlineSaved = false;

    for(let i=0; i<files.length; i++) {
        const file = files[i];
        if (!file.type.match('image.*')) { showSystemToast("قرار فني: الرجاء اختيار ملف صورة فقط", "error"); continue; }
        await new Promise((resolve) => {
            const reader = new FileReader(); reader.readAsDataURL(file);
            reader.onload = function(ev) {
                const img = new Image(); img.src = ev.target.result;
                img.onload = async function() {
                    const canvas = document.createElement('canvas'); const MAX_WIDTH = 1000; let scaleSize = 1;
                    if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
                    canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const base64Str = canvas.toDataURL('image/jpeg', 0.85); 
                    
                    if (navigator.onLine) {
                        try {
                            const secureToken = await getSecureUploadSignature();
                            const formData = new FormData(); 
                            formData.append('file', base64Str); 
                            if (secureToken && secureToken.signature) {
                                formData.append('signature', secureToken.signature);
                                formData.append('timestamp', secureToken.timestamp);
                                formData.append('api_key', secureToken.api_key);
                            } else { formData.append('upload_preset', 'gct8i28h'); }
                            
                            const response = await fetch('https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload', { method: 'POST', body: formData });
                            const data = await response.json();
                            if (data.secure_url) { tempProdImages.push(data.secure_url); } else throw new Error("Upload failed");
                        } catch (err) { 
                            const offlineId = 'offline_img_' + Date.now() + Math.random().toString(36).substr(2, 5);
                            await OfflineStorageManager.enqueuePayload({ offlineId: offlineId, base64: base64Str });
                            tempProdImages.push(offlineId); offlineSaved = true; 
                        } 
                    } else {
                        const offlineId = 'offline_img_' + Date.now() + Math.random().toString(36).substr(2, 5);
                        await OfflineStorageManager.enqueuePayload({ offlineId: offlineId, base64: base64Str });
                        tempProdImages.push(offlineId); offlineSaved = true;
                    }
                    resolve();
                }
            }
        });
    }
    renderAdminTempImages();
    if(spinner) spinner.classList.add('hidden'); 
    if(document.getElementById('prod-img-upload')) document.getElementById('prod-img-upload').value = '';
    
    if (offlineSaved) showSystemToast("تم تجميد الصور في الخزنة مؤقتا ستُرفع للسحابة لاحقاً 🔄", "info");
    else showSystemToast("تم الرفع وإرفاق الصور الهندسية للمنتج 👑", "success");
}

function editProduct(id) {
    let p = catalog.find(x => String(x.id) === String(id));
    if(!p && typeof catalogMap !== 'undefined') p = catalogMap.get(String(id)); 
    if (p) {
        currentEditId = String(id); 
        if(document.getElementById('prod-modal-title')) document.getElementById('prod-modal-title').innerHTML = `<i data-lucide=\"edit-3\" class=\"w-6 h-6 text-[#ff3377]\"></i> التعديل الفني للمنتج`;
        
        const catSelect = document.getElementById('edit-prod-cat') || document.getElementById('form-product-cat');
        const sortedCats = [...catMenu].sort((a, b) => a.order - b.order);
        if(catSelect) catSelect.innerHTML = sortedCats.map(c => `<option value=\"${escapeHTML(c.name)}\">${escapeHTML(c.name)}</option>`).join('');
        
        if(document.getElementById('edit-prod-id')) document.getElementById('edit-prod-id').value = p.id; 
        if(document.getElementById('edit-prod-name')) document.getElementById('edit-prod-name').value = p.name || '';
        if(document.getElementById('edit-prod-price')) document.getElementById('edit-prod-price').value = p.price || ''; 
        if(document.getElementById('edit-prod-old-price')) document.getElementById('edit-prod-old-price').value = p.oldPrice || ''; 
        if(document.getElementById('edit-prod-cat')) document.getElementById('edit-prod-cat').value = p.category;
        if(document.getElementById('edit-prod-sub')) document.getElementById('edit-prod-sub').value = p.subType || p.size || ""; 
        if(document.getElementById('edit-prod-sort')) document.getElementById('edit-prod-sort').value = p.sortOrder || ""; 
        if(document.getElementById('edit-prod-layout')) document.getElementById('edit-prod-layout').value = p.layout || 'default';
        if(document.getElementById('edit-prod-badge')) document.getElementById('edit-prod-badge').value = p.badge || '';
        if(document.getElementById('form-product-image')) document.getElementById('form-product-image').value = p.img || (p.images && p.images[0]) || '';
        
        const stockEl = document.getElementById('edit-prod-instock') || document.getElementById('form-product-stock');
        if(stockEl) { 
            stockEl.checked = p.inStock !== false; 
            if(document.getElementById('instock-label-text')) document.getElementById('instock-label-text').innerText = (p.inStock !== false) ? 'متوفر' : 'نفذت'; 
        }
        
        if(document.getElementById('edit-prod-desc')) document.getElementById('edit-prod-desc').value = p.desc || ''; 
        if(document.getElementById('form-product-desc')) document.getElementById('form-product-desc').value = p.desc || '';
        
        if(p.images && p.images.length > 0) tempProdImages = [...p.images]; else if(p.img) tempProdImages = [p.img]; else tempProdImages = [];
        renderAdminTempImages();
        
        // جلب الأحجام والأسعار المتعددة إذا وجدت وعرضها
        const sizeContainer = document.getElementById('size-price-inputs');
        if(sizeContainer) {
            sizeContainer.innerHTML = '';
            if (p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0) {
                p.sizes.forEach(sizeObj => {
                    const row = document.createElement('div');
                    row.className = 'flex gap-2 items-center bg-[#070b14] p-2 rounded-[1rem] border border-slate-800 mt-2';
                    row.innerHTML = `
                        <div class="flex-1">
                            <input type="text" placeholder="الحجم" value="${escapeHTML(sizeObj.name)}" class="size-name admin-input rounded-xl py-2 text-xs bg-[#1a2235]">
                        </div>
                        <div class="flex-1">
                            <input type="number" placeholder="السعر" value="${sizeObj.price}" class="size-val admin-input rounded-xl py-2 font-black text-[#ff3377] text-center bg-[#1a2235]">
                        </div>
                        <button type="button" onclick="this.parentElement.remove()" class="p-2 bg-red-500/10 text-red-400 rounded-xl active:scale-90 flex-shrink-0 transition-transform cursor-pointer pointer-events-auto relative z-50">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    `;
                    sizeContainer.appendChild(row);
                });
            } else {
                // صف افتراضي فارغ لو مفيش
                const row = document.createElement('div');
                row.className = 'flex gap-2 items-center bg-[#070b14] p-2 rounded-[1rem] border border-slate-800 mt-2';
                row.innerHTML = `
                    <div class="flex-1">
                        <input type="text" placeholder="الحجم (مثال: وسط)" class="size-name admin-input rounded-xl py-2 text-xs bg-[#1a2235]">
                    </div>
                    <div class="flex-1">
                        <input type="number" placeholder="السعر (ج.م)" class="size-val admin-input rounded-xl py-2 font-black text-[#ff3377] text-center bg-[#1a2235]">
                    </div>
                    <button type="button" onclick="this.parentElement.remove()" class="p-2 bg-red-500/10 text-red-400 rounded-xl active:scale-90 flex-shrink-0 transition-transform cursor-pointer pointer-events-auto relative z-50">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                `;
                sizeContainer.appendChild(row);
            }
        }

        const m = document.getElementById('admin-prod-modal') || document.getElementById('product-form-modal'); 
        if(m) { m.classList.remove('hidden'); m.classList.add('flex'); setTimeout(() => m.classList.remove('opacity-0'), 10); }
        if(window.lucide) lucide.createIcons();
    }
}

function closeProdModal() { 
    const m = document.getElementById('admin-prod-modal') || document.getElementById('product-form-modal'); 
    if(m) { m.classList.add('opacity-0'); setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); currentEditId = null; }, 300); }
}

async function saveProductData() {
    const nName = (document.getElementById('edit-prod-name')?.value || document.getElementById('form-product-name')?.value || '').trim(); 
    const nPrice = parseInt(document.getElementById('edit-prod-price')?.value || document.getElementById('form-product-price')?.value) || 0;
    const nOldPrice = parseInt(document.getElementById('edit-prod-old-price')?.value) || null;
    const nSort = parseInt(document.getElementById('edit-prod-sort')?.value) || 999;
    const nCat = document.getElementById('edit-prod-cat')?.value || document.getElementById('form-product-cat')?.value; 
    const nSub = document.getElementById('edit-prod-sub')?.value.trim() || '';
    const nLayout = document.getElementById('edit-prod-layout')?.value || 'default'; 
    const nBadge = document.getElementById('edit-prod-badge')?.value || '';
    const nInStock = document.getElementById('edit-prod-instock')?.checked !== false && document.getElementById('form-product-stock')?.checked !== false; 
    const nDesc = (document.getElementById('edit-prod-desc')?.value || document.getElementById('form-product-desc')?.value || '').trim();
    
    // استخراج الأحجام والأسعار المتعددة
    const sizeNames = document.querySelectorAll('.size-name');
    const sizeVals = document.querySelectorAll('.size-val');
    const sizesArray = [];
    for(let i = 0; i < sizeNames.length; i++) {
        const sName = sizeNames[i].value.trim();
        const sPrice = parseInt(sizeVals[i].value);
        if(sName && !isNaN(sPrice) && sPrice > 0) {
            sizesArray.push({ name: sName, price: sPrice });
        }
    }

    if(!nName || (nPrice <= 0 && sizesArray.length === 0)) { showSystemToast("قرار إداري: يجب إدراج اسم المنتج ومنظومة تسعير صحيحة للاعتماد", "error"); return; }
    
    const directImageUrl = document.getElementById('form-product-image')?.value.trim();
    if(directImageUrl && !tempProdImages.includes(directImageUrl)) {
        tempProdImages.push(directImageUrl);
    }
    
    const finalImagesArray = [...tempProdImages]; const finalImg = finalImagesArray.length > 0 ? finalImagesArray[0] : '';
    let prodObj;
    
    if (currentEditId) {
        const idx = catalog.findIndex(x => String(x.id) === String(currentEditId));
        if (idx > -1) {
            catalog[idx].name = nName; catalog[idx].price = nPrice; catalog[idx].oldPrice = nOldPrice;
            catalog[idx].category = nCat; catalog[idx].desc = nDesc; catalog[idx].sortOrder = nSort;
            catalog[idx].images = finalImagesArray; catalog[idx].img = finalImg; catalog[idx].subType = nSub; 
            catalog[idx].layout = nLayout; catalog[idx].badge = nBadge; catalog[idx].inStock = nInStock;
            catalog[idx].sizes = sizesArray;
            prodObj = catalog[idx];
        }
    } else {
        const newId = document.getElementById('form-product-id')?.value.trim() || ('prod_' + Date.now() + Math.floor(Math.random()*1000));
        prodObj = { id: newId, category: nCat, name: nName, price: nPrice, oldPrice: nOldPrice, desc: nDesc, sortOrder: nSort, images: finalImagesArray, img: finalImg, subType: nSub, layout: nLayout, badge: nBadge, inStock: nInStock, sizes: sizesArray };
        catalog.unshift(prodObj); 
    }
    
    syncCatalogMap(); 
    try { 
        if(typeof db !== 'undefined') {
            await db.collection('catalog').doc(prodObj.id).set(prodObj, { merge: true });
        } else if(typeof NetworkEngine !== 'undefined') {
            await NetworkEngine.safeWrite('catalog', String(prodObj.id), prodObj); 
        }
        saveEngineMemory('cat'); 
        showSystemToast("تم الاعتماد الفني والحفظ في متجر حلويات بوسي بنجاح 👑☁️", "success"); 
    } catch(e) { 
        saveEngineMemory('cat'); 
        showSystemToast("تم الحفظ محلياً لحين تزامن الشبكة", "info"); 
    }
    
    tempProdImages = []; renderAdminTempImages();
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    closeProdModal(); renderAdminMenu(currentSearch); renderAdminOverview();
    renderAdminCatalogGridUI();
    updateAdminDashboardStatsUI();
    syncOfflineImages();
}

function deleteProductConfirm(id) {
    const p = catalog.find(x => String(x.id) === String(id));
    if(!p) return;
    openConfirmModal('حذف منتج نهائياً', `هل أنت متأكد من قرار إزالة "${p.name}" بشكل نهائي؟`, () => { executeDeleteProduct(id); });
}

async function executeDeleteProduct(id) {
    window.deleteProductSecurelyFromCloud(id);
}

async function generateSmartDescription() {
    const prodNameEl = document.getElementById('edit-prod-name') || document.getElementById('form-product-name'); 
    const prodCatEl = document.getElementById('edit-prod-cat') || document.getElementById('form-product-cat');
    const btn = document.getElementById('btn-smart-desc'); 
    const descField = document.getElementById('edit-prod-desc') || document.getElementById('form-product-desc');
    
    if(!prodNameEl || !prodCatEl || !btn || !descField) return;
    
    const prodName = prodNameEl.value.trim(); const prodCat = prodCatEl.value;
    if (!prodName) { showSystemToast('الرجاء إدخال اسم المنتج أولاً لنتمكن من توليد وصف مهني فائق ✨', 'error'); return; }
    
    const originalBtnHTML = btn.innerHTML;
    btn.innerHTML = '<i data-lucide=\"loader-2\" class=\"w-3 h-3 animate-spin\"></i> جاري التوليد...'; btn.disabled = true;
    if(window.lucide) lucide.createIcons();
    
    try {
        const secureEndpoint = 'https://us-central1-bosy-sweets.cloudfunctions.net/generateSmartDesc'; 
        const response = await fetch(secureEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productName: prodName, categoryName: prodCat }) });
        if (!response.ok) throw new Error('الخادم السحابي غير متصل للأسف أو قيد الصيانة التكتيكية');
        const data = await response.json();
        if (data && data.description) { descField.value = data.description.trim(); showSystemToast('تم توليد النص الفني بنجاح! 👑 يرجى المراجعة.', 'success'); } 
        else { throw new Error('الخادم لم يُرسل الوصف المُعتمد.'); }
    } catch (error) { 
        showSystemToast("تنويه تقني: " + error.message, "info"); 
        descField.value = `قطعة فنية راقية من حلويات بوسي 👑.. ${prodName} يضمن لكم تجربة فريدة لا تُنسى!`;
    } finally { 
        btn.innerHTML = originalBtnHTML; btn.disabled = false; if(window.lucide) lucide.createIcons(); 
    }
}

// توجيه مسار الزر العائم لضمان استجابة واجهة المستخدم بامتياز
window.openAddProductModal = window.openProductFormModal;
