/**
 * المحرك البرمجي المطور والمصحح لمحاكي التورت - حلويات بوسي
 * يضمن التوافق المطلق مع قاعدة البيانات ونظام الخطوات المرن، وحماية السعر اللحظي خطوة بخطوة
 */

function startEngineLogic() {
    // 1. استدعاء وعزل عناصر واجهة المستخدم والـ DOM
    const inputPersons = document.getElementById('input-cake-persons');
    const btnMinus = document.getElementById('btn-persons-minus');
    const btnPlus = document.getElementById('btn-persons-plus');
    const alertBox = document.getElementById('alert-shape-restriction');
    const priceDisplay = document.getElementById('display-dynamic-price');
    const btnCartSubmit = document.getElementById('btn-cake-submit-cart');
    
    const btnWizardNext = document.getElementById('btn-wizard-next');
    const btnWizardPrev = document.getElementById('btn-wizard-prev');
    
    let currentActiveStep = 1; // خطوة البداية الافتراضية
    const totalWizardStepsCount = 4;

    // 2. سحب المواصفات القياسية مباشرة من الـ JSON المركزي للحفاظ على حوكمة الأسعار
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

    /**
     * دالة الحساب والتحقق اللحظي لمنع الصدمات المالية واللوجستية للعميل
     */
    function evaluateSimulatorState() {
        let currentPersons = parseInt(inputPersons.value, 10) || config.persons.minimum;
        let selectedShapeElement = document.querySelector('input[name="cake_shape"]:checked');
        let selectedShape = selectedShapeElement ? selectedShapeElement.value : 'circle';
        let selectedPrinting = document.querySelector('input[name="cake_printing"]:checked')?.value || 'none';
        
        const squareData = config.shapes.find(s => s.id === 'square') || { minimumPersons: 16 };
        const rectData = config.shapes.find(s => s.id === 'rectangle') || { minimumPersons: 20 };
        
        let alertText = "";
        
        // فحص ومطابقة القيود اللوجستية هندسياً لإرشاد العميل بنعومة
        if (selectedShape === 'square' && currentPersons < squareData.minimumPersons) {
            alertText = window.BoseStoreData?.cakeBuilder?.images?.squareMinimum || "المقاس المربع يبدأ من 16 فرد";
            // معالجة مرنة: إرجاع الاختيار للبلوك الدائري الافتراضي لمنع قفل رحلة العميل
            document.querySelector('input[name="cake_shape"][value="circle"]').checked = true;
            selectedShape = 'circle';
        } else if (selectedShape === 'rectangle' && currentPersons < rectData.minimumPersons) {
            alertText = window.BoseStoreData?.cakeBuilder?.images?.rectangleUpgrade || "عشان تطلع معاك التورتة المستطيلة مظبوطة وبأفضل تنسيق، أقل مقاس بنقدر ننفذه للشكل ده هو 20 فرد.";
            document.querySelector('input[name="cake_shape"][value="circle"]').checked = true;
            selectedShape = 'circle';
        }
        
        // إظهار التنبيه التوضيحي التعليمي للعميل ثم إخفاؤه تلقائياً لراحة العين
        if (alertText !== "") {
            alertBox.textContent = alertText;
            alertBox.style.display = "block";
            setTimeout(() => {
                alertBox.style.display = "none";
            }, 6000);
        }
        
        // حساب السعر النهائي شامل الكسور بناءً على دالة النظام الموحدة calculateCustomCakePrice
        const finalDynamicPrice = window.calculateCustomCakePrice(currentPersons, {
            printingType: selectedPrinting
        });
        
        // طلاء وتحديث لافتة الأسعار اللحظية العائمة بالمليم
        priceDisplay.textContent = `${finalDynamicPrice} جنيه`;
    }

    /**
     * دالة حوكمة حركة الخطوات وإخفاء وإظهار الألواح برمجياً (The Stepper Engine)
     */
    function syncWizardPanelsUI() {
        // إخفاء كافة الكروت والواجهات وتفعيل الكارت النشط فقط
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
        
        // التحكم في نصوص وحالات أزرار التنقل السفلية لحماية تجربة العميل
        btnWizardPrev.disabled = (currentActiveStep === 1);
        
        if (currentActiveStep === totalWizardStepsCount) {
            btnWizardNext.style.display = "none";
            btnCartSubmit.style.display = "block"; // إظهار زر الإضافة للسلة النهائي في الخطوة الأخيرة فقط حماية للمسار
        } else {
            btnWizardNext.style.display = "block";
            btnWizardNext.textContent = "التالي";
            btnCartSubmit.style.display = "none";
        }
    }

    // ربط أحداث الخطوات للتنقل الانسيابي المريح
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

    // التحكم الرقمي الميكانيكي لعداد الأفراد ومنع كسر الخطوات (Step = 2)
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

    // ربط أحداث التغيير الفورية لجميع المدخلات والراديو لضمان التحديث اللحظي المباشر
    document.querySelectorAll('input[name="cake_shape"]').forEach(radio => {
        radio.addEventListener('change', evaluateSimulatorState);
    });

    document.querySelectorAll('input[name="cake_printing"]').forEach(radio => {
        radio.addEventListener('change', evaluateSimulatorState);
    });

    /**
     * بروتوكول قفل وتثبيت السعر والترحيب الآمن بكائن الذاكرة الموحد bose_cart
     */
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

        // استدعاء دالة النظام المركزية لإنشاء عنصر السلة الموحد وتوليد المعرف الفريد [slug]-[timestamp]
        const finalCartItem = window.createCartItem(masterProduct, customOptions, 1);
        
        if (finalCartItem) {
            let localCartRaw = localStorage.getItem('bose_cart');
            let boseCart = localCartRaw ? JSON.parse(localCartRaw) : [];
            
            // قفل وتثبيت السعر الفعلي للحماية من تفاوت الكسور الحسابية لاحقاً
            finalCartItem.finalPrice = window.calculateCustomCakePrice(currentPersons, { printingType: selectedPrinting });
            finalCartItem.type = "custom-cake";
            finalCartItem.flavorName = "تصميم خاص حسب الطلب";
            
            boseCart.push(finalCartItem);
            localStorage.setItem('bose_cart', JSON.stringify(boseCart));
            
            if (typeof window.updateGlobalCartCounter === 'function') {
                window.updateGlobalCartCounter();
            }
            
            // استخدام واجهة الإشعارات الموحدة والناعمة للبراند بدلاً من تنبيهات المتصفح الجافة
            if (typeof window.showBoseGlobalToast === 'function') {
                window.showBoseGlobalToast("تمت إضافة تصميم تورتتك الفريد إلى السلة بنجاح.");
            } else {
                alert("تمت إضافة المنتج إلى السلة.");
            }
            
            // تصفير الواجهة والعودة للخطوة الأولى لراحة العميل النفسية وتجهيز طلب جديد
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

    // التشغيل والتمهيد اللحظي عند تحميل الصفحة
    syncWizardPanelsUI();
    evaluateSimulatorState();
}

// تشغيل المحرك والربط الآمن مع حارس التمهيد ومنع التعارض البرمجي للنظام
if (typeof window.onBoseDatabaseReady === 'function') {
    window.onBoseDatabaseReady(() => {
        startEngineLogic();
    });
} else {
    document.addEventListener("DOMContentLoaded", startEngineLogic);
}