/**
 * about-page.js - منطق صفحة "من نحن" فقط
 * =====================================================================
 * كل محتوى الصفحة (الهيرو، الإحصائيات، بلوكات القصة، معرض الصور، وقيم
 * العلامة التجارية) متخزن في عمود واحد store_settings.about، بنفس فلسفة
 * homepage/loyalty بالظبط - حفظ واحد بيستبدل العمود كله، فأي حقل مش
 * موجود في الفورم هنا (مفيش حالياً) لازم يترجع زي ما هو من الكائن الأصلي
 * وقت الحفظ عشان متتمسحش.
 *
 * الأربع قوائم (stats/storyBlocks/gallery/pillars) بتتعدّل محلياً كمصفوفات
 * قابلة للتعديل مباشرة (زي منطق waterfall في homepage-page.js) - كل تغيير
 * في حقل بيعدّل على الـ object جوه المصفوفة فورًا، وزرار الحفظ الموحّد
 * بيبعت النسخة النهائية كاملة.
 */
(function () {
    "use strict";

    let aboutData = {};

    // نسخ قابلة للتعديل من كل قائمة
    let statsState = [];
    let storyState = [];
    let galleryState = [];
    let pillarsState = [];

    const e = (v) => (window.BoseAdminUI ? window.BoseAdminUI.escapeHtml(v) : String(v == null ? "" : v));

    function repeaterCardShell(idx, total, bodyHtml) {
        return `
        <div class="adm-repeater-card" data-idx="${idx}">
            <div class="adm-repeater-card-header">
                <strong>عنصر ${idx + 1}</strong>
                <div class="adm-repeater-card-actions">
                    <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="up" title="تحريك لأعلى" ${idx === 0 ? "disabled" : ""}>
                        <i class="fa-solid fa-arrow-up"></i>
                    </button>
                    <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="down" title="تحريك لأسفل" ${idx === total - 1 ? "disabled" : ""}>
                        <i class="fa-solid fa-arrow-down"></i>
                    </button>
                    <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="remove" title="حذف">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            ${bodyHtml}
        </div>`;
    }

    /** بتوصل أزرار أعلى/أسفل/حذف بأي قائمة + بتربط أي حقل عليه data-field بتعديل مباشر في الـ item */
    function wireRepeaterCommon(containerId, list, renderFn) {
        const container = document.getElementById(containerId);
        container.querySelectorAll("[data-idx]").forEach((card) => {
            const idx = Number(card.getAttribute("data-idx"));

            card.querySelectorAll("[data-field]").forEach((input) => {
                const field = input.getAttribute("data-field");
                input.addEventListener("input", () => {
                    list[idx][field] = input.value;
                });
            });

            card.querySelectorAll("[data-action]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const action = btn.getAttribute("data-action");
                    if (action === "remove") {
                        list.splice(idx, 1);
                    } else if (action === "up" && idx > 0) {
                        [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
                    } else if (action === "down" && idx < list.length - 1) {
                        [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]];
                    }
                    renderFn();
                });
            });
        });
    }

    /* ============================= الإحصائيات ============================= */

    function renderStats() {
        const container = document.getElementById("about-stats-list");
        if (!statsState.length) {
            container.innerHTML = `<p class="adm-order-item-meta" style="padding: 6px 2px;">مفيش إحصائيات مضافة لسه.</p>`;
        } else {
            container.innerHTML = statsState.map((item, idx) => repeaterCardShell(idx, statsState.length, `
                <div class="adm-form-grid">
                    <div class="adm-field">
                        <label>الرقم</label>
                        <input type="text" class="adm-input" data-field="number" value="${e(item.number || "")}" placeholder="10,000+">
                    </div>
                    <div class="adm-field">
                        <label>الوصف</label>
                        <input type="text" class="adm-input" data-field="label" value="${e(item.label || "")}" placeholder="عميلة سعيدة">
                    </div>
                    <div class="adm-field">
                        <label>أيقونة (اختياري)</label>
                        <input type="text" class="adm-input" data-field="icon" value="${e(item.icon || "")}" placeholder="fa-heart">
                    </div>
                </div>`)).join("");
        }
        wireRepeaterCommon("about-stats-list", statsState, renderStats);
    }

    /* ============================= بلوكات القصة ============================= */

    function readParagraphs(text) {
        return String(text || "")
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean);
    }

    function renderStoryBlocks() {
        const container = document.getElementById("about-story-list");
        if (!storyState.length) {
            container.innerHTML = `<p class="adm-order-item-meta" style="padding: 6px 2px;">مفيش بلوكات قصة مضافة لسه.</p>`;
        } else {
            container.innerHTML = storyState.map((item, idx) => repeaterCardShell(idx, storyState.length, `
                <div class="adm-form-grid">
                    <div class="adm-field">
                        <label>عنوان البلوك</label>
                        <input type="text" class="adm-input" data-field="title" value="${e(item.title || "")}" placeholder="بداية الحكاية">
                    </div>
                    <div class="adm-field">
                        <label>أيقونة (اختياري)</label>
                        <input type="text" class="adm-input" data-field="icon" value="${e(item.icon || "")}" placeholder="fa-seedling">
                    </div>
                </div>
                <div class="adm-field">
                    <label>مقدمة قصيرة (اختياري - سطر واحد قبل النص)</label>
                    <input type="text" class="adm-input" data-field="intro" value="${e(item.intro || "")}">
                </div>
                <div class="adm-field">
                    <label>اقتباس مميز (اختياري - بيظهر في كارت منفصل داخل البلوك)</label>
                    <input type="text" class="adm-input" data-field="quote" value="${e(item.quote || "")}">
                </div>
                <div class="adm-field">
                    <label>فقرات النص</label>
                    <p class="adm-hint" style="margin-bottom:6px;">كل سطر هنا بيتحوّل لفقرة مستقلة في الصفحة (سطر جديد = فقرة جديدة).</p>
                    <textarea class="adm-textarea" data-field="__paragraphs" style="min-height:120px;">${e((item.paragraphs || []).join("\n"))}</textarea>
                </div>`)).join("");
        }

        wireRepeaterCommon("about-story-list", storyState, renderStoryBlocks);

        // حقل الفقرات معامل خاص (بيتحول من نص سطور لمصفوفة) بدل التعديل المباشر العادي
        container.querySelectorAll('[data-field="__paragraphs"]').forEach((textarea) => {
            const idx = Number(textarea.closest("[data-idx]").getAttribute("data-idx"));
            textarea.addEventListener("input", () => {
                storyState[idx].paragraphs = readParagraphs(textarea.value);
            });
        });
    }

    function addStoryBlock() {
        storyState.push({ icon: "", title: "", intro: "", quote: "", paragraphs: [] });
        renderStoryBlocks();
    }

    /* ============================= معرض الصور ============================= */

    function renderGallery() {
        const container = document.getElementById("about-gallery-list");
        if (!galleryState.length) {
            container.innerHTML = `<p class="adm-order-item-meta" style="padding: 6px 2px;">مفيش صور مضافة للمعرض لسه.</p>`;
        } else {
            container.innerHTML = galleryState.map((item, idx) => `
                <div class="adm-curated-item" data-idx="${idx}">
                    <img src="${e(item.image)}" class="adm-curated-item-thumb" alt="">
                    <input type="text" class="adm-input" data-field="caption" value="${e(item.caption || "")}" placeholder="وصف الصورة (اختياري)" style="flex:1;">
                    <div class="adm-curated-item-actions">
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="up" title="تحريك لأعلى" ${idx === 0 ? "disabled" : ""}>
                            <i class="fa-solid fa-arrow-up"></i>
                        </button>
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="down" title="تحريك لأسفل" ${idx === galleryState.length - 1 ? "disabled" : ""}>
                            <i class="fa-solid fa-arrow-down"></i>
                        </button>
                        <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="remove" title="إزالة">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>`).join("");
        }
        wireRepeaterCommon("about-gallery-list", galleryState, renderGallery);
    }

    function wireGalleryUpload() {
        document.getElementById("about-gallery-image-input").addEventListener("change", async (evt) => {
            const file = evt.target.files && evt.target.files[0];
            if (!file) return;
            const label = document.getElementById("about-gallery-upload-label");
            const originalLabel = label.textContent;
            label.textContent = "جاري الرفع...";
            try {
                const url = await window.BoseAdminUI.uploadImageToCloudinary(file);
                galleryState.push({ image: url, caption: "" });
                renderGallery();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر رفع الصورة", "error");
            } finally {
                label.textContent = originalLabel;
                evt.target.value = "";
            }
        });
    }

    /* ============================= قيم العلامة التجارية ============================= */

    function renderPillars() {
        const container = document.getElementById("about-pillars-list");
        if (!pillarsState.length) {
            container.innerHTML = `<p class="adm-order-item-meta" style="padding: 6px 2px;">مفيش قيم مضافة لسه.</p>`;
        } else {
            container.innerHTML = pillarsState.map((item, idx) => repeaterCardShell(idx, pillarsState.length, `
                <div class="adm-form-grid">
                    <div class="adm-field">
                        <label>العنوان</label>
                        <input type="text" class="adm-input" data-field="title" value="${e(item.title || "")}" placeholder="الجودة الفاخرة">
                    </div>
                    <div class="adm-field">
                        <label>أيقونة (اختياري)</label>
                        <input type="text" class="adm-input" data-field="icon" value="${e(item.icon || "")}" placeholder="fa-gem">
                    </div>
                </div>
                <div class="adm-field">
                    <label>النص</label>
                    <textarea class="adm-textarea" data-field="text">${e(item.text || "")}</textarea>
                </div>`)).join("");
        }
        wireRepeaterCommon("about-pillars-list", pillarsState, renderPillars);
    }

    /* ============================= الحفظ ============================= */

    async function handleSave() {
        const saveBtn = document.getElementById("about-save-btn");
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

        try {
            const updated = {
                ...aboutData,
                heroBadge: document.getElementById("about-hero-badge").value.trim(),
                heroTitlePrefix: document.getElementById("about-hero-title-prefix").value.trim(),
                heroTitleHighlight: document.getElementById("about-hero-title-highlight").value.trim(),
                heroSubtitle: document.getElementById("about-hero-subtitle").value.trim(),
                stats: statsState,
                storyBlocks: storyState,
                gallery: galleryState,
                pillars: pillarsState,
            };

            await window.BoseAdmin.saveAboutPageSettings(updated);
            aboutData = updated;
            window.BoseAdminUI.showToast("تم حفظ تعديلات صفحة من نحن", "success");
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر حفظ التعديلات", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ كل التغييرات';
        }
    }

    /* ============================= التحميل ============================= */

    async function init() {
        aboutData = await window.BoseAdmin.getAboutPageSettings();

        document.getElementById("about-hero-badge").value = aboutData.heroBadge || "";
        document.getElementById("about-hero-title-prefix").value = aboutData.heroTitlePrefix || "";
        document.getElementById("about-hero-title-highlight").value = aboutData.heroTitleHighlight || "";
        document.getElementById("about-hero-subtitle").value = aboutData.heroSubtitle || "";

        statsState = [...(aboutData.stats || [])];
        storyState = (aboutData.storyBlocks || []).map((b) => ({ ...b, paragraphs: [...(b.paragraphs || [])] }));
        galleryState = [...(aboutData.gallery || [])];
        pillarsState = [...(aboutData.pillars || [])];

        renderStats();
        renderStoryBlocks();
        renderGallery();
        renderPillars();
        wireGalleryUpload();

        document.getElementById("about-add-stat-btn").addEventListener("click", () => {
            statsState.push({ icon: "", number: "", label: "" });
            renderStats();
        });
        document.getElementById("about-add-story-btn").addEventListener("click", addStoryBlock);
        document.getElementById("about-add-pillar-btn").addEventListener("click", () => {
            pillarsState.push({ icon: "", title: "", text: "" });
            renderPillars();
        });

        document.getElementById("about-save-btn").addEventListener("click", handleSave);
        document.getElementById("about-content").style.display = "";
        document.getElementById("about-loading").style.display = "none";
    }

    document.addEventListener("BoseAdminReady", init);
})();
