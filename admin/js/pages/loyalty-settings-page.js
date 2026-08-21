/**
 * loyalty-settings-page.js - منطق صفحة إعدادات الولاء فقط
 * =====================================================================
 * بتقرأ/تكتب عمود store_settings.loyalty بالكامل عبر
 * window.BoseAdmin.getLoyaltySettings / saveLoyaltySettings. الشكل المتوقع:
 *   {
 *     enabled: boolean,
 *     cycle_length: number,               // عدد الطلبات في دورة الخصم
 *     tiers: { "3": 5, "5": 10, "7": 15 }, // ترتيب داخل الدورة → نسبة خصم %
 *     milestone_every: number,            // كل قد إيه طلب تتكسب قسيمة هدية
 *     voucher_amount: number,             // قيمة القسيمة بالجنيه
 *     voucher_validity_months: number,    // مدة صلاحية القسيمة بالشهور
 *   }
 * نفس الشكل ده بالظبط اللي بتقرأه دوال القاعدة (create_order_with_items،
 * get_customer_rewards، handle_loyalty_milestone_delivery) - أي تغيير في
 * أسماء المفاتيح هنا لازم يترافق مع تعديل في القاعدة، فمينفعش يتغيّر من هنا لوحده.
 */
(function () {
    "use strict";

    let tiers = {}; // { "3": 5, "5": 10, ... } - بيتعدّل مباشرة من صفوف الجدول

    /* ============================= جدول شرائح الخصم ============================= */

    function renderTiersTable() {
        const tbody = document.getElementById("lset-tiers-tbody");
        const positions = Object.keys(tiers).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

        if (positions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3"><span class="adm-hint">لا توجد أي نسبة خصم مضافة - اضغطي "إضافة نسبة خصم جديدة"</span></td></tr>`;
        } else {
            tbody.innerHTML = positions.map((pos) => `
                <tr data-pos="${window.BoseAdminUI.escapeHtml(pos)}">
                    <td><input type="number" min="1" step="1" class="adm-input lset-tier-pos" value="${window.BoseAdminUI.escapeHtml(pos)}"></td>
                    <td><input type="number" min="0" max="100" step="0.5" class="adm-input lset-tier-pct" value="${window.BoseAdminUI.escapeHtml(tiers[pos])}"></td>
                    <td><button type="button" class="lset-tiers-row-delete" data-pos="${window.BoseAdminUI.escapeHtml(pos)}" title="حذف"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `).join("");
        }

        tbody.querySelectorAll(".lset-tiers-row-delete").forEach((btn) => {
            btn.addEventListener("click", () => {
                delete tiers[btn.dataset.pos];
                syncTiersFromInputs(); // تثبيت أي تعديلات في باقي الصفوف قبل إعادة الرسم
                renderTiersTable();
                renderCyclePreview();
            });
        });

        tbody.querySelectorAll(".lset-tier-pos, .lset-tier-pct").forEach((input) => {
            input.addEventListener("change", () => {
                syncTiersFromInputs();
                renderCyclePreview();
            });
        });
    }

    /** بتقرأ كل صفوف الجدول الحالية وتبني منها كائن tiers جديد (بتستخدم قبل أي حفظ أو إعادة رسم) */
    function syncTiersFromInputs() {
        const rows = document.querySelectorAll("#lset-tiers-tbody tr[data-pos]");
        const updated = {};
        rows.forEach((row) => {
            const posInput = row.querySelector(".lset-tier-pos");
            const pctInput = row.querySelector(".lset-tier-pct");
            if (!posInput || !pctInput) return;
            const pos = parseInt(posInput.value, 10);
            const pct = parseFloat(pctInput.value);
            if (pos > 0) {
                updated[String(pos)] = isNaN(pct) ? 0 : pct;
            }
        });
        tiers = updated;
    }

    function addTierRow() {
        syncTiersFromInputs();
        const cycleLength = parseInt(document.getElementById("lset-cycle-length").value, 10) || 7;
        // بتقترح أول ترتيب فاضي داخل الدورة الحالية عشان تسهّل الإضافة السريعة
        let newPos = 1;
        while (tiers[String(newPos)] !== undefined && newPos <= cycleLength) newPos += 1;
        tiers[String(newPos)] = 5;
        renderTiersTable();
        renderCyclePreview();
    }

    /* ============================= معاينة الدورة ============================= */

    function renderCyclePreview() {
        const cycleLength = Math.max(1, parseInt(document.getElementById("lset-cycle-length").value, 10) || 7);
        const milestoneEvery = Math.max(1, parseInt(document.getElementById("lset-milestone-every").value, 10) || 10);
        const wrap = document.getElementById("lset-preview-cycle");

        const dots = [];
        for (let pos = 1; pos <= cycleLength; pos += 1) {
            const pct = parseFloat(tiers[String(pos)]) || 0;
            const isMilestone = pos % milestoneEvery === 0; // معاينة تقريبية داخل أول دورة بس
            const cls = isMilestone ? "is-milestone" : (pct > 0 ? "has-discount" : "");
            const label = isMilestone ? "🎁 هدية" : (pct > 0 ? `${pct}%` : "—");
            dots.push(`<div class="lset-preview-dot ${cls}" title="الطلب رقم ${pos}">${label}</div>`);
        }
        wrap.innerHTML = dots.join("");
    }

    /* ============================= التحميل والحفظ ============================= */

    async function init() {
        const loyalty = await window.BoseAdmin.getLoyaltySettings();

        document.getElementById("lset-enabled").checked = loyalty.enabled !== false;
        document.getElementById("lset-cycle-length").value = loyalty.cycle_length || 7;
        document.getElementById("lset-milestone-every").value = loyalty.milestone_every || 10;
        document.getElementById("lset-voucher-amount").value = loyalty.voucher_amount ?? 300;
        document.getElementById("lset-voucher-validity").value = loyalty.voucher_validity_months || 2;

        tiers = { ...(loyalty.tiers || { "3": 5, "5": 10, "7": 15 }) };
        renderTiersTable();
        renderCyclePreview();

        document.getElementById("lset-cycle-length").addEventListener("input", renderCyclePreview);
        document.getElementById("lset-milestone-every").addEventListener("input", renderCyclePreview);
        document.getElementById("lset-add-tier-btn").addEventListener("click", addTierRow);
        document.getElementById("lset-save-btn").addEventListener("click", handleSave);

        document.getElementById("lset-content").style.display = "";
        document.getElementById("lset-loading").style.display = "none";
    }

    async function handleSave() {
        syncTiersFromInputs();

        const cycleLength = parseInt(document.getElementById("lset-cycle-length").value, 10);
        const milestoneEvery = parseInt(document.getElementById("lset-milestone-every").value, 10);
        const voucherAmount = parseFloat(document.getElementById("lset-voucher-amount").value);
        const voucherValidity = parseInt(document.getElementById("lset-voucher-validity").value, 10);

        if (!cycleLength || cycleLength < 1) {
            window.BoseAdminUI.showToast("عدد الطلبات في دورة الخصم لازم يكون رقم أكبر من صفر", "error");
            return;
        }
        if (!milestoneEvery || milestoneEvery < 1) {
            window.BoseAdminUI.showToast("عدد الطلبات في دورة قسيمة الهدية لازم يكون رقم أكبر من صفر", "error");
            return;
        }
        const invalidTierPos = Object.keys(tiers).find((pos) => parseInt(pos, 10) > cycleLength);
        if (invalidTierPos) {
            window.BoseAdminUI.showToast(`ترتيب الطلب ${invalidTierPos} أكبر من طول الدورة (${cycleLength}) - عدّلي طول الدورة أو احذفي الصف ده`, "error");
            return;
        }

        const loyalty = {
            enabled: document.getElementById("lset-enabled").checked,
            cycle_length: cycleLength,
            tiers,
            milestone_every: milestoneEvery,
            voucher_amount: isNaN(voucherAmount) ? 0 : voucherAmount,
            voucher_validity_months: voucherValidity || 2,
        };

        const saveBtn = document.getElementById("lset-save-btn");
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
        try {
            await window.BoseAdmin.saveLoyaltySettings(loyalty);
            window.BoseAdminUI.showToast("تم حفظ إعدادات الولاء", "success");
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر حفظ الإعدادات", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ الإعدادات';
        }
    }

    document.addEventListener("BoseAdminReady", init);
})();
