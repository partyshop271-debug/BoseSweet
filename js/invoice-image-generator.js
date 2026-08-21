/**
 * 🧾 مولّد صورة الفاتورة - حلويات بوسي (BoseSweets)
 * ==========================================================
 * الهدف: بناء صورة PNG منسّقة (بشعار الماركة وألوانها وختم رسمي) من بيانات
 * الطلب نفسها اللي بتتبني منها رسالة الواتساب النصية، عشان تتبعت للعميل
 * وللفرع كصورة فاتورة حقيقية واضحة بدل نص عادي.
 *
 * 🖼️ [تحسين - دقة ووضوح واحترافية الصورة]: تحديثات على الصورة عشان تبقى
 * مرجع بصري كامل وموثوق للفرع، مش بس تكرار للنص:
 *   1) كل صنف عادي (له نكهة/صورة حقيقية مخزنة في قاعدة البيانات) بيظهر جنبه
 *      صورة المنتج الحقيقية نفسها كمصغّرة - عشان أي خطأ نصي محتمل في النكهة
 *      يبقى واضح وملحوظ بصرياً فوراً للفرع قبل ما ينفذ الطلب، مش مجرد نص
 *      ممكن يتقرا غلط أو يتلخبط.
 *   2) لأصناف التورت المخصص: أي صورة طباعة/تصميم مرجعي رفعها العميل بتتعرض
 *      كمصغّرة حقيقية جوه الفاتورة نفسها (مش مجرد رابط نصي طويل زي الأول) -
 *      عشان الفرع يشوف التصميم المطلوب فوراً من غير ما يفتح أي رابط خارجي.
 *   3) رقم الطلب بقى شارة (badge) بارزة ومنفصلة تحت اسم المتجر مباشرة، عشان
 *      يبقى أسهل حاجة يتلاقط بيها الطلب في أي مراجعة سريعة.
 *   4) دقة الرسم اتزودت (RENDER_SCALE) عشان الكلام يفضل واضح وحاد حتى بعد
 *      ضغط واتساب للصورة، والنكهة بقت سطر منفصل بلون الماركة تحت اسم الصنف
 *      بدل ما تكون ملزوقة في نفس السطر - وضوح أعلى لكل كلمة.
 */

(function () {
    const BRAND_PINK = "#FF91A4";
    const BRAND_BLACK = "#111111";
    const BRAND_GOLD = "#D4AF37";
    const BRAND_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";
    const CANVAS_WIDTH = 760;
    const RENDER_SCALE = 3; // دقة أعلى (Retina+) عشان الكلام يفضل واضح بعد ضغط واتساب

    function loadImageSafe(url) {
        return new Promise((resolve) => {
            if (!url) { resolve(null); return; }
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = url;
        });
    }

    function wrapText(measureCtx, text, font, maxWidth) {
        measureCtx.font = font;
        const words = String(text || "").split(/\s+/).filter(Boolean);
        if (words.length === 0) return [""];
        const lines = [];
        let current = "";
        words.forEach((word) => {
            const attempt = current ? current + " " + word : word;
            if (measureCtx.measureText(attempt).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = attempt;
            }
        });
        if (current) lines.push(current);
        return lines;
    }

    // 🛡️ [إصلاح - استقلالية عن cart-engine.js]: الملف ده بقى بيتحمّل في صفحة
    // الأدمن (admin/orders.html) كمان مش بس في checkout للعميل، ومحتاج نفس
    // منطق تنسيق الوقت/الشكل اللي موجود أصلاً في js/cart-engine.js بالظبط -
    // بدل ما نحمّل ملف cart-engine.js الضخم بالكامل (مبني للـcheckout فقط
    // وممكن يسبب تأثيرات جانبية غير مرغوبة لو اشتغل في صفحة الأدمن)، بنكرر
    // نفس الدالتين الصغيرتين محلياً هنا. لو window.formatBoseTimeToEgyptian12Hour
    // أو window.getBoseArabicShapeName موجودين فعلاً (الصفحة دي بتحمّل
    // cart-engine.js زي صفحات العميل)، بيتستخدموا هم عادي عشان يفضل مصدر
    // الحقيقة واحد - النسخة المحلية دي بديل احتياطي بس.
    function localFormatTime12Hour(time24) {
        if (!time24 || typeof time24 !== "string" || !time24.includes(":")) return time24 || "";
        const [hStr, mStr] = time24.split(":");
        let hours = parseInt(hStr, 10);
        const minutes = parseInt(mStr, 10);
        if (isNaN(hours) || isNaN(minutes)) return time24;
        const period = hours >= 12 ? "مساءً" : "صباحاً";
        let hours12 = hours % 12;
        if (hours12 === 0) hours12 = 12;
        return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
    }

    function localArabicShapeName(shape) {
        const map = { circle: "دائري", heart: "قلب", square: "مربع", rectangle: "مستطيل" };
        return map[shape] || shape;
    }

    function formatTimeSafe(time24) {
        if (typeof window.formatBoseTimeToEgyptian12Hour === "function") {
            return window.formatBoseTimeToEgyptian12Hour(time24);
        }
        return localFormatTime12Hour(time24);
    }

    function shapeNameSafe(shape) {
        if (typeof window.getBoseArabicShapeName === "function") {
            return window.getBoseArabicShapeName(shape);
        }
        return localArabicShapeName(shape);
    }

    /**
     * يبني قائمة "أسطر" تفاصيل مخصصة لكل صنف (نفس منطق فاتورة الواتساب النصية)
     * كل سطر عبارة عن نص هيتعرض كنقطة تفصيلية تحت اسم الصنف.
     */
    function buildItemDetailLines(item) {
        const lines = [];
        const cd = item.customDetails;
        const isCakeBespoke = item.type === "custom-cake" || item.type === "mini-cake" ||
            item.productSlug === "toort-custom-master" || item.productSlug === "mini-cake-two-person";
        const isFlowerBespoke = item.type === "custom-flower" || item.productSlug === "flowers-master";

        if (cd) {
            if (isCakeBespoke) {
                if (cd.isGift) lines.push("🎁 هدية لحد تاني");
                if (cd.occasionLabel && cd.occasionLabel.trim()) lines.push(`المناسبة: ${cd.occasionLabel.trim()}`);
                if (cd.cakeType && cd.cakeType !== "none" && cd.cakeType !== "افتراضي") lines.push(`طعم الكيك: ${cd.cakeType}`);
                if (cd.shape && cd.shape !== "none") lines.push(`الشكل: ${shapeNameSafe(cd.shape)}`);
                if (cd.persons && cd.persons > 0) lines.push(`الأفراد: لـ ${cd.persons} فرد`);
                if (cd.printingType && cd.printingType !== "none") lines.push(`طباعة صورة: ${cd.printingType === "edible" ? "قابلة للأكل" : "غير قابلة للأكل"}`);
                if (cd.customMessage && cd.customMessage.trim()) lines.push(`النص: "${cd.customMessage.trim()}"`);
                if (cd.allergyNote && cd.allergyNote.trim()) lines.push(`⚠️ ملاحظة حساسية: ${cd.allergyNote.trim()}`);
                if (cd.hasGiftCard && cd.giftCardText && cd.giftCardText.trim()) lines.push(`كارت إهداء: "${cd.giftCardText.trim()}"`);
            } else if (isFlowerBespoke) {
                if (cd.isGift) lines.push("🎁 هدية لحد تاني");
                if (cd.moodLabel) lines.push(`الإحساس المطلوب: ${cd.moodLabel}`);
                if (cd.flowerType && cd.flowerType !== "none") lines.push(`نوع الورد: ${cd.flowerType}`);
                if (cd.flowerCount && cd.flowerCount > 0) lines.push(`التعداد: ${cd.flowerCount} وردة`);
                if (cd.hasSatinRibbon && cd.satinRibbonText && cd.satinRibbonText.trim()) lines.push(`شريط ستان: "${cd.satinRibbonText.trim()}"`);
                if (cd.photoCount && cd.photoCount > 0) lines.push(`صور شخصية مطبوعة: ${cd.photoCount} صورة`);
                if (cd.cashAmount && cd.cashAmount > 0) lines.push(`كاش مدمج: +${cd.cashAmount} EGP`);
                if (cd.hasChocolate && cd.chocolateBudget && cd.chocolateBudget > 0) lines.push(`ميزانية شوكولاتة: +${cd.chocolateBudget} EGP`);
                if (cd.hasGiftCard && cd.giftCardText && cd.giftCardText.trim()) lines.push(`كارت الإهداء: "${cd.giftCardText.trim()}"`);
            } else if (cd.sizeLabel) {
                lines.push(`الحجم المطلوب: ${cd.sizeLabel}`);
            }
        }
        return lines;
    }

    /**
     * يحدد أي صور حقيقية مرتبطة بالصنف لازم تتعرض كمصغرات داخل الفاتورة:
     * - أصناف عادية: صورة المنتج/النكهة الحقيقية نفسها (مش شعار افتراضي).
     * - أصناف التورت المخصص: صورة الطباعة وصورة التصميم المرجعي المرفوعتين.
     */
    function getItemThumbnailSpecs(item) {
        const cd = item.customDetails || {};
        const isCakeBespoke = item.type === "custom-cake" || item.type === "mini-cake" ||
            item.productSlug === "toort-custom-master" || item.productSlug === "mini-cake-two-person";

        if (isCakeBespoke) {
            const specs = [];
            if (cd.printImageUrl) specs.push({ label: "🖨️ صورة الطباعة على التورتة", url: cd.printImageUrl });
            if (cd.replicaImageUrl && cd.replicaImageUrl !== cd.printImageUrl) specs.push({ label: "🎨 صورة التصميم المرجعي", url: cd.replicaImageUrl });
            return specs;
        }

        if (item.image && typeof item.image === "string" && item.image.startsWith("http") && !item.image.includes("logo_igggsb")) {
            return [{ label: null, url: item.image }];
        }
        return [];
    }

    /** يرسم ختم دائري رسمي بألوان الماركة، مايل شوية زي الأختام الحقيقية */
    function drawOfficialStamp(ctx, cx, cy, radius) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-11 * (Math.PI / 180));
        ctx.globalAlpha = 0.92;

        ctx.beginPath();
        ctx.setLineDash([7, 5]);
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = BRAND_PINK;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(0, 0, radius - 12, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = BRAND_GOLD;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = BRAND_PINK;
        ctx.font = "700 22px Cairo, Arial, sans-serif";
        ctx.fillText("★", 0, -radius * 0.32);
        ctx.font = "800 17px Cairo, Arial, sans-serif";
        ctx.fillText("ختم معتمد", 0, -radius * 0.02);
        ctx.font = "700 13px Cairo, Arial, sans-serif";
        ctx.fillStyle = BRAND_GOLD;
        ctx.fillText("BoseSweets", 0, radius * 0.26);
        ctx.font = "500 11px Cairo, Arial, sans-serif";
        ctx.fillStyle = BRAND_PINK;
        ctx.fillText("حلويات بوسي", 0, radius * 0.5);

        ctx.restore();
    }

    /** يرسم صورة مصغرة بزوايا دائرية داخل مربع محدد، مع إطار رفيع بلون الماركة */
    function drawRoundedThumb(ctx, img, x, y, size, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + size, y, x + size, y + size, radius);
        ctx.arcTo(x + size, y + size, x, y + size, radius);
        ctx.arcTo(x, y + size, x, y, radius);
        ctx.arcTo(x, y, x + size, y, radius);
        ctx.closePath();
        ctx.clip();
        // نغطي المساحة بالكامل (cover) بدل تشويه الصورة
        const ratio = Math.max(size / img.width, size / img.height);
        const drawW = img.width * ratio, drawH = img.height * ratio;
        ctx.drawImage(img, x + (size - drawW) / 2, y + (size - drawH) / 2, drawW, drawH);
        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + size, y, x + size, y + size, radius);
        ctx.arcTo(x + size, y + size, x, y + size, radius);
        ctx.arcTo(x, y + size, x, y, radius);
        ctx.arcTo(x, y, x + size, y, radius);
        ctx.closePath();
        ctx.strokeStyle = "rgba(255,145,164,0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    /**
     * الدالة الرئيسية: بتاخد كائن الطلب (نفس الشكل المستخدم في buildBoseFormattedWhatsappInvoice)
     * وبيانات المتجر (logo/name) وترجع Promise<Blob> لصورة PNG جاهزة.
     */
    async function generateBoseInvoiceImageBlob(order, storeInfo) {
        storeInfo = storeInfo || {};
        try {
            if (document.fonts && document.fonts.load) {
                await Promise.all([
                    document.fonts.load("800 26px Cairo"),
                    document.fonts.load("700 15px Cairo"),
                    document.fonts.load("400 14px Cairo")
                ]);
            }
        } catch (e) { /* لو الخط اتأخر في التحميل، هيرسم بخط بديل بأمان */ }

        const measureCanvas = document.createElement("canvas");
        const measureCtx = measureCanvas.getContext("2d");
        const contentWidth = CANVAS_WIDTH - 80;
        const items = Array.isArray(order.items) ? order.items : [];

        const FONT_LABEL = "700 14px Cairo, Arial, sans-serif";
        const FONT_VALUE = "400 14px Cairo, Arial, sans-serif";
        const FONT_ITEM_TITLE = "800 17px Cairo, Arial, sans-serif";
        const FONT_FLAVOR = "700 14px Cairo, Arial, sans-serif";
        const FONT_DETAIL = "400 13px Cairo, Arial, sans-serif";
        const LINE_H = 23;
        const DETAIL_LINE_H = 20;
        const THUMB_SIZE = 68;
        const THUMB_GAP = 14;
        const REF_THUMB_SIZE = 84;

        // ---------- تمريرة القياس: نحسب ارتفاع كل صنف فعلياً قبل الرسم ----------
        const metaFields = [
            ["العميل: ", order.customerName || ""],
            ["رقم الاتصال: ", order.phone1 || ""],
            ["مسار الاستلام: ", order.deliveryMethod || ""],
            ["التفاصيل الجغرافية: ", order.address || ""],
            ["موعد الاستلام: ", `${order.scheduledDate || ""} الساعة ${formatTimeSafe(order.scheduledTime)}`]
        ];
        let metaHeight = 0;
        const metaWrapped = metaFields.map(([label, value]) => {
            measureCtx.font = FONT_LABEL;
            const labelWidth = measureCtx.measureText(label).width;
            const lines = wrapText(measureCtx, value, FONT_VALUE, contentWidth - labelWidth - 10);
            metaHeight += lines.length * LINE_H;
            return { label, lines };
        });

        // نحمّل كل صور المنتجات/المراجع المطلوبة قبل الرسم، عشان نعرف نحسب
        // ارتفاع كل بلوك بدقة قبل ما نبدأ نرسم فعلياً على الكانفاس.
        const itemThumbSpecs = items.map((item) => getItemThumbnailSpecs(item));
        const itemThumbImages = await Promise.all(
            itemThumbSpecs.map((specs) => Promise.all(specs.map((s) => loadImageSafe(
                window.optimizeBoseImageUrl ? window.optimizeBoseImageUrl(s.url, 200) : s.url
            ))))
        );

        let itemsHeight = 0;
        const itemsWrapped = items.map((item, idx) => {
            const detailLines = buildItemDetailLines(item);
            const wrappedDetails = [];
            detailLines.forEach((d) => {
                wrappedDetails.push(...wrapText(measureCtx, "•  " + d, FONT_DETAIL, contentWidth - 16));
            });
            const qtyLabel = `العدد المطلوب من ${item.title}: ×${item.quantity}`;
            const priceLabel = `سعر الوحدة: ${parseFloat(item.finalPrice || 0).toFixed(2)} EGP`;
            const titleLines = wrapText(measureCtx, `${idx + 1}. ${item.title}`, FONT_ITEM_TITLE, contentWidth - THUMB_SIZE - THUMB_GAP - 16);
            const flavorText = item.flavorName || "جاهز وفريش";
            const flavorLines = wrapText(measureCtx, flavorText, FONT_FLAVOR, contentWidth - THUMB_SIZE - THUMB_GAP - 16);

            const textBlockHeight = titleLines.length * 24 + flavorLines.length * 20 + 6 + 2 * DETAIL_LINE_H + wrappedDetails.length * DETAIL_LINE_H;
            const specs = itemThumbSpecs[idx];
            const images = itemThumbImages[idx];
            const hasMainThumb = specs.length > 0 && !specs[0].label; // صورة منتج عادية (بدون تسمية) فقط
            const mainThumbHeight = hasMainThumb ? THUMB_SIZE : 0;
            const refSpecs = hasMainThumb ? [] : specs; // مراجع التورت (بتسمية) بتترسم كصف منفصل تحت
            const refRowHeight = refSpecs.length > 0 ? (REF_THUMB_SIZE + 30 + 10) : 0;

            const blockHeight = 14 + Math.max(textBlockHeight, mainThumbHeight) + refRowHeight + 18;
            itemsHeight += blockHeight;
            return { item, idx, titleLines, flavorLines, qtyLabel, priceLabel, wrappedDetails, blockHeight, specs, images, hasMainThumb, refSpecs };
        });

        const notesLines = order.notes ? wrapText(measureCtx, "📝 ملاحظات: " + order.notes, FONT_VALUE, contentWidth) : [];

        const HEADER_HEIGHT = 210; // شعار + اسم المتجر + شارة رقم الطلب
        const META_BLOCK_TOP_PAD = 20;
        const SECTION_TITLE_H = 46;
        const TOTALS_BLOCK_H = (order.depositAmount !== undefined ? 150 : 70);
        const NOTES_H = notesLines.length ? notesLines.length * LINE_H + 20 : 0;
        const STAMP_FOOTER_H = 190;

        const totalHeight = HEADER_HEIGHT + META_BLOCK_TOP_PAD + metaHeight + 40 +
            SECTION_TITLE_H + itemsHeight + NOTES_H + TOTALS_BLOCK_H + STAMP_FOOTER_H;

        // ---------- إنشاء الكانفاس الفعلي بالحجم المحسوب بدقة ----------
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_WIDTH * RENDER_SCALE;
        canvas.height = totalHeight * RENDER_SCALE;
        const ctx = canvas.getContext("2d");
        ctx.scale(RENDER_SCALE, RENDER_SCALE);
        ctx.direction = "rtl";

        // خلفية بيضاء + إطار خفيف
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, CANVAS_WIDTH, totalHeight);
        ctx.strokeStyle = "rgba(255,145,164,0.35)";
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, CANVAS_WIDTH - 16, totalHeight - 16);

        const centerX = CANVAS_WIDTH / 2;
        let y = 54;

        const logoUrl = storeInfo.logo || BRAND_LOGO_FALLBACK;
        const logoImg = await loadImageSafe(logoUrl);
        if (logoImg) {
            const size = 68;
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, y, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(logoImg, centerX - size / 2, y - size / 2, size, size);
            ctx.restore();
            ctx.beginPath();
            ctx.arc(centerX, y, size / 2, 0, Math.PI * 2);
            ctx.strokeStyle = BRAND_PINK;
            ctx.lineWidth = 2;
            ctx.stroke();
            y += 48;
        }

        ctx.textAlign = "center";
        ctx.fillStyle = BRAND_BLACK;
        ctx.font = "800 27px Cairo, Arial, sans-serif";
        ctx.fillText(storeInfo.name || "حلويات بوسي", centerX, y);
        y += 22;
        ctx.font = "700 13px Cairo, Arial, sans-serif";
        ctx.fillStyle = BRAND_PINK;
        ctx.fillText("BoseSweets ✨ فاتورة حجز طلبية", centerX, y);
        y += 30;

        // 🏷️ [شارة رقم الطلب]: بارزة ومنفصلة عشان تتلاقط بسرعة في أي مراجعة -
        // بدل ما تكون سطر عادي وسط باقي بيانات العميل.
        const orderBadgeText = `رقم الطلب: ${order.orderId || "—"}`;
        ctx.font = "800 15px Cairo, Arial, sans-serif";
        const badgeTextWidth = ctx.measureText(orderBadgeText).width;
        const badgePadX = 18, badgeH = 34;
        const badgeW = badgeTextWidth + badgePadX * 2;
        const badgeX = centerX - badgeW / 2, badgeY = y - badgeH / 2 - 4;
        ctx.beginPath();
        ctx.moveTo(badgeX + badgeH / 2, badgeY);
        ctx.arcTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, badgeH / 2);
        ctx.arcTo(badgeX + badgeW, badgeY + badgeH, badgeX, badgeY + badgeH, badgeH / 2);
        ctx.arcTo(badgeX, badgeY + badgeH, badgeX, badgeY, badgeH / 2);
        ctx.arcTo(badgeX, badgeY, badgeX + badgeW, badgeY, badgeH / 2);
        ctx.closePath();
        ctx.fillStyle = BRAND_PINK;
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(orderBadgeText, centerX, badgeY + badgeH / 2 + 1);
        ctx.textBaseline = "alphabetic";
        y += 26;
        ctx.font = "400 12px Cairo, Arial, sans-serif";
        ctx.fillStyle = "#777777";
        ctx.fillText(order.date || "", centerX, y);
        y += 24;

        function drawDivider() {
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(40, y);
            ctx.lineTo(CANVAS_WIDTH - 40, y);
            ctx.strokeStyle = BRAND_GOLD;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
        }

        drawDivider();
        y += META_BLOCK_TOP_PAD;

        const rightX = CANVAS_WIDTH - 40;
        metaWrapped.forEach(({ label, lines }) => {
            ctx.textAlign = "right";
            ctx.font = FONT_LABEL;
            ctx.fillStyle = BRAND_PINK;
            ctx.fillText(label, rightX, y);
            const labelWidth = ctx.measureText(label).width;
            ctx.font = FONT_VALUE;
            ctx.fillStyle = BRAND_BLACK;
            lines.forEach((line, i) => {
                const lineX = i === 0 ? rightX - labelWidth - 8 : rightX;
                ctx.fillText(line, lineX, y);
                if (i < lines.length - 1) y += LINE_H;
            });
            y += LINE_H;
        });

        y += 8;
        drawDivider();
        y += 30;

        ctx.textAlign = "right";
        ctx.font = "800 17px Cairo, Arial, sans-serif";
        ctx.fillStyle = BRAND_BLACK;
        ctx.fillText("📦 تفاصيل الأصناف المطلوبة", rightX, y);
        y += 30;

        for (const entry of itemsWrapped) {
            const { titleLines, flavorLines, qtyLabel, priceLabel, wrappedDetails, blockHeight, images, hasMainThumb, refSpecs } = entry;
            const cardTop = y - 20;
            ctx.fillStyle = "rgba(255,145,164,0.06)";
            ctx.beginPath();
            const cardRadius = 10;
            const cardX = 30, cardW = CANVAS_WIDTH - 60;
            ctx.moveTo(cardX + cardRadius, cardTop);
            ctx.arcTo(cardX + cardW, cardTop, cardX + cardW, cardTop + blockHeight, cardRadius);
            ctx.arcTo(cardX + cardW, cardTop + blockHeight, cardX, cardTop + blockHeight, cardRadius);
            ctx.arcTo(cardX, cardTop + blockHeight, cardX, cardTop, cardRadius);
            ctx.arcTo(cardX, cardTop, cardX + cardW, cardTop, cardRadius);
            ctx.closePath();
            ctx.fill();

            // صورة المنتج الحقيقية (لو متاحة) - على يمين الكارت، بجانب العنوان
            let textRight = rightX;
            if (hasMainThumb && images[0]) {
                const thumbX = cardX + cardW - THUMB_SIZE - 14;
                const thumbY = cardTop + 14;
                drawRoundedThumb(ctx, images[0], thumbX, thumbY, THUMB_SIZE, 12);
                textRight = thumbX - THUMB_GAP;
            }

            ctx.textAlign = "right";
            ctx.font = FONT_ITEM_TITLE;
            ctx.fillStyle = BRAND_BLACK;
            titleLines.forEach((line) => { ctx.fillText(line, textRight, y); y += 24; });

            ctx.font = FONT_FLAVOR;
            ctx.fillStyle = BRAND_PINK;
            flavorLines.forEach((line) => { ctx.fillText(line, textRight, y); y += 20; });
            y += 6;

            ctx.font = "700 13px Cairo, Arial, sans-serif";
            ctx.fillStyle = "#555555";
            ctx.fillText(qtyLabel, textRight, y);
            y += DETAIL_LINE_H;
            ctx.fillStyle = BRAND_BLACK;
            ctx.font = FONT_DETAIL;
            ctx.fillText(priceLabel, textRight, y);
            y += DETAIL_LINE_H;

            ctx.font = FONT_DETAIL;
            ctx.fillStyle = "#444444";
            wrappedDetails.forEach((line) => { ctx.fillText(line, textRight - 4, y); y += DETAIL_LINE_H; });

            // مصغرات مرجعية للتورت المخصص (صورة الطباعة/التصميم) - صف منفصل تحت النص
            if (refSpecs.length > 0) {
                y += 8;
                let thumbX = cardX + cardW - 14 - REF_THUMB_SIZE;
                refSpecs.forEach((spec, i) => {
                    const img = images[i];
                    if (img) {
                        drawRoundedThumb(ctx, img, thumbX, y, REF_THUMB_SIZE, 12);
                        ctx.textAlign = "center";
                        ctx.font = "600 11px Cairo, Arial, sans-serif";
                        ctx.fillStyle = "#666666";
                        wrapText(measureCtx, spec.label, "600 11px Cairo, Arial, sans-serif", REF_THUMB_SIZE + 20).forEach((l, li) => {
                            ctx.fillText(l, thumbX + REF_THUMB_SIZE / 2, y + REF_THUMB_SIZE + 16 + li * 13);
                        });
                        thumbX -= REF_THUMB_SIZE + 16;
                    }
                });
                y += REF_THUMB_SIZE + 30;
            }

            y = cardTop + blockHeight + 18;
        }

        if (notesLines.length) {
            drawDivider();
            y += 24;
            ctx.textAlign = "right";
            ctx.font = FONT_VALUE;
            ctx.fillStyle = BRAND_BLACK;
            notesLines.forEach((line) => { ctx.fillText(line, rightX, y); y += LINE_H; });
        }

        y += 10;
        drawDivider();
        y += 34;

        ctx.textAlign = "center";
        ctx.font = "800 20px Cairo, Arial, sans-serif";
        ctx.fillStyle = BRAND_PINK;
        ctx.fillText(`👑 المجموع المالي النهائي: ${order.grandTotal} EGP 👑`, centerX, y);
        y += 30;

        if (order.depositAmount !== undefined) {
            ctx.font = "700 14px Cairo, Arial, sans-serif";
            ctx.fillStyle = BRAND_BLACK;
            ctx.fillText(`المطلوب دفعه الآن: ${order.depositAmount} EGP`, centerX, y);
            y += 22;
            if (order.remainingAmount > 0) {
                ctx.font = "400 13px Cairo, Arial, sans-serif";
                ctx.fillStyle = "#555555";
                ctx.fillText(`الباقي عند الاستلام: ${order.remainingAmount} EGP`, centerX, y);
                y += 22;
            }
            ctx.font = "600 13px Cairo, Arial, sans-serif";
            ctx.fillStyle = BRAND_BLACK;
            ctx.fillText(`الدفع كاش أو InstaPay على: ${order.paymentPhone || ""}`, centerX, y);
            y += 30;
        }

        // الختم الرسمي
        drawOfficialStamp(ctx, CANVAS_WIDTH - 110, y + 70, 78);

        ctx.textAlign = "center";
        ctx.font = "700 14px Cairo, Arial, sans-serif";
        ctx.fillStyle = BRAND_BLACK;
        ctx.fillText("🌸 شكراً لثقتكم بينا", centerX, y + 60);
        ctx.font = "400 12px Cairo, Arial, sans-serif";
        ctx.fillStyle = "#777777";
        ctx.fillText(storeInfo.phone || "01097238441", centerX, y + 84);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
        });
    }

    window.generateBoseInvoiceImageBlob = generateBoseInvoiceImageBlob;

    /**
     * يحاول إرسال الفاتورة كصورة + نص مباشرة لواتساب في ضغطة واحدة عن طريق
     * Web Share API (بيشتغل على أغلب متصفحات الموبايل الحديثة). لو مش مدعومة،
     * بينزّل الصورة تلقائياً ويرجّع false عشان الكود اللي بينادي الدالة يفتح
     * رابط واتساب النصي العادي كبديل ويوجّه العميل يرفق الصورة بنفسه.
     */
    async function shareOrDownloadBoseInvoiceImage(blob, fileName, shareText) {
        if (!blob) return false;
        const file = new File([blob], fileName || "bose-invoice.png", { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: "فاتورة حلويات بوسي",
                    text: shareText || ""
                });
                return true;
            } catch (e) {
                // العميل لغى المشاركة أو حصل خطأ - هنكمل بالتنزيل كخطة بديلة
            }
        }

        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName || "bose-invoice.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 4000);
        } catch (e) { /* تجاهل بأمان لو التنزيل فشل */ }
        return false;
    }

    window.shareOrDownloadBoseInvoiceImage = shareOrDownloadBoseInvoiceImage;
})();
