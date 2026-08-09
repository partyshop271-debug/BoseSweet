/**
 * admin-data.js
 * =====================================================================
 * 🗄️ نقطة الاتصال المركزية الوحيدة بـ Supabase لكل لوحة التحكم.
 * ممنوع أي صفحة أو ملف تاني يكلم Supabase مباشرة - كله لازم يعدي من هنا.
 *
 * بيستخدم نفس مفتاح الـ publishable key المستخدم في الموقع العام
 * (js/supabase-client.js) - مفيش أي سر جديد. الحماية الحقيقية بالكامل
 * على مستوى RLS في قاعدة البيانات (راجع 01_admin_setup.sql).
 *
 * لازم يتحمل بعد مكتبة supabase-js من الـ CDN وقبل أي ملف تاني في اللوحة:
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * <script src="js/admin-data.js"></script>
 */

(function () {
    "use strict";

    const SUPABASE_URL = "https://thwlsijxvrgyckpoeyua.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HdLUW0DNMcVe7b1yI9xJXQ_3avPPn2u";

    if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
        console.error("❌ مكتبة supabase-js مش محمّلة قبل admin-data.js");
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
    });

    /**
     * بتشيل أي حرف عنده معنى خاص في صياغة فلاتر PostgREST (,()."*)
     * قبل ما ندخّل نص بحث المستخدم جوه .or(). من غير كده، فاصلة أو قوس
     * في نص البحث ممكن يكسر صياغة الفلتر أو يغيّر شرط الاستعلام المقصود.
     */
    function sanitizeFilterValue(value) {
        return value.replace(/[,()."*]/g, "");
    }

    /* ============================= المصادقة (Auth) ============================= */

    async function signIn(email, password) {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        await client.auth.signOut();
    }

    async function getSession() {
        const { data } = await client.auth.getSession();
        return data.session || null;
    }

    /**
     * تتأكد إن المستخدم الحالي مسجل دخول وموجود فعلاً في جدول admins
     * (مش بس عنده جلسة Auth) - نفس الشرط اللي الـ RLS بيتحقق منه في السيرفر.
     */
    async function verifyIsAdmin() {
        const session = await getSession();
        if (!session) return null;

        const { data, error } = await client
            .from("admins")
            .select("user_id, display_name")
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (error || !data) return null;
        return { email: session.user.email, displayName: data.display_name || session.user.email };
    }

    function onAuthStateChange(callback) {
        client.auth.onAuthStateChange((_event, session) => callback(session));
    }

    /* ============================= الداشبورد ============================= */

    /**
     * ملخص سريع للداشبورد. مكتوبة بشكل دفاعي: لو جدول orders مسمى بشكل
     * مختلف في القاعدة الفعلية، بترجع 0 بدل ما توقف الداشبورد بالكامل.
     */
    async function getDashboardSummary() {
        const summary = {
            ordersToday: 0,
            pendingReviews: 0,
            totalProducts: 0,
            activeOffers: 0,
        };

        try {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const { count } = await client
                .from("orders")
                .select("id", { count: "exact", head: true })
                .gte("created_at", startOfToday.toISOString());
            summary.ordersToday = count || 0;
        } catch (e) { console.warn("تعذر جلب طلبات اليوم:", e.message); }

        try {
            const { count } = await client
                .from("reviews")
                .select("id", { count: "exact", head: true })
                .eq("is_approved", false);
            summary.pendingReviews = count || 0;
        } catch (e) { console.warn("تعذر جلب التقييمات المعلقة:", e.message); }

        try {
            const { count } = await client
                .from("products")
                .select("id", { count: "exact", head: true });
            summary.totalProducts = count || 0;
        } catch (e) { console.warn("تعذر جلب عدد المنتجات:", e.message); }

        try {
            const { data } = await client.from("products").select("id, price, old_price");
            summary.activeOffers = (data || []).filter((p) => p.old_price && p.old_price > p.price).length;
        } catch (e) { console.warn("تعذر جلب عدد العروض النشطة:", e.message); }

        return summary;
    }

    /** آخر 5 طلبات لعرضها في الداشبورد */
    async function getRecentOrders(limit = 5) {
        try {
            const { data, error } = await client
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(limit);
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب أحدث الطلبات:", e.message);
            return [];
        }
    }

    /* ============================= الطلبات (صفحة orders.html) ============================= */

    /**
     * كل الطلبات مع عناصرها (order_items)، الأحدث أولاً.
     * @param {{status?: string, search?: string}} filters - status: فلترة بحالة معينة، search: بحث في رقم الطلب/اسم العميل/التليفون
     */
    async function getAllOrders(filters = {}) {
        try {
            let query = client
                .from("orders")
                .select("*, order_items(*)")
                .order("created_at", { ascending: false });

            if (filters.status) {
                query = query.eq("status", filters.status);
            }
            if (filters.search && filters.search.trim()) {
                // تعقيم نص البحث قبل تركيبه جوه صياغة .or() عشان فاصلة أو قوس
                // مكتوبين من الأدمن ميكسروش الفلتر أو يغيّروا شرط الاستعلام.
                const s = sanitizeFilterValue(filters.search.trim());
                if (s) {
                    query = query.or(
                        `order_number.ilike.%${s}%,customer_name.ilike.%${s}%,phone1.ilike.%${s}%,phone2.ilike.%${s}%`
                    );
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب الطلبات:", e.message);
            return [];
        }
    }

    /** تحديث حالة طلب واحد (pending/confirmed/preparing/out_for_delivery/delivered/cancelled) */
    async function updateOrderStatus(orderId, newStatus) {
        const { error } = await client.from("orders").update({ status: newStatus }).eq("id", orderId);
        if (error) throw error;
    }

    /* ============================= إعدادات المتجر (الصفحة الرئيسية) ============================= */

    /** يرجّع كائن homepage بس من صف store_settings الوحيد (id=1) */
    async function getHomepageSettings() {
        try {
            const { data, error } = await client
                .from("store_settings")
                .select("homepage")
                .eq("id", 1)
                .maybeSingle();
            if (error) throw error;
            return (data && data.homepage) || {};
        } catch (e) {
            console.warn("تعذر جلب إعدادات الصفحة الرئيسية:", e.message);
            return {};
        }
    }

    /**
     * بتستبدل عمود homepage بالكامل بالكائن الممرر - الصفحة اللي بتنادي الدالة دي
     * مسؤولة إنها تجيب القيم الحالية الأول وتعدّل عليها (مش تبعت كائن جزئي)
     * عشان الحقول اللي الصفحة مش بتعدّل عليها (زي hero و pride) متتمسحش.
     */
    async function updateHomepageSettings(homepage) {
        const { error } = await client
            .from("store_settings")
            .update({ homepage, updated_at: new Date().toISOString() })
            .eq("id", 1);
        if (error) throw error;
    }

    /** يرجّع مصفوفة العروض (promotions) من صف store_settings الوحيد */
    async function getPromotions() {
        try {
            const { data, error } = await client
                .from("store_settings")
                .select("promotions")
                .eq("id", 1)
                .maybeSingle();
            if (error) throw error;
            return (data && data.promotions) || [];
        } catch (e) {
            console.warn("تعذر جلب العروض:", e.message);
            return [];
        }
    }

    /** بتستبدل مصفوفة العروض بالكامل - الصفحة اللي بتنادي الدالة دي بتبعت المصفوفة كاملة بعد التعديل */
    async function savePromotions(promotions) {
        const { error } = await client
            .from("store_settings")
            .update({ promotions, updated_at: new Date().toISOString() })
            .eq("id", 1);
        if (error) throw error;
    }

    /* ============================= العروض المميزة (صفحة offers.html) ============================= */
    /**
     * جدول offers منفصل تماماً عن store_settings.promotions: كل صف هنا هو
     * ربط حقيقي (product_id FK) لمنتج موجود بالفعل في جدول products، مش
     * كائن مستقل مكرر ببيانات خاصة بيه. الهدف: عرض "هذا المنتج عليه عرض"
     * بدون تكرار المنتج كسطر منفصل بسعر مختلف في صفحة الفئة (المشكلة
     * اللي كانت موجودة قبل كده في category.html على الموقع العام).
     */

    /** كل العروض مع بيانات المنتج المرتبط بيها (العنوان/الصورة/السعر/السعر القديم) */
    async function getAllOffers() {
        try {
            const { data, error } = await client
                .from("offers")
                .select("*, products(id, title, images, price, old_price)")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب العروض:", e.message);
            return [];
        }
    }

    /** إضافة عرض جديد بربط منتج موجود (product_id لازم يكون id منتج حقيقي في جدول products) */
    async function createOffer(offer) {
        const { error } = await client.from("offers").insert(offer);
        if (error) throw error;
    }

    /** تعديل ترتيب/منتج عرض موجود */
    async function updateOffer(id, updates) {
        const { error } = await client.from("offers").update(updates).eq("id", id);
        if (error) throw error;
    }

    /** إزالة عرض (بيشيل الربط بس، مش بيحذف المنتج نفسه من products) */
    async function deleteOffer(id) {
        const { error } = await client.from("offers").delete().eq("id", id);
        if (error) throw error;
    }

    /* ============================= المنتجات والفئات (صفحة products.html) ============================= */

    /** كل الفئات مرتبة زي ما بتتعرض في الموقع */
    async function getAllCategories() {
        try {
            const { data, error } = await client
                .from("categories")
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب الفئات:", e.message);
            return [];
        }
    }

    /** إضافة فئة جديدة. category.id لازم يكون فريد (نص إنجليزي، زي: taswaq-cupcake) */
    async function createCategory(category) {
        const { error } = await client.from("categories").insert(category);
        if (error) throw error;
    }

    /** تعديل فئة موجودة */
    async function updateCategory(id, updates) {
        const { error } = await client.from("categories").update(updates).eq("id", id);
        if (error) throw error;
    }

    /** حذف فئة نهائياً - هيفشل لو فيه منتجات لسه مرتبطة بيها (foreign key) */
    async function deleteCategory(id) {
        const { error } = await client.from("categories").delete().eq("id", id);
        if (error) throw error;
    }

    /** كل المنتجات مع اسم الفئة بتاعتها */
    async function getAllProducts() {
        try {
            const { data, error } = await client
                .from("products")
                .select("*, categories(title)")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب المنتجات:", e.message);
            return [];
        }
    }

    /** إضافة منتج جديد. product.id لازم يكون فريد (نص إنجليزي، زي: gateaux-royal) */
    async function createProduct(product) {
        const { error } = await client.from("products").insert(product);
        if (error) throw error;
    }

    /** تعديل منتج موجود */
    async function updateProduct(id, updates) {
        const { error } = await client.from("products").update(updates).eq("id", id);
        if (error) throw error;
    }

    /** حذف منتج نهائياً */
    async function deleteProduct(id) {
        const { error } = await client.from("products").delete().eq("id", id);
        if (error) throw error;
    }

    /* ============================= الكوبونات (صفحة coupons.html) ============================= */
    /**
     * المفتاح الأساسي هنا هو code نفسه (نص فريد)، مش id منفصل - نفس شكل
     * جدول coupons في القاعدة. أي إنشاء بكود مستخدم قبل كده هيترفض من
     * القاعدة (unique constraint على code) قبل ما يوصل لأي مكان تاني.
     */

    /** كل الكوبونات مرتبة أبجدياً */
    async function getAllCoupons() {
        try {
            const { data, error } = await client
                .from("coupons")
                .select("*")
                .order("code", { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب الكوبونات:", e.message);
            return [];
        }
    }

    /** إضافة كوبون جديد. coupon.code لازم يكون فريد */
    async function createCoupon(coupon) {
        const { error } = await client.from("coupons").insert(coupon);
        if (error) throw error;
    }

    /** تعديل كوبون موجود (بالكود - الكود نفسه مينفعش يتغيّر بعد الإنشاء) */
    async function updateCoupon(code, updates) {
        const { error } = await client.from("coupons").update(updates).eq("code", code);
        if (error) throw error;
    }

    /** حذف كوبون نهائياً */
    async function deleteCoupon(code) {
        const { error } = await client.from("coupons").delete().eq("code", code);
        if (error) throw error;
    }

    /* ============================= التقييمات (صفحة reviews.html) ============================= */
    /**
     * كل تقييم بيدخل القاعدة بـ is_approved = false تلقائياً (من submitBoseReview
     * في الموقع العام) ومش بيظهر للعملاء إلا بعد اعتماد صريح من هنا. مفيش حالة
     * "مرفوض" منفصلة في القاعدة - الرفض هنا معناه حذف نهائي للتقييم.
     */

    /**
     * كل التقييمات مع اسم المنتج المرتبط بيها.
     * @param {{approved?: boolean}} filters - approved: true (معتمدة فقط) / false (قيد المراجعة فقط) / بدونها (الكل)
     */
    async function getAllReviews(filters = {}) {
        try {
            let query = client
                .from("reviews")
                .select("*, products(title)")
                .order("created_at", { ascending: false });

            if (filters.approved === true) query = query.eq("is_approved", true);
            if (filters.approved === false) query = query.eq("is_approved", false);

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب التقييمات:", e.message);
            return [];
        }
    }

    /** اعتماد تقييم - يظهر فوراً للعملاء في صفحة المنتج */
    async function approveReview(id) {
        const { error } = await client.from("reviews").update({ is_approved: true }).eq("id", id);
        if (error) throw error;
    }

    /** التراجع عن اعتماد تقييم معتمد بالفعل - يختفي من الموقع العام فوراً */
    async function unapproveReview(id) {
        const { error } = await client.from("reviews").update({ is_approved: false }).eq("id", id);
        if (error) throw error;
    }

    /** حذف تقييم نهائياً (رفض) */
    async function deleteReview(id) {
        const { error } = await client.from("reviews").delete().eq("id", id);
        if (error) throw error;
    }

    /* ============================= إعدادات المحاكيات (صفحة builders-settings.html) ============================= */
    /**
     * ⚠️ إصلاح حرج: الدالتين دول كانوا مستخدمين فعلياً من builders-page.js
     * (window.BoseAdmin.getBuilderSettings / saveBuilderSettings) لكن مكنوش
     * لهم أي تعريف هنا ولا في تصدير window.BoseAdmin - يعني صفحة إعدادات
     * المحاكيات كانت هتكسر فوراً بمجرد فتحها (getBuilderSettings is not a
     * function). الأعمدة cake_builder/flower_builder موجودة فعلاً في جدول
     * store_settings وعليها بيانات حقيقية بالفعل - كانت بس مش متوصّلة هنا.
     */

    /** يرجّع إعدادات محاكي التورت والورد من صف store_settings الوحيد (id=1) */
    async function getBuilderSettings() {
        try {
            const { data, error } = await client
                .from("store_settings")
                .select("cake_builder, flower_builder")
                .eq("id", 1)
                .maybeSingle();
            if (error) throw error;
            return {
                cake_builder: (data && data.cake_builder) || {},
                flower_builder: (data && data.flower_builder) || {},
            };
        } catch (e) {
            console.warn("تعذر جلب إعدادات المحاكيات:", e.message);
            return { cake_builder: {}, flower_builder: {} };
        }
    }

    /** بتستبدل عمودي cake_builder و flower_builder بالكامل بالكائنين الممررين */
    async function saveBuilderSettings({ cake_builder, flower_builder }) {
        const { error } = await client
            .from("store_settings")
            .update({ cake_builder, flower_builder, updated_at: new Date().toISOString() })
            .eq("id", 1);
        if (error) throw error;
    }

    /* ============================= بيانات المتجر العامة (صفحة store-settings.html) ============================= */
    /**
     * ⚠️ إصلاح حرج (نفس مشكلة المحاكيات بالظبط): settings-page.js بينادي
     * window.BoseAdmin.getStoreGeneralSettings / saveStoreGeneralSettings
     * واللي مكنوش لهم أي تعريف هنا - صفحة "بيانات المتجر" كانت هتكسر فوراً
     * بمجرد فتحها. الأعمدة store/seo/social موجودة بالفعل في store_settings
     * (هي نفسها اللي الموقع العام بيقراها في core-engine.js/supabase-client.js).
     */

    /** يرجّع بيانات المتجر العامة + SEO + السوشيال ميديا من صف store_settings الوحيد */
    async function getStoreGeneralSettings() {
        try {
            const { data, error } = await client
                .from("store_settings")
                .select("store, seo, social")
                .eq("id", 1)
                .maybeSingle();
            if (error) throw error;
            return {
                store: (data && data.store) || {},
                seo: (data && data.seo) || {},
                social: (data && data.social) || {},
            };
        } catch (e) {
            console.warn("تعذر جلب بيانات المتجر:", e.message);
            return { store: {}, seo: {}, social: {} };
        }
    }

    /** بتستبدل أعمدة store/seo/social بالكامل بالكائنات الممررة */
    async function saveStoreGeneralSettings({ store, seo, social }) {
        const { error } = await client
            .from("store_settings")
            .update({ store, seo, social, updated_at: new Date().toISOString() })
            .eq("id", 1);
        if (error) throw error;
    }

    /* ============================= مناطق التوصيل (صفحة shipping-zones.html) ============================= */
    /**
     * كل صف هنا هو منطقة توصيل بسعرها الثابت. shipping_zone_id في جدول orders
     * بيشاور على id هنا مباشرة - فحذف منطقة مرتبطة بطلبات سابقة هيترفض من
     * القاعدة (foreign key) بدل ما يكسر سجل الطلبات القديمة.
     */

    /** كل مناطق التوصيل */
    async function getAllShippingZones() {
        try {
            const { data, error } = await client
                .from("shipping_zones")
                .select("*")
                .order("governorate", { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب مناطق التوصيل:", e.message);
            return [];
        }
    }

    /** إضافة منطقة توصيل جديدة. zone.id لازم يكون فريد (نص إنجليزي، زي: cairo-nasr-city) */
    async function createShippingZone(zone) {
        const { error } = await client.from("shipping_zones").insert(zone);
        if (error) throw error;
    }

    /** تعديل منطقة توصيل موجودة */
    async function updateShippingZone(id, updates) {
        const { error } = await client.from("shipping_zones").update(updates).eq("id", id);
        if (error) throw error;
    }

    /** حذف منطقة توصيل - هيفشل لو فيه طلبات سابقة مرتبطة بيها (foreign key) */
    async function deleteShippingZone(id) {
        const { error } = await client.from("shipping_zones").delete().eq("id", id);
        if (error) throw error;
    }

    /* ============================= صفحات السياسات (content_pages) ============================= */
    /**
     * صفوف ثابتة (order-policy / privacy-policy / return-policy / terms-conditions)
     * لكل واحدة id ثابت وعمود content نصي طويل. الموقع العام بيقرأها للعرض
     * العام (public read) والتعديل هنا بس (admin write) - نفس فلسفة كل
     * الجداول التانية.
     */

    /** كل صفحات السياسات/المعلومات الثابتة */
    async function getAllContentPages() {
        try {
            const { data, error } = await client.from("content_pages").select("*").order("id", { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب صفحات السياسات:", e.message);
            return [];
        }
    }

    /** تعديل محتوى صفحة سياسة موجودة (id ثابت، مش بيتغيّر ولا بيتضاف صفوف جديدة من هنا) */
    async function updateContentPage(id, content) {
        const { error } = await client
            .from("content_pages")
            .update({ content, updated_at: new Date().toISOString() })
            .eq("id", id);
        if (error) throw error;
    }

    /* ============================= تحديث جماعي للمنتجات (استوديو المحتوى) ============================= */
    /**
     * تحديث نفس الحقل/الحقول على مجموعة منتجات دفعة واحدة (زي: تعميم وصف
     * جديد على كل نكهات "الديسباسيتو" مرة واحدة) - استعلام واحد بدل ما نلف
     * على كل id لوحده.
     */
    async function bulkUpdateProducts(ids, updates) {
        if (!ids || !ids.length) return;
        const { error } = await client.from("products").update(updates).in("id", ids);
        if (error) throw error;
    }

    /* ============================= استوديو المحتوى (توليد بالذكاء الاصطناعي) ============================= */
    /**
     * بتنادي Edge Function اسمها generate-content بتوكن جلسة الأدمن الحالي
     * (مش الـ publishable key بس) عشان الفنكشن يتأكد إن اللي بيطلب التوليد
     * أدمن فعلاً. الفنكشن بترجع النص المقترح بس من غير أي حفظ تلقائي -
     * الحفظ الفعلي بيتم بعدين بنفس دوال update العادية فوق (updateProduct/
     * updateCategory/updateContentPage/bulkUpdateProducts) بعد ما الأدمن يوافق.
     *
     * @param {{scope: string, context?: object, regenerate?: boolean, previousAttempt?: string, feedback?: string}} payload
     * @returns {Promise<string>} النص المولّد
     */
    async function generateContent(payload) {
        const session = await getSession();
        if (!session) throw new Error("لا توجد جلسة دخول صالحة");

        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
                "apikey": SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "تعذر توليد المحتوى، حاول مرة أخرى");
        return data.text;
    }

    // تصدير موحّد على window بنفس فلسفة الموقع العام (window.BoseSupabase)
    window.BoseAdmin = {
        client,
        signIn,
        signOut,
        getSession,
        verifyIsAdmin,
        onAuthStateChange,
        getDashboardSummary,
        getRecentOrders,
        getAllOrders,
        updateOrderStatus,
        getAllCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        getAllOffers,
        createOffer,
        updateOffer,
        deleteOffer,
        getAllProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        getHomepageSettings,
        updateHomepageSettings,
        getPromotions,
        savePromotions,
        getAllCoupons,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        getAllReviews,
        approveReview,
        unapproveReview,
        deleteReview,
        getAllShippingZones,
        createShippingZone,
        updateShippingZone,
        deleteShippingZone,
        getBuilderSettings,
        saveBuilderSettings,
        getStoreGeneralSettings,
        saveStoreGeneralSettings,
        getAllContentPages,
        updateContentPage,
        bulkUpdateProducts,
        generateContent,
    };
})();