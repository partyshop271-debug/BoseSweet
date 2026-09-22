// =============================================================================
// rotate-homepage-content
// -----------------------------------------------------------------------------
// نظام التحديث التلقائي للصفحة الرئيسية لموقع حلويات بوسي.
//
// بيتنفّذ عن طريق Supabase Cron (pg_cron + pg_net) مرة كل يوم (راجع
// supabase/sql/setup-homepage-rotation.sql) - بس هو نفسه بيقرر جوّه لو
// "استحقّ" ياخد أكشن ولا لأ، بناءً على homepage.rotation.intervalDays
// (افتراضي 3 أيام) و homepage.rotation.lastRunAt. يعني تقدري تنادي الرابط
// ده كذا مرة في اليوم ومش هيحصل أي تكرار غير مرغوب فيه.
//
// كل مرة "تستحق" فيها تشغيلة حقيقية، بيغيّر في store_settings (id=1):
//   - homepage.mostSelling   → من بيانات مبيعات حقيقية (RPC get_admin_top_products)
//   - homepage.newArrivals   → عشوائي من أحدث 20 منتج فعلي (created_at)
//   - homepage.waterfall     → صور عشوائية من صور المنتجات الفعلية، كل صورة
//                               مربوطة بمنتجها الحقيقي
//   - homepage.videoSections → اختيار عشوائي من مجموعة الفيديوهات الاحتياطية
//                               (homepage.videoPool) لكل قسم، لو فيه فيديوهات
//                               مضافة من لوحة التحكم
//   - navigation.topBarMessages → عشوائي من مجموعة رسائل جاهزة
//
// لو صاحبة المتجر عطّلت "التحديث التلقائي" من لوحة تحكم الصفحة الرئيسية
// (homepage.rotation.enabled = false)، الدالة بترجع فوراً من غير ما تغيّر
// أي حاجة.
// =============================================================================

// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// سر بسيط بتحطيه إنتي بنفسك (supabase secrets set ROTATION_SECRET=...) ونفس
// القيمة بتتبعت من جوب الـ cron - عشان محدش يقدر ينادي الرابط ده من برّه
// ويغيّر محتوى موقعك.
const ROTATION_SECRET = Deno.env.get("ROTATION_SECRET");

const DEFAULT_INTERVAL_DAYS = 3;

// نفس الرسائل الجاهزة الموجودة في admin/js/pages/homepage-page.js
// (TOPBAR_SUGGESTED_MESSAGES) - بتتخزن في navigation.topBarMessagePool أول
// مرة تشتغل، وبعد كده بتتقرا من هناك (لو حبيتي تعدّلي المجموعة تقدري تعدّلي
// عمود navigation.topBarMessagePool مباشرة في Supabase من غير ما تلمسي الكود).
const DEFAULT_TOPBAR_MESSAGES = [
  "صممي تورتة أحلامك بنفسك مع محاكي التورت 🎂",
  "اطلبي تورتتك في خطوة واحدة بس - سريع وسهل ⚡",
  "بوكيهات ورد طازجة مصممة خصيصاً ليكِ 💐",
  "توصيل طازج يومياً لجميع المناطق 🚚",
  "كل حلوياتنا بتتحضر طازة يوم الطلب",
  "جربي الريدفلفت... طعم مختلف تماماً",
  "عروض حصرية تنتظرك 🏷️",
  "برنامج المكافآت: اجمعي نقاط مع كل طلب 🎁",
  "تقدري تتبعي طلبك لحظة بلحظة من صفحة تتبع الطلب",
  "كارت إهداء ورقي فاخر مع كل تورتة مميزة",
  "الديسباسيتو الفاخر... تجربة تستاهل التجربة",
  "صنعناها بحب لتهديها لمن تحب 💕",
];

/** اختيار n عنصر عشوائي من مصفوفة من غير تكرار (Fisher-Yates جزئي) */
function pickRandom<T>(arr: T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (pool.length > 0 && out.length < n) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

Deno.serve(async (req: Request) => {
  try {
    if (ROTATION_SECRET && req.headers.get("x-rotation-secret") !== ROTATION_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: settingsRow, error: settingsErr } = await supabase
      .from("store_settings")
      .select("homepage, navigation")
      .eq("id", 1)
      .maybeSingle();
    if (settingsErr) throw settingsErr;

    const homepage = settingsRow?.homepage || {};
    const navigation = settingsRow?.navigation || {};

    // ------------------------------------------------------------------
    // هل استحقّت تشغيلة حقيقية دلوقتي؟ (مفعّلة + عدّت المدة المحدّدة)
    // ------------------------------------------------------------------
    const intervalDays = Number(homepage.rotation?.intervalDays) > 0
      ? Number(homepage.rotation.intervalDays)
      : DEFAULT_INTERVAL_DAYS;
    const lastRunAt = homepage.rotation?.lastRunAt ? new Date(homepage.rotation.lastRunAt) : null;
    const dueNow = !lastRunAt || (Date.now() - lastRunAt.getTime()) >= intervalDays * 24 * 60 * 60 * 1000;

    if (homepage.rotation?.enabled === false) {
      return new Response(JSON.stringify({ skipped: true, reason: "rotation_disabled" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!dueNow) {
      return new Response(JSON.stringify({ skipped: true, reason: "not_due_yet", lastRunAt: homepage.rotation?.lastRunAt }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ------------------------------------------------------------------
    // المنتجات النشطة (متاحة وليها صور)
    // ------------------------------------------------------------------
    const { data: productsRaw, error: productsErr } = await supabase
      .from("products")
      .select("id, title, images, is_available, created_at")
      .or("is_available.eq.true,is_available.is.null");
    if (productsErr) throw productsErr;
    const activeProducts = (productsRaw || []).filter((p) => Array.isArray(p.images) && p.images.length > 0);

    if (activeProducts.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_active_products" }), { status: 200 });
    }

    // ------------------------------------------------------------------
    // 1) الأكثر مبيعاً - بيانات مبيعات حقيقية، مع تبديل نافذة الأيام (أسبوع/
    //    شهر/ربع سنة) كل دورة عشان يفضل القسم متجدد بصرياً حتى لو نفس
    //    المنتجات بتحافظ على تصدرها في المبيعات.
    // ------------------------------------------------------------------
    const salesWindows = [7, 30, 90];
    const windowDays = salesWindows[Math.floor(Math.random() * salesWindows.length)];
    let mostSelling: string[] = [];
    try {
      const { data: topProducts, error: topErr } = await supabase.rpc("get_admin_top_products", {
        p_days: windowDays,
        p_limit: 10,
      });
      if (topErr) throw topErr;
      mostSelling = (topProducts || [])
        .map((r: { product_id: string }) => r.product_id)
        .filter((id: string | null) => !!id && activeProducts.some((p) => p.id === id));
    } catch (_e) {
      // لو الـ RPC فشلت لأي سبب، منوقفش التحديث كله - بنكمل بمنتجات عشوائية بس
      mostSelling = [];
    }
    if (mostSelling.length < 6) {
      const fillers = pickRandom(
        activeProducts.filter((p) => !mostSelling.includes(p.id)),
        8 - mostSelling.length,
      );
      mostSelling = [...mostSelling, ...fillers.map((p) => p.id)];
    }

    // ------------------------------------------------------------------
    // 2) وصل حديثاً - عشوائي من أحدث 20 منتج فعلي بتاريخ إضافة حقيقي
    // ------------------------------------------------------------------
    const recentPool = [...activeProducts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);
    const newArrivals = pickRandom(recentPool, Math.min(8, recentPool.length)).map((p) => p.id);

    // ------------------------------------------------------------------
    // 3) شلال المنتجات - صور عشوائية من صور المنتجات الحالية، كل صورة
    //    مربوطة بمنتجها الحقيقي (نفس شكل { image, slug } اللي اللوحة بتحفظه)
    // ------------------------------------------------------------------
    const buildWaterfallList = (count: number) =>
      pickRandom(activeProducts, Math.min(count, activeProducts.length)).map((p) => ({
        image: p.images[0],
        slug: p.id,
      }));
    const waterfall = {
      ...(homepage.waterfall || {}),
      leftColumnImages: buildWaterfallList(10),
      rightColumnImages: buildWaterfallList(10),
    };

    // ------------------------------------------------------------------
    // 4) الفيديوهات - اختيار عشوائي من مجموعة كل قسم (homepage.videoPool)،
    //    والفيديو المعروض حالياً بيدخل هو كمان ضمن الاختيار عشان ميضيعش لو
    //    كان أحسن اختيار متاح.
    // ------------------------------------------------------------------
    const videoSections: Record<string, { publicId: string; title: string; description: string }> = {
      ...(homepage.videoSections || {}),
    };
    const videoPool = homepage.videoPool || {};
    for (const key of ["symphony", "excellence"]) {
      const pool = [...(videoPool[key] || [])];
      const current = videoSections[key];
      if (current && current.publicId) pool.push(current);
      if (pool.length > 0) {
        const choice = pool[Math.floor(Math.random() * pool.length)];
        videoSections[key] = {
          publicId: choice.publicId,
          title: choice.title,
          description: choice.description,
        };
      }
      // لو المجموعة فاضية (مفيش فيديوهات احتياطية اتضافت لسه)، بنسيب الفيديو
      // الحالي زي ما هو - مفيش أي حاجة تتغيّر في القسم ده لحد ما تضاف فيديوهات.
    }

    // ------------------------------------------------------------------
    // 5) رسائل الشريط العلوي - عشوائي من مجموعة رسائل جاهزة (بتتخزن أول مرة
    //    في navigation.topBarMessagePool عشان تبقى قابلة للتعديل من القاعدة
    //    مباشرة من غير الحاجة لتعديل الكود)
    // ------------------------------------------------------------------
    const messagePool: string[] = (navigation.topBarMessagePool && navigation.topBarMessagePool.length)
      ? navigation.topBarMessagePool
      : DEFAULT_TOPBAR_MESSAGES;
    const topBarMessages = pickRandom(messagePool, Math.min(6, messagePool.length));

    // ------------------------------------------------------------------
    // الحفظ - استبدال homepage و navigation بالكامل بنفس منطق updateHomepageSettings
    // / updateNavigationSettings في admin/js/admin-data.js (لازم نجيب القيم
    // الحالية الأول ونعدّل عليها، مش نبعت كائن جزئي)
    // ------------------------------------------------------------------
    const updatedHomepage = {
      ...homepage,
      mostSelling,
      newArrivals,
      waterfall,
      videoSections,
      rotation: {
        ...(homepage.rotation || {}),
        enabled: true,
        intervalDays,
        lastRunAt: new Date().toISOString(),
        lastSalesWindowDays: windowDays,
      },
    };
    const updatedNavigation = {
      ...navigation,
      topBarMessages,
      topBarMessagePool: messagePool,
    };

    const { error: updateErr } = await supabase
      .from("store_settings")
      .update({ homepage: updatedHomepage, navigation: updatedNavigation, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({
        success: true,
        mostSelling,
        newArrivals,
        waterfallCount: waterfall.leftColumnImages.length + waterfall.rightColumnImages.length,
        videoSections: Object.fromEntries(Object.entries(videoSections).map(([k, v]) => [k, v.title])),
        topBarMessagesCount: topBarMessages.length,
        salesWindowDays: windowDays,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("rotate-homepage-content error:", err);
    return new Response(JSON.stringify({ error: String(err instanceof Error ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
