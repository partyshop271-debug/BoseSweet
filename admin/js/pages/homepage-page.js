/**
 * homepage-page.js - منطق صفحة الواجهة الرئيسية فقط
 * =====================================================================
 * نطاق النسخة دي: قوائم المنتجات المختارة (الأكثر مبيعاً / وصل حديثاً /
 * منتجاتنا) وبانرات محاكي التورت والورد - دي الحقول اللي بتتغيّر باستمرار
 * فعلياً. حقول أقل تغيّراً زي نص الهيرو، إحصائيات "الفخر والاعتزاز"،
 * وصور الـ waterfall والفيديوهات مش متضمنة هنا لحد ما تحتاجها.
 *
 * "سلايدر الفئات" على الرئيسية بيتبنى تلقائياً من جدول categories وقت
 * الحفظ (نفس id/title/image/builder_type) - كده الفئات ليها مصدر واحد بس
 * (صفحة categories.html)، ومفيش نسخة تانية تتنسى تتحدّث لوحدها.
 */
(function () {
    "use strict";

    // كل قائمة منتجات مختارة بتتعامل بنفس المنطق بالظبط، فالمصدر الوحيد
    // للتعريف هنا: مفتاح الحقل في homepage.json + عنوان القسم في الواجهة.
    const CURATED_LISTS = [
        { key: "mostSelling", containerId: "list-most-selling", selectId: "select-most-selling" },
        { key: "newArrivals", containerId: "list-new-arrivals", selectId: "select-new-arrivals" },
        { key: "ourProducts", containerId: "list-our-products", selectId: "select-our-products" },
    ];

    let homepageData = {};
    let allProducts = [];
    let allCategories = [];
    // نسخة قابلة للتعديل من كل قائمة (arrays of product ids) بنبني عليها العرض والحفظ
    let curatedState = {};

    function productTitle(id) {
        const p = allProducts.find((p) => p.id === id);
        return p ? p.title : id;
    }

    function productThumb(id) {
        const p = allProducts.find((p) => p.id === id);
        return p && p.images && p.images[0] ? p.images[0] : "";
    }

    /* ============================= قوائم المنتجات المختارة ============================= */

    function renderCuratedList(listDef) {
        const e = window.BoseAdminUI.escapeHtml;
        const container = document.getElementById(listDef.containerId);
        const ids = curatedState[listDef.key] || [];

        if (!ids.length) {
            container.innerHTML = `<p class="adm-order-item-meta" style="padding: 6px 2px;">مفيش منتجات مضافة للقسم ده لسه.</p>`;
        } else {
            container.innerHTML = ids.map((id, idx) => {
                const thumb = productThumb(id);
                return `
                <div class="adm-curated-item" data-idx="${idx}">
                    ${thumb ? `<img src="${e(thumb)}" class="adm-curated-item-thumb" alt="">` : `<div class="adm-curated-item-thumb"></div>`}
                    <span class="adm-curated-item-title">${e(productTitle(id))}</span>
                    <div class="adm-curated-item-actions">
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="up" title="تحريك لأعلى" ${idx === 0 ? "disabled" : ""}>
                            <i class="fa-solid fa-arrow-up"></i>
                        </button>
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="down" title="تحريك لأسفل" ${idx === ids.length - 1 ? "disabled" : ""}>
                            <i class="fa-solid fa-arrow-down"></i>
                        </button>
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="remove" title="إزالة">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>`;
            }).join("");
        }

        container.querySelectorAll("[data-action]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = Number(btn.closest("[data-idx]").getAttribute("data-idx"));
                const action = btn.getAttribute("data-action");
                const list = curatedState[listDef.key];
                if (action === "remove") {
                    list.splice(idx, 1);
                } else if (action === "up" && idx > 0) {
                    [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
                } else if (action === "down" && idx < list.length - 1) {
                    [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]];
                }
                renderCuratedList(listDef);
            });
        });

        refreshCuratedSelect(listDef);
    }

    function refreshCuratedSelect(listDef) {
        const select = document.getElementById(listDef.selectId);
        const e = window.BoseAdminUI.escapeHtml;
        const currentIds = new Set(curatedState[listDef.key] || []);
        const available = allProducts.filter((p) => !currentIds.has(p.id));

        select.innerHTML = `<option value="">اختر منتج لإضافته...</option>` +
            available.map((p) => `<option value="${e(p.id)}">${e(p.title)}</option>`).join("");
    }

    function wireCuratedListControls() {
        CURATED_LISTS.forEach((listDef) => {
            document.getElementById(listDef.selectId).addEventListener("change", (evt) => {
                const id = evt.target.value;
                if (!id) return;
                curatedState[listDef.key].push(id);
                evt.target.value = "";
                renderCuratedList(listDef);
            });
        });
    }

    /* ============================= بانرات المحاكيات ============================= */

    function fillBannerForm(prefix, banner) {
        document.getElementById(`${prefix}-title`).value = banner?.title || "";
        document.getElementById(`${prefix}-description`).value = banner?.description || "";
        document.getElementById(`${prefix}-cta`).value = banner?.cta || "";
        document.getElementById(`${prefix}-target`).value = banner?.target || "";
        document.getElementById(`${prefix}-image-preview`).src = banner?.image || "";
        document.getElementById(`${prefix}-image-preview`).style.display = banner?.image ? "block" : "none";
    }

    function readBannerForm(prefix, existingImage) {
        return {
            title: document.getElementById(`${prefix}-title`).value.trim(),
            description: document.getElementById(`${prefix}-description`).value.trim(),
            cta: document.getElementById(`${prefix}-cta`).value.trim(),
            target: document.getElementById(`${prefix}-target`).value.trim(),
            image: document.getElementById(`${prefix}-image-preview`).getAttribute("data-image") || existingImage || "",
        };
    }

    function wireBannerImageUpload(prefix) {
        document.getElementById(`${prefix}-image-input`).addEventListener("change", async (evt) => {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;
            const label = document.getElementById(`${prefix}-upload-label`);
            const originalLabel = label.textContent;
            label.textContent = "جاري الرفع...";
            try {
                const url = await window.BoseAdminUI.uploadImageToCloudinary(file);
                const preview = document.getElementById(`${prefix}-image-preview`);
                preview.src = url;
                preview.style.display = "block";
                preview.setAttribute("data-image", url);
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر رفع الصورة", "error");
            } finally {
                label.textContent = originalLabel;
                evt.target.value = "";
            }
        });
    }

    /* ============================= الحفظ ============================= */

    /** بيبني سلايدر الفئات تلقائياً من جدول categories - مصدر وحيد، مفيش تكرار يدوي */
    function buildCategoriesSliderFromCategories() {
        return allCategories.map((c) => ({
            id: c.id,
            title: c.title,
            image: c.image || "",
            builderType: c.builder_type || "standard",
        }));
    }

    async function handleSaveAll() {
        const saveBtn = document.getElementById("homepage-save-btn");
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

        try {
            const cakePreviewImg = document.getElementById("cake-image-preview").getAttribute("data-image") || homepageData.cakePreview?.image || "";
            const flowerPreviewImg = document.getElementById("flower-image-preview").getAttribute("data-image") || homepageData.flowerPreview?.image || "";

            const updated = {
                ...homepageData,
                mostSelling: curatedState.mostSelling,
                newArrivals: curatedState.newArrivals,
                ourProducts: curatedState.ourProducts,
                cakePreview: { ...readBannerForm("cake", cakePreviewImg), image: cakePreviewImg },
                flowerPreview: { ...readBannerForm("flower", flowerPreviewImg), image: flowerPreviewImg },
                categoriesSlider: buildCategoriesSliderFromCategories(),
            };

            await window.BoseAdmin.updateHomepageSettings(updated);
            homepageData = updated;
            window.BoseAdminUI.showToast("تم حفظ تعديلات الصفحة الرئيسية", "success");
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر حفظ التعديلات", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ كل التغييرات';
        }
    }

    /* ============================= التحميل ============================= */

    async function init() {
        [homepageData, allProducts, allCategories] = await Promise.all([
            window.BoseAdmin.getHomepageSettings(),
            window.BoseAdmin.getAllProducts(),
            window.BoseAdmin.getAllCategories(),
        ]);

        curatedState = {
            mostSelling: [...(homepageData.mostSelling || [])],
            newArrivals: [...(homepageData.newArrivals || [])],
            ourProducts: [...(homepageData.ourProducts || [])],
        };

        CURATED_LISTS.forEach(renderCuratedList);
        wireCuratedListControls();

        fillBannerForm("cake", homepageData.cakePreview);
        fillBannerForm("flower", homepageData.flowerPreview);
        wireBannerImageUpload("cake");
        wireBannerImageUpload("flower");

        document.getElementById("homepage-save-btn").addEventListener("click", handleSaveAll);
        document.getElementById("homepage-content").style.display = "";
        document.getElementById("homepage-loading").style.display = "none";
    }

    document.addEventListener("BoseAdminReady", init);
})();