/**
 * daily-page.js - منطق صفحة "يومي" فقط
 * =====================================================================
 * 🆕 [صفحة جديدة]: كانت موجودة في القائمة الجانبية (admin-shell.js، عنصر
 * "يومي" برابط daily.html) من قبل، بس الملف نفسه (daily.html + الصفحة دي)
 * ما كانش موجود خالص - رابط ميت في أول عنصر بأول مجموعة بالقائمة. الصفحة
 * دي بتجمع كل حاجة محتاجة قرار فوري في مكان واحد: طلبات قيد المراجعة +
 * طلبات بانتظار تأكيد العربون + تقييمات بانتظار الاعتماد + تنبيهات سريعة -
 * كلها قابلة للتنفيذ من نفس الشاشة، من غير التنقل بين 3-4 صفحات كل صبح.
 *
 * 🛡️ [أداء - أقل استهلاك بيانات]: كل الاستعلامات هنا اتعملت بالتوازي
 * (Promise.all واحد)، وملخص الإحصائيات بيستخدم window.BoseAdminShared
 * (admin-shell.js) بدل ما يكرر نفس استعلام get_admin_dashboard_stats اللي
 * أصلاً بيتنادى لتحديث شارات القائمة الجانبية في نفس تحميل الصفحة.
 */
(function () {
    "use strict";

    function money(n) {
        return `${Math.round(n || 0).toLocaleString("ar-EG")} ج.م`;
    }

    function formatDate(iso) {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    }

    function starsHTML(rating) {
        const full = Math.max(0, Math.min(5, Math.round(rating || 0)));
        return Array.from({ length: 5 }, (_, i) =>
            `<i class="fa-solid fa-star" style="color: ${i < full ? "var(--adm-gold)" : "var(--adm-border)"}; font-size: 0.75rem;"></i>`
        ).join("");
    }

    function renderStats(summary) {
        const grid = document.getElementById("daily-stats-grid");
        const cards = [
            { icon: "fa-receipt", cls: "pink", label: "طلبات اليوم", value: summary.ordersToday ?? 0 },
            { icon: "fa-sack-dollar", cls: "success", label: "إيراد اليوم", value: money(summary.revenueToday) },
            { icon: "fa-scale-balanced", cls: "info", label: "متوسط قيمة الطلب (30 يوم)", value: money(summary.avgOrderValueMonth) },
        ];
        grid.innerHTML = cards.map((c) => `
            <div class="adm-stat-card">
                <div class="adm-stat-card-text">
                    <span>${c.label}</span>
                    <strong>${c.value}</strong>
                </div>
                <div class="adm-stat-icon ${c.cls}"><i class="fa-solid ${c.icon}"></i></div>
            </div>
        `).join("");
    }

    /** صف عام لطلب (قيد مراجعة أو بانتظار عربون) - نفس تصميم كارت الداشبورد */
    function orderRowHTML(o, actions) {
        const e = window.BoseAdminUI.escapeHtml;
        return `
            <div class="adm-pending-order-row" data-id="${e(o.id)}">
                <div class="adm-pending-order-info">
                    <strong>#${e(o.order_number || o.id)} - ${e(o.customer_name || "—")}</strong>
                    <small>${o.grand_total ? Math.round(o.grand_total) + " ج.م" : "—"} - ${formatDate(o.created_at)}</small>
                </div>
                <div class="adm-pending-order-actions">
                    ${actions}
                    <a href="orders.html?open=${e(o.id)}" class="adm-btn adm-btn-sm adm-btn-outline">
                        <i class="fa-solid fa-eye"></i>
                    </a>
                </div>
            </div>`;
    }

    function renderPendingOrders(orders) {
        const card = document.getElementById("daily-pending-orders-card");
        const list = document.getElementById("daily-pending-orders-list");
        if (!orders.length) { card.style.display = "none"; return; }
        card.style.display = "";
        const e = window.BoseAdminUI.escapeHtml;

        list.innerHTML = orders.map((o) => orderRowHTML(o, `
            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" data-order-action="confirm" data-id="${e(o.id)}">
                <i class="fa-solid fa-check"></i> تأكيد
            </button>
            <button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-order-action="cancel" data-id="${e(o.id)}">
                <i class="fa-solid fa-xmark"></i> إلغاء
            </button>
        `)).join("");

        list.querySelectorAll("[data-order-action]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                const newStatus = btn.getAttribute("data-order-action") === "confirm" ? "confirmed" : "cancelled";
                btn.disabled = true;
                try {
                    await window.BoseAdmin.updateOrderStatus(id, newStatus);
                    window.BoseAdminUI.showToast(newStatus === "confirmed" ? "تم تأكيد الطلب" : "تم إلغاء الطلب", "success");
                    removeRowOrHideCard(list, card, id);
                } catch (e2) {
                    window.BoseAdminUI.showToast("تعذر تحديث حالة الطلب", "error");
                    btn.disabled = false;
                }
            });
        });
    }

    function renderDepositOrders(orders) {
        const card = document.getElementById("daily-deposit-orders-card");
        const list = document.getElementById("daily-deposit-orders-list");
        if (!orders.length) { card.style.display = "none"; return; }
        card.style.display = "";
        const e = window.BoseAdminUI.escapeHtml;

        list.innerHTML = orders.map((o) => orderRowHTML(o, `
            <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" data-deposit-confirm="${e(o.id)}">
                <i class="fa-solid fa-hand-holding-dollar"></i> تأكيد استلام العربون
            </button>
        `)).join("");

        list.querySelectorAll("[data-deposit-confirm]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-deposit-confirm");
                btn.disabled = true;
                try {
                    await window.BoseAdmin.confirmOrderDeposit(id);
                    window.BoseAdminUI.showToast("تم تأكيد استلام العربون والطلب بقى مؤكد", "success");
                    removeRowOrHideCard(list, card, id);
                } catch (e2) {
                    window.BoseAdminUI.showToast("تعذر تأكيد العربون", "error");
                    btn.disabled = false;
                }
            });
        });
    }

    function renderReviews(reviews) {
        const card = document.getElementById("daily-reviews-card");
        const list = document.getElementById("daily-reviews-list");
        if (!reviews.length) { card.style.display = "none"; return; }
        card.style.display = "";
        const e = window.BoseAdminUI.escapeHtml;

        list.innerHTML = reviews.map((r) => `
            <div class="adm-pending-order-row" data-id="${e(r.id)}">
                <div class="adm-pending-order-info">
                    <strong>${e(r.user_name || "—")} - ${starsHTML(r.rating)}</strong>
                    <small>${e(r.products?.title || "منتج محذوف")}${r.comment ? " - " + e(r.comment) : ""}</small>
                </div>
                <div class="adm-pending-order-actions">
                    <button type="button" class="adm-btn adm-btn-sm adm-btn-primary" data-review-action="approve" data-id="${e(r.id)}">
                        <i class="fa-solid fa-check"></i> اعتماد
                    </button>
                    <button type="button" class="adm-btn adm-btn-sm adm-btn-danger" data-review-action="delete" data-id="${e(r.id)}">
                        <i class="fa-solid fa-xmark"></i> رفض
                    </button>
                </div>
            </div>`).join("");

        list.querySelectorAll("[data-review-action]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                const approve = btn.getAttribute("data-review-action") === "approve";
                btn.disabled = true;
                try {
                    if (approve) await window.BoseAdmin.approveReview(id);
                    else await window.BoseAdmin.deleteReview(id);
                    window.BoseAdminUI.showToast(approve ? "تم اعتماد التقييم" : "تم رفض التقييم", "success");
                    removeRowOrHideCard(list, card, id);
                } catch (e2) {
                    window.BoseAdminUI.showToast("تعذر تحديث التقييم", "error");
                    btn.disabled = false;
                }
            });
        });
    }

    /** إزالة صف واحد بعد نجاح الإجراء، ولو مفيش صفوف باقية يخفي الكارت كله */
    function removeRowOrHideCard(list, card, id) {
        const row = list.querySelector(`[data-id="${CSS.escape(id)}"]`);
        if (row) row.remove();
        if (!list.querySelector("[data-id]")) card.style.display = "none";
        maybeShowAllClear();
    }

    /** لو كل الكروت القابلة للتنفيذ اختفت، يظهر كارت "كله تمام" بدل ما الصفحة تفضل فاضية */
    function maybeShowAllClear() {
        const cardsIds = ["daily-pending-orders-card", "daily-deposit-orders-card", "daily-reviews-card", "daily-alerts-card"];
        const anyVisible = cardsIds.some((id) => document.getElementById(id).style.display !== "none");
        document.getElementById("daily-all-clear-card").style.display = anyVisible ? "none" : "";
    }

    function renderAlerts({ missingPhotoCount, unavailableProducts, reviewFollowupsDue, vouchersUnnotified }) {
        const card = document.getElementById("daily-alerts-card");
        const list = document.getElementById("daily-alerts-list");
        const alerts = [];

        if (missingPhotoCount > 0) {
            alerts.push({ icon: "fa-image", cls: "warning", text: `${missingPhotoCount} منتج لسه شايل صورة اللوجو الافتراضية بدل صورة حقيقية`, href: "products.html" });
        }
        if (unavailableProducts > 0) {
            alerts.push({ icon: "fa-ban", cls: "danger", text: `${unavailableProducts} منتج معلّم "غير متاح" حالياً`, href: "products.html" });
        }
        if (reviewFollowupsDue > 0) {
            alerts.push({ icon: "fa-comment-dots", cls: "warning", text: `${reviewFollowupsDue} عميلة مستحقة تذكير بتقييم`, href: "review-followups.html" });
        }
        if (vouchersUnnotified > 0) {
            alerts.push({ icon: "fa-gift", cls: "info", text: `${vouchersUnnotified} قسيمة/بطاقة هدية لسه محدش اتقالها`, href: "voucher-notifications.html" });
        }

        if (!alerts.length) { card.style.display = "none"; maybeShowAllClear(); return; }
        card.style.display = "";
        list.innerHTML = alerts.map((a) => `
            <a href="${a.href}" class="adm-alert-row">
                <div class="adm-stat-icon ${a.cls}" style="width:36px; height:36px; font-size:0.9rem;"><i class="fa-solid ${a.icon}"></i></div>
                <span>${a.text}</span>
                <i class="fa-solid fa-chevron-left"></i>
            </a>
        `).join("");
        maybeShowAllClear();
    }

    async function init() {
        // 🛡️ [أداء] استعلام واحد متوازي لكل حاجة، بدل استدعاءات متتالية بطيئة
        const [summary, pendingOrders, depositOrders, pendingReviews, missingPhotoCount] = await Promise.all([
            window.BoseAdminShared.getDashboardSummary(),
            window.BoseAdmin.getAllOrders({ status: "pending" }),
            window.BoseAdmin.getAllOrders({ status: "awaiting_deposit" }),
            window.BoseAdmin.getAllReviews({ approved: false }),
            window.BoseAdmin.getMissingPhotoProductsCount(),
        ]);

        renderStats(summary);
        renderPendingOrders(pendingOrders);
        renderDepositOrders(depositOrders);
        renderReviews(pendingReviews);
        renderAlerts({
            missingPhotoCount,
            unavailableProducts: summary.unavailableProducts ?? 0,
            reviewFollowupsDue: summary.reviewFollowupsDue ?? 0,
            vouchersUnnotified: summary.vouchersUnnotified ?? 0,
        });

        document.getElementById("daily-approve-all-reviews-btn").addEventListener("click", async () => {
            const ids = Array.from(document.querySelectorAll("#daily-reviews-list [data-id]")).map((el) => el.getAttribute("data-id"));
            if (!ids.length) return;
            const confirmed = await window.BoseAdminUI.confirmAction({
                title: "تأكيد اعتماد جماعي",
                message: `هيتم اعتماد ${ids.length} تقييم وهيظهروا للعملاء فوراً. متأكدة؟`,
                confirmLabel: "اعتماد الكل",
            });
            if (!confirmed) return;
            try {
                await window.BoseAdmin.bulkApproveReviews(ids);
                window.BoseAdminUI.showToast(`تم اعتماد ${ids.length} تقييم`, "success");
                document.getElementById("daily-reviews-card").style.display = "none";
                maybeShowAllClear();
            } catch (e) {
                window.BoseAdminUI.showToast("تعذر اعتماد التقييمات", "error");
            }
        });
    }

    document.addEventListener("BoseAdminReady", init);
})();
