/**
 * seasons-page.js - منطق صفحة "المواسم والمناسبات" فقط
 * =====================================================================
 * نفس نمط promotions-page.js بالحرف: المواسم مش جدول منفصل - هي مصفوفة
 * واحدة (seasons) جوه صف store_settings الوحيد. أي حفظ (إضافة/تعديل/حذف)
 * بيبعت المصفوفة بالكامل تاني، فالصفحة بتحتفظ بنسخة محلية (currentSeasons)
 * وتبعتها كل مرة.
 *
 * كل عنصر موسم: id (فريد), name, startDate, endDate (YYYY-MM-DD),
 * manualOverride (null=تلقائي حسب التاريخ, true=فرض تفعيل, false=فرض إيقاف),
 * accentColor (هيكس اختياري - لو فاضي بيستخدم بينك العلامة الافتراضي)،
 * banner {title, description, cta, target, image}, badge {text, icon},
 * linkedProductIds [], linkedCategoryIds [], cartMessage {text, enabled}.
 *
 * حساب "الحالة" (شغالة الآن/قادمة/خلصت) بيحصل هنا وفي الواجهة الحية
 * (seasons-engine.js) بنفس المنطق بالظبط - أي تعديل في منطق الحالة هنا
 * لازم ينعكس هناك كمان.
 */
(function () {
    "use strict";

    let currentSeasons = [];
    let allCategories = [];
    let allProducts = [];

    function todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    /** نفس منطق getActiveBoseSeason في seasons-engine.js بالظبط - لازم يتزامنوا مع أي تعديل */
    function getSeasonStatus(season) {
        if (season.manualOverride === true) return { label: "مفعّلة يدوياً الآن", cls: "szn-status-forced" };
        if (season.manualOverride === false) return { label: "معطّلة يدوياً", cls: "szn-status-off" };
        const today = todayStr();
        if (!season.startDate || !season.endDate) return { label: "بدون تواريخ", cls: "szn-status-off" };
        if (today < season.startDate) return { label: "قادمة", cls: "szn-status-upcoming" };
        if (today > season.endDate) return { label: "خلصت", cls: "szn-status-ended" };
        return { label: "شغالة الآن", cls: "szn-status-live" };
    }

    function categoryTitle(id) {
        return allCategories.find((c) => c.id === id)?.title || id;
    }
    function productTitle(id) {
        return allProducts.find((p) => p.id === id)?.title || id;
    }

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("seasons-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!currentSeasons.length) {
            tbody.innerHTML = `<tr><td colspan="5">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-champagne-glasses",
                title: "مفيش مناسبات مضافة لسه",
                text: "ابدأ بإضافة أول مناسبة (زي عيد الحب أو رمضان) من زرار \"مناسبة جديدة\".",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = currentSeasons.map((s, idx) => {
            const status = getSeasonStatus(s);
            const linkedCount = (s.linkedProductIds || []).length + (s.linkedCategoryIds || []).length;
            return `
            <tr>
                <td><strong>${e(s.name)}</strong></td>
                <td><span class="szn-status-chip ${status.cls}">${status.label}</span></td>
                <td>${s.startDate ? e(s.startDate) : "—"} → ${s.endDate ? e(s.endDate) : "—"}</td>
                <td>${linkedCount || "—"}</td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-idx="${idx}" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-idx="${idx}" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => openSeasonModal(currentSeasons[Number(btn.getAttribute("data-idx"))]));
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(Number(btn.getAttribute("data-idx"))));
        });
    }

    async function persist(successMessage) {
        await window.BoseAdmin.saveSeasons(currentSeasons);
        window.BoseAdminUI.showToast(successMessage, "success");
        renderTable();
    }

    async function handleDelete(idx) {
        const season = currentSeasons[idx];
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الحذف",
            message: `هل أنت متأكدة من حذف مناسبة "${season.name}"؟ الإجراء ده نهائي.`,
            confirmLabel: "حذف نهائي",
            danger: true,
        });
        if (!confirmed) return;

        const backup = [...currentSeasons];
        currentSeasons.splice(idx, 1);
        try {
            await persist("تم حذف المناسبة");
        } catch (e) {
            currentSeasons = backup;
            window.BoseAdminUI.showToast("تعذر حذف المناسبة", "error");
            renderTable();
        }
    }

    /* ============================= مودال إضافة/تعديل ============================= */

    function categoryCheckboxesHTML(selectedIds) {
        const e = window.BoseAdminUI.escapeHtml;
        const selected = new Set(selectedIds || []);
        return allCategories.map((c) => `
            <label><input type="checkbox" class="szn-cat-checkbox" value="${e(c.id)}" ${selected.has(c.id) ? "checked" : ""}> ${e(c.title)}</label>
        `).join("");
    }

    function productOptionsHTML(excludeIds) {
        const e = window.BoseAdminUI.escapeHtml;
        const excluded = new Set(excludeIds || []);
        return `<option value="">-- اختاري منتج لإضافته --</option>` + allProducts
            .filter((p) => !excluded.has(p.id))
            .map((p) => `<option value="${e(p.id)}">${e(p.title)}</option>`).join("");
    }

    function openSeasonModal(season) {
        const isEdit = !!season;
        const e = window.BoseAdminUI.escapeHtml;
        let bannerImage = isEdit ? (season.banner?.image || "") : "";
        let linkedProductIds = isEdit ? [...(season.linkedProductIds || [])] : [];

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 640px;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل مناسبة" : "مناسبة جديدة"}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form id="season-form">
                    <div class="szn-section-title">البيانات الأساسية</div>
                    <div class="adm-field">
                        <label for="sf-id">معرّف المناسبة (ID)</label>
                        <input type="text" class="adm-input" id="sf-id" value="${isEdit ? e(season.id) : ""}"
                               placeholder="مثال: valentine-2027" ${isEdit ? "disabled" : ""} required>
                        ${!isEdit ? `<span class="adm-hint">نص إنجليزي فريد، بحروف صغيرة وشرطات (-) بس. مينفعش يتغير بعد الحفظ.</span>` : ""}
                    </div>
                    <div class="adm-field">
                        <label for="sf-name">اسم المناسبة</label>
                        <input type="text" class="adm-input" id="sf-name" value="${isEdit ? e(season.name) : ""}" placeholder="مثال: عيد الحب" required>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="sf-start-date">تاريخ البداية</label>
                            <input type="date" class="adm-input" id="sf-start-date" value="${isEdit && season.startDate ? e(season.startDate) : ""}" required>
                        </div>
                        <div class="adm-field">
                            <label for="sf-end-date">تاريخ النهاية</label>
                            <input type="date" class="adm-input" id="sf-end-date" value="${isEdit && season.endDate ? e(season.endDate) : ""}" required>
                        </div>
                    </div>
                    <div class="adm-field">
                        <label for="sf-override">التحكم اليدوي</label>
                        <select class="adm-select" id="sf-override">
                            <option value="auto" ${!isEdit || season.manualOverride == null ? "selected" : ""}>تلقائي حسب التاريخ فوق</option>
                            <option value="on" ${isEdit && season.manualOverride === true ? "selected" : ""}>فرض التفعيل الآن (بغض النظر عن التاريخ)</option>
                            <option value="off" ${isEdit && season.manualOverride === false ? "selected" : ""}>فرض الإيقاف الآن (بغض النظر عن التاريخ)</option>
                        </select>
                    </div>

                    <div class="adm-field">
                        <label for="sf-accent-color">لون مميز للمناسبة (اختياري)</label>
                        <div class="szn-color-row">
                            <input type="color" class="adm-input" id="sf-accent-color" value="${isEdit && season.accentColor ? e(season.accentColor) : "#FF91A4"}" style="width:60px; padding:4px;">
                            <label class="adm-checkbox-label"><input type="checkbox" id="sf-accent-color-enabled" ${isEdit && season.accentColor ? "checked" : ""}> استخدام لون مميز (بدلها: بينك العلامة الافتراضي)</label>
                        </div>
                        <span class="adm-hint">بيتحط في البانر والشارة بس - أزرار الموقع الأساسية بتفضل بينك دايمًا</span>
                    </div>

                    <div class="szn-section-title">بانر الصفحة الرئيسية</div>
                    <div class="adm-field">
                        <label for="sf-banner-title">عنوان البانر</label>
                        <input type="text" class="adm-input" id="sf-banner-title" value="${isEdit ? e(season.banner?.title || "") : ""}">
                    </div>
                    <div class="adm-field">
                        <label for="sf-banner-description">وصف البانر</label>
                        <textarea class="adm-textarea" id="sf-banner-description">${isEdit ? e(season.banner?.description || "") : ""}</textarea>
                    </div>
                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="sf-banner-cta">نص الزرار</label>
                            <input type="text" class="adm-input" id="sf-banner-cta" value="${isEdit ? e(season.banner?.cta || "") : ""}" placeholder="مثال: اطلبي دلوقتي">
                        </div>
                        <div class="adm-field">
                            <label for="sf-banner-target">رابط الزرار</label>
                            <input type="text" class="adm-input" id="sf-banner-target" value="${isEdit ? e(season.banner?.target || "") : ""}" placeholder="offers.html">
                        </div>
                    </div>
                    <div class="adm-field">
                        <label>صورة البانر</label>
                        <div class="adm-images-grid" id="sf-banner-image-grid"></div>
                        <label class="adm-image-upload-btn" for="sf-banner-image-input">
                            <i class="fa-solid fa-cloud-arrow-up"></i>
                            <span id="sf-banner-upload-label">${bannerImage ? "استبدال الصورة" : "إضافة صورة"}</span>
                        </label>
                        <input type="file" id="sf-banner-image-input" accept="image/*" hidden>
                    </div>

                    <div class="szn-section-title">شارة المنتجات</div>
                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="sf-badge-text">نص الشارة</label>
                            <input type="text" class="adm-input" id="sf-badge-text" value="${isEdit ? e(season.badge?.text || "") : ""}" placeholder="مثال: 🎁 عيد الحب">
                        </div>
                        <div class="adm-field">
                            <label for="sf-badge-icon">أيقونة (اختياري)</label>
                            <input type="text" class="adm-input" id="sf-badge-icon" value="${isEdit ? e(season.badge?.icon || "") : ""}" placeholder="fa-heart">
                        </div>
                    </div>

                    <div class="adm-field">
                        <label>الفئات المرتبطة (كل منتجات الفئة هتاخد الشارة)</label>
                        <div class="szn-checkbox-grid" id="sf-categories-grid">${categoryCheckboxesHTML(isEdit ? season.linkedCategoryIds : [])}</div>
                    </div>

                    <div class="adm-field">
                        <label for="sf-product-select">منتجات محدّدة إضافية (اختياري)</label>
                        <div style="display:flex; gap:8px;">
                            <select class="adm-select" id="sf-product-select" style="flex:1;">${productOptionsHTML(linkedProductIds)}</select>
                            <button type="button" class="adm-btn adm-btn-outline" id="sf-add-product-btn">إضافة</button>
                        </div>
                        <div class="szn-chips-list" id="sf-products-chips"></div>
                    </div>

                    <div class="szn-section-title">رسالة السلة/الشيك أوت</div>
                    <div class="adm-field">
                        <label class="adm-checkbox-label"><input type="checkbox" id="sf-cart-message-enabled" ${isEdit && season.cartMessage?.enabled ? "checked" : ""}> إظهار رسالة في السلة والشيك أوت</label>
                    </div>
                    <div class="adm-field">
                        <label for="sf-cart-message-text">نص الرسالة</label>
                        <input type="text" class="adm-input" id="sf-cart-message-text" value="${isEdit ? e(season.cartMessage?.text || "") : ""}" placeholder="مثال: حابة تضيفي كرت تهنئة بعيد الحب؟">
                    </div>

                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="sf-save-btn">حفظ المناسبة</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }

        function refreshBannerImageGrid() {
            const grid = document.getElementById("sf-banner-image-grid");
            grid.innerHTML = bannerImage
                ? `<div class="adm-image-thumb-wrap"><img src="${e(bannerImage)}" alt=""><button type="button" class="adm-image-remove-btn" id="sf-banner-image-remove"><i class="fa-solid fa-xmark"></i></button></div>`
                : "";
            document.getElementById("sf-banner-upload-label").textContent = bannerImage ? "استبدال الصورة" : "إضافة صورة";
            const removeBtn = document.getElementById("sf-banner-image-remove");
            if (removeBtn) removeBtn.addEventListener("click", () => { bannerImage = ""; refreshBannerImageGrid(); });
        }
        refreshBannerImageGrid();

        function refreshProductChips() {
            const chipsBox = document.getElementById("sf-products-chips");
            chipsBox.innerHTML = linkedProductIds.map((id) => `
                <span class="szn-chip">${e(productTitle(id))} <button type="button" data-remove-product="${e(id)}"><i class="fa-solid fa-xmark"></i></button></span>
            `).join("");
            chipsBox.querySelectorAll("[data-remove-product]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    linkedProductIds = linkedProductIds.filter((id) => id !== btn.getAttribute("data-remove-product"));
                    refreshProductChips();
                    document.getElementById("sf-product-select").innerHTML = productOptionsHTML(linkedProductIds);
                });
            });
        }
        refreshProductChips();

        document.getElementById("sf-add-product-btn").addEventListener("click", () => {
            const select = document.getElementById("sf-product-select");
            const id = select.value;
            if (!id || linkedProductIds.includes(id)) return;
            linkedProductIds.push(id);
            refreshProductChips();
            select.innerHTML = productOptionsHTML(linkedProductIds);
        });

        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("sf-banner-image-input").addEventListener("change", async (evt) => {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;
            const label = document.getElementById("sf-banner-upload-label");
            label.textContent = "جاري الرفع...";
            try {
                bannerImage = await window.BoseAdminUI.uploadImageToCloudinary(file);
                refreshBannerImageGrid();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر رفع الصورة", "error");
            } finally {
                evt.target.value = "";
            }
        });

        document.getElementById("season-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("sf-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const id = isEdit ? season.id : document.getElementById("sf-id").value.trim();
            if (!isEdit && !/^[a-z0-9-]+$/.test(id)) {
                window.BoseAdminUI.showToast("المعرّف لازم يكون حروف إنجليزية صغيرة وأرقام وشرطات بس", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ المناسبة";
                return;
            }
            if (!isEdit && currentSeasons.some((s) => s.id === id)) {
                window.BoseAdminUI.showToast("المعرّف ده مستخدم في مناسبة تانية بالفعل", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ المناسبة";
                return;
            }

            const startDate = document.getElementById("sf-start-date").value;
            const endDate = document.getElementById("sf-end-date").value;
            if (startDate && endDate && startDate > endDate) {
                window.BoseAdminUI.showToast("تاريخ البداية لازم يكون قبل تاريخ النهاية", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ المناسبة";
                return;
            }

            const overrideVal = document.getElementById("sf-override").value;
            const manualOverride = overrideVal === "on" ? true : overrideVal === "off" ? false : null;
            const accentColorEnabled = document.getElementById("sf-accent-color-enabled").checked;

            const selectedCategoryIds = Array.from(document.querySelectorAll(".szn-cat-checkbox:checked")).map((cb) => cb.value);

            const payload = {
                id,
                name: document.getElementById("sf-name").value.trim(),
                startDate,
                endDate,
                manualOverride,
                accentColor: accentColorEnabled ? document.getElementById("sf-accent-color").value : "",
                banner: {
                    title: document.getElementById("sf-banner-title").value.trim(),
                    description: document.getElementById("sf-banner-description").value.trim(),
                    cta: document.getElementById("sf-banner-cta").value.trim(),
                    target: document.getElementById("sf-banner-target").value.trim(),
                    image: bannerImage || "",
                },
                badge: {
                    text: document.getElementById("sf-badge-text").value.trim(),
                    icon: document.getElementById("sf-badge-icon").value.trim(),
                },
                linkedCategoryIds: selectedCategoryIds,
                linkedProductIds,
                cartMessage: {
                    enabled: document.getElementById("sf-cart-message-enabled").checked,
                    text: document.getElementById("sf-cart-message-text").value.trim(),
                },
            };

            try {
                if (isEdit) {
                    const idx = currentSeasons.findIndex((s) => s.id === season.id);
                    currentSeasons[idx] = payload;
                } else {
                    currentSeasons.push(payload);
                }
                await persist(isEdit ? "تم تعديل المناسبة" : "تم إضافة المناسبة");
                close();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر حفظ المناسبة", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ المناسبة";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadSeasons() {
        const tbody = document.getElementById("seasons-tbody");
        tbody.innerHTML = `<tr><td colspan="5"><div class="adm-loading-spinner"></div></td></tr>`;
        [currentSeasons, allCategories, allProducts] = await Promise.all([
            window.BoseAdmin.getSeasons(),
            window.BoseAdmin.getAllCategories(),
            window.BoseAdmin.getAllProducts(),
        ]);
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("add-season-btn").addEventListener("click", () => openSeasonModal(null));
        await loadSeasons();
    });
})();
