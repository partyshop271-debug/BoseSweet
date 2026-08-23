/**
 * coupons-page.js - منطق صفحة الكوبونات فقط
 * =====================================================================
 * المفتاح الأساسي لأي كوبون هو الكود نفسه (code) مش id منفصل - نفس شكل
 * جدول coupons في القاعدة. الكود مينفعش يتغيّر بعد الإنشاء (زي id المنتج
 * والفئة بالظبط) لأنه هو نفسه اللي العميل بيكتبه في صفحة الشيك أوت
 * وبيتحقق منه عبر دالة validate_coupon الآمنة - مش من هنا.
 */
(function () {
    "use strict";

    let allCoupons = [];
    // 📊 [تقرير استخدام الكوبونات]: خريطة { code -> { usageCount, totalDiscount, lastUsedAt } }
    // محسوبة من جدول orders الفعلي، مش عمود مخزّن على جدول coupons نفسه.
    let usageStats = {};

    const TYPE_LABELS = { percent: "نسبة مئوية", fixed: "مبلغ ثابت" };

    function formatValue(coupon) {
        return coupon.type === "percent" ? `${coupon.value}%` : `${Math.round(coupon.value)} ج.م`;
    }

    function formatExpiry(expiresAt) {
        if (!expiresAt) return `<span class="adm-order-item-meta">بدون تاريخ انتهاء</span>`;
        const d = new Date(expiresAt);
        const expired = d.getTime() < Date.now();
        const label = d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
        return expired ? `<span class="adm-badge danger">${label} (منتهي)</span>` : label;
    }

    function formatUsage(code) {
        const stat = usageStats[code];
        if (!stat || !stat.usageCount) {
            return { count: `<span class="adm-order-item-meta">0</span>`, discount: "—", last: "—" };
        }
        const lastLabel = new Date(stat.lastUsedAt).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
        return {
            count: `<strong>${stat.usageCount}</strong>`,
            discount: `${Math.round(stat.totalDiscount)} ج.م`,
            last: lastLabel,
        };
    }

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("coupons-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!allCoupons.length) {
            tbody.innerHTML = `<tr><td colspan="9">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-ticket",
                title: "مفيش كوبونات مضافة لسه",
                text: "ابدأ بإضافة أول كود خصم من زرار \"كوبون جديد\".",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = allCoupons.map((c) => {
            const usage = formatUsage(c.code);
            return `
            <tr>
                <td><strong>${e(c.code)}</strong></td>
                <td>${e(TYPE_LABELS[c.type] || c.type)}</td>
                <td>${formatValue(c)}</td>
                <td>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="toggle" data-code="${e(c.code)}"
                            title="${c.is_active ? "إيقاف الكوبون" : "تفعيل الكوبون"}">
                        <i class="fa-solid ${c.is_active ? "fa-toggle-on" : "fa-toggle-off"}" style="color: ${c.is_active ? "var(--adm-success)" : "var(--adm-text-muted)"}; font-size: 1.2rem;"></i>
                    </button>
                </td>
                <td>${formatExpiry(c.expires_at)}</td>
                <td>${usage.count}</td>
                <td>${usage.discount}</td>
                <td>${usage.last}</td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-code="${e(c.code)}" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-code="${e(c.code)}" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                const coupon = allCoupons.find((c) => c.code === btn.getAttribute("data-code"));
                if (coupon) openCouponModal(coupon);
            });
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(btn.getAttribute("data-code")));
        });
        tbody.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
            btn.addEventListener("click", () => handleToggleActive(btn.getAttribute("data-code")));
        });
    }

    async function handleToggleActive(code) {
        const coupon = allCoupons.find((c) => c.code === code);
        const newState = !coupon.is_active;
        try {
            await window.BoseAdmin.updateCoupon(code, { is_active: newState });
            coupon.is_active = newState;
            window.BoseAdminUI.showToast(newState ? "تم تفعيل الكوبون" : "تم إيقاف الكوبون", "success");
            renderTable();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر تحديث حالة الكوبون", "error");
        }
    }

    async function handleDelete(code) {
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الحذف",
            message: `هل أنت متأكد من حذف كوبون "${code}"؟ الإجراء ده نهائي.`,
            confirmLabel: "حذف نهائي",
            danger: true,
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.deleteCoupon(code);
            window.BoseAdminUI.showToast("تم حذف الكوبون", "success");
            await loadCoupons();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر حذف الكوبون", "error");
        }
    }

    /* ============================= مودال إضافة/تعديل ============================= */

    function openCouponModal(coupon) {
        const isEdit = !!coupon;
        const e = window.BoseAdminUI.escapeHtml;
        // تاريخ الانتهاء المخزّن timestamptz، والحقل input[type=date] محتاج YYYY-MM-DD بس
        const expiryDateValue = isEdit && coupon.expires_at ? coupon.expires_at.slice(0, 10) : "";

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 460px;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل كوبون" : "كوبون جديد"}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form id="coupon-form">
                    <div class="adm-field">
                        <label for="cf-code">كود الكوبون</label>
                        <input type="text" class="adm-input" id="cf-code" value="${isEdit ? e(coupon.code) : ""}"
                               placeholder="مثال: BOSE10" ${isEdit ? "disabled" : ""} required style="text-transform: uppercase;">
                        ${!isEdit ? `<span class="adm-hint">الكود اللي العميل هيكتبه فعلياً. مينفعش يتغير بعد الحفظ.</span>` : ""}
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="cf-type">نوع الخصم</label>
                            <select class="adm-select" id="cf-type">
                                <option value="percent" ${!isEdit || coupon.type === "percent" ? "selected" : ""}>نسبة مئوية (%)</option>
                                <option value="fixed" ${isEdit && coupon.type === "fixed" ? "selected" : ""}>مبلغ ثابت (ج.م)</option>
                            </select>
                        </div>
                        <div class="adm-field">
                            <label for="cf-value">القيمة</label>
                            <input type="number" step="0.01" min="0" class="adm-input" id="cf-value" value="${isEdit ? coupon.value : ""}" required>
                        </div>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="cf-expires">تاريخ الانتهاء (اختياري)</label>
                            <input type="date" class="adm-input" id="cf-expires" value="${expiryDateValue}">
                            <span class="adm-hint">سيبه فاضي لكوبون بدون تاريخ انتهاء</span>
                        </div>
                        <div class="adm-field">
                            <label class="adm-checkbox-label">
                                <input type="checkbox" id="cf-active" ${!isEdit || coupon.is_active ? "checked" : ""}>
                                الكوبون مفعّل ويمكن استخدامه الآن
                            </label>
                        </div>
                    </div>

                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="cf-save-btn">حفظ الكوبون</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }
        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("coupon-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("cf-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const type = document.getElementById("cf-type").value;
            const value = parseFloat(document.getElementById("cf-value").value) || 0;

            if (type === "percent" && value > 100) {
                window.BoseAdminUI.showToast("النسبة المئوية لازم تكون 100 أو أقل", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ الكوبون";
                return;
            }

            const expiresRaw = document.getElementById("cf-expires").value;
            const payload = {
                type,
                value,
                is_active: document.getElementById("cf-active").checked,
                // نهاية اليوم المختار (23:59:59) عشان الكوبون يفضل شغال طول آخر يوم في صلاحيته
                expires_at: expiresRaw ? new Date(`${expiresRaw}T23:59:59`).toISOString() : null,
            };

            try {
                if (isEdit) {
                    await window.BoseAdmin.updateCoupon(coupon.code, payload);
                    window.BoseAdminUI.showToast("تم تعديل الكوبون", "success");
                } else {
                    const code = document.getElementById("cf-code").value.trim().toUpperCase();
                    if (!code) {
                        window.BoseAdminUI.showToast("كود الكوبون مطلوب", "error");
                        saveBtn.disabled = false;
                        saveBtn.textContent = "حفظ الكوبون";
                        return;
                    }
                    await window.BoseAdmin.createCoupon({ code, ...payload });
                    window.BoseAdminUI.showToast("تم إضافة الكوبون", "success");
                }
                close();
                await loadCoupons();
            } catch (err) {
                window.BoseAdminUI.showToast(
                    isEdit ? "تعذر تعديل الكوبون" : "تعذر إضافة الكوبون (تأكد إن الكود مش مستخدم قبل كده)",
                    "error"
                );
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ الكوبون";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadCoupons() {
        const tbody = document.getElementById("coupons-tbody");
        tbody.innerHTML = `<tr><td colspan="9"><div class="adm-loading-spinner"></div></td></tr>`;
        const [coupons, stats] = await Promise.all([
            window.BoseAdmin.getAllCoupons(),
            window.BoseAdmin.getCouponUsageStats(),
        ]);
        allCoupons = coupons;
        usageStats = stats;
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("add-coupon-btn").addEventListener("click", () => openCouponModal(null));
        await loadCoupons();
    });
})();