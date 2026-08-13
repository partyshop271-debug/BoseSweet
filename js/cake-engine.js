/**
 * المحرك البرمجي المطور والمصحح لمحاكي التورت V3.8 - حلويات بوسي
 * يضمن التوافق وحل مشكلة ثبات السكرول وإعادة توجيه الصفحة لبدايتها آلياً
 */

function startEngineLogic() {
    const inputPersons = document.getElementById('input-cake-persons');
    const btnMinus = document.getElementById('btn-persons-minus');
    const btnPlus = document.getElementById('btn-persons-plus');
    const alertBox = document.getElementById('alert-shape-restriction');
    const priceDisplay = document.getElementById('display-dynamic-price');
    const priceLabel = document.getElementById('display-dynamic-label');
    const btnCartSubmit = document.getElementById('btn-cake-submit-cart');
    
    const btnWizardNext = document.getElementById('btn-wizard-next');
    const btnWizardPrev = document.getElementById('btn-wizard-prev');
    
    let currentActiveStep = 1;
    const totalWizardStepsCount = 5;

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
    const printingDesignerNote = document.getElementById('printing-designer-note');
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
        const printingDesignerNoteEl = document.getElementById('printing-designer-note');
        if (printingDesignerNoteEl) {
            printingDesignerNoteEl.classList.toggle('show', selectedPrinting === 'none');
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

    function evaluateSimulatorState() {
        let currentPersons = parseInt(inputPersons.value, 10) || config.persons.minimum;
        let selectedShapeElement = document.querySelector('input[name="cake_shape"]:checked');
        let selectedShape = selectedShapeElement ? selectedShapeElement.value : 'circle';
        let selectedPrinting = document.querySelector('input[name="cake_printing"]:checked')?.value || 'none';
        
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
            printingType: selectedPrinting
        });
        
        if (priceLabel) {
            priceLabel.textContent = `سعر التورتة الحالي لـ ${currentPersons} أفراد هو:`;
        }
        
        priceDisplay.textContent = `${Math.round(finalDynamicPrice)} جنيه`;
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

    btnCartSubmit.addEventListener('click', () => {
        let currentPersons = parseInt(inputPersons.value, 10) || config.persons.minimum;
        let selectedShape = document.querySelector('input[name="cake_shape"]:checked')?.value || 'circle';
        let selectedFlavor = document.querySelector('input[name="cake_flavor"]:checked')?.value || 'vanilla';
        let selectedPrinting = document.querySelector('input[name="cake_printing"]:checked')?.value || 'none';
        let messageText = document.getElementById('text-cake-message').value.trim();
        let allergyText = document.getElementById('text-cake-allergy').value.trim();
        let selectedPurpose = document.querySelector('input[name="cake_purpose"]:checked')?.value || 'self';
        let selectedMood = document.querySelector('input[name="cake_mood"]:checked')?.value || '';
        const moodLabelMap = { celebratory: 'احتفالي', romantic: 'رومانسي', elegant: 'أنيق وبسيط' };

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
            moodLabel: moodLabelMap[selectedMood] || ""
        };

        const finalCartItem = window.createCartItem(masterProduct, customOptions, 1);
        
        if (finalCartItem) {
            let localCartRaw = localStorage.getItem('bose_cart');
            let boseCart = localCartRaw ? JSON.parse(localCartRaw) : [];
            
            finalCartItem.finalPrice = window.calculateCustomCakePrice(currentPersons, { printingType: selectedPrinting });
            finalCartItem.type = "custom-cake";

            // 🛡️ [إصلاح حرج]: صورة الطباعة اللي العميل رفعها (uploadedCakePhotoUrl)
            // كانت بتتستخدم بس في المعاينة على الصفحة ومش بتتحط في عنصر السلة خالص،
            // فالطلب كان بيوصل من غير الصورة تماماً لو العميل اختار طباعة صورة على
            // التورتة. نفس آلية flower-engine.js بالظبط (finalCartItem.image).
            if (selectedPrinting !== 'none' && uploadedCakePhotoUrl) {
                finalCartItem.image = uploadedCakePhotoUrl;
                finalCartItem.referenceImages = [uploadedCakePhotoUrl];
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
            if (moodNoteBox) moodNoteBox.classList.remove('show');
            updateFlavorSensoryNote();
            updateGiftModeWording();
            toggleCakePhotoUploadSection();

            currentActiveStep = 1;
            syncWizardPanelsUI();
            evaluateSimulatorState();
        }
    });

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