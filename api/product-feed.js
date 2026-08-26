/**
 * api/product-feed.js
 * =====================================================================
 * 👑 [نمو - مزامنة كتالوج فيسبوك/انستجرام/تيك توك]: بيولّد ملف XML بصيغة Google
 * Merchant / Meta Catalog القياسية (RSS 2.0 + namespace g:) من نفس قاعدة
 * البيانات الحية، بنفس فكرة api/sitemap.js بالظبط - أي منتج يتضاف أو يتغير
 * سعره في لوحة التحكم بيتحدث هنا تلقائياً من غير أي خطوة يدوية.
 *
 * الاستخدام: بعد الديبلوي، من Meta Commerce Manager (business.facebook.com/commerce)
 * أو TikTok Shop Catalog Manager، اختاري "إضافة منتجات عبر رابط تلقائي (Data Feed URL)"
 * وحطي: https://bose-sweet.vercel.app/product-feed.xml
 * وحددي تحديث تلقائي يومي - المنصتين بيقبلوا نفس الصيغة دي بالظبط.
 *
 * ده خطوة كود بس - ربط الكتالوج فعليًا بحساب فيسبوك/تيك توك بتاعك لسه محتاج
 * منك تدخلي بنفسك على Commerce Manager (مفيش وصول لحسابك من هنا).
 */

const SUPABASE_URL = "https://thwlsijxvrgyckpoeyua.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HdLUW0DNMcVe7b1yI9xJXQ_3avPPn2u";
const SITE_BASE = "https://bose-sweet.vercel.app";

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

function escapeXml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function cdata(str) {
    return `<![CDATA[${String(str || "")}]]>`;
}

module.exports = async function handler(req, res) {
    try {
        // 🛡️ نفس شرط sitemap.js بالظبط: منتجات المحاكيات (builder_type != standard) مالهاش
        // سعر ثابت ولا صفحة منتج حقيقية، فمش منطقي تتحط في كتالوج تسوق بسعر تقريبي غلط.
        const products = await fetchTable(
            "products?select=id,title,description,flavor_desc,images,price,old_price,is_available,category_id&or=(builder_type.is.null,builder_type.eq.standard)"
        );
        const categories = await fetchTable("categories?select=id,title");
        const catMap = {};
        categories.forEach((c) => { catMap[c.id] = c.title; });

        const items = products
            .filter((p) => p.images && p.images.length > 0 && p.price) // منتج من غير صورة أو سعر مرفوض من فيسبوك/تيك توك أصلاً
            .map((p) => {
                // ملحوظة: مفيش عمود "slug" منفصل - الموقع كله بيستخدم id نفسه كـ "slug"
                // (js/supabase-client.js: slug: p.id) - نفس الرابط المستخدم في كل مكان.
                const link = `${SITE_BASE}/product.html?slug=${p.id}`;
                const desc = p.flavor_desc || p.description || `${p.title} من حلويات بوسي - مكونات طبيعية 100% وتحضير طازة يومياً.`;
                const availability = p.is_available === false ? "out of stock" : "in stock";
                // 🛡️ [إصلاح - تحذير "الكمية غير موجودة" في Meta Commerce Manager]: فيسبوك/
                // انستجرام بيحتاجوا رقم كمية صريح (مش بس حالة متوفر/مش متوفر) عشان يفعّلوا
                // الشراء المباشر جوه المتجر عندهم. مفيش عمود كمية فعلي في جدول المنتجات
                // (حلويات بوسي بتستقبل الطلبات عبر واتساب مش عبر checkout داخل فيسبوك)،
                // فبنبعت رقم كبير ثابت (999) للمنتج المتوفر و0 للي نفدت كميته - يكفي لإسكات
                // التحذير ده من غير ما يعني إننا فاتحين شراء فعلي جوه فيسبوك.
                const inventoryQty = p.is_available === false ? 0 : 999;
                const extraImages = p.images.slice(1, 11).map((img) => `\n      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join("");
                return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <title>${cdata(p.title)}</title>
      <description>${cdata(desc)}</description>
      <link>${escapeXml(link)}</link>
      <g:image_link>${escapeXml(p.images[0])}</g:image_link>${extraImages}
      <g:availability>${availability}</g:availability>
      <g:inventory>${inventoryQty}</g:inventory>
      <g:price>${Math.round(p.price)} EGP</g:price>
      ${p.old_price && p.old_price > p.price ? `<g:sale_price>${Math.round(p.price)} EGP</g:sale_price>\n      <g:price>${Math.round(p.old_price)} EGP</g:price>` : ""}
      <g:brand>حلويات بوسي</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${cdata(catMap[p.category_id] || "حلويات")}</g:product_type>
    </item>`;
            });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>حلويات بوسي - كتالوج المنتجات</title>
    <link>${SITE_BASE}</link>
    <description>كتالوج منتجات حلويات بوسي لفيسبوك وانستجرام وتيك توك شوب</description>
${items.join("\n")}
  </channel>
</rss>
`;

        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        res.status(200).send(xml);
    } catch (err) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(500).send("تعذر توليد كتالوج المنتجات حالياً");
    }
}
