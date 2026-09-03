/**
 * =====================================================================
 * 🎁 محرك بطاقة الهدية المخصصة - حلويات بوسي (gift-card-builder.html)
 * =====================================================================
 * الفلسفة: نفس فلسفة cake-engine.js / flower-engine.js بالظبط - بنبني
 * عنصر سلة (createCartItem) حقيقي مرتبط بمنتج بطاقة الهدية الفعلي
 * الموجود في قاعدة البيانات (product.isGiftCard === true)، وبنضيف عليه
 * بيانات تخصيص إضافية (تصميم/مُهدى إليه/رسالة) كـ customDetails بس -
 * السعر نفسه (opts.giftCardAmount) هو نفس الآلية المستخدمة فعلاً في
 * product.html، فأي تحقق سيرفري (create_order_with_items) هيفضل شغال
 * بالظبط زي ما هو من غير أي تعديل في قاعدة البيانات.
 *
 * ⚠️ [حد أدنى/أقصى القيمة]: القيم الافتراضية هنا (150 / 5000 جنيه) هي
 * طلب صاحبة المتجر الصريح. لو المنتج الحقيقي في قاعدة البيانات عنده
 * options.minAmount/maxAmount مختلفين (مثلاً لسه 3000 كحد أقصى قديم)،
 * بنستخدم قيم المنتج الحقيقية عشان نضمن توافق كامل مع أي تحقق سيرفري -
 * وبنطبع تحذير واضح في الـ console لو في تعارض، عشان يتظبط من لوحة
 * التحكم / محرر الجداول في Supabase (عمود products.options).
 */
(function () {
    "use strict";

    const FALLBACK_MIN = 150;
    const FALLBACK_MAX = 5000;
    const VALIDITY_LABEL = "سنة كاملة من تاريخ الشراء";
    const MESSAGE_MAX_LEN = 120;
    const BRAND_LOGO = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";

    const DESIGNS = [
        { id: "heart", name: "هدية من القلب", bgFrom: "#FBEFE9", bgTo: "#F0D3BC", accent: "#C9972E", text: "#111111", icon: "fa-solid fa-heart" },
        { id: "birthday", name: "عيد ميلاد سعيد", bgFrom: "#FFE3EA", bgTo: "#FFB6C7", accent: "#E8607C", text: "#111111", icon: "fa-solid fa-cake-candles" },
        { id: "congrats", name: "مبروك التخرج", bgFrom: "#1c1c1c", bgTo: "#2e2e2e", accent: "#D4AF37", text: "#FFFFFF", icon: "fa-solid fa-graduation-cap" },
        { id: "wedding", name: "ألف مبروك", bgFrom: "#FFFFFF", bgTo: "#F3E4D6", accent: "#C9972E", text: "#111111", icon: "fa-solid fa-ring" },
        { id: "love", name: "أحبك", bgFrom: "#5c1023", bgTo: "#7a1830", accent: "#D4AF37", text: "#FFFFFF", icon: "fa-solid fa-heart-circle-check" },
        { id: "thanks", name: "شكراً لك", bgFrom: "#EAEFE2", bgTo: "#C9D6BB", accent: "#6B7D53", text: "#111111", icon: "fa-solid fa-leaf" }
    ];

    const OCCASIONS = [
        { id: "", label: "بدون مناسبة محددة" },
        { id: "birthday", label: "عيد ميلاد" },
        { id: "graduation", label: "تخرج" },
        { id: "wedding", label: "فرح / خطوبة" },
        { id: "thanks", label: "شكراً" },
        { id: "love", label: "حب ومشاعر" },
        { id: "eid", label: "عيد / مناسبة دينية" },
        { id: "other", label: "مناسبة تانية" }
    ];

    const AMOUNT_CHIPS = [150, 300, 500, 1000, 2000, 5000];

    const esc = (s) => (window.escapeBoseHTML ? window.escapeBoseHTML(String(s || "")) : String(s || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));

    const state = {
        designId: DESIGNS[0].id,
        occasionId: "",
        amount: FALLBACK_MIN,
        recipientName: "",
        senderName: "",
        message: "",
        sendOption: "now",
        scheduledDate: "",
        min: FALLBACK_MIN,
        max: FALLBACK_MAX
    };

    let realProduct = null;

    function getDesign(id) {
        return DESIGNS.find((d) => d.id === id) || DESIGNS[0];
    }
    function getOccasionLabel(id) {
        const o = OCCASIONS.find((o) => o.id === id);
        return o && o.id ? o.label : "";
    }

    /* ============================ رسم المعاينة الحية ============================ */
    function renderPreview() {
        const design = getDesign(state.designId);
        const card = document.getElementById("gc-preview-card");
        if (!card) return;
        card.style.background = `linear-gradient(135deg, ${design.bgFrom} 0%, ${design.bgTo} 100%)`;
        card.style.color = design.text;
        card.querySelector(".gc-preview-icon").innerHTML = `<i class="${design.icon}"></i>`;
        card.querySelector(".gc-preview-icon").style.color = design.accent;
        card.querySelector(".gc-preview-title").textContent = design.name;
        card.querySelector(".gc-preview-to span").textContent = state.recipientName.trim() || "اسم المُهدى إليه";
        card.querySelector(".gc-preview-message").textContent = state.message.trim() ? `"${state.message.trim()}"` : "";
        card.querySelector(".gc-preview-message").style.display = state.message.trim() ? "block" : "none";
        card.querySelector(".gc-preview-from span").textContent = state.senderName.trim() || "اسمك";
        card.querySelector(".gc-preview-amount").textContent = `${state.amount} جنيه`;
        card.style.borderColor = design.accent;

        const priceText = document.getElementById("gc-price-display");
        if (priceText) priceText.textContent = `${state.amount} جنيه`;
    }

    /* ============================ معرض التصاميم ============================ */
    function renderDesignGallery() {
        const root = document.getElementById("gc-design-gallery");
        if (!root) return;
        root.innerHTML = DESIGNS.map((d) => `
            <button type="button" class="gc-design-thumb${d.id === state.designId ? " selected" : ""}" data-design="${d.id}"
                style="background:linear-gradient(135deg, ${d.bgFrom} 0%, ${d.bgTo} 100%); color:${d.text};">
                <i class="${d.icon}" style="color:${d.accent};"></i>
                <span>${esc(d.name)}</span>
            </button>
        `).join("");
        root.querySelectorAll(".gc-design-thumb").forEach((btn) => {
            btn.addEventListener("click", () => {
                state.designId = btn.dataset.design;
                root.querySelectorAll(".gc-design-thumb").forEach((b) => b.classList.remove("selected"));
                btn.classList.add("selected");
                renderPreview();
            });
        });
    }

    /* ============================ المناسبة ============================ */
    function renderOccasionSelect() {
        const sel = document.getElementById("gc-occasion-select");
        if (!sel) return;
        sel.innerHTML = OCCASIONS.map((o) => `<option value="${o.id}">${esc(o.label)}</option>`).join("");
        sel.addEventListener("change", () => { state.occasionId = sel.value; });
    }

    /* ============================ القيمة ============================ */
    function renderAmountChips() {
        const root = document.getElementById("gc-amount-chips");
        const hint = document.getElementById("gc-amount-hint");
        const input = document.getElementById("gc-amount-custom-input");
        if (!root) return;

        if (hint) hint.textContent = `من ${state.min} لحد ${state.max} جنيه - صالحة لمدة ${VALIDITY_LABEL} من تاريخ الشراء`;

        root.innerHTML = AMOUNT_CHIPS.filter((v) => v >= state.min && v <= state.max).map((v) => `
            <button type="button" class="gc-amount-chip${v === state.amount ? " selected" : ""}" data-amount="${v}">${v} ج.م</button>
        `).join("") + `<button type="button" class="gc-amount-chip gc-amount-chip-custom" id="gc-amount-other-btn">مبلغ آخر</button>`;

        root.querySelectorAll(".gc-amount-chip[data-amount]").forEach((btn) => {
            btn.addEventListener("click", () => {
                state.amount = parseInt(btn.dataset.amount, 10);
                if (input) input.style.display = "none";
                root.querySelectorAll(".gc-amount-chip").forEach((b) => b.classList.remove("selected"));
                btn.classList.add("selected");
                renderPreview();
            });
        });

        const otherBtn = document.getElementById("gc-amount-other-btn");
        if (otherBtn && input) {
            otherBtn.addEventListener("click", () => {
                input.style.display = "block";
                input.focus();
                root.querySelectorAll(".gc-amount-chip").forEach((b) => b.classList.remove("selected"));
                otherBtn.classList.add("selected");
            });
        }

        if (input) {
            input.min = String(state.min);
            input.max = String(state.max);
            input.addEventListener("input", () => {
                state.amount = parseInt(input.value, 10) || state.min;
                renderPreview();
            });
            input.addEventListener("blur", () => {
                let v = parseInt(input.value, 10) || state.min;
                v = Math.min(Math.max(v, state.min), state.max);
                input.value = String(v);
                state.amount = v;
                renderPreview();
            });
        }
    }

    /* ============================ حقول تفاصيل الهدية ============================ */
    function bindGiftDetailsForm() {
        const recipientInput = document.getElementById("gc-recipient-name");
        const senderInput = document.getElementById("gc-sender-name");
        const messageInput = document.getElementById("gc-message");
        const counter = document.getElementById("gc-message-counter");

        if (recipientInput) recipientInput.addEventListener("input", () => { state.recipientName = recipientInput.value; renderPreview(); });
        if (senderInput) senderInput.addEventListener("input", () => { state.senderName = senderInput.value; renderPreview(); });
        if (messageInput) {
            messageInput.maxLength = MESSAGE_MAX_LEN;
            messageInput.addEventListener("input", () => {
                state.message = messageInput.value;
                if (counter) counter.textContent = `${messageInput.value.length}/${MESSAGE_MAX_LEN}`;
                renderPreview();
            });
        }
    }

    /* ============================ موعد الإرسال ============================ */
    function bindSendOptionToggle() {
        const radios = document.querySelectorAll('input[name="gc-send-option"]');
        const scheduleBox = document.getElementById("gc-schedule-box");
        const dateInput = document.getElementById("gc-schedule-date");

        if (dateInput) {
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            dateInput.min = tomorrow.toISOString().slice(0, 16);
        }

        radios.forEach((r) => {
            r.addEventListener("change", () => {
                state.sendOption = r.value;
                if (scheduleBox) scheduleBox.style.display = r.value === "schedule" ? "block" : "none";
            });
        });
        if (dateInput) {
            dateInput.addEventListener("change", () => { state.scheduledDate = dateInput.value; });
        }
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

    async function buildGiftCardCanvas() {
        const design = getDesign(state.designId);
        const W = 900, H = 540, SCALE = 2;
        const canvas = document.createElement("canvas");
        canvas.width = W * SCALE;
        canvas.height = H * SCALE;
        const ctx = canvas.getContext("2d");
        ctx.scale(SCALE, SCALE);

        // خلفية متدرجة بألوان التصميم المختار
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, design.bgFrom);
        grad.addColorStop(1, design.bgTo);
        ctx.fillStyle = grad;
        roundRect(ctx, 0, 0, W, H, 28);
        ctx.fill();

        // برواز رفيع بلون التصميم
        ctx.strokeStyle = design.accent;
        ctx.lineWidth = 3;
        roundRect(ctx, 6, 6, W - 12, H - 12, 24);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.direction = "rtl";
        ctx.fillStyle = design.text;

        // شعار بوسي أعلى الكارت
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
        ctx.fillStyle = design.accent;
        ctx.fillText(`${state.amount} جنيه`, W / 2, H - 55);

        return canvas;
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

    async function downloadPreviewImage() {
        const btn = document.getElementById("gc-btn-download-preview");
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
            console.warn("تعذرت المشاركة:", e);
        }
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
        const errors = [];
        if (!state.recipientName.trim()) errors.push("اكتبي اسم اللي هتديهالها البطاقة");
        if (!state.senderName.trim()) errors.push("اكتبي اسمك عشان يعرف صاحب البطاقة إنها منك");
        if (state.amount < state.min || state.amount > state.max) errors.push(`القيمة لازم تكون بين ${state.min} و ${state.max} جنيه`);
        if (state.sendOption === "schedule" && !state.scheduledDate) errors.push("حددي موعد الإرسال أو اختاري إرسال فوري");
        return errors;
    }

    function handleAddToCart() {
        const errors = validateForm();
        if (errors.length > 0) {
            if (typeof window.showBoseToast === "function") window.showBoseToast(errors[0]);
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
        const options = {
            giftCardAmount: state.amount,
            giftDesignName: design.name,
            giftOccasionLabel: getOccasionLabel(state.occasionId),
            recipientName: state.recipientName.trim(),
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

        if (state.min !== FALLBACK_MIN || state.max !== FALLBACK_MAX) {
            console.warn(`⚠️ الحد الأدنى/الأقصى الفعلي لمنتج بطاقة الهدية في قاعدة البيانات (${state.min}-${state.max}) مختلف عن القيم المطلوبة (${FALLBACK_MIN}-${FALLBACK_MAX}). لازم يتحدّث عمود products.options لهذا المنتج في Supabase عشان الواجهة والتحقق السيرفري يتفقوا تماماً.`);
        }

        state.amount = state.min;
        const input = document.getElementById("gc-amount-custom-input");
        if (input) input.value = String(state.min);

        renderAmountChips();
        renderPreview();
    }

    function init() {
        renderDesignGallery();
        renderOccasionSelect();
        renderAmountChips();
        bindGiftDetailsForm();
        bindSendOptionToggle();
        renderPreview();

        const downloadBtn = document.getElementById("gc-btn-download-preview");
        if (downloadBtn) downloadBtn.addEventListener("click", downloadPreviewImage);
        const shareBtn = document.getElementById("gc-btn-share-preview");
        if (shareBtn) shareBtn.addEventListener("click", shareGiftCardImage);
        const addBtn = document.getElementById("gc-btn-add-to-cart");
        if (addBtn) addBtn.addEventListener("click", handleAddToCart);

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
