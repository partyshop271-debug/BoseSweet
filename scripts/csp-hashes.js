/**
 * scripts/csp-hashes.js
 * =====================================================================
 * 🛡️ [تصليب CSP - إزالة 'unsafe-inline' من script-src]: بدل ما الـ CSP
 * يسمح بأي <script> مضمّن (inline) في أي صفحة HTML (وده كان بيلغي فايدة
 * الـ CSP ضد XSS تمامًا لو ظهرت أي ثغرة حقن يومًا)، بقى مسموح فقط بالسكريبتات
 * المضمّنة اللي الـ hash بتاعها (SHA-256 لمحتواها بالظبط) موجود صراحة في
 * vercel.json. أي سكريبت مضمّن جديد أو أي تعديل حرف واحد في سكريبت موجود
 * هيغيّر الـ hash بتاعه، فلازم الأمر ده يتشغل بعد أي تعديل عشان يزامن
 * vercel.json - وإلا السكريبت هيتمنع صامت في الإنتاج (مفيش أي error واضح،
 * بس الميزة اللي بيعملها هتبقى مش شغالة) وده أخطر بكتير من فشل الـ build.
 *
 * الاستخدام:
 *   node scripts/csp-hashes.js check   → يتأكد إن vercel.json متزامن مع
 *                                          كل سكريبتات الموقع الحالية،
 *                                          ويوقف بكود خطأ (فشل الـ build)
 *                                          لو فيه أي اختلاف. ده اللي بيتشغل
 *                                          تلقائيًا جوه npm run build.
 *   node scripts/csp-hashes.js update  → يعيد كتابة قائمة الـ hashes جوه
 *                                          vercel.json تلقائيًا عشان تطابق
 *                                          سكريبتات الموقع الحالية - شغّليها
 *                                          (أو قوليلي أشغّلها) بعد أي تعديل
 *                                          في محتوى أي <script> مضمّن.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const VERCEL_JSON_PATH = path.join(ROOT, "vercel.json");
const SKIP_DIRS = new Set(["vendor", "node_modules", ".git", ".vercel"]);

function walkHtmlFiles(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkHtmlFiles(full, out);
        else if (entry.name.endsWith(".html")) out.push(full);
    }
    return out;
}

const SCRIPT_TAG_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

/** بيرجّع Set من كل الـ sha256 hashes (بصيغة 'sha256-...') لكل سكريبت مضمّن حقيقي في الموقع. */
function collectCurrentHashes() {
    const files = walkHtmlFiles(ROOT, []);
    const hashes = new Set();
    const details = [];
    for (const file of files) {
        const html = fs.readFileSync(file, "utf8");
        let m;
        while ((m = SCRIPT_TAG_RE.exec(html)) !== null) {
            const [, attrs, content] = m;
            if (/\bsrc\s*=/i.test(attrs)) continue; // سكريبت خارجي - ملوش داعي hash
            if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue; // بيانات مهيكلة، مش تنفيذية، مستثناة من CSP أصلاً
            if (content.trim() === "") continue;
            const hash = crypto.createHash("sha256").update(content, "utf8").digest("base64");
            const token = `'sha256-${hash}'`;
            hashes.add(token);
            details.push({ file: path.relative(ROOT, file), token });
        }
    }
    return { hashes, details };
}

function readVercelConfig() {
    return JSON.parse(fs.readFileSync(VERCEL_JSON_PATH, "utf8"));
}

function getCspHeaderEntry(config) {
    for (const rule of config.headers || []) {
        if (rule.source !== "/(.*)") continue;
        const h = (rule.headers || []).find((x) => x.key === "Content-Security-Policy");
        if (h) return h;
    }
    return null;
}

function parseScriptSrcHashes(cspValue) {
    const match = cspValue.match(/script-src\s+([^;]+);/);
    if (!match) return { before: cspValue, hashes: new Set(), prefix: "", suffix: "" };
    const tokens = match[1].trim().split(/\s+/);
    const hashes = new Set(tokens.filter((t) => t.startsWith("'sha256-")));
    return { fullMatch: match[0], directiveBody: match[1], tokens };
}

function run() {
    const mode = process.argv[2];
    if (mode !== "check" && mode !== "update") {
        console.error("الاستخدام: node scripts/csp-hashes.js <check|update>");
        process.exit(2);
    }

    const { hashes: currentHashes, details } = collectCurrentHashes();
    const config = readVercelConfig();
    const cspEntry = getCspHeaderEntry(config);
    if (!cspEntry) {
        console.error("❌ تعذر إيجاد سطر Content-Security-Policy في vercel.json.");
        process.exit(1);
    }

    const parsed = parseScriptSrcHashes(cspEntry.value);
    if (!parsed.fullMatch) {
        console.error("❌ تعذر تحليل توجيه script-src داخل الـ CSP.");
        process.exit(1);
    }

    const existingHashes = new Set(parsed.tokens.filter((t) => t.startsWith("'sha256-")));
    const nonHashTokens = parsed.tokens.filter((t) => !t.startsWith("'sha256-"));

    if (mode === "check") {
        const missing = [...currentHashes].filter((h) => !existingHashes.has(h));
        const stale = [...existingHashes].filter((h) => !currentHashes.has(h));

        if (missing.length === 0 && stale.length === 0) {
            console.log(`✅ CSP متزامن: كل الـ ${currentHashes.size} سكريبت مضمّن في الموقع مطابقين لـ vercel.json.`);
            process.exit(0);
        }

        console.error("❌ vercel.json مش متزامن مع سكريبتات الموقع الحالية!");
        if (missing.length) {
            console.error(`\n   🔴 ${missing.length} سكريبت مضمّن في الكود لكن الـ hash بتاعه مش موجود في vercel.json (هيتمنع صامت في الإنتاج):`);
            details
                .filter((d) => missing.includes(d.token))
                .forEach((d) => console.error(`      - ${d.file}`));
        }
        if (stale.length) {
            console.error(`\n   🟡 ${stale.length} hash موجود في vercel.json لكن مفيش سكريبت بيطابقه دلوقتي (على الأغلب سكريبت اتشال أو اتعدّل - تنظيف بس، مش خطر أمني).`);
        }
        console.error("\n   👉 شغّلي: node scripts/csp-hashes.js update   لإعادة المزامنة تلقائيًا، وبعدين افحصي التعديل قبل ما تعمليه commit.");
        process.exit(1);
    }

    // mode === "update"
    const newTokens = [...nonHashTokens, ...[...currentHashes].sort()];
    const newDirectiveBody = newTokens.join(" ");
    cspEntry.value = cspEntry.value.replace(parsed.fullMatch, `script-src ${newDirectiveBody};`);
    fs.writeFileSync(VERCEL_JSON_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");
    console.log(`✅ تم تحديث vercel.json: ${currentHashes.size} hash لسكريبتات الموقع الحالية.`);
}

run();
