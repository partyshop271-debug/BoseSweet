/**
 * api/manifest.js
 * =====================================================================
 * 👑 [أيقونة التطبيق من لوحة التحكم]: بدل ما أيقونة التطبيق (اللي بتظهر لما
 * العميل يفتح الموقع كتطبيق مثبّت على شاشته الرئيسية) تكون ثابتة في كود
 * الموقع، الدالة دي بتولّد ملف manifest.json *لحظياً* من نفس "شعار المتجر"
 * المتحكَّم فيه بالفعل من لوحة التحكم (إعدادات المتجر > استبدال اللوجو).
 * يعني أي تغيير للوجو من لوحة التحكم بيغيّر أيقونة التطبيق تلقائياً من غير
 * أي تعديل كود.
 *
 * بتستخدم نفس الـ publishable key العلني المستخدم في js/supabase-client.js
 * وapi/sitemap.js - آمن للعرض هنا برضه لإنه مفتاح قراءة عام بس.
 *
 * محتاجة vercel.json (جنب الملف ده) عشان /manifest.json يوجّه هنا، وحذف
 * ملف manifest.json الثابت القديم من جذر المشروع عشان الدالة دي هي اللي
 * تشتغل بدل منه (نفس أسلوب /sitemap.xml -> /api/sitemap بالظبط).
 */

const SUPABASE_URL = "https://thwlsijxvrgyckpoeyua.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HdLUW0DNMcVe7b1yI9xJXQ_3avPPn2u";

const DEFAULT_LOGO_URL = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";

/**
 * بتحوّل أي رابط Cloudinary لنسخة مربعة نضيفة 512x512 (مقاس أيقونات
 * PWA/الشاشة الرئيسية القياسي) بدل ما تعتمد على أبعاد الصورة الأصلية
 * زي ما اترفعت (اللي غالباً مش مربعة لإنها كانت بتُستخدم كلوجو هيدر بس).
 * لو الرابط مش من Cloudinary (نادر) بيرجّعه زي ما هو من غير تعديل.
 */
function toSquareIconUrl(url, size) {
    if (!url || typeof url !== "string") return DEFAULT_LOGO_URL;
    if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
    const transform = `f_auto,q_auto,w_${size},h_${size},c_fill,g_auto,b_white`;
    return url.replace("/upload/", `/upload/${transform}/`);
}

module.exports = async function handler(req, res) {
    let logoUrl = DEFAULT_LOGO_URL;

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/store_settings?id=eq.1&select=logo`,
            {
                headers: {
                    apikey: SUPABASE_PUBLISHABLE_KEY,
                    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
                },
            }
        );
        if (response.ok) {
            const rows = await response.json();
            const fetchedLogo = Array.isArray(rows) ? rows[0]?.logo : rows?.logo;
            if (fetchedLogo && typeof fetchedLogo === "string" && fetchedLogo.trim()) {
                logoUrl = fetchedLogo.trim();
            }
        }
    } catch (err) {
        // فشل الاتصال بقاعدة البيانات: منكسرش أيقونة التطبيق - نرجع للوجو الافتراضي بأمان
    }

    const manifest = {
        name: "حلويات بوسي - صنعناها بحب لتهديها لمن تحب",
        short_name: "حلويات بوسي",
        description: "حلويات فاخرة تُصنع بحب لتليق بأسعد لحظاتك. صمّم تورتتك وبوكيه ورودك بنفسك عبر محاكياتنا التفاعلية.",
        start_url: "/index.html",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        dir: "rtl",
        lang: "ar",
        background_color: "#FFFFFF",
        theme_color: "#FF91A4",
        icons: [
            { src: toSquareIconUrl(logoUrl, 192), sizes: "192x192", type: "image/png", purpose: "any" },
            { src: toSquareIconUrl(logoUrl, 512), sizes: "512x512", type: "image/png", purpose: "any" },
            { src: toSquareIconUrl(logoUrl, 512), sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
    };

    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    // 🕐 [تحديث حي بدون ضغط زيادة على القاعدة]: بيتخزّن مؤقتاً لمدة ساعة على شبكة
    // Vercel، وبعد كده أول زيارة بتاخد نسخة جديدة فوراً وتفضل الأقدم شغالة في
    // الخلفية لحد ما النسخة الجديدة تتجهز - يعني تغيير اللوجو من لوحة التحكم
    // بيوصل لأيقونة التطبيق خلال ساعة تقريباً من غير تحميل زيادة على القاعدة.
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json(manifest);
};
