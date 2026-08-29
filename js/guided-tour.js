/**
 * 🎯 [الجولة التفاعلية الكاملة للموقع - "وريني كل حاجة"] 🎯 (V2.0)
 * ------------------------------------------------------------------
 * جولة واحدة متصلة تاخد العميلة من لحظة ما تفتح الموقع لحد ما تخلّص
 * طلب حقيقي وتشوف فاتورتها - بتشرح كل عنصر تحتاجه (القائمة الجانبية،
 * البحث، المفضلة، السلة، أقسام الصفحة الرئيسية، تحميل التطبيق، نظام
 * المكافآت) وبعدين تمشي معاها فعليًا خطوة بخطوة في عملية طلب حقيقية
 * كاملة (فئة → منتج → سلة → إتمام الطلب → الفاتورة).
 *
 * V2.0 بتحل المشاكل اللي كانت موجودة في النسخة القديمة (V1.0):
 * - الجولة القديمة كانت بس 6 خطوات، بتشرح "إزاي أطلب" وبس - من غير أي
 *   ذكر للقائمة الجانبية، البحث، المفضلة، العروض، المكافآت، أو تحميل
 *   التطبيق - رغم إن ده أكتر حاجة العميلات بيتلخبطوا فيها فعليًا.
 * - guided-tour.js نفسه ما كانش متحمّل في order-success.html، فلو
 *   الجولة وصلت لآخر خطوة كانت بتختفي بصمت من غير ما تتقفل صح.
 *
 * ✨ [نوعين من الخطوات]:
 * - "click" (افتراضي): بتضيء عنصر حقيقي وبتستنى العميلة تدوس عليه هي
 *   بنفسها فعليًا - "بتتعلم وهي بتنفذ"، زي زرار "أضيفي للسلة".
 * - "info": بس شرح لعنصر (قسم، أيقونة، بلوك) - مفيش حاجة لازم تتدوس،
 *   في زرار "التالي" بس عشان نكمل - مستخدمة لأي حاجة شرحها أهم من إن
 *   العميلة تتفاعل معاها فورًا (زي قسم العروض، أيقونة المفضلة، تحميل
 *   التطبيق).
 *
 * الحالة (active/stepIndex) محفوظة في localStorage عشان الجولة تكمل
 * صح لما العميلة تتنقل بين الصفحات فعليًا (منيو → فئة → منتج → سلة →
 * إتمام الطلب → نجاح الطلب) - كل صفحة فيها الملف ده بتكمل من حيث ما
 * وقفت الجولة تلقائيًا.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'bose_guided_tour_state_v2';

    // 🗺️ خطوات الجولة الكاملة بالترتيب - كل خطوة = عنصر حقيقي واحد على
    // صفحة حقيقية. "page": الملفات اللي الخطوة دي لازم تظهر فيها بس.
    // "anyPage": تظهر في أي صفحة (لأيقونة السلة، موجودة بكل صفحة).
    const TOUR_STEPS = [
        // ========== 1) الهيدر والقائمة الجانبية (الصفحة الرئيسية) ==========
        {
            page: ['index.html'], mode: 'info',
            selector: '.bose-sticky-header',
            title: 'أهلاً بيكِ في حلويات بوسي 👋',
            text: 'هناخدك دلوقتي في جولة كاملة على الموقع - القائمة، البحث، السلة، وطريقة الطلب من الأول للآخر - وهتخلصي وانتي عارفة كل حاجة. تقدري تنهي الجولة في أي وقت من زرار تحت.'
        },
        {
            page: ['index.html'], mode: 'click',
            selector: '#mobile-menu-toggle',
            title: 'القائمة الجانبية',
            text: 'الزرار ده بيفتحلك القائمة الجانبية، وفيها كل أقسام الموقع مجمّعة. دوسي عليه.'
        },
        {
            page: ['index.html'], mode: 'click', delayBeforeShow: 300,
            selector: '#sidebar-categories-toggle',
            title: 'تسوّقي حسب الفئة',
            text: 'من هنا تقدري تشوفي كل الـ12 فئة عندنا (تورت، ورد، كب كيك، دوناتس...) في مكان واحد. دوسي هنا تفتحيها.'
        },
        {
            page: ['index.html'], mode: 'info', delayBeforeShow: 200,
            selector: '#sidebar-categories-list',
            title: 'كل الفئات هنا',
            text: 'دي كل فئات المنتجات - دوسي على أي فئة في أي وقت وهتوديكي لكل الأصناف اللي جواها.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: 'a[href="/offers.html"]',
            title: 'العروض والخصومات',
            text: 'من هنا تشوفي كل عروضنا والخصومات النشطة دلوقتي في صفحة واحدة.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: 'a[href="/rewards.html"]',
            title: 'مكافآتك',
            text: 'وده نظام المكافآت بتاعنا - هنشرحلك تفاصيله كمان شوية.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: 'a[href="/track-order.html"]',
            title: 'تتبعي طلبك',
            text: 'بعد ما تطلبي، تقدري تتابعي حالة طلبك في أي وقت من هنا.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: 'a[href="/cake-builder.html"]',
            title: 'صممي تورتتك بنفسك',
            text: 'عايزة تورتة مناسبة بالظبط لمناسبتك؟ من هنا تختاري الحجم والنكهة والشكل بنفسك.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: 'a[href="/flower-builder.html"]',
            title: 'صممي بوكيه الورد بنفسك',
            text: 'وبالظبط زي التورت، تقدري تصممي بوكيه ورد مخصص بنفسك من هنا.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '.sidebar-footer-contacts',
            title: 'كلمينا مباشرة',
            text: 'ولو حبيتي تكلمينا في أي وقت، هتلاقي واتساب وتليفون المتجر هنا تحت في القائمة دايمًا.'
        },
        {
            page: ['index.html'], mode: 'click',
            selector: '#sidebar-close-btn',
            title: 'قفل القائمة',
            text: 'تمام، خلصنا من القائمة الجانبية. دوسي هنا تقفليها.'
        },

        // ========== 2) البحث ==========
        {
            page: ['index.html'], mode: 'click',
            selector: '#nav-search-btn',
            title: 'ابحثي عن أي صنف',
            text: 'مش عايزة تفتحي المنيو كله؟ دوسي على أيقونة البحث دي.'
        },
        {
            page: ['index.html'], mode: 'info', delayBeforeShow: 250,
            selector: '#bose-search-field',
            title: 'اكتبي اللي بتدوري عليه',
            text: 'اكتبي هنا اسم أي صنف أو نكهة (زي: قشطوطة، لوتس، كب كيك...) وهيطلعلك كل النتائج فورًا من غير ما تدوري في المنيو.'
        },
        {
            page: ['index.html'], mode: 'click',
            selector: '#search-modal-close',
            title: 'قفل البحث',
            text: 'ولما تخلصي بحث، دوسي هنا تقفلي.'
        },

        // ========== 3) أيقونات الهيدر (المفضلة والسلة) ==========
        {
            page: ['index.html'], mode: 'info',
            selector: '.nav-cart-icon-wrapper[href="/favorites.html"]',
            title: 'المفضلة',
            text: 'أي منتج يعجبك تقدري تحفظيه هنا بدوسة قلب واحدة، وترجعيله بعدين بسهولة من غير ما تدوري عليه تاني.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '.nav-cart-icon-wrapper[href="/cart.html"]',
            title: 'دي سلتك',
            text: 'دلوقتي فاضية، بس هتلاقيها هنا فوق في أي صفحة بالموقع دايمًا. هنملاها مع بعض كمان شوية.'
        },

        // ========== 4) أقسام الصفحة الرئيسية ==========
        {
            page: ['index.html'], mode: 'info',
            selector: '#hero-section',
            title: 'الواجهة الرئيسية',
            text: 'زرار "اطلب الآن" هنا بيوديكي على المنيو الشامل على طول.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '#categories-slider-section',
            title: 'تصفحي حسب الفئة',
            text: 'نفس الفئات اللي شوفناها في القائمة الجانبية، بس هنا بصور واضحة تقدري تتصفحيها بحرية.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '#offers-carousel-section',
            title: 'استفيدي من عروضنا',
            text: 'دي كل العروض والتخفيضات النشطة دلوقتي - لو نفسك تستفيدي بسعر مميز، ابدأي من هنا.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '#most-selling-section',
            title: 'الأكثر مبيعاً',
            text: 'كل كارت هنا فيه صورة المنتج وسعره، وزرار زيادة/تقليل الكمية، وزرار إضافة للسلة مباشرة - من غير ما تدخلي صفحة تانية أصلاً.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '#cake-preview-section',
            title: 'محاكي التورت',
            text: 'لو عايزة تصممي تورتة مناسبتك بنفسك (الحجم، النكهة، الشكل، وحتى صورة مطبوعة عليها)، من هنا تدخلي المحاكي.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '#new-arrivals-section',
            title: 'وصل حديثاً',
            text: 'وهنا آخر الأصناف الجديدة اللي ضفناها للمنيو.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '#our-products-section',
            title: 'منتجاتنا كاملة',
            text: 'وده المنيو الكامل بتاعنا - دوسي "استعرض المزيد" لو عايزة تشوفي كل الأصناف من غير ما تنقلي لصفحة تانية.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '#flower-preview-section',
            title: 'محاكي الورد',
            text: 'زي التورت بالظبط، تقدري تصممي بوكيه ورد مخصص بنفسك من هنا.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '#app-promo-section',
            title: 'حمّلي تطبيقنا',
            text: 'لو عايزة تحملي تطبيقنا: دوسي على زرار App Store أو Google Play هنا، وهتلاقي فيه نفس المنيو بالظبط، وكمان إشعارات بعروضنا ونقاط مكافآتك أول بأول.'
        },
        {
            page: ['index.html'], mode: 'info',
            selector: '#loyalty-teaser-section',
            title: 'نظام المكافآت',
            text: 'خصم تلقائي على طلباتك من غير أي كود، وقسيمة شراء حقيقية بـ300 جنيه كل 10 طلبات - تقدري تكتبي رقم موبايلك هنا في أي وقت تتابعي بيه رصيدك.'
        },

        // ========== 5) رحلة طلب حقيقية كاملة ==========
        {
            page: ['menu.html'], mode: 'click',
            selector: '.bose-menu-custom-card',
            title: 'اختاري فئة',
            text: 'تمام! خلصنا كل حاجة في الموقع. دلوقتي هنعمل طلب حقيقي مع بعض خطوة بخطوة. دوسي على أي فئة زي دي.'
        },
        {
            page: ['category.html'], mode: 'click',
            selector: '.product-card',
            title: 'اختاري الصنف',
            text: 'دوسي على أي منتج زي ده عشان تشوفي تفاصيله وسعره بالكامل.'
        },
        {
            page: ['product.html'], mode: 'info',
            selector: '.master-image-frame',
            title: 'صفحة المنتج',
            text: 'هتلاقي هنا صور واضحة للمنتج، وتحت كده وصف تفصيلي للمكونات والطعم عشان تختاري صح.'
        },
        {
            page: ['product.html'], mode: 'info',
            selector: '.product-price-block',
            title: 'السعر',
            text: 'وده السعر النهائي واضح قدامك من غير أي مفاجآت.'
        },
        {
            page: ['product.html'], mode: 'info',
            selector: '.qty-picker-capsule',
            title: 'حددي الكمية',
            text: 'من هنا تقدري تزوّدي أو تقلّلي الكمية اللي حابة تطلبيها قبل ما تضيفيها لسلتك.'
        },
        {
            page: ['product.html'], mode: 'click',
            selector: '#btn-add-to-cart-master-trigger',
            title: 'ضيفيه لسلتك',
            text: 'بعد ما تحددي اللي يناسبك، دوسي هنا عشان تضيفي المنتج ده لسلتك.'
        },
        {
            anyPage: true, mode: 'click', delayBeforeShow: 550,
            selector: '.nav-cart-icon-wrapper[href="/cart.html"]',
            title: 'دي سلتك دلوقتي! 🎉',
            text: 'شوفي، بقى فيها رقم دلوقتي. دوسي عليها عشان نراجع طلبك مع بعض.'
        },
        {
            page: ['cart.html'], mode: 'info',
            selector: '#cart-items-wrapper',
            title: 'راجعي أصنافك',
            text: 'دي كل الأصناف اللي ضفتيها. تقدري تزوّدي أو تقلّلي الكمية، أو تشيلي أي صنف من زرار الحذف.'
        },
        {
            page: ['cart.html'], mode: 'info',
            selector: '#coupon-input',
            title: 'كود الخصم',
            text: 'لو عندك كود خصم، اكتبيه هنا ودوسي "تطبيق".'
        },
        {
            page: ['cart.html'], mode: 'info',
            selector: '#checkout-order-notes-textarea',
            title: 'ملاحظاتك',
            text: 'وأي ملاحظة عايزاها تتقال لينا (زي حساسية من مكسرات مثلاً)، اكتبيها هنا.'
        },
        {
            page: ['cart.html'], mode: 'click',
            selector: '#btn-proceed-to-checkout',
            title: 'كمّلي طلبك',
            text: 'لما تراجعي كل حاجة، دوسي هنا عشان تكتبي بياناتك وتحددي التوصيل أو الاستلام.'
        },
        {
            page: ['checkout.html'], mode: 'info',
            selector: '#checkout-customer-name',
            title: 'بياناتك',
            text: 'هنا بتحطي اسمك بالكامل ورقم موبايلك اللي عليه واتساب (ورقم إضافي اختياري لو حبيتي).'
        },
        {
            page: ['checkout.html'], mode: 'info',
            selector: '.fulfillment-methods-flex',
            title: 'توصيل ولا استلام؟',
            text: 'اختاري توصيل للمنزل حسب منطقتك، أو استلام من الفرع من غير أي مصاريف شحن خالص.'
        },
        {
            page: ['checkout.html'], mode: 'info', delayBeforeShow: 200,
            selector: '#shipping-zone-wrapper',
            title: 'منطقتك وعنوانك',
            text: 'لو اخترتِ التوصيل، حددي منطقتك السكنية واكتبي عنوانك بالتفصيل، وهيتحسب سعر الشحن تلقائي.'
        },
        {
            page: ['checkout.html'], mode: 'info',
            selector: '#checkout-delivery-date',
            title: 'ميعاد التسليم',
            text: 'وهنا تحددي تاريخ وساعة التسليم اللي تناسبك (محتاجين على الأقل 24 ساعة عشان نجهز طلبك طازة).'
        },
        {
            page: ['checkout.html'], mode: 'info',
            selector: '#bose-deposit-payment-box',
            title: 'طريقة الدفع',
            text: 'تحويل كاش أو InstaPay على رقم المتجر - عربون 50% بس لو هتستلمي من الفرع، أو المبلغ كامل مقدمًا لو هيتوصّلك.'
        },
        {
            page: ['checkout.html'], mode: 'click',
            selector: '#btn-submit-order-final',
            title: 'اطلبي دلوقتي',
            text: 'لما تراجعي كل حاجة، دوسي هنا - هيتفتحلك واتساب فيه فاتورتك جاهزة. متنسيش تدوسي إرسال جوه واتساب نفسه عشان الطلب يوصلنا فعلاً.'
        },

        // ========== 6) صفحة نجاح الطلب ==========
        {
            page: ['order-success.html'], mode: 'info',
            selector: '.order-summary-receipt-box',
            title: 'فاتورتك',
            text: 'تمام، ده رقم طلبك وفاتورتك بالتفصيل - احتفظي بيه للمتابعة.'
        },
        {
            page: ['order-success.html'], mode: 'info',
            selector: '#bose-resend-whatsapp-btn',
            title: 'شبكة أمان',
            text: 'لو رسالة الواتساب ما اتفتحتش تلقائي، دوسي هنا وابعتيها بنفسك يدوي.'
        },
        {
            page: ['order-success.html'], mode: 'info',
            selector: '#bose-success-track-btn',
            title: 'تابعي طلبك',
            text: 'وبعد كده تقدري تتابعي حالة طلبك في أي وقت من هنا.'
        },
        {
            page: ['order-success.html'], mode: 'info',
            selector: '#bose-download-invoice-image-btn',
            title: 'احتفظي بفاتورتك',
            text: 'وده تحميل اختياري لصورة فاتورتك تحتفظي بيها عندك كمرجع شخصي.'
        }
    ];

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

    function removeOverlay() {
        if (activeOverlayEls) { activeOverlayEls.forEach(el => el.remove()); activeOverlayEls = null; }
        if (activeClickHandler) { document.removeEventListener('click', activeClickHandler, true); activeClickHandler = null; }
        if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
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
            .bose-tour-highlight-box{position:fixed;z-index:99998;pointer-events:none;border-radius:14px;box-shadow:0 0 0 9999px rgba(17,17,17,.62);border:3px solid #FF91A4;transition:top .3s ease,left .3s ease,width .3s ease,height .3s ease;}
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
        `;
        document.head.appendChild(style);
    }

    function waitForElement(selector, cb, onTimeout, timeoutMs) {
        const start = Date.now();
        (function tick() {
            const el = document.querySelector(selector);
            if (el) { cb(el); return; }
            if (Date.now() - start > (timeoutMs || 7000)) { if (onTimeout) onTimeout(); return; }
            waitTimer = setTimeout(tick, 250);
        })();
    }

    function positionAndShowStep(stepIndex) {
        removeOverlay();
        const step = TOUR_STEPS[stepIndex];
        if (!step) { endTour(true); return; }
        const proceed = () => waitForElement(
            step.selector,
            el => renderSpotlight(el, step, stepIndex),
            // العنصر مش موجود على الصفحة دي (اختلاف نسخة/حالة معينة) - منسيبش
            // الجولة عالقة، نتخطى الخطوة دي تلقائيًا ونكمل اللي بعدها.
            () => handleAdvance(stepIndex, stepIndex + 1),
            step.timeoutMs
        );
        if (step.delayBeforeShow) setTimeout(proceed, step.delayBeforeShow); else proceed();
    }

    function renderSpotlight(el, step, stepIndex) {
        injectStylesOnce();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const rect = el.getBoundingClientRect();
            const pad = 8;
            const box = document.createElement('div');
            box.className = 'bose-tour-highlight-box';
            box.style.top = (rect.top - pad) + 'px';
            box.style.left = (rect.left - pad) + 'px';
            box.style.width = (rect.width + pad * 2) + 'px';
            box.style.height = (rect.height + pad * 2) + 'px';
            document.body.appendChild(box);

            const total = TOUR_STEPS.length;
            const isInfo = step.mode === 'info';
            const isLast = stepIndex === total - 1;
            const percent = Math.round(((stepIndex + 1) / total) * 100);

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
                    : `<div class="bose-tour-tap-hint"><i class="fa-solid fa-hand-pointer"></i> دوسي على العنصر المضيء بالإطار الوردي</div>`
                }
                <div class="bose-tour-bottom-row">
                    <button type="button" class="bose-tour-skip-btn" data-bose-tour-skip="1">إنهاء الجولة</button>
                </div>
            `;
            document.body.appendChild(tooltip);

            // تموضع الكارت فوق أو تحت العنصر المضاء حسب المساحة المتاحة، وميخرجش برة الشاشة أفقياً
            const tRect = tooltip.getBoundingClientRect();
            let top = rect.bottom + pad + 14;
            if (top + tRect.height > window.innerHeight - 10) top = Math.max(10, rect.top - tRect.height - 14 - pad);
            let left = rect.left + rect.width / 2 - tRect.width / 2;
            left = Math.max(10, Math.min(left, window.innerWidth - tRect.width - 10));
            tooltip.style.top = top + 'px';
            tooltip.style.left = left + 'px';

            activeOverlayEls = [box, tooltip];
            tooltip.querySelector('[data-bose-tour-skip]').addEventListener('click', () => endTour(false));

            if (isInfo) {
                // 🧭 [خطوة شرح فقط]: مفيش عنصر لازم تتدوس عليه، زرار "التالي" بس
                // بيكمّل الجولة - مستخدم لأي عنصر شرحه أهم من تفاعل فوري معاه.
                const nextBtn = tooltip.querySelector('[data-bose-tour-next]');
                if (nextBtn) nextBtn.addEventListener('click', () => handleAdvance(stepIndex, stepIndex + 1));
            } else {
                // 🛡️ [capture:true]: بيضمن إن الحدث ده يوصلنا الأول قبل أي onclick تاني
                // على نفس العنصر (زي event.stopPropagation() جوه أزرار الموقع)، عشان
                // نضمن نلحق نتقدم للخطوة الجاية حتى لو زرار الموقع بيوقف الانتشار.
                // مفيش preventDefault هنا عمدًا: عايزين سلوك العنصر الحقيقي (فتح
                // القائمة، إضافة للسلة، الانتقال لصفحة تانية...) يحصل زي ما هو بالظبط.
                activeClickHandler = function (e) {
                    if (e.target.closest('[data-bose-tour-skip]')) return;
                    if (!e.target.closest(step.selector)) return;
                    handleAdvance(stepIndex, stepIndex + 1);
                };
                document.addEventListener('click', activeClickHandler, true);
            }
        }, 380);
    }

    // 🔀 [الانتقال بين الخطوات]: بيحدث حالة الجولة، وبيقرر هل نكمل نعرض
    // الخطوة الجاية على طول (لسه في نفس الصفحة) ولا نستنى تنقل حقيقي.
    // لو الخطوة اللي خلصت كانت "info" (يعني اتقدّمنا بزرار "التالي" مش
    // بدوسة حقيقية على لينك) والخطوة الجاية محتاجة صفحة مختلفة، بننقل
    // العميلة إحنا بأنفسنا (زي ما بنعمل بالظبط أول ما الجولة تبدأ). أما
    // لو الخطوة اللي خلصت كانت "click" على لينك حقيقي، فالمتصفح نفسه
    // هيتنقل لوحده - ومفيش داعي نكرر التنقل.
    function handleAdvance(fromIndex, toIndex) {
        removeOverlay();
        if (toIndex >= TOUR_STEPS.length) { endTour(true); return; }
        setState({ active: true, stepIndex: toIndex });
        const nextStep = TOUR_STEPS[toIndex];
        const fromStep = TOUR_STEPS[fromIndex];
        const page = currentPageFile();
        const staysOnPage = nextStep.anyPage || (nextStep.page && nextStep.page.indexOf(page) !== -1);
        if (staysOnPage) { positionAndShowStep(toIndex); return; }
        if (fromStep && fromStep.mode === 'info' && nextStep.page && nextStep.page[0]) {
            window.location.href = '/' + nextStep.page[0];
        }
        // غير كده: لينك حقيقي هيتنقل بيه المتصفح لوحده، وinit() هيكمّل
        // الجولة تلقائيًا أول ما الصفحة الجديدة تحمّل.
    }

    function startTour() {
        setState({ active: true, stepIndex: 0 });
        const firstPage = TOUR_STEPS[0].page[0];
        if (currentPageFile() === firstPage) init(); else window.location.href = '/' + firstPage;
    }

    function init() {
        const state = getState();
        if (!state || !state.active) return;
        const step = TOUR_STEPS[state.stepIndex];
        if (!step) { clearState(); return; }
        const page = currentPageFile();
        const pageMatches = step.anyPage || (step.page && step.page.indexOf(page) !== -1);
        if (!pageMatches) return; // العميلة يمكن غيّرت الصفحة يدوي بره مسار الجولة - منعرضش حاجة لحد ما توصل الصفحة الصح
        positionAndShowStep(state.stepIndex);
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

    document.addEventListener('DOMContentLoaded', () => { setTimeout(init, 600); });
})();
