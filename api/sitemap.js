/**
 * api/sitemap.js
 * =====================================================================
 * 👑 [GEO/SEO - خريطة موقع حيّة]: بدل الملف الثابت sitemap.xml اللي كان
 * بيتولّد مرة واحدة وبيبقى قديم أول ما حد يضيف/يحذف منتج، الدالة دي بتبني
 * الخريطة *لحظياً* من قاعدة البيانات الحقيقية في كل مرة حد (أو أي بوت) يزور
 * /sitemap.xml - يعني أي منتج جديد بيظهر فيها أوتوماتيك، وأي منتج محذوف
 * بيختفي منها أوتوماتيك، وتواريخ التحديث حقيقية دايماً.
 *
 * بتستخدم الـ publishable key العلني نفسه المستخدم في js/supabase-client.js -
 * آمن للعرض هنا برضه لإنه مفتاح قراءة عام بس (نفس المفتاح ظاهر أصلاً في كود
 * الموقع العام اللي أي زائر بيقدر يشوفه من المتصفح).
 *
 * محتاجة vercel.json (جنب الملف ده) عشان /sitemap.xml يوجّه هنا، وحذف ملف
 * sitemap.xml الثابت القديم من جذر المشروع عشان الدالة دي هي اللي تشتغل بدل منه.
 */

const SUPABASE_URL = "https://thwlsijxvrgyckpoeyua.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HdLUW0DNMcVe7b1yI9xJXQ_3avPPn2u";
const SITE_BASE = "https://bose-sweet.vercel.app";

const STATIC_PAGES = [
    { path: "/", priority: "1.0" },
    { path: "/menu.html", priority: "0.9" },
    { path: "/offers.html", priority: "0.8" },
    { path: "/cake-builder.html", priority: "0.8" },
    { path: "/cake-quick-order.html", priority: "0.7" },
    { path: "/flower-builder.html", priority: "0.8" },
    { path: "/rewards.html", priority: "0.6" },
    { path: "/track-order.html", priority: "0.5" },
    { path: "/about.html", priority: "0.6" },
    { path: "/contact.html", priority: "0.6" },
    { path: "/policies/privacy-policy.html", priority: "0.3" },
    { path: "/policies/refund-policy.html", priority: "0.3" },
    { path: "/policies/shipping-policy.html", priority: "0.3" },
    { path: "/policies/terms.html", priority: "0.3" },
];

async function fetchTable(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
    });
    if (!res.ok) throw new Error(`Supabase fetch failed for ${path}: ${res.status}`);
    return res.json();
}

function toDateOnly(isoTimestamp) {
    return (isoTimestamp || new Date().toISOString()).slice(0, 10);
}

// 🖼️ [SEO - صور Sitemap]: بيهرّب أي حرف ممكن يكسر XML لو كان موجود في رابط الصورة
// (زي & اللي بتتحول لازم &amp; جوه XML صحيح).
function escapeXml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function urlEntry(loc, lastmod, priority, images) {
    const imageTags = (images || [])
        .filter(Boolean)
        .map((img) => `\n    <image:image>\n      <image:loc>${escapeXml(img)}</image:loc>\n    </image:image>`)
        .join("");
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>${imageTags}\n  </url>`;
}

module.exports = async function handler(req, res) {
    try {
        const today = toDateOnly(new Date().toISOString());

        const [categories, products] = await Promise.all([
            fetchTable("categories?select=id,updated_at,image"),
            // 🛡️ منتجات المحاكيات (custom-builder) مش صفحات منتج حقيقية - بترجّع
            // العميل لصفحة المحاكي فوراً (نفس شرط product.html بالظبط) فمفيش
            // داعي تتحط في الخريطة أصلاً.
            // ملحوظة: مفيش عمود "slug" منفصل في جدول products أصلاً — الموقع كله (js/supabase-client.js
            // rebuiltProducts: slug: p.id) بيستخدم الـ id نفسه كـ "slug" في كل مكان. الرابط
            // القديم product.html?slug=${p.id} كان صح فعلاً وهو نفس القيمة اللي product.html
            // بيدور بيها (p.slug === currentSlug، وslug هنا = id) — سيبناه زي ما هو، والإضافة
            // الوحيدة هنا هي صور المنتج لكل رابط.
            fetchTable("products?select=id,images,updated_at,builder_type&or=(builder_type.is.null,builder_type.eq.standard)"),
        ]);

        const entries = [];
        STATIC_PAGES.forEach((p) => entries.push(urlEntry(SITE_BASE + p.path, today, p.priority)));
        categories.forEach((c) => entries.push(urlEntry(`${SITE_BASE}/category.html?category=${c.id}`, toDateOnly(c.updated_at), "0.7", [c.image])));
        products.forEach((p) => entries.push(urlEntry(`${SITE_BASE}/product.html?slug=${p.id}`, toDateOnly(p.updated_at), "0.6", p.images)));

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join("\n")}\n</urlset>\n`;

        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        // 🕐 [تحديث حي بدون ضغط زيادة على القاعدة]: بيتخزّن مؤقتاً على شبكة Vercel
        // لمدة ساعة، وبعد كده أول زيارة بتاخد نسخة جديدة فوراً وتفضل الأقدم شغالة
        // في الخلفية (stale-while-revalidate) لحد ما النسخة الجديدة تتجهز - يعني
        // محدث فعلياً كل ساعة تقريباً من غير ما نحمّل قاعدة البيانات في كل زيارة.
        res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        res.status(200).send(xml);
    } catch (err) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(500).send("تعذر توليد خريطة الموقع حالياً");
    }
}
