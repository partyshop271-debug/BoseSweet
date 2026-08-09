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
    };
})();
