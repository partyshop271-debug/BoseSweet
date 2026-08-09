/**
 * admin-ui-utils.js
 * =====================================================================
 * 🧰 أدوات واجهة مشتركة لكل صفحات اللوحة: توست نجاح/خطأ، مودال تأكيد حذف،
 * ومؤشر تحميل. أي صفحة تحتاج واحدة منهم تستخدمها من هنا بدل ما تعيد كتابتها.
 *
 * ⚠️ أمان: أي نص ممكن يكون جاي من بيانات مستخدم (اسم منتج، اسم عميل...)
 * لازم يتعقّم بـ escapeHtml قبل ما يتحط جوه innerHTML. الدوال هنا بتعمل
 * الـ escape تلقائياً على النصوص اللي بتستقبلها عشان محدش ينسى.
 */

(function () {
    "use strict";

    /* ============================= تعقيم HTML ============================= */

    /**
     * بيحوّل أي نص لنسخة آمنة تتحط جوه innerHTML من غير ما تتفسر كـ HTML.
     * لازم تتستخدم مع أي نص جاي من قاعدة البيانات أو من إدخال مستخدم
     * قبل ما يتحط جوه template string هيتحط في innerHTML.
     */
    function escapeHtml(value) {
        if (value === null || value === undefined) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /* ============================= التوست ============================= */

    function ensureToastStack() {
        let stack = document.querySelector(".adm-toast-stack");
        if (!stack) {
            stack = document.createElement("div");
            stack.className = "adm-toast-stack";
            document.body.appendChild(stack);
        }
        return stack;
    }

    const TOAST_ICONS = { success: "fa-circle-check", error: "fa-circle-exclamation", info: "fa-circle-info" };

    /**
     * @param {string} message
     * @param {"success"|"error"|"info"} type
     */
    function showToast(message, type = "success") {
        const stack = ensureToastStack();
        const toast = document.createElement("div");
        toast.className = `adm-toast ${type}`;
        toast.innerHTML = `<i class="fa-solid ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i><span>${escapeHtml(message)}</span>`;
        stack.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.2s ease";
            setTimeout(() => toast.remove(), 200);
        }, 3200);
    }

    /* ============================= مودال التأكيد ============================= */

    /**
     * بيرجع Promise<boolean> - true لو المستخدم أكّد، false لو ألغى.
     * @param {{title: string, message: string, confirmLabel?: string, danger?: boolean}} opts
     */
    function confirmAction(opts) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "adm-modal-overlay";
            overlay.innerHTML = `
                <div class="adm-modal" style="max-width: 400px;">
                    <div class="adm-modal-header">
                        <h3>${escapeHtml(opts.title)}</h3>
                        <button class="adm-modal-close" data-role="cancel"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <p>${escapeHtml(opts.message)}</p>
                    <div class="adm-modal-actions">
                        <button class="adm-btn adm-btn-ghost" data-role="cancel">إلغاء</button>
                        <button class="adm-btn ${opts.danger ? "adm-btn-danger" : "adm-btn-primary"}" data-role="confirm">
                            ${escapeHtml(opts.confirmLabel || "تأكيد")}
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            function close(result) {
                overlay.remove();
                resolve(result);
            }

            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) close(false);
                const role = e.target.closest("[data-role]")?.getAttribute("data-role");
                if (role === "cancel") close(false);
                if (role === "confirm") close(true);
            });
        });
    }

    /* ============================= مؤشر التحميل ============================= */

    function loadingSpinnerHTML() {
        return '<div class="adm-loading-spinner"></div>';
    }

    function emptyStateHTML({ icon = "fa-box-open", title, text }) {
        return `
            <div class="adm-empty-state">
                <i class="fa-solid ${icon}"></i>
                <strong>${escapeHtml(title)}</strong>
                <p>${escapeHtml(text || "")}</p>
            </div>`;
    }

    window.BoseAdminUI = {
        escapeHtml,
        showToast,
        confirmAction,
        loadingSpinnerHTML,
        emptyStateHTML,
    };
})();