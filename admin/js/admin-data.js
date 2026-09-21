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
 * لازم يتحمل بعد مكتبة supabase-js المُستضافة محليًا وقبل أي ملف تاني في اللوحة:
 * <script src="../vendor/supabase-js/supabase.js"></script>
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

        // شارة "تذكير المراجعات المستحقة" - بنستخدم نفس دالة getReviewFollowups
        // بالظبط (بعد فلترة العملاء اللي قيّموا فعلاً أو لسه في فترة التبريد)
        // عشان الرقم في الشارة يتطابق فعليًا مع عدد الصفوف اللي هتظهر في الصفحة
        try {
            const followups = await getReviewFollowups();
            stats.reviewFollowupsDue = followups.length;
        } catch (e) {
            console.warn("تعذر جلب عدد تذكيرات المراجعات المستحقة:", e.message);
            stats.reviewFollowupsDue = 0;
        }

        // 💵 [عربون/دفع مقدم] شارة "بانتظار تأكيد العربون" - نفس شرط getAwaitingDepositCount بس هنا كجزء من الملخص العام
        try {
            const { count } = await client
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("deposit_status", "pending")
                .eq("payment_method", "online"); // الدفع عند الاستلام مالوش عربون/تحويل ينتظر تأكيد
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

    /**
     * 🧭🆕 [4.1-ب - عرض مصادر العملاء]: تجميع أول لمسة (first_source/first_medium)
     * لكل عميلة أول طلب ليها وقع جوه آخر p_days يوم - عشان نعرف العملاء الجداد
     * جايين منين فعليًا (فيسبوك/انستجرام/تيكتوك/واتساب/جوجل/زيارة مباشرة...).
     * جدول customers صغير (كل صف = عميلة واحدة مش كل طلب)، فقراءة مباشرة
     * وتجميع في الفرونت إند أبسط وأسرع من عمل RPC/SQL منفصل لحجم البيانات ده -
     * نفس فلسفة getAuditLog تحت (قراءة مباشرة من جدول بدل RPC لما يكون منطقي).
     * الوصول متاح فعلاً عبر RLS policy "admins can select customers" الموجودة.
     */
    async function getCustomerAttributionBreakdown(days = 30) {
        try {
            const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            const { data, error } = await client
                .from("customers")
                .select("first_source, first_medium, first_order_at")
                .gte("first_order_at", sinceIso);
            if (error) throw error;
            const rows = data || [];
            const counts = {};
            rows.forEach((r) => {
                const key = r.first_source || "غير معروف";
                if (!counts[key]) counts[key] = { source: key, medium: r.first_medium || null, count: 0 };
                counts[key].count += 1;
            });
            return Object.values(counts).sort((a, b) => b.count - a.count);
        } catch (e) {
            console.warn("تعذر جلب تجميع مصادر العملاء:", e.message);
            return [];
        }
    }

    /**
     * 🎯🆕 [نمو - عميلات مهتمات بفئة معينة]: بترجع كل عميلة اشترت أي منتج (بما فيهم
     * التورت/الورد المخصص من المحاكي - product_id بتاعهم مرتبط بفئته الحقيقية زي
     * أي منتج عادي) من فئة معينة خلال آخر p_days يوم، مجمّعة برقم الموبايل، مرتبة
     * بعدد الطلبات الأكتر أولاً - عشان تقدري تستهدفي العميلات دول برسالة واتساب
     * لما يطرأ عرض/منتج جديد في نفس الفئة. الحساب كله سيرفر-سايد (RPC) بنفس
     * نمط get_admin_top_products، عشان الأداء مع نمو عدد الطلبات مستقبلاً.
     */
    async function getCustomersByCategoryInterest(categoryId, days = 365) {
        try {
            const { data, error } = await client.rpc("get_admin_customers_by_category_interest", {
                p_category_id: categoryId,
                p_days: days,
            });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب العميلات المهتمات بالفئة:", e.message);
            return [];
        }
    }

    /**
     * 💗🆕 [نمو - مفضلة مرتبطة برقم موبايل]: بترجع منتجات مفضلة عميلة معينة
     * (عناوين + صور، مش IDs بس) - قراءة مباشرة من customer_favorites (متاحة
     * للأدمن عبر RLS is_bose_admin()) بعدين ربط الـIDs بجدول products محليًا
     * (نفس فلسفة عدم وجود foreign key حقيقي بين order_items.product_id
     * وproducts.id - مفيش join جاهز في PostgREST هنا برضه).
     */
    async function getCustomerFavorites(phone) {
        try {
            const cleanPhone = sanitizeFilterValue(String(phone || "").trim());
            const { data: favRow, error: favError } = await client
                .from("customer_favorites")
                .select("product_ids")
                .eq("phone", cleanPhone)
                .maybeSingle();
            if (favError) throw favError;
            const ids = (favRow && favRow.product_ids) || [];
            if (!ids.length) return [];

            const { data: products, error: prodError } = await client
                .from("products")
                .select("id, title, images, category_id")
                .in("id", ids);
            if (prodError) throw prodError;

            const byId = {};
            (products || []).forEach((p) => { byId[p.id] = p; });
            return ids.map((id) => byId[id] || { id, title: id, images: [] }).filter(Boolean);
        } catch (e) {
            console.warn("تعذر جلب مفضلة العميلة:", e.message);
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

    /**
     * 📊🛡️ [2026-09-19 - سجل أعطال الواجهة عند العميلة]: بترجع أحدث حالات
     * client_error_events (حالياً النوع الوحيد: phone_validation_rejected -
     * رفض رقم موبايل في الشيك أوت). كل صف فيه القيمة الخام كما كتبتها
     * العميلة بالظبط + codepoints بتاعتها، عشان أي محرف مخفي (LRM/RLM/ALM/
     * zero-width) يبان واضح في الجدول بدل ما يتخمّن. تحليل الـcodepoints
     * وعرضها بشكل مقروء بيحصل في client-error-log-page.js نفسها.
     */
    async function getClientErrorEvents(limit = 200) {
        try {
            const { data, error } = await client
                .from("client_error_events")
                .select("id, created_at, event_type, raw_value, normalized, codepoints, attempt, page_file, user_agent")
                .order("created_at", { ascending: false })
                .limit(limit);
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب سجل أعطال الواجهة:", e.message);
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
     * @param {{status?: string, search?: string, dateFrom?: string, dateTo?: string}} filters
     *   - status: فلترة بحالة معينة
     *   - search: بحث في رقم الطلب/اسم العميل/التليفون
     *   - dateFrom/dateTo: تواريخ بصيغة YYYY-MM-DD (شاملة الاتنين) لفلترة created_at -
     *     🆕 [تحسين إنتاجية - فلتر التاريخ]: قبل كده الصفحة كانت بتجيب كل الطلبات دايماً
     *     وتسيب صاحبة المتجر تلاقي "طلبات النهاردة" وسط القائمة كلها. الفلترة هنا بتتم
     *     على مستوى القاعدة (زي status/search بالظبط) عشان تفضل سريعة مهما كبر عدد الطلبات.
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
            if (filters.statusIn && filters.statusIn.length) {
                query = query.in("status", filters.statusIn);
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
            if (filters.dateFrom) {
                query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
            }
            if (filters.dateTo) {
                query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب الطلبات:", e.message);
            return [];
        }
    }

    /**
     * 🆕 [تحسين أداء - استهلاك بيانات أقل]: getAllOrders بتجيب كل تفاصيل
     * الطلب + كل عناصره (order_items) - مناسب لجدول الطلبات الكامل، لكن
     * زيادة عن الحاجة لأي مكان بيعرض بس ملخص سريع (زي كارت "طلبات محتاجة
     * قرارك" في الداشبورد). الدالة دي بتجيب الأعمدة المطلوبة بس من غير أي
     * join، فبتقلل حجم البيانات المنقولة فعلياً مع كل طلب داشبورد.
     */
    async function getOrdersLean(filters = {}) {
        try {
            let query = client
                .from("orders")
                .select("id, order_number, customer_name, grand_total, status, created_at, payment_method")
                .order("created_at", { ascending: false });
            if (filters.status) query = query.eq("status", filters.status);
            if (filters.limit) query = query.limit(filters.limit);

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب ملخص الطلبات:", e.message);
            return [];
        }
    }

    /** تحديث حالة طلب واحد (pending/confirmed/preparing/out_for_delivery/delivered/cancelled) */
    async function updateOrderStatus(orderId, newStatus) {
        const { error } = await client.from("orders").update({ status: newStatus }).eq("id", orderId);
        if (error) throw error;
    }

    /**
     * 🆕 [تحسين إنتاجية - تحديث حالة جماعي]: قبل كده تحديد أكتر من طلب في
     * صفحة الطلبات كان بيسمح بحذفهم بس - أي تغيير حالة (تأكيد/بدء تحضير/
     * تسليم) كان لازم يتعمل طلب طلب بفتح المودال كل مرة. نفس نمط
     * bulkUpdateProducts بالظبط، بس على جدول orders. تحديث واحد بـ .in()
     * بيخلي أي trigger على مستوى الصف (زي handle_order_confirmed_financials)
     * يشتغل لكل طلب لوحده بشكل صحيح، بالظبط زي لو اتحدثوا واحد واحد.
     */
    async function bulkUpdateOrderStatus(orderIds, newStatus) {
        if (!orderIds || !orderIds.length) return 0;
        const { error, count } = await client
            .from("orders")
            .update({ status: newStatus }, { count: "exact" })
            .in("id", orderIds);
        if (error) throw error;
        return count || 0;
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

    /**
     * 🆕 [تحسين إنتاجية - بحث موحّد من أي صفحة]: قبل كده كل صفحة عندها بحثها
     * المحلي بس (الطلبات بتدوّر في الطلبات، متابعة العملاء بتدوّر برقم موبايل
     * دقيق بس، المنتجات بتدوّر في المنتجات). لو عميلة اتصلت وقالت رقمها وانتي
     * في صفحة تانية، كنتي مضطرة تسيبي الصفحة وتفتحي الصفحة الصح الأول. الدالة
     * دي بتدوّر في التلاتة مع بعض دفعة واحدة (5 نتايج لكل نوع بالكتير، كفاية
     * لصندوق بحث سريع في الشريط العلوي) وترجع نتيجة واحدة مجمّعة.
     */
    async function globalAdminSearch(rawQuery) {
        const q = sanitizeFilterValue((rawQuery || "").trim());
        if (!q || q.length < 2) return { orders: [], products: [], customers: [] };

        const [ordersRes, productsRes, customersRes] = await Promise.all([
            client
                .from("orders")
                .select("id, order_number, customer_name, phone1, status, grand_total")
                .or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,phone1.ilike.%${q}%,phone2.ilike.%${q}%`)
                .order("created_at", { ascending: false })
                .limit(5),
            client
                .from("products")
                .select("id, title, flavor_name, price")
                .ilike("title", `%${q}%`)
                .limit(5),
            client
                .from("customers")
                .select("phone, customer_name, total_orders")
                .or(`customer_name.ilike.%${q}%,phone.ilike.%${q}%`)
                .limit(5),
        ]);

        return {
            orders: ordersRes.error ? [] : (ordersRes.data || []),
            products: productsRes.error ? [] : (productsRes.data || []),
            customers: customersRes.error ? [] : (customersRes.data || []),
        };
    }

    /** عدد الطلبات اللي لسه بانتظار تأكيد العربون - يُستخدم كبادج في الشريط الجانبي/الداشبورد */
    async function getAwaitingDepositCount() {
        try {
            const { count, error } = await client
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("deposit_status", "pending")
                .eq("payment_method", "online");
            if (error) throw error;
            return count || 0;
        } catch (e) {
            console.warn("تعذر جلب عدد طلبات العربون بانتظار التأكيد:", e.message);
            return 0;
        }
    }

    /**
     * 👑 [تذكير المراجعات - نسخة ذكية]: الطلبات اللي اتسلمت من يوم (أو أكتر)
     * ولسه محدش بعتلها تذكير مراجعة، بعد استبعاد اتنين حالة:
     * (١) عميل اتأكد فعلاً إنه قيّمنا على جوجل قبل كده (google_reviewed=true) -
     *     ماينفعش نطلب منه يقيّم تاني.
     * (٢) عميل اتبعتله طلب مراجعة (لأي طلب من طلباته) خلال آخر ٤٥ يوم - عشان
     *     العميل اللي بيطلب أكتر من مرة في الأسبوع/الشهر ميوصلوش رسالة "قيّمنا"
     *     مع كل طلب، ده بيبقى مزعج. الرقم ٤٥ قابل للتعديل من REVIEW_COOLDOWN_DAYS.
     *
     * الاستبعاد ده بيتحسب من جدول customer_review_status الجديد (مفتاحه رقم
     * الموبايل)، مش من جدول orders نفسه - عشان الذاكرة تبقى "عن العميل"
     * مش "عن الطلب" (لو مسحناها من orders هتتصفّر مع كل طلب جديد وده غلط).
     *
     * 🛡️ [إضافة صورة المنتج للشخصنة]: order_items.product_id مش عليه Foreign
     * Key رسمي لجدول products (نص عادي)، فـ PostgREST مش بيقدر يعمل embed
     * تلقائي بينهم. فبنجيب أول صورة لكل منتج في دفعة تانية بـ .in() على
     * الـ product_id بتوع الطلبات دي، وبندمجها يدوي على كل order_item.
     */
    const REVIEW_COOLDOWN_DAYS = 45;

    /**
     * 🛡️ [إصلاح "الطلب الزومبي"]: لو مش حطينا سقف لعمر الطلب، ممكن يحصل الآتي -
     * عميلة طلبت مرتين قريب من بعض، اتبعتلها تذكير للطلب الأول بس (فسجّلنا
     * فترة التبريد على مستوى رقمها)، والطلب التاني (اللي محدش بعته تذكير له
     * تحديدًا) هيفضل مخبّي لحد ما الـ٤٥ يوم يخلصوا - وبعدين يطلع تاني في
     * القائمة وكأنه طلب جديد، رغم إن تسليمه بقاله شهر ونص! ده مربك وملهوش
     * فايدة عملية (محدش بيقيّم منتج بعد شهر من استلامه). فبنحط سقف أقصى:
     * أي طلب اتسلم من أكتر من REVIEW_MAX_AGE_DAYS ومحدش بعتله تذكير، يعتبر
     * "فات عليه الأوان" ومش بيدخل القائمة خالص بدل ما يرجع يطلع بشكل غريب.
     */
    const REVIEW_MAX_AGE_DAYS = 30;

    /** توحيد شكل رقم الموبايل (آخر ١٠ أرقام بس، بدون صفر أو كود دولة) عشان
     *  نفس الرقم يتطابق حتى لو اتكتب بصيغ مختلفة في طلبات مختلفة */
    function canonicalPhoneKey(phone) {
        const digits = (phone || "").replace(/\D/g, "");
        return digits.slice(-10);
    }

    async function getReviewFollowups() {
        try {
            const { data, error } = await client
                .from("orders")
                .select("id, order_number, customer_name, phone1, delivered_at, order_items(title, product_id)")
                .eq("status", "delivered")
                .is("review_reminder_sent_at", null)
                .lte("delivered_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .gte("delivered_at", new Date(Date.now() - REVIEW_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString())
                .order("delivered_at", { ascending: true });
            if (error) throw error;
            let orders = data || [];

            // فلترة العملاء اللي قيّموا فعلاً أو اتبعتلهم طلب مراجعة مؤخراً
            const phoneKeys = [...new Set(orders.map((o) => canonicalPhoneKey(o.phone1)).filter(Boolean))];
            if (phoneKeys.length) {
                const { data: statuses, error: statusErr } = await client
                    .from("customer_review_status")
                    .select("phone, google_reviewed, last_review_request_at")
                    .in("phone", phoneKeys);
                if (!statusErr && statuses) {
                    const cooldownCutoff = Date.now() - REVIEW_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
                    const statusByPhone = Object.fromEntries(statuses.map((s) => [s.phone, s]));
                    orders = orders.filter((o) => {
                        const status = statusByPhone[canonicalPhoneKey(o.phone1)];
                        if (!status) return true;
                        if (status.google_reviewed) return false;
                        if (status.last_review_request_at && new Date(status.last_review_request_at).getTime() > cooldownCutoff) return false;
                        return true;
                    });
                }
            }

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

    /** تسجيل إن تذكير المراجعة اتبعت للطلب ده - بيختفي من القائمة بعدها،
     *  وبيسجل كمان على مستوى العميل (رقم الموبايل) عشان فترة التبريد تشتغل
     *  حتى لو العميل ده طلب تاني بعدين بطلب مختلف */
    async function markReviewReminderSent(orderId, customerName, phone) {
        const { error } = await client
            .from("orders")
            .update({ review_reminder_sent_at: new Date().toISOString() })
            .eq("id", orderId);
        if (error) throw error;

        const phoneKey = canonicalPhoneKey(phone);
        if (phoneKey) {
            await client.from("customer_review_status").upsert({
                phone: phoneKey,
                customer_name: customerName || null,
                last_review_request_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: "phone" });
        }
    }

    /** تسجيل إن العميل ده قيّمنا فعلاً على جوجل (بعد ما تستلمي سكرين شوت
     *  ويتصدرلها كوبون) - بعد كده مش هيظهر تاني في قائمة التذكير أبداً */
    async function markCustomerGoogleReviewed(phone, customerName) {
        const phoneKey = canonicalPhoneKey(phone);
        if (!phoneKey) return;
        const { error } = await client.from("customer_review_status").upsert({
            phone: phoneKey,
            customer_name: customerName || null,
            google_reviewed: true,
            updated_at: new Date().toISOString(),
        }, { onConflict: "phone" });
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

    /**
     * 🎉 [المواسم والمناسبات]: مصفوفة seasons من صف store_settings الوحيد - نفس
     * نمط promotions بالظبط (مش جدول منفصل، الصفحة بتحتفظ بنسخة محلية وتبعتها
     * كاملة كل حفظ). كل عنصر فيها: id, name, startDate, endDate, manualOverride
     * (null = تلقائي حسب التاريخ، true/false = فرض التفعيل/الإيقاف يدوياً)،
     * accentColor (اختياري)، banner {title, description, cta, target, image}،
     * badge {text, icon}، linkedProductIds، linkedCategoryIds، cartMessage {text, enabled}.
     */
    async function getSeasons() {
        try {
            const { data, error } = await client
                .from("store_settings")
                .select("seasons")
                .eq("id", 1)
                .maybeSingle();
            if (error) throw error;
            return (data && data.seasons) || [];
        } catch (e) {
            console.warn("تعذر جلب المواسم والمناسبات:", e.message);
            return [];
        }
    }

    /** بتستبدل مصفوفة المواسم بالكامل - نفس منطق savePromotions بالظبط */
    async function saveSeasons(seasons) {
        const { error } = await client
            .from("store_settings")
            .update({ seasons, updated_at: new Date().toISOString() })
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

    /**
     * 🆕 [تحسين إنتاجية - اعتماد/حذف جماعي للتقييمات]: قبل كده كل تقييم
     * بيتعتمد أو يتحذف لوحده بضغطة منفصلة - لو وصلها 10 تقييمات دفعة واحدة
     * (بعد حملة تسويقية مثلاً)، كانت محتاجة 10 ضغطات منفصلة.
     */
    async function bulkApproveReviews(ids) {
        if (!ids || !ids.length) return 0;
        const { error, count } = await client
            .from("reviews")
            .update({ is_approved: true }, { count: "exact" })
            .in("id", ids);
        if (error) throw error;
        return count || 0;
    }

    async function bulkDeleteReviews(ids) {
        if (!ids || !ids.length) return 0;
        const { error, count } = await client.from("reviews").delete({ count: "exact" }).in("id", ids);
        if (error) throw error;
        return count || 0;
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
     * كل إعدادات خصم الولاء التلقائي (نسب الخصم لكل ترتيب في الدورة وطول الدورة) متخزنة في
     * عمود واحد store_settings.loyalty بالشكل:
     *   { enabled, cycle_length, tiers: {"4":5,"8":10,"12":15} }
     * نفس الـ RPCs اللي بتحسب خصم كل طلب (create_order_with_items)، بترجع
     * رصيد العميل للموقع العام (get_customer_loyalty_status) بتقرأ من العمود ده مباشرة -
     * أي تعديل هنا بينعكس فوراً على كل الحسابات من غير أي كود إضافي.
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
        // 🛡️ [2026-09-19]: بيعتمد على المصدر الموحّد في js/phone-utils.js عشان
        // يشيل كمان علامات الاتجاه المخفية والأرقام العربية-الهندية.
        if (typeof window.sanitizeBosePhoneNumber === "function") {
            return window.sanitizeBosePhoneNumber(phone);
        }
        return String(phone || "").trim().replace(/\D+/g, "");
    }

    /**
     * 🎁 [بروفايل ولاء عميلة - للأدمن]: كل طلباتها + عدد الطلبات المسلّمة + ترتيب طلبها الجاي في
     * الدورة ونسبة الخصم التلقائي اللي هياخدها (نفس منطق قاعدة البيانات: الخصم بيتحسب على أساس
     * الطلبات اللي اتسلّمت فعلاً، ومفيش قسائم ولا أكواد). الشرايح والدورة من store_settings.loyalty.
     */
    async function getCustomerLoyaltyProfile(phone) {
        const cleanPhone = cleanEgyptianPhone(phone);
        if (!window.validateBosePhoneNumber(cleanPhone)) {
            throw new Error("رقم الهاتف غير صحيح، يرجى إدخال رقم مصري صحيح (يبدأ بـ 01...)");
        }

        const [ordersRes, loyalty] = await Promise.all([
            client
                .from("orders")
                .select("*, order_items(*)")
                .or(`phone1.eq.${cleanPhone},phone2.eq.${cleanPhone}`)
                .order("created_at", { ascending: false }),
            getLoyaltySettings(),
        ]);
        if (ordersRes.error) throw ordersRes.error;

        const orders = ordersRes.data || [];
        const deliveredOrders = orders.filter((o) => o.status === "delivered");
        const totalOrders = deliveredOrders.length;

        const cycleLength = Math.max(1, parseInt(loyalty.cycle_length, 10) || 12);
        const tiers = loyalty.tiers || { "4": 5, "8": 10, "12": 15 };

        const nextSeq = totalOrders + 1;
        const nextPos = ((nextSeq - 1) % cycleLength) + 1;
        const nextPct = parseInt(tiers[String(nextPos)], 10) || 0;

        return {
            cleanPhone,
            orders,
            totalOrders,
            nextOrderSequence: nextSeq,
            nextCyclePosition: nextPos,
            nextDiscountPercent: nextPct,
            cycleLength,
            tiers,
        };
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

    /* ============================= الإشعارات (Push Notifications) ============================= */
    /**
     * عدد أجهزة العملاء المشتركة حاليًا في الإشعارات (disabled_at is null).
     * push_subscriptions ممنوع عليها أي قراءة مباشرة من anon/authenticated (راجع
     * الـ RLS في migration create_push_subscriptions) - فبنعدّها عبر count فقط
     * (head request، مفيش قراءة لأي endpoint/keys فعلية) وده مسموح لإنه بيرجع
     * رقم بس مش صفوف - لو الحساب اتغيّر لاحقًا لازم RPC مخصص بدل كده.
     */
    async function getPushSubscriberCount() {
        try {
            const { count, error } = await client
                .from("push_subscriptions")
                .select("id", { count: "exact", head: true })
                .is("disabled_at", null);
            if (error) throw error;
            return count || 0;
        } catch (e) {
            // متوقع لو الجدول لسه RLS بيمنع القراءة تمامًا حتى للـ count -
            // نرجع null عشان الصفحة تقدر تفرّق بين "صفر" و"معرفناش"
            console.warn("تعذر معرفة عدد المشتركين في الإشعارات:", e.message);
            return null;
        }
    }

    /**
     * بترسل إشعار Push حقيقي لكل الأجهزة المشتركة عبر Edge Function
     * send-push-notification (نفس نمط generateContent بالظبط - بتوكن جلسة
     * الأدمن الحالي عشان الفنكشن يتأكد إنه أدمن فعلاً قبل ما يبعت لأي حد).
     * @param {{title: string, body: string, url?: string, icon?: string}} payload
     * @returns {Promise<{sent: number, failed: number, totalSubscribers: number}>}
     */
    async function sendPushNotification(payload) {
        const session = await getSession();
        if (!session) throw new Error("لا توجد جلسة دخول صالحة");

        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
                "apikey": SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "تعذر إرسال الإشعار، حاول مرة أخرى");
        return data;
    }

    /* ============================= الجولة التفاعلية (tour.html) ============================= */

    /**
     * كل خطوات الجولة (المفعّلة والموقوفة) مرتبة بترتيب العرض الفعلي -
     * هنا الأدمن بيشوف كل حاجة بعكس الموقع العام اللي بيشوف المفعّل بس.
     */
    async function getAllTourSteps() {
        try {
            const { data, error } = await client
                .from("tour_steps")
                .select("*")
                .order("step_order", { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب خطوات الجولة:", e.message);
            return [];
        }
    }

    /** إضافة خطوة جديدة في آخر الترتيب (step_order بيتحدد من الصفحة نفسها) */
    async function createTourStep(step) {
        const { error } = await client.from("tour_steps").insert(step);
        if (error) throw error;
    }

    async function updateTourStep(id, updates) {
        const { error } = await client
            .from("tour_steps")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", id);
        if (error) throw error;
    }

    async function deleteTourStep(id) {
        const { error } = await client.from("tour_steps").delete().eq("id", id);
        if (error) throw error;
    }

    /**
     * 🔀 [إعادة ترتيب]: بتاخد مصفوفة [{id, step_order}, ...] وتحدّث ترتيب
     * كل خطوة دفعة واحدة (بعد سحب/إفلات أو ضغط أسهم لأعلى/أسفل في الواجهة).
     * كل تحديث سطر لوحده بدل RPC واحدة عشان مفيش دالة SQL جاهزة لتحديث
     * دفعة (bulk upsert) هنا - العدد صغير (~50 خطوة) فمفيش مشكلة أداء حقيقية.
     */
    async function reorderTourSteps(orderedIdList) {
        for (let i = 0; i < orderedIdList.length; i++) {
            const { error } = await client
                .from("tour_steps")
                .update({ step_order: i + 1, updated_at: new Date().toISOString() })
                .eq("id", orderedIdList[i]);
            if (error) throw error;
        }
    }

    /**
     * 📊 [تحليلات ترك الجولة]: بترجع كل أحداث الجولة الخام في نطاق زمني
     * معين - التجميع (funnel، نسب الترك لكل خطوة) بيحصل في tour-page.js
     * نفسه بدل دالة SQL منفصلة، عشان حجم البيانات المتوقع لمتجر واحد صغير
     * نسبيًا ومفيش داعي لتعقيد إضافي دلوقتي.
     */
    async function getTourAnalyticsEvents(sinceIso) {
        try {
            let query = client
                .from("tour_analytics_events")
                .select("event_type, step_order, step_title, page_file, session_id, created_at")
                .order("created_at", { ascending: true })
                .limit(20000);
            if (sinceIso) query = query.gte("created_at", sinceIso);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب تحليلات الجولة:", e.message);
            return [];
        }
    }

    /* ============ 🔔 تنبيهات الطلبات الجديدة (Push على موبايل الأدمن) ============ */

    /** يسجّل جهاز الأدمن الحالي لاستلام تنبيهات الطلبات (RPC للأدمن بس) */
    async function saveAdminPushSubscription(subscription) {
        const json = subscription && typeof subscription.toJSON === "function" ? subscription.toJSON() : subscription;
        if (!json || !json.endpoint || !json.keys) throw new Error("بيانات اشتراك الإشعارات ناقصة");
        const { error } = await client.rpc("save_admin_push_subscription", {
            p_endpoint: json.endpoint,
            p_p256dh: json.keys.p256dh,
            p_auth: json.keys.auth,
            p_user_agent: String(navigator.userAgent || "").slice(0, 300),
        });
        if (error) throw error;
    }

    /** يبعت إشعار تجريبي لأجهزة الأدمن المفعّلة (الفنكشن بيتحقق إن اللي بينده أدمن) */
    async function sendTestOrderAlert() {
        const { data, error } = await client.functions.invoke("notify-new-order", { body: { test: true } });
        if (error) throw error;
        return data;
    }

    /** لقطة سريعة وخفيفة للطلبات اللي لسه مستنية مراجعة (للمراقب اللي بيشتغل كل 30 ثانية) */
    async function getPendingOrdersSnapshot() {
        try {
            const { data, count, error } = await client
                .from("orders")
                .select("id, order_number, customer_name, grand_total, created_at", { count: "exact" })
                .in("status", ["awaiting_deposit", "pending"])
                .order("created_at", { ascending: false })
                .limit(15);
            if (error) throw error;
            return { count: count || 0, latest: data || [] };
        } catch (e) {
            console.warn("تعذر جلب الطلبات المنتظرة:", e.message);
            return null;
        }
    }

    /**
     * 🩺 [صحة نظام التنبيهات]: بترجع حالة القنوات فعليًا من السيرفر (عدد أجهزة الأدمن المفعّلة،
     * هل تيليجرام مربوط، آخر إرسال ناجح، وكام طلب اتسجّل ولسه ماتنبّهش بيه).
     * RPC للأدمن بس (get_admin_alert_status).
     * @returns {Promise<{push_devices:number, push_last_ok:string|null, telegram_configured:boolean,
     *   telegram_chat_name:string|null, telegram_last_ok:string|null, unnotified_orders:number,
     *   pending_orders:number, oldest_pending_at:string|null}>}
     */
    async function getAdminAlertStatus() {
        const { data, error } = await client.rpc("get_admin_alert_status");
        if (error) throw error;
        return data || {};
    }

    /**
     * 🤖 [قناة تيليجرام]: بتبعت توكن البوت للفنكشن (بيتخزّن في Vault على السيرفر، مش في الجدول
     * ولا في المتصفح). الفنكشن بيتأكد من التوكن، بيلاقي المحادثة اللي ابتدت مع البوت، وبيبعت رسالة تأكيد.
     * أخطاء المستخدم (توكن غلط / لسه مبعتتش للبوت) بترجع {ok:false, code, message} بدل ما ترمي استثناء.
     */
    async function connectTelegramAlerts(token) {
        const { data, error } = await client.functions.invoke("notify-new-order", {
            body: { action: "telegram-setup", token: String(token || "").trim() },
        });
        if (error) throw error;
        return data;
    }

    async function disconnectTelegramAlerts() {
        const { data, error } = await client.functions.invoke("notify-new-order", {
            body: { action: "telegram-disconnect" },
        });
        if (error) throw error;
        return data;
    }

    /** آخر محاولات إرسال التنبيهات (جهاز/تيليجرام) - لو الجدول مش مقروء للأدمن بترجع null والصفحة بتخفي الكارت */
    async function getAlertDeliveries(limit) {
        try {
            const { data, error } = await client
                .from("admin_alert_deliveries")
                .select("channel, kind, ok, order_number, detail, created_at")
                .order("created_at", { ascending: false })
                .limit(limit || 15);
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب سجل التنبيهات:", e.message);
            return null;
        }
    }

    // تصدير موحّد على window بنفس فلسفة الموقع العام (window.BoseSupabase)
    window.BoseAdmin = {
        saveAdminPushSubscription,
        sendTestOrderAlert,
        getPendingOrdersSnapshot,
        getAdminAlertStatus,
        connectTelegramAlerts,
        disconnectTelegramAlerts,
        getAlertDeliveries,
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
        getCustomerAttributionBreakdown,
        getCustomersByCategoryInterest,
        getCustomerFavorites,
        getAuditLog,
        getClientErrorEvents,
        getMissingPhotoProductsCount,
        getRecentOrders,
        getAllOrders,
        getOrdersLean,
        deleteOrder,
        deleteOrders,
        updateOrderStatus,
        bulkUpdateOrderStatus,
        globalAdminSearch,
        confirmOrderDeposit,
        getAwaitingDepositCount,
        getReviewFollowups,
        markReviewReminderSent,
        markCustomerGoogleReviewed,
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
        getSeasons,
        saveSeasons,
        getAllReviews,
        approveReview,
        unapproveReview,
        deleteReview,
        bulkApproveReviews,
        bulkDeleteReviews,
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
        setOrderExcludedFromLoyalty,
        getAllTourSteps,
        createTourStep,
        updateTourStep,
        deleteTourStep,
        reorderTourSteps,
        getTourAnalyticsEvents,
        getPushSubscriberCount,
        sendPushNotification,
    };
})();