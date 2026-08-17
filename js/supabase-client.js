/**
 * =====================================================================
 * 🗄️ طبقة الاتصال بقاعدة بيانات حلويات بوسي (Supabase)
 * =====================================================================
 * ⚠️ يحتوي فقط على الـ publishable key (آمن للعرض العلني في المتصفح).
 * المفتاح السري (service_role) ممنوع منعاً باتاً هنا أو في أي ملف فرونت.
 * الحماية الحقيقية تتم عبر سياسات RLS في قاعدة البيانات نفسها
 * (راجع 02_security_rls.sql).
 *
 * يُحمَّل هذا الملف قبل core-engine.js في كل الصفحات:
 * <script src="js/supabase-client.js?v=..." defer></script>
 */

(function () {
    "use strict";

    const SUPABASE_URL = "https://thwlsijxvrgyckpoeyua.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HdLUW0DNMcVe7b1yI9xJXQ_3avPPn2u";
    const REST_BASE = `${SUPABASE_URL}/rest/v1`;
    const RPC_BASE = `${SUPABASE_URL}/rest/v1/rpc`;

    const commonHeaders = {
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
    };

    /**
     * طلب REST عام مع محاولات إعادة تلقائية بسيطة (نفس فلسفة الموقع الحالية
     * في التعامل مع الشبكة غير المستقرة).
     */
    async function boseSupabaseFetch(path, options = {}, retries = 2) {
        const url = `${REST_BASE}${path}`;
        try {
            const res = await fetch(url, {
                ...options,
                headers: { ...commonHeaders, ...(options.headers || {}) },
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                throw new Error(`Supabase error ${res.status}: ${errText}`);
            }
            const text = await res.text();
            return text ? JSON.parse(text) : null;
        } catch (err) {
            if (retries > 0) {
                await new Promise((r) => setTimeout(r, 600));
                return boseSupabaseFetch(path, options, retries - 1);
            }
            throw err;
        }
    }

    async function boseSupabaseRpc(fnName, payload) {
        const res = await fetch(`${RPC_BASE}/${fnName}`, {
            method: "POST",
            headers: commonHeaders,
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new Error(`Supabase RPC error ${res.status}: ${errText}`);
        }
        return res.json();
    }

    /**
     * 🏬 تحميل كل بيانات المتجر (يحل محل fetch لـ site-data-final.json).
     * يبني نفس شكل window.BoseStoreData المستخدم في core-engine.js حاليًا
     * حتى لا يحتاج أي كود تاني في الموقع للتغيير.
     */
    async function loadBoseStoreDataFromSupabase() {
        const [settingsRows, categories, products, offers, shippingZones] = await Promise.all([
            boseSupabaseFetch("/store_settings?id=eq.1&select=*"),
            boseSupabaseFetch("/categories?select=*&order=sort_order.asc"),
            boseSupabaseFetch("/products?select=*&order=sort_order.asc"),
            boseSupabaseFetch("/offers?select=*&order=sort_order.asc"),
            boseSupabaseFetch("/shipping_zones?select=*"),
        ]);

        const settings = (settingsRows && settingsRows[0]) || {};

        // إعادة تجميع كل منتج بنفس المفاتيح المستخدمة حالياً في core-engine.js
        // 🛡️ [أمان الشكل]: oldPrice/reviews/layout مضافين هنا دفاعياً - لو الأعمدة دي
        // مش موجودة في جدول products لسه، بترجع undefined عادي زي ما كانت، ومفيش
        // أي كسر. اللي بيحصل فعلياً هو إن قسم العروض (offers) هيفضل فاضي لحد ما
        // الأعمدة دي تتضاف وتتملى من لوحة التحكم - مش هيحصل خطأ في الكونسول.
        const rebuiltProducts = (products || []).map((p) => ({
            id: p.id,
            slug: p.id,
            category: p.category_id,
            title: p.title,
            flavorName: p.flavor_name,
            flavorDesc: p.flavor_desc,
            description: p.description,
            layout: p.layout || "grid-card",
            images: p.images || [],
            price: p.price,
            oldPrice: p.old_price || null,
            basePrice: p.base_price,
            prices: p.prices || {},
            defaultSize: p.default_size,
            // 🚨 [تفعيل عمود موجود فعلاً بقاعدة البيانات لكن كان غير مستخدم]: size_descriptions
            // موجود جاهز في جدول products (لوصف مخصص لكل حجم زي الديسباسيتو) بس مكنش بيتحط
            // في كائن المنتج هنا أصلاً، فمفيش أي صفحة كانت تقدر تستخدمه حتى لو اتكتب من
            // لوحة التحكم. دلوقتي بيوصل للواجهة عشان صفحة المنتج تقدر تغيّر الوصف تلقائياً
            // مع تغيير الحجم المختار.
            sizeDescriptions: p.size_descriptions || {},
            // 🖼️ [صور الأحجام المتعددة]: خريطة اختيارية { triangle: "url", medium: "url", ... }
            // بتديك صورة مختلفة لكل حجم بدل ما كل الأحجام تشترك في نفس صورة images[0].
            // لو الحجم مالوش صورة مخصصة، صفحة المنتج بترجع تلقائياً للصورة الافتراضية.
            sizeImages: p.size_images || {},
            // 🚨 [حل جذري لمشكلة "العميل مش فاهم الكمية"]: quantity_note عمود جديد
            // بيوضح بالظبط إيه اللي السعر بيغطيه (مثال: "دستة كاملة = 12 قطعة").
            // بيوصل هنا فاضي (null) لأي منتج لسه متعرفش الوصف بتاعه، فمفيش أي كسر
            // أو نص فاضي بيتعرض غلط - الواجهة (createProductCardHTML وصفحة المنتج)
            // بترسم البادچ ده بس لو فيه نص فعلي.
            quantityNote: p.quantity_note || null,
            builderType: p.builder_type,
            customBuilderUrl: p.custom_builder_url,
            searchTerms: p.search_terms || [],
            featured: p.is_featured,
            rating: p.rating,
            reviews: p.seed_reviews || [],
            isAvailable: p.is_available !== false,
        }));

        return {
            store: settings.store || {},
            orderRules: settings.order_rules || {},
            seo: settings.seo || {},
            social: settings.social || {},
            navigation: settings.navigation || {},
            footer: settings.footer || {},
            cakeBuilder: settings.cake_builder || {},
            flowerBuilder: settings.flower_builder || {},
            // 🛡️ [إصلاح حرج]: homepage و promotions كانوا بيرجعوا من store_settings.*
            // (select=*) لكن مكنوش بيتم تمريرهم في الـ object الراجع، فكانت أقسام
            // الواجهة الرئيسية (الأكثر مبيعاً، وصل حديثاً، منتجاتنا، سلايدر الفئات،
            // إحصائيات الفخر، بانر التورت/الورد) هتفضل فاضية تماماً وممكن تعمل كسر
            // JS فعلي (data.homepage.mostSelling على undefined). دلوقتي بيرجعوا
            // كـ object/array فاضي كحد أدنى آمن حتى لو العمود لسه فاضي في القاعدة.
            homepage: settings.homepage || {},
            promotions: settings.promotions || [],
            categories: categories || [],
            products: rebuiltProducts,
            offers: offers || [],
            shippingZones: shippingZones || [],
        };
    }

    /**
     * 🕒 [كاش ذكي مع إبطال تلقائي]: بترجع "بصمة" وقت آخر تعديل مؤثر على بيانات
     * الموقع العام (منتجات/فئات/عروض/مناطق شحن/إعدادات المتجر) من دالة قاعدة
     * البيانات get_bose_data_version(). طلب صغير جداً (قيمة واحدة بس - timestamp
     * مفرد، مش جدول) بيستخدمه core-engine.js عشان يقرر يفضل مستخدم الكاش المحلي
     * (localStorage) ولا يجيب بيانات كاملة جديدة - بدل ما يستنى انتهاء صلاحية
     * الكاش بالوقت بس زي ما كان قبل كده.
     * 🛡️ الدالة دي متاحة لـ anon (اتأكدنا من صلاحيات EXECUTE في القاعدة)، ومحمية
     * بـ SECURITY DEFINER + STABLE + search_path ثابت في تعريفها.
     *
     * @returns {Promise<string>} قيمة زمنية (ISO timestamp) تمثل آخر تحديث فعلي
     */
    async function getBoseDataVersion() {
        return boseSupabaseRpc("get_bose_data_version", {});
    }

    /**
     * 🧾 تسجيل الطلب في قاعدة البيانات فعلياً (يحل المشكلة الحرجة: الطلب
     * كان بيضيع لو مفتحش واتساب أو العميل قفل الصفحة قبل الإرسال).
     * يُستدعى من cart-engine.js **قبل** فتح رابط واتساب مباشرة.
     *
     * @param {Object} orderPayload - نفس بنية order في buildBoseFormattedWhatsappInvoice
     * @returns {Promise<{orderId: string, orderNumber: string}>}
     */
    async function submitBoseOrderToDatabase(orderPayload) {
        const items = (orderPayload.items || []).map((item) => ({
            product_id: item.slug || item.productId || null,
            item_type: item.type || "ready-made",
            title: item.title,
            flavor_name: item.flavorName || null,
            quantity: item.quantity || 1,
            unit_price: parseFloat(item.finalPrice) || 0,
            line_total: (parseFloat(item.finalPrice) || 0) * (item.quantity || 1),
            custom_details: item.customDetails || {},
            // 🛡️ هنا بالتحديد رابط الصورة المرفوعة (Cloudinary) بيتسجل فعلياً
            // مربوطاً بالطلب في قاعدة البيانات، بدل ما يضيع بعد الإرسال
            reference_images: item.image && item.image.startsWith("http")
                ? [item.image]
                : (item.referenceImages || []),
        }));

        const result = await boseSupabaseRpc("create_order_with_items", {
            p_customer_name: orderPayload.customerName,
            p_phone1: orderPayload.phone1,
            p_phone2: orderPayload.phone2 || null,
            p_delivery_method: orderPayload.deliveryMethod,
            p_address: orderPayload.address || null,
            p_shipping_zone_id: orderPayload.shippingZoneId || null,
            p_scheduled_date: orderPayload.scheduledDateRaw || null, // YYYY-MM-DD
            p_scheduled_time: orderPayload.scheduledTime || null,
            p_notes: orderPayload.notes || null,
            p_coupon_code: orderPayload.couponCode || null,
            p_subtotal: parseFloat(orderPayload.subtotal) || 0,
            p_shipping_fee: parseFloat(orderPayload.shippingFee) || 0,
            p_discount_amount: parseFloat(orderPayload.discountAmount) || 0,
            p_grand_total: parseFloat(orderPayload.grandTotal) || 0,
            p_items: items,
            p_pay_full: !!orderPayload.payFull,
        });

        const row = Array.isArray(result) ? result[0] : result;
        return {
            orderId: row.order_id,
            orderNumber: row.order_number,
            depositAmount: row.deposit_amount,
            grandTotal: row.grand_total,
        };
    }

    /**
     * ⭐ إرسال مراجعة حقيقية لقاعدة البيانات (تحل محل localStorage الوهمي).
     * تدخل تلقائياً في "قائمة انتظار المراجعة" (is_approved = false) ولا
     * تظهر للعامة إلا بعد اعتماد الإدارة من لوحة التحكم لاحقاً.
     */
    async function submitBoseReview({ productId, userName, rating, comment, images }) {
        return boseSupabaseFetch("/reviews", {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify([
                {
                    product_id: productId,
                    user_name: userName,
                    rating,
                    comment,
                    images: images || [],
                    is_approved: false,
                },
            ]),
        });
    }

    /** ⭐ جلب المراجعات المعتمدة فقط لمنتج معيّن */
    async function fetchApprovedReviews(productId) {
        return boseSupabaseFetch(
            `/reviews?product_id=eq.${encodeURIComponent(productId)}&is_approved=eq.true&select=*&order=created_at.desc`
        );
    }

    /**
     * 📸 دالة رفع صورة موحّدة لكل المحاكيات (تورت + ورد) — رفع مباشر من
     * متصفح العميل لـ Cloudinary (بدون المرور على أي سيرفر وسيط)، بعد ضغط
     * الصورة محلياً على جهاز العميل لتقليل استهلاك البيانات والوقت.
     * نفس الآلية المستخدمة في flower-engine.js بالظبط، موحّدة هنا عشان
     * cake-engine.js يستخدمها كمان بدل ما تتكرر في كل ملف لوحده.
     *
     * @param {File} file - ملف الصورة من input[type=file]
     * @param {Function} onProgressText - (اختياري) callback بنص حالة الرفع
     * @returns {Promise<string>} رابط Cloudinary النهائي (secure_url)
     */
    async function uploadBoseReferenceImage(file, onProgressText) {
        if (!file) throw new Error("لم يتم اختيار أي ملف");
        if (!file.type.startsWith("image/")) throw new Error("الملف المختار ليس صورة");

        if (onProgressText) onProgressText("بنجهز الصورة بأعلى جودة...");

        const compressedBlob = await new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = (e) => { img.src = e.target.result; };
            reader.onerror = reject;
            img.onload = () => {
                const MAX_DIM = 1280; // كافية جداً لعرض التصميم بجودة عالية بأقل حجم ممكن
                let { width, height } = img;
                if (width > height && width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
                else if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
                const canvas = document.createElement("canvas");
                canvas.width = width; canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("فشل ضغط الصورة"))), "image/jpeg", 0.7);
            };
            img.onerror = reject;
            reader.readAsDataURL(file);
        });

        if (onProgressText) onProgressText("بنرفع الصورة الآن...");

        const cloudName = window.BoseStoreData?.store?.cloudinaryCloudName || "dyx4w0dr1";
        const formData = new FormData();
        formData.append("file", compressedBlob, "bose_reference.jpg");
        // 🚨🚨 [إصلاح جذري حرج - سبب فشل رفع صور الطباعة بالكامل]: كان هنا preset
        // اسمه "ml_default" - ده اسم افتراضي بس مش مفعّل فعلياً كـ Unsigned Upload
        // Preset على حساب Cloudinary بتاع المتجر، فأي محاولة رفع كانت بترجع خطأ
        // مباشرة من Cloudinary نفسه (401/400) قبل ما توصل حتى لمرحلة حفظ الصورة -
        // وده سبب فشل رفع صور الطباعة على التورت والورد بالكامل. لوحة التحكم
        // (admin-ui-utils.js) بترفع صور المنتجات بنجاح لأنها بتستخدم preset حقيقي
        // مفعّل فعلاً على نفس الحساب: "gct8i28h" - استخدمنا نفس القيمة هنا بالظبط.
        formData.append("upload_preset", "gct8i28h");

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("فشل رفع الصورة، حاول مرة أخرى");
        const data = await res.json();
        if (!data.secure_url) throw new Error("لم يتم استلام رابط الصورة من الخادم");
        return data.secure_url;
    }

    /** 🏷️ التحقق من كوبون عبر الدالة الآمنة (بدون كشف كل الأكواد) */
    async function validateBoseCoupon(code) {
        const result = await boseSupabaseRpc("validate_coupon", { p_code: code });
        const row = Array.isArray(result) ? result[0] : result;
        return row || { is_valid: false, message: "تعذر التحقق من الكود" };
    }

    /**
     * 📦 تتبع الطلب: بيرجع حالة الطلب وتفاصيله لو رقم الطلب + رقم الهاتف مطابقين
     * فعلياً لطلب حقيقي في القاعدة (نفس فلسفة validate_coupon: RPC آمن بدل SELECT
     * مباشر على جدول orders المقفول بالكامل بـ RLS للأدمن فقط).
     */
    async function trackBoseOrder(orderNumber, phone) {
        const result = await boseSupabaseRpc("track_order_by_number_and_phone", {
            p_order_number: orderNumber,
            p_phone: phone,
        });
        const row = Array.isArray(result) ? result[0] : result;
        return row || { found: false, message: "تعذر التحقق من الطلب، حاولي مرة أخرى" };
    }

    /**
     * 🎁 مكافآت العميل: بتحسب النقاط/المستوى فعلياً من إجمالي طلبات العميل
     * الحقيقية المرتبطة برقم هاتفه (باستثناء الطلبات الملغاة) عبر RPC آمن.
     */
    async function getBoseCustomerRewards(phone) {
        const result = await boseSupabaseRpc("get_customer_rewards", { p_phone: phone });
        const row = Array.isArray(result) ? result[0] : result;
        return row || { found: false, message: "تعذر التحقق من رصيد المكافآت، حاولي مرة أخرى" };
    }

    /**
     * 🔌 [نقطة الربط الجاهزة مسبقاً]: cart-engine.js بيستدعي بالفعل
     * window.saveBoseOrderToDatabase(completedBoseOrderObject) بعد فتح واتساب
     * مباشرة (كان hook فارغ من غير تنفيذ قبل كده). هنا التنفيذ الفعلي: بنحوّل
     * شكل الـ object الجاهز في cart-engine.js لنفس الشكل اللي submitBoseOrderToDatabase
     * محتاجه، ونستدعيها.
     */
    async function saveBoseOrderToDatabase(completedBoseOrderObject) {
        const o = completedBoseOrderObject;
        // 🌸 [نظام التعرّف على العميل - المرحلة 2]: عمود الملاحظات في قاعدة
        // البيانات واحد بس (notes)، فمفيش عمود منفصل لملاحظات الشحن. عشان ملاحظة
        // الشحن متضيعش من سجل الطلب المحفوظ فعلياً في قاعدة البيانات (حتى لو
        // ظهرت في فاتورة الواتساب في سطر منفصل)، بندمجها هنا كسطر إضافي واضح
        // جوه نص الملاحظات المرسل لقاعدة البيانات.
        const combinedNotes = (o.shippingNotes && o.shippingNotes.trim() !== "")
            ? `${o.notes || "لا توجد ملاحظات إضافية"}\n🚚 ملاحظات التوصيل: ${o.shippingNotes.trim()}`
            : o.notes;
        return submitBoseOrderToDatabase({
            customerName: o.customerName,
            phone1: o.phone1,
            phone2: o.phone2,
            deliveryMethod: o.deliveryMethod === "استلام من الفرع" ? "pickup" : "delivery",
            address: o.address,
            // 🛡️ [إصلاح حرج]: cart-engine.js بقى بيبعت الـid الحقيقي لمنطقة الشحن
            // (o.shippingZoneId) من قايمة shipping_zones فعلياً - كنا هنا بنتجاهله
            // ونكتب null يدوياً بدل ما نستخدمه، فالإصلاح في cart-engine.js كان
            // بيضيع في النص. دلوقتي بنمرره فعلياً لقاعدة البيانات.
            shippingZoneId: o.shippingZoneId || null,
            scheduledDateRaw: o.scheduledDateISO || o.scheduledDate, // بصيغة YYYY-MM-DD بالفعل من <input type="date">
            scheduledTime: o.scheduledTime,
            notes: combinedNotes,
            couponCode: o.couponCode || null,
            subtotal: parseFloat(o.subtotal) || ((o.grandTotal || 0) - (o.shippingFee || 0)),
            shippingFee: o.shippingFee || 0,
            discountAmount: parseFloat(o.discountAmount) || 0,
            grandTotal: o.grandTotal,
            items: o.items || [],
            payFull: !!o.payFull,
        });
    }

    // تصدير الدوال على window بنفس فلسفة الموقع الحالية (window.escapeBoseHTML...)
    window.BoseSupabase = {
        loadBoseStoreDataFromSupabase,
        getBoseDataVersion,
        submitBoseOrderToDatabase,
        submitBoseReview,
        fetchApprovedReviews,
        validateBoseCoupon,
        uploadBoseReferenceImage,
        trackBoseOrder,
        getBoseCustomerRewards,
    };
    // الاسم اللي cart-engine.js بينده عليه فعلياً (راجع processFinalBoseOrder)
    window.saveBoseOrderToDatabase = saveBoseOrderToDatabase;
})();