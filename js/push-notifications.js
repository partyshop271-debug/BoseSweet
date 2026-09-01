/**
 * js/push-notifications.js
 * =====================================================================
 * 🔔 [نظام الإشعارات]: يدير اشتراك جهاز العميل في Web Push Notifications
 * (عروض/نقاط ولاء تتبعت من لوحة التحكم عبر Edge Function send-push-notification)
 * وبيعرض بانر بسيط لطلب الإذن - منفصل عمداً عن نافذة "ثبّتي التطبيق" الكبيرة
 * (setupAppInstallPopup في core-engine.js) عشان النافذتين متتكدّسش فوق بعض،
 * وعشان تفعيل الإشعارات خطوة منفصلة عن التثبيت نفسه (ممكن العميل يثبّت من
 * غير ما يفعّل إشعارات، أو العكس على أندرويد/ديسكتوب اللي بيسمحوا بإشعارات
 * حتى من غير تثبيت PWA).
 *
 * لازم يتحمّل بعد js/supabase-client.js (بيستخدم window.BoseSupabase).
 * <script src="js/push-notifications.js?v=1.0" defer></script>
 */

(function () {
    "use strict";

    // 🔑 مفتاح VAPID العلني - آمن للعرض في كود العميل (ده بالظبط الغرض منه،
    // بعكس المفتاح الخاص اللي متخزّن كـ Edge Function secret على السيرفر بس).
    const VAPID_PUBLIC_KEY = "BMUAHJ-o5Z1BgZJkT7D7RNWDNzvuzaZFAzg1k3WATf55XlR4dODO68gZ6UrtETsRF2Ig_lA8PhrfGfMVAkOAg2U";

    const LS_PERMANENTLY_DISMISSED = "bose_push_prompt_permanently_dismissed";
    const SS_DISMISSED_THIS_SESSION = "bose_push_prompt_dismissed_this_session";

    function isPushSupported() {
        return (
            "serviceWorker" in navigator &&
            "PushManager" in window &&
            "Notification" in window
        );
    }

    /** تحويل مفتاح VAPID من Base64Url إلى Uint8Array (الصيغة اللي pushManager.subscribe محتاجها) */
    function urlBase64ToUint8Array(base64String) {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i++) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async function getServiceWorkerRegistration() {
        if (!("serviceWorker" in navigator)) return null;
        // core-engine.js بيسجّل نفس sw.js ده أصلاً لأغراض PWA installability -
        // بنستخدم .ready عشان نتأكد إنه اتفعّل فعلاً قبل ما نحاول نشترك.
        try {
            await navigator.serviceWorker.register("/sw.js");
        } catch (e) {
            /* لو اتسجل قبل كده، register() هترجع نفس التسجيل من غير مشاكل */
        }
        return navigator.serviceWorker.ready;
    }

    async function isCurrentlySubscribed() {
        if (!isPushSupported()) return false;
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) return false;
            const sub = await reg.pushManager.getSubscription();
            return !!sub;
        } catch (e) {
            return false;
        }
    }

    /**
     * يطلب إذن الإشعارات من المتصفح، يشترك في PushManager، ويحفظ الاشتراك في
     * قاعدة البيانات. بيرجع true لو نجح.
     */
    async function subscribeToBosePush() {
        if (!isPushSupported()) return false;
        try {
            if (Notification.permission === "denied") return false;

            const permission = await Notification.requestPermission();
            if (permission !== "granted") return false;

            const registration = await getServiceWorkerRegistration();
            if (!registration) return false;

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });
            }

            if (window.BoseSupabase && typeof window.BoseSupabase.savePushSubscription === "function") {
                await window.BoseSupabase.savePushSubscription(subscription.toJSON());
            }
            return true;
        } catch (err) {
            console.error("bose push subscribe failed:", err);
            return false;
        }
    }

    async function unsubscribeFromBosePush() {
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) return true;
            const subscription = await reg.pushManager.getSubscription();
            if (!subscription) return true;

            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();

            if (window.BoseSupabase && typeof window.BoseSupabase.removePushSubscription === "function") {
                await window.BoseSupabase.removePushSubscription(endpoint);
            }
            return true;
        } catch (err) {
            console.error("bose push unsubscribe failed:", err);
            return false;
        }
    }

    /* ============================= بانر طلب تفعيل الإشعارات ============================= */

    function injectPromptStyles() {
        if (document.getElementById("bose-push-prompt-styles")) return;
        const style = document.createElement("style");
        style.id = "bose-push-prompt-styles";
        style.textContent = `
            .bose-push-prompt-card {
                position: fixed;
                z-index: 99998;
                bottom: 18px;
                inset-inline-end: 18px;
                inset-inline-start: 18px;
                max-width: 380px;
                margin-inline-start: auto;
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.18);
                border: 1px solid rgba(255,145,164,0.35);
                padding: 16px 18px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                direction: rtl;
                font-family: inherit;
                animation: bosePushPromptIn 0.35s ease;
            }
            @keyframes bosePushPromptIn {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .bose-push-prompt-icon {
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--bose-pink, #FF91A4);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            }
            .bose-push-prompt-body { flex: 1; min-width: 0; }
            .bose-push-prompt-title { font-weight: 700; font-size: 15px; color: #111; margin: 0 0 4px; }
            .bose-push-prompt-desc { font-size: 13px; color: #555; margin: 0 0 12px; line-height: 1.5; }
            .bose-push-prompt-actions { display: flex; gap: 8px; }
            .bose-push-prompt-cta {
                background: var(--bose-pink-text, #FF91A4);
                color: #fff;
                border: none;
                border-radius: 10px;
                padding: 8px 14px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }
            .bose-push-prompt-later {
                background: transparent;
                color: #777;
                border: none;
                font-size: 13px;
                cursor: pointer;
                padding: 8px 6px;
            }
            .bose-push-prompt-close {
                position: absolute;
                top: 8px;
                inset-inline-end: 10px;
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 14px;
            }
            @media (max-width: 480px) {
                .bose-push-prompt-card { inset-inline-start: 12px; inset-inline-end: 12px; max-width: none; }
            }
        `;
        document.head.appendChild(style);
    }

    function closePrompt(permanently) {
        const card = document.getElementById("bose-push-prompt-card");
        if (card) card.remove();
        if (permanently) localStorage.setItem(LS_PERMANENTLY_DISMISSED, "true");
        sessionStorage.setItem(SS_DISMISSED_THIS_SESSION, "true");
    }

    function showPushPrompt() {
        if (document.getElementById("bose-push-prompt-card")) return;
        injectPromptStyles();

        const html = `
            <div id="bose-push-prompt-card" class="bose-push-prompt-card" role="dialog" aria-label="تفعيل الإشعارات">
                <button type="button" class="bose-push-prompt-close" id="bose-push-prompt-close-btn" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>
                <div class="bose-push-prompt-icon"><i class="fa-solid fa-bell"></i></div>
                <div class="bose-push-prompt-body">
                    <p class="bose-push-prompt-title">فعّلي إشعارات حلويات بوسي 🔔</p>
                    <p class="bose-push-prompt-desc">تعرفي أول بأول بعروضنا الجديدة وقسائم مكافآتك - تقدري توقفها في أي وقت</p>
                    <div class="bose-push-prompt-actions">
                        <button type="button" class="bose-push-prompt-cta" id="bose-push-prompt-enable-btn">فعّلي الإشعارات</button>
                        <button type="button" class="bose-push-prompt-later" id="bose-push-prompt-later-btn">مش دلوقتي</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", html);

        const closeBtn = document.getElementById("bose-push-prompt-close-btn");
        const laterBtn = document.getElementById("bose-push-prompt-later-btn");
        const enableBtn = document.getElementById("bose-push-prompt-enable-btn");

        if (closeBtn) closeBtn.addEventListener("click", () => closePrompt(false));
        if (laterBtn) laterBtn.addEventListener("click", () => closePrompt(false));
        if (enableBtn) {
            enableBtn.addEventListener("click", async () => {
                enableBtn.disabled = true;
                enableBtn.textContent = "جاري التفعيل...";
                const ok = await subscribeToBosePush();
                // ننجح أو نفشل، بنقفل البانر دايماً ومنرجعش نضايق العميل تاني في
                // نفس الجلسة؛ لو رفض الإذن من المتصفح نفسه، بنعتبرها "دلوقتي لأ"
                // مش رفض دائم (تحسباً لو غيّر رأيه من إعدادات المتصفح بعدين).
                closePrompt(ok);
            });
        }
    }

    async function maybeShowPushPrompt() {
        if (!isPushSupported()) return;
        if (Notification.permission === "denied" || Notification.permission === "granted") return;
        if (localStorage.getItem(LS_PERMANENTLY_DISMISSED) === "true") return;
        if (sessionStorage.getItem(SS_DISMISSED_THIS_SESSION) === "true") return;

        const currentPath = window.location.pathname;
        // 🛡️ نفس فلسفة نافذة تثبيت التطبيق: منزعجش العميل وهو وسط السلة/الدفع
        if (currentPath.endsWith("/cart.html") || currentPath.endsWith("/checkout.html")) return;

        if (await isCurrentlySubscribed()) return;

        setTimeout(showPushPrompt, 4000);
    }

    window.BoseNotifications = {
        subscribe: subscribeToBosePush,
        unsubscribe: unsubscribeFromBosePush,
        isSubscribed: isCurrentlySubscribed,
        isSupported: isPushSupported,
    };

    // بعد ما العميل يثبّت التطبيق فعلياً (appinstalled من core-engine.js)، دي أنسب
    // لحظة نطلب فيها الإشعارات - العميل لسه في حماس التثبيت.
    window.addEventListener("appinstalled", () => {
        setTimeout(maybeShowPushPrompt, 1500);
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", maybeShowPushPrompt);
    } else {
        maybeShowPushPrompt();
    }
})();
