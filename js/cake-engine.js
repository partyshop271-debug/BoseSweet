/**
 * المحرك البرمجي المطور والمصحح لمحاكي التورت V6.0 - حلويات بوسي
 * V6.0: إعادة بناء كاملة للخطوات - كل خطوة قرار واحد بس (11 خطوة بدل 6)،
 * حذف خطوة "لنفسي / هدية"، أرقام خطوات قابلة للّمس للقفز لأي خطوة، شرح
 * توضيحي منبثق (Popover) لكل اختيار، اختفاء الهيدر بعد الخطوة الأولى لتقليل
 * السكرول، ومشاركة تصميم التورتة عبر رابط حقيقي على الموقع نفسه بدل نص خام.
 */

function startEngineLogic() {
    const inputPersons = document.getElementById('input-cake-persons');
    const btnMinus = document.getElementById('btn-persons-minus');
    const btnPlus = document.getElementById('btn-persons-plus');
    const alertBox = document.getElementById('alert-shape-restriction');
    const btnCartSubmitSummary = document.getElementById('btn-cake-submit-cart-summary');

    const btnWizardNext = document.getElementById('btn-wizard-next');
    const btnWizardPrev = document.getElementById('btn-wizard-prev');

    let currentActiveStep = 1;
    const totalWizardStepsCount = 11;
    const OCCASION_STEP = 2;

    const config = window.BoseStoreData?.cakeBuilder || {
        basePrice: 580,
        pricePerPerson: 145,
        persons: { minimum: 4, maximum: 250, step: 2 },
        shapes: [
            { id: "circle", minimumPersons: 4 },
            { id: "heart", minimumPersons: 4 },
            { id: "square", minimumPersons: 16 },
            { id: "rectangle", minimumPersons: 20 }
        ]
    };

    /* ==================================================================
       🖼️ [صور المحاكي الديناميكية]: زي ما كان بالظبط - البانر ومعرض الإلهام
       بيتقروا من إعدادات المحاكي في لوحة التحكم.
       ================================================================== */
    function renderCakeGalleryAndHero() {
        const heroImg = document.querySelector('.bose-main-hero-hook img');
        if (heroImg && config.heroImage) {
            heroImg.src = config.heroImage;
        }
        const track = document.getElementById('bose-portfolio-lightbox-track');
        if (track) {
            if (Array.isArray(config.portfolioGallery) && config.portfolioGallery.length > 0) {
                track.innerHTML = config.portfolioGallery.map((item) => {
                    const url = (item && item.image) || "";
                    if (!url) return "";
                    const alt = (item && (item.alt || item.name)) ? String(item.alt || item.name).replace(/"/g, '&quot;') : "روائع حلويات بوسي";
                    return `<div class="bose-portfolio-img-node"><img src="${url}" alt="${alt}" loading="lazy"></div>`;
                }).join("");
            } else {
                track.innerHTML = `<p class="bose-gallery-empty-note">هنضيف هنا قريب مجموعة من أجمل التورت اللي عملناها لعملائنا 🎂</p>`;
            }
        }
    }
    renderCakeGalleryAndHero();

    /* ==================================================================
       🎉 [مناسبة التورتة]: خانة نص حرة (دلوقتي في خطوتها المستقلة رقم 2).
       ================================================================== */
    const occasionInput = document.getElementById('input-cake-occasion');
    const occasionRequiredHint = document.getElementById('occasion-required-hint');

    function getOccasionText() {
        return (occasionInput?.value || "").trim();
    }
    if (occasionInput) {
        occasionInput.addEventListener('input', () => {
            if (occasionInput.value.trim() !== "" && occasionRequiredHint) {
                occasionRequiredHint.classList.remove('show');
            }
            evaluateSimulatorState();
        });
    }

    const FLAVOR_SENSORY_NOTES = {
        vanilla: "فانيليا فرنسية ناعمة بقوام طري وخفيف.",
        chocolate: "شوكولاتة بلجيكية غنية بطعم عميق ومكثف.",
        "half-half": "مزيج متوازن بين نعومة الفانيليا وغنى الشوكولاتة في كل قطعة."
    };

    const flavorSensoryNote = document.getElementById('flavor-sensory-note');
    const btnShareDesign = document.getElementById('btn-share-design');

    function updateFlavorSensoryNote() {
        if (!flavorSensoryNote) return;
        const selectedFlavor = document.querySelector('input[name="cake_flavor"]:checked')?.value || 'vanilla';
        flavorSensoryNote.textContent = FLAVOR_SENSORY_NOTES[selectedFlavor] || "";
    }
    document.querySelectorAll('input[name="cake_flavor"]').forEach((radio) => {
        radio.addEventListener('change', updateFlavorSensoryNote);
    });
    updateFlavorSensoryNote();

    /* ==================================================================
       ℹ️ [شرح توضيحي منبثق لكل اختيار]: بوكس واحد مشترك بيتغير محتواه
       حسب أي زرار ⓘ اتضغط، بحجم مضغوط قريب لحجم الكارت (مش شاشة كاملة).
       ================================================================== */
    const INFO_CONTENT = {
        "shape-circle": { title: "دائرة 🔵", text: "الشكل الكلاسيكي الأشهر والأسهل في التوزيع على الضيوف، بيناسب كل المناسبات ومتاح من 4 أفراد." },
        "shape-heart": { title: "قلب ❤️", text: "شكل مثالي للمناسبات الرومانسية زي عيد الحب والخطوبة، بيدي إحساس شخصي ومميز، متاح من 4 أفراد." },
        "shape-square": { title: "مربع ◻️", text: "شكل عصري وأنيق بيدي تقطيع منظم ومريح للتجمعات الكبيرة، متاح من 16 فرد." },
        "shape-rectangle": { title: "مستطيل ▭", text: "الأفضل للحفلات الكبيرة والتجمعات الواسعة لأنه بيدي أكبر مساحة تقطيع، متاح من 20 فرد." },
        "flavor-vanilla": { title: "فانيليا 🌼", text: "فانيليا فرنسية ناعمة بقوام طري وخفيف - اختيار كلاسيكي بيعجب الكبير والصغير." },
        "flavor-chocolate": { title: "شوكولاتة 🍫", text: "شوكولاتة بلجيكية غنية بطعم عميق ومكثف - مثالية لعشاق الشوكولاتة الحقيقيين." },
        "flavor-half-half": { title: "نصف ونصف 🎂", text: "مزيج متوازن بين نعومة الفانيليا وغنى الشوكولاتة في كل قطعة - الأفضل لو ضيوفك أذواقهم مختلفة." },
        "printing-none": { title: "بدون صور", text: "تصميم كلاسيكي أنيق من غير طباعة أي صورة على السطح - مناسب لو حابة شكل بسيط وفخم." },
        "printing-edible": { title: "صورة قابلة للأكل 🍽️", text: "صورة حقيقية بتتطبع بحبر مصرح باستخدامه في الأطعمة وتتاكل عادي مع التورتة، بسعر إضافي 60 جنيه." },
        "printing-non-edible": { title: "صورة غير قابلة للأكل 🖼️", text: "صورة بتتطبع على شريحة بلاستيك رقيقة بتتحط فوق التورتة كديكور (متاكلش)، بسعر إضافي 15 جنيه." }
    };

    const infoBackdrop = document.getElementById('bose-info-popover-backdrop');
    const infoTitleEl = document.getElementById('bose-info-popover-title');
    const infoTextEl = document.getElementById('bose-info-popover-text');
    const infoCloseBtn = document.getElementById('bose-info-popover-close');

    function openInfoPopover(key) {
        const data = INFO_CONTENT[key];
        if (!data || !infoBackdrop) return;
        infoTitleEl.textContent = data.title;
        infoTextEl.textContent = data.text;
        infoBackdrop.classList.add('show');
    }
    function closeInfoPopover() {
        if (infoBackdrop) infoBackdrop.classList.remove('show');
    }
    if (infoCloseBtn) infoCloseBtn.addEventListener('click', closeInfoPopover);
    if (infoBackdrop) {
        infoBackdrop.addEventListener('click', (e) => { if (e.target === infoBackdrop) closeInfoPopover(); });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoBackdrop && infoBackdrop.classList.contains('show')) closeInfoPopover();
    });
    document.querySelectorAll('.bose-info-badge').forEach((badge) => {
        badge.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openInfoPopover(badge.dataset.infoKey);
        });
    });

    /* ==================================================================
       📐 [إشعار توضيحي دائم لمقاسات الشكل]
       ================================================================== */
    function renderShapeSizeNote() {
        const noteBox = document.getElementById('shape-size-permanent-note');
        if (!noteBox) return;
        const squareData = (config.shapes || []).find(s => s.id === 'square');
        const rectData = (config.shapes || []).find(s => s.id === 'rectangle');
        const squareText = config.images?.squareMinimum || (squareData ? `المقاس المربع يبدأ من ${squareData.minimumPersons} فرد` : "");
        const rectText = config.images?.rectangleMinimum || (rectData ? `المقاس المستطيل يبدأ من ${rectData.minimumPersons} فرد` : "");
        const lines = [squareText, rectText].filter(Boolean);
        if (lines.length === 0) { noteBox.style.display = 'none'; return; }
        noteBox.innerHTML = lines.map(t => `<span>📐 ${t}</span>`).join('');
        noteBox.style.display = 'flex';
    }
    renderShapeSizeNote();

    /* صورة الطباعة على التورتة */
    let uploadedCakePhotoUrl = "";
    let isUploadingCakePhoto = false;

    const cakePhotoUploadSection = document.getElementById('cake-photo-upload-section');
    const cakePhotoUploadZone = document.getElementById('bose-cake-photo-upload-zone');
    const cakePhotoFileInput = document.getElementById('cake-photo-file');
    const cakePhotoPreviewImg = document.getElementById('cake-photo-preview-img');
    const cakePhotoUploadLabel = document.getElementById('cake-photo-upload-label');

    function toggleCakePhotoUploadSection() {
        const selectedPrinting = document.querySelector('input[name="cake_printing"]:checked')?.value || 'none';
        if (cakePhotoUploadSection) {
            cakePhotoUploadSection.style.display = (selectedPrinting !== 'none') ? 'block' : 'none';
        }
        if (selectedPrinting === 'none') {
            uploadedCakePhotoUrl = "";
            if (cakePhotoPreviewImg) cakePhotoPreviewImg.style.display = 'none';
        }
    }

    if (cakePhotoUploadZone && cakePhotoFileInput) {
        cakePhotoUploadZone.addEventListener('click', () => cakePhotoFileInput.click());
        cakePhotoFileInput.addEventListener('change', async function () {
            const file = this.files && this.files[0];
            if (!file) return;
            if (!window.BoseSupabase || typeof window.BoseSupabase.uploadBoseReferenceImage !== 'function') {
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تعذر تحميل خدمة رفع الصور، حاول تحديث الصفحة.");
                }
                return;
            }
            isUploadingCakePhoto = true;
            if (cakePhotoUploadLabel) cakePhotoUploadLabel.textContent = "بيتم رفع الصورة الآن...";
            try {
                uploadedCakePhotoUrl = await window.BoseSupabase.uploadBoseReferenceImage(file, (txt) => {
                    if (cakePhotoUploadLabel) cakePhotoUploadLabel.textContent = txt;
                });
                if (cakePhotoPreviewImg) {
                    cakePhotoPreviewImg.src = uploadedCakePhotoUrl;
                    cakePhotoPreviewImg.style.display = 'block';
                }
                if (cakePhotoUploadLabel) cakePhotoUploadLabel.textContent = "تم رفع الصورة بنجاح ✓ (اضغط لتغييرها)";
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تم رفع صورتك بنجاح! ✨");
                }
            } catch (err) {
                uploadedCakePhotoUrl = "";
                if (cakePhotoUploadLabel) cakePhotoUploadLabel.textContent = "فشل الرفع، اضغط للمحاولة مرة أخرى";
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تعذر رفع الصورة، تأكدي من الاتصال بالإنترنت وحاولي تاني.");
                }
            } finally {
                isUploadingCakePhoto = false;
            }
        });
    }

    /* صورة تصميم مطلوب تقليده */
    let uploadedReplicaPhotoUrl = "";
    let isUploadingReplicaPhoto = false;

    const replicaToggle = document.getElementById('cake-replica-toggle');
    const replicaUploadSection = document.getElementById('cake-replica-upload-section');
    const replicaUploadZone = document.getElementById('bose-cake-replica-upload-zone');
    const replicaFileInput = document.getElementById('cake-replica-file');
    const replicaPreviewImg = document.getElementById('cake-replica-preview-img');
    const replicaUploadLabel = document.getElementById('cake-replica-upload-label');

    function toggleReplicaUploadSection() {
        const isChecked = !!(replicaToggle && replicaToggle.checked);
        if (replicaUploadSection) replicaUploadSection.style.display = isChecked ? 'block' : 'none';
        if (!isChecked) {
            uploadedReplicaPhotoUrl = "";
            if (replicaPreviewImg) replicaPreviewImg.style.display = 'none';
        }
    }
    if (replicaToggle) {
        replicaToggle.addEventListener('change', toggleReplicaUploadSection);
    }
    if (replicaUploadZone && replicaFileInput) {
        replicaUploadZone.addEventListener('click', () => replicaFileInput.click());
        replicaFileInput.addEventListener('change', async function () {
            const file = this.files && this.files[0];
            if (!file) return;
            if (!window.BoseSupabase || typeof window.BoseSupabase.uploadBoseReferenceImage !== 'function') {
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تعذر تحميل خدمة رفع الصور، حاول تحديث الصفحة.");
                }
                return;
            }
            isUploadingReplicaPhoto = true;
            if (replicaUploadLabel) replicaUploadLabel.textContent = "بيتم رفع الصورة الآن...";
            try {
                uploadedReplicaPhotoUrl = await window.BoseSupabase.uploadBoseReferenceImage(file, (txt) => {
                    if (replicaUploadLabel) replicaUploadLabel.textContent = txt;
                });
                if (replicaPreviewImg) {
                    replicaPreviewImg.src = uploadedReplicaPhotoUrl;
                    replicaPreviewImg.style.display = 'block';
                }
                if (replicaUploadLabel) replicaUploadLabel.textContent = "تم رفع الصورة بنجاح ✓ (اضغط لتغييرها)";
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تم رفع صورة التصميم بنجاح! ✨");
                }
            } catch (err) {
                uploadedReplicaPhotoUrl = "";
                if (replicaUploadLabel) replicaUploadLabel.textContent = "فشل الرفع، اضغط للمحاولة مرة أخرى";
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تعذر رفع الصورة، تأكدي من الاتصال بالإنترنت وحاولي تاني.");
                }
            } finally {
                isUploadingReplicaPhoto = false;
            }
        });
    }

    /* كارت إهداء التورت */
    const giftCardToggle = document.getElementById('cake-giftcard-toggle');
    const giftCardTextSection = document.getElementById('cake-giftcard-text-section');
    const giftCardTextInput = document.getElementById('cake-giftcard-text');
    const giftCardPriceNote = document.getElementById('cake-giftcard-price-note');
    const cakeGiftCardPrice = parseFloat(config.giftCard?.price) || 30;

    if (giftCardPriceNote) {
        giftCardPriceNote.innerHTML = `<p class="bose-embedded-price-text">سعر إضافة وطباعة كارت الإهداء الفخم هو <span>${cakeGiftCardPrice} جنيه</span></p>`;
    }
    function toggleGiftCardSection() {
        const isChecked = !!(giftCardToggle && giftCardToggle.checked);
        if (giftCardTextSection) giftCardTextSection.style.display = isChecked ? 'block' : 'none';
        evaluateSimulatorState();
    }
    if (giftCardToggle) {
        giftCardToggle.addEventListener('change', toggleGiftCardSection);
    }
    if (giftCardTextInput) {
        giftCardTextInput.addEventListener('input', evaluateSimulatorState);
    }

    function evaluateSimulatorState() {
        let currentPersons = parseInt(inputPersons.value, 10) || config.persons.minimum;
        let selectedShapeElement = document.querySelector('input[name="cake_shape"]:checked');
        let selectedShape = selectedShapeElement ? selectedShapeElement.value : 'circle';
        let selectedPrinting = document.querySelector('input[name="cake_printing"]:checked')?.value || 'none';
        const hasGiftCardNow = !!(giftCardToggle && giftCardToggle.checked && giftCardTextInput && giftCardTextInput.value.trim() !== "");

        const squareData = config.shapes.find(s => s.id === 'square') || { minimumPersons: 16 };
        const rectData = config.shapes.find(s => s.id === 'rectangle') || { minimumPersons: 20 };

        let alertText = "";

        if (selectedShape === 'square' && currentPersons < squareData.minimumPersons) {
            alertText = window.BoseStoreData?.cakeBuilder?.images?.squareMinimum || "المقاس المربع يبدأ من 16 فرد";
            document.querySelector('input[name="cake_shape"][value="circle"]').checked = true;
            selectedShape = 'circle';
        } else if (selectedShape === 'rectangle' && currentPersons < rectData.minimumPersons) {
            alertText = window.BoseStoreData?.cakeBuilder?.images?.rectangleUpgrade || "عشان تطلع معاك التورتة المستطيلة مظبوطة وبأفضل تنسيق، أقل مقاس بنقدر ننفذه للشكل ده هو 20 فرد.";
            document.querySelector('input[name="cake_shape"][value="circle"]').checked = true;
            selectedShape = 'circle';
        }

        if (alertText !== "") {
            alertBox.textContent = alertText;
            alertBox.style.display = "block";
            setTimeout(() => {
                alertBox.style.display = "none";
            }, 6000);
        }

        const finalDynamicPrice = window.calculateCustomCakePrice(currentPersons, {
            printingType: selectedPrinting,
            hasGiftCard: hasGiftCardNow
        });

        renderOrderSummary(currentPersons, selectedShape, selectedPrinting, hasGiftCardNow, finalDynamicPrice);
    }

    function buildDesignSnapshot(currentPersons, selectedShape, selectedPrinting, hasGiftCardNow, grandTotal) {
        const shapeLabelMap = { circle: 'دائرة', heart: 'قلب', square: 'مربع', rectangle: 'مستطيل' };
        const flavorLabelMap = { vanilla: 'فانيليا', chocolate: 'شوكولاتة', 'half-half': 'نصف ونصف' };
        const printingLabelMap = { none: 'بدون طباعة صورة', edible: 'طباعة صورة صالحة للأكل', 'non-edible': 'طباعة صورة غير صالحة للأكل' };
        const selectedFlavor = document.querySelector('input[name="cake_flavor"]:checked')?.value || 'vanilla';
        const messageText = document.getElementById('text-cake-message')?.value.trim() || "";
        const allergyText = document.getElementById('text-cake-allergy')?.value.trim() || "";
        const occasionText = getOccasionText();

        return {
            shapeLabel: shapeLabelMap[selectedShape] || selectedShape,
            flavorLabel: flavorLabelMap[selectedFlavor] || selectedFlavor,
            persons: currentPersons,
            occasion: occasionText,
            printingLabel: printingLabelMap[selectedPrinting] || printingLabelMap.none,
            printImageUrl: (selectedPrinting !== 'none') ? uploadedCakePhotoUrl : "",
            replicaImageUrl: uploadedReplicaPhotoUrl || "",
            message: messageText,
            hasGiftCard: hasGiftCardNow,
            price: Math.round(grandTotal),
            createdAt: new Date().toISOString()
        };
    }

    let lastKnownSnapshot = null;

    function renderOrderSummary(currentPersons, selectedShape, selectedPrinting, hasGiftCardNow, grandTotal) {
        const summaryList = document.getElementById('cake-order-summary-list');
        const summaryTotalEl = document.getElementById('cake-order-summary-total');
        if (!summaryList) return;

        const shapeLabelMap = { circle: 'دائرة', heart: 'قلب', square: 'مربع', rectangle: 'مستطيل' };
        const flavorLabelMap = { vanilla: 'فانيليا', chocolate: 'شوكولاتة', 'half-half': 'نصف ونصف' };
        const selectedFlavor = document.querySelector('input[name="cake_flavor"]:checked')?.value || 'vanilla';
        const occasionText = getOccasionText();

        const minPersons = config.persons.minimum;
        const pricePerPerson = config.pricePerPerson || 145;
        const sizePortionPrice = config.basePrice + (Math.max(0, currentPersons - minPersons) * pricePerPerson);

        let printingLabel = "بدون طباعة صورة";
        let printingFee = 0;
        if (selectedPrinting !== 'none') {
            const printOpt = (config.printingOptions || []).find(p => p.id === selectedPrinting);
            printingFee = printOpt ? printOpt.price : (selectedPrinting === 'edible' ? 60 : 15);
            printingLabel = selectedPrinting === 'edible' ? 'طباعة صورة صالحة للأكل' : 'طباعة صورة غير صالحة للأكل';
        }

        const rows = [
            { label: `تورتة ${shapeLabelMap[selectedShape] || selectedShape} بنكهة ${flavorLabelMap[selectedFlavor] || selectedFlavor} لـ ${currentPersons} فرد`, value: `${Math.round(sizePortionPrice)} جنيه` }
        ];
        if (occasionText) {
            rows.push({ label: `المناسبة`, value: occasionText });
        }
        if (selectedPrinting !== 'none') {
            rows.push({ label: printingLabel, value: `+ ${printingFee} جنيه` });
        }
        if (replicaToggle && replicaToggle.checked) {
            rows.push({ label: `صورة تصميم مرفقة لتقريب الشكل`, value: uploadedReplicaPhotoUrl ? `✓ تم الإرفاق` : `لسه محتاجة ترفعي الصورة` });
        }
        if (hasGiftCardNow) {
            rows.push({ label: `كارت إهداء مطبوع`, value: `+ ${cakeGiftCardPrice} جنيه` });
        }

        summaryList.innerHTML = rows.map(r => `<div class="price-item-row"><span>${r.label}:</span><span class="item-value">${r.value}</span></div>`).join('');
        if (summaryTotalEl) summaryTotalEl.textContent = `${Math.round(grandTotal)} جنيه`;

        lastKnownSnapshot = buildDesignSnapshot(currentPersons, selectedShape, selectedPrinting, hasGiftCardNow, grandTotal);
    }

    /* ==================================================================
       🔗 [مشاركة التصميم عبر رابط الموقع]: بدل ما كنا بنبعت نص خام على
       واتساب، دلوقتي بنحفظ لقطة من التصميم في قاعدة البيانات عبر RPC آمن،
       ونبني رابط design-view.html?id=... بيفتح صفحة على الموقع نفسه فيها
       كل تفاصيل الطلب - أي حد يفتح الرابط يشوف التصميم من غير ما يقدر
       يشوف تصاميم عملاء تانيين.
       ================================================================== */
    if (btnShareDesign) {
        btnShareDesign.addEventListener('click', async () => {
            if (!window.BoseSupabase || typeof window.BoseSupabase.createSharedCakeDesign !== 'function') {
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تعذر تجهيز رابط المشاركة الآن، حاولي تحديث الصفحة.");
                }
                return;
            }
            const originalLabel = btnShareDesign.innerHTML;
            btnShareDesign.disabled = true;
            btnShareDesign.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> بنجهز رابط التصميم...';
            try {
                const snapshot = lastKnownSnapshot || {};
                const newId = await window.BoseSupabase.createSharedCakeDesign(snapshot);
                if (!newId) throw new Error("no id returned");
                const shareUrl = `${window.location.origin}${window.location.pathname.replace('cake-builder.html', 'design-view.html')}?id=${newId}`;
                const shareText = `شوف تصميم التورتة اللي عملتهولك من حلويات بوسي 🎂\n${shareUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
            } catch (err) {
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تعذر تجهيز رابط المشاركة الآن، حاولي مرة أخرى.");
                }
            } finally {
                btnShareDesign.disabled = false;
                btnShareDesign.innerHTML = originalLabel;
            }
        });
    }

    /* ==================================================================
       🧭 [إخفاء الهيدر بعد الخطوة الأولى]: البانر الكبير ومقدمة الصفحة
       بيختفوا بمجرد ما العميلة تتعدى الخطوة الأولى، عشان يوفروا مساحة
       فعلية على الشاشة لباقي الخطوات - ويرجعوا يظهروا لو رجعت لخطوة 1.
       ================================================================== */
    const heroEl = document.getElementById('bose-cake-hero');
    const introEl = document.getElementById('bose-cake-intro');
    function toggleHeroVisibilityForStep() {
        const shouldCollapse = currentActiveStep !== 1;
        if (heroEl) heroEl.classList.toggle('bose-collapsed-hero', shouldCollapse);
        if (introEl) introEl.classList.toggle('bose-collapsed-hero', shouldCollapse);
    }

    function syncWizardPanelsUI() {
        for (let i = 1; i <= totalWizardStepsCount; i++) {
            const panel = document.getElementById(`panel-wizard-step-${i}`);
            const node = document.getElementById(`node-step-${i}`);

            if (panel) panel.classList.remove('active-panel');
            if (node) {
                node.classList.remove('active', 'done');
                if (i === currentActiveStep) node.classList.add('active');
                else if (i < currentActiveStep) node.classList.add('done');
            }
        }

        const activePanelToShow = document.getElementById(`panel-wizard-step-${currentActiveStep}`);
        if (activePanelToShow) activePanelToShow.classList.add('active-panel');

        btnWizardPrev.disabled = (currentActiveStep === 1);

        if (currentActiveStep === totalWizardStepsCount) {
            btnWizardNext.style.display = "none";
        } else {
            btnWizardNext.style.display = "block";
            btnWizardNext.textContent = "التالي";
        }

        toggleHeroVisibilityForStep();

        // إبقاء الرقم النشط ظاهر جوه شريط الخطوات القابل للسكرول الأفقي
        const activeNode = document.getElementById(`node-step-${currentActiveStep}`);
        if (activeNode && typeof activeNode.scrollIntoView === 'function') {
            activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }

        const wizardContainer = document.querySelector('.bose-simulator-layout') || activePanelToShow;
        if (wizardContainer) {
            const stickyHeaderOffset = 90;
            const targetY = wizardContainer.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset;
            window.scrollTo({
                top: Math.max(targetY, 0),
                behavior: 'smooth'
            });
        }
    }

    // 🛡️ [تحقق قبل الانتقال]: خطوة المناسبة (رقم 2) لازم تتكتب قبل الاستمرار
    function validateCurrentStepBeforeAdvance() {
        if (currentActiveStep === OCCASION_STEP) {
            if (getOccasionText() === "") {
                if (occasionRequiredHint) occasionRequiredHint.classList.add('show');
                if (occasionInput) {
                    occasionInput.focus();
                    occasionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("محتاجين نعرف مناسبة التورتة الأول عشان نقدر نكمل معاكِ 🎂");
                }
                return false;
            }
        }
        return true;
    }

    btnWizardNext.addEventListener('click', () => {
        if (!validateCurrentStepBeforeAdvance()) return;
        if (currentActiveStep < totalWizardStepsCount) {
            currentActiveStep++;
            syncWizardPanelsUI();
            evaluateSimulatorState();
        }
    });

    btnWizardPrev.addEventListener('click', () => {
        if (currentActiveStep > 1) {
            currentActiveStep--;
            syncWizardPanelsUI();
            evaluateSimulatorState();
        }
    });

    /* ==================================================================
       🔢 [أرقام الخطوات القابلة للّمس]: أي رقم بتضغطي عليه بيوديكي
       للخطوة دي على طول - ما عدا لو المناسبة (خطوة 2) لسه فاضية ومحاولة
       تقفزي لخطوة بعدها، وقتها بنرجعك تكمليها الأول.
       ================================================================== */
    function jumpToStep(targetStep) {
        if (targetStep === currentActiveStep) return;
        if (targetStep > OCCASION_STEP && getOccasionText() === "") {
            currentActiveStep = OCCASION_STEP;
            syncWizardPanelsUI();
            if (occasionRequiredHint) occasionRequiredHint.classList.add('show');
            if (occasionInput) occasionInput.focus();
            if (typeof window.showBoseGlobalToast === 'function') {
                window.showBoseGlobalToast("محتاجين نعرف مناسبة التورتة الأول قبل ما تكملي باقي الاختيارات 🎂");
            }
            return;
        }
        currentActiveStep = targetStep;
        syncWizardPanelsUI();
        evaluateSimulatorState();
    }

    document.querySelectorAll('.bose-progress-node').forEach((node, idx) => {
        const stepNum = idx + 1;
        node.setAttribute('role', 'button');
        node.setAttribute('tabindex', '0');
        node.setAttribute('aria-label', `الذهاب للخطوة ${stepNum}`);
        node.addEventListener('click', () => jumpToStep(stepNum));
        node.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                jumpToStep(stepNum);
            }
        });
    });

    btnMinus.addEventListener('click', () => {
        let current = parseInt(inputPersons.value, 10) || config.persons.minimum;
        if (current > config.persons.minimum) {
            inputPersons.value = current - config.persons.step;
            evaluateSimulatorState();
        }
    });

    btnPlus.addEventListener('click', () => {
        let current = parseInt(inputPersons.value, 10) || config.persons.minimum;
        if (current < config.persons.maximum) {
            inputPersons.value = current + config.persons.step;
            evaluateSimulatorState();
        }
    });

    document.querySelectorAll('input[name="cake_shape"]').forEach(radio => {
        radio.addEventListener('change', evaluateSimulatorState);
    });

    document.querySelectorAll('input[name="cake_printing"]').forEach(radio => {
        radio.addEventListener('change', evaluateSimulatorState);
        radio.addEventListener('change', toggleCakePhotoUploadSection);
    });
    toggleCakePhotoUploadSection();
    toggleReplicaUploadSection();

    function initializeBoseLightboxGallery() {
        const track = document.getElementById('bose-portfolio-lightbox-track');
        const lightboxOverlay = document.getElementById('bose-lightbox-container');
        const lightboxImg = document.getElementById('bose-lightbox-img');
        const lightboxClose = document.getElementById('bose-lightbox-close-btn');

        if (!track || !lightboxOverlay || !lightboxImg) return;

        track.addEventListener('click', (e) => {
            const clickedImg = e.target.closest('img');
            if (clickedImg) {
                lightboxImg.src = clickedImg.src;
                lightboxOverlay.style.display = "flex";
            }
        });

        const closeLightbox = () => { lightboxOverlay.style.display = "none"; lightboxImg.src = ""; };
        if (lightboxClose) lightboxClose.onclick = closeLightbox;
        lightboxOverlay.onclick = (e) => { if (e.target === lightboxOverlay) closeLightbox(); };

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightboxOverlay.style.display === 'flex') closeLightbox();
        });
    }

    function submitCakeToCart() {
        let currentPersons = parseInt(inputPersons.value, 10) || config.persons.minimum;
        let selectedShape = document.querySelector('input[name="cake_shape"]:checked')?.value || 'circle';
        let selectedFlavor = document.querySelector('input[name="cake_flavor"]:checked')?.value || 'vanilla';
        let selectedPrinting = document.querySelector('input[name="cake_printing"]:checked')?.value || 'none';
        let messageText = document.getElementById('text-cake-message').value.trim();
        let allergyText = document.getElementById('text-cake-allergy').value.trim();
        const occasionText = getOccasionText();
        const wantsReplica = !!(replicaToggle && replicaToggle.checked);
        const wantsGiftCard = !!(giftCardToggle && giftCardToggle.checked);
        const giftCardText = wantsGiftCard ? (giftCardTextInput?.value || "").trim() : "";

        if (occasionText === "") {
            currentActiveStep = OCCASION_STEP;
            syncWizardPanelsUI();
            if (occasionRequiredHint) occasionRequiredHint.classList.add('show');
            if (occasionInput) occasionInput.focus();
            if (typeof window.showBoseGlobalToast === 'function') {
                window.showBoseGlobalToast("محتاجين نعرف مناسبة التورتة الأول عشان نقدر نكمل معاكِ 🎂");
            }
            return;
        }

        if (selectedPrinting !== 'none') {
            if (isUploadingCakePhoto) {
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("لسه بيتم رفع صورتك، استني ثواني وبعدين اضغطي إضافة للسلة.");
                }
                return;
            }
            if (!uploadedCakePhotoUrl) {
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("من فضلك ارفعي صورة التصميم المطلوب طباعته على التورتة أولاً.");
                }
                if (cakePhotoUploadZone) cakePhotoUploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }

        if (wantsReplica) {
            if (isUploadingReplicaPhoto) {
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("لسه بيتم رفع صورة التصميم، استني ثواني وبعدين اضغطي إضافة للسلة.");
                }
                return;
            }
            if (!uploadedReplicaPhotoUrl) {
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("من فضلك ارفعي صورة التورتة اللي عايزة نقرب تصميمك منها أولاً.");
                }
                if (replicaUploadZone) replicaUploadZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }

        if (wantsGiftCard && giftCardText === "") {
            if (typeof window.showBoseGlobalToast === 'function') {
                window.showBoseGlobalToast("من فضلك اكتبي الكلام اللي حابة نكتبه على كارت الإهداء.");
            }
            if (giftCardTextInput) giftCardTextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const masterProduct = window.BoseStoreData?.products?.find(p => p.slug === "toort-custom-master") || {
            slug: "toort-custom-master",
            title: "التورت",
            basePrice: config.basePrice,
            type: "custom-cake"
        };

        const customOptions = {
            cakeType: selectedFlavor === 'vanilla' ? 'فانيليا' : (selectedFlavor === 'chocolate' ? 'شوكولاتة' : 'نصف ونصف'),
            shape: selectedShape,
            persons: currentPersons,
            printingType: selectedPrinting,
            customMessage: messageText,
            allergyNote: allergyText,
            flavorName: "تصميم خاص حسب الطلب",
            occasionLabel: occasionText,
            hasReplicaDesign: wantsReplica && !!uploadedReplicaPhotoUrl,
            hasGiftCard: wantsGiftCard && giftCardText !== "",
            giftCardText: giftCardText,
            printImageUrl: (selectedPrinting !== 'none') ? uploadedCakePhotoUrl : "",
            replicaImageUrl: (wantsReplica && uploadedReplicaPhotoUrl) ? uploadedReplicaPhotoUrl : ""
        };

        const finalCartItem = window.createCartItem(masterProduct, customOptions, 1);

        if (finalCartItem) {
            let localCartRaw = localStorage.getItem('bose_cart');
            let boseCart = localCartRaw ? JSON.parse(localCartRaw) : [];

            finalCartItem.finalPrice = window.calculateCustomCakePrice(currentPersons, {
                printingType: selectedPrinting,
                hasGiftCard: customOptions.hasGiftCard
            });
            finalCartItem.type = "custom-cake";

            const refImages = [];
            if (customOptions.hasReplicaDesign && uploadedReplicaPhotoUrl) refImages.push(uploadedReplicaPhotoUrl);
            if (selectedPrinting !== 'none' && uploadedCakePhotoUrl && uploadedCakePhotoUrl !== uploadedReplicaPhotoUrl) refImages.push(uploadedCakePhotoUrl);
            if (refImages.length > 0) {
                finalCartItem.image = refImages[0];
                finalCartItem.referenceImages = refImages;
            }

            boseCart.push(finalCartItem);
            localStorage.setItem('bose_cart', JSON.stringify(boseCart));

            if (typeof window.updateGlobalCartCounter === 'function') {
                window.updateGlobalCartCounter();
            }

            if (typeof window.showBoseGlobalToast === 'function') {
                window.showBoseGlobalToast("تمت إضافة تصميم تورتتك الفريد إلى السلة بنجاح.");
            } else {
                alert("تمت إضافة المنتج إلى السلة.");
            }

            document.getElementById('text-cake-message').value = "";
            document.getElementById('text-cake-allergy').value = "";
            inputPersons.value = config.persons.minimum;
            document.querySelector('input[name="cake_shape"][value="circle"]').checked = true;
            document.querySelector('input[name="cake_flavor"][value="vanilla"]').checked = true;
            document.querySelector('input[name="cake_printing"][value="none"]').checked = true;
            if (occasionInput) occasionInput.value = "";
            if (occasionRequiredHint) occasionRequiredHint.classList.remove('show');
            if (replicaToggle) replicaToggle.checked = false;
            if (giftCardToggle) giftCardToggle.checked = false;
            if (giftCardTextInput) giftCardTextInput.value = "";
            uploadedCakePhotoUrl = "";
            uploadedReplicaPhotoUrl = "";
            updateFlavorSensoryNote();
            toggleCakePhotoUploadSection();
            toggleReplicaUploadSection();
            toggleGiftCardSection();

            currentActiveStep = 1;
            syncWizardPanelsUI();
            evaluateSimulatorState();
        }
    }

    if (btnCartSubmitSummary) btnCartSubmitSummary.addEventListener('click', submitCakeToCart);

    syncWizardPanelsUI();
    evaluateSimulatorState();
    initializeBoseLightboxGallery();
}

if (window.BoseStoreData && window.BoseStoreData.store) {
    startEngineLogic();
} else {
    document.addEventListener("BoseDatabaseLoaded", () => {
        startEngineLogic();
    });
}
