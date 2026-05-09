/**
 * 👑 BoseSweets Admin Settings Engine - V20.0 (Royal Cake & Sovereign Expansion Edition)
 * تم التوسيع ليشمل: الأقسام الديناميكية، المراجعات، الروابط الشمولية، التحكم الحركي، وإدارة التورت الملكية.
 * يلتزم الكود بالهوية البصرية (الوردي الناعم #ff91a4 والأبيض) وقواعد المزامنة اللحظية السيادية.
 */

function ensureAdvancedControlsExist() {
    // حقن حقول التحكم بالسرعات حركياً إذا لم تكن موجودة في هيكل الـ HTML
    const homepageSection = document.getElementById('admin-homepage');
    if (homepageSection && !document.getElementById('set-ticker-speed')) {
        const advDiv = document.createElement('div');
        advDiv.className = 'boosy-card mt-6';
        advDiv.innerHTML = `
            <h4 class="text-xs font-black text-[#ff91a4] mb-6 flex items-center gap-2"><i data-lucide="zap" class="w-4 h-4"></i> التحكم الحركي والسرعات السيادية</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label class="block text-[10px] font-bold text-slate-500 mb-2">سرعة شريط الأخبار (Ticker Speed)</label><input type="number" id="set-ticker-speed" class="admin-input text-sm" placeholder="الافتراضي: 20"></div>
                <div><label class="block text-[10px] font-bold text-slate-500 mb-2">سرعة الشلال (Waterfall Delay - ms)</label><input type="number" id="set-waterfall-speed" class="admin-input text-sm" placeholder="الافتراضي: 3000"></div>
            </div>
        `;
        homepageSection.appendChild(advDiv);
        if(window.lucide) lucide.createIcons();
    }
}

function fillGlobalSettingsFormFields() {
    const phoneInput = document.getElementById('sett-phone-input');
    const addressInput = document.getElementById('sett-address-input');
    const fbInput = document.getElementById('sett-fb-input');
    const igInput = document.getElementById('sett-ig-input');
    const ttInput = document.getElementById('sett-tiktok-input'); 
    const waInput = document.getElementById('sett-whatsapp-input'); 
    const quoteText = document.getElementById('sett-quote-textarea');
    
    if (phoneInput) phoneInput.value = siteSettings.footerPhone || '';
    if (addressInput) addressInput.value = siteSettings.footerAddress || '';
    if (fbInput) fbInput.value = siteSettings.social?.facebook || '';
    if (igInput) igInput.value = siteSettings.social?.instagram || '';
    if (ttInput) ttInput.value = siteSettings.social?.tiktok || '';
    if (waInput) waInput.value = siteSettings.social?.whatsapp || '';
    if (quoteText) quoteText.value = siteSettings.footerQuote || '';

    if (siteSettings.cakeBuilder) {
        if(document.getElementById('set-cake-base-price')) document.getElementById('set-cake-base-price').value = siteSettings.cakeBuilder.basePrice || 145;
        if(document.getElementById('set-cake-min-sq')) document.getElementById('set-cake-min-sq').value = siteSettings.cakeBuilder.minSquare || 16;
        if(document.getElementById('set-cake-min-rect')) document.getElementById('set-cake-min-rect').value = siteSettings.cakeBuilder.minRect || 20;
        
        const printing = siteSettings.cakeBuilder.imagePrinting || [];
        const edible = printing.find(p => p.label === 'صورة قابلة للأكل');
        if(document.getElementById('set-print-edible')) document.getElementById('set-print-edible').value = edible ? edible.price : 60;
    }
}

window.saveGlobalSettingsFromDashboard = async function() {
    const phone = document.getElementById('sett-phone-input')?.value.trim();
    const address = document.getElementById('sett-address-input')?.value.trim();
    const fb = document.getElementById('sett-fb-input')?.value.trim();
    const ig = document.getElementById('sett-ig-input')?.value.trim();
    const tt = document.getElementById('sett-tiktok-input')?.value.trim();
    const wa = document.getElementById('sett-whatsapp-input')?.value.trim();
    const quote = document.getElementById('sett-quote-textarea')?.value.trim();
    
    if(!siteSettings.social) siteSettings.social = {};
    
    const updatedPayload = {
        footerPhone: phone !== undefined ? phone : siteSettings.footerPhone,
        footerAddress: address !== undefined ? address : siteSettings.footerAddress,
        footerQuote: quote !== undefined ? quote : siteSettings.footerQuote,
        social: { 
            facebook: fb !== undefined ? fb : siteSettings.social.facebook, 
            instagram: ig !== undefined ? ig : siteSettings.social.instagram, 
            tiktok: tt !== undefined ? tt : (siteSettings.social?.tiktok || ''),
            whatsapp: wa !== undefined ? wa : (siteSettings.social?.whatsapp || ''),
            customLinks: siteSettings.social.customLinks || []
        }
    };
    
    siteSettings = { ...siteSettings, ...updatedPayload };

    try {
        if (typeof NetworkEngine !== 'undefined') {
            await NetworkEngine.safeWrite('settings', 'main', siteSettings);
            if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
            showSystemToast('تم تحديث قنوات التواصل والتكوينات السيادية بنجاح 👑☁️', 'success');
        } else if (typeof db !== 'undefined') {
            await db.collection('settings').doc('main').set(siteSettings, { merge: true });
            if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
            showSystemToast('تم التزامن المباشر مع السحابة بنجاح 👑', 'success');
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
    
    if(isNaN(percent) || percent <= 0) { showSystemToast("قرار إداري: يرجى إدخل نسبة صحيحة أكبر من 0", "error"); return; }
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
        if (typeof saveEngineMemory === 'function') saveEngineMemory('cat');
        syncCatalogMap();
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
            if (Array.isArray(data)) { window.catalog = data; if (typeof saveEngineMemory === 'function') saveEngineMemory('cat'); } 
            else {
                if(data.settings) { window.siteSettings = data.settings; if (typeof saveEngineMemory === 'function') saveEngineMemory('set'); }
                if(data.shipping) { window.shippingZones = data.shipping; if (typeof saveEngineMemory === 'function') saveEngineMemory('ship'); }
                if(data.catalog) { window.catalog = data.catalog; if (typeof saveEngineMemory === 'function') saveEngineMemory('cat'); }
                if(data.orders) { window.globalOrders = data.orders; if (typeof saveEngineMemory === 'function') saveEngineMemory('ord'); }
                if(data.gallery) { window.galleryData = data.gallery; if (typeof saveEngineMemory === 'function') saveEngineMemory('gal'); }
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
    ensureAdvancedControlsExist();
    
    if(!window.siteSettings) return;
    if(document.getElementById('set-brand')) document.getElementById('set-brand').value = siteSettings.brandName || 'حلويات بوسي';
    if(document.getElementById('set-hero-title')) document.getElementById('set-hero-title').value = siteSettings.heroTitle || '';
    if(document.getElementById('set-hero-desc')) document.getElementById('set-hero-desc').value = siteSettings.heroDesc || '';
    if(document.getElementById('set-footer-phone')) document.getElementById('set-footer-phone').value = siteSettings.footerPhone || '';
    if(document.getElementById('set-footer-address')) document.getElementById('set-footer-address').value = (siteSettings.footerAddress || '').replace(/<br>/g, '');
    if(document.getElementById('set-ticker-active')) document.getElementById('set-ticker-active').checked = siteSettings.tickerActive !== false;
    if(document.getElementById('set-ticker-text')) document.getElementById('set-ticker-text').value = siteSettings.tickerText || siteSettings.announcement || '';
    if(document.getElementById('set-ticker-speed')) document.getElementById('set-ticker-speed').value = siteSettings.tickerSpeed || 20;
    if(document.getElementById('set-waterfall-speed')) document.getElementById('set-waterfall-speed').value = siteSettings.layout_settings?.layout_waterfall_speed || 3000;

    if(siteSettings.seo) {
        if(document.getElementById('set-seo-title')) document.getElementById('set-seo-title').value = siteSettings.seo.title || '';
        if(document.getElementById('set-seo-desc')) document.getElementById('set-seo-desc').value = siteSettings.seo.desc || '';
        if(document.getElementById('set-seo-keywords')) document.getElementById('set-seo-keywords').value = siteSettings.seo.keywords || '';
    }

    if(siteSettings.social) {
        if(document.getElementById('set-social-fb')) document.getElementById('set-social-fb').value = siteSettings.social.facebook || '';
        if(document.getElementById('set-social-ig')) document.getElementById('set-social-ig').value = siteSettings.social.instagram || '';
        if(document.getElementById('set-social-tt')) document.getElementById('set-social-tt').value = siteSettings.social.tiktok || '';
        if(document.getElementById('set-social-wa')) document.getElementById('set-social-wa').value = siteSettings.social.whatsapp || '';
    }

    const v = siteSettings.visuals || defaultSettings.visuals;
    if(document.getElementById('set-visual-color-hex')) {
        document.getElementById('set-visual-color-hex').value = v.themeHex || '#ff91a4';
    }
    
    executeSafely('CategoryDesc', () => { if(typeof renderCategoryDescAdmin === 'function') renderCategoryDescAdmin(); });

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

    if(siteSettings.UI_Settings) {
        if(document.getElementById('set-loader-text')) document.getElementById('set-loader-text').value = siteSettings.UI_Settings.loader_text || '';
        if(document.getElementById('set-loader-bg-color')) document.getElementById('set-loader-bg-color').value = siteSettings.UI_Settings.loader_bgColor || '#ffffff';
        if(document.getElementById('set-loader-text-color')) document.getElementById('set-loader-text-color').value = siteSettings.UI_Settings.loader_textColor || '#ff91a4';
        
        if(siteSettings.UI_Settings.typography_config) {
            if(document.getElementById('set-global-text-color')) document.getElementById('set-global-text-color').value = siteSettings.UI_Settings.typography_config.global_text_color || '#1a1a1a';
            if(document.getElementById('set-font-family')) document.getElementById('set-font-family').value = siteSettings.UI_Settings.typography_config.main_font_family || "'Cairo', sans-serif";
            if(document.getElementById('set-font-size-base')) document.getElementById('set-font-size-base').value = siteSettings.UI_Settings.typography_config.global_font_size_base || '16px';
            if(document.getElementById('set-font-weight-bold')) document.getElementById('set-font-weight-bold').value = siteSettings.UI_Settings.typography_config.global_font_weight_bold || '900';
        }
        if(siteSettings.UI_Settings.page_dimensions) {
            if(document.getElementById('set-page-max-height')) document.getElementById('set-page-max-height').value = siteSettings.UI_Settings.page_dimensions.productPageMaxHeight || 'auto';
            if(document.getElementById('set-page-min-height')) document.getElementById('set-page-min-height').value = siteSettings.UI_Settings.page_dimensions.productPageMinHeight || '100vh';
        }
    }

    if(siteSettings.Structure_Settings) {
        if(document.getElementById('set-you-may-like')) document.getElementById('set-you-may-like').checked = siteSettings.Structure_Settings.section_youMayAlsoLike_isActive !== false;
    }

    // تفعيل رندر الأقسام الديناميكية، المراجعات، والروابط
    if(typeof renderDynamicSectionsList === 'function') renderDynamicSectionsList();
    if(typeof renderCustomSocialLinks === 'function') renderCustomSocialLinks();
    if(typeof renderReviewsList === 'function') renderReviewsList();
}

window.saveAllSettings = async function() {
    if(!window.siteSettings) window.siteSettings = {};
    
    const viewModeChecked = document.querySelector('input[name="layout_viewMode"]:checked');
    
    const layout_settings_payload = {
        layout_viewMode: viewModeChecked ? viewModeChecked.value : "columns_2",
        layout_card_width: document.getElementById('set-layout-card-width')?.value || "100%",
        layout_card_height: document.getElementById('set-layout-card-height')?.value || "auto",
        layout_waterfall_img_width: document.getElementById('set-layout-wf-width')?.value || "100%",
        layout_waterfall_img_height: document.getElementById('set-layout-wf-height')?.value || "270px",
        layout_waterfall_speed: parseInt(document.getElementById('set-waterfall-speed')?.value) || 3000,
        layout_waterfall_img_objectFit: "cover"
    };

    const UI_Settings_payload = {
        loader_bgColor: document.getElementById('set-loader-bg-color')?.value || "#ffffff",
        loader_textColor: document.getElementById('set-loader-text-color')?.value || "#ff91a4",
        loader_text: document.getElementById('set-loader-text')?.value || "جاري تجهيز منصة حلويات بوسي لحضرتك...",
        typography_config: {
            main_font_family: document.getElementById('set-font-family')?.value || "'Cairo', sans-serif",
            global_font_size_base: document.getElementById('set-font-size-base')?.value || "16px",
            global_font_weight_bold: document.getElementById('set-font-weight-bold')?.value || "900",
            global_text_color: document.getElementById('set-global-text-color')?.value || "#1a1a1a"
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

    if(!siteSettings.catDescriptions) siteSettings.catDescriptions = {};
    if(typeof catMenu !== 'undefined' && Array.isArray(catMenu)) {
        catMenu.forEach(cat => {
            const safeId = 'desc-cat-' + Array.from(cat.name).map(c => c.charCodeAt(0)).join('');
            const descInput = document.getElementById(safeId);
            if(descInput) siteSettings.catDescriptions[cat.name] = descInput.value.trim();
        });
    }

    const finalMasterPayload = {
        ...window.siteSettings,
        brandName: document.getElementById('set-brand')?.value || "حلويات بوسي",
        heroTitle: document.getElementById('set-hero-title')?.value || "",
        heroDesc: document.getElementById('set-hero-desc')?.value || "",
        footerPhone: document.getElementById('set-footer-phone')?.value || "",
        footerAddress: document.getElementById('set-footer-address')?.value || "",
        tickerActive: document.getElementById('set-ticker-active')?.checked !== false,
        tickerText: document.getElementById('set-ticker-text')?.value || "",
        tickerSpeed: parseInt(document.getElementById('set-ticker-speed')?.value) || 20,
        announcement: document.getElementById('set-ticker-text')?.value || "",
        
        seo: {
            title: document.getElementById('set-seo-title')?.value || window.siteSettings.seo?.title || '',
            desc: document.getElementById('set-seo-desc')?.value || window.siteSettings.seo?.desc || '',
            keywords: document.getElementById('set-seo-keywords')?.value || window.siteSettings.seo?.keywords || ''
        },
        social: {
            facebook: document.getElementById('set-social-fb')?.value || window.siteSettings.social?.facebook || '',
            instagram: document.getElementById('set-social-ig')?.value || window.siteSettings.social?.instagram || '',
            tiktok: document.getElementById('set-social-tt')?.value || window.siteSettings.social?.tiktok || '',
            whatsapp: document.getElementById('set-social-wa')?.value || window.siteSettings.social?.whatsapp || '',
            customLinks: window.siteSettings.social?.customLinks || []
        },
        visuals: {
            themeHex: document.getElementById('sys-brand-color')?.value || document.getElementById('set-visual-color-hex')?.value || window.siteSettings.visuals?.themeHex || '#ff91a4'
        },
        
        dynamicSections: siteSettings.dynamicSections || [],
        customerReviews: siteSettings.customerReviews || [],
        layout_settings: layout_settings_payload,
        UI_Settings: UI_Settings_payload,
        Structure_Settings: Structure_Settings_payload
    };

    window.siteSettings = finalMasterPayload;

    try {
        if(typeof NetworkEngine !== 'undefined') {
            await NetworkEngine.safeWrite('settings', 'main', finalMasterPayload);
            if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
            showSystemToast("تم الاعتماد البرمجي وتحديث كامل قيم التكوين سحابياً بنجاح 👑☁️", "success");
        } else if(typeof db !== 'undefined') {
            await db.collection('settings').doc('main').set(finalMasterPayload, { merge: true });
            if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
            showSystemToast("تم الاعتماد البرمجي وتحديث كامل قيم التكوين سحابياً بنجاح 👑☁️", "success");
        }
    } catch(e) {
        if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
        showSystemToast(`عطل في المزامنة السحابية: ${e.message}`, "error");
    }
};

window.triggerMasterSave = window.saveAllSettings;
window.saveStoreSettings = window.saveAllSettings;

// --- 👑 منظومة الأقسام الديناميكية للمناسبات ---
window.renderDynamicSectionsList = function() {
    const container = document.getElementById('dynamic-sections-list');
    if(!container) return;
    if(!siteSettings.dynamicSections) siteSettings.dynamicSections = [];
    
    siteSettings.dynamicSections.sort((a,b) => (a.order || 0) - (b.order || 0));
    
    if(siteSettings.dynamicSections.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 font-bold text-center py-4">لا توجد أقسام مخصصة للمناسبات حالياً.</p>`;
        return;
    }
    
    container.innerHTML = siteSettings.dynamicSections.map((sec, idx) => `
        <div class="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-2xl group ${!sec.active ? 'opacity-50 grayscale' : ''}">
            <div class="flex items-center gap-3 w-2/3 truncate">
                <span class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-black text-[10px] shrink-0 shadow-inner">${idx + 1}</span>
                <div class="flex flex-col truncate">
                    <span class="text-xs font-black text-white truncate">${escapeHTML(sec.title)}</span>
                    <span class="text-[9px] font-bold text-[#ff91a4] uppercase mt-0.5">${sec.type === 'grid' ? 'شبكة عادية' : (sec.type === 'waterfall' ? 'شلال عرض' : 'شريط تمرير')}</span>
                </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button type="button" onclick="toggleSectionVisibility('${sec.id}')" class="p-1.5 rounded-lg border ${sec.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'} relative z-50 pointer-events-auto"><i data-lucide="${sec.active ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i></button>
                <button type="button" onclick="deleteDynamicSection('${sec.id}')" class="p-1.5 rounded-lg border bg-slate-800 text-red-400 border-slate-700 hover:bg-red-500/20 relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
};

window.openAddSectionModal = function() {
    const title = prompt("قرار إداري: يرجى إدخال اسم القسم الجديد (مثال: عروض العيد):");
    if(!title) return;
    const typeChoice = prompt("اختر طريقة العرض:\n1. شبكة (Grid)\n2. شريط تمرير (Slider)\n3. شلال (Waterfall)\n\nأدخل الرقم (1, 2, 3):", "1");
    
    let type = 'grid';
    if(typeChoice === '2') type = 'slider';
    if(typeChoice === '3') type = 'waterfall';
    
    if(!siteSettings.dynamicSections) siteSettings.dynamicSections = [];
    siteSettings.dynamicSections.push({
        id: 'sec_' + Date.now(),
        title: title.trim(),
        type: type,
        active: true,
        order: siteSettings.dynamicSections.length + 1
    });
    
    renderDynamicSectionsList();
    showSystemToast("تم إدراج القسم بالهيكل بنجاح 👑", "success");
};

window.toggleSectionVisibility = function(id) {
    const sec = siteSettings.dynamicSections.find(s => s.id === id);
    if(sec) { sec.active = !sec.active; renderDynamicSectionsList(); }
};

window.deleteDynamicSection = function(id) {
    if(!confirm("هل توافقين على الحذف السيادي لهذا القسم من الواجهة؟")) return;
    siteSettings.dynamicSections = siteSettings.dynamicSections.filter(s => s.id !== id);
    renderDynamicSectionsList();
};

// --- 👑 منظومة الروابط والمنصات المخصصة ---
window.renderCustomSocialLinks = function() {
    const btnContainer = document.getElementById('new-link-url')?.parentElement;
    let listContainer = document.getElementById('custom-social-list');
    
    if(!listContainer && btnContainer) {
        listContainer = document.createElement('div');
        listContainer.id = 'custom-social-list';
        listContainer.className = 'mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar';
        btnContainer.parentElement.appendChild(listContainer);
    }
    if(!listContainer) return;
    
    if(!siteSettings.social) siteSettings.social = {};
    if(!siteSettings.social.customLinks) siteSettings.social.customLinks = [];
    
    if (siteSettings.social.customLinks.length === 0) {
        listContainer.innerHTML = '';
        return;
    }

    listContainer.innerHTML = siteSettings.social.customLinks.map((link, idx) => `
        <div class="flex items-center justify-between p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl group">
            <div class="truncate pl-2">
                <p class="text-[10px] font-black text-white">${escapeHTML(link.label)}</p>
                <p class="text-[9px] text-[#ff91a4] font-mono truncate max-w-[200px] mt-0.5">${escapeHTML(link.url)}</p>
            </div>
            <button type="button" onclick="removeCustomSocialLink(${idx})" class="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors pointer-events-auto relative z-50"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
};

window.addNewSocialLink = function() {
    const labelEl = document.getElementById('new-link-label');
    const urlEl = document.getElementById('new-link-url');
    const label = labelEl?.value.trim();
    const url = urlEl?.value.trim();
    if(!label || !url) { showSystemToast("قرار إداري: يجب إدخال اسم المنصة والرابط أولاً", "error"); return; }
    
    if(!siteSettings.social) siteSettings.social = {};
    if(!siteSettings.social.customLinks) siteSettings.social.customLinks = [];
    
    siteSettings.social.customLinks.push({ label, url });
    if(labelEl) labelEl.value = '';
    if(urlEl) urlEl.value = '';
    renderCustomSocialLinks();
    showSystemToast("تم اعتماد المنصة الإضافية 👑", "success");
};

window.removeCustomSocialLink = function(idx) {
    if(!confirm("حذف هذه المنصة من الروابط؟")) return;
    siteSettings.social.customLinks.splice(idx, 1);
    renderCustomSocialLinks();
};

// --- 👑 سجل مراجعات وتجارب العملاء ---
window.renderReviewsList = function() {
    const container = document.getElementById('admin-reviews-list');
    if(!container) return;
    if(!siteSettings.customerReviews) siteSettings.customerReviews = [];
    
    if(siteSettings.customerReviews.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-8 text-slate-500 text-xs font-bold border border-dashed border-slate-700 rounded-3xl">سجل المراجعات فارغ حالياً.</div>`;
        return;
    }
    
    container.innerHTML = siteSettings.customerReviews.map((rev, idx) => `
        <div class="bg-slate-900 p-4 rounded-3xl border border-slate-800 relative group transition-all duration-300 hover:border-[#ff91a4]/50 ${!rev.active ? 'opacity-40 grayscale' : ''}">
            <div class="flex justify-between items-start mb-3 pr-8">
                <div>
                    <h5 class="text-xs font-black text-white">${escapeHTML(rev.name)}</h5>
                    <p class="text-[8px] text-slate-500 font-bold mt-0.5">${escapeHTML(rev.date || '')}</p>
                </div>
                <div class="flex text-amber-400 gap-0.5">
                    ${Array(rev.rating || 5).fill('<i data-lucide="star" class="w-3 h-3 fill-current"></i>').join('')}
                </div>
            </div>
            <p class="text-[10px] text-slate-300 font-bold leading-relaxed line-clamp-3">${escapeHTML(rev.text)}</p>
            
            <div class="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onclick="toggleReviewStatus('${rev.id}')" class="p-1.5 bg-slate-800 text-[#ff91a4] rounded-lg shadow-lg hover:scale-110 transition-transform pointer-events-auto relative z-50"><i data-lucide="${rev.active ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5"></i></button>
                <button type="button" onclick="deleteReview('${rev.id}')" class="p-1.5 bg-red-500/20 text-red-400 rounded-lg shadow-lg hover:scale-110 transition-transform hover:bg-red-500 hover:text-white pointer-events-auto relative z-50"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
};

window.openAddReviewModal = function() {
    const name = prompt("قرار إداري: يرجى كتابة اسم العميل:");
    if(!name) return;
    const text = prompt("الرجاء كتابة نص التقييم وتجربة العميل:");
    if(!text) return;
    const rating = prompt("تقييم العميل من 1 إلى 5 نجوم:", "5");
    
    if(!siteSettings.customerReviews) siteSettings.customerReviews = [];
    siteSettings.customerReviews.unshift({
        id: 'rev_' + Date.now(),
        name: name.trim(),
        text: text.trim(),
        rating: parseInt(rating) || 5,
        active: true,
        date: new Date().toLocaleDateString('ar-EG')
    });
    
    renderReviewsList();
    showSystemToast("تم إدراج تقييم العميل واعتماده 👑", "success");
};

window.toggleReviewStatus = function(id) {
    const rev = siteSettings.customerReviews.find(r => r.id === id);
    if(rev) { rev.active = !rev.active; renderReviewsList(); }
};

window.deleteReview = function(id) {
    if(!confirm("هل تودين حذف هذا التقييم نهائياً من سجل العملاء؟")) return;
    siteSettings.customerReviews = siteSettings.customerReviews.filter(r => r.id !== id);
    renderReviewsList();
};


window.renderCategoryDescAdmin = function() {
    let container = document.getElementById('dynamic-category-desc-container');
    if (!container) return;
    
    container.innerHTML = '<label class="block text-xs font-bold text-slate-300 mb-2">صياغة أوصاف الأقسام بأسلوب بوسي التفاعلي</label>';
    const descriptions = siteSettings.catDescriptions || {};
    
    catMenu.forEach(cat => {
        const safeId = 'desc-cat-' + Array.from(cat.name).map(c => c.charCodeAt(0)).join('');
        const currentVal = descriptions[cat.name] || '';
        
        const fieldHtml = `
            <div class="relative mb-3">
                <span class="absolute right-4 top-4 text-[10px] font-bold text-[#ff91a4] bg-[#ff91a4]/10 px-2 py-0.5 rounded">${escapeHTML(cat.name)}</span>
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
        container.className = 'app-card p-4 flex flex-col rounded-[2.5rem] mt-4 border border-[#ff91a4]/20';
        overviewTab.appendChild(container);
    }
    
    if (!catalog || catalog.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-500 text-center font-bold">لا توجد منتجات مسجلة لاختيارها للواجهة الرئيسية.</p>';
        return;
    }
    
    let html = '<h3 class="text-sm font-black text-[#ff91a4] flex items-center gap-2 mb-4"><i data-lucide="layout-template" class="w-4 h-4"></i> هندسة واجهة العميل (الترشيحات)</h3>';
    html += '<div class="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">';
    
    catalog.forEach(prod => {
        const isNew = prod.badge === 'جديد 🌟' || prod.badge === 'جديد';
        const isBest = prod.badge === 'الأكثر مبيعاً 🔥' || prod.badge === 'مبيعاً';
        const isOutOfStock = prod.inStock === false;
        
        html += `
            <div class="flex items-center justify-between bg-[#0a0f1c] p-3 rounded-2xl border border-slate-800 hover:border-[#ff91a4]/30 transition-colors">
                <div class="flex items-center gap-3 w-1/2 truncate">
                    <img src="${prod.img || 'https://via.placeholder.com/50'}" class="w-8 h-8 rounded-lg object-cover shrink-0 ${isOutOfStock ? 'grayscale opacity-50' : ''}">
                    <span class="text-xs font-bold text-white truncate ${isOutOfStock ? 'line-through text-slate-500' : ''}">${escapeHTML(prod.name)}</span>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button onclick="toggleProductBadge('${prod.id}', 'جديد 🌟')" class="px-2 py-1 text-[9px] font-bold rounded-lg border ${isNew ? 'bg-[#ff91a4]/20 text-[#ff91a4] border-[#ff91a4]/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}">حديثاً</button>
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
        if (typeof saveEngineMemory === 'function') saveEngineMemory('cat');
        showSystemToast("تم تحديث تمييز المنتج للواجهة بنجاح", "success");
    } catch(e) {
        if (typeof saveEngineMemory === 'function') saveEngineMemory('cat');
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
        if (typeof saveEngineMemory === 'function') saveEngineMemory('ship');
        showSystemToast("تم إضافة منطقة التوصيل بنجاح", "success");
    } catch (e) { 
        if (typeof saveEngineMemory === 'function') saveEngineMemory('ship');
        showSystemToast("تم الإضافة محلياً", "info"); 
    }
    closeShipModal(); renderAdminShipping();
}

function deleteShippingZoneConfirm(id, name) {
    openConfirmModal('حذف منطقة توصيل', `هل أنت متأكد من حذف منطقة "${name}" من نطاق التغطية؟`, () => { executeDeleteShippingZone(id); });
}

async function executeDeleteShippingZone(id) {
    shippingZones = shippingZones.filter(z => String(z.id) !== String(id));
    try { 
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('shipping', String(id), null);
        if (typeof saveEngineMemory === 'function') saveEngineMemory('ship');
        showSystemToast("تم الحذف بنجاح", "success");
    } catch(e) { 
        if (typeof saveEngineMemory === 'function') saveEngineMemory('ship'); 
    }
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
            { label: 'صورة قابلة للأكل', price: Number(document.getElementById('set-print-edible')?.value) || 60 }, 
            { label: 'صورة غير قابلة للأكل', price: 20 } 
        ];
    }
    try {
        if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('settings', 'main', siteSettings);
        if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
        showSystemToast("تم اعتماد وإرسال إعدادات التورت الملكية 👑", "success");
    } catch(e) { 
        if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
        showSystemToast("تم الحفظ محلياً", "info"); 
    }
}

function renderAdminCategories() {
    const listEl = document.getElementById('admin-categories-list');
    if (!listEl) return;
    
    const sortedCats = [...catMenu].sort((a, b) => a.order - b.order);

    if (sortedCats.length === 0) { listEl.innerHTML = `<p class="text-center text-slate-500 py-6 font-bold text-xs">لم يتم هندسة أي قسم للآن.</p>`; return; }
    listEl.innerHTML = sortedCats.map((cat, index) => `
        <div class="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-[1rem] group hover:border-[#ff91a4]/50 transition-all mb-2">
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
        if (typeof saveEngineMemory === 'function') saveEngineMemory('set');
        showSystemToast("تم هندسة الأقسام وحفظها سحابياً بنجاح! ✨", "success");
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
        <div class="flex justify-between items-center bg-[#ff91a4]/5 border border-[#ff91a4]/20 p-2.5 rounded-[1rem] mb-2">
            <div><span class="font-mono font-black text-[#ff91a4] uppercase">${escapeHTML(c.code)}</span><span class="text-[10px] text-slate-400 ml-2">خصم فني ${c.discount}%</span></div>
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
