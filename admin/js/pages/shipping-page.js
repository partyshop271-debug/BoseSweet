/**
 * shipping-page.js - منطق صفحة مناطق التوصيل فقط
 * =====================================================================
 * كل منطقة هنا لها id ثابت (نص إنجليزي فريد) بيتخزن في orders.shipping_zone_id
 * وقت ما العميل يختار التوصيل - فالحذف هيترفض من القاعدة (foreign key) لو
 * فيه طلبات سابقة لسه مرتبطة بالمنطقة دي، عشان سجل الطلبات القديم متتأثرش.
 */
(function () {
    "use strict";

    let allZones = [];

    function money(n) {
        return n || n === 0 ? Math.round(n) + " ج.م" : "—";
    }

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("zones-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!allZones.length) {
            tbody.innerHTML = `<tr><td colspan="5">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-truck-fast",
                title: "مفيش مناطق توصيل مضافة لسه",
                text: "ابدأ بإضافة أول منطقة من زرار \"منطقة جديدة\".",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = allZones.map((z) => `
            <tr>
                <td>${e(z.governorate || "—")}</td>
                <td>${e(z.city || "—")}</td>
                <td>${e(z.area || "—")}</td>
                <td>${money(z.price)}</td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-id="${e(z.id)}" title="تعديل">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-id="${e(z.id)}" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => {
                const zone = allZones.find((z) => z.id === btn.getAttribute("data-id"));
                if (zone) openZoneModal(zone);
            });
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener("click", () => handleDelete(btn.getAttribute("data-id")));
        });
    }

    async function handleDelete(id) {
        const zone = allZones.find((z) => z.id === id);
        const label = [zone?.governorate, zone?.city, zone?.area].filter(Boolean).join(" - ") || id;
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الحذف",
            message: `هل أنت متأكد من حذف منطقة "${label}"؟ هيفشل الحذف لو فيه طلبات سابقة مرتبطة بيها.`,
            confirmLabel: "حذف نهائي",
            danger: true,
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.deleteShippingZone(id);
            window.BoseAdminUI.showToast("تم حذف المنطقة", "success");
            await loadZones();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر حذف المنطقة، على الأغلب لسه فيه طلبات مرتبطة بيها", "error");
        }
    }

    /* ============================= مودال إضافة/تعديل ============================= */

    function openZoneModal(zone) {
        const isEdit = !!zone;
        const e = window.BoseAdminUI.escapeHtml;

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 460px;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل منطقة توصيل" : "منطقة توصيل جديدة"}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form id="zone-form">
                    <div class="adm-field">
                        <label for="zf-id">معرّف المنطقة (ID)</label>
                        <input type="text" class="adm-input" id="zf-id" value="${isEdit ? e(zone.id) : ""}"
                               placeholder="مثال: cairo-nasr-city" ${isEdit ? "disabled" : ""} required>
                        ${!isEdit ? `<span class="adm-hint">نص إنجليزي فريد، بحروف صغيرة وشرطات (-) بس. مينفعش يتغير بعد الحفظ.</span>` : ""}
                    </div>

                    <div class="adm-field">
                        <label for="zf-governorate">المحافظة</label>
                        <input type="text" class="adm-input" id="zf-governorate" value="${isEdit ? e(zone.governorate || "") : ""}" required>
                    </div>

                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="zf-city">المدينة</label>
                            <input type="text" class="adm-input" id="zf-city" value="${isEdit ? e(zone.city || "") : ""}">
                        </div>
                        <div class="adm-field">
                            <label for="zf-area">المنطقة/الحي</label>
                            <input type="text" class="adm-input" id="zf-area" value="${isEdit ? e(zone.area || "") : ""}">
                        </div>
                    </div>

                    <div class="adm-field">
                        <label for="zf-price">سعر التوصيل (ج.م)</label>
                        <input type="number" step="0.01" min="0" class="adm-input" id="zf-price" value="${isEdit ? zone.price : ""}" required>
                    </div>

                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="zf-save-btn">حفظ المنطقة</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }
        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("zone-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("zf-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const payload = {
                governorate: document.getElementById("zf-governorate").value.trim(),
                city: document.getElementById("zf-city").value.trim() || null,
                area: document.getElementById("zf-area").value.trim() || null,
                price: parseFloat(document.getElementById("zf-price").value) || 0,
            };

            try {
                if (isEdit) {
                    await window.BoseAdmin.updateShippingZone(zone.id, payload);
                    window.BoseAdminUI.showToast("تم تعديل المنطقة", "success");
                } else {
                    const id = document.getElementById("zf-id").value.trim();
                    if (!/^[a-z0-9-]+$/.test(id)) {
                        window.BoseAdminUI.showToast("المعرّف لازم يكون حروف إنجليزية صغيرة وأرقام وشرطات بس", "error");
                        saveBtn.disabled = false;
                        saveBtn.textContent = "حفظ المنطقة";
                        return;
                    }
                    await window.BoseAdmin.createShippingZone({ id, ...payload });
                    window.BoseAdminUI.showToast("تم إضافة المنطقة", "success");
                }
                close();
                await loadZones();
            } catch (err) {
                window.BoseAdminUI.showToast(
                    isEdit ? "تعذر تعديل المنطقة" : "تعذر إضافة المنطقة (تأكد إن الـ ID مش مستخدم قبل كده)",
                    "error"
                );
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ المنطقة";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadZones() {
        const tbody = document.getElementById("zones-tbody");
        tbody.innerHTML = `<tr><td colspan="5"><div class="adm-loading-spinner"></div></td></tr>`;
        allZones = await window.BoseAdmin.getAllShippingZones();
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("add-zone-btn").addEventListener("click", () => openZoneModal(null));
        await loadZones();
    });
})();