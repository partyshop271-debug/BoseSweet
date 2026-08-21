/**
 * cart-reminder.js
 * =====================================================================
 * 🛎️ تذكير السلة - محرك مستقل بالكامل (مالوش أي اعتماد على core-engine.js
 * أو cart-engine.js) بيقرأ سلة المشتريات مباشرة من localStorage (نفس مفتاح
 * `bose_cart` اللي بيستخدمه cart-engine.js) وبيظهر شريط تذكير لطيف تحت
 * الشاشة لو العميلة سايبة منتجات في السلة من غير ما تكمل الطلب لفترة.
 *
 * الفلسفة:
 *  - أول ما السلة تبقى فيها منتجات، بنسجّل وقت أول ظهور لها في
 *    bose_cart_idle_since. أي تغيير حقيقي في محتوى السلة (إضافة/حذف/تغيير
 *    كمية) بيصفّر الوقت من جديد - يعني التذكير بيتفعّل بس لو السلة *فاضلة
 *    زي ما هي* لفترة، مش أول ما تتحط فيها حاجة.
 *  - لو العميلة قفلت التذكير، بنأجله (snooze) لمدة معينة بدل ما نلغيه
 *    نهائياً، عشان لو رجعت تاني بعد كذا ساعة تتذكّر من جديد.
 *  - الشريط بيتحقن بنفسه، مالوش أي HTML لازم يتضاف في الصفحة - بس ضيفي
 *    <script src="js/cart-reminder.js?v=1" defer></script> في أي صفحة تصفح
 *    (الرئيسية، المنيو، الفئة، صفحة المنتج، العروض). ملهوش داعي في صفحات
 *    السلة/الدفع/نجاح الطلب نفسها.
 */
(function () {
    "use strict";

    const CART_KEY = "bose_cart";
    const IDLE_SINCE_KEY = "bose_cart_idle_since";
    const SIGNATURE_KEY = "bose_cart_reminder_signature";
    const SNOOZED_UNTIL_KEY = "bose_cart_reminder_snoozed_until";

    const IDLE_THRESHOLD_MS = 30 * 60 * 1000; // نصف ساعة سكون قبل ما الشريط يظهر
    const SNOOZE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 ساعات لو اتقفل يدوياً
    const CHECK_INTERVAL_MS = 60 * 1000; // إعادة الفحص كل دقيقة من غير ما نعمل reload

    const STYLE_ID = "bose-cart-reminder-style";
    const BANNER_ID = "bose-cart-reminder-banner";

    function readCart() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    /** توقيع بسيط لمحتوى السلة عشان نكتشف أي تغيير حقيقي (إضافة/حذف/تغيير كمية) */
    function buildCartSignature(cart) {
        return cart.map((item) => `${item.id}:${item.quantity}`).sort().join("|");
    }

    function cartItemCount(cart) {
        return cart.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
    }

    function cartTotal(cart) {
        const raw = cart.reduce((sum, item) => sum + (parseFloat(item.finalPrice) || 0) * (parseInt(item.quantity, 10) || 0), 0);
        return Math.round(raw); // بنقرّب مرة واحدة بس على الإجمالي، بنفس قاعدة التسعير المتبعة في الموقع
    }

    function injectStyleOnce() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${BANNER_ID} {
                position: fixed; inset-inline: 12px; bottom: 12px; z-index: 9999;
                max-width: 460px; margin-inline: auto;
                background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);
                border: 1px solid rgba(255,145,164,0.25);
                padding: 14px 16px; display: flex; align-items: center; gap: 12px;
                font-family: 'Cairo', sans-serif; direction: rtl;
                animation: bcr-slide-up .35s ease;
            }
            @keyframes bcr-slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            #${BANNER_ID} .bcr-icon {
                width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; background: rgba(255,145,164,0.12); color: #FF91A4;
                display: flex; align-items: center; justify-content: center; font-size: 1.15rem;
            }
            #${BANNER_ID} .bcr-text { flex: 1; min-width: 0; }
            #${BANNER_ID} .bcr-title { font-size: 0.86rem; font-weight: 800; color: #111; margin: 0 0 2px; }
            #${BANNER_ID} .bcr-sub { font-size: 0.74rem; color: #111; opacity: 0.65; margin: 0; }
            #${BANNER_ID} .bcr-cta {
                flex-shrink: 0; background: linear-gradient(135deg, #FF91A4, #ff7d95); color: #fff; border: none;
                border-radius: 10px; padding: 9px 14px; font-family: 'Cairo', sans-serif; font-weight: 800; font-size: 0.78rem;
                cursor: pointer; text-decoration: none; display: inline-block; white-space: nowrap;
            }
            #${BANNER_ID} .bcr-close {
                flex-shrink: 0; background: none; border: none; color: #111; opacity: 0.4; font-size: 1rem; cursor: pointer; padding: 4px;
            }
            @media (max-width: 380px) {
                #${BANNER_ID} { flex-wrap: wrap; }
                #${BANNER_ID} .bcr-cta { order: 3; width: 100%; text-align: center; }
            }
        `;
        document.head.appendChild(style);
    }

    function removeBanner() {
        const existing = document.getElementById(BANNER_ID);
        if (existing) existing.remove();
    }

    function showBanner(cart) {
        if (document.getElementById(BANNER_ID)) return; // الشريط ظاهر فعلاً، متعرضهوش تاني

        injectStyleOnce();
        const count = cartItemCount(cart);
        const total = cartTotal(cart);
        const itemWord = count === 1 ? "منتج" : "منتجات";

        const banner = document.createElement("div");
        banner.id = BANNER_ID;
        banner.setAttribute("role", "status");
        banner.innerHTML = `
            <span class="bcr-icon"><i class="fa-solid fa-cart-shopping"></i></span>
            <span class="bcr-text">
                <p class="bcr-title">لسه في ${count} ${itemWord} في سلتك</p>
                <p class="bcr-sub">بإجمالي ${total.toLocaleString("ar-EG")} جنيه - أكملي طلبك قبل ما ينفد المخزون</p>
            </span>
            <a class="bcr-cta" href="cart.html">أكملي طلبك</a>
            <button type="button" class="bcr-close" aria-label="إغلاق التذكير"><i class="fa-solid fa-xmark"></i></button>
        `;
        document.body.appendChild(banner);

        banner.querySelector(".bcr-close").addEventListener("click", () => {
            try {
                localStorage.setItem(SNOOZED_UNTIL_KEY, String(Date.now() + SNOOZE_DURATION_MS));
            } catch (e) { /* localStorage غير متاح - تجاهل بهدوء */ }
            removeBanner();
        });
    }

    function evaluate() {
        const cart = readCart();

        if (cart.length === 0) {
            // السلة فاضية - نصفّر كل حاجة ونشيل الشريط لو ظاهر
            try {
                localStorage.removeItem(IDLE_SINCE_KEY);
                localStorage.removeItem(SIGNATURE_KEY);
            } catch (e) { /* تجاهل */ }
            removeBanner();
            return;
        }

        let idleSince, lastSignature, snoozedUntil;
        try {
            idleSince = parseInt(localStorage.getItem(IDLE_SINCE_KEY), 10);
            lastSignature = localStorage.getItem(SIGNATURE_KEY);
            snoozedUntil = parseInt(localStorage.getItem(SNOOZED_UNTIL_KEY), 10) || 0;
        } catch (e) {
            return; // localStorage مش متاح (وضع تصفح خاص صارم مثلاً) - متعملش حاجة
        }

        const currentSignature = buildCartSignature(cart);

        if (!idleSince || lastSignature !== currentSignature) {
            // أول مرة السلة بالمحتوى ده، أو المحتوى اتغيّر فعلياً - نبدأ عدّاد السكون من جديد
            try {
                localStorage.setItem(IDLE_SINCE_KEY, String(Date.now()));
                localStorage.setItem(SIGNATURE_KEY, currentSignature);
            } catch (e) { /* تجاهل */ }
            removeBanner();
            return;
        }

        const idleMs = Date.now() - idleSince;
        if (idleMs < IDLE_THRESHOLD_MS) {
            removeBanner();
            return;
        }

        if (Date.now() < snoozedUntil) {
            return; // العميلة قفلت الشريط قبل كده، لسه في فترة التأجيل
        }

        showBanner(cart);
    }

    function init() {
        evaluate();
        // إعادة فحص دورية بدون reload - يغطي حالة إن العميلة سايبة التاب مفتوح لفترة طويلة
        setInterval(evaluate, CHECK_INTERVAL_MS);
        // لو اتفتحت السلة في تاب تاني وأثّرت على localStorage، نحدّث فوراً
        window.addEventListener("storage", (e) => {
            if (e.key === CART_KEY) evaluate();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
