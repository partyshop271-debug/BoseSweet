/**
 * 🧾 مولّد صورة الفاتورة الاحترافية - حلويات بوسي (BoseSweets)
 * ==========================================================
 * الهدف: بناء صورة PNG منسّقة واحترافية (بشعار الماركة وألوانها وختم رسمي)
 * من بيانات الطلب نفسها اللي بتتبني منها رسالة الواتساب النصية، عشان تتبعت
 * للعميل كصورة فاتورة حقيقية بدل نص عادي.
 *
 * ⚠️ ملاحظة تقنية مهمة (حد تقني حقيقي، مش تقصير في الكود):
 * روابط واتساب (wa.me / api.whatsapp.com) بتفتح تطبيق واتساب مع نص جاهز
 * بس، وما فيهاش أي طريقة برمجية (من متصفح عادي بدون سيرفر/باقة واتساب
 * الرسمية المدفوعة) لإرفاق صورة تلقائياً جوه نفس الرسالة من غير أي لمسة
 * من العميل - ده قيد من واتساب نفسه مش قصور في الموقع. الحل الأقرب فعلياً
 * لإرسال "تلقائي" هو:
 *   1) على الموبايل (لو المتصفح بيدعم Web Share API بالملفات): بنستخدم
 *      navigator.share() فبتفتح شاشة المشاركة الحقيقية بتاعة الموبايل ومنها
 *      العميل بيدوس على واتساب مرة واحدة وتتبعت الصورة+النص مباشرة - أقرب حاجة
 *      لإرسال تلقائي ممكنة فعلياً بدون سيرفر.
 *   2) لو المتصفح مش بيدعمها (أغلب متصفحات الديسكتوب): بننزّل الصورة تلقائياً
 *      على جهاز العميل ونفتح واتساب بنفس النص المنسق، والعميل بيرفق الصورة
 *      بضغطة واحدة من مرفقاته.
 */

(function () {
    const BRAND_PINK = "#FF91A4";
    const BRAND_BLACK = "#111111";
    const BRAND_GOLD = "#D4AF37";
    const BRAND_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";
    const CANVAS_WIDTH = 720;
    const RENDER_SCALE = 2; // دقة أعلى (Retina) للصورة النهائية

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

    function formatTimeSafe(time24) {
        if (typeof window.formatBoseTimeToEgyptian12Hour === "function") {
            return window.formatBoseTimeToEgyptian12Hour(time24);
        }
        return time24 || "";
    }

    function shapeNameSafe(shape) {
        if (typeof window.getBoseArabicShapeName === "function") {
            return window.getBoseArabicShapeName(shape);
        }
        const map = { circle: "دائري", heart: "قلب", square: "مربع", rectangle: "مستطيل" };
        return map[shape] || shape;
    }

    /**
     * يبني قائمة "أسطر" تفاصيل مخصصة لكل صنف (نفس منطق فاتورة الواتساب النصية)
     * كل سطر عبارة عن {label, value} هيتعرض كنقطة تفصيلية تحت اسم الصنف.
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
        const FONT_ITEM_TITLE = "800 16px Cairo, Arial, sans-serif";
        const FONT_DETAIL = "400 13px Cairo, Arial, sans-serif";
        const LINE_H = 23;
        const DETAIL_LINE_H = 20;

        // ---------- تمريرة القياس: نحسب ارتفاع كل صنف فعلياً قبل الرسم ----------
        const metaFields = [
            ["رقم المعاملة: ", order.orderId || ""],
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

        let itemsHeight = 0;
        const itemsWrapped = items.map((item) => {
            const detailLines = buildItemDetailLines(item);
            const wrappedDetails = [];
            detailLines.forEach((d) => {
                wrappedDetails.push(...wrapText(measureCtx, "•  " + d, FONT_DETAIL, contentWidth - 16));
            });
            const qtyLabel = `العدد المطلوب من ${item.title}: ×${item.quantity}`;
            const priceLabel = `سعر الوحدة: ${parseFloat(item.finalPrice || 0).toFixed(2)} EGP`;
            const titleLines = wrapText(measureCtx, `${item.title}${item.flavorName ? " — " + item.flavorName : ""}`, FONT_ITEM_TITLE, contentWidth - 16);
            const blockHeight = 14 + titleLines.length * 22 + 2 * DETAIL_LINE_H + wrappedDetails.length * DETAIL_LINE_H + 16;
            itemsHeight += blockHeight;
            return { item, titleLines, qtyLabel, priceLabel, wrappedDetails, blockHeight };
        });

        const notesLines = order.notes ? wrapText(measureCtx, "📝 ملاحظات: " + order.notes, FONT_VALUE, contentWidth) : [];

        const HEADER_HEIGHT = 175;
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
        let y = 50;

        const logoUrl = storeInfo.logo || BRAND_LOGO_FALLBACK;
        const logoImg = await loadImageSafe(logoUrl);
        if (logoImg) {
            const size = 64;
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
            y += 46;
        }

        ctx.textAlign = "center";
        ctx.fillStyle = BRAND_BLACK;
        ctx.font = "800 26px Cairo, Arial, sans-serif";
        ctx.fillText(storeInfo.name || "حلويات بوسي", centerX, y);
        y += 24;
        ctx.font = "700 13px Cairo, Arial, sans-serif";
        ctx.fillStyle = BRAND_PINK;
        ctx.fillText("BoseSweets ✨ فاتورة حجز طلبية فاخرة", centerX, y);
        y += 30;

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

        itemsWrapped.forEach(({ titleLines, qtyLabel, priceLabel, wrappedDetails, blockHeight }) => {
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

            ctx.textAlign = "right";
            ctx.font = FONT_ITEM_TITLE;
            ctx.fillStyle = BRAND_BLACK;
            titleLines.forEach((line) => { ctx.fillText(line, rightX, y); y += 22; });

            ctx.font = "700 13px Cairo, Arial, sans-serif";
            ctx.fillStyle = BRAND_PINK;
            ctx.fillText(qtyLabel, rightX, y);
            y += DETAIL_LINE_H;
            ctx.fillStyle = BRAND_BLACK;
            ctx.font = FONT_DETAIL;
            ctx.fillText(priceLabel, rightX, y);
            y += DETAIL_LINE_H;

            ctx.font = FONT_DETAIL;
            ctx.fillStyle = "#444444";
            wrappedDetails.forEach((line) => { ctx.fillText(line, rightX - 4, y); y += DETAIL_LINE_H; });

            y += 16;
        });

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
        ctx.fillText("🌸 شكراً لثقتكم الفاخرة بينا", centerX, y + 60);
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
