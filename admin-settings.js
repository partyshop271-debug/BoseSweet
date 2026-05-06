function fillGlobalSettingsFormFields() {
    const phoneInput = document.getElementById('sett-phone-input');
    const addressInput = document.getElementById('sett-address-input');
    const fbInput = document.getElementById('sett-fb-input');
    const igInput = document.getElementById('sett-ig-input');
    const quoteText = document.getElementById('sett-quote-textarea');
    
    if (phoneInput) phoneInput.value = siteSettings.footerPhone || '';
    if (addressInput) addressInput.value = siteSettings.footerAddress || '';
    if (fbInput) fbInput.value = siteSettings.social?.facebook || '';
    if (igInput) igInput.value = siteSettings.social?.instagram || '';
    if (quoteText) quoteText.value = siteSettings.footerQuote || '';
}

window.saveGlobalSettingsFromDashboard = async function() {
    const phone = document.getElementById('sett-phone-input')?.value.trim();
    const address = document.getElementById('sett-address-input')?.value.trim();
    const fb = document.getElementById('sett-fb-input')?.value.trim();
    const ig = document.getElementById('sett-ig-input')?.value.trim();
    const quote = document.getElementById('sett-quote-textarea')?.value.trim();
    
    if(!siteSettings.social) siteSettings.social = {};
    
    const updatedPayload = {
        footerPhone: phone !== undefined ? phone : siteSettings.footerPhone,
        footerAddress: address !== undefined ? address : siteSettings.footerAddress,
        footerQuote: quote !== undefined ? quote : siteSettings.footerQuote,
        social: { 
            facebook: fb !== undefined ? fb : siteSettings.social.facebook, 
            instagram: ig !== undefined ? ig : siteSettings.social.instagram, 
            tiktok: siteSettings.social?.tiktok || '' 
        }
    };
    
    siteSettings = { ...siteSettings, ...updatedPayload };

    try {
        if (typeof db !== 'undefined') {
            await db.collection('settings').doc('main').set(updatedPayload, { merge: true });
            saveEngineMemory('set');
            showSystemToast('تم حفظ وتعميم قنوات السوشيال ميديا والتكوينات بنجاح لتنعكس فوراً 👑☁️', 'success');
        } else {
            saveEngineMemory('set');
            showSystemToast('قرار مهني: تم الحفظ محلياً لحين توافر اتصال بالخادم السحابي', 'info');
        }
    } catch (e) {
        showSystemToast(`عطل في المزامنة السحابية: ${e.message}`, 'error');
    }
    
    if(typeof fillAdminSettingsForm === 'function') fillAdminSettingsForm();
};

async function applyGlobalPriceChange() {
    const percentStr = document.getElementById('global-price-percent')?.value;
    const percent = parseFloat(percentStr);
    const action = document.getElementById('global-price-action')?.value;
    
    if(isNaN(percent) || percent <= 0) { showSystemToast("قرار إداري: يرجى إدخال نسبة صحيحة أكبر من 0", "error"); return; }
    const msg = action === 'increase' ? `هل أنت متأكد من رفع جميع أسعار المنتجات بنسبة ${percent}%؟` : `هل أنت متأكد من تطبيق خصم بنسبة ${percent}%؟`;
    
    openConfirmModal('تأكيد التعديل الجماعي', msg, async () => {
        const multiplier = action === 'increase' ? (1 + (percent / 100)) : (1 - (percent / 100));
        let updatedCount = 0;
        
        for (let p of catalog) {
            if (p.price && !isNaN(p.price)) {
                if (action === 'decrease') p.oldPrice = p.price; 
                else p.oldPrice = null; 
                
                p.price = Math.round(p.price * multiplier);
                updatedCount++;
                try { if (typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('catalog', String(p.id), p); } catch (e) {}
            }
        }
        saveEngineMemory('cat'); syncCatalogMap();
        const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
        if(typeof renderAdminMenu === 'function') renderAdminMenu(currentSearch); 
        if(typeof renderAdminOverview === 'function') renderAdminOverview();
        if(typeof renderAdminCatalogGridUI === 'function') renderAdminCatalogGridUI(); 
        showSystemToast(`تم تطبيق النسبة المهنية بنجاح على ${updatedCount} منتج 👑`, "success");
    });
}

function exportBackupJSON() {
    try {
        const backupData = { catalog, settings: siteSettings, shipping: shippingZones, orders: globalOrders, gallery: galleryData };
        const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `BoseSweets_CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); a.remove(); 
        setTimeout(() => URL.revokeObjectURL(url), 100);
        showSystemToast("تم سحب نسخة سحابية شاملة لـ حلويات بوسي بنجاح ☁️", "success");
    } catch (e) { showSystemToast("حدث خطأ تقني أثناء إعداد ملف النسخة", "error"); }
}

function importBackupJSON(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(ev) {
        try {
            const data = JSON.parse(ev.target.result);
            if (Array.isArray(data)) { window.catalog = data; saveEngineMemory('cat'); } 
            else {
                if(data.settings) { window.siteSettings = data.settings; saveEngineMemory('set'); }
                if(data.shipping) { window.shippingZones = data.shipping; saveEngineMemory('ship'); }
                if(data.catalog) { window.catalog = data.catalog; saveEngineMemory('cat'); }
                if(data.orders) { window.globalOrders = data.orders; saveEngineMemory('ord'); }
                if(data.gallery) { window.galleryData = data.gallery; saveEngineMemory('gal'); }
            }
            try {
                if (typeof NetworkEngine !== 'undefined') {
                    if (Array.isArray(data)) { for (let p of data) await NetworkEngine.safeWrite('catalog', String(p.id), p); } 
                    else {
                        if(data.settings) await NetworkEngine.safeWrite('settings', 'main', data.settings); 
                        if(data.shipping) for (let z of data.shipping) await NetworkEngine.safeWrite('shipping', String(z.id), z); 
                        if(data.catalog) for (let p of data.catalog) await NetworkEngine.safeWrite('catalog', String(p.id), p); 
                        if(data.orders) for (let o of data.orders) await NetworkEngine.safeWrite('orders', String(o.id), o); 
                    }
                }
            } catch(cloudErr) {}
            showSystemToast("تم استرجاع بيانات حلويات بوسي بنجاح! جاري إعادة تهيئة النظام... 🚀", "success");
            setTimeout(() => location.reload(), 2000);
        } catch(err) { showSystemToast("قرار فني: ملف JSON غير صالح للاستيراد!", "error"); }
    };
    reader.readAsText(file);
}

function fillAdminSettingsForm() {
    if(!window.siteSettings) return;
    if(document.getElementById('set-brand')) document.getElementById('set-brand').value = siteSettings.brandName || 'حلويات بوسي'; 
    if(document.getElementById('set-hero-title')) document.getElementById('set-hero-title').value = siteSettings.heroTitle || ''; 
    if(document.getElementById('set-hero-desc')) document.getElementById('set-hero-desc').value = siteSettings.heroDesc || '';
    if(document.getElementById('set-footer-phone')) document.getElementById('set-footer-phone').value = siteSettings.footerPhone || ''; 
    if(document.getElementById('set-footer-address')) document.getElementById('set-footer-address').value = (siteSettings.footerAddress || '').replace(/<br>/g, '');
    if(document.getElementById('set-ticker-active')) document.getElementById('set-ticker-active').checked = siteSettings.tickerActive !== false;
    if(document.getElementById('set-ticker-text')) document.getElementById('set-ticker-text').value = siteSettings.tickerText || siteSettings.announcement || '';

    if(siteSettings.seo) {
        if(document.getElementById('set-seo-title')) document.getElementById('set-seo-title').value = siteSettings.seo.title || '';
        if(document.getElementById('set-seo-desc')) document.getElementById('set-seo-desc').value = siteSettings.seo.desc || '';
        if(document.getElementById('set-seo-keywords')) document.getElementById('set-seo-keywords').value = siteSettings.seo.keywords || '';
    }

    if(siteSettings.social) {
        if(document.getElementById('set-social-fb')) document.getElementById('set-social-fb').value = siteSettings.social.facebook || '';
        if(document.getElementById('set-social-ig')) document.getElementById('set-social-ig').value = siteSettings.social.instagram || '';
    }

    const v = siteSettings.visuals || defaultSettings.visuals;
    if(document.getElementById('set-visual-color-hex')) {
        document.getElementById('set-visual-color-hex').value = v.themeHex || '#ff3377';
    }
    
    executeSafely('CategoryDesc', () => { if(typeof renderCategoryDescAdmin === 'function') renderCategoryDescAdmin(); });

    // 👑 التوسيع الهندسي: استدعاء إعدادات الأبعاد والشلال
    if(siteSettings.layout_settings) {
        const viewModeRadios = document.getElementsByName('layout_viewMode');
        if(viewModeRadios) {
            viewModeRadios.forEach(radio => {
                if(radio.value === siteSettings.layout_settings.layout_viewMode) radio.checked = true;
            });
        }
        if(document.getElementById('set-layout-card-width')) document.getElementById('set-layout-card-width').value = siteSettings.layout_settings.layout_card_width || '';
        if(document.getElementById('set-layout-card-height')) document.getElementById('set-layout-card-height').value = siteSettings.layout_settings.layout_card_height || '';
        if(document.getElementById('set-layout-wf-width')) document.getElementById('set-layout-wf-width').value = siteSettings.layout_settings.layout_waterfall_img_width || '';
        if(document.getElementById('set-layout-wf-height')) document.getElementById('set-layout-wf-height').value = siteSettings.layout_settings.layout_waterfall_img_height || '';
    }

    // 👑 التوسيع الهندسي: استدعاء إعدادات شاشة التحميل والخطوط
    if(siteSettings.UI_Settings) {
        if(document.getElementById('set-loader-text')) document.getElementById('set-loader-text').value = siteSettings.UI_Settings.loader_text || '';
        if(document.getElementById('set-loader-bg-color')) document.getElementById('set-loader-bg-color').value = siteSettings.UI_Settings.loader_bgColor || '#fff0f5';
        if(document.getElementById('set-loader-text-color')) document.getElementById('set-loader-text-color').value = siteSettings.UI_Settings.loader_textColor || '#D2386C';
        
        if(siteSettings.UI_Settings.typography_config) {
            if(document.getElementById('set-global-text-color')) document.getElementById('set-global-text-color').value = siteSettings.UI_Settings.typography_config.global_text_color || '#475569';
            if(document.getElementById('set-font-family')) document.getElementById('set-font-family').value = siteSettings.UI_Settings.typography_config.main_font_family || "'Cairo', sans-serif";
            if(document.getElementById('set-font-size-base')) document.getElementById('set-font-size-base').value = siteSettings.UI_Settings.typography_config.global_font_size_base || '16px';
            if(document.getElementById('set-font-weight-bold')) document.getElementById('set-font-weight-bold').value = siteSettings.UI_Settings.typography_config.global_font_weight_bold || '900';
        }
        if(siteSettings.UI_Settings.page_dimensions) {
            if(document.getElementById('set-page-max-height')) document.getElementById('set-page-max-height').value = siteSettings.UI_Settings.page_dimensions.productPageMaxHeight || 'auto';
            if(document.getElementById('set-page-min-height')) document.getElementById('set-page-min-height').value = siteSettings.UI_Settings.page_dimensions.productPageMinHeight || '100vh';
        }
    }

    // 👑 التوسيع الهندسي: استدعاء إعدادات الهيكل
    if(siteSettings.Structure_Settings) {
        if(document.getElementById('set-you-may-like')) document.getElementById('set-you-may-like').checked = siteSettings.Structure_Settings.section_youMayAlsoLike_isActive !== false;
    }
}

window.saveAllSettings = async function() {
    if(!window.siteSettings) window.siteSettings = {};
    
    // تجميع مصفوفة برمجية ذكية لتسجيل وتفعيل الأقسام والتنسيقات الفنية
    const viewModeChecked = document.querySelector('input[name="layout_viewMode"]:checked');
    
    const layout_settings_payload = {
        layout_viewMode: viewModeChecked ? viewModeChecked.value : "columns_2",
        layout_card_width: document.getElementById('set-layout-card-width')?.value || "100%",
        layout_card_height: document.getElementById('set-layout-card-height')?.value || "auto",
        layout_waterfall_img_width: document.getElementById('set-layout-wf-width')?.value || "100%",
        layout_waterfall_img_height: document.getElementById('set-layout-wf-height')?.value || "270px",
        layout_waterfall_img_objectFit: "cover"
    };

    const UI_Settings_payload = {
        loader_bgColor: document.getElementById('set-loader-bg-color')?.value || "#fff0f5",
        loader_textColor: document.getElementById('set-loader-text-color')?.value || "#D2386C",
        loader_text: document.getElementById('set-loader-text')?.value || "جاري تجهيز منصة حلويات بوسي لحضرتك...",
        typography_config: {
            main_font_family: document.getElementById('set-font-family')?.value || "'Cairo', sans-serif",
            global_font_size_base: document.getElementById('set-font-size-base')?.value || "16px",
            global_font_weight_bold: document.getElementById('set-font-weight-bold')?.value || "900",
            global_text_color: document.getElementById('set-global-text-color')?.value || "#475569"
        },
        page_dimensions: {
            productPageMaxHeight: document.getElementById('set-page-max-height')?.value || "auto",
            productPageMinHeight: document.getElementById('set-page-min-height')?.value || "100vh"
        }
    };

    const Structure_Settings_payload = {
        footer_sections: window.siteSettings.Structure_Settings?.footer_sections || [],
        section_youMayAlsoLike_isActive: document.getElementById('set-you-may-like')?.checked !== false,
        future_sections_registry: window.siteSettings.Structure_Settings?.future_sections_registry || []
    };

    // احتفاظ ببيانات الأوصاف الحالية للأقسام لمنع فقدانها أثناء الدمج الشامل
    if(!siteSettings.catDescriptions) siteSettings.catDescriptions = {};
    if(typeof catMenu !== 'undefined' && Array.isArray(catMenu)) {
        catMenu.forEach(cat => {
            const safeId = 'desc-cat-' + Array.from(cat.name).map(c => c.charCodeAt(0)).join('');
            const descInput = document.getElementById(safeId);
            if(descInput) siteSettings.catDescriptions[cat.name] = descInput.value.trim();
        });
    }

    // دمج الحقول بالكامل وتأمين التحديث السحابي الموحد لعلامة حلويات بوسي التجارية
    const finalMasterPayload = {
        ...window.siteSettings,
        brandName: document.getElementById('set-brand')?.value || "حلويات بوسي",
        heroTitle: document.getElementById('set-hero-title')?.value || "",
        heroDesc: document.getElementById('set-hero-desc')?.value || "",
        footerPhone: document.getElementById('set-footer-phone')?.value || "",
        footerAddress: document.getElementById('set-footer-address')?.value || "",
        tickerActive: document.getElementById('set-ticker-active')?.checked !== false,
        tickerText: document.getElementById('set-ticker-text')?.value || "",
        announcement: document.getElementById('set-ticker-text')?.value || "",
        
        // المحافظة على قنوات السوشيال ميديا والهوية البصرية المعتمدة
        seo: {
            title: document.getElementById('set-seo-title')?.value || window.siteSettings.seo?.title || '',
            desc: document.getElementById('set-seo-desc')?.value || window.siteSettings.seo?.desc || '',
            keywords: document.getElementById('set-seo-keywords')?.value || window.siteSettings.seo?.keywords || ''
        },
        social: {
            facebook: document.getElementById('set-social-fb')?.value || window.siteSettings.social?.facebook || '',
            instagram: document.getElementById('set-social-ig')?.value || window.siteSettings.social?.instagram || '',
            tiktok: window.siteSettings.social?.tiktok || ''
        },
        visuals: {
            themeHex: document.getElementById('sys-brand-color')?.value || document.getElementById('set-visual-color-hex')?.value || window.siteSettings.visuals?.themeHex || '#ff3377'
        },
        
        layout_settings: layout_settings_payload,
        UI_Settings: UI_Settings_payload,
        Structure_Settings: Structure_Settings_payload
    };

    window.siteSettings = finalMasterPayload;

    try {
        if(typeof db !== 'undefined') {
            // الحفظ والتزامن المباشر داخل السيرفر السحابي المركزي لحلويات بوسي
            await db.collection('settings').doc('main').set(finalMasterPayload, { merge: true });
            if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
            showSystemToast("تم الاعتماد البرمجي وتحديث كامل قيم التكوين سحابياً بنجاح 👑☁️", "success");
        } else {
            if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
            showSystemToast("تم حفظ التعديلات الشاملة محلياً لحين استقرار الشبكة", "info");
        }
    } catch(e) {
        if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
        showSystemToast(`عطل في المزامنة السحابية: ${e.message}`, "error");
    }
};

window.triggerMasterSave = window.saveAllSettings;
window.saveStoreSettings = window.saveAllSettings;

window.renderCategoryDescAdmin = function() {
    let container = document.getElementById('dynamic-category-desc-container');
    
    if (!container) {
        const identityTab = document.getElementById('admin-identity');
        if(!identityTab) return;
        const targetSection = identityTab.querySelector('.space-y-6') || identityTab;
        const newContainer = document.createElement('div');
        newContainer.id = 'dynamic-category-desc-container';
        newContainer.className = 'space-y-3 mt-6 border-t border-slate-800 pt-4';
        newContainer.innerHTML = '<label class="block text-xs font-bold text-slate-300 mb-2">صياغة أوصاف الأقسام بأسلوب بوسي التفاعلي</label>';
        targetSection.appendChild(newContainer);
        container = newContainer;
    }
    
    container.innerHTML = '<label class="block text-xs font-bold text-slate-300 mb-2">صياغة أوصاف الأقسام بأسلوب بوسي التفاعلي</label>';
    const descriptions = siteSettings.catDescriptions || {};
    
    catMenu.forEach(cat => {
        const safeId = 'desc-cat-' + Array.from(cat.name).map(c => c.charCodeAt(0)).join('');
        const currentVal = descriptions[cat.name] || '';
        
        const fieldHtml = `
            <div class="relative mb-3">
                <span class="absolute right-4 top-4 text-[10px] font-bold text-[#ff3377] bg-pink-500/10 px-2 py-0.5 rounded">${escapeHTML(cat.name)}</span>
                <textarea id="${safeId}" placeholder="مثال: وصف احترافي يبرز جودة وطعم ${escapeHTML(cat.name)}..." class="admin-input rounded-[1.5rem] pt-10 text-sm resize-none" rows="2">${escapeHTML(currentVal)}</textarea>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', fieldHtml);
    });
};

window.renderHomepageSelection = function() {
    const overviewTab = document.getElementById('admin-overview');
    if(!overviewTab) return;
    
    let container = document.getElementById('homepage-selection-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'homepage-selection-container';
        container.className = 'app-card p-4 flex flex-col rounded-[2.5rem] mt-4 border border-indigo-500/20';
        overviewTab.appendChild(container);
    }
    
    if (!catalog || catalog.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-500 text-center font-bold">لا توجد منتجات مسجلة لاختيارها للواجهة الرئيسية.</p>';
        return;
    }
    
    let html = '<h3 class="text-sm font-black text-indigo-400 flex items-center gap-2 mb-4"><i data-lucide="layout-template" class="w-4 h-4"></i> هندسة واجهة العميل (الترشيحات)</h3>';
    html += '<div class="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">';
    
    catalog.forEach(prod => {
        const isNew = prod.badge === 'جديد 🌟' || prod.badge === 'جديد';
        const isBest = prod.badge === 'الأكثر مبيعاً 🔥' || prod.badge === 'مبيعاً';
        
        html += `
            <div class="flex items-center justify-between bg-[#0a0f1c] p-3 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-colors">
                <div class="flex items-center gap-3 w-1/2 truncate">
                    <img src="${prod.img || 'https://via.placeholder.com/50'}" class="w-8 h-8 rounded-lg object-cover shrink-0">
                    <span class="text-xs font-bold text-white truncate">${escapeHTML(prod.name)}</span>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button onclick="toggleProductBadge('${prod.id}', 'جديد 🌟')" class="px-2 py-1 text-[9px] font-bold rounded-lg border ${isNew ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}">حديثاً</button>
                    <button onclick="toggleProductBadge('${prod.id}', 'الأكثر مبيعاً 🔥')" class="px-2 py-1 text-[9px] font-bold rounded-lg border ${isBest ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}">مبيعاً</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    if(window.lucide) lucide.createIcons();
};

window.toggleProductBadge = async function(prodId, targetBadge) {
    const idx = catalog.findIndex(p => String(p.id) === String(prodId));
    if (idx === -1) return;
    
    if (catalog[idx].badge === targetBadge) {
        catalog[idx].badge = '';
    } else {
        catalog[idx].badge = targetBadge;
    }
    
    syncCatalogMap();
    try {
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('catalog', String(catalog[idx].id), catalog[idx]);
        saveEngineMemory('cat');
        showSystemToast("تم تحديث تمييز المنتج للواجهة بنجاح", "success");
    } catch(e) {
        saveEngineMemory('cat');
    }
    
    if(typeof renderHomepageSelection === 'function') renderHomepageSelection();
    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
    if(typeof renderAdminMenu === 'function') renderAdminMenu(currentSearch);
    if(typeof renderAdminCatalogGridUI === 'function') renderAdminCatalogGridUI();
};

async function changeAdminPassword() {
    const currentInput = document.getElementById('sec-current-pwd').value; 
    const newPwd = document.getElementById('sec-new-pwd').value; 
    const confirmPwd = document.getElementById('sec-confirm-pwd').value;
    if (!currentInput || !newPwd || !confirmPwd) { showSystemToast("قرار إداري: يرجى ملء جميع الحقول", "error"); return; }
    if (newPwd !== confirmPwd) { showSystemToast("قرار إداري: كلمة المرور الجديدة غير متطابقة", "error"); return; }
    if (newPwd.length < 6) { showSystemToast("الرمز السري للسحابة يجب أن يكون 6 أحرف/أرقام على الأقل", "error"); return; }

    try {
        const user = auth.currentUser;
        if (!user) { showSystemToast("انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً", "error"); return; }
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentInput);
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPwd);
        if (siteSettings.adminPassword) {
            delete siteSettings.adminPassword;
            if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings);
            saveEngineMemory('set');
        }
        showSystemToast("تم تغيير الرمز السري وتشفيره سحابياً بنجاح 🛡️", "success");
        document.getElementById('sec-current-pwd').value = ''; document.getElementById('sec-new-pwd').value = ''; document.getElementById('sec-confirm-pwd').value = '';
    } catch(e) {
        if (e.code === 'auth/wrong-password') showSystemToast("كلمة المرور الحالية غير صحيحة", "error");
        else showSystemToast("حدث خطأ تقني أثناء تشفير كلمة المرور الجديدة", "error");
    }
}

function renderAdminShipping() {
    const tbody = document.getElementById('admin-shipping-tbody');
    if(!tbody) return;
    if(!shippingZones || shippingZones.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-500 font-bold text-xs">لا يوجد مناطق توصيل معتمدة</td></tr>`; return;
    }
    tbody.innerHTML = shippingZones.map(z => `
        <tr class="hover:bg-slate-800 border-b border-slate-800/50 transition-colors">
            <td class="p-3 font-bold text-slate-200 whitespace-nowrap">${escapeHTML(z.name || '')}</td>
            <td class="p-3 font-black text-emerald-400 whitespace-nowrap">${z.fee} ج.م</td>
            <td class="p-3 text-center whitespace-nowrap">
                <button onclick="deleteShippingZoneConfirm('${z.id}', '${escapeHTML(z.name || '')}')" class="text-red-400 hover:text-white p-1.5 bg-slate-800 hover:bg-red-600 rounded-lg transition-colors relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    if(window.lucide) lucide.createIcons();
}

function openAddShippingModal() { 
    if(document.getElementById('ship-area-name')) document.getElementById('ship-area-name').value = ''; 
    if(document.getElementById('ship-area-fee')) document.getElementById('ship-area-fee').value = ''; 
    const modal = document.getElementById('admin-ship-modal');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => modal.classList.remove('opacity-0'), 10); }
}

function closeShipModal() { 
    const modal = document.getElementById('admin-ship-modal');
    if(modal) { modal.classList.add('opacity-0'); setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300); }
}

async function saveShippingZone() {
    const n = document.getElementById('ship-area-name').value.trim(); const f = parseInt(document.getElementById('ship-area-fee').value) || 0;
    if(!n) { showSystemToast("الرجاء كتابة اسم المنطقة", "error"); return; }
    const newZone = { id: 'sh_' + Date.now() + Math.floor(Math.random() * 100), name: n, fee: f }; 
    shippingZones.push(newZone);
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('shipping', String(newZone.id), newZone); 
        saveEngineMemory('ship'); showSystemToast("تم إضافة منطقة التوصيل بنجاح", "success"); 
    } catch (e) { saveEngineMemory('ship'); showSystemToast("تم الإضافة محلياً", "info"); }
    closeShipModal(); renderAdminShipping();
}

function deleteShippingZoneConfirm(id, name) {
    openConfirmModal('حذف منطقة توصيل', `هل أنت متأكد من حذف منطقة "${name}" من نطاق التغطية؟`, () => { executeDeleteShippingZone(id); });
}

async function executeDeleteShippingZone(id) {
    shippingZones = shippingZones.filter(z => String(z.id) !== String(id));
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('shipping', String(id), null); 
        saveEngineMemory('ship'); showSystemToast("تم الحذف بنجاح", "success"); 
    } catch(e) { saveEngineMemory('ship'); }
    renderAdminShipping();
}

async function saveCakeBuilderSettings() {
    if(!window.siteSettings) window.siteSettings = { ...defaultSettings };
    if(!siteSettings.cakeBuilder) siteSettings.cakeBuilder = { ...defaultSettings.cakeBuilder };
    
    const c = siteSettings.cakeBuilder;
    if(c) {
        c.basePrice = Number(document.getElementById('set-cake-base-price')?.value) || 145;
        c.minSquare = Number(document.getElementById('set-cake-min-sq')?.value) || 16;
        c.minRect = Number(document.getElementById('set-cake-min-rect')?.value) || 20;
        c.imagePrinting = [ 
            { label: 'بدون', price: 0 }, 
            { label: 'صورة قابلة للأكل', price: Number(document.getElementById('set-print-edible')?.value) || 0 }, 
            { label: 'صورة غير قابلة للأكل', price: 20 } 
        ];
    }
    try {
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings); 
        saveEngineMemory('set'); showSystemToast("تم اعتماد وإرسال إعدادات التورت الملكية 👑", "success");
    } catch(e) { saveEngineMemory('set'); showSystemToast("تم الحفظ محلياً", "info"); }
}

function renderAdminCategories() {
    const listEl = document.getElementById('admin-categories-list');
    if (!listEl) return;
    
    const sortedCats = [...catMenu].sort((a, b) => a.order - b.order);

    if (sortedCats.length === 0) { listEl.innerHTML = `<p class="text-center text-slate-500 py-6 font-bold text-xs">لم يتم هندسة أي قسم للآن.</p>`; return; }
    listEl.innerHTML = sortedCats.map((cat, index) => `
        <div class="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-[1rem] group hover:border-cyan-500/50 transition-all mb-2">
            <div class="flex items-center gap-3"><span class="w-6 h-6 flex items-center justify-center bg-slate-900 rounded-[0.5rem] text-[10px] text-slate-400 font-bold">${cat.order}</span><span class="font-bold text-slate-200 text-sm">${escapeHTML(cat.name)}</span></div>
            <button onclick="removeCategory('${cat.name}')" class="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
    const catSelect = document.getElementById('edit-prod-cat') || document.getElementById('form-product-cat');
    if(catSelect) catSelect.innerHTML = sortedCats.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('');
}

function addNewCategory() {
    const input = document.getElementById('new-category-input'); 
    const orderInput = document.getElementById('new-category-order');
    if(!input) return;
    const val = input.value.trim();
    const order = parseInt(orderInput?.value) || (catMenu.length + 1);

    if (!val) { showSystemToast("قرار إداري: يرجى صياغة اسم القسم للاعتماد", "error"); return; }
    if (catMenu.find(c => c.name === val)) { showSystemToast("هذا المسمى موجود بالفعل بالهيكل", "error"); return; }
    
    catMenu.push({name: val, order: order}); 
    input.value = ''; if(orderInput) orderInput.value = '';
    renderAdminCategories(); 
    if(typeof renderAdminCatalogTabs === 'function') renderAdminCatalogTabs();
    
    executeSafely('CategoryDesc', () => { if(typeof renderCategoryDescAdmin === 'function') renderCategoryDescAdmin(); });
    
    showSystemToast(`تم إدراج القسم بالهيكل. لا تنسى تفعيل الحفظ الشامل.`, "success");
}

function removeCategory(catName) {
    if (catName === 'تورت') { showSystemToast("قرار إداري: قسم التورت الملكية ذو طابع سيادي ولا يُمكن إزالته! 👑", "error"); return; }
    openConfirmModal('استبعاد قسم', `هل توافق على استبعاد قسم "${catName}" نهائياً من الهيكل؟`, () => {
        catMenu = catMenu.filter(c => c.name !== catName);
        renderAdminCategories(); 
        if(typeof renderAdminCatalogTabs === 'function') renderAdminCatalogTabs();
        executeSafely('CategoryDesc', () => { if(typeof renderCategoryDescAdmin === 'function') renderCategoryDescAdmin(); });
    });
}

async function saveCategoriesToCloud() {
    try {
        if(!window.siteSettings) window.siteSettings = {};
        siteSettings.catMenu = catMenu; 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings);
        saveEngineMemory('set'); showSystemToast("تم هندسة الأقسام وحفظها سحابياً بنجاح! ✨", "success");
    } catch (e) { showSystemToast("فشل الاتصال السحابي أثناء اعتماد الأقسام", "error"); }
}

function initAdminPromoCodes() {
    if(!window.siteSettings) window.siteSettings = {};
    if(!siteSettings.promoCodes) siteSettings.promoCodes = [];
    renderPromoCodes();
}

function renderPromoCodes() {
    const container = document.getElementById('promo-codes-list'); if(!container) return;
    const codes = siteSettings.promoCodes || [];
    if(codes.length === 0) { container.innerHTML = `<p class="text-xs text-slate-500 text-center py-2">لا توجد كوبونات تفاعلية مفعلة حالياً</p>`; return; }
    container.innerHTML = codes.map((c, idx) => `
        <div class="flex justify-between items-center bg-orange-500/5 border border-orange-500/20 p-2.5 rounded-[1rem] mb-2">
            <div><span class="font-mono font-black text-orange-400 uppercase">${escapeHTML(c.code)}</span><span class="text-[10px] text-slate-400 ml-2">خصم فني ${c.discount}%</span></div>
            <button onclick="deletePromoCode(${idx})" class="text-red-400 hover:text-white p-1 rounded hover:bg-red-500/20 relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
}

function addPromoCode() {
    const codeInput = document.getElementById('promo-code-input'); const discountInput = document.getElementById('promo-discount-input');
    if(!codeInput || !discountInput) return;
    const code = codeInput.value.trim().toUpperCase(); const discount = parseInt(discountInput.value) || 0;
    if(!code || discount <= 0 || discount > 100) { showSystemToast("قرار إداري: يرجى اعتماد كود سليم ونسبة تتراوح بين 1 و 100", "error"); return; }
    if(!window.siteSettings) window.siteSettings = {};
    if(!siteSettings.promoCodes) siteSettings.promoCodes = [];
    if(siteSettings.promoCodes.find(c => c.code === code)) { showSystemToast("هذا الكود مدرج مسبقاً بالنظام", "error"); return; }
    siteSettings.promoCodes.push({ code, discount });
    codeInput.value = ''; discountInput.value = '';
    renderPromoCodes(); 
    if(typeof saveAllSettings === 'function') saveAllSettings(); 
}

function deletePromoCode(idx) {
    if(!siteSettings.promoCodes) return;
    siteSettings.promoCodes.splice(idx, 1);
    renderPromoCodes(); 
    if(typeof saveAllSettings === 'function') saveAllSettings();
}
