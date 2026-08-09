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
                const s = filters.search.trim();
                query = query.or(
                    `order_number.ilike.%${s}%,customer_name.ilike.%${s}%,phone1.ilike.%${s}%,phone2.ilike.%${s}%`
                );
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
        getAllProducts,
        createProduct,
        updateProduct,
        deleteProduct,
    };
})();