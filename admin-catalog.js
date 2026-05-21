// ==========================================================================
// BoseSweets Admin Core Engine (admin-catalog.js)
// Focus: Stable Cloud Connection, Realtime Streams, Cloudinary Direct Upload
// Strict Constraint: Fully compatible with admin UI panels, NO code truncations.
// ==========================================================================

// التكوين والتهيئة السحابية المتوافقة مع المنظومة الإدارية المشتركة لمتجر حلويات بوسي
const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e"
};

// تأمين عدم تكرار التهيئة السحابية لمنع الأخطاء البرمجية داخل المتصفح
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// الاعتماد الموحد على بروتوكول الاتصال التقليدي والمستقر لقاعدة البيانات
const db = firebase.firestore();
const appId = "bosy-sweets-global-id";

// الحالات والمتغيرات المركزية للمحرك الإداري
let catalogData = [];
let selectedCategory = ''; 
let confirmCallback = null;
let toastTimer = null;

// ==========================================
// 2. إدارة التفاعل والتبويبات (DOM Toggles & Tabs)
// ==========================================
window.toggleSidebar = function(forceState) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;

    if (typeof forceState === 'boolean') {
        if (forceState) { 
            sidebar.classList.add('active'); 
            overlay.classList.add('active'); 
        } else { 
            sidebar.classList.remove('active'); 
            overlay.classList.remove('active'); 
        }
    } else {
        sidebar.classList.toggle('active'); 
        overlay.classList.toggle('active');
    }
};

window.switchSection = function(sectionId, element = null) {
    document.querySelectorAll('.submenu-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
    const targetSec = document.getElementById(sectionId);
    if (targetSec) targetSec.classList.add('active');
    
    const titles = {
        'dashboard': 'المركز الإداري لحلويات بوسي',
        'orders-section': 'متابعة الطلبات الحية | حلويات بوسي',
        'product-list': 'إدارة الكتالوج | حلويات بوسي',
        'product-editor': 'غرفة تعديل وتصميم المنتجات المعزولة | حلويات بوسي',
        'simulator-settings-section': 'محرك التنسيق والطبقات الفاخرة | حلويات بوسي'
    };
    
    const currentTitle = titles[sectionId] || 'المركز الإداري لحلويات بوسي';
    const textTitle = document.getElementById('current-section-title');
    if (textTitle) textTitle.innerText = currentTitle;

    if (window.innerWidth <= 1024) window.toggleSidebar(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (sectionId === 'simulator-settings-section') {
        loadSimulatorSettings();
    }
};

window.switchAdminTab = function(tabId, targetBtn = null) {
    const contents = document.querySelectorAll('.admin-tab-content');
    contents.forEach(content => content.classList.remove('active-tab'));
    
    const buttons = document.querySelectorAll('.admin-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) targetPanel.classList.add('active-tab');
    
    if (targetBtn) {
        targetBtn.classList.add('active');
    } else {
        const activeBtn = document.querySelector(`.admin-tab-btn[data-target="${tabId}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
};

window.toggleFlowerFields = function(categoryName) {
    const flowerSection = document.getElementById('flower-exclusive-fields');
    if (flowerSection) {
        if (categoryName && (categoryName.includes('ورد') || categoryName.includes('الورد') || categoryName.includes('بوكيه') || categoryName.includes('تنسيق'))) {
            flowerSection.style.display = 'block';
        } else {
            flowerSection.style.display = 'none';
            const inputs = flowerSection.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
    }
};

window.updateStockLabel = function(checkbox) {
    const label = document.getElementById('stock-status-text');
    if (!label) return;
    if (checkbox.checked) {
        label.innerText = "متوفر للطلب"; 
        label.className = "font-semibold text-base text-white";
    } else {
        label.innerText = "نفذت الكمية"; 
        label.className = "font-semibold text-base text-red-400";
    }
};

window.updateDiscountLabel = function(checkbox) {
    const label = document.getElementById('discount-status-text');
    if (!label) return;
    if (checkbox.checked) {
        label.innerText = "خصم مفعّل"; 
        label.className = "font-semibold text-base text-brand-discount";
    } else {
        label.innerText = "لا يوجد عرض"; 
        label.className = "font-semibold text-base text-white";
    }
};

// ==========================================
// 3. التنبيهات ونوافذ التأكيد السيادية (Modals & Toasts)
// ==========================================
window.showToast = function(msg, type = "success") {
    const toast = document.getElementById('admin-toast');
    const toastMsg = document.getElementById('toast-msg');
    if (!toast || !toastMsg) return;

    toastMsg.innerText = msg;
    
    const icon = document.getElementById('toast-icon');
    if (icon) {
        if (type === 'error') {
            toast.style.borderColor = '#ef4444';
            icon.className = "w-8 h-8 text-rose-500 shrink-0";
            icon.setAttribute('data-lucide', 'alert-circle');
        } else if (type === 'info') {
            toast.style.borderColor = '#3b82f6';
            icon.className = "w-8 h-8 text-blue-400 shrink-0";
            icon.setAttribute('data-lucide', 'info');
        } else {
            toast.style.borderColor = 'var(--bose-pink)';
            icon.className = "w-8 h-8 text-brand-pink shrink-0";
            icon.setAttribute('data-lucide', 'check-circle');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    toast.classList.remove('active'); 
    void toast.offsetWidth; 
    toast.classList.add('active');
    
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('active'), 4000);
};

window.showConfirm = function(message, callback) {
    const modal = document.getElementById('bose-confirm-modal');
    document.getElementById('bose-confirm-message').innerText = message;
    confirmCallback = callback;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.closeConfirmModal = function() {
    const modal = document.getElementById('bose-confirm-modal');
    if (!modal) return;
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    confirmCallback = null;
};

// ==========================================
// 4. محرك رفع الصور والبوسترات (Cloudinary Multi-Upload)
// ==========================================
window.previewImage = function(previewId, iconId, url) {
    const preview = document.getElementById(previewId);
    const icon = document.getElementById(iconId);
    if (!preview || !icon) return;

    if (url && url.length > 5) {
        preview.src = url; 
        preview.classList.remove('hidden'); 
        icon.classList.add('hidden');
    } else {
        preview.src = "";
        preview.classList.add('hidden'); 
        icon.classList.remove('hidden');
    }
};

window.handlePreviewError = function(previewId, iconId) {
    const preview = document.getElementById(previewId);
    const icon = document.getElementById(iconId);
    if (preview && icon) {
        preview.classList.add('hidden'); 
        icon.classList.remove('hidden');
    }
};

const CLOUDINARY_CLOUD_NAME = "dyx4w0dr1"; 
const CLOUDINARY_UPLOAD_PRESET = "gct8i28h"; 
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

window.uploadToCloudinary = async function(fileInput, urlInputId, previewId, placeholderId) {
    const file = fileInput.files[0];
    if (!file) return;

    const btn = fileInput.parentElement.querySelector('button');
    const originalBtnHtml = btn ? btn.innerHTML : 'رفع';

    try {
        if (btn) {
            btn.innerHTML = '<i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i> <span class="font-bold text-base">جاري الرفع...</span>';
            btn.disabled = true;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        
        window.showToast("جاري المعالجة والرفع للسحابة...", "info");

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const data = await response.json();
        
        if (data.secure_url) {
            document.getElementById(urlInputId).value = data.secure_url;
            window.previewImage(previewId, placeholderId, data.secure_url);
            window.showToast("تم اعتماد الصورة بنجاح.");
        } else {
            throw new Error("لم يتم إرجاع رابط سليم من السحابة");
        }
    } catch (error) {
        console.error("عائق تقني مفصل:", error);
        window.showToast("عائق تقني أثناء الرفع. يرجى مراجعة الاتصال.", "error");
    } finally {
        if (btn) { 
            btn.innerHTML = originalBtnHtml; 
            btn.disabled = false; 
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
        fileInput.value = ''; 
    }
};

// ==========================================
// 5. إدارة بيانات الكتالوج والبث السحابي الحي (Catalog CRUD)
// ==========================================
function loadCatalog() {
    try {
        db.collection('catalog').onSnapshot((querySnapshot) => {
            catalogData = [];
            let categoriesSet = new Set(['التورت', 'الجاتوهات', 'السينابون', 'الدوناتس', 'ورد', 'الديسباسيتو', 'القشطوطة', 'كبات السعادة']);

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                catalogData.push({ id: docSnap.id, ...data });
                if (data.category) categoriesSet.add(data.category.trim());
            });

            renderDynamicSidebarCategories(categoriesSet);
            populateCategoryDatalist(categoriesSet);

            // التحقق والتحكم عند القفز المباشر من المونيتور برابط مصفى
            const urlParams = new URLSearchParams(window.location.search);
            const sectionParam = urlParams.get('section');
            if (sectionParam && categoriesSet.has(sectionParam.trim()) && !selectedCategory) {
                selectedCategory = sectionParam.trim();
                window.filterCatalogBySection(selectedCategory);
            } else if (selectedCategory) {
                renderCatalogGridForSection(selectedCategory);
            }
        }, (error) => {
            console.error("Firestore Catalog Stream Error:", error);
            window.showToast("خطأ أثناء مزامنة الكتالوج سحابياً", "error");
        });

    } catch (error) {
        console.error(error);
        window.showToast("عطل في سحب بيانات الكتالوج.", "error");
    }
}

function renderDynamicSidebarCategories(categoriesSet) {
    const sidebarNav = document.getElementById('sidebar-dynamic-categories');
    if (!sidebarNav) return;

    let sidebarHtml = '';
    Array.from(categoriesSet).forEach(catName => {
        const isActive = (selectedCategory === catName) ? 'active' : '';
        sidebarHtml += `
            <div class="submenu-item ${isActive}" data-category="${catName}">
                <i data-lucide="folder" class="w-5 h-5 text-brand-pink shrink-0"></i>
                <span class="truncate">${catName}</span>
            </div>
        `;
    });
    
    sidebarNav.innerHTML = sidebarHtml;

    const hasFlowers = Array.from(categoriesSet).some(cat => cat.includes('ورد') || cat.includes('بوكيه') || cat.includes('تنسيق'));
    if (hasFlowers) {
        const simulatorItemHtml = `
            <div id="btn-goto-simulator" class="submenu-item mt-4 pt-4 border-t border-brand-border/30 text-brand-pink hover:text-white">
                <i data-lucide="sliders-horizontal" class="w-5 h-5"></i> إعدادات محاكي التنسيق
            </div>
        `;
        sidebarNav.insertAdjacentHTML('beforeend', simulatorItemHtml);
        
        document.getElementById('btn-goto-simulator').addEventListener('click', () => {
            window.switchSection('simulator-settings-section');
            window.toggleSidebar(false);
        });
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();

    sidebarNav.querySelectorAll('.submenu-item[data-category]').forEach(item => {
        item.addEventListener('click', function() {
            const cat = this.getAttribute('data-category');
            window.filterCatalogBySection(cat, this);
        });
    });
}

function populateCategoryDatalist(categoriesSet) {
    const datalist = document.getElementById('existing-categories');
    if (!datalist) return;
    datalist.innerHTML = "";
    categoriesSet.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        datalist.appendChild(option);
    });
}

window.filterCatalogBySection = function(catName, element = null) {
    selectedCategory = catName;
    
    document.querySelectorAll('#sidebar-dynamic-categories .submenu-item').forEach(el => el.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else {
        const target = document.querySelector(`#sidebar-dynamic-categories .submenu-item[data-category="${catName}"]`);
        if (target) target.classList.add('active');
    }

    const txtFilter = document.getElementById('current-filtered-cat-title');
    const txtBack = document.getElementById('back-cat-name');
    if (txtFilter) txtFilter.innerText = catName;
    if (txtBack) txtBack.innerText = catName; 

    renderCatalogGridForSection(catName);
    window.switchSection('product-list');
};

function renderCatalogGridForSection(catName) {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    const filteredProducts = catalogData.filter(p => p.category === catName);

    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-32 text-brand-textMuted font-bold border-2 border-dashed border-brand-border rounded-3xl">
                <i data-lucide="inbox" class="w-20 h-20 mx-auto mb-6 opacity-30"></i>
                <span class="text-2xl block">القسم فارغ حالياً. يمكن إضافة منتجات جديدة الآن.</span>
            </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    let html = '';
    filteredProducts.forEach(p => {
        const isOut = p.inStock === false;
        const imgSrc = p.img || p.image || '';
        const displayPrice = parseFloat(p.price) || 0;
        const pJson = encodeURIComponent(JSON.stringify(p));
        const isFullWidth = p.displayStyle === 'full' || p.gridSpan === 'full';
        const hasDiscount = p.hasDiscount === true && p.oldPrice > p.price;
        const finalDesc = p.description || p.desc || 'لا يوجد وصف تسويقي رسمي';

        html += `
            <div class="catalog-item ${isOut ? 'out-of-stock' : ''} ${isFullWidth ? 'md:col-span-2 xl:col-span-3' : ''}">
                ${hasDiscount && !isOut ? `<div class="discount-badge">عرض خاص 🔥</div>` : ''}
                <div class="aspect-video w-full overflow-hidden bg-[#0c0709] relative border-b border-brand-border" style="height: 180px;">
                    <img src="${imgSrc}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/300x180?text=BoseSweets'">
                    ${isOut ? '<div class="absolute top-6 left-6 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-black shadow-lg z-20">نفذت الكمية</div>' : ''}
                </div>
                <div class="p-10 flex flex-col flex-grow">
                    <div class="flex justify-between items-start mb-6">
                        <span class="bg-[#0c0709] border border-brand-border text-brand-pink px-4 py-2 rounded-xl text-sm font-black">
                            <i data-lucide="${isFullWidth ? 'maximize' : 'columns'}" class="w-4 h-4 inline mr-1"></i>
                            ${isFullWidth ? 'ممتد (يملأ الشاشة)' : 'عادي (نصف الشاشة)'}
                        </span>
                        <div class="text-right">
                            ${hasDiscount ? `<span class="block text-brand-textMuted line-through text-lg font-bold opacity-70 mb-1">${p.oldPrice} ج.م</span>` : ''}
                            <span class="font-black text-4xl ${hasDiscount ? 'text-brand-discount' : 'text-white'}">${displayPrice} <span class="text-xl">ج.م</span></span>
                        </div>
                    </div>
                    <h4 class="font-black text-3xl text-white mb-4 leading-tight">${p.name || 'بدون اسم'}</h4>
                    <p class="text-lg text-brand-textMuted font-bold line-clamp-2 mb-10 flex-grow opacity-80">${finalDesc}</p>
                    
                    <div class="flex items-center gap-6 pt-8 border-t border-brand-border">
                        <button onclick="window.editProduct('${pJson}')" class="btn-edit-product btn-action flex-1 py-4 h-auto rounded-2xl bg-[#0c0709] hover:bg-brand-pink" title="فتح غرفة العمليات والتعديل">
                            <i data-lucide="edit-3" class="w-8 h-8"></i>
                        </button>
                        <button onclick="window.deleteProduct('${p.id}', '${p.name}', this)" class="btn-delete-product btn-action danger flex-none w-16 h-auto py-4 rounded-2xl" title="حذف نهائي">
                            <i data-lucide="trash-2" class="w-8 h-8"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.openIsolatedEditor = function() {
    window.clearForm();
    document.getElementById('prod-cat').value = selectedCategory;
    document.getElementById('editor-title').innerHTML = `<i data-lucide="plus-square" class="text-brand-pink w-10 h-10"></i> هندسة منتج جديد في: ${selectedCategory}`;
    window.toggleFlowerFields(selectedCategory);
    window.switchAdminTab('tab-identity'); 
    window.switchSection('product-editor');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.returnToIsolatedSection = function() {
    window.switchSection('product-list');
};

window.clearForm = function() {
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-cat').value = selectedCategory; 
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-old-price').value = '';
    document.getElementById('prod-desc').value = '';
    document.getElementById('prod-flavors').value = '';
    document.getElementById('prod-img').value = '';
    document.getElementById('prod-hero-img').value = '';
    document.getElementById('productDisplayStyle').value = 'half'; 
    
    document.getElementById('prod-img-natural').value = '';
    document.getElementById('prod-img-artificial').value = '';
    document.getElementById('prod-img-cash').value = '';
    document.getElementById('prod-img-choco').value = '';
    
    document.getElementById('prod-card-w').value = 280; 
    document.getElementById('val-custom-w').innerText = 'تلقائي';
    document.getElementById('prod-card-h').value = 350; 
    document.getElementById('val-custom-h').innerText = 'تلقائي';
    
    const stockCheck = document.getElementById('prod-stock'); 
    stockCheck.checked = true; 
    window.updateStockLabel(stockCheck);
    
    const discountCheck = document.getElementById('prod-has-discount'); 
    discountCheck.checked = false; 
    window.updateDiscountLabel(discountCheck);
    
    window.previewImage('img-preview', 'img-placeholder', '');
    window.previewImage('hero-preview', 'hero-placeholder', '');
    window.previewImage('preview-natural', 'placeholder-natural', '');
    window.previewImage('preview-artificial', 'placeholder-artificial', '');
    window.previewImage('preview-cash', 'placeholder-cash', '');
    window.previewImage('preview-choco', 'placeholder-choco', '');

    window.toggleFlowerFields(selectedCategory);
};

window.editProduct = function(pJsonEncoded) {
    const p = JSON.parse(decodeURIComponent(pJsonEncoded));
    
    document.getElementById('prod-id').value = p.id || '';
    document.getElementById('prod-name').value = p.name || '';
    document.getElementById('prod-cat').value = p.category || selectedCategory; 
    document.getElementById('prod-price').value = parseFloat(p.price) || 0;
    document.getElementById('prod-old-price').value = parseFloat(p.oldPrice) || '';
    
    const finalDesc = p.description || p.desc || '';
    document.getElementById('prod-desc').value = finalDesc;
    document.getElementById('prod-flavors').value = p.flavors || '';
    
    const imgSrc = p.img || p.image || '';
    document.getElementById('prod-img').value = imgSrc;
    window.previewImage('img-preview', 'img-placeholder', imgSrc);

    const heroSrc = p.heroImg || p.heroImage || '';
    document.getElementById('prod-hero-img').value = heroSrc;
    window.previewImage('hero-preview', 'hero-placeholder', heroSrc);

    const naturalSrc = p.imgNatural || p.naturalImage || '';
    document.getElementById('prod-img-natural').value = naturalSrc;
    window.previewImage('preview-natural', 'placeholder-natural', naturalSrc);

    const artificialSrc = p.imgArtificial || p.artificialImage || '';
    document.getElementById('prod-img-artificial').value = artificialSrc;
    window.previewImage('preview-artificial', 'placeholder-artificial', artificialSrc);

    const cashSrc = p.imgCash || p.cashImage || '';
    document.getElementById('prod-img-cash').value = cashSrc;
    window.previewImage('preview-cash', 'placeholder-cash', cashSrc);

    const chocoSrc = p.imgChoco || p.chocoImage || '';
    document.getElementById('prod-img-choco').value = chocoSrc;
    window.previewImage('preview-choco', 'placeholder-choco', chocoSrc);

    document.getElementById('productDisplayStyle').value = p.displayStyle || p.gridSpan || 'half'; 
    
    document.getElementById('prod-card-w').value = p.cardWidth || 280; 
    document.getElementById('val-custom-w').innerText = (p.cardWidth ? p.cardWidth + 'px' : 'تلقائي');
    document.getElementById('prod-card-h').value = p.cardHeight || 350; 
    document.getElementById('val-custom-h').innerText = (p.cardHeight ? p.cardHeight + 'px' : 'تلقائي');
    
    const stockCheck = document.getElementById('prod-stock'); 
    stockCheck.checked = p.inStock !== false && p.stock !== false; 
    window.updateStockLabel(stockCheck);
    
    const discountCheck = document.getElementById('prod-has-discount'); 
    discountCheck.checked = p.hasDiscount === true; 
    window.updateDiscountLabel(discountCheck);
    
    document.getElementById('editor-title').innerHTML = `<i data-lucide="edit-3" class="text-brand-pink w-10 h-10"></i> هندسة منتج: ${p.name || ''}`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    window.toggleFlowerFields(p.category || selectedCategory);
    window.switchAdminTab('tab-identity'); 
    window.switchSection('product-editor');
};

window.deleteProduct = async function(id, name, btnElement) {
    window.showConfirm(`قرار سيادي قاطع: هل التأكيد على إزالة [${name}] نهائياً؟`, async () => {
        const originalHtml = btnElement ? btnElement.innerHTML : '';
        try {
            if (btnElement) {
                btnElement.innerHTML = '<i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i>';
                btnElement.disabled = true;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
            
            await db.collection('catalog').doc(id).delete();
            
            await db.collection('system').doc('syncFlag').set({ 
                forceRefresh: true, 
                lastAdminUpdate: Date.now(),
                updateSource: 'admin_catalog_delete' 
            }, { merge: true });
            
            window.showToast(`تم مسح المنتج نهائياً بنجاح.`);
        } catch (error) { 
            console.error("عطل فني مفصل أثناء الحذف:", error);
            window.showToast("عائق فني في السحابة. يرجى المحاولة لاحقاً.", "error"); 
        } finally {
            if (btnElement) {
                btnElement.innerHTML = originalHtml;
                btnElement.disabled = false;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }
    });
};

window.saveProduct = async function() {
    const btnSave = document.getElementById('btn-save-product');
    const originalBtnHtml = btnSave ? btnSave.innerHTML : 'اعتماد التحديثات وإرسالها للسحابة فوراً';

    const idInput = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-cat').value.trim(); 
    const price = parseFloat(document.getElementById('prod-price').value) || 0;
    const oldPrice = parseFloat(document.getElementById('prod-old-price').value) || 0;
    const img = document.getElementById('prod-img').value.trim();
    
    if (!name || !category || price <= 0 || !img) {
        window.showToast("الاسم، القسم، السعر، ورابط الصورة شروط أساسية للاعتماد.", "error");
        return;
    }

    const finalStyle = document.getElementById('productDisplayStyle').value;
    const heroImgValue = document.getElementById('prod-hero-img').value.trim();
    const imgNaturalValue = document.getElementById('prod-img-natural').value.trim();
    const imgArtificialValue = document.getElementById('prod-img-artificial').value.trim();
    const imgCashValue = document.getElementById('prod-img-cash').value.trim();
    const imgChocoValue = document.getElementById('prod-img-choco').value.trim();

    // هندسة الحقول المزدوجة المتوافقة بنسبة 100% مع كافة أجزاء موقع حلويات بوسي لمنع الأعطال وفقدان الروابط
    const productData = {
        name: name, 
        category: category, 
        price: price, 
        oldPrice: oldPrice,
        hasDiscount: document.getElementById('prod-has-discount').checked,
        description: document.getElementById('prod-desc').value.trim(),
        desc: document.getElementById('prod-desc').value.trim(),
        flavors: document.getElementById('prod-flavors').value.trim(),
        
        img: img, 
        image: img, 
        
        heroImg: heroImgValue,
        heroImage: heroImgValue,
        
        imgNatural: imgNaturalValue,
        naturalImage: imgNaturalValue,
        
        imgArtificial: imgArtificialValue,
        artificialImage: imgArtificialValue,
        
        imgCash: imgCashValue,
        cashImage: imgCashValue,
        
        imgChoco: imgChocoValue,
        chocoImage: imgChocoValue,

        gridSpan: finalStyle,
        displayStyle: finalStyle, 
        cardWidth: parseInt(document.getElementById('prod-card-w').value),
        cardHeight: parseInt(document.getElementById('prod-card-h').value),
        inStock: document.getElementById('prod-stock').checked,
        stock: document.getElementById('prod-stock').checked,
        updatedAt: Date.now(), 
        isActive: true
    };

    try {
        if (btnSave) {
            btnSave.innerHTML = '<i data-lucide="loader-2" class="w-10 h-10 animate-spin"></i> <span class="font-black">جاري المعالجة والاعتماد السحابي...</span>';
            btnSave.disabled = true;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        if (idInput) { 
            await db.collection('catalog').doc(idInput).set(productData, { merge: true }); 
        } else { 
            await db.collection('catalog').add(productData); 
        }
        
        // الترس السيادي الذي يربط المحرك مباشرة بصفحة المراقبة التشخيصية والمزامنة الحية
        await db.collection('system').doc('syncFlag').set({ 
            forceRefresh: true, 
            lastAdminUpdate: Date.now(),
            updateSource: 'admin_catalog_save'
        }, { merge: true });
        
        window.showToast("تم الحفظ والاعتماد السحابي الفوري بنجاح.");
        window.filterCatalogBySection(category);
        
    } catch (error) { 
        console.error("عطل فني مفصل أثناء الحفظ:", error);
        window.showToast("عطل اتصالي منع التخزين. يرجى المحاولة لاحقاً.", "error"); 
    } finally {
        if (btnSave) {
            btnSave.innerHTML = originalBtnHtml;
            btnSave.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
};

// ==========================================
// 6. مراقبة وإدارة طلبات العملاء الحية (Live Orders Tracking)
// ==========================================
window.fetchAdminOrders = async function() {
    const container = document.getElementById('orders-container');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-20 text-brand-textMuted font-bold text-xl">
                <i data-lucide="loader-2" class="w-12 h-12 animate-spin mx-auto mb-4 text-brand-pink"></i> 
                جاري سحب وفحص طلبات العملاء...
            </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    try {
        db.collection('orders').onSnapshot((ordersSnapshot) => {
            let ordersArray = [];
            ordersSnapshot.forEach((docSnap) => {
                ordersArray.push({ id: docSnap.id, ...docSnap.data() });
            });

            ordersArray.sort((a, b) => {
                const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
                const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
                return timeB - timeA;
            });

            let ordersHtml = '';
            
            if (ordersArray.length === 0) {
                ordersHtml = `
                    <div class="text-center py-20 text-brand-textMuted font-bold text-xl border-2 border-dashed border-brand-border rounded-3xl">
                        <i data-lucide="package-open" class="w-16 h-16 mx-auto mb-4 text-brand-pink opacity-40"></i>
                        لا توجد طلبات واردة حالياً في السجل.
                    </div>`;
            } else {
                ordersArray.forEach((orderData) => {
                    const orderId = orderData.id;
                    const order = orderData;
                    let itemsHtml = '';
                    
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            let itemDetailsHtml = '';
                            
                            if (item.isCustom && item.details) {
                                if (item.details.category === 'ورد') {
                                    let matText = item.details.material === 'natural' ? 'ورد طبيعي' : (item.details.material === 'artificial' ? 'ورد صناعي فاخر' : 'ورد ستان حريري');
                                    let addonsList = [];
                                    if (item.details.hasGift) addonsList.push(`<span class="text-brand-pink">كارت إهداء مخطوط ("${item.details.giftText || ''}")</span>`);
                                    if (item.details.hasRibbon) addonsList.push(`<span class="text-emerald-400">🎀 شريط ستان مطبوع عليه: ("${item.details.ribbonText || ''}")</span>`);
                                    if (item.details.photoCount > 0) addonsList.push(`<span class="text-blue-400">📸 صور مطبوعة عدد (${item.details.photoCount})</span>`);
                                    if (item.details.chocolateBudget > 0) addonsList.push(`<span class="text-yellow-500">🍫 شوكولاتة فاخرة بميزانية ${item.details.chocolateBudget} ج.م (تفضيلات: ${item.details.chocolatePreferences || 'مشكل'})</span>`);
                                    if (item.details.cashAmount > 0) addonsList.push(`<span class="text-emerald-300 font-black">💵 كاش نقدي منسق بقيمة ${item.details.cashAmount} ج.م</span>`);
                                    
                                    itemDetailsHtml = `
                                        <div class="mt-4 p-5 bg-brand-bg rounded-2xl border border-brand-border text-sm text-brand-textMuted space-y-2">
                                            <p class="text-brand-pink font-black text-base flex items-center gap-2">
                                                <i data-lucide="flower" class="w-5 h-5"></i> مواصفات تنسيق بوكيه الورد الفاخر:
                                            </p>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                <p>• الحجم المعتمد والنوع: <span class="text-white font-black">${item.details.qty || 15} وردة</span> (${matText})</p>
                                                <p>• درجة لون الورد: <span class="text-white font-bold">${item.details.color || 'أحمر'}</span></p>
                                            </div>
                                            ${addonsList.length > 0 ? `
                                            <div class="mt-3 pt-3 border-t border-brand-border/40 text-xs space-y-2">
                                                <p class="font-bold text-white mb-2">🎁 الإضافات والمرفقات اللوجستية للطلب:</p>
                                                <ul class="list-disc pr-5 space-y-1">
                                                    ${addonsList.map(addon => `<li>${addon}</li>`).join('')}
                                                </ul>
                                            </div>` : ''}
                                        </div>
                                    `;
                                } else {
                                    let shapeText = item.details.shape === 'round' ? 'شكل دائري' : (item.details.shape === 'heart' ? 'شكل قلب' : (item.details.shape === 'square' ? 'شكل مربع' : 'شكل مستطيل'));
                                    let printText = 'تزيين يدوي كلاسيكي بدون طباعة صور';
                                    if (item.details.print === 'edible') {
                                        printText = '<span class="text-emerald-400 font-black">🖼️ صورة غذائية قابلة للأكل مدمجة (Edible Photo Overlay)</span>';
                                    } else if (item.details.print === 'non_edible') {
                                        printText = '<span class="text-yellow-500 font-bold">🖼️ صورة كرتونية ديكور غير قابلة للأكل (Decor Image)</span>';
                                    }
                                    
                                    let addonsList = [];
                                    if (item.details.gift) {
                                        addonsList.push(`<span class="text-emerald-400">✉️ كارت هدية مخصص فاخر مكتوب عليه: "${item.details.cardText || ''}"</span>`);
                                    }
                                    if (item.details.occasionTheme) {
                                        addonsList.push(`<span>🎈 مناسبة التورتة الإنشائية: ${item.details.occasionTheme}</span>`);
                                    }
                                    if (item.details.healthNotes && item.details.healthNotes !== 'لا يوجد') {
                                        addonsList.push(`<span class="text-red-400 font-bold">⚠️ تنبيهات الحساسية والنظام الطبي: ${item.details.healthNotes}</span>`);
                                    }

                                    itemDetailsHtml = `
                                        <div class="mt-4 p-5 bg-brand-bg rounded-2xl border border-brand-border text-sm text-brand-textMuted space-y-2">
                                            <p class="text-brand-pink font-black text-base flex items-center gap-2">
                                                <i data-lucide="cake" class="w-5 h-5"></i> مواصفات التورتة الملكية المصممة:
                                            </p>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                <p>• المقاس الهندسي والشكل: تكفي <span class="text-white font-black">${item.details.people || 4} أفراد</span> (${shapeText})</p>
                                                <p>• نكهة الكيك وحشو الكريمة: <span class="text-brand-pink font-black">${item.details.flavor || 'فانيليا فريش'}</span></p>
                                            </div>
                                            <p class="text-xs">• المظهر الخارجي والطباعة: ${printText}</p>
                                            ${addonsList.length > 0 ? `
                                            <div class="mt-3 pt-3 border-t border-brand-border/40 text-xs space-y-2">
                                                <p class="font-bold text-white mb-2">🎁 تفاصيل التخصيص والملاحظات لخطوط المطبخ:</p>
                                                <ul class="list-disc pr-5 space-y-1">
                                                    ${addonsList.map(addon => `<li>${addon}</li>`).join('')}
                                                </ul>
                                            </div>` : ''}
                                        </div>
                                    `;
                                }
                            }
                            
                            itemsHtml += `
                                <div class="border-b border-brand-border/50 last:border-b-0 py-4">
                                    <div class="flex justify-between items-center">
                                        <p class="font-black text-xl text-white">${item.name}</p>
                                        <span class="bg-brand-pink text-[#0c0709] font-black text-sm px-3 py-1 rounded-full">العدد: ${item.quantity || item.qty || 1}</span>
                                    </div>
                                    ${itemDetailsHtml}
                                </div>
                            `;
                        });
                    }

                    const formattedDate = order.orderDate || 'غير محدد';
                    const formattedTime = order.orderTime || 'غير محدد';
                    const orderDateObj = order.createdAt || order.timestamp;
                    const clientTimeStr = orderDateObj ? new Date(orderDateObj).toLocaleString('ar-EG', { hour12: true }) : 'وقت الاستلام غير معروف';
                    
                    const status = order.status || 'pending';

                    ordersHtml += `
                        <div class="bg-brand-surface border border-brand-border rounded-3xl p-8 shadow-xl" id="order-card-${orderId}">
                            <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-brand-border pb-6 mb-6">
                                <div>
                                    <span class="bg-[#0c0709] border border-brand-border text-brand-pink px-4 py-2 rounded-xl text-xs font-black mb-3 inline-block">رقم الطلب: ${orderId}</span>
                                    <h4 class="text-3xl font-black text-white">${order.customerName || 'عميل مجهول'}</h4>
                                    <p class="text-sm font-bold text-brand-textMuted mt-1">تاريخ تقديم الطلب: ${clientTimeStr}</p>
                                </div>
                                <div class="text-right">
                                    <span class="block text-brand-textMuted font-bold text-sm mb-1">طريقة الاستلام: ${order.deliveryMode || 'استلام'}</span>
                                    <span class="font-black text-4xl text-brand-pink">${order.grandTotal || order.cartTotal || 0} <span class="text-xl">ج.م</span></span>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 xl:grid-cols-2 gap-12 mb-8">
                                <div class="space-y-4">
                                    <h5 class="font-black text-xl text-white border-b border-brand-border/50 pb-2"><i data-lucide="user" class="w-5 h-5 inline mr-1 text-brand-pink"></i> بيانات الاتصال والتوصيل</h5>
                                    <p class="text-sm font-bold text-brand-textMuted">📞 رقم الواتساب الأساسي: <span class="text-white select-all font-mono tracking-widest">${order.whatsappPhone || 'غير مدرج'}</span></p>
                                    ${order.deliveryMode === 'توصيل' ? `
                                        <p class="text-sm font-bold text-brand-textMuted">🏠 العنوان بالتفصيل: <span class="text-white font-black">${order.detailedAddress || order.address || 'العنوان غير مدرج'}</span></p>
                                        <p class="text-sm font-bold text-brand-textMuted">📞 هاتف بديل للتواصل: <span class="text-white font-black">${order.altPhone || 'غير مدرج'}</span></p>
                                    ` : `
                                        <p class="text-sm font-bold text-brand-textMuted">🏢 المقر: فرع الكفاح.</p>
                                    `}
                                    <p class="text-sm font-bold text-brand-textMuted">📅 موعد الاستلام المطلوب: <span class="text-brand-pink font-black text-lg">${formattedDate} - الساعة ${formattedTime}</span></p>
                                    <div class="pt-4 flex items-center gap-3">
                                        <label class="text-white font-bold text-sm">تعديل الحالة اللوجستية:</label>
                                        <select onchange="window.updateOrderStatus('${orderId}', this.value)" class="bg-[#0c0709] border border-brand-border text-white text-base rounded-xl px-4 py-2 font-bold outline-none cursor-pointer focus:border-brand-pink transition-all">
                                            <option value="pending" ${status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                                            <option value="preparing" ${status === 'preparing' ? 'selected' : ''}>جاري التحضير</option>
                                            <option value="completed" ${status === 'completed' ? 'selected' : ''}>تم التسليم</option>
                                            <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>إلغاء الطلب</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="space-y-4">
                                    <h5 class="font-black text-xl text-white border-b border-brand-border/50 pb-2"><i data-lucide="cookie" class="w-5 h-5 inline mr-1 text-brand-pink"></i> تفاصيل المأكولات والمصنفات</h5>
                                    <div class="divide-y divide-brand-border/30 bg-[#0c0709] p-6 rounded-2xl border border-brand-border">
                                        ${itemsHtml}
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-4 pt-6 border-t border-brand-border">
                                <a href="https://wa.me/20${order.whatsappPhone ? order.whatsappPhone.replace(/^0/, '') : ''}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-8 rounded-xl transition-all flex items-center gap-3 text-lg">
                                    <i data-lucide="message-circle" class="w-6 h-6"></i> تواصل مع العميل وتأكيد الطلب
                                </a>
                                <button onclick="window.deleteAdminOrder('${orderId}', this)" class="btn-archive-order bg-[#0c0709] border-2 border-red-900 text-red-500 hover:bg-red-900/20 font-black py-4 px-8 rounded-xl transition-all flex items-center gap-3 text-lg">
                                    <i data-lucide="trash-2" class="w-6 h-6"></i> أرشفة ومسح الطلب نهائياً
                                </button>
                            </div>
                        </div>
                    `;
                });
            }
            
            if (container) {
                container.innerHTML = ordersHtml;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });
    } catch (error) {
        console.error(error);
        window.showToast("فشل تحديث الطلبات الحية سحابياً", "error");
    }
};

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        await db.collection('orders').doc(orderId).update({ status: newStatus });
        window.showToast("تم تحديث حالة الطلب بنجاح");
    } catch (error) {
        console.error("Order status update failed:", error);
        window.showToast("تعذر تحديث حالة الطلب حالياً", "error");
    }
};

window.deleteAdminOrder = async function(orderId, btnElement) {
    window.showConfirm("تأكيد سيادي: هل ترغب بحذف وأرشفة هذا الطلب نهائياً من السجلات؟", async () => {
        const originalHtml = btnElement ? btnElement.innerHTML : '';
        try {
            if (btnElement) {
                btnElement.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> جاري الحذف...';
                btnElement.disabled = true;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
            await db.collection('orders').doc(orderId).delete();
            
            await db.collection('system').doc('syncFlag').set({ 
                forceRefresh: true, 
                lastAdminUpdate: Date.now(),
                updateSource: 'admin_order_delete'
            }, { merge: true });

            window.showToast("تم مسح وأرشفة الطلب بنجاح.");
        } catch (e) {
            window.showToast("عطل اتصالي منع حذف الطلب.", "error");
        } finally {
            if (btnElement) {
                btnElement.innerHTML = originalHtml;
                btnElement.disabled = false;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }
    });
};

// ==========================================
// 7. محرك التنسيق الفاخر (Simulator Pricing Engine)
// ==========================================
window.saveBoseSimulatorSettings = async function() {
    const btn = document.getElementById('btn-save-simulator-settings');
    const originalHtml = btn ? btn.innerHTML : 'اعتماد الإعدادات سحابياً';

    const settingsData = {
        priceNatural: parseFloat(document.getElementById('adm-price-natural').value) || 0,
        priceArtificial: parseFloat(document.getElementById('adm-price-artificial').value) || 0,
        priceSatin: parseFloat(document.getElementById('adm-price-satin').value) || 0,
        priceChocolate: parseFloat(document.getElementById('adm-price-chocolate').value) || 0,
        priceCash: parseFloat(document.getElementById('adm-price-cash').value) || 0,
        priceCard: parseFloat(document.getElementById('adm-price-card').value) || 0,
        pricePhoto: parseFloat(document.getElementById('adm-price-photo').value) || 0,
        layerChocolateUrl: document.getElementById('adm-layer-chocolate-url').value.trim(),
        layerCashUrl: document.getElementById('adm-layer-cash-url').value.trim(),
        updatedAt: Date.now()
    };

    try {
        if (btn) {
            btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> جاري الحفظ والاعتماد...';
            btn.disabled = true;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        await db.collection('simulator-settings').doc('config').set(settingsData, { merge: true });
        
        await db.collection('system').doc('syncFlag').set({ 
            forceRefresh: true, 
            lastAdminUpdate: Date.now(),
            updateSource: 'admin_simulator_save'
        }, { merge: true });

        window.showToast("تم اعتماد إعدادات المحاكي بنجاح");
    } catch (error) {
        console.error("Save simulator parameters error:", error);
        window.showToast("تعذر تخزين معلمات المحاكي", "error");
    } finally {
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
};

async function loadSimulatorSettings() {
    try {
        const configDoc = await db.collection('simulator-settings').doc('config').get();
        if (configDoc.exists) {
            const data = configDoc.data();
            if (data.priceNatural !== undefined) document.getElementById('adm-price-natural').value = data.priceNatural;
            if (data.priceArtificial !== undefined) document.getElementById('adm-price-artificial').value = data.priceArtificial;
            if (data.priceSatin !== undefined) document.getElementById('adm-price-satin').value = data.priceSatin;
            if (data.priceChocolate !== undefined) document.getElementById('adm-price-chocolate').value = data.priceChocolate;
            if (data.priceCash !== undefined) document.getElementById('adm-price-cash').value = data.priceCash;
            if (data.priceCard !== undefined) document.getElementById('adm-price-card').value = data.priceCard;
            if (data.pricePhoto !== undefined) document.getElementById('adm-price-photo').value = data.pricePhoto;
            if (data.layerChocolateUrl !== undefined) document.getElementById('adm-layer-chocolate-url').value = data.layerChocolateUrl;
            if (data.layerCashUrl !== undefined) document.getElementById('adm-layer-cash-url').value = data.layerCashUrl;
        }
    } catch (error) {
        console.error("Load simulator settings failed:", error);
    }
}

// ==========================================
// 8. تهيئة خطوط مستمعي الأحداث المركزية (Central DOM Event Listeners)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadCatalog();

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-target');
            window.switchAdminTab(targetId, btn);
        });
    });

    document.getElementById('btn-open-sidebar')?.addEventListener('click', () => window.toggleSidebar(true));
    document.getElementById('btn-close-sidebar')?.addEventListener('click', () => window.toggleSidebar(false));
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => window.toggleSidebar(false));

    document.getElementById('menu-item-dash')?.addEventListener('click', function() {
        window.switchSection('dashboard', this);
    });
    document.getElementById('menu-item-orders')?.addEventListener('click', function() {
        window.switchSection('orders-section', this);
        window.fetchAdminOrders();
    });
    document.getElementById('btn-refresh-orders')?.addEventListener('click', () => {
        window.fetchAdminOrders();
    });

    document.getElementById('btn-dash-add-product')?.addEventListener('click', () => {
        window.openIsolatedEditor();
    });
    document.getElementById('btn-list-add-product')?.addEventListener('click', () => {
        window.openIsolatedEditor();
    });
    document.getElementById('btn-editor-back')?.addEventListener('click', () => {
        window.returnToIsolatedSection();
    });
    document.getElementById('btn-save-product')?.addEventListener('click', () => {
        window.saveProduct();
    });

    document.getElementById('prod-stock')?.addEventListener('change', function() {
        window.updateStockLabel(this);
    });
    document.getElementById('prod-has-discount')?.addEventListener('change', function() {
        window.updateDiscountLabel(this);
    });
    document.getElementById('prod-cat')?.addEventListener('input', function() {
        window.toggleFlowerFields(this.value);
    });

    const cardW = document.getElementById('prod-card-w');
    if (cardW) {
        cardW.addEventListener('input', function() {
            document.getElementById('val-custom-w').innerText = this.value + 'px';
        });
    }
    const cardH = document.getElementById('prod-card-h');
    if (cardH) {
        cardH.addEventListener('input', function() {
            document.getElementById('val-custom-h').innerText = this.value + 'px';
        });
    }

    document.getElementById('prod-img')?.addEventListener('input', function() {
        window.previewImage('img-preview', 'img-placeholder', this.value);
    });
    document.getElementById('prod-hero-img')?.addEventListener('input', function() {
        window.previewImage('hero-preview', 'hero-placeholder', this.value);
    });
    document.getElementById('prod-img-natural')?.addEventListener('input', function() {
        window.previewImage('preview-natural', 'placeholder-natural', this.value);
    });
    document.getElementById('prod-img-artificial')?.addEventListener('input', function() {
        window.previewImage('preview-artificial', 'placeholder-artificial', this.value);
    });
    document.getElementById('prod-img-cash')?.addEventListener('input', function() {
        window.previewImage('preview-cash', 'placeholder-cash', this.value);
    });
    document.getElementById('prod-img-choco')?.addEventListener('input', function() {
        window.previewImage('preview-choco', 'placeholder-choco', this.value);
    });

    // تهيئة مستمعات الرفع المباشر لملفات الصور عبر السحابة لـ Cloudinary
    document.getElementById('btn-upload-prod-img')?.addEventListener('click', () => document.getElementById('file-prod-img')?.click());
    document.getElementById('file-prod-img')?.addEventListener('change', function() {
        window.uploadToCloudinary(this, 'prod-img', 'img-preview', 'img-placeholder');
    });

    document.getElementById('btn-upload-prod-hero')?.addEventListener('click', () => document.getElementById('file-prod-hero')?.click());
    document.getElementById('file-prod-hero')?.addEventListener('change', function() {
        window.uploadToCloudinary(this, 'prod-hero-img', 'hero-preview', 'hero-placeholder');
    });

    document.getElementById('btn-upload-img-natural')?.addEventListener('click', () => document.getElementById('file-img-natural')?.click());
    document.getElementById('file-img-natural')?.addEventListener('change', function() {
        window.uploadToCloudinary(this, 'prod-img-natural', 'preview-natural', 'placeholder-natural');
    });

    document.getElementById('btn-upload-img-artificial')?.addEventListener('click', () => document.getElementById('file-img-artificial')?.click());
    document.getElementById('file-img-artificial')?.addEventListener('change', function() {
        window.uploadToCloudinary(this, 'prod-img-artificial', 'preview-artificial', 'placeholder-artificial');
    });

    document.getElementById('btn-upload-img-cash')?.addEventListener('click', () => document.getElementById('file-img-cash')?.click());
    document.getElementById('file-img-cash')?.addEventListener('change', function() {
        window.uploadToCloudinary(this, 'prod-img-cash', 'preview-cash', 'placeholder-cash');
    });

    document.getElementById('btn-upload-img-choco')?.addEventListener('click', () => document.getElementById('file-img-choco')?.click());
    document.getElementById('file-img-choco')?.addEventListener('change', function() {
        window.uploadToCloudinary(this, 'prod-img-choco', 'preview-choco', 'placeholder-choco');
    });

    document.getElementById('btn-save-simulator-settings')?.addEventListener('click', () => {
        window.saveBoseSimulatorSettings();
    });
});
