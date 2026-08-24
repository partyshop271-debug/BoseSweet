/**
 * scripts/minify.js
 * =====================================================================
 * سكريبت وقت البناء بس (build-time) - مش بيتشغل عند أي زيارة للموقع.
 * بيدوّر على كل ملفات .js و.css الحقيقية اللي الموقع بيحمّلها في المتصفح
 * (js/، css/، admin/js/ [عدا مجلد pages منفصل بيتغطى برضه]، admin/css/)
 * وبيصغّرها (يشيل المسافات/التعليقات/الأسطر الفاضية) في نفس المكان بالظبط
 * - نفس الاسم ونفس المسار زي ما هو، فمفيش أي تعديل مطلوب في أي ملف HTML
 * (كل الـ <script src="js/core-engine.js?v=2026"> هتفضل شغالة زي ما هي).
 *
 * ده بيشتغل جوه بيئة البناء بتاعة Vercel نفسها وقت الـ deploy، مش على
 * الكود في المستودع (الملفات الأصلية في GitHub بتفضل زي ما هي وواضحة
 * للقراءة/التعديل دايمًا) - النسخة المصغّرة دي بس اللي بتوصل للمتصفح.
 *
 * ملفات api/*.js (الـ Serverless Functions) متعمّد استبعادها هنا - مفيش
 * أي داعي يتصغّروا (مبيحمّلهاش المتصفح خالص)، وأي خطأ فيهم بيكسر endpoint
 * حقيقي (sitemap/manifest/product-feed) مش مجرد صفحة عرض.
 *
 * التفعيل الفعلي محتاج خطوة واحدة بس من لوحة تحكم Vercel (مش من هنا):
 * Project Settings → Build & Development Settings → Build Command:
 *   npm run build
 * (سيبي Output Directory فاضية/افتراضية - إحنا بنصغّر في نفس المكان،
 * مش بننقل لمجلد تاني).
 */
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ROOT = path.join(__dirname, "..");

// المجلدات اللي فعلاً بتتحمّل في المتصفح - عمدًا مفيش api/ (سيرفرلس، مش أصول متصفح)
const TARGET_DIRS = ["js", "css", "admin/js", "admin/css"];

function collectFiles(dir, exts) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...collectFiles(full, exts));
        } else if (exts.includes(path.extname(entry.name))) {
            results.push(full);
        }
    }
    return results;
}

async function minifyFile(filePath) {
    const ext = path.extname(filePath);
    const loader = ext === ".css" ? "css" : "js";
    const original = fs.readFileSync(filePath, "utf8");
    const originalSize = Buffer.byteLength(original, "utf8");

    try {
        const result = await esbuild.transform(original, {
            loader,
            minify: true,
            // JS التصغير بس (مفيش تحويل/bundling) - أي كود شغال دلوقتي هيفضل
            // شغال بنفس المنطق بالظبط، بس أصغر حجم/أسرع تحميل
            target: loader === "js" ? "es2018" : undefined,
        });
        const minifiedSize = Buffer.byteLength(result.code, "utf8");
        fs.writeFileSync(filePath, result.code, "utf8");
        return { filePath, originalSize, minifiedSize, ok: true };
    } catch (err) {
        // 🛡️ [أمان]: لو ملف معين فيه مشكلة تصغير غير متوقعة، بنسيبه زي ما هو
        // (النسخة الأصلية الشغالة) بدل ما نكسر deploy كامل بسبب ملف واحد.
        console.warn(`⚠️  تعذر تصغير ${filePath}: ${err.message} - اتسابت النسخة الأصلية.`);
        return { filePath, originalSize, minifiedSize: originalSize, ok: false };
    }
}

async function run() {
    const files = TARGET_DIRS.flatMap((dir) => collectFiles(path.join(ROOT, dir), [".js", ".css"]));

    if (!files.length) {
        console.log("مفيش ملفات js/css اتلاقت للتصغير.");
        return;
    }

    let totalOriginal = 0;
    let totalMinified = 0;
    let failCount = 0;

    for (const file of files) {
        const res = await minifyFile(file);
        totalOriginal += res.originalSize;
        totalMinified += res.minifiedSize;
        if (!res.ok) failCount++;
    }

    const savedPercent = totalOriginal ? Math.round((1 - totalMinified / totalOriginal) * 100) : 0;
    console.log(`✅ تم تصغير ${files.length - failCount} من أصل ${files.length} ملف.`);
    console.log(`   الحجم قبل: ${(totalOriginal / 1024).toFixed(1)} KB → بعد: ${(totalMinified / 1024).toFixed(1)} KB (وفّرنا ~${savedPercent}%)`);
    if (failCount) console.log(`   ⚠️  ${failCount} ملف اتسابوا زي ما هما (راجعي التحذيرات فوق).`);
}

run();
