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

        // شارة "قسائم/بطاقات لسه محدش اتقالها" - مجموع النوعين مع بعض (قسائم
        // الولاء + بطاقات الهدايا) عشان الرقم في الشارة يعكس أي حاجة مستنية
        // فعلياً، أياً كان نوعها - نفس منطق getUnnotifiedVouchers/GiftCards بالظبط
        try {
            const [unnotifiedVouchers, unnotifiedGiftCards] = await Promise.all([
                getUnnotifiedVouchers(),
                getUnnotifiedGiftCards(),
            ]);
            stats.vouchersUnnotified = unnotifiedVouchers.length + unnotifiedGiftCards.length;
        } catch (e) {
            console.warn("تعذر جلب عدد القسائم/البطاقات اللي لسه محدش اتقالها:", e.message);
            stats.vouchersUnnotified = 0;
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

    /** كل الكوبونات مرتبة أبجدياً. افتراضياً بيستبعد الكوبونات المؤرشفة (راجع
     *  archiveCoupon تحت) - مرّر includeArchived=true لو محتاج تشوفها كلها. */
    async function getAllCoupons(includeArchived) {
        try {
            let query = client.from("coupons").select("*").order("code", { ascending: true });
            if (!includeArchived) query = query.eq("is_archived", false);
            const { data, error } = await query;
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

    /** حذف كوبون نهائياً (لا يمكن التراجع) */
    async function deleteCoupon(code) {
        const { error } = await client.from("coupons").delete().eq("code", code);
        if (error) throw error;
    }

    /** 🆕 [أرشفة بدل حذف نهائي]: الكود بيختفي من القائمة النشطة ومستحيل
     *  يتفعّل تاني (validate_coupon بيرفضه بمجرد is_archived=true)، لكن سجله
     *  وتاريخ استخدامه يفضلوا محفوظين بالكامل - عكس الحذف النهائي. */
    async function archiveCoupon(code) {
        const { error } = await client.from("coupons").update({ is_archived: true, is_active: false }).eq("code", code);
        if (error) throw error;
    }

    /** استرجاع كوبون من الأرشيف (بيرجع is_archived=false بس مش is_active - لازم تفعيله يدوياً بعدها) */
    async function unarchiveCoupon(code) {
        const { error } = await client.from("coupons").update({ is_archived: false }).eq("code", code);
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
        //
        // 🛡️ [تعديل ثغرة الولاء - جزء ٣]: كان الفلتر هنا `status !== "cancelled"`
        // بس، يعني طلب لسه "بانتظار تأكيد العربون" (متأكدش دفعه من لوحة التحكم)
        // كان يظهر هنا وكأنه محسوب فعلاً في تسلسل الولاء - رغم إن القاعدة نفسها
        // (create_order_with_items + get_customer_rewards بعد التعديل) بقت
        // بتحسب بس من الطلبات اللي deposit_status = 'confirmed'. ده كان يخلي
        // صفحة متابعة العملاء في الأدمن تعرض للموظفة رقم/موضع مختلف عن الحقيقي.
        // دلوقتي نفس المعيار بالظبط في كل مكان: بس الطلبات المؤكد دفعها.
        const confirmedOrders = orders.filter(
            (o) => o.deposit_status === "confirmed" && o.loyalty_excluded !== true
        );
        const totalOrders = confirmedOrders.length;

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
     * 🎁 [إصدار قسيمة يدوي]: القسائم بتتصدر تلقائياً من النظام كل ١٢ طلب،
     * لكن أحياناً محتاجة تصدّري قسيمة يدوي (تعويض عميلة، مكافأة استثنائية،
     * أو أي سبب تجاري). earned_order_id بيفضل null عشان نعرف إنها صدرت يدوي
     * مش من دورة الولاء - بيتفرق عن القسائم التلقائية في العرض بعدين لو حبينا.
     * الكود بيتولّد من نفس دالة القاعدة اللي بتستخدمها دورة الولاء التلقائية
     * (generate_loyalty_voucher_code) عشان يفضل بنفس الشكل ومضمون إنه فريد.
     */
    async function issueLoyaltyVoucher({ phone, amount, expiresAt }) {
        const cleanPhone = (phone || "").replace(/[\s\-()+]/g, "");
        if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
            throw new Error("رقم الموبايل غير صحيح");
        }
        const { data: codeData, error: codeErr } = await client.rpc("generate_loyalty_voucher_code");
        if (codeErr) throw codeErr;
        const code = codeData;

        const { error } = await client.from("loyalty_vouchers").insert({
            phone: cleanPhone,
            code,
            amount,
            remaining_amount: amount,
            expires_at: expiresAt,
            earned_order_id: null,
        });
        if (error) throw error;
        return code;
    }

    /**
     * ✏️ [تعديل قسيمة موجودة]: بنسمح بتعديل الرصيد المتبقي وتاريخ الانتهاء
     * بس - مش الكود ولا رقم الموبايل ولا القيمة الأصلية (amount)، عشان دول
     * بيانات هوية/تدقيق أساسية ميصحش تتغيّر بعد الإصدار. الحالات العملية
     * لتعديل الرصيد: تصحيح غلطة، أو تعويض إضافي لعميلة. تعديل الانتهاء:
     * مد الصلاحية لعميلة طلبت مهلة أكتر.
     */
    async function updateLoyaltyVoucher(voucherId, { remainingAmount, expiresAt }) {
        const patch = {};
        if (remainingAmount !== undefined && remainingAmount !== null) patch.remaining_amount = remainingAmount;
        if (expiresAt !== undefined && expiresAt !== null) patch.expires_at = expiresAt;
        if (!Object.keys(patch).length) return;
        const { error } = await client.from("loyalty_vouchers").update(patch).eq("id", voucherId);
        if (error) throw error;
    }

    /**
     * 🎁 [صفحة تنبيه القسائم]: قسائم نشطة (رصيدها لسه موجود ولسه ما انتهتش)
     * ومحدش قالها للعميل لحد دلوقتي (notified_at is null). دي شغالة سواء
     * القسيمة اتصدرت تلقائي من دورة الـ١٢ طلب أو يدوي من زرار "إصدار قسيمة".
     */
    async function getUnnotifiedVouchers() {
        try {
            const { data, error } = await client
                .from("loyalty_vouchers")
                .select("id, phone, code, amount, remaining_amount, expires_at, issued_at, earned_order:orders!loyalty_vouchers_earned_order_id_fkey(order_number, customer_name)")
                .is("notified_at", null)
                .gt("remaining_amount", 0)
                .gt("expires_at", new Date().toISOString())
                .order("issued_at", { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب القسائم اللي لسه محدش اتقالها:", e.message);
            return [];
        }
    }

    async function markVoucherNotified(voucherId) {
        const { error } = await client
            .from("loyalty_vouchers")
            .update({ notified_at: new Date().toISOString() })
            .eq("id", voucherId);
        if (error) throw error;
    }

    /** إلغاء قسيمة (بتصفير الرصيد المتبقي بدل الحذف النهائي - عشان يفضل أثرها
     *  في سجل "إجمالي المصروف من القسائم" وسجل الاستخدام واضح وقابل للمراجعة) */
    async function revokeLoyaltyVoucher(voucherId) {
        const { error } = await client
            .from("loyalty_vouchers")
            .update({ remaining_amount: 0 })
            .eq("id", voucherId);
        if (error) throw error;
    }

    /* ============================= 🎁 بطاقات الهدايا المُباعة (gift_cards) ============================= */
    /**
     * بطاقات هدايا اشتراها عملاء بفلوسهم الفعلية (منتج فعلي عليه is_gift_card=true
     * في جدول products) - مختلفة تماماً عن قسائم الولاء (اللي هي مكافأة مجانية).
     * بتتصدر تلقائياً عبر trigger (handle_gift_card_purchase_delivery) لما طلب فيه
     * منتج بطاقة هدية يوصل لحالة "delivered" بعد تأكيد الدفع. نفس نمط دوال قسائم
     * الولاء فوق بالظبط، عشان تجربة الإدارة تتوحّد.
     */

    async function getAllGiftCards(filters = {}) {
        try {
            let query = client
                .from("gift_cards")
                .select(`
                    *,
                    purchase_order:orders!gift_cards_purchase_order_id_fkey(order_number, customer_name),
                    last_used_order:orders!gift_cards_last_used_order_id_fkey(order_number)
                `)
                .order("issued_at", { ascending: false });

            if (filters.search && filters.search.trim()) {
                const s = sanitizeFilterValue(filters.search.trim());
                if (s) {
                    query = query.or(`code.ilike.%${s}%,purchaser_phone.ilike.%${s}%`);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب بطاقات الهدايا:", e.message);
            return [];
        }
    }

    /**
     * 🎁 [إصدار بطاقة هدية يدوي]: البطاقات بتتصدر تلقائياً لما عميل يشتري منتج
     * بطاقة هدية ويستلمه، لكن أحياناً محتاجة تصدّري واحدة يدوي (تعويض، هدية
     * ترويجية، اتفاق تليفوني). purchase_order_id بيفضل null عشان نعرف إنها
     * صدرت يدوي مش من عملية شراء حقيقية. الكود بيتولّد من generate_gift_card_code
     * (نفس الدالة اللي بيستخدمها الإصدار التلقائي) عشان يفضل بنفس الشكل.
     */
    async function issueManualGiftCard({ phone, amount, expiresAt }) {
        const cleanPhone = (phone || "").replace(/[\s\-()+]/g, "");
        if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
            throw new Error("رقم الموبايل غير صحيح");
        }
        const { data: codeData, error: codeErr } = await client.rpc("generate_gift_card_code");
        if (codeErr) throw codeErr;
        const code = codeData;

        const { error } = await client.from("gift_cards").insert({
            code,
            amount,
            remaining_amount: amount,
            purchaser_phone: cleanPhone,
            purchase_order_id: null,
            expires_at: expiresAt,
        });
        if (error) throw error;
        await logAdminAction("إصدار بطاقة هدية يدوية", "gift_card", code, code, { phone: cleanPhone, amount });
        return code;
    }

    /** ✏️ تعديل بطاقة هدية موجودة - الرصيد المتبقي وتاريخ الانتهاء بس، نفس
     *  فلسفة تعديل قسيمة الولاء بالظبط (الكود/القيمة الأصلية/رقم المشتري ثوابت) */
    async function updateGiftCard(giftCardId, { remainingAmount, expiresAt }) {
        const patch = {};
        if (remainingAmount !== undefined && remainingAmount !== null) patch.remaining_amount = remainingAmount;
        if (expiresAt !== undefined && expiresAt !== null) patch.expires_at = expiresAt;
        if (!Object.keys(patch).length) return;
        const { error } = await client.from("gift_cards").update(patch).eq("id", giftCardId);
        if (error) throw error;
    }

    /** إلغاء بطاقة هدية (تصفير الرصيد المتبقي، نفس منطق إلغاء قسيمة الولاء) */
    async function voidGiftCard(giftCardId, code) {
        const { error } = await client
            .from("gift_cards")
            .update({ remaining_amount: 0 })
            .eq("id", giftCardId);
        if (error) throw error;
        await logAdminAction("إلغاء بطاقة هدية يدوياً", "gift_card", giftCardId, code || null);
    }

    /** بطاقات هدايا نشطة (رصيد موجود + لسه ما انتهتش) ومحدش قال للمشتري بكودها
     *  لحد دلوقتي (notified_at is null) - نفس منطق قسائم الولاء بالظبط. */
    async function getUnnotifiedGiftCards() {
        try {
            const { data, error } = await client
                .from("gift_cards")
                .select("id, purchaser_phone, code, amount, remaining_amount, expires_at, issued_at, purchase_order:orders!gift_cards_purchase_order_id_fkey(order_number, customer_name)")
                .is("notified_at", null)
                .gt("remaining_amount", 0)
                .gt("expires_at", new Date().toISOString())
                .order("issued_at", { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب بطاقات الهدايا اللي لسه محدش اتقالها:", e.message);
            return [];
        }
    }

    async function markGiftCardNotified(giftCardId) {
        const { error } = await client
            .from("gift_cards")
            .update({ notified_at: new Date().toISOString() })
            .eq("id", giftCardId);
        if (error) throw error;
    }

    /* ============================= 🎁❓ الأسئلة الشائعة عن بطاقات الهدايا (gift_card_faqs) ============================= */
    /**
     * أسئلة وإجابات ثابتة عن بطاقات الهدايا (منفصلة تماماً عن products.faqs
     * الخاص بأسئلة كل منتج لوحده) - بتتعرض للعميلة في صفحة gift-card-faq.html
     * كأكورديون واحد يغطي الموضوع كله (الشراء/الاستلام/الاستخدام/الصلاحية).
     * قراءة عامة (RLS: is_published=true فقط) وكتابة أدمن فقط - نفس فلسفة
     * أي جدول كتالوج تاني في الموقع.
     */

    /** كل الأسئلة (منشورة ومخفية) - للوحة التحكم بس، مرتبة بـ sort_order */
    async function getAllGiftCardFaqs() {
        try {
            const { data, error } = await client
                .from("gift_card_faqs")
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("تعذر جلب الأسئلة الشائعة عن بطاقات الهدايا:", e.message);
            return [];
        }
    }

    /** إضافة سؤال جديد - sort_order افتراضياً بيتحط آخر الترتيب الحالي */
    async function addGiftCardFaq({ question, answer, sortOrder, isPublished }) {
        const q = (question || "").trim();
        const a = (answer || "").trim();
        if (!q || !a) throw new Error("السؤال والإجابة مطلوبين");

        let finalSortOrder = sortOrder;
        if (finalSortOrder === undefined || finalSortOrder === null) {
            const { data: maxRow } = await client
                .from("gift_card_faqs")
                .select("sort_order")
                .order("sort_order", { ascending: false })
                .limit(1)
                .maybeSingle();
            finalSortOrder = (maxRow?.sort_order || 0) + 1;
        }

        const { data, error } = await client
            .from("gift_card_faqs")
            .insert({
                question: q,
                answer: a,
                sort_order: finalSortOrder,
                is_published: isPublished !== false,
            })
            .select()
            .single();
        if (error) throw error;
        await logAdminAction("إضافة سؤال شائع عن بطاقات الهدايا", "gift_card_faq", data.id, q);
        return data;
    }

    /** تعديل سؤال موجود - أي مجموعة حقول من question/answer/sortOrder/isPublished */
    async function updateGiftCardFaq(faqId, { question, answer, sortOrder, isPublished }) {
        const patch = { updated_at: new Date().toISOString() };
        if (question !== undefined) patch.question = (question || "").trim();
        if (answer !== undefined) patch.answer = (answer || "").trim();
        if (sortOrder !== undefined && sortOrder !== null) patch.sort_order = sortOrder;
        if (isPublished !== undefined) patch.is_published = !!isPublished;

        const { error } = await client.from("gift_card_faqs").update(patch).eq("id", faqId);
        if (error) throw error;
        await logAdminAction("تعديل سؤال شائع عن بطاقات الهدايا", "gift_card_faq", faqId, patch.question || null);
    }

    /** حذف سؤال نهائياً */
    async function deleteGiftCardFaq(faqId, question) {
        const { error } = await client.from("gift_card_faqs").delete().eq("id", faqId);
        if (error) throw error;
        await logAdminAction("حذف سؤال شائع عن بطاقات الهدايا", "gift_card_faq", faqId, question || null);
    }

    /** إعادة ترتيب دفعة من الأسئلة مرة واحدة - بتستقبل [{id, sort_order}, ...]
     *  (نفس فكرة أزرار الأعلى/الأسفل في مكونات الـ repeater بلوحة التحكم) */
    async function reorderGiftCardFaqs(orderedItems) {
        if (!orderedItems || !orderedItems.length) return;
        await Promise.all(
            orderedItems.map((item) =>
                client.from("gift_card_faqs").update({ sort_order: item.sort_order }).eq("id", item.id)
            )
        );
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
        getCustomerAttributionBreakdown,
        getCustomersByCategoryInterest,
        getCustomerFavorites,
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
        getAllCoupons,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        archiveCoupon,
        unarchiveCoupon,
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
        issueLoyaltyVoucher,
        updateLoyaltyVoucher,
        getUnnotifiedVouchers,
        markVoucherNotified,
        revokeLoyaltyVoucher,
        grantManualLoyaltyVoucher,
        voidLoyaltyVoucher,
        getAllGiftCards,
        issueManualGiftCard,
        updateGiftCard,
        voidGiftCard,
        getUnnotifiedGiftCards,
        markGiftCardNotified,
        getAllGiftCardFaqs,
        addGiftCardFaq,
        updateGiftCardFaq,
        deleteGiftCardFaq,
        reorderGiftCardFaqs,
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