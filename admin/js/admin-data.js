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

    /**
     * 🆕 [5.5 - تغيير كلمة المرور من لوحة التحكم]: بتغيّر كلمة مرور الأدمن
     * اللي عامل تسجيل دخول حالياً. مبنية على client.auth.updateUser بتاع
     * Supabase Auth، اللي بيشتغل على الجلسة الحالية المصادَق عليها فعلاً
     * (نفس آلية أي تحديث بيانات مستخدم في Supabase) - مفيش حاجة إضافية
     * محتاجة تتضاف في القاعدة، الـ RLS/Auth مبني على كده أصلاً.
     */
    async function updatePassword(newPassword) {
        const { error } = await client.auth.updateUser({ password: newPassword });
        if (error) throw error;
    }

    function onAuthStateChange(callback) {
        client.auth.onAuthStateChange((_event, session) => callback(session));
    }

    /* ============================= الداشبورد ============================= */

    /**
     * ملخص سريع للداشبورد. مكتوبة بشكل دفاعي: لو جدول orders مسمى بشكل
     * مختلف في القاعدة الفعلية، بترجع 0 بدل ما توقف الداشبورد بالكامل.
     */
    /**
     * 🛡️ [إصلاح جذري - استخدام الجاهز بدل إعادة الاختراع]: الدالة دي قبل كده
     * كانت بتعمل 4 استعلامات منفصلة يدوية وبترجع رقمين بس مفيدين فعلياً
     * (طلبات النهاردة، تقييمات معلقة)، بينما كانت موجودة فعلياً في قاعدة
     * البيانات دالة get_admin_dashboard_stats جاهزة ومبنية بعناية (إيراد
     * النهاردة/الأسبوع/الشهر، متوسط قيمة الطلب، عدد الطلبات المعلقة، عدد
     * المنتجات غير المتاحة) ومحدش كان بيستخدمها من أي صفحة في اللوحة. دلوقتي
     * الداشبورد بيستخدمها مباشرة بدل ما يعيد نفس الحسابات بأسلوب أفقر.
     */
    async function getDashboardSummary() {
        let stats = {};
        try {
            const { data, error } = await client.rpc("get_admin_dashboard_stats");
            if (error) throw error;
            stats = data || {};
        } catch (e) {
            console.warn("تعذر جلب إحصائيات الداشبورد:", e.message);
            stats = {
                ordersToday: 0, ordersWeek: 0, revenueToday: 0, revenueWeek: 0, revenueMonth: 0,
                avgOrderValueMonth: 0, pendingOrders: 0, pendingReviews: 0, totalProducts: 0,
                unavailableProducts: 0,
            };
        }

        // 🛡️ [إصلاح - تصحيح مصدر البيانات]: activeOffers في دالة get_admin_dashboard_stats
        // نفسها بتتحسب من كل صفوف products بشرط old_price > price، وده رقم مختلف تماماً
        // عن جدول offers الحقيقي اللي صفحة "عروض المنتجات" (offers.html) بتديره فعلياً -
        // نفس اللبس اللي كان مصلّح هنا قبل كده. بنستبدلها بالعدد الحقيقي من جدول offers.
        try {
            const { count } = await client
                .from("offers")
                .select("id", { count: "exact", head: true });
            stats.activeOffers = count || 0;
        } catch (e) {
            console.warn("تعذر جلب عدد العروض النشطة:", e.message);
            stats.activeOffers = 0;
        }

        // شارة "تذكير المراجعات المستحقة" - نفس شرط getReviewFollowups بالظبط لكن count بس
        try {
            const { count } = await client
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("status", "delivered")
                .is("review_reminder_sent_at", null)
                .lte("delivered_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
            stats.reviewFollowupsDue = count || 0;
        } catch (e) {
            console.warn("تعذر جلب عدد تذكيرات المراجعات المستحقة:", e.message);
            stats.reviewFollowupsDue = 0;
        }

        // 💵 [عربون/دفع مقدم] شارة "بانتظار تأكيد العربون" - نفس شرط getAwaitingDepositCount بس هنا كجزء من الملخص العام
        try {
            const { count } = await client
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("deposit_status", "pending");
            stats.awaitingDepositCount = count || 0;
        } catch (e) {
            console.warn("تعذر جلب عدد طلبات العربون بانتظار التأكيد:", e.message);
            stats.awaitingDepositCount = 0;
        }

        return stats;
    }

    /** تقرير المبيعات اليومي لآخر p_days يوم (لرسم بياني بسيط في صفحة التقارير) */
    async function getSalesReport(days = 30) {
        try {
            const { data, error } = await client.rpc("get_admin_sales_report", { p_days: days });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب تقرير المبيعات:", e.message);
            return [];
        }
    }

    /** أكتر المنتجات مبيعاً خلال آخر p_days يوم */
    async function getTopProducts(days = 30, limit = 5) {
        try {
            const { data, error } = await client.rpc("get_admin_top_products", { p_days: days, p_limit: limit });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب أكتر المنتجات مبيعاً:", e.message);
            return [];
        }
    }

    /** سجل النشاط الإداري (آخر التعديلات اللي حصلت من اللوحة) */
    async function getAuditLog(limit = 100) {
        try {
            const { data, error } = await client
                .from("admin_audit_log")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(limit);
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب سجل النشاط:", e.message);
            return [];
        }
    }

    /** عدد المنتجات اللي لسه شايلة صورة اللوجو الافتراضية بدل صورة حقيقية (لتنبيه الداشبورد) */
    async function getMissingPhotoProductsCount() {
        try {
            const { data, error } = await client.from("products").select("id, images");
            if (error) throw error;
            const marker = "logo_igggsb";
            return (data || []).filter((p) => {
                const img = (p.images && p.images[0]) || "";
                return !img || img.includes(marker);
            }).length;
        } catch (e) {
            console.warn("تعذر جلب عدد المنتجات بدون صورة حقيقية:", e.message);
            return 0;
        }
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

    /**
     * 💵 [عربون/دفع مقدم]: بعد ما العميلة تحوّل العربون (أو كامل المبلغ لو
     * توصيل) وتبعت صورة التحويل على واتساب، الإدارة بتضغط الزرار ده يدوياً
     * بعد ما تتأكد إن الفلوس وصلت فعلاً - بيسجل وقت التأكيد وينقل الطلب من
     * "بانتظار تأكيد العربون" لحالة "مؤكد" عشان يبدأ التجهيز.
     */
    async function confirmOrderDeposit(orderId) {
        const { error } = await client
            .from("orders")
            .update({ deposit_status: "confirmed", deposit_confirmed_at: new Date().toISOString(), status: "confirmed" })
            .eq("id", orderId);
        if (error) throw error;
    }

    /**
     * حذف طلب واحد نهائياً (وعناصره order_items بتتمسح تلقائي معاه - في
     * الداتابيز الـ foreign key متعمول ON DELETE CASCADE). بيُستخدم لتنظيف
     * الطلبات الملغية أو الطلبات الوهمية اللي بتتعمل للتجربة.
     */
    async function deleteOrder(orderId) {
        const { error } = await client.from("orders").delete().eq("id", orderId);
        if (error) throw error;
    }

    /**
     * حذف مجموعة طلبات دفعة واحدة (تحديد متعدد من جدول الطلبات، أو مسح
     * سريع لكل الطلبات الملغية). بيرجع عدد الطلبات اللي اتمسحت فعلاً.
     */
    async function deleteOrders(orderIds) {
        if (!orderIds || !orderIds.length) return 0;
        const { error, count } = await client
            .from("orders")
            .delete({ count: "exact" })
            .in("id", orderIds);
        if (error) throw error;
        return count || 0;
    }

    /** عدد الطلبات اللي لسه بانتظار تأكيد العربون - يُستخدم كبادج في الشريط الجانبي/الداشبورد */
    async function getAwaitingDepositCount() {
        try {
            const { count, error } = await client
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("deposit_status", "pending");
            if (error) throw error;
            return count || 0;
        } catch (e) {
            console.warn("تعذر جلب عدد طلبات العربون بانتظار التأكيد:", e.message);
            return 0;
        }
    }

    /**
     * 👑 [تذكير المراجعات]: الطلبات اللي اتسلمت من يوم (أو أكتر) ولسه محدش
     * بعتلها تذكير مراجعة. delivered_at بيتسجل تلقائياً من trigger في قاعدة
     * البيانات أول مرة الحالة تتحول delivered - مش بنحسبه هنا يدوياً.
     */
    /**
     * 👑 [تذكير المراجعات]: الطلبات اللي اتسلمت من يوم (أو أكتر) ولسه محدش
     * بعتلها تذكير مراجعة. delivered_at بيتسجل تلقائياً من trigger في قاعدة
     * البيانات أول مرة الحالة تتحول delivered - مش بنحسبه هنا يدوياً.
     *
     * 🛡️ [إضافة صورة المنتج للشخصنة]: order_items.product_id مش عليه Foreign
     * Key رسمي لجدول products (نص عادي)، فـ PostgREST مش بيقدر يعمل embed
     * تلقائي بينهم. فبنجيب أول صورة لكل منتج في دفعة تانية بـ .in() على
     * الـ product_id بتوع الطلبات دي، وبندمجها يدوي على كل order_item.
     */
    async function getReviewFollowups() {
        try {
            const { data, error } = await client
                .from("orders")
                .select("id, order_number, customer_name, phone1, delivered_at, order_items(title, product_id)")
                .eq("status", "delivered")
                .is("review_reminder_sent_at", null)
                .lte("delivered_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order("delivered_at", { ascending: true });
            if (error) throw error;
            const orders = data || [];

            const productIds = [...new Set(
                orders.flatMap((o) => (o.order_items || []).map((it) => it.product_id).filter(Boolean))
            )];
            if (productIds.length) {
                const { data: products, error: prodErr } = await client
                    .from("products")
                    .select("id, images")
                    .in("id", productIds);
                if (!prodErr && products) {
                    const imageByProductId = Object.fromEntries(
                        products.map((p) => [p.id, (p.images || [])[0] || null])
                    );
                    orders.forEach((o) => {
                        (o.order_items || []).forEach((it) => {
                            it.image = it.product_id ? imageByProductId[it.product_id] || null : null;
                        });
                    });
                }
            }
            return orders;
        } catch (e) {
            console.warn("تعذر جلب طلبات تذكير المراجعات:", e.message);
            return [];
        }
    }

    /** تسجيل إن تذكير المراجعة اتبعت للطلب ده - بيختفي من القائمة بعدها */
    async function markReviewReminderSent(orderId) {
        const { error } = await client
            .from("orders")
            .update({ review_reminder_sent_at: new Date().toISOString() })
            .eq("id", orderId);
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

    /** يرجّع كائن navigation (الشريط العلوي المتحرك) من صف store_settings الوحيد */
    async function getNavigationSettings() {
        try {
            const { data, error } = await client
                .from("store_settings")
                .select("navigation")
                .eq("id", 1)
                .maybeSingle();
            if (error) throw error;
            return (data && data.navigation) || {};
        } catch (e) {
            console.warn("تعذر جلب إعدادات الشريط العلوي:", e.message);
            return {};
        }
    }

    /** بتستبدل عمود navigation بالكامل بالكائن الممرر */
    async function updateNavigationSettings(navigation) {
        const { error } = await client
            .from("store_settings")
            .update({ navigation, updated_at: new Date().toISOString() })
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

    /**
     * 🛡️ [إصلاح - مزامنة سلايدر الفئات]: سلايدر الفئات في الصفحة الرئيسية
     * (store_settings.homepage.categoriesSlider) مش عمود مرتبط لايف بجدول
     * categories - هو "صورة مجمّدة" كانت بتتبني فقط جوه homepage-page.js
     * لما الأدمن يفتح صفحة الرئيسية ويحفظها يدوياً. فتعديل/إضافة/حذف فئة
     * من صفحة الفئات ما كانش بينعكس على الموقع خالص لحد ما حد يفتح صفحة
     * الرئيسية ويحفظها تاني - وده اللي كان بيتقرا "الصور مش بتتحدث".
     * الدالة دي بتعمل نفس البناء (buildCategoriesSliderFromCategories في
     * homepage-page.js) وبتحفظه تلقائي بعد أي تعديل على الفئات، زي ما
     * deleteProduct بالظبط بينظف مراجعه من homepage تلقائياً تحت.
     * فشلها متعمد إنه ميوقفش نجاح عملية الفئة الأساسية (نفس نمط try/catch
     * المستخدم في deleteProduct).
     */
    async function syncCategoriesSliderToHomepage() {
        try {
            const [{ data: cats }, { data: settingsRow }] = await Promise.all([
                client.from("categories").select("*").order("sort_order", { ascending: true }),
                client.from("store_settings").select("homepage").eq("id", 1).maybeSingle(),
            ]);
            const homepage = (settingsRow && settingsRow.homepage) || {};
            homepage.categoriesSlider = (cats || []).map((c) => ({
                id: c.id,
                title: c.title,
                image: c.image || "",
                builderType: c.builder_type || "standard",
            }));
            await client
                .from("store_settings")
                .update({ homepage, updated_at: new Date().toISOString() })
                .eq("id", 1);
        } catch (e) {
            console.warn("تعذر مزامنة سلايدر الفئات مع الصفحة الرئيسية:", e.message);
        }
    }

    /** إضافة فئة جديدة. category.id لازم يكون فريد (نص إنجليزي، زي: taswaq-cupcake) */
    async function createCategory(category) {
        const { error } = await client.from("categories").insert(category);
        if (error) throw error;
        await syncCategoriesSliderToHomepage();
    }

    /** تعديل فئة موجودة */
    async function updateCategory(id, updates) {
        const { error } = await client.from("categories").update(updates).eq("id", id);
        if (error) throw error;
        await syncCategoriesSliderToHomepage();
    }

    /** حذف فئة نهائياً - هيفشل لو فيه منتجات لسه مرتبطة بيها (foreign key) */
    async function deleteCategory(id) {
        const { error } = await client.from("categories").delete().eq("id", id);
        if (error) throw error;
        await syncCategoriesSliderToHomepage();
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

    /**
     * حذف منتج نهائياً.
     * 🛡️ [إصلاح - تنظيف المراجع اليتيمة]: قبل كده كان بيحذف صف المنتج بس
     * ويسيب وراه: (1) صف يتيم محتمل في جدول offers لو ربط عرض بالمنتج ده
     * قبل الحذف، و(2) الـ id بتاعه فاضل عالق جوه store_settings.homepage
     * (mostSelling/newArrivals/ourProducts) لأنها arrays من نصوص مش FK
     * حقيقي - فمفيش أي قيد قاعدة بيانات يمنع أو ينظف المرجع ده تلقائياً.
     * كان بيختفي "بصريًا بس" من الواجهة بفلتر .filter(Boolean) في
     * homepage-page.js، لكن الـ id فضل مخزّن فعلياً ويكبر مع كل حذف.
     * دلوقتي بيتعمل تنظيف فعلي للاتنين بعد نجاح حذف المنتج الأساسي، كل
     * واحدة في try/catch منفصلة عشان فشل التنظيف (مثلاً صلاحيات) ميوقفش
     * نجاح عملية الحذف الأساسية.
     */
    async function deleteProduct(id) {
        const { error } = await client.from("products").delete().eq("id", id);
        if (error) throw error;

        try {
            await client.from("offers").delete().eq("product_id", id);
        } catch (e) {
            console.warn("تعذر تنظيف عروض المنتج المحذوف:", e.message);
        }

        try {
            const { data } = await client
                .from("store_settings")
                .select("homepage")
                .eq("id", 1)
                .maybeSingle();
            const homepage = data && data.homepage;
            if (homepage) {
                let changed = false;
                ["mostSelling", "newArrivals", "ourProducts"].forEach((key) => {
                    if (Array.isArray(homepage[key]) && homepage[key].includes(id)) {
                        homepage[key] = homepage[key].filter((pid) => pid !== id);
                        changed = true;
                    }
                });
                if (changed) {
                    await client
                        .from("store_settings")
                        .update({ homepage, updated_at: new Date().toISOString() })
                        .eq("id", 1);
                }
            }
        } catch (e) {
            console.warn("تعذر تنظيف مراجع المنتج المحذوف من الصفحة الرئيسية:", e.message);
        }
    }

    /**
     * 💰 [تعديل جماعي لسعر منتجات مختلفة دفعة واحدة]: على عكس bulkUpdateProducts
     * (اللي بيحط نفس القيمة بالظبط على كل المنتجات المحددة - مفيد لنص/فئة)،
     * هنا كل منتج بياخد سعر مختلف محسوب مسبقاً (زيادة/تنقيص بمبلغ أو نسبة
     * مبني على سعره الأصلي هو) - فمحتاجين استعلام تحديث منفصل لكل منتج،
     * كلهم بيتنفذوا مع بعض بالتوازي (مش واحد ورا التاني) لسرعة أعلى.
     * items: [{ id, price }]. بيرجّع { successCount, failedIds }.
     */
    async function bulkSetProductPrices(items) {
        if (!items || !items.length) return { successCount: 0, failedIds: [] };
        const results = await Promise.all(items.map(async (item) => {
            try {
                const { error } = await client.from("products").update({ price: item.price }).eq("id", item.id);
                if (error) throw error;
                return { id: item.id, ok: true };
            } catch (e) {
                console.warn(`تعذر تحديث سعر المنتج ${item.id}:`, e.message);
                return { id: item.id, ok: false };
            }
        }));
        const failedIds = results.filter((r) => !r.ok).map((r) => r.id);
        return { successCount: results.length - failedIds.length, failedIds };
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

    /**
     * 📊 [تقرير استخدام الكوبونات]: مفيش عمود عداد استخدام على جدول coupons
     * نفسه، فبنحسبه هنا مباشرة من جدول orders (اللي فيه coupon_code لكل
     * طلب استخدم كوبون + discount_amount الفعلي اللي اتخصم بيه) - بنجيب كل
     * الطلبات اللي ليها كوبون مرة واحدة، ونجمّعها محلياً حسب الكود، عشان
     * نتجنب استعلام منفصل لكل كوبون على حدة. الطلبات الملغاة (status=cancelled)
     * مستبعدة من الحساب لأنها مش استخدام فعلي حقيقي للخصم.
     * بيرجّع Map: { code -> { usageCount, totalDiscount, lastUsedAt } }
     */
    async function getCouponUsageStats() {
        try {
            const { data, error } = await client
                .from("orders")
                .select("coupon_code, discount_amount, created_at, status")
                .not("coupon_code", "is", null)
                .neq("status", "cancelled");
            if (error) throw error;
            const stats = {};
            (data || []).forEach((o) => {
                const code = o.coupon_code;
                if (!code) return;
                if (!stats[code]) stats[code] = { usageCount: 0, totalDiscount: 0, lastUsedAt: null };
                stats[code].usageCount += 1;
                stats[code].totalDiscount += Number(o.discount_amount) || 0;
                if (!stats[code].lastUsedAt || new Date(o.created_at) > new Date(stats[code].lastUsedAt)) {
                    stats[code].lastUsedAt = o.created_at;
                }
            });
            return stats;
        } catch (e) {
            console.warn("تعذر جلب تقرير استخدام الكوبونات:", e.message);
            return {};
        }
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

    /** يرجّع بيانات المتجر العامة + SEO + السوشيال ميديا + قواعد الطلب/التوقيت + إعدادات البادجات من صف store_settings الوحيد */
    async function getStoreGeneralSettings() {
        try {
            const { data, error } = await client
                .from("store_settings")
                .select("store, seo, social, order_rules, badge_settings")
                .eq("id", 1)
                .maybeSingle();
            if (error) throw error;
            return {
                store: (data && data.store) || {},
                seo: (data && data.seo) || {},
                social: (data && data.social) || {},
                orderRules: (data && data.order_rules) || {},
                badgeSettings: (data && data.badge_settings) || {},
            };
        } catch (e) {
            console.warn("تعذر جلب بيانات المتجر:", e.message);
            return { store: {}, seo: {}, social: {}, orderRules: {}, badgeSettings: {} };
        }
    }

    /** بتستبدل أعمدة store/seo/social/order_rules/badge_settings بالكامل بالكائنات الممررة */
    async function saveStoreGeneralSettings({ store, seo, social, orderRules, badgeSettings }) {
        const { error } = await client
            .from("store_settings")
            .update({
                store, seo, social,
                order_rules: orderRules,
                badge_settings: badgeSettings,
                updated_at: new Date().toISOString(),
            })
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

    /* ============================= برنامج الولاء (إعدادات الولاء / متابعة العملاء / القسائم الصادرة) ============================= */
    /**
     * كل إعدادات دائرة الولاء (نسب الخصم لكل ترتيب في الدورة، طول الدورة،
     * كل قد إيه طلب تتكسب قسيمة هدية، قيمتها، ومدة صلاحيتها) متخزنة في
     * عمود واحد store_settings.loyalty بالشكل:
     *   { enabled, cycle_length, tiers: {"3":5,"5":10,"7":15}, milestone_every, voucher_amount, voucher_validity_months }
     * نفس الـ RPCs اللي بتحسب خصم كل طلب (create_order_with_items)، بترجع
     * رصيد العميل للموقع العام (get_customer_rewards)، وبتصدر قسيمة الهدية
     * تلقائياً عند التسليم (trigger handle_loyalty_milestone_delivery) بتقرأ
     * من العمود ده مباشرة - أي تعديل هنا بينعكس فوراً على كل الحسابات من
     * غير أي كود إضافي أو تعديل في القاعدة.
     */

    /** يرجّع كائن loyalty بس من صف store_settings الوحيد (id=1) */
    async function getLoyaltySettings() {
        try {
            const { data, error } = await client
                .from("store_settings")
                .select("loyalty")
                .eq("id", 1)
                .maybeSingle();
            if (error) throw error;
            return (data && data.loyalty) || {};
        } catch (e) {
            console.warn("تعذر جلب إعدادات الولاء:", e.message);
            return {};
        }
    }

    /** بتستبدل عمود loyalty بالكامل بالكائن الممرر */
    async function saveLoyaltySettings(loyalty) {
        const { error } = await client
            .from("store_settings")
            .update({ loyalty, updated_at: new Date().toISOString() })
            .eq("id", 1);
        if (error) throw error;
    }

    /**
     * نفس تعقيم رقم الهاتف المستخدم داخل القاعدة (create_order_with_items /
     * get_customer_rewards) عشان أي بحث هنا يطابق بالظبط نفس المنطق اللي
     * بيتحسب عليه تسلسل الولاء الفعلي - أي فرق بسيط في التعقيم (مسافة،
     * شرطة، +٢٠...) كان ممكن يخلي الأدمن يشوف نتيجة مختلفة عن اللي العميل شايفها.
     */
    function cleanEgyptianPhone(phone) {
        return String(phone || "").trim().replace(/[\s\-()+]/g, "");
    }

    /**
     * 🔍 [صفحة متابعة العملاء]: بتدوّر برقم تليفون عميل وترجع كل حاجة
     * محتاجاها الصفحة دفعة واحدة - كل طلباته من الأحدث (بتفاصيل عناصرها)،
     * قسايم الهدية بتاعته (نشطة ومنتهية/متصرفة)، وموقعه الحالي في دائرة
     * الولاء (نفس منطق get_customer_rewards بالظبط، محسوب هنا محلياً عشان
     * الصفحة تقدر كمان تعرض تفاصيل كل طلب اللي الـ RPC العام للعميل النهائي
     * مايرجّعهاش لأسباب خصوصية).
     */
    async function getCustomerLoyaltyProfile(phone) {
        const cleanPhone = cleanEgyptianPhone(phone);
        if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
            throw new Error("رقم الهاتف غير صحيح، يرجى إدخال رقم مصري صحيح (يبدأ بـ 01...)");
        }

        const [ordersRes, vouchersRes, loyalty] = await Promise.all([
            client
                .from("orders")
                .select("*, order_items(*)")
                .or(`phone1.eq.${cleanPhone},phone2.eq.${cleanPhone}`)
                .order("created_at", { ascending: false }),
            client
                .from("loyalty_vouchers")
                .select("*")
                .eq("phone", cleanPhone)
                .order("issued_at", { ascending: false }),
            getLoyaltySettings(),
        ]);

        if (ordersRes.error) throw ordersRes.error;
        if (vouchersRes.error) throw vouchersRes.error;

        const orders = ordersRes.data || [];
        const vouchers = vouchersRes.data || [];

        // مهم: كل صف في orders هنا هو فاتورة/طلب مستقل قائم بذاته - حتى لو
        // احتوى على عناصر كتير (مثلاً 20 منتج) في نفس الفاتورة، فده لسه
        // "طلب واحد" في تسلسل الولاء. تسلسل الولاء بيتحسب بعدد صفوف orders
        // (غير الملغاة) لنفس رقم الهاتف - مش بعدد عناصر order_items - بالظبط
        // زي ما create_order_with_items و get_customer_rewards بيحسبوا في القاعدة.
        const nonCancelledOrders = orders.filter((o) => o.status !== "cancelled");
        const totalOrders = nonCancelledOrders.length;

        const cycleLength = Math.max(1, parseInt(loyalty.cycle_length, 10) || 7);
        const tiers = loyalty.tiers || { "3": 5, "5": 10, "7": 15 };
        const milestoneEvery = Math.max(1, parseInt(loyalty.milestone_every, 10) || 10);

        const nextSeq = totalOrders + 1;
        const nextPos = ((nextSeq - 1) % cycleLength) + 1;
        const nextIsMilestone = nextSeq % milestoneEvery === 0;
        const nextPct = nextIsMilestone ? 0 : (parseInt(tiers[String(nextPos)], 10) || 0);

        return {
            cleanPhone,
            orders,
            vouchers,
            totalOrders,
            nextOrderSequence: nextSeq,
            nextCyclePosition: nextPos,
            nextDiscountPercent: nextPct,
            nextIsMilestone,
            cycleLength,
            tiers,
            milestoneEvery,
        };
    }

    /**
     * 🎁 [صفحة القسائم الصادرة]: كل قسايم الهدية اللي اتكسبت عبر دائرة الولاء
     * (سواء لسه نشطة، خلصت، أو انتهت صلاحيتها) بترتيب الأحدث أولاً - مع رقم
     * طلب الكسب ورقم آخر طلب اتصرفت فيه (لو موجودين) عشان الصفحة تعرضهم
     * كروابط مفهومة من غير استعلام إضافي لكل صف. الفلترة بالكود أو رقم الهاتف.
     */
    async function getAllLoyaltyVouchers(filters = {}) {
        try {
            let query = client
                .from("loyalty_vouchers")
                .select(`
                    *,
                    earned_order:orders!loyalty_vouchers_earned_order_id_fkey(order_number),
                    last_used_order:orders!loyalty_vouchers_last_used_order_id_fkey(order_number)
                `)
                .order("issued_at", { ascending: false });

            if (filters.search && filters.search.trim()) {
                const s = sanitizeFilterValue(filters.search.trim());
                if (s) {
                    query = query.or(`code.ilike.%${s}%,phone.ilike.%${s}%`);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب القسائم الصادرة:", e.message);
            return [];
        }
    }

    /**
     * 📝 سجل نشاط إداري عام - بيتحط في admin_audit_log (نفس الجدول اللي
     * صفحة "سجل النشاط" بتقرأ منه). admin_id و admin_name بيتملوا تلقائياً
     * بواسطة trigger على مستوى القاعدة (trg_fill_audit_log_admin) من جلسة
     * تسجيل الدخول الحالية - مش محتاجين نبعتهم يدوياً من هنا.
     */
    async function logAdminAction(action, entityType, entityId, entityLabel, details = {}) {
        try {
            const { error } = await client.from("admin_audit_log").insert({
                action, entity_type: entityType, entity_id: entityId ? String(entityId) : null,
                entity_label: entityLabel || null, details,
            });
            if (error) throw error;
        } catch (e) {
            console.warn("تعذر تسجيل الحدث في سجل النشاط:", e.message);
        }
    }

    /**
     * 🎁 [إجراء يدوي - منح قسيمة]: بتصدر قسيمة هدية لعميلة بشكل يدوي (خارج
     * دورة الولاء التلقائية) - مفيدة في حالات استثنائية زي تعويض عميلة عن
     * مشكلة في طلب. الكود بيتولد بنفس دالة توليد الأكواد المستخدمة في
     * الإصدار التلقائي (generate_loyalty_voucher_code) عشان يفضل بنفس
     * الصيغة (HADYA-XXXXXX)، لكن earned_order_id بيفضل فاضي (NULL) عشان
     * يبان واضح إنها قسيمة يدوية مش مكسوبة من طلب حقيقي.
     */
    async function grantManualLoyaltyVoucher(phone, amount, validityMonths) {
        const cleanPhone = cleanEgyptianPhone(phone);
        if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
            throw new Error("رقم الهاتف غير صحيح، يرجى إدخال رقم مصري صحيح (يبدأ بـ 01...)");
        }
        if (!amount || amount <= 0) {
            throw new Error("قيمة القسيمة لازم تكون رقم أكبر من صفر");
        }

        const { data: codeData, error: codeError } = await client.rpc("generate_loyalty_voucher_code");
        if (codeError) throw codeError;
        const code = codeData;

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + (parseInt(validityMonths, 10) || 2));

        const { data, error } = await client
            .from("loyalty_vouchers")
            .insert({
                phone: cleanPhone, code, amount, remaining_amount: amount,
                earned_order_id: null, issued_at: new Date().toISOString(), expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();
        if (error) throw error;

        await logAdminAction("منح قسيمة ولاء يدوية", "loyalty_voucher", data.id, code, { phone: cleanPhone, amount });
        return data;
    }

    /**
     * 🚫 [إجراء يدوي - إلغاء قسيمة]: بنعمل "إلغاء" عن طريق تصفير تاريخ
     * الصلاحية بدل حذف الصف نفسه - كده القسيمة بتظهر فوراً كـ"منتهية
     * الصلاحية" في كل الشاشات (customer-lookup / loyalty-vouchers) وبيبطل
     * استخدامها تلقائياً في create_order_with_items (اللي بيرفض أي قسيمة
     * expires_at ≤ now())، من غير ما نفقد أي سجل تاريخي عن القسيمة.
     */
    async function voidLoyaltyVoucher(voucherId, code) {
        const { error } = await client
            .from("loyalty_vouchers")
            .update({ expires_at: new Date().toISOString() })
            .eq("id", voucherId);
        if (error) throw error;
        await logAdminAction("إلغاء قسيمة ولاء يدوياً", "loyalty_voucher", voucherId, code);
    }

    /**
     * 🔢 [إجراء يدوي - تعديل ترتيب عميلة في دورة الولاء]: ترتيب الولاء
     * بيتحسب حياً من عدد صفوف orders اللي حالتها مش 'cancelled' لنفس رقم
     * الهاتف (بالظبط زي ما create_order_with_items بيحسبها وقت أي طلب
     * جديد) - فمفيش عمود منفصل لـ"الترتيب" يتغيّر لوحده. الطريقة الوحيدة
     * اللي بتأثر فعلياً على حساب الترتيب المستقبلي هي تغيير حالة طلب معيّن
     * من/إلى 'cancelled' - فده اللي الدالة دي بتعمله، مع تسجيل الإجراء.
     */
    async function setOrderExcludedFromLoyalty(orderId, orderNumber, exclude) {
        await updateOrderStatus(orderId, exclude ? "cancelled" : "delivered");
        await logAdminAction(
            exclude ? "استبعاد طلب من عدّاد الولاء (إلغاء الطلب)" : "إرجاع طلب لعدّاد الولاء (استعادة كـ«تم التسليم»)",
            "order", orderId, orderNumber
        );
    }

    /* ============================= صفحة "من نحن" (about.html) ============================= */
    /**
     * كل محتوى صفحة "من نحن" (البادچ والعنوان في الهيرو، الإحصائيات الحقيقية،
     * بلوكات القصة بنصوصها واقتباساتها، معرض الصور، وقيم العلامة التجارية)
     * متخزن في عمود واحد store_settings.about بنفس فلسفة homepage/loyalty
     * بالظبط. about.html (الصفحة العامة) بيقرأ منه مباشرة عن طريق
     * window.BoseStoreData.about - فأي حفظ هنا بينعكس على الموقع فورًا.
     */

    /** يرجّع كائن about بس من صف store_settings الوحيد (id=1) */
    async function getAboutPageSettings() {
        try {
            const { data, error } = await client
                .from("store_settings")
                .select("about")
                .eq("id", 1)
                .maybeSingle();
            if (error) throw error;
            return (data && data.about) || {};
        } catch (e) {
            console.warn("تعذر جلب محتوى صفحة من نحن:", e.message);
            return {};
        }
    }

    /** بتستبدل عمود about بالكامل بالكائن الممرر */
    async function saveAboutPageSettings(about) {
        const { error } = await client
            .from("store_settings")
            .update({ about, updated_at: new Date().toISOString() })
            .eq("id", 1);
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
        updatePassword,
        onAuthStateChange,
        getDashboardSummary,
        getSalesReport,
        getTopProducts,
        getAuditLog,
        getMissingPhotoProductsCount,
        getRecentOrders,
        getAllOrders,
        deleteOrder,
        deleteOrders,
        updateOrderStatus,
        confirmOrderDeposit,
        getAwaitingDepositCount,
        getReviewFollowups,
        markReviewReminderSent,
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
        bulkSetProductPrices,
        getHomepageSettings,
        updateHomepageSettings,
        getNavigationSettings,
        updateNavigationSettings,
        getPromotions,
        savePromotions,
        getAllCoupons,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        getCouponUsageStats,
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
        getAboutPageSettings,
        saveAboutPageSettings,
        bulkUpdateProducts,
        generateContent,
        getLoyaltySettings,
        saveLoyaltySettings,
        cleanEgyptianPhone,
        getCustomerLoyaltyProfile,
        getAllLoyaltyVouchers,
        grantManualLoyaltyVoucher,
        voidLoyaltyVoucher,
        setOrderExcludedFromLoyalty,
    };
})();