/**
 * =========================================================================
 * 📞 js/phone-utils.js — المصدر الوحيد لتطبيع وتحقق أرقام الموبايل المصرية
 * =========================================================================
 * لازم يتحمّل قبل أي ملف تاني بيستخدم أرقام موبايل (core-engine.js،
 * cart-engine.js، gift-card-engine.js، admin/js/admin-data.js).
 *
 * سبب وجوده: القاعدة القديمة كانت بتشيل قايمة محددة من المحارف
 * (مسافة/شرطة/أقواس/+) وبعدين تطابق regex على ASCII. أي حرف اتجاه مخفي
 * (LRM U+200E / RLM U+200F / ALM U+061C) - وده بيتحط تلقائياً لما أندرويد
 * يلزق رقم من جهات الاتصال جوه صفحة عربية - أو أرقام عربية-هندية (٠١٥)
 * أو zero-width كان بيعدّي جوه النص ويكسر المطابقة بصمت، فالعميلة تشوف
 * رقمها سليم قدامها والموقع يرفضه. القاعدة الجديدة عكسية بالكامل:
 * "استخرج الأرقام بس، وارمي أي حاجة تانية".
 */
(function () {
    "use strict";

    /** بادئات شبكات مصر - المكان الوحيد اللي بتتعدل منه في المشروع كله */
    const BOSE_EG_MOBILE_PREFIXES = ["010", "011", "012", "015"];

    /** بيحوّل الأرقام العربية-الهندية (٠-٩) والفارسية (۰-۹) لـ ASCII */
    function boseFoldUnicodeDigits(str) {
        return String(str).replace(/[\u0660-\u0669\u06F0-\u06F9]/g, function (ch) {
            const code = ch.charCodeAt(0);
            const base = code >= 0x06F0 ? 0x06F0 : 0x0660;
            return String(code - base);
        });
    }

    /**
     * 🛡️ التطبيع الصارم: بيرجّع رقم محلي مصري بصيغة 01XXXXXXXXX.
     * بيرمي كل محرف مش رقم (مسافات، شرطات، نقط، أقواس، +، علامات الاتجاه
     * المخفية، zero-width، أي حاجة مستقبلية متوقعناهاش).
     * @param {string} phone
     * @returns {string}
     */
    window.sanitizeBosePhoneNumber = function (phone) {
        if (phone === null || phone === undefined) return "";

        let digits = boseFoldUnicodeDigits(phone).replace(/\D+/g, "");
        if (!digits) return "";

        // تقشير الصيغ الدولية بأي شكل اتكتبت بيه
        if (digits.startsWith("0020")) digits = digits.slice(4);
        else if (digits.startsWith("002")) digits = digits.slice(3);
        else if (digits.startsWith("20") && digits.length >= 12) digits = digits.slice(2);

        // 1552484627 → 01552484627
        if (digits.length === 10 && digits.startsWith("1")) digits = "0" + digits;

        return digits;
    };

    /**
     * 🛡️ التحقق - بيشتغل على النص بعد التطبيع بس.
     * @param {string} phone
     * @param {boolean} isOptional - لو true، الفاضي يعتبر صحيح
     * @returns {boolean}
     */
    window.validateBosePhoneNumber = function (phone, isOptional) {
        if (isOptional === undefined) isOptional = false;
        if (!phone || String(phone).trim() === "") return isOptional;
        const cleaned = window.sanitizeBosePhoneNumber(phone);
        if (cleaned.length !== 11) return false;
        return BOSE_EG_MOBILE_PREFIXES.indexOf(cleaned.slice(0, 3)) !== -1;
    };

    window.BOSE_EG_MOBILE_PREFIXES = BOSE_EG_MOBILE_PREFIXES;
    window.BOSE_PHONE_ERROR_MESSAGE =
        "من فضلك اكتبي رقم موبايل مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015).";

    /**
     * 📊 بيسجّل كل رفض لرقم بالقيمة الخام وبالـcodepoints بتاعتها، عشان أي
     * علة مخفية جديدة تبان في لوحة التحكم بدل ما نستنى عميلة تشتكي.
     * وبعد رفضين بيفتح مخرج واتساب عشان مفيش طلب يضيع مهما حصل.
     */
    window.boseRegisterPhoneRejection = function (rawValue, inputEl) {
        window.__bosePhoneFailCount = (window.__bosePhoneFailCount || 0) + 1;

        try {
            // logBoseClientEvent متعرّفة في js/supabase-client.js وبتكتب في جدول
            // client_error_events (إدخال عام، قراءة للأدمن بس).
            if (window.BoseSupabase && typeof window.BoseSupabase.logBoseClientEvent === "function") {
                window.BoseSupabase.logBoseClientEvent("phone_validation_rejected", {
                    raw: rawValue,
                    codepoints: Array.from(String(rawValue || "")).map(function (c) { return c.codePointAt(0); }),
                    normalized: window.sanitizeBosePhoneNumber(rawValue),
                    attempt: window.__bosePhoneFailCount,
                    ua: navigator.userAgent
                });
            }
        } catch (e) { /* التسجيل ممنوع يوقف الطلب تحت أي ظرف */ }

        if (window.__bosePhoneFailCount >= 2) {
            boseShowPhoneEscapeHatch(rawValue, inputEl);
        }
    };

    function boseShowPhoneEscapeHatch(rawValue, inputEl) {
        const host = inputEl || document.getElementById("checkout-customer-phone");
        if (!host || !host.parentNode) return;
        if (document.getElementById("bose-phone-escape-hatch")) return;

        const wa = (typeof window.buildBoseWhatsappLink === "function")
            ? window.buildBoseWhatsappLink("عندي مشكلة في إدخال رقم الموبايل في الشيك أوت، ورقمي هو: " + rawValue)
            : "https://wa.me/201097238441";

        const box = document.createElement("div");
        box.id = "bose-phone-escape-hatch";
        box.style.cssText = "margin-top:10px;padding:12px;border-radius:12px;background:#FFF4F6;" +
            "border:1px solid var(--bose-pink, #FF91A4);font-size:.9rem;line-height:1.7;";
        box.innerHTML =
            "حصلت مشكلة في تسجيل رقمك؟ متقلقيش خالص - ابعتيلنا على واتساب وهنكمّل طلبك معاكِ بنفسنا في دقيقة." +
            '<a href="' + wa + '" target="_blank" rel="noopener" ' +
            'style="display:block;margin-top:8px;text-align:center;background:#25D366;color:#fff;' +
            'padding:10px;border-radius:10px;font-weight:800;text-decoration:none;">كمّلي طلبك على واتساب</a>';
        host.parentNode.appendChild(box);
    }

    /**
     * 🩺 الحارس الحي على حقل رقم الهاتف في الشيك أوت: بينضّف الرقم وهي
     * بتكتب أو بتلزق، وبيوريها لحظياً هل الرقم مظبوط ولا ناقص - بدل ما
     * تكتشف المشكلة وهي واقفة على زرار "تأكيد الطلب".
     */
    window.initBosePhoneFieldGuard = function (inputId) {
        const input = document.getElementById(inputId || "checkout-customer-phone");
        if (!input || input.dataset.bosePhoneGuard === "on") return;
        input.dataset.bosePhoneGuard = "on";

        input.setAttribute("inputmode", "numeric");
        input.setAttribute("autocomplete", "tel");
        input.setAttribute("dir", "ltr");
        input.setAttribute("maxlength", "20");

        const hint = document.createElement("div");
        hint.id = "bose-phone-live-hint";
        hint.style.cssText = "font-size:.82rem;margin-top:6px;font-weight:700;display:none;";
        input.parentNode.insertBefore(hint, input.nextSibling);

        function renderLiveHint() {
            const v = input.value.trim();
            if (!v) { hint.style.display = "none"; return; }
            hint.style.display = "block";
            if (window.validateBosePhoneNumber(v)) {
                hint.textContent = "✓ الرقم مظبوط";
                hint.style.color = "#2e9e5b";
            } else {
                const n = window.sanitizeBosePhoneNumber(v).length;
                hint.textContent = n < 11
                    ? "باقي " + (11 - n) + " أرقام"
                    : "الرقم لازم يبدأ بـ 010 أو 011 أو 012 أو 015";
                hint.style.color = "#b26a00";
            }
        }

        function normalizeLive() {
            const before = input.value;
            const after = window.sanitizeBosePhoneNumber(before);
            if (after !== before) {
                const atEnd = input.selectionStart === before.length;
                input.value = after;
                if (atEnd) { try { input.setSelectionRange(after.length, after.length); } catch (e) {} }
            }
            renderLiveHint();
        }

        input.addEventListener("input", normalizeLive);
        input.addEventListener("blur", normalizeLive);
        input.addEventListener("paste", function () { setTimeout(normalizeLive, 0); });
    };
})();
