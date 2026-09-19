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
    let orderRules = {};
    let badgeSettings = {};

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

    // ⏰ نفس صياغة الموقع للعميلة ("9:00 الصبح" / "9:00 بالليل") - راجع boseFormatSpokenHour في cart-engine.js
    function spokenHour(time24) {
        const parts = String(time24 || "").split(":");
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return String(time24 || "");
        const h12 = h % 12 === 0 ? 12 : h % 12;
        const period = h < 12 ? "الصبح" : (h < 17 ? "بعد الضهر" : "بالليل");
        return h12 + ":" + String(m).padStart(2, "0") + " " + period;
    }

    // ⏰ [ساعة واضحة من 1 لـ 12]: بدل حقل الوقت الأصلي (اللي بيعرض 21/18/17 على بعض التليفونات)،
    // الساعة بتتختار من قايمة 1-12 + صباحًا/مساءً، والقيمة الفعلية بتتخزن في حقل مخفي
    // بنفس الـid القديم بصيغة "HH:00" - فباقي الكود (الحفظ/الفحص/الموقع) مبيتغيرش.
    function initTimeWidget(baseId) {
        const hourSel = document.getElementById(baseId + "-hour");
        const periodSel = document.getElementById(baseId + "-period");
        const hidden = document.getElementById(baseId);
        if (!hourSel || !periodSel || !hidden) return;
        if (!hourSel.options.length) {
            for (let h = 1; h <= 12; h++) {
                const opt = document.createElement("option");
                opt.value = String(h);
                opt.textContent = String(h);
                hourSel.appendChild(opt);
            }
        }
        const push = () => {
            let h = parseInt(hourSel.value, 10) % 12;
            if (periodSel.value === "PM") h += 12;
            hidden.value = String(h).padStart(2, "0") + ":00";
            hidden.dispatchEvent(new Event("input"));
        };
        hourSel.addEventListener("change", push);
        periodSel.addEventListener("change", push);
    }

    function syncTimeWidget(baseId) {
        const hourSel = document.getElementById(baseId + "-hour");
        const periodSel = document.getElementById(baseId + "-period");
        const hidden = document.getElementById(baseId);
        if (!hourSel || !periodSel || !hidden) return;
        const h = parseInt(String(hidden.value || "").split(":")[0], 10);
        if (isNaN(h)) return;
        hourSel.value = String(h % 12 === 0 ? 12 : h % 12);
        periodSel.value = h >= 12 ? "PM" : "AM";
    }

    let hoursPreviewWired = false;
    function updateHoursPreview() {
        const box = document.getElementById("rules-hours-preview");
        if (!box) return;
        const startEl = document.getElementById("rules-businessHoursStart");
        const endEl = document.getElementById("rules-businessHoursEnd");
        const start = (startEl && startEl.value) || "09:00";
        const end = (endEl && endEl.value) || "22:00";
        if (end <= start) {
            box.style.color = "#B3261E";
            box.textContent = "⚠️ ساعة النهاية لازم تكون بعد ساعة البداية";
            return;
        }
        box.style.color = "#111111";
        box.textContent = "العميلات هيشوفوا: مواعيد الاستلام والتوصيل من " + spokenHour(start) + " لحد " + spokenHour(end);
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
        orderRules = settings.orderRules || {};
        badgeSettings = settings.badgeSettings || {};

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

        // قواعد التوقيت وأقل مدة تحضير
        fillField("rules-minPreparationTimeHours", orderRules.minPreparationTimeHours ?? 24);
        fillField("rules-minPreparationTimeHoursCustom", orderRules.minPreparationTimeHoursCustom ?? 72);
        fillField("rules-businessHoursStart", orderRules.businessHoursStart || "09:00");
        fillField("rules-businessHoursEnd", orderRules.businessHoursEnd || "22:00");
        // ⏰ معاينة مواعيد الاستلام والتوصيل زي ما العميلة هتشوفها، بتتحدث فورًا مع أي تغيير
        if (!hoursPreviewWired) {
            initTimeWidget("rules-businessHoursStart");
            initTimeWidget("rules-businessHoursEnd");
        }
        syncTimeWidget("rules-businessHoursStart");
        syncTimeWidget("rules-businessHoursEnd");
        updateHoursPreview();
        if (!hoursPreviewWired) {
            hoursPreviewWired = true;
            ["rules-businessHoursStart", "rules-businessHoursEnd"].forEach((id) => {
                const el = document.getElementById(id);
                if (el) { el.addEventListener("input", updateHoursPreview); el.addEventListener("change", updateHoursPreview); }
            });
        }

        // 📅 [تقويم الإتاحة الذكي]: سقف عدد الطلبات يوميًا - فاضي/صفر يعني بلا حد
        fillField("rules-maxOrdersPerDay", orderRules.maxOrdersPerDay ?? "");
        fillField("rules-maxCustomOrdersPerDay", orderRules.maxCustomOrdersPerDay ?? "");

        // إعدادات البادجات التلقائية
        fillField("badges-newArrivalDays", badgeSettings.newArrivalDays ?? 14);
        fillField("badges-bestSellerDays", badgeSettings.bestSellerDays ?? 30);
        fillField("badges-bestSellerLimit", badgeSettings.bestSellerLimit ?? 8);

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
            // ⏰ حماية: ساعة النهاية لازم تكون بعد ساعة البداية، وإلا الموقع كله هيقفل الاستلام والتوصيل
            const hoursStartCheck = readField("rules-businessHoursStart") || "09:00";
            const hoursEndCheck = readField("rules-businessHoursEnd") || "22:00";
            if (hoursEndCheck <= hoursStartCheck) {
                window.BoseAdminUI.showToast("ساعة نهاية الاستلام والتوصيل لازم تكون بعد ساعة البداية", "error");
                return;
            }

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

            const updatedOrderRules = {
                ...orderRules,
                minPreparationTimeHours: readNumberField("rules-minPreparationTimeHours") || 24,
                minPreparationTimeHoursCustom: readNumberField("rules-minPreparationTimeHoursCustom") || 72,
                businessHoursStart: readField("rules-businessHoursStart") || "09:00",
                businessHoursEnd: readField("rules-businessHoursEnd") || "22:00",
                // 📅 [تقويم الإتاحة الذكي]: 0/فاضي = بلا حد (الميزة تفضل معطلة تلقائيًا
                // لحد ما هي تحدد رقم فعلي)
                maxOrdersPerDay: readNumberField("rules-maxOrdersPerDay") || 0,
                maxCustomOrdersPerDay: readNumberField("rules-maxCustomOrdersPerDay") || 0,
            };

            const updatedBadgeSettings = {
                ...badgeSettings,
                newArrivalDays: readNumberField("badges-newArrivalDays") || 14,
                bestSellerDays: readNumberField("badges-bestSellerDays") || 30,
                bestSellerLimit: readNumberField("badges-bestSellerLimit") || 8,
            };

            await window.BoseAdmin.saveStoreGeneralSettings({
                store: updatedStore,
                seo: updatedSeo,
                social: updatedSocial,
                orderRules: updatedOrderRules,
                badgeSettings: updatedBadgeSettings,
            });
            store = updatedStore;
            seo = updatedSeo;
            social = updatedSocial;
            orderRules = updatedOrderRules;
            badgeSettings = updatedBadgeSettings;
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