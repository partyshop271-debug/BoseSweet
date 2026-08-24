/**
 * review-followups-page.js - قائمة تذكير المراجعات اليومية
 * =====================================================================
 * 👑 [فكرة صاحبة المتجر]: تذكير العميل يقيّم منتجه بعد يوم واحد من التسليم -
 * أقوى توقيت نفسي للمراجعة (العميل لسه فرحان بتجربته وقريب منها). الإرسال
 * التلقائي الكامل عبر واتساب مش متاح فعلياً من غير حساب WhatsApp Business
 * Platform معتمد من Meta (يحتاج API key منفصل لازم صاحبة المتجر توفره بنفسها) -
 * فالحل العملي المتاح دلوقتي هو "طابور يومي" بضغطتين: رابط واتساب جاهز
 * برسالة معبّأة مسبقاً، وزرار "تم الإرسال" يوثّق إنه اتبعت (review_reminder_sent_at)
 * عشان الطلب يختفي من القائمة بعدها. لو لاحقاً حبيتي تفعيل الإرسال التلقائي
 * الكامل، محتاجين وقتها ربط WhatsApp Business API فعلي.
 *
 * 🛡️ [قيد تقني حقيقي من واتساب نفسه - مش من الموقع]: رابط wa.me?text= بيدعم
 * نص بس، مفيش أي باراميتر رسمي لإرفاق صورة تلقائي جوه نفس الرسالة. فبنعرض
 * صورة المنتج في الجدول هنا عشان تقدري (لو حبيتي) تحفظيها وترفقيها يدوي
 * كرسالة تانية في نفس المحادثة - خطوة إضافية بسيطة بس مش أوتوماتيك بالكامل.
 *
 * 🎁 [كوبون التقييم - ٥٪ لمرة واحدة لمدة أسبوعين]: القرار اتاخد مع صاحبة
 * المتجر: خصم ثابت منفصل عن دورة الولاء الأصلية (٣/٦/٩) عشان ميأثرش على
 * حساباتها، بصلاحية قصيرة (أسبوعين) عشان يدفع العميلة تستخدمه بسرعة بدل ما
 * تنساه. جدول coupons مفيهوش عمود "حد استخدام" (max_uses)، فمفيش تقييد
 * تقني إن الكود يتستخدم مرة واحدة بس - الحل العملي: بنولّد كود فريد
 * وغير متوقّع لكل عميلة على حدة (مش كود عام مشترك)، فعمليًا هيفضل خاص بيها
 * هي بس لأن محدش غيرها عارفه. زرار "إصدار كوبون ٥٪" بيتاح لما تستلمي فعلاً
 * سكرين شوت التقييم من العميلة - مش بيتبعت تلقائي مع رسالة التذكير.
 */
(function () {
    "use strict";

    let currentFollowups = [];

    const REVIEW_COUPON_PERCENT = 5;
    const REVIEW_COUPON_VALID_DAYS = 14;

    function sanitizePhone(phone) {
        if (!phone) return "";
        let cleaned = phone.trim().replace(/[\s\-()+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        else if (cleaned.startsWith("00201")) cleaned = "0" + cleaned.substring(4);
        else if (cleaned.startsWith("1") && cleaned.length === 10) cleaned = "0" + cleaned;
        return cleaned;
    }
    function toInternational(phone) {
        let cleaned = sanitizePhone(phone);
        if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
        return "20" + cleaned;
    }

    function daysSince(iso) {
        if (!iso) return "—";
        const diffMs = Date.now() - new Date(iso).getTime();
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        return days <= 1 ? "يوم واحد" : `${days} أيام`;
    }

    function itemsSummary(items) {
        if (!items || !items.length) return "—";
        return items.map((it) => it.title).join("، ");
    }

    /** أسماء المنتجات كلها (مفصولة بـ"و") - عشان الرسالة تفتكر العميلة بتجربتها بالظبط */
    function productNamesForMessage(items) {
        const names = (items || []).map((it) => it.title).filter(Boolean);
        if (!names.length) return "";
        if (names.length === 1) return names[0];
        if (names.length === 2) return `${names[0]} و${names[1]}`;
        return `${names.slice(0, -1).join("، ")} و${names[names.length - 1]}`;
    }

    /** أول صورة منتج متاحة في الطلب - لعرضها في الجدول فقط (مش بترفق تلقائي في واتساب، راجعي الملحوظة فوق) */
    function firstItemImage(items) {
        const found = (items || []).find((it) => it.image);
        return found ? found.image : null;
    }

    /**
     * 🛡️ [تفرقة النوع في الرسالة]: مفيش عمود "جنس العميل" مخزّن في قاعدة
     * البيانات أصلاً (مش موجود في الشيك أوت)، فمفيش طريقة مضمونة ١٠٠٪.
     * الحل العملي: نخمّن من الاسم الأول بمقارنته بقائمة مبنية على أكتر
     * الأسماء المصرية شيوعًا (ذكور وإناث)، ولو الاسم مش في القائمتين
     * بنرجع لقاعدة عامة (الأسماء المنتهية بتاء مربوطة/ألف ممدودة غالبًا مؤنثة).
     * ده تخمين قوي مش تأكيد ١٠٠٪ - لو حبيتي دقة مضمونة تمامًا، الحل
     * الجذري إننا نضيف حقل "الجنس" في الشيك أوت نفسه (اختياري) ونحفظه في
     * جدول orders، وقتها الرسالة هتبقى مظبوطة أكيد مش تخمين. قوليلي لو
     * حبيتي ننفذ الإضافة دي.
     */
    const FEMALE_NAMES = new Set([
        "سارة", "ساره", "منى", "مني", "نور", "نورا", "نورهان", "ندى", "نهى", "دينا", "رنا", "رانيا",
        "ياسمين", "ياسمينة", "مريم", "مروة", "مرام", "هدى", "هبة", "هبه", "إيمان", "ايمان", "أمل", "امل",
        "سلمى", "سلوى", "سناء", "سما", "شيماء", "شهد", "شروق", "علياء", "غادة", "فاطمة", "فاطمه",
        "لمياء", "لمى", "منال", "مي", "ميار", "نادية", "نادين", "نجلاء", "هالة", "هاله", "وفاء", "ياسمينا",
        "آية", "اية", "جنى", "جنا", "حبيبة", "حبيبه", "حنان", "خلود", "دعاء", "رحمة", "رحمه", "رغد",
        "زينب", "زهرة", "زهره", "زينة", "سحر", "سمر", "سمية", "صفاء", "ضحى", "عبير", "عزة", "فرح",
        "كريمة", "كريمه", "لبنى", "ليلى", "مايا", "مادلين", "مارتينا", "ماريا", "ملك", "منة", "منه",
        "ندين", "هاجر", "أسماء", "اسماء", "بسمة", "بسمه", "بيان", "تسنيم", "جاسمين", "جيهان",
        "دنيا", "روان", "روضة", "روضه", "رويدا", "ريم", "ريهام", "سلسبيل", "سندس", "شادن", "صابرين",
        "عائشة", "عايشة", "علا", "غدير", "فيروز", "قمر", "كنزي", "لارا", "لجين", "مارية", "ماريه",
        "مياس", "ندا", "نغم", "نهال", "هناء", "هنا", "ياسمينه",
    ]);

    const MALE_NAMES = new Set([
        "أحمد", "احمد", "محمد", "محمود", "مصطفى", "مصطفي", "عمر", "علي", "على", "خالد", "كريم",
        "يوسف", "يوسيف", "إبراهيم", "ابراهيم", "حسن", "حسين", "عبدالله", "عبد الله", "عبدالرحمن",
        "عبد الرحمن", "عمرو", "طارق", "وائل", "وليد", "زياد", "أمير", "امير", "سامح", "سامي", "شريف",
        "أشرف", "اشرف", "أيمن", "ايمن", "هشام", "ماجد", "ماهر", "ياسر", "أسامة", "اسامة", "بلال",
        "تامر", "جمال", "حازم", "حمزة", "رامي", "رمضان", "زكريا", "سعيد", "سيد", "شادي",
        "صلاح", "عادل", "عاصم", "عبدالعزيز", "عبد العزيز", "عصام", "علاء", "فادي", "فؤاد", "كامل",
        "مازن", "مجدي", "معاذ", "معاوية", "منصور", "ناصر", "نبيل", "هاني", "وسيم",
        "أدهم", "ادهم", "أنس", "انس", "إسلام", "اسلام", "باسل", "جمعة", "حاتم", "حسام", "رأفت",
        "رافت", "زين", "سراج", "شحاتة", "طلعت", "عبدالمنعم", "عبد المنعم", "عزت", "فتحي", "قاسم",
        "لطفي", "متولي", "محسن", "مراد", "مرسي", "معتز", "موسى", "موسي", "نادر", "نصر", "هيثم",
    ]);

    function guessGender(firstName) {
        const name = (firstName || "").trim();
        if (!name) return "m";
        if (FEMALE_NAMES.has(name)) return "f";
        if (MALE_NAMES.has(name)) return "m";
        // قاعدة احتياطية: الأسماء المنتهية بتاء مربوطة أو ألف ممدودة غالبًا مؤنثة
        if (/[ةآ]$/.test(name) || /اء$/.test(name)) return "f";
        return "m";
    }

    /** رابط تقييم جوجل الرسمي لصفحة "حلويات بوسي" على الخرائط - ثابت لكل الطلبات */
    const GOOGLE_REVIEW_LINK = "https://g.page/r/Ca7yD4O1cGT3EBI/review";

    // 🛡️ [تبسيط + شخصنة + حافز]: رسالة بطلب واحد واضح بس (جوجل، مش لينكين)،
    // اسم المنتج مذكور بالظبط عشان تكون شخصية مش رسالة آلية عامة، وسطر حافز
    // خفيف (سكرين شوت التقييم = كوبون ٥٪). الكوبون الفعلي بيتصدّر بزرار مخصص
    // تحت لما يوصلك السكرين شوت فعلاً - مش بيتولّد مع رسالة التذكير نفسها.
    function buildReminderMessage(order) {
        const firstName = (order.customer_name || "").trim().split(" ")[0] || "";
        const productPart = productNamesForMessage(order.order_items);
        const productLine = productPart ? ` عن تجربتك مع ${productPart}` : "";
        const gender = guessGender(firstName);
        const sendVerb = gender === "f" ? "ابعتيلنا" : "ابعتلنا";
        return `أهلاً ${firstName} 🌸 نورتينا بطلبك من حلويات بوسي!\n\nلو عندك دقيقة بس${productLine}، هيسعدنا جداً رأيك على جوجل - بيفرق فعلاً معانا وبيساعد عملاء تانيين يلاقونا:\n${GOOGLE_REVIEW_LINK}\n\nوهدية بسيطة مننا 🎁: ${sendVerb} سكرين شوت من تقييمك وهنبعتلك كوبون خصم ٥٪ على طلبك الجاي 💕`;
    }

    function buildWhatsappUrl(order) {
        const intl = toInternational(order.phone1);
        if (window.BoseAdminUI && typeof window.BoseAdminUI.buildWhatsappUrl === "function") {
            return window.BoseAdminUI.buildWhatsappUrl(intl, buildReminderMessage(order));
        }
        return `https://wa.me/${intl}?text=${encodeURIComponent(buildReminderMessage(order))}`;
    }

    /** كود كوبون فريد وغير متوقّع لكل عميلة - عشان يفضل عملياً خاص بيها هي بس */
    function generateReviewCouponCode(order) {
        const phoneDigits = sanitizePhone(order.phone1).replace(/\D/g, "").slice(-4) || "0000";
        const random = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `SHUKRAN-${phoneDigits}-${random}`;
    }

    function buildReviewCouponMessage(code) {
        return `تمام! 💖 كوبون خصم ٥٪ بتاعك على طلبك الجاي:\n${code}\nصالح لمدة أسبوعين من دلوقتي.`;
    }

    async function handleIssueCoupon(orderId) {
        const order = currentFollowups.find((o) => o.id === orderId);
        if (!order) return;

        const firstName = (order.customer_name || "").trim().split(" ")[0] || "";
        const gender = guessGender(firstName);
        const customerNoun = gender === "f" ? "العميلة" : "العميل";
        const possessivePronoun = gender === "f" ? "تقييمها" : "تقييمه";

        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "إصدار كوبون التقييم",
            message: `هيتعمل كوبون خصم ${REVIEW_COUPON_PERCENT}٪ لمرة واحدة، صالح ${REVIEW_COUPON_VALID_DAYS} يوم، خاص بـ${order.customer_name || customerNoun}. استخدمي الزرار ده بس بعد ما تستلمي فعلاً سكرين شوت ${possessivePronoun} على جوجل.`,
            confirmLabel: "تأكيد الإصدار",
        });
        if (!confirmed) return;

        const code = generateReviewCouponCode(order);
        const expiresAt = new Date(Date.now() + REVIEW_COUPON_VALID_DAYS * 24 * 60 * 60 * 1000);

        try {
            await window.BoseAdmin.createCoupon({
                code,
                type: "percent",
                value: REVIEW_COUPON_PERCENT,
                is_active: true,
                expires_at: expiresAt.toISOString(),
            });

            const message = buildReviewCouponMessage(code);
            try {
                await navigator.clipboard.writeText(message);
                window.BoseAdminUI.showToast(`تم إصدار الكود ${code} ونسخ رسالة جاهزة - الصقيها في واتساب`, "success");
            } catch (clipErr) {
                window.BoseAdminUI.showToast(`تم إصدار الكود: ${code}`, "success");
            }

            const intl = toInternational(order.phone1);
            const waUrl = window.BoseAdminUI.buildWhatsappUrl
                ? window.BoseAdminUI.buildWhatsappUrl(intl, message)
                : `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
            window.open(waUrl, "_blank", "noopener");
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر إصدار الكوبون - جربي تاني", "error");
        }
    }

    function renderTable() {
        const tbody = document.getElementById("followups-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!currentFollowups.length) {
            tbody.innerHTML = `<tr><td colspan="6">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-comment-dots",
                title: "مفيش تذكيرات مستحقة دلوقتي",
                text: "أي طلب يتسلم وتفضل يوم كامل من غير تذكير، هيظهر هنا تلقائياً.",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = currentFollowups.map((o) => {
            const img = firstItemImage(o.order_items);
            const imgCell = img
                ? `<a href="${e(img)}" target="_blank" rel="noopener" title="افتحي/احفظي الصورة عشان ترفقيها يدوي لو حبيتي"><img src="${e(img)}" style="width:38px; height:38px; border-radius:8px; object-fit:cover;" alt=""></a>`
                : `<span class="adm-order-item-meta">بدون صورة</span>`;
            return `
            <tr>
                <td>${e(o.order_number || "—")}</td>
                <td>${imgCell}</td>
                <td>${e(o.customer_name || "—")}<br><span class="adm-order-item-meta">${e(o.phone1 || "")}</span></td>
                <td style="max-width: 200px; white-space: normal;">${e(itemsSummary(o.order_items))}</td>
                <td>${daysSince(o.delivered_at)}</td>
                <td class="adm-table-actions">
                    <a class="adm-btn adm-btn-primary" href="${buildWhatsappUrl(o)}" target="_blank" rel="noopener" style="text-decoration:none; white-space:nowrap;">
                        <i class="fa-brands fa-whatsapp"></i> ابعتي التذكير
                    </a>
                    <button class="adm-btn adm-btn-outline" data-action="issue-coupon" data-id="${e(o.id)}" style="white-space:nowrap;" title="استخدميه بعد ما توصلك سكرين شوت التقييم">
                        <i class="fa-solid fa-gift"></i> إصدار كوبون ٥٪
                    </button>
                    <button class="adm-btn adm-btn-ghost" data-action="mark-sent" data-id="${e(o.id)}">تم الإرسال</button>
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll('[data-action="mark-sent"]').forEach((btn) => {
            btn.addEventListener("click", () => handleMarkSent(btn.getAttribute("data-id")));
        });
        tbody.querySelectorAll('[data-action="issue-coupon"]').forEach((btn) => {
            btn.addEventListener("click", () => handleIssueCoupon(btn.getAttribute("data-id")));
        });
    }

    async function handleMarkSent(orderId) {
        try {
            await window.BoseAdmin.markReviewReminderSent(orderId);
            window.BoseAdminUI.showToast("تم تسجيل إرسال التذكير", "success");
            await loadFollowups();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر تسجيل الإرسال", "error");
        }
    }

    async function loadFollowups() {
        const tbody = document.getElementById("followups-tbody");
        tbody.innerHTML = `<tr><td colspan="6"><div class="adm-loading-spinner"></div></td></tr>`;
        currentFollowups = await window.BoseAdmin.getReviewFollowups();
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("followups-refresh-btn").addEventListener("click", loadFollowups);
        await loadFollowups();
    });
})();
