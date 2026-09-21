/**
 * order-alerts-page.js - منطق صفحة "تنبيهات الطلبات" فقط
 * =====================================================================
 * الهدف: صاحبة المتجر تعرف بالدليل (مش بالتخمين) إن أي طلب جديد هيوصلها فورًا.
 * الصفحة بتعرض حالة كل قناة تنبيه من السيرفر مباشرة (get_admin_alert_status)،
 * وبتخلّيها تفعّل إشعارات الموبايل على الجهاز الحالي، وتربط تيليجرام كقناة احتياطية،
 * وتشوف سجل آخر محاولات الإرسال الفعلية.
 * منطق الإرسال نفسه على السيرفر (Edge Function: notify-new-order) - الصفحة دي واجهة تحكم ومراقبة بس.
 */
(function () {
    "use strict";

    function e(v) { return window.BoseAdminUI.escapeHtml(v); }
    function $(id) { return document.getElementById(id); }

    /** تاريخ + وقت بتوقيت القاهرة بنظام 12 ساعة (1-12 صباحًا/مساءً) - مش 24 ساعة أبدًا */
    function formatCairoDateTime(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Africa/Cairo", day: "numeric", month: "numeric",
            hour: "numeric", minute: "2-digit", hourCycle: "h23",
        }).formatToParts(d).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
        const h = parseInt(parts.hour, 10);
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${parts.day}/${parts.month} - ${h12}:${parts.minute} ${h < 12 ? "صباحًا" : "مساءً"}`;
    }

    function timeAgoAr(iso) {
        if (!iso) return "";
        const ms = Date.now() - new Date(iso).getTime();
        if (isNaN(ms) || ms < 0) return "";
        const min = Math.floor(ms / 60000);
        if (min < 1) return "من أقل من دقيقة";
        if (min < 60) return `من ${min} دقيقة`;
        const hrs = Math.floor(min / 60);
        if (hrs < 48) return `من ${hrs} ساعة`;
        return `من ${Math.floor(hrs / 24)} يوم`;
    }

    let lastStatus = null;

    /* ------------------------------ الحالة العامة ------------------------------ */
    function renderHero(status) {
        const hero = $("oa-hero");
        const push = Number(status.push_devices) || 0;
        const tg = !!status.telegram_configured;
        const channels = (push > 0 ? 1 : 0) + (tg ? 1 : 0);
        const unnotified = Number(status.unnotified_orders) || 0;

        let level, icon, title, text;
        if (channels === 0) {
            level = "red";
            icon = "fa-triangle-exclamation";
            title = "التنبيهات مش شغالة دلوقتي";
            text = "مفيش ولا جهاز ولا تيليجرام مفعّل، يعني أي طلب جديد هيتسجّل في الموقع من غير ما يوصلك أي تنبيه." +
                (unnotified ? ` فيه فعلًا ${unnotified} طلب اتسجّل ولسه محدش نبّهك بيه.` : "") +
                " فعّلي إشعارات الموبايل تحت (بتاخد أقل من دقيقة).";
        } else if (channels === 1) {
            level = "amber";
            icon = "fa-shield-halved";
            title = "التنبيهات شغالة بقناة واحدة";
            text = "كويس، بس قناة واحدة معناها لو وقفت (بطارية موفّرة، مسح بيانات المتصفح، موبايل اتغيّر) هتفوتك طلبات من غير ما تعرفي. " +
                "الأفضل تضيفي القناة التانية.";
        } else {
            level = "green";
            icon = "fa-circle-check";
            title = "التنبيهات شغالة ومحمية بقناتين";
            text = "أي طلب جديد هيوصلك على الموبايل وعلى تيليجرام في نفس اللحظة، وبيتكرر التذكير لحد ما تراجعيه.";
        }
        hero.setAttribute("data-level", level);
        hero.innerHTML = `
            <div class="oa-hero-icon"><i class="fa-solid ${icon}"></i></div>
            <div><h2>${e(title)}</h2><p>${e(text)}</p></div>`;
    }

    /* ------------------------------ إشعارات الموبايل ------------------------------ */
    async function renderPush(status) {
        const devices = Number(status.push_devices) || 0;
        const badge = $("oa-push-badge");
        const meta = $("oa-push-meta");
        const btn = $("oa-push-btn");
        const label = $("oa-push-btn-label");

        badge.className = "adm-badge " + (devices > 0 ? "success" : "danger");
        badge.textContent = devices > 0 ? `${devices.toLocaleString("ar-EG")} جهاز مفعّل` : "مفيش جهاز مفعّل";

        const lastOk = status.push_last_ok ? `آخر إشعار وصل ${timeAgoAr(status.push_last_ok)} (${formatCairoDateTime(status.push_last_ok)}).` : "لسه مفيش إشعار اتبعت بنجاح.";
        meta.textContent = devices > 0 ? lastOk : "لسه مفيش أي موبايل مفعّل لاستلام تنبيهات الطلبات.";

        const state = await window.BoseOrderAlerts.getDeviceState();
        const map = {
            on: ["fa-paper-plane", "الجهاز ده مفعّل - ابعتي إشعار تجريبي"],
            off: ["fa-bell", "فعّلي على الجهاز ده"],
            denied: ["fa-bell-slash", "الإشعارات محظورة - شوفي الحل"],
            unsupported: ["fa-bell-slash", "الجهاز ده مش بيدعم - شوفي الحل"],
        };
        const [iconClass, text] = map[state] || map.off;
        btn.querySelector("i").className = "fa-solid " + iconClass;
        label.textContent = text;
    }

    /* ------------------------------ تيليجرام ------------------------------ */
    function showTgMsg(kind, text) {
        const box = $("oa-tg-msg");
        if (!text) { box.style.display = "none"; return; }
        box.style.display = "";
        box.setAttribute("data-kind", kind);
        box.textContent = text;
    }

    function renderTelegram(status) {
        const connected = !!status.telegram_configured;
        const badge = $("oa-tg-badge");
        const meta = $("oa-tg-meta");

        badge.className = "adm-badge " + (connected ? "success" : "neutral");
        badge.textContent = connected ? "مربوط" : "مش مربوط";

        $("oa-tg-setup").style.display = connected ? "none" : "";
        $("oa-tg-connected").style.display = connected ? "" : "none";

        if (connected) {
            const who = status.telegram_chat_name ? ` على حساب ${status.telegram_chat_name}` : "";
            const last = status.telegram_last_ok ? ` آخر رسالة وصلت ${timeAgoAr(status.telegram_last_ok)}.` : "";
            meta.textContent = `تنبيهات الطلبات بتتبعت كمان${who}.${last}`;
        } else {
            meta.textContent = "قناة مستقلة تمامًا عن المتصفح: بتوصل حتى لو الموبايل مسح بيانات الموقع أو الإشعارات اتقفلت. بتاخد 3 دقايق مرة واحدة.";
        }
    }

    async function handleTelegramConnect() {
        const input = $("oa-tg-token");
        const btn = $("oa-tg-connect-btn");
        const token = input.value.trim();
        if (!token) {
            showTgMsg("error", "الصقي توكن البوت الأول.");
            return;
        }
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري الربط...`;
        showTgMsg("", "");
        try {
            const res = await window.BoseAdmin.connectTelegramAlerts(token);
            if (res && res.ok) {
                input.value = "";
                showTgMsg("ok", `اتربط تيليجرام${res.chat_name ? " على حساب " + res.chat_name : ""} ✓ - المفروض وصلتك رسالة تأكيد دلوقتي.`);
                window.BoseAdminUI.showToast("اتربط تيليجرام بنجاح", "success");
                document.dispatchEvent(new CustomEvent("bose-alert-channel-changed"));
                await refresh();
            } else {
                showTgMsg("error", (res && (res.message || res.error)) || "تعذر ربط تيليجرام، جرّبي تاني.");
            }
        } catch (err) {
            showTgMsg("error", "تعذر الاتصال بالسيرفر: " + (err.message || "خطأ غير معروف"));
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-link"></i> اربطي تيليجرام`;
        }
    }

    async function handleTelegramTest() {
        const btn = $("oa-tg-test-btn");
        btn.disabled = true;
        try {
            const res = await window.BoseAdmin.sendTestOrderAlert();
            const tg = res && res.telegram;
            if (tg && tg.configured && tg.ok) {
                showTgMsg("ok", "بعتنالك رسالة تجريبية على تيليجرام - راجعي المحادثة مع البوت.");
            } else {
                showTgMsg("error", "الرسالة ما وصلتش" + (tg && tg.error ? ": " + tg.error : "") + ". جرّبي تفكّي الربط وتربطي تاني.");
            }
            await refresh();
        } catch (err) {
            showTgMsg("error", "تعذر إرسال الرسالة التجريبية: " + (err.message || ""));
        } finally {
            btn.disabled = false;
        }
    }

    async function handleTelegramDisconnect() {
        const ok = await window.BoseAdminUI.confirmAction({
            title: "فكّ ربط تيليجرام",
            message: "هتتوقف تنبيهات الطلبات على تيليجرام. لو ده القناة الوحيدة المفعّلة، التنبيهات هتقف خالص. متأكدة؟",
            confirmLabel: "فكّي الربط",
        });
        if (!ok) return;
        try {
            await window.BoseAdmin.disconnectTelegramAlerts();
            showTgMsg("", "");
            window.BoseAdminUI.showToast("اتفكّ ربط تيليجرام", "success");
            document.dispatchEvent(new CustomEvent("bose-alert-channel-changed"));
            await refresh();
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر فكّ الربط: " + (err.message || ""), "error");
        }
    }

    /* ------------------------------ الطلبات المستنية ------------------------------ */
    function renderBacklog(status) {
        const card = $("oa-backlog-card");
        const pending = Number(status.pending_orders) || 0;
        const unnotified = Number(status.unnotified_orders) || 0;
        if (!pending) { card.style.display = "none"; return; }
        card.style.display = "";
        const oldest = status.oldest_pending_at ? ` أقدمهم مستني ${timeAgoAr(status.oldest_pending_at)}.` : "";
        const notNotified = unnotified ? ` منهم ${unnotified} لسه ماوصلكيش عنهم تنبيه.` : "";
        $("oa-backlog-text").textContent = `فيه ${pending} طلب منتظر مراجعتك وتأكيد الحجز.${oldest}${notNotified}`;
    }

    /* ------------------------------ سجل الإرسال ------------------------------ */
    const CHANNEL_LABELS = { push: "موبايل", telegram: "تيليجرام" };
    const KIND_LABELS = { new_order: "طلب جديد", reminder: "تذكير", test: "تجربة", setup: "ربط" };

    async function renderLog() {
        const card = $("oa-log-card");
        const rows = await window.BoseAdmin.getAlertDeliveries(15);
        if (rows === null) { card.style.display = "none"; return; }
        card.style.display = "";
        const body = $("oa-log-body");
        if (!rows.length) {
            body.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888;">لسه مفيش أي محاولة إرسال اتسجّلت.</td></tr>`;
            return;
        }
        body.innerHTML = rows.map((r) => `
            <tr>
                <td>${e(formatCairoDateTime(r.created_at))}</td>
                <td>${e(CHANNEL_LABELS[r.channel] || r.channel)}</td>
                <td>${e(KIND_LABELS[r.kind] || r.kind)}</td>
                <td>${r.order_number ? `<span class="oa-ltr">${e(r.order_number)}</span>` : "-"}</td>
                <td>${r.ok
                    ? `<span class="adm-badge success">وصل</span>`
                    : `<span class="adm-badge danger">فشل</span>${r.detail ? ` <small style="color:#888;">${e(r.detail)}</small>` : ""}`}</td>
            </tr>`).join("");
    }

    /* ------------------------------ تحميل وتحديث ------------------------------ */
    async function refresh() {
        try {
            const status = await window.BoseAdmin.getAdminAlertStatus();
            lastStatus = status;
            renderHero(status);
            await renderPush(status);
            renderTelegram(status);
            renderBacklog(status);
            await renderLog();
            // الشريط التحذيري العام في اللوحة لازم يفضل متزامن مع نفس الحالة
            if (window.BoseOrderAlerts) window.BoseOrderAlerts.refreshHealth();
        } catch (err) {
            const hero = $("oa-hero");
            hero.setAttribute("data-level", "amber");
            hero.innerHTML = `
                <div class="oa-hero-icon"><i class="fa-solid fa-plug-circle-exclamation"></i></div>
                <div><h2>تعذر قراءة حالة التنبيهات</h2><p>${e(err.message || "خطأ غير معروف")} - حدّثي الصفحة، ولو المشكلة فضلت قوليلي.</p></div>`;
        }
    }

    async function handlePushButton() {
        const btn = $("oa-push-btn");
        btn.disabled = true;
        try {
            await window.BoseOrderAlerts.runDeviceAction();
        } finally {
            btn.disabled = false;
            await refresh();
        }
    }

    function init() {
        $("oa-push-btn").addEventListener("click", handlePushButton);
        $("oa-tg-connect-btn").addEventListener("click", handleTelegramConnect);
        $("oa-tg-test-btn").addEventListener("click", handleTelegramTest);
        $("oa-tg-disconnect-btn").addEventListener("click", handleTelegramDisconnect);
        $("oa-tg-token").addEventListener("keydown", (ev) => { if (ev.key === "Enter") handleTelegramConnect(); });

        document.addEventListener("bose-alert-channel-changed", () => { if (lastStatus !== null) refresh(); });
        refresh();
        // تحديث تلقائي بسيط عشان "آخر إرسال" والطلبات المستنية متبقاش قديمة والصفحة مفتوحة
        setInterval(refresh, 60000);
    }

    document.addEventListener("BoseAdminReady", init);
})();
