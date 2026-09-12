/**
 * loyalty-vouchers-page.js - منطق صفحة القسائم الصادرة فقط
 * =====================================================================
 * قائمة عرض فقط (القسائم بتتصدر تلقائياً من القاعدة عبر trigger عند
 * التسليم - مفيش إنشاء يدوي هنا). البحث والفلترة بيتصفوا محلياً بعد
 * التحميل عشان فلتر "الحالة" (نشطة/اتصرفت/منتهية) محسوب مش عمود مباشر.
 */
/**
 * loyalty-vouchers-page.js - منطق صفحة القسائم الصادرة
 * =====================================================================
 * القسائم بتتصدر تلقائياً من القاعدة عبر trigger عند التسليم (كل ١٢ طلب).
 * 🎁 [إصدار يدوي + إلغاء]: زودنا إمكانية إصدار قسيمة يدوي (تعويض عميلة،
 * مكافأة استثنائية) وإلغاء قسيمة موجودة (بتصفير رصيدها المتبقي) - الاتنين
 * بيتفذوا عبر issueLoyaltyVoucher/revokeLoyaltyVoucher في admin-data.js.
 */
(function () {
    "use strict";

    let allVouchers = [];
    let defaultVoucherAmount = 300;
    let defaultValidityMonths = 2;

    function formatDate(iso) {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function money(n) {
        return `${Math.round(n || 0).toLocaleString("ar-EG")} ج.م`;
    }

    function voucherStatus(v) {
        if (parseFloat(v.remaining_amount) <= 0) return "used";
        if (new Date(v.expires_at) <= new Date()) return "expired";
        return "active";
    }

    function statusBadgeHTML(status) {
        if (status === "used") return '<span class="adm-badge neutral">اتصرفت بالكامل</span>';
        if (status === "expired") return '<span class="adm-badge danger">منتهية الصلاحية</span>';
        return '<span class="adm-badge success">نشطة</span>';
    }

    /* ============================= بطاقات الملخص ============================= */

    function renderStats() {
        const grid = document.getElementById("lv-stats-grid");
        const active = allVouchers.filter((v) => voucherStatus(v) === "active");
        const used = allVouchers.filter((v) => voucherStatus(v) === "used");
        const expired = allVouchers.filter((v) => voucherStatus(v) === "expired");
        const spentTotal = allVouchers.reduce((sum, v) => sum + (parseFloat(v.amount || 0) - parseFloat(v.remaining_amount || 0)), 0);

        const cards = [
            { icon: "fa-gift", cls: "pink", label: "إجمالي القسائم الصادرة", value: allVouchers.length },
            { icon: "fa-circle-check", cls: "success", label: "نشطة حالياً", value: active.length },
            { icon: "fa-hourglass-end", cls: "warning", label: "منتهية الصلاحية", value: expired.length },
            { icon: "fa-sack-dollar", cls: "gold", label: "إجمالي المصروف من القسائم", value: money(spentTotal) },
        ];
        grid.innerHTML = cards.map((c) => `
            <div class="adm-stat-card">
                <div class="adm-stat-card-text">
                    <span>${c.label}</span>
                    <strong>${window.BoseAdminUI.escapeHtml(String(c.value))}</strong>
                </div>
                <div class="adm-stat-icon ${c.cls}"><i class="fa-solid ${c.icon}"></i></div>
            </div>
        `).join("");
    }

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("lv-tbody");
        const e = window.BoseAdminUI.escapeHtml;
        const search = document.getElementById("lv-search-input").value.trim().toLowerCase();
        const statusFilter = document.getElementById("lv-status-filter").value;

        let rows = allVouchers;
        if (search) {
            rows = rows.filter((v) => (v.code || "").toLowerCase().includes(search) || (v.phone || "").includes(search));
        }
        if (statusFilter) {
            rows = rows.filter((v) => voucherStatus(v) === statusFilter);
        }

        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="10">${window.BoseAdminUI.emptyStateHTML({ icon: "fa-gift", title: "مفيش قسائم مطابقة", text: "جربي تغيير البحث أو الفلتر" })}</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map((v) => {
            const status = voucherStatus(v);
            const canRevoke = status === "active";
            return `
            <tr>
                <td class="lv-code">${e(v.code)}</td>
                <td style="direction:ltr; text-align:right;">${e(v.phone)}</td>
                <td>${money(v.amount)}</td>
                <td>${money(v.remaining_amount)}</td>
                <td>${v.earned_order ? e(v.earned_order.order_number) : `<span class="adm-order-item-meta">صدرت يدوي</span>`}</td>
                <td>${v.last_used_order ? e(v.last_used_order.order_number) : "—"}</td>
                <td>${formatDate(v.issued_at)}</td>
                <td>${formatDate(v.expires_at)}</td>
                <td>${statusBadgeHTML(status)}</td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-id="${e(v.id)}" title="تعديل الرصيد أو تاريخ الانتهاء"><i class="fa-solid fa-pen"></i></button>
                    ${canRevoke ? `<button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="revoke" data-id="${e(v.id)}" title="إلغاء القسيمة"><i class="fa-solid fa-ban"></i></button>` : ""}
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => openEditModal(btn.getAttribute("data-id")));
        });
        tbody.querySelectorAll('[data-action="revoke"]').forEach((btn) => {
            btn.addEventListener("click", () => handleRevoke(btn.getAttribute("data-id")));
        });
    }

    async function handleRevoke(voucherId) {
        const voucher = allVouchers.find((v) => v.id === voucherId);
        if (!voucher) return;
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "إلغاء القسيمة",
            message: `هيتصفّر رصيد القسيمة "${voucher.code}" (${money(voucher.remaining_amount)} متبقي) نهائياً ومش هترجع تشتغل تاني. الإجراء ده لا يمكن التراجع عنه.`,
            confirmLabel: "إلغاء القسيمة",
            danger: true,
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.revokeLoyaltyVoucher(voucherId);
            window.BoseAdminUI.showToast("تم إلغاء القسيمة", "success");
            await loadVouchers();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر إلغاء القسيمة", "error");
        }
    }

    /* ============================= مودال التعديل ============================= */

    function openEditModal(voucherId) {
        const voucher = allVouchers.find((v) => v.id === voucherId);
        if (!voucher) return;

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        const currentExpiryValue = voucher.expires_at ? new Date(voucher.expires_at).toISOString().slice(0, 10) : "";

        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 440px;">
                <div class="adm-modal-header">
                    <h3>تعديل القسيمة ${window.BoseAdminUI.escapeHtml(voucher.code)}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <p style="font-size:0.82rem; color: var(--adm-text-muted, #7a7a7a); margin: 0 0 14px;">
                    الكود ورقم الموبايل والقيمة الأصلية ثابتين ومينفعش يتغيّروا - تقدري بس تعدّلي الرصيد المتبقي وتاريخ الانتهاء.
                </p>
                <form id="lv-edit-form">
                    <div class="adm-field">
                        <label for="lv-ef-remaining">الرصيد المتبقي (جنيه) - من أصل ${money(voucher.amount)}</label>
                        <input type="number" min="0" max="${voucher.amount}" step="1" class="adm-input" id="lv-ef-remaining" value="${voucher.remaining_amount}" required>
                    </div>
                    <div class="adm-field">
                        <label for="lv-ef-expires">تاريخ الانتهاء</label>
                        <input type="date" class="adm-input" id="lv-ef-expires" value="${currentExpiryValue}" required>
                    </div>
                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="lv-ef-save-btn">حفظ التعديل</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }
        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("lv-edit-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("lv-ef-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const remainingRaw = document.getElementById("lv-ef-remaining").value;
            const expiresRaw = document.getElementById("lv-ef-expires").value;
            const remainingAmount = parseFloat(remainingRaw);

            if (isNaN(remainingAmount) || remainingAmount < 0 || remainingAmount > voucher.amount) {
                window.BoseAdminUI.showToast(`الرصيد لازم يكون بين 0 و${voucher.amount}`, "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ التعديل";
                return;
            }

            try {
                await window.BoseAdmin.updateLoyaltyVoucher(voucherId, {
                    remainingAmount,
                    expiresAt: new Date(`${expiresRaw}T23:59:59`).toISOString(),
                });
                window.BoseAdminUI.showToast("تم تعديل القسيمة", "success");
                close();
                await loadVouchers();
            } catch (err) {
                window.BoseAdminUI.showToast(err.message || "تعذر حفظ التعديل", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ التعديل";
            }
        });
    }

    /* ============================= مودال الإصدار اليدوي ============================= */

    function openIssueModal() {
        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        const defaultExpiry = new Date();
        defaultExpiry.setMonth(defaultExpiry.getMonth() + defaultValidityMonths);
        const defaultExpiryValue = defaultExpiry.toISOString().slice(0, 10);

        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 460px;">
                <div class="adm-modal-header">
                    <h3>إصدار قسيمة يدوي</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form id="lv-issue-form">
                    <div class="adm-field">
                        <label for="lv-if-phone">رقم موبايل العميل</label>
                        <input type="tel" class="adm-input" id="lv-if-phone" style="direction:ltr;" placeholder="01012345678" required>
                    </div>
                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="lv-if-amount">قيمة القسيمة (جنيه)</label>
                            <input type="number" min="1" step="1" class="adm-input" id="lv-if-amount" value="${defaultVoucherAmount}" required>
                        </div>
                        <div class="adm-field">
                            <label for="lv-if-expires">تاريخ الانتهاء</label>
                            <input type="date" class="adm-input" id="lv-if-expires" value="${defaultExpiryValue}" required>
                            <span class="adm-hint">افتراضياً ${defaultValidityMonths} شهر من دلوقتي (زي إعدادات الولاء)</span>
                        </div>
                    </div>
                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="lv-if-save-btn">إصدار القسيمة</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }
        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("lv-issue-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("lv-if-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الإصدار...";

            const phone = document.getElementById("lv-if-phone").value.trim();
            const amount = parseFloat(document.getElementById("lv-if-amount").value) || 0;
            const expiresRaw = document.getElementById("lv-if-expires").value;

            try {
                const code = await window.BoseAdmin.issueLoyaltyVoucher({
                    phone,
                    amount,
                    expiresAt: new Date(`${expiresRaw}T23:59:59`).toISOString(),
                });
                window.BoseAdminUI.showToast(`تم إصدار القسيمة بنجاح - الكود: ${code}`, "success");
                close();
                await loadVouchers();
            } catch (err) {
                window.BoseAdminUI.showToast(err.message || "تعذر إصدار القسيمة", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "إصدار القسيمة";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadVouchers() {
        allVouchers = await window.BoseAdmin.getAllLoyaltyVouchers();
        renderStats();
        renderTable();
    }

    async function init() {
        document.getElementById("lv-search-input").addEventListener("input", renderTable);
        document.getElementById("lv-status-filter").addEventListener("change", renderTable);
        document.getElementById("lv-issue-btn").addEventListener("click", openIssueModal);

        try {
            const settings = await window.BoseAdmin.getLoyaltySettings();
            if (settings) {
                defaultVoucherAmount = settings.voucher_amount ?? 300;
                defaultValidityMonths = settings.voucher_validity_months || 2;
            }
        } catch (e) {
            // سيبها بالقيم الافتراضية لو فشل الجلب
        }

        loadVouchers();
    }

    document.addEventListener("BoseAdminReady", init);
})();
