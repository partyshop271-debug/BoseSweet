/**
 * push-notifications-page.js - منطق صفحة "الإشعارات" فقط
 * =====================================================================
 * بترسل إشعار Push حقيقي لكل الأجهزة المشتركة عن طريق Edge Function
 * send-push-notification (راجع window.BoseAdmin.sendPushNotification في
 * admin-data.js). مفيش جدولة ولا استهداف شرائح هنا - إرسال فوري لكل
 * المشتركين بس، بنفس فلسفة البساطة المتبعة في باقي أدوات اللوحة.
 */
(function () {
    "use strict";

    function e(v) { return window.BoseAdminUI.escapeHtml(v); }

    async function loadSubscriberCount() {
        const el = document.getElementById("pn-subscriber-count");
        try {
            const count = await window.BoseAdmin.getPushSubscriberCount();
            if (count === null) {
                el.innerHTML = `<span style="font-size:16px; color:#999; font-weight:400;">تعذر جلب العدد</span>`;
                return;
            }
            el.textContent = count.toLocaleString("ar-EG");
        } catch (err) {
            el.innerHTML = `<span style="font-size:16px; color:#999; font-weight:400;">تعذر جلب العدد</span>`;
        }
    }

    function updatePreview() {
        const title = document.getElementById("pn-title-input").value.trim() || "عنوان الإشعار";
        const body = document.getElementById("pn-body-input").value.trim() || "نص الإشعار هيظهر هنا";
        document.getElementById("pn-preview-title").textContent = title;
        document.getElementById("pn-preview-body").textContent = body;
    }

    function wireCounters() {
        const titleInput = document.getElementById("pn-title-input");
        const bodyInput = document.getElementById("pn-body-input");
        const titleCount = document.getElementById("pn-title-count");
        const bodyCount = document.getElementById("pn-body-count");

        titleInput.addEventListener("input", () => {
            titleCount.textContent = `${titleInput.value.length} / 80`;
            updatePreview();
        });
        bodyInput.addEventListener("input", () => {
            bodyCount.textContent = `${bodyInput.value.length} / 200`;
            updatePreview();
        });
    }

    function showLastResult(result) {
        const card = document.getElementById("pn-last-result-card");
        const body = document.getElementById("pn-last-result-body");
        card.style.display = "";
        body.innerHTML = `
            <p>✅ اتبعت لـ <strong>${e(String(result.sent))}</strong> جهاز بنجاح.</p>
            ${result.failed ? `<p>⚠️ فشل الإرسال لـ ${e(String(result.failed))} جهاز (غالبًا اشتراكات قديمة/منتهية - بتتنضف تلقائيًا).</p>` : ""}
            ${result.message ? `<p>${e(result.message)}</p>` : ""}
        `;
    }

    async function handleSend() {
        const titleInput = document.getElementById("pn-title-input");
        const bodyInput = document.getElementById("pn-body-input");
        const urlInput = document.getElementById("pn-url-input");
        const sendBtn = document.getElementById("pn-send-btn");

        const title = titleInput.value.trim();
        const body = bodyInput.value.trim();
        const url = urlInput.value.trim() || "/";

        if (!title || !body) {
            window.BoseAdminUI.showToast("لازم تكتبي عنوان ونص للإشعار", "error");
            return;
        }

        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "تأكيد إرسال الإشعار",
            message: `هيتبعت الإشعار ده فورًا لكل العميلات المفعّلة عندهم الإشعارات - "${title}". متأكدة؟`,
            confirmLabel: "ابعتي الإشعار",
        });
        if (!confirmed) return;

        sendBtn.disabled = true;
        sendBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...`;

        try {
            const result = await window.BoseAdmin.sendPushNotification({ title, body, url });
            showLastResult(result);
            window.BoseAdminUI.showToast("اتبعت الإشعار بنجاح", "success");
            titleInput.value = "";
            bodyInput.value = "";
            urlInput.value = "/";
            document.getElementById("pn-title-count").textContent = "0 / 80";
            document.getElementById("pn-body-count").textContent = "0 / 200";
            updatePreview();
        } catch (err) {
            window.BoseAdminUI.showToast(err.message || "تعذر إرسال الإشعار", "error");
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> إرسال الإشعار الآن`;
        }
    }

    function init() {
        loadSubscriberCount();
        wireCounters();
        updatePreview();
        document.getElementById("pn-send-btn").addEventListener("click", handleSend);
    }

    document.addEventListener("BoseAdminReady", init);
})();
