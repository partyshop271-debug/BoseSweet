/**
 * homepage-page.js - منطق صفحة الواجهة الرئيسية فقط
 * =====================================================================
 * نطاق النسخة دي: قوائم المنتجات المختارة (الأكثر مبيعاً / وصل حديثاً /
 * منتجاتنا)، بانرات محاكي التورت والورد، شلال المنتجات المتحرك (صوره
 * وسرعته وتشغيله/إيقافه - كل صور الشلال دلوقتي روابط مباشرة بسيطة، مش
 * مربوطة بمنتجات)، والشريط العلوي المتحرك بأعلى الهيدر (رسائله وسرعته
 * وتشغيله/إيقافه). حقول أقل تغيّراً زي نص الهيرو وإحصائيات "الفخر
 * والاعتزاز" والفيديوهات مش متضمنة هنا لحد ما تحتاجها.
 *
 * "سلايدر الفئات" على الرئيسية بيتبنى تلقائياً من جدول categories وقت
 * الحفظ (نفس id/title/image/builder_type) - كده الفئات ليها مصدر واحد بس
 * (صفحة categories.html)، ومفيش نسخة تانية تتنسى تتحدّث لوحدها.
 *
 * ملحوظة مهمة: الشريط العلوي المتحرك مخزّن في عمود منفصل (store_settings.navigation)
 * مش homepage، فبيتحمّل ويتحفظ عبر getNavigationSettings/updateNavigationSettings
 * بشكل مستقل تماماً عن باقي الصفحة - زرار الحفظ الموحّد بيحفظ الاتنين مع بعض.
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

    // مجموعة رسائل جاهزة مرتبطة فعلياً بمنتجات وخدمات الموقع، بتظهر كاقتراحات
    // سريعة للشريط العلوي عشان تسهّل الاختيار بدل الكتابة من الصفر كل مرة.
    const TOPBAR_SUGGESTED_MESSAGES = [
        "صممي تورتة أحلامك بنفسك مع محاكي التورت 🎂",
        "اطلبي تورتتك في خطوة واحدة بس - سريع وسهل ⚡",
        "بوكيهات ورد طازجة مصممة خصيصاً ليكِ 💐",
        "توصيل طازج يومياً لجميع المناطق 🚚",
        "كل حلوياتنا بتتحضر طازة يوم الطلب",
        "جربي الريدفلفت... طعم مختلف تماماً",
        "كوبونات وعروض حصرية تنتظرك 🏷️",
        "برنامج المكافآت: اجمعي نقاط مع كل طلب 🎁",
        "تقدري تتبعي طلبك لحظة بلحظة من صفحة تتبع الطلب",
        "كارت إهداء ورقي فاخر مع كل تورتة مميزة",
        "الديسباسيتو الفاخر... تجربة تستاهل التجربة",
        "صنعناها بحب لتهديها لمن تحب 💕",
    ];

    let homepageData = {};
    let navigationData = {};
    let allProducts = [];
    let allCategories = [];
    // نسخة قابلة للتعديل من كل قائمة (arrays of product ids) بنبني عليها العرض والحفظ
    let curatedState = {};
    // نسخ قابلة للتعديل لصور الشلال (كل عنصر { image, slug? }) ورسائل الشريط العلوي
    let waterfallState = { leftColumnImages: [], rightColumnImages: [] };
    let topBarMessagesState = [];

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

    /* ============================= شلال المنتجات المتحرك ============================= */

    const WATERFALL_COLUMNS = [
        { key: "leftColumnImages", listId: "list-waterfall-left", urlInputId: "waterfall-left-url-input", urlBtnId: "waterfall-left-add-url-btn", uploadInputId: "waterfall-left-image-input", uploadLabelId: "waterfall-left-upload-label", productSelectId: "waterfall-left-product-select", productBtnId: "waterfall-left-add-product-btn" },
        { key: "rightColumnImages", listId: "list-waterfall-right", urlInputId: "waterfall-right-url-input", urlBtnId: "waterfall-right-add-url-btn", uploadInputId: "waterfall-right-image-input", uploadLabelId: "waterfall-right-upload-label", productSelectId: "waterfall-right-product-select", productBtnId: "waterfall-right-add-product-btn" },
    ];

    function renderWaterfallColumn(colDef) {
        const e = window.BoseAdminUI.escapeHtml;
        const container = document.getElementById(colDef.listId);
        const items = waterfallState[colDef.key] || [];

        if (!items.length) {
            container.innerHTML = `<p class="adm-order-item-meta" style="padding: 6px 2px;">مفيش صور مضافة للعمود ده لسه.</p>`;
        } else {
            container.innerHTML = items.map((item, idx) => {
                const img = typeof item === "object" ? item.image : item;
                const linkedSlug = typeof item === "object" ? item.slug : null;
                const linkedProduct = linkedSlug ? allProducts.find((p) => p.slug === linkedSlug) : null;
                // 🛡️ [وضوح الحالة]: كل صورة بتوضح فورًا هل هي مربوطة بمنتج حقيقي (هتبقى
                // قابلة للضغط في الرئيسية) ولا صورة تزيينية بس (مش هتبقى رابط) - بدل ما
                // تكتشف صاحبة المتجر ده متأخر بعد النشر.
                const badge = linkedProduct
                    ? `<span class="adm-badge success" style="margin-inline-start:6px;"><i class="fa-solid fa-link"></i> ${e(linkedProduct.title)}</span>`
                    : `<span class="adm-badge neutral" style="margin-inline-start:6px;">صورة تزيينية - بلا رابط</span>`;
                return `
                <div class="adm-curated-item" data-idx="${idx}">
                    <img src="${e(img)}" class="adm-curated-item-thumb" alt="">
                    <span class="adm-curated-item-title">${badge}</span>
                    <div class="adm-curated-item-actions">
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="up" title="تحريك لأعلى" ${idx === 0 ? "disabled" : ""}>
                            <i class="fa-solid fa-arrow-up"></i>
                        </button>
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="down" title="تحريك لأسفل" ${idx === items.length - 1 ? "disabled" : ""}>
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
                const list = waterfallState[colDef.key];
                if (action === "remove") {
                    list.splice(idx, 1);
                } else if (action === "up" && idx > 0) {
                    [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
                } else if (action === "down" && idx < list.length - 1) {
                    [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]];
                }
                renderWaterfallColumn(colDef);
            });
        });
    }

    /** بيملأ قائمة اختيار المنتج لكل عمود بكل منتجات المتجر (بيانها اسم + معاينة صورة). */
    function refreshWaterfallProductSelect(colDef) {
        const select = document.getElementById(colDef.productSelectId);
        if (!select) return;
        const e = window.BoseAdminUI.escapeHtml;
        select.innerHTML = `<option value="">اختاري منتج لإضافته كصورة قابلة للضغط...</option>` +
            allProducts
                .filter((p) => p.images && p.images[0] && p.slug)
                .map((p) => `<option value="${e(p.slug)}">${e(p.title)}</option>`)
                .join("");
    }

    function addWaterfallImage(colDef, url) {
        const trimmed = (url || "").trim();
        if (!trimmed) return;
        if (!/^https?:\/\//i.test(trimmed)) {
            window.BoseAdminUI.showToast("الرابط لازم يبدأ بـ http:// أو https://", "error");
            return;
        }
        waterfallState[colDef.key].push({ image: trimmed });
        renderWaterfallColumn(colDef);
    }

    function wireWaterfallControls() {
        WATERFALL_COLUMNS.forEach((colDef) => {
            refreshWaterfallProductSelect(colDef);

            // 🛡️ [الطريقة الموصى بيها]: اختيار منتج حقيقي بياخد صورته وسلاجه مع بعض
            // تلقائيًا - أبسط طريقة وأضمن واحدة إن الصورة تبقى فعلاً رابط شغال.
            document.getElementById(colDef.productBtnId).addEventListener("click", () => {
                const select = document.getElementById(colDef.productSelectId);
                const slug = select.value;
                if (!slug) return;
                const product = allProducts.find((p) => p.slug === slug);
                if (!product || !product.images || !product.images[0]) {
                    window.BoseAdminUI.showToast("المنتج ده معندوش صورة متاحة", "error");
                    return;
                }
                waterfallState[colDef.key].push({ image: product.images[0], slug: product.slug });
                renderWaterfallColumn(colDef);
                select.value = "";
            });

            document.getElementById(colDef.urlBtnId).addEventListener("click", () => {
                const input = document.getElementById(colDef.urlInputId);
                addWaterfallImage(colDef, input.value);
                input.value = "";
            });
            document.getElementById(colDef.urlInputId).addEventListener("keydown", (evt) => {
                if (evt.key === "Enter") {
                    evt.preventDefault();
                    document.getElementById(colDef.urlBtnId).click();
                }
            });

            document.getElementById(colDef.uploadInputId).addEventListener("change", async (evt) => {
                const file = evt.target.files && evt.target.files[0];
                if (!file) return;
                const label = document.getElementById(colDef.uploadLabelId);
                const originalLabel = label.textContent;
                label.textContent = "جاري الرفع...";
                try {
                    const url = await window.BoseAdminUI.uploadImageToCloudinary(file);
                    waterfallState[colDef.key].push({ image: url });
                    renderWaterfallColumn(colDef);
                } catch (err) {
                    window.BoseAdminUI.showToast("تعذر رفع الصورة", "error");
                } finally {
                    label.textContent = originalLabel;
                    evt.target.value = "";
                }
            });
        });
    }

    /* ============================= الشريط العلوي المتحرك ============================= */

    function renderTopBarMessages() {
        const e = window.BoseAdminUI.escapeHtml;
        const container = document.getElementById("list-topbar-messages");

        if (!topBarMessagesState.length) {
            container.innerHTML = `<p class="adm-order-item-meta" style="padding: 6px 2px;">مفيش رسائل مضافة لسه.</p>`;
        } else {
            container.innerHTML = topBarMessagesState.map((msg, idx) => `
                <div class="adm-curated-item" data-idx="${idx}">
                    <span class="adm-curated-item-title">${e(msg)}</span>
                    <div class="adm-curated-item-actions">
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="up" title="تحريك لأعلى" ${idx === 0 ? "disabled" : ""}>
                            <i class="fa-solid fa-arrow-up"></i>
                        </button>
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="down" title="تحريك لأسفل" ${idx === topBarMessagesState.length - 1 ? "disabled" : ""}>
                            <i class="fa-solid fa-arrow-down"></i>
                        </button>
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="remove" title="إزالة">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>`).join("");
        }

        container.querySelectorAll("[data-action]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = Number(btn.closest("[data-idx]").getAttribute("data-idx"));
                const action = btn.getAttribute("data-action");
                if (action === "remove") {
                    topBarMessagesState.splice(idx, 1);
                } else if (action === "up" && idx > 0) {
                    [topBarMessagesState[idx - 1], topBarMessagesState[idx]] = [topBarMessagesState[idx], topBarMessagesState[idx - 1]];
                } else if (action === "down" && idx < topBarMessagesState.length - 1) {
                    [topBarMessagesState[idx + 1], topBarMessagesState[idx]] = [topBarMessagesState[idx], topBarMessagesState[idx + 1]];
                }
                renderTopBarMessages();
            });
        });

        renderTopBarSuggestions();
    }

    function addTopBarMessage(text) {
        const trimmed = (text || "").trim();
        if (!trimmed) return;
        if (topBarMessagesState.includes(trimmed)) {
            window.BoseAdminUI.showToast("الرسالة دي مضافة بالفعل", "error");
            return;
        }
        topBarMessagesState.push(trimmed);
        renderTopBarMessages();
    }

    function renderTopBarSuggestions() {
        const e = window.BoseAdminUI.escapeHtml;
        const container = document.getElementById("topbar-suggestions");
        container.innerHTML = TOPBAR_SUGGESTED_MESSAGES.map((msg) => {
            const alreadyAdded = topBarMessagesState.includes(msg);
            return `<button type="button" class="adm-suggestion-chip" data-suggestion="${e(msg)}" ${alreadyAdded ? "disabled" : ""}>
                ${alreadyAdded ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i>'} ${e(msg)}
            </button>`;
        }).join("");

        container.querySelectorAll("[data-suggestion]").forEach((chip) => {
            chip.addEventListener("click", () => addTopBarMessage(chip.getAttribute("data-suggestion")));
        });
    }

    function wireTopBarControls() {
        document.getElementById("topbar-add-message-btn").addEventListener("click", () => {
            const input = document.getElementById("topbar-new-message");
            addTopBarMessage(input.value);
            input.value = "";
        });
        document.getElementById("topbar-new-message").addEventListener("keydown", (evt) => {
            if (evt.key === "Enter") {
                evt.preventDefault();
                document.getElementById("topbar-add-message-btn").click();
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

            const waterfallSpeed = Number(document.getElementById("waterfall-speed").value) || 57.2;
            const waterfallEnabled = document.getElementById("waterfall-enabled").checked;

            const updated = {
                ...homepageData,
                mostSelling: curatedState.mostSelling,
                newArrivals: curatedState.newArrivals,
                ourProducts: curatedState.ourProducts,
                cakePreview: { ...readBannerForm("cake", cakePreviewImg), image: cakePreviewImg },
                flowerPreview: { ...readBannerForm("flower", flowerPreviewImg), image: flowerPreviewImg },
                categoriesSlider: buildCategoriesSliderFromCategories(),
                waterfall: {
                    ...(homepageData.waterfall || {}),
                    leftColumnImages: waterfallState.leftColumnImages,
                    rightColumnImages: waterfallState.rightColumnImages,
                    speedSeconds: waterfallSpeed,
                    enabled: waterfallEnabled,
                },
            };

            const updatedNavigation = {
                ...navigationData,
                topBarMessages: topBarMessagesState,
                topBarSpeedSeconds: Number(document.getElementById("topbar-speed").value) || 44,
                topBarEnabled: document.getElementById("topbar-enabled").checked,
            };

            await Promise.all([
                window.BoseAdmin.updateHomepageSettings(updated),
                window.BoseAdmin.updateNavigationSettings(updatedNavigation),
            ]);
            homepageData = updated;
            navigationData = updatedNavigation;
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
        [homepageData, navigationData, allProducts, allCategories] = await Promise.all([
            window.BoseAdmin.getHomepageSettings(),
            window.BoseAdmin.getNavigationSettings(),
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

        // شلال المنتجات المتحرك
        waterfallState = {
            leftColumnImages: [...(homepageData.waterfall?.leftColumnImages || [])],
            rightColumnImages: [...(homepageData.waterfall?.rightColumnImages || [])],
        };
        document.getElementById("waterfall-speed").value = homepageData.waterfall?.speedSeconds ?? 57.2;
        document.getElementById("waterfall-enabled").checked = homepageData.waterfall?.enabled !== false;
        WATERFALL_COLUMNS.forEach(renderWaterfallColumn);
        wireWaterfallControls();

        // الشريط العلوي المتحرك
        topBarMessagesState = [...(navigationData.topBarMessages || [])];
        document.getElementById("topbar-speed").value = navigationData.topBarSpeedSeconds ?? 44;
        document.getElementById("topbar-enabled").checked = navigationData.topBarEnabled !== false;
        renderTopBarMessages();
        wireTopBarControls();

        document.getElementById("homepage-save-btn").addEventListener("click", handleSaveAll);
        document.getElementById("homepage-content").style.display = "";
        document.getElementById("homepage-loading").style.display = "none";
    }

    document.addEventListener("BoseAdminReady", init);
})();