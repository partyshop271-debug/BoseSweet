/**
 * 🎯 [نظام الجولات التفاعلية - جولات مستقلة بالمنطقة] 🎯 (V4.0)
 * ------------------------------------------------------------------
 * ✨ [جديد في V4.0 - أهم تغيير في تاريخ الميزة دي]:
 * الجولة الواحدة المتصلة القديمة (47 خطوة من الهيدر لحد الفاتورة) اتلغت
 * خالص، وبقى عندنا 9 جولات مستقلة تمامًا عن بعض، كل واحدة بتشرح منطقة
 * واحدة بس: القائمة الجانبية (sidebar)، الصفحة الرئيسية (homepage)،
 * صفحة المنتج (product)، محاكي التورت (cake_simulator)، محاكي الورد
 * (flower_simulator)، السلة (cart)، إتمام الطلب (checkout)، نادي
 * المكافآت (rewards)، وتتبع الطلب (track_order).
 *
 * كل جولة عندها:
 * - توست تلقائي مستقل أول ما العميلة تدخل المنطقة دي (مرة واحدة بس لكل
 *   متصفح لكل جولة - علم منفصل لكل جولة، مش علم واحد عام زي الأول).
 * - إمكانية "تخطي القسم" (لو الجولة طويلة ومقسّمة لأقسام فرعية زي
 *   القائمة الجانبية والصفحة الرئيسية ومحاكيات التصميم) - بتقفز
 *   للقسم الفرعي التالي من غير ما تخرج من الجولة خالص.
 * - إمكانية "السابق" (الرجوع لخطوة قبل كده، حتى لو كانت في صفحة تانية).
 *
 * 🆕 [زرار المساعدة العائم]: زرار وردي ثابت أقصى يمين الشاشة موجود في
 * كل صفحات الموقع طول الوقت - بالضغط عليه بتظهر قايمة (زي قايمة
 * المشاركة في الموبايل) فيها كل الجولات المتاحة، وبضغطة واحدة العميلة
 * تختار تبدأ من أي منطقة عايزاها فورًا.
 *
 * ✨ [نوعين من الخطوات - زي الأول من غير تغيير]:
 * - "click": بتضيء عنصر حقيقي وبتستنى العميلة تدوس عليه هي بنفسها.
 * - "info": شرح بس، في زرار "التالي" عشان نكمل.
 *
 * الحالة (الجولة النشطة/رقم الخطوة/تاريخ الخطوات اللي فاتت للرجوع
 * لها/sessionId) محفوظة في localStorage عشان الجولة تكمل صح لما
 * العميلة تتنقل بين الصفحات فعليًا.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'bose_guided_tour_state_v4';
    const TOAST_SEEN_KEY_PREFIX = 'bose_tour_first_visit_toast_seen_v2_';
    const STEPS_SESSION_CACHE_KEY = 'bose_tour_steps_cache_v2';
    const FAB_POINTER_SEEN_KEY = 'bose_tour_fab_pointer_seen_v1';

    // 🧭 [تعريف الجولات المتاحة]: القايمة اللي بتظهر في زرار المساعدة
    // العائم - كل جولة عندها مفتاح فريد (نفس tour_key في قاعدة البيانات)،
    // اسم معروض، أيقونة، ونصوص التوست التلقائي أول زيارة للمنطقة دي.
    const TOUR_DEFS = [
        { key: 'sidebar', label: 'القائمة الجانبية', icon: 'fa-bars', toastTitle: 'حابة نوريكي القائمة الجانبية؟', toastText: 'كل أقسام الموقع مجمّعة في مكان واحد - تحبي نوريكي إيه فيها بسرعة؟' },
        { key: 'homepage', label: 'الصفحة الرئيسية', icon: 'fa-house', toastTitle: 'أول مرة تزوري موقعنا؟', toastText: 'تحبي ناخدك في جولة سريعة نوريكي فيها كل حاجة في الصفحة الرئيسية؟' },
        { key: 'product', label: 'صفحة المنتج', icon: 'fa-box-open', toastTitle: 'أول مرة تشوفي صفحة منتج؟', toastText: 'تحبي جولة سريعة نوريكي فيها إزاي تختاري وتضيفي أي منتج لسلتك؟' },
        { key: 'cake_simulator', label: 'محاكي التورت', icon: 'fa-cake-candles', toastTitle: 'أول مرة تدخلي محاكي التورت؟', toastText: 'تحبي ناخدك خطوة بخطوة نصمم مع بعض تورتة مناسبتك؟' },
        { key: 'flower_simulator', label: 'محاكي الورد', icon: 'fa-spa', toastTitle: 'أول مرة تدخلي محاكي الورد؟', toastText: 'تحبي ناخدك خطوة بخطوة نصمم مع بعض بوكيه مناسبتك؟' },
        { key: 'cart', label: 'السلة', icon: 'fa-cart-shopping', toastTitle: 'أول مرة تدخلي سلتك؟', toastText: 'تحبي جولة سريعة نوريكي فيها كل حاجة في السلة؟' },
        { key: 'checkout', label: 'إتمام الطلب', icon: 'fa-credit-card', toastTitle: 'أول مرة تكملي طلب؟', toastText: 'تحبي جولة سريعة نوريكي فيها خطوات إتمام الطلب من الأول للآخر؟' },
        { key: 'rewards', label: 'نادي المكافآت', icon: 'fa-crown', toastTitle: 'أول مرة تزوري نادي المكافآت؟', toastText: 'تحبي نوريكي بسرعة إزاي تكسبي خصومات وقسيمة شراء حقيقية على طلباتك؟' },
        { key: 'track_order', label: 'تتبع الطلب', icon: 'fa-location-crosshairs', toastTitle: 'أول مرة تتبعي طلب؟', toastText: 'تحبي نوريكي إزاي تعرفي حالة طلبك بسهولة؟' },
    ];

    // 🛡️ [نسخة احتياطية]: نفس محتوى جدول tour_steps بالظبط وقت آخر تحديث،
    // مقسّمة هنا حسب الجولة - لو قاعدة البيانات مش متاحة أو جولة معينة
    // لسه فاضية فيها، الجولة دي بالذات (مش كل الجولات) بتشتغل بالنسخة
    // الاحتياطية تلقائيًا من غير أي انقطاع.
    const BOSE_TOUR_STEPS_FALLBACK = {
        sidebar: [
            { page: ['index.html'], mode: 'click', selector: '#mobile-menu-toggle', hint: 'دوسي على أيقونة الثلاث خطوط ☰ اللي فوق يمين الشاشة', title: 'القائمة الجانبية', text: 'الزرار ده بيفتحلك القائمة الجانبية، وفيها كل أقسام الموقع مجمّعة في مكان واحد. دوسي عليه.', section: 'links' },
            { page: ['index.html'], mode: 'click', delayBeforeShow: 300, selector: '#sidebar-categories-toggle', hint: 'دوسي على كلمة "تسوّقي حسب الفئة" اللي في القائمة', title: 'تسوّقي حسب الفئة', text: 'من هنا تقدري تشوفي كل الفئات عندنا (تورت، ورد، كب كيك، دوناتس...) في مكان واحد. دوسي هنا تفتحيها.', section: 'links' },
            { page: ['index.html'], mode: 'info', delayBeforeShow: 200, selector: '#sidebar-categories-list', title: 'كل الفئات هنا', text: 'دي كل فئات المنتجات - دوسي على أي فئة في أي وقت وهتوديكي لكل الأصناف اللي جواها.', section: 'links' },
            { page: ['index.html'], mode: 'info', selector: '#sidebar-link-offers', title: 'العروض والخصومات', text: 'من هنا تشوفي كل عروضنا والخصومات النشطة دلوقتي في صفحة واحدة.', section: 'links' },
            { page: ['index.html'], mode: 'info', selector: '#sidebar-link-rewards', title: 'مكافآتك', text: 'وده نظام المكافآت بتاعنا - خصم تلقائي وقسيمة شراء حقيقية كل عدد معيّن من الطلبات.', section: 'links' },
            { page: ['index.html'], mode: 'info', selector: '#sidebar-link-track-order', title: 'تتبعي طلبك', text: 'بعد ما تطلبي، تقدري تتابعي حالة طلبك في أي وقت من هنا.', section: 'links' },
            { page: ['index.html'], mode: 'info', selector: '#sidebar-link-cake-builder', title: 'صممي تورتتك بنفسك', text: 'عايزة تورتة مناسبة بالظبط لمناسبتك؟ من هنا تختاري الحجم والنكهة والشكل بنفسك.', section: 'links' },
            { page: ['index.html'], mode: 'info', selector: '#sidebar-link-flower-builder', title: 'صممي بوكيه الورد بنفسك', text: 'وبالظبط زي التورت، تقدري تصممي بوكيه ورد مخصص بنفسك من هنا.', section: 'links' },
            { page: ['index.html'], mode: 'info', selector: '.sidebar-footer-contacts', title: 'كلمينا مباشرة', text: 'ولو حبيتي تكلمينا في أي وقت، هتلاقي واتساب وتليفون المتجر هنا تحت في القائمة دايمًا.', section: 'footer' },
            { page: ['index.html'], mode: 'click', selector: '#sidebar-close-btn', hint: 'دوسي على علامة الـ✕ اللي فوق يمين القائمة', title: 'قفل القائمة', text: 'تمام، خلصنا من القائمة الجانبية. دوسي هنا تقفليها.', section: 'footer' },
        ],
        homepage: [
            { page: ['index.html'], mode: 'info', selector: '.bose-sticky-header', title: 'أهلاً بيكِ في حلويات بوسي 👋', text: 'هناخدك في جولة سريعة على الصفحة الرئيسية عشان تعرفي كل حاجة موجودة فيها.', section: 'nav' },
            { page: ['index.html'], mode: 'click', selector: '#nav-search-btn', hint: 'دوسي على أيقونة العدسة 🔍 اللي فوق الشاشة', title: 'ابحثي عن أي صنف', text: 'مش عايزة تفتحي المنيو كله؟ دوسي على أيقونة البحث دي.', section: 'nav' },
            { page: ['index.html'], mode: 'info', delayBeforeShow: 250, selector: '#bose-search-field', title: 'اكتبي اللي بتدوري عليه', text: 'اكتبي هنا اسم أي صنف أو نكهة (زي: قشطوطة، لوتس، كب كيك...) وهيطلعلك كل النتائج فورًا من غير ما تدوري في المنيو.', section: 'nav' },
            { page: ['index.html'], mode: 'click', selector: '#search-modal-close', hint: 'دوسي على علامة الـ✕ اللي فوق يمين شاشة البحث', title: 'قفل البحث', text: 'ولما تخلصي بحث، دوسي هنا تقفلي.', section: 'nav' },
            { page: ['index.html'], mode: 'info', selector: '.nav-cart-icon-wrapper[href="/favorites.html"]', title: 'المفضلة', text: 'أي منتج يعجبك تقدري تحفظيه هنا بدوسة قلب واحدة، وترجعيله بعدين بسهولة من غير ما تدوري عليه تاني.', section: 'nav' },
            { page: ['index.html'], mode: 'info', selector: '.nav-cart-icon-wrapper[href="/cart.html"]', title: 'دي سلتك', text: 'هتلاقيها هنا فوق في أي صفحة بالموقع دايمًا، وبتتحدث تلقائي أول ما تضيفي أي منتج.', section: 'nav' },
            { page: ['index.html'], mode: 'info', selector: '#hero-section', title: 'الواجهة الرئيسية', text: 'زرار "اطلب الآن" هنا بيوديكي على المنيو الشامل على طول.', section: 'sections' },
            { page: ['index.html'], mode: 'info', selector: '#categories-slider-section', title: 'تصفحي حسب الفئة', text: 'نفس الفئات اللي في القائمة الجانبية، بس هنا بصور واضحة تقدري تتصفحيها بحرية.', section: 'sections' },
            { page: ['index.html'], mode: 'info', selector: '#offers-carousel-section', title: 'استفيدي من عروضنا', text: 'دي كل العروض والتخفيضات النشطة دلوقتي - لو نفسك تستفيدي بسعر مميز، ابدأي من هنا.', section: 'sections' },
            { page: ['index.html'], mode: 'info', selector: '#most-selling-section', title: 'الأكثر مبيعاً', text: 'كل كارت هنا فيه صورة المنتج وسعره، وزرار زيادة/تقليل الكمية، وزرار إضافة للسلة مباشرة.', section: 'sections' },
            { page: ['index.html'], mode: 'info', selector: '#cake-preview-section', title: 'محاكي التورت', text: 'لو عايزة تصممي تورتة مناسبتك بنفسك، من هنا تدخلي المحاكي - وليها جولة مستقلة لوحدها لو حبيتي.', section: 'sections' },
            { page: ['index.html'], mode: 'info', selector: '#new-arrivals-section', title: 'وصل حديثاً', text: 'وهنا آخر الأصناف الجديدة اللي ضفناها للمنيو.', section: 'sections' },
            { page: ['index.html'], mode: 'info', selector: '#our-products-section', title: 'منتجاتنا كاملة', text: 'وده المنيو الكامل بتاعنا - دوسي "استعرض المزيد" لو عايزة تشوفي كل الأصناف.', section: 'sections' },
            { page: ['index.html'], mode: 'info', selector: '#flower-preview-section', title: 'محاكي الورد', text: 'زي التورت بالظبط، تقدري تصممي بوكيه ورد مخصص بنفسك من هنا - وليها جولة مستقلة لوحدها.', section: 'sections' },
            { page: ['index.html'], mode: 'info', selector: '#app-promo-section', title: 'حمّلي تطبيقنا', text: 'لو عايزة تحملي تطبيقنا هتلاقي فيه نفس المنيو، وكمان إشعارات بعروضنا ونقاط مكافآتك أول بأول.', section: 'sections' },
            { page: ['index.html'], mode: 'info', selector: '#loyalty-teaser-section', title: 'نظام المكافآت', text: 'خصم تلقائي على طلباتك من غير أي كود، وقسيمة شراء حقيقية كل عدد طلبات - اكتبي رقم موبايلك هنا تتابعي رصيدك.', section: 'sections' },
        ],
        product: [
            { page: ['menu.html'], mode: 'click', selector: '.bose-menu-custom-card', hint: 'دوسي على أي كارت فئة زي اللي قدامك دلوقتي', title: 'اختاري فئة', text: 'هناخدك في جولة سريعة على صفحة المنتج من الألف للياء. دوسي على أي فئة زي دي.' },
            { page: ['category.html'], mode: 'click', selector: '.product-card', hint: 'دوسي على أي منتج زي اللي قدامك دلوقتي', title: 'اختاري الصنف', text: 'دوسي على أي منتج زي ده عشان تشوفي تفاصيله وسعره بالكامل.' },
            { page: ['product.html'], mode: 'info', selector: '.master-image-frame', title: 'صفحة المنتج', text: 'هتلاقي هنا صور واضحة للمنتج، وتحت كده وصف تفصيلي للمكونات والطعم عشان تختاري صح.' },
            { page: ['product.html'], mode: 'info', selector: '.product-price-block', title: 'السعر', text: 'وده السعر النهائي واضح قدامك من غير أي مفاجآت.' },
            { page: ['product.html'], mode: 'info', selector: '.qty-picker-capsule', title: 'حددي الكمية', text: 'من هنا تقدري تزوّدي أو تقلّلي الكمية اللي حابة تطلبيها قبل ما تضيفيها لسلتك.' },
            { page: ['product.html'], mode: 'click', selector: '#btn-add-to-cart-master-trigger', hint: 'دوسي على الزرار الوردي المكتوب عليه "أضيفي للسلة" تحت السعر', title: 'ضيفيه لسلتك', text: 'بعد ما تحددي اللي يناسبك، دوسي هنا عشان تضيفي المنتج ده لسلتك.' },
            { page: ['product.html'], mode: 'info', selector: '.nav-cart-icon-wrapper[href="/cart.html"]', title: 'دي سلتك دلوقتي! 🎉', text: 'شوفي، بقى فيها رقم دلوقتي. لما تكوني جاهزة، دوسي عليها عشان تراجعي طلبك - وليها جولة مستقلة لوحدها.' },
        ],
        cart: [
            { page: ['cart.html'], mode: 'info', selector: '#cart-items-wrapper', title: 'راجعي أصنافك', text: 'دي كل الأصناف اللي ضفتيها. تقدري تزوّدي أو تقلّلي الكمية، أو تشيلي أي صنف من زرار الحذف.' },
            { page: ['cart.html'], mode: 'info', selector: '#coupon-input', title: 'كود الخصم', text: 'لو عندك كود خصم، اكتبيه هنا ودوسي "تطبيق".' },
            { page: ['cart.html'], mode: 'info', selector: '#checkout-order-notes-textarea', title: 'ملاحظاتك', text: 'وأي ملاحظة عايزاها تتقال لينا (زي حساسية من مكسرات مثلاً)، اكتبيها هنا.' },
            { page: ['cart.html'], mode: 'click', selector: '#btn-proceed-to-checkout', hint: 'دوسي على الزرار المكتوب عليه "كمّلي طلبك" تحت الفاتورة', title: 'كمّلي طلبك', text: 'لما تراجعي كل حاجة، دوسي هنا عشان تكتبي بياناتك وتحددي التوصيل أو الاستلام.' },
        ],
        checkout: [
            { page: ['checkout.html'], mode: 'info', selector: '#checkout-customer-name', title: 'بياناتك', text: 'هنا بتحطي اسمك بالكامل ورقم موبايلك اللي عليه واتساب (ورقم إضافي اختياري لو حبيتي).' },
            { page: ['checkout.html'], mode: 'info', selector: '.fulfillment-methods-flex', title: 'توصيل ولا استلام؟', text: 'اختاري توصيل للمنزل حسب منطقتك، أو استلام من الفرع من غير أي مصاريف شحن خالص.' },
            { page: ['checkout.html'], mode: 'info', delayBeforeShow: 200, selector: '#shipping-zone-wrapper', title: 'منطقتك وعنوانك', text: 'لو اخترتِ التوصيل، حددي منطقتك السكنية واكتبي عنوانك بالتفصيل، وهيتحسب سعر الشحن تلقائي.' },
            { page: ['checkout.html'], mode: 'info', selector: '#checkout-delivery-date', title: 'ميعاد التسليم', text: 'وهنا تحددي تاريخ وساعة التسليم اللي تناسبك (محتاجين على الأقل 24 ساعة عشان نجهز طلبك طازة).' },
            { page: ['checkout.html'], mode: 'info', selector: '#bose-deposit-payment-box', title: 'طريقة الدفع', text: 'تحويل كاش أو InstaPay على رقم المتجر - عربون 50% بس لو هتستلمي من الفرع، أو المبلغ كامل مقدمًا لو هيتوصّلك.' },
            { page: ['checkout.html'], mode: 'click', selector: '#btn-submit-order-final', hint: 'دوسي على الزرار المكتوب عليه "اطلبي دلوقتي" في آخر الصفحة', title: 'اطلبي دلوقتي', text: 'لما تراجعي كل حاجة، دوسي هنا - هيتفتحلك واتساب فيه فاتورتك جاهزة. متنسيش تدوسي إرسال جوه واتساب نفسه عشان الطلب يوصلنا فعلاً.' },
            { page: ['order-success.html'], mode: 'info', selector: '.order-summary-receipt-box', title: 'فاتورتك', text: 'تمام، ده رقم طلبك وفاتورتك بالتفصيل - احتفظي بيه للمتابعة.' },
            { page: ['order-success.html'], mode: 'info', selector: '#bose-resend-whatsapp-btn', title: 'شبكة أمان', text: 'لو رسالة الواتساب ما اتفتحتش تلقائي، دوسي هنا وابعتيها بنفسك يدوي.' },
            { page: ['order-success.html'], mode: 'info', selector: '#bose-success-track-btn', title: 'تابعي طلبك', text: 'وبعد كده تقدري تتابعي حالة طلبك في أي وقت من هنا.' },
            { page: ['order-success.html'], mode: 'info', selector: '#bose-download-invoice-image-btn', title: 'احتفظي بفاتورتك', text: 'وده تحميل اختياري لصورة فاتورتك تحتفظي بيها عندك كمرجع شخصي.' },
        ],
        cake_simulator: [
            { page: ['cake-builder.html'], mode: 'info', selector: '#bose-cake-intro', title: 'صممي تورتتك خطوة بخطوة', text: 'هناخدك في 11 خطوة بسيطة وسريعة نصمم فيها مع بعض تورتة مناسبتك بالظبط.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#bose-portfolio-lightbox-track', title: 'اتفرجي على تصاميم سابقة', text: 'دي أمثلة لتصاميم نفذناها فعلاً، تقدري تتصفحيها الأول عشان تستوحي منها شكل تورتتك.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-wizard-next', hint: 'دوسي على زرار "التالي" تحت', title: 'يلا نبدأ', text: 'كل ما تخلصي خطوة، هتلاقي زرار "التالي" ده تحت - دوسي عليه دلوقتي عشان نبدأ فعليًا.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#panel-wizard-step-2.active-panel', title: 'مناسبة التورتة', text: 'اكتبي هنا مناسبة التورتة (عيد ميلاد، خطوبة، تخرج...) عشان نراعيها في التصميم - الخطوة دي إجبارية ومش هتقدري تكملي من غيرها.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-wizard-next', hint: 'بعد ما تكتبي المناسبة، دوسي "التالي"', title: 'دوسي التالي', text: 'لما تخلصي كتابة المناسبة، دوسي هنا للمتابعة.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#panel-wizard-step-3.active-panel', title: 'تصميم مرجعي (اختياري)', text: 'لو عندك صورة تورتة عايزة نقرب شكلنا منها، فعّلي الخيار ده وارفعيها. لو مش عايزة، سيبيه واضغطي "التالي".', section: 'design' },
            { page: ['cake-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-wizard-next', hint: 'دوسي "التالي" للمتابعة', title: 'دوسي التالي', text: 'جاهزة؟ دوسي هنا للمتابعة.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#panel-wizard-step-4.active-panel', title: 'عدد الأشخاص', text: 'حددي هنا عدد الأشخاص، والحجم والسعر بيتظبطوا تلقائيًا حسب اختيارك.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-wizard-next', hint: 'دوسي "التالي" بعد ما تحددي العدد', title: 'دوسي التالي', text: 'بعد ما تحددي العدد، دوسي هنا للمتابعة.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#panel-wizard-step-5.active-panel', title: 'شكل التورتة', text: 'اختاري شكل التورتة اللي يناسب مناسبتك (دائري، قلب، مربع، مستطيل...).', section: 'design' },
            { page: ['cake-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-wizard-next', hint: 'دوسي "التالي" بعد الاختيار', title: 'دوسي التالي', text: 'بعد ما تختاري الشكل، دوسي هنا للمتابعة.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#panel-wizard-step-6.active-panel', title: 'النكهة', text: 'دلوقتي اختاري النكهة اللي تحبيها للتورتة.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-wizard-next', hint: 'دوسي "التالي" بعد الاختيار', title: 'دوسي التالي', text: 'بعد ما تختاري النكهة، دوسي هنا للمتابعة.', section: 'design' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#panel-wizard-step-7.active-panel', title: 'طباعة صورة (اختياري)', text: 'تقدري تطبعي صورة حقيقية على التورتة من هنا لو حابة.', section: 'extras' },
            { page: ['cake-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-wizard-next', hint: 'دوسي "التالي" للمتابعة', title: 'دوسي التالي', text: 'جاهزة؟ دوسي هنا للمتابعة.', section: 'extras' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#panel-wizard-step-8.active-panel', title: 'رسالة على التورتة', text: 'اكتبي هنا أي رسالة حابة تتكتب على التورتة (زي: عيد ميلاد سعيد يا حبيبتي).', section: 'extras' },
            { page: ['cake-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-wizard-next', hint: 'دوسي "التالي" بعد ما تكتبي', title: 'دوسي التالي', text: 'بعد ما تكتبي الرسالة (أو تسيبيها فاضية)، دوسي هنا للمتابعة.', section: 'extras' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#panel-wizard-step-9.active-panel', title: 'حساسية من مكونات؟', text: 'عرّفينا هنا لو بتعاني من حساسية تجاه أي مكونات زي المكسرات، عشان نراعي ده في المعمل.', section: 'extras' },
            { page: ['cake-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-wizard-next', hint: 'دوسي "التالي" للمتابعة', title: 'دوسي التالي', text: 'جاهزة؟ دوسي هنا للمتابعة.', section: 'extras' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#panel-wizard-step-10.active-panel', title: 'كارت إهداء (اختياري)', text: 'حابة تضيفي كارت إهداء يتقدم مع التورتة؟ فعّلي الخيار ده لو حابة.', section: 'extras' },
            { page: ['cake-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-wizard-next', hint: 'دوسي "التالي" للمتابعة', title: 'دوسي التالي', text: 'جاهزة؟ دوسي هنا للمتابعة.', section: 'extras' },
            { page: ['cake-builder.html'], mode: 'info', selector: '#panel-wizard-step-11.active-panel', title: 'راجعي طلبك', text: 'دي كل تفاصيل تورتتك والسعر النهائي مجمّعة قدامك - راجعيهم كويس قبل ما تضيفيها لسلتك.', section: 'review' },
            { page: ['cake-builder.html'], mode: 'click', selector: '#btn-cake-submit-cart-summary', hint: 'دوسي على الزرار الوردي تحت عشان تضيفيها لسلتك', title: 'أضيفيها لسلتك', text: 'لما تخلصي المراجعة، دوسي هنا عشان تضيفيها لسلتك.', section: 'review' },
        ],
        flower_simulator: [
            { page: ['flower-builder.html'], mode: 'info', selector: '#bose-flower-intro', title: 'صممي بوكيهك خطوة بخطوة', text: 'هناخدك خطوة بخطوة نصمم مع بعض بوكيه الورد اللي يناسب مناسبتك بالظبط.', section: 'design' },
            { page: ['flower-builder.html'], mode: 'info', selector: '#bose-flower-portfolio-lightbox-track', title: 'اتفرجي على تصاميم سابقة', text: 'دي أمثلة لبوكيهات نفذناها فعلاً، تقدري تتصفحيها الأول عشان تستوحي منها.', section: 'design' },
            { page: ['flower-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-next', hint: 'دوسي على زرار "التالي" تحت', title: 'يلا نبدأ', text: 'كل ما تخلصي خطوة، هتلاقي زرار "التالي" ده تحت - دوسي عليه دلوقتي عشان نبدأ فعليًا.', section: 'design' },
            { page: ['flower-builder.html'], mode: 'info', selector: '#panel-wizard-step-2.active-panel', title: 'نوع البوكيه', text: 'اختاري هنا نوع الورد اللي حابة بوكيهك يكون بيه.', section: 'design' },
            { page: ['flower-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-next', hint: 'دوسي "التالي" بعد الاختيار', title: 'دوسي التالي', text: 'بعد ما تختاري نوع الورد، دوسي هنا للمتابعة.', section: 'design' },
            { page: ['flower-builder.html'], mode: 'info', selector: '#panel-wizard-step-3.active-panel', title: 'عدد الورد', text: 'حددي هنا عدد الورد اللي حابة بوكيهك يكون بيه، والسعر بيتظبط تلقائيًا.', section: 'design' },
            { page: ['flower-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-next', hint: 'دوسي "التالي" بعد ما تحددي العدد', title: 'دوسي التالي', text: 'بعد ما تحددي العدد، دوسي هنا للمتابعة.', section: 'design' },
            { page: ['flower-builder.html'], mode: 'info', selector: '#panel-wizard-step-4.active-panel', title: 'صورة تصميم مرجعية (اختياري)', text: 'لو عندك صورة بوكيه عايزة نقرب شكلنا منها، ارفعيها هنا. لو مش عايزة، دوسي "التالي" على طول.', section: 'design' },
            { page: ['flower-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-next', hint: 'دوسي "التالي" للمتابعة', title: 'دوسي التالي', text: 'جاهزة؟ دوسي هنا للمتابعة.', section: 'design' },
            { page: ['flower-builder.html'], mode: 'info', selector: '#panel-wizard-step-5.active-panel', title: 'شريط مطبوع عليه كلام (اختياري)', text: 'حابة نضيف شريط ستان مطبوع عليه كلام حلو مع البوكيه؟ فعّلي الخيار ده لو حابة.', section: 'addons' },
            { page: ['flower-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-next', hint: 'دوسي "التالي" للمتابعة', title: 'دوسي التالي', text: 'جاهزة؟ دوسي هنا للمتابعة.', section: 'addons' },
            { page: ['flower-builder.html'], mode: 'info', selector: '#panel-wizard-step-6.active-panel', title: 'صور شخصية جوه البوكيه (اختياري)', text: 'تقدري تضيفي صور شخصية مطبوعة توضع جوه البوكيه نفسه من هنا.', section: 'addons' },
            { page: ['flower-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-next', hint: 'دوسي "التالي" للمتابعة', title: 'دوسي التالي', text: 'جاهزة؟ دوسي هنا للمتابعة.', section: 'addons' },
            { page: ['flower-builder.html'], mode: 'info', selector: '#panel-wizard-step-7.active-panel', title: 'كاش نظيف جوه البوكيه (اختياري)', text: 'تقدري تضيفي مبلغ كاش نظيف يتوضع جوه البوكيه كهدية إضافية.', section: 'addons' },
            { page: ['flower-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-next', hint: 'دوسي "التالي" للمتابعة', title: 'دوسي التالي', text: 'جاهزة؟ دوسي هنا للمتابعة.', section: 'addons' },
            { page: ['flower-builder.html'], mode: 'info', selector: '#panel-wizard-step-8.active-panel', title: 'شوكولاتة فاخرة (اختياري)', text: 'وتقدري كمان تضيفي شوكولاتة فاخرة مستوردة جوه البوكيه.', section: 'addons' },
            { page: ['flower-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-next', hint: 'دوسي "التالي" للمتابعة', title: 'دوسي التالي', text: 'جاهزة؟ دوسي هنا للمتابعة.', section: 'addons' },
            { page: ['flower-builder.html'], mode: 'info', selector: '#panel-wizard-step-9.active-panel', title: 'كارت إهداء (اختياري)', text: 'حابة تضيفي كارت إهداء يتقدم مع البوكيه؟ فعّلي الخيار ده لو حابة.', section: 'addons' },
            { page: ['flower-builder.html'], mode: 'click', verifyPanelChange: true, selector: '#btn-next', hint: 'دوسي "التالي" للمتابعة', title: 'دوسي التالي', text: 'جاهزة؟ دوسي هنا للمتابعة.', section: 'addons' },
            { page: ['flower-builder.html'], mode: 'info', selector: '#panel-wizard-step-10.active-panel', title: 'راجعي بوكيهك', text: 'دي كل تفاصيل بوكيهك والسعر النهائي مجمّعة قدامك - راجعيهم كويس قبل ما تضيفيه لسلتك.', section: 'review' },
            { page: ['flower-builder.html'], mode: 'click', selector: '#add-to-cart-btn', hint: 'دوسي على الزرار الوردي تحت عشان تضيفيه لسلتك', title: 'أضيفيه لسلتك', text: 'لما تخلصي المراجعة، دوسي هنا عشان تضيفيه لسلتك.', section: 'review' },
        ],
        rewards: [
            { page: ['rewards.html'], mode: 'info', selector: '.rw-hero', title: 'نادي مكافآت بوسي 👑', text: 'مرحبًا بيكِ في نادي مكافآت بوسي - هنوريكي بسرعة إزاي تكسبي خصومات وقسيمة شراء حقيقية على طلباتك.' },
            { page: ['rewards.html'], mode: 'info', selector: '#rw-explainer-cards', title: 'خصومات تلقائية حسب ترتيب طلبك', text: 'كل ما تطلبي أكتر، كل ما تكسبي أكتر - الأرقام دي بتوضحلك نسبة الخصم اللي هتاخديها تلقائيًا حسب ترتيب طلبك، وكمان قسيمة شراء حقيقية بعد عدد معيّن من الطلبات.' },
            { page: ['rewards.html'], mode: 'info', selector: '.rw-form-card', title: 'اعرفي رصيدك دلوقتي', text: 'اكتبي رقم الهاتف اللي بتطلبي بيه عادةً هنا ودوسي "اعرضي رصيدي"، وهتشوفي فورًا كام طلب باقيلك عشان تكسبي الخصم الجاي، وأي قسايم شراء نشطة عندك.' },
            { page: ['rewards.html'], mode: 'info', selector: '.rw-howto', title: 'إزاي يشتغل النظام بالتفصيل', text: 'وهنا شرح كامل لكل تفاصيل نظام المكافآت - من دورة الخصم لحد قسيمة الـ300 جنيه وإزاي تستخدميها وقت الدفع.' },
        ],
        track_order: [
            { page: ['track-order.html'], mode: 'info', selector: '.track-page-header', title: 'تتبعي طلبك', text: 'من هنا تقدري تعرفي حالة طلبك أول بأول من غير ما تحتاجي تكلمينا.' },
            { page: ['track-order.html'], mode: 'info', selector: '#track-order-number', title: 'رقم الطلب', text: 'هتلاقيه في فاتورة الواتساب اللي وصلتك وقت ما طلبتي، أو في صفحة "تم الطلب" لو محفوظة عندك.' },
            { page: ['track-order.html'], mode: 'info', selector: '#track-order-phone', title: 'رقم الهاتف', text: 'نفس رقم الهاتف اللي استخدمتيه وانتي بتطلبي.' },
            { page: ['track-order.html'], mode: 'info', selector: '#track-submit-btn', title: 'اعرضي حالة الطلب', text: 'دوسي هنا وهتشوفي فورًا حالة طلبك دلوقتي (بتحضير، جاهز، في الطريق، أو اتسلم) مع كل تفاصيله.' },
        ],
    };

    /* ============================= تحميل الخطوات (قاعدة البيانات + كاش الجلسة) ============================= */

    let RESOLVED_TOURS = null; // { tourKey: [step, step, ...], ... }

    function readStepsSessionCache() {
        try {
            const raw = sessionStorage.getItem(STEPS_SESSION_CACHE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }
    function writeStepsSessionCache(tours) {
        try { sessionStorage.setItem(STEPS_SESSION_CACHE_KEY, JSON.stringify(tours)); } catch (e) { /* لا شيء */ }
    }

    // 🔄 [تحميل مرن لكل جولة على حدة]: بيجيب كل خطوات كل الجولات مرة واحدة
    // من الجدول، ويجمّعهم حسب tour_key. أي جولة نتيجتها فاضية (أو
    // القاعدة كلها مش متاحة) بتاخد نسختها الاحتياطية الخاصة بيها بس -
    // مش كل الجولات مع بعض - عشان مشكلة في جولة واحدة ماتأثرش على الباقي.
    async function ensureStepsLoaded() {
        if (RESOLVED_TOURS) return RESOLVED_TOURS;
        const cached = readStepsSessionCache();
        if (cached) { RESOLVED_TOURS = cached; return RESOLVED_TOURS; }

        let flatFromDb = null;
        try {
            if (window.BoseSupabase && typeof window.BoseSupabase.fetchBoseTourSteps === 'function') {
                flatFromDb = await window.BoseSupabase.fetchBoseTourSteps();
            }
        } catch (e) { flatFromDb = null; }

        const grouped = {};
        if (flatFromDb && flatFromDb.length) {
            flatFromDb.forEach((step) => {
                const key = step.tourKey;
                if (!key) return;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(step);
            });
        }
        Object.keys(BOSE_TOUR_STEPS_FALLBACK).forEach((key) => {
            if (!grouped[key] || !grouped[key].length) grouped[key] = BOSE_TOUR_STEPS_FALLBACK[key];
        });

        RESOLVED_TOURS = grouped;
        writeStepsSessionCache(RESOLVED_TOURS);
        return RESOLVED_TOURS;
    }

    /* ============================= جلسة الجولة + التحليلات ============================= */

    function makeSessionId() {
        try { if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID(); } catch (e) { /* تراجع تحت */ }
        return 'bose-tour-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    }

    function logTourEvent(eventType, tourKey, opts) {
        opts = opts || {};
        try {
            if (window.BoseSupabase && typeof window.BoseSupabase.logBoseTourEvent === 'function') {
                window.BoseSupabase.logBoseTourEvent({
                    sessionId: opts.sessionId || (getState() && getState().sessionId) || null,
                    eventType,
                    tourKey: tourKey || (getState() && getState().tourKey) || null,
                    stepOrder: typeof opts.stepIndex === 'number' ? opts.stepIndex + 1 : null,
                    stepSelector: opts.selector || null,
                    stepTitle: opts.title || null,
                    pageFile: currentPageFile(),
                });
            }
        } catch (e) { /* تجاهل عمدي */ }
    }

    function logTourEventOnExit(eventType, tourKey, opts) {
        opts = opts || {};
        try {
            if (window.BoseSupabase && typeof window.BoseSupabase.logBoseTourEventOnExit === 'function') {
                window.BoseSupabase.logBoseTourEventOnExit({
                    sessionId: opts.sessionId || (getState() && getState().sessionId) || null,
                    eventType,
                    tourKey: tourKey || (getState() && getState().tourKey) || null,
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
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* localStorage غير متاح */ }
        updateFabVisibility();
    }
    function clearState() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* لا شيء */ }
        updateFabVisibility();
    }

    function currentPageFile() {
        const parts = window.location.pathname.split('/');
        return parts[parts.length - 1] || 'index.html';
    }

    let activeOverlayEls = null;
    let activeClickHandler = null;
    let waitTimer = null;
    let verifyPanelTimer = null;
    let activeTargetEl = null;
    let activeRepositionRAF = null;
    let repositionTimer = null;
    let activeScrollHandler = null;

    // 🚪 [تتبع الترك الحقيقي]
    let currentStepInfo = null; // { tourKey, stepIndex, selector, title }
    let currentStepAdvanced = false;

    function handlePageHide() {
        if (currentStepInfo && !currentStepAdvanced) {
            const state = getState();
            if (state && state.active) {
                logTourEventOnExit('tour_abandon', currentStepInfo.tourKey, {
                    sessionId: state.sessionId,
                    stepIndex: currentStepInfo.stepIndex,
                    selector: currentStepInfo.selector,
                    title: currentStepInfo.title,
                });
            }
        }
    }
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') handlePageHide(); });

    function removeOverlay() {
        if (activeOverlayEls) { activeOverlayEls.forEach(el => el.remove()); activeOverlayEls = null; }
        if (activeClickHandler) { document.removeEventListener('click', activeClickHandler, true); activeClickHandler = null; }
        if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
        if (verifyPanelTimer) { clearTimeout(verifyPanelTimer); verifyPanelTimer = null; }
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
        if (celebrate) showToast('تمام! 🎉 كده بقيتي عارفة تستخدمي الجزء ده من موقعنا بكل سهولة.');
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
            /* 🛡️🆕 [إصلاح - رقم الجولة بيتقلب بصرياً "16/15" بدل "15/16"]: النص ده
               رقمين إنجليزي (مش عربي) جوه فقرة اتجاهها RTL بالكامل - كل رقم لوحده
               "LTR run" سليم جوّه نفسه، لكن المتصفح بيرتّب مواضع الـ"runs" الاتنين
               (قبل الشرطة/بعدها) حسب اتجاه الفقرة العام (RTL)، فبيقلب مكانهم
               بصرياً حتى إن كل رقم لوحده صحيح. direction:ltr + unicode-bidi:isolate
               بيجبروا النص ده يتصرف كـ"جزيرة" LTR مستقلة عن اتجاه الفقرة اللي حواليه.*/
            .bose-tour-progress-text{font-size:.68rem;color:#FF91A4;font-weight:700;white-space:nowrap;direction:ltr;unicode-bidi:isolate;display:inline-block;}
            .bose-tour-tooltip-title{font-weight:800;font-size:1rem;color:#111;margin-bottom:6px;}
            .bose-tour-tooltip-text{font-size:.88rem;color:#333;line-height:1.6;margin:0 0 12px 0;}
            .bose-tour-tap-hint{display:flex;align-items:center;gap:5px;font-size:.78rem;color:#FF91A4;font-weight:700;margin-bottom:12px;}
            .bose-tour-next-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;background:#FF91A4;color:#fff;border:none;border-radius:12px;padding:10px 14px;font-family:'Cairo',sans-serif;font-size:.88rem;font-weight:800;cursor:pointer;margin-bottom:10px;transition:filter .15s ease;}
            .bose-tour-next-btn:hover{filter:brightness(0.95);}
            .bose-tour-bottom-row{display:flex;align-items:center;justify-content:space-between;gap:8px;}
            .bose-tour-prev-btn{display:flex;align-items:center;gap:4px;background:none;border:none;color:#888;font-size:.76rem;font-weight:700;cursor:pointer;padding:0;font-family:'Cairo',sans-serif;}
            .bose-tour-skipsection-btn{background:none;border:none;color:#FF91A4;font-size:.76rem;font-weight:700;cursor:pointer;padding:0;font-family:'Cairo',sans-serif;}
            .bose-tour-skip-btn{background:none;border:none;color:#999;font-size:.76rem;cursor:pointer;text-decoration:underline;padding:0;font-family:'Cairo',sans-serif;}
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

            /* 🆕 [زرار المساعدة العائم + قايمة اختيار الجولة] - شكل تاب عمودي
               ملتصق بحافة الشاشة (زي المرجع اللي بعتته العميلة)، مش بار أفقي. */
            #bose-tour-fab-wrap{position:fixed;top:42%;right:0;z-index:99996;direction:rtl;font-family:'Cairo',sans-serif;}
            #bose-tour-fab-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#FF91A4;color:#111;border:none;border-radius:14px 0 0 14px;width:40px;padding:16px 8px;box-shadow:-2px 3px 14px rgba(0,0,0,.2);font-family:'Cairo',sans-serif;cursor:pointer;}
            #bose-tour-fab-btn i{font-size:1rem;}
            #bose-tour-fab-btn span{writing-mode:vertical-rl;text-orientation:sideways;white-space:nowrap;font-weight:800;font-size:.82rem;letter-spacing:.3px;}
            /* 🛡️🆕 [إصلاح - أيقونات الجولة بتتقطع تحت ومفيش سكرول]: اللوحة دي
               كانت من غير max-height ولا overflow، فلما بقى فيها 9 جولات
               (5 صفوف) على شاشات قصيرة، الجزء اللي بيعدي حافة الشاشة كان
               بيتقطع بصرياً - ومحدش ينفع يسكرول الصفحة العادية يوريه، لأن
               اللوحة نفسها position:fixed وسكرول الصفحة مالوش علاقة بيها.
               دلوقتي عندها سقف ارتفاع مرتبط بمساحة الشاشة الفعلية + سكرول
               داخلي خاص بيها، فأي صفوف زيادة تتلف براحة جوه اللوحة نفسها. */
            #bose-tour-fab-panel{position:fixed;top:42%;right:56px;transform:translateY(-10px);background:#fff;border-radius:18px;box-shadow:0 10px 34px rgba(0,0,0,.24);padding:14px;width:236px;max-height:54vh;max-height:54dvh;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;}
            #bose-tour-fab-panel.bose-tour-fab-panel-open{opacity:1;pointer-events:auto;transform:translateY(0);}
            .bose-tour-fab-panel-title{font-weight:800;font-size:.86rem;color:#111;margin-bottom:10px;text-align:right;}
            .bose-tour-fab-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
            .bose-tour-fab-tile{display:flex;flex-direction:column;align-items:center;gap:6px;background:#fff5f7;border:none;border-radius:14px;padding:12px 6px;cursor:pointer;font-family:'Cairo',sans-serif;transition:background .15s ease;}
            .bose-tour-fab-tile:hover{background:#ffe4ea;}
            .bose-tour-fab-tile-icon{width:34px;height:34px;border-radius:50%;background:#FF91A4;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.95rem;}
            .bose-tour-fab-tile-label{font-size:.72rem;font-weight:700;color:#333;text-align:center;line-height:1.3;}
            #bose-tour-fab-btn.bose-tour-fab-btn-pulse{animation:boseTourFabPulse 1.1s ease-in-out 3;}
            @keyframes boseTourFabPulse{0%,100%{box-shadow:-2px 3px 14px rgba(0,0,0,.2);}50%{box-shadow:-2px 3px 14px rgba(0,0,0,.2),0 0 0 8px rgba(255,145,164,.45);}}
            .bose-tour-fab-note{position:fixed;top:42%;right:56px;transform:translateY(-10px) translateX(8px);background:#111;color:#fff;padding:10px 16px;border-radius:12px;font-family:'Cairo',sans-serif;font-size:.82rem;font-weight:700;z-index:99996;direction:rtl;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.3);opacity:0;transition:opacity .3s ease,transform .3s ease;}
            .bose-tour-fab-note.bose-tour-fab-note-show{opacity:1;transform:translateY(-10px) translateX(0);}
            .bose-tour-fab-note i{color:#FF91A4;margin-left:4px;}
            @media (max-width:480px){
                #bose-tour-fab-btn{width:34px;padding:12px 6px;}
                #bose-tour-fab-btn span{font-size:.74rem;}
                #bose-tour-fab-panel{width:200px;right:48px;}
                .bose-tour-fab-note{right:48px;white-space:normal;max-width:170px;}
            }
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

    /* ============================= المنطق الأساسي لعرض/تحريك الجولة ============================= */

    function getStartIndexForTour(steps) {
        const page = currentPageFile();
        for (let i = 0; i < steps.length; i++) {
            if (steps[i].anyPage || (steps[i].page && steps[i].page.indexOf(page) !== -1)) return i;
        }
        return 0;
    }

    // 🔀 [تخطي قسم]: بيدور على أول خطوة قدام عندها section مختلف عن
    // section الخطوة الحالية. لو مفيش، يبقى إحنا أصلاً في آخر قسم -
    // الزرار بيتخفي في الحالة دي أصلاً (شوفي renderSpotlight تحت).
    function findNextSectionIndex(steps, fromIndex) {
        const currentSection = steps[fromIndex] && steps[fromIndex].section;
        if (!currentSection) return -1;
        for (let i = fromIndex + 1; i < steps.length; i++) {
            if (steps[i].section && steps[i].section !== currentSection) return i;
        }
        return -1;
    }

    function positionAndShowStep(tourKey, stepIndex) {
        removeOverlay();
        // 🛡️🆕 [إصلاح - تكدس نافذة "حمّلي تطبيقنا" فوق الجولة]: لو نافذة تحميل
        // التطبيق (core-engine.js → setupAppInstallPopup) كانت ظاهرة بالفعل
        // (مثلاً العميلة بدأت الجولة يدوياً من زرار المساعدة العائم وهي
        // النافذة لسه فاتحة قدامها)، نقفلها فوراً قبل ما نعرض خطوة الجولة -
        // نفس منطق منع التصادم لكن في الاتجاه العكسي (الجولة أولوية أعلى
        // لإن العميلة طلبتها بنفسها بضغطة فعلية).
        const openAppInstallPopup = document.getElementById('bose-app-install-popup-overlay');
        if (openAppInstallPopup) openAppInstallPopup.remove();
        const steps = RESOLVED_TOURS[tourKey];
        const step = steps && steps[stepIndex];
        if (!step) { endTour(true); return; }
        const proceed = () => waitForElement(
            step.selector,
            el => renderSpotlight(el, step, tourKey, stepIndex),
            () => {
                logTourEvent('tour_auto_skip', tourKey, { stepIndex, selector: step.selector, title: step.title });
                showToast('معلش، خطوة في الجولة اتخطّت تلقائيًا 🙏');
                handleAdvance(tourKey, stepIndex, stepIndex + 1);
            },
            step.timeoutMs
        );
        if (step.delayBeforeShow) setTimeout(proceed, step.delayBeforeShow); else proceed();
    }

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

    function renderSpotlight(el, step, tourKey, stepIndex) {
        injectStylesOnce();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        waitForStableRect(el, () => {
            if (!document.body.contains(el)) { handleAdvance(tourKey, stepIndex, stepIndex + 1); return; }
            const rect = el.getBoundingClientRect();
            const pad = 8;
            const box = document.createElement('div');
            box.className = 'bose-tour-highlight-box';
            box.style.top = (rect.top - pad) + 'px';
            box.style.left = (rect.left - pad) + 'px';
            box.style.width = (rect.width + pad * 2) + 'px';
            box.style.height = (rect.height + pad * 2) + 'px';
            document.body.appendChild(box);

            const steps = RESOLVED_TOURS[tourKey];
            const total = steps.length;
            const isInfo = step.mode === 'info';
            const isLast = stepIndex === total - 1;
            const percent = Math.round(((stepIndex + 1) / total) * 100);
            const hintText = step.hint || 'دوسي على العنصر المضيء بالإطار الوردي';

            const state = getState();
            const canGoBack = !!(state && state.history && state.history.length);
            const nextSectionIndex = findNextSectionIndex(steps, stepIndex);
            const canSkipSection = nextSectionIndex !== -1;

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
                    ${canGoBack ? `<button type="button" class="bose-tour-prev-btn" data-bose-tour-prev="1"><i class="fa-solid fa-arrow-right"></i> السابق</button>` : `<span></span>`}
                    ${canSkipSection ? `<button type="button" class="bose-tour-skipsection-btn" data-bose-tour-skipsection="1">تخطي القسم</button>` : `<span></span>`}
                    <button type="button" class="bose-tour-skip-btn" data-bose-tour-skip="1">إنهاء الجولة</button>
                </div>
            `;
            document.body.appendChild(tooltip);

            activeOverlayEls = [box, tooltip];
            activeTargetEl = el;
            updateOverlayPosition();
            updateFabVisibility();

            currentStepInfo = { tourKey, stepIndex, selector: step.selector, title: step.title };
            currentStepAdvanced = false;
            logTourEvent('step_view', tourKey, { stepIndex, selector: step.selector, title: step.title });

            activeRepositionRAF = () => { updateOverlayPosition(); repositionTimer = requestAnimationFrame(activeRepositionRAF); };
            repositionTimer = requestAnimationFrame(activeRepositionRAF);
            activeScrollHandler = () => updateOverlayPosition();
            window.addEventListener('scroll', activeScrollHandler, true);
            window.addEventListener('resize', activeScrollHandler, true);

            tooltip.querySelector('[data-bose-tour-skip]').addEventListener('click', () => {
                currentStepAdvanced = true;
                logTourEvent('tour_skip', tourKey, { stepIndex, selector: step.selector, title: step.title });
                endTour(false);
            });

            const prevBtn = tooltip.querySelector('[data-bose-tour-prev]');
            if (prevBtn) prevBtn.addEventListener('click', () => handlePrevious(tourKey, stepIndex));

            const skipSectionBtn = tooltip.querySelector('[data-bose-tour-skipsection]');
            if (skipSectionBtn) skipSectionBtn.addEventListener('click', () => handleSkipSection(tourKey, stepIndex, nextSectionIndex));

            if (isInfo) {
                const nextBtn = tooltip.querySelector('[data-bose-tour-next]');
                if (nextBtn) nextBtn.addEventListener('click', () => handleAdvance(tourKey, stepIndex, stepIndex + 1));
            } else {
                activeClickHandler = function (e) {
                    if (e.target.closest('[data-bose-tour-skip]') || e.target.closest('[data-bose-tour-prev]') || e.target.closest('[data-bose-tour-skipsection]')) return;
                    if (!e.target.closest(step.selector)) return;

                    // 🛡️ [تحقق فعلي قبل ما الجولة تتحرك]: زرارات زي "التالي" في
                    // محاكي التورت/الورد ممكن يمنعها validation في الموقع نفسه
                    // (زي خانة "المناسبة" الإجبارية) - يعني الكليك حصل، بس
                    // العميلة فعليًا لسه واقفة في نفس خطوة المحاكي. لو الخطوة
                    // عندها verifyPanelChange، منستنيش نتقدم في الجولة إلا لما
                    // نتأكد إن لوحة (panel) تانية بقت فعلاً هي الظاهرة - وده
                    // بيمنع أشهر مشكلة إن الجولة "تفترض" الانتقال حصل وهو ما حصلش.
                    if (step.verifyPanelChange) {
                        const beforePanel = document.querySelector('.active-panel[id^="panel-wizard-step-"]');
                        const beforeId = beforePanel ? beforePanel.id : null;
                        verifyPanelTimer = setTimeout(() => {
                            verifyPanelTimer = null;
                            const afterPanel = document.querySelector('.active-panel[id^="panel-wizard-step-"]');
                            const afterId = afterPanel ? afterPanel.id : null;
                            if (afterId && afterId !== beforeId) {
                                handleAdvance(tourKey, stepIndex, stepIndex + 1);
                            }
                            // لو ما اتغيرش شيء، يبقى في الأغلب فيه تحقق (validation)
                            // في الصفحة نفسها منع الانتقال (وهي غالبًا بتوضح السبب
                            // برسالة/توست من عندها) - سيبي العميلة في نفس خطوة
                            // الجولة الحالية من غير أي تغيير، وهتقدر تدوس "التالي"
                            // تاني بعد ما تكمل المطلوب.
                        }, 350);
                        return;
                    }

                    handleAdvance(tourKey, stepIndex, stepIndex + 1);
                };
                document.addEventListener('click', activeClickHandler, true);
            }
        }, step.mode === 'info' ? 900 : 1500);
    }

    function handleAdvance(tourKey, fromIndex, toIndex) {
        const steps = RESOLVED_TOURS[tourKey];
        const fromStep = steps[fromIndex];
        currentStepAdvanced = true;
        if (fromStep) logTourEvent('step_advance', tourKey, { stepIndex: fromIndex, selector: fromStep.selector, title: fromStep.title });

        removeOverlay();
        if (toIndex >= steps.length) {
            logTourEvent('tour_finish', tourKey, { stepIndex: fromIndex });
            endTour(true);
            return;
        }
        const state = getState();
        const history = (state && state.history) ? state.history.concat([fromIndex]) : [fromIndex];
        setState({ active: true, tourKey, stepIndex: toIndex, history, sessionId: state ? state.sessionId : makeSessionId() });
        const nextStep = steps[toIndex];
        const page = currentPageFile();
        const staysOnPage = nextStep.anyPage || (nextStep.page && nextStep.page.indexOf(page) !== -1);
        if (staysOnPage) { positionAndShowStep(tourKey, toIndex); return; }
        if (fromStep && fromStep.mode === 'info' && nextStep.page && nextStep.page[0]) {
            window.location.href = '/' + nextStep.page[0];
        }
        // غير كده: لينك حقيقي (زي كارت الفئة/المنتج) هيتنقل بيه المتصفح
        // لوحده، وinit() هيكمّل الجولة تلقائيًا في الصفحة الجديدة.
    }

    // 🆕 [السابق]: بترجع لآخر خطوة في تاريخ الجولة الحالية، حتى لو كانت
    // في صفحة تانية - بعكس التقدّم للأمام، هنا إحنا اللي بنتنقل بأنفسنا
    // (مفيش لينك حقيقي نستنى العميلة تدوس عليه بالعكس).
    function handlePrevious(tourKey, fromIndex) {
        const state = getState();
        if (!state || !state.history || !state.history.length) return;
        const newHistory = state.history.slice(0, -1);
        const prevIndex = state.history[state.history.length - 1];
        const steps = RESOLVED_TOURS[tourKey];
        const fromStep = steps[fromIndex];
        if (fromStep) logTourEvent('step_back', tourKey, { stepIndex: fromIndex, selector: fromStep.selector, title: fromStep.title });

        removeOverlay();
        currentStepAdvanced = true;
        setState({ active: true, tourKey, stepIndex: prevIndex, history: newHistory, sessionId: state.sessionId });
        const prevStep = steps[prevIndex];
        const page = currentPageFile();
        const staysOnPage = prevStep.anyPage || (prevStep.page && prevStep.page.indexOf(page) !== -1);
        if (staysOnPage) { positionAndShowStep(tourKey, prevIndex); return; }
        if (prevStep.page && prevStep.page[0]) window.location.href = '/' + prevStep.page[0];
    }

    // 🆕 [تخطي القسم]: بتقفز مباشرة لأول خطوة في القسم الفرعي التالي،
    // من غير ما تخرج من الجولة خالص.
    function handleSkipSection(tourKey, fromIndex, targetIndex) {
        if (targetIndex == null || targetIndex === -1) return;
        const steps = RESOLVED_TOURS[tourKey];
        const fromStep = steps[fromIndex];
        currentStepAdvanced = true;
        logTourEvent('section_skip', tourKey, { stepIndex: fromIndex, selector: fromStep.selector, title: fromStep.title });

        removeOverlay();
        const state = getState();
        const history = (state && state.history) ? state.history.concat([fromIndex]) : [fromIndex];
        setState({ active: true, tourKey, stepIndex: targetIndex, history, sessionId: state ? state.sessionId : makeSessionId() });
        const targetStep = steps[targetIndex];
        const page = currentPageFile();
        const staysOnPage = targetStep.anyPage || (targetStep.page && targetStep.page.indexOf(page) !== -1);
        if (staysOnPage) { positionAndShowStep(tourKey, targetIndex); return; }
        if (targetStep.page && targetStep.page[0]) window.location.href = '/' + targetStep.page[0];
    }

    async function startTour(tourKey) {
        closeFabPanel();
        const tours = await ensureStepsLoaded();
        const steps = tours[tourKey];
        if (!steps || !steps.length) return;
        const sessionId = makeSessionId();
        const startIndex = getStartIndexForTour(steps);
        setState({ active: true, tourKey, stepIndex: startIndex, history: [], sessionId });
        logTourEvent('tour_start', tourKey, { stepIndex: startIndex, sessionId });
        const startStep = steps[startIndex];
        const targetPage = startStep.anyPage ? currentPageFile() : (startStep.page && startStep.page[0]);
        if (!targetPage || currentPageFile() === targetPage) { init(); } else { window.location.href = '/' + targetPage; }
    }

    async function init() {
        const state = getState();
        if (!state || !state.active || !state.tourKey) return;
        const tours = await ensureStepsLoaded();
        const steps = tours[state.tourKey];
        if (!steps) { clearState(); return; }
        const step = steps[state.stepIndex];
        if (!step) { clearState(); return; }
        const page = currentPageFile();
        const pageMatches = step.anyPage || (step.page && step.page.indexOf(page) !== -1);
        if (!pageMatches) return; // العميلة يمكن غيّرت الصفحة يدوي بره مسار الجولة
        positionAndShowStep(state.tourKey, state.stepIndex);
    }

    /* ============================= زرار المساعدة العائم + قايمة اختيار الجولة ============================= */

    function updateFabVisibility() {
        const fab = document.getElementById('bose-tour-fab-wrap');
        if (!fab) return;
        const state = getState();
        fab.style.display = (state && state.active) ? 'none' : '';
    }

    function closeFabPanel() {
        const panel = document.getElementById('bose-tour-fab-panel');
        const btn = document.getElementById('bose-tour-fab-btn');
        if (panel) panel.classList.remove('bose-tour-fab-panel-open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function openFabPanel() {
        const panel = document.getElementById('bose-tour-fab-panel');
        const btn = document.getElementById('bose-tour-fab-btn');
        if (panel) panel.classList.add('bose-tour-fab-panel-open');
        if (btn) btn.setAttribute('aria-expanded', 'true');
    }

    function injectFabOnce() {
        if (document.getElementById('bose-tour-fab-wrap')) return;
        injectStylesOnce();

        const wrap = document.createElement('div');
        wrap.id = 'bose-tour-fab-wrap';
        wrap.innerHTML = `
            <button type="button" id="bose-tour-fab-btn" aria-haspopup="true" aria-expanded="false">
                <i class="fa-solid fa-compass"></i> <span>الجولة</span>
            </button>
            <div id="bose-tour-fab-panel">
                <div class="bose-tour-fab-panel-title">اختاري جولة تبدئيها 👇</div>
                <div class="bose-tour-fab-grid">
                    ${TOUR_DEFS.map(t => `
                        <button type="button" class="bose-tour-fab-tile" data-tour-key="${t.key}">
                            <span class="bose-tour-fab-tile-icon"><i class="fa-solid ${t.icon}"></i></span>
                            <span class="bose-tour-fab-tile-label">${t.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(wrap);

        const btn = document.getElementById('bose-tour-fab-btn');
        const panel = document.getElementById('bose-tour-fab-panel');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = panel.classList.toggle('bose-tour-fab-panel-open');
            btn.setAttribute('aria-expanded', String(isOpen));
        });
        panel.querySelectorAll('[data-tour-key]').forEach((tile) => {
            tile.addEventListener('click', () => startTour(tile.getAttribute('data-tour-key')));
        });
        document.addEventListener('click', (e) => {
            if (wrap.contains(e.target)) return;
            // 🛡️ [إصلاح - الزرار "خدينا جولة" ما كانش شغال]: لو الكليك ده هو
            // نفسه اللي فتح اللوحة (زرار في الهيدر أو القائمة الجانبية عليه
            // data-start-bose-tour)، ما ينفعش نقفلها على طول في نفس اللحظة -
            // كان بيحصل بالظبط كده قبل كده (اللوحة تتفتح وتتقفل في نفس الكليك
            // الواحد لأن الاستمائع على "أي كليك بره اللوحة يقفلها" كان بيتنفذ
            // بعد الاستماع اللي بيفتحها في نفس تمرير الحدث).
            if (e.target.closest('[data-start-bose-tour]')) return;
            closeFabPanel();
        });

        updateFabVisibility();
    }

    /* ============================= توست تلقائي أول زيارة (مستقل لكل جولة) ============================= */

    // 🆕 [منع التزاحم مع نافذة "حمّلي تطبيقنا"]: النافذة دي (core-engine.js)
    // بتظهر بنفس التوقيت بالظبط (3.5 ثانية) وبنفس منطقة الشاشة تقريبًا -
    // لو الاتنين ظهروا في نفس اللحظة بيحصل تكدس وتدافع بصري. بندّي نافذة
    // التطبيق الأولوية دايمًا: لو لسه ظاهرة، بنستنى تتقفل (+نص ثانية هدوء
    // بعدها) قبل ما نعرض توست الجولة. لو مش موجودة أصلاً، بنكمل فورًا من
    // غير أي تأخير إضافي - زي ما كان بالظبط.
    function whenAppInstallPopupClear(cb) {
        const check = () => {
            const popup = document.getElementById('bose-app-install-popup-overlay');
            if (!popup) { cb(); return; }
            setTimeout(check, 400);
        };
        check();
    }

    function maybeShowFirstVisitToastForTour(tourKey) {
        const def = TOUR_DEFS.find(t => t.key === tourKey);
        if (!def) return;
        const seenKey = TOAST_SEEN_KEY_PREFIX + tourKey;
        let alreadySeen = true;
        try { alreadySeen = !!localStorage.getItem(seenKey); } catch (e) { alreadySeen = true; }
        if (alreadySeen) return;
        const state = getState();
        if (state && state.active) return;

        setTimeout(() => {
            const stateNow = getState();
            if (stateNow && stateNow.active) return;
            whenAppInstallPopupClear(() => showFirstVisitToastNow(tourKey, def, seenKey));
        }, 3500);
    }

    function showFirstVisitToastNow(tourKey, def, seenKey) {
        const stateNow = getState();
        if (stateNow && stateNow.active) return;
        try { localStorage.setItem(seenKey, '1'); } catch (e) { /* لا شيء */ }

        injectStylesOnce();
        const introSessionId = makeSessionId();
        logTourEvent('auto_toast_shown', tourKey, { sessionId: introSessionId });

        const toast = document.createElement('div');
        toast.className = 'bose-tour-intro-toast';
        toast.innerHTML = `
            <div class="bose-tour-intro-toast-title">👋 ${def.toastTitle}</div>
            <p class="bose-tour-intro-toast-text">${def.toastText}</p>
            <div class="bose-tour-intro-toast-row">
                <button type="button" class="bose-tour-intro-accept-btn" data-bose-intro-accept="1">آه، وريني</button>
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
            logTourEvent('auto_toast_accept', tourKey, { sessionId: introSessionId });
            removeToast();
            startTour(tourKey);
        });
        toast.querySelector('[data-bose-intro-dismiss]').addEventListener('click', () => {
            logTourEvent('auto_toast_dismiss', tourKey, { sessionId: introSessionId });
            removeToast();
            maybeHighlightFabAfterDismiss();
        });
    }

    /**
     * 👉 [بعد الرفض - نوريها فين تلاقي الجولة تاني]: قبل كده لما العميلة
     * كانت تدوس "لأ شكرًا"، التوست كان بيقفل والشاشة تقعد ساكتة تمامًا -
     * من غير ما تعرف أصلاً إن فيه زرار جولة ثابت في الموقع تقدر ترجعله في
     * أي وقت. دلوقتي أول مرة بس (لكل متصفح) لما ترفض أي توست دعوة، بنلفت
     * نظرها فعليًا لزرار الجولة العائم - نبضة إضاءة عليه + كارت صغير جنبه
     * بيوضح "من هنا هتلاقي الجولة في أي وقت" - وبيختفي لوحده من غير ما
     * يحتاج أي تفاعل. مرة واحدة بس للأبد عشان ميتكررش مع كل توست ترفضه
     * في مناطق مختلفة بالموقع.
     */
    function maybeHighlightFabAfterDismiss() {
        let seen = true;
        try { seen = !!localStorage.getItem(FAB_POINTER_SEEN_KEY); } catch (e) { seen = true; }
        if (seen) return;
        try { localStorage.setItem(FAB_POINTER_SEEN_KEY, '1'); } catch (e) { /* لا شيء */ }
        // 🛡️🆕 [إصلاح - الكارت كان بيختفي لوحده وهو مستخبي ورا نافذة "حمّلي
        // تطبيقنا"]: التوقيت القديم كان ثابت (450 مللي ثانية) من غير ما يتأكد
        // إن نافذة التطبيق مش هتظهر فوقه في نفس اللحظة - فلو الاتنين اتزاحموا،
        // الكارت كان بيبان لمدة 3.8 ثانية وبيختفي تلقائياً وهو مخفي بالكامل
        // ورا النافذة، يعني العميلة ما كانتش بتشوفه أبداً. دلوقتي بنستخدم
        // نفس دالة الانتظار (whenAppInstallPopupClear) اللي بتستخدمها التوست
        // التعريفي فوق - بنستنى النافذة تقفل الأول (لو ظاهرة) قبل ما نعرض
        // الكارت، عشان تشوفه فعلاً في المدة الكاملة اللي بيفضل ظاهر فيها.
        setTimeout(() => whenAppInstallPopupClear(highlightFabButton), 450);
    }

    function highlightFabButton() {
        const fabWrap = document.getElementById('bose-tour-fab-wrap');
        const btn = document.getElementById('bose-tour-fab-btn');
        if (!fabWrap || !btn) return; // الزرار العائم مش موجود في الصفحة دي أصلاً

        btn.classList.add('bose-tour-fab-btn-pulse');
        setTimeout(() => btn.classList.remove('bose-tour-fab-btn-pulse'), 4200);

        const note = document.createElement('div');
        note.className = 'bose-tour-fab-note';
        note.innerHTML = `<i class="fa-solid fa-arrow-left"></i> تمام، أي وقت حابة تاخدي جولة، هتلاقيها هنا 😊`;
        document.body.appendChild(note);
        requestAnimationFrame(() => note.classList.add('bose-tour-fab-note-show'));
        setTimeout(() => {
            note.classList.remove('bose-tour-fab-note-show');
            setTimeout(() => note.remove(), 350);
        }, 3800);
    }

    // أي عنصر عليه data-start-bose-tour بيبدأ جولة بدل سلوكه الافتراضي:
    // - قيمة = مفتاح جولة معروف (زي "cake_simulator") → تبدأ الجولة دي مباشرة.
    // - قيمة = "menu" (أو القيمة القديمة "1" - توافق مع أي زرار قديم لسه
    //   متبقّي) → بتفتح قايمة اختيار الجولة (زرار المساعدة العائم نفسه)
    //   عشان العميلة تختار بنفسها.
    document.addEventListener('click', function (e) {
        const trigger = e.target.closest('[data-start-bose-tour]');
        if (!trigger) return;
        e.preventDefault();
        const key = trigger.getAttribute('data-start-bose-tour');
        const knownKeys = TOUR_DEFS.map(t => t.key);
        if (key && knownKeys.indexOf(key) !== -1) { startTour(key); return; }
        openFabPanel();
    }, false);

    window.startBoseGuidedTour = startTour;

    document.addEventListener('DOMContentLoaded', () => {
        injectFabOnce();
        setTimeout(init, 600);

        const pageTourMap = {
            'index.html': 'homepage',
            'product.html': 'product',
            'cart.html': 'cart',
            'checkout.html': 'checkout',
            'cake-builder.html': 'cake_simulator',
            'flower-builder.html': 'flower_simulator',
            'rewards.html': 'rewards',
            'track-order.html': 'track_order',
        };
        const autoTourKey = pageTourMap[currentPageFile()];
        if (autoTourKey) maybeShowFirstVisitToastForTour(autoTourKey);
    });

    // 🆕 core-engine.js بيبعت الحدث ده أول ما القائمة الجانبية تتفتح فعليًا
    // (زر ☰) - مستقل عن باقي التوستات، عشان يشتغل في أي وقت العميلة
    // تفتح القائمة فيه، مش بس أول تحميل للصفحة الرئيسية.
    document.addEventListener('boseSidebarOpened', () => maybeShowFirstVisitToastForTour('sidebar'));
})();
