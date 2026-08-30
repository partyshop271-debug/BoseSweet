/**
 * 🎯 [الجولة التفاعلية الكاملة للموقع - "وريني كل حاجة"] 🎯 (V3.0)
 * ------------------------------------------------------------------
 * جولة واحدة متصلة تاخد العميلة من لحظة ما تفتح الموقع لحد ما تخلّص
 * طلب حقيقي وتشوف فاتورتها.
 *
 * ✨ [جديد في V3.0]:
 * - خطوات الجولة بقت بتتقرأ من جدول tour_steps في قاعدة البيانات (قابلة
 *   للتعديل بالكامل من لوحة التحكم: إضافة/تعديل/حذف/إعادة ترتيب خطوة)
 *   بدل ما تكون مكتوبة Hardcoded هنا. BOSE_TOUR_STEPS_FALLBACK تحت ده
 *   نسخة احتياطية طبق الأصل من نفس الـ47 خطوة، بتشتغل تلقائيًا لو
 *   قاعدة البيانات مش متاحة أو الجدول لسه فاضي - عشان الجولة ماتتوقفش
 *   أبداً حتى لو فيه مشكلة اتصال.
 * - تحليلات حقيقية: كل خطوة بتتعرض، كل تخطي تلقائي (عنصر مش موجود)،
 *   كل ضغطة "إنهاء الجولة"، وكل ترك فعلي للصفحة/التبويب أثناء خطوة
 *   نشطة - كل ده بيتسجل في tour_analytics_events عشان لوحة التحكم
 *   تقدر تعرض فعليًا عند أي خطوة العميلات بيسيبوا الجولة.
 * - توست تلقائي أول زيارة (على الصفحة الرئيسية بس، مرة واحدة لكل
 *   متصفح) بيعرض على العميلة تاخد الجولة، بدل الاعتماد بس على زرارين
 *   يدويين موجودين في الصفحة.
 *
 * ✨ [نوعين من الخطوات]:
 * - "click" (افتراضي): بتضيء عنصر حقيقي وبتستنى العميلة تدوس عليه هي
 *   بنفسها فعليًا - "بتتعلم وهي بتنفذ"، زي زرار "أضيفي للسلة".
 * - "info": بس شرح لعنصر (قسم، أيقونة، بلوك) - مفيش حاجة لازم تتدوس،
 *   في زرار "التالي" بس عشان نكمل.
 *
 * الحالة (active/stepIndex/sessionId) محفوظة في localStorage عشان
 * الجولة تكمل صح لما العميلة تتنقل بين الصفحات فعليًا، وsessionId
 * بيفضل نفسه طول الجولة الواحدة عشان كل أحداث التحليلات بتاعتها
 * تتجمع مع بعض في القاعدة.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'bose_guided_tour_state_v3';
    const TOAST_SEEN_KEY = 'bose_tour_first_visit_toast_seen_v1';
    const STEPS_SESSION_CACHE_KEY = 'bose_tour_steps_cache_v1';

    // 🛡️ [نسخة احتياطية]: نفس محتوى جدول tour_steps بالظبط وقت آخر تحديث
    // لهذا الملف - لو قاعدة البيانات مش متاحة أو الجدول فاضي (قبل عمل
    // الـmigration مثلاً)، الجولة بتشتغل بيها تلقائيًا من غير أي انقطاع.
    const BOSE_TOUR_STEPS_FALLBACK = [
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": ".bose-sticky-header",
        "title": "أهلاً بيكِ في حلويات بوسي 👋",
        "text": "هناخدك دلوقتي في جولة كاملة على الموقع - القائمة، البحث، السلة، وطريقة الطلب من الأول للآخر - وهتخلصي وانتي عارفة كل حاجة. تقدري تنهي الجولة في أي وقت من زرار تحت."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "click",
        "selector": "#mobile-menu-toggle",
        "hint": "دوسي على أيقونة الثلاث خطوط ☰ اللي فوق يمين الشاشة",
        "title": "القائمة الجانبية",
        "text": "الزرار ده بيفتحلك القائمة الجانبية، وفيها كل أقسام الموقع مجمّعة. دوسي عليه."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "click",
        "delayBeforeShow": 300,
        "selector": "#sidebar-categories-toggle",
        "hint": "دوسي على كلمة \"تسوّقي حسب الفئة\" اللي في القائمة",
        "title": "تسوّقي حسب الفئة",
        "text": "من هنا تقدري تشوفي كل الـ12 فئة عندنا (تورت، ورد، كب كيك، دوناتس...) في مكان واحد. دوسي هنا تفتحيها."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "delayBeforeShow": 200,
        "selector": "#sidebar-categories-list",
        "title": "كل الفئات هنا",
        "text": "دي كل فئات المنتجات - دوسي على أي فئة في أي وقت وهتوديكي لكل الأصناف اللي جواها."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#sidebar-link-offers",
        "title": "العروض والخصومات",
        "text": "من هنا تشوفي كل عروضنا والخصومات النشطة دلوقتي في صفحة واحدة."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#sidebar-link-rewards",
        "title": "مكافآتك",
        "text": "وده نظام المكافآت بتاعنا - هنشرحلك تفاصيله كمان شوية."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#sidebar-link-track-order",
        "title": "تتبعي طلبك",
        "text": "بعد ما تطلبي، تقدري تتابعي حالة طلبك في أي وقت من هنا."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#sidebar-link-cake-builder",
        "title": "صممي تورتتك بنفسك",
        "text": "عايزة تورتة مناسبة بالظبط لمناسبتك؟ من هنا تختاري الحجم والنكهة والشكل بنفسك."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#sidebar-link-flower-builder",
        "title": "صممي بوكيه الورد بنفسك",
        "text": "وبالظبط زي التورت، تقدري تصممي بوكيه ورد مخصص بنفسك من هنا."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": ".sidebar-footer-contacts",
        "title": "كلمينا مباشرة",
        "text": "ولو حبيتي تكلمينا في أي وقت، هتلاقي واتساب وتليفون المتجر هنا تحت في القائمة دايمًا."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "click",
        "selector": "#sidebar-close-btn",
        "hint": "دوسي على علامة الـ✕ اللي فوق يمين القائمة",
        "title": "قفل القائمة",
        "text": "تمام، خلصنا من القائمة الجانبية. دوسي هنا تقفليها."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "click",
        "selector": "#nav-search-btn",
        "hint": "دوسي على أيقونة العدسة 🔍 اللي فوق الشاشة",
        "title": "ابحثي عن أي صنف",
        "text": "مش عايزة تفتحي المنيو كله؟ دوسي على أيقونة البحث دي."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "delayBeforeShow": 250,
        "selector": "#bose-search-field",
        "title": "اكتبي اللي بتدوري عليه",
        "text": "اكتبي هنا اسم أي صنف أو نكهة (زي: قشطوطة، لوتس، كب كيك...) وهيطلعلك كل النتائج فورًا من غير ما تدوري في المنيو."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "click",
        "selector": "#search-modal-close",
        "hint": "دوسي على علامة الـ✕ اللي فوق يمين شاشة البحث",
        "title": "قفل البحث",
        "text": "ولما تخلصي بحث، دوسي هنا تقفلي."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": ".nav-cart-icon-wrapper[href=\"/favorites.html\"]",
        "title": "المفضلة",
        "text": "أي منتج يعجبك تقدري تحفظيه هنا بدوسة قلب واحدة، وترجعيله بعدين بسهولة من غير ما تدوري عليه تاني."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": ".nav-cart-icon-wrapper[href=\"/cart.html\"]",
        "title": "دي سلتك",
        "text": "دلوقتي فاضية، بس هتلاقيها هنا فوق في أي صفحة بالموقع دايمًا. هنملاها مع بعض كمان شوية."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#hero-section",
        "title": "الواجهة الرئيسية",
        "text": "زرار \"اطلب الآن\" هنا بيوديكي على المنيو الشامل على طول."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#categories-slider-section",
        "title": "تصفحي حسب الفئة",
        "text": "نفس الفئات اللي شوفناها في القائمة الجانبية، بس هنا بصور واضحة تقدري تتصفحيها بحرية."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#offers-carousel-section",
        "title": "استفيدي من عروضنا",
        "text": "دي كل العروض والتخفيضات النشطة دلوقتي - لو نفسك تستفيدي بسعر مميز، ابدأي من هنا."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#most-selling-section",
        "title": "الأكثر مبيعاً",
        "text": "كل كارت هنا فيه صورة المنتج وسعره، وزرار زيادة/تقليل الكمية، وزرار إضافة للسلة مباشرة - من غير ما تدخلي صفحة تانية أصلاً."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#cake-preview-section",
        "title": "محاكي التورت",
        "text": "لو عايزة تصممي تورتة مناسبتك بنفسك (الحجم، النكهة، الشكل، وحتى صورة مطبوعة عليها)، من هنا تدخلي المحاكي."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#new-arrivals-section",
        "title": "وصل حديثاً",
        "text": "وهنا آخر الأصناف الجديدة اللي ضفناها للمنيو."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#our-products-section",
        "title": "منتجاتنا كاملة",
        "text": "وده المنيو الكامل بتاعنا - دوسي \"استعرض المزيد\" لو عايزة تشوفي كل الأصناف من غير ما تنقلي لصفحة تانية."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#flower-preview-section",
        "title": "محاكي الورد",
        "text": "زي التورت بالظبط، تقدري تصممي بوكيه ورد مخصص بنفسك من هنا."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#app-promo-section",
        "title": "حمّلي تطبيقنا",
        "text": "لو عايزة تحملي تطبيقنا: دوسي على زرار App Store أو Google Play هنا، وهتلاقي فيه نفس المنيو بالظبط، وكمان إشعارات بعروضنا ونقاط مكافآتك أول بأول."
    },
    {
        "page": [
            "index.html"
        ],
        "mode": "info",
        "selector": "#loyalty-teaser-section",
        "title": "نظام المكافآت",
        "text": "خصم تلقائي على طلباتك من غير أي كود، وقسيمة شراء حقيقية بـ300 جنيه كل 10 طلبات - تقدري تكتبي رقم موبايلك هنا في أي وقت تتابعي بيه رصيدك."
    },
    {
        "page": [
            "menu.html"
        ],
        "mode": "click",
        "selector": ".bose-menu-custom-card",
        "hint": "دوسي على أي كارت فئة زي اللي قدامك دلوقتي",
        "title": "اختاري فئة",
        "text": "تمام! خلصنا كل حاجة في الموقع. دلوقتي هنعمل طلب حقيقي مع بعض خطوة بخطوة. دوسي على أي فئة زي دي."
    },
    {
        "page": [
            "category.html"
        ],
        "mode": "click",
        "selector": ".product-card",
        "hint": "دوسي على أي منتج زي اللي قدامك دلوقتي",
        "title": "اختاري الصنف",
        "text": "دوسي على أي منتج زي ده عشان تشوفي تفاصيله وسعره بالكامل."
    },
    {
        "page": [
            "product.html"
        ],
        "mode": "info",
        "selector": ".master-image-frame",
        "title": "صفحة المنتج",
        "text": "هتلاقي هنا صور واضحة للمنتج، وتحت كده وصف تفصيلي للمكونات والطعم عشان تختاري صح."
    },
    {
        "page": [
            "product.html"
        ],
        "mode": "info",
        "selector": ".product-price-block",
        "title": "السعر",
        "text": "وده السعر النهائي واضح قدامك من غير أي مفاجآت."
    },
    {
        "page": [
            "product.html"
        ],
        "mode": "info",
        "selector": ".qty-picker-capsule",
        "title": "حددي الكمية",
        "text": "من هنا تقدري تزوّدي أو تقلّلي الكمية اللي حابة تطلبيها قبل ما تضيفيها لسلتك."
    },
    {
        "page": [
            "product.html"
        ],
        "mode": "click",
        "selector": "#btn-add-to-cart-master-trigger",
        "hint": "دوسي على الزرار الوردي المكتوب عليه \"أضيفي للسلة\" تحت السعر",
        "title": "ضيفيه لسلتك",
        "text": "بعد ما تحددي اللي يناسبك، دوسي هنا عشان تضيفي المنتج ده لسلتك."
    },
    {
        "anyPage": true,
        "mode": "click",
        "delayBeforeShow": 550,
        "selector": ".nav-cart-icon-wrapper[href=\"/cart.html\"]",
        "title": "دي سلتك دلوقتي! 🎉",
        "text": "شوفي، بقى فيها رقم دلوقتي. دوسي عليها عشان نراجع طلبك مع بعض.",
        "hint": "دوسي على أيقونة الشنطة 🛍 اللي فوق يمين الشاشة وعليها رقم دلوقتي"
    },
    {
        "page": [
            "cart.html"
        ],
        "mode": "info",
        "selector": "#cart-items-wrapper",
        "title": "راجعي أصنافك",
        "text": "دي كل الأصناف اللي ضفتيها. تقدري تزوّدي أو تقلّلي الكمية، أو تشيلي أي صنف من زرار الحذف."
    },
    {
        "page": [
            "cart.html"
        ],
        "mode": "info",
        "selector": "#coupon-input",
        "title": "كود الخصم",
        "text": "لو عندك كود خصم، اكتبيه هنا ودوسي \"تطبيق\"."
    },
    {
        "page": [
            "cart.html"
        ],
        "mode": "info",
        "selector": "#checkout-order-notes-textarea",
        "title": "ملاحظاتك",
        "text": "وأي ملاحظة عايزاها تتقال لينا (زي حساسية من مكسرات مثلاً)، اكتبيها هنا."
    },
    {
        "page": [
            "cart.html"
        ],
        "mode": "click",
        "selector": "#btn-proceed-to-checkout",
        "hint": "دوسي على الزرار المكتوب عليه \"كمّلي طلبك\" تحت الفاتورة",
        "title": "كمّلي طلبك",
        "text": "لما تراجعي كل حاجة، دوسي هنا عشان تكتبي بياناتك وتحددي التوصيل أو الاستلام."
    },
    {
        "page": [
            "checkout.html"
        ],
        "mode": "info",
        "selector": "#checkout-customer-name",
        "title": "بياناتك",
        "text": "هنا بتحطي اسمك بالكامل ورقم موبايلك اللي عليه واتساب (ورقم إضافي اختياري لو حبيتي)."
    },
    {
        "page": [
            "checkout.html"
        ],
        "mode": "info",
        "selector": ".fulfillment-methods-flex",
        "title": "توصيل ولا استلام؟",
        "text": "اختاري توصيل للمنزل حسب منطقتك، أو استلام من الفرع من غير أي مصاريف شحن خالص."
    },
    {
        "page": [
            "checkout.html"
        ],
        "mode": "info",
        "delayBeforeShow": 200,
        "selector": "#shipping-zone-wrapper",
        "title": "منطقتك وعنوانك",
        "text": "لو اخترتِ التوصيل، حددي منطقتك السكنية واكتبي عنوانك بالتفصيل، وهيتحسب سعر الشحن تلقائي."
    },
    {
        "page": [
            "checkout.html"
        ],
        "mode": "info",
        "selector": "#checkout-delivery-date",
        "title": "ميعاد التسليم",
        "text": "وهنا تحددي تاريخ وساعة التسليم اللي تناسبك (محتاجين على الأقل 24 ساعة عشان نجهز طلبك طازة)."
    },
    {
        "page": [
            "checkout.html"
        ],
        "mode": "info",
        "selector": "#bose-deposit-payment-box",
        "title": "طريقة الدفع",
        "text": "تحويل كاش أو InstaPay على رقم المتجر - عربون 50% بس لو هتستلمي من الفرع، أو المبلغ كامل مقدمًا لو هيتوصّلك."
    },
    {
        "page": [
            "checkout.html"
        ],
        "mode": "click",
        "selector": "#btn-submit-order-final",
        "hint": "دوسي على الزرار المكتوب عليه \"اطلبي دلوقتي\" في آخر الصفحة",
        "title": "اطلبي دلوقتي",
        "text": "لما تراجعي كل حاجة، دوسي هنا - هيتفتحلك واتساب فيه فاتورتك جاهزة. متنسيش تدوسي إرسال جوه واتساب نفسه عشان الطلب يوصلنا فعلاً."
    },
    {
        "page": [
            "order-success.html"
        ],
        "mode": "info",
        "selector": ".order-summary-receipt-box",
        "title": "فاتورتك",
        "text": "تمام، ده رقم طلبك وفاتورتك بالتفصيل - احتفظي بيه للمتابعة."
    },
    {
        "page": [
            "order-success.html"
        ],
        "mode": "info",
        "selector": "#bose-resend-whatsapp-btn",
        "title": "شبكة أمان",
        "text": "لو رسالة الواتساب ما اتفتحتش تلقائي، دوسي هنا وابعتيها بنفسك يدوي."
    },
    {
        "page": [
            "order-success.html"
        ],
        "mode": "info",
        "selector": "#bose-success-track-btn",
        "title": "تابعي طلبك",
        "text": "وبعد كده تقدري تتابعي حالة طلبك في أي وقت من هنا."
    },
    {
        "page": [
            "order-success.html"
        ],
        "mode": "info",
        "selector": "#bose-download-invoice-image-btn",
        "title": "احتفظي بفاتورتك",
        "text": "وده تحميل اختياري لصورة فاتورتك تحتفظي بيها عندك كمرجع شخصي."
    }
];

    /* ============================= مصدر الخطوات (DB أولاً) ============================= */

    let RESOLVED_STEPS = null;

    function readStepsSessionCache() {
        try {
            const raw = sessionStorage.getItem(STEPS_SESSION_CACHE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }
    function writeStepsSessionCache(steps) {
        try { sessionStorage.setItem(STEPS_SESSION_CACHE_KEY, JSON.stringify(steps)); } catch (e) { /* لا شيء */ }
    }

    // 🔄 [تحميل مرة واحدة لكل تبويب]: أول ما الجولة تحتاج الخطوات، بنجيبها
    // من القاعدة مرة واحدة ونخزنها في sessionStorage، عشان أي تنقل صفحة
    // تاني أثناء نفس الجولة ما يعملش طلب شبكة جديد كل مرة. لو العميلة
    // فتحت تبويب جديد أو مسحت الكاش، هيتعمل طلب جديد تلقائي.
    async function ensureStepsLoaded() {
        if (RESOLVED_STEPS) return RESOLVED_STEPS;
        const cached = readStepsSessionCache();
        if (cached && cached.length) { RESOLVED_STEPS = cached; return RESOLVED_STEPS; }

        let fromDb = null;
        try {
            if (window.BoseSupabase && typeof window.BoseSupabase.fetchBoseTourSteps === 'function') {
                fromDb = await window.BoseSupabase.fetchBoseTourSteps();
            }
        } catch (e) { fromDb = null; }

        RESOLVED_STEPS = (fromDb && fromDb.length) ? fromDb : BOSE_TOUR_STEPS_FALLBACK;
        writeStepsSessionCache(RESOLVED_STEPS);
        return RESOLVED_STEPS;
    }

    /* ============================= جلسة الجولة + التحليلات ============================= */

    function makeSessionId() {
        try { if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID(); } catch (e) { /* تراجع تحت */ }
        return 'bose-tour-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    }

    // 📊 [تسجيل حدث تحليلي - best effort]: أي فشل هنا (شبكة، الجدول لسه
    // مش موجود...) بيتجاهل بصمت تمامًا وما يأثرش على تجربة الجولة نفسها.
    function logTourEvent(eventType, opts) {
        opts = opts || {};
        try {
            if (window.BoseSupabase && typeof window.BoseSupabase.logBoseTourEvent === 'function') {
                window.BoseSupabase.logBoseTourEvent({
                    sessionId: opts.sessionId || (getState() && getState().sessionId) || null,
                    eventType,
                    stepOrder: typeof opts.stepIndex === 'number' ? opts.stepIndex + 1 : null,
                    stepSelector: opts.selector || null,
                    stepTitle: opts.title || null,
                    pageFile: currentPageFile(),
                });
            }
        } catch (e) { /* تجاهل عمدي */ }
    }


    function logTourEventOnExit(eventType, opts) {
        opts = opts || {};
        try {
            if (window.BoseSupabase && typeof window.BoseSupabase.logBoseTourEventOnExit === 'function') {
                window.BoseSupabase.logBoseTourEventOnExit({
                    sessionId: opts.sessionId || (getState() && getState().sessionId) || null,
                    eventType,
                    stepOrder: typeof opts.stepIndex === 'number' ? opts.stepIndex + 1 : null,
                    stepSelector: opts.selector || null,
                    stepTitle: opts.title || null,
                    pageFile: currentPageFile(),
                });
            }
        } catch (e) { /* تجاهل عمدي */ }
    }

    /* ============================= حالة الجولة (localStorage) ============================= */

    function getState() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch (e) { return null; }
    }
    function setState(s) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* localStorage غير متاح، الجولة هتشتغل للصفحة الحالية بس */ }
    }
    function clearState() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* لا شيء */ }
    }

    function currentPageFile() {
        const parts = window.location.pathname.split('/');
        return parts[parts.length - 1] || 'index.html';
    }

    let activeOverlayEls = null;
    let activeClickHandler = null;
    let waitTimer = null;
    let activeTargetEl = null;
    let activeRepositionRAF = null;
    let repositionTimer = null;
    let activeScrollHandler = null;

    // 🚪 [تتبع الترك الحقيقي]: طول ما الخطوة دي ظاهرة وماحصلش تقدّم حقيقي
    // (لا دوسة على العنصر، لا "التالي"، لا "إنهاء الجولة")، لو العميلة قفلت
    // التبويب أو نقلت لموقع تاني، بنعتبر ده ترك فعلي عند الخطوة دي بالظبط.
    let currentStepInfo = null; // { stepIndex, selector, title }
    let currentStepAdvanced = false;

    function handlePageHide() {
        if (currentStepInfo && !currentStepAdvanced) {
            const state = getState();
            if (state && state.active) {
                logTourEventOnExit('tour_abandon', {
                    sessionId: state.sessionId,
                    stepIndex: currentStepInfo.stepIndex,
                    selector: currentStepInfo.selector,
                    title: currentStepInfo.title,
                });
            }
        }
    }
    // pagehide بيتغطي إغلاق التبويب والتنقل لموقع خارجي؛ visibilitychange
    // (hidden) بيتغطي تبديل التطبيق على الموبايل أو تبويب تاني - كلاهما
    // "ترك فعلي" محتمل للجولة من نفس النوع، فبنستخدم نفس الدالة للاتنين.
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') handlePageHide(); });

    function removeOverlay() {
        if (activeOverlayEls) { activeOverlayEls.forEach(el => el.remove()); activeOverlayEls = null; }
        if (activeClickHandler) { document.removeEventListener('click', activeClickHandler, true); activeClickHandler = null; }
        if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
        if (repositionTimer) { cancelAnimationFrame(repositionTimer); repositionTimer = null; }
        activeRepositionRAF = null;
        if (activeScrollHandler) {
            window.removeEventListener('scroll', activeScrollHandler, true);
            window.removeEventListener('resize', activeScrollHandler, true);
            activeScrollHandler = null;
        }
        activeTargetEl = null;
        currentStepInfo = null;
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'bose-tour-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('bose-tour-toast-show'));
        setTimeout(() => { t.classList.remove('bose-tour-toast-show'); setTimeout(() => t.remove(), 400); }, 3400);
    }

    function endTour(celebrate) {
        removeOverlay();
        clearState();
        if (celebrate) showToast('تمام! 🎉 كده بقيتي عارفة تستخدمي موقعنا وتطلبي منه بكل سهولة.');
    }

    function injectStylesOnce() {
        if (document.getElementById('bose-tour-styles')) return;
        const style = document.createElement('style');
        style.id = 'bose-tour-styles';
        style.textContent = `
            .bose-tour-highlight-box{position:fixed;z-index:99998;pointer-events:none;border-radius:14px;box-shadow:0 0 0 9999px rgba(17,17,17,.62);border:3px solid #FF91A4;}
            .bose-tour-tooltip{position:fixed;z-index:99999;background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 8px 30px rgba(0,0,0,.25);max-width:300px;font-family:'Cairo',sans-serif;direction:rtl;text-align:right;animation:boseTourPop .25s ease;}
            @keyframes boseTourPop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
            .bose-tour-progress-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
            .bose-tour-progress-track{flex:1;height:4px;border-radius:4px;background:rgba(255,145,164,.18);overflow:hidden;}
            .bose-tour-progress-fill{height:100%;background:#FF91A4;border-radius:4px;transition:width .25s ease;}
            .bose-tour-progress-text{font-size:.68rem;color:#FF91A4;font-weight:700;white-space:nowrap;}
            .bose-tour-tooltip-title{font-weight:800;font-size:1rem;color:#111;margin-bottom:6px;}
            .bose-tour-tooltip-text{font-size:.88rem;color:#333;line-height:1.6;margin:0 0 12px 0;}
            .bose-tour-tap-hint{display:flex;align-items:center;gap:5px;font-size:.78rem;color:#FF91A4;font-weight:700;margin-bottom:12px;}
            .bose-tour-next-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;background:#FF91A4;color:#fff;border:none;border-radius:12px;padding:10px 14px;font-family:'Cairo',sans-serif;font-size:.88rem;font-weight:800;cursor:pointer;margin-bottom:10px;transition:filter .15s ease;}
            .bose-tour-next-btn:hover{filter:brightness(0.95);}
            .bose-tour-bottom-row{display:flex;align-items:center;justify-content:space-between;}
            .bose-tour-skip-btn{background:none;border:none;color:#999;font-size:.76rem;cursor:pointer;text-decoration:underline;padding:0;font-family:'Cairo',sans-serif;margin:0 auto;}
            .bose-tour-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#111;color:#fff;padding:14px 22px;border-radius:14px;font-family:'Cairo',sans-serif;font-size:.9rem;z-index:100000;opacity:0;transition:opacity .3s ease,transform .3s ease;max-width:88vw;text-align:center;}
            .bose-tour-toast-show{opacity:1;transform:translateX(-50%) translateY(0);}
            @media (max-width:480px){.bose-tour-tooltip{max-width:85vw;}}
            .bose-tour-intro-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(24px);background:#fff;color:#111;padding:16px 18px;border-radius:16px;box-shadow:0 10px 34px rgba(0,0,0,.22);z-index:100000;opacity:0;transition:opacity .35s ease,transform .35s ease;max-width:340px;width:88vw;font-family:'Cairo',sans-serif;direction:rtl;text-align:right;}
            .bose-tour-intro-toast-show{opacity:1;transform:translateX(-50%) translateY(0);}
            .bose-tour-intro-toast-title{font-weight:800;font-size:.95rem;margin-bottom:4px;display:flex;align-items:center;gap:6px;}
            .bose-tour-intro-toast-text{font-size:.84rem;color:#555;line-height:1.55;margin:0 0 12px 0;}
            .bose-tour-intro-toast-row{display:flex;gap:8px;}
            .bose-tour-intro-accept-btn{flex:1;background:#FF91A4;color:#fff;border:none;border-radius:11px;padding:9px 10px;font-family:'Cairo',sans-serif;font-size:.82rem;font-weight:800;cursor:pointer;}
            .bose-tour-intro-dismiss-btn{background:none;border:none;color:#999;font-size:.82rem;cursor:pointer;font-family:'Cairo',sans-serif;padding:9px 10px;}
        `;
        document.head.appendChild(style);
    }

    function waitForElement(selector, cb, onTimeout, timeoutMs) {
        const start = Date.now();
        (function tick() {
            const el = document.querySelector(selector);
            if (el) { cb(el); return; }
            if (Date.now() - start > (timeoutMs || 8000)) { if (onTimeout) onTimeout(); return; }
            waitTimer = setTimeout(tick, 200);
        })();
    }

    // 🧭 [استقرار المكان الحقيقي]: بنستنى الـrect بتاع العنصر يفضل ثابت
    // (نفس top/left/width/height) لعدد فريمات متتالية بدل ما نفترض إن مدة
    // معينة كافية دايمًا.
    function waitForStableRect(el, cb, maxWaitMs) {
        const start = Date.now();
        let lastKey = null;
        let stableTicks = 0;
        (function frame() {
            if (!document.body.contains(el)) { cb(el.getBoundingClientRect()); return; }
            const r = el.getBoundingClientRect();
            const key = Math.round(r.top) + ':' + Math.round(r.left) + ':' + Math.round(r.width) + ':' + Math.round(r.height);
            if (key === lastKey) stableTicks++; else { stableTicks = 0; lastKey = key; }
            if (stableTicks >= 3 || Date.now() - start > (maxWaitMs || 1500)) { cb(r); return; }
            requestAnimationFrame(frame);
        })();
    }

    function positionAndShowStep(stepIndex) {
        removeOverlay();
        const step = RESOLVED_STEPS[stepIndex];
        if (!step) { endTour(true); return; }
        const proceed = () => waitForElement(
            step.selector,
            el => renderSpotlight(el, step, stepIndex),
            // العنصر مش موجود على الصفحة دي - منسيبش الجولة عالقة، نسجّل ده
            // كتخطي تلقائي (مهم لتشخيص selector اتغيّر/اتكسر في الكود)
            // ونكمل اللي بعدها، ونقول للعميلة إن ده اللي حصل بدل ما الجولة
            // تختفي من غير تفسير.
            () => {
                logTourEvent('tour_auto_skip', { stepIndex, selector: step.selector, title: step.title });
                showToast('معلش، خطوة في الجولة اتخطّت تلقائيًا 🙏');
                handleAdvance(stepIndex, stepIndex + 1);
            },
            step.timeoutMs
        );
        if (step.delayBeforeShow) setTimeout(proceed, step.delayBeforeShow); else proceed();
    }

    // 🔄 [التتبع اللحظي]: طول ما الخطوة دي ظاهرة، بنفضل نتابع مكان العنصر
    // الحقيقي ونحرّك الإطار والكارت يعيشوا فوقه بالظبط.
    function updateOverlayPosition() {
        if (!activeTargetEl || !activeOverlayEls) return;
        const [box, tooltip] = activeOverlayEls;
        const rect = activeTargetEl.getBoundingClientRect();
        const pad = 8;
        box.style.top = (rect.top - pad) + 'px';
        box.style.left = (rect.left - pad) + 'px';
        box.style.width = (rect.width + pad * 2) + 'px';
        box.style.height = (rect.height + pad * 2) + 'px';

        const tRect = tooltip.getBoundingClientRect();
        let top = rect.bottom + pad + 14;
        if (top + tRect.height > window.innerHeight - 10) top = Math.max(10, rect.top - tRect.height - 14 - pad);
        let left = rect.left + rect.width / 2 - tRect.width / 2;
        left = Math.max(10, Math.min(left, window.innerWidth - tRect.width - 10));
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }

    function renderSpotlight(el, step, stepIndex) {
        injectStylesOnce();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        waitForStableRect(el, () => {
            if (!document.body.contains(el)) { handleAdvance(stepIndex, stepIndex + 1); return; }
            const rect = el.getBoundingClientRect();
            const pad = 8;
            const box = document.createElement('div');
            box.className = 'bose-tour-highlight-box';
            box.style.top = (rect.top - pad) + 'px';
            box.style.left = (rect.left - pad) + 'px';
            box.style.width = (rect.width + pad * 2) + 'px';
            box.style.height = (rect.height + pad * 2) + 'px';
            document.body.appendChild(box);

            const total = RESOLVED_STEPS.length;
            const isInfo = step.mode === 'info';
            const isLast = stepIndex === total - 1;
            const percent = Math.round(((stepIndex + 1) / total) * 100);
            const hintText = step.hint || 'دوسي على العنصر المضيء بالإطار الوردي';

            const tooltip = document.createElement('div');
            tooltip.className = 'bose-tour-tooltip';
            tooltip.innerHTML = `
                <div class="bose-tour-progress-row">
                    <div class="bose-tour-progress-track"><div class="bose-tour-progress-fill" style="width:${percent}%"></div></div>
                    <span class="bose-tour-progress-text">${stepIndex + 1} / ${total}</span>
                </div>
                <div class="bose-tour-tooltip-title">${step.title}</div>
                <p class="bose-tour-tooltip-text">${step.text}</p>
                ${isInfo
                    ? `<button type="button" class="bose-tour-next-btn" data-bose-tour-next="1">${isLast ? 'إنهاء الجولة 🎉' : 'التالي'} <i class="fa-solid fa-arrow-left"></i></button>`
                    : `<div class="bose-tour-tap-hint"><i class="fa-solid fa-hand-pointer"></i> ${hintText}</div>`
                }
                <div class="bose-tour-bottom-row">
                    <button type="button" class="bose-tour-skip-btn" data-bose-tour-skip="1">إنهاء الجولة</button>
                </div>
            `;
            document.body.appendChild(tooltip);

            activeOverlayEls = [box, tooltip];
            activeTargetEl = el;
            updateOverlayPosition();

            // 📊 [الخطوة اتعرضت فعليًا للعميلة]: أهم حدث لحساب الـfunnel -
            // بيتسجّل هنا بالظبط لحظة ظهور الكارت الحقيقي، مش لحظة محاولة العرض.
            currentStepInfo = { stepIndex, selector: step.selector, title: step.title };
            currentStepAdvanced = false;
            logTourEvent('step_view', { stepIndex, selector: step.selector, title: step.title });

            activeRepositionRAF = () => { updateOverlayPosition(); repositionTimer = requestAnimationFrame(activeRepositionRAF); };
            repositionTimer = requestAnimationFrame(activeRepositionRAF);
            activeScrollHandler = () => updateOverlayPosition();
            window.addEventListener('scroll', activeScrollHandler, true);
            window.addEventListener('resize', activeScrollHandler, true);

            tooltip.querySelector('[data-bose-tour-skip]').addEventListener('click', () => {
                currentStepAdvanced = true; // مش ترك بالصدفة - قرار واعي، الحدث بينفصل بنفسه تحت
                logTourEvent('tour_skip', { stepIndex, selector: step.selector, title: step.title });
                endTour(false);
            });

            if (isInfo) {
                const nextBtn = tooltip.querySelector('[data-bose-tour-next]');
                if (nextBtn) nextBtn.addEventListener('click', () => handleAdvance(stepIndex, stepIndex + 1));
            } else {
                activeClickHandler = function (e) {
                    if (e.target.closest('[data-bose-tour-skip]')) return;
                    if (!e.target.closest(step.selector)) return;
                    handleAdvance(stepIndex, stepIndex + 1);
                };
                document.addEventListener('click', activeClickHandler, true);
            }
        }, step.mode === 'info' ? 900 : 1500);
    }

    // 🔀 [الانتقال بين الخطوات]
    function handleAdvance(fromIndex, toIndex) {
        const fromStep = RESOLVED_STEPS[fromIndex];
        currentStepAdvanced = true;
        if (fromStep) logTourEvent('step_advance', { stepIndex: fromIndex, selector: fromStep.selector, title: fromStep.title });

        removeOverlay();
        if (toIndex >= RESOLVED_STEPS.length) {
            logTourEvent('tour_finish', { stepIndex: fromIndex });
            endTour(true);
            return;
        }
        const state = getState();
        setState({ active: true, stepIndex: toIndex, sessionId: state ? state.sessionId : makeSessionId() });
        const nextStep = RESOLVED_STEPS[toIndex];
        const page = currentPageFile();
        const staysOnPage = nextStep.anyPage || (nextStep.page && nextStep.page.indexOf(page) !== -1);
        if (staysOnPage) { positionAndShowStep(toIndex); return; }
        if (fromStep && fromStep.mode === 'info' && nextStep.page && nextStep.page[0]) {
            window.location.href = '/' + nextStep.page[0];
        }
        // غير كده: لينك حقيقي هيتنقل بيه المتصفح لوحده، وinit() هيكمّل الجولة تلقائيًا.
    }

    async function startTour() {
        const steps = await ensureStepsLoaded();
        RESOLVED_STEPS = steps;
        const sessionId = makeSessionId();
        setState({ active: true, stepIndex: 0, sessionId });
        logTourEvent('tour_start', { stepIndex: 0, sessionId });
        const firstPage = steps[0].anyPage ? currentPageFile() : steps[0].page[0];
        if (currentPageFile() === firstPage) init(); else window.location.href = '/' + firstPage;
    }

    async function init() {
        const state = getState();
        if (!state || !state.active) return;
        const steps = await ensureStepsLoaded();
        RESOLVED_STEPS = steps;
        const step = steps[state.stepIndex];
        if (!step) { clearState(); return; }
        const page = currentPageFile();
        const pageMatches = step.anyPage || (step.page && step.page.indexOf(page) !== -1);
        if (!pageMatches) return; // العميلة يمكن غيّرت الصفحة يدوي بره مسار الجولة
        positionAndShowStep(state.stepIndex);
    }

    /* ============================= توست تلقائي أول زيارة ============================= */

    // 🆕 [توست تلقائي أول زيارة]: بيظهر مرة واحدة بس لكل متصفح (مش لكل
    // صفحة/جلسة) على الصفحة الرئيسية، بعد تأخير بسيط عشان الصفحة تخلص
    // تحميل الأول. مستقل تمامًا عن زرارين البدء اليدويين الموجودين فعلاً
    // في الصفحة - إضافة، مش بديل.
    function maybeShowFirstVisitToast() {
        if (currentPageFile() !== 'index.html') return;
        let alreadySeen = true;
        try { alreadySeen = !!localStorage.getItem(TOAST_SEEN_KEY); } catch (e) { alreadySeen = true; /* تحفظاً، لو localStorage مقفول متعرضش التوست كل مرة */ }
        if (alreadySeen) return;
        const state = getState();
        if (state && state.active) return; // جولة شغالة بالفعل، مفيش داعي للتوست

        setTimeout(() => {
            // تأكيد تاني قبل العرض الفعلي - العميلة يمكن بدأت الجولة يدويًا
            // من الزرارين الموجودين في نفس الفترة دي.
            const stateNow = getState();
            if (stateNow && stateNow.active) return;
            try { localStorage.setItem(TOAST_SEEN_KEY, '1'); } catch (e) { /* لا شيء */ }

            injectStylesOnce();
            const introSessionId = makeSessionId(); // مؤقت، بيتسجل بيه ظهور/تفاعل التوست بس
            logTourEvent('auto_toast_shown', { sessionId: introSessionId });

            const toast = document.createElement('div');
            toast.className = 'bose-tour-intro-toast';
            toast.innerHTML = `
                <div class="bose-tour-intro-toast-title">👋 أول مرة تزوري موقعنا؟</div>
                <p class="bose-tour-intro-toast-text">تحبي ناخدك في جولة سريعة نوريكي فيها كل حاجة في الموقع وإزاي تطلبي بسهولة؟</p>
                <div class="bose-tour-intro-toast-row">
                    <button type="button" class="bose-tour-intro-accept-btn" data-bose-intro-accept="1">آه، وريني الجولة</button>
                    <button type="button" class="bose-tour-intro-dismiss-btn" data-bose-intro-dismiss="1">لأ شكراً</button>
                </div>
            `;
            document.body.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('bose-tour-intro-toast-show'));

            function removeToast() {
                toast.classList.remove('bose-tour-intro-toast-show');
                setTimeout(() => toast.remove(), 350);
            }

            toast.querySelector('[data-bose-intro-accept]').addEventListener('click', () => {
                logTourEvent('auto_toast_accept', { sessionId: introSessionId });
                removeToast();
                startTour();
            });
            toast.querySelector('[data-bose-intro-dismiss]').addEventListener('click', () => {
                logTourEvent('auto_toast_dismiss', { sessionId: introSessionId });
                removeToast();
            });
        }, 3500);
    }

    // أي عنصر عليه data-start-bose-tour="1" (تلميح الهيدر، زرار قسم "إزاي
    // أطلب؟"، رابط القائمة الجانبية) بيبدأ الجولة الكاملة بدل سلوكه الافتراضي.
    document.addEventListener('click', function (e) {
        const trigger = e.target.closest('[data-start-bose-tour]');
        if (!trigger) return;
        e.preventDefault();
        startTour();
    }, false);

    window.startBoseGuidedTour = startTour;

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(init, 600);
        maybeShowFirstVisitToast();
    });
})();
