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
    const totalWizardStepsCount = 4;

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

        // 🛡️ حارس إعادة ضبط التمرير لتجربة مستخدم انسيابية ومريحة
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
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
    });

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
    }

    btnCartSubmit.addEventListener('click', () => {
        let currentPersons = parseInt(inputPersons.value, 10) || config.persons.minimum;
        let selectedShape = document.querySelector('input[name="cake_shape"]:checked')?.value || 'circle';
        let selectedFlavor = document.querySelector('input[name="cake_flavor"]:checked')?.value || 'vanilla';
        let selectedPrinting = document.querySelector('input[name="cake_printing"]:checked')?.value || 'none';
        let messageText = document.getElementById('text-cake-message').value.trim();
        let allergyText = document.getElementById('text-cake-allergy').value.trim();
        
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
            flavorName: "تصميم خاص حسب الطلب"
        };

        const finalCartItem = window.createCartItem(masterProduct, customOptions, 1);
        
        if (finalCartItem) {
            let localCartRaw = localStorage.getItem('bose_cart');
            let boseCart = localCartRaw ? JSON.parse(localCartRaw) : [];
            
            finalCartItem.finalPrice = window.calculateCustomCakePrice(currentPersons, { printingType: selectedPrinting });
            finalCartItem.type = "custom-cake";
            
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