/**
 * المحرك البرمجي المطور والمصحح لمحاكي التورت V4.0 - حلويات بوسي
 * يضمن التوافق وحل مشكلة ثبات السكرول وإعادة توجيه الصفحة لبدايتها آلياً
 * V4.0: إضافة خطوة المناسبة (وترشيح الشكل المناسب)، صورة تصميم مطلوب تقليده،
 * كارت إهداء التورت، خطوة ملخص/مفردات نهائية، وصور المعرض/البانر ديناميكية
 * من لوحة التحكم بدل ما تكون ثابتة على شعار المتجر.
 */

function startEngineLogic() {
    const inputPersons = document.getElementById('input-cake-persons');
    const btnMinus = document.getElementById('btn-persons-minus');
    const btnPlus = document.getElementById('btn-persons-plus');
    const alertBox = document.getElementById('alert-shape-restriction');
    const priceDisplay = document.getElementById('display-dynamic-price');
    const priceLabel = document.getElementById('display-dynamic-label');
    const btnCartSubmit = document.getElementById('btn-cake-submit-cart');
    const btnCartSubmitSummary = document.getElementById('btn-cake-submit-cart-summary');

    const btnWizardNext = document.getElementById('btn-wizard-next');
    const btnWizardPrev = document.getElementById('btn-wizard-prev');

    let currentActiveStep = 1;
    const totalWizardStepsCount = 6;

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
       🖼️ [صور المحاكي الديناميكية]: البانر الرئيسي ومعرض "تورت شرفت
       عملاءنا" كانوا ثابتين على شعار المتجر مكرر 4 مرات بدون أي مكان في
       لوحة التحكم لتغييرهم - دلوقتي بيتقروا من إعدادات المحاكي
       (cakeBuilder.heroImage / cakeBuilder.portfolioGallery) اللي بقى
       ليها قسم مخصص في لوحة التحكم (builders-settings.html).
       ================================================================== */
    function renderCakeGalleryAndHero() {
        const heroImg = document.querySelector('.bose-main-hero-hook img');
        if (heroImg && config.heroImage) {
            heroImg.src = config.heroImage;
        }
        const track = document.getElementById('bose-portfolio-lightbox-track');
        if (track && Array.isArray(config.portfolioGallery) && config.portfolioGallery.length > 0) {
            track.innerHTML = config.portfolioGallery.map((item) => {
                const url = (item && item.image) || "";
                if (!url) return "";
                const alt = (item && (item.alt || item.name)) ? String(item.alt || item.name).replace(/"/g, '&quot;') : "روائع حلويات بوسي";
                return `<div class="bose-portfolio-img-node"><img src="${url}" alt="${alt}" loading="lazy"></div>`;
            }).join("");
        }
    }
    renderCakeGalleryAndHero();

    /* ==================================================================
       🎉 [خطوة المناسبة الجديدة]: بترشح شكل مناسب حسب مناسبة التورتة
       (مولود، فرح، عيد ميلاد...) - نفس فلسفة توليفات "الإحساس" تحت، لكن
       أوضح وأقرب لواقع طلبات العميل الفعلية. القائمة قابلة للتعديل من
       لوحة التحكم (cakeBuilder.occasions)، ولو فاضية بنستخدم قائمة
       احتياطية مطابقة تماماً للقيم الافتراضية في قاعدة البيانات.
       ================================================================== */
    const DEFAULT_OCCASIONS = [
        { id: "boy", name: "مولود ولد", icon: "👶💙", suggestedShape: "circle" },
        { id: "girl", name: "مولودة بنت", icon: "👶💗", suggestedShape: "heart" },
        { id: "wedding", name: "فرح وخطوبة", icon: "💍", suggestedShape: "circle" },
        { id: "birthday", name: "عيد ميلاد", icon: "🎂", suggestedShape: "circle" },
        { id: "mothers-day", name: "عيد الأم", icon: "💐", suggestedShape: "heart" },
        { id: "new-year", name: "رأس السنة", icon: "🎉", suggestedShape: "circle" }
    ];
    const occasionsList = (Array.isArray(config.occasions) && config.occasions.length > 0) ? config.occasions : DEFAULT_OCCASIONS;
    const occasionRow = document.getElementById('cake-occasion-row');
    if (occasionRow) {
        occasionRow.innerHTML = occasionsList.map((occ) => `
            <label class="bose-selection-card-label">
                <input type="radio" name="cake_occasion" value="${occ.id}" data-shape="${occ.suggestedShape || ''}" data-name="${(occ.name || '').replace(/"/g, '&quot;')}">
                <div class="bose-selection-card-inner"><span class="mood-emoji">${occ.icon || '🎂'}</span>${occ.name || ''}</div>
            </label>`).join('');
    }
    const occasionRadios = document.querySelectorAll('input[name="cake_occasion"]');
    const occasionNoteBox = document.getElementById('occasion-suggestion-note');
    const occasionNoteText = document.getElementById('occasion-suggestion-text');
    let selectedOccasionLabel = "";

    function applyOccasionPreset(radioEl) {
        selectedOccasionLabel = radioEl.getAttribute('data-name') || "";
        const suggestedShape = radioEl.getAttribute('data-shape');
        if (suggestedShape) {
            const shapeRadio = document.querySelector(`input[name="cake_shape"][value="${suggestedShape}"]`);
            if (shapeRadio) shapeRadio.checked = true;
        }
        if (occasionNoteText) {
            occasionNoteText.textContent = `اقترحنالك شكل يناسب "${selectedOccasionLabel}"، وتقدر تغيّريه بنفسك من خطوة "الشكل" لو حابة.`;
        }
        if (occasionNoteBox) occasionNoteBox.classList.add('show');
        evaluateSimulatorState();
    }
    occasionRadios.forEach((radio) => {
        radio.addEventListener('change', () => applyOccasionPreset(radio));
    });

    // 🧠 [محاكي أذكى - المرحلة 1]: توليفات مقترحة حسب "الإحساس" المطلوب (مزاج المناسبة).
    // بتحدد اقتراح شكل+نكهة بس (اختيار، مش قفل) عشان تقلل حيرة العميل اللي مش عنده
    // ذوق محدد، وتخليه يحس إن حد بيساعده يختار بدل ما يقف قدام فورم فاضي.
    const MOOD_PRESETS = {
        celebratory: { shape: "circle", flavor: "chocolate", note: "توليفة مقترحة للاحتفالات: شكل دائري كلاسيكي مع نكهة الشوكولاتة الغنية. تقدري تعدلي أي اختيار في الخطوات الجاية." },
        romantic: { shape: "heart", flavor: "half-half", note: "توليفة مقترحة للمناسبات الرومانسية: شكل قلب مع مزيج الفانيليا والشوكولاتة نصف ونصف. تقدري تعدلي أي اختيار في الخطوات الجاية." },
        elegant: { shape: "circle", flavor: "vanilla", note: "توليفة مقترحة للأناقة البسيطة: شكل دائري أنيق مع نكهة الفانيليا الكلاسيكية. تقدري تعدلي أي اختيار في الخطوات الجاية." }
    };

    const FLAVOR_SENSORY_NOTES = {
        vanilla: "فانيليا فرنسية ناعمة بقوام طري وخفيف.",
        chocolate: "شوكولاتة بلجيكية غنية بطعم عميق ومكثف.",
        "half-half": "مزيج متوازن بين نعومة الفانيليا وغنى الشوكولاتة في كل قطعة."
    };

    const purposeRadios = document.querySelectorAll('input[name="cake_purpose"]');
    const moodRadios = document.querySelectorAll('input[name="cake_mood"]');
    const moodNoteBox = document.getElementById('mood-suggestion-note');
    const moodNoteText = document.getElementById('mood-suggestion-text');
    const flavorSensoryNote = document.getElementById('flavor-sensory-note');
    const messageStepTitle = document.getElementById('message-step-title');
    const messageStepSubtitle = document.getElementById('message-step-subtitle');
    const messageFieldLabel = document.getElementById('message-field-label');
    const textCakeMessage = document.getElementById('text-cake-message');
    const btnShareDesign = document.getElementById('btn-share-design');

    function applyMoodPreset(moodValue) {
        const preset = MOOD_PRESETS[moodValue];
        if (!preset) {
            if (moodNoteBox) moodNoteBox.classList.remove('show');
            return;
        }
        const shapeRadio = document.querySelector(`input[name="cake_shape"][value="${preset.shape}"]`);
        const flavorRadio = document.querySelector(`input[name="cake_flavor"][value="${preset.flavor}"]`);
        if (shapeRadio) shapeRadio.checked = true;
        if (flavorRadio) flavorRadio.checked = true;
        if (moodNoteText) moodNoteText.textContent = preset.note;
        if (moodNoteBox) moodNoteBox.classList.add('show');
        updateFlavorSensoryNote();
    }

    function updateFlavorSensoryNote() {
        if (!flavorSensoryNote) return;
        const selectedFlavor = document.querySelector('input[name="cake_flavor"]:checked')?.value || 'vanilla';
        flavorSensoryNote.textContent = FLAVOR_SENSORY_NOTES[selectedFlavor] || "";
    }

    function updateGiftModeWording() {
        const isGift = document.querySelector('input[name="cake_purpose"]:checked')?.value === 'gift';
        if (messageStepTitle) messageStepTitle.textContent = isGift ? "اكتبي رسالة الإهداء اللي هتفرّح بيها الشخص ده:" : "لو تفضل نكتب جملة معينة على سطح التورتة:";
        if (messageStepSubtitle) messageStepSubtitle.textContent = isGift ? "كلمة حلوة من قلبك هتتكتب على التورتة، وعرفنا لو فيه أي ملاحظات حساسية طعام." : "سجل لنا العبارة أو الكلمة اللي تحب تشوفها، وعرفنا لو عندك أي ملاحظات بخصوص حساسية الطعام لضمان سلامتك الكاملة.";
        if (messageFieldLabel) messageFieldLabel.textContent = isGift ? "رسالة الإهداء:" : "تحب نكتب إيه على التورتة؟";
        if (textCakeMessage) textCakeMessage.placeholder = isGift ? "مثال: كل سنة وانتِ طيبة يا أغلى صديقة" : "مثال: عيد ميلاد سعيد يا بوسي";
    }

    moodRadios.forEach((radio) => {
        radio.addEventListener('change', () => applyMoodPreset(radio.value));
    });
    purposeRadios.forEach((radio) => {
        radio.addEventListener('change', updateGiftModeWording);
    });
    document.querySelectorAll('input[name="cake_flavor"]').forEach((radio) => {
        radio.addEventListener('change', updateFlavorSensoryNote);
    });
    updateFlavorSensoryNote();
    updateGiftModeWording();

    if (btnShareDesign) {
        btnShareDesign.addEventListener('click', () => {
            const currentPersons = parseInt(inputPersons.value, 10) || 4;
            const selectedShape = document.querySelector('input[name="cake_shape"]:checked')?.value || 'circle';
            const selectedFlavor = document.querySelector('input[name="cake_flavor"]:checked')?.value || 'vanilla';
            const shapeLabelMap = { circle: 'دائرية', heart: 'قلب', square: 'مربعة', rectangle: 'مستطيلة' };
            const flavorLabelMap = { vanilla: 'فانيليا', chocolate: 'شوكولاتة', 'half-half': 'نصف ونصف' };
            const priceNow = document.getElementById('display-dynamic-price')?.textContent || "";
            const shareText = `شوف التصميم اللي عملته لتورتة حلويات بوسي 🎂\nالشكل: ${shapeLabelMap[selectedShape] || selectedShape}\nالنكهة: ${flavorLabelMap[selectedFlavor] || selectedFlavor}\nلـ ${currentPersons} فرد\nالسعر: ${priceNow}\nإيه رأيك؟`;
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
        });
    }

    /* ==================================================================
       📐 [إشعار توضيحي دائم لمقاسات الشكل]: قبل كده كان فيه بس تنبيه
       مؤقت (6 ثواني) بيظهر لو العميل اختار شكل غير متاح لعدد الأفراد
       الحالي. دلوقتي فيه كمان ملاحظة ثابتة تحت خطوة اختيار الشكل نفسها
       بتوضح من الأول أقل عدد أفراد لكل شكل (خصوصاً المربع والمستطيل)
       قبل ما العميل يحتاج يتفاجأ بتنبيه لاحقاً.
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

    // 🛡️ [إصلاح حرج]: حالة رفع صورة الطباعة على التورتة (كانت الخانة موجودة
    // في الخطوة 3 بدون أي وسيلة فعلية لإرسال الصورة نفسها). نفس آلية الرفع
    // المستخدمة في flower-engine.js بالظبط عبر الدالة الموحّدة في supabase-client.js
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
        // لو العميل رجع اختار "بدون صور" بعد ما رفع صورة، نمسح الصورة المرفوعة
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

    /* ==================================================================
       🖼️ [صورة تصميم تورتة مطلوب تقليدها - ميزة جديدة]: مختلفة تماماً عن
       صورة "الطباعة على السطح" اللي فوق - هنا العميل بيبعت صورة تورتة
       شافها (عندنا أو في أي مكان) وعايز نقرب تصميمنا منها قد الإمكان،
       مش صورة تتطبع حرفياً على التورتة. نفس آلية الرفع الموحدة بالظبط.
       ================================================================== */
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

    /* ==================================================================
       💌 [كارت إهداء التورت - ميزة جديدة]: نفس فكرة كارت إهداء الورد
       بالظبط (كارت ورقي بيتطبع ويتقدم مع الطلب)، بسعر مستقل خاص بالتورت
       من إعدادات المحاكي (افتراضياً 30 جنيه).
       ================================================================== */
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
        
        if (priceLabel) {
            priceLabel.textContent = `سعر التورتة الحالي لـ ${currentPersons} أفراد هو:`;
        }
        
        priceDisplay.textContent = `${Math.round(finalDynamicPrice)} جنيه`;

        renderOrderSummary(currentPersons, selectedShape, selectedPrinting, hasGiftCardNow, finalDynamicPrice);
    }

    /* ==================================================================
       🧾 [خطوة الملخص الجديدة]: مفردات تفصيلية لكل بند وسعره، معروضة في
       آخر خطوة قبل زرار "إضافة للسلة" مباشرة - نفس فلسفة الفاتورة الجانبية
       في محاكي الورد (bose-invoice-addon-row) لكن كخطوة مستقلة بدل شريط
       جانبي، لأن محاكي التورت أحادي العمود.
       ================================================================== */
    function renderOrderSummary(currentPersons, selectedShape, selectedPrinting, hasGiftCardNow, grandTotal) {
        const summaryList = document.getElementById('cake-order-summary-list');
        const summaryTotalEl = document.getElementById('cake-order-summary-total');
        if (!summaryList) return;

        const shapeLabelMap = { circle: 'دائرة', heart: 'قلب', square: 'مربع', rectangle: 'مستطيل' };
        const flavorLabelMap = { vanilla: 'فانيليا', chocolate: 'شوكولاتة', 'half-half': 'نصف ونصف' };
        const selectedFlavor = document.querySelector('input[name="cake_flavor"]:checked')?.value || 'vanilla';
        const selectedOccasionEl = document.querySelector('input[name="cake_occasion"]:checked');
        const selectedPurpose = document.querySelector('input[name="cake_purpose"]:checked')?.value || 'self';

        const minPersons = config.persons.minimum;
        const extraPersons = Math.max(0, currentPersons - minPersons);
        const pricePerPerson = config.pricePerPerson || 145;

        let printingLabel = "بدون طباعة صورة";
        let printingFee = 0;
        if (selectedPrinting !== 'none') {
            const printOpt = (config.printingOptions || []).find(p => p.id === selectedPrinting);
            printingFee = printOpt ? printOpt.price : (selectedPrinting === 'edible' ? 60 : 15);
            printingLabel = selectedPrinting === 'edible' ? 'طباعة صورة صالحة للأكل' : 'طباعة صورة غير صالحة للأكل';
        }

        const rows = [
            { label: `التورتة الأساسية (${shapeLabelMap[selectedShape] || selectedShape}، ${flavorLabelMap[selectedFlavor] || selectedFlavor}) لـ ${minPersons} فرد`, value: `${config.basePrice} جنيه` }
        ];
        if (extraPersons > 0) {
            rows.push({ label: `${extraPersons} فرد إضافي × ${pricePerPerson} جنيه`, value: `+ ${extraPersons * pricePerPerson} جنيه` });
        }
        if (selectedOccasionEl) {
            rows.push({ label: `المناسبة`, value: selectedOccasionEl.getAttribute('data-name') || '' });
        }
        if (selectedPurpose === 'gift') {
            rows.push({ label: `الغرض`, value: `🎁 هدية لحد تاني` });
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
            btnCartSubmit.style.display = "block";
        } else {
            btnWizardNext.style.display = "block";
            btnWizardNext.textContent = "التالي";
            btnCartSubmit.style.display = "none";
        }

        // 🛡️ [إصلاح جذري]: كان بيرجع لأعلى الصفحة كلها (top:0) دايماً بعد "التالي"، من غير
        // مراعاة لمكان العميل الحالي ولا مكان الخطوة الجديدة، فبيحس إنه اتلخبط ورجعله للهيدر
        // بدل ما يوديه لبداية الخطوة الجاية بالظبط. دلوقتي بنمرر لبداية حاوية المحاكي نفسها
        // (بارتفاع الهيدر الثابت مطروح منه) فيوصل بالظبط لأول الخطوة الجديدة مهما كان موقعه.
        const wizardContainer = document.querySelector('.bose-simulator-layout') || activePanelToShow;
        if (wizardContainer) {
            const stickyHeaderOffset = 90; // ارتفاع الهيدر الثابت تقريباً
            const targetY = wizardContainer.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset;
            window.scrollTo({
                top: Math.max(targetY, 0),
                behavior: 'smooth'
            });
        }
    }

    btnWizardNext.addEventListener('click', () => {
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
        // 🐛 [إصلاح حرج]: toggleCakePhotoUploadSection كانت معرّفة فوق بس معندهاش
        // أي استدعاء خالص، فقسم رفع الصورة كان يفضل مخفي دايماً حتى لو العميل
        // اختار "صورة قابلة/غير قابلة للأكل" - يعني معندوش مكان فعلي يرفع فيه صورته.
        radio.addEventListener('change', toggleCakePhotoUploadSection);
    });
    // تشغيل الفحص مرة أولى عند تحميل الصفحة (لو فيه اختيار محفوظ مسبقاً)
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

        // ♿ [إصلاح وصولية]: زرار Escape كان مش شغال خالص لقفل اللايت بوكس
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
        let selectedPurpose = document.querySelector('input[name="cake_purpose"]:checked')?.value || 'self';
        let selectedMood = document.querySelector('input[name="cake_mood"]:checked')?.value || '';
        const moodLabelMap = { celebratory: 'احتفالي', romantic: 'رومانسي', elegant: 'أنيق وبسيط' };
        const wantsReplica = !!(replicaToggle && replicaToggle.checked);
        const wantsGiftCard = !!(giftCardToggle && giftCardToggle.checked);
        const giftCardText = wantsGiftCard ? (giftCardTextInput?.value || "").trim() : "";

        // 🚨🚨 [إصلاح جذري - صمام أمان ضد وصول الطلب بصورة غلط]: قبل كده لو
        // العميلة اختارت "طباعة صورة" لكن الرفع فشل أو لسه شغال، كان بيكمل
        // الطلب عادي بصورة العرض التوضيحي بدل صورتها الحقيقية من غير أي تنبيه -
        // بالظبط اللي كانت صاحبة المتجر بتشتكي منه في رسالة الواتساب. دلوقتي
        // بنوقف الإضافة للسلة فعلياً في الحالتين ونطلب منها تنتظر أو تعيد المحاولة.
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

        // 🛡️ نفس صمام الأمان بالظبط لصورة التصميم المطلوب تقليده
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
            isGift: selectedPurpose === 'gift',
            moodLabel: moodLabelMap[selectedMood] || "",
            occasionLabel: selectedOccasionLabel,
            hasReplicaDesign: wantsReplica && !!uploadedReplicaPhotoUrl,
            hasGiftCard: wantsGiftCard && giftCardText !== "",
            giftCardText: giftCardText
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

            // 🛡️ [إصلاح حرج]: صورة الطباعة والصورة المرجعية للتقليد بيتحطوا في
            // referenceImages من غير تكرار نفس الرابط مرتين لو نفس الصورة -
            // وصورة الغلاف (image) بتفضّل صورة "التقليد" لو موجودة لأنها أوضح
            // تعبيراً عن شكل التصميم النهائي المطلوب من صورة الطباعة الفردية.
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
            document.querySelector('input[name="cake_purpose"][value="self"]').checked = true;
            moodRadios.forEach((radio) => { radio.checked = false; });
            occasionRadios.forEach((radio) => { radio.checked = false; });
            selectedOccasionLabel = "";
            if (moodNoteBox) moodNoteBox.classList.remove('show');
            if (occasionNoteBox) occasionNoteBox.classList.remove('show');
            if (replicaToggle) replicaToggle.checked = false;
            if (giftCardToggle) giftCardToggle.checked = false;
            if (giftCardTextInput) giftCardTextInput.value = "";
            uploadedCakePhotoUrl = "";
            uploadedReplicaPhotoUrl = "";
            updateFlavorSensoryNote();
            updateGiftModeWording();
            toggleCakePhotoUploadSection();
            toggleReplicaUploadSection();
            toggleGiftCardSection();

            currentActiveStep = 1;
            syncWizardPanelsUI();
            evaluateSimulatorState();
        }
    }

    btnCartSubmit.addEventListener('click', submitCakeToCart);
    if (btnCartSubmitSummary) btnCartSubmitSummary.addEventListener('click', submitCakeToCart);

    syncWizardPanelsUI();
    evaluateSimulatorState();
    initializeBoseLightboxGallery();
}

// 🛡️ [إصلاح Race Condition - المرحلة 4]: window.onBoseDatabaseReady مش معرّفة
// خالص في core-engine.js (كانت موجودة بس في نسخة قديمة V3)، فالكود القديم هنا
// كان بيرجع دايماً لـ DOMContentLoaded كحل بديل، اللي ممكن يشتغل قبل ما بيانات
// المتجر توصل فعلياً فتظهر أسعار افتراضية بدل الحقيقية للحظة. الحل: نفس النمط
// المستخدم فعلاً وبنجاح في flower-engine.js - نتأكد إن window.BoseStoreData
// جاهزة فوراً، وإلا ننتظر الحدث الحقيقي اللي core-engine.js بيبعته فعلاً
// (BoseDatabaseLoaded) بدل دالة وهمية غير موجودة.
if (window.BoseStoreData && window.BoseStoreData.store) {
    startEngineLogic();
} else {
    document.addEventListener("BoseDatabaseLoaded", () => {
        startEngineLogic();
    });
            }
