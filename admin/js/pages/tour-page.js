/**
 * tour-page.js - منطق صفحة "الجولة التفاعلية" فقط
 * =====================================================================
 * تبويبين مستقلين في نفس الصفحة:
 * 1) خطوات الجولة: عرض/إضافة/تعديل/حذف/إعادة ترتيب صفوف جدول tour_steps -
 *    ده اللي js/guided-tour.js في الموقع العام بيقرا منه فعليًا (بدل ما
 *    كانت الخطوات Array مكتوبة جوه الكود).
 * 2) إحصائيات الجولة: تجميع أحداث tour_analytics_events في funnel يوضح
 *    فعليًا عند أي خطوة العميلات بيسيبوا الجولة (سواء بضغطة "إنهاء
 *    الجولة" الصريحة، أو بترك الموقع/التبويب فجأة وهم لسه في خطوة معينة).
 */
(function () {
    "use strict";

    // نفس الصفحات اللي فعليًا محمّل فيها js/guided-tour.js في الموقع العام -
    // اختيار صفحة غير موجودة في القايمة دي يعني خطوة مستحيل تظهر أبداً.
    const KNOWN_PAGES = [
        { value: "index.html", label: "الصفحة الرئيسية (index.html)" },
        { value: "menu.html", label: "المنيو (menu.html)" },
        { value: "category.html", label: "صفحة الفئة (category.html)" },
        { value: "product.html", label: "صفحة المنتج (product.html)" },
        { value: "cart.html", label: "السلة (cart.html)" },
        { value: "checkout.html", label: "إتمام الطلب (checkout.html)" },
        { value: "order-success.html", label: "نجاح الطلب (order-success.html)" },
    ];

    let allSteps = [];

    /* ============================================================
       تبويبات
       ============================================================ */
    function initTabs() {
        const buttons = document.querySelectorAll(".tour-tab-btn");
        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                buttons.forEach((b) => b.classList.remove("active"));
                document.querySelectorAll(".tour-tab-panel").forEach((p) => p.classList.remove("active"));
                btn.classList.add("active");
                document.getElementById(`tour-panel-${btn.dataset.tab}`).classList.add("active");
                if (btn.dataset.tab === "analytics") loadAnalytics();
            });
        });
    }

    /* ============================================================
       تبويب 1: خطوات الجولة
       ============================================================ */

    function pageLabel(step) {
        if (step.any_page) return `<span class="adm-badge info">أي صفحة</span>`;
        const firstPage = Array.isArray(step.page) ? step.page[0] : step.page;
        const known = KNOWN_PAGES.find((p) => p.value === firstPage);
        return known ? known.label.replace(/\s*\(.+\)$/, "") : (firstPage || "—");
    }

    function renderStepsTable() {
        const tbody = document.getElementById("tour-steps-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!allSteps.length) {
            tbody.innerHTML = `<tr><td colspan="7">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-route",
                title: "مفيش خطوات جولة مضافة لسه",
                text: "اضغطي \"إضافة خطوة\" لبدء بناء الجولة، أو شغّلي ملف الـ migration اللي فيه كل الخطوات الحالية جاهزة.",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = allSteps.map((s, i) => `
            <tr>
                <td>
                    <div class="tour-reorder-cell">
                        <button type="button" data-action="up" data-id="${e(s.id)}" ${i === 0 ? "disabled" : ""} title="لأعلى"><i class="fa-solid fa-chevron-up"></i></button>
                        <strong>${s.step_order}</strong>
                        <button type="button" data-action="down" data-id="${e(s.id)}" ${i === allSteps.length - 1 ? "disabled" : ""} title="لأسفل"><i class="fa-solid fa-chevron-down"></i></button>
                    </div>
                </td>
                <td>${pageLabel(s)}</td>
                <td><span class="tour-mode-badge ${e(s.mode)}">${s.mode === "click" ? "دوسة" : "شرح"}</span></td>
                <td><span class="tour-selector-code">${e(s.selector)}</span></td>
                <td>${e(s.title)}</td>
                <td>
                    <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-action="toggle-active" data-id="${e(s.id)}"
                            title="${s.is_active ? "إيقاف الخطوة" : "تفعيل الخطوة"}">
                        <i class="fa-solid ${s.is_active ? "fa-toggle-on" : "fa-toggle-off"}" style="color: ${s.is_active ? "var(--adm-success)" : "var(--adm-text-muted)"}; font-size: 1.2rem;"></i>
                    </button>
                </td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-id="${e(s.id)}" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-id="${e(s.id)}" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                const step = allSteps.find((s) => s.id === btn.getAttribute("data-id"));
                if (step) openStepModal(step);
            });
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDeleteStep(btn.getAttribute("data-id")));
        });
        tbody.querySelectorAll('[data-action="toggle-active"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                const step = allSteps.find((s) => s.id === btn.getAttribute("data-id"));
                if (step) handleToggleActive(step.id, !step.is_active);
            });
        });
        tbody.querySelectorAll('[data-action="up"]').forEach((btn) => {
            btn.addEventListener("click", () => handleMove(btn.getAttribute("data-id"), -1));
        });
        tbody.querySelectorAll('[data-action="down"]').forEach((btn) => {
            btn.addEventListener("click", () => handleMove(btn.getAttribute("data-id"), 1));
        });
    }

    async function handleToggleActive(id, isActive) {
        try {
            await window.BoseAdmin.updateTourStep(id, { is_active: isActive });
            const step = allSteps.find((s) => s.id === id);
            if (step) step.is_active = isActive;
            renderStepsTable();
            window.BoseAdminUI.showToast(isActive ? "تم تفعيل الخطوة" : "تم إيقاف الخطوة", "success");
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر تحديث حالة الخطوة", "error");
            await loadSteps();
        }
    }

    async function handleMove(id, direction) {
        const index = allSteps.findIndex((s) => s.id === id);
        const targetIndex = index + direction;
        if (index === -1 || targetIndex < 0 || targetIndex >= allSteps.length) return;

        const reordered = allSteps.slice();
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);

        try {
            await window.BoseAdmin.reorderTourSteps(reordered.map((s) => s.id));
            await loadSteps();
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر تغيير الترتيب", "error");
        }
    }

    async function handleDeleteStep(id) {
        const step = allSteps.find((s) => s.id === id);
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الحذف",
            message: `هل أنت متأكدة من حذف خطوة "${step?.title || "هذه الخطوة"}" نهائيًا؟`,
            confirmLabel: "حذف",
            danger: true,
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.deleteTourStep(id);
            window.BoseAdminUI.showToast("تم حذف الخطوة", "success");
            await loadSteps();
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر حذف الخطوة", "error");
        }
    }

    function openStepModal(step) {
        const isEdit = !!step;
        const e = window.BoseAdminUI.escapeHtml;

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 560px;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل خطوة" : "إضافة خطوة جديدة"}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form id="step-form">
                    <div class="adm-field">
                        <label for="st-any-page">تظهر في</label>
                        <select class="adm-select" id="st-any-page">
                            <option value="0" ${!isEdit || !step.any_page ? "selected" : ""}>صفحة واحدة محددة</option>
                            <option value="1" ${isEdit && step.any_page ? "selected" : ""}>أي صفحة (زي أيقونة السلة)</option>
                        </select>
                    </div>

                    <div class="adm-field" id="st-page-field-wrap">
                        <label for="st-page-file">الصفحة</label>
                        <select class="adm-select" id="st-page-file">
                            ${KNOWN_PAGES.map((p) => `<option value="${e(p.value)}" ${isEdit && Array.isArray(step.page) && step.page[0] === p.value ? "selected" : ""}>${e(p.label)}</option>`).join("")}
                        </select>
                    </div>

                    <div class="adm-field">
                        <label for="st-mode">نوع الخطوة</label>
                        <select class="adm-select" id="st-mode">
                            <option value="click" ${!isEdit || step.mode === "click" ? "selected" : ""}>دوسة (العميلة تدوس على العنصر بنفسها)</option>
                            <option value="info" ${isEdit && step.mode === "info" ? "selected" : ""}>شرح فقط (زرار "التالي")</option>
                        </select>
                    </div>

                    <div class="adm-field">
                        <label for="st-selector">CSS Selector للعنصر الحقيقي</label>
                        <input type="text" class="adm-input" id="st-selector" placeholder="#btn-add-to-cart-master-trigger" value="${isEdit ? e(step.selector) : ""}" required style="direction: ltr; text-align: left;">
                    </div>

                    <div class="adm-field" id="st-hint-field-wrap">
                        <label for="st-hint">تلميح الدوسة (اختياري - لخطوات "دوسة" بس)</label>
                        <input type="text" class="adm-input" id="st-hint" placeholder="دوسي على الزرار الوردي تحت السعر" value="${isEdit && step.hint ? e(step.hint) : ""}">
                    </div>

                    <div class="adm-field">
                        <label for="st-title">العنوان</label>
                        <input type="text" class="adm-input" id="st-title" value="${isEdit ? e(step.title) : ""}" required>
                    </div>

                    <div class="adm-field">
                        <label for="st-body-text">نص الشرح</label>
                        <textarea class="adm-input" id="st-body-text" rows="3" required>${isEdit ? e(step.body_text) : ""}</textarea>
                    </div>

                    <div class="adm-field">
                        <label for="st-delay">تأخير قبل العرض (مللي ثانية - اتركيه 0 لو مش متأكدة)</label>
                        <input type="number" class="adm-input" id="st-delay" value="${isEdit ? (step.delay_before_show || 0) : 0}" min="0">
                    </div>

                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="st-save-btn">حفظ</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        const anyPageSelect = document.getElementById("st-any-page");
        const pageFieldWrap = document.getElementById("st-page-field-wrap");
        const modeSelect = document.getElementById("st-mode");
        const hintFieldWrap = document.getElementById("st-hint-field-wrap");

        function syncVisibility() {
            pageFieldWrap.style.display = anyPageSelect.value === "1" ? "none" : "";
            hintFieldWrap.style.display = modeSelect.value === "click" ? "" : "none";
        }
        anyPageSelect.addEventListener("change", syncVisibility);
        modeSelect.addEventListener("change", syncVisibility);
        syncVisibility();

        function close() { overlay.remove(); }
        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("step-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("st-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const isAnyPage = anyPageSelect.value === "1";
            const mode = modeSelect.value;
            const payload = {
                any_page: isAnyPage,
                page: isAnyPage ? null : [document.getElementById("st-page-file").value],
                mode,
                selector: document.getElementById("st-selector").value.trim(),
                hint: mode === "click" ? (document.getElementById("st-hint").value.trim() || null) : null,
                title: document.getElementById("st-title").value.trim(),
                body_text: document.getElementById("st-body-text").value.trim(),
                delay_before_show: parseInt(document.getElementById("st-delay").value, 10) || 0,
            };

            try {
                if (isEdit) {
                    await window.BoseAdmin.updateTourStep(step.id, payload);
                    window.BoseAdminUI.showToast("تم تعديل الخطوة", "success");
                } else {
                    // خطوة جديدة بتتحط في آخر الترتيب دايمًا
                    const nextOrder = allSteps.length ? Math.max(...allSteps.map((s) => s.step_order)) + 1 : 1;
                    await window.BoseAdmin.createTourStep({ ...payload, step_order: nextOrder, is_active: true });
                    window.BoseAdminUI.showToast("تم إضافة الخطوة", "success");
                }
                close();
                await loadSteps();
            } catch (err) {
                window.BoseAdminUI.showToast(isEdit ? "تعذر تعديل الخطوة" : "تعذر إضافة الخطوة", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ";
            }
        });
    }

    async function loadSteps() {
        const tbody = document.getElementById("tour-steps-tbody");
        tbody.innerHTML = `<tr><td colspan="7"><div class="adm-loading-spinner"></div></td></tr>`;
        allSteps = await window.BoseAdmin.getAllTourSteps();
        renderStepsTable();
    }

    /* ============================================================
       تبويب 2: إحصائيات الجولة
       ============================================================ */

    function sinceIsoForRangeDays(days) {
        if (!days) return null; // كل الفترة
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d.toISOString();
    }

    function dropoffClass(pct) {
        if (pct >= 40) return "high";
        if (pct >= 15) return "mid";
        return "low";
    }

    async function loadAnalytics() {
        const summaryGrid = document.getElementById("tour-summary-grid");
        const funnelWrap = document.getElementById("tour-funnel-wrap");
        summaryGrid.innerHTML = `<div class="adm-loading-spinner"></div>`;
        funnelWrap.innerHTML = `<div class="adm-loading-spinner"></div>`;

        const days = parseInt(document.getElementById("tour-range-select").value, 10);
        const sinceIso = sinceIsoForRangeDays(days);
        const events = await window.BoseAdmin.getTourAnalyticsEvents(sinceIso);

        // ---- ملخص عام ----
        const totalStarts = events.filter((ev) => ev.event_type === "tour_start").length;
        const totalFinishes = events.filter((ev) => ev.event_type === "tour_finish").length;
        const totalExplicitSkips = events.filter((ev) => ev.event_type === "tour_skip").length;
        const totalAbandons = events.filter((ev) => ev.event_type === "tour_abandon").length;
        const completionRate = totalStarts ? Math.round((totalFinishes / totalStarts) * 100) : 0;

        summaryGrid.innerHTML = [
            { icon: "fa-play", cls: "pink", label: "مرات بدء الجولة", value: totalStarts },
            { icon: "fa-flag-checkered", cls: "success", label: "أنهوا الجولة بالكامل", value: totalFinishes },
            { icon: "fa-chart-pie", cls: "info", label: "نسبة إتمام الجولة", value: `${completionRate}%` },
            { icon: "fa-circle-xmark", cls: "warning", label: "ضغطوا \"إنهاء الجولة\"", value: totalExplicitSkips },
            { icon: "fa-door-open", cls: "warning", label: "سابوا الموقع فجأة أثناء خطوة", value: totalAbandons },
        ].map((c) => `
            <div class="adm-stat-card">
                <div class="adm-stat-card-text">
                    <span>${c.label}</span>
                    <strong>${c.value}</strong>
                </div>
                <div class="adm-stat-icon ${c.cls}"><i class="fa-solid ${c.icon}"></i></div>
            </div>
        `).join("");

        // ---- funnel لكل خطوة ----
        // مبني على step_order (رقم ثابت) مش على tour_steps.id، عشان الأحداث
        // القديمة تفضل قابلة للقراءة حتى لو الخطوة اتعدلت أو اتحذفت بعدين -
        // step_title المسجّل وقت الحدث هو مصدر العنوان المعروض هنا، مش
        // الجدول الحالي.
        const viewEvents = events.filter((ev) => ev.event_type === "step_view" && ev.step_order != null);
        if (!viewEvents.length) {
            funnelWrap.innerHTML = window.BoseAdminUI.emptyStateHTML({
                icon: "fa-chart-column",
                title: "مفيش بيانات كفاية في الفترة دي",
                text: "لما عميلات تبدأ تستخدم الجولة فعليًا، هتلاقي هنا بالظبط عند أي خطوة بيسيبوا.",
            });
            return;
        }

        const byStep = new Map(); // step_order -> { title, views, skips, abandons }
        function bump(stepOrder, field, title) {
            if (!byStep.has(stepOrder)) byStep.set(stepOrder, { title: title || `خطوة ${stepOrder}`, views: 0, skips: 0, abandons: 0 });
            const row = byStep.get(stepOrder);
            row[field]++;
            if (title && (!row.title || row.title === `خطوة ${stepOrder}`)) row.title = title;
        }
        events.forEach((ev) => {
            if (ev.step_order == null) return;
            if (ev.event_type === "step_view") bump(ev.step_order, "views", ev.step_title);
            else if (ev.event_type === "tour_skip") bump(ev.step_order, "skips", ev.step_title);
            else if (ev.event_type === "tour_abandon") bump(ev.step_order, "abandons", ev.step_title);
        });

        const orderedSteps = Array.from(byStep.entries()).sort((a, b) => a[0] - b[0]);
        const maxViews = Math.max(...orderedSteps.map(([, row]) => row.views), 1);

        const e = window.BoseAdminUI.escapeHtml;
        const rowsHTML = orderedSteps.map(([stepOrder, row]) => {
            const leftAtStep = row.skips + row.abandons;
            const dropoffPct = row.views ? Math.round((leftAtStep / row.views) * 100) : 0;
            const barPct = Math.round((row.views / maxViews) * 100);
            return `
                <div class="tour-funnel-row">
                    <div>${stepOrder}</div>
                    <div>
                        ${e(row.title)}
                        <div class="tour-funnel-bar-track"><div class="tour-funnel-bar-fill" style="width:${barPct}%"></div></div>
                    </div>
                    <div>${row.views}</div>
                    <div>${row.skips}</div>
                    <div>${row.abandons}</div>
                    <div>${leftAtStep}</div>
                    <div class="tour-funnel-dropoff ${dropoffClass(dropoffPct)}">${dropoffPct}% تركوا هنا</div>
                </div>
            `;
        }).join("");

        funnelWrap.innerHTML = `
            <div class="tour-funnel-row head">
                <div>#</div>
                <div>الخطوة</div>
                <div>شوفتها</div>
                <div>إنهاء صريح</div>
                <div>ترك مفاجئ</div>
                <div>إجمالي تركوا</div>
                <div>نسبة الترك</div>
            </div>
            ${rowsHTML}
        `;
    }

    /* ============================================================
       بدء التشغيل
       ============================================================ */

    document.addEventListener("BoseAdminReady", async () => {
        initTabs();
        document.getElementById("add-step-btn").addEventListener("click", () => openStepModal(null));
        document.getElementById("tour-range-select").addEventListener("change", loadAnalytics);
        await loadSteps();
    });
})();
