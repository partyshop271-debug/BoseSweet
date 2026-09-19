/**
 * client-error-log-page.js - سجل أعطال الواجهة عند العميلة
 * =====================================================================
 * 📊🛡️ [2026-09-19]: أول وأهم استخدام ليها - حالات رفض رقم الموبايل في
 * الشيك أوت (راجع boseRegisterPhoneRejection في js/phone-utils.js وجدول
 * client_error_events في القاعدة). الصفحة دي عارضة بس - القراءة تتم عبر
 * window.BoseAdmin.getClientErrorEvents() اللي بيرجّع الصفوف من غير أي
 * تجميع أو تحليل مسبق، والتحليل (فك الـcodepoints لأسماء مقروءة) بيحصل
 * هنا في الكلينت.
 *
 * ليه الـcodepoints مش النص الخام بس: بعض المحارف المخفية (LRM/RLM/ALM/
 * zero-width) مالهاش شكل ظاهر خالص، فلو عرضنا raw_value في جدول HTML
 * عادي هتبان القيمتين متطابقتين ظاهريًا رغم إن فيها فرق فعلي. بنفكّك كل
 * محرف لكوده ونوريه كـ badge صغير لما يكون من قايمة معروفة.
 */
(function () {
    "use strict";

    // خريطة أشهر المحارف اللي بتسبب المشكلة - أي كود مش موجود هنا بيتعرض كـ U+XXXX خام
    const KNOWN_INVISIBLE_CODEPOINTS = {
        0x200E: "LRM - علامة اتجاه (يسار لليمين)",
        0x200F: "RLM - علامة اتجاه (يمين لليسار)",
        0x061C: "ALM - علامة الحرف العربي",
        0x200B: "مسافة بعرض صفر (ZWSP)",
        0x200C: "ZWNJ - رابط صفري",
        0x200D: "ZWJ - رابط صفري",
        0x00A0: "مسافة غير قابلة للكسر (NBSP)",
        0x2011: "شرطة غير قابلة للكسر",
        0xFEFF: "علامة ترتيب البايت (BOM)",
    };

    let currentRows = [];

    function fmtDateTime(iso) {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" }) +
            " - " + d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    }

    const EVENT_TYPE_LABELS = {
        phone_validation_rejected: "رفض رقم موبايل",
    };

    function eventTypeLabel(type) {
        return EVENT_TYPE_LABELS[type] || type || "—";
    }

    /**
     * بيرجّع سطرين: النص كما هو مع رموز مرئية بدل المحارف المخفية،
     * وقايمة الشارات لكل محرف خفي موجود فعلاً في القيمة.
     */
    function decodeRawValue(raw, codepoints) {
        const escapeHtml = window.BoseAdminUI.escapeHtml;
        if (!raw && (!codepoints || !codepoints.length)) {
            return { visibleHtml: "<span style=\"opacity:.5\">فاضي</span>", badgesHtml: "" };
        }

        const chars = Array.from(String(raw || ""));
        let visible = "";
        const foundHidden = [];

        chars.forEach((ch, i) => {
            const cp = codepoints && codepoints[i] != null ? codepoints[i] : ch.codePointAt(0);
            if (KNOWN_INVISIBLE_CODEPOINTS[cp]) {
                visible += "▯"; // رمز مرئي مكان المحرف المخفي
                foundHidden.push(cp);
            } else if (cp < 0x20 || cp === 0x7F) {
                visible += "▯";
                foundHidden.push(cp);
            } else {
                visible += ch;
            }
        });

        const visibleHtml = `<span dir="ltr" style="font-family:monospace;">${escapeHtml(visible)}</span>`;

        if (!foundHidden.length) {
            return { visibleHtml, badgesHtml: "<span style=\"opacity:.5;font-size:.8rem;\">مفيش محارف مخفية</span>" };
        }

        const uniqueCps = [...new Set(foundHidden)];
        const badgesHtml = uniqueCps.map((cp) => {
            const label = KNOWN_INVISIBLE_CODEPOINTS[cp] || `محرف تحكم غير معروف`;
            const hex = "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
            return `<span class="adm-badge danger" style="margin-inline-end:4px;margin-bottom:4px;display:inline-block;" title="${escapeHtml(label)}">${escapeHtml(hex)}</span>`;
        }).join("");

        return { visibleHtml, badgesHtml };
    }

    function renderRow(row) {
        const escapeHtml = window.BoseAdminUI.escapeHtml;
        const { visibleHtml, badgesHtml } = decodeRawValue(row.raw_value, row.codepoints);
        const normalized = row.normalized
            ? `<span dir="ltr" style="font-family:monospace;">${escapeHtml(row.normalized)}</span>`
            : "<span style=\"opacity:.5\">—</span>";
        const ua = row.user_agent ? escapeHtml(row.user_agent) : "—";

        return `
            <tr>
                <td style="white-space:nowrap;">${fmtDateTime(row.created_at)}</td>
                <td><span class="adm-badge warning">${escapeHtml(eventTypeLabel(row.event_type))}</span></td>
                <td>${visibleHtml}</td>
                <td>${normalized}</td>
                <td style="max-width:220px;">${badgesHtml}</td>
                <td style="text-align:center;">${row.attempt != null ? row.attempt : "—"}</td>
                <td>${escapeHtml(row.page_file || "—")}</td>
                <td style="max-width:220px;font-size:.78rem;opacity:.8;word-break:break-word;">${ua}</td>
            </tr>`;
    }

    async function loadRows() {
        const tbody = document.getElementById("cel-tbody");
        const subtitle = document.getElementById("cel-subtitle");
        tbody.innerHTML = `<tr><td colspan="8">${window.BoseAdminUI.loadingSpinnerHTML()}</td></tr>`;

        currentRows = await window.BoseAdmin.getClientErrorEvents(200);

        if (!currentRows.length) {
            tbody.innerHTML = `<tr><td colspan="8">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-circle-check",
                title: "مفيش أي أعطال مسجّلة",
                text: "الحمد لله - مفيش عميلة واجهت مشكلة في إدخال بياناتها لحد دلوقتي.",
            })}</td></tr>`;
            subtitle.textContent = "مفيش سجلات";
            return;
        }

        tbody.innerHTML = currentRows.map(renderRow).join("");
        const rejectedPhones = currentRows.filter((r) => r.event_type === "phone_validation_rejected").length;
        subtitle.textContent = `${currentRows.length} حالة مسجّلة (${rejectedPhones} منها رفض رقم موبايل) - آخر ${currentRows.length} حالة`;
    }

    function init() {
        document.getElementById("cel-refresh-btn").addEventListener("click", loadRows);
        loadRows();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
