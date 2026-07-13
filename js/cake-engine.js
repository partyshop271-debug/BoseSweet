/**
 * المحرك البرمجي المطور والمصحح لمحاكي التورت - حلويات بوسي
 * يضمن التوافق المطلق مع قاعدة البيانات الموحدة site-data-final.json وحساب الأسعار لحظياً
 */

function startEngineLogic() {
    // 1. جلب عناصر الـ DOM وعزلها برمجياً لضمان أعلى أداء
    const inputPersons = document.getElementById('input-cake-persons');
    const btnMinus = document.getElementById('btn-persons-minus');
    const btnPlus = document.getElementById('btn-persons-plus');
    const alertBox = document.getElementById('alert-shape-restriction');
    const priceDisplay = document.getElementById('display-dynamic-price');
    const btnSubmit = document.getElementById('btn-cake-submit-cart');
    
    // 2. سحب البيانات الحية مباشرة من الـ JSON المركزي الموحد للحفاظ على قدسية الهيكل
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
     * دالة الحساب والتحقق اللحظي خطوة بخطوة لمنع الصدمات المالية واللوجستية للعميل
     */
    function evaluateSimulatorState() {
        let currentPersons = parseInt(inputPersons.value, 10) || config.persons.minimum;
        let selectedShapeElement = document.querySelector('input[name="cake_shape"]:checked');
        let selectedShape = selectedShapeElement ? selectedShapeElement.value : 'circle';
        let selectedPrinting = document.querySelector('input[name="cake_printing"]:checked')?.value || 'none';
        
        // جلب المحددات والقيود الهندسية للأشكال من قاعدة البيانات
        const squareData = config.shapes.find(s => s.id === 'square') || { minimumPersons: 16 };
        const rectData = config.shapes.find(s => s.id === 'rectangle') || { minimumPersons: 20 };
        
        let alertText = "";
        
        // فحص ومطابقة القيود هندسياً مع رسائل قاعدة البيانات الصارمة
        if (selectedShape === 'square' && currentPersons < squareData.minimumPersons) {
            alertText = window.BoseStoreData?.cakeBuilder?.images?.squareMinimum || "المقاس المربع يبدأ من 16 فرد";
            // معالجة ذكية: إرجاع الاختيار للدائرة تلقائياً لمنع قفل الزر وتأمين النعومة
            document.querySelector('input[name="cake_shape"][value="circle"]').checked = true;
            selectedShape = 'circle';
        } else if (selectedShape === 'rectangle' && currentPersons < rectData.minimumPersons) {
            alertText = window.BoseStoreData?.cakeBuilder?.images?.rectangleUpgrade || "عشان تطلع معاك التورتة المستطيلة مظبوطة وبأفضل تنسيق، أقل مقاس بنقدر ننفذه للشكل ده هو 20 فرد.";
            document.querySelector('input[name="cake_shape"][value="circle"]').checked = true;
            selectedShape = 'circle';
        }
        
        // إظهار رسائل الترقية التعليمية للعميل بنعومة ودون تكدس بصري
        if (alertText !== "") {
            alertBox.textContent = alertText;
            alertBox.style.display = "block";
            // تلاشي تدريجي للرسالة بعد 5 ثوانٍ لراحة عين العميل النفسية
            setTimeout(() => {
                alertBox.style.style.display = "none";
            }, 5000);
        }
        
        // استدعاء دالة الفحص المالي الموحدة والمركزية بالنظام calculateCustomCakePrice حساب الكسور كاملة
        const finalDynamicPrice = window.calculateCustomCakePrice(currentPersons, {
            printingType: selectedPrinting
        });
        
        // تحديث لافتة السعر اللحظية العائمة فوراً أمام عين العميل بالمليم
        priceDisplay.textContent = `${finalDynamicPrice} جنيه`;
    }

    // 3. التحكم المرن في عداد الأفراد الرقمي ومنع القيم السالبة أو كسر الخطوات (Step = 2)
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

    // ربط أحداث التغيير الفورية لجميع المدخلات لضمان التحديث اللحظي خطوة بخطوة
    document.querySelectorAll('input[name="cake_shape"]').forEach(radio => {
        radio.addEventListener('change', evaluateSimulatorState);
    });

    document.querySelectorAll('input[name="cake_printing"]').forEach(radio => {
        radio.addEventListener('change', evaluateSimulatorState);
    });

    /**
     * بروتوكول قفل وتثبيت السعر والترحيب الآمن بكائن الذاكرة الموحد bose_cart
     */
    btnSubmit.addEventListener('click', () => {
        let currentPersons = parseInt(inputPersons.value, 10) || config.persons.minimum;
        let selectedShape = document.querySelector('input[name="cake_shape"]:checked')?.value || 'circle';
        let selectedFlavor = document.querySelector('input[name="cake_flavor"]:checked')?.value || 'vanilla';
        let selectedPrinting = document.querySelector('input[name="cake_printing"]:checked')?.value || 'none';
        let messageText = document.getElementById('text-cake-message').value.trim();
        let allergyText = document.getElementById('text-cake-allergy').value.trim();
        
        // جلب كائن التورت الأساسي الفاخر للربط المباشر مع المصدر
        const masterProduct = window.BoseStoreData?.products?.find(p => p.slug === "toort-custom-master") || {
            slug: "toort-custom-master",
            title: "التورت",
            basePrice: config.basePrice,
            type: "custom-cake"
        };

        // صياغة تفاصيل التصميم الدقيقة والمتوافقة تماماً مع طبقة Cart DOM Layer
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
            // جلب الذاكرة المحلية الحالية وسد ثغرات التداخل
            let localCartRaw = localStorage.getItem('bose_cart');
            let boseCart = localCartRaw ? JSON.parse(localCartRaw) : [];
            
            // قفل وتثبيت السعر الفعلي للحماية من التلاعب
            finalCartItem.finalPrice = window.calculateCustomCakePrice(currentPersons, { printingType: selectedPrinting });
            finalCartItem.type = "custom-cake";
            finalCartItem.flavorName = "تصميم خاص حسب الطلب";
            
            // ضخ الكائن المخصص بالكامل في السلة ككائن فريد
            boseCart.push(finalCartItem);
            localStorage.setItem('bose_cart', JSON.stringify(boseCart));
            
            // تحديث شارة العداد اللحظي بالهيدر ديناميكياً
            if (typeof window.updateGlobalCartCounter === 'function') {
                window.updateGlobalCartCounter();
            }
            
            // رسالة تفاعلية قصيرة وراقية مأخوذة من قيم الهوية
            alert("تمت إضافة المنتج إلى السلة.");
            
            // إعادة تهيئة وتسوية الحقول ميكانيكياً بدون كركبة أو تكدس بصري
            document.getElementById('text-cake-message').value = "";
            document.getElementById('text-cake-allergy').value = "";
            inputPersons.value = config.persons.minimum;
            document.querySelector('input[name="cake_shape"][value="circle"]').checked = true;
            document.querySelector('input[name="cake_flavor"][value="vanilla"]').checked = true;
            document.querySelector('input[name="cake_printing"][value="none"]').checked = true;
            
            evaluateSimulatorState();
        }
    });

    // التمهيد والتشغيل الأولي اللحظي فور فحص حارس النظام
    evaluateSimulatorState();
}

// تشغيل المحرك والربط مع حارس التمهيد ومنع التعارض البرمجي للنظام
if (typeof window.onBoseDatabaseReady === 'function') {
    window.onBoseDatabaseReady(() => {
        startEngineLogic();
    });
} else {
    document.addEventListener("DOMContentLoaded", startEngineLogic);
}
