/**
 * gift-card-faqs-page.js - منطق صفحة الأسئلة الشائعة عن بطاقات الهدايا
 * =====================================================================
 * نفس بنية categories-page.js بالظبط (جدول + مودال إضافة/تعديل)، مع
 * إضافة أزرار ترتيب (أعلى/أسفل) زي مكونات الـ repeater في صفحة "من نحن"،
 * لإن الترتيب هنا (sort_order) هو ترتيب الظهور الفعلي في صفحة العميلة.
 */
(function () {
    "use strict";

    let allFaqs = [];

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("gcf-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!allFaqs.length) {
            tbody.innerHTML = `<tr><td colspan="4">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-circle-question",
                title: "مفيش أسئلة لسه",
                text: "ابدأ بإضافة أول سؤال من زرار \"سؤال جديد\".",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = allFaqs.map((f, idx) => `
            <tr>
                <td>
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <span class="gcf-order-badge">${idx + 1}</span>
                        <div style="display:flex; gap:2px;">
                            <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="up" data-id="${e(f.id)}" title="لأعلى" ${idx === 0 ? "disabled" : ""}>
                                <i class="fa-solid fa-arrow-up"></i>
                            </button>
                            <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="down" data-id="${e(f.id)}" title="لأسفل" ${idx === allFaqs.length - 1 ? "disabled" : ""}>
                                <i class="fa-solid fa-arrow-down"></i>
                            </button>
                        </div>
                    </div>
                </td>
                <td>
                    <strong>${e(f.question)}</strong>
                    <div class="gcf-answer-preview">${e(f.answer)}</div>
                </td>
                <td>
                    <span class="gcf-status-pill ${f.is_published ? "published" : "hidden"}">
                        ${f.is_published ? "منشور" : "مخفي"}
                    </span>
                </td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="toggle" data-id="${e(f.id)}" title="${f.is_published ? "إخفاء" : "نشر"}">
                        <i class="fa-solid ${f.is_published ? "fa-eye-slash" : "fa-eye"}"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-id="${e(f.id)}" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-id="${e(f.id)}" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                const faq = allFaqs.find((f) => f.id === btn.getAttribute("data-id"));
                if (faq) openFaqModal(faq);
            });
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(btn.getAttribute("data-id")));
        });
        tbody.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
            btn.addEventListener("click", () => handleTogglePublish(btn.getAttribute("data-id")));
        });
        tbody.querySelectorAll('[data-action="up"]').forEach((btn) => {
            btn.addEventListener("click", () => handleMove(btn.getAttribute("data-id"), -1));
        });
        tbody.querySelectorAll('[data-action="down"]').forEach((btn) => {
            btn.addEventListener("click", () => handleMove(btn.getAttribute("data-id"), 1));
        });
    }

    async function handleDelete(id) {
        const faq = allFaqs.find((f) => f.id === id);
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الحذف",
            message: `هل أنت متأكد من حذف السؤال "${faq?.question || ""}"؟`,
            confirmLabel: "حذف نهائي",
            danger: true,
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.deleteGiftCardFaq(id, faq?.question);
            window.BoseAdminUI.showToast("تم حذف السؤال", "success");
            await loadFaqs();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر حذف السؤال", "error");
        }
    }

    async function handleTogglePublish(id) {
        const faq = allFaqs.find((f) => f.id === id);
        if (!faq) return;
        try {
            await window.BoseAdmin.updateGiftCardFaq(id, { isPublished: !faq.is_published });
            window.BoseAdminUI.showToast(faq.is_published ? "تم إخفاء السؤال" : "تم نشر السؤال", "success");
            await loadFaqs();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر تحديث حالة النشر", "error");
        }
    }

    async function handleMove(id, direction) {
        const idx = allFaqs.findIndex((f) => f.id === id);
        const targetIdx = idx + direction;
        if (idx === -1 || targetIdx < 0 || targetIdx >= allFaqs.length) return;

        const reordered = allFaqs.slice();
        const [moved] = reordered.splice(idx, 1);
        reordered.splice(targetIdx, 0, moved);

        const updates = reordered.map((f, i) => ({ id: f.id, sort_order: i + 1 }));
        allFaqs = reordered.map((f, i) => ({ ...f, sort_order: i + 1 }));
        renderTable();

        try {
            await window.BoseAdmin.reorderGiftCardFaqs(updates);
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر حفظ الترتيب الجديد", "error");
            await loadFaqs();
        }
    }

    /* ============================= مودال إضافة/تعديل ============================= */

    function openFaqModal(faq) {
        const isEdit = !!faq;
        const e = window.BoseAdminUI.escapeHtml;

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 560px;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل سؤال" : "سؤال جديد"}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form id="gcf-form">
                    <div class="adm-field">
                        <label for="gcf-question">السؤال</label>
                        <input type="text" class="adm-input" id="gcf-question" value="${isEdit ? e(faq.question) : ""}" required>
                    </div>

                    <div class="adm-field">
                        <label for="gcf-answer">الإجابة</label>
                        <textarea class="adm-textarea" id="gcf-answer" rows="4" required>${isEdit ? e(faq.answer) : ""}</textarea>
                    </div>

                    <div class="adm-field">
                        <label class="adm-checkbox-label">
                            <input type="checkbox" id="gcf-is-published" ${!isEdit || faq.is_published ? "checked" : ""}>
                            <span>منشور (يظهر للعميلة)</span>
                        </label>
                    </div>

                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="gcf-save-btn">حفظ السؤال</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }

        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("gcf-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("gcf-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const payload = {
                question: document.getElementById("gcf-question").value.trim(),
                answer: document.getElementById("gcf-answer").value.trim(),
                isPublished: document.getElementById("gcf-is-published").checked,
            };

            try {
                if (isEdit) {
                    await window.BoseAdmin.updateGiftCardFaq(faq.id, payload);
                    window.BoseAdminUI.showToast("تم تعديل السؤال", "success");
                } else {
                    await window.BoseAdmin.addGiftCardFaq(payload);
                    window.BoseAdminUI.showToast("تم إضافة السؤال", "success");
                }
                close();
                await loadFaqs();
            } catch (err) {
                window.BoseAdminUI.showToast(isEdit ? "تعذر تعديل السؤال" : "تعذر إضافة السؤال", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ السؤال";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadFaqs() {
        const tbody = document.getElementById("gcf-tbody");
        tbody.innerHTML = `<tr><td colspan="4"><div class="adm-loading-spinner"></div></td></tr>`;
        allFaqs = await window.BoseAdmin.getAllGiftCardFaqs();
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("add-gcf-btn").addEventListener("click", () => openFaqModal(null));
        await loadFaqs();
    });
})();
