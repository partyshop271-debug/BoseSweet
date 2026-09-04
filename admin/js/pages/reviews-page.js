/**
 * reviews-page.js - منطق صفحة التقييمات فقط
 * =====================================================================
 * كل تقييم بييجي من العميل بـ is_approved = false (راجع submitBoseReview في
 * الموقع العام) ومش بيظهر في صفحة المنتج إلا بعد اعتماد صريح من هنا.
 * "رفض" تقييم قيد المراجعة = حذف نهائي (مفيش حالة "مرفوض" منفصلة في القاعدة).
 * تقييم معتمد بالفعل ممكن كمان "إلغاء اعتماده" لو ظهر بعدين إنه غير مناسب،
 * من غير ما يتحذف نهائياً - يرجع لقائمة "قيد المراجعة" بدل ما يضيع.
 */
(function () {
    "use strict";

    let currentReviews = [];
    let selectedIds = new Set();

    function starsHTML(rating) {
        const full = Math.max(0, Math.min(5, Math.round(rating || 0)));
        return Array.from({ length: 5 }, (_, i) =>
            `<i class="fa-solid fa-star" style="color: ${i < full ? "var(--adm-gold)" : "var(--adm-border)"}; font-size: 0.8rem;"></i>`
        ).join("");
    }

    function formatDate(iso) {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function imagesCellHTML(images) {
        const e = window.BoseAdminUI.escapeHtml;
        if (!images || !images.length) return `<span class="adm-order-item-meta">بدون صور</span>`;
        const shown = images.slice(0, 3);
        return `<div style="display:flex; gap:4px;">` +
            shown.map((url) => `<img src="${e(url)}" class="adm-table-thumb" style="width:30px; height:30px;" alt="">`).join("") +
            (images.length > 3 ? `<span class="adm-order-item-meta" style="align-self:center;">+${images.length - 3}</span>` : "") +
            `</div>`;
    }

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("reviews-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!currentReviews.length) {
            tbody.innerHTML = `<tr><td colspan="8">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-star",
                title: "مفيش تقييمات هنا",
                text: "لو فيه تقييمات جديدة من العملاء، هتظهر هنا فوراً.",
            })}</td></tr>`;
            updateBulkBar();
            return;
        }

        tbody.innerHTML = currentReviews.map((r) => `
            <tr>
                <td><input type="checkbox" class="reviews-row-check" data-id="${e(r.id)}" ${selectedIds.has(r.id) ? "checked" : ""}></td>
                <td>${e(r.user_name || "—")}</td>
                <td>${e(r.products?.title || "منتج محذوف")}</td>
                <td>${starsHTML(r.rating)}</td>
                <td style="max-width: 260px; white-space: normal;">${e(r.comment || "—")}</td>
                <td>${imagesCellHTML(r.images)}</td>
                <td>${formatDate(r.created_at)}</td>
                <td class="adm-table-actions">
                    ${r.is_approved
                        ? `<button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="unapprove" data-id="${e(r.id)}" title="إلغاء الاعتماد"><i class="fa-solid fa-rotate-left"></i></button>`
                        : `<button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="approve" data-id="${e(r.id)}" title="اعتماد"><i class="fa-solid fa-check" style="color: var(--adm-success);"></i></button>`
                    }
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-id="${e(r.id)}" title="${r.is_approved ? "حذف" : "رفض وحذف"}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`).join("");

        tbody.querySelectorAll('[data-action="approve"]').forEach((btn) => {
            btn.addEventListener("click", () => handleApprove(btn.getAttribute("data-id")));
        });
        tbody.querySelectorAll('[data-action="unapprove"]').forEach((btn) => {
            btn.addEventListener("click", () => handleUnapprove(btn.getAttribute("data-id")));
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(btn.getAttribute("data-id")));
        });

        tbody.querySelectorAll(".reviews-row-check").forEach((cb) => {
            cb.addEventListener("change", () => {
                const id = cb.getAttribute("data-id");
                if (cb.checked) selectedIds.add(id); else selectedIds.delete(id);
                updateBulkBar();
            });
        });
        updateBulkBar();
    }

    /**
     * 🆕 [تحسين إنتاجية - اعتماد/حذف جماعي]: نفس نمط شريط التحديد الجماعي في
     * صفحة الطلبات بالظبط - يظهر لما تحددي تقييم واحد على الأقل.
     */
    function updateBulkBar() {
        const bar = document.getElementById("reviews-bulk-bar");
        const countEl = document.getElementById("reviews-bulk-count");
        const selectAll = document.getElementById("reviews-select-all");
        if (!bar) return;

        // تنظيف أي id محدد من قبل بقى مش موجود في القائمة الحالية (بعد فلترة/تحديث)
        const visibleIds = new Set(currentReviews.map((r) => r.id));
        Array.from(selectedIds).forEach((id) => { if (!visibleIds.has(id)) selectedIds.delete(id); });

        bar.style.display = selectedIds.size ? "flex" : "none";
        if (countEl) countEl.textContent = `${selectedIds.size} تقييم محدد`;
        if (selectAll) selectAll.checked = currentReviews.length > 0 && selectedIds.size === currentReviews.length;
    }

    async function handleApprove(id) {
        try {
            await window.BoseAdmin.approveReview(id);
            window.BoseAdminUI.showToast("تم اعتماد التقييم وهيظهر للعملاء الآن", "success");
            await loadReviews();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر اعتماد التقييم", "error");
        }
    }

    async function handleUnapprove(id) {
        try {
            await window.BoseAdmin.unapproveReview(id);
            window.BoseAdminUI.showToast("تم إلغاء اعتماد التقييم", "success");
            await loadReviews();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر إلغاء اعتماد التقييم", "error");
        }
    }

    async function handleDelete(id) {
        const review = currentReviews.find((r) => r.id === id);
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الحذف",
            message: `هل أنت متأكد من حذف تقييم "${review?.user_name || "هذا العميل"}"؟ الإجراء ده نهائي.`,
            confirmLabel: "حذف نهائي",
            danger: true,
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.deleteReview(id);
            window.BoseAdminUI.showToast("تم حذف التقييم", "success");
            await loadReviews();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر حذف التقييم", "error");
        }
    }

    /* ============================= التحميل والفلترة ============================= */

    function currentFilterValue() {
        const val = document.getElementById("reviews-status-filter").value;
        if (val === "pending") return { approved: false };
        if (val === "approved") return { approved: true };
        return {};
    }

    async function loadReviews() {
        const tbody = document.getElementById("reviews-tbody");
        tbody.innerHTML = `<tr><td colspan="8"><div class="adm-loading-spinner"></div></td></tr>`;
        currentReviews = await window.BoseAdmin.getAllReviews(currentFilterValue());
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("reviews-status-filter").addEventListener("change", loadReviews);

        document.getElementById("reviews-select-all").addEventListener("change", (e) => {
            if (e.target.checked) currentReviews.forEach((r) => selectedIds.add(r.id));
            else selectedIds.clear();
            renderTable();
        });
        document.getElementById("reviews-bulk-clear-btn").addEventListener("click", () => {
            selectedIds.clear();
            renderTable();
        });
        document.getElementById("reviews-bulk-approve-btn").addEventListener("click", async () => {
            const count = selectedIds.size;
            if (!count) return;
            const confirmed = await window.BoseAdminUI.confirmAction({
                title: "تأكيد اعتماد جماعي",
                message: `هيتم اعتماد ${count} تقييم وهيظهروا للعملاء فوراً. متأكدة؟`,
                confirmLabel: "اعتماد الكل",
            });
            if (!confirmed) return;
            try {
                await window.BoseAdmin.bulkApproveReviews(Array.from(selectedIds));
                window.BoseAdminUI.showToast(`تم اعتماد ${count} تقييم`, "success");
                selectedIds.clear();
                await loadReviews();
            } catch (e) {
                window.BoseAdminUI.showToast("تعذر اعتماد التقييمات المحددة", "error");
            }
        });
        document.getElementById("reviews-bulk-delete-btn").addEventListener("click", async () => {
            const count = selectedIds.size;
            if (!count) return;
            const confirmed = await window.BoseAdminUI.confirmAction({
                title: "تأكيد الحذف الجماعي",
                message: `هيتم حذف ${count} تقييم نهائياً. الإجراء ده مش هينفع يتراجع.`,
                confirmLabel: "حذف نهائي",
                danger: true,
            });
            if (!confirmed) return;
            try {
                await window.BoseAdmin.bulkDeleteReviews(Array.from(selectedIds));
                window.BoseAdminUI.showToast(`تم حذف ${count} تقييم`, "success");
                selectedIds.clear();
                await loadReviews();
            } catch (e) {
                window.BoseAdminUI.showToast("تعذر حذف التقييمات المحددة", "error");
            }
        });

        await loadReviews();
    });
})();