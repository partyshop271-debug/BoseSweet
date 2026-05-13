/**
 * ============================================================================
 * 👑 BoseSweets Admin Settings Engine - V20.0 (Royal Sovereign Edition)
 * ============================================================================
 * محرك الإعدادات السيادية - حلويات بوسي
 * تم التطوير والدمج الشامل لضمان السيطرة الكاملة على الهوية، سرعة الحركة، 
 * النشاط السحابي، والمزامنة اللحظية مع جميع أجزاء النظام.
 * 🛡️ التحديث الأمني الجديد: تم زراعة مستشعر BoseMonitor لمراقبة كافة التغييرات والعمليات.
 */

window.ensureAdvancedControlsExist = function() {
    try {
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
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'ensureAdvancedControlsExist');
    }
};

window.fillGlobalSettingsFormFields = function() {
    try {
        const phoneInput = document.getElementById('sett-phone-input');
        const addressInput = document.getElementById('sett-address-input');
        const fbInput = document.getElementById('sett-fb-input');
        const igInput = document.getElementById('sett-ig-input');
        const ttInput = document.getElementById('sett-tiktok-input'); 
        const waInput = document.getElementById('sett-whatsapp-input'); 
        const quoteText = document.getElementById('sett-quote-textarea');
        
        if (phoneInput) phoneInput.value = window.siteSettings.footerPhone || '';
        if (addressInput) addressInput.value = window.siteSettings.footerAddress || '';
        if (fbInput) fbInput.value = window.siteSettings.social?.facebook || '';
        if (igInput) igInput.value = window.siteSettings.social?.instagram || '';
        if (ttInput) ttInput.value = window.siteSettings.social?.tiktok || '';
        if (waInput) waInput.value = window.siteSettings.social?.whatsapp || '';
        if (quoteText) quoteText.value = window.siteSettings.footerQuote || '';

        if (window.siteSettings.cakeBuilder) {
            if(document.getElementById('set-cake-base-price')) document.getElementById('set-cake-base-price').value = window.siteSettings.cakeBuilder.basePrice || 145;
            if(document.getElementById('set-cake-min-sq')) document.getElementById('set-cake-min-sq').value = window.siteSettings.cakeBuilder.minSquare || 16;
            if(document.getElementById('set-cake-min-rect')) document.getElementById('set-cake-min-rect').value = window.siteSettings.cakeBuilder.minRect || 20;
            
            const printing = window.siteSettings.cakeBuilder.imagePrinting || [];
            const edible = printing.find(p => p.label === 'صورة قابلة للأكل');
            if(document.getElementById('set-print-edible')) document.getElementById('set-print-edible').value = edible ? edible.price : 60;
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'fillGlobalSettingsFormFields');
    }
};

window.saveGlobalSettingsFromDashboard = async function() {
    try {
        const phone = document.getElementById('sett-phone-input')?.value.trim();
        const address = document.getElementById('sett-address-input')?.value.trim();
        const fb = document.getElementById('sett-fb-input')?.value.trim();
        const ig = document.getElementById('sett-ig-input')?.value.trim();
        const tt = document.getElementById('sett-tiktok-input')?.value.trim();
        const wa = document.getElementById('sett-whatsapp-input')?.value.trim();
        const quote = document.getElementById('sett-quote-textarea')?.value.trim();
        
        if(!window.siteSettings.social) window.siteSettings.social = {};
        
        const updatedPayload = {
            footerPhone: phone !== undefined ? phone : window.siteSettings.footerPhone,
            footerAddress: address !== undefined ? address : window.siteSettings.footerAddress,
            footerQuote: quote !== undefined ? quote : window.siteSettings.footerQuote,
            social: { 
                facebook: fb !== undefined ? fb : window.siteSettings.social.facebook, 
                instagram: ig !== undefined ? ig : window.siteSettings.social.instagram, 
                tiktok: tt !== undefined ? tt : (window.siteSettings.social?.tiktok || ''),
                whatsapp: wa !== undefined ? wa : (window.siteSettings.social?.whatsapp || ''),
                customLinks: window.siteSettings.social.customLinks || []
            }
        };
        
        window.siteSettings = { ...window.siteSettings, ...updatedPayload };

        try {
            if (typeof window.NetworkEngine !== 'undefined') {
                await window.NetworkEngine.safeWrite('settings', 'main', window.siteSettings);
                if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('set');
                if(typeof window.showSystemToast === 'function') window.showSystemToast('تم تحديث قنوات التواصل والتكوينات السيادية لـ حلويات بوسي بنجاح 👑☁️', 'success');
            } else if (typeof window.db !== 'undefined') {
                await window.db.collection('settings').doc('main').set(window.siteSettings, { merge: true });
                if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('set');
                if(typeof window.showSystemToast === 'function') window.showSystemToast('تم التزامن المباشر مع السحابة بنجاح 👑', 'success');
            }
            if(typeof window.triggerSovereignSync === 'function') window.triggerSovereignSync();
        } catch (e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-settings.js', null, null, 'saveGlobalSettingsFromDashboard (Cloud Sync)');
            if(typeof window.showSystemToast === 'function') window.showSystemToast(`عطل فني في المزامنة السحابية: ${e.message}`, 'error');
        }
        
        if(typeof window.fillAdminSettingsForm === 'function') window.fillAdminSettingsForm();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'saveGlobalSettingsFromDashboard (Master)');
    }
};

window.applyGlobalPriceChange = async function() {
    try {
        const percentStr = document.getElementById('global-price-percent')?.value;
        const percent = parseFloat(percentStr);
        const action = document.getElementById('global-price-action')?.value;
        
        if(isNaN(percent) || percent <= 0) { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("قرار إداري: يرجى إدخال نسبة صحيحة أكبر من 0", "error"); 
            return; 
        }
        const msg = action === 'increase' ? `هل توافق حضرتك على اعتماد رفع جميع أسعار المنتجات بنسبة ${percent}%؟` : `هل توافق حضرتك على تطبيق قرار الخصم الشامل بنسبة ${percent}%؟`;
        
        if(typeof window.openConfirmModal === 'function') {
            window.openConfirmModal('تأكيد التعديل الجماعي للأسعار', msg, async () => {
                try {
                    const multiplier = action === 'increase' ? (1 + (percent / 100)) : (1 - (percent / 100));
                    let updatedCount = 0;
                    
                    for (let p of window.catalog) {
                        if (p.price && !isNaN(p.price)) {
                            if (action === 'decrease') p.oldPrice = p.price; 
                            else p.oldPrice = null; 
                            
                            p.price = Math.round(p.price * multiplier);
                            updatedCount++;
                            try { if (typeof window.NetworkEngine !== 'undefined') await window.NetworkEngine.safeWrite('catalog', String(p.id), p); } 
                            catch (e) { if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-settings.js', null, null, `applyGlobalPriceChange (Item Sync: ${p.id})`); }
                        }
                    }
                    if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('cat');
                    if (typeof window.syncCatalogMap === 'function') window.syncCatalogMap();
                    
                    const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
                    if(typeof window.renderAdminMenu === 'function') window.renderAdminMenu(currentSearch); 
                    if(typeof window.renderAdminOverview === 'function') window.renderAdminOverview();
                    if(typeof window.renderAdminCatalogGridUI === 'function') window.renderAdminCatalogGridUI(); 
                    
                    if(typeof window.showSystemToast === 'function') window.showSystemToast(`تم تطبيق النسبة المهنية بنجاح على ${updatedCount} منتج 👑`, "success");
                    if(typeof window.triggerSovereignSync === 'function') window.triggerSovereignSync();
                } catch (innerError) {
                    if(window.BoseMonitor) window.BoseMonitor.report(innerError, 'admin-settings.js', null, null, 'applyGlobalPriceChange (Execution)');
                }
            });
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'applyGlobalPriceChange (Master)');
    }
};

window.exportBackupJSON = function() {
    try {
        const backupData = { catalog: window.catalog, settings: window.siteSettings, shipping: window.shippingZones, orders: window.globalOrders, gallery: window.galleryData };
        const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `BoseSweets_CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); 
        a.click(); 
        a.remove(); 
        setTimeout(() => URL.revokeObjectURL(url), 100);
        if(typeof window.showSystemToast === 'function') window.showSystemToast("تم سحب نسخة سحابية شاملة لـ حلويات بوسي بنجاح ☁️", "success");
    } catch (e) { 
        if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-settings.js', null, null, 'exportBackupJSON');
        if(typeof window.showSystemToast === 'function') window.showSystemToast("حدث خطأ تقني أثناء إعداد ملف النسخة", "error"); 
    }
};

window.importBackupJSON = function(e) {
    try {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (Array.isArray(data)) { 
                    window.catalog = data; 
                    if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('cat'); 
                } else {
                    if(data.settings) { window.siteSettings = data.settings; if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('set'); }
                    if(data.shipping) { window.shippingZones = data.shipping; if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('ship'); }
                    if(data.catalog) { window.catalog = data.catalog; if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('cat'); }
                    if(data.orders) { window.globalOrders = data.orders; if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('ord'); }
                    if(data.gallery) { window.galleryData = data.gallery; if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('gal'); }
                }
                try {
                    if (typeof window.NetworkEngine !== 'undefined') {
                        if (Array.isArray(data)) { 
                            for (let p of data) await window.NetworkEngine.safeWrite('catalog', String(p.id), p); 
                        } else {
                            if(data.settings) await window.NetworkEngine.safeWrite('settings', 'main', data.settings); 
                            if(data.shipping) for (let z of data.shipping) await window.NetworkEngine.safeWrite('shipping', String(z.id), z); 
                            if(data.catalog) for (let p of data.catalog) await window.NetworkEngine.safeWrite('catalog', String(p.id), p); 
                            if(data.orders) for (let o of data.orders) await window.NetworkEngine.safeWrite('orders', String(o.id), o); 
                        }
                    }
                } catch(cloudErr) {
                    if(window.BoseMonitor) window.BoseMonitor.report(cloudErr, 'admin-settings.js', null, null, 'importBackupJSON (Cloud Sync)');
                    console.warn("Cloud sync delayed during import:", cloudErr);
                }
                if(typeof window.showSystemToast === 'function') window.showSystemToast("تم استرجاع بيانات حلويات بوسي بنجاح! جاري إعادة تهيئة النظام... 🚀", "success");
                setTimeout(() => location.reload(), 2000);
            } catch(err) { 
                if(window.BoseMonitor) window.BoseMonitor.report(err, 'admin-settings.js', null, null, 'importBackupJSON (Parse Error)');
                if(typeof window.showSystemToast === 'function') window.showSystemToast("قرار فني: ملف الوثيقة غير صالح للاستيراد!", "error"); 
            }
        };
        reader.readAsText(file);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'importBackupJSON (Master)');
    }
};

window.fillAdminSettingsForm = function() {
    try {
        window.ensureAdvancedControlsExist();
        
        if(!window.siteSettings) return;
        
        // البيانات الأساسية
        if(document.getElementById('set-brand')) document.getElementById('set-brand').value = window.siteSettings.brandName || 'حلويات بوسي';
        if(document.getElementById('set-hero-title')) document.getElementById('set-hero-title').value = window.siteSettings.heroTitle || '';
        if(document.getElementById('set-hero-desc')) document.getElementById('set-hero-desc').value = window.siteSettings.heroDesc || '';
        if(document.getElementById('set-footer-phone')) document.getElementById('set-footer-phone').value = window.siteSettings.footerPhone || '';
        if(document.getElementById('set-footer-address')) document.getElementById('set-footer-address').value = (window.siteSettings.footerAddress || '').replace(/<br>/g, '');
        
        // شريط الأخبار والصيانة
        if(document.getElementById('set-ticker-active')) document.getElementById('set-ticker-active').checked = window.siteSettings.tickerActive !== false;
        if(document.getElementById('set-ticker-text')) document.getElementById('set-ticker-text').value = window.siteSettings.tickerText || window.siteSettings.announcement || '';
        if(document.getElementById('set-ticker-speed')) document.getElementById('set-ticker-speed').value = window.siteSettings.tickerSpeed || 20;
        if(document.getElementById('set-waterfall-speed')) document.getElementById('set-waterfall-speed').value = window.siteSettings.layout_settings?.layout_waterfall_speed || 3000;
        if(document.getElementById('set-maintenance')) document.getElementById('set-maintenance').checked = window.siteSettings.maintenanceMode === true;
        if(document.getElementById('set-whatsapp')) document.getElementById('set-whatsapp').value = window.siteSettings.whatsappNumber || window.siteSettings.social?.whatsapp || '';

        // السيو
        if(window.siteSettings.seo) {
            if(document.getElementById('set-seo-title')) document.getElementById('set-seo-title').value = window.siteSettings.seo.title || '';
            if(document.getElementById('set-seo-desc')) document.getElementById('set-seo-desc').value = window.siteSettings.seo.desc || '';
            if(document.getElementById('set-seo-keywords')) document.getElementById('set-seo-keywords').value = window.siteSettings.seo.keywords || '';
        }

        // منصات التواصل
        if(window.siteSettings.social) {
            if(document.getElementById('set-social-fb')) document.getElementById('set-social-fb').value = window.siteSettings.social.facebook || '';
            if(document.getElementById('set-social-ig')) document.getElementById('set-social-ig').value = window.siteSettings.social.instagram || '';
            if(document.getElementById('set-social-tt')) document.getElementById('set-social-tt').value = window.siteSettings.social.tiktok || '';
            if(document.getElementById('set-social-wa')) document.getElementById('set-social-wa').value = window.siteSettings.social.whatsapp || '';
        }

        // الألوان
        const v = window.siteSettings.visuals || (typeof defaultSettings !== 'undefined' ? defaultSettings.visuals : { themeHex: '#ff91a4' });
        if(document.getElementById('set-visual-color-hex')) {
            document.getElementById('set-visual-color-hex').value = v.themeHex || '#ff91a4';
        }
        
        if(typeof window.executeSafely === 'function') {
            window.executeSafely('CategoryDesc', () => { if(typeof window.renderCategoryDescAdmin === 'function') window.renderCategoryDescAdmin(); });
        }

        // إعدادات هندسة الواجهة
        if(window.siteSettings.layout_settings) {
            const viewModeRadios = document.getElementsByName('layout_viewMode');
            if(viewModeRadios) {
                viewModeRadios.forEach(radio => {
                    if(radio.value === window.siteSettings.layout_settings.layout_viewMode) radio.checked = true;
                });
            }
            if(document.getElementById('set-layout-card-width')) document.getElementById('set-layout-card-width').value = window.siteSettings.layout_settings.layout_card_width || '';
            if(document.getElementById('set-layout-card-height')) document.getElementById('set-layout-card-height').value = window.siteSettings.layout_settings.layout_card_height || '';
            if(document.getElementById('set-layout-wf-width')) document.getElementById('set-layout-wf-width').value = window.siteSettings.layout_settings.layout_waterfall_img_width || '';
            if(document.getElementById('set-layout-wf-height')) document.getElementById('set-layout-wf-height').value = window.siteSettings.layout_settings.layout_waterfall_img_height || '';
        }

        // إعدادات واجهة المستخدم المتقدمة
        if(window.siteSettings.UI_Settings) {
            if(document.getElementById('set-loader-text')) document.getElementById('set-loader-text').value = window.siteSettings.UI_Settings.loader_text || '';
            if(document.getElementById('set-loader-bg-color')) document.getElementById('set-loader-bg-color').value = window.siteSettings.UI_Settings.loader_bgColor || '#ffffff';
            if(document.getElementById('set-loader-text-color')) document.getElementById('set-loader-text-color').value = window.siteSettings.UI_Settings.loader_textColor || '#ff91a4';
            
            if(window.siteSettings.UI_Settings.typography_config) {
                if(document.getElementById('set-global-text-color')) document.getElementById('set-global-text-color').value = window.siteSettings.UI_Settings.typography_config.global_text_color || '#1a1a1a';
                if(document.getElementById('set-font-family')) document.getElementById('set-font-family').value = window.siteSettings.UI_Settings.typography_config.main_font_family || "'Cairo', sans-serif";
                if(document.getElementById('set-font-size-base')) document.getElementById('set-font-size-base').value = window.siteSettings.UI_Settings.typography_config.global_font_size_base || '16px';
                if(document.getElementById('set-font-weight-bold')) document.getElementById('set-font-weight-bold').value = window.siteSettings.UI_Settings.typography_config.global_font_weight_bold || '900';
            }
            if(window.siteSettings.UI_Settings.page_dimensions) {
                if(document.getElementById('set-page-max-height')) document.getElementById('set-page-max-height').value = window.siteSettings.UI_Settings.page_dimensions.productPageMaxHeight || 'auto';
                if(document.getElementById('set-page-min-height')) document.getElementById('set-page-min-height').value = window.siteSettings.UI_Settings.page_dimensions.productPageMinHeight || '100vh';
            }
        }

        if(window.siteSettings.Structure_Settings) {
            if(document.getElementById('set-you-may-like')) document.getElementById('set-you-may-like').checked = window.siteSettings.Structure_Settings.section_youMayAlsoLike_isActive !== false;
        }

        if(typeof window.renderDynamicSectionsList === 'function') window.renderDynamicSectionsList();
        if(typeof window.renderCustomSocialLinks === 'function') window.renderCustomSocialLinks();
        if(typeof window.renderReviewsList === 'function') window.renderReviewsList();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'fillAdminSettingsForm');
    }
};

/**
 * 👑 الاعتماد الشامل للإعدادات (Master Save Protocol)
 * تم دمج كافة المتغيرات لضمان عدم فقدان أي بيانات أثناء التحديث السحابي.
 */
window.saveAllSettings = async function() {
    try {
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

        if(!window.siteSettings.catDescriptions) window.siteSettings.catDescriptions = {};
        if(typeof window.catMenu !== 'undefined' && Array.isArray(window.catMenu)) {
            window.catMenu.forEach(cat => {
                const safeId = 'desc-cat-' + Array.from(cat.name).map(c => c.charCodeAt(0)).join('');
                const descInput = document.getElementById(safeId);
                if(descInput) window.siteSettings.catDescriptions[cat.name] = descInput.value.trim();
            });
        }

        // تجميع الحزمة السيادية الشاملة (تضمين المتغيرات القديمة والحديثة)
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
            whatsappNumber: document.getElementById('set-whatsapp')?.value || document.getElementById('set-social-wa')?.value || "",
            maintenanceMode: document.getElementById('set-maintenance')?.checked || false,
            lastAdminAction: Date.now(),
            
            seo: {
                title: document.getElementById('set-seo-title')?.value || window.siteSettings.seo?.title || '',
                desc: document.getElementById('set-seo-desc')?.value || window.siteSettings.seo?.desc || '',
                keywords: document.getElementById('set-seo-keywords')?.value || window.siteSettings.seo?.keywords || ''
            },
            social: {
                facebook: document.getElementById('set-social-fb')?.value || window.siteSettings.social?.facebook || '',
                instagram: document.getElementById('set-social-ig')?.value || window.siteSettings.social?.instagram || '',
                tiktok: document.getElementById('set-social-tt')?.value || window.siteSettings.social?.tiktok || '',
                whatsapp: document.getElementById('set-social-wa')?.value || document.getElementById('set-whatsapp')?.value || window.siteSettings.social?.whatsapp || '',
                customLinks: window.siteSettings.social?.customLinks || []
            },
            visuals: {
                themeHex: document.getElementById('sys-brand-color')?.value || document.getElementById('set-visual-color-hex')?.value || window.siteSettings.visuals?.themeHex || '#ff91a4'
            },
            
            dynamicSections: window.siteSettings.dynamicSections || [],
            customerReviews: window.siteSettings.customerReviews || [],
            layout_settings: layout_settings_payload,
            UI_Settings: UI_Settings_payload,
            Structure_Settings: Structure_Settings_payload
        };

        window.siteSettings = finalMasterPayload;

        try {
            if(typeof window.NetworkEngine !== 'undefined') {
                await window.NetworkEngine.safeWrite('settings', 'main', finalMasterPayload);
                if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('set');
                if(typeof window.showSystemToast === 'function') window.showSystemToast("تم الاعتماد البرمجي وتحديث كامل قيم التكوين لـ حلويات بوسي سحابياً بنجاح 👑☁️", "success");
                if(typeof window.triggerSovereignSync === 'function') window.triggerSovereignSync();
            } else if(typeof window.db !== 'undefined') {
                await window.db.collection('settings').doc('main').set(finalMasterPayload, { merge: true });
                if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('set');
                if(typeof window.showSystemToast === 'function') window.showSystemToast("تم الاعتماد البرمجي وتحديث كامل قيم التكوين لـ حلويات بوسي سحابياً بنجاح 👑☁️", "success");
                if(typeof window.triggerSovereignSync === 'function') window.triggerSovereignSync();
            }
        } catch(e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-settings.js', null, null, 'saveAllSettings (Cloud Sync)');
            console.error("عطل في المزامنة السيادية للإعدادات:", e);
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('set');
            if(typeof window.showSystemToast === 'function') window.showSystemToast("تنويه إداري: تم الحفظ محلياً فقط.. يرجى التحقق من اتصال الشبكة", "info");
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'saveAllSettings (Master)');
    }
};

window.triggerMasterSave = window.saveAllSettings;
window.saveStoreSettings = window.saveAllSettings;

// --- 👑 منظومة الأقسام الديناميكية للمناسبات ---
window.renderDynamicSectionsList = function() {
    try {
        const container = document.getElementById('dynamic-sections-list');
        if(!container) return;
        if(!window.siteSettings.dynamicSections) window.siteSettings.dynamicSections = [];
        
        window.siteSettings.dynamicSections.sort((a,b) => (a.order || 0) - (b.order || 0));
        
        if(window.siteSettings.dynamicSections.length === 0) {
            container.innerHTML = `<p class="text-xs text-slate-500 font-bold text-center py-4">لا توجد أقسام مخصصة للمناسبات حالياً.</p>`;
            return;
        }
        
        const escapeHTMLSafe = typeof window.escapeHTML === 'function' ? window.escapeHTML : (str) => String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
        
        container.innerHTML = window.siteSettings.dynamicSections.map((sec, idx) => `
            <div class="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-2xl group ${!sec.active ? 'opacity-50 grayscale' : ''}">
                <div class="flex items-center gap-3 w-2/3 truncate">
                    <span class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-black text-[10px] shrink-0 shadow-inner">${idx + 1}</span>
                    <div class="flex flex-col truncate">
                        <span class="text-xs font-black text-white truncate">${escapeHTMLSafe(sec.title)}</span>
                        <span class="text-[9px] font-bold text-[#ff91a4] uppercase mt-0.5">${sec.type === 'grid' ? 'شبكة عادية' : (sec.type === 'waterfall' ? 'شلال عرض' : 'شريط تمرير')}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button type="button" onclick="window.toggleSectionVisibility('${sec.id}')" class="p-1.5 rounded-lg border ${sec.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'} relative z-50 pointer-events-auto"><i data-lucide="${sec.active ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i></button>
                    <button type="button" onclick="window.deleteDynamicSection('${sec.id}')" class="p-1.5 rounded-lg border bg-slate-800 text-red-400 border-slate-700 hover:bg-red-500/20 relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
            </div>
        `).join('');
        if(window.lucide) lucide.createIcons();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'renderDynamicSectionsList');
    }
};

window.openAddSectionModal = function() {
    try {
        const title = prompt("قرار إداري: يرجى إدخال اسم القسم الجديد (مثال: عروض العيد):");
        if(!title) return;
        const typeChoice = prompt("اختر طريقة العرض:\n1. شبكة (Grid)\n2. شريط تمرير (Slider)\n3. شلال (Waterfall)\n\nأدخل الرقم (1, 2, 3):", "1");
        
        let type = 'grid';
        if(typeChoice === '2') type = 'slider';
        if(typeChoice === '3') type = 'waterfall';
        
        if(!window.siteSettings.dynamicSections) window.siteSettings.dynamicSections = [];
        window.siteSettings.dynamicSections.push({
            id: 'sec_' + Date.now(),
            title: title.trim(),
            type: type,
            active: true,
            order: window.siteSettings.dynamicSections.length + 1
        });
        
        window.renderDynamicSectionsList();
        if(typeof window.showSystemToast === 'function') window.showSystemToast("تم إدراج القسم بالهيكل بنجاح 👑", "success");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'openAddSectionModal');
    }
};

window.toggleSectionVisibility = function(id) {
    try {
        const sec = window.siteSettings.dynamicSections.find(s => s.id === id);
        if(sec) { sec.active = !sec.active; window.renderDynamicSectionsList(); }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'toggleSectionVisibility');
    }
};

window.deleteDynamicSection = function(id) {
    try {
        if(!confirm("هل توافق حضرتك على الحذف السيادي لهذا القسم من واجهة حلويات بوسي؟")) return;
        window.siteSettings.dynamicSections = window.siteSettings.dynamicSections.filter(s => s.id !== id);
        window.renderDynamicSectionsList();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'deleteDynamicSection');
    }
};

// --- 👑 منظومة الروابط والمنصات المخصصة ---
window.renderCustomSocialLinks = function() {
    try {
        const btnContainer = document.getElementById('new-link-url')?.parentElement;
        let listContainer = document.getElementById('custom-social-list');
        
        if(!listContainer && btnContainer) {
            listContainer = document.createElement('div');
            listContainer.id = 'custom-social-list';
            listContainer.className = 'mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar';
            btnContainer.parentElement.appendChild(listContainer);
        }
        if(!listContainer) return;
        
        if(!window.siteSettings.social) window.siteSettings.social = {};
        if(!window.siteSettings.social.customLinks) window.siteSettings.social.customLinks = [];
        
        if (window.siteSettings.social.customLinks.length === 0) {
            listContainer.innerHTML = '';
            return;
        }

        const escapeHTMLSafe = typeof window.escapeHTML === 'function' ? window.escapeHTML : (str) => String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

        listContainer.innerHTML = window.siteSettings.social.customLinks.map((link, idx) => `
            <div class="flex items-center justify-between p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl group">
                <div class="truncate pl-2">
                    <p class="text-[10px] font-black text-white">${escapeHTMLSafe(link.label)}</p>
                    <p class="text-[9px] text-[#ff91a4] font-mono truncate max-w-[200px] mt-0.5">${escapeHTMLSafe(link.url)}</p>
                </div>
                <button type="button" onclick="window.removeCustomSocialLink(${idx})" class="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors pointer-events-auto relative z-50"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
        `).join('');
        if(window.lucide) lucide.createIcons();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'renderCustomSocialLinks');
    }
};

window.addNewSocialLink = function() {
    try {
        const labelEl = document.getElementById('new-link-label');
        const urlEl = document.getElementById('new-link-url');
        const label = labelEl?.value.trim();
        const url = urlEl?.value.trim();
        if(!label || !url) { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("قرار إداري: يجب إدخال اسم المنصة والرابط أولاً", "error"); 
            return; 
        }
        
        if(!window.siteSettings.social) window.siteSettings.social = {};
        if(!window.siteSettings.social.customLinks) window.siteSettings.social.customLinks = [];
        
        window.siteSettings.social.customLinks.push({ label, url });
        if(labelEl) labelEl.value = '';
        if(urlEl) urlEl.value = '';
        window.renderCustomSocialLinks();
        if(typeof window.showSystemToast === 'function') window.showSystemToast("تم اعتماد المنصة الإضافية 👑", "success");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'addNewSocialLink');
    }
};

window.removeCustomSocialLink = function(idx) {
    try {
        if(!confirm("إلغاء اعتماد هذه المنصة من الروابط؟")) return;
        window.siteSettings.social.customLinks.splice(idx, 1);
        window.renderCustomSocialLinks();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'removeCustomSocialLink');
    }
};

// --- 👑 سجل مراجعات وتجارب العملاء ---
window.renderReviewsList = function() {
    try {
        const container = document.getElementById('admin-reviews-list');
        if(!container) return;
        if(!window.siteSettings.customerReviews) window.siteSettings.customerReviews = [];
        
        if(window.siteSettings.customerReviews.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-8 text-slate-500 text-xs font-bold border border-dashed border-slate-700 rounded-3xl">سجل المراجعات لـ حلويات بوسي فارغ حالياً.</div>`;
            return;
        }
        
        const escapeHTMLSafe = typeof window.escapeHTML === 'function' ? window.escapeHTML : (str) => String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

        container.innerHTML = window.siteSettings.customerReviews.map((rev, idx) => `
            <div class="bg-slate-900 p-4 rounded-3xl border border-slate-800 relative group transition-all duration-300 hover:border-[#ff91a4]/50 ${!rev.active ? 'opacity-40 grayscale' : ''}">
                <div class="flex justify-between items-start mb-3 pr-8">
                    <div>
                        <h5 class="text-xs font-black text-white">${escapeHTMLSafe(rev.name)}</h5>
                        <p class="text-[8px] text-slate-500 font-bold mt-0.5">${escapeHTMLSafe(rev.date || '')}</p>
                    </div>
                    <div class="flex text-amber-400 gap-0.5">
                        ${Array(rev.rating || 5).fill('<i data-lucide="star" class="w-3 h-3 fill-current"></i>').join('')}
                    </div>
                </div>
                <p class="text-[10px] text-slate-300 font-bold leading-relaxed line-clamp-3">${escapeHTMLSafe(rev.text)}</p>
                
                <div class="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onclick="window.toggleReviewStatus('${rev.id}')" class="p-1.5 bg-slate-800 text-[#ff91a4] rounded-lg shadow-lg hover:scale-110 transition-transform pointer-events-auto relative z-50"><i data-lucide="${rev.active ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5"></i></button>
                    <button type="button" onclick="window.deleteReview('${rev.id}')" class="p-1.5 bg-red-500/20 text-red-400 rounded-lg shadow-lg hover:scale-110 transition-transform hover:bg-red-500 hover:text-white pointer-events-auto relative z-50"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                </div>
            </div>
        `).join('');
        if(window.lucide) lucide.createIcons();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'renderReviewsList');
    }
};

window.openAddReviewModal = function() {
    try {
        const name = prompt("قرار إداري: يرجى كتابة اسم العميل:");
        if(!name) return;
        const text = prompt("الرجاء كتابة نص التقييم وتجربة العميل:");
        if(!text) return;
        const rating = prompt("تقييم العميل من 1 إلى 5 نجوم:", "5");
        
        if(!window.siteSettings.customerReviews) window.siteSettings.customerReviews = [];
        window.siteSettings.customerReviews.unshift({
            id: 'rev_' + Date.now(),
            name: name.trim(),
            text: text.trim(),
            rating: parseInt(rating) || 5,
            active: true,
            date: new Date().toLocaleDateString('ar-EG')
        });
        
        window.renderReviewsList();
        if(typeof window.showSystemToast === 'function') window.showSystemToast("تم إدراج تقييم العميل واعتماده 👑", "success");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'openAddReviewModal');
    }
};

window.toggleReviewStatus = function(id) {
    try {
        const rev = window.siteSettings.customerReviews.find(r => r.id === id);
        if(rev) { rev.active = !rev.active; window.renderReviewsList(); }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'toggleReviewStatus');
    }
};

window.deleteReview = function(id) {
    try {
        if(!confirm("هل تود حضرتك حذف هذا التقييم نهائياً من سجل عملاء حلويات بوسي؟")) return;
        window.siteSettings.customerReviews = window.siteSettings.customerReviews.filter(r => r.id !== id);
        window.renderReviewsList();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'deleteReview');
    }
};


window.renderCategoryDescAdmin = function() {
    try {
        let container = document.getElementById('dynamic-category-desc-container');
        if (!container) return;
        
        container.innerHTML = '<label class="block text-xs font-bold text-slate-300 mb-2">صياغة أوصاف الأقسام بأسلوب حلويات بوسي التفاعلي</label>';
        const descriptions = window.siteSettings.catDescriptions || {};
        const escapeHTMLSafe = typeof window.escapeHTML === 'function' ? window.escapeHTML : (str) => String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
        
        if(Array.isArray(window.catMenu)) {
            window.catMenu.forEach(cat => {
                const safeId = 'desc-cat-' + Array.from(cat.name).map(c => c.charCodeAt(0)).join('');
                const currentVal = descriptions[cat.name] || '';
                
                const fieldHtml = `
                    <div class="relative mb-3">
                        <span class="absolute right-4 top-4 text-[10px] font-bold text-[#ff91a4] bg-[#ff91a4]/10 px-2 py-0.5 rounded">${escapeHTMLSafe(cat.name)}</span>
                        <textarea id="${safeId}" placeholder="مثال: وصف احترافي يبرز جودة وطعم ${escapeHTMLSafe(cat.name)}..." class="admin-input rounded-[1.5rem] pt-10 text-sm resize-none" rows="2">${escapeHTMLSafe(currentVal)}</textarea>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', fieldHtml);
            });
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'renderCategoryDescAdmin');
    }
};

window.renderHomepageSelection = function() {
    try {
        const overviewTab = document.getElementById('admin-overview');
        if(!overviewTab) return;
        
        let container = document.getElementById('homepage-selection-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'homepage-selection-container';
            container.className = 'app-card p-4 flex flex-col rounded-[2.5rem] mt-4 border border-[#ff91a4]/20';
            overviewTab.appendChild(container);
        }
        
        if (!window.catalog || window.catalog.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-500 text-center font-bold">لا توجد منتجات مسجلة لاختيارها للواجهة الرئيسية.</p>';
            return;
        }
        
        const escapeHTMLSafe = typeof window.escapeHTML === 'function' ? window.escapeHTML : (str) => String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

        let html = '<h3 class="text-sm font-black text-[#ff91a4] flex items-center gap-2 mb-4"><i data-lucide="layout-template" class="w-4 h-4"></i> هندسة واجهة العميل (الترشيحات السيادية)</h3>';
        html += '<div class="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">';
        
        window.catalog.forEach(prod => {
            const isNew = prod.badge === 'جديد 🌟' || prod.badge === 'جديد';
            const isBest = prod.badge === 'الأكثر مبيعاً 🔥' || prod.badge === 'مبيعاً';
            const isOutOfStock = prod.inStock === false;
            
            html += `
                <div class="flex items-center justify-between bg-[#0a0f1c] p-3 rounded-2xl border border-slate-800 hover:border-[#ff91a4]/30 transition-colors">
                    <div class="flex items-center gap-3 w-1/2 truncate">
                        <img src="${prod.img || 'https://via.placeholder.com/50'}" class="w-8 h-8 rounded-lg object-cover shrink-0 ${isOutOfStock ? 'grayscale opacity-50' : ''}">
                        <span class="text-xs font-bold text-white truncate ${isOutOfStock ? 'line-through text-slate-500' : ''}">${escapeHTMLSafe(prod.name)}</span>
                    </div>
                    <div class="flex gap-2 shrink-0">
                        <button onclick="window.toggleProductBadge('${prod.id}', 'جديد 🌟')" class="px-2 py-1 text-[9px] font-bold rounded-lg border ${isNew ? 'bg-[#ff91a4]/20 text-[#ff91a4] border-[#ff91a4]/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}">حديثاً</button>
                        <button onclick="window.toggleProductBadge('${prod.id}', 'الأكثر مبيعاً 🔥')" class="px-2 py-1 text-[9px] font-bold rounded-lg border ${isBest ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}">مبيعاً</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        if(window.lucide) lucide.createIcons();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'renderHomepageSelection');
    }
};

window.toggleProductBadge = async function(prodId, targetBadge) {
    try {
        const idx = window.catalog.findIndex(p => String(p.id) === String(prodId));
        if (idx === -1) return;
        
        if (window.catalog[idx].badge === targetBadge) {
            window.catalog[idx].badge = '';
        } else {
            window.catalog[idx].badge = targetBadge;
        }
        
        if (typeof window.syncCatalogMap === 'function') window.syncCatalogMap();
        try {
            if(typeof window.NetworkEngine !== 'undefined') await window.NetworkEngine.safeWrite('catalog', String(window.catalog[idx].id), window.catalog[idx]);
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('cat');
            if(typeof window.showSystemToast === 'function') window.showSystemToast("تم تحديث تمييز المنتج للواجهة بنجاح", "success");
        } catch(e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-settings.js', null, null, 'toggleProductBadge (Cloud Sync)');
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('cat');
        }
        
        if(typeof window.renderHomepageSelection === 'function') window.renderHomepageSelection();
        const currentSearch = document.getElementById('admin-search-catalog') ? document.getElementById('admin-search-catalog').value : '';
        if(typeof window.renderAdminMenu === 'function') window.renderAdminMenu(currentSearch);
        if(typeof window.renderAdminCatalogGridUI === 'function') window.renderAdminCatalogGridUI();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'toggleProductBadge (Master)');
    }
};

window.changeAdminPassword = async function() {
    try {
        const currentInput = document.getElementById('sec-current-pwd').value;
        const newPwd = document.getElementById('sec-new-pwd').value;
        const confirmPwd = document.getElementById('sec-confirm-pwd').value;
        if (!currentInput || !newPwd || !confirmPwd) { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("قرار إداري: يرجى ملء جميع الحقول", "error"); 
            return; 
        }
        if (newPwd !== confirmPwd) { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("قرار إداري: كلمة المرور الجديدة غير متطابقة", "error"); 
            return; 
        }
        if (newPwd.length < 6) { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("الرمز السري للسحابة يجب أن يكون 6 أحرف/أرقام على الأقل", "error"); 
            return; 
        }

        try {
            const user = window.auth?.currentUser;
            if (!user) { 
                if(typeof window.showSystemToast === 'function') window.showSystemToast("انتهت جلسة الإدارة، يرجى تسجيل الدخول مجدداً", "error"); 
                return; 
            }
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentInput);
            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(newPwd);
            if(typeof window.showSystemToast === 'function') window.showSystemToast("تم تغيير الرمز السري وتشفيره سحابياً بنجاح 🛡️", "success");
            document.getElementById('sec-current-pwd').value = ''; document.getElementById('sec-new-pwd').value = ''; document.getElementById('sec-confirm-pwd').value = '';
        } catch(e) {
            if (e.code === 'auth/wrong-password') {
                if(typeof window.showSystemToast === 'function') window.showSystemToast("كلمة المرور الحالية غير صحيحة", "error");
            } else {
                if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-settings.js', null, null, 'changeAdminPassword (Auth Error)');
                if(typeof window.showSystemToast === 'function') window.showSystemToast("حدث خطأ تقني أثناء تشفير كلمة المرور الجديدة", "error");
            }
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'changeAdminPassword (Master)');
    }
};

window.renderAdminShipping = function() {
    try {
        const tbody = document.getElementById('admin-shipping-tbody');
        if(!tbody) return;
        if(!window.shippingZones || window.shippingZones.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-500 font-bold text-xs">لا يوجد مناطق توصيل معتمدة</td></tr>`; return;
        }
        const escapeHTMLSafe = typeof window.escapeHTML === 'function' ? window.escapeHTML : (str) => String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

        tbody.innerHTML = window.shippingZones.map(z => `
            <tr class="hover:bg-slate-800 border-b border-slate-800/50 transition-colors">
                <td class="p-3 font-bold text-slate-200 whitespace-nowrap">${escapeHTMLSafe(z.name || '')}</td>
                <td class="p-3 font-black text-emerald-400 whitespace-nowrap">${z.fee} ج.م</td>
                <td class="p-3 text-center whitespace-nowrap">
                    <button onclick="window.deleteShippingZoneConfirm('${z.id}', '${escapeHTMLSafe(z.name || '').replace(/'/g, "\\'")}')" class="text-red-400 hover:text-white p-1.5 bg-slate-800 hover:bg-red-600 rounded-lg transition-colors relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `).join('');
        if(window.lucide) lucide.createIcons();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'renderAdminShipping');
    }
};

window.openAddShippingModal = function() { 
    try {
        if(document.getElementById('ship-area-name')) document.getElementById('ship-area-name').value = '';
        if(document.getElementById('ship-area-fee')) document.getElementById('ship-area-fee').value = '';
        const modal = document.getElementById('admin-ship-modal');
        if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => modal.classList.remove('opacity-0'), 10); }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'openAddShippingModal');
    }
};

window.closeShipModal = function() { 
    try {
        const modal = document.getElementById('admin-ship-modal');
        if(modal) { modal.classList.add('opacity-0'); setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300); }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'closeShipModal');
    }
};

window.saveShippingZone = async function() {
    try {
        const n = document.getElementById('ship-area-name').value.trim(); const f = parseInt(document.getElementById('ship-area-fee').value) || 0;
        if(!n) { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("الرجاء كتابة اسم المنطقة", "error"); 
            return; 
        }
        const newZone = { id: 'sh_' + Date.now() + Math.floor(Math.random() * 100), name: n, fee: f };
        window.shippingZones.push(newZone);
        try { 
            if(typeof window.NetworkEngine !== 'undefined') await window.NetworkEngine.safeWrite('shipping', String(newZone.id), newZone);
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('ship');
            if(typeof window.showSystemToast === 'function') window.showSystemToast("تم إضافة منطقة التوصيل بنجاح", "success");
        } catch (e) { 
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-settings.js', null, null, 'saveShippingZone (Cloud Sync)');
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('ship');
            if(typeof window.showSystemToast === 'function') window.showSystemToast("تم الإضافة محلياً", "info"); 
        }
        window.closeShipModal(); window.renderAdminShipping();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'saveShippingZone (Master)');
    }
};

window.deleteShippingZoneConfirm = function(id, name) {
    try {
        if(typeof window.openConfirmModal === 'function') {
            window.openConfirmModal('حذف منطقة توصيل', `هل توافق حضرتك على اعتماد حذف منطقة "${name}" من نطاق التغطية؟`, () => { window.executeDeleteShippingZone(id); });
        } else {
            if(confirm(`هل توافق حضرتك على اعتماد حذف منطقة "${name}" من نطاق التغطية؟`)) window.executeDeleteShippingZone(id);
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'deleteShippingZoneConfirm');
    }
};

window.executeDeleteShippingZone = async function(id) {
    try {
        window.shippingZones = window.shippingZones.filter(z => String(z.id) !== String(id));
        try { 
            if(typeof window.NetworkEngine !== 'undefined') await window.NetworkEngine.safeWrite('shipping', String(id), null);
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('ship');
            if(typeof window.showSystemToast === 'function') window.showSystemToast("تم الحذف بنجاح", "success");
        } catch(e) { 
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-settings.js', null, null, 'executeDeleteShippingZone (Cloud Sync)');
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('ship'); 
        }
        window.renderAdminShipping();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'executeDeleteShippingZone (Master)');
    }
};

window.saveCakeBuilderSettings = async function() {
    try {
        if(!window.siteSettings) window.siteSettings = { ...(typeof defaultSettings !== 'undefined' ? defaultSettings : {}) };
        if(!window.siteSettings.cakeBuilder) window.siteSettings.cakeBuilder = { ...(typeof defaultSettings !== 'undefined' && defaultSettings.cakeBuilder ? defaultSettings.cakeBuilder : {}) };
        
        const c = window.siteSettings.cakeBuilder;
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
            if(typeof window.NetworkEngine !== 'undefined') await window.NetworkEngine.safeWrite('settings', 'main', window.siteSettings);
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('set');
            if(typeof window.showSystemToast === 'function') window.showSystemToast("تم اعتماد وإرسال إعدادات التورت الملكية لـ حلويات بوسي 👑", "success");
        } catch(e) { 
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-settings.js', null, null, 'saveCakeBuilderSettings (Cloud Sync)');
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('set');
            if(typeof window.showSystemToast === 'function') window.showSystemToast("تم الحفظ محلياً", "info"); 
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'saveCakeBuilderSettings (Master)');
    }
};

window.renderAdminCategories = function() {
    try {
        const listEl = document.getElementById('admin-categories-list');
        if (!listEl) return;
        
        const sortedCats = [...window.catMenu].sort((a, b) => a.order - b.order);

        if (sortedCats.length === 0) { listEl.innerHTML = `<p class="text-center text-slate-500 py-6 font-bold text-xs">لم يتم هندسة أي قسم للآن.</p>`; return; }
        
        const escapeHTMLSafe = typeof window.escapeHTML === 'function' ? window.escapeHTML : (str) => String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

        listEl.innerHTML = sortedCats.map((cat, index) => `
            <div class="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-[1rem] group hover:border-[#ff91a4]/50 transition-all mb-2">
                <div class="flex items-center gap-3"><span class="w-6 h-6 flex items-center justify-center bg-slate-900 rounded-[0.5rem] text-[10px] text-slate-400 font-bold">${cat.order}</span><span class="font-bold text-slate-200 text-sm">${escapeHTMLSafe(cat.name)}</span></div>
                <button onclick="window.removeCategory('${escapeHTMLSafe(cat.name).replace(/'/g, "\\'")}')" class="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 relative z-50 pointer-events-auto"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        `).join('');
        if(window.lucide) lucide.createIcons();
        
        const catSelect = document.getElementById('edit-prod-cat') || document.getElementById('form-product-cat');
        if(catSelect) catSelect.innerHTML = sortedCats.map(c => `<option value="${escapeHTMLSafe(c.name)}">${escapeHTMLSafe(c.name)}</option>`).join('');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'renderAdminCategories');
    }
};

window.addNewCategory = function() {
    try {
        const input = document.getElementById('new-category-input');
        const orderInput = document.getElementById('new-category-order');
        if(!input) return;
        const val = input.value.trim();
        const order = parseInt(orderInput?.value) || (window.catMenu.length + 1);

        if (!val) { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("قرار إداري: يرجى صياغة اسم القسم للاعتماد", "error"); 
            return; 
        }
        if (window.catMenu.find(c => c.name === val)) { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("هذا المسمى موجود بالفعل بالهيكل", "error"); 
            return; 
        }
        
        window.catMenu.push({name: val, order: order});
        input.value = ''; if(orderInput) orderInput.value = '';
        window.renderAdminCategories();
        if(typeof window.renderAdminCatalogTabs === 'function') window.renderAdminCatalogTabs();
        
        if(typeof window.executeSafely === 'function') {
            window.executeSafely('CategoryDesc', () => { if(typeof window.renderCategoryDescAdmin === 'function') window.renderCategoryDescAdmin(); });
        }
        
        if(typeof window.showSystemToast === 'function') window.showSystemToast(`تم إدراج القسم بالهيكل. يرجى تفعيل الحفظ الشامل لاعتماده.`, "success");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'addNewCategory');
    }
};

window.removeCategory = function(catName) {
    try {
        if (catName === 'تورت') { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("قرار إداري: قسم التورت الملكية لـ حلويات بوسي ذو طابع سيادي ولا يُمكن إزالته! 👑", "error"); 
            return; 
        }
        if(typeof window.openConfirmModal === 'function') {
            window.openConfirmModal('استبعاد قسم', `هل توافق حضرتك على اعتماد قرار استبعاد قسم "${catName}" نهائياً من الهيكل؟`, () => {
                window.catMenu = window.catMenu.filter(c => c.name !== catName);
                window.renderAdminCategories(); 
                if(typeof window.renderAdminCatalogTabs === 'function') window.renderAdminCatalogTabs();
                if(typeof window.executeSafely === 'function') {
                    window.executeSafely('CategoryDesc', () => { if(typeof window.renderCategoryDescAdmin === 'function') window.renderCategoryDescAdmin(); });
                }
            });
        } else {
            if(confirm(`هل توافق حضرتك على اعتماد قرار استبعاد قسم "${catName}" نهائياً من الهيكل؟`)) {
                window.catMenu = window.catMenu.filter(c => c.name !== catName);
                window.renderAdminCategories();
            }
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'removeCategory');
    }
};

window.saveCategoriesToCloud = async function() {
    try {
        try {
            if(!window.siteSettings) window.siteSettings = {};
            window.siteSettings.catMenu = window.catMenu;
            if(typeof window.NetworkEngine !== 'undefined') await window.NetworkEngine.safeWrite('settings', 'main', window.siteSettings);
            if (typeof window.saveEngineMemory === 'function') window.saveEngineMemory('set');
            if(typeof window.showSystemToast === 'function') window.showSystemToast("تم هندسة الأقسام واعتمادها سحابياً بنجاح! ✨", "success");
            if(typeof window.triggerSovereignSync === 'function') window.triggerSovereignSync();
        } catch (e) { 
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'admin-settings.js', null, null, 'saveCategoriesToCloud (Cloud Sync)');
            if(typeof window.showSystemToast === 'function') window.showSystemToast("فشل الاتصال السحابي أثناء اعتماد الأقسام", "error"); 
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'saveCategoriesToCloud (Master)');
    }
};

// --- 👑 منظومة الخصومات والكوبونات التفاعلية المطورة ---
window.initAdminPromoCodes = function() {
    try {
        if(!window.siteSettings) window.siteSettings = {};
        if(!window.siteSettings.promoCodes) window.siteSettings.promoCodes = [];
        window.renderPromoCodes();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'initAdminPromoCodes');
    }
};

window.renderPromoCodes = function() {
    try {
        const container = document.getElementById('promo-codes-list'); 
        if(!container) return;
        
        const codes = window.siteSettings.promoCodes || [];
        if(codes.length === 0) { 
            container.innerHTML = `<div class="text-[10px] text-slate-600 font-bold py-4 text-center">لا يوجد أكواد خصم نشطة حالياً.</div>`; 
            return; 
        }
        
        const escapeHTMLSafe = typeof window.escapeHTML === 'function' ? window.escapeHTML : (str) => String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

        container.innerHTML = codes.map((c, idx) => `
            <div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 mb-2 group transition-all hover:border-[#ff91a4]/50">
                <div class="flex flex-col">
                    <span class="text-xs font-black text-white font-mono tracking-widest uppercase">${escapeHTMLSafe(c.code)}</span>
                    <span class="text-[10px] text-[#ff91a4] font-bold mt-1">خصم فني ${c.discount}%</span>
                </div>
                <button onclick="window.deletePromoCode(${idx})" class="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-500 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all border border-slate-700 hover:border-red-500/30">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
        if(window.lucide) lucide.createIcons();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'renderPromoCodes');
    }
};

window.addPromoCode = function() {
    try {
        const codeInput = document.getElementById('promo-code-input'); 
        const discountInput = document.getElementById('promo-discount-input');
        if(!codeInput || !discountInput) return;
        
        const code = codeInput.value.trim().toUpperCase(); 
        const discount = parseInt(discountInput.value) || 0;
        
        if(!code || discount <= 0 || discount > 100) { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("قرار إداري: يرجى اعتماد كود سليم ونسبة تتراوح بين 1 و 100", "error"); 
            return; 
        }
        
        if(!window.siteSettings) window.siteSettings = {};
        if(!window.siteSettings.promoCodes) window.siteSettings.promoCodes = [];
        
        if(window.siteSettings.promoCodes.find(c => c.code === code)) { 
            if(typeof window.showSystemToast === 'function') window.showSystemToast("هذا الكود مُدرج مسبقاً بالنظام السيادي لـ حلويات بوسي", "error"); 
            return; 
        }
        
        window.siteSettings.promoCodes.push({ code, discount });
        codeInput.value = ''; 
        discountInput.value = '';
        
        window.renderPromoCodes();
        
        // حفظ مباشر للقرار المهني الجديد
        if(typeof window.saveAllSettings === 'function') window.saveAllSettings();
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'addPromoCode');
    }
};

window.deletePromoCode = function(idx) {
    try {
        if(!window.siteSettings || !window.siteSettings.promoCodes) return;
        
        if(confirm("هل توافق حضرتك على اعتماد قرار إيقاف كود الخصم هذا؟")) {
            window.siteSettings.promoCodes.splice(idx, 1);
            window.renderPromoCodes();
            if(typeof window.saveAllSettings === 'function') window.saveAllSettings();
        }
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'admin-settings.js', null, null, 'deletePromoCode');
    }
};