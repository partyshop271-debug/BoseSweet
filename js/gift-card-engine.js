/**
 * =====================================================================
 * 🎁 محرك صفحة بطاقات الهدايا - حلويات بوسي (gift-card-builder.html)
 * =====================================================================
 * نفس فلسفة cake-engine.js / flower-engine.js بالظبط: بنبني عنصر سلة
 * حقيقي عبر window.createCartItem(product, options, quantity) مرتبط
 * بمنتج بطاقة الهدية الفعلي الموجود في قاعدة البيانات (product.isGiftCard
 * === true)، وبنضيف بيانات التخصيص (تصميم/مناسبة/مُهدى إليه/رسالة) كـ
 * customDetails بس - نفس مفاتيح options اللي كان عليها gift-card-engine.js
 * القديم بالظبط (giftCardAmount/giftDesignName/giftOccasionLabel/...)
 * عشان customDetails في core-engine.js تفضل شغالة من غير أي تعديل هناك.
 *
 * 🎁 [منتج رقمي بالكامل]: النظام الحالي (cart-engine.js/checkout.html)
 * بيعامل أي سلة بطاقات هدايا كمنتج رقمي 100% - مفيش شحن ولا عنوان ولا
 * موعد استلام (راجع cartIsDigitalOnly في cart-engine.js). فبالتالي مفيش
 * خطوة "طريقة الاستلام" (رقمية/مطبوعة) هنا لأن مفيش أي دعم فعلي للتسليم
 * المطبوع في الـcheckout/fulfillment - إضافتها كانت هتبقى وعد كدب للعميلة.
 *
 * ⚠️ [حد أدنى/أقصى القيمة]: القيم الافتراضية هنا (150 / 5000 جنيه) بتتباع
 * فوراً بقيم المنتج الحقيقية من قاعدة البيانات (options.minAmount/maxAmount)
 * لو موجودة، عشان أي تحقق سيرفري (create_order_with_items) يفضل متطابق
 * تماماً مع الواجهة.
 *
 * ⚠️ [جدولة الإرسال]: مفيش أي نظام أتمتة سيرفري فعلي بيبعت البطاقة تلقائياً
 * في ميعاد محدد - الموعد المختار بيتسجل كملحوظة على الطلب (بيظهر في فاتورة
 * الواتساب) وفريق المتجر بيراعيه يدوياً، فالنص هنا بيقول كده صراحة بدل ما
 * يوهم العميلة بأتمتة كاملة غير موجودة.
 */
(function () {
    "use strict";

    const FALLBACK_MIN = 150;
    const FALLBACK_MAX = 5000;
    const AMOUNT_CHIPS = [300, 500, 750, 1000];
    const MESSAGE_MAX_LEN = 150;
    const BRAND_LOGO = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";

    const DESIGNS = [
        { id: "love", className: "gcb-card--love", name: "أحبك", icon: "fa-solid fa-heart",
          canvas: { bgFrom: "#FFF0F3", bgTo: "#FFC5D6", accent: "#E0577B", text: "#4A1826" } },
        { id: "birthday", className: "gcb-card--birthday", name: "عيد ميلاد سعيد", icon: "fa-solid fa-cake-candles",
          canvas: { bgFrom: "#FFF7E9", bgTo: "#FFD79A", accent: "#C9972E", text: "#4A2E0B" } },
        { id: "elegant", className: "gcb-card--elegant", name: "بطاقة أنيقة", icon: "fa-solid fa-gem",
          canvas: { bgFrom: "#FDFBF8", bgTo: "#F3E9DA", accent: "#C9972E", text: "#111111" } },
        { id: "brand", className: "gcb-card--brand", name: "هدية من حلويات بوسي", icon: "fa-solid fa-heart-circle-check",
          canvas: { bgFrom: "#FFFFFF", bgTo: "#FFE9EE", accent: "#FF91A4", text: "#111111" } }
    ];

    const OCCASIONS = [
        { id: "", label: "بدون مناسبة", icon: "fa-solid fa-gift" },
        { id: "birthday", label: "عيد ميلاد", icon: "fa-solid fa-cake-candles" },
        { id: "valentine", label: "عيد حب", icon: "fa-solid fa-heart" },
        { id: "graduation", label: "تخرج", icon: "fa-solid fa-graduation-cap" },
        { id: "engagement", label: "خطوبة", icon: "fa-solid fa-ring" },
        { id: "special", label: "مناسبة خاصة", icon: "fa-solid fa-star" },
        { id: "other", label: "أخرى", icon: "fa-solid fa-ellipsis" }
    ];

    const esc = (s) => (window.escapeBoseHTML ? window.escapeBoseHTML(String(s || "")) : String(s || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));

    const state = {
        designId: DESIGNS[0].id,
        occasionId: "",
        amount: FALLBACK_MIN,
        recipientName: "",
        recipientPhone: "",
        senderName: "",
        message: "",
        sendOption: "now",
        scheduledDate: "",
        min: FALLBACK_MIN,
        max: FALLBACK_MAX
    };

    let realProduct = null;

    function getDesign(id) { return DESIGNS.find((d) => d.id === id) || DESIGNS[0]; }
    function getOccasion(id) { return OCCASIONS.find((o) => o.id === id) || OCCASIONS[0]; }
    function fmtAmount(n) { return `${Math.round(n || 0).toLocaleString("ar-EG")} جنيه`; }

    /* ============================ رسم المعاينة الحية ============================ */
    function renderPreview() {
        const design = getDesign(state.designId);
        const card = document.getElementById("gcbCard");
        if (!card) return;

        DESIGNS.forEach((d) => card.classList.remove(d.className));
        card.classList.add(design.className);

        const iconEl = document.getElementById("gcbCardIcon");
        if (iconEl) iconEl.innerHTML = `<i class="${design.icon}" aria-hidden="true"></i>`;

        const titleEl = document.getElementById("gcbCardTitle");
        if (titleEl) titleEl.textContent = design.name;

        const toEl = document.getElementById("gcbCardTo");
        if (toEl) toEl.textContent = state.recipientName.trim() || "اسم المُهدى إليه";

        const fromEl = document.getElementById("gcbCardFrom");
        if (fromEl) fromEl.textContent = state.senderName.trim() || "اسمك";

        const msgEl = document.getElementById("gcbCardMessage");
        if (msgEl) {
            const trimmed = state.message.trim();
            msgEl.textContent = trimmed;
            msgEl.hidden = !trimmed;
        }

        const occEl = document.getElementById("gcbCardOccasion");
        if (occEl) {
            const occ = getOccasion(state.occasionId);
            if (occ.id) {
                occEl.textContent = occ.label;
                occEl.hidden = false;
            } else {
                occEl.hidden = true;
            }
        }

        const amountEl = document.getElementById("gcbCardAmount");
        if (amountEl) amountEl.textContent = Math.round(state.amount || 0).toLocaleString("ar-EG");

        const summaryAmount = document.getElementById("gcbSummaryAmount");
        const summaryTotal = document.getElementById("gcbSummaryTotal");
        if (summaryAmount) summaryAmount.textContent = fmtAmount(state.amount);
        if (summaryTotal) summaryTotal.textContent = fmtAmount(state.amount);

        const mobileBarAmount = document.getElementById("gcbMobileBarAmount");
        if (mobileBarAmount) mobileBarAmount.textContent = fmtAmount(state.amount);
    }

    /* ============================ شيبس القيمة ============================ */
    function renderAmountChips() {
        const root = document.getElementById("gcbAmountChips");
        const hint = document.getElementById("gcbAmountHint");
        const customWrap = document.getElementById("gcbAmountCustomWrap");
        const customInput = document.getElementById("gcbAmountCustomInput");
        if (!root) return;

        if (hint) hint.textContent = `من ${state.min} لحد ${state.max} جنيه - صالحة لمدة سنة كاملة من تاريخ الشراء`;

        const validChips = AMOUNT_CHIPS.filter((v) => v >= state.min && v <= state.max);
        const chipsHTML = validChips.map((v) => `
            <button type="button" class="gcb-chip" data-amount="${v}" aria-pressed="false">${v} ج.م</button>
        `).join("");
        root.innerHTML = chipsHTML + `<button type="button" class="gcb-chip" id="gcbAmountOtherBtn" aria-pressed="false">قيمة أخرى</button>`;

        const selectChip = (selectedBtn) => {
            root.querySelectorAll(".gcb-chip").forEach((b) => {
                b.classList.remove("is-selected");
                b.setAttribute("aria-pressed", "false");
            });
            selectedBtn.classList.add("is-selected");
            selectedBtn.setAttribute("aria-pressed", "true");
        };

        const isChipAmount = validChips.includes(state.amount);
        root.querySelectorAll(".gcb-chip[data-amount]").forEach((btn) => {
            if (parseInt(btn.dataset.amount, 10) === state.amount) selectChip(btn);
            btn.addEventListener("click", () => {
                state.amount = parseInt(btn.dataset.amount, 10);
                if (customWrap) customWrap.hidden = true;
                selectChip(btn);
                renderPreview();
            });
        });

        const otherBtn = document.getElementById("gcbAmountOtherBtn");
        if (otherBtn) {
            if (!isChipAmount) selectChip(otherBtn);
            otherBtn.addEventListener("click", () => {
                if (customWrap) { customWrap.hidden = false; }
                if (customInput) customInput.focus();
                selectChip(otherBtn);
            });
        }
        if (customWrap && !isChipAmount) customWrap.hidden = false;

        if (customInput) {
            customInput.min = String(state.min);
            customInput.max = String(state.max);
            if (!isChipAmount) customInput.value = String(state.amount);
            customInput.addEventListener("input", () => {
                const v = parseInt(customInput.value, 10);
                state.amount = isNaN(v) ? state.min : v;
                renderPreview();
            });
            customInput.addEventListener("blur", () => {
                let v = parseInt(customInput.value, 10) || state.min;
                v = Math.min(Math.max(v, state.min), state.max);
                customInput.value = String(v);
                state.amount = v;
                renderPreview();
            });
        }
    }

    /* ============================ شيبس المناسبة ============================ */
    function renderOccasionChips() {
        const root = document.getElementById("gcbOccasionChips");
        if (!root) return;
        root.innerHTML = OCCASIONS.map((o) => `
            <button type="button" class="gcb-occasion-chip${o.id === state.occasionId ? " is-selected" : ""}" data-occasion="${o.id}" aria-pressed="${o.id === state.occasionId ? "true" : "false"}">
                <i class="${o.icon}" aria-hidden="true"></i><span>${esc(o.label)}</span>
            </button>
        `).join("");
        root.querySelectorAll(".gcb-occasion-chip").forEach((btn) => {
            btn.addEventListener("click", () => {
                state.occasionId = btn.dataset.occasion;
                root.querySelectorAll(".gcb-occasion-chip").forEach((b) => {
                    b.classList.remove("is-selected");
                    b.setAttribute("aria-pressed", "false");
                });
                btn.classList.add("is-selected");
                btn.setAttribute("aria-pressed", "true");
                renderPreview();
            });
        });
    }

    /* ============================ معرض التصاميم ============================ */
    function renderDesignGallery() {
        const root = document.getElementById("gcbDesignGallery");
        if (!root) return;
        root.innerHTML = DESIGNS.map((d) => `
            <button type="button" class="gcb-design-thumb ${d.className}${d.id === state.designId ? " is-selected" : ""}" data-design="${d.id}" aria-pressed="${d.id === state.designId ? "true" : "false"}">
                <span class="gcb-thumb-check"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
                <div class="gcb-card-pattern" aria-hidden="true"></div>
                <i class="${d.icon}" aria-hidden="true"></i>
                <span>${esc(d.name)}</span>
            </button>
        `).join("");
        root.querySelectorAll(".gcb-design-thumb").forEach((btn) => {
            btn.addEventListener("click", () => {
                state.designId = btn.dataset.design;
                root.querySelectorAll(".gcb-design-thumb").forEach((b) => {
                    b.classList.remove("is-selected");
                    b.setAttribute("aria-pressed", "false");
                });
                btn.classList.add("is-selected");
                btn.setAttribute("aria-pressed", "true");
                renderPreview();
            });
        });
    }

    /* ============================ حقول تفاصيل الهدية + Validation ============================ */
    function setFieldError(fieldId, errorId, message) {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(errorId);
        if (error) error.textContent = message || "";
        if (field) field.classList.toggle("has-error", !!message);
    }

    function bindGiftDetailsForm() {
        const recipientInput = document.getElementById("gcbRecipient");
        const recipientPhoneInput = document.getElementById("gcbRecipientPhone");
        const senderInput = document.getElementById("gcbSender");
        const messageInput = document.getElementById("gcbMessage");
        const counter = document.getElementById("gcbMessageCounter");

        if (recipientInput) {
            recipientInput.addEventListener("input", () => {
                state.recipientName = recipientInput.value;
                if (recipientInput.value.trim()) setFieldError("gcbRecipientField", "gcbRecipientError", "");
                renderPreview();
            });
        }
        if (recipientPhoneInput) {
            recipientPhoneInput.addEventListener("input", () => {
                state.recipientPhone = recipientPhoneInput.value;
                setFieldError("gcbRecipientPhoneField", "gcbRecipientPhoneError", "");
            });
            recipientPhoneInput.addEventListener("blur", () => {
                const raw = recipientPhoneInput.value.trim();
                if (!raw) return; // اختياري - فاضي مسموح
                const isValid = typeof window.validateBosePhoneNumber === "function"
                    ? window.validateBosePhoneNumber(raw, true)
                    : /^01[0125][0-9]{8}$/.test(raw.replace(/[^\d]/g, ""));
                if (!isValid) {
                    setFieldError("gcbRecipientPhoneField", "gcbRecipientPhoneError", "رقم واتساب مصري غير صحيح - سيبيه فاضي لو مش متأكدة");
                }
            });
        }
        if (senderInput) {
            senderInput.addEventListener("input", () => {
                state.senderName = senderInput.value;
                if (senderInput.value.trim()) setFieldError("gcbSenderField", "gcbSenderError", "");
                renderPreview();
            });
        }
        if (messageInput) {
            messageInput.maxLength = MESSAGE_MAX_LEN;
            messageInput.addEventListener("input", () => {
                state.message = messageInput.value;
                if (counter) counter.textContent = String(messageInput.value.length);
                renderPreview();
            });
        }
    }

    /* ============================ موعد الإرسال ============================ */
    function bindSendOptionToggle() {
        const radios = document.querySelectorAll('input[name="gcbSend"]');
        const scheduleBox = document.getElementById("gcbScheduleBox");
        const dateInput = document.getElementById("gcbScheduleDate");

        if (dateInput) {
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            dateInput.min = tomorrow.toISOString().slice(0, 16);
        }
        radios.forEach((r) => {
            r.addEventListener("change", () => {
                state.sendOption = r.value;
                if (scheduleBox) scheduleBox.hidden = r.value !== "schedule";
            });
        });
        if (dateInput) dateInput.addEventListener("change", () => { state.scheduledDate = dateInput.value; });
    }

    /* ============================ توليد صورة PNG للبطاقة ============================ */
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

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight, font) {
        ctx.font = font;
        const words = text.split(" ");
        let line = "";
        let curY = y;
        const lines = [];
        words.forEach((word) => {
            const testLine = line + word + " ";
            if (ctx.measureText(testLine).width > maxWidth && line !== "") {
                lines.push(line);
                line = word + " ";
            } else {
                line = testLine;
            }
        });
        lines.push(line);
        lines.slice(0, 3).forEach((l) => { ctx.fillText(l.trim(), x, curY); curY += lineHeight; });
    }

    async function buildGiftCardCanvas() {
        const design = getDesign(state.designId);
        const c = design.canvas;
        const W = 900, H = 540, SCALE = 2;
        const canvas = document.createElement("canvas");
        canvas.width = W * SCALE;
        canvas.height = H * SCALE;
        const ctx = canvas.getContext("2d");
        ctx.scale(SCALE, SCALE);

        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, c.bgFrom);
        grad.addColorStop(1, c.bgTo);
        ctx.fillStyle = grad;
        roundRect(ctx, 0, 0, W, H, 28);
        ctx.fill();

        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 3;
        roundRect(ctx, 6, 6, W - 12, H - 12, 24);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.direction = "rtl";
        ctx.fillStyle = c.text;

        const logo = await loadImageSafe(BRAND_LOGO);
        if (logo) {
            const logoSize = 52;
            ctx.drawImage(logo, W / 2 - logoSize / 2, 34, logoSize, logoSize);
        }

        ctx.font = "700 30px Cairo, sans-serif";
        ctx.fillText(design.name, W / 2, 132);

        ctx.font = "600 20px Cairo, sans-serif";
        ctx.fillText(`إلى: ${state.recipientName.trim() || "اسم المُهدى إليه"}`, W / 2, 190);

        if (state.message.trim()) {
            wrapText(ctx, `"${state.message.trim()}"`, W / 2, 250, W - 160, 30, "500 17px Cairo, sans-serif");
        }

        ctx.font = "600 20px Cairo, sans-serif";
        ctx.fillText(`من: ${state.senderName.trim() || "اسمك"}`, W / 2, H - 110);

        ctx.font = "800 34px Cairo, sans-serif";
        ctx.fillStyle = c.accent;
        ctx.fillText(`${Math.round(state.amount)} جنيه`, W / 2, H - 55);

        return canvas;
    }

    async function downloadPreviewImage() {
        const btn = document.getElementById("gcbDownloadBtn");
        if (btn) { btn.disabled = true; btn.style.opacity = "0.7"; }
        try {
            const canvas = await buildGiftCardCanvas();
            const link = document.createElement("a");
            link.download = "bose-gift-card-preview.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        } finally {
            if (btn) { btn.disabled = false; btn.style.opacity = "1"; }
        }
    }

    async function shareGiftCardImage() {
        try {
            const canvas = await buildGiftCardCanvas();
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], "bose-gift-card.png", { type: "image/png" });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: "بطاقة هدية من حلويات بوسي" });
                } else if (typeof window.showBoseToast === "function") {
                    window.showBoseToast("المشاركة المباشرة مش متاحة على المتصفح ده - جربي تحميل المعاينة بدل كده 🌸");
                }
            }, "image/png");
        } catch (e) {
            console.warn("تعذرت مشاركة المعاينة:", e);
        }
    }

    /* ============================ الأسئلة الشائعة (من نفس بيانات المنتج) ============================ */
    function escFaq(s) {
        return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function renderFaqSection(faqs) {
        const section = document.getElementById("bose-gift-card-faq-section");
        const list = document.getElementById("bose-gift-card-faq-list");
        if (!section || !list) return;

        const validFaqs = (faqs || []).filter((f) => f.q && f.a);
        if (validFaqs.length === 0) {
            section.style.display = "none";
            const old = document.getElementById("bose-gift-card-faq-structured-data");
            if (old) old.remove();
            return;
        }

        list.innerHTML = validFaqs.map((f, idx) => `
            <details class="gcb-faq-item" ${idx === 0 ? "open" : ""}>
                <summary>${escFaq(f.q)}</summary>
                <p>${escFaq(f.a)}</p>
            </details>
        `).join("");
        section.style.display = "block";

        let script = document.getElementById("bose-gift-card-faq-structured-data");
        if (!script) {
            script = document.createElement("script");
            script.type = "application/ld+json";
            script.id = "bose-gift-card-faq-structured-data";
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": validFaqs.map((f) => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": { "@type": "Answer", "text": f.a }
            }))
        });
    }

    /* ============================ Product/Offer/AggregateRating schema.org ============================ */
    async function injectGiftCardStructuredData() {
        if (!realProduct) return;
        const storeName = (window.BoseStoreData && window.BoseStoreData.store && window.BoseStoreData.store.name) || "حلويات بوسي";
        const currency = (window.BoseStoreData && window.BoseStoreData.store && window.BoseStoreData.store.currency) || "EGP";

        const schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": realProduct.title || "بطاقة هدية من حلويات بوسي",
            "image": [BRAND_LOGO],
            "description": "بطاقة هدية رقمية بقيمة تختارينها بنفسك، تقدري تخصصيها باسم ورسالة وتصميم قبل ما توصل لمن تحبين.",
            "brand": { "@type": "Brand", "name": storeName },
            "offers": {
                "@type": "Offer",
                "url": window.location.href.split("#")[0],
                "priceCurrency": currency,
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "minPrice": state.min,
                    "maxPrice": state.max,
                    "priceCurrency": currency
                },
                "availability": "https://schema.org/InStock"
            }
        };

        try {
            if (window.BoseSupabase && typeof window.BoseSupabase.fetchApprovedReviews === "function") {
                const reviews = await window.BoseSupabase.fetchApprovedReviews("bose-gift-card");
                const rated = (reviews || []).filter((r) => Number(r.rating) > 0);
                if (rated.length) {
                    const avg = rated.reduce((s, r) => s + Number(r.rating), 0) / rated.length;
                    schema.aggregateRating = {
                        "@type": "AggregateRating",
                        "ratingValue": avg.toFixed(1),
                        "reviewCount": rated.length
                    };
                }
            }
        } catch (e) {
            // تجاهل بصمت - الصفحة تفضل شغالة حتى لو فشل جلب التقييمات
        }

        let script = document.getElementById("bose-gift-card-structured-data");
        if (!script) {
            script = document.createElement("script");
            script.type = "application/ld+json";
            script.id = "bose-gift-card-structured-data";
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(schema);
    }

    /* ============================ إضافة للسلة ============================ */
    function scheduledLabel() {
        if (state.sendOption !== "schedule" || !state.scheduledDate) return "";
        try {
            const d = new Date(state.scheduledDate);
            return d.toLocaleString("ar-EG", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch (e) { return state.scheduledDate; }
    }

    function validateForm() {
        let firstInvalidEl = null;
        setFieldError("gcbRecipientField", "gcbRecipientError", "");
        setFieldError("gcbSenderField", "gcbSenderError", "");
        setFieldError("gcbRecipientPhoneField", "gcbRecipientPhoneError", "");

        if (!state.recipientName.trim()) {
            setFieldError("gcbRecipientField", "gcbRecipientError", "اكتبي اسم اللي هتديهالها البطاقة");
            firstInvalidEl = firstInvalidEl || document.getElementById("gcbRecipient");
        }
        const phoneRaw = state.recipientPhone.trim();
        if (phoneRaw) {
            const isValid = typeof window.validateBosePhoneNumber === "function"
                ? window.validateBosePhoneNumber(phoneRaw, true)
                : /^01[0125][0-9]{8}$/.test(phoneRaw.replace(/[^\d]/g, ""));
            if (!isValid) {
                setFieldError("gcbRecipientPhoneField", "gcbRecipientPhoneError", "رقم واتساب مصري غير صحيح - سيبيه فاضي لو مش متأكدة");
                firstInvalidEl = firstInvalidEl || document.getElementById("gcbRecipientPhone");
            }
        }
        if (!state.senderName.trim()) {
            setFieldError("gcbSenderField", "gcbSenderError", "اكتبي اسمك عشان صاحب البطاقة يعرف إنها منك");
            firstInvalidEl = firstInvalidEl || document.getElementById("gcbSender");
        }
        if (state.amount < state.min || state.amount > state.max) {
            firstInvalidEl = firstInvalidEl || document.getElementById("gcbAmountCustomInput");
            if (typeof window.showBoseToast === "function") {
                window.showBoseToast(`القيمة لازم تكون بين ${state.min} و ${state.max} جنيه`);
            }
        }
        if (state.sendOption === "schedule" && !state.scheduledDate) {
            firstInvalidEl = firstInvalidEl || document.getElementById("gcbScheduleDate");
            if (typeof window.showBoseToast === "function") {
                window.showBoseToast("حددي موعد الإرسال أو اختاري إرسال فوري");
            }
        }
        return firstInvalidEl;
    }

    function handleAddToCart() {
        const firstInvalidEl = validateForm();
        if (firstInvalidEl) {
            firstInvalidEl.focus({ preventScroll: false });
            firstInvalidEl.scrollIntoView({ behavior: "smooth", block: "center" });
            [document.getElementById("gcbAddToCart"), document.getElementById("gcbAddToCartMobile")].forEach((b) => {
                if (!b) return;
                b.classList.remove("is-shaking");
                void b.offsetWidth;
                b.classList.add("is-shaking");
            });
            return;
        }
        if (!realProduct) {
            if (typeof window.showBoseToast === "function") {
                window.showBoseToast("تعذر تحميل بيانات بطاقة الهدية من المتجر حالياً - جربي تحدّثي الصفحة.");
            }
            return;
        }
        if (typeof window.createCartItem !== "function") return;

        const design = getDesign(state.designId);
        const occasion = getOccasion(state.occasionId);
        const sanitizedPhone = state.recipientPhone.trim()
            ? (typeof window.sanitizeBosePhoneNumber === "function" ? window.sanitizeBosePhoneNumber(state.recipientPhone) : state.recipientPhone.trim())
            : "";
        const options = {
            giftCardAmount: state.amount,
            giftDesignName: design.name,
            designThemeId: design.id,
            giftOccasionLabel: state.occasionId ? occasion.label : "",
            recipientName: state.recipientName.trim(),
            recipientPhone: sanitizedPhone,
            senderName: state.senderName.trim(),
            giftMessage: state.message.trim(),
            giftSendOption: state.sendOption,
            giftScheduledSendAtLabel: scheduledLabel(),
            giftScheduledSendAtISO: state.sendOption === "schedule" ? state.scheduledDate : ""
        };

        const cartItem = window.createCartItem(realProduct, options, 1);
        if (!cartItem) return;

        let cartArr = [];
        try {
            const raw = localStorage.getItem("bose_cart");
            cartArr = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(cartArr)) cartArr = [];
        } catch (e) { cartArr = []; }

        // كل بطاقة هدية مخصصة سطر منفصل دايماً في السلة - مفيش أي دمج مع بطاقة
        // تانية حتى لو نفس القيمة، لأن كل واحدة ليها مُهدى إليه ورسالة مختلفة.
        cartArr.push(cartItem);
        localStorage.setItem("bose_cart", JSON.stringify(cartArr));

        if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
        if (typeof window.fireBoseCommerceEvent === "function") {
            window.fireBoseCommerceEvent("add_to_cart", {
                value: state.amount,
                currency: window.BoseStoreData?.store?.currency || "EGP",
                contentId: realProduct.id || realProduct.slug,
                contentName: realProduct.title || "بطاقة هدية",
                quantity: 1
            });
        }
        document.dispatchEvent(new CustomEvent("BoseCartUpdated"));
        if (typeof window.showBoseToast === "function") {
            window.showBoseToast(`تمت إضافة بطاقة الهدية لـ${state.recipientName.trim()} للسلة بنجاح 🎁`);
        }
    }

    /* ============================ شارات الثقة ============================ */
    function renderTrustBadges() {
        const target = document.getElementById("bose-product-trust-badges");
        if (!target || !window.BoseTrustBadges || typeof window.BoseTrustBadges.renderInto !== "function") return;
        window.BoseTrustBadges.renderInto(target, [
            { icon: "fa-solid fa-bolt", label: "توصيل فوري", sub: "الكود يوصل على واتساب لحظة التأكيد" },
            { icon: "fa-solid fa-lock", label: "دفع آمن", sub: "عربون أو كامل المبلغ بأمان" },
            { icon: "fa-solid fa-calendar-check", label: "صلاحية سنة كاملة", sub: "من تاريخ الشراء" },
            { icon: "fa-solid fa-headset", label: "تواصل مباشر", sub: "رد سريع على واتساب" }
        ]);
    }

    /* ============================ تحميل المنتج الحقيقي من قاعدة البيانات ============================ */
    function bindRealGiftCardProduct(storeData) {
        if (!storeData || !Array.isArray(storeData.products)) return;
        const product = storeData.products.find((p) => p.isGiftCard);
        if (!product) {
            console.warn("⚠️ لم يتم العثور على منتج بطاقة هدية (is_gift_card=true) في قاعدة البيانات - زرار الإضافة للسلة لن يعمل لحد ما يتضاف منتج بطاقة هدية فعلي من لوحة التحكم.");
            return;
        }
        realProduct = product;

        const dbMin = parseFloat(product.options?.minAmount);
        const dbMax = parseFloat(product.options?.maxAmount);
        state.min = !isNaN(dbMin) ? dbMin : FALLBACK_MIN;
        state.max = !isNaN(dbMax) ? dbMax : FALLBACK_MAX;

        const firstFittingChip = AMOUNT_CHIPS.find((v) => v >= state.min && v <= state.max);
        state.amount = firstFittingChip !== undefined ? firstFittingChip : state.min;

        renderAmountChips();
        renderPreview();
        renderFaqSection(product.faqs);
        injectGiftCardStructuredData();
    }

    function init() {
        renderDesignGallery();
        renderOccasionChips();
        renderAmountChips();
        bindGiftDetailsForm();
        bindSendOptionToggle();
        renderPreview();
        renderTrustBadges();

        if (typeof window.initBoseReviewsWidget === "function") {
            window.initBoseReviewsWidget({
                mountId: "bose-gift-card-reviews-mount",
                slug: "bose-gift-card",
                title: "بطاقة هدية مخصصة",
                heading: "قيّمي تجربة بطاقة الهدية",
                subtext: "شاركينا رأيك في تجربة تصميم بطاقة الهدية بنفسك - رأيك بيفرق مع عميلات تانية زيك."
            });
        }

        const downloadBtn = document.getElementById("gcbDownloadBtn");
        if (downloadBtn) downloadBtn.addEventListener("click", downloadPreviewImage);
        const shareBtn = document.getElementById("gcbShareBtn");
        if (shareBtn) shareBtn.addEventListener("click", shareGiftCardImage);
        const addBtn = document.getElementById("gcbAddToCart");
        if (addBtn) addBtn.addEventListener("click", handleAddToCart);
        const addBtnMobile = document.getElementById("gcbAddToCartMobile");
        if (addBtnMobile) addBtnMobile.addEventListener("click", handleAddToCart);

        if (window.BoseStoreData) {
            bindRealGiftCardProduct(window.BoseStoreData);
        }
        document.addEventListener("BoseDatabaseLoaded", (e) => bindRealGiftCardProduct(e.detail));
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
