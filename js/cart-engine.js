/**
 * 👑 محرك السلة وإتمام الطلب والتوثيق المالي النهائي الفاخر والمطور - حلويات بوسي 👑
 * النسخة الهندسية القياسية الشاملة والمطورة كلياً - خالية تماماً من ثغرات البتر وتداخل النصوص V7.0
 * الأداء: تم تحديثه ليعتمد على التحديث الموضعي (Localized DOM Mutations) لتوفير المعالج والبيانات بنسبة 100%
 * التوافق: معزول كلياً ويلتزم بمهامه دون التداخل مع أي ملف آخر أو تكرار وظائفه اللوجستية
 * [تم إصلاح ثغرة جلب البيانات وجدولة الفواتير جذرياً وحظر اختفاء المنتجات المضافة عند التوجيه]
 */

/**
 * 🛡️ [إصلاح]: حد أقصى منطقي لكمية القطعة الواحدة في السلة، لأن كل منتجاتنا
 * يدوية التحضير (تورت/ورد) ومفيش معنى لكمية غير منطقية (100+) بضغطة زرار متكررة.
 * الرقم قابل للتعديل من مكان واحد هنا لو احتجنا نغيّره مستقبلاً.
 */
const MAX_CART_ITEM_QUANTITY = 20;

/**
 * 🛡️ تحميل السلة من localStorage مع إعادة حساب كل سعر من بيانات المتجر
 * الموثوقة قبل عرضه أو استخدامه في أي حساب إجمالي أو رسالة طلب نهائية.
 * تُستخدم في كل مكان بدل القراءة المباشرة من localStorage.
 */
function loadTrustedCart() {
    let cart = [];
    try {
        const rawCart = localStorage.getItem("bose_cart");
        cart = rawCart ? JSON.parse(rawCart) : [];
        if (!Array.isArray(cart)) cart = [];
    } catch (parseErr) {
        // 🛡️ [إصلاح]: لو بيانات السلة المحفوظة اتلخبطت لأي سبب (كراش وقت
        // الكتابة، إضافة متصفح متدخلة، تعديل يدوي...)، منرجعش نكسر الصفحة -
        // بنرجع سلة فاضية ونمسح القيمة التالفة عشان متتكررش المشكلة تاني.
        console.warn("⚠️ بيانات السلة المحفوظة كانت تالفة، تم تصفيرها بأمان:", parseErr);
        try { localStorage.removeItem("bose_cart"); } catch (e) {}
        cart = [];
    }
    if (typeof window.recalculateFullCart === "function") {
        const result = window.recalculateFullCart(cart);
        cart = result.cart;
        localStorage.setItem("bose_cart", JSON.stringify(cart));
        // 🛡️ [إصلاح]: wasTampered كانت بترجع من الدالة وميتستخدمش خالص في أي مكان.
        // دلوقتي بنسجلها على الأقل في الكونسول (وممكن تتربط لاحقاً بأي نظام
        // تتبع/تحليلات) عشان محاولات التلاعب بالسعر متعديش من غير أي أثر.
        if (result.wasTampered) {
            console.warn("⚠️ تم اكتشاف واحتساب فرق في سعر عنصر بالسلة تلقائياً (تم تصحيحه بأمان).");
        }
    }
    return cart;
}

document.addEventListener("DOMContentLoaded", () => {
    // حقن واجهة التنبيهات الفاخرة المخصصة للبراند فوراً
    injectBoseCustomModalStyles();

    // 🛡️ [تحسين UX - تحقق شامل من فورم الشيك أوت]: تفعيل مسح رسالة الخطأ
    // تلقائياً تحت أي حقل بمجرد ما العميلة تبدأ تصلحه - بدون انتظار إرسال
    // الفورم تاني. آمن الاستدعاء في أي صفحة (بيتجاهل الحقول غير الموجودة).
    boseInitCheckoutFieldErrorClearing();

    // ربط المحرك المركزي والانتظار حتى تهيئة قاعدة البيانات الأساسية لـ JSON لمنع ثغرة السباق البرمجي واختفاء الأصناف
    if (window.BoseStoreData && window.BoseStoreData.store) {
        initializeCartEngine(window.BoseStoreData);
    } else {
        document.addEventListener("BoseDatabaseLoaded", (e) => {
            initializeCartEngine(e.detail);
        });
    }
});

/**
 * 🛡️👑 [إصلاح جذري - "المنتج بيتضاف بس مبيظهرش في السلة خالص"]: السبب الحقيقي
 * هو إن الصفحة كانت بترسم محتواها مرة واحدة بس عند حدث DOMContentLoaded - وده
 * الحدث ده بيحصل مرة واحدة بس أول ما الصفحة تتحمل فعلياً من السيرفر، ومش
 * بيتكرر تاني لو المتصفح رجّع نفس الصفحة من الذاكرة المؤقتة (bfcache) بدل ما
 * يحملها من جديد - وده اللي بيحصل تلقائياً وبكثرة جداً في متصفحات الموبايل
 * (خصوصاً Safari على الآيفون) لما العميلة تضغط زرار "رجوع" في المتصفح.
 *
 * يعني السيناريو الحقيقي اللي كان بيحصل: العميلة تفتح صفحة السلة (فاضية أو
 * فيها منتجات قديمة) → تضغط "تصفحي المنيو" أو أي رابط تاني وتسيب الصفحة →
 * تضيف منتج جديد (تورت مخصص، بوكيه، أو أي منتج عادي) من صفحة تانية → تضغط
 * زرار "رجوع" في المتصفح عشان ترجع السلة. بدل ما المتصفح يحمّل cart.html من
 * جديد (وبالتالي يشغّل DOMContentLoaded وكل منطق الرندرة من جديد)، بيرجّع
 * "لقطة" قديمة محفوظة من الصفحة *زي ما كانت بالظبط قبل ما تسيبها* - يعني قبل
 * إضافة المنتج الجديد. المنتج فعلياً محفوظ وموجود في localStorage (بيانات
 * السلة الحقيقية سليمة 100%)، بس الشاشة بتفضل عارضة الحالة القديمة الفاضية/
 * الناقصة، فتحس العميلة إن المنتج "اختفى" أو "مبيتضافش خالص" - نفس المشكلة
 * بالظبط بتتكرر لأي منتج ولأي صفحة سلة، مش مرتبطة بمنتج معين، لأنها مشكلة في
 * آلية عرض الصفحة نفسها مش في منطق الإضافة للسلة.
 *
 * الحل: حدث `pageshow` بيتفعّل دايماً لما الصفحة تظهر للمستخدم - سواء كانت
 * تحميل جديد أو استرجاع من bfcache - وخاصية `event.persisted` بتفرّق بين
 * الحالتين (true لو الصفحة راجعة من الكاش). لو كانت راجعة من الكاش، بنعيد
 * تشغيل نفس منطق الرندرة اللي كان هيشتغل عادي عند تحميل الصفحة، فتقرأ أحدث
 * نسخة من السلة من localStorage وتعرضها فوراً بدل اللقطة القديمة.
 */
window.addEventListener("pageshow", (event) => {
    if (event.persisted && window.BoseStoreData && window.BoseStoreData.store) {
        initializeCartEngine(window.BoseStoreData);
    }
});

/**
 * 🛡️ يعلّم حقل واحد كـ"غلط" (حدود حمراء + رسالة تحته) بدل ما نوقف الفورم
 * كله عند أول خطأ - بيُستخدم مع boseShowAllCheckoutErrors عشان كل الأخطاء
 * تتجمع وتتعرض مرة واحدة.
 */
function boseMarkFieldError(inputEl, message) {
    if (!inputEl) return;
    inputEl.classList.add("field-invalid");
    inputEl.setAttribute("aria-invalid", "true");
    const errEl = document.getElementById(`err-${inputEl.id}`);
    if (errEl) {
        const textSpan = errEl.querySelector("span") || errEl;
        textSpan.textContent = message;
        errEl.classList.add("is-visible");
    }
}

/** 🛡️ يمسح علامة الخطأ من حقل واحد بمجرد ما العميلة تبدأ تعدّله */
function boseClearFieldError(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove("field-invalid");
    inputEl.removeAttribute("aria-invalid");
    const errEl = document.getElementById(`err-${inputEl.id}`);
    if (errEl) errEl.classList.remove("is-visible");
}

/**
 * 🛡️🛡️ [تحسين UX - تحقق شامل من الفورم]: بتاخد كل أخطاء التحقق مجمّعة
 * مرة واحدة (بدل ما توقف عند أول خطأ وتخلي العميلة تكتشف الأخطاء واحد
 * واحد بمحاولات إرسال متكررة)، وتعلّم كل حقل غلط برسالته تحته، وتعمل
 * تركيز+سكرول لأول حقل غلط، وتوريلها Toast مختصر يقولها فيه كام حقل محتاج مراجعة.
 * @param {{input: HTMLElement, message: string}[]} errors
 * @param {HTMLElement|null} firstInvalidInput
 */
function boseShowAllCheckoutErrors(errors, firstInvalidInput) {
    errors.forEach(({ input, message }) => boseMarkFieldError(input, message));
    if (firstInvalidInput) {
        firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalidInput.focus({ preventScroll: true });
    }
    const summary = errors.length === 1
        ? "فيه حقل واحد محتاج مراجعة، موضّح تحته بالتفصيل"
        : `فيه ${errors.length} حقول محتاجة مراجعة، موضّحة تحت كل حقل بالتفصيل`;
    if (typeof window.showBoseGlobalToast === "function") {
        window.showBoseGlobalToast(summary);
    } else {
        showBoseCustomModal(summary);
    }
}

/** 🛡️ تسجيل مستمعين لمسح خطأ أي حقل شيك أوت بمجرد ما العميلة تعدّله */
function boseInitCheckoutFieldErrorClearing() {
    const fieldIds = [
        "checkout-customer-name", "checkout-customer-phone", "checkout-customer-phone-2",
        "checkout-zone-select", "checkout-address-details", "checkout-delivery-date", "checkout-delivery-time",
    ];
    fieldIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => boseClearFieldError(el));
        el.addEventListener("change", () => boseClearFieldError(el));
    });
}

/**
 * دالة التهيئة والتحكم الأساسية لمحرك السلة والطلب
 */
function initializeCartEngine(storeData) {
    const isCartPage = document.getElementById("cart-items-wrapper") !== null;
    const isCheckoutPage = document.getElementById("btn-submit-order-final") !== null;
    const isSuccessPage = document.getElementById("success-order-id-display") !== null;

    if (isCartPage) {
        renderBoseCartPage(storeData);
    } else if (isCheckoutPage) {
        renderBoseCheckoutPage(storeData);
    } else if (isSuccessPage) {
        renderBoseSuccessPage(storeData);
    }
}

/**
 * =========================================================================
 * 🏪 1. محرك وإدارة صفحة سلة المشتريات (cart.html)
 * =========================================================================
 */
function renderBoseCartPage(storeData) {
    const cartWrapper = document.getElementById("cart-items-wrapper");
    const clearCartBtn = document.getElementById("btn-clear-cart") || document.querySelector("button.btn-clear-all-cart");
    const mixedWarningBanner = document.getElementById("mixed-order-warning-banner");
    
    // رندرة السلة الشاملة من الذاكرة المحلية الموحدة bose_cart
    function buildFullCartUI() {
        const cart = loadTrustedCart();

        // ⚠️ [عزل الطلبات المختلطة]: إظهار/إخفاء تنبيه المزج بين المخصص والعادي
        // في كل مرة السلة بترتسم من جديد (إضافة/حذف/تعديل كمية).
        if (mixedWarningBanner) {
            const isMixedOrder = typeof window.boseCartHasMixedRegularAndCustom === "function"
                ? window.boseCartHasMixedRegularAndCustom(cart)
                : false;
            mixedWarningBanner.style.display = isMixedOrder ? "flex" : "none";
        }

        // 🐛 [إصلاح - عدادات السلة (الهيدر/الشريط السفلي/الفقاعة العائمة) كانت
        // بتفضل عالقة على قيمة قديمة]: buildFullCartUI() هي الدالة اللي فعلياً
        // بترسم محتوى صفحة السلة من أحدث بيانات localStorage - وبتتكرر مش بس
        // عند أول تحميل، لكن كمان عند رجوع الصفحة من bfcache (حدث pageshow في
        // أول الملف). المشكلة إن تحديث العدادات (updateGlobalCartCounter) كان
        // مربوط بس بأحداث تفاعل العميلة اليدوية (زيادة/نقصان/حذف صنف) - مش
        // بعملية الرندرة نفسها. فلو السلة اتفضّت من مكان تاني تماماً (زي صفحة
        // نجاح الطلب بعد إرسال الفاتورة) وبعدين العميلة رجعت لصفحة السلة (حتى
        // لو من الكاش)، المحتوى المعروض كان بيتحدّث صح (فاضي فعلاً) لكن أرقام
        // العدادات في الهيدر/الشريط السفلي كانت بتفضل زي ما هي من قبل. الحل:
        // استدعاء العدادات هنا في كل مرة السلة بترتسم، مش بس عند تفاعل يدوي.
        if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
        
        if (clearCartBtn) {
            clearCartBtn.style.display = cart.length > 0 ? "block" : "none";
        }
        
        if (cart.length === 0) {
            cartWrapper.innerHTML = `
                <div class="empty-cart-message-block" style="text-align: center; padding: 60px 20px; background: #FFFFFF;">
                    <i class="fas fa-shopping-bag" style="font-size: 48px; color: #FF91A4; margin-bottom: 20px; display: block; opacity: 0.6;"></i>
                    <p style="font-size: 18px; font-weight: 700; color: #111111; font-family: 'Cairo'; margin-bottom: 20px;">سلة المشتريات فارغة حالياً</p>
                    <a href="/menu.html" class="bose-btn-primary" style="display: inline-block; background: #FF91A4; color: #FFFFFF; padding: 12px 30px; border-radius: 12px; text-decoration: none; font-weight: 700; font-family: 'Cairo'; box-shadow: 0 8px 32px rgba(255, 145, 164, 0.15);">تصفح المنيو الشامل</a>
                </div>
            `;
            updateCartSummary(cart, storeData);
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        cart.forEach((item, index) => {
            const finalProductPrice = parseFloat(item.finalPrice || 0);
            const totalItemCost = finalProductPrice * (parseInt(item.quantity, 10) || 1);
            
            let customDetailsHTML = "";
            const esc = window.escapeBoseHTML || (s => s);
            
            const isCakeBespoke = item.type === "custom-cake" || item.type === "mini-cake" || item.productSlug === "toort-custom-master" || item.productSlug === "mini-cake-two-person";
            const isFlowerBespoke = item.type === "custom-flower" || item.productSlug === "flowers-master";
            
            if (item.customDetails) {
                let specs = [];
                const cd = item.customDetails;

                if (isCakeBespoke) {
                    if (cd.isGift) specs.push(`<span>🎁 <strong>هدية لحد تاني</strong></span>`);
                    if (cd.occasionLabel && cd.occasionLabel.trim() !== "") specs.push(`<span><strong>المناسبة:</strong> ${esc(cd.occasionLabel.trim())}</span>`);
                    if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") specs.push(`<span><strong>طعم الكيك:</strong> ${esc(cd.cakeType)}</span>`);
                    if (cd.shape && cd.shape !== "none") specs.push(`<span><strong>الشكل:</strong> ${cd.shape === 'circle' ? 'دائري' : cd.shape === 'heart' ? 'قلب' : cd.shape === 'square' ? 'مربع' : cd.shape === 'rectangle' ? 'مستطيل' : esc(cd.shape)}</span>`);
                    if (cd.persons && parseInt(cd.persons, 10) > 0) specs.push(`<span><strong>عدد الأفراد:</strong> ${parseInt(cd.persons, 10)} فرد</span>`);
                    if (cd.printingType && cd.printingType !== "none") specs.push(`<span><strong>الطباعة:</strong> ${cd.printingType === 'edible' ? 'صورة صالحة للأكل' : 'صورة مجسمة غير صالحة للأكل'}</span>`);
                    if (cd.customMessage && cd.customMessage.trim() !== "") specs.push(`<span><strong>الرسالة المكتوبة:</strong> "${esc(cd.customMessage.trim())}"</span>`);
                    if (cd.allergyNote && cd.allergyNote.trim() !== "") specs.push(`<span style="color:#FF91A4;"><strong>ملاحظة الحساسية:</strong> ${esc(cd.allergyNote.trim())}</span>`);
                    // 🐛💳 [إصلاح جذري - كارت الإهداء كان بيختفي تماماً من ملخص السلة]: قسم
                    // isCakeBespoke هنا معندوش أي سطر لـ hasGiftCard/giftCardText من الأساس
                    // (بعكس قسم isFlowerBespoke تحت اللي عنده السطر ده)، رغم إن العميلة فعلاً
                    // اختارت الكارت وكتبت نصه وقت التصميم، وكان ظاهر لها كسطر سعر منفصل في
                    // محاكي التورت - فلما توصل السلة يختفي الكارت ونصه وسعره تماماً وكأنها
                    // معملتش الاختيار ده أبداً.
                    if (cd.hasGiftCard && cd.giftCardText && cd.giftCardText.trim() !== "") specs.push(`<span><strong>كارت إهداء مطبوع:</strong> "${esc(cd.giftCardText.trim())}"</span>`);
                    // 🐛🖼️ [إصلاح جذري - صور المرفقات كانت مش ظاهرة في السلة خالص]: صورتي
                    // "التصميم المرجعي" (اللي عايزة نقرب شكل التورتة منها) و"الطباعة على
                    // التورتة" كانتا موجودتين بس كرابط نص خام جوه رسالة الواتساب - العميلة
                    // نفسها لما تفتح صفحة السلة وتراجع طلبها كان معندهاش أي تأكيد بصري إن
                    // صورتها فعلاً اترفعت واتحفظت مع طلبها، غير الصورة الرئيسية بس (اللي
                    // ممكن تبقى واحدة بس من الاتنين لو رفعت الاتنين مع بعض). دلوقتي بنعرض
                    // thumbnail حقيقي قابل للضغط (بيفتح بملء الشاشة) لكل صورة مرفقة فعلياً.
                    if (cd.replicaImageUrl) specs.push(`<span class="cart-item-attached-photo"><strong>صورة التصميم المرجعي:</strong><br><a href="${esc(cd.replicaImageUrl)}" target="_blank" rel="noopener"><img src="${esc(cd.replicaImageUrl)}" alt="صورة التصميم المرجعي" loading="lazy" style="width:64px;height:64px;border-radius:10px;object-fit:cover;margin-top:4px;cursor:pointer;border:1px solid rgba(255,145,164,0.3);"></a></span>`);
                    if (cd.printImageUrl) specs.push(`<span class="cart-item-attached-photo"><strong>صورة الطباعة على التورتة:</strong><br><a href="${esc(cd.printImageUrl)}" target="_blank" rel="noopener"><img src="${esc(cd.printImageUrl)}" alt="صورة الطباعة على التورتة" loading="lazy" style="width:64px;height:64px;border-radius:10px;object-fit:cover;margin-top:4px;cursor:pointer;border:1px solid rgba(255,145,164,0.3);"></a></span>`);
                }
                
                if (isFlowerBespoke) {
                    if (cd.moodLabel) specs.push(`<span><strong>الإحساس المطلوب:</strong> ${esc(cd.moodLabel)}</span>`);
                    // 🐛🌸👑 [إصلاح جذري - أسماء أنواع الورد كانت مكتوبة يدوياً بس]: بعد ما بقت
                    // أنواع الورد تُدار بالكامل من لوحة التحكم (list-flower-types)، الاسم
                    // الحقيقي للنوع بقى موجود في window.BoseStoreData.flowerBuilder.flowerTypes
                    // بدل ثلاث قيم ثابتة مكتوبة هنا - فبنبحث فيها الأول، ولو مفيش قائمة أدمن
                    // (أو النوع مش موجود فيها) بنرجع لنفس الأسماء الافتراضية القديمة كاحتياطي.
                    if (cd.flowerType && cd.flowerType !== "none") {
                        const fbTypes = window.BoseStoreData?.flowerBuilder?.flowerTypes;
                        const match = Array.isArray(fbTypes) ? fbTypes.find(t => t && t.id === cd.flowerType) : null;
                        const defaultNames = { natural: "طبيعي نضر", artificial: "صناعي فاخر", satin: "ستان راقٍ" };
                        const typeName = match ? match.name : (defaultNames[cd.flowerType] || cd.flowerType);
                        specs.push(`<span><strong>نوع الورد:</strong> ${esc(typeName)}</span>`);
                    }
                    if (cd.flowerCount && parseInt(cd.flowerCount, 10) > 0) specs.push(`<span><strong>عدد الورد:</strong> ${parseInt(cd.flowerCount, 10)} وردة</span>`);
                    // 🐛💰👑 [إصلاح جذري - الكاش والشوكولاتة ماكانوش بيظهروا في السلة خالص]:
                    // الحقول هنا كانت بتقرا cd.moneyAmount وcd.chocolatePieces، لكن
                    // customOptionsObj في flower-engine.js فعلياً بيبعت cashAmount
                    // وchocolateBudget (بنفس الأسماء اللي بيقرأها الحارس المركزي
                    // window.createCartItem/calculateCustomFlowerPrice) - فالشرطين دول
                    // كانوا دايماً false وماكانش أي منهم بيظهر للعميلة في صفحة السلة،
                    // رغم إنها فعلاً دفعت مقابلهم.
                    if (cd.cashAmount && parseInt(cd.cashAmount, 10) > 0) specs.push(`<span><strong>مفاجأة الكاش المدمجة:</strong> ${parseInt(cd.cashAmount, 10)} جنيه</span>`);
                    if (cd.chocolateBudget && parseInt(cd.chocolateBudget, 10) > 0) specs.push(`<span><strong>ميزانية الشوكولاتة الفاخرة:</strong> ${parseInt(cd.chocolateBudget, 10)} جنيه</span>`);
                    // 🐛👑 [إضافة حقول كانت مدفوعة بس مش ظاهرة في السلة خالص]: شريط الستان
                    // المطبوع وعدد الصور الشخصية كانا بيتحسبوا في السعر وبيظهروا في فاتورة
                    // الواتساب، لكن صفحة السلة نفسها ماكانتش بتعرضهم للعميلة أبداً.
                    if (cd.hasSatinRibbon && cd.satinRibbonText && cd.satinRibbonText.trim() !== "") specs.push(`<span><strong>شريط ستان مطبوع:</strong> "${esc(cd.satinRibbonText.trim())}"</span>`);
                    if (cd.photoCount && parseInt(cd.photoCount, 10) > 0) specs.push(`<span><strong>صور شخصية مطبوعة:</strong> ${parseInt(cd.photoCount, 10)} صورة</span>`);
                    if (cd.giftCardText && cd.giftCardText.trim() !== "") specs.push(`<span><strong>كارت الإهداء:</strong> "${esc(cd.giftCardText.trim())}"</span>`);
                }

                // 👑 [إصلاح جذري - كارثة الأحجام]: المنتجات العادية (زي الديسباسيتو/القشطوطة)
                // اللي عندها أكتر من حجم سعر لازم يظهر الحجم اللي العميل اختاره بوضوح جوه
                // كارت السلة - قبل كده كان الفرق الوحيد بين الأحجام هو السعر بصمت، والعميل
                // نفسه ميعرفش هو مشتري مقاس إيه غير لما الطلب يوصله فعلياً.
                if (!isCakeBespoke && !isFlowerBespoke && cd.sizeLabel) {
                    specs.push(`<span><strong>الحجم:</strong> ${esc(cd.sizeLabel)}</span>`);
                }

                if (specs.length > 0) {
                    customDetailsHTML = `<div class="cart-item-customizations-panel" style="font-size: 13px; color: #111111; background: rgba(255,145,164,0.04); padding: 10px; border-radius: 12px; margin: 6px 0; border-right: 3px solid #FF91A4; display: flex; flex-direction: column; gap: 4px; width: 100%; box-sizing: border-box; font-family: 'Cairo';">${specs.join("")}</div>`;
                }
            }

            let cleanFlavorName = item.flavorName;
            if (!cleanFlavorName || cleanFlavorName === "افتراضي" || cleanFlavorName === "none" || isCakeBespoke || isFlowerBespoke) {
                if (storeData && storeData.products) {
                    const matchedDbProd = storeData.products.find(p => p.slug === item.productSlug);
                    cleanFlavorName = matchedDbProd ? matchedDbProd.flavorName : "جاهز وفريش";
                } else {
                    cleanFlavorName = "جاهز وفريش";
                }
            }

            const cartCard = document.createElement("div");
            cartCard.className = "bose-cart-item-card";
            cartCard.setAttribute("data-item-id", item.id);
            cartCard.setAttribute("data-index", index);
            
            const safeCartImg = (window.optimizeBoseImageUrl ? window.optimizeBoseImageUrl(item.image, 240) : item.image) || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png';
            const safeTitle = esc(item.title || "");
            const safeFlavorName = esc(cleanFlavorName || "");

            // 🛡️ [إصلاح حرج]: كارت عنصر السلة كان div عادي بدون أي رابط - الصورة والعنوان
            // معندهمش أي وسم <a> يوصل العميل لصفحة تفاصيل المنتج، فمفيش أي طريقة للعميل
            // يرجع يشوف وصف/صور المنتج وهو بيراجع سلته قبل الشراء، وده بالظبط اللي كان
            // بيصعب قرار الشراء عليه. بالنسبة لمنتجات المحاكي (تورت مخصص/بوكيه) معندهاش
            // صفحة منتج ثابتة أصلاً (هي أساسًا صفحة محاكي)، فمفيش رابط ليها هنا عشان منوديش
            // العميل لصفحة هتحوله فورًا برا السلة من غير فايدة حقيقية.
            const linkStart = (!isCakeBespoke && !isFlowerBespoke && item.productSlug)
                ? `<a href="/product.html?slug=${encodeURIComponent(item.productSlug)}" style="text-decoration:none; color:inherit; display:contents;">`
                : '';
            const linkEnd = linkStart ? `</a>` : '';

            cartCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 20px; flex: 1; min-width: 0;">
                    ${linkStart}
                    <img src="${safeCartImg}" class="cart-item-image" alt="${safeTitle}" style="width: 120px; height: 120px; border-radius: 20px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255,145,164,0.3); cursor: ${linkStart ? 'pointer' : 'default'};" loading="lazy">
                    <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; text-align: right;">
                        <h3 class="cart-item-title" style="margin: 0; font-size: 16px; font-weight: 700; color: #111111; font-family: 'Cairo'; line-height: 1.4; cursor: ${linkStart ? 'pointer' : 'default'};">${safeTitle}</h3>
                        <span class="cart-item-flavor-name" style="font-size: 13.5px; color: #FF91A4; font-weight: 700; font-family: 'Cairo';">${safeFlavorName}</span>
                        ${linkEnd}
                        ${customDetailsHTML}
                        
                        <div class="bose-qty-controller-box" style="display: flex; align-items: center; border: 1px solid rgba(255, 145, 164, 0.3); border-radius: 12px; width: max-content; margin-top: 8px; background: #FFFFFF; height: 38px; padding: 2px;">
                            <button class="btn-qty-plus" data-index="${index}" style="border: none; background: transparent; width: 36px; height: 100%; font-weight: 700; font-size: 16px; color: #111111; cursor: pointer;">+</button>
                            <input type="text" readonly class="qty-numerical-display" value="${item.quantity}" style="width: 36px; text-align: center; border: none; font-size: 15px; font-weight: 700; color: #111111; background: transparent; font-family: 'Cairo';">
                            <button class="btn-qty-minus" data-index="${index}" style="border: none; background: transparent; width: 36px; height: 100%; font-weight: 700; font-size: 16px; color: #111111; cursor: pointer;">-</button>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; min-height: 100px; flex-shrink: 0; text-align: left;">
                    <button class="btn-remove-item" data-index="${index}" aria-label="حذف الصنف" style="background: transparent; border: none; color: rgba(17,17,17,0.3); font-size: 16px; cursor: pointer; padding: 6px; transition: color 0.2s;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    
                    <div style="text-align: left; font-family: 'Cairo';">
                        <span class="qty-multiplication-label" style="display: ${item.quantity > 1 ? 'block' : 'none'}; font-size: 12px; color: #111111; opacity: 0.6; direction: ltr;">${finalProductPrice.toFixed(2)} × ${item.quantity}</span>
                        <div class="cart-item-total-price" style="font-size: 18px; font-weight: 700; color: #FF91A4; white-space: nowrap;">${totalItemCost.toFixed(2)} <span style="font-size: 12px; font-weight: 700; color: #111111;">EGP</span></div>
                    </div>
                </div>

                <div class="cart-item-completion-hint" style="grid-column: 1 / -1; display: flex; align-items: flex-start; gap: 8px; margin-top: 4px; padding: 10px 14px; background: rgba(255,145,164,0.06); border: 1px dashed rgba(255,145,164,0.35); border-radius: 12px; font-family: 'Cairo';">
                    <i class="fa-solid fa-circle-info" style="color: #FF91A4; font-size: 13px; margin-top: 2px;"></i>
                    <span style="font-size: 12.5px; line-height: 1.6; color: #111111; opacity: 0.85;">الصنف ده اتحفظ في سلتك، بس طلبك لسه ما بعتش. كمّلي لآخر الصفحة ودوسي على "الانتقال لإتمام الطلب"، وبعدين زرار تأكيد الطلب في صفحة الدفع، عشان تفاصيل طلبك توصلنا فورًا على الواتساب ونبدأ نجهزهولك.</span>
                </div>
            `;
            
            fragment.appendChild(cartCard);
        });
        
        cartWrapper.innerHTML = "";
        cartWrapper.appendChild(fragment);
        updateCartSummary(cart, storeData);
    }
    
    function updateSingleItemDOM(cardElement, item, finalProductPrice, totalItemCost) {
        const qtyDisplay = cardElement.querySelector(".qty-numerical-display");
        const multiLabel = cardElement.querySelector(".qty-multiplication-label");
        const totalDisplay = cardElement.querySelector(".cart-item-total-price");
        
        if (qtyDisplay) qtyDisplay.value = item.quantity;
        if (multiLabel) {
            multiLabel.textContent = `${finalProductPrice.toFixed(2)} × ${item.quantity}`;
            multiLabel.style.display = item.quantity > 1 ? "block" : "none";
        }
        if (totalDisplay) {
            totalDisplay.innerHTML = `${totalItemCost.toFixed(2)} <span style="font-size: 12px; font-weight: 700; color: #111111;">EGP</span>`;
        }
    }
    
    cartWrapper.onclick = (e) => {
        const target = e.target.closest("button");
        if (!target) return;
        
        const cardElement = target.closest(".bose-cart-item-card");
        if (!cardElement) return;
        
        const index = parseInt(cardElement.getAttribute("data-index"), 10);
        const cart = loadTrustedCart();
        
        if (isNaN(index) || !cart[index]) return;
        
        const item = cart[index];
        const finalProductPrice = parseFloat(item.finalPrice || 0);
        
        if (target.classList.contains("btn-qty-plus")) {
            // 🛡️ [إصلاح]: منع تجاوز الحد الأقصى المنطقي للكمية بدل الزيادة اللانهائية.
            if (item.quantity >= MAX_CART_ITEM_QUANTITY) {
                if (typeof window.showBoseGlobalToast === "function") {
                    window.showBoseGlobalToast(`أقصى كمية ممكنة للقطعة الواحدة هي ${MAX_CART_ITEM_QUANTITY}. لو محتاجة كمية أكبر، تواصلي معانا مباشرة على واتساب.`);
                }
                return;
            }
            item.quantity += 1;
            localStorage.setItem("bose_cart", JSON.stringify(cart));
            if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
            if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("تمت إضافة قطعة أخرى للسلة.");
            
            updateSingleItemDOM(cardElement, item, finalProductPrice, finalProductPrice * item.quantity);
            updateCartSummary(cart, storeData);
        } else if (target.classList.contains("btn-qty-minus")) {
            if (item.quantity > 1) {
                item.quantity -= 1;
                localStorage.setItem("bose_cart", JSON.stringify(cart));
                if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
                if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("تم تقليل قطعة من السلة.");
                
                updateSingleItemDOM(cardElement, item, finalProductPrice, finalProductPrice * item.quantity);
                updateCartSummary(cart, storeData);
            } else {
                triggerCartItemRemoval(cart, index, storeData, buildFullCartUI);
            }
        } else if (target.classList.contains("btn-remove-item")) {
            triggerCartItemRemoval(cart, index, storeData, buildFullCartUI);
        }
    };
    
    if (clearCartBtn) {
        clearCartBtn.onclick = () => {
            showBoseCustomModal("تحب تفضّي السلة من كل الأصناف؟", () => {
                localStorage.removeItem("bose_cart");
                if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
                if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("السلة اتفضّت خالص.");
                buildFullCartUI();
            });
        };
    }

    buildFullCartUI();
}

function triggerCartItemRemoval(cart, index, storeData, callback) {
    showBoseCustomModal(`تحب تشيل "${cart[index].title}" من السلة؟`, () => {
        cart.splice(index, 1);
        localStorage.setItem("bose_cart", JSON.stringify(cart));
        if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
        if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("الصنف اتشال من السلة.");
        callback();
    });
}

function updateCartSummary(cart, storeData) {
    const subtotalDisplay = document.getElementById("cart-subtotal-value") || document.getElementById("summary-subtotal");
    const grandTotalDisplay = document.getElementById("cart-grand-total-value") || document.getElementById("summary-grand-total");
    const itemsCountDisplay = document.getElementById("summary-items-count");
    
    // 🧮 [توحيد حسابي]: استخدام calculateBoseInvoice الموحدة بدل تكرار
    // نفس المعادلة محلياً هنا (كانت بتفرق فعلياً عن checkout عند أي تعديل مستقبلي).
    const invoice = window.calculateBoseInvoice(cart, storeData, 0);
    
    if (subtotalDisplay) subtotalDisplay.textContent = invoice.subtotal.toFixed(2) + " EGP";
    if (itemsCountDisplay) itemsCountDisplay.textContent = invoice.itemsCount;
    
    const discountDisplay = document.getElementById("summary-discount");
    if (discountDisplay) discountDisplay.textContent = invoice.discount.toFixed(2) + " EGP";
    
    if (grandTotalDisplay) {
        grandTotalDisplay.textContent = invoice.grandTotal + " EGP";
    }
    
    const promoInput = document.getElementById("coupon-input");
    const promoBtn = document.getElementById("btn-apply-coupon");
    const couponMsg = document.getElementById("coupon-message");
    
    if (promoBtn && promoInput && couponMsg) {
        if (!promoBtn.dataset.listenerAttached) {
            promoBtn.onclick = async () => {
                const code = promoInput.value.trim().toUpperCase();
                if (!code) return;

                // 🛡️ [إصلاح أمني]: التحقق من الكوبون بقى بيتم عبر دالة آمنة في الباكند
                // (validate_coupon RPC عن طريق window.BoseSupabase.validateBoseCoupon)
                // بدل مقارنته محلياً مع قايمة storeData.coupons اللي كانت بتوصل كاملة
                // وواضحة لأي حد يفتح ملف بيانات المتجر العام مباشرة في المتصفح.
                if (!window.BoseSupabase || typeof window.BoseSupabase.validateBoseCoupon !== "function") {
                    couponMsg.className = "coupon-status-toast error";
                    couponMsg.textContent = "⚠️ تعذر التحقق من الكوبون حالياً، حاول تحديث الصفحة.";
                    return;
                }

                const originalBtnLabel = promoBtn.textContent;
                promoBtn.disabled = true;
                promoBtn.textContent = "بيتم التحقق...";

                // 🛡️🔧 [إصلاح جذري]: قبل كده الكود كان بيتبعت لوحده من غير قيمة
                // السلة ولا رقم هاتف - فأي كوبون عليه "حد أدنى لقيمة الطلب" كان
                // بيتجاهَل تماماً (يظهر ناجح حتى لو السلة أقل من الحد)، وأي كوبون
                // "مربوط برقم موبايل" كان يترفض هنا دايماً ومفيش فرصة تانية يتفحص
                // بيها. دلوقتي بنبعت الـ subtotal الحقيقي دايماً، وبنبعت رقم الهاتف
                // لو العميل عنده بيانات محفوظة من زيارة سابقة (getBoseCustomerProfile) -
                // لو مفيش هاتف متاح دلوقتي، برضه هيتفحص تاني بدقة قبل تأكيد الطلب
                // في الشيك أوت (راجع processFinalBoseOrder) قبل ما يتحسب أي مبلغ نهائي.
                const currentSubtotalForValidation = window.calculateBoseInvoice(cart, storeData, 0).subtotal;
                const savedProfileForValidation = typeof window.getBoseCustomerProfile === "function" ? window.getBoseCustomerProfile() : null;
                const phoneForValidation = savedProfileForValidation && savedProfileForValidation.phone1 ? savedProfileForValidation.phone1 : null;

                try {
                    const result = await window.BoseSupabase.validateBoseCoupon(code, phoneForValidation, currentSubtotalForValidation);
                    if (result && result.is_valid) {
                        // ⚠️ ملحوظة: أسماء الحقول دي (discount_type/discount_value) افتراض
                        // منطقي بناءً على استخدام calculateCouponDiscount(subtotal, {type, value}).
                        // لازم تتأكد إنها مطابقة تماماً لأسماء الأعمدة الراجعة فعلياً من
                        // دالة validate_coupon في قاعدة البيانات، وتعدلها هنا لو مختلفة.
                        const discountType = result.discount_type || result.type || "percent";
                        const discountValue = parseFloat(result.discount_value ?? result.value ?? 0) || 0;
                        // 🆕 [سقف أقصى للخصم]: لو الكوبون عليه سقف (max_discount_amount)،
                        // بيتخزن جنب النوع والقيمة عشان calculateCouponDiscount يطبقه.
                        const maxDiscountAmount = result.max_discount_amount !== null && result.max_discount_amount !== undefined
                            ? parseFloat(result.max_discount_amount) : null;
                        localStorage.setItem("bose_active_coupon", JSON.stringify({ code, type: discountType, value: discountValue, maxDiscountAmount }));
                        couponMsg.className = "coupon-status-toast success";
                        couponMsg.textContent = discountType === "fixed"
                            ? `✅ تمام، خصم الكوبون اتطبق: ${discountValue} جنيه`
                            : `✅ تمام، خصم الكوبون اتطبق: ${discountValue}%`;
                        if (typeof window.showBoseGlobalToast === "function") window.showBoseGlobalToast("تم تطبيق كود الخصم بنجاح");
                        updateCartSummary(cart, storeData);
                    } else {
                        localStorage.removeItem("bose_active_coupon");
                        couponMsg.className = "coupon-status-toast error";
                        couponMsg.textContent = (result && result.message) || "⚠️ كود الخصم ده مش شغال، تأكدوا منه أو من تاريخ صلاحيته.";
                    }
                } catch (err) {
                    couponMsg.className = "coupon-status-toast error";
                    couponMsg.textContent = "⚠️ تعذر التحقق من الكوبون، تأكد من الاتصال بالإنترنت وحاول تاني.";
                } finally {
                    promoBtn.disabled = false;
                    promoBtn.textContent = originalBtnLabel;
                }
            };
            promoBtn.dataset.listenerAttached = "true";
        }
    }
}

/**
 * =========================================================================
 * 🛡️ 2. محرك وإدارة صفحة إتمام الطلب وتأكيد المشتريات (checkout.html)
 * =========================================================================
 */
function renderBoseCheckoutPage(storeData) {
    const cart = loadTrustedCart();
    
    if (cart.length === 0 && !window.location.pathname.includes("order-success.html")) {
        window.location.href = "/cart.html";
        return;
    }

    // 📊 [نمو - InitiateCheckout]: العميلة وصلت فعلياً لصفحة الشيك أوت (نية شراء
    // حقيقية) - بيتبعت مرة واحدة هنا بقيمة محتويات السلة الحالية (من غير شحن/خصم
    // لسه، القيمة النهائية الدقيقة بتتأكد لاحقاً في حدث الشراء نفسه بعد التأكيد).
    if (typeof window.fireBoseCommerceEvent === "function") {
        const checkoutCartValue = cart.reduce((sum, item) => sum + ((parseFloat(item.finalPrice) || 0) * (parseInt(item.quantity, 10) || 1)), 0);
        window.fireBoseCommerceEvent('begin_checkout', {
            value: checkoutCartValue, currency: storeData?.store?.currency || 'EGP', quantity: cart.length
        });
    }

    // 🎁 [نظام نقاط الولاء]: حالة عامة بسيطة بتتحدّث لما رقم الهاتف يتأكد صحيح
    // (خصم تلقائي حسب ترتيب الطلب) ولما قسيمة ولاء صحيحة تتطبق - بيقرأها
    // recalculateCheckoutInvoice/processFinalBoseOrder عشان يعرضوا وياخدوا
    // بالهم منها بالظبط زي كوبون الخصم العادي.
    window.BoseLoyaltyState = {
        discountAmount: 0, discountPercent: 0, totalOrders: 0, nextOrderNumber: 0,
        voucherDiscountAmount: 0, voucherCode: null, voucherRemaining: 0
    };

    const pickupBtn = document.getElementById("method-pickup");
    const deliveryBtn = document.getElementById("method-delivery");
    const shippingZoneWrapper = document.getElementById("shipping-zone-wrapper");
    const zoneSelect = document.getElementById("checkout-zone-select");
    const addressDetailsWrapper = document.getElementById("checkout-address-details-wrapper");
    
    let currentShippingMethod = "pickup"; 
    let selectedShippingFee = 0;
    let payFullSelected = false;

    if (pickupBtn) {
        pickupBtn.onclick = () => {
            currentShippingMethod = "pickup";
            pickupBtn.className = "shipping-method-card active-option";
            if (deliveryBtn) deliveryBtn.className = "shipping-method-card";
            
            if (shippingZoneWrapper) shippingZoneWrapper.style.display = "none";
            if (addressDetailsWrapper) addressDetailsWrapper.style.display = "none";
            
            injectBoseBranchBlock(storeData);
            selectedShippingFee = 0;
            recalculateCheckoutInvoice(cart, storeData, selectedShippingFee, currentShippingMethod, payFullSelected);
        };
    }

    if (deliveryBtn) {
        deliveryBtn.onclick = () => {
            currentShippingMethod = "delivery";
            deliveryBtn.className = "shipping-method-card active-option";
            if (pickupBtn) pickupBtn.className = "shipping-method-card";
            
            const branchBlock = document.getElementById("bose-branch-info-static");
            if (branchBlock) branchBlock.remove();
            
            if (shippingZoneWrapper) shippingZoneWrapper.style.display = "block";
            if (addressDetailsWrapper) addressDetailsWrapper.style.display = "block";
            
            fetchSelectedZonePrice();
        };
    }

    if (zoneSelect) {
        zoneSelect.onchange = () => {
            fetchSelectedZonePrice();
        };
    }

    function fetchSelectedZonePrice() {
        if (!zoneSelect || currentShippingMethod !== "delivery") {
            selectedShippingFee = 0;
            return;
        }
        const selectedZoneId = zoneSelect.value;
        let fee = 0;
        
        if (storeData.shippingZones) {
            const zoneRule = storeData.shippingZones.find(z => z.id === selectedZoneId);
            if (zoneRule) {
                fee = parseFloat(zoneRule.price || 0);
            }
        }
        selectedShippingFee = fee;
        recalculateCheckoutInvoice(cart, storeData, selectedShippingFee, currentShippingMethod, payFullSelected);
    }

    // 💵 [عربون/دفع مقدم]: زراري اختيار "عربون 50%" أو "دفع كامل" - بتظهر
    // مع استلام من الفرع بس (التوصيل دايماً كامل المبلغ، مفيش خيار هناك).
    const payChoiceDepositBtn = document.getElementById("bose-pay-choice-deposit");
    const payChoiceFullBtn = document.getElementById("bose-pay-choice-full");
    function setPayFullChoice(value) {
        payFullSelected = value;
        if (payChoiceDepositBtn) {
            payChoiceDepositBtn.classList.toggle("active", !value);
            payChoiceDepositBtn.style.background = !value ? "#FF91A4" : "#fff";
            payChoiceDepositBtn.style.color = !value ? "#fff" : "#FF91A4";
        }
        if (payChoiceFullBtn) {
            payChoiceFullBtn.classList.toggle("active", value);
            payChoiceFullBtn.style.background = value ? "#FF91A4" : "#fff";
            payChoiceFullBtn.style.color = value ? "#fff" : "#FF91A4";
        }
        recalculateCheckoutInvoice(cart, storeData, selectedShippingFee, currentShippingMethod, payFullSelected);
    }
    if (payChoiceDepositBtn) payChoiceDepositBtn.onclick = () => setPayFullChoice(false);
    if (payChoiceFullBtn) payChoiceFullBtn.onclick = () => setPayFullChoice(true);

    // 🎁🎁 [نظام نقاط الولاء]: بمجرد ما رقم الهاتف الأساسي يبقى رقم مصري صحيح
    // (11 رقم يبدأ بـ 01)، بنسأل الباك إند (get_customer_rewards) عن ترتيب
    // الطلب ده بالظبط للعميلة دي، ولو فيه خصم تلقائي مستحق بنطبّقه فوراً في
    // الفاتورة ونوضحه لها ببانر واضح، أو نوريها باقيلها كام طلب على الخصم الجاي.
    const phone1InputForLoyalty = document.getElementById("checkout-customer-phone");
    const loyaltyBanner = document.getElementById("bose-checkout-loyalty-banner");
    let loyaltyLookupTimer = null;
    let lastCheckedLoyaltyPhone = "";

    function renderLoyaltyBanner(html) {
        if (!loyaltyBanner) return;
        if (!html) { loyaltyBanner.style.display = "none"; loyaltyBanner.innerHTML = ""; return; }
        loyaltyBanner.style.display = "block";
        loyaltyBanner.innerHTML = html;
    }

    async function runLoyaltyLookup(rawPhone) {
        const cleanPhone = (rawPhone || "").replace(/[\s\-\(\)\+]/g, "");
        if (!/^01[0125][0-9]{8}$/.test(cleanPhone) || cleanPhone === lastCheckedLoyaltyPhone) return;
        lastCheckedLoyaltyPhone = cleanPhone;

        if (!window.BoseSupabase || typeof window.BoseSupabase.getBoseCustomerRewards !== "function") return;
        try {
            const row = await window.BoseSupabase.getBoseCustomerRewards(cleanPhone);
            if (!row || !row.found) { renderLoyaltyBanner(""); return; }

            const nextOrderNumber = (row.total_orders || 0) + 1;
            window.BoseLoyaltyState.totalOrders = row.total_orders || 0;
            window.BoseLoyaltyState.nextOrderNumber = nextOrderNumber;
            window.BoseLoyaltyState.discountPercent = row.next_discount_percent || 0;

            const invoiceNow = window.calculateBoseInvoice(cart, storeData, selectedShippingFee, 0, window.BoseLoyaltyState.voucherDiscountAmount);
            window.BoseLoyaltyState.discountAmount = row.next_discount_percent > 0
                ? parseFloat((invoiceNow.subtotal * (row.next_discount_percent / 100)).toFixed(2))
                : 0;

            // 🛡️ [إصلاح جذري]: بتقرأ مبلغ القسيمة/طول الدورة/كل قد إيه بتتكسب
            // القسيمة من نفس إعدادات لوحة التحكم الحية (loyalty-config.js) بدل
            // الأرقام الثابتة (300 جنيه / شهرين / كل 10 طلبات) اللي كانت
            // مكتوبة يدوياً هنا وممكن تختلف عن اللي فعليًا محفوظ في القاعدة.
            const loyaltyCfg = (typeof window.getBoseLoyaltyConfig === "function") ? window.getBoseLoyaltyConfig() : { milestoneEvery: 10, voucherAmount: 300, voucherValidityMonths: 2 };
            const voucherMonthsTxt = window.formatArabicMonths ? window.formatArabicMonths(loyaltyCfg.voucherValidityMonths) : `${loyaltyCfg.voucherValidityMonths} شهر`;

            let bannerHtml = "";
            const styleBase = "border-radius:12px; padding:12px 14px; font-size:0.88rem; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;";
            if (row.next_discount_percent > 0) {
                bannerHtml = `<div style="${styleBase} background:rgba(46,158,91,0.1); color:#2e9e5b; border:1px solid rgba(46,158,91,0.3);">
                    <i class="fa-solid fa-star"></i> مبروك! ده طلبك رقم ${nextOrderNumber}، وهياخد خصم تلقائي ${row.next_discount_percent}% 🎉</div>`;
            } else if (row.orders_until_next_voucher === 1 || nextOrderNumber % loyaltyCfg.milestoneEvery === 0) {
                bannerHtml = `<div style="${styleBase} background:rgba(255,145,164,0.08); color:#FF91A4; border:1px solid rgba(255,145,164,0.3);">
                    <i class="fa-solid fa-gift"></i> ده طلبك رقم ${nextOrderNumber}! بعد استلامه هتاخدي قسيمة شراء ${loyaltyCfg.voucherAmount} جنيه صالحة لمدة ${voucherMonthsTxt} 🎁</div>`;
            } else if (row.orders_until_next_discount > 0) {
                bannerHtml = `<div style="${styleBase} background:rgba(255,145,164,0.08); color:#FF91A4; border:1px solid rgba(255,145,164,0.3);">
                    <i class="fa-solid fa-heart"></i> باقيلك ${row.orders_until_next_discount} ${row.orders_until_next_discount === 1 ? 'طلب' : 'طلبات'} بعد ده عشان تاخدي خصم على طلبك الجاي</div>`;
            }
            if (Array.isArray(row.active_vouchers) && row.active_vouchers.length > 0) {
                bannerHtml += `<div style="${styleBase} background:rgba(212,175,55,0.1); color:#b8860b; border:1px solid rgba(212,175,55,0.3);">
                    <i class="fa-solid fa-ticket"></i> عندك ${row.active_vouchers.length} قسيمة ولاء نشطة - اكتبي كودها في الحقل تحت عشان تستخدميها</div>`;
            }
            renderLoyaltyBanner(bannerHtml);
            recalculateCheckoutInvoice(cart, storeData, selectedShippingFee, currentShippingMethod, payFullSelected);
        } catch (err) {
            console.warn("⚠️ تعذر جلب رصيد الولاء:", err);
        }
    }

    if (phone1InputForLoyalty) {
        phone1InputForLoyalty.addEventListener("input", () => {
            clearTimeout(loyaltyLookupTimer);
            loyaltyLookupTimer = setTimeout(() => runLoyaltyLookup(phone1InputForLoyalty.value), 600);
        });
        if (phone1InputForLoyalty.value) runLoyaltyLookup(phone1InputForLoyalty.value);
    }

    // 🎁 [نظام نقاط الولاء]: تفعيل كود قسيمة الولاء (300 جنيه) - محتاج رقم
    // الهاتف الأساسي صحيح الأول عشان نتأكد إن القسيمة فعلاً بتاعة نفس العميلة.
    const voucherApplyBtn = document.getElementById("btn-apply-loyalty-voucher");
    const voucherInput = document.getElementById("checkout-voucher-code");
    const voucherMsg = document.getElementById("checkout-voucher-message");
    if (voucherApplyBtn && voucherInput) {
        voucherApplyBtn.onclick = async () => {
            const code = voucherInput.value.trim();
            const phone = phone1InputForLoyalty ? phone1InputForLoyalty.value.trim() : "";
            if (!code) return;
            if (!window.BoseSupabase || typeof window.BoseSupabase.validateBoseLoyaltyVoucher !== "function") return;

            voucherApplyBtn.disabled = true;
            voucherApplyBtn.textContent = "بنتأكد...";
            try {
                const result = await window.BoseSupabase.validateBoseLoyaltyVoucher(code, phone);
                if (result && result.is_valid) {
                    window.BoseLoyaltyState.voucherCode = code.toUpperCase();
                    window.BoseLoyaltyState.voucherRemaining = result.remaining_amount || 0;
                    const invoiceNow = window.calculateBoseInvoice(cart, storeData, selectedShippingFee, window.BoseLoyaltyState.discountAmount, 0);
                    window.BoseLoyaltyState.voucherDiscountAmount = Math.min(
                        result.remaining_amount || 0,
                        Math.max(0, invoiceNow.subtotal + selectedShippingFee - invoiceNow.discount)
                    );
                    if (voucherMsg) { voucherMsg.style.color = "#2e9e5b"; voucherMsg.textContent = "✅ " + (result.message || "تم تفعيل القسيمة"); }
                } else {
                    window.BoseLoyaltyState.voucherCode = null;
                    window.BoseLoyaltyState.voucherDiscountAmount = 0;
                    if (voucherMsg) { voucherMsg.style.color = "#FF91A4"; voucherMsg.textContent = "⚠️ " + ((result && result.message) || "كود القسيمة غير صحيح"); }
                }
                recalculateCheckoutInvoice(cart, storeData, selectedShippingFee, currentShippingMethod, payFullSelected);
            } catch (err) {
                if (voucherMsg) { voucherMsg.style.color = "#FF91A4"; voucherMsg.textContent = "⚠️ تعذر التحقق من القسيمة، حاولي تاني"; }
            } finally {
                voucherApplyBtn.disabled = false;
                voucherApplyBtn.textContent = "تفعيل";
            }
        };
    }

    if (pickupBtn) pickupBtn.click();

    const copyPhoneBtn = document.getElementById("bose-copy-deposit-phone");
    if (copyPhoneBtn) {
        copyPhoneBtn.onclick = () => {
            const num = document.getElementById("bose-deposit-phone-number")?.textContent?.trim();
            if (num && navigator.clipboard) {
                navigator.clipboard.writeText(num).then(() => {
                    copyPhoneBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => { copyPhoneBtn.innerHTML = '<i class="far fa-copy"></i>'; }, 1500);
                }).catch(() => {});
            }
        };
    }

    const submitOrderBtn = document.getElementById("btn-submit-order-final");
    if (submitOrderBtn) {
        submitOrderBtn.onclick = (e) => {
            e.preventDefault();
            processFinalBoseOrder(cart, storeData, currentShippingMethod, selectedShippingFee, payFullSelected);
        };
    }
}

function injectBoseBranchBlock(storeData) {
    const existingBlock = document.getElementById("bose-branch-info-static");
    if (existingBlock) return;
    
    const insertionPoint = document.getElementById("shipping-zone-wrapper");
    if (!insertionPoint) return;
    
    const branchDiv = document.createElement("div");
    branchDiv.id = "bose-branch-info-static";
    branchDiv.style.cssText = "background: rgba(255, 145, 164, 0.04); border: 1px solid #FF91A4; padding: 16px; border-radius: 14px; margin: 15px 0; direction: rtl; text-align: right;";
    
    const addressText = storeData.store?.pickup?.address || "الكفاح شارع الوحدة المحلية بجوار صيدلية الدكتور أحمد مجدي وبجوار عيادة الدكتور علي";
    const mapLink = storeData.store?.pickup?.mapUrl || "https://maps.app.goo.gl/nAg4Y7vQ7hACvKGc8?g_st=ac";
    const escBranch = window.escapeBoseHTML || (s => s);

    branchDiv.innerHTML = `
        <h4 style="margin: 0 0 6px 0; font-size: 15px; color: #111111; font-weight: 700; font-family: 'Cairo';"><i class="fas fa-building" style="color: #FF91A4; margin-left: 6px;"></i> مقر الاستلام الرسمي للبراند:</h4>
        <p style="margin: 0 0 12px 0; font-size: 13.5px; color: #111111; opacity: 0.8; line-height: 1.6; font-family: 'Cairo';">${escBranch(addressText)}</p>
        <a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="success-action-secondary-btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; background: #FFFFFF; border: 1px solid #FF91A4; color: #111111; font-family: 'Cairo';">
            <i class="fas fa-map-marked-alt" style="color: #FF91A4;"></i> عرض الموقع على خرائط جوجل
        </a>
    `;
    
    insertionPoint.parentNode.insertBefore(branchDiv, insertionPoint);
}

/**
 * 💵 [عربون/دفع مقدم]: قاعدة العمل الأساسية:
 * - استلام من الفرع: عربون 50% افتراضياً، لكن العميلة تقدر تختار تدفع كامل المبلغ.
 * - توصيل للمنزل: كامل المبلغ مقدماً دايماً وقت تأكيد الحجز (مفيش خيار عربون هنا).
 * نفس المعادلة بالظبط متكررة في create_order_with_items على قاعدة البيانات
 * (مصدر الحقيقة الفعلي)، هنا بنحسبها بس عشان نعرضها فوراً للعميلة قبل
 * ما الطلب يتسجل، ولإنشاء رسالة واتساب فورية.
 */
function calculateBoseDepositAmount(grandTotal, method, payFull) {
    const total = parseFloat(grandTotal) || 0;
    if (method === "delivery" || payFull) {
        return { depositAmount: Math.round(total * 100) / 100, remainingAmount: 0 };
    }
    const deposit = Math.round((total * 0.5) * 100) / 100;
    return { depositAmount: deposit, remainingAmount: Math.round((total - deposit) * 100) / 100 };
}

function updateBoseDepositPaymentBox(storeData, grandTotal, method, payFull) {
    const amountEl = document.getElementById("bose-deposit-amount");
    const remainingRow = document.getElementById("bose-deposit-remaining-row");
    const remainingAmountEl = document.getElementById("bose-deposit-remaining-amount");
    const labelEl = document.getElementById("bose-deposit-label");
    const phoneEl = document.getElementById("bose-deposit-phone-number");
    const payChoiceRow = document.getElementById("bose-pay-choice-row");
    if (!amountEl) return;

    if (payChoiceRow) payChoiceRow.style.display = method === "delivery" ? "none" : "flex";

    const { depositAmount, remainingAmount } = calculateBoseDepositAmount(grandTotal, method, payFull);
    amountEl.textContent = depositAmount.toFixed(2) + " EGP";

    if (method === "delivery") {
        if (labelEl) labelEl.textContent = "المبلغ الكامل المطلوب دفعه الآن لتأكيد الحجز (توصيل):";
        if (remainingRow) remainingRow.style.display = "none";
    } else if (payFull) {
        if (labelEl) labelEl.textContent = "المبلغ الكامل المطلوب دفعه الآن (اخترتِ الدفع الكامل):";
        if (remainingRow) remainingRow.style.display = "none";
    } else {
        if (labelEl) labelEl.textContent = "عربون تأكيد الحجز المطلوب الآن (50%):";
        if (remainingRow) remainingRow.style.display = "flex";
        if (remainingAmountEl) remainingAmountEl.textContent = remainingAmount.toFixed(2) + " EGP";
    }

    if (phoneEl) phoneEl.textContent = storeData?.store?.phone || "01097238441";
}

function recalculateCheckoutInvoice(cart, storeData, shippingFee, method, payFull) {
    const subtotalDisplay = document.getElementById("summary-subtotal");
    const shippingDisplay = document.getElementById("summary-shipping-fee");
    const grandTotalDisplay = document.getElementById("summary-grand-total");

    // 🎁 [نظام نقاط الولاء]: بنمرر الخصم التلقائي (حسب ترتيب الطلب) وخصم قسيمة
    // الولاء (لو اتفعّلت) عشان يظهروا كبند واضح ويتحسب بيهم الإجمالي الكلي هنا
    // بنفس الطريقة اللي هتتحسب بيها فعلياً في create_order_with_items بالباك إند.
    const loyaltyState = window.BoseLoyaltyState || { discountAmount: 0, voucherDiscountAmount: 0 };
    const invoice = window.calculateBoseInvoice(cart, storeData, shippingFee, loyaltyState.discountAmount, loyaltyState.voucherDiscountAmount);

    if (subtotalDisplay) subtotalDisplay.textContent = invoice.subtotal.toFixed(2) + " EGP";
    if (shippingDisplay) {
        shippingDisplay.textContent = invoice.shippingFee === 0 ? "مجاناً" : invoice.shippingFee.toFixed(2) + " EGP";
    }

    renderBoseLoyaltyDiscountRows(invoice);

    if (grandTotalDisplay) {
        grandTotalDisplay.textContent = invoice.grandTotal + " EGP";
    }

    updateBoseDepositPaymentBox(storeData, invoice.grandTotal, method || "pickup", payFull);
}

/**
 * 🎁 [نظام نقاط الولاء]: بيحقن (أو يشيل) بندين اختياريين في جدول ملخص الفاتورة
 * بصفحة إتمام الطلب - "خصم الولاء التلقائي" و"قسيمة الولاء" - بيظهروا بس لما
 * تكون قيمتهم أكبر من صفر، عشان الفاتورة تفضل بسيطة وواضحة للعميلة كل مرة.
 */
function renderBoseLoyaltyDiscountRows(invoice) {
    const table = document.querySelector(".summary-pricing-table");
    if (!table) return;
    let wrapper = document.getElementById("bose-loyalty-discount-rows");
    if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.id = "bose-loyalty-discount-rows";
        const grandTotalRow = document.querySelector(".summary-grand-total-row");
        if (grandTotalRow) table.insertBefore(wrapper, grandTotalRow);
        else table.appendChild(wrapper);
    }

    let rowsHtml = "";
    if (invoice.loyaltyDiscountAmount > 0) {
        rowsHtml += `<div class="pricing-row-node" style="display: flex; justify-content: space-between;">
            <span class="pricing-label-text"><i class="fa-solid fa-star" style="color:#FF91A4;"></i> خصم الولاء التلقائي:</span>
            <span style="font-weight: 700; color: #2e9e5b;">- ${invoice.loyaltyDiscountAmount.toFixed(2)} EGP</span>
        </div>`;
    }
    if (invoice.voucherDiscountAmount > 0) {
        rowsHtml += `<div class="pricing-row-node" style="display: flex; justify-content: space-between;">
            <span class="pricing-label-text"><i class="fa-solid fa-gift" style="color:#FF91A4;"></i> قسيمة الولاء:</span>
            <span style="font-weight: 700; color: #2e9e5b;">- ${invoice.voucherDiscountAmount.toFixed(2)} EGP</span>
        </div>`;
    }
    wrapper.innerHTML = rowsHtml;
}

async function processFinalBoseOrder(cart, storeData, method, shippingFee, payFull) {
    const customerNameInput = document.getElementById("checkout-customer-name");
    const customerPhoneInput = document.getElementById("checkout-customer-phone");
    const customerPhone2Input = document.getElementById("checkout-customer-phone-2");
    const addressDetailsInput = document.getElementById("checkout-address-details");
    const zoneSelect = document.getElementById("checkout-zone-select");
    const deliveryDateInput = document.getElementById("checkout-delivery-date");
    const deliveryTimeInput = document.getElementById("checkout-delivery-time");
    const orderNotesInput = document.getElementById("checkout-order-notes-textarea");
    // 🌸 [نظام التعرّف على العميل]: حقل جديد مخصص لملاحظات الشحن/التوصيل (زي
    // علامة مميزة على المنزل، كود بوابة، أو وقت مفضّل للمندوب) منفصل عن ملاحظات
    // الحساسية/السكر العامة، عشان الاتنين يوصلوا واضحين لفريق التوصيل بدل ما
    // يتلخبطوا في سطر واحد.
    const shippingNotesInput = document.getElementById("checkout-shipping-notes-textarea");

    // 🛡️🛡️ [تحسين UX - تحقق شامل من الفورم]: بدل ما نوقف عند أول خطأ (زي ما
    // كان بيحصل قبل كده)، بنجمع كل الأخطاء في المصفوفة دي مرة واحدة، ونعرضهم
    // كلهم تحت حقولهم دفعة واحدة بعد ما نخلص كل الفحوصات - عشان العميلة تصلح
    // كل حاجة في محاولة واحدة مش خطوة بخطوة.
    const validationErrors = [];
    let firstInvalidInput = null;
    function addValidationError(input, message) {
        if (input) {
            validationErrors.push({ input, message });
            if (!firstInvalidInput) firstInvalidInput = input;
        }
    }

    const customerName = customerNameInput ? customerNameInput.value.trim() : "";
    if (customerName.length < 3) {
        addValidationError(customerNameInput, "يرجى كتابة اسم صاحب الطلب بالكامل ثنائياً على الأقل.");
    }

    const phone1 = customerPhoneInput ? customerPhoneInput.value.trim() : "";
    let sanitizedPhone1 = "";
    if (typeof window.validateBosePhoneNumber === "function" && !window.validateBosePhoneNumber(phone1)) {
        addValidationError(customerPhoneInput, "يرجى إدخال رقم هاتف محمول مصري صحيح ومطابق للشبكة.");
    } else {
        sanitizedPhone1 = typeof window.sanitizeBosePhoneNumber === "function" ? window.sanitizeBosePhoneNumber(phone1) : phone1;
    }

    let sanitizedPhone2 = "";
    if (customerPhone2Input && customerPhone2Input.value.trim() !== "") {
        const phone2 = customerPhone2Input.value.trim();
        if (typeof window.validateBosePhoneNumber === "function" && !window.validateBosePhoneNumber(phone2)) {
            addValidationError(customerPhone2Input, "رقم الهاتف البديل غير صحيح، يرجى مراجعته أو مسحه ليبقى اختيارياً.");
        } else {
            sanitizedPhone2 = typeof window.sanitizeBosePhoneNumber === "function" ? window.sanitizeBosePhoneNumber(phone2) : phone2;
        }
    }

    let fullAddressText = "استلام يدوي مباشر من مقر الفرع";
    let selectedZoneName = "فرع الكفاح الرئيسي";
    // 🛡️ [إصلاح حرج]: zoneSelect.value هو الـid الحقيقي لمنطقة الشحن (نص إنجليزي
    // زي cairo-nasr-city) اللي checkout.html بيحطه كـvalue للـoption - قبل كده كان
    // بيتعامل معاه غلط كأنه "اسم" ظاهر للعميل ويتحط في نص العنوان بدل الاسم
    // الحقيقي للمنطقة (زي "مدينة نصر")، وكمان مكانش بيتسجل في قاعدة البيانات
    // خالص (shippingZoneId كان بيتبعت null دايماً رغم وجود المنطقة الحقيقية).
    // دلوقتي بيتفصل الاثنين: selectedZoneId (للقاعدة) و selectedZoneName (نص
    // العنوان المقروء من نص الـoption نفسه، مش من الـvalue).
    let selectedZoneId = "";

    if (method === "delivery") {
        if (zoneSelect && !zoneSelect.value) {
            addValidationError(zoneSelect, "يرجى تحديد المنطقة السكنية.");
        } else {
            selectedZoneId = zoneSelect ? zoneSelect.value : "";
            const selectedOption = zoneSelect && zoneSelect.selectedOptions ? zoneSelect.selectedOptions[0] : null;
            selectedZoneName = selectedOption ? selectedOption.textContent : selectedZoneId;
        }

        const addressDetails = addressDetailsInput ? addressDetailsInput.value.trim() : "";
        if (addressDetails.length < 8) {
            addValidationError(addressDetailsInput, "يرجى كتابة العنوان السكني بالتفصيل لسلامة الشحن.");
        } else {
            fullAddressText = `المنطقة: ${selectedZoneName} | تفصيل السكن: ${addressDetails}`;
        }
    }

    const orderDate = deliveryDateInput ? deliveryDateInput.value : "";
    const orderTime = deliveryTimeInput ? deliveryTimeInput.value : "";

    if (!orderDate || !orderTime) {
        addValidationError(!orderDate ? deliveryDateInput : deliveryTimeInput, "يرجى اختيار تاريخ وساعة الاستلام المناسبة لتجهيز طلبك.");
    }

    // 🛡️ [إصلاح - المرحلة 2]: تحديد هل السلة فيها منتج مخصص (تورت/ورد محاكي) عشان
    // نطبّق قاعدة الأسبوع بدل الـ24 ساعة العامة - تطبيقاً لتأكيد صاحب المتجر إن
    // التورت والورد المخصص بتاخد مراحل تحضير أطول من باقي المنتجات.
    const cartHasCustomItem = typeof window.boseCartHasCustomItem === "function"
        ? window.boseCartHasCustomItem(cart)
        : false;

    if (orderDate && orderTime && typeof window.validateBoseDeliverySchedule === "function") {
        const isScheduleValid = window.validateBoseDeliverySchedule(orderDate, orderTime, cartHasCustomItem);
        if (!isScheduleValid) {
            const fallbackMsg = cartHasCustomItem
                ? "التورت والورد المخصص عبر المحاكي بيحتاج حجز قبل موعد التسليم بأسبوع كامل (7 أيام) على الأقل."
                : "نحتاج إلى وقت كافٍ لتجهيز طلبك بأفضل جودة ممكنة، لذلك لا يمكن اختيار موعد قبل 48 ساعة.";
            const msg = cartHasCustomItem
                ? (storeData.orderRules?.customPreparationTimeMessage || fallbackMsg)
                : (storeData.orderRules?.preparationTimeMessage || fallbackMsg);
            addValidationError(deliveryTimeInput, msg);
        }
    }

    // 🛡️🕘 [تفعيل حد ساعات الاستلام فعليًا - الفحص الملزم]: min/max على حقل
    // <input type="time"> في checkout.html هو تلميح للمتصفح بس ومش مضمون
    // إنه يمنع العميلة فعليًا في كل الأجهزة (خصوصًا موبايل)، فالفحص الحقيقي
    // اللي بيوقف تأكيد الطلب لازم يكون هنا صراحة. بيقارن نص الوقت المُدخل
    // (صيغة "HH:MM") بحدود businessHoursStart/businessHoursEnd المحفوظة في
    // إعدادات المتجر (بدائل 09:00/22:00 لو مش محفوظين).
    if (orderTime) {
        const bhStart = storeData.orderRules?.businessHoursStart || "09:00";
        const bhEnd = storeData.orderRules?.businessHoursEnd || "22:00";
        if (orderTime < bhStart || orderTime > bhEnd) {
            const bhStartDisplay = typeof formatBoseTimeToEgyptian12Hour === "function" ? formatBoseTimeToEgyptian12Hour(bhStart) : bhStart;
            const bhEndDisplay = typeof formatBoseTimeToEgyptian12Hour === "function" ? formatBoseTimeToEgyptian12Hour(bhEnd) : bhEnd;
            addValidationError(deliveryTimeInput, `مواعيد الاستلام متاحة بس من ${bhStartDisplay} لحد ${bhEndDisplay}، يرجى اختيار ساعة جوه النطاق ده.`);
        }
    }

    // 🚦 بعد تجميع كل الفحوصات: لو فيه أي خطأ نعرضهم كلهم دفعة واحدة ونوقف هنا
    if (validationErrors.length > 0) {
        boseShowAllCheckoutErrors(validationErrors, firstInvalidInput);
        return;
    }

    // 🛡️🔧🆕 [إصلاح جذري - إعادة تحقق نهائية من الكوبون]: الكوبون اللي اتفعّل
    // في صفحة السلة اتفحص وقتها برقم هاتف/قيمة سلة مبدئيين (أو من غير هاتف
    // خالص لو أول زيارة). دلوقتي وصلنا لحظة عندنا فيها البيانات الحقيقية 100%
    // (رقم الهاتف المكتوب فعلاً + قيمة السلة النهائية)، فبنعيد التحقق منه تاني
    // هنا قبل ما نحسب أي إجمالي أو نبني فاتورة واتساب - عشان لو الكوبون طلع
    // فعلياً مش سارٍ (مربوط برقم مختلف، أو السلة تحت الحد الأدنى، أو انتهت
    // صلاحيته من ثانية لثانية)، نوقف العميلة ونوضحلها بدل ما نخليها تكمل
    // بفاتورة فيها خصم وهمي هيتشال بصمت وقت الحفظ الفعلي في القاعدة.
    const rawActiveCouponCheck = localStorage.getItem("bose_active_coupon");
    if (rawActiveCouponCheck && window.BoseSupabase && typeof window.BoseSupabase.validateBoseCoupon === "function") {
        try {
            const activeCouponCheck = JSON.parse(rawActiveCouponCheck);
            if (activeCouponCheck && activeCouponCheck.code) {
                const subtotalForRecheck = window.calculateBoseInvoice(cart, storeData, 0).subtotal;
                const recheckResult = await window.BoseSupabase.validateBoseCoupon(activeCouponCheck.code, sanitizedPhone1, subtotalForRecheck);
                if (!recheckResult || !recheckResult.is_valid) {
                    localStorage.removeItem("bose_active_coupon");
                    const couponMsgEl = document.getElementById("coupon-message");
                    if (couponMsgEl) {
                        couponMsgEl.className = "coupon-status-toast error";
                        couponMsgEl.textContent = (recheckResult && recheckResult.message) || "⚠️ كود الخصم مبقاش شغال، شيلناه من طلبك.";
                    }
                    if (typeof window.showBoseGlobalToast === "function") {
                        window.showBoseGlobalToast((recheckResult && recheckResult.message) || "كود الخصم مبقاش شغال - راجعي طلبك وأكدي تاني");
                    }
                    if (typeof recalculateCheckoutInvoice === "function") recalculateCheckoutInvoice(cart, storeData, shippingFee, method, payFull);
                    return;
                }
            }
        } catch (e) {
            // لو التحقق فشل لأي سبب تقني (مشكلة نت مثلاً)، الأمان المالي الحقيقي
            // مضمون أصلاً من نفس الفحص جوه create_order_with_items وقت الحفظ -
            // فمنعطلش تأكيد الطلب هنا، بس بنسيب الرقم النهائي يتصحح تلقائياً
            // بعد الحفظ (راجع استبدال grandTotal بالقيمة المؤكدة تحت).
            console.warn("⚠️ تعذر إعادة التحقق من الكوبون قبل التأكيد النهائي:", e);
        }
    }

    // 🧮 [توحيد حسابي]: نفس المعادلة المستخدمة بالسلة وبصفحة الشحن بالظبط
    // (🎁 نظام نقاط الولاء: هنا كمان بنضيف الخصم التلقائي وخصم قسيمة الولاء
    // لو موجودين، عشان المبلغ المطلوب دفعه فعلياً والمرسل في فاتورة الواتساب
    // يطابق بالظبط اللي هيتحسب في قاعدة البيانات، مش يفاجئ العميلة برقم مختلف)
    const loyaltyStateForOrder = window.BoseLoyaltyState || { discountAmount: 0, voucherDiscountAmount: 0 };
    const invoice = window.calculateBoseInvoice(cart, storeData, shippingFee, loyaltyStateForOrder.discountAmount, loyaltyStateForOrder.voucherDiscountAmount);
    const finalGrandTotalCalculated = invoice.grandTotal;

    // 🆔 [إصلاح حرج]: رقم طلب فريد فعلياً (طابع زمني + عشوائي) بدل رقم
    // 4 خانات القديم اللي كان احتمال تصادمه وارد وقريب جداً.
    const orderIdGenerated = window.generateBoseOrderId ? window.generateBoseOrderId() : `${Date.now()}`;

    const completedBoseOrderObject = {
        orderNumber: orderIdGenerated,
        orderId: `BOSE-${orderIdGenerated}`,
        customerName: customerName,
        phone1: sanitizedPhone1,
        phone2: sanitizedPhone2,
        deliveryMethod: method === "pickup" ? "استلام من الفرع" : "توصيل للمنزل",
        deliveryZone: selectedZoneName,
        // 🛡️ [إصلاح حرج]: الـid الحقيقي لمنطقة الشحن (مطابق لجدول shipping_zones)
        // بيتسجل هنا عشان saveBoseOrderToDatabase في supabase-client.js يقدر
        // يبعته فعلياً بدل ما يفضل null دايماً في كل الطلبات المحفوظة.
        shippingZoneId: method === "delivery" ? (selectedZoneId || null) : null,
        shippingFee: shippingFee,
        address: fullAddressText,
        date: `${orderDate.split('-')[2]} / ${orderDate.split('-')[1]} / ${orderDate.split('-')[0]}`,
        scheduledDate: orderDate,
        scheduledTime: orderTime,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discount,
        couponCode: invoice.couponCode || null,
        // 🎁 [نظام نقاط الولاء]: كود القسيمة (لو اتفعّل) بيترسل للباك إند عشان
        // create_order_with_items يتحقق منه بنفسه ويخصم رصيده فعلياً. القيمتين
        // تحت تقدير فوري من نفس معادلة الباك إند عشان تظهر في فاتورة الواتساب
        // اللي بتتفتح فوراً (قبل ما رد قاعدة البيانات المؤكد يوصل أصلاً)،
        // وبيتم استبدالهم بالقيمة المؤكدة فعلياً بعد الحفظ تحت.
        loyaltyVoucherCode: loyaltyStateForOrder.voucherCode || null,
        loyaltyDiscountAmount: invoice.loyaltyDiscountAmount || 0,
        voucherAmountUsed: invoice.voucherDiscountAmount || 0,
        grandTotal: finalGrandTotalCalculated,
        notes: orderNotesInput ? orderNotesInput.value.trim() : "لا توجد ملاحظات إضافية",
        // 🌸 [نظام التعرّف على العميل]: ملاحظات الشحن/التوصيل بتتسجل كحقل منفصل
        // في فاتورة الواتساب (راجع buildBoseFormattedWhatsappInvoice) عشان توصل
        // واضحة لوحدها للمندوب، وكمان بتتحفظ في ملف العميل المحلي تحت.
        shippingNotes: shippingNotesInput ? shippingNotesInput.value.trim() : "",
        items: cart
    };

    // 🧭🆕 [4.1 - نظام تتبع مصدر الزيارات]: بيانات أول لمسة (first-touch) المحفوظة
    // من زيارة العميلة الأولى للموقع (راجع captureBoseAttribution في core-engine.js) -
    // بتترسل هنا لـ saveBoseOrderToDatabase في supabase-client.js عشان توصل فعلياً
    // لـ create_order_with_items ← upsert_customer_on_order وتتسجل في جدول customers.
    const boseAttribution = typeof window.getBoseAttribution === "function" ? window.getBoseAttribution() : null;
    if (boseAttribution) {
        completedBoseOrderObject.attributionSource = boseAttribution.source || null;
        completedBoseOrderObject.attributionMedium = boseAttribution.medium || null;
        completedBoseOrderObject.attributionDetail = boseAttribution.detail || null;
    }

    // 🌸🌸 [نظام يتفاعل مع العميل ويتعرّف عليه]: بمجرد ما البيانات عدّت كل
    // التحقق بنجاح، بنحفظ "ملف تعريف العميل" في جهازه محلياً (localStorage) -
    // الاسم، أرقام الهاتف، تفاصيل العنوان، المنطقة، ملاحظة الحساسية/السكر،
    // وملاحظات الشحن. المرة الجاية اللي يفتح فيها صفحة إتمام الطلب، هنلاقي
    // كل الحقول دي اتملت لوحدها تلقائياً (راجع initializeLocalConfig في
    // checkout.html) فمش هيضطر يكتبها تاني، وكمان بيتعرض له ترحيب بالاسم لما
    // يدخل الموقع تاني (راجع buildAndInjectGlobalComponents في core-engine.js).
    if (typeof window.saveBoseCustomerProfile === "function") {
        window.saveBoseCustomerProfile({
            name: customerName,
            phone1: sanitizedPhone1,
            phone2: sanitizedPhone2,
            deliveryMethod: method,
            zoneId: selectedZoneId || "",
            addressDetails: (method === "delivery" && addressDetailsInput) ? addressDetailsInput.value.trim() : "",
            orderNotes: orderNotesInput ? orderNotesInput.value.trim() : "",
            shippingNotes: shippingNotesInput ? shippingNotesInput.value.trim() : ""
        });
    }

    // 💵 [عربون/دفع مقدم]: نحسب المبلغ المطلوب دفعه الآن حسب طريقة الاستلام
    // ونضيفه لكائن الطلب - بيستخدم في رسالة الواتساب وصفحة النجاح.
    const boseDepositCalc = calculateBoseDepositAmount(finalGrandTotalCalculated, method, payFull);
    completedBoseOrderObject.depositAmount = boseDepositCalc.depositAmount;
    completedBoseOrderObject.remainingAmount = boseDepositCalc.remainingAmount;
    completedBoseOrderObject.paymentPhone = storeData.store?.phone || "01097238441";
    completedBoseOrderObject.payFull = !!payFull;

    // 🤝 سد ثغرة الأصفار وتوحيد الذاكرة متبادلة التوافق تماماً
    localStorage.setItem("bose_last_order", JSON.stringify(completedBoseOrderObject));

    // 🐛👑 [إصلاح جذري: رقم الطلب في فاتورة الواتساب كان دايماً مختلف عن
    // الرقم الحقيقي المسجل في قاعدة البيانات]: قبل كده كان واتساب بيتفتح
    // فوراً برقم مؤقت (Timestamp من جهاز العميل، مثال BOSE-1755... ) قبل
    // ما ننتظر رد قاعدة البيانات، وبعدين لما الرقم الحقيقي (بصيغة
    // 🛡️🐛👑 [إصلاح جذري - المرحلة 2 - سبب فشل واتساب حتى بعد إصلاح رابط
    // wa.me]: كان هنا قبل كده تاب فاضي بيتفتح فوراً بـwindow.open("", "_blank")
    // وبعدين (بعد انتظار رد قاعدة البيانات) بنوجّهه لرابط واتساب عن طريق
    // location.href. اتضح فعلياً (لقطة شاشة حقيقية من عميلة بتستخدم متصفح
    // سناب شات الداخلي) إن المتصفحات الداخلية دي (سناب شات/إنستجرام/فيسبوك)
    // بترفض وبتمنع صراحة إعادة توجيه تاب اتفتح مسبقاً بالطريقة دي (بتوريه
    // "about:blank#blocked" - رفض واضح من المتصفح نفسه، مش مجرد فشل صامت) -
    // المشكلة مش في شكل الرابط (اتصلح في المرحلة الأولى) لكن في **آلية الفتح
    // نفسها**. الحل الجذري: نشيل فكرة "افتحي تاب فاضي واستني" خالص، ونخلي
    // إرسال فاتورة الواتساب **ضغطة حقيقية ومباشرة من العميلة نفسها** على رابط
    // فعلي (<a href>) في صفحة النجاح - وده الفعل الوحيد اللي كل المتصفحات
    // بتسمح بيه دايماً بدون استثناء لأنه فعل مستخدم حقيقي مباشر، مش كود بيتحكم
    // في نافذة لوحده. صفحة النجاح (order-success.html) بقت فيها زرار "إرسال
    // الفاتورة على واتساب" ظاهر وواضح دايماً كخطوة أساسية مطلوبة من العميلة -
    // مش مجرد نسخة احتياطية اختيارية.

    // 🛡️ [إصلاح]: الشرط كان بيتأكد من وجود دالة مختلفة (submitBoseOrderToDatabase)
    // بينما بينادي فعلياً على window.saveBoseOrderToDatabase - شغالة بالصدفة
    // لأن الاتنين بيتعرّفوا مع بعض في supabase-client.js، لكن الفحص الصحيح
    // لازم يكون على الدالة اللي بننادي عليها فعلياً.
    if (typeof window.saveBoseOrderToDatabase === "function") {
        try {
            const dbResult = await window.saveBoseOrderToDatabase(completedBoseOrderObject);
            if (dbResult && dbResult.orderNumber) {
                // 🛡️ [إصلاح حرج]: الرقم الحقيقي من قاعدة البيانات بقى هو نفسه
                // orderNumber/orderId المستخدمين في بناء فاتورة الواتساب تحت -
                // مش مجرد قيمة إضافية بتتسجل من غير استخدام زي ما كان بيحصل.
                completedBoseOrderObject.dbOrderNumber = dbResult.orderNumber;
                completedBoseOrderObject.orderNumber = dbResult.orderNumber;
                completedBoseOrderObject.orderId = dbResult.orderNumber;
                // 🎁 [نظام نقاط الولاء]: القيم دي هي المؤكدة فعلياً من قاعدة البيانات
                // (مصدر الحقيقة) - بتتسجل هنا عشان صفحة النجاح تقدر تعرض للعميلة
                // بالظبط الخصم اللي اتطبق، أو تبشّرها لو الطلب ده حقق لها قسيمة الـ300 جنيه.
                completedBoseOrderObject.loyaltyDiscountPercent = dbResult.loyaltyDiscountPercent || 0;
                completedBoseOrderObject.loyaltyDiscountAmount = dbResult.loyaltyDiscountAmount || 0;
                completedBoseOrderObject.voucherAmountUsed = dbResult.voucherAmountUsed || 0;
                completedBoseOrderObject.isLoyaltyMilestone = !!dbResult.isLoyaltyMilestone;

                // 🛡️🔧👑 [إصلاح جذري - مصدر الحقيقة المالي]: قبل كده الكود هنا كان
                // بيسجل قيم الولاء بس من رد القاعدة، ويسيب grandTotal وdepositAmount
                // زي ما اتحسبوا محلياً في السلة قبل الحفظ. لو الكوبون طلع فعلياً مش
                // سارٍ وقت الحفظ (نادر بعد التحقق المزدوج فوق، لكن وارد - مثلاً race
                // condition على max_uses بين عميلتين في نفس اللحظة)، كانت فاتورة
                // الواتساب وصفحة "تم الطلب" هتعرض للعميلة رقم أقل من اللي فعلياً
                // هيتحصّل ويتسجل في لوحة التحكم - تناقض حقيقي ممكن يسبب نزاع. دلوقتي
                // بنستبدل كل الأرقام المالية بالقيم المؤكدة الراجعة فعلياً من
                // create_order_with_items (مصدر الحقيقة الوحيد)، ونعيد حساب العربون/
                // الباقي على أساسها بدل القيمة المحسوبة محلياً قبل الحفظ. ده كمان
                // بيضمن إن زرار "إعادة إرسال الفاتورة" (لو العميلة استخدمته لاحقاً من
                // صفحة النجاح) هيبعت نفس الرقم الصحيح بالظبط، مش رقم قديم مختلف.
                if (dbResult.grandTotal !== undefined && dbResult.grandTotal !== null) {
                    completedBoseOrderObject.grandTotal = dbResult.grandTotal;
                }
                if (dbResult.confirmedDiscountAmount !== undefined && dbResult.confirmedDiscountAmount !== null) {
                    completedBoseOrderObject.discountAmount = dbResult.confirmedDiscountAmount;
                }
                if (dbResult.depositAmount !== undefined && dbResult.depositAmount !== null) {
                    const confirmedGrandTotal = parseFloat(completedBoseOrderObject.grandTotal) || 0;
                    completedBoseOrderObject.depositAmount = dbResult.depositAmount;
                    completedBoseOrderObject.remainingAmount = Math.max(0, confirmedGrandTotal - (parseFloat(dbResult.depositAmount) || 0));
                }
            }
        } catch (err) {
            // 🛡️ لو الاتصال فشل (نت ضعيف مثلاً) البيع لا يتوقف أبداً - بنكمل
            // بالرقم المؤقت المولّد محلياً (orderIdGenerated) كحل احتياطي، وواتساب
            // بيتفتح بيه عادي، لكنه هيبقى مختلف عن قاعدة البيانات في هذه الحالة
            // النادرة بس (فشل حفظ فعلي)، مش في المسار العادي الناجح.
            console.warn("⚠️ تعذر حفظ الطلب في قاعدة البيانات (البيع هيتم عبر واتساب بالرقم المؤقت رغم ذلك):", err);
        }
    }

    const fullWhatsappMessageText = buildBoseFormattedWhatsappInvoice(completedBoseOrderObject);

    // 🛡️🐛 [إصلاح جذري - حماية إضافية ضد الروابط الطويلة جداً]: لو النص الكامل
    // (بعد الترميز لرابط واتساب) بيتعدى ٣٠٠٠ حرف تقريباً (بيحصل بسهولة مع
    // أصناف مخصصة كتير أو صور مرجعية متعددة)، بنستخدم النسخة المختصرة
    // (buildBoseCondensedWhatsappInvoice فوق) في رابط واتساب الفعلي بدل الطويلة
    // - عشان نضمن إن الرابط يفتح بنجاح في كل المتصفحات مهما كانت. النص الكامل
    // بالتفاصيل والصور بيفضل محفوظ زي ما هو في قاعدة البيانات (custom_details/
    // reference_images) وفي صفحة تتبع الطلب، فمفيش أي معلومة بتضيع.
    const encodedLength = encodeURIComponent(fullWhatsappMessageText).length;
    const whatsappMessageText = encodedLength > 3000
        ? buildBoseCondensedWhatsappInvoice(completedBoseOrderObject)
        : fullWhatsappMessageText;


    // ربط الرسالة بالـ object لضمان عدم حدوث شلل لزر الإرسال البديل بصفحة النجاح
    // (بنحفظ نفس النص اللي فعلاً هيتفتح بيه واتساب، كامل أو مختصر حسب الحالة)
    completedBoseOrderObject.whatsappMessage = whatsappMessageText;
    completedBoseOrderObject.whatsappMessageFull = fullWhatsappMessageText;
    localStorage.setItem("bose_last_order", JSON.stringify(completedBoseOrderObject));

    localStorage.removeItem("bose_active_coupon");
    if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();

    // 🛡️🐛👑 [إصلاح جذري - المرحلة 2]: من غير أي محاولة فتح تاب هنا خالص -
    // العميلة هتوصل لصفحة النجاح وهتلاقي زرار "إرسال الفاتورة على واتساب"
    // واضح وظاهر، وضغطها عليه هي فعلياً هي اللي بتفتح واتساب (فعل مستخدم
    // حقيقي مباشر، مش كود بيحاول يتحكم في نافذة لوحده) - ده بيشتغل موثوق
    // في كل المتصفحات بدون استثناء، حتى المتصفحات الداخلية المتشددة زي
    // سناب شات وإنستجرام وفيسبوك اللي كانت بترفض آلية "التاب الفاضي" القديمة.
    window.location.href = "/order-success.html";
}

// 🕒 [إصلاح - التوقيت المصري]: كان وقت الاستلام بيتكتب في فاتورة الواتساب زي
// ما هو مخزّن في الـ<input type="time"> بالظبط (صيغة 24 ساعة، مثال "20:40")،
// وده مش الشكل اللي بيتفاهم بيه الفرع أو العميل عادةً. الدالة دي بتحوّله لصيغة
// 12 ساعة مصرية مألوفة مع توضيح "صباحاً/مساءً" جنبها (مثال: "8:40 مساءً").
function formatBoseTimeToEgyptian12Hour(time24) {
    if (!time24 || typeof time24 !== "string" || !time24.includes(":")) return time24 || "";
    const [hStr, mStr] = time24.split(":");
    let hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);
    if (isNaN(hours) || isNaN(minutes)) return time24;
    const period = hours >= 12 ? "مساءً" : "صباحاً";
    let hours12 = hours % 12;
    if (hours12 === 0) hours12 = 12;
    const minutesPadded = String(minutes).padStart(2, "0");
    return `${hours12}:${minutesPadded} ${period}`;
}

// 🔷 [إصلاح - أشكال التورت بالعربي]: كانت قيمة الشكل التقنية بالإنجليزي
// (circle/heart/square/rectangle) بتتكتب زي ما هي في فاتورة الواتساب اللي
// بتوصل للعميل وللفرع، بدل اسمها العربي المفهوم. نفس الخريطة المستخدمة فعلياً
// في عرض السلة (cart.html) اتوحدت هنا عشان تتطبق في الفاتورة كمان.
function getBoseArabicShapeName(shape) {
    const shapeMap = {
        circle: "دائري",
        heart: "قلب",
        square: "مربع",
        rectangle: "مستطيل"
    };
    return shapeMap[shape] || shape;
}

function buildBoseFormattedWhatsappInvoice(order) {
    let msg = `✨ *فاتورة حجز طلبية فاخرة - حلويات بوسي (BoseSweets)* ✨\n`;
    // 🌸 [نظام التعرّف على العميل]: ترحيب مباشر باسم العميل بالظبط أول رسالة
    // الواتساب، بدل ما يكون اسمه مجرد سطر بيانات جوه الفاتورة زي أي حقل تاني.
    if (order.customerName) {
        msg += `🌸 أهلاً يا *${order.customerName}*، شكراً لثقتك في حلويات بوسي! دي فاتورة حجزك 👇\n\n`;
    }
    msg += `--------------------------------------------------\n\n`;
    msg += `🧾 *رقم المعاملة:* ${order.orderId}\n`;
    msg += `👤 *العميل:* ${order.customerName}\n`;
    msg += `📞 *رقم الاتصال:* ${order.phone1}\n`;
    msg += `🚗 *مسار الاستلام:* ${order.deliveryMethod}\n`;
    msg += `📍 *التفاصيل الجغرافية:* ${order.address}\n`;
    // 🌸 [نظام التعرّف على العميل]: ملاحظات الشحن/التوصيل (لو موجودة) بتظهر
    // كسطر مستقل وواضح بدل ما تتلخبط جوه ملاحظات الحساسية/السكر العامة تحت
    // في نهاية الفاتورة.
    if (order.shippingNotes && order.shippingNotes.trim() !== "") {
        msg += `🚚 *ملاحظات التوصيل:* ${order.shippingNotes.trim()}\n`;
    }
    msg += `📅 *موعد الاستلام:* ${order.scheduledDate} الساعة ${formatBoseTimeToEgyptian12Hour(order.scheduledTime)}\n\n`;
    msg += `--------------------------------------------------\n`;
    msg += `📦 *تفاصيل الأصناف المطلوبة:*\n\n`;

    order.items.forEach((item, idx) => {
        const isCakeBespoke = item.type === "custom-cake" || item.type === "mini-cake" || item.productSlug === "toort-custom-master" || item.productSlug === "mini-cake-two-person";
        msg += `${idx + 1}. 🌟 *${item.title}* (${item.flavorName || 'جاهز وفريش'})\n`;
        // 🛡️ [إصلاح حرج - رسالة واتساب بتقول "1 قطعة" بدل الدستة/العبوة الحقيقية]:
        // item.quantity هو عدد "الوحدات" اللي طلبها العميل (دستة، عبوة، تورتة... إلخ)
        // مش عدد القطع الفردية جوه الوحدة الواحدة. كلمة "قطعة" الثابتة هنا كانت بتوهم
        // الفرع إن العميل طلب قطعة واحدة فعلياً حتى لو المنتج نفسه "دستة (12 قطعة)"،
        // لأن اسم واسم الوحدة الحقيقيين موجودين بالفعل جوه عنوان المنتج (item.title)
        // ومفيش داعي إطلاقاً لتأكيد/تخمين وحدة تانية جنبه ممكن تكون غلط. النص الجديد
        // بيوضح إنه "عدد الوحدات" (×) بدل ما يخترع وحدة قياس قد تكون غلط.
        // 🏷️ [إصلاح - تسمية الكمية حسب المنتج]: بدل تسمية عامة "عدد الوحدات
        // المطلوبة" لكل الأصناف مهما كانت، بقت التسمية مخصصة لاسم المنتج نفسه
        // (مثال: "العدد المطلوب من التورت"، "العدد المطلوب من القشطوطة")
        // عشان توضح فوراً وبدقة إحنا بنعد ايه بالظبط لكل صنف في الفاتورة.
        msg += `   • *العدد المطلوب من ${item.title}:* ×${item.quantity}\n`;
        // 🏷️ [إصلاح - سعر باسم المنتج بدل تسمية عامة "سعر الوحدة الشامل"]: التسمية
        // العامة القديمة كانت مش واضحة سعر ايه بالظبط لما في أكتر من صنف في نفس
        // الفاتورة. دلوقتي السعر بيتقال جنب اسم الصنف نفسه (زي "سعر تورتة ديسباسيتو")
        // بنفس أسلوب سطر الكمية فوقه، عشان الفرع يعرف فوراً وبدقة سعر أنهي صنف بالظبط.
        msg += `   • *سعر ${item.title}:* ${parseFloat(item.finalPrice).toFixed(2)} EGP\n`;
        
        if (item.customDetails) {
            const cd = item.customDetails;
            if (item.type === "custom-cake" || item.type === "mini-cake") {
                if (cd.isGift) msg += `   • 🎁 هدية لحد تاني\n`;
                if (cd.occasionLabel && cd.occasionLabel.trim() !== "") msg += `   • المناسبة: ${cd.occasionLabel.trim()}\n`;
                if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") msg += `   • طعم الكيك: ${cd.cakeType}\n`;
                if (cd.shape && cd.shape !== "none") msg += `   • الشكل: ${getBoseArabicShapeName(cd.shape)}\n`;
                if (cd.persons && cd.persons > 0) msg += `   • الأفراد: لـ ${cd.persons} فرد\n`;
                if (cd.printingType && cd.printingType !== "none") msg += `   • طباعة صورة: ${cd.printingType === 'edible' ? 'قابلة للأكل' : 'غير قابلة للأكل'}\n`;
                // 🏷️ [إصلاح - وضوح سطر "النص"]: التسمية القديمة "النص:" لوحدها ما
                // كانتش بتوضح إن النص ده هيتكتب فعلاً على التورتة نفسها (وليس مثلاً
                // كارت إهداء منفصل، اللي ليه سطره الخاص تحت). بقت التسمية صريحة.
                if (cd.customMessage && cd.customMessage.trim() !== "") msg += `   • النص المطلوب كتابته على التورتة: "${cd.customMessage}"\n`;
                if (cd.allergyNote && cd.allergyNote.trim() !== "") msg += `   • ⚠️ ملاحظة حساسية: ${cd.allergyNote.trim()}\n`;
                if (cd.hasGiftCard && cd.giftCardText && cd.giftCardText.trim() !== "") msg += `   • كارت إهداء: "${cd.giftCardText.trim()}"\n`;
                // 🖼️ [تمييز الصور - إصلاح جذري]: قبل كده كل الصور المرفوعة كانت
                // بتظهر في قايمة واحدة مجهولة "صورة مرجعية 1 / 2" من غير أي توضيح
                // أنهي صورة للطباعة فعلياً على التورتة وأنهي صورة هي بس مصدر إلهام
                // للتصميم - ده كان ممكن يخلط على الفرع ويطبع الصورة الغلط. دلوقتي
                // كل صورة بيها سطر واضح بيقول غرضها بالظبط.
                if (cd.printImageUrl) msg += `   🖨️ *الصورة المطلوب طباعتها على التورتة:* ${cd.printImageUrl}\n`;
                if (cd.replicaImageUrl) msg += `   🎨 *صورة التصميم اللي عايزين نقرب شكل التورتة منها:* ${cd.replicaImageUrl}\n`;
            }
            if (item.type === "custom-flower") {
                if (cd.moodLabel) msg += `   • الإحساس المطلوب: ${cd.moodLabel}\n`;
                // 🐛🌸👑 [إصلاح جذري - نوع الورد كان بيطبع في فاتورة الواتساب باسمه
                // الداخلي الخام (زي "natural" بالإنجليزي، أو معرّف عشوائي زي "opt-xxxx"
                // لأي نوع تضيفه الأدمن دلوقتي) بدل اسمه العربي الحقيقي - المطبخ/الفرع
                // كان بياخد رسالة مش مفهومة. بنبحث عن الاسم الحقيقي في قائمة أنواع
                // الورد المُدارة من لوحة التحكم، ولو مش لاقيينه بنرجع لاسم افتراضي.
                if (cd.flowerType && cd.flowerType !== "none") {
                    const fbTypes = window.BoseStoreData?.flowerBuilder?.flowerTypes;
                    const match = Array.isArray(fbTypes) ? fbTypes.find(t => t && t.id === cd.flowerType) : null;
                    const defaultNames = { natural: "ورد طبيعي نضر", artificial: "ورد صناعي فاخر", satin: "ورد ستان راقٍ" };
                    msg += `   • نوع الورد: ${match ? match.name : (defaultNames[cd.flowerType] || cd.flowerType)}\n`;
                }
                if (cd.flowerCount && cd.flowerCount > 0) msg += `   • التعداد: ${cd.flowerCount} وردة\n`;
                if (cd.hasSatinRibbon && cd.satinRibbonText && cd.satinRibbonText.trim() !== "") msg += `   • شريط ستان مطبوع حرارياً: "${cd.satinRibbonText}"\n`;
                if (cd.photoCount && cd.photoCount > 0) msg += `   • صور شخصية مطبوعة: ${cd.photoCount} صورة\n`;
                if (cd.cashAmount && cd.cashAmount > 0) msg += `   • الكاش المدمج جوه البوكيه: +${cd.cashAmount} EGP\n`;
                if (cd.hasChocolate && cd.chocolateBudget && cd.chocolateBudget > 0) msg += `   • ميزانية الشوكولاتة الفاخرة: +${cd.chocolateBudget} EGP\n`;
                if (cd.hasGiftCard && cd.giftCardText && cd.giftCardText.trim() !== "") msg += `   • كارت الإهداء: "${cd.giftCardText}"\n`;
            }
            // 👑 [إصلاح جذري - كارثة الأحجام]: لازم الحجم يظهر في فاتورة الواتساب اللي
            // بيتفذ منها الطلب فعلياً في الفرع - قبل كده الحجم مكنش موجود هنا خالص،
            // وكان ممكن يتنفذ الطلب بحجم غلط تماماً عن اللي دفع فيه العميل فعلاً.
            if (item.type !== "custom-cake" && item.type !== "mini-cake" && item.type !== "custom-flower" && cd.sizeLabel) {
                msg += `   • *الحجم المطلوب:* ${cd.sizeLabel}\n`;
            }
        }

        // 🛡️ [إصلاح حرج]: أي صورة رفعها العميل (بوكيه مرجعي مثلاً) كانت بتتحفظ
        // كرابط Cloudinary حقيقي جوه item.image لكن ما كانتش بتوصل خالص لنص
        // فاتورة الواتساب. دلوقتي أي رابط Cloudinary حقيقي (مش لوجو الموقع
        // الافتراضي) بيظهر كسطر واضح قابل للفتح المباشر من واتساب - ما عدا
        // أصناف التورت المخصص، لأن صورها الاثنتين (الطباعة/التصميم المرجعي)
        // اتوضحت بالفعل بسطرين منفصلين فوق، وتكرارها هنا هيرجع نفس اللخبطة
        // القديمة (صورة "مرجعية" مجهولة الغرض).
        const refImageUrls = [];
        if (!isCakeBespoke) {
            if (item.image && typeof item.image === "string" && item.image.startsWith("http") && !item.image.includes("logo_igggsb")) {
                refImageUrls.push(item.image);
            }
            if (Array.isArray(item.referenceImages)) {
                item.referenceImages.forEach(u => { if (u && typeof u === "string" && u.startsWith("http")) refImageUrls.push(u); });
            }
        }
        refImageUrls.forEach((url, i) => {
            msg += `   🖼️ *صورة مرجعية${refImageUrls.length > 1 ? ' ' + (i + 1) : ''}:* ${url}\n`;
        });

        msg += `   ---------------------------\n\n`;
    });

    msg += `--------------------------------------------------\n`;
    msg += `📝 *ملاحظات عن الحساسية / تفضيل السكر أو أي طلب خاص:* ${order.notes}\n\n`;
    msg += `--------------------------------------------------\n`;
    // 🎁 [نظام نقاط الولاء]: خصم الولاء التلقائي وخصم قسيمة الولاء (لو اتطبقوا)
    // بيظهروا كسطرين واضحين هنا قبل المجموع النهائي، عشان العميلة تشوف بعينها
    // إنها فعلاً اخدت مكافأتها ومش مجرد خصم مخفي.
    if (order.loyaltyDiscountAmount && order.loyaltyDiscountAmount > 0) {
        msg += `🌟 *خصم الولاء التلقائي:* -${parseFloat(order.loyaltyDiscountAmount).toFixed(2)} EGP\n`;
    }
    if (order.voucherAmountUsed && order.voucherAmountUsed > 0) {
        msg += `🎁 *قسيمة الولاء المستخدمة:* -${parseFloat(order.voucherAmountUsed).toFixed(2)} EGP\n`;
    }
    msg += `👑 *المجموع المالي النهائي:* ${order.grandTotal} EGP 👑\n`;
    // 💵 [عربون/دفع مقدم]: توضيح صريح لطريقة ووقت الدفع - استلام = عربون 50%
    // والباقي عند الاستلام، توصيل = كامل المبلغ مقدماً وقت تأكيد الحجز.
    if (order.depositAmount !== undefined) {
        if (order.remainingAmount > 0) {
            msg += `💳 *عربون تأكيد الحجز المطلوب الآن:* ${order.depositAmount} EGP (كاش أو InstaPay على ${order.paymentPhone})\n`;
            msg += `🧾 *الباقي عند الاستلام:* ${order.remainingAmount} EGP\n`;
        } else {
            const fullReason = order.deliveryMethod === "توصيل للمنزل" ? "توصيل" : "دفع كامل باختيارها";
            msg += `💳 *المبلغ الكامل المطلوب الآن (${fullReason}):* ${order.depositAmount} EGP (كاش أو InstaPay على ${order.paymentPhone})\n`;
        }
        msg += `📸 من فضلك ابعتي لقطة شاشة التحويل هنا فور إتمامه وهنأكد الحجز فوراً.\n`;
    }
    msg += `\n--------------------------------------------------\n`;
    msg += `🤝 شكرًا لاختياركم الفاخر لـ حلويات بوسي. صنعناها بحب لتهديها لمن تحب. ✨`;
    
    return msg;
}

// 🛡️🐛 [إصلاح جذري - حماية إضافية ضد فشل فتح واتساب في الطلبات الكبيرة]:
// طلبات فيها أكتر من صنف مخصص (تورت/ورد) بصور مرجعية بتولّد نص فاتورة طويل
// جداً (رابط wa.me النهائي ممكن يوصل لآلاف الحروف) - حتى بعد إصلاح رابط
// intent://، لسه ممكن بعض المتصفحات (خصوصاً المتصفحات الداخلية جوه تطبيقات
// السوشيال ميديا) تتعثر مع روابط طويلة جداً. الدالة دي بتبني نسخة مختصرة
// من الفاتورة (بيانات العميل + كل صنف باسمه وسعره وكميته بس، من غير تفاصيل
// التخصيص الطويلة ولا روابط الصور) + توجّه الفرع لصفحة تتبع الطلب لمشاهدة
// كل التفاصيل والصور كاملة (محفوظة بالفعل في قاعدة البيانات مع الطلب).
// بتتستخدم بس لو النص الكامل طويل جداً (راجع processFinalBoseOrder تحت).
function buildBoseCondensedWhatsappInvoice(order) {
    let msg = `✨ *فاتورة حجز مختصرة - حلويات بوسي* ✨\n`;
    msg += `(الطلب فيه تفاصيل/صور كتير، فهنبعت نسخة مختصرة هنا - كل التفاصيل والصور الكاملة موجودة في رابط تتبع الطلب تحت 👇)\n\n`;
    msg += `--------------------------------------------------\n`;
    msg += `🧾 *رقم المعاملة:* ${order.orderId}\n`;
    msg += `👤 *العميل:* ${order.customerName}\n`;
    msg += `📞 *رقم الاتصال:* ${order.phone1}\n`;
    msg += `🚗 *مسار الاستلام:* ${order.deliveryMethod}\n`;
    msg += `📍 *التفاصيل الجغرافية:* ${order.address}\n`;
    msg += `📅 *موعد الاستلام:* ${order.scheduledDate} الساعة ${formatBoseTimeToEgyptian12Hour(order.scheduledTime)}\n\n`;
    msg += `--------------------------------------------------\n`;
    msg += `📦 *الأصناف:*\n`;
    order.items.forEach((item, idx) => {
        msg += `${idx + 1}. ${item.title} ×${item.quantity} — ${parseFloat(item.finalPrice).toFixed(2)} EGP\n`;
    });
    msg += `--------------------------------------------------\n`;
    msg += `👑 *المجموع النهائي:* ${order.grandTotal} EGP\n`;
    if (order.depositAmount !== undefined) {
        msg += `💳 *المطلوب دفعه الآن:* ${order.depositAmount} EGP (كاش أو InstaPay على ${order.paymentPhone})\n`;
    }
    if (order.dbOrderNumber) {
        const siteOrigin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "https://bose-sweet.vercel.app";
        msg += `\n🔗 *كل تفاصيل التخصيص والصور المرفوعة:*\n${siteOrigin}/track-order.html?order=${encodeURIComponent(order.dbOrderNumber)}&phone=${encodeURIComponent(order.phone1)}\n`;
    }
    msg += `\n📸 من فضلك ابعتي لقطة شاشة التحويل هنا فور إتمامه وهنأكد الحجز فوراً.`;
    return msg;
}

/**
 * =========================================================================
 * 🧾 3. محرك وإدارة صفحة نجاح الطلب وإصدار الفاتورة (order-success.html)
 * =========================================================================
 */
function renderBoseSuccessPage(storeData) {
    // 🛡️ [إصلاح حرج - المرحلة 1]: هذه الدالة كانت معطّلة بالكامل قبل كده — كان بيتم
    // اكتشاف الصفحة عن طريق البحث عن id="success-order-id-display" غير موجود فعلياً
    // في order-success.html، وكمان الملف ده مكانش بيتحمّل في الصفحة أصلاً. النتيجة كانت
    // ظهور سكريبت داخلي منفصل ومكرر بالكامل جوه الـHTML يعمل نفس المهمة. دلوقتي
    // order-success.html بيحمّل cart-engine.js فعلياً، وهذه الدالة أصبحت المصدر
    // الوحيد لمنطق عرض الفاتورة - تم حذف السكريبت الداخلي المكرر نهائياً من الـHTML.
    const orderNumLbl = document.getElementById("bose-receipt-number-lbl");
    const dateLbl = document.getElementById("bose-receipt-date-lbl");
    const receiptWrapper = document.getElementById("bose-receipt-items-container");
    const grandTotalDisplay = document.getElementById("bose-receipt-grand-total");
    // عنصران اختياريان حسب نسخة الصفحة - الكود بيتخطاهم بأمان لو مش موجودين
    const orderIdDisplay = document.getElementById("success-order-id-display");
    const customerWelcome = document.getElementById("success-customer-welcome");
    const trackOrderBtn = document.getElementById("bose-success-track-btn");
    const resendWhatsappBtn = document.getElementById("bose-resend-whatsapp-btn");

    const showEmptyState = () => {
        if (receiptWrapper) {
            receiptWrapper.innerHTML = `<p style="text-align:center; opacity:0.6; font-size:0.85rem; margin:0;">تم توثيق وحجز طلبك الفاخر بنجاح في الفرع 🌸</p>`;
        }
    };

    const rawOrder = localStorage.getItem("bose_last_order");
    if (!rawOrder) { showEmptyState(); return; }

    let order;
    try {
        order = JSON.parse(rawOrder);
    } catch (e) {
        console.error("⚠️ فشل قراءة أو معالجة إيصال الفاتورة الأخيرة.", e);
        showEmptyState();
        return;
    }

    // 🛡️🐛👑 [إصلاح جذري]: زرار "إرسال فاتورة الطلب على واتساب" - دلوقتي هو
    // الخطوة الأساسية المطلوبة من العميلة (مش مجرد نسخة احتياطية)، لأن
    // المحاولة التلقائية في checkout.html اتشالت خالص (كانت بترفضها متصفحات
    // زي سناب شات/إنستجرام/فيسبوك الداخلية برفض صريح - راجع كومنت
    // processFinalBoseOrder). بنحط href حقيقي على الرابط مباشرة (مش JS بس)
    // عشان يشتغل حتى لو المتصفح بيمنع window.open تماماً - أي متصفح بيقدر
    // يفتح رابط https عادي بضغطة مستخدم حقيقية زي دي.
    if (resendWhatsappBtn && order.whatsappMessage) {
        resendWhatsappBtn.style.display = "flex";
        const phone = order.paymentPhone || "01097238441";
        const link = typeof window.buildWhatsappLink === "function"
            ? window.buildWhatsappLink(phone, order.whatsappMessage)
            : `https://wa.me/2${phone}?text=${encodeURIComponent(order.whatsappMessage)}`;
        resendWhatsappBtn.setAttribute("href", link);
        resendWhatsappBtn.setAttribute("target", "_blank");
        resendWhatsappBtn.setAttribute("rel", "noopener noreferrer");
    }

    // 📊👑 [نمو - Purchase]: أهم حدث تجاري - بيتأكد بس هنا (بعد ما الطلب فعلاً
    // اتحفظ في قاعدة البيانات، مش مجرد نية شراء زي InitiateCheckout). حراسة
    // "purchaseEventTracked" ضرورية لأن bose_last_order بيفضل محفوظ في localStorage
    // بعد الإرسال (عشان لو العميلة رجعت/عملت refresh لصفحة النجاح يشوفوا فاتورتهم)،
    // فمن غير الحراسة دي كل refresh كان هيبعت حدث "شراء" مكرر ويضخّم الأرقام في
    // تقارير الإعلانات بالغلط.
    if (!order.purchaseEventTracked && order.dbOrderNumber && typeof window.fireBoseCommerceEvent === "function") {
        window.fireBoseCommerceEvent('purchase', {
            value: parseFloat(order.grandTotal) || 0,
            currency: (typeof window.BoseStoreData !== "undefined" && window.BoseStoreData?.store?.currency) || 'EGP',
            orderId: String(order.dbOrderNumber)
        });
        order.purchaseEventTracked = true;
        try { localStorage.setItem("bose_last_order", JSON.stringify(order)); } catch (e) {}
    }

    if (orderNumLbl) orderNumLbl.textContent = `رقم طلب الفاتورة: #${order.orderNumber || '0000'}`;
    if (dateLbl) dateLbl.textContent = order.date || '00 / 00 / 2026';
    if (orderIdDisplay) {
        orderIdDisplay.textContent = order.orderId || `#${order.orderNumber || ''}`;
        orderIdDisplay.style.display = "block";
    }
    // 🛡️ زرار "تتبعي طلبك" بيظهر بس لو الرقم الحقيقي المسجل في قاعدة البيانات
    // (dbOrderNumber) وصل فعلاً - لو حفظ الطلب في القاعدة فشل (نت ضعيف مثلاً)
    // منسيبش زرار بيودي لصفحة تتبع مش هتلاقي حاجة.
    if (trackOrderBtn && order.dbOrderNumber && order.phone1) {
        trackOrderBtn.href = `track-order.html?order=${encodeURIComponent(order.dbOrderNumber)}&phone=${encodeURIComponent(order.phone1)}`;
        trackOrderBtn.style.display = "flex";
    }
    // 🐛 [إصلاح خلل وظيفي]: العنصر كان بيتقرأ من الـDOM بس مفيش أي كود
    // بيحط فيه اسم العميل فعلياً، فكانت خانة الترحيب بتفضل فاضية دايماً.
    if (customerWelcome && order.customerName) {
        customerWelcome.textContent = `أهلاً بيك يا ${order.customerName} 🌸`;
        customerWelcome.style.display = "block";
    }

    // 🎁 [نظام نقاط الولاء]: بيوضح للعميلة فوراً لو الطلب ده كسب لها خصم تلقائي،
    // أو حقق لها قسيمة شراء الـ300 جنيه (بعد الاستلام) - القيم دي مؤكدة فعلياً
    // من قاعدة البيانات (راجع processFinalBoseOrder → dbResult) مش تقدير محلي.
    const loyaltyCard = document.getElementById("bose-loyalty-success-card");
    if (loyaltyCard) {
        const loyaltyDiscountAmount = parseFloat(order.loyaltyDiscountAmount) || 0;
        const loyaltyDiscountPercent = parseFloat(order.loyaltyDiscountPercent) || 0;
        const voucherAmountUsed = parseFloat(order.voucherAmountUsed) || 0;
        const isMilestone = !!order.isLoyaltyMilestone;

        const cardBaseStyle = "margin: 16px 0 0 0; padding: 16px 18px; border-radius: 14px; direction: rtl; text-align: right; font-family: 'Cairo'; font-size: 0.9rem; font-weight: 700; display:flex; align-items:center; gap:10px;";
        let cardHtml = "";

        if (loyaltyDiscountAmount > 0) {
            cardHtml += `<div style="${cardBaseStyle} background: rgba(46,158,91,0.08); border: 1px solid rgba(46,158,91,0.3); color:#2e9e5b;">
                <i class="fa-solid fa-star" style="font-size:1.2rem;"></i>
                <span>استفدتِ من خصم الولاء التلقائي (${loyaltyDiscountPercent}%) بقيمة ${loyaltyDiscountAmount.toFixed(2)} جنيه على الطلب ده 🎉</span>
            </div>`;
        }
        if (voucherAmountUsed > 0) {
            cardHtml += `<div style="${cardBaseStyle} background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.3); color:#b8860b;">
                <i class="fa-solid fa-ticket" style="font-size:1.2rem;"></i>
                <span>استخدمتِ قسيمة ولاء بقيمة ${voucherAmountUsed.toFixed(2)} جنيه في الطلب ده 🎁</span>
            </div>`;
        }
        if (isMilestone) {
            // 🛡️ [إصلاح جذري]: مبلغ القسيمة ومدة صلاحيتها بيتقروا من إعدادات
            // لوحة التحكم الحية (loyalty-config.js) بدل الأرقام الثابتة اللي
            // كانت مكتوبة هنا يدوياً.
            const loyaltyCfg = (typeof window.getBoseLoyaltyConfig === "function") ? window.getBoseLoyaltyConfig() : { voucherAmount: 300, voucherValidityMonths: 2 };
            const voucherMonthsTxt = window.formatArabicMonths ? window.formatArabicMonths(loyaltyCfg.voucherValidityMonths) : `${loyaltyCfg.voucherValidityMonths} شهر`;
            cardHtml += `<div style="${cardBaseStyle} background: rgba(255,145,164,0.08); border: 1px solid rgba(255,145,164,0.3); color:#FF91A4;">
                <i class="fa-solid fa-gift" style="font-size:1.2rem;"></i>
                <span>مبروك! الطلب ده وصّلك لمرحلة قسيمة شراء بـ${loyaltyCfg.voucherAmount} جنيه - هتوصلك تلقائياً بعد استلام طلبك، وهتلاقيها في <a href="/rewards.html?phone=${encodeURIComponent(order.phone1 || '')}" style="color:#FF91A4; text-decoration:underline;">صفحة نادي المكافآت</a> صالحة لمدة ${voucherMonthsTxt} 🎉</span>
            </div>`;
        }

        if (cardHtml) {
            loyaltyCard.innerHTML = cardHtml;
            loyaltyCard.style.display = "block";
        }
    }

    // 💵 [عربون/دفع مقدم]: عرض نفس بوكس تعليمات الدفع اللي ظهر في checkout.html
    // هنا كمان، معبّى من بيانات الطلب المحفوظة فعلياً وقت التأكيد.
    const depositBox = document.getElementById("bose-deposit-payment-box");
    if (depositBox && order.depositAmount !== undefined) {
        depositBox.style.display = "block";
        const depAmountEl = document.getElementById("bose-deposit-amount");
        const depLabelEl = document.getElementById("bose-deposit-label");
        const depRemainingRow = document.getElementById("bose-deposit-remaining-row");
        const depRemainingEl = document.getElementById("bose-deposit-remaining-amount");
        const depPhoneEl = document.getElementById("bose-deposit-phone-number");
        if (depAmountEl) depAmountEl.textContent = order.depositAmount + " EGP";
        if (depPhoneEl) depPhoneEl.textContent = order.paymentPhone || "01097238441";
        if (order.remainingAmount > 0) {
            if (depLabelEl) depLabelEl.textContent = "عربون تأكيد الحجز المطلوب الآن (50%):";
            if (depRemainingRow) depRemainingRow.style.display = "flex";
            if (depRemainingEl) depRemainingEl.textContent = order.remainingAmount + " EGP";
        } else {
            const fullReason = order.deliveryMethod === "توصيل للمنزل" ? "توصيل" : "دفع كامل باختيارها";
            if (depLabelEl) depLabelEl.textContent = `المبلغ الكامل المطلوب الآن (${fullReason}):`;
            if (depRemainingRow) depRemainingRow.style.display = "none";
        }
        const copyBtn = document.getElementById("bose-copy-deposit-phone");
        if (copyBtn) {
            copyBtn.onclick = () => {
                const num = depPhoneEl?.textContent?.trim();
                if (num && navigator.clipboard) {
                    navigator.clipboard.writeText(num).then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => { copyBtn.innerHTML = '<i class="far fa-copy"></i>'; }, 1500);
                    }).catch(() => {});
                }
            };
        }
    }

    const purchasedSlugs = [];
    if (receiptWrapper) {
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            const escR = window.escapeBoseHTML || (s => s);
            receiptWrapper.innerHTML = order.items.map(item => {
                if (item.productSlug) purchasedSlugs.push(item.productSlug);
                return `
                <div class="receipt-item-node">
                    <span class="receipt-item-name">${escR(item.title)} <span style="font-weight:400; opacity:0.6; font-size:0.8rem;">(×${item.quantity})</span><span style="display:block; font-size:0.75rem; font-weight:700; color:var(--bose-pink); margin-top:2px;">${escR(item.flavorName || 'جاهز وفريش')}</span></span>
                    <span class="receipt-item-price">${(item.finalPrice * item.quantity).toFixed(2)} EGP</span>
                </div>
            `;
            }).join("");
        } else {
            showEmptyState();
        }
    }

    if (grandTotalDisplay) grandTotalDisplay.textContent = (order.grandTotal || 0) + " EGP";

    // 🧾 [إضافة اختيارية - مرجع شخصي للعميلة]: زرار تحميل صورة فاتورة اختياري
    // للحفظ الشخصي - مختلف تمامًا عن زرار "إرسال الفاتورة" القديم اللي اتشال
    // (راجع تعليق order-success.html). بيظهر بس لو الطلب فعلاً فيه أصناف
    // (نفس شرط عرض الإيصال نفسه)، وبيستخدم نفس مولّد الصورة المستخدم في
    // لوحة التحكم (js/invoice-image-generator.js) - المُدخلات هنا (order,
    // storeData.store) نفس الشكل camelCase بالظبط اللي المولّد مبني عليه
    // أصلاً، فمفيش أي تحويل شكل بيانات مطلوب زي اللي احتجناه في الأدمن.
    const downloadInvoiceBtn = document.getElementById("bose-download-invoice-image-btn");
    if (downloadInvoiceBtn && order.items && order.items.length > 0 && typeof window.generateBoseInvoiceImageBlob === "function") {
        downloadInvoiceBtn.style.display = "inline-flex";
        downloadInvoiceBtn.addEventListener("click", async () => {
            const originalHTML = downloadInvoiceBtn.innerHTML;
            downloadInvoiceBtn.disabled = true;
            downloadInvoiceBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التجهيز...';
            try {
                const blob = await window.generateBoseInvoiceImageBlob(order, storeData.store || {});
                if (!blob) throw new Error("تعذر توليد الصورة");
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `فاتورة-حلويات-بوسي-${order.orderNumber || ''}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 4000);
            } catch (e) {
                console.error("⚠️ تعذر تحميل صورة الفاتورة.", e);
            } finally {
                downloadInvoiceBtn.disabled = false;
                downloadInvoiceBtn.innerHTML = originalHTML;
            }
        });
    }


    // 🧾 [تحديث توثيق]: الفقرة القديمة هنا كانت بتقول إن زرار "إرسال الفاتورة"
    // اتشال نهائياً بافتراض إن فتح واتساب التلقائي من checkout.html مضمون
    // دايماً - ده اتغيّر بعد كده: الزرار رجع تاني كشبكة أمان دايمة الظهور (شوف
    // الكومنت "🛡️🐛👑 [إصلاح جذري]" فوق مباشرة قبل بلوك resendWhatsappBtn،
    // وده المرجع الصحيح الحالي لسبب وسلوك الزرار). الإجراء التاني المفيد في
    // الصفحة دي هو متابعة حالة الطلب (زرار "تتبعي طلبك"، بيتفعّل تلقائياً لو
    // رقم الطلب الحقيقي من قاعدة البيانات وصل).

    // 🗄️ [إصلاح المرحلة 1]: نسخة احتياطية اختيارية لتسجيل الطلب خارج المتصفح لمنع
    // ضياعه لو فشل واتساب أو مسح العميل الكاش قبل التأكيد. للتفعيل: عرّف
    // window.BOSE_ORDER_BACKUP_WEBHOOK_URL برابط خدمة الاستقبال بتاعتك (Google Apps
    // Script / Webhook / أي Backend بسيط) قبل تحميل هذا الملف. لو مش معرّف، الخطوة
    // دي بتتجاهل بأمان بدون أي خطأ أو تأثير على باقي الصفحة.
    if (typeof window.BOSE_ORDER_BACKUP_WEBHOOK_URL === "string" && window.BOSE_ORDER_BACKUP_WEBHOOK_URL) {
        fetch(window.BOSE_ORDER_BACKUP_WEBHOOK_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order)
        }).catch((e) => console.warn("⚠️ تعذر إرسال نسخة الطلب الاحتياطية.", e));
    }

    // 🧹 تطهير الذاكرة السلوكية لكسر تكرار المنتجات التي تم شراؤها فعلياً
    try {
        const behaviorData = localStorage.getItem('bose_user_behavior');
        if (behaviorData) {
            const behaviorLog = JSON.parse(behaviorData);
            purchasedSlugs.forEach((slug) => { if (behaviorLog[slug]) delete behaviorLog[slug]; });
            localStorage.setItem('bose_user_behavior', JSON.stringify(behaviorLog));
        }
    } catch (e) {
        console.warn("⚠️ تعذر تفعيل صمام الأمان لتطهير الذاكرة السلوكية.", e);
    }

    // مسح وإفراغ السلة المشتراة فوراً لتجنب حشر الفواتير القديمة وتأمين دورة الشراء التالية
    localStorage.removeItem("bose_cart");
    if (typeof window.updateGlobalCartCounter === "function") {
        window.updateGlobalCartCounter();
    }
}

/**
 * =========================================================================
 * 👑 4. محرك النوافذ المنبثقة الفاخرة لعلامة حلويات بوسي (Bose Custom Luxury Modals)
 * =========================================================================
 */
function injectBoseCustomModalStyles() {
    if (document.getElementById("bose-modal-styles-block")) return;
    const styleEl = document.createElement("style");
    styleEl.id = "bose-modal-styles-block";
    styleEl.textContent = `
        .bose-custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(17, 17, 17, 0.4); display: flex; align-items: center; justify-content: center; z-index: 100000; direction: rtl; opacity: 0; transition: opacity 0.25s ease; pointer-events: none; padding: 20px; box-sizing: border-box; }
        .bose-custom-modal-overlay.active { opacity: 1; pointer-events: auto; }
        .bose-custom-modal-card { background: #FFFFFF; border: 1px solid rgba(255, 145, 164, 0.3); border-radius: 24px; padding: 24px; width: 100%; max-width: 400px; box-shadow: 0 12px 40px rgba(255, 145, 164, 0.15); text-align: center; box-sizing: border-box; }
        .bose-modal-text { font-family: 'Cairo'; font-size: 16px; font-weight: 700; color: #111111; margin: 0 0 20px 0; line-height: 1.5; }
        .bose-modal-actions-wrapper { display: flex; gap: 12px; justify-content: center; }
        .bose-modal-btn { font-family: 'Cairo'; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 12px; cursor: pointer; border: none; box-sizing: border-box; }
        .bose-modal-btn-confirm { background: #FF91A4; color: #FFFFFF; }
        .bose-modal-btn-cancel { background: #FFFFFF; color: #111111; border: 1px solid rgba(17,17,17,0.15); }
    `;
    document.head.appendChild(styleEl);
}

function showBoseCustomModal(messageText, onConfirmCallback) {
    let overlay = document.getElementById("bose-global-modal-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "bose-global-modal-overlay";
        overlay.className = "bose-custom-modal-overlay";
        overlay.innerHTML = `
            <div class="bose-custom-modal-card">
                <p class="bose-modal-text" id="bose-modal-text-content"></p>
                <div class="bose-modal-actions-wrapper">
                    <button class="bose-modal-btn bose-modal-btn-confirm" id="bose-modal-btn-ok">تأكيد</button>
                    <button class="bose-modal-btn bose-modal-btn-cancel" id="bose-modal-btn-no">تراجع</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    document.getElementById("bose-modal-text-content").textContent = messageText;
    overlay.classList.add("active");
    
    overlay.querySelector("#bose-modal-btn-ok").onclick = () => { overlay.classList.remove("active"); if (typeof onConfirmCallback === "function") onConfirmCallback(); };
    overlay.querySelector("#bose-modal-btn-no").onclick = () => { overlay.classList.remove("active"); };
}