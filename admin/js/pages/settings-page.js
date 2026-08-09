/**
 * settings-page.js - منطق صفحة بيانات المتجر فقط
 * =====================================================================
 * نطاق النسخة دي: بيانات المتجر العامة (الاسم، الشعار، الهاتف، الألوان،
 * بيانات الاستلام من الفرع، سياسة زيادة الأسعار)، SEO، والسوشيال ميديا -
 * زي ما هو مكتوب في خطة التنفيذ بالظبط. أعمدة navigation و footer مش
 * متضمنة هنا لحد ما تحتاجها (نفس منطق استثناء الهيرو من صفحة الرئيسية).
 */
(function () {
    "use strict";

    let store = {};
    let seo = {};
    let social = {};

    function fillField(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value ?? "";
    }

    function readField(id) {
        return document.getElementById(id).value.trim();
    }

    function readNumberField(id) {
        return parseFloat(document.getElementById(id).value) || 0;
    }

    /* ============================= الشعار ============================= */

    function refreshLogoPreview() {
        const img = document.getElementById("store-logo-preview");
        img.src = store.logo || "";
        img.style.display = store.logo ? "block" : "none";
    }

    function wireLogoUpload() {
        document.getElementById("store-logo-input").addEventListener("change", async (evt) => {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;
            const label = document.getElementById("store-logo-upload-label");
            const original = label.textContent;
            label.textContent = "جاري الرفع...";
            try {
                store.logo = await window.BoseAdminUI.uploadImageToCloudinary(file);
                refreshLogoPreview();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر رفع الشعار", "error");
            } finally {
                label.textContent = original;
                evt.target.value = "";
            }
        });
    }

    function wireOgImageUpload() {
        document.getElementById("seo-ogimage-input").addEventListener("change", async (evt) => {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;
            const label = document.getElementById("seo-ogimage-upload-label");
            const original = label.textContent;
            label.textContent = "جاري الرفع...";
            try {
                seo.ogImage = await window.BoseAdminUI.uploadImageToCloudinary(file);
                refreshOgImagePreview();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر رفع الصورة", "error");
            } finally {
                label.textContent = original;
                evt.target.value = "";
            }
        });
    }

    function refreshOgImagePreview() {
        const img = document.getElementById("seo-ogimage-preview");
        img.src = seo.ogImage || "";
        img.style.display = seo.ogImage ? "block" : "none";
    }

    /* ============================= التحميل ============================= */

    async function init() {
        const settings = await window.BoseAdmin.getStoreGeneralSettings();
        store = settings.store || {};
        seo = settings.seo || {};
        social = settings.social || {};

        store.theme = store.theme || {};
        store.pickup = store.pickup || {};
        store.priceIncrease = store.priceIncrease || {};

        // بيانات المتجر
        fillField("store-name", store.name);
        fillField("store-slogan", store.slogan);
        fillField("store-phone", store.phone);
        fillField("store-currency", store.currency);
        refreshLogoPreview();

        // الألوان
        fillField("store-theme-primary", store.theme.primary || "#FF91A4");
        fillField("store-theme-secondary", store.theme.secondary || "#D4AF37");
        fillField("store-theme-text", store.theme.text || "#111111");
        fillField("store-theme-background", store.theme.background || "#FFFFFF");

        // الاستلام من الفرع
        fillField("store-pickup-address", store.pickup.address);
        fillField("store-pickup-mapUrl", store.pickup.mapUrl);
        fillField("store-pickup-message", store.pickup.message);
        fillField("store-pickup-shippingFee", store.pickup.shippingFee ?? 0);

        // زيادة الأسعار
        document.getElementById("store-priceIncrease-enabled").checked = !!store.priceIncrease.enabled;
        fillField("store-priceIncrease-percent", store.priceIncrease.percent ?? 0);
        fillField("store-priceIncrease-applyOn", store.priceIncrease.applyOn || "menu-only");

        // SEO
        fillField("seo-title", seo.title);
        fillField("seo-description", seo.description);
        fillField("seo-keywords", (seo.keywords || []).join("، "));
        refreshOgImagePreview();

        // السوشيال ميديا
        fillField("social-facebook", social.facebook);
        fillField("social-instagram", social.instagram);
        fillField("social-tiktok", social.tiktok);
        fillField("social-whatsapp", social.whatsapp);

        wireLogoUpload();
        wireOgImageUpload();
        document.getElementById("settings-save-btn").addEventListener("click", handleSaveAll);
        document.getElementById("settings-content").style.display = "";
        document.getElementById("settings-loading").style.display = "none";
    }

    async function handleSaveAll() {
        const saveBtn = document.getElementById("settings-save-btn");
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

        try {
            const updatedStore = {
                ...store,
                name: readField("store-name"),
                slogan: readField("store-slogan"),
                phone: readField("store-phone"),
                currency: readField("store-currency"),
                logo: store.logo || "",
                theme: {
                    primary: readField("store-theme-primary"),
                    secondary: readField("store-theme-secondary"),
                    text: readField("store-theme-text"),
                    background: readField("store-theme-background"),
                },
                pickup: {
                    address: readField("store-pickup-address"),
                    mapUrl: readField("store-pickup-mapUrl"),
                    message: readField("store-pickup-message"),
                    shippingFee: readNumberField("store-pickup-shippingFee"),
                },
                priceIncrease: {
                    enabled: document.getElementById("store-priceIncrease-enabled").checked,
                    percent: readNumberField("store-priceIncrease-percent"),
                    applyOn: document.getElementById("store-priceIncrease-applyOn").value,
                },
            };

            const updatedSeo = {
                ...seo,
                title: readField("seo-title"),
                description: readField("seo-description"),
                keywords: readField("seo-keywords").split(/[،,]/).map((k) => k.trim()).filter(Boolean),
                ogImage: seo.ogImage || "",
            };

            const updatedSocial = {
                ...social,
                facebook: readField("social-facebook"),
                instagram: readField("social-instagram"),
                tiktok: readField("social-tiktok"),
                whatsapp: readField("social-whatsapp"),
            };

            await window.BoseAdmin.saveStoreGeneralSettings({ store: updatedStore, seo: updatedSeo, social: updatedSocial });
            store = updatedStore;
            seo = updatedSeo;
            social = updatedSocial;
            window.BoseAdminUI.showToast("تم حفظ بيانات المتجر", "success");
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر حفظ البيانات", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ كل التغييرات';
        }
    }

    document.addEventListener("BoseAdminReady", init);
})();