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
    let showArchived = false;
    let selectedCodes = new Set();
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

    /** بادجات صغيرة توضّح أي قيود حقيقية مفعّلة على الكوبون - القيود دي بتتفحص
     *  فعليًا وقت إتمام الطلب جوه create_order_with_items (مش شكلية بس) */
    function formatRestrictions(c) {
        const badges = [];
        if (c.max_uses !== null && c.max_uses !== undefined) {
            const used = c.used_count || 0;
            const exhausted = used >= c.max_uses;
            badges.push(`<span class="adm-badge ${exhausted ? "danger" : "neutral"}" title="عدد مرات الاستخدام المسموحة">
                <i class="fa-solid fa-hashtag"></i> ${used}/${c.max_uses}
            </span>`);
        }
        if (c.bound_phone) {
            badges.push(`<span class="adm-badge neutral" title="مربوط برقم موبايل: ${window.BoseAdminUI.escapeHtml(c.bound_phone)}" style="direction:ltr;">
                <i class="fa-solid fa-lock"></i> ${window.BoseAdminUI.escapeHtml(c.bound_phone)}
            </span>`);
        }
        if (c.min_order_value) {
            badges.push(`<span class="adm-badge neutral" title="حد أدنى لقيمة الطلب">
                <i class="fa-solid fa-sack-dollar"></i> ${Math.round(c.min_order_value)}+ ج.م
            </span>`);
        }
        // 🆕 القيود الجديدة - نفس فلسفة الشارات: بتعكس فحوصات حقيقية شغالة
        // فعلياً في validate_coupon و create_order_with_items، مش شكلية.
        if (c.max_discount_amount !== null && c.max_discount_amount !== undefined) {
            badges.push(`<span class="adm-badge neutral" title="أقصى قيمة خصم بالجنيه">
                <i class="fa-solid fa-hand-holding-dollar"></i> سقف ${Math.round(c.max_discount_amount)} ج.م
            </span>`);
        }
        if (c.first_order_only) {
            badges.push(`<span class="adm-badge neutral" title="بيشتغل بس لو دي أول طلب حقيقي لنفس رقم الهاتف">
                <i class="fa-solid fa-star"></i> أول طلب فقط
            </span>`);
        }
        if (c.starts_at) {
            const startDate = new Date(c.starts_at);
            const notStartedYet = startDate.getTime() > Date.now();
            const label = startDate.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
            badges.push(`<span class="adm-badge ${notStartedYet ? "warning" : "neutral"}" title="تاريخ بداية السريان">
                <i class="fa-solid fa-hourglass-start"></i> ${notStartedYet ? "يبدأ في" : "بدأ في"} ${label}
            </span>`);
        }
        if (c.is_archived) {
            badges.push(`<span class="adm-badge danger" title="مؤرشف - مش شغال ومش هيظهر للعميل">
                <i class="fa-solid fa-box-archive"></i> مؤرشف
            </span>`);
        }
        if (!badges.length) return `<span class="adm-order-item-meta">بدون قيود</span>`;
        return `<div style="display:flex; flex-direction:column; gap:4px; align-items:flex-start;">${badges.join("")}</div>`;
    }

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("coupons-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!allCoupons.length) {
            tbody.innerHTML = `<tr><td colspan="11">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-ticket",
                title: "مفيش كوبونات مضافة لسه",
                text: "ابدأ بإضافة أول كود خصم من زرار \"كوبون جديد\".",
            })}</td></tr>`;
            updateBulkBar();
            return;
        }

        tbody.innerHTML = allCoupons.map((c) => {
            const usage = formatUsage(c.code);
            return `
            <tr${c.is_archived ? ' style="opacity:0.6;"' : ""}>
                <td><input type="checkbox" class="coupons-row-check" data-code="${e(c.code)}" ${selectedCodes.has(c.code) ? "checked" : ""}></td>
                <td><strong>${e(c.code)}</strong></td>
                <td>${e(TYPE_LABELS[c.type] || c.type)}</td>
                <td>${formatValue(c)}</td>
                <td>${formatRestrictions(c)}</td>
                <td>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="toggle" data-code="${e(c.code)}"
                            title="${c.is_active ? "إيقاف الكوبون" : "تفعيل الكوبون"}" ${c.is_archived ? "disabled" : ""}>
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
                    ${c.is_archived
                        ? `<button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="unarchive" data-code="${e(c.code)}" title="استرجاع من الأرشيف">
                            <i class="fa-solid fa-box-open"></i>
                        </button>`
                        : `<button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="archive" data-code="${e(c.code)}" title="أرشفة (بدل الحذف النهائي - السجل والإحصائيات تفضل محفوظة)">
                            <i class="fa-solid fa-box-archive"></i>
                        </button>`
                    }
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-code="${e(c.code)}" title="حذف نهائي (لا يمكن التراجع)">
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
        tbody.querySelectorAll('[data-action="archive"]').forEach((btn) => {
            btn.addEventListener("click", () => handleArchive(btn.getAttribute("data-code")));
        });
        tbody.querySelectorAll('[data-action="unarchive"]').forEach((btn) => {
            btn.addEventListener("click", () => handleUnarchive(btn.getAttribute("data-code")));
        });

        tbody.querySelectorAll(".coupons-row-check").forEach((cb) => {
            cb.addEventListener("change", () => {
                const code = cb.getAttribute("data-code");
                if (cb.checked) selectedCodes.add(code); else selectedCodes.delete(code);
                updateBulkBar();
            });
        });
        updateBulkBar();
    }

    /** 🆕 [تحسين إنتاجية - أرشفة جماعية] نفس نمط شريط التحديد الجماعي في باقي الصفحات */
    function updateBulkBar() {
        const bar = document.getElementById("coupons-bulk-bar");
        const countEl = document.getElementById("coupons-bulk-count");
        const selectAll = document.getElementById("coupons-select-all");
        if (!bar) return;

        const visibleCodes = new Set(allCoupons.map((c) => c.code));
        Array.from(selectedCodes).forEach((code) => { if (!visibleCodes.has(code)) selectedCodes.delete(code); });

        bar.style.display = selectedCodes.size ? "flex" : "none";
        if (countEl) countEl.textContent = `${selectedCodes.size} كوبون محدد`;
        if (selectAll) selectAll.checked = allCoupons.length > 0 && selectedCodes.size === allCoupons.length;
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
            title: "تأكيد الحذف النهائي",
            message: `هل أنت متأكد من حذف كوبون "${code}" نهائياً؟ الإجراء ده مينفعش يترجع - لو عايز تشيله من القائمة النشطة بس مع الاحتفاظ بسجله وإحصائياته، استخدم زرار "أرشفة" بدل كده.`,
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

    /** 🆕 [أرشفة]: البديل الآمن للحذف النهائي - الكود بيبقى غير قابل للاستخدام
     *  فوراً (زي is_active=false بالظبط) لكن بيختفي كمان من القائمة النشطة،
     *  مع الاحتفاظ الكامل بسجله وتاريخ استخدامه وإحصائياته. */
    async function handleArchive(code) {
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "أرشفة الكوبون",
            message: `هل تريد أرشفة كوبون "${code}"؟ هيختفي من القائمة النشطة ومستحيل يتفعّل تاني، لكن سجل استخدامه هيفضل محفوظ ويمكن استرجاعه لاحقاً.`,
            confirmLabel: "أرشفة",
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.archiveCoupon(code);
            window.BoseAdminUI.showToast("تم أرشفة الكوبون", "success");
            await loadCoupons();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر أرشفة الكوبون", "error");
        }
    }

    async function handleUnarchive(code) {
        try {
            await window.BoseAdmin.unarchiveCoupon(code);
            window.BoseAdminUI.showToast("تم استرجاع الكوبون من الأرشيف - لسه محتاج تفعّله يدوياً", "success");
            await loadCoupons();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر استرجاع الكوبون", "error");
        }
    }

    /* ============================= مودال إضافة/تعديل ============================= */

    function openCouponModal(coupon) {
        const isEdit = !!coupon;
        const e = window.BoseAdminUI.escapeHtml;
        // تاريخ الانتهاء/البداية المخزّن timestamptz، والحقل input[type=date] محتاج YYYY-MM-DD بس
        const expiryDateValue = isEdit && coupon.expires_at ? coupon.expires_at.slice(0, 10) : "";
        const startsDateValue = isEdit && coupon.starts_at ? coupon.starts_at.slice(0, 10) : "";

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
                            <label for="cf-starts">تاريخ البداية (اختياري)</label>
                            <input type="date" class="adm-input" id="cf-starts" value="${startsDateValue}">
                            <span class="adm-hint">سيبه فاضي عشان الكود يشتغل من لحظة الحفظ</span>
                        </div>
                    </div>

                    <div class="adm-field">
                        <label class="adm-checkbox-label">
                            <input type="checkbox" id="cf-active" ${!isEdit || coupon.is_active ? "checked" : ""}>
                            الكوبون مفعّل ويمكن استخدامه الآن
                        </label>
                    </div>

                    <div class="adm-form-divider" style="margin: 16px 0; border-top: 1px dashed rgba(0,0,0,0.1);"></div>
                    <p style="font-size:0.82rem; color: var(--adm-text-muted, #7a7a7a); margin: 0 0 12px;">
                        <i class="fa-solid fa-shield-halved"></i> قيود اختيارية - بتتفحص فعليًا وقت إتمام الطلب، مش شكلية بس
                    </p>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="cf-max-uses">حد أقصى لعدد مرات الاستخدام (اختياري)</label>
                            <input type="number" min="1" step="1" class="adm-input" id="cf-max-uses"
                                   value="${isEdit && coupon.max_uses !== null && coupon.max_uses !== undefined ? coupon.max_uses : ""}"
                                   placeholder="بدون حد">
                            ${isEdit && coupon.used_count ? `<span class="adm-hint">اتستخدم ${e(String(coupon.used_count))} مرة لحد دلوقتي</span>` : ""}
                        </div>
                        <div class="adm-field">
                            <label for="cf-min-order">حد أدنى لقيمة الطلب بالجنيه (اختياري)</label>
                            <input type="number" min="0" step="0.01" class="adm-input" id="cf-min-order"
                                   value="${isEdit && coupon.min_order_value !== null && coupon.min_order_value !== undefined ? coupon.min_order_value : ""}"
                                   placeholder="بدون حد أدنى">
                        </div>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="cf-max-discount">أقصى قيمة خصم بالجنيه (اختياري)</label>
                            <input type="number" min="0" step="0.01" class="adm-input" id="cf-max-discount"
                                   value="${isEdit && coupon.max_discount_amount !== null && coupon.max_discount_amount !== undefined ? coupon.max_discount_amount : ""}"
                                   placeholder="بدون سقف">
                            <span class="adm-hint">مفيدة خصوصاً مع "نسبة مئوية" عشان طلب كبير جداً ميدّيش خصم مبالغ فيه</span>
                        </div>
                        <div class="adm-field">
                            <label class="adm-checkbox-label" style="margin-top: 28px;">
                                <input type="checkbox" id="cf-first-order" ${isEdit && coupon.first_order_only ? "checked" : ""}>
                                لأول طلب فقط
                            </label>
                            <span class="adm-hint">هيشتغل بس لو دي أول طلب حقيقي (غير ملغي) لنفس رقم الهاتف - يتطلب إدخال رقم الهاتف</span>
                        </div>
                    </div>

                    <div class="adm-field">
                        <label for="cf-bound-phone">مربوط برقم موبايل معيّن (اختياري)</label>
                        <input type="tel" class="adm-input" id="cf-bound-phone" style="direction:ltr;"
                               value="${isEdit && coupon.bound_phone ? e(coupon.bound_phone) : ""}"
                               placeholder="مثال: 01012345678">
                        <span class="adm-hint">لو اتحطّ، الكود ده مش هيشتغل إلا لعميل برقم الموبايل ده بالظبط</span>
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
            const startsRaw = document.getElementById("cf-starts").value;
            const maxUsesRaw = document.getElementById("cf-max-uses").value;
            const minOrderRaw = document.getElementById("cf-min-order").value;
            const maxDiscountRaw = document.getElementById("cf-max-discount").value;
            const firstOrderOnly = document.getElementById("cf-first-order").checked;
            const boundPhoneRaw = document.getElementById("cf-bound-phone").value.trim();
            // توحيد شكل رقم الموبايل زي بالظبط ما بتفحصه دالة create_order_with_items
            // في القاعدة (v_clean_phone) عشان المطابقة تنجح فعليًا وقت الطلب
            const boundPhoneClean = boundPhoneRaw.replace(/[\s\-()+]/g, "");

            if (boundPhoneRaw && !/^01[0125][0-9]{8}$/.test(boundPhoneClean)) {
                window.BoseAdminUI.showToast("رقم الموبايل المربوط لازم يكون رقم مصري صحيح (01...)", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ الكوبون";
                return;
            }

            // نهاية اليوم المختار (23:59:59) لتاريخ الانتهاء، وبداية اليوم (00:00:00) لتاريخ البداية
            const startsAtIso = startsRaw ? new Date(`${startsRaw}T00:00:00`).toISOString() : null;
            const expiresAtIso = expiresRaw ? new Date(`${expiresRaw}T23:59:59`).toISOString() : null;
            if (startsAtIso && expiresAtIso && new Date(startsAtIso) >= new Date(expiresAtIso)) {
                window.BoseAdminUI.showToast("تاريخ البداية لازم يكون قبل تاريخ الانتهاء", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ الكوبون";
                return;
            }

            const payload = {
                type,
                value,
                is_active: document.getElementById("cf-active").checked,
                expires_at: expiresAtIso,
                starts_at: startsAtIso,
                max_uses: maxUsesRaw ? parseInt(maxUsesRaw, 10) : null,
                min_order_value: minOrderRaw ? parseFloat(minOrderRaw) : null,
                max_discount_amount: maxDiscountRaw ? parseFloat(maxDiscountRaw) : null,
                first_order_only: firstOrderOnly,
                bound_phone: boundPhoneRaw ? boundPhoneClean : null,
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
        tbody.innerHTML = `<tr><td colspan="11"><div class="adm-loading-spinner"></div></td></tr>`;
        const [coupons, stats] = await Promise.all([
            window.BoseAdmin.getAllCoupons(showArchived),
            window.BoseAdmin.getCouponUsageStats(),
        ]);
        allCoupons = coupons;
        usageStats = stats;
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("add-coupon-btn").addEventListener("click", () => openCouponModal(null));
        const archivedToggle = document.getElementById("show-archived-toggle");
        if (archivedToggle) {
            archivedToggle.addEventListener("change", async () => {
                showArchived = archivedToggle.checked;
                await loadCoupons();
            });
        }
        document.getElementById("coupons-select-all").addEventListener("change", (e) => {
            if (e.target.checked) allCoupons.forEach((c) => selectedCodes.add(c.code));
            else selectedCodes.clear();
            renderTable();
        });
        document.getElementById("coupons-bulk-clear-btn").addEventListener("click", () => {
            selectedCodes.clear();
            renderTable();
        });
        document.getElementById("coupons-bulk-archive-btn").addEventListener("click", async () => {
            const count = selectedCodes.size;
            if (!count) return;
            const confirmed = await window.BoseAdminUI.confirmAction({
                title: "تأكيد أرشفة جماعية",
                message: `هيتم أرشفة ${count} كوبون (وإيقافهم تلقائياً). السجل والإحصائيات هتفضل محفوظة، وتقدري تسترجعيهم بعدين.`,
                confirmLabel: "أرشفة الكل",
            });
            if (!confirmed) return;
            try {
                await window.BoseAdmin.bulkArchiveCoupons(Array.from(selectedCodes));
                window.BoseAdminUI.showToast(`تم أرشفة ${count} كوبون`, "success");
                selectedCodes.clear();
                await loadCoupons();
            } catch (e) {
                window.BoseAdminUI.showToast("تعذر أرشفة الكوبونات المحددة", "error");
            }
        });

        await loadCoupons();
    });
})();