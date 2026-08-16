/**
 * 👑 محرك محاكي بوكيهات الورد والملحقات التفاعلي المطور - حلويات بوسي 👑
 * النسخة الهندسية القياسية الكاملة والمعزولة كلياً - النسخة V3.0 فائقة الأداء وتوفير البيانات.
 * التوافق: يلتزم بمهام محاكي الورد فقط ولا يتدخل بأي ملف آخر، ويتكامل بأمان مع البيئة المحلية.
 */

(function () {
    "use strict";

    // مفاتيح التخزين الموحدة لعلامة بوسي الفاخرة لضمان التزامن المطلق
    const CART_STORAGE_KEY = 'bose_cart';
    const FLOWER_STATE_STORAGE_KEY = 'bose_flower_builder_state';
    const BASE64_IMAGE_SESSION_KEY = 'bose_active_base64_image_session';

    // ذاكرة احتياطية لضمان استقرار التصفح الخفي (Incognito Mode Fallback)
    let flowerStateMemoryFallback = {};
    let activeBase64ImageInMemory = "";

    try {
        activeBase64ImageInMemory = sessionStorage.getItem(BASE64_IMAGE_SESSION_KEY) || "";
    } catch (e) {
        console.warn("⚠️ الـ sessionStorage غير متاح في المتصفح الحالي.");
    }

    // الإعدادات الافتراضية الصارمة للأسعار تماشياً مع الوثيقة القياسية لحلويات بوسي
    let flowerConfig = {
        basePrice: 400,
        baseFlowers: 15,
        extraFlowerPrice: 35,
        photoPrintPrice: 15,
        // 💰👑 [توحيد سعر كارت الإهداء مع محاكي التورت]: كان 20 جنيه هنا مقابل
        // 30 جنيه في محاكي التورت لنفس بالظبط الخدمة (كارت ورقي فاخر بكلام
        // مكتوب) - وحدنا القيمة الافتراضية هنا لتبقى 30 زي محاكي التورت بالظبط.
        // لو فيه قيمة مُعدّة من لوحة التحكم (fbConfig.giftCardPrice) هي هتفضل
        // الأولوية زي ما كانت (شوف تحت في applyRemoteFlowerConfig).
        giftCardPrice: 30,
        satinRibbonPrice: 50
    };

    // الحالة الديناميكية الحالية لرحلة العميل داخل المحاكي
    let state = {
        currentActiveStep: 1,
        // 🗑️👑 [حذف خطوة "لنفسي/هدية"]: بنفس فلسفة محاكي التورت V6.0. باقي
        // الخطوات اتقسّمت لخطوة قرار واحد لكل خطوة (كانت 5 خطوات مجمّعة، بقت
        // 9 خطوات قرار + خطوة خلاصة أخيرة = 10 بالظبط).
        totalSteps: 10,
        mood: "",
        flowerType: "natural",
        flowerCount: 15,
        wrappingType: "classic",
        ribbonColor: "pink",
        includeRibbonText: false,
        ribbonText: "",
        includePhoto: false,
        photoCount: 1,
        photoUrl: "",
        includeCash: false,
        moneyAmount: 0,
        moneyCategoryAmount: 0,
        includeChocolate: false,
        chocolateBudget: 0,
        includeCard: false,
        cardText: "",
        totalPrice: 400,
        isUploading: false
    };

    // عناصر واجهة الـ DOM الخاصة بمحاكي الورد
    let flowerCountInput, includePhotoCheckbox, photoFileInput, photoPreviewContainer, photoPreviewImg;
    let includeCardCheckbox, cardTextInput, moneyCategorySelect, bouquetTotalVal, addToCartBtn;
    let includeRibbonTextCheckbox, ribbonTextSection, ribbonTextInput, ribbonStepPriceDisplay;
    let includeCashCheckbox, cashMasterBlock, cashIntegrationCounterBlock, moneyAmountDisplay;
    let includeChocolateCheckbox, chocolateBudgetMasterBlock, chocolateBudgetDisplay;
    let photoCountInput, dynamicAddonsArea, embeddedPriceDisplay, bosePhotosPriceDisplay, boseCardPriceDisplay;
    let btnNext, btnPrev, stepsPanels, stepsIndicators, iconicBtns, hiddenTypeInput, dynamicPricingWidget;

    /**
     * 🛡️ حفظ وتأمين الحالة التفاعلية الحالية للعميل منعاً لفقد الخيارات
     */
    function saveCurrentState() {
        try {
            const tempState = { ...state };
            if (tempState.photoUrl && tempState.photoUrl.startsWith('data:image/')) {
                activeBase64ImageInMemory = tempState.photoUrl;
                tempState.photoUrl = "base64-stored-in-memory";
                try {
                    sessionStorage.setItem(BASE64_IMAGE_SESSION_KEY, activeBase64ImageInMemory);
                } catch (ex) {}
            }
            localStorage.setItem(FLOWER_STATE_STORAGE_KEY, JSON.stringify(tempState));
        } catch (err) {
            flowerStateMemoryFallback[FLOWER_STATE_STORAGE_KEY] = JSON.stringify(state);
        }
    }

    /**
     * 🧮 محرك الفحص المالي لأسعار البوكيه - مطور كلياً لمنع تحميل ميزانية الكاش أو الشوكولاتة أي رسوم
     */
    function recalculatePrice() {
        let extraFlowers = Math.max(0, state.flowerCount - flowerConfig.baseFlowers);
        let extraCost = extraFlowers * flowerConfig.extraFlowerPrice;
        let ribbonCost = state.includeRibbonText ? flowerConfig.satinRibbonPrice : 0;
        let photoCost = state.includePhoto ? (state.photoCount * flowerConfig.photoPrintPrice) : 0;
        let cardCost = (state.includeCard && state.cardText.trim() !== "") ? flowerConfig.giftCardPrice : 0;

        // 1. حساب تكلفة الخدمة والتنسيق القابلة لزيادة السعر الرسمية
        let servicePrice = flowerConfig.basePrice + extraCost + ribbonCost + photoCost + cardCost;

        // استدعاء دالة الزيادة الرسمية من المحرك المركزي الموحد لتوحيد السياسة المالية للموقع إن وجدت
        let finalServicePrice = window.calculateBosePrice ? window.calculateBosePrice(servicePrice, "menu-only") : servicePrice;

        // 2. الكاش والشوكولاتة تُحسب كقيم صافية 100% بدون أي رسوم معالجة لثقة العميل
        // 🛡️ [إصلاح مالي]: القيمة المخزنة في state.totalPrice (اللي بتتحط في finalPrice
        // بالسلة) بتفضل بكسورها العشرية الكاملة بدون تقريب مبكر، والتقريب الوحيد
        // المسموح بيه بيتطبق على مستوى العرض بالواجهة فقط، تماشياً مع القاعدة المالية
        // الصارمة بعدم تقريب أي سعر فردي أو مخصص، والتقريب مرة واحدة على الإجمالي الكلي.
        let total = finalServicePrice + state.moneyAmount + state.chocolateBudget;
        state.totalPrice = total;

        if (bouquetTotalVal) {
            bouquetTotalVal.textContent = `${Math.round(total)} جنيه`;
        }

        // تحديث نص السعر التوضيحي بداخل كارت الخطوة الأولى
        if (embeddedPriceDisplay) {
            const currentCountCost = flowerConfig.basePrice + (extraFlowers * flowerConfig.extraFlowerPrice);
            let finalCountCost = window.calculateBosePrice ? window.calculateBosePrice(currentCountCost, "menu-only") : currentCountCost;
            embeddedPriceDisplay.innerHTML = `سعر هذا البوكيه الذي يحتوي على ${state.flowerCount} وردة هو <span>${Math.round(finalCountCost)} جنيه</span>`;
        }

        // تحديث سعر شريط الستان
        if (ribbonStepPriceDisplay) {
            ribbonStepPriceDisplay.innerHTML = `سعر إضافة شريط الستان المطبوع حرارياً هو <span>${flowerConfig.satinRibbonPrice} جنيه</span>`;
        }

        // تحديث سعر الصور الشخصية
        if (bosePhotosPriceDisplay) {
            bosePhotosPriceDisplay.style.display = state.includePhoto ? "block" : "none";
            if (state.includePhoto) {
                bosePhotosPriceDisplay.innerHTML = `<p class="bose-embedded-price-text">سعر طباعة وتنسيق الصور الشخصية (${state.photoCount} صورة) هو <span>${photoCost} جنيه</span></p>`;
            }
        }

        // تحديث سعر كارت الإهداء
        if (boseCardPriceDisplay) {
            boseCardPriceDisplay.style.display = state.includeCard ? "block" : "none";
        }

        // رندرة الفاتورة الجانبية بتنسيق فاخر صريح وواضح للعين
        if (dynamicAddonsArea) {
            let html = "";
            if (extraFlowers > 0) {
                html += `<div class="bose-invoice-addon-row"><span>الورد الإضافي (${extraFlowers} وردة):</span><span>+ ${extraCost} جنيه</span></div>`;
            }
            if (ribbonCost > 0) {
                html += `<div class="bose-invoice-addon-row"><span>شريط ستان بكلام مخصوص:</span><span>+ ${flowerConfig.satinRibbonPrice} جنيه</span></div>`;
            }
            if (photoCost > 0) {
                html += `<div class="bose-invoice-addon-row"><span>الصور الشخصية المترتبة (${state.photoCount}):</span><span>+ ${photoCost} جنيه</span></div>`;
            }
            if (cardCost > 0) {
                html += `<div class="bose-invoice-addon-row"><span>كارت إهداء شيك مكتوب:</span><span>+ ${flowerConfig.giftCardPrice} جنيه</span></div>`;
            }
            if (state.moneyAmount > 0) {
                html += `<div class="bose-invoice-addon-row"><span>مفاجأة الكاش جوه البوكيه:</span><span>+ ${state.moneyAmount} جنيه</span></div>`;
            }
            if (state.chocolateBudget > 0) {
                html += `<div class="bose-invoice-addon-row"><span>ميزانية الشوكولاتة الفخمة:</span><span>+ ${state.chocolateBudget} جنيه</span></div>`;
            }
            dynamicAddonsArea.innerHTML = html;
        }
    }

    /**
     * 📋👑 [خطوة الخلاصة]: بترسم ملخص كل اختيار اتخد في الخطوات السابقة، كل
     * سطر معاه رابط "تعديل" بيرجع العميلة لنفس الخطوة تحدثها. بنفس فلسفة
     * "كل حاجة ظاهرة قدام العميل من غير ما يحتاج يدور عليها" المتبعة في باقي
     * الموقع - العميلة تتأكد من كل تفاصيل طلبها في مكان واحد قبل ما تضيفه للسلة.
     */
    function renderFlowerSummary() {
        const list = document.getElementById("flower-summary-list");
        if (!list) return;

        const esc = window.escapeBoseHTML || (s => s);
        const flowerTypeLabels = { natural: "ورد طبيعي نضر", artificial: "ورد صناعي فاخر", satin: "ورد ستان راقٍ" };
        const moodLabelMap = { celebratory: "احتفالي", romantic: "رومانسي", elegant: "أنيق وبسيط" };

        const rows = [];
        const addRow = (step, label, value) => {
            rows.push(`
                <div class="bose-order-summary-row">
                    <div class="bose-order-summary-row-text">
                        <span class="bose-order-summary-row-label">${esc(label)}</span>
                        <span class="bose-order-summary-row-value">${esc(value)}</span>
                    </div>
                    <button type="button" class="bose-order-summary-edit-btn" data-step-target="${step}">تعديل</button>
                </div>
            `);
        };

        addRow(1, "الإحساس المطلوب", state.mood ? (moodLabelMap[state.mood] || state.mood) : "من غير ترشيح معين");
        addRow(2, "نوع الورد", flowerTypeLabels[state.flowerType] || state.flowerType);
        addRow(3, "عدد الورد", `${state.flowerCount} وردة`);
        addRow(4, "صورة تصميم مرجعية", activeBase64ImageInMemory ? "مرفوعة ✓" : "لم تُرفع");
        addRow(5, "شريط الستان", state.includeRibbonText && state.ribbonText.trim() !== "" ? `مطبوع عليه: "${state.ribbonText.trim()}"` : "بدون كلام مطبوع (تغليف كلاسيك مجاني فقط)");
        addRow(6, "صور شخصية داخل الباقة", state.includePhoto ? `${state.photoCount} صورة مطبوعة` : "غير مطلوبة");
        addRow(7, "مفاجأة كاش", (state.includeCash && state.moneyAmount > 0) ? `${state.moneyAmount} جنيه` : "غير مطلوبة");
        addRow(8, "شوكولاتة فاخرة", state.includeChocolate && state.chocolateBudget > 0 ? `ميزانية ${state.chocolateBudget} جنيه` : "غير مطلوبة");
        addRow(9, "كارت إهداء", (state.includeCard && state.cardText.trim() !== "") ? `مكتوب عليه: "${state.cardText.trim()}"` : "بدون كارت");

        list.innerHTML = rows.join("");

        list.querySelectorAll(".bose-order-summary-edit-btn").forEach(btn => {
            btn.onclick = () => {
                const target = parseInt(btn.getAttribute("data-step-target"), 10);
                if (!isNaN(target)) {
                    state.currentActiveStep = target;
                    updateActiveStepUI();
                }
            };
        });
    }

    /**
     * 🗺️ حارس التحكم وتوجيه خطوات الـ Stepper ذكياً
     */
    function updateActiveStepUI() {
        if (stepsPanels.length > 0) {
            stepsPanels.forEach(panel => {
                const stepNum = parseInt(panel.getAttribute("data-step"), 10);
                panel.classList.toggle("active", stepNum === state.currentActiveStep);
            });
        }

        if (stepsIndicators.length > 0) {
            stepsIndicators.forEach(node => {
                const nodeNum = parseInt(node.getAttribute("data-step-target"), 10);
                if (nodeNum === state.currentActiveStep) {
                    node.className = "step-node active";
                } else if (nodeNum < state.currentActiveStep) {
                    node.className = "step-node completed";
                } else {
                    node.className = "step-node";
                }
            });
        }

        if (btnPrev) btnPrev.style.display = (state.currentActiveStep === 1) ? "none" : "inline-flex";

        if (state.currentActiveStep === state.totalSteps) {
            if (btnNext) btnNext.style.display = "none";
            if (addToCartBtn) {
                addToCartBtn.style.display = "inline-flex";
                addToCartBtn.textContent = "اضافة للسلة";
            }
            // 📋 [خطوة الخلاصة]: بنعيد رسم ملخص الاختيارات في كل مرة العميلة توصل
            // للخطوة الأخيرة، عشان يفضل مطابق لآخر تعديل عملته في أي خطوة سابقة.
            renderFlowerSummary();
        } else {
            if (btnNext) btnNext.style.display = "inline-flex";
            if (addToCartBtn) addToCartBtn.style.display = "none";
        }

        if (dynamicPricingWidget) {
            dynamicPricingWidget.style.display = "block";
        }

        // 🛡️ [إصلاح جذري]: زرار "التالي" هنا معندوش أي تمرير خالص، فالعميل بيضغط ويفضل واقف
        // في نفس مكانه من غير ما يشوف بداية الخطوة الجديدة إلا لو نزل بنفسه يدور عليها.
        // بنمرره الآن لبداية لوحة التحكم (نفس مكان الخطوات) بارتفاع الهيدر الثابت مطروح منه.
        const activeStepPanel = document.querySelector('.bose-step-card-panel.active');
        const scrollTarget = activeStepPanel || document.querySelector('.simulator-control-panel');
        if (scrollTarget) {
            const stickyHeaderOffset = 90;
            const targetY = scrollTarget.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset;
            window.scrollTo({ top: Math.max(targetY, 0), behavior: 'smooth' });
        }
    }

    /**
     * 🖼️ محرك ضغط وتطهير ملفات الصور لحفظ المعالجة وتوفير 80% من بيانات الموبايل
     */
    function compressImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // تحجيم ذكي ومناسب لشاشات العرض بدون إهدار للبيانات
                    if (width > 600) {
                        height = Math.round((height * 600) / width);
                        width = 600;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.drawImage(img, 0, 0, width, height);

                    // تصدير الصورة بجودة مضغوطة ذكية للغاية
                    canvas.toBlob((blob) => {
                        blob ? resolve(blob) : reject();
                    }, 'image/jpeg', 0.65);
                };
            };
        });
    }

    async function uploadReferenceImage(file) {
        if (!file) return;
        state.isUploading = true;
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = "بنجيب لكِ أعلى جودة للصورة...";
        }

        try {
            // ضغط الصورة على جهاز العميل أولاً قبل عملية الرفع
            const compressedBlob = await compressImageFile(file);
            const cloudName = window.BoseStoreData?.store?.cloudinaryCloudName || 'dyx4w0dr1';
            const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

            const formData = new FormData();
            formData.append('file', compressedBlob, 'flower_compressed.jpg');
            // 🚨🚨 [إصلاح جذري حرج - نفس سبب فشل الرفع في محاكي التورت بالظبط]:
            // "ml_default" مش preset حقيقي مفعّل على حساب Cloudinary بتاعنا. استخدمنا
            // نفس الـ preset الحقيقي الشغال فعلياً في لوحة التحكم: "gct8i28h".
            formData.append('upload_preset', 'gct8i28h');

            const res = await fetch(endpoint, { method: 'POST', body: formData });
            const resData = await res.json();

            if (resData && resData.secure_url) {
                state.photoUrl = resData.secure_url;
                if (photoPreviewImg) photoPreviewImg.src = resData.secure_url;
                if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
                if (window.showBoseGlobalToast) window.showBoseGlobalToast("تم تأمين وحفظ الصورة بنجاح! ✨");
            }
        } catch (err) {
            // 🚨🚨 [إصلاح جذري حرج]: كان بيعمل Fallback صامت لصورة base64 عملاقة
            // (نص طويل جداً يمثل الصورة كاملة) وبيوهم العميل إن الرفع "نجح" (المعاينة
            // بتظهر عادي محلياً)، بينما في الحقيقة الصورة دي مش مرفوعة فعلياً على أي
            // سيرفر حقيقي - النص الطويل ده كان بيوصل لرابط الواتساب فيكسره تماماً
            // (روابط واتساب محدودة الطول) أو يوصل مقطوع/فاسد. الحل الصحيح: نوضح
            // للعميل إن الرفع فشل فعلياً ونسيبها تحاول تاني، بدل حل وهمي بيبان شغال.
            state.photoUrl = "";
            if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
            if (window.showBoseGlobalToast) window.showBoseGlobalToast("تعذر رفع الصورة، تأكدي من الاتصال بالإنترنت وحاولي تاني.");
        } finally {
            state.isUploading = false;
            if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = "اضافة للسلة";
            }
            saveCurrentState();
            recalculatePrice();
        }
    }

    /**
     * ⚙️ تهيئة المحرك وربط الأحداث
     */
    function initializeFlowerEngine() {
        // 🧮 [توحيد مصدر الأسعار - المرحلة 3]: تحديث flowerConfig من
        // window.BoseStoreData.flowerBuilder فور جاهزية قاعدة البيانات، بنفس أسماء
        // الحقول وبنفس القيم الاحتياطية المستخدمة حرفياً في core-engine.js
        // (window.calculateCustomFlowerPrice) عشان يفضل سعر المحاكي المعروض للعميل
        // مطابق تماماً لسعر الحارس المركزي اللي بيتأكد منه بعدين في صفحة السلة.
        const fbConfig = window.BoseStoreData?.flowerBuilder || {};
        flowerConfig.basePrice = parseFloat(fbConfig.basePrice) || flowerConfig.basePrice;
        flowerConfig.baseFlowers = parseInt(fbConfig.baseFlowers, 10) || flowerConfig.baseFlowers;
        flowerConfig.extraFlowerPrice = parseFloat(fbConfig.extraFlowerPrice) || flowerConfig.extraFlowerPrice;
        flowerConfig.photoPrintPrice = parseFloat(fbConfig.photoPrintPrice) || flowerConfig.photoPrintPrice;
        flowerConfig.giftCardPrice = parseFloat(fbConfig.giftCardPrice) || flowerConfig.giftCardPrice;

        // 🖼️👑 [معرض نماذج كارت الإهداء المطبوع - محاكي الورد]: نفس آلية معرض
        // سابقة الأعمال فوق بالظبط، بس بيتقرا من fbConfig.giftCardImages وبيتعرض
        // كشريط صور صغير جوه خطوة كارت الإهداء نفسها (بدل ما تكون العميلة "شغالة
        // بالتخمين" وهي مش شايفة شكل الكارت النهائي قبل ما تختاره).
        const giftCardGalleryTrack = document.getElementById('flower-giftcard-gallery');
        if (giftCardGalleryTrack) {
            const giftCardImages = Array.isArray(fbConfig.giftCardImages) ? fbConfig.giftCardImages : [];
            if (giftCardImages.length > 0) {
                giftCardGalleryTrack.innerHTML = giftCardImages.map((item) => {
                    const url = (item && item.image) || "";
                    if (!url) return "";
                    const alt = (item && (item.alt || item.name)) ? String(item.alt || item.name).replace(/"/g, '&quot;') : "نموذج كارت إهداء حلويات بوسي";
                    return `<div class="bose-giftcard-img-node"><img src="${url}" alt="${alt}" loading="lazy"></div>`;
                }).join("");
            }
        }
        // satinRibbonPrice تفضل ثابتة (50) لعدم وجود حقل رسمي مخصص لها بالـ JSON حالياً،
        // بنفس القرار المتبع في core-engine.js بالظبط. state.totalPrice هيتحدث تلقائياً
        // بالقيم الجديدة عند نداء recalculatePrice() في نهاية الدالة دي.

        // 🖼️ [صور المحاكي الديناميكية]: البانر الرئيسي ومعرض "بوكيهات شرفت
        // عملائنا" كانوا ثابتين على شعار المتجر مكرر 4 مرات، بدون أي مكان في
        // لوحة التحكم لتغييرهم. دلوقتي بيتقروا من fbConfig.heroImage/
        // portfolioGallery (نفس آلية cake-engine.js بالظبط) - وبما إن الرندرة
        // دي بتحصل هنا في أول الدالة، أي كود تحت بيدور على .portfolio-item-card
        // هيلاقي العناصر الجديدة جاهزة عادي (نفس الـ scope المتزامن).
        const heroImg = document.querySelector('.hero-banner-frame');
        if (heroImg && fbConfig.heroImage) heroImg.src = fbConfig.heroImage;
        const portfolioTrack = document.getElementById('portfolio-swipe-slider');
        if (portfolioTrack && Array.isArray(fbConfig.portfolioGallery) && fbConfig.portfolioGallery.length > 0) {
            portfolioTrack.innerHTML = fbConfig.portfolioGallery.map((item, idx) => {
                const url = (item && item.image) || "";
                if (!url) return "";
                const alt = (item && (item.alt || item.name)) ? String(item.alt || item.name).replace(/"/g, '&quot;') : "بوكيه فاخر من حلويات بوسي";
                return `<div class="portfolio-item-card" data-index="${idx + 1}"><img src="${url}" class="portfolio-item-img" alt="${alt}" loading="lazy"></div>`;
            }).join("");
        }

        // 🖼️👑 [صور كروت نوع الورد من لوحة التحكم - إصلاح جذري]: نفس المشكلة
        // بالظبط اللي اتصلحت في محاكي التورت (applyBoseOptionCardImages) - كارت
        // "ورد طبيعي/صناعي/ستان" كان أيقونة إيموجي بس من غير أي مكان لعرض صورة
        // حقيقية، حتى لو الأدمن رفعها من list-flower-types بلوحة التحكم. هنا
        // الكارت مش label+radio زي محاكي التورت، لكن div بـ data-value، فبنحقن
        // الصورة قبل أيقونة الإيموجي مباشرة (بتفضل الصورة هي الظاهرة).
        if (Array.isArray(fbConfig.flowerTypes)) {
            document.querySelectorAll('#flower-type-iconic-row .bose-iconic-btn-node').forEach((node) => {
                const match = fbConfig.flowerTypes.find((item) => item && item.id === node.getAttribute('data-value'));
                if (!match || !match.image) return;
                let img = node.querySelector('img.bose-option-card-thumb');
                if (!img) {
                    img = document.createElement('img');
                    img.className = 'bose-option-card-thumb';
                    img.alt = '';
                    node.insertBefore(img, node.firstChild);
                }
                img.src = match.image;
            });
        }

        flowerCountInput = document.getElementById('flower-count');
        includePhotoCheckbox = document.getElementById('include-photo');
        photoFileInput = document.getElementById('photo-file');
        photoPreviewContainer = document.getElementById('photo-preview-container');
        photoPreviewImg = document.getElementById('photo-preview-img');
        includeCardCheckbox = document.getElementById('include-card');
        cardTextInput = document.getElementById('card-text');
        moneyCategorySelect = document.getElementById('money-category');
        bouquetTotalVal = document.getElementById('bouquet-total-val');
        addToCartBtn = document.getElementById('add-to-cart-btn');
        dynamicAddonsArea = document.getElementById('bose-dynamic-addons-injection-area');
        embeddedPriceDisplay = document.getElementById('bose-embedded-price-display');

        includeRibbonTextCheckbox = document.getElementById('include-ribbon-text');
        ribbonTextSection = document.getElementById('ribbon-text-section');
        ribbonTextInput = document.getElementById('ribbon-text-input');
        ribbonStepPriceDisplay = document.getElementById('bose-ribbon-price-display');

        bosePhotosPriceDisplay = document.getElementById('bose-photos-price-display');
        boseCardPriceDisplay = document.getElementById('bose-card-price-display');

        includeCashCheckbox = document.getElementById('include-cash-toggle');
        cashMasterBlock = document.getElementById('cash-master-integration-block');
        cashIntegrationCounterBlock = document.getElementById('cash-integration-counter-block');
        moneyAmountDisplay = document.getElementById('money-amount-display');

        includeChocolateCheckbox = document.getElementById('include-chocolate-toggle');
        chocolateBudgetMasterBlock = document.getElementById('chocolate-budget-master-block');
        chocolateBudgetDisplay = document.getElementById('chocolate-budget-display');
        photoCountInput = document.getElementById('photo-count-input');

        btnNext = document.getElementById("btn-next");
        btnPrev = document.getElementById("btn-prev");
        stepsPanels = document.querySelectorAll(".bose-step-card-panel");
        stepsIndicators = document.querySelectorAll(".simulator-steps-indicator .step-node");
        iconicBtns = document.querySelectorAll("#flower-type-iconic-row .bose-iconic-btn-node");
        hiddenTypeInput = document.getElementById("flower-type");
        dynamicPricingWidget = document.getElementById("bose-dynamic-pricing-widget");

        // تغذية القائمة المنسدلة ديناميكياً للفئات النقدية
        if (moneyCategorySelect) {
            let optionsHtml = `<option value="0" selected>اختار فئة الفلوس النقدية...</option>`;
            const categories = window.BoseStoreData?.flowerBuilder?.moneyCategories || [
                {amount:5}, {amount:10}, {amount:20}, {amount:50}, {amount:100}, {amount:200}
            ];
            categories.forEach(cat => {
                optionsHtml += `<option value="${cat.amount}">فئة الـ ${cat.amount} جنيه</option>`;
            });
            moneyCategorySelect.innerHTML = optionsHtml;
        }

        // استعادة الحالة المحفوظة سابقاً إن وجدت
        try {
            const saved = localStorage.getItem(FLOWER_STATE_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.photoUrl === "base64-stored-in-memory") {
                    parsed.photoUrl = activeBase64ImageInMemory;
                }
                state = { ...state, ...parsed };
            }
        } catch (e) {}

        // تطبيق الحالة المستعادة على عناصر الـ UI مباشرة
        if (flowerCountInput) flowerCountInput.value = state.flowerCount;
        if (includeRibbonTextCheckbox) {
            includeRibbonTextCheckbox.checked = state.includeRibbonText;
            if (ribbonTextSection) ribbonTextSection.style.display = state.includeRibbonText ? "block" : "none";
        }
        if (ribbonTextInput) ribbonTextInput.value = state.ribbonText;
        if (includePhotoCheckbox) {
            includePhotoCheckbox.checked = state.includePhoto;
            const upSec = document.getElementById('photo-upload-section');
            if (upSec) upSec.style.display = state.includePhoto ? "block" : "none";
        }
        if (photoCountInput) photoCountInput.value = state.photoCount;
        if (state.photoUrl && photoPreviewImg) {
            photoPreviewImg.src = state.photoUrl;
            if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
        }
        if (includeCardCheckbox) {
            includeCardCheckbox.checked = state.includeCard;
            const cardSec = document.getElementById('card-text-section');
            if (cardSec) cardSec.style.display = state.includeCard ? "block" : "none";
        }
        if (cardTextInput) cardTextInput.value = state.cardText;
        if (includeCashCheckbox) {
            includeCashCheckbox.checked = state.includeCash;
            if (cashMasterBlock) cashMasterBlock.style.display = state.includeCash ? "block" : "none";
        }
        if (moneyCategorySelect) moneyCategorySelect.value = state.moneyCategoryAmount;
        if (moneyAmountDisplay) moneyAmountDisplay.value = state.moneyAmount;
        if (includeChocolateCheckbox) {
            includeChocolateCheckbox.checked = state.includeChocolate;
            if (chocolateBudgetMasterBlock) chocolateBudgetMasterBlock.style.display = state.includeChocolate ? "block" : "none";
        }
        if (chocolateBudgetDisplay) chocolateBudgetDisplay.value = state.chocolateBudget;

        // ربط أحداث أزرار نوع الورد الكروي الفخم
        if (iconicBtns.length > 0) {
            iconicBtns.forEach(btn => {
                btn.classList.toggle("active-selected", btn.getAttribute("data-value") === state.flowerType);
                btn.onclick = function () {
                    iconicBtns.forEach(b => b.classList.remove("active-selected"));
                    this.classList.add("active-selected");
                    state.flowerType = this.getAttribute("data-value");
                    if (hiddenTypeInput) hiddenTypeInput.value = state.flowerType;
                    saveCurrentState();
                    recalculatePrice();
                    updateFlowerSensoryNote();
                };
            });
        }

        // 🧠 [محاكي أذكى - مطابق لمحاكي الكيك]: خطوة الإحساس المطلوب
        // 🗑️ [حذف "لمين البوكيه ده؟"]: purposeBtns وupdateGiftModeWording اتشالوا
        // من هنا بالكامل - راجع الشرح في تعريف state.totalSteps فوق.
        const moodBtns = document.querySelectorAll("#flower-mood-row .bose-iconic-btn-node");
        const moodNoteBox = document.getElementById("mood-suggestion-note");
        const moodNoteText = document.getElementById("mood-suggestion-text");

        const FLOWER_MOOD_PRESETS = {
            celebratory: { type: "natural", note: "توليفة مقترحة للاحتفالات: ورد طبيعي نضر بألوان زاهية. تقدري تعدلي أي اختيار في الخطوات الجاية." },
            romantic: { type: "satin", card: true, note: "توليفة مقترحة للمناسبات الرومانسية: ورد ستان راقٍ مع كارت إهداء. تقدري تعدلي أي اختيار في الخطوات الجاية." },
            elegant: { type: "artificial", note: "توليفة مقترحة للأناقة البسيطة: ورد صناعي فاخر يدوم طويلاً. تقدري تعدلي أي اختيار في الخطوات الجاية." }
        };

        function applyFlowerMoodPreset(moodValue) {
            const preset = FLOWER_MOOD_PRESETS[moodValue];
            if (!preset) {
                if (moodNoteBox) moodNoteBox.classList.remove("show");
                return;
            }
            const typeBtn = document.querySelector(`#flower-type-iconic-row .bose-iconic-btn-node[data-value="${preset.type}"]`);
            if (typeBtn) typeBtn.click();
            if (preset.card && includeCardCheckbox) {
                includeCardCheckbox.checked = true;
                if (typeof includeCardCheckbox.onclick === "function") {
                    includeCardCheckbox.onclick({ target: includeCardCheckbox });
                }
            }
            if (moodNoteText) moodNoteText.textContent = preset.note;
            if (moodNoteBox) moodNoteBox.classList.add("show");
        }

        moodBtns.forEach(btn => {
            btn.onclick = function () {
                moodBtns.forEach(b => b.classList.remove("active-selected"));
                this.classList.add("active-selected");
                state.mood = this.getAttribute("data-value");
                applyFlowerMoodPreset(state.mood);
                saveCurrentState();
            };
        });

        const FLOWER_SENSORY_NOTES = {
            natural: "ورد طازج ونضر، بيوصل مباشرة من أفضل مزارع الورد.",
            artificial: "خامة فاخرة تحافظ على شكلها ورونقها لفترة أطول بكتير.",
            satin: "لمسة ستان ناعمة وراقية تدي إحساس مختلف تماماً."
        };
        function updateFlowerSensoryNote() {
            const noteEl = document.getElementById("flower-sensory-note");
            if (noteEl) noteEl.textContent = FLOWER_SENSORY_NOTES[state.flowerType] || "";
        }
        updateFlowerSensoryNote();

        const btnShareFlowerDesign = document.getElementById("btn-share-flower-design");
        if (btnShareFlowerDesign) {
            btnShareFlowerDesign.addEventListener("click", () => {
                const typeLabelMap = { natural: "طبيعي نضر", artificial: "صناعي فاخر", satin: "ستان راقٍ" };
                const priceNow = document.getElementById("bouquet-total-val")?.textContent || "";
                const shareText = `شوفي التصميم اللي عملته لبوكيه ورد من حلويات بوسي 💐\nنوع الورد: ${typeLabelMap[state.flowerType] || state.flowerType}\nعدد الورد: ${state.flowerCount}\nالسعر: ${priceNow}\nإيه رأيك؟`;
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
            });
        }

        const minusBtn = document.getElementById('flower-minus');
        const plusBtn = document.getElementById('flower-plus');

        if (plusBtn) {
            plusBtn.onclick = () => {
                state.flowerCount++;
                if (flowerCountInput) flowerCountInput.value = state.flowerCount;
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (minusBtn) {
            minusBtn.onclick = () => {
                if (state.flowerCount > flowerConfig.baseFlowers) {
                    state.flowerCount--;
                    if (flowerCountInput) flowerCountInput.value = state.flowerCount;
                    saveCurrentState();
                    recalculatePrice();
                }
            };
        }

        // ربط أحداث الستان المطور
        if (includeRibbonTextCheckbox) {
            includeRibbonTextCheckbox.onclick = (e) => {
                state.includeRibbonText = e.target.checked;
                if (ribbonTextSection) ribbonTextSection.style.display = state.includeRibbonText ? "block" : "none";
                if (!state.includeRibbonText) {
                    state.ribbonText = "";
                    if (ribbonTextInput) ribbonTextInput.value = "";
                }
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (ribbonTextInput) {
            ribbonTextInput.oninput = (e) => {
                state.ribbonText = e.target.value;
                saveCurrentState();
            };
        }

        // الملحقات والصور الشخصية
        if (includePhotoCheckbox) {
            includePhotoCheckbox.onclick = (e) => {
                state.includePhoto = e.target.checked;
                const uploadSectionDOM = document.getElementById('photo-upload-section');
                if (uploadSectionDOM) uploadSectionDOM.style.display = state.includePhoto ? "block" : "none";
                if (!state.includePhoto) {
                    state.photoUrl = "";
                    state.photoCount = 1;
                    if (photoCountInput) photoCountInput.value = 1;
                    if (photoFileInput) photoFileInput.value = "";
                    if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
                }
                saveCurrentState();
                recalculatePrice();
            };
        }

        const photoCountPlus = document.getElementById('photo-count-plus');
        const photoCountMinus = document.getElementById('photo-count-minus');
        if (photoCountPlus) {
            photoCountPlus.onclick = () => {
                state.photoCount++;
                if (photoCountInput) photoCountInput.value = state.photoCount;
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (photoCountMinus) {
            photoCountMinus.onclick = () => {
                if (state.photoCount > 1) {
                    state.photoCount--;
                    if (photoCountInput) photoCountInput.value = state.photoCount;
                    saveCurrentState();
                    recalculatePrice();
                }
            };
        }

        if (photoFileInput) {
            photoFileInput.onchange = (e) => {
                if (e.target.files[0]) uploadReferenceImage(e.target.files[0]);
            };
        }

        if (includeCardCheckbox) {
            includeCardCheckbox.onclick = (e) => {
                state.includeCard = e.target.checked;
                const cardSec = document.getElementById('card-text-section');
                if (cardSec) cardSec.style.display = state.includeCard ? "block" : "none";
                if (!state.includeCard) {
                    state.cardText = "";
                    if (cardTextInput) cardTextInput.value = "";
                }
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (cardTextInput) {
            cardTextInput.oninput = (e) => {
                state.cardText = e.target.value;
                saveCurrentState();
                recalculatePrice();
            };
        }

        // الكاش المدمج الصافي 100% بدون أي رسوم معالجة
        if (includeCashCheckbox) {
            includeCashCheckbox.onclick = (e) => {
                state.includeCash = e.target.checked;
                if (cashMasterBlock) cashMasterBlock.style.display = state.includeCash ? "block" : "none";
                if (!state.includeCash) {
                    state.moneyAmount = 0;
                    state.moneyCategoryAmount = 0;
                    if (moneyCategorySelect) moneyCategorySelect.value = "0";
                    if (cashIntegrationCounterBlock) cashIntegrationCounterBlock.style.display = "none";
                }
                saveCurrentState();
                recalculatePrice();
            };
        }

        if (moneyCategorySelect) {
            moneyCategorySelect.onchange = (e) => {
                const val = parseInt(e.target.value, 10);
                state.moneyCategoryAmount = val;
                if (val > 0) {
                    if (cashIntegrationCounterBlock) cashIntegrationCounterBlock.style.display = "block";
                    if (state.moneyAmount <= 0) state.moneyAmount = val;
                } else {
                    if (cashIntegrationCounterBlock) cashIntegrationCounterBlock.style.display = "none";
                    state.moneyAmount = 0;
                }
                if (moneyAmountDisplay) moneyAmountDisplay.value = state.moneyAmount;
                saveCurrentState();
                recalculatePrice();
            };
        }

        const billPlus = document.getElementById('bill-plus');
        const billMinus = document.getElementById('bill-minus');
        if (billPlus) {
            billPlus.onclick = () => {
                let step = state.moneyCategoryAmount || 50;
                state.moneyAmount += step;
                if (moneyAmountDisplay) moneyAmountDisplay.value = state.moneyAmount;
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (billMinus) {
            billMinus.onclick = () => {
                let step = state.moneyCategoryAmount || 50;
                if (state.moneyAmount >= step) {
                    state.moneyAmount -= step;
                    if (moneyAmountDisplay) moneyAmountDisplay.value = state.moneyAmount;
                    saveCurrentState();
                    recalculatePrice();
                }
            };
        }

        // ميزانية الشوكولاتة الصافية 100%
        if (includeChocolateCheckbox) {
            includeChocolateCheckbox.onclick = (e) => {
                state.includeChocolate = e.target.checked;
                if (chocolateBudgetMasterBlock) chocolateBudgetMasterBlock.style.display = state.includeChocolate ? "block" : "none";
                if (!state.includeChocolate) {
                    state.chocolateBudget = 0;
                    if (chocolateBudgetDisplay) chocolateBudgetDisplay.value = 0;
                }
                saveCurrentState();
                recalculatePrice();
            };
        }

        const chocBudgetPlus = document.getElementById('choc-budget-plus');
        const chocBudgetMinus = document.getElementById('choc-budget-minus');
        if (chocBudgetPlus) {
            chocBudgetPlus.onclick = () => {
                state.chocolateBudget += 50;
                if (chocolateBudgetDisplay) chocolateBudgetDisplay.value = state.chocolateBudget;
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (chocBudgetMinus) {
            chocBudgetMinus.onclick = () => {
                if (state.chocolateBudget >= 50) {
                    state.chocolateBudget -= 50;
                    if (chocolateBudgetDisplay) chocolateBudgetDisplay.value = state.chocolateBudget;
                    saveCurrentState();
                    recalculatePrice();
                }
            };
        }

        // أزرار التحكم في التصفح والـ Stepper
        if (btnNext) {
            btnNext.onclick = () => {
                if (state.currentActiveStep < state.totalSteps) {
                    state.currentActiveStep++;
                    updateActiveStepUI();
                }
            };
        }
        if (btnPrev) {
            btnPrev.onclick = () => {
                if (state.currentActiveStep > 1) {
                    state.currentActiveStep--;
                    updateActiveStepUI();
                }
            };
        }
        if (stepsIndicators.length > 0) {
            stepsIndicators.forEach(node => {
                node.onclick = function () {
                    const target = parseInt(this.getAttribute("data-step-target"), 10);
                    if (!isNaN(target)) {
                        state.currentActiveStep = target;
                        updateActiveStepUI();
                    }
                };
            });
        }

        // 🖼️👑 [كل صور محاكي الورد بقت بتفتح بملء الشاشة عند الضغط]: كان ده مقصور
        // على صور معرض سابقة الأعمال بس. دلوقتي أي صورة حقيقية في الصفحة - الصورة
        // الرئيسية فوق، صور توضيح كل خطوة، معاينة الصورة المرفوعة، وصور المعرض -
        // بتفتح بنفس المودال عن طريق تفويض حدث واحد على مستوى الصفحة، بنفس روح
        // initializeBoseLightboxGallery في cake-engine.js.
        const portfolioModal = document.getElementById('portfolio-popup-modal');
        const modalImg = document.getElementById('modal-display-img');
        const modalClose = document.getElementById('modal-close-node');

        function wireUpAllFlowerLightboxImages() {
            if (!portfolioModal || !modalImg) return;

            const openFlowerLightbox = (src) => {
                if (!src) return;
                modalImg.src = src;
                portfolioModal.style.display = "flex";
                portfolioModal.setAttribute("aria-hidden", "false");
            };
            const closeFlowerLightbox = () => {
                portfolioModal.style.display = "none";
                portfolioModal.setAttribute("aria-hidden", "true");
            };

            document.addEventListener('click', (e) => {
                const img = e.target.closest(
                    '.hero-banner-frame, .portfolio-item-card img, .bose-step-illustration-img, #photo-preview-img, #flower-giftcard-gallery img'
                );
                if (!img || !img.src) return;
                openFlowerLightbox(img.src);
            });

            if (modalClose) modalClose.onclick = closeFlowerLightbox;
            portfolioModal.onclick = function (e) {
                if (e.target === this) closeFlowerLightbox();
            };
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && portfolioModal.style.display === 'flex') closeFlowerLightbox();
            });
        }
        wireUpAllFlowerLightboxImages();

        // إضافة كائن البوكيه المعزول بداخل سلة المشتريات الموحدة
        if (addToCartBtn) {
            addToCartBtn.onclick = function () {
                if (state.isUploading) return;

                const flowerTypeName = state.flowerType === "natural" ? "ورد طبيعي نضر" : (state.flowerType === "artificial" ? "ورد صناعي فاخر" : "ورد ستان راقٍ");
                const moodLabelMap = { celebratory: "احتفالي", romantic: "رومانسي", elegant: "أنيق وبسيط" };
                // نفس شرط ظهور كارت الإهداء بالضبط المستخدم في recalculatePrice() أعلاه
                const hasGiftCardFinal = !!(state.includeCard && state.cardText.trim() !== "");

                // 🧮 [إصلاح ثغرة مالية - المرحلة 2]: أسماء الحقول هنا لازم تطابق حرفياً
                // المخطط المعتمد في core-engine.js (window.createCartItem وحارس
                // window.recalculateCartItemPrice)، وهو: cashAmount (مش moneyAmount) و
                // hasChocolate + chocolateBudget معاً. الفرق في الأسماء القديم كان السبب
                // في تصفير الكاش والشوكولاتة تلقائياً كل ما تتفتح صفحة السلة.
                const customOptionsObj = {
                    flowerType: state.flowerType,
                    flowerCount: state.flowerCount,
                    hasSatinRibbon: state.includeRibbonText,
                    satinRibbonText: state.ribbonText,
                    hasChocolate: state.includeChocolate,
                    chocolateBudget: state.includeChocolate ? state.chocolateBudget : 0,
                    cashAmount: state.moneyAmount,
                    photoCount: state.includePhoto ? state.photoCount : 0,
                    hasGiftCard: hasGiftCardFinal,
                    giftCardText: hasGiftCardFinal ? state.cardText : "",
                    flavorName: `بوكيه مخصص (${flowerTypeName})`,
                    // 🗑️ [حذف isGift]: كان مرتبط بخطوة "لنفسي/هدية" المحذوفة - راجع
                    // شرح state.totalSteps فوق. cart-engine.js لسه فيه شرط عرض
                    // `if (cd.isGift)` بس هيفضل مجرد كود ميت آمن (مش بيتفعّل) لأن
                    // الحقل ده مبقاش بيتبعت خالص من هنا.
                    moodLabel: moodLabelMap[state.mood] || ""
                };

                // 🧮 [توحيد إنشاء عنصر السلة]: استخدام window.createCartItem() الموحدة
                // بدل بناء الكائن يدوياً، بنفس الأسلوب المتبع في cake-engine.js تماماً،
                // عشان يبقى مصدر الحقيقة لبنية customDetails واحد بس في كل الموقع.
                // بننسخ المنتج (بدل التعديل المباشر) عشان منلمسش window.BoseStoreData
                // الأصلية بأي أثر جانبي.
                const dbProduct = window.BoseStoreData?.products?.find(p => p.slug === "flowers-master");
                const masterProduct = Object.assign(
                    { slug: "flowers-master", title: "الورد", basePrice: flowerConfig.basePrice },
                    dbProduct || {},
                    { type: "custom-flower" }
                );

                const finalCartItem = window.createCartItem(masterProduct, customOptionsObj, 1);

                if (!finalCartItem) return;

                // القيمة المعروضة فعلياً للعميل طول رحلة المحاكي (بكامل دقتها العشرية)
                // هي مصدر الحقيقة للسعر عند الإضافة، والحارس المركزي هيتأكد منها لاحقاً
                // عند فتح السلة عبر calculateCustomFlowerPrice بنفس المدخلات بالظبط.
                finalCartItem.finalPrice = parseFloat(state.totalPrice);
                finalCartItem.type = "custom-flower";
                finalCartItem.image = state.photoUrl || finalCartItem.image;

                let currentCart = [];
                try {
                    currentCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
                } catch (e) {
                    currentCart = [];
                }
                currentCart.push(finalCartItem);
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentCart));

                if (window.updateGlobalCartCounter) window.updateGlobalCartCounter();
                if (window.showBoseGlobalToast) window.showBoseGlobalToast("تمت إضافة المنتج إلى السلة.");

                try {
                    sessionStorage.removeItem(BASE64_IMAGE_SESSION_KEY);
                    localStorage.removeItem(FLOWER_STATE_STORAGE_KEY);
                } catch (e) {}

                setTimeout(() => {
                    window.location.href = "cart.html";
                }, 400);
            };
        }

        // تشغيل الرندرة الأولية للمحاكي فور اكتمال الربط الموضعي
        recalculatePrice();
        updateActiveStepUI();
    }

    /**
     * حارس التشغيل الآمن بالتزامن مع قاعدة البيانات الموحدة
     */
    if (window.BoseStoreData && window.BoseStoreData.store) {
        initializeFlowerEngine();
    } else {
        document.addEventListener('BoseDatabaseLoaded', () => {
            initializeFlowerEngine();
        });
    }
})();
