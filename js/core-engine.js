/**
 * core-engine.js - المحرك المركزي العالمي وحارس البيانات والحسابات المالية
 * موقع حلويات بوسي (BoseSweets) - النسخة الاحترافية الملوكية المطورة V14.0
 * [تحديث V14.0]: تفعيل الكاش الذكي بالتحقق من بصمة الإصدار (get_bose_data_version)
 * بدل الاعتماد على صلاحية زمنية عمياء (15 دقيقة) فقط - راجع loadStoreDatabase().
 * محظور الحذف، الاختصار، الدمج، أو التبسيط نهائياً تماشياً مع فلسفة العلامة الفاخرة.
 */

(function() {
    "use strict";

    /**
     * 🛡️🆕 [إصلاح]: شبكة أمان عامة (Global Error Handler) - قبل كده لو حصل خطأ
     * غير متوقع في أي مكان في رحلة الشراء (تحميل، كارت، تشيك أوت)، الصفحة كانت
     * "بتقف بصمت" من غير أي رسالة للعميلة، وهي حاسة إن حاجة اتعطلت بس مش عارفة
     * تعمل إيه. دلوقتي أي خطأ غير متوقع (window.onerror) أو Promise مرفوضة من
     * غير معالجة (unhandledrejection) بتظهر بانر واحد بسيط تحت الشاشة يوجّه
     * العميلة لإكمال طلبها مباشرة على واتساب بدل ما تفضل واقفة مش عارفة تكمل.
     * البانر بيظهر مرة واحدة بس في نفس تحميل الصفحة (مش هيتكرر مع كل خطأ لاحق)،
     * ومكتوب Inline بالكامل (مش معتمد على أي CSS/JS تاني) عشان يشتغل حتى لو
     * الخطأ نفسه كان في تحميل ملف تاني في الصفحة.
     */
    (function setupBoseGlobalErrorNet() {
        let alreadyShown = false;
        const FALLBACK_WHATSAPP_NUMBER = "201097238441";

        // 🛡️🆕 [إصلاح - رسالة البانر كانت واحدة تمام في كل صفحات الموقع
        // وبتفترض دايماً إن العميلة "بتكمل طلب جديد" ("أكملي طلبك على واتساب").
        // ده غلط منطقياً في أي صفحة مالهاش علاقة بعمل طلب جديد فعلياً - أوضح
        // مثال: track-order.html (العميلة بتتابع طلب اتعمل بالفعل، مش بتطلب)
        // وكذلك rewards.html/contact.html/about.html وصفحات السياسات. ظهور
        // "أكملي طلبك" هنا مربك وممكن يوهم العميلة إنها محتاجة تطلب تاني.
        // دلوقتي البانر بيختار نص/CTA مناسب حسب الصفحة الحالية فعلياً.
        const NON_ORDERING_PAGES = [
            "track-order.html", "rewards.html", "contact.html", "about.html",
            "privacy-policy.html", "refund-policy.html", "shipping-policy.html",
            "terms.html", "404.html", "favorites.html", "linkinbio.html",
        ];

        function currentPageFileName() {
            const parts = window.location.pathname.split("/");
            const last = parts[parts.length - 1];
            return last && last !== "" ? last : "index.html";
        }

        function showGlobalErrorBanner() {
            if (alreadyShown) return;
            alreadyShown = true;

            try {
                const isNonOrderingPage = NON_ORDERING_PAGES.indexOf(currentPageFileName()) !== -1;
                const waPromptText = isNonOrderingPage
                    ? "أهلاً، حصل عندي مشكلة في الموقع وحابة أستفسر معاكم من هنا 🌸"
                    : "أهلاً، حصل عندي مشكلة في الموقع وحابة أكمل طلبي معاكم من هنا 🌸";
                const waLink = (typeof window.buildWhatsappLink === "function")
                    ? window.buildWhatsappLink(FALLBACK_WHATSAPP_NUMBER, waPromptText)
                    : `https://wa.me/${FALLBACK_WHATSAPP_NUMBER}?text=${encodeURIComponent(waPromptText)}`;

                // 🛡️🆕 [إصلاح هوية بصرية - طلب صاحبة المتجر]: البانر ده كان بخلفية
                // سوداء بالكامل وعايم أسفل الشاشة - مخالف لهوية حلويات بوسي البصرية
                // (الأسود مكانه النصوص فقط، مش خلفيات). دلوقتي بخلفية بيضاء + حدود
                // وردية فاتحة (نفس أسلوب باقي كروت/تنبيهات الموقع)، وعايم *تحت الهيدر
                // مباشرة* بدل أسفل الشاشة تماماً - نفس منطق نظام التوست (#bose-toast-container)
                // اللي بيظهر فوق الهيدر، بس على ارتفاع مختلف شوية عشان الاتنين لو
                // ظهروا في نفس اللحظة (تنبيه عادي + رسالة الطوارئ دي) ميتصادموش بصرياً.
                const banner = document.createElement("div");
                banner.setAttribute("dir", "rtl");
                banner.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);top:calc(var(--bose-topbar-height, 44px) + 86px);z-index:2147483647;background:#FFFFFF;color:#111111;font-family:'Cairo',Tahoma,Arial,sans-serif;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 10px 34px rgba(0,0,0,0.18);flex-wrap:wrap;width:min(92vw, 460px);border-radius:16px;border:1px solid rgba(255,145,164,0.4);";

                const msg = document.createElement("span");
                msg.style.cssText = "font-size:14px;line-height:1.5;flex:1;min-width:200px;color:#111111;";
                msg.textContent = isNonOrderingPage
                    ? "حصل عندنا خطأ غير متوقع في الصفحة 🙏 ماتقلقيش، لو محتاجة أي مساعدة تقدري تتواصلي معانا على واتساب مباشرة."
                    : "حصل عندنا خطأ غير متوقع في الصفحة 🙏 ماتقلقيش، تقدري تكملي طلبك بسهولة على واتساب مباشرة.";

                const link = document.createElement("a");
                link.href = waLink;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = isNonOrderingPage ? "تواصلي معانا على واتساب" : "أكملي طلبك على واتساب";
                link.style.cssText = "background:#FF91A4;color:#ffffff;font-weight:700;text-decoration:none;padding:8px 16px;border-radius:8px;white-space:nowrap;font-size:14px;";

                const closeBtn = document.createElement("button");
                closeBtn.textContent = "✕";
                closeBtn.setAttribute("aria-label", "إغلاق");
                closeBtn.style.cssText = "background:transparent;border:none;color:#111111;opacity:0.55;font-size:16px;cursor:pointer;padding:4px 8px;";
                closeBtn.onclick = function() { banner.remove(); };

                banner.appendChild(msg);
                banner.appendChild(link);
                banner.appendChild(closeBtn);

                const attach = function() {
                    if (document.body) document.body.appendChild(banner);
                };
                if (document.body) attach();
                else document.addEventListener("DOMContentLoaded", attach);
            } catch (bannerErr) {
                // لو حتى إظهار البانر نفسه فشل، سيبها تفضل صامتة بدل ما تكسر أي حاجة تانية.
                console.error("⚠️ فشل عرض بانر الطوارئ نفسه:", bannerErr);
            }
        }

        window.addEventListener("error", function(event) {
            console.error("⚠️ [شبكة أمان عامة] خطأ غير متوقع في الصفحة:", event.error || event.message);
            showGlobalErrorBanner();
        });

        window.addEventListener("unhandledrejection", function(event) {
            console.error("⚠️ [شبكة أمان عامة] Promise مرفوضة من غير معالجة:", event.reason);
            showGlobalErrorBanner();
        });
    })();

    /**
     * 🛡️ [تنضيف - أغسطس 2026]: الكود اللي كان هنا قبل كده كان "شبكة أمان"
     * بتحاول تحمّل Font Awesome من jsdelivr/unpkg لو المصدر الأساسي فشل -
     * وده كان منطقي وقتها لإن الأيقونات كانت بتتحمّل من cdnjs.cloudflare.com
     * (مصدر خارجي حقيقي ممكن يفشل). دلوقتي الأيقونات مُستضافة محليًا بالكامل
     * على نفس دومين الموقع (vendor/fontawesome/) - يعني مفيش مصدر خارجي
     * يفشل أصلاً، فالكود ده بقى غير لازم (وكان أصلاً معطّل بصمت من زمان
     * لإن الـCSP style-src ما كانش بيسمح بـ jsdelivr/unpkg للـstylesheets).
     * اتشال بالكامل بدل ما يفضل كود ميت.
     */

    // 1. [صمام أمان الأداء]: حظر استعادة السكرول التلقائية لسرعة التصفح لراحة العميل النفسية
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    /**
     * 🧭🆕 [4.1 - نظام تتبع مصدر الزيارات]: بيتقرأ مرة واحدة بس (أول لمسة/first-touch)
     * على أي صفحة تدخلها العميلة لأول مرة، ومتتغيرش بعد كده حتى لو دخلت
     * الموقع تاني من مصدر مختلف - نفس فلسفة عمود first_source/first_medium/first_detail
     * في جدول customers (upsert_customer_on_order بيتجاهل أي تحديث ليهم بعد أول
     * إدراج، فمنطقي إن التخزين المحلي هنا يطابقها بنفس المنطق بدل ما يبعت قيمة
     * مختلفة في كل طلب لعميلة موجودة بالفعل).
     * أولوية القراءة: UTM params الصريحة (utm_source/utm_medium/utm_campaign أو utm_content)
     * ← لو مفيش، بنحاول نستنتج من الـ referrer (فيسبوك/انستجرام/تيكتوك/واتساب/جوجل)
     * ← ولو مفيش أي حاجة، بتتسجل "direct" (زيارة مباشرة، مفيش رابط قبلها).
     */
    function captureBoseAttribution() {
        try {
            if (localStorage.getItem('bose_attribution')) return; // أول لمسة محفوظة بالفعل، منسيبهاش

            const params = new URLSearchParams(window.location.search);
            let source = params.get('utm_source');
            let medium = params.get('utm_medium');
            let detail = params.get('utm_content') || params.get('utm_campaign');

            if (!source) {
                const ref = document.referrer || "";
                if (ref) {
                    let refHost = "";
                    try { refHost = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) { refHost = ""; }
                    if (/facebook\.com|fb\.com/.test(refHost)) { source = "facebook"; medium = "social"; }
                    else if (/instagram\.com/.test(refHost)) { source = "instagram"; medium = "social"; }
                    else if (/tiktok\.com/.test(refHost)) { source = "tiktok"; medium = "social"; }
                    else if (/wa\.me|whatsapp\.com/.test(refHost)) { source = "whatsapp"; medium = "social"; }
                    else if (/google\./.test(refHost)) { source = "google"; medium = "organic"; }
                    else if (refHost) { source = refHost; medium = "referral"; }
                    detail = detail || (refHost || null);
                }
            }

            if (!source) { source = "direct"; medium = medium || "none"; }

            localStorage.setItem('bose_attribution', JSON.stringify({
                source: source,
                medium: medium || null,
                detail: detail || null,
                capturedAt: Date.now()
            }));
        } catch (e) { /* تجاهل بأمان لو التخزين المحلي ممتلئ أو غير متاح */ }
    }
    captureBoseAttribution();

    /**
     * @returns {{source: string, medium: string|null, detail: string|null}|null}
     */
    window.getBoseAttribution = function() {
        try {
            const raw = localStorage.getItem('bose_attribution');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return (parsed && parsed.source) ? parsed : null;
        } catch (e) {
            return null;
        }
    };

    function forceScrollToTop() {
        // 🛡️🆕 [إصلاح]: لو اللينك اللي فتحت بيه الصفحة فيه # (anchor) زي
        // "index.html#howto-order-section" (رابط "إزاي أطلب؟" في القائمة
        // الجانبية وزرار "مش عارفة تطلبي إزاي؟" في الهيرو)، سيبي المتصفح يودّي
        // العميلة لمكان الـ anchor نفسه، وما ترجعهاش لأول الصفحة بالقوة. من غير
        // الشرط ده، كانت العميلة بتوصل لجزء من الثانية لقسم "طلبك بيوصلنا إزاي؟"
        // وبعدين بترجع تلقائي لأول الصفحة - وهي دايماً بتوصل بعد ما الصفحة تخلص
        // تحميل بالكامل (نداء window 'load') لأن forceScrollToTop بتتنفذ 3 مرات:
        // فورًا، وعلى DOMContentLoaded، وعلى load - وأي واحدة فيهم من غير الشرط
        // ده كانت كفيلة تلغي وصول العميلة لمكانها. باقي روابط القائمة الجانبية
        // (زي /cart.html، /menu.html...) مفيهاش # أصلاً فمش بتتأثر، وده سبب إنها
        // شغالة كويس من الأول.
        if (window.location.hash) return;
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    forceScrollToTop();

    /**
     * 📊👑 [نمو - تركيب أدوات القياس]: كان الموقع كله من غير أي أداة قياس -
     * مفيش Google Analytics ولا Facebook Pixel ولا TikTok Pixel، يعني مفيش أي
     * طريقة نعرف بيها فعلياً مين بيدخل الموقع، مين بيشتري، ومفيش إمكانية نعمل
     * إعلانات ممولة تستهدف بيها متابعين السوشيال ميديا (23K+ فيسبوك) بدقة.
     * بيتحقن هنا مرة واحدة بنفس منطق حقن الـ structured data تحت -
     * أي صفحة عميل بتحمّل core-engine.js (كل الموقع ما عدا لوحة التحكم) بتاخد
     * القياس تلقائياً من غير ما نلمس الـ 19 صفحة يدوياً واحدة واحدة.
     * ✅ [تحديث]: الـ IDs التلاتة (GA4/Facebook/TikTok) وصلت واتركبت فعلاً تحت -
     * الكومنت القديم اللي كان بيقول "لسه مش متركبين" كان فات تحديثه من جلسة سابقة،
     * بيتصلح هنا بس عشان أي مراجعة مستقبلية متتلخبطش. راجع fireBoseCommerceEvent
     * تحت لأحداث AddToCart/InitiateCheckout/Purchase الحقيقية المبنية فوق البيكسلات دي.
     */
    (function ensureBoseAnalytics() {
        // --- Google Analytics 4 ---
        const GA4_MEASUREMENT_ID = "G-46D1CS3WLB"; // بسي-سويتس - من حساب المستخدمة على analytics.google.com
        if (GA4_MEASUREMENT_ID && !window.gtag) {
            const gaScript = document.createElement("script");
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
            document.head.appendChild(gaScript);
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () { window.dataLayer.push(arguments); };
            window.gtag("js", new Date());
            window.gtag("config", GA4_MEASUREMENT_ID);
        }

        // --- Facebook Pixel ---
        const FB_PIXEL_ID = "1867395257564538"; // BoseSweetsWebsite - من Facebook Events Manager
        if (FB_PIXEL_ID && !window.fbq) {
            !function (f, b, e, v, n, t, s) {
                if (f.fbq) return; n = f.fbq = function () {
                    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                };
                if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0";
                n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
                s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
            }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
            window.fbq("init", FB_PIXEL_ID);
            window.fbq("track", "PageView");
        }

        // --- TikTok Pixel ---
        const TT_PIXEL_ID = "DA2LEG3C77U7HHC75ADG"; // BoseSweetsWebsite - من TikTok Events Manager
        if (TT_PIXEL_ID && !window.ttq) {
            !function (w, d, t) {
                w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
                ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
                ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
                for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
                ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
                ttq.load = function (e, n) {
                    var r = "https://analytics.tiktok.com/i18n/pixel/events.js", o = n && n.partner;
                    ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date; ttq._o = ttq._o || {}; ttq._o[e] = n || {};
                    n = document.createElement("script"); n.type = "text/javascript"; n.async = !0; n.src = r + "?sdkid=" + e + "&lib=" + t;
                    e = document.getElementsByTagName("script")[0]; e.parentNode.insertBefore(n, e);
                };
                ttq.load(TT_PIXEL_ID);
                ttq.page();
            }(window, document, "ttq");
        }
    })();

    /**
     * 📊👑 [نمو - أحداث تجارية حقيقية للبيكسلات]: قبل كده البيكسلات التلاتة
     * (فوق) كانت بترصد بس "PageView" - يعني نعرف إن حد زار الموقع، لكن معندناش
     * أي فكرة مين حط منتج في السلة، مين بدأ يشتري، ومين اشترى فعلاً وبقيمة
     * كام. ده كان بيمنع أهم حاجتين في أي إعلان ممول: (1) إعادة استهداف دقيقة
     * ("اللي حطوا في السلة وماكملوش" - أعلى فرصة تحويل من أي جمهور تاني)،
     * و(2) بناء "جمهور شبيه" (Lookalike) مبني على مشتريين حقيقيين بدل زوار
     * عاديين. الدالة دي نقطة واحدة موحّدة بيستدعيها كل مكان في الموقع بيضيف
     * للسلة (core-engine.js نفسه، product.html، cake-engine.js، flower-engine.js،
     * cake-quick-engine.js) وصفحتي الشيك أوت والنجاح - وبتبعت لكل بيكسل بالاسم
     * القياسي المعروف له (GA4/Meta/TikTok مختلفين شوية عن بعض في أسماء
     * الأحداث القياسية)، مع حراسة try/catch لأي بيكسل مش محمّل (مثلاً حاجب
     * إعلانات) عشان محدش يعطّل رحلة الشراء نفسها لو فشل الإرسال.
     * @param {'add_to_cart'|'begin_checkout'|'purchase'} eventName
     * @param {{value?: number, currency?: string, contentId?: string, contentName?: string, quantity?: number, orderId?: string}} data
     */
    window.fireBoseCommerceEvent = function(eventName, data) {
        try {
            const value = Math.round((parseFloat(String(data && data.value)) || 0) * 100) / 100;
            const currency = (data && data.currency) || "EGP";
            const contentId = (data && data.contentId) || "";
            const contentName = (data && data.contentName) || "";
            const quantity = (data && data.quantity) || 1;

            // --- Google Analytics 4 (gtag) - نفس أسماء الأحداث القياسية بالظبط ---
            if (typeof window.gtag === "function") {
                /** @type {any} */
                const payload = { currency, value, items: [{ item_id: contentId, item_name: contentName, quantity, price: value }] };
                if (eventName === "purchase" && data && data.orderId) payload.transaction_id = data.orderId;
                window.gtag("event", eventName, payload);
            }

            // --- Facebook Pixel - أسماء الأحداث القياسية بتاعته مختلفة شوية ---
            if (typeof window.fbq === "function") {
                const fbEventMap = { add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase" };
                const fbEventName = fbEventMap[eventName];
                if (fbEventName) {
                    window.fbq("track", fbEventName, {
                        value, currency, content_type: "product",
                        content_ids: contentId ? [contentId] : undefined,
                        contents: contentId ? [{ id: contentId, quantity }] : undefined,
                    });
                }
            }

            // --- TikTok Pixel - "CompletePayment" هو مكافئ حدث الشراء الفعلي عندهم ---
            if (window.ttq && typeof window.ttq.track === "function") {
                const ttEventMap = { add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "CompletePayment" };
                const ttEventName = ttEventMap[eventName];
                if (ttEventName) {
                    window.ttq.track(ttEventName, {
                        value, currency, content_type: "product",
                        contents: contentId ? [{ content_id: contentId, content_name: contentName, quantity, price: value }] : undefined,
                    });
                }
            }
        } catch (e) { /* تجاهل بأمان - تتبع تحليلي اختياري، ما ينفعش يعطّل رحلة الشراء */ }
    };

    /**
     * 🛒👑 [نمو - تذكير بالسلة]: العميلة بتتصفح، تحط منتجات في السلة، وتتشتت (مكالمة،
     * إشعار تاني) - وترجع تاني بعد شوية من غير ما تكمل. بدل ما نسيبها تنسى، لو رجعت
     * للموقع وفي عربة منسية من زيارة سابقة (مش الزيارة الحالية - عشان متتكررش كل ثانية)
     * بيظهرلها شريط لطيف فوق يفكّرها وبيوديها للسلة بضغطة واحدة.
     * ملحوظة: ده تذكير على الموقع نفسه بس (مفيش بريد إلكتروني ولا SMS - الموقع مش
     * بيجمع إيميلات أصلاً)، فمش "استرجاع سلة متروكة" كامل بالمعنى الاحترافي، لكنه بديل
     * بسيط وآمن ما دام مفيش بنية تحتية لإيميلات/SMS في الموقع.
     */
    // 🔁 [2026-08-22] النسخة اللي كانت هنا اتشالت - الوظيفة دي بقت بمحرك مستقل
    // أدق (js/cart-reminder.js، بيقيس فترة سكون حقيقية للسلة بدل عدد ساعات بسيط
    // من آخر ظهور) بيتحقن يدويًا بس في صفحات التصفح المقصودة (الرئيسية/المنيو/
    // الفئة/المنتج/العروض)، مش في كل صفحة عميلة زي ما كان هنا. شوفي js/cart-reminder.js.

    /**
     * ℹ️👑 [نظام الشروح التوضيحية الموحد للموقع كله]: كان الشرح المنبثق (Popover)
     * موجود جوه cake-builder.html بس، بمنطق محلي مربوط بديكشنري ثابت من مفاتيح
     * معروفة مقدماً. المشكلة إن ده مبيصلحش لبقية الموقع لأن معظم كروت المنتجات
     * والمحتوى بيتبني ديناميكياً بعد تحميل بيانات المتجر (مش موجود وقت تحميل
     * الصفحة). الحل هنا: نظام واحد مشترك على مستوى الموقع كله، بيتحقن مرة واحدة
     * في <body> فور تحميل الصفحة (زي ensurePwaInstallability بالظبط)، وبيستخدم
     * event delegation على document بدل ما يربط listener لكل زرار لوحده - فأي
     * زرار ⓘ حتى لو اتحقن بعد كده جوه كارت منتج، بيشتغل تلقائياً من غير أي كود
     * إضافي. أي جزء في الموقع يقدر يستخدمه بس بإضافة:
     * <button class="bose-info-badge-inline" data-bose-info-title="..." data-bose-info-text="...">ⓘ</button>
     * أو برمجياً: window.BoseInfoPopover.open("العنوان", "النص التوضيحي").
     */
    (function ensureBoseInfoPopoverSystem() {
        if (document.getElementById('bose-global-info-popover-backdrop')) return;

        const backdrop = document.createElement('div');
        backdrop.id = 'bose-global-info-popover-backdrop';
        backdrop.className = 'bose-info-popover-backdrop';
        backdrop.innerHTML = `
            <div class="bose-info-popover-box" role="dialog" aria-modal="true" aria-labelledby="bose-global-info-popover-title">
                <button type="button" class="bose-info-popover-close" id="bose-global-info-popover-close" aria-label="إغلاق الشرح">&times;</button>
                <h4 id="bose-global-info-popover-title"></h4>
                <p id="bose-global-info-popover-text"></p>
            </div>
        `;

        function mountBackdrop() {
            if (document.body) document.body.appendChild(backdrop);
            else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(backdrop));
        }
        mountBackdrop();

        function openPopover(title, text) {
            const titleEl = document.getElementById('bose-global-info-popover-title');
            const textEl = document.getElementById('bose-global-info-popover-text');
            if (!titleEl || !textEl || !text) return;
            titleEl.textContent = title || 'توضيح';
            textEl.textContent = text;
            backdrop.classList.add('show');
        }
        function closePopover() {
            backdrop.classList.remove('show');
        }

        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closePopover(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && backdrop.classList.contains('show')) closePopover();
        });
        // 🛡️ [تفويض حدث واحد على مستوى الصفحة كلها]: يشتغل مع أي زرار ⓘ حالي أو
        // هيتحقن لاحقاً (كروت منتجات، صفحة تشيك أوت، أي مكان جديد) من غير أي setup إضافي.
        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('#bose-global-info-popover-close');
            if (closeBtn) { closePopover(); return; }
            const badge = e.target.closest('[data-bose-info-text]');
            if (!badge) return;
            e.preventDefault();
            e.stopPropagation();
            openPopover(badge.dataset.boseInfoTitle, badge.dataset.boseInfoText);
        });

        window.BoseInfoPopover = { open: openPopover, close: closePopover };
    })();

    /**
     * 👑👑 [مرحلة جديدة - تحميل التطبيق]: ربط manifest.json فعلياً بكل صفحة في
     * الموقع + تسجيل Service Worker. الملف كان موجود على السيرفر من زمان لكن
     * ملحقش بأي صفحة HTML أبداً (مفيش أي <link rel="manifest"> في أي مكان)،
     * فمتصفح Chrome/Android مكانش يقدر يعتبر الموقع "قابل للتثبيت" خالص - يعني
     * زرار "ثبّتي التطبيق" في أي نافذة كان هيفضل شكلي بس بدون فايدة حقيقية.
     * الحقن هنا بيتم فوراً من غير أي تأخير (قبل حتى تحميل بيانات المتجر) عشان
     * يطبّق على كل صفحة في الموقع تلقائياً من نفس المكان، من غير ما نحتاج نعدّل
     * الـ <head> بتاع كل صفحة HTML على حدة يدوياً (أكتر من 20 صفحة).
     */
    (function ensurePwaInstallability() {
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifestLink = document.createElement('link');
            manifestLink.rel = 'manifest';
            manifestLink.href = '/manifest.json';
            document.head.appendChild(manifestLink);
        }
        if (!document.querySelector('meta[name="theme-color"]')) {
            const themeMeta = document.createElement('meta');
            themeMeta.name = 'theme-color';
            themeMeta.content = '#FF91A4';
            document.head.appendChild(themeMeta);
        }
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => { /* فشل صامت - متأثرش على تجربة العميل العادية */ });
            });
        }
    })();

    /**
     * 👑👑 [مرحلة جديدة - مشترك بين النافذة والبلوك الكبير]: نلقط حدث تثبيت الـ PWA
     * مرة واحدة بس هنا فوق (بدري قبل أي حاجة تانية)، ونخزنه في متغير مشترك على
     * مستوى الملف كله، عشان أي زرار تحميل تطبيق في أي مكان بالموقع (نافذة الترحيب
     * أو البلوك الكبير في الرئيسية) يقدر يستخدم نفس التقاطة الحدث دي بالظبط -
     * الحدث ده بيتفعّل مرة واحدة بس من المتصفح، فلازم نلقطه من نقطة مركزية وحيدة.
     */
    /** @type {any} */ let boseDeferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        boseDeferredInstallPrompt = e;
    });
    window.addEventListener('appinstalled', () => {
        localStorage.setItem('bose_app_installed_flag', 'true');
        const popup = document.getElementById('bose-app-install-popup-overlay');
        if (popup) popup.remove();
    });

    /**
     * دالة موحّدة لتفعيل تثبيت التطبيق - تُستخدم من نافذة الترحيب وأزرار البلوك
     * الكبير في الرئيسية على حد سواء.
     * ⚠️ [TODO لصاحبة المتجر]: لحد ما يبقى فيه تطبيق حقيقي منشور على Google Play
     * و App Store، الزراير دي بتفعّل تثبيت الـ PWA بدل ما تفتح صفحة متجر حقيقية.
     * لما يبقى فيه روابط متجر حقيقية، استبدلي محتوى الدالة دي بفتح الرابط المناسب
     * حسب نظام تشغيل الجهاز (iOS → App Store link، Android → Google Play link).
     */
    window.triggerBoseAppInstall = async function() {
        if (boseDeferredInstallPrompt) {
            boseDeferredInstallPrompt.prompt();
            const choice = await boseDeferredInstallPrompt.userChoice;
            boseDeferredInstallPrompt = null;
            if (choice && choice.outcome === 'accepted') {
                localStorage.setItem('bose_app_installed_flag', 'true');
            }
        } else if (window.showBoseGlobalToast) {
            /**
             * 👑 [إصلاح - تعليمات صحيحة حسب نظام الجهاز]: كانت الرسالة القديمة بتدّي
             * خيارين مختلفين مع بعض ("تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية")
             * من غير ما تحدد أنهي واحد صح - العميل كان بيختار العشوائي فيهم وغالبًا
             * بيطلعله اختصار (Shortcut) بعلامة المتصفح مش تطبيق حقيقي. كمان كانت نفس
             * الرسالة بتتقال لمستخدمي آيفون رغم إن Safari مفيهوش "قائمة تثبيت" خالص -
             * عنده بس زرار المشاركة. دلوقتي كل نظام بياخد التعليمات الصح بتاعته.
             */
            const ua = navigator.userAgent || '';
            const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
            const isAndroid = /Android/.test(ua);
            let message;
            if (isIOS) {
                message = 'لتثبيت التطبيق على آيفون: من متصفح Safari دوسي على زرار المشاركة (المربع وفيه سهم لفوق) تحت الشاشة، وبعدين اختاري "إضافة إلى الشاشة الرئيسية".';
            } else if (isAndroid) {
                message = 'لتثبيت التطبيق: دوسي على الثلاث نقط أعلى المتصفح، وابحثي عن خيار "تثبيت التطبيق" (Install app) بالتحديد، مش "إضافة اختصار".';
            } else {
                message = 'لتثبيت التطبيق، افتحي قائمة المتصفح وابحثي عن خيار "تثبيت التطبيق" (Install app).';
            }
            window.showBoseGlobalToast(message);
        }
    };

    /**
     * 👑 [إصلاح جذري - كارثة الأحجام]: خريطة أسماء الأحجام الموحدة لكل الموقع (مطابقة
     * تماماً لنفس الأسماء المستخدمة في product.html/category.html). كانت هذه الأسماء
     * مكررة محلياً في أكتر من ملف، وأهم من كده: كروت المنتجات في الصفحة الرئيسية
     * وصفحة العروض وسلة "قد يعجبك أيضاً" كانت بتضيف المنتج للسلة بأرخص حجم (مثلث)
     * تلقائياً من غير ما تدي العميل أي فرصة يختار الحجم المناسب - ده كان بيسبب خسارة
     * فعلية في قيمة الطلب وارتباك للعميل لما يوصله منتج بحجم أصغر مما توقع. الخريطة دي
     * بقت متاحة عالمياً (window.BOSE_SIZE_LABELS) عشان أي كارت منتج في أي مكان بالموقع
     * يقدر يعرض تبويب اختيار الحجم بنفس الأسماء بالظبط.
     */
    window.BOSE_SIZE_LABELS = { triangle: "مثلث", medium: "طاجن", large: "حجم عائلي" };
    document.addEventListener('DOMContentLoaded', forceScrollToTop);
    window.addEventListener('load', forceScrollToTop);

    // تشغيل حقن الخطوط والأيقونات فوراً من هنا لسرعة الظهور
    injectEarlyDependencies();

    // تهيئة المتغيرات العالمية الموحدة في نطاق window لخدمة صفحات الموقع
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; // فارق التوقيت بالمللي ثانية: (وقت الخادم - وقت جهاز العميل)

    /**
     * 🧠 [V14.0 - كاش ذكي بالتحقق من الإصدار]: بدل ما كنا نعتمد بس على مرور
     * 15 دقيقة عشان نعتبر الكاش "قديم"، دلوقتي بنسأل قاعدة البيانات سؤال رخيص
     * جداً (get_bose_data_version - قيمة تاريخ واحدة بس، مش جدول كامل) عشان
     * نعرف هل فعلاً حصل أي تعديل حقيقي (منتج/فئة/عرض/منطقة شحن/إعدادات متجر)
     * من وقت آخر كاش محفوظ عندنا.
     *
     * 👑👑 [إصلاح جذري - أداء الهيدر والقائمة الجانبية]: قبل كده كان الهيدر
     * والقائمة الجانبية بالكامل (buildAndInjectGlobalComponents) بيستنوا طلب
     * "التحقق من الإصدار" يخلص فعلياً من السيرفر قبل ما يظهروا - حتى لو كان
     * عند العميلة كاش صالح 100%. يعني في أي اتصال بطيء، صفحة من غير هيدر ولا
     * زرار قائمة ولا سلة لثواني حقيقية. دلوقتي (Stale-While-Revalidate):
     * نعرض القائمة والهيدر وكل بيانات المتجر فوراً من الكاش المحلي، والتحقق
     * من وجود تحديث بيحصل بهدوء تام في الخلفية من غير ما يأخر ظهور أي حاجة.
     *
     * صمام أمان: لو التحقق نفسه فشل (مشكلة شبكة وقتية)، بيعيد المحاولة مرة
     * واحدة بعد نص ثانية قبل ما يستسلم لنفس الزيارة (ومفيش أي تأخير محسوس
     * للعميلة أصلاً لأنه بيحصل في الخلفية). وفيه سقف زمني قاسي (ساعتين) كخط
     * دفاع أخير عشان أي تعديل من لوحة التحكم (خصوصاً صور المنتجات) يوصل
     * للعميل بأسرع وقت ممكن.
     *
     * 🔧 [أداة تشخيص]: إضافة ?refresh=1 لأي رابط في الموقع بتتخطى الكاش المحلي
     * بالكامل وتجيب أحدث نسخة من قاعدة البيانات مباشرة - مفيدة لصاحبة المتجر
     * عشان تتأكد فوراً إن أي تعديل وصل فعلاً.
     */
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return;

        const forceRefresh = new URLSearchParams(window.location.search).get('refresh') === '1';
        const cachedData = forceRefresh ? null : localStorage.getItem('bose_cached_store_data');
        const cachedTime = forceRefresh ? null : localStorage.getItem('bose_cached_store_time');
        const cachedVersion = forceRefresh ? null : localStorage.getItem('bose_cached_store_version');
        const cacheHardExpiry = 2 * 60 * 60 * 1000; // صمام أمان أخير: ساعتين
        const cacheWithinHardLimit = cachedData && cachedTime && (Date.now() - parseInt(cachedTime, 10) < cacheHardExpiry);

        if (cacheWithinHardLimit) {
            try {
                // نعرض فوراً من الكاش المحلي - مفيش أي استنى لأي طلب شبكة قبل ما
                // تشوف العميلة الهيدر/القائمة/المنتجات.
                window.BoseStoreData = JSON.parse(cachedData);
                initCoreFlow();

                // التحقق من وجود تحديث بيحصل دلوقتي بهدوء في الخلفية - مش بيأخر
                // ولا بيقاطع أي حاجة العميلة شايفاها بالفعل.
                (async () => {
                    if (!window.BoseSupabase || typeof window.BoseSupabase.getBoseDataVersion !== "function") return;

                    /** محاولة واحدة لقراءة النسخة الحية - بترجع النسخة أو null على الفشل */
                    async function attemptVersionCheck() {
                        try {
                            const versionResult = await window.BoseSupabase.getBoseDataVersion();
                            const v = Array.isArray(versionResult)
                                ? (versionResult[0]?.get_bose_data_version ?? versionResult[0])
                                : (versionResult?.get_bose_data_version ?? versionResult);
                            return (v !== null && v !== undefined) ? v : null;
                        } catch (e) {
                            return null;
                        }
                    }

                    let liveVersion = await attemptVersionCheck();
                    if (liveVersion === null) {
                        await new Promise((r) => setTimeout(r, 500));
                        liveVersion = await attemptVersionCheck();
                    }
                    if (liveVersion === null || String(liveVersion) === String(cachedVersion)) return;

                    // النسخة اتغيرت فعلاً - نجيب البيانات الجديدة ونحدّث العناصر
                    // الحية بهدوء من غير Reload كامل يقاطع تصفح العميلة.
                    try {
                        const freshData = await window.BoseSupabase.loadBoseStoreDataFromSupabase();
                        window.BoseStoreData = freshData;
                        localStorage.setItem('bose_cached_store_data', JSON.stringify(freshData));
                        localStorage.setItem('bose_cached_store_time', String(Date.now()));
                        localStorage.setItem('bose_cached_store_version', String(liveVersion));
                        buildAndInjectGlobalComponents();
                        document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
                    } catch (e) { /* فشل التحديث الصامت في الخلفية - العميلة شغالة بالفعل بالنسخة المحفوظة الصالحة */ }
                })();

                return;
            } catch (e) {
                localStorage.removeItem('bose_cached_store_data');
                localStorage.removeItem('bose_cached_store_time');
                localStorage.removeItem('bose_cached_store_version');
            }
        }
        
        let retries = 5;
        let delay = 1000;
        
        while (retries > 0) {
            try {
                // 🛡️ [المرحلة 1 - الانتقال الكامل لـ Supabase]: الموقع بقى بيقرأ
                // قاعدة البيانات الحية من Supabase مباشرة بدل ملف data/site-data-final.json
                // الثابت. الملف الثابت اتشال نهائياً من مسار التحميل - أي تعديل سعر
                // أو منتج أو محتوى دلوقتي لازم يحصل من قاعدة البيانات (لوحة التحكم
                // في المرحلة الجاية) عشان يظهر فعلياً للعميل.
                if (!window.BoseSupabase || typeof window.BoseSupabase.loadBoseStoreDataFromSupabase !== "function") {
                    throw new Error("طبقة الاتصال بقاعدة البيانات (supabase-client.js) غير محمّلة قبل core-engine.js.");
                }

                window.BoseStoreData = await window.BoseSupabase.loadBoseStoreDataFromSupabase();

                // ملحوظة: الاتصال بـ Supabase REST بيتم عبر fetch داخلي في supabase-client.js
                // ومش بيرجّع نفس الوصول لهيدر Date اللي كنا بناخده من الملف الثابت،
                // فبنسيب فارق التوقيت صفر بدل ما نحسبه غلط. الدقة دي مش حرجة لوظيفة
                // الموقع الحالية (مفيش أي مكان بيعتمد عليها بشكل حاسم في الحسابات).
                window.boseServerTimeOffset = 0;

                localStorage.setItem('bose_cached_store_data', JSON.stringify(window.BoseStoreData));
                localStorage.setItem('bose_cached_store_time', String(Date.now()));

                // 🧠 [V14.0]: تسجيل بصمة النسخة الحالية فور نجاح الجلب، عشان أي زيارة
                // تانية (حتى لو بعد دقيقة واحدة) تقدر تتحقق بسرعة بدل ما تستنى 15 دقيقة.
                // فشل هذا الطلب تحديداً (مش حرج) بيتجاهل بأمان ويفضل الموقع شغال عادي،
                // وبس هيرجع يتحقق بطريقة أبطأ (تحميل كامل) في الزيارة الجاية.
                if (window.BoseSupabase && typeof window.BoseSupabase.getBoseDataVersion === "function") {
                    try {
                        const versionResult = await window.BoseSupabase.getBoseDataVersion();
                        const v = Array.isArray(versionResult)
                            ? (versionResult[0]?.get_bose_data_version ?? versionResult[0])
                            : (versionResult?.get_bose_data_version ?? versionResult);
                        if (v !== null && v !== undefined) {
                            localStorage.setItem('bose_cached_store_version', String(v));
                        } else {
                            localStorage.removeItem('bose_cached_store_version');
                        }
                    } catch (e) {
                        localStorage.removeItem('bose_cached_store_version');
                    }
                }
                
                initCoreFlow();
                return;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    console.error("❌ خطأ حرج في تهيئة نظام حلويات بوسي الموحد:", error);
                    showGlobalFriendlyError();
                } else {
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; 
                }
            }
        }
    }

    /**
     * دالة تشغيل التدفق المركزي والتهيئات البصرية المبكرة للموقع مع حماية صارمة ضد أخطاء الـ DOM
     */
    function initCoreFlow() {
        applyGlobalSEOAndBranding();
        buildAndInjectGlobalComponents();
        
        if (typeof window.updateGlobalCartCounter === 'function') {
            window.updateGlobalCartCounter();
        }
        
        setupAppInstallPopup();

        // 👑 [فصل الصفحة الرئيسية - 2026-08-25]: كل دوال عرض الصفحة الرئيسية
        // (شلال المنتجات، سلايدرات العروض/الأكثر مبيعاً، المحاكيات، عدادات
        // الفخر، صفحة كل العروض، صفحة المفضلة، بلوك تحميل التطبيق) انتقلت
        // لملف js/homepage-engine.js منفصل - بيسمع لحدث BoseDatabaseLoaded
        // اللي بيتطلق في آخر الدالة دي بالظبط زي ما كان، فمفيش أي تغيير في
        // التوقيت أو الترتيب اللي كانت بتشتغل بيه، هي بس بقت في ملف تاني عشان
        // باقي صفحات الموقع (السلة/الدفع/المنتج/الفئة/إلخ) متضطرش تحمّل كود
        // مش محتاجاه أصلاً. لو الملف ده مش محمّل في صفحة معينة، الحدث ببساطة
        // مالوش مستمع إضافي وميحصلش أي خطأ.

        document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
    }

    /**
     * 👑👑 [إصلاح جذري نهائي - كارثة اختفاء التبويب أسفل "اطلب الآن"]: بعد 9 محاولات
     * إصلاح سابقة فشلت جميعها (كل واحدة كانت بترقّع مشكلة تايمنج جديدة في نفس المحرك
     * اليدوي بالـ JS اللي بيحسب موضع transform بنفسه)، تقرر إلغاء فكرة "محرك السحب
     * اليدوي" بالكامل من جذورها بدل ما نضيف رقعة عاشرة. أي حل مبني على حساب موضع
     * العنصر بالـ JS (posX/halfWidth/pointermove) عنده احتمال يفشل في توقيت معين
     * (تحميل خط/أيقونة متأخر، تغيير viewport لحظة أول لمسة، bfcache، الخ) على جهاز
     * أو متصفح معين مهما زودنا الحراسات. الحل الجذري: نسيب المتصفح نفسه يتحكم في
     * التمرير الأفقي بشكل native (overflow-x: auto + scroll-snap في CSS) - مفيش أي
     * transform بيتحسب بالـ JS خالص، فمفيش أي احتمال "يختفي" لأن مفيش كود بيحرّكه؛
     * هو ببساطة صف عادي قابل للتمرير بإصبع العميل زي أي قائمة تانية في أي تطبيق.
     * دالة setupHeroTickerDragEngine اتشالت بالكامل من هنا ومن استدعائها في initCoreFlow.
     */


    /**
     * 👑 [6.3-أ - توحيد جزئي]: شارة الخصم + السعر القديم + جملة التوفير كانت
     * مكررة حرفيًا نفس المنطق في createProductCardHTML هنا وفي category.html
     * (اللي عنده كارت منتج منفصل عمدًا - بدون إضافة مباشرة للسلة، راجع تعليق
     * buildBoseFavButtonHTML تحت لتفاصيل ليه الكارتين مختلفين). دلوقتي المنطق
     * في مكان واحد بس، وأي تغيير في شكل الشارة هيتحدث تلقائيًا في كل مكان.
     * @param {Object} product
     * @param {{currencyLabel?: string, savingsVerb?: string}} [opts]
     * @returns {{hasDiscount: boolean, discountBadgeHtml: string, oldPriceHtml: string, savingsHtml: string}}
     */
    function buildBoseDiscountBadgeMarkup(product, opts) {
        const currencyLabel = (opts && opts.currencyLabel) || 'جنيه';
        const savingsVerb = (opts && opts.savingsVerb) || 'وفر';
        const hasDiscount = !!(product && product.oldPrice && product.oldPrice > product.price);
        if (!hasDiscount) {
            return { hasDiscount: false, discountBadgeHtml: '', oldPriceHtml: '', savingsHtml: '' };
        }
        const savingsAmount = product.oldPrice - product.price;
        const discountPercent = Math.round((savingsAmount / product.oldPrice) * 100);
        return {
            hasDiscount: true,
            discountBadgeHtml: `<div class="offer-badge bose-offer-badge">خصم ${discountPercent}%</div>`,
            oldPriceHtml: `<span class="product-old-price">${Math.round(product.oldPrice)} ${currencyLabel}</span>`,
            savingsHtml: `<span class="offer-savings-note">${savingsVerb} ${Math.round(savingsAmount)} ${currencyLabel}</span>`,
        };
    }
    window.buildBoseDiscountBadgeMarkup = buildBoseDiscountBadgeMarkup;

    /**
     * 👑 [6.3-أ - توحيد جزئي]: زرار المفضلة (القلب) كان مكررًا حرفيًا نفس الكود
     * في createProductCardHTML هنا وفي category.html. التوحيد الكامل لكارت
     * المنتج بالكامل بين الملفين اتفحص ورفض عمدًا: كارت category.html مصمم
     * بفلتر حجم جماعي واحد فوق الشبكة كلها (بدل تبويبات حجم داخل كل كارت)
     * وبدون زرار "إضافة للسلة"/عداد مباشر (بيودّي دايمًا لصفحة المنتج أولاً) -
     * فرق تصميم حقيقي مقصود، مش تكرار كود بالغلط. اللي اتوحد هو الجزء المكرر
     * فعليًا بس (الشارة فوق وزرار القلب ده).
     * @param {string} productId
     * @returns {string}
     */
    function buildBoseFavButtonHTML(productId) {
        const isFav = typeof window.isBoseFavorite === 'function' && window.isBoseFavorite(productId);
        return `
            <button type="button" class="bose-fav-btn${isFav ? ' is-active' : ''}" data-fav-id="${productId}" aria-label="${isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}" onclick="event.stopPropagation(); if(window.toggleBoseFavorite){ window.toggleBoseFavorite('${productId}', this); }">
                <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
            </button>`;
    }
    window.buildBoseFavButtonHTML = buildBoseFavButtonHTML;

    /**
     * 👑 [محرك موحد وحيد لكل كروت المنتجات في الموقع كله]
     * أي منتج معاه oldPrice أكبر من price بيتحول تلقائياً وفي كل مكان يظهر فيه
     * (فئة، أكثر مبيعاً، وصل حديثاً، صفحة العروض) لكارت "عليه عرض" واضح بشارة خصم
     * وسعر قديم مشطوب ومبلغ التوفير - بدل ما يظهر كمنتج مستقل مربك للعميل.
     * ده الحل الجذري لمشكلة تكرار منتجات العروض (مش بس الجاتوهات) في كل الفئات.
     * @param {Object} product
     * @returns {string}
     */
    function createProductCardHTML(product) {
        if (!product) return '';
        const rawImg = (product.images && product.images.length > 0 && product.images[0]) ? product.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png';
        const safeImg = window.optimizeBoseImageUrl(rawImg, 400);
        const safeTitle = window.escapeBoseHTML(product.title);
        const safeFlavor = window.escapeBoseHTML(product.flavorName || '');
        const safeDesc = window.escapeBoseHTML(product.flavorDesc || (product.description ? product.description.substring(0, 80) + '...' : ''));

        // 🛡️ [إصلاح جذري]: أي منتج "رئيسي" مرتبط بمحاكي تفاعلي (تورت مخصص / بوكيه ورد)
        // معندوش سعر أو تفاصيل ثابتة أصلاً — سعره وتفاصيله بيتحددوا داخل المحاكي فقط.
        // قبل كده كان الكارت بيوديه لصفحة منتج ثابتة (product.html) بسعر ووصف تقريبي غلط،
        // وكأنه "تورتة جاهزة" منفصلة عن المحاكي. دلوقتي بيوديه للمحاكي مباشرة وبس، ومفيش
        // زرار "إضافة للسلة" مباشر أو عداد كمية لأنه مش منطقي هنا خالص.
        const isBuilderMaster = !!product.customBuilderUrl && product.builderType && product.builderType !== 'standard';

        if (isBuilderMaster) {
            return `
                <div class="product-card-unified bose-builder-master-card" data-id="${product.id}" onclick="window.location.href='${product.customBuilderUrl}';" style="cursor:pointer;">
                    <img src="${safeImg}" alt="${safeTitle} | حلويات بوسي" class="product-card-img" width="300" height="300" loading="lazy" />
                    <h3 class="product-card-title">${safeTitle}</h3>
                    <span class="product-card-flavor-name">${safeFlavor}</span>
                    <p class="product-card-desc">${safeDesc}</p>
                    <button type="button" class="bose-desc-toggle-btn" hidden aria-expanded="false" onclick="event.stopPropagation(); window.toggleBoseCardDesc(this);">اظهار المزيد</button>
                    <div class="product-card-price">
                        <span>أسعار تبدأ من ${Math.round(product.basePrice || product.price || 0)} جنيه</span>
                    </div>
                    <button class="btn-add-to-cart" onclick="event.stopPropagation(); window.location.href='${product.customBuilderUrl}';">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> ابدأ التصميم الآن
                    </button>
                </div>
            `;
        }

        // 👑 [إصلاح جذري - كارثة الأحجام]: لو المنتج عنده أكتر من حجم سعر حقيقي (زي
        // الديسباسيتو/القشطوطة: مثلث/وسط/كبير)، لازم يظهر تبويب اختيار حجم مصغر جوه
        // الكارت نفسه في أي مكان يظهر فيه (الرئيسية، العروض، المقترحات) - مش بس في
        // صفحة الفئة أو صفحة المنتج المستقلة. قبل كده كان العميل بيضغط "إضافة للسلة"
        // من هنا فيتضاف تلقائياً بأرخص وأصغر حجم من غير أي تنبيه، وده اللي كانت
        // صاحبة المتجر بتوصفه بـ"الكارثة".
        const availableSizes = (product.prices && typeof product.prices === 'object') ? Object.keys(product.prices) : [];
        const distinctSizePrices = new Set(availableSizes.map(s => product.prices[s]));
        const hasMultipleSizes = availableSizes.length > 1 && distinctSizePrices.size > 1;
        const defaultSizeKey = (product.defaultSize && availableSizes.includes(product.defaultSize)) ? product.defaultSize : (availableSizes[0] || null);

        let sizeTabsHtml = '';
        if (hasMultipleSizes) {
            sizeTabsHtml = `
                <div class="bose-mini-size-note"><i class="fa-solid fa-circle-info"></i> متاح بأحجام متعددة، اختار اللي يناسبك:</div>
                <div class="bose-card-size-tabs" role="group" aria-label="اختيار الحجم">
                    ${availableSizes.map(sizeKey => `
                        <button type="button" class="bose-card-size-pill${sizeKey === defaultSizeKey ? ' active' : ''}"
                                data-size-key="${sizeKey}"
                                onclick="event.stopPropagation(); window.handleBoseCardSizeChange(this, '${product.id}')">${window.BOSE_SIZE_LABELS[sizeKey] || sizeKey}</button>
                    `).join('')}
                </div>
            `;
        }

        // 🖼️🛡️ [إصلاح جذري - الصورة مش بتتغيّر مع الحجم]: الكارت هنا كان دايماً
        // بيعرض images[0] بس، حتى لو المنتج (زي الديسباسيتو والريدڤيلڤت) عنده
        // صورة مختلفة مسجلة لكل حجم في product.sizeImages (نفس البيانات اللي
        // صفحة المنتج وصفحة الفئة بيستخدموها بالفعل). دلوقتي بيبدأ بصورة الحجم
        // الافتراضي المختار لو موجودة، وبيترك data-size-img عشان handleBoseCardSizeChange
        // يقدر يبدّلها لحظياً لما العميل يغيّر تبويب الحجم.
        const defaultSizeImgRaw = (product.sizeImages && defaultSizeKey && product.sizeImages[defaultSizeKey]) ? product.sizeImages[defaultSizeKey] : rawImg;
        const cardImg = window.optimizeBoseImageUrl(defaultSizeImgRaw, 400);

        const calculatedPrice = window.calculateProductFinalPrice(product, hasMultipleSizes ? { size: defaultSizeKey } : {});
        const { hasDiscount, discountBadgeHtml, oldPriceHtml, savingsHtml } = buildBoseDiscountBadgeMarkup(product);

        // 🛡️ [V14.0]: منتج نفدت كميته (isAvailable === false) بيفضل ظاهر في الشبكة
        // (عشان العميل يعرف إنه كان موجود ويرجع يسأل عليه) لكن بيتقفل زرار الإضافة
        // للسلة وبتتحط شارة واضحة بدل ما يتباع منتج مش موجود فعلياً بالخطأ.
        // 🎂 [حل مشكلة "العميل مش فاهم الكمية"]: لو المنتج عنده quantity_note حقيقي
        // من لوحة التحكم (مثال: "دستة كاملة = 12 قطعة")، بيتعرض هنا دايماً وبشكل
        // واضح جنب السعر - مش مخفي جوه ⓘ اختياري - عشان دي حقيقة أساسية لازم كل
        // عميل يشوفها من غير ما يحتاج يكتشفها بنفسه.
        const quantityNoteHtml = product.quantityNote
            ? `<div class="bose-qty-clarity-note"><i class="fa-solid fa-circle-info"></i><span>${window.escapeBoseHTML(product.quantityNote)}</span></div>`
            : '';

        const isUnavailable = product.isAvailable === false;
        const addToCartButtonHtml = isUnavailable
            ? `<button class="btn-add-to-cart" disabled style="opacity:0.6; cursor:not-allowed;">
                    <i class="fa-solid fa-ban"></i> نفدت الكمية حالياً
               </button>`
            : `<button class="btn-add-to-cart" onclick="window.handleBoseDirectAddToCart(this, '${product.id}')">
                    <i class="fa-solid fa-basket-shopping"></i> اضافة للسلة
               </button>`;

        // 💗 [نظام المفضلة]: زرار قلب دائري بيظهر في الركن العلوي المقابل لشارة
        // الخصم/نفدت الكمية (عشان ما يتعارضش معاها بصرياً) في كل كارت منتج قياسي
        // بأي مكان بالموقع (رئيسية، فئة، عروض، مقترحات). الحالة (ممتلئ/فاضي)
        // بتتقرأ فوراً من localStorage عبر window.isBoseFavorite لو محرك المفضلة
        // متحمّل، وبتتحدّث حياً لحظة الضغط عبر window.toggleBoseFavorite.
        const favBtnHtml = buildBoseFavButtonHTML(product.id);

        return `
            <div class="product-card-unified${hasDiscount ? ' bose-offer-card' : ''}${isUnavailable ? ' bose-unavailable-card' : ''}" data-id="${product.id}" data-selected-size="${defaultSizeKey || ''}" onclick="if(!event.target.closest('.product-card-qty-wrapper') && !event.target.closest('.btn-add-to-cart') && !event.target.closest('.bose-card-size-tabs') && !event.target.closest('.bose-fav-btn')){ window.location.href='/product.html?slug=${encodeURIComponent(product.slug)}'; }" style="cursor:pointer;">
                ${discountBadgeHtml}
                ${isUnavailable ? `<div class="offer-badge" style="background:rgba(17,17,17,0.75);">نفدت الكمية</div>` : ''}
                ${favBtnHtml}
                <img src="${cardImg}" alt="${safeFlavor ? safeTitle + ' - ' + safeFlavor : safeTitle} | حلويات بوسي" class="product-card-img" data-size-img="1" width="300" height="300" loading="lazy" style="${isUnavailable ? 'filter:grayscale(60%); opacity:0.75;' : ''}" />
                <h3 class="product-card-title">${safeTitle}</h3>
                <span class="product-card-flavor-name">${safeFlavor}</span>
                <p class="product-card-desc">${safeDesc}</p>
                <button type="button" class="bose-desc-toggle-btn" hidden aria-expanded="false" onclick="event.stopPropagation(); window.toggleBoseCardDesc(this);">اظهار المزيد</button>
                ${sizeTabsHtml}
                ${quantityNoteHtml}
                
                <div class="product-card-qty-wrapper" style="${isUnavailable ? 'display:none;' : ''}">
                    <button class="btn-qty-plus" onclick="window.handleBoseCardQtyChange(this, 1)">+</button>
                    <input type="number" class="input-qty-value" value="1" min="1" readonly />
                    <button class="btn-qty-minus" onclick="window.handleBoseCardQtyChange(this, -1)">-</button>
                </div>
                
                <div class="product-card-price" data-base-price="${calculatedPrice}">
                    ${oldPriceHtml}
                    <span>${Math.round(calculatedPrice)} جنيه</span>
                    ${savingsHtml}
                </div>
                ${addToCartButtonHtml}
            </div>
        `;
    }

    /**
     * 👑 [إصلاح جذري - كارثة الأحجام]: تفعيل تبويب الحجم المصغر جوه أي كارت منتج
     * (رئيسية/عروض/مقترحات) - بيحدث السعر المعروض لحظياً وبيسجل الحجم المختار
     * على الكارت نفسه، عشان handleBoseDirectAddToCart يقرأه صح وقت الإضافة الفعلية.
     * @param {HTMLElement} pillElement
     * @param {string} productId
     */
    window.handleBoseCardSizeChange = function(pillElement, productId) {
        if (!window.BoseStoreData || !pillElement) return;
        const product = window.BoseStoreData.products ? window.BoseStoreData.products.find((/** @type {any} */ p) => p.id === productId || p.slug === productId) : null;
        if (!product) return;

        const card = pillElement.closest('.product-card-unified');
        if (!card) return;
        const sizeKey = pillElement.dataset.sizeKey;

        card.querySelectorAll('.bose-card-size-pill').forEach((/** @type {HTMLElement} */ p) => p.classList.remove('active'));
        pillElement.classList.add('active');
        card.dataset.selectedSize = sizeKey;

        const newPrice = window.calculateProductFinalPrice(product, { size: sizeKey });
        const priceDisplay = card.querySelector('.product-card-price');
        if (priceDisplay) {
            priceDisplay.dataset.basePrice = String(newPrice);
            const priceSpan = priceDisplay.querySelector('span');
            if (priceSpan) priceSpan.textContent = `${Math.round(newPrice)} جنيه`;
        }

        // 🖼️🛡️ [إصلاح جذري - الصورة مش بتتغيّر مع الحجم]: نفس الإصلاح المطبّق في
        // category.html، لكن هنا في المحرك الموحد اللي بيغذي كروت الرئيسية/العروض/
        // المقترحات كلها. لو المنتج عنده صورة مسجلة للحجم الجديد في sizeImages
        // بنبدّلها بفيد بسيط، ولو مفيش صورة مخصصة لهذا الحجم بتفضل الصورة الحالية
        // زي ما هي (مفيش أي كسر أو صورة فاضية).
        const imgNode = card.querySelector('.product-card-img[data-size-img]');
        if (imgNode && product.sizeImages && product.sizeImages[sizeKey]) {
            const newImgUrl = product.sizeImages[sizeKey];
            const optimizedUrl = window.optimizeBoseImageUrl(newImgUrl, 400);
            if (imgNode.getAttribute('src') !== optimizedUrl) {
                imgNode.style.transition = 'opacity 0.15s ease';
                imgNode.style.opacity = '0.4';
                setTimeout(() => {
                    imgNode.src = optimizedUrl;
                    imgNode.style.opacity = '1';
                }, 120);
            }
        }
    };

    // 🛡️ [إصلاح معماري جذري]: createProductCardHTML كانت دالة "موحدة" بالاسم بس،
    // من غير ما تكون متاحة فعلياً لأي صفحة تانية غير core-engine.js نفسه (مش معلقة
    // على window). النتيجة: صفحات زي category.html و cart.html اضطرت تكتب نسخة
    // خاصة بيها من نفس منطق الكارت يدوياً بدل ما تستدعي الدالة دي - وكل نسخة من
    // النسخ دي ممكن تتصلح لوحدها وتفضل الباقي فيهم نفس المشكلة (بالظبط اللي حصل
    // مع مشكلة "تكرار منتجات العروض"). تعليقها هنا على window بيخلي أي صفحة في
    // الموقع كله تقدر تستخدم window.createProductCardHTML(product) بدل ما تعيد
    // كتابة نفس الكود من الصفر.
    window.createProductCardHTML = createProductCardHTML;

    /**
     * 📏 [إصلاح - كارت وصف طويل بيكسر ارتفاع الصف]: النص الأصلي (flavorDesc)
     * بيفضل موجود كامل زي ما هو في الـHTML (مفيش تقصير فعلي للنص)، لكن بصرياً
     * مقصوص لـ3 أسطر بس بـCSS (line-clamp). زرار "اظهار المزيد/اظهار أقل"
     * ده بيبدّل كلاس bose-desc-expanded على فقرة الوصف عشان يوريها كاملة أو
     * يرجعها مقصوصة. مستخدم من كل كروت المنتج (core-engine.js + category.html).
     * @param {HTMLElement} btn
     */
    window.toggleBoseCardDesc = function(btn) {
        if (!btn) return;
        // 🛡️ [يدعم أكتر من شكل كارت]: كارت core-engine.js الفقرة والزرار جنب
        // بعض مباشرة (previousElementSibling كافي)، لكن كارت category.html
        // الفقرة جوه <a> لف حواليها والزرار بره الـ<a> - فبندوّر جوه أقرب
        // حاوية كارت معروفة (product-card-unified / product-card / بطاقة
        // المحاكي) عن أول ‎.product-card-desc بدل الاعتماد على ترتيب الأشقاء.
        const cardWrap = btn.closest('.product-card-unified, .product-card, .bose-builder-master-card') || btn.parentElement;
        const desc = cardWrap ? cardWrap.querySelector('.product-card-desc') : null;
        if (!desc || !desc.classList || !desc.classList.contains('product-card-desc')) return;
        const expanded = desc.classList.toggle('bose-desc-expanded');
        btn.textContent = expanded ? 'اظهار أقل' : 'اظهار المزيد';
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };

    /**
     * زرار "اظهار المزيد" لازم يظهر بس لو النص فعلاً مقصوص (أطول من 3 أسطر) -
     * مش كل الأوصاف طويلة كده، فمفيش داعي نوري زرار فاضي المعنى على كارت
     * وصفه أصلاً قصير وماخدش أكتر من سطرين. بنتأكد بقياس فعلي (scrollHeight
     * أكبر من clientHeight) بعد ما المتصفح يحسب التخطيط فعلياً.
     * @param {HTMLElement} descEl
     */
    function checkBoseDescOverflow(descEl) {
        // 🛡️ نفس منطق البحث في toggleBoseCardDesc: الزرار مش دايماً الشقيق
        // المباشر التالي (كارت category.html بيلف الفقرة جوه <a>)، فبندوّر
        // جوه أقرب حاوية كارت معروفة عن الزرار المناظر لنفس الوصف.
        const cardWrap = descEl.closest('.product-card-unified, .product-card, .bose-builder-master-card') || descEl.parentElement;
        const btn = cardWrap ? cardWrap.querySelector('.bose-desc-toggle-btn') : null;
        if (!btn) return;
        // لو العميل فاتح الوصف بالفعل (bose-desc-expanded)، سيبي الزرار زي ما هو
        if (descEl.classList.contains('bose-desc-expanded')) return;
        const isOverflowing = descEl.scrollHeight > descEl.clientHeight + 1;
        btn.hidden = !isOverflowing;
    }

    /**
     * مراقب واحد بيغطي كل الموقع (بدل ما كل صفحة/دالة رندر تستدعي فحص يدوي):
     * أي كارت منتج جديد بيتضاف لأي مكان في الصفحة (رئيسية/عروض/فئة/سلة/
     * مقترحات...) بيتفحص وصفه تلقائياً فور إضافته. بيشتغل مرة واحدة بس لكل
     * صفحة (window.__boseDescObserverInit) عشان ميتسجلش أكتر من observer.
     */
    function initBoseDescToggleObserver() {
        if (window.__boseDescObserverInit) return;
        window.__boseDescObserverInit = true;

        const scanNode = (node, toCheck) => {
            if (!node || node.nodeType !== 1) return;
            if (node.classList && node.classList.contains('product-card-desc')) toCheck.push(node);
            if (node.querySelectorAll) node.querySelectorAll('.product-card-desc').forEach(d => toCheck.push(d));
        };

        const observer = new MutationObserver((mutations) => {
            const toCheck = [];
            mutations.forEach(m => m.addedNodes.forEach(node => scanNode(node, toCheck)));
            if (toCheck.length) {
                requestAnimationFrame(() => toCheck.forEach(checkBoseDescOverflow));
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // لما عرض الشاشة يتغيّر (تدوير الموبايل، تغيير حجم نافذة الديسكتوب)،
        // عدد الأسطر اللي بتتقص عندها ممكن يتغيّر، فبنعيد فحص كل الأوصاف
        // الظاهرة حالياً (بدون إعادة توسيعها لو كانت مفتوحة بالفعل).
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                document.querySelectorAll('.product-card-desc').forEach(checkBoseDescOverflow);
            }, 200);
        });
    }
    initBoseDescToggleObserver();

    /**
     * @param {HTMLElement} buttonElement
     * @param {number} direction
     */
    window.handleBoseCardQtyChange = function(buttonElement, direction) {
        const qtyContainer = buttonElement.closest('.product-card-qty-wrapper');
        const cardContainer = buttonElement.closest('.product-card-unified');
        if (!qtyContainer || !cardContainer) return;

        /** @type {HTMLInputElement|null} */
        const qtyInput = qtyContainer.querySelector('.input-qty-value');
        const priceDisplay = cardContainer.querySelector('.product-card-price');
        if (!qtyInput || !priceDisplay) return;

        let currentQty = parseInt(qtyInput.value, 10) || 1;
        currentQty += direction;
        if (currentQty < 1) currentQty = 1;
        qtyInput.value = String(currentQty);

        const basePrice = parseFloat(priceDisplay.getAttribute('data-base-price') || '0') || 0;
        priceDisplay.textContent = `${Math.round(basePrice * currentQty)} جنيه`;
    };


    /**
     * @param {number} basePrice
     * @param {string} applyOnContext
     * @returns {number}
     */
    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        if (!window.BoseStoreData) return basePrice;
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return parseFloat((basePrice * (1 + (rule.percent / 100))).toFixed(4));
        }
        return basePrice;
    };

    /**
     * @param {Object} product
     * @param {Object} selectedOptions
     * @returns {number}
     */
    window.calculateProductFinalPrice = function(product, selectedOptions) {
        const opts = selectedOptions || {};
        let price = 0;
        
        if (product) {
            price = product.price || product.basePrice || 0;
            // 🚨🚨 [إصلاح جذري حرج - العروض بتلغي نفسها]: عمود "prices" (الخاص
            // بالأحجام) ممكن يفضل فيه القيمة القديمة قبل الخصم غلط في البيانات
            // (حصل فعلاً مع منتج "جاتوه كلاسيك" سابقاً) - فأي مكان بيمرر "size"
            // كان بيلغي الخصم تماماً ويرجّع السعر القديم. الحل: نستخدم قيمة الحجم
            // بس لو المقاسات فعلاً مختلفة عن بعضها (يعني المنتج multi-size حقيقي)،
            // وإلا نفضل معتمدين على product.price الصحيح المحدث بعد أي خصم.
            if (product.prices && opts.size) {
                const sizeValues = Object.values(product.prices);
                const hasRealSizeVariation = new Set(sizeValues).size > 1;
                if (hasRealSizeVariation) {
                    price = product.prices[opts.size] || price;
                }
            }
            const selectedPrinting = opts.printing || opts.printingType || 'none';
            if (selectedPrinting && selectedPrinting !== 'none') {
                let printingFee = 0;
                if (product.customizationOptions && product.customizationOptions.printing) {
                    const printOptions = product.customizationOptions.printing.options;
                    if (Array.isArray(printOptions)) {
                        const printingOpt = printOptions.find((/** @type {any} */ opt) => opt.id === selectedPrinting || opt.type === selectedPrinting);
                        if (printingOpt) printingFee = printingOpt.price;
                    }
                }
                if (printingFee === 0) {
                    if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') {
                        printingFee = 60;
                    } else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') {
                        printingFee = 15;
                    }
                }
                price += printingFee;
            }
        }
        return window.calculateBosePrice(price, "menu-only");
    };

    /**
     * @param {number|string} persons
     * @param {Object} options
     * @returns {number}
     */
    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = window.BoseStoreData?.cakeBuilder;
        const safePersons = parseInt(String(persons), 10) || (config ? config.persons.minimum : 10) || 10;
        let price = (config ? config.basePrice : 580) || 580;
        const minPersons = (config ? config.persons.minimum : 10) || 10;
        const pricePerPerson = (config ? config.pricePerPerson : 145) || 145; 
        const extraPersons = Math.max(0, safePersons - minPersons);
        price += extraPersons * pricePerPerson;
        
        const selectedPrinting = options.printingType || options.printing || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (config && config.printingOptions) {
                const printOpt = config.printingOptions.find((/** @type {any} */ opt) => opt.id === selectedPrinting);
                if (printOpt) printingFee = printOpt.price;
            }
            if (printingFee === 0) {
                printingFee = (selectedPrinting === 'edible' || selectedPrinting === 'صورة_صالحة_للأكل') ? 60 : 15;
            }
            price += printingFee;
        }
        if (options.wrappingPrice) price += parseFloat(options.wrappingPrice) || 0;
        // 🐛💳 [إصلاح جذري - سعر كارت الإهداء كان بيختفي من الإجمالي]: الحارس المركزي
        // هنا (المستخدم فعلياً وقت الإضافة للسلة) كان بيتجاهل خيار hasGiftCard تماماً
        // رغم إنه بيتبعت له من محاكي التورت، وده عكس calculateCustomFlowerPrice اللي
        // بيضيف giftCardPrice بشكل صحيح - فكانت العميلة بتشوف سطر "+30 جنيه" في
        // ملخص الطلب لكن الإجمالي الفعلي المحسوب والمخزن في السلة معندوش ده الفرق،
        // يعني بتتحاسب أقل من سعر طلبها الحقيقي بـ30 جنيه في كل مرة تختار الكارت.
        if (options.hasGiftCard) {
            const giftCardPrice = parseFloat(config?.giftCard?.price) || 30;
            price += giftCardPrice;
        }
        // 💰🛡️ [إصلاح جذري - سياسة زيادة الأسعار الموسمية]: قبل كده كان بيتبعت
        // "menu-only" ثابتة هنا رغم إن التورت المخصص مش "منتج عادي" - فكان
        // اختيار "المنتجات العادية فقط" في الإعدادات بيطبّق الزيادة على
        // التورت المخصص كمان بالغلط. دلوقتي بيتبعت السياق الحقيقي "builder"
        // اللي بيتطابق مع نفس المنطق المطبّق في create_order_with_items على
        // القاعدة (الزيادة على المحاكيات بس لو applyOn = "all").
        return window.calculateBosePrice(price, "builder");
    };

    /**
     * @param {number|string} flowerCount
     * @param {Object} options
     * @returns {number}
     */
    window.calculateCustomFlowerPrice = function(flowerCount, options = {}) {
        // 🧮 [توحيد مصدر الأسعار - المرحلة 3]: القراءة من window.BoseStoreData.flowerBuilder
        // بدل الأرقام المكتوبة يدوياً، عشان أي تعديل مستقبلي على السعر من قاعدة البيانات
        // ينعكس فعلياً على الموقع. القيم بعد "||" هي نفس الأرقام القديمة تماماً كقيمة
        // احتياطية فقط لو الحقل مفقود من الـ JSON لأي سبب - نفس القيم المستخدمة حرفياً
        // في flower-engine.js لضمان تطابق سعر المحاكي مع سعر الحارس المركزي بالمليم.
        const fbConfig = window.BoseStoreData?.flowerBuilder || {};
        const basePrice = parseFloat(fbConfig.basePrice) || 400;
        const baseFlowers = parseInt(fbConfig.baseFlowers, 10) || 15;
        const extraFlowerPrice = parseFloat(fbConfig.extraFlowerPrice) || 35;
        const photoPrintPrice = parseFloat(fbConfig.photoPrintPrice) || 15;
        // 💰👑 [توحيد سعر كارت الإهداء مع محاكي التورت]: القيمة الاحتياطية هنا كانت
        // 20 وبقت 30 - نفس التعديل المطبق في flowerConfig.giftCardPrice بملف
        // flower-engine.js، عشان الحارس المركزي هنا (اللي بيتأكد من السعر وقت
        // الإضافة للسلة والتشيك أوت) يفضل مطابق تماماً للسعر المعروض للعميل.
        const giftCardPrice = parseFloat(fbConfig.giftCardPrice) || 30;
        // 💰👑 [حقل رسمي لسعر شريط الستان المطبوع]: satinRibbonPrice بقى بيتقرا من
        // flowerBuilder.satinRibbonPrice (لوحة التحكم) بدل القيمة الثابتة 50 -
        // نفس التعديل في flowerConfig.satinRibbonPrice بملف flower-engine.js
        // عشان الحارس المركزي هنا يفضل مطابق تماماً لسعر المحاكي المعروض للعميل.
        const satinRibbonPrice = parseFloat(fbConfig.satinRibbonPrice) || 50;

        // 🐛💰👑 [إصلاح جذري - أنواع الورد ذات السعر الثابت كانت بتتحاسب غلط هنا]:
        // من لما محاكي الورد بقى بيسمح للأدمن يضيف نوع باقة جديد بسعر ثابت
        // (usesFlowerCount: false، زي "بوكيه فراشات" أو "بوكيه صور") - flower-engine.js
        // بيحسب سعره صح فعلاً (بيستخدم السعر الثابت المسجل للنوع)، لكن الحارس
        // المركزي هنا كان لسه بيتجاهل نوع الباقة تماماً ويحسب دايماً بمعادلة "سعر
        // أساسي + سعر الوردة الإضافية" - يعني أي طلب بنوع باقة ثابت السعر كان سعره
        // النهائي المسجل فعلياً في السلة/الطلب يختلف تماماً عن السعر اللي شافته
        // وقبلته العميلة في المحاكي. دلوقتي بيدور على نوع الباقة (options.flowerType)
        // في نفس قائمة fbConfig.flowerTypes، وبيحترم usesFlowerCount زي flower-engine.js
        // بالحرف.
        const flowerTypesList = Array.isArray(fbConfig.flowerTypes) ? fbConfig.flowerTypes : [];
        const selectedType = options.flowerType ? flowerTypesList.find((t) => t && t.id === options.flowerType) : null;
        const usesFlowerCount = !selectedType || selectedType.usesFlowerCount !== false;

        const safeFlowerCount = parseInt(String(flowerCount), 10) || baseFlowers;
        const extraFlowers = Math.max(0, safeFlowerCount - baseFlowers);
        let servicePrice;
        if (usesFlowerCount) {
            servicePrice = basePrice + (extraFlowers * extraFlowerPrice);
        } else {
            servicePrice = (selectedType && selectedType.price > 0) ? parseFloat(selectedType.price) : basePrice;
        }
        if (options.hasSatinRibbon) servicePrice += satinRibbonPrice; 
        const safePhotoCount = parseInt(options.photoCount, 10) || 0;
        if (options.hasPhotos && safePhotoCount > 0) servicePrice += safePhotoCount * photoPrintPrice; 
        if (options.hasGiftCard) servicePrice += giftCardPrice; 
        // 💰🛡️ [إصلاح جذري - نفس إصلاح calculateCustomCakePrice]: الورد المخصص
        // مش "منتج عادي" برضه، فبيتبعت سياق "builder" الحقيقي بدل "menu-only"
        // الثابتة، متطابق مع منطق create_order_with_items على القاعدة.
        const finalServicePrice = window.calculateBosePrice(servicePrice, "builder");
        
        const safeCashAmount = parseFloat(options.cashAmount) || 0;
        const safeChocolateBudget = parseFloat(options.chocolateBudget) || 0;
        return finalServicePrice + safeCashAmount + safeChocolateBudget;
    };

    /**
     * @param {Object} product
     * @param {Object} selectedOptions
     * @param {number} quantity
     * @returns {Object|null}
     */
    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;
        const opts = selectedOptions || {};
        let finalUnitPrice = 0;
        if (product.type === "custom-flower") {
            finalUnitPrice = window.calculateCustomFlowerPrice(opts.flowerCount, opts);
        } else if (product.type === "custom-cake") {
            finalUnitPrice = window.calculateCustomCakePrice(opts.persons, opts);
        } else {
            finalUnitPrice = window.calculateProductFinalPrice(product, opts);
        }
        
        const isCustomizable = product.isMiniCake ||
                             product.type === "custom-cake" || 
                             product.type === "custom-flower" || 
                             (product.customizationOptions && Object.keys(opts).length > 0);
                             
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}` : String(product.slug || product.id);
        let correctFlavor = opts.flavorName || opts.cakeType || product.flavorName || product.flavor || "جاهز وفريش";
        if (correctFlavor === "none" || correctFlavor === "افتراضي") {
            correctFlavor = product.flavorName || "جاهز وفريش";
        }

        return {
            id: finalId,
            productSlug: product.slug,
            title: product.title,
            flavorName: correctFlavor,
            basePrice: parseFloat((product.price || product.basePrice || 0).toFixed(4)),
            finalPrice: parseFloat(finalUnitPrice.toFixed(4)),
            quantity: parseInt(String(quantity), 10) || 1,
            image: (product.images && product.images[0]) || product.image || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
            type: product.type || (product.isMiniCake ? "mini-cake" : "standard"),
            customDetails: {
                cakeType: opts.cakeType || opts.cakeFlavor || "فانيليا",
                shape: opts.shape || "circle",
                persons: parseInt(opts.persons, 10) || (product.isMiniCake ? 2 : 0),
                printingType: opts.printingType || opts.printing || "none",
                customMessage: opts.customMessage || "",
                allergyNote: opts.allergyNote || "",
                // 🐛 [إصلاح خلل موجود من قبل]: isGift وoccasionLabel كانا بيترسلوا من
                // محاكي التورت جوه customOptions لكن معندهمش أي سطر هنا كانوا بيتقروا
                // منه - يعني كانوا بيتمسحوا بصمت ومحدش كان بيشوفهم في السلة ولا فاتورة
                // الواتساب، رغم إن العميلة فعلاً بتختارهم/بتكتبهم.
                isGift: !!opts.isGift,
                occasionLabel: opts.occasionLabel || "",
                flowerType: opts.flowerType || "none",
                flowerCount: parseInt(opts.flowerCount, 10) || 0,
                cashAmount: parseFloat(opts.cashAmount) || 0,
                // 💵👑 [تصليح فاتورة الكاش - فئة الأوراق النقدية]
                cashDenomination: parseFloat(opts.cashDenomination) || 0,
                hasSatinRibbon: !!opts.hasSatinRibbon,
                satinRibbonText: opts.satinRibbonText || "",
                photoCount: parseInt(opts.photoCount, 10) || 0,
                // 🛡️👑📸 [إصلاح جذري حرج - فصل الصور الشخصية عن صورة التصميم]: قبل
                // كده كانت خطوة "صور شخصية جوه الباقة" بتعيد استخدام نفس صورة
                // التصميم (item.image) من غير أي رفع حقيقي مستقل، فمكانش فيه أي
                // مكان لتخزين الصور الشخصية الحقيقية أصلاً. دلوقتي كل صورة شخصية
                // رفعتها العميلة فعلياً (راجع flower-engine.js) بتتخزن هنا كمصفوفة
                // مستقلة تماماً عن item.image (اللي فضل مخصص لصورة التصميم بس).
                personalPhotoUrls: Array.isArray(opts.personalPhotoUrls) ? opts.personalPhotoUrls.filter(u => typeof u === "string" && u.startsWith("http")) : [],
                hasChocolate: !!opts.hasChocolate,
                chocolateBudget: parseFloat(opts.chocolateBudget) || 0,
                hasGiftCard: !!opts.hasGiftCard,
                giftCardText: opts.giftCardText || "",
                // 🖼️ [تمييز نوع كل صورة]: صورة "الطباعة على السطح" وصورة "التصميم
                // المرجعي المطلوب تقريبه" مختلفتان تماماً في الغرض - بنخزنهم منفصلين
                // بدل قايمة واحدة مجهولة، عشان فاتورة الواتساب تقدر توضح لكل واحدة
                // غرضها بالظبط بدل ما تظهر كـ"صورة مرجعية" عامة غامضة.
                printImageUrl: opts.printImageUrl || "",
                replicaImageUrl: opts.replicaImageUrl || "",
                // 👑 [إصلاح جذري - كارثة الأحجام]: نخزن الحجم المختار فعلياً (لو المنتج
                // بيدعم أكتر من حجم سعر) جوه بيانات عنصر السلة، عشان يظهر بوضوح في
                // صفحة السلة وفي فاتورة الواتساب - بدل ما يختفي تماماً ويفضل السعر
                // هو الفرق الوحيد الصامت بين حجم وحجم.
                size: opts.size || null,
                sizeLabel: opts.size ? (window.BOSE_SIZE_LABELS[opts.size] || opts.size) : ""
            }
        };
    };

    /**
     * @param {string} phone
     * @param {boolean} isOptional
     * @returns {boolean}
     */
    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") return isOptional;
        const cleaned = window.sanitizeBosePhoneNumber(phone);
        return /^01[0125][0-9]{8}$/.test(cleaned);
    };

    /**
     * @param {string} phone
     * @returns {string}
     */
    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return "";
        let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        else if (cleaned.startsWith("00201")) cleaned = "0" + cleaned.substring(4);
        else if (cleaned.startsWith("1") && cleaned.length === 10) cleaned = "0" + cleaned;
        return cleaned;
    };

    /**
     * @param {string} phone
     * @returns {string}
     */
    window.toInternationalWhatsappNumber = function(phone) {
        let cleaned = window.sanitizeBosePhoneNumber(phone || "");
        if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
        return "20" + cleaned;
    };

    /**
     * @param {string} phone
     * @param {string} text
     * @returns {string}
     */
    window.buildWhatsappLink = function(phone, text) {
        const intlNumber = window.toInternationalWhatsappNumber(phone);
        const encodedText = encodeURIComponent(text || "");

        // 🛡️🐛👑 [إصلاح جذري - سبب رئيسي لفشل إرسال فاتورة الواتساب]: كان هنا قبل
        // كده رابط "intent://" خاص بأندرويد بيجبر النظام يفتح تحديداً تطبيق
        // واتساب بيزنس (package=com.whatsapp.w4b) - لو العميلة عندها واتساب
        // العادي بس (الغالبية العظمى)، أندرويد المفروض "يرجع" لرابط wa.me
        // العادي (browser_fallback_url) تلقائياً، لكن ده مش مضمون خالص في كل
        // المتصفحات، وأهم حاجة: متصفحات الويب الداخلية اللي بتفتح فيها الصفحة
        // (متصفح إنستجرام/فيسبوك الداخلي In-App Browser - وده أغلب مصدر زيارات
        // متجر بيسوّق على السوشيال ميديا) بترفض غالباً روابط "intent://"
        // الطويلة دي تماماً، فالصفحة كانت بتفضل فاضية ومفيش حاجة بتحصل - العميلة
        // حاسة إن الطلب "خلص" بس مقدرتش تبعت رسالة الواتساب فعلياً. كمان رابط
        // الـintent بالتصميم القديم كان بيحتوي نسخة تانية كاملة من نفس النص
        // مرمّزة (Double-Encoded) جوه S.browser_fallback_url، فكان بيضاعف طول
        // الرابط لأكتر من الضعف (اختبار حقيقي بطلب من صنفين بس كان بيوصل
        // الرابط النهائي لـ~15,600 حرف!) - وده كان بيخلي فرصة الفشل في أي
        // متصفح محدود أعلى بكتير. الحل: رابط wa.me العادي بيشتغل موثوق على
        // أندرويد وiOS والمتصفحات الداخلية كلها، وبيفتح أي نسخة واتساب فعلياً
        // مثبتة عند العميلة (عادي أو بيزنس) من غير ما نجبرها على واحدة بعينها.
        return `https://wa.me/${intlNumber}?text=${encodedText}`;
    };

    /**
     * @param {number} subtotal
     * @param {Object} coupon
     * @returns {number}
     */
    window.calculateCouponDiscount = function(subtotal, coupon) {
        const safeSubtotal = parseFloat(String(subtotal)) || 0;
        if (!coupon) return 0;
        const value = parseFloat(coupon.value) || 0;
        let discount = 0;
        if (coupon.type === "fixed") {
            discount = value;
        } else {
            discount = safeSubtotal * (value / 100);
        }
        // 🆕 [سقف أقصى للخصم]: لو الكوبون عليه maxDiscountAmount (مفيدة خصوصاً
        // مع النوع "نسبة مئوية" عشان طلب كبير جداً ميدّيش خصم مبالغ فيه)، بيتطبق
        // هنا بعد الحساب مباشرة - نفس المنطق بالظبط اللي بيطبقه create_order_with_items
        // في القاعدة، عشان الرقم المعروض للعميلة يطابق اللي هيتسجل فعلياً.
        const maxDiscountAmount = coupon.maxDiscountAmount !== undefined && coupon.maxDiscountAmount !== null
            ? parseFloat(coupon.maxDiscountAmount) : null;
        if (maxDiscountAmount !== null && !isNaN(maxDiscountAmount)) {
            discount = Math.min(discount, maxDiscountAmount);
        }
        return Math.max(0, Math.min(discount, safeSubtotal));
    };

    /**
     * 🧮 [إصلاح حرج - المرحلة 1]: الدالة الموحدة الوحيدة لحساب فاتورة السلة/الشحن/الطلب النهائي.
     * تُستخدم من cart-engine.js في 3 نقاط: ملخص السلة، ملخص الشحن بالـ checkout، وتأكيد الطلب النهائي،
     * لضمان تطابق الأرقام بالمليم في كل مرحلة من رحلة الشراء.
     * القاعدة المالية الصارمة: لا تقريب على الأسعار الفردية أو subtotal/discount، والتقريب الوحيد
     * يتم مرة واحدة وحصرياً على الإجمالي الكلي النهائي (grandTotal).
     * @param {Array} cart
     * @param {Object} storeData
     * @param {number} shippingFee
     * @returns {{subtotal: number, discount: number, shippingFee: number, grandTotal: number, itemsCount: number}}
     */
    window.calculateBoseInvoice = function(cart, storeData, shippingFee, loyaltyDiscountAmount, voucherDiscountAmount) {
        const safeCart = Array.isArray(cart) ? cart : [];
        const safeShippingFee = parseFloat(String(shippingFee)) || 0;
        // 🎁 [نظام نقاط الولاء]: خصم تلقائي حسب ترتيب الطلب (5%/10%/15%) وخصم
        // قسيمة الولاء (300 جنيه كل 10 طلبات) - بيتحسبوا في checkout.html بمجرد
        // ما رقم الهاتف يتأكد صحيح (عن طريق get_customer_rewards/validate_loyalty_voucher)
        // ويترسلوا هنا كباراميتر اختياري عشان يظهروا كبند منفصل وواضح للعميلة
        // قبل ما تأكد الطلب، بدل ما يتطبقوا بصمت في قاعدة البيانات بس.
        const safeLoyaltyDiscount = parseFloat(String(loyaltyDiscountAmount)) || 0;
        const safeVoucherDiscount = parseFloat(String(voucherDiscountAmount)) || 0;

        let subtotal = 0;
        let itemsCount = 0;
        safeCart.forEach((/** @type {any} */ item) => {
            const unitPrice = parseFloat(item.finalPrice) || 0;
            const qty = parseInt(item.quantity, 10) || 1;
            subtotal += unitPrice * qty;
            itemsCount += qty;
        });
        subtotal = parseFloat(subtotal.toFixed(4));

        let couponDiscount = 0;
        let activeCouponCode = null;
        try {
            // 🛡️ [إصلاح أمني]: بيانات الكوبون النشط بقت جاية من نتيجة تحقق آمن عبر
            // الباكند (validate_coupon RPC) وقت الضغط على "تطبيق"، مش من قايمة
            // storeData.coupons العامة القديمة اللي كانت بتفضح كل أكواد الخصم لأي
            // حد يفتح site-data-final.json مباشرة. راجع onclick الخاص بـ btn-apply-coupon
            // في cart-engine.js لمصدر بيانات bose_active_coupon الجديد.
            const rawActiveCoupon = localStorage.getItem("bose_active_coupon");
            if (rawActiveCoupon) {
                const activeCoupon = JSON.parse(rawActiveCoupon);
                if (activeCoupon && activeCoupon.code) {
                    couponDiscount = window.calculateCouponDiscount(subtotal, activeCoupon);
                    activeCouponCode = activeCoupon.code;
                }
            }
        } catch (e) {
            couponDiscount = 0;
            activeCouponCode = null;
        }
        couponDiscount = parseFloat(couponDiscount.toFixed(4));

        const discount = parseFloat((couponDiscount + safeLoyaltyDiscount + safeVoucherDiscount).toFixed(4));
        const grandTotal = Math.round(Math.max(0, subtotal - discount) + safeShippingFee);

        return {
            subtotal: subtotal,
            discount: discount,
            couponDiscount: couponDiscount,
            loyaltyDiscountAmount: safeLoyaltyDiscount,
            voucherDiscountAmount: safeVoucherDiscount,
            shippingFee: safeShippingFee,
            grandTotal: grandTotal,
            itemsCount: itemsCount,
            couponCode: activeCouponCode
        };
    };

    /**
     * 🆔 [إصلاح حرج - المرحلة 1]: توليد رقم طلب فريد فعلياً (طابع زمني بصيغة Base36 + رقم عشوائي)
     * لمنع تصادم أرقام الطلبات بين عمليتي شراء متزامنتين.
     * @returns {string}
     */
    window.generateBoseOrderId = function() {
        const timestampPart = Date.now().toString(36).toUpperCase();
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        return `${timestampPart}${randomPart}`;
    };

    /**
     * @param {string} url
     * @param {number|string} width
     * @returns {string}
     */
    window.optimizeBoseImageUrl = function(url, width) {
        if (!url || typeof url !== "string") return url;
        if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
        const safeWidth = parseInt(String(width), 10) || 600;
        // 🛡️🛡️ [إصلاح جذري - جودة الصور الضبابية]: كنا بنطلب من Cloudinary نفس
        // عرض الـ CSS المعروض بالبكسل بالظبط (180/250/300px..) من غير أي اعتبار
        // لكثافة بكسل الشاشة (Device Pixel Ratio). شاشات الموبايل والتابلت
        // الحديثة (Retina/2x/3x) بتعرض كل "بكسل CSS" بـ 2 أو 3 بكسل فعلي فيها،
        // فكانت كل صور الموقع بتوصل بدقة أقل بكتير من دقة الشاشة الحقيقية وتظهر
        // ضبابية/معتمة (خصوصاً في قسم "تسوق حسب الفئة" اللي كروته بتوصل لـ 420px
        // ارتفاع فعلي بينما كان بيتطلب منها بس 250px). دلوقتي بنضرب العرض
        // المطلوب في نسبة كثافة بكسل الجهاز الفعلية (بحد أقصى 3x لتفادي تحميل
        // صور ضخمة بلا داعي وإهدار بيانات). كمان رفعنا q_auto العادي لـ
        // q_auto:good كأرضية جودة أعلى تفادياً لأي ضغط عدواني زيادة عن اللزوم
        // من وضع q_auto الافتراضي على صور فيها تفاصيل دقيقة (كريمة/زهور/تزيين).
        const dpr = (typeof window !== "undefined" && window.devicePixelRatio) ? Math.min(window.devicePixelRatio, 3) : 2;
        const targetWidth = Math.round(safeWidth * dpr);
        const transform = `f_auto,q_auto:good,w_${targetWidth},c_limit`;
        if (url.includes("/upload/f_auto") || url.includes("/upload/q_auto")) return url;
        return url.replace("/upload/", `/upload/${transform}/`);
    };

    /**
     * 🛡️ [إصلاح - مصدر واحد حي لصور الفئات]: بترجع قايمة الفئات جاهزة للعرض
     * (id/title/image/builderType) مبنية مباشرة من جدول categories الحي
     * (data.categories) بدل الاعتماد على نسخة homepage.categoriesSlider
     * المحفوظة (snapshot) اللي كانت بتفضل قديمة لحد ما حد يفتح صفحة الهوم
     * بيدج في لوحة التحكم ويدوس حفظ. النتيجة: أي صورة/عنوان فئة بيتغيّر من
     * admin/categories.html بيظهر فوراً في الرئيسية والمنيو من غير أي خطوة
     * تانية. بيرجع للـ snapshot القديم بس لو جدول categories وصل فاضي فعلاً
     * (حماية من كسر الصفحة، مش السلوك المتوقع في الاستخدام العادي).
     * @returns {Array<Object>}
     */
    window.getBoseCategoriesList = function() {
        const data = window.BoseStoreData;
        if (!data) return [];
        if (Array.isArray(data.categories) && data.categories.length) {
            return data.categories
                .slice()
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((c) => ({
                    id: c.id,
                    title: c.title,
                    image: c.image || "",
                    builderType: c.builder_type || "standard",
                    // 🚨 [إصلاح حرج - الوصف العام للفئة]: كان الحقل ده ناقص هنا تمامًا، فأي
                    // صفحة فئة (category.html) بتحاول تجيب categoryObj.description كانت
                    // دايمًا بتلاقيه undefined وتقع تلقائيًا (fallback) على وصف أول منتج
                    // في الفئة حسب الترتيب - يعني مثلاً فئة "الجاتوهات" كانت بتعرض وصف
                    // منتج "جاتوه ملكي" (أول منتج بترتيب 1) كأنه الوصف العام للفئة كلها،
                    // بدل الوصف العام الحقيقي المكتوب فعليًا في جدول categories.
                    description: c.description || "",
                }));
        }
        return (data.homepage && data.homepage.categoriesSlider) || [];
    };

    /**
     * 📖✨ [أداة موحدة: "قراءة المزيد" لأي نص طويل في الموقع]: بتقيس الارتفاع
     * الحقيقي لعنصر بعد ما يترسم، ولو طلع أطول من collapsedHeight بيتقص بصريًا
     * (مع تظليل تدريجي في الآخر) ويظهر زرار تبديل "قراءة المزيد ↔ عرض أقل".
     * لو النص قصير أصلاً مفيش أي تقصير ولا زرار. مصممة عشان تتستخدم في أي صفحة
     * فيها نص طويل (وصف المنتج، فقرات "من نحن"، ...إلخ) بنفس الشكل والسلوك.
     *
     * 🐛 [إصلاح باج حقيقي - القياس كان بيحصل بدري جدًا]: كان القياس بيحصل
     * فورًا وقت الرسم، قبل ما يخلص تحميل خط Cairo (اللي بيتحمّل بـ
     * font-display:swap فبيبان بخط احتياطي الأول) وقبل ما الصور اللي فوق
     * النص تخلص تحميل - فالارتفاع الحقيقي كان بيتقاس غلط (أصغر من الحقيقة)،
     * فنصوص طويلة جدًا كانت بتفلت من الشرط وتتعرض كاملة من غير تقصير ولا زرار
     * "قراءة المزيد" خالص، خصوصًا على نت بطيء. الحل: كل عنصر بيتسجّل في قائمة
     * وبيتعاد قياسه تلقائيًا تاني بعد ما الخط يخلص تحميل فعليًا (document.fonts.ready)
     * وبعد ما الصفحة تخلص تحميل بالكامل (window load، للصور) - وبيحافظ على
     * اختيار العميل لو كانت فعلاً ضغطت "قراءة المزيد" قبل كده (مبترجعش تتقفل
     * تحته من غير ما تحس).
     * @param {HTMLElement} el
     * @param {number} collapsedHeight
     */
    window.__boseReadMoreTargets = window.__boseReadMoreTargets || new Map();
    let boseReadMoreListenersAttached = false;
    function boseReadMoreRemeasureAll() {
        window.__boseReadMoreTargets.forEach(function (collapsedHeight, el) {
            if (el && el.isConnected) {
                window.initBoseReadMore(el, collapsedHeight);
            } else {
                window.__boseReadMoreTargets.delete(el);
            }
        });
    }
    window.initBoseReadMore = function (el, collapsedHeight) {
        if (!el) return;
        window.__boseReadMoreTargets.set(el, collapsedHeight);

        if (!boseReadMoreListenersAttached) {
            boseReadMoreListenersAttached = true;
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(function () {
                    requestAnimationFrame(boseReadMoreRemeasureAll);
                });
            }
            window.addEventListener("load", function () {
                requestAnimationFrame(boseReadMoreRemeasureAll);
            });
        }

        // لو العميل فاتحة الوصف بالفعل (ضغطت "قراءة المزيد")، منسيبهاش ونقفله
        // تحتها لما القياس يتعاد بعد تحميل الخط/الصور.
        if (el._boseReadMoreBtn && el._boseReadMoreBtn.getAttribute("aria-expanded") === "true") {
            return;
        }

        if (el._boseReadMoreBtn) {
            el._boseReadMoreBtn.remove();
            el._boseReadMoreBtn = null;
        }
        el.classList.remove("bose-readmore-collapsed", "bose-readmore-expanded");
        el.style.maxHeight = "";

        const fullHeight = el.scrollHeight;
        if (fullHeight <= collapsedHeight + 24) return; // النص قصير أصلاً، مفيش داعي لزرار

        el.classList.add("bose-readmore-collapsed");
        el.style.maxHeight = collapsedHeight + "px";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bose-read-more-btn";
        btn.setAttribute("aria-expanded", "false");
        btn.innerHTML = `<span>قراءة المزيد</span><i class="fa-solid fa-chevron-down"></i>`;
        btn.addEventListener("click", function () {
            const expanded = el.classList.toggle("bose-readmore-expanded");
            el.classList.toggle("bose-readmore-collapsed", !expanded);
            el.style.maxHeight = expanded ? el.scrollHeight + "px" : collapsedHeight + "px";
            btn.classList.toggle("is-expanded", expanded);
            btn.setAttribute("aria-expanded", expanded ? "true" : "false");
            btn.querySelector("span").textContent = expanded ? "عرض أقل" : "قراءة المزيد";
        });

        el.insertAdjacentElement("afterend", btn);
        el._boseReadMoreBtn = btn;
    };

    /**
     * @param {string} str
     * @returns {string}
     */
    window.escapeBoseHTML = function(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    /**
     * @param {string} dateStr
     * @param {string} timeStr
     * @returns {boolean}
     */
    // 🛡️ [إصلاح - المرحلة 2]: قبل كده كانت الدالة بتطبّق 24 ساعة على كل أنواع
    // الطلبات بدون استثناء، بينما "الشروط والأحكام" الرسمية بتوعد العميل بمدة
    // أسبوع كامل للتورت والورد المخصص عبر المحاكي (لأنها بتاخد مراحل تحضير وتنسيق
    // كتيرة). دلوقتي الدالة بتاخد isCustomOrder وتطبّق العتبة الصحيحة المطابقة
    // لصاحب المتجر: 168 ساعة (7 أيام) للمخصص، 24 ساعة لباقي المنتجات.
    window.validateBoseDeliverySchedule = function(dateStr, timeStr, isCustomOrder = false) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        const currentDateTime = new Date(Date.now() + (window.boseServerTimeOffset || 0));
        if (selectedDateTime <= currentDateTime) return false;
        const rules = window.BoseStoreData?.orderRules || {};
        const requiredHours = isCustomOrder
            ? (rules.minPreparationTimeHoursCustom || 168) - 0.05
            : (rules.minPreparationTimeHours || 24) - 0.05;
        return (selectedDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60) >= requiredHours;
    };

    // 🛡️ [إصلاح - المرحلة 2]: دالة مشتركة موحّدة لتحديد هل السلة فيها منتج مخصص
    // (تورت محاكي / ورد محاكي) يستوجب قاعدة الأسبوع، بدل تكرار نفس الشرط في أكتر
    // من ملف (cart-engine.js وcheckout.html) بشكل منفصل وعرضة للتعارض مستقبلاً.
    window.boseCartHasCustomItem = function(cart) {
        if (!Array.isArray(cart)) return false;
        return cart.some(item =>
            item.type === "custom-cake" ||
            item.type === "mini-cake" ||
            item.type === "custom-flower" ||
            item.productSlug === "toort-custom-master" ||
            item.productSlug === "flowers-master"
        );
    };

    // 🛡️🎂 [عزل الطلبات المختلطة]: السلة اللي فيها تورت/ورد مخصص (بيتحجز على
    // موعد بعد أسبوع) بجانب منتجات عادية (المفروض تتسلّم أسرع بكتير) بتاخد
    // كلها نفس الموعد المتأخر حاليًا - قرار صاحبة المتجر: نسمح بالخلط لكن
    // لازم نوضّح للعميلة بشفافية إن منتجاتها العادية هتتأخر معاه، مش تتفاجئ
    // بعد ما تأكد الطلب. الدالة دي بترجع true بس لو فيه الاتنين مع بعض (مخصص
    // + عادي)، مش لو السلة كلها مخصصة أو كلها عادية.
    window.boseCartHasMixedRegularAndCustom = function(cart) {
        if (!Array.isArray(cart) || cart.length === 0) return false;
        if (!window.boseCartHasCustomItem(cart)) return false;
        return cart.some(item =>
            item.type !== "custom-cake" &&
            item.type !== "mini-cake" &&
            item.type !== "custom-flower" &&
            item.productSlug !== "toort-custom-master" &&
            item.productSlug !== "flowers-master"
        );
    };

    // 🌸 [تخصيص ملاحظات السكر/الحساسية حسب محتوى السلة]: التسمية العامة
    // "سكر خفيف / حساسية معينة" في checkout.html معناها فعلياً للحلويات
    // بس - العميلة اللي بتطلب بوكيه ورد مخصص فقط (من غير أي تورت/حلويات)
    // مالهاش أي داعي تشوف كلمة "سكر" ضمن ملاحظات طلبها، ده بيلخبط ومش
    // منطقي. الدالة دي بترجع تصنيف بسيط للسلة يستخدمه checkout.html
    // (وأي صفحة تانية محتاجة نفس التمييز) عشان يغيّر تسمية الحقل ديناميكيًا.
    window.boseGetCartItemsComposition = function(cart) {
        if (!Array.isArray(cart) || cart.length === 0) {
            return { hasFlowerItem: false, hasFoodItem: false };
        }
        const isFlowerItem = (item) => item.type === "custom-flower" || item.productSlug === "flowers-master";
        const hasFlowerItem = cart.some(isFlowerItem);
        const hasFoodItem = cart.some(item => !isFlowerItem(item));
        return { hasFlowerItem, hasFoodItem };
    };

    /**
     * @param {Object} item
     * @returns {number}
     */
    window.recalculateCartItemPrice = function(item) {
        if (!item || !window.BoseStoreData) return parseFloat(item?.finalPrice) || 0;
        const details = item.customDetails || {};

        if (item.type === "custom-cake") {
            // 🐛💳 [إصلاح جذري - نفس خلل كارت الإهداء لكن في حارس الأمان وقت التشيك
            // أوت]: الدالة دي هي اللي بتتأكد إن سعر كل عنصر في السلة "موثوق" فعلاً
            // (مش متلاعب فيه) قبل إتمام الطلب - كانت بتعيد حساب سعر التورت المخصص من
            // غير ما تبعت hasGiftCard خالص، يعني حتى بعد إصلاح calculateCustomCakePrice
            // نفسها، أي عنصر فيه كارت إهداء كان هيتحسب سعره التقديري هنا من غير الـ30
            // جنيه، والفرق ده كان هيتعامل معاه كـ"تلاعب بالسعر" ويتفرض عليه السعر الأقل
            // تلقائياً، أو في أسوأ الأحوال يمنع إتمام الطلب - فكارت الإهداء كان مقضي
            // عليه يختفي حتى لو العميلة والموقع اتفقوا عليه صح في المحاكي.
            return window.calculateCustomCakePrice(details.persons, { printingType: details.printingType, hasGiftCard: details.hasGiftCard });
        }
        if (item.type === "custom-flower") {
            return window.calculateCustomFlowerPrice(details.flowerCount, {
                flowerType: details.flowerType,
                hasSatinRibbon: details.hasSatinRibbon,
                photoCount: details.photoCount,
                hasPhotos: details.photoCount > 0,
                hasGiftCard: details.hasGiftCard,
                cashAmount: details.cashAmount,
                chocolateBudget: details.hasChocolate ? details.chocolateBudget : 0
            });
        }

        const product = window.BoseStoreData.products?.find((/** @type {any} */ p) => p.slug === item.productSlug);
        if (!product) return parseFloat(item.finalPrice) || 0;

        return window.calculateProductFinalPrice(product, {
            printing: details.printingType
        });
    };

    /**
     * @param {Array} cart
     * @returns {{cart: Array, wasTampered: boolean}}
     */
    window.recalculateFullCart = function(cart) {
        let wasTampered = false;
        const fixedCart = (cart || []).map((/** @type {any} */ item) => {
            const trustedPrice = window.recalculateCartItemPrice(item);
            const storedPrice = parseFloat(item.finalPrice) || 0;
            if (Math.abs(trustedPrice - storedPrice) > 0.5) wasTampered = true;
            return { ...item, finalPrice: parseFloat(trustedPrice.toFixed(4)) };
        });
        return { cart: fixedCart, wasTampered };
    };

    /**
     * 🛡️ [إصلاح حرج]: نظام رسائل التنبيه المؤقتة (toast) - كان بيتنادى عليه في
     * أكتر من 8 أماكن في الموقع (تمت الإضافة للسلة، تم إرسال المراجعة، إلخ)
     * بس الدالة نفسها كانت مش متعرّفة في أي مكان، يعني كل الرسائل دي كانت
     * بتفشل بصمت (typeof === 'function' بيرجع false) والعميل ملوش أي تأكيد
     * بصري إن الإضافة للسلة نجحت غير رقم صغير في شارة السلة بالزاوية.
     * الـ CSS الخاص بالتصميم (#bose-toast-container / .bose-toast-message)
     * كان جاهز فعلاً من قبل في global.css - هنا بس بنوصّله بمنطق JS شغال.
     */
    window.showBoseToast = function (message, duration = 3200) {
        if (!message) return;
        let container = document.getElementById('bose-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'bose-toast-message';
        toast.textContent = message;
        container.appendChild(toast);

        // فريم إضافي قبل إضافة is-visible عشان الـ transition يشتغل فعلاً
        // (لو ضفناها في نفس الفريم، المتصفح مش هيعمل انتقال من الحالة الابتدائية)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('is-visible'));
        });

        setTimeout(() => {
            toast.classList.remove('is-visible');
            toast.classList.add('is-leaving');
            setTimeout(() => toast.remove(), 420);
        }, duration);
    };

    /**
     * 🌸🌸 [نظام يتفاعل مع العميل ويتعرّف عليه]: "ملف تعريف العميل" بيتحفظ
     * محلياً في جهاز العميل (localStorage) بمجرد ما يخلّص أول طلب بنجاح -
     * اسمه، أرقام هاتفه، تفاصيل عنوانه، منطقته، وملاحظاته (حساسية/سكر خفيف +
     * ملاحظات الشحن). الهدف إن العميل ميضطرش يكتب نفس البيانات من الأول في
     * كل مرة، وإن الموقع "يفتكره" ويرحب بيه باسمه لما يرجع تاني (راجع نداء
     * showBoseToast في نهاية buildAndInjectGlobalComponents تحت).
     * @param {{name: string, phone1?: string, phone2?: string, deliveryMethod?: string, zoneId?: string, addressDetails?: string, orderNotes?: string, shippingNotes?: string}} profileData
     */
    window.saveBoseCustomerProfile = function(profileData) {
        if (!profileData || !profileData.name) return;
        try {
            localStorage.setItem('bose_customer_profile', JSON.stringify({
                name: profileData.name,
                phone1: profileData.phone1 || "",
                phone2: profileData.phone2 || "",
                deliveryMethod: profileData.deliveryMethod || "",
                zoneId: profileData.zoneId || "",
                addressDetails: profileData.addressDetails || "",
                orderNotes: profileData.orderNotes || "",
                shippingNotes: profileData.shippingNotes || "",
                savedAt: Date.now()
            }));
        } catch (e) { /* تجاهل بأمان لو التخزين المحلي ممتلئ أو غير متاح */ }
    };

    /**
     * @returns {null | {name: string, phone1: string, phone2: string, deliveryMethod: string, zoneId: string, addressDetails: string, orderNotes: string, shippingNotes: string}}
     */
    window.getBoseCustomerProfile = function() {
        try {
            const raw = localStorage.getItem('bose_customer_profile');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return (parsed && parsed.name) ? parsed : null;
        } catch (e) {
            return null;
        }
    };

    window.updateGlobalCartCounter = function() {
        const cartCountBadges = document.querySelectorAll('#nav-cart-count, .nav-cart-badge');
        if (cartCountBadges.length === 0) return;

        // 🛡️ [إصلاح]: الدالة دي بتشتغل في كل صفحة (تحديث عداد السلة في الهيدر)،
        // فلو بيانات bose_cart المحفوظة اتلخبطت لأي سبب، كانت هتكسر رندرة
        // الهيدر بالكامل في كل صفحات الموقع - دلوقتي بترجع سلة فاضية بأمان
        // بدل ما توقف تنفيذ باقي كود الصفحة.
        let cart = [];
        try {
            const rawCart = localStorage.getItem('bose_cart');
            cart = rawCart ? JSON.parse(rawCart) : [];
            if (!Array.isArray(cart)) cart = [];
        } catch (e) {
            console.warn("⚠️ بيانات السلة المحفوظة كانت تالفة أثناء تحديث عداد الهيدر.", e);
            cart = [];
        }
        let totalDisplayItems = 0;
        cart.forEach((/** @type {any} */ item) => {
            // ملاحظة: المنتجات المخصصة (تورت/ورد) بيتولد لها id بالشكل `${slug}-${Date.now()}`
            // يعني بينتهي بسلسلة أرقام طويلة (timestamp)، وده الفارق الحقيقي عن أكواد
            // المنتجات العادية اللي بتستخدم شرطات في كتابتها (kebab-case) زي donuts-matilda
            const hasTimestampSuffix = item.id && /-\d{10,}$/.test(String(item.id));
            const isBespokeOrCustom = item.type === "custom-cake" || 
                                      item.type === "custom-flower" || 
                                      item.type === "mini-cake" || 
                                      hasTimestampSuffix;
            totalDisplayItems += isBespokeOrCustom ? 1 : (parseInt(item.quantity, 10) || 1);
        });
        cartCountBadges.forEach((badge) => badge.textContent = String(totalDisplayItems));

        // 🛒 [سلة عائمة]: تبديل حالة الفقاعة العائمة بين "فيها أصناف" (وميض تنبيهي
        // مستمر يفكّر العميل إنه لسه لازم يكمّل طلبه) و"فاضية" (الوميض بيقف تماماً
        // لأنه مفيش داعي نلفت نظره لسلة لسه ملهاش محتوى).
        const floatingCartBtn = document.getElementById('bose-floating-cart-btn');
        if (floatingCartBtn) {
            floatingCartBtn.classList.toggle('is-empty', totalDisplayItems === 0);
            floatingCartBtn.classList.toggle('has-items', totalDisplayItems > 0);
        }
    };

    /**
     * @param {string} message
     */
    window.showBoseGlobalToast = function(message) {
        let container = document.getElementById('bose-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'bose-toast-message';
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('is-visible'));
        setTimeout(() => {
            toast.classList.remove('is-visible');
            toast.classList.add('is-leaving');
            setTimeout(() => { toast.remove(); }, 400);
        }, 3000);
    };

    /**
     * @param {HTMLElement} buttonElement
     * @param {string} productId
     */
    window.handleBoseDirectAddToCart = function(buttonElement, productId) {
        if (!window.BoseStoreData || !buttonElement) return;
        const product = window.BoseStoreData.products ? window.BoseStoreData.products.find((/** @type {any} */ p) => p.id === productId || p.slug === productId) : null;
        if (!product) return;

        // 🛡️ [إصلاح حرج - السلة كانت بتضيف التورت/البوكيه المخصص مباشرة من غير محاكي]:
        // createProductCardHTML وحدها كانت بتتأكد إن المنتج "رئيسي مرتبط بمحاكي"
        // (isBuilderMaster) قبل ما تعرض زرار "اضافة للسلة" أصلاً - أي استدعاء تاني
        // لهذه الدالة من مكان مختلف (مثلاً كارت "منتجات مقترحة" داخل صفحة السلة أو
        // صفحة منتج) كان بيعدي من غير أي فحص، فيضيف تورتة/بوكيه بسعر ووصف افتراضي
        // فارغين تماماً بدون ما العميل يختار الطعم/الشكل/عدد الأفراد من المحاكي.
        // الفحص دلوقتي بقى موجود جوه الدالة نفسها (مش بس جوه الكارت) عشان
        // مفيش أي طريقة تانية تقدر تتحايل عليه مهما كان مصدر الاستدعاء.
        const isBuilderMasterProduct = !!product.customBuilderUrl && product.builderType && product.builderType !== 'standard';
        if (isBuilderMasterProduct) {
            window.location.href = product.customBuilderUrl;
            return;
        }

        // 🛡️ [V14.0]: حارس أخير يمنع إضافة منتج نفدت كميته للسلة حتى لو حصل أي
        // استدعاء مباشر للدالة دي متجاوز لواجهة الزرار المعطّل في createProductCardHTML.
        if (product.isAvailable === false) {
            if (typeof window.showBoseGlobalToast === 'function') {
                window.showBoseGlobalToast('عذراً، هذا الصنف نفدت كميته حالياً.');
            }
            return;
        }

        const cardContainer = buttonElement.closest('.product-card-unified');
        let qty = 1;
        if (cardContainer) {
            /** @type {HTMLInputElement|null} */
            const qtyInput = cardContainer.querySelector('.input-qty-value');
            if (qtyInput) qty = parseInt(qtyInput.value, 10) || 1;
        }

        // 👑 [إصلاح جذري - كارثة الأحجام]: نقرأ الحجم اللي العميل اختاره فعلياً من
        // تبويب الحجم المصغر جوه الكارت (لو المنتج بيدعم أكتر من حجم) بدل ما نضيفه
        // دايماً بأرخص حجم افتراضي زي ما كان بيحصل قبل كده في أي كارت خارج صفحة الفئة.
        const selectedSize = cardContainer ? (cardContainer.dataset.selectedSize || null) : null;
        const addOpts = selectedSize ? { size: selectedSize } : {};

        // 🛡️ [إصلاح]: لو بيانات السلة المحفوظة تالفة، منمنعش العميلة من الإضافة -
        // بنرجع سلة فاضية ونكمل عادي بدل ما الضغطة على "أضف للسلة" تفشل بصمت.
        let cart = [];
        try {
            const rawCart = localStorage.getItem('bose_cart');
            cart = rawCart ? JSON.parse(rawCart) : [];
            if (!Array.isArray(cart)) cart = [];
        } catch (e) {
            console.warn("⚠️ بيانات السلة المحفوظة كانت تالفة أثناء الإضافة، تم البدء بسلة فاضية.", e);
            cart = [];
        }
        const cartLineId = selectedSize ? `${product.slug}-${selectedSize}` : product.slug;
        // 🛡️ [إصلاح]: نفس الحد الأقصى المنطقي المطبّق في صفحة السلة (20 قطعة)،
        // عشان العميلة متقدرش تتخطاه حتى وهي لسه في صفحة المنتج/الفئة.
        const MAX_QTY_FROM_PRODUCT_CARD = 20;
        const existingItem = cart.find((/** @type {any} */ item) => item.id === cartLineId);
        if (existingItem) {
            existingItem.quantity = Math.min(existingItem.quantity + qty, MAX_QTY_FROM_PRODUCT_CARD);
        } else {
            const cappedQty = Math.min(qty, MAX_QTY_FROM_PRODUCT_CARD);
            const newItem = window.createCartItem(product, addOpts, cappedQty);
            if (newItem) { newItem.id = cartLineId; cart.push(newItem); }
        }

        localStorage.setItem('bose_cart', JSON.stringify(cart));
        window.updateGlobalCartCounter();

        // 📊 [نمو - AddToCart]: حدث تجاري حقيقي لكل الأماكن اللي بتستخدم الدالة
        // دي (كارت المنتج في الفئة/المنيو/اقتراحات صفحة السلة والمنتج).
        const finalUnitPriceForEvent = window.calculateProductFinalPrice(product, addOpts);
        window.fireBoseCommerceEvent('add_to_cart', {
            value: finalUnitPriceForEvent * qty, currency: window.BoseStoreData?.store?.currency || 'EGP',
            contentId: product.id || product.slug, contentName: product.title, quantity: qty
        });

        if (cardContainer) {
            /** @type {HTMLInputElement|null} */ const qtyInput = cardContainer.querySelector('.input-qty-value');
            const priceDisplay = cardContainer.querySelector('.product-card-price');
            const finalUnitPrice = window.calculateProductFinalPrice(product, addOpts);
            if (qtyInput) qtyInput.value = "1";
            if (priceDisplay) {
                const priceSpan = priceDisplay.querySelector('span');
                if (priceSpan) priceSpan.textContent = `${Math.round(finalUnitPrice)} جنيه`;
                else priceDisplay.textContent = `${Math.round(finalUnitPrice)} جنيه`;
            }
        }

        const originalHtml = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fa-solid fa-check"></i> تمت الإضافة';
        /** @type {HTMLButtonElement} */ (buttonElement).disabled = true;

        window.showBoseGlobalToast('ضفنا المنتج للسلة.');

        setTimeout(() => {
            buttonElement.innerHTML = originalHtml;
            /** @type {HTMLButtonElement} */ (buttonElement).disabled = false;
        }, 2500);
    };

    function injectEarlyDependencies() {
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            const p1 = document.createElement('link'); p1.rel = 'preconnect'; p1.href = 'https://fonts.googleapis.com';
            const p2 = document.createElement('link'); p2.rel = 'preconnect'; p2.href = 'https://fonts.gstatic.com'; p2.crossOrigin = 'anonymous';
            const font = document.createElement('link'); font.rel = 'stylesheet'; font.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
            document.head.append(p1, p2, font);
        }
        /* 🛡️ [إصلاح جذري - اختفاء الأيقونات]: الأيقونات بقت مُستضافة محليًا (/vendor/fontawesome/)
           بدل CDN خارجي، فالشرط هنا لازم يتعرّف على المسار الجديد "fontawesome" (من غير شرطة)
           مش بس القديم "font-awesome" (بشرطة) - غير كده كان هيفضل يحقن رابط الـCDN القديم
           من جديد في كل صفحة ويرجّع نفس مشكلة الاعتماد على مصدر خارجي واحد. */
        if (!document.querySelector('link[href*="fontawesome"], link[href*="font-awesome"]')) {
            const fa = document.createElement('link'); fa.rel = 'stylesheet'; fa.href = '/vendor/fontawesome/css/all.min.css?v=2026_local_v1.0';
            document.head.appendChild(fa);
        }
        // 🛡️ [إصلاح - المرحلة 3]: manifest.json كان موجود كملف بس مش متربط بأي صفحة،
        // فكانت ميزة "تثبيت الموقع كتطبيق" (PWA) معطّلة فعلياً بدون أي فايدة من وجود
        // الملف. الحقن هنا مركزي في المحرك الرئيسي بدل تكرار الوسم يدوياً في كل صفحة.
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifest = document.createElement('link'); manifest.rel = 'manifest'; manifest.href = '/manifest.json';
            document.head.appendChild(manifest);
        }
        if (!document.querySelector('meta[name="theme-color"]')) {
            const theme = document.createElement('meta'); theme.name = 'theme-color'; theme.content = '#FF91A4';
            document.head.appendChild(theme);
        }
    }

    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;
        if (data.seo && data.seo.title && document.title !== data.seo.title) {
            document.title = data.seo.title;
        }
        injectBoseStructuredData(data);
    }

    /**
     * 🔍👑 [SEO/GEO - بيانات مهيكلة Schema.org]: بيانات JSON-LD موحّدة (منظمة +
     * نشاط تجاري محلي + موقع إلكتروني) بتتحقن في كل صفحة من هنا مركزياً، بقيم حية
     * جايه فعلياً من إعدادات المتجر في قاعدة البيانات (اسم المتجر، اللوجو، الهاتف،
     * روابط السوشيال ميديا، عنوان الاستلام) - مش بيانات ثابتة مكتوبة يدوياً هتفضل
     * قديمة أول ما حد يغيّر حاجة من لوحة التحكم.
     *
     * ليه ده مهم:
     * 1) هو الطريقة الرسمية اللي جوجل بيعتمد عليها عشان يعرض لوجو البراند بجانب
     *    اسم الموقع في نتائج البحث (Organization.logo) بدل الأيقونة الافتراضية.
     * 2) بيدي محركات البحث والذكاء الاصطناعي (ChatGPT/Perplexity/Google AI Overviews)
     *    فهم واضح ومباشر لهوية النشاط التجاري (اسمه، نوعه Bakery، رقم تواصله،
     *    حساباته الرسمية) بدل ما يحاولوا "يخمّنوا" ده من النص العادي - ده جوهر
     *    الـ GEO (Generative Engine Optimization).
     * 3) WebSite schema بيفتح الباب لظهور مربع بحث مباشر (Sitelinks Search Box)
     *    جوه نتيجة جوجل نفسها.
     */
    function injectBoseStructuredData(data) {
        try {
            const store = data.store || {};
            const social = data.social || {};
            const seo = data.seo || {};
            const pageUrl = window.location.origin + window.location.pathname;
            const logoUrl = store.logo || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";
            const storeName = store.name || "حلويات بوسي";

            const sameAs = [social.facebook, social.instagram, social.tiktok].filter(Boolean);

            const graph = [
                {
                    "@type": ["Organization", "Bakery", "Florist"],
                    "@id": window.location.origin + "/#organization",
                    "name": storeName,
                    "url": window.location.origin + "/",
                    "logo": logoUrl,
                    "image": logoUrl,
                    "description": seo.description || store.slogan || "",
                    ...(store.phone ? { "telephone": store.phone } : {}),
                    ...(sameAs.length ? { "sameAs": sameAs } : {}),
                    ...(store.pickup && store.pickup.address ? {
                        "address": {
                            "@type": "PostalAddress",
                            "streetAddress": store.pickup.address,
                            "addressLocality": "الفرافرة",
                            "addressRegion": "الوادي الجديد",
                            "addressCountry": "EG"
                        }
                    } : {}),
                    // 🔍👑 [GEO - كتالوج خدمات صريح]: قائمة منظّمة بأهم "خدمات" النشاط
                    // (مش بس منتجات جاهزة) - بتدّي أي AI/محرك بحث تأكيد مباشر ومهيكل
                    // إن تصميم بوكيه الورد المخصص هو خدمة أساسية بتقدَّم فعلاً، بنفس
                    // وزن تصميم التورتة المخصصة، بدل ما يعتمد بس على نص FAQ حر تحت.
                    "hasOfferCatalog": {
                        "@type": "OfferCatalog",
                        "name": `خدمات ومنتجات ${storeName}`,
                        "itemListElement": [
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "تصميم بوكيه ورد مخصص",
                                    "description": "تصميم بوكيه ورد حسب الطلب - طبيعي أو صناعي فاخر أو ساتان، بأي عدد وإضافات.",
                                    "url": window.location.origin + "/flower-builder.html"
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "تصميم تورتة مخصصة",
                                    "description": "تصميم تورتة حسب الطلب - النكهة والشكل وعدد الأفراد والطباعة والرسالة.",
                                    "url": window.location.origin + "/cake-builder.html"
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Product",
                                    "name": "حلويات جاهزة (كب كيك، دوناتس، جاتوهات وأكتر)",
                                    "url": window.location.origin + "/menu.html"
                                }
                            }
                        ]
                    }
                },
                {
                    "@type": "WebSite",
                    "@id": window.location.origin + "/#website",
                    "url": window.location.origin + "/",
                    "name": storeName,
                    "publisher": { "@id": window.location.origin + "/#organization" },
                    "inLanguage": "ar"
                }
            ];

            const jsonLd = { "@context": "https://schema.org", "@graph": graph };

            // 🤖👑 [GEO - تصدر محركات البحث الذكية وترشيح الـ AI]: FAQPage schema بس على
            // الرئيسية (لازم يتطابق مع محتوى ظاهر فعلياً في الصفحة - قسم "أسئلة شائعة"
            // تحت، مش بيانات مخفية). ده اللي بيخلي ChatGPT/Perplexity/Google AI Overview
            // يقدروا يقتبسوا إجابات دقيقة عن حلويات بوسي بدل ما يتجاهلوا الموقع تماماً -
            // محركات الذكاء الاصطناعي بتفضل صفحات فيها إجابات واضحة سؤال/جواب على
            // فقرات تسويقية عامة. كل الإجابات مبنية على حقائق حقيقية من الموقع نفسه
            // (صفحة الدفع، صفحة "من نحن") مفيش أي رقم أو ادعاء مختلق.
            if (window.location.pathname === "/" || window.location.pathname.endsWith("/index.html")) {
                jsonLd["@graph"].push({
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": "إزاي أقدر أطلب من حلويات بوسي؟",
                            "acceptedAnswer": { "@type": "Answer", "text": "تقدري تتصفحي المنتجات على الموقع وتختاري اللي يعجبك، أو تصممي تورتة أو بوكيه ورد بنفسك عن طريق المحاكي التفاعلي، وبعدها تكمّلي طلبك وهيتواصل معاكِ فريقنا على واتساب لتأكيد التفاصيل والدفع." },
                        },
                        {
                            "@type": "Question",
                            "name": "المكونات اللي بتستخدموها آمنة وطبيعية؟",
                            "acceptedAnswer": { "@type": "Answer", "text": "نعم، كل منتجاتنا بتتحضر بمكونات طبيعية طازجة، وخالية تماماً من أي إضافات تجارية ضارة، لأن الأمان الصحي جزء أساسي من فلسفة حلويات بوسي من أول يوم." },
                        },
                        {
                            "@type": "Question",
                            "name": "إيه طرق الدفع المتاحة؟",
                            "acceptedAnswer": { "@type": "Answer", "text": "الدفع بيتم كاش أو عن طريق InstaPay، وبعد التحويل بتبعتي لقطة شاشة على واتساب وهيتم تأكيد طلبك فوراً." },
                        },
                        {
                            "@type": "Question",
                            "name": "فيه توصيل ولا استلام من المحل بس؟",
                            "acceptedAnswer": { "@type": "Answer", "text": "الاتنين متاحين - تقدري تختاري التوصيل لباب البيت أو الاستلام مباشرة، حسب الأسهل لك وقت إتمام الطلب." },
                        },
                        {
                            "@type": "Question",
                            "name": "أقدر أصمم تورتة أو بوكيه ورد بنفسي؟",
                            "acceptedAnswer": { "@type": "Answer", "text": "أيوة، عندنا محاكي تفاعلي مخصص لتصميم التورتات وبوكيهات الورد خطوة بخطوة حسب ذوقك ومناسبتك، وتقدري تشوفي السعر بيتغير مباشرة مع كل اختيار." },
                        },
                    ],
                });
            }

            let script = document.getElementById("bose-structured-data");
            if (!script) {
                script = document.createElement("script");
                script.type = "application/ld+json";
                script.id = "bose-structured-data";
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(jsonLd);
        } catch (e) {
            // فشل حقن البيانات المهيكلة مش لازم يكسر الموقع - نتجاهله بأمان
        }
    }

    /**
     * 👑👑 [مرحلة جديدة - تحميل التطبيق]: نافذة ترحيبية بهوية حلويات بوسي بالكامل
     * (وردي/أبيض/ذهبي، خط Cairo) بتظهر للعميل بعد ثواني من دخوله الموقع لأول مرة،
     * بتستخدم شخصية الشيف بتاعة اللوجو (مش أي ماسكوت جاهز)، وبتدعو العميل يثبّت
     * تطبيق الويب (PWA) بتاعنا على شاشته الرئيسية زي أي تطبيق عادي.
     *
     * ✅ [تم]: رابط الصورة تحت هو صورة الماسكوت الحقيقية اللي اترفعت على
     * Cloudinary فعليًا (مش اللوجو العادي زي قبل كده).
     */
    // 🎨 [تحسين شكل الصورة - طلب صاحبة المتجر]: نفس الصورة الأصلية بالظبط، لكن
    // بنضيف باراميترز Cloudinary لجودة/دقة أعلى عند التسليم (نفس أسلوب q_auto/f_auto
    // المستخدم بالفعل مع الفيديوهات في الموقع) - بيخلي الصورة أوضح وأنضف لما تتعرض
    // بحجم أكبر من قبل، من غير ما نرفع أي ملف جديد. w_500 بيطلب نسخة أعلى دقة عشان
    // تبقى واضحة (retina) حتى بعد التكبير الجديد في الـ CSS.
    const BOSE_APP_MASCOT_IMAGE_URL = "https://res.cloudinary.com/dyx4w0dr1/image/upload/f_auto,q_auto,w_500/v1787925413/1786711441254_r3nmln.jpg";

    function setupAppInstallPopup() {
        // لو التطبيق شغال بالفعل كـ PWA مثبّت (standalone)، العميل مثبّته أصلاً - متعرضيش عليه يثبّته تاني
        const alreadyInstalled = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
        if (alreadyInstalled) return;
        if (localStorage.getItem('bose_app_installed_flag') === 'true') return;

        // 🛡️👑 [إصلاح - طلب صاحبة المتجر]: النافذة دي بتقفل شاشة السلة/الدفع بالكامل
        // (overlay بملء الشاشة) في أهم وأحرج خطوتين في رحلة الشراء - العميلة ممكن
        // تحس إن الموقع "معلّق" أو إن فيه مشكلة وهي في نص إتمام طلبها. منمنعش النافذة
        // من الظهور خالص في السلة وصفحة الدفع.
        const currentPath = window.location.pathname;
        if (currentPath.endsWith('/cart.html') || currentPath.endsWith('/checkout.html')) return;

        // 👑 [تعديل بناءً على طلب صاحبة المتجر]: شلنا فكرة "متتكررش قبل 14 يوم" نهائياً.
        // النافذة دلوقتي بتظهر في كل *دخول جديد* للموقع (فتح تبويب/متصفح جديد) طول
        // ما العميل لسه ما ثبّتش التطبيق فعلياً - مفيش أي تأجيل زمني تاني. بنستخدم
        // sessionStorage (مش localStorage) عشان نمنع بس ظهورها المزعج في كل صفحة
        // تانية العميل يدخلها *جوه نفس الجلسة/التبويب الحالي* بعد ما قفلها فعلاً -
        // لكن أي دخول جديد للموقع (تبويب جديد/فتح المتصفح تاني) هيوريها له تاني من الأول.
        if (sessionStorage.getItem('bose_app_popup_dismissed_this_session') === 'true') return;

        // 🆕👑 [تعديل بناءً على طلب صاحبة المتجر]: زودنا اختيار "متظهرش تاني" دائم -
        // لو العميلة حطت صح جنبها وقفلت النافذة، بنسجل علامة دائمة في localStorage
        // ومتفضلش تظهرلها تاني في أي زيارة جاية أبداً (بعكس sessionStorage اللي
        // بيتصفر مع كل جلسة/تبويب جديد).
        if (localStorage.getItem('bose_app_popup_permanently_dismissed') === 'true') return;

        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

        const closePopup = () => {
            const popup = document.getElementById('bose-app-install-popup-overlay');
            const dontShowCheckbox = document.getElementById('bose-app-install-dont-show-again');
            if (dontShowCheckbox && dontShowCheckbox.checked) {
                localStorage.setItem('bose_app_popup_permanently_dismissed', 'true');
            }
            if (popup) popup.remove();
            sessionStorage.setItem('bose_app_popup_dismissed_this_session', 'true');
        };

        const showPopup = () => {
            // ضمان أخير: لو فتحت صفحة تانية في نفس الجلسة والنافذة ظهرت فعلاً قبل كده، منكررهاش
            if (document.getElementById('bose-app-install-popup-overlay')) return;

            const ctaHtml = isIOS
                ? `<div class="bose-app-install-ios-note">
                        <i class="fa-solid fa-arrow-up-from-bracket"></i>
                        من متصفح Safari: اضغطي زر "المشاركة" تحت، واختاري <strong>"إضافة إلى الشاشة الرئيسية"</strong>
                   </div>`
                : `<button type="button" id="bose-app-install-cta-btn" class="bose-app-install-cta-btn">
                        <i class="fa-solid fa-download"></i> ثبّتي التطبيق الآن
                   </button>`;

            const popupHtml = `
                <div id="bose-app-install-popup-overlay" class="bose-app-install-popup-overlay">
                    <div class="bose-app-install-popup-card" role="dialog" aria-modal="true" aria-label="تثبيت تطبيق حلويات بوسي">
                        <button type="button" class="bose-app-install-close-btn" id="bose-app-install-close-btn" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>
                        <div class="bose-app-install-mascot-wrapper">
                            <img src="${BOSE_APP_MASCOT_IMAGE_URL}" alt="شيف حلويات بوسي" class="bose-app-install-mascot-img" width="210" height="210" loading="lazy" />
                        </div>
                        <h3 class="bose-app-install-title">حمّلي تطبيقنا! 🎀</h3>
                        <p class="bose-app-install-desc">اطلبي حلوياتك المفضلة في ثواني، واستلمي عروضنا الحصرية أول بأول من غير ما تفوتك حاجة</p>
                        ${ctaHtml}
                        <button type="button" class="bose-app-install-secondary-link" id="bose-app-install-later-btn">مش دلوقتي</button>
                        <label class="bose-app-install-dont-show-label" for="bose-app-install-dont-show-again">
                            <input type="checkbox" id="bose-app-install-dont-show-again" />
                            <span>متظهرش تاني</span>
                        </label>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', popupHtml);

            const overlay = document.getElementById('bose-app-install-popup-overlay');
            const closeBtn = document.getElementById('bose-app-install-close-btn');
            const laterBtn = document.getElementById('bose-app-install-later-btn');
            const ctaBtn = document.getElementById('bose-app-install-cta-btn');

            if (closeBtn) closeBtn.addEventListener('click', closePopup);
            if (laterBtn) laterBtn.addEventListener('click', closePopup);
            if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
            if (ctaBtn) {
                ctaBtn.addEventListener('click', async () => {
                    await window.triggerBoseAppInstall();
                    closePopup();
                });
            }
        };

        // 🛡️🆕 [إصلاح - تكدس نافذة التطبيق فوق الجولة التعريفية]: النافذة دي
        // كانت بتظهر بعد 3.5 ثانية بشكل مستقل تماماً عن نظام الجولة التعريفية
        // (js/guided-tour.js) - لو العميلة كانت وسط جولة تعريفية شغالة (نفس
        // z-index تقريباً: 99999 للاتنين)، النافذتين كانوا بيترصّوا فوق بعض
        // فجأة في نفس اللحظة، وده بالظبط اللي ظهر في اسكرين شوت صاحبة المتجر
        // (كارت الجولة "16/15" وكارت "حمّلي تطبيقنا" ظاهرين مع بعض في نفس
        // اللحظة). الحل: قبل ما نعرض النافذة، بنتأكد إن مفيش جولة تعريفية
        // شغالة دلوقتي (بنقرا نفس مفتاح localStorage اللي guided-tour.js
        // بيحفظ فيه حالة الجولة - bose_guided_tour_state_v4 - وبنفحص .active).
        // لو فيه جولة شغالة، بنأجل ظهور النافذة وبنعيد المحاولة كل ثانيتين
        // (سقف 30 محاولة = دقيقة كحد أقصى) لحد ما الجولة تخلص أو العميلة
        // تقفلها - النافذة برضه بتحترم كل قواعد عدم التكرار العادية بتاعتها.
        function isBoseGuidedTourCurrentlyActive() {
            try {
                const raw = localStorage.getItem('bose_guided_tour_state_v4');
                if (!raw) return false;
                const state = JSON.parse(raw);
                return !!(state && state.active);
            } catch (e) {
                return false;
            }
        }

        let tourWaitAttempts = 0;
        function showPopupWhenTourIsClear() {
            if (isBoseGuidedTourCurrentlyActive() && tourWaitAttempts < 30) {
                tourWaitAttempts++;
                setTimeout(showPopupWhenTourIsClear, 2000);
                return;
            }
            showPopup();
        }

        // نستنى شوية ثواني بعد التحميل الكامل عشان النافذة متبانش فجأة لحظة ما العميل
        // لسه بيحمل الصفحة - إحساس أهدى واحترافي أكتر من ظهور فوري صادم
        setTimeout(showPopupWhenTourIsClear, 3500);
    }

    function buildAndInjectGlobalComponents() {
        const data = window.BoseStoreData;
        if (!data) return;

        const headerInjector = document.getElementById('bose-header-injector');
        if (headerInjector) {
            const marqueeMessages = data.navigation?.topBarMessages || ["صنعناها بحب لتهديها لمن تحب", "توصيل طازج يومياً لجميع المناطق"];
            let marqueeItemsHtml = '';
            // 🛡️ [تحصين إضافي - دفاع في العمق]: رسائل الشريط المتحرك بتيجي من لوحة
            // التحكم (store_settings.navigation) وبتتحقن هنا لكل زائر في كل صفحة بالموقع
            // من غير أي تعقيم. نفس مبدأ التحصين المطبّق فعلاً على باقي الحقول الإدارية
            // في الموقع (زي عنوان الفرع في cart-engine.js) بيتطبق هنا كمان - حتى لو
            // الحساب الإداري موثوق حالياً، أي اختراق مستقبلي لحساب الأدمن أو أي ثغرة
            // تانية في لوحة التحكم مبتتحولش لسكريبت شغال على جهاز كل زائر للموقع.
            marqueeMessages.forEach((/** @type {string} */ msg) => { marqueeItemsHtml += `<span class="bose-marquee-item">${window.escapeBoseHTML(msg)}</span>`; });

            // ⚙️ [تحكم في سرعة الشريط العلوي وتشغيله/إيقافه من لوحة التحكم]:
            // بيتقرا من navigation.topBarSpeedSeconds و navigation.topBarEnabled.
            // 🐛👑 [إبطاء الافتراضي 50%]: كان 44 (القيمة الافتراضية فقط، تُستخدم
            // لو الأدمن لسه ما حفظتش قيمة مخصصة بنفسها) - ضاعفناها لـ 88 عشان
            // تتطابق مع نفس التعديل في css/global.css (.bose-top-bar-marquee-track).
            const topBarSpeed = Number(data.navigation?.topBarSpeedSeconds) > 0 ? Number(data.navigation.topBarSpeedSeconds) : 88;
            const topBarEnabled = data.navigation?.topBarEnabled !== false;
            const topBarTrackStyle = `animation-duration:${topBarSpeed}s !important; animation-play-state:${topBarEnabled ? 'running' : 'paused'} !important;`;

            // 🛡️👑 [إدارة كاملة للشريط - حجمه وإيقافه فعلياً]: قبل كده "إيقاف"
            // الشريط من لوحة التحكم كان بيوقّف حركة السحب بس (animation-play-state)
            // ويسيبه ظاهر وثابت ومكانه محجوز فوق الهيدر - مش إيقاف حقيقي. ومفيش
            // أي تحكم في حجم خط الشريط أصلاً. دلوقتي:
            // 1) حجم الخط (navigation.topBarFontSize) بيتحكم فيه الأدمن، وارتفاع
            //    الشريط بيتحسب تلقائياً منه بنفس النسبة اللي كانت مضبوطة يدويًا
            //    قبل كده (18px خط ↔ 44px ارتفاع)، عشان الشكل يفضل متناسق مهما
            //    الحجم اتغيّر.
            // 2) لو "topBarEnabled" = false دلوقتي الشريط بيختفي بالكامل فعليًا
            //    (مش بس بيوقف عن الحركة) وارتفاعه بيبقى صفر، والهيدر والمحتوى
            //    اللي تحته بيرتفعوا تلقائيًا يملوا المكان الفاضي - عبر متغيرات
            //    CSS (--bose-topbar-height/--bose-topbar-font-size) بتتظبط هنا
            //    وكل من .bose-sticky-header و body في global.css بيقروا منها
            //    بدل الأرقام الثابتة القديمة (44px / 120px)، فأي قيمة يختارها
            //    الأدمن بتنعكس فورًا على كل الصفحة من غير أي تصادم أو قص محتوى.
            const topBarFontSize = Number(data.navigation?.topBarFontSize) > 0 ? Number(data.navigation.topBarFontSize) : 18;
            const topBarHeight = topBarEnabled ? (Math.round(topBarFontSize * 2) + 8) : 0;
            document.documentElement.style.setProperty('--bose-topbar-height', topBarHeight + 'px');
            document.documentElement.style.setProperty('--bose-topbar-font-size', topBarFontSize + 'px');
            const topBarContainerStyle = topBarEnabled ? '' : 'display:none !important;';

            headerInjector.innerHTML = `
                <div id="top-bar-marquee" class="bose-top-bar-marquee-container" style="${topBarContainerStyle}" aria-hidden="${topBarEnabled ? 'false' : 'true'}" aria-label="شريط الإعلانات التسويقية">
                    <div class="bose-top-bar-marquee-track" style="${topBarTrackStyle}">
                        ${marqueeItemsHtml} ${marqueeItemsHtml}
                    </div>
                </div>

                <header class="bose-sticky-header">
                    <div class="header-right-side">
                        <button id="mobile-menu-toggle" class="bose-nav-btn" aria-label="فتح القائمة الجانبية">
                            <i class="fa-solid fa-bars-staggered"></i>
                        </button>
                        <a href="/index.html" class="brand-logo-container">
                            <img id="bose-store-logo" src="${window.optimizeBoseImageUrl(data.store?.logo || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 150)}" alt="لوجو ${window.escapeBoseHTML(data.store?.name || 'حلويات بوسي')} الفاخرة" class="brand-logo-img" width="80" height="80" />
                            <span class="brand-name-display" title="${window.escapeBoseHTML(data.store?.name || 'حلويات بوسي')}">${window.escapeBoseHTML(data.store?.name || 'حلويات بوسي')}</span>
                        </a>
                    </div>
                    <div class="header-left-side">
                        <button id="nav-search-btn" class="bose-nav-btn" aria-label="البحث عن صنف أو نكهة">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <a href="/favorites.html" class="nav-cart-icon-wrapper" aria-label="عرض المفضلة">
                            <i class="fa-solid fa-heart bose-nav-btn" style="padding:0;"></i>
                            <span id="nav-fav-count" class="nav-cart-count-badge nav-fav-count-badge" style="display:none;">0</span>
                        </a>
                        <a href="/cart.html" class="nav-cart-icon-wrapper" aria-label="عرض سلة المشتريات">
                            <i class="fa-solid fa-bag-shopping bose-nav-btn" style="padding:0;"></i>
                            <span id="nav-cart-count" class="nav-cart-count-badge">0</span>
                        </a>
                    </div>
                </header>

                <div id="bose-sidebar-drawer" class="bose-sidebar-drawer" aria-hidden="true">
                    <div class="sidebar-header">
                        <div class="sidebar-logo-container">
                            <img src="${window.optimizeBoseImageUrl(data.store?.logo || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 150)}" alt="لوجو ${window.escapeBoseHTML(data.store?.name || 'حلويات بوسي')}" class="sidebar-logo" width="80" height="80" />
                            <span class="sidebar-brand-name">${window.escapeBoseHTML(data.store?.name || 'حلويات بوسي')}</span>
                        </div>
                        <button id="sidebar-close-btn" class="sidebar-close-btn" aria-label="إغلاق القائمة">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div class="sidebar-scrollable-content">
                        <div class="sidebar-menu-wrapper">
                            <button type="button" id="sidebar-categories-toggle" class="sidebar-section-title sidebar-expand-toggle" aria-expanded="false">
                                تسوّقي حسب الفئة
                                <i class="fa-solid fa-chevron-down toggle-chevron"></i>
                            </button>
                            <ul class="sidebar-links-list sidebar-categories-collapse" id="sidebar-categories-list" style="display:none;">
                                <li class="sidebar-link-item"><a href="/cake-builder.html"><span class="link-main-side"><i class="fa-solid fa-birthday-cake main-icon"></i>التورت الفاخرة</span></a></li>
                                <li class="sidebar-link-item"><a href="/category.html?category=taswaq-gatowat"><span class="link-main-side"><i class="fa-solid fa-cheese main-icon"></i>الجاتوهات الملكية</span></a></li>
                                <li class="sidebar-link-item"><a href="/category.html?category=taswaq-qashtota"><span class="link-main-side"><i class="fa-solid fa-stroopwafel main-icon"></i>القشطوطة الغنية</span></a></li>
                                <li class="sidebar-link-item"><a href="/category.html?category=taswaq-despacito"><span class="link-main-side"><i class="fa-solid fa-box main-icon"></i>الديسباسيتو الفاخر</span></a></li>
                                <li class="sidebar-link-item"><a href="/category.html?category=taswaq-cinabon"><span class="link-main-side"><i class="fa-solid fa-cookie main-icon"></i>السينابون الطازج</span></a></li>
                                <li class="sidebar-link-item"><a href="/category.html?category=taswaq-donuts"><span class="link-main-side"><i class="fa-solid fa-ring main-icon"></i>الدوناتس الهشة</span></a></li>
                                <li class="sidebar-link-item"><a href="/category.html?category=taswaq-red-velvet"><span class="link-main-side"><i class="fa-solid fa-heart main-icon"></i>الريدڤيلڤت</span></a></li>
                                <li class="sidebar-link-item"><a href="/category.html?category=taswaq-cupcake"><span class="link-main-side"><i class="fa-solid fa-cookie-bite main-icon"></i>الكب كيك</span></a></li>
                                <li class="sidebar-link-item"><a href="/category.html?category=taswaq-mini-cake"><span class="link-main-side"><i class="fa-solid fa-cubes main-icon"></i>الميني تورت</span></a></li>
                                <li class="sidebar-link-item"><a href="/flower-builder.html"><span class="link-main-side"><i class="fa-solid fa-spa main-icon"></i>بوكيهات الورد</span></a></li>
                                <li class="sidebar-link-item"><a href="/category.html?category=taswaq-happiness-cups"><span class="link-main-side"><i class="fa-solid fa-ice-cream main-icon"></i>كبات السعادة</span></a></li>
                                <li class="sidebar-link-item"><a href="/category.html?category=taswaq-relax-box"><span class="link-main-side"><i class="fa-solid fa-gift main-icon"></i>بوكس الروقان</span></a></li>
                            </ul>
                        </div>

                        <div class="sidebar-menu-wrapper" style="margin-top: 25px;">
                            <div class="sidebar-section-title">اكتشفي</div>
                            <ul class="sidebar-links-list">
                                <li class="sidebar-link-item">
                                    <a href="/index.html">
                                        <span class="link-main-side"><i class="fa-solid fa-house main-icon"></i>الرئيسية</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/index.html#howto-order-section" data-start-bose-tour="1">
                                        <span class="link-main-side"><i class="fa-solid fa-circle-question main-icon"></i>جولة تعريفية بالموقع</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/menu.html">
                                        <span class="link-main-side"><i class="fa-solid fa-utensils main-icon"></i>المنيو الشامل</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/offers.html" id="sidebar-link-offers">
                                        <span class="link-main-side"><i class="fa-solid fa-tags main-icon"></i>العروض والخصومات</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/cake-builder.html" id="sidebar-link-cake-builder">
                                        <span class="link-main-side"><i class="fa-solid fa-cake-candles main-icon"></i>محاكي التورت التفاعلي</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/flower-builder.html" id="sidebar-link-flower-builder">
                                        <span class="link-main-side"><i class="fa-solid fa-seedling main-icon"></i>محاكي الورد الخاص</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <!-- 🛡️ [تحسين تنظيم القائمة]: "التصفح الفاخر" كانت 10 روابط مصفوفة تحت بعض
                             من غير أي تجميع منطقي - دلوقتي مقسّمة لمجموعتين بمعنى واضح: "اكتشفي"
                             (تصفح/استلهام) و"أدواتك" (حاجات العميلة اللي عندها طلب/حساب شغال) عشان
                             العين تلاقي اللي بتدور عليه أسرع من غير ما نشيل أي رابط. -->
                        <div class="sidebar-menu-wrapper" style="margin-top: 25px;">
                            <div class="sidebar-section-title">أدواتك</div>
                            <ul class="sidebar-links-list">
                                <li class="sidebar-link-item">
                                    <a href="/favorites.html">
                                        <span class="link-main-side"><i class="fa-solid fa-heart main-icon"></i>المفضلة</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/cart.html">
                                        <span class="link-main-side"><i class="fa-solid fa-basket-shopping main-icon"></i>سلة التسوق</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>

                                <li class="sidebar-link-item">
                                    <a href="/track-order.html" id="sidebar-link-track-order">
                                        <span class="link-main-side"><i class="fa-solid fa-location-crosshairs main-icon"></i>تتبعي طلبك</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/rewards.html" id="sidebar-link-rewards">
                                        <span class="link-main-side"><i class="fa-solid fa-gift main-icon"></i>مكافآتك</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div class="sidebar-menu-wrapper" style="margin-top: 25px;">
                            <div class="sidebar-section-title">روابط المعرفة</div>
                            <ul class="sidebar-links-list">
                                <li class="sidebar-link-item">
                                    <a href="/about.html">
                                        <span class="link-main-side"><i class="fa-solid fa-heart-pulse main-icon"></i>مَنْ نحن</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/contact.html">
                                        <span class="link-main-side"><i class="fa-solid fa-phone-flip main-icon"></i>تواصل معنا</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/policies/shipping-policy.html">
                                        <span class="link-main-side"><i class="fa-solid fa-truck main-icon"></i>سياسة الشحن والتوصيل</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/policies/refund-policy.html">
                                        <span class="link-main-side"><i class="fa-solid fa-rotate-left main-icon"></i>سياسة الاسترجاع</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/policies/privacy-policy.html">
                                        <span class="link-main-side"><i class="fa-solid fa-shield-halved main-icon"></i>سياسة الخصوصية</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="/policies/terms.html">
                                        <span class="link-main-side"><i class="fa-solid fa-file-contract main-icon"></i>الشروط والأحكام</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="sidebar-footer-contacts">
                        <a href="${window.buildWhatsappLink(data.social?.whatsapp || '201097238441', '')}" target="_blank" rel="noopener noreferrer" class="sidebar-contact-pill">
                            <i class="fa-brands fa-whatsapp"></i>
                            <span>راسلنا فوري عبر الواتساب</span>
                        </a>
                        <a href="tel:${data.store?.phone || '01097238441'}" class="sidebar-contact-pill">
                            <i class="fa-solid fa-phone"></i>
                            <span>اتصال هاتفي مباشر</span>
                        </a>
                    </div>
                </div>
                <div id="bose-sidebar-overlay" class="bose-sidebar-overlay"></div>

                <div id="bose-search-modal" class="bose-search-modal" aria-hidden="true">
                    <div class="search-modal-header">
                        <button id="search-modal-close" class="bose-nav-btn" style="font-size: 26px;" aria-label="إغلاق البحث">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="search-input-wrapper">
                        <input type="text" id="bose-search-field" class="bose-search-field" placeholder="ابحث عن النكهة أو الصنف (لوتس، بيستاشيو...)" aria-label="حقل البحث" autocomplete="off" />
                        <i class="fa-solid fa-magnifying-glass search-field-icon"></i>
                    </div>
                    <div id="search-results-container" class="search-results-container"></div>
                </div>
            `;
            setupHeaderAndSidebarEvents();
        }

        // 🔧 [إصلاح جذري]: الشريط السفلي الثابت كان Hardcoded جوه index.html بس، فكان بيختفي
        // تماماً في أي صفحة تانية (منتج، فئة، سلة، دفع...). دلوقتي بيتحقن تلقائياً في كل صفحة
        // محملة core-engine.js، وزرار "العروض" بقى بيوجه لصفحة العروض المستقلة الحقيقية
        // offers.html بدل ما يعمل Scroll جوه الرئيسية بس (اللي أصلاً معندهاش تأثير في أي صفحة تانية).
        //
        // 🐛🛡️ [إصلاح جذري - 2026-08-23]: كل الروابط جوه core-engine.js (الشريط السفلي،
        // القائمة الجانبية، الفوتر) كانت مكتوبة كروابط نسبية بدون "/" في الأول (زي
        // href="cart.html")، وده بيشتغل صح بس لو الصفحة الحالية في جذر الموقع مباشرة.
        // أي صفحة جوه مجلد فرعي (زي policies/privacy-policy.html) كانت بتخلي الرابط ده
        // يترجم غلط لمسار زي "/policies/cart.html" (مش موجود أصلاً) بدل "/cart.html"
        // الصح - فأي ضغطة من جوه صفحات السياسات كانت بتوديك لصفحة خطأ 404. دلوقتي كل
        // الروابط في الملف ده بقت مطلقة (بتبدأ بـ "/") فبتشتغل صح من أي عمق مجلد.
        if (!document.querySelector('.bose-bottom-nav-bar')) {
            const currentPage = (window.location.pathname.split('/').pop() || 'index.html');
            const isHome = currentPage === '' || currentPage === 'index.html';
            const isOffers = currentPage === 'offers.html';
            const isCart = currentPage === 'cart.html';

            const bottomNav = document.createElement('nav');
            bottomNav.className = 'bose-bottom-nav bose-bottom-nav-bar';
            bottomNav.setAttribute('aria-label', 'التنقل السفلي السريع');
            bottomNav.innerHTML = `
                <a href="/index.html" class="bottom-nav-item bose-bottom-nav-item${isHome ? ' active' : ''}">
                    <i class="fas fa-home"></i>
                    <span>الرئيسية</span>
                </a>
                <a href="/offers.html" class="bottom-nav-item bose-bottom-nav-item${isOffers ? ' active' : ''}">
                    <i class="fas fa-tags"></i>
                    <span>العروض</span>
                </a>
                <a href="${window.buildWhatsappLink(data.social?.whatsapp || '201097238441', '')}" target="_blank" rel="noopener noreferrer" class="bottom-nav-item bose-bottom-nav-item whatsapp-item">
                    <i class="fab fa-whatsapp"></i>
                    <span>الواتساب</span>
                </a>
                <a href="/cart.html" class="bottom-nav-item bose-bottom-nav-item cart-item${isCart ? ' active' : ''}">
                    <div class="nav-cart-icon-wrap">
                        <i class="fas fa-shopping-bag"></i>
                        <span class="nav-cart-badge bose-bottom-nav-badge">0</span>
                    </div>
                    <span>السلة</span>
                </a>
            `;
            document.body.appendChild(bottomNav);
        }

        // 🛒 [سلة عائمة ثابتة]: فقاعة سلة عائمة فوق التبويب السفلي، ثابتة في مكانها طول
        // ما العميل بيتصفح الموقع، وقريبة من إبهامه عشان توصله بسهولة من غير ما يدور
        // عليها. طول ما السلة فاضية بتعمل وميض/نبض هادي يلفت نظر العميل ويشجعه إنه
        // يضيف منتجات. أول ما يبقى فيها صنف، الوميض بيقف ويظهر بس عداد العدد بوضوح.
        // مبنية على نفس ستايل الكارت (بمبي/أبيض) وبتتحدث لحظياً زي أي عداد سلة تاني
        // بالموقع لأنها بتستخدم نفس كلاس nav-cart-badge اللي updateGlobalCartCounter شغالة عليه.
        if (!document.querySelector('.bose-floating-cart-btn')) {
            const currentPageForFab = (window.location.pathname.split('/').pop() || 'index.html');
            if (currentPageForFab !== 'cart.html' && currentPageForFab !== 'checkout.html') {
                const floatingCartBtn = document.createElement('a');
                floatingCartBtn.href = 'cart.html';
                floatingCartBtn.className = 'bose-floating-cart-btn is-empty';
                floatingCartBtn.id = 'bose-floating-cart-btn';
                floatingCartBtn.setAttribute('aria-label', 'سلة المشتريات - اضغطي هنا لمراجعة السلة وإتمام الطلب');
                floatingCartBtn.innerHTML = `
                    <span class="bose-floating-cart-pulse"></span>
                    <i class="fa-solid fa-basket-shopping"></i>
                    <span id="floating-cart-count" class="nav-cart-badge bose-floating-cart-badge">0</span>
                `;
                document.body.appendChild(floatingCartBtn);
            }
        }

        const footerInjector = document.getElementById('bose-footer-injector');
        if (footerInjector) {
            footerInjector.innerHTML = `
                <footer class="bose-footer" role="contentinfo">
                    <div class="footer-grid-layout">
                        <div class="footer-column-block">
                            <div class="footer-brand-meta">
                                <img src="${window.optimizeBoseImageUrl(data.store?.logo || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 150)}" alt="${window.escapeBoseHTML(data.store?.name || 'حلويات بوسي')} الفاخرة" class="footer-logo" width="80" height="80" />
                                <span class="footer-title">${window.escapeBoseHTML(data.store?.name || 'حلويات بوسي')}</span>
                            </div>
                            <p id="footer-about-text" class="footer-about-paragraph">${window.escapeBoseHTML(data.footer?.about || 'صنعناها بحب لتهديها لمن تحب')}</p>
                            <div id="footer-social-links" class="footer-social-wrapper">
                                <a href="${data.social?.facebook || '#'}" target="_blank" rel="noopener noreferrer" class="footer-social-icon-btn"><i class="fa-brands fa-facebook-f"></i></a>
                                <a href="${data.social?.instagram || '#'}" target="_blank" rel="noopener noreferrer" class="footer-social-icon-btn"><i class="fa-brands fa-instagram"></i></a>
                                <a href="${data.social?.tiktok || '#'}" target="_blank" rel="noopener noreferrer" class="footer-social-icon-btn"><i class="fa-brands fa-tiktok"></i></a>
                                <a href="${window.buildWhatsappLink(data.social?.whatsapp || '201097238441', '')}" target="_blank" rel="noopener noreferrer" class="footer-social-icon-btn"><i class="fa-brands fa-whatsapp"></i></a>
                            </div>
                        </div>
                        <div class="footer-column-block">
                            <h3 class="footer-heading-title">روابط سريعة</h3>
                            <ul class="footer-links-ul">
                                <li><a href="/index.html">الرئيسية</a></li>
                                <li><a href="/menu.html">المنيو الشامل</a></li>
                                <li><a href="/cake-builder.html">محاكي التورت</a></li>
                                <li><a href="/flower-builder.html">محاكي الورد</a></li>
                                <li><a href="/cart.html">سلة التسوق</a></li>
                            </ul>
                        </div>
                        <div class="footer-column-block">
                            <h3 class="footer-heading-title">وثائق وسياسات</h3>
                            <ul class="footer-links-ul">
                                <li><a href="/policies/privacy-policy.html">سياسة الخصوصية</a></li>
                                <li><a href="/policies/refund-policy.html">سياسة الاسترجاع المالي</a></li>
                                <li><a href="/policies/shipping-policy.html">سياسة الشحن والتوصيل</a></li>
                                <li><a href="/policies/terms.html">الشروط والأحكام</a></li>
                                <li class="footer-contact-item" style="margin-top: 15px; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #111111;">
                                    <i class="fa-solid fa-location-dot" style="color: #FF91A4;"></i>
                                    <span>${window.escapeBoseHTML(data.store?.pickup?.address || 'العنوان الرئيسي')}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <p class="footer-copyright-block">جميع الحقوق محفوظة &copy; <span id="footer-year-display">2026</span> لعلامة ${window.escapeBoseHTML(data.store?.name || 'حلويات بوسي')} الفاخرة.</p>
                </footer>
            `;
        }

        // 🌸🌸 [نظام يتفاعل مع العميل ويتعرّف عليه]: لو عندنا "ملف تعريف" محفوظ
        // للعميل ده من طلب سابق (راجع saveBoseCustomerProfile)، بنرحّب بيه باسمه
        // كإشعار علوي فور دخوله الموقع - مرة واحدة بس لكل جلسة تصفح (sessionStorage)
        // عشان الترحيب ميتكررش في كل صفحة يتنقل لها جوه نفس الزيارة.
        try {
            const welcomeProfile = typeof window.getBoseCustomerProfile === "function" ? window.getBoseCustomerProfile() : null;
            if (welcomeProfile && welcomeProfile.name && !sessionStorage.getItem('bose_welcome_shown')) {
                sessionStorage.setItem('bose_welcome_shown', '1');
                setTimeout(() => {
                    if (typeof window.showBoseToast === "function") {
                        window.showBoseToast(`أهلاً بعودتك يا ${welcomeProfile.name} 🌸 وحشتينا!`, 4200);
                    }
                }, 700);
            }
        } catch (e) { /* تجاهل بأمان */ }
    }

    function setupHeaderAndSidebarEvents() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const closeBtn = document.getElementById('sidebar-close-btn');
        const sidebar = document.getElementById('bose-sidebar-drawer');
        const overlay = document.getElementById('bose-sidebar-overlay');
        
        const searchBtn = document.getElementById('nav-search-btn');
        const searchModal = document.getElementById('bose-search-modal');
        const searchClose = document.getElementById('search-modal-close');
        /** @type {HTMLInputElement|null} */ const searchField = document.querySelector('#bose-search-field');
        const resultsContainer = document.getElementById('search-results-container');

        if (toggleBtn && sidebar && overlay) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.add('open');
                overlay.classList.add('show');
                document.body.classList.add('drawer-active');
            });
        }
        
        const closeSidebar = () => {
            if (sidebar && overlay) {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
                document.body.classList.remove('drawer-active');
            }
        };

        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);

        const categoriesToggle = document.getElementById('sidebar-categories-toggle');
        const categoriesList = document.getElementById('sidebar-categories-list');
        if (categoriesToggle && categoriesList) {
            categoriesToggle.addEventListener('click', () => {
                const isOpen = categoriesList.style.display === 'block';
                categoriesList.style.display = isOpen ? 'none' : 'block';
                categoriesToggle.setAttribute('aria-expanded', String(!isOpen));
                categoriesToggle.classList.toggle('expanded', !isOpen);
            });
        }

        if (searchBtn && searchModal) {
            searchBtn.addEventListener('click', () => {
                searchModal.classList.add('active');
                setTimeout(() => searchField?.focus(), 200);
            });
        }

        if (searchClose) {
            searchClose.addEventListener('click', () => {
                searchModal.classList.remove('active');
            });
        }

        if (searchField && resultsContainer) {
            let searchDebounceTimer = null;
            searchField.addEventListener('input', (e) => {
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                const target = /** @type {HTMLInputElement} */ (e.target);
                const rawQuery = target.value;
                searchDebounceTimer = setTimeout(() => {
                    const query = rawQuery.trim().toLowerCase();
                    if (!query) { resultsContainer.innerHTML = ''; return; }

                    const allProducts = window.BoseStoreData?.products || [];
                    const filtered = allProducts.filter((/** @type {any} */ p) => p.title?.toLowerCase().includes(query) || p.flavorName?.toLowerCase().includes(query));

                    let html = '';
                    filtered.forEach((/** @type {any} */ p) => {
                        let targetUrl = (p.id === 'toort-custom-master' || p.slug === 'toort-custom-master') ? 'cake-builder.html' : 
                                        ((p.id === 'flowers-master' || p.slug === 'flowers-master') ? 'flower-builder.html' : `product.html?slug=${encodeURIComponent(p.slug)}`);
                        const safeImg = window.optimizeBoseImageUrl((p.images && p.images.length > 0 && p.images[0]) ? p.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 120);
                        const safeTitle = window.escapeBoseHTML(p.title);
                        const safeFlavor = window.escapeBoseHTML(p.flavorName || '');
                        html += `
                            <a href="${targetUrl}" class="search-result-card-item">
                                <img src="${safeImg}" class="search-result-img" width="60" height="60" loading="lazy" alt="${safeTitle}" />
                                <div class="search-result-info">
                                    <div class="search-result-name">${safeTitle}</div>
                                    ${safeFlavor ? `<div class="search-result-flavor">${safeFlavor}</div>` : ''}
                                </div>
                                <div class="search-result-price-view">${Math.round(p.price)} جنيه</div>
                            </a>
                        `;
                    });
                    resultsContainer.innerHTML = html || '<div class="search-no-results-msg">لم نجد أصنافاً تطابق بحثك.</div>';
                }, 200);
            });
        }
    }

    function showGlobalFriendlyError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bose-global-toast-error';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.';
        document.body.appendChild(errorDiv);
    }

    /**
     * 🛡️🆕 [إصلاح - الصفحة بتفضل من غير هيدر ولا فوتر خالص لو النت بطيء]:
     * قبل كده buildAndInjectGlobalComponents (اللي بيرسم الهيدر/الفوتر
     * الحقيقيين) كان بيستنى بيانات المتجر توصل من Supabase الأول - على نت
     * بطيء جداً (زي 13 كيلوبايت/ث اللي ظهر في اسكرين شوت صاحبة المتجر)،
     * أو لو الاتصال فشل تماماً بعد كل المحاولات، العميلة كانت بتفضل شايفة
     * صفحة من غير أي تنقل (مفيش لوجو، مفيش زرار قائمة، مفيش سلة) لثواني
     * طويلة أو للأبد. دلوقتي بيتحقن هيدر/فوتر ثابتين وبسيطين فوراً (منطق ثابت،
     * مش معتمدين على أي بيانات من القاعدة) بمجرد ما الـDOM يجهز - قبل ما
     * loadStoreDatabase() يبدأ أصلاً. الهيدر/الفوتر الحقيقيين الديناميكيين
     * (بالشريط المتحرك ولوجو المتجر الفعلي وعداد السلة إلخ) بيستبدلوهم تلقائياً
     * بمجرد ما البيانات توصل - العميلة ميلاحظش أي "قفزة" غريبة لإن الشكل العام
     * (لوجو + اسم + أيقونات) متطابق تقريباً.
     */
    function injectBoseInstantFallbackShell() {
        const headerInjector = document.getElementById('bose-header-injector');
        if (headerInjector && !headerInjector.hasChildNodes()) {
            headerInjector.innerHTML = `
                <header class="bose-sticky-header">
                    <div class="header-right-side">
                        <button id="mobile-menu-toggle" class="bose-nav-btn" aria-label="فتح القائمة الجانبية">
                            <i class="fa-solid fa-bars-staggered"></i>
                        </button>
                        <a href="/index.html" class="brand-logo-container">
                            <img src="https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" alt="لوجو حلويات بوسي" class="brand-logo-img" width="80" height="80" />
                            <span class="brand-name-display">حلويات بوسي</span>
                        </a>
                    </div>
                    <div class="header-left-side">
                        <a href="/favorites.html" class="nav-cart-icon-wrapper" aria-label="عرض المفضلة">
                            <i class="fa-solid fa-heart bose-nav-btn" style="padding:0;"></i>
                        </a>
                        <a href="/cart.html" class="nav-cart-icon-wrapper" aria-label="عرض سلة المشتريات">
                            <i class="fa-solid fa-bag-shopping bose-nav-btn" style="padding:0;"></i>
                        </a>
                    </div>
                </header>
            `;
        }
        const footerInjector = document.getElementById('bose-footer-injector');
        if (footerInjector && !footerInjector.hasChildNodes()) {
            footerInjector.innerHTML = `
                <footer class="bose-footer-fallback" role="contentinfo" style="text-align:center;padding:32px 16px;font-family:'Cairo',sans-serif;color:var(--bose-black,#111111);opacity:0.65;font-size:0.85rem;">
                    <p style="margin:0;">© ${new Date().getFullYear()} حلويات بوسي</p>
                </footer>
            `;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            injectBoseInstantFallbackShell();
            loadStoreDatabase();
        });
    } else {
        injectBoseInstantFallbackShell();
        loadStoreDatabase();
    }

    // 🐛👑 [إصلاح جذري - عدادات السلة/المفضلة بتفضل عالقة على رقم قديم بعد
    // "الرجوع" لصفحة سابقة]: نفس مشكلة bfcache اللي اتصلحت قبل كده في
    // cart-engine.js (راجع pageshow هناك) - لكن الإصلاح ده كان مقصور بس على
    // صفحة السلة نفسها. الحقيقة إن المشكلة عامة في كل صفحات الموقع، لأن
    // core-engine.js (اللي بيحقن الهيدر والشريط السفلي وعدادات السلة/المفضلة
    // في كل صفحة) كان بيشتغل فقط عند حدث DOMContentLoaded - وده حدث بيحصل مرة
    // واحدة بس عند أول تحميل حقيقي للصفحة من السيرفر. لو العميلة أضافت منتج
    // من صفحة تانية وبعدين دوست "رجوع" في المتصفح، المتصفح (خصوصاً على
    // الموبايل) بيرجّع "لقطة" قديمة مجمّدة من الصفحة زي ما كانت بالظبط قبل ما
    // تسيبها - يعني بالعداد القديم (أو صفر لو كانت السلة فاضية وقتها) - رغم إن
    // بيانات السلة/المفضلة الحقيقية في localStorage سليمة ومحدّثة 100%. الحل:
    // حدث `pageshow` بيتفعّل دايماً لما الصفحة تظهر للعميلة (تحميل جديد أو
    // استرجاع من الكاش)، وخاصية `event.persisted` بتحدد إنها كانت استرجاع من
    // الكاش. في الحالة دي بس، بنعيد حساب وعرض عدادي السلة والمفضلة من أحدث
    // نسخة localStorage فوراً - نفس اللي كان هيحصل لو الصفحة اتحمّلت من جديد.
    window.addEventListener('pageshow', function (event) {
        if (!event.persisted) return;
        if (typeof window.updateGlobalCartCounter === 'function') window.updateGlobalCartCounter();
        if (typeof window.updateFavoritesBadge === 'function') window.updateFavoritesBadge();
        // لو العميلة رجعت لصفحة المفضلة نفسها من الكاش وكانت شالت/ضافت منتج من
        // مكان تاني، نعيد رسم شبكة المفضلة كمان مش بس العداد.
        if (typeof window.renderBoseFavoritesPage === 'function' && document.getElementById('bose-favorites-grid')) {
            window.renderBoseFavoritesPage();
        }
    });
})();

/**
 * 💡👑 [شريط معلومات دوّار مشترك - محاكي التورت ومحاكي الورد]: كارت واحد
 * بيعرض معلومة مفيدة وحقيقية، وبيتنقل تلقائياً للمعلومة اللي بعدها كل
 * فترة زمنية، مع شريط تقدّم رفيع بيوضح توقيت الانتقال - نفس المكوّن
 * بالحرف مستخدم في المحاكيين الاتنين عشان العميلة تحس إنها نفس التجربة.
 * بيتوقف تلقائياً لو العميلة حطت إيدها/الماوس عليه، وبيكمل لما تسيبه،
 * وبيتقدم خطوة لو ضغطت عليه يدوياً.
 */
(function () {
    "use strict";

    window.initBoseInfoCarousel = function (opts) {
        const trackId = opts && opts.trackId;
        const progressId = opts && opts.progressId;
        const tips = (opts && opts.tips) || [];
        const intervalMs = (opts && opts.intervalMs) || 6000;
        const enabled = !(opts && opts.enabled === false);
        const fontSize = (opts && Number(opts.fontSize) > 0) ? Number(opts.fontSize) : null;

        const track = document.getElementById(trackId);
        if (!track) return;
        const container = track.closest(".bose-info-carousel");

        // 🛡️👑 [إيقاف حقيقي من لوحة التحكم]: لو الأدمن قفلت "الشريط ظاهر
        // ومُفعّل" لمحاكي التورت أو الورد، الشريط بيختفي بالكامل (مش بس
        // بيوقف عن التغيير) - نفس منطق الشريط العلوي المتحرك في الرئيسية.
        if (!enabled) {
            if (container) container.style.display = "none";
            return;
        }
        if (container) container.style.display = "";

        if (!Array.isArray(tips) || tips.length === 0) return;

        // 🛡️👑 [حجم الخط ديناميكي من لوحة التحكم]: بيتظبط عبر متغير CSS على
        // الحاوية نفسها (--bose-info-carousel-font-size) بدل رقم ثابت -
        // راجع css/simulators.css.
        if (container && fontSize) {
            container.style.setProperty("--bose-info-carousel-font-size", fontSize + "px");
        }

        const esc = window.escapeBoseHTML || (s => s);
        track.innerHTML = tips.map((t, i) => `
            <div class="bose-info-carousel-slide${i === 0 ? " active" : ""}">
                <strong>${esc(t.title || "")}</strong>
                <span>${esc(t.text || "")}</span>
            </div>`).join("");

        const slides = track.querySelectorAll(".bose-info-carousel-slide");
        const progressFill = progressId ? document.getElementById(progressId) : null;
        const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let idx = 0;
        let timer = null;

        function showSlide(newIdx) {
            slides.forEach(s => s.classList.remove("active"));
            slides[newIdx].classList.add("active");
            idx = newIdx;
            if (progressFill && !prefersReducedMotion) {
                progressFill.style.transition = "none";
                progressFill.style.width = "0%";
                void progressFill.offsetWidth;
                progressFill.style.transition = `width ${intervalMs}ms linear`;
                progressFill.style.width = "100%";
            }
        }

        function goNext() {
            showSlide((idx + 1) % slides.length);
        }

        function start() {
            stop();
            if (prefersReducedMotion || slides.length < 2) return;
            timer = setInterval(goNext, intervalMs);
        }
        function stop() {
            if (timer) clearInterval(timer);
            timer = null;
        }

        if (container) {
            container.addEventListener("mouseenter", stop);
            container.addEventListener("mouseleave", () => { showSlide(idx); start(); });
            container.addEventListener("click", () => { goNext(); start(); });
            container.setAttribute("tabindex", "0");
            container.setAttribute("role", "group");
            container.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goNext(); start(); }
            });
        }

        showSlide(0);
        start();
    };
})();
